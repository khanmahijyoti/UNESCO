# Unveil — MVP Build Plan (v2)

*Supersedes the card architecture, scoring, and digital-companion sections of the original design document. The Real and Fake News databases carry over unchanged except where noted in §8.*

---

## 0. What the MVP is

A **paper-only** hidden-role deduction game for 4–10 players, playable in 45 minutes, built to be printed at home and tested this week.

There is **no app and no QR code in the MVP.** The digital companion was the only hard part of the build and it bought nothing the cards can't do. It also introduced two failure points that couldn't be solved: first-load connectivity for ten phones on venue wifi, and static slugs that leak the deck permanently across sessions.

Build the software once the scoring numbers have survived two playtests. Every rebalance before that is a reprint either way.

---

## 1. Card anatomy

**This is the change that matters most.** In the original mockup the role was printed on both faces in 60pt type with colour-coded borders. There is no orientation in which that deck can sit on a table without every role being public, which removes bluffing, voting, and the entire deduction layer.

### The press card is a pair

Each of the 30 press cards splits into **two components, sleeved together as one unit**:

| Component | Contents | Status |
| ----- | ----- | ----- |
| **Headline slip** | Headline only. No clues, no role, no card ID. | Laid **face-up on the table** when the journalist's turn begins. |
| **Clue card** | Role, three clues, pairing code. | **Never shown** until the end-of-play reveal. |

This replaces read-aloud. Reading the headline twice into a room of ten people guarantees mishearings, and a mishearing gets scored as a judgement error — which quietly corrupts the exact measurement Playtest 2 exists to make. Laying the slip down also builds a running public record of the play, which makes voting and scoring easier.

Headline slips must be **identical in format across Real and Rogue** — same stock, same size, same type, same margins.

### Every component, all 66 pieces

| Surface | Contents |
| ----- | ----- |
| **Back** | One uniform design across every headline slip, clue card, and audience card. No colour coding, no icon variation, no text. |
| **Face** | Content. Private until played or revealed. |

Sleeved pairs are dealt **face-down**. Each player peeks at their own, the way you'd peek at a role card in Werewolf or Avalon. At end of play, everyone flips their clue card face-up simultaneously — the role is printed there, so no separate reveal mechanism is needed.

### The audience card gets a dummy slip

Audience players must also hold a sleeved pair, or hand size gives them away at deal time. Their second component is a blank slip reading *"No story to publish"* which is never laid down.

Their turn being skipped reveals them anyway — but at *their* turn, not at setup. Early knowledge of who cannot be a rogue changes everyone's vote arithmetic from the first pitch onward.

### Pairing codes

Each pair carries a matching **two-character code** (`K7`, `Q2`, `M4`…) drawn from a scrambled set, printed small on both the slip and the clue card. It exists only so the facilitator can re-pair the deck at cleanup.

The code must be **opaque**. Do not use `R-07` / `F-03`, and do not number Reals 01–20 and Rogues 21–30 — the slip is public, so any structured ID published on it hands the table the answer.

### Footer line — uniform across all 36

```
UNVEIL · MIL TRAINING DECK
```

Printed identically on every clue card and audience card. **The `FABRICATED — TRAINING MATERIAL` marker is removed.**

That marker was written for a digital page, where a screenshot of a headline URL circulates as apparent news. A card in someone's hand doesn't. Present on 10 cards and absent on 20, it was a distinguishing mark — the same failure class as the `SCAN TO VERIFY?` question mark, and one that any player who glimpses two cards learns permanently. It was also redundant, since the clue card already reads ROGUE PRESS in the footer. A uniform line gives a photographed card its context without giving the deck a tell.

### What must never differ between Real and Rogue

- No `SCAN TO VERIFY` vs `SCAN TO VERIFY?`.
- No decorative treatment on one and not the other. (The original coffee card got a rubber-stamp `EXPORT BAN` graphic; the hospital card got a photo.)
- Same fonts, same rules, same clue block geometry, same paper, same footer.

