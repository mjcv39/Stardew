/* Challenge generator: optional challenges tailored to the farm's state. Auto-checked where the save/live data allows; otherwise you confirm manually. */
(function () {
  const D = SDV.data, U = SDV.util, { esc } = U, L = SDV.logic, St = SDV.store;
  const view = { type: 'any', diff: 'medium', ideas: [] };
  const TYPES = { any: 'Surprise me', social: 'Friendship', fishing: 'Fishing', farming: 'Farming', explore: 'Exploration', money: 'Money', build: 'Building', collect: 'Collections' };
  const DIFF = { easy: 0, medium: 1, hard: 2 };
  const pick = (a, n = 1) => { const c = a.slice(); const out = []; while (c.length && out.length < n) out.push(c.splice(Math.floor(Math.random() * c.length), 1)[0]); return out; };
  const endOfSeason = (farm) => ({ ...farm.date, day: 28 });

  const makers = {
    social: (farm, k) => { const n = [1, 2, 3][k]; const pool = D.villagers.filter((v) => { const fr = L.friendship(farm, v.name); return (!fr || fr.hearts < (v.marry ? 8 : 10)) && !['Krobus', 'Dwarf', 'Kent', 'Leo'].includes(v.name); }); const vs = pick(pool, n); if (!vs.length) return null; const base = Object.fromEntries(vs.map((v) => [v.name, (L.friendship(farm, v.name) || { hearts: 0 }).hearts]));
      return { title: `Befriend ${U.plural(vs.length, 'villager')}: ${vs.map((v) => v.name).join(', ')}`, desc: 'Raise each by one full heart (give loved gifts, talk daily).', auto: { kind: 'hearts', base }, villagers: vs.map((v) => v.name) }; },
    fishing: (farm, k) => { const n = [2, 4, 6][k]; const needed = L.neededFish(farm); const pool = (needed || D.fish).filter((x) => x.seasons.includes(farm.date.season) && !x.legendary); const fs = pick(pool, Math.min(n, pool.length)); if (!fs.length) return null; const base = farm.facts ? farm.facts.fishCaught.length : null;
      return { title: `Catch ${fs.length} ${needed ? 'new ' : ''}fish this season`, desc: `Ideas: ${fs.map((x) => x.name).join(', ')}.`, auto: base != null ? { kind: 'fish', base, n: fs.length } : null }; },
    farming: (farm, k) => { const c = pick(L.cropsInSeason(farm.date.season).filter((x) => { const p = L.plantInfo(x, farm.date); return p && p.canPlant; }))[0]; if (!c) return null; const n = [10, 25, 60][k]; return { title: `Plant and harvest ${n} ${c.name}`, desc: `${c.days} days to grow — plant by ${U.fmtShort(U.addDays(farm.date, L.plantInfo(c, farm.date).lastPlantDay - farm.date.day))}.`, auto: null }; },
    explore: (farm, k) => { const f = farm.facts; const deep = f ? f.deepestMine : 0; if (deep < 120) { const t = Math.min(120, Math.ceil((deep + [5, 15, 30][k]) / 5) * 5); return { title: `Reach Mines floor ${t}`, desc: 'Bring food and bombs; the elevator saves progress every 5 floors.', auto: f ? { kind: 'mine', n: t } : null }; } const t = Math.max(25, (f.skullDepth || 0) + [10, 25, 50][k]); return { title: `Reach Skull Cavern floor ${t}`, desc: 'Bring plenty of bombs and healing food.', auto: { kind: 'skull', n: t } }; },
    money: (farm, k) => { const f = farm.facts; const target = Math.max(1000, Math.round(((f ? f.totalEarned : farm.money) * [0.02, 0.05, 0.1][k] + 1000) / 500) * 500); return { title: `Earn ${U.gold(target)} before the season ends`, desc: 'Ship crops, fish and artisan goods.', auto: f ? { kind: 'earn', base: f.totalEarned, n: target } : null }; },
    build: (farm) => { const f = farm.facts; const have = f ? f.buildings : (farm.manualData && farm.manualData.buildings) || []; const opts = D.buildings.filter((b) => !/Farmhouse/.test(b.name) && !have.includes(b.name) && b.cost <= Math.max(farm.money * 3, 6000)); const b = pick(opts)[0]; if (!b) return null; return { title: `Build a ${b.name}`, desc: `${U.gold(b.cost)} + ${b.mats}.`, auto: f ? { kind: 'build', name: b.name } : null }; },
    collect: (farm, k) => { const f = farm.facts; if (L.route(farm) !== 'joja') { const bs = L.bundleState(farm); const rooms = D.ccRooms.map((r) => ({ r, left: D.bundles.filter((b) => b.room === r.name && !bs[b.id].done).length })).filter((x) => x.left > 0 && x.r.id !== 'vault').sort((a, b) => a.left - b.left); if (rooms.length && k >= 1) return { title: `Complete the ${rooms[0].r.name}`, desc: `${rooms[0].left} bundle(s) left. Reward: ${rooms[0].r.reward}.`, auto: f ? { kind: 'room', flag: rooms[0].r.flag } : null }; }
      const n = [5, 10, 20][k]; const base = f && f.museumFound ? f.museumDonated.length : null; return { title: `Donate ${n} more items to the Museum`, desc: 'Artifacts and minerals both count.', auto: base != null ? { kind: 'museum', base, n } : null }; },
  };
  const generate = () => { const farm = St.active(); const k = DIFF[view.diff]; const types = view.type === 'any' ? Object.keys(makers) : [view.type]; const out = []; for (const t of pick(types, view.type === 'any' ? 3 : 3)) { for (let i = 0; i < (view.type === 'any' ? 1 : 3); i++) { const c = makers[t](farm, k); if (c) out.push({ ...c, type: t, difficulty: view.diff }); } } view.ideas = out.length ? out : []; };

  // Evaluate auto-checks against current facts
  const progress = (farm, c) => { const f = farm.facts, a = c.auto; if (!a || !f) return null;
    if (a.kind === 'hearts') { const done = Object.entries(a.base).filter(([n, h]) => (L.friendship(farm, n) || { hearts: 0 }).hearts > h).length; return [done, Object.keys(a.base).length]; }
    if (a.kind === 'fish') return [f.fishCaught.length - a.base, a.n]; if (a.kind === 'mine') return [f.deepestMine, a.n]; if (a.kind === 'skull') return [f.skullDepth, a.n]; if (a.kind === 'earn') return [f.totalEarned - a.base, a.n];
    if (a.kind === 'build') return [f.buildings.includes(a.name) ? 1 : 0, 1]; if (a.kind === 'room') return [f.mail.includes(a.flag) || f.mail.includes('ccIsComplete') ? 1 : 0, 1]; if (a.kind === 'museum') return [f.museumDonated.length - a.base, a.n]; return null; };
  SDV.challengeProgress = progress;

  SDV.tools.challenges = {
    title: 'Challenge generator', icon: ['Trophy', 'achievement'], blurb: 'Optional goals tuned to your farm. Pick a type and difficulty, accept one, and track it.',
    render: (farm) => {
      const active = farm.challenges.filter((c) => !c.done && !c.dropped), past = farm.challenges.filter((c) => c.done || c.dropped);
      return `<div class="widget"><div class="w-body"><div class="toolbar"><label class="flt">Type<select id="chType">${Object.entries(TYPES).map(([k, l]) => `<option value="${k}" ${view.type === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label><label class="flt">Difficulty<select id="chDiff">${Object.keys(DIFF).map((k) => `<option ${view.diff === k ? 'selected' : ''}>${k}</option>`).join('')}</select></label><button class="btn" id="chGen">🎲 Generate ideas</button></div>
        ${view.ideas.length ? `<div class="grid">${view.ideas.map((c, i) => `<div class="card-in"><span class="tag cal">${TYPES[c.type]} · ${c.difficulty}</span><h3>${esc(c.title)}</h3><p>${esc(c.desc)}</p><p class="muted">${c.auto ? 'Tracked automatically from your save.' : 'You confirm this one yourself.'}</p><button class="btn xs" data-accept="${i}">Accept challenge</button></div>`).join('')}</div>` : '<p class="muted">Press “Generate ideas” for challenges based on your current season, friendships, fish, buildings and collections.</p>'}</div></div>
      <div class="widget"><header><h2>Active challenges (${active.length})</h2></header><div class="w-body">${active.map((c) => { const p = progress(farm, c); return `<div class="goal"><label class="chk"><input type="checkbox" data-cdone="${c.id}" ${p && p[0] >= p[1] ? 'checked' : ''}><span><b>${esc(c.title)}</b><small>${esc(c.desc)} · by ${U.fmtShort(c.deadline)}</small></span></label>${p ? `<span class="due">${Math.max(0, Math.round(p[0]))}/${Math.round(p[1])} <span class="tag auto">auto</span></span>` : '<span class="tag manual">manual</span>'}<button class="btn xs ghost" data-cdrop="${c.id}" aria-label="Abandon">✕</button></div>`; }).join('') || '<p class="muted">None yet.</p>'}</div></div>
      ${past.length ? `<div class="widget"><header><h2>History</h2></header><div class="w-body">${past.slice(-10).reverse().map((c) => `<div class="row">${c.done ? '✅' : '↩'} <div><b>${esc(c.title)}</b><small>${c.done ? 'completed' : 'abandoned'}</small></div></div>`).join('')}</div></div>` : ''}`;
    },
    bind: (root, rerender, farm) => {
      const on = (s, ev, fn) => U.$$(s, root).forEach((el) => el.addEventListener(ev, (e) => fn(el, e)));
      on('#chType', 'change', (el) => { view.type = el.value; }); on('#chDiff', 'change', (el) => { view.diff = el.value; });
      on('#chGen', 'click', () => { generate(); rerender(); if (!view.ideas.length) U.toast('No suitable challenge found — try another type.'); });
      on('[data-accept]', 'click', (el) => { const c = view.ideas[+el.dataset.accept]; const dl = endOfSeason(farm); const goal = St.addGoal(farm, { title: c.title, note: 'Challenge', priority: 'normal', kind: 'challenge', due: dl }); farm.challenges.push({ id: U.uid(), title: c.title, desc: c.desc, type: c.type, difficulty: c.difficulty, auto: c.auto, accepted: { ...farm.date }, deadline: dl, done: false, goalId: goal.id }); view.ideas.splice(+el.dataset.accept, 1); St.touch(farm); U.toast('Challenge accepted — added to your goals and calendar.', 'good'); });
      on('[data-cdone]', 'change', (el) => { const c = farm.challenges.find((x) => x.id === el.dataset.cdone); c.done = el.checked; const g = farm.goals.find((x) => x.id === c.goalId); if (g) g.done = el.checked; St.touch(farm); });
      on('[data-cdrop]', 'click', (el) => { const c = farm.challenges.find((x) => x.id === el.dataset.cdrop); c.dropped = true; farm.goals = farm.goals.filter((g) => g.id !== c.goalId); St.touch(farm); });
    },
  };
  // Auto-complete challenges whenever data syncs
  SDV.on('farm-changed', () => { const farm = St.active(); if (!farm || !farm.facts) return; let ch = false; for (const c of farm.challenges) { if (c.done || c.dropped) continue; const p = progress(farm, c); if (p && p[0] >= p[1]) { c.done = true; const g = farm.goals.find((x) => x.id === c.goalId); if (g) g.done = true; ch = true; } } if (ch) { St.saveQuiet(); U.toast('Challenge completed! 🏆', 'good'); } });
})();
