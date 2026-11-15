/* Automatic memories: milestones detected from real save/live data. Idempotent — each milestone is recorded once (keyed), never duplicated by re-importing.
   Milestones that were already true when the farm was first connected are marked "baseline" (we cannot know when they happened). */
(function () {
  const U = SDV.util;
  const Mem = (SDV.memories = {});
  const m = (key, title, test, text, kind = 'milestone') => ({ key, title, test, text, kind });
  const MAIL = (k) => (f) => f.mail.includes(k);
  const joja = (f) => ['jojaBoilerRoom', 'jojaCraftsRoom', 'jojaFishTank', 'jojaPantry', 'jojaVault'].every((k) => f.mail.includes(k));
  const STARS = ['CF_Fair', 'CF_Mines', 'CF_Sewer', 'CF_Statue', 'CF_Spouse', 'CF_Fish', 'CF_Museum'];
  const defs = [
    m('mines-bottom', 'Reached the bottom of the Mines', (f) => f.deepestMine >= 120, () => 'Floor 120 — the Skull Key was waiting.'),
    m('skull-100', 'Skull Cavern floor 100', (f) => f.skullDepth >= 100, () => 'Deep in the desert dark.'),
    m('married', 'Got married', (f) => !!f.spouse, (f) => `${f.spouse} said yes. 💍`, 'family'),
    m('child-1', 'A first child joined the family', (f) => f.children >= 1, () => 'The farmhouse got a little livelier.', 'family'),
    m('child-2', 'A second child', (f) => f.children >= 2, () => 'A full house.', 'family'),
    m('cc-complete', 'Restored the Community Center', (f) => f.mail.includes('ccIsComplete'), () => 'The Junimos celebrated.', 'story'),
    m('joja-complete', 'Finished the Joja Community Development Form', joja, () => 'Every project paid for.', 'story'),
    m('ginger', 'Ginger Island opened', MAIL('willyBoatFixed'), () => 'Willy’s boat is ready to sail.', 'story'),
    m('desert', 'The bus to the desert was repaired', (f) => f.mail.includes('ccVault') || f.mail.includes('jojaVault'), () => 'The Calico Desert is open.', 'story'),
    m('stardrop-1', 'Found a first Stardrop', (f) => STARS.some((k) => f.mail.includes(k)), () => 'A little more energy for everything.'),
    m('stardrop-all', 'Found every Stardrop', (f) => STARS.every((k) => f.mail.includes(k)), () => 'All seven!'),
    m('house-1', 'Upgraded the farmhouse (kitchen)', (f) => f.houseLevel >= 1, () => 'Now with a kitchen.', 'farm'),
    m('house-2', 'Added the nursery', (f) => f.houseLevel >= 2, () => 'Room for a family.', 'farm'),
    m('house-3', 'Dug the cellar', (f) => f.houseLevel >= 3, () => 'Aging cellar unlocked.', 'farm'),
    ...['Coop', 'Barn', 'Silo', 'Well', 'Stable', 'Mill', 'Shed', 'Fish Pond', 'Slime Hutch', 'Junimo Hut'].map((b) => m('built-' + U.slug(b), `Built your first ${b}`, (f) => f.buildings.some((x) => x === b || x.endsWith(' ' + b)), () => 'The farm keeps growing.', 'farm')),
    m('obelisk', 'Built an Obelisk', (f) => f.buildings.some((b) => /Obelisk/.test(b)), () => 'Warping in style.', 'farm'),
    m('gold-clock', 'Built the Gold Clock', (f) => f.buildings.includes('Gold Clock'), () => 'The ultimate flex.', 'farm'),
    ...[[1, 'Copper'], [2, 'Steel'], [3, 'Gold'], [4, 'Iridium']].map(([l, n]) => m('tools-' + n, `All tools upgraded to ${n}`, (f) => ['Axe', 'Pickaxe', 'Hoe', 'Watering Can'].every((t) => (f.tools[t] ?? 0) >= l), () => 'Clint’s forge was busy.', 'farm')),
    ...['farming', 'mining', 'foraging', 'fishing', 'combat'].map((s) => m('skill-' + s, `${s[0].toUpperCase() + s.slice(1)} level 10`, (f) => f.skills[s] >= 10, () => 'Mastery.', 'skill')),
    m('first-achievement', 'Unlocked a first achievement', (f) => f.achievements.length >= 1, () => 'The trophy case begins.'),
    m('first-10h', 'A first 10-heart friendship', (f) => Object.values(f.friend).some((x) => x.points >= 2500), () => 'Best friends.', 'family'),
    ...[10, 40, 95].map((n) => m('museum-' + n, `${n} items donated to the Museum`, (f) => f.museumFound && f.museumDonated.length >= n, () => 'Gunther is delighted.', 'collection')),
    ...[10, 25, 50].map((n) => m('fish-' + n, `${n} different fish caught`, (f) => f.fishCaught.length >= n, () => 'A proper angler.', 'collection')),
    ...[[15000, 'Greenhorn'], [50000, 'Cowpoke'], [250000, 'Homesteader'], [1000000, 'Millionaire']].map(([n, name]) => m('earn-' + n, `Earned ${n.toLocaleString()}g in total`, (f) => f.totalEarned >= n, () => `Achievement: ${name}.`, 'money')),
    ...[50, 100, 130].map((n) => m('walnut-' + n, `${n} Golden Walnuts`, (f) => f.walnuts >= n, () => 'Island treasure.', 'collection')),
    ...[2, 3, 4].map((y) => m('year-' + y, `Year ${y} begins`, (f) => f.date.year >= y, () => 'Another year on the farm.', 'time')),
  ];
  Mem.defs = defs;
  // prev = facts before this update (null on first connect)
  Mem.scan = (farm, prev) => {
    const f = farm.facts; if (!f) return []; farm.memories = farm.memories || []; const have = new Set(farm.memories.map((x) => x.key)); const out = [];
    for (const d of defs) {
      if (have.has(d.key)) continue; let now = false, was = false; try { now = d.test(f); was = prev ? d.test(prev) : true; } catch (e) { continue; }
      if (!now) continue;
      const mem = { id: U.uid(), key: d.key, title: d.title, text: d.text(f), kind: d.kind, date: { ...f.date }, baseline: was, at: Date.now(), auto: true, fav: false, hidden: false };
      farm.memories.push(mem); out.push(mem);
    }
    return out;
  };
})();
