// Traces a raster logo (JPG/PNG) into a clean vector SVG, one filled layer per brand colour.
// Each colour is masked from the image (pixels within --tolerance of it), upscaled and traced with
// potrace, so curves stay smooth and counters (the holes in O, A, R) stay open.
//
//   node generators/trace.mjs source/logo.jpg --colors "#1B1A1B,#A67939" --out kit/logos/svg/acme-logo-light-bg.svg
//   node generators/trace.mjs source/logo.png --colors "#FFFFFF,#A67939" --map "#1B1A1B=#FFFFFF" --out …-dark-bg.svg
//
// --colors     colours to trace, as they appear in the image (anything else is background)
// --map        recolour on output, e.g. dark ink -> white for the dark-background version
// --tolerance  colour distance 0-441 (default 60); raise it for JPEG noise, lower it for close colours
// --scale      upscale before tracing (default 4) for smoother curves from small sources
// Check the result at 100% and 400% before using it. Never redesign the mark without approval.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const sharp = require('sharp');
const potrace = require('potrace');

const hex = (h) => h.replace('#', '').match(/../g).map((x) => parseInt(x, 16));

export async function trace(src, { colors, map = {}, tolerance = 60, scale = 4, turdSize = 8 }) {
  const img = sharp(src).ensureAlpha();
  const meta = await img.metadata();
  const W = meta.width * scale, H = meta.height * scale;
  const { data } = await img.resize(W, H, { kernel: 'lanczos3' }).raw().toBuffer({ resolveWithObject: true });
  const layers = [];
  let x0 = W, y0 = H, x1 = 0, y1 = 0;
  for (const color of colors) {
    const [r, g, b] = hex(color);
    const mask = Buffer.alloc(W * H);
    for (let i = 0, p = 0; p < W * H; p++, i += 4) {
      const d = Math.hypot(data[i] - r, data[i + 1] - g, data[i + 2] - b);
      const hit = data[i + 3] > 128 && d <= tolerance;
      mask[p] = hit ? 0 : 255; // black = traced
      if (hit) { const x = p % W, y = (p / W) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
    const png = await sharp(mask, { raw: { width: W, height: H, channels: 1 } }).png().toBuffer();
    const svg = await new Promise((res, rej) => potrace.trace(png, { turdSize, optTolerance: 0.4, threshold: 128 }, (e, s) => (e ? rej(e) : res(s))));
    const d = (svg.match(/ d="([^"]+)"/) || [])[1];
    if (d) layers.push(`<path d="${d}" fill="${map[color.toUpperCase()] || color.toUpperCase()}" fill-rule="evenodd"/>`);
  }
  // Crop to the artwork with a small margin.
  const pad = Math.round(Math.max(x1 - x0, y1 - y0) * 0.02);
  const vb = layers.length ? `${x0 - pad} ${y0 - pad} ${x1 - x0 + pad * 2} ${y1 - y0 + pad * 2}` : `0 0 ${W} ${H}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">\n${layers.join('\n')}\n</svg>\n`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const opt = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
  const src = args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));
  const colors = (opt('colors') || '').split(',').map((s) => s.trim()).filter(Boolean);
  const outFile = opt('out');
  if (!src || !colors.length || !outFile) { console.error('Usage: node generators/trace.mjs <image> --colors "#000000,#A67939" --out kit/logos/svg/<name>.svg [--map "#000000=#FFFFFF"] [--tolerance 60] [--scale 4]'); process.exit(1); }
  const map = Object.fromEntries((opt('map') || '').split(',').filter(Boolean).map((p) => p.split('=').map((s) => s.trim().toUpperCase())));
  const svg = await trace(src, { colors, map, tolerance: Number(opt('tolerance', 60)), scale: Number(opt('scale', 4)) });
  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, svg);
  console.log('wrote', outFile, '- check it at 100% and 400% against the source.');
}
