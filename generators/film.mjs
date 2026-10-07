// The brand film and logo sting as one HTML page with a pure render(t): the same t always draws
// the same frame, so video.mjs can step through it frame by frame at any size.
// Scenes come from brand.config.json "business": tagline, services, credentials, phone, website.
import { BIZ, C, BASE_CSS, logo, logoRatio, med, rgba } from './lib.mjs';

const H = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Timelines in seconds. Each scene: [type, start, end, data].
export function timeline(cut) {
  const svc = BIZ.services;
  if (cut === 'sting') return { duration: 6, scenes: [['logo', 0, 6]], cues: [0.7], cuts: [] };
  const plan = cut === 'film30'
    ? { duration: 30, intro: 3.2, per: svc.length ? Math.min(3.2, 13 / svc.length) : 0, maxSvc: 6, trust: BIZ.credentials.length ? 4.2 : 0 }
    : { duration: 15, intro: 2.2, per: svc.length ? Math.min(1.9, 6.6 / Math.min(svc.length, 4)) : 0, maxSvc: 4, trust: 0 };
  const scenes = [];
  let t = 0;
  scenes.push(['tagline', t, (t += plan.intro)]);
  svc.slice(0, plan.maxSvc).forEach((s, i) => scenes.push(['service', t, (t += plan.per), i]));
  if (plan.trust) scenes.push(['trust', t, (t += plan.trust)]);
  // Whatever is left goes to the logo build and end card (at least 6 s).
  const endStart = Math.min(t, plan.duration - 6);
  if (endStart < t) { const k = endStart / t; for (const s of scenes) { s[1] *= k; s[2] *= k; } }
  scenes.push(['logo', endStart, plan.duration]);
  return { duration: plan.duration, scenes, cuts: scenes.slice(1).map((s) => s[1]), cues: [endStart + 0.7] };
}

