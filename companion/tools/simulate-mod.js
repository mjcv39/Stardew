#!/usr/bin/env node
/* DEVELOPER SIMULATOR — pretends to be the SMAPI mod so the companion → website pipeline can be tested without the game.
   Everything it sends is flagged  simulated:true  and the website labels it "SIMULATED". It is NOT your real farm.
   usage: node simulate-mod.js [--config-dir <dir>] [--day 14] [--money 20000] [--once] [--interval 1000] [--no-snapshot] */
'use strict';
const fs = require('fs'), path = require('path'), os = require('os'), http = require('http');
const argv = process.argv.slice(2); const arg = (n, d) => { const i = argv.indexOf('--' + n); return i >= 0 ? argv[i + 1] : d; };
const base = process.platform === 'win32' ? process.env.APPDATA : process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config');
const cfgDir = arg('config-dir', path.join(base, 'YourLittleFarm'));
const info = JSON.parse(fs.readFileSync(path.join(cfgDir, 'companion.json'), 'utf8'));
const post = (p, body) => new Promise((res, rej) => { const b = JSON.stringify(body); const r = http.request({ host: '127.0.0.1', port: info.port, path: p, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(b), 'X-YLF-Mod-Key': info.modKey } }, (rs) => { rs.resume(); rs.on('end', () => res(rs.statusCode)); }); r.on('error', rej); r.end(b); });
const day = +arg('day', 14), money = +arg('money', 20000); let time = 900;
const date = { year: 2, season: 'Fall', day };
const snapshot = () => ({ saveId: '123456789', farmer: 'Testy', farmName: 'Sunnyvale', gameVersion: '1.6.8', date, timeOfDay: time, money, totalEarned: 70000, playtimeMs: 37000000, farmType: 'riverland', farmTypeId: 1,
  skills: { farming: 10, mining: 6, foraging: 5, fishing: 7, combat: 4 }, friend: { Abigail: { points: 2750, status: 'Married', giftsThisWeek: 1, giftsToday: 0 }, Sam: { points: 1800, status: 'Friendly', giftsThisWeek: 0, giftsToday: 0 } }, spouse: 'Abigail', children: 1,
  mail: ['ccPantry', 'ccCraftsRoom', 'ccVault', 'willyBoatFixed', 'CF_Fair', 'CF_Mines'], fishCaught: [128, 139, 143], shipped: [24, 254], shippedTotal: 8, artifacts: [107], minerals: [80, 72], museumDonated: [107, 72], museumFound: true,
  cookingKnown: ['Fried Egg', 'Omelet'], craftingKnown: ['Wood Fence'], cooked: ['194'], achievements: [], bundles: { 0: [true, true, false, false] }, stats: { itemsShipped: 8, fishCaught: 4 },
  deepestMine: 120, skullDepth: 20, walnuts: 17, houseLevel: 1, buildings: ['Big Coop', 'Barn', 'Silo', 'Well'], animals: [{ type: 'White Chicken', name: 'Pip' }], tools: { Axe: 2, Pickaxe: 1, Hoe: 2, 'Watering Can': 3 } });
const heartbeat = () => ({ saveId: '123456789', date, timeOfDay: time, money, location: 'Farm', weather: 'Sunny', energy: 180, maxEnergy: 270, health: 100 });
(async () => {
  if (!argv.includes('--no-snapshot')) console.log('snapshot ->', await post('/api/mod/snapshot', { simulated: true, modVersion: 'simulator', gameVersion: '1.6.8', data: snapshot() }));
  const beat = async () => { time += 10; console.log('heartbeat ->', await post('/api/mod/heartbeat', { simulated: true, modVersion: 'simulator', data: heartbeat() })); };
  await beat(); if (argv.includes('--once')) return;
  setInterval(() => beat().catch((e) => console.log('companion unreachable', e.code)), +arg('interval', 1000));
})().catch((e) => { console.error('Could not reach the companion:', e.message); process.exit(1); });
