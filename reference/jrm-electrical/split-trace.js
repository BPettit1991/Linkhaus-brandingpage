const fs = require('fs');
const path = require('path');
const { loadGroups, mergeHoles, recolor } = require('./trace-utils');

const groups = loadGroups(path.join(__dirname, '../00-source/jrm-logo-traced.svg'));

function wrapSvg(viewBox, inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">\n${inner}\n</svg>\n`;
}

const outDir = path.join(__dirname, '../logos/svg');
fs.mkdirSync(outDir, { recursive: true });

// Full lockup (icon + wordmark + subtitle), transparent background
const fullMerged = mergeHoles([...groups.icon, ...groups.wordmark, ...groups.subtitle]);
fs.writeFileSync(path.join(outDir, 'jrm-logo-full-light-bg.svg'), wrapSvg('0 0 2048 2048', recolor(fullMerged, false)));
fs.writeFileSync(path.join(outDir, 'jrm-logo-full-dark-bg.svg'), wrapSvg('0 0 2048 2048', recolor(fullMerged, true)));

// Icon only, cropped to bbox with padding
const iconMerged = mergeHoles(groups.icon);
const allBB = groups.icon.map(p => p.bb);
const iconBB = {
  minX: Math.min(...allBB.map(b => b.minX)), maxX: Math.max(...allBB.map(b => b.maxX)),
  minY: Math.min(...allBB.map(b => b.minY)), maxY: Math.max(...allBB.map(b => b.maxY)),
};
const pad = 40;
const iconViewBox = `${Math.floor(iconBB.minX - pad)} ${Math.floor(iconBB.minY - pad)} ${Math.ceil(iconBB.maxX - iconBB.minX + pad * 2)} ${Math.ceil(iconBB.maxY - iconBB.minY + pad * 2)}`;
fs.writeFileSync(path.join(outDir, 'jrm-icon-only-light-bg.svg'), wrapSvg(iconViewBox, recolor(iconMerged, false)));
fs.writeFileSync(path.join(outDir, 'jrm-icon-only-dark-bg.svg'), wrapSvg(iconViewBox, recolor(iconMerged, true)));

console.log('Icon viewBox:', iconViewBox);
console.log('Split complete. Hole-merge counts:', {
  full: fullMerged.filter(p => p.evenodd).length,
  icon: iconMerged.filter(p => p.evenodd).length,
});
