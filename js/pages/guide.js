/* My Little Guide — Moss, settings & themes, data & privacy (backup / restore / delete), honest notes about the data. */
(function () {
  const U = SDV.util, { esc } = U, St = SDV.store, UI = SDV.ui;
  const G = (SDV.pages.guide = {});
  const TABS = [['', 'Moss & settings'], ['privacy', 'Data & privacy'], ['about', 'About this app']];

  const settings = () => { const p = St.prefs(); const sel = (name, opts, cur) => `<select data-pref="${name}">${opts.map(([v, l]) => `<option value="${v}" ${v === cur ? 'selected' : ''}>${l}</option>`).join('')}</select>`; return `
    <div class="widgets"><section class="widget span-2"><header><h2>Meet Moss</h2></header><div class="w-body moss-intro">${['happy', 'wow', 'think', 'sleepy'].map((e) => `<figure>${SDV.art.moss(e)}<figcaption>${e}</figcaption></figure>`).join('')}
      <p>Moss is a little forest spirit who lives in the corner of every page. It only says things that come from your real farm data or the calendar — if there is nothing useful to say, it stays quiet.</p>
      <label class="chk"><input type="checkbox" data-pref="assistant" ${p.assistant ? 'checked' : ''}> Show Moss</label> <label class="chk"><input type="checkbox" data-pref="assistantMin" ${p.assistantMin ? 'checked' : ''}> Keep Moss minimized</label></div></section>
    <section class="widget"><header><h2>Look & feel</h2></header><div class="w-body form"><label>Theme ${sel('theme', [['auto', 'Match my device'], ['light', 'Daytime'], ['dark', 'Night']], p.theme)}</label><label>Seasonal scenery ${sel('seasonTheme', [['auto', 'Follow my farm\'s season'], ...SDV.SEASONS.map((s) => [s, s])], p.seasonTheme)}</label></div></section>
    <section class="widget"><header><h2>Sync</h2></header><div class="w-body"><label class="chk"><input type="checkbox" data-pref="autoSync" ${p.autoSync ? 'checked' : ''}> Auto-import newer saves from a linked Saves folder (only while a tab is open)</label><p class="muted">Dashboard widgets: use “Customize” on My Farm.</p></div></section></div>`; };

  const privacy = () => { const farms = St.farms(); const kb = Math.round((localStorage.getItem('ylf.v1') || '').length / 1024); return `
    <div class="widgets"><section class="widget span-2"><header><h2>What is stored, and where</h2></header><div class="w-body"><table class="tbl"><tr><th>Information</th><th>Where</th><th>Leaves your device?</th></tr>
      <tr><td>Your save file</td><td>Read in memory only, never stored</td><td><b>No.</b> Parsed in your browser.</td></tr>
      <tr><td>Farm summary (date, gold, friendships, collections…), goals, activity, settings</td><td>This browser's localStorage (${kb} KB used, ${U.plural(farms.length, 'farm')})</td><td><b>No.</b></td></tr>
      <tr><td>Link to your Saves folder</td><td>This browser's IndexedDB (a permission handle, not the files)</td><td><b>No.</b></td></tr>
      <tr><td>Journal photos (when added later)</td><td>This browser's IndexedDB</td><td><b>No.</b></td></tr>
      <tr><td>Companion pairing token (if you connect the companion)</td><td>This browser's localStorage; the companion stores only a hash on your PC</td><td><b>No</b> — it only talks to <code>127.0.0.1</code> on your own computer.</td></tr>
      <tr><td>Fonts</td><td>Loaded from Google Fonts</td><td>Your browser asks Google for the font files.</td></tr></table>
      <p><b>Nothing is stored on any server by this app</b> — there is no account and no cloud sync yet. Clearing browser data erases everything, so export a backup now and then. Because the site is static, anyone who can open your device's browser profile can see your data; there are no public links.</p>
      <p class="muted">Syncing to another device securely would need an encrypted relay or your own companion app (planned, not built). Until then, use backup/restore.</p></div></section>
    <section class="widget"><header><h2>Backup & restore</h2></header><div class="w-body"><button class="btn" id="exp">⬇ Export everything (.json)</button><label class="btn ghost" for="imp">⬆ Restore from backup</label><input id="imp" type="file" accept=".json" hidden><p class="muted">Restoring replaces what is currently in this browser.</p></div></section>
    <section class="widget"><header><h2>Delete my data</h2></header><div class="w-body"><p>Remove all farms, goals, activity and settings from this browser.</p><button class="btn danger" id="wipe">Delete everything…</button></div></section></div>`; };

  const about = () => `<div class="widgets"><section class="widget span-2"><header><h2>About the data (please read)</h2></header><div class="w-body">
    <ul class="plain"><li><b>Game information</b> (birthdays, gift tastes, crops, fish, bundles, festivals) was written into <code>js/data/</code> from game knowledge. The official wiki could not be reached while building, so <b>it has not been cross-checked line by line</b>. Where it matters, entries link to the official wiki.</li>
    <li>Likes/hates lists, a few prices and some unlock details are partial. Nothing is invented on purpose: unknown things are left out or marked manual.</li>
    <li><b>Save detection</b> is built for the 1.5/1.6 save layout and verified against a synthetic test save, not yet against many real saves. Community Center bundle ids are validated by item count before use.</li>
    <li><b>Art</b>: all illustrations and sprites are original and drawn in code; no game art is included. Moss is an original character.</li>
    <li>This is a fan project and is not affiliated with ConcernedApe or Stardew Valley.</li></ul>
    <h3>What is built</h3><ul class="plain"><li>✅ Phase 1 — redesign, navigation, farm dashboard, farm profiles, manual entry, goals</li><li>✅ Phase 2 — save import with preview, saves-folder sync, connection status, activity feed</li>
    <li>🟡 Phase 7 — <b>companion app + website connector + secure pairing: built and tested</b> (with a <i>simulated</i> mod). <b>The SMAPI mod itself is written but NOT compiled or tested against the real game</b>, so real-time in-game events are unverified. Remote/multi-device sync is not built.</li>
    <li>⏳ Phase 3 Progress · Phase 4 Calendar · Phase 5 Journal · Phase 6 Planning tools · Phase 8 polish — not built yet; their pages say so honestly.</li></ul></div></section></div>`;

  G.render = ({ parts }) => { const tab = parts[1] || ''; return `<div class="page guide"><div class="hero-card"><div class="moss-big">${SDV.art.moss('think')}</div><div class="hero-t"><span class="eyebrow">My Little Guide</span><h1>Moss & settings</h1><p>Make the farm yours, and see exactly how your data is handled.</p></div></div>
    <div class="tabs">${TABS.map(([k, l]) => `<a class="tab ${k === tab ? 'on' : ''}" href="#/guide${k ? '/' + k : ''}">${l}</a>`).join('')}</div>${tab === 'privacy' ? privacy() : tab === 'about' ? about() : settings()}</div>`; };

  G.bind = (root) => {
    U.$$('[data-pref]', root).forEach((el) => el.addEventListener('change', () => St.setPref(el.dataset.pref, el.type === 'checkbox' ? el.checked : el.value)));
    const exp = U.$('#exp', root); if (exp) exp.addEventListener('click', () => U.download(`your-little-farm-backup-${new Date().toISOString().slice(0, 10)}.json`, St.exportAll()));
    const imp = U.$('#imp', root); if (imp) imp.addEventListener('change', async () => { try { const text = await imp.files[0].text(); UI.confirm('Restore this backup? It replaces everything currently stored in this browser.', 'Restore', () => { St.importAll(text); U.toast('Backup restored', 'good'); }); } catch (e) { U.toast(e.message, 'bad'); } imp.value = ''; });
    const wipe = U.$('#wipe', root); if (wipe) wipe.addEventListener('click', () => UI.confirm('Delete ALL farms, goals and settings from this browser? Export a backup first if you might want them back.', 'Delete everything', () => { St.wipe(); U.toast('All data deleted.'); location.hash = '#/'; }));
  };
})();
