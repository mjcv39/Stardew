// Your Little Farm — SMAPI connector (v0.1, UNCOMPILED / UNTESTED against the real game).
//
// What it does: observes documented SMAPI events and POSTs small JSON snapshots to the companion app on 127.0.0.1.
// What it does NOT do: it never reads or sends anything to the internet, never patches game code (no Harmony), never changes the game.
//
// Event -> what is sent
//   SaveLoaded / DayStarted / DayEnding / Saved  -> full snapshot (the same field names the website's save parser produces)
//   Player.InventoryChanged, Player.LevelChanged,
//   Display.MenuChanged (a menu closed), World.BuildingListChanged -> full snapshot, debounced (>= 4 s apart)
//   GameLoop.OneSecondUpdateTicked (every 30 s)  -> small "heartbeat" (time, money, location, weather, energy)
//   GameLoop.ReturnedToTitle / Quit              -> "offline"
//
// Things SMAPI has no direct event for (fish caught, museum donations, friendship changes, quests) are detected by the WEBSITE
// by comparing consecutive snapshots — so they appear shortly after the change, not at the exact instant.
//
// The companion writes its port and a shared key to <ApplicationData>/YourLittleFarm/companion.json; this mod reads that file,
// so there is nothing to configure. If the companion is not running the mod simply retries later (queue is bounded).
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using StardewModdingAPI;
using StardewModdingAPI.Events;
using StardewValley;
using StardewValley.Buildings;
using StardewValley.Locations;
using StardewValley.Tools;

namespace YourLittleFarm
{
    public class ModEntry : Mod
    {
        private static readonly HttpClient Http = new HttpClient { Timeout = TimeSpan.FromSeconds(4) };
        private readonly ConcurrentQueue<(string path, string json)> queue = new();
        private string baseUrl, modKey;
        private DateTime lastFull = DateTime.MinValue;
        private bool pendingFull;
        private int ticks;

        public override void Entry(IModHelper helper)
        {
            helper.Events.GameLoop.SaveLoaded += (s, e) => { LoadCompanionInfo(); QueueFull(true); };
            helper.Events.GameLoop.DayStarted += (s, e) => QueueFull(true);
            helper.Events.GameLoop.DayEnding += (s, e) => QueueFull(true);
            helper.Events.GameLoop.Saved += (s, e) => QueueFull(true);
            helper.Events.Player.InventoryChanged += (s, e) => QueueFull(false);
            helper.Events.Player.LevelChanged += (s, e) => QueueFull(false);
            helper.Events.World.BuildingListChanged += (s, e) => QueueFull(false);
            helper.Events.Display.MenuChanged += (s, e) => { if (e.OldMenu != null) QueueFull(false); };   // a menu closed (museum, shop, gifts…)
            helper.Events.GameLoop.OneSecondUpdateTicked += OnSecond;
            helper.Events.GameLoop.ReturnedToTitle += (s, e) => Enqueue("/api/mod/offline", "{}");
            helper.Events.GameLoop.UpdateTicked += (s, e) => { if (pendingFull && Context.IsWorldReady && (DateTime.UtcNow - lastFull).TotalSeconds >= 4) { pendingFull = false; SendFull(); } };
            Task.Run(PumpAsync);
        }

        private void LoadCompanionInfo()
        {
            try
            {
                string dir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "YourLittleFarm");
                var j = JObject.Parse(File.ReadAllText(Path.Combine(dir, "companion.json")));
                baseUrl = $"http://127.0.0.1:{(int)j["port"]}"; modKey = (string)j["modKey"];
            }
            catch (Exception ex) { baseUrl = null; Monitor.Log("Companion not found yet (" + ex.Message + "). Start the companion app; I will retry.", LogLevel.Trace); }
        }

        private void QueueFull(bool now) { if (!Context.IsWorldReady) return; if (now) { pendingFull = false; SendFull(); } else pendingFull = true; }

        private void OnSecond(object sender, OneSecondUpdateTickedEventArgs e)
        {
            if (!Context.IsWorldReady || ++ticks % 30 != 0) return;
            if (baseUrl == null) LoadCompanionInfo();
            Enqueue("/api/mod/heartbeat", JsonConvert.SerializeObject(new { modVersion = ModManifest.Version.ToString(), gameVersion = Game1.version, data = Heartbeat() }));
        }

        private object Heartbeat() => new
        {
            saveId = Game1.uniqueIDForThisGame.ToString(),
            date = Date(), timeOfDay = Game1.timeOfDay, money = Game1.player.Money, location = Game1.currentLocation?.Name,
            weather = Game1.isRaining ? "Raining" : Game1.isSnowing ? "Snowing" : "Sunny",
            energy = Game1.player.Stamina, maxEnergy = Game1.player.MaxStamina, health = Game1.player.health, gameRunning = true
        };

        private static object Date() => new { year = Game1.year, season = char.ToUpper(Game1.currentSeason[0]) + Game1.currentSeason.Substring(1), day = Game1.dayOfMonth };

        private void SendFull()
        {
            lastFull = DateTime.UtcNow;
            try { Enqueue("/api/mod/snapshot", JsonConvert.SerializeObject(new { modVersion = ModManifest.Version.ToString(), gameVersion = Game1.version, data = Snapshot() })); }
            catch (Exception ex) { Monitor.Log("Could not build snapshot: " + ex.Message, LogLevel.Warn); }
        }

