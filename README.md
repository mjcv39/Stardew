# Your Little Farm

A cozy, personal Stardew Valley companion: it reads **your** save file, shows what is happening on **your** farm, and (in later phases) tracks progression, keeps a scrapbook and offers planning tools. It is *not* a wiki.
Static site, no build step: open `index.html`, or `npm start` (tiny Node server used for Railway).

## Status by phase
| Phase | Scope | Status |
|---|---|---|
| 1 | Redesign, six-place navigation, farm dashboard, farm profiles, manual entry, goals | ✅ built & tested |
| 2 | Save import, Saves-folder sync, connection status, activity feed | ✅ built & tested (synthetic save) |
| 3 | Progress tracker, Perfection, villager profiles | ✅ built & tested |
| 4 | Seasonal calendar, seasonal overview, prepare-for-next-season | ✅ built & tested |
| 5 | Journal, memories, gallery/albums, year in review | ✅ built & tested |
| 6 | Planning tools (daily, crops, fish, gifts, CC, challenges, farm designer) | ✅ built & tested |
| 7 | Live connection: companion app, secure pairing, website connector | ✅ built & tested end-to-end with a **simulated** mod |
| 7 | SMAPI mod (`companion/YourLittleFarmMod`) | ⚠️ source written, **not compiled or tested against the real game** |
| 7 | Secure multi-device sync (relay) | ⏳ designed only, not built |
| 8 | Polish | partly: Moss assistant, seasonal/night themes exist |

## How the farm connection really works
- **Import** – you choose the save file; it is parsed in the browser (`js/modules/save.js`). Never uploaded.
- **Saves folder (Chrome/Edge desktop)** – grant read access once; while the tab is open it re-checks every 15 s and can auto-import newer saves. Browsers cannot watch files in the background or without permission.
- **Companion app** (`companion/`, see its README): run `node ylf-companion.js`, pair with a 6-digit code, pick your farm — the site then imports every new save automatically (while the tab is open). With the optional SMAPI mod it also receives real-time snapshots. The mod is **not yet compiled/tested**; until it is, treat real-time events as unverified.
- The game only writes the save when you sleep.
- Statuses shown: not connected · connected through save import · successfully synchronized · waiting for an updated save · (live — only when Phase 7 exists).
- Automatic values are tagged `auto`; anything you type is tagged `manual`. Manual farms never show invented statistics.

## Privacy
No server, no account. Everything lives in this browser (localStorage / IndexedDB). Export, restore and delete-everything are in *My Little Guide → Data & privacy*. Details are on that page.

## Architecture
```
index.html            shell (scene, six-place nav, Moss)
css/ylf.css           design system (seasonal + night themes)
js/core.js art.js sprites.js    utilities · original SVG art · original pixel sprites
js/data/*             pure game data (no UI)
js/modules/           save · store · logic · activity · sync · recs · assistant · ui
js/pages/             farm · guide · later (honest placeholders)
tests/e2e.js          Playwright checks for dashboard/import (static server on :8123)
tests/e2e-live.js     companion + pairing + security + live feed (simulated mod), 38 checks
tests/e2e-sections.js progress, calendar, journal and planning tools (~80 checks)
companion/            local companion app, SMAPI mod source, developer simulator
```
## Data accuracy
Game data in `js/data/` was written from game knowledge because the official wiki was unreachable while building; it is not cross-checked line by line. Likes/hates, some prices and unlock details are partial. Save detection was verified against a synthetic 1.5/1.6-style save, not many real saves. Fan project, not affiliated with ConcernedApe; no game art is included (all art is original).
