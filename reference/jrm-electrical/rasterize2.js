const sharp = require('sharp');
const fs = require('fs');

const jobs = [
  { src: 'logos/svg/jrm-logo-full-light-bg.svg', dir: 'logos/png/full-logo-for-light-bg', sizes: [500, 1000, 2000, 4000] },
  { src: 'logos/svg/jrm-logo-full-dark-bg.svg', dir: 'logos/png/full-logo-for-dark-bg', sizes: [500, 1000, 2000, 4000] },
  { src: 'logos/svg/jrm-icon-only-light-bg.svg', dir: 'logos/png/icon-only-for-light-bg', sizes: [64, 128, 256, 512, 1024, 2048] },
  { src: 'logos/svg/jrm-icon-only-dark-bg.svg', dir: 'logos/png/icon-only-for-dark-bg', sizes: [64, 128, 256, 512, 1024, 2048] },
];

(async () => {
  for (const job of jobs) {
    fs.mkdirSync(job.dir, { recursive: true });
    const svgBuffer = fs.readFileSync(job.src);
    const meta = await sharp(svgBuffer).metadata();
    const aspect = meta.height / meta.width;
    for (const w of job.sizes) {
      const h = Math.round(w * aspect);
      const out = `${job.dir}/${w}px.png`;
      await sharp(svgBuffer, { density: 300 }).resize(w, h).png().toFile(out);
      console.log('wrote', out);
    }
  }
  await sharp('logos/svg/jrm-icon-only-light-bg.svg', { density: 300 }).resize(32, 32).png().toFile('logos/png/favicon-32.png');
  await sharp('logos/svg/jrm-icon-only-light-bg.svg', { density: 300 }).resize(180, 180).flatten({ background: '#FFFFFF' }).png().toFile('logos/png/apple-touch-icon-180-white-bg.png');
  console.log('Done.');
})();
