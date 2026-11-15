/* Game logic shared by every feature: seasons, crops, fish, birthdays, bundles. Pure functions over SDV.data — no UI. */
(function () {
  const D = SDV.data, U = SDV.util, St = SDV.store;
  const L = (SDV.logic = {});
  const A4 = SDV.SEASONS;

  L.hearts = (points) => Math.floor((points || 0) / 250);
  L.villager = (name) => D.villagers.find((v) => v.name === name);
  L.cropsInSeason = (season) => D.crops.filter((c) => c.seasons.includes(season) && c.id !== 'cactus-fruit' && c.id !== 'pineapple' && c.id !== 'taro-root');
  // Can a crop planted today still be harvested before its last growing season ends?
  L.plantInfo = (crop, date) => {
    if (!crop.seasons.includes(date.season)) return null;
    let last = 28, s = A4.indexOf(date.season), hops = 0;
    while (crop.seasons.includes(A4[(s + 1) % 4]) && hops < 3) { s = (s + 1) % 4; last += 28; hops++; }
    const left = last - date.day;
    const harvests = left >= crop.days ? (crop.regrow ? 1 + Math.floor((left - crop.days) / crop.regrow) : 1) : 0;
    return { canPlant: harvests > 0, harvests, lastPlantDay: last - crop.days, left, firstHarvest: U.addDays(date, crop.days) };
  };
  L.fishAvailable = (date, weather = 'Sunny', hour = null) => D.fish.filter((f) => {
    if (!f.seasons.includes(date.season)) return false;
    if (f.weather === 'Rainy' && weather !== 'Rainy') return false;
    if (f.weather === 'Sunny' && weather === 'Rainy') return false;
    return hour == null || U.inWindow(f.time, hour);
  });
  L.birthdaysOn = (season, day) => D.villagers.filter((v) => v.season === season && v.day === day);
  L.festivalsOn = (season, day) => D.festivals.filter((f) => f.season === season && f.days.includes(day));
  L.upcoming = (date, days, fn) => { const out = []; for (let i = 0; i <= days; i++) { const d = U.addDays(date, i); const r = fn(d); if (r && r.length) out.push({ date: d, in: i, items: r }); } return out; };
  L.nextBirthdayIn = (v, date) => { for (let i = 0; i < 112; i++) { const d = U.addDays(date, i); if (d.season === v.season && d.day === v.day) return i; } return null; };
  L.loved = (name) => D.villagers.filter((v) => v.loves.some((i) => i.toLowerCase() === name.toLowerCase()));

  /* ---- what does a save say about this farm? (null when unknown → UI shows "not detected") ---- */
  L.facts = (farm) => (farm && farm.facts) || null;
  L.neededFish = (farm) => { const f = L.facts(farm); return f ? D.fish.filter((x) => !f.fishCaught.includes(x.itemId)) : null; };
  L.friendship = (farm, name) => { const f = L.facts(farm); const fr = f && f.friend[name]; return fr ? { hearts: L.hearts(fr.points), points: fr.points, status: fr.status, giftsThisWeek: fr.giftsThisWeek, source: 'save' } : farm && farm.hearts[name] != null ? { hearts: farm.hearts[name], source: 'manual' } : null; };
  L.skillSum = (f) => Object.values(f.skills).reduce((a, b) => a + b, 0);

  // Community Center bundles. Save flags are used only when their length matches our data (guards against id mapping errors).
  L.bundleState = (farm) => {
    const f = L.facts(farm); const out = {};
    for (const b of D.bundles) {
      const flags = f && f.bundles[b.bundleId];
      if (flags && flags.length === b.items.length) { const have = flags.filter(Boolean).length; out[b.id] = { known: true, have, need: b.need, done: have >= b.need, missing: b.items.filter((_, i) => !flags[i]) }; }
      else out[b.id] = { known: false, have: 0, need: b.need, done: St.isChecked(farm, 'bundle:' + b.id), missing: b.items };
    }
    return out;
  };
  L.route = (farm) => { const f = L.facts(farm); if (farm.route) return farm.route; if (f && f.mail.includes('JojaMember')) return 'joja'; return 'cc'; };
  // Seasons an item is obtainable in (from crops / forage / fish data); null = no data
  L.itemSeasons = (raw) => {
    const name = raw.toLowerCase().replace(/\s*[×x]\s*\d+$/i, '').replace(/\s*\((gold)\)$/i, '').trim();
    const c = D.crops.find((x) => x.name.toLowerCase() === name); if (c) return c.seasons;
    const f = D.forage.find((x) => x.name.toLowerCase() === name); if (f) return f.seasons;
    const fi = D.fish.find((x) => x.name.toLowerCase() === name); if (fi) return fi.seasons;
    return null;
  };
  L.availableNow = (raw, season) => { const s = L.itemSeasons(raw); return s ? s.includes(season) : null; };

  L.nextUpgrade = (farm) => {
    const f = L.facts(farm); if (!f) return null;
    const out = [];
    const house = [10000, 65000, 100000][f.houseLevel]; if (house) out.push({ name: ['Farmhouse kitchen upgrade', 'Farmhouse nursery upgrade', 'Farmhouse cellar upgrade'][f.houseLevel], cost: house });
    for (const t of D.toolUpgrades.tools) { const lvl = f.tools[t]; if (lvl != null && lvl < 4) out.push({ name: `${D.toolUpgrades.tiers[lvl].tier} ${t}`, cost: D.toolUpgrades.tiers[lvl].gold }); }
    if (!f.buildings.some((b) => /Coop/.test(b))) out.push({ name: 'Coop', cost: 4000 });
    if (!f.buildings.some((b) => /Barn/.test(b))) out.push({ name: 'Barn', cost: 6000 });
    if (!f.buildings.includes('Silo')) out.push({ name: 'Silo', cost: 100 });
    return out.sort((a, b) => a.cost - b.cost);
  };
})();
