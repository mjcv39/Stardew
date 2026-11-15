/* Gift planner: who needs attention, upcoming birthdays, gift preferences, gift plans and relationship goals. */
(function () {
  const D = SDV.data, U = SDV.util, { esc } = U, L = SDV.logic, St = SDV.store, UI = SDV.ui;
  const view = { sel: null, sort: 'attention', q: '' };

  const info = (farm) => D.villagers.map((v) => {
    const fr = L.friendship(farm, v.name), bd = L.nextBirthdayIn(v, farm.date); const gifts = fr && fr.giftsThisWeek != null ? fr.giftsThisWeek : null; const maxH = v.marry ? 8 : 10; let score = 0; const why = [];
    if (bd != null && bd <= 7) { score += 100 - bd * 8; why.push(bd === 0 ? 'birthday today!' : `birthday in ${bd}d`); }
    if (fr && fr.hearts < maxH) { score += (maxH - fr.hearts) * 4; if (gifts != null && gifts < 2) { score += 10; why.push(`${gifts}/2 gifts this week`); } }
    if (!fr) why.push('hearts unknown');
    return { v, fr, bd, gifts, score, why, maxH };
  });
  const plan = (farm, name) => (farm.giftPlan && farm.giftPlan[name]) || [];

  SDV.tools.gifts = {
    title: 'Gift planner', icon: ['Heart', 'gift'], blurb: 'See who needs attention, what they love, and plan gifts and relationship goals.',
    render: (farm) => {
      let list = info(farm).filter((x) => !view.q || x.v.name.toLowerCase().includes(view.q.toLowerCase()));
      list.sort((a, b) => (view.sort === 'attention' ? b.score - a.score : view.sort === 'birthday' ? (a.bd ?? 999) - (b.bd ?? 999) : view.sort === 'hearts' ? (a.fr ? a.fr.hearts : -1) - (b.fr ? b.fr.hearts : -1) : a.v.name.localeCompare(b.v.name)));
      const soon = info(farm).filter((x) => x.bd != null && x.bd <= 14).sort((a, b) => a.bd - b.bd);
      const sel = view.sel && D.villagers.find((v) => v.id === view.sel);
      return `${soon.length ? `<div class="widget"><header><h2>🎂 Birthdays in the next two weeks</h2></header><div class="w-body"><div class="bd-strip">${soon.map((x) => { const inSeason = x.v.loves.filter((i) => L.availableNow(i, U.addDays(farm.date, x.bd).season)); return `<button class="bd" data-pick="${x.v.id}">${U.portrait(x.v, 'md')}<b>${esc(x.v.name)}</b><small>${x.bd === 0 ? 'Today' : 'in ' + x.bd + 'd'} · ${x.v.season.slice(0, 3)} ${x.v.day}</small>${inSeason.length ? `<small class="tip">${esc(inSeason[0])} is in season</small>` : ''}</button>`; }).join('')}</div></div></div>` : ''}
      <div class="toolbar"><input type="search" id="gq" placeholder="Find a villager…" value="${esc(view.q)}"><label class="flt">Sort by<select id="gSort"><option value="attention" ${view.sort === 'attention' ? 'selected' : ''}>Needs attention</option><option value="birthday" ${view.sort === 'birthday' ? 'selected' : ''}>Next birthday</option><option value="hearts" ${view.sort === 'hearts' ? 'selected' : ''}>Fewest hearts</option><option value="name" ${view.sort === 'name' ? 'selected' : ''}>Name</option></select></label></div>
      <div class="gift-layout"><div class="vlist">${list.map((x) => `<button class="vrow ${view.sel === x.v.id ? 'on' : ''}" data-pick="${x.v.id}">${U.portrait(x.v, 'md')}<span class="vi"><b>${esc(x.v.name)}</b><small>${x.fr ? `${x.fr.hearts}♥${x.fr.source === 'manual' ? ' (manual)' : ''}` : 'hearts unknown'} · 🎂 ${x.v.season.slice(0, 3)} ${x.v.day}</small>${x.why.length ? `<small class="why">${esc(x.why.join(' · '))}</small>` : ''}</span></button>`).join('')}</div>
      <div class="vpanel">${sel ? panel(farm, sel) : '<div class="widget"><div class="w-body"><p class="muted">Pick a villager to see their loves, likes and dislikes, and to plan gifts.</p></div></div>'}</div></div>`;
    },
    bind: (root, rerender, farm) => {
      const on = (s, ev, fn) => U.$$(s, root).forEach((el) => el.addEventListener(ev, (e) => fn(el, e)));
      on('[data-pick]', 'click', (el) => { view.sel = el.dataset.pick; rerender(); }); on('#gSort', 'change', (el) => { view.sort = el.value; rerender(); });
      const q = U.$('#gq', root); if (q) q.addEventListener('input', U.debounce(() => { view.q = q.value; rerender(); setTimeout(() => { const i = U.$('#gq'); if (i) { i.focus(); i.setSelectionRange(1e6, 1e6); } }, 0); }, 250));
      const v = view.sel && D.villagers.find((x) => x.id === view.sel); if (!v) return;
      on('#gHeart', 'change', (el) => { farm.hearts[v.name] = +el.value; St.touch(farm); });
      on('#gpForm', 'submit', (el, e) => { e.preventDefault(); const f = e.target.elements; farm.giftPlan = farm.giftPlan || {}; (farm.giftPlan[v.name] = farm.giftPlan[v.name] || []).push({ id: U.uid(), item: f.gift.value.trim(), note: f.note.value.trim(), done: false }); St.touch(farm); });
      on('[data-gpdone]', 'change', (el) => { const p = plan(farm, v.name).find((x) => x.id === el.dataset.gpdone); p.done = el.checked; St.touch(farm); });
      on('[data-gpdel]', 'click', (el) => { farm.giftPlan[v.name] = plan(farm, v.name).filter((x) => x.id !== el.dataset.gpdel); St.touch(farm); });
      on('#gGoal', 'click', () => UI.modal(`<h2>Relationship goal</h2><form id="rg" class="form"><label>Reach this many hearts with ${esc(v.name)}<input name="h" type="number" min="1" max="${v.marry ? 14 : 10}" value="${Math.min(v.marry ? 10 : 10, ((L.friendship(farm, v.name) || { hearts: 0 }).hearts) + 2)}"></label><fieldset><legend>Deadline (optional)</legend><div class="grid3"><label>Season<select name="s"><option value="">None</option>${SDV.SEASONS.map((s) => `<option ${s === farm.date.season ? 'selected' : ''}>${s}</option>`).join('')}</select></label><label>Day<input name="d" type="number" min="1" max="28" value="28"></label><label>Year<input name="y" type="number" min="1" value="${farm.date.year}"></label></div></fieldset><div class="row-end"><button class="btn">Add goal</button></div></form>`, (m) => U.$('#rg', m).addEventListener('submit', (e) => { e.preventDefault(); const f = e.target.elements; St.addGoal(farm, { title: `Reach ${f.h.value} hearts with ${v.name}`, priority: 'normal', kind: 'relationship', due: f.s.value ? { season: f.s.value, day: +f.d.value, year: +f.y.value } : null }); UI.close(); U.toast('Goal added — it shows on your calendar and My Farm.', 'good'); })));
    },
  };
  function panel(farm, v) {
    const fr = L.friendship(farm, v.name), auto = fr && fr.source === 'save', maxH = v.marry ? 14 : 10; const items = plan(farm, v.name); const options = [...v.loves, ...v.likes];
    return `<div class="widget"><div class="w-body"><div class="hero">${U.portrait(v, 'xl')}<div><h2>${esc(v.name)}</h2><p class="muted">${esc(v.bio)}</p><div class="chips"><span class="chip">🎂 ${v.season} ${v.day}</span><span class="chip">${v.marry ? '💍 can marry' : 'friend only'}</span>${fr && fr.giftsThisWeek != null ? `<span class="chip">gifts this week ${fr.giftsThisWeek}/2</span>` : ''}</div></div></div>
      <p><b>${fr ? fr.hearts + ' hearts' : 'Hearts unknown'}</b> ${fr ? (auto ? '<span class="tag auto">save</span>' : '<span class="tag manual">manual</span>') : ''} ${auto ? '' : `<label class="flt inline">set <select id="gHeart">${Array.from({ length: maxH + 1 }, (_, i) => `<option ${fr && i === fr.hearts ? 'selected' : ''}>${i}</option>`).join('')}</select></label>`} <button class="btn xs" id="gGoal">＋ Relationship goal</button></p>
      <h4>💖 Loves <small>(best gifts; 8× points on their birthday)</small></h4><div class="chips">${v.loves.map((i) => `<span class="chip ${L.availableNow(i, farm.date.season) ? 'need' : ''}" title="${L.availableNow(i, farm.date.season) ? 'in season now' : ''}">${esc(i)}</span>`).join('') || '—'}</div><h4>👍 Likes</h4><div class="chips">${v.likes.map((i) => `<span class="chip">${esc(i)}</span>`).join('') || '—'}</div><h4>👎 Dislikes</h4><div class="chips">${v.hates.map((i) => `<span class="chip">${esc(i)}</span>`).join('') || '—'}</div>
      <p class="muted">Partial list (signature items). Highlighted loves are obtainable this season. Universal loves: ${D.giftRules.universalLoves.join(', ')}. <a href="${U.wikiUrl(v.name)}" target="_blank" rel="noopener">Full list on the wiki ↗</a></p>
      <h4>🎁 Your gift plan</h4>${items.map((p) => `<div class="goal ${p.done ? 'done' : ''}"><label class="chk"><input type="checkbox" data-gpdone="${p.id}" ${p.done ? 'checked' : ''}><span><b>${esc(p.item)}</b>${p.note ? `<small>${esc(p.note)}</small>` : ''}</span></label><button class="btn xs ghost" data-gpdel="${p.id}" aria-label="Remove">✕</button></div>`).join('') || '<p class="muted">Nothing planned yet.</p>'}
      <form id="gpForm" class="inline-form"><input name="gift" list="gitems" placeholder="Gift to give…" required maxlength="40"><datalist id="gitems">${options.map((o) => `<option value="${esc(o)}">`).join('')}</datalist><input name="note" placeholder="Note / when" maxlength="60"><button class="btn xs">Add</button></form></div></div>`;
  }
})();
