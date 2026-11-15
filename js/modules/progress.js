/* Progress engine: every tracker category, computed from the farm's real data.
   Item states:  done (auto) · done (manual) · not detected · manual-only · not applicable (other story route).
   "Not detected" is NOT the same as "not completed": a field the save can't prove is left for the player to tick. */
(function () {
  const D = SDV.data, U = SDV.util, L = SDV.logic, St = SDV.store;
  const P = (SDV.progress = {});
  // NOF stands in for "no save data": every field exists but is empty, and __none marks that nothing was actually read.
  const NOF = Object.freeze({ __none: true, mail: [], friend: {}, shipped: [], fishCaught: [], artifacts: [], minerals: [], museumDonated: [], museumFound: false, cookingKnown: [], craftingKnown: [], cooked: [], achievements: [], bundles: {}, buildings: [], animals: [], tools: {}, skills: { farming: 0, mining: 0, foraging: 0, fishing: 0, combat: 0 }, flags: {}, deepestMine: 0, skullDepth: 0, walnuts: 0, houseLevel: 0, children: 0, totalEarned: 0, fishTotal: 0, spouse: null });
  const R = (f) => !f.__none;                                       // did we actually read data?
  const has = (f, ...k) => R(f) && k.some((x) => f.mail.includes(x));
  const all = (f, ...k) => R(f) && k.every((x) => f.mail.includes(x));
  const A = (f, v) => (R(f) ? v : undefined);                       // auto value only when a save/live snapshot exists
  const STARS = ['CF_Fair', 'CF_Mines', 'CF_Sewer', 'CF_Statue', 'CF_Spouse', 'CF_Fish', 'CF_Museum'];
  const STAR_NAMES = { CF_Fair: 'Stardew Valley Fair (2,000 Star Tokens)', CF_Mines: 'Mines floor 100 chest', CF_Sewer: "Krobus's shop (20,000g)", CF_Statue: 'Old Master Cannoli (Secret Woods statue)', CF_Spouse: 'Spouse at 13.5 hearts', CF_Fish: 'Master Angler (all fish)', CF_Museum: 'Museum collection complete' };
  const wiki = (n) => U.wikiUrl(n);
  const heartsOf = (farm, name) => { const fr = L.friendship(farm, name); return fr ? fr.hearts : null; };
  P.hearts = heartsOf;
  P.eventThresholds = (v) => [...new Set((v.events.join(' ').match(/(\d+) hearts?/g) || []).map((s) => parseInt(s, 10)))].sort((a, b) => a - b);

  // route: farm.route override > save detection; 'undecided' when neither flag exists
  L.route = (farm) => { const f = farm.facts; if (farm.route && farm.route !== 'auto') return farm.route; if (f && f.mail.includes('JojaMember')) return 'joja'; if (f && (f.mail.some((m) => /^cc[A-Z]/.test(m)) || f.mail.includes('canReadJunimoText'))) return 'cc'; return 'undecided'; };

  const chk = (id, label, how, auto, extra = {}) => ({ id, label, how, auto, ...extra });
  const list = (id, label, rows, extra = {}) => ({ id, label, list: rows, ...extra });

  /* ================= categories ================= */
  const CATS = [
    { id: 'story', title: 'Main Story', icon: ['Community Center', 'bundle'], color: '#e6c876', blurb: 'Your route, the Community Center or Joja, and the big unlocks.', items: (farm) => {
      const f = farm.facts || NOF, route = L.route(farm), bs = L.bundleState(farm);
      const rooms = D.ccRooms.map((r) => chk('cc-room-' + r.id, `${r.name} restored`, `Finish its bundles in the Community Center. Reward: ${r.reward}.`, A(f, has(f, r.flag, 'ccIsComplete')), { route: 'cc' }));
      const jojaSteps = [['JojaMember', 'Joja Membership (5,000g)'], ['jojaCraftsRoom', 'Bridge Repair (25,000g)'], ['jojaPantry', 'Greenhouse (35,000g)'], ['jojaBoilerRoom', 'Minecarts (15,000g)'], ['jojaFishTank', 'Panning (20,000g)'], ['jojaVault', 'Bus Repair (40,000g)']].map(([k, l]) => chk('joja-' + k, l, 'Talk to Morris at JojaMart (Community Development Form).', A(f, has(f, k)), { route: 'joja' }));
      return [
        chk('route', 'Chose a story route', 'Start Community Center bundles (Community Center route) or buy a Joja Membership (JojaMart route). You only need one.', A(f, route !== 'undecided')),
        ...rooms,
        list('cc-bundles', 'Community Center bundles', D.bundles.map((b) => ({ id: b.id, name: `${b.name} (${b.room})`, done: bs[b.id].done, auto: bs[b.id].known, how: `Need ${b.need} of: ${b.items.join(', ')}. Reward: ${b.reward}.`, wiki: b.name })), { route: 'cc', key: 'bundle' }),
        chk('cc-complete', 'Community Center fully restored', 'Complete all six rooms.', A(f, has(f, 'ccIsComplete')), { route: 'cc' }),
        chk('cc-wizard', "Wizard's buildings unlocked", 'After the Community Center is complete the Wizard can build Junimo Huts and Obelisks.', A(f, has(f, 'ccIsComplete')), { route: 'cc' }),
        ...jojaSteps,
        chk('joja-complete', 'Joja Community Development Form completed', 'Buy all five projects after joining.', A(f, all(f, 'jojaBoilerRoom', 'jojaCraftsRoom', 'jojaFishTank', 'jojaPantry', 'jojaVault')), { route: 'joja' }),
        chk('railroad', 'Railroad unlocked', 'Clear the boulder near the Mountain with a Steel Axe (usually possible from Summer 3, Year 1).', undefined),
        chk('desert', 'Calico Desert (bus) unlocked', 'Repair the bus: Vault bundles (Community Center) or Bus Repair (Joja).', A(f, has(f, 'ccVault', 'jojaVault'))),
        chk('ginger', 'Ginger Island unlocked', 'After the Community Center/Joja route, Willy repairs the boat (Hardwood ×200, Iridium Bar ×5, Battery Pack ×5).', A(f, has(f, 'willyBoatFixed'))),
        chk('theater', 'Movie Theater unlocked', 'Unlocked after the Community Center (or Joja route) is finished — see the wiki for the exact conditions.', undefined),
        chk('q-intro', 'Quest: Introductions', 'Meet every villager in Pelican Town.', undefined), chk('q-museum', 'Museum: donated your first item', 'Find an artifact or mineral and give it to Gunther.', A(f, f.museumDonated.length > 0 || f.artifacts.length + f.minerals.length > 0)),
        chk('wizard', 'Wizard-related progression', 'Visit the Wizard\'s Tower and follow his quests (Rusty Key, Dark Talisman).', (R(f) && f.flags.hasDarkTalisman ? true : undefined)),
      ];
    } },
    { id: 'explore', title: 'Exploration', icon: ['Pickaxe', 'tool'], color: '#9aa8b8', blurb: 'Mines, Skull Cavern, Ginger Island and secrets.', items: (farm) => { const f = farm.facts || NOF; return [
      chk('mines-1', 'Entered the Mines', 'The Mines entrance is on the Mountain.', A(f, f.deepestMine >= 1)), chk('mines-40', 'Mines floor 40 (Frost Zone)', 'Descend; the elevator unlocks every 5 floors.', A(f, f.deepestMine >= 40), { count: R(f) && [Math.min(f.deepestMine, 120), 120], countLabel: 'floors' }),
      chk('mines-80', 'Mines floor 80 (Lava Zone)', 'Fire Quartz and Iridium ore start appearing deeper.', A(f, f.deepestMine >= 80)), chk('mines-100', 'Mines floor 100 (Stardrop chest)', 'Treasure room on floor 100.', A(f, f.deepestMine >= 100)), chk('mines-120', 'Bottom of the Mines (floor 120)', 'The chest here holds the Skull Key.', A(f, f.deepestMine >= 120)),
      chk('skull-key', 'Obtained the Skull Key', 'Open the chest at Mines floor 120.', A(f, f.flags.hasSkullKey)), chk('skull-1', 'Explored Skull Cavern', 'Enter with the Skull Key in the Calico Desert.', A(f, f.skullDepth >= 1)), chk('skull-25', 'Skull Cavern floor 25', 'Bring bombs and food.', A(f, f.skullDepth >= 25)), chk('skull-50', 'Skull Cavern floor 50', 'Iridium bats and Iridium ore.', A(f, f.skullDepth >= 50)), chk('skull-100', 'Skull Cavern floor 100', 'A common milestone goal.', A(f, f.skullDepth >= 100)), chk('skull-200', 'Skull Cavern floor 200+', 'It is endless; 200 is a tough goal.', A(f, f.skullDepth >= 200)),
      chk('danger', 'Dangerous Mines', 'A harder, rarer variant of the Mines (after reaching the bottom).', undefined),
      chk('island-explored', 'Explored Ginger Island', 'Visit the farm, Field Office, Pirate Cove, Dig Site and the Volcano.', undefined), chk('volcano', 'Volcano Dungeon explored', 'Cross the bridge on Ginger Island north.', undefined),
      chk('sewers', 'Sewers (Rusty Key)', 'Donate 60 items to the Museum for the Rusty Key.', A(f, f.flags.hasRustyKey)), chk('woods', 'Secret Woods', 'Clear the large log near Cindersap Forest with a Steel Axe.', undefined), chk('club', "Mr. Qi's Club Card", 'Obtained in the Calico Desert.', A(f, f.flags.hasClubCard)), chk('swamp', "Witch's Swamp", 'Appears after the Dark Talisman events.', undefined),
    ]; } },
    { id: 'collections', title: 'Collections', icon: ['Vase', 'artifact'], color: '#b79ad8', blurb: 'Museum, fish, recipes, shipping, walnuts, Stardrops.', items: (farm) => {
      const f = farm.facts || NOF; const donated = R(f) && f.museumFound ? f.museumDonated : null;
      return [
        list('artifacts', 'Museum artifacts', D.artifacts.map((a) => ({ id: a.id, name: a.name, done: R(f) && (donated ? donated.includes(a.itemId) : f.artifacts.includes(a.itemId)), auto: R(f), how: `Found: ${a.where}. Donate to Gunther.`, wiki: a.name })), { key: 'artifacts', note: R(f) ? (donated ? 'Counts items donated to the Museum.' : 'Museum data not in this save — counting items found.') : '' }),
        list('minerals', 'Minerals & gems', D.minerals.map((m) => ({ id: m.id, name: m.name, done: R(f) && (donated ? donated.includes(m.itemId) : f.minerals.includes(m.itemId)), auto: R(f), how: `${m.where}.`, wiki: m.name })), { key: 'minerals' }),
        list('fish', 'Fish collection', D.fish.map((x) => ({ id: x.id, name: x.name, done: R(f) && f.fishCaught.includes(x.itemId), auto: R(f), how: `${x.allSeasons ? 'Any season' : x.seasons.join('/')} · ${x.weather} · ${U.fmtWindows(x.time)} · ${x.location}.`, wiki: x.name })), { key: 'fish' }),
        list('cooking', 'Cooking recipes learned', D.recipes.map((r) => ({ id: r.id, name: r.name, done: R(f) && f.cookingKnown.includes(r.name), auto: R(f), how: `Source: ${r.source}. Needs: ${r.ingredients}.`, wiki: r.name })), { key: 'cooking', note: 'Only recipes in this app’s data are listed; the game has more.' }),
        list('crafting', 'Crafting recipes learned', D.crafting.map((r) => ({ id: r.id, name: r.name, done: R(f) && f.craftingKnown.includes(r.name), auto: R(f), how: `Unlocked by: ${r.source}. Needs: ${r.ingredients}.`, wiki: r.name })), { key: 'crafting', note: 'Only recipes in this app’s data are listed; the game has more.' }),
        chk('shipping', 'Items shipped (distinct)', 'Ship one of every shippable item.', A(f, f.shipped.length >= 145), { count: R(f) && [f.shipped.length, 145], countLabel: 'items (total approximate)' }),
        chk('walnuts', 'Golden Walnuts', 'Hidden all over Ginger Island: 130 in total.', A(f, f.walnuts >= 130), { count: R(f) && [f.walnuts, 130] }),
        list('stardrops', 'Stardrops', STARS.map((k) => ({ id: k, name: STAR_NAMES[k], done: R(f) && f.mail.includes(k), auto: R(f), how: 'Each Stardrop permanently raises your maximum energy.' })), { key: 'stardrops' }),
        list('special', 'Books & special items', [['hasRustyKey', 'Rusty Key'], ['hasSkullKey', 'Skull Key'], ['hasClubCard', "Qi's Club Card"], ['hasDarkTalisman', 'Dark Talisman'], ['hasMagnifyingGlass', 'Magnifying Glass'], ['hasSpecialCharm', 'Special Charm']].map(([k, n]) => ({ id: k, name: n, done: R(f) && !!f.flags[k], auto: R(f), how: 'Story/exploration item.' })), { key: 'special', note: 'Skill books and other collectibles are not tracked yet.' }),
      ];
    } },
    { id: 'relationships', title: 'Relationships', icon: ['Heart', 'gift'], color: '#e0a0aa', blurb: 'Friendship hearts, heart events, marriage and family.', items: (farm) => {
      const f = farm.facts || NOF; const hs = D.villagers.map((v) => ({ v, h: heartsOf(farm, v.name) }));
      const n = (min) => hs.filter((x) => x.h != null && x.h >= min).length; const src = f ? undefined : null;
      const totalEv = D.villagers.reduce((a, v) => a + P.eventThresholds(v).length, 0), seenEv = D.villagers.reduce((a, v) => a + P.eventThresholds(v).filter((t) => St.isChecked(farm, `ev:${v.id}:${t}`)).length, 0);
      return [
        chk('rel-5', '5+ hearts with 10 villagers', 'Talk daily and give loved gifts (see the Gift planner).', R(f) ? n(5) >= 10 : undefined, { count: [Math.min(n(5), 10), 10], manualOk: true }),
        chk('rel-5b', '5+ hearts with 20 villagers', 'Keep going — every villager counts.', R(f) ? n(5) >= 20 : undefined, { count: [Math.min(n(5), 20), 20] }),
        chk('rel-10', '10 hearts with 8 villagers', 'Marriage candidates stop at 8 hearts until you date them.', R(f) ? n(10) >= 8 : undefined, { count: [Math.min(n(10), 8), 8] }),
        chk('dating', 'Started dating someone', 'Give a Bouquet at 8 hearts to a marriage candidate.', A(f, Object.values(f.friend).some((x) => /dating|engaged|married/i.test(x.status || '')) || !!f.spouse)),
        chk('married', 'Married', 'Give the Mermaid’s Pendant at 10 hearts.', A(f, !!f.spouse)), chk('child1', 'First child', 'Ask your spouse after upgrading the farmhouse (nursery).', A(f, f.children >= 1)), chk('child2', 'Second child', 'Possible after the first.', A(f, f.children >= 2)),
        chk('events', 'Heart events witnessed', 'Tick them off on each villager’s profile; the save does not reveal them reliably.', undefined, { count: [seenEv, totalEv], manualCount: true }),
        chk('gifts-week', 'Gifts given this week', 'Up to two gifts per villager per week.', R(f) ? Object.values(f.friend).some((x) => x.giftsThisWeek > 0) : undefined, { count: R(f) && [Object.values(f.friend).filter((x) => x.giftsThisWeek > 0).length, Math.max(Object.keys(f.friend).length, 1)], countLabel: 'villagers gifted' }),
      ];
    } },
    { id: 'farm', title: 'Farm Development', icon: ['Barn', 'building'], color: '#9fcf7a', blurb: 'House, buildings, animals, tools, skills and upgrades.', items: (farm) => {
      const f = farm.facts || NOF;  const t = (lvl) => A(f, ['Axe', 'Pickaxe', 'Hoe', 'Watering Can'].every((x) => (f.tools[x] ?? 0) >= lvl));
      const owned = (re) => R(f) && f.animals.some((a) => re.test(a.type));
      return [
        chk('house1', 'Farmhouse: Kitchen upgrade', '10,000g + 450 Wood (Robin).', A(f, f.houseLevel >= 1)), chk('house2', 'Farmhouse: Nursery upgrade', '65,000g + 100 Hardwood.', A(f, f.houseLevel >= 2)), chk('house3', 'Farmhouse: Cellar upgrade', '100,000g.', A(f, f.houseLevel >= 3)),
        list('buildings', 'Farm buildings', D.buildings.filter((x) => !/Farmhouse|Big Shed/.test(x.name)).map((x) => ({ id: x.id, name: x.name, done: R(f) && f.buildings.includes(x.name), auto: R(f), how: `${U.gold(x.cost)}${x.mats !== '—' ? ' + ' + x.mats : ''}. ${x.notes}`, wiki: x.name })), { key: 'buildings' }),
        list('animals', 'Farm animals', ['Chicken', 'Duck', 'Rabbit', 'Cow', 'Goat', 'Sheep', 'Pig', 'Ostrich'].map((n) => ({ id: n.toLowerCase(), name: n, done: R(f) && !!owned(new RegExp(n, 'i')), auto: R(f), how: (D.animals.find((a) => a.name === n) || {}).notes || '', wiki: n })), { key: 'animals' }),
        chk('tools-1', 'All tools upgraded to Copper', '2,000g + 5 Copper Bar each (Clint).', t(1)), chk('tools-2', 'All tools Steel', '5,000g + 5 Iron Bar each.', t(2)), chk('tools-3', 'All tools Gold', '10,000g + 5 Gold Bar each.', t(3)), chk('tools-4', 'All tools Iridium', '25,000g + 5 Iridium Bar each.', t(4)),
        ...['farming', 'mining', 'foraging', 'fishing', 'combat'].map((s) => chk('skill-' + s, `${s[0].toUpperCase() + s.slice(1)} level 10`, 'Gain experience by doing the activity.', A(f, f.skills[s] >= 10), { count: R(f) && [f.skills[s], 10] })),
        chk('up-bridge', 'Quarry bridge repaired', 'Crafts Room (CC) or Bridge Repair (Joja).', A(f, has(f, 'ccCraftsRoom', 'jojaCraftsRoom', 'ccIsComplete'))), chk('up-greenhouse', 'Greenhouse restored', 'Pantry (CC) or Greenhouse (Joja).', A(f, has(f, 'ccPantry', 'jojaPantry', 'ccIsComplete'))), chk('up-carts', 'Minecarts activated', 'Boiler Room (CC) or Minecarts (Joja).', A(f, has(f, 'ccBoilerRoom', 'jojaBoilerRoom', 'ccIsComplete'))),
      ];
    } },
  ];

  /* ---- Official achievements that CAN be derived from a save (the rest stay manual). Names are the in-game ones. ---- */
  const fcnt = (f, pred) => (R(f) ? Object.entries(f.friend).filter(([n, x]) => pred(x, L.villager(n))).length : 0);
  const achieveRules = {
    greenhorn: (f) => f.totalEarned >= 15000, cowpoke: (f) => f.totalEarned >= 50000, homesteader: (f) => f.totalEarned >= 250000, millionaire: (f) => f.totalEarned >= 1000000, legend: (f) => f.totalEarned >= 10000000,
    'a-complete-collection': (f) => f.museumFound && f.museumDonated.length >= 95, 'treasure-trove': (f) => f.museumFound && f.museumDonated.length >= 40,
    'full-house': (f) => !!f.spouse && f.children >= 2, 'singular-talent': (f) => Object.values(f.skills).some((v) => v >= 10), 'master-of-the-five-ways': (f) => Object.values(f.skills).every((v) => v >= 10),
    popular: (f) => fcnt(f, (x) => L.hearts(x.points) >= 5) >= 10, networking: (f) => fcnt(f, (x) => L.hearts(x.points) >= 5) >= 20, 'best-friends': (f) => fcnt(f, (x) => L.hearts(x.points) >= 10) >= 1,
    'local-legend': (f) => f.mail.includes('ccIsComplete'), 'joja-co-member-of-the-year': (f) => ['jojaBoilerRoom', 'jojaCraftsRoom', 'jojaFishTank', 'jojaPantry', 'jojaVault'].every((k) => f.mail.includes(k)),
    'the-bottom': (f) => f.deepestMine >= 120, cook: (f) => f.cooked.length >= 10, 'sous-chef': (f) => f.cooked.length >= 25, fisherman: (f) => f.fishCaught.length >= 10, 'ol-mariner': (f) => f.fishCaught.length >= 24, 'mother-catch': (f) => f.fishTotal >= 100,
    'mystery-of-the-stardrops': (f) => STARS.every((k) => f.mail.includes(k)),
  };
  P.badges = (farm) => {
    const g = farm.goals.filter((x) => x.done).length, j = farm.journal.length, imgs = (farm.gallery || []).length;
    return [
      ['First goal', 'Complete a goal', g >= 1], ['Goal getter', 'Complete 5 goals', g >= 5], ['Dear diary', 'Write a journal entry', j >= 1], ['Storyteller', 'Write 10 journal entries', j >= 10], ['Photographer', 'Add a photo to the gallery', imgs >= 1],
      ['Planner', 'Save a farm layout', (farm.layouts || []).length >= 1], ['Challenger', 'Finish a challenge', (farm.challenges || []).some((c) => c.done)], ['Connected', 'Import a save', !!farm.facts], ['Always on', 'Receive a live update from the companion', !!farm.liveAt && !farm.liveSim],
      ['Memory keeper', 'Collect 5 automatic memories', (farm.memories || []).length >= 5],
    ].map(([name, how, done]) => ({ name, how, done }));
  };
  CATS.push({ id: 'achievements', title: 'Achievements', icon: ['Trophy', 'achievement'], color: '#f0c85a', blurb: 'In-game achievements and Your Little Farm badges.', items: (farm) => {
    const f = farm.facts || NOF;
    return [
      ...(R(f) ? [chk('ach-count', 'Official achievements unlocked in the game', 'Read straight from your save (the save stores ids, not names).', undefined, { count: [f.achievements.length, D.achievements.length], info: true })] : []),
      list('ach', 'In-game achievements (names)', D.achievements.map((a) => ({ id: a.id, name: a.name, done: R(f) && !!achieveRules[a.id] && achieveRules[a.id](f), auto: R(f) && !!achieveRules[a.id], how: `${a.desc}${achieveRules[a.id] ? '' : ' (cannot be detected from a save — tick it manually)'}`, wiki: a.name })), { key: 'ach', note: 'Only achievements the save can prove are auto-ticked; others are manual.' }),
      list('badges', 'Your Little Farm badges (not game achievements)', P.badges(farm).map((b) => ({ id: 'badge-' + U.slug(b.name), name: b.name, done: b.done, auto: true, how: b.how, own: true })), { key: 'badges', own: true }),
    ];
  } });

  /* ---- Perfection (weights from the wiki's Perfection table; totals for some collections are approximate) ---- */
  P.perfection = (farm) => {
    const f = farm.facts || NOF; const frac = (v) => Math.max(0, Math.min(1, v)); const man = (k) => (farm.perfect && farm.perfect[k]) || 0;
    const obelisks = R(f) ? ['Earth Obelisk', 'Water Obelisk', 'Desert Obelisk', 'Island Obelisk'].filter((o) => f.buildings.includes(o)).length : null;
    const friends = D.villagers.filter((v) => !['Dwarf', 'Krobus', 'Kent', 'Leo'].includes(v.name) || true).map((v) => ({ v, h: heartsOf(farm, v.name) }));
    const maxed = friends.filter((x) => x.h != null && x.h >= (x.v.marry ? 8 : 10)).length;
    const rows = [
      { id: 'shipping', label: 'Produce & Forage shipped', w: 15, v: R(f) ? frac(f.shipped.length / 145) : null, how: 'Ship every shippable item (approx. 145 types).', link: '#/progress/collections' },
      { id: 'obelisks', label: 'Obelisks on the farm', w: 4, v: R(f) ? obelisks / 4 : null, how: 'Earth, Water, Desert and Island Obelisks (1% each).', link: '#/progress/farm' },
      { id: 'clock', label: 'Gold Clock', w: 10, v: R(f) ? (f.buildings.includes('Gold Clock') ? 1 : 0) : null, how: 'Build the Gold Clock (10,000,000g).', link: '#/progress/farm' },
      { id: 'slayer', label: 'Monster Slayer Hero', w: 10, v: man('slayer') / 100, manual: true, how: 'Complete every Monster Eradication Goal at the Adventurer\'s Guild. Enter your progress (%) — not detectable from a save here.' },
      { id: 'friends', label: 'Great Friends', w: 11, v: R(f) || Object.keys(farm.hearts || {}).length ? frac(maxed / friends.length) : null, how: 'Reach max friendship with every villager (10 hearts; 8 for undated marriage candidates).', link: '#/progress/relationships' },
      { id: 'level', label: 'Farmer Level', w: 5, v: R(f) ? frac(L.skillSum(f) / 2 / 25) : null, how: 'Combined skill levels ÷ 2 must reach 25 (all five skills at 10).', link: '#/progress/farm' },
      { id: 'stardrops', label: 'Stardrops', w: 10, v: R(f) ? STARS.filter((k) => f.mail.includes(k)).length / 7 : null, how: 'Find all seven Stardrops.', link: '#/progress/collections' },
      { id: 'cooking', label: 'Cooking recipes cooked', w: 10, v: R(f) ? frac(f.cooked.length / 80) : null, how: 'Cook every recipe (≈80).', link: '#/progress/collections' },
      { id: 'crafting', label: 'Crafting recipes crafted', w: 10, v: R(f) ? frac(f.craftingKnown.length / 129) : null, how: 'Craft everything (≈129). Counts recipes learned, as crafted counts are not read.', link: '#/progress/collections' },
      { id: 'fish', label: 'Fish caught', w: 10, v: R(f) ? frac(f.fishCaught.length / 67) : null, how: 'Catch every fish (≈67 species).', link: '#/progress/collections' },
      { id: 'walnuts', label: 'Golden Walnuts', w: 5, v: R(f) ? frac(f.walnuts / 130) : null, how: 'Find all 130 Golden Walnuts.', link: '#/progress/collections' },
    ];
    rows.forEach((r) => { r.known = r.v != null; r.pts = r.known ? r.v * r.w : 0; });
    const known = rows.filter((r) => r.known); const total = rows.reduce((a, r) => a + r.pts, 0);
    return { rows, total: Math.round(total * 10) / 10, knownWeight: known.reduce((a, r) => a + r.w, 0) };
  };

  /* ================= evaluation ================= */
  const rowDone = (farm, key, row) => row.done || St.isChecked(farm, `coll:${key}:${row.id}`) || (key === 'bundle' && St.isChecked(farm, 'bundle:' + row.id));
  P.evaluate = (farm) => {
    const route = L.route(farm);
    return CATS.map((c) => {
      const items = c.items(farm).map((it) => {
        const na = (it.route === 'cc' && route === 'joja') || (it.route === 'joja' && route !== 'joja') || (it.route && route === 'undecided' && it.id !== 'route');
        if (it.list) { const rows = it.list.map((r) => ({ ...r, done: rowDone(farm, it.key || it.id, r), manualDone: !r.done && rowDone(farm, it.key || it.id, r) })); const have = rows.filter((r) => r.done).length; return { ...it, rows, have, total: rows.length, frac: rows.length ? have / rows.length : 0, done: have === rows.length && rows.length > 0, na, detectable: it.list.some((r) => r.auto) }; }
        const manual = St.isChecked(farm, it.id); const detectable = it.auto !== undefined; const auto = it.auto === true;
        let have = null, total = null; if (it.count && it.count[1]) { [have, total] = it.count; }
        if (it.manualCount) { /* count driven by manual ticks elsewhere */ }
        const done = it.info ? false : auto || manual;
        const frac = it.info ? (total ? have / total : 0) : done ? 1 : (it.count && total ? Math.min(0.99, have / total) : 0);
        return { ...it, done, auto, manual: manual && !auto, detectable, have, total, frac, na, notDetected: detectable && !auto && !manual };
      });
      const live = items.filter((i) => !i.na && !i.info);
      const pct = live.length ? Math.round((live.reduce((a, i) => a + i.frac, 0) / live.length) * 100) : 0;
      const remaining = live.filter((i) => (i.list ? !i.done : !i.done));
      return { ...c, items, pct, remaining, doneCount: live.filter((i) => i.done).length, liveCount: live.length };
    });
  };
  P.overall = (farm) => { const ev = P.evaluate(farm); const per = P.perfection(farm); return { cats: ev, perfection: per, pct: Math.round(ev.reduce((a, c) => a + c.pct, 0) / ev.length) }; };
  P.byId = (farm, id) => P.evaluate(farm).find((c) => c.id === id);
  // Next steps across all categories: first not-done, applicable, detectable items
  P.nextSteps = (farm, n = 6) => P.evaluate(farm).flatMap((c) => c.items.filter((i) => !i.na && !i.done && !i.info && !i.list).map((i) => ({ cat: c, item: i }))).slice(0, n);
})();
