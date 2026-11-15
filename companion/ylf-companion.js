#!/usr/bin/env node
/* Your Little Farm — local companion (zero dependencies, Node 18+).
   Run it on the PC where you play Stardew Valley:   node ylf-companion.js
   What it does
     1. Watches your Stardew "Saves" folder and tells the website when the game has written a new save.
     2. Serves the raw save file to the website (which parses it locally in your browser).
     3. Receives live snapshots from the optional SMAPI mod and relays them to the website.
   Security model
     - Listens on 127.0.0.1 only; rejects requests whose Host header is not localhost (DNS-rebinding guard).
     - The website must be paired with a one-time 6-digit code shown in this terminal; the resulting token is bound to that website's Origin.
     - Tokens are stored hashed. Only paired origins get CORS access. The mod authenticates with a separate key (only accepted without an Origin header).
     - Serves nothing outside the Saves folder (and the site folder if --serve is used). */
'use strict';
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os'), crypto = require('crypto');

const VERSION = '1.0.0', MAX_SAVE = 80 * 1024 * 1024, MAX_BODY = 4 * 1024 * 1024;
const argv = process.argv.slice(2); const arg = (n, d) => { const i = argv.indexOf('--' + n); return i >= 0 ? (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true) : d; };
const isWin = process.platform === 'win32';
const base = isWin ? process.env.APPDATA : process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'); // matches .NET's ApplicationData, which the mod uses
const CONFIG_DIR = arg('config-dir', path.join(base, 'YourLittleFarm'));
const SAVES_DIR = arg('saves', path.join(base, 'StardewValley', 'Saves'));
const PORT = +arg('port', 48273);
const MOD_TIMEOUT = +(process.env.YLF_MOD_TIMEOUT_MS || 90000);
const SITE_DIR = (() => { const s = arg('serve', false); if (!s) return null; const d = s === true ? path.resolve(__dirname, '..') : path.resolve(s); return fs.existsSync(path.join(d, 'index.html')) ? d : null; })();
const extraOrigins = []; argv.forEach((a, i) => a === '--allow-origin' && argv[i + 1] && extraOrigins.push(argv[i + 1].replace(/\/$/, '')));
fs.mkdirSync(CONFIG_DIR, { recursive: true });

/* ---------- persistent config ---------- */
const readJson = (f, d) => { try { return JSON.parse(fs.readFileSync(path.join(CONFIG_DIR, f), 'utf8')); } catch (e) { return d; } };
const writeJson = (f, o, mode) => fs.writeFileSync(path.join(CONFIG_DIR, f), JSON.stringify(o, null, 1), { mode: mode || 0o600 });
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const tokens = readJson('tokens.json', []);               // [{hash, origin, name, created, lastUsed}]
let modKey = (readJson('companion.json', {}) || {}).modKey || crypto.randomBytes(24).toString('hex');
const writeCompanionInfo = () => writeJson('companion.json', { app: 'ylf-companion', version: VERSION, port: PORT, modKey, pid: process.pid, started: new Date().toISOString() });
writeCompanionInfo();

/* ---------- pairing ---------- */
let pair = null;
const newPairCode = () => { pair = { code: String(crypto.randomInt(0, 1000000)).padStart(6, '0'), expires: Date.now() + 10 * 60000, fails: 0 }; console.log(`\n  Pairing code:  \x1b[1m${pair.code.slice(0, 3)} ${pair.code.slice(3)}\x1b[0m   (valid 10 minutes — enter it on the website)\n`); };
newPairCode();
setInterval(() => { if (Date.now() > pair.expires) newPairCode(); }, 15000).unref();

/* ---------- events (relayed to the website) ---------- */
let seq = 0; const ring = []; const clients = new Set();
const state = { snapshot: null, snapshotAt: 0, heartbeat: null, heartbeatAt: 0, lastModAt: 0, modConnected: false, game: null, ...(readJson('state.json', {})) };
state.modConnected = false; state.lastModAt = 0;
const broadcast = (type, data) => { const e = { seq: ++seq, type, at: Date.now(), data }; ring.push(e); if (ring.length > 500) ring.shift(); for (const c of clients) send(c, e); return e; };
const send = (res, e) => { try { res.write(`id: ${e.seq}\nevent: ${e.type}\ndata: ${JSON.stringify({ seq: e.seq, at: e.at, ...e.data })}\n\n`); } catch (x) { clients.delete(res); } };
setInterval(() => { for (const c of clients) try { c.write(': ping\n\n'); } catch (e) { clients.delete(c); } }, 15000).unref();
setInterval(() => { const now = Date.now() - state.lastModAt < MOD_TIMEOUT && state.lastModAt > 0; if (now !== state.modConnected) { state.modConnected = now; broadcast('mod-status', { connected: now }); console.log(now ? '  SMAPI mod connected' : '  SMAPI mod went quiet'); } }, 1000).unref();

