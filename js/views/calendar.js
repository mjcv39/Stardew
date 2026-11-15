/* Interactive seasonal calendar */
(function () {
  const D = SDV.data, U = SDV.util, { esc, icon, gold } = U, L = SDV.logic, St = SDV.store;
  const V = (SDV.views.calendar = {});
  const view = { season: null, year: null };
  const FILTERS = [['birthdays', '🎂 Birthdays'], ['festivals', '🎪 Festivals'], ['crops', '🌱 Crops'], ['fish', '🎣 Fish'], ['goals', '📝 Goals'], ['events', '🔔 Reminders']];

  const farmOrDefault = () => St.active() || { date: { year: 1, season: 'Spring', day: 1 }, goals: [], plantings: [], name: 'Preview (no farm)', ghost: true };
  const sameDate = (a, b) => a.year === b.year && a.season === b.season && a.day === b.day;
  const goalsOn = (f, d) => (f.goals || []).filter((g) => g.due && sameDate(g.due, d));
  // harvest dates for logged plantings
  function harvestsOn(f, d) {
    const out = [];
    for (const p of f.plantings || []) {
      const c = D.crops.find((x) => x.id === p.crop); if (!c) continue;
      let t = U.absDay(p.date) + c.days; const endAbs = U.absDay({ ...p.date, season: lastSeason(c, p.date.season), day: 28 });
      while (t <= endAbs) { if (t === U.absDay(d)) { out.push({ c, n: p.n }); break; } if (!c.regrow) break; t += c.regrow; }
    }
    return out;
  }
  function lastSeason(c, s) { let i = SDV.SEASONS.indexOf(s); while (c.seasons.includes(SDV.SEASONS[(i + 1) % 4]) && (i - SDV.SEASONS.indexOf(s) < 3)) i++; return SDV.SEASONS[i % 4]; }

  V.render = () => {
    const f = farmOrDefault(); const cur = f.date;
    if (!view.season) { view.season = cur.season; view.year = cur.year; }
    const prefs = St.pref('cal'); const season = view.season;
    const cropLastDay = {}; // day -> crops whose last plant day is that day
    for (const c of L.cropsInSeason(season).filter((c) => c.seasons[c.seasons.length - 1] === season || !c.seasons.includes(SDV.SEASONS[(SDV.SEASONS.indexOf(season) + 1) % 4]))) { const ld = 28 - c.days; if (ld >= 1) (cropLastDay[ld] = cropLastDay[ld] || []).push(c); }
    const seasonFish = L.fishAvailable({ season }, 'Sunny');
    let cells = '';
    for (let day = 1; day <= 28; day++) {
      const d = { year: view.year, season, day };
      const isToday = !f.ghost && sameDate(d, cur); const past = !f.ghost && U.daysBetween(cur, d) < 0;
      const b = prefs.birthdays ? L.birthdaysOn(season, day) : [], fe = prefs.festivals ? L.festivalsOn(season, day) : [];
      const g = prefs.goals ? goalsOn(f, d) : [], hv = prefs.crops ? harvestsOn(f, d) : [];
      const cr = prefs.crops ? cropLastDay[day] || [] : [];
      const sp = prefs.events ? D.specialDays.filter((s) => s.season === season && s.day === day) : [];
      cells += `<button class="cell ${isToday ? 'today' : ''} ${past ? 'past' : ''} ${b.length || fe.length ? 'hot' : ''}" data-day="${day}" aria-label="${season} ${day}">
        <span class="dnum">${day}</span><span class="dow">${U.dayOfWeek(day)}</span>
        <span class="marks">${b.map((x) => U.portrait(x, 'cal')).join('')}${fe.map((x) => `<span class="mk fest" title="${esc(x.name)}">🎪</span>`).join('')}${g.length ? `<span class="mk goal" title="${g.length} goal(s)">📝${g.length > 1 ? g.length : ''}</span>` : ''}${hv.length ? `<span class="mk harv" title="Harvest ready">🧺${hv.length}</span>` : ''}${cr.length ? `<span class="mk crop" title="Last day to plant: ${esc(cr.map((c) => c.name).join(', '))}">🌱${cr.length}</span>` : ''}${prefs.fish ? `<span class="mk fish" title="${seasonFish.length} fish">🐟${seasonFish.length}</span>` : ''}${sp.length ? '<span class="mk ev">🔔</span>' : ''}</span>
        ${fe.length ? `<span class="fest-name">${esc(fe[0].name)}</span>` : b.length ? `<span class="fest-name">${esc(b.map((x) => x.name).join(', '))}</span>` : ''}</button>`;
    }
    return `<div class="page cal"><h1 class="px-h">📅 Calendar</h1>
      <div class="cal-head ${season}">
        <button class="px-btn sm" data-nav="-1" aria-label="Previous season">◀</button>
        <div class="cal-title"><span>${SDV.SEASON_ICO[season]}</span><b>${season}</b><small>Year ${view.year}${f.ghost ? ' · preview' : ` · ${esc(f.name)}`}</small></div>
        <button class="px-btn sm" data-nav="1" aria-label="Next season">▶</button>
        <button class="px-btn sm" data-nav="today">Today</button>
        <div class="tabs inline">${SDV.SEASONS.map((s) => `<a class="tab ${s === season ? 'on' : ''}" data-season="${s}">${SDV.SEASON_ICO[s]}</a>`).join('')}</div>
      </div>
      <div class="cal-filters">${FILTERS.map(([k, l]) => `<label class="chk pill"><input type="checkbox" data-filter="${k}" ${prefs[k] ? 'checked' : ''}> ${l}</label>`).join('')}</div>
      <p class="muted">${esc(D.seasonNotes[season])}</p>
      <div class="cal-grid" role="grid">${cells}</div>
      <div class="legend"><span>🎂 birthday</span><span>🎪 festival</span><span>🌱 last day to plant</span><span>🧺 your harvest</span><span>📝 goal</span><span>🔔 reminder</span><span>🐟 fish count</span></div>
      ${f.ghost ? '<p class="card flat">Create or import a farm to see today highlighted and add personal goals. <a href="#/farms">Set up →</a></p>' : ''}
    </div>`;
  };

  function dayModal(day) {
    const f = farmOrDefault(); const season = view.season; const d = { year: view.year, season, day };
    const b = L.birthdaysOn(season, day), fe = L.festivalsOn(season, day), sp = D.specialDays.filter((s) => s.season === season && s.day === day);
    const fish = L.fishAvailable({ season }, 'Sunny'); const rainOnly = L.fishAvailable({ season }, 'Rainy').filter((x) => x.weather === 'Rainy');
    const sunOnly = fish.filter((x) => x.weather === 'Sunny'); const anyW = fish.filter((x) => x.weather === 'Any');
    const crops = L.cropsInSeason(season).map((c) => ({ c, p: L.plantInfo(c, d) })).filter((x) => x.p && x.p.canPlant);
    const hv = harvestsOn(f, d), goals = goalsOn(f, d);
    const fishRow = (x) => `<a class="chip" href="#/item/fish/${x.id}">${icon(x.name, 'fish', 'xs')} ${esc(x.name)} <small>${U.fmtWindows(x.time)}</small></a>`;
    return `<h2>${SDV.SEASON_ICO[season]} ${season} ${day} <small>${U.dayOfWeek(day)}</small></h2>
      <div class="mnav"><button class="px-btn sm" data-d="-1">◀ prev day</button><button class="px-btn sm" data-d="1">next day ▶</button></div>
      ${b.map((x) => `<div class="card flat"><div class="hero">${U.portrait(x, 'xl')}<div><h3>🎂 ${esc(x.name)}'s birthday</h3><p>💖 Loves: ${x.loves.map((i) => SDV.search.link(i)).join(', ')}</p><p>👍 Likes: ${esc(x.likes.slice(0, 5).join(', ') || '—')}</p><a href="#/item/villagers/${x.id}" data-close>Open profile →</a></div></div></div>`).join('')}
      ${fe.map((x) => `<div class="card flat"><h3>🎪 ${esc(x.name)}</h3><p>${esc(x.time)} · ${esc(x.where)}</p><p>${esc(x.notes)}</p>${x.tips ? `<p><b>Tip:</b> ${esc(x.tips)}</p>` : ''}</div>`).join('')}
      ${sp.map((x) => `<div class="card flat">🔔 ${esc(x.text)}</div>`).join('')}
      ${hv.length ? `<div class="card flat"><h3>🧺 Harvest ready</h3>${hv.map((x) => `${icon(x.c.name, 'crop', 'xs')} ${esc(x.c.name)} ×${x.n}`).join(', ')}</div>` : ''}
      ${goals.length ? `<div class="card flat"><h3>📝 Goals due</h3>${goals.map((g) => `<div>${g.done ? '✅' : '⬜'} ${esc(g.title)}</div>`).join('')}</div>` : ''}
      <details class="sect" open><summary>🌱 Crops you can plant (${crops.length})</summary><div class="sect-body">
        <div class="tbl-wrap"><table class="tbl compact"><tr><th>Crop</th><th>Days</th><th>First harvest</th><th>Harvests</th><th></th></tr>${crops.map(({ c, p }) => `<tr><td>${icon(c.name, 'crop', 'xs')} <a href="#/item/crops/${c.id}" data-close>${esc(c.name)}</a></td><td>${c.days}${c.regrow ? ` (↻${c.regrow})` : ''}</td><td>${U.fmtDate(p.firstHarvest).replace(/, Year.*/, '')}</td><td>×${p.harvests}</td><td>${f.ghost ? '' : `<button class="px-btn xs" data-plant="${c.id}">Plant</button>`}</td></tr>`).join('') || '<tr><td colspan=5>No crops in season (use Greenhouse / Ginger Island).</td></tr>'}</table></div></div></details>
      <details class="sect"><summary>🎣 Fish this day (${fish.length + rainOnly.length})</summary><div class="sect-body"><p><b>Any weather:</b></p><div class="chips">${anyW.map(fishRow).join('')}</div><p><b>Sunny only:</b></p><div class="chips">${sunOnly.map(fishRow).join('') || '—'}</div><p><b>Rain only:</b></p><div class="chips">${rainOnly.map(fishRow).join('') || '—'}</div></div></details>
      ${f.ghost ? '' : `<div class="card flat"><h3>📝 Add a goal for this day</h3><form id="goalForm" class="inline-form"><input name="t" placeholder="e.g. Give Abigail an amethyst" required><button class="px-btn sm">Add</button></form></div>`}`;
  }

  V.bind = (root, rerender) => {
    const f = farmOrDefault();
    U.$$('[data-nav]', root).forEach((b) => b.addEventListener('click', () => {
      const n = b.dataset.nav;
      if (n === 'today') { view.season = f.date.season; view.year = f.date.year; }
      else { let i = SDV.SEASONS.indexOf(view.season) + +n; if (i < 0) { i = 3; view.year = Math.max(1, view.year - 1); } else if (i > 3) { i = 0; view.year++; } view.season = SDV.SEASONS[i]; }
      rerender();
    }));
    U.$$('[data-season]', root).forEach((a) => a.addEventListener('click', () => { view.season = a.dataset.season; rerender(); }));
    U.$$('[data-filter]', root).forEach((c) => c.addEventListener('change', () => { const p = St.pref('cal'); p[c.dataset.filter] = c.checked; St.setPref('cal', p); rerender(); }));
    U.$$('.cell', root).forEach((c) => c.addEventListener('click', () => openDay(+c.dataset.day, rerender)));
  };
  function openDay(day, rerender) {
    const f = farmOrDefault();
    SDV.modal(dayModal(day), (m) => {
      U.$$('[data-d]', m).forEach((b) => b.addEventListener('click', () => { let n = day + +b.dataset.d; if (n < 1) n = 28; if (n > 28) n = 1; openDay(n, rerender); }));
      const form = U.$('#goalForm', m);
      if (form) form.addEventListener('submit', (e) => { e.preventDefault(); St.addGoal(f, { title: form.t.value.trim(), due: { year: view.year, season: view.season, day }, kind: 'custom' }); U.toast('Goal added'); SDV.closeModal(); rerender(); });
      U.$$('[data-plant]', m).forEach((b) => b.addEventListener('click', () => { f.plantings = f.plantings || []; f.plantings.push({ crop: b.dataset.plant, n: 1, date: { year: view.year, season: view.season, day } }); St.save(); U.toast('Planting logged — harvest dates now show on the calendar 🧺'); SDV.closeModal(); rerender(); }));
    });
  }
})();
