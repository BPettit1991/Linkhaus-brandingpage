// Social, digital and print collateral, rendered from HTML with the traced
// marks and self-hosted fonts. PNG for screens, vector PDF for print.
//   node media/build-static.cjs
const L = require('./lib.cjs');
const P = require('./premium.cjs');
const { C, BIZ } = L;

const IMG = {
  switchboard: L.imgData(L.rel('_build/media/img/switchboard-1200.webp')),
  aircon: L.imgData(L.rel('_build/media/img/aircon-1200.webp')),
  solar: L.imgData(L.rel('_build/media/img/solar-1200.webp')),
  battery: L.imgData(L.rel('_build/media/img/battery-1200.webp')),
  qr: L.imgData(L.rel('_build/media/img/qr-review.png')),
};
const out = (...p) => L.rel(...p);

const icon = (t = 'dark') => L.svgIcon(t, { attrs: 'style="display:block;height:100%;width:auto"' });
const horiz = (t = 'dark') => L.svgHorizontal(t, { attrs: 'style="display:block;height:100%;width:auto"' });
const stacked = (t = 'dark') => L.svgStacked(t, { attrs: 'style="display:block;height:100%;width:auto"' });

// Dark surface with the site's engineering grid, perspective floor and gold glow.
const SURFACE = `
.surface{position:absolute;inset:0;background:${C.ink};overflow:hidden}
.surface::before{content:"";position:absolute;inset:0;background:
 radial-gradient(ellipse at var(--gx,50%) var(--gy,42%),rgba(166,121,57,.22),rgba(166,121,57,0) 55%),
 linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px) 0 0/var(--grid,56px) var(--grid,56px),
 linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px) 0 0/var(--grid,56px) var(--grid,56px)}
.surface::after{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at 50% 50%,rgba(0,0,0,0) 45%,rgba(0,0,0,.5) 100%)}
.z{position:relative;z-index:2}
.btn{display:inline-flex;align-items:center;gap:.5em;background:linear-gradient(135deg,${C.goldLight},${C.gold} 60%,${C.goldDeep});color:${C.ink};font-family:Archivo,sans-serif;font-weight:700;font-stretch:112%;text-transform:uppercase;letter-spacing:.12em}
.lbl{font-family:"IBM Plex Mono",monospace;font-weight:500;text-transform:uppercase;letter-spacing:.22em;color:${C.goldLight}}
.muted{color:${C.muted}}
`;
const pg = (body, w, h, css = '') => L.page(P.defsSvg() + body, { w, h, css: SURFACE + css, bg: C.ink });

// The badge's backdrop (ghost mark, honeycomb, chevron, streaks, flares) sized to any canvas.
// Returns HTML for the layer under the content and the flares that sit over it.
function premium(w, h, o = {}) {
  return P.backdropSvg(w, h, { hr: Math.max(w, h) / 50, ...o });
}
// Medallion icon as inline HTML at a pixel (or any CSS unit) size.
const med = (name, size, gs) => P.iconSvg(name, `width:${size};height:${size}`, gs);
// Metallic gold hairline rule.
const metalRule = (css) => `<div style="height:2px;background:linear-gradient(90deg,rgba(166,121,57,0),${C.goldLight} 20%,#F3DDA8 50%,${C.goldLight} 80%,rgba(166,121,57,0));${css}"></div>`;

