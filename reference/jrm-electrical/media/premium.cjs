// Shared "premium" visual language, first built for the circular badge and now
// reused by the business card and social posts so they cannot drift apart:
//  - hexagon medallion icons with metallic gold glyphs
//  - a dark backdrop with a ghost of the real icon, honeycomb texture, a
//    gold-edged hexagon chevron, light streaks and lens flares.
// Gradient and filter ids are fixed; include DEFS once per SVG document/page.
const { parts: markParts } = require('./lib.cjs');

const GOLD = '#A67939', GOLD_LIGHT = '#D4B274', GOLD_DEEP = '#7F5C2B';

// ---- Icon system: hexagon medallions with metallic gold glyphs ----
// Every icon is drawn in a local space centred on 0,0 at medallion radius MR, then
// translated (and scaled for the contact rows). Because the gradients use
// userSpaceOnUse in that same local space, all icons shade identically.
const MR = 56;
const hexD = (r) => { let d = ''; for (let i = 0; i < 6; i++) { const a = Math.PI / 3 * i - Math.PI / 2; d += (i ? 'L' : 'M') + (r * Math.cos(a)).toFixed(2) + ',' + (r * Math.sin(a)).toFixed(2); } return d + 'Z'; };
const medallion = () => `
  <path d="${hexD(MR + 3)}" fill="none" stroke="${GOLD_LIGHT}" stroke-width="6" opacity=".22" filter="url(#softS)"/>
  <path d="${hexD(MR)}" fill="url(#medFace)" stroke="url(#medRim)" stroke-width="3.5" stroke-linejoin="round"/>
  <path d="${hexD(MR - 7)}" fill="none" stroke="${GOLD_LIGHT}" stroke-opacity=".28" stroke-width="1" stroke-linejoin="round"/>`;
const G = 'url(#iconGold)';

