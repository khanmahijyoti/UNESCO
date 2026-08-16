#!/usr/bin/env node
require("./env");
/* End-to-end test of the room system through PostgREST with the publishable
   key — the same path the browser takes, including anonymous sign-in.
   The earlier in-database test proved the policies; this proves the API
   surface players actually touch.

   Run:  SUPABASE_URL=... SUPABASE_KEY=... node test-room.js            */

const { createClient } = require("@supabase/supabase-js");

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_KEY;
if (!URL || !KEY) { console.error("set SUPABASE_URL and SUPABASE_KEY"); process.exit(1); }

let fail = 0;
const chk = (ok, m) => { console.log((ok ? "ok   " : "FAIL ") + m); if (!ok) fail++; };

const client = () => createClient(URL, KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function anon(label) {
  const c = client();
  const { data, error } = await c.auth.signInAnonymously();
  if (error) throw new Error(`anonymous sign-in failed (${label}): ${error.message}`);
  return { c, uid: data.user.id, label };
}

(async () => {
  let A;
  try {
    A = await anon("host");
  } catch (e) {
    console.log("FAIL " + e.message);
    console.log("\nEnable it: Supabase dashboard -> Authentication -> Sign In / Providers -> Anonymous");
    process.exit(1);
  }
  chk(true, "anonymous sign-in works");

  const [B, C, D] = await Promise.all([anon("b"), anon("c"), anon("d")]);
  chk(new Set([A.uid, B.uid, C.uid, D.uid]).size === 4, "four distinct anonymous users");

  // ---- create ----
  const { data: made, error: cerr } = await A.c.rpc("create_room", { p_name: "Ana" });
  chk(!cerr, "host creates a room" + (cerr ? ` (${cerr.message})` : ""));
  if (cerr) process.exit(1);
  const row = Array.isArray(made) ? made[0] : made;
  const code = row.code, roomId = row.room_id;
  chk(/^[A-Z2-9]{4}$/.test(code), `room code is 4 unambiguous chars (${code})`);

  // ---- an outsider must not be able to peek by code ----
  const O = await anon("outsider");
  const { data: peek } = await O.c.rpc("room_snapshot", { p_code: code });
  chk(!peek, "a non-member gets nothing from room_snapshot");
  const { data: oRooms } = await O.c.from("rooms").select("*");
  chk((oRooms || []).length === 0, "a non-member sees no rooms at all");

  // ---- join ----
  for (const [p, name] of [[B, "Ben"], [C, "Cal"], [D, "Dee"]]) {
    const { error } = await p.c.rpc("join_room", { p_code: code, p_name: name });
    if (error) { chk(false, `${name} joins (${error.message})`); process.exit(1); }
  }
  chk(true, "three players join with the code");

  const { data: snap } = await C.c.rpc("room_snapshot", { p_code: code });
  chk(snap && snap.players.length === 4, "a member sees all four players");
  chk(snap && snap.you_are_host === false, "a joiner is not flagged as host");
  const { data: hsnap } = await A.c.rpc("room_snapshot", { p_code: code });
  chk(hsnap && hsnap.you_are_host === true, "the creator is flagged as host");

  // ---- rejoin must be idempotent ----
  const { data: re } = await C.c.rpc("join_room", { p_code: code, p_name: "Cal" });
  chk(re && (Array.isArray(re) ? re[0] : re).rejoined === true, "rejoining returns the same seat");
  const { data: snap2 } = await C.c.rpc("room_snapshot", { p_code: code });
  chk(snap2.players.length === 4, "rejoining does not duplicate the player");

  // ---- only the host may deal ----
  const { error: nherr } = await D.c.rpc("start_round", { p_room: roomId });
  chk(!!nherr, "a non-host cannot start the round");

  const { error: serr } = await A.c.rpc("start_round", { p_room: roomId });
  chk(!serr, "the host starts the round" + (serr ? ` (${serr.message})` : ""));

  // ---- each player sees exactly one card: their own ----
  const { data: rounds } = await B.c.from("rounds").select("id").eq("room_id", roomId);
  chk((rounds || []).length === 1, "members can read the round row");
  const roundId = rounds[0].id;

  const seen = [];
  for (const p of [A, B, C, D]) {
    const { data: mine } = await p.c.rpc("get_my_card", { p_round: roundId });
    const cd = Array.isArray(mine) ? mine[0] : mine;
    if (!cd) { chk(false, `${p.label} got no card`); continue; }
    seen.push(cd);
    const { data: allDeals } = await p.c.from("deals").select("*").eq("round_id", roundId);
    if ((allDeals || []).length !== 1) {
      chk(false, `${p.label} can see ${(allDeals || []).length} deals (must be 1)`);
    }
  }
  chk(seen.length === 4, "all four players receive a card");
  chk(new Set(seen.map(c => c.slug)).size === 4, "no two players hold the same card");
  chk(new Set(seen.map(c => c.seat)).size === 4, "seats are unique");
  chk(seen.filter(c => c.card_type === "fake").length >= 1,
      `at least one rogue is in play (${seen.filter(c => c.card_type === "fake").length})`);
  chk(seen.every(c => c.card_type === "audience" || c.headline),
      "every press card arrives with a headline");

  // Clue asymmetry: only fabrications carry player-facing clues. A real card
  // arriving with clues would hand its journalist an argument the design
  // deliberately withholds — and verification notes must never reach a player.
  const reals = seen.filter(c => c.card_type === "real");
  const fakes = seen.filter(c => c.card_type === "fake");
  chk(reals.every(c => !c.clues || c.clues.length === 0),
      `real cards reach the player with no clues (${reals.length} dealt)`);
  chk(fakes.every(c => c.clues && c.clues.length === 3),
      `fake cards reach the player with 3 clues (${fakes.length} dealt)`);
  chk(seen.every(c => !("verification" in c) && !("why_it_works" in c)),
      "no facilitator-only field is returned by get_my_card");

  // ---- the secrets stay secret ----
  const { data: allCards, error: cardErr } = await B.c.from("cards").select("*");
  chk(!!cardErr || (allCards || []).length === 0,
      "the cards table is unreadable over the API");
  const { data: burn, error: burnErr } = await A.c.from("round_secrets").select("*");
  chk(!!burnErr || (burn || []).length === 0,
      "even the host cannot read the burned card");

  // ---- a joiner cannot enter once play has begun ----
  const E = await anon("late");
  const { error: lateErr } = await E.c.rpc("join_room", { p_code: code, p_name: "Eve" });
  chk(!!lateErr, "a newcomer cannot join a game in progress");

  // ---- anon (signed out) must reach nothing ----
  const raw = client();
  const { error: rawErr } = await raw.rpc("create_room", { p_name: "Nobody" });
  chk(!!rawErr, "a signed-out caller cannot create a room");

  console.log("\n" + (fail === 0 ? "ALL CHECKS PASSED" : `${fail} CHECK(S) FAILED`));
  console.log(`(test room ${code} left in the database; it expires with cleanup)`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error("\nunexpected: " + e.message); process.exit(1); });
