// Social, digital and print collateral, rendered from HTML with the brand's logo masters, fonts
// and colours. PNG for screens, vector PDF (with a PNG preview) for print.
// Content comes from "business" in brand.config.json; anything missing (no email, no services,
// no credentials) is left out rather than shown empty.
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { KIT, BIZ, C, GEN, PREFIX, ONE_COLOUR, logo, logoRatio, med, rule, rgba, page, printDoc, png, pdf, preview, write, out, imgData, close, credLine, areasLine } from './lib.mjs';

const require = createRequire(import.meta.url);
const H = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Contact rows (icon + text) shared by cards, covers and stories.
const contacts = () => [
  BIZ.phone && ['phone', BIZ.phone, true],
  BIZ.email && ['mail', BIZ.email],
  BIZ.website && ['globe', BIZ.website],
  BIZ.areas.length && ['pin', areasLine()],
].filter(Boolean);

// Accent "streak" decoration: a few diagonal light lines and a soft flare, sized to any canvas.
function streaks(w, h, { x = 0.62, angle = -24, opacity = 1 } = {}) {
  const k = Math.max(w, h);
  return `<div style="position:absolute;inset:0;overflow:hidden;opacity:${opacity};pointer-events:none">
    ${[0, 1, 2].map((i) => `<div style="position:absolute;left:${w * x + i * k * 0.035}px;top:-${h * 0.3}px;width:${k * (0.004 - i * 0.001)}px;height:${h * 1.6}px;transform:rotate(${angle}deg);background:linear-gradient(${rgba(C.accentLight, 0)},${rgba(C.accentLight, 0.55 - i * 0.15)} 45%,${rgba(C.accentLight, 0)})"></div>`).join('')}
    <div style="position:absolute;left:${w * x - k * 0.15}px;top:${h * 0.5 - k * 0.15}px;width:${k * 0.3}px;height:${k * 0.3}px;border-radius:50%;background:radial-gradient(circle,${rgba(C.accent, 0.18)},${rgba(C.accent, 0)} 70%)"></div></div>`;
}
// Faint oversized icon mark in a corner.
const ghost = (style, opacity = 0.06) => !ONE_COLOUR ? '' : `<div style="position:absolute;${style};opacity:${opacity}">${logo('icon', 'dark', { color: C.text })}</div>`;
const surface = (css = '') => `<div class="surface" style="${css}"></div>`;
const shot = (html, dir, name, w, h) => png(html, out(dir, name), { w, h });

