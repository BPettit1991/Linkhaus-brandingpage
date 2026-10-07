const fs = require('fs');
let html = fs.readFileSync('style-guide.html', 'utf8');

const replacements = [
  [
    `(Segoe UI / Arial) where Poppins isn't available — e.g. plain-text emails. Free to download at\n      <span style="color:var(--gold)">fonts.google.com/specimen/Poppins</span> (SIL Open Font License — free for commercial use).`,
    `(Segoe UI / Arial) where Poppins isn't available, e.g. plain-text emails. Free to download at\n      <span style="color:var(--gold)">fonts.google.com/specimen/Poppins</span> (SIL Open Font License, free for commercial use).`
  ],
  [
    `<li>Don't recolor the gold — it's the one fixed accent color across every version</li>`,
    `<li>Don't recolor the gold. It's the one fixed accent color across every version</li>`
  ],
  [
    `<li>Don't retype "JRM" in a font — always use the logo file</li>`,
    `<li>Don't retype "JRM" in a font. Always use the logo file</li>`
  ],
  [
    `JRM Electrical Contracting — Brand Style Guide · Rebuilt from source logo, {DATE}`,
    `JRM Electrical Contracting: Brand Style Guide · Rebuilt from source logo, 17 September 2026`
  ],
];

let missing = [];
for (const [from, to] of replacements) {
  if (!html.includes(from)) { missing.push(from.slice(0, 60)); continue; }
  html = html.split(from).join(to);
}

fs.writeFileSync('style-guide.html', html);
console.log('Done. Missing (not found, check manually):', missing);

// Verify no em dashes remain
const remaining = (html.match(/—/g) || []).length;
console.log('Remaining em dashes in style-guide.html:', remaining);
