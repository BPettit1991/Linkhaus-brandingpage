// Which kit files are published, and which category, title and note each one gets.
// Shared by build.mjs (the portal), scripts/check.mjs and scripts/collect.mjs, so they agree.
import { statSync, readdirSync, existsSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import { DEFAULT_RULES } from './rules.mjs';

export function listKitFiles(C) {
  const walk = (p) => {
    const abs = join(C.kit, p);
    if (!existsSync(abs)) return [];
    if (statSync(abs).isFile()) return [p];
    return readdirSync(abs).sort().flatMap((n) => walk(p ? `${p}/${n}` : n));
  };
  return C.portal.publish.flatMap(walk).filter((p) => !/(^|\/)\./.test(p) && !C.portal.exclude.some((re) => re.test(p)));
}

const cap = (s) => s.replace(/^\w/, (c) => c.toUpperCase());

export function titleFor(C, p) {
  const prefix = C.brand.filePrefix ? new RegExp(`^${C.brand.filePrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i') : /^$/;
  // PNG size folders (logos/png/<variant>/800px.png) need the folder in the title.
  const m = p.match(/^logos\/png\/([^/]+)\/(\d+)px\.png$/);
  if (m) return `${cap(m[1].replace(prefix, '').replace(/-/g, ' '))}, ${m[2]} px`;
  if (p.startsWith('fonts/')) return basename(p, extname(p)).replace(/([a-z])([A-Z])/g, '$1 $2').replace(/-/g, ' ');
  return cap(basename(p, extname(p)).replace(prefix, '').replace(/[-_]+/g, ' ')
    .replace(/\b(\d+)x(\d+)\b/g, '$1×$2').replace(/\b(\d+)px\b/, '$1 px').trim());
}

export function classify(C, p) {
  const rule = [...C.rules, ...DEFAULT_RULES].find(([re]) => re.test(p));
  const cat = rule ? rule[1] : p.split('/')[0];
  return {
    cat,
    title: (rule && rule[2]) || titleFor(C, p),
    desc: rule ? rule[3] : '',
    known: C.categories.some(([id]) => id === cat),
  };
}