const glyph = {
  bolt: () => `<path d="M7,-33 L-17,5 L-2,5 L-9,33 L17,-7 L2,-7 Z" fill="${G}" stroke="#F3DDA8" stroke-opacity=".5" stroke-width="1" stroke-linejoin="round"/>`,
  snowflake: () => {
    let o = '';
    for (let k = 0; k < 6; k++) {
      const a = Math.PI / 3 * k - Math.PI / 2, c = Math.cos(a), sn = Math.sin(a);
      const P = (t, off = 0, len = 0) => [t * c - off * sn * len, t * sn + off * c * len];
      const tip = P(29);
      o += `<line x1="0" y1="0" x2="${tip[0].toFixed(2)}" y2="${tip[1].toFixed(2)}"/>`;
      for (const [at, bl] of [[15, 9], [23, 6]]) {
        const base = P(at);
        for (const side of [-1, 1]) {
          const b = Math.PI / 4 * side;
          const ex = base[0] + bl * Math.cos(a + b), ey = base[1] + bl * Math.sin(a + b);
          o += `<line x1="${base[0].toFixed(2)}" y1="${base[1].toFixed(2)}" x2="${ex.toFixed(2)}" y2="${ey.toFixed(2)}"/>`;
        }
      }
    }
    return `<g stroke="${G}" stroke-width="3.6" stroke-linecap="round">${o}</g><path d="${hexD(5)}" fill="${G}"/>`;
  },
  solar: () => {
    // Panel in slight perspective, sun rising behind its top-right corner.
    const tl = [-21, -3], tr = [13, -3], br = [26, 25], bl = [-26, 25];
    const lerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
    let grid = '';
    for (const t of [1 / 3, 2 / 3]) { const a = lerp(tl, tr, t), b = lerp(bl, br, t); grid += `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/>`; }
    { const a = lerp(tl, bl, 0.5), b = lerp(tr, br, 0.5); grid += `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/>`; }
    let rays = '';
    for (let k = 0; k < 5; k++) { const a = -Math.PI * (0.05 + k * 0.2); rays += `<line x1="${14 + 12 * Math.cos(a)}" y1="${-17 + 12 * Math.sin(a)}" x2="${14 + 18 * Math.cos(a)}" y2="${-17 + 18 * Math.sin(a)}"/>`; }
    return `<circle cx="14" cy="-17" r="7.5" fill="${G}"/>
      <g stroke="${G}" stroke-width="2.6" stroke-linecap="round">${rays}</g>
      <path d="M${tl} L${tr} L${br} L${bl} Z" fill="#141314" stroke="${G}" stroke-width="3" stroke-linejoin="round"/>
      <g stroke="${G}" stroke-width="1.6">${grid}</g>`;
  },
  battery: () => {
    let bars = '';
    [[16, 1], [5, 1], [-6, 0.45]].forEach(([y, op]) => { bars += `<rect x="-8.5" y="${y - 4}" width="17" height="8" rx="1.5" fill="${G}" opacity="${op}"/>`; });
    return `<rect x="-6.5" y="-33" width="13" height="6" rx="1.5" fill="${G}"/>
      <rect x="-15" y="-27" width="30" height="56" rx="5" fill="none" stroke="${G}" stroke-width="3.4"/>${bars}`;
  },
  phone: () => `<g transform="translate(-24 -24) scale(2)"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" fill="none" stroke="url(#iconGold24)" stroke-width="2" stroke-linejoin="round"/></g>`,
  envelope: () => `<rect x="-24" y="-17" width="48" height="34" rx="4" fill="none" stroke="${G}" stroke-width="3.6"/>
    <path d="M-22,-14 L0,3 L22,-14" fill="none" stroke="${G}" stroke-width="3.6" stroke-linejoin="round" stroke-linecap="round"/>`,
  globe: () => `<g fill="none" stroke="${G}" stroke-width="3.2"><circle r="25"/><ellipse rx="11" ry="25"/><line x1="-25" y1="0" x2="25" y2="0"/><path d="M-21,-13 Q0,-8 21,-13 M-21,13 Q0,8 21,13"/></g>`,
  check: () => `<path d="M-16,1 L-4,13 L18,-12" fill="none" stroke="${G}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`,
  pin: () => `<path d="M0,28 C-6,18 -19,6 -19,-6 A19,19 0 0 1 19,-6 C19,6 6,18 0,28 Z" fill="${G}"/><circle cx="0" cy="-6" r="7" fill="#141314"/>`,
};
// gs scales the glyph inside its medallion; small medallions need a larger glyph to stay legible.
const icon = (cx, cy, name, scale = 1, gs = 1.12) => `<g transform="translate(${cx} ${cy}) scale(${scale})">${medallion()}<g transform="scale(${gs})">${glyph[name]()}</g></g>`;

