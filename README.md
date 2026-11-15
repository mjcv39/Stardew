# Pelican Companion — Stardew Valley wiki & farm dashboard

A static, no-build web app: open `index.html` (or serve the folder with any static host, e.g. `python3 -m http.server`).

## Features
- **Personalized dashboard** – date, gold, upcoming birthdays/festivals, crops to plant now (with last-plant date), fish catchable by season/weather/time, deadlines, next milestones.
- **Interactive calendar** – birthdays with portraits, festivals, last day to plant, your logged plantings → harvest dates, goals, reminders; filters; click a day for details.
- **Progress tracker** – story, exploration, collections (fish/museum checklists), relationships (hearts grid), farm development, wealth. Items are labelled **auto** (detected from the save) or **manual**.
- **Wiki database** – 16 categories / 28 datasets (villagers, crops, fish, recipes, bundles, minerals, monsters, festivals…) with filters, table/card views, detail pages and cross-links ("used in recipes", "CC bundles", "loved by").
- **Global search** with autocomplete (`/` to focus), category/season filters.
- **Goals** with deadlines that show up on the calendar and dashboard.
- **Multiple farms**, backup/restore (JSON).

## Save files & privacy
Everything runs in the browser. The save is read with the File API and parsed by `js/save.js`; only a compact summary is kept in `localStorage`. Nothing is uploaded. A website cannot silently read your game folder, so you either pick the save file, or (Chrome/Edge) grant read access to your `Saves` folder once and re-sync with one click. Re-importing the same farm updates it in place and keeps goals/manual checks.
Detection targets save formats 1.5/1.6 on a best-effort basis; anything not found is shown as manual. Museum counts are "found", not necessarily "donated". Mobile saves live in app-private storage and must be copied somewhere pickable.

## Data accuracy — please read
The sandbox this was built in could not reach stardewvalleywiki.com, so datasets in `js/data/` were **written from game knowledge, not scraped**. Fish, crops, bundles, birthdays and most gift loves are well covered; some lists are **intentionally partial** (likes/hates, weapons, monsters stats, special orders, heart-event details) and some values may be off. Every entry links to the official wiki page for verification. Data is plain structured JS — fix or extend it in one place and the whole app updates. A natural next step is a script that pulls the wiki's MediaWiki API into these files.

## Art
Game art is copyrighted, so none is bundled: items use emoji on pixel-framed tiles, villagers get generated 16×16 pixel portraits (`SDV.util.portrait`). You can swap in your own sprites by editing `icon()` / `portrait()` in `js/core.js`.

## Tests
`node tests/smoke.js` (needs Playwright and a static server on :8123) loads ~700 routes, imports `tests/sample-save.xml`, and fails on JS errors.
