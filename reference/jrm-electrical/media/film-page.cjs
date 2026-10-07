// Builds the HTML page that draws one frame of the JRM brand film or logo
// sting for any time t. render(t) is pure: the same t always gives the same
// frame, so the renderer can step frame by frame with no real-time animation.
const L = require('./lib.cjs');
const { C, BIZ } = L;

const IMG = {
  switchboard: L.imgData(L.rel('_build/media/img/switchboard-1200.webp')),
  aircon: L.imgData(L.rel('_build/media/img/aircon-1200.webp')),
  solar: L.imgData(L.rel('_build/media/img/solar-1200.webp')),
  battery: L.imgData(L.rel('_build/media/img/battery-1200.webp')),
};

const SERVICES = [
  { n: '01', tag: 'Electrical', img: 'switchboard', lines: ['Switchboards.', 'Lighting.', 'Power.'], sub: 'Safety switches, fault finding and new circuits for homes and businesses.' },
  { n: '02', tag: 'Air con & refrigeration', img: 'aircon', lines: ['Split.', 'Ducted.', 'Commercial.'], sub: 'Air conditioning and refrigeration, installed and serviced. ARC authorised.' },
  { n: '03', tag: 'Solar', img: 'solar', lines: ['Power', 'from your', 'roof.'], sub: 'Solar systems designed and installed by an SAA-accredited electrician.' },
  { n: '04', tag: 'Battery storage', img: 'battery', lines: ['Store the sun.', 'Use it', 'at night.'], sub: 'Home batteries sized to how you actually use power.' },
];

// Film timelines (seconds). intro and trust are optional scenes; the sting uses only the logo build.
const svcRun = (start, len) => SERVICES.map((s, i) => [start + i * len, start + (i + 1) * len]);
const CUTS = {
  // 30 s: wire intro, WIRED RIGHT., four services at 3 s, credentials, logo and CTA.
  film: { duration: 30, intro: [0, 3.2], wired: [3.2, 6.4], services: svcRun(6.4, 3), trust: [18.4, 23.2], logo: 23.2, wipe: 0.5, beat: 0.5 },
  // 15 s ad cut: opens on WIRED RIGHT., services at 1.75 s, straight to logo and CTA.
  // The credentials scene is dropped, so the licence line joins the CTA instead.
  film15: { duration: 15, intro: null, wired: [0, 2.0], services: svcRun(2.0, 1.75), trust: null, logo: 9.0, wipe: 0.4, beat: 0.4375, licLine: true },
  // 15 s credentials cut (version B): two services (Electrical, Solar), then LICENSED. INSURED. LOCAL.
  film15cred: { duration: 15, intro: null, wired: [0, 1.8], services: svcRun(1.8, 1.8).slice(0, 2), svcIdx: [0, 2], trust: [5.4, 9.0], spec: [1.0, 0.4], logo: 9.0, wipe: 0.4, beat: 0.45 },
};
const STING = { duration: 6, logo: 0 };

// Logo-build local times (seconds after the logo scene starts).
const LB = { brackets: [0.15, 1.0], strike: 1.0, letters: 1.3, sub: [2.0, 2.6] };

function logoSvg() {
  const P = L.parts;
  const path = (list, fill) => list.map((x) => `<path d="${x.d}" fill="${fill}"${x.evenodd ? ' fill-rule="evenodd"' : ''}/>`).join('');
  return `<svg id="logo" viewBox="10 17 1957 1921" xmlns="http://www.w3.org/2000/svg" overflow="visible">
  <defs>
    <linearGradient id="gShine" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="2048" y2="700">
      <stop id="s0" offset="0" stop-color="${C.gold}"/><stop id="s1" offset="0" stop-color="${C.gold}"/>
      <stop id="s2" offset="0" stop-color="#F3DDA8"/><stop id="s3" offset="0" stop-color="${C.gold}"/>
      <stop offset="1" stop-color="${C.gold}"/>
    </linearGradient>
    <clipPath id="cBolt"><rect id="cBoltR" x="700" y="100" width="600" height="0"/></clipPath>
    <clipPath id="cWord"><rect x="0" y="1200" width="2048" height="545"/></clipPath>
  </defs>
  <g id="gBL">${path(P.bracketL, C.white)}</g>
  <g id="gBR">${path(P.bracketR, C.white)}</g>
  <g clip-path="url(#cBolt)"><g id="gBolt">${path(P.bolt, 'url(#gShine)')}</g></g>
  <g clip-path="url(#cWord)">
    <g id="gJ">${path(P.J, C.white)}</g><g id="gR">${path(P.R, 'url(#gShine)')}</g><g id="gM">${path(P.M, C.white)}</g>
  </g>
  <g id="gSub">${path(P.sub, C.white)}</g>
</svg>`;
}

