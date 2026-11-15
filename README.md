# Your Little Farm

A cozy, personal Stardew Valley companion: it reads **your** save file, shows what is happening on **your** farm, and (in later phases) tracks progression, keeps a scrapbook and offers planning tools. It is *not* a wiki.
Static site, no build step: open `index.html`, or `npm start` (tiny Node server used for Railway).

## Status by phase
| Phase | Scope | Status |
|---|---|---|
| 1 | Redesign, six-place navigation, farm dashboard, farm profiles, manual entry, goals | ✅ built & tested |
| 2 | Save import, Saves-folder sync, connection status, activity feed | ✅ built & tested (synthetic save) |
| 3 | Progress tracker + Perfection | ⏳ not built (page says so) |
| 4 | Seasonal calendar | ⏳ not built |
| 5 | Journal, gallery, memories, year in review | ⏳ not built |
| 6 | Planning tools (crops, fish, gifts, CC, daily, challenges, farm designer) | ⏳ not built |
| 7 | SMAPI mod + local companion (live connection) | ⏳ not built — **nothing claims to be live** |
| 8 | Polish | partly: Moss assistant, seasonal/night themes exist |

## How the farm connection really works
- **Import** – you choose the save file; it is parsed in the browser (`js/modules/save.js`). Never uploaded.
- **Saves folder (Chrome/Edge desktop)** – grant read access once; while the tab is open it re-checks every 15 s and can auto-import newer saves. Browsers cannot watch files in the background or without permission.
- **Live in-game events** need a SMAPI mod + local companion app (Phase 7). The game only writes the save when you sleep.
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
tests/e2e.js          Playwright end-to-end checks (static server on :8123)
```
## Data accuracy
Game data in `js/data/` was written from game knowledge because the official wiki was unreachable while building; it is not cross-checked line by line. Likes/hates, some prices and unlock details are partial. Save detection was verified against a synthetic 1.5/1.6-style save, not many real saves. Fan project, not affiliated with ConcernedApe; no game art is included (all art is original).
