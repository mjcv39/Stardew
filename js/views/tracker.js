/* Story progression & achievement tracker */
(function () {
  const D = SDV.data, U = SDV.util, { esc, icon } = U, St = SDV.store;
  const V = (SDV.views.tracker = {});
  const open = new Set(['story']), openS = new Set();
  const COLL = { 'museum-artifacts': 'artifacts', 'museum-minerals': 'minerals', fish: 'fish' };
  D.tracker.forEach((c) => c.items.forEach((i) => { if (COLL[i.id]) i.coll = COLL[i.id]; }));

  // Collection state: detected from save (item ids) OR manually ticked ('coll:<set>:<id>')
  SDV.collection = (farm, setKey) => {
    const rows = SDV.sets[setKey].rows(); const f = farm.facts;
    const det = f ? { fish: f.fishCaught, minerals: f.minerals, artifacts: f.artifacts }[setKey] : null;
    return rows.map((r) => ({ r, auto: !!(det && det.includes(r.itemId)), manual: St.isChecked(farm, `coll:${setKey}:${r.id}`) }));
  };

  V.render = () => {
    const f = St.active();
    if (!f) return `<div class="page"><h1 class="px-h">🏆 Progress Tracker</h1><div class="card"><p>Create or import a farm first to track progress.</p><a class="px-btn" href="#/farms">Set up a farm →</a></div></div>`;
    const prog = D.tracker.map((c) => SDV.progressOf(f, c)); const all = Math.round(prog.reduce((a, b) => a + b.pct, 0) / prog.length);
    return `<div class="page tracker"><h1 class="px-h">🏆 Progress Tracker</h1>
      <div class="card flat"><b>${esc(f.name)}</b> · overall ${all}% <div class="bar big"><i style="width:${all}%"></i></div>
      <p class="muted">${f.source === 'save' ? '✅ <b>Auto</b> items are detected from your imported save. Items without an auto badge need a manual check. You can also manually tick any item.' : 'Manual farm: tick items yourself. Import a save for automatic detection.'}</p></div>
      ${D.tracker.map((c, i) => section(c, prog[i], f)).join('')}
      ${relationships(f)}
      ${bundleSummary(f)}
    </div>`;
  };

  function section(c, p, f) {
    return `<details class="trk" data-cat="${c.id}" ${open.has(c.id) ? 'open' : ''}><summary><span class="trk-ico" style="background:${c.color}">${c.icon}</span><span class="trk-t"><b>${c.title}</b><small>${Math.round(p.have)}/${p.total} milestones</small></span><span class="bar"><i style="width:${p.pct}%;background:${c.color}"></i></span><b class="pct">${p.pct}%</b></summary>
      <div class="trk-body">${c.items.map((it) => item(it, f)).join('')}${c.id === 'collections' ? collections(f) : ''}</div></details>`;
  }
  function item(it, f) {
    if (it.count || it.coll) {
      let have, total, auto = false;
      if (it.coll) { const col = SDV.collection(f, it.coll); have = col.filter((x) => x.auto || x.manual).length; total = col.length; auto = !!f.facts; }
      else { const c = f.facts ? it.count(f.facts) : undefined; if (c) { [have, total] = c; auto = true; } else { have = St.isChecked(f, it.id) ? 1 : 0; total = 1; } }
      const manualOnly = !auto;
      return `<div class="ti"><div class="ti-main"><span>${esc(it.label)}</span>${auto ? '<span class="tag auto sm">auto</span>' : '<span class="tag manual sm">manual</span>'}</div><div class="bar sm"><i style="width:${Math.min(100, (have / total) * 100)}%"></i></div><small>${have}/${total}${it.hint ? ' · ' + esc(it.hint) : ''}</small>${manualOnly && !it.coll ? `<label class="chk"><input type="checkbox" data-tick="${it.id}" ${St.isChecked(f, it.id) ? 'checked' : ''}> done</label>` : ''}</div>`;
    }
    const s = SDV.isDone(f, it);
    return `<label class="ti chk ${s.done ? 'done' : ''}"><input type="checkbox" data-tick="${it.id}" ${s.done ? 'checked' : ''} ${s.auto ? 'disabled' : ''}><span class="ti-main"><span>${esc(it.label)}</span>${s.auto ? '<span class="tag auto sm">auto-detected</span>' : s.detectable ? '<span class="tag sm">not yet detected</span>' : '<span class="tag manual sm">manual</span>'}</span>${it.hint ? `<small>${esc(it.hint)}</small>` : ''}</label>`;
  }
  function collections(f) {
    const block = (key, title, ico) => { const col = SDV.collection(f, key); const h = col.filter((x) => x.auto || x.manual).length;
      return `<details class="sect" data-sid="${key}" ${openS.has(key) ? 'open' : ''}><summary>${ico} ${title} — ${h}/${col.length}</summary><div class="sect-body"><div class="coll">${col.map(({ r, auto, manual }) => `<label class="cl ${auto || manual ? 'got' : ''}" title="${esc(r.name)}${auto ? ' (detected)' : ''}"><input type="checkbox" data-coll="${key}:${r.id}" ${auto || manual ? 'checked' : ''} ${auto ? 'disabled' : ''}>${icon(r.name, SDV.sets[key].icon, 'sm')}<span>${esc(r.name)}</span></label>`).join('')}</div></div></details>`; };
    return block('fish', 'Fish collection', '🐟') + block('artifacts', 'Artifacts', '🏺') + block('minerals', 'Minerals', '💎');
  }
  function relationships(f) {
    const fr = (f.facts && f.facts.friend) || {};
    const row = (v) => { const auto = fr[v.name]; const pts = auto ? Math.floor(auto.points / 250) : null; const man = (f.hearts || {})[v.name] ?? 0; const hearts = pts ?? man; const max = v.marry ? 10 : 8; const maxShown = v.marry ? 14 : 10;
      return `<div class="heart-row">${U.portrait(v, 'md')}<div class="hr-main"><a href="#/item/villagers/${v.id}"><b>${esc(v.name)}</b></a><div class="hearts">${Array.from({ length: Math.min(maxShown, 10) }, (_, i) => `<span class="${i < hearts ? 'on' : ''}">❤</span>`).join('')}</div></div>${auto ? `<span class="tag auto sm">${hearts}♥ auto</span>` : `<select data-heart="${esc(v.name)}">${Array.from({ length: maxShown + 1 }, (_, i) => `<option ${i === hearts ? 'selected' : ''}>${i}</option>`).join('')}</select>`}</div>`; };
    return `<details class="trk"><summary><span class="trk-ico" style="background:#e56fa0">💞</span><span class="trk-t"><b>Friendship grid</b><small>per-villager hearts</small></span></summary><div class="trk-body heart-grid">${D.villagers.map(row).join('')}</div></details>`;
  }
  function bundleSummary(f) {
    const done = D.bundles.filter((b) => St.isChecked(f, 'bundle:' + b.id)).length;
    return `<details class="trk"><summary><span class="trk-ico" style="background:#e0b040">🎁</span><span class="trk-t"><b>Community Center bundles</b><small>${done}/${D.bundles.length} marked</small></span><span class="bar"><i style="width:${(done / D.bundles.length) * 100}%"></i></span></summary><div class="trk-body">${D.ccRooms.map((r) => `<h4>${r.name}</h4>${D.bundles.filter((b) => b.room === r.name).map((b) => `<label class="ti chk"><input type="checkbox" data-bundle="${b.id}" ${St.isChecked(f, 'bundle:' + b.id) ? 'checked' : ''}><span class="ti-main"><a href="#/item/bundles/${b.id}">${esc(b.name)}</a> <small>${b.need}/${b.items.length} · ${esc(b.reward)}</small></span></label>`).join('')}`).join('')}</div></details>`;
  }

  V.bind = (root, rerender) => {
    const f = St.active(); if (!f) return;
    U.$$('details.trk', root).forEach((d) => d.addEventListener('toggle', () => { d.open ? open.add(d.dataset.cat) : open.delete(d.dataset.cat); }));
    U.$$('details.sect[data-sid]', root).forEach((d) => d.addEventListener('toggle', () => { d.open ? openS.add(d.dataset.sid) : openS.delete(d.dataset.sid); }));
    const re = () => { rerender(); };
    U.$$('[data-tick]', root).forEach((c) => c.addEventListener('change', () => { St.toggle(f, c.dataset.tick); re(); }));
    U.$$('[data-coll]', root).forEach((c) => c.addEventListener('change', () => { St.toggle(f, 'coll:' + c.dataset.coll); re(); }));
    U.$$('[data-bundle]', root).forEach((c) => c.addEventListener('change', () => { St.toggle(f, 'bundle:' + c.dataset.bundle); re(); }));
    U.$$('[data-heart]', root).forEach((s) => s.addEventListener('change', () => { f.hearts = f.hearts || {}; f.hearts[s.dataset.heart] = +s.value; St.save(); re(); }));
    // keep scroll position across re-render
  };
})();
