// Renders the brand film (30 s and 15 s) and the 6 s logo sting to MP4 at 16:9, 9:16 and 1:1, with
// a poster frame for each and the soundtrack master. Frames come from film.mjs (Chromium), are piped
// to ffmpeg as JPEG, and muxed with the synthesised soundtrack.
//   node generators/video.mjs                 everything
//   node generators/video.mjs sting film15    only these cuts (sting | film15 | film30)
//   node generators/video.mjs --formats 16x9  only this aspect
// Needs ffmpeg with libx264 on PATH.
import { spawn } from 'node:child_process';
import { mkdirSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { KIT, PREFIX, browser, close } from './lib.mjs';
import { filmHtml, timeline } from './film.mjs';
import { synth, writeWav } from './soundtrack.mjs';

const FPS = 30;
const NAMES = { sting: 'logo-sting-6s', film15: 'brand-film-15s', film30: 'brand-film-30s' };
const FORMATS = { '16x9': [1920, 1080], '9x16': [1080, 1920], '1x1': [1080, 1080] };
// About -14 LUFS integrated at -1 dBTP: the level Instagram, Facebook, TikTok and YouTube play at.
const AUDIO = 'acompressor=threshold=-20dB:ratio=4:attack=3:release=150:makeup=2,alimiter=limit=0.85:attack=1:release=60,loudnorm=I=-14:TP=-1:LRA=11';

function ffmpeg(args) {
  const p = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: ['pipe', 'inherit', 'inherit'] });
  return { stdin: p.stdin, done: new Promise((res, rej) => p.on('close', (c) => (c ? rej(new Error(`ffmpeg exited ${c}`)) : res()))) };
}
const write = (stream, buf) => new Promise((res) => (stream.write(buf) ? res() : stream.once('drain', res)));

export async function video({ cuts = Object.keys(NAMES), formats = Object.keys(FORMATS) } = {}) {
  const outDir = join(KIT, 'video'), posters = join(outDir, 'posters'), tmp = join(tmpdir(), `brand-video-${process.pid}`);
  mkdirSync(posters, { recursive: true }); mkdirSync(tmp, { recursive: true });
  for (const cut of cuts) {
    const tl = timeline(cut);
    // Soundtrack master (kept in the kit) and a working copy for muxing.
    const wav = join(outDir, `${PREFIX}${NAMES[cut]}-soundtrack.wav`);
    writeWav(wav, synth(tl));
    console.log('wrote', `kit/video/${PREFIX}${NAMES[cut]}-soundtrack.wav`);
    for (const fmt of formats) {
      const [w, h] = FORMATS[fmt];
      const name = `${PREFIX}${NAMES[cut]}-${fmt}`;
      const page = await (await browser()).newPage({ viewport: { width: w, height: h } });
      await page.setContent(filmHtml(cut, w, h), { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      const ff = ffmpeg(['-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-i', wav,
        '-af', AUDIO, '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-maxrate', '20M', '-bufsize', '40M', '-pix_fmt', 'yuv420p',
        '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest', '-movflags', '+faststart', join(outDir, `${name}.mp4`)]);
      const frames = Math.round(tl.duration * FPS);
      for (let f = 0; f < frames; f++) {
        await page.evaluate((t) => window.render(t), f / FPS);
        await write(ff.stdin, await page.screenshot({ type: 'jpeg', quality: 92 }));
      }
      ff.stdin.end();
      await ff.done;
      // Poster: the end card once everything has settled.
      await page.evaluate((t) => window.render(t), tl.duration - 0.6);
      await page.screenshot({ path: join(posters, `${name}.jpg`), type: 'jpeg', quality: 90 });
      await page.close();
      console.log('wrote', `kit/video/${name}.mp4 (+ poster)`);
    }
  }
  if (existsSync(tmp)) rmSync(tmp, { recursive: true, force: true });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const fi = args.indexOf('--formats');
  const formats = fi >= 0 ? args[fi + 1].split(',') : undefined;
  const cuts = args.filter((a) => NAMES[a]);
  await video({ cuts: cuts.length ? cuts : undefined, formats });
  await close();
}
