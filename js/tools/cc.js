/* Community Center planner (and Joja route view): bundles, missing items, where to get them, when they're in season, and calendar reminders. */
(function () {
  const D = SDV.data, U = SDV.util, { esc, gold } = U, L = SDV.logic, St = SDV.store, UI = SDV.ui;
  const view = { room: null, only: 'missing' };

  const source = (item) => {
    const n = item.toLowerCase().replace(/\s*[×x]\s*\d+$/i, '').replace(/\s*\((gold)\)$/i, '').trim();
    const c = D.crops.find((x) => x.name.toLowerCase() === n); if (c) return `Grow it: ${c.days} days; seeds from ${c.seedSource}${c.notes ? '. ' + c.notes : ''}`;
    const f = D.forage.find((x) => x.name.toLowerCase() === n); if (f) return `Forage: ${f.where}`;
    const fi = D.fish.find((x) => x.name.toLowerCase() === n); if (fi) return `Fish: ${fi.location} · ${U.fmtWindows(fi.time)} · ${fi.weather === 'Any' ? 'any weather' : fi.weather.toLowerCase()}`;
    const cp = D.crabpot.find((x) => x.name.toLowerCase() === n); if (cp) return `Crab pot (${cp.habitat.toLowerCase()})`;
    return 'See the wiki for where to get this';
  };
  const when = (item, d) => { const s = L.itemSeasons(item); const a = L.availability(s, d); return !s ? { txt: 'availability unknown', cls: '' } : a.now ? { txt: 'in season now', cls: 'ok' } : a.startsIn ? { txt: `in ${a.startsIn} days (${a.season})`, cls: 'soon' } : { txt: 'not seasonal', cls: '' }; };

  function jojaView(farm) {
    const f = farm.facts; const steps = [['JojaMember', 'Joja Membership', 5000], ['jojaCraftsRoom', 'Bridge Repair', 25000], ['jojaPantry', 'Greenhouse', 35000], ['jojaBoilerRoom', 'Minecarts', 15000], ['jojaFishTank', 'Panning', 20000], ['jojaVault', 'Bus Repair', 40000]];
    const rem = steps.filter(([k]) => !(f && f.mail.includes(k)) && !St.isChecked(farm, 'joja:' + k));
    return `<div class="widget"><div class="w-body"><div class="honest">You’re on the <b>JojaMart route</b>, so there are no bundles to deliver — just payments to Morris.</div>
      ${steps.map(([k, name, cost]) => { const done = (f && f.mail.includes(k)) || St.isChecked(farm, 'joja:' + k); return `<label class="ti chk ${done ? 'done' : ''}"><input type="checkbox" data-joja="${k}" ${f && f.mail.includes(k) ? 'checked disabled' : done ? 'checked' : ''}><span class="ti-main"><b>${name}</b> ${gold(cost)} ${f && f.mail.includes(k) ? '<span class="tag auto">auto</span>' : '<span class="tag manual">manual</span>'}</span></label>`; }).join('')}
      <p>Remaining: <b>${gold(rem.reduce((a, [, , c]) => a + c, 0))}</b> · you have <b>${gold(farm.money)}</b>${farm.money >= rem.reduce((a, [, , c]) => a + c, 0) && rem.length ? ' — you can afford everything left!' : ''}</p><p class="muted">Changed your mind? Set the route to “Community Center” on the Progress overview.</p></div></div>`;
  }

  SDV.tools.cc = {
    title: 'Community Center planner', icon: ['Community Center', 'bundle'], blurb: 'Every bundle, what is missing, where to get it, and when it is in season.',
    render: (farm) => {
      if (L.route(farm) === 'joja') return jojaView(farm);
      const bs = L.bundleState(farm), d = farm.date; const rooms = D.ccRooms; if (!view.room) view.room = rooms[0].id; const room = rooms.find((r) => r.id === view.room);
      const miss = L.ccMissing(farm), now = miss.filter((x) => x.seasons && x.seasons.includes(d.season)); const total = D.bundles.length, done = D.bundles.filter((b) => bs[b.id].done).length;
      const roomBundles = D.bundles.filter((b) => b.room === room.name);
      return `<div class="widget"><div class="w-body"><p><b>${done}/${total}</b> bundles done ${farm.facts ? '(read from your save where possible)' : '(tick items yourself — no save connected)'}.</p><div class="bar"><i style="width:${U.pct(done, total)}%"></i></div>
        ${L.route(farm) === 'undecided' ? '<div class="honest mt">You haven’t chosen a route yet. This planner assumes the Community Center; you can switch on the Progress page.</div>' : ''}
        <h4>Available right now (${d.season}) — ${now.length}</h4><div class="chips">${now.map((x) => `<span class="chip need" title="${esc(x.bundle.name)} · ${esc(x.bundle.room)}">${esc(x.item)} <small>${esc(x.bundle.name)}</small></span>`).join('') || '<small class="muted">No missing item is in season right now.</small>'}</div></div></div>
      <div class="tabs">${rooms.map((r) => { const bb = D.bundles.filter((b) => b.room === r.name); const dn = bb.filter((b) => bs[b.id].done).length; return `<a class="tab ${r.id === view.room ? 'on' : ''}" data-room="${r.id}">${r.name} ${dn}/${bb.length}</a>`; }).join('')}</div>
      <p class="muted">${esc(room.name)} reward: ${esc(room.reward)}. <label class="chk inline"><input type="checkbox" id="ccAll" ${view.only === 'all' ? 'checked' : ''}> show completed bundles</label></p>
      <div class="widgets">${roomBundles.filter((b) => view.only === 'all' || !bs[b.id].done).map((b) => { const st = bs[b.id]; return `<section class="widget"><header><h2>${esc(b.name)} ${st.done ? '✅' : ''}</h2></header><div class="w-body"><p class="muted">Need ${b.need} of ${b.items.length} · reward: ${esc(b.reward)} ${st.known ? '<span class="tag auto">save</span>' : '<span class="tag manual">manual</span>'}</p><div class="bar"><i style="width:${U.pct(st.have, b.need)}%"></i></div>
        ${b.room === 'Vault' ? `<p>${gold(parseInt(b.items[0].replace(/\D/g, ''), 10))} needed — you have ${gold(farm.money)}.</p>${st.known ? '' : `<label class="chk"><input type="checkbox" data-bundle="${b.id}" ${st.done ? 'checked' : ''}> Mark paid</label>`}` : b.items.map((it, i) => { const donated = st.known ? !st.missing.includes(it) || (st.missing.filter((m) => m === it).length === 0) : st.ticked[i]; const w = when(it, d); const isMissing = st.known ? st.missing.includes(it) && !(st.have >= b.need) : !st.ticked[i]; return `<div class="bi ${isMissing ? '' : 'got'}"><label class="chk"><input type="checkbox" data-bi="${b.id}:${i}" ${isMissing ? '' : 'checked'} ${st.known ? 'disabled' : ''}><span><b>${esc(it)}</b>${isMissing ? `<small>${esc(source(it))}</small>` : ''}</span></label>${isMissing ? `<span class="tag ${w.cls === 'ok' ? 'live' : w.cls === 'soon' ? 'manual' : ''}">${esc(w.txt)}</span><button class="btn xs ghost" data-remind="${esc(it)}|${b.id}" title="Add a reminder to your calendar">🔔</button>` : ''}</div>`; }).join('')}</div></section>`; }).join('') || '<p class="muted">Everything in this room is done! 🎉</p>'}</div>`;
    },
    bind: (root, rerender, farm) => {
      const on = (s, ev, fn) => U.$$(s, root).forEach((el) => el.addEventListener(ev, (e) => fn(el, e)));
      on('[data-room]', 'click', (el) => { view.room = el.dataset.room; rerender(); }); on('#ccAll', 'change', (el) => { view.only = el.checked ? 'all' : 'missing'; rerender(); });
      on('[data-bi]', 'change', (el) => { const [id, i] = el.dataset.bi.split(':'); St.toggle(farm, `bi:${id}:${i}`); }); on('[data-bundle]', 'change', (el) => St.toggle(farm, 'bundle:' + el.dataset.bundle)); on('[data-joja]', 'change', (el) => St.toggle(farm, 'joja:' + el.dataset.joja));
      on('[data-remind]', 'click', (el) => {
        const [item, bid] = el.dataset.remind.split('|'); const b = D.bundles.find((x) => x.id === bid); const s = L.itemSeasons(item); const a = L.availability(s, farm.date);
        const due = a.now ? { ...farm.date, day: 28 } : a.startsIn ? U.addDays(farm.date, a.startsIn) : { ...farm.date };
        St.addGoal(farm, { title: `Collect ${item} for ${b.name}`, note: `${b.room} bundle`, priority: 'normal', kind: 'bundle', due }); U.toast(`Reminder set for ${U.fmtShort(due)} — see it on your Calendar 📅`, 'good');
      });
    },
  };
})();
