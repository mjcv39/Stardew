/* Farm connection (Phase 2): importing saves, folder watching, connection status.
   Browser reality check:
   - A normal web page can only read a file the user explicitly picks (File API).
   - With the File System Access API (Chrome/Edge desktop) the user can grant read access to a folder once; the page can then
     re-read the save while the tab is open. It still cannot run in the background or read the folder without permission.
   - Live in-game events need a SMAPI mod + local companion app (Phase 7, not part of this build). */
(function () {
  const U = SDV.util, St = SDV.store;
  const Sync = (SDV.sync = {});
  const canFolder = () => typeof window.showDirectoryPicker === 'function';
  Sync.canFolder = canFolder;

  /* ---- importing parsed facts into a farm profile ---- */
  Sync.apply = (facts, link, { targetId = null, announce = true } = {}) => {
    const s = St.state();
    let farm = (targetId && s.farms[targetId]) || Object.values(s.farms).find((x) => x.facts && x.facts.saveId === facts.saveId);
    const isNew = !farm;
    if (!farm) farm = St.createFarm(`${facts.farmName} Farm`, {});
    const prev = farm.facts;
    const events = SDV.activity.diff(isNew || !prev ? null : prev, facts);
    farm.activity = [...events, ...(farm.activity || [])].slice(0, 300);
    Object.assign(farm, { farmer: facts.farmer, source: 'save', date: facts.date, money: facts.money, totalEarned: facts.totalEarned, farmType: facts.farmType, facts, corrected: {} });
    if (!farm.nameCustom) farm.name = `${facts.farmName} Farm`;
    if (facts.weatherTomorrow) farm.weather = facts.weatherTomorrow;
    farm.link = { ...(farm.link || {}), ...link, importedAt: Date.now(), lastCheck: Date.now(), fileModified: link.fileModified || Date.now() };
    s.active = farm.id; St.touch(farm); SDV.emit('farm-changed');
    if (announce) SDV.emit('synced', { farm, isNew, events });
    return { farm, isNew, events };
  };

  /* ---- Stage 1: user picks a save file ---- */
  Sync.importFile = async (file, targetId) => {
    if (/SaveGameInfo$/i.test(file.name)) throw new Error('That is SaveGameInfo — please pick the main save file (same name as the folder it is in).');
    if (file.size > 80 * 1024 * 1024) throw new Error('That file is too large to be a Stardew Valley save.');
    const facts = SDV.save.parse(await file.text());
    return Sync.apply(facts, { mode: 'import', fileName: file.name, fileModified: file.lastModified }, { targetId });
  };

  /* ---- Stage 2: remembered Saves folder (File System Access API) ---- */
  const idb = () => new Promise((res, rej) => { const r = indexedDB.open('ylf-handles', 1); r.onupgradeneeded = () => r.result.createObjectStore('h'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const putH = async (k, h) => { const d = await idb(); return new Promise((res) => { const tx = d.transaction('h', 'readwrite'); tx.objectStore('h').put(h, k); tx.oncomplete = res; }); };
  const getH = async (k) => { try { const d = await idb(); return await new Promise((res) => { const q = d.transaction('h').objectStore('h').get(k); q.onsuccess = () => res(q.result || null); q.onerror = () => res(null); }); } catch (e) { return null; } };
  const delH = async (k) => { try { const d = await idb(); d.transaction('h', 'readwrite').objectStore('h').delete(k); } catch (e) { /* ignore */ } };

  // A "save dir" is Saves/<Name>/ containing a file also called <Name>.
  async function saveFileOf(dir) { try { return await dir.getFileHandle(dir.name); } catch (e) { return null; } }
  Sync.pickFolder = async () => {
    const root = await window.showDirectoryPicker({ id: 'ylf-saves', mode: 'read' });
    const dirs = []; const own = await saveFileOf(root);
    if (own) dirs.push(root); else for await (const [, h] of root.entries()) if (h.kind === 'directory' && (await saveFileOf(h))) dirs.push(h);
    const out = [];
    for (const d of dirs) { const fh = await saveFileOf(d); const file = await fh.getFile(); out.push({ dir: d, name: d.name, modified: file.lastModified, size: file.size }); }
    return out.sort((a, b) => b.modified - a.modified);
  };
  Sync.linkAndImport = async (entry, targetId) => {
    const file = await (await saveFileOf(entry.dir)).getFile();
    if (file.size > 80 * 1024 * 1024) throw new Error('That save is unexpectedly large.');
    const facts = SDV.save.parse(await file.text());
    const r = Sync.apply(facts, { mode: 'folder', fileName: entry.name, dirName: entry.name, fileModified: file.lastModified }, { targetId });
    await putH('dir:' + r.farm.id, entry.dir); return r;
  };
  Sync.unlink = async (farm) => { await delH('dir:' + farm.id); farm.link = { ...(farm.link || {}), mode: 'import', dirName: null }; St.touch(farm); };

  // Check the linked folder for a newer save. Returns {state:'newer'|'same'|'permission'|'missing'}
  Sync.check = async (farm, { autoImport = false } = {}) => {
    if (!farm || !farm.link || farm.link.mode !== 'folder') return { state: 'none' };
    const dir = await getH('dir:' + farm.id); if (!dir) return { state: 'missing' };
    try {
      if ((await dir.queryPermission({ mode: 'read' })) !== 'granted') return { state: 'permission' };
      const file = await (await saveFileOf(dir)).getFile(); farm.link.lastCheck = Date.now();
      if (file.lastModified > (farm.link.fileModified || 0)) {
        if (!autoImport) { St.saveQuiet(); return { state: 'newer', file }; }
        const facts = SDV.save.parse(await file.text()); return { state: 'imported', ...Sync.apply(facts, { mode: 'folder', fileName: farm.link.fileName, dirName: dir.name, fileModified: file.lastModified }, { targetId: farm.id }) };
      }
      St.saveQuiet(); return { state: 'same' };
    } catch (e) { return { state: 'missing', error: e.message }; }
  };
  Sync.requestPermission = async (farm) => { const dir = await getH('dir:' + farm.id); if (!dir) return false; return (await dir.requestPermission({ mode: 'read' })) === 'granted'; };

  /* ---- connection status shown across the app ---- */
  let lastCheck = { state: 'none' };
  Sync.status = (farm) => {
    if (!farm) return { id: 'none', label: 'No farm yet', detail: 'Create a farm profile or import a save.', tone: 'idle' };
    if (!farm.facts) return { id: 'none', label: 'Not connected', detail: 'Manual farm — everything shown is what you entered. Import a save to connect.', tone: 'idle' };
    const l = farm.link || {}; const when = U.ago(l.importedAt || farm.updated);
    if (l.mode === 'live') return { id: 'live', label: 'Live companion connected', detail: 'Receiving events from the companion app.', tone: 'live' };
    if (l.mode === 'folder') {
      if (lastCheck.state === 'permission') return { id: 'permission', label: 'Waiting for folder permission', detail: 'Your browser needs you to re-allow access to the Saves folder.', tone: 'warn' };
      if (lastCheck.state === 'newer') return { id: 'newer', label: 'Newer save found', detail: 'The game saved since your last sync — sync now to update.', tone: 'warn' };
      if (lastCheck.state === 'missing') return { id: 'missing', label: 'Folder not reachable', detail: 'Re-link the save folder (browser lost access).', tone: 'warn' };
      if (Date.now() - (l.importedAt || 0) < 120000) return { id: 'synced', label: 'Successfully synchronized', detail: `Synced ${when} from your Saves folder.`, tone: 'good' };
      return { id: 'waiting', label: 'Waiting for an updated save', detail: `Up to date as of ${when}. Sleep in-game to save, and this page will pick it up while it is open.`, tone: 'good' };
    }
    return { id: 'import', label: 'Connected through save import', detail: `Imported ${when} from ${l.fileName || 'a save file'}. Re-import after you play to update.`, tone: 'good' };
  };

  // Poll linked folders while the tab is open (browsers cannot watch files in the background).
  let timer = null;
  Sync.startWatching = () => {
    if (timer) return;
    const tick = async () => {
      if (document.hidden) return; const farm = St.active(); if (!farm || !farm.link || farm.link.mode !== 'folder') return;
      const r = await Sync.check(farm, { autoImport: St.prefs().autoSync });
      const changed = r.state !== lastCheck.state || r.state === 'imported'; lastCheck = r;
      if (r.state === 'imported') U.toast('Your farm was updated from a new save 🌾', 'good');
      if (changed) SDV.emit('sync-status');
    };
    timer = setInterval(tick, 15000); document.addEventListener('visibilitychange', () => !document.hidden && tick()); setTimeout(tick, 1500);
  };
  Sync.manualSync = async (farm) => {
    const r = await Sync.check(farm, { autoImport: true }); lastCheck = r;
    if (r.state === 'permission') { if (await Sync.requestPermission(farm)) return Sync.manualSync(farm); throw new Error('Permission to read the save folder was not granted.'); }
    if (r.state === 'missing') throw new Error('The linked folder is not available any more — link it again from the connection panel.');
    SDV.emit('sync-status'); return r;
  };
})();
