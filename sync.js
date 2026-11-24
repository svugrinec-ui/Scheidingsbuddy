// Gegevens versleuteld bij je account bewaren, zodat ze op elk toestel terugkomen.
// - Versleuteld in de browser (AES-GCM) vóór het naar Supabase gaat; Supabase ziet alleen onleesbare tekst.
// - De sleutel komt van /api/sleutel (Vercel), afgeleid van een geheim dat alleen in Vercel staat.
//   Wie alleen de database heeft, kan dus niets lezen. Geen extra wachtwoord nodig.
// - Eén rij per gebruiker in tabel `gegevens` (RLS: alleen je eigen rij).
(() => {
  const A = window.SBAccount;
  if (!A || !window.crypto?.subtle) return;
  const KEYS = ["levensbalans-v1", "sb-wizard-v1"]; // wat er gesynchroniseerd wordt
  const META = "sb-sync";
  const SLEUTEL = "sb-sync-sleutel";
  const EN = document.documentElement.lang === "en";

  const rawSet = Storage.prototype.setItem;
  const get = k => { try { return localStorage.getItem(k); } catch { return null; } };
  const put = (k, v) => { try { v == null ? localStorage.removeItem(k) : rawSet.call(localStorage, k, v); } catch {} };
  const meta = () => { try { return JSON.parse(get(META)) || {}; } catch { return {}; } };
  const setMeta = m => put(META, JSON.stringify({ ...meta(), ...m }));

  // ---------- sleutel + versleuteling ----------
  const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
  const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  let cryptoKey = null;
  async function sleutel(uid) {
    if (cryptoKey?.uid === uid) return cryptoKey.k;
    let raw = null;
    try { const c = JSON.parse(get(SLEUTEL)); if (c?.uid === uid) raw = c.k; } catch {}
    if (!raw) {
      const tk = await A.token(); if (!tk) return null;
      const r = await fetch("/api/sleutel", { headers: { Authorization: `Bearer ${tk}` }, cache: "no-store" });
      if (!r.ok) return null;
      raw = (await r.json()).sleutel; if (!raw) return null;
      put(SLEUTEL, JSON.stringify({ uid, k: raw }));
    }
    const k = await crypto.subtle.importKey("raw", unb64(raw), "AES-GCM", false, ["encrypt", "decrypt"]);
    cryptoKey = { uid, k };
    return k;
  }
  async function versleutel(k, obj) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, k, new TextEncoder().encode(JSON.stringify(obj)));
    return { inhoud: b64(ct), iv: b64(iv) };
  }
  async function ontsleutel(k, row) {
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(row.iv) }, k, unb64(row.inhoud));
    return JSON.parse(new TextDecoder().decode(pt));
  }

  // ---------- server ----------
  async function rest(path, opts = {}) {
    const tk = await A.token(); if (!tk) throw new Error("offline");
    const r = await fetch(A.base + path, { ...opts, headers: { apikey: A.key, Authorization: `Bearer ${tk}`, "Content-Type": "application/json", ...(opts.headers || {}) } });
    if (!r.ok) throw new Error("http " + r.status);
    return r.status === 204 ? null : r.json().catch(() => null);
  }
  const haalOp = uid => rest(`/rest/v1/gegevens?user_id=eq.${uid}&select=inhoud,iv,bijgewerkt`).then(r => r?.[0] || null);
  const zetNeer = (uid, enc, keepalive) => rest("/rest/v1/gegevens?on_conflict=user_id", { method: "POST", keepalive,
    headers: { Prefer: "resolution=merge-duplicates,return=representation" }, body: JSON.stringify({ user_id: uid, ...enc }) }).then(r => r?.[0] || null);

  // ---------- samenvoegen ----------
  const lokaal = () => Object.fromEntries(KEYS.map(k => [k, get(k)]));
  const leeg = d => KEYS.every(k => d[k] == null);
  // Twee versies van hetzelfde gegeven samenvoegen: niets weggooien, bij twijfel wint dit toestel.
  function mergeVal(a, b) {
    if (a == null) return b; if (b == null) return a;
    if (Array.isArray(a) && Array.isArray(b)) {
      if (!a.every(x => x && x.id) || !b.every(x => x && x.id)) return a;
      const ids = new Set(a.map(x => x.id)); return [...a, ...b.filter(x => !ids.has(x.id))];
    }
    if (typeof a === "object" && typeof b === "object" && !Array.isArray(a) && !Array.isArray(b)) {
      const out = { ...b };
      for (const k of Object.keys(a)) out[k] = k in b ? (typeof a[k] === "object" && a[k] && !Array.isArray(a[k]) ? { ...b[k], ...a[k] } : mergeVal(a[k], b[k])) : a[k];
      return out;
    }
    return a;
  }
  // Een vers geopende app heeft alleen de drie voorbeeldtaken: dat telt niet als eigen gegevens.
  function alleenStart(k, d) {
    if (k !== "levensbalans-v1" || !d) return false;
    const leegObj = o => !o || !Object.keys(o).length;
    return leegObj(d.checkins) && leegObj(d.reflections) && !d.buffer && (d.tasks || []).length <= 3 &&
      (d.tasks || []).every(t => !t.done && !(t.steps || []).length && !t.note);
  }
  function merge(loc, rem) {
    const out = {};
    for (const k of KEYS) {
      if (loc[k] == null || rem[k] == null) { out[k] = loc[k] ?? rem[k] ?? null; continue; }
      try {
        const a = JSON.parse(loc[k]), b = JSON.parse(rem[k]);
        if (alleenStart(k, a)) { out[k] = rem[k]; continue; } // nieuw toestel: niets toevoegen aan je echte gegevens
        // Top-level: verzamelingen (check-ins, terugblikken, taken) per item samenvoegen, de rest: dit toestel.
        const m = { ...b };
        for (const f of Object.keys(a)) m[f] = f in b ? (a[f] && typeof a[f] === "object" ? mergeVal(a[f], b[f]) : a[f]) : a[f];
        out[k] = JSON.stringify(m);
      } catch { out[k] = loc[k]; }
    }
    return out;
  }
  const schrijfLokaal = d => KEYS.forEach(k => put(k, d[k]));
  const gelijk = (a, b) => KEYS.every(k => (a[k] ?? null) === (b[k] ?? null));

  // ---------- synchroniseren ----------
  let bezig = null, opnieuw = false, timer = null;
  let laatst = meta().laatst || null, fout = false;

  async function sync({ keepalive = false } = {}) {
    if (bezig) { opnieuw = true; return bezig; }
    bezig = (async () => {
      const u = A.user(); if (!u || !navigator.onLine) return;
      const k = await sleutel(u.id); if (!k) { fout = true; return; }
      const m = meta();
      const row = await haalOp(u.id);
      const rem = row ? await ontsleutel(k, row) : null;
      const loc = lokaal();
      let doel = loc, herlaad = false;

      if (m.owner && m.owner !== u.id) {
        // Gegevens van iemand anders op dit toestel: niet meenemen naar dit account.
        doel = rem || Object.fromEntries(KEYS.map(x => [x, null]));
        herlaad = true;
      } else if (!m.owner || m.dirty || (row && row.bijgewerkt !== m.versie)) {
        if (rem && !m.owner) doel = merge(loc, rem);           // eerste keer koppelen
        else if (rem && m.dirty && row.bijgewerkt !== m.versie) doel = merge(loc, rem); // allebei gewijzigd
        else if (rem && !m.dirty) doel = rem;                    // alleen de server is nieuwer
        herlaad = !gelijk(doel, loc);
      }
      if (herlaad) schrijfLokaal(doel);

      let versie = row?.bijgewerkt || null;
      if (!rem || !gelijk(doel, rem)) {
        if (!leeg(doel)) versie = (await zetNeer(u.id, await versleutel(k, doel), keepalive))?.bijgewerkt || versie;
      }
      setMeta({ owner: u.id, dirty: false, versie, laatst: new Date().toISOString() });
      laatst = new Date().toISOString(); fout = false;
      if (herlaad) location.reload();
    })().catch(() => { fout = true; }).finally(() => { bezig = null; if (opnieuw) { opnieuw = false; plan(); } });
    return bezig;
  }
  const plan = (ms = 1500) => { clearTimeout(timer); timer = setTimeout(() => sync(), ms); };

  // Elke wijziging aan de app-gegevens markeren en kort daarna versturen.
  Storage.prototype.setItem = function (k, v) {
    rawSet.call(this, k, v);
    if (this === localStorage && KEYS.includes(k) && A.user()) { setMeta({ dirty: true }); plan(); }
  };

  window.addEventListener("sb-login", () => sync());
  window.addEventListener("sb-logout", () => { put(SLEUTEL, null); cryptoKey = null; });
  window.addEventListener("online", () => sync());
  document.addEventListener("visibilitychange", () => {
    if (!A.user()) return;
    if (document.visibilityState === "hidden") { if (meta().dirty) { clearTimeout(timer); sync({ keepalive: true }); } }
    else sync();
  });

  window.SBSync = {
    sync,
    statusText() {
      if (fout) return EN ? "Sync not working right now; your data is safe on this device." : "Synchroniseren lukt nu niet; je gegevens staan veilig op dit toestel.";
      if (!laatst) return EN ? "Not synced yet." : "Nog niet gesynchroniseerd.";
      const t = new Date(laatst).toLocaleString(EN ? "en-GB" : "nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
      return (EN ? "Stored encrypted with your account · last synced " : "Versleuteld bewaard bij je account · laatst bijgewerkt ") + t;
    },
  };

  const start = () => { if (A.user()) sync(); };
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", start) : start();
})();
