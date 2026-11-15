/* Farm connection: reading saves, applying them to a farm profile, change detection, connection status.
   Ways a farm can be connected (strongest last):
     import     – the player picks a save file by hand (browser File API; parsed locally)
     folder     – the player grants read access to the Saves folder (Chrome/Edge); this tab re-checks it while open
     companion  – the local companion app announces new saves; with the SMAPI mod it also streams live snapshots
   Browser reality: pages cannot watch files in the background or read the running game. Live data needs the companion (+ mod). */
(function () {
  const U = SDV.util, St = SDV.store;
  const Sync = (SDV.sync = {});
  Sync.canFolder = () => typeof window.showDirectoryPicker === 'function';
  const IGN = ['time', 'connect', 'more'];

  /* ---- reading & validating ---- */
  Sync.readFile = async (file) => {
    if (/SaveGameInfo/i.test(file.name)) throw new Error('That is SaveGameInfo. Please pick the main save file — the one named after your farm (same name as its folder).');
    if (file.size > 80 * 1024 * 1024) throw new Error('That file is too large to be a Stardew Valley save.');
    if (file.size < 200) throw new Error('That file is too small to be a save.');
    return SDV.save.parse(await file.text());
  };
  Sync.routeOf = (facts) => (facts.mail.includes('JojaMember') ? 'Joja' : facts.mail.some((m) => /^cc[A-Z]/.test(m)) || facts.mail.includes('canReadJunimoText') ? 'Community Center' : 'Not chosen / not detected');

  /* ---- applying facts to a farm profile (idempotent: identical facts produce no events) ---- */
  Sync.apply = (facts, link, { targetId = null, announce = true, live = false, simulated = false } = {}) => {
    const s = St.state();
    let farm = (targetId && s.farms[targetId]) || Object.values(s.farms).find((x) => x.facts && x.facts.saveId === facts.saveId);
    const isNew = !farm; if (!farm) farm = St.createFarm(`${facts.farmName} Farm`, {});
    const prev = farm.facts; const events = SDV.activity.diff(isNew || !prev ? null : prev, facts).map((e) => ({ ...e, live, simulated }));
    // Never silently lose a manual correction: if the game value differs, keep the old manual value in the feed.
    const corr = farm.corrected || {};
    if (corr.money && farm.money !== facts.money) events.unshift({ id: U.uid(), ts: Date.now(), kind: 'conflict', icon: ['Gold', 'bundle'], game: facts.date, text: `Gold: your manual value (${U.gold(farm.money)}) was replaced by the game's ${U.gold(facts.money)}` });
    if (corr.date && U.absDay(farm.date) !== U.absDay(facts.date)) events.unshift({ id: U.uid(), ts: Date.now(), kind: 'conflict', icon: ['Calendar', 'festival'], game: facts.date, text: `Date: your manual value (${U.fmtDate(farm.date)}) was replaced by the game's ${U.fmtDate(facts.date)}` });
    farm.activity = [...events, ...(farm.activity || [])].slice(0, 300);
    Object.assign(farm, { farmer: facts.farmer, source: 'save', date: facts.date, money: facts.money, totalEarned: facts.totalEarned, farmType: facts.farmType, facts, corrected: {} });
    if (!farm.nameCustom) farm.name = `${facts.farmName} Farm`;
    if (facts.weatherTomorrow && !live) farm.weather = facts.weatherTomorrow;
    farm.link = { ...(farm.link || {}), ...link };
    if (!live) {
      const now = Date.now(); farm.link.importedAt = now; farm.link.lastCheck = now; farm.link.fileModified = link.fileModified || now;
      const missing = SDV.save.coverage(facts).filter((c) => !c.ok).map((c) => c.label);
      farm.imports = [{ at: now, source: link.mode, fileName: link.fileName || '', parserVersion: facts.parserVersion, changes: events.filter((e) => !IGN.includes(e.kind)).length, unreadable: missing }, ...(farm.imports || [])].slice(0, 20);
    }
    const newMem = SDV.memories ? SDV.memories.scan(farm, isNew ? null : prev) : [];
    s.active = farm.id; St.touch(farm); SDV.emit('farm-changed');
    if (announce) SDV.emit('synced', { farm, isNew, events, newMem });
    return { farm, isNew, events, newMem };
  };

  /* ---- Stage 2: remembered Saves folder (File System Access API) ---- */
  const idb = () => new Promise((res, rej) => { const r = indexedDB.open('ylf-handles', 1); r.onupgradeneeded = () => r.result.createObjectStore('h'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const putH = async (k, h) => { const d = await idb(); return new Promise((res) => { const tx = d.transaction('h', 'readwrite'); tx.objectStore('h').put(h, k); tx.oncomplete = res; }); };
  const getH = async (k) => { try { const d = await idb(); return await new Promise((res) => { const q = d.transaction('h').objectStore('h').get(k); q.onsuccess = () => res(q.result || null); q.onerror = () => res(null); }); } catch (e) { return null; } };
  const delH = async (k) => { try { const d = await idb(); d.transaction('h', 'readwrite').objectStore('h').delete(k); } catch (e) { /* ignore */ } };
  async function saveFileOf(dir) { try { return await dir.getFileHandle(dir.name); } catch (e) { return null; } }
  Sync.pickFolder = async () => {
    const root = await window.showDirectoryPicker({ id: 'ylf-saves', mode: 'read' });
    const dirs = []; const own = await saveFileOf(root);
    if (own) dirs.push(root); else for await (const [, h] of root.entries()) if (h.kind === 'directory' && (await saveFileOf(h))) dirs.push(h);
    const out = []; for (const d of dirs) { const file = await (await saveFileOf(d)).getFile(); out.push({ dir: d, name: d.name, modified: file.lastModified, size: file.size }); }
    return out.sort((a, b) => b.modified - a.modified);
  };
  Sync.readEntry = async (entry) => { const file = await (await saveFileOf(entry.dir)).getFile(); if (file.size > 80 * 1024 * 1024) throw new Error('That save is unexpectedly large.'); return { facts: SDV.save.parse(await file.text()), modified: file.lastModified }; };
  Sync.applyEntry = async (entry, facts, modified, targetId) => { const r = Sync.apply(facts, { mode: 'folder', fileName: entry.name, dirName: entry.name, fileModified: modified }, { targetId }); await putH('dir:' + r.farm.id, entry.dir); return r; };
  Sync.unlink = async (farm) => { await delH('dir:' + farm.id); farm.link = { ...(farm.link || {}), mode: 'import', dirName: null, saveDir: null }; St.touch(farm); };

  let folderCheck = { state: 'none' };
  Sync.check = async (farm, { autoImport = false } = {}) => {
    if (!farm || !farm.link || farm.link.mode !== 'folder') return { state: 'none' };
    const dir = await getH('dir:' + farm.id); if (!dir) return { state: 'missing' };
    try {
      if ((await dir.queryPermission({ mode: 'read' })) !== 'granted') return { state: 'permission' };
      const file = await (await saveFileOf(dir)).getFile(); farm.link.lastCheck = Date.now();
      if (file.lastModified > (farm.link.fileModified || 0)) {
        if (!autoImport) { St.saveQuiet(); return { state: 'newer', file }; }
        return { state: 'imported', ...Sync.apply(SDV.save.parse(await file.text()), { mode: 'folder', fileName: farm.link.fileName, dirName: dir.name, fileModified: file.lastModified }, { targetId: farm.id }) };
      }
      St.saveQuiet(); return { state: 'same' };
    } catch (e) { return { state: 'missing', error: e.message }; }
  };
  Sync.requestPermission = async (farm) => { const dir = await getH('dir:' + farm.id); return dir ? (await dir.requestPermission({ mode: 'read' })) === 'granted' : false; };

  /* ---- connection status (states follow the product brief) ---- */
  Sync.lastSync = (farm) => Math.max((farm.link && farm.link.importedAt) || 0, farm.liveAt || 0);
  Sync.status = (farm) => {
    const Live = SDV.live; const ls = Live ? Live.state : { phase: 'off', pending: {} };
    if (!farm) return { id: 'none', label: 'No farm yet', detail: 'Create a farm profile or connect your save.', tone: 'idle' };
    if (!farm.facts) return { id: 'none', label: 'Not connected', detail: 'Manual farm — everything shown is what you entered. Connect your save to fill it in automatically.', tone: 'idle' };
    const l = farm.link || {}; const last = l.importedAt || 0; const when = last ? U.ago(last) : 'earlier';
    if (Live && Live.isLive(farm)) return farm.liveSim ? { id: 'live', label: 'SIMULATED live feed', detail: 'Data is coming from the developer simulator, not the real game.', tone: 'warn' } : { id: 'live', label: 'Live companion connected', detail: `Receiving updates from the game through the SMAPI mod · last update ${U.ago(farm.liveAt)}.`, tone: 'live' };
    if (l.mode === 'companion') {
      if (ls.phase === 'connected') {
        if (ls.pending[l.saveDir]) return { id: 'newer', label: 'Import available', detail: 'The game saved since your last sync. Auto-import is off — sync now to update.', tone: 'warn' };
        if (Date.now() - last < 120000) return { id: 'synced', label: 'Synchronized', detail: `Last sync ${when} from the game’s save.`, tone: 'good' };
        return { id: 'waiting', label: 'Waiting for game save', detail: `Up to date as of ${when}. The game writes the save when you sleep; the companion will tell this page.${ls.mod ? '' : ' (Install the SMAPI mod for real-time updates.)'}`, tone: 'good' };
      }
      if (ls.phase === 'connecting') return { id: 'issue', label: 'Connecting to companion…', detail: 'Looking for the companion app on this computer.', tone: 'warn' };
      return { id: 'issue', label: 'Connection issue', detail: (ls.error || 'The companion is not connected.') + ' Next step: start the companion app, or use “Connect your farm”.', tone: 'warn' };
    }
    if (l.mode === 'folder') {
      const c = folderCheck.state;
      if (c === 'permission') return { id: 'issue', label: 'Connection issue', detail: 'Your browser needs you to re-allow access to the Saves folder (use “Sync now”).', tone: 'warn' };
      if (c === 'missing') return { id: 'issue', label: 'Connection issue', detail: 'The browser lost access to the Saves folder. Link it again from the connect guide.', tone: 'warn' };
      if (c === 'newer') return { id: 'newer', label: 'Import available', detail: 'A newer save was found in your Saves folder — sync now to update.', tone: 'warn' };
      if (Date.now() - last < 120000) return { id: 'synced', label: 'Synchronized', detail: `Synced ${when} from your Saves folder.`, tone: 'good' };
      return { id: 'waiting', label: 'Waiting for game save', detail: `Up to date as of ${when}. This tab re-checks while it is open; sleep in-game to save.`, tone: 'good' };
    }
    return { id: 'import', label: 'Save imported — manual refresh required', detail: `Imported ${when} from ${l.fileName || 'a save file'}. Import again after you play, or connect the companion for automatic updates.`, tone: 'good' };
  };

  let timer = null;
  Sync.startWatching = () => {
    if (timer) return;
    const tick = async () => {
      if (document.hidden) return; const farm = St.active(); if (!farm || !farm.link || farm.link.mode !== 'folder') return;
      const r = await Sync.check(farm, { autoImport: St.prefs().autoSync }); const changed = r.state !== folderCheck.state || r.state === 'imported'; folderCheck = r;
      if (r.state === 'imported') U.toast('Your farm was updated from a new save 🌾', 'good'); if (changed) SDV.emit('sync-status');
    };
    timer = setInterval(tick, 15000); document.addEventListener('visibilitychange', () => !document.hidden && tick()); setTimeout(tick, 1500);
  };
  Sync.manualSync = async (farm) => {
    if (farm.link && farm.link.mode === 'companion') { if (!SDV.live.paired()) throw new Error('Pair with the companion first (Connect your farm).'); const r = await SDV.live.importSave(farm.link.saveDir, farm.id); delete SDV.live.state.pending[farm.link.saveDir]; SDV.emit('sync-status'); return { state: 'imported', ...r }; }
    const r = await Sync.check(farm, { autoImport: true }); folderCheck = r;
    if (r.state === 'permission') { if (await Sync.requestPermission(farm)) return Sync.manualSync(farm); throw new Error('Permission to read the save folder was not granted.'); }
    if (r.state === 'missing') throw new Error('The linked folder is not available any more — link it again from the connect guide.');
    SDV.emit('sync-status'); return r;
  };
})();
