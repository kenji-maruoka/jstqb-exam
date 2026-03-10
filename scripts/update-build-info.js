import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ESModule で __dirname を取得
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ビルド時に実行される
const buildInfo = {
  buildTime: new Date().toISOString(),
  buildDate: new Date().toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Asia/Tokyo'
  })
};

const filePath = path.join(__dirname, '../build-info.json');
fs.writeFileSync(filePath, JSON.stringify(buildInfo, null, 2));
console.log('✅ Build info updated:', buildInfo);