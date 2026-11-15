// Renders a contact sheet of every dataset's sprites for visual review: node tests/sheet.js out.png
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
  await p.goto(process.env.URL || 'http://localhost:8123/index.html');
  await p.evaluate(() => {
    const out = [];
    for (const [k, s] of Object.entries(SDV.sets)) { out.push(`<h3 style="margin:8px 0 2px;font:bold 14px sans-serif">${k}</h3><div style="display:flex;flex-wrap:wrap;gap:6px">`); for (const r of s.rows()) out.push(`<div style="width:78px;text-align:center;font:9px sans-serif">${s.portrait ? SDV.util.portrait(r, 'lg') : SDV.util.icon(r.name, s.icon, 'lg')}<br>${r.name.slice(0, 16)}</div>`); out.push('</div>'); }
    document.body.innerHTML = '<div style="padding:10px;background:#f6e3b4">' + out.join('') + '</div>';
  });
  await p.screenshot({ path: process.argv[2], fullPage: true }); await b.close();
})();
