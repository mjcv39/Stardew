(function () {
  const D = SDV.data;
  const slug = SDV.util.slug;
  const An = (name, home, price, products, notes) => ({ id: slug(name), name, home, price, products, notes });
  D.animals = [
    An('Chicken', 'Coop', 800, 'White Egg (50g), Brown Egg (50g), Large Eggs (95g)', 'Starter coop animal; produces daily. Void Chicken (Void Egg) and Golden Chicken (Golden Egg 500g) are special variants.'),
    An('Duck', 'Coop (Big Coop)', 1200, 'Duck Egg (95g), Duck Feather (250g)', 'Requires Big Coop. Eggs every 2 days; Feather occasionally.'),
    An('Rabbit', 'Coop (Deluxe Coop)', 8000, 'Wool (340g), Rabbit\'s Foot (565g)', 'Requires Deluxe Coop. Wool every 4 days; Foot rarely.'),
    An('Dinosaur', 'Coop', '—', 'Dinosaur Egg (350g)', 'Hatched from a Dinosaur Egg in an Incubator (Big Coop). Produces every 7 days.'),
    An('Cow', 'Barn', 1500, 'Milk (125g), Large Milk (190g)', 'Needs hay daily.'),
    An('Goat', 'Barn (Big Barn)', 4000, 'Goat Milk (225g), L. Goat Milk (345g)', 'Requires Big Barn.'),
    An('Sheep', 'Barn (Deluxe Barn)', 8000, 'Wool (340g)', 'Requires Deluxe Barn. Needs shears.'),
    An('Pig', 'Barn (Deluxe Barn)', 16000, 'Truffle (625g)', 'Requires Deluxe Barn. Pigs forage truffles outdoors (non-winter).'),
    An('Ostrich', 'Ostrich Pen (Ginger Island)', 20000, 'Ostrich Egg (600g)', 'Requires Incubator & Ostrich Egg from the Island Field Office (Qi).'),
    An('Horse', 'Stable', 10000, 'Mount', 'Stable cost: 10,000g + 100 hardwood.'),
    An('Pet (Cat/Dog/Turtle)', 'Farm', '—', 'Companion', 'Choose at the start; pets are petted daily to raise friendship.'),
  ];
  D.artisan = [
    { id: 'mayonnaise', name: 'Mayonnaise', maker: 'Mayonnaise Machine', input: 'Egg', time: '3 hr', price: 190 },
    { id: 'cheese', name: 'Cheese', maker: 'Cheese Press', input: 'Milk', time: '3 hr', price: 230 },
    { id: 'wine', name: 'Wine', maker: 'Keg', input: 'Any Fruit', time: '7 days', price: 'fruit×3' },
    { id: 'preserves', name: 'Jelly / Pickles', maker: 'Preserves Jar', input: 'Fruit / Vegetable', time: '2–3 days', price: 'item×2 +50' },
    { id: 'honey', name: 'Honey', maker: 'Bee House', input: '—', time: '4 days', price: 100 },
    { id: 'cloth', name: 'Cloth', maker: 'Loom', input: 'Wool', time: '4 hr', price: 470 },
    { id: 'truffle-oil', name: 'Truffle Oil', maker: 'Oil Maker', input: 'Truffle', time: '6 hr', price: 1065 },
    { id: 'beer', name: 'Beer / Pale Ale', maker: 'Keg', input: 'Wheat / Hops', time: '1.5 / 2 days', price: '200 / 300' },
  ];

  const Fo = (name, seasons, price, where, notes = '') => ({ id: slug(name), name, seasons: seasons === 'Any' ? ['Spring', 'Summer', 'Fall', 'Winter'] : seasons.split('/'), allSeasons: seasons === 'Any', season: seasons === 'Any' ? 'Any' : seasons.split('/')[0], price, where, notes });
  D.forage = [
    Fo('Wild Horseradish', 'Spring', 50, 'Bus Stop, Town, Cindersap Forest, Mountain'),
    Fo('Daffodil', 'Spring', 30, 'Bus Stop, Town, Mountain, Forest'),
    Fo('Leek', 'Spring', 60, 'Bus Stop, Town, Mountain, Forest'),
    Fo('Dandelion', 'Spring', 40, 'Bus Stop, Town, Mountain, Forest'),
    Fo('Spring Onion', 'Spring', 8, 'Cindersap Forest'),
    Fo('Salmonberry', 'Spring', 5, 'Bushes (Spring 15–18)', 'Seasonal berry bushes.'),
    Fo('Morel', 'Spring/Fall', 150, 'Secret Woods, Cindersap Forest (Spring)', ''),
    Fo('Grape', 'Summer', 80, 'Wild vines (Bus Stop, Forest)'),
    Fo('Spice Berry', 'Summer', 80, 'Bushes (Summer 12–14)'),
    Fo('Sweet Pea', 'Summer', 50, 'Bus Stop, Town, Mountain, Forest'),
    Fo('Fiddlehead Fern', 'Summer', 90, 'Secret Woods'),
    Fo('Red Mushroom', 'Summer/Fall', 75, 'Secret Woods, Mines (mushroom caves)'),
    Fo('Common Mushroom', 'Fall', 40, 'Forest, Secret Woods, Mines'),
    Fo('Wild Plum', 'Fall', 80, 'Bus Stop, Mountain, Forest'),
    Fo('Hazelnut', 'Fall', 90, 'Bus Stop, Mountain, Forest'),
    Fo('Blackberry', 'Fall', 20, 'Bushes (Fall 8–11)'),
    Fo('Chanterelle', 'Fall', 160, 'Secret Woods'),
    Fo('Winter Root', 'Winter', 70, 'Dig tiles (artifact spots)'),
    Fo('Crystal Fruit', 'Winter', 150, 'Bus Stop, Mountain, Forest'),
    Fo('Snow Yam', 'Winter', 100, 'Dig tiles'),
    Fo('Crocus', 'Winter', 60, 'Bus Stop, Mountain, Forest'),
    Fo('Holly', 'Winter', 80, 'Forest, Secret Woods'),
    Fo('Cave Carrot', 'Any', 25, 'The Mines (levels 1–40; unlocks via forest)'),
    Fo('Purple Mushroom', 'Any', 250, 'Mines (levels 80+), Skull Cavern'),
    Fo('Coconut', 'Any', 100, 'Calico Desert (Coconut trees), Ginger Island'),
    Fo('Cactus Fruit', 'Any', 75, 'Calico Desert'),
    Fo('Nautilus Shell', 'Winter', 120, 'Beach'),
    Fo('Coral', 'Any', 80, 'Beach tide pools'),
    Fo('Sea Urchin', 'Any', 160, 'Beach tide pools'),
    Fo('Clam', 'Any', 50, 'Beach'),
    Fo('Cockle', 'Any', 50, 'Beach'),
    Fo('Mussel', 'Any', 30, 'Beach'),
    Fo('Oyster', 'Any', 40, 'Beach'),
    Fo('Seaweed', 'Any', 20, 'Fishing; Beach (river mouths)', 'Fish treasure'),
  ];
  D.forageTips = ['Foraging skill gives better quality; Botanist profession ensures iridium-quality forage.', 'Spring Onion etc. are mainly used in cooking: Salad, Fiddlehead Risotto.', 'Berry bushes bloom on set days: Salmonberry (Spring 15–18), Blackberry (Fall 8–11).'];
})();
