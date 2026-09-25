import * as XLSX from 'xlsx';
import { ExpeditionPlan, MemberPII, MemberProgress, ShuttleRoute, ItineraryDay, NoticeSection, EquipmentItem, MemberSurvey, DynamicSheet } from '../types';

/**
 * Checks if a value is an Excel serial time float (e.g. 0.7291666666666666, 0.8333333333333334).
 */
export function isExcelSerialTime(val: any): boolean {
  if (val === undefined || val === null || val === '') return false;
  if (typeof val === 'number') {
    return val >= 0 && val < 1;
  }
  if (typeof val === 'string') {
    const s = val.trim();
    return /^0\.\d+$/.test(s);
  }
  return false;
}

/**
 * Converts any Excel time value (serial float fraction, number, Date, string) into strict "HH:MM" format.
 * Examples:
 *  0.7291666666666666 -> "17:30"
 *  0.7638888888888888 -> "18:20"
 *  0.7847222222222222 -> "18:50"
 *  0.8333333333333334 -> "20:00"
 *  0.9930555555555556 -> "23:50"
 *  "16:00" -> "16:00"
 *  "8:00" -> "08:00"
 *  1730 -> "17:30"
 */
export function formatExcelTimeToHHMM(val: any): string {
  if (val === undefined || val === null || val === '') return '';

  // 1. If it's a JS Date object
  if (val instanceof Date) {
    const h = val.getHours();
    const m = val.getMinutes();
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  // 2. If it's a number
  if (typeof val === 'number') {
    // Excel fraction of a day (0 <= num < 1)
    if (val >= 0 && val < 1) {
      const totalMinutes = Math.round(val * 1440);
      const hours = Math.floor((totalMinutes % 1440) / 60);
      const mins = (totalMinutes % 1440) % 60;
      return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    }
    // Excel datetime serial with fractional day
    if (val > 1 && val < 100000 && !Number.isInteger(val)) {
      const frac = val - Math.floor(val);
      const totalMinutes = Math.round(frac * 1440);
      const hours = Math.floor((totalMinutes % 1440) / 60);
      const mins = (totalMinutes % 1440) % 60;
      return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    }
    // Military time integers like 1730, 800, 2000
    if (Number.isInteger(val) && val >= 100 && val <= 2400) {
      const h = Math.floor(val / 100);
      const m = val % 100;
      if (h < 24 && m < 60) {
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      }
    }
  }

  const str = String(val).trim();
  if (!str) return '';

  // 3. String representation of float Excel serial time (e.g. "0.7291666666666666", "0.8333333333333334")
  if (/^0\.\d+$/.test(str) || /^\d+\.\d+$/.test(str)) {
    const num = parseFloat(str);
    if (!isNaN(num)) {
      const frac = num < 1 ? num : num - Math.floor(num);
      const totalMinutes = Math.round(frac * 1440);
      const hours = Math.floor((totalMinutes % 1440) / 60);
      const mins = (totalMinutes % 1440) % 60;
      return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    }
  }

  // 4. Standard HH:MM or HH:MM:SS
  const hhmmMatch = str.match(/^(\d{1,2}):(\d{2})(:(\d{2}))?$/);
  if (hhmmMatch) {
    const h = parseInt(hhmmMatch[1], 10);
    const m = parseInt(hhmmMatch[2], 10);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  // 5. Formats with Chinese characters like "17點30分", "17點30", "20時00分"
  const zhTimeMatch = str.match(/(\d{1,2})\s*[:點時]\s*(\d{1,2})?/);
  if (zhTimeMatch) {
    const h = parseInt(zhTimeMatch[1], 10);
    const m = zhTimeMatch[2] ? parseInt(zhTimeMatch[2], 10) : 0;
    if (h < 24 && m < 60) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
  }

  return str;
}

/**
 * Creates a blank, clean ExpeditionPlan without any hardcoded/fabricated/mock data.
 */
export function createEmptyPlan(fileName: string): ExpeditionPlan {
  const cleanTitle = fileName
    .replace(/\.[^/.]+$/, '')
    .trim() || '登山團務總表';

  return {
    id: `exp_${Date.now()}`,
    title: cleanTitle,
    subtitle: '',
    dates: '',
    d0Date: '',
    mountain: '',
    trailhead: '',
    leader: {
      name: '',
      phone: '',
      emergencyContact: '',
      emergencyPhone: '',
    },
    stayBehindPerson: {
      name: '',
      phone: '',
      deadlineTime: '',
      instructions: '',
    },
    radioFrequency: '',
    satelliteDevice: '',
    parkPermitNumber: '',
    gpxUrl: '',
    lineGroupUrl: '',
    sheets: [],
    pricing: {
      generalPrice: '',
      regionalPricing: [],
      includedServices: [],
      mealAddons: [],
    },
    customHeaders: {},
    customColumns: [],
    progressTasks: [],
    members: [],
    progressData: {},
    shuttleRoutes: [],
    itinerary: [],
    equipmentList: [],
    notices: [],
    surveyData: {},
    safetyAndRetreatPlan: {
      title: '',
      criteria: [],
      procedures: [],
    },
    weatherCheckLinks: [],
  };
}

/**
 * Parses an Excel Workbook (.xlsx/.xls/csv) into our structured ExpeditionPlan.
 * Starts from a 100% clean slate so NO previous, fabricated, or residual mock data exists.
 */
export async function parseExcelFile(file: File, _previousPlan?: ExpeditionPlan): Promise<{ updatedPlan: ExpeditionPlan; summaryMsg: string }> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const sheetNames = workbook.SheetNames;

  // 1. Clean slate plan initialized from filename
  const newPlan: ExpeditionPlan = createEmptyPlan(file.name);
  const logs: string[] = [];
  const parsedDynamicSheets: DynamicSheet[] = [];

  for (let idx = 0; idx < sheetNames.length; idx++) {
    const sheetName = sheetNames[idx];
    const worksheet = workbook.Sheets[sheetName];
    const rawJson: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    if (!rawJson || rawJson.length === 0) {
      parsedDynamicSheets.push({
        id: `sheet_${idx}_${Date.now()}`,
        name: sheetName,
        sheetType: 'customTable',
        rawHeaders: [],
        rawRows: [],
      });
      continue;
    }

    const lowerSheet = sheetName.toLowerCase();
    let detectedType: DynamicSheet['sheetType'] = 'customTable';

    // 1. 團務進度總表
    if (lowerSheet.includes('進度') || lowerSheet.includes('團務') || lowerSheet.includes('progress') || lowerSheet.includes('準備')) {
      detectedType = 'progress';
      newPlan.customHeaders.progressTitle = sheetName;
      const parsedMembers = parseProgressSheet(rawJson, newPlan);
      logs.push(`工作表【${sheetName}】: 解析進度總表，載入 ${parsedMembers} 位隊員資料與欄位`);
    }
    // 2. 接駁 / 上車地點 / 車次
    else if (lowerSheet.includes('接駁') || lowerSheet.includes('上車') || lowerSheet.includes('交通') || lowerSheet.includes('車次') || lowerSheet.includes('shuttle') || lowerSheet.includes('分車')) {
      detectedType = 'shuttle';
      newPlan.customHeaders.shuttleTitle = sheetName;
      const routesCount = parseShuttleSheet(rawJson, newPlan, sheetName);
      logs.push(`工作表【${sheetName}】: 解析交通接駁表，載入 ${routesCount} 條接駁路線`);
    }
    // 3. 個資表 / 名冊 / 保險表 / 隊員 / 緊急連絡人 / 緊急聯絡人
    else if (
      lowerSheet.includes('個資') ||
      lowerSheet.includes('保險') ||
      lowerSheet.includes('名冊') ||
      lowerSheet.includes('成員') ||
      lowerSheet.includes('隊員') ||
      lowerSheet.includes('member') ||
      lowerSheet.includes('名單') ||
      lowerSheet.includes('緊急') ||
      lowerSheet.includes('連絡') ||
      lowerSheet.includes('聯絡') ||
      lowerSheet.includes('留守') ||
      lowerSheet.includes('通訊')
    ) {
      detectedType = 'pii';
      newPlan.customHeaders.piiTitle = sheetName;
      const piiCount = parsePIISheet(rawJson, newPlan);
      logs.push(`工作表【${sheetName}】: 解析${sheetName}，載入 ${piiCount} 筆資料`);
    }
    // 4. 登山計劃書 / 行程表 / 時間表
    else if (lowerSheet.includes('計劃') || lowerSheet.includes('计划') || lowerSheet.includes('行程') || lowerSheet.includes('itinerary') || lowerSheet.includes('plan') || lowerSheet.includes('時間表')) {
      detectedType = 'itinerary';
      newPlan.customHeaders.itineraryTitle = sheetName;
      parsePlanSheet(rawJson, newPlan);
      logs.push(`工作表【${sheetName}】: 解析登山計劃書與行程節點`);
    }
    // 5. 注意事項 / 須知 / 守則
    else if (lowerSheet.includes('注意') || lowerSheet.includes('須知') || lowerSheet.includes('守則') || lowerSheet.includes('notice') || lowerSheet.includes('rule') || lowerSheet.includes('規範')) {
      detectedType = 'notices';
      newPlan.customHeaders.noticesTitle = sheetName;
      parseNoticesSheet(rawJson, newPlan);
      logs.push(`工作表【${sheetName}】: 解析登山注意事項與規範`);
    }
    // 6. 問卷 / 經歷調查
    else if (lowerSheet.includes('問卷') || lowerSheet.includes('調查') || lowerSheet.includes('經歷') || lowerSheet.includes('survey')) {
      detectedType = 'survey';
      newPlan.customHeaders.surveyTitle = sheetName;
      const surveyCount = parseSurveySheet(rawJson, newPlan);
      logs.push(`工作表【${sheetName}】: 解析隊員問卷調查，載入 ${surveyCount} 份問卷`);
    }
    // 6.5 互助組 / 分組名冊
    else if (lowerSheet.includes('互助') || lowerSheet.includes('分組') || lowerSheet.includes('mutual')) {
      detectedType = 'mutualAid';
      logs.push(`工作表【${sheetName}】: 解析互助組分組名冊與通訊`);
    }
    // 7. 裝備檢查表 / 公裝 / 裝備
    else if (lowerSheet.includes('裝備') || lowerSheet.includes('gear') || lowerSheet.includes('equipment') || lowerSheet.includes('公裝')) {
      detectedType = 'equipment';
      newPlan.customHeaders.equipmentTitle = sheetName;
      const eqCount = parseEquipmentSheet(rawJson, newPlan);
      logs.push(`工作表【${sheetName}】: 解析裝備清單，共 ${eqCount} 項物品`);
    }
    // 8. 氣象 / 撤退 / 安全
    else if (lowerSheet.includes('安全') || lowerSheet.includes('氣象') || lowerSheet.includes('撤退') || lowerSheet.includes('safety')) {
      detectedType = 'safety';
      newPlan.customHeaders.safetyPlanTitle = sheetName;
      parseSafetySheet(rawJson, newPlan);
      logs.push(`工作表【${sheetName}】: 解析安全管理與撤退計畫`);
    }
    // 9. 自動檢測或一般資料表
    else {
      const autoType = autoDetectAndParse(rawJson, newPlan, sheetName, logs);
      if (autoType) {
        detectedType = autoType;
      } else {
        detectedType = 'customTable';
        const headers = (rawJson[0] || []).map((h: any) => String(h ?? '').trim());
        const rows = rawJson.slice(1).filter((r: any[]) => r.some((c: any) => String(c ?? '').trim() !== ''));
        logs.push(`工作表【${sheetName}】: 載入自訂資料表，共 ${headers.length} 欄、${rows.length} 列`);
      }
    }

    // Extract exact rawHeaders and rawRows (preserving 100% Excel data)
    let headerRowIdx = 0;
    // Find first non-empty row as header
    for (let r = 0; r < Math.min(rawJson.length, 5); r++) {
      if (rawJson[r] && rawJson[r].some((c: any) => String(c ?? '').trim() !== '')) {
        headerRowIdx = r;
        break;
      }
    }

    const headers = (rawJson[headerRowIdx] || []).map((h: any) => String(h ?? '').trim());
    const rawDataRows = rawJson.slice(headerRowIdx + 1).filter((r: any[]) => r.some((c: any) => String(c ?? '').trim() !== ''));

    // Clean data rows: format any time columns or serial time floats to HH:MM
    const rows = rawDataRows.map((row: any[]) => {
      return row.map((cell: any, cIdx: number) => {
        const h = (headers[cIdx] || '').toLowerCase();
        if (h.includes('時間') || h.includes('時刻') || isExcelSerialTime(cell)) {
          const formatted = formatExcelTimeToHHMM(cell);
          return formatted || cell;
        }
        return cell;
      });
    });

    parsedDynamicSheets.push({
      id: `sheet_${idx}_${Date.now()}`,
      name: sheetName,
      sheetType: detectedType,
      rawHeaders: headers,
      rawRows: rows,
    });
  }

  // If no members were parsed yet, check if any sheet has a '姓名' column
  if (newPlan.members.length === 0) {
    for (const s of parsedDynamicSheets) {
      if (s.rawHeaders && s.rawRows) {
        const nameColIdx = s.rawHeaders.findIndex(h => h.includes('姓名') || h.includes('隊員') || h.includes('名字'));
        if (nameColIdx !== -1) {
          s.rawRows.forEach((r, rIdx) => {
            const name = String(r[nameColIdx] || '').trim();
            if (name && name !== '姓名') {
              newPlan.members.push({
                id: `m_auto_${rIdx}_${Date.now()}`,
                role: '隊員',
                name,
                gender: '男',
                idNumber: '',
                birthDate: '',
                phone: '',
                email: '',
                emergencyContact: '',
                emergencyPhone: '',
              });
            }
          });
          if (newPlan.members.length > 0) {
            logs.push(`從【${s.name}】欄位自動識別 ${newPlan.members.length} 位隊員`);
            break;
          }
        }
      }
    }
  }

  // Assign sheets exactly 1:1 with Excel sheets
  newPlan.sheets = parsedDynamicSheets;

  // Comprehensive extraction of dates, D0, mountain name, leader from ALL sheets if not already extracted
  for (let idx = 0; idx < sheetNames.length; idx++) {
    const worksheet = workbook.Sheets[sheetNames[idx]];
    const rawJson: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    
    for (let r = 0; r < rawJson.length; r++) {
      const row = rawJson[r] || [];
      for (let c = 0; c < row.length; c++) {
        const val = String(row[c] ?? '').trim();
        if (!val) continue;

        // 1. Check for explicit "活動日期：" or "日期："
        if ((val.includes('活動日期') || val.includes('出團日期') || val.includes('行程日期')) && !newPlan.dates) {
          const nextVal = String(row[c + 1] ?? '').trim();
          const cleanDate = nextVal || val.replace(/活動日期|出團日期|行程日期/g, '').replace(/[:：]/g, '').trim();
          if (cleanDate) {
            newPlan.dates = cleanDate;
          }
        }

        // 2. Regex for range dates like "10/9(四)-10/12(日)" or "10/9(四)~10/12(日)" or "10/9~10/12"
        if (!newPlan.dates) {
          const dateRangeMatch = val.match(/\d{1,2}\/\d{1,2}\s*(\([一二三四五六日]\))?\s*[-~～至]\s*\d{1,2}\/\d{1,2}\s*(\([一二三四五六日]\))?(\s*[,，、]\s*.*D0.*)?/i);
          if (dateRangeMatch) {
            newPlan.dates = val;
          }
        }

        // 3. Extract D0 date if present
        if (!newPlan.d0Date) {
          const d0Match = val.match(/D0\s*[:：]?\s*(\d{1,2}\/\d{1,2}\s*(\([一二三四五六日]\))?)|(\d{1,2}\/\d{1,2}\s*(\([一二三四五六日]\))?)\s*D0/i);
          if (d0Match) {
            newPlan.d0Date = d0Match[1] || d0Match[3] || '';
          }
        }

        // 4. Extract Mountain / Destination
        if ((val.includes('山名') || val.includes('路線名稱') || val.includes('活動地點') || val.includes('攀登山岳')) && !newPlan.mountain) {
          const nextVal = String(row[c + 1] ?? '').trim();
          newPlan.mountain = nextVal || val.replace(/山名|路線名稱|活動地點|攀登山岳/g, '').replace(/[:：]/g, '').trim();
        }

        // 5. Extract Activity Title if specified
        if ((val.includes('活動名稱') || val.includes('行程名稱')) && (!newPlan.title || newPlan.title === '登山團務總表')) {
          const nextVal = String(row[c + 1] ?? '').trim();
          if (nextVal) newPlan.title = nextVal;
        }
      }
    }
  }

  const summaryMsg = logs.length > 0
    ? `成功匯入！已確實載入 ${sheetNames.length} 個工作表與全部資料:\n• ` + logs.join('\n• ')
    : `已載入 Excel 檔案，共 ${sheetNames.length} 個工作表。`;

  return { updatedPlan: newPlan, summaryMsg };
}

/** Auto detect sheet type based on headers/content */
function autoDetectAndParse(rawJson: any[][], plan: ExpeditionPlan, sheetName: string, logs: string[]): DynamicSheet['sheetType'] | null {
  const textDump = rawJson.map(row => (row || []).join(' ')).join(' ');
  if (textDump.includes('身分證') || textDump.includes('身份字號') || textDump.includes('出生年月日') || textDump.includes('緊急聯絡人')) {
    const c = parsePIISheet(rawJson, plan);
    plan.customHeaders.piiTitle = sheetName;
    logs.push(`工作表【${sheetName}】: 自動識別為個資名冊，共 ${c} 筆`);
    return 'pii';
  } else if (textDump.includes('上車時間') || textDump.includes('上車地點') || textDump.includes('車次')) {
    const c = parseShuttleSheet(rawJson, plan, sheetName);
    plan.customHeaders.shuttleTitle = sheetName;
    logs.push(`工作表【${sheetName}】: 自動識別為接駁表，共 ${c} 條線路`);
    return 'shuttle';
  } else if (textDump.includes('活動日期確認') || textDump.includes('繳入園資料') || textDump.includes('付款狀態') || textDump.includes('進度')) {
    const c = parseProgressSheet(rawJson, plan);
    plan.customHeaders.progressTitle = sheetName;
    logs.push(`工作表【${sheetName}】: 自動識別為進度總表，共 ${c} 人`);
    return 'progress';
  } else if (textDump.includes('裝備') || textDump.includes('睡袋') || textDump.includes('雨衣') || textDump.includes('登山杖')) {
    const c = parseEquipmentSheet(rawJson, plan);
    plan.customHeaders.equipmentTitle = sheetName;
    logs.push(`工作表【${sheetName}】: 自動識別為裝備表，共 ${c} 項`);
    return 'equipment';
  } else if (textDump.includes('出團須知') || textDump.includes('注意事項') || textDump.includes('登山安全') || textDump.includes('守則')) {
    parseNoticesSheet(rawJson, plan);
    plan.customHeaders.noticesTitle = sheetName;
    logs.push(`工作表【${sheetName}】: 自動識別為注意事項規範`);
    return 'notices';
  }
  return null;
}

/** Parse Progress Sheet (團務進度總表) */
function parseProgressSheet(rawJson: any[][], plan: ExpeditionPlan): number {
  let headerRowIndex = -1;
  let titleFound = '';

  for (let r = 0; r < Math.min(rawJson.length, 6); r++) {
    const row = (rawJson[r] || []).map(c => String(c ?? '').trim());
    if (row[0] && (row[0].includes('進度') || row[0].includes('團務') || row[0].includes('總表'))) {
      titleFound = row[0];
    }
    const nameColIdx = row.findIndex(c => c === '姓名' || c === '隊員姓名' || c === '成員姓名' || c === '名字');
    if (nameColIdx !== -1) {
      headerRowIndex = r;
      break;
    }
  }

  if (titleFound) {
    plan.customHeaders.progressTitle = titleFound.replace(/,{2,}/g, '').trim();
  }

  if (headerRowIndex === -1) return 0;

  const headerRow = (rawJson[headerRowIndex] || []).map(c => String(c ?? '').trim());
  const roleIdx = headerRow.findIndex(c => c === '角色' || c === '身分' || c === '職稱');
  const nameIdx = headerRow.findIndex(c => c === '姓名' || c === '隊員姓名' || c === '成員姓名' || c === '名字');
  const payIdx = headerRow.findIndex(c => c.includes('付款') || c.includes('繳費') || c.includes('匯款'));

  if (nameIdx === -1) return 0;

  // Extract tasks from columns
  const taskCols: { colIdx: number; label: string; key: string }[] = [];
  for (let c = 0; c < headerRow.length; c++) {
    if (c !== roleIdx && c !== nameIdx && c !== payIdx && headerRow[c]) {
      const label = headerRow[c].replace(/\r?\n/g, ' ').trim();
      const existingTask = plan.progressTasks.find(t => t.label === label);
      const key = existingTask ? existingTask.key : `task_${c}_${Date.now()}`;
      taskCols.push({ colIdx: c, label, key });

      if (!existingTask) {
        plan.progressTasks.push({
          id: `t_${Date.now()}_${c}`,
          key,
          label,
        });
      }
    }
  }

  let count = 0;
  for (let r = headerRowIndex + 1; r < rawJson.length; r++) {
    const row = rawJson[r];
    if (!row || row.length === 0) continue;
    const name = String(row[nameIdx] ?? '').trim();
    if (!name || name === '姓名' || name === '隊員姓名') continue;

    const role = roleIdx !== -1 && row[roleIdx] ? String(row[roleIdx]).trim() : '隊員';

    let member = plan.members.find(m => m.name === name);
    if (!member) {
      member = {
        id: `m_${Date.now()}_${r}`,
        role: role.includes('領隊') ? '領隊' : role.includes('嚮導') ? '嚮導' : role.includes('副領隊') ? '副領隊' : '隊員',
        name,
        gender: '男',
        idNumber: '',
        birthDate: '',
        phone: '',
        email: '',
        emergencyContact: '',
        emergencyPhone: '',
      };
      plan.members.push(member);
    } else {
      if (role.includes('領隊')) member.role = '領隊';
    }

    if (!plan.progressData[member.id]) {
      plan.progressData[member.id] = {
        memberId: member.id,
        tasks: {},
        paidStatus: '未付款',
      };
    }

    if (payIdx !== -1 && row[payIdx] !== undefined) {
      const payVal = String(row[payIdx]).trim();
      if (payVal) plan.progressData[member.id].paidStatus = payVal;
    }

    // Set task values
    for (const tc of taskCols) {
      const val = row[tc.colIdx] !== undefined ? String(row[tc.colIdx]).trim() : '';
      if (val === 'O' || val === 'o' || val === 'V' || val === 'v' || val === '1' || val === 'true' || val === '是' || val === '✓') {
        plan.progressData[member.id].tasks[tc.key] = true;
      } else if (val) {
        plan.progressData[member.id].tasks[tc.key] = val;
      }
    }
    count++;
  }
  return count;
}

/** Parse PII Sheet (個資/身分證/緊急聯絡人) */
function parsePIISheet(rawJson: any[][], plan: ExpeditionPlan): number {
  let headerRowIndex = -1;
  for (let r = 0; r < Math.min(rawJson.length, 6); r++) {
    const row = (rawJson[r] || []).map(c => String(c ?? '').trim());
    if (row.some(c => c.includes('身分') || c.includes('姓名') || c.includes('電話') || c.includes('生日'))) {
      headerRowIndex = r;
      break;
    }
  }

  if (headerRowIndex === -1) return 0;

  const headers = (rawJson[headerRowIndex] || []).map(c => String(c ?? '').trim());
  const colMap: Record<string, number> = {};
  const customColIndices: { index: number; header: string }[] = [];

  headers.forEach((h, i) => {
    if (!h) return;
    const lowerH = h.toLowerCase();
    if ((h.includes('姓名') || h.includes('名字') || h === '成員') && !h.includes('緊急') && !h.includes('聯絡')) {
      colMap['name'] = i;
    } else if (h.includes('暱稱') || h.includes('稱呼') || h.includes('綽號')) {
      colMap['nickname'] = i;
    } else if (h.includes('角色') || h.includes('職稱') || h.includes('身分')) {
      colMap['role'] = i;
    } else if (h.includes('性別') || h.includes('姓別')) {
      colMap['gender'] = i;
    } else if (h.includes('身分證') || h.includes('身份字號') || h.includes('證號') || h.includes('身分證字號')) {
      colMap['idNumber'] = i;
    } else if (h.includes('出生') || h.includes('生日')) {
      colMap['birthDate'] = i;
    } else if (h.includes('聯絡電話') || h.includes('本人電話') || h.includes('隊員電話') || h.includes('手機') || (h.includes('電話') && !h.includes('緊急') && !h.includes('聯絡人'))) {
      colMap['phone'] = i;
    } else if (lowerH.includes('email') || h.includes('信箱') || h.includes('電子郵件')) {
      colMap['email'] = i;
    } else if (h.includes('緊急聯絡人電話') || h.includes('緊急電話') || h.includes('聯絡人電話') || (h.includes('緊急') && h.includes('電話')) || (h.includes('聯絡人') && h.includes('電話'))) {
      colMap['emergencyPhone'] = i;
    } else if (h.includes('緊急聯絡人姓名') || h.includes('緊急聯絡人') || h.includes('緊急聯絡') || h.includes('緊急名單')) {
      colMap['emergencyContact'] = i;
    } else if (h.includes('關係') || h.includes('稱謂')) {
      colMap['relationship'] = i;
    } else if (h.includes('地址') || h.includes('住址')) {
      colMap['address'] = i;
    } else if (h.includes('血型')) {
      colMap['bloodType'] = i;
    } else if (h.includes('病史') || h.includes('過敏') || h.includes('用藥')) {
      colMap['medicalHistory'] = i;
    } else if (h.includes('飲食') || h.includes('素食') || h.includes('葷素')) {
      colMap['diet'] = i;
    } else {
      customColIndices.push({ index: i, header: h });
      if (!plan.customColumns.some(c => c.label === h)) {
        plan.customColumns.push({
          label: h,
          key: `custom_${h}`,
          type: 'text',
          tableKey: 'pii',
          isPII: false,
        });
      }
    }
  });

  let count = 0;
  for (let r = headerRowIndex + 1; r < rawJson.length; r++) {
    const row = rawJson[r];
    if (!row || row.length === 0) continue;
    const name = colMap['name'] !== undefined ? String(row[colMap['name']] ?? '').trim() : '';
    if (!name || name === '姓名' || name === '隊員姓名') continue;

    let member = plan.members.find(m => m.name === name);
    if (!member) {
      member = {
        id: `m_pii_${Date.now()}_${r}`,
        role: colMap['role'] !== undefined && row[colMap['role']] ? String(row[colMap['role']]).trim() : '隊員',
        name,
        gender: colMap['gender'] !== undefined ? String(row[colMap['gender']] ?? '').trim() : '',
        idNumber: '',
        birthDate: '',
        phone: '',
        email: '',
        emergencyContact: '',
        emergencyPhone: '',
        customFields: {},
      };
      plan.members.push(member);
    }

    if (colMap['role'] !== undefined && row[colMap['role']]) member.role = String(row[colMap['role']]).trim();
    if (colMap['nickname'] !== undefined && row[colMap['nickname']]) member.nickname = String(row[colMap['nickname']]).trim();
    if (colMap['gender'] !== undefined && row[colMap['gender']]) member.gender = String(row[colMap['gender']]).trim();
    if (colMap['idNumber'] !== undefined && row[colMap['idNumber']]) member.idNumber = String(row[colMap['idNumber']]).trim();
    if (colMap['birthDate'] !== undefined && row[colMap['birthDate']]) member.birthDate = String(row[colMap['birthDate']]).trim();
    if (colMap['phone'] !== undefined && row[colMap['phone']]) member.phone = String(row[colMap['phone']]).trim();
    if (colMap['email'] !== undefined && row[colMap['email']]) member.email = String(row[colMap['email']]).trim();
    
    // Emergency contact & relationship
    let emContact = colMap['emergencyContact'] !== undefined && row[colMap['emergencyContact']] ? String(row[colMap['emergencyContact']]).trim() : '';
    const emRel = colMap['relationship'] !== undefined && row[colMap['relationship']] ? String(row[colMap['relationship']]).trim() : '';
    if (emContact && emRel && !emContact.includes(emRel)) {
      emContact = `${emContact} (${emRel})`;
    } else if (!emContact && emRel) {
      emContact = emRel;
    }
    if (emContact) member.emergencyContact = emContact;

    if (colMap['emergencyPhone'] !== undefined && row[colMap['emergencyPhone']]) {
      member.emergencyPhone = String(row[colMap['emergencyPhone']]).trim();
    }

    if (colMap['address'] !== undefined && row[colMap['address']]) member.address = String(row[colMap['address']]).trim();
    if (colMap['bloodType'] !== undefined && row[colMap['bloodType']]) member.bloodType = String(row[colMap['bloodType']]).trim();
    if (colMap['medicalHistory'] !== undefined && row[colMap['medicalHistory']]) member.medicalHistory = String(row[colMap['medicalHistory']]).trim();
    if (colMap['diet'] !== undefined && row[colMap['diet']]) member.diet = String(row[colMap['diet']]).trim();

    // Custom columns
    if (!member.customFields) member.customFields = {};
    for (const cCol of customColIndices) {
      if (row[cCol.index] !== undefined && row[cCol.index] !== null) {
        const valStr = String(row[cCol.index]).trim();
        if (valStr) {
          member.customFields[`custom_${cCol.header}`] = valStr;
        }
      }
    }

    count++;
  }
  return count;
}

/** Parse Shuttle Routes */
function parseShuttleSheet(rawJson: any[][], plan: ExpeditionPlan, sheetName: string): number {
  const routes: ShuttleRoute[] = [];
  let currentRoute: ShuttleRoute | null = null;

  let timeColIdx = -1;
  let locColIdx = -1;
  let memberCols: number[] = [];

  for (let r = 0; r < rawJson.length; r++) {
    const rawRow = rawJson[r] || [];
    if (rawRow.length === 0) continue;

    const rowStr = rawRow.map(c => String(c ?? '').trim()).join(' ');
    if (!rowStr) continue;

    const firstCell = String(rawRow[0] ?? '').trim();

    // Check if this row is a route header/title e.g. "8/18 (二) D0上車時間地點 台北出發" or "第一車 (台中出發)" or "南部車次"
    const isRouteHeader = (
      (rowStr.includes('上車時間地點') || rowStr.includes('車次') || (rowStr.includes('第') && rowStr.includes('車')) || rowStr.includes('出發') || rowStr.includes('線路')) &&
      !firstCell.includes(':') &&
      !isExcelSerialTime(rawRow[0]) &&
      rowStr.length > 3
    );

    if (isRouteHeader) {
      if (currentRoute && currentRoute.stops.length > 0) {
        routes.push(currentRoute);
      }
      currentRoute = {
        id: `route_${Date.now()}_${routes.length}`,
        title: firstCell || rowStr || sheetName,
        departureDate: plan.d0Date || 'D0',
        stops: [],
      };
      timeColIdx = -1;
      locColIdx = -1;
      memberCols = [];
      continue;
    }

    // Check if this row is a column header row e.g. ["上車時間", "上車地點", "隊員", "隊員", "隊員", "隊員"]
    const isTableHeader = rawRow.some(c => {
      const s = String(c ?? '').trim();
      return s.includes('上車時間') || s.includes('上車地點') || (s.includes('時間') && s.includes('地點')) || s === '時間' || s === '地點';
    });

    if (isTableHeader) {
      timeColIdx = -1;
      locColIdx = -1;
      memberCols = [];
      rawRow.forEach((c, idx) => {
        const s = String(c ?? '').trim();
        if (s.includes('時間') && timeColIdx === -1) timeColIdx = idx;
        else if ((s.includes('地點') || s.includes('站點') || s.includes('門市')) && locColIdx === -1) locColIdx = idx;
        else if (s.includes('隊員') || s.includes('姓名') || s.includes('成員') || s.includes('人員') || s.includes('乘客') || s.includes('名單')) {
          memberCols.push(idx);
        }
      });
      if (timeColIdx === -1) timeColIdx = 0;
      if (locColIdx === -1) locColIdx = 1;
      continue;
    }

    // Determine actual column positions
    const actualTimeCol = timeColIdx !== -1 ? timeColIdx : 0;
    const actualLocCol = locColIdx !== -1 ? locColIdx : 1;

    const rawTime = rawRow[actualTimeCol];
    const formattedTime = formatExcelTimeToHHMM(rawTime);

    // Get location verbatim without altering
    const rawLoc = rawRow[actualLocCol];
    const locationName = rawLoc !== undefined && rawLoc !== null ? String(rawLoc).trim() : '';

    // Check if this is a data row with valid time or location
    const hasTime = /^\d{1,2}:\d{2}$/.test(formattedTime);
    const isLocationValid = locationName.length > 0 &&
      locationName !== '上車地點' &&
      locationName !== '地點' &&
      locationName !== '上車時間地點';

    if (hasTime || isLocationValid) {
      if (!currentRoute) {
        currentRoute = {
          id: `route_${Date.now()}_${routes.length}`,
          title: sheetName || '接駁路線',
          departureDate: plan.d0Date || 'D0',
          stops: [],
        };
      }

      // Collect passengers across all member columns
      const passengers: string[] = [];
      const colsToScan = memberCols.length > 0
        ? memberCols
        : Array.from({ length: Math.max(0, rawRow.length - 2) }, (_, i) => i + 2);

      for (const colIdx of colsToScan) {
        if (colIdx === actualTimeCol || colIdx === actualLocCol) continue;
        const cell = rawRow[colIdx];
        if (cell === undefined || cell === null) continue;
        const cellStr = String(cell).trim();
        if (!cellStr) continue;

        // Skip placeholder marks, empty markers, dashes, or header strings
        if (
          cellStr === '-' ||
          cellStr === '--' ||
          cellStr === '—' ||
          cellStr === '－' ||
          cellStr === '無' ||
          cellStr === '隊員' ||
          cellStr === '乘車名單' ||
          cellStr === '姓名' ||
          cellStr === '待定' ||
          cellStr.toLowerCase() === 'nil' ||
          cellStr.toLowerCase() === 'null' ||
          cellStr.toLowerCase() === 'nan' ||
          cellStr.toLowerCase() === 'n/a' ||
          cellStr.toLowerCase() === 'none'
        ) {
          continue;
        }

        // If multiple names inside a single cell separated by comma or 顿号
        if (cellStr.includes(',') || cellStr.includes('，') || cellStr.includes('、')) {
          const parts = cellStr.split(/[,，、]+/).map(s => s.trim()).filter(s => (
            s &&
            s !== '-' &&
            s !== '--' &&
            s !== '—' &&
            s !== '－' &&
            s !== '無' &&
            s !== '待定' &&
            s.toLowerCase() !== 'nil' &&
            s.toLowerCase() !== 'null' &&
            s.toLowerCase() !== 'nan'
          ));
          passengers.push(...parts);
        } else {
          // Keep entire name verbatim (preserving names with spaces like "Lance Chang 人弘", "huichen lin（惠真）", "Hsin Huang")
          passengers.push(cellStr);
        }
      }

      currentRoute.stops.push({
        id: `stop_${Date.now()}_${r}_${currentRoute.stops.length}`,
        time: formattedTime || '未定',
        locationName: locationName || '接駁地點',
        passengers,
      });
    }
  }

  if (currentRoute && currentRoute.stops.length > 0) {
    routes.push(currentRoute);
  }

  if (routes.length > 0) {
    plan.shuttleRoutes = routes;
  }
  return routes.length;
}

/** Parse Plan & Itinerary Sheet */
function parsePlanSheet(rawJson: any[][], plan: ExpeditionPlan) {
  let currentDay: ItineraryDay | null = null;
  const days: ItineraryDay[] = [];

  for (let r = 0; r < rawJson.length; r++) {
    const row = (rawJson[r] || []).map(c => String(c ?? '').trim());
    const first = row[0] || '';

    if (first.includes('活動名稱') && row[1]) {
      plan.title = row[1];
    } else if (first.includes('活動日期') && row[1]) {
      plan.dates = row[1];
    } else if (first.includes('入山與下山地點') || first.includes('登山口')) {
      plan.trailhead = row[1] || first.replace(/入山與下山地點|登山口/g, '').replace(/[:：]/g, '').trim();
    } else if (first.includes('無線電頻率')) {
      plan.radioFrequency = first.replace('無線電頻率', '').replace(/[:：]/g, '').trim() || row[1] || '';
    } else if (first.includes('領隊') && row[1]) {
      plan.leader.name = row[1];
      if (row[3]) plan.leader.phone = row[3];
    }

    // Detect DAY section e.g. D0, DAY1, DAY2, 第1天
    const dayMatch = first.match(/^(D\d|DAY\s?\d|第\s?\d\s?天|預估行程)/i);
    if (dayMatch) {
      if (currentDay && currentDay.milestones.length > 0) {
        days.push(currentDay);
      }
      currentDay = {
        id: `day_${Date.now()}_${days.length}`,
        dayLabel: dayMatch[0].toUpperCase(),
        title: row[1] || `${dayMatch[0]} 行程`,
        milestones: [],
      };
      continue;
    }

    // Milestone with time e.g. 09:00 勝光登山口起登
    if (currentDay) {
      const timeMatch = first.match(/^(\d{1,2}:\d{2})\s*(.*)/);
      if (timeMatch) {
        currentDay.milestones.push({
          time: timeMatch[1],
          location: timeMatch[2] || row[1] || '地點',
          notes: row[2] || '',
        });
      } else if (first.includes('行走時間') || first.includes('預估時間')) {
        currentDay.estimatedTime = first.replace(/行走時間|預估時間/g, '').replace(/[:：]/g, '').trim();
      }
    }
  }

  if (currentDay && currentDay.milestones.length > 0) {
    days.push(currentDay);
  }

  if (days.length > 0) {
    plan.itinerary = days;
  }
}

/** Parse Notices Sheet */
function parseNoticesSheet(rawJson: any[][], plan: ExpeditionPlan) {
  const sections: NoticeSection[] = [];
  let currentSec: NoticeSection | null = null;

  for (let r = 0; r < rawJson.length; r++) {
    const line = String(rawJson[r]?.[0] ?? '').trim();
    if (!line) continue;

    // Check if section header
    if (
      line.startsWith('【') ||
      line.includes('須知') ||
      line.includes('食：') ||
      line.includes('衣：') ||
      line.includes('住：') ||
      line.includes('行：') ||
      line.includes('醫療') ||
      line.includes('安全') ||
      line.includes('原則') ||
      line.includes('應變路線')
    ) {
      if (currentSec && currentSec.content.length > 0) {
        sections.push(currentSec);
      }
      currentSec = {
        id: `sec_${Date.now()}_${sections.length}`,
        title: line.replace(/[【】:：]/g, '').trim(),
        content: [],
      };
    } else if (currentSec) {
      currentSec.content.push(line);
    }
  }

  if (currentSec && currentSec.content.length > 0) {
    sections.push(currentSec);
  }

  if (sections.length > 0) {
    plan.notices = sections;
  }
}

/** Parse Member Survey Sheet */
function parseSurveySheet(rawJson: any[][], plan: ExpeditionPlan): number {
  if (rawJson.length < 2) return 0;
  const headers = (rawJson[0] || []).map(c => String(c ?? '').trim());
  const nameIdx = headers.findIndex(h => h.includes('稱呼') || h.includes('姓名') || h.includes('暱稱'));
  if (nameIdx === -1) return 0;

  let count = 0;
  for (let r = 1; r < rawJson.length; r++) {
    const row = rawJson[r];
    if (!row) continue;
    const name = String(row[nameIdx] ?? '').trim();
    if (!name) continue;

    const rawAnswers: Record<string, string> = {};

    const survey: MemberSurvey = {
      memberId: `survey_${r}`,
      name,
      completedTypes: [],
      preferredTypes: [],
      volunteerRoles: [],
      rawAnswers,
    };

    headers.forEach((h, idx) => {
      const val = String(row[idx] ?? '').trim();
      if (!val) return;
      rawAnswers[h] = val;

      if (h.includes('時間戳記')) survey.timestamp = val;
      else if (h.includes('互相照顧') || h.includes('共同決定')) survey.mutualCareAgreement = val;
      else if (h.includes('縱走') || h.includes('行程及是否自理')) survey.longHikeExp = val;
      else if (h.includes('路線') || h.includes('難度等級') || h.includes('基本資料')) survey.routeKnowledgeConfirmed = val;
      else if (h.includes('離線地圖') || h.includes('座標') || h.includes('GPX')) survey.offlineMapSkill = val;
      else if (h.includes('雨中') || h.includes('下雨')) survey.rainHikingAcceptable = val;
      else if (h.includes('休息') || h.includes('節奏') || h.includes('一小時')) survey.paceAgreement = val;
      else if (h.includes('重裝') || h.includes('10小時') || h.includes('體能')) survey.heavyPackStamina = val;
      else if (h.includes('高山反應') || h.includes('病史') || h.includes('過敏') || h.includes('高反')) survey.medicalAndAltitudeHistory = val;
      else if (h.includes('預備日')) survey.spareDayAgreement = val;
      else if (h.includes('運動狀況') || h.includes('結算') || h.includes('每週日')) survey.weeklyExerciseReport = val;
      else if (h.includes('證照') || h.includes('救護') || h.includes('急救') || h.includes('BLS') || h.includes('WAFA')) survey.firstAidCert = val;
      else if (h.includes('百岳數') || h.includes('百岳')) survey.peaksCount = val;
      else if (h.includes('地區')) survey.region = val;
      else if (h.includes('年齡')) survey.ageRange = val;
      else if (h.includes('星座')) survey.zodiac = val;
      else if (h.includes('職業')) survey.occupation = val;
      else if (h.includes('經驗')) survey.experienceYears = val;
      else if (h.includes('風格')) survey.hikingStyle = val;
      else if (h.includes('介紹')) survey.selfIntro = val;
    });

    const matchedMember = plan.members.find(m => m.name === name || m.nickname === name);
    if (matchedMember) {
      survey.memberId = matchedMember.id;
      plan.surveyData[matchedMember.id] = survey;
    } else {
      plan.surveyData[survey.memberId] = survey;
    }
    count++;
  }
  return count;
}

/** Parse Equipment List */
function parseEquipmentSheet(rawJson: any[][], plan: ExpeditionPlan): number {
  const items: EquipmentItem[] = [];
  for (let r = 0; r < rawJson.length; r++) {
    const row = (rawJson[r] || []).map(c => String(c ?? '').trim());
    if (row.length >= 2) {
      const name = row[1] || row[0];
      if (name && name !== '品 名' && name !== '品名' && name !== '裝備名稱' && !name.includes('檢查表')) {
        items.push({
          id: `eq_${r}_1`,
          category: row[0] && row[0] !== name ? row[0] : '必備裝備',
          name,
          required: true,
          notes: row[2] || '',
        });
      }
      const name2 = row[3];
      if (name2 && name2 !== '品 名' && name2 !== '品名') {
        items.push({
          id: `eq_${r}_2`,
          category: '個人衣著與用品',
          name: name2,
          required: true,
          notes: row[4] || '',
        });
      }
    }
  }
  if (items.length > 0) {
    plan.equipmentList = items;
  }
  return items.length;
}

/** Parse Safety & Retreat Sheet (氣象預報與安全管理) */
function parseSafetySheet(rawJson: any[][], plan: ExpeditionPlan) {
  const criteria: string[] = [];
  const procedures: string[] = [];
  const weatherLinks: { name: string; url: string; description?: string }[] = [];

  let mode: 'none' | 'criteria' | 'procedures' | 'weather' = 'none';

  for (let r = 0; r < rawJson.length; r++) {
    const row = rawJson[r] || [];
    const line = String(row[0] ?? '').trim();
    if (!line && row.every((c: any) => !c)) continue;

    // Check for weather URL in row
    const rowStr = row.map((c: any) => String(c ?? '').trim()).join(' ');
    const urlMatch = rowStr.match(/https?:\/\/[^\s]+/i);

    if (line.includes('氣象') || line.includes('天氣') || line.includes('預報') || line.includes('Windy') || line.includes('CWA')) {
      mode = 'weather';
      if (urlMatch) {
        weatherLinks.push({
          name: line || '氣象預報連結',
          url: urlMatch[0],
          description: String(row[1] ?? '').includes('http') ? String(row[2] ?? '') : String(row[1] ?? ''),
        });
        continue;
      }
    } else if (line.includes('撤退時機') || line.includes('時機') || line.includes('準則')) {
      mode = 'criteria';
      continue;
    } else if (line.includes('程序') || line.includes('行動準則') || line.includes('步驟') || line.includes('SOP')) {
      mode = 'procedures';
      continue;
    }

    if (urlMatch && mode === 'weather') {
      weatherLinks.push({
        name: line || '氣象資料查詢',
        url: urlMatch[0],
        description: String(row[1] ?? '').includes('http') ? String(row[2] ?? '') : String(row[1] ?? ''),
      });
    } else if (mode === 'criteria' && line) {
      criteria.push(line);
    } else if (mode === 'procedures' && line) {
      procedures.push(line);
    } else if (mode === 'none' && line) {
      if (line.includes('雨') || line.includes('颱風') || line.includes('高山症') || line.includes('落後') || line.includes('撤退')) {
        criteria.push(line);
      }
    }
  }

  if (criteria.length > 0 || procedures.length > 0) {
    plan.safetyAndRetreatPlan = {
      title: plan.customHeaders.safetyPlanTitle || '自主安全管理與應變撤退計畫',
      criteria: criteria.length > 0 ? criteria : plan.safetyAndRetreatPlan.criteria,
      procedures: procedures.length > 0 ? procedures : plan.safetyAndRetreatPlan.procedures,
    };
  }

  if (weatherLinks.length > 0) {
    plan.weatherCheckLinks = weatherLinks;
  }
}

/**
 * Generate a complete, formatted Multi-Sheet Excel workbook from ExpeditionPlan
 */
export function exportExpeditionToExcel(plan: ExpeditionPlan, includeFullPII: boolean = false): void {
  const wb = XLSX.utils.book_new();

  // If plan has sheets, export each sheet faithfully
  if (plan.sheets && plan.sheets.length > 0) {
    plan.sheets.forEach(sheet => {
      let sheetData: any[][] = [];

      if (sheet.sheetType === 'customTable' && sheet.rawHeaders) {
        sheetData = [sheet.rawHeaders, ...(sheet.rawRows || [])];
      } else if (sheet.sheetType === 'progress' && plan.members.length > 0) {
        const progressHeader = ['角色', '姓名', ...plan.progressTasks.map(t => t.label), '付款狀態'];
        const progressRows = plan.members.map(m => {
          const p = plan.progressData[m.id];
          const taskVals = plan.progressTasks.map(t => {
            const val = p?.tasks[t.key];
            if (val === true) return 'O';
            if (val === false || val === undefined) return '';
            return String(val);
          });
          return [m.role, m.name, ...taskVals, p?.paidStatus || ''];
        });
        sheetData = [[sheet.name], progressHeader, ...progressRows];
      } else if (sheet.sheetType === 'pii' && plan.members.length > 0) {
        const piiHeader = ['角色', '姓名', '暱稱', '性別', '身分證字號', '出生年月日', '聯絡電話', 'Email', '緊急聯絡人', '緊急聯絡人電話', '飲食習慣', '用藥/病史'];
        const piiRows = plan.members.map(m => {
          if (includeFullPII) {
            return [
              m.role, m.name, m.nickname || '', m.gender, m.idNumber, m.birthDate, m.phone, m.email,
              m.emergencyContact, m.emergencyPhone, m.diet || '', m.medicalHistory || ''
            ];
          } else {
            return [
              m.role, m.name, m.nickname || '', m.gender,
              m.idNumber ? m.idNumber.slice(0, 2) + '****' + m.idNumber.slice(-3) : '',
              '****-**-**',
              m.phone ? m.phone.slice(0, 4) + '***' : '',
              '***@***',
              m.emergencyContact ? m.emergencyContact[0] + '○' : '',
              '****',
              m.diet || '',
              m.medicalHistory ? '已由領隊建檔' : ''
            ];
          }
        });
        sheetData = [[sheet.name], piiHeader, ...piiRows];
      } else if (sheet.sheetType === 'shuttle' && plan.shuttleRoutes.length > 0) {
        plan.shuttleRoutes.forEach(route => {
          sheetData.push([route.title]);
          sheetData.push(['上車時間', '上車地點', '乘車隊員', '備註']);
          route.stops.forEach(s => {
            sheetData.push([s.time, s.locationName, s.passengers.join(', '), s.notes || '']);
          });
          sheetData.push([]);
        });
      } else if (sheet.sheetType === 'itinerary' && plan.itinerary.length > 0) {
        sheetData.push(['活動名稱', plan.title]);
        sheetData.push(['活動日期', plan.dates]);
        sheetData.push([]);
        plan.itinerary.forEach(day => {
          sheetData.push([`【${day.dayLabel}】 ${day.title}`, `預估耗時: ${day.estimatedTime || ''}`]);
          sheetData.push(['時間', '地點與標的', '注意事項/備註']);
          day.milestones.forEach(m => {
            sheetData.push([m.time, m.location, m.notes || '']);
          });
          sheetData.push([]);
        });
      } else if (sheet.sheetType === 'equipment' && plan.equipmentList.length > 0) {
        const eqHeader = ['分類', '物品名稱', '是否必備', '備註'];
        const eqRows = plan.equipmentList.map(item => [
          item.category, item.name, item.required ? '必備' : '選備', item.notes || ''
        ]);
        sheetData = [[sheet.name], eqHeader, ...eqRows];
      } else if (sheet.sheetType === 'notices' && plan.notices.length > 0) {
        sheetData = [[sheet.name]];
        plan.notices.forEach(n => {
          sheetData.push([]);
          sheetData.push([`【${n.title}】`]);
          n.content.forEach((c, idx) => {
            sheetData.push([`${idx + 1}. ${c}`]);
          });
        });
      } else if (sheet.rawHeaders && sheet.rawHeaders.length > 0) {
        sheetData = [sheet.rawHeaders, ...(sheet.rawRows || [])];
      }

      if (sheetData.length > 0) {
        const ws = XLSX.utils.aoa_to_sheet(sheetData);
        let safeName = sheet.name.slice(0, 31).replace(/[\\/?*[\]]/g, '_');
        if (wb.SheetNames.includes(safeName)) {
          safeName = `${safeName.slice(0, 26)}_${wb.SheetNames.length + 1}`;
        }
        XLSX.utils.book_append_sheet(wb, ws, safeName);
      }
    });
  }

  const fileName = `${plan.title.replace(/\s+/g, '_')}_團務總表_${includeFullPII ? '管理版(含個資)' : '公開版'}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
