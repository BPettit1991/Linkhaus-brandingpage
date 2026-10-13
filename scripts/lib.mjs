// Small helpers shared by the setup scripts.
export const slug = (s) => String(s).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const isHex = (s) => /^#[0-9a-f]{6}$/i.test(String(s).trim());

// Pre-filled "create account API token" link. The dashboard's permission search hides zone
// permissions such as Workers Routes, so a template link is the reliable way to get them all.
export const TOKEN_PERMISSIONS = [
  { key: 'workers_scripts', type: 'edit' }, // deploy the portal Worker
  { key: 'workers_r2', type: 'edit' }, // upload files to the R2 bucket
  { key: 'workers_routes', type: 'edit' }, // attach the custom domain (zone permission)
  { key: 'access', type: 'edit' }, // keep the sign-in list and Access apps in step
];
export function tokenUrl(name = 'Brand portal (GitHub)') {
  return `https://dash.cloudflare.com/?to=/:account/api-tokens&permissionGroupKeys=${encodeURIComponent(JSON.stringify(TOKEN_PERMISSIONS))}&name=${encodeURIComponent(name)}`;
}
