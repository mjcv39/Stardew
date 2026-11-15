/* Photo storage for the journal & gallery. Images live in this browser's IndexedDB only (never uploaded).
   Uploads are validated (type, size) and downscaled to keep storage small. */
(function () {
  const U = SDV.util;
  const M = (SDV.media = {});
  const MAX_IN = 15 * 1024 * 1024, MAX_PX = 1600;
  const open = () => new Promise((res, rej) => { const r = indexedDB.open('ylf-media', 1); r.onupgradeneeded = () => r.result.createObjectStore('img', { keyPath: 'id' }); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const run = async (mode, fn) => { const db = await open(); return new Promise((res, rej) => { const t = db.transaction('img', mode); const req = fn(t.objectStore('img')); t.oncomplete = () => res(req ? req.result : undefined); t.onerror = () => rej(t.error); }); };
  const urls = new Map();

  M.add = async (file, farmId) => {
    if (!/^image\/(png|jpe?g|webp|gif)$/.test(file.type)) throw new Error(`“${file.name}” is not a supported image (PNG, JPG, WebP or GIF).`);
    if (file.size > MAX_IN) throw new Error(`“${file.name}” is larger than 15 MB.`);
    const bmp = await createImageBitmap(file); const k = Math.min(1, MAX_PX / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k); c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.86)); const rec = { id: U.uid(), farmId, blob, w: c.width, h: c.height, created: Date.now() };
    await run('readwrite', (s) => s.put(rec)); return { id: rec.id, w: rec.w, h: rec.h };
  };
  M.url = async (id) => { if (urls.has(id)) return urls.get(id); const rec = await run('readonly', (s) => s.get(id)); if (!rec) return null; const u = URL.createObjectURL(rec.blob); urls.set(id, u); return u; };
  M.remove = async (id) => { await run('readwrite', (s) => s.delete(id)); if (urls.has(id)) { URL.revokeObjectURL(urls.get(id)); urls.delete(id); } };
  M.all = async () => run('readonly', (s) => s.getAll());
  M.clearFarm = async (farmId) => { try { for (const r of await M.all()) if (r.farmId === farmId) await M.remove(r.id); } catch (e) { /* ignore */ } };
  M.wipe = async () => { try { for (const r of await M.all()) await M.remove(r.id); } catch (e) { /* ignore */ } };
  const toData = (blob) => new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(blob); });
  M.exportAll = async () => { const out = []; try { for (const r of await M.all()) out.push({ id: r.id, farmId: r.farmId, w: r.w, h: r.h, created: r.created, data: await toData(r.blob) }); } catch (e) { /* none */ } return out; };
  M.importAll = async (list) => { for (const r of list || []) { const blob = await (await fetch(r.data)).blob(); await run('readwrite', (s) => s.put({ id: r.id, farmId: r.farmId, blob, w: r.w, h: r.h, created: r.created })); } };
  // Fill <img data-media="id"> elements with their stored image
  M.hydrate = (root) => U.$$('[data-media]', root).forEach(async (img) => { const u = await M.url(img.dataset.media); if (u) img.src = u; else img.alt = 'image missing'; });
})();
