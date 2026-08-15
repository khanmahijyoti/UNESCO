# Unveil — Game Design Document

## **Overview & Core Concept**

**Unveil** is a card-based strategy and deduction game designed to foster media and information literacy (MIL) awareness. Players must critically evaluate headlines, analyze clues, and distinguish between verified journalism and fabricated stories.

* **Player Count:** 4–10 players
* **Play Time:** 45–75 minutes
* **Win Condition:** First player to reach **1,000 points** wins the game.

## **Component & Card Architecture**

The game consists of **36 total cards** divided into three distinct roles:

| Card Type | Quantity | Function & Features |
| ----- | ----- | ----- |
| **Real Press Cards** | 20 | Assigned to *Real Journalists*. QR code links to a verified headline and 3 hidden clues. |
| **Rogue Press Cards** | 10 | Assigned to *Rogue Journalists*. QR code links to a fabricated headline and 3 hidden clues. |
| **Audience Cards** | 6 | Assigned to *Audience* members. Restricts the player to voting duties only during turns. |

### **Card Anonymity (critical)**

* All 36 cards share an **identical back** and an **identical front**. The only difference is the printed QR code.
* The QR code must resolve to an **opaque, non-sequential URL** (e.g. `unveil.app/c/7f3a9b`). Never encode the role in the URL — `/real/01` or `/c/R01` would let any player leak the deck by reading a neighbour's link.
* A player's role is knowable only by scanning their own card.

### **Database Integration**

* **Real News Database:** 20 verified headlines that sound false or bizarre, to challenge critical thinking.
* **Fake News Database:** 10 fabricated headlines designed to sound convincing and authentic.
* Every fabricated headline page must carry a persistent **"FABRICATED — TRAINING MATERIAL"** watermark, visible on the private clue screen and on the post-play reveal. The game teaches misinformation detection; its own assets must never be screenshot-able as apparent news.

## **Player Roles**

* **Real Journalist:** Present verified news, prove its authenticity using hidden clues, convince the table, and get it published.
* **Rogue Journalist:** Bluff. Present fabricated news using clues and manipulate the table into publishing the fake story.
* **Audience:** Non-journalist participants who act as the public eye — they listen to pitches and participate strictly in voting rounds. Audience players score on voting accuracy exactly like everyone else.

## **Gameplay Loop (Per Play)**

### **Phase 1: Deck Construction & Deal**

The full 36-card deck is never dealt at once. Each play, the dealer builds a **play deck of exactly N cards** (N = player count) with a guaranteed composition, so that no play is trivially rogue-free:

| Players (N) | Rogue Press | Audience | Real Press |
| ----- | ----- | ----- | ----- |
| 4 | 1 | 0 | 3 |
| 5 | 1 | 1 | 3 |
| 6 | 2 | 1 | 3 |
| 7 | 2 | 1 | 4 |
| 8 | 2 | 2 | 4 |
| 9 | 3 | 2 | 4 |
| 10 | 3 | 2 | 5 |

*General rule: Rogue = ⌈N/4⌉, Audience = ⌊N/5⌋ × 2 capped at 2 for N ≤ 8, Real = remainder.*

1. The dealer draws the required cards **face-down without looking at the QR codes**, shuffles those N cards, and deals one to each player.
2. Each player scans their own card privately. Journalists receive one headline and its 3 hidden clues.
3. **The headline is not announced at setup.** It is revealed to the table only when that journalist's turn begins. The 3 clues are hidden from *all players except the cardholder*, permanently.

### **Phase 2: Presentation & Convincing**

1. Starting with the first player, turns proceed sequentially around the table.
2. **Audience Check:** If the player whose turn it is holds an **Audience Card**, their turn is skipped. No penalty, no reveal.
3. If the player is a **Journalist** (Real or Rogue):
   * They read their headline aloud (or show the public headline screen).
   * They use the 3 hidden clues to argue why their news is legitimate and should be published. They may quote, paraphrase, or invent around the clues — clues are ammunition, not a script.
   * The table may ask questions for **90 seconds** before voting.

### **Phase 3: Voting Round**