// ------------------------------------------------------------------------- social ---
export async function social() {
  // Profile pictures: the icon inside the circle-safe zone (inner 70%).
  for (const [name, bg, look] of [['dark', null, 'dark'], ['light', C.paper, 'light'], ['accent', C.accent, 'white']]) {
    const mark = look === 'white' ? (ONE_COLOUR ? logo('icon', 'dark', { color: '#FFFFFF' }) : logo('icon', 'light')) : logo('icon', look);
    await shot(page(`${bg ? `<div style="position:absolute;inset:0;background:${bg}"></div>` : surface()}
      <div class="z" style="position:absolute;inset:0;display:grid;place-items:center"><div style="height:540px;max-width:640px;display:grid;place-items:center">${mark}</div></div>`, { w: 1080, h: 1080 }),
    'social/profile', `profile-${name}-1080.png`, 1080, 1080);
  }

  // Covers. Content stays inside each platform's safe area.
  const cover = (w, h, { logoH, tag, align = 'center', padR = 0, safeW = w }) => {
    const side = `<div>
        ${BIZ.tagline ? `<div class="display light-text" style="font-size:${tag}px">${H(BIZ.tagline)}</div>` : ''}
        ${BIZ.areas.length ? `<div class="lbl" style="font-size:${tag * 0.2}px;margin-top:${tag * 0.2}px">${H(BIZ.areas.join(' · '))}</div>` : ''}
        ${BIZ.phone ? `<div style="display:flex;align-items:center;gap:${tag * 0.14}px;margin-top:${tag * 0.16}px">${med('phone', `${tag * 0.5}px`)}<span class="display accent-text" style="font-size:${tag * 0.52}px">${H(BIZ.phone)}</span></div>` : ''}
      </div>`;
    return page(`${surface(`--gx:${align === 'right' ? 70 : 50}%;--gy:45%;--grid:${Math.round(h / 10)}px`)}${streaks(w, h, { x: 0.78 })}${ghost(`left:${w * 0.02}px;top:${h * 0.08}px;height:${h * 0.84}px`, 0.05)}
      <div class="z" style="position:absolute;top:0;bottom:0;left:${(w - safeW) / 2}px;right:${(w - safeW) / 2}px;display:flex;align-items:center;justify-content:${align === 'right' ? 'flex-end' : 'center'};gap:${h * 0.08}px;padding-right:${padR}px">
        <div style="height:${logoH}px;max-width:${safeW * 0.45}px">${logo('horizontal', 'dark')}</div>
        <div style="width:2px;align-self:center;height:${logoH * 0.9}px;background:linear-gradient(${C.accentLight},${C.accent},${C.accentDeep})"></div>
        ${side}
      </div>`, { w, h });
  };
  const covers = [
    ['facebook-cover-1640x624', 1640, 624, { logoH: 170, tag: 104, safeW: 1300 }],
    ['linkedin-banner-1584x396', 1584, 396, { logoH: 120, tag: 72, align: 'right', padR: 90 }],
    ['x-header-1500x500', 1500, 500, { logoH: 135, tag: 84, align: 'right', padR: 100 }],
    ['youtube-banner-2560x1440', 2560, 1440, { logoH: 200, tag: 116, safeW: 1546 }],
    ['google-business-cover-1080x608', 1080, 608, { logoH: 130, tag: 70, safeW: 1000 }],
  ];
  for (const [name, w, h, o] of covers) await shot(cover(w, h, o), 'social/covers', `${name}.png`, w, h);

  // Shared post footer: accent rule, horizontal logo, phone.
  const foot = (bottom = 64) => `<div class="z" style="position:absolute;left:80px;right:80px;bottom:${bottom}px">
      ${rule('margin-bottom:30px')}
      <div style="display:flex;align-items:center;justify-content:space-between;gap:30px">
        <div style="height:74px;max-width:520px">${logo('horizontal', 'dark')}</div>
        ${BIZ.phone ? `<div style="display:flex;align-items:center;gap:14px">${med('phone', '58px')}<span class="display accent-text" style="font-size:50px">${H(BIZ.phone)}</span></div>` : ''}
      </div></div>`;

  // One post per service (1080×1350). A photo if business.services[].image is set, else a large icon.
  for (const s of BIZ.services) {
    const visual = s.image
      ? `<div style="position:absolute;left:0;right:0;top:0;height:760px;overflow:hidden"><img src="${imgData(s.image)}" style="width:100%;height:100%;object-fit:cover">
          <div style="position:absolute;inset:0;background:linear-gradient(0deg,${C.ink} 3%,${rgba(C.ink, 0)} 55%)"></div></div>`
      : `${streaks(1080, 1350, { x: 0.7 })}<div style="position:absolute;right:70px;top:90px;width:430px;height:430px;opacity:.9">${med(s.icon, '430px')}</div>`;
    await shot(page(`${surface('--gx:70%;--gy:25%')}${visual}
      <div class="z" style="position:absolute;left:80px;right:80px;top:${s.image ? 590 : 560}px">
        <div class="lbl" style="font-size:24px;display:flex;align-items:center;gap:18px">${s.image ? med(s.icon, '80px') : ''}${s.n} / ${H(s.name)}</div>
        <div class="display" style="color:#fff;font-size:${s.lines.length > 2 ? 108 : 120}px;margin-top:24px">${s.lines.map(H).join('<br>')}</div>
        ${s.blurb ? `<div class="body muted" style="font-size:28px;line-height:1.45;margin-top:26px;max-width:820px">${H(s.blurb)}</div>` : ''}
      </div>${foot()}`, { w: 1080, h: 1350 }), 'social/posts', `post-${s.slug}-1080x1350.png`, 1080, 1350);
  }

  // Credentials post.
  if (BIZ.credentials.length) {
    const words = BIZ.trust?.title || ['Licensed.', 'Insured.', 'Local.'];
    await shot(page(`${surface('--gx:80%;--gy:20%')}${streaks(1080, 1350, { x: 0.68 })}${ghost('right:-120px;top:120px;height:900px', 0.05)}
      <div class="z" style="position:absolute;left:80px;right:80px;top:130px">
        <div class="lbl" style="font-size:24px">${H(BIZ.trust?.label || BIZ.name)}</div>
        <div class="display" style="font-size:${words.length > 3 ? 130 : 170}px;margin-top:30px">${words.map((x, i) => `<span class="${i === words.length - 1 ? 'accent-text' : 'light-text'}">${H(x)}</span>`).join('<br>')}</div>
        <div style="margin-top:46px;display:grid;gap:16px" class="mono">
          ${BIZ.credentials.map((c) => `<div style="display:flex;align-items:center;gap:22px;padding-top:16px;font-size:27px;letter-spacing:.06em;text-transform:uppercase;color:${C.text};border-top:1px solid ${rgba(C.accentLight, 0.25)}">${med('check', '50px')}<span>${H(c.label)}</span><b style="color:${C.accentLight};font-weight:500;margin-left:auto">${H(c.value)}</b></div>`).join('')}
        </div></div>${foot()}`, { w: 1080, h: 1350 }), 'social/posts', 'post-credentials-1080x1350.png', 1080, 1350);
  }

  // Review request (post and story) when business.reviewUrl is set: a QR code to the review page.
  if (BIZ.reviewUrl) {
    const qr = await require('qrcode').toDataURL(BIZ.reviewUrl, { margin: 0, width: 600, color: { dark: '#000000', light: '#FFFFFF' } });
    const review = (h, top, bottom) => page(`${surface('--gy:45%')}${streaks(1080, h, { x: 0.75 })}
      <div class="z" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;text-align:center;padding:${top}px 80px 0">
        <div class="lbl" style="font-size:24px">Happy with the job?</div>
        <div class="display light-text" style="font-size:140px;margin-top:28px">Leave us<br>a review.</div>
        <div class="body muted" style="font-size:30px;margin-top:28px;max-width:760px;line-height:1.45">Two minutes on Google helps other locals find someone they can trust.</div>
        <div style="margin-top:46px;background:#fff;padding:26px;border-radius:22px;box-shadow:0 0 0 3px ${C.accentLight},0 0 40px ${rgba(C.accentLight, 0.35)}"><img src="${qr}" style="width:300px;height:300px;display:block"></div>
        <div class="lbl" style="font-size:20px;margin-top:22px;color:${C.muted}">Scan with your phone camera</div>
      </div>${foot(bottom)}`, { w: 1080, h });
    await shot(review(1350, 120, 64), 'social/posts', 'post-review-request-1080x1350.png', 1080, 1350);
    await shot(review(1920, 330, 280), 'social/stories', 'story-review-1080x1920.png', 1080, 1920);
  }

  // Story (1080×1920): 250 px kept clear top and bottom for app controls.
  await shot(page(`${surface('--gy:38%;--grid:64px')}${streaks(1080, 1920, { x: 0.7 })}
    <div class="z" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:250px 90px">
      <div style="height:${logoRatio('stacked') > 1.6 ? 260 : 500}px;max-width:900px;display:grid;place-items:center">${logo('stacked', 'dark')}</div>
      ${BIZ.tagline ? `<div class="display light-text" style="font-size:92px;margin-top:60px">${H(BIZ.tagline)}</div>` : ''}
      ${rule('width:520px;margin:42px auto 0')}
      <div class="lbl" style="font-size:24px;margin-top:42px">${H(BIZ.cta)}</div>
      ${BIZ.phone ? `<div style="display:flex;align-items:center;gap:22px;margin-top:18px">${med('phone', '104px')}<span class="display accent-text" style="font-size:120px">${H(BIZ.phone)}</span></div>` : ''}
      ${BIZ.website ? `<div style="display:flex;align-items:center;gap:16px;margin-top:22px">${med('globe', '54px')}<span class="body" style="font-size:36px;color:#fff;font-weight:600">${H(BIZ.website)}</span></div>` : ''}
    </div>`, { w: 1080, h: 1920 }), 'social/stories', 'story-cta-1080x1920.png', 1080, 1920);
}

