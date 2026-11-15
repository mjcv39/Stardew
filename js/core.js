/* Your Little Farm — core utilities: namespace, event bus, date maths, formatting, portraits. */
(function () {
  const SDV = (window.SDV = { data: {}, pages: {}, tools: {} });
  SDV.SEASONS = ['Spring', 'Summer', 'Fall', 'Winter'];
  const U = (SDV.util = {});

  U.esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  U.slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  U.$ = (sel, el = document) => el.querySelector(sel);
  U.$$ = (sel, el = document) => [...el.querySelectorAll(sel)];
  U.gold = (n) => (n == null || n === '' || Number.isNaN(+n) ? '—' : Number(n).toLocaleString() + 'g');
  U.wikiUrl = (name) => 'https://stardewvalleywiki.com/' + encodeURIComponent(String(name).replace(/ /g, '_'));
  U.uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-3);
  U.pct = (a, b) => (b ? Math.round((Math.min(a, b) / b) * 100) : 0);
  U.debounce = (fn, ms = 150) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  U.plural = (n, w) => `${n} ${n === 1 || w === 'fish' ? w : w + 's'}`;
  U.ago = (ts) => { const s = (Date.now() - ts) / 1000; if (s < 60) return 'just now'; if (s < 3600) return Math.floor(s / 60) + ' min ago'; if (s < 86400) return Math.floor(s / 3600) + ' h ago'; return Math.floor(s / 86400) + ' d ago'; };
  U.hours = (ms) => (ms ? Math.round(ms / 360000) / 10 + ' h' : '—');

  // tiny pub/sub
  const subs = {};
  SDV.on = (ev, fn) => ((subs[ev] = subs[ev] || []).push(fn), fn);
  SDV.emit = (ev, d) => (subs[ev] || []).forEach((f) => { try { f(d); } catch (e) { console.error(e); } });

  /* ---------- Dates: {year, season, day} ---------- */
  U.doy = (d) => SDV.SEASONS.indexOf(d.season) * 28 + d.day - 1;
  U.fromDoy = (n, year) => ({ year, season: SDV.SEASONS[Math.floor(n / 28)], day: (n % 28) + 1 });
  U.absDay = (d) => (d.year - 1) * 112 + U.doy(d);
  U.fromAbs = (t) => { t = Math.max(0, t); return U.fromDoy(t % 112, Math.floor(t / 112) + 1); };
  U.addDays = (d, n) => U.fromAbs(U.absDay(d) + n);
  U.daysBetween = (a, b) => U.absDay(b) - U.absDay(a);
  U.dayOfWeek = (day) => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][(day - 1) % 7];
  U.fmtDate = (d) => `${d.season} ${d.day}, Year ${d.year}`;
  U.fmtShort = (d) => `${d.season.slice(0, 3)} ${d.day}`;
  U.nextSeason = (s) => SDV.SEASONS[(SDV.SEASONS.indexOf(s) + 1) % 4];
  U.fmtTime = (h) => { h = h % 24; const ap = h >= 12 ? 'pm' : 'am'; return (h % 12 || 12) + ap; };
  U.inWindow = (w, hour) => !w || !w.length || w.some(([a, b]) => (hour >= a && hour < b) || (b > 24 && hour < b - 24));
  U.fmtWindows = (w) => (!w || !w.length ? 'All day' : w.map(([a, b]) => `${U.fmtTime(a)}–${U.fmtTime(b)}`).join(', '));

  /* ---------- Sprites ---------- */
  U.icon = (name, cat, size = 'md') => `<span class="ico ico-${size}" aria-hidden="true">${SDV.sprites.img(name, cat)}</span>`;
  U.seasonDot = (s) => `<span class="sdot s-${s}" title="${s}"></span>`;
  U.seasonChips = (arr) => (arr || []).map((s) => (s === 'Any' ? '<span class="chip s-any">Year-round</span>' : `<span class="chip s-${s}">${U.seasonDot(s)}${s}</span>`)).join('');

  // Original 16x16 pixel portraits for villagers (generated; not game art)
  const pcache = {};
  const ACC = { Maru: 'glasses', Harvey: 'stache', Lewis: 'hat', Wizard: 'hat', Willy: 'cap', Gus: 'stache', Pierre: 'stache', George: 'stache', Evelyn: 'bun', Penny: 'freckles', Sam: 'freckles', Jas: 'bun', Pam: 'freckles', Linus: 'cap' };
  U.portraitURL = (v) => {
    const key = v.name + (v.custom || '');
    if (pcache[key]) return pcache[key];
    const c = document.createElement('canvas'); c.width = c.height = 16; const g = c.getContext('2d');
    const [hair, skin, shirt, style, eye] = v.look || ['#6b4a2b', '#f1c9a0', '#6a8fc2', 0, '#2a2a2a'];
    const px = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
    px(0, 0, 16, 16, v.bg || '#d9ecd0'); px(0, 11, 16, 5, '#b9d49a');
    px(3, 12, 10, 4, shirt); px(6, 11, 4, 1, skin); px(4, 3, 8, 8, skin);
    if (style === 1) { px(3, 2, 10, 3, hair); px(3, 5, 2, 8, hair); px(11, 5, 2, 8, hair); }
    else if (style === 2) { px(4, 2, 8, 2, hair); px(5, 1, 6, 1, hair); }
    else if (style === 3) { px(3, 2, 10, 3, hair); px(4, 9, 8, 3, hair); px(5, 8, 6, 1, skin); }
    else if (style === 4) { px(4, 2, 8, 1, hair); px(5, 3, 6, 1, hair); }
    else if (style === 5) { px(3, 1, 10, 4, hair); px(2, 4, 2, 3, hair); px(12, 4, 2, 3, hair); }
    else { px(3, 2, 10, 3, hair); px(3, 5, 1, 3, hair); px(12, 5, 1, 3, hair); }
    px(6, 6, 1, 2, eye); px(9, 6, 1, 2, eye); px(7, 9, 2, 1, '#b5604a'); px(5, 8, 1, 1, '#f0a090'); px(10, 8, 1, 1, '#f0a090');
    const acc = v.acc || ACC[v.name];
    if (acc === 'glasses') { [[5, 5], [8, 5], [5, 7], [8, 7]].forEach(([x, y]) => px(x, y, 3, 1, '#2a2a2a')); px(5, 6, 1, 1, '#2a2a2a'); px(7, 6, 2, 1, '#2a2a2a'); px(10, 6, 1, 1, '#2a2a2a'); }
    if (acc === 'stache') px(6, 8, 4, 1, hair);
    if (acc === 'hat') { px(3, 1, 10, 2, '#5a3a8a'); px(5, 0, 6, 1, '#5a3a8a'); px(2, 3, 12, 1, '#4a2a7a'); }
    if (acc === 'cap') { px(3, 1, 10, 2, '#3a5a8a'); px(2, 3, 12, 1, '#2a4a7a'); }
    if (acc === 'bun') px(6, 0, 4, 2, hair);
    if (acc === 'freckles') { [[5, 7], [10, 7], [6, 8], [9, 8]].forEach(([x, y]) => px(x, y, 1, 1, '#c8805a')); }
    px(4, 10, 8, 1, 'rgba(0,0,0,.12)');
    return (pcache[key] = c.toDataURL());
  };
  U.portrait = (v, size = 'md') => `<img class="portrait portrait-${size}" src="${U.portraitURL(v)}" alt="${U.esc(v.name)}" width="16" height="16">`;

  // Farmer avatar from save appearance (approximate, original art). look = {hair,skin,eye,pants}
  U.farmerAvatar = (look, size = 'xl') => {
    const l = look || {}; const v = { name: 'Farmer', custom: JSON.stringify(l), look: [l.hair || '#7a4a2a', l.skin || '#f1c9a0', l.shirt || '#8aa6d0', 2, l.eye || '#2a3a5a'], bg: '#e8f0d0', acc: 'cap' };
    return U.portrait(v, size);
  };

  U.toast = (msg, kind = '') => { const t = document.getElementById('toast'); if (!t) return; t.textContent = msg; t.className = 'show ' + kind; clearTimeout(U._tt); U._tt = setTimeout(() => (t.className = ''), 3200); };
  U.download = (name, data, type = 'application/json') => { const a = document.createElement('a'); a.href = data instanceof Blob ? URL.createObjectURL(data) : URL.createObjectURL(new Blob([data], { type })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); };
})();
