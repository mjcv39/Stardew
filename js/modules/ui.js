/* App shell: router, six-place navigation, modal, seasonal/dark theming, connection pill, farm picker. */
(function () {
  const U = SDV.util, { $, $$, esc } = U, St = SDV.store;
  const UI = (SDV.ui = {});

  const PLACES = [
    { key: 'farm', path: '', label: 'My Farm', art: 'farm', blurb: 'Your farmhouse' },
    { key: 'calendar', path: 'calendar', label: 'Calendar', art: 'calendar', blurb: 'Town noticeboard' },
    { key: 'progress', path: 'progress', label: 'Progress', art: 'progress', blurb: 'Community Center' },
    { key: 'journal', path: 'journal', label: 'My Journal', art: 'journal', blurb: 'Personal diary' },
    { key: 'tools', path: 'tools', label: 'Planning Tools', art: 'tools', blurb: 'Greenhouse & workshop' },
    { key: 'guide', path: 'guide', label: 'My Little Guide', art: 'guide', blurb: 'Moss & settings' },
  ];
  UI.places = PLACES;
  UI.built = (href) => { const k = String(href || '').replace(/^#\/?/, '').split(/[/?]/)[0] || 'farm'; const pg = SDV.pages[k]; return !!(pg && !pg.later); };

  /* ---- modal ---- */
  UI.modal = (html, bind, cls = '') => {
    const m = $('#modalRoot'); m.innerHTML = `<div class="modal-bg" data-close></div><div class="modal ${cls}" role="dialog" aria-modal="true"><button class="x-btn" data-close aria-label="Close">✕</button><div class="modal-body">${html}</div></div>`;
    $$('[data-close]', m).forEach((e) => e.addEventListener('click', UI.close)); const body = $('.modal-body', m); if (bind) bind(body); const first = $('input,select,textarea', body); if (first) first.focus();
    return body;
  };
  UI.close = () => { const m = $('#modalRoot'); if (!m.innerHTML) return; m.innerHTML = ''; UI.rerender(); };
  UI.confirm = (text, yes = 'Yes', cb) => UI.modal(`<p class="lead">${esc(text)}</p><div class="row-end"><button class="btn ghost" data-close>Cancel</button><button class="btn danger" id="cYes">${esc(yes)}</button></div>`, (b) => $('#cYes', b).addEventListener('click', () => { UI.close(); cb(); }));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') UI.close(); });

  /* ---- themes ---- */
  UI.applyTheme = () => {
    const p = St.prefs(), farm = St.active();
    const season = p.seasonTheme !== 'auto' ? p.seasonTheme : farm ? farm.date.season : ['Spring', 'Summer', 'Fall', 'Winter'][Math.floor(((new Date().getMonth() + 10) % 12) / 3)];
    const dark = p.theme === 'dark' || (p.theme === 'auto' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
    document.body.dataset.season = season; document.body.dataset.theme = dark ? 'dark' : 'light';
    const sc = $('#sceneArt'); if (sc) sc.innerHTML = SDV.art.scene(season).replace('<svg ', '<svg preserveAspectRatio="xMidYMax slice" ');
    const parts = $('#particles'); if (parts && parts.dataset.s !== season) { parts.dataset.s = season; parts.innerHTML = Array.from({ length: season === 'Summer' ? 10 : 18 }, (_, i) => `<i style="left:${(i * 53) % 100}%;animation-delay:${-(i * 1.7) % 14}s;animation-duration:${9 + (i % 5) * 2}s"></i>`).join(''); }
    const fav = $('#favicon'); if (fav) fav.href = SDV.sprites.get('Sunflower', 'crop');
  };

  /* ---- shell chrome ---- */
  function renderNav(active) {
    const html = PLACES.map((p) => `<a class="place ${p.key === active ? 'on' : ''}" href="#/${p.path}" title="${p.blurb}">${SDV.art.nav(p.art)}<span>${p.label}</span></a>`).join('');
    $('#places').innerHTML = html; $('#tabbar').innerHTML = html;
  }
  function renderHeader() {
    const farms = St.farms(), a = St.active(); const st = SDV.sync.status(a);
    $('#farmPick').innerHTML = farms.length ? `<label class="vh" for="farmSel">Active farm</label><select id="farmSel">${farms.map((f) => `<option value="${f.id}" ${a && a.id === f.id ? 'selected' : ''}>${U.esc(f.name)}</option>`).join('')}</select>` : '';
    const sel = $('#farmSel'); if (sel) sel.onchange = () => { St.setActive(sel.value); UI.route(); };
    $('#connPill').innerHTML = a ? `<a href="#/" class="pill tone-${st.tone}" title="${esc(st.detail)}"><i class="dot"></i>${esc(st.label)}</a>` : '<a href="#/" class="pill tone-idle"><i class="dot"></i>No farm yet</a>';
  }
  UI.refreshChrome = () => { renderHeader(); UI.applyTheme(); };

  /* ---- routing ---- */
  UI.route = () => {
    const [path, qs] = (location.hash || '#/').slice(1).split('?'); const params = Object.fromEntries(new URLSearchParams(qs || ''));
    const parts = path.split('/').filter(Boolean); const key = parts[0] || 'farm'; const page = SDV.pages[key] || SDV.pages.farm;
    const m = $('#main'); const scroll = UI._keepScroll ? window.scrollY : 0; UI._keepScroll = false;
    m.innerHTML = page.render({ parts, params }); renderNav(SDV.pages[key] ? key : 'farm'); UI.refreshChrome();
    if (page.bind) page.bind(m, () => { UI._keepScroll = true; UI.route(); }, { parts, params });
    window.scrollTo(0, scroll); document.title = (($('h1', m) || {}).textContent || 'My Farm').replace(/\s+/g, ' ').trim() + ' · Your Little Farm';
    if (SDV.assistant) SDV.assistant.render(); m.focus({ preventScroll: true });
  };
  UI.rerender = () => { UI._keepScroll = true; UI.route(); };
  window.addEventListener('hashchange', UI.route);
  ['farm-changed', 'sync-status', 'prefs', 'store', 'live-age'].forEach((e) => SDV.on(e, () => { if (!document.querySelector('.modal')) UI.rerender(); else UI.refreshChrome(); }));

  UI.boot = () => {
    St.load(); SDV.sync.startWatching(); if (SDV.live.paired()) SDV.live.start();
    $('#brand').innerHTML = `${SDV.art.moss('happy')}<span><b>Your Little Farm</b><small>a cozy Stardew companion</small></span>`;
    if (window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', UI.applyTheme);
    UI.route();
    if (St._migrated) U.toast(`Brought over ${U.plural(St._migrated, 'farm')} from the earlier version 🌾`, 'good');
  };
})();
