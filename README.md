# Brand subdomain: a private brand portal for any business

A template that builds a brand kit and publishes it on a sign-in protected brand portal at `brand.<their-domain>`. Approved people can browse, preview, link to and download every master file in a brand kit: logos, colours, fonts, social, print, digital and video. It runs on Cloudflare (Workers + R2 + Access, all free-tier friendly) and republishes itself on every push.

It was extracted from the portal built for JRM Electrical (brand.jrmcontracting.com.au). Everything brand-specific lives in **`brand.config.json`** and the **`kit/`** folder. A fresh copy builds and deploys with the bundled **Example Co** demo brand before you change anything.

## What you get
- **Kit generators:** from one config file and the logo SVGs, `npm run generate` builds logos at every size, favicons, social covers, posts and stories, print-ready PDFs with previews, an email signature, a style guide, and (with `--video`) the brand film and logo sting in three aspect ratios with an original soundtrack. `npm run trace` turns a raster logo into vectors.
- **Portal:** search (`/`), category chips, and a viewer for images (dark/light/checker backgrounds), video, audio, PDFs (a preview picture first, then the full PDF), fonts as specimens, colours with copy buttons for HEX, RGB and CMYK, HTML and text.
- **Actions:** Download (real file name), Copy file link, Copy viewer link (`#file=` deep link), Open in new tab.
- **Works on a 390 px phone** with no sideways scrolling.
- **Security:** Cloudflare Access sign-in (email one-time code). The Worker also verifies the Access token itself, so a `workers.dev` address can't leak files, and it refuses everything until Access is set up. Kit HTML and SVG open in a sandbox.
- **Pipeline:** tests, kit check, build, then (once configured) an R2 upload of only changed files, the Worker deploy, the custom domain's Access app, a sign-in list sync, and a live check that the portal is locked.
- **Tools:**
  - `new-brand`: set up a brand in one command;
  - `collect`: import a messy folder of assets;
  - `check`: pre-flight check;
  - `preview`: local preview;
  - `token-url`: pre-filled Cloudflare token link;
  - `verify`: confirms the live portal is locked.

## Quick start (about 15 minutes plus the brand's files)
```bash
# 1. New repo from this template (GitHub: "Use this template"), clone it, then:
npm run setup                      # installs portal dependencies
npm run new-brand                  # asks: name, domain, phone, accent colour, who gets access
npm run collect -- ~/Downloads/acme-assets   # sort existing files into kit/ (optional)
npx --prefix generators playwright install chromium   # once per machine, for the generators
npm run generate                   # build the rest of the kit (add -- --video for the films)
npm run check                      # fix anything it reports
npm run build && npm run preview   # look at it on http://localhost:8788
git add -A && git commit -m "Acme brand portal" && git push
```
Then do the one-off Cloudflare and GitHub steps in **[docs/SETUP.md](docs/SETUP.md)**: about 10 minutes of clicks, mostly copy-paste. The pipeline does the rest.

To have Claude do all of it (brief, logo tracing, kit, portal), use **[prompts/build-brand-kit.md](prompts/build-brand-kit.md)** in a Claude Code session in this repo. Kit layout and the generated deliverables are in **[docs/KIT.md](docs/KIT.md)**.

## Repository map
| Path | What it is |
|---|---|
| `brand.config.json` | Everything brand-specific: names, Worker and bucket, theme, file notes. Schema in `brand.config.schema.json`. |
| `access-users.txt` | Who can sign in: emails or `@domain`, one per line. Synced to Cloudflare Access on deploy. |
| `kit/` | The brand's master files (published). `kit/_unsorted/` is never published. |
| `portal/` | The portal: `worker.js` (Access check and file serving), `build.mjs`, `sync-*.mjs`, UI in `src/`, tests in `test/`. |
| `generators/` | Kit generators: `logos`, `static` (social, digital, print), `guides`, `film` + `video` + `soundtrack`, `trace`. All brand data comes from the config. |
| `scripts/` | `new-brand`, `collect`, `check`, `preview`, `token-url`, `verify-live`, `make-demo-kit`. |
| `reference/jrm-electrical/` | The hand-built JRM generators, for ideas beyond the generic layouts. Not run. |
| `.github/workflows/brand-portal.yml` | Test, build, deploy, Access sync. |
| `docs/` | [SETUP](docs/SETUP.md) (first deploy), [KIT](docs/KIT.md) (folder and naming rules), [OPERATIONS](docs/OPERATIONS.md) (people, files, troubleshooting). |
| `prompts/` | Prompts for building a brand kit with Claude. |

## Commands
| Command | Does |
|---|---|
| `npm run setup` | Install portal and generator dependencies. The generators also need Chromium (`npx --prefix generators playwright install chromium`) and, for video, ffmpeg. |
| `npm run new-brand` | Configure for a brand; see `--help` in the file for flags or `--from brief.json`. |
| `npm run collect -- <folder> [--dry-run]` | Copy and sort existing assets into `kit/`. |
| `npm run trace -- <logo.png> --colors "#000000,#A67939" --out kit/logos/svg/<name>.svg` | Trace a raster logo into a vector, one layer per colour. |
| `npm run generate [-- --video] [-- --only print,social] [-- --force]` | Build the kit from the config and logo masters. |
| `npm run check` | Pre-flight: categories, logo, colours, previews, contrast, sizes, sign-in list. |
| `npm run build` | Build `portal/dist` and the deploy config. |
| `npm run preview` | Serve the built portal locally (no sign-in). |
| `npm test` | Portal and script tests. |
| `npm run token-url` | Print the pre-filled Cloudflare token link. |
| `npm run verify -- brand.example.com` | Confirm signed-out visitors are sent to sign-in. |
