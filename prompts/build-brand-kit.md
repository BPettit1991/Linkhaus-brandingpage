# Prompt: design and generate a brand kit in this repo

Paste this into a Claude Code session opened on a copy of this template. Fill in the brief first, or put it in `brief.json` (same keys as `brief.example.json`, plus the creative fields below) and say "use brief.json".

```
Business name:          {{…}}
Short name / wordmark:  {{…}}
Trade / industry:       {{…}}
Services (3 to 6):      {{…}}
Service area:           {{…}}
Phone / email / site:   {{…}}
Licence / ABN / creds:  {{…}}
Tagline (optional):     {{…}}
Language / spelling:    {{e.g. Australian English}}
Existing assets:        {{folder path, links, or "none"}}
Reference / mood:       {{attached images or a description}}
Colours / fonts:        {{fixed values, or "derive from the logo" / "choose open-licence fonts"}}
Portal access:          {{emails or @domains}}
```

---

You are building a complete brand kit for the business above, inside this repository's `kit/` folder, so the brand portal publishes it. Read `README.md`, `docs/KIT.md` and `CLAUDE.md` first. Use the brief's language, plain direct copy, and no em dashes. Work in phases, and show the owner results (screenshots) at the end of each phase before starting the next.

**Phase 0: set up and collect**
1. Run `npm run setup` and `npx --prefix generators playwright install chromium` (once per machine), then `npm run new-brand -- --from brief.json --clear-demo --yes` (or pass flags).
2. If assets exist, run `npm run collect -- <folder> --dry-run`, review the plan, then run it for real. File anything in `kit/_unsorted/` by hand, or ask about it.
3. Keep originals untouched in `kit/../source/` (not published), with a `SOURCES.md` that records where each came from.
4. Audit what exists against the checklist in `docs/KIT.md` and report:
   - what is usable as-is;
   - what needs rebuilding (raster-only logo, low resolution, inconsistent colours);
   - what is missing.

**Phase 1: foundations**
- **Logo:** if no vector exists, trace it: `npm run trace -- source/logo.jpg --colors "#1B1A1B,#A67939" --out kit/logos/svg/<prefix>logo-stacked-light-bg.svg`, then again with `--map "#1B1A1B=#FFFFFF"` for the dark-background version. Check it at 400% against the source; counters must stay open. Never redesign the mark without approval.
- **Logo masters** in `kit/logos/svg`, named so the generators find them: `<prefix>icon-dark-bg.svg`, `<prefix>logo-horizontal-dark-bg.svg`, `<prefix>logo-stacked-dark-bg.svg`, each with a `light-bg` twin. If the brand only has one lockup, build the others by recomposing the traced parts (see `reference/jrm-electrical/media/lib.cjs`), or set `"logos"` in `brand.config.json`.
- **Colours:** set `theme.ink`, `theme.accent` (and `"colours"` for a named palette with usage notes). Check WCAG AA text contrast; `npm run check` reports it.
- **Fonts:** open-licence fonts in `kit/fonts/` with their licences, and `theme.fonts` pointing at them. The generators and the portal both use them.
- **Content:** fill `"business"` in `brand.config.json` (tagline, phone, email, website, areas, credentials, ABN, services with icon, headline lines and a blurb, optional photo and review link). `new-brand --from brief.json` writes most of it.
- If the mark sits on a background tile, set `"generate": { "mono": false }`.

**Phase 2: deliverables, generated from code**
1. `npm run generate` builds, in about 30 s:
   - colours JSON + CSS, the style guide and README (only if missing; `--force` regenerates them);
   - one-colour logos, PNGs at 180 to 3000 px, favicons and app icons;
   - social: profile pictures, covers for Facebook, LinkedIn, X, YouTube and Google Business, a post per service, a credentials post, a story, and a review post and story with a QR code when `reviewUrl` is set;
   - digital: email signature, video-call background, share image;
   - print with previews: business card (dark and light backs), A4 letterhead, DL compliments slip, site sign, vehicle magnet and a service label.
2. `npm run generate -- --video` adds the 30 s film, 15 s cut and 6 s logo sting at 16:9, 9:16 and 1:1, with posters and an original soundtrack at -14 LUFS (a few minutes; needs ffmpeg).
3. Review everything at 100% and on a phone. Fix copy in the config and re-run. For anything the generic layouts can't do (a badge, an animated logo build, photo-led posts), extend `generators/` behind a config option so other brands get it too; `reference/jrm-electrical/` has worked examples.
- **Quality bar:**
  - no text touching edges, nothing cut off in any aspect ratio;
  - phone numbers and licence numbers checked against the brief;
  - no unlicensed imagery (service photos must be the owner's or licensed);
  - tell the owner about any compromise.

**Phase 3: publish**
1. Run `npm run check` until it reports no problems, then `npm run build && npm run preview` and screenshot the portal at desktop and 390 px widths.
2. Commit, push and open a PR.
3. Walk the owner through `docs/SETUP.md` (each step is a click path; they paste the token).
4. After the first locked deploy and step 4, re-run the workflow, confirm `npm run verify -- <portal domain>` passes, and ask the owner to test sign-in and a download.
5. Draft (don't send) an invite email with the link and the 3 sign-in steps.

**Never:** commit secrets; weaken `portal/worker.js` (it must keep failing closed); touch email DNS records without a yes; delete the owner's files.
