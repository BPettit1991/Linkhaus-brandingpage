const sharp = require('sharp');
const fs = require('fs');

(async () => {
  fs.mkdirSync('logos/png/badge-circular', { recursive: true });
  const svgBuffer = fs.readFileSync('logos/svg/jrm-badge-circular-black-gold.svg');
  for (const w of [180, 400, 800, 1600, 3000]) {
    await sharp(svgBuffer, { density: 300 }).resize(w, w).png().toFile(`logos/png/badge-circular/${w}px.png`);
    console.log('wrote', `logos/png/badge-circular/${w}px.png`);
  }
  console.log('Badge rasterization complete.');
})();
