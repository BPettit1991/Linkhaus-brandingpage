// Brand portal Worker.
//  /files/<path>  master files from the R2 bucket: range requests for video seeking,
//                 ETag/304 caching, ?download=1 to save with the file's own name
//  everything else  the portal UI, served from static assets (portal/dist)
//
// Access: Cloudflare Access sits in front of the portal and signs every request it lets
// through (Cf-Access-Jwt-Assertion). This Worker checks that signature too, so the portal
// stays closed on any hostname Access does not cover (for example *.workers.dev), and it
// fails closed: until ACCESS_TEAM and ACCESS_AUD are set, nothing is served. ACCESS_AUD may list
// several applications' tags, comma-separated (the workers.dev address and the custom domain each
// have their own Access application, with the same policies).
// ACCESS_DISABLED=true exists only for local development (.dev.vars), never in production.

const TYPES = {
  svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif',
  pdf: 'application/pdf', mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm', wav: 'audio/wav', mp3: 'audio/mpeg', m4a: 'audio/mp4',
  html: 'text/html; charset=utf-8', css: 'text/css; charset=utf-8', json: 'application/json', md: 'text/markdown; charset=utf-8',
  txt: 'text/plain; charset=utf-8', woff2: 'font/woff2', woff: 'font/woff', ttf: 'font/ttf', otf: 'font/otf', zip: 'application/zip',
};

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'same-origin',
  'X-Robots-Tag': 'noindex, nofollow',
  'X-Frame-Options': 'SAMEORIGIN',
};

export default {
  async fetch(request, env) {
    const denied = await checkAccess(request, env);
    if (denied) return denied;
    const url = new URL(request.url);
    if (url.pathname.startsWith('/files/')) return serveFile(request, env, url);
    const res = await env.ASSETS.fetch(request);
    const out = new Response(res.body, res);
    for (const [k, v] of Object.entries(SECURITY_HEADERS)) out.headers.set(k, v);
    return out;
  },
};

// ---- Cloudflare Access verification ----------------------------------------
let certCache = { team: null, keys: null, at: 0 };

async function checkAccess(request, env) {
  if (env.ACCESS_DISABLED === 'true') return null;
  const text = (status, msg) => new Response(msg, { status, headers: { 'content-type': 'text/plain; charset=utf-8', ...SECURITY_HEADERS } });
  if (!env.ACCESS_TEAM || !env.ACCESS_AUD) return text(503, 'Portal is locked: Cloudflare Access is not configured yet.');
  const token = request.headers.get('cf-access-jwt-assertion');
  if (!token) return text(403, `Sign in through Cloudflare Access to view the ${env.BRAND_NAME || 'brand'} portal.`);
  try {
    await verifyAccessJwt(token, env.ACCESS_TEAM, env.ACCESS_AUD);
    return null;
  } catch {
    return text(403, 'Access token rejected. Sign in again.');
  }
}

const b64u = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), (c) => c.charCodeAt(0));

async function accessKeys(team) {
  const now = Date.now();
  if (certCache.team === team && certCache.keys && now - certCache.at < 3600e3) return certCache.keys;
  const res = await fetch(`https://${team}.cloudflareaccess.com/cdn-cgi/access/certs`);
  if (!res.ok) throw new Error('certs');
  const { keys } = await res.json();
  certCache = { team, keys, at: now };
  return keys;
}

async function verifyAccessJwt(token, team, aud) {
  const [h, p, s] = token.split('.');
  if (!h || !p || !s) throw new Error('shape');
  const header = JSON.parse(new TextDecoder().decode(b64u(h)));
  const payload = JSON.parse(new TextDecoder().decode(b64u(p)));
  if (header.alg !== 'RS256') throw new Error('alg');
  const jwk = (await accessKeys(team)).find((k) => k.kid === header.kid);
  if (!jwk) throw new Error('kid');
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64u(s), new TextEncoder().encode(`${h}.${p}`));
  if (!ok) throw new Error('sig');
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) throw new Error('exp');
  if (payload.nbf && payload.nbf > now + 60) throw new Error('nbf');
  const auds = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  const allowed = String(aud).split(',').map((a) => a.trim()).filter(Boolean);
  if (!auds.some((a) => allowed.includes(a))) throw new Error('aud');
  if (payload.iss !== `https://${team}.cloudflareaccess.com`) throw new Error('iss');
  return payload;
}

// ---- Files from R2 -------------------------------------------------------------
async function serveFile(request, env, url) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
  }
  let key;
  try {
    key = decodeURIComponent(url.pathname.slice('/files/'.length));
  } catch {
    return new Response('Bad path', { status: 400 });
  }
  // Keys are plain relative paths; refuse anything empty or trying to climb out.
  if (!key || key.includes('..') || key.startsWith('/') || key.startsWith('_meta/')) return new Response('Not found', { status: 404 });

  const obj = await env.FILES.get(key, { range: request.headers, onlyIf: request.headers });
  if (obj === null) return new Response('Not found', { status: 404 });

  const headers = new Headers(SECURITY_HEADERS);
  obj.writeHttpMetadata(headers);
  if (!headers.has('content-type')) headers.set('content-type', TYPES[key.split('.').pop().toLowerCase()] || 'application/octet-stream');
  // Kit HTML and SVG open in their own sandbox: no scripts and no access to the portal's
  // origin, so a file in the kit can never act as a signed-in user.
  if (/\.(html?|svg)$/i.test(key)) headers.set('content-security-policy', 'sandbox');
  headers.set('etag', obj.httpEtag);
  headers.set('accept-ranges', 'bytes');
  headers.set('cache-control', 'private, max-age=300');
  const name = key.split('/').pop().replace(/"/g, '');
  headers.set('content-disposition', `${url.searchParams.has('download') ? 'attachment' : 'inline'}; filename="${name}"`);

  // A failed precondition (e.g. If-None-Match matched) returns metadata without a body.
  if (!('body' in obj)) return new Response(null, { status: 304, headers });

  let status = 200;
  if (obj.range && request.headers.has('range')) {
    let offset, length;
    // R2 reports either { offset, length } or { suffix }; check values, not keys, since
    // some runtimes include every key.
    if (typeof obj.range.suffix === 'number') {
      length = Math.min(obj.range.suffix, obj.size);
      offset = obj.size - length;
    } else {
      offset = obj.range.offset ?? 0;
      length = obj.range.length ?? obj.size - offset;
    }
    headers.set('content-range', `bytes ${offset}-${offset + length - 1}/${obj.size}`);
    headers.set('content-length', String(length));
    status = 206;
  } else {
    headers.set('content-length', String(obj.size));
  }
  return new Response(request.method === 'HEAD' ? null : obj.body, { status, headers });
}
