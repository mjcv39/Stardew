/* My Journal — diary timeline (entries + automatic memories), photo gallery with albums, and the year-in-review recap. */
(function () {
  const U = SDV.util, { esc } = U, St = SDV.store, UI = SDV.ui, M = SDV.media;
  const P = (SDV.pages.journal = {});
  const view = { q: '', tag: '', fav: false, mem: true, order: 'new', album: 'all', year: null, sel: new Set() };
  const BASE_TAGS = ['Farm', 'Friends', 'Family', 'Fishing', 'Mines', 'Festival', 'Milestone', 'Funny'];
  const tagsOf = (f) => [...new Set([...BASE_TAGS, ...(f.journalTags || []), ...f.journal.flatMap((e) => e.tags || [])])];
  const absOf = (x) => U.absDay(x.date);
  const IGN = ['time', 'connect', 'more', 'conflict'];
  const tabs = (t) => `<div class="tabs">${[['', 'Timeline'], ['gallery', 'Gallery'], ['year', 'Year in review']].map(([k, l]) => `<a class="tab ${k === t ? 'on' : ''}" href="#/journal${k ? '/' + k : ''}">${l}</a>`).join('')}</div>`;
  const noFarm = '<div class="page"><h1 class="px-h">📔 My Journal</h1><div class="widget"><div class="w-body"><p>Create or connect a farm first — each farm has its own diary.</p><a class="btn" href="#/">Go to My Farm</a></div></div></div>';

  /* ================= timeline ================= */
  const items = (f) => {
    const q = view.q.toLowerCase();
    const e = f.journal.map((x) => ({ ...x, type: 'entry' })), m = view.mem ? f.memories.filter((x) => !x.hidden && !x.baseline).map((x) => ({ ...x, type: 'memory' })) : [];
    return [...e, ...m].filter((x) => (!view.tag || (x.tags || []).includes(view.tag) || (x.type === 'memory' && x.kind === view.tag.toLowerCase())) && (!view.fav || x.fav || x.favorite) && (!q || `${x.title} ${x.body || x.text || ''} ${(x.tags || []).join(' ')}`.toLowerCase().includes(q)))
      .sort((a, b) => (view.order === 'new' ? 1 : -1) * (absOf(b) - absOf(a) || (b.created || b.at || 0) - (a.created || a.at || 0)));
  };
  const card = (x) => x.type === 'memory'
    ? `<article class="jcard mem ${x.fav ? 'fav' : ''}"><header><span class="jdate">${U.fmtShort(x.date)}</span><h3>✨ ${esc(x.title)}</h3><span class="spacer"></span><button class="btn xs ghost" data-mfav="${x.id}" aria-label="Favorite">${x.fav ? '★' : '☆'}</button><button class="btn xs ghost" data-mhide="${x.id}" aria-label="Hide memory">✕</button></header><p>${esc(x.text)}</p><small class="muted"><span class="tag auto">automatic memory</span> ${x.baseline ? 'Already true when you connected this farm — the exact day is unknown.' : 'Detected when your save/live data changed.'}</small></article>`
    : `<article class="jcard ${x.favorite ? 'fav' : ''}"><header><span class="jdate">${U.fmtShort(x.date)}</span><h3>${esc(x.title || 'Untitled')}</h3><span class="spacer"></span><button class="btn xs ghost" data-efav="${x.id}" aria-label="Favorite">${x.favorite ? '★' : '☆'}</button><button class="btn xs ghost" data-eedit="${x.id}" aria-label="Edit">✎</button><button class="btn xs ghost" data-edel="${x.id}" aria-label="Delete">🗑</button></header>${x.body ? `<p class="jbody">${esc(x.body)}</p>` : ''}${(x.images || []).length ? `<div class="jimgs">${x.images.map((im) => `<figure><img data-media="${im.id}" alt="${esc(im.caption || 'journal photo')}"><figcaption>${esc(im.caption || '')}</figcaption></figure>`).join('')}</div>` : ''}${(x.tags || []).length ? `<div class="chips">${x.tags.map((t) => `<span class="chip">#${esc(t)}</span>`).join('')}</div>` : ''}</article>`;
  const baselineCard = (f) => { const b = f.memories.filter((x) => !x.hidden && x.baseline); if (!view.mem || !b.length || view.q || view.tag || view.fav) return ''; return `<details class="jcard mem"><summary><b>✨ Already achieved when you connected this farm (${b.length})</b> <small class="muted">— the exact days are unknown</small></summary><ul class="plain">${b.map((x) => `<li><b>${esc(x.title)}</b> — ${esc(x.text)} <button class="btn xs ghost" data-mfav="${x.id}" aria-label="Favorite">${x.fav ? '★' : '☆'}</button><button class="btn xs ghost" data-mhide="${x.id}" aria-label="Hide">✕</button></li>`).join('')}</ul></details>`; };
  const timeline = (f) => {
    const list = items(f); const groups = []; for (const x of list) { const key = `${x.date.year}|${x.date.season}`; let g = groups[groups.length - 1]; if (!g || g.key !== key) groups.push((g = { key, y: x.date.year, s: x.date.season, items: [] })); g.items.push(x); }
    const years = [...new Set(groups.map((g) => g.y))];
    return `<div class="toolbar"><button class="btn" data-act="new">＋ New entry</button><input type="search" id="jq" placeholder="Search your diary…" value="${esc(view.q)}"><select id="jtag" aria-label="Filter by tag"><option value="">All tags</option>${tagsOf(f).map((t) => `<option ${t === view.tag ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select><label class="chk"><input type="checkbox" id="jfav" ${view.fav ? 'checked' : ''}> ★ favorites</label><label class="chk"><input type="checkbox" id="jmem" ${view.mem ? 'checked' : ''}> ✨ memories</label><select id="jord" aria-label="Order"><option value="new" ${view.order === 'new' ? 'selected' : ''}>Newest first</option><option value="old" ${view.order === 'old' ? 'selected' : ''}>Oldest first</option></select><button class="btn ghost xs" data-act="cats">Manage categories</button></div>
      ${baselineCard(f)}${list.length ? groups.map((g, i) => `${years.length && (i === 0 || groups[i - 1].y !== g.y) ? `<h2 class="jyear">Year ${g.y}</h2>` : ''}<h3 class="jseason s-${g.s}">${g.s}</h3><div class="jlist">${g.items.map(card).join('')}</div>`).join('') : `<div class="widget"><div class="w-body"><p>${f.journal.length || f.memories.length ? 'Nothing matches those filters.' : 'Your diary is empty. Write your first entry — or connect your save and I’ll collect milestone memories automatically.'}</p></div></div>`}`;
  };

  /* ================= editor ================= */
  const editor = (f, entry, rerender) => {
    const isNew = !entry; const e = entry || { title: '', body: '', date: { ...f.date }, tags: [], images: [], favorite: false }; const imgs = (e.images || []).map((x) => ({ ...x })); const added = [];
    UI.modal(`<h2>${isNew ? 'New diary entry' : 'Edit entry'}</h2><form id="jf" class="form"><label>Title<input name="title" value="${esc(e.title)}" maxlength="80" required></label>
      <fieldset><legend>In-game date</legend><div class="grid3"><label>Season<select name="season">${SDV.SEASONS.map((s) => `<option ${s === e.date.season ? 'selected' : ''}>${s}</option>`).join('')}</select></label><label>Day<input name="day" type="number" min="1" max="28" value="${e.date.day}"></label><label>Year<input name="year" type="number" min="1" value="${e.date.year}"></label></div></fieldset>
      <label>What happened?<textarea name="body" rows="6" maxlength="5000">${esc(e.body || '')}</textarea></label>
      <label>Tags / categories <small>(comma separated)</small><input name="tags" list="tagl" value="${esc((e.tags || []).join(', '))}"><datalist id="tagl">${tagsOf(f).map((t) => `<option value="${esc(t)}">`).join('')}</datalist></label>
      <div><b>Photos</b> <small class="muted">(stored only in this browser)</small><div id="eimgs" class="jimgs"></div><label class="btn ghost xs" for="eup">＋ Add photos</label><input id="eup" type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple hidden></div>
      <label class="chk"><input type="checkbox" name="fav" ${e.favorite ? 'checked' : ''}> ★ Favorite memory</label>
      <div class="row-end"><button type="button" class="btn ghost" id="ecancel">Cancel</button><button class="btn">Save entry</button></div></form>`, (m) => {
      const draw = () => { U.$('#eimgs', m).innerHTML = imgs.map((im, i) => `<figure><img data-media="${im.id}" alt=""><input data-cap="${i}" value="${esc(im.caption || '')}" placeholder="Caption" maxlength="80"><button type="button" class="btn xs ghost" data-rm="${i}">Remove</button></figure>`).join(''); M.hydrate(m); U.$$('[data-cap]', m).forEach((c) => c.addEventListener('input', () => (imgs[+c.dataset.cap].caption = c.value))); U.$$('[data-rm]', m).forEach((b) => b.addEventListener('click', () => { const [r] = imgs.splice(+b.dataset.rm, 1); if (added.includes(r.id)) M.remove(r.id); draw(); })); };
      draw();
      U.$('#eup', m).addEventListener('change', async (ev) => { for (const file of ev.target.files) { try { const r = await M.add(file, f.id); imgs.push({ id: r.id, caption: '' }); added.push(r.id); } catch (er) { U.toast(er.message, 'bad'); } } ev.target.value = ''; draw(); });
      U.$('#ecancel', m).addEventListener('click', () => { added.forEach((id) => M.remove(id)); UI.close(); });
      U.$('#jf', m).addEventListener('submit', (ev) => { ev.preventDefault(); const q = ev.target.elements; const tags = q.tags.value.split(',').map((t) => t.trim().replace(/^#/, '')).filter(Boolean).slice(0, 8);
        const data = { title: q.title.value.trim(), body: q.body.value.trim(), date: { season: q.season.value, day: Math.min(28, Math.max(1, +q.day.value || 1)), year: Math.max(1, +q.year.value || 1) }, tags, images: imgs, favorite: q.fav.checked, updated: Date.now() };
        if (isNew) f.journal.push({ id: U.uid(), created: Date.now(), ...data }); else { const removed = (e.images || []).filter((o) => !imgs.some((n) => n.id === o.id)); removed.forEach((r) => M.remove(r.id)); Object.assign(entry, data); }
        St.touch(f); UI.close(); U.toast('Saved to your diary 📔', 'good'); });
    });
  };
  const catsModal = (f) => UI.modal(`<h2>Journal categories</h2><p class="muted">Tags you can attach to entries. The built-in ones can’t be removed.</p><div class="chips">${BASE_TAGS.map((t) => `<span class="chip">${esc(t)}</span>`).join('')}${(f.journalTags || []).map((t) => `<span class="chip">${esc(t)} <button class="btn xs ghost" data-rmtag="${esc(t)}" aria-label="Remove ${esc(t)}">✕</button></span>`).join('')}</div><form id="tf" class="inline-form"><input name="t" placeholder="New category, e.g. Chickens" maxlength="24" required><button class="btn xs">Add</button></form>`, (m) => { U.$('#tf', m).addEventListener('submit', (e) => { e.preventDefault(); const t = e.target.t.value.trim(); f.journalTags = [...new Set([...(f.journalTags || []), t])]; St.touch(f); catsModal(f); }); U.$$('[data-rmtag]', m).forEach((b) => b.addEventListener('click', () => { f.journalTags = f.journalTags.filter((x) => x !== b.dataset.rmtag); St.touch(f); catsModal(f); })); });

  /* ================= gallery ================= */
  const gallery = (f) => {
    const list = f.gallery.filter((g) => view.album === 'all' || g.album === view.album).sort((a, b) => b.created - a.created);
    return `<div class="toolbar"><label class="btn" for="gup">＋ Upload photos</label><input id="gup" type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple hidden><select id="galb" aria-label="Album"><option value="all">All photos (${f.gallery.length})</option>${f.albums.map((a) => `<option value="${a.id}" ${view.album === a.id ? 'selected' : ''}>${esc(a.name)} (${f.gallery.filter((g) => g.album === a.id).length})</option>`).join('')}</select><button class="btn ghost xs" data-act="album">＋ New album</button>${view.album !== 'all' ? '<button class="btn ghost xs" data-act="renalbum">Rename</button><button class="btn ghost xs" data-act="delalbum">Delete album</button>' : ''}<button class="btn ghost xs" data-act="compare" ${view.sel.size === 2 ? '' : 'disabled'}>⇄ Compare selected (${view.sel.size}/2)</button></div>
      <p class="muted">Photos stay in this browser (IndexedDB) and are shrunk to fit. Ideas: farm layouts, house interiors, animals, festivals, before &amp; after — pick two photos and Compare.</p>
      <div class="gallery">${list.map((g) => `<figure class="gitem"><label class="gsel"><input type="checkbox" data-gsel="${g.id}" ${view.sel.has(g.id) ? 'checked' : ''}> ⇄</label><button data-gopen="${g.id}" aria-label="Open photo"><img data-media="${g.media}" alt="${esc(g.caption || 'gallery photo')}"></button><figcaption>${g.fav ? '★ ' : ''}${esc(g.caption || '')}<small>${U.fmtShort(g.date)}, Y${g.date.year}</small></figcaption></figure>`).join('') || '<p class="muted">No photos here yet.</p>'}</div>`;
  };
  const openPhoto = (f, id, rerender) => { const g = f.gallery.find((x) => x.id === id); if (!g) return; UI.modal(`<img class="lightbox" data-media="${g.media}" alt="${esc(g.caption || '')}"><div class="form"><label>Caption<input id="gcap" value="${esc(g.caption || '')}" maxlength="120"></label><label>Album<select id="galbsel"><option value="">No album</option>${f.albums.map((a) => `<option value="${a.id}" ${g.album === a.id ? 'selected' : ''}>${esc(a.name)}</option>`).join('')}</select></label><label class="chk"><input type="checkbox" id="gfav" ${g.fav ? 'checked' : ''}> ★ Favorite (used in your year in review)</label></div><div class="row-end"><button class="btn danger" id="gdel">Delete photo</button><button class="btn" id="gsave">Save</button></div>`, (m) => { M.hydrate(m);
    U.$('#gsave', m).addEventListener('click', () => { g.caption = U.$('#gcap', m).value.trim(); g.album = U.$('#galbsel', m).value; g.fav = U.$('#gfav', m).checked; St.touch(f); UI.close(); });
    U.$('#gdel', m).addEventListener('click', () => { M.remove(g.media); f.gallery = f.gallery.filter((x) => x.id !== id); view.sel.delete(id); St.touch(f); UI.close(); }); }, 'wide'); };
  const compare = (f) => { const [a, b] = [...view.sel].map((id) => f.gallery.find((x) => x.id === id)).filter(Boolean).sort((x, y) => x.created - y.created); if (!a || !b) return; UI.modal(`<h2>Before &amp; after</h2><div class="cmp"><figure><img data-media="${a.media}" alt="before"><figcaption><b>Before</b> · ${esc(a.caption || '')}<small>${U.fmtShort(a.date)}, Y${a.date.year}</small></figcaption></figure><figure><img data-media="${b.media}" alt="after"><figcaption><b>After</b> · ${esc(b.caption || '')}<small>${U.fmtShort(b.date)}, Y${b.date.year}</small></figcaption></figure></div>`, (m) => M.hydrate(m), 'wide'); };

  /* ================= year in review ================= */
  const yearModel = (f, y) => {
    const ev = f.activity.filter((e) => e.game && e.game.year === y && !IGN.includes(e.kind) && !e.simulated), by = (k) => ev.filter((e) => e.kind === k);
    const mem = f.memories.filter((m) => !m.hidden && m.date.year === y && !m.baseline), baseline = f.memories.filter((m) => !m.hidden && m.date.year === y && m.baseline);
    const entries = f.journal.filter((e) => e.date.year === y).sort((a, b) => absOf(a) - absOf(b)); const favs = f.gallery.filter((g) => g.fav && g.date.year === y).concat(f.gallery.filter((g) => g.fav && g.date.year !== y)).slice(0, 3);
    return { ev, mem, baseline, entries, favs, counts: { 'New fish': by('fish').length, 'Museum finds': by('museum').length, 'New recipes': by('recipe').length, 'Friendship moments': by('friend').length, 'Farm upgrades': by('building').length + by('tool').length + by('animal').length, 'Unlocks': by('unlock').length + by('explore').length, 'Skill level-ups': by('skill').length }, y };
  };
  const yearYears = (f) => [...new Set([f.date.year, ...f.activity.map((e) => e.game && e.game.year), ...f.memories.map((m) => m.date.year), ...f.journal.map((e) => e.date.year)].filter(Boolean))].sort((a, b) => a - b);
  const yearView = (f) => {
    const years = yearYears(f); const y = view.year && years.includes(view.year) ? view.year : f.date.year; const m = yearModel(f, y), fx = f.facts; const inProgress = y === f.date.year && !(f.date.season === 'Winter' && f.date.day === 28);
    return `<div class="toolbar"><label class="flt">Year<select id="yrSel">${years.map((v) => `<option ${v === y ? 'selected' : ''}>${v}</option>`).join('')}</select></label><button class="btn" data-act="png">⬇ Save as image</button><button class="btn ghost" data-act="print">🖨 Print</button></div>
      <div class="poster" id="poster"><div class="poster-head"><span>${esc(f.name)}</span><h2>Year ${y} in review</h2>${inProgress ? '<small>in progress — as of ' + U.fmtDate(f.date) + '</small>' : ''}</div>
        <div class="tiles">${Object.entries(m.counts).filter(([, n]) => n > 0).map(([k, n]) => `<div class="tile"><b>${n}</b><span>${k}</span></div>`).join('') || '<p class="muted">No changes recorded this year yet.</p>'}</div>
        ${m.mem.length ? `<h4>Milestones</h4><ul class="plain">${m.mem.map((x) => `<li><b>${esc(x.title)}</b> <small>${U.fmtShort(x.date)}</small></li>`).join('')}</ul>` : ''}${m.baseline.length ? `<h4>Already achieved when you connected</h4><p class="muted">${m.baseline.map((x) => esc(x.title)).join(' · ')}</p>` : ''}
        ${m.entries.length ? `<h4>From your diary</h4><ul class="plain">${m.entries.map((e) => `<li>${e.favorite ? '★ ' : ''}<b>${esc(e.title)}</b> <small>${U.fmtShort(e.date)}</small></li>`).join('')}</ul>` : ''}
        ${m.favs.length ? `<h4>Favorite photos</h4><div class="jimgs">${m.favs.map((g) => `<figure><img data-media="${g.media}" alt=""><figcaption>${esc(g.caption || '')}</figcaption></figure>`).join('')}</div>` : ''}
        ${fx ? `<h4>Farm statistics <small>(as of the last sync)</small></h4><div class="chips"><span class="chip">💰 ${U.gold(f.money)}</span><span class="chip">🐟 ${fx.fishCaught.length} fish species</span><span class="chip">🏺 ${fx.museumDonated.length} donated</span><span class="chip">❤ ${Object.values(fx.friend).filter((x) => x.points >= 1250).length} friends at 5+♥</span><span class="chip">🏠 ${fx.buildings.length} buildings</span><span class="chip">🐔 ${fx.animals.length} animals</span></div>` : '<p class="muted">Connect your save to add farm statistics.</p>'}
        <p class="muted">Only changes seen while this farm was connected are counted — earlier history can’t be recovered from a save.</p></div>`;
  };
  async function exportPoster(f, y) {
    const m = yearModel(f, y); const W = 1080; const lines = []; const ctx0 = document.createElement('canvas').getContext('2d'); const pad = 60;
    const wrap = (txt, font, max) => { ctx0.font = font; const words = String(txt).split(' '); const out = []; let cur = ''; for (const w of words) { const t = cur ? cur + ' ' + w : w; if (ctx0.measureText(t).width > max && cur) { out.push(cur); cur = w; } else cur = t; } if (cur) out.push(cur); return out; };
    const imgs = []; for (const g of m.favs) { const u = await M.url(g.media); if (u) { const im = new Image(); im.src = u; await im.decode().catch(() => {}); imgs.push(im); } }
    const add = (text, font, color, gap) => wrap(text, font, W - pad * 2).forEach((t) => lines.push({ t, font, color, gap: gap || 0 }));
    add(`Year ${y} in review`, "700 64px 'Pixelify Sans', monospace", '#4a3626', 20); add(f.name, "600 32px 'Nunito', sans-serif", '#7a5a3c', 30);
    const counts = Object.entries(m.counts).filter(([, n]) => n > 0); counts.forEach(([k, n]) => add(`${n}  ${k}`, "700 34px 'Nunito', sans-serif", '#4a3626', 6));
    if (m.mem.length) { add('Milestones', "700 38px 'Pixelify Sans', monospace", '#b97a82', 10); m.mem.slice(0, 8).forEach((x) => add(`• ${x.title} (${U.fmtShort(x.date)})`, "600 28px 'Nunito', sans-serif", '#4a3626', 4)); }
    if (m.entries.length) { add('From my diary', "700 38px 'Pixelify Sans', monospace", '#b97a82', 10); m.entries.slice(0, 6).forEach((x) => add(`• ${x.title}`, "600 28px 'Nunito', sans-serif", '#4a3626', 4)); }
    let h = pad + lines.reduce((a, l) => a + parseInt(l.font.match(/(\d+)px/)[1], 10) * 1.35 + l.gap, 0) + (imgs.length ? 360 : 0) + 90;
    const c = document.createElement('canvas'); c.width = W; c.height = Math.ceil(h); const g = c.getContext('2d'); g.fillStyle = '#fbf3e0'; g.fillRect(0, 0, W, c.height); g.fillStyle = '#9db98a'; g.fillRect(0, 0, W, 18); g.strokeStyle = '#b99a74'; g.lineWidth = 6; g.strokeRect(14, 30, W - 28, c.height - 44);
    let yy = pad + 20; g.textBaseline = 'top'; for (const l of lines) { g.font = l.font; g.fillStyle = l.color; g.fillText(l.t, pad, yy); yy += parseInt(l.font.match(/(\d+)px/)[1], 10) * 1.35 + l.gap; }
    if (imgs.length) { yy += 10; const cw = (W - pad * 2 - 20 * (imgs.length - 1)) / imgs.length; imgs.forEach((im, i) => { const k = Math.min(cw / im.width, 330 / im.height); g.drawImage(im, pad + i * (cw + 20), yy, im.width * k, im.height * k); }); }
    g.font = "600 22px 'Nunito', sans-serif"; g.fillStyle = '#7a6652'; g.fillText('Made with Your Little Farm', pad, c.height - 56);
    c.toBlob((b) => U.download(`year-${y}-in-review.png`, b), 'image/png');
  }

  /* ================= page ================= */
  P.render = ({ parts }) => {
    const f = St.active(); if (!f) return noFarm; const t = parts[1] || '';
    return `<div class="page journal"><div class="hero-card"><div class="moss-big">${SDV.art.moss('happy')}</div><div class="hero-t"><span class="eyebrow">My Journal · ${esc(f.name)}</span><h1>Your farm’s story</h1><p>${U.plural(f.journal.length, 'entry')} · ${U.plural(f.memories.filter((m) => !m.hidden).length, 'automatic memory')} · ${U.plural(f.gallery.length, 'photo')}</p></div></div>${tabs(t)}${t === 'gallery' ? gallery(f) : t === 'year' ? yearView(f) : timeline(f)}</div>`;
  };
  P.bind = (root, rerender, { parts }) => {
    const f = St.active(); if (!f) return; M.hydrate(root); const on = (s, ev, fn) => U.$$(s, root).forEach((el) => el.addEventListener(ev, (e) => fn(el, e)));
    on('[data-act=new]', 'click', () => editor(f, null, rerender)); on('[data-act=cats]', 'click', () => catsModal(f));
    on('[data-eedit]', 'click', (el) => editor(f, f.journal.find((x) => x.id === el.dataset.eedit), rerender));
    on('[data-edel]', 'click', (el) => UI.confirm('Delete this diary entry (and its photos)?', 'Delete', () => { const e = f.journal.find((x) => x.id === el.dataset.edel); (e.images || []).forEach((im) => M.remove(im.id)); f.journal = f.journal.filter((x) => x !== e); St.touch(f); }));
    on('[data-efav]', 'click', (el) => { const e = f.journal.find((x) => x.id === el.dataset.efav); e.favorite = !e.favorite; St.touch(f); });
    on('[data-mfav]', 'click', (el) => { const m = f.memories.find((x) => x.id === el.dataset.mfav); m.fav = !m.fav; St.touch(f); });
    on('[data-mhide]', 'click', (el) => { const m = f.memories.find((x) => x.id === el.dataset.mhide); m.hidden = true; St.touch(f); U.toast('Memory hidden (it won’t come back).'); });
    const jq = U.$('#jq', root); if (jq) jq.addEventListener('input', U.debounce(() => { view.q = jq.value; rerender(); setTimeout(() => { const i = U.$('#jq'); if (i) { i.focus(); i.setSelectionRange(1e6, 1e6); } }, 0); }, 250));
    on('#jtag', 'change', (el) => { view.tag = el.value; rerender(); }); on('#jfav', 'change', (el) => { view.fav = el.checked; rerender(); }); on('#jmem', 'change', (el) => { view.mem = el.checked; rerender(); }); on('#jord', 'change', (el) => { view.order = el.value; rerender(); });
    // gallery
    const up = U.$('#gup', root); if (up) up.addEventListener('change', async () => { let n = 0; for (const file of up.files) { try { const r = await M.add(file, f.id); f.gallery.push({ id: U.uid(), media: r.id, album: view.album === 'all' ? '' : view.album, caption: '', date: { ...f.date }, created: Date.now(), fav: false }); n++; } catch (e) { U.toast(e.message, 'bad'); } } St.touch(f); if (n) U.toast(`${U.plural(n, 'photo')} added 📷`, 'good'); });
    on('#galb', 'change', (el) => { view.album = el.value; view.sel.clear(); rerender(); });
    on('[data-act=album]', 'click', () => UI.modal(`<h2>New album</h2><form id="af" class="inline-form"><input name="n" placeholder="e.g. Farm layouts" maxlength="40" required><button class="btn">Create</button></form>`, (m) => U.$('#af', m).addEventListener('submit', (e) => { e.preventDefault(); const a = { id: U.uid(), name: e.target.n.value.trim() }; f.albums.push(a); view.album = a.id; St.touch(f); UI.close(); })));
    on('[data-act=renalbum]', 'click', () => { const a = f.albums.find((x) => x.id === view.album); const n = prompt('Album name', a.name); if (n) { a.name = n.trim().slice(0, 40); St.touch(f); } });
    on('[data-act=delalbum]', 'click', () => UI.confirm('Delete this album? Its photos stay in “All photos”.', 'Delete album', () => { f.gallery.forEach((g) => { if (g.album === view.album) g.album = ''; }); f.albums = f.albums.filter((x) => x.id !== view.album); view.album = 'all'; St.touch(f); }));
    on('[data-gopen]', 'click', (el) => openPhoto(f, el.dataset.gopen, rerender));
    on('[data-gsel]', 'change', (el) => { if (el.checked) { if (view.sel.size >= 2) { el.checked = false; return U.toast('Pick two photos to compare.'); } view.sel.add(el.dataset.gsel); } else view.sel.delete(el.dataset.gsel); rerender(); });
    on('[data-act=compare]', 'click', () => compare(f));
    // year
    on('#yrSel', 'change', (el) => { view.year = +el.value; rerender(); }); on('[data-act=print]', 'click', () => window.print());
    on('[data-act=png]', 'click', async () => { try { await exportPoster(f, view.year || f.date.year); } catch (e) { U.toast('Could not create the image: ' + e.message, 'bad'); } });
  };
})();
