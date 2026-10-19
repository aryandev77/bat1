const app = document.getElementById("app");
let me = null, timer = null;

const h = (tag, attrs = {}, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") e.className = v;
    else if (k.startsWith("on")) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v);
  }
  e.append(...kids.filter((x) => x !== null && x !== undefined && x !== false));
  return e;
};
async function api(path, method = "GET", body) {
  const r = await fetch("/api/" + path, { method, headers: { "content-type": "application/json", "x-bat": "1" }, body: body ? JSON.stringify(body) : undefined });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || "Something went wrong.");
  return d;
}

const ICON = {
  back: '<path d="M15 5l-7 7 7 7"/>', chev: '<path d="M9 5l7 7-7 7"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/>',
  clip: '<path d="M20 11l-8 8a5 5 0 01-7-7l9-9a3.5 3.5 0 015 5l-9 9a2 2 0 01-3-3l8-8"/>',
  send: '<path d="M4 12l16-8-6 16-3-7z"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0014 0M12 18v3"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
  bell: '<path d="M6 16v-5a6 6 0 0112 0v5l2 2H4z"/><path d="M10 21h4"/>',
  moon: '<path d="M20 14A8 8 0 0110 4a8 8 0 1010 10z"/>',
  box: '<path d="M4 7l8-4 8 4v10l-8 4-8-4z"/><path d="M4 7l8 4 8-4M12 11v10"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 015 0c0 2-2.5 2-2.5 4M12 17h.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',
  doc: '<path d="M6 3h9l3 3v15H6z"/><path d="M9 11h6M9 15h6"/>',
};
const icon = (n) => {
  const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("class", "ic"); s.innerHTML = ICON[n];
  return s;
};
const WING = "M100 12 L96 2 L92 14 L80 12 L58 16 L8 8 L36 34 L50 46 L64 40 L80 54 L100 84Z";
const logo = () => {
  const d = h("div");
  d.innerHTML = `<svg viewBox="0 0 200 90" fill="currentColor" aria-hidden="true" style="display:block;width:100%;height:auto"><path d="${WING}"/><path transform="translate(200 0) scale(-1 1)" d="${WING}"/></svg>`;
  return d;
};

const time = (t) => new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const stamp = (t) => (new Date(t).toDateString() === new Date().toDateString() ? time(t) : new Date(t).toLocaleDateString([], { day: "numeric", month: "short" }));
const size = (n) => (n < 1e6 ? Math.max(1, Math.round(n / 1e3)) + " KB" : (n / 1e6).toFixed(1) + " MB");
const ini = (name) => h("span", { class: "av" }, (name || "?")[0].toUpperCase());
const view = (...n) => { clearInterval(timer); app.replaceChildren(...n); };
const bar = (...kids) => h("header", { class: "bar" }, ...kids);
const main = (...kids) => h("main", { class: "body" }, ...kids);
const back = (href) => h("a", { class: "ibtn", href, "aria-label": "Back" }, icon("back"));
const nav = (on) => h("nav", { class: "nav" }, ...[["chat", "Chats", "#/"], ["search", "Search", "#/search"], ["gear", "Settings", "#/settings"]]
  .map(([i, t, href]) => h("a", { href, class: on === href ? "on" : "" }, icon(i), h("span", {}, t))));
const field = (ic, ph, type = "text", ac = "off") => {
  const i = h("input", { placeholder: ph, "aria-label": ph, type, autocomplete: ac, autocapitalize: "none", spellcheck: "false" });
  const w = h("div", { class: "field" }, icon(ic), i);
  if (type === "password") {
    const e = h("button", { type: "button", class: "ibtn", "aria-label": "Show password" }, icon("eye"));
    e.onclick = () => { i.type = i.type === "password" ? "text" : "password"; };
    w.append(e);
  }
  return { w, i };
};

