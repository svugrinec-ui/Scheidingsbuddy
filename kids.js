// Ouder of kind: startkeuze, een eigen kind-app en voor ouders de onderdelen Kinderen, Onze afspraken en Onze route.
// Alles blijft op het toestel. Een ouder zet de app van een kind klaar met een link; daarin zit alleen wat het kind mag zien.
(() => {
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const read = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const PKEY = "sb-persona", CKEY = "sb-kids-v1", KKEY = "sb-kind-v1";

  // ---------- datums ----------
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const fromIso = s => { const [y, m, d] = String(s).split("-").map(Number); return new Date(y, (m || 1) - 1, d || 1); };
  const monday = d => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const DAYS = ["ma", "di", "wo", "do", "vr", "za", "zo"];

  // ---------- vaste inhoud ----------
  const DEF_BLIJFT = ["Je school en je klas", "Je vriendjes en vriendinnetjes", "Je sport en je clubjes", "Je blijft in Soest wonen", "Papa en mama houden allebei van je"];
  const DEF_VERANDERT = [
    { t: "Twee huizen", d: "Allebei in Soest, dicht bij school." },
    { t: "Een eigen kamer", d: "Bij papa én bij mama. Jij mag helpen inrichten." },
    { t: "Je wisseltas", d: "Je knuffel en je sporttas gaan altijd mee." },
    { t: "Wisselen na school", d: "De ene ouder brengt je, de andere haalt je op." }];
  const PHASES = [
    { t: "Besluit tot scheiden", d: "Samen besluiten. Afspreken dat jullie respectvol blijven en de kinderen voorop zetten." },
    { t: "Vertellen", d: "Samen aan de kinderen, daarna aan familie, vrienden en school." },
    { t: "Mediation", d: "Met een mediator naar twee convenanten." },
    { t: "Praktisch ontvlechten", d: "Rekeningen, verzekeringen, abonnementen en adres regelen." },
    { t: "Nieuwe huizen", d: "Allebei een eigen plek, met een kamer voor de kinderen die ze zelf mee inrichten." },
    { t: "Goed blijven communiceren", d: "Vast ouderoverleg, bijvoorbeeld elke maand, en een korte notitie bij elke wissel: slaap, school, bijzonderheden." },
    { t: "Nieuwe partner", d: "Eerst de andere ouder inlichten, dan rustig en stap voor stap de kinderen.", opt: true }];
  const PHASE_KID = ["", "\"Papa en mama hebben het je verteld.\"", "\"Papa en mama maken afspraken.\" Geld ziet het kind niet.", "Niets: dit is voor grote mensen.", "\"Je krijgt een eigen kamer bij papa én bij mama.\"", "\"Papa en mama blijven samen praten over hoe het met jou gaat.\"", "\"Later, misschien.\" Met de belofte dat jullie het eerst vertellen."];
  const KIDSTEPS = [
    { t: "Papa en mama hebben het je verteld", d: "Ze gaan niet meer samen verder als stel. Wel allebei als jouw ouders." },
    { t: "Papa en mama maken afspraken", d: "Een helper, de mediator, helpt ze daarbij. Geld regelen papa en mama. Daar hoef jij niet over te piekeren." },
    { t: "Twee huizen", d: "Je krijgt een eigen kamer bij papa én bij mama. Jij mag meehelpen." },
    { t: "Wennen aan je nieuwe week", d: "Papa en mama blijven samen praten over hoe het met jou gaat." },
    { t: "Later, misschien", d: "Papa of mama krijgt een nieuwe vriend of vriendin. Dat vertellen ze je eerst, en je mag er alles over vragen.", opt: true }];
  const KIDMAP = [0, 0, 1, 1, 2, 3, 3];
  const ONTVLECHT = ["Gezamenlijke rekeningen splitsen", "Verzekeringen aanpassen", "Abonnementen en energie overzetten", "Adreswijziging bij de gemeente", "Kinderbijslag en toeslagen regelen", "Testament en begunstiging pensioen bijwerken"];
  const SEED_AFSPRAKEN = [
    { t: "Zorg 50/50, twee huizen", v: true, m: true, k: "Je woont even veel bij papa als bij mama." },
    { t: "Allebei in Soest, zelfde school", v: true, m: true, k: "Je blijft op je school en bij je vrienden." },
    { t: "Wisselmoment via school", v: false, m: false, k: "Je wisselt na school: de ene ouder brengt je, de andere haalt je op." },
    { t: "Verjaardagen en feestdagen", v: false, m: false, k: "" }];
  const FEEL = [{ id: "zon", t: "Zonnig" }, { id: "half", t: "Gaat wel" }, { id: "wolk", t: "Bewolkt" }, { id: "regen", t: "Regen" }];
  const feelIcon = (id, s = 34) => ({
    zon: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="#a07d3c" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.5" fill="#e2cfa9"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>`,
    half: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="#62799a" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.2" fill="#e2cfa9" stroke="#a07d3c"/><path d="M8 19h9a3.5 3.5 0 0 0 0-7 5 5 0 0 0-9.6 1.2A3 3 0 0 0 8 19z" fill="#fff"/></svg>`,
    wolk: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="#62799a" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 18h10a4 4 0 0 0 0-8 6 6 0 0 0-11.5 1.6A3.3 3.3 0 0 0 7 18z" fill="#e4e9ef"/></svg>`,
    regen: `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="#62799a" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 14h10a3.5 3.5 0 0 0 0-7 5.5 5.5 0 0 0-10.5 1.4A3 3 0 0 0 7 14z" fill="#e4e9ef"/><path d="M8 17l-1 3M12 17l-1 3M16 17l-1 3"/></svg>` }[id]);
  const IC = {
    check: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>`,
    heart: `<svg width="22" height="22" viewBox="0 0 24 24" fill="#c98b8b" stroke="#a0605d" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>`,
    house: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/></svg>`,
    houses: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12 7 7l5 5"/><path d="M3.5 10.5V18h7v-7.5"/><path d="M12 12l5-5 5 5"/><path d="M13.5 10.5V18h7v-7.5"/></svg>`,
    sun: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2"/></svg>`,
    cal: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>`,
    feel: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>`,
    path: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="6" cy="6" r="2"/><circle cx="6" cy="18" r="2"/><path d="M6 8v8M10 6h10M10 18h10M10 12h6"/></svg>`,
    person: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4.5-6 8-6s7 2 8 6"/></svg>`,
    speaker: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>`,
    lock: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>`,
    phone: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>`,
    chev: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>` };
  const LOGO = `<svg width="76" height="76" viewBox="0 0 100 100" aria-hidden="true" style="border-radius:18px"><rect width="100" height="100" fill="#1b1f23"/><rect x="24" y="27" width="52" height="52" fill="none" stroke="#e9e6e1" stroke-opacity=".4" stroke-width="2"/><circle cx="50" cy="47" r="32" fill="none" stroke="#e9e6e1" stroke-width="2.5"/><circle cx="22.9" cy="30" r="6" fill="#c98b8b"/><circle cx="77.1" cy="30" r="6" fill="#7d93ad"/><circle cx="38" cy="76.7" r="6" fill="#8fa889"/><circle cx="62" cy="76.7" r="6" fill="#cdb48a"/></svg>`;

  // ---------- opslag ----------
  let persona = read(PKEY, null);
  const setPersona = p => { persona = p; if (p) write(PKEY, p); else { try { localStorage.removeItem(PKEY); } catch {} } };
  const defCfg = () => ({ kids: [], rooster: Array(14).fill(""), rstart: iso(monday(new Date())), blijft: DEF_BLIJFT.slice(), verandert: DEF_VERANDERT.map(x => ({ ...x })),
    afspraken: SEED_AFSPRAKEN.map((x, i) => ({ id: "a" + i, ...x })), phase: 2, convA: "bezig", convB: "bezig", ontvlecht: {} });
  let cfg = { ...defCfg(), ...read(CKEY, {}) };
  const saveCfg = () => write(CKEY, cfg);
  let kid = read(KKEY, { cfg: null, feel: {}, notes: [] });
  const saveKid = () => write(KKEY, kid);

  // ---------- link om de app van een kind klaar te zetten ----------
  const b64e = s => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const b64d = s => decodeURIComponent(escape(atob(s.replace(/-/g, "+").replace(/_/g, "/"))));
  const kidCfg = k => ({ naam: k.naam, leeftijd: k.leeftijd, rooster: cfg.rooster, rstart: cfg.rstart, blijft: cfg.blijft, verandert: cfg.verandert,
    afspraken: cfg.afspraken.filter(a => a.v && a.m && a.k).map(a => a.k), phase: cfg.phase });
  const kidLink = k => `${location.origin}${location.pathname}#kind=${b64e(JSON.stringify(kidCfg(k)))}`;
  function importKid(code) {
    try { const c = JSON.parse(b64d(code.trim().replace(/^.*#kind=/, ""))); if (!c || typeof c !== "object" || !Array.isArray(c.rooster)) return false;
      kid.cfg = c; saveKid(); setPersona({ role: "kind" }); return true; } catch { return false; }
  }
  if (location.hash.startsWith("#kind=")) { importKid(location.hash.slice(6)); history.replaceState(null, "", location.pathname); }

  // ---------- stijl ----------
  const st = document.createElement("style");
  st.textContent = `
body.kidmode > .wrap, body.kidmode > nav.tabs { display: none; }
.sb-entry { position: fixed; inset: 0; z-index: 120; background: var(--bg); overflow-y: auto; }
.sb-entry .in { max-width: 440px; margin: 0 auto; padding: calc(40px + env(safe-area-inset-top, 0px)) 18px calc(28px + env(safe-area-inset-bottom, 0px)); display: grid; gap: 22px; }
.sb-entry h1 { font-family: var(--font-display); font-weight: 600; font-size: 1.9rem; margin: 0; text-align: center; }
.sb-entry .lead { margin: 0; text-align: center; color: var(--fg-2); }
.sb-entry .lab { margin: 0; font-size: .8rem; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: var(--fg-3); }
.sb-entry .two { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.sb-choice { display: flex; flex-direction: column; gap: 10px; align-items: flex-start; padding: 18px 16px; min-height: 104px; background: var(--surface); border: 1px solid var(--line); border-radius: 20px; color: var(--fg); font: inherit; font-size: 1.1rem; font-weight: 600; cursor: pointer; text-align: left; }
.sb-choice svg { color: var(--accent); }
.sb-choice.kid { flex-direction: row; align-items: center; min-height: 84px; background: color-mix(in srgb, var(--p-wonen) 18%, var(--surface)); }
.sb-choice small { display: block; font-size: .85rem; font-weight: 400; color: var(--fg-2); }
.sb-entry .note { display: flex; gap: 12px; align-items: flex-start; background: var(--surface-2); border-radius: 16px; padding: 14px 16px; font-size: .85rem; color: var(--fg-2); }
.kid-app { max-width: 520px; margin: 0 auto; padding: calc(20px + env(safe-area-inset-top, 0px)) 18px calc(110px + env(safe-area-inset-bottom, 0px)); display: grid; gap: 16px; font-size: 16px; }
.kid-app h1 { font-family: var(--font-display); font-weight: 600; font-size: 1.9rem; margin: 0; }
.kid-app h2 { font-family: var(--font-display); font-weight: 600; font-size: 1.25rem; margin: 0; }
.kid-card { background: var(--surface); border: 1px solid var(--line); border-radius: 22px; padding: 18px; display: grid; gap: 12px; }
.kid-hero { background: #a9c1a2; color: #1f2326; border-radius: 26px; padding: 20px; display: grid; gap: 12px; }
.kid-hero.mama { background: #dcc79f; }
.kid-hero.leeg { background: var(--surface-2); color: var(--fg); }
.kid-hero .who { font-family: var(--font-display); font-size: 2.1rem; font-weight: 600; line-height: 1.1; }
.kid-list { display: grid; gap: 10px; }
.kid-list > div { display: flex; gap: 12px; align-items: center; }
.kid-list .ok { color: var(--good); flex-shrink: 0; }
.kid-link { display: flex; align-items: center; gap: 14px; padding: 16px 18px; background: var(--accent-soft); border-radius: 22px; text-decoration: none; color: var(--fg); border: 0; font: inherit; text-align: left; cursor: pointer; width: 100%; }
.kid-link svg { color: var(--accent); flex-shrink: 0; }
.kid-week { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 5px; text-align: center; }
.kid-week span { display: block; }
.kid-week .d { font-size: .75rem; font-weight: 600; color: var(--fg-2); margin-bottom: 6px; }
.kid-week .c { height: 56px; border-radius: 12px; display: grid; place-items: center; font-weight: 700; color: #1f2326; background: var(--surface-2); }
.kid-week .c.p { background: #a9c1a2; } .kid-week .c.m { background: #dcc79f; }
.kid-week .today .c { box-shadow: 0 0 0 3px var(--fg); }
.kid-legend { display: flex; gap: 16px; font-size: .85rem; color: var(--fg-2); }
.kid-legend i { display: inline-block; width: 14px; height: 14px; border-radius: 4px; vertical-align: -2px; margin-right: 6px; }
.kid-item { display: flex; gap: 14px; align-items: flex-start; background: var(--surface); border: 1px solid var(--line); border-radius: 18px; padding: 14px 16px; }
.kid-item svg { color: var(--accent); flex-shrink: 0; }
.kid-item p { margin: 2px 0 0; font-size: .92rem; color: var(--fg-2); }
.kid-feel { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
.kid-feel button { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 12px 4px; border-radius: 18px; border: 1px solid var(--line); background: var(--surface); font: inherit; font-size: .82rem; font-weight: 600; color: var(--fg); cursor: pointer; }
.kid-feel button[aria-pressed="true"] { border: 2px solid var(--accent); background: var(--accent-soft); }
.kid-chips { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; }
.kid-chips button, .sb-tog { min-height: 44px; border-radius: 999px; border: 1px solid var(--line); background: var(--surface); font: inherit; font-size: .85rem; font-weight: 600; color: var(--fg); cursor: pointer; }
.kid-chips button[aria-pressed="true"], .sb-tog[aria-pressed="true"] { background: var(--accent); border-color: var(--accent); color: var(--accent-ink); }
.kid-app textarea { font: inherit; font-size: 16px; padding: 12px; border-radius: 14px; border: 1px solid var(--line); background: var(--bg); color: var(--fg); resize: vertical; width: 100%; box-sizing: border-box; }
.kid-warm { background: color-mix(in srgb, var(--p-relatie) 22%, var(--surface)); border-radius: 22px; padding: 16px 18px; display: grid; gap: 6px; }
.kid-warm p { margin: 0; }
.kid-help { display: flex; gap: 12px; align-items: center; font-size: .85rem; color: var(--fg-2); }
.kid-help a { color: var(--accent); font-weight: 600; }
.kid-nav { position: fixed; left: 50%; transform: translateX(-50%); bottom: calc(14px + env(safe-area-inset-bottom, 0px)); z-index: 20; width: min(440px, calc(100% - 24px)); display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 4px; padding: 6px; background: color-mix(in srgb, var(--surface) 88%, transparent); -webkit-backdrop-filter: blur(16px); backdrop-filter: blur(16px); border: 1px solid var(--line); border-radius: 999px; box-shadow: 0 10px 30px rgba(0,0,0,.14); }
.kid-nav button { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 8px 2px; border: 0; border-radius: 999px; background: none; color: var(--fg-2); font: inherit; font-size: .72rem; font-weight: 600; cursor: pointer; }
.kid-nav button[aria-current="page"] { background: var(--accent-soft); color: var(--accent); }
.kid-steps { display: grid; }
.kid-step { display: grid; grid-template-columns: 46px minmax(0, 1fr); gap: 12px; }
.kid-step .rail { display: flex; flex-direction: column; align-items: center; }
.kid-step .dot { width: 40px; height: 40px; border-radius: 99px; display: grid; place-items: center; box-sizing: border-box; border: 3px solid var(--line); background: var(--surface); color: var(--fg-2); font-weight: 700; }
.kid-step.done .dot { background: #a9c1a2; border-color: #a9c1a2; color: #1f2326; }
.kid-step.now .dot { background: var(--accent); border-color: var(--accent); color: var(--accent-ink); box-shadow: 0 0 0 6px var(--accent-soft); }
.kid-step.opt .dot { border-style: dashed; }
.kid-step .line { flex: 1; width: 3px; background: var(--line); }
.kid-step.done .line { background: #a9c1a2; }
.kid-step .txt { padding: 8px 0 16px; }
.kid-step .txt p { margin: 4px 0 0; color: var(--fg-2); font-size: .95rem; }
.sb-now { font-size: .7rem; font-weight: 700; padding: 3px 8px; border-radius: 99px; background: var(--accent); color: var(--accent-ink); vertical-align: 2px; margin-left: 6px; }
.kid-banner { position: sticky; top: 0; z-index: 5; display: flex; justify-content: space-between; align-items: center; gap: 10px; background: var(--fg); color: var(--bg); border-radius: 14px; padding: 8px 8px 8px 14px; font-size: .85rem; font-weight: 600; }
.kid-banner button { min-height: 36px; border: 0; border-radius: 10px; padding: 0 12px; background: var(--bg); color: var(--fg); font: inherit; font-weight: 600; cursor: pointer; }
.kid-strip { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 6px; text-align: center; font-size: .75rem; color: var(--fg-2); }
.kid-strip .e { height: 34px; display: grid; place-items: center; border-radius: 10px; background: var(--surface-2); }
.sb-rooster { display: grid; grid-template-columns: 44px repeat(7, minmax(0, 1fr)); gap: 5px; align-items: center; text-align: center; }
.sb-rooster .h { font-size: .75rem; font-weight: 600; color: var(--fg-2); }
.sb-rooster button { min-height: 44px; border-radius: 10px; border: 1px dashed var(--line); background: var(--surface-2); font: inherit; font-weight: 700; color: #1f2326; cursor: pointer; padding: 0; }
.sb-rooster button.p { background: #a9c1a2; border: 0; } .sb-rooster button.m { background: #dcc79f; border: 0; }
.sb-rooster button:not(.p):not(.m) { color: var(--fg-3); }
.sb-afs { display: grid; gap: 10px; }
.sb-afs input[type=text], .sb-kidrow input { font: inherit; font-size: 16px; color: var(--fg); background: var(--bg); border: 1px solid var(--line); border-radius: 10px; padding: 9px 11px; width: 100%; box-sizing: border-box; }
.sb-afs .tog { display: flex; gap: 6px; }
.sb-afs .tog .sb-tog { min-height: 38px; padding: 0 12px; }
.sb-state { font-size: .8rem; font-weight: 600; }
.sb-state.ok { color: var(--good); } .sb-state.wait { color: var(--warn); } .sb-state.open { color: var(--fg-3); }
.sb-route { display: grid; }
.sb-ph { display: grid; grid-template-columns: 34px minmax(0, 1fr); gap: 10px; }
.sb-ph .rail { display: flex; flex-direction: column; align-items: center; }
.sb-ph .dot { width: 28px; height: 28px; border-radius: 99px; display: grid; place-items: center; box-sizing: border-box; border: 2px solid var(--line); color: var(--fg-2); font-size: .8rem; font-weight: 700; background: var(--surface); }
.sb-ph.done .dot { background: var(--good); border-color: var(--good); color: var(--surface); }
.sb-ph.now .dot { background: var(--accent); border-color: var(--accent); color: var(--accent-ink); box-shadow: 0 0 0 5px var(--accent-soft); }
.sb-ph.opt .dot { border-style: dashed; }
.sb-ph .line { flex: 1; width: 2px; background: var(--line); }
.sb-ph.done .line { background: var(--good); }
.sb-ph .body { padding: 2px 0 18px; display: grid; gap: 6px; min-width: 0; }
.sb-ph .body p { margin: 0; }
.sb-sub { background: var(--surface-2); border-radius: 14px; padding: 12px; display: grid; gap: 6px; }
.sb-sub select { font: inherit; font-size: 15px; border-radius: 8px; border: 1px solid var(--line); background: var(--surface); color: var(--fg); padding: 6px 8px; justify-self: start; }
.sb-linkbtn { background: none; border: 0; padding: 0; font: inherit; color: var(--accent); font-weight: 600; cursor: pointer; text-align: left; }
.sb-row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.sb-kidrow { display: grid; grid-template-columns: minmax(0, 1fr) 104px auto; gap: 8px; align-items: center; }
.sb-check { display: flex; gap: 10px; align-items: center; min-height: 40px; }
.sb-check input { width: 20px; height: 20px; accent-color: var(--accent); }
.sb-band { background: var(--surface); border-radius: var(--r); padding: 14px 18px; display: flex; gap: 12px; align-items: center; text-decoration: none; color: inherit; }
.sb-band svg { color: var(--accent); flex-shrink: 0; }
.sb-band .t { display: grid; flex: 1; min-width: 0; }
.sb-band small { color: var(--fg-2); }`;
  document.head.appendChild(st);

  // ---------- startscherm: wie gebruikt de app? ----------
  function openEntry() {
    document.querySelector(".sb-entry")?.remove();
    const el = document.createElement("div");
    el.className = "sb-entry"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-label", "Wie gebruikt de app?");
    el.innerHTML = `<div class="in">
      <div style="display:grid;justify-items:center;gap:14px">${LOGO}<h1>Wie gebruikt de app?</h1>
      <p class="lead">Ouders en kinderen krijgen elk een eigen app. Dezelfde afspraken, in eigen woorden.</p></div>
      <div style="display:grid;gap:10px"><p class="lab">Ouder</p>
        <div class="two"><button type="button" class="sb-choice" data-role="vader">${IC.person}Vader</button><button type="button" class="sb-choice" data-role="moeder">${IC.person}Moeder</button></div>
        <p class="small muted" style="margin:0">Je eigen balans, de afspraken met je ex en wat de kinderen zien.</p></div>
      <div style="display:grid;gap:10px"><p class="lab">Kind</p>
        <button type="button" class="sb-choice kid" data-role="kind"><span style="color:var(--good)">${IC.sun.replace(/22/g, "34")}</span><span>Ik ben een kind<small>Papa of mama zet jouw app klaar</small></span></button></div>
      <div class="note">${IC.lock}<span>Alles blijft op dit toestel. Kinderen hebben geen e-mail nodig.</span></div></div>`;
    document.body.appendChild(el); document.body.style.overflow = "hidden";
    el.addEventListener("click", e => {
      const b = e.target.closest("[data-role]"); if (!b) return;
      setPersona({ role: b.dataset.role }); el.remove(); document.body.style.overflow = "";
      apply(); window.dispatchEvent(new Event("sb-persona"));
    });
  }

  // ---------- kind-app ----------
  let kidTab = "vandaag", preview = null; // preview = kind-config die een ouder bekijkt
  const kc = () => preview || kid.cfg;
  const whoOn = (c, d) => { if (!c?.rooster?.length) return ""; const n = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - fromIso(c.rstart)) / 864e5); return c.rooster[((n % 14) + 14) % 14] || ""; };
  const NAME = { p: "papa", m: "mama" };
  function kidRoot() {
    let r = $("kidApp");
    if (!r) { r = document.createElement("main"); r.id = "kidApp"; r.className = "kid-app"; document.body.appendChild(r);
      r.addEventListener("click", kidClick); }
    return r;
  }
  function renderKid() {
    document.body.classList.add("kidmode");
    const r = kidRoot(), c = kc();
    const banner = preview ? `<div class="kid-banner"><span>Voorbeeld: dit ziet ${esc(preview.naam || "je kind")}</span><button type="button" data-k="exitpreview">Terug</button></div>` : "";
    if (!c) {
      r.innerHTML = `<h1>Hoi!</h1><div class="kid-card"><h2>Je app is nog niet klaar</h2>
        <p style="margin:0">Vraag papa of mama om jouw app klaar te zetten. Zij sturen je een link. Open die link op dit toestel.</p>
        <label for="kidCode" class="small muted">Of plak hier de link</label><textarea id="kidCode" rows="3"></textarea>
        <button type="button" class="btn" data-k="code">Klaar</button><p class="small" id="kidCodeMsg" style="margin:0" role="status"></p></div>
        <p class="small" style="text-align:center"><button type="button" class="sb-linkbtn" data-k="parent">Ben je een ouder?</button></p>`;
      $("kidNav")?.remove(); return;
    }
    const today = new Date(), w = whoOn(c, today), tw = whoOn(c, addDays(today, 1));
    let h = banner;
    if (kidTab === "vandaag") {
      const hero = w ? `<div class="kid-hero ${w === "m" ? "mama" : ""}"><div style="display:flex;gap:14px;align-items:center">${IC.house}<div><div class="small" style="font-weight:600">Vandaag slaap je bij</div><div class="who">${w === "p" ? "Papa" : "Mama"}</div></div></div>
          ${tw && tw !== w ? `<p style="margin:0">Morgen na school haalt <b>${NAME[tw]}</b> je op.</p>` : tw ? `<p style="margin:0">Morgen ben je ook bij ${NAME[tw]}.</p>` : ""}</div>`
        : `<div class="kid-hero leeg"><b>Papa en mama maken het rooster nog.</b><p style="margin:0">Zodra het klaar is, zie je hier bij wie je slaapt.</p></div>`;
      h += `<div style="display:flex;justify-content:space-between;align-items:center"><h1>Hoi ${esc(c.naam || "")}!</h1>
          <button type="button" class="pref" data-k="speak" aria-label="Voorlezen" style="width:44px;height:44px">${IC.speaker}</button></div>
        ${hero}
        <div class="kid-card"><h2>Dit blijft hetzelfde</h2><div class="kid-list">${(c.blijft || []).map((x, i, a) => `<div>${i === a.length - 1 && /houden/.test(x) ? IC.heart : `<span class="ok">${IC.check}</span>`}<span>${esc(x)}</span></div>`).join("")}</div></div>
        ${(c.afspraken || []).length ? `<div class="kid-card"><h2>Papa en mama hebben afgesproken</h2><div class="kid-list">${c.afspraken.map(x => `<div><span class="ok">${IC.check}</span><span>${esc(x)}</span></div>`).join("")}</div></div>` : ""}
        <button type="button" class="kid-link" data-k="tab" data-v="route">${IC.houses}<span style="flex:1;display:grid"><b>Wat er allemaal gebeurt</b><span class="small muted">Stap voor stap, en waar we nu zijn</span></span>${IC.chev}</button>
        ${preview ? "" : `<p class="small" style="text-align:center;margin:0"><button type="button" class="sb-linkbtn" data-k="parent">Voor ouders</button></p>`}`;
    } else if (kidTab === "week") {
      const mon = monday(today);
      h += `<h1>Mijn week</h1><div class="kid-card"><div class="kid-week">${DAYS.map((d, i) => { const day = addDays(mon, i), x = whoOn(c, day);
          return `<div class="${iso(day) === iso(today) ? "today" : ""}"><span class="d">${d}</span><span class="c ${x}" aria-label="${d}: ${x ? "bij " + NAME[x] : "nog niet bekend"}">${x ? x.toUpperCase() : "?"}</span></div>`; }).join("")}</div>
        <div class="kid-legend"><span><i style="background:#a9c1a2"></i>Bij papa</span><span><i style="background:#dcc79f"></i>Bij mama</span></div></div>
        <h2>Dit verandert</h2>${(c.verandert || []).map(x => `<div class="kid-item">${IC.houses}<div><b>${esc(x.t)}</b><p>${esc(x.d)}</p></div></div>`).join("")}`;
    } else if (kidTab === "gevoel") {
      const key = iso(today), cur = kid.feel?.[key] || "";
      const mon = monday(today);
      h += `<h1>Hoe voel je je?</h1>
        <div class="kid-feel">${FEEL.map(f => `<button type="button" data-k="feel" data-v="${f.id}" aria-pressed="${cur === f.id}">${feelIcon(f.id)}${f.t}</button>`).join("")}</div>
        <div class="kid-card"><h2 class="small" style="font-size:1rem">Jouw week</h2><div class="kid-strip">${DAYS.map((d, i) => { const v = kid.feel?.[iso(addDays(mon, i))]; return `<div><div class="e">${v ? feelIcon(v, 22) : ""}</div>${d}</div>`; }).join("")}</div></div>
        <div class="kid-card"><label for="kidQ"><h2>Wil je iets vragen of vertellen?</h2></label>
          <textarea id="kidQ" rows="3" placeholder="Typ hier"></textarea>
          <span class="small" style="font-weight:600;color:var(--fg-2)">Voor wie is het?</span>
          <div class="kid-chips">${["Alleen ik", "Papa", "Mama", "Allebei"].map((x, i) => `<button type="button" data-k="who" data-v="${i}" aria-pressed="${(kid.who ?? 3) === i}">${x}</button>`).join("")}</div>
          <button type="button" class="btn" data-k="send">${(kid.who ?? 3) === 0 ? "Bewaar voor mezelf" : "Versturen"}</button><p class="small" id="kidSendMsg" style="margin:0" role="status"></p></div>
        <div class="kid-warm"><h2>Het is niet jouw schuld</h2><p>Papa en mama hebben dit samen besloten. Je mag van allebei houden en bij allebei blij zijn.</p></div>
        <div class="kid-help">${IC.phone}<span>Liever met iemand anders praten? Je juf of meester, opa of oma, of <a href="tel:08000432">De Kindertelefoon: 0800-0432</a>, gratis.</span></div>`;
    } else if (kidTab === "route") {
      const k = KIDMAP[c.phase ?? 2] ?? 1;
      h += `<h1>Wat er allemaal gebeurt</h1><div class="kid-steps">${KIDSTEPS.map((s, i) => {
          const cls = i < k ? "done" : i === k ? "now" : ""; const last = i === KIDSTEPS.length - 1;
          return `<div class="kid-step ${cls} ${s.opt ? "opt" : ""}"><div class="rail"><span class="dot">${i < k ? IC.check : i + 1}</span>${last ? "" : `<span class="line"></span>`}</div>
            <div class="txt"><b>${s.t}</b>${i === k ? `<span class="sb-now">NU</span>` : ""}<p>${s.d}</p></div></div>`; }).join("")}</div>
        <button type="button" class="btn" data-k="tab" data-v="gevoel" style="min-height:52px">Ik heb een vraag</button>`;
    }
    r.innerHTML = h;
    let nav = $("kidNav");
    if (!nav) { nav = document.createElement("nav"); nav.id = "kidNav"; nav.className = "kid-nav"; nav.setAttribute("aria-label", "Kind"); document.body.appendChild(nav); nav.addEventListener("click", kidClick); }
    nav.innerHTML = [["vandaag", IC.sun, "Vandaag"], ["week", IC.cal, "Mijn week"], ["gevoel", IC.feel, "Mijn gevoel"], ["route", IC.path, "Stappen"]]
      .map(([id, ic, t]) => `<button type="button" data-k="tab" data-v="${id}" ${kidTab === id ? 'aria-current="page"' : ""}>${ic}${t}</button>`).join("");
  }
  function leaveKid() { $("kidApp")?.remove(); $("kidNav")?.remove(); document.body.classList.remove("kidmode"); }
  async function shareText(text) {
    if (navigator.share) { try { await navigator.share({ text }); return "Verstuurd."; } catch (e) { if (e?.name === "AbortError") return ""; } }
    try { await navigator.clipboard.writeText(text); return "Gekopieerd. Plak het in een bericht."; } catch { return "Dit toestel kan niet delen. Laat het zelf zien."; }
  }
  async function kidClick(e) {
    const b = e.target.closest("[data-k]"); if (!b) return;
    const k = b.dataset.k, c = kc();
    if (k === "tab") { kidTab = b.dataset.v; renderKid(); window.scrollTo(0, 0); }
    else if (k === "feel") { if (preview) return; kid.feel = kid.feel || {}; kid.feel[iso(new Date())] = b.dataset.v; saveKid(); renderKid(); }
    else if (k === "who") { kid.who = Number(b.dataset.v); if (!preview) saveKid(); const q = $("kidQ")?.value; renderKid(); if (q) $("kidQ").value = q; }
    else if (k === "send") {
      const q = $("kidQ").value.trim(), who = kid.who ?? 3, f = kid.feel?.[iso(new Date())];
      if (!q && !f) { $("kidSendMsg").textContent = "Kies eerst hoe je je voelt, of typ iets."; return; }
      if (preview) { $("kidSendMsg").textContent = "In het voorbeeld wordt niets verstuurd."; return; }
      if (who === 0) { kid.notes = [...(kid.notes || []), { d: iso(new Date()), q }]; saveKid(); $("kidQ").value = ""; $("kidSendMsg").textContent = "Bewaard. Alleen jij kunt het zien."; return; }
      const to = ["", "Papa", "Mama", "Papa en mama"][who];
      const text = `${to}, van ${c.naam || "je kind"}:${f ? `\nIk voel me vandaag: ${FEEL.find(x => x.id === f).t}.` : ""}${q ? `\n${q}` : ""}`;
      $("kidSendMsg").textContent = await shareText(text);
    }
    else if (k === "speak") {
      if (!("speechSynthesis" in window)) return;
      const t = $("kidApp").innerText.replace(/Voorlezen|Voor ouders/g, "");
      speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = "nl-NL"; u.rate = .95; speechSynthesis.speak(u);
    }
    else if (k === "code") { const ok = importKid($("kidCode").value); if (ok) { kidTab = "vandaag"; renderKid(); } else $("kidCodeMsg").textContent = "Deze link werkt niet. Vraag papa of mama om een nieuwe."; }
    else if (k === "exitpreview") { preview = null; kidTab = "vandaag"; leaveKid(); location.hash = "#kinderen"; window.scrollTo(0, 0); }
    else if (k === "parent") parentGate();
  }
  // Een eenvoudige ouder-check, zodat een kind niet per ongeluk in de ouder-app komt.
  function parentGate() {
    const a = 6 + Math.floor(Math.random() * 4), b = 6 + Math.floor(Math.random() * 4);
    const r = kidRoot();
    r.innerHTML = `<h1>Voor ouders</h1><div class="kid-card"><label for="pg">Hoeveel is ${a} × ${b}?</label><input id="pg" inputmode="numeric" style="font:inherit;font-size:20px;padding:10px;border-radius:12px;border:1px solid var(--line);background:var(--bg);color:var(--fg)">
      <div class="sb-row"><button type="button" class="btn" id="pgOk">Naar de ouder-app</button><button type="button" class="btn ghost" id="pgNo">Terug</button></div><p class="small" id="pgMsg" style="margin:0" role="status"></p></div>`;
    $("pgOk").onclick = () => { if (Number($("pg").value) === a * b) { setPersona(null); leaveKid(); openEntry(); } else $("pgMsg").textContent = "Dat klopt niet."; };
    $("pgNo").onclick = () => renderKid();
  }

  // ---------- ouder: Kinderen ----------
  const ageTip = n => n <= 7 ? `<b>Rond ${n} jaar</b> helpen korte zinnen, vaste rituelen en plaatjes. Laat de app voorlezen en herhaal wat hetzelfde blijft.`
    : n <= 12 ? `<b>Rond ${n} jaar</b> willen kinderen het waarom weten en meedenken. Vraag hun mening, bijvoorbeeld over hun kamer.`
    : `<b>Op ${n} jaar</b> wil een kind serieus genomen worden. Geef inspraak in het rooster en ruimte voor eigen plannen.`;
  function renderKinderen() {
    const el = $("view-kinderen");
    const mon = fromIso(cfg.rstart);
    const row = w => `<span class="h">${w ? "Wk 2" : "Wk 1"}</span>${DAYS.map((d, i) => { const j = w * 7 + i, v = cfg.rooster[j];
      return `<button type="button" class="${v}" data-a="rooster" data-i="${j}" aria-label="${d} week ${w + 1}: ${v ? "bij " + NAME[v] : "leeg"}">${v ? v.toUpperCase() : "·"}</button>`; }).join("")}`;
    el.innerHTML = `<h2 style="font-family:var(--font-display);font-size:1.6rem;margin:0">Kinderen</h2>
      <div class="panel"><h2>Je kinderen</h2>
        ${cfg.kids.length ? cfg.kids.map((k, i) => `<div style="display:grid;gap:8px;padding-bottom:10px;border-bottom:1px solid var(--line)">
          <div class="sb-row" style="justify-content:space-between"><b>${esc(k.naam)}, ${k.leeftijd}</b><button type="button" class="sb-linkbtn" data-a="delkid" data-i="${i}" style="color:var(--fg-3)">Verwijderen</button></div>
          <div class="sb-row"><button type="button" class="btn ghost" data-a="preview" data-i="${i}">Bekijk als kind</button><button type="button" class="btn" data-a="link" data-i="${i}">Zet app klaar</button></div>
          <p class="small muted" style="margin:0">${ageTip(k.leeftijd)}</p></div>`).join("")
          : `<p class="small muted" style="margin:0">Voeg je kinderen toe. Alleen voornaam en leeftijd, en alleen op dit toestel.</p>`}
        <div class="sb-kidrow"><input id="kidNaam" type="text" placeholder="Voornaam" aria-label="Voornaam" maxlength="40"><input id="kidLeeftijd" type="number" min="2" max="18" placeholder="Leeftijd" aria-label="Leeftijd"><button type="button" class="btn" data-a="addkid">Voeg toe</button></div>
        <p class="small" id="kidMsg" role="status" style="margin:0"></p>
        <p class="small muted" style="margin:0">Met "Zet app klaar" deel je een link. Open die op het toestel van je kind, in Safari of Chrome. Verander je iets, deel dan een nieuwe link.</p></div>
      <div class="panel"><h2>Rooster</h2><p class="small muted" style="margin:0">Twee weken die zich herhalen. Tik op een dag: P is papa, M is mama.</p>
        <div class="sb-rooster"><span></span>${DAYS.map(d => `<span class="h">${d}</span>`).join("")}${row(0)}${row(1)}</div>
        <div class="field"><label for="rstart">Week 1 begint op maandag</label><input id="rstart" type="date" value="${esc(cfg.rstart)}" style="font:inherit;font-size:16px;padding:8px;border-radius:10px;border:1px solid var(--line);background:var(--bg);color:var(--fg)"></div></div>
      <div class="panel"><h2>Wat blijft hetzelfde</h2><p class="small muted" style="margin:0">Eén regel per punt. Zet het belangrijkste onderaan.</p>
        <textarea id="blijftTxt" rows="5" style="font:inherit;font-size:16px;padding:10px;border-radius:10px;border:1px solid var(--line);background:var(--bg);color:var(--fg)">${esc(cfg.blijft.join("\n"))}</textarea>
        <h2>Wat verandert</h2><p class="small muted" style="margin:0">Eén regel per punt, als "Kop: uitleg".</p>
        <textarea id="verandertTxt" rows="5" style="font:inherit;font-size:16px;padding:10px;border-radius:10px;border:1px solid var(--line);background:var(--bg);color:var(--fg)">${esc(cfg.verandert.map(x => `${x.t}: ${x.d}`).join("\n"))}</textarea>
        <button type="button" class="btn" data-a="savetext" style="justify-self:start">Opslaan</button><p class="small" id="textMsg" role="status" style="margin:0"></p></div>
      <a class="sb-band" href="#afspraken">${IC.check}<span class="t"><b>Onze afspraken</b><small>Wat jullie samen afspreken, en wat de kinderen ervan zien</small></span>${IC.chev}</a>
      <a class="sb-band" href="#route">${IC.path}<span class="t"><b>Onze route</b><small>Fase ${cfg.phase + 1}: ${PHASES[cfg.phase].t}</small></span>${IC.chev}</a>`;
  }

  // ---------- ouder: Onze afspraken ----------
  function renderAfspraken() {
    const el = $("view-afspraken");
    const me = persona?.role === "moeder" ? "m" : "v";
    const stateOf = a => a.v && a.m ? `<span class="sb-state ok">Akkoord allebei</span>` : a.v || a.m ? `<span class="sb-state wait">Wacht op ${a.v ? "moeder" : "vader"}</span>` : `<span class="sb-state open">Open</span>`;
    const kidSee = cfg.afspraken.filter(a => a.v && a.m && a.k);
    el.innerHTML = `<h2 style="font-family:var(--font-display);font-size:1.6rem;margin:0">Onze afspraken</h2>
      <p class="small muted" style="margin:0">Het kind ziet een afspraak pas als jullie allebei akkoord zijn en er een kindtekst bij staat. Vink het akkoord van je ex alleen aan als die echt akkoord is.</p>
      <div class="sb-afs">${cfg.afspraken.map((a, i) => `<div class="panel" style="gap:8px">
        <input type="text" value="${esc(a.t)}" data-a="afst" data-i="${i}" aria-label="Afspraak">
        <div class="sb-row" style="justify-content:space-between">${stateOf(a)}<span class="tog">
          <button type="button" class="sb-tog" data-a="afsv" data-w="v" data-i="${i}" aria-pressed="${!!a.v}">Vader${me === "v" ? " (jij)" : ""}</button>
          <button type="button" class="sb-tog" data-a="afsv" data-w="m" data-i="${i}" aria-pressed="${!!a.m}">Moeder${me === "m" ? " (jij)" : ""}</button></span></div>
        <label class="small muted" for="afk${i}">Zo leest je kind het</label><input id="afk${i}" type="text" value="${esc(a.k)}" placeholder="In kindertaal, bijvoorbeeld: Je blijft op je school." data-a="afsk" data-i="${i}">
        <button type="button" class="sb-linkbtn" data-a="afsdel" data-i="${i}" style="color:var(--fg-3);justify-self:end">Verwijderen</button></div>`).join("")}</div>
      <button type="button" class="btn ghost" data-a="afsadd" style="justify-self:start">Afspraak toevoegen</button>
      <div class="panel"><h2>Dit ziet je kind</h2>${kidSee.length ? `<div class="kid-list">${kidSee.map(a => `<div><span class="ok" style="color:var(--good)">${IC.check}</span><span>${esc(a.k)}</span></div>`).join("")}</div>` : `<p class="small muted" style="margin:0">Nog niets.</p>`}</div>`;
  }

  // ---------- ouder: Onze route ----------
  function renderRoute() {
    const el = $("view-route"), p = cfg.phase;
    const sel = (id, v) => `<select data-a="conv" data-w="${id}" aria-label="Status">${[["open", "Open"], ["bezig", "Bezig"], ["klaar", "Klaar"]].map(([k, t]) => `<option value="${k}" ${v === k ? "selected" : ""}>${t}</option>`).join("")}</select>`;
    el.innerHTML = `<h2 style="font-family:var(--font-display);font-size:1.6rem;margin:0">Onze route</h2>
      <p class="small muted" style="margin:0">Zeven fases. Tik op "Hier zijn we nu" om aan te geven waar jullie zijn. Bij elke fase staat wat de kinderen ervan zien.</p>
      <div class="panel"><div class="sb-route">${PHASES.map((ph, i) => {
        const cls = i < p ? "done" : i === p ? "now" : ""; const last = i === PHASES.length - 1;
        let extra = "";
        if (i === 2) extra = `<div class="sb-sub"><b>Convenant A: geldzaken</b><span class="small muted">Huis, vermogen, de BV, alimentatie.</span>${sel("convA", cfg.convA)}<a class="small" href="wizard.html" style="color:var(--accent);font-weight:600">Rekenen in de financiële wizard</a></div>
          <div class="sb-sub"><b>Convenant B: zorg en ouderschapsplan</b><span class="small muted">Rooster, wisselmoment, feestdagen, school en opvoeding.</span>${sel("convB", cfg.convB)}<a class="small" href="#afspraken" style="color:var(--accent);font-weight:600">Naar onze afspraken</a></div>`;
        if (i === 3) extra = `<div class="sb-sub">${ONTVLECHT.map((t, j) => `<label class="sb-check"><input type="checkbox" data-a="ontv" data-i="${j}" ${cfg.ontvlecht[j] ? "checked" : ""}><span class="small">${t}</span></label>`).join("")}</div>`;
        return `<div class="sb-ph ${cls} ${ph.opt ? "opt" : ""}"><div class="rail"><span class="dot">${i < p ? IC.check.replace(/22/g, "15") : i + 1}</span>${last ? "" : `<span class="line"></span>`}</div>
          <div class="body"><div class="sb-row"><b>${ph.t}</b>${i === p ? `<span class="sb-now" style="margin:0">NU</span>` : i !== p ? `<button type="button" class="sb-linkbtn small" data-a="phase" data-i="${i}">Hier zijn we nu</button>` : ""}${ph.opt ? `<span class="small muted">optioneel</span>` : ""}</div>
          <p class="small muted">${ph.d}</p>${PHASE_KID[i] ? `<p class="small" style="color:var(--fg-3)">Kind ziet: ${PHASE_KID[i]}</p>` : ""}${extra}</div></div>`; }).join("")}</div></div>`;
  }

  // ---------- ouder: acties ----------
  async function parentClick(e) {
    const b = e.target.closest("[data-a]"); if (!b || b.tagName === "INPUT" && b.type === "text" || b.tagName === "SELECT") return;
    const a = b.dataset.a, i = Number(b.dataset.i);
    if (a === "rooster") { const v = cfg.rooster[i]; cfg.rooster[i] = v === "" ? "p" : v === "p" ? "m" : ""; saveCfg(); renderKinderen(); }
    else if (a === "addkid") { const n = $("kidNaam").value.trim().slice(0, 40), l = Number($("kidLeeftijd").value);
      if (!n || !(l >= 2 && l <= 18)) { $("kidMsg").textContent = "Vul een voornaam en een leeftijd tussen 2 en 18 in."; return; }
      cfg.kids.push({ naam: n, leeftijd: l }); saveCfg(); renderKinderen(); }
    else if (a === "delkid") { cfg.kids.splice(i, 1); saveCfg(); renderKinderen(); }
    else if (a === "preview") { preview = kidCfg(cfg.kids[i]); kidTab = "vandaag"; renderKid(); window.scrollTo(0, 0); }
    else if (a === "link") { const k = cfg.kids[i], url = kidLink(k);
      let msg = "";
      if (navigator.share) { try { await navigator.share({ title: `Scheidingsbuddy voor ${k.naam}`, url }); msg = "Link gedeeld."; } catch (er) { if (er?.name !== "AbortError") msg = ""; } }
      if (!msg) { try { await navigator.clipboard.writeText(url); msg = "Link gekopieerd. Open hem op het toestel van je kind."; } catch { msg = url; } }
      $("kidMsg").textContent = msg; }
    else if (a === "savetext") {
      cfg.blijft = $("blijftTxt").value.split("\n").map(s => s.trim()).filter(Boolean).slice(0, 12);
      cfg.verandert = $("verandertTxt").value.split("\n").map(s => s.trim()).filter(Boolean).slice(0, 10).map(s => { const j = s.indexOf(":"); return j > 0 ? { t: s.slice(0, j).trim(), d: s.slice(j + 1).trim() } : { t: s, d: "" }; });
      saveCfg(); $("textMsg").textContent = "Opgeslagen."; }
    else if (a === "afsv") { const w = b.dataset.w; cfg.afspraken[i][w] = !cfg.afspraken[i][w]; saveCfg(); renderAfspraken(); }
    else if (a === "afsdel") { cfg.afspraken.splice(i, 1); saveCfg(); renderAfspraken(); }
    else if (a === "afsadd") { cfg.afspraken.push({ id: "a" + Date.now(), t: "Nieuwe afspraak", v: false, m: false, k: "" }); saveCfg(); renderAfspraken(); }
    else if (a === "phase") { cfg.phase = i; saveCfg(); renderRoute(); }
  }
  function parentChange(e) {
    const t = e.target, a = t.dataset?.a, i = Number(t.dataset?.i);
    if (t.id === "rstart" && t.value) { cfg.rstart = iso(monday(fromIso(t.value))); saveCfg(); renderKinderen(); }
    else if (a === "afst") { cfg.afspraken[i].t = t.value.trim() || cfg.afspraken[i].t; saveCfg(); }
    else if (a === "afsk") { cfg.afspraken[i].k = t.value.trim(); saveCfg(); renderAfspraken(); }
    else if (a === "conv") { cfg[t.dataset.w] = t.value; saveCfg(); }
    else if (a === "ontv") { cfg.ontvlecht[i] = t.checked; saveCfg(); }
  }
  ["view-kinderen", "view-afspraken", "view-route"].forEach(id => { const el = $(id); if (el) { el.addEventListener("click", parentClick); el.addEventListener("change", parentChange); } });

  // Band op het overzicht: waar staan we op de route.
  function band() {
    const ov = $("view-overzicht"); if (!ov) return;
    let b = $("routeBand");
    if (!b) { b = document.createElement("a"); b.id = "routeBand"; b.className = "sb-band"; b.href = "#route"; const fb = $("focusBand"); fb ? fb.after(b) : ov.prepend(b); }
    b.innerHTML = `${IC.path}<span class="t"><small>Onze route · fase ${cfg.phase + 1} van 7</small><b>${PHASES[cfg.phase].t}</b></span>${IC.chev}`;
  }

  function apply() {
    if (!persona) { openEntry(); return; }
    if (persona.role === "kind") { renderKid(); return; }
    if (!preview) leaveKid();
  }

  window.SBKids = {
    views: ["kinderen", "afspraken", "route"],
    route(v) {
      if (persona?.role === "kind" || preview) return;
      if (v === "kinderen") renderKinderen();
      if (v === "afspraken") renderAfspraken();
      if (v === "route") renderRoute();
      if (v === "overzicht") band();
    },
    switchUser() { setPersona(null); preview = null; leaveKid(); openEntry(); },
  };
  window.SBPersona = () => persona;
  window.addEventListener("storage", e => { if (e.key === CKEY) cfg = { ...defCfg(), ...read(CKEY, {}) }; });
  apply();
})();
