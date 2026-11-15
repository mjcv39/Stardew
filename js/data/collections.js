/* Minerals, geodes, artifacts, with in-game item IDs (used for museum detection from saves). */
(function () {
  const D = SDV.data, slug = SDV.util.slug;
  const M = (itemId, name, price, where, kind = 'Mineral') => ({ id: slug(name), itemId, name, price, where, kind });
  D.minerals = [
    M(80, 'Quartz', 25, 'Mines, Foraged (Mines), Gem nodes'), M(86, 'Earth Crystal', 50, 'Mines (floors 1–39), Geodes'), M(84, 'Frozen Tear', 75, 'Mines (floors 40–79), Frozen Geodes'), M(82, 'Fire Quartz', 100, 'Mines (floors 80+), Magma Geodes'),
    M(60, 'Emerald', 250, 'Mines, Skull Cavern, Gem nodes', 'Gem'), M(62, 'Aquamarine', 180, 'Mines, Gem nodes', 'Gem'), M(64, 'Ruby', 250, 'Mines, Gem nodes', 'Gem'), M(66, 'Amethyst', 100, 'Mines, Gem nodes', 'Gem'),
    M(68, 'Topaz', 80, 'Mines, Gem nodes', 'Gem'), M(70, 'Jade', 200, 'Mines, Gem nodes', 'Gem'), M(72, 'Diamond', 750, 'Mines (floors 80+), Skull Cavern', 'Gem'), M(74, 'Prismatic Shard', 2000, 'Skull Cavern, Rare drops', 'Gem'),
    M(538, 'Alamite', 150, 'Geode'), M(539, 'Bixite', 300, 'Magma Geode / Omni'), M(540, 'Baryte', 50, 'Geode'), M(541, 'Aerinite', 125, 'Frozen Geode / Omni'), M(542, 'Calcite', 75, 'Geode'),
    M(543, 'Dolomite', 300, 'Magma Geode / Omni'), M(544, 'Esperite', 100, 'Frozen Geode'), M(545, 'Fluorapatite', 200, 'Frozen Geode'), M(546, 'Geminite', 150, 'Frozen Geode'), M(547, 'Helvite', 450, 'Magma Geode'),
    M(548, 'Jamborite', 150, 'Geode'), M(549, 'Jagoite', 115, 'Geode'), M(550, 'Kyanite', 250, 'Magma Geode'), M(551, 'Lunarite', 200, 'Frozen Geode'), M(552, 'Malachite', 100, 'Geode'),
    M(553, 'Neptunite', 400, 'Magma Geode'), M(554, 'Lemon Stone', 200, 'Magma Geode'), M(555, 'Nekoite', 80, 'Geode'), M(556, 'Orpiment', 80, 'Geode'), M(557, 'Petrified Slime', 120, 'Slime Hutch / Geode'),
    M(558, 'Thunder Egg', 100, 'Geode'), M(559, 'Pyrite', 120, 'Frozen Geode'), M(560, 'Ocean Stone', 150, 'Geode'), M(561, 'Ghost Crystal', 200, 'Frozen Geode (Ghost-drop)'), M(562, 'Tigerseye', 275, 'Magma Geode'),
    M(563, 'Jasper', 150, 'Magma Geode'), M(564, 'Opal', 150, 'Frozen Geode'), M(565, 'Fire Opal', 350, 'Magma Geode'), M(566, 'Celestine', 125, 'Geode'), M(567, 'Marble', 110, 'Frozen Geode'),
    M(568, 'Sandstone', 60, 'Geode'), M(569, 'Granite', 75, 'Geode'), M(570, 'Basalt', 175, 'Magma Geode'), M(571, 'Limestone', 15, 'Geode'), M(572, 'Soapstone', 120, 'Frozen Geode'),
    M(573, 'Hematite', 150, 'Frozen Geode'), M(574, 'Mudstone', 25, 'Geode'), M(575, 'Obsidian', 200, 'Magma Geode'), M(576, 'Slate', 85, 'Geode'), M(577, 'Fairy Stone', 250, 'Frozen Geode'), M(578, 'Star Shards', 500, 'Magma Geode'),
  ];
  D.geodes = [
    { id: 'geode', name: 'Geode', price: 50, where: 'Mines floors 1–39, Clint', yields: 'Quartz, Earth Crystal, Limestone, Calcite, Pyrite? see wiki', cost: '25g to crack' },
    { id: 'frozen-geode', name: 'Frozen Geode', price: 100, where: 'Mines floors 40–79', yields: 'Frozen Tear, Aerinite, Esperite, Fluorapatite, Geminite…', cost: '25g to crack' },
    { id: 'magma-geode', name: 'Magma Geode', price: 150, where: 'Mines floors 80+, Skull Cavern', yields: 'Fire Quartz, Bixite, Dolomite, Helvite, Kyanite, Lemon Stone…', cost: '25g to crack' },
    { id: 'omni-geode', name: 'Omni Geode', price: 0, where: 'Skull Cavern, Treasure chests', yields: 'Any mineral (even Prismatic Shard rarely)', cost: '25g to crack' },
    { id: 'artifact-trove', name: 'Artifact Trove', price: 0, where: 'Artifact spots', yields: 'Random artifacts', cost: 'Clint' },
  ];
  const A = (itemId, name, price, where) => ({ id: slug(name), itemId, name, price, where, kind: 'Artifact' });
  D.artifacts = [
    A(96, 'Dwarf Scroll I', 100, 'Mines 1-39 / Artifact spots'), A(97, 'Dwarf Scroll II', 100, 'Mines'), A(98, 'Dwarf Scroll III', 100, 'Mines'), A(99, 'Dwarf Scroll IV', 100, 'Mines'),
    A(100, 'Chipped Amphora', 40, 'Town (artifact spots), Fishing'), A(101, 'Arrowhead', 40, 'Cindersap Forest, Mountain, Town'), A(103, 'Ancient Doll', 60, 'Town, Fishing'),
    A(104, 'Elvish Jewelry', 200, 'Forest, Fishing'), A(105, 'Chewing Stick', 50, 'Town, Fishing'), A(106, 'Ornamental Fan', 300, 'Town, Fishing'), A(107, 'Dinosaur Egg', 350, 'Desert, Mountain'),
    A(108, 'Rare Disc', 300, 'Town, Fishing (Mines monsters)'), A(109, 'Ancient Sword', 100, 'Forest, Mountain'), A(110, 'Rusty Spoon', 25, 'Town, Mountain'), A(111, 'Rusty Spur', 25, 'Town, Forest'),
    A(112, 'Rusty Cog', 25, 'Town, Mountain'), A(113, 'Chicken Statue', 50, 'Farm, Forest'), A(114, 'Ancient Seed', 5, 'Artifact spots'), A(115, 'Prehistoric Tool', 100, 'Mountain, Forest'),
    A(116, 'Dried Starfish', 40, 'Beach, Fishing'), A(117, 'Anchor', 100, 'Beach, Fishing'), A(118, 'Glass Shards', 30, 'Beach, Fishing'), A(119, 'Bone Flute', 100, 'Forest, Fishing'),
    A(120, 'Prehistoric Handaxe', 50, 'Mountain, Forest'), A(121, 'Dwarvish Helm', 100, 'Mines'), A(122, 'Dwarf Gadget', 200, 'Mines, Skull Cavern'), A(123, 'Ancient Drum', 100, 'Forest, Fishing'),
    A(124, 'Golden Mask', 500, 'Desert'), A(125, 'Golden Relic', 250, 'Desert'), A(126, 'Strange Doll (green)', 1000, 'Desert, Traveling Cart'), A(127, 'Strange Doll', 1000, 'Desert, Traveling Cart'),
    A(579, 'Prehistoric Scapula', 100, 'Mountain, Artifact spot'), A(580, 'Prehistoric Tibia', 100, 'Mountain'), A(581, 'Prehistoric Skull', 100, 'Mountain'), A(582, 'Skeletal Hand', 100, 'Mountain'),
    A(583, 'Prehistoric Rib', 100, 'Mountain'), A(584, 'Prehistoric Vertebra', 100, 'Mountain'), A(585, 'Skeletal Tail', 100, 'Mountain'), A(586, 'Nautilus Fossil', 80, 'Beach (Fossil node)'),
    A(587, 'Amphibian Fossil', 150, 'Fossil node'), A(588, 'Palm Fossil', 80, 'Fossil node'), A(589, 'Trilobite', 80, 'Fossil node'),
    A(695, 'Ancient Seed (Pack)?', 0, '—'),
  ].filter((a) => !a.name.includes('?'));
  D.minerals.forEach((m) => (m.season = 'Any'));
  D.geodes.forEach((g) => (g.yields = g.yields.replace(', Pyrite? see wiki', '').replace('…', ' …')));
})();