function splash() {
  if (sessionStorage.getItem("bat.s")) return;
  sessionStorage.setItem("bat.s", "1");
  const s = h("div");
  s.style.cssText = "position:fixed;inset:0;z-index:99;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1.4rem;color:#ececec;transition:opacity .5s";
  const l = logo(); l.style.width = "min(50vw,220px)";
  const w = h("div", {}, "BAT");
  w.style.cssText = "font:700 1.8rem system-ui,sans-serif;letter-spacing:.6em;margin-right:-.6em";
  s.append(l, w); document.body.append(s);
  const done = () => { s.style.opacity = "0"; setTimeout(() => s.remove(), 550); };
  s.onclick = done; setTimeout(done, 1800);
}

function authView(mode = "login") {
  const err = h("p", { class: "err" });
  const u = field("user", "Username", "text", "username");
  const p = field("lock", mode === "forgot" ? "New password" : "Password", "password", mode === "login" ? "current-password" : "new-password");
  const p2 = field("lock", "Confirm password", "password", "new-password");
  const code = field("lock", "4-digit recovery code"); code.i.inputMode = "numeric"; code.i.maxLength = 4;
  const fields = { login: [u, p], register: [u, p, p2], forgot: [u, code, p] }[mode];
  const link = (t, m) => h("button", { type: "button", class: "link", onclick: () => authView(m) }, t);
  const form = h("form", {}, ...fields.map((f) => f.w), err, h("button", { class: "btn" }, { login: "Log In", register: "Register", forgot: "Reset password" }[mode]));
  form.onsubmit = async (e) => {
    e.preventDefault(); err.textContent = "";
    try {
      if (mode === "register" && p.i.value !== p2.i.value) throw new Error("Passwords do not match.");
      const body = { username: u.i.value.trim(), password: p.i.value };
      if (mode === "forgot") body.code = code.i.value.trim();
      const r = await api({ login: "login", register: "signup", forgot: "reset" }[mode], "POST", body);
      me = await api("me");
      if (r.recovery) return recoveryView(r.recovery);
      location.hash = "#/"; route();
    } catch (x) { err.textContent = x.message; }
  };
  const foot = mode === "login"
    ? [h("p", { class: "mid-link" }, link("Forgot Password?", "forgot")), h("div", { class: "or" }, "or"), h("button", { class: "btn ghost", onclick: () => authView("register") }, "Create New Account")]
    : [h("p", { class: "mid-link" }, mode === "register" ? "Already have an account? " : "", link(mode === "register" ? "Log In" : "Back to log in", "login"))];
  view(main(h("div", { class: "auth" }, h("div", { class: "word big" }, "BAT"),
    mode === "login" ? null : h("h1", {}, mode === "register" ? "Create your account" : "Reset your password"), form, ...foot)));
}

function recoveryView(pin) {
  view(main(h("div", { class: "auth" }, h("div", { class: "word big" }, "BAT"), h("h1", {}, "Your recovery code"),
    h("div", { class: "pin" }, pin),
    h("p", { class: "note" }, "If you forget your password, this code gets you back in. Write it down now. It is shown only once."),
    h("button", { class: "btn", onclick: () => { location.hash = "#/"; route(); } }, "I wrote it down"))));
}

async function chatsView() {
  const list = h("div");
  const row = (c) => h("a", { class: "row", href: "#/c/" + c.cid }, ini(c.with.username),
    h("div", { class: "mid" }, h("b", {}, c.with.username), h("span", {}, c.preview || "No messages yet")),
    h("div", { class: "end" }, h("time", {}, c.preview ? stamp(c.at) : ""), c.unread ? h("i", { class: "badge" }, String(c.unread)) : null));
  const load = async () => {
    const { chats } = await api("chats");
    list.replaceChildren(...(chats.length ? chats.map(row) : [h("p", { class: "empty" }, "No chats yet. Search a username to start.")]));
  };
  view(bar(h("span", { class: "word" }, "BAT"), h("a", { class: "ibtn", href: "#/search", "aria-label": "Search" }, icon("search"))), main(list), nav("#/"));
  await load();
  timer = setInterval(() => !document.hidden && load().catch(() => {}), 8000);
}

