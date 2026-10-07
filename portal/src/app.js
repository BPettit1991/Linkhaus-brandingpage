// Brand portal UI. Reads manifest.json (built by portal/build.mjs) and serves every
// master file from /files/<path> through the Worker. State lives in the URL hash:
//   #cat=print&q=card        filtered list
//   #file=print/x.pdf        viewer open on a file (shareable)
(() => {
  const $ = (s) => document.querySelector(s);
  const grid = $('#grid'), cats = $('#cats'), q = $('#q'), count = $('#count'), empty = $('#empty');
  const viewer = $('#viewer'), stage = $('#vStage'), toastEl = $('#toast');
  let M, list = [], current = -1, state = { cat: 'all', q: '' };

  const fileUrl = (p, download) => `/files/${p.split('/').map(encodeURIComponent).join('/')}${download ? '?download=1' : ''}`;
  const absolute = (u) => new URL(u, location.origin).href;
  const size = (b) => (b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : b >= 1024 ? `${Math.round(b / 1024)} KB` : `${b} B`);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const catLabel = (id) => (M.categories.find((c) => c.id === id) || { label: id }).label;
  let lightRe = /light-bg|mono-black|apple-touch|favicon/i;
  const lightBg = (p) => lightRe.test(p);

  const ICON = {
    pdf: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/><path d="M10 13h6M10 17h4"/>',
    audio: '<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>',
    html: '<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14"/>',
    text: '<path d="M6 4h12v16H6z"/><path d="M9 8h6M9 12h6M9 16h4"/>',
    data: '<path d="M8 4c-2 0-3 1-3 3v2c0 1.5-1 2-2 3 1 1 2 1.5 2 3v2c0 2 1 3 3 3M16 4c2 0 3 1 3 3v2c0 1.5 1 2 2 3-1 1-2 1.5-2 3v2c0 2-1 3-3 3"/>',
    file: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/>',
  };
  const hexIcon = (k, label) => `<div class="hex">${label ? `<span>${esc(label)}</span>` : `<svg viewBox="0 0 24 24">${ICON[k] || ICON.file}</svg>`}</div>`;
  const I = {
    dl: '<svg viewBox="0 0 24 24"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>',
    link: '<svg viewBox="0 0 24 24"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>',
  };

  // ---- fonts for specimens -----------------------------------------------------
  const loadedFonts = new Map();
  function fontFamily(item) {
    if (loadedFonts.has(item.path)) return loadedFonts.get(item.path);
    const fam = `spec-${loadedFonts.size}`;
    const spec = fontSpec(item);
    const desc = {};
    if (spec && spec.weight) desc.weight = String(spec.weight);
    if (spec && spec.stretch) desc.stretch = spec.stretch;
    const ff = new FontFace(fam, `url(${fileUrl(item.path)})`, desc);
    ff.load().then((f) => document.fonts.add(f)).catch(() => {});
    loadedFonts.set(item.path, fam);
    return fam;
  }
  // The theme's font list (brand.config.json) says how to show each font: axes and display style.
  const fontSpec = (item) => (M.brand.fonts || []).find((f) => f.file && item.path.endsWith(f.file.split('/').pop()));
  const fontStyle = (item) => {
    const st = (fontSpec(item) || {}).style;
    return `font-family:'${fontFamily(item)}',sans-serif;${st ? `font-weight:${st.weight || 800};${st.stretch ? `font-stretch:${st.stretch};` : ''}${st.uppercase === false ? '' : 'text-transform:uppercase;'}` : ''}`;
  };

  // ---- cards --------------------------------------------------------------------
  function thumbHtml(item) {
    if (item.kind === 'font') {
      return `<div class="thumb"><div class="specimen" style="${fontStyle(item)}"><div class="big">Aa Rr</div><div class="small">${esc(M.brand.specimen.line)}</div></div><span class="tag">${item.ext}</span></div>`;
    }
    if (item.cat === 'colours' && /^(json|css)$/.test(item.ext) && Object.keys(M.colours).length) {
      const chips = Object.values(M.colours).map((c) => `<i style="background:${c.hex}"></i>`).join('');
      return `<div class="thumb"><div class="chips">${chips}</div><span class="tag">${item.ext}</span></div>`;
    }
    if (item.thumb) {
      const cls = ['thumb', item.kind === 'video' || /social\/|previews/.test(item.thumb) ? 'fill' : '', lightBg(item.path) ? 'light' : ''].join(' ');
      return `<div class="${cls}"><img src="${item.thumb}" alt="" loading="lazy" decoding="async">${item.kind === 'video' ? '<span class="play"><svg viewBox="0 0 24 24"><path d="M7 4l13 8-13 8z"/></svg></span>' : ''}<span class="tag">${item.ext}</span></div>`;
    }
    const label = item.ext === 'txt' ? 'OFL' : null;
    return `<div class="thumb">${hexIcon(item.kind, label)}<span class="tag">${item.ext}</span></div>`;
  }

  function card(item, i) {
    const el = document.createElement('article');
    el.className = 'card';
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', `${item.title}, ${item.ext}, ${size(item.size)}. Open preview`);
    el.innerHTML = `${thumbHtml(item)}
      <div class="card__body">
        <div class="card__title">${esc(item.title)}</div>
        <div class="card__meta">${item.ext.toUpperCase()} · ${size(item.size)}${item.dims ? ` · ${esc(item.dims)}` : ''}</div>
        <div class="card__acts">
          <a class="mini" href="${fileUrl(item.path, true)}" download data-stop>${I.dl}<span>Download</span></a>
          <button class="mini" data-copy="${esc(item.path)}" data-stop>${I.link}<span>Copy link</span></button>
        </div>
      </div>`;
    el.addEventListener('click', (e) => {
      const stop = e.target.closest('[data-stop]');
      if (stop) {
        if (stop.dataset.copy) { copy(absolute(fileUrl(stop.dataset.copy)), 'File link copied'); }
        return;
      }
      open(i);
    });
    el.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target === el) { e.preventDefault(); open(i); } });
    return el;
  }

  function render() {
    const words = state.q.toLowerCase().split(/\s+/).filter(Boolean);
    list = M.items.filter((it) => (state.cat === 'all' || it.cat === state.cat)
      && words.every((w) => `${it.title} ${it.path} ${it.desc} ${catLabel(it.cat)}`.toLowerCase().includes(w)));
    grid.replaceChildren(...list.map(card));
    empty.hidden = list.length > 0;
    count.textContent = `${list.length} file${list.length === 1 ? '' : 's'}${state.cat !== 'all' ? ` in ${catLabel(state.cat)}` : ''}`;
    for (const b of cats.querySelectorAll('.chip')) b.setAttribute('aria-pressed', String(b.dataset.cat === state.cat));
    $('#colours').hidden = state.cat !== 'colours' || !!state.q;
  }

  function renderCats() {
    const all = [{ id: 'all', label: 'All', count: M.items.length }, ...M.categories];
    cats.innerHTML = all.map((c) => `<button class="chip" data-cat="${c.id}" aria-pressed="false">${esc(c.label)} <b>${c.count}</b></button>`).join('');
    cats.addEventListener('click', (e) => {
      const b = e.target.closest('.chip');
      if (!b) return;
      state.cat = b.dataset.cat;
      writeHash();
      render();
    });
  }

  function renderColours() {
    // Colour file entries: { name?, hex, rgb?, cmyk?, usage? }. RGB is worked out from HEX if missing.
    const rgbOf = (h) => { const m = /^#?([0-9a-f]{6})$/i.exec(h || ''); return m ? `rgb(${m[1].match(/../g).map((x) => parseInt(x, 16)).join(', ')})` : ''; };
    const pretty = (k) => k.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    $('#colours').innerHTML = Object.entries(M.colours).map(([k, c]) => {
      const hex = String(c.hex || '').toUpperCase(), rgb = c.rgb || rgbOf(hex);
      return `
      <div class="swatch"><div class="swatch__col" style="background:${esc(hex)}"></div>
        <div class="swatch__body">
          <div class="swatch__name">${esc(c.name || pretty(k))}</div>
          <div class="swatch__row"><span>HEX ${esc(hex)}</span><button data-val="${esc(hex)}">Copy</button></div>
          ${rgb ? `<div class="swatch__row"><span>${esc(rgb.toUpperCase())}</span><button data-val="${esc(rgb)}">Copy</button></div>` : ''}
          ${c.cmyk ? `<div class="swatch__row"><span>CMYK ${esc(c.cmyk)}</span><button data-val="${esc(c.cmyk)}">Copy</button></div>` : ''}
          ${c.usage ? `<div class="swatch__use">${esc(c.usage)}</div>` : ''}
        </div></div>`;
    }).join('');
    $('#colours').addEventListener('click', (e) => { const b = e.target.closest('button[data-val]'); if (b) copy(b.dataset.val, `Copied ${b.dataset.val}`); });
  }

  // ---- viewer -------------------------------------------------------------------
  function setBg(bg) {
    stage.classList.toggle('light', bg === 'light');
    stage.classList.toggle('check', bg === 'check');
    for (const b of document.querySelectorAll('#vBg button')) b.setAttribute('aria-pressed', String(b.dataset.bg === bg));
  }

  async function showPreview(item) {
    const url = fileUrl(item.path);
    stage.replaceChildren();
    const isImg = item.kind === 'image';
    $('#vBg').hidden = !isImg;
    setBg(isImg && lightBg(item.path) ? 'light' : 'dark');
    if (isImg) {
      const img = new Image();
      img.src = url;
      img.alt = item.title;
      stage.append(img);
    } else if (item.kind === 'video') {
      const v = document.createElement('video');
      v.controls = true; v.preload = 'metadata'; v.playsInline = true; v.src = url;
      if (item.thumb) v.poster = item.thumb;
      stage.append(v);
    } else if (item.kind === 'audio') {
      const a = document.createElement('audio');
      a.controls = true; a.preload = 'metadata'; a.src = url;
      stage.append(a);
    } else if (item.kind === 'pdf' && item.preview) {
      // A picture of the design works everywhere (Android and some in-app browsers cannot
      // show PDFs inline); the full PDF loads on demand.
      const d = document.createElement('div');
      d.className = 'pdf-prev';
      d.innerHTML = `<img src="${item.preview}" alt="${esc(item.title)} preview"><button class="btn">View the PDF</button>`;
      d.querySelector('button').addEventListener('click', () => {
        const f = document.createElement('iframe');
        f.src = `${url}#view=FitH`; f.title = item.title;
        stage.replaceChildren(f);
      });
      stage.append(d);
    } else if (item.kind === 'pdf' || item.kind === 'html') {
      const f = document.createElement('iframe');
      f.src = item.kind === 'pdf' ? `${url}#view=FitH` : url;
      f.title = item.title;
      if (item.kind === 'html') f.setAttribute('sandbox', 'allow-same-origin');
      stage.append(f);
    } else if (item.kind === 'font') {
      const d = document.createElement('div');
      d.className = 'font-spec';
      d.setAttribute('style', fontStyle(item));
      const sp = M.brand.specimen;
      d.innerHTML = `<div class="l">${esc(sp.headline)}</div><div class="m">ABCDEFGHIJKLMNOPQRSTUVWXYZ<br>abcdefghijklmnopqrstuvwxyz<br>0123456789 · ${esc(sp.line)}</div><div class="s">${esc(sp.about)}</div>`;
      stage.append(d);
    } else {
      const pre = document.createElement('pre');
      pre.textContent = 'Loading…';
      stage.append(pre);
      try { pre.textContent = await (await fetch(url)).text(); } catch { pre.textContent = 'Preview unavailable. Use Download.'; }
    }
  }

  function open(i, push = true) {
    current = i;
    const item = list[i];
    if (!item) return;
    $('#vCat').textContent = catLabel(item.cat);
    $('#vTitle').textContent = item.title;
    $('#vDesc').textContent = item.desc || '';
    $('#vDesc').hidden = !item.desc;
    const rows = [['Format', item.ext.toUpperCase()], ['Size', size(item.size)], item.dims && ['Details', item.dims], ['Folder', item.path.split('/').slice(0, -1).join('/') || '/']].filter(Boolean);
    $('#vMeta').innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('');
    $('#vDownload').href = fileUrl(item.path, true);
    $('#vOpen').href = fileUrl(item.path);
    $('#vPath').textContent = item.path;
    $('#vPrev').disabled = i <= 0;
    $('#vNext').disabled = i >= list.length - 1;
    showPreview(item);
    if (!viewer.open) viewer.showModal();
    // Keep focus on the controls: an embedded PDF or video would otherwise take it and swallow Escape.
    $('#vClose').focus({ preventScroll: true });
    if (push) writeHash(item.path);
  }
  function close() { stage.replaceChildren(); if (viewer.open) viewer.close(); current = -1; writeHash(); }

  $('#vPrev').addEventListener('click', () => current > 0 && open(current - 1));
  $('#vNext').addEventListener('click', () => current < list.length - 1 && open(current + 1));
  $('#vClose').addEventListener('click', close);
  viewer.addEventListener('cancel', (e) => { e.preventDefault(); close(); });
  viewer.addEventListener('click', (e) => { if (e.target === viewer) close(); });
  viewer.addEventListener('keydown', (e) => {
    if (e.target.closest('video,audio,iframe')) return;
    if (e.key === 'ArrowLeft') $('#vPrev').click();
    if (e.key === 'ArrowRight') $('#vNext').click();
  });
  $('#vBg').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) setBg(b.dataset.bg); });
  $('#vCopy').addEventListener('click', () => copy(absolute(fileUrl(list[current].path)), 'File link copied'));
  $('#vShare').addEventListener('click', () => copy(`${location.origin}${location.pathname}#file=${encodeURIComponent(list[current].path)}`, 'Viewer link copied'));

  // ---- clipboard, hash, search ---------------------------------------------------
  let toastTimer;
  function toast(msg) { toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1800); }
  async function copy(text, msg) {
    try { await navigator.clipboard.writeText(text); toast(msg); }
    catch { window.prompt('Copy this link:', text); }
  }

  function writeHash(file) {
    const p = new URLSearchParams();
    if (file) p.set('file', file);
    else { if (state.cat !== 'all') p.set('cat', state.cat); if (state.q) p.set('q', state.q); }
    const h = p.toString();
    history.replaceState(null, '', h ? `#${h}` : location.pathname);
  }
  function readHash() {
    const p = new URLSearchParams(location.hash.slice(1));
    const file = p.get('file');
    if (file) {
      const item = M.items.find((it) => it.path === file);
      if (item) { state.cat = item.cat; state.q = ''; q.value = ''; render(); open(list.indexOf(item), false); return; }
    }
    state.cat = p.get('cat') || 'all';
    state.q = p.get('q') || '';
    q.value = state.q;
    render();
  }

  let qTimer;
  q.addEventListener('input', () => { clearTimeout(qTimer); qTimer = setTimeout(() => { state.q = q.value.trim(); writeHash(); render(); }, 120); });
  document.addEventListener('keydown', (e) => { if (e.key === '/' && document.activeElement !== q && !viewer.open) { e.preventDefault(); q.focus(); } });

  // Back/forward and pasted links on an open page: re-read the hash.
  window.addEventListener('hashchange', () => { if (M) { if (viewer.open) { stage.replaceChildren(); viewer.close(); } readHash(); } });

  fetch('manifest.json').then((r) => r.json()).then((m) => {
    M = m;
    try { lightRe = new RegExp(m.brand.lightBackground, 'i'); } catch { /* keep the default */ }
    $('#updated').textContent = `Updated ${new Date(m.generated).toLocaleDateString(m.brand.locale || undefined, { day: 'numeric', month: 'short', year: 'numeric' })}`;
    renderCats();
    renderColours();
    readHash();
  }).catch(() => { count.textContent = 'Could not load the file list. Refresh to try again.'; });
})();