// ---------------------------------------------------------------- social ---
async function social() {
  // Profile pictures: icon centred inside the circle-safe zone (inner 70%).
  for (const [name, bg, theme] of [['dark', C.ink, 'dark'], ['light', '#FFFFFF', 'light'], ['gold', C.gold, 'mono-white']]) {
    const html = pg(`<div class="surface" style="${bg !== C.ink ? `background:${bg}` : ''}"></div>
      <div class="z" style="position:absolute;inset:0;display:grid;place-items:center"><div style="height:560px">${icon(theme)}</div></div>`, 1080, 1080,
      bg !== C.ink ? `.surface::before,.surface::after{display:none}` : '');
    await L.png(html, out('social/profile', `jrm-profile-${name}-1080.png`), { w: 1080, h: 1080, omitBackground: false });
  }

  // Covers. Key content is kept inside each platform's safe area.
  const cover = (w, h, { logoH, left, tagSize, showPhone = true, align = 'center', padR = 0 }) => {
    const bd = premium(w, h, {
      id: 'cv',
      ghost: { x: w * 0.03, y: h * 0.08, h: h * 0.85 },
      honey: [{ cx: w * 0.12, cy: h * 0.8, rx: w * 0.16, ry: h * 0.45 }, { cx: w * 0.88, cy: h * 0.2, rx: w * 0.14, ry: h * 0.4 }],
      chevron: align === 'right' ? null : { cx: w - h * 0.03 - h * 0.62, cy: h / 2, r: h * 0.62, band: h * 0.07, stroke: h / 600 },
      streaks: { x: -w * 0.02, y: h * 0.1 - h * 0.55, k: h / 1300 },
      flares: [['apex', 0, h / 55, 0], [w * 0.07, h * 0.85, h / 70, 52]],
    });
    return pg(`${bd.under}
    <div class="z" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:${align === 'right' ? 'flex-end' : 'center'};gap:${h * 0.09}px;padding-right:${padR}px">
      <div style="height:${logoH}px">${horiz('dark')}</div>
      <div style="width:2px;height:${logoH * 0.9}px;background:linear-gradient(${C.goldLight},${C.gold},${C.goldDeep})"></div>
      <div>
        <div class="display steel-text" style="font-size:${tagSize}px">Wired right.</div>
        ${showPhone ? `<div class="lbl" style="font-size:${tagSize * 0.2}px;margin-top:${tagSize * 0.18}px">${BIZ.areas.join(' · ')}</div>
        <div style="display:flex;align-items:center;gap:${tagSize * 0.14}px;margin-top:${tagSize * 0.14}px">${med('phone', `${tagSize * 0.55}px`, 1.3)}<span class="display gold-text" style="font-size:${tagSize * 0.55}px;font-stretch:80%">${BIZ.phone}</span></div>` : ''}
      </div>
    </div>${bd.over}`, w, h);
  };
  const covers = [
    ['facebook-cover-1640x624', 1640, 624, { logoH: 190, tagSize: 120 }],
    ['linkedin-banner-1584x396', 1584, 396, { logoH: 130, tagSize: 86, align: 'right', padR: 90 }],
    ['x-header-1500x500', 1500, 500, { logoH: 150, tagSize: 96, align: 'right', padR: 110 }],
    ['youtube-banner-2560x1440', 2560, 1440, { logoH: 230, tagSize: 150 }],
    ['google-business-cover-1080x608', 1080, 608, { logoH: 150, tagSize: 86 }],
  ];
  for (const [name, w, h, o] of covers) await L.png(cover(w, h, o), out('social/covers', `jrm-${name}.png`), { w, h, omitBackground: false });

  // Portrait posts 1080x1350: one per service, plus trust, review and urgent.
  const services = [
    ['electrical', 'switchboard', '01 / Electrical', ['Switchboards.', 'Lighting.', 'Power.'], 'Safety switches, fault finding and new circuits for homes and businesses.'],
    ['aircon', 'aircon', '02 / Air con & refrigeration', ['Split.', 'Ducted.', 'Commercial.'], 'Air conditioning and refrigeration, installed and serviced. ARC authorised.'],
    ['solar', 'solar', '03 / Solar', ['Power from', 'your roof.'], 'Solar systems designed and installed by an SAA-accredited electrician.'],
    ['battery', 'battery', '04 / Battery storage', ['Store the sun.', 'Use it at night.'], 'Home batteries sized to how you actually use power.'],
  ];
  // Footer shared by every post: metallic rule, horizontal logo, phone in a medallion.
  const postFoot = `<div class="z" style="position:absolute;left:80px;right:80px;bottom:64px">
      ${metalRule('margin-bottom:32px')}
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div style="height:78px">${horiz('dark')}</div>
        <div style="display:flex;align-items:center;gap:16px">${med('phone', '62px', 1.3)}<span class="display gold-text" style="font-size:52px;font-stretch:80%">${BIZ.phone}</span></div>
      </div></div>`;
  const postBg = (o) => premium(1080, 1350, { id: 'po', ...o });
  const svcIcon = { electrical: 'bolt', aircon: 'snowflake', solar: 'solar', battery: 'battery' };
  for (const [slug, img, tag, lines, sub] of services) {
    const bd = postBg({
      // No chevron here: with the photo on top there is no free corner for it.
      honey: [{ cx: 120, cy: 1120, rx: 240, ry: 200 }, { cx: 980, cy: 960, rx: 200, ry: 220, k: 0.7 }],
      flares: [[1000, 780, 11, -32], [60, 1010, 10, 52]],
    });
    const html = pg(`${bd.under}
      <div style="position:absolute;left:0;right:0;top:0;height:780px;overflow:hidden"><img src="${IMG[img]}" style="width:100%;height:100%;object-fit:cover">
        <div style="position:absolute;inset:0;background:linear-gradient(0deg,#0B0B0B 2%,rgba(11,11,11,0) 50%)"></div></div>
      <div class="z" style="position:absolute;left:80px;right:80px;top:600px">
        <div class="lbl" style="font-size:24px;display:flex;align-items:center;gap:20px">${med(svcIcon[slug], '84px')}${tag}<i style="display:inline-block;width:70px;height:2px;background:linear-gradient(90deg,${C.goldLight},rgba(166,121,57,0))"></i></div>
        <div class="display" style="color:#fff;font-size:118px;margin-top:24px">${lines.join('<br>')}</div>
        <div class="body muted" style="font-size:28px;line-height:1.45;margin-top:26px;max-width:800px">${sub}</div>
      </div>${postFoot}${bd.over}`, 1080, 1350);
    await L.png(html, out('social/posts', `jrm-post-${slug}-1080x1350.png`), { w: 1080, h: 1350, omitBackground: false });
  }

  const trustBd = postBg({
    ghost: { x: 520, y: 120, h: 900 },
    honey: [{ cx: 140, cy: 1050, rx: 240, ry: 220 }, { cx: 950, cy: 250, rx: 200, ry: 220 }],
    streaks: { x: -20, y: 180, k: 0.9 },
    flares: [[1010, 330, 13, -32], [110, 960, 11, 52]],
  });
  const trust = pg(`${trustBd.under}
    <div class="z" style="position:absolute;left:80px;right:80px;top:140px">
      <div class="lbl" style="font-size:24px">NSW licensed electrical contractor</div>
      <div class="display" style="font-size:190px;margin-top:30px"><span class="steel-text">Licensed.<br>Insured.</span><br><span class="gold-text">Local.</span></div>
      <div style="margin-top:50px;display:grid;gap:18px" class="mono">
        ${[['NSW Electrical Licence', '375111C'], ['SAA Accreditation', 'S5949175'], ['ARC Authorisation', 'AU61554']].map(([a, b]) => `<div style="display:flex;align-items:center;gap:22px;padding-top:18px;font-size:28px;letter-spacing:.08em;text-transform:uppercase;color:${C.text};border-top:1px solid rgba(212,178,116,.22)">${med('check', '52px')}<span>${a}</span><b style="color:${C.goldLight};font-weight:500;margin-left:auto">${b}</b></div>`).join('')}
      </div></div>${postFoot}${trustBd.over}`, 1080, 1350);
  await L.png(trust, out('social/posts', 'jrm-post-licensed-1080x1350.png'), { w: 1080, h: 1350, omitBackground: false });

  // Review request: shared by the post (1080x1350) and the story (1080x1920, content kept clear of app UI).
  const reviewPage = (h, padTop, footBottom) => {
    const bd = premium(1080, h, {
      id: 'rv',
      ghost: { x: -120, y: h * 0.12, h: h * 0.6, opacity: 0.8 },
      honey: [{ cx: 140, cy: h * 0.72, rx: 220, ry: 240 }, { cx: 960, cy: h * 0.3, rx: 200, ry: 240 }],
      chevron: { cx: 700, cy: h * 0.52, r: 330, band: 40 },
      flares: [['apex', 0, 11, 0], [300, h * 0.06, 8, 20]],
    });
    return pg(`${bd.under}
    <div class="z" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;text-align:center;padding:${padTop}px 80px 0">
      <div class="lbl" style="font-size:24px">Happy with the job?</div>
      <div class="display steel-text" style="font-size:150px;margin-top:30px">Leave us<br>a review.</div>
      <div class="body muted" style="font-size:30px;margin-top:30px;max-width:760px;line-height:1.45">Two minutes on Google helps other locals find a sparky they can trust.</div>
      <div style="margin-top:50px;background:#fff;padding:26px;border-radius:22px;box-shadow:0 0 0 3px ${C.goldLight},0 0 40px rgba(212,178,116,.35)"><img src="${IMG.qr}" style="width:300px;height:300px;image-rendering:pixelated;display:block"></div>
      <div class="lbl" style="font-size:20px;margin-top:24px;color:${C.muted}">Scan with your phone camera</div>
    </div>${postFoot.replace('bottom:64px', `bottom:${footBottom}px`)}${bd.over}`, 1080, h);
  };
  await L.png(reviewPage(1350, 130, 64), out('social/posts', 'jrm-post-review-request-1080x1350.png'), { w: 1080, h: 1350, omitBackground: false });

  const urgentBd = postBg({
    honey: [{ cx: 140, cy: 1060, rx: 240, ry: 220 }, { cx: 960, cy: 260, rx: 200, ry: 240 }],
    chevron: { cx: 790, cy: 300, r: 230, band: 34, ext: 0.35 },
    streaks: { x: -20, y: 150, k: 0.9 },
    flares: [['apex', 0, 12, 0], [110, 930, 11, 52], [360, 90, 8, 20]],
  });
  const urgent = pg(`${urgentBd.under}
    <div class="z" style="position:absolute;inset:0;padding:140px 80px 0">
      <div style="height:250px">${icon('dark')}</div>
      <div class="display" style="font-size:150px;margin-top:56px;color:#fff">Power out?<br><span class="gold-text">Sparks?</span><br>Tripping?</div>
      <div class="body muted" style="font-size:32px;margin-top:36px;max-width:820px;line-height:1.45">We prioritise urgent electrical faults across the Central Coast, Newcastle and Sydney.</div>
    </div>${postFoot}${urgentBd.over}`, 1080, 1350);
  await L.png(urgent, out('social/posts', 'jrm-post-urgent-fault-1080x1350.png'), { w: 1080, h: 1350, omitBackground: false });

  // Stories 1080x1920 (keep 250px clear top and bottom for platform UI).
  const storyBd = premium(1080, 1920, {
    id: 'st',
    ghost: { x: 30, y: 330, h: 620 },
    honey: [{ cx: 150, cy: 1300, rx: 260, ry: 320 }, { cx: 960, cy: 560, rx: 220, ry: 300 }],
    chevron: { cx: 700, cy: 820, r: 380, band: 48 },
    streaks: { x: -10, y: 520, k: 1 },
    flares: [['apex', 0, 13, 0], [150, 1580, 12, 52], [330, 270, 9, 20]],
  });
  const storyCta = pg(`${storyBd.under}
    <div class="z" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:250px 90px">
      <div style="height:540px">${stacked('dark')}</div>
      <div class="display steel-text" style="font-size:96px;margin-top:64px">Wired right.</div>
      ${metalRule('width:520px;margin:44px auto 0')}
      <div class="lbl" style="font-size:24px;margin-top:44px">Free quotes</div>
      <div style="display:flex;align-items:center;gap:22px;margin-top:18px">${med('phone', '112px', 1.3)}<span class="display gold-text" style="font-size:130px;font-stretch:80%">${BIZ.phone}</span></div>
      <div style="display:flex;align-items:center;gap:16px;margin-top:22px">${med('globe', '56px', 1.3)}<span class="body" style="font-size:36px;color:#fff;font-weight:500">${BIZ.web}</span></div>
    </div>${storyBd.over}`, 1080, 1920);
  await L.png(storyCta, out('social/stories', 'jrm-story-cta-1080x1920.png'), { w: 1080, h: 1920, omitBackground: false });
  await L.png(reviewPage(1920, 330, 280), out('social/stories', 'jrm-story-review-1080x1920.png'), { w: 1080, h: 1920, omitBackground: false });

  // Video-call background. Logo sits top-right so it is not hidden by the person.
  const vbg = pg(`<div class="surface" style="--gx:75%;--gy:30%"></div>
    <div style="position:absolute;left:0;right:0;bottom:0;height:45%;background:
      repeating-linear-gradient(90deg,rgba(255,255,255,.04) 0 1px,transparent 1px 120px);transform:perspective(600px) rotateX(58deg);transform-origin:50% 100%"></div>
    <div class="z" style="position:absolute;right:90px;top:80px;height:170px">${horiz('dark')}</div>
    <div class="z lbl" style="position:absolute;right:90px;top:285px;font-size:26px">${BIZ.phone} · ${BIZ.web}</div>`, 1920, 1080);
  await L.png(vbg, out('digital', 'jrm-video-call-background-1920x1080.png'), { w: 1920, h: 1080, omitBackground: false });
}