// The page. Sizes use vmin so one layout works at 16:9, 9:16 and 1:1.
export function filmHtml(cut, w, h) {
  const tl = timeline(cut);
  const portrait = h > w;
  const svc = BIZ.services;
  const ratio = logoRatio('horizontal');
  const scene = (id, inner, css = '') => `<section id="${id}" class="scene" style="${css}">${inner}</section>`;
  const lines = (arr, cls, size) => arr.map((l, i) => `<span class="ln"><span class="${cls}" data-i="${i}" style="font-size:${size}">${H(l)}</span></span>`).join('');

  const tagWords = BIZ.tagLines.length > 1 ? BIZ.tagLines : (BIZ.tagline || BIZ.short).split(/(?<=[.!?])\s+/);
  const body = `
  <div class="surface" id="bg"></div><div id="streak"></div>
  ${scene('tagline', `<div class="stack">${lines(tagWords, 'display light-text', portrait ? '15vmin' : '13vmin')}</div>`)}
  ${svc.map((s, i) => scene(`svc${i}`, `<div class="svc">
      <div class="medal">${med(s.icon, portrait ? '30vmin' : '26vmin')}</div>
      <div class="txt"><div class="lbl" style="font-size:2.6vmin">${s.n} / ${H(s.name)}</div>
      <div class="stack" style="margin-top:2.4vmin">${lines(s.lines, 'display svc-h', portrait ? '11vmin' : '10vmin')}</div>
      ${s.blurb ? `<div class="body muted blurb" style="font-size:3vmin;margin-top:2.6vmin;max-width:${portrait ? 80 : 70}vmin;line-height:1.4">${H(s.blurb)}</div>` : ''}</div></div>`)).join('')}
  ${scene('trust', `<div class="trustbox"><div class="stack">${lines(BIZ.trust?.title || ['Licensed.', 'Insured.', 'Local.'], 'display light-text', portrait ? '13vmin' : '11vmin')}</div>
      <div class="creds mono">${BIZ.credentials.map((c) => `<div class="cred">${med('check', '5vmin')}<span>${H(c.label)}</span><b>${H(c.value)}</b></div>`).join('')}</div></div>`)}
  ${scene('logo', `<div class="lockup">
      <div class="marks" style="height:${portrait ? 30 : 34}vmin">
        <div id="icon">${logo('icon', 'dark')}</div>
        <div id="horiz" style="height:${Math.min(portrait ? 22 : 26, (portrait ? 84 : 130) / ratio)}vmin">${logo('horizontal', 'dark')}</div>
      </div>
      <div class="endtxt">
        ${BIZ.tagline ? `<div class="display light-text et" style="font-size:${portrait ? 8 : 6.4}vmin">${BIZ.tagLines.map(H).join('<br>')}</div>` : ''}
        ${cut !== 'sting' && BIZ.phone ? `<div class="et cta"><span class="lbl" style="font-size:2.4vmin">${H(BIZ.cta)}</span><span class="display accent-text" style="font-size:${portrait ? 10 : 8}vmin">${H(BIZ.phone)}</span></div>` : ''}
        ${cut !== 'sting' && BIZ.website ? `<div class="et body" style="font-size:3.4vmin;color:#fff;font-weight:600">${H(BIZ.website)}</div>` : ''}
      </div></div>
      <div id="flash"></div>`)}`;

  const css = `${BASE_CSS}
html,body{width:${w}px;height:${h}px;overflow:hidden;background:${C.ink}}
.scene{position:absolute;inset:0;display:none;align-items:center;justify-content:center;z-index:2}
.stack{display:flex;flex-direction:column;align-items:flex-start}
#tagline .stack{align-items:center;text-align:center}
.ln{display:block;overflow:hidden;padding:0 .05em .04em}
.ln>span{display:block}
.svc-h{color:#fff}
.svc{display:flex;${portrait ? 'flex-direction:column;align-items:flex-start;gap:6vmin;padding:0 9vmin' : 'align-items:center;gap:7vmin;padding:0 10vmin'};width:100%}
.trustbox{display:flex;${portrait ? 'flex-direction:column;gap:7vmin' : 'align-items:center;gap:9vmin'};padding:0 9vmin;width:100%}
.creds{display:grid;gap:2vmin;flex:1;min-width:0}
.cred{display:flex;align-items:center;gap:2.4vmin;font-size:2.8vmin;letter-spacing:.06em;text-transform:uppercase;color:${C.text};padding-top:2vmin;border-top:1px solid ${rgba(C.accentLight, 0.25)}}
.cred b{margin-left:auto;color:${C.accentLight};font-weight:500}
.lockup{position:relative;display:flex;flex-direction:column;align-items:center;gap:4vmin;text-align:center}
.marks{position:relative;width:${portrait ? 84 : 120}vmin;display:flex;justify-content:center}
#icon{height:100%;display:flex;justify-content:center}
#horiz{position:absolute;top:50%;left:50%;display:flex;justify-content:center}
.endtxt{display:flex;flex-direction:column;align-items:center;gap:2.2vmin}
.cta{display:flex;flex-direction:column;align-items:center;gap:1vmin}
#flash{position:absolute;inset:0;background:radial-gradient(circle at 50% 45%,${rgba(C.accentPale, 0.55)},${rgba(C.accent, 0)} 45%);opacity:0;pointer-events:none}
#streak{position:absolute;top:-30%;height:160%;width:.5vmin;transform:rotate(-24deg);background:linear-gradient(${rgba(C.accentLight, 0)},${rgba(C.accentLight, 0.6)} 45%,${rgba(C.accentLight, 0)});z-index:1}
`;

  // Runs in the page. Scenes enter with a line-by-line rise and leave with a fade and drift.
  const script = `
const TL = ${JSON.stringify(tl)};
const ease = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
const clamp = (x) => Math.min(1, Math.max(0, x));
const $ = (s) => document.querySelector(s);
const sceneEl = (s) => s[0] === 'service' ? $('#svc' + s[3]) : $('#' + s[0]);
function rise(el, local, delay = 0.12) {
  el.querySelectorAll('.ln>span').forEach((x) => { const p = ease((local - x.dataset.i * delay) / 0.45); x.style.transform = 'translateY(' + (1 - p) * 110 + '%)'; });
}
window.render = (t) => {
  const D = TL.duration;
  $('#bg').style.setProperty('--gx', (50 + 18 * Math.sin(t / D * Math.PI * 2)) + '%');
  $('#bg').style.backgroundPosition = '0 ' + (t * 8) + 'px';
  const sp = (t % 3.2) / 3.2; $('#streak').style.left = (-10 + sp * 130) + '%'; $('#streak').style.opacity = Math.sin(sp * Math.PI) * 0.8;
  for (const s of TL.scenes) {
    const el = sceneEl(s); if (!el) continue;
    const [type, a, b] = s;
    const on = t >= a && t < b + (b >= D ? 1 : 0);
    el.style.display = on ? 'flex' : 'none';
    if (!on) continue;
    const local = t - a, left = b - t;
    const out = b >= D ? 1 : clamp(left / 0.3);
    el.style.opacity = out;
    el.style.transform = 'translateY(' + (1 - out) * -3 + 'vmin)';
    if (type === 'tagline' || type === 'trust') rise(el, local);
    if (type === 'trust') el.querySelectorAll('.cred').forEach((c, i) => { const p = ease((local - 0.5 - i * 0.18) / 0.4); c.style.opacity = p; c.style.transform = 'translateX(' + (1 - p) * 4 + 'vmin)'; });
    if (type === 'service') {
      rise(el, local - 0.12);
      const m = el.querySelector('.medal'); const p = ease(local / 0.5); m.style.transform = 'scale(' + (0.6 + 0.4 * p) + ') rotate(' + (1 - p) * -40 + 'deg)'; m.style.opacity = p;
      const bl = el.querySelector('.blurb'); if (bl) bl.style.opacity = ease((local - 0.45) / 0.4);
    }
    if (type === 'logo') {
      // Icon pops in, flash, then the horizontal lockup takes over and the end text rises.
      const ic = $('#icon'), hz = $('#horiz');
      const pop = ease(local / 0.6), swap = ease((local - 1.4) / 0.5);
      ic.style.transform = 'scale(' + (0.7 + 0.3 * pop) + ')'; ic.style.opacity = pop * (1 - swap);
      hz.style.opacity = swap; hz.style.transform = 'translate(-50%,-50%) translateY(' + ((1 - swap) * 3) + 'vmin) scale(' + (0.94 + 0.06 * swap) + ')';
      $('#flash').style.opacity = Math.max(0, 1 - Math.abs(local - 0.7) / 0.35) * 0.9;
      el.querySelectorAll('.et').forEach((x, i) => { const p = ease((local - 2 - i * 0.25) / 0.5); x.style.opacity = p; x.style.transform = 'translateY(' + (1 - p) * 3 + 'vmin)'; });
      const fade = D - t < 0.35 && TL.duration <= 6 ? (D - t) / 0.35 : 1; el.style.opacity = fade;
    }
  }
};`;
  return `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${body}<script>${script}</script></body></html>`;
}

