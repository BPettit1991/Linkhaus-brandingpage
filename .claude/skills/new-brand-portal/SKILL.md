---
name: new-brand-portal
description: Set up this template as a private brand portal (brand.<domain>) for a new business. Configure it, collect or build the kit, check, preview, push, and walk the owner through the Cloudflare and GitHub steps. Use when asked to create, replicate or spin up a brand portal, brand page or brand subdomain for a business.
---

# New brand portal

## 1. Brief
Get these from the user, or from a `brief.json` they provide (format: `brief.example.json`):
- business name and short name;
- website domain (portal defaults to `brand.<domain>`);
- phone;
- accent colour (`#rrggbb`; derive it from the logo if not given);
- who gets access (emails, `@domain`);
- where existing assets are;
- for the kit: tagline, email, service areas, licences/ABN, 3 to 6 services (name, icon, a short headline, one sentence), a Google review link.

Ask only for what's missing.

## 2. Configure
```bash
npm run setup
npx --prefix generators playwright install chromium   # once per machine
npm run new-brand -- --from brief.json --clear-demo --yes
```
Check `brand.config.json`. `workerName` and `bucket` must be unique in the Cloudflare account; add a suffix if the owner already has a portal with that short name.

## 3. Fill the kit
- **Existing assets:** `npm run collect -- <folder> --dry-run`, review the plan, run it for real, then file anything in `kit/_unsorted/`.
- **Logo masters:** SVGs in `kit/logos/svg` (`icon`, `horizontal`, `stacked`, each `dark-bg`/`light-bg`). No vector? `npm run trace` (see `docs/KIT.md`).
- **Everything else:** `npm run generate` (social, print with previews, digital, logo sizes, app icons, style guide, README), then `npm run generate -- --video` for the films. Review the output at 100% and on a phone; fix copy in `business` and re-run. Details: `prompts/build-brand-kit.md`.
- **Theme:** set `theme.accent`, `theme.ink` and `theme.fonts` so the portal matches the brand. `npm run check` reports contrast.

## 4. Verify locally
```bash
npm run check      # must end "Ready to build and deploy."
npm test
npm run build && npm run preview
```
Screenshot http://localhost:8788 at 1360×900 and 390×844 (Playwright is fine). Check: no sideways scroll, logo in the header, swatches on the Colours tab, PDF previews, font specimens. Show the user.

## 5. Ship
Commit on a branch, push, open a PR, and merge when the user approves. Give the owner `docs/SETUP.md` as numbered click paths, including the output of `npm run token-url`. They must:
1. enable R2;
2. create the token from the link;
3. add `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` and `PORTAL_DOMAIN` in GitHub;
4. after the first (locked) deploy, enable Access on the workers.dev row, set the policy and add `ACCESS_AUD`.

Then re-run the workflow (Actions, Brand portal, Run workflow).

## 6. Confirm
- The workflow's "Check the portal is locked" step passes.
- `npm run verify -- <portal domain>` passes from wherever you can reach it.
- The owner signs in with an approved email in a private window and downloads a file.
- Draft the invite email (link + 3 sign-in steps). Don't send it.

## Pitfalls
- The domain must be in the same Cloudflare account. Mail DNS records must stay DNS only.
- Never add the custom domain by hand in the dashboard (deploys replace it); use `PORTAL_DOMAIN`.
- A team rename breaks sign-in until the next deploy; the pipeline re-resolves it on every run.