// ----------------------------------------------------------------- print ---
// Sizes include 3 mm bleed on every side; crop to the trim size given in the name.
const printDoc = (pages, wmm, hmm, css = '') => `<!doctype html><html><head><meta charset="utf-8"><style>${L.BASE_CSS}${SURFACE}
@page{size:${wmm}mm ${hmm}mm;margin:0}
html{text-rendering:geometricPrecision;-webkit-font-smoothing:antialiased}
html,body{width:${wmm}mm;background:#fff}
.page{position:relative;width:${wmm}mm;height:${hmm}mm;overflow:hidden;break-after:page}
.page:last-child{break-after:auto}
.surface::after{display:none}
${css}</style></head><body>${P.defsSvg()}${pages.map((p) => `<div class="page">${p}</div>`).join('')}</body></html>`;

async function print() {
  // Business card 90x55 trim, 96x61 with bleed.
  // Both sides use the badge's backdrop, drawn in a 960x610 space (0.1 mm units).
  const cardBg = (o) => premium(960, 610, { id: 'bc', hr: 17, ...o });
  const frontBd = cardBg({
    ghost: { x: 10, y: 70, h: 400, opacity: 0.9 },
    honey: [{ cx: 140, cy: 480, rx: 200, ry: 170 }, { cx: 840, cy: 140, rx: 170, ry: 150 }],
    chevron: { cx: 668, cy: 305, r: 280, band: 30, stroke: 0.8 },
    streaks: { x: -30, y: 20, k: 0.52 },
    flares: [['apex', 0, 7, 0], [95, 520, 6, 52], [250, 50, 4.5, 20]],
  });
  const svcRow = [['bolt', 'Electrical'], ['snowflake', 'Air con'], ['solar', 'Solar'], ['battery', 'Battery']];
  const cardFront = `${frontBd.under}
    <div class="z" style="position:absolute;left:0;right:0;top:8.5mm;height:22.5mm;display:flex;justify-content:center">${stacked('dark')}</div>
    <div class="z" style="position:absolute;left:28mm;right:28mm;top:34.5mm">${metalRule('height:.35mm')}</div>
    <div class="z" style="position:absolute;left:12mm;right:12mm;top:37mm;display:flex;justify-content:space-between">
      ${svcRow.map(([g, t]) => `<div style="width:17mm;display:flex;flex-direction:column;align-items:center;gap:1.1mm">${med(g, '7.4mm')}<span class="body" style="font-size:2.05mm;font-weight:600;letter-spacing:.07em;text-transform:uppercase;color:#fff">${t}</span></div>`).join('')}
    </div>${frontBd.over}`;

  const backBd = cardBg({
    ghost: { x: 640, y: 150, h: 420, opacity: 0.55 },
    honey: [{ cx: 860, cy: 470, rx: 190, ry: 170 }, { cx: 120, cy: 560, rx: 160, ry: 110, k: 0.5 }],
    chevron: { cx: 668, cy: 305, r: 280, band: 30, stroke: 0.8 },
    flares: [['apex', 0, 7, 0], [880, 60, 4.5, -32]],
  });
  const row = (g, html, gs) => `<div style="display:flex;align-items:center;gap:2.2mm;height:6.1mm">${med(g, '5.2mm', gs)}${html}</div>`;
  const cardBack = `${backBd.under}
    <div class="z" style="position:absolute;left:9mm;top:8mm;height:8.5mm">${horiz('dark')}</div>
    <div class="z" style="position:absolute;left:9mm;width:34mm;top:19mm">${metalRule('height:.3mm;background:linear-gradient(90deg,#D4B274,#F3DDA8 40%,rgba(166,121,57,0))')}</div>
    <div class="z" style="position:absolute;left:9mm;top:21.2mm">
      ${row('phone', `<span class="display gold-text" style="font-size:4.6mm;font-stretch:80%">${BIZ.phone}</span>`, 1.3)}
      ${row('envelope', `<span class="body" style="font-size:2.55mm;color:#fff">${BIZ.email}</span>`, 1.3)}
      ${row('globe', `<span class="body" style="font-size:2.55mm;color:#fff">${BIZ.web}</span>`, 1.3)}
      ${row('pin', `<span class="body" style="font-size:2.55mm;color:#fff">${BIZ.areas.join(', ').replace(/, ([^,]*)$/, ' and $1')}</span>`, 1.3)}
    </div>
    <div class="z mono" style="position:absolute;left:9mm;right:14mm;bottom:6.6mm;font-size:1.85mm;line-height:1.5;color:${C.muted};letter-spacing:.04em;text-transform:uppercase">
      Lic. 375111C · SAA S5949175 · ARC AU61554<br>${BIZ.abn}</div>${backBd.over}`;
  await L.pdf(printDoc([cardFront, cardBack], 96, 61), out('print', 'jrm-business-card-90x55mm-3mm-bleed.pdf'), { wmm: 96, hmm: 61 });
  // Light back: same layout on warm white, for cards people write on (quote amounts, appointment times).
  const lightBd = cardBg({
    bg: '#FBFAF8',
    ghost: { x: 640, y: 150, h: 420, fill: 'ghostFillLight' },
    honey: [{ cx: 860, cy: 470, rx: 190, ry: 170 }, { cx: 120, cy: 560, rx: 160, ry: 110, k: 0.5 }],
    honeyOpacity: 0.3,
    chevron: { cx: 668, cy: 305, r: 280, band: 30, stroke: 0.8, light: true },
  });
  const cardBackLight = `${lightBd.under}
    <div class="z" style="position:absolute;left:9mm;top:8mm;height:8.5mm">${horiz('light')}</div>
    <div class="z" style="position:absolute;left:9mm;width:34mm;top:19mm">${metalRule('height:.3mm;background:linear-gradient(90deg,#A67939,#D4B274 40%,rgba(166,121,57,0))')}</div>
    <div class="z" style="position:absolute;left:9mm;top:21.2mm">
      ${row('phone', `<span class="display" style="font-size:4.6mm;font-stretch:80%;color:${C.black}">${BIZ.phone}</span>`, 1.3)}
      ${row('envelope', `<span class="body" style="font-size:2.55mm;color:${C.black}">${BIZ.email}</span>`, 1.3)}
      ${row('globe', `<span class="body" style="font-size:2.55mm;color:${C.black}">${BIZ.web}</span>`, 1.3)}
      ${row('pin', `<span class="body" style="font-size:2.55mm;color:${C.black}">${BIZ.areas.join(', ').replace(/, ([^,]*)$/, ' and $1')}</span>`, 1.3)}
    </div>
    <div class="z mono" style="position:absolute;left:9mm;right:14mm;bottom:6.6mm;font-size:1.85mm;line-height:1.5;color:#5A5758;letter-spacing:.04em;text-transform:uppercase">
      Lic. 375111C · SAA S5949175 · ARC AU61554<br>${BIZ.abn}</div>`;
  await L.pdf(printDoc([cardFront, cardBackLight], 96, 61), out('print', 'jrm-business-card-90x55mm-3mm-bleed-light-back.pdf'), { wmm: 96, hmm: 61 });
  await L.png(printDoc([cardBackLight], 96, 61).replace('html,body{width:96mm;background:#fff}', 'html,body{width:96mm;height:61mm;overflow:hidden}'), out('print/previews', 'jrm-business-card-back-light.png'), { w: 363, h: 231, scale: 3, omitBackground: false });

  await L.png(printDoc([cardFront], 96, 61).replace('html,body{width:96mm;background:#fff}', 'html,body{width:96mm;height:61mm;overflow:hidden}'), out('print/previews', 'jrm-business-card-front.png'), { w: 363, h: 231, scale: 3, omitBackground: false });
  await L.png(printDoc([cardBack], 96, 61).replace('html,body{width:96mm;background:#fff}', 'html,body{width:96mm;height:61mm;overflow:hidden}'), out('print/previews', 'jrm-business-card-back.png'), { w: 363, h: 231, scale: 3, omitBackground: false });

  // A4 letterhead (no bleed needed for office printing; header band prints to edge on pro print).
  const footer = `<div style="position:absolute;left:18mm;right:18mm;bottom:12mm;border-top:.35mm solid ${C.gold};padding-top:3mm;display:flex;justify-content:space-between;gap:6mm" class="mono">
      <div style="font-size:2.3mm;color:#5a5758;line-height:1.6;text-transform:uppercase;letter-spacing:.04em">${BIZ.lic} · ${BIZ.saa}<br>${BIZ.arc} · ${BIZ.abn}</div>
      <div style="font-size:2.3mm;color:${C.black};line-height:1.6;text-align:right">${BIZ.phone}<br>${BIZ.email}</div></div>`;
  const letterhead = `<div style="position:absolute;inset:0;background:#fff"></div>
    <div style="position:absolute;left:0;right:0;top:0;height:4mm;background:linear-gradient(90deg,${C.goldLight},${C.gold} 60%,${C.goldDeep})"></div>
    <div style="position:absolute;left:18mm;top:16mm;height:16mm">${horiz('light')}</div>
    <div class="body" style="position:absolute;right:18mm;top:17mm;text-align:right;font-size:2.6mm;line-height:1.65;color:${C.black}">
      <b style="font-weight:600">${BIZ.name}</b><br>${BIZ.phone}<br>${BIZ.email}<br>${BIZ.web}</div>
    <div style="position:absolute;right:-30mm;bottom:40mm;height:120mm;opacity:.045">${icon('mono-black')}</div>
    ${footer}`;
  await L.pdf(printDoc([letterhead], 210, 297), out('print', 'jrm-letterhead-a4.pdf'), { wmm: 210, hmm: 297 });
  await L.png(printDoc([letterhead], 210, 297).replace('html,body{width:210mm;background:#fff}', 'html,body{width:210mm;height:297mm;overflow:hidden}'), out('print/previews', 'jrm-letterhead-a4.png'), { w: 794, h: 1123, scale: 1.5, omitBackground: false });

  // DL compliments slip 210x99.
  const slip = `<div style="position:absolute;inset:0;background:#fff"></div>
    <div style="position:absolute;left:0;top:0;bottom:0;width:62mm;overflow:hidden"><div class="surface" style="--grid:5mm"></div>
      <div class="z" style="position:absolute;inset:0;display:grid;place-items:center"><div style="height:44mm">${stacked('dark')}</div></div></div>
    <div style="position:absolute;left:74mm;top:14mm;right:12mm">
      <div class="display" style="font-size:9mm;color:${C.black}">With compliments</div>
      <div style="height:.5mm;width:20mm;background:${C.gold};margin:4mm 0"></div>
      <div class="body" style="font-size:2.7mm;color:${C.black};line-height:1.7">${BIZ.phone}<br>${BIZ.email}<br>${BIZ.web}</div>
      <div class="mono" style="font-size:2mm;color:#5a5758;margin-top:12mm;text-transform:uppercase;letter-spacing:.05em">Lic. 375111C · SAA S5949175 · ARC AU61554 · ${BIZ.abn}</div></div>`;
  await L.pdf(printDoc([slip], 210, 99), out('print', 'jrm-compliments-slip-dl.pdf'), { wmm: 210, hmm: 99 });

  // Site sign / corflute 900x600 trim + 3 mm bleed = 906x606.
  const sign = `<div class="surface" style="--grid:40mm;--gy:40%"></div>
    <div class="z" style="position:absolute;inset:3mm;padding:55mm 60mm;display:flex;flex-direction:column;justify-content:space-between">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div style="height:150mm">${horiz('dark')}</div>
        <div class="lbl" style="font-size:16mm;text-align:right;line-height:1.6">Licensed<br>electrician<br>on site</div></div>
      <div>
        <div class="display gold-text" style="font-size:125mm;font-stretch:80%">${BIZ.phone}</div>
        <div class="body" style="font-size:30mm;color:#fff;font-weight:500;margin-top:10mm">${BIZ.web}</div>
        <div class="mono" style="font-size:12mm;color:${C.muted};margin-top:14mm;letter-spacing:.08em;text-transform:uppercase">Electrical · Air con · Solar · Battery · Lic. 375111C</div></div></div>`;
  await L.pdf(printDoc([sign], 906, 606), out('print', 'jrm-site-sign-900x600mm-3mm-bleed.pdf'), { wmm: 906, hmm: 606 });
  await L.png(printDoc([sign], 906, 606).replace('html,body{width:906mm;background:#fff}', 'html,body{width:906mm;height:606mm;overflow:hidden}'), out('print/previews', 'jrm-site-sign.png'), { w: 3424, h: 2290, scale: 0.4, omitBackground: false });

  // Vehicle door magnet 600x400 trim + 3 mm bleed.
  const magnet = `<div class="surface" style="--grid:28mm"></div>
    <div class="z" style="position:absolute;inset:3mm;padding:38mm 40mm;display:flex;flex-direction:column;justify-content:space-between;align-items:center;text-align:center">
      <div style="height:170mm">${stacked('dark')}</div>
      <div><div class="display gold-text" style="font-size:78mm;font-stretch:80%">${BIZ.phone}</div>
      <div class="body" style="font-size:20mm;color:#fff;font-weight:500;margin-top:5mm">${BIZ.web}</div></div></div>`;
  await L.pdf(printDoc([magnet], 606, 406), out('print', 'jrm-vehicle-door-magnet-600x400mm-3mm-bleed.pdf'), { wmm: 606, hmm: 406 });
  await L.png(printDoc([magnet], 606, 406).replace('html,body{width:606mm;background:#fff}', 'html,body{width:606mm;height:406mm;overflow:hidden}'), out('print/previews', 'jrm-vehicle-door-magnet.png'), { w: 2290, h: 1534, scale: 0.5, omitBackground: false });

  // Switchboard / meter-box service label 80x50 trim + 2 mm bleed (vinyl or polyester label stock).
  const label = `<div class="surface" style="--grid:4mm"></div>
    <div class="z" style="position:absolute;inset:2mm;padding:4.5mm 5mm;display:flex;flex-direction:column;justify-content:space-between">
      <div style="display:flex;align-items:center;justify-content:space-between"><div style="height:11mm">${horiz('dark')}</div></div>
      <div class="lbl" style="font-size:2.2mm;letter-spacing:.14em">Installed / serviced by JRM</div>
      <div class="display gold-text" style="font-size:8.2mm;font-stretch:80%">${BIZ.phone}</div>
      <div class="mono" style="font-size:1.9mm;color:${C.muted};letter-spacing:.05em;text-transform:uppercase;display:flex;justify-content:space-between"><span>Lic. 375111C</span><span>Date ____/____/______</span></div></div>`;
  await L.pdf(printDoc([label], 84, 54), out('print', 'jrm-switchboard-label-80x50mm-2mm-bleed.pdf'), { wmm: 84, hmm: 54 });
  await L.png(printDoc([label], 84, 54).replace('html,body{width:84mm;background:#fff}', 'html,body{width:84mm;height:54mm;overflow:hidden}'), out('print/previews', 'jrm-switchboard-label.png'), { w: 318, h: 204, scale: 3, omitBackground: false });
}

