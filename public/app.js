const app = document.getElementById("app");
let me = null, timer = null;
const applyTheme = () => { document.documentElement.dataset.theme = localStorage.getItem("bat.theme") || "default"; };
applyTheme();
// Add more lines about the creator here; each string becomes a paragraph on the "About the creator" page.
const CREATOR_MORE = [];

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
  pin: '<path d="M9 4h6l-1 6 3 3H7l3-3zM12 13v7"/>',
  archive: '<path d="M4 6h16v4H4zM6 10v9h12v-9M10 14h4"/>',
  check: '<path d="M5 12l5 5L20 7"/>',
  doc: '<path d="M6 3h9l3 3v15H6z"/><path d="M9 11h6M9 15h6"/>',
  note: '<path d="M5 4h14v16H5z"/><path d="M8 9h8M8 13h8M8 17h5"/>',
  book: '<path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2z"/><path d="M4 19V5"/>',
  pen: '<path d="M4 20l1-4L16 5l3 3L8 19z"/><path d="M14 7l3 3"/>',
  camera: '<rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="12" cy="13" r="3.5"/>',
};
const icon = (n) => {
  const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("class", "ic"); s.innerHTML = ICON[n];
  return s;
};
const WING = "M100 12 L96 2 L92 14 L80 12 L58 16 L8 8 L36 34 L50 46 L64 40 L80 54 L100 84Z";
const logo = () => {
  const d = h("div");
  d.innerHTML = `<svg viewBox="0 0 200 90" fill="currentColor" aria-hidden="true"><path d="${WING}"/><path transform="translate(200 0) scale(-1 1)" d="${WING}"/></svg>`;
  return d;
};

const time = (t) => new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const stamp = (t) => (new Date(t).toDateString() === new Date().toDateString() ? time(t) : new Date(t).toLocaleDateString([], { day: "numeric", month: "short" }));
const size = (n) => (n < 1e6 ? Math.max(1, Math.round(n / 1e3)) + " KB" : (n / 1e6).toFixed(1) + " MB");
const pic = (u, cls = "") => {
  const s = h("span", { class: ("av " + cls).trim() }, u && u.av ? null : ((u && (u.name || u.username)) || "?")[0].toUpperCase());
  if (u && u.av) s.append(h("img", { src: `/api/avatar/${u.id}?v=${u.av}`, alt: "" }));
  return s;
};
const view = (...n) => { clearInterval(timer); app.replaceChildren(...n); };
const bar = (...kids) => h("header", { class: "bar" }, ...kids);
const main = (...kids) => h("main", { class: "body" }, ...kids);
const back = (href) => h("a", { class: "ibtn", href, "aria-label": "Back" }, icon("back"));
const nav = (on) => h("nav", { class: "nav" }, ...[["chat", "Chats", "#/"], ["search", "Search", "#/search"], ["note", "Notes", "#/notes"], ["gear", "Settings", "#/settings"]]
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

const darkMain = (...k) => h("main", { class: "body dark" }, ...k);
const popup = (...kids) => {
  const bk = h("div", { class: "sbk", onclick: (e) => e.target === bk && bk.remove() }, h("div", { class: "sbox" }, ...kids));
  app.append(bk); return bk;
};
const sheet = (rows) => {
  const bk = popup(...rows.map(([t, fn, cls]) => h("button", { class: "sbtn " + (cls || ""), onclick: async () => { bk.remove(); try { await fn(); } catch (e) { alert(e.message); } } }, t)),
    h("button", { class: "sbtn cancel", onclick: () => bk.remove() }, "Cancel"));
  return bk;
};
const lightbox = (u) => {
  const bk = h("div", { class: "lbx", onclick: () => bk.remove() }, u.av ? h("img", { src: `/api/avatar/${u.id}?v=${u.av}`, alt: "Profile photo" }) : pic(u, "pav big"));
  app.append(bk);
};
const tapPic = (u) => { const p = pic(u, "pav"); p.onclick = () => lightbox(u); return p; };
const statusText = (st) => {
  if (!st || !st.last && !st.typing) return "";
  if (st.typing) return "typing…";
  const ms = Date.now() - st.last;
  if (ms < 75000) return "active";
  const m = Math.round(ms / 60000);
  return "active " + (m < 60 ? m + "m" : m < 1440 ? Math.round(m / 60) + "h" : Math.round(m / 1440) + "d") + " ago";
};
const menuItem = (ic, t, sub, href) => h("a", { class: "item", href }, icon(ic), h("div", { class: "mid" }, h("b", {}, t), sub ? h("span", {}, sub) : null), icon("chev"));

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
  const u = field("user", "ID (username)", "text", "username");
  const nm = field("user", "Name (optional)");
  const p = field("lock", mode === "forgot" ? "New password" : "Password", "password", mode === "login" ? "current-password" : "new-password");
  const p2 = field("lock", "Confirm password", "password", "new-password");
  const code = field("lock", "4-digit recovery code"); code.i.inputMode = "numeric"; code.i.maxLength = 4;
  const fields = { login: [u, p], register: [u, nm, p, p2], forgot: [u, code, p] }[mode];
  const link = (t, m) => h("button", { type: "button", class: "link", onclick: () => authView(m) }, t);
  const form = h("form", {}, ...fields.map((f) => f.w), err, h("button", { class: "btn pillw" }, { login: "Log In", register: "Register", forgot: "Reset password" }[mode]));
  form.onsubmit = async (e) => {
    e.preventDefault(); err.textContent = "";
    try {
      if (mode === "register" && p.i.value !== p2.i.value) throw new Error("Passwords do not match.");
      const body = { username: u.i.value.trim().replace(/^@/, ""), password: p.i.value };
      if (mode === "register") body.name = nm.i.value.trim();
      if (mode === "forgot") body.code = code.i.value.trim();
      const r = await api({ login: "login", register: "signup", forgot: "reset" }[mode], "POST", body);
      me = await api("me");
      if (r.recovery) return recoveryView(r.recovery);
      location.hash = "#/"; route();
    } catch (x) { err.textContent = x.message; }
  };
  const hero = h("div", { class: "hero" }, h("i", { class: "ray r1" }), h("i", { class: "ray r2" }), h("i", { class: "ray r3" }), h("div", { class: "tile" }, logo()));
  const foot = mode === "login"
    ? [h("p", { class: "mid-link" }, link("Create new account", "register")), h("p", { class: "mid-link" }, link("Forgot password?", "forgot"))]
    : [h("p", { class: "mid-link" }, link(mode === "register" ? "I already have an account" : "Back to log in", "login"))];
  view(darkMain(h("div", { class: "welcome" }, hero,
    h("h1", {}, { login: "Welcome to BAT", register: "Create your account", forgot: "Reset your password" }[mode]),
    h("p", { class: "sub" }, { login: "Sign in to chat with your circle", register: "Pick an ID. Friends find you by it.", forgot: "Enter your ID and your 4-digit code" }[mode]),
    h("div", { class: "wform" }, form, ...foot))));
}

