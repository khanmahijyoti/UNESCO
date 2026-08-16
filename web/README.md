# Unveil — digital companion

The QR target for the physical Unveil deck. A player scans the code on their card and lands on a page showing their headline publicly and their three clues privately.

**It is a static site.** No server, no database, no accounts, no realtime. One HTML file, 37 KB, that works with the venue wifi switched off.

Voting, scoring, and the reveal all stay on paper at the table. This app never knows the game state and never needs to.

---

## Quick start

```bash
npm install
npm run serve      # builds, then previews at http://localhost:8080
npm test           # verifies the built bundle
```

`serve` prints three ready-made card URLs — one real, one fake, one audience — so you can see all three views immediately.

> **Localhost or HTTPS only.** Card contents are encrypted, and browsers refuse WebCrypto on an insecure origin. Opening `dist/index.html` straight off disk shows an explanatory error page rather than failing silently.

---

## Two products in one build

| | What it is | Needs |
| --- | --- | --- |
| `dist/index.html` | **QR companion.** Scan a printed card, get its headline and private clues. Static, offline, no server. | nothing |
| `dist/room.html` | **Room system.** Host opens a game, shares a link, players join on their own devices, host deals. | Supabase |

They are independent. `room.html` is only emitted when `SUPABASE_URL` and `SUPABASE_KEY` are set; the companion builds either way.

```bash
SUPABASE_URL=https://rtruzqnfhbaamjtsyzwd.supabase.co \
SUPABASE_KEY=sb_publishable_... \
BASE_URL=https://your-site.netlify.app/ \
npm run build
```

`SUPABASE_KEY` must be the **publishable** key. It is public by design and belongs in the client. The build refuses to emit a bundle containing a `service_role` key.

### Room system setup, in order

1. Apply `../supabase/schema.sql` (tables, RLS, RPCs).
2. Apply `../supabase/seed-cards.sql` (`npm run seed` regenerates it from `cards.json`).
3. **Enable anonymous sign-in** — Authentication → Sign In / Providers → Anonymous. Every RLS policy keys off `auth.uid()` and players should not need accounts. Nothing works until this is on.
4. `npm run test:room` to verify the whole flow end to end.

### How the secrets stay secret

Roles are assigned inside a `SECURITY DEFINER` function; the client never deals. Row-level security means a player who queries every table they can reach sees **exactly one** deal row — their own. The `cards` and `round_secrets` tables have no select policy at all, so card text arrives only through `get_my_card()`, and the burned card is unreadable **by everyone, the host included**.

---

## Scanning a code right now, before you have a deployment

With no `BASE_URL` set, the build points every QR code at **this machine's LAN address over HTTPS** — so the codes it generates are immediately scannable from a phone.

```bash
npm run serve
```

Then open `facilitator/qr-test-sheet.html` — all 36 codes on one page, labelled — and scan any of them with a phone on the same wifi.

**Your phone will warn about the certificate once.** It's self-signed, generated locally into `.cert/`. Tap *Advanced* → proceed. It's your own machine.

HTTPS is not optional here, and this is the part that catches people out: `http://192.168.x.x` is **not a secure context**, so the browser refuses to run the decryption and you land on the app's HTTPS error page instead of your card. `localhost` is exempt, which is why the desktop URLs stay on plain http.

These codes are for testing only — they die the moment the machine changes network. The build prints `DEV BUILD` whenever it's in this mode so it can't be mistaken for a printable set.

---

## Before the deck goes to print — do this once

The QR codes encode a full URL, so they cannot be generated until you know where the site lives. **Deploy first, then generate codes.**

```bash
BASE_URL=https://your-real-deployment/ npm run build
```

The build warns loudly while `BASE_URL` is still the placeholder. Codes generated with the placeholder point nowhere.

Getting this wrong is the single most expensive mistake available here: it is discovered after the cards are printed, and the only fix is reprinting them.

---

## Deploy

Upload `dist/` to any static host — Netlify, Vercel, GitHub Pages, Cloudflare Pages, or a plain web server. There is no runtime to provision.

Two rules:

1. **Deploy `dist/` only.** Never `facilitator/`, never `cards.json`.
2. **HTTPS.** Required for decryption, and every host above provides it by default.

### Netlify (recommended)

`netlify.toml` is included and already pins `publish = "dist"`, which is the setting that matters — publishing the repo root instead would expose the answer key and every headline in plaintext.

Either drag `dist/` onto the Netlify dashboard, or connect the repo and let it build. Then:

1. **Rename the site before generating QR codes.** Netlify assigns something like `spontaneous-tapioca-4f1c.netlify.app`. Renaming after the deck is printed breaks all 36 cards. Set the final name — or attach a custom domain — first.
2. Regenerate codes locally against that URL:
   ```bash
   BASE_URL=https://your-site.netlify.app/ npm run build
   ```
3. Take `facilitator/qr/*.svg` to the print team.

**You do not need to redeploy after step 2.** `dist/index.html` is byte-identical regardless of `BASE_URL` — that variable only affects the QR codes, the print manifest and the answer key, none of which are deployed. So deploy once, claim the URL, and generate codes afterwards.