// ---------------------------------------------------------- email signature
function signature() {
  // Table layout and inline styles only: the lowest common denominator for Outlook, Gmail and Apple Mail.
  // The icon is served from the live site so the signature stays small.
  const html = `<!-- JRM email signature. Paste into Gmail / Outlook signature settings (open this file in a browser, select all, copy, paste). Replace YOUR NAME and ROLE. -->
<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,Helvetica,sans-serif;color:#1B1A1B;font-size:13px;line-height:1.45">
  <tr>
    <td style="padding:0 16px 0 0;vertical-align:top;border-right:2px solid #A67939">
      <img src="https://www.jrmcontracting.com.au/icon-192.png" width="64" height="64" alt="JRM Electrical" style="display:block;border:0">
    </td>
    <td style="padding:0 0 0 16px;vertical-align:top">
      <div style="font-size:15px;font-weight:bold;color:#1B1A1B">YOUR NAME</div>
      <div style="font-size:12px;color:#7F5C2B;text-transform:uppercase;letter-spacing:1px">ROLE · JRM Electrical Contracting</div>
      <div style="margin-top:6px"><a href="tel:${BIZ.phoneIntl}" style="color:#1B1A1B;text-decoration:none;font-weight:bold">${BIZ.phone}</a></div>
      <div><a href="mailto:${BIZ.email}" style="color:#1B1A1B;text-decoration:none">${BIZ.email}</a></div>
      <div><a href="https://www.${BIZ.web}" style="color:#A67939;text-decoration:none;font-weight:bold">${BIZ.web}</a></div>
      <div style="margin-top:6px;font-size:10px;color:#7F7C7A">Lic. 375111C · SAA s5949175 · ARC AU61554 · ${BIZ.abn}</div>
    </td>
  </tr>
</table>
`;
  L.write(out('digital', 'jrm-email-signature.html'), html);
}

(async () => {
  await social();
  await print();
  signature();
  await L.close();
})();
