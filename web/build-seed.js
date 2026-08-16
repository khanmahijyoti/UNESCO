#!/usr/bin/env node
/* Turns cards.json into ../supabase/seed-cards.sql.

   Content is dollar-quoted rather than escaped, because the headlines are
   full of apostrophes and typographic quotes and one missed escape would
   either break the load or silently corrupt a card.

   Run:  npm run seed        (writes the file)
   Then apply it via the Supabase MCP tools, the SQL editor, or psql. */

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const OUT = path.join(ROOT, "..", "supabase", "seed-cards.sql");

const src = JSON.parse(fs.readFileSync(path.join(ROOT, "cards.json"), "utf8"));
const cards = src.cards;

const TAG = "uv";
const q = v => {
  if (v === null || v === undefined) return "null";
  const s = String(v);
  if (s.includes(`$${TAG}$`)) {
    console.error(`\n  BUILD FAILED: content contains the dollar-quote tag $${TAG}$.\n`);
    process.exit(1);
  }
  return `$${TAG}$${s}$${TAG}$`;
};

const counts = cards.reduce((a, c) => (a[c.type] = (a[c.type] || 0) + 1, a), {});
if (counts.real !== 20 || counts.fake !== 10 || counts.audience !== 6) {
  console.error(`\n  BUILD FAILED: expected 20/10/6, got ${JSON.stringify(counts)}.\n`);
  process.exit(1);
}

const rows = cards.map(c => "  (" + [
  q(c.slug),
  q(c.type),
  c.headline ? q(c.headline) : "null",
  c.clues ? q(JSON.stringify(c.clues)) + "::jsonb" : "null",
  c.whyItWorks ? q(c.whyItWorks) : "null",
  c.verification ? q(JSON.stringify(c.verification)) + "::jsonb" : "null"
].join(", ") + ")").join(",\n");

const sql = `-- ============================================================
-- Unveil — card content seed
-- Generated from web/cards.json by \`npm run seed\`. Do not hand-edit:
-- regenerate instead, or the two will drift apart.
--
-- Content v${src.version || "?"} · language ${src.language || "?"} · ${cards.length} cards
-- (${counts.real} real, ${counts.fake} fake, ${counts.audience} audience)
--
-- Safe to re-run. Existing rows are updated in place, so a text fix
-- reaches live games without disturbing any deal that references a slug.
-- ============================================================

insert into public.cards (slug, type, headline, clues, why_it_works, verification) values
${rows}
on conflict (slug) do update set
  type         = excluded.type,
  headline     = excluded.headline,
  clues        = excluded.clues,
  why_it_works = excluded.why_it_works,
  verification = excluded.verification;

-- Fail loudly rather than let a game start on a half-loaded deck.
do $$
declare r int; f int; a int;
begin
  select count(*) into r from public.cards where type = 'real';
  select count(*) into f from public.cards where type = 'fake';
  select count(*) into a from public.cards where type = 'audience';
  if r <> ${counts.real} or f <> ${counts.fake} or a <> ${counts.audience} then
    raise exception 'card table is %/%/% , expected ${counts.real}/${counts.fake}/${counts.audience}', r, f, a;
  end if;
  if exists (select 1 from public.cards where type <> 'audience' and headline is null) then
    raise exception 'a press card is missing its headline';
  end if;
  -- Clue asymmetry: fabrications carry player-facing clues, verified stories
  -- do not. A real card with clues would hand its journalist an argument the
  -- design deliberately withholds.
  if exists (select 1 from public.cards
              where type = 'fake' and (clues is null or jsonb_array_length(clues) <> 3)) then
    raise exception 'a fabricated card does not have exactly 3 clues';
  end if;
  if exists (select 1 from public.cards where type = 'real' and clues is not null) then
    raise exception 'a verified card carries player-facing clues; they belong in verification';
  end if;
  if exists (select 1 from public.cards
              where type = 'real' and (verification is null or jsonb_array_length(verification) <> 3)) then
    raise exception 'a verified card is missing its 3 facilitator verification notes';
  end if;
  if exists (select 1 from public.cards
              where type = 'audience' and (headline is not null or clues is not null)) then
    raise exception 'an audience card carries content it should not have';
  end if;
  raise notice 'cards loaded: % real, % fake, % audience', r, f, a;
end $$;
`;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, sql);

console.log(`
  Card seed written.

  Output   ${path.relative(path.join(ROOT, ".."), OUT).replace(/\\/g, "/")}  ${(Buffer.byteLength(sql) / 1024).toFixed(1)} KB
  Cards    ${counts.real} real · ${counts.fake} fake · ${counts.audience} audience

  Apply it after supabase/schema.sql. Re-running it is safe — it upserts.
`);
