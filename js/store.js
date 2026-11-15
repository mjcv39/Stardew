/* Persistent storage: multiple farms, goals, preferences. Everything lives in localStorage on this device only. */
(function () {
  const KEY = 'sdv.companion.v1';
  const U = SDV.util;
  const S = (SDV.store = {});
  let st = null;
  const blank = () => ({ active: null, farms: {}, prefs: { cal: { birthdays: true, festivals: true, crops: true, fish: false, goals: true, events: true } } });
  S.load = () => { try { st = JSON.parse(localStorage.getItem(KEY)) || blank(); } catch (e) { st = blank(); } if (!st.prefs) st.prefs = blank().prefs; return st; };
  S.state = () => st || S.load();
  S.save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { U.toast('Could not save: browser storage is full or blocked.'); } SDV.emit && SDV.emit('store'); };
  S.farms = () => Object.values(S.state().farms).sort((a, b) => (b.updated || 0) - (a.updated || 0));
  S.active = () => { const s = S.state(); return s.farms[s.active] || null; };
  S.setActive = (id) => { S.state().active = id; S.save(); };
  S.pref = (k) => S.state().prefs[k];
  S.setPref = (k, v) => { S.state().prefs[k] = v; S.save(); };

  S.newManual = (name = 'My Farm') => {
    const id = U.uid();
    S.state().farms[id] = { id, name, farmer: '', source: 'manual', updated: Date.now(), date: { year: 1, season: 'Spring', day: 1 }, money: 500, totalEarned: 0, weather: 'Sunny', facts: null, manual: {}, hearts: {}, goals: [], farmType: 'standard' };
    S.state().active = id; S.save(); return S.state().farms[id];
  };
  // Import parsed save facts. Re-importing the same farm (same farm+farmer name) updates it in place, keeping goals & manual checks.
  S.importFacts = (facts, fileLabel) => {
    const s = S.state();
    let farm = Object.values(s.farms).find((x) => x.source === 'save' && x.facts && x.facts.farmName === facts.farmName && x.facts.farmer === facts.farmer);
    const isNew = !farm;
    if (!farm) { const id = U.uid(); farm = s.farms[id] = { id, goals: [], manual: {}, hearts: {}, weather: 'Sunny' }; }
    Object.assign(farm, { name: `${facts.farmName} Farm`, farmer: facts.farmer, source: 'save', updated: Date.now(), importedFrom: fileLabel || '', date: facts.date, money: facts.money, totalEarned: facts.totalEarned, farmType: facts.farmType, facts });
    if (facts.weatherTomorrow) farm.weather = facts.weatherTomorrow;
    s.active = farm.id; S.save(); return { farm, isNew };
  };
  S.remove = (id) => { const s = S.state(); delete s.farms[id]; if (s.active === id) s.active = Object.keys(s.farms)[0] || null; S.save(); };
  S.update = (farm, patch) => { Object.assign(farm, patch, { updated: farm.updated }); S.save(); };
  S.exportAll = () => JSON.stringify(S.state(), null, 1);
  S.importAll = (json) => { const o = JSON.parse(json); if (!o.farms) throw new Error('Not a Pelican Companion backup'); st = o; S.save(); };

  // Manual progress overrides: farm.manual[id] = true
  S.isChecked = (farm, id) => !!(farm && farm.manual && farm.manual[id]);
  S.toggle = (farm, id) => { farm.manual = farm.manual || {}; if (farm.manual[id]) delete farm.manual[id]; else farm.manual[id] = true; S.save(); };

  // Goals
  S.addGoal = (farm, g) => { farm.goals.push({ id: U.uid(), done: false, ...g }); S.save(); };
  S.goal = (farm, id) => farm.goals.find((g) => g.id === id);
  S.delGoal = (farm, id) => { farm.goals = farm.goals.filter((g) => g.id !== id); S.save(); };

  /* ---- Optional: remember the Saves folder using the File System Access API (Chromium browsers) ---- */
  const idb = () => new Promise((res, rej) => { const r = indexedDB.open('sdv-companion', 1); r.onupgradeneeded = () => r.result.createObjectStore('h'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  S.putHandle = async (h) => { const d = await idb(); return new Promise((res) => { const tx = d.transaction('h', 'readwrite'); tx.objectStore('h').put(h, 'saves'); tx.oncomplete = res; }); };
  S.getHandle = async () => { try { const d = await idb(); return await new Promise((res) => { const q = d.transaction('h').objectStore('h').get('saves'); q.onsuccess = () => res(q.result || null); q.onerror = () => res(null); }); } catch (e) { return null; } };
})();