function searchView() {
  const q = field("search", "Search username"); q.w.style.margin = ".8rem 1rem";
  const out = h("div");
  let t;
  q.i.oninput = () => {
    clearTimeout(t);
    t = setTimeout(async () => {
      const v = q.i.value.trim();
      if (v.length < 2) return out.replaceChildren();
      try {
        const { users } = await api("search?q=" + encodeURIComponent(v));
        out.replaceChildren(...(users.length ? users.map((u) => h("button", { class: "row", onclick: async () => {
          const { cid } = await api("chats", "POST", { userId: u.id }); location.hash = "#/c/" + cid;
        } }, ini(u.username), h("div", { class: "mid" }, h("b", {}, u.username), h("span", {}, u.bio || "")))) : [h("p", { class: "empty" }, "No one found.")]));
      } catch (e) { out.replaceChildren(h("p", { class: "empty" }, e.message)); }
    }, 250);
  };
  view(bar(h("b", {}, "Search")), main(q.w, out), nav("#/search"));
  q.i.focus();
}

async function shrink(f, max = 1600) {
  const b = await createImageBitmap(f), k = Math.min(1, max / Math.max(b.width, b.height));
  const c = document.createElement("canvas");
  c.width = Math.round(b.width * k); c.height = Math.round(b.height * k);
  c.getContext("2d").drawImage(b, 0, 0, c.width, c.height);
  return new Promise((r) => c.toBlob(r, "image/jpeg", 0.82));
}

async function chatView(cid) {
  const box = h("div", { class: "msgs" }), err = h("p", { class: "err" });
  const scroller = main(box, err);
  const title = h("b", {}, "…"), avatar = h("span", { class: "av" }, "?");
  const text = h("textarea", { rows: "1", placeholder: "Type a message", "aria-label": "Message" });
  const file = h("input", { type: "file", hidden: "" });
  const els = new Map();
  let last = "", otherRead = 0, rec = null;
  const toEnd = () => { scroller.scrollTop = scroller.scrollHeight; };

  const draw = (m) => {
    const mine = m.from === me.id, url = `/api/media/${cid}/${m.id}`;
    const body = m.kind === "text" ? h("p", {}, m.text)
      : m.kind === "photo" ? h("a", { href: url, target: "_blank", rel: "noopener" }, h("img", { src: url, alt: "Photo", loading: "lazy" }))
      : m.kind === "voice" ? h("audio", { controls: "", src: url, preload: "none" })
      : h("a", { class: "file", href: url, download: m.name }, icon("doc"), h("div", {}, h("b", {}, m.name), h("small", {}, size(m.size))));
    const tick = mine ? h("span", {}) : null;
    const el = h("div", { class: "msg " + (mine ? "me" : "") }, body, h("span", { class: "mt" }, time(m.at), tick));
    if (mine) {
      const del = h("button", { class: "del", hidden: "" }, "Delete");
      del.onclick = async () => {
        if (!confirm("Delete this message?")) return;
        try { await api(`chats/${cid}/delete`, "POST", { id: m.id }); el.remove(); els.delete(m.id); } catch (e) { err.textContent = e.message; }
      };
      el.append(del);
      el.onclick = (e) => { if (!e.target.closest("a,audio,button")) del.hidden = !del.hidden; };
    }
    els.set(m.id, { tick, at: m.at, el });
    return el;
  };
  async function pull() {
    const d = await api(`chats/${cid}/messages?after=${encodeURIComponent(last)}`);
    title.textContent = d.with; avatar.textContent = d.with[0].toUpperCase(); otherRead = d.otherRead;
    const near = !last || scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 160;
    const live = new Set(d.ids), first = d.ids[0] || "";
    els.forEach((v, id) => { if (id >= first && !live.has(id)) { v.el.remove(); els.delete(id); } });
    for (const m of d.messages) { box.append(draw(m)); last = m.id; }
    els.forEach(({ tick, at }) => tick && (tick.textContent = at <= otherRead ? "  ✓✓" : "  ✓"));
    if (d.messages.length && near) toEnd();
  }
  const sendText = async () => {
    const t = text.value.trim(); if (!t) return;
    text.value = ""; err.textContent = "";
    try { await api(`chats/${cid}/send`, "POST", { text: t }); await pull(); } catch (e) { err.textContent = e.message; text.value = t; }
  };
  const upload = async (blob, kind, name) => {
    err.textContent = "";
    if (blob.size > 5e6) { err.textContent = "Files can be up to 5 MB."; return; }
    try {
      const r = await fetch(`/api/chats/${cid}/upload?kind=${kind}&name=${encodeURIComponent(name)}`, { method: "POST", headers: { "x-bat": "1", "content-type": blob.type || "application/octet-stream" }, body: blob });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Upload failed.");
      await pull();
    } catch (e) { err.textContent = e.message; }
  };
  file.onchange = async () => {
    const f = file.files[0]; file.value = ""; if (!f) return;
    if (/^image\/(jpeg|png|webp)$/.test(f.type)) return upload(await shrink(f), "photo", f.name.replace(/\.\w+$/, "") + ".jpg");
    upload(f, f.type === "image/gif" ? "photo" : "file", f.name);
  };
  const mic = h("button", { class: "ibtn", "aria-label": "Voice message" }, icon("mic"));
  mic.onclick = async () => {
    if (rec) return rec.stop();
    try {
      const st = await navigator.mediaDevices.getUserMedia({ audio: true }), parts = [];
      rec = new MediaRecorder(st);
      rec.ondataavailable = (e) => parts.push(e.data);
      rec.onstop = () => {
        st.getTracks().forEach((t) => t.stop()); rec = null; mic.classList.remove("rec");
        upload(new Blob(parts, { type: (parts[0] && parts[0].type) || "audio/webm" }), "voice", "voice");
      };
      rec.start(); mic.classList.add("rec");
      setTimeout(() => rec && rec.state === "recording" && rec.stop(), 120000);
    } catch { err.textContent = "Microphone is not allowed."; }
  };
  text.onkeydown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendText(); } };

  view(bar(back("#/"), h("div", { class: "who" }, avatar, title)), scroller,
    h("div", { class: "composer" }, h("div", { class: "in" },
      h("button", { class: "ibtn", "aria-label": "Attach", onclick: () => file.click() }, icon("clip")), file, text, mic,
      h("button", { class: "ibtn", "aria-label": "Send", onclick: sendText }, icon("send")))));
  await pull();
  timer = setInterval(() => !document.hidden && pull().catch(() => {}), 3000);
}

