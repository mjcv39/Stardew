/* Connect your farm — a guided flow: companion (live) · Saves folder · file import. Also the shared import PREVIEW shown before any save is applied. */
(function () {
  const U = SDV.util, { esc } = U, St = SDV.store, UI = SDV.ui, Live = SDV.live, Sync = SDV.sync;
  const C = (SDV.connect = {});
  const P = (SDV.pages.connect = {});
  let det = { ok: null, info: null, error: '' }, saves = null, polling = null;

  /* ---------- import preview (used by every import path) ---------- */
  C.preview = (facts, { title = 'Import this save?', apply, extra = '' }) => {
    const prev = St.farms().find((f) => f.facts && f.facts.saveId === facts.saveId); const act = St.active();
    const fillCurrent = !prev && act && !act.facts; const changes = prev ? SDV.activity.diff(prev.facts, facts).filter((e) => !['time', 'connect'].includes(e.kind)) : [];
    const cov = SDV.save.coverage(facts);
    UI.modal(`<h2>${esc(title)}</h2><dl class="facts"><div><dt>Farm</dt><dd>${esc(facts.farmName)}</dd></div><div><dt>Farmer</dt><dd>${esc(facts.farmer)}</dd></div><div><dt>Date</dt><dd>${U.fmtDate(facts.date)}</dd></div><div><dt>Gold</dt><dd>${U.gold(facts.money)}</dd></div><div><dt>Story route</dt><dd>${Sync.routeOf(facts)}</dd></div><div><dt>Game version</dt><dd>${esc(facts.gameVersion || 'not stated in save')}</dd></div></dl>
      <p>${prev ? `This updates your existing profile <b>${esc(prev.name)}</b>. ${changes.length ? `${U.plural(changes.length, 'change')} since the last import will be added to the activity feed.` : 'Nothing has changed since the last import.'} Your goals, journal and manual notes are kept.` : fillCurrent ? `This is a new farm. You can fill your current manual profile <b>${esc(act.name)}</b> with it, or create a new profile.` : 'This will create a new farm profile.'}</p>
      ${fillCurrent ? `<label class="chk"><input type="checkbox" id="pvFill" checked> Use my current profile (${esc(act.name)}) — its goals are kept</label>` : ''}
      <details class="mini" open><summary>What I could read</summary><div class="chips">${cov.map((c) => `<span class="chip ${c.ok ? 'ok' : 'no'}">${c.ok ? '✓' : '–'} ${esc(c.label)}</span>`).join('')}</div><p class="muted">“–” items weren’t in this save; they stay unknown (not guessed) and can be entered by hand.</p></details>${extra}
      <div class="row-end"><button class="btn ghost" data-close>Cancel</button><button class="btn" id="pvApply">Import</button></div>`, (b) => U.$('#pvApply', b).addEventListener('click', async () => { const fill = U.$('#pvFill', b); try { const r = await apply(fill && fill.checked ? act.id : null); UI.close(); if (r) U.toast(`${r.isNew ? 'Imported' : 'Updated'} ${r.farm.name}`, 'good'); } catch (e) { U.toast(e.message, 'bad'); } }));
  };
  C.importFile = async (file) => { try { const facts = await Sync.readFile(file); C.preview(facts, { apply: async (target) => { const r = Sync.apply(facts, { mode: 'import', fileName: file.name, fileModified: file.lastModified }, { targetId: target }); location.hash = '#/'; return r; } }); } catch (e) { U.toast(e.message, 'bad'); } };
  C.linkFolder = async () => {
    try {
      const entries = await Sync.pickFolder();
      UI.modal(`<h2>Choose a save</h2><p class="muted">Found ${U.plural(entries.length, 'save')} (most recent first). Your browser will remember this folder so the page can re-check it while it is open.</p>${entries.map((e, i) => `<div class="farm-row"><div><b>${esc(e.name)}</b><small>saved ${new Date(e.modified).toLocaleString()} · ${(e.size / 1048576).toFixed(1)} MB</small></div><button class="btn xs" data-i="${i}">Use this</button></div>`).join('') || '<p>No Stardew saves found. Pick the <code>Saves</code> folder (or one farm’s folder inside it).</p>'}`, (b) => U.$$('[data-i]', b).forEach((x) => x.addEventListener('click', async () => { try { const en = entries[+x.dataset.i]; const { facts, modified } = await Sync.readEntry(en); C.preview(facts, { apply: (t) => Sync.applyEntry(en, facts, modified, t) }); } catch (e) { U.toast(e.message, 'bad'); } })));
    } catch (e) { if (e.name !== 'AbortError') U.toast(e.message, 'bad'); }
  };

  /* ---------- the guided page ---------- */
  const copy = (txt) => `<span class="cmd"><code>${esc(txt)}</code><button class="btn xs ghost" data-copy="${esc(txt)}">Copy</button></span>`;
  const step = (n, title, done, body) => `<section class="widget"><header><h2><span class="stepn ${done ? 'done' : ''}">${done ? '✓' : n}</span>${title}</h2></header><div class="w-body">${body}</div></section>`;

  P.render = () => {
    const paired = Live.paired(), ls = Live.state, farm = St.active();
    const found = det.ok === true || ls.phase === 'connected';
    const phase = ls.phase === 'connected' ? { t: 'good', l: 'Connected to the companion' + (ls.mod ? ' · SMAPI mod live' : ' · mod not detected') } : ls.phase === 'connecting' ? { t: 'warn', l: 'Connecting…' } : paired ? { t: 'warn', l: 'Paired, but the companion is not reachable' } : { t: 'idle', l: 'Not connected' };
    return `<div class="page connect"><div class="hero-card"><div class="moss-big">${SDV.art.moss(ls.phase === 'connected' ? 'wow' : 'think')}</div><div class="hero-t"><span class="eyebrow">Connect your farm</span><h1>Let’s link your farm</h1><p>Pick the option that suits you. <b>Everything is processed on your computer</b> — your save is never uploaded.</p></div><span class="pill tone-${phase.t}"><i class="dot"></i>${phase.l}</span></div>
    <div class="widgets">
    <section class="widget span-2"><header><h2>⚡ Live tracking <small>(recommended)</small></h2></header><div class="w-body"><p>A small <b>companion app</b> runs on the PC where you play. It tells this site the moment the game saves, and — with the optional <b>SMAPI mod</b> — streams live updates (gold, time, location, items, friendships) while you play.</p>
      <div class="honest"><b>Honest limits:</b> a website cannot read your game or folders by itself, so this needs that one small program. Without the mod, updates arrive when the game saves (when you sleep). Phones/tablets can’t run the companion; use this on the gaming PC.</div></div></section>
    ${step(1, 'Start the companion', found, `<ol class="plain"><li>Install <a href="https://nodejs.org" target="_blank" rel="noopener">Node.js</a> (the “LTS” version) once.</li><li><a class="btn" href="companion/ylf-companion.js" download>⬇ Download ylf-companion.js</a></li><li>Open a terminal in the download folder and run:<br>${copy('node ylf-companion.js')}</li></ol>
      <p class="status-line tone-${found ? 'good' : det.ok === false ? 'warn' : 'idle'}"><i class="dot"></i><span id="detLine">${found ? `Companion found${det.info ? ` · v${esc(det.info.version)} · ${det.info.savesFound} save(s)` : ''}` : det.ok === false ? esc(det.error) : 'Looking for the companion…'}</span></p>
      <details class="mini"><summary>Browser notes (read if it can’t find the companion)</summary><ul class="plain"><li>Chrome/Edge may ask to allow this site to “connect to devices on your local network” — choose <b>Allow</b>.</li><li>Safari blocks this kind of connection. Instead run <code>node ylf-companion.js --serve</code> and open <code>http://127.0.0.1:48273</code> — the whole app is then served by the companion (your data there is separate; use backup/restore to move it).</li><li>Custom port? <input id="cUrl" value="${esc(Live.cfg().url || Live.defaultUrl)}" size="26"> <button class="btn xs ghost" id="redetect">Retry</button></li></ul></details>`)}
    ${step(2, 'Pair this website', paired && ls.phase === 'connected', paired ? `<p>✓ Paired. The companion only talks to this website (${esc(location.origin)}).</p><button class="btn ghost" id="unpair">Disconnect / forget pairing</button>` : `<p>The companion shows a <b>6-digit code</b> in its window. Type it here to approve this website. (Codes are one-time and expire after 10 minutes.)</p><form id="pairForm" class="inline"><input name="code" inputmode="numeric" maxlength="7" placeholder="123 456" autocomplete="off" required><button class="btn" ${found ? '' : 'disabled'}>Pair</button></form>${found ? '' : '<p class="muted">Start the companion first (step 1).</p>'}`)}
    ${step(3, 'Choose your farm', !!(farm && farm.link && farm.link.mode === 'companion'), ls.phase === 'connected' ? `<div id="saveList">${saves ? savesHtml() : '<p class="muted">Loading your saves…</p>'}</div>` : '<p class="muted">Pair first (step 2), then your farms from the Saves folder appear here.</p>')}
    ${step(4, 'Optional: real-time mod', ls.mod, `<p>The <b>Your Little Farm SMAPI mod</b> sends live snapshots (gold, time, location, skills, friendships, collections, buildings…) to the companion while you play. Status: <b>${ls.mod ? 'connected ✓' : 'not detected'}</b>.</p><p class="muted">The mod source is in <code>companion/YourLittleFarmMod</code>. It has <b>not been compiled or tested against the real game yet</b>, and there is no prebuilt download — see its README. Everything above works without it.</p>`)}
    <section class="widget"><header><h2>🗂 Saves folder (no install)</h2></header><div class="w-body"><p>Chrome/Edge on desktop can remember your <code>Saves</code> folder. This tab re-checks it every 15 s <b>while it is open</b> and can auto-import newer saves.</p>${Sync.canFolder() ? '<button class="btn" id="linkFolder">Choose Saves folder…</button>' : '<p class="muted">Your browser doesn’t support this. Use the companion or file import.</p>'}</div></section>
    <section class="widget"><header><h2>📂 Import a file</h2></header><div class="w-body"><p>Pick the main save file (named like your farm, <b>not</b> SaveGameInfo). You’ll see a preview before anything changes.</p><label class="btn" for="cFile">Choose save file…</label><input id="cFile" type="file" hidden><p class="muted">Windows: <code>%appdata%\\StardewValley\\Saves\\Farm_123\\Farm_123</code><br>macOS/Linux: <code>~/.config/StardewValley/Saves/</code></p></div></section>
    </div></div>`;
  };
  const savesHtml = () => saves.length ? saves.map((s) => `<div class="farm-row"><div><b>${esc(s.id)}</b><small>saved ${new Date(s.modified).toLocaleString()} · ${(s.size / 1048576).toFixed(1)} MB</small></div><button class="btn xs" data-save="${esc(s.id)}">Connect this farm</button></div>`).join('') : '<p class="muted">The companion found no saves. Check its “Saves folder” line, or start it with <code>--saves &lt;folder&gt;</code>.</p>';

  P.bind = (root, rerender) => {
    const on = (sel, ev, fn) => U.$$(sel, root).forEach((el) => el.addEventListener(ev, (e) => fn(el, e)));
    on('[data-copy]', 'click', (el) => { navigator.clipboard && navigator.clipboard.writeText(el.dataset.copy); U.toast('Copied'); });
    const cf = U.$('#cFile', root); if (cf) cf.addEventListener('change', () => { C.importFile(cf.files[0]); cf.value = ''; });
    const lf = U.$('#linkFolder', root); if (lf) lf.addEventListener('click', C.linkFolder);
    const url = () => (U.$('#cUrl', root) ? U.$('#cUrl', root).value.trim().replace(/\/$/, '') : Live.defaultUrl);
    const probe = async () => { const c = Live.cfg(); if (url() !== (c.url || Live.defaultUrl)) { /* user changed the URL */ Live.cfg().url = url(); } det = await Live.detect(); const line = U.$('#detLine', root); if (line && !Live.paired()) rerender(); };
    on('#redetect', 'click', probe);
    const pf = U.$('#pairForm', root); if (pf) pf.addEventListener('submit', async (e) => { e.preventDefault(); try { await Live.pair(url(), pf.code.value); U.toast('Paired! 🎉', 'good'); saves = null; rerender(); } catch (er) { U.toast(er.message, 'bad'); } });
    on('#unpair', 'click', () => UI.confirm('Forget this pairing? The companion will stop talking to this site until you pair again.', 'Disconnect', async () => { await Live.disconnect(); saves = null; rerender(); }));
    on('[data-save]', 'click', async (el) => { try { const id = el.dataset.save; const { facts, modified } = await Live.readSave(id); C.preview(facts, { title: 'Connect this farm?', extra: '<p class="muted">After this, new saves from the game are imported automatically while this page is open and the companion is running.</p>', apply: async (t) => { const r = await Live.importSave(id, t, facts, modified); location.hash = '#/'; return r; } }); } catch (e) { U.toast(e.message, 'bad'); } });
    if (Live.state.phase === 'connected' && !saves) Live.saves().then((s) => { saves = s; const el = U.$('#saveList', root); if (el) { el.innerHTML = savesHtml(); rerender(); } }).catch((e) => U.toast(e.message, 'bad'));
    // keep probing for the companion while this page is open
    clearInterval(polling); if (!Live.paired() && det.ok !== true) polling = setInterval(async () => { if (!U.$('.connect')) return clearInterval(polling); const r = await Live.detect(); if (r.ok !== det.ok) { det = r; rerender(); } }, 3000); else if (!Live.paired()) polling = null;
    if (!Live.paired() && det.ok === null) probe();
  };
})();
