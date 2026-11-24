import JSZip from 'jszip';

export interface SheetImage {
  /** 圖片左上角所在的列號（0 起算，與 Excel 實際列號 -1 相同） */
  row: number;
  /** 壓縮後的 JPEG dataURL */
  dataUrl: string;
}

const MAX_WIDTH = 1000;
const JPEG_QUALITY = 0.75;

const parseXml = (text: string): Document => new DOMParser().parseFromString(text, 'application/xml');

/** 依目前檔案路徑解析 .rels 內的相對路徑 */
const resolvePath = (baseFile: string, target: string): string => {
  if (target.startsWith('/')) return target.replace(/^\/+/, '');
  const parts = baseFile.split('/');
  parts.pop();
  for (const seg of target.split('/')) {
    if (seg === '..') parts.pop();
    else if (seg !== '.' && seg !== '') parts.push(seg);
  }
  return parts.join('/');
};

const relsPathOf = (file: string): string => {
  const i = file.lastIndexOf('/');
  return `${file.slice(0, i)}/_rels/${file.slice(i + 1)}.rels`;
};

const readRels = async (zip: JSZip, file: string): Promise<Record<string, string>> => {
  const f = zip.file(relsPathOf(file));
  const map: Record<string, string> = {};
  if (!f) return map;
  const doc = parseXml(await f.async('string'));
  Array.from(doc.getElementsByTagName('Relationship')).forEach(rel => {
    const id = rel.getAttribute('Id');
    const target = rel.getAttribute('Target');
    if (id && target) map[id] = resolvePath(file, target);
  });
  return map;
};

const childrenByLocal = (el: Element, name: string): Element[] =>
  Array.from(el.getElementsByTagName('*')).filter(n => n.localName === name);

/** 把圖片縮到最大寬度 1000px 並轉成 JPEG dataURL；失敗回傳 null */
const compressImage = async (bytes: Uint8Array, mime: string): Promise<string | null> => {
  try {
    const blob = new Blob([bytes as BlobPart], { type: mime });
    const bmp = await createImageBitmap(blob);
    const scale = bmp.width > MAX_WIDTH ? MAX_WIDTH / bmp.width : 1;
    const w = Math.max(1, Math.round(bmp.width * scale));
    const h = Math.max(1, Math.round(bmp.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(bmp, 0, 0, w, h);
    bmp.close?.();
    return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  } catch (e) {
    console.warn('圖片壓縮失敗，略過一張圖片', e);
    return null;
  }
};

const mimeOf = (path: string): string => {
  const ext = path.split('.').pop()?.toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'gif') return 'image/gif';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'bmp') return 'image/bmp';
  return 'image/jpeg';
};

/**
 * 從 xlsx 取出每個工作表的內嵌圖片。
 * 回傳 { 工作表名稱: [{ row, dataUrl }, ...] }（已依列號由上到下排序）
 */
export async function extractSheetImages(data: ArrayBuffer): Promise<Record<string, SheetImage[]>> {
  const result: Record<string, SheetImage[]> = {};
  const zip = await JSZip.loadAsync(data);

  const wbFile = zip.file('xl/workbook.xml');
  if (!wbFile) return result; // 不是 xlsx（例如 csv / xls）
  const wbDoc = parseXml(await wbFile.async('string'));
  const wbRels = await readRels(zip, 'xl/workbook.xml');

  const sheets = Array.from(wbDoc.getElementsByTagName('sheet'));
  for (const sh of sheets) {
    const name = sh.getAttribute('name') || '';
    const rid = sh.getAttribute('r:id') || sh.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id') || '';
    const sheetPath = wbRels[rid];
    if (!name || !sheetPath || !zip.file(sheetPath)) continue;

    // 工作表 → drawing
    const sheetRels = await readRels(zip, sheetPath);
    const sheetXml = parseXml(await zip.file(sheetPath)!.async('string'));
    const drawingEls = Array.from(sheetXml.getElementsByTagName('*')).filter(n => n.localName === 'drawing');
    const found: SheetImage[] = [];

    for (const d of drawingEls) {
      const did = d.getAttribute('r:id') || d.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id') || '';
      const drawingPath = sheetRels[did];
      if (!drawingPath || !zip.file(drawingPath)) continue;

      const drawingRels = await readRels(zip, drawingPath);
      const drawingDoc = parseXml(await zip.file(drawingPath)!.async('string'));
      const anchors = Array.from(drawingDoc.getElementsByTagName('*')).filter(n =>
        ['twoCellAnchor', 'oneCellAnchor', 'absoluteAnchor'].includes(n.localName)
      );

      for (const a of anchors) {
        const fromEl = childrenByLocal(a, 'from')[0];
        const rowEl = fromEl ? childrenByLocal(fromEl, 'row')[0] : undefined;
        const row = rowEl ? parseInt(rowEl.textContent || '0', 10) || 0 : 0;

        const blip = childrenByLocal(a, 'blip')[0];
        if (!blip) continue;
        const embed = blip.getAttribute('r:embed') || blip.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'embed') || '';
        const mediaPath = drawingRels[embed];
        const mediaFile = mediaPath ? zip.file(mediaPath) : null;
        if (!mediaFile) continue;

        const bytes = await mediaFile.async('uint8array');
        const dataUrl = await compressImage(bytes, mimeOf(mediaPath));
        if (dataUrl) found.push({ row, dataUrl });
      }
    }

    if (found.length > 0) {
      found.sort((x, y) => x.row - y.row);
      result[name] = found;
    }
  }
  return result;
}

const DAY_LABEL = /^(D\s?\d+|DAY\s?\d+|第\s?[一二三四五六七八九十\d]+\s?天)/i;

/**
 * 依 A 欄的文字標題（DAY1、DAY2…）把圖片分組：
 * 每張圖歸到「列號小於等於圖片所在列的最近一個標題」。
 * rawJson 必須是未過濾空白列的 sheet_to_json(header:1) 結果；rowOffset 是該範圍起始列（通常 0）。
 */
export function buildDayBlocks(
  rawJson: any[][],
  images: SheetImage[],
  rowOffset = 0
): { label: string; images: string[] }[] {
  const titles: { row: number; label: string }[] = [];
  rawJson.forEach((r, i) => {
    const raw = String(r?.[0] ?? '').trim();
    if (!raw) return;
    // 去掉開頭的標點（例如 ".DAY4" → "DAY4"）
    const label = raw.replace(/^[\s.．。·、,，:：\-–—_]+/, '').trim();
    if (label) titles.push({ row: i + rowOffset, label });
  });

  const blocks: { label: string; images: string[]; row: number }[] = titles.map(t => ({
    label: t.label,
    images: [],
    row: t.row,
  }));
  let orphan: { label: string; images: string[]; row: number } | null = null;

  for (const img of images) {
    let target: (typeof blocks)[number] | null = null;
    for (const b of blocks) {
      if (b.row <= img.row) target = b;
      else break;
    }
    if (!target) {
      if (!orphan) orphan = { label: '圖片', images: [], row: -1 };
      target = orphan;
    }
    target.images.push(img.dataUrl);
  }

  const out = blocks.filter(b => b.images.length > 0 || DAY_LABEL.test(b.label));
  if (orphan) out.unshift(orphan);
  return out.map(({ label, images }) => ({ label, images }));
}
