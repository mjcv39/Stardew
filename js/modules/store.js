/* Persistent storage: farm profiles, goals, preferences. Everything lives in this browser (localStorage). Images (Phase 5) will use IndexedDB. */
(function () {
  const KEY = 'ylf.v1', OLD = 'sdv.companion.v1';
  const U = SDV.util;
  const S = (SDV.store = {});
  let st = null;
  const defaultPrefs = () => ({ theme: 'auto', seasonTheme: 'auto', assistant: true, assistantMin: false, autoSync: true, widgets: ['profile', 'connection', 'today', 'stats', 'goals', 'activity', 'birthdays', 'festivals', 'crops', 'fish'], calFilters: { birthdays: true, festivals: true, crops: true, fish: false, goals: true } });
  const blank = () => ({ version: 2, active: null, farms: {}, prefs: defaultPrefs() });
  const blankFarm = (id, name) => ({ id, name, description: '', farmer: '', farmType: 'standard', source: 'manual', created: Date.now(), updated: Date.now(), date: { year: 1, season: 'Spring', day: 1 }, money: 500, totalEarned: null, weather: 'Sunny', facts: null, link: null, manual: {}, hearts: {}, goals: [], activity: [], memories: [], plantings: [], journal: [], albums: [], daily: {}, layouts: [], challenges: [] });

  const normalize = () => {
    st.prefs = { ...defaultPrefs(), ...(st.prefs || {}) };
    Object.values(st.farms).forEach((f) => Object.entries(blankFarm('x', '')).forEach(([k, v]) => { if (f[k] === undefined) f[k] = v; }));
  };
  S.load = () => {
    try { st = JSON.parse(localStorage.getItem(KEY)); } catch (e) { st = null; }
    if (!st || !st.farms) { st = blank(); migrate(); }
    normalize(); return st;
  };
  // Preserve data from the earlier "Pelican Companion" version
  function migrate() {
    try {
      const old = JSON.parse(localStorage.getItem(OLD)); if (!old || !old.farms) return;
      for (const [id, of] of Object.entries(old.farms)) st.farms[id] = { ...blankFarm(id, of.name), ...of, goals: (of.goals || []).map((g) => ({ priority: 'normal', ...g })) };
      st.active = old.active; S._migrated = Object.keys(old.farms).length; S.save();
    } catch (e) { /* nothing to migrate */ }
  }
  S.state = () => st || S.load();
  S.save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { U.toast('Could not save — browser storage is full or blocked.', 'bad'); } SDV.emit('store'); };
  S.saveQuiet = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* ignore */ } };
  S.farms = () => Object.values(S.state().farms).sort((a, b) => (b.updated || 0) - (a.updated || 0));
  S.active = () => { const s = S.state(); return s.farms[s.active] || null; };
  S.setActive = (id) => { S.state().active = id; S.save(); SDV.emit('farm-changed'); };
  S.prefs = () => S.state().prefs;
  S.setPref = (k, v) => { S.state().prefs[k] = v; S.save(); SDV.emit('prefs'); };

  S.createFarm = (name = 'My Little Farm', opts = {}) => {
    const id = U.uid(); const f = (S.state().farms[id] = { ...blankFarm(id, name), ...opts });
    S.state().active = id; S.save(); SDV.emit('farm-changed'); return f;
  };
  S.touch = (farm) => { farm.updated = Date.now(); S.save(); };
  S.removeFarm = (id) => { const s = S.state(); delete s.farms[id]; if (s.active === id) s.active = Object.keys(s.farms)[0] || null; S.save(); SDV.emit('farm-changed'); };
  S.wipe = () => { try { localStorage.removeItem(KEY); localStorage.removeItem(OLD); } catch (e) { /* ignore */ } st = blank(); S.save(); SDV.emit('farm-changed'); };

  // Manual overrides (anything the player ticks by hand) — kept separate from automatically detected data.
  S.isChecked = (farm, id) => !!(farm && farm.manual && farm.manual[id]);
  S.toggle = (farm, id) => { if (farm.manual[id]) delete farm.manual[id]; else farm.manual[id] = true; S.touch(farm); };

  // Goals: {id,title,note,priority:'high'|'normal'|'low',due?:date,done,created}
  S.addGoal = (farm, g) => { const goal = { id: U.uid(), done: false, priority: 'normal', created: Date.now(), ...g }; farm.goals.push(goal); S.touch(farm); return goal; };
  S.updateGoal = (farm, id, patch) => { const g = farm.goals.find((x) => x.id === id); if (g) Object.assign(g, patch); S.touch(farm); };
  S.delGoal = (farm, id) => { farm.goals = farm.goals.filter((g) => g.id !== id); S.touch(farm); };

  S.exportAll = () => JSON.stringify({ app: 'your-little-farm', exported: new Date().toISOString(), data: S.state() }, null, 1);
  S.importAll = (json) => { const o = JSON.parse(json); const data = o.data || o; if (!data.farms) throw new Error('This is not a Your Little Farm backup.'); st = data; normalize(); S.save(); SDV.emit('farm-changed'); };
})();