**A fabrication must be visually indistinguishable from verified journalism.** That is the premise of the game.

### Physical spec

- **Clue cards: 70 × 120 mm (tarot).** The revised clue text is longer than the original; at poker size the clue block lands around 5pt. If you're committed to poker size, cut every clue to 22 words.
- **Headline slips: 70 × 45 mm**, or whatever holds the longest headline at readable size across a table.
- **Print faces single-sided and sleeve them in opaque sleeves.** One sleeve per pair. This is the practical route for a first playtest — no duplex alignment, no bleed-through on thin stock, and the sleeve is what keeps the pair together. Printed backs are a v2 concern.
- Colour identity (green / red / blue) moves to the **box, rulebook, score sheet, and vote slips**. Keep the shield, mask, and eyes iconography — it's good, it just can't live on the cards.

---

## 2. Setup

The deck lives in **three separate labelled stacks**: Real Press (20 pairs), Rogue Press (10 pairs), Audience (6). Once combined and shuffled they're anonymous, because the backs are uniform — but the dealer needs distinguishable stacks to build a composition at all.

### Build one extra, burn one unseen

1. Draw the **build composition** for your player count, blind, from each stack.
2. Shuffle the build together.
3. Deal one pair to each player.
4. **Burn the remaining card face-down, unseen by anyone**, including the dealer.

The burn is the randomiser. It replaces the d6 from v1, which had a hole in it: the d6 existed to stop players deducing the rogue count, but the dealer rolled it, so the dealer alone knew the exact number while everyone else knew only a range. A blind burn makes the composition uncertain **to the dealer too**.

The dealer still knows the pool, so the advantage is reduced rather than eliminated — but it now costs one card and no rules overhead.

### Build table — dealer only

| Players | Build (cards drawn) | Rogue | Audience | Real | Dealt rogue range |
| ----- | ----- | ----- | ----- | ----- | ----- |
| 4 | 5 | 2 | 0 | 3 | 1–2 |
| 5 | 6 | 2 | 1 | 3 | 1–2 |
| 6 | 7 | 2 | 1 | 4 | 1–2 |
| 7 | 8 | 3 | 1 | 4 | 2–3 |
| 8 | 9 | 3 | 2 | 4 | 2–3 |
| 9 | 10 | 3 | 2 | 5 | 2–3 |
| 10 | 11 | 4 | 2 | 5 | 3–4 |

Rogue counts in the build are set so that **burning any single card still leaves at least one rogue in play.** A rogue-free play is not a possible outcome.

**This table belongs in a dealer-only section of the rulebook.** Publishing it to players contradicts the reason the burn exists: if the composition is public and fixed, deduction becomes arithmetic — at 4 players, once three stories land as credible, the fourth is fake by subtraction and nobody had to evaluate anything. Counting is not media literacy. Players are told only that at least one rogue is always present and that the exact number varies.

**Randomise the starting player each play.** Later presenters face a table holding more information; a fixed seat order makes that a permanent positional advantage.

### Who deals

**In a workshop, the facilitator builds the deck and does not play.** The workshop minimum is therefore **5 attendees** — four players plus a facilitator.

**In casual play, and in 4-player games with no fifth person, the dealer plays.** The burn makes this tolerable: the dealer knows the pool but not the deal. Rotate the dealer every play regardless.

---

## 3. Play

1. **Peek.** Everyone reads their own pair, held close.
2. **Turns proceed around the table** from a randomly chosen start.
3. **Audience turns are skipped.** No penalty, no reveal.
4. **A journalist's turn:**
   - Lays their **headline slip face-up** in the centre, where it stays for the rest of the play.
   - Pitches, using the three clues as ammunition. Quoting, paraphrasing and inventing around them are all legal. The clues are not a script.
   - The table has **90 seconds** of questions.
