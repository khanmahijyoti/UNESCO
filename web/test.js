#!/usr/bin/env node
/* Verifies the built bundle by running the browser's own decryption path.
   Node 22 exposes the same WebCrypto API the app uses, so this exercises
   the real code path rather than a Node-side reimplementation of it. */

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const src = JSON.parse(fs.readFileSync(path.join(ROOT, "cards.json"), "utf8"));
const bundle = fs.readFileSync(path.join(ROOT, "dist", "index.html"), "utf8");

let fail = 0;
const chk = (ok, msg) => { console.log((ok ? "ok   " : "FAIL ") + msg); if (!ok) fail++; };

/* ---- pull the deck out of the built page exactly as the browser sees it ---- */
const m = bundle.match(/const DECK = (\{.*?\});\n/s);
if (!m) { console.error("FAIL could not find DECK in dist/index.html"); process.exit(1); }
const DECK = JSON.parse(m[1]);

const enc = new TextEncoder();
const unhex = s => new Uint8Array(s.match(/../g).map(h => parseInt(h, 16)));
const unb64 = s => Uint8Array.from(Buffer.from(s, "base64"));
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("");

async function cardId(slug) {
  return hex(await crypto.subtle.digest("SHA-256", enc.encode(slug + "|id"))).slice(0, 16);
}
async function decrypt(slug, payload) {
  const base = await crypto.subtle.importKey("raw", enc.encode(slug), "PBKDF2", false, ["deriveKey"]);
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: unhex(DECK.salt), iterations: DECK.iter, hash: "SHA-256" },
    base, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
  const raw = unb64(payload);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: raw.slice(0, 12) }, key, raw.slice(12));
  return JSON.parse(new TextDecoder().decode(plain));
}

