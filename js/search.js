/* Global search index over every dataset registered in SDV.sets (see views/wiki.js). */
(function () {
  const U = SDV.util;
  const Q = (SDV.search = {});
  let index = null, byName = null;

  const flat = (v) => (Array.isArray(v) ? v.join(' ') : v == null ? '' : typeof v === 'object' ? '' : String(v));
  Q.build = () => {
    index = []; byName = new Map();
    for (const [key, set] of Object.entries(SDV.sets)) {
      for (const row of set.rows()) {
        const e = { key, id: row.id, name: row.name, kind: set.label, cat: set.icon, row, desc: set.blurb ? set.blurb(row) : '' };
        const fields = [row.name, set.label, flat(row.seasons), row.season, flat(row.location), flat(row.where), flat(row.home), flat(row.kind), flat(row.type), flat(row.ingredients), flat(row.loves), flat(row.weather), flat(row.room), flat(row.giver), flat(row.habitat), flat(row.fruit), flat(row.maker)];
        e.hay = fields.join(' ').toLowerCase();
        index.push(e);
        const nm = row.name.toLowerCase();
        if (!byName.has(nm) || set.priority > (byName.get(nm).pri || 0)) byName.set(nm, { key, id: row.id, pri: set.priority || 0 });
      }
    }
    return index;
  };
  Q.idx = () => index || Q.build();
  // Resolve an item name (e.g. "Pink Cake", "Wood ×99", "Parsnip (gold)") to a route, if we have an entry for it.
  Q.resolve = (name) => {
    Q.idx();
    const clean = String(name).replace(/\s*[×x]\s*\d+$/i, '').replace(/\s*\((gold|silver|iridium)\)$/i, '').replace(/^\d+\s*x?\s*/, '').trim().toLowerCase();
    return byName.get(clean) || null;
  };
  Q.link = (name, label) => {
    const r = Q.resolve(name);
    return r ? `<a class="ilink" href="#/item/${r.key}/${r.id}">${U.esc(label || name)}</a>` : U.esc(label || name);
  };
  Q.run = (query, { limit = 200, key = '', season = '' } = {}) => {
    const toks = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (!toks.length && !key && !season) return [];
    const out = [];
    for (const e of Q.idx()) {
      if (key && e.key !== key) continue;
      if (season && !(e.row.seasons || [e.row.season]).some((s) => s === season || s === 'Any')) continue;
      let score = 0; const nm = e.name.toLowerCase();
      let ok = true;
      for (const t of toks) {
        if (nm === t) score += 100;
        else if (nm.startsWith(t)) score += 60;
        else if (nm.split(/[\s'-]+/).some((w) => w.startsWith(t))) score += 40;
        else if (nm.includes(t)) score += 25;
        else if (e.hay.includes(t)) score += 8;
        else { ok = false; break; }
      }
      if (ok) out.push({ e, score: score + (SDV.sets[e.key].priority || 0) });
    }
    out.sort((a, b) => b.score - a.score || a.e.name.localeCompare(b.e.name));
    return out.slice(0, limit).map((x) => x.e);
  };
})();