// ------------------------------------------------------------------------ digital ---
export async function digital() {
  // Video-call background: logo top right so the person doesn't hide it.
  await shot(page(`${surface('--gx:75%;--gy:30%')}
    <div style="position:absolute;left:0;right:0;bottom:0;height:45%;background:repeating-linear-gradient(90deg,${rgba(C.text, 0.05)} 0 1px,transparent 1px 120px);transform:perspective(600px) rotateX(58deg);transform-origin:50% 100%"></div>
    <div class="z" style="position:absolute;right:90px;top:80px;height:150px;max-width:700px">${logo('horizontal', 'dark')}</div>
    <div class="z lbl" style="position:absolute;right:90px;top:260px;font-size:24px">${H([BIZ.phone, BIZ.website].filter(Boolean).join(' · '))}</div>`, { w: 1920, h: 1080 }),
  'digital', 'video-call-background-1920x1080.png', 1920, 1080);

  // Link-preview image for websites and shares.
  await shot(page(`${surface('--gy:40%')}${streaks(1200, 630, { x: 0.8 })}
    <div class="z" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:34px;padding:60px">
      <div style="height:150px;max-width:900px">${logo('horizontal', 'dark')}</div>
      ${BIZ.tagline ? `<div class="display light-text" style="font-size:64px">${H(BIZ.tagline)}</div>` : ''}
      ${BIZ.website ? `<div class="lbl" style="font-size:22px">${H(BIZ.website)}</div>` : ''}
    </div>`, { w: 1200, h: 630 }), 'digital', 'share-image-1200x630.png', 1200, 630);

  // Email signature: tables and inline styles only (Gmail, Outlook, Apple Mail).
  const iconUrl = GEN.signatureIconUrl || (BIZ.website ? `https://${BIZ.website}/icon-192.png` : '');
  write(join(KIT, 'digital', `${PREFIX}email-signature.html`), `<!-- ${BIZ.name} email signature. Open in a browser, replace YOUR NAME and ROLE, select all, copy, and paste into Gmail or Outlook signature settings.${iconUrl ? ` The icon loads from ${iconUrl}: upload logos/app-icons/${PREFIX}app-icon-192.png there, or change the address.` : ''} -->
<table cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,Helvetica,sans-serif;color:${C.onPaper};font-size:13px;line-height:1.45">
  <tr>
    ${iconUrl ? `<td style="padding:0 16px 0 0;vertical-align:top;border-right:2px solid ${C.accent}"><img src="${iconUrl}" width="64" height="64" alt="${H(BIZ.short)}" style="display:block;border:0"></td>` : ''}
    <td style="padding:0 0 0 ${iconUrl ? 16 : 0}px;vertical-align:top">
      <div style="font-size:15px;font-weight:bold">YOUR NAME</div>
      <div style="font-size:12px;color:${C.accentDeep};text-transform:uppercase;letter-spacing:1px">ROLE · ${H(BIZ.name)}</div>
      ${BIZ.phone ? `<div style="margin-top:6px"><a href="tel:${BIZ.phoneIntl || BIZ.phone.replace(/\s/g, '')}" style="color:${C.onPaper};text-decoration:none;font-weight:bold">${H(BIZ.phone)}</a></div>` : ''}
      ${BIZ.email ? `<div><a href="mailto:${BIZ.email}" style="color:${C.onPaper};text-decoration:none">${H(BIZ.email)}</a></div>` : ''}
      ${BIZ.website ? `<div><a href="https://${BIZ.website}" style="color:${C.accentDeep};text-decoration:none;font-weight:bold">${H(BIZ.website)}</a></div>` : ''}
      ${BIZ.credentials.length || BIZ.abn ? `<div style="margin-top:6px;font-size:10px;color:#7F7C7A">${H([credLine(), BIZ.abn].filter(Boolean).join(' · '))}</div>` : ''}
    </td>
  </tr>
</table>
`);
}

