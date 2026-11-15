# Your Little Farm — SMAPI connector (optional)

**Status: source only. NOT compiled and NOT tested against the real game.** I could not build or run it in the environment this project was written in (no .NET SDK, no Stardew Valley). Treat it as a carefully written starting point: you may need to adjust a few API names for your exact game version.
Everything else in Your Little Farm works without this mod (save import, Saves-folder sync, companion with automatic save detection).

## What it gives you
Real-time updates while you play (gold, time, location, energy, items, skills, friendships, collections, buildings) instead of only when the game saves.

## Build & install
1. Install the **.NET 6 SDK**, **SMAPI** and Stardew Valley 1.6.
2. `cd companion/YourLittleFarmMod && dotnet build` — the ModBuildConfig package finds your game and copies the mod to `Stardew Valley/Mods/YourLittleFarmMod`.
3. Start the **companion** (`node ylf-companion.js`), then the game. The mod reads `<ApplicationData>/YourLittleFarm/companion.json` (written by the companion) — no configuration needed.
4. In the website's *Connect your farm* page, step 4 shows **“connected”** once the mod's first heartbeat arrives.

## Events used (documented SMAPI APIs, no Harmony patches)
`GameLoop.SaveLoaded / DayStarted / DayEnding / Saved / OneSecondUpdateTicked / ReturnedToTitle`, `Player.InventoryChanged / LevelChanged`, `World.BuildingListChanged`, `Display.MenuChanged`.
Fish caught, museum donations, friendship and quest changes have no dedicated event, so the website detects them by comparing consecutive snapshots.
Please verify event/field availability on your game version (see https://stardewvalleywiki.com/Modding:Modder_Guide/APIs/Events).

## Safety
Talks only to `127.0.0.1`. Authenticates with a random key from the companion's config file. Sends no data anywhere else. Does not modify the game.
