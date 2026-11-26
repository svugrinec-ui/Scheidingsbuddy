// Inloggen met een code uit de mail (geen wachtwoord), zoals in de Rotary club-app:
// e-mailadres → code van 6 cijfers → klaar. Nieuwe gebruikers krijgen meteen een profiel.
// Praat rechtstreeks met de Supabase Auth- en REST-API; geen extra bibliotheek nodig.
// Alleen e-mail en naam staan op de server. Check-ins, taken en financiën blijven op dit toestel.
(() => {
  const cfg = window.SB_AUTH || {};
  const BASE = (cfg.url || "").replace(/\/+$/, "");
  const KEY = cfg.anonKey || "";
  if (!BASE || !KEY) return; // niet ingesteld: app werkt zoals voorheen

  const SESSION = "sb-sessie";
  const EN = document.documentElement.lang === "en";
  const T = {
    welcome: ["Welkom bij Scheidingsbuddy", "Welcome to Scheidingsbuddy"],
    intro: ["Log in of maak een profiel aan met je e-mailadres. Je krijgt een code per mail, geen wachtwoord nodig.", "Log in or create a profile with your email address. You'll get a code by email, no password needed."],
    email: ["E-mailadres", "Email address"],
    send: ["Stuur mij een code", "Send me a code"],
    haveCode: ["Ik heb al een code", "I already have a code"],
    sent: ["Er staat nu een mail met een code van 6 cijfers in de inbox van <b>{e}</b>.", "An email with a 6-digit code is now in the inbox of <b>{e}</b>."],
    enterCode: ["Vul de code van 6 cijfers uit je mail in.", "Enter the 6-digit code from your email."],
    code: ["Code", "Code"],
    login: ["Inloggen", "Log in"],
    noMail: ["Geen mail? Kijk ook bij ongewenste mail, of", "No email? Check your spam folder, or"],
    resend: ["stuur een nieuwe code", "send a new code"],
    otherMail: ["ander e-mailadres", "different email address"],
    busy: ["Bezig…", "Working…"],
    nameQ: ["Hoe mag de app je noemen?", "What should the app call you?"],
    nameHint: ["Alleen je voornaam is genoeg.", "Your first name is enough."],
    name: ["Naam", "Name"],
    start: ["Aan de slag", "Get started"],
    privacy: ["Je check-ins, taken en financiële gegevens blijven alleen op dit toestel. Op de server staan alleen je e-mailadres en naam.", "Your check-ins, tasks and financial data stay on this device only. The server only holds your email address and name."],
    badMail: ["Vul een geldig e-mailadres in.", "Enter a valid email address."],
    rate: ["Even geduld: je kunt over een minuut een nieuwe code vragen.", "Please wait a minute before requesting a new code."],
    sendFail: ["Versturen is niet gelukt. Probeer het zo nog eens.", "Sending failed. Please try again shortly."],
    offline: ["Je hebt internet nodig om in te loggen.", "You need an internet connection to log in."],
    short: ["Vul de code van 6 cijfers in.", "Enter the 6-digit code."],
    badCode: ["Deze code klopt niet of is verlopen. Vraag een nieuwe aan.", "This code is wrong or has expired. Request a new one."],
    profile: ["Profiel", "Profile"],
    profileSub: ["Je account en uitloggen", "Your account and log out"],
    loggedInAs: ["Ingelogd als", "Logged in as"],
    save: ["Opslaan", "Save"],
    saved: ["Opgeslagen", "Saved"],
    saveFail: ["Opslaan is niet gelukt.", "Saving failed."],
    logout: ["Uitloggen", "Log out"],
    logoutHint: ["Je gegevens op dit toestel blijven staan.", "Your data on this device stays."],
    del: ["Account verwijderen", "Delete account"],
    delSure: ["Weet je het zeker? Je profiel op de server wordt gewist. Gegevens op dit toestel blijven staan.", "Are you sure? Your profile on the server is erased. Data on this device stays."],
    delYes: ["Ja, verwijder mijn account", "Yes, delete my account"],
    cancel: ["Annuleren", "Cancel"],
    close: ["Sluiten", "Close"],
  };
  const t = (k, v = {}) => T[k][EN ? 1 : 0].replace(/\{(\w+)\}/g, (_, n) => esc(v[n]));
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // ---------- sessie ----------
  const readSession = () => { try { return JSON.parse(localStorage.getItem(SESSION)) || null; } catch { return null; } };
  const writeSession = s => { try { s ? localStorage.setItem(SESSION, JSON.stringify(s)) : localStorage.removeItem(SESSION); } catch {} };
  let session = readSession();

  async function api(path, { method = "GET", body, token, headers = {} } = {}) {
    const h = { apikey: KEY, "Content-Type": "application/json", ...headers };
    if (token) h.Authorization = `Bearer ${token}`;
    const res = await fetch(BASE + path, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
    let data = null; try { data = await res.json(); } catch {}
    return { ok: res.ok, status: res.status, data };
  }

  function keep(d) {
    session = { access_token: d.access_token, refresh_token: d.refresh_token, expires_at: d.expires_at || Math.floor(Date.now() / 1000) + (d.expires_in || 3600),
      user: { id: d.user.id, email: d.user.email }, naam: session?.naam || "" };
    writeSession(session);
  }

  // Geldig toegangstoken, zo nodig ververst. null = offline of uitgelogd.
  async function token() {
    if (!session) return null;
    if (session.expires_at * 1000 - 60_000 > Date.now()) return session.access_token;
    try {
      const r = await api("/auth/v1/token?grant_type=refresh_token", { method: "POST", body: { refresh_token: session.refresh_token } });
      if (r.ok && r.data?.access_token) { keep(r.data); return session.access_token; }
      if (r.status === 400 || r.status === 401) { session = null; writeSession(null); }
    } catch { /* offline: sessie blijft staan */ }
    return null;
  }

  async function loadProfile() {
    const tk = await token(); if (!tk) return null;
    const r = await api(`/rest/v1/profielen?id=eq.${session.user.id}&select=naam`, { token: tk });
    if (!r.ok) return null;
    session.naam = r.data?.[0]?.naam || ""; writeSession(session);
    return session.naam;
  }

  async function saveName(naam) {
    const tk = await token(); if (!tk) return false;
    const r = await api("/rest/v1/profielen", { method: "POST", token: tk, body: { id: session.user.id, naam },
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" } });
    if (r.ok) { session.naam = naam; writeSession(session); }
    return r.ok;
  }

  // ---------- stijl ----------
  const style = document.createElement("style");
  style.textContent = `
.auth-gate { position: fixed; inset: 0; z-index: 100; background: var(--bg); overflow-y: auto; display: grid; place-items: center;
  padding: calc(24px + env(safe-area-inset-top, 0px)) 16px calc(24px + env(safe-area-inset-bottom, 0px)); }
.auth-gate.sheetlike { background: rgba(0,0,0,.35); }
.auth-card { width: min(440px, 100%); display: grid; gap: 14px; }
.auth-card .logo { width: 76px; height: 76px; border-radius: 20px; justify-self: center; }
.auth-card h2 { font-family: var(--font-display); text-align: center; margin: 0; }
.auth-card input[type=email], .auth-card input[type=text] { font: inherit; font-size: 16px; color: var(--fg); background: var(--surface); border: 1px solid var(--line); border-radius: 10px; padding: 11px 12px; width: 100%; box-sizing: border-box; }
.auth-card input.code { font-size: 26px; letter-spacing: 8px; text-align: center; }
.auth-card .btn { width: 100%; }
.auth-card .err { color: var(--warn); background: var(--warn-soft); }
.auth-card .linkbtn { background: none; border: 0; padding: 0; font: inherit; color: var(--accent); text-decoration: underline; cursor: pointer; }
.auth-card .center { text-align: center; }
.auth-card .row { display: flex; gap: 10px; flex-wrap: wrap; }
.auth-card .row .btn { width: auto; flex: 1; }
.auth-card .danger { color: var(--warn); }`;
  document.head.appendChild(style);

  // ---------- inlogscherm ----------
  let gate = null;
  function openGate() {
    if (gate) return;
    gate = document.createElement("div");
    gate.className = "auth-gate"; gate.setAttribute("role", "dialog"); gate.setAttribute("aria-modal", "true");
    document.body.appendChild(gate); document.body.style.overflow = "hidden";
    stepEmail();
  }
  function closeGate() { gate?.remove(); gate = null; document.body.style.overflow = ""; }

  const state = { email: "" };
  const card = html => { gate.innerHTML = `<form class="auth-card panel" novalidate>${html}</form>`; return gate.querySelector("form"); };
  const showErr = (f, msg) => { const n = f.querySelector(".notice"); n.textContent = msg; n.hidden = !msg; };
  const busy = (f, on, label) => { const b = f.querySelector("button[type=submit]"); b.disabled = on; b.textContent = on ? t("busy") : label; };

  async function requestCode() {
    if (!navigator.onLine) return t("offline");
    try {
      const r = await api("/auth/v1/otp", { method: "POST", body: { email: state.email, create_user: true } });
      if (r.ok) return "";
      return r.status === 429 || /rate|seconds/i.test(r.data?.msg || r.data?.message || "") ? t("rate") : t("sendFail");
    } catch { return t("offline"); }
  }

  function stepEmail() {
    const f = card(`
      <img class="logo" src="icon-192.png" alt="">
      <h2>${t("welcome")}</h2>
      <p class="small muted center" style="margin:0">${t("intro")}</p>
      <div class="notice err" hidden></div>
      <div class="field"><label for="authEmail">${t("email")}</label>
        <input id="authEmail" type="email" autocomplete="email" inputmode="email" value="${esc(state.email)}" required></div>
      <button class="btn" type="submit">${t("send")}</button>
      <p class="small center" style="margin:0"><button type="button" class="linkbtn" id="authHave">${t("haveCode")}</button></p>
      <p class="small muted center" style="margin:0">${t("privacy")}</p>`);
    const inp = f.querySelector("#authEmail");
    const valid = () => { state.email = inp.value.trim().toLowerCase(); return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email); };
    f.addEventListener("submit", async e => {
      e.preventDefault();
      if (!valid()) return showErr(f, t("badMail"));
      busy(f, true); const err = await requestCode(); busy(f, false, t("send"));
      if (err) return showErr(f, err);
      stepCode(true);
    });
    f.querySelector("#authHave").addEventListener("click", () => { if (!valid()) return showErr(f, t("badMail")); stepCode(false); });
    setTimeout(() => inp.focus(), 50);
  }

  function stepCode(justSent) {
    const f = card(`
      <h2>${t("code")}</h2>
      <p class="small center" style="margin:0">${justSent ? t("sent", { e: state.email }) : t("enterCode")}</p>
      <div class="notice err" hidden></div>
      <input id="authCode" class="code" type="text" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9 ]*" maxlength="10" aria-label="${t("code")}">
      <button class="btn" type="submit">${t("login")}</button>
      <p class="small muted center" style="margin:0">${t("noMail")} <button type="button" class="linkbtn" id="authResend">${t("resend")}</button> · <button type="button" class="linkbtn" id="authOther">${t("otherMail")}</button></p>`);
    const inp = f.querySelector("#authCode");
    f.addEventListener("submit", async e => {
      e.preventDefault();
      const code = inp.value.replace(/\D/g, "");
      if (code.length < 6) return showErr(f, t("short"));
      if (!navigator.onLine) return showErr(f, t("offline"));
      busy(f, true);
      let r; try { r = await api("/auth/v1/verify", { method: "POST", body: { type: "email", email: state.email, token: code } }); } catch { r = null; }
      if (!r) { busy(f, false, t("login")); return showErr(f, t("offline")); }
      if (!r.ok || !r.data?.access_token) { busy(f, false, t("login")); return showErr(f, t("badCode")); }
      keep(r.data);
      const naam = await loadProfile().catch(() => null);
      if (naam) { closeGate(); addSheetEntry(); } else stepName();
    });
    f.querySelector("#authResend").addEventListener("click", async () => { showErr(f, ""); const err = await requestCode(); showErr(f, err); if (!err) stepCode(true); });
    f.querySelector("#authOther").addEventListener("click", stepEmail);
    setTimeout(() => inp.focus(), 50);
  }

  function stepName() {
    const f = card(`
      <h2>${t("nameQ")}</h2>
      <p class="small muted center" style="margin:0">${t("nameHint")}</p>
      <div class="notice err" hidden></div>
      <input id="authName" type="text" autocomplete="given-name" maxlength="80" aria-label="${t("name")}">
      <button class="btn" type="submit">${t("start")}</button>`);
    const inp = f.querySelector("#authName");
    f.addEventListener("submit", async e => {
      e.preventDefault();
      const naam = inp.value.trim().slice(0, 80);
      if (!naam) return inp.focus();
      busy(f, true); const ok = await saveName(naam).catch(() => false); busy(f, false, t("start"));
      if (!ok) return showErr(f, t("saveFail"));
      closeGate(); addSheetEntry();
    });
    setTimeout(() => inp.focus(), 50);
  }

  // ---------- profiel (via Meer) ----------
  function openProfile() {
    document.getElementById("moreBg")?.click();
    openGate(); gate.classList.add("sheetlike");
    const f = card(`
      <h2>${t("profile")}</h2>
      <p class="small muted center" style="margin:0">${t("loggedInAs")} <b>${esc(session?.user?.email)}</b></p>
      <div class="notice" hidden></div>
      <div class="field"><label for="profName">${t("name")}</label><input id="profName" type="text" maxlength="80" value="${esc(session?.naam)}"></div>
      <button class="btn" type="submit">${t("save")}</button>
      <div class="row"><button type="button" class="btn ghost" id="profOut">${t("logout")}</button><button type="button" class="btn ghost" id="profClose">${t("close")}</button></div>
      <p class="small muted center" style="margin:0">${t("logoutHint")}</p>
      <p class="small center" style="margin:0" id="profDelWrap"><button type="button" class="linkbtn danger" id="profDel">${t("del")}</button></p>`);
    gate.addEventListener("click", e => { if (e.target === gate) closeGate(); });
    f.addEventListener("submit", async e => {
      e.preventDefault();
      const naam = f.querySelector("#profName").value.trim().slice(0, 80); if (!naam) return;
      busy(f, true); const ok = await saveName(naam).catch(() => false); busy(f, false, t("save"));
      showErr(f, ok ? t("saved") : t("saveFail"));
    });
    f.querySelector("#profClose").addEventListener("click", closeGate);
    f.querySelector("#profOut").addEventListener("click", logout);
    f.querySelector("#profDel").addEventListener("click", () => {
      const w = f.querySelector("#profDelWrap");
      w.innerHTML = `<span class="small">${t("delSure")}</span><br><span class="row" style="margin-top:8px;display:flex"><button type="button" class="btn ghost danger" id="delYes">${t("delYes")}</button><button type="button" class="btn ghost" id="delNo">${t("cancel")}</button></span>`;
      w.querySelector("#delNo").addEventListener("click", openProfile.bind(null));
      w.querySelector("#delYes").addEventListener("click", async () => {
        const tk = await token();
        const r = tk ? await api("/rest/v1/rpc/verwijder_mijn_account", { method: "POST", token: tk, body: {} }).catch(() => null) : null;
        if (!r?.ok) return showErr(f, t("saveFail"));
        session = null; writeSession(null); closeGate(); removeSheetEntry(); openGate();
      });
    });
  }

  async function logout() {
    const tk = session?.access_token;
    session = null; writeSession(null);
    if (tk) api("/auth/v1/logout?scope=local", { method: "POST", token: tk }).catch(() => {});
    closeGate(); removeSheetEntry(); openGate();
  }

  function addSheetEntry() {
    const sheet = document.getElementById("moreSheet");
    if (!sheet || document.getElementById("profileEntry")) return;
    const b = document.createElement("button");
    b.type = "button"; b.id = "profileEntry";
    b.innerHTML = `<span class="ico"><svg viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></g></svg></span><span><b>${t("profile")}</b><small>${t("profileSub")}</small></span><span class="go">›</span>`;
    b.addEventListener("click", openProfile);
    sheet.appendChild(b);
  }
  const removeSheetEntry = () => document.getElementById("profileEntry")?.remove();

  // ---------- start ----------
  const start = () => {
    // Eerst kiezen wie de app gebruikt; een kind logt niet in.
    const who = window.SBPersona?.();
    if (window.SBPersona && !who) { window.addEventListener("sb-persona", start, { once: true }); return; }
    if (who?.role === "kind") return;
    if (!session) return openGate();
    addSheetEntry();
    // Op de achtergrond verversen; is de sessie ongeldig geworden, dan opnieuw inloggen.
    token().then(tk => { if (!session) openGate(); else if (tk && !session.naam) loadProfile().then(n => { if (n === "") { openGate(); stepName(); } }); });
  };
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", start) : start();
})();
