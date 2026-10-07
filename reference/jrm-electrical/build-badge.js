const fs = require('fs');
const path = require('path');
const TextToSVG = require('text-to-svg');
const { loadGroups, mergeHoles, recolor } = require('./trace-utils');

const poppinsSemi = TextToSVG.loadSync(path.join(__dirname, 'fonts/Poppins-SemiBold.ttf'));

const GOLD = '#A67939';
const GOLD_LIGHT = '#D4B274';
const WHITE = '#FFFFFF';
const BLACK_BG = '#000000';
const GOLD_DEEP = '#7F5C2B';

// ---- Re-derive the real traced groups, with letter holes (O, A) merged as
// true vector holes before recoloring black -> white for this dark badge ----
const groups = loadGroups(path.join(__dirname, '../00-source/jrm-logo-traced.svg'));
const mergedCoreLockup = mergeHoles([...groups.icon, ...groups.wordmark, ...groups.subtitle]);
const coreLockupPaths = recolor(mergedCoreLockup, true);

// ---- text-to-svg helpers ----
function letterSpaced(t2s, text, fontSize, startX, y, spacing, fillByIndex) {
  let x = startX;
  const parts = [];
  for (const ch of text) {
    if (ch === ' ') { x += fontSize * 0.32 + spacing; continue; }
    const metrics = t2s.getMetrics(ch, { fontSize });
    const d = t2s.getD(ch, { x, y, fontSize, anchor: 'left top' });
    const fill = typeof fillByIndex === 'function' ? fillByIndex(ch) : fillByIndex;
    parts.push(`<path d="${d}" fill="${fill}"/>`);
    x += metrics.width + spacing;
  }
  return { markup: parts.join('\n'), width: x - spacing - startX };
}
function measureLetterSpaced(t2s, text, fontSize, spacing) {
  let w = 0;
  for (const ch of text) {
    if (ch === ' ') { w += fontSize * 0.32 + spacing; continue; }
    w += t2s.getMetrics(ch, { fontSize }).width + spacing;
  }
  return w - spacing;
}

// Icons, backdrop and gradients are shared with the business card and social posts.
const P = require('./media/premium.cjs');
const { MR, hexD, glyph, icon } = P;

// ---- Layout ----
// All content sits inside a safe circle about 70 px inside the ring, with even
// clearance top (mark) and bottom (last contact row).
const S = 1200, C = 600;
const outerR = 585, ringW = 14, innerR = outerR - ringW - 4, ringMid = outerR - 4 - ringW / 2;

// Lockup content box in master units: x 10-1967, y 17-1938.
const lockupTop = 155, lockupH = 410, lockupScale = lockupH / 1921;
const lockupX = C - 988.5 * lockupScale, lockupY = lockupTop - 17 * lockupScale;
const lockupBottom = lockupTop + lockupH;

const dividerY = lockupBottom + 40;
// No separate services line: the labels under each icon carry the service names.

const colScale = 52 / MR;
const cols = [
  { cx: 262, g: 'bolt', label: ['ELECTRICAL', 'SERVICES'] },
  { cx: 488, g: 'snowflake', label: ['AC /', 'REFRIGERATION'] },
  { cx: 714, g: 'solar', label: ['SOLAR', 'SOLUTIONS'] },
  { cx: 940, g: 'battery', label: ['BATTERY', 'SYSTEMS'] },
];
const colCy = dividerY + 96;
let colsMarkup = '';
cols.forEach((col, i) => {
  colsMarkup += icon(col.cx, colCy, col.g, colScale);
  const w1 = measureLetterSpaced(poppinsSemi, col.label[0], 20, 1);
  const w2 = measureLetterSpaced(poppinsSemi, col.label[1], 20, 1);
  colsMarkup += `<g transform="translate(${col.cx - w1 / 2},${colCy + 70})">${letterSpaced(poppinsSemi, col.label[0], 20, 0, 0, 1, WHITE).markup}</g>`;
  colsMarkup += `<g transform="translate(${col.cx - w2 / 2},${colCy + 96})">${letterSpaced(poppinsSemi, col.label[1], 20, 0, 0, 1, WHITE).markup}</g>`;
  if (i < cols.length - 1) {
    const dx = (col.cx + cols[i + 1].cx) / 2;
    colsMarkup += `<rect x="${dx - 0.75}" y="${colCy - 62}" width="1.5" height="176" fill="url(#vFade)"/>`;
  }
});

