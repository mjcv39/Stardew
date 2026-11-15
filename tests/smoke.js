// Smoke test: loads every route in headless Chromium, fails on JS errors, scans data for placeholder text,
// imports a synthetic save and checks detection. Run: node tests/smoke.js  (needs playwright + a static server on :8123)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const URL = process.env.URL || 'http://localhost:8123/index.html';
const SAVE = fs.readFileSync(path.join(__dirname, 'sample-save.xml'), 'utf8');

(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  const errs = []; p.on('pageerror', (e) => errs.push('pageerror: ' + e.message)); p.on('console', (m) => m.type() === 'error' && errs.push('console: ' + m.text()));
  await p.goto(URL); await p.waitForSelector('#main .page');
  // 1. data hygiene
  const bad = await p.evaluate(() => { const out = []; const walk = (v, pth) => { if (typeof v === 'string') { if (/\?|see wiki|TODO/.test(v) && !/^\s*$/.test(v)) out.push(pth + ': ' + v); } else if (Array.isArray(v)) v.forEach((x, i) => walk(x, pth + '[' + i + ']')); else if (v && typeof v === 'object') Object.entries(v).forEach(([k, x]) => k !== 'look' && walk(x, pth + '.' + k)); }; walk(SDV.data, 'data'); return out; });
  if (bad.length) { console.log('PLACEHOLDER TEXT:\n' + bad.join('\n')); }
  // 2. every dataset row has id+name, unique ids per set
  const dup = await p.evaluate(() => Object.entries(SDV.sets).flatMap(([k, s]) => { const seen = new Set(); return s.rows().filter((r) => !r.id || !r.name || seen.has(r.id) || !seen.add(r.id)).map((r) => k + ':' + (r.id || r.name)); }));
  if (dup.length) console.log('DUP/MISSING IDS:', dup);
  // 3. import save
  await p.evaluate((x) => { const f = SDV.save.parse(x); SDV.store.importFacts(f, 'sample'); }, SAVE);
  const routes = ['#/', '#/calendar', '#/tracker', '#/goals', '#/farms', '#/wiki', '#/search?q=summer+fish', ...await p.evaluate(() => SDV.cats.flatMap((c) => c.tabs.map((t) => `#/wiki/${c.key}?tab=${t}`))), ...await p.evaluate(() => Object.entries(SDV.sets).flatMap(([k, s]) => s.rows().map((r) => `#/item/${k}/${r.id}`)))];
  for (const r of routes) { await p.evaluate((h) => { location.hash = h; }, r); await p.waitForTimeout(5); const t = await p.evaluate(() => document.querySelector('#main').innerText.length); if (t < 20) errs.push('empty page ' + r); }
  console.log('routes checked:', routes.length);
  const facts = await p.evaluate(() => SDV.store.active().facts);
  console.log('facts:', JSON.stringify({ date: facts.date, money: facts.money, hearts: facts.friend, fish: facts.fishCaught.length, bld: facts.buildings, tools: facts.tools, mine: facts.deepestMine, skull: facts.skullDepth, walnuts: facts.walnuts, kids: facts.children, animals: facts.animals }));
  await p.evaluate(() => (location.hash = '#/')); await p.waitForTimeout(50);
  await p.screenshot({ path: process.env.SHOT_DIR + '/dash.png', fullPage: true });
  await p.evaluate(() => (location.hash = '#/calendar')); await p.waitForTimeout(50); await p.click('.cell[data-day="13"]'); await p.waitForTimeout(50);
  await p.screenshot({ path: process.env.SHOT_DIR + '/cal-modal.png' });
  await p.keyboard.press('Escape'); await p.screenshot({ path: process.env.SHOT_DIR + '/cal.png', fullPage: true });
  await p.evaluate(() => (location.hash = '#/tracker')); await p.waitForTimeout(50); await p.screenshot({ path: process.env.SHOT_DIR + '/tracker.png', fullPage: true });
  await p.evaluate(() => (location.hash = '#/item/villagers/abigail')); await p.waitForTimeout(50); await p.screenshot({ path: process.env.SHOT_DIR + '/villager.png', fullPage: true });
  await p.setViewportSize({ width: 390, height: 800 }); await p.evaluate(() => (location.hash = '#/')); await p.waitForTimeout(50); await p.screenshot({ path: process.env.SHOT_DIR + '/mobile.png' });
  // search
  await p.fill('#searchBox', 'puff'); await p.waitForTimeout(200); console.log('suggest:', await p.innerText('#suggest'));
  console.log(errs.length ? 'ERRORS:\n' + [...new Set(errs)].slice(0, 20).join('\n') : 'no JS errors');
  await b.close(); process.exit(errs.length ? 1 : 0);
})();
