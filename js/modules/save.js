/* Save-file parser (Phase 2). Runs entirely in the browser with DOMParser — the file is never uploaded.
   Targets Stardew Valley 1.5 and 1.6 save layouts. Everything it cannot find is left undefined/empty so the UI can say "not detected". */
(function () {
  const P = (SDV.save = {});
  const kids = (el, tag) => (el ? [...el.children].filter((c) => c.tagName === tag) : []);
  const child = (el, tag) => (el ? [...el.children].find((c) => c.tagName === tag) || null : null);
  const txt = (el, tag, d = '') => { const c = child(el, tag); return c ? c.textContent.trim() : d; };
  const num = (el, tag, d = 0) => { const v = parseFloat(txt(el, tag, '')); return Number.isFinite(v) ? v : d; };
  const norm = (k) => String(k).replace(/^\([A-Z]+\)/, '');
  const items = (el) => kids(el, 'item');
  const keyOf = (it) => { const k = child(it, 'key'); return k ? (k.firstElementChild ? k.firstElementChild.textContent : k.textContent).trim() : ''; };
  const valEl = (it) => child(it, 'value');
  const rgb = (el) => (el ? '#' + ['R', 'G', 'B'].map((c) => Math.max(0, Math.min(255, num(el, c, 128))).toString(16).padStart(2, '0')).join('') : null);
  const SEASON = { spring: 'Spring', summer: 'Summer', fall: 'Fall', winter: 'Winter' };

  P.parse = function (xmlText) {
    const doc = new DOMParser().parseFromString(xmlText, 'text/xml');
    if (doc.querySelector('parsererror')) throw new Error('That file is not valid XML. Pick the main save file (named like your farm, no extension) — not SaveGameInfo.');
    const root = doc.documentElement, player = child(root, 'player');
    if (!player) throw new Error('No <player> found. This does not look like a Stardew Valley save — pick the main save file, not SaveGameInfo.');
    const f = { parsedAt: Date.now(), parserVersion: 2 };
    f.farmer = txt(player, 'name', 'Farmer'); f.farmName = txt(player, 'farmName', 'Farm');
    f.saveId = txt(root, 'uniqueIDForThisGame') || `${f.farmName}|${f.farmer}`;
    f.favoriteThing = txt(player, 'favoriteThing');
    f.money = num(player, 'money'); f.totalEarned = num(player, 'totalMoneyEarned'); f.playtimeMs = num(player, 'millisecondsPlayed');
    f.date = { year: num(root, 'year', 1), season: SEASON[(txt(root, 'currentSeason') || 'spring').toLowerCase()] || 'Spring', day: Math.min(28, Math.max(1, num(root, 'dayOfMonth', 1))) };
    f.timeOfDay = num(root, 'timeOfDay', 600);
    f.farmTypeId = num(root, 'whichFarm', 0);
    f.farmType = ['standard', 'riverland', 'forest', 'hilltop', 'wilderness', 'fourcorners', 'beach'][f.farmTypeId] || 'standard';
    f.gameVersion = txt(root, 'gameVersion');
    const wx = num(root, 'weatherForTomorrow', -1);
    f.weatherTomorrow = wx === 1 || wx === 3 ? 'Rainy' : wx === 5 ? 'Snowy' : wx >= 0 ? 'Sunny' : null;
    f.skills = { farming: num(player, 'farmingLevel'), mining: num(player, 'miningLevel'), foraging: num(player, 'foragingLevel'), fishing: num(player, 'fishingLevel'), combat: num(player, 'combatLevel') };
    f.professions = kids(child(player, 'professions'), 'int').map((e) => parseInt(e.textContent, 10));
    f.appearance = { hair: rgb(child(player, 'hairstyleColor')), eye: rgb(child(player, 'newEyeColor')), pants: rgb(child(player, 'pantsColor')) };

    f.mail = kids(child(player, 'mailReceived'), 'string').map((e) => e.textContent.trim());
    f.friend = {};
    for (const it of items(child(player, 'friendshipData'))) { const fr = valEl(it)?.firstElementChild || valEl(it); f.friend[keyOf(it)] = { points: num(fr, 'Points'), status: txt(fr, 'Status'), giftsThisWeek: num(fr, 'GiftsThisWeek'), giftsToday: num(fr, 'GiftsToday') }; }
    f.spouse = txt(player, 'spouse') || null;
    f.children = 0;
    for (const n of root.getElementsByTagName('NPC')) if ((n.getAttribute('xsi:type') || '') === 'Child') f.children++;

    const ids = (tag) => items(child(player, tag)).map((it) => Number(norm(keyOf(it)))).filter(Number.isFinite);
    const sumCounts = (tag, deep) => items(child(player, tag)).reduce((a, it) => { const v = valEl(it); const n = deep ? parseFloat(v?.getElementsByTagName('int')[0]?.textContent) : parseFloat(v?.textContent); return a + (Number.isFinite(n) ? n : 0); }, 0);
    f.shipped = ids('basicShipped'); f.shippedTotal = sumCounts('basicShipped', false);
    f.fishCaught = ids('fishCaught'); f.fishTotal = sumCounts('fishCaught', true);
    f.artifacts = ids('archaeologyFound'); f.minerals = ids('mineralsFound');
    f.cookingKnown = items(child(player, 'cookingRecipes')).map(keyOf); f.craftingKnown = items(child(player, 'craftingRecipes')).map(keyOf);
    f.cooked = items(child(player, 'recipesCooked')).map((it) => norm(keyOf(it)));
    f.achievements = kids(child(player, 'achievements'), 'int').map((e) => parseInt(e.textContent, 10));

    // Museum donations: <museumPieces><item><key>(tile)</key><value><int|string>id</..>
    const mp = root.getElementsByTagName('museumPieces')[0];
    f.museumDonated = mp ? items(mp).map((it) => Number(norm(valEl(it)?.textContent.trim() || ''))).filter(Number.isFinite) : [];
    f.museumFound = !!mp;

    // Community Center bundles: flags per bundle id (1.5: int key; 1.6: "Room/id")
    f.bundles = {};
    const bun = child(root, 'bundles');
    for (const it of items(bun)) { const m = /(\d+)\s*$/.exec(keyOf(it)); if (!m) continue; f.bundles[m[1]] = [...(valEl(it)?.getElementsByTagName('boolean') || [])].map((b) => b.textContent.trim() === 'true'); }

    // Stats (1.5: direct children of <stats>; 1.6: <Values><item>)
    const stats = child(player, 'stats'); const sv = {};
    if (stats) { for (const c of stats.children) if (c.tagName !== 'Values' && c.children.length === 0) sv[c.tagName] = parseFloat(c.textContent); for (const it of items(child(stats, 'Values'))) sv[keyOf(it)] = parseFloat(valEl(it)?.textContent); }
    f.stats = { itemsShipped: sv.itemsShipped, fishCaught: sv.fishCaught, questsCompleted: sv.questsCompleted, daysPlayed: sv.daysPlayed };

    const deepest = Math.max(num(root, 'lowestMineLevel'), num(player, 'deepestMineLevel'));
    f.deepestMine = Math.min(120, deepest); f.skullDepth = deepest > 120 ? deepest - 120 : 0;
    f.walnuts = Math.max(num(root, 'goldenWalnutsFound'), num(root, 'goldenWalnuts'));
    f.houseLevel = num(player, 'houseUpgradeLevel');
    const pf = (tag, mk) => txt(player, tag) === 'true' || f.mail.includes(mk);
    f.flags = { hasRustyKey: pf('hasRustyKey', 'HasRustyKey'), hasClubCard: pf('hasClubCard', 'HasClubCard'), hasDarkTalisman: pf('hasDarkTalisman', 'HasDarkTalisman'), hasSkullKey: pf('hasSkullKey', 'HasSkullKey'), hasMagnifyingGlass: pf('hasMagnifyingGlass', 'HasMagnifyingGlass'), hasSpecialCharm: pf('hasSpecialCharm', 'HasSpecialCharm') };

    f.buildings = [...root.getElementsByTagName('buildingType')].map((e) => e.textContent.trim());
    f.animals = [...root.getElementsByTagName('FarmAnimal')].map((a) => ({ type: txt(a, 'type'), name: txt(a, 'name') })).filter((a) => a.type);
    f.tools = {};
    for (const it of kids(child(player, 'items'), 'Item')) {
      const type = it.getAttribute('xsi:type') || ''; if (!['Axe', 'Pickaxe', 'Hoe', 'WateringCan'].includes(type)) continue;
      const nm = type === 'WateringCan' ? 'Watering Can' : type; f.tools[nm] = Math.max(f.tools[nm] || 0, num(it, 'upgradeLevel'));
    }
    return f;
  };

  // What the parser actually found — shown to the user so nothing is silently assumed.
  P.coverage = (f) => {
    const rows = [
      ['Farmer, farm, date, gold', !!f.farmer], ['Skills', Object.values(f.skills).some((v) => v > 0)], ['Friendships', Object.keys(f.friend).length > 0], ['Fish caught', f.fishCaught.length > 0],
      ['Museum donations', f.museumFound], ['Cooking & crafting recipes', f.cookingKnown.length + f.craftingKnown.length > 0], ['Shipping', f.shipped.length > 0], ['Achievements', f.achievements.length > 0],
      ['Buildings', f.buildings.length > 0], ['Animals', f.animals.length > 0], ['Tool upgrades', Object.keys(f.tools).length > 0], ['Community Center bundles', Object.keys(f.bundles).length > 0], ['Mail flags (story unlocks)', f.mail.length > 0],
    ];
    return rows.map(([label, ok]) => ({ label, ok }));
  };
})();