const PAGES = {
  "privacy-security": ["Privacy & Security", ["Messages and files are stored on the BAT server so you can read them on any device you sign in from.", "They are not end-to-end encrypted. Whoever runs the server can technically read them.", "Passwords and recovery codes are stored hashed, never as plain text.", "Only the two people in a chat can open it through the app."]],
  notifications: ["Notifications", ["BAT does not send push notifications.", "New messages show up while the app is open."]],
  appearance: ["Appearance", ["BAT uses a dark theme everywhere."]],
  storage: ["Data & Storage", ["Photos, files and voice messages are saved on the server.", "Each file can be up to 5 MB.", "Deleting a message also deletes its file.", "Deleting your account deletes your chats."]],
  help: ["Help & Support", ["Forgot your password? On the login screen tap Forgot Password, then enter your username, your 4-digit recovery code and a new password.", "After 5 wrong codes the reset is locked for an hour.", "If you lost both your password and your code, the account cannot be recovered.", "For anything else, contact Aryan Pal."]],
  about: ["About BAT", ["BAT stands for Black Anonymous Telegram.", "It is a private messenger for a small circle of people: find a username, chat, and share photos, files and voice messages.", "Version 1.0"]],
  creator: ["About the creator", ["BAT was created by Aryan Pal.", "Founder and creator."]],
  policy: ["Privacy policy", ["BAT is a private app for invited people.", "What we store: your username, a hashed password, a hashed recovery code, an optional bio, your chats with their messages and files, and the time each message was sent.", "What we do not collect: email, phone number, contacts, location, ads or analytics.", "We use one session cookie to keep you signed in.", "Messages are not end-to-end encrypted, so the person running the server can technically read them.", "You can delete any of your messages, and you can delete your account in Settings, which removes your chats."]],
  terms: ["Terms", ["Use BAT respectfully.", "Do not use it for anything illegal or to harass others.", "The creator can remove accounts that break these rules.", "BAT is provided as it is, with no guarantees."]],
};
function pageView(slug) {
  const [t, ps] = PAGES[slug] || ["Not found", []];
  view(bar(back("#/settings"), h("b", {}, t), h("span")), main(h("div", { class: "page" }, ...ps.map((x) => h("p", {}, x)))));
}

