/* Farm dashboard */
(function () {
  const D = SDV.data, U = SDV.util, { esc, icon, gold, badge } = U, L = SDV.logic, St = SDV.store;
  const V = (SDV.views.dashboard = {});
  let hour = 9; // fishing time-of-day the user is looking at

  // Is a tracker item done? (auto-detected from save, or manually ticked)
  SDV.isDone = (farm, item) => {
    const auto = item.auto && farm.facts ? item.auto(farm.facts) : undefined;
    return { done: auto === true || St.isChecked(farm, item.id), auto: auto === true, detectable: auto !== undefined };
  };
  SDV.progressOf = (farm, cat) => {
    let have = 0, total = 0;
    for (const it of cat.items) {
      if (it.coll) { const col = SDV.collection(farm, it.coll); have += col.filter((x) => x.auto || x.manual).length / col.length; total += 1; continue; }
      if (it.count) { const c = farm.facts ? it.count(farm.facts) : undefined; if (c) { have += Math.min(1, c[0] / c[1]); total += 1; continue; } have += St.isChecked(farm, it.id) ? 1 : 0; total += 1; continue; }
      const d = SDV.isDone(farm, it); have += d.done ? 1 : 0; total += 1;
    }
    return { have, total, pct: total ? Math.round((have / total) * 100) : 0 };
  };

  V.render = () => {
    const f = St.active();
    if (!f) return welcome();
    const d = f.date, wx = f.weather || 'Sunny';
    const todayB = L.birthdaysOn(d.season, d.day), todayF = L.festivalsOn(d.season, d.day);
    const bdays = L.upcoming(d, 14, (x) => L.birthdaysOn(x.season, x.day));
    const fests = L.upcoming(d, 28, (x) => L.festivalsOn(x.season, x.day)).filter((x, i, a) => i === 0 || a[i - 1].items[0].id !== x.items[0].id || x.in > a[i - 1].in + 1);
    const crops = L.cropsInSeason(d.season).map((c) => ({ c, p: L.plantInfo(c, d) })).filter((x) => x.p);
    const plantable = crops.filter((x) => x.p.canPlant).sort((a, b) => L.profitPerDay(b.c) - L.profitPerDay(a.c));
    const fish = L.fishAvailable(d, wx, hour).sort((a, b) => b.price - a.price);
    const daysLeft = 28 - d.day;
    // Deadlines: goals with due dates, season end, festivals
    const deadlines = [];
    for (const g of f.goals) if (!g.done && g.due) { const due = g.due; deadlines.push({ in: U.daysBetween(d, due), label: g.title, kind: '📝' }); }
    deadlines.push({ in: daysLeft, label: `${d.season} ends — harvest everything!`, kind: '🌾' });
    for (const x of fests.slice(0, 2)) deadlines.push({ in: x.in, label: x.items[0].name, kind: '🎪' });
    deadlines.sort((a, b) => a.in - b.in);
    // Next undone milestones
    const todo = [];
    for (const cat of D.tracker) for (const it of cat.items) { if (it.count) continue; const s = SDV.isDone(f, it); if (!s.done) todo.push({ cat, it, auto: s.detectable }); }
    const overall = D.tracker.map((c) => SDV.progressOf(f, c));
    const pctAll = Math.round(overall.reduce((a, b) => a + b.pct, 0) / overall.length);

    const auto = f.source === 'save';
    const bdayCard = (x) => `<a class="bday" href="#/item/villagers/${x.id}">${U.portrait(x, 'md')}<div><b>${esc(x.name)}</b><small>Loves: ${esc(x.loves.slice(0, 2).join(', '))}</small></div></a>`;
    return `<div class="page dash">
      <section class="hero-bar">
        <div><div class="eyebrow">${auto ? '<span class="tag auto">Auto-detected from save</span>' : '<span class="tag manual">Manual farm</span>'}</div>
        <h1 class="px-h">${esc(f.name)}</h1><p class="sub">${f.farmer ? `Farmer ${esc(f.farmer)} · ` : ''}${esc((D.farmTypes.find((x) => x.id === f.farmType) || {}).name || '')}</p></div>
        <div class="date-pill ${d.season}"><span>${SDV.SEASON_ICO[d.season]}</span><b>${d.season} ${d.day}</b><small>${U.dayOfWeek(d.day)} · Year ${d.year}</small></div>
        <div class="gold-pill">💰 ${gold(f.money)}<small>${auto ? 'from save' : 'manual'}${f.totalEarned ? ` · ${gold(f.totalEarned)} earned total` : ''}</small></div>
      </section>
      <section class="controls card flat">
        <span class="muted">Adjust (manual farms, or to preview):</span>
        <button class="px-btn sm" data-act="day" data-n="-1">◀ Day</button><button class="px-btn sm" data-act="day" data-n="1">Day ▶</button><button class="px-btn sm" data-act="day" data-n="7">+1 week</button><button class="px-btn sm" data-act="season">Next season ⏭</button>
        <label class="flt"><span>Weather</span><select id="wx"><option ${wx === 'Sunny' ? 'selected' : ''}>Sunny</option><option ${wx === 'Rainy' ? 'selected' : ''}>Rainy</option></select></label>
        <label class="flt"><span>Gold</span><input id="goldIn" type="number" min="0" value="${f.money}" style="width:110px"></label>
        ${auto ? '<span class="muted">Date/gold are overwritten when you re-import your save.</span>' : ''}
      </section>
      ${todayB.length || todayF.length ? `<section class="card alert">🎉 <b>Today:</b> ${todayB.map((x) => `It's <a href="#/item/villagers/${x.id}">${esc(x.name)}</a>'s birthday! Gift a loved item (${esc(x.loves.slice(0, 3).join(', '))}).`).join(' ')} ${todayF.map((x) => `<a href="#/item/festivals/${x.id}">${esc(x.name)}</a> (${esc(x.time)}, ${esc(x.where)})`).join(' ')}</section>` : ''}
      <div class="cols">
        <section class="card"><h2>🎂 Upcoming birthdays</h2>${bdays.length ? bdays.map((b) => `<div class="row"><span class="when">${b.in === 0 ? 'Today' : b.in === 1 ? 'Tomorrow' : `${b.in}d`}<small>${b.date.season.slice(0, 3)} ${b.date.day}</small></span>${b.items.map(bdayCard).join('')}</div>`).join('') : '<p class="muted">No birthdays in the next 2 weeks.</p>'}</section>
        <section class="card"><h2>🎪 Upcoming festivals & events</h2>${fests.length ? fests.slice(0, 4).map((x) => `<div class="row"><span class="when">${x.in === 0 ? 'Today' : `${x.in}d`}<small>${x.date.season.slice(0, 3)} ${x.date.day}</small></span><a href="#/item/festivals/${x.items[0].id}"><b>${esc(x.items[0].name)}</b><small>${esc(x.items[0].time)} · ${esc(x.items[0].where)}</small></a></div>`).join('') : '<p class="muted">Nothing in the next 28 days.</p>'}</section>
        <section class="card"><h2>⏰ Deadlines</h2>${deadlines.slice(0, 6).map((x) => `<div class="row"><span class="when ${x.in <= 3 ? 'warn' : ''}">${x.in < 0 ? 'Overdue' : x.in === 0 ? 'Today' : `${x.in}d`}</span><span>${x.kind} ${esc(x.label)}</span></div>`).join('')}<a class="more" href="#/goals">Manage goals →</a></section>
      </div>
      <div class="cols two">
        <section class="card"><h2>🌱 Crops — ${d.season}</h2>
          <p class="muted">${daysLeft} day${daysLeft === 1 ? '' : 's'} left in ${d.season}. <b>${plantable.length}</b> of ${crops.length} in-season crops can still be planted for a harvest.</p>
          <div class="tbl-wrap"><table class="tbl compact"><tr><th>Crop</th><th>Grows</th><th>Sells</th><th>Plant by</th><th>Harvests</th></tr>
          ${crops.sort((a, b) => b.p.canPlant - a.p.canPlant || L.profitPerDay(b.c) - L.profitPerDay(a.c)).slice(0, 14).map(({ c, p }) => `<tr class="${p.canPlant ? '' : 'dim'}"><td>${icon(c.name, 'crop', 'xs')} <a href="#/item/crops/${c.id}">${esc(c.name)}</a></td><td>${c.days}d${c.regrow ? ` ↻${c.regrow}` : ''}</td><td>${gold(c.sell)}</td><td>${p.canPlant ? U.fmtDate(U.addDays(d, p.lastPlantDay - d.day)).replace(/, Year.*/, '') : '—'}</td><td>${p.canPlant ? '×' + p.harvests : '✖'}</td></tr>`).join('')}</table></div>
          <a class="more" href="#/wiki/farming">All crops →</a></section>
        <section class="card"><h2>🎣 Fish right now</h2>
          <div class="fish-ctl"><label>Time: <b id="hrLbl">${U.fmtTime(hour)}</b> <input id="hr" type="range" min="6" max="25" value="${hour}"></label><span class="muted">${d.season} · ${wx}</span></div>
          <div class="grid sm">${fish.slice(0, 16).map((x) => `<a class="card entry mini" href="#/item/fish/${x.id}">${icon(x.name, 'fish', 'md')}<div class="entry-t"><b>${esc(x.name)}</b><small>${gold(x.price)} · ${esc(x.location.split(',')[0])}</small></div></a>`).join('') || '<p class="muted">Nothing available.</p>'}</div>
          <p class="muted">${fish.length} fish available. <a href="#/wiki/fishing">All fish →</a></p></section>
      </div>
      <div class="cols two">
        <section class="card"><h2>🧭 Next milestones <small class="muted">(${pctAll}% overall)</small></h2>
          ${todo.slice(0, 8).map((x) => `<div class="row"><span>${x.cat.icon}</span><span>${esc(x.it.label)} ${x.auto ? '' : '<span class="tag manual sm">manual</span>'}</span></div>`).join('')}<a class="more" href="#/tracker">Open progress tracker →</a></section>
        <section class="card"><h2>📈 Progress</h2>${D.tracker.map((c, i) => `<div class="prog"><span>${c.icon} ${c.title}</span><div class="bar"><i style="width:${overall[i].pct}%;background:${c.color}"></i></div><b>${overall[i].pct}%</b></div>`).join('')}
          ${f.facts ? `<div class="skills">${Object.entries(f.facts.skills).map(([k, v]) => `<span class="chip">${k} ${v}</span>`).join('')}</div>` : ''}</section>
      </div>
      <p class="center"><a class="px-btn" href="#/calendar">📅 Open the full calendar</a></p>
    </div>`;
  };

  function welcome() {
    return `<div class="page welcome"><div class="hero-bar"><div><h1 class="px-h">Welcome, Farmer! 🌻</h1><p class="lead">Pelican Companion is a wiki, calendar and progress tracker that adapts to <i>your</i> farm. Your save never leaves your device.</p></div></div>
    <div class="cols two"><section class="card"><h2>📂 Import a save file</h2><p>Pick your save file — it is read locally in your browser and only a small summary is stored on this device.</p><a class="px-btn" href="#/farms">Import a save →</a></section>
    <section class="card"><h2>✍️ Start a manual farm</h2><p>Don't want to import? Create a farm and set the date, gold and progress by hand.</p><button class="px-btn" id="newManual">Create manual farm</button></section></div>
    <p class="center"><a href="#/wiki">…or just browse the wiki</a></p></div>`;
  }

  V.bind = (root, rerender) => {
    const f = St.active();
    U.$$('[data-act=day]', root).forEach((b) => b.addEventListener('click', () => { f.date = U.addDays(f.date, +b.dataset.n); St.save(); rerender(); }));
    const ns = U.$('[data-act=season]', root); if (ns) ns.addEventListener('click', () => { f.date = { year: f.date.year + (f.date.season === 'Winter' ? 1 : 0), season: SDV.SEASONS[(SDV.SEASONS.indexOf(f.date.season) + 1) % 4], day: 1 }; St.save(); rerender(); });
    const wx = U.$('#wx', root); if (wx) wx.addEventListener('change', () => { f.weather = wx.value; St.save(); rerender(); });
    const gi = U.$('#goldIn', root); if (gi) gi.addEventListener('change', () => { f.money = Math.max(0, +gi.value || 0); St.save(); rerender(); });
    const hr = U.$('#hr', root); if (hr) hr.addEventListener('change', () => { hour = +hr.value; rerender(); }), hr && hr.addEventListener('input', () => (U.$('#hrLbl', root).textContent = U.fmtTime(+hr.value)));
    const nm = U.$('#newManual', root); if (nm) nm.addEventListener('click', () => { St.newManual('My Farm'); rerender(); });
  };
})();
