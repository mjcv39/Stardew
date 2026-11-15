/* My Farm — the personalized dashboard (homepage): profile, connection, today's suggestions, stats, goals, activity, calendar glimpses. */
(function () {
  const D = SDV.data, U = SDV.util, { esc, gold, icon } = U, L = SDV.logic, St = SDV.store, UI = SDV.ui;
  const P = (SDV.pages.farm = {});
  let goalTab = 'active';

  const tag = (auto) => (auto ? '<span class="tag auto" title="Imported from your save file">save</span>' : '<span class="tag manual" title="Entered by you">manual</span>');
  // Provenance per field: live (companion) > save > manual. Corrections you made stay labelled manual.
  const tagF = (farm, field, auto) => { const live = farm.provLive && farm.provLive[field] && farm.provLive[field] > ((farm.link && farm.link.importedAt) || 0) && SDV.live.isLive(farm); if (farm.corrected && farm.corrected[field]) return '<span class="tag manual" title="You corrected this value">manual</span>'; if (live) return farm.liveSim ? '<span class="tag sim" title="From the developer simulator, not the real game">simulated</span>' : `<span class="tag live" title="Live from the companion · ${U.ago(farm.provLive[field])}">live</span>`; return tag(auto); };
  const widget = (id, title, body, cls = '', art = '') => `<section class="widget ${cls}" data-w="${id}"><header><h2>${art}${title}</h2></header><div class="w-body">${body}</div></section>`;
  const spriteOrPortrait = (ic) => { const [x, cat, isV] = ic; return isV && x && x.name ? U.portrait(x, 'sm') : icon(typeof x === 'string' ? x : x.name, cat, 'sm'); };
  const BUILDINGS = ['Coop', 'Big Coop', 'Deluxe Coop', 'Barn', 'Big Barn', 'Deluxe Barn', 'Silo', 'Well', 'Stable', 'Mill', 'Shed', 'Fish Pond', 'Slime Hutch', 'Junimo Hut', 'Earth Obelisk', 'Water Obelisk', 'Desert Obelisk', 'Island Obelisk', 'Gold Clock'];
  const ANIMALS = ['Chicken', 'Duck', 'Rabbit', 'Cow', 'Goat', 'Sheep', 'Pig', 'Ostrich'];
  const HOUSE = ['Starter cabin', 'Kitchen upgrade', 'Nursery upgrade', 'Cellar upgrade'];

  // The profile's data: from the save when available, else what the player entered.
  const pdata = (farm) => { const f = farm.facts, m = farm.manualData || {}; return f ? { auto: true, skills: f.skills, houseLevel: f.houseLevel, buildings: f.buildings, animals: f.animals.map((a) => a.type) } : { auto: false, skills: m.skills || null, houseLevel: m.houseLevel ?? null, buildings: m.buildings || [], animals: m.animals || [] }; };
  const tally = (arr) => Object.entries(arr.reduce((m, x) => ((m[x] = (m[x] || 0) + 1), m), {}));

  /* ================= widgets ================= */
  const W = {};
  W.profile = (farm) => {
    const f = farm.facts, pd = pdata(farm), a = !!f; const dateAuto = a && !(farm.corrected && farm.corrected.date), goldAuto = a && !(farm.corrected && farm.corrected.money);
    const skills = pd.skills ? Object.entries(pd.skills).map(([k, v]) => `<div class="skill"><span>${k}</span><div class="bar"><i style="width:${v * 10}%"></i></div><b>${v}</b></div>`).join('') : '<p class="muted">No skill levels yet — add them with “Edit profile”.</p>';
    return widget('profile', 'Farm profile', `<div class="profile">
      <div class="who">${a ? U.farmerAvatar(f.appearance, 'xl') : `<span class="ico ico-xl">${SDV.sprites.img('Scarecrow', 'craft')}</span>`}<div><h3>${esc(farm.name)}</h3><p class="muted">${farm.description ? esc(farm.description) : 'Add a little description in “Edit profile”.'}</p></div></div>
      <dl class="facts">
        <div><dt>Farmer</dt><dd>${esc(farm.farmer || '—')} ${tag(a)}</dd></div>
        <div><dt>Farm type</dt><dd>${esc((D.farmTypes.find((x) => x.id === farm.farmType) || {}).name || '—')} ${tag(a)}</dd></div>
        <div><dt>Date</dt><dd>${U.fmtDate(farm.date)} <small>(${U.dayOfWeek(farm.date.day)})</small> ${tagF(farm, 'date', dateAuto)}</dd></div>
        <div><dt>Gold</dt><dd>${gold(farm.money)} ${tagF(farm, 'money', goldAuto)}</dd></div>
        <div><dt>Total earnings</dt><dd>${f ? gold(f.totalEarned) + ' ' + tag(true) : '<span class="muted">needs a save import</span>'}</dd></div>
        <div><dt>Playtime</dt><dd>${f ? U.hours(f.playtimeMs) + ' ' + tag(true) : '<span class="muted">needs a save import</span>'}</dd></div>
        <div><dt>Farmhouse</dt><dd>${pd.houseLevel == null ? '<span class="muted">not set</span>' : HOUSE[pd.houseLevel] + ' ' + tag(pd.auto)}</dd></div>
      </dl>
      <h4>Skills ${pd.skills ? tag(pd.auto) : ''}</h4><div class="skills">${skills}</div>
      <h4>Animals ${pd.animals.length ? tag(pd.auto) : ''}</h4><div class="chips">${pd.animals.length ? tally(pd.animals).map(([t, n]) => `<span class="chip">${icon(t, 'animal', 'xs')} ${esc(t)} ×${n}</span>`).join('') : '<span class="muted">none recorded</span>'}</div>
      <h4>Buildings ${pd.buildings.length ? tag(pd.auto) : ''}</h4><div class="chips">${pd.buildings.length ? tally(pd.buildings).map(([t, n]) => `<span class="chip">${icon(t, 'building', 'xs')} ${esc(t)}${n > 1 ? ' ×' + n : ''}</span>`).join('') : '<span class="muted">none recorded</span>'}</div>
      <div class="row-end"><button class="btn ghost" data-act="edit">✎ Edit profile</button><button class="btn ghost" data-act="profiles">Switch / new farm</button></div></div>`, 'span-2', SDV.art.heart);
  };

  const liveBlock = (farm) => { const lv = farm.live, fresh = SDV.live.isLive(farm); if (!lv || !fresh) return ''; const hh = lv.time != null ? `${String(Math.floor(lv.time / 100) % 24).padStart(2, '0')}:${String(lv.time % 100).padStart(2, '0')}` : '—';
    return `<div class="liveblock" data-liveblock>${farm.liveSim ? '<div class="honest">SIMULATED feed from the developer tool — not your real game.</div>' : ''}<h4>${farm.liveSim ? 'Simulated' : 'Live from the game'} · updated ${U.ago(lv.at)}</h4><div class="chips"><span class="chip">🕑 ${hh}</span>${lv.location ? `<span class="chip">📍 ${esc(lv.location)}</span>` : ''}<span class="chip">💰 ${gold(farm.money)}</span>${lv.weather ? `<span class="chip">${lv.weather === 'Raining' ? '🌧' : lv.weather === 'Snowing' ? '❄' : '☀'} ${esc(lv.weather)}</span>` : ''}${lv.energy != null ? `<span class="chip">⚡ ${Math.round(lv.energy)}${lv.maxEnergy ? '/' + lv.maxEnergy : ''}</span>` : ''}${lv.health != null ? `<span class="chip">❤ ${Math.round(lv.health)}</span>` : ''}</div></div>`; };
  W.connection = (farm) => {
    const st = SDV.sync.status(farm), f = farm.facts, l = farm.link || {}; const cov = f ? SDV.save.coverage(f) : null; const hist = farm.imports || [];
    const canSync = l.mode === 'companion' || l.mode === 'folder';
    return widget('connection', 'Farm connection', `<div class="conn tone-${st.tone}"><div class="conn-head"><i class="dot"></i><div><b>${esc(st.label)}</b><p>${esc(st.detail)}</p></div></div>
      ${liveBlock(farm)}
      <div class="conn-actions"><a class="btn" href="#/connect">⚡ ${f ? 'Connection options' : 'Connect your farm'}</a>${canSync ? '<button class="btn" data-act="sync">↻ Sync now</button>' : ''}<label class="btn ghost" for="saveFile">📂 Import save file…</label><input id="saveFile" type="file" hidden>${l.mode === 'folder' ? '<button class="btn ghost" data-act="unlink">Unlink folder</button>' : ''}</div>
      ${l.mode === 'folder' || l.mode === 'companion' ? `<label class="chk"><input type="checkbox" id="autoSync" ${St.prefs().autoSync ? 'checked' : ''}> Auto-import newer saves (only while this tab is open${l.mode === 'companion' ? ' and the companion is running' : ''})</label>` : ''}
      ${cov ? `<details class="mini"><summary>What was read from the save</summary><div class="chips">${cov.map((c) => `<span class="chip ${c.ok ? 'ok' : 'no'}">${c.ok ? '✓' : '–'} ${esc(c.label)}</span>`).join('')}</div><p class="muted">“–” = not found in this save; shown as unknown, never guessed.</p></details>` : ''}
      ${hist.length ? `<details class="mini"><summary>Import history (${hist.length})</summary><ul class="plain">${hist.slice(0, 8).map((h) => `<li>${new Date(h.at).toLocaleString()} · ${esc(h.source)}${h.fileName ? ' · ' + esc(h.fileName) : ''} · ${U.plural(h.changes, 'change')}${h.unreadable && h.unreadable.length ? ` <small>(not readable: ${esc(h.unreadable.join(', '))})</small>` : ''}</li>`).join('')}</ul><p class="muted">Parser version ${esc(String(f ? f.parserVersion : '—'))}.</p></details>` : ''}
      <details class="mini"><summary>How does this work? (honest version)</summary><ul class="plain"><li><b>Import:</b> you pick the save; it is parsed in your browser and never uploaded.</li><li><b>Saves folder (Chrome/Edge):</b> re-checked every 15 s <i>while this tab is open</i>. Browsers can’t watch files in the background.</li><li><b>Companion app:</b> runs on your PC, announces new saves instantly and relays the optional SMAPI mod’s live data. Needs a one-time pairing code.</li><li>The game only writes the save when you sleep. Live values need the mod.</li></ul></details></div>`, 'span-2', SDV.art.sprout);
  };

  W.today = (farm) => {
    const recs = SDV.recs.today(farm).slice(0, 6);
    return widget('today', 'What should I work on today?', recs.length ? recs.map((r) => `<div class="rec"><span class="rec-ico">${spriteOrPortrait(r.icon)}</span><div><b>${esc(r.title)}</b><p>${esc(r.detail || '')}</p></div><span class="tag ${r.basis === 'save' ? 'auto' : r.basis === 'manual' ? 'manual' : 'cal'}" title="${r.basis === 'save' ? 'Based on your save data' : r.basis === 'manual' ? 'Based on what you entered' : 'Based on the calendar date'}">${r.basis === 'calendar' ? 'date' : r.basis === 'save' ? 'auto' : 'manual'}</span></div>`).join('') : `<p class="muted">Nothing urgent. ${farm.facts ? 'Enjoy the day!' : 'Import a save and I can look at your real progress.'}</p>`, 'span-2', SDV.art.star);
  };

  W.stats = (farm) => {
    const f = farm.facts; if (!f) return widget('stats', 'Farm statistics', `<p class="muted">Statistics come straight from your save, so they appear after you import one. Nothing is estimated for manual farms.</p>`, '', SDV.art.star);
    const tiles = [
      ['Items shipped', f.stats.itemsShipped ?? f.shippedTotal, `${f.shipped.length} different items`, 'Wheat', 'crop'], ['Fish caught', f.stats.fishCaught ?? f.fishTotal, `${f.fishCaught.length} species`, 'Tuna', 'fish'],
      ['Museum donations', f.museumFound ? f.museumDonated.length : null, 'of 95 museum items', 'Vase', 'artifact'], ['Recipes learned', f.cookingKnown.length + f.craftingKnown.length, `${f.cookingKnown.length} cooking · ${f.craftingKnown.length} crafting`, 'Pizza', 'recipe'],
      ['Friendships', Object.values(f.friend).filter((x) => x.points > 0).length, `${Object.values(f.friend).filter((x) => L.hearts(x.points) >= 5).length} at 5+ hearts`, 'Heart', 'gift'], ['Achievements', f.achievements.length, 'unlocked in-game', 'Trophy', 'achievement'],
      ['Farm animals', f.animals.length, f.animals.length ? 'on your farm' : 'none yet', 'Chicken', 'animal'], ['Buildings', f.buildings.filter((b) => b !== 'Shipping Bin').length, 'constructed', 'Barn', 'building'],
    ].filter((t) => t[1] != null);
    const chips = [['Mines', f.deepestMine ? `floor ${f.deepestMine}` : null], ['Skull Cavern', f.skullDepth ? `floor ${f.skullDepth}` : null], ['Golden Walnuts', f.walnuts ? f.walnuts + '/130' : null], ['Stardrops', ['CF_Fair', 'CF_Mines', 'CF_Sewer', 'CF_Statue', 'CF_Spouse', 'CF_Fish', 'CF_Museum'].filter((k) => f.mail.includes(k)).length + '/7'], ['Spouse', f.spouse], ['Children', f.children || null]].filter((c) => c[1]);
    return widget('stats', 'Farm statistics', `<div class="tiles">${tiles.map(([t, n, s, ic, cat]) => `<div class="tile">${icon(ic, cat, 'md')}<b>${Number(n).toLocaleString()}</b><span>${t}</span><small>${s}</small></div>`).join('')}</div><div class="chips mt">${chips.map(([k, v]) => `<span class="chip">${k}: <b>${esc(v)}</b></span>`).join('')}</div>`, 'span-2', SDV.art.star);
  };

  W.goals = (farm) => {
    const rank = { high: 0, normal: 1, low: 2 }; const list = farm.goals.filter((g) => (goalTab === 'active') !== g.done).sort((a, b) => rank[a.priority] - rank[b.priority] || (a.due ? U.absDay(a.due) : 1e9) - (b.due ? U.absDay(b.due) : 1e9));
    const d = farm.date;
    return widget('goals', 'Farm goals', `<form id="goalForm" class="goal-form"><input name="title" placeholder="A goal… e.g. Save 6,000g for a barn" required maxlength="120"><select name="priority" aria-label="Priority"><option value="high">★ High</option><option value="normal" selected>Normal</option><option value="low">Low</option></select>
      <select name="season" aria-label="Deadline season"><option value="">No deadline</option>${SDV.SEASONS.map((s) => `<option ${s === d.season ? '' : ''}>${s}</option>`).join('')}</select><input name="day" type="number" min="1" max="28" value="${d.day}" aria-label="Deadline day"><input name="year" type="number" min="1" value="${d.year}" aria-label="Deadline year"><button class="btn">Add</button></form>
      <div class="tabs"><a class="tab ${goalTab === 'active' ? 'on' : ''}" data-gt="active">Active (${farm.goals.filter((g) => !g.done).length})</a><a class="tab ${goalTab === 'done' ? 'on' : ''}" data-gt="done">Completed (${farm.goals.filter((g) => g.done).length})</a></div>
      ${list.map((g) => { const left = g.due ? U.daysBetween(d, g.due) : null; return `<div class="goal ${g.done ? 'done' : ''}"><label class="chk"><input type="checkbox" data-gdone="${g.id}" ${g.done ? 'checked' : ''}><span><b>${esc(g.title)}</b>${g.note ? `<small>${esc(g.note)}</small>` : ''}</span></label><span class="prio p-${g.priority}">${g.priority === 'high' ? '★ high' : g.priority}</span>${g.due ? `<span class="due ${!g.done && left < 0 ? 'late' : !g.done && left <= 3 ? 'soon' : ''}">${U.fmtShort(g.due)} Y${g.due.year}${g.done ? '' : left < 0 ? ` · ${-left}d overdue` : left === 0 ? ' · today' : ` · ${left}d`}</span>` : ''}<button class="btn xs ghost" data-gedit="${g.id}" aria-label="Edit goal">✎</button><button class="btn xs ghost" data-gdel="${g.id}" aria-label="Delete goal">✕</button></div>`; }).join('') || `<p class="muted">${goalTab === 'active' ? 'No active goals — add one above.' : 'Nothing completed yet.'}</p>`}`, 'span-2', SDV.art.sprout);
  };

  W.activity = (farm) => widget('activity', 'Recent farm activity', farm.activity.length ? `<ul class="feed">${farm.activity.slice(0, 12).map((e) => `<li><span class="rec-ico">${spriteOrPortrait(e.icon)}</span><div><b>${esc(e.text)}</b>${e.simulated ? ' <span class="tag sim">simulated</span>' : e.live ? ' <span class="tag live">live</span>' : ''}<small>${e.game ? U.fmtDate(e.game) + ' · ' : ''}detected ${U.ago(e.ts)}</small></div></li>`).join('')}</ul>` : `<p class="muted">${farm.facts ? 'Nothing yet. Each time you import or sync a newer save, I compare it with the last one and list what changed — new fish, donations, recipes, friendships, buildings, unlocks.' : 'Activity is detected by comparing saves. Import a save now, and another after your next play session.'}</p>`, '', SDV.art.star);

  W.birthdays = (farm) => { const b = L.upcoming(farm.date, 21, (x) => L.birthdaysOn(x.season, x.day)).slice(0, 5); return widget('birthdays', 'Upcoming birthdays', b.length ? b.map((x) => x.items.map((v) => { const fr = L.friendship(farm, v.name); return `<div class="row">${U.portrait(v, 'md')}<div><b>${esc(v.name)}</b><small>${x.in === 0 ? 'Today!' : x.in === 1 ? 'Tomorrow' : 'In ' + x.in + ' days'} · ${U.fmtShort(x.date)}${fr ? ` · ${fr.hearts}♥${fr.source === 'manual' ? ' (manual)' : ''}` : ''}</small><small>Loves: ${esc(v.loves.slice(0, 3).join(', '))}</small></div></div>`; }).join('')).join('') : '<p class="muted">No birthdays in the next three weeks.</p>', '', SDV.art.heart); };
  W.festivals = (farm) => { const fs = L.upcoming(farm.date, 28, (x) => L.festivalsOn(x.season, x.day)).filter((x, i, a) => i === 0 || a[i - 1].items[0].id !== x.items[0].id).slice(0, 3); return widget('festivals', 'Upcoming festivals', fs.length ? fs.map((x) => `<div class="row"><span class="ico ico-md">${SDV.sprites.img(x.items[0].name, 'festival')}</span><div><b>${esc(x.items[0].name)}</b><small>${x.in === 0 ? 'Today' : 'In ' + x.in + ' days'} · ${U.fmtShort(x.date)} · ${esc(x.items[0].time)}</small><small>${esc(x.items[0].where)}</small></div></div>`).join('') : '<p class="muted">No festival in the next 28 days.</p>', '', SDV.art.star); };
  W.crops = (farm) => {
    const d = farm.date; const crops = L.cropsInSeason(d.season).map((c) => ({ c, p: L.plantInfo(c, d) })).filter((x) => x.p && x.p.canPlant).sort((a, b) => b.c.sell / b.c.days - a.c.sell / a.c.days).slice(0, 6); const left = 28 - d.day;
    return widget('crops', `Crops to plant — ${d.season}`, `<p class="muted">${U.plural(left, 'day')} left this season.</p>${crops.map(({ c, p }) => `<div class="row">${icon(c.name, 'crop', 'sm')}<div><b>${esc(c.name)}</b><small>${c.days} days${c.regrow ? `, regrows every ${c.regrow}` : ''} · sells ${gold(c.sell)} · plant by ${U.fmtShort(U.addDays(d, p.lastPlantDay - d.day))}</small></div></div>`).join('') || '<p class="muted">Nothing outdoors can finish growing this season — think Greenhouse or Ginger Island.</p>'}`, '', SDV.art.sprout);
  };
  W.fish = (farm) => {
    const d = farm.date, wx = farm.weather || 'Sunny'; const needed = L.neededFish(farm); let list = L.fishAvailable(d, wx);
    const need = needed ? list.filter((x) => needed.some((n) => n.id === x.id)) : null; const show = (need && need.length ? need : list).sort((a, b) => b.price - a.price).slice(0, 8);
    return widget('fish', 'Fish biting now', `<p class="muted">${d.season}, ${wx.toLowerCase()} · ${list.length} species ${need ? `· <b>${need.length}</b> you haven't caught ${tag(true)}` : '(import a save to highlight fish you still need)'}</p><div class="chips">${show.map((x) => `<span class="chip" title="${esc(x.location)} · ${U.fmtWindows(x.time)}">${icon(x.name, 'fish', 'xs')} ${esc(x.name)} <small>${gold(x.price)}</small></span>`).join('')}</div>`, '', SDV.art.fruit('#5b8fb9'));
  };
  const WIDGET_NAMES = { profile: 'Farm profile', connection: 'Farm connection', today: 'What should I work on today?', stats: 'Farm statistics', goals: 'Farm goals', activity: 'Recent activity', birthdays: 'Upcoming birthdays', festivals: 'Upcoming festivals', crops: 'Crops to plant', fish: 'Fish biting now' };

  /* ================= page ================= */
  P.render = () => {
    const farm = St.active();
    if (!farm) return `<div class="page welcome"><div class="hero-card"><div class="moss-big">${SDV.art.moss('wow')}</div><div><h1>Welcome to Your Little Farm</h1><p class="lead">A cozy home for your Stardew Valley farm: it reads your save, tracks what you've done, and tells you what to do next.</p></div></div>
      <div class="widgets"><section class="widget"><header><h2>📂 I have a save file</h2></header><div class="w-body"><p>Connect live through the companion app, link your Saves folder, or import a file. Your save is read <b>on your computer</b> and never uploaded.</p><a class="btn" href="#/connect">⚡ Connect my farm</a> <label class="btn ghost" for="saveFile">Import a file…</label><input id="saveFile" type="file" hidden></div></section>
      <section class="widget"><header><h2>✍️ Start by hand</h2></header><div class="w-body"><p>No save handy? Create a farm and enter the date, gold, skills and buildings yourself. Manual info is always labelled, and you can import a save later.</p><button class="btn" data-act="new">Create a manual farm</button></div></section></div>
      <p class="muted center">Everything stays on this device. <a href="#/guide/privacy">How your data is stored</a></p></div>`;
    const ids = St.prefs().widgets.filter((id) => W[id]);
    const d = farm.date; const manual = !farm.facts;
    return `<div class="page farm"><div class="hero-card season-${d.season}"><div class="moss-big">${SDV.art.moss('happy')}</div><div class="hero-t"><span class="eyebrow">${U.fmtDate(d)} · ${U.dayOfWeek(d.day)}</span><h1>${esc(farm.name)}</h1><p>${farm.farmer ? `Farmer ${esc(farm.farmer)} · ` : ''}${gold(farm.money)}${farm.weather ? ' · ' + (farm.weather === 'Rainy' ? '🌧 rainy' : farm.weather === 'Snowy' ? '❄ snowy' : '☀ sunny') + ' tomorrow' : ''}</p></div>
      <div class="hero-actions">${manual ? `<div class="daybtns" role="group" aria-label="Adjust the date"><button class="btn xs" data-act="day" data-n="-1">◀ Day</button><button class="btn xs" data-act="day" data-n="1">Day ▶</button><button class="btn xs" data-act="season">Next season</button></div>` : ''}<button class="btn ghost" data-act="customize">⚙ Customize</button></div></div>
      <div class="widgets">${ids.map((id) => W[id](farm)).join('')}</div></div>`;
  };

  /* ================= profile forms ================= */
  const profileForm = (farm, isNew) => {
    const md = farm.manualData || {}, sk = md.skills || {}, auto = !!farm.facts, d = farm.date;
    return `<h2>${isNew ? 'Create a manual farm' : 'Edit profile'}</h2>
    <form id="pForm" class="form"><label>Farm name<input name="name" value="${esc(farm.name)}" maxlength="40" required></label><label>Description <small>(optional)</small><input name="description" value="${esc(farm.description || '')}" maxlength="140" placeholder="Our riverside farm with too many chickens"></label>
    <label>Farmer name<input name="farmer" value="${esc(farm.farmer || '')}" maxlength="30"></label>
    <label>Farm type<select name="farmType">${D.farmTypes.map((t) => `<option value="${t.id}" ${t.id === farm.farmType ? 'selected' : ''}>${t.name}</option>`).join('')}</select></label>
    <fieldset><legend>Date & gold ${auto ? '<span class="tag manual">correcting a value marks it manual until the next import</span>' : ''}</legend><div class="grid3"><label>Season<select name="season">${SDV.SEASONS.map((s) => `<option ${s === d.season ? 'selected' : ''}>${s}</option>`).join('')}</select></label><label>Day<input name="day" type="number" min="1" max="28" value="${d.day}"></label><label>Year<input name="year" type="number" min="1" value="${d.year}"></label></div>
    <div class="grid3"><label>Gold<input name="money" type="number" min="0" value="${farm.money}"></label><label>Weather tomorrow<select name="weather">${['Sunny', 'Rainy', 'Snowy'].map((w) => `<option ${w === farm.weather ? 'selected' : ''}>${w}</option>`).join('')}</select></label></div></fieldset>
    ${auto ? '' : `<fieldset><legend>Skills (0–10)</legend><div class="grid5">${['farming', 'mining', 'foraging', 'fishing', 'combat'].map((k) => `<label>${k}<input name="sk_${k}" type="number" min="0" max="10" value="${sk[k] ?? 0}"></label>`).join('')}</div></fieldset>
    <fieldset><legend>Farmhouse</legend><select name="house">${HOUSE.map((h, i) => `<option value="${i}" ${(md.houseLevel ?? 0) === i ? 'selected' : ''}>${h}</option>`).join('')}</select></fieldset>
    <fieldset><legend>Buildings</legend><div class="checks">${BUILDINGS.map((b) => `<label class="chk"><input type="checkbox" name="b_${b}" ${(md.buildings || []).includes(b) ? 'checked' : ''}> ${b}</label>`).join('')}</div></fieldset>
    <fieldset><legend>Animals</legend><div class="grid5">${ANIMALS.map((a) => `<label>${a}<input name="a_${a}" type="number" min="0" max="30" value="${(md.animals || []).filter((x) => x === a).length}"></label>`).join('')}</div></fieldset>`}
    <div class="row-end"><button type="button" class="btn ghost" data-close>Cancel</button><button class="btn">${isNew ? 'Create farm' : 'Save'}</button></div></form>`;
  };
  const readForm = (form, farm) => {
    const v = (n) => form.elements[n]?.value; const old = { ...farm.date, money: farm.money };
    farm.name = v('name').trim() || farm.name; farm.nameCustom = true; farm.description = v('description').trim(); farm.farmer = v('farmer').trim(); farm.farmType = v('farmType');
    farm.date = { season: v('season'), day: Math.min(28, Math.max(1, +v('day') || 1)), year: Math.max(1, +v('year') || 1) }; farm.money = Math.max(0, +v('money') || 0); farm.weather = v('weather');
    if (farm.facts) { farm.corrected = farm.corrected || {}; if (U.absDay(farm.date) !== U.absDay(old)) farm.corrected.date = true; if (farm.money !== old.money) farm.corrected.money = true; }
    else { farm.manualData = { skills: Object.fromEntries(['farming', 'mining', 'foraging', 'fishing', 'combat'].map((k) => [k, Math.min(10, Math.max(0, +v('sk_' + k) || 0))])), houseLevel: +v('house'), buildings: BUILDINGS.filter((b) => form.elements['b_' + b]?.checked), animals: ANIMALS.flatMap((a) => Array(Math.max(0, +v('a_' + a) || 0)).fill(a)) }; }
  };

  const profilesModal = () => UI.modal(`<h2>Your farms</h2><p class="muted">Each farm keeps its own progress, goals and journal.</p>${St.farms().map((f) => `<div class="farm-row ${St.active() && St.active().id === f.id ? 'on' : ''}"><div><b>${esc(f.name)}</b> ${tag(!!f.facts)}<small>${esc(f.farmer || 'no farmer name')} · ${U.fmtDate(f.date)} · ${gold(f.money)}</small></div><div><button class="btn xs" data-use="${f.id}">${St.active() && St.active().id === f.id ? 'Active' : 'Switch'}</button> <button class="btn xs danger" data-rm="${f.id}">Delete</button></div></div>`).join('') || '<p class="muted">No farms yet.</p>'}<div class="row-end"><button class="btn" id="newFarm">+ New manual farm</button></div>`, (b) => {
    U.$$('[data-use]', b).forEach((x) => x.addEventListener('click', () => { St.setActive(x.dataset.use); UI.close(); }));
    U.$$('[data-rm]', b).forEach((x) => x.addEventListener('click', () => UI.confirm('Delete this farm, with its goals and progress, from this browser? This cannot be undone.', 'Delete farm', () => { St.removeFarm(x.dataset.rm); profilesModal(); })));
    U.$('#newFarm', b).addEventListener('click', newFarm);
  });
  const newFarm = () => { const f = { name: 'My Little Farm', description: '', farmer: '', farmType: 'standard', date: { year: 1, season: 'Spring', day: 1 }, money: 500, weather: 'Sunny', manualData: null }; UI.modal(profileForm(f, true), (b) => U.$('#pForm', b).addEventListener('submit', (e) => { e.preventDefault(); const farm = St.createFarm(f.name); readForm(e.target, farm); St.touch(farm); UI.close(); })); };

  const customizeModal = () => {
    const cur = St.prefs().widgets.slice(); const all = Object.keys(WIDGET_NAMES);
    const draw = (b) => { b.innerHTML = `<h2>Customize your dashboard</h2><p class="muted">Choose what appears on My Farm and in which order.</p><ul class="wl">${[...cur, ...all.filter((x) => !cur.includes(x))].map((id) => `<li><label class="chk"><input type="checkbox" data-w="${id}" ${cur.includes(id) ? 'checked' : ''}> ${WIDGET_NAMES[id]}</label><span><button class="btn xs ghost" data-up="${id}" aria-label="Move up">↑</button><button class="btn xs ghost" data-dn="${id}" aria-label="Move down">↓</button></span></li>`).join('')}</ul><div class="row-end"><button class="btn ghost" data-close>Cancel</button><button class="btn" id="wSave">Save</button></div>`; bind(b); };
    const bind = (b) => {
      U.$$('[data-w]', b).forEach((c) => c.addEventListener('change', () => { const id = c.dataset.w; const i = cur.indexOf(id); if (c.checked && i < 0) cur.push(id); if (!c.checked && i >= 0) cur.splice(i, 1); }));
      const mv = (id, dir) => { const i = cur.indexOf(id); if (i < 0) return; const j = i + dir; if (j < 0 || j >= cur.length) return; [cur[i], cur[j]] = [cur[j], cur[i]]; draw(b); };
      U.$$('[data-up]', b).forEach((x) => x.addEventListener('click', () => mv(x.dataset.up, -1))); U.$$('[data-dn]', b).forEach((x) => x.addEventListener('click', () => mv(x.dataset.dn, 1)));
      U.$$('[data-close]', b).forEach((x) => x.addEventListener('click', UI.close)); U.$('#wSave', b).addEventListener('click', () => { St.setPref('widgets', cur); UI.close(); });
    };
    UI.modal('', draw);
  };
  const goalModal = (farm, g) => UI.modal(`<h2>Edit goal</h2><form id="gEdit" class="form"><label>Goal<input name="title" value="${esc(g.title)}" required maxlength="120"></label><label>Notes<input name="note" value="${esc(g.note || '')}" maxlength="200"></label><label>Priority<select name="priority">${['high', 'normal', 'low'].map((p) => `<option ${p === g.priority ? 'selected' : ''}>${p}</option>`).join('')}</select></label>
    <fieldset><legend>Deadline</legend><div class="grid3"><label>Season<select name="season"><option value="">None</option>${SDV.SEASONS.map((s) => `<option ${g.due && g.due.season === s ? 'selected' : ''}>${s}</option>`).join('')}</select></label><label>Day<input name="day" type="number" min="1" max="28" value="${g.due ? g.due.day : farm.date.day}"></label><label>Year<input name="year" type="number" min="1" value="${g.due ? g.due.year : farm.date.year}"></label></div></fieldset><div class="row-end"><button type="button" class="btn ghost" data-close>Cancel</button><button class="btn">Save</button></div></form>`, (b) => U.$('#gEdit', b).addEventListener('submit', (e) => { e.preventDefault(); const f = e.target.elements; St.updateGoal(farm, g.id, { title: f.title.value.trim(), note: f.note.value.trim(), priority: f.priority.value, due: f.season.value ? { season: f.season.value, day: +f.day.value || 1, year: +f.year.value || 1 } : null }); UI.close(); }));

  P.bind = (root, rerender) => {
    const farm = St.active(); const on = (sel, fn) => U.$$(sel, root).forEach((el) => el.addEventListener('click', (e) => fn(el, e)));
    const file = U.$('#saveFile', root); if (file) file.addEventListener('change', () => { SDV.connect.importFile(file.files[0]); file.value = ''; });
    on('[data-act=new]', newFarm); on('[data-act=customize]', customizeModal); on('[data-act=profiles]', profilesModal);
    on('[data-act=edit]', () => UI.modal(profileForm(farm, false), (b) => { U.$('#pForm', b).addEventListener('submit', (e) => { e.preventDefault(); readForm(e.target, farm); St.touch(farm); UI.close(); }); }));
    on('[data-act=sync]', async (el) => { el.disabled = true; try { const r = await SDV.sync.manualSync(farm); U.toast(r.state === 'imported' ? 'Synced the latest save 🌾' : 'Already up to date — the game has not saved since.', 'good'); } catch (e) { U.toast(e.message, 'bad'); } el.disabled = false; });
    on('[data-act=unlink]', () => SDV.sync.unlink(farm).then(() => U.toast('Folder unlinked. You can still import files by hand.')));
    on('[data-act=day]', (el) => { farm.date = U.addDays(farm.date, +el.dataset.n); St.touch(farm); });
    on('[data-act=season]', () => { farm.date = { year: farm.date.year + (farm.date.season === 'Winter' ? 1 : 0), season: U.nextSeason(farm.date.season), day: 1 }; St.touch(farm); });
    const as = U.$('#autoSync', root); if (as) as.addEventListener('change', () => St.setPref('autoSync', as.checked));
    if (!farm) return;
    const gf = U.$('#goalForm', root); if (gf) gf.addEventListener('submit', (e) => { e.preventDefault(); const f = e.target.elements; St.addGoal(farm, { title: f.title.value.trim(), priority: f.priority.value, due: f.season.value ? { season: f.season.value, day: Math.min(28, +f.day.value || 1), year: +f.year.value || 1 } : null }); });
    on('[data-gt]', (el) => { goalTab = el.dataset.gt; rerender(); });
    U.$$('[data-gdone]', root).forEach((c) => c.addEventListener('change', () => St.updateGoal(farm, c.dataset.gdone, { done: c.checked })));
    on('[data-gdel]', (el) => St.delGoal(farm, el.dataset.gdel)); on('[data-gedit]', (el) => goalModal(farm, farm.goals.find((g) => g.id === el.dataset.gedit)));
  };
  P.profilesModal = profilesModal;
  // Live heartbeats update only the live block (no full re-render, so forms keep their text)
  SDV.on('live-tick', (farm) => { const el = document.querySelector('[data-liveblock]'); const cur = St.active(); if (el && cur && cur.id === farm.id) { const tmp = document.createElement('div'); tmp.innerHTML = liveBlock(farm); if (tmp.firstElementChild) el.replaceWith(tmp.firstElementChild); } });
})();
