/* "Moss" — the optional forest-spirit helper. Speaks only from real recommendations / real sync events. Can be minimized or turned off. */
(function () {
  const U = SDV.util, St = SDV.store;
  const M = (SDV.assistant = {});
  let idx = 0, msg = null;

  const pick = () => {
    const farm = St.active();
    if (msg && Date.now() - msg.t < 20000) return msg;
    if (!farm) return { text: 'Hello! I\'m Moss. Create a farm profile or import your save and I\'ll help you keep track of everything.', expr: 'happy', href: '#/farm' };
    const recs = SDV.recs.today(farm);
    if (!recs.length) return { text: farm.facts ? 'Nothing urgent today — a calm day on the farm. 🌱' : 'Nothing urgent from the calendar. Import a save so I can look at your real progress!', expr: 'sleepy' };
    const r = recs[idx % recs.length]; return { text: r.title + (r.detail ? ' — ' + r.detail : ''), expr: r.prio >= 90 ? 'wow' : 'happy', href: r.href, n: recs.length };
  };
  M.say = (text, expr = 'wow', href) => { msg = { text, expr, href, t: Date.now() }; M.render(); };

  M.render = () => {
    let el = document.getElementById('moss'); const p = St.prefs();
    if (!p.assistant) { if (el) el.remove(); return; }
    if (!el) { el = document.createElement('aside'); el.id = 'moss'; el.setAttribute('aria-label', 'Moss, your helper'); document.body.appendChild(el); }
    if (p.assistantMin) { el.className = 'min'; el.innerHTML = `<button class="moss-btn" aria-label="Show Moss" data-act="open">${SDV.art.moss('happy')}</button>`; }
    else {
      const m = pick(); el.className = '';
      el.innerHTML = `<div class="bubble"><div class="bubble-text">${U.esc(m.text)}</div><div class="bubble-actions">${m.href ? `<a href="${m.href}" class="mini-btn">Take me there</a>` : ''}<button class="mini-btn" data-act="next">${m.n > 1 ? `Next (${m.n})` : 'Hi!'}</button><button class="mini-btn" data-act="min" aria-label="Minimize">–</button></div></div><button class="moss-btn" aria-label="Moss" data-act="next">${SDV.art.moss(m.expr)}</button>`;
    }
    el.onclick = (e) => { const a = e.target.closest('[data-act]'); if (!a) return; const act = a.dataset.act; if (act === 'min') St.setPref('assistantMin', true); else if (act === 'open') St.setPref('assistantMin', false); else if (act === 'next') { idx++; msg = null; M.render(); } };
  };
  SDV.on('prefs', M.render); SDV.on('farm-changed', () => { idx = 0; msg = null; M.render(); });
  SDV.on('synced', ({ farm, isNew, events }) => { const real = events.filter((e) => !['time', 'connect', 'more'].includes(e.kind)); M.say(isNew ? `Your farm is connected! I found ${farm.facts.farmName} Farm — ${U.fmtDate(farm.date)}.` : real.length ? `Welcome back! ${real.length} thing${real.length > 1 ? 's' : ''} changed: ${real.slice(0, 2).map((e) => e.text).join('; ')}.` : 'Synced — nothing new since last time.', real.length ? 'wow' : 'happy', '#/farm'); });
})();
