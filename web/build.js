#!/usr/bin/env node
/* ============================================================
   Unveil companion — build.

   Reads cards.json and emits two directories:

     dist/         DEPLOY THIS. Encrypted payloads only.
     facilitator/  NEVER DEPLOY THIS. Answer key, print manifest, QR codes.

   Run:  npm run build
         BASE_URL=https://your-deployment/ npm run build
   ============================================================ */

const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const QRCode = require("qrcode-svg");

const ROOT = __dirname;
const SRC = path.join(ROOT, "src");
const DIST = path.join(ROOT, "dist");
const FACIL = path.join(ROOT, "facilitator");

/* Where the QR codes point.

   With BASE_URL set, that wins — this is what you use for the real deck.

   Without it, the build falls back to this machine's LAN address over HTTPS,
   so codes generated right now are scannable from a phone on the same wifi.
   HTTPS and not HTTP because `http://192.168.x.x` is not a secure context and
   the browser will refuse to decrypt the card. `npm run serve` raises a
   matching self-signed listener. */
const PLACEHOLDER = "https://unveil.example/";
const HTTP_PORT = Number(process.env.PORT || 8070);
const HTTPS_PORT = HTTP_PORT + 1;

function lanIp() {
  for (const list of Object.values(os.networkInterfaces())) {
    for (const ni of list || []) {
      if (ni.family === "IPv4" && !ni.internal) return ni.address;
    }
  }
  return null;
}

const LAN = lanIp();
const DEV_URL = LAN ? `https://${LAN}:${HTTPS_PORT}/` : null;
const BASE_URL = process.env.BASE_URL || DEV_URL || PLACEHOLDER;
const MODE = process.env.BASE_URL ? "deployment" : DEV_URL ? "dev-lan" : "placeholder";

/* PBKDF2 parameters. The salt is fixed rather than random so that a
   rebuild of unchanged content produces an identical bundle. Each card's
   key still comes from its own slug, so one slug decrypts one card.

   Threat model: a player who opens view-source. This defeats that
   completely. It is NOT a defence against someone who takes the bundle
   away and spends real compute on it — 6-hex slugs are a 24-bit space.
   That is a deliberate trade for QR density; the facilitator's answer
   key is the thing that actually needs protecting. */
const SALT = "756e7665696c2d6465636b2d76310000";
const ITER = 100000;

const die = m => { console.error("\n  BUILD FAILED: " + m + "\n"); process.exit(1); };
const rel = p => path.relative(ROOT, p).replace(/\\/g, "/");

/* ---------------- load + validate ---------------- */

const src = JSON.parse(fs.readFileSync(path.join(ROOT, "cards.json"), "utf8"));
const cards = src.cards;
if (!Array.isArray(cards)) die("cards.json has no `cards` array.");

const counts = { real: 0, fake: 0, audience: 0 };
const seen = new Set();

for (const c of cards) {
  if (!/^[0-9a-f]{6}$/.test(c.slug || "")) die(`bad slug ${JSON.stringify(c.slug)} — must be 6 lowercase hex characters.`);
  if (seen.has(c.slug)) die(`duplicate slug "${c.slug}". Slugs are printed into QR codes and must be unique forever.`);
  seen.add(c.slug);

  if (!(c.type in counts)) die(`card ${c.slug} has unknown type ${JSON.stringify(c.type)}.`);
  counts[c.type]++;

  if (c.type === "audience") {
    if (c.headline || c.clues) die(`audience card ${c.slug} must carry no headline and no clues.`);
  } else {
    if (!c.headline || !c.headline.trim()) die(`card ${c.slug} has no headline.`);
    if (!Array.isArray(c.clues) || c.clues.length !== 3) die(`card ${c.slug} must have exactly 3 clues.`);
    for (const cl of c.clues) {
      if (!Array.isArray(cl) || cl.length !== 2 || !cl[0] || !cl[1]) die(`card ${c.slug} has a malformed clue.`);
    }
  }
}

const EXPECT = { real: 20, fake: 10, audience: 6 };
for (const [k, v] of Object.entries(EXPECT)) {
  if (counts[k] !== v) die(`expected ${v} ${k} cards, found ${counts[k]}. The deck architecture is 20 / 10 / 6.`);
}

/* ---------------- encrypt ---------------- */

const cardId = slug =>
  crypto.createHash("sha256").update(slug + "|id").digest("hex").slice(0, 16);

function seal(slug, payload) {
  const key = crypto.pbkdf2Sync(slug, Buffer.from(SALT, "hex"), ITER, 32, "sha256");
  // Deterministic IV from the slug: content is immutable per slug, so a
  // fixed IV never repeats under a reused key, and the build stays
  // byte-reproducible. Do not copy this pattern to a mutable payload.
  const iv = crypto.createHash("sha256").update(slug + "|iv").digest().subarray(0, 12);
  const c = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([c.update(JSON.stringify(payload), "utf8"), c.final(), c.getAuthTag()]);
  return Buffer.concat([iv, ct]).toString("base64");
}