// -------------------------------------------------------------------------- print ---
// Sizes include bleed; the trim size is in each file name.
const P_CSS = `.surface::after{display:none}`;
const doc = (pages, w, h) => printDoc(pages, w, h, P_CSS);
// The preview shares the PDF's name so the portal shows it as the PDF's thumbnail.
async function printAll(pages, w, h, name, previewPage = pages[0]) {
  await pdf(doc(pages, w, h), out('print', `${name}.pdf`), { wmm: w, hmm: h });
  await preview(doc([previewPage], w, h), out('print/previews', `${name}.png`), { wmm: w, hmm: h });
}

export async function print() {
  const fine = [credLine(), BIZ.abn].filter(Boolean).join(' · ');
  // Business card 90×55 trim, 96×61 with 3 mm bleed.
  const svc = BIZ.services.slice(0, 4);
  const front = `${surface('--grid:4mm;--gy:40%')}${streaks(363, 231, { x: 0.74, opacity: 0.8 })}
    <div class="z" style="position:absolute;left:0;right:0;top:${svc.length ? 8.5 : 14}mm;height:${svc.length ? 22 : 30}mm;display:flex;justify-content:center"><div style="height:100%;max-width:70mm">${logo('stacked', 'dark')}</div></div>
    ${svc.length ? `<div class="z" style="position:absolute;left:28mm;right:28mm;top:34.5mm">${rule('height:.35mm')}</div>
    <div class="z" style="position:absolute;left:12mm;right:12mm;top:37mm;display:flex;justify-content:space-around">
      ${svc.map((s) => `<div style="width:17mm;display:flex;flex-direction:column;align-items:center;gap:1.1mm">${med(s.icon, '7.4mm')}<span class="body" style="font-size:1.9mm;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#fff;text-align:center;line-height:1.15">${H(s.name.split(/\s+&\s+|\s+and\s+/)[0])}</span></div>`).join('')}
    </div>` : ''}`;
  const row = (icon, text, light, big) => `<div style="display:flex;align-items:center;gap:2.2mm;height:6mm">${med(icon, '5mm', { light })}<span class="${big ? 'display' : 'body'}${big && !light ? ' accent-text' : ''}" style="font-size:${big ? 4.4 : 2.5}mm;color:${light ? C.onPaper : '#fff'}">${H(text)}</span></div>`;
  const back = (light) => `${light ? `<div style="position:absolute;inset:0;background:${C.paper}"></div>` : `${surface('--grid:4mm;--gx:85%;--gy:70%')}${ghost('right:-6mm;top:14mm;height:46mm', 0.06)}`}
    <div class="z" style="position:absolute;left:9mm;top:8mm;height:8.5mm;max-width:60mm">${logo('horizontal', light ? 'light' : 'dark')}</div>
    <div class="z" style="position:absolute;left:9mm;width:34mm;top:19mm">${rule('height:.3mm')}</div>
    <div class="z" style="position:absolute;left:9mm;top:21mm">${contacts().map(([i, t, big]) => row(i, t, light, big)).join('')}</div>
    ${fine ? `<div class="z mono" style="position:absolute;left:9mm;right:12mm;bottom:6.5mm;font-size:1.8mm;line-height:1.5;color:${light ? C.mutedOnPaper : C.muted};letter-spacing:.04em;text-transform:uppercase">${H(fine)}</div>` : ''}`;
  await printAll([front, back(false)], 96, 61, 'business-card-90x55mm-3mm-bleed');
  await printAll([front, back(true)], 96, 61, 'business-card-90x55mm-3mm-bleed-light-back', back(true));

  // A4 letterhead.
  const footer = `<div style="position:absolute;left:18mm;right:18mm;bottom:12mm;border-top:.35mm solid ${C.accent};padding-top:3mm;display:flex;justify-content:space-between;gap:6mm" class="mono">
      <div style="font-size:2.3mm;color:${C.mutedOnPaper};line-height:1.6;text-transform:uppercase;letter-spacing:.04em;max-width:110mm">${H(fine)}</div>
      <div style="font-size:2.3mm;color:${C.onPaper};line-height:1.6;text-align:right">${[BIZ.phone, BIZ.email].filter(Boolean).map(H).join('<br>')}</div></div>`;
  const letterhead = `<div style="position:absolute;inset:0;background:#fff"></div>
    <div style="position:absolute;left:0;right:0;top:0;height:4mm;background:linear-gradient(90deg,${C.accentLight},${C.accent} 60%,${C.accentDeep})"></div>
    <div style="position:absolute;left:18mm;top:16mm;height:16mm;max-width:100mm">${logo('horizontal', 'light')}</div>
    <div class="body" style="position:absolute;right:18mm;top:17mm;text-align:right;font-size:2.6mm;line-height:1.65;color:${C.onPaper}">
      <b style="font-weight:600">${H(BIZ.name)}</b><br>${[BIZ.phone, BIZ.email, BIZ.website].filter(Boolean).map(H).join('<br>')}</div>
    ${ONE_COLOUR ? `<div style="position:absolute;right:-30mm;bottom:40mm;height:120mm;opacity:.045">${logo('icon', 'light', { color: '#000000' })}</div>` : ''}
    ${footer}`;
  await printAll([letterhead], 210, 297, 'letterhead-a4');

  // DL compliments slip 210×99.
  const slip = `<div style="position:absolute;inset:0;background:#fff"></div>
    <div style="position:absolute;left:0;top:0;bottom:0;width:62mm;overflow:hidden">${surface('--grid:5mm')}
      <div class="z" style="position:absolute;inset:8mm;display:grid;place-items:center"><div style="height:40mm;max-width:46mm;display:grid;place-items:center">${logo('stacked', 'dark')}</div></div></div>
    <div style="position:absolute;left:74mm;top:14mm;right:12mm">
      <div class="display" style="font-size:9mm;color:${C.onPaper}">With compliments</div>
      <div style="height:.5mm;width:20mm;background:${C.accent};margin:4mm 0"></div>
      <div class="body" style="font-size:2.7mm;color:${C.onPaper};line-height:1.7">${[BIZ.phone, BIZ.email, BIZ.website].filter(Boolean).map(H).join('<br>')}</div>
      ${fine ? `<div class="mono" style="font-size:2mm;color:${C.mutedOnPaper};margin-top:10mm;text-transform:uppercase;letter-spacing:.05em">${H(fine)}</div>` : ''}</div>`;
  await printAll([slip], 210, 99, 'compliments-slip-dl');

  // Site sign 900×600 trim + 3 mm bleed.
  const sign = `${surface('--grid:40mm;--gy:40%')}
    <div class="z" style="position:absolute;inset:3mm;padding:55mm 60mm;display:flex;flex-direction:column;justify-content:space-between">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:30mm">
        <div style="height:140mm;max-width:520mm">${logo('horizontal', 'dark')}</div>
        <div class="lbl" style="font-size:16mm;text-align:right;line-height:1.6">${(GEN.signLabel || 'On site\nnow').split('\n').map(H).join('<br>')}</div></div>
      <div>
        ${BIZ.phone ? `<div class="display accent-text" style="font-size:120mm">${H(BIZ.phone)}</div>` : ''}
        ${BIZ.website ? `<div class="body" style="font-size:30mm;color:#fff;font-weight:600;margin-top:10mm">${H(BIZ.website)}</div>` : ''}
        <div class="mono" style="font-size:12mm;color:${C.muted};margin-top:14mm;letter-spacing:.08em;text-transform:uppercase">${H([BIZ.services.map((s) => s.name).join(' · '), BIZ.credentials[0] && `${BIZ.credentials[0].label} ${BIZ.credentials[0].value}`].filter(Boolean).join(' · '))}</div></div></div>`;
  await printAll([sign], 906, 606, 'site-sign-900x600mm-3mm-bleed');

  // Vehicle door magnet 600×400 trim + 3 mm bleed.
  const magnet = `${surface('--grid:28mm')}
    <div class="z" style="position:absolute;inset:3mm;padding:36mm 40mm;display:flex;flex-direction:column;justify-content:space-between;align-items:center;text-align:center">
      <div style="height:165mm;max-width:480mm;display:grid;place-items:center">${logo('stacked', 'dark')}</div>
      <div>${BIZ.phone ? `<div class="display accent-text" style="font-size:76mm">${H(BIZ.phone)}</div>` : ''}
      ${BIZ.website ? `<div class="body" style="font-size:20mm;color:#fff;font-weight:600;margin-top:5mm">${H(BIZ.website)}</div>` : ''}</div></div>`;
  await printAll([magnet], 606, 406, 'vehicle-door-magnet-600x400mm-3mm-bleed');

  // Service label 80×50 trim + 2 mm bleed (vinyl or polyester label stock).
  const label = `${surface('--grid:4mm')}
    <div class="z" style="position:absolute;inset:2mm;padding:4.5mm 5mm;display:flex;flex-direction:column;justify-content:space-between">
      <div style="height:10mm;max-width:50mm">${logo('horizontal', 'dark')}</div>
      <div class="lbl" style="font-size:2.2mm;letter-spacing:.14em">${H(GEN.labelText || `Installed / serviced by ${BIZ.short}`)}</div>
      ${BIZ.phone ? `<div class="display accent-text" style="font-size:8mm">${H(BIZ.phone)}</div>` : ''}
      <div class="mono" style="font-size:1.9mm;color:${C.muted};letter-spacing:.05em;text-transform:uppercase;display:flex;justify-content:space-between;gap:3mm"><span>${H(BIZ.credentials[0] ? `${BIZ.credentials[0].label} ${BIZ.credentials[0].value}` : BIZ.website)}</span><span>Date ____/____/______</span></div></div>`;
  await printAll([label], 84, 54, 'service-label-80x50mm-2mm-bleed');
}

export async function staticAll() { await social(); await digital(); await print(); }

if (import.meta.url === `file://${process.argv[1]}`) { await staticAll(); await close(); }
