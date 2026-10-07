// Renders the brand film and logo sting to MP4 in three aspect ratios.
// Frames come from film-page.cjs (Chromium), are piped to ffmpeg as JPEG,
// and muxed with a soundtrack synthesised from the same cue sheet.
//   node media/build-video.cjs            all
//   node media/build-video.cjs film15     one mode (sting | film | film15 | film15cred)
// Needs ffmpeg with libx264 on PATH and python3 with numpy.
const fs = require('fs');
const path = require('path');
const { spawn, execFileSync } = require('child_process');
const { chromium } = require('playwright');
const L = require('./lib.cjs');
const { filmHtml, cues, CUTS, STING } = require('./film-page.cjs');

const FPS = 30;
const BASE = { sting: 'jrm-logo-sting-6s', film: 'jrm-brand-film-30s', film15: 'jrm-brand-film-15s', film15cred: 'jrm-brand-film-15s-credentials' };
// About -14 LUFS integrated at -1 dBTP, the level Instagram, Facebook, TikTok and YouTube play at.
// The compressor and limiter tame the bolt-strike transient first; without them the
// true-peak ceiling stops loudnorm short at about -16.5 LUFS.
const AUDIO_CHAIN = 'acompressor=threshold=-20dB:ratio=4:attack=3:release=150:makeup=2,alimiter=limit=0.85:attack=1:release=60,loudnorm=I=-14:TP=-1:LRA=11';
const FORMATS = [['16x9', 1920, 1080], ['9x16', 1080, 1920], ['1x1', 1080, 1080]];
const OUT = L.rel('video');
const TMP = path.join(require('os').tmpdir(), 'jrm-video');
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(TMP, { recursive: true });

function ffmpeg(args) {
  const p = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((res, rej) => p.on('close', (c) => (c ? rej(new Error('ffmpeg ' + c)) : res())));
  return { stdin: p.stdin, done };
}

async function renderOne(b, mode, [tag, w, h], wav) {
  const dur = mode === 'sting' ? STING.duration : CUTS[mode].duration;
  const frames = Math.round(dur * FPS);
  const name = `${BASE[mode]}-${tag}`;
  const pg = await b.newPage({ viewport: { width: w, height: h } });
  pg.on('pageerror', (e) => { throw e; });
  await pg.setContent(filmHtml(mode, w, h), { waitUntil: 'load' });
  await pg.evaluate(() => document.fonts.ready);
  const out = path.join(OUT, `${name}.mp4`);
  const ff = ffmpeg([
    '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-i', wav,
    // Capped VBR keeps grain intact but files social-upload sized (~40 MB per 30s at 1080p).
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '19', '-maxrate', w * h > 1.5e6 ? '11M' : '8M', '-bufsize', '22M',
    '-pix_fmt', 'yuv420p', '-profile:v', 'high',
    '-af', AUDIO_CHAIN, '-ar', '48000', '-c:a', 'aac', '-b:a', '256k', '-shortest', '-movflags', '+faststart', out,
  ]);
  const t0 = Date.now();
  for (let i = 0; i < frames; i++) {
    await pg.evaluate(([t, f]) => render(t, f), [i / FPS, i]);
    const buf = await pg.screenshot({ type: 'jpeg', quality: 96 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % 150 === 0) process.stdout.write(`  ${name} ${i}/${frames}\r`);
  }
  ff.stdin.end();
  await ff.done;
  await pg.close();
  console.log(`wrote video/${name}.mp4 (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  // poster frame for web embeds and thumbnails
  const posterT = dur - (mode === 'sting' ? 0.5 : 1);
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-ss', String(posterT), '-i', out, '-frames:v', '1', '-q:v', '2', path.join(OUT, 'posters', `${name}.jpg`)]);
}

(async () => {
  const only = process.argv[2];
  fs.mkdirSync(path.join(OUT, 'posters'), { recursive: true });
  fs.mkdirSync(path.join(OUT, 'audio'), { recursive: true });
  const b = await chromium.launch();
  for (const mode of Object.keys(BASE)) {
    if (only && only !== mode) continue;
    const cueFile = path.join(TMP, `${mode}-cues.json`);
    fs.writeFileSync(cueFile, JSON.stringify(cues(mode)));
    const wav = path.join(OUT, 'audio', `${BASE[mode]}-soundtrack.wav`);
    execFileSync('python3', [path.join(__dirname, 'soundtrack.py'), cueFile, wav], { stdio: 'inherit' });
    for (const fmt of FORMATS) await renderOne(b, mode, fmt, wav);
  }
  await b.close();
})();