const CSS = `
body{background:${C.ink};color:${C.text}}
#stage{position:absolute;inset:0;overflow:hidden}
canvas{position:absolute;inset:0;width:100%;height:100%}
#bg{z-index:0}#fx{z-index:100;pointer-events:none}
.card{position:absolute;inset:0;display:none}
.u{--u:calc(var(--s) * 1px)}
.mask{display:block;overflow:hidden;padding-bottom:.06em;margin-bottom:-.06em}
.mask>span{display:block;will-change:transform}
.lbl{font-family:"IBM Plex Mono",monospace;font-weight:500;letter-spacing:.22em;text-transform:uppercase;color:${C.goldLight}}
.big{font-family:Archivo,sans-serif;font-weight:900;font-stretch:72%;text-transform:uppercase;line-height:.9;letter-spacing:-.005em}
.steel{background:linear-gradient(180deg,#fff 0%,#E4E3E4 40%,#8F8E91 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
.outline{color:transparent;-webkit-text-stroke:calc(var(--s)*2.4px) rgba(212,178,116,.9)}
.goldt{background:linear-gradient(135deg,${C.goldLight} 0%,${C.gold} 60%,${C.goldDeep} 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
.sub{font-family:Poppins,sans-serif;color:${C.muted};line-height:1.45}

/* intro */
#introLbl{position:absolute;left:0;right:0;text-align:center;top:40%;font-size:calc(var(--s)*26px)}
/* wired right */
#wired{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
#wired .big{font-size:calc(var(--s)*var(--wiredSize)*1px)}
#wiredSub{margin-top:calc(var(--s)*40px);font-size:calc(var(--s)*24px)}
/* cards that wipe in must be opaque so the outgoing card never shows through */
.svc,#trust{background:radial-gradient(ellipse at 50% 46%,rgba(166,121,57,.10),rgba(0,0,0,0) 60%),#161516}
/* services */
.svc .img{position:absolute;overflow:hidden}
.svc .img img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transform-origin:50% 45%}
.svc .img::after{content:"";position:absolute;inset:0}
.svc .txt{position:absolute}
.svc .num{font-size:calc(var(--s)*24px);margin-bottom:calc(var(--s)*26px);display:flex;gap:calc(var(--s)*18px);align-items:center}
.svc .num i{display:inline-block;height:2px;width:calc(var(--s)*70px);background:${C.gold}}
.svc .big{font-size:calc(var(--s)*var(--svcSize)*1px);color:#fff}
.svc .sub{font-size:calc(var(--s)*30px);margin-top:calc(var(--s)*34px);max-width:calc(var(--s)*var(--subW)*1px)}
/* trust */
#trust{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;padding:0 calc(var(--s)*var(--padX)*1px)}
#trust .big{font-size:calc(var(--s)*var(--trustSize)*1px)}
#specs{margin-top:calc(var(--s)*56px);display:grid;gap:calc(var(--s)*18px)}
.spec{font-family:"IBM Plex Mono",monospace;font-size:calc(var(--s)*var(--specSize)*1px);letter-spacing:.08em;text-transform:uppercase;color:${C.text};display:flex;align-items:center;gap:calc(var(--s)*22px);border-top:1px solid ${C.line};padding-top:calc(var(--s)*18px)}
.spec b{color:${C.goldLight};font-weight:500;margin-left:auto}
.spec svg{width:calc(var(--s)*30px);height:calc(var(--s)*30px);flex:none}
#ghost{position:absolute;opacity:.10;right:calc(var(--s)*-60px);top:50%;height:calc(var(--s)*900px);transform:translateY(-50%)}
#ghost svg{height:100%;width:auto;display:block}
.f916 #ghost{right:-30%;top:22%;height:calc(var(--s)*1000px)}
.f11 #ghost{right:-22%;height:calc(var(--s)*800px)}
/* logo */
#logoWrap{position:absolute;left:50%;top:50%;transform-origin:50% 50%}
#logo{display:block;width:100%;height:100%}
#tag{position:absolute;left:0;right:0;text-align:center}
#tag .rule{height:calc(var(--s)*3px);margin:0 auto calc(var(--s)*26px);background:linear-gradient(90deg,transparent,${C.gold} 20%,${C.goldLight} 50%,${C.gold} 80%,transparent)}
#tag .big{font-size:calc(var(--s)*var(--tagSize)*1px)}
#cta{position:absolute;left:0;right:0;text-align:center}
#cta .lbl{font-size:calc(var(--s)*24px)}
#cta .phone{font-size:calc(var(--s)*var(--phoneSize)*1px);margin:calc(var(--s)*18px) 0 calc(var(--s)*14px)}
#cta .web{font-family:Poppins,sans-serif;font-weight:500;color:#fff;font-size:calc(var(--s)*var(--webSize)*1px);letter-spacing:.02em}
#cta .lic{margin-top:calc(var(--s)*10px)}
#cta .areas{font-family:"IBM Plex Mono",monospace;color:${C.muted};font-size:calc(var(--s)*20px);letter-spacing:.2em;text-transform:uppercase;margin-top:calc(var(--s)*26px)}

/* ---- format variants ---- */
.f169{--wiredSize:300;--svcSize:124;--subW:640;--trustSize:190;--padX:170;--specSize:30;--tagSize:64;--phoneSize:150;--webSize:36}
.f169 .svc .img{left:46%;right:0;top:0;bottom:0}
.f169 .svc .img::after{background:linear-gradient(90deg,${C.ink} 0%,rgba(27,26,27,.55) 22%,rgba(27,26,27,0) 50%),linear-gradient(0deg,rgba(27,26,27,.6),rgba(27,26,27,0) 30%)}
.f169 .svc .txt{left:calc(var(--s)*150px);top:50%;transform:translateY(-50%)}
.f169 #specs{max-width:calc(var(--s)*1100px)}

.f916{--wiredSize:260;--svcSize:124;--subW:860;--trustSize:190;--padX:90;--specSize:27;--tagSize:64;--phoneSize:150;--webSize:38}
.f916 .svc .img{left:0;right:0;top:0;height:60%}
.f916 .svc .img::after{background:linear-gradient(0deg,${C.ink} 0%,rgba(27,26,27,0) 45%)}
.f916 .svc .txt{left:calc(var(--s)*90px);right:calc(var(--s)*90px);top:54%}
.f916 #introLbl{font-size:calc(var(--s)*24px);padding:0 8%;line-height:1.8}

.f11{--wiredSize:250;--svcSize:118;--subW:560;--trustSize:150;--padX:90;--specSize:23;--tagSize:54;--phoneSize:120;--webSize:32}
.f11 .svc .img{left:28%;right:0;top:0;bottom:0}
.f11 .svc .img::after{background:linear-gradient(90deg,${C.ink} 0%,rgba(27,26,27,.7) 28%,rgba(27,26,27,0) 65%),linear-gradient(0deg,rgba(27,26,27,.7),rgba(27,26,27,0) 35%)}
.f11 .svc .txt{left:calc(var(--s)*80px);bottom:calc(var(--s)*90px)}
.f11 #introLbl{font-size:calc(var(--s)*22px)}
`;

