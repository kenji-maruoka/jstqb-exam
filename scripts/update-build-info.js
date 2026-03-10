import fs from 'fs';
const path = require('path');

// ビルド時に実行される関数
// 現在の日時を記録して build-info.json を生成
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

// プロジェクトルートに build-info.json を作成
const filePath = path.join(__dirname, '../build-info.json');
fs.writeFileSync(filePath, JSON.stringify(buildInfo, null, 2));
console.log('✅ Build info updated:', buildInfo);