5. **Vote.** Everyone except the presenter votes simultaneously — thumbs up/down on a three-count, so nobody follows the room.
6. **Strict majority publishes. Ties reject.**
7. Each player records their own vote on their own slip. Move to the next player.

---

## 4. Scoring

Reveal happens once, after every player has taken a turn: everyone flips their clue card face-up at the same time. Scoring is **individual and per headline** — every story is scored, published or not.

### Voter scoring

| The story was… | You voted **Publish** | You voted **Reject** |
| ----- | ----- | ----- |
| **Real** | **+50** — you recognised verified journalism | **0** — you suppressed the truth |
| **Fake** | **0** — you fell for it | **+75** — you caught the fabrication |

You are scored on your own judgement, not on the outcome of the vote. Being outvoted while right still pays.

**The +75 is deliberate.** Under a flat +50 the base rate rewarded credulity: at 5 players a voter who published everything without thinking banked roughly three-quarters of the maximum for zero thought, in a game whose premise is that credulity should cost you. This is worst at 4–5 players, which is exactly where you'll playtest.

### Journalist scoring

| Role | Published | Rejected |
| ----- | ----- | ----- |
| **Real Journalist** | **+100** | **0** |
| **Rogue Journalist** | **+150** | **0** |

### Audience service bonus: +50 per play

An Audience player scores **+50 flat** for the play, on top of their votes.

Without it the deal itself is worth about 50 points before anyone thinks. Ceilings at 5 players:

| Role | Voter ceiling | Pitch | Total |
| ----- | ----- | ----- | ----- |
| Audience | 3×50 + 75 = 225 | — | **225** |
| Real Journalist | 2×50 + 75 = 175 | +100 | **275** |
| Rogue Journalist | 3×50 = 150 | +150 | **300** |

The Audience player is capped below a Real Journalist whose +100 is largely a function of whether the table is credulous, not of skill. The flat +50 brings the Audience ceiling to 275, level with a Real Journalist, and Rogue stays highest because its bonus is conditional on the hardest task at the table.

It does raise the Audience *floor* to 50 against a Real Journalist's floor of 0. That's the intended trade: you were denied all agency by the deal and compensated for it.

*Alternative if playtesting shows Audience is still weak: score Audience votes at 1.5× instead. Thematically sharper — the public watchdog is the role the game is about — but it adds arithmetic at the table.*

### Vote tracking — score your neighbour's slip

Each player gets a slip per play:

| # | Headline (short) | My vote | Truth | Points |
| --- | --- | --- | --- | --- |
| 1 |  | P / R |  |  |
| 2 |  | P / R |  |  |
| … |  |  |  | **Total** |

Fill the vote column during play. **At reveal, pass slips one seat left.** The table calls out each card's true nature in turn; you fill in the Truth column and score your neighbour's slip, not your own. Votes were public thumbs, so there's nothing to conceal — this just removes the incentive to fudge arithmetic in casual play, where no facilitator is watching.

Announce one total per player. The facilitator records one number.

### Worked example — 5 players, 1 rogue, 1 audience

> **Dana (Real)** lays the goldfish headline. Vote: 3 Publish, 1 Reject → published. The three Publish voters take +50; the Reject voter takes 0. Dana takes +100.
>
> **Kwame (Rogue)** lays the Brazil coffee headline. Vote: 2 Publish, 2 Reject → tie, rejected. The two Reject voters take +75; the two Publish voters take 0. Kwame takes 0 for the pitch — but he banked +50 as a voter on Dana's turn.
>
> **Priya (Audience)** pitched nothing, voted on all four stories, and takes +50 for serving.

---

## 5. Session structure

### Retire everything dealt

**All dealt cards — press pairs and audience cards — are set aside for the rest of the session.** The burned card is turned face-up at cleanup and returned to its stack; nobody saw it during play, so it carries no information.

A redealt headline is a dead card: the reveal just made its true nature public, so whoever remembers it wins for free, and the memory advantage compounds. Retiring audience cards too stops one player drawing the passive role repeatedly and eating the handicap twice.