function recoveryView(pin) {
  view(darkMain(h("div", { class: "auth" }, h("div", { class: "word big" }, "BAT"), h("h1", {}, "Your recovery code"),
    h("div", { class: "pin" }, pin),
    h("p", { class: "note" }, "If you forget your password, this code gets you back in. Write it down now. It is shown only once."),
    h("button", { class: "btn", onclick: () => { location.hash = "#/"; route(); } }, "I wrote it down"))));
}

async function chatsView(archived = false) {
  const list = h("div");
  const row = (c) => h("a", { class: "row", href: "#/c/" + c.cid }, pic(c.with),
    h("div", { class: "mid" }, h("b", {}, c.with.name || c.with.username), h("span", {}, c.preview || "No messages yet")),
    h("div", { class: "end" }, h("time", {}, c.preview ? stamp(c.at) : ""), c.unread ? h("i", { class: "badge" }, String(c.unread)) : c.pinned ? icon("pin") : null));
  const load = async () => {
    const { chats } = await api("chats");
    const rows = chats.filter((c) => !!c.archived === archived).map(row), arch = chats.filter((c) => c.archived);
    if (!archived && arch.length) rows.unshift(h("a", { class: "row", href: "#/archived" }, icon("archive"), h("div", { class: "mid" }, h("b", {}, "Archived"), h("span", {}, arch.length + (arch.length === 1 ? " chat" : " chats")))));
    list.replaceChildren(...(rows.length ? rows : [h("p", { class: "empty" }, archived ? "No archived chats." : "No chats yet. Search an ID to start.")]));
  };
  view(archived ? bar(back("#/"), h("b", {}, "Archived"), h("span")) : bar(h("span", { class: "word" }, "BAT"), h("a", { class: "ibtn", href: "#/search", "aria-label": "Search" }, icon("search"))), main(list), nav("#/"));
  await load();
  timer = setInterval(() => !document.hidden && load().catch(() => {}), 8000);
}

