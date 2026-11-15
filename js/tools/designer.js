/* Farm designer: a grid-based planning canvas. Place buildings, crops, sprinklers, paths and decorations; see sprinkler/scarecrow coverage;
   save several layouts per farm; use a screenshot of your real farm as a tracing reference.
   IMPORTANT: this is a blank planning grid, not an exact map of any in-game farm; building footprints are approximate planning sizes. */
(function () {
  const D = SDV.data, U = SDV.util, { esc } = U, St = SDV.store, UI = SDV.ui, M = SDV.media;
  const B = (label, w, h, color, sp, cat = 'Buildings') => ({ label, w, h, color, sp, cat });
  const ITEMS = {
    coop: B('Coop', 6, 3, '#c98a5a', ['Coop', 'building']), bigcoop: B('Big Coop', 6, 3, '#c9784a', ['Big Coop', 'building']), deluxecoop: B('Deluxe Coop', 6, 3, '#c0683a', ['Deluxe Coop', 'building']),
    barn: B('Barn', 7, 4, '#b5583a', ['Barn', 'building']), bigbarn: B('Big Barn', 7, 4, '#a84c32', ['Big Barn', 'building']), deluxebarn: B('Deluxe Barn', 7, 4, '#9a4028', ['Deluxe Barn', 'building']),
    silo: B('Silo', 3, 3, '#a8a8b0', ['Silo', 'building']), well: B('Well', 3, 3, '#8aa0b8', ['Well', 'building']), stable: B('Stable', 4, 2, '#b08a5a', ['Stable', 'building']), mill: B('Mill', 4, 2, '#c8b08a', ['Mill', 'building']),
    shed: B('Shed', 7, 3, '#b89a7a', ['Shed', 'building']), pond: B('Fish Pond', 5, 5, '#6ab4e0', ['Fish Pond', 'building']), slime: B('Slime Hutch', 11, 6, '#7aca7a', ['Slime Hutch', 'building']), junimo: B('Junimo Hut', 3, 2, '#9ac86a', ['Junimo Hut', 'building']), obelisk: B('Obelisk', 3, 2, '#8a70b8', ['Earth Obelisk', 'building']), greenhouse: B('Greenhouse', 7, 6, '#9ad8b0', ['Greenhouse', 'building']), house: B('Farmhouse', 9, 6, '#d9b080', ['House', 'building']),
    sprinkler: B('Sprinkler', 1, 1, '#6ab4e0', ['Sprinkler', 'craft'], 'Watering'), qsprinkler: B('Quality Sprinkler', 1, 1, '#4a94d0', ['Quality Sprinkler', 'craft'], 'Watering'), isprinkler: B('Iridium Sprinkler', 1, 1, '#a070d8', ['Iridium Sprinkler', 'craft'], 'Watering'), scarecrow: B('Scarecrow', 1, 1, '#d8a050', ['Scarecrow', 'craft'], 'Watering'),
    parsnip: B('Parsnip', 1, 1, '#f0e0b0', ['Parsnip', 'crop'], 'Crops'), cauliflower: B('Cauliflower', 1, 1, '#f4f0e0', ['Cauliflower', 'crop'], 'Crops'), potato: B('Potato', 1, 1, '#c8a060', ['Potato', 'crop'], 'Crops'), strawberry: B('Strawberry', 1, 1, '#e0384a', ['Strawberry', 'crop'], 'Crops'), melon: B('Melon', 1, 1, '#9ad46a', ['Melon', 'crop'], 'Crops'), starfruit: B('Starfruit', 1, 1, '#f4c43a', ['Starfruit', 'crop'], 'Crops'), pumpkin: B('Pumpkin', 1, 1, '#f08a1a', ['Pumpkin', 'crop'], 'Crops'), corn: B('Corn', 1, 1, '#f4d23a', ['Corn', 'crop'], 'Crops'), hops: B('Hops', 1, 1, '#9ac84a', ['Hops', 'crop'], 'Crops'), ancient: B('Ancient Fruit', 1, 1, '#9a5ad0', ['Ancient Fruit', 'crop'], 'Crops'), tree: B('Fruit tree', 1, 1, '#4f9a4f', ['Apple Tree', 'tree'], 'Crops'),
    stone: B('Stone path', 1, 1, '#b8b4aa', null, 'Paths & decor'), wood: B('Wood path', 1, 1, '#b8884a', null, 'Paths & decor'), gravel: B('Gravel path', 1, 1, '#c8c0a8', null, 'Paths & decor'), fence: B('Fence', 1, 1, '#8a5a2c', ['Wood Fence', 'craft'], 'Paths & decor'), chest: B('Chest', 1, 1, '#b5835a', ['Chest', 'craft'], 'Paths & decor'), keg: B('Keg', 1, 1, '#a0703a', ['Keg', 'craft'], 'Paths & decor'), jar: B('Preserves Jar', 1, 1, '#6ab4e0', ['Preserves Jar', 'craft'], 'Paths & decor'), hive: B('Bee House', 1, 1, '#e8c040', ['Bee House', 'craft'], 'Paths & decor'), flower: B('Flower', 1, 1, '#f0a0b8', ['Tulip', 'crop'], 'Paths & decor'),
  };
  const COVER = { sprinkler: [[0, 1], [0, -1], [1, 0], [-1, 0]], qsprinkler: [-1, 0, 1].flatMap((x) => [-1, 0, 1].map((y) => [x, y])).filter(([x, y]) => x || y), isprinkler: [-2, -1, 0, 1, 2].flatMap((x) => [-2, -1, 0, 1, 2].map((y) => [x, y])).filter(([x, y]) => x || y) };
  const CROPS = new Set(['parsnip', 'cauliflower', 'potato', 'strawberry', 'melon', 'starfruit', 'pumpkin', 'corn', 'hops', 'ancient']);
  const GROUND = { standard: '#a8d085', riverland: '#a0cc90', forest: '#8fc27a', hilltop: '#b0c88a', wilderness: '#98b878', fourcorners: '#a8d085', beach: '#e0d4a0' };
  const view = { tool: 'stone', zoom: 12, grid: true, cover: true, cur: null, undo: [], redo: [] }; const imgCache = {};
  const spr = (key) => { const it = ITEMS[key]; if (!it || !it.sp) return null; const k = it.sp.join('|'); if (!imgCache[k]) { const im = new Image(); im.src = SDV.sprites.get(it.sp[0], it.sp[1]); imgCache[k] = im; } return imgCache[k]; };
  const cur = (farm) => farm.layouts.find((l) => l.id === view.cur) || farm.layouts[0] || null;
  const newLayout = (farm, name) => ({ id: U.uid(), name, farmType: farm.farmType || 'standard', w: 80, h: 65, objs: [], ref: null, created: Date.now(), updated: Date.now() });
  const covered = (l) => { const water = new Set(), scare = new Set(); for (const o of l.objs) { if (COVER[o.t]) COVER[o.t].forEach(([dx, dy]) => water.add(`${o.x + dx},${o.y + dy}`)); if (o.t === 'scarecrow') for (let dx = -8; dx <= 8; dx++) for (let dy = -8; dy <= 8; dy++) if (dx * dx + dy * dy <= 64) scare.add(`${o.x + dx},${o.y + dy}`); } return { water, scare }; };

  function draw(canvas, l, refImg) {
    const z = view.zoom, g = canvas.getContext('2d'); g.imageSmoothingEnabled = false; canvas.width = l.w * z; canvas.height = l.h * z;
    g.fillStyle = GROUND[l.farmType] || '#a8d085'; g.fillRect(0, 0, canvas.width, canvas.height);
    if (refImg && l.ref) { g.globalAlpha = l.ref.opacity; g.drawImage(refImg, 0, 0, canvas.width, canvas.height); g.globalAlpha = 1; }
    if (view.grid) { g.strokeStyle = 'rgba(60,40,20,.12)'; g.lineWidth = 1; g.beginPath(); for (let x = 0; x <= l.w; x++) { g.moveTo(x * z + .5, 0); g.lineTo(x * z + .5, l.h * z); } for (let y = 0; y <= l.h; y++) { g.moveTo(0, y * z + .5); g.lineTo(l.w * z, y * z + .5); } g.stroke(); }
    if (view.cover) { const { water, scare } = covered(l); g.fillStyle = 'rgba(80,160,230,.28)'; water.forEach((k) => { const [x, y] = k.split(',').map(Number); g.fillRect(x * z, y * z, z, z); }); g.fillStyle = 'rgba(230,150,60,.16)'; scare.forEach((k) => { const [x, y] = k.split(',').map(Number); g.fillRect(x * z, y * z, z, z); }); }
    for (const o of l.objs) { const it = ITEMS[o.t]; if (!it) continue; const x = o.x * z, y = o.y * z, w = it.w * z, h = it.h * z; g.fillStyle = it.color; g.globalAlpha = it.w > 1 || it.h > 1 ? 0.92 : 1; g.fillRect(x, y, w, h); g.globalAlpha = 1; if (it.w > 1 || it.h > 1) { g.strokeStyle = 'rgba(40,25,10,.6)'; g.lineWidth = 2; g.strokeRect(x + 1, y + 1, w - 2, h - 2); }
      const im = spr(o.t); if (im && im.complete) { const s = Math.min(w, h) * (it.w > 1 ? 0.7 : 1); g.drawImage(im, x + (w - s) / 2, y + (h - s) / 2, s, s); } if ((it.w > 2) && z >= 10) { g.fillStyle = '#2a1c12'; g.font = `bold ${Math.max(9, z - 2)}px sans-serif`; g.textAlign = 'center'; g.fillText(it.label, x + w / 2, y + h - 3); } }
  }

  SDV.tools.designer = {
    title: 'Farm designer', icon: ['Barn', 'building'], blurb: 'Plan buildings, crops, sprinklers and paths on a grid. Save several layouts and trace over a screenshot of your real farm.',
    render: (farm) => {
      if (!farm.layouts.length) farm.layouts.push(newLayout(farm, 'Layout 1')); if (!view.cur || !farm.layouts.some((l) => l.id === view.cur)) view.cur = farm.layouts[0].id; const l = cur(farm);
      const cats = [...new Set(Object.values(ITEMS).map((i) => i.cat))];
      return `<div class="honest">This is a <b>blank planning grid</b>, not an exact map of the game’s farms, and building sizes are approximate. Upload a screenshot of your real farm and trace over it for accuracy.</div>
      <div class="toolbar"><label class="flt">Layout<select id="dzLay">${farm.layouts.map((x) => `<option value="${x.id}" ${x.id === l.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></label><button class="btn xs" id="dzNew">＋ New</button><button class="btn xs ghost" id="dzDup">Duplicate</button><button class="btn xs ghost" id="dzRen">Rename</button><button class="btn xs danger" id="dzDel">Delete</button>
        <label class="flt">Farm type<select id="dzType">${D.farmTypes.map((t) => `<option value="${t.id}" ${t.id === l.farmType ? 'selected' : ''}>${t.name}</option>`).join('')}</select></label><label class="flt">Zoom<input type="range" id="dzZoom" min="6" max="24" value="${view.zoom}"></label><label class="chk"><input type="checkbox" id="dzGrid" ${view.grid ? 'checked' : ''}> Grid</label><label class="chk"><input type="checkbox" id="dzCov" ${view.cover ? 'checked' : ''}> Sprinkler / scarecrow range</label>
        <button class="btn xs ghost" id="dzUndo">↶ Undo</button><button class="btn xs ghost" id="dzRedo">↷ Redo</button><button class="btn xs" id="dzPng">⬇ PNG</button></div>
      <div class="dz-layout"><div class="dz-pal"><button class="pal ${view.tool === 'erase' ? 'on' : ''}" data-tool="erase">🧽 Eraser</button>${cats.map((c) => `<h4>${c}</h4><div class="pal-grid">${Object.entries(ITEMS).filter(([, i]) => i.cat === c).map(([k, i]) => `<button class="pal ${view.tool === k ? 'on' : ''}" data-tool="${k}" title="${i.label}${i.w > 1 || i.h > 1 ? ` (${i.w}×${i.h})` : ''}"><span class="sw" style="background:${i.color}">${i.sp ? SDV.sprites.img(i.sp[0], i.sp[1]) : ''}</span><small>${i.label}</small></button>`).join('')}</div>`).join('')}
        <h4>Reference screenshot</h4>${l.ref ? `<label class="flt">Opacity <input type="range" id="dzOp" min="10" max="100" value="${Math.round(l.ref.opacity * 100)}"></label><button class="btn xs ghost" id="dzRef">Replace</button> <button class="btn xs ghost" id="dzRefRm">Remove</button>` : '<button class="btn xs ghost" id="dzRef">＋ Upload screenshot</button>'}<input id="dzRefIn" type="file" accept="image/*" hidden></div>
      <div class="dz-stage"><div class="dz-scroll"><canvas id="dz" aria-label="Farm layout grid"></canvas></div><div id="dzStats" class="chips"></div></div></div>`;
    },
    bind: (root, rerender, farm) => {
      const l = cur(farm); const canvas = U.$('#dz', root); let refImg = null; const stats = U.$('#dzStats', root);
      const save = () => { l.updated = Date.now(); St.saveQuiet(); };
      const snapshot = () => { view.undo.push(JSON.stringify(l.objs)); if (view.undo.length > 60) view.undo.shift(); view.redo = []; };
      const refresh = () => { draw(canvas, l, refImg); const { water } = covered(l); const crops = l.objs.filter((o) => CROPS.has(o.t)); const dry = crops.filter((o) => !water.has(`${o.x},${o.y}`)).length; const n = (re) => l.objs.filter((o) => re.test(o.t)).length;
        stats.innerHTML = `<span class="chip">🌱 ${crops.length} crops</span>${crops.length ? `<span class="chip ${dry ? 'need' : ''}">💧 ${crops.length - dry} watered by sprinklers · ${dry} need hand-watering</span>` : ''}<span class="chip">💦 ${n(/sprinkler/)} sprinklers</span><span class="chip">🧍 ${n(/scarecrow/)} scarecrows</span><span class="chip">🏠 ${l.objs.filter((o) => ITEMS[o.t] && ITEMS[o.t].cat === 'Buildings').length} buildings</span>`; };
      const loadRef = async () => { if (l.ref) { const u = await M.url(l.ref.media); if (u) { refImg = new Image(); refImg.src = u; await refImg.decode().catch(() => {}); } } refresh(); }; loadRef();
      const cell = (e) => { const r = canvas.getBoundingClientRect(); return [Math.floor(((e.clientX - r.left) / r.width) * l.w), Math.floor(((e.clientY - r.top) / r.height) * l.h)]; };
      const apply = (x, y) => { if (x < 0 || y < 0 || x >= l.w || y >= l.h) return; if (view.tool === 'erase') { l.objs = l.objs.filter((o) => { const it = ITEMS[o.t]; return !(x >= o.x && x < o.x + it.w && y >= o.y && y < o.y + it.h); }); return; }
        const it = ITEMS[view.tool]; const ox = Math.min(x, l.w - it.w), oy = Math.min(y, l.h - it.h); l.objs = l.objs.filter((o) => { const b = ITEMS[o.t]; return !(o.x < ox + it.w && o.x + b.w > ox && o.y < oy + it.h && o.y + b.h > oy); }); l.objs.push({ id: U.uid(), t: view.tool, x: ox, y: oy }); };
      let down = false, last = '';
      canvas.addEventListener('pointerdown', (e) => { e.preventDefault(); canvas.setPointerCapture(e.pointerId); down = true; snapshot(); const [x, y] = cell(e); last = `${x},${y}`; apply(x, y); refresh(); });
      canvas.addEventListener('pointermove', (e) => { if (!down) return; const it = ITEMS[view.tool]; if (it && (it.w > 1 || it.h > 1)) return; const [x, y] = cell(e); const k = `${x},${y}`; if (k === last) return; last = k; apply(x, y); refresh(); });
      const up = () => { if (down) { down = false; save(); } }; canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
      const on = (s, ev, fn) => U.$$(s, root).forEach((el) => el.addEventListener(ev, (e) => fn(el, e)));
      on('[data-tool]', 'click', (el) => { view.tool = el.dataset.tool; U.$$('.pal', root).forEach((b) => b.classList.toggle('on', b.dataset.tool === view.tool)); });
      on('#dzLay', 'change', (el) => { view.cur = el.value; view.undo = []; rerender(); }); on('#dzZoom', 'input', (el) => { view.zoom = +el.value; refresh(); }); on('#dzGrid', 'change', (el) => { view.grid = el.checked; refresh(); }); on('#dzCov', 'change', (el) => { view.cover = el.checked; refresh(); });
      on('#dzType', 'change', (el) => { l.farmType = el.value; save(); refresh(); });
      on('#dzUndo', 'click', () => { if (!view.undo.length) return; view.redo.push(JSON.stringify(l.objs)); l.objs = JSON.parse(view.undo.pop()); save(); refresh(); }); on('#dzRedo', 'click', () => { if (!view.redo.length) return; view.undo.push(JSON.stringify(l.objs)); l.objs = JSON.parse(view.redo.pop()); save(); refresh(); });
      on('#dzNew', 'click', () => { const n = newLayout(farm, `Layout ${farm.layouts.length + 1}`); farm.layouts.push(n); view.cur = n.id; view.undo = []; St.touch(farm); });
      on('#dzDup', 'click', () => { const n = { ...JSON.parse(JSON.stringify(l)), id: U.uid(), name: l.name + ' copy', ref: null }; farm.layouts.push(n); view.cur = n.id; St.touch(farm); });
      on('#dzRen', 'click', () => { const n = prompt('Layout name', l.name); if (n) { l.name = n.trim().slice(0, 40); St.touch(farm); } });
      on('#dzDel', 'click', () => UI.confirm(`Delete “${l.name}”?`, 'Delete layout', () => { if (l.ref) M.remove(l.ref.media); farm.layouts = farm.layouts.filter((x) => x.id !== l.id); view.cur = null; St.touch(farm); }));
      on('#dzRef', 'click', () => U.$('#dzRefIn', root).click());
      on('#dzRefIn', 'change', async (el) => { try { const r = await M.add(el.files[0], farm.id); if (l.ref) M.remove(l.ref.media); l.ref = { media: r.id, opacity: 0.5 }; St.touch(farm); } catch (e) { U.toast(e.message, 'bad'); } });
      on('#dzRefRm', 'click', () => { M.remove(l.ref.media); l.ref = null; St.touch(farm); }); on('#dzOp', 'input', (el) => { l.ref.opacity = +el.value / 100; refresh(); }); on('#dzOp', 'change', save);
      on('#dzPng', 'click', () => canvas.toBlob((b) => U.download(`${U.slug(l.name)}.png`, b)));
    },
  };
})();
