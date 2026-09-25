import { existsSync, mkdirSync, renameSync, rmSync } from 'fs';
import { join } from 'path';

const DIST = 'dist';
const SUBDIR = join(DIST, 'tool01');

if (!existsSync(DIST)) {
  console.error('[postbuild] dist 目錄不存在，build 可能失敗了');
  process.exit(1);
}

if (existsSync(SUBDIR)) {
  rmSync(SUBDIR, { recursive: true, force: true });
}
mkdirSync(SUBDIR, { recursive: true });

for (const name of ['index.html', 'assets']) {
  const src = join(DIST, name);
  const dest = join(SUBDIR, name);
  if (existsSync(src)) {
    renameSync(src, dest);
    console.log(`[postbuild] moved ${src} -> ${dest}`);
  } else {
    console.error(`[postbuild] 預期中的 ${src} 不存在`);
    process.exit(1);
  }
}

console.log('[postbuild] dist/tool01/ 已就緒，dist 根目錄不會殘留舊檔案');
