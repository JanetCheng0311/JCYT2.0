/* =====================================================================
   Generative ASCII — Perlin flow field + particle trails  (shared)
   Inspired by classic p5.js / Coding Train flow-field sketches: particles
   drift through a Perlin-noise vector field and leave trails, rendered as a
   single digit ramp -> flowing rivers of numbers.
   Works on any page that has <canvas id="art">. The control dock + swatches
   are optional (Contact/About pages can omit them).
   ===================================================================== */

/* ---------- Palettes (blue first) ---------- */
const PALETTES = {
  cobalt:   { name: "cobalt",   bg: "#1d3fd1", ink: "#f4f1e8", accent: "#bcd0ff" },
  blueprint:{ name: "blueprint",bg: "#0a1f6e", ink: "#cfe0ff", accent: "#7ea8ff" },
  ink:      { name: "ink",      bg: "#f4f1e8", ink: "#16357a", accent: "#3a63d0" },
  ember:    { name: "ember",    bg: "#160d0a", ink: "#ff7a3c", accent: "#ffd0a0" },
  mono:     { name: "mono",     bg: "#0c0c0c", ink: "#e9e9e9", accent: "#9aa0aa" },
  jade:     { name: "jade",     bg: "#062b22", ink: "#a9f0d1", accent: "#5fe0aa" },
};
const PALETTE_ORDER = ["cobalt", "blueprint", "ink", "jade", "ember", "mono"];
let palette = PALETTES.cobalt;

/* ---------- Canvas ---------- */
const canvas = document.getElementById("art");
const ctx = canvas ? canvas.getContext("2d", { alpha: false }) : null;
let W = 0, H = 0, DPR = 1;
let cols = 0, rows = 0, cell = 11;

let trail = null;
let particles = [];
let prevCells = -1;

function targetParticleCount() {
  return Math.min(1900, Math.max(260, Math.round(cols * rows * 0.32)));
}
function spawn(p) {
  p = p || {};
  p.x = Math.random() * cols;
  p.y = Math.random() * rows;
  p.life = 0;
  p.maxLife = 40 + (Math.random() * 140 | 0);
  return p;
}
function buildParticles() {
  const n = targetParticleCount();
  particles = new Array(n);
  for (let i = 0; i < n; i++) particles[i] = spawn({});
}
function reseed() { for (let i = 0; i < particles.length; i++) spawn(particles[i]); }

function resize() {
  if (!canvas) return;
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = Math.floor(W * DPR);
  canvas.height = Math.floor(H * DPR);
  canvas.style.width = W + "px";
  canvas.style.height = H + "px";
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

  const minSide = Math.min(W, H);
  cell = Math.max(7, Math.min(12, Math.round(minSide / 60)));
  cols = Math.ceil(W / cell) + 1;
  rows = Math.ceil(H / cell) + 1;

  ctx.font = `${cell + 1}px ui-monospace, Menlo, Consolas, monospace`;
  ctx.textBaseline = "top";

  if (!trail || prevCells !== cols * rows) {
    prevCells = cols * rows;
    trail = new Float32Array(cols * rows);
    buildParticles();
  }
}
window.addEventListener("resize", resize, { passive: true });
window.addEventListener("orientationchange", resize, { passive: true });

/* ---------- Value-noise → smooth flow field ---------- */
function hash(x, y) {
  let h = x * 374761393 + y * 668265263;
  h = (h ^ (h >> 13)) * 1274126177;
  return ((h ^ (h >> 16)) >>> 0) / 4294967295;
}
const smooth = (t) => t * t * (3 - 2 * t);
function noise2(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const a = hash(xi, yi),     b = hash(xi + 1, yi);
  const c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  const u = smooth(xf), v = smooth(yf);
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
}
function fbm(x, y) {
  let v = 0, amp = 0.5, freq = 1;
  for (let i = 0; i < 3; i++) { v += amp * noise2(x * freq, y * freq); freq *= 2; amp *= 0.5; }
  return v;
}

/* ---------- Digit ramp + simulation constants ---------- */
const RAMP = " 1742356908".split("");
const RLAST = RAMP.length - 1;
const FS = 0.055, SPEED = 0.85, Z_STEP = 0.010, FADE = 0.93, DEPOSIT = 0.5, TCAP = 6, TNORM = 0.32;

let z = 0;
let playing = true;
let lastFrame = 0;

