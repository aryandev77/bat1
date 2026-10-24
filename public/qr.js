// Minimal QR Code encoder: byte mode, error correction level L, versions 1 to 5.
const CAP = [0, 19, 34, 55, 80, 108];     // data codewords per version
const ECC = [0, 7, 10, 15, 20, 26];       // error-correction codewords per version
const ALIGN = [0, 0, 18, 22, 26, 30];     // centre of the single alignment pattern (version 2+)

const gmul = (x, y) => { let z = 0; for (let i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11d); z ^= ((y >>> i) & 1) * x; } return z; };
function rsRemainder(data, degree) {
  const div = Array(degree).fill(0); div[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < degree; j++) { div[j] = gmul(div[j], root); if (j + 1 < degree) div[j] ^= div[j + 1]; }
    root = gmul(root, 2);
  }
  const res = Array(degree).fill(0);
  for (const b of data) { const f = b ^ res.shift(); res.push(0); div.forEach((c, i) => { res[i] ^= gmul(c, f); }); }
  return res;
}
const MASKS = [(x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, (x, y) => x % 3 === 0, (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0, (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0];

export function qrMatrix(text) {
  const bytes = [...new TextEncoder().encode(text)];
  let v = 1;
  while (v <= 5 && bytes.length > CAP[v] - 2) v++;
  if (v > 5) throw new Error("Text is too long for this QR code.");
  const bits = [];
  const put = (val, n) => { for (let i = n - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
  put(4, 4); put(bytes.length, 8); bytes.forEach((b) => put(b, 8));
  put(0, Math.min(4, CAP[v] * 8 - bits.length));
  while (bits.length % 8) bits.push(0);
  const data = [];
  for (let i = 0; i < bits.length; i += 8) data.push(parseInt(bits.slice(i, i + 8).join(""), 2));
  for (let pad = 0xec; data.length < CAP[v]; pad ^= 0xec ^ 0x11) data.push(pad);
  const all = data.concat(rsRemainder(data, ECC[v]));

  const size = 17 + 4 * v;
  const mod = Array.from({ length: size }, () => Array(size).fill(false));
  const fn = Array.from({ length: size }, () => Array(size).fill(false));
  const set = (x, y, dark) => { if (x >= 0 && y >= 0 && x < size && y < size) { mod[y][x] = dark; fn[y][x] = true; } };
  for (let i = 0; i < size; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
  const finder = (cx, cy) => { for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const d = Math.max(Math.abs(dx), Math.abs(dy)); set(cx + dx, cy + dy, d !== 2 && d !== 4); } };
  finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
  if (v >= 2) for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(ALIGN[v] + dx, ALIGN[v] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
  const format = (mask) => {
    const d = (1 << 3) | mask; let rem = d;
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    const f = ((d << 10) | rem) ^ 0x5412, bit = (i) => ((f >>> i) & 1) !== 0;
    for (let i = 0; i <= 5; i++) set(8, i, bit(i));
    set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8));
    for (let i = 9; i < 15; i++) set(14 - i, 8, bit(i));
    for (let i = 0; i < 8; i++) set(size - 1 - i, 8, bit(i));
    for (let i = 8; i < 15; i++) set(8, size - 15 + i, bit(i));
    set(8, size - 8, true);
  };
  format(0);
  let k = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) for (let j = 0; j < 2; j++) {
      const x = right - j, y = ((right + 1) & 2) === 0 ? size - 1 - vert : vert;
      if (!fn[y][x] && k < all.length * 8) { mod[y][x] = ((all[k >>> 3] >>> (7 - (k & 7))) & 1) !== 0; k++; }
    }
  }
  const penalty = () => {
    let p = 0;
    for (let t = 0; t < 2; t++) for (let a = 0; a < size; a++) {
      let run = 1;
      for (let b = 1; b < size; b++) {
        const cur = t ? mod[b][a] : mod[a][b], prev = t ? mod[b - 1][a] : mod[a][b - 1];
        if (cur === prev) { run++; if (run === 5) p += 3; else if (run > 5) p++; } else run = 1;
      }
    }
    for (let y = 0; y < size - 1; y++) for (let x = 0; x < size - 1; x++) if (mod[y][x] === mod[y][x + 1] && mod[y][x] === mod[y + 1][x] && mod[y][x] === mod[y + 1][x + 1]) p += 3;
    const dark = mod.flat().filter(Boolean).length;
    return p + Math.floor(Math.abs(dark * 20 - size * size * 10) / (size * size)) * 10;
  };
  const apply = (m) => { for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!fn[y][x] && MASKS[m](x, y)) mod[y][x] = !mod[y][x]; };
  let best = 0, bestP = Infinity;
  for (let m = 0; m < 8; m++) { apply(m); format(m); const p = penalty(); if (p < bestP) { bestP = p; best = m; } apply(m); }
  apply(best); format(best);
  return mod;
}

// Returns an <svg> element: black modules on a white card, with the required quiet zone.
export function qrSvg(text) {
  const m = qrMatrix(text), n = m.length + 8, NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${n} ${n}`); svg.setAttribute("shape-rendering", "crispEdges"); svg.setAttribute("role", "img"); svg.setAttribute("aria-label", "QR code");
  const bg = document.createElementNS(NS, "rect"); bg.setAttribute("width", n); bg.setAttribute("height", n); bg.setAttribute("fill", "#fff");
  const path = document.createElementNS(NS, "path"); path.setAttribute("fill", "#000");
  let d = ""; m.forEach((row, y) => row.forEach((on, x) => { if (on) d += `M${x + 4} ${y + 4}h1v1h-1z`; }));
  path.setAttribute("d", d); svg.append(bg, path);
  return svg;
}
