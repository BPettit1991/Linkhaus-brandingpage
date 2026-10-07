# The kit folder: layout, names and what a full kit contains

Everything in these folders inside `kit/` is published; anything else (including `kit/_unsorted/`) is not. The published set is `portal.publish` in `brand.config.json`.

| Folder | Holds | Notes |
|---|---|---|
| `README.md`, `style-guide.html` | The kit guide and visual style guide | Shown under **Guides**. |
| `guides/` | Brand book PDFs, usage guides | |
| `logos/svg/` | SVG masters | Name with `light-bg`/`dark-bg`, `horizontal`/`stacked`, `icon`, `wordmark`, `mono-` so they're labelled automatically. |
| `logos/png/<variant>/<size>px.png` | PNG sizes, transparent | e.g. `logos/png/acme-logo-horizontal-dark-bg/800px.png` becomes "Logo horizontal dark bg, 800 px". |
| `logos/…badge…` | Circular badge or seal | Gets its own **Badge** tab. |
| `colors/` | `<brand>-colors.json` + `.css` (+ `.ase`) | JSON: `{ "colors": { "key": { "name", "hex", "rgb", "cmyk", "usage" } } }`. Only `hex` is required. Drives the swatches. |
| `fonts/` | WOFF2/TTF/OTF + licence `.txt` | Open-licence fonts only. Set `theme.fonts` to use them in the portal UI too. |
| `social/profile`, `covers`, `posts`, `stories` | Social images | Platform words in names (`facebook`, `linkedin`, `youtube`, `x-header`, `google`) pick the right note. |
| `print/` | Print-ready PDFs at true size with bleed | Add `print/previews/<same name>.png` for a picture preview (PDFs don't preview on most phones). |
| `digital/` | Email signature HTML, video-call background, share image | |
| `video/` | MP4s: `…-30s-16x9.mp4`, `…-15s-9x16.mp4`, `…-sting-6s-1x1.mp4` | Duration and aspect in the name give the details line. Add `video/posters/<same name>.jpg` for poster frames. Soundtracks (`.wav`) also go here. |

**File names:** lowercase, hyphens, and the brand prefix (`brand.filePrefix`, e.g. `acme-`), which is dropped from titles. `npm run collect` applies this.

**Labels:** every file gets a category, a title from its name and a "what it's for" note from `portal/rules.mjs`. Override or add with `rules` in `brand.config.json`:
```json
{ "match": "^print/.*van-wrap", "cat": "print", "title": "Van wrap", "desc": "Full van wrap artwork, Toyota HiAce LWB." }
```
The build fails on any file without a category, so nothing goes up unlabelled.

## What a complete kit contains (checklist)
- [ ] Logos: primary, horizontal, icon, wordmark. Each for light and dark backgrounds, plus one-colour. SVG + PNG 180/400/800/1600/3000 px.
- [ ] Badge or seal (optional; good for trades).
- [ ] Colours: JSON + CSS (+ ASE), with HEX, RGB, CMYK and usage for each colour.
- [ ] Fonts with licences.
- [ ] Social: profile picture, covers for Facebook, LinkedIn, YouTube and X, Google Business images, a post per service, stories.
- [ ] Print: business cards (front, dark back, light back), letterhead, compliments slip, site sign, vehicle magnet, trade labels. Previews for each.
- [ ] Digital: email signature, video-call background, share image (1200×630), favicon and app icons.
- [ ] Video: 30 s film, 15 s cut, 15 s credentials cut, 6 s logo sting, each in 16:9, 1:1 and 9:16, with posters and the soundtrack master.
- [ ] Guides: README (specs, platforms, printing) and style guide.

Everything except fonts, logo masters and the owner's photos can be generated: see below. To have Claude do the whole job, use `prompts/build-brand-kit.md`.

## Generating the kit
Inputs: `brand.config.json` (`brand`, `business`, `theme`, optional `logos`, `colours`, `generate`; documented in `brand.config.schema.json`), the logo SVG masters in `kit/logos/svg`, and fonts in `kit/fonts`.

```bash
npx --prefix generators playwright install chromium   # once per machine
npm run generate                       # about 30 s
npm run generate -- --video            # plus films and sting, a few minutes; needs ffmpeg
npm run generate -- --only print,social
```

| Step | Writes |
|---|---|
| `colours` | `colors/<prefix>colors.json` + `.css` (skipped if present; `--force` to redo) |
| `logos` | one-colour SVGs (white, black, accent), `logos/png/<master>/<size>px.png`, `logos/app-icons/` |
| `social` | profile ×3, five covers, a post per service, credentials post, story; review post + story if `reviewUrl` |
| `digital` | email signature, video-call background, share image |
| `print` | business card (dark and light back), letterhead, compliments slip, site sign, vehicle magnet, service label, each with `print/previews/<same name>.png` |
| `video` | `brand-film-30s`, `brand-film-15s`, `logo-sting-6s` × 16x9 / 9x16 / 1x1, posters, soundtrack WAVs |
| `guides` | `style-guide.html`, `README.md` (skipped if present; `--force` to redo) |

- **Logo masters are found by name:** `icon`, `horizontal`, `stacked`/`primary`/`full`, each with `dark-bg` or `light-bg`. A missing one falls back to the nearest (stacked to horizontal to icon; light to dark). Set `"logos"` to choose files explicitly.
- **No vector logo?** `npm run trace -- source/logo.jpg --colors "#1B1A1B,#A67939" --out kit/logos/svg/<prefix>logo-stacked-light-bg.svg`, and again with `--map "#1B1A1B=#FFFFFF"` for the dark version. Keep the source outside `kit/`.
- **Logo on a tile** (a coloured square behind the mark)? Set `"generate": { "mono": false }` so nothing is flooded to one colour.
- **Icons** for services: `bolt snowflake sun battery wrench droplet home leaf hammer brush truck sparkle users chart camera cup heart key ruler car shield star clock check`. Add more in `generators/icons.mjs`.
- Generated files are overwritten on each run; edit the config, not the outputs. Anything you add by hand under another name is left alone.
