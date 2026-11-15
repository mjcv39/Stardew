/* Progress — overview, category checklists, Perfection tracker, villager profiles. */
(function () {
  const D = SDV.data, U = SDV.util, { esc } = U, L = SDV.logic, St = SDV.store, UI = SDV.ui, PR = SDV.progress;
  const P = (SDV.pages.progress = {});
  const openL = new Set(), view = { filter: 'all', q: '' };
  const bar = (pct, color) => `<div class="bar"><i style="width:${pct}%;${color ? 'background:' + color : ''}"></i></div>`;
  const spr = (ic) => { const [n, c] = ic; return U.icon(n, c, 'md'); };
  const noFarm = (t) => `<div class="page"><h1 class="px-h">${t}</h1><div class="widget"><div class="w-body"><p>Create or connect a farm first — this page is built from your farm’s data.</p><a class="btn" href="#/">Go to My Farm</a></div></div></div>`;
  const stateTag = (it) => it.done ? (it.auto ? '<span class="tag auto">auto ✓</span>' : '<span class="tag manual">manual ✓</span>') : it.detectable ? '<span class="tag">not detected yet</span>' : '<span class="tag manual">manual only</span>';

  /* ---------- overview ---------- */
  const overview = (farm) => {
    const o = PR.overall(farm), route = L.route(farm), next = PR.nextSteps(farm, 6);
    return `<div class="page progress"><div class="hero-card"><div class="moss-big">${SDV.art.moss(o.pct >= 50 ? 'wow' : 'happy')}</div><div class="hero-t"><span class="eyebrow">Progress · ${esc(farm.name)}</span><h1>${o.pct}% of your journey</h1>${bar(o.pct)}<p class="muted">${farm.facts ? 'Auto-detected items come from your save; anything it can’t prove is yours to tick.' : 'Manual farm — tick things off yourself, or connect your save for automatic detection.'}</p></div>
      <label class="flt">Story route<select id="routeSel"><option value="auto" ${!farm.route || farm.route === 'auto' ? 'selected' : ''}>Auto (${route === 'undecided' ? 'not chosen yet' : route === 'cc' ? 'Community Center' : 'Joja'})</option><option value="cc" ${farm.route === 'cc' ? 'selected' : ''}>Community Center</option><option value="joja" ${farm.route === 'joja' ? 'selected' : ''}>JojaMart</option></select></label></div>
    <div class="cat-grid">${o.cats.map((c) => `<a class="catcard" href="#/progress/${c.id}" style="--c:${c.color}"><span class="cc-ico">${spr(c.icon)}</span><div><b>${c.title}</b><small>${c.blurb}</small>${bar(c.pct, c.color)}<small><b>${c.pct}%</b> · ${c.doneCount}/${c.liveCount} done${c.remaining.length ? ` · ${c.remaining.length} to go` : ''}</small></div></a>`).join('')}
      <a class="catcard" href="#/progress/perfection" style="--c:#e0a0aa"><span class="cc-ico">${U.icon('Star', 'achievement', 'md')}</span><div><b>Perfection</b><small>Weighted progress toward 100%.</small>${bar(o.perfection.total, '#e0a0aa')}<small><b>${o.perfection.total}%</b>${o.perfection.knownWeight < 100 ? ` · ${100 - o.perfection.knownWeight}% of it can’t be read without a save` : ''}</small></div></a>
      <a class="catcard" href="#/progress/villagers" style="--c:#d9a3a8"><span class="cc-ico">${U.portrait(D.villagers[0], 'md')}</span><div><b>Villagers</b><small>A profile for every villager: hearts, gifts, events.</small><small><b>${D.villagers.filter((v) => (PR.hearts(farm, v.name) || 0) >= 5).length}</b> of ${D.villagers.length} at 5+ hearts</small></div></a></div>
    <section class="widget"><header><h2>Next steps</h2></header><div class="w-body">${next.length ? next.map(({ cat, item }) => `<div class="row"><span class="rec-ico">${U.icon(cat.icon[0], cat.icon[1], 'sm')}</span><div><b>${esc(item.label)}</b><small>${esc(item.how || '')}</small></div><a class="btn xs ghost" href="#/progress/${cat.id}">Open</a></div>`).join('') : '<p class="muted">Nothing outstanding that I can see. 🌟</p>'}</div></section></div>`;
  };

  /* ---------- a category ---------- */
  const matches = (txt) => !view.q || txt.toLowerCase().includes(view.q.toLowerCase());
  const itemHtml = (it) => {
    if (it.list) {
      const rows = it.rows.filter((r) => matches(r.name) && (view.filter === 'all' || (view.filter === 'todo' && !r.done) || (view.filter === 'done' && r.done) || (view.filter === 'auto' && r.auto && r.done) || (view.filter === 'manual' && (r.manualDone || !r.auto))));
      return `<details class="trk-list" data-lid="${it.id}" ${openL.has(it.id) || view.q ? 'open' : ''}><summary><b>${esc(it.label)}</b><span class="spacer"></span>${bar(Math.round(it.frac * 100))}<span class="count">${it.have}/${it.total}</span></summary>${it.note ? `<p class="muted">${esc(it.note)}</p>` : ''}<div class="coll">${rows.map((r) => `<label class="cl ${r.done ? 'got' : ''}" title="${esc(r.how || '')}"><input type="checkbox" data-coll="${esc((it.key || it.id) + ':' + r.id)}" ${r.done ? 'checked' : ''} ${r.auto && r.done && !r.manualDone ? 'disabled' : ''} ${it.own ? 'disabled' : ''}><span><b>${esc(r.name)}</b>${r.done ? '' : `<small>${esc(r.how || '')}</small>`}${r.wiki && !r.done ? ` <a href="${U.wikiUrl(r.wiki)}" target="_blank" rel="noopener" class="wl">wiki ↗</a>` : ''}</span></label>`).join('') || '<p class="muted">Nothing matches.</p>'}</div></details>`;
    }
    const show = view.filter === 'all' || (view.filter === 'todo' && !it.done) || (view.filter === 'done' && it.done) || (view.filter === 'auto' && it.auto) || (view.filter === 'manual' && !it.auto);
    if (!show || !matches(it.label + ' ' + (it.how || ''))) return '';
    return `<div class="ti ${it.done ? 'done' : ''}"><label class="chk"><input type="checkbox" data-tick="${it.id}" ${it.done ? 'checked' : ''} ${it.auto || it.info ? 'disabled' : ''}><span class="ti-main"><b>${esc(it.label)}</b> ${it.info ? '<span class="tag auto">from save</span>' : stateTag(it)}</span></label>${it.count && it.count[1] ? `<div class="ti-bar">${bar(Math.round((it.count[0] / it.count[1]) * 100))}<small>${it.count[0]}/${it.count[1]}${it.countLabel ? ' ' + esc(it.countLabel) : ''}</small></div>` : ''}${it.done ? '' : `<p class="how">${esc(it.how || '')}</p>`}</div>`;
  };
  const category = (farm, id) => {
    const c = PR.byId(farm, id); if (!c) return '<div class="page"><h1>Not found</h1></div>';
    const act = c.items.filter((i) => !i.na), na = c.items.filter((i) => i.na); const f = view.filter;
    return `<div class="page progress"><div class="crumb"><a href="#/progress">Progress</a> › ${c.title}</div><div class="hero-card" style="--c:${c.color}"><span class="cc-ico">${spr(c.icon)}</span><div class="hero-t"><h1>${c.title}</h1><p>${c.blurb}</p>${bar(c.pct, c.color)}<small><b>${c.pct}%</b> · ${c.doneCount}/${c.liveCount} complete</small></div></div>
      <div class="toolbar"><input type="search" id="q" placeholder="Search this list…" value="${esc(view.q)}"><div class="tabs">${[['all', 'All'], ['todo', 'To do'], ['done', 'Done'], ['auto', 'Auto'], ['manual', 'Manual']].map(([k, l]) => `<a class="tab ${f === k ? 'on' : ''}" data-filter="${k}">${l}</a>`).join('')}</div></div>
      ${id === 'story' && L.route(farm) === 'undecided' ? '<div class="honest">You haven’t chosen a route yet. Both the Community Center and JojaMart lists are shown as “not your route” until you start one (or pick it on the Progress overview). You only ever need <b>one</b> of them.</div>' : ''}
      <section class="widget"><div class="w-body trk-body">${act.map(itemHtml).join('') || '<p class="muted">Nothing to show.</p>'}</div></section>
      ${na.length ? `<details class="mini"><summary>Not your route (${na.length}) — ignored in your percentage</summary><div class="trk-body">${na.map((i) => `<div class="ti na"><b>${esc(i.label)}</b></div>`).join('')}</div></details>` : ''}</div>`;
  };

  /* ---------- Perfection ---------- */
  const perfection = (farm) => {
    const p = PR.perfection(farm); const need = p.rows.filter((r) => r.known).sort((a, b) => (b.w - b.pts) - (a.w - a.pts));
    return `<div class="page progress"><div class="crumb"><a href="#/progress">Progress</a> › Perfection</div><div class="hero-card"><div class="moss-big">${SDV.art.moss(p.total >= 80 ? 'wow' : 'think')}</div><div class="hero-t"><h1>Perfection: ${p.total}%</h1>${bar(p.total, '#e0a0aa')}<p class="muted">${p.knownWeight < 100 ? `${100 - p.knownWeight}% of the weighting can’t be calculated without save data (shown as “unknown”), so your real score may be higher.` : 'Calculated from your save plus the values you entered.'}</p></div></div>
      <div class="widgets"><section class="widget span-2"><header><h2>Requirements</h2></header><div class="w-body">${p.rows.map((r) => `<div class="perf-row ${r.known ? '' : 'unk'}"><div class="pr-h"><b>${r.label}</b><span>${r.known ? `${(Math.round(r.pts * 10) / 10)} / ${r.w}%` : `unknown / ${r.w}%`}</span></div>${bar(r.known ? Math.round(r.v * 100) : 0, '#e0a0aa')}<small>${esc(r.how)}${r.link ? ` <a href="${r.link}">details →</a>` : ''}</small>${r.manual ? `<label class="flt">Your progress %<input type="number" min="0" max="100" data-perf="${r.id}" value="${(farm.perfect && farm.perfect[r.id]) || 0}" style="width:90px"></label>` : ''}</div>`).join('')}</div></section>
      <section class="widget"><header><h2>Needs attention</h2></header><div class="w-body">${need.filter((r) => r.w - r.pts > 0.05).slice(0, 5).map((r) => `<div class="row"><div><b>${r.label}</b><small>${Math.round((r.w - r.pts) * 10) / 10}% still to earn</small><small>${esc(r.how)}</small></div></div>`).join('') || '<p class="muted">Everything readable is complete!</p>'}</div></section></div></div>`;
  };

  /* ---------- villagers ---------- */
  const villagers = (farm) => `<div class="page progress"><div class="crumb"><a href="#/progress">Progress</a> › Villagers</div><h1 class="px-h">Villagers</h1><div class="grid">${D.villagers.map((v) => { const fr = L.friendship(farm, v.name), d = L.nextBirthdayIn(v, farm.date); return `<a class="card entry" href="#/progress/villager/${v.id}">${U.portrait(v, 'lg')}<div class="entry-t"><b>${esc(v.name)}</b><small>🎂 ${v.season} ${v.day}${d != null ? ` · in ${d}d` : ''}</small><small>${fr ? `${'❤'.repeat(Math.min(fr.hearts, 10))} ${fr.hearts}♥ ${fr.source === 'manual' ? '(manual)' : ''}` : 'hearts unknown'}</small></div></a>`; }).join('')}</div></div>`;
  const villager = (farm, id) => {
    const v = D.villagers.find((x) => x.id === id); if (!v) return '<div class="page"><h1>Villager not found</h1></div>';
    const fr = L.friendship(farm, v.name), th = PR.eventThresholds(v), d = L.nextBirthdayIn(v, farm.date), maxH = v.marry ? 14 : 10;
    const hearts = fr ? fr.hearts : 0, auto = fr && fr.source === 'save';
    return `<div class="page progress"><div class="crumb"><a href="#/progress">Progress</a> › <a href="#/progress/villagers">Villagers</a> › ${esc(v.name)}</div><div class="hero-card">${U.portrait(v, 'xl')}<div class="hero-t"><h1>${esc(v.name)}</h1><p>${esc(v.bio)}</p><div class="chips"><span class="chip">🎂 ${v.season} ${v.day}${d != null ? ` (in ${d} days)` : ''}</span><span class="chip">🏠 ${esc(v.home)}</span><span class="chip">${v.marry ? '💍 Marriage candidate' : 'Cannot marry'}</span></div></div></div>
      <div class="widgets"><section class="widget"><header><h2>Friendship</h2></header><div class="w-body"><p class="big-hearts">${Array.from({ length: Math.min(maxH, 14) }, (_, i) => `<span class="${i < hearts ? 'on' : ''}">❤</span>`).join('')}</p><p><b>${fr ? hearts + ' hearts' : 'Unknown'}</b> ${fr ? (auto ? '<span class="tag auto">from save</span>' : '<span class="tag manual">manual</span>') : ''}${fr && fr.status ? ` · ${esc(fr.status)}` : ''}${fr && fr.giftsThisWeek != null && auto ? ` · gifts this week: ${fr.giftsThisWeek}/2` : ''}</p>
        ${auto ? '<p class="muted">Hearts come from your save, so they can’t be edited here.</p>' : `<label class="flt">Set hearts manually<select id="heartSel">${Array.from({ length: maxH + 1 }, (_, i) => `<option ${i === hearts ? 'selected' : ''}>${i}</option>`).join('')}</select></label>`}</div></section>
      <section class="widget"><header><h2>Heart events</h2></header><div class="w-body"><p class="muted">The save doesn’t reveal which events you’ve seen, so tick them yourself. Details: <a href="${U.wikiUrl(v.name)}" target="_blank" rel="noopener">official wiki ↗</a></p>${th.length ? th.map((t) => `<label class="chk"><input type="checkbox" data-ev="${v.id}:${t}" ${St.isChecked(farm, `ev:${v.id}:${t}`) ? 'checked' : ''}> ${t}-heart event ${hearts >= t ? '<span class="tag auto">unlocked</span>' : ''}</label>`).join('') : '<p class="muted">No heart events recorded.</p>'}</div></section>
      <section class="widget"><header><h2>Gifts</h2></header><div class="w-body"><h4>Loves</h4><div class="chips">${v.loves.map((x) => `<span class="chip">${U.icon(x, 'recipe', 'xs')} ${esc(x)}</span>`).join('') || '—'}</div><h4>Likes</h4><div class="chips">${v.likes.map((x) => `<span class="chip">${esc(x)}</span>`).join('') || '—'}</div><h4>Dislikes</h4><div class="chips">${v.hates.map((x) => `<span class="chip">${esc(x)}</span>`).join('') || '—'}</div><p class="muted">Partial list (signature items). Universal loves: ${D.giftRules.universalLoves.join(', ')}.</p><a class="btn xs" href="#/tools/gifts">Plan a gift →</a></div></section>
      <section class="widget"><header><h2>Where to find them</h2></header><div class="w-body"><p>${esc(v.schedule)}</p></div></section></div></div>`;
  };

  P.render = ({ parts }) => {
    const farm = St.active(); if (!farm) return noFarm('Progress');
    const k = parts[1];
    if (!k) return overview(farm); if (k === 'perfection') return perfection(farm); if (k === 'villagers') return villagers(farm); if (k === 'villager') return villager(farm, parts[2]); return category(farm, k);
  };
  P.bind = (root, rerender, { parts }) => {
    const farm = St.active(); if (!farm) return; const on = (s, ev, fn) => U.$$(s, root).forEach((el) => el.addEventListener(ev, (e) => fn(el, e)));
    on('#routeSel', 'change', (el) => { farm.route = el.value; St.touch(farm); });
    on('[data-tick]', 'change', (el) => St.toggle(farm, el.dataset.tick)); on('[data-coll]', 'change', (el) => { const [k, ...r] = el.dataset.coll.split(':'); St.toggle(farm, k === 'bundle' ? 'bundle:' + r.join(':') : `coll:${k}:${r.join(':')}`); });
    on('[data-ev]', 'change', (el) => St.toggle(farm, 'ev:' + el.dataset.ev));
    on('[data-filter]', 'click', (el) => { view.filter = el.dataset.filter; rerender(); });
    const q = U.$('#q', root); if (q) q.addEventListener('input', U.debounce(() => { view.q = q.value; rerender(); setTimeout(() => { const i = U.$('#q'); if (i) { i.focus(); i.setSelectionRange(1e6, 1e6); } }, 0); }, 250));
    on('details[data-lid]', 'toggle', (el) => { el.open ? openL.add(el.dataset.lid) : openL.delete(el.dataset.lid); });
    on('#heartSel', 'change', (el) => { const v = D.villagers.find((x) => x.id === parts[2]); farm.hearts[v.name] = +el.value; St.touch(farm); });
    on('[data-perf]', 'change', (el) => { farm.perfect = farm.perfect || {}; farm.perfect[el.dataset.perf] = Math.max(0, Math.min(100, +el.value || 0)); St.touch(farm); });
  };
})();