/* ---------- save folder watcher (polling is the portable choice) ---------- */
const mainFile = (dir) => path.join(SAVES_DIR, dir, dir);
const listSaves = () => { try { return fs.readdirSync(SAVES_DIR, { withFileTypes: true }).filter((d) => d.isDirectory() && !d.name.startsWith('.')).map((d) => { try { const st = fs.statSync(mainFile(d.name)); return st.isFile() ? { id: d.name, modified: Math.round(st.mtimeMs), size: st.size } : null; } catch (e) { return null; } }).filter(Boolean).sort((a, b) => b.modified - a.modified); } catch (e) { return []; } };
let known = new Map(listSaves().map((s) => [s.id, s])), pending = new Map();
setInterval(() => {
  for (const s of listSaves()) {
    const prev = known.get(s.id); const p = pending.get(s.id);
    if (p) { if (p.modified === s.modified && p.size === s.size) { pending.delete(s.id); known.set(s.id, s); broadcast('save-changed', { id: s.id, modified: s.modified, size: s.size }); console.log(`  New save detected: ${s.id}`); } else pending.set(s.id, s); }
    else if (!prev) { known.set(s.id, s); broadcast('save-changed', { id: s.id, modified: s.modified, size: s.size, added: true }); }
    else if (prev.modified !== s.modified || prev.size !== s.size) pending.set(s.id, s); // wait until the game has finished writing
  }
}, 1500).unref();

/* ---------- HTTP helpers ---------- */
const localOrigin = (o) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o || '');
const allowedOrigin = (o) => !!o && (localOrigin(o) || extraOrigins.includes(o) || tokens.some((t) => t.origin === o));
const json = (res, code, obj) => { const b = JSON.stringify(obj); res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(b); };
const readBody = (req, limit = MAX_BODY) => new Promise((ok, bad) => { let n = 0; const ch = []; req.on('data', (c) => { n += c.length; if (n > limit) { bad(new Error('too large')); req.destroy(); } else ch.push(c); }); req.on('end', () => ok(Buffer.concat(ch).toString('utf8'))); req.on('error', bad); });
const bearer = (req) => { const m = /^Bearer\s+([A-Za-z0-9]+)$/.exec(req.headers.authorization || ''); return m ? m[1] : null; };
const authToken = (req) => { const t = bearer(req); if (!t) return null; const h = sha(t); const rec = tokens.find((x) => x.hash === h); if (!rec) return null; const o = req.headers.origin; if (o && rec.origin !== o && rec.origin !== 'none') return 'origin'; rec.lastUsed = Date.now(); return rec; };
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };

