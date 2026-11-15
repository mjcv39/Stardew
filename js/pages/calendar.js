/* Calendar — month grid, day panel, seasonal overview, "Prepare for next season". All data is computed from the farm; nothing is guessed. */
(function () {
  const D = SDV.data, U = SDV.util, { esc, gold } = U, L = SDV.logic, St = SDV.store, UI = SDV.ui;
  const P = (SDV.pages.calendar = {});
  const view = { season: null, year: null, follow: true, farm: null };
  const FILTERS = [['birthdays', '🎂 Birthdays'], ['festivals', '🎪 Festivals'], ['crops', '🌱 Crops'], ['fish', '🎣 Fish'], ['cc', '🎁 Bundles'], ['goals', '📝 Reminders & goals'], ['events', '🔔 Season notes']];
  const same = (a, b) => a.year === b.year && a.season === b.season && a.day === b.day;
  const goalsOn = (f, d) => f.goals.filter((g) => g.due && same(g.due, d));
  const needFish = (f) => L.neededFish(f);
  const lastSeasonOf = (c, s) => { let i = SDV.SEASONS.indexOf(s), n = 0; while (c.seasons.includes(SDV.SEASONS[(i + 1) % 4]) && n++ < 3) i++; return SDV.SEASONS[i % 4]; };
  function harvestsOn(f, d) {
    const out = [];
    for (const p of f.plantings) {
      const c = D.crops.find((x) => x.id === p.crop); if (!c) continue;
      const end = U.absDay({ ...p.date, season: lastSeasonOf(c, p.date.season), day: 28 }); let t = U.absDay(p.date) + c.days;
      while (t <= end) { if (t === U.absDay(d)) { out.push({ c, n: p.n }); break; } if (!c.regrow) break; t += c.regrow; }
    }
    return out;
  }
  const prefs = () => { const p = St.prefs(); p.calFilters = { birthdays: true, festivals: true, crops: true, fish: false, cc: true, goals: true, events: true, ...(p.calFilters || {}) }; return p.calFilters; };
  const weatherIcon = (w) => (w === 'Rainy' || w === 'Raining' ? '🌧' : w === 'Snowy' || w === 'Snowing' ? '❄️' : '☀️');

  /* ---------------- month grid ---------------- */
  function grid(f) {
    const cur = f.date, season = view.season, fl = prefs(); const live = SDV.live.isLive(f);
    const lastDay = {}; for (const c of L.cropsInSeason(season)) { if (lastSeasonOf(c, season) !== season && c.seasons.includes(U.nextSeason(season))) continue; const ld = 28 - c.days; if (ld >= 1) (lastDay[ld] = lastDay[ld] || []).push(c); }
    const sFish = L.fishAvailable({ season }, 'Sunny'), need = needFish(f); const ccNew = L.ccMissing(f).filter((x) => x.seasons && x.seasons.includes(season) && !x.seasons.includes(SDV.SEASONS[(SDV.SEASONS.indexOf(season) + 3) % 4]));
    let cells = '';
    for (let day = 1; day <= 28; day++) {
      const d = { year: view.year, season, day }; const today = same(d, cur), past = U.daysBetween(cur, d) < 0;
      const b = fl.birthdays ? L.birthdaysOn(season, day) : [], fe = fl.festivals ? L.festivalsOn(season, day) : [], g = fl.goals ? goalsOn(f, d) : [], hv = fl.crops ? harvestsOn(f, d) : [], cr = fl.crops ? lastDay[day] || [] : [], sp = fl.events ? D.specialDays.filter((s) => s.season === season && s.day === day) : [];
      let wx = ''; if (today && live && f.live && f.live.weather) wx = `<span class="mk" title="Weather today (live)">${weatherIcon(f.live.weather)}</span>`; else if (f.facts && f.facts.weatherTomorrow && U.daysBetween(cur, d) === 1) wx = `<span class="mk" title="Tomorrow’s forecast from your save">${weatherIcon(f.facts.weatherTomorrow)}</span>`;
      cells += `<button class="cell ${today ? 'today' : ''} ${past ? 'past' : ''} ${b.length || fe.length ? 'hot' : ''}" data-day="${day}" aria-label="${season} ${day}"><span class="dnum">${day}</span><span class="dow">${U.dayOfWeek(day)}</span>
        <span class="marks">${b.map((x) => U.portrait(x, 'cal')).join('')}${fe.length ? `<span class="mk fest" title="${esc(fe[0].name)}">🎪</span>` : ''}${g.length ? `<span class="mk goal" title="${g.length} reminder(s)">📝${g.length > 1 ? g.length : ''}</span>` : ''}${hv.length ? `<span class="mk harv" title="Harvest ready">🧺${hv.length}</span>` : ''}${cr.length ? `<span class="mk crop" title="Last day to plant: ${esc(cr.map((c) => c.name).join(', '))}">🌱${cr.length}</span>` : ''}${fl.fish ? `<span class="mk fish" title="${need ? 'Fish you still need: ' + sFish.filter((x) => need.some((n) => n.id === x.id)).length : sFish.length + ' fish'}">🐟${need ? sFish.filter((x) => need.some((n) => n.id === x.id)).length : sFish.length}</span>` : ''}${fl.cc && day === 1 && ccNew.length ? `<span class="mk cc" title="${ccNew.length} missing bundle items come into season">🎁${ccNew.length}</span>` : ''}${sp.length ? '<span class="mk ev">🔔</span>' : ''}${wx}</span>
        ${fe.length ? `<span class="fest-name">${esc(fe[0].name)}</span>` : b.length ? `<span class="fest-name">${esc(b.map((x) => x.name).join(', '))}</span>` : ''}</button>`;
    }
    return `<div class="cal-grid" role="grid">${cells}</div>`;
  }

  /* ---------------- day panel ---------------- */
  function dayPanel(f, day) {
    const season = view.season, d = { year: view.year, season, day }; const b = L.birthdaysOn(season, day), fe = L.festivalsOn(season, day), sp = D.specialDays.filter((s) => s.season === season && s.day === day);
    const need = needFish(f), fish = L.fishAvailable({ season }, 'Sunny'), rain = L.fishAvailable({ season }, 'Rainy').filter((x) => x.weather === 'Rainy');
    const fishChip = (x) => { const n = need && need.some((y) => y.id === x.id); return `<span class="chip ${n ? 'need' : ''}" title="${esc(x.location)} · ${U.fmtWindows(x.time)}">${U.icon(x.name, 'fish', 'xs')} ${esc(x.name)} <small>${esc(x.location.split(',')[0])} · ${U.fmtWindows(x.time)}</small>${n ? ' <b>needed</b>' : ''}</span>`; };
    const crops = L.cropsInSeason(season).map((c) => ({ c, p: L.plantInfo(c, d) })).filter((x) => x.p && x.p.canPlant); const hv = harvestsOn(f, d), goals = goalsOn(f, d);
    const cc = L.ccMissing(f).filter((x) => x.seasons && x.seasons.includes(season));
    const att = D.villagers.map((v) => ({ v, fr: L.friendship(f, v.name) })).filter((x) => x.fr && x.fr.hearts < 8 && !b.includes(x.v) && !['Krobus', 'Dwarf', 'Kent', 'Leo'].includes(x.v.name)).sort((a, z) => a.fr.hearts - z.fr.hearts).slice(0, 3);
    const obtainable = (v) => v.loves.filter((i) => L.availableNow(i, season));
    return `<h2>${season} ${day}, Year ${view.year} <small>${U.dayOfWeek(day)}</small></h2><div class="mnav"><button class="btn xs ghost" data-d="-1">◀ prev</button><button class="btn xs ghost" data-d="1">next ▶</button></div>
      ${b.map((x) => { const fr = L.friendship(f, x.name); return `<div class="card-in"><div class="hero">${U.portrait(x, 'xl')}<div><h3>🎂 ${esc(x.name)}'s birthday</h3>${fr ? `<p>You’re at <b>${fr.hearts}♥</b> ${fr.source === 'manual' ? '(manual)' : ''}</p>` : ''}<p>💖 Loved: ${x.loves.map(esc).join(', ')}</p>${obtainable(x).length ? `<p class="tip">In season now: <b>${obtainable(x).map(esc).join(', ')}</b></p>` : ''}<p>👍 Liked: ${esc(x.likes.slice(0, 5).join(', ') || '—')}</p><a href="#/progress/villager/${x.id}" data-close>Profile</a> · <a href="#/tools/gifts" data-close>Gift planner</a></div></div></div>`; }).join('')}
      ${fe.map((x) => `<div class="card-in"><h3>🎪 ${esc(x.name)}</h3><p>${esc(x.time)} · ${esc(x.where)}</p><p>${esc(x.notes)}</p>${x.tips ? `<p class="tip"><b>Tip:</b> ${esc(x.tips)}</p>` : ''}</div>`).join('')}
      ${sp.map((x) => `<div class="card-in">🔔 ${esc(x.text)}</div>`).join('')}
      ${att.length ? `<div class="card-in"><h3>Villagers to visit</h3>${att.map((x) => `<div class="row">${U.portrait(x.v, 'sm')}<div><b>${esc(x.v.name)}</b> <small>${x.fr.hearts}♥</small><small>Loves ${esc(x.v.loves.slice(0, 2).join(', '))}</small></div></div>`).join('')}</div>` : ''}
      ${hv.length ? `<div class="card-in"><h3>🧺 Harvest ready (your plantings)</h3>${hv.map((x) => `${U.icon(x.c.name, 'crop', 'xs')} ${esc(x.c.name)}`).join(', ')}</div>` : ''}
      ${goals.length ? `<div class="card-in"><h3>📝 Due today</h3>${goals.map((g) => `<div>${g.done ? '✅' : '⬜'} ${esc(g.title)}</div>`).join('')}</div>` : ''}
      ${cc.length ? `<details class="sect" open><summary>🎁 Community Center items in season (${cc.length})</summary><div class="sect-body chips">${cc.map((x) => `<span class="chip need" title="${esc(x.bundle.name)} · ${esc(x.bundle.room)}">${esc(x.item)} <small>${esc(x.bundle.name)}</small></span>`).join('')}</div></details>` : ''}
      <details class="sect" open><summary>🌱 Crops you can plant (${crops.length})</summary><div class="sect-body"><div class="tbl-wrap"><table class="tbl"><tr><th>Crop</th><th>Days</th><th>First harvest</th><th>Harvests</th><th></th></tr>${crops.map(({ c, p }) => `<tr><td>${U.icon(c.name, 'crop', 'xs')} ${esc(c.name)}</td><td>${c.days}${c.regrow ? ` (↻${c.regrow})` : ''}</td><td>${U.fmtShort(p.firstHarvest)}</td><td>×${p.harvests}</td><td><button class="btn xs" data-plant="${c.id}">Log planting</button></td></tr>`).join('') || '<tr><td colspan="5">Nothing outdoors can finish this season (Greenhouse / Ginger Island).</td></tr>'}</table></div></div></details>
      <details class="sect"><summary>🎣 Fish (${fish.length + rain.length})${need ? ` · ${[...fish, ...rain].filter((x) => need.some((n) => n.id === x.id)).length} you still need` : ''}</summary><div class="sect-body"><p><b>Any/sunny weather</b></p><div class="chips">${fish.map(fishChip).join('')}</div><p><b>Rain only</b></p><div class="chips">${rain.map(fishChip).join('') || '—'}</div></div></details>
      <div class="card-in"><h3>📝 Add a reminder for this day</h3><form id="goalForm" class="inline-form"><input name="t" placeholder="e.g. Give Abigail an amethyst" required><select name="p"><option value="normal">Normal</option><option value="high">★ High</option><option value="low">Low</option></select><button class="btn xs">Add</button></form></div>`;
  }
  const openDay = (f, day, rerender) => UI.modal(dayPanel(f, day), (m) => {
    U.$$('[data-d]', m).forEach((x) => x.addEventListener('click', () => { let n = day + +x.dataset.d; if (n < 1) n = 28; if (n > 28) n = 1; openDay(f, n, rerender); }));
    U.$('#goalForm', m).addEventListener('submit', (e) => { e.preventDefault(); St.addGoal(f, { title: e.target.t.value.trim(), priority: e.target.p.value, due: { year: view.year, season: view.season, day } }); U.toast('Reminder added'); UI.close(); });
    U.$$('[data-plant]', m).forEach((x) => x.addEventListener('click', () => { f.plantings.push({ crop: x.dataset.plant, n: 1, date: { year: view.year, season: view.season, day } }); St.touch(f); U.toast('Planting logged — harvest dates now show on the calendar 🧺'); UI.close(); }));
  });

  /* ---------------- seasonal overview ---------------- */
  function overview(f) {
    const season = view.season, d = { year: view.year, season, day: 1 }; const crops = L.cropsInSeason(season).sort((a, b) => b.sell / b.days - a.sell / a.days);
    const fish = L.fishAvailable({ season }, 'Sunny').concat(L.fishAvailable({ season }, 'Rainy').filter((x) => x.weather === 'Rainy')); const need = needFish(f);
    const forage = D.forage.filter((x) => x.seasons.includes(season) && !x.allSeasons); const fests = D.festivals.filter((x) => x.season === season), bds = D.villagers.filter((v) => v.season === season).sort((a, b) => a.day - b.day);
    const goals = f.goals.filter((g) => g.due && g.due.season === season && g.due.year === view.year); const cc = L.ccMissing(f).filter((x) => x.seasons && x.seasons.includes(season));
    return `<div class="widgets"><section class="widget span-2"><header><h2>🌱 Crops</h2></header><div class="w-body"><div class="tbl-wrap"><table class="tbl"><tr><th>Crop</th><th>Grows</th><th>Regrow</th><th>Sells</th><th>Seed</th><th>Plant by (day)</th></tr>${crops.map((c) => `<tr><td>${U.icon(c.name, 'crop', 'xs')} ${esc(c.name)}</td><td>${c.days}d</td><td>${c.regrow ? c.regrow + 'd' : '—'}</td><td>${gold(c.sell)}</td><td>${typeof c.seedPrice === 'number' && c.seedPrice ? gold(c.seedPrice) : '—'}</td><td>${lastSeasonOf(c, season) === season ? Math.max(0, 28 - c.days) : 'into ' + lastSeasonOf(c, season)}</td></tr>`).join('')}</table></div><p class="muted">“Plant by” is the last day to plant for a harvest before the crop dies (end of day 28).</p></div></section>
      <section class="widget"><header><h2>🎂 Birthdays</h2></header><div class="w-body">${bds.map((v) => `<div class="row">${U.portrait(v, 'sm')}<div><b>${esc(v.name)}</b> <small>${season.slice(0, 3)} ${v.day}</small><small>Loves ${esc(v.loves.slice(0, 2).join(', '))}</small></div></div>`).join('')}</div></section>
      <section class="widget"><header><h2>🎪 Festivals</h2></header><div class="w-body">${fests.map((x) => `<div class="row"><div><b>${esc(x.name)}</b> <small>${season.slice(0, 3)} ${x.days.join('–')} · ${esc(x.time)}</small><small>${esc(x.where)}</small></div></div>`).join('') || '<p class="muted">None.</p>'}</div></section>
      <section class="widget span-2"><header><h2>🎣 Fish this season (${fish.length})${need ? ` · ${fish.filter((x) => need.some((n) => n.id === x.id)).length} you still need` : ''}</h2></header><div class="w-body chips">${fish.map((x) => `<span class="chip ${need && need.some((n) => n.id === x.id) ? 'need' : ''}" title="${esc(x.location)} · ${U.fmtWindows(x.time)} · ${x.weather}">${U.icon(x.name, 'fish', 'xs')} ${esc(x.name)} <small>${gold(x.price)}</small></span>`).join('')}</div></section>
      <section class="widget"><header><h2>🍄 Forage</h2></header><div class="w-body chips">${forage.map((x) => `<span class="chip" title="${esc(x.where)}">${esc(x.name)} <small>${gold(x.price)}</small></span>`).join('')}</div></section>
      <section class="widget"><header><h2>🎁 Bundle items in season</h2></header><div class="w-body">${cc.length ? `<div class="chips">${cc.map((x) => `<span class="chip need">${esc(x.item)} <small>${esc(x.bundle.name)}</small></span>`).join('')}</div>` : `<p class="muted">${L.route(f) === 'joja' ? 'You’re on the Joja route — no bundles.' : 'No missing Community Center items come into season now (or none are known missing).'}</p>`}</div></section>
      <section class="widget"><header><h2>📝 Your goals this season</h2></header><div class="w-body">${goals.map((g) => `<div class="row">${g.done ? '✅' : '⬜'} <div><b>${esc(g.title)}</b><small>${U.fmtShort(g.due)}</small></div></div>`).join('') || '<p class="muted">None. Add reminders from a day on the calendar.</p>'}</div></section></div>`;
  }

  /* ---------------- prepare for next season ---------------- */
  const TIPS = { Spring: ['Clear debris and till fields before day 1.', 'Buy Parsnip/Potato/Cauliflower seeds; Strawberry seeds only at the Egg Festival (13th).'], Summer: ['Plant long-growing crops early (Melon, Starfruit, Blueberry).', 'Keep an eye on the weather for fishing.'], Fall: ['Plant Pumpkin and Cranberries early; Wheat and Corn carry over from Summer.', 'Forage Blackberries (8–11) and mushrooms.'], Winter: ['Outdoor crops are done — move to the Greenhouse, mines and fishing.', 'Stock Winter Seeds if you want Powdermelon.', 'The year ends on day 28: Kent returns in Year 2.'] };
  function prepare(f) {
    const cur = f.date, next = U.nextSeason(cur.season), ny = cur.season === 'Winter' ? cur.year + 1 : cur.year, key = `${ny}-${next}`; f.prepare = f.prepare || {}; const done = (f.prepare[key] = f.prepare[key] || {});
    const left = 28 - cur.day; const nd = { year: ny, season: next, day: 1 };
    const harvest = f.plantings.filter((p) => { const c = D.crops.find((x) => x.id === p.crop); return c && p.date.season === cur.season && p.date.year === cur.year; });
    const seeds = L.cropsInSeason(next).filter((c) => typeof c.seedPrice === 'number' && c.seedPrice > 0).sort((a, b) => b.sell / b.days - a.sell / a.days).slice(0, 5);
    const ccNext = L.ccMissing(f).filter((x) => x.seasons && x.seasons.includes(next)), ccNow = L.ccMissing(f).filter((x) => x.seasons && x.seasons.includes(cur.season) && !x.seasons.includes(next));
    const bds = D.villagers.filter((v) => v.season === next).sort((a, b) => a.day - b.day), fests = D.festivals.filter((x) => x.season === next);
    const goals = f.goals.filter((g) => !g.done && g.due && ((g.due.season === cur.season && g.due.year === cur.year) || (g.due.season === next && g.due.year === ny)));
    const items = [
      { id: 'h-all', sec: 'Finish this season', text: `Harvest every outdoor crop before midnight on ${cur.season} 28 (${U.plural(left, 'day')} left)`, sub: 'Crops that don’t grow in ' + next + ' die at the season change.' },
      ...harvest.map((p, i) => { const c = D.crops.find((x) => x.id === p.crop); return { id: 'h-' + i, sec: 'Finish this season', text: `Collect your ${c.name} (planted ${U.fmtShort(p.date)})`, sub: 'From the plantings you logged.' }; }),
      ...ccNow.slice(0, 8).map((x) => ({ id: 'ccn-' + U.slug(x.item + x.bundle.id), sec: 'Last chance for bundles', text: `${x.item} for ${x.bundle.name}`, sub: `Only in season in ${x.seasons.join('/')} — gone after ${cur.season}.` })),
      ...seeds.map((c) => ({ id: 'seed-' + c.id, sec: `Seeds for ${next}`, text: `${c.name} seeds — ${gold(c.seedPrice)} each`, sub: `${c.days} days${c.regrow ? ', regrows' : ''}, sells ${gold(c.sell)}. Buy at ${c.seedSource}.` })),
      ...ccNext.slice(0, 10).map((x) => ({ id: 'ccx-' + U.slug(x.item + x.bundle.id), sec: `Bundle items coming in ${next}`, text: `${x.item} → ${x.bundle.name}`, sub: x.known ? 'Missing according to your save.' : 'Marked missing (not read from a save).' })),
      ...bds.map((v) => ({ id: 'bd-' + v.id, sec: `Birthdays in ${next}`, text: `${v.name} — ${next} ${v.day}`, sub: `Loves ${v.loves.slice(0, 3).join(', ')}.` })),
      ...fests.map((x) => ({ id: 'fe-' + x.id, sec: `Festivals in ${next}`, text: `${x.name} — ${next} ${x.days.join('–')}`, sub: `${x.time} · ${x.where}.` })),
      ...goals.map((g) => ({ id: 'g-' + g.id, sec: 'Your goals', text: g.title, sub: `Due ${U.fmtShort(g.due)}.`, goal: g })),
      ...(TIPS[next] || []).map((t, i) => ({ id: 'tip-' + next + i, sec: 'Farm tasks', text: t })),
    ];
    const secs = [...new Set(items.map((i) => i.sec))], doneN = items.filter((i) => done[i.id] || (i.goal && i.goal.done)).length;
    return `<div class="widgets"><section class="widget span-2"><header><h2>Prepare for ${next}</h2></header><div class="w-body"><p>${U.plural(left, 'day')} left in ${cur.season}. <b>${doneN}/${items.length}</b> ticked.</p><div class="bar"><i style="width:${U.pct(doneN, items.length)}%"></i></div>${secs.map((s) => `<h4>${esc(s)}</h4>${items.filter((i) => i.sec === s).map((i) => `<label class="chk prep"><input type="checkbox" data-prep="${key}|${i.id}" ${done[i.id] || (i.goal && i.goal.done) ? 'checked' : ''}><span><b>${esc(i.text)}</b>${i.sub ? `<small>${esc(i.sub)}</small>` : ''}</span></label>`).join('')}`).join('')}<p class="muted">Built from your date, plantings, goals${f.facts ? ' and save (bundles)' : ''}. ${f.facts ? '' : 'Connect your save so bundle items can be included accurately.'}</p></div></section></div>`;
  }

  /* ---------------- page ---------------- */
  P.render = ({ parts }) => {
    const f = St.active();
    if (!f) return `<div class="page"><h1 class="px-h">Calendar</h1><div class="widget"><div class="w-body"><p>Create or connect a farm first so the calendar can follow your in-game date.</p><a class="btn" href="#/">Go to My Farm</a></div></div></div>`;
    if (view.farm !== f.id) { view.farm = f.id; view.follow = true; }
    if (view.follow || !view.season) { view.season = f.date.season; view.year = f.date.year; }
    const sub = parts[1] || 'month', season = view.season, fl = prefs();
    return `<div class="page cal"><h1 class="px-h">📅 Calendar</h1><div class="tabs"><a class="tab ${sub === 'month' ? 'on' : ''}" href="#/calendar">Month</a><a class="tab ${sub === 'season' ? 'on' : ''}" href="#/calendar/season">Seasonal overview</a><a class="tab ${sub === 'prepare' ? 'on' : ''}" href="#/calendar/prepare">Prepare for next season</a></div>
      ${sub === 'prepare' ? prepare(f) : `<div class="cal-head ${season}"><button class="btn xs" data-nav="-1" aria-label="Previous season">◀</button><div class="cal-title"><span>${{ Spring: '🌸', Summer: '☀️', Fall: '🍂', Winter: '❄️' }[season]}</span><b>${season}</b><small>Year ${view.year} · ${esc(f.name)}</small></div><button class="btn xs" data-nav="1" aria-label="Next season">▶</button><button class="btn xs ghost" data-nav="today">Today</button><div class="tabs inline">${SDV.SEASONS.map((s) => `<a class="tab ${s === season ? 'on' : ''}" data-season="${s}">${s.slice(0, 3)}</a>`).join('')}</div></div>
      ${sub === 'month' ? `<div class="cal-filters">${FILTERS.map(([k, l]) => `<label class="chk pill"><input type="checkbox" data-filter="${k}" ${fl[k] ? 'checked' : ''}> ${l}</label>`).join('')}<button class="btn xs ghost" data-only="all">Show everything</button></div><div class="chips"><small>Show only:</small>${FILTERS.slice(0, 6).map(([k, l]) => `<a class="chip btn" data-only="${k}">${l.split(' ')[0]} ${k}</a>`).join('')}</div><p class="muted">${esc(D.seasonNotes[season])}</p>${grid(f)}<div class="legend"><span>🎂 birthday</span><span>🎪 festival</span><span>🌱 last day to plant</span><span>🧺 your harvest</span><span>🎁 bundle items</span><span>📝 reminder</span><span>🎣 fish</span><span>☀️ weather (today live / tomorrow from save)</span></div><p class="muted">Weather is only shown when it is actually known: today’s from the live feed, tomorrow’s from your save. Click any day for details.</p>` : overview(f)}`}</div>`;
  };
  P.bind = (root, rerender, { parts }) => {
    const f = St.active(); if (!f) return; const on = (s, ev, fn) => U.$$(s, root).forEach((el) => el.addEventListener(ev, (e) => fn(el, e)));
    on('[data-nav]', 'click', (el) => { const n = el.dataset.nav; if (n === 'today') { view.follow = true; } else { view.follow = false; let i = SDV.SEASONS.indexOf(view.season) + +n; if (i < 0) { i = 3; view.year = Math.max(1, view.year - 1); } else if (i > 3) { i = 0; view.year++; } view.season = SDV.SEASONS[i]; } rerender(); });
    on('[data-season]', 'click', (el) => { view.follow = false; view.season = el.dataset.season; rerender(); });
    on('[data-filter]', 'change', (el) => { const p = St.prefs(); prefs(); p.calFilters[el.dataset.filter] = el.checked; St.save(); });
    on('[data-only]', 'click', (el) => { const p = St.prefs(); const k = el.dataset.only; prefs(); Object.keys(p.calFilters).forEach((x) => (p.calFilters[x] = k === 'all' ? true : x === k)); St.save(); });
    on('.cell', 'click', (el) => openDay(f, +el.dataset.day, rerender));
    on('[data-prep]', 'change', (el) => { const [key, id] = el.dataset.prep.split('|'); f.prepare[key] = f.prepare[key] || {}; f.prepare[key][id] = el.checked; if (id.startsWith('g-')) { const g = f.goals.find((x) => 'g-' + x.id === id); if (g) g.done = el.checked; } St.touch(f); });
  };
})();
