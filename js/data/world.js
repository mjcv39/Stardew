/* World: Community Center bundles, JojaMart, Mines, Skull Cavern, Ginger Island, buildings, farms. */
(function () {
  const D = SDV.data, slug = SDV.util.slug;
  const B = (room, name, items, need, reward, note = '') => ({ id: slug(room + '-' + name), room, name, items, need, reward, note, season: 'Any' });
  D.bundles = [
    B('Crafts Room', 'Spring Foraging', ['Wild Horseradish', 'Daffodil', 'Leek', 'Dandelion'], 4, 'Spring Seeds ×30'),
    B('Crafts Room', 'Summer Foraging', ['Grape', 'Spice Berry', 'Sweet Pea'], 3, 'Summer Seeds ×30'),
    B('Crafts Room', 'Fall Foraging', ['Common Mushroom', 'Wild Plum', 'Hazelnut', 'Blackberry'], 4, 'Fall Seeds ×30'),
    B('Crafts Room', 'Winter Foraging', ['Winter Root', 'Crystal Fruit', 'Snow Yam', 'Crocus'], 4, 'Winter Seeds ×30'),
    B('Crafts Room', 'Construction', ['Wood ×99', 'Wood ×99', 'Stone ×99', 'Hardwood ×10'], 4, 'Charcoal Kiln'),
    B('Crafts Room', 'Exotic Foraging', ['Coconut', 'Cactus Fruit', 'Cave Carrot', 'Red Mushroom', 'Purple Mushroom', 'Maple Syrup', 'Oak Resin', 'Pine Tar', 'Morel'], 5, 'Autumn\'s Bounty ×5'),
    B('Pantry', 'Spring Crops', ['Parsnip', 'Green Bean', 'Cauliflower', 'Potato'], 4, 'Speed-Gro ×20'),
    B('Pantry', 'Summer Crops', ['Tomato', 'Hot Pepper', 'Blueberry', 'Melon'], 4, 'Quality Sprinkler'),
    B('Pantry', 'Fall Crops', ['Corn', 'Eggplant', 'Pumpkin', 'Yam'], 4, 'Bee House'),
    B('Pantry', 'Quality Crops', ['Parsnip (gold)', 'Melon (gold)', 'Pumpkin (gold)', 'Corn (gold)'], 3, 'Preserves Jar'),
    B('Pantry', 'Animal', ['Large Milk', 'Large Egg (Brown)', 'Large Egg (White)', 'Large Goat Milk', 'Wool', 'Duck Egg'], 5, 'Cheese Press'),
    B('Pantry', 'Artisan', ['Truffle Oil', 'Cloth', 'Goat Cheese', 'Cheese', 'Honey', 'Jelly', 'Apple', 'Apricot', 'Orange', 'Peach', 'Pomegranate', 'Cherry'], 6, 'Keg'),
    B('Fish Tank', 'River Fish', ['Sunfish', 'Catfish', 'Shad', 'Tiger Trout'], 4, 'Bait ×30'),
    B('Fish Tank', 'Lake Fish', ['Largemouth Bass', 'Carp', 'Bullhead', 'Sturgeon'], 4, 'Dressed Spinner'),
    B('Fish Tank', 'Ocean Fish', ['Sardine', 'Tuna', 'Red Snapper', 'Tilapia'], 4, 'Warp Totem: Beach ×5'),
    B('Fish Tank', 'Night Fishing', ['Walleye', 'Bream', 'Eel'], 3, 'Small Glow Ring ×5'),
    B('Fish Tank', 'Specialty Fish', ['Pufferfish', 'Ghostfish', 'Sandfish', 'Woodskip'], 4, 'Dish O\' The Sea ×5'),
    B('Fish Tank', 'Crab Pot', ['Lobster', 'Crayfish', 'Crab', 'Cockle', 'Mussel', 'Shrimp', 'Snail', 'Periwinkle', 'Oyster', 'Clam'], 5, 'Crab Pot ×3'),
    B('Boiler Room', 'Blacksmith\'s', ['Copper Bar', 'Iron Bar', 'Gold Bar'], 3, 'Furnace'),
    B('Boiler Room', 'Geologist\'s', ['Quartz', 'Earth Crystal', 'Frozen Tear', 'Fire Quartz'], 4, 'Omni Geode ×5'),
    B('Boiler Room', 'Adventurer\'s', ['Slime ×99', 'Bat Wing ×10', 'Solar Essence', 'Void Essence'], 2, 'Lightning Rod ×3'),
    B('Bulletin Board', 'Chef\'s', ['Maple Syrup', 'Fiddlehead Fern', 'Truffle', 'Poppy', 'Maki Roll', 'Fried Egg'], 6, 'Pink Cake ×3'),
    B('Bulletin Board', 'Dye', ['Red Mushroom', 'Sea Urchin', 'Sunflower', 'Duck Feather', 'Aquamarine', 'Red Cabbage'], 6, 'Seed Maker'),
    B('Bulletin Board', 'Field Research', ['Purple Mushroom', 'Nautilus Shell', 'Chub', 'Frozen Geode'], 4, 'Recycling Machine'),
    B('Bulletin Board', 'Fodder', ['Wheat ×10', 'Hay ×10', 'Apple ×3'], 3, 'Heater'),
    B('Bulletin Board', 'Enchanter\'s', ['Oak Resin', 'Wine', 'Rabbit\'s Foot', 'Pomegranate'], 4, 'Gold Bar ×5'),
    B('Vault', '2,500g', ['2,500 Gold'], 1, 'Bus repair (part 1)'),
    B('Vault', '5,000g', ['5,000 Gold'], 1, 'Bus repair (part 2)'),
    B('Vault', '10,000g', ['10,000 Gold'], 1, 'Bus repair (part 3)'),
    B('Vault', '25,000g', ['25,000 Gold'], 1, 'Bus repair (part 4)'),
  ];
  D.ccRooms = [
    { id: 'crafts', name: 'Crafts Room', flag: 'ccCraftsRoom', reward: 'Bridge repair → Quarry (Quarry Mine)', bundles: 6 },
    { id: 'pantry', name: 'Pantry', flag: 'ccPantry', reward: 'Greenhouse restored', bundles: 6 },
    { id: 'fish', name: 'Fish Tank', flag: 'ccFishTank', reward: 'Glittering Boulder removed (Quarry route)', bundles: 6 },
    { id: 'boiler', name: 'Boiler Room', flag: 'ccBoilerRoom', reward: 'Minecarts activated', bundles: 3 },
    { id: 'bulletin', name: 'Bulletin Board', flag: 'ccBulletin', reward: 'Completes the room (Junimo celebration)', bundles: 5 },
    { id: 'vault', name: 'Vault', flag: 'ccVault', reward: 'Desert Bus repaired', bundles: 4 },
  ];
  D.joja = {
    cost: 'Membership 5,000g, then pay for each Community Development Form project',
    steps: [
      { name: 'Joja Membership', cost: 5000, reward: 'Required to buy the other projects' },
      { name: 'Bus Repair', cost: 40000, reward: 'Desert Bus to Calico Desert' },
      { name: 'Minecarts', cost: 15000, reward: 'Fast travel (Town/Bus/Quarry/Mines)' },
      { name: 'Panning', cost: 20000, reward: 'Copper Pan & Panning spots' },
      { name: 'Bridge Repair', cost: 25000, reward: 'Access to the Quarry' },
      { name: 'Greenhouse', cost: 35000, reward: 'Greenhouse ready on the farm' },
    ],
    note: 'Total: 140,000g including membership. Completing everything unlocks the Joja Movie Theater (instead of the Community Center Junimo Huts, Forgotten Dwarf Scrolls etc. remain).',
    notes2: ['You lose the Wizard\'s Junimo Hut / Obelisk build ability (Wizard builds after CC).', 'The Community Center becomes a Joja Warehouse.', 'Still counts towards the Perfection tracker as Joja (+ Movie Theater).'],
  };
  D.mines = {
    overview: 'The Mines have 120 floors. Elevator unlocks every 5 floors reached. Three zones: Earth (1–39), Frost (40–79), Lava (80–119). Floor 120 has the Skull Key chest.',
    zones: [
      { name: 'Earth Zone', floors: '1–39', monsters: 'Green Slime, Rock Crab, Duggy, Bug, Grub, Dust Spirit', ores: 'Copper, Geodes, Quartz, Earth Crystal' },
      { name: 'Frost Zone', floors: '40–79', monsters: 'Frost Jelly, Ghost, Skeleton, Frost Bat, Dust Spirit', ores: 'Iron, Frozen Geode, Frozen Tear' },
      { name: 'Lava Zone', floors: '80–119', monsters: 'Red Sludge, Shadow Brute, Shadow Shaman, Lava Bat, Metal Head, Squid Kid', ores: 'Gold, Iridium (floors 100+), Magma Geode' },
    ],
    milestones: [
      { floor: 5, reward: 'Elevator unlocks at every 5th floor you reach' }, { floor: 40, reward: 'Frost Zone begins' }, { floor: 80, reward: 'Lava Zone begins (Iridium appears from floor 100)' },
      { floor: 100, reward: 'Treasure room with a Stardrop chest' }, { floor: 120, reward: 'Bottom: Skull Key chest — Skull Cavern unlocks' },
    ],
  };
  D.skull = {
    overview: 'Skull Cavern is a procedurally generated endless dungeon in the Calico Desert (needs the Skull Key from Mines floor 120). Energy / health do not carry over; bring bombs and food.',
    tips: ['Floor 100 grants the Skull Key quest (Floor 100 achievement)', 'Iridium nodes appear below floor ~50.', 'Mystic Stone and Omni Geodes drop in chests deeper.', 'Mummies need to be bombed first; Serpents fly.'],
    milestone: [{ floor: 25, reward: 'Treasure & Staircases' }, { floor: 50, reward: 'Iridium Bats' }, { floor: 100, reward: 'Iridium ores and a possible Prismatic Shard' }, { floor: 200, reward: 'Mine deeper!' }],
  };
  D.skull.tips[0] = 'Reaching floor 100 is a common milestone goal; each floor deeper gets more dangerous.';
  D.ginger = {
    unlock: 'After the Community Center or JojaMart completion, Willy repairs the boat for Hardwood ×200, Iridium Bar ×5, Battery Pack ×5. Then board at Willy\'s Beach boat.',
    areas: [
      { name: 'Island South (Landing)', info: 'Willy\'s boat dock, Island Farm teleport.' },
      { name: 'Island North', info: 'Volcano Dungeon entrance, Dig Site, Field Office.' },
      { name: 'Island West', info: 'Farm cabin, Island Farm obelisk.' },
      { name: 'Island East', info: 'Leo\'s hut, Parrot Express.' },
      { name: 'Pirate Cove', info: 'Pirate Cove, Gem Birds, hidden NPC encounter.' },
      { name: 'Volcano Dungeon', info: '10 floors; Dwarvish Sentry & Magma Sprites; forge to craft Lava Katana etc.' },
    ],
    walnuts: { total: 130, tip: 'Golden Walnuts are required for Parrot Express stops, Qi\'s Walnut Room (Qi Gems), the Island Farm obelisk, and Perfection (+5%).' },
    parrot: ['Parrot Express stops (Island West, Dig Site, Volcano)', 'Qi\'s Walnut Room', 'Island Farmhouse'],
  };
  const Bd = (name, cost, mats, notes) => ({ id: slug(name), name, cost, mats, notes });
  D.buildings = [
    Bd('Coop', 4000, '300 Wood, 100 Stone', 'Holds 4 chickens. Upgrades: Big Coop / Deluxe Coop.'), Bd('Big Coop', 10000, '400 Wood, 150 Stone', 'Holds 8; adds Ducks, Rabbits (Deluxe).'),
    Bd('Deluxe Coop', 20000, '500 Wood, 200 Stone', 'Holds 12; autofeed, Rabbits.'), Bd('Barn', 6000, '350 Wood, 150 Stone', 'Holds 4 cows.'),
    Bd('Big Barn', 12000, '450 Wood, 200 Stone', 'Holds 8; adds Goats.'), Bd('Deluxe Barn', 25000, '550 Wood, 300 Stone', 'Holds 12; adds Sheep/Pigs.'),
    Bd('Well', 1000, '75 Stone', 'Refill watering can.'), Bd('Silo', 100, '100 Stone, 10 Clay, 5 Copper Bar', 'Stores 240 hay.'),
    Bd('Stable', 10000, '100 Hardwood', 'Horse.'), Bd('Mill', 2500, '50 Stone, 150 Wood, 4 Cloth', 'Grinds Wheat, Beets, Rice.'),
    Bd('Shed', 15000, '300 Wood', 'Place machines. Big Shed 20,000g.'), Bd('Fish Pond', 5000, '100 Stone, 5 Seaweed, 5 Green Algae', 'Breed fish; ponds produce roe.'),
    Bd('Slime Hutch', 10000, '500 Stone, 10 Refined Quartz, 1 Iridium Bar', 'Raise slimes.'), Bd('Junimo Hut', 20000, '200 Stone, 9 Starfruit, 100 Fiber', 'Auto-harvest; Wizard (after CC).'),
    Bd('Earth Obelisk', 500000, '10 Iridium Bar, 10 Earth Crystal', 'Warp to Mountain; Wizard.'), Bd('Water Obelisk', 500000, '5 Iridium Bar, 10 Clam, 10 Coral', 'Warp to Beach.'),
    Bd('Desert Obelisk', 1000000, '20 Iridium Bar, 10 Coconut, 10 Cactus Fruit', 'Warp to Desert.'), Bd('Island Obelisk', 1000000, '10 Dragon Tooth, 10 Iridium Bar, 10 Banana', 'Warp to Ginger Island.'),
    Bd('Gold Clock', 10000000, '—', 'Prevents Debris; completion-required for Perfection.'),
    Bd('Farmhouse: Kitchen (Upgrade 1)', 10000, '450 Wood', 'Kitchen & fridge; required for cooking.'), Bd('Farmhouse: Nursery (Upgrade 2)', 65000, '100 Hardwood', 'Allows children and spouse bedrooms.'), Bd('Farmhouse: Cellar (Upgrade 3)', 100000, '—', 'Cellar for aging casks.'),
  ];
  D.farmTypes = [
    { id: 'standard', name: 'Standard Farm', info: 'Largest farm. Plenty of space, no special perks.' }, { id: 'riverland', name: 'Riverland Farm', info: 'Lots of water; fishing on the farm; less farmland.' },
    { id: 'forest', name: 'Forest Farm', info: 'Foraging bonus; wood grows. Smaller farmland.' }, { id: 'hilltop', name: 'Hill-top Farm', info: 'Mining on the farm: Ore on farmland. Combat on farm.' },
    { id: 'wilderness', name: 'Wilderness Farm', info: 'Monsters spawn at night; combat bonus.' }, { id: 'fourcorners', name: 'Four Corners Farm', info: 'Four-quadrant layout, ideal for co-op.' }, { id: 'beach', name: 'Beach Farm', info: 'Sand & ocean on the farm.' },
  ];
  D.areas = [
    { id: 'the-mines', name: 'The Mines', info: D.mines.overview, kind: 'Dungeon' },
    { id: 'skull-cavern', name: 'Skull Cavern', info: D.skull.overview, kind: 'Dungeon' },
    { id: 'ginger-island', name: 'Ginger Island', info: D.ginger.unlock, kind: 'Island' },
    { id: 'community-center', name: 'Community Center', info: 'Complete bundles for rewards. Six rooms: Crafts, Pantry, Fish Tank, Boiler, Bulletin, Vault.', kind: 'Story' },
    { id: 'jojamart', name: 'JojaMart route', info: D.joja.note, kind: 'Story' },
    { id: 'secret-woods', name: 'Secret Woods', info: 'Reached with Steel Axe through the Cindersap Forest log. Hardwood, Morel, Fiddlehead Fern.', kind: 'Area' },
    { id: 'sewers', name: 'The Sewers', info: 'Krobus lives here. Requires Rusty Key.', kind: 'Area' },
    { id: 'quarry', name: 'The Quarry', info: 'Reached after bridge repair. Quarry Mine on Mountain.', kind: 'Area' },
    { id: 'calico-desert', name: 'Calico Desert', info: 'Via Bus after repair. Sandy\'s Oasis; Skull Cavern entrance.', kind: 'Area' },
    { id: 'witches-swamp', name: 'Witch\'s Swamp', info: 'Accessible after the Dark Talisman events. Void Salmon can be fished here.', kind: 'Area' },
    { id: 'mutant-bug-lair', name: 'Mutant Bug Lair', info: 'Hidden area beyond the Sewers; the Dark Talisman is found here.', kind: 'Area' },
    { id: 'volcano-dungeon', name: 'Volcano Dungeon', info: '10-floor Ginger Island dungeon; Dwarvish Sentries and Magma Sprites; forge weapons.', kind: 'Dungeon' },
  ];
})();