function searchView() {
  const q = field("search", "Search by ID (username)"); q.w.style.margin = ".8rem 1rem";
  const out = h("div");
  const hist = () => { try { return JSON.parse(localStorage.getItem("bat.hist") || "[]"); } catch { return []; } };
  const remember = (u) => localStorage.setItem("bat.hist", JSON.stringify([u, ...hist().filter((x) => x.id !== u.id)].slice(0, 10)));
  const open = async (u) => {
    remember({ id: u.id, username: u.username, name: u.name, av: u.av });
    const { cid } = await api("chats", "POST", { userId: u.id }); location.hash = "#/c/" + cid;
  };
  const urow = (u) => h("button", { class: "row", onclick: () => open(u).catch((e) => alert(e.message)) }, pic(u),
    h("div", { class: "mid" }, h("b", {}, u.name), h("span", {}, "@" + u.username + (u.bio ? "  ·  " + u.bio : ""))));
  const showHist = () => {
    const hs = hist();
    out.replaceChildren(...(hs.length ? [h("div", { class: "histhead" }, h("span", {}, "Recent searches"), h("button", { class: "link", onclick: () => { localStorage.removeItem("bat.hist"); showHist(); } }, "Clear")), ...hs.map(urow)]
      : [h("p", { class: "empty" }, "Search by someone's ID.")]));
  };
  let t;
  q.i.oninput = () => {
    clearTimeout(t);
    t = setTimeout(async () => {
      const v = q.i.value.trim().replace(/^@/, "");
      if (v.length < 2) return showHist();
      try {
        const { users } = await api("search?q=" + encodeURIComponent(v));
        out.replaceChildren(...(users.length ? users.map(urow) : [h("p", { class: "empty" }, "No one found.")]));
      } catch (e) { out.replaceChildren(h("p", { class: "empty" }, e.message)); }
    }, 250);
  };
  view(bar(h("b", {}, "Search")), main(q.w, out), nav("#/search"));
  showHist(); q.i.focus();
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
  const title = h("b", {}, "…"), sub = h("small", {}), avatar = h("span", { class: "av" }, "?");
  const text = h("textarea", { rows: "1", placeholder: "Type a message", "aria-label": "Message" });
  const file = h("input", { type: "file", hidden: "" });
  const banner = h("div", { class: "blockbar", hidden: "" }, h("span", {}, "You blocked this person."),
    h("button", { class: "link", onclick: async () => { await api(`chats/${cid}/block`, "POST", { blocked: false }); pull(); } }, "Unblock"));
  const els = new Map(), meta = { flags: {}, blocked: null, peer: null };
  let last = "", otherRead = 0, rec = null, lastTyping = 0;
  const toEnd = () => { scroller.scrollTop = scroller.scrollHeight; };

  const editPop = (m, ent) => {
    const ta = h("textarea", { class: "editta", "aria-label": "Edit message" }); ta.value = ent.text;
    const bk = popup(h("p", { class: "mute" }, "Edit message"), ta, h("div", { class: "row2" },
      h("button", { class: "sbtn", onclick: () => bk.remove() }, "Cancel"),
      h("button", { class: "sbtn primary", onclick: async () => {
        const t = ta.value.trim(); if (!t) return;
        try { await api(`chats/${cid}/edit`, "POST", { id: m.id, text: t }); ent.text = t; ent.p.replaceChildren(...linkify(t)); ent.ed.textContent = "edited · "; bk.remove(); }
        catch (e) { alert(e.message); }
      } }, "Save")));
    ta.focus();
  };
  const msgMenu = (m, ent) => {
    const mine = m.from === me.id, rows = [];
    if (m.kind === "text") rows.push(["Copy", () => navigator.clipboard.writeText(ent.text)]);
    if (mine && m.kind === "text") rows.push(["Edit", () => editPop(m, ent)]);
    if (mine) rows.push(["Delete", async () => {
      if (!confirm("Delete this message?")) return;
      await api(`chats/${cid}/delete`, "POST", { id: m.id }); ent.el.remove(); els.delete(m.id);
    }, "danger"]);
    if (rows.length) sheet(rows);
  };
  const draw = (m) => {
    const mine = m.from === me.id, url = `/api/media/${cid}/${m.id}`;
    const p = m.kind === "text" ? h("p", {}, ...linkify(m.text)) : null;
    const body = p || (m.kind === "photo" ? h("a", { href: url, target: "_blank", rel: "noopener" }, h("img", { src: url, alt: "Photo", loading: "lazy" }))
      : m.kind === "voice" ? h("audio", { controls: "", src: url, preload: "none" })
      : h("a", { class: "file", href: url, download: m.name }, icon("doc"), h("div", {}, h("b", {}, m.name), h("small", {}, size(m.size)))));
    const ent = { at: m.at, text: m.text || "", editedAt: 0, p, ed: h("span", {}, m.edited ? "edited · " : ""), tick: mine ? h("span", {}) : null };
    ent.el = h("div", { class: "msg " + (mine ? "me" : "") }, body, h("span", { class: "mt" }, ent.ed, time(m.at), ent.tick));
    ent.el.onclick = (e) => { if (!e.target.closest("a,audio,button")) msgMenu(m, ent); };
    els.set(m.id, ent);
    return ent.el;
  };
  async function pull() {
    const d = await api(`chats/${cid}/messages?after=${encodeURIComponent(last)}`);
    title.textContent = d.with; otherRead = d.otherRead; sub.textContent = statusText(d.status);
    Object.assign(meta, { flags: d.flags, blocked: d.blocked, peer: d.peer });
    if (d.peer && !avatar.dataset.p) { avatar.dataset.p = "1"; avatar.replaceChildren(...pic(d.peer).childNodes); }
    banner.hidden = d.blocked !== "me"; text.disabled = d.blocked === "me";
    const near = !last || scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 160;
    const live = new Set(d.ids), first = d.ids[0] || "";
    els.forEach((v, id) => { if (id >= first && !live.has(id)) { v.el.remove(); els.delete(id); } });
    for (const m of d.messages) { box.append(draw(m)); last = m.id; }
    for (const [id, v] of Object.entries(d.edits || {})) {
      const e = els.get(id);
      if (e && e.p && e.editedAt !== v.t && v.text !== e.text) { e.editedAt = v.t; e.text = v.text; e.p.replaceChildren(...linkify(v.text)); e.ed.textContent = "edited · "; }
    }
    els.forEach((e) => e.tick && (e.tick.textContent = e.at <= otherRead ? "  ✓✓" : "  ✓"));
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
  text.oninput = () => {
    const now = Date.now();
    if (text.value && now - lastTyping > 2500) { lastTyping = now; api(`chats/${cid}/typing`, "POST", {}).catch(() => {}); }
  };
  const chatMenu = () => {
    const f = meta.flags || {}, blockedByMe = meta.blocked === "me";
    sheet([
      ...(meta.peer ? [["View profile", () => { location.hash = "#/u/" + meta.peer.id; }]] : []),
      [f.pinned ? "Unpin chat" : "Pin chat", async () => { await api(`chats/${cid}/flags`, "POST", { pinned: !f.pinned }); await pull(); }],
      [f.archived ? "Unarchive chat" : "Archive chat", async () => { await api(`chats/${cid}/flags`, "POST", { archived: !f.archived }); if (!f.archived) location.hash = "#/"; else await pull(); }],
      [blockedByMe ? "Unblock" : "Block", async () => {
        if (!blockedByMe && !confirm("Block this person? They will not be able to message you.")) return;
        await api(`chats/${cid}/block`, "POST", { blocked: !blockedByMe }); await pull();
      }, blockedByMe ? "" : "danger"],
    ]);
  };
  const avBtn = h("button", { class: "hav", "aria-label": "Open profile", onclick: () => { if (meta.peer) location.hash = "#/u/" + meta.peer.id; } }, avatar);
  view(bar(back("#/"), h("div", { class: "who", onclick: chatMenu }, title, sub), avBtn), scroller, banner,
    h("div", { class: "composer" }, h("div", { class: "in" },
      h("button", { class: "ibtn", "aria-label": "Attach", onclick: () => file.click() }, icon("clip")), file, text, mic,
      h("button", { class: "ibtn", "aria-label": "Send", onclick: sendText }, icon("send")))));
  await pull();
  timer = setInterval(() => !document.hidden && pull().catch(() => {}), 3000);
}

const URL_RE = /((?:https?:\/\/|www\.)[^\s<]*[^\s<.,;:!?)\]'"])/gi;
function linkify(text) {
  const out = []; let last = 0;
  for (const m of text.matchAll(URL_RE)) {
    out.push(text.slice(last, m.index));
    out.push(h("a", { class: "lnk", href: m[0].startsWith("www.") ? "https://" + m[0] : m[0], target: "_blank", rel: "noopener noreferrer" }, m[0]));
    last = m.index + m[0].length;
  }
  out.push(text.slice(last));
  return out.filter((x) => x !== "");
}
async function shrinkSquare(f, px = 320) {
  const b = await createImageBitmap(f), s = Math.min(b.width, b.height);
  const c = document.createElement("canvas"); c.width = c.height = px;
  c.getContext("2d").drawImage(b, (b.width - s) / 2, (b.height - s) / 2, s, s, 0, 0, px, px);
  return new Promise((r) => c.toBlob(r, "image/jpeg", 0.85));
}

async function profileView(id) {
  const u = await api("user/" + id), own = u.id === me.id;
  const btn = h("button", { class: "pbtn", onclick: own ? () => { location.hash = "#/edit"; } : async () => {
    const { cid } = await api("chats", "POST", { userId: u.id }); location.hash = "#/c/" + cid;
  } }, own ? "Edit profile" : "Message");
  view(bar(back(own ? "#/settings" : "#/search"), h("b", {}, "Profile"), h("span")),
    main(h("div", { class: "pwrap" }, h("div", { class: "pcard" }, h("div", { class: "pcover" }, logo()),
      h("div", { class: "pmain" }, h("div", { class: "prow" }, tapPic(u), btn),
        h("h2", { class: "pname" }, u.name), h("p", { class: "phandle" }, "@" + u.username),
        u.bio ? h("p", { class: "pbio" }, u.bio) : null,
        h("div", { class: "pstats" }, h("b", {}, "Joined"), h("span", {}, new Date(u.at).toLocaleDateString([], { month: "short", year: "numeric" }))))))),
    nav(own ? "#/settings" : "#/search"));
}

async function editView() {
  const m = await api("me");
  const msg = h("p", { class: "note" }), say = (t) => (msg.textContent = t);
  const holder = h("div", { class: "editpic" }), paint = () => holder.replaceChildren(pic(m, "xl"));
  paint();
  const file = h("input", { type: "file", accept: "image/*", hidden: "" });
  file.onchange = async () => {
    const f = file.files[0]; file.value = ""; if (!f) return;
    try {
      const r = await fetch("/api/avatar", { method: "POST", headers: { "x-bat": "1", "content-type": "image/jpeg" }, body: await shrinkSquare(f) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Upload failed.");
      m.av = d.av; paint(); say("Photo updated.");
    } catch (e) { say(e.message); }
  };
  const nm = field("user", "Name"), bio = field("info", "Bio"), un = field("user", "ID (username)");
  nm.i.value = m.name; nm.i.maxLength = 30; bio.i.value = m.bio; bio.i.maxLength = 80; un.i.value = m.username; un.i.maxLength = 20;
  const next = (m.unameAt || 0) + 17 * 864e5, locked = next > Date.now();
  un.i.disabled = locked;
  const act = (fn, ok) => async () => { try { await fn(); say(ok); } catch (e) { say(e.message); } };
  view(bar(back("#/settings"), h("b", {}, "Edit profile"), h("span")), main(h("div", { class: "auth" },
    holder, h("button", { class: "btn ghost", onclick: () => file.click() }, "Change photo"), file,
    m.av ? h("p", { class: "mid-link" }, h("button", { class: "link", onclick: act(async () => { await api("avatar/remove", "POST", {}); m.av = 0; paint(); }, "Photo removed.") }, "Remove photo")) : null,
    msg, nm.w, bio.w,
    h("button", { class: "btn", onclick: act(() => api("profile", "POST", { name: nm.i.value, bio: bio.i.value }), "Saved.") }, "Save"),
    h("span", { class: "cap" }, "Your ID"), un.w,
    h("p", { class: "note" }, locked ? "You can change your ID again on " + new Date(next).toLocaleDateString([], { day: "numeric", month: "long" }) + "." : "You can change your ID once every 17 days. Friends find you by it."),
    h("button", { class: "btn ghost", ...(locked ? { disabled: "" } : {}), onclick: async () => {
      if (!confirm("Change your ID to @" + un.i.value.trim().replace(/^@/, "") + "? You can't change it again for 17 days.")) return;
      try { const r = await api("username", "POST", { username: un.i.value }); me.username = r.username; await editView(); } catch (e) { say(e.message); }
    } }, "Change ID"))));
}

const fmtDate = (t) => new Date(t).toLocaleDateString([], { weekday: "long", day: "numeric", month: "long", year: "numeric" });
let notesCache = [];
const loadNotes = async () => (notesCache = (await api("notes")).notes);
const notesMain = (...k) => h("main", { class: "body notes dark" }, ...k);

async function notesView() {
  await loadNotes();
  const emb = logo(); emb.className = "embossed";
  const cover = h("div", { class: "cover" }, h("h3", {}, "Notes"), h("small", {}, "written by " + (me.name || me.username)), emb);
  const seg = (ic, t, fn) => h("button", { onclick: fn }, icon(ic), h("span", {}, t));
  view(h("header", { class: "nbar" }, h("span", { class: "ndate" }, fmtDate(Date.now()))),
    notesMain(h("h2", { class: "serif" }, "Here, your notes come to life"), cover,
      h("p", { class: "ncap" }, notesCache.length ? `${notesCache.length} saved. Write a note, or keep a link for later.` : "Write a note, or keep a link for later.")),
    h("div", { class: "pillwrap" }, h("div", { class: "pill2" },
      seg("book", "Browse", () => { location.hash = notesCache.length ? "#/notes/browse/0" : "#/n/new"; }),
      seg("pen", "Write", () => { location.hash = "#/n/new"; }))),
    nav("#/notes"));
}

async function browseView(i) {
  if (!notesCache.length) await loadNotes();
  const n = notesCache[i];
  if (!n) { location.hash = "#/notes"; return; }
  const go = (d) => { const j = i + d; if (j >= 0 && j < notesCache.length) location.hash = "#/notes/browse/" + j; };
  const paper = h("div", { class: "paper" }, h("div", { class: "pdate" }, fmtDate(n.created)),
    h("div", { class: "ptext" }, ...(n.text.trim() ? linkify(n.text) : ["Empty note"])),
    h("div", { class: "pfoot" }, h("span", {}, "Tap to edit"), h("span", {}, `${i + 1}/${notesCache.length}`)));
  paper.onclick = (e) => { if (!e.target.closest("a")) location.hash = "#/n/" + n.id; };
  let x0 = 0;
  paper.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  paper.addEventListener("touchend", (e) => { const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1); });
  view(h("header", { class: "nbar" }, back("#/notes"), h("span", { class: "ndate" }, "Browse your notes"), h("span")),
    notesMain(h("div", { class: "paperwrap" }, paper)),
    h("div", { class: "pillwrap" }, h("div", { class: "pill2" },
      h("button", { onclick: () => go(-1) }, icon("back"), h("span", {}, "Newer")),
      h("button", { onclick: () => go(1) }, icon("chev"), h("span", {}, "Older")))),
    nav("#/notes"));
}

async function noteEdit(id) {
  let cur = id === "new" ? "" : id;
  let note = cur ? (notesCache.find((n) => n.id === cur) || (await loadNotes()).find((n) => n.id === cur)) : null;
  if (cur && !note) { location.hash = "#/notes"; return; }
  const ta = h("textarea", { class: "ntext", placeholder: "Write something…", "aria-label": "Note" });
  ta.value = note ? note.text : "";
  const err = h("p", { class: "err" });
  let t2;
  const save = async () => {
    if (!cur && !ta.value.trim()) return;
    cur = (await api("notes", "POST", { id: cur, text: ta.value })).note.id;
  };
  ta.oninput = () => { clearTimeout(t2); t2 = setTimeout(() => save().catch((e) => (err.textContent = e.message)), 700); };
  const done = async () => { clearTimeout(t2); try { await save(); location.hash = "#/notes"; } catch (e) { err.textContent = e.message; } };
  const del = h("button", { class: "dbtn", "aria-label": "Delete note", onclick: async () => {
    if (!confirm("Delete this note?")) return;
    clearTimeout(t2); if (cur) await api("notes/delete", "POST", { id: cur }); location.hash = "#/notes";
  } }, "−");
  view(h("header", { class: "nbar" }, h("button", { class: "ibtn", "aria-label": "Done", onclick: done }, icon("back")), h("span", { class: "ndate" }, "Note"), del),
    h("main", { class: "body notes dark sheetwrap" }, h("div", { class: "sheet" }, h("div", { class: "pdate" }, fmtDate(note ? note.created : Date.now())), ta, err),
      h("button", { class: "btn donebtn", onclick: done }, "Done")));
  ta.focus();
}

const PAGES = {
  "privacy-security": ["Privacy & Security", ["Messages and files are stored on the BAT server so you can read them on any device you sign in from.", "BAT does not use end-to-end encryption. Aryan Pal runs BAT for his friends and has promised not to read anyone's chats.", "Passwords and recovery codes are stored hashed, never as plain text.", "Only the two people in a chat can open it through the app."]],
  notifications: ["Notifications", ["BAT does not send push notifications.", "New messages show up while the app is open."]],
  appearance: ["Appearance", ["BAT uses a dark theme everywhere."]],
  storage: ["Data & Storage", ["Photos, files and voice messages are saved on the server.", "Each file can be up to 5 MB.", "Deleting a message also deletes its file.", "Deleting your account deletes your chats."]],
  help: ["Help & Support", ["Forgot your password? On the login screen tap Forgot Password, then enter your username, your 4-digit recovery code and a new password.", "After 5 wrong codes the reset is locked for an hour.", "If you lost both your password and your code, the account cannot be recovered.", "For anything else, contact Aryan Pal."]],
  about: ["About BAT", ["BAT stands for Black Anonymous Telegram.", "It is a private messenger for a small circle of people: find a username, chat, and share photos, files and voice messages.", "Version 1.0"]],
  creator: ["About the creator", ["Aryan Pal is the founder and creator of BAT.", "He designed the look, chose the name and built BAT for his close friends, one version at a time. It started as a spy-style idea for passing secrets around and slowly turned into a clean, simple messenger.", ...CREATOR_MORE]],
  policy: ["Privacy policy", ["BAT is a private app for invited people.", "What we store: your username, a hashed password, a hashed recovery code, an optional bio, your chats with their messages and files, and the time each message was sent.", "What we do not collect: email, phone number, contacts, location, ads or analytics.", "We use one session cookie to keep you signed in.", "BAT does not use end-to-end encryption, and messages are stored on BAT's server. Aryan Pal, who runs BAT, has promised not to read them.", "You can delete any of your messages, and you can delete your account in Settings, which removes your chats."]],
  terms: ["Terms", ["Use BAT respectfully.", "Do not use it for anything illegal or to harass others.", "The creator can remove accounts that break these rules.", "BAT is provided as it is, with no guarantees."]],
};
function pageView(slug) {
  const [t, ps] = PAGES[slug] || ["Not found", []];
  view(bar(back("#/settings"), h("b", {}, t), h("span")), main(h("div", { class: "page" }, ...ps.map((x) => h("p", {}, x)))));
}

async function privacyView() {
  const m = await api("me");
  const box = h("input", { type: "checkbox" }); box.checked = !m.hideActive;
  box.onchange = async () => {
    try { await api("profile", "POST", { hideActive: !box.checked }); me.hideActive = !box.checked; }
    catch (e) { alert(e.message); box.checked = !box.checked; }
  };
  view(bar(back("#/settings"), h("b", {}, "Privacy & Security"), h("span")), main(
    h("label", { class: "chk" }, box, h("div", { class: "mid" }, h("b", {}, "Show when I'm active"), h("span", {}, "If you turn this off, you also won't see when others are active or typing."))),
    h("div", { class: "page" }, ...PAGES["privacy-security"][1].map((x) => h("p", {}, x)))));
}

function appearanceView() {
  const cur = () => localStorage.getItem("bat.theme") || "default";
  const list = h("div");
  const paint = () => list.replaceChildren(...[["default", "Default", "Pure black"], ["dark", "Dark", "Soft charcoal"], ["light", "Light", "Bright and clean"]]
    .map(([v, t, sb]) => h("button", { class: "row", onclick: () => { localStorage.setItem("bat.theme", v); applyTheme(); paint(); } },
      h("div", { class: "mid" }, h("b", {}, t), h("span", {}, sb)), cur() === v ? icon("check") : null)));
  paint();
  view(bar(back("#/settings"), h("b", {}, "Appearance"), h("span")), main(list));
}

function helpView() {
  view(bar(back("#/settings"), h("b", {}, "Help & feedback"), h("span")), main(
    menuItem("doc", "Privacy policy", "", "#/p/policy"), menuItem("doc", "Terms", "", "#/p/terms"),
    menuItem("help", "Help", "Forgot password, contact", "#/p/help"), menuItem("pen", "Feedback", "Tell us what to improve", "#/feedback"),
    me && me.admin ? menuItem("note", "Read feedback", "Admin only", "#/inbox") : null));
}

function feedbackView() {
  const ta = h("textarea", { class: "editta", placeholder: "What should we improve? Bugs, ideas, anything.", "aria-label": "Feedback", maxlength: "1000" });
  const msg = h("p", { class: "note" });
  view(bar(back("#/help"), h("b", {}, "Feedback"), h("span")), main(h("div", { class: "pad" }, ta, msg,
    h("button", { class: "btn", onclick: async () => {
      try { await api("feedback", "POST", { text: ta.value }); ta.value = ""; msg.textContent = "Thank you. Your feedback was sent."; } catch (e) { msg.textContent = e.message; }
    } }, "Send"))));
}

async function inboxView() {
  const { items } = await api("feedback");
  view(bar(back("#/help"), h("b", {}, "Feedback"), h("span")), main(...(items.length
    ? items.map((x) => h("div", { class: "panelrow" }, h("small", {}, "@" + x.from + " · " + stamp(x.at)), h("p", {}, x.text)))
    : [h("p", { class: "empty" }, "No feedback yet.")])));
}

async function settingsView() {
  const m = await api("me");
  const theme = { default: "Default", dark: "Dark", light: "Light" }[localStorage.getItem("bat.theme") || "default"];
  view(bar(h("b", {}, "Settings")), main(
    h("a", { class: "profile", href: "#/u/" + m.id }, pic(m, "xl"), h("h2", {}, m.name), h("span", { class: "hand" }, "@" + m.username)),
    menuItem("user", "Edit profile", "Photo, name, ID, bio", "#/edit"),
    menuItem("user", "Account", "Password, recovery code", "#/account"),
    menuItem("shield", "Privacy & Security", "Active status, how your data is handled", "#/p/privacy-security"),
    menuItem("moon", "Appearance", theme, "#/p/appearance"),
    menuItem("bell", "Notifications", "Message alerts", "#/p/notifications"),
    menuItem("box", "Data & Storage", "Files and media", "#/p/storage"),
    menuItem("help", "Help & feedback", "Policy, terms, help, feedback", "#/help"),
    menuItem("info", "About BAT", "", "#/p/about"),
    menuItem("user", "About the creator", "", "#/p/creator"),
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
    const up = /^#\/u\/([a-f0-9]+)$/.exec(loc), nb = /^#\/notes\/browse\/(\d+)$/.exec(loc), ne = /^#\/n\/([a-f0-9]{12}|new)$/.exec(loc);
    if (up) return await profileView(up[1]);
    if (loc === "#/edit") return await editView();
    if (loc === "#/notes") return await notesView();
    if (nb) return await browseView(+nb[1]);
    if (ne) return await noteEdit(ne[1]);
    if (c) return await chatView(c[1]);
    if (pg) { if (pg[1] === "privacy-security") return await privacyView(); if (pg[1] === "appearance") return appearanceView(); return pageView(pg[1]); }
    if (loc === "#/archived") return await chatsView(true);
    if (loc === "#/help") return helpView();
    if (loc === "#/feedback") return feedbackView();
    if (loc === "#/inbox") return await inboxView();
    if (loc === "#/search") return searchView();
    if (loc === "#/settings") return await settingsView();
    if (loc === "#/account") return accountView();
    return await chatsView();
  } catch (e) {
    if (/Sign in/.test(e.message)) { me = null; authView("login"); }
    else view(main(h("div", { class: "auth" }, h("p", { class: "err" }, "Something went wrong: " + e.message), h("button", { class: "btn", onclick: () => location.reload() }, "Reload"))));
  }
}

splash();
window.addEventListener("hashchange", route);
const ping = () => { if (me && !me.hideActive && !document.hidden) api("ping", "POST", {}).catch(() => {}); };
setInterval(ping, 25000);
api("me").then((u) => (me = u)).catch(() => {}).finally(() => { ping(); route(); });
