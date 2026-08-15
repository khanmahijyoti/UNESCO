# Unveil — print & assembly

Two files, no build step, no dependencies. Open either in a browser and press **Ctrl/Cmd + P**.

| File | What it makes |
| --- | --- |
| `unveil-deck.html` | The 72 deck pieces + the facilitator answer key |
| `unveil-play-kit.html` | Vote slips, player rules cards, dealer card, score sheet |

Paper is **A4**. For US Letter, change `size: A4` to `size: Letter` in the `@page` rule at the top of each file — it's the first thing in the `<style>` block in both.

---

## 1. Print settings

Get these right or the pairs won't fit the sleeves:

* **Scale: 100%** / "Actual size". **Never "Fit to page"** — it silently resizes every card.
* **Margins: none or minimum.**
* **Single-sided.** Backs come from opaque sleeves, not from printing. No duplex alignment to fight.
* **Background graphics: off** for the deck, **on** for the play kit (the dealer card has a dark warning label).
* Card stock if you have it, ordinary paper if you don't — sleeves make thin paper work fine for a playtest.

### Pages

**`unveil-deck.html`**

| Pages | Contents | Size |
| --- | --- | --- |
| 1–3 | 36 headline slips (30 stories + 6 blanks) | 70 × 45 mm, 12/page |
| 4–12 | 36 clue & audience cards | 70 × 120 mm, 4/page |
| 13 | **Facilitator answer key** | — |

> **Print page 13 separately, or at least collect it first.** It is the whole deck in one table. Don't leave it in the output tray.

**`unveil-play-kit.html`** — pages 1–2 vote slips (4/page), page 3 player rules cards (4/page), page 4 dealer card (print **one**), page 5 score sheet.

Vote slips are consumed **one per player per play**. A 5-player, 2-play workshop needs 10 — one page and a half. Print both pages.

---

## 2. Assembly

**72 pieces total:** 30 headline slips + 30 clue cards + 6 audience cards + 6 blank slips. Plus **36 opaque sleeves**, one per pair.

Cut on the dashed lines.

### Pairing is a zip, not a lookup

The slips and the clue cards are generated from the same shuffled order, so **the Nth slip in print order matches the Nth clue card in print order.** Keep both stacks in the order they came out of the printer and pair them off in sequence — slip 1 with card 1, slip 2 with card 2, all the way down. No answer-key cross-referencing.

If a stack gets shuffled before you sleeve it, fall back to the answer key: match the slip's headline text to its code, then find the clue card with that code.

1. Slide each pair into one sleeve — **clue card behind, headline slip in front**, so a player peeking sees the headline first and has to deliberately look past it for the role.
2. Sleeve each audience card with a blank "No story to publish" slip. Audience players must hold a pair of identical thickness or hand size gives them away at the deal.
3. Sort the 36 sleeved pairs into **three labelled envelopes** by reading the clue-card footer:
   * **Real Press — 20** (footer reads `Real Press`)
   * **Rogue Press — 10** (footer reads `Rogue Press`)
   * **Audience — 6**

The role word in the footer is the only thing distinguishing a Real card from a Rogue one. Sorting takes about five minutes.

---

## 3. Before the first play — check these four things

1. **Hold a Real clue card and a Rogue clue card side by side at arm's length.** If you can tell which is which without reading the footer, something is wrong with your printer, not the design. Nothing in the stylesheet branches on card type; there is deliberately no `.real` or `.rogue` selector in the file.
2. **Fan the sleeved pairs face-down.** They must be indistinguishable — same thickness, same edges.
3. **Check a headline slip is readable across the width of your table.** If not, print the deck at a larger paper size rather than shrinking the type.
4. **Put the answer key and the dealer card somewhere players will not walk past.** Together they are the entire game.

---

## 4. Two things the printed materials do differently from `Unveil_MVP.md`

Both were changes made during generation. The doc has not been updated to match.

**The headline slip carries no pairing code.** §1 of the doc puts the code on both halves of the pair. But the slip sits face-up on the table for the entire play, which makes any token on it memorisable across sessions by a repeat player. The code now lives on the clue card only, and re-pairing works off the headline instead — which the answer key already supports.

**The uniform footer is printed on the headline slips too.** The doc specifies it for "every clue card and audience card." The slip is the only *public* component and therefore the one most likely to be photographed out of context, so it is the piece that most needs the line. It's on all 72.

---

## 5. Still open in `Unveil_MVP.md`

The printed materials implement the corrected behaviour; **the doc still states the old version.** Sync it before anyone else reads it.

* **§5's binding-stack table is inverted.** Rogue is the constraint at nearly every player count, not Real. The dealer card here carries the corrected figures: 4–6 players ≈ 6 plays, 7 ≈ 4, 8–9 ≈ 3 (audience binds), 10 ≈ 3.
* **The 1,000-point evening target is unreachable at 7+ players** — you run out of Rogue cards around play 3. The dealer card says cap at 800. The real fix is expanding the Fake database from 10 entries to ~16.
* **§1 line 34 says "66 pieces."** It's 72 — the count omits the 6 dummy slips introduced nine lines earlier.
* **§5 line 206 turns the burned card face-up at cleanup.** The dealer card instructs filing it privately instead; revealing it confirms the exact composition of the play that just ended.

None of these block Playtest 1.
