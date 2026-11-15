/* Crop planner: compare crops for a season, with fertilizer, professions, quality and remaining days. Figures are estimates from base game rules. */
(function () {
  const D = SDV.data, U = SDV.util, { esc, gold } = U, L = SDV.logic, St = SDV.store;
  const FERT = { none: ['No fertilizer', 0], speed: ['Speed-Gro (−10% growth)', 0.1], deluxe: ['Deluxe Speed-Gro (−25%)', 0.25], hyper: ['Hyper Speed-Gro (−33%)', 0.33] };
  const QUAL = { normal: ['Normal', 1], silver: ['Silver', 1.25], gold: ['Gold', 1.5], iridium: ['Iridium', 2] };
  const YIELD = { blueberry: 3, cranberries: 2, 'coffee-bean': 4 };               // items per harvest
  const view = { season: null, farm: null, fert: 'none', tiller: false, agri: false, quality: 'normal', tiles: 20, greenhouse: false, horizon: 28, sort: 'pday', dir: -1, sel: new Set(), onlyBuyable: true };

  function rows(farm) {
    const today = farm.date; const seasonNow = view.season; const start = seasonNow === today.season ? today : { year: today.year + (U.nextSeason(today.season) === seasonNow && today.season === 'Winter' ? 1 : 0), season: seasonNow, day: 1 };
    const speed = (view.agri ? 0.1 : 0) + FERT[view.fert][1]; const mult = QUAL[view.quality][1] * (view.tiller ? 1.1 : 1);
    const list = (view.greenhouse ? D.crops.filter((c) => c.id !== 'cactus-fruit' || true) : L.cropsInSeason(seasonNow).concat(D.crops.filter((c) => c.id === 'cactus-fruit' && false)));
    return list.filter((c) => !view.onlyBuyable || typeof c.seedPrice === 'number').map((c) => {
      const eff = Math.max(1, Math.ceil(c.days * (1 - speed)));
      let left; if (view.greenhouse) left = view.horizon; else { const p = L.plantInfo(c, start); left = p ? p.left : 0; }
      const harvests = left >= eff ? (c.regrow ? 1 + Math.floor((left - eff) / c.regrow) : 1) : 0; const y = YIELD[c.id] || 1; const income = harvests * y * Math.floor(c.sell * mult);
      const cost = typeof c.seedPrice === 'number' ? c.seedPrice : 0; const profit = income - (harvests ? cost : 0); const used = harvests ? eff + (harvests - 1) * (c.regrow || 0) : eff;
      const first = U.addDays(start, eff), last = U.addDays(start, eff + Math.max(0, harvests - 1) * (c.regrow || 0));
      return { c, eff, harvests, income, cost, profit, pday: harvests ? profit / used : -Infinity, total: profit * view.tiles, first, last, y, cant: harvests === 0, unknownSeed: !cost };
    });
  }
  const val = (r, k) => ({ crop: r.c.name, eff: r.eff, harvests: r.harvests, sell: r.c.sell, cost: r.cost, profit: r.profit, pday: r.pday, total: r.total, first: U.absDay(r.first) }[k]);

  SDV.tools.crops = {
    title: 'Crop planner', icon: ['Parsnip', 'crop'], blurb: 'Compare crops by profit, growth and harvest dates — around the days you have left.',
    render: (farm) => {
      if (view.farm !== farm.id || !view.season) { view.farm = farm.id; view.season = farm.date.season; }
      const rs = rows(farm).sort((a, b) => (typeof val(a, view.sort) === 'string' ? val(a, view.sort).localeCompare(val(b, view.sort)) : val(a, view.sort) - val(b, view.sort)) * view.dir);
      const sel = rs.filter((r) => view.sel.has(r.c.id)); const th = (k, l) => `<th><a class="sortlink" data-sort="${k}">${l}${view.sort === k ? (view.dir > 0 ? ' ▲' : ' ▼') : ''}</a></th>`; const maxP = Math.max(1, ...sel.map((r) => Math.abs(r.pday)).filter(isFinite)), maxT = Math.max(1, ...sel.map((r) => Math.abs(r.total)));
      return `<div class="widget"><div class="w-body"><div class="toolbar"><label class="flt">Season<select id="cSeason">${SDV.SEASONS.map((s) => `<option ${s === view.season ? 'selected' : ''}>${s}</option>`).join('')}</select></label><label class="flt">Fertilizer<select id="cFert">${Object.entries(FERT).map(([k, [l]]) => `<option value="${k}" ${k === view.fert ? 'selected' : ''}>${l}</option>`).join('')}</select></label><label class="flt">Crop quality<select id="cQual">${Object.entries(QUAL).map(([k, [l]]) => `<option value="${k}" ${k === view.quality ? 'selected' : ''}>${l}</option>`).join('')}</select></label><label class="flt">Tiles planted<input id="cTiles" type="number" min="1" max="999" value="${view.tiles}" style="width:80px"></label>
        <label class="chk"><input type="checkbox" id="cTill" ${view.tiller ? 'checked' : ''}> Tiller (+10% price)</label><label class="chk"><input type="checkbox" id="cAgri" ${view.agri ? 'checked' : ''}> Agriculturist (−10% growth)</label><label class="chk"><input type="checkbox" id="cGh" ${view.greenhouse ? 'checked' : ''}> Greenhouse / any season</label>${view.greenhouse ? `<label class="flt">Days to plan<input id="cHor" type="number" min="1" max="112" value="${view.horizon}" style="width:80px"></label>` : ''}</div>
        <p class="muted">${view.greenhouse ? `Greenhouse mode: seasons ignored, planning ${view.horizon} days.` : `Planting on ${view.season === farm.date.season ? `today (${U.fmtDate(farm.date)})` : `${view.season} 1`} — crops die at the end of their last season.`} Estimates use base prices; they ignore extra-yield chances, Artisan goods and giant crops.</p>
        <div class="tbl-wrap"><table class="tbl crops"><tr><th></th>${th('crop', 'Crop')}${th('eff', 'Days')}${th('harvests', 'Harvests')}${th('sell', 'Sells')}${th('cost', 'Seed')}${th('profit', 'Profit / plant')}${th('pday', 'Profit / day')}${th('total', `Total (${view.tiles})`)}${th('first', 'First → last harvest')}<th></th></tr>
        ${rs.map((r) => `<tr class="${r.cant ? 'dim' : ''}"><td><input type="checkbox" data-sel="${r.c.id}" ${view.sel.has(r.c.id) ? 'checked' : ''} aria-label="Compare ${esc(r.c.name)}"></td><td>${U.icon(r.c.name, 'crop', 'xs')} <b>${esc(r.c.name)}</b></td><td>${r.eff}${r.c.regrow ? ` <small>↻${r.c.regrow}</small>` : ''}</td><td>${r.cant ? '✖ too late' : '×' + r.harvests}</td><td>${gold(r.c.sell)}</td><td>${r.cost ? gold(r.cost) : '—'}</td><td>${r.cant ? '—' : gold(Math.round(r.profit))}</td><td>${r.cant ? '—' : gold(Math.round(r.pday))}</td><td>${r.cant ? '—' : gold(Math.round(r.total))}</td><td>${r.cant ? '—' : `${U.fmtShort(r.first)} → ${U.fmtShort(r.last)}`}</td><td>${r.cant ? '' : `<button class="btn xs" data-plant="${r.c.id}" title="Adds to your calendar as a harvest reminder">Log planting</button>`}</td></tr>`).join('')}</table></div></div></div>
        ${sel.length >= 2 ? `<div class="widget"><header><h2>Comparison</h2></header><div class="w-body">${sel.map((r) => `<div class="cmp-row"><b>${esc(r.c.name)}</b><div><div class="bar"><i style="width:${Math.max(0, (r.pday / maxP) * 100)}%"></i></div><small>${gold(Math.round(r.pday))} per day</small></div><div><div class="bar"><i style="width:${Math.max(0, (r.total / maxT) * 100)}%;background:var(--yellow-d)"></i></div><small>${gold(Math.round(r.total))} total</small></div></div>`).join('')}</div></div>` : '<p class="muted">Tick two or more crops to compare them side by side.</p>'}`;
    },
    bind: (root, rerender, farm) => {
      const on = (s, ev, fn) => U.$$(s, root).forEach((el) => el.addEventListener(ev, (e) => fn(el, e)));
      on('#cSeason', 'change', (el) => { view.season = el.value; rerender(); }); on('#cFert', 'change', (el) => { view.fert = el.value; rerender(); }); on('#cQual', 'change', (el) => { view.quality = el.value; rerender(); });
      on('#cTiles', 'change', (el) => { view.tiles = Math.max(1, +el.value || 1); rerender(); }); on('#cTill', 'change', (el) => { view.tiller = el.checked; rerender(); }); on('#cAgri', 'change', (el) => { view.agri = el.checked; rerender(); }); on('#cGh', 'change', (el) => { view.greenhouse = el.checked; rerender(); }); on('#cHor', 'change', (el) => { view.horizon = Math.max(1, +el.value || 28); rerender(); });
      on('[data-sort]', 'click', (el) => { if (view.sort === el.dataset.sort) view.dir *= -1; else { view.sort = el.dataset.sort; view.dir = el.dataset.sort === 'crop' ? 1 : -1; } rerender(); });
      on('[data-sel]', 'change', (el) => { if (el.checked) { if (view.sel.size >= 4) { el.checked = false; return U.toast('Compare up to four crops.'); } view.sel.add(el.dataset.sel); } else view.sel.delete(el.dataset.sel); rerender(); });
      on('[data-plant]', 'click', (el) => { const d = view.season === farm.date.season ? farm.date : { year: farm.date.year, season: view.season, day: 1 }; farm.plantings.push({ crop: el.dataset.plant, n: view.tiles, date: { ...d } }); St.touch(farm); U.toast('Planting logged — see the harvest dates on your Calendar 🧺', 'good'); });
    },
  };
})();