### What runs out first

| Players | Plays before a stack empties | Binding stack |
| ----- | ----- | ----- |
| 4–6 | 5–6 | **Real** |
| 7–8 | 4–5 | Real / Rogue |
| 9–10 | 2–3 | **Rogue** |

At small counts the Real stack is always the constraint — you burn 2–3 Reals per play against 20, versus 1–2 Rogues against 10. At 9–10 players it flips, because the build takes 3–4 Rogues per play. Neither binds before a session ends, but a facilitator running a long workshop at 10 players should know they have about three plays in the box.

### Point targets

| Session | Target | Plays | Time |
| ----- | ----- | ----- | ----- |
| **Workshop / first playtest** | **400** | ~2 | 45 min |
| Full evening | 1,000 | 4–5 | ~2 hours |

The original 1,000-point target paired with a 45–75 minute play time was off by a factor of two to three. Use **400 for the MVP.** You are testing whether the scoring and the bluffing work, not whether the game can fill an evening.

**Ties at the target:** highest total wins. If still tied, each tied player takes one more turn, everyone else votes, highest score in that round takes it.

---

## 6. Facilitator debrief

The teaching moment is the reveal, not the game. Two minutes after each play:

- **Which clue type was most persuasive — Precedent, Context, or Defense Strategy?** Fabrications lean hardest on Precedent, because "this sort of thing happens" is not evidence that *this* happened.
- **Did anyone publish a fake because it confirmed something they already believed?**
- **Did anyone reject a real story purely because it sounded absurd?** Absurdity is not a falsity test — that's the entire purpose of the Real database.

Ask the third question every time. It's the one players resist and the one the Real database exists to make unavoidable.

---

## 7. Component checklist

- [ ] 30 headline slips, 70 × 45 mm, uniform format across Real and Rogue
- [ ] 30 clue cards, 70 × 120 mm, role + clues + pairing code + uniform footer
- [ ] 6 audience cards + 6 blank "No story to publish" slips
- [ ] 36 opaque sleeves, one per pair
- [ ] 3 labelled envelopes or dividers — Real / Rogue / Audience
- [ ] Vote slips — one per player per play
- [ ] Facilitator score sheet and answer key (pairing code → Real / Fake)
- [ ] Phone timer for the 90-second question window
- [ ] Player rules card: turn order, voting, scoring table. **No build table.**
- [ ] Dealer rules card: build table, burn procedure, retirement

---

## 8. Content

The Real (20) and Fake (10) databases carry over as written, with one mandatory correction.

### Corrected: Hospital "Skin-to-Skin" Billing

The card mockup used the older text: *"A man successfully sued a hospital…"* The lawsuit did not happen. Shipping a fabricated embellishment on a **Real News** card, in a media literacy game, is the one error the project cannot afford. Use:

> **Headline:** "A hospital itemised a new father's bill with a $39.35 charge for 'skin to skin after C-section' — a fee for holding his own newborn."

with the corresponding clues — the hospital confirmed the charge and explained it covered the extra nurse required to monitor the infant in theatre, and that confirmation is what makes it credible.

**Regenerate every card from the current database, not the earlier draft.** Any card carrying an unverified detail in the Real deck is a defect of the same class.

---

## 9. What the two playtests are for

**Playtest 1 — does the bluffing work?** Does a Rogue ever succeed? If rogues never get published, the fabrications are too weak or the table is too paranoid. If rogues always succeed, the clues on Real cards aren't giving journalists enough to defend with.

**Playtest 2 — does the scoring reward the right behaviour?** Track whether the highest scorer discriminated or just voted publish on everything. If the thoughtless baseline is still competitive, raise the fake-catch bonus above +75 or shift the build composition closer to even. Also check whether Audience players are finishing near the bottom — if they are, switch to the 1.5× vote multiplier.

Build the digital version after that.