const tick = `<svg viewBox="0 0 24 24" fill="none" stroke="${C.goldLight}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l8.66 5v10L12 22l-8.66-5V7z" stroke="${C.gold}" stroke-width="1.6"/><path d="M8 12.5l2.6 2.6L16.2 9.5"/></svg>`;

function body(mode) {
  const svc = SERVICES.map((s, i) => `
  <div class="card svc" id="svc${i}">
    <div class="img"><img src="${IMG[s.img]}"></div>
    <div class="txt">
      <div class="num lbl"><span class="type" data-text="${s.n} / ${s.tag}"></span><i></i></div>
      <div class="big">${s.lines.map((l) => `<span class="mask"><span>${l}</span></span>`).join('')}</div>
      <div class="sub">${s.sub}</div>
    </div>
  </div>`).join('');
  const film = mode !== 'sting';
  const cut = CUTS[mode] || {};
  return `<div id="stage">
  <canvas id="bg"></canvas>
  ${film ? `${cut.intro ? `
  <div class="card" id="intro"><div id="introLbl" class="lbl"><span class="type" data-text="${BIZ.areas.join(' · ')}"></span></div></div>` : ''}
  <div class="card" id="wiredCard"><div id="wired">
    <div class="big"><span class="mask"><span class="steel">Wired</span></span></div>
    <div class="big outline"><span class="mask"><span>Right.</span></span></div>
    <div id="wiredSub" class="lbl"><span class="type" data-text="Licensed electrical contractor · NSW"></span></div>
  </div></div>
  ${svc}
  <div class="card" id="trust" data-d="flex">
    <div id="ghost">${L.svgIcon('mono-gold')}</div>
    <div class="big">
      <span class="mask"><span class="steel">Licensed.</span></span>
      <span class="mask"><span class="steel">Insured.</span></span>
      <span class="mask"><span class="goldt">Local.</span></span>
    </div>
    <div id="specs">
      <div class="spec">${tick}<span class="type" data-text="NSW Electrical Licence"></span><b class="type" data-text="375111C"></b></div>
      <div class="spec">${tick}<span class="type" data-text="SAA Accreditation"></span><b class="type" data-text="S5949175"></b></div>
      <div class="spec">${tick}<span class="type" data-text="ARC Authorisation"></span><b class="type" data-text="AU61554"></b></div>
    </div>
  </div>` : ''}
  <div class="card" id="logoCard">
    <div id="logoWrap">${logoSvg()}</div>
    <div id="tag"><div class="rule"></div><div class="big"><span class="mask"><span class="steel">Wired right.</span></span></div></div>
    ${film ? `<div id="cta">
      <div class="lbl"><span class="type" data-text="Free quotes"></span></div>
      <div class="phone big"><span class="mask"><span class="goldt">${BIZ.phone}</span></span></div>
      <div class="web">${BIZ.web}</div>
      <div class="areas">${BIZ.areas.join(' · ')}</div>
      ${cut.licLine ? '<div class="areas lic">Licensed &amp; insured · NSW Lic. 375111C</div>' : ''}
    </div>` : ''}
  </div>
  <canvas id="fx"></canvas>
</div>`;
}

