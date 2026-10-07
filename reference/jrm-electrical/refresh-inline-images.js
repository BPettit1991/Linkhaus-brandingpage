const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
let html = fs.readFileSync(path.join(root, 'style-guide.html'), 'utf8');

// Map each <img> by its distinguishing alt text to its current source file.
const targets = [
  { alt: 'JRM icon', file: 'logos/png/icon-only-for-dark-bg/512px.png' },
  { alt: 'Logo on light background', file: 'logos/png/full-logo-for-light-bg/1000px.png' },
  { alt: 'Logo on dark background', file: 'logos/png/full-logo-for-dark-bg/1000px.png' },
  { alt: 'Icon on light background', file: 'logos/png/icon-only-for-light-bg/512px.png' },
  { alt: 'Icon on dark background', file: 'logos/png/icon-only-for-dark-bg/512px.png' },
  { alt: 'Circular badge', file: 'logos/png/badge-circular/800px.png' },
];

let count = 0;
for (const { alt, file } of targets) {
  const buf = fs.readFileSync(path.join(root, file));
  const dataUri = `data:image/png;base64,${buf.toString('base64')}`;
  const re = new RegExp(`(src=")[^"]*(" alt="${alt}")`);
  if (!re.test(html)) { console.log('NOT FOUND:', alt); continue; }
  html = html.replace(re, `$1${dataUri}$2`);
  count++;
}

fs.writeFileSync(path.join(root, 'style-guide.html'), html);
console.log(`Refreshed ${count} images. New size: ${(fs.statSync(path.join(root, 'style-guide.html')).size / 1024).toFixed(0)} KB`);
