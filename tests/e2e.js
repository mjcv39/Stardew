// End-to-end checks for Your Little Farm (Phases 1-2). Run with a static server on :8123:  node tests/e2e.js
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path'); const assert = require('assert');
const URL = process.env.URL || 'http://localhost:8123/index.html'; const SHOT = process.env.SHOT_DIR || '/tmp';
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1300, height: 900 } }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push('pageerror: ' + e.message)); p.on('console', (m) => m.type() === 'error' && !/fonts\.g|ERR_|Failed to load resource/.test(m.text()) && errs.push('console: ' + m.text()));
  await p.goto(URL); await p.waitForSelector('#main .page');
  const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) errs.push('assert: ' + m); };
  // fresh state: welcome, no fabricated data
  ok(await p.locator('text=Welcome to Your Little Farm').count() === 1, 'welcome screen on empty state');
  ok(await p.locator('#connPill').innerText().then((t) => /No farm/.test(t)), 'connection pill says no farm');
  await p.screenshot({ path: SHOT + '/ylf-welcome.png' });
  // manual farm
  await p.click('[data-act=new]'); await p.fill('input[name=name]', 'Test Meadow'); await p.fill('input[name=farmer]', 'Sam'); await p.fill('input[name=money]', '1234'); await p.selectOption('select[name=season]', 'Fall'); await p.fill('input[name=day]', '12'); await p.fill('input[name=sk_farming]', '4'); await p.check('input[name="b_Coop"]'); await p.fill('input[name=a_Chicken]', '3');
  await p.click('#pForm button:not([type=button])'); await p.waitForSelector('.farm');
  ok(/Test Meadow/.test(await p.locator('h1').first().innerText()), 'manual farm created');
  ok(await p.locator('.widget[data-w=profile] .tag.manual').count() > 0, 'manual fields tagged manual');
  ok(await p.locator('.widget[data-w=stats]').innerText().then((t) => /appear after you import/.test(t)), 'no fabricated stats for manual farm');
  ok(await p.locator('#connPill').innerText().then((t) => /Not connected/.test(t)), 'status: not connected');
  // goal
  await p.fill('#goalForm input[name=title]', 'Save for a barn'); await p.selectOption('#goalForm select[name=priority]', 'high'); await p.click('#goalForm button'); await p.waitForSelector('.goal');
  ok(await p.locator('.goal b').first().innerText() === 'Save for a barn', 'goal added'); await p.click('[data-gdone]'); await p.waitForTimeout(100);
  ok(await p.locator('.tab:has-text("Completed (1)")').count() === 1, 'goal completed moves tab count');
  // import save into this profile
  const save = path.join(__dirname, 'sample-save.xml'); await p.setInputFiles('#saveFile', save); await p.waitForSelector('#pvApply'); ok(await p.locator('.modal').innerText().then((x) => /Sunnyvale/i.test(x) && /Testy/i.test(x) && /Story route/i.test(x)), 'import preview shows farm, farmer and route before applying'); ok((await p.evaluate(() => SDV.store.active().facts)) === null, 'nothing applied before confirming'); await p.click('#pvApply'); await p.waitForTimeout(400);
  ok(await p.locator('#connPill').innerText().then((t) => /Save imported/.test(t)), 'status: save imported — manual refresh required');
  ok(await p.locator('.widget[data-w=stats]').innerText().then((t) => /Fish caught/.test(t)), 'stats from save shown');
  const f = await p.evaluate(() => SDV.store.active().facts);
  ok(f.farmer === 'Testy' && f.money === 12345 && f.date.season === 'Fall' && f.date.day === 12, 'facts parsed (farmer, gold, date)');
  ok(f.museumDonated.length === 2 && f.stats.itemsShipped === 8 && f.fishTotal === 3 && f.saveId === '123456789', 'museum/stats/fish totals parsed');
  ok(f.bundles['0'] && f.bundles['0'].length === 4, 'bundle flags parsed');
  ok((await p.evaluate(() => SDV.store.farms().length)) === 1, 'imported into the current profile (no duplicate)');
  ok((await p.evaluate(() => SDV.store.active().goals.length)) === 1, 'goals preserved through import');
  // second import with changes -> activity diff
  let x = fs.readFileSync(save, 'utf8').replace('<dayOfMonth>12</dayOfMonth>', '<dayOfMonth>14</dayOfMonth>').replace('<money>12345</money>', '<money>20000</money>').replace('<Points>1300</Points>', '<Points>1800</Points>').replace('</fishCaught>', '<item><key><string>(O)143</string></key><value><ArrayOfInt><int>1</int><int>20</int></ArrayOfInt></value></item></fishCaught>').replace('<buildingType>Silo</buildingType>', '<buildingType>Silo</buildingType></Building><Building><buildingType>Well</buildingType>').replace('<deepestMineLevel>135</deepestMineLevel>', '<deepestMineLevel>140</deepestMineLevel>').replace('<mailReceived>', '<mailReceived><string>ccBoilerRoom</string>');
  const tmp = path.join(SHOT, 'sample2.xml'); fs.writeFileSync(tmp, x); await p.setInputFiles('#saveFile', tmp); await p.waitForSelector('#pvApply'); await p.click('#pvApply'); await p.waitForTimeout(400);
  const acts = await p.evaluate(() => SDV.store.active().activity.map((e) => e.text));
  console.log('activity:', acts);
  ok(acts.some((t) => /Catfish/.test(t)) && acts.some((t) => /Sam.*hearts|Sam is now/.test(t)) && acts.some((t) => /Built: Well/.test(t)) && acts.some((t) => /Boiler Room/.test(t)) && acts.some((t) => /Skull Cavern floor 20/.test(t)), 'activity feed lists real changes (fish, friendship, building, unlock, depth)');
  ok(await p.locator('.widget[data-w=activity] li').count() >= 4, 'activity feed rendered');
  ok((await p.evaluate(() => SDV.recs.today(SDV.store.active()).map((r) => r.title))).length > 0, 'recommendations produced');
  // wrong file
  await p.setInputFiles('#saveFile', { name: 'SaveGameInfo', mimeType: 'text/xml', buffer: Buffer.from('<x/>') }); await p.waitForTimeout(200);
  ok(await p.locator('#toast.bad').count() === 1, 'SaveGameInfo rejected with a clear message');
  await p.setInputFiles('#saveFile', { name: 'junk', mimeType: 'text/plain', buffer: Buffer.from('not xml <<<') }); await p.waitForTimeout(200);
  ok(await p.locator('#toast.bad').count() === 1, 'invalid file rejected');
  await p.screenshot({ path: SHOT + '/ylf-farm.png', fullPage: true });
  // other pages
  for (const r of ['#/calendar', '#/progress', '#/journal', '#/tools']) { await p.evaluate((h) => (location.hash = h), r); await p.waitForTimeout(80); ok(await p.locator('h1').first().innerText().then((t) => /Coming in Phase/.test(t)), r + ' is an honest placeholder'); }
  await p.evaluate(() => (location.hash = '#/guide/privacy')); await p.waitForTimeout(80); ok(await p.locator('text=What is stored, and where').count() === 1, 'privacy page');
  await p.screenshot({ path: SHOT + '/ylf-guide.png' });
  // prefs: dark + winter scenery + assistant off
  await p.evaluate(() => (location.hash = '#/guide')); await p.selectOption('[data-pref=theme]', 'dark'); await p.selectOption('[data-pref=seasonTheme]', 'Winter'); await p.waitForTimeout(100);
  ok(await p.evaluate(() => document.body.dataset.theme === 'dark' && document.body.dataset.season === 'Winter'), 'dark + winter theme applied');
  await p.screenshot({ path: SHOT + '/ylf-dark.png' }); await p.click('[data-pref=assistant]'); await p.waitForTimeout(100); ok(await p.locator('#moss').count() === 0, 'assistant can be disabled');
  // backup / restore / delete
  const backup = await p.evaluate(() => SDV.store.exportAll()); ok(JSON.parse(backup).data.farms, 'backup exports');
  await p.evaluate(() => SDV.store.wipe()); ok((await p.evaluate(() => SDV.store.farms().length)) === 0, 'delete everything works');
  await p.evaluate((j) => SDV.store.importAll(j), backup); ok((await p.evaluate(() => SDV.store.farms().length)) === 1, 'restore works');
  // reload persistence
  await p.reload(); await p.evaluate(() => (location.hash = '#/')); await p.waitForSelector('#main .page'); await p.waitForTimeout(100); ok(await p.locator('h1').first().innerText().then((t) => /Meadow|Sunnyvale|Little Farm/.test(t)), 'data persists across reload');
  // migration from old key
  const c2 = await b.newContext(); const q = await c2.newPage(); await q.addInitScript(() => localStorage.setItem('sdv.companion.v1', JSON.stringify({ active: 'a1', farms: { a1: { id: 'a1', name: 'Old Farm', source: 'manual', date: { year: 2, season: 'Summer', day: 5 }, money: 777, goals: [{ id: 'g', title: 'Old goal', done: false }] } } })));
  await q.goto(URL); await q.waitForSelector('#main .page'); ok(await q.locator('h1').first().innerText() === 'Old Farm', 'old-version data migrated');
  // mobile
  await p.setViewportSize({ width: 390, height: 820 }); await p.evaluate(() => { SDV.store.setPref('assistant', true); SDV.store.setPref('theme', 'light'); SDV.store.setPref('seasonTheme', 'auto'); location.hash = '#/'; }); await p.waitForTimeout(150);
  ok(await p.locator('#tabbar .place').count() === 6, 'mobile bottom nav has six places'); ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'no horizontal scroll on mobile');
  await p.screenshot({ path: SHOT + '/ylf-mobile.png' });
  console.log(errs.length ? 'ERRORS:\n' + [...new Set(errs)].join('\n') : 'ALL GOOD'); await b.close(); process.exit(errs.length ? 1 : 0);
})();
