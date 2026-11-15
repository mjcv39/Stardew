/* Core utilities, namespace, season/date math and pixel-sprite helpers. */
(function () {
  const SDV = (window.SDV = { data: {}, views: {}, cats: {} });
  SDV.SEASONS = ['Spring', 'Summer', 'Fall', 'Winter'];
  SDV.SEASON_ICO = { Spring: '🌸', Summer: '☀️', Fall: '🍂', Winter: '❄️' };
  SDV.SEASON_COL = { Spring: '#8fd16a', Summer: '#f4d03f', Fall: '#e08a3c', Winter: '#9fd3f0' };

  const U = (SDV.util = {});
  U.esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  U.slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  U.$ = (sel, el = document) => el.querySelector(sel);
  U.$$ = (sel, el = document) => [...el.querySelectorAll(sel)];
  U.gold = (n) => (n == null || n === '' ? '—' : Number(n).toLocaleString() + 'g');
  U.wikiUrl = (name) => 'https://stardewvalleywiki.com/' + encodeURIComponent(String(name).replace(/ /g, '_'));
  U.uid = () => Math.random().toString(36).slice(2, 10);

  /* ---------- Dates: {year, season:'Spring'.., day:1-28} ---------- */
  U.doy = (d) => SDV.SEASONS.indexOf(d.season) * 28 + d.day - 1; // 0..111
  U.fromDoy = (n, year) => ({ year, season: SDV.SEASONS[Math.floor(n / 28)], day: (n % 28) + 1 });
  U.addDays = (d, n) => {
    let t = (d.year - 1) * 112 + U.doy(d) + n;
    if (t < 0) t = 0;
    return U.fromDoy(t % 112, Math.floor(t / 112) + 1);
  };
  U.absDay = (d) => (d.year - 1) * 112 + U.doy(d);
  U.daysBetween = (a, b) => U.absDay(b) - U.absDay(a);
  U.dayOfWeek = (day) => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][(day - 1) % 7];
  U.fmtDate = (d) => `${d.season} ${d.day}, Year ${d.year}`;
  U.fmtTime = (h) => { h = h % 24; const ap = h >= 12 && h < 24 ? 'pm' : 'am'; const hh = h % 12 || 12; return hh + ap; };

  /* ---------- Sprites ----------
     The original game art is copyrighted, so we never ship it. Instead: emoji glyphs on
     pixel-framed tiles for items, and procedurally generated 16x16 pixel portraits for villagers. */
  const EMO = {
    Parsnip: '🥕', Potato: '🥔', Cauliflower: '🥦', 'Green Bean': '🫛', Kale: '🥬', Garlic: '🧄', Strawberry: '🍓', Tulip: '🌷', 'Blue Jazz': '💠',
    Blueberry: '🫐', Corn: '🌽', Melon: '🍈', Tomato: '🍅', 'Hot Pepper': '🌶️', Radish: '🥕', 'Red Cabbage': '🥬', Starfruit: '⭐', Wheat: '🌾', Sunflower: '🌻', Poppy: '🌺', Hops: '🍃',
    Eggplant: '🍆', Pumpkin: '🎃', Yam: '🍠', Grape: '🍇', Cranberries: '🍒', Beet: '🫜', Artichoke: '🌿', Amaranth: '🌾', 'Bok Choy': '🥬', Broccoli: '🥦', 'Fairy Rose': '🌸',
    Apple: '🍎', Cherry: '🍒', Orange: '🍊', Peach: '🍑', Pomegranate: '🍎', Apricot: '🍑', Banana: '🍌', Mango: '🥭', Pineapple: '🍍', Coconut: '🥥', 'Cactus Fruit': '🌵', 'Ancient Fruit': '🍇', 'Coffee Bean': '☕', Carrot: '🥕', Rice: '🍚', 'Summer Squash': '🥒', 'Sweet Gem Berry': '💎', Rhubarb: '🌱', 'Summer Spangle': '🌼', 'Taro Root': '🪴', Powdermelon: '🍉',
    Chicken: '🐔', Duck: '🦆', Rabbit: '🐇', Cow: '🐄', Goat: '🐐', Sheep: '🐑', Pig: '🐖', Ostrich: '🦤', Dinosaur: '🦖', Egg: '🥚', Milk: '🥛', Wool: '🧶', Truffle: '🍄',
    Diamond: '💎', Emerald: '🟢', Ruby: '🔴', Amethyst: '🟣', Topaz: '🟡', Aquamarine: '🔵', Jade: '🟩', Quartz: '🔹', 'Prismatic Shard': '🌈', 'Fire Quartz': '🔥', 'Frozen Tear': '🧊',
    Pickaxe: '⛏️', Axe: '🪓', Hoe: '⚒️', 'Watering Can': '🚿', 'Fishing Rod': '🎣', Scythe: '🌙', Pan: '🥘', Sword: '⚔️', Dagger: '🗡️', Club: '🏏', Ring: '💍', Boots: '🥾', Hat: '🎩',
    Fiddlehead: '🌿', Morel: '🍄', 'Common Mushroom': '🍄', 'Purple Mushroom': '🍄', Chanterelle: '🍄', 'Red Mushroom': '🍄', Leek: '🌱', Dandelion: '🌼', Daffodil: '🌼', Holly: '🌿', Crocus: '🌷', 'Snow Yam': '🍠', Hazelnut: '🌰', Blackberry: '🫐', Salmonberry: '🍓', 'Wild Plum': '🍑',
    Honey: '🍯', Cheese: '🧀', Wine: '🍷', Beer: '🍺', Coffee: '☕', Pizza: '🍕', 'Pink Cake': '🎂', 'Chocolate Cake': '🍰', Salad: '🥗', Pancakes: '🥞', Spaghetti: '🍝', Omelet: '🍳', 'Fried Egg': '🍳', Bread: '🍞', 'Ice Cream': '🍨', Cookie: '🍪', 'Maki Roll': '🍣', Sashimi: '🍣', 'Fruit Salad': '🍹', 'Pumpkin Pie': '🥧', 'Rhubarb Pie': '🥧', 'Pina Colada': '🍹',
    Bomb: '💣', Furnace: '🔥', 'Scarecrow': '🧍', Chest: '📦', Torch: '🔦', Keg: '🛢️', 'Preserves Jar': '🫙', 'Bee House': '🐝', Sprinkler: '💦', Fertilizer: '🌱',
    Barn: '🏚️', Coop: '🐓', Silo: '🌾', Well: '⛲', Shed: '🏠', Stable: '🐴', Mill: '🌬️', Cabin: '🛖', 'Slime Hutch': '🟢', 'Fish Pond': '🐟', 'Obelisk': '🗿', 'Gold Clock': '🕰️',
  };
  const CATEMO = { fish: '🐟', crop: '🌱', villager: '🧑‍🌾', animal: '🐾', forage: '🍄', recipe: '🍲', craft: '🔨', mineral: '💎', artifact: '🏺', tool: '🛠️', weapon: '⚔️', monster: '👹', area: '⛰️', bundle: '🎁', festival: '🎪', quest: '📜', achievement: '🏆', building: '🏡', secret: '🗝️', gear: '🥾', tree: '🌳', critter: '🦀', npcgift: '🎁' };
  const CATCOL = { fish: '#5aa6d6', crop: '#7bbf4e', villager: '#e6a05a', animal: '#d9b38c', forage: '#a88f5a', recipe: '#d9805a', craft: '#8d8d9a', mineral: '#a374d1', artifact: '#c9a24d', tool: '#7d8fa3', weapon: '#c25b5b', monster: '#6f9a54', area: '#8c7a6b', bundle: '#e0b040', festival: '#e56fa0', quest: '#c9a97a', achievement: '#f0c43a', building: '#b5835a', secret: '#7a5aa0', gear: '#6a8c9c', tree: '#4f9a4f', critter: '#d4705a', npcgift: '#e56fa0' };
  U.emoji = (name, cat) => {
    if (EMO[name]) return EMO[name];
    for (const k in EMO) if (name.includes(k) && k.length > 3) return EMO[k];
    return CATEMO[cat] || '❓';
  };
  U.catColor = (c) => CATCOL[c] || '#b5835a';
  U.icon = (name, cat, size = 'md') =>
    `<span class="ico ico-${size}" style="--c:${U.catColor(cat)}" aria-hidden="true">${SDV.sprites ? SDV.sprites.img(name, cat) : U.emoji(name, cat)}</span>`;

  // --- Villager portraits (procedural pixel art) ---
  const pcache = {};
  const ACC = { Maru: 'glasses', Harvey: 'stache', Lewis: 'hat', Wizard: 'hat', Willy: 'cap', Gus: 'stache', Pierre: 'stache', George: 'stache', Evelyn: 'bun', Penny: 'freckles', Sam: 'freckles', Jas: 'bun', Pam: 'freckles', Linus: 'cap' };
  U.portrait = (v, size = 'md') => {
    const key = v.name;
    if (!pcache[key]) {
      const c = document.createElement('canvas');
      c.width = c.height = 16;
      const g = c.getContext('2d');
      const [hair, skin, shirt, style, eye] = v.look || ['#6b4a2b', '#f1c9a0', '#6a8fc2', 0, '#2a2a2a'];
      const px = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
      px(0, 0, 16, 16, '#cfe8f7'); px(0, 11, 16, 5, '#a7d17f'); // sky + grass backdrop
      px(3, 12, 10, 4, shirt); px(6, 11, 4, 1, skin); // shoulders + neck
      px(4, 3, 8, 8, skin); // face
      if (style === 1) { px(3, 2, 10, 3, hair); px(3, 5, 2, 8, hair); px(11, 5, 2, 8, hair); } // long
      else if (style === 2) { px(4, 2, 8, 2, hair); px(5, 1, 6, 1, hair); } // short/cap-ish
      else if (style === 3) { px(3, 2, 10, 3, hair); px(4, 9, 8, 3, hair); px(5, 8, 6, 1, skin); } // beard
      else if (style === 4) { px(4, 2, 8, 1, hair); px(5, 3, 6, 1, hair); } // balding
      else if (style === 5) { px(3, 1, 10, 4, hair); px(2, 4, 2, 3, hair); px(12, 4, 2, 3, hair); } // poofy
      else { px(3, 2, 10, 3, hair); px(3, 5, 1, 3, hair); px(12, 5, 1, 3, hair); } // default
      px(6, 6, 1, 2, eye); px(9, 6, 1, 2, eye); px(7, 9, 2, 1, '#b5604a'); // eyes, mouth
      px(5, 8, 1, 1, '#f0a090'); px(10, 8, 1, 1, '#f0a090'); // blush
      const acc = ACC[v.name];
      if (acc === 'glasses') { px(5, 5, 3, 1, '#2a2a2a'); px(8, 5, 3, 1, '#2a2a2a'); px(5, 7, 3, 1, '#2a2a2a'); px(8, 7, 3, 1, '#2a2a2a'); px(5, 6, 1, 1, '#2a2a2a'); px(7, 6, 2, 1, '#2a2a2a'); px(10, 6, 1, 1, '#2a2a2a'); }
      if (acc === 'stache') px(6, 8, 4, 1, hair);
      if (acc === 'hat') { px(3, 1, 10, 2, '#5a3a8a'); px(5, 0, 6, 1, '#5a3a8a'); px(2, 3, 12, 1, '#4a2a7a'); }
      if (acc === 'cap') { px(3, 1, 10, 2, '#3a5a8a'); px(2, 3, 12, 1, '#2a4a7a'); }
      if (acc === 'bun') { px(6, 0, 4, 2, hair); }
      if (acc === 'freckles') { px(5, 7, 1, 1, '#c8805a'); px(10, 7, 1, 1, '#c8805a'); px(6, 8, 1, 1, '#c8805a'); px(9, 8, 1, 1, '#c8805a'); }
      px(4, 10, 8, 1, 'rgba(0,0,0,.12)'); // jaw shade
      pcache[key] = c.toDataURL();
    }
    return `<img class="portrait portrait-${size}" src="${pcache[key]}" alt="${U.esc(v.name)}" width="16" height="16">`;
  };

  U.badge = (txt, cls = '') => `<span class="badge ${cls}">${U.esc(txt)}</span>`;
  U.seasonBadges = (arr) =>
    (arr || []).map((s) => (s === 'Any' || s === 'All' ? U.badge('Year-round', 'b-any') : `<span class="badge b-${s}">${SDV.SEASON_ICO[s] || ''} ${s}</span>`)).join(' ');

  U.toast = (msg) => {
    const t = document.getElementById('toast');
    t.textContent = msg; t.className = 'show';
    clearTimeout(U._tt); U._tt = setTimeout(() => (t.className = ''), 2600);
  };
  U.debounce = (fn, ms = 120) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

  // Hours: time windows are arrays of [start,end) in 24h; end>24 wraps past midnight (26 = 2am)
  U.inWindow = (windows, hour) => !windows || !windows.length || windows.some(([a, b]) => (hour >= a && hour < b) || (b > 24 && hour < b - 24));
  U.fmtWindows = (w) => (!w || !w.length ? 'All day' : w.map(([a, b]) => `${U.fmtTime(a)}–${U.fmtTime(b)}`).join(', '));
})();