1. Following the pitch, all other players (excluding the presenting journalist) vote **Publish** or **Reject**. Votes are simultaneous — fist-and-reveal or thumbs up/down on a three-count — so nobody follows the room.
2. A **strict majority** of votes cast is required to publish.
3. **Ties reject.** A story that cannot win a majority does not run. This makes the "unconvinced" state a real outcome rather than a coin flip.
4. Record each player's vote on the score sheet. Votes are scored individually at reveal, so they must be tracked, not just tallied.

## **Scoring System**

After every player has taken a turn, the play ends and the true nature (Real or Rogue) of **every headline — published or rejected** — is revealed.

Scoring is **individual, per headline**. There is no collective bonus.

### **Voter scoring** (every player who voted on that headline)

| The headline was… | Voter voted **Publish** | Voter voted **Reject** |
| ----- | ----- | ----- |
| **Real News** | **+50** — you recognised verified journalism | **0** — you suppressed the truth |
| **Fake News** | **0** — you fell for misinformation | **+50** — you caught the fabrication |

A voter is scored on their own judgement, **not on the outcome of the vote.** Being outvoted while right still pays.

### **Journalist scoring**

| Role | Story Published | Story Rejected |
| ----- | ----- | ----- |
| **Real Journalist** | **+100** | **0** |
| **Rogue Journalist** | **+150** | **0** |

The Rogue premium reflects the harder task: convincing a table that is actively hunting for them.

### **Worked example (5 players, 1 rogue, 1 audience)**

> Dana (Real) pitches the goldfish study. Vote: 3 Publish, 1 Reject → **published**. The three Publish voters take +50 each; the Reject voter takes 0. Dana takes +100.
> Kwame (Rogue) pitches the Brazil coffee ban. Vote: 2 Publish, 2 Reject → **tie, rejected**. The two Reject voters take +50; the two Publish voters take 0. Kwame takes 0 — but he still scored +50 earlier as a voter on Dana's turn, because he voted Publish on a real story.

### **Why this replaces the original rule**

The previous "all published news is real → everyone gets 50" clause was vacuously satisfied when nothing was published at all, making **reject everything, every round** the mathematically optimal strategy and collapsing the deduction game. Under per-vote scoring, reflexively rejecting real news scores zero, so paranoia costs exactly as much as gullibility. Bluffing and belief are both now priced.

## **Game Progression**

* After scoring, all cards are gathered, shuffled back into the full 36, and a fresh play deck is built for the next play.
* Expected pace: a voter can bank 50 × (journalists at the table − 1) per play, plus a journalist bonus. At 5 players this is roughly **150–250 points per play**, putting a 1,000-point game at **5–8 plays**. Adjust the target down to 600 for a short session or up to 1,500 for a long one.
* **Simultaneous victory:** if two or more players cross 1,000 in the same play, the **highest total wins**. If still tied, those players play one **sudden-death round** — each tied player takes one turn, everyone else votes, highest score in that round wins.

## **Facilitator Notes (MIL debrief)**

The teaching moment is the reveal, not the game. After each play, spend two minutes on:

* Which *clue type* was most persuasive — Precedent, Context, or Defense Strategy? (Fabrications lean hardest on Precedent, because "this sort of thing happens" is not evidence that *this* happened.)
* Did anyone publish a fake story because it confirmed something they already believed?
* Did anyone reject a real story purely because it sounded absurd? Absurdity is not a falsity test — that is the entire point of the Real database.

---

# **1\. Real News Database (Hard to believe, but verified)**

*20 entries — one per Real Press card.*

### **Headline 1: Hospital "Skin-to-Skin" Billing**

* **Headline:** "A hospital itemised a new father's bill with a $39.35 charge for 'skin to skin after C-section' — a fee for holding his own newborn."
* **Clues:**
  1. *Precedent:* Itemised hospital bills in private healthcare systems routinely contain micro-charges for standard nursing support that patients never review line by line.
  2. *Context:* The father posted a photo of the receipt online in 2016; the hospital confirmed the charge was real, explaining it covered the extra nurse required to monitor the infant in the operating theatre.
  3. *Defense Strategy:* Argue that it sounds like dystopian satire precisely because medical billing has reached the point of itemising the physical presence of a parent holding their child — and that the hospital's defence of the charge is what makes it credible.

### **Headline 2: Goldfish Driving Robotic Vehicles**

