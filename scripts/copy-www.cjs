/**
 * Capacitor용 www 폴더에 정적 파일 복사
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const www = path.join(root, 'www');

const FILES = [
  'index.html',
  'style.css',
  'game.js',
  'manifest.webmanifest',
  'sw.js',
  '우리나라.jpg',
];

if (!fs.existsSync(www)) {
  fs.mkdirSync(www, { recursive: true });
}

for (const f of FILES) {
  const src = path.join(root, f);
  const dest = path.join(www, f);
  if (!fs.existsSync(src)) {
    console.warn('skip (없음):', f);
    continue;
  }
  fs.copyFileSync(src, dest);
  console.log('copied:', f);
}

console.log('→ www 폴더 준비 완료');