(async () => {
  chk(Object.keys(DECK.cards).length === 36, `deck holds 36 blobs (got ${Object.keys(DECK.cards).length})`);
  chk(!bundle.includes("__DECK__"), "deck placeholder substituted");

  /* every card decrypts with its own slug, and matches source content */
  let okAll = true, roleOk = true, audOk = true;
  for (const c of src.cards) {
    const blob = DECK.cards[await cardId(c.slug)];
    if (!blob) { okAll = false; console.log(`     ${c.slug}: no blob`); continue; }
    let got;
    try { got = await decrypt(c.slug, blob); }
    catch (e) { okAll = false; console.log(`     ${c.slug}: decrypt threw`); continue; }

    if (got.type !== c.type) roleOk = false;
    if (c.type === "audience") {
      if (got.headline || got.clues) audOk = false;
    } else {
      if (got.headline !== c.headline) { okAll = false; console.log(`     ${c.slug}: headline mismatch`); }
      if (JSON.stringify(got.clues) !== JSON.stringify(c.clues)) { okAll = false; console.log(`     ${c.slug}: clue mismatch`); }
    }
  }
  chk(okAll, "all 36 cards decrypt with their own slug and match cards.json");
  chk(roleOk, "every decrypted card reports the correct type");
  chk(audOk, "audience cards carry no headline and no clues");

  /* a slug must not open any other card */
  const a = src.cards[0], b = src.cards[1];
  let crossOpened = false;
  try { await decrypt(a.slug, DECK.cards[await cardId(b.slug)]); crossOpened = true; } catch {}
  chk(!crossOpened, "one card's slug cannot decrypt another card");

  /* an unknown slug finds nothing */
  chk(!DECK.cards[await cardId("ffffff")], "unknown slug resolves to no blob");

  /* nothing sensitive is readable in the shipped bundle */
  const leaks = src.cards.filter(c => c.headline && bundle.includes(c.headline.slice(0, 40)));
  chk(leaks.length === 0, `no plaintext headline in the bundle (${leaks.length} leaked)`);
  const whys = src.cards.filter(c => c.whyItWorks && bundle.includes(c.whyItWorks.slice(0, 40)));
  chk(whys.length === 0, `no facilitator debrief content in the bundle (${whys.length} leaked)`);
  chk(!/"(real|fake)"/.test(bundle.slice(bundle.indexOf("const DECK"), bundle.indexOf("const $ ="))),
      "deck payload contains no real/fake signal");

  /* the payload must not reveal ordering or counts by card type */
  const ids = Object.keys(DECK.cards);
  chk(new Set(ids).size === 36, "all 36 blob ids are distinct");
  const lens = new Set(ids.map(i => i.length));
  chk(lens.size === 1, "blob ids are uniform length");

  /* facilitator material exists and is outside dist/ */
  chk(fs.existsSync(path.join(ROOT, "facilitator", "answer-key.html")), "answer key generated");
  chk(fs.existsSync(path.join(ROOT, "facilitator", "print-manifest.csv")), "print manifest generated");
  chk(fs.readdirSync(path.join(ROOT, "facilitator", "qr")).length === 36, "36 QR codes generated");
  const distFiles = fs.readdirSync(path.join(ROOT, "dist"));
  chk(!distFiles.some(f => /answer|manifest|qr/i.test(f)), "no facilitator material inside dist/");

  /* the app hides clues when backgrounded */
  chk(bundle.includes("visibilitychange"), "clue panel hides on visibilitychange");

  /* ---- do the QR codes actually scan to the right place? ----
     Re-encode each manifest URL, rasterise the module matrix, and read it
     back with a real QR decoder. This is the check that catches a code
     pointing at the wrong URL before 36 of them are printed. */
  const QRCode = require("qrcode-svg");
  const jsQR = require("jsqr");

  const manifest = fs.readFileSync(path.join(ROOT, "facilitator", "print-manifest.csv"), "utf8")
    .trim().split("\n").slice(1)
    .map(line => { const p = line.split(","); return { slug: p[0], type: p[1], file: p[2], url: p[3] }; });

  chk(manifest.length === 36, `manifest lists 36 cards (got ${manifest.length})`);

  function rasterise(modules, scale = 6, quiet = 4) {
    const n = modules.length;
    const size = (n + quiet * 2) * scale;
    const px = new Uint8ClampedArray(size * size * 4).fill(255);
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      if (!modules[r][c]) continue;
      for (let dy = 0; dy < scale; dy++) for (let dx = 0; dx < scale; dx++) {
        const y = (r + quiet) * scale + dy, x = (c + quiet) * scale + dx;
        const i = (y * size + x) * 4;
        px[i] = px[i + 1] = px[i + 2] = 0;
      }
    }
    return { px, size };
  }

  let decoded = 0, mismatched = [], svgBad = [];
  for (const row of manifest) {
    const q = new QRCode({ content: row.url, padding: 2, width: 256, height: 256,
                           color: "#000000", background: "#ffffff", ecl: "M",
                           join: true, container: "svg-viewbox" });
    const { px, size } = rasterise(q.qrcode.modules);
    const got = jsQR(px, size, size);
    if (!got) { mismatched.push(`${row.slug}: undecodable`); continue; }
    if (got.data !== row.url) { mismatched.push(`${row.slug}: "${got.data}" != "${row.url}"`); continue; }
    decoded++;

    /* Tie the decoded matrix to the artifact actually on disk: the same
       options must reproduce the file byte for byte. Decode proves the
       matrix is right; this proves the shipped svg is that matrix. */
    const svgPath = path.join(ROOT, "facilitator", row.file);
    if (!fs.existsSync(svgPath)) { svgBad.push(`${row.slug}: missing svg`); continue; }
    if (fs.readFileSync(svgPath, "utf8") !== q.svg()) svgBad.push(`${row.slug}: svg on disk differs from re-encode`);
  }
  mismatched.slice(0, 3).forEach(m => console.log("     " + m));
  svgBad.slice(0, 3).forEach(m => console.log("     " + m));
  chk(decoded === 36, `all 36 QR codes decode to their manifest URL (${decoded}/36)`);
  chk(svgBad.length === 0, "every QR svg on disk matches its module matrix");

  /* the decoded URL must actually route: base + "#" + slug */
  const bad = manifest.filter(r => !r.url.endsWith("#" + r.slug));
  chk(bad.length === 0, `every code encodes its own slug as the fragment (${bad.length} bad)`);

  const hosts = new Set(manifest.map(r => r.url.split("#")[0]));
  chk(hosts.size === 1, `all codes share one base URL (${[...hosts][0]})`);
  chk(!/unveil\.example/.test([...hosts][0]),
      "base URL is not the dead placeholder");

  console.log(fail === 0 ? "\nALL CHECKS PASSED" : `\n${fail} CHECK(S) FAILED`);
  process.exit(fail === 0 ? 0 : 1);
})();