// Gold rule with a centre ornament; rects rather than lines so the gradients render.
const rule = (y, half, ornament) => `<rect x="${C - half}" y="${y - 1}" width="${half - 22}" height="2" fill="url(#hFadeL)"/>
<rect x="${C + 22}" y="${y - 1}" width="${half - 22}" height="2" fill="url(#hFadeR)"/>
${ornament}`;
const divider1 = rule(dividerY, 170, `<g transform="translate(${C} ${dividerY}) scale(.42)">${glyph.bolt()}</g>`);
const divider2Y = colCy + 146;
const divider2 = rule(divider2Y, 150, `<path d="${hexD(5)}" transform="translate(${C} ${divider2Y})" fill="none" stroke="${GOLD_LIGHT}" stroke-width="1.5"/>`);

const contactStartY = divider2Y + 50, contactGap = 60, contactScale = 28 / MR;
function contactRow(y, name, text, fontSize) {
  const iconCx = 356;
  const tp = poppinsSemi.getD(text, { x: 408, y, fontSize, anchor: 'left middle' });
  return `${icon(iconCx, y, name, contactScale, 1.3)}<path d="${tp}" fill="${WHITE}"/>`;
}
const contacts = [
  contactRow(contactStartY, 'phone', '0434 042 433', 32),
  contactRow(contactStartY + contactGap, 'envelope', 'electrical@jrmcontracting.com.au', 24),
  contactRow(contactStartY + contactGap * 2, 'pin', 'Central Coast, Newcastle and Sydney', 24),
].join('\n');
const contentBottom = contactStartY + contactGap * 2 + 28;

// ---- Background: ghost mark, honeycomb, hexagon chevron and light flares ----
// Everything here sits behind the information layer and inside the ring.
const bd = P.backdrop(S, S, {
  id: 'badge',
  ghost: { x: 95, y: 150, h: 470 },
  honey: [{ cx: 170, cy: 760, rx: 210, ry: 260 }, { cx: 1000, cy: 380, rx: 200, ry: 220 }, { cx: 930, cy: 880, rx: 150, ry: 140, k: 0.47 }],
  chevron: { cx: 790, cy: 560, r: 330, band: 46 },
  streaks: { x: 0, y: 0, k: 1 },
  flares: [[1118, 415, 16, -32], ['apex', 0, 11, 0], [128, 862, 13, 52], [318, 90, 8, 20]],
});
const background = bd.layers, flares = bd.flares;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">
<defs>
  <clipPath id="badgeClip"><circle cx="${C}" cy="${C}" r="${innerR}"/></clipPath>
${P.DEFS}
  <linearGradient id="ringMetal" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="${GOLD_LIGHT}"/><stop offset="18%" stop-color="#F3DDA8"/><stop offset="34%" stop-color="${GOLD}"/>
    <stop offset="52%" stop-color="${GOLD_DEEP}"/><stop offset="68%" stop-color="${GOLD}"/><stop offset="82%" stop-color="#F3DDA8"/>
    <stop offset="100%" stop-color="${GOLD}"/>
  </linearGradient>
  <filter id="ringGlow" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="5"/></filter>
</defs>
<circle cx="${C}" cy="${C}" r="${outerR}" fill="${BLACK_BG}"/>
<g clip-path="url(#badgeClip)">
${background}
</g>
<circle cx="${C}" cy="${C}" r="${ringMid}" fill="none" stroke="${GOLD_LIGHT}" stroke-width="${ringW + 6}" opacity=".35" filter="url(#ringGlow)"/>
<circle cx="${C}" cy="${C}" r="${ringMid}" fill="none" stroke="url(#ringMetal)" stroke-width="${ringW}"/>
<circle cx="${C}" cy="${C}" r="${innerR}" fill="none" stroke="#000" stroke-opacity=".5" stroke-width="1.5"/>
${flares}
<g transform="translate(${lockupX},${lockupY}) scale(${lockupScale})">
${coreLockupPaths}
</g>
${divider1}
${colsMarkup}
${divider2}
${contacts}
</svg>`;

const outDir = path.join(__dirname, '../logos/svg');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'jrm-badge-circular-black-gold.svg'), svg);
// Clearance check: content must stay inside the ring with room to spare.
const topGap = lockupTop - (C - innerR), bottomGap = (C + innerR) - contentBottom;
console.log(`Badge built. clearance top ${topGap.toFixed(0)}px, bottom ${bottomGap.toFixed(0)}px`);
