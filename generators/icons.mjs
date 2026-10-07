// Line icons (24×24, stroked) for services, contact rows and credentials. Pick one per service
// with business.services[].icon. Add your own here; keep the same stroke style so they match.
export const ICONS = {
  phone: '<path d="M5 3.5h3.2l1.6 4.2-2.1 1.3a11 11 0 0 0 7.3 7.3l1.3-2.1 4.2 1.6V19a1.5 1.5 0 0 1-1.6 1.5A16.5 16.5 0 0 1 3.5 5.1 1.5 1.5 0 0 1 5 3.5z"/>',
  mail: '<rect x="3" y="5.5" width="18" height="13" rx="1.5"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.6 3.8 5.6 3.8 9s-1.2 6.4-3.8 9c-2.6-2.6-3.8-5.6-3.8-9S9.4 5.6 12 3z"/>',
  pin: '<path d="M12 21s-6.5-6.2-6.5-11.2a6.5 6.5 0 0 1 13 0C18.5 14.8 12 21 12 21z"/><circle cx="12" cy="9.8" r="2.4"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="m7.8 12.3 2.8 2.8 5.6-5.8"/>',
  star: '<path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.3l3.4 2"/>',
  shield: '<path d="M12 3 5 5.8v5.6c0 4.5 3 8 7 9.6 4-1.6 7-5.1 7-9.6V5.8z"/><path d="m8.8 12 2.3 2.3 4.2-4.4"/>',
  bolt: '<path d="M13.5 2.5 5 13.5h6l-1 8 8.5-11h-6z"/>',
  snowflake: '<path d="M12 2.5v19M3.8 7.2l16.4 9.6M3.8 16.8l16.4-9.6M9.5 4.5 12 7l2.5-2.5M9.5 19.5 12 17l2.5 2.5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/>',
  battery: '<rect x="3" y="7" width="16" height="10" rx="1.5"/><path d="M21 10.5v3M9.5 9.5 8 12.3h3.5L10 14.8"/>',
  wrench: '<path d="M14.7 3.5a5 5 0 0 0-5.3 6.7L3.5 16.1a2 2 0 0 0 2.8 2.8l5.9-5.9a5 5 0 0 0 6.7-5.3l-3 3-2.6-.5-.5-2.6z"/>',
  droplet: '<path d="M12 3s-6.5 7-6.5 11.3a6.5 6.5 0 0 0 13 0C18.5 10 12 3 12 3z"/>',
  home: '<path d="M3.5 11 12 4l8.5 7"/><path d="M5.5 9.5V20h13V9.5M10 20v-5.5h4V20"/>',
  leaf: '<path d="M5 19c0-8 5-13.5 15-14-.5 10-6 15-14 15"/><path d="M5 19c3-4 6-6.5 9.5-8.5"/>',
  hammer: '<path d="m13.5 6.5 4 4M3.5 20.5l9-9M11 4.5l3-1.5 6 6-1.5 3-1.5-1.5-3 3-4-4 3-3z"/>',
  brush: '<path d="M18.5 3.5 10 12M7.5 13.5c-2 0-3.5 1.5-3.5 3.5 0 1.5-.8 2.5-1.5 3 3.5.8 7-.5 7.5-3.5l2-2-2.5-2.5z"/>',
  truck: '<path d="M2.5 6.5h11v9h-11zM13.5 9.5h4l3 3.5v2.5h-7"/><circle cx="6.5" cy="17" r="1.8"/><circle cx="17" cy="17" r="1.8"/>',
  sparkle: '<path d="M12 3c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7zM19 15.5c.3 1.8 1 2.5 2.5 2.8-1.5.3-2.2 1-2.5 2.7-.3-1.7-1-2.4-2.5-2.7 1.5-.3 2.2-1 2.5-2.8z"/>',
  users: '<circle cx="9" cy="8.5" r="3.2"/><path d="M3 19.5c.6-3.3 3-5.3 6-5.3s5.4 2 6 5.3"/><path d="M15.5 5.6a3.2 3.2 0 0 1 0 5.8M17.5 14.6c1.8.7 3 2.4 3.5 4.9"/>',
  chart: '<path d="M3.5 20.5h17M6.5 17v-5M11 17V7.5M15.5 17v-7M20 17V4.5"/>',
  camera: '<path d="M3.5 7.5h4l1.5-2.5h6l1.5 2.5h4v12h-17z"/><circle cx="12" cy="13" r="3.6"/>',
  cup: '<path d="M4.5 8.5h12v5a6 6 0 0 1-12 0zM16.5 9.5h1.5a2.5 2.5 0 0 1 0 5h-1.8M7.5 3.5v2M10.5 3v2.5M13.5 3.5v2"/>',
  heart: '<path d="M12 20s-8-4.8-8-10.4A4.4 4.4 0 0 1 12 7a4.4 4.4 0 0 1 8 2.6C20 15.2 12 20 12 20z"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 8.5-8.5M16 7l2.5 2.5M18 5l2 2"/>',
  ruler: '<path d="m3.5 16.5 13-13 4 4-13 13zM7 13l2 2M10 10l2 2M13 7l2 2"/>',
  car: '<path d="M4 16.5V12l2-5h12l2 5v4.5zM4 12h16"/><circle cx="7.5" cy="16.5" r="1.8"/><circle cx="16.5" cy="16.5" r="1.8"/>',
};

export const iconNames = Object.keys(ICONS);

// Raw icon SVG, stroked in `color`.
export function iconSvg(name, color, { size = '100%', stroke = 1.7 } = {}) {
  const body = ICONS[name] || ICONS.check;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" style="display:block">${body}</svg>`;
}