const deck = { v: 1, salt: SALT, iter: ITER, cards: {} };

for (const c of cards) {
  // Player payload. `whyItWorks` is facilitator debrief material and is
  // deliberately NOT included — shipping it would mark the card as fake.
  const payload = c.type === "audience"
    ? { type: "audience" }
    : { type: c.type, headline: c.headline, clues: c.clues };
  deck.cards[cardId(c.slug)] = seal(c.slug, payload);
}

if (Object.keys(deck.cards).length !== cards.length) die("card id collision — regenerate a slug.");

const serialised = JSON.stringify(deck);
if (/whyItWorks/i.test(serialised)) die("facilitator content leaked into the deployable payload.");
for (const c of cards) {
  if (c.headline && serialised.includes(c.headline.slice(0, 40))) {
    die(`plaintext headline for ${c.slug} found in the payload — encryption did not apply.`);
  }
}

/* ---------------- emit dist/ ---------------- */

fs.rmSync(DIST, { recursive: true, force: true });
fs.rmSync(FACIL, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
fs.mkdirSync(path.join(FACIL, "qr"), { recursive: true });

const version = crypto.createHash("sha256").update(serialised).digest("hex").slice(0, 8);

const html = fs.readFileSync(path.join(SRC, "app.html"), "utf8").replace("__DECK__", serialised);
if (html.includes("__DECK__")) die("deck placeholder not substituted into app.html.");
fs.writeFileSync(path.join(DIST, "index.html"), html);

fs.writeFileSync(
  path.join(DIST, "sw.js"),
  fs.readFileSync(path.join(SRC, "sw.js"), "utf8").replace("__VERSION__", version)
);

fs.writeFileSync(path.join(DIST, "_headers"),
`/*
  X-Robots-Tag: noindex, nofollow
  Referrer-Policy: no-referrer
  X-Content-Type-Options: nosniff
`);

/* ---------------- emit facilitator/ ---------------- */

const url = slug => BASE_URL.replace(/\/+$/, "") + "/#" + slug;
const esc = s => String(s).replace(/[&<>]/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[m]));

let qrCount = 0;
for (const c of cards) {
  const svg = new QRCode({
    content: url(c.slug),
    padding: 2, width: 256, height: 256,
    color: "#000000", background: "#ffffff",
    ecl: "M", join: true, container: "svg-viewbox"
  }).svg();
  fs.writeFileSync(path.join(FACIL, "qr", `${c.slug}.svg`), svg);
  qrCount++;
}

/* A scannable contact sheet. Every code on one page, labelled — for
   checking that a phone actually resolves them before 36 cards go to
   press. Facilitator-only, so the labels give the game away by design. */
const qrTiles = cards.map(c => {
  const svg = new QRCode({
    content: url(c.slug), padding: 1, width: 150, height: 150,
    color: "#000000", background: "#ffffff", ecl: "M", join: true, container: "svg-viewbox"
  }).svg();
  return `<figure class="t ${c.type}">
      ${svg}
      <figcaption><b>${c.slug}</b><span>${c.type}</span></figcaption>
    </figure>`;
}).join("");

fs.writeFileSync(path.join(FACIL, "qr-test-sheet.html"), `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Unveil — QR test sheet</title>
<style>
@page { size: A4; margin: 10mm; }
body { font-family: system-ui, -apple-system, "Segoe UI", sans-serif; color: #111;
       max-width: 190mm; margin: 0 auto; padding: 8mm; background: #fff; }
h1 { font-size: 15pt; margin-bottom: 2mm; }
.warn { font-size: 8.5pt; background: #1a1a1a; color: #fff; padding: 3mm 4mm;
        margin-bottom: 4mm; letter-spacing: .03em; }
.meta { font-size: 8pt; color: #555; margin-bottom: 5mm; line-height: 1.6; }
.meta code { background: #eee; padding: .5mm 1.5mm; border-radius: 2px; font-size: 7.5pt; }
.grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 5mm; }
.t { border: .4pt solid #ddd; padding: 2.5mm; text-align: center; break-inside: avoid; }
.t svg { width: 100%; height: auto; display: block; }
figcaption { font-size: 7pt; margin-top: 1.5mm; display: flex;
             justify-content: space-between; align-items: baseline; }
figcaption b { font-family: "Courier New", monospace; font-size: 8pt; }
figcaption span { text-transform: uppercase; letter-spacing: .06em; color: #777; font-size: 6pt; }
.t.fake figcaption span { color: #a11; }
.t.real figcaption span { color: #171; }
.t.audience figcaption span { color: #46a; }
</style></head><body>
<h1>Unveil — QR test sheet</h1>
<div class="warn">FACILITATOR ONLY. The labels under each code state whether it is real or fake.</div>
<div class="meta">
  Deck version ${version} · mode <b>${MODE}</b><br>
  Codes point at <code>${esc(BASE_URL)}</code><br>
  Each code encodes <code>${esc(url("<slug>"))}</code> · error correction M<br>
  <b>Before printing 36 cards:</b> scan one code from this sheet with the phone you expect players to use, at the size you intend to print. Codes below render about 33 mm wide on A4.
</div>
<div class="grid">${qrTiles}</div>
</body></html>
`);

