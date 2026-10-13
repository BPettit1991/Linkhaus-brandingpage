"""Synthesise the JRM film / sting soundtrack from a cue sheet.

usage: python3 soundtrack.py cues.json out.wav

Everything is generated here (no samples, no licensed music), so the track is
royalty free. Sound palette: a warm minor pad, 50 Hz mains hum (Australian
grid frequency), a muted pulse, whooshes on wipes, a crackling strike and a sub
impact when the bolt lands.
"""
import json, sys, wave
import numpy as np

SR = 48000
rng = np.random.default_rng(42)


def t_axis(d):
    return np.arange(int(d * SR)) / SR


def env_ad(n, a, d):
    """attack/decay envelope, a and d in seconds"""
    t = np.arange(n) / SR
    e = np.where(t < a, t / max(a, 1e-4), np.exp(-(t - a) / max(d, 1e-4)))
    return e


def lowpass_fast(x, cutoff):
    """FFT brick-ish low-pass with a soft knee, for long buffers."""
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / (1 + (f / cutoff) ** 4)
    return np.fft.irfft(X, len(x))


def bandpass_fast(x, lo, hi):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= (1 / (1 + (f / hi) ** 4)) * (1 / (1 + (lo / np.maximum(f, 1)) ** 4))
    return np.fft.irfft(X, len(x))


def place(buf, clip, at, gain=1.0):
    i = int(at * SR)
    if i < 0:  # cue starts before 0: trim the head of the clip
        clip, i = clip[-i:], 0
    if i >= len(buf) or len(clip) == 0:
        return
    j = min(len(buf), i + len(clip))
    buf[i:j] += clip[: j - i] * gain


# ---- instruments -----------------------------------------------------------
def pad(d):
    t = t_axis(d)
    # A minor-ish drone: A1, E2, A2, C3 with slow detune and filter swell
    notes = [55.0, 82.41, 110.0, 130.81, 164.81]
    amps = [0.55, 0.30, 0.28, 0.12, 0.08]
    x = np.zeros_like(t)
    for f, a in zip(notes, amps):
        for det in (-0.25, 0.25):
            ph = 2 * np.pi * (f + det) * t + rng.uniform(0, 6.28)
            # soft saw from a few harmonics
            x += a * (np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.15 * np.sin(3 * ph))
    x = lowpass_fast(x, 900)
    x *= 0.8 + 0.2 * np.sin(2 * np.pi * 0.07 * t)
    return x / np.max(np.abs(x))


def hum(d):
    t = t_axis(d)
    x = sum(a * np.sin(2 * np.pi * 50 * k * t) for k, a in [(1, 1), (2, 0.5), (3, 0.3), (5, 0.12)])
    x *= 0.7 + 0.3 * np.sin(2 * np.pi * 0.23 * t)
    return x / np.max(np.abs(x))


def kick():
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    f = 42 + 90 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 7.5)


def tick():
    n = int(0.06 * SR)
    x = bandpass_fast(rng.standard_normal(n), 6000, 12000)
    return x / np.max(np.abs(x)) * env_ad(n, 0.001, 0.012)


def whoosh(d=0.6):
    n = int(d * SR)
    t = np.arange(n) / SR
    x = rng.standard_normal(n)
    # sweep a band from low to high and back via short-time filtering in chunks
    out = np.zeros(n)
    chunk = 2048
    for i in range(0, n, chunk):
        k = i / n
        c = 300 + 5000 * np.sin(np.pi * k) ** 2
        seg = x[i:i + chunk]
        out[i:i + chunk] = bandpass_fast(seg, c * 0.5, c * 1.5)
    e = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2
    return out / (np.max(np.abs(out)) + 1e-9) * e


def riser(d):
    n = int(d * SR)
    t = np.arange(n) / SR
    k = t / d
    x = rng.standard_normal(n)
    out = np.zeros(n)
    chunk = 4096
    for i in range(0, n, chunk):
        c = 400 + 7000 * (i / n) ** 2
        out[i:i + chunk] = bandpass_fast(x[i:i + chunk], c * 0.6, c * 1.4)
    tone = np.sin(2 * np.pi * np.cumsum(110 + 330 * k ** 2) / SR) * 0.35
    return (out / (np.max(np.abs(out)) + 1e-9) + tone) * k ** 2.2


def strike():
    n = int(1.4 * SR)
    t = np.arange(n) / SR
    # crackle: sparse random clicks, dense at start
    crack = np.zeros(n)
    dens = np.exp(-t * 5)
    hits = rng.random(n) < 0.012 * dens
    crack[hits] = rng.uniform(-1, 1, hits.sum())
    crack = bandpass_fast(crack, 1500, 14000) * 6
    # zap: descending buzzy tone
    f = 1800 * np.exp(-t * 6) + 90
    ph = 2 * np.pi * np.cumsum(f) / SR
    zap = np.sign(np.sin(ph)) * 0.35 * np.exp(-t * 7)
    zap = lowpass_fast(zap, 5000)
    # air burst
    burst = bandpass_fast(rng.standard_normal(n), 800, 9000) * np.exp(-t * 14) * 0.8
    x = crack + zap + burst
    return x / np.max(np.abs(x))