**Shorter URL, easier scan.** A custom domain is worth it if the printed codes will be small: `unveil.example/#4a9f2c` fits in a 29×29 module code, while a long default subdomain pushes it to 33×33 — denser, and harder for a phone to read at 20 mm on a card under workshop lighting.

**Repo visibility.** If you let Netlify build from git, `cards.json` must be committed — it's the build input. It contains every headline and every real/fake verdict in plaintext, so **the repo must be private**. `.gitignore` already excludes `dist/`, `facilitator/`, `.cert/` and `node_modules/`, but not `cards.json`, because the build needs it. If the repo has to be public, don't connect it — build locally and drag `dist/` to Netlify instead.

`dist/_headers` sets `noindex` for hosts that honour it (Netlify, Cloudflare Pages). On other hosts the same is achieved by the `<meta name="robots">` tag already in the page.

---

## What the physical-deck team needs from you

Everything they need is in `facilitator/` after a build with the real `BASE_URL`:

| File | What it's for |
| --- | --- |
| `qr/<slug>.svg` | 36 QR codes, one per card. Vector — scales to any card size without blurring. |
| `print-manifest.csv` | `slug, type, qr_file, url, headline` — which code goes on which card. |
| `qr-test-sheet.html` | All 36 codes on one labelled page, for scan-testing before committing to print. |
| `answer-key.html` | Facilitator reference. Print it, keep it off the table. **Not for the print team.** |

Tell them three things:

- **Every card carries a QR code and nothing else that differs.** Same stock, same layout, same typography. A Real Press card and a Rogue Press card must be indistinguishable face-up, or the deduction layer is gone. Whatever marks the role belongs on the *screen*, not the card.
- **Error correction is level M.** The code survives a small logo or a rounded corner crop, not a large one. If they want to overlay artwork, ask first.
- **Print at 20 mm square or larger.** Below that, phone cameras start failing at typical table lighting.

---

## Editing content

`cards.json` is the single source of truth. Change headline or clue text freely, rebuild, redeploy — **the printed cards keep working**, because the slug is what's printed, not the content. That's the whole reason this exists: after Playtest 1 you will be tuning clue strength, and on paper every tune is a reprint.

**Slugs are permanent.** A slug is baked into a printed QR code the moment the deck goes to press. Never edit one, never reuse a retired one. The build refuses duplicates and malformed slugs.

The build also enforces the deck architecture — 20 real, 10 fake, 6 audience, exactly 3 clues per press card — and fails rather than shipping a deck that doesn't match.

---

## How it works, and why

**Hash routing** (`…/#4a9f2c`). Works on every static host with zero rewrite configuration. No 404s, no per-card files.

**The whole deck is inlined into one HTML file.** Scan any card once and every other card in the deck is already on the device. Combined with the service worker, the network is needed exactly once per phone, during setup, while you're explaining the rules.

**Each card is encrypted under a key derived from its own slug.** The payload is 36 opaque blobs keyed by `sha256(slug)` — no manifest, no ordering, no real/fake signal. A player who opens view-source learns nothing; a player who scans a card decrypts that card and nothing else. Verified in `npm test`, including that one card's slug cannot open another's.

*This defeats a curious player, which is the actual threat. It is not a defence against someone who takes the bundle away and spends real compute on a 24-bit slug space — that trade buys lower QR density. The thing that genuinely needs protecting is `facilitator/`.*

**Facilitator debrief content never ships.** The `whyItWorks` analysis on each fabricated card would mark it as fake, so the build strips it from the player payload and fails the build if it ever appears there.

**The clue panel hides itself when the page is backgrounded** — so clues never surface in an app-switcher thumbnail, and a player can hand their phone over without a second thought.

**The QR codes are verified by decoding them.** `npm test` rasterises every generated code's module matrix, reads it back with a real QR decoder, and asserts it resolves to that card's URL — then confirms the SVG on disk is byte-identical to that verified matrix. A code pointing at the wrong place is caught here rather than after 36 cards are printed.

---

## Layout

```
web/
  cards.json          source content — never deployed; see repo-visibility note below
  build.js            encrypt, inline, emit QR + manifest + answer key
  test.js             verifies the built bundle via the browser's own crypto path
  serve.js            localhost preview (secure context for WebCrypto)
  src/app.html        the app; __DECK__ is substituted at build time
  src/sw.js           offline cache
  dist/               ← DEPLOY THIS
  facilitator/        ← NEVER DEPLOY OR COMMIT THIS
```

`.gitignore` already excludes `dist/`, `facilitator/`, and `node_modules/`.

---

## Known limits

- **No graceful degradation.** A player who cannot scan has no clues and cannot pitch. Keep a printed clue-card set as the facilitator's backup — `../print/unveil-deck.html` generates one.
- **The app has no game state.** It cannot enforce turn order, collect votes, or score. That is deliberate; all of it stays on paper.
- **One language per build.** `cards.json` carries a `language` field and the structure supports a second deck, but nothing switches at runtime yet. Adding it means one build per language and a language picker keyed off the slug — worth doing before any multi-language workshop, not before Playtest 1.
