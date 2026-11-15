const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1200, height: 700 }, deviceScaleFactor: 2 });
  await p.goto('http://localhost:8123/index.html');
  await p.evaluate(() => {
    const pick = { fish: ['Pufferfish', 'Tuna', 'Eel', 'Squid', 'Stingray', 'Salmon', 'Legend', 'Sturgeon'], crops: ['Pumpkin', 'Parsnip', 'Kale', 'Corn', 'Strawberry', 'Garlic', 'Tomato', 'Blue Jazz', 'Wheat', 'Cranberries'], minerals: ['Diamond', 'Ruby', 'Quartz', 'Granite'], recipes: ['Pizza', 'Pink Cake', 'Salad', 'Pumpkin Pie'], animals: ['Chicken', 'Cow', 'Pig', 'Rabbit', 'Sheep', 'Duck'], monsters: ['Green Slime', 'Bat', 'Ghost', 'Skeleton'], tools: ['Pickaxe', 'Axe', 'Watering Can', 'Fishing Rod'], buildings: ['Barn', 'Coop', 'Silo'] };
    let h = '';
    for (const [k, names] of Object.entries(pick)) { h += '<div style="display:flex;gap:8px;margin:4px">'; for (const n of names) { const r = SDV.sets[k].rows().find((x) => x.name === n); if (r) h += `<div style="text-align:center;font:10px sans-serif">${SDV.util.icon(r.name, SDV.sets[k].icon, 'xl')}<br>${n}</div>`; } h += '</div>'; }
    h += '<div style="display:flex;gap:8px;margin:4px">' + SDV.data.villagers.slice(0, 12).map((v) => SDV.util.portrait(v, 'xl')).join('') + '</div>';
    document.body.innerHTML = '<div style="padding:10px;background:#f6e3b4">' + h + '</div>';
  });
  await p.screenshot({ path: process.argv[2], fullPage: true }); await b.close();
})();