// Runs in the browser. Kept as a function so it can be stringified into the page.
function runtime(CFG) {
  const W = innerWidth, H = innerHeight, S = Math.min(W, H) / 1080;
  const { mode, T, LB } = CFG;
  document.documentElement.style.setProperty('--s', S);
  const $ = (q) => document.querySelector(q);
  const $$ = (q, r = document) => [...r.querySelectorAll(q)];
  const bg = $('#bg'), fx = $('#fx');
  for (const c of [bg, fx]) { c.width = W; c.height = H; }
  const g = bg.getContext('2d'), f = fx.getContext('2d');

  // ---- maths ----
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const prog = (t, a, b) => clamp((t - a) / (b - a));
  const lerp = (a, b, k) => a + (b - a) * k;
  const eOut3 = (k) => 1 - Math.pow(1 - k, 3);
  const eOutX = (k) => (k >= 1 ? 1 : 1 - Math.pow(2, -10 * k));
  const eIO3 = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
  const eOutBack = (k) => { const c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
  function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  // ---- static noise & dust ----
  const grain = document.createElement('canvas'); grain.width = grain.height = 256;
  { const gc = grain.getContext('2d'), id = gc.createImageData(256, 256), r = rng(7); for (let i = 0; i < id.data.length; i += 4) { const v = r() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; } gc.putImageData(id, 0, 0); }
  const dust = []; { const r = rng(11); for (let i = 0; i < 110; i++) dust.push({ x: r(), y: r(), s: 0.6 + r() * 2.2, v: 0.004 + r() * 0.018, a: 0.08 + r() * 0.35, gold: r() < 0.35, ph: r() * 6.28 }); }

  // ---- typed text ----
  if (T && T.svcIdx) T.svcIdx.forEach((k, j) => { const el = $(`#svc${k} .type`); el.dataset.text = el.dataset.text.replace(/^\d\d/, String(j + 1).padStart(2, '0')); });
  const typers = $$('.type').map((el) => ({ el, text: el.dataset.text }));
  function type(el, k) { const t = el.dataset.text; const n = Math.round(t.length * clamp(k)); el.textContent = t.slice(0, n) + (k > 0 && k < 1 ? '▌' : ''); if (k <= 0) el.innerHTML = '&nbsp;'; }
  const masks = (root) => $$('.mask>span', root);
  function rise(spans, t, t0, stagger = 0.08, dur = 0.55) {
    spans.forEach((s, i) => { const k = eOut3(prog(t, t0 + i * stagger, t0 + i * stagger + dur)); s.style.transform = `translateY(${(1 - k) * 110}%)`; });
  }
  const show = (el, on) => { el.style.display = on ? (el.dataset.d || 'block') : 'none'; };

  // ---- background ----
  function drawBg(t, p) {
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    g.fillStyle = '#161516'; g.fillRect(0, 0, W, H);
    // warm core glow
    const gr = g.createRadialGradient(W / 2, H * 0.46, 0, W / 2, H * 0.46, Math.max(W, H) * 0.62);
    gr.addColorStop(0, `rgba(166,121,57,${0.20 * p.glow})`); gr.addColorStop(0.45, `rgba(166,121,57,${0.05 * p.glow})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    // perspective floor grid, drifting towards camera
    if (p.grid > 0) {
      const hz = H * 0.64, vx = W / 2;
      g.lineWidth = Math.max(1, S * 1.2);
      for (let i = -24; i <= 24; i++) {
        const xb = vx + i * W * 0.085;
        const lg = g.createLinearGradient(0, hz, 0, H); lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(1, `rgba(255,255,255,${0.085 * p.grid})`);
        g.strokeStyle = lg; g.beginPath(); g.moveTo(vx, hz); g.lineTo(xb, H); g.stroke();
      }
      const N = 14;
      for (let k = 0; k < N; k++) {
        const d = ((k + t * 0.55) % N) / N, y = hz + (H - hz) * d * d;
        g.strokeStyle = `rgba(255,255,255,${0.085 * p.grid * d})`; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke();
      }
      // faint concentric rings behind the centre, as on the site
      g.strokeStyle = `rgba(166,121,57,${0.10 * p.grid})`; g.lineWidth = Math.max(1, S * 1.5);
      for (const r of [0.30, 0.42]) { g.beginPath(); g.arc(W / 2, H * 0.46, Math.min(W, H) * r, 0, 6.283); g.stroke(); }
    }
    // dust
    for (const d of dust) {
      const y = ((d.y - t * d.v) % 1 + 1) % 1, x = d.x + Math.sin(t * 0.4 + d.ph) * 0.004;
      g.fillStyle = d.gold ? `rgba(212,178,116,${d.a * p.dust})` : `rgba(255,255,255,${d.a * 0.6 * p.dust})`;
      g.beginPath(); g.arc(x * W, y * H, d.s * S, 0, 6.283); g.fill();
    }
  }
  // Grain and vignette go on the fx layer so they sit over the photos too.
  function drawFinish(frame, fade) {
    f.globalCompositeOperation = 'source-over';
    const vg = f.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.hypot(W, H) * 0.62);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)');
    f.fillStyle = vg; f.fillRect(0, 0, W, H);
    const r = rng(1000 + frame); f.globalAlpha = 0.04; f.globalCompositeOperation = 'overlay';
    const ox = Math.floor(r() * 256), oy = Math.floor(r() * 256);
    for (let x = -ox; x < W; x += 256) for (let y = -oy; y < H; y += 256) f.drawImage(grain, x, y);
    f.globalAlpha = 1; f.globalCompositeOperation = 'source-over';
    if (fade > 0) { f.fillStyle = `rgba(0,0,0,${fade})`; f.fillRect(0, 0, W, H); }
  }

  // ---- electric fx ----
  function bolt(x1, y1, x2, y2, r, spread, depth) {
    // midpoint displacement lightning
    let pts = [[x1, y1], [x2, y2]];
    for (let d = 0; d < depth; d++) {
      const np = [pts[0]];
      for (let i = 1; i < pts.length; i++) {
        const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
        const len = Math.hypot(bx - ax, by - ay), nx = -(by - ay) / len, ny = (bx - ax) / len, o = (r() - 0.5) * spread * len;
        np.push([(ax + bx) / 2 + nx * o, (ay + by) / 2 + ny * o], pts[i]);
      }
      pts = np;
    }
    return pts;
  }
  function strokePts(pts, w, col, blur) {
    f.save(); f.shadowColor = col; f.shadowBlur = blur; f.strokeStyle = col; f.lineWidth = w; f.lineJoin = 'round';
    f.beginPath(); pts.forEach(([x, y], i) => (i ? f.lineTo(x, y) : f.moveTo(x, y))); f.stroke(); f.restore();
  }
  // Ballistic sparks emitted from a point over [t0, t1]; closed form so any t is reproducible.
  function sparks(t, t0, t1, count, origin, seed, { speed = 900, life = 0.7, grav = 1400, up = 0 } = {}) {
    const r = rng(seed);
    for (let i = 0; i < count; i++) {
      const born = lerp(t0, t1, r()), ang = r() * 6.283, sp = (0.3 + r() * 0.7) * speed * S, lf = life * (0.5 + r() * 0.8), gold = r() < 0.6;
      const [ox, oy] = typeof origin === 'function' ? origin(born) : origin;
      const age = t - born; if (age < 0 || age > lf) continue;
      const vx = Math.cos(ang) * sp, vy = Math.sin(ang) * sp - up * S;
      const x = ox + vx * age, y = oy + vy * age + 0.5 * grav * S * age * age;
      const px = ox + vx * (age - 0.02), py = oy + vy * (age - 0.02) + 0.5 * grav * S * (age - 0.02) ** 2;
      const a = 1 - age / lf;
      f.strokeStyle = gold ? `rgba(255,214,140,${a})` : `rgba(255,255,255,${a})`; f.lineWidth = 2.2 * S * a + 0.5;
      f.beginPath(); f.moveTo(px, py); f.lineTo(x, y); f.stroke();
    }
  }

  // ---- logo ----
  const wrap = $('#logoWrap'), boltClip = $('#cBoltR');
  const gBL = $('#gBL'), gBR = $('#gBR'), gJ = $('#gJ'), gR = $('#gR'), gM = $('#gM'), gSub = $('#gSub');
  const stops = ['#s1', '#s2', '#s3'].map($);
  const LOGO_AR = 1957 / 1921;
  function logoMap(x, y) { const r = wrap.getBoundingClientRect(); const s = r.width / 1957; return [r.left + (x - 10) * s, r.top + (y - 17) * s]; }
  function drawLogo(lt, layout) {
    // layout: {h, cy} in px, scale anim handled by caller
    const h = layout.h, w = h * LOGO_AR;
    wrap.style.width = w + 'px'; wrap.style.height = h + 'px';
    wrap.style.transform = `translate(-50%,-50%) translateY(${layout.dy}px) scale(${layout.scale})`;
    const kb = eOutX(prog(lt, LB.brackets[0], LB.brackets[1]));
    gBL.setAttribute('transform', `translate(${-620 * (1 - kb)} ${-120 * (1 - kb)})`);
    gBR.setAttribute('transform', `translate(${620 * (1 - kb)} ${120 * (1 - kb)})`);
    gBL.style.opacity = gBR.style.opacity = clamp(kb * 1.6);
    const kbolt = eOut3(prog(lt, LB.strike, LB.strike + 0.12));
    boltClip.setAttribute('height', 900 * kbolt);
    [gJ, gR, gM].forEach((el, i) => { const k = eOut3(prog(lt, LB.letters + i * 0.1, LB.letters + i * 0.1 + 0.55)); el.setAttribute('transform', `translate(0 ${560 * (1 - k)})`); });
    const ks = eOut3(prog(lt, LB.sub[0], LB.sub[1]));
    gSub.style.opacity = ks; gSub.setAttribute('transform', `translate(988 1880) scale(${1 + 0.12 * (1 - ks)} 1) translate(-988 -1880)`);
    // gold shine sweep across bolt and R
    const sh = prog(lt, 3.6, 4.6), c = lerp(-0.25, 1.25, eIO3(sh));
    stops[0].setAttribute('offset', clamp(c - 0.12)); stops[1].setAttribute('offset', clamp(c)); stops[2].setAttribute('offset', clamp(c + 0.12));
  }
  function logoFx(lt, t) {
    const ts = LB.strike;
    if (lt < ts - 0.05 || lt > ts + 1.6) return 0;
    const top = logoMap(1131, 148), tip = logoMap(848, 990), mid = logoMap(990, 570);
    const a = lt - ts;
    // arcs crackle for 0.5s, re-seeded every frame for flicker
    if (a >= 0 && a < 0.5) {
      const r = rng(Math.floor(t * 30) * 13 + 5), k = 1 - a / 0.5;
      const reach = Math.min(W, H) * 0.34;
      for (let i = 0; i < 5; i++) {
        const from = r() < 0.5 ? top : tip, ang = r() * 6.283, d = reach * (0.4 + r() * 0.6);
        const pts = bolt(from[0], from[1], from[0] + Math.cos(ang) * d, from[1] + Math.sin(ang) * d, r, 0.55, 5);
        strokePts(pts, 3.2 * S * k, `rgba(212,178,116,${0.8 * k})`, 26 * S); strokePts(pts, 1.3 * S * k, `rgba(255,255,255,${k})`, 8 * S);
      }
      // the strike itself, sky to bolt
      if (a < 0.16) {
        const pts = bolt(top[0] + (r() - 0.5) * 40 * S, -20, mid[0], mid[1], r, 0.35, 6);
        strokePts(pts, 5 * S, 'rgba(255,236,190,.9)', 40 * S); strokePts(pts, 2 * S, '#fff', 10 * S);
      }
    }
    sparks(lt, ts, ts + 0.12, 70, tip, 21, { speed: 1100, life: 1.0, grav: 1600 });
    sparks(lt, ts, ts + 0.08, 40, top, 22, { speed: 800, life: 0.8, grav: 1600 });
    // flash
    const fl = a >= 0 ? Math.exp(-a * 14) * 0.45 : 0;
    if (fl > 0.01) { f.fillStyle = `rgba(255,244,220,${fl})`; f.fillRect(0, 0, W, H); }
    return a >= 0 && a < 0.4 ? (1 - a / 0.4) : 0; // shake amount
  }

  // ---- scene helpers ----
  const cards = {};
  $$('.card').forEach((c) => (cards[c.id] = c));
  function wipeClip(el, k) {
    // diagonal "/" reveal matching the bolt angle; k 0..1
    const s = 22; const a = lerp(-s, 100, k);
    el.style.clipPath = k >= 1 ? 'none' : `polygon(0 0, ${a + s}% 0, ${a}% 100%, 0 100%)`;
    return a;
  }
  function wipeEdge(k) {
    if (k <= 0 || k >= 1) return;
    const s = 22, a = lerp(-s, 100, k);
    const x0 = (a + s) / 100 * W, x1 = a / 100 * W;
    f.save(); f.shadowColor = 'rgba(212,178,116,.9)'; f.shadowBlur = 30 * S; f.strokeStyle = '#E9CD92'; f.lineWidth = 5 * S;
    f.beginPath(); f.moveTo(x0, 0); f.lineTo(x1, H); f.stroke(); f.restore();
  }

  function logoLayout(lt) {
    const u = S;
    const land = eIO3(prog(lt, 3.0, 3.7));
    if (CFG.film) {
      const base = W > H ? 560 * u : 620 * u;
      const small = W > H ? 380 * u : (W < H ? 500 * u : 360 * u);
      const up = W > H ? -250 * u : (W < H ? -380 * u : -250 * u);
      return { h: lerp(base, small, land), dy: lerp(0, up, land), scale: 1 + 0.02 * Math.sin(lt * 0.8) * 0 };
    }
    const base = W < H ? 620 * u : 600 * u, up = W < H ? -120 * u : -90 * u;
    return { h: base, dy: lerp(0, up, land), scale: 1 };
  }

  window.render = function (t, frame) {
    f.setTransform(1, 0, 0, 1, 0, 0); f.clearRect(0, 0, W, H);
    Object.values(cards).forEach((c) => show(c, false));
    let p = { glow: 1, grid: 1, dust: 1 }, shake = 0, fade = 0;

    if (CFG.film) {
      // 1. intro: area label types, a live wire runs across the frame
      if (!T.intro) fade = Math.max(fade, 1 - prog(t, 0, 0.2));
      if (T.intro && t < T.intro[1] + 0.1) {
        show(cards.intro, true);
        p = { glow: 0.3 + 0.4 * prog(t, 0, 3), grid: 0.5 * prog(t, 0.2, 2), dust: prog(t, 0, 1) };
        const lbl = $('#intro .type'); type(lbl, prog(t, 0.3, 1.5));
        $('#introLbl').style.opacity = 1 - prog(t, 2.7, 3.1);
        const y = H * 0.56, x0 = W * 0.06, x1 = W * 0.94, k = eIO3(prog(t, 0.7, 2.7)), hx = lerp(x0, x1, k);
        const out = 1 - prog(t, 2.8, 3.2);
        if (k > 0 && out > 0) {
          f.save(); f.globalAlpha = out; const lg = f.createLinearGradient(x0, 0, hx, 0);
          lg.addColorStop(0, 'rgba(127,92,43,0)'); lg.addColorStop(0.5, 'rgba(166,121,57,.9)'); lg.addColorStop(1, '#F3DDA8');
          f.shadowColor = 'rgba(212,178,116,.8)'; f.shadowBlur = 18 * S; f.strokeStyle = lg; f.lineWidth = 3 * S;
          f.beginPath(); f.moveTo(x0, y); f.lineTo(hx, y); f.stroke();
          f.fillStyle = '#fff'; f.shadowBlur = 30 * S; f.beginPath(); f.arc(hx, y, 5 * S, 0, 6.283); f.fill(); f.restore();
        }
        const headAt = (tt) => [lerp(x0, x1, eIO3(prog(tt, 0.7, 2.7))), y];
        if (out > 0) sparks(t, 0.75, 2.7, 90, headAt, 5, { speed: 420, life: 0.55, grav: 1500, up: 200 });
      }
      // 2. WIRED RIGHT.
      if (t > T.wired[0] - 0.1 && t < T.services[0][0] + T.wipe / 2) {
        const c = cards.wiredCard; show(c, true);
        const lt = t - T.wired[0];
        p = { glow: 0.8, grid: 0.9, dust: 1 };
        rise(masks(c), lt, 0.0, 0.3, 0.6);
        $('#wired').style.transform = `scale(${1 + 0.045 * prog(lt, 0, T.wired[1] - T.wired[0] + 0.2)})`;
        type($('#wiredSub .type'), prog(lt, 0.9, 1.8));
        if (lt < 0.25) shake = 0.35 * (1 - lt / 0.25);
      }
      // 3. services
      T.services.forEach(([a, b], i) => {
        const next = T.services[i + 1] ? T.services[i + 1][0] : T.trust ? T.trust[0] : T.logo;
        if (t < a - T.wipe / 2 || t > next + T.wipe / 2) return;
        const c = cards['svc' + (T.svcIdx ? T.svcIdx[i] : i)]; show(c, true); c.style.zIndex = 10 + i;
        const k = prog(t, a - T.wipe / 2, a + T.wipe / 2); wipeClip(c, eIO3(k)); wipeEdge(eIO3(k));
        const lt = t - a;
        p = { glow: 0.5, grid: 0.35, dust: 0.6 };
        const img = c.querySelector('img');
        const len = b - a + 0.3;
        img.style.transform = `scale(${lerp(1.14, 1.02, eOut3(prog(lt, -0.3, len)))}) translateX(${lerp(1.5, -1.5, prog(lt, -0.3, len))}%)`;
        type(c.querySelector('.type'), prog(lt, 0.1, 0.7));
        rise(masks(c), lt, 0.15, 0.09, 0.55);
        const sub = c.querySelector('.sub'); const ks = eOut3(prog(lt, 0.6, 1.1));
        sub.style.opacity = ks; sub.style.transform = `translateY(${(1 - ks) * 20 * S}px)`;
        c.querySelector('.num i').style.width = `${70 * S * eOut3(prog(lt, 0.4, 1.0))}px`;
      });
      // 4. licensed / insured / local
      if (!T.trust && t < T.logo) fade = Math.max(fade, prog(t, T.logo - 0.3, T.logo));
      if (T.trust && t > T.trust[0] - T.wipe / 2 && t < T.trust[1] + 0.05) {
        const c = cards.trust; show(c, true); c.style.zIndex = 20;
        const k = prog(t, T.trust[0] - T.wipe / 2, T.trust[0] + T.wipe / 2); wipeClip(c, eIO3(k)); wipeEdge(eIO3(k));
        const lt = t - T.trust[0];
        p = { glow: 0.7, grid: 0.8, dust: 1 };
        rise(masks(c), lt, 0.2, 0.32, 0.45);
        $('#ghost').style.transform = `translateY(-50%) rotate(${lerp(-6, 4, prog(lt, 0, 4.8))}deg) scale(${lerp(1.08, 1, eOut3(prog(lt, 0, 4.8)))})`;
        $$('.spec', c).forEach((row, i) => {
          const [s0, sg] = T.spec || [1.4, 0.55], t0 = s0 + i * sg; row.style.opacity = prog(lt, t0 - 0.1, t0 + 0.1);
          const [a, b] = row.querySelectorAll('.type'); type(a, prog(lt, t0, t0 + 0.35)); type(b, prog(lt, t0 + 0.3, t0 + 0.5));
          row.querySelector('svg').style.transform = `scale(${eOutBack(prog(lt, t0, t0 + 0.3))})`;
        });
        [0, 1, 2].forEach((i) => { const d = lt - (0.2 + i * 0.32); if (d > 0 && d < 0.18) shake = Math.max(shake, 0.25 * (1 - d / 0.18)); });
        fade = Math.max(fade, prog(t, T.trust[1] - 0.35, T.trust[1]));
      }
    }

    // 5. logo build (film end card, or the whole sting)
    const L0 = CFG.film ? CFG.T.logo : 0;
    if (t >= L0) {
      const lt = t - L0, c = cards.logoCard; show(c, true); c.style.zIndex = 30;
      p = { glow: 0.5 + 0.7 * Math.exp(-Math.max(0, lt - LB.strike) * 2) * (lt > LB.strike ? 1 : 0) + 0.3 * prog(lt, 0, 1), grid: prog(lt, 0, 1.2), dust: 1 };
      if (CFG.film) fade = Math.max(fade, 1 - prog(lt, 0, 0.25));
      const lay = logoLayout(lt); drawLogo(lt, lay);
      const tag = $('#tag'), cta = $('#cta');
      if (CFG.film) {
        tag.style.display = 'none';
        const lh = lay.h, ctaTop = H / 2 + lay.dy + lh / 2 + 40 * S;
        cta.style.top = ctaTop + 'px';
        type(cta.querySelector('.type'), prog(lt, 3.4, 3.8));
        rise(masks(cta), lt, 3.55, 0, 0.55);
        const w = cta.querySelector('.web'), ar = cta.querySelector('.areas');
        w.style.opacity = eOut3(prog(lt, 3.9, 4.4));
        cta.querySelectorAll('.areas').forEach((el, i) => (el.style.opacity = eOut3(prog(lt, 4.2 + i * 0.2, 4.7 + i * 0.2))));
        fade = Math.max(fade, prog(t, CFG.duration - 0.45, CFG.duration));
      } else {
        const lh = lay.h; tag.style.top = (H / 2 + lay.dy + lh / 2 + 44 * S) + 'px';
        const k = eOut3(prog(lt, 3.1, 3.8));
        tag.querySelector('.rule').style.width = `${420 * S * k}px`;
        rise(masks(tag), lt, 3.3, 0, 0.55);
      }
      shake = Math.max(shake, logoFx(lt, t));
    }

    drawBg(t, p);
    if (shake > 0) { const r = rng(frame * 7 + 3), a = 14 * S * shake; $('#stage').style.transform = `translate(${(r() - 0.5) * a}px,${(r() - 0.5) * a}px)`; }
    else $('#stage').style.transform = '';
    drawFinish(frame, fade);
  };
}

function filmHtml(mode, w, h) {
  const fmt = w > h ? 'f169' : w < h ? 'f916' : 'f11';
  const film = mode !== 'sting', T = CUTS[mode];
  const cfg = { mode, film, T, LB, duration: film ? T.duration : STING.duration };
  return L.page(body(mode), { w, h, css: CSS, bg: C.ink })
    .replace('<body>', () => `<body class="${fmt}">`)
    .replace('</body>', () => `<script>(${runtime.toString()})(${JSON.stringify(cfg)});</script></body>`);
}

// Audio cue sheet, used by the soundtrack synth so hits land on the picture.
function cues(mode) {
  if (mode === 'sting') {
    return { duration: STING.duration, whoosh: [LB.brackets[0]], strike: [LB.strike], rise: [LB.letters], shimmer: [3.6], impact: [LB.strike], riser: [], beats: [], pad: [0, STING.duration] };
  }
  const F = CUTS[mode], L0 = F.logo;
  const svcStarts = F.services.map((s) => s[0]);
  const beatsEnd = (F.trust ? F.trust[1] : L0) - 0.3;
  const beats = []; for (let t = F.wired[0]; t < beatsEnd; t += F.beat) beats.push(+t.toFixed(4)); // services land on the beat
  const c = {
    duration: F.duration,
    whoosh: [...svcStarts.map((s) => s - F.wipe / 2), L0 + LB.brackets[0]],
    slam: [F.wired[0], F.wired[0] + 0.3],
    ticks: [],
    riser: [[L0 - 1.2, L0 + LB.strike]],
    strike: [L0 + LB.strike], impact: [L0 + LB.strike], rise: [L0 + LB.letters], shimmer: [L0 + 3.6],
    beats, pad: [0, F.duration],
  };
  if (F.intro) { c.wire = [0.7, 2.7]; c.riser.unshift([1.6, F.wired[0]]); }
  if (F.trust) {
    c.whoosh.splice(svcStarts.length, 0, F.trust[0] - F.wipe / 2);
    c.slam.push(F.trust[0] + 0.2, F.trust[0] + 0.52, F.trust[0] + 0.84);
    const [s0, sg] = F.spec || [1.4, 0.55];
    c.ticks = [0, 1, 2].map((i) => F.trust[0] + s0 + i * sg);
  }
  return c;
}

module.exports = { filmHtml, cues, CUTS, STING };