* **Headline:** "Scientists taught goldfish to drive a motorised robotic vehicle across a room toward targeted food rewards on land."
* **Clues:**
  1. *Precedent:* Behavioural neuroscientists routinely test spatial mapping across species using land-based apparatus to separate locomotion mechanics from pure navigation skill.
  2. *Context:* Published in 2022 by researchers at an Israeli university, using a "fish-operated vehicle" — a tank on wheels that moved according to where the fish swam.
  3. *Defense Strategy:* Frame it as legitimate ethology: the researchers isolated the fish's ability to navigate visually toward a target in an environment its species has never evolved for.

### **Headline 3: Commercial Airliner Grounded by Bees**

* **Headline:** "A commercial airliner was delayed for hours because a swarm of roughly 20,000 bees settled on the plane's wing."
* **Clues:**
  1. *Precedent:* Aircraft are uniquely vulnerable to wildlife anomalies; ground crews handle bird strikes constantly, but a swarm settling on an aerodynamic surface halts everything.
  2. *Context:* It happened at a Houston airport gate in 2024. Airport staff could not simply spray them; a beekeeper had to be called to relocate the swarm intact.
  3. *Defense Strategy:* Emphasise that a queen had likely landed on the warm wing and the entire colony followed her — and that no airline will taxi with 20,000 insects on a control surface.

### **Headline 4: Venice Banning Pigeon Feeding**

* **Headline:** "Venice banned tourists from feeding pigeons in St Mark's Square, shutting down the birdseed vendors who had operated there for generations."
* **Clues:**
  1. *Precedent:* Historic European tourist sites absorb millions in structural damage and cleaning costs annually from invasive urban bird populations.
  2. *Context:* The ban took effect in 2008. Officials cited the corrosive damage pigeon droppings inflict on marble and the cost of restoring the Basilica's stonework.
  3. *Defense Strategy:* Argue that the city calculated the cleaning bill against the tourism value of the birds and found the pigeons were a net loss — heritage economics, not whimsy.

### **Headline 5: Australia Lost a War Against Emus**

* **Headline:** "The Australian military deployed soldiers with machine guns against a population of emus, and withdrew in defeat."
* **Clues:**
  1. *Precedent:* Interwar agricultural governments treated crop-destroying wildlife as a logistics problem and reached for military solutions when civilian control failed.
  2. *Context:* In 1932, Western Australian wheat farmers petitioned for help against roughly 20,000 emus. Soldiers with Lewis guns were sent; the birds scattered into small groups, the operation was called off, and a commander compared their resilience to crack infantry.
  3. *Defense Strategy:* Lean on the specific detail — the birds' dispersal behaviour defeated automatic weapons designed for massed targets. It is documented military history, not folklore.

### **Headline 6: Monkeys Employed as Restaurant Waiters**

* **Headline:** "A tavern in Japan employs macaque monkeys as waiters, who deliver drinks to customers and are paid in soybeans."
* **Clues:**
  1. *Precedent:* Japan has a long tradition of trained-monkey performance, and animal-welfare rules there set working-hour limits that the tavern openly observes.
  2. *Context:* The Kayabukiya Tavern in Utsunomiya has done this for years; the monkeys wear uniforms, carry hot towels and drink orders, and are legally restricted to short shifts.
  3. *Defense Strategy:* Point at the regulatory detail — a fabricated story would not include working-hour limits. The mundane bureaucracy is the tell that it is real.

### **Headline 7: The Great Molasses Flood**

* **Headline:** "A storage tank burst in Boston and sent a wave of molasses through the streets at around 35 km/h, killing 21 people."
* **Clues:**
  1. *Precedent:* Early-20th-century industrial tanks were built without engineering review; catastrophic structural failures of bulk liquid storage were a recognised hazard of the era.
  2. *Context:* January 1919, in the North End. The tank held around 2.3 million gallons. The resulting lawsuit became a landmark case in industrial safety regulation.
  3. *Defense Strategy:* Argue from the physics: molasses is far denser than water, so a wave of it carries enormous momentum. The absurdity of the substance has nothing to do with the plausibility of the deaths.

### **Headline 8: A River Was Granted Legal Personhood**

