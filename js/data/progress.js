/* Progress tracker definitions.
   Each item: {id, label, hint, auto(f) -> true|false|undefined}  (undefined = cannot be detected from a save → manual only)
   or a counter: {id, label, count(f) -> [have,total] | undefined}.
   `f` is the "facts" object produced by SDV.save.parse() (see save.js) — it may be null for manual-only farms. */
(function () {
  const D = SDV.data;
  const mail = (f, k) => !!(f && f.mail && f.mail.includes(k));
  const mailAny = (f, ...ks) => ks.some((k) => mail(f, k));
  const mailAll = (f, ...ks) => ks.every((k) => mail(f, k));
  const cap = (f, v) => (f ? v : undefined);
  const tool = (f, lvl) => (f ? ['Axe', 'Pickaxe', 'Hoe', 'Watering Can'].every((t) => (f.tools[t] ?? 0) >= lvl) : undefined);
  const bld = (f, ...names) => (f ? names.some((n) => f.buildings.includes(n)) : undefined);
  const skill = (f, s) => (f ? (f.skills[s] || 0) >= 10 : undefined);
  const inter = (list, arr) => list.filter((x) => arr.includes(x.itemId)).length;

  D.tracker = [
    { id: 'story', title: 'Main Story', icon: '📖', color: '#e0b040', items: [
      { id: 'route-cc', label: 'Chose the Community Center route', hint: 'Entered the Community Center and started bundles', auto: (f) => cap(f, mailAny(f, 'ccBulletin', 'ccBoilerRoom', 'ccCraftsRoom', 'ccPantry', 'ccVault', 'ccFishTank', 'ccIsComplete') || (mail(f, 'canReadJunimoText'))) },
      { id: 'route-joja', label: 'Chose the JojaMart route', hint: 'Bought a Joja Membership', auto: (f) => cap(f, mail(f, 'JojaMember')) },
      { id: 'cc-complete', label: 'Completed the Community Center', hint: 'All six rooms restored', auto: (f) => cap(f, mail(f, 'ccIsComplete')) },
      { id: 'joja-complete', label: 'Completed the Joja Community Development Form', hint: 'All five projects purchased', auto: (f) => cap(f, mailAll(f, 'jojaBoilerRoom', 'jojaCraftsRoom', 'jojaFishTank', 'jojaPantry', 'jojaVault')) },
      { id: 'railroad', label: 'Unlocked the Railroad', hint: 'Remove the boulder with a Steel Axe (after Summer 3, Year 1)' },
      { id: 'desert', label: 'Unlocked the Calico Desert', hint: 'Repair the bus (Vault or Joja)', auto: (f) => cap(f, mailAny(f, 'ccVault', 'jojaVault')) },
      { id: 'ginger', label: 'Unlocked Ginger Island', hint: 'Willy repaired the boat', auto: (f) => cap(f, mail(f, 'willyBoatFixed')) },
      { id: 'q-lost-axe', label: 'Completed Robin\'s Lost Axe', hint: 'Early story quest' },
      { id: 'q-museum', label: 'Met Gunther / Donated first artifact', hint: 'Museum story', auto: (f) => cap(f, f.artifacts.length > 0 || f.minerals.length > 0) },
      { id: 'q-wizard', label: 'Wizard\'s quest completed', hint: 'Cooperation with the Wizard' },
      { id: 'q-krobus', label: 'Met Krobus (Sewers)', hint: 'Rusty Key: donate 60 items to the Museum', auto: (f) => cap(f, f.flags.hasRustyKey) },
      { id: 'q-qi', label: 'Reached Mr. Qi\'s Club', hint: 'Club Card from Calico Desert', auto: (f) => cap(f, f.flags.hasClubCard) },
      { id: 'q-dark', label: 'Dark Talisman acquired', hint: 'Sewers door access', auto: (f) => cap(f, f.flags.hasDarkTalisman) },
    ] },
    { id: 'explore', title: 'Exploration', icon: '⛏️', color: '#8c7a6b', items: [
      { id: 'mines-enter', label: 'Entered the Mines', hint: 'Reach floor 1', auto: (f) => cap(f, f.deepestMine >= 1) },
      { id: 'mines-40', label: 'Reached Mines floor 40 (Frost Zone)', auto: (f) => cap(f, f.deepestMine >= 40) },
      { id: 'mines-80', label: 'Reached Mines floor 80 (Lava Zone)', auto: (f) => cap(f, f.deepestMine >= 80) },
      { id: 'mines-120', label: 'Reached the bottom of the Mines (120)', hint: 'Skull Key chest', auto: (f) => cap(f, f.deepestMine >= 120) },
      { id: 'skull-key', label: 'Obtained the Skull Key', auto: (f) => cap(f, f.flags.hasSkullKey) },
      { id: 'skull-explored', label: 'Explored Skull Cavern', auto: (f) => cap(f, f.skullDepth >= 1) },
      { id: 'skull-100', label: 'Reached Skull Cavern floor 100', auto: (f) => cap(f, f.skullDepth >= 100) },
      { id: 'skull-bottom', label: 'Reached Skull Cavern floor 200+', hint: '"Bottom" is endless; 200 is a common goal', auto: (f) => cap(f, f.skullDepth >= 200) },
      { id: 'island-explored', label: 'Explored Ginger Island', hint: 'Visited all four regions', },
      { id: 'volcano', label: 'Unlocked and explored the Volcano Dungeon', hint: 'Needs the Volcano bridge' },
      { id: 'sw-secret', label: 'Found the Secret Woods', auto: (f) => cap(f, f.flags.secretWoods) },
      { id: 'secrets-other', label: 'Discovered other secret locations', hint: 'Witch\'s Swamp, Wizard\'s Basement, Pirate Cove…' },
    ] },
    { id: 'collections', title: 'Collections', icon: '📚', color: '#a374d1', items: [
      { id: 'museum-artifacts', label: 'Museum: artifacts found', count: (f) => (f ? [inter(D.artifacts, f.artifacts), D.artifacts.length] : undefined), hint: 'Counts found, not necessarily donated' },
      { id: 'museum-minerals', label: 'Museum: minerals found', count: (f) => (f ? [inter(D.minerals, f.minerals), D.minerals.length] : undefined), hint: 'Counts found, not necessarily donated' },
      { id: 'fish', label: 'Fish caught', count: (f) => (f ? [inter(D.fish, f.fishCaught), D.fish.length] : undefined) },
      { id: 'cooking', label: 'Cooking recipes learned', count: (f) => (f ? [f.cookingKnown.length, 80] : undefined) },
      { id: 'crafting', label: 'Crafting recipes learned', count: (f) => (f ? [f.craftingKnown.length, 129] : undefined) },
      { id: 'shipping', label: 'Items shipped (types)', count: (f) => (f ? [f.shipped.length, 145] : undefined), hint: 'Approximate total' },
      { id: 'walnuts', label: 'Golden Walnuts found', count: (f) => (f ? [f.walnuts, 130] : undefined) },
      { id: 'stardrops', label: 'Stardrops', count: (f) => (f ? [['CF_Fair', 'CF_Mines', 'CF_Sewer', 'CF_Statue', 'CF_Spouse', 'CF_Fish', 'CF_Museum'].filter((k) => mail(f, k)).length, 7] : undefined) },
    ] },
    { id: 'relationships', title: 'Relationships', icon: '💕', color: '#e56fa0', items: [
      { id: 'friends5', label: '5+ hearts with 10 villagers', count: (f) => (f ? [Object.values(f.friend).filter((x) => x.points >= 1250).length, 10] : undefined) },
      { id: 'friends10', label: '10 hearts with 8 villagers', count: (f) => (f ? [Object.values(f.friend).filter((x) => x.points >= 2500).length, 8] : undefined) },
      { id: 'dating', label: 'Started dating someone', auto: (f) => cap(f, Object.values(f.friend).some((x) => /dating|engaged|married/i.test(x.status || '')) || !!f.spouse) },
      { id: 'married', label: 'Married', auto: (f) => cap(f, !!f.spouse) },
      { id: 'child1', label: 'Child #1', auto: (f) => cap(f, f.children >= 1) },
      { id: 'child2', label: 'Child #2', auto: (f) => cap(f, f.children >= 2) },
      { id: 'heart-events', label: 'Witnessed heart events', hint: 'Track per villager in the grid below' },
      { id: 'special', label: 'Special interactions (Krobus, Linus, Dwarf…)', hint: 'Manual' },
    ] },
    { id: 'farm', title: 'Farm Development', icon: '🏡', color: '#7bbf4e', items: [
      { id: 'coop', label: 'Built a Coop', auto: (f) => bld(f, 'Coop', 'Big Coop', 'Deluxe Coop') },
      { id: 'barn', label: 'Built a Barn', auto: (f) => bld(f, 'Barn', 'Big Barn', 'Deluxe Barn') },
      { id: 'deluxe', label: 'Deluxe Coop & Deluxe Barn', auto: (f) => (f ? bld(f, 'Deluxe Coop') && bld(f, 'Deluxe Barn') : undefined) },
      { id: 'silo', label: 'Built a Silo', auto: (f) => bld(f, 'Silo') },
      { id: 'well', label: 'Built a Well', auto: (f) => bld(f, 'Well') },
      { id: 'stable', label: 'Built a Stable', auto: (f) => bld(f, 'Stable') },
      { id: 'mill', label: 'Built a Mill', auto: (f) => bld(f, 'Mill') },
      { id: 'shed', label: 'Built a Shed', auto: (f) => bld(f, 'Shed', 'Big Shed') },
      { id: 'fishpond', label: 'Built a Fish Pond', auto: (f) => bld(f, 'Fish Pond') },
      { id: 'slime', label: 'Built a Slime Hutch', auto: (f) => bld(f, 'Slime Hutch') },
      { id: 'junimo', label: 'Built a Junimo Hut', auto: (f) => bld(f, 'Junimo Hut') },
      { id: 'obelisks', label: 'Built an Obelisk', auto: (f) => bld(f, 'Earth Obelisk', 'Water Obelisk', 'Desert Obelisk', 'Island Obelisk') },
      { id: 'house1', label: 'Farmhouse: Kitchen upgrade', auto: (f) => cap(f, f.houseLevel >= 1) },
      { id: 'house2', label: 'Farmhouse: Nursery upgrade', auto: (f) => cap(f, f.houseLevel >= 2) },
      { id: 'house3', label: 'Farmhouse: Cellar upgrade', auto: (f) => cap(f, f.houseLevel >= 3) },
      { id: 'tools-copper', label: 'All tools Copper+', auto: (f) => tool(f, 1) },
      { id: 'tools-steel', label: 'All tools Steel+', auto: (f) => tool(f, 2) },
      { id: 'tools-gold', label: 'All tools Gold+', auto: (f) => tool(f, 3) },
      { id: 'tools-iridium', label: 'All tools Iridium', auto: (f) => tool(f, 4) },
      { id: 'animals', label: 'Own at least one farm animal', auto: (f) => cap(f, f.animals.length > 0) },
      { id: 'greenhouse', label: 'Greenhouse restored', auto: (f) => cap(f, mailAny(f, 'ccPantry', 'jojaPantry')) },
      { id: 'skill-farming', label: 'Farming level 10', auto: (f) => skill(f, 'farming') },
      { id: 'skill-mining', label: 'Mining level 10', auto: (f) => skill(f, 'mining') },
      { id: 'skill-foraging', label: 'Foraging level 10', auto: (f) => skill(f, 'foraging') },
      { id: 'skill-fishing', label: 'Fishing level 10', auto: (f) => skill(f, 'fishing') },
      { id: 'skill-combat', label: 'Combat level 10', auto: (f) => skill(f, 'combat') },
    ] },
    { id: 'money', title: 'Wealth Milestones', icon: '💰', color: '#f0c43a', items: [
      { id: 'g15', label: 'Earned 15,000g (Greenhorn)', auto: (f) => cap(f, f.totalEarned >= 15000) },
      { id: 'g50', label: 'Earned 50,000g (Cowpoke)', auto: (f) => cap(f, f.totalEarned >= 50000) },
      { id: 'g250', label: 'Earned 250,000g (Homesteader)', auto: (f) => cap(f, f.totalEarned >= 250000) },
      { id: 'g1m', label: 'Earned 1,000,000g (Millionaire)', auto: (f) => cap(f, f.totalEarned >= 1000000) },
      { id: 'g10m', label: 'Earned 10,000,000g (Legend)', auto: (f) => cap(f, f.totalEarned >= 10000000) },
    ] },
  ];
  // Items per Community Center room that can be auto-detected
  D.ccRooms.forEach((r) => D.tracker[0].items.push({ id: 'cc-' + r.id, label: `Community Center: ${r.name} restored`, hint: r.reward, auto: (f) => cap(f, mailAny(f, r.flag, 'ccIsComplete')) }));
})();
