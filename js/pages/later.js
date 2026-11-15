/* Sections that belong to later development phases. They exist so the six-place navigation is complete, but they do NOT pretend to work:
   each says what phase it is in, what it will do, and what you can already use today. */
(function () {
  const U = SDV.util, { esc } = U;
  const make = (key, phase, title, art, intro, plans, today) => (SDV.pages[key] = {
    later: true,
    render: () => `<div class="page later"><div class="hero-card"><div class="moss-big">${SDV.art.moss('sleepy')}</div><div class="hero-t"><span class="eyebrow">${title}</span><h1>Coming in Phase ${phase}</h1><p>${intro}</p></div></div>
      <div class="widgets"><section class="widget span-2"><header><h2>Not built yet</h2></header><div class="w-body"><p>This area is planned but <b>has no working features yet</b>, so there is nothing to click here. Here is what Phase ${phase} will add:</p><ul class="plain">${plans.map((p) => `<li>${esc(p)}</li>`).join('')}</ul></div></section>
      <section class="widget"><header><h2>Already available</h2></header><div class="w-body"><ul class="plain">${today.map((p) => `<li>${p}</li>`).join('')}</ul><a class="btn" href="#/">Back to My Farm</a></div></section></div></div>`,
  });
  make('calendar', 4, 'Calendar', 'calendar', 'The interactive 28-day seasonal calendar.', ['28-day grid with birthdays, festivals, crop planting deadlines and fishing', 'Day panels with gift ideas, available fish and reminders', 'Filters, seasonal overview and “Prepare for next season”'], ['Upcoming birthdays, festivals and crop deadlines on <a href="#/">My Farm</a>', 'Date-aware suggestions in “What should I work on today?”']);
  make('progress', 3, 'Progress', 'progress', 'The Community-Center-style progression tracker and Perfection tracker.', ['Story route (Community Center or Joja), exploration, collections, relationships, farm development, achievements', 'Automatic detection from your save, with manual ticking where saves have no data', 'Perfection tracker and villager profiles'], ['Save import already reads friendships, fish, museum, recipes, buildings, tools and bundles', 'Headline statistics on <a href="#/">My Farm</a>']);
  make('journal', 5, 'My Journal', 'journal', 'Your farm scrapbook.', ['Journal entries with tags, dates and screenshots; albums and a gallery', 'Automatic milestone memories and year-in-review recaps'], ['Recent changes between your saves already appear in the activity feed on <a href="#/">My Farm</a>']);
  make('tools', 6, 'Planning Tools', 'tools', 'Greenhouse & workshop.', ['Crop, fishing, gift and Community Center planners', 'Daily planner, challenge generator and farm designer'], ['Goals with priorities and deadlines on <a href="#/">My Farm</a>']);
})();
