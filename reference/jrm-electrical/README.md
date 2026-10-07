# Reference: the hand-built JRM Electrical generators

These are the scripts that built the original JRM Electrical kit (brand.jrmcontracting.com.au), copied
from the JRM-Electrical-Brandkit repository for reference. They are **not run by this template**: they
hard-code JRM's colours, contact details and the path indices of JRM's traced logo, and they expect
JRM's folder layout and photos.

Use `generators/` for new brands. Look here when a brand needs something the generic generators don't do:

| File | What it shows |
|---|---|
| `trace-utils.js`, `split-trace.js` | Splitting a traced logo into icon / wordmark / subtitle groups and merging counters (`fill-rule="evenodd"`). |
| `build-badge.js`, `rasterize-badge.js` | A circular badge: text on a path, service medallions, spaced phone number. |
| `media/lib.cjs` | Recomposing lockups (horizontal, wordmark-only) from the parts of one master SVG. |
| `media/premium.cjs` | The "premium" backdrop: ghost mark, honeycomb, chevron, streaks and flares. |
| `media/build-static.cjs` | Social, print and digital layouts with photos and a review QR code. |
| `media/film-page.cjs`, `media/build-video.cjs` | The 30 s film with an animated logo build (brackets, bolt strike, letters). |
| `media/soundtrack.py` | Python/numpy soundtrack synthesis with a mains-hum motif (the generic one is `generators/soundtrack.mjs`). |

To reuse an idea, port it into `generators/` behind a config option so every brand can use it.