* **Headline:** "New Zealand passed a law granting a river the same legal rights as a human being, with appointed guardians who can sue on its behalf."
* **Clues:**
  1. *Precedent:* Legal systems already grant personhood to non-humans — corporations have held it for over a century.
  2. *Context:* The Whanganui River received legal personhood in 2017, concluding one of the country's longest-running Māori legal claims. Two guardians represent it, one from the Crown and one from the iwi.
  3. *Defense Strategy:* Reframe it as a property-law solution rather than mysticism: personhood gives the river standing in court, which no environmental statute had managed to provide.

### **Headline 9: Owning One Guinea Pig Is Illegal**

* **Headline:** "In Switzerland it is illegal to keep a single guinea pig, because solitude is considered a form of animal abuse."
* **Clues:**
  1. *Precedent:* Several European states regulate the psychological welfare of pets, not merely their physical care.
  2. *Context:* Swiss animal-welfare rules classify guinea pigs, along with several other species, as social animals that must be kept in pairs. This created a small industry in rental companions for bereaved survivors.
  3. *Defense Strategy:* Lead with the rent-a-guinea-pig detail. It sounds like a joke, which is exactly why players assume it is fabricated — but it is a direct market response to the regulation.

### **Headline 10: Government-Approved Baby Names**

* **Headline:** "Denmark maintains an official government list of approved baby names, and parents wanting anything else must apply for permission."
* **Clues:**
  1. *Precedent:* Naming law is a real and unglamorous branch of civil administration across the Nordic countries and Iceland.
  2. *Context:* The list runs to tens of thousands of pre-approved names. Applications outside it are reviewed for whether the name would subject the child to ridicule; a share are rejected each year.
  3. *Defense Strategy:* Frame it as child-protection law rather than authoritarianism — the stated purpose is preventing parents from burdening a child with a name they cannot escape.

### **Headline 11: A Cat Served as Mayor for Twenty Years**

* **Headline:** "An Alaskan town elected a cat as its honorary mayor, a position he held for twenty years."
* **Clues:**
  1. *Precedent:* Small unincorporated towns with no actual mayoral office frequently create ceremonial titles as tourism draws.
  2. *Context:* Stubbs held the honorary post in Talkeetna, Alaska, from 1997 until his death in 2017. The town has no formal mayor, which is exactly why the title was available.
  3. *Defense Strategy:* Emphasise the legal loophole — no governmental power was ever transferred to a cat. That distinction is what makes the story survive fact-checking.

### **Headline 12: A Bear Was Enlisted as a Soldier**

* **Headline:** "A brown bear was formally enlisted in the Polish army during the Second World War, given a rank, and carried artillery ammunition in combat."
* **Clues:**
  1. *Precedent:* Military units have kept mascots for centuries; the unusual step here was formal enlistment, taken to solve a paperwork problem.
  2. *Context:* Wojtek was enlisted so he could be transported on a troopship that barred animals. He was given a name, rank and serial number, and served with an artillery supply company at Monte Cassino in 1944.
  3. *Defense Strategy:* The bureaucratic motive is the proof. Nobody fabricating a story would invent "we made him a private so he'd count as cargo" — that is how real institutions actually behave.

### **Headline 13: A Penguin Holds a Military Rank**

* **Headline:** "A penguin living in a Scottish zoo has been knighted and promoted to brigadier in the Norwegian King's Guard."
* **Clues:**
  1. *Precedent:* Ceremonial military patronage of animals is a live tradition in several European armies, complete with formal promotion parades.
  2. *Context:* Sir Nils Olav is the regimental mascot of the Norwegian King's Guard, based at Edinburgh Zoo. He was knighted in 2008 with the approval of the King of Norway, and has been promoted several times since, each with a full inspection parade.
  3. *Defense Strategy:* Point to the parade footage and the royal approval. This is a documented state ceremony, not a zoo publicity stunt.

### **Headline 14: The Public Named a Research Ship "Boaty McBoatface"**

* **Headline:** "A government poll to name a polar research vessel was won by 'Boaty McBoatface', and officials overruled the public result."
* **Clues:**
  1. *Precedent:* Open internet naming polls have been hijacked repeatedly; agencies now write override clauses into the rules in advance.
  2. *Context:* The 2016 UK poll drew over 120,000 votes for the joke name. The ship was named after a broadcaster instead, and the winning name was given to one of its autonomous submarines as a consolation.
  3. *Defense Strategy:* The compromise is the credible part — a fabricated story would end at the humiliation. Real institutions negotiate their way out.

### **Headline 15: The Government Cheese Caves**