// ---- Shared defs ---------------------------------------------------------
const DEFS = `
  <radialGradient id="medFace" cx="35%" cy="28%" r="80%">
    <stop offset="0%" stop-color="#2E2C2E"/><stop offset="55%" stop-color="#151415"/><stop offset="100%" stop-color="#070707"/>
  </radialGradient>
  <linearGradient id="medRim" gradientUnits="userSpaceOnUse" x1="-56" y1="-56" x2="56" y2="56">
    <stop offset="0%" stop-color="#F3DDA8"/><stop offset="35%" stop-color="${GOLD_LIGHT}"/><stop offset="60%" stop-color="${GOLD_DEEP}"/>
    <stop offset="85%" stop-color="${GOLD}"/><stop offset="100%" stop-color="#F3DDA8"/>
  </linearGradient>
  <linearGradient id="iconGold" gradientUnits="userSpaceOnUse" x1="-30" y1="-34" x2="30" y2="34">
    <stop offset="0%" stop-color="#F6E3B4"/><stop offset="40%" stop-color="${GOLD_LIGHT}"/><stop offset="75%" stop-color="${GOLD}"/><stop offset="100%" stop-color="${GOLD_DEEP}"/>
  </linearGradient>
  <linearGradient id="iconGold24" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="24" y2="24">
    <stop offset="0%" stop-color="#F6E3B4"/><stop offset="40%" stop-color="${GOLD_LIGHT}"/><stop offset="75%" stop-color="${GOLD}"/><stop offset="100%" stop-color="${GOLD_DEEP}"/>
  </linearGradient>
  <linearGradient id="hFadeL" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="${GOLD}" stop-opacity="0"/><stop offset="100%" stop-color="${GOLD_LIGHT}"/></linearGradient>
  <linearGradient id="hFadeR" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="${GOLD_LIGHT}"/><stop offset="100%" stop-color="${GOLD}" stop-opacity="0"/></linearGradient>
  <linearGradient id="vFade" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${GOLD}" stop-opacity="0"/><stop offset="50%" stop-color="${GOLD_LIGHT}" stop-opacity=".7"/><stop offset="100%" stop-color="${GOLD}" stop-opacity="0"/></linearGradient>
  <radialGradient id="pbBg" cx="50%" cy="42%" r="60%">
    <stop offset="0%" stop-color="#171617"/><stop offset="70%" stop-color="#0B0B0B"/><stop offset="100%" stop-color="#000"/>
  </radialGradient>
  <linearGradient id="ghostFill" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#2A292A"/><stop offset="100%" stop-color="#161516"/>
  </linearGradient>
  <linearGradient id="ghostFillLight" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#EDEAE6"/><stop offset="100%" stop-color="#F6F4F1"/>
  </linearGradient>
  <radialGradient id="fadeA"><stop offset="0%" stop-color="#fff"/><stop offset="100%" stop-color="#000"/></radialGradient>
  <linearGradient id="bandGrad" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="#070707"/><stop offset="55%" stop-color="#262426"/><stop offset="100%" stop-color="#0E0D0E"/>
  </linearGradient>
  <linearGradient id="edgeGrad" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${GOLD}" stop-opacity=".2"/><stop offset="40%" stop-color="#F3DDA8"/>
    <stop offset="60%" stop-color="${GOLD_LIGHT}"/><stop offset="100%" stop-color="${GOLD}" stop-opacity=".25"/>
  </linearGradient>
  <linearGradient id="streakGrad" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="${GOLD}" stop-opacity="0"/><stop offset="35%" stop-color="#F3DDA8"/>
    <stop offset="70%" stop-color="${GOLD}"/><stop offset="100%" stop-color="${GOLD}" stop-opacity="0"/>
  </linearGradient>
  <radialGradient id="flareHalo">
    <stop offset="0%" stop-color="#FFE9B8" stop-opacity=".9"/><stop offset="30%" stop-color="${GOLD_LIGHT}" stop-opacity=".45"/>
    <stop offset="100%" stop-color="${GOLD}" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="glint">
    <stop offset="0%" stop-color="#FFF6E0"/><stop offset="40%" stop-color="#F3DDA8" stop-opacity=".7"/><stop offset="100%" stop-color="${GOLD}" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="metalRule" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="${GOLD}" stop-opacity="0"/><stop offset="20%" stop-color="${GOLD_LIGHT}"/><stop offset="50%" stop-color="#F3DDA8"/>
    <stop offset="80%" stop-color="${GOLD_LIGHT}"/><stop offset="100%" stop-color="${GOLD}" stop-opacity="0"/>
  </linearGradient>
  <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6"/></filter>
  <filter id="softS" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.5"/></filter>`;

// A standalone inline SVG for one medallion icon, sized by the caller's CSS.
// It references the shared DEFS, so the page must include defsSvg() once.
const iconSvg = (name, css = 'width:1em;height:1em', gs = 1.12) =>
  `<svg viewBox="-64 -64 128 128" style="${css};display:inline-block;overflow:visible;flex:none">${icon(0, 0, name, 1, gs)}</svg>`;
const defsSvg = () => `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${DEFS}</defs></svg>`;

