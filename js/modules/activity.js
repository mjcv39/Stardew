/* Activity feed: compares the previous snapshot of a farm with a newly imported one and describes what changed.
   Only real differences between two real saves are ever reported — nothing is invented. */
(function () {
  const D = SDV.data, U = SDV.util, L = SDV.logic;
  const Act = (SDV.activity = {});
  const MAIL = {
    ccCraftsRoom: ['Community Center: Crafts Room restored', 'Crafts Room', 'bundle'], ccPantry: ['Community Center: Pantry restored', 'Pantry', 'bundle'], ccFishTank: ['Community Center: Fish Tank restored', 'Fish Tank', 'bundle'],
    ccBoilerRoom: ['Community Center: Boiler Room restored', 'Boiler Room', 'bundle'], ccBulletin: ['Community Center: Bulletin Board restored', 'Bulletin Board', 'bundle'], ccVault: ['Community Center: Vault restored (bus repaired)', 'Vault', 'bundle'],
    ccIsComplete: ['The Community Center is fully restored!', 'Community Center', 'bundle'], JojaMember: ['Joined the Joja Community Development Program', 'Joja', 'bundle'], willyBoatFixed: ['Willy repaired the boat — Ginger Island is open!', 'Boat', 'building'],
    CF_Fair: ['Found a Stardrop (Stardew Valley Fair)', 'Stardrop', 'achievement'], CF_Mines: ['Found a Stardrop (Mines)', 'Stardrop', 'achievement'], CF_Sewer: ['Found a Stardrop (Krobus)', 'Stardrop', 'achievement'], CF_Statue: ['Found a Stardrop (Old Master Cannoli)', 'Stardrop', 'achievement'], CF_Spouse: ['Found a Stardrop (spouse)', 'Stardrop', 'achievement'], CF_Fish: ['Found a Stardrop (Master Angler)', 'Stardrop', 'achievement'], CF_Museum: ['Found a Stardrop (Museum)', 'Stardrop', 'achievement'],
  };
  const ev = (kind, text, icon, date) => ({ id: U.uid(), ts: Date.now(), game: date, kind, text, icon });

  // diff(prev, next) -> [events]. prev may be null for a first import.
  Act.diff = (prev, next) => {
    const out = []; const d = next.date;
    if (!prev) return [ev('connect', `Connected ${next.farmName} Farm — ${U.fmtDate(d)}`, ['Sunflower', 'crop'], d)];
    const days = U.daysBetween(prev.date, d);
    if (days > 0) out.push(ev('time', days === 1 ? `A new day began — ${U.fmtDate(d)}` : `${days} days passed — now ${U.fmtDate(d)}`, ['Sun', 'area'], d));
    if (prev.date.season !== d.season || prev.date.year !== d.year) out.push(ev('time', d.year > prev.date.year ? `A new year begins: Year ${d.year}!` : `${d.season} has arrived`, ['Calendar', 'festival'], d));
    for (const id of next.fishCaught.filter((x) => !prev.fishCaught.includes(x))) { const fish = D.fish.find((x) => x.itemId === id); out.push(ev('fish', `Caught a new fish: ${fish ? fish.name : 'item #' + id}`, [fish ? fish.name : 'Fish', 'fish'], d)); }
    const donated = (x) => x.museumDonated || [];
    for (const id of donated(next).filter((x) => !donated(prev).includes(x))) { const it = [...D.artifacts, ...D.minerals].find((m) => m.itemId === id); out.push(ev('museum', `Donated to the Museum: ${it ? it.name : 'item #' + id}`, [it ? it.name : 'Vase', it && it.kind === 'Artifact' ? 'artifact' : 'mineral'], d)); }
    for (const id of next.artifacts.filter((x) => !prev.artifacts.includes(x))) { const it = D.artifacts.find((m) => m.itemId === id); if (it && !donated(next).includes(id)) out.push(ev('museum', `Found an artifact: ${it.name}`, [it.name, 'artifact'], d)); }
    for (const r of next.cookingKnown.filter((x) => !prev.cookingKnown.includes(x))) out.push(ev('recipe', `Learned a cooking recipe: ${r}`, [r, 'recipe'], d));
    for (const r of next.craftingKnown.filter((x) => !prev.craftingKnown.includes(x))) out.push(ev('recipe', `Learned a crafting recipe: ${r}`, [r, 'craft'], d));
    for (const [name, fr] of Object.entries(next.friend)) {
      const was = prev.friend[name]; const h = L.hearts(fr.points), hw = was ? L.hearts(was.points) : 0; const v = L.villager(name);
      if (h > hw && (h >= 2)) out.push(ev('friend', `${name} is now at ${h} hearts`, [v || { name }, 'villager', true], d));
      if (was && fr.status !== was.status && fr.status) out.push(ev('friend', `${name}: relationship status is now ${fr.status}`, [v || { name }, 'villager', true], d));
    }
    // buildings: multiset difference
    const count = (arr) => arr.reduce((m, b) => ((m[b] = (m[b] || 0) + 1), m), {});
    const pb = count(prev.buildings), nb = count(next.buildings);
    for (const [b, n] of Object.entries(nb)) if ((pb[b] || 0) < n) out.push(ev('building', `Built: ${b}${n - (pb[b] || 0) > 1 ? ' ×' + (n - (pb[b] || 0)) : ''}`, [b, 'building'], d));
    const pa = count(prev.animals.map((a) => a.type)), na = count(next.animals.map((a) => a.type));
    for (const [a, n] of Object.entries(na)) if ((pa[a] || 0) < n) out.push(ev('animal', `New farm animal: ${a}${n - (pa[a] || 0) > 1 ? ' ×' + (n - (pa[a] || 0)) : ''}`, [a, 'animal'], d));
    if (next.houseLevel > prev.houseLevel) out.push(ev('building', `Farmhouse upgraded (level ${next.houseLevel})`, ['House', 'building'], d));
    for (const [t, lvl] of Object.entries(next.tools)) if (prev.tools[t] != null && lvl > prev.tools[t]) out.push(ev('tool', `${t} upgraded to ${D.toolUpgrades.tiers[lvl - 1].tier}`, [t, 'tool'], d));
    for (const [k, lvl] of Object.entries(next.skills)) if (lvl > prev.skills[k]) out.push(ev('skill', `${k[0].toUpperCase() + k.slice(1)} reached level ${lvl}`, ['Sprout', 'crop'], d));
    for (const m of next.mail.filter((x) => !prev.mail.includes(x))) if (MAIL[m]) out.push(ev('unlock', MAIL[m][0], [MAIL[m][1], MAIL[m][2]], d));
    if (next.deepestMine > prev.deepestMine) out.push(ev('explore', `Reached Mines floor ${next.deepestMine}${next.deepestMine >= 120 ? ' — the bottom!' : ''}`, ['Pickaxe', 'tool'], d));
    if (next.skullDepth > prev.skullDepth) out.push(ev('explore', `Reached Skull Cavern floor ${next.skullDepth}`, ['Skull Cavern', 'area'], d));
    if (next.walnuts > prev.walnuts) out.push(ev('explore', `Golden Walnuts: ${next.walnuts} found (+${next.walnuts - prev.walnuts})`, ['Palm', 'area'], d));
    if (next.spouse && next.spouse !== prev.spouse) out.push(ev('friend', `Married ${next.spouse}!`, [L.villager(next.spouse) || { name: next.spouse }, 'villager', true], d));
    if (next.children > prev.children) out.push(ev('friend', `A new child joined the family (${next.children} total)`, ['Heart', 'gift'], d));
    if (next.achievements.length > prev.achievements.length) out.push(ev('achievement', `${next.achievements.length - prev.achievements.length} new achievement(s) unlocked (${next.achievements.length} total)`, ['Trophy', 'achievement'], d));
    for (const b of D.bundles) { const was = prev.bundles[b.bundleId], now = next.bundles[b.bundleId]; if (was && now && now.length === b.items.length && was.length === now.length) { const hw = was.filter(Boolean).length, hn = now.filter(Boolean).length; if (hw < b.need && hn >= b.need) out.push(ev('bundle', `Bundle completed: ${b.name} (${b.room})`, [b.name, 'bundle'], d)); } }
    if (next.money !== prev.money && Math.abs(next.money - prev.money) >= 1000) out.push(ev('money', `${next.money > prev.money ? 'Gold up' : 'Gold down'} by ${U.gold(Math.abs(next.money - prev.money))} since the last sync`, ['Gold', 'bundle'], d));
    if (out.length === 0 || (out.length === 1 && out[0].kind === 'time' && days === 0)) return days === 0 ? [] : out;
    return out.length > 40 ? [...out.slice(0, 39), ev('more', `…and ${out.length - 39} more changes`, ['Box', 'craft'], d)] : out;
  };
})();
