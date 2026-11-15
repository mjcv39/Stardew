/* Daily planner: today's tasks from your real farm state + your own goals and tasks, with check-offs that persist per in-game day. */
(function () {
  const U = SDV.util, { esc } = U, L = SDV.logic, St = SDV.store;
  const day = (farm) => { const k = String(U.absDay(farm.date)); farm.daily[k] = farm.daily[k] || { done: {}, custom: [] }; return farm.daily[k]; };

  SDV.tools.daily = {
    title: 'Daily planner', icon: ['Calendar', 'festival'], blurb: 'Today’s to-do list from your season, weather, progress and goals — plus your own tasks.',
    render: (farm) => {
      const d = day(farm), cur = farm.date, wx = farm.weather || 'Sunny'; const live = SDV.live.isLive(farm) && farm.live && farm.live.weather;
      const recs = SDV.recs.today(farm).slice(0, 10); const due = farm.goals.filter((g) => !g.done && g.due && U.daysBetween(cur, g.due) <= 0);
      const row = (id, title, sub, tag, extra = '') => `<label class="task ${d.done[id] ? 'done' : ''}"><input type="checkbox" data-task="${esc(id)}" ${d.done[id] ? 'checked' : ''}><span><b>${esc(title)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</span>${tag}${extra}</label>`;
      const all = [...recs.map((r) => r.id), ...due.map((g) => 'g-' + g.id), ...d.custom.map((c) => c.id)]; const doneN = all.filter((id) => d.done[id]).length;
      return `<div class="widget"><div class="w-body"><div class="day-head"><div><b>${U.fmtDate(cur)}</b> <small>${U.dayOfWeek(cur.day)}</small></div><span class="chip">${wx === 'Rainy' ? '🌧 Rainy' : wx === 'Snowy' ? '❄ Snowy' : '☀ Sunny'} <small>${live ? 'live today' : farm.facts ? 'forecast from save' : 'entered by you'}</small></span><span class="chip">${28 - cur.day} days left in ${cur.season}</span></div>
        <p>${doneN}/${all.length} done</p><div class="bar"><i style="width:${U.pct(doneN, all.length)}%"></i></div>
        <h4>From your farm</h4>${recs.map((r) => row(r.id, r.title, r.detail, `<span class="tag ${r.basis === 'save' ? 'auto' : r.basis === 'manual' ? 'manual' : 'cal'}">${r.basis === 'calendar' ? 'date' : r.basis === 'save' ? 'save' : 'manual'}</span>`)).join('') || '<p class="muted">Nothing specific today.</p>'}
        ${due.length ? `<h4>Your goals due</h4>${due.map((g) => row('g-' + g.id, g.title, g.note || (U.daysBetween(cur, g.due) < 0 ? 'overdue' : 'due today'), '<span class="tag manual">goal</span>')).join('')}` : ''}
        <h4>Your tasks for today</h4>${d.custom.map((c) => row(c.id, c.text, '', '<span class="tag manual">mine</span>', `<button type="button" class="btn xs ghost" data-del="${c.id}" aria-label="Delete task">✕</button>`)).join('')}
        <form id="tForm" class="inline-form"><input name="t" placeholder="Add your own task…" maxlength="100" required><button class="btn xs">Add</button></form>
        ${farm.facts ? '' : '<p class="muted">Connect a save and this list also covers fish you still need, bundle items in season, upgrades you can afford and villagers to visit.</p>'}</div></div>`;
    },
    bind: (root, rerender, farm) => {
      const d = day(farm); const on = (s, ev, fn) => U.$$(s, root).forEach((el) => el.addEventListener(ev, (e) => fn(el, e)));
      on('[data-task]', 'change', (el) => { const id = el.dataset.task; d.done[id] = el.checked; if (id.startsWith('g-')) { const g = farm.goals.find((x) => 'g-' + x.id === id); if (g) g.done = el.checked; } St.touch(farm); });
      on('[data-del]', 'click', (el, e) => { e.preventDefault(); d.custom = d.custom.filter((c) => c.id !== el.dataset.del); St.touch(farm); });
      on('#tForm', 'submit', (el, e) => { e.preventDefault(); d.custom.push({ id: 'c-' + U.uid(), text: e.target.t.value.trim() }); St.touch(farm); });
    },
  };
})();
