# Your Little Farm — companion app

A tiny local program (Node 18+, **no dependencies**, one file) that lets the website follow your farm.

```bash
node ylf-companion.js                 # default Saves folder, port 48273
node ylf-companion.js --saves "D:\Games\StardewSaves" --port 48273
node ylf-companion.js --serve         # also serve the website at http://127.0.0.1:48273 (no browser permission prompts)
node ylf-companion.js --revoke-all    # forget every paired website
```
On start it prints a **6-digit pairing code**. Open the website → *Connect your farm* → enter the code → pick your farm. Done; after that it reconnects automatically.

## What you get
| Setup | Updates |
|---|---|
| Companion only | the site auto-imports **each time the game saves** (when you sleep) — detected within ~3 s |
| Companion + SMAPI mod (`YourLittleFarmMod/`, not yet compiled/tested) | real-time gold, time, location, energy, items, friendships… plus the above |

## Security model
- Binds to **127.0.0.1 only**; rejects any `Host` header that isn't localhost (DNS-rebinding guard).
- Website access needs a **one-time code** → token bound to that website's **Origin**; stored hashed in `tokens.json`. Five wrong codes rotate the code. CORS is granted only to paired origins.
- Serves only real save directories (no path traversal), max 80 MB, nothing else on disk.
- The mod authenticates with a random key from `companion.json` and is **rejected if the request carries a browser Origin**.
- Nothing leaves your computer. There is no relay/cloud sync (see below).

## API (for developers)
`GET /api/hello` (public, minimal) · `POST /api/pair` · `GET /api/saves` · `GET /api/saves/:id` · `GET /api/state` · `GET /api/stream` (SSE: `save-changed`, `snapshot`, `heartbeat`, `mod-status`) · `DELETE /api/token` · mod: `POST /api/mod/{snapshot,heartbeat,offline}`.

## Limits & troubleshooting
- Browsers: Chrome/Edge may ask to allow “local network access” — allow it. Safari blocks the connection from an https site → use `--serve`.
- Phones/tablets can’t run the companion. The site can be viewed elsewhere only with a backup/restore of its data; **secure multi-device sync (an encrypted relay) is designed but not built.**
- The Saves folder is found automatically on Windows (`%APPDATA%\StardewValley\Saves`) and macOS/Linux (`~/.config/StardewValley/Saves`); otherwise pass `--saves`.
- `tools/simulate-mod.js` is a **developer simulator** (everything it sends is flagged *simulated* and labelled so in the UI).
