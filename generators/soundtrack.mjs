// Synthesises an original soundtrack for a film timeline: a warm minor pad, a soft pulse, whooshes
// into each scene change and a sub impact when the logo lands. No samples or licensed music, so
// the result is royalty free. video.mjs normalises it to -14 LUFS / -1 dBTP with ffmpeg.
import { writeFileSync } from 'node:fs';

const SR = 48000;

// Deterministic noise so every build of the same brand gives the same track.
function rng(seed = 42) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1; }

export function synth({ duration, cuts = [], cues = [], bpm = 96, key = 57 }) {
  const n = Math.ceil(duration * SR);
  const L = new Float32Array(n), R = new Float32Array(n);
  const noise = rng();
  const hz = (m) => 440 * 2 ** ((m - 69) / 12);

  // Pad: minor chord pairs, detuned saws through a one-pole low-pass, slow swell in and out.
  const chords = [[0, 3, 7, 12], [-4, 0, 3, 8], [-2, 2, 5, 10], [-5, -1, 2, 7]];
  const bar = (60 / bpm) * 4;
  let lpL = 0, lpR = 0;
  const phases = new Float64Array(16);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const ch = chords[Math.floor(t / (bar * 2)) % chords.length];
    let l = 0, r = 0;
    ch.forEach((st, j) => {
      const f = hz(key - 12 + st);
      for (const [k, det] of [[0, -0.12], [1, 0.12]]) {
        const idx = j * 2 + k;
        phases[idx] = (phases[idx] + (f * 2 ** (det / 12)) / SR) % 1;
        const v = 2 * phases[idx] - 1;
        if (k === 0) l += v; else r += v;
      }
    });
    const cutoff = 0.02 + 0.015 * Math.sin((t / duration) * Math.PI);
    lpL += cutoff * (l - lpL); lpR += cutoff * (r - lpR);
    const env = Math.min(1, t / 1.2) * Math.min(1, (duration - t) / 1.5);
    L[i] += lpL * 0.09 * env; R[i] += lpR * 0.09 * env;
  }

  // Pulse: a soft low thump on each beat once the first scene change has happened.
  const beat = 60 / bpm;
  const pulseFrom = cuts[0] ?? duration * 0.2;
  for (let b = Math.ceil(pulseFrom / beat) * beat; b < duration - 0.8; b += beat) {
    const start = Math.floor(b * SR), len = Math.floor(0.25 * SR);
    for (let k = 0; k < len && start + k < n; k++) {
      const t = k / SR, f = 55 + 70 * Math.exp(-t * 30);
      const v = Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 14) * 0.22;
      L[start + k] += v; R[start + k] += v;
    }
  }

  // Whoosh: band-limited noise swelling into each cut.
  for (const c of cuts) {
    const len = Math.floor(0.5 * SR), start = Math.floor(c * SR) - len;
    let lp = 0;
    for (let k = 0; k < len; k++) {
      const i = start + k; if (i < 0 || i >= n) continue;
      const p = k / len, x = noise();
      lp += (0.05 + 0.25 * p) * (x - lp);
      const v = lp * p ** 2 * 0.5;
      L[i] += v * (1 - p * 0.5); R[i] += v * (0.5 + p * 0.5);
    }
  }

  // Impact: sub drop plus a short crackle when the logo lands.
  for (const c of cues) {
    const start = Math.floor(c * SR), len = Math.floor(1.6 * SR);
    let lp = 0;
    for (let k = 0; k < len && start + k < n; k++) {
      const t = k / SR, f = 38 + 50 * Math.exp(-t * 9);
      lp += 0.3 * (noise() - lp);
      const v = Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 2.6) * 0.75 + lp * Math.exp(-t * 18) * 0.5;
      L[start + k] += v; R[start + k] += v;
    }
  }
  return { L, R };
}

// 16-bit stereo WAV.
export function writeWav(file, { L, R }) {
  const n = L.length, buf = Buffer.alloc(44 + n * 4);
  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  const g = peak > 0.98 ? 0.98 / peak : 1;
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 4, 4); buf.write('WAVE', 8); buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) { buf.writeInt16LE(Math.round(L[i] * g * 32767), 44 + i * 4); buf.writeInt16LE(Math.round(R[i] * g * 32767), 46 + i * 4); }
  writeFileSync(file, buf);
}