async function settingsView() {
  const m = await api("me");
  const bio = h("input", { class: "bioin", placeholder: "Add a bio", "aria-label": "Bio", maxlength: "80", value: m.bio });
  bio.onchange = () => api("profile", "POST", { bio: bio.value }).catch(() => {});
  const item = (ic, t, sub, href) => h("a", { class: "item", href }, icon(ic), h("div", { class: "mid" }, h("b", {}, t), sub ? h("span", {}, sub) : null), icon("chev"));
  view(bar(h("b", {}, "Settings")), main(
    h("div", { class: "profile" }, h("span", { class: "av xl" }, m.username[0].toUpperCase()), h("h2", {}, m.username), bio),
    item("user", "Account", "Password, recovery code", "#/account"),
    item("shield", "Privacy & Security", "How your data is handled", "#/p/privacy-security"),
    item("bell", "Notifications", "Message alerts", "#/p/notifications"),
    item("moon", "Appearance", "Dark mode", "#/p/appearance"),
    item("box", "Data & Storage", "Files and media", "#/p/storage"),
    item("help", "Help & Support", "Forgot password, contact", "#/p/help"),
    item("info", "About BAT", "", "#/p/about"),
    item("user", "About the creator", "", "#/p/creator"),
    item("doc", "Privacy policy", "", "#/p/policy"),
    item("doc", "Terms", "", "#/p/terms"),
    h("div", { class: "pad" }, h("button", { class: "btn ghost", onclick: async () => { await api("logout", "POST"); me = null; route(); } }, "Log out"))),
    nav("#/settings"));
}

function accountView() {
  const msg = h("p", { class: "note" }), say = (t) => (msg.textContent = t);
  const op = field("lock", "Current password", "password"), np = field("lock", "New password", "password"), cp = field("lock", "Your password, to confirm", "password");
  const btn = (t, fn, cls = "") => h("button", { class: "btn ghost " + cls, onclick: fn }, t);
  view(bar(back("#/settings"), h("b", {}, "Account"), h("span")), main(h("div", { class: "pad" }, msg,
    h("span", { class: "cap" }, "Change password"), op.w, np.w,
    btn("Update password", async () => { try { await api("password", "POST", { old: op.i.value, new: np.i.value }); op.i.value = np.i.value = ""; say("Password changed."); } catch (e) { say(e.message); } }),
    h("span", { class: "cap" }, "Confirm with your password"), cp.w,
    btn("Get a new recovery code", async () => { try { recoveryView((await api("recovery", "POST", { password: cp.i.value })).recovery); } catch (e) { say(e.message); } }),
    btn("Delete account", async () => {
      if (!confirm("Delete your account and all your chats? This cannot be undone.")) return;
      try { await api("delete", "POST", { password: cp.i.value }); me = null; location.hash = "#/"; route(); } catch (e) { say(e.message); }
    }, "danger"))));
}

async function route() {
  try {
    if (!me) return authView("login");
    const loc = location.hash, c = /^#\/c\/([a-f0-9]+)$/.exec(loc), pg = /^#\/p\/([a-z-]+)$/.exec(loc);
    if (c) return await chatView(c[1]);
    if (pg) return pageView(pg[1]);
    if (loc === "#/search") return searchView();
    if (loc === "#/settings") return await settingsView();
    if (loc === "#/account") return accountView();
    return await chatsView();
  } catch (e) {
    if (/Sign in/.test(e.message)) { me = null; authView("login"); }
  }
}

splash();
window.addEventListener("hashchange", route);
api("me").then((u) => (me = u)).catch(() => {}).finally(route);
