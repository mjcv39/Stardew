/* Personal goals, notes & reminders */
(function () {
  const U = SDV.util, { esc } = U, St = SDV.store;
  const V = (SDV.views.goals = {});
  const TEMPLATES = [
    ['🎁 Birthday gift', 'Give a villager a birthday gift'], ['🏗️ Save for a building', 'Save 6,000g for a Barn'], ['🌱 Plant before season ends', 'Plant enough crops before the end of the season'],
    ['🎣 Catch a fish', 'Catch a Sturgeon'], ['📦 CC bundle', 'Complete a Community Center bundle'], ['🔧 Tool upgrade', 'Upgrade a tool before Winter'],
  ];
  let filter = 'open';

  V.render = () => {
    const f = St.active();
    if (!f) return `<div class="page"><h1 class="px-h">📝 Goals</h1><div class="card"><p>Create or import a farm first.</p><a class="px-btn" href="#/farms">Set up a farm →</a></div></div>`;
    const goals = f.goals.slice().sort((a, b) => (a.done - b.done) || (a.due ? U.absDay(a.due) : 1e9) - (b.due ? U.absDay(b.due) : 1e9));
    const list = goals.filter((g) => filter === 'all' || (filter === 'open' ? !g.done : g.done));
    const row = (g) => {
      const left = g.due ? U.daysBetween(f.date, g.due) : null;
      return `<div class="goal ${g.done ? 'done' : ''}"><label class="chk"><input type="checkbox" data-done="${g.id}" ${g.done ? 'checked' : ''}><span><b>${esc(g.title)}</b>${g.note ? `<small>${esc(g.note)}</small>` : ''}</span></label>${g.due ? `<span class="due ${!g.done && left < 0 ? 'late' : !g.done && left <= 3 ? 'warn' : ''}">${U.fmtDate(g.due)} · ${g.done ? 'done' : left < 0 ? `${-left}d overdue` : left === 0 ? 'today' : `in ${left}d`}</span>` : '<span class="due muted">no date</span>'}<button class="px-btn xs" data-del="${g.id}" aria-label="Delete goal">✖</button></div>`;
    };
    const d = f.date;
    return `<div class="page goals"><h1 class="px-h">📝 Goals & Reminders</h1><p class="lead">Goals with a date appear on your calendar and in dashboard deadlines.</p>
      <form id="gForm" class="card">
        <div class="tpls">${TEMPLATES.map(([l, t]) => `<button type="button" class="chip btn" data-tpl="${esc(t)}">${l}</button>`).join('')}</div>
        <div class="frow"><input name="title" placeholder="What do you want to remember?" required maxlength="120"><input name="note" placeholder="Notes (optional)" maxlength="200"></div>
        <div class="frow"><label class="flt"><span>Due season</span><select name="season"><option value="">No date</option>${SDV.SEASONS.map((s) => `<option ${s === d.season ? 'selected' : ''}>${s}</option>`).join('')}</select></label>
        <label class="flt"><span>Day</span><input name="day" type="number" min="1" max="28" value="${d.day}" style="width:70px"></label>
        <label class="flt"><span>Year</span><input name="year" type="number" min="1" value="${d.year}" style="width:70px"></label><button class="px-btn">Add goal</button></div>
      </form>
      <div class="tabs"><a class="tab ${filter === 'open' ? 'on' : ''}" data-f="open">Open</a><a class="tab ${filter === 'done' ? 'on' : ''}" data-f="done">Done</a><a class="tab ${filter === 'all' ? 'on' : ''}" data-f="all">All</a></div>
      <div class="card">${list.map(row).join('') || '<p class="muted">Nothing here yet.</p>'}</div></div>`;
  };
  V.bind = (root, rerender) => {
    const f = St.active(); if (!f) return;
    const form = U.$('#gForm', root);
    U.$$('[data-tpl]', root).forEach((b) => b.addEventListener('click', () => { form.title.value = b.dataset.tpl; form.title.focus(); form.title.select(); }));
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const g = { title: form.title.value.trim(), note: form.note.value.trim(), kind: 'custom' };
      if (form.season.value) g.due = { year: Math.max(1, +form.year.value || 1), season: form.season.value, day: Math.min(28, Math.max(1, +form.day.value || 1)) };
      St.addGoal(f, g); U.toast('Goal added'); rerender();
    });
    U.$$('[data-done]', root).forEach((c) => c.addEventListener('change', () => { St.goal(f, c.dataset.done).done = c.checked; St.save(); rerender(); }));
    U.$$('[data-del]', root).forEach((b) => b.addEventListener('click', () => { St.delGoal(f, b.dataset.del); rerender(); }));
    U.$$('[data-f]', root).forEach((a) => a.addEventListener('click', () => { filter = a.dataset.f; rerender(); }));
  };
})();