function hexToRgb(h) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function step() {
  z += Z_STEP;
  for (let i = 0; i < trail.length; i++) trail[i] *= FADE;
  const TWO_PI = Math.PI * 2;
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    const a = fbm(p.x * FS, p.y * FS + z) * TWO_PI * 2.2;
    p.x += Math.cos(a) * SPEED;
    p.y += Math.sin(a) * SPEED;
    if (p.x < 0) p.x += cols; else if (p.x >= cols) p.x -= cols;
    if (p.y < 0) p.y += rows; else if (p.y >= rows) p.y -= rows;
    const idx = (p.y | 0) * cols + (p.x | 0);
    const t = trail[idx] + DEPOSIT;
    trail[idx] = t > TCAP ? TCAP : t;
    if (++p.life > p.maxLife) spawn(p);
  }
}

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(50, now - lastFrame || 16);
  lastFrame = now;

  if (playing && trail) step();

  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, W, H);
  if (!trail) return;

  const inkStr = hexToRgb(palette.ink).join(",");
  const accStr = hexToRgb(palette.accent).join(",");

  for (let r = 0; r < rows; r++) {
    const yPx = r * cell, row = r * cols;
    for (let c = 0; c < cols; c++) {
      let d = trail[row + c] * TNORM;
      if (d <= 0.02) continue;
      if (d > 1) d = 1;
      const ch = RAMP[(d * RLAST) | 0];
      if (ch === " ") continue;
      const alpha = 0.25 + 0.75 * d;
      ctx.fillStyle = `rgba(${d > 0.78 ? accStr : inkStr},${alpha.toFixed(3)})`;
      ctx.fillText(ch, c * cell, yPx);
    }
  }
}

/* ---------- Palette / color-change ---------- */
function setPalette(nameOrPalette) {
  palette = typeof nameOrPalette === "string" ? (PALETTES[nameOrPalette] || palette) : nameOrPalette;
  document.documentElement.style.setProperty("--bg", palette.bg);
  document.documentElement.style.setProperty("--fg", palette.ink);
  document.documentElement.style.setProperty("--accent", palette.accent);
  document.querySelectorAll(".swatch").forEach(s =>
    s.setAttribute("aria-pressed", String(s.dataset.pal === palette.name)));
}
let autoColor = false, colorTimer = null;
function startColorCycle(intervalMs = 7000) {
  stopColorCycle();
  autoColor = true;
  let i = PALETTE_ORDER.indexOf(palette.name);
  colorTimer = setInterval(() => {
    i = (i + 1) % PALETTE_ORDER.length;
    setPalette(PALETTE_ORDER[i]);
  }, intervalMs);
}
function stopColorCycle() { autoColor = false; if (colorTimer) clearInterval(colorTimer); colorTimer = null; }

/* ---------- HUD (optional) ---------- */
function buildSwatches() {
  const wrap = document.getElementById("swatches");
  if (!wrap) return;
  wrap.innerHTML = "";
  PALETTE_ORDER.forEach(key => {
    const p = PALETTES[key];
    const b = document.createElement("button");
    b.className = "swatch";
    b.dataset.pal = key;
    b.title = key;
    b.style.background = p.bg;
    b.style.boxShadow = `inset 0 0 0 6px ${p.ink}22`;
    b.setAttribute("aria-pressed", String(key === palette.name));
    b.addEventListener("click", () => { stopColorCycle(); updateAutoBtn(); setPalette(key); });
    wrap.appendChild(b);
  });
}
function updateAutoBtn() {
  const btn = document.getElementById("autocolor");
  if (!btn) return;
  btn.textContent = "Auto-color: " + (autoColor ? "on" : "off");
  btn.setAttribute("aria-pressed", String(autoColor));
}

const pauseBtn = document.getElementById("pause");
if (pauseBtn) pauseBtn.addEventListener("click", (e) => {
  playing = !playing;
  e.target.textContent = playing ? "⏸ Pause" : "▶ Play";
});
const nextBtn = document.getElementById("next");
if (nextBtn) nextBtn.addEventListener("click", reseed);
const autoBtnEl = document.getElementById("autocolor");
if (autoBtnEl) autoBtnEl.addEventListener("click", () => {
  if (autoColor) stopColorCycle(); else startColorCycle();
  updateAutoBtn();
});
if (canvas) canvas.addEventListener("dblclick", reseed);

/* ---------- Smooth page-to-page transitions ---------- */
const REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
function smoothGo(href) {
  if (REDUCED || document.body.classList.contains("leaving")) { location.href = href; return; }
  document.body.classList.add("leaving");
  setTimeout(() => { location.href = href; }, 190);
}
// fade out on any internal link (menu, back links, footer page links)
document.addEventListener("click", (e) => {
  const a = e.target.closest("a");
  if (!a) return;
  const href = a.getAttribute("href");
  if (!href || a.target === "_blank" || a.getAttribute("aria-disabled") === "true") return;
  if (href.startsWith("#") || href.startsWith("mailto:") || /^https?:/i.test(href)) return;
  e.preventDefault();
  smoothGo(href);
}, true);
// coming back via the browser cache: make sure the page isn't stuck faded out
window.addEventListener("pageshow", () => document.body.classList.remove("leaving"));

/* ---------- Menu overlay ---------- */
const menuBtn = document.getElementById("menuBtn");
const overlay = document.getElementById("overlay");
function setMenu(open) {
  if (!overlay || !menuBtn) return;
  overlay.classList.toggle("open", open);
  menuBtn.setAttribute("aria-expanded", String(open));
  menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
}
if (menuBtn && overlay) {
  menuBtn.addEventListener("click", () => setMenu(!overlay.classList.contains("open")));
  overlay.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (a && a.getAttribute("aria-disabled") === "true") { e.preventDefault(); return; }
    setMenu(false);
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });
}

/* ---------- Boot ---------- */
resize();
setPalette("cobalt");
buildSwatches();
updateAutoBtn();
if (canvas) requestAnimationFrame(frame);
