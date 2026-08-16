#!/usr/bin/env node
require("./env");
/* ============================================================
   Builds the facilitator dealer demo into ../demo/.

   This tool deals a round and shows one QR code per player, so a
   session can be run with no printed cards at all.

   It embeds every slug AND its real/fake type, which makes it the
   answer key in interactive form. It is a FACILITATOR tool and must
   never be deployed or committed.

   Run:  npm run demo
         BASE_URL=https://your-deployment/ npm run demo
   ============================================================ */

const fs = require("fs");
const os = require("os");
const path = require("path");
const QRCode = require("qrcode-svg");

const ROOT = __dirname;
const OUT = path.join(ROOT, "..", "demo");

const PLACEHOLDER = "https://unveil.example/";
const HTTPS_PORT = Number(process.env.PORT || 8070) + 1;

function lanIp() {
  for (const list of Object.values(os.networkInterfaces())) {
    for (const ni of list || []) if (ni.family === "IPv4" && !ni.internal) return ni.address;
  }
  return null;
}
const LAN = lanIp();
const BASE_URL = process.env.BASE_URL || (LAN ? `https://${LAN}:${HTTPS_PORT}/` : PLACEHOLDER);
const MODE = process.env.BASE_URL ? "deployment" : LAN ? "dev-lan" : "placeholder";

const src = JSON.parse(fs.readFileSync(path.join(ROOT, "cards.json"), "utf8"));
const url = slug => BASE_URL.replace(/\/+$/, "") + "/#" + slug;

/* Encode twice: once to learn the module count, once with a width that is an
   exact multiple of it. Integer module coordinates keep the inlined SVG small
   — 36 of them ship inside this one page. */
function qr(content) {
  const probe = new QRCode({ content, padding: 2, ecl: "M" });
  const span = probe.qrcode.modules.length + 4;
  return new QRCode({
    content, padding: 2, width: span * 8, height: span * 8,
    color: "#000000", background: "#ffffff", ecl: "M", join: true, container: "svg-viewbox"
  }).svg().replace(/\s+/g, " ").trim();
}

const cards = src.cards.map(c => ({
  slug: c.slug,
  type: c.type,
  headline: c.headline || null,
  qr: qr(url(c.slug))
}));

const counts = cards.reduce((a, c) => (a[c.type] = (a[c.type] || 0) + 1, a), {});
if (counts.real !== 20 || counts.fake !== 10 || counts.audience !== 6) {
  console.error("\n  BUILD FAILED: expected 20 real / 10 fake / 6 audience.\n");
  process.exit(1);
}

const html = fs.readFileSync(path.join(ROOT, "src", "demo.html"), "utf8")
  .replace("__DATA__", JSON.stringify(cards))
  .replace("__BASEURL__", BASE_URL);

if (html.includes("__DATA__") || html.includes("__BASEURL__")) {
  console.error("\n  BUILD FAILED: placeholder not substituted.\n");
  process.exit(1);
}

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "index.html"), html);
fs.writeFileSync(path.join(OUT, ".gitignore"), "*\n");
fs.writeFileSync(path.join(OUT, "READ-ME-FIRST.txt"),
`UNVEIL — DEALER DEMO
====================

FACILITATOR ONLY. Do not deploy this folder. Do not put it on a shared
drive players can reach. Do not commit it.

index.html contains every card's slug together with whether it is real or
fake. Opening it is equivalent to reading the answer key.

WHAT IT IS
  A dealer. Pick a player count, hit "Shuffle & deal", and it draws the
  correct pool, deals one card per player, and burns one unseen. Each
  player scans their own QR code from the screen. No printed deck needed.

  The burn is real: the page does not tell you what was burned until you
  end the round, so you do not know the exact rogue count either. That is
  deliberate — a facilitator who knows can leak it with a glance.

  Used cards retire for the rest of the session, tracked in your browser.
  "Reset session" puts all 36 back.

CODES POINT AT
  ${BASE_URL}

  If that is a 192.168.x or 172.x address, it only works on your own wifi
  and will break when you change network. Rebuild against your live site:

      BASE_URL=https://your-site.netlify.app/ npm run demo
`);

const kb = n => (n / 1024).toFixed(0) + " KB";
console.log(`
  Unveil dealer demo built.

  Output         demo/index.html  ${kb(Buffer.byteLength(html))}
  Cards embedded ${counts.real} real · ${counts.fake} fake · ${counts.audience} audience
  Codes point to ${BASE_URL}#<slug>   (mode: ${MODE})

  FACILITATOR ONLY — demo/ contains the answer key. Never deploy it.
${MODE !== "deployment" ? `
  ⚠  Not built against a deployment URL. Rebuild before using it with a real
     group:  BASE_URL=https://your-site.netlify.app/ npm run demo
` : ""}`);
