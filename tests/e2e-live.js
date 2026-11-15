// End-to-end test of the live connection: real companion process + real browser + SIMULATED mod (the real mod cannot be built here).
// Needs: static server on :8123 serving the repo, Playwright.  Run: node tests/e2e-live.js
const { chromium } = require('playwright'); const { spawn } = require('child_process'); const http = require('http'); const fs = require('fs'), path = require('path'), os = require('os');
const ROOT = path.resolve(__dirname, '..'); const PORT = 48999; const SHOT = process.env.SHOT_DIR || os.tmpdir();
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ylf-')); const saves = path.join(tmp, 'Saves'), cfg = path.join(tmp, 'cfg');
fs.cpSync(path.join(__dirname, 'fixtures', 'Saves'), saves, { recursive: true });
const saveFile = path.join(saves, 'Sunnyvale_123456789', 'Sunnyvale_123456789');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const req = (method, p, { headers = {}, body, host } = {}) => new Promise((res, rej) => { const r = http.request({ host: '127.0.0.1', port: PORT, path: p, method, headers: { ...(host ? { Host: host } : {}), ...headers, ...(body ? { 'Content-Type': 'application/json' } : {}) } }, (rs) => { let d = ''; rs.on('data', (c) => (d += c)); rs.on('end', () => res({ status: rs.statusCode, body: d, headers: rs.headers })); }); r.on('error', rej); r.end(body); });
const until = async (fn, ms = 12000, step = 250) => { const t = Date.now(); while (Date.now() - t < ms) { try { const v = await fn(); if (v) return v; } catch (e) { /* retry */ } await sleep(step); } return false; };