* **Headline:** "The United States government stores over a billion pounds of surplus cheese in limestone caves in Missouri."
* **Clues:**
  1. *Precedent:* Agricultural price-support programmes have generated enormous state-held commodity surpluses for decades; the storage has to go somewhere.
  2. *Context:* The caves are naturally cool former mines, used as commercial cold storage. The stockpile grew out of dairy subsidies that bought up excess production to hold prices stable.
  3. *Defense Strategy:* Argue the economics: it is cheaper to buy and warehouse surplus milk as cheese than to let dairy prices collapse. The cave is just the least expensive refrigerator available.

### **Headline 16: A Country Rented Out Its Empty Prisons**

* **Headline:** "The Netherlands closed prisons for lack of inmates and rented cells to Norway and Belgium to keep them staffed."
* **Clues:**
  1. *Precedent:* Prison capacity is a fixed cost — closing a facility means losing trained staff who cannot be recalled when demand returns.
  2. *Context:* Falling crime rates and a sentencing policy favouring alternatives to incarceration left Dutch facilities under-occupied; several were leased to neighbouring states, and others were converted to asylum-seeker housing.
  3. *Defense Strategy:* Frame it as workforce protection, not a stunt. The alternative was making prison officers redundant in regions with no other employer.

### **Headline 17: A Country Imports Garbage as Fuel**

* **Headline:** "Sweden imports hundreds of thousands of tonnes of garbage from other countries because it does not produce enough of its own to fuel its power plants."
* **Clues:**
  1. *Precedent:* Waste-to-energy incineration is standard district-heating infrastructure across Scandinavia, and those plants require a continuous fuel supply.
  2. *Context:* Aggressive domestic recycling reduced Sweden's own burnable waste below plant capacity. Neighbouring countries pay Sweden to take waste they would otherwise landfill.
  3. *Defense Strategy:* Point out that Sweden is paid twice — once to accept the waste, once for the heat it generates. The apparent absurdity is a functioning business model.

### **Headline 18: An Experiment Running Since 1927**

* **Headline:** "A university experiment started in 1927 has produced nine drops of liquid in a century, and no one witnessed a single one fall until a webcam caught one."
* **Clues:**
  1. *Precedent:* Long-duration materials experiments exist specifically to measure properties too slow to observe in a human career.
  2. *Context:* The pitch drop experiment at an Australian university demonstrates that pitch, which shatters like a solid when struck, is actually a fluid of extraordinarily high viscosity. Its longtime custodian died without ever seeing a drop fall.
  3. *Defense Strategy:* The detail that sells it is the failure — decades of missed drops, including one lost to a coffee break. Fabrications do not include that kind of anticlimax.

### **Headline 19: A Biologically Immortal Animal**

* **Headline:** "A species of jellyfish can reverse its own ageing, reverting to its juvenile stage and starting its life cycle over, apparently without limit."
* **Clues:**
  1. *Precedent:* Cellular reprogramming is an established biological mechanism; several species regenerate whole body structures from differentiated tissue.
  2. *Context:* Turritopsis dohrnii transforms its adult cells back into an earlier cell type and settles into a polyp colony under stress. It remains vulnerable to predation and disease — it is ageless, not unkillable.
  3. *Defense Strategy:* Draw the distinction between immortal and invulnerable. The precision of the claim is the evidence that it came from a paper rather than a rumour.

### **Headline 20: The Wife Carrying World Championship**

* **Headline:** "Finland hosts an annual Wife Carrying World Championship where the winner receives their partner's weight in beer."
* **Clues:**
  1. *Precedent:* Regional Nordic sporting championships built around deliberately absurd disciplines are a well-established summer tourism format.
  2. *Context:* The event runs in Sonkajärvi and has formal international rules, including a minimum carried weight, standard obstacle course, and a time penalty for dropping your partner.
  3. *Defense Strategy:* Lead with the rulebook. A joke does not need a minimum weight requirement and a drop penalty; a sanctioned competition does.

---

# **2\. Fake News Database (Fabricated, highly convincing, but false)**

*10 entries — one per Rogue Press card. Every entry below is **fabricated** and must be presented as such at reveal.*

### **Headline 1: Global Coffee Shortage & Brazil Export Ban**