def impact():
    n = int(2.8 * SR)
    t = np.arange(n) / SR
    f = 32 + 60 * np.exp(-t * 9)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.6)
    body = lowpass_fast(rng.standard_normal(n), 400) * np.exp(-t * 6) * 0.5
    x = sub + body
    return x / np.max(np.abs(x))


def slam():
    n = int(0.5 * SR)
    t = np.arange(n) / SR
    k = kick()[:n] if len(kick()) >= n else np.pad(kick(), (0, n - len(kick())))
    snap = bandpass_fast(rng.standard_normal(n), 1200, 8000) * np.exp(-t * 30)
    x = k + 0.6 * snap
    return x / np.max(np.abs(x))


def shimmer():
    n = int(1.6 * SR)
    t = np.arange(n) / SR
    x = np.zeros(n)
    for f in (1318.5, 1760, 2637):
        x += np.sin(2 * np.pi * f * t + rng.uniform(0, 6.28)) * (0.5 + 0.5 * np.sin(2 * np.pi * 7 * t))
    return x / np.max(np.abs(x)) * np.sin(np.pi * np.clip(t / 1.6, 0, 1)) ** 2


def rise_note():
    """soft tonal swell under the letters"""
    n = int(1.6 * SR)
    t = np.arange(n) / SR
    x = sum(np.sin(2 * np.pi * f * t) for f in (220, 329.63, 440)) / 3
    return x * env_ad(n, 0.08, 0.7)


def reverb(x, decay=1.6, mix=0.25):
    """cheap convolution reverb with a noise impulse"""
    n = int(decay * SR)
    ir = rng.standard_normal(n) * np.exp(-np.arange(n) / SR * (6.9 / decay))
    ir = lowpass_fast(ir, 5000)
    ir /= np.sqrt(np.sum(ir ** 2))
    L = len(x) + n - 1
    size = 1 << (L - 1).bit_length()
    wet = np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(ir, size), size)[: len(x)]
    return x * (1 - mix) + wet * mix


# ---- mix -----------------------------------------------------------------
def build(c):
    D = c["duration"]
    n = int(D * SR)
    music = np.zeros(n)
    fxbus = np.zeros(n)

    t = t_axis(D)
    fade_in = np.clip(t / 1.5, 0, 1)
    fade_out = np.clip((D - t) / 1.2, 0, 1)
    music += pad(D) * 0.22 * fade_in * fade_out
    music += hum(D) * 0.035 * fade_in * fade_out

    kk, tk = kick(), tick()
    for i, b in enumerate(c.get("beats", [])):
        place(music, kk, b, 0.42)
        place(music, tk, b + 0.25, 0.10)
        if i % 4 == 2:
            place(music, tk, b + 0.125, 0.05)

    w = whoosh()
    for at in c.get("whoosh", []):
        place(fxbus, w, at - 0.2, 0.30)
    for a, b in c.get("riser", []):
        place(fxbus, riser(b - a), a, 0.22)
    if "wire" in c:
        a, b = c["wire"]
        d = b - a
        tt = np.arange(int(d * SR)) / SR
        buzz = np.sin(2 * np.pi * 50 * tt) + 0.5 * np.sin(2 * np.pi * 100 * tt) + 0.3 * np.sign(np.sin(2 * np.pi * 150 * tt))
        crackle = np.zeros_like(tt)
        hits = rng.random(len(tt)) < 0.004
        crackle[hits] = rng.uniform(-1, 1, hits.sum())
        crackle = bandpass_fast(crackle, 2000, 12000) * 4
        e = np.sin(np.pi * np.clip(tt / d, 0, 1)) ** 0.5
        place(fxbus, (lowpass_fast(buzz, 1200) * 0.25 + crackle * 0.5) * e, a, 0.35)
    for at in c.get("slam", []):
        place(fxbus, slam(), at, 0.55)
    for at in c.get("ticks", []):
        place(fxbus, tk, at, 0.35)
        place(fxbus, tk, at + 0.3, 0.25)
    for at in c.get("strike", []):
        place(fxbus, strike(), at - 0.02, 0.75)
    for at in c.get("impact", []):
        place(fxbus, impact(), at, 0.9)
    for at in c.get("rise", []):
        place(music, rise_note(), at, 0.18)
    for at in c.get("shimmer", []):
        place(fxbus, shimmer(), at, 0.10)

    mix = reverb(music, 2.2, 0.3) + reverb(fxbus, 1.4, 0.18)
    # gentle soft clip and normalise to -1 dBFS peak
    mix = np.tanh(mix * 1.2) / np.tanh(1.2)
    mix *= 10 ** (-1 / 20) / np.max(np.abs(mix))
    # tiny stereo width: slightly delayed and filtered right channel for the pad
    left = mix
    right = np.roll(mix, int(0.004 * SR)) * 0.96 + mix * 0.04
    return np.stack([left, right], axis=1)


if __name__ == "__main__":
    cues = json.load(open(sys.argv[1]))
    st = build(cues)
    pcm = (np.clip(st, -1, 1) * 32767).astype("<i2")
    with wave.open(sys.argv[2], "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print("wrote", sys.argv[2])