const server = http.createServer(async (req, res) => {
  try {
    const host = (req.headers.host || '').toLowerCase();
    if (!new RegExp(`^(localhost|127\\.0\\.0\\.1)(:${PORT})?$`).test(host)) return json(res, 403, { error: 'bad host' });
    const url = new URL(req.url, 'http://x'); const p = url.pathname; const origin = req.headers.origin || '';
    const open = p === '/api/hello' || p === '/api/pair';
    // CORS
    if (origin) {
      const selfOrigin = `http://${host}`;
      if (open || allowedOrigin(origin) || origin === selfOrigin) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin'); res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, Last-Event-ID'); res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS'); res.setHeader('Access-Control-Allow-Private-Network', 'true'); res.setHeader('Access-Control-Max-Age', '600'); }
    }
    if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

    /* ----- public, minimal ----- */
    if (p === '/api/hello' && req.method === 'GET') return json(res, 200, { app: 'ylf-companion', version: VERSION, paired: tokens.length > 0, savesFound: listSaves().length, savesDirExists: fs.existsSync(SAVES_DIR), modConnected: state.modConnected });
    if (p === '/api/pair' && req.method === 'POST') {
      const body = JSON.parse((await readBody(req, 4096)) || '{}');
      if (Date.now() > pair.expires) newPairCode();
      if (String(body.code || '').replace(/\s/g, '') !== pair.code) { pair.fails++; if (pair.fails >= 5) { console.log('  Too many wrong pairing attempts — new code generated.'); newPairCode(); } return json(res, 403, { error: 'wrong code' }); }
      const token = crypto.randomBytes(32).toString('hex'); tokens.push({ hash: sha(token), origin: origin || 'none', name: String(body.name || 'website').slice(0, 40), created: Date.now(), lastUsed: Date.now() }); writeJson('tokens.json', tokens);
      console.log(`  Paired with ${origin || 'a local client'}`); newPairCode(); return json(res, 200, { token, origin: origin || 'none', version: VERSION });
    }

    /* ----- mod endpoints (no browser Origin allowed) ----- */
    if (p.startsWith('/api/mod/')) {
      if (origin) return json(res, 403, { error: 'browsers may not call mod endpoints' });
      if (req.headers['x-ylf-mod-key'] !== modKey) return json(res, 401, { error: 'bad mod key' });
      if (req.method !== 'POST') return json(res, 405, {});
      const body = JSON.parse((await readBody(req)) || '{}'); state.lastModAt = Date.now(); state.game = { version: body.gameVersion || (state.game && state.game.version), modVersion: body.modVersion };
      if (p === '/api/mod/snapshot') { state.snapshot = body.data; state.snapshotAt = Date.now(); writeJson('state.json', { snapshot: state.snapshot, snapshotAt: state.snapshotAt }); broadcast('snapshot', { data: body.data, simulated: !!body.simulated, modVersion: body.modVersion }); return json(res, 200, { ok: true, seq }); }
      if (p === '/api/mod/heartbeat') { state.heartbeat = body.data; state.heartbeatAt = Date.now(); broadcast('heartbeat', { data: body.data, simulated: !!body.simulated }); return json(res, 200, { ok: true }); }
      if (p === '/api/mod/offline') { state.lastModAt = 0; return json(res, 200, { ok: true }); }
      return json(res, 404, {});
    }

    /* ----- site (optional, same-origin: avoids every browser-permission issue) ----- */
    if (!p.startsWith('/api/')) {
      if (!SITE_DIR) return json(res, 404, { error: 'not found (start with --serve to host the site here)' });
      const f = path.normalize(path.join(SITE_DIR, p === '/' ? 'index.html' : decodeURIComponent(p)));
      if (!f.startsWith(SITE_DIR + path.sep) || /[\\/](\.git|node_modules|tests)[\\/]/.test(f)) return json(res, 404, {});
      return fs.readFile(f, (e, b) => { if (e) return json(res, 404, {}); res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-cache' }); res.end(b); });
    }

    /* ----- authenticated website endpoints ----- */
    const who = authToken(req);
    if (who === 'origin') return json(res, 403, { error: 'token is bound to a different website' });
    if (!who) return json(res, 401, { error: 'pair first' });
    if (p === '/api/state') return json(res, 200, { seq, version: VERSION, saves: listSaves(), snapshot: state.snapshot, snapshotAt: state.snapshotAt, heartbeat: state.heartbeat, heartbeatAt: state.heartbeatAt, modConnected: state.modConnected, game: state.game });
    if (p === '/api/saves') return json(res, 200, { dir: SAVES_DIR, saves: listSaves() });
    let m = /^\/api\/saves\/([^/]+)$/.exec(p);
    if (m) {
      const id = decodeURIComponent(m[1]); const s = listSaves().find((x) => x.id === id);          // must be a real save directory — blocks path traversal
      if (!s) return json(res, 404, { error: 'unknown save' }); if (s.size > MAX_SAVE) return json(res, 413, { error: 'save too large' });
      res.writeHead(200, { 'Content-Type': 'application/xml', 'Cache-Control': 'no-store', 'X-Save-Modified': String(s.modified) }); return fs.createReadStream(mainFile(id)).pipe(res);
    }
    if (p === '/api/stream') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' }); res.write('retry: 3000\n\n');
      const last = +(req.headers['last-event-id'] || url.searchParams.get('since') || 0); if (last) ring.filter((e) => e.seq > last).forEach((e) => send(res, e));
      clients.add(res); send(res, { seq, type: 'hello', at: Date.now(), data: { version: VERSION, modConnected: state.modConnected } }); req.on('close', () => clients.delete(res)); return;
    }
    if (p === '/api/token' && req.method === 'DELETE') { const t = bearer(req); const i = tokens.findIndex((x) => x.hash === sha(t)); if (i >= 0) tokens.splice(i, 1); writeJson('tokens.json', tokens); return json(res, 200, { ok: true }); }
    return json(res, 404, { error: 'not found' });
  } catch (e) { try { json(res, 400, { error: String(e.message || e) }); } catch (x) { /* ignore */ } }
});

if (argv.includes('--revoke-all')) { writeJson('tokens.json', []); console.log('All website pairings revoked.'); process.exit(0); }
server.on('error', (e) => { console.error(e.code === 'EADDRINUSE' ? `Port ${PORT} is already in use — is the companion already running? (use --port to change)` : e.message); process.exit(1); });
server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n  Your Little Farm companion v${VERSION}\n  ─────────────────────────────────────────\n  Listening on   http://127.0.0.1:${PORT}   (this computer only)\n  Saves folder   ${SAVES_DIR}  ${fs.existsSync(SAVES_DIR) ? `(${listSaves().length} save(s) found)` : '\x1b[33m(NOT FOUND — use --saves <folder>)\x1b[0m'}\n  Config folder  ${CONFIG_DIR}\n  ${SITE_DIR ? `Website        http://127.0.0.1:${PORT}/   (served from ${SITE_DIR})\n  ` : ''}Paired sites  ${tokens.length ? tokens.map((t) => t.origin).join(', ') : 'none yet'}`);
});
process.on('SIGINT', () => process.exit(0));