* **Headline:** "Global coffee shortage imminent as Brazil implements a 50% export ban to prioritise domestic reserves amid climate anomalies."
* **Clues:**
  1. *Precedent:* Major agricultural exporters do have a history of invoking emergency protectionist measures during severe climate shocks.
  2. *Context:* The announcement allegedly surfaced just as commodity markets closed for the weekend, triggering panic-buying among European roasters.
  3. *Defense Strategy:* Lean into real anxieties about frost in South America and shifting weather patterns to make sudden government intervention sound inevitable.
* **Why it works:** Attaches a fabricated specific (a 50% ban) to a real general trend (climate pressure on coffee). The weekend timing conveniently explains why nobody can verify it yet.

### **Headline 2: Paid Subscription for Data Privacy from AI Training**

* **Headline:** "Major social media platforms announce a mandatory monthly subscription fee for users who wish to keep their data hidden from corporate AI training models."
* **Clues:**
  1. *Precedent:* Tech firms face heavy regulatory pressure over content scraping, and analysts speculate constantly about future monetisation tiers.
  2. *Context:* The change was supposedly leaked via an internal memo describing a tiered model for accounts seeking full opt-out protection.
  3. *Defense Strategy:* Frame it as the logical endpoint of platform economics — if they can monetise your data, they can charge you to stop.
* **Why it works:** Cynicism substitutes for evidence. "Of course they would" feels like confirmation. The unnamed leaked memo is unfalsifiable by design.

### **Headline 3: WHO Warning on Plastic Bottles in Sunlight**

* **Headline:** "World Health Organization issues a global warning advising citizens to avoid plastic water bottles left in direct sunlight due to a newly discovered neurotoxin."
* **Clues:**
  1. *Precedent:* Health agencies do issue warnings about microplastics and chemical leaching under thermal stress.
  2. *Context:* The alert was allegedly distributed via an emergency bulletin about bottled water left in hot vehicles.
  3. *Defense Strategy:* Use terminology about polymer breakdown and chemical toxicity to suggest a suppressed safety warning finally surfacing.
* **Why it works:** This is a real forwarded-message hoax with a decade of circulation. Borrowing a genuine agency's authority for an invented finding is the single most common health-misinformation pattern.

### **Headline 4: EU Smartphone Breathalyzer Mandate**

* **Headline:** "The European Union passes legislation requiring all smartphone manufacturers to include a built-in breathalyser that disables messaging apps after midnight."
* **Clues:**
  1. *Precedent:* The EU genuinely does pass aggressive standardised hardware mandates on manufacturers selling into the bloc, such as the USB-C charging requirement.
  2. *Context:* The regulation was reportedly driven by transport safety committees seeking to curb late-night incidents.
  3. *Defense Strategy:* Argue that EU regulators prioritise public safety over convenience and that hardware-level safety integration is becoming normal.
* **Why it works:** One true precedent (USB-C) is used to license an absurd extrapolation. Test the leap, not the premise.

### **Headline 5: Near-Earth Platinum Asteroid Mining by 2030**

* **Headline:** "NASA confirms a newly discovered asteroid is composed entirely of solid platinum and will pass close enough to Earth to be mined with standard commercial rockets by 2030."
* **Clues:**
  1. *Precedent:* Agencies have genuinely mapped near-Earth metallic asteroids valued in the trillions.
  2. *Context:* The timeline was supposedly fast-tracked after a rocket startup secured a multi-billion-dollar defence subsidy.
  3. *Defense Strategy:* Hype the commercial stakes and the billionaire space race; insist the interception technology already exists.
* **Why it works:** "Composed entirely of solid platinum" and "standard commercial rockets" are both quietly impossible, buried under a real research programme.

### **Headline 6: National Solar Highway Conversion**

* **Headline:** "The Netherlands will convert every motorway lane to load-bearing solar panels by 2032, funding the rollout entirely from the electricity generated."
* **Clues:**
  1. *Precedent:* The country genuinely piloted a solar cycle path, and its infrastructure agency has a real reputation for experimental road technology.
  2. *Context:* The programme was reportedly approved after a pilot stretch outperformed rooftop installations in winter output.
  3. *Defense Strategy:* Emphasise the self-funding mechanism — argue that once a road pays for itself, no politician needs to justify the budget.
* **Why it works:** A real, tiny pilot is inflated to a national mandate. The self-funding claim removes the obvious objection before anyone raises it.

