/* Stardew Valley save parser. Runs entirely in the browser (DOMParser) — the file is never uploaded anywhere.
   Supports 1.5 and 1.6 save formats on a best-effort basis; anything not found stays "not detected" and can be set manually. */
(function () {
  const SDVs = (SDV.save = {});
  const SEASON_BY_NAME = { spring: 'Spring', summer: 'Summer', fall: 'Fall', winter: 'Winter' };
  const kids = (el, tag) => (el ? [...el.children].filter((c) => c.tagName === tag) : []);
  const child = (el, tag) => (el ? [...el.children].find((c) => c.tagName === tag) : null);
  const txt = (el, tag, d = '') => { const c = child(el, tag); return c ? c.textContent.trim() : d; };
  const num = (el, tag, d = 0) => { const v = parseFloat(txt(el, tag, '')); return Number.isFinite(v) ? v : d; };
  const norm = (k) => String(k).replace(/^\((O|BC|F|W|H|B|R|T|S|P|TR|BO)\)/, '');
  const ARR_ITEM = (el) => kids(el, 'item'); // <item><key>..</key><value>..</value></item>
  const keyOf = (it) => { const k = child(it, 'key'); return k ? (k.firstElementChild ? k.firstElementChild.textContent : k.textContent).trim() : ''; };
  const valEl = (it) => child(it, 'value');
  const valNum = (it) => { const v = valEl(it); if (!v) return 0; const n = parseFloat(v.textContent.trim()); return Number.isFinite(n) ? n : parseFloat(v.firstElementChild?.textContent || '0') || 0; };

  SDVs.parse = function (xmlText) {
    const doc = new DOMParser().parseFromString(xmlText, 'text/xml');
    if (doc.querySelector('parsererror')) throw new Error('This file is not valid XML — make sure you picked the save file itself (the file named like your farm, with no extension), not SaveGameInfo.');
    const root = doc.documentElement;
    const player = child(root, 'player');
    if (!player) throw new Error('No <player> found — this does not look like a Stardew Valley save file (pick the main save, not SaveGameInfo).');

    const f = { source: 'save' };
    f.farmer = txt(player, 'name', 'Farmer');
    f.farmName = txt(player, 'farmName', 'Farm');
    f.favoriteThing = txt(player, 'favoriteThing');
    f.money = num(player, 'money');
    f.totalEarned = num(player, 'totalMoneyEarned');
    f.playtimeMs = num(player, 'millisecondsPlayed');
    const season = (txt(root, 'currentSeason') || 'spring').toLowerCase();
    f.date = { year: num(root, 'year', 1), season: SEASON_BY_NAME[season] || 'Spring', day: Math.min(28, Math.max(1, num(root, 'dayOfMonth', 1))) };
    f.timeOfDay = num(root, 'timeOfDay', 600);
    f.farmTypeId = num(root, 'whichFarm', 0);
    f.farmType = ['standard', 'riverland', 'forest', 'hilltop', 'wilderness', 'fourcorners', 'beach'][f.farmTypeId] || 'standard';
    f.version = txt(root, 'gameVersion');
    const wx = num(root, 'weatherForTomorrow', -1);
    f.weatherTomorrow = wx === 1 || wx === 3 ? 'Rainy' : wx === 5 ? 'Snowy' : wx >= 0 ? 'Sunny' : null;

    f.skills = {
      farming: num(player, 'farmingLevel'), mining: num(player, 'miningLevel'), foraging: num(player, 'foragingLevel'),
      fishing: num(player, 'fishingLevel'), combat: num(player, 'combatLevel'),
    };

    f.mail = kids(child(player, 'mailReceived'), 'string').map((e) => e.textContent.trim());
    f.eventsSeen = [...(child(player, 'eventsSeen')?.children || [])].map((e) => e.textContent.trim());

    // Friendship
    f.friend = {};
    for (const it of ARR_ITEM(child(player, 'friendshipData'))) {
      const fr = valEl(it)?.firstElementChild || valEl(it);
      f.friend[keyOf(it)] = { points: num(fr, 'Points'), status: txt(fr, 'Status'), gifts: num(fr, 'GiftsThisWeek') };
    }
    f.spouse = txt(player, 'spouse') || null;
    f.children = 0;
    for (const n of root.getElementsByTagName('NPC')) if ((n.getAttribute('xsi:type') || n.getAttribute('type')) === 'Child') f.children++;
    if (!f.children) f.children = root.getElementsByTagName('Child').length || 0;

    // Collections keyed by item id (1.5 = "128", 1.6 = "(O)128")
    const idKeys = (tag) => ARR_ITEM(child(player, tag)).map((it) => keyOf(it)).map(norm);
    f.shipped = idKeys('basicShipped').map(Number).filter(Number.isFinite);
    f.fishCaught = idKeys('fishCaught').map(Number).filter(Number.isFinite);
    f.artifacts = idKeys('archaeologyFound').map(Number).filter(Number.isFinite);
    f.minerals = idKeys('mineralsFound').map(Number).filter(Number.isFinite);
    f.cookingKnown = ARR_ITEM(child(player, 'cookingRecipes')).map(keyOf);
    f.craftingKnown = ARR_ITEM(child(player, 'craftingRecipes')).map(keyOf);
    f.cooked = ARR_ITEM(child(player, 'recipesCooked')).map(keyOf);
    f.achievements = kids(child(player, 'achievements'), 'int').map((e) => parseInt(e.textContent, 10));
    f.professions = kids(child(player, 'professions'), 'int').map((e) => parseInt(e.textContent, 10));

    // Mines
    const deepest = Math.max(num(root, 'lowestMineLevel'), num(player, 'deepestMineLevel'));
    f.deepestMine = Math.min(120, deepest);
    f.skullDepth = deepest > 120 ? deepest - 120 : 0;

    f.walnuts = Math.max(num(root, 'goldenWalnutsFound'), num(root, 'goldenWalnuts'));
    f.houseLevel = num(player, 'houseUpgradeLevel');

    // Special-item flags exist as player booleans (1.5) or mail flags (1.6)
    const pf = (tag, mailKey) => txt(player, tag) === 'true' || f.mail.includes(mailKey);
    f.flags = {
      hasRustyKey: pf('hasRustyKey', 'HasRustyKey'), hasClubCard: pf('hasClubCard', 'HasClubCard'), hasDarkTalisman: pf('hasDarkTalisman', 'HasDarkTalisman'),
      hasSkullKey: pf('hasSkullKey', 'HasSkullKey'), hasMagnifyingGlass: pf('hasMagnifyingGlass', 'HasMagnifyingGlass'), hasSpecialCharm: pf('hasSpecialCharm', 'HasSpecialCharm'),
      secretWoods: undefined, // not reliably detectable
    };

    // Buildings & animals (searches the whole tree; save layout differs between versions)
    f.buildings = [...root.getElementsByTagName('buildingType')].map((e) => e.textContent.trim());
    const animalTypes = [];
    for (const a of root.getElementsByTagName('FarmAnimal')) { const t = txt(a, 'type'); if (t) animalTypes.push(t); }
    f.animals = animalTypes;

    // Tool levels from inventory
    f.tools = {};
    for (const it of kids(child(player, 'items'), 'Item')) {
      const type = it.getAttribute('xsi:type') || it.getAttribute('type');
      if (!['Axe', 'Pickaxe', 'Hoe', 'WateringCan'].includes(type)) continue;
      const nm = type === 'WateringCan' ? 'Watering Can' : type;
      f.tools[nm] = Math.max(f.tools[nm] || 0, num(it, 'upgradeLevel'));
    }
    return f;
  };

  SDVs.summary = (f) => {
    const have = [], miss = [];
    const chk = (cond, label) => (cond ? have : miss).push(label);
    chk(Object.keys(f.friend).length, 'friendships'); chk(f.fishCaught.length, 'fish caught'); chk(f.artifacts.length + f.minerals.length, 'museum finds');
    chk(f.buildings.length, 'buildings'); chk(Object.keys(f.tools).length, 'tool levels'); chk(f.mail.length, 'mail flags'); chk(f.shipped.length, 'shipping');
    return { have, miss };
  };
})();
