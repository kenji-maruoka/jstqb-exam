const fs = require('fs');
const path = require('path');

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