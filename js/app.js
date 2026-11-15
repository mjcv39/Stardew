/* App shell: router, nav, search UI, modal, farm picker. */
(function () {
  const U = SDV.util, { $, $$, esc } = U, St = SDV.store;
  const root = () => $('#main');
  SDV.emit = (n) => n === 'store' && renderFarmPick();

  const NAV = [
    ['#/', '🏠', 'Dashboard'], ['#/calendar', '📅', 'Calendar'], ['#/tracker', '🏆', 'Progress'], ['#/goals', '📝', 'Goals'], ['#/wiki', '📖', 'Wiki'], ['#/farms', '🚜', 'Farms & Import'],
  ];
  const QUICK = [['fishing', '🎣', 'Fish'], ['characters', '🧑‍🌾', 'Villagers'], ['farming', '🌱', 'Crops'], ['cc', '🎁', 'Bundles'], ['cooking', '🍲', 'Recipes']];

  // ---- modal ----
  SDV.modal = (html, bind) => {
    const m = $('#modalRoot');
    m.innerHTML = `<div class="modal-bg" data-close></div><div class="modal" role="dialog" aria-modal="true"><button class="px-btn sm close" data-close aria-label="Close">✖</button><div class="modal-body">${html}</div></div>`;
    $$('[data-close]', m).forEach((e) => e.addEventListener('click', () => SDV.closeModal()));
    if (bind) bind($('.modal-body', m));
    $('.modal', m).focus && $('.modal', m).setAttribute('tabindex', '-1');
  };
  SDV.closeModal = () => { $('#modalRoot').innerHTML = ''; };
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { SDV.closeModal(); hideSuggest(); }
    if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); $('#searchBox').focus(); }
  });

  // ---- nav ----
  function renderNav() {
    const h = location.hash || '#/';
    $('#sidenav').innerHTML = NAV.map(([href, ic, t]) => `<a href="${href}" class="${(href === '#/' ? h === '#/' || h === '' : h.startsWith(href)) ? 'on' : ''}"><span>${ic}</span>${t}</a>`).join('') +
      `<div class="nav-sec">Quick access</div>` + QUICK.map(([k, ic, t]) => `<a href="#/wiki/${k}" class="sub"><span>${ic}</span>${t}</a>`).join('') +
      `<div class="nav-sec">All categories</div>` + SDV.cats.map((c) => `<a href="#/wiki/${c.key}" class="sub ${h.startsWith('#/wiki/' + c.key) ? 'on' : ''}"><span>${c.icon}</span>${c.title}</a>`).join('');
    document.body.classList.remove('nav-open');
  }
  function renderFarmPick() {
    const farms = St.farms(), a = St.active(); const el = $('#farmPick'); if (!el) return;
    el.innerHTML = farms.length ? `<label class="visually-hidden" for="farmSel">Active farm</label><select id="farmSel" title="Switch farm">${farms.map((f) => `<option value="${f.id}" ${a && a.id === f.id ? 'selected' : ''}>${f.source === 'save' ? '💾' : '✍️'} ${esc(f.name)}</option>`).join('')}</select>` : `<a class="px-btn sm" href="#/farms">+ Add farm</a>`;
    const s = $('#farmSel'); if (s) s.addEventListener('change', () => { St.setActive(s.value); route(); });
  }

  // ---- routing ----
  function route() {
    const [path, qs] = (location.hash || '#/').slice(1).split('?'); const params = Object.fromEntries(new URLSearchParams(qs || ''));
    const parts = path.split('/').filter(Boolean); const m = root(); let html = '', view = null;
    const V = SDV.views;
    if (!parts.length) { html = V.dashboard.render(); view = V.dashboard; }
    else if (parts[0] === 'calendar') { html = V.calendar.render(); view = V.calendar; }
    else if (parts[0] === 'tracker') { html = V.tracker.render(); view = V.tracker; }
    else if (parts[0] === 'goals') { html = V.goals.render(); view = V.goals; }
    else if (parts[0] === 'farms') { html = V.farms.render(); view = V.farms; }
    else if (parts[0] === 'search') { html = searchPage(params); view = { bind: bindSearchPage }; }
    else if (parts[0] === 'item') { html = V.wiki.item(parts[1], parts[2]); view = V.wiki; }
    else if (parts[0] === 'wiki') { html = parts[1] ? V.wiki.list(parts[1], params) : V.wiki.home(); view = V.wiki; }
    else html = '<div class="page"><h1>Page not found</h1><a href="#/">Home</a></div>';
    const y = window.scrollY; m.innerHTML = html; renderNav();
    if (view && view.bind) view.bind(m, () => { const sy = window.scrollY; route(); window.scrollTo(0, sy); });
    if (!window.__sameRoute) window.scrollTo(0, 0);
    document.title = 'Pelican Companion – ' + (($('h1', m) || {}).textContent || 'Stardew');
  }
  window.addEventListener('hashchange', () => { window.__sameRoute = false; route(); });

  // ---- search ----
  const sb = () => $('#searchBox'), sg = () => $('#suggest');
  let sel = -1;
  function hideSuggest() { sg().hidden = true; sel = -1; }
  function renderSuggest() {
    const q = sb().value.trim(); if (!q) return hideSuggest();
    const res = SDV.search.run(q, { limit: 8 });
    sg().hidden = false;
    sg().innerHTML = res.length ? res.map((e, i) => `<a role="option" class="sg" data-i="${i}" href="#/item/${e.key}/${e.id}">${e.row && SDV.sets[e.key].portrait ? U.portrait(e.row, 'sm') : U.icon(e.name, e.cat, 'sm')}<span><b>${esc(e.name)}</b><small>${esc(e.kind)} · ${esc((e.desc || '').slice(0, 60))}</small></span></a>`).join('') + `<a class="sg all" href="#/search?q=${encodeURIComponent(q)}">See all results for “${esc(q)}” ↵</a>` : '<div class="sg none">No matches</div>';
  }
  function bindSearch() {
    const b = sb();
    b.addEventListener('input', U.debounce(renderSuggest, 80));
    b.addEventListener('focus', renderSuggest);
    b.addEventListener('keydown', (e) => {
      const items = $$('#suggest a.sg'); if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % (items.length || 1); items.forEach((a, i) => a.classList.toggle('hl', i === sel)); }
      else if (e.key === 'Enter') { e.preventDefault(); const t = items[sel] || null; hideSuggest(); location.hash = t ? t.getAttribute('href') : `#/search?q=${encodeURIComponent(b.value.trim())}`; b.blur(); }
    });
    document.addEventListener('click', (e) => { if (!$('#searchWrap').contains(e.target)) hideSuggest(); });
    sg().addEventListener('click', () => { hideSuggest(); });
  }
  function searchPage(p) {
    const q = p.q || '', key = p.k || '', season = p.s || '';
    const res = SDV.search.run(q, { key, season, limit: 120 });
    const kinds = [...new Set(SDV.search.idx().map((e) => e.key))];
    const quick = QUICK_SEARCH.map((s) => `<a class="chip" href="#/search?q=${encodeURIComponent(s)}">${s}</a>`).join('');
    return `<div class="page"><h1 class="px-h">🔎 Search</h1>
      <form id="sForm" class="toolbar"><input name="q" type="search" value="${esc(q)}" placeholder="Search everything…" autofocus>
        <label class="flt"><span>Category</span><select name="k"><option value="">All</option>${kinds.map((k) => `<option value="${k}" ${k === key ? 'selected' : ''}>${esc(SDV.sets[k].label)}</option>`).join('')}</select></label>
        <label class="flt"><span>Season</span><select name="s"><option value="">Any</option>${SDV.SEASONS.map((s) => `<option ${s === season ? 'selected' : ''}>${s}</option>`).join('')}</select></label><button class="px-btn">Search</button></form>
      <p class="muted">Try:</p><div class="chips">${quick}</div>
      <p class="muted">${res.length} result${res.length === 1 ? '' : 's'}</p>
      <div class="grid">${res.map((e) => `<a class="card entry" href="#/item/${e.key}/${e.id}">${SDV.sets[e.key].portrait ? U.portrait(e.row, 'lg') : U.icon(e.name, e.cat, 'lg')}<div class="entry-t"><b>${esc(e.name)}</b><small>${esc(e.kind)}</small><small>${esc((e.desc || '').slice(0, 90))}</small></div></a>`).join('')}</div></div>`;
  }
  const QUICK_SEARCH = ['summer fish', 'winter crops', 'loves diamond', 'rainy', 'bundle', 'Abigail', 'Pumpkin', 'Skull Cavern'];
  function bindSearchPage(m) { const f = $('#sForm', m); f.addEventListener('submit', (e) => { e.preventDefault(); const d = new FormData(f); location.hash = `#/search?q=${encodeURIComponent(d.get('q') || '')}&k=${d.get('k') || ''}&s=${d.get('s') || ''}`; }); }

  // ---- boot ----
  St.load();
  $('#menuBtn').addEventListener('click', () => document.body.classList.toggle('nav-open'));
  bindSearch(); renderFarmPick();
  document.addEventListener('change', (e) => { if (e.target.matches && e.target.matches('[data-manual]')) { /* handled in wiki view */ } });
  route();
})();