// ---- Backdrop ------------------------------------------------------------
const chevronGeo = (cx, cy, r, band, ext0 = 0.9) => {
  const v = [0, 1, 2, 3, 4, 5].map((i) => [cx + r * Math.cos(Math.PI / 3 * i), cy + r * Math.sin(Math.PI / 3 * i)]);
  const ext = (p, q, k) => [p[0] + (p[0] - q[0]) * k, p[1] + (p[1] - q[1]) * k];
  const a = ext(v[5], v[0], ext0), b = v[0], c = ext(v[1], v[0], ext0);
  const inner = (p) => [p[0] - band, p[1]];
  return {
    outline: `M${a} L${b} L${c}`,
    bandPoly: `M${a} L${b} L${c} L${inner(c)} L${inner(b)} L${inner(a)} Z`,
    inner: `M${inner(a)} L${inner(b)} L${inner(c)}`,
    apex: b,
  };
};
const flare = (x, y, r, rot) => `<g transform="translate(${x} ${y}) rotate(${rot})">
  <circle r="${r * 2.4}" fill="url(#flareHalo)"/>
  <ellipse rx="${r * 5}" ry="${r * 0.18}" fill="url(#glint)"/>
  <ellipse rx="${r * 0.18}" ry="${r * 1.6}" fill="url(#glint)" opacity=".55"/>
  <circle r="${r * 0.35}" fill="#FFF6E0"/>
</g>`;
const markPath = (list, fill) => list.map((x) => `<path d="${x.d}" fill="${fill}"${x.evenodd ? ' fill-rule="evenodd"' : ''}/>`).join('');

