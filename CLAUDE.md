# Brand subdomain template: instructions for Claude

This repo is a template that builds a brand kit (`generators/`) and publishes it on a private, sign-in protected brand portal (`brand.<domain>`) on Cloudflare Workers + R2 + Access. Brand-specific data lives only in `brand.config.json`, `access-users.txt` and `kit/`. The code in `portal/` and `generators/` is shared and tested; change it only to fix or improve it for every brand, and put new options behind config.

## When asked to set up a brand portal ("make one for Acme", "replicate the brand page")
Use the `new-brand-portal` skill in `.claude/skills/`. In short:
1. `npm run setup`, then `npm run new-brand -- --from brief.json --yes` (or flags; see the top of `scripts/new-brand.mjs`).
2. Fill `kit/`: `npm run collect -- <folder>` for existing assets, logo SVG masters in `kit/logos/svg` (`npm run trace` for raster logos), then `npm run generate` (and `-- --video`). See `prompts/build-brand-kit.md`.
3. `npm run check` until clean, `npm test`, `npm run build`, `npm run preview`, then screenshot at 1360 px and 390 px.
4. Commit on a branch, push, open a PR.
5. Give the owner `docs/SETUP.md` steps as click paths, with `npm run token-url` output. You cannot do these yourself: they create credentials.
6. After deploy, `npm run verify -- <portal domain>`; ask the owner to test sign-in and a download.

## Rules
- `portal/worker.js` must keep failing closed: no sign-in, no files. Never add a bypass beyond `ACCESS_DISABLED` in `.dev.vars` for local use. Run `npm test` after any change to it.
- Never commit tokens or secrets. Account IDs and AUD tags are not secret, but they belong in GitHub variables, not files.
- Ask before deleting DNS records, changing email DNS, sending email, or removing people (`prune`).
- The build must fail on uncategorised files; fix the file or add a `rules` entry instead of weakening that.
- Keep the template working out of the box: `npm test`, `npm run check` and `npm run build` must pass on the bundled demo kit, and `npm run generate` must run on it.
- Don't commit generated demo output to the template's own `kit/` (keep the demo small); test generators in a scratch copy.
- `reference/` is read-only reference code, not part of the build.
- Cloud sandboxes often block `*.workers.dev` and `*.cloudflareaccess.com`. Verify live behaviour from GitHub Actions (the workflow runs `verify-live`) or ask the owner.
- `wrangler dev` may hang in sandboxes; use `npm run preview` for the UI and Node tests for the Worker.

## Layout
`portal/config.mjs` (loads and validates the config, derives the theme) · `portal/rules.mjs` (default file labels) · `portal/classify.mjs` (shared by build, check and collect) · `portal/build.mjs` · `portal/worker.js` · `portal/sync-r2.mjs` · `portal/sync-access.mjs` · `portal/resolve-access-team.mjs` · `portal/ensure-access-app.mjs` · `portal/src/` (UI) · `generators/` (`lib.mjs` brand data and renderer, `logos`, `static`, `guides`, `film`/`video`/`soundtrack`, `trace`, `icons`, tests in `test/`) · `scripts/` (setup tools) · `reference/jrm-electrical/` (bespoke JRM scripts) · `.github/workflows/brand-portal.yml`.