### **Headline 7: Weight-Based Airfares**

* **Headline:** "Airlines will begin charging passengers by combined body and baggage weight from 2027 under new international fuel-efficiency rules."
* **Clues:**
  1. *Precedent:* Fuel burn genuinely scales with total aircraft weight, and airlines already price checked baggage by the kilogram.
  2. *Context:* The scheme was reportedly agreed at an industry association summit as part of emissions-reduction commitments.
  3. *Defense Strategy:* Argue the physics is undeniable and that extending existing baggage pricing to total load is merely consistent.
* **Why it works:** The underlying physics is true, so the policy inherits its credibility. The invented part is that any regulator mandated it.

### **Headline 8: Legally Mandated Four-Day Week**

* **Headline:** "Japan becomes the first country to make a four-day working week legally mandatory for all employers, with criminal penalties for violations."
* **Clues:**
  1. *Precedent:* The Japanese government genuinely has published guidance encouraging shorter working weeks, and the country has real, well-documented overwork legislation.
  2. *Context:* The law was reportedly accelerated by demographic pressure and a series of high-profile overwork cases.
  3. *Defense Strategy:* Point to Japan's existing overtime caps as proof that this government legislates working hours aggressively.
* **Why it works:** Converts real *recommendation* into fabricated *mandate*. The distinction between "encouraged" and "required" is where most policy misinformation lives.

### **Headline 9: Memes Added to Cultural Heritage List**

* **Headline:** "UNESCO adds internet memes to its Intangible Cultural Heritage list, recognising them as a protected form of global folk expression."
* **Clues:**
  1. *Precedent:* The Intangible Cultural Heritage list genuinely covers oral traditions, social practices and folk expression rather than physical monuments.
  2. *Context:* The listing was reportedly proposed by a bloc of member states seeking recognition for digital-native culture.
  3. *Defense Strategy:* Argue memes are demonstrably folk expression transmitted culturally — a textbook fit for the category as it is actually defined.
* **Why it works:** The category genuinely almost fits, which is the trap. Plausible categorisation is not evidence that a nomination occurred; inscriptions come from named states, in named sessions, on the record.

### **Headline 10: National Screen Curfew for Minors**

* **Headline:** "Several countries move to impose a nightly screen curfew for under-16s after a study linked blue light to permanent retinal cell damage."
* **Clues:**
  1. *Precedent:* Multiple governments have genuinely legislated minimum ages and time limits for minors' social media access.
  2. *Context:* The curfew was reportedly triggered by an ophthalmology study circulated ahead of peer review.
  3. *Defense Strategy:* Combine real parental anxiety about screen time with clinical-sounding language about photoreceptor degradation.
* **Why it works:** Real legislative trend plus invented medical justification. "Circulated ahead of peer review" is doing all the work — it explains away the absence of a citation.

---

# **3\. Digital Companion — MVP Build Spec**

The physical game needs exactly one piece of software: **the page a QR code opens.** Nothing else is on the critical path.

### **Scope**

* **36 card routes** at opaque slugs. Each route serves one of three page types:
  * **Press page (30 of them):** headline shown large with a "Show to the table" mode, and a tap-to-reveal panel holding the 3 private clues. Role indicator (Real/Rogue) shown *only* on the private panel.
  * **Audience page (6):** "You are the Audience. You vote, you do not pitch."
* **Reveal page:** a single page the facilitator opens after each play, listing which card IDs were Real and which were Rogue.
* **Score sheet:** optional for MVP. Paper works, and the scoring table above fits on an index card.

### **Non-goals for the MVP**

Accounts, online multiplayer, real-time lobbies, animation, sound. The players are sitting at one table with the cards in their hands — the software's only job is to hold secret text and reveal it to one person.

### **Data**

One `cards.json`: `{ slug, type: "real" | "rogue" | "audience", headline, clues: [3], whyItWorks? }`. Thirty content entries, six audience stubs. Content is finished — it is the two databases above.

### **Constraints worth honouring**

* Mobile-first. Every player reads this on a phone held close to their chest.
* Offline-tolerant. Venue wifi will be bad. Static pages cache; a database call at the table is a failure point.
* No back-button leakage between card pages.
* The clue panel must not be visible in a screenshot preview or a phone's app switcher without a deliberate tap.
