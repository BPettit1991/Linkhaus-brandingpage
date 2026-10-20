const fs = require('fs');

let html = fs.readFileSync('style-guide.html', 'utf8');

const map = {
  'logos/png/icon-only-for-dark-bg/512px.png': 'logos/png/icon-only-for-dark-bg/512px.png',
  'logos/png/full-logo-for-light-bg/1000px.png': 'logos/png/full-logo-for-light-bg/1000px.png',
  'logos/png/full-logo-for-dark-bg/1000px.png': 'logos/png/full-logo-for-dark-bg/1000px.png',
  'logos/png/icon-only-for-light-bg/512px.png': 'logos/png/icon-only-for-light-bg/512px.png',
  'logos/png/badge-circular/800px.png': 'logos/png/badge-circular/800px.png',
};

let count = 0;
for (const [needle, filePath] of Object.entries(map)) {
  const buf = fs.readFileSync(filePath);
  const dataUri = `data:image/png;base64,${buf.toString('base64')}`;
  const before = html;
  html = html.split(`src="${needle}"`).join(`src="${dataUri}"`);
  if (html !== before) count++;
}

fs.writeFileSync('style-guide.html', html);
console.log(`Inlined ${count} images. New file size: ${(fs.statSync('style-guide.html').size / 1024).toFixed(0)} KB`);