(async () => {
  const comp = spawn('node', [path.join(ROOT, 'companion', 'ylf-companion.js'), '--port', String(PORT), '--saves', saves, '--config-dir', cfg], { env: { ...process.env, YLF_MOD_TIMEOUT_MS: '4000' } });
  let out = ''; comp.stdout.on('data', (d) => (out += d)); comp.stderr.on('data', (d) => (out += d));
  const code = () => { const m = [...out.replace(/\x1b\[[0-9;]*m/g, '').matchAll(/Pairing code:\s+(\d{3}) (\d{3})/g)].pop(); return m ? m[1] + m[2] : null; };
  await until(() => code()); ok(!!code(), 'companion starts and prints a pairing code');
  const info = JSON.parse(fs.readFileSync(path.join(cfg, 'companion.json'), 'utf8'));

  /* ---------- security ---------- */
  ok((await req('GET', '/api/hello')).status === 200 && !/token|key|farm/i.test((await req('GET', '/api/hello')).body.replace(/"app":"ylf-companion"/, '')), 'hello is public but exposes no secrets');
  ok((await req('GET', '/api/saves')).status === 401, 'saves require a token');
  ok((await req('GET', '/api/state', { headers: { Authorization: 'Bearer deadbeef' } })).status === 401, 'bad token rejected');
  ok((await req('GET', '/api/hello', { host: 'evil.example.com' })).status === 403, 'DNS-rebinding style Host header rejected');
  ok((await req('POST', '/api/mod/snapshot', { body: '{}' })).status === 401, 'mod endpoint needs the mod key');
  ok((await req('POST', '/api/mod/snapshot', { body: '{}', headers: { 'X-YLF-Mod-Key': info.modKey, Origin: 'http://evil.example' } })).status === 403, 'browsers cannot call mod endpoints even with the key');
  const c1 = code(); for (let i = 0; i < 5; i++) await req('POST', '/api/pair', { body: JSON.stringify({ code: '000000' }), headers: { Origin: 'http://localhost:8123' } });
  await sleep(300); ok(code() !== c1, 'five wrong pairing attempts rotate the code');
  const good = await req('POST', '/api/pair', { body: JSON.stringify({ code: code() }), headers: { Origin: 'http://localhost:8123' } }); ok(good.status === 200, 'pairing with the right code works'); const tok = JSON.parse(good.body).token;
  ok((await req('POST', '/api/pair', { body: JSON.stringify({ code: code() }), headers: { Origin: 'http://localhost:8123' } })).status === 200 && code() !== null, 'a fresh code is issued after each pairing');
  ok((await req('GET', '/api/saves', { headers: { Authorization: 'Bearer ' + tok, Origin: 'https://evil.example' } })).status === 403, 'token is bound to the website origin that paired');
  const list = await req('GET', '/api/saves', { headers: { Authorization: 'Bearer ' + tok, Origin: 'http://localhost:8123' } }); ok(JSON.parse(list.body).saves.length === 1, 'authorised origin can list saves');
  ok((await req('GET', '/api/saves/..%2F..%2Fetc%2Fpasswd', { headers: { Authorization: 'Bearer ' + tok } })).status === 404, 'path traversal blocked');
  ok((await req('GET', '/api/saves/SaveGameInfo', { headers: { Authorization: 'Bearer ' + tok } })).status === 404, 'only real save directories are served');
  ok(!fs.readFileSync(path.join(cfg, 'tokens.json'), 'utf8').includes(tok), 'tokens are stored hashed');
  ok((await req('OPTIONS', '/api/saves', { headers: { Origin: 'https://evil.example', 'Access-Control-Request-Method': 'GET' } })).headers['access-control-allow-origin'] === undefined, 'no CORS for unpaired origins');

  /* ---------- browser flow ---------- */
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1300, height: 950 } }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && !/fonts\.g|ERR_|Failed to load|net::/.test(m.text()) && errs.push(m.text()));
  await p.addInitScript((u) => { if (!localStorage.getItem('ylf.companion')) localStorage.setItem('ylf.companion', JSON.stringify({ url: u })); }, `http://127.0.0.1:${PORT}`);
  await p.goto('http://localhost:8123/index.html#/connect'); await p.waitForSelector('.connect');
  ok(await until(async () => /Companion found/.test(await p.locator('#detLine').innerText()), 9000), 'website detects the running companion');
  await p.screenshot({ path: SHOT + '/ylf-connect1.png', fullPage: true });
  await p.fill('input[name=code]', '123456'); await p.click('#pairForm button'); await sleep(500); ok(await p.locator('#toast.bad').count() === 1, 'wrong code shows a clear error');
  await p.fill('input[name=code]', code().slice(0, 3) + ' ' + code().slice(3)); await p.click('#pairForm button');
  ok(await until(async () => (await p.evaluate(() => SDV.live.state.phase)) === 'connected', 8000), 'pairing succeeds and the live connection opens');
  ok(await until(() => p.locator('[data-save]').count(), 8000), 'saves from the companion are listed');
  await p.click('[data-save]'); await p.waitForSelector('#pvApply'); ok(await p.locator('.modal').innerText().then((t) => /Sunnyvale/i.test(t)), 'preview shown before importing from the companion'); await p.click('#pvApply');
  ok(await until(async () => (await p.evaluate(() => SDV.store.active() && SDV.store.active().link && SDV.store.active().link.mode)) === 'companion', 6000), 'farm linked through the companion');
  await p.waitForSelector('.farm'); ok(await p.locator('#connPill').innerText().then((t) => /Synchronized/.test(t)), 'status: Synchronized right after import');

  // the game saves again (sleep): companion detects it, site imports automatically
  let x = fs.readFileSync(saveFile, 'utf8').replace('<dayOfMonth>12</dayOfMonth>', '<dayOfMonth>13</dayOfMonth>').replace('</fishCaught>', '<item><key><string>(O)143</string></key><value><ArrayOfInt><int>1</int><int>20</int></ArrayOfInt></value></item></fishCaught>');
  fs.writeFileSync(saveFile, x);
  ok(await until(async () => p.evaluate(() => SDV.store.active().activity.some((e) => /Catfish/.test(e.text))), 15000), 'new save written by the game is auto-imported (fish detected in the feed)');
  ok((await p.evaluate(() => SDV.store.active().date.day)) === 13, 'dashboard date advanced from the new save');
  ok((await p.evaluate(() => SDV.store.farms().length)) === 1, 'no duplicate farm created');

  // simulated mod: must be clearly labelled
  const sim = spawn('node', [path.join(ROOT, 'companion', 'tools', 'simulate-mod.js'), '--config-dir', cfg, '--day', '14', '--money', '25000', '--interval', '800']);
  ok(await until(async () => /SIMULATED/.test(await p.locator('#connPill').innerText()), 10000), 'simulated feed is labelled SIMULATED (never passed off as live)');
  await p.waitForSelector('[data-liveblock]'); ok(await p.locator('[data-liveblock]').innerText().then((t) => /SIMULATED/i.test(t) && /Farm/.test(t) && /25,000/.test(t)), 'live block shows simulated location/gold');
  ok((await p.evaluate(() => SDV.store.active().money)) === 25000 && (await p.evaluate(() => SDV.store.active().date.day)) === 14, 'live snapshot updated gold and date');
  ok(await p.locator('.widget[data-w=profile] .tag.sim').count() > 0, 'fields updated by the simulator carry a "simulated" tag');
  await p.screenshot({ path: SHOT + '/ylf-live.png', fullPage: true });
  sim.kill(); ok(await until(async () => !/SIMULATED|Live/i.test(await p.locator('#connPill').innerText()), 12000), 'when the mod goes quiet the app stops claiming live data');
  ok(await p.locator('#connPill').innerText().then((t) => /Synchronized|Waiting for game save/.test(t)), 'falls back to save-based status');

  // reload: pairing persists
  await p.reload(); ok(await until(async () => (await p.evaluate(() => SDV.live.state.phase)) === 'connected', 8000), 'after reload the page reconnects to the companion by itself');
  // companion stops: honest connection issue
  const token = await p.evaluate(() => JSON.parse(localStorage.getItem('ylf.companion')).token);
  comp.kill(); ok(await until(async () => /Connection issue/.test(await p.locator('#connPill').innerText()), 15000), 'companion stopped → "Connection issue" with a next step'); await p.screenshot({ path: SHOT + '/ylf-issue.png' });
  ok(await p.locator('.widget[data-w=connection]').innerText().then((t) => /start the companion/i.test(t)), 'issue message tells the user what to do');
  // restart companion, disconnect from the site → token revoked
  const comp2 = spawn('node', [path.join(ROOT, 'companion', 'ylf-companion.js'), '--port', String(PORT), '--saves', saves, '--config-dir', cfg]);
  ok(await until(async () => (await p.evaluate(() => SDV.live.state.phase)) === 'connected', 20000), 'page reconnects automatically when the companion comes back');
  await p.goto('http://localhost:8123/index.html#/connect'); await p.waitForSelector('#unpair'); await p.click('#unpair'); await p.click('#cYes');
  ok(await until(async () => (await req('GET', '/api/state', { headers: { Authorization: 'Bearer ' + token, Origin: 'http://localhost:8123' } })).status === 401, 5000), 'disconnecting revokes the token on the companion');
  ok(errs.length === 0, 'no JavaScript errors' + (errs.length ? ': ' + [...new Set(errs)].join(' | ') : ''));
  comp2.kill(); await b.close(); fs.rmSync(tmp, { recursive: true, force: true });
  console.log(fails ? `${fails} FAILED` : 'ALL GOOD'); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