// Layers in a w x h user space. Every option is optional:
//  ghost:   { x, y, h, opacity }            dark copy of the real icon (brackets + bolt)
//  honey:   [{ cx, cy, rx, ry, k }]         honeycomb revealed in soft ellipses (k = strength 0-1)
//  hr:      hexagon radius for the honeycomb
//  chevron: { cx, cy, r, band, stroke, ext } right-hand edges of a flat-top hexagon, plus a wider echo;
//                                          ext is how far the arms run past the hexagon (default 0.9)
//  streaks: { x, y, k }                     the badge's light streaks, placed and scaled (drawn in a 1200 box)
//  flares:  [[x, y, r, rot]]                use x = 'apex' to sit a flare on the chevron point
//  honeyOpacity, bg (false skips the base fill, or a CSS colour for a flat fill), id (unique per document)
//  ghost.fill: gradient id, 'ghostFillLight' on pale backgrounds; chevron.light: edge lines only
function backdrop(w, h, o = {}) {
  const id = o.id || 'pb';
  const hr = o.hr || 24, hw = Math.sqrt(3) * hr, hh = 1.5 * hr;
  const hexPt = (cx, cy) => { let d = ''; for (let i = 0; i < 6; i++) { const a = Math.PI / 3 * i - Math.PI / 2; d += (i ? 'L' : 'M') + (cx + hr * Math.cos(a)).toFixed(2) + ',' + (cy + hr * Math.sin(a)).toFixed(2); } return d + 'Z'; };
  const honey = (o.honey || []).map((e) => `<ellipse cx="${e.cx}" cy="${e.cy}" rx="${e.rx}" ry="${e.ry}" fill="url(#fadeA)" opacity="${e.k ?? 1}"/>`).join('');
  let out = `<defs>
    <pattern id="${id}Honey" width="${hw}" height="${hh * 2}" patternUnits="userSpaceOnUse">
      <path d="${hexPt(hw / 2, hr)} ${hexPt(0, hr + hh)} ${hexPt(hw, hr + hh)}" fill="none" stroke="${GOLD_LIGHT}" stroke-width="${(hr / 18).toFixed(2)}"/>
    </pattern>
    <mask id="${id}Mask" maskUnits="userSpaceOnUse" x="0" y="0" width="${w}" height="${h}">
      <rect width="${w}" height="${h}" fill="#000"/>${honey}
    </mask>
  </defs>`;
  if (o.bg !== false) out += `<rect width="${w}" height="${h}" fill="${o.bg || 'url(#pbBg)'}"/>`;
  if (honey) out += `<rect width="${w}" height="${h}" fill="url(#${id}Honey)" mask="url(#${id}Mask)" opacity="${o.honeyOpacity ?? 0.22}"/>`;
  if (o.ghost) {
    const g = o.ghost, s = g.h / 1108;
    out += `<g transform="translate(${g.x} ${g.y}) scale(${s}) translate(-508 -17)" opacity="${g.opacity ?? 1}">${markPath([...markParts.bracketL, ...markParts.bracketR, ...markParts.bolt], `url(#${g.fill || 'ghostFill'})`)}</g>`;
  }
  let apex = null;
  if (o.chevron) {
    const c = o.chevron, sw = c.stroke || 1;
    const e = c.ext ?? 0.9;
    const c1 = chevronGeo(c.cx, c.cy, c.r, c.band, e), c2 = chevronGeo(c.cx + c.r * 0.09, c.cy, c.r * 1.18, c.band * 0.4, e);
    apex = c1.apex;
    // light: gold edge lines only, for pale backgrounds where the dark bands would look like smudges
    if (c.light) out += `<path d="${c1.outline}" fill="none" stroke="url(#edgeGrad)" stroke-width="${2 * sw}"/>
      <path d="${c2.outline}" fill="none" stroke="url(#edgeGrad)" stroke-width="${1.2 * sw}" opacity=".7"/>`;
    else out += `<path d="${c2.bandPoly}" fill="url(#bandGrad)" opacity=".9"/>
      <path d="${c1.bandPoly}" fill="url(#bandGrad)"/>
      <path d="${c1.outline}" fill="none" stroke="url(#edgeGrad)" stroke-width="${2.5 * sw}"/>
      <path d="${c1.inner}" fill="none" stroke="url(#edgeGrad)" stroke-width="${1.2 * sw}" opacity=".55"/>
      <path d="${c2.outline}" fill="none" stroke="url(#edgeGrad)" stroke-width="${2 * sw}" opacity=".8"/>
      <path d="${c1.outline}" fill="none" stroke="${GOLD_LIGHT}" stroke-width="${7 * sw}" opacity=".35" filter="url(#soft)"/>`;
  }
  if (o.streaks) {
    const st = o.streaks;
    out += `<g transform="translate(${st.x} ${st.y}) scale(${st.k})">
      <path d="M 20 690 Q 110 930 330 1110" fill="none" stroke="url(#streakGrad)" stroke-width="3" filter="url(#softS)"/>
      <path d="M 45 640 Q 130 900 360 1100" fill="none" stroke="url(#streakGrad)" stroke-width="1.6"/>
      <path d="M 60 820 Q 150 990 290 1100" fill="none" stroke="url(#streakGrad)" stroke-width="7" opacity=".45" filter="url(#soft)"/>
    </g>`;
  }
  const fl = (o.flares || []).map(([x, y, r, rot]) => (x === 'apex' ? (apex ? flare(apex[0], apex[1], r, rot) : '') : flare(x, y, r, rot))).join('');
  return { layers: out, flares: fl, apex };
}

// Full-bleed backdrop as an absolutely positioned inline SVG for HTML templates.
const backdropSvg = (w, h, o = {}, css = 'position:absolute;inset:0;width:100%;height:100%') => {
  const b = backdrop(w, h, o);
  return {
    under: `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" style="${css}">${b.layers}</svg>`,
    over: `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" style="${css};z-index:5;pointer-events:none">${b.flares}</svg>`,
  };
};

module.exports = { GOLD, GOLD_LIGHT, GOLD_DEEP, MR, hexD, medallion, glyph, icon, iconSvg, DEFS, defsSvg, backdrop, backdropSvg, flare, chevronGeo };
