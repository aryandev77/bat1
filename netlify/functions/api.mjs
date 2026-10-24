import { getStore } from "@netlify/blobs";
import { scrypt, randomBytes, randomInt, createHash, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const sc = promisify(scrypt);
const db = (n) => getStore({ name: n, consistency: "strong" });
const MAX_FILE = 5_000_000;
const json = (d, s = 200, h = {}) =>
  new Response(JSON.stringify(d), { status: s, headers: { "content-type": "application/json", "cache-control": "no-store", ...h } });
const bad = (m, s = 400) => json({ error: m }, s);
const sha = (s) => createHash("sha256").update(s).digest("hex");
const rid = (n = 8) => randomBytes(n).toString("hex");
const cookie = (v, age) => `bat_s=${v}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${age}`;
const pub = (u) => ({ id: u.id, username: u.username, name: u.name || u.username, bio: u.bio || "", av: u.av || 0, at: u.at });
const isAdmin = (n) => (process.env.ADMIN_CODENAMES || "").toLowerCase().split(",").map((x) => x.trim()).filter(Boolean).includes(String(n).toLowerCase());
const newPin = () => String(randomInt(0, 10000)).padStart(4, "0");

async function hash(s, salt = rid(16)) {
  return `${salt}:${(await sc(s, salt, 64)).toString("hex")}`;
}
async function check(s, stored) {
  const [salt, hex] = stored.split(":");
  const a = Buffer.from(hex, "hex"), b = await sc(s, salt, 64);
  return a.length === b.length && timingSafeEqual(a, b);
}
async function startSession(u) {
  const t = rid(32);
  await db("sessions").setJSON(sha(t), { uid: u.id, exp: Date.now() + 30 * 864e5 });
  return cookie(t, 30 * 86400);
}
async function whoami(req) {
  const m = /bat_s=([a-f0-9]+)/.exec(req.headers.get("cookie") || "");
  if (!m) return null;
  const s = await db("sessions").get(sha(m[1]), { type: "json" });
  return s && s.exp > Date.now() ? db("users").get(s.uid, { type: "json" }) : null;
}
async function throttle(key, max, lockMs) {
  const st = db("tries");
  const t = (await st.get(key, { type: "json" })) || { n: 0, until: 0 };
  return {
    locked: t.until > Date.now(),
    fail: async () => { t.n += 1; if (t.n >= max) { t.n = 0; t.until = Date.now() + lockMs; } await st.setJSON(key, t); },
    ok: () => st.delete(key),
  };
}
async function byName(name) {
  const ref = await db("names").get(String(name || "").toLowerCase(), { type: "json" });
  return ref ? db("users").get(ref.id, { type: "json" }) : null;
}
async function dropChat(cid) {
  for (const s of ["msgs", "media"]) {
    const st = db(s);
    const { blobs } = await st.list({ prefix: cid + "/" });
    await Promise.all(blobs.map((x) => st.delete(x.key)));
  }
  const ch = await db("chats").get(cid, { type: "json" });
  if (ch) for (const u of ch.users) { await db("mychat").delete(`${u}/${cid}`); await db("reads").delete(`${u}/${cid}`); }
  await db("chats").delete(cid);
}

export default async (req) => {
  const url = new URL(req.url);
  const [a, b, c] = url.pathname.replace(/^\/api\/?/, "").split("/").filter(Boolean);
  const M = req.method;
  if (M !== "GET" && req.headers.get("x-bat") !== "1") return bad("Blocked.", 403);
  const upload = a === "chats" && c === "upload";
  const rawIn = upload || a === "avatar";
  const body = M === "POST" && !rawIn ? await req.json().catch(() => ({})) : {};

  try {
    if (a === "signup" && M === "POST") {
      const name = String(body.username || "").trim(), pw = String(body.password || "");
      if (!/^[A-Za-z0-9_]{3,20}$/.test(name)) return bad("Username: 3 to 20 letters, numbers or _.");
      if (pw.length < 6) return bad("Password needs at least 6 characters.");
      if (await db("names").get(name.toLowerCase(), { type: "json" })) return bad("That username is taken.", 409);
      const pin = newPin();
      const u = { id: rid(8), username: name, pw: await hash(pw), rec: await hash(pin), bio: "", name: String(body.name || "").trim().slice(0, 30) || name, at: Date.now() };
      await db("users").setJSON(u.id, u);
      await db("names").setJSON(name.toLowerCase(), { id: u.id });
      return json({ username: name, recovery: pin }, 200, { "set-cookie": await startSession(u) });
    }

    if (a === "login" && M === "POST") {
      const key = String(body.username || "").toLowerCase();
      const th = await throttle("login/" + key, 5, 15 * 60000);
      if (th.locked) return bad("Too many tries. Wait 15 minutes.", 429);
      const u = await byName(key);
      if (!u || !(await check(String(body.password || ""), u.pw))) { await th.fail(); return bad("Username or password is wrong.", 401); }
      await th.ok();
      return json({ username: u.username }, 200, { "set-cookie": await startSession(u) });
    }

    if (a === "reset" && M === "POST") {
      const key = String(body.username || "").toLowerCase();
      const th = await throttle("reset/" + key, 5, 60 * 60000);
      if (th.locked) return bad("Too many wrong codes. Try again in an hour.", 429);
      const u = await byName(key);
      const code = String(body.code || "");
      if (!u || !/^\d{4}$/.test(code) || !(await check(code, u.rec))) { await th.fail(); return bad("Username or code is wrong.", 401); }
      const pw = String(body.password || "");
      if (pw.length < 6) return bad("Password needs at least 6 characters.");
      const pin = newPin();
      u.pw = await hash(pw); u.rec = await hash(pin);
      await db("users").setJSON(u.id, u);
      await th.ok();
      return json({ username: u.username, recovery: pin }, 200, { "set-cookie": await startSession(u) });
    }

    if (a === "logout" && M === "POST") {
      const m = /bat_s=([a-f0-9]+)/.exec(req.headers.get("cookie") || "");
      if (m) await db("sessions").delete(sha(m[1]));
      return json({ ok: true }, 200, { "set-cookie": cookie("", 0) });
    }

    const me = await whoami(req);
    if (!me) return bad("Sign in first.", 401);

    if (a === "me" && M === "GET") return json({ id: me.id, username: me.username, name: me.name || me.username, bio: me.bio || "", av: me.av || 0, hideActive: !!me.hideActive, unameAt: me.unameAt || 0, admin: isAdmin(me.username) });
    if (a === "profile" && M === "POST") {
      me.bio = String(body.bio || "").slice(0, 80);
      if (typeof body.name === "string") me.name = body.name.trim().slice(0, 30) || me.username;
      if (typeof body.hideActive === "boolean") me.hideActive = body.hideActive;
      await db("users").setJSON(me.id, me);
      return json({ ok: true });
    }
    if (["password", "recovery", "delete"].includes(a) && M === "POST") {
      if (!(await check(String(body.password || body.old || ""), me.pw))) return bad("Password is wrong.", 401);
      if (a === "password") {
        if (String(body.new || "").length < 6) return bad("Password needs at least 6 characters.");
        me.pw = await hash(String(body.new));
        await db("users").setJSON(me.id, me);
        return json({ ok: true });
      }
      if (a === "recovery") {
        const pin = newPin();
        me.rec = await hash(pin);
        await db("users").setJSON(me.id, me);
        return json({ recovery: pin });
      }
      const mine = db("mychat");
      const { blobs } = await mine.list({ prefix: me.id + "/" });
      for (const x of blobs) await dropChat(x.key.split("/")[1]);
      const nt = db("notes");
      for (const x of (await nt.list({ prefix: me.id + "/" })).blobs) await nt.delete(x.key);
      await db("avatars").delete(me.id);
      await db("presence").delete(me.id);
      await db("names").delete(me.username.toLowerCase());
      await db("users").delete(me.id);
      return json({ ok: true }, 200, { "set-cookie": cookie("", 0) });
    }

    if (a === "ping" && M === "POST") {
      if (!me.hideActive) await db("presence").setJSON(me.id, { t: Date.now() });
      return json({ ok: true });
    }
    if (a === "username" && M === "POST") {
      const name = String(body.username || "").trim().replace(/^@/, "");
      if (!/^[A-Za-z0-9_]{3,20}$/.test(name)) return bad("ID: 3 to 20 letters, numbers or _.");
      if (name === me.username) return bad("That is already your ID.");
      const wait = (me.unameAt || 0) + 17 * 864e5 - Date.now();
      if (wait > 0) return bad(`You can change your ID again in ${Math.ceil(wait / 864e5)} day(s).`, 429);
      const key = name.toLowerCase(), cur = me.username.toLowerCase();
      const taken = await db("names").get(key, { type: "json" });
      if (taken && taken.id !== me.id) return bad("That ID is taken.", 409);
      if (key !== cur) { await db("names").setJSON(key, { id: me.id }); await db("names").delete(cur); }
      me.username = name; me.unameAt = Date.now();
      await db("users").setJSON(me.id, me);
      return json({ username: name });
    }
    if (a === "feedback") {
      const st = db("feedback");
      if (!b && M === "POST") {
        const t = String(body.text || "").trim().slice(0, 1000);
        if (t.length < 3) return bad("Write a few words first.");
        await st.setJSON(`${String(Date.now()).padStart(14, "0")}-${rid(3)}`, { from: me.username, uid: me.id, text: t, at: Date.now() });
        return json({ ok: true });
      }
      if (!b && M === "GET") {
        if (!isAdmin(me.username)) return bad("Not found.", 404);
        const { blobs } = await st.list();
        const rows = await Promise.all(blobs.map(async (x) => ({ id: x.key, ...(await st.get(x.key, { type: "json" })) })));
        return json({ items: rows.sort((p, q) => q.at - p.at).slice(0, 50) });
      }
    }
    if (a === "user" && M === "GET") {
      const u = await db("users").get(String(b || ""), { type: "json" });
      return u ? json(pub(u)) : bad("User not found.", 404);
    }
    if (a === "avatar" && M === "POST") {
      if (b === "remove") { await db("avatars").delete(me.id); me.av = 0; await db("users").setJSON(me.id, me); return json({ av: 0 }); }
      const type = (req.headers.get("content-type") || "").split(";")[0];
      if (!/^image\/(jpeg|png|webp)$/.test(type)) return bad("Use a JPEG, PNG or WebP image.");
      const buf = await req.arrayBuffer();
      if (!buf.byteLength || buf.byteLength > 600000) return bad("That photo is too large.", 413);
      await db("avatars").set(me.id, buf, { metadata: { type } });
      me.av = Date.now();
      await db("users").setJSON(me.id, me);
      return json({ av: me.av });
    }
    if (a === "avatar" && M === "GET") {
      const r = await db("avatars").getWithMetadata(String(b || ""), { type: "arrayBuffer" });
      if (!r) return bad("Not found.", 404);
      return new Response(r.data, { headers: { "content-type": r.metadata.type, "cache-control": "private, max-age=86400", "content-security-policy": "sandbox", "x-content-type-options": "nosniff" } });
    }
    if (a === "notes") {
      const st = db("notes"), okId = (x) => /^[a-f0-9]{12}$/.test(x);
      if (!b && M === "GET") {
        const { blobs } = await st.list({ prefix: me.id + "/" });
        const rows = (await Promise.all(blobs.map((x) => st.get(x.key, { type: "json" })))).filter(Boolean);
        return json({ notes: rows.sort((p, q) => q.updated - p.updated) });
      }
      if (!b && M === "POST") {
        const text = String(body.text || "").slice(0, 4000);
        let id = String(body.id || "");
        if (id && !okId(id)) return bad("Bad note.");
        if (!id) {
          if (!text.trim()) return bad("Write something first.");
          if ((await st.list({ prefix: me.id + "/" })).blobs.length >= 100) return bad("You can keep up to 100 notes.");
          id = rid(6);
        }
        const old = await st.get(`${me.id}/${id}`, { type: "json" });
        const note = { id, text, created: old ? old.created : Date.now(), updated: Date.now() };
        await st.setJSON(`${me.id}/${id}`, note);
        return json({ note });
      }
      if (b === "delete" && M === "POST") {
        if (okId(String(body.id || ""))) await st.delete(`${me.id}/${body.id}`);
        return json({ ok: true });
      }
    }

    if (a === "search" && M === "GET") {
      const q = (url.searchParams.get("q") || "").toLowerCase().replace(/[^a-z0-9_]/g, "");
      if (q.length < 2) return json({ users: [] });
      const { blobs } = await db("names").list({ prefix: q });
      const rows = await Promise.all(blobs.slice(0, 15).map(async (x) => {
        const r = await db("names").get(x.key, { type: "json" });
        return r ? db("users").get(r.id, { type: "json" }) : null;
      }));
      return json({ users: rows.filter((u) => u && u.id !== me.id).map(pub) });
    }

    if (a === "media" && M === "GET") {
      const ch = await db("chats").get(b, { type: "json" });
      if (!ch || !ch.users.includes(me.id)) return bad("Not found.", 404);
      const m = await db("msgs").get(`${b}/${c}`, { type: "json" });
      const r = m ? await db("media").getWithMetadata(`${b}/${c}`, { type: "arrayBuffer" }) : null;
      if (!r) return bad("Not found.", 404);
      const inline = m.kind !== "file";
      return new Response(r.data, { headers: {
        "content-type": inline ? m.type : "application/octet-stream",
        "content-disposition": `${inline ? "inline" : "attachment"}; filename="${m.name || "file"}"`,
        "cache-control": "private, max-age=86400", "content-security-policy": "sandbox", "x-content-type-options": "nosniff",
      } });
    }

    if (a === "chats") {
      const mine = db("mychat");
      if (!b && M === "GET") {
        const { blobs } = await mine.list({ prefix: me.id + "/" });
        const rows = (await Promise.all(blobs.map((x) => mine.get(x.key, { type: "json" })))).filter(Boolean);
        const full = await Promise.all(rows.map(async (r) => {
          const u = await db("users").get(r.with.id, { type: "json" });
          return { ...r, with: u ? pub(u) : r.with };
        }));
        return json({ chats: full.sort((p, q) => (q.pinned ? 1 : 0) - (p.pinned ? 1 : 0) || (q.at || 0) - (p.at || 0)) });
      }
      if (!b && M === "POST") {
        const o = await db("users").get(String(body.userId || ""), { type: "json" });
        if (!o || o.id === me.id) return bad("User not found.", 404);
        const cid = [me.id, o.id].sort().join("");
        if (!(await db("chats").get(cid, { type: "json" }))) await db("chats").setJSON(cid, { id: cid, users: [me.id, o.id] });
        const k = `${me.id}/${cid}`;
        if (!(await mine.get(k, { type: "json" }))) await mine.setJSON(k, { cid, with: { id: o.id, username: o.username }, at: Date.now(), preview: "", unread: 0 });
        return json({ cid });
      }
      const ch = await db("chats").get(b, { type: "json" });
      if (!ch || !ch.users.includes(me.id)) return bad("No such chat.", 404);
      const otherId = ch.users.find((u) => u !== me.id);
      const blockedMsg = () => (ch.blockedBy === me.id ? "You blocked this person. Unblock to send messages." : "You can't send messages to this person.");
      const newId = () => `${String(Date.now()).padStart(14, "0")}-${rid(3)}`;

      const push = async (msg, preview, id = newId()) => {
        await db("msgs").setJSON(`${b}/${id}`, { from: me.id, at: Date.now(), ...msg });
        const other = await db("users").get(otherId, { type: "json" });
        const mk = `${me.id}/${b}`, ok = `${otherId}/${b}`;
        const em = (await mine.get(mk, { type: "json" })) || { cid: b, with: { id: otherId, username: other ? other.username : "Deleted" } };
        await mine.setJSON(mk, { ...em, at: Date.now(), preview, unread: 0 });
        const eo = (await mine.get(ok, { type: "json" })) || { cid: b, with: { id: me.id, username: me.username }, unread: 0 };
        await mine.setJSON(ok, { ...eo, at: Date.now(), preview, unread: (eo.unread || 0) + 1, archived: false });
      };

      if (c === "messages" && M === "GET") {
        const after = url.searchParams.get("after") || "";
        const st = db("msgs");
        const { blobs } = await st.list({ prefix: b + "/" });
        const all = blobs.map((x) => x.key).sort();
        const keys = all.filter((k) => k.slice(b.length + 1) > after).slice(-100);
        const messages = await Promise.all(keys.map(async (k) => ({ id: k.slice(b.length + 1), ...(await st.get(k, { type: "json" })) })));
        const other = await db("users").get(otherId, { type: "json" });
        const or = await db("reads").get(`${otherId}/${b}`, { type: "json" });
        await db("reads").setJSON(`${me.id}/${b}`, { t: Date.now() });
        const mk = `${me.id}/${b}`, e = await mine.get(mk, { type: "json" });
        if (e && e.unread) await mine.setJSON(mk, { ...e, unread: 0 });
        let status = null;
        if (other && !me.hideActive && !other.hideActive) {
          const pr = await db("presence").get(otherId, { type: "json" });
          const ty = await db("typing").get(`${b}/${otherId}`, { type: "json" });
          status = { last: pr ? pr.t : 0, typing: !!ty && Date.now() - ty.t < 5000 };
        }
        return json({ status, flags: { pinned: !!(e && e.pinned), archived: !!(e && e.archived) },
          blocked: ch.blockedBy ? (ch.blockedBy === me.id ? "me" : "them") : null, edits: ch.edits || {},
          with: other ? other.name || other.username : "Deleted account", peer: other ? pub(other) : null, otherRead: or ? or.t : 0, ids: all.slice(-100).map((k) => k.slice(b.length + 1)), messages });
      }
      if (c === "edit" && M === "POST") {
        const id = String(body.id || ""), t = String(body.text || "").trim().slice(0, 4000);
        const m = await db("msgs").get(`${b}/${id}`, { type: "json" });
        if (!m || m.from !== me.id || m.kind !== "text") return bad("You can only edit your own text messages.", 403);
        if (!t) return bad("A message cannot be empty.");
        await db("msgs").setJSON(`${b}/${id}`, { ...m, text: t, edited: true });
        const keep = Object.entries({ ...(ch.edits || {}), [id]: { text: t, t: Date.now() } }).sort((p, q) => q[1].t - p[1].t).slice(0, 20);
        await db("chats").setJSON(b, { ...ch, edits: Object.fromEntries(keep) });
        const { blobs } = await db("msgs").list({ prefix: b + "/" });
        const lastKey = blobs.map((x) => x.key).sort().pop();
        if (lastKey && lastKey.slice(b.length + 1) === id) {
          for (const u of ch.users) { const k = `${u}/${b}`, e = await mine.get(k, { type: "json" }); if (e) await mine.setJSON(k, { ...e, preview: t.slice(0, 60) }); }
        }
        return json({ ok: true });
      }
      if (c === "typing" && M === "POST") {
        if (!me.hideActive) await db("typing").setJSON(`${b}/${me.id}`, { t: Date.now() });
        return json({ ok: true });
      }
      if (c === "flags" && M === "POST") {
        const k = `${me.id}/${b}`, e = await mine.get(k, { type: "json" });
        if (!e) return bad("No such chat.", 404);
        const n = { ...e };
        for (const f of ["pinned", "archived"]) if (typeof body[f] === "boolean") n[f] = body[f];
        await mine.setJSON(k, n);
        return json({ ok: true });
      }
      if (c === "block" && M === "POST") {
        if (body.blocked) await db("chats").setJSON(b, { ...ch, blockedBy: ch.blockedBy || me.id });
        else if (ch.blockedBy === me.id) await db("chats").setJSON(b, { ...ch, blockedBy: null });
        return json({ ok: true });
      }
      if (c === "delete" && M === "POST") {
        const id = String(body.id || "");
        const m = await db("msgs").get(`${b}/${id}`, { type: "json" });
        if (!m || m.from !== me.id) return bad("You can only delete your own messages.", 403);
        await db("msgs").delete(`${b}/${id}`);
        await db("media").delete(`${b}/${id}`);
        const { blobs } = await db("msgs").list({ prefix: b + "/" });
        const lastKey = blobs.map((x) => x.key).sort().pop();
        if (!lastKey || lastKey.slice(b.length + 1) < id) {
          for (const u of ch.users) {
            const k = `${u}/${b}`, e = await mine.get(k, { type: "json" });
            if (e) await mine.setJSON(k, { ...e, preview: "Message deleted" });
          }
        }
        return json({ ok: true });
      }
      if (c === "send" && M === "POST") {
        if (ch.blockedBy) return bad(blockedMsg(), 403);
        const t = String(body.text || "").trim().slice(0, 4000);
        if (!t) return bad("Empty message.");
        await push({ kind: "text", text: t }, t.slice(0, 60));
        return json({ ok: true });
      }
      if (upload && M === "POST") {
        if (ch.blockedBy) return bad(blockedMsg(), 403);
        const kind = url.searchParams.get("kind");
        const name = (url.searchParams.get("name") || "file").replace(/[^\w.\- ]/g, "_").slice(0, 80);
        const type = (req.headers.get("content-type") || "").split(";")[0];
        if (!["photo", "file", "voice"].includes(kind)) return bad("Unknown type.");
        if (kind === "photo" && !/^image\/(jpeg|png|webp|gif)$/.test(type)) return bad("Photos must be JPEG, PNG, WebP or GIF.");
        if (kind === "voice" && !/^audio\/(webm|ogg|mp4|mpeg|wav)$/.test(type)) return bad("That audio format is not supported.");
        const buf = await req.arrayBuffer();
        if (!buf.byteLength) return bad("Empty file.");
        if (buf.byteLength > MAX_FILE) return bad("Files can be up to 5 MB.", 413);
        const id = newId();
        await db("media").set(`${b}/${id}`, buf, { metadata: { type, name } });
        await push({ kind, name, size: buf.byteLength, type }, kind === "photo" ? "Photo" : kind === "voice" ? "Voice message" : name, id);
        return json({ ok: true });
      }
    }
    return bad("Not found.", 404);
  } catch (err) {
    console.error(err);
    return bad("Something went wrong. Try again.", 500);
  }
};

export const config = { path: "/api/*" };
