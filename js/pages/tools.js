/* Planning Tools — hub + router. Each tool lives in js/tools/<name>.js and registers itself on SDV.tools. */
(function () {
  const U = SDV.util, { esc } = U, St = SDV.store, L = SDV.logic;
  const P = (SDV.pages.tools = {});
  const ORDER = ['daily', 'crops', 'fish', 'gifts', 'cc', 'challenges', 'designer'];
  const summary = (farm) => ({
    daily: () => `${SDV.recs.today(farm).length} suggestions today`,
    crops: () => `${28 - farm.date.day} days left in ${farm.date.season}`,
    fish: () => { const n = L.neededFish(farm); return n ? `${n.length} fish still needed` : 'filters & seasons'; },
    gifts: () => { const b = L.upcoming(farm.date, 14, (d) => L.birthdaysOn(d.season, d.day)); return b.length ? `${b.reduce((a, x) => a + x.items.length, 0)} birthday(s) in 2 weeks` : 'preferences & plans'; },
    cc: () => (L.route(farm) === 'joja' ? 'Joja route' : `${L.ccMissing(farm).length} items missing`),
    challenges: () => `${(farm.challenges || []).filter((c) => !c.done && !c.dropped).length} active`,
    designer: () => `${(farm.layouts || []).length} saved layout(s)`,
  });
  P.render = ({ parts }) => {
    const farm = St.active();
    if (!farm) return '<div class="page"><h1 class="px-h">Planning Tools</h1><div class="widget"><div class="w-body"><p>Create or connect a farm first — the planners use your date, progress and goals.</p><a class="btn" href="#/">Go to My Farm</a></div></div></div>';
    const key = parts[1]; const tool = key && SDV.tools[key];
    if (tool) return `<div class="page tool"><div class="crumb"><a href="#/tools">Planning Tools</a> › ${tool.title}</div><div class="hero-card"><span class="cc-ico">${U.icon(tool.icon[0], tool.icon[1], 'lg')}</span><div class="hero-t"><h1>${tool.title}</h1><p>${tool.blurb}</p></div></div>${tool.render(farm)}</div>`;
    const sum = summary(farm);
    return `<div class="page tools"><div class="hero-card"><div class="moss-big">${SDV.art.moss('happy')}</div><div class="hero-t"><span class="eyebrow">Greenhouse &amp; workshop</span><h1>Planning tools</h1><p>Working planners built on ${esc(farm.name)}’s date, progress and goals.</p></div></div><div class="cat-grid">${ORDER.filter((k) => SDV.tools[k]).map((k) => { const t = SDV.tools[k]; return `<a class="catcard" href="#/tools/${k}"><span class="cc-ico">${U.icon(t.icon[0], t.icon[1], 'md')}</span><div><b>${t.title}</b><small>${t.blurb}</small><small><b>${esc(sum[k]())}</b></small></div></a>`; }).join('')}</div></div>`;
  };
  P.bind = (root, rerender, ctx) => { const farm = St.active(); const tool = farm && ctx.parts[1] && SDV.tools[ctx.parts[1]]; if (tool && tool.bind) tool.bind(root, rerender, farm); };
})();
