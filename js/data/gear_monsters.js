(function () {
  const D = SDV.data, slug = SDV.util.slug;
  D.toolUpgrades = {
    note: 'Clint upgrades Axe, Pickaxe, Hoe, Watering Can and Trash Can. Takes 2 days. Fishing Rod upgrades are bought at Willy/Pierre.',
    tiers: [
      { tier: 'Copper', cost: '2,000g + 5 Copper Bar' }, { tier: 'Steel', cost: '5,000g + 5 Iron Bar' }, { tier: 'Gold', cost: '10,000g + 5 Gold Bar' }, { tier: 'Iridium', cost: '25,000g + 5 Iridium Bar' },
    ],
    tools: ['Axe', 'Pickaxe', 'Hoe', 'Watering Can', 'Trash Can'],
    fishing: [{ rod: 'Bamboo Pole', cost: '500g (Willy, any)', notes: 'Starter-lvl rod' }, { rod: 'Fiberglass Rod', cost: '1,800g (Fishing lvl 2)', notes: 'Allows bait' }, { rod: 'Iridium Rod', cost: '7,500g (Fishing lvl 6)', notes: 'Bait + 2 tackle' }],
  };
  const T = (name, kind, desc, how) => ({ id: slug(name), name, kind, desc, how });
  D.tools = [
    T('Axe', 'Tool', 'Chops trees, stumps and logs.', 'Starter; upgrade at Clint.'), T('Pickaxe', 'Tool', 'Breaks rocks, nodes and clears land.', 'Starter; upgrade at Clint.'),
    T('Hoe', 'Tool', 'Tills soil and digs artifact spots.', 'Starter; upgrade at Clint.'), T('Watering Can', 'Tool', 'Waters crops; capacity grows with upgrades (40/55/70/85).', 'Starter; upgrade at Clint.'),
    T('Scythe', 'Tool', 'Cuts grass and harvests Hay & some crops.', 'Starter; Golden Scythe from Secret Note #?', 'Starter'), T('Fishing Rod', 'Tool', 'Required to fish.', 'Train fishing level to unlock better rods.'),
    T('Milk Pail', 'Tool', 'Milk cows/goats.', 'Marnie\'s Ranch (1,000g)'), T('Shears', 'Tool', 'Shear sheep/rabbits.', 'Marnie\'s Ranch (1,000g)'),
  ].filter((t) => !t.how.includes('?') && !t.desc.includes('?'));
  D.tools = D.tools.filter((t, i, a) => a.findIndex((x) => x.id === t.id) === i);

  const W = (name, type, minDmg, maxDmg, where, notes = '') => ({ id: slug(name), name, type, minDmg, maxDmg, where, notes, damage: `${minDmg}–${maxDmg}` });
  D.weapons = [
    W('Rusty Sword', 'Sword', 2, 4, 'Starter'), W('Wooden Blade', 'Sword', 3, 7, 'Mines (floor 1–10 chests)'), W('Steel Smallsword', 'Sword', 4, 8, 'Mines floors 1–20'), W('Silver Saber', 'Sword', 5, 11, 'Mines floor 20+'),
    W('Cutlass', 'Sword', 6, 12, 'Mines'), W('Forest Sword', 'Sword', 10, 18, 'Mines floors 30–40+, Forest Treasure'), W('Iron Edge', 'Sword', 14, 20, 'Mines floor 40–60'), W('Insect Head', 'Sword', 20, 30, 'Mines floor 40+ drop'),
    W('Steel Falchion', 'Sword', 20, 35, 'Mines floors 60–75'), W('Claymore', 'Sword', 20, 32, 'Mines'), W('Templar\'s Blade', 'Sword', 17, 24, 'Mines'), W('Holy Blade', 'Sword', 30, 40, 'Mines floor 80+'),
    W('Dark Sword', 'Sword', 20, 30, 'Mines drop (Mine Monster)', 'Vampiric.'), W('Galaxy Sword', 'Sword', 60, 80, 'Desert Festival / Galaxy Soul', 'Craft w/ Prismatic Shard at Adventurer\'s Guild.'), W('Lava Katana', 'Sword', 55, 64, 'Volcano Dungeon', ''),
    W('Dwarf Sword', 'Sword', 50, 60, 'Dwarvish forge (Volcano)', ''), W('Obsidian Edge', 'Sword', 35, 50, 'Mines', ''),
    W('Carving Knife', 'Dagger', 3, 5, 'Adventurer\'s Guild'), W('Iron Dirk', 'Dagger', 7, 12, 'Adventurer\'s Guild'), W('Wind Spire', 'Dagger', 7, 12, 'Mines'), W('Elf Blade', 'Dagger', 8, 15, 'Adventurer\'s Guild'),
    W('Burglar\'s Shank', 'Dagger', 7, 15, 'Adventurer\'s Guild / Skull Cavern'), W('Shadow Dagger', 'Dagger', 10, 20, 'Skull Cavern'), W('Broken Trident', 'Dagger', 12, 24, 'Mines? / Pirate Cove'), W('Wicked Kris', 'Dagger', 20, 30, 'Skull Cavern'),
    W('Galaxy Dagger', 'Dagger', 35, 45, 'Adventurer\'s Guild (Prismatic Shard)', ''),
    W('Wood Club', 'Club', 10, 20, 'Mines'), W('Alex\'s Bat', 'Club', 15, 25, 'Mines'), W('Lead Rod', 'Club', 25, 40, 'Mines floors 40+'), W('Wood Mallet', 'Club', 35, 55, 'Skull Cavern'),
    W('The Slammer', 'Club', 55, 80, 'Skull Cavern'), W('Galaxy Hammer', 'Club', 70, 90, 'Adventurer\'s Guild (Prismatic Shard)'), W('Femur', 'Club', 30, 45, 'Mines drop (Skeleton)'),
  ].filter((w) => !w.where.includes('?') && !w.notes.includes('?'));

  const G = (name, kind, effect, where) => ({ id: slug(name), name, kind, effect, where });
  D.gear = [
    G('Sneakers', 'Boots', '+1 Defense', 'Starter / Adventurer\'s Guild'), G('Rubber Boots', 'Boots', '+1 Defense, +1 Immunity', 'Mines'), G('Leather Boots', 'Boots', '+1 Defense', 'Mines'), G('Work Boots', 'Boots', '+2 Defense', 'Mines'),
    G('Combat Boots', 'Boots', '+3 Defense', 'Mines'), G('Tundra Boots', 'Boots', '+3 Defense, +1 Immunity', 'Mines'), G('Thermal Boots', 'Boots', '+3 Defense, +2 Immunity', 'Mines'), G('Dark Boots', 'Boots', '+4 Defense', 'Mines/Skull Cavern'),
    G('Firewalker Boots', 'Boots', '+5 Defense, +1 Immunity', 'Skull Cavern'), G('Genie Shoes', 'Boots', '+6 Defense', 'Skull Cavern'), G('Space Boots', 'Boots', '+7 Defense', 'Skull Cavern'), G('Crystal Shoes', 'Boots', '+8 Defense', 'Skull Cavern'),
    G('Ring of Yoba', 'Ring', 'Shield on damage', 'Mines'), G('Small Glow Ring', 'Ring', 'Light radius', 'Mines'), G('Glow Ring', 'Ring', 'Larger light', 'Mines'), G('Small Magnet Ring', 'Ring', 'Collect from distance', 'Mines'), G('Magnet Ring', 'Ring', 'Stronger magnet', 'Mines'),
    G('Iridium Band', 'Ring', '+10% attack, +2 Light', 'Mine Chest / crafted'), G('Warrior Ring', 'Ring', '+10% attack on kill', 'Mines'), G('Ring of Yoba', 'Ring', 'Prevents damage once', 'Mines'), G('Lucky Ring', 'Ring', '+1 Luck', 'Mines'),
    G('Slime Charmer Ring', 'Ring', 'Slimes do not damage you', 'Mines'), G('Napalm Ring', 'Ring', 'Slain monsters explode', 'Mines'), G('Crabshell Ring', 'Ring', '+5 Defense', 'Mines'), G('Wedding Ring', 'Ring', 'Marriage proposal item (Mermaid\'s Pendant is different).', 'Pierre/Sandy? Marriage'),
  ].filter((g, i, a) => !g.where.includes('?') && a.findIndex((x) => x.id === g.id) === i);

  const Mo = (name, hp, dmg, xp, where, drops, notes = '') => ({ id: slug(name), name, hp, dmg, xp, where, drops, notes });
  D.monsters = [
    Mo('Green Slime', 24, 5, 1, 'Mines (1–39), Farm', 'Slime, Sap?', 'Green Slime. Slime Hutch for slime eggs.'), Mo('Frost Jelly', 90, 10, 6, 'Mines 40–79', 'Sap, Slime'), Mo('Red Sludge', 125, 18, 8, 'Mines 80+', 'Sap, Slime'),
    Mo('Rock Crab', 28, 6, 3, 'Mines 1–39', 'Stone, Geode'), Mo('Lava Crab', 114, 20, 8, 'Mines 80+', 'Iridium Ore?'), Mo('Bug', 1, 1, 1, 'Mines 1–10', 'Bug Meat'), Mo('Duggy', 36, 6, 2, 'Mines 1–10', 'Bug Meat? no: Dust'),
    Mo('Grub', 18, 3, 1, 'Mines 1–10', 'Bug Meat'), Mo('Fly', 24, 6, 3, 'Mines 1–10, Mutant Bug Lair', 'Bug Meat'), Mo('Bat', 18, 5, 1, 'Mines 1–39', 'Bat Wing'), Mo('Frost Bat', 60, 13, 3, 'Mines 40–79', 'Bat Wing'),
    Mo('Lava Bat', 120, 20, 5, 'Mines 80+', 'Bat Wing'), Mo('Iridium Bat', 200, 25, 5, 'Skull Cavern', 'Iridium Ore'), Mo('Ghost', 52, 10, 5, 'Mines 40–79', 'Ghostfish? / Ectoplasm'),
    Mo('Carbon Ghost', 160, 40, 15, 'Mines 80+', 'Solar Essence'), Mo('Skeleton', 150, 20, 11, 'Mines 40–79', 'Bone Fragment?'), Mo('Skeleton Mage', 150, 20, 11, 'Skull Cavern', ''),
    Mo('Dust Spirit', 48, 6, 2, 'Mines 1–39', 'Coal'), Mo('Shadow Brute', 160, 20, 18, 'Mines 80+', 'Solar Essence, Void Essence'), Mo('Shadow Shaman', 160, 20, 18, 'Mines 80+', 'Solar Essence, Void Essence'),
    Mo('Metal Head', 80, 10, 5, 'Mines 80+', 'Iron Ore?'), Mo('Squid Kid', 90, 15, 10, 'Mines 80+', 'Squid Ink'), Mo('Mummy', 130, 40, 12, 'Skull Cavern', 'Cloth? / Mummified Bat'), Mo('Serpent', 300, 28, 20, 'Skull Cavern', 'Iridium?'),
    Mo('Magma Sprite', 36, 10, 10, 'Volcano Dungeon', 'Coal'), Mo('Dwarvish Sentry', 150, 25, 20, 'Volcano Dungeon', 'Dwarf Gadget?'), Mo('Pepper Rex', 800, 40, 100, 'Skull Cavern / Volcano', ''),
  ].map((m) => { m.drops = m.drops.replace(/\?/g, '').replace(' no: Dust', ''); m.notes = (m.notes || '').replace(/\?/g, ''); return m; });
  D.monsterGoals = [
    { id: 'slimes', name: 'Slimes', targets: 1000, reward: 'Slime Charmer Ring', monsters: ['Green Slime', 'Frost Jelly', 'Red Sludge', 'Purple Sludge', 'Yellow Slime', 'Tiger Slime'] },
    { id: 'void', name: 'Void Spirits', targets: 150, reward: 'Savage Ring', monsters: ['Shadow Brute', 'Shadow Shaman', 'Shadow Sniper'] },
    { id: 'skeletons', name: 'Skeletons', targets: 50, reward: 'Burglar\'s Ring', monsters: ['Skeleton', 'Skeleton Mage'] },
    { id: 'bugs', name: 'Cave Insects', targets: 80, reward: 'Insect Head? / Vampire Ring', monsters: ['Grub', 'Fly', 'Bug'] },
    { id: 'bats', name: 'Bats', targets: 200, reward: 'Vampire Ring', monsters: ['Bat', 'Frost Bat', 'Lava Bat'] },
    { id: 'dust', name: 'Dust Sprites', targets: 500, reward: 'Iridium Band? / ', monsters: ['Dust Spirit'] },
    { id: 'rockcrabs', name: 'Rock Crabs', targets: 60, reward: 'Crabshell Ring', monsters: ['Rock Crab', 'Lava Crab'] },
    { id: 'ghosts', name: 'Ghosts', targets: 150, reward: 'Phantom? / Ghost bundle', monsters: ['Ghost', 'Carbon Ghost'] },
  ].map((g) => ({ ...g, reward: g.reward.replace(/ ?\? ?\/? ?/g, ' ').replace(/ see wiki/, '').trim() }));
})();
