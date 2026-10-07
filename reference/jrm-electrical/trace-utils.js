const fs = require('fs');

const BLACK = 'rgb(27,26,27)';
const GRAY_ARTIFACT = 'rgb(95,94,101)';
const GOLD = 'rgb(166,121,57)';
const WHITE = 'rgb(255,255,255)';

function attr(tag, name) {
  const m = tag.match(new RegExp(name + '="([^"]*)"'));
  return m ? m[1] : null;
}

function bbox(d) {
  const nums = (d.match(/-?\d+\.?\d*/g) || []).map(Number);
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (let i = 0; i < nums.length - 1; i += 2) {
    const x = nums[i], y = nums[i + 1];
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
  }
  return { minX, maxX, minY, maxY };
}

function contains(outer, inner, tol = 2) {
  return inner.minX >= outer.minX - tol && inner.maxX <= outer.maxX + tol &&
    inner.minY >= outer.minY - tol && inner.maxY <= outer.maxY + tol;
}

// Parses the raw traced SVG into icon / wordmark / subtitle groups (each an
// array of {d, fill, bb}), dropping the full-canvas background rect.
function loadGroups(svgPath) {
  const src = fs.readFileSync(svgPath, 'utf8');
  const tags = src.match(/<path[^>]*\/>/g);
  const groups = { icon: [], wordmark: [], subtitle: [] };
  for (const tag of tags) {
    const d = attr(tag, 'd');
    const fill = attr(tag, 'fill');
    const bb = bbox(d);
    const w = bb.maxX - bb.minX, h = bb.maxY - bb.minY;
    if (w > 1900 && h > 1900) continue; // background rect
    let group;
    if (bb.maxY <= 1140) group = 'icon';
    else if (bb.minY > 1140 && bb.maxY <= 1760) group = 'wordmark';
    else if (bb.minY >= 1800) group = 'subtitle';
    else continue;
    groups[group].push({ d, fill, bb });
  }
  return groups;
}

// Merges each white "hole patch" into its containing black/gray shape as a
// second subpath with fill-rule evenodd, so the hole is a true vector hole
// (transparent on any background/color) instead of an opaque white patch.
// Returns a flat array of {d, fill, isMerged} ready to recolor and emit.
function mergeHoles(groupPaths) {
  const dark = groupPaths.filter(p => p.fill === BLACK || p.fill === GRAY_ARTIFACT);
  const white = groupPaths.filter(p => p.fill === WHITE);
  const other = groupPaths.filter(p => p.fill !== BLACK && p.fill !== GRAY_ARTIFACT && p.fill !== WHITE);

  const holesUsed = new Set();
  const merged = dark.map(outer => {
    let d = outer.d;
    white.forEach((inner, idx) => {
      if (holesUsed.has(idx)) return;
      if (contains(outer.bb, inner.bb)) {
        d += ' ' + inner.d;
        holesUsed.add(idx);
      }
    });
    return { d, fill: outer.fill, evenodd: d !== outer.d };
  });

  // Any white path not matched to a container is emitted as-is (shouldn't
  // normally happen, but keep it rather than silently dropping content).
  const leftoverWhite = white.filter((_, idx) => !holesUsed.has(idx)).map(p => ({ d: p.d, fill: p.fill, evenodd: false }));

  return [...merged, ...leftoverWhite, ...other.map(p => ({ d: p.d, fill: p.fill, evenodd: false }))];
}

function recolor(mergedPaths, toWhite) {
  return mergedPaths.map(p => {
    let fill = p.fill;
    if (toWhite && (fill === BLACK || fill === GRAY_ARTIFACT)) fill = WHITE;
    const fr = p.evenodd ? ' fill-rule="evenodd"' : '';
    return `<path d="${p.d}" fill="${fill}"${fr}/>`;
  }).join('\n');
}

module.exports = { BLACK, GRAY_ARTIFACT, GOLD, WHITE, loadGroups, mergeHoles, recolor, bbox, attr, contains };
