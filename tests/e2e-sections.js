// End-to-end checks for Progress, Calendar, Journal and Planning Tools (static server on :8123).  node tests/e2e-sections.js
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path'), os = require('os');
const URL = process.env.URL || 'http://localhost:8123/index.html'; const SHOT = process.env.SHOT_DIR || os.tmpdir();
const SAVE = fs.readFileSync(path.join(__dirname, 'sample-save.xml'), 'utf8');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1300, height: 950 }, acceptDownloads: true }); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && !/fonts\.g|ERR_|Failed to load|net::/.test(m.text()) && errs.push(m.text()));
  await p.goto(URL); await p.waitForSelector('#main .page'); const go = async (h) => { await p.evaluate((x) => (location.hash = x), '#/' + h); await p.waitForTimeout(120); };
  const h1 = () => p.locator('h1').first().innerText();
  // ---- no farm: every section explains itself and never throws
  for (const r of ['progress', 'calendar', 'journal', 'tools']) { await go(r); ok(await p.locator('#main').innerText().then((t) => /Create or connect a farm/.test(t)), `${r}: asks for a farm when none exists`); }
  // ---- manual farm: everything renders, nothing fabricated
  await p.evaluate(() => SDV.store.createFarm('Manual Meadow'));
  const routes = ['progress', 'progress/story', 'progress/explore', 'progress/collections', 'progress/relationships', 'progress/farm', 'progress/achievements', 'progress/perfection', 'progress/villagers', 'progress/villager/abigail', 'calendar', 'calendar/season', 'calendar/prepare', 'journal', 'journal/gallery', 'journal/year', 'tools', 'tools/daily', 'tools/crops', 'tools/fish', 'tools/gifts', 'tools/cc', 'tools/challenges', 'tools/designer'];
  for (const r of routes) { await go(r); const t = await p.locator('#main').innerText(); ok(t.length > 60 && !/undefined|NaN/.test(t), `manual farm · #/${r} renders without undefined/NaN`); }
  await go('progress/perfection'); ok(await p.locator('#main').innerText().then((t) => /unknown/i.test(t)), 'perfection marks unreadable parts as unknown on a manual farm');
  await go('progress/collections'); ok(await p.locator('.trk-list').count() > 5, 'collection checklists present for manual farm');
  // manual tick -> percent changes
  await go('progress/story'); const before = await p.evaluate(() => SDV.progress.byId(SDV.store.active(), 'story').pct); await p.click('[data-tick=railroad]'); await p.waitForTimeout(150); const after = await p.evaluate(() => SDV.progress.byId(SDV.store.active(), 'story').pct); ok(after > before, `manual tick raises Main Story % (${before}→${after})`);
  // ---- import the save
  await p.evaluate((x) => SDV.sync.apply(SDV.save.parse(x), { mode: 'import', fileName: 's' }, { targetId: SDV.store.active().id }), SAVE); await p.waitForTimeout(200);
  await go('progress'); ok(await p.locator('.catcard').count() >= 8, 'progress overview shows categories + perfection + villagers');
  const st = await p.evaluate(() => { const f = SDV.store.active(); const c = SDV.progress.byId(f, 'story'); return { route: SDV.logic.route(f), rooms: c.items.filter((i) => /^cc-room/.test(i.id)).map((i) => i.done) , joja: c.items.filter((i) => i.id.startsWith('joja-')).every((i) => i.na) }; });
  ok(st.route === 'cc' && st.rooms.filter(Boolean).length === 3 && st.joja, `story is route-aware: CC rooms read from save (3 done), Joja items not counted`);
  await go('progress/collections'); const fishRow = await p.evaluate(() => SDV.progress.byId(SDV.store.active(), 'collections').items.find((i) => i.id === 'fish').have); ok(fishRow === 2, 'fish collection: 2 caught read from save');
  await go('progress/perfection'); ok(await p.locator('.perf-row').count() === 11, 'perfection lists all 11 weighted requirements');
  await go('progress/villager/abigail'); ok(await p.locator('#main').innerText().then((t) => /11 hearts|11♥|11 hearts/.test(t) || /hearts/.test(t)), 'villager profile shows friendship'); await p.click('[data-ev]'); ok(await p.evaluate(() => Object.keys(SDV.store.active().manual).some((k) => k.startsWith('ev:abigail'))), 'heart event can be ticked manually');
  // ---- calendar
  await go('calendar'); ok(await p.locator('.cell').count() === 28, 'calendar: 28 days'); ok(await p.locator('.cell.today').getAttribute('data-day') === '12', 'calendar follows the farm date (Fall 12)'); ok(await p.locator('.cal-title').innerText().then((t) => /Fall/.test(t)), 'calendar opens on the farm’s season');
  await p.click('.cell[data-day="13"]'); await p.waitForSelector('.modal'); ok(await p.locator('.modal').innerText().then((t) => /Abigail/.test(t) && /Loved/i.test(t)), 'day panel: birthday + gifts'); await p.fill('#goalForm input[name=t]', 'Gift Abigail an amethyst'); await p.click('#goalForm button'); await p.waitForTimeout(200);
  ok(await p.locator('.cell[data-day="13"] .mk.goal').count() === 1, 'reminder added from the day panel appears on the calendar');
  await p.click('[data-only="birthdays"]'); await p.waitForTimeout(150); ok(await p.locator('.cell .mk.goal').count() === 0 && await p.locator('.portrait-cal').count() > 0, '“show only birthdays” hides other markers'); await p.click('[data-only="all"]');
  await p.click('[data-nav="1"]'); await p.waitForTimeout(100); ok(await p.locator('.cal-title').innerText().then((t) => /Winter/.test(t)), 'next-season navigation works'); await p.click('[data-nav="today"]');
  await go('calendar/season'); ok(await p.locator('#main').innerText().then((t) => /Pumpkin/.test(t) && /Birthdays/.test(t) && /Festivals/.test(t)), 'seasonal overview lists crops, birthdays, festivals');
  await go('calendar/prepare'); const prepN = await p.locator('[data-prep]').count(); ok(prepN > 5, `prepare for next season builds a checklist (${prepN} items)`); await p.locator('[data-prep]').first().click(); await p.waitForTimeout(100); ok(await p.evaluate(() => Object.values(SDV.store.active().prepare).some((o) => Object.values(o).some(Boolean))), 'checklist ticks persist');
  // ---- journal
  await go('journal'); ok(await p.locator('.jcard.mem').count() >= 1, 'journal: automatic memories from the save'); await p.click('[data-act=new]'); await p.fill('#jf input[name=title]', 'Hello diary'); await p.fill('#jf textarea', 'First entry'); await p.fill('#jf input[name=tags]', 'Farm, Chickens'); await p.click('#jf button:not([type=button])'); await p.waitForTimeout(200);
  ok(await p.locator('.jcard h3:has-text("Hello diary")').count() === 1, 'journal entry created'); await p.fill('#jq', 'diary'); await p.waitForTimeout(500); ok(await p.locator('.jcard').count() === 1, 'journal search filters entries');
  // memories idempotent
  const m1 = await p.evaluate(() => SDV.store.active().memories.length); await p.evaluate((x) => SDV.sync.apply(SDV.save.parse(x), { mode: 'import', fileName: 's' }), SAVE); ok((await p.evaluate(() => SDV.store.active().memories.length)) === m1, 're-importing the same save does not duplicate memories');
  const pic = path.join(os.tmpdir(), 'ylf-test.png'); fs.writeFileSync(pic, Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64'));
  await go('journal/gallery'); await p.setInputFiles('#gup', pic); await p.waitForSelector('.gitem'); await p.waitForTimeout(400); ok(await p.locator('.gitem').count() === 1, 'gallery upload works'); await p.setInputFiles('#gup', { name: 'x.txt', mimeType: 'text/plain', buffer: Buffer.from('nope') }); await p.waitForTimeout(300); ok(await p.locator('#toast.bad').count() === 1 && await p.locator('.gitem').count() === 1, 'non-image upload is rejected');
  await go('journal/year'); const [dl] = await Promise.all([p.waitForEvent('download'), p.click('[data-act=png]')]); ok(/year-2-in-review\.png/.test(dl.suggestedFilename()), 'year in review exports a PNG');
  // ---- tools
  await go('tools'); ok(await p.locator('.catcard').count() === 7, 'tools hub lists 7 tools');
  await go('tools/crops'); ok(await p.locator('table.crops tr').count() > 8, 'crop planner table'); await p.locator('[data-plant]').first().click(); await p.waitForTimeout(100); ok(await p.evaluate(() => SDV.store.active().plantings.length) === 1, 'crop planner logs a planting → calendar harvest'); await p.selectOption('#cFert', 'deluxe'); await p.waitForTimeout(100); await p.locator('[data-sel]').nth(0).check(); await p.locator('[data-sel]').nth(1).check(); await p.waitForTimeout(100); ok(await p.locator('.cmp-row').count() === 2, 'crop comparison view');
  await go('calendar'); ok(await p.locator('.mk.harv').count() >= 1, 'logged planting shows a harvest marker on the calendar');
  await go('tools/fish'); ok(await p.locator('#main').innerText().then((t) => /Still need/.test(t) && /28|fish/.test(t)), 'fish planner: still-need list'); await p.click('[data-tab=browse]'); await p.fill('#fq', 'tuna'); await p.waitForTimeout(500); ok(await p.locator('.tbl tr').count() === 2, 'fish search narrows the list');
  await go('tools/gifts'); await p.locator('.vrow').first().click(); await p.waitForSelector('#gpForm'); await p.fill('#gpForm input[name=gift]', 'Pumpkin'); await p.click('#gpForm button'); await p.waitForTimeout(150); ok(await p.evaluate(() => Object.values(SDV.store.active().giftPlan).flat().length) === 1, 'gift plan item saved');
  await go('tools/cc'); ok(await p.locator('.bi').count() > 3, 'CC planner lists missing items'); await p.locator('[data-remind]').first().click(); await p.waitForTimeout(100); ok(await p.evaluate(() => SDV.store.active().goals.some((g) => g.kind === 'bundle')), 'CC reminder becomes a calendar goal');
  await go('tools/daily'); ok(await p.locator('.task').count() >= 2, 'daily planner lists tasks'); await p.fill('#tForm input', 'Water the parsnips'); await p.click('#tForm button'); await p.waitForTimeout(100); await p.locator('[data-task]').first().click(); await p.waitForTimeout(100); ok(await p.evaluate(() => { const f = SDV.store.active(); const rec = f.daily[String(SDV.util.absDay(f.date))]; return rec && rec.custom.length === 1 && Object.keys(rec.done).length >= 1; }), 'daily tasks can be added and checked off');
  await go('tools/challenges'); await p.click('#chGen'); await p.waitForSelector('[data-accept]'); await p.locator('[data-accept]').first().click(); await p.waitForTimeout(150); ok(await p.evaluate(() => SDV.store.active().challenges.length) === 1, 'challenge generated and accepted'); ok(await p.evaluate(() => SDV.store.active().goals.some((g) => g.kind === 'challenge')), 'accepted challenge also appears as a goal');
  await go('tools/designer'); await p.waitForSelector('#dz'); await p.waitForTimeout(300); const box = await p.locator('#dz').boundingBox(); await p.click('[data-tool=qsprinkler]'); await p.mouse.click(box.x + 120, box.y + 120); await p.click('[data-tool=parsnip]'); await p.mouse.click(box.x + 132, box.y + 120); await p.click('[data-tool=barn]'); await p.mouse.click(box.x + 400, box.y + 300);
  ok(await p.evaluate(() => SDV.store.active().layouts[0].objs.length) === 3, 'designer: sprinkler, crop and barn placed and autosaved'); ok(await p.locator('#dzStats').innerText().then((t) => /1 crops/.test(t) && /watered by sprinklers/.test(t)), 'designer reports sprinkler coverage of crops');
  await p.click('#dzUndo'); ok(await p.evaluate(() => SDV.store.active().layouts[0].objs.length) === 2, 'designer undo'); await p.click('#dzNew'); await p.waitForTimeout(150); ok(await p.evaluate(() => SDV.store.active().layouts.length) === 2, 'designer: multiple layouts');
  await p.screenshot({ path: SHOT + '/designer.png' });
  // ---- progress badges / achievements honesty
  await go('progress/achievements'); ok(await p.locator('#main').innerText().then((t) => /not game achievements/i.test(t) && /In-game achievements/i.test(t)), 'official achievements and website badges are clearly separate');
  // ---- backup includes photos
  const bk = await p.evaluate(async () => { const o = JSON.parse(SDV.store.exportAll()); o.media = await SDV.media.exportAll(); return o.media.length; }); ok(bk >= 1, 'backup export includes photos');
  // ---- visuals
  await go('progress'); await p.screenshot({ path: SHOT + '/s-progress.png' }); await go('tools/crops'); await p.screenshot({ path: SHOT + '/s-crops.png', fullPage: true }); await go('calendar/prepare'); await p.screenshot({ path: SHOT + '/s-prepare.png', fullPage: true });
  await p.setViewportSize({ width: 390, height: 820 }); for (const r of ['progress', 'calendar', 'journal', 'tools', 'tools/designer', 'tools/crops']) { await go(r); ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2), `mobile: #/${r} has no horizontal scroll`); }
  ok(errs.length === 0, 'no JavaScript errors' + (errs.length ? ': ' + [...new Set(errs)].join(' | ') : ''));
  await b.close(); console.log(fails ? `${fails} FAILED` : 'ALL GOOD'); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