const csv = ["slug,type,qr_file,url,headline"]
  .concat(cards.map(c => [
    c.slug, c.type, `qr/${c.slug}.svg`, url(c.slug),
    `"${(c.headline || "Audience card").replace(/"/g, '""')}"`
  ].join(",")))
  .join("\n");
fs.writeFileSync(path.join(FACIL, "print-manifest.csv"), csv + "\n");

const rows = cards.filter(c => c.type !== "audience").map(c => `
  <tr>
    <td class="slug">${c.slug}</td>
    <td class="v ${c.type}">${c.type === "real" ? "REAL" : "FAKE"}</td>
    <td>${esc(c.headline)}${c.whyItWorks ? `<div class="why"><b>Why it works —</b> ${esc(c.whyItWorks)}</div>` : ""}</td>
  </tr>`).join("");

fs.writeFileSync(path.join(FACIL, "answer-key.html"), `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex">
<title>Unveil — Facilitator Answer Key</title>
<style>
@page { size: A4; margin: 12mm; }
body { font-family: Georgia, serif; max-width: 190mm; margin: 0 auto; padding: 8mm; color: #111; }
h1 { font-size: 15pt; margin-bottom: 2mm; }
.warn { font-family: Arial, sans-serif; font-size: 8.5pt; background: #1a1a1a; color: #fff;
        padding: 3mm 4mm; margin-bottom: 5mm; letter-spacing: .04em; }
.meta { font-family: Arial, sans-serif; font-size: 8pt; color: #666; margin-bottom: 5mm; }
table { width: 100%; border-collapse: collapse; font-size: 8.5pt; }
th, td { border-bottom: .4pt solid #ddd; padding: 2mm; text-align: left; vertical-align: top; }
th { font-family: Arial, sans-serif; font-size: 7pt; text-transform: uppercase; letter-spacing: .05em; }
.slug { font-family: "Courier New", monospace; font-weight: bold; width: 16mm; }
.v { font-family: Arial, sans-serif; font-size: 7.5pt; font-weight: bold; width: 14mm; }
.v.fake { color: #a11; } .v.real { color: #171; }
.why { font-size: 7.5pt; color: #555; font-style: italic; margin-top: 1.2mm; }
.aud { font-family: "Courier New", monospace; font-size: 8.5pt; margin-top: 5mm; }
</style></head><body>
<h1>Unveil — facilitator answer key</h1>
<div class="warn">FACILITATOR ONLY. This page is the entire game. Do not deploy it, and do not leave it on the table.</div>
<div class="meta">Deck version ${version} · content v${esc(src.version || "?")} · language ${esc(src.language || "?")} · base URL ${esc(BASE_URL)}</div>
<table>
  <tr><th>Slug</th><th>Verdict</th><th>Headline · debrief note</th></tr>
  ${rows}
</table>
<div class="aud"><b>Audience cards:</b> ${cards.filter(c => c.type === "audience").map(c => c.slug).join(", ")}</div>
</body></html>
`);

/* ---------------- report ---------------- */

const kb = n => (n / 1024).toFixed(1) + " KB";
console.log(`
  Unveil companion built.

  Deck version   ${version}
  Cards          ${counts.real} real · ${counts.fake} fake · ${counts.audience} audience  (${cards.length} total)
  Bundle         ${rel(path.join(DIST, "index.html"))}  ${kb(Buffer.byteLength(html))}  (deck inlined, works offline)
  QR codes       ${qrCount} SVGs in ${rel(path.join(FACIL, "qr"))}
                 contact sheet: ${rel(path.join(FACIL, "qr-test-sheet.html"))}
  Codes point to ${BASE_URL}#<slug>

  DEPLOY         ${rel(DIST)}/
  DO NOT DEPLOY  ${rel(FACIL)}/   answer key, manifest, QR codes
`);

if (MODE === "dev-lan") {
  console.log(`  ●  DEV BUILD. No BASE_URL set, so the codes point at this machine:
     ${BASE_URL}

     Run  npm run serve  and scan any code from
     ${rel(path.join(FACIL, "qr-test-sheet.html"))} with a phone on the same wifi.
     The certificate is self-signed, so the phone will warn once — tap through it.
     HTTPS is not optional here: the browser refuses to decrypt a card on a
     plain http:// LAN address.

     These codes are for testing only. They stop working the moment this
     machine changes network. Rebuild with your real URL before printing:

       BASE_URL=https://your-deployment/ npm run build
`);
} else if (MODE === "placeholder") {
  console.log(`  ⚠  No BASE_URL, and no LAN address could be detected, so the codes
     point at ${PLACEHOLDER} and resolve nowhere. Set a URL explicitly:

       BASE_URL=https://your-deployment/ npm run build
`);
} else {
  console.log(`  ✓  Codes generated against your deployment URL. Scan one before
     committing 36 cards to print.
`);
}
