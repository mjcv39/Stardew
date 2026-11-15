(function () {
  const D = SDV.data, slug = SDV.util.slug;
  const Fe = (name, season, days, time, where, notes, tips = '') => ({ id: slug(name), name, season, days, day: days[0], time, where, notes, tips });
  D.festivals = [
    Fe('Egg Festival', 'Spring', [13], '9am–2pm', 'Town', 'Egg hunt with Lewis. Strawberry Seeds (100g) are sold here.', 'Strawberry seeds are only sold at this festival — plan your spring around it.'),
    Fe('Desert Festival', 'Spring', [15, 16, 17], 'All day (3 days)', 'Calico Desert', 'Three-day festival with Calico Eggs, a Calico Egg Rating game and desert merchants.', 'Bring plenty of gold and ingredients for the shops.'),
    Fe('Flower Dance', 'Spring', [24], '9am–2pm', 'Cindersap Forest', 'Dance with a villager (you need 4+ hearts to be asked / to ask).', 'Ask your favourite villager early in the morning.'),
    Fe('Luau', 'Summer', [11], '9am–2pm', 'Beach', 'Add one ingredient to the community soup; the Governor reacts to its quality.', 'A high-quality item (iridium) earns the best reaction and friendship.'),
    Fe('Trout Derby', 'Summer', [20, 21], '9am–2pm', 'Cindersap Forest (Fishing)', 'Catch Rainbow Trout, turn them in to Willy for tickets/prizes.', ''),
    Fe('Dance of the Moonlight Jellies', 'Summer', [28], '10pm–12am', 'Beach', 'Watch the jellies migrate past the beach.', 'Attend from the beach docks.'),
    Fe('Stardew Valley Fair', 'Fall', [16], '9am–3pm', 'Town', 'Earn Star Tokens from minigames and the Grange Display; buy prizes.', 'Save your tokens: a Stardrop costs 2,000 Star Tokens.'),
    Fe('Spirit\'s Eve', 'Fall', [27], '10pm–11:50pm', 'Town', 'Haunted maze with a Golden Pumpkin at the end.', ''),
    Fe('Festival of Ice', 'Winter', [8], '9am–2pm', 'Cindersap Forest (frozen lake)', 'Ice fishing contest in the forest lake.', ''),
    Fe('SquidFest', 'Winter', [12, 13], '6am–2pm', 'Beach', 'Squid fishing contest over two days.', ''),
    Fe('Night Market', 'Winter', [15, 16, 17], '5pm–2am', 'Beach', 'Night shop with submarine fishing and a mermaid show.', 'Submarine offers fish like Blobfish, Midnight Squid and Spook Fish.'),
    Fe('Feast of the Winter Star', 'Winter', [25], '9am–2pm', 'Town', 'Secret Santa gift exchange with a random villager.', 'Check what your assigned villager likes beforehand.'),
  ];
  D.seasonNotes = {
    Spring: 'Crops die at the end of Spring unless harvested. Salmonberries appear Spring 15–18.',
    Summer: 'Long-growing crops like Starfruit, Melon and Blueberry thrive. Watch for thunderstorms.',
    Fall: 'Pumpkin, Yam and Cranberries. Blackberries appear Fall 8–11.',
    Winter: 'No outdoor crops (except Winter Seeds). Good time for mining, fishing and planning.',
  };
  D.specialDays = [
    { season: 'Spring', day: 1, text: 'New season: Spring crops available.' },
    { season: 'Spring', day: 28, text: 'Last chance to harvest Spring crops (they die at midnight).' },
    { season: 'Summer', day: 1, text: 'Summer begins; dead Spring crops are removed.' },
    { season: 'Summer', day: 28, text: 'Last chance to harvest Summer crops.' },
    { season: 'Fall', day: 1, text: 'Fall begins.' },
    { season: 'Fall', day: 28, text: 'Last chance to harvest Fall crops. Plan the Greenhouse or Winter crops.' },
    { season: 'Winter', day: 1, text: 'Winter begins. Mine and fish.' },
    { season: 'Winter', day: 28, text: 'Year ends. Year 2 starts (Kent returns, new shop stock).' },
  ];

  const Ac = (name, desc, cat) => ({ id: slug(name), name, desc, cat });
  D.achievements = [
    Ac('Greenhorn', 'Earn 15,000g.', 'Money'), Ac('Cowpoke', 'Earn 50,000g.', 'Money'), Ac('Homesteader', 'Earn 250,000g.', 'Money'), Ac('Millionaire', 'Earn 1,000,000g.', 'Money'), Ac('Legend', 'Earn 10,000,000g.', 'Money'),
    Ac('A Complete Collection', 'Complete the Museum collection.', 'Collection'), Ac('Treasure Trove', 'Donate 40 items to the Museum.', 'Collection'),
    Ac('Full House', 'Get married and have two children.', 'Social'), Ac('Best Friends', 'Reach max friendship with one villager.', 'Social'), Ac('The Beloved Farmer', 'Reach max friendship with everyone.', 'Social'),
    Ac('Popular', 'Reach 5 hearts with 10 villagers.', 'Social'), Ac('Networking', 'Reach 5 hearts with 20 villagers.', 'Social'),
    Ac('Singular Talent', 'Reach level 10 in a skill.', 'Skills'), Ac('Master of the Five Ways', 'Reach level 10 in every skill.', 'Skills'),
    Ac('Protector of the Valley', 'Complete all Monster Eradication Goals.', 'Combat'), Ac('The Bottom', 'Reach the bottom of the Mines.', 'Mines'),
    Ac('Local Legend', 'Restore the Pelican Town Community Center.', 'Story'), Ac('Joja Co. Member of the Year', 'Purchase all Joja Community Development items.', 'Story'),
    Ac('Cook', 'Cook 10 different recipes.', 'Cooking'), Ac('Sous Chef', 'Cook 25 different recipes.', 'Cooking'), Ac('Gourmet Chef', 'Cook every recipe.', 'Cooking'),
    Ac('D.I.Y.', 'Craft 15 different items.', 'Crafting'), Ac('Craft Master', 'Craft every item.', 'Crafting'),
    Ac('Fisherman', 'Catch 10 different fish.', 'Fishing'), Ac('Ol\' Mariner', 'Catch 24 different fish.', 'Fishing'), Ac('Master Angler', 'Catch every fish.', 'Fishing'), Ac('Mother Catch', 'Catch 100 fish.', 'Fishing'),
    Ac('Mystery of the Stardrops', 'Find every Stardrop.', 'Secrets'), Ac('Monoculture', 'Ship 300 of one crop.', 'Farming'), Ac('Polyculture', 'Ship 15 of each of 15 different crops.', 'Farming'),
    Ac('Ship It', 'Ship every item.', 'Shipping'), Ac('Gofer', 'Complete 10 Help Wanted quests.', 'Quests'), Ac('A Big Help', 'Complete 40 Help Wanted quests.', 'Quests'),
    Ac('Prairie King', 'Beat Journey of the Prairie King.', 'Arcade'), Ac('Fector\'s Challenge', 'Beat Journey of the Prairie King without dying.', 'Arcade'),
    Ac('Perfectionist', 'Achieve 100% Perfection.', 'Perfection'),
  ];
})();
