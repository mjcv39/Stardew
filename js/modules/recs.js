/* "What should I work on today?" — rule-based suggestions computed from the farm's real data.
   Each suggestion states its basis: 'save' (from imported save data), 'manual' (from numbers the player entered) or 'calendar' (from the date alone). */
(function () {
  const D = SDV.data, U = SDV.util, L = SDV.logic;
  const R = (SDV.recs = {});

  R.today = (farm) => {
    if (!farm) return [];
    const out = []; const d = farm.date, wx = farm.weather || 'Sunny', f = farm.facts; const basis = f ? 'save' : 'manual';
    const add = (r) => out.push({ basis, ...r });
    const daysLeft = 28 - d.day;

    // Birthdays & festivals (calendar)
    for (const x of L.upcoming(d, 3, (dt) => L.birthdaysOn(dt.season, dt.day))) for (const v of x.items) {
      const fr = L.friendship(farm, v.name);
      add({ id: 'bday-' + v.id + '-' + U.absDay(x.date), icon: [v, 'villager', true], prio: 100 - x.in * 8, basis: 'calendar', href: '#/tools/gifts',
        title: x.in === 0 ? `It's ${v.name}'s birthday today!` : `${v.name}'s birthday is ${x.in === 1 ? 'tomorrow' : 'in ' + x.in + ' days'} (${U.fmtShort(x.date)})`,
        detail: `Loved gifts: ${v.loves.slice(0, 3).join(', ')}.${fr ? ` You're at ${fr.hearts} heart${fr.hearts === 1 ? '' : 's'}${fr.source === 'manual' ? ' (entered by you)' : ''}.` : ''}` });
    }
    for (const x of L.upcoming(d, 2, (dt) => L.festivalsOn(dt.season, dt.day))) for (const fe of x.items) add({ id: 'fest-' + fe.id + '-' + U.absDay(x.date), icon: [fe.name, 'festival'], prio: 95 - x.in * 10, basis: 'calendar', href: '#/calendar', title: x.in === 0 ? `${fe.name} is today` : `${fe.name} ${x.in === 1 ? 'is tomorrow' : 'in ' + x.in + ' days'}`, detail: `${fe.time} · ${fe.where}. ${fe.tips || fe.notes}` });

    // End of season
    if (daysLeft <= 7) add({ id: 'season-end-' + U.absDay(d), icon: ['Calendar', 'festival'], prio: 90 - daysLeft * 2, basis: 'calendar', href: '#/calendar', title: daysLeft === 0 ? `Last day of ${d.season}!` : `${U.plural(daysLeft, 'day')} left in ${d.season}`, detail: d.season === 'Winter' ? 'A new year starts soon — new shop stock and villagers appear in Year 2.' : `Outdoor crops die at the end of ${d.season} (unless the next season grows them too). Harvest everything and plan seeds for ${U.nextSeason(d.season)}.` });

    // Crops: last chance to plant good-value crops
    const plantable = L.cropsInSeason(d.season).map((c) => ({ c, p: L.plantInfo(c, d) })).filter((x) => x.p && x.p.canPlant);
    const lastChance = plantable.filter((x) => x.p.lastPlantDay - d.day <= 2 && typeof x.c.seedPrice === 'number' && x.c.sell >= 100).sort((a, b) => b.c.sell - a.c.sell).slice(0, 2);
    for (const { c, p } of lastChance) add({ id: 'plant-' + c.id + '-' + d.season, icon: [c.name, 'crop'], prio: 80, basis: 'calendar', href: '#/tools/crops', title: `Last chance to plant ${c.name} this season`, detail: `${c.days} days to grow — plant by ${U.fmtShort(U.addDays(d, p.lastPlantDay - d.day))} to harvest before ${d.season} ends (sells ${U.gold(c.sell)}).` });
    if (plantable.length && daysLeft > 7 && !lastChance.length) { const best = plantable.slice().sort((a, b) => (b.c.sell / b.c.days) - (a.c.sell / a.c.days))[0]; add({ id: 'bestcrop-' + d.season + d.day, icon: [best.c.name, 'crop'], prio: 40, basis: 'calendar', href: '#/tools/crops', title: `${best.c.name} still has time to pay off`, detail: `${best.c.days}-day crop, ${best.p.harvests} harvest${best.p.harvests > 1 ? 's' : ''} possible if planted today.` }); }

    // Community Center items obtainable right now
    if (f && L.route(farm) === 'cc') {
      const bs = L.bundleState(farm); const avail = [];
      for (const b of D.bundles) { const st = bs[b.id]; if (!st.known || st.done) continue; for (const item of st.missing) if (L.availableNow(item, d.season)) avail.push({ item, b }); }
      if (avail.length) { const top = avail.slice(0, 4); add({ id: 'cc-' + d.season + d.day, icon: ['Community Center', 'bundle'], prio: 70, href: '#/progress', title: `${avail.length} missing Community Center item${avail.length > 1 ? 's' : ''} in season now`, detail: top.map((x) => `${x.item} (${x.b.name})`).join(', ') + (avail.length > 4 ? '…' : '') }); }
    }
    // Fish still needed that can be caught today
    const needed = L.neededFish(farm);
    if (needed) {
      const today = L.fishAvailable(d, wx).filter((x) => needed.some((n) => n.id === x.id) && !x.legendary).sort((a, b) => b.price - a.price);
      if (today.length) add({ id: 'fish-' + d.season + d.day + wx, icon: [today[0].name, 'fish'], prio: 60, href: '#/tools/fish', title: `${U.plural(today.length, 'fish')} you haven't caught can bite today`, detail: `${today.slice(0, 4).map((x) => `${x.name} (${x.location.split(',')[0]}, ${U.fmtWindows(x.time)})`).join(' · ')} — ${wx.toLowerCase()} weather.` });
    }
    // Upgrades within budget
    const ups = L.nextUpgrade(farm);
    if (ups && ups.length) { const aff = ups.filter((u) => u.cost <= farm.money).sort((a, b) => b.cost - a.cost); if (aff.length) add({ id: 'upg-' + aff[0].name + Math.floor(farm.money / 1000), icon: ['Chest', 'craft'], prio: 55, href: '#/progress', title: `You can afford: ${aff[0].name}`, detail: `Costs ${U.gold(aff[0].cost)}; you have ${U.gold(farm.money)}. Materials may also be needed.` }); else add({ id: 'saving-' + ups[0].name, icon: ['Gold', 'bundle'], prio: 20, href: '#/progress', title: `Saving for ${ups[0].name}`, detail: `${U.gold(ups[0].cost - farm.money)} to go (${U.gold(ups[0].cost)} total).` }); }
    // Friendships that need attention (save data only)
    if (f) {
      const low = Object.entries(f.friend).map(([n, fr]) => ({ v: L.villager(n), fr })).filter((x) => x.v && L.hearts(x.fr.points) < 8 && x.fr.giftsThisWeek < 2 && x.v.name !== 'Krobus' && x.v.name !== 'Dwarf' && x.v.name !== 'Kent' && x.v.name !== 'Leo').sort((a, b) => b.fr.points - a.fr.points);
      const pick = low.find((x) => x.fr.points > 0) || low[0];
      if (pick) add({ id: 'friend-' + pick.v.id + d.day, icon: [pick.v, 'villager', true], prio: 35, href: '#/tools/gifts', title: `Visit ${pick.v.name} (${L.hearts(pick.fr.points)} hearts)`, detail: `Gifts this week: ${pick.fr.giftsThisWeek}/2. They love ${pick.v.loves.slice(0, 2).join(' and ')}.` });
    }
    // Goals due soon
    for (const g of farm.goals.filter((x) => !x.done && x.due)) { const left = U.daysBetween(d, g.due); if (left <= 5) add({ id: 'goal-' + g.id, icon: ['Scroll', 'quest'], prio: g.priority === 'high' ? 85 : 65, basis: 'manual', href: '#/', title: left < 0 ? `Overdue goal: ${g.title}` : left === 0 ? `Goal due today: ${g.title}` : `Goal due in ${left} day${left > 1 ? 's' : ''}: ${g.title}`, detail: g.note || 'A goal you created.' }); }
    return out.sort((a, b) => b.prio - a.prio);
  };
})();