        // Field names intentionally match the website's save parser (js/modules/save.js) so both sources feed the same code.
        // API names below follow Stardew Valley 1.6 — adjust if the compiler complains for your game version.
        private object Snapshot()
        {
            var p = Game1.player; var farm = Game1.getFarm();
            var friend = new Dictionary<string, object>();
            foreach (var kv in p.friendshipData.Pairs) friend[kv.Key] = new { points = kv.Value.Points, status = kv.Value.Status.ToString(), giftsThisWeek = kv.Value.GiftsThisWeek, giftsToday = kv.Value.GiftsToday };
            var tools = new Dictionary<string, int>();
            foreach (var item in p.Items) if (item is Axe || item is Pickaxe || item is Hoe || item is WateringCan) tools[item is WateringCan ? "Watering Can" : item.GetType().Name] = ((Tool)item).UpgradeLevel;
            var museum = Game1.getLocationFromName("ArchaeologyHouse") as LibraryMuseum;
            var bundles = new Dictionary<string, bool[]>();
            foreach (var kv in Game1.netWorldState.Value.Bundles.Pairs) bundles[kv.Key.ToString()] = kv.Value.ToArray();
            int deepest = Math.Max(p.deepestMineLevel, 0);
            return new
            {
                saveId = Game1.uniqueIDForThisGame.ToString(), farmer = p.Name, farmName = p.farmName.Value, gameVersion = Game1.version,
                date = Date(), timeOfDay = Game1.timeOfDay, money = p.Money, totalEarned = p.totalMoneyEarned, playtimeMs = p.millisecondsPlayed,
                farmTypeId = Game1.whichFarm, farmType = new[] { "standard", "riverland", "forest", "hilltop", "wilderness", "fourcorners", "beach" }[Math.Min(Game1.whichFarm, 6)],
                weatherTomorrow = (string)null,
                skills = new { farming = p.FarmingLevel, mining = p.MiningLevel, foraging = p.ForagingLevel, fishing = p.FishingLevel, combat = p.CombatLevel },
                professions = p.professions.ToList(),
                friend, spouse = p.spouse, children = p.getChildrenCount(),
                mail = p.mailReceived.ToList(),
                fishCaught = p.fishCaught.Keys.Select(k => ItemId(k)).Where(i => i >= 0).ToList(),
                shipped = p.basicShipped.Keys.Select(k => ItemId(k)).Where(i => i >= 0).ToList(), shippedTotal = p.basicShipped.Values.Sum(),
                artifacts = p.archaeologyFound.Keys.Select(k => ItemId(k)).Where(i => i >= 0).ToList(),
                minerals = p.mineralsFound.Keys.Select(k => ItemId(k)).Where(i => i >= 0).ToList(),
                museumDonated = museum == null ? new List<int>() : museum.museumPieces.Values.Select(v => ItemId(v)).Where(i => i >= 0).ToList(), museumFound = museum != null,
                cookingKnown = p.cookingRecipes.Keys.ToList(), craftingKnown = p.craftingRecipes.Keys.ToList(), cooked = p.recipesCooked.Keys.ToList(),
                achievements = p.achievements.ToList(), bundles,
                stats = new { itemsShipped = (double)Game1.stats.ItemsShipped, fishCaught = (double)Game1.stats.FishCaught, questsCompleted = (double)Game1.stats.QuestsCompleted, daysPlayed = (double)Game1.stats.DaysPlayed },
                deepestMine = Math.Min(120, deepest), skullDepth = deepest > 120 ? deepest - 120 : 0,
                walnuts = Game1.netWorldState.Value.GoldenWalnutsFound, houseLevel = p.HouseUpgradeLevel,
                buildings = farm.buildings.Select(b => b.buildingType.Value).ToList(),
                animals = farm.getAllFarmAnimals().Select(a => new { type = a.type.Value, name = a.Name }).ToList(), tools,
                flags = new { hasRustyKey = p.hasRustyKey, hasClubCard = p.hasClubCard, hasDarkTalisman = p.hasDarkTalisman, hasSkullKey = p.hasSkullKey, hasMagnifyingGlass = p.hasMagnifyingGlass, hasSpecialCharm = p.hasSpecialCharm }
            };
        }

        // "(O)128" or "128" -> 128 ; non-numeric ids (modded items) are skipped
        private static int ItemId(string key) { var k = key.Contains(')') ? key.Substring(key.IndexOf(')') + 1) : key; return int.TryParse(k, out var n) ? n : -1; }

        /* ---- delivery: bounded queue, background pump, never blocks the game thread ---- */
        private void Enqueue(string path, string json) { if (queue.Count > 200) queue.TryDequeue(out _); queue.Enqueue((path, json)); }
        private async Task PumpAsync()
        {
            while (true)
            {
                await Task.Delay(500);
                if (baseUrl == null || modKey == null || !queue.TryPeek(out var item)) continue;
                try
                {
                    var req = new HttpRequestMessage(HttpMethod.Post, baseUrl + item.path) { Content = new StringContent(item.json, Encoding.UTF8, "application/json") };
                    req.Headers.Add("X-YLF-Mod-Key", modKey);
                    var res = await Http.SendAsync(req);
                    if (res.IsSuccessStatusCode) queue.TryDequeue(out _);
                    else if ((int)res.StatusCode == 401) { baseUrl = null; }   // companion restarted with a new key: re-read companion.json
                }
                catch { await Task.Delay(5000); }                              // companion not running: keep the (bounded) queue, retry
            }
        }
    }
}
