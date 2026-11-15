/* Wiki engine: dataset registry (SDV.sets), categories (SDV.cats), list pages with filters, detail pages, and shared game logic. */
(function () {
  const D = SDV.data, U = SDV.util, { esc, icon, badge, seasonBadges, gold } = U;
  const link = (n, l) => SDV.search.link(n, l);
  const A4 = SDV.SEASONS;

  /* ---------------- Shared game logic ---------------- */
  const L = (SDV.logic = {});
  L.cropsInSeason = (season) => D.crops.filter((c) => c.seasons.includes(season) && c.id !== 'cactus-fruit');
  // Can a crop planted today finish (first harvest) before its season ends? Returns days left after harvest.
  L.plantInfo = (crop, date) => {
    if (!crop.seasons.includes(date.season)) return null;
    // multi-season crops (Corn etc.) can run into the following listed season
    let last = 28, s = A4.indexOf(date.season);
    while (crop.seasons.includes(A4[(s + 1) % 4]) && A4[(s + 1) % 4] !== date.season) { s = (s + 1) % 4; last += 28; if (last > 112) break; }
    const left = last - date.day; // days remaining until crops die (end of last growing season day 28)
    const harvests = left >= crop.days ? (crop.regrow ? 1 + Math.floor((left - crop.days) / crop.regrow) : 1) : 0;
    return { canPlant: harvests > 0, harvests, lastPlantDay: last - crop.days, left, firstHarvest: U.addDays(date, crop.days) };
  };
  L.profitPerDay = (c) => {
    const net = (c.sell * (c.regrow ? 1 : 1)) - (typeof c.seedPrice === 'number' ? c.seedPrice : 0);
    return c.regrow ? Math.round((c.sell * (28 / c.regrow) - c.seedPrice) / 28) : Math.round(net / c.days);
  };
  L.fishAvailable = (date, weather = 'Sunny', hour = null) => D.fish.filter((f) => {
    if (!f.seasons.includes(date.season)) return false;
    if (f.weather === 'Rainy' && weather !== 'Rainy') return false;
    if (f.weather === 'Sunny' && weather === 'Rainy') return false;
    if (hour != null && !U.inWindow(f.time, hour)) return false;
    return true;
  });
  L.birthdaysOn = (season, day) => D.villagers.filter((v) => v.season === season && v.day === day);
  L.festivalsOn = (season, day) => D.festivals.filter((f) => f.season === season && f.days.includes(day));
  L.upcoming = (date, days, fn) => { const out = []; for (let i = 0; i <= days; i++) { const d = U.addDays(date, i); const r = fn(d); if (r && r.length) out.push({ date: d, in: i, items: r }); } return out; };
  L.bundlesWith = (name) => D.bundles.filter((b) => b.items.some((i) => i.toLowerCase().replace(/\s*[×x]\s*\d+$/i, '').replace(/\s*\((gold)\)$/i, '') === name.toLowerCase()));
  L.recipesWith = (name) => D.recipes.filter((r) => r.ingredientList.some((i) => i.toLowerCase().replace(/\s*[×x]\s*\d+$/i, '') === name.toLowerCase()));
  L.lovedBy = (name) => D.villagers.filter((v) => v.loves.some((i) => i.toLowerCase() === name.toLowerCase()));
  L.likedBy = (name) => D.villagers.filter((v) => v.likes.some((i) => i.toLowerCase() === name.toLowerCase()));

  /* ---------------- Dataset registry ---------------- */
  const kv = (k, v) => (v == null || v === '' ? '' : `<div class="kv"><span class="k">${esc(k)}</span><span class="v">${v}</span></div>`);
  const chips = (arr, fn = (x) => link(x)) => (arr && arr.length ? arr.map((x) => `<span class="chip">${fn(x)}</span>`).join('') : '<span class="muted">—</span>');
  const sect = (title, body, open = true) => `<details class="sect" ${open ? 'open' : ''}><summary>${title}</summary><div class="sect-body">${body}</div></details>`;
  const farm = () => SDV.store.active();
  const sset = (o) => o;
  const names = (arr) => [...new Set(arr)].sort();
  const unique = (rows, f) => names(rows.flatMap((r) => [].concat(f(r) || [])).filter(Boolean));
  const relatedHtml = (name) => {
    const b = L.bundlesWith(name), r = L.recipesWith(name), lo = L.lovedBy(name), li = L.likedBy(name);
    let h = '';
    if (b.length) h += sect('🎁 Community Center bundles', chips(b, (x) => `<a class="ilink" href="#/item/bundles/${x.id}">${esc(x.name)}</a> <small>(${esc(x.room)})</small>`));
    if (r.length) h += sect('🍲 Used in recipes', chips(r, (x) => `<a class="ilink" href="#/item/recipes/${x.id}">${esc(x.name)}</a>`));
    if (lo.length) h += sect('💖 Loved by', chips(lo, (x) => `<a class="ilink" href="#/item/villagers/${x.id}">${U.portrait(x, 'xs')} ${esc(x.name)}</a>`));
    if (li.length) h += sect('👍 Liked by', chips(li, (x) => `<a class="ilink" href="#/item/villagers/${x.id}">${U.portrait(x, 'xs')} ${esc(x.name)}</a>`), false);
    return h;
  };
  const wikiLink = (row) => `<a class="wikilink" target="_blank" rel="noopener" href="${U.wikiUrl(row.name)}">View on the official wiki ↗</a>`;
  const seasonFilter = { label: 'Season', opts: A4, test: (r, v) => (r.seasons || [r.season]).includes(v) || (r.seasons || [r.season]).includes('Any') };

  const S = (SDV.sets = {
    villagers: sset({
      label: 'Villager', icon: 'villager', rows: () => D.villagers, priority: 5, portrait: true,
      blurb: (r) => `Birthday: ${r.season} ${r.day}${r.marry ? ' · Marriage candidate' : ''}`,
      card: (r) => ({ title: r.name, sub: `🎂 ${r.season} ${r.day}`, badges: r.marry ? badge('💍 Marriageable', 'b-pink') : '' }),
      filters: [{ label: 'Birthday season', opts: A4, test: (r, v) => r.season === v }, { label: 'Type', opts: ['Marriageable', 'Other'], test: (r, v) => (v === 'Marriageable') === r.marry }],
      detail: (r) => {
        const f = farm(); let rel = '';
        if (f) {
          const days = (() => { const d = f.date; let t = U.addDays(d, 0); for (let i = 0; i < 112; i++) { const x = U.addDays(d, i); if (x.season === r.season && x.day === r.day) return i; } return null; })();
          rel += kv('Next birthday', days === 0 ? '<b>Today! 🎉</b>' : `in ${days} days (${r.season} ${r.day})`);
          const fr = f.facts && f.facts.friend && f.facts.friend[r.name];
          if (fr) rel += kv('Your friendship (auto)', `${'❤'.repeat(Math.min(10, Math.floor(fr.points / 250)))}${'♡'.repeat(10 - Math.min(10, Math.floor(fr.points / 250)))} ${Math.floor(fr.points / 250)} hearts <small>${esc(fr.status || '')}</small>`);
        }
        return `<div class="hero">${U.portrait(r, 'xl')}<div><h2>${esc(r.name)}</h2><p>${esc(r.bio)}</p></div></div>
        <div class="kvs">${kv('Birthday', `${SDV.SEASON_ICO[r.season]} ${r.season} ${r.day}`)}${kv('Lives at', esc(r.home))}${kv('Marriage', r.marry ? 'Marriage candidate' : 'Cannot marry')}${rel}</div>
        ${sect('💖 Loved gifts <small>(8 pts ×; ×8 on birthday)</small>', chips(r.loves))}${sect('👍 Liked gifts', chips(r.likes))}${sect('👎 Hated gifts', chips(r.hates), false)}
        ${sect('🗓️ Schedule & hangouts', `<p>${esc(r.schedule)}</p>`)}${sect('🎬 Heart events', `<ul>${r.events.map((e) => `<li>${esc(e)}</li>`).join('')}</ul>`)}
        ${sect('ℹ️ Gift rules', `<p>Universal loves: ${D.giftRules.universalLoves.map((x) => link(x)).join(', ')}.<br>${esc(D.giftRules.pts.note)}</p>`, false)}`;
      },
    }),
    crops: sset({
      label: 'Crop', icon: 'crop', rows: () => D.crops, priority: 4,
      blurb: (r) => `${r.seasons.join('/')} · ${r.days} days${r.regrow ? ` · regrows every ${r.regrow}` : ''} · ${gold(r.sell)}`,
      card: (r) => ({ title: r.name, sub: `${r.days}d${r.regrow ? ` · ↻${r.regrow}d` : ''} · ${gold(r.sell)}`, badges: seasonBadges(r.seasons) }),
      filters: [seasonFilter, { label: 'Type', opts: ['Regrows', 'Single harvest'], test: (r, v) => (v === 'Regrows') === !!r.regrow }],
      detail: (r) => {
        const f = farm(); let now = '';
        if (f) { const p = L.plantInfo(r, f.date); now = kv('On your farm', !p ? `Not in season (${U.fmtDate(f.date)})` : p.canPlant ? `✅ Plant now → ${p.harvests} harvest${p.harvests > 1 ? 's' : ''} (last plant: ${U.fmtDate(U.addDays(f.date, p.lastPlantDay - f.date.day + 0 - 0 + (p.lastPlantDay >= f.date.day ? 0 : 0)))})` : '❌ Too late to plant for this season'); }
        return `<div class="hero">${icon(r.name, 'crop', 'xl')}<div><h2>${esc(r.name)}</h2><p>${r.seasons.length ? seasonBadges(r.seasons) : ''}</p></div></div>
        <div class="kvs">${kv('Growth time', r.days + ' days')}${kv('Regrow', r.regrow ? `every ${r.regrow} days` : 'No (single harvest)')}${kv('Sell price', gold(r.sell))}${kv('Seed price', typeof r.seedPrice === 'number' && r.seedPrice ? gold(r.seedPrice) : '—')}${kv('Seeds from', esc(r.seedSource))}${kv('Rough profit/day', gold(L.profitPerDay(r)))}${now}</div>
        ${r.notes ? `<p>${esc(r.notes)}</p>` : ''}${relatedHtml(r.name)}`;
      },
    }),
    trees: sset({ label: 'Fruit Tree', icon: 'tree', rows: () => D.trees, priority: 2, blurb: (r) => `${r.fruit} · ${r.season}`, card: (r) => ({ title: r.name, sub: `${r.fruit} ${gold(r.sell)}`, badges: seasonBadges(r.seasons) }), filters: [seasonFilter], detail: (r) => `<div class="hero">${icon(r.fruit, 'tree', 'xl')}<div><h2>${esc(r.name)}</h2></div></div><div class="kvs">${kv('Fruit', link(r.fruit))}${kv('Season', seasonBadges(r.seasons))}${kv('Sell', gold(r.sell))}${kv('Sapling', typeof r.sapling === 'number' ? gold(r.sapling) : esc(r.sapling))}</div><p>${esc(r.notes)}</p>${relatedHtml(r.fruit)}` }),
    fish: sset({
      label: 'Fish', icon: 'fish', rows: () => D.fish, priority: 6,
      blurb: (r) => `${r.allSeasons ? 'Year-round' : r.seasons.join('/')} · ${r.weather} · ${r.location} · ${gold(r.price)}`,
      card: (r) => ({ title: r.name, sub: `${gold(r.price)} · ${U.fmtWindows(r.time)}`, badges: seasonBadges(r.allSeasons ? ['Any'] : r.seasons) + (r.weather !== 'Any' ? badge(r.weather === 'Rainy' ? '🌧 Rain' : '☀ Sun', 'b-w') : '') + (r.legendary ? badge('Legendary', 'b-gold') : '') }),
      filters: [seasonFilter, { label: 'Weather', opts: ['Any', 'Sunny', 'Rainy'], test: (r, v) => r.weather === v }, { label: 'Location', opts: ['Ocean', 'River', 'Mountain Lake', 'Mines', 'Sewers', 'Desert', 'Ginger Island', 'Secret Woods'], test: (r, v) => r.location.toLowerCase().includes(v.toLowerCase()) }, { label: 'Type', opts: ['Legendary', 'Regular'], test: (r, v) => (v === 'Legendary') === !!r.legendary }],
      detail: (r) => {
        const f = farm(); let now = '';
        if (f) { const ok = L.fishAvailable(f.date, f.weather || 'Sunny').some((x) => x.id === r.id); now = kv('On your farm today', ok ? `✅ Catchable (${f.date.season}, ${f.weather || 'Sunny'})` : `❌ Not available (${f.date.season}, ${f.weather || 'Sunny'})`); }
        return `<div class="hero">${icon(r.name, 'fish', 'xl')}<div><h2>${esc(r.name)}</h2>${seasonBadges(r.allSeasons ? ['Any'] : r.seasons)}</div></div>
        <div class="kvs">${kv('Location', esc(r.location))}${kv('Time', U.fmtWindows(r.time))}${kv('Weather', esc(r.weather))}${kv('Difficulty', r.diff + ' / 110')}${kv('Sell price', `${gold(r.price)} <small>(silver ${gold(Math.floor(r.price * 1.25))}, gold ${gold(Math.floor(r.price * 1.5))}, iridium ${gold(r.price * 2)})</small>`)}${now}</div>
        ${r.notes ? `<p>${esc(r.notes)}</p>` : ''}${relatedHtml(r.name)}`;
      },
    }),
    crabpot: sset({ label: 'Crab Pot catch', icon: 'critter', rows: () => D.crabpot, priority: 1, blurb: (r) => `${r.habitat} · ${gold(r.price)}`, card: (r) => ({ title: r.name, sub: `${r.habitat} · ${gold(r.price)}`, badges: '' }), filters: [{ label: 'Habitat', opts: ['Ocean', 'Freshwater'], test: (r, v) => r.habitat === v }], detail: (r) => `<div class="hero">${icon(r.name, 'critter', 'xl')}<div><h2>${esc(r.name)}</h2></div></div><div class="kvs">${kv('Habitat', r.habitat + ' crab pots')}${kv('Sell price', gold(r.price))}</div>${relatedHtml(r.name)}` }),
    animals: sset({ label: 'Animal', icon: 'animal', rows: () => D.animals, priority: 3, blurb: (r) => `${r.home} · ${r.products}`, card: (r) => ({ title: r.name, sub: `${r.home} · ${typeof r.price === 'number' ? gold(r.price) : r.price}`, badges: '' }), filters: [{ label: 'Home', opts: ['Coop', 'Barn'], test: (r, v) => r.home.startsWith(v) }], detail: (r) => `<div class="hero">${icon(r.name.split(' ')[0], 'animal', 'xl')}<div><h2>${esc(r.name)}</h2></div></div><div class="kvs">${kv('Lives in', esc(r.home))}${kv('Price', typeof r.price === 'number' ? gold(r.price) : esc(r.price))}${kv('Products', esc(r.products))}</div><p>${esc(r.notes)}</p>` }),
    artisan: sset({ label: 'Artisan good', icon: 'craft', rows: () => D.artisan, priority: 1, blurb: (r) => `${r.maker} · ${r.input}`, card: (r) => ({ title: r.name, sub: `${r.maker} · ${r.time}`, badges: '' }), filters: [], detail: (r) => `<div class="hero">${icon(r.name, 'craft', 'xl')}<div><h2>${esc(r.name)}</h2></div></div><div class="kvs">${kv('Made in', link(r.maker))}${kv('Input', link(r.input))}${kv('Time', esc(r.time))}${kv('Value', typeof r.price === 'number' ? gold(r.price) : esc(r.price))}</div>` }),
    forage: sset({ label: 'Forageable', icon: 'forage', rows: () => D.forage, priority: 3, blurb: (r) => `${r.allSeasons ? 'Year-round' : r.seasons.join('/')} · ${r.where}`, card: (r) => ({ title: r.name, sub: `${gold(r.price)} · ${r.where}`, badges: seasonBadges(r.allSeasons ? ['Any'] : r.seasons) }), filters: [seasonFilter], detail: (r) => `<div class="hero">${icon(r.name, 'forage', 'xl')}<div><h2>${esc(r.name)}</h2>${seasonBadges(r.allSeasons ? ['Any'] : r.seasons)}</div></div><div class="kvs">${kv('Found at', esc(r.where))}${kv('Sell price', gold(r.price))}${kv('Notes', esc(r.notes))}</div>${relatedHtml(r.name)}` }),
    recipes: sset({
      label: 'Cooking recipe', icon: 'recipe', rows: () => D.recipes, priority: 4, blurb: (r) => `${r.ingredients} · ${r.source}`,
      card: (r) => ({ title: r.name, sub: `⚡${r.energy} ♥${r.health} · ${gold(r.price)}`, badges: r.buff ? badge(r.buff, 'b-buff') : '' }),
      filters: [{ label: 'Source', opts: ['Queen of Sauce', 'hearts', 'Saloon', 'Skill'], test: (r, v) => r.source.includes(v) }, { label: 'Buff', opts: ['Has buff', 'No buff'], test: (r, v) => (v === 'Has buff') === !!r.buff }],
      detail: (r) => `<div class="hero">${icon(r.name, 'recipe', 'xl')}<div><h2>${esc(r.name)}</h2>${r.buff ? badge(r.buff, 'b-buff') : ''}</div></div><div class="kvs">${kv('Ingredients', chips(r.ingredients.split(',').map((x) => x.trim())))}${kv('Recipe source', esc(r.source))}${kv('Energy / Health', `⚡${r.energy} / ♥${r.health}`)}${kv('Sell price', gold(r.price))}</div>${relatedHtml(r.name)}`,
    }),
    crafting: sset({ label: 'Crafting recipe', icon: 'craft', rows: () => D.crafting, priority: 3, blurb: (r) => `${r.type} · ${r.ingredients}`, card: (r) => ({ title: r.name, sub: r.ingredients, badges: badge(r.type, 'b-any') }), filters: [{ label: 'Type', opts: () => unique(D.crafting, (r) => r.type), test: (r, v) => r.type === v }], detail: (r) => `<div class="hero">${icon(r.name, 'craft', 'xl')}<div><h2>${esc(r.name)}</h2>${badge(r.type)}</div></div><div class="kvs">${kv('Ingredients', chips(r.ingredients.split(',').map((x) => x.trim())))}${kv('Unlocked by', esc(r.source))}${kv('Notes', esc(r.notes))}</div>` }),
    minerals: sset({ label: 'Mineral', icon: 'mineral', rows: () => D.minerals, priority: 3, blurb: (r) => `${r.kind} · ${r.where}`, card: (r) => ({ title: r.name, sub: `${gold(r.price)} · ${r.where}`, badges: badge(r.kind, 'b-any') }), filters: [{ label: 'Kind', opts: ['Gem', 'Mineral'], test: (r, v) => r.kind === v }], detail: (r) => `<div class="hero">${icon(r.name, 'mineral', 'xl')}<div><h2>${esc(r.name)}</h2>${badge(r.kind)}</div></div><div class="kvs">${kv('Found', esc(r.where))}${kv('Sell price', gold(r.price))}${kv('Museum', 'Donate to Gunther')}</div>${relatedHtml(r.name)}` }),
    geodes: sset({ label: 'Geode', icon: 'mineral', rows: () => D.geodes, priority: 2, blurb: (r) => r.yields, card: (r) => ({ title: r.name, sub: r.where, badges: '' }), filters: [], detail: (r) => `<div class="hero">${icon(r.name, 'mineral', 'xl')}<div><h2>${esc(r.name)}</h2></div></div><div class="kvs">${kv('Found', esc(r.where))}${kv('Contains', esc(r.yields))}${kv('Cracking', esc(r.cost))}</div>` }),
    artifacts: sset({ label: 'Artifact', icon: 'artifact', rows: () => D.artifacts, priority: 3, blurb: (r) => r.where, card: (r) => ({ title: r.name, sub: `${gold(r.price)} · ${r.where}`, badges: '' }), filters: [], detail: (r) => `<div class="hero">${icon(r.name, 'artifact', 'xl')}<div><h2>${esc(r.name)}</h2></div></div><div class="kvs">${kv('Found', esc(r.where))}${kv('Sell price', gold(r.price))}</div><p>Donate to Gunther at the Museum for the collection rewards.</p>` }),
    tools: sset({ label: 'Tool', icon: 'tool', rows: () => D.tools, priority: 2, blurb: (r) => r.desc, card: (r) => ({ title: r.name, sub: r.desc, badges: '' }), filters: [], detail: (r) => `<div class="hero">${icon(r.name, 'tool', 'xl')}<div><h2>${esc(r.name)}</h2></div></div><div class="kvs">${kv('Use', esc(r.desc))}${kv('How to get / upgrade', esc(r.how))}</div><h3>Upgrades</h3><p>${esc(D.toolUpgrades.note)}</p><ul>${D.toolUpgrades.tiers.map((t) => `<li><b>${t.tier}</b>: ${t.cost}</li>`).join('')}</ul>` }),
    weapons: sset({ label: 'Weapon', icon: 'weapon', rows: () => D.weapons, priority: 2, blurb: (r) => `${r.type} · ${r.damage} dmg · ${r.where}`, card: (r) => ({ title: r.name, sub: `${r.damage} dmg · ${r.where}`, badges: badge(r.type, 'b-any') }), filters: [{ label: 'Type', opts: ['Sword', 'Dagger', 'Club'], test: (r, v) => r.type === v }], detail: (r) => `<div class="hero">${icon(r.name, 'weapon', 'xl')}<div><h2>${esc(r.name)}</h2>${badge(r.type)}</div></div><div class="kvs">${kv('Damage', r.damage)}${kv('Found', esc(r.where))}${kv('Notes', esc(r.notes))}</div>` }),
    gear: sset({ label: 'Boots & Rings', icon: 'gear', rows: () => D.gear, priority: 2, blurb: (r) => `${r.kind} · ${r.effect}`, card: (r) => ({ title: r.name, sub: r.effect, badges: badge(r.kind, 'b-any') }), filters: [{ label: 'Kind', opts: ['Boots', 'Ring'], test: (r, v) => r.kind === v }], detail: (r) => `<div class="hero">${icon(r.kind, 'gear', 'xl')}<div><h2>${esc(r.name)}</h2>${badge(r.kind)}</div></div><div class="kvs">${kv('Effect', esc(r.effect))}${kv('Where', esc(r.where))}</div>` }),
    monsters: sset({ label: 'Monster', icon: 'monster', rows: () => D.monsters, priority: 3, blurb: (r) => `${r.where} · HP ${r.hp} · ${r.drops}`, card: (r) => ({ title: r.name, sub: `HP ${r.hp} · ${r.where}`, badges: '' }), filters: [{ label: 'Area', opts: ['Mines', 'Skull', 'Volcano'], test: (r, v) => r.where.includes(v) }], detail: (r) => `<div class="hero">${icon(r.name, 'monster', 'xl')}<div><h2>${esc(r.name)}</h2></div></div><div class="kvs">${kv('Found in', esc(r.where))}${kv('Health', r.hp)}${kv('Damage', r.dmg)}${kv('XP', r.xp)}${kv('Drops', chips(r.drops.split(',').map((x) => x.trim()).filter(Boolean)))}${kv('Notes', esc(r.notes))}</div>` }),
    bundles: sset({
      label: 'CC Bundle', icon: 'bundle', rows: () => D.bundles, priority: 3, blurb: (r) => `${r.room} · need ${r.need} · ${r.reward}`, card: (r) => ({ title: r.name, sub: `${r.room} · ${r.need}/${r.items.length} items`, badges: badge(r.room, 'b-any') }),
      filters: [{ label: 'Room', opts: ['Crafts Room', 'Pantry', 'Fish Tank', 'Boiler Room', 'Bulletin Board', 'Vault'], test: (r, v) => r.room === v }],
      detail: (r) => { const f = farm(); const key = 'bundle:' + r.id; return `<div class="hero">${icon(r.name, 'bundle', 'xl')}<div><h2>${esc(r.name)}</h2>${badge(r.room)}</div></div><div class="kvs">${kv('Items needed', `${r.need} of ${r.items.length}`)}${kv('Reward', esc(r.reward))}</div><h3>Items</h3><div>${chips(r.items)}</div>${f ? `<p><label class="chk"><input type="checkbox" data-manual="${key}" ${SDV.store.isChecked(f, key) ? 'checked' : ''}> Mark this bundle complete on <b>${esc(f.name)}</b></label></p>` : ''}`; },
    }),
    areas: sset({ label: 'Area', icon: 'area', rows: () => D.areas, priority: 3, blurb: (r) => r.info, card: (r) => ({ title: r.name, sub: r.kind, badges: '' }), filters: [{ label: 'Kind', opts: ['Dungeon', 'Island', 'Story', 'Area'], test: (r, v) => r.kind === v }], detail: (r) => areaDetail(r) }),
    festivals: sset({ label: 'Festival', icon: 'festival', rows: () => D.festivals, priority: 5, blurb: (r) => `${r.season} ${r.days.join('–')} · ${r.where}`, card: (r) => ({ title: r.name, sub: `${r.season} ${r.days.join('–')} · ${r.time}`, badges: seasonBadges([r.season]) }), filters: [seasonFilter], detail: (r) => `<div class="hero">${icon(r.name, 'festival', 'xl')}<div><h2>${esc(r.name)}</h2>${seasonBadges([r.season])}</div></div><div class="kvs">${kv('Date', `${r.season} ${r.days.join(', ')}`)}${kv('Time', esc(r.time))}${kv('Location', esc(r.where))}</div><p>${esc(r.notes)}</p>${r.tips ? `<p><b>Tip:</b> ${esc(r.tips)}</p>` : ''}` }),
    quests: sset({ label: 'Quest', icon: 'quest', rows: () => D.quests, priority: 2, blurb: (r) => `${r.giver} · ${r.how}`, card: (r) => ({ title: r.name, sub: `${r.giver}: ${r.how}`, badges: '' }), filters: [], detail: (r) => `<div class="hero">${icon(r.name, 'quest', 'xl')}<div><h2>${esc(r.name)}</h2></div></div><div class="kvs">${kv('Given by', esc(r.giver))}${kv('Objective', esc(r.how))}${kv('Reward', esc(r.reward))}</div>` }),
    specialOrders: sset({ label: 'Special Order', icon: 'quest', rows: () => D.specialOrders, priority: 2, blurb: (r) => `${r.giver} · ${r.req}`, card: (r) => ({ title: r.name, sub: `${r.giver}: ${r.req}`, badges: '' }), filters: [], detail: (r) => `<div class="hero">${icon(r.name, 'quest', 'xl')}<div><h2>${esc(r.name)}</h2></div></div><div class="kvs">${kv('Posted by', esc(r.giver))}${kv('Requirement', esc(r.req))}${kv('Reward', esc(r.reward))}</div>` }),
    achievements: sset({ label: 'Achievement', icon: 'achievement', rows: () => D.achievements, priority: 2, blurb: (r) => r.desc, card: (r) => ({ title: r.name, sub: r.desc, badges: badge(r.cat, 'b-any') }), filters: [{ label: 'Category', opts: () => unique(D.achievements, (r) => r.cat), test: (r, v) => r.cat === v }], detail: (r) => `<div class="hero">${icon(r.name, 'achievement', 'xl')}<div><h2>${esc(r.name)}</h2>${badge(r.cat)}</div></div><p>${esc(r.desc)}</p>` }),
    buildings: sset({ label: 'Building', icon: 'building', rows: () => D.buildings, priority: 3, blurb: (r) => `${gold(r.cost)} · ${r.mats}`, card: (r) => ({ title: r.name, sub: `${gold(r.cost)} · ${r.mats}`, badges: '' }), filters: [], detail: (r) => `<div class="hero">${icon(r.name, 'building', 'xl')}<div><h2>${esc(r.name)}</h2></div></div><div class="kvs">${kv('Cost', gold(r.cost))}${kv('Materials', esc(r.mats))}</div><p>${esc(r.notes)}</p>` }),
    farmTypes: sset({ label: 'Farm layout', icon: 'building', rows: () => D.farmTypes, priority: 2, blurb: (r) => r.info, card: (r) => ({ title: r.name, sub: r.info, badges: '' }), filters: [], detail: (r) => `<div class="hero">${icon('Farm', 'building', 'xl')}<div><h2>${esc(r.name)}</h2></div></div><p>${esc(r.info)}</p>` }),
    secrets: sset({ label: 'Secret', icon: 'secret', rows: () => D.secrets, priority: 2, blurb: (r) => r.how, card: (r) => ({ title: r.name, sub: r.how, badges: badge(r.kind, 'b-any') }), filters: [], detail: (r) => `<div class="hero">${icon(r.name, 'secret', 'xl')}<div><h2>${esc(r.name)}</h2>${badge(r.kind)}</div></div><p>${esc(r.how)}</p>` }),
  });

  function areaDetail(r) {
    let extra = '';
    if (r.id === 'the-mines') extra = `<h3>Zones</h3>${D.mines.zones.map((z) => `<div class="card flat"><b>${z.name}</b> (floors ${z.floors})<br>Monsters: ${z.monsters}<br>Resources: ${z.ores}</div>`).join('')}<h3>Milestones</h3><ul>${D.mines.milestones.map((m) => `<li><b>Floor ${m.floor}:</b> ${esc(m.reward)}</li>`).join('')}</ul>`;
    if (r.id === 'skull-cavern') extra = `<ul>${D.skull.tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ul><h3>Depth milestones</h3><ul>${D.skull.milestone.map((m) => `<li><b>Floor ${m.floor}:</b> ${esc(m.reward)}</li>`).join('')}</ul>`;
    if (r.id === 'ginger-island') extra = `<h3>Regions</h3><ul>${D.ginger.areas.map((a) => `<li><b>${a.name}</b>: ${esc(a.info)}</li>`).join('')}</ul><p><b>Golden Walnuts:</b> ${D.ginger.walnuts.total} total. ${esc(D.ginger.walnuts.tip)}</p>`;
    if (r.id === 'jojamart') extra = `<h3>Community Development Form</h3><table class="tbl"><tr><th>Project</th><th>Cost</th><th>Unlocks</th></tr>${D.joja.steps.map((s) => `<tr><td>${s.name}</td><td>${gold(s.cost)}</td><td>${esc(s.reward)}</td></tr>`).join('')}</table><ul>${D.joja.notes2.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>`;
    if (r.id === 'community-center') extra = `<h3>Rooms</h3>${D.ccRooms.map((rm) => `<div class="card flat"><b>${rm.name}</b> — ${esc(rm.reward)}<br><small>${D.bundles.filter((b) => b.room === rm.name).map((b) => `<a class="ilink" href="#/item/bundles/${b.id}">${esc(b.name)}</a>`).join(' · ')}</small></div>`).join('')}`;
    return `<div class="hero">${icon(r.name, 'area', 'xl')}<div><h2>${esc(r.name)}</h2>${badge(r.kind)}</div></div><p>${esc(r.info)}</p>${extra}`;
  }

  /* ---------------- Categories (the nav "wiki" pages) ---------------- */
  SDV.cats = [
    { key: 'characters', title: 'Characters', icon: '🧑‍🌾', blurb: 'Villagers, birthdays, gifts, schedules & heart events.', tabs: ['villagers'] },
    { key: 'farming', title: 'Crops & Farming', icon: '🌱', blurb: 'Every crop, tree, growth time and profit estimate.', tabs: ['crops', 'trees'] },
    { key: 'animals', title: 'Animals', icon: '🐔', blurb: 'Barn & coop animals, products and artisan goods.', tabs: ['animals', 'artisan'] },
    { key: 'fishing', title: 'Fish & Fishing', icon: '🎣', blurb: 'Seasons, weather, locations, times and prices.', tabs: ['fish', 'crabpot'] },
    { key: 'foraging', title: 'Foraging', icon: '🍄', blurb: 'Forageables by season and location.', tabs: ['forage'] },
    { key: 'cooking', title: 'Cooking & Crafting', icon: '🍲', blurb: 'Cooking recipes and crafting blueprints.', tabs: ['recipes', 'crafting'] },
    { key: 'museum', title: 'Minerals & Artifacts', icon: '💎', blurb: 'Gems, minerals, geodes and museum artifacts.', tabs: ['minerals', 'geodes', 'artifacts'] },
    { key: 'gear', title: 'Tools, Weapons & Gear', icon: '⚔️', blurb: 'Tools, weapons, boots and rings.', tabs: ['tools', 'weapons', 'gear'] },
    { key: 'combat', title: 'Monsters & Dungeons', icon: '👹', blurb: 'Monsters, the Mines and Skull Cavern.', tabs: ['monsters', 'areas'], areaFilter: ['Dungeon'] },
    { key: 'cc', title: 'Community Center & Joja', icon: '🎁', blurb: 'All bundles by room, rewards and the JojaMart route.', tabs: ['bundles'], extra: 'cc' },
    { key: 'ginger', title: 'Ginger Island', icon: '🏝️', blurb: 'Boat repair, island areas, walnuts and Volcano.', tabs: ['areas'], areaFilter: ['Island'] },
    { key: 'events', title: 'Festivals & Events', icon: '🎪', blurb: 'Festival calendar with times, locations and tips.', tabs: ['festivals'] },
    { key: 'quests', title: 'Quests & Orders', icon: '📜', blurb: 'Story quests and Special Orders.', tabs: ['quests', 'specialOrders'] },
    { key: 'achievements', title: 'Achievements', icon: '🏆', blurb: 'Every achievement and how to earn it.', tabs: ['achievements'] },
    { key: 'buildings', title: 'Buildings & Farms', icon: '🏡', blurb: 'Building costs, upgrades and farm layouts.', tabs: ['buildings', 'farmTypes'] },
    { key: 'secrets', title: 'Secrets', icon: '🗝️', blurb: 'Hidden locations, unlockables and Stardrops.', tabs: ['secrets'] },
  ];
  const catByKey = (k) => SDV.cats.find((c) => c.key === k);

  /* ---------------- Views ---------------- */
  const V = (SDV.views.wiki = {});
  V.home = () => `<div class="page"><h1 class="px-h">📖 Wiki</h1><p class="lead">Everything in one place. Pick a category — or use the search bar at the top.</p>
    <div class="cat-grid">${SDV.cats.map((c) => `<a class="card cat-card" href="#/wiki/${c.key}"><span class="cat-ico">${c.icon}</span><b>${c.title}</b><small>${c.blurb}</small><em>${c.tabs.reduce((n, t) => n + S[t].rows().length, 0)} entries</em></a>`).join('')}</div>
    <p class="muted">Data note: entries are structured data in <code>js/data/</code> and each entry links to the official wiki for verification.</p></div>`;

  V.list = (catKey, params) => {
    const cat = catByKey(catKey); if (!cat) return '<div class="page"><h1>Not found</h1></div>';
    const tab = params.tab && cat.tabs.includes(params.tab) ? params.tab : cat.tabs[0];
    const set = S[tab];
    let rows = set.rows();
    if (cat.areaFilter && tab === 'areas') rows = rows.filter((r) => cat.areaFilter.includes(r.kind));
    const q = (params.q || '').toLowerCase();
    const flt = Object.entries(params).filter(([k]) => k.startsWith('f')).map(([k, v]) => [+k.slice(1), v]);
    const filtered = rows.filter((r) => (!q || (r.name + ' ' + (set.blurb ? set.blurb(r) : '')).toLowerCase().includes(q)) && flt.every(([i, v]) => !v || !set.filters[i] || set.filters[i].test(r, v)));
    const view = params.view || 'grid';
    const sel = (i, f) => { const opts = typeof f.opts === 'function' ? f.opts() : f.opts; const cur = params['f' + i] || ''; return `<label class="flt"><span>${f.label}</span><select data-f="${i}"><option value="">All</option>${opts.map((o) => `<option ${o === cur ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select></label>`; };
    const cardHtml = (r) => { const c = set.card(r); return `<a class="card entry" href="#/item/${tab}/${r.id}">${set.portrait ? U.portrait(r, 'lg') : icon(r.name, set.icon, 'lg')}<div class="entry-t"><b>${esc(c.title)}</b><small>${esc(c.sub || '')}</small><div class="badges">${c.badges || ''}</div></div></a>`; };
    let extra = '';
    if (cat.extra === 'cc') extra = ccExtra();
    if (tab === 'villagers') extra += `<div class="card flat"><b>Gift rules:</b> ${esc(D.giftRules.pts.note)} Universal loves: ${D.giftRules.universalLoves.map((x) => link(x)).join(', ')}.</div>`;
    if (tab === 'fish') extra += `<div class="card flat"><b>Fishing tips:</b><ul>${D.fishingTips.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div>`;
    return `<div class="page"><div class="crumb"><a href="#/wiki">Wiki</a> › ${cat.title}</div><h1 class="px-h">${cat.icon} ${cat.title}</h1><p class="lead">${cat.blurb}</p>
    ${cat.tabs.length > 1 ? `<div class="tabs">${cat.tabs.map((t) => `<a class="tab ${t === tab ? 'on' : ''}" href="#/wiki/${catKey}?tab=${t}">${S[t].label}s <small>${S[t].rows().length}</small></a>`).join('')}</div>` : ''}
    ${extra}
    <div class="toolbar" data-cat="${catKey}" data-tab="${tab}"><input class="filter-q" type="search" placeholder="Filter ${set.label.toLowerCase()}s…" value="${esc(params.q || '')}">${set.filters.map((f, i) => sel(i, f)).join('')}
      <div class="seg"><button class="${view === 'grid' ? 'on' : ''}" data-view="grid" title="Cards">▦</button><button class="${view === 'table' ? 'on' : ''}" data-view="table" title="Table">☰</button></div></div>
    <p class="muted">${filtered.length} of ${rows.length} shown</p>
    ${view === 'table' ? `<table class="tbl"><tr><th>Name</th><th>Details</th></tr>${filtered.map((r) => `<tr><td><a href="#/item/${tab}/${r.id}">${esc(r.name)}</a></td><td>${esc(set.blurb ? set.blurb(r) : '')}</td></tr>`).join('')}</table>` : `<div class="grid">${filtered.map(cardHtml).join('') || '<p>No matches.</p>'}</div>`}</div>`;
  };
  function ccExtra() {
    const f = farm();
    const rooms = D.ccRooms.map((rm) => { const bs = D.bundles.filter((b) => b.room === rm.name); const done = bs.filter((b) => f && SDV.store.isChecked(f, 'bundle:' + b.id)).length; return `<div class="card flat"><b>${rm.name}</b> — ${esc(rm.reward)}<div class="bar"><i style="width:${(done / bs.length) * 100}%"></i></div><small>${f ? `${done}/${bs.length} bundles marked on ${esc(f.name)}` : `${bs.length} bundles`}</small></div>`; }).join('');
    return `<div class="rooms">${rooms}</div><div class="card flat"><b>JojaMart route:</b> ${esc(D.joja.cost)}. <a href="#/item/areas/jojamart">Details →</a></div>`;
  }

  V.item = (key, id) => {
    const set = S[key]; const row = set && set.rows().find((r) => r.id === id);
    if (!row) return '<div class="page"><h1>Entry not found</h1><p><a href="#/wiki">Back to wiki</a></p></div>';
    const cat = SDV.cats.find((c) => c.tabs.includes(key));
    const sim = SDV.search.idx().filter((e) => e.key === key && e.id !== id).slice(0, 6);
    return `<div class="page detail"><div class="crumb"><a href="#/wiki">Wiki</a> › ${cat ? `<a href="#/wiki/${cat.key}?tab=${key}">${cat.title}</a>` : ''} › ${esc(row.name)}</div>
    <div class="card big">${set.detail(row)}<p>${wikiLink(row)}</p></div>
    <h3>More ${esc(set.label.toLowerCase())}s</h3><div class="chips">${sim.map((e) => `<a class="chip" href="#/item/${key}/${e.id}">${esc(e.name)}</a>`).join('')}</div></div>`;
  };

  V.bind = (root) => {
    const tb = U.$('.toolbar', root);
    if (tb) {
      const nav = (patch) => { const p = new URLSearchParams(location.hash.split('?')[1] || ''); p.set('tab', tb.dataset.tab); Object.entries(patch).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k))); location.hash = `#/wiki/${tb.dataset.cat}?${p}`; };
      U.$('.filter-q', tb).addEventListener('input', U.debounce((e) => { nav({ q: e.target.value }); setTimeout(() => { const i = U.$('.filter-q'); i.focus(); i.setSelectionRange(1e6, 1e6); }, 0); }, 250));
      U.$$('select[data-f]', tb).forEach((s) => s.addEventListener('change', () => nav({ ['f' + s.dataset.f]: s.value })));
      U.$$('[data-view]', tb).forEach((b) => b.addEventListener('click', () => nav({ view: b.dataset.view })));
    }
    U.$$('[data-manual]', root).forEach((cb) => cb.addEventListener('change', () => { SDV.store.toggle(farm(), cb.dataset.manual); }));
  };
})();
