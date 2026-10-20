// Prints the pre-filled Cloudflare account API token link for this brand's portal.
//   npm run token-url
import { loadConfig } from '../portal/config.mjs';
import { tokenUrl, TOKEN_PERMISSIONS } from './lib.mjs';

const C = loadConfig();
console.log(`Open this while signed in to Cloudflare, pick the account that holds the domain, and create the token:\n\n${tokenUrl(`${C.brand.shortName} brand portal (GitHub)`)}\n`);
console.log(`Permissions: ${TOKEN_PERMISSIONS.map((p) => `${p.key}:${p.type}`).join(', ')}.`);
console.log('If it asks which zone Workers Routes applies to, choose the portal domain. Save the token as the GitHub secret CLOUDFLARE_API_TOKEN.');
