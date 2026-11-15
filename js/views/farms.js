/* Farms: import saves, connect a Saves folder, manual farms, backup/restore, privacy notes. */
(function () {
  const U = SDV.util, { esc } = U, St = SDV.store;
  const V = (SDV.views.farms = {});
  const canFolder = () => typeof window.showDirectoryPicker === 'function';

  V.render = () => {
    const farms = St.farms(), act = St.active();
    return `<div class="page farms"><h1 class="px-h">🚜 Farms & Save Import</h1>
      <div class="cols two">
        <section class="card"><h2>📂 Import a save file</h2>
          <p>Choose the main save file for your farm (named like <code>Sunnyvale_123456789</code>, no extension — <b>not</b> <code>SaveGameInfo</code>). It is parsed <b>in your browser</b>; nothing is uploaded.</p>
          <label class="px-btn file">Choose save file(s)…<input id="saveFile" type="file" multiple hidden></label>
          <div class="drop" id="drop">…or drag &amp; drop here</div>
          <details class="sect"><summary>Where is my save file?</summary><div class="sect-body"><ul>
            <li><b>Windows:</b> <code>%appdata%\\StardewValley\\Saves\\&lt;FarmName_ID&gt;\\&lt;FarmName_ID&gt;</code></li>
            <li><b>macOS:</b> <code>~/.config/StardewValley/Saves/…</code></li><li><b>Linux:</b> <code>~/.config/StardewValley/Saves/…</code></li>
            <li><b>Steam Deck / Android:</b> Android: <code>/storage/emulated/0/Android/data/com.chucklefish.stardewvalley/files/Saves</code></li></ul></div></details>
        </section>
        <section class="card"><h2>🔄 Keep in sync (Saves folder)</h2>
          ${canFolder() ? `<p>Grant read access to your <code>Saves</code> folder once; then re-sync any farm in one click after you play. The folder handle stays in this browser only.</p><button class="px-btn" id="pickFolder">Connect Saves folder</button> <button class="px-btn" id="syncFolder">Re-sync all</button><div id="folderList" class="muted"></div>`
        : `<p class="muted">Your browser doesn't support folder access (available in Chrome/Edge on desktop). Just re-import the save file whenever you want to refresh — the same farm is updated in place, keeping your goals and manual checks.</p>`}
        </section>
      </div>
      <section class="card"><h2>✍️ Manual farm</h2><p>No save file? Create a farm and set the date, gold and progress by hand. Manual items are labelled <span class="tag manual sm">manual</span>.</p>
        <form id="manualForm" class="inline-form"><input name="n" placeholder="Farm name" value="My Farm" maxlength="40"><button class="px-btn">Create manual farm</button></form></section>
      <section class="card"><h2>Your farms</h2>${farms.length ? farms.map((f) => `<div class="farm-row ${act && act.id === f.id ? 'active' : ''}"><div><b>${esc(f.name)}</b> ${f.source === 'save' ? '<span class="tag auto sm">save</span>' : '<span class="tag manual sm">manual</span>'}<small>${f.farmer ? esc(f.farmer) + ' · ' : ''}${U.fmtDate(f.date)} · ${U.gold(f.money)} · updated ${new Date(f.updated).toLocaleString()}</small></div><div><button class="px-btn sm" data-use="${f.id}">${act && act.id === f.id ? 'Active' : 'Switch'}</button> <button class="px-btn sm" data-rename="${f.id}">Rename</button> <button class="px-btn sm danger" data-rm="${f.id}">Delete</button></div></div>`).join('') : '<p class="muted">No farms yet.</p>'}</section>
      <section class="card"><h2>💾 Backup</h2><p>All data lives in this browser. Export a backup to move it between devices.</p><button class="px-btn" id="exp">Export backup (.json)</button> <label class="px-btn file">Restore backup<input id="imp" type="file" accept=".json" hidden></label></section>
      <section class="card"><h2>🔒 Privacy & technical notes</h2><ul>
        <li><b>Your save never leaves your device.</b> There is no server: the site is static files. The file is read with the browser File API and parsed locally.</li>
        <li>Only a compact summary (date, gold, friendships, collections, buildings…) is stored in <code>localStorage</code> — not the full save.</li>
        <li>Websites can't silently read your game folder; browsers require you to pick the file or grant folder access. That's why the "Connect Saves folder" option (Chrome/Edge) or re-import is needed.</li>
        <li>Detection is best-effort across game versions 1.5 / 1.6. Anything the parser can't find is marked <i>manual</i>. Museum counts show items <i>found</i>, not necessarily donated.</li>
        <li>Mobile (Android) saves live in app-private storage: copy the save file to a location you can pick from, then import.</li></ul></section>
    </div>`;
  };

  async function importFiles(files, rerender) {
    let ok = 0;
    for (const file of files) {
      if (/SaveGameInfo$/i.test(file.name)) { U.toast(`Skipped ${file.name} — pick the main save file instead.`); continue; }
      try {
        const text = await file.text(); const facts = SDV.save.parse(text); const r = St.importFacts(facts, file.name);
        const s = SDV.save.summary(facts); ok++;
        U.toast(`${r.isNew ? 'Imported' : 'Updated'} ${r.farm.name} — ${U.fmtDate(facts.date)}${s.miss.length ? ` (not found: ${s.miss.join(', ')})` : ''}`);
      } catch (e) { U.toast(`${file.name}: ${e.message}`); }
    }
    if (ok) location.hash = '#/'; else rerender();
  }
  async function scanFolder(handle) {
    const out = [];
    for await (const [name, h] of handle.entries()) {
      if (h.kind !== 'directory') continue;
      try { const fh = await h.getFileHandle(name); out.push({ name, file: await fh.getFile() }); } catch (e) { /* not a save dir */ }
    }
    return out;
  }

  V.bind = (root, rerender) => {
    const inp = U.$('#saveFile', root); inp.addEventListener('change', () => importFiles([...inp.files], rerender));
    const drop = U.$('#drop', root);
    ['dragover', 'dragenter'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('over'); }));
    ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, () => drop.classList.remove('over')));
    drop.addEventListener('drop', (e) => { e.preventDefault(); importFiles([...e.dataTransfer.files], rerender); });
    U.$('#manualForm', root).addEventListener('submit', (e) => { e.preventDefault(); St.newManual(e.target.n.value.trim() || 'My Farm'); location.hash = '#/'; });
    U.$$('[data-use]', root).forEach((b) => b.addEventListener('click', () => { St.setActive(b.dataset.use); rerender(); }));
    U.$$('[data-rm]', root).forEach((b) => b.addEventListener('click', () => { if (confirm('Delete this farm and its goals/progress from this browser?')) { St.remove(b.dataset.rm); rerender(); } }));
    U.$$('[data-rename]', root).forEach((b) => b.addEventListener('click', () => { const f = St.state().farms[b.dataset.rename]; const n = prompt('Farm name', f.name); if (n) { f.name = n.trim().slice(0, 40); St.save(); rerender(); } }));
    U.$('#exp', root).addEventListener('click', () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([St.exportAll()], { type: 'application/json' })); a.download = 'pelican-companion-backup.json'; a.click(); });
    U.$('#imp', root).addEventListener('change', async (e) => { try { St.importAll(await e.target.files[0].text()); U.toast('Backup restored'); rerender(); } catch (err) { U.toast(err.message); } });
    if (canFolder()) {
      const sync = async (h) => { const files = await scanFolder(h); let n = 0; for (const x of files) { try { St.importFacts(SDV.save.parse(await x.file.text()), x.name); n++; } catch (e) { /* skip */ } } U.toast(n ? `Synced ${n} farm(s)` : 'No saves found in that folder'); rerender(); };
      U.$('#pickFolder', root).addEventListener('click', async () => { try { const h = await window.showDirectoryPicker({ id: 'sdv-saves', mode: 'read' }); await St.putHandle(h); await sync(h); } catch (e) { if (e.name !== 'AbortError') U.toast(e.message); } });
      U.$('#syncFolder', root).addEventListener('click', async () => { const h = await St.getHandle(); if (!h) return U.toast('Connect a Saves folder first.'); try { if ((await h.requestPermission({ mode: 'read' })) !== 'granted') return U.toast('Permission denied.'); await sync(h); } catch (e) { U.toast(e.message); } });
    }
  };
})();
