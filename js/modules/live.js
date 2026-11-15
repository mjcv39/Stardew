/* Live connection (Phase 7): talks to the local companion app (companion/ylf-companion.js) running on the player's own PC.
   - Pairing: the player types a one-time code shown in the companion's terminal; the companion returns a token bound to this website's origin.
   - Save changes: when the game writes a save, the companion announces it; this page fetches the file from the companion and parses it locally.
   - Live snapshots/heartbeats: sent by the optional SMAPI mod → companion → here (Server-Sent Events over fetch, so the token never appears in a URL).
   Nothing here is shown as "live" unless it really arrived from the companion; simulated feeds (dev tool) are flagged as such. */
(function () {
  const U = SDV.util, St = SDV.store;
  const Live = (SDV.live = {});
  const KEY = 'ylf.companion', DEFAULT_URL = 'http://127.0.0.1:48273';
  const state = (Live.state = { phase: 'off', error: '', mod: false, lastMsg: 0, version: null, pending: {} });
  let cfg = null, abort = null, backoff = 1000, timer = null;

  Live.cfg = () => { if (!cfg) { try { cfg = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { cfg = {}; } } return cfg; };
  const saveCfg = (c) => { cfg = c; try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) { /* ignore */ } };
  Live.defaultUrl = DEFAULT_URL;
  Live.paired = () => !!Live.cfg().token;
  const set = (patch) => { Object.assign(state, patch); SDV.emit('sync-status'); };

  const api = async (path, opts = {}) => {
    const c = Live.cfg(); const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), opts.timeout || 8000);
    try {
      const r = await fetch((c.url || DEFAULT_URL) + path, { ...opts, signal: opts.signal || ctl.signal, headers: { ...(c.token ? { Authorization: 'Bearer ' + c.token } : {}), ...(opts.body ? { 'Content-Type': 'application/json' } : {}), ...(opts.headers || {}) } });
      return r;
    } finally { clearTimeout(to); }
  };
  // Plain-language cause for the common failures
  const explain = (e) => /abort|timeout/i.test(e.name + e.message) ? 'The companion did not answer in time.' : 'Could not reach the companion. Is it running on this computer? (Browsers also need to allow this site to talk to a local app — see the notes in the connect guide.)';

  /* ---- discovery & pairing ---- */
  Live.detect = async (url = Live.cfg().url || DEFAULT_URL) => {
    try { const r = await api('/api/hello', { timeout: 2500, headers: {} }); if (!r.ok) throw new Error('bad status'); const info = await r.json(); if (info.app !== 'ylf-companion') throw new Error('Something else is listening on that port.'); return { ok: true, info }; }
    catch (e) { return { ok: false, error: explain(e) }; }
  };
  Live.pair = async (url, code) => {
    const base = (url || DEFAULT_URL).replace(/\/$/, '');
    let r; try { r = await fetch(base + '/api/pair', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: String(code).replace(/\D/g, ''), name: 'Your Little Farm' }) }); } catch (e) { throw new Error(explain(e)); }
    if (r.status === 403) throw new Error('That code is not right (or it expired). Look at the newest code in the companion window and try again.');
    if (!r.ok) throw new Error('Pairing failed (' + r.status + ').');
    const j = await r.json(); saveCfg({ url: base, token: j.token }); Live.start(); return true;
  };
  Live.disconnect = async () => { try { await api('/api/token', { method: 'DELETE', timeout: 3000 }); } catch (e) { /* companion may be off */ } Live.stop(); saveCfg({}); set({ phase: 'off', error: '', mod: false }); };

  /* ---- connection loop ---- */
  Live.stop = () => { if (abort) abort.abort(); abort = null; clearTimeout(timer); };
  Live.start = async () => {
    if (!Live.paired()) return set({ phase: 'off' });
    Live.stop(); abort = new AbortController(); const sig = abort.signal; set({ phase: 'connecting', error: '' });
    try {
      const r = await api('/api/state', { signal: sig, timeout: 8000 });
      if (r.status === 401 || r.status === 403) { saveCfg({}); return set({ phase: 'off', error: 'The companion no longer recognises this site — pair again.' }); }
      const s = await r.json(); state.version = s.version; state.mod = !!s.modConnected; state.pending = {};
      await catchUp(s); set({ phase: 'connected', error: '', lastMsg: Date.now() }); backoff = 1000;
      const sr = await api('/api/stream', { signal: sig, timeout: 24 * 3600 * 1000 });
      const reader = sr.body.getReader(), dec = new TextDecoder(); let buf = '';
      for (;;) { const { value, done } = await reader.read(); if (done) break; buf += dec.decode(value, { stream: true }); let i; while ((i = buf.indexOf('\n\n')) >= 0) { const chunk = buf.slice(0, i); buf = buf.slice(i + 2); parse(chunk); } }
      throw new Error('stream ended');
    } catch (e) {
      if (sig.aborted) return;
      set({ phase: 'error', error: explain(e), mod: false }); timer = setTimeout(Live.start, backoff); backoff = Math.min(backoff * 2, 30000);
    }
  };
  function parse(chunk) {
    let type = 'message', data = ''; for (const line of chunk.split('\n')) { if (line.startsWith('event:')) type = line.slice(6).trim(); else if (line.startsWith('data:')) data += line.slice(5).trim(); }
    if (!data) return; let d; try { d = JSON.parse(data); } catch (e) { return; } state.lastMsg = Date.now(); handle(type, d);
  }

  /* ---- messages ---- */
  async function catchUp(s) {
    // 1. newer saves for farms linked through the companion  2. latest live snapshot the mod delivered while the site was closed
    for (const sv of s.saves) { const f = St.farms().find((x) => x.link && x.link.mode === 'companion' && x.link.saveDir === sv.id); if (f && sv.modified > (f.link.fileModified || 0)) await onSave(sv.id, sv.modified); }
    if (s.snapshot && s.snapshotAt) { const f = farmFor(s.snapshot.saveId); if (!f || !f.liveAt || s.snapshotAt > f.liveAt) Live.applySnapshot(s.snapshot, { simulated: false, at: s.snapshotAt, quiet: true }); }
  }
  const farmFor = (saveId) => St.farms().find((f) => f.facts && f.facts.saveId === String(saveId));
  function handle(type, d) {
    if (type === 'hello' || type === 'mod-status') { state.mod = !!(d.connected ?? d.modConnected); SDV.emit('sync-status'); }
    else if (type === 'save-changed') onSave(d.id, d.modified, d.added);
    else if (type === 'snapshot') Live.applySnapshot(d.data, { simulated: d.simulated });
    else if (type === 'heartbeat') Live.applyHeartbeat(d.data, { simulated: d.simulated });
  }
  async function onSave(id, modified, added) {
    const farm = St.farms().find((x) => x.link && x.link.mode === 'companion' && x.link.saveDir === id);
    if (!farm) { if (!added) state.pending[id] = modified; return; }
    if (!St.prefs().autoSync) { state.pending[id] = modified; return SDV.emit('sync-status'); }
    try { const r = await Live.importSave(id, farm.id); delete state.pending[id]; if (r) U.toast('Your farm was updated from the new save 🌾', 'good'); } catch (e) { U.toast(e.message, 'bad'); }
  }
  Live.saves = async () => { const r = await api('/api/saves'); if (!r.ok) throw new Error('Could not list saves (' + r.status + ').'); return (await r.json()).saves; };
  Live.readSave = async (id) => { const r = await api('/api/saves/' + encodeURIComponent(id), { timeout: 60000 }); if (!r.ok) throw new Error('The companion could not read that save (' + r.status + ').'); const modified = +r.headers.get('X-Save-Modified') || Date.now(); return { facts: SDV.save.parse(await r.text()), modified }; };
  Live.importSave = async (id, targetId, facts, modified) => {
    if (!facts) ({ facts, modified } = await Live.readSave(id));
    return SDV.sync.apply(facts, { mode: 'companion', saveDir: id, fileName: id, fileModified: modified }, { targetId });
  };

  /* ---- live data from the SMAPI mod ---- */
  const DEF = { skills: {}, friend: {}, mail: [], shipped: [], fishCaught: [], artifacts: [], minerals: [], museumDonated: [], cookingKnown: [], craftingKnown: [], cooked: [], achievements: [], professions: [], bundles: {}, buildings: [], animals: [], tools: {}, stats: {}, flags: {}, appearance: {}, museumFound: true, children: 0, houseLevel: 0, deepestMine: 0, skullDepth: 0, walnuts: 0 };
  Live.applySnapshot = (snap, { simulated = false, at = Date.now(), quiet = false } = {}) => {
    if (!snap || !snap.saveId || !snap.date) return;                        // never fabricate: incomplete snapshots are ignored
    const prev = farmFor(snap.saveId); const facts = { ...DEF, ...(prev ? prev.facts : {}), ...snap, parserVersion: 'live', parsedAt: at };
    const r = SDV.sync.apply(facts, { mode: (prev && prev.link && prev.link.mode) || 'companion' }, { live: true, simulated, announce: !quiet, targetId: prev && prev.id });
    r.farm.liveAt = at; r.farm.liveSim = !!simulated; r.farm.live = { ...(r.farm.live || {}), saveId: snap.saveId, at };
    const stamp = {}; ['date', 'money', 'skills', 'friend', 'fishCaught', 'museumDonated', 'buildings', 'animals', 'tools', 'bundles', 'mail'].forEach((k) => (stamp[k] = at)); r.farm.provLive = stamp; St.touch(r.farm); return r;
  };
  Live.applyHeartbeat = (hb, { simulated = false } = {}) => {
    if (!hb || !hb.saveId) return; const farm = farmFor(hb.saveId); if (!farm) return;
    const at = Date.now(); farm.live = { saveId: hb.saveId, at, time: hb.timeOfDay, location: hb.location, weather: hb.weather, money: hb.money, energy: hb.energy, maxEnergy: hb.maxEnergy, health: hb.health, game: hb.gameRunning !== false };
    farm.liveAt = at; farm.liveSim = !!simulated; if (hb.date) farm.date = hb.date; if (typeof hb.money === 'number') farm.money = hb.money; if (hb.weather) farm.weather = hb.weather === 'Raining' ? 'Rainy' : hb.weather === 'Snowing' ? 'Snowy' : 'Sunny';
    farm.provLive = { ...(farm.provLive || {}), date: at, money: at }; St.saveQuiet(); SDV.emit('live-tick', farm);
  };
  Live.freshMs = 180000;
  Live.isLive = (farm) => !!(farm && farm.liveAt && Date.now() - farm.liveAt < Live.freshMs && state.phase === 'connected' && state.mod);
  setInterval(() => SDV.emit('live-age'), 10000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && Live.paired() && state.phase === 'error') Live.start(); });
})();
