/* ============================================================================
   YOUR BLOODWORK. The single source of truth. index.html holds NO data.

   AI: to add a draw, read _readme.how_to_add_a_draw and follow it exactly.
   The two ways to ruin this file silently are (a) converting a value yourself
   and (b) guessing a unit. Do neither. Write what the lab printed, name its
   unit exactly as it appears in that marker units[] array, and return the
   whole file. The dashboard validates on load and will tell the user if you
   got it wrong — but a wrong-but-plausible number may not be caught.
   ============================================================================ */
window.BLOODWORK =
{
 "_readme": {
  "what": "Bloodwork + supplement data for one person. THE single source of truth. The dashboard reads this file; so should any AI. Editing this file is how you add a new draw.",
  "how_to_add_a_draw": "APPEND one object to DATA.draws. Do not touch anything else. Do not reorder. Do not delete.\n  {\"id\":\"d2026jul\", \"date\":\"YYYY-MM-DD\", \"note\":\"lab, fasted?, on/off what\",\n   \"v\":{ \"<markerId>\": {\"r\": <EXACTLY what the lab printed>, \"u\": \"<the unit the lab used>\"} }}\nRULES, in order of how badly they bite:\n 1. NEVER convert a value. Write what the lab printed and name its unit. The dashboard converts.\n 2. \"u\" must be a unit LABEL copied EXACTLY from that marker units[] array (e.g. \"mg/L\", \"µmol/L\", \"G/L\").\n    If the lab used a unit not in that list, STOP and say so. Do not improvise a conversion.\n 3. \"<markerId>\" must be an existing id in MARK. If the lab reports something not in MARK, STOP and\n    say so rather than inventing an id — an unknown id is silently ignored.\n 4. Return the WHOLE file. Never a fragment, never a diff.\n 5. \"a\" is OPTIONAL: the assay/technique EXACTLY as the report printed it, and NOTHING else — no\n    gloss, no interpretation. Its optional companion \"an\" carries what the technique MEANS for\n    reading the number (\"CRP STANDARD, réf <5 mg/L — pas ultra-sensible\"), which is usually an\n    inference and must not be smuggled into \"a\". Same split as clin[] vs opt[]: transcription\n    and inference stay in separate fields. \"an\" without \"a\" is rejected by audit(). Use them\n    only on markers where\n    the method can move the number or void the range — calculated vs measured LDL, IDMS-traceable\n    creatinine, standard vs ultra-sensitive CRP, immunoassay vs LC-MS/MS or RIA hormones, IGF-1\n    platform, analyser-dependent MPV. Do NOT add it to markers the method cannot swing (sodium is\n    sodium), and NEVER copy it from a neighbouring draw: absent means UNRECORDED, not unchanged.\n    It exists because this file has already been misled four times by a value that moved when the\n    ASSAY changed and not the subject.\n 6. \"lt\": true marks a CENSORED result — the lab printed \"<x\" because the analyte fell below the\n    assay's detection limit. Store the LIMIT in r (r must be a number) and set lt; the panel then\n    renders \"<x\" instead of passing a bound off as a measurement. Do NOT invent a midpoint or a\n    zero: the only fact is that the true value lies somewhere in [0, x). Judging still happens AT\n    the limit, which is the worst case the assay permits. Beware comparing two censored values\n    across draws — different assays have different limits, so 'Inf a 0,5' then '<0.6' is not a\n    rise, it is two bounds that cannot be ordered.\n 7. A marker carrying \"am\" has been judged assay-SENSITIVE: critical = the method can move the\n    number enough to break comparison between draws (free/total T, estradiol, DHT, LDL by\n    Friedewald, Lp(a), hs-CRP, creatinine, cystatin C, IGF-1, vitamin D, omega-3 index,\n    insulin, thyroid antibodies, PTH, prolactin, free T4/T3, trace elements, MPV, and SHBG +\n    albumin because calculated free T is built from them); useful = worth having if the marker\n    ever drives a decision. On those markers ALWAYS capture \"a\" from the report — the panel\n    names the draws that lack one. No \"am\" means the method cannot swing the number.\n 8. \"lr\" is the lab's OWN printed interval for that result: [lo, hi] in the SAME unit as u, with either end null where the report printed only one side (<5 is [null, 5]). Never invent the missing end and never let it touch clin[] — clin[] is what the panel judges against, lr is what the lab claimed. Record it wherever the report prints one. It is worth the bytes for two reasons: a printed interval fingerprints the assay (ref <5 mg/L is how the March CRP was known to be standard rather than ultra-sensitive; 8.7-25.0 pg/mL names a direct free-T RIA, the mismatch behind two wrong readings of the 2023 value), and an interval that CHANGES between draws is a method change even when no technique was printed.\n 9. \"cx\" is per-value CONTEXT: how to read THIS number in THIS draw — state at the time (on creatine, 2 days into a diet change) or what the lab did differently (substituted serum for the erythrocyte assay). NOT the same as \"an\": creatine is not an assay. It belongs on the markers it actually explains, never as a draw-wide sentence — the creatine caveat is about creatinine and eGFR and nothing else on that panel. WRITE IT IN FULL SENTENCES for a reader who does not already know the answer: \"ON CREATINE\" was the first draft and it is ambiguous between the supplement and the marker, which differ by two letters and both appear in the same note.\n 10. \"ak\" is what the printed \"a\" actually IS — a canonical key used ONLY for comparing draws, never displayed. It exists because \"a\" is a TRANSCRIPTION and labs transcribe the same method differently: one prints \"Formule de FRIEDEWALD\", another misspells it \"Formule de Friedwald\", a third writes bare \"ECLIA\" where the first named the analyser. Editing \"a\" to make those agree would falsify the record, so \"ak\" carries the equivalence instead. Set it ONLY when you are sure two differently-printed strings are the same assay. Leave it off whenever they might genuinely differ — an absent \"ak\" means \"compare what was printed\", which is the safe default. CKD-EPI deliberately has none: the 2009 and 2021 equations are both printed as \"CKD-EPI\" and are not the same calculation.\n 11. \"t\" on a VALUE overrides the draw's collection time, for a result folded in from a different day (the Dec 2020 zinc, drawn twelve days later and sent to a different laboratory). audit() requires a \"cx\" alongside it: a bare time override is a typo, not a fact.",

  "units": "Each marker has a units[] array of {l, m} or {l, a, b} entries. Convert to the US unit with the entry whose l matches v.u: value = (a !== undefined) ? a*raw + b : raw*m. The first entry is not special; v.u names the unit by its LABEL, never by position.",
  "optimal_ranges": "opt[] and oc are INFERENCES, not lab data. oc is the evidence behind the target: strong = outcome data (RCTs, dose-response vs hard endpoints); moderate = association studies or physiology; weak = convention or industry framing, no outcome data. 3 strong, 29 moderate, 26 weak, 18 with no target at all. A value outside a WEAK band is an opinion, not a finding. A marker with NO opt is deliberate: it means no defensible target exists, and adding one back is a regression, not an improvement.",
  "clin_ranges": "clin[] is the REFERENCE INTERVAL this panel judges against, and it is best-evidence rather than provenance. Usually it IS the lab's own printed range, transcribed. Not always: where a lab prints an interval the current evidence has moved past, the harmonised or guideline one wins and clin[] carries that instead — total testosterone on the Travison/Endocrine Society interval rather than a lab's 300-1000, eGFR on KDIGO, Lp(a) on ESC/EAS, urine protein/creatinine on KDIGO A1. That is why the panel labels it Reference range and NOT Lab reference range, and why a lab's own printed interval belongs in an (rule 8) when it differs. Still distinct from opt[]: clin[] is the range outside which a result is abnormal, opt[] is a target to aim at.",
  "dec": "Which supplements a marker bears on. Many-to-many. Membership does NOT mean the supplement moves it: cystatin C is under Creatine precisely because creatine CANNOT distort it, albumin is under Vitamin D because calcium cannot be corrected without it, selenium is iodine's cofactor, B12/folate are TMG's pathway. The DECS order is deliberate — grouped by primary biomarker domain (hormones/thyroid → lipids/cardio → liver/methylation → kidney/muscle → bone/minerals → aminos → foundational), NOT alphabetical; do not re-sort.",
  "confounds": [
   "Creatine was active at the March 2026 draw. It raises serum creatinine as substrate, not by damaging kidneys, and eGFR is CALCULATED from creatinine so it inherits the error. The eGFR of 61 is not readable as kidney disease. Cystatin C is immune and has never been drawn.",
   "Topical minoxidil appears in no supplement group. That is the finding, not an omission: it is a potassium-channel opener with ~1.4% systemic absorption and no hormonal mechanism. Astaxanthin, lycopene, hyaluronic acid and collagen are absent for the same reason. No blood marker can falsify them."
  ],
  "subject": {
   "sex": "male",
   "height": "187 cm",
   "weight": "80 kg",
   "bodyfat": "~12%",
   "training": "daily resistance",
   "country": "France",
   "diet": "See the DIET tab. Rarely fish; lots of olive oil; mozzarella 100g/meal, 6 eggs/day, potatoes, mushrooms, legumes + whole grains (wild rice / whole-grain pasta), and iodized salt. Huel Black: 90g/day as the pre-workout snack. Its fortification: iodine, vitamin D, zinc, selenium, B12, folate, magnesium, calcium, iron.",
   "supervision": "none"
  },
  "stack": "Moved to the STACK block below — structured, with dose, status, category, meal slot and purchase URL. STACK is the single source of truth for supplements; do not re-list them here.",
  "lifestyle_blocks": "STACK, ROUTINE, CARE and DIET are structured lifestyle data, same contract as the rest of the file: exact, never inferred. STACK is organised in functional categories; most items are status 'planned' — queued for the new protocol, not yet started. STACK.items[].status is one of taking/candidate/stopped/dropped/planned. .when is null (not yet assigned — never guess) OR an array of {at, dose}: one entry per meal slot it's taken at (presnack/brunch/dinner/evening), each carrying the PER-SLOT dose (astaxanthin = [{at:brunch,dose:12mg},{at:dinner,dose:12mg}]; the item's own .dose stays the daily total). Timing lives on the item (.when), not in the categories: cats are functional groups. .dec ties an item to its DECS group (verbatim label) so the dashboard can cross-link; null means no blood marker bears on it (see confounds). An optional .judge string is the readout — the marker or felt endpoint that decides whether a trial-tier (maylater) supplement is working — shown as a 'Judge by:' line under the item. A category's .note is the user's own caveat, shown under the section header; a category with t:null renders HEADERLESS — only its note introduces its items. A DIET meal without .at is a plain food section: no time chip, no supplement slot. A meal item is a string, or {n, info} — in a timed meal card, .info opens behind a hover info-tip on the name: .info is a string (plain caveat) OR a {section: [[label,value],…]} object rendered as a compact nutrition table (Huel Black uses this). ROUTINE times are HH:MM ascending; an entry's .until marks the end of a BLOCK (gym, work) and must be later than its .t; supplements are NOT shown in ROUTINE — they live only on the Diet tab (derived from STACK.when), so the routine just names the meal or event. CARE holds the dental / face protocols, rendered as cards on their own Grooming tab — deliberately NOT hour-by-hour events, they would duplicate. Meal supp lists are NOT stored anywhere: the Diet cards derive them from STACK.when (taking + planned) at render time, with an Evening supps card of its own — one source of truth for timing. DIET.meals[].id doubles as the when-slot key: an item with a when entry {at:'brunch'} belongs to the meal whose id is 'brunch' (slots: presnack/brunch/dinner/evening). In DIET, a '---' item is a course separator (starter / main / dessert), rendered as a gap. DIET.eveningAt stamps the Evening supplements card's time. NEXTDRAW.items is the biomarker list for the next draw — {en, fr} objects (English label + French lab name); the tab renders a two-column table (Marker | Pour le labo (FR)) with a button that copies every row as 'en — fr'. A CARE card may split its items into .groups by cadence (Daily / Weekly / Yearly), same shape as TRAINING groups, OR carry a .schedule instead — a day-indexed weekly grid (days[] with an optional tag + hi chip, sections[] (each an optional .icon: sun/sunset/moon) of rows {n, on:[day names], hi?}, plus notes[]) rendered as a dot-matrix (solid = applied, faint = skipped); the Skincare card (id 'face') uses this and every on-day name must appear in days[]. TRAINING is {cardio, note, cards}: the gym program as Pull / Push / Legs cards, each organised in muscle-group .groups ('Accessory' holds what resists categorising). Every item is {n, sets:[[kg,reps],...]} — one pair per set, kg null = bodyweight, a '+' prefix = added weight, reps may be a duration like '0:30', sets [] = a protocol without logged sets; an optional .info string holds details shown behind an info tip. Copied exactly from the user's workout app; .cardio is the cardio baseline and .note the resistance caveat — the page renders them as labelled Cardio / Resistance sections. Doses write micrograms as mcg, never µg — µ uppercases into M and becomes a 1000x reading error.",
  "never_measured": "26 markers have no value in any draw. Highest value first: cystatin C (settles eGFR outright), ApoB and Lp(a), homocysteine (NAC raises it, TMG lowers it, net never seen), anti-TPO + free T4 (iodine now from iodized salt + fortified Huel, no supplement; Huel spans the historical draws at 90g/day), selenium, copper and zinc (BEFORE starting zinc), omega-3 index.",
  "self_check_before_returning_the_file": [
   "Every markerId in the new draw exists in MARK.",
   "Every \"u\" string appears verbatim in that marker units[] array.",
   "No existing draw was modified, reordered or dropped. Count them: there were 6.",
   "The file still parses: it is window.BLOODWORK = {...}; with the wrapper intact."
  ]
 },
 "CATS": [
  {
   "id": "cbc",
   "t": "Blood count"
  },
  {
   "id": "lipid",
   "t": "Cardiometabolic"
  },
  {
   "id": "renal",
   "t": "Kidney"
  },
  {
   "id": "liver",
   "t": "Liver"
  },
  {
   "id": "other",
   "t": "Muscle & electrolytes"
  },
  {
   "id": "thy",
   "t": "Thyroid"
  },
  {
   "id": "horm",
   "t": "Hormones"
  },
  {
   "id": "iron",
   "t": "Iron"
  },
  {
   "id": "vitmin",
   "t": "Vitamins & minerals"
  }
 ],
 "DECS": [
  "Finasteride (topical) 0.1% - 1mL",
  "Boron 10mg",
  "Ashwagandha 600mg",
  "Omega-3 (2000mg EPA, 1125mg DHA)",
  "AGE garlic 2400mg",
  "NAC 12g",
  "TMG 6g",
  "B-complex (methylfolate)",
  "Curcumin",
  "Creatine 5g",
  "Vitamin D3 10000 IU + K2",
  "Magnesium L-threonate",
  "Glycine 12g + taurine + collagen",
  "Huel"
 ],
 "STACK": {
  "cats": [
   {
    "id": "essentials",
    "t": "Essentials"
   },
   {
    "id": "skin",
    "t": "Skin"
   },
   {
    "id": "sport",
    "t": "Sport"
   },
   {
    "id": "maylater",
    "t": "May add later"
   }
  ],
  "items": [
   {
    "id": "astax",
    "name": "Astaxanthin",
    "dose": "12mg 2x/day",
    "info": "Photoprotection (raises the UV-burn threshold) plus moisture and elasticity. Not colour — that's beta-carotene's job. 24mg/day, 12mg twice with fat. Above the EU cap but safe to 40mg; held pending proof it helps colour.",
    "cat": "skin",
    "status": "taking",
    "when": [
     {
      "at": "brunch",
      "dose": "12mg"
     },
     {
      "at": "dinner",
      "dose": "12mg"
     }
    ],
    "url": null,
    "dec": null
   },
   {
    "id": "lyco",
    "name": "Lycopene",
    "dose": "15mg 2x/day",
    "info": "Warm skin tone plus UV photoprotection (10-16mg). Absorption saturates by ~30-40mg, so 30mg (15mg twice with fat) is the ceiling — more just gets excreted. Tomato-derived (LycoBeads) beats synthetic; cooked tomato in olive oil beats raw.",
    "cat": "skin",
    "status": "taking",
    "when": [
     {
      "at": "presnack",
      "dose": "15mg"
     },
     {
      "at": "dinner",
      "dose": "15mg"
     }
    ],
    "url": "https://www.sunday.de/en/lycopene-capsules.html",
    "dec": null
   },
   {
    "id": "vitd3k2",
    "name": "Vitamin D3 + K2",
    "dose": "10000 IU",
    "info": "Vitamin D repletion; the K2 steers calcium into bone, not arteries. Doubled from 5000 IU on 2026-07-21: the July draw came back at 28 ng/mL, below the lab's own sufficiency floor of 30 ng/mL (75 nmol/L), so 5000 was not enough — likely because daily SPF 50 leaves supplementation doing all the work with almost no cutaneous synthesis. 2 tablets. Above the EFSA/IOM upper limit of 4000 IU (the Endocrine Society ceiling is 10000), so this is titration, NOT a new autopilot: retest 25-OH-D AND calcium at 3 months, and come back down if it lands above 60-70.",
    "cat": "essentials",
    "status": "taking",
    "when": [
     {
      "at": "brunch",
      "dose": "10000 IU"
     }
    ],
    "url": "https://www.sunday.de/en/vitamin-d-tablets-5000-iu-plus-k2-mk7-100mcg-xl.html",
    "dec": "Vitamin D3 10000 IU + K2"
   },
   {
    "id": "omega3",
    "name": "Omega-3",
    "dose": "2000mg EPA + 1125mg DHA",
    "info": "EPA-forward dose aimed at skin and inflammation — about double the general-health dose. Algae oil (triglyceride form), cleaner than fish oil and iodine-free. 5 softgels/day = 2000mg EPA + 1125mg DHA, split 1 at the pre-workout snack + 2 at brunch + 2 at dinner, each a meal with fat for absorption. Titrate to your omega-3 index (8-12%).",
    "cat": "essentials",
    "status": "taking",
    "when": [
     {
      "at": "presnack",
      "dose": "400mg EPA + 225mg DHA"
     },
     {
      "at": "brunch",
      "dose": "800mg EPA + 450mg DHA"
     },
     {
      "at": "dinner",
      "dose": "800mg EPA + 450mg DHA"
     }
    ],
    "url": "https://www.sunday.de/en/omega-3-epa-dha-capsules.html",
    "dec": "Omega-3 (2000mg EPA, 1125mg DHA)"
   },
   {
    "id": "collagenc",
    "name": "Collagen peptides (low-MW)",
    "dose": "2g",
    "info": "Low-weight peptides (~500 Da) that signal skin to build its own collagen — the trigger, not the raw material (glycine covers that). 2g with vitamin C. Cosmetic, modest evidence.",
    "cat": "skin",
    "status": "taking",
    "when": [
     {
      "at": "brunch",
      "dose": "2g"
     }
    ],
    "url": "https://www.sunday.de/en/collagen-powder-sunglow-luxe-plus-c.html",
    "dec": "Glycine 12g + taurine + collagen"
   },
   {
    "id": "ha",
    "name": "Hyaluronic acid",
    "dose": "250mg",
    "info": "Not absorbed intact (~0.2%) — gut bacteria fragment it into signals for the skin's own HA. 2025 review (7 trials): modest hydration, elasticity and wrinkle gains. 250mg, the trial dose. Cosmetic, gut-flora-dependent.",
    "cat": "skin",
    "status": "taking",
    "when": [
     {
      "at": "brunch",
      "dose": "250mg"
     }
    ],
    "url": "https://www.sunday.de/en/hyaluronic-acid-250mg-high-dose-vegan-from-fermentation.html",
    "dec": null
   },
   {
    "id": "mglthr",
    "name": "Magnesium L-threonate",
    "judge": "sleep quality — an on-vs-off test by feel or your sleep tracker",
    "dose": "2040mg",
    "info": "Brain-penetrant magnesium (147mg elemental), sold for sleep. But the sleep case is thin — you're young and replete (~2× RDA), and its only trials are cognition in older adults. Parked pending your own on/off sleep test.",
    "cat": "maylater",
    "status": "planned",
    "when": [
     {
      "at": "evening",
      "dose": "2040mg"
     }
    ],
    "url": "https://www.sunday.fr/magnesium-l-threonate-gelules.html",
    "dec": "Magnesium L-threonate"
   },
   {
    "id": "betacar",
    "name": "Beta-carotene",
    "judge": "skin tone — photos in consistent light over a few weeks",
    "dose": "15mg",
    "info": "The carotenoid that actually drives golden tone — astaxanthin can't. Parked so you judge astaxanthin + lycopene alone first, then add if the tint's still missing. Algae source (Dunaliella), safer than synthetic (which raised cancer risk only in smokers). 15mg with fat; more for deeper colour, but watch for orange palms.",
    "cat": "maylater",
    "status": "planned",
    "when": null,
    "url": "https://www.sunday.de/en/beta-carotene-algae-extract-capsules.html",
    "dec": null
   },
   {
    "id": "glycine",
    "name": "Glycine",
    "judge": "sleep (solo); or the GlyNAC markers, if paired with NAC",
    "dose": "12g",
    "info": "12g is a glutathione/GlyNAC dose (sleep studies use just 3g). Now paired 1:1 with 12g NAC — near the Sekhar efficacy dose for your weight (~8g glycine). Glycine's very safe and cheap, so the slight overshoot is fine.",
    "cat": "maylater",
    "status": "planned",
    "when": null,
    "url": null,
    "dec": "Glycine 12g + taurine + collagen"
   },
   {
    "id": "nac",
    "name": "NAC",
    "judge": "hs-CRP, HOMA-IR, homocysteine and GGT, before vs after 3 months",
    "dose": "12g",
    "info": "Glutathione/antioxidant precursor. 12g matches your glycine 1:1 — near the Sekhar GlyNAC dose for your weight (~11g NAC). Raises homocysteine, which the TMG offsets. Parked until the goal and oxidative markers are set.",
    "cat": "maylater",
    "status": "planned",
    "when": null,
    "url": null,
    "dec": "NAC 12g"
   },
   {
    "id": "tmg",
    "name": "TMG",
    "judge": "homocysteine — it exists only to offset NAC's rise",
    "dose": "6g",
    "info": "Methyl donor that lowers homocysteine — 6g is the effective dose, sized to offset the homocysteine your 12g NAC raises. Catch: betaine above ~4g can nudge LDL up, so watch it. Pending homocysteine, the number that justifies the loop.",
    "cat": "maylater",
    "status": "planned",
    "when": null,
    "url": null,
    "dec": "TMG 6g"
   },
   {
    "id": "bcomplex",
    "name": "B-complex (methylfolate)",
    "judge": "homocysteine and serum folate on the next draw",
    "dose": "400-800mcg 5-MTHF",
    "info": "Folate, B12 and B6 in their active forms — 5-MTHF, methylcobalamin, P5P. Aimed at homocysteine, 15.0 against an expected <15, with serum folate 6.3 sitting on the floor of its optimal band. Folic acid is not the missing input: Huel supplies it daily and folate is still low, which points at the conversion rather than the intake. Keep B6 under 25mg — sustained high doses cause a reversible neuropathy. Parked so the greens and the August creatine restart can be read first.",
    "cat": "maylater",
    "status": "planned",
    "when": null,
    "url": null,
    "dec": "B-complex (methylfolate)"
   },
   {
    "id": "garlic",
    "name": "AGE garlic",
    "judge": "blood pressure and LDL / ApoB",
    "dose": "2400mg",
    "info": "Aged garlic extract — modest BP (~5-8 mmHg in hypertensives) and lipid effects, plus slowed coronary plaque. 2400mg is the plaque-trial dose (BP works at 600-1200mg). Parked: the payoff is for elevated BP or CVD risk, not a fit 31-yo — revisit if your lipids or BP give it a job.",
    "cat": "maylater",
    "status": "planned",
    "when": null,
    "url": null,
    "dec": "AGE garlic 2400mg"
   },
   {
    "id": "curcumin",
    "name": "Curcumin",
    "judge": "hs-CRP",
    "dose": null,
    "info": "Anti-inflammatory (NF-κB). No dose set on purpose — raw curcumin barely absorbs, so the form (piperine, Meriva, liposomal) matters more than the mg. Parked until an inflammatory marker (hs-CRP) runs high enough to target, then pick a bioavailable form.",
    "cat": "maylater",
    "status": "planned",
    "when": null,
    "url": null,
    "dec": "Curcumin"
   },
   {
    "id": "creatine",
    "name": "Creatine",
    "dose": "5g",
    "info": "Strength, power, likely cognition. 5g/day, up to 20g on poor-sleep weeks. Saturation-based, so timing's flexible. NOT a trial, unlike the rest of this tier — it is the best-evidenced supplement on the list and was already being taken. It sits here only because it was paused: stopped before the 2026-07-20 draw so creatinine and eGFR would read clean without it. Restarting August 2026 — which also removes the body's single largest methyl-group demand, so it may pull homocysteine down on its own.",
    "cat": "maylater",
    "status": "planned",
    "when": [
     {
      "at": "presnack",
      "dose": "5g"
     }
    ],
    "url": "https://amzn.eu/d/09MG0JOC",
    "dec": "Creatine 5g"
   },
   {
    "id": "taurine",
    "name": "Taurine",
    "judge": "nothing measurable at your age — a theory bet, not a testable one",
    "dose": "5g",
    "info": "5g is a longevity dose (exercise studies use 1-3g), extrapolated from the 2023 mouse-lifespan paper. Human evidence is observational, not trial — cheap and safe to 10g, but unproven. Parked until human data or a clear reason.",
    "cat": "maylater",
    "status": "planned",
    "when": null,
    "url": null,
    "dec": "Glycine 12g + taurine + collagen"
   },
   {
    "id": "boron",
    "name": "Boron",
    "judge": "free testosterone and SHBG",
    "dose": "10mg",
    "info": "Lowers SHBG, so more testosterone stays free (and drops estradiol). 10mg is the studied dose (free-T +28% over a week). Modest, and unclear at your age with normal T — parked until T/SHBG bloods justify it.",
    "cat": "maylater",
    "status": "planned",
    "when": null,
    "url": null,
    "dec": "Boron 10mg"
   },
   {
    "id": "ashwa",
    "name": "Ashwagandha",
    "judge": "perceived stress and sleep; testosterone / cortisol on bloods",
    "dose": "600mg",
    "info": "Adaptogen — lowers cortisol and stress, improves sleep, and small RCTs show recovery, strength and modest testosterone bumps in trained men. 600mg/day of a standardised root extract (KSM-66). Catch: it can nudge thyroid hormones, so don't start before the baseline draw — it'd confound TSH/T4; rare liver reports too, so cycle it 8-12 weeks on.",
    "cat": "maylater",
    "status": "planned",
    "when": null,
    "url": null,
    "dec": "Ashwagandha 600mg"
   }
  ]
 },
 "ROUTINE": [
  {"t": "07:00", "do": "10min run, sunlight, hot/cold shower"},
  {"t": "07:15", "do": "Pre-workout snack"},
  {"t": "08:00", "until": "10:00", "do": "Gym - phone stays OFF"},
  {"t": "10:00", "until": "10:30", "do": "Brunch"},
  {"t": "10:30", "until": "16:30", "do": "Work"},
  {"t": "16:30", "until": "17:00", "do": "Dinner"},
  {"t": "17:00", "until": "21:00", "do": "Work"},
  {"t": "21:00", "until": "21:30", "do": "Shower + floss + skincare"},
  {"t": "21:30", "do": "Bedtime"},
  {"t": "22:00", "do": "Lights out"}
 ],
 "CARE": [
  {"id": "face", "t": "Skincare",
   "groups": [
    {"t": "Morning", "icon": "sun", "items": [
     {"n": "Serum - Vit C 15% + Ferulic Acid + Vit E", "url": "https://geekandgorgeous.com/products/c-glow"},
     {"n": "Serum - Niacinamide (B3) + Green Tea", "url": "https://www.yesstyle.com/fr/tcuc.EUR/coc.FR/info.html/pid.1119542353"},
     {"n": "Moisturizer - Ceramides + Cholesterol", "url": "https://www.cerave.fr/nos-produits/hydratants/creme-hydratante-visage"},
     {"n": "SPF 50", "url": "https://www.yesstyle.com/fr/tcuc.EUR/coc.FR/info.html/pid.1122974582"},
     "Serum - Finasteride 0.1% + Minoxidil 5%"
    ]},
    {"t": "Before sleep", "icon": "moon", "items": [
     {"n": "Serum - Matrixyl 10% + HA", "url": "https://theordinary.com/fr-fr/matrixyl-10-ha-serum-100431.html"},
     {"n": "Serum - Copper Peptides 1%", "url": "https://theordinary.com/fr-fr/sérum-multi-peptides-peptides-de-cuivre-1-100625.html", "info": "Do not apply on Glycolic Acid days"},
     {"n": "Retinal 0.2%", "url": "https://geekandgorgeous.com/products/a-game-20"},
     {"n": "Moisturizer - Ceramides + Cholesterol", "url": "https://www.cerave.fr/nos-produits/hydratants/creme-hydratante-visage"},
     "Slugging - Petrolatum",
     "Serum - Finasteride 0.1% + Minoxidil 5%",
     {"n": "Serum - Greyverse", "url": "https://neofollics.com/products/anti-grey-hair-serum"}
    ]}
   ],
   "notes": [
    "Body lotion 12% AHA while still wet after morning shower, at least once a week",
    "Glycolic 7% once a week instead of Retinal",
    "Microneedling → Infadolan: face 1mm weekly, up to 2mm monthly; scalp 0.75mm weekly.",
    "No Retinal for 24h after microneedling; slug with Infadolan instead of Petrolatum"
   ]},
  {"id": "dental", "t": "Dental", "groups": [
   {"t": "Daily", "items": [
    "Water jet + toothbrush 2-3x/day",
    "Alternate thread floss & interdental brushes"
   ]},
   {"t": "Yearly", "items": [
    "Dental scaling 2-3x/year",
    "Carbamide peroxide 10-15% - 2x/year, applied with custom dental tray"
   ]}
  ]}
 ],
 "TRAINING": {
  "cardio": "One 30' HIT per week - mostly ~5k run.\nStriving for 3 sessions when business will be automated.",
  "note": "Weights and reps are approximations and may vary dramatically based on the machine used",
  "cards": [
  {"id": "pull", "t": "Pull", "groups": [
   {"t": "Back", "items": [
    {"n": "Chin up", "sets": [["+30",5],["+30",5],["+30",5]]},
    {"n": "Explosive pull up", "sets": [[null,2],[null,2],[null,2]]},
    {"n": "Face pull", "sets": [[40,10],[40,10]]},
    {"n": "Single arm row", "sets": [[40,8],[40,8]]},
    {"n": "Back extension", "sets": [[40,12],[40,12]]}
   ]},
   {"t": "Biceps", "items": [
    {"n": "Bicep curl", "sets": [[20,8],[20,8]]},
    {"n": "Hammer curl", "sets": [[20,6],[20,6]]},
    {"n": "Preacher curl", "sets": [[40,12],[40,12]]}
   ]},
   {"t": "Traps & neck", "items": [
    {"n": "Shrug", "sets": [[40,50],[40,50]]},
    {"n": "Neck extension", "sets": [[20,10],[20,10]]}
   ]},
   {"t": "Accessory", "items": [
    {"n": "Pull-over", "sets": [[10,10],[10,10]]},
    {"n": "Trap-3 raise", "sets": [[10,10],[10,10]]},
    {"n": "One arm hang", "sets": [[null,"0:30"],[null,"0:30"]]}
   ]}
  ]},
  {"id": "push", "t": "Push", "groups": [
   {"t": "Warm-up", "items": [
    {"n": "Shoulder prep", "info": "Figure 8, push-ups, ext. rotations w/ band or dumbbell, skin the cat, dislocates, gymnast seated stretch", "sets": []}
   ]},
   {"t": "Shoulders", "items": [
    {"n": "Overhead press", "sets": [[50,5],[50,5],[50,5]]},
    {"n": "Lateral raise", "sets": [[12,10],[12,10],[12,10]]},
    {"n": "Machine deltoid raise", "sets": [[50,5],[50,5],[50,5]]},
    {"n": "Rear deltoid", "sets": [[20,15],[20,15],[20,15]]}
   ]},
   {"t": "Triceps", "items": [
    {"n": "Tricep pushdown", "sets": [[25,20],[25,20]]},
    {"n": "Overhead tricep ext.", "sets": [[20,10],[20,10]]}
   ]},
   {"t": "Chest", "items": [
    {"n": "Incline dumbbell press", "sets": [[30,6],[30,6]]},
    {"n": "Machine incline press", "sets": [[80,6],[80,6]]},
    {"n": "Chest fly", "sets": [[25,15],[25,15]]}
   ]}
  ]},
  {"id": "legs", "t": "Legs", "groups": [
   {"t": "Calves", "items": [
    {"n": "Seated calf raise", "sets": [[80,20],[80,20],[80,20]]},
    {"n": "Standing calf raise", "sets": [[200,20],[200,20],[200,20]]}
   ]},
   {"t": "Quads", "items": [
    {"n": "Shrimp squat", "sets": [[null,5],[null,5],[null,5],[null,5],[null,5],[null,5]]},
    {"n": "Machine squat", "sets": [[80,8],[80,8],[80,8]]},
    {"n": "Leg extension", "sets": [[80,12],[80,12]]}
   ]},
   {"t": "Glutes", "items": [
    {"n": "Standing abduction", "sets": [[100,20],[100,20],[100,20]]},
    {"n": "Hip thrust", "sets": [[160,10],[160,10],[160,10]]},
    {"n": "Hip abduction", "sets": [[100,15],[100,15],[100,15]]}
   ]},
   {"t": "Hamstrings & groin", "items": [
    {"n": "Nordic curl", "sets": [[20,8],[20,8]]},
    {"n": "Lying leg curl", "sets": [[50,12],[50,12]]},
    {"n": "Hip adduction", "sets": [[80,12],[80,12]]}
   ]},
   {"t": "Core", "items": [
    {"n": "Psoas knee raise", "sets": [[16,10],[16,10]]},
    {"n": "Crunch", "sets": [[20,12],[20,12]]}
   ]}
  ]}
  ]
 },
 "RECORD": {
  "sections": [
   {
    "t": "Identity",
    "line": "Male · 187 cm · ~80 kg · ~12% bodyfat · born Feb 1995",
    "rows": []
   },
   {
    "t": "Blood group",
    "date": "2024-08-30",
    "rows": [
     [
      "ABO-D group",
      "O positive"
     ],
     [
      "Rhesus-Kell phenotype",
      "C+ E+ c+ e+ K− · RH : 1,2,3,4,5 KEL : -1"
     ],
     [
      "Irregular antibody screen",
      "Negative"
     ]
    ]
   },
   {
    "t": "Vaccinations",
    "rows": [],
    "empty": "Nothing recorded yet."
   },
   {
    "t": "Serology",
    "rows": [
     [
      "HIV 1 & 2 screen",
      "Negative"
     ],
     [
      "HBs antigen",
      "Negative"
     ],
     [
      "Anti-HBc total",
      "Negative"
     ],
     [
      "Anti-HBs",
      "93 IU/L — immune (90 in 2022, 94 in 2020)"
     ],
     [
      "Anti-HCV",
      "Negative"
     ],
     [
      "Syphilis (TPHA)",
      "Negative"
     ]
    ],
    "date": "2023-03-13",
    "foot": "Roche Cobas ECLIA. Screened three times — Dec 2020, May 2022 and Mar 2023 — with the same result each time."
   },
   {
    "t": "Allergy",
    "date": "2023-03-13",
    "rows": [
     [
      "Phadiatop — dust mite, mould, animal dander, grass/weed/tree pollen",
      "Negative · 0.78"
     ],
     [
      "Trophatop fx5 — egg white, cow's milk, cod, wheat, peanut, soy",
      "Borderline · 0.99"
     ],
     [
      "Trophatop fx24 — hazelnut, shrimp, kiwi, banana",
      "Borderline · 0.88"
     ],
     [
      "Trophatop fx25 — sesame, brewer's yeast, garlic, celery",
      "Negative · 0.64"
     ]
    ],
    "foot": "ImmunoCAP Phadia, reported as a ratio to the positivity threshold: positive above 1.17, borderline 0.83–1.17, negative below 0.83. Neither borderline mix identifies WHICH food it responded to — that needs single allergens. The lab's own advice is to follow symptoms and repeat if any appear."
   },
   {
    "t": "Genotyping",
    "rows": [],
    "empty": "Nothing recorded yet. APOE is the variant worth having; MTHFR is not."
   },
   {
    "t": "Family history",
    "rows": [],
    "empty": "Nothing recorded yet. Age at a parent's first cardiac event is the single most useful entry."
   },
   {
    "t": "Baseline studies",
    "rows": [],
    "empty": "One-off results worth keeping: coronary calcium score, DEXA, ECG. Nothing recorded yet."
   }
  ]
 },
 "NEXTDRAW": {
  "items": [
   {"en": "Cystatin C", "fr": "Cystatine C"},
   {"en": "Creatinine + eGFR", "fr": "Créatinine + DFG"},
   {"en": "Urea (BUN)", "fr": "Urée"},
   {"en": "Urinalysis (dipstick)", "fr": "Bandelette urinaire"},
   {"en": "ApoB", "fr": "Apolipoprotéine B (ApoB)"},
   {"en": "Lp(a)", "fr": "Lipoprotéine (a) [Lp(a)]"},
   {"en": "Lipid panel (total, LDL, HDL, triglycerides)", "fr": "Bilan lipidique (cholestérol total, LDL, HDL, triglycérides)"},
   {"en": "hs-CRP", "fr": "CRP ultrasensible"},
   {"en": "Homocysteine", "fr": "Homocystéine"},
   {"en": "TSH", "fr": "TSH"},
   {"en": "Free T4", "fr": "T4 libre (FT4)"},
   {"en": "Free T3", "fr": "T3 libre (FT3)"},
   {"en": "Anti-TPO antibodies", "fr": "Anticorps anti-TPO"},
   {"en": "Thyroglobulin antibodies (anti-Tg)", "fr": "Anticorps anti-thyroglobuline (anti-Tg)"},
   {"en": "Testosterone (total + free)", "fr": "Testostérone totale et libre"},
   {"en": "DHT (dihydrotestosterone)", "fr": "DHT (dihydrotestostérone)"},
   {"en": "SHBG", "fr": "SHBG"},
   {"en": "Estradiol", "fr": "Œstradiol (E2)"},
   {"en": "LH", "fr": "LH (hormone lutéinisante)"},
   {"en": "FSH", "fr": "FSH (hormone folliculo-stimulante)"},
   {"en": "Prolactin", "fr": "Prolactine"},
   {"en": "DHEA-S", "fr": "SDHEA (sulfate de DHEA)"},
   {"en": "IGF-1", "fr": "IGF-1 (somatomédine C)"},
   {"en": "Cortisol (morning)", "fr": "Cortisol (matinal, 8h)"},
   {"en": "25-OH vitamin D", "fr": "Vitamine D (25-OH)"},
   {"en": "Omega-3 index", "fr": "Index oméga-3"},
   {"en": "Vitamin B12", "fr": "Vitamine B12"},
   {"en": "Folate", "fr": "Folates (B9)"},
   {"en": "Selenium", "fr": "Sélénium"},
   {"en": "Zinc", "fr": "Zinc"},
   {"en": "Copper", "fr": "Cuivre"},
   {"en": "Calcium", "fr": "Calcium"},
   {"en": "PTH (parathyroid hormone)", "fr": "Parathormone (PTH)"},
   {"en": "Magnesium (serum)", "fr": "Magnésium sérique"},
   {"en": "Ferritin", "fr": "Ferritine"},
   {"en": "Serum iron", "fr": "Fer sérique"},
   {"en": "TIBC (total iron-binding capacity)", "fr": "Capacité totale de fixation du fer (CTF)"},
   {"en": "Transferrin saturation (TSAT)", "fr": "Coefficient de saturation de la transferrine (CST)"},
   {"en": "Fasting glucose", "fr": "Glycémie à jeun"},
   {"en": "HbA1c", "fr": "Hémoglobine glyquée (HbA1c)"},
   {"en": "Fasting insulin", "fr": "Insuline à jeun"},
   {"en": "Uric acid", "fr": "Acide urique"},
   {"en": "Ionogram (Na, K, Cl, bicarbonate)", "fr": "Ionogramme sanguin (Na, K, Cl, bicarbonates)"},
   {"en": "CBC", "fr": "NFS (numération formule sanguine)"},
   {"en": "Liver panel (ALT, AST, GGT)", "fr": "Bilan hépatique (ASAT, ALAT, GGT)"},
   {"en": "Alkaline phosphatase (ALP)", "fr": "Phosphatases alcalines (PAL)"},
   {"en": "Total bilirubin", "fr": "Bilirubine totale"},
   {"en": "Albumin", "fr": "Albumine"},
   {"en": "Total protein", "fr": "Protéines totales"},
   {"en": "Creatine kinase (CK)", "fr": "Créatine kinase (CPK)"}
  ]
 },
 "DIET": {
  "eveningAt": "21:00",
  "meals": [
   {
    "id": "presnack",
    "t": "Pre-workout snack",
    "at": "07:15",
    "items": [
     {
      "n": "Huel Black",
      "amt": "90 g",
      "info": {
       "Per 90g": [
        [
         "Energy",
         "400 kcal",
         "20%"
        ],
        [
         "Protein",
         "40 g",
         "80%"
        ],
        [
         "Fat",
         "17 g",
         "24%"
        ],
        [
         "– saturates",
         "4.0 g",
         "20%"
        ],
        [
         "– monounsat.",
         "3.8 g"
        ],
        [
         "– PUFA",
         "9.4 g"
        ],
        [
         "Carbs",
         "19 g",
         "7%"
        ],
        [
         "– sugars",
         "1.6 g",
         "2%"
        ],
        [
         "Fibre",
         "8.4 g"
        ],
        [
         "Salt",
         "0.8 g",
         "13%"
        ]
       ],
       "Vitamins": [
        [
         "A",
         "180 mcg",
         "23%"
        ],
        [
         "D",
         "160 IU",
         "80%"
        ],
        [
         "E",
         "4.0 mg",
         "33%"
        ],
        [
         "K",
         "39 mcg",
         "52%"
        ],
        [
         "C",
         "60 mg",
         "75%"
        ],
        [
         "Thiamin",
         "0.22 mg",
         "20%"
        ],
        [
         "Riboflavin",
         "0.28 mg",
         "20%"
        ],
        [
         "Niacin",
         "3.2 mg",
         "20%"
        ],
        [
         "B6",
         "0.28 mg",
         "20%"
        ],
        [
         "Pantoth.",
         "1.2 mg",
         "20%"
        ],
        [
         "Folate",
         "80 mcg",
         "40%"
        ],
        [
         "B12",
         "0.80 mcg",
         "32%"
        ],
        [
         "Biotin",
         "12 mcg",
         "24%"
        ]
       ],
       "Minerals": [
        [
         "Calcium",
         "240 mg",
         "30%"
        ],
        [
         "Phosphorus",
         "360 mg",
         "51%"
        ],
        [
         "Potassium",
         "700 mg",
         "35%"
        ],
        [
         "Chloride",
         "164 mg",
         "21%"
        ],
        [
         "Magnesium",
         "88 mg",
         "23%"
        ],
        [
         "Iron",
         "9.0 mg",
         "64%"
        ],
        [
         "Zinc",
         "4.6 mg",
         "46%"
        ],
        [
         "Copper",
         "0.50 mg",
         "50%"
        ],
        [
         "Manganese",
         "0.90 mg",
         "45%"
        ],
        [
         "Selenium",
         "33 mcg",
         "60%"
        ],
        [
         "Iodine",
         "30 mcg",
         "20%"
        ],
        [
         "Chromium",
         "12 mcg",
         "30%"
        ],
        [
         "Molybdenum",
         "37 mcg",
         "74%"
        ]
       ],
       "Other": [
        [
         "Choline",
         "120 mg"
        ],
        [
         "Omega-3 (ALA)",
         "4.0 g"
        ],
        [
         "Omega-6",
         "4.2 g"
        ],
        [
         "MCT",
         "1.1 g"
        ],
        [
         "Caffeine",
         "68 mg"
        ],
        [
         "Green tea",
         "130 mg"
        ],
        [
         "Lutein",
         "1.6 mg"
        ],
        [
         "Zeaxanthin",
         "0.1 mg"
        ],
        [
         "B. coagulans",
         "200 M"
        ]
       ]
      }
     },
     {
      "n": "Banana",
      "amt": "1",
      "info": {
       "Per 1 (~118 g)": [
        [
         "Energy",
         "105 kcal",
         "5%"
        ],
        [
         "Carbs",
         "27 g",
         "10%"
        ],
        [
         "– sugars",
         "14 g",
         "16%"
        ],
        [
         "Fibre",
         "3 g"
        ],
        [
         "Protein",
         "1.3 g",
         "3%"
        ]
       ],
       "Standouts": [
        [
         "Potassium",
         "422 mg",
         "21%"
        ],
        [
         "B6",
         "0.45 mg",
         "32%"
        ],
        [
         "Vit C",
         "10 mg",
         "12%"
        ],
        [
         "Magnesium",
         "32 mg",
         "8%"
        ]
       ]
      }
     },
     {
      "n": "Berries (frozen)",
      "amt": "50 g",
      "info": {
       "Per 50g (mixed)": [
        [
         "Energy",
         "26 kcal",
         "1%"
        ],
        [
         "Carbs",
         "6 g",
         "2%"
        ],
        [
         "– sugars",
         "3 g",
         "4%"
        ],
        [
         "Fibre",
         "2 g"
        ],
        [
         "Protein",
         "0.5 g",
         "1%"
        ]
       ],
       "Standouts": [
        [
         "Anthocyanins",
         "~100 mg"
        ],
        [
         "Vit C",
         "15 mg",
         "19%"
        ],
        [
         "Manganese",
         "0.2 mg",
         "11%"
        ],
        [
         "Vit K",
         "7 mcg",
         "10%"
        ]
       ]
      }
     }
    ]
   },
   {
    "id": "brunch",
    "t": "Brunch",
    "at": "10:00",
    "items": [
     {
      "n": "Coffee (half-caff) + milk",
      "amt": "230 + 100 ml",
      "info": {
       "Per 330 ml": [
        [
         "Energy",
         "~50 kcal",
         "2%"
        ],
        [
         "Protein",
         "3.4 g",
         "7%"
        ],
        [
         "Fat",
         "1.7 g",
         "2%"
        ],
        [
         "Carbs (lactose)",
         "4.8 g",
         "2%"
        ]
       ],
       "Standouts": [
        [
         "Caffeine",
         "~80 mg"
        ],
        [
         "Chlorogenic acids",
         "~150 mg"
        ],
        [
         "Calcium",
         "120 mg",
         "15%"
        ],
        [
         "Potassium",
         "~260 mg",
         "13%"
        ]
       ]
      }
     },
     "---",
     {
      "n": "Mozzarella di bufala",
      "amt": "100 g",
      "info": {
       "Per 100 g": [
        [
         "Energy",
         "275 kcal",
         "14%"
        ],
        [
         "Protein",
         "17 g",
         "34%"
        ],
        [
         "Fat",
         "22 g",
         "31%"
        ],
        [
         "– saturates",
         "15 g",
         "75%"
        ],
        [
         "Salt",
         "0.5 g",
         "8%"
        ]
       ],
       "Minerals": [
        [
         "Calcium",
         "350 mg",
         "44%"
        ],
        [
         "Phosphorus",
         "350 mg",
         "50%"
        ],
        [
         "Zinc",
         "2 mg",
         "20%"
        ]
       ]
      }
     },
     {
      "n": "Cherry tomatoes",
      "amt": "150 g",
      "info": {
       "Per 150 g": [
        [
         "Energy",
         "27 kcal",
         "1%"
        ],
        [
         "Carbs",
         "6 g",
         "2%"
        ],
        [
         "– sugars",
         "4 g",
         "4%"
        ],
        [
         "Fibre",
         "1.8 g"
        ],
        [
         "Protein",
         "1.4 g",
         "3%"
        ]
       ],
       "Standouts": [
        [
         "Vit C",
         "21 mg",
         "26%"
        ],
        [
         "Potassium",
         "355 mg",
         "18%"
        ],
        [
         "Lycopene",
         "~4 mg"
        ],
        [
         "Vit K",
         "12 mcg",
         "16%"
        ],
        [
         "Vit A",
         "63 mcg",
         "8%"
        ]
       ]
      }
     },
     "---",
     {
      "n": "Eggs",
      "amt": "6",
      "info": {
       "Per 6 (~300 g)": [
        [
         "Energy",
         "465 kcal",
         "23%"
        ],
        [
         "Protein",
         "38 g",
         "75%"
        ],
        [
         "Fat",
         "33 g",
         "47%"
        ],
        [
         "– saturates",
         "10 g",
         "49%"
        ]
       ],
       "Micronutrients": [
        [
         "Choline",
         "885 mg"
        ],
        [
         "Selenium",
         "90 mcg",
         "164%"
        ],
        [
         "Vit D",
         "240 IU",
         "120%"
        ],
        [
         "B12",
         "3 mcg",
         "120%"
        ],
        [
         "Vit A",
         "480 mcg",
         "60%"
        ],
        [
         "Riboflavin",
         "1.2 mg",
         "86%"
        ],
        [
         "Folate",
         "143 mcg",
         "71%"
        ]
       ]
      }
     },
     {
      "n": "Air-fried potatoes",
      "amt": "~300 g",
      "info": {
       "Prep": [
        [
         "Cooked in",
         "duck grease"
        ]
       ],
       "Per ~300 g": [
        [
         "Energy",
         "395 kcal",
         "20%"
        ],
        [
         "Carbs",
         "58 g",
         "22%"
        ],
        [
         "Fibre",
         "5 g"
        ],
        [
         "Fat",
         "15 g",
         "21%"
        ],
        [
         "– saturates",
         "5 g",
         "25%"
        ]
       ],
       "Standouts": [
        [
         "Potassium",
         "1200 mg",
         "60%"
        ],
        [
         "Vit C",
         "30 mg",
         "38%"
        ],
        [
         "B6",
         "0.9 mg",
         "64%"
        ]
       ]
      }
     },
     {
      "n": "Mushrooms (cooked)",
      "amt": "~150 g",
      "info": {
       "Per ~150 g (cooked)": [
        [
         "Energy",
         "45 kcal",
         "2%"
        ],
        [
         "Carbs",
         "6 g",
         "2%"
        ],
        [
         "Fibre",
         "3 g"
        ],
        [
         "Protein",
         "4 g",
         "8%"
        ]
       ],
       "Standouts": [
        [
         "Ergothioneine",
         "~3 mg"
        ],
        [
         "Copper",
         "0.5 mg",
         "50%"
        ],
        [
         "Pantothenic acid",
         "2 mg",
         "33%"
        ],
        [
         "Selenium",
         "14 mcg",
         "25%"
        ],
        [
         "Potassium",
         "400 mg",
         "20%"
        ]
       ]
      }
     },
     {
      "n": "Olive oil",
      "amt": "10 mL",
      "info": {
       "Per 10 mL": [
        [
         "Energy",
         "80 kcal",
         "4%"
        ],
        [
         "Fat",
         "9 g",
         "13%"
        ],
        [
         "– monounsat.",
         "7 g"
        ],
        [
         "Vit E",
         "1 mg",
         "10%"
        ]
       ]
      }
     },
     "---",
     {
      "n": "Fruit (apple, pear, peach…)",
      "amt": "~150 g",
      "info": {
       "Per piece (~150 g)": [
        [
         "Energy",
         "80 kcal",
         "4%"
        ],
        [
         "Carbs",
         "20 g",
         "8%"
        ],
        [
         "– sugars",
         "15 g",
         "17%"
        ],
        [
         "Fibre",
         "3 g"
        ],
        [
         "Vit C",
         "7 mg",
         "9%"
        ],
        [
         "Potassium",
         "180 mg",
         "9%"
        ]
       ]
      }
     },
     {
      "n": "Nuts",
      "amt": "~15 g",
      "info": {
       "Mix": [
        [
         "Walnut",
         "6g"
        ],
        [
         "Almond",
         "5g"
        ],
        [
         "Pistachio",
         "4g"
        ]
       ],
       "Per ~15 g": [
        [
         "Energy",
         "90 kcal",
         "5%"
        ],
        [
         "Protein",
         "3 g",
         "6%"
        ],
        [
         "Fat",
         "8 g",
         "11%"
        ],
        [
         "Fibre",
         "1.5 g"
        ]
       ],
       "Standouts": [
        [
         "Omega-3 (ALA)",
         "0.6 g"
        ],
        [
         "Vitamin E",
         "1.3 mg",
         "11%"
        ],
        [
         "Magnesium",
         "28 mg",
         "7%"
        ]
       ]
      }
     },
     {
      "n": "Dark chocolate",
      "amt": "~10 g",
      "info": {
       "Type": [
        [
         "Cocoa",
         "85%"
        ],
        [
         "Origin",
         "Madagascar"
        ]
       ],
       "Per ~10 g": [
        [
         "Energy",
         "60 kcal",
         "3%"
        ],
        [
         "Fat",
         "5 g",
         "7%"
        ],
        [
         "– saturates",
         "3 g",
         "14%"
        ],
        [
         "Carbs",
         "2 g",
         "1%"
        ],
        [
         "Fibre",
         "1 g"
        ]
       ],
       "Minerals": [
        [
         "Magnesium",
         "23 mg",
         "6%"
        ],
        [
         "Iron",
         "1.1 mg",
         "8%"
        ],
        [
         "Copper",
         "0.2 mg",
         "18%"
        ],
        [
         "Manganese",
         "0.2 mg",
         "10%"
        ]
       ]
      }
     }
    ]
   },
   {
    "id": "dinner",
    "t": "Dinner",
    "at": "16:30",
    "items": [
     {
      "n": "Cherry tomatoes",
      "amt": "150 g",
      "info": {
       "Per 150 g": [
        [
         "Energy",
         "27 kcal",
         "1%"
        ],
        [
         "Carbs",
         "6 g",
         "2%"
        ],
        [
         "– sugars",
         "4 g",
         "4%"
        ],
        [
         "Fibre",
         "1.8 g"
        ],
        [
         "Protein",
         "1.4 g",
         "3%"
        ]
       ],
       "Standouts": [
        [
         "Vit C",
         "21 mg",
         "26%"
        ],
        [
         "Potassium",
         "355 mg",
         "18%"
        ],
        [
         "Lycopene",
         "~4 mg"
        ],
        [
         "Vit K",
         "12 mcg",
         "16%"
        ],
        [
         "Vit A",
         "63 mcg",
         "8%"
        ]
       ]
      }
     },
     "---",
     {
      "n": "Wild rice or whole-grain pasta",
      "amt": "~75 g",
      "info": {
       "Per ~75 g cooked": [
        [
         "Energy",
         "90 kcal",
         "5%"
        ],
        [
         "Carbs",
         "19 g",
         "7%"
        ],
        [
         "Protein",
         "4 g",
         "8%"
        ],
        [
         "Fibre",
         "2 g"
        ]
       ]
      }
     },
     {
      "n": "Legumes (lentils, beans...)",
      "amt": "~75 g",
      "info": {
       "Per ~75 g cooked": [
        [
         "Energy",
         "95 kcal",
         "5%"
        ],
        [
         "Carbs",
         "17 g",
         "7%"
        ],
        [
         "Protein",
         "7 g",
         "14%"
        ],
        [
         "Fibre",
         "6 g"
        ]
       ],
       "Standouts": [
        [
         "Folate",
         "120 mcg",
         "60%"
        ],
        [
         "Iron",
         "2 mg",
         "14%"
        ],
        [
         "Potassium",
         "270 mg",
         "14%"
        ]
       ]
      }
     },
     {
      "n": "Olive oil",
      "amt": "50 mL",
      "info": {
       "Per 50 mL": [
        [
         "Energy",
         "405 kcal",
         "20%"
        ],
        [
         "Fat",
         "46 g",
         "66%"
        ],
        [
         "– monounsat.",
         "34 g"
        ],
        [
         "– saturates",
         "6 g",
         "30%"
        ],
        [
         "Vit E",
         "6 mg",
         "50%"
        ]
       ]
      }
     },
     {
      "n": "Ground beef or chicken",
      "amt": "~200 g",
      "info": {
       "Ground beef (~200 g)": [
        [
         "Energy",
         "500 kcal",
         "25%"
        ],
        [
         "Protein",
         "40 g",
         "80%"
        ],
        [
         "Fat",
         "35 g",
         "50%"
        ],
        [
         "– saturates",
         "14 g",
         "70%"
        ]
       ],
       "Minerals": [
        [
         "Iron",
         "5 mg",
         "36%"
        ],
        [
         "Zinc",
         "10 mg",
         "100%"
        ],
        [
         "B12",
         "5 mcg",
         "200%"
        ],
        [
         "Selenium",
         "30 mcg",
         "55%"
        ]
       ]
      }
     },
     {
      "n": "Frozen greens — spinach, broccoli",
      "amt": "~150 g",
      "info": {
       "Per ~150 g cooked": [
        [
         "Energy",
         "45 kcal",
         "2%"
        ],
        [
         "Carbs",
         "6 g",
         "2%"
        ],
        [
         "Fibre",
         "4 g"
        ],
        [
         "Protein",
         "4 g",
         "8%"
        ]
       ],
       "Folate, by green": [
        [
         "Spinach",
         "220 mcg",
         "55%"
        ],
        [
         "Broccoli",
         "160 mcg",
         "40%"
        ]
       ],
       "Standouts": [
        [
         "Vit K",
         "210-740 mcg"
        ],
        [
         "Vit C",
         "15-100 mg"
        ],
        [
         "Magnesium",
         "30-130 mg"
        ],
        [
         "Iron",
         "1-2.6 mg"
        ]
       ]
      }
     },
     "---",
     {
      "n": "Kiwis",
      "amt": "2",
      "info": {
       "Per 2 (~140 g)": [
        [
         "Energy",
         "85 kcal",
         "4%"
        ],
        [
         "Carbs",
         "20 g",
         "8%"
        ],
        [
         "– sugars",
         "13 g",
         "14%"
        ],
        [
         "Fibre",
         "4 g"
        ]
       ],
       "Standouts": [
        [
         "Vit C",
         "130 mg",
         "163%"
        ],
        [
         "Vit K",
         "55 mcg",
         "73%"
        ],
        [
         "Potassium",
         "430 mg",
         "22%"
        ],
        [
         "Vit E",
         "2 mg",
         "17%"
        ]
       ]
      }
     },
     {
      "n": "Nuts",
      "amt": "~15 g",
      "info": {
       "Mix": [
        [
         "Walnut",
         "6g"
        ],
        [
         "Almond",
         "5g"
        ],
        [
         "Pistachio",
         "4g"
        ]
       ],
       "Per ~15 g": [
        [
         "Energy",
         "90 kcal",
         "5%"
        ],
        [
         "Protein",
         "3 g",
         "6%"
        ],
        [
         "Fat",
         "8 g",
         "11%"
        ],
        [
         "Fibre",
         "1.5 g"
        ]
       ],
       "Standouts": [
        [
         "Omega-3 (ALA)",
         "0.6 g"
        ],
        [
         "Vitamin E",
         "1.3 mg",
         "11%"
        ],
        [
         "Magnesium",
         "28 mg",
         "7%"
        ]
       ]
      }
     },
     {
      "n": "Dark chocolate",
      "amt": "~10 g",
      "info": {
       "Type": [
        [
         "Cocoa",
         "85%"
        ],
        [
         "Origin",
         "Madagascar"
        ]
       ],
       "Per ~10 g": [
        [
         "Energy",
         "60 kcal",
         "3%"
        ],
        [
         "Fat",
         "5 g",
         "7%"
        ],
        [
         "– saturates",
         "3 g",
         "14%"
        ],
        [
         "Carbs",
         "2 g",
         "1%"
        ],
        [
         "Fibre",
         "1 g"
        ]
       ],
       "Minerals": [
        [
         "Magnesium",
         "23 mg",
         "6%"
        ],
        [
         "Iron",
         "1.1 mg",
         "8%"
        ],
        [
         "Copper",
         "0.2 mg",
         "18%"
        ],
        [
         "Manganese",
         "0.2 mg",
         "10%"
        ]
       ]
      }
     }
    ]
   }
  ]
 },
 "MARK": [
  {
   "id": "vitd",
   "cat": "vitmin",
   "dec": [
    "Vitamin D3 10000 IU + K2",
    "Boron 10mg",
    "Huel"
   ],
   "en": "Vitamin D (25-OH)",
   "fr": "Vitamine D (25-OH)",
   "us": "ng/mL",
   "units": [
    {
     "l": "nmol/L",
     "m": 0.4006
    },
    {
     "l": "ng/mL",
     "m": 1
    }
   ],
   "clin": [
    30,
    100
   ],
   "opt": [
    30,
    50
   ],
   "oc": "weak",
   "am": "critical",
   "note": "Technically a hormone rather than a vitamin. Skin makes it from UVB light, the liver converts it to the 25-OH form measured here, and the kidney activates it.\n\n25-OH is the right thing to measure because it is the storage form with a long half-life — the active form fluctuates far too quickly to be informative.\n\nIt moves over months rather than days. And daily sunscreen removes most skin synthesis, which leaves diet and supplements doing nearly all the work.",
   "axis": [
    0,
    120
   ]
  },
  {
   "id": "cacorr",
   "cat": "vitmin",
   "calc": "DERIVED, never stored: ca − (alb in g/dL − 4.0). Computed at load from the same draw's calcium and albumin — see derive() in index.html. The coefficient is the SOURCE LAB'S (1.0 mg/L per g/L of albumin), not Payne's 0.02 mmol/L, so the figure reproduces what the lab printed rather than disagreeing with the report a clinician is holding. NOT COMPUTED WHEN ALBUMIN EXCEEDS 40 g/L (4.0 g/dL) — the source lab's own rule, printed verbatim on the 2022 report: 'Calcium corrigé non indiqué car albumine >40 g/L'. Above that the correction subtracts a large (albumin − 4) from a calcium that needed no correction, turning a normal result into a falsely low one. Every draw here that measured albumin measured it above 40 (52.9 g/L in 2022, 51 in July 2026), so this row is expected to be EMPTY and that emptiness is the answer, not a gap: for this person, corrected calcium is not indicated. Read the measured calcium instead.",
   "en": "Corrected calcium",
   "fr": "Calcium corrigé",
   "us": "mg/dL",
   "units": [
    {
     "l": "mmol/L",
     "m": 4.008
    },
    {
     "l": "mg/L",
     "m": 0.1
    },
    {
     "l": "mg/dL",
     "m": 1
    }
   ],
   "clin": [
    8.6,
    10.2
   ],
   "note": "Calcium adjusted for how much albumin is available to bind it, so that low albumin is not mistaken for genuinely low calcium.\n\nIt is calculated, not measured — and only when it is valid to do so.\n\nDeliberately left empty here: the source lab's own printed rule is not to correct above 40 g/L albumin, and every albumin in this file is above that. Above that threshold the formula subtracts from a calcium that needed no correction, manufacturing a low result out of a normal one.\n\nSo an empty row is the correct answer, not a missing value.",
   "axis": [
    8,
    11
   ]
  },
  {
   "id": "ca",
   "cat": "vitmin",
   "dec": [
    "Vitamin D3 10000 IU + K2",
    "Huel"
   ],
   "en": "Calcium",
   "fr": "Calcium (calcémie)",
   "us": "mg/dL",
   "units": [
    {
     "l": "mmol/L",
     "m": 4.008
    },
    {
     "l": "mg/L",
     "m": 0.1
    },
    {
     "l": "mg/dL",
     "m": 1
    }
   ],
   "clin": [
    8.6,
    10.2
   ],
   "opt": [
    8.8,
    10
   ],
   "oc": "strong",
   "note": "Total calcium in blood, held in an extremely narrow range by PTH and vitamin D — because both muscle contraction and nerve signalling depend on it.\n\nOnly about half is free and active; the rest travels bound to albumin.\n\nThat is the catch with the total: when albumin is low, the total drops while the active half is untouched. Which is exactly what corrected calcium is for.",
   "axis": [
    8,
    11
   ]
  },
  {
   "id": "pth",
   "cat": "vitmin",
   "dec": [
    "Vitamin D3 10000 IU + K2"
   ],
   "en": "Parathyroid hormone",
   "fr": "Parathormone (PTH)",
   "us": "pg/mL",
   "units": [
    {
     "l": "pg/mL",
     "m": 1
    },
    {
     "l": "ng/L",
     "m": 1
    },
    {
     "l": "pmol/L",
     "m": 9.43
    }
   ],
   "clin": [
    15,
    65
   ],
   "opt": [
    20,
    50
   ],
   "oc": "moderate",
   "am": "critical",
   "note": "The hormone that keeps blood calcium constant. When calcium dips, the parathyroid glands release PTH, which pulls calcium from bone, tells the kidney to retain it, and activates vitamin D to absorb more.\n\nSo it is not really read on its own — it is read to interpret calcium and vitamin D.\n\nA raised PTH usually points at the deficiency behind it: the system is working, but working hard, and it is taking the calcium from your skeleton to do it.",
   "axis": [
    0,
    90
   ]
  },
  {
   "id": "phos",
   "cat": "vitmin",
   "en": "Phosphate",
   "fr": "Phosphore (phosphorémie)",
   "us": "mg/dL",
   "units": [
    {
     "l": "mmol/L",
     "m": 3.097
    },
    {
     "l": "mg/L",
     "m": 0.1
    },
    {
     "l": "mg/dL",
     "m": 1
    }
   ],
   "clin": [
    2.5,
    4.5
   ],
   "note": "An anion that pairs with calcium in bone, carries every cell's energy as the phosphate groups of ATP, and forms the backbone of DNA.\n\nIt is governed by PTH and vitamin D — the same two hormones that run calcium — but pushed the opposite way: PTH raises calcium while lowering phosphate.\n\nSo it is read next to calcium and PTH, never alone.\n\nTwo things move it independently of any disease: a meal raises it, and falling kidney function raises it early, because excreting the excess is the kidney's job.",
   "axis": [
    1.5,
    6
   ]
  },
  {
   "id": "tsh",
   "cat": "thy",
   "dec": [
    "Huel",
    "Ashwagandha 600mg"
   ],
   "en": "TSH",
   "fr": "TSH",
   "us": "µIU/mL",
   "units": [
    {
     "l": "mUI/L",
     "m": 1
    }
   ],
   "clin": [
    0.4,
    4
   ],
   "opt": [
    0.5,
    2.5
   ],
   "oc": "moderate",
   "note": "Not a thyroid hormone at all — it is the pituitary's instruction TO the thyroid. When thyroid hormone runs low the pituitary shouts louder, so TSH rises.\n\nThat inversion is why it reads backwards: high TSH means an underactive thyroid.\n\nIt is also the most sensitive early signal, moving before T4 does. But it drifts with time of day and drops during any acute illness, so a single odd value is a recheck rather than a diagnosis.",
   "axis": [
    0,
    6
   ]
  },
  {
   "id": "ft4",
   "cat": "thy",
   "dec": [
    "Ashwagandha 600mg"
   ],
   "en": "Free T4",
   "fr": "T4 libre (FT4)",
   "us": "ng/dL",
   "units": [
    {
     "l": "pmol/L",
     "m": 0.0777
    },
    {
     "l": "ng/dL",
     "m": 1
    }
   ],
   "clin": [
    0.8,
    1.8
   ],
   "opt": [
    1,
    1.5
   ],
   "oc": "moderate",
   "am": "critical",
   "note": "The unbound fraction of thyroxine, the thyroid's main output. Think of it as the reservoir — most of it is converted into the more active T3 inside tissues.\n\nRead together with TSH, because the combination locates the problem: low T4 with high TSH is the thyroid failing, low T4 with low TSH points instead at the pituitary.\n\nMost labs measure it by an indirect method that becomes unreliable when binding proteins are abnormal.",
   "axis": [
    0.4,
    2.2
   ]
  },
  {
   "id": "atpo",
   "cat": "thy",
   "en": "Anti-TPO antibodies",
   "fr": "Anticorps anti-TPO",
   "us": "IU/mL",
   "units": [
    {
     "l": "UI/mL",
     "m": 1
    }
   ],
   "clin": [
    0,
    35
   ],
   "am": "critical",
   "note": "Antibodies your immune system has made against the enzyme the thyroid uses to build its hormones. Their presence means the thyroid is under autoimmune attack.\n\nThe reason to measure it once: it tells you WHY a TSH is abnormal, which changes what happens next.\n\nThe number itself means little — these assays are poorly standardised and values do not compare between labs. Positive or negative is the finding.",
   "axis": [
    0,
    80
   ]
  },
  {
   "id": "hcy",
   "cat": "vitmin",
   "dec": [
    "NAC 12g",
    "TMG 6g",
    "B-complex (methylfolate)"
   ],
   "en": "Homocysteine",
   "fr": "Homocystéine",
   "us": "µmol/L",
   "units": [
    {
     "l": "µmol/L",
     "m": 1
    }
   ],
   "clin": [
    0,
    15
   ],
   "opt": [
    0,
    9
   ],
   "oc": "moderate",
   "am": "useful",
   "note": "An amino acid produced as an intermediate in normal metabolism, then cleared using B12, folate and B6.\n\nSo it works as a functional test of those three: when any of them is short, homocysteine backs up. That makes it more informative than measuring the vitamins directly, since it shows whether the pathway is actually working.\n\nExceptionally sensitive to handling — it keeps rising in the tube if plasma is not separated promptly, which produces falsely high results.",
   "axis": [
    0,
    20
   ]
  },
  {
   "id": "sel",
   "cat": "vitmin",
   "dec": [
    "Huel"
   ],
   "en": "Selenium",
   "fr": "Sélénium",
   "us": "µg/L",
   "units": [
    {
     "l": "µmol/L",
     "m": 78.96
    },
    {
     "l": "µg/L",
     "m": 1
    }
   ],
   "clin": [
    70,
    150
   ],
   "opt": [
    100,
    130
   ],
   "oc": "moderate",
   "am": "critical",
   "note": "A trace mineral built into the enzymes that regenerate the body's antioxidants, and into the enzyme that converts T4 into active T3.\n\nUnusual in having a narrow safe window — both deficiency and excess cause real harm, so more is not better here.\n\nBlood levels vary widely by region, because the amount in food depends on how much selenium is in the soil where it grew. Serum reflects recent intake more than long-term stores.",
   "axis": [
    40,
    200
   ]
  },
  {
   "id": "o3",
   "cat": "vitmin",
   "dec": [
    "Omega-3 (2000mg EPA, 1125mg DHA)"
   ],
   "en": "Omega-3 index",
   "fr": "Index oméga-3 (AGRAS)",
   "us": "%",
   "units": [
    {
     "l": "%",
     "m": 1
    }
   ],
   "clin": [
    4,
    12
   ],
   "opt": [
    8,
    12
   ],
   "oc": "moderate",
   "am": "critical",
   "note": "EPA and DHA expressed as a percentage of all the fatty acids in your red cell membranes.\n\nMembranes turn over slowly, so unlike a blood fatty acid level this reflects months of intake rather than the last meal — closer to an HbA1c for omega-3 status.\n\nMethod matters: the published targets belong specifically to the red-cell measurement. Plasma and whole-blood versions produce different numbers that those targets do not apply to.",
   "axis": [
    0,
    14
   ]
  },
  {
   "id": "ferr",
   "cat": "iron",
   "dec": [
    "Curcumin",
    "Huel"
   ],
   "en": "Ferritin",
   "fr": "Ferritine",
   "us": "ng/mL",
   "units": [
    {
     "l": "µg/L",
     "m": 1
    }
   ],
   "clin": [
    30,
    400
   ],
   "opt": [
    50,
    150
   ],
   "oc": "moderate",
   "am": "useful",
   "note": "The protein that stores iron inside cells, and the best single estimate of total body iron stores.\n\nWith one large caveat: ferritin is also an acute-phase protein, meaning inflammation raises it regardless of iron. So a high ferritin has two very different explanations.\n\nThe way to tell them apart is the rest of the panel — genuine iron loading raises transferrin saturation too, while inflammation leaves saturation normal or low.",
   "axis": [
    0,
    300
   ]
  },
  {
   "id": "zn",
   "cat": "vitmin",
   "dec": [
    "Huel"
   ],
   "en": "Zinc",
   "fr": "Zinc",
   "us": "µg/dL",
   "units": [
    {
     "l": "µmol/L",
     "m": 6.538
    },
    {
     "l": "µg/dL",
     "m": 1
    }
   ],
   "clin": [
    70,
    120
   ],
   "opt": [
    80,
    110
   ],
   "oc": "weak",
   "am": "critical",
   "note": "An essential trace mineral used by hundreds of enzymes, and required for immune function, wound healing, taste, and testosterone synthesis.\n\nSerum zinc is a weak proxy: it holds a tiny fraction of body zinc, and during inflammation zinc actively redistributes out of the blood into tissue as part of the immune response.\n\nSo a low value taken during any illness understates real stores, and can look like deficiency when it is simply the immune system relocating it.",
   "axis": [
    50,
    140
   ]
  },
  {
   "id": "cu",
   "cat": "vitmin",
   "en": "Copper",
   "fr": "Cuivre sérique",
   "us": "µg/dL",
   "units": [
    {
     "l": "µmol/L",
     "m": 6.354
    },
    {
     "l": "µg/dL",
     "m": 1
    }
   ],
   "clin": [
    70,
    140
   ],
   "opt": [
    80,
    120
   ],
   "oc": "moderate",
   "am": "critical",
   "note": "An essential trace mineral used in iron transport, connective tissue formation and antioxidant enzymes.\n\nRead against zinc rather than alone, because the two compete for the same intestinal transporter — sustained zinc supplementation is a well-recognised cause of copper deficiency.\n\nCopper also rises with inflammation and with oestrogen, which complicates a high result.",
   "axis": [
    40,
    180
   ]
  },
  {
   "id": "b12",
   "cat": "vitmin",
   "dec": [
    "TMG 6g",
    "Huel",
    "B-complex (methylfolate)"
   ],
   "en": "Vitamin B12",
   "fr": "Vitamine B12",
   "us": "pg/mL",
   "units": [
    {
     "l": "pmol/L",
     "m": 1.355
    },
    {
     "l": "pg/mL",
     "m": 1
    }
   ],
   "clin": [
    200,
    900
   ],
   "opt": [
    400,
    900
   ],
   "oc": "moderate",
   "am": "useful",
   "note": "A vitamin needed to build red blood cells and to maintain the myelin sheath around nerves. Only bacteria make it, so dietary sources are animal foods.\n\nThe liver stores years' worth, which is why deficiency develops slowly and silently.\n\nMeasurement caveat: serum B12 counts total B12, but most of it is bound to a protein that cannot deliver it to cells. So the result can read normal in genuine deficiency — methylmalonic acid settles the ambiguous cases.",
   "axis": [
    100,
    1000
   ]
  },
  {
   "id": "fol",
   "cat": "vitmin",
   "dec": [
    "TMG 6g",
    "Huel",
    "B-complex (methylfolate)"
   ],
   "en": "Folate",
   "fr": "Folates (vitamine B9)",
   "us": "ng/mL",
   "units": [
    {
     "l": "nmol/L",
     "m": 0.4413
    },
    {
     "l": "ng/mL",
     "m": 1
    }
   ],
   "clin": [
    3,
    17
   ],
   "opt": [
    6,
    17
   ],
   "oc": "moderate",
   "am": "useful",
   "note": "A B vitamin required for DNA synthesis and red cell production, working in the same pathway as B12.\n\nThe reason they are read together is a specific trap: folate can correct the anaemia of B12 deficiency while doing nothing for the nerve damage, which then progresses unnoticed and can become permanent.\n\nSerum folate reflects the last few days of intake; red cell folate reflects months of stores.",
   "axis": [
    0,
    20
   ]
  },
  {
   "id": "plp",
   "cat": "vitmin",
   "dec": [
    "B-complex (methylfolate)",
    "Huel"
   ],
   "en": "Vitamin B6 (PLP)",
   "fr": "Vitamine B6 (pyridoxal-5-phosphate)",
   "us": "nmol/L",
   "units": [
    {
     "l": "nmol/L",
     "m": 1
    },
    {
     "l": "µg/L",
     "m": 4.046
    }
   ],
   "clin": [
    20,
    125
   ],
   "opt": [
    40,
    110
   ],
   "oc": "moderate",
   "am": "critical",
   "note": "Pyridoxal-5-phosphate, the active form of vitamin B6 — the coenzyme for well over a hundred enzymes, most of them handling amino acids.\n\nIt is the third input to homocysteine clearance, and the one that works differently from the other two. Folate and B12 recycle homocysteine back into methionine; B6 runs the other exit, breaking it down to cysteine for good.\n\nSo a homocysteine that will not fall on folate alone often needs this one looked at.\n\nMeasure PLP, not \"vitamin B6\": the plain assay counts inactive forms as well and can read normal on a genuine deficiency. It also falls with inflammation independently of intake.",
   "axis": [
    0,
    180
   ]
  },
  {
   "id": "crea",
   "cat": "renal",
   "dec": [
    "Creatine 5g"
   ],
   "en": "Creatinine",
   "fr": "Créatinine",
   "us": "mg/dL",
   "units": [
    {
     "l": "µmol/L",
     "m": 0.01131
    },
    {
     "l": "mg/L",
     "m": 0.1
    },
    {
     "l": "mg/dL",
     "m": 1
    }
   ],
   "clin": [
    0.7,
    1.3
   ],
   "opt": [
    0.7,
    1.2
   ],
   "oc": "moderate",
   "am": "critical",
   "note": "A waste product of normal muscle metabolism, produced at a steady rate and cleared by the kidneys. If the kidneys filter less, it accumulates — which is what makes it the standard kidney marker.\n\nThe problem is that production varies as much as clearance:\n\n• More muscle mass produces more of it\n• Meat raises it for a day or so\n• Creatine supplements raise it directly\n\nAll three read as worse kidney function when nothing about the kidney has changed.",
   "axis": [
    0.4,
    1.8
   ]
  },
  {
   "id": "cysc",
   "cat": "renal",
   "dec": [
    "Creatine 5g"
   ],
   "en": "Cystatin C",
   "fr": "Cystatine C",
   "us": "mg/L",
   "units": [
    {
     "l": "mg/L",
     "m": 1
    }
   ],
   "clin": [
    0.5,
    1
   ],
   "opt": [
    0.5,
    0.9
   ],
   "oc": "moderate",
   "am": "critical",
   "note": "A small protein produced at a constant rate by every nucleated cell in the body, and filtered out by the kidneys.\n\nIts advantage over creatinine is what it does NOT depend on: muscle mass, meat intake and creatine supplements leave it alone. That makes it the more trustworthy filtration estimate in anyone who lifts, eats a lot of protein, or supplements creatine — where creatinine systematically reads worse than the kidney actually is.",
   "axis": [
    0.3,
    1.4
   ]
  },
  {
   "id": "egfr",
   "cat": "renal",
   "dec": [
    "Creatine 5g"
   ],
   "en": "eGFR",
   "fr": "DFG estimé (CKD-EPI)",
   "us": "mL/min",
   "units": [
    {
     "l": "mL/min/1.73m²",
     "m": 1
    }
   ],
   "clin": [
    60,
    140
   ],
   "opt": [
    90,
    140
   ],
   "oc": "moderate",
   "am": "critical",
   "note": "An estimate of how fast the kidneys are filtering blood, in millilitres per minute.\n\nIt is not measured. It is calculated from creatinine, age and sex — so every creatinine confound flows straight into it, including muscle mass and creatine use. A creatinine artificially raised by supplements produces an eGFR artificially low, with no kidney problem anywhere.\n\nWhich equation the lab used also changes the number, so the method matters as much as the value.",
   "axis": [
    40,
    140
   ]
  },
  {
   "id": "urea",
   "cat": "renal",
   "dec": [
    "Creatine 5g",
    "Glycine 12g + taurine + collagen"
   ],
   "en": "Urea (BUN)",
   "fr": "Urée",
   "us": "mg/dL",
   "units": [
    {
     "l": "mmol/L",
     "m": 2.801
    },
    {
     "l": "mg/dL",
     "m": 1
    }
   ],
   "clin": [
    7,
    20
   ],
   "opt": [
    7,
    18
   ],
   "oc": "weak",
   "note": "A nitrogen waste product from breaking down protein, cleared by the kidneys.\n\nRarely useful alone — its value is in the ratio to creatinine, which separates two situations that look similar: dehydration raises urea disproportionately, while true kidney impairment raises both together.\n\nA high-protein diet also raises it independently of kidney function.",
   "axis": [
    0,
    30
   ]
  },
  {
   "id": "tg",
   "cat": "lipid",
   "dec": [
    "Omega-3 (2000mg EPA, 1125mg DHA)"
   ],
   "en": "Triglycerides",
   "fr": "Triglycérides",
   "us": "mg/dL",
   "units": [
    {
     "l": "g/L",
     "m": 100
    },
    {
     "l": "mmol/L",
     "m": 88.57
    },
    {
     "l": "mg/dL",
     "m": 1
    }
   ],
   "clin": [
    0,
    150
   ],
   "opt": [
    0,
    90
   ],
   "oc": "strong",
   "note": "Fat circulating in the blood, carried mainly on VLDL particles.\n\nLess a direct cardiovascular target than a window onto metabolic health — high triglycerides usually travel with insulin resistance, and that is the thing worth acting on.\n\nExtremely responsive to what you did recently: the last meal, and alcohol in particular, move it a lot. A non-fasted sample is close to uninterpretable, and even a fasted one reflects the previous evening.",
   "axis": [
    0,
    200
   ]
  },
  {
   "id": "apob",
   "cat": "lipid",
   "en": "ApoB",
   "fr": "Apolipoprotéine B",
   "us": "mg/dL",
   "units": [
    {
     "l": "g/L",
     "m": 100
    },
    {
     "l": "mg/dL",
     "m": 1
    }
   ],
   "clin": [
    0,
    130
   ],
   "opt": [
    0,
    80
   ],
   "oc": "moderate",
   "am": "useful",
   "note": "A protein that sits on every particle capable of lodging in an artery wall — LDL, VLDL and Lp(a) — exactly one copy each.\n\nSo ApoB counts the particles directly, rather than measuring the cholesterol they happen to be carrying. That matters when the two disagree: two people with identical LDL can carry very different particle numbers, and the particle count is what tracks risk.\n\nIt is also immune to the triglyceride level that distorts calculated LDL.",
   "axis": [
    0,
    160
   ]
  },
  {
   "id": "lpa",
   "cat": "lipid",
   "en": "Lipoprotein(a)",
   "fr": "Lipoprotéine (a)",
   "us": "nmol/L",
   "units": [
    {
     "l": "nmol/L",
     "m": 1
    },
    {
     "l": "mg/dL",
     "m": 2.15
    }
   ],
   "clin": [
    0,
    105
   ],
   "opt": [
    0,
    62
   ],
   "oc": "moderate",
   "am": "critical",
   "note": "An LDL particle with an extra protein wrapped around it, which makes it stickier in artery walls and resistant to clearing. An independent cardiovascular risk factor.\n\nAlmost entirely inherited, and essentially fixed for life — so unlike LDL it is not something you move. One good measurement settles it, which is why it is usually checked once.\n\nWatch the units: it is reported either as mass (mg/dL) or particle count (nmol/L), and the two are not interchangeable.",
   "axis": [
    0,
    150
   ]
  },
  {
   "id": "nonhdl",
   "cat": "lipid",
   "dec": [
    "AGE garlic 2400mg"
   ],
   "en": "Non-HDL cholesterol",
   "fr": "NON-HDL Cholestérol",
   "us": "mg/dL",
   "units": [
    {
     "l": "g/L",
     "m": 100
    },
    {
     "l": "mmol/L",
     "m": 38.67
    },
    {
     "l": "mg/dL",
     "m": 1
    }
   ],
   "clin": [
    0,
    160
   ],
   "opt": [
    0,
    130
   ],
   "oc": "moderate",
   "note": "Total cholesterol minus HDL — in other words, all the cholesterol on particles that can lodge in an artery wall, in one number.\n\nTwo practical advantages over LDL: it needs no calculation beyond a subtraction, so it avoids the formula that makes calculated LDL unreliable, and it stays valid when you have not fasted.\n\nIt also captures remnant particles that LDL alone misses.",
   "axis": [
    0,
    200
   ]
  },
  {
   "id": "hscrp",
   "cat": "lipid",
   "dec": [
    "Omega-3 (2000mg EPA, 1125mg DHA)",
    "Curcumin"
   ],
   "en": "hs-CRP",
   "fr": "CRP ultrasensible",
   "us": "mg/L",
   "units": [
    {
     "l": "mg/L",
     "m": 1
    }
   ],
   "clin": [
    0,
    3
   ],
   "opt": [
    0,
    1
   ],
   "oc": "strong",
   "am": "critical",
   "note": "A protein the liver releases whenever there is inflammation anywhere in the body. The high-sensitivity version resolves the low range where cardiovascular risk sits, rather than the high range used to detect infection.\n\nCompletely non-specific. A cold, a cut, a dental problem, or a hard training session in the days before the draw all raise it.\n\nSo a single high value means repeat it, not conclude something. Only a persistently raised hs-CRP with no obvious cause is a finding.",
   "axis": [
    0,
    6
   ]
  },
  {
   "id": "ldl",
   "cat": "lipid",
   "dec": [
    "Omega-3 (2000mg EPA, 1125mg DHA)",
    "AGE garlic 2400mg"
   ],
   "en": "LDL cholesterol",
   "fr": "LDL-Cholestérol",
   "us": "mg/dL",
   "units": [
    {
     "l": "g/L",
     "m": 100
    },
    {
     "l": "mmol/L",
     "m": 38.67
    },
    {
     "l": "mg/dL",
     "m": 1
    }
   ],
   "clin": [
    0,
    130
   ],
   "opt": [
    0,
    100
   ],
   "oc": "moderate",
   "am": "critical",
   "note": "The cholesterol carried on LDL particles, and the main target of lipid treatment.\n\nUsually not measured. Most labs calculate it from total cholesterol, HDL and triglycerides using a formula that assumes a fixed relationship between them. That assumption breaks down in the two places it matters most:\n\n• When LDL is low, the estimate drifts\n• When triglycerides are high, it under-reports\n\nWorth knowing whether a given result was measured directly or calculated.",
   "axis": [
    0,
    190
   ]
  },
  {
   "id": "hdl",
   "cat": "lipid",
   "dec": [
    "Omega-3 (2000mg EPA, 1125mg DHA)",
    "AGE garlic 2400mg"
   ],
   "en": "HDL cholesterol",
   "fr": "HDL-Cholestérol",
   "us": "mg/dL",
   "units": [
    {
     "l": "g/L",
     "m": 100
    },
    {
     "l": "mmol/L",
     "m": 38.67
    },
    {
     "l": "mg/dL",
     "m": 1
    }
   ],
   "clin": [
    40,
    100
   ],
   "note": "Cholesterol on HDL particles, long described as the 'good' cholesterol because higher levels track with lower risk in population studies.\n\nThat description has not survived testing. Drugs that raise HDL do not reduce heart attacks, and genetic variants that raise it lifelong do not protect — so the association appears to be a marker of something else, not a cause.\n\nVery high values are also associated with higher mortality, not lower. Which is why there is deliberately no target here.",
   "axis": [
    20,
    110
   ]
  },
  {
   "id": "chol",
   "cat": "lipid",
   "dec": [
    "AGE garlic 2400mg"
   ],
   "en": "Total cholesterol",
   "fr": "Cholestérol total",
   "us": "mg/dL",
   "units": [
    {
     "l": "g/L",
     "m": 100
    },
    {
     "l": "mmol/L",
     "m": 38.67
    },
    {
     "l": "mg/dL",
     "m": 1
    }
   ],
   "clin": [
    0,
    200
   ],
   "opt": [
    0,
    180
   ],
   "oc": "weak",
   "note": "Every cholesterol molecule in the blood, across all particle types.\n\nKept mostly out of convention and as the input to non-HDL. On its own it is close to uninformative, because it adds together particles that raise risk and particles that do not.\n\nA perfectly normal total can conceal a high LDL that happens to be offset by a high HDL.",
   "axis": [
    100,
    280
   ]
  },
  {
   "id": "glu",
   "cat": "lipid",
   "en": "Fasting glucose",
   "fr": "Glycémie à jeun",
   "us": "mg/dL",
   "units": [
    {
     "l": "g/L",
     "m": 100
    },
    {
     "l": "mmol/L",
     "m": 18.016
    },
    {
     "l": "mg/dL",
     "m": 1
    }
   ],
   "clin": [
    70,
    99
   ],
   "opt": [
    75,
    90
   ],
   "oc": "moderate",
   "note": "Blood sugar after an overnight fast — the simplest screen for how well glucose is regulated.\n\nIts weakness is timing: fasting glucose is the last thing to move as regulation deteriorates. The body will hold it normal for years by producing more insulin, so it can look fine well after the underlying problem has started.\n\nAlso a single snapshot, shifted by the previous evening's meal, poor sleep and stress. HbA1c answers the same question with far less noise.",
   "axis": [
    60,
    130
   ]
  },
  {
   "id": "a1c",
   "cat": "lipid",
   "en": "HbA1c",
   "fr": "Hémoglobine glyquée",
   "us": "%",
   "units": [
    {
     "l": "%",
     "m": 1
    },
    {
     "l": "mmol/mol (IFCC)",
     "a": 0.09148,
     "b": 2.152
    }
   ],
   "clin": [
    4,
    5.6
   ],
   "opt": [
    4.6,
    5.4
   ],
   "oc": "moderate",
   "am": "useful",
   "note": "A snapshot of the past three months rather than this morning. Glucose slowly sticks to haemoglobin inside red cells, and since a red cell lives about 120 days, the fraction that is coated reflects average blood sugar over that window — weighted toward the most recent weeks.\n\nThe main trap: anything that shortens red cell lifespan gives glucose less time to attach, so the result understates true average sugar. It is only as reliable as the blood count sitting next to it.",
   "axis": [
    4,
    7
   ]
  },
  {
   "id": "ins",
   "cat": "lipid",
   "en": "Fasting insulin",
   "fr": "Insuline à jeun",
   "us": "µIU/mL",
   "units": [
    {
     "l": "mUI/L",
     "m": 1
    },
    {
     "l": "pmol/L",
     "m": 0.144
    }
   ],
   "clin": [
    2,
    20
   ],
   "opt": [
    2,
    7
   ],
   "oc": "moderate",
   "am": "critical",
   "note": "The hormone that moves glucose out of the blood and into cells, measured fasting.\n\nThe reason to track it is timing. As cells become resistant, the pancreas compensates by producing more insulin — and it succeeds for years. Glucose stays normal the whole time. Insulin is what rises first, which makes it the early warning that fasting glucose cannot give.\n\nCaveat: insulin assays are not standardised, so absolute values do not transfer between labs.",
   "axis": [
    0,
    25
   ]
  },
  {
   "id": "ua",
   "cat": "lipid",
   "en": "Uric acid",
   "fr": "Acide urique",
   "us": "mg/dL",
   "units": [
    {
     "l": "µmol/L",
     "m": 0.01681
    },
    {
     "l": "mg/dL",
     "m": 1
    }
   ],
   "clin": [
    3.5,
    7.2
   ],
   "opt": [
    3.5,
    5.5
   ],
   "oc": "moderate",
   "note": "The waste product left when the body breaks down purines, cleared by the kidneys.\n\nTwo reasons to watch it: above a certain concentration it crystallises in joints, which is gout, and it rises alongside insulin resistance and high fructose intake, making it a rough metabolic marker.\n\nAlso rises temporarily with fasting, dehydration and intense exercise — all three raise it without anything changing underneath.",
   "axis": [
    2,
    9
   ]
  },
  {
   "id": "alt",
   "cat": "liver",
   "dec": [
    "Curcumin",
    "NAC 12g"
   ],
   "en": "ALT",
   "fr": "ALAT (TGP)",
   "us": "U/L",
   "units": [
    {
     "l": "UI/L",
     "m": 1
    }
   ],
   "clin": [
    0,
    40
   ],
   "opt": [
    0,
    30
   ],
   "oc": "moderate",
   "am": "useful",
   "note": "An enzyme that lives inside liver cells. When those cells are damaged it leaks into the blood, so a rise means liver injury.\n\nIt is the more liver-specific of the two transaminases — which is precisely what makes the pair useful together. AST is also abundant in muscle; ALT largely is not. So if AST climbs and ALT stays put, the source is muscle rather than liver.",
   "axis": [
    0,
    70
   ]
  },
  {
   "id": "ast",
   "cat": "liver",
   "dec": [
    "Curcumin",
    "NAC 12g"
   ],
   "en": "AST",
   "fr": "ASAT (TGO)",
   "us": "U/L",
   "units": [
    {
     "l": "UI/L",
     "m": 1
    }
   ],
   "clin": [
    0,
    40
   ],
   "opt": [
    0,
    30
   ],
   "oc": "moderate",
   "am": "useful",
   "note": "An enzyme found in liver cells, but also in skeletal muscle and heart. It leaks into the blood whenever any of those are damaged.\n\nThat breadth is its weakness. Hard training damages muscle fibres as a normal part of adaptation, which raises AST with the liver entirely untouched.\n\nSo AST is read alongside ALT rather than alone: both rising points at liver, AST rising by itself points at muscle.",
   "axis": [
    0,
    70
   ]
  },
  {
   "id": "ggt",
   "cat": "liver",
   "dec": [
    "Curcumin"
   ],
   "en": "GGT",
   "fr": "Gamma-GT",
   "us": "U/L",
   "units": [
    {
     "l": "UI/L",
     "m": 1
    }
   ],
   "clin": [
    0,
    55
   ],
   "opt": [
    0,
    25
   ],
   "oc": "moderate",
   "note": "An enzyme concentrated in the small bile ducts inside the liver.\n\nTwo jobs. First, it disambiguates a high alkaline phosphatase — ALP comes from both liver and bone, and a raised GGT alongside it says the source is liver. Second, it is the most sensitive routine marker of alcohol intake.\n\nCaveat: many ordinary medications induce it, raising the number with no liver injury at all.",
   "axis": [
    0,
    90
   ]
  },
  {
   "id": "alp",
   "cat": "liver",
   "dec": [
    "Vitamin D3 10000 IU + K2"
   ],
   "en": "Alkaline phosphatase",
   "fr": "Phosphatases alcalines",
   "us": "U/L",
   "units": [
    {
     "l": "UI/L",
     "m": 1
    }
   ],
   "clin": [
    40,
    130
   ],
   "opt": [
    40,
    110
   ],
   "oc": "weak",
   "note": "An enzyme that comes from two unrelated places — bile ducts and bone — which is what makes it ambiguous on its own.\n\nRaised ALP means the liver or the skeleton, and you cannot tell which from this number. GGT settles it: raised alongside points at liver, normal alongside points at bone.\n\nPhysiologically high during adolescent growth and while a fracture heals, neither of which is a problem.",
   "axis": [
    20,
    170
   ]
  },
  {
   "id": "bili",
   "cat": "liver",
   "dec": [
    "Curcumin"
   ],
   "en": "Total bilirubin",
   "fr": "Bilirubine totale",
   "us": "mg/dL",
   "units": [
    {
     "l": "µmol/L",
     "m": 0.05848
    },
    {
     "l": "mg/dL",
     "m": 1
    }
   ],
   "clin": [
    0.2,
    1.2
   ],
   "note": "The yellow pigment left over when old red blood cells are broken down. The liver picks it up, processes it, and excretes it in bile.\n\nSo it rises either when the liver cannot process it or when red cells are being destroyed faster than usual.\n\nThe common finding by far is neither: a mildly raised unprocessed bilirubin is usually Gilbert's syndrome, a harmless inherited quirk in about 1 in 20 people. It becomes more obvious with fasting, illness or stress.",
   "axis": [
    0,
    2
   ]
  },
  {
   "id": "alb",
   "cat": "liver",
   "dec": [
    "Vitamin D3 10000 IU + K2"
   ],
   "en": "Albumin",
   "fr": "Albumine",
   "us": "g/dL",
   "units": [
    {
     "l": "g/L",
     "m": 0.1
    },
    {
     "l": "g/dL",
     "m": 1
    }
   ],
   "clin": [
    3.5,
    5.2
   ],
   "opt": [
    4.5,
    5.2
   ],
   "oc": "moderate",
   "am": "critical",
   "note": "The most abundant protein in blood, made by the liver. It carries hormones, drugs and calcium, and holds fluid inside blood vessels by osmotic pull.\n\nTracked for liver output and nutritional status.\n\nIt matters here for a second reason: it is an input to both corrected calcium and calculated free testosterone. So however albumin was measured propagates into both of those numbers.",
   "axis": [
    3,
    5.5
   ]
  },
  {
   "id": "ptime",
   "cat": "liver",
   "en": "Prothrombin time",
   "fr": "Taux de prothrombine (TP)",
   "us": "%",
   "units": [
    {
     "l": "%",
     "m": 1
    }
   ],
   "clin": [
    70,
    100
   ],
   "am": "useful",
   "note": "How fast plasma clots once the cascade is triggered from outside the vessel — a pathway that runs on clotting factors the liver makes, most of them vitamin K–dependent.\n\nFrance reports it as a percentage of normal, so a higher number is faster clotting and a lower one is slower.\n\nTwo things pull it down: liver disease, because the factors stop being made, and warfarin, because it blocks the vitamin K they need.\n\nIt is also why INR exists. Labs use reagents of differing strength, and INR is the arithmetic that makes one lab's result comparable with another's.",
   "axis": [
    40,
    120
   ]
  },
  {
   "id": "aptt",
   "cat": "liver",
   "en": "aPTT ratio",
   "fr": "TCA (rapport patient/témoin)",
   "us": "ratio",
   "units": [
    {
     "l": "ratio",
     "m": 1
    }
   ],
   "clin": [
    0,
    1.2
   ],
   "am": "useful",
   "note": "How long plasma takes to clot when the cascade is triggered from inside the vessel — the contact pathway, which runs on a different set of factors from the prothrombin time.\n\nReported as a ratio against the lab's own control, because reagents vary so much that raw seconds mean nothing between laboratories.\n\nA long result means a factor is missing or something is blocking the reaction. Haemophilia shows here, and so does lupus anticoagulant — which, confusingly, causes clotting rather than bleeding.\n\nIt is also the test used to follow unfractionated heparin.",
   "axis": [
    0.6,
    1.6
   ]
  },
  {
   "id": "fib",
   "cat": "liver",
   "en": "Fibrinogen",
   "fr": "Fibrinogène",
   "us": "g/L",
   "units": [
    {
     "l": "g/L",
     "m": 1
    }
   ],
   "clin": [
    2,
    4
   ],
   "am": "useful",
   "note": "The protein that clotting converts into fibrin — the mesh a clot is actually built from. Made by the liver, and the most abundant clotting factor in blood.\n\nIt is also an acute-phase reactant, so it climbs with any inflammation, infection or injury, alongside CRP but more slowly and for longer.\n\nThat double role is the difficulty: low means the liver is struggling or the fibrinogen is being consumed, while high usually means inflammation rather than any clotting problem at all.\n\nIt is measured by timing a clot, so heparin in the sample distorts it.",
   "axis": [
    1,
    6
   ]
  },
  {
   "id": "tt",
   "cat": "horm",
   "dec": [
    "Boron 10mg",
    "Finasteride (topical) 0.1% - 1mL",
    "Ashwagandha 600mg"
   ],
   "en": "Total testosterone",
   "fr": "Testostérone totale",
   "us": "ng/dL",
   "units": [
    {
     "l": "nmol/L",
     "m": 28.84
    },
    {
     "l": "ng/dL",
     "m": 1
    }
   ],
   "clin": [
    264,
    916
   ],
   "opt": [
    550,
    900
   ],
   "oc": "weak",
   "am": "critical",
   "note": "All the testosterone in your blood — the roughly 98% bound to carrier proteins plus the small free fraction.\n\nThe headline androgen number, but it needs context to read:\n\n• It peaks a few hours after waking and declines through the day, so a morning and an afternoon draw are not comparable\n• Immunoassays and mass spectrometry disagree, especially at lower concentrations\n\nMost of it is bound to SHBG and unavailable, which is why total alone can mislead when SHBG is unusual.",
   "axis": [
    200,
    1100
   ]
  },
  {
   "id": "ft",
   "cat": "horm",
   "dec": [
    "Boron 10mg",
    "Finasteride (topical) 0.1% - 1mL"
   ],
   "en": "Free testosterone",
   "fr": "Testostérone libre",
   "us": "pg/mL",
   "units": [
    {
     "l": "pmol/L",
     "m": 0.2884
    },
    {
     "l": "pg/mL",
     "m": 1
    }
   ],
   "clin": [
    47,
    244
   ],
   "opt": [
    100,
    200
   ],
   "oc": "weak",
   "am": "critical",
   "note": "The small slice of testosterone not bound to SHBG or albumin — the portion actually free to enter cells and act.\n\nThis is not measured here. It is calculated from total testosterone, SHBG and albumin using the Vermeulen equation, so it inherits the measurement quirks of all three.\n\nThat is still the better option: direct free-testosterone immunoassays are notoriously unreliable, and this panel already discarded one implausible value from that kind of assay.",
   "axis": [
    20,
    280
   ]
  },
  {
   "id": "shbg",
   "cat": "horm",
   "dec": [
    "Boron 10mg",
    "Finasteride (topical) 0.1% - 1mL"
   ],
   "en": "SHBG",
   "fr": "SHBG",
   "us": "nmol/L",
   "units": [
    {
     "l": "nmol/L",
     "m": 1
    }
   ],
   "clin": [
    18,
    54
   ],
   "opt": [
    20,
    45
   ],
   "oc": "moderate",
   "am": "critical",
   "note": "A liver-made protein that grips testosterone and carries it through the blood. Bound testosterone cannot enter cells, so SHBG effectively decides how much of your total is usable.\n\nThat makes it necessary rather than optional: the same total testosterone means different things at high and low SHBG.\n\nIt also reports on metabolic health — it rises with thyroid hormone and falls with insulin resistance and higher body fat.",
   "axis": [
    10,
    70
   ]
  },
  {
   "id": "e2",
   "cat": "horm",
   "dec": [
    "Boron 10mg",
    "Finasteride (topical) 0.1% - 1mL"
   ],
   "en": "Estradiol",
   "fr": "Œstradiol (E2)",
   "us": "pg/mL",
   "units": [
    {
     "l": "pmol/L",
     "m": 0.2724
    },
    {
     "l": "pg/mL",
     "m": 1
    }
   ],
   "clin": [
    10,
    40
   ],
   "am": "critical",
   "note": "The main oestrogen. In men it is not produced directly in any quantity — it is converted from testosterone by the aromatase enzyme, mostly in fat tissue.\n\nWorth tracking because both directions cause problems, and because it moves with testosterone rather than independently of it. More fat mass means more conversion.\n\nMeasurement is the difficulty: standard immunoassays are unreliable at the low concentrations found in men, and mass spectrometry is the reference method.",
   "axis": [
    0,
    60
   ]
  },
  {
   "id": "dht",
   "cat": "horm",
   "dec": [
    "Finasteride (topical) 0.1% - 1mL"
   ],
   "en": "DHT",
   "fr": "Dihydrotestostérone",
   "us": "ng/dL",
   "units": [
    {
     "l": "nmol/L",
     "m": 29
    },
    {
     "l": "ng/dL",
     "m": 1
    }
   ],
   "clin": [
    23,
    102
   ],
   "am": "critical",
   "note": "The strongest androgen in the body, converted from testosterone by 5-alpha-reductase in skin, hair follicles and prostate.\n\nIt binds the androgen receptor several times more tightly than testosterone, which is why it — not testosterone — drives male-pattern hair loss and prostate growth.\n\nAlso the direct target of finasteride, which blocks that conversion.\n\nMeasurement caveat: immunoassays cross-react heavily with testosterone. Mass spectrometry is effectively required.",
   "axis": [
    0,
    110
   ]
  },
  {
   "id": "lh",
   "cat": "horm",
   "en": "LH",
   "fr": "LH",
   "us": "IU/L",
   "units": [
    {
     "l": "UI/L",
     "m": 1
    }
   ],
   "clin": [
    1.7,
    8.6
   ],
   "note": "The pituitary's signal telling the testes to produce testosterone.\n\nIts value is in localising a problem rather than in the number itself:\n\n• Low testosterone with HIGH LH — the testes are being asked and not delivering\n• Low testosterone with LOW LH — the signal itself is missing, so the problem is upstream in the pituitary\n\nReleased in pulses through the day, so a single draw catches an arbitrary point in that rhythm.",
   "axis": [
    0,
    12
   ]
  },
  {
   "id": "fsh",
   "cat": "horm",
   "en": "FSH",
   "fr": "FSH",
   "us": "IU/L",
   "units": [
    {
     "l": "UI/L",
     "m": 1
    }
   ],
   "clin": [
    1.5,
    12.4
   ],
   "opt": [
    2,
    10
   ],
   "oc": "weak",
   "note": "The pituitary's other gonadal signal, driving sperm production in the testes.\n\nRead alongside LH for the same localising logic, and it is the more sensitive of the two to testicular damage — FSH often rises first when the testes are struggling.\n\nAlso pulsatile, though its swings are gentler than LH's.",
   "axis": [
    0,
    16
   ]
  },
  {
   "id": "cort",
   "cat": "horm",
   "dec": [
    "Ashwagandha 600mg"
   ],
   "en": "Cortisol (morning)",
   "fr": "Cortisol (8h)",
   "us": "µg/dL",
   "units": [
    {
     "l": "nmol/L",
     "m": 0.03625
    },
    {
     "l": "µg/dL",
     "m": 1
    }
   ],
   "clin": [
    6,
    23
   ],
   "opt": [
    8,
    18
   ],
   "oc": "weak",
   "am": "useful",
   "note": "The main stress hormone, and one of the most strongly rhythmic things in the body. It surges in the first hour after waking, then falls steadily all day.\n\nThat rhythm dominates the measurement. The reference range assumes a morning draw — the same person sampled in the afternoon can look adrenally deficient with nothing wrong at all.\n\nSo the collection time is not a detail here; without it the number cannot be interpreted.",
   "axis": [
    0,
    30
   ]
  },
  {
   "id": "prl",
   "cat": "horm",
   "dec": [
    "Finasteride (topical) 0.1% - 1mL"
   ],
   "en": "Prolactin",
   "fr": "Prolactine",
   "us": "ng/mL",
   "units": [
    {
     "l": "ng/mL",
     "m": 1
    },
    {
     "l": "µg/L",
     "m": 1
    },
    {
     "l": "mUI/L",
     "m": 0.0472
    }
   ],
   "clin": [
    2,
    18
   ],
   "opt": [
    2,
    15
   ],
   "oc": "weak",
   "am": "critical",
   "note": "A pituitary hormone best known for lactation, but relevant here because when it is persistently high it suppresses testosterone.\n\nWorth checking once in anyone with unexplained low testosterone, since a small prolactin-secreting pituitary tumour is both a real cause and a treatable one.\n\nTwo things inflate it harmlessly: stress and sleep, and macroprolactin — a bulky bound form the body cannot use, which some labs count in the total unless they screen for it.",
   "axis": [
    0,
    30
   ]
  },
  {
   "id": "plt",
   "cat": "cbc",
   "dec": [
    "Omega-3 (2000mg EPA, 1125mg DHA)",
    "Curcumin",
    "AGE garlic 2400mg"
   ],
   "en": "Platelets",
   "fr": "Plaquettes",
   "us": "10³/µL",
   "units": [
    {
     "l": "G/L",
     "m": 1
    }
   ],
   "clin": [
    150,
    400
   ],
   "opt": [
    180,
    350
   ],
   "oc": "moderate",
   "note": "Cell fragments that form the first plug at a bleeding site — the beginning of a clot.\n\nTracked for bleeding and clotting risk, and as a general check on bone marrow output.\n\nOne common artefact: in some people platelets clump together inside the collection tube. The analyser counts a clump as one platelet, so the result comes back falsely low. If a low count appears out of nowhere in someone with no symptoms, this is the first thing to rule out.",
   "axis": [
    100,
    450
   ]
  },
  {
   "id": "mpv",
   "cat": "cbc",
   "en": "MPV",
   "fr": "V.P.M.",
   "us": "fL",
   "units": [
    {
     "l": "fL",
     "m": 1
    }
   ],
   "clin": [
    7,
    11
   ],
   "am": "useful",
   "note": "The average size of your platelets. Bigger platelets are younger, so a high value suggests the marrow is producing them quickly.\n\nRead alongside the platelet count rather than alone — the pair together says more about turnover than either does.\n\nBig caveat: platelets swell the longer they sit in the tube before being measured. That makes MPV as much a reflection of how fast the sample reached the analyser as of anything happening in you.",
   "axis": [
    5,
    14
   ]
  },
  {
   "id": "hb",
   "cat": "cbc",
   "en": "Hemoglobin",
   "fr": "Hémoglobine",
   "us": "g/dL",
   "units": [
    {
     "l": "g/dL",
     "m": 1
    },
    {
     "l": "g/L",
     "m": 0.1
    }
   ],
   "clin": [
    13.5,
    17.5
   ],
   "opt": [
    14,
    17
   ],
   "oc": "moderate",
   "note": "The protein inside red blood cells that actually carries oxygen. Low haemoglobin IS anaemia — the two mean the same thing.\n\nIt is a concentration: grams of haemoglobin per volume of blood. So the number moves when the amount of fluid changes, even if your red cells do not:\n\n• Dehydrated — less plasma, same cells, so it reads higher\n• Endurance-trained — the body carries extra plasma, diluting it, so it reads lower\n\nThat second one is why fit endurance athletes often look mildly anaemic on paper and are not.",
   "axis": [
    11,
    19
   ]
  },
  {
   "id": "hct",
   "cat": "cbc",
   "en": "Hematocrit",
   "fr": "Hématocrite",
   "us": "%",
   "units": [
    {
     "l": "%",
     "m": 1
    }
   ],
   "clin": [
    40,
    52
   ],
   "opt": [
    42,
    50
   ],
   "oc": "moderate",
   "note": "The share of your blood that is red cells rather than liquid, as a percentage. Roughly 45% cells, 55% plasma.\n\nIt says much the same thing as haemoglobin and rarely adds to it. Because it is a ratio, it is even more sensitive to hydration: the same red cells suspended in less fluid make a bigger share of the total, so the percentage climbs without a single new cell being made.",
   "axis": [
    35,
    58
   ]
  },
  {
   "id": "rbc",
   "cat": "cbc",
   "en": "Red blood cells",
   "fr": "Hématies (GR)",
   "us": "10⁶/µL",
   "units": [
    {
     "l": "T/L",
     "m": 1
    },
    {
     "l": "10⁶/µL",
     "m": 1
    }
   ],
   "clin": [
    4.2,
    5.8
   ],
   "opt": [
    4.5,
    5.6
   ],
   "oc": "weak",
   "note": "A straight count of how many red cells are in a given volume of blood.\n\nOn its own it says surprisingly little, because it counts cells without asking how much haemoglobin each one carries — you can have plenty of cells that are each under-filled. Its real job is as the denominator for MCV, MCH and MCHC, which is where the useful detail lives.\n\nBeing a per-volume count, hydration shifts it exactly as it shifts haemoglobin.",
   "axis": [
    3.5,
    6.5
   ]
  },
  {
   "id": "mcv",
   "cat": "cbc",
   "en": "MCV",
   "fr": "VGM",
   "us": "fL",
   "units": [
    {
     "l": "fL",
     "m": 1
    }
   ],
   "clin": [
    80,
    100
   ],
   "opt": [
    85,
    95
   ],
   "oc": "weak",
   "note": "The average size of your red blood cells.\n\nSize is the single most useful clue to why someone is anaemic, because the common causes push it in opposite directions:\n\n• Small cells — iron deficiency, or thalassaemia trait\n• Large cells — B12 or folate deficiency, alcohol, or an underactive thyroid\n\nThe catch: if two causes are present at once they cancel out and the average lands normal. A normal MCV does not rule out either problem.",
   "axis": [
    70,
    110
   ]
  },
  {
   "id": "mch",
   "cat": "cbc",
   "en": "MCH",
   "fr": "TCMH",
   "us": "pg",
   "units": [
    {
     "l": "pg",
     "m": 1
    }
   ],
   "clin": [
    26,
    34
   ],
   "opt": [
    28,
    33
   ],
   "oc": "weak",
   "note": "The average amount of haemoglobin packed into each red cell, by weight.\n\nIt moves almost in lockstep with cell size, so in practice it rarely tells you anything MCV has not already. Mostly it serves as a consistency check that the analyser's sizing and its haemoglobin measurement agree with each other.",
   "axis": [
    22,
    38
   ]
  },
  {
   "id": "mchc",
   "cat": "cbc",
   "en": "MCHC",
   "fr": "CCMH",
   "us": "g/dL",
   "units": [
    {
     "l": "g/L",
     "m": 0.1
    },
    {
     "l": "g/dL",
     "m": 1
    }
   ],
   "clin": [
    31,
    36.5
   ],
   "opt": [
    32,
    36.5
   ],
   "oc": "weak",
   "note": "How concentrated the haemoglobin is inside each cell — not how much per cell, but how tightly packed.\n\nUnusual among the red cell indices in being largely independent of the instrument used. That makes a high value informative in an unexpected way: it is usually a sign of a measurement problem rather than a real finding — fat in the sample, ruptured cells, or cold-clumping antibodies confusing the analyser.",
   "axis": [
    29,
    38
   ]
  },
  {
   "id": "rdw",
   "cat": "cbc",
   "en": "RDW",
   "fr": "IDR",
   "us": "%",
   "units": [
    {
     "l": "%",
     "m": 1
    }
   ],
   "clin": [
    11,
    15
   ],
   "opt": [
    11,
    13.5
   ],
   "oc": "weak",
   "note": "How much your red cells vary in size — a high value means a mixed population rather than a uniform one.\n\nUseful because it often moves before the average size does. When a deficiency is developing, new cells come out the wrong size while the old normal ones are still circulating, so the spread widens while MCV still reads normal.\n\nIt also rises when two causes overlap, which is exactly the case where MCV is misleadingly normal.",
   "axis": [
    9,
    18
   ]
  },
  {
   "id": "wbc",
   "cat": "cbc",
   "en": "White blood cells",
   "fr": "Leucocytes (GB)",
   "us": "10³/µL",
   "units": [
    {
     "l": "G/L",
     "m": 1
    }
   ],
   "clin": [
    4,
    10
   ],
   "opt": [
    4.5,
    8.5
   ],
   "oc": "weak",
   "note": "The total number of immune cells in circulation. A broad screen for infection, inflammation and bone-marrow function.\n\nThe total by itself is fairly blunt — nearly all the information is in the breakdown below it, since a high count from neutrophils means something very different from a high count from lymphocytes.\n\nRises briefly with acute stress, adrenaline, and recent hard exercise, none of which involve illness.",
   "axis": [
    2,
    13
   ]
  },
  {
   "id": "neut",
   "cat": "cbc",
   "en": "Neutrophils",
   "fr": "Polynucléaires neutrophiles",
   "us": "cells/µL",
   "units": [
    {
     "l": "cells/µL",
     "m": 1
    },
    {
     "l": "G/L",
     "m": 1000
    }
   ],
   "clin": [
    1500,
    7800
   ],
   "opt": [
    2000,
    6000
   ],
   "oc": "weak",
   "note": "The immune system's first responders, and usually the largest white cell group. They arrive first at bacterial infections.\n\nThey are also the main reason a white count swings either way.\n\nWorth knowing: they climb within hours of physical stress — a hard training session, a bad night's sleep, or simply the adrenaline of the blood draw itself. A mild elevation very often has nothing to do with infection.",
   "axis": [
    1000,
    9000
   ]
  },
  {
   "id": "lymph",
   "cat": "cbc",
   "en": "Lymphocytes",
   "fr": "Lymphocytes",
   "us": "cells/µL",
   "units": [
    {
     "l": "cells/µL",
     "m": 1
    },
    {
     "l": "G/L",
     "m": 1000
    }
   ],
   "clin": [
    850,
    3900
   ],
   "opt": [
    1200,
    3000
   ],
   "oc": "weak",
   "note": "T cells and B cells — the part of the immune system that handles viruses and remembers past infections.\n\nTracked for immune competence, and because a persistently high or low count can point at something more.\n\nThey drop sharply when cortisol is high, so stress or an early-morning draw both push them down temporarily. A single low reading is usually the clock or the day, not the immune system.",
   "axis": [
    500,
    4500
   ]
  },
  {
   "id": "mono",
   "cat": "cbc",
   "en": "Monocytes",
   "fr": "Monocytes",
   "us": "cells/µL",
   "units": [
    {
     "l": "cells/µL",
     "m": 1
    },
    {
     "l": "G/L",
     "m": 1000
    }
   ],
   "clin": [
    200,
    950
   ],
   "opt": [
    250,
    800
   ],
   "oc": "weak",
   "note": "Cells that clean up debris and mature into the macrophages that live in tissue.\n\nThey rise during chronic inflammation and during recovery from infection — often climbing just as neutrophils fall, which is a useful sign that something is resolving rather than starting.\n\nRarely informative on its own; the ratio to lymphocytes carries more than the raw count.",
   "axis": [
    0,
    1100
   ]
  },
  {
   "id": "eos",
   "cat": "cbc",
   "en": "Eosinophils",
   "fr": "Polynucléaires éosinophiles",
   "us": "cells/µL",
   "units": [
    {
     "l": "cells/µL",
     "m": 1
    },
    {
     "l": "G/L",
     "m": 1000
    }
   ],
   "clin": [
    15,
    500
   ],
   "opt": [
    15,
    350
   ],
   "oc": "weak",
   "note": "White cells that deal with allergy and parasites, and the clearest blood signal that an allergic process is active.\n\nThey normally make up a very small fraction of white cells, which creates a trap: a tiny absolute change looks dramatic when expressed as a percentage. Read the absolute count, not the percent.",
   "axis": [
    0,
    600
   ]
  },
  {
   "id": "ige",
   "cat": "cbc",
   "en": "IgE (total)",
   "fr": "Immunoglobuline E totale",
   "us": "UI/mL",
   "units": [
    {
     "l": "UI/mL",
     "m": 1
    },
    {
     "l": "kUI/L",
     "m": 1
    },
    {
     "l": "ng/mL",
     "m": 0.4167
    }
   ],
   "clin": [
    0,
    100
   ],
   "am": "useful",
   "note": "The antibody class evolved to fight parasites, which in wealthy countries mostly ends up doing allergy instead. It sits on the surface of mast cells, and when its target binds, the cell dumps histamine.\n\nTotal IgE adds every specificity together, so it says you react to something without saying what. It rises with hay fever, asthma, eczema and food allergy — and much further with parasites, or with an allergic reaction to a mould growing in the airways.\n\nA normal total does not rule allergy out: one strong sensitivity can hide inside a normal sum. Specific IgE against named allergens is what actually answers the question.",
   "axis": [
    0,
    300
   ]
  },
  {
   "id": "baso",
   "cat": "cbc",
   "en": "Basophils",
   "fr": "Polynucléaires basophiles",
   "us": "cells/µL",
   "units": [
    {
     "l": "cells/µL",
     "m": 1
    },
    {
     "l": "G/L",
     "m": 1000
    }
   ],
   "clin": [
    0,
    200
   ],
   "opt": [
    0,
    150
   ],
   "oc": "weak",
   "note": "The rarest white cell, involved in histamine release and allergic reactions.\n\nThey are present in such small numbers that the count is imprecise by nature — a single high or low value is usually just the statistics of counting very few things. A persistent pattern across several draws means something; one reading does not.",
   "axis": [
    0,
    250
   ]
  },
  {
   "id": "esr",
   "cat": "cbc",
   "en": "ESR (1st hour)",
   "fr": "Vitesse de sédimentation",
   "us": "mm/h",
   "units": [
    {
     "l": "mm/h",
     "m": 1
    }
   ],
   "clin": [
    0,
    15
   ],
   "am": "useful",
   "note": "How far red cells sink through a column of plasma in one hour. Inflammation produces proteins that make red cells stack together, and stacks sink faster.\n\nSo it is an indirect and slow read on inflammation: days to rise, weeks to fall, where CRP does both within hours.\n\nThat lag is its one real advantage — it describes the past few weeks rather than this morning. For everything else hs-CRP is simply better, and this test is largely a survivor from pre-CRP medicine.\n\nAge, anaemia and sex all shift it with no inflammation present at all.",
   "axis": [
    0,
    30
   ]
  },
  {
   "id": "iron",
   "cat": "iron",
   "dec": [
    "Huel"
   ],
   "en": "Serum iron",
   "fr": "Fer sérique",
   "us": "µg/dL",
   "units": [
    {
     "l": "µmol/L",
     "m": 5.587
    },
    {
     "l": "µg/dL",
     "m": 1
    }
   ],
   "clin": [
    50,
    180
   ],
   "opt": [
    70,
    150
   ],
   "oc": "weak",
   "note": "The iron travelling in your blood bound to transferrin at the exact moment of the draw.\n\nAlmost meaningless on its own, for two reasons: it swings by roughly a third across a single day on its own rhythm, and it jumps after any iron-containing meal or supplement.\n\nIt exists to be combined — with transferrin it produces saturation, which is the number that actually says whether iron is available.",
   "axis": [
    20,
    220
   ]
  },
  {
   "id": "tibc",
   "cat": "iron",
   "en": "TIBC",
   "fr": "Capacité totale de fixation (CTF)",
   "us": "µg/dL",
   "units": [
    {
     "l": "µmol/L",
     "m": 5.587
    },
    {
     "l": "µg/dL",
     "m": 1
    }
   ],
   "clin": [
    250,
    425
   ],
   "opt": [
    250,
    400
   ],
   "oc": "weak",
   "am": "useful",
   "note": "How much iron the blood could carry if every transferrin binding site were full — in effect a measure of transferrin itself.\n\nIts job is to be the denominator for saturation.\n\nWhat makes it informative is that it moves opposite to ferritin in deficiency: running low on iron, the body makes MORE transferrin, so capacity rises while stores fall. In inflammation both drop together instead.",
   "axis": [
    180,
    500
   ]
  },
  {
   "id": "tsat",
   "cat": "iron",
   "dec": [
    "Huel"
   ],
   "en": "Transferrin saturation",
   "fr": "Coefficient de saturation (CST)",
   "us": "%",
   "units": [
    {
     "l": "%",
     "m": 1
    }
   ],
   "clin": [
    20,
    45
   ],
   "am": "useful",
   "note": "Serum iron divided by total capacity — the percentage of your iron transport that is actually loaded.\n\nThe most useful single number in the iron panel, because it reflects iron that is available right now rather than stored or potential.\n\nIt is also what separates true iron deficiency from the low iron of inflammation, where ferritin alone is ambiguous.\n\nInherits serum iron's daily swing, so time of draw affects it.",
   "axis": [
    0,
    60
   ]
  },
  {
   "id": "mg",
   "cat": "vitmin",
   "dec": [
    "Magnesium L-threonate",
    "Huel"
   ],
   "en": "Magnesium (serum)",
   "fr": "Magnésium",
   "us": "mg/dL",
   "units": [
    {
     "l": "mmol/L",
     "m": 2.43
    },
    {
     "l": "mg/dL",
     "m": 1
    }
   ],
   "clin": [
    1.7,
    2.4
   ],
   "opt": [
    2,
    2.4
   ],
   "oc": "weak",
   "note": "A mineral needed by hundreds of enzymes, including every reaction that uses ATP. Central to muscle relaxation, nerve conduction and heart rhythm.\n\nThe measurement problem is severe: under 1% of the body's magnesium is in blood, and that fraction is defended tightly by pulling from bone and muscle.\n\nSo serum magnesium can look perfectly normal while tissue stores are depleted. That limitation is why the erythrocyte assay was ordered instead — it looks inside cells, where the magnesium actually is.",
   "axis": [
    1.4,
    2.8
   ]
  },
  {
   "id": "ck",
   "cat": "other",
   "en": "Creatine kinase",
   "fr": "CPK",
   "us": "U/L",
   "units": [
    {
     "l": "UI/L",
     "m": 1
    }
   ],
   "clin": [
    30,
    380
   ],
   "am": "useful",
   "note": "An enzyme that leaks out of muscle fibres whenever they are damaged. At extreme levels it signals rhabdomyolysis, where muscle breakdown overwhelms the kidneys.\n\nBut ordinary resistance training damages fibres by design — that is how muscle adapts — and CK stays elevated for several days afterwards.\n\nSo in anyone training regularly, a high CK reflects the training. The reference range assumes a sedentary person and is close to meaningless otherwise.",
   "axis": [
    0,
    600
   ]
  },
  {
   "id": "na",
   "cat": "other",
   "en": "Sodium",
   "fr": "Sodium (natrémie)",
   "us": "mmol/L",
   "units": [
    {
     "l": "mmol/L",
     "m": 1
    }
   ],
   "clin": [
    135,
    146
   ],
   "opt": [
    137,
    143
   ],
   "oc": "weak",
   "note": "The main electrolyte outside cells, and the thing that determines how much water your body holds and how hydrated each cell is.\n\nThe body defends it fiercely — kidneys, thirst and hormones all work to keep it within a couple of percent.\n\nWhich is exactly why it is worth watching. Because it barely moves, a shift of even 3 or 4 units is a real signal about kidney, adrenal or water balance rather than noise.",
   "axis": [
    130,
    150
   ]
  },
  {
   "id": "k",
   "cat": "other",
   "en": "Potassium",
   "fr": "Potassium (kaliémie)",
   "us": "mmol/L",
   "units": [
    {
     "l": "mmol/L",
     "m": 1
    }
   ],
   "clin": [
    3.5,
    5.3
   ],
   "opt": [
    4,
    5
   ],
   "oc": "weak",
   "note": "An electrolyte kept mostly inside cells, with only a small amount in blood — but that small amount governs heart rhythm, which makes it one of the few genuinely urgent lab values.\n\nThe common artefact: potassium leaks out of red cells if the sample sits too long or is shaken in transit. That reads as high potassium in someone entirely fine.\n\nA high result with no symptoms is usually the tube, not the patient — which is why it gets repeated.",
   "axis": [
    3,
    6
   ]
  },
  {
   "id": "cl",
   "cat": "other",
   "en": "Chloride",
   "fr": "Chlore (chlorémie)",
   "us": "mmol/L",
   "units": [
    {
     "l": "mmol/L",
     "m": 1
    }
   ],
   "clin": [
    98,
    107
   ],
   "note": "The main negative ion outside cells, and the counterweight that keeps blood electrically neutral as sodium comes and goes.\n\nIt tracks sodium almost perfectly, which is why on its own it adds very little.\n\nIts value is in the gap between the two. Chloride that moves independently of sodium points at an acid–base problem rather than a water one — it climbs when bicarbonate is being lost, and falls with prolonged vomiting or with diuretics.",
   "axis": [
    90,
    115
   ]
  },
  {
   "id": "ft3",
   "cat": "thy",
   "en": "Free T3",
   "fr": "T3 libre (FT3)",
   "us": "pg/mL",
   "units": [
    {
     "l": "pmol/L",
     "m": 0.651
    },
    {
     "l": "pg/mL",
     "m": 1
    }
   ],
   "clin": [
    2,
    4.4
   ],
   "am": "critical",
   "note": "The active thyroid hormone — the one that actually drives metabolic rate in tissue. Most of it is converted from T4 locally rather than secreted by the thyroid.\n\nUseful when TSH and T4 look fine but symptoms do not.\n\nImportant caveat: T3 falls during illness, fasting and sustained calorie restriction. That is a deliberate energy-saving adaptation, not thyroid disease, and it is routinely mistaken for one.",
   "axis": [
    1.5,
    5
   ]
  },
  {
   "id": "atg",
   "cat": "thy",
   "en": "Thyroglobulin antibodies",
   "fr": "Anticorps anti-thyroglobuline",
   "us": "IU/mL",
   "units": [
    {
     "l": "UI/mL",
     "m": 1
    }
   ],
   "clin": [
    0,
    115
   ],
   "am": "critical",
   "note": "Antibodies against thyroglobulin, the scaffold protein the thyroid builds its hormones on. A second marker of autoimmune thyroid disease.\n\nChecked alongside anti-TPO because a minority of people are positive for one and not the other, so testing both catches more.\n\nSame limitation: the presence is what matters, the magnitude is not comparable between labs.",
   "axis": [
    0,
    150
   ]
  },
  {
   "id": "dheas",
   "cat": "horm",
   "en": "DHEA-S",
   "fr": "SDHEA (sulfate de DHEA)",
   "us": "µg/dL",
   "units": [
    {
     "l": "µmol/L",
     "m": 36.85
    },
    {
     "l": "µg/dL",
     "m": 1
    }
   ],
   "clin": [
    160,
    449
   ],
   "am": "useful",
   "note": "An adrenal steroid, and the most abundant hormone in the bloodstream. It acts as a raw material the body converts into other androgens and oestrogens.\n\nUseful as a stable read on adrenal output, because unlike cortisol it does not swing hour to hour — one draw represents you well.\n\nIt declines steadily from the twenties onward, so it is judged against age rather than a single fixed range.",
   "axis": [
    100,
    500
   ]
  },
  {
   "id": "igf1",
   "cat": "horm",
   "en": "IGF-1",
   "fr": "IGF-1 (somatomédine C)",
   "us": "ng/mL",
   "units": [
    {
     "l": "nmol/L",
     "m": 7.69
    },
    {
     "l": "ng/mL",
     "m": 1
    }
   ],
   "clin": [
    82,
    241
   ],
   "am": "critical",
   "note": "The messenger through which growth hormone actually works. GH itself is released in short pulses and is nearly impossible to measure meaningfully; it tells the liver to make IGF-1, which circulates steadily.\n\nSo IGF-1 is the practical read on GH status.\n\nDeliberately has no optimal target here. Mortality against IGF-1 is U-shaped, and the LOW side is the stronger signal — so the common longevity claim that lower is better runs against the population data.",
   "axis": [
    60,
    280
   ]
  },
  {
   "id": "tp",
   "cat": "liver",
   "en": "Total protein",
   "fr": "Protéines totales",
   "us": "g/dL",
   "units": [
    {
     "l": "g/L",
     "m": 0.1
    },
    {
     "l": "g/dL",
     "m": 1
    }
   ],
   "clin": [
    6.4,
    8.3
   ],
   "note": "All the protein in blood added together — mostly albumin, plus the globulins that include antibodies.\n\nToo coarse to interpret alone, because the two components can move in opposite directions and leave the total looking unchanged. A falling albumin masked by rising globulins reads as perfectly normal here.\n\nUseful mainly as a first pass before splitting it into its parts.",
   "axis": [
    5.5,
    9
   ]
  },
  {
   "id": "trf",
   "cat": "iron",
   "en": "Transferrin",
   "fr": "Transferrine",
   "us": "mg/dL",
   "units": [
    {
     "l": "g/L",
     "m": 100
    },
    {
     "l": "mg/dL",
     "m": 1
    }
   ],
   "clin": [
    200,
    360
   ],
   "note": "The protein that ferries iron through the bloodstream, made by the liver. Iron is toxic loose in the blood, so essentially none travels unbound.\n\nThe direct measurement behind total binding capacity.\n\nA low transferrin has several unrelated causes — inflammation, liver disease, or poor nutrition — so it is read with the rest of the iron panel rather than alone.",
   "axis": [
    150,
    420
   ]
  },
  {
   "id": "upcr",
   "cat": "renal",
   "en": "Urine protein/creatinine",
   "fr": "Ratio protéines/créatinine urinaire",
   "us": "mg/g",
   "units": [
    {
     "l": "mg/mmol",
     "m": 8.84
    },
    {
     "l": "mg/g",
     "m": 1
    }
   ],
   "clin": [
    0,
    150
   ],
   "note": "Protein leaking into urine, expressed relative to urine creatinine so that a dilute sample and a concentrated one give comparable answers.\n\nOne of the earliest signs of glomerular damage — often detectable years before filtration rate starts to fall. That makes it more of a leading indicator than eGFR.\n\nA single positive is not a diagnosis: exercise, fever and simply standing for a long time all cause transient, harmless proteinuria.",
   "axis": [
    0,
    600
   ]
  },
  {
   "id": "ucrea",
   "cat": "renal",
   "en": "Urine creatinine",
   "fr": "Créatinine urinaire",
   "us": "mg/L",
   "units": [
    {
     "l": "mmol/L",
     "m": 113.12
    },
    {
     "l": "mg/L",
     "m": 1
    }
   ],
   "clin": [
    400,
    2780
   ],
   "note": "How concentrated your urine is, in effect.\n\nNot interpreted on its own. Its purpose is to normalise other urine measurements — a low value just means dilute urine, which would otherwise make everything measured in that sample look low too. This is why urine results are reported as ratios rather than raw concentrations.",
   "axis": [
    300,
    3000
   ]
  }
 ],
 "DATA": {
  "draws": [
   {
    "id": "d20201210",
    "date": "2020-12-10",
    "t": "10:38",
    "note": "Cerballiance Clairval (Marseille), Roche Cobas throughout: chemistry by spectrophotometry, electrolytes by ISE potentiometry, thyroid/testosterone/vitamin D by ECLIA. HbA1c went out to the Sebia Capillarys 3 for capillary electrophoresis, and the ESR ran on an Alifax analyser. Every method and every printed interval is now recorded on the values themselves. Reached this file via an InsideTracker upload that re-converted the lab's SI values instead of transcribing them, so eight results were dropped entirely and six arrived rounded — the original report has since been transcribed in full and all 43 values reconciled against it. The lab flagged calcium, creatinine and potassium against its own intervals; each carries its own annotation. The serology this report also carried (HIV, hepatitis B and C) is on the Record tab.",


    "v": {
     "wbc": {
      "r": 6.2,
      "u": "G/L",
      "a": "Sang total EDTA / Cytométrie en flux",
      "lr": [
       4,
       11
      ]
     },
     "neut": {
      "r": 4.56,
      "u": "G/L",
      "a": "Sang total EDTA / Cytométrie en flux",
      "lr": [
       1.7,
       7
      ]
     },
     "lymph": {
      "r": 1.05,
      "u": "G/L",
      "a": "Sang total EDTA / Cytométrie en flux",
      "lr": [
       1,
       4.8
      ]
     },
     "mono": {
      "r": 0.47,
      "u": "G/L",
      "a": "Sang total EDTA / Cytométrie en flux",
      "lr": [
       0.18,
       1
      ]
     },
     "eos": {
      "r": 0.05,
      "u": "G/L",
      "a": "Sang total EDTA / Cytométrie en flux",
      "lr": [
       0.02,
       0.63
      ]
     },
     "baso": {
      "r": 0.07,
      "u": "G/L",
      "a": "Sang total EDTA / Cytométrie en flux",
      "lr": [
       0,
       0.11
      ]
     },
     "hb": {
      "r": 16.4,
      "u": "g/dL",
      "a": "Sang total EDTA / Cytométrie en flux",
      "lr": [
       13.4,
       16.7
      ]
     },
     "rbc": {
      "r": 5.33,
      "u": "T/L",
      "a": "Sang total EDTA / Cytométrie en flux",
      "lr": [
       4.28,
       6
      ]
     },
     "hct": {
      "r": 48.3,
      "u": "%",
      "a": "Sang total EDTA / Cytométrie en flux",
      "lr": [
       39,
       49
      ]
     },
     "mcv": {
      "r": 90.6,
      "u": "fL",
      "a": "Sang total EDTA / Cytométrie en flux",
      "lr": [
       78,
       98
      ]
     },
     "mch": {
      "r": 30.7,
      "u": "pg",
      "a": "Sang total EDTA / Cytométrie en flux",
      "lr": [
       26,
       34
      ]
     },
     "mchc": {
      "r": 33.9,
      "u": "g/dL",
      "a": "Sang total EDTA / Cytométrie en flux",
      "lr": [
       31,
       36.5
      ]
     },
     "plt": {
      "r": 166,
      "u": "G/L",
      "a": "Sang total EDTA / Cytométrie en flux",
      "lr": [
       150,
       400
      ]
     },
     "mpv": {
      "r": 9.2,
      "u": "fL",
      "a": "Sang total EDTA / Cytométrie en flux",
      "lr": [
       7,
       11
      ]
     },
     "glu": {
      "r": 1.05,
      "u": "g/L",
      "a": "Roche Cobas / Spectrophotométrie",
      "lr": [
       0.74,
       1.09
      ]
     },
     "a1c": {
      "r": 5.1,
      "u": "%",
      "a": "Electrophorèse capillaire sur sang total / Capillarys 3 Sebia",
      "an": "Capillary electrophoresis — a haemoglobin variant shows as its own peak instead of skewing the number.",
      "ak": "Capillarys — électrophorèse capillaire"
     },
     "crea": {
      "r": 12.5,
      "u": "mg/L",
      "a": "Roche Cobas / Spectrophotométrie",
      "an": "Printed only as \"spectrophotométrie\": Jaffé and enzymatic both fit, and Jaffé reads higher.",
      "lr": [
       6.7,
       11.7
      ],
      "cx": "Flagged high against the lab's 59–104 µmol/L."
     },
     "egfr": {
      "r": 80,
      "u": "mL/min/1.73m²",
      "a": "Calculé selon la formule CKD-EPI",
      "an": "CKD-EPI 2009, calculated from the creatinine above.",
      "lr": [
       60,
       null
      ]
     },
     "ua": {
      "r": 305,
      "u": "µmol/L",
      "a": "Roche Cobas / Spectrophotométrie",
      "lr": [
       202,
       417
      ]
     },
     "chol": {
      "r": 1.56,
      "u": "g/L",
      "a": "Roche Cobas / Spectrophotométrie"
     },
     "hdl": {
      "r": 0.71,
      "u": "g/L",
      "a": "Roche Cobas / Spectrophotométrie",
      "lr": [
       0.54,
       null
      ]
     },
     "ldl": {
      "r": 0.75,
      "u": "g/L",
      "a": "Formule de Friedewald",
      "ak": "Friedewald",
      "an": "Calculated by Friedewald, not measured."
     },
     "tg": {
      "r": 0.55,
      "u": "g/L",
      "a": "Roche Cobas / Spectrophotométrie",
      "lr": [
       null,
       1.5
      ]
     },
     "na": {
      "r": 139,
      "u": "mmol/L",
      "a": "Roche Cobas / Potentiométrie",
      "lr": [
       136,
       145
      ]
     },
     "k": {
      "r": 4.7,
      "u": "mmol/L",
      "a": "Roche Cobas / Potentiométrie",
      "lr": [
       3.4,
       4.5
      ],
      "cx": "Heparin tube, re-run by the lab. The serum was slightly haemolysed, which leaks potassium."
     },
     "tp": {
      "r": 81,
      "u": "g/L",
      "a": "Roche Cobas / Spectrophotométrie",
      "lr": [
       66,
       87
      ]
     },
     "ca": {
      "r": 103,
      "u": "mg/L",
      "a": "Roche Cobas / Spectrophotométrie",
      "lr": [
       86,
       100
      ],
      "cx": "Flagged high. No albumin this draw, so corrected calcium cannot be derived."
     },
     "mg": {
      "r": 0.86,
      "u": "mmol/L",
      "a": "Roche Cobas / Spectrophotométrie",
      "lr": [
       0.65,
       1.05
      ]
     },
     "iron": {
      "r": 14.62,
      "u": "µmol/L",
      "a": "Roche Cobas / Spectrophotométrie",
      "lr": [
       5.83,
       34.5
      ]
     },
     "ferr": {
      "r": 72,
      "u": "µg/L",
      "a": "Roche Cobas / Spectrophotométrie",
      "an": "Immunoturbidimetric, not the ECLIA used for the hormones. Biotin-sensitive.",
      "lr": [
       30,
       300
      ]
     },
     "zn": {
      "r": 13.9,
      "u": "µmol/L",
      "t": "09:58",
      "a": "Absorption atomique",
      "an": "The reference method for trace metals.",
      "lr": [
       11,
       24
      ],
      "cx": "Drawn 22.12.2020, twelve days after the rest of this panel, and sent out to Cerba."
     },
     "ast": {
      "r": 31,
      "u": "UI/L",
      "a": "Roche Cobas / Spectrophotométrie",
      "lr": [
       10,
       40
      ]
     },
     "alt": {
      "r": 25,
      "u": "UI/L",
      "a": "Roche Cobas / Spectrophotométrie",
      "lr": [
       10,
       40
      ]
     },
     "alp": {
      "r": 62,
      "u": "UI/L",
      "a": "Roche Cobas / Spectrophotométrie",
      "lr": [
       40,
       129
      ]
     },
     "ggt": {
      "r": 27,
      "u": "UI/L",
      "a": "Roche Cobas / Spectrophotométrie",
      "lr": [
       10,
       45
      ]
     },
     "vitd": {
      "r": 117.5,
      "u": "nmol/L",
      "a": "Roche Cobas / Electrochimiluminescence",
      "an": "D2 and D3 together as total 25-OH-D. Biotin-sensitive."
     },
     "ft3": {
      "r": 3.12,
      "u": "pg/mL",
      "a": "Roche Cobas / ECLIA",
      "an": "Analogue immunoassay, not equilibrium dialysis. The interval belongs to this platform.",
      "lr": [
       2,
       4.4
      ],
      "ak": "ECLIA Roche"
     },
     "ft4": {
      "r": 17.28,
      "u": "pmol/L",
      "a": "Roche Cobas / ECLIA",
      "an": "Analogue immunoassay, not equilibrium dialysis. The interval belongs to this platform.",
      "lr": [
       12,
       22
      ],
      "ak": "ECLIA Roche"
     },
     "tsh": {
      "r": 0.99,
      "u": "mUI/L",
      "a": "Roche Cobas / ECLIA",
      "lr": [
       0.27,
       4.2
      ],
      "ak": "ECLIA Roche"
     },
     "tt": {
      "r": 25.9,
      "u": "nmol/L",
      "a": "Roche Cobas / ECLIA",
      "ak": "ECLIA",
      "an": "Immunoassay, not LC-MS/MS — does not read identically to mass spec.",
      "lr": [
       12.1,
       29.5
      ]
     },
     "phos": {
      "r": 1.19,
      "u": "mmol/L",
      "a": "Roche Cobas / Spectrophotométrie",
      "lr": [
       0.81,
       1.45
      ],
      "cx": "The report printed 1.19 mmol/L and 38 mg/L, which disagree. The SI value is stored."
     },
     "cl": {
      "r": 102,
      "u": "mmol/L",
      "a": "Roche Cobas / Potentiométrie",
      "lr": [
       98,
       107
      ]
     },
     "esr": {
      "r": 2,
      "u": "mm/h",
      "a": "Beckman Coulter Alifax Test 1 THL",
      "lr": [
       null,
       15
      ],
      "an": "Photometric rheology, not a Westergren tube — correlated with it, not identical.",
      "cx": "Second hour 5 mm."
     }
    }
   },
   {
    "id": "d20220514",
    "date": "2022-05-14",
    "t": "10:15",
    "note": "Collected at Cerballiance La Rouvière (Marseille) on a Hôpital La Conception prescription, but RUN AT A DIFFERENT SITE than the 2020 panel — BD here, CL then — which is why several printed intervals moved without any technique changing. Roche Cobas throughout, TSH and vitamin D by ECLIA, prothrombin time on a Stago Sta. Every method and printed interval is recorded on the values. Arrived via an InsideTracker upload: four results were dropped (creatinine, eGFR, alkaline phosphatase, TSH) and three were rounded (RBC 5.28 stored as 5.3, MCHC 34.8 as 35, albumin 52.9 g/L as 5.3 g/dL) — all restored from the report, and all 33 values reconciled against it. The lab flagged albumin, creatinine and MPV; each carries its own annotation. CRITICAL FOR THE CORRECTED-CALCIUM MARKER: this report prints, verbatim, 'Calcium corrige non indique car albumine >40 g/L' — the laboratory REFUSED to compute it because albumin exceeds 40 g/L, which it does in every draw where albumin was measured. Urea was deliberately not performed: the report states it is only reimbursed for dialysis, acute renal failure, or nutritional assessment in chronic renal failure, so the empty urea marker is a French reimbursement rule and not a dropped value. Serology (HIV, hepatitis B and C, syphilis) is on the Record tab.",

    "v": {
     "wbc": {
      "r": 5.3,
      "u": "G/L",
      "a": "Sang total EDTA / Cytométrie en flux",
      "lr": [
       4,
       11
      ]
     },
     "neut": {
      "r": 3.32,
      "u": "G/L",
      "a": "Sang total EDTA / Cytométrie en flux",
      "lr": [
       1.7,
       7
      ]
     },
     "lymph": {
      "r": 1.46,
      "u": "G/L",
      "a": "Sang total EDTA / Cytométrie en flux",
      "lr": [
       1,
       4.8
      ]
     },
     "mono": {
      "r": 0.41,
      "u": "G/L",
      "a": "Sang total EDTA / Cytométrie en flux",
      "lr": [
       0.18,
       1
      ]
     },
     "eos": {
      "r": 0.07,
      "u": "G/L",
      "a": "Sang total EDTA / Cytométrie en flux",
      "lr": [
       0.02,
       0.63
      ]
     },
     "baso": {
      "r": 0.05,
      "u": "G/L",
      "a": "Sang total EDTA / Cytométrie en flux",
      "lr": [
       0,
       0.11
      ]
     },
     "hb": {
      "r": 16.3,
      "u": "g/dL",
      "a": "Sang total EDTA / Cytométrie en flux",
      "lr": [
       13.4,
       16.7
      ]
     },
     "rbc": {
      "r": 5.28,
      "u": "T/L",
      "a": "Sang total EDTA / Cytométrie en flux",
      "lr": [
       4.28,
       6
      ]
     },
     "hct": {
      "r": 46.8,
      "u": "%",
      "a": "Sang total EDTA / Cytométrie en flux",
      "lr": [
       39,
       49
      ]
     },
     "mcv": {
      "r": 88.6,
      "u": "fL",
      "a": "Sang total EDTA / Cytométrie en flux",
      "lr": [
       78,
       98
      ]
     },
     "mch": {
      "r": 30.9,
      "u": "pg",
      "a": "Sang total EDTA / Cytométrie en flux",
      "lr": [
       26,
       34
      ]
     },
     "mchc": {
      "r": 34.8,
      "u": "g/dL",
      "a": "Sang total EDTA / Cytométrie en flux",
      "lr": [
       31,
       36.5
      ]
     },
     "plt": {
      "r": 172,
      "u": "G/L",
      "a": "Sang total EDTA / Cytométrie en flux",
      "lr": [
       150,
       400
      ]
     },
     "mpv": {
      "r": 11.7,
      "u": "fL",
      "a": "Sang total EDTA / Cytométrie en flux",
      "an": "EDTA makes platelets swell as the tube waits, so MPV drifts up with time to analysis.",
      "lr": [
       7,
       11
      ],
      "cx": "Flagged high against the lab’s 7.0–11.0."
     },
     "glu": {
      "r": 0.85,
      "u": "g/L",
      "a": "Roche Cobas / Spectrophotométrie",
      "lr": [
       0.74,
       1.09
      ]
     },
     "crea": {
      "r": 12.0,
      "u": "mg/L",
      "a": "Roche Cobas / Spectrophotométrie",
      "an": "Printed only as \"spectrophotométrie\": Jaffé and enzymatic both fit, and Jaffé reads higher.",
      "lr": [
       6.7,
       11.7
      ],
      "cx": "Flagged high against the lab’s 59–104 µmol/L."
     },
     "egfr": {
      "r": 82,
      "u": "mL/min/1.73m²",
      "a": "Calculé selon la formule CKD-EPI",
      "an": "CKD-EPI 2009, calculated from the creatinine above.",
      "lr": [
       60,
       null
      ]
     },
     "chol": {
      "r": 1.49,
      "u": "g/L",
      "a": "Roche Cobas / Spectrophotométrie"
     },
     "hdl": {
      "r": 0.53,
      "u": "g/L",
      "a": "Roche Cobas / Spectrophotométrie",
      "lr": [
       0.54,
       null
      ]
     },
     "ldl": {
      "r": 0.81,
      "u": "g/L",
      "a": "Formule de Friedewald",
      "ak": "Friedewald",
      "an": "Calculated by Friedewald, not measured."
     },
     "tg": {
      "r": 0.73,
      "u": "g/L",
      "a": "Roche Cobas / Spectrophotométrie",
      "lr": [
       null,
       1.5
      ]
     },
     "na": {
      "r": 140,
      "u": "mmol/L",
      "a": "Roche Cobas / Potentiométrie",
      "lr": [
       136,
       145
      ]
     },
     "k": {
      "r": 4.4,
      "u": "mmol/L",
      "a": "Roche Cobas / Potentiométrie",
      "lr": [
       3.5,
       5.1
      ]
     },
     "alb": {
      "r": 52.9,
      "u": "g/L",
      "a": "Roche Cobas / Spectrophotométrie",
      "lr": [
       35,
       52
      ],
      "cx": "Flagged high. The lab prints: corrected calcium not indicated because albumin >40 g/L."
     },
     "ca": {
      "r": 100,
      "u": "mg/L",
      "a": "Roche Cobas / Spectrophotométrie",
      "lr": [
       86,
       100
      ]
     },
     "ast": {
      "r": 28,
      "u": "UI/L",
      "a": "Roche Cobas / Spectrophotométrie",
      "lr": [
       10,
       40
      ]
     },
     "alt": {
      "r": 20,
      "u": "UI/L",
      "a": "Roche Cobas / Spectrophotométrie",
      "lr": [
       10,
       40
      ]
     },
     "alp": {
      "r": 61,
      "u": "UI/L",
      "a": "Roche Cobas / Spectrophotométrie",
      "lr": [
       40,
       129
      ]
     },
     "ggt": {
      "r": 21,
      "u": "UI/L",
      "a": "Roche Cobas / Spectrophotométrie",
      "lr": [
       10,
       45
      ]
     },
     "vitd": {
      "r": 80.0,
      "u": "nmol/L",
      "a": "Roche Cobas / Electrochimiluminescence",
      "an": "D2 and D3 together as total 25-OH-D. Biotin-sensitive."
     },
     "hscrp": {
      "r": 0.5,
      "u": "mg/L",
      "lt": true,
      "a": "Roche Cobas / Spectrophotométrie",
      "an": "Standard CRP, not high-sensitivity — the lab’s <5.0 range gives it away.",
      "lr": [
       null,
       5
      ]
     },
     "tsh": {
      "r": 0.87,
      "u": "mUI/L",
      "a": "Roche Cobas / ECLIA",
      "lr": [
       0.27,
       4.2
      ],
      "ak": "ECLIA Roche"
     },
     "ptime": {
      "r": 82,
      "u": "%",
      "a": "Chronométrie / NéoPTimal",
      "lr": [
       70,
       100
      ],
      "an": "Chronometric on a NéoPTimal reagent; reagents differ in strength, which is why INR exists.",
      "cx": "INR 1.14. The lab notes that only the TP is to be interpreted."
     }
    }
   },
   {
    "id": "d20230130",
    "date": "2023-01-30",
    "t": "14:53",
    "note": "Cerballiance Clairval (Marseille) — an AFTERNOON draw at 14:53, the only one in this file, which is why the total testosterone here is not comparable with the morning draws either side of it. Hormones sent out to CERBA and run by ECLIA. Every method and printed interval is recorded on the values. TESTOSTERONE LIBRE was also measured, by direct RIA: 32.3 pmol/L / 9.3 pg/mL, and in range against that assay's own printed 30.0-87.0 pmol/L. It is deliberately NOT stored as a value. This is the number once held as '0.9 ng/dL' and dismissed as a 10x transcription error — it was neither an error nor mislabelled, since 9.3 pg/mL IS 0.93 ng/dL. What was wrong was judging it against the marker's 47-244 pg/mL, which belongs to the Vermeulen calculation and not to a direct assay. Storing it would put two incompatible scales on one line: direct analog RIA is the method the Endocrine Society says not to use, and it would plot at roughly a tenth of the calculated values around it. The report also notes 'serum legerement lactescent' — mild lipaemia, which can disturb spectrophotometric assays.",

    "v": {
     "wbc": {
      "r": 4.9,
      "u": "G/L",
      "a": "Sang total EDTA / Cytométrie en flux",
      "lr": [
       4.09,
       11
      ]
     },
     "neut": {
      "r": 2.9,
      "u": "G/L",
      "a": "Sang total EDTA / Cytométrie en flux",
      "lr": [
       1.78,
       6.95
      ]
     },
     "lymph": {
      "r": 1.47,
      "u": "G/L",
      "a": "Sang total EDTA / Cytométrie en flux",
      "lr": [
       1.34,
       3.92
      ]
     },
     "mono": {
      "r": 0.39,
      "u": "G/L",
      "a": "Sang total EDTA / Cytométrie en flux",
      "lr": [
       0.23,
       0.77
      ]
     },
     "eos": {
      "r": 0.1,
      "u": "G/L",
      "a": "Sang total EDTA / Cytométrie en flux",
      "lr": [
       0.05,
       0.59
      ]
     },
     "baso": {
      "r": 0.03,
      "u": "G/L",
      "a": "Sang total EDTA / Cytométrie en flux",
      "lr": [
       0,
       0.1
      ]
     },
     "tt": {
      "r": 19.2,
      "u": "nmol/L",
      "a": "ECLIA",
      "ak": "ECLIA",
      "an": "Immunoassay, not LC-MS/MS — does not read identically to mass spec.",
      "lr": [
       8.6,
       29
      ],
      "cx": "Afternoon draw: testosterone peaks near 08:00 and falls through the day."
     },
     "shbg": {
      "r": 53,
      "u": "nmol/L",
      "a": "ECLIA",
      "lr": [
       18,
       54
      ]
     },
     "hb": {
      "r": 164,
      "u": "g/L",
      "a": "Sang total EDTA / Cytométrie en flux",
      "lr": [
       134,
       167
      ]
     },
     "rbc": {
      "r": 5.26,
      "u": "T/L",
      "a": "Sang total EDTA / Cytométrie en flux",
      "lr": [
       4.53,
       5.79
      ]
     },
     "hct": {
      "r": 47.3,
      "u": "%",
      "a": "Sang total EDTA / Cytométrie en flux",
      "lr": [
       39.2,
       48.6
      ]
     },
     "mcv": {
      "r": 89.9,
      "u": "fL",
      "a": "Sang total EDTA / Cytométrie en flux",
      "lr": [
       79.6,
       94
      ]
     },
     "mch": {
      "r": 31.2,
      "u": "pg",
      "a": "Sang total EDTA / Cytométrie en flux",
      "lr": [
       27.3,
       32.8
      ]
     },
     "mchc": {
      "r": 347,
      "u": "g/L",
      "a": "Sang total EDTA / Cytométrie en flux",
      "lr": [
       324,
       363
      ]
     },
     "plt": {
      "r": 153,
      "u": "G/L",
      "a": "Sang total EDTA / Cytométrie en flux",
      "lr": [
       172,
       398
      ],
      "cx": "Flagged low — but against this lab’s own 172–398, narrower than the 150–400 used here."
     },
     "mpv": {
      "r": 9.4,
      "u": "fL",
      "a": "Sang total EDTA / Cytométrie en flux",
      "an": "EDTA makes platelets swell as the tube waits, so MPV drifts up with time to analysis.",
      "lr": [
       7.4,
       10.8
      ]
     },
     "crea": {
      "r": 12.0,
      "u": "mg/L",
      "a": "Roche Cobas / Spectrophotométrie",
      "an": "Printed only as \"spectrophotométrie\": Jaffé and enzymatic both fit, and Jaffé reads higher.",
      "lr": [
       6.7,
       11.7
      ],
      "cx": "Flagged high. The serum was mildly lipaemic, which can disturb spectrophotometry."
     },
     "egfr": {
      "r": 82,
      "u": "mL/min/1.73m²",
      "a": "Calculé selon la formule CKD-EPI",
      "an": "CKD-EPI 2009, calculated from the creatinine above.",
      "lr": [
       90,
       null
      ]
     },
     "k": {
      "r": 4.6,
      "u": "mmol/L",
      "a": "Roche Cobas / Potentiométrie",
      "lr": [
       3.4,
       4.5
      ],
      "cx": "Heparin tube. Flagged high against the lab’s 3.4–4.5."
     },
     "na": {
      "r": 141,
      "u": "mmol/L",
      "a": "Roche Cobas / Potentiométrie",
      "lr": [
       136,
       145
      ]
     },
     "cl": {
      "r": 103,
      "u": "mmol/L",
      "a": "Roche Cobas / Potentiométrie",
      "lr": [
       98,
       107
      ]
     },
     "ptime": {
      "r": 81,
      "u": "%",
      "a": "Chronométrie / Néoplastine CI+",
      "lr": [
       70,
       100
      ],
      "an": "Néoplastine CI+ — a DIFFERENT reagent from the 2022 draw, so the two are not strictly comparable.",
      "cx": "INR 1.06."
     },
     "aptt": {
      "r": 1.18,
      "u": "ratio",
      "a": "Chronométrie / Céphascreen",
      "lr": [
       null,
       1.2
      ],
      "an": "Céphascreen, sensitive to intrinsic-pathway deficiencies. Read as a ratio, never as raw seconds.",
      "cx": "Patient 32.4 s against a 27.5 s control."
     }
    }
   },
   {
    "id": "d20230313",
    "date": "2023-03-13",
    "t": "09:45",
    "note": "Cerballiance Barral (Marseille) — a different site and analyser from the January draw six weeks earlier, which matters below. This was an ALLERGY workup: total IgE 122 UI/mL against a printed <100, flagged, with Phadiatop and Trophatop sent out to CERBA; those send-outs are on the Record tab, where both mixed-food panels landed just under the positivity threshold and the aeroallergen screen came back clean. Both halves of the report have now been transcribed and all 18 values reconciled. The InsideTracker upload this draw originally arrived through had rounded three values — RBC 5.04 stored as 5, MCHC 335 g/L as 34 g/dL, WBC 4.18 as 4.2 — and dropped MPV; all restored. THE LAB FLAGGED lymphocytes 1.06 G/L against 1.34-3.92 and platelets 157 against 172-398; each carries its own annotation. READ THE MPV SERIES WITH CARE: across five reports it splits perfectly by laboratory rather than by date — Clairval 9.2 and 9.4, La Rouviere 11.7, Barral 12.1. MPV rises as platelets swell in EDTA, so it tracks the delay to analysis and the analyser, not the patient. The line will look like a trend and is not one.",


    "v": {
     "wbc": {
      "r": 4.18,
      "u": "G/L",
      "a": "Sang total EDTA / Cytométrie en flux",
      "lr": [
       4.09,
       11
      ]
     },
     "neut": {
      "r": 2.52,
      "u": "G/L",
      "a": "Sang total EDTA / Cytométrie en flux",
      "lr": [
       1.78,
       6.95
      ]
     },
     "lymph": {
      "r": 1.06,
      "u": "G/L",
      "a": "Sang total EDTA / Cytométrie en flux",
      "lr": [
       1.34,
       3.92
      ],
      "cx": "Flagged low against this lab’s 1.34–3.92."
     },
     "mono": {
      "r": 0.46,
      "u": "G/L",
      "a": "Sang total EDTA / Cytométrie en flux",
      "lr": [
       0.23,
       0.77
      ]
     },
     "eos": {
      "r": 0.09,
      "u": "G/L",
      "a": "Sang total EDTA / Cytométrie en flux",
      "lr": [
       0.05,
       0.59
      ]
     },
     "baso": {
      "r": 0.05,
      "u": "G/L",
      "a": "Sang total EDTA / Cytométrie en flux",
      "lr": [
       0,
       0.1
      ]
     },
     "hb": {
      "r": 152,
      "u": "g/L",
      "a": "Sang total EDTA / Cytométrie en flux",
      "lr": [
       134,
       167
      ]
     },
     "rbc": {
      "r": 5.04,
      "u": "T/L",
      "a": "Sang total EDTA / Cytométrie en flux",
      "lr": [
       4.53,
       5.79
      ]
     },
     "hct": {
      "r": 45.4,
      "u": "%",
      "a": "Sang total EDTA / Cytométrie en flux",
      "lr": [
       39.2,
       48.6
      ]
     },
     "mcv": {
      "r": 90.1,
      "u": "fL",
      "a": "Sang total EDTA / Cytométrie en flux",
      "lr": [
       79.6,
       94
      ]
     },
     "mch": {
      "r": 30.2,
      "u": "pg",
      "a": "Sang total EDTA / Cytométrie en flux",
      "lr": [
       27.3,
       32.8
      ]
     },
     "mchc": {
      "r": 335,
      "u": "g/L",
      "a": "Sang total EDTA / Cytométrie en flux",
      "lr": [
       324,
       363
      ]
     },
     "plt": {
      "r": 157,
      "u": "G/L",
      "a": "Sang total EDTA / Cytométrie en flux",
      "lr": [
       172,
       398
      ],
      "cx": "Flagged low — but against this lab’s own 172–398, narrower than the 150–400 used here."
     },
     "mpv": {
      "r": 12.1,
      "u": "fL",
      "a": "Sang total EDTA / Cytométrie en flux",
      "lr": [
       7.4,
       10.8
      ],
      "an": "EDTA makes platelets swell as the tube waits, so MPV drifts up with time to analysis.",
      "cx": "High against the lab’s 7.4–10.8. This site’s MPVs run high across the board."
     },
     "hscrp": {
      "r": 1.4,
      "u": "mg/L",
      "a": "Roche Cobas / Spectrophotométrie",
      "an": "Standard CRP, not high-sensitivity — the lab’s <5.0 range gives it away.",
      "lr": [
       null,
       5
      ]
     },
     "esr": {
      "r": 2,
      "u": "mm/h",
      "a": "Beckman Coulter Alifax Test 1 THL",
      "lr": [
       null,
       15
      ],
      "an": "Photometric rheology, not a Westergren tube — correlated with it, not identical.",
      "cx": "Second hour 5 mm."
     },
     "fib": {
      "r": 2.0,
      "u": "g/L",
      "a": "Chronométrie",
      "lr": [
       2,
       4
      ],
      "an": "Chronometric (Clauss-type). Derived-fibrinogen methods read differently and do not interchange."
     },
     "ige": {
      "r": 122,
      "u": "UI/mL",
      "a": "Roche Cobas / Immunoturbidimétrie",
      "lr": [
       null,
       100
      ],
      "an": "Immunoturbidimetric total IgE, not the ImmunoCAP fluoroenzyme assay used for the allergen mixes.",
      "cx": "Flagged high. The allergen mixes it triggered are on the Record tab."
     }
    }
   },
   {
    "id": "d20240402",
    "date": "2024-04-02",
    "t": "09:56",
    "note": "Cerballiance Provence Azur (Marseille), Roche Cobas ECLIA throughout, with the hormone send-outs to CERBA. Methods and printed intervals are on the values. Reached this file via an InsideTracker upload that RE-CONVERTED the SI values instead of transcribing the printed US ones, which is why earlier entries drifted from the report (B12 551 vs the printed 554 ng/L, total T 625.4 vs the printed 629.30 ng/dL) — values are stored as the lab printed them, in SI, and all four are reconciled against the report. TESTOSTERONE BIODISPONIBLE by RIA: 3.6 nmol/L / 1.05 ng/mL, in range against that assay's own printed 2.7-12.0 nmol/L. Deliberately kept as a note rather than a marker — a single measurement, on a direct RIA the panel is not reordering, with no counterpart in any other draw to compare it against. The 'free testosterone 83 pg/mL' previously stored here appears NOWHERE in the lab report: an InsideTracker artifact, removed.",

    "v": {
     "b12": {
      "r": 407,
      "u": "pmol/L",
      "a": "Roche Cobas / ECLIA",
      "lr": [
       145,
       569
      ],
      "an": "Total B12 by immunoassay — it counts the inactive haptocorrin-bound fraction, which is most of it.",
      "ak": "ECLIA Roche"
     },
     "tt": {
      "r": 21.7,
      "u": "nmol/L",
      "a": "Roche Cobas / ECLIA",
      "ak": "ECLIA",
      "lr": [
       12.1,
       29.5
      ],
      "an": "Immunoassay, not LC-MS/MS — does not read identically to mass spec."
     },
     "shbg": {
      "r": 49,
      "u": "nmol/L",
      "a": "ECLIA",
      "lr": [
       18,
       54
      ]
     },
     "vitd": {
      "r": 73.0,
      "u": "nmol/L",
      "a": "Roche Cobas / Electrochimiluminescence",
      "lr": [
       75,
       250
      ],
      "an": "D2 and D3 together as total 25-OH-D. The interval is the lab’s \"suffisance\" band."
     }
    }
   },
   {
    "id": "d20260307",
    "date": "2026-03-07",
    "note": "Laboratoire B2A Biolac (Schiltigheim) — Beckman chemistry on an XN Sysmex haematology analyser, 10h fast, serum limpide. The report prints no collection time, only that everything was run and validated on 07/03/2026; this file previously dated the draw 01/03 and has been corrected. Every method and printed interval is on the values, and all 26 reconcile to the digit — this draw came from the lab directly rather than through an InsideTracker re-conversion. ON CREATINE at the time, which is why the eGFR of 61 is the outlier in an otherwise flat renal series (80, 82, 82, 61, 83.4) and should not be read as a decline. Platelets 148 sit just below the 150-400 reference. THE CRP HERE IS A STANDARD ASSAY, NOT HIGH-SENSITIVITY: immuno-turbidimetry with a reference of <5 mg/L, printed '<1 mg/L' and stored AT that limit, so it is an upper bound from an assay that cannot resolve the hs-CRP range at all. The 2022 and July 2026 values ('Inf a 0,5' and '<0.6') come from genuine high-sensitivity assays and are the ones worth comparing.",

    "v": {
     "rbc": {
      "r": 5.17,
      "u": "T/L",
      "lr": [
       4.28,
       6.0
      ],
      "a": "Impédance, photométrie, fluorocytométrie XN Sysmex"
     },
     "hb": {
      "r": 16.2,
      "u": "g/dL",
      "lr": [
       13.4,
       16.7
      ],
      "a": "Impédance, photométrie, fluorocytométrie XN Sysmex"
     },
     "hct": {
      "r": 44.8,
      "u": "%",
      "lr": [
       39.0,
       49.0
      ],
      "a": "Impédance, photométrie, fluorocytométrie XN Sysmex"
     },
     "mcv": {
      "r": 87,
      "u": "fL",
      "lr": [
       78,
       98
      ],
      "a": "Impédance, photométrie, fluorocytométrie XN Sysmex"
     },
     "mch": {
      "r": 31.3,
      "u": "pg",
      "lr": [
       26.0,
       34.0
      ],
      "a": "Impédance, photométrie, fluorocytométrie XN Sysmex"
     },
     "mchc": {
      "r": 36.2,
      "u": "g/dL",
      "lr": [
       31.0,
       36.5
      ],
      "a": "Impédance, photométrie, fluorocytométrie XN Sysmex"
     },
     "rdw": {
      "r": 11.7,
      "u": "%",
      "lr": [
       0.0,
       15.0
      ],
      "a": "Impédance, photométrie, fluorocytométrie XN Sysmex"
     },
     "wbc": {
      "r": 4.48,
      "u": "G/L",
      "lr": [
       4.0,
       11.0
      ],
      "a": "Impédance, photométrie, fluorocytométrie XN Sysmex"
     },
     "neut": {
      "r": 2.41,
      "u": "G/L",
      "lr": [
       1.8,
       6.9
      ],
      "a": "Impédance, photométrie, fluorocytométrie XN Sysmex"
     },
     "eos": {
      "r": 0.09,
      "u": "G/L",
      "lr": [
       null,
       0.63
      ],
      "a": "Impédance, photométrie, fluorocytométrie XN Sysmex"
     },
     "baso": {
      "r": 0.04,
      "u": "G/L",
      "lr": [
       null,
       0.11
      ],
      "a": "Impédance, photométrie, fluorocytométrie XN Sysmex"
     },
     "lymph": {
      "r": 1.55,
      "u": "G/L",
      "lr": [
       1.0,
       4.8
      ],
      "a": "Impédance, photométrie, fluorocytométrie XN Sysmex"
     },
     "mono": {
      "r": 0.39,
      "u": "G/L",
      "lr": [
       0.18,
       1.0
      ],
      "a": "Impédance, photométrie, fluorocytométrie XN Sysmex"
     },
     "plt": {
      "r": 148,
      "u": "G/L",
      "lr": [
       150,
       400
      ],
      "a": "Impédance, optique XN Sysmex",
      "an": "Counted optically as well as by impedance — the optical channel is what a clumped sample needs."
     },
     "glu": {
      "r": 0.9,
      "u": "g/L",
      "lr": [
       0.74,
       1.06
      ],
      "a": "Glucose hexokinase Beckman",
      "an": "Hexokinase, the reference method — more specific than the older glucose-oxidase assays."
     },
     "tg": {
      "r": 0.5,
      "u": "g/L",
      "lr": [
       0.5,
       1.5
      ],
      "a": "Glycérol phosphate oxydase Beckman"
     },
     "chol": {
      "r": 1.55,
      "u": "g/L",
      "lr": [
       1.2,
       2.0
      ],
      "a": "Cholesterol oxydase Beckman"
     },
     "hdl": {
      "r": 0.45,
      "u": "g/L",
      "lr": [
       0.4,
       0.6
      ],
      "a": "Spectrophotométrie Beckman"
     },
     "ldl": {
      "r": 1,
      "u": "g/L",
      "a": "Formule de Friedwald",
      "an": "Calculated by Friedewald, not measured.",
      "ak": "Friedewald"
     },
     "nonhdl": {
      "r": 1.1,
      "u": "g/L",
      "a": "Calcul",
      "an": "Total cholesterol minus HDL. Arithmetic, not an assay."
     },
     "crea": {
      "r": 15,
      "u": "mg/L",
      "lr": [
       7.2,
       11.8
      ],
      "cx": "On creatine, which raises serum creatinine directly.",
      "a": "Créatininase Beckman, enzymatique",
      "an": "IDMS-traceable, which is the calibration CKD-EPI assumes."
     },
     "egfr": {
      "r": 61,
      "u": "mL/min/1.73m²",
      "cx": "On creatine — eGFR is calculated from creatinine, so this dip is the supplement.",
      "a": "Equation CKD-EPI",
      "lr": [
       90,
       null
      ]
     },
     "ast": {
      "r": 25,
      "u": "UI/L",
      "lr": [
       null,
       50
      ],
      "a": "Spectrophotométrie Beckman"
     },
     "alt": {
      "r": 22,
      "u": "UI/L",
      "lr": [
       null,
       50
      ],
      "a": "Spectrophotométrie Beckman"
     },
     "hscrp": {
      "r": 1,
      "u": "mg/L",
      "lr": [
       null,
       5
      ],
      "lt": true,
      "a": "Immuno-Turbidimétrie Beckman",
      "an": "Standard CRP, not high-sensitivity — the lab range gives it away."
     },
     "tsh": {
      "r": 0.783,
      "u": "mUI/L",
      "lr": [
       0.4,
       5.33
      ],
      "a": "Chimifluorescence UniCel DxI 800 Beckman Coulter",
      "an": "Third-generation TSH, sensitive enough to tell a suppressed value from a merely low one."
     }
    }
   },
   {
    "id": "d2026jul",
    "date": "2026-07-20",
    "t": "08:37",
    "note": "B2A Canal / Brumath (Vendenheim), Cobas Roche chemistry on an XN Sysmex haematology analyser, with Diasorin CLIA for insulin, vitamin D, PTH and IGF-1; send-outs to CERBA (trace elements, ApoB, Lp(a), cystatin C, homocysteine, DHT, SHBG) and to Laboratoire Barbier for the erythrocyte fatty-acid profile. 10h fast, drawn 08:37, serum limpide and non-haemolysed. All 71 values are reconciled against the printed report. THE LAB CHANGED TECHNIQUE ON 27/05/2026 across much of its chemistry, immunology and serology, and says so on page one: 'entrainant une rupture des anteriorites'. That break lands between this draw and the March one — the thyroid antibodies moved on 26/05, homocysteine on 22/06, IGF-1 back on 23/09/2025, and the CRP became genuinely ultra-sensitive, which is why the March '<1' and this '<0.6' are not two points on one line. OFF creatine — the clean kidney read the March draw could not give. The lab refused erythrocyte magnesium (discontinued for limited clinical benefit) and substituted serum; it also discontinued the ESR outright, per HAS 2025, replacing it with CRP. The diet cut — mozzarella 400 to 200 g/day, eggs 10 to 6 — landed only 2 days before the draw, so the lipids still reflect the prior intake. THE LAB PRINTED A CORRECTED CALCIUM OF 83 mg/L (2.1 mmol/L) AND FLAGGED IT LOW. It is not stored, and that is deliberate: albumin was 51 g/L, and above 40 the correction subtracts a large (albumin - 4) from a calcium that needed no correcting, manufacturing a low reading out of a normal one. The measured calcium, 94 mg/L, is mid-range. This is the artefact the empty corrected-calcium row exists to avoid, printed in black and white by a laboratory that ran the formula anyway.",

    "v": {
     "rbc": {
      "r": 4.94,
      "u": "T/L",
      "a": "Impédance, photométrie, fluorocytométrie XN Sysmex",
      "lr": [
       4.28,
       6
      ]
     },
     "hb": {
      "r": 15.3,
      "u": "g/dL",
      "a": "Impédance, photométrie, fluorocytométrie XN Sysmex",
      "lr": [
       13.4,
       16.7
      ]
     },
     "hct": {
      "r": 43.5,
      "u": "%",
      "a": "Impédance, photométrie, fluorocytométrie XN Sysmex",
      "lr": [
       39,
       49
      ]
     },
     "mcv": {
      "r": 88,
      "u": "fL",
      "a": "Impédance, photométrie, fluorocytométrie XN Sysmex",
      "lr": [
       78,
       98
      ]
     },
     "mch": {
      "r": 31.0,
      "u": "pg",
      "a": "Impédance, photométrie, fluorocytométrie XN Sysmex",
      "lr": [
       26,
       34
      ]
     },
     "mchc": {
      "r": 35.2,
      "u": "g/dL",
      "a": "Impédance, photométrie, fluorocytométrie XN Sysmex",
      "lr": [
       31,
       36.5
      ]
     },
     "rdw": {
      "r": 12.1,
      "u": "%",
      "a": "Impédance, photométrie, fluorocytométrie XN Sysmex",
      "lr": [
       0,
       15
      ]
     },
     "wbc": {
      "r": 4.18,
      "u": "G/L",
      "a": "Impédance, photométrie, fluorocytométrie XN Sysmex",
      "lr": [
       4,
       11
      ]
     },
     "neut": {
      "r": 2.47,
      "u": "G/L",
      "a": "Impédance, photométrie, fluorocytométrie XN Sysmex",
      "lr": [
       1.8,
       6.9
      ]
     },
     "lymph": {
      "r": 1.34,
      "u": "G/L",
      "a": "Impédance, photométrie, fluorocytométrie XN Sysmex",
      "lr": [
       1,
       4.8
      ]
     },
     "mono": {
      "r": 0.25,
      "u": "G/L",
      "a": "Impédance, photométrie, fluorocytométrie XN Sysmex",
      "lr": [
       0.18,
       1
      ]
     },
     "eos": {
      "r": 0.08,
      "u": "G/L",
      "a": "Impédance, photométrie, fluorocytométrie XN Sysmex",
      "lr": [
       null,
       0.63
      ]
     },
     "baso": {
      "r": 0.04,
      "u": "G/L",
      "a": "Impédance, photométrie, fluorocytométrie XN Sysmex",
      "lr": [
       null,
       0.11
      ]
     },
     "plt": {
      "r": 152,
      "u": "G/L",
      "a": "Impédance, optique XN Sysmex",
      "lr": [
       150,
       400
      ]
     },
     "glu": {
      "r": 0.88,
      "u": "g/L",
      "a": "Technique enzymatique à l'hexokinase Cobas Roche",
      "lr": [
       0.7,
       1.1
      ]
     },
     "a1c": {
      "r": 5.1,
      "u": "%",
      "a": "Electrophorèse capillaire Capillarys Sébia",
      "an": "Capillary electrophoresis — a haemoglobin variant shows as its own peak instead of skewing the number.",
      "ak": "Capillarys — électrophorèse capillaire"
     },
     "ins": {
      "r": 4.2,
      "u": "mUI/L",
      "a": "CLIA LIAISON XL Diasorin",
      "lr": [
       3.2,
       16.3
      ],
      "an": "CLIA on a Diasorin platform. Insulin assays differ substantially between manufacturers."
     },
     "tg": {
      "r": 0.65,
      "u": "g/L",
      "cx": "Diet cut (mozzarella halved, eggs 10→6) landed 2 days before the draw.",
      "a": "Technique enzymatique Cobas Roche",
      "lr": [
       null,
       1.5
      ]
     },
     "chol": {
      "r": 2.05,
      "u": "g/L",
      "cx": "Diet cut (mozzarella halved, eggs 10→6) landed 2 days before the draw.",
      "a": "Technique enzymatique Cobas Roche"
     },
     "hdl": {
      "r": 0.5,
      "u": "g/L",
      "cx": "Diet cut (mozzarella halved, eggs 10→6) landed 2 days before the draw.",
      "a": "Technique enzymatique Cobas Roche",
      "lr": [
       0.4,
       null
      ]
     },
     "nonhdl": {
      "r": 1.55,
      "u": "g/L",
      "cx": "Diet cut (mozzarella halved, eggs 10→6) landed 2 days before the draw.",
      "a": "Calcul",
      "an": "Total cholesterol minus HDL. Arithmetic, not an assay."
     },
     "ldl": {
      "r": 1.42,
      "u": "g/L",
      "cx": "Diet cut (mozzarella halved, eggs 10→6) landed 2 days before the draw.",
      "a": "Calculé selon la formule de Friedewald",
      "ak": "Friedewald",
      "an": "Calculated by Friedewald, not measured."
     },
     "crea": {
      "r": 11.6,
      "u": "mg/L",
      "a": "Technique enzymatique traçable IDMS Cobas Roche",
      "lr": [
       6.7,
       11.7
      ],
      "an": "IDMS-traceable, which is the calibration CKD-EPI assumes."
     },
     "egfr": {
      "r": 83.4,
      "u": "mL/min/1.73m²",
      "a": "DFG estimé selon la formule CKD-EPI en fonction de l'âge et du sexe",
      "lr": [
       60,
       null
      ]
     },
     "ua": {
      "r": 250,
      "u": "µmol/L",
      "a": "Technique colorimétrique enzymatique Cobas Roche",
      "lr": [
       202,
       417
      ]
     },
     "na": {
      "r": 140,
      "u": "mmol/L",
      "a": "Potentiométrie indirecte Cobas Roche",
      "lr": [
       136,
       145
      ]
     },
     "k": {
      "r": 4.0,
      "u": "mmol/L",
      "a": "Potentiométrie indirecte Cobas Roche",
      "lr": [
       3.5,
       5.1
      ]
     },
     "ca": {
      "r": 94,
      "u": "mg/L",
      "a": "Colorimétrie Cobas Roche",
      "lr": [
       86,
       100
      ]
     },
     "mg": {
      "r": 0.86,
      "u": "mmol/L",
      "cx": "Lab ran serum instead of the erythrocyte assay that was ordered.",
      "a": "Colorimétrie Cobas Roche",
      "lr": [
       0.66,
       1.07
      ]
     },
     "ast": {
      "r": 22,
      "u": "UI/L",
      "a": "Technique enzymatique Cobas Roche",
      "lr": [
       null,
       50
      ]
     },
     "alt": {
      "r": 17,
      "u": "UI/L",
      "a": "Technique enzymatique Cobas Roche",
      "lr": [
       null,
       50
      ]
     },
     "ggt": {
      "r": 16,
      "u": "UI/L",
      "a": "Technique colorimétrique enzymatique Cobas Roche",
      "lr": [
       null,
       60
      ]
     },
     "alp": {
      "r": 63,
      "u": "UI/L",
      "a": "Technique colorimétrique enzymatique Cobas Roche",
      "lr": [
       40,
       129
      ]
     },
     "bili": {
      "r": 13,
      "u": "µmol/L",
      "a": "Colorimétrie par méthode diazo Cobas Roche",
      "lr": [
       null,
       21
      ]
     },
     "ck": {
      "r": 77,
      "u": "UI/L",
      "a": "Technique enzymatique Cobas Roche",
      "lr": [
       null,
       190
      ]
     },
     "ferr": {
      "r": 58,
      "u": "µg/L",
      "a": "Immunoturbidimétrie Cobas Roche",
      "lr": [
       30,
       400
      ]
     },
     "iron": {
      "r": 14.5,
      "u": "µmol/L",
      "a": "Colorimétrie Cobas Roche",
      "lr": [
       10.6,
       28.3
      ]
     },
     "tsat": {
      "r": 22,
      "u": "%",
      "a": "Calcul",
      "lr": [
       20,
       45
      ],
      "an": "Iron divided by transferrin. Arithmetic, not an assay."
     },
     "hscrp": {
      "r": 0.6,
      "u": "mg/L",
      "lt": true,
      "a": "Immunoturbidimétrie Cobas Roche",
      "an": "ULTRA-SENSITIVE from 27/05/2026 — a different technique from March, which was standard CRP.",
      "lr": [
       null,
       5
      ]
     },
     "alb": {
      "r": 51,
      "u": "g/L",
      "a": "Immunoturbidimétrie Cobas Roche",
      "lr": [
       35,
       52
      ]
     },
     "fol": {
      "r": 6.3,
      "u": "ng/mL",
      "a": "ECLIA Cobas Roche",
      "lr": [
       3.9,
       26.8
      ]
     },
     "b12": {
      "r": 522,
      "u": "pg/mL",
      "a": "ECLIA Cobas Roche",
      "lr": [
       197,
       771
      ],
      "ak": "ECLIA Roche"
     },
     "vitd": {
      "r": 70.0,
      "u": "nmol/L",
      "a": "CLIA LIAISON XL Diasorin",
      "an": "Diasorin CLIA — a different platform from the Roche ECLIA used through 2024."
     },
     "tsh": {
      "r": 1,
      "u": "mUI/L",
      "a": "ECLIA Cobas Roche",
      "lr": [
       0.27,
       4.2
      ],
      "ak": "ECLIA Roche"
     },
     "ft4": {
      "r": 19.31,
      "u": "pmol/L",
      "a": "ECLIA Cobas Roche",
      "lr": [
       11.84,
       21.62
      ],
      "an": "Free hormone by immunoassay, not equilibrium dialysis. The interval belongs to this platform.",
      "ak": "ECLIA Roche"
     },
     "atpo": {
      "r": 8.0,
      "u": "UI/mL",
      "lt": true,
      "a": "ECLIA Cobas Roche",
      "lr": [
       null,
       20
      ],
      "an": "Technique AND reference range both changed on 26/05/2026. No comparison with earlier results."
     },
     "fsh": {
      "r": 4.3,
      "u": "UI/L",
      "a": "ECLIA Cobas Roche",
      "lr": [
       1.5,
       12.4
      ]
     },
     "lh": {
      "r": 4.6,
      "u": "UI/L",
      "a": "ECLIA Cobas Roche",
      "lr": [
       1.7,
       8.6
      ]
     },
     "e2": {
      "r": 58.7,
      "u": "pmol/L",
      "a": "ECLIA Cobas Roche",
      "lr": [
       40.4,
       157.8
      ]
     },
     "prl": {
      "r": 7.76,
      "u": "ng/mL",
      "a": "ECLIA Cobas Roche",
      "lr": [
       4.04,
       15.2
      ]
     },
     "tt": {
      "r": 22.12,
      "u": "nmol/L",
      "a": "ECLIA Cobas Roche",
      "lr": [
       8.63,
       28.98
      ],
      "ak": "ECLIA",
      "an": "Immunoassay, not LC-MS/MS — does not read identically to mass spec."
     },
     "pth": {
      "r": 17.9,
      "u": "pg/mL",
      "a": "CLIA LIAISON XL Diasorin",
      "lr": [
       6.5,
       36.8
      ],
      "an": "Intact PTH (1-84) on Diasorin CLIA. PTH assays are notoriously platform-dependent."
     },
     "cort": {
      "r": 292.4,
      "u": "nmol/L",
      "a": "ECLIA Cobas Roche",
      "lr": [
       132.4,
       537.9
      ]
     },
     "ft3": {
      "r": 3,
      "u": "pg/mL",
      "a": "ECLIA Cobas Roche",
      "lr": [
       2,
       4.4
      ],
      "an": "Free hormone by immunoassay, not equilibrium dialysis. The interval belongs to this platform.",
      "ak": "ECLIA Roche"
     },
     "atg": {
      "r": 19.1,
      "u": "UI/mL",
      "a": "ECLIA Cobas Roche",
      "lr": [
       null,
       115
      ],
      "an": "Technique AND reference range both changed on 26/05/2026. No comparison with earlier results."
     },
     "dheas": {
      "r": 257,
      "u": "µg/dL",
      "a": "ECLIA Cobas Roche",
      "lr": [
       160,
       449
      ]
     },
     "igf1": {
      "r": 104.6,
      "u": "ng/mL",
      "a": "CLIA LIAISON XL Diasorin",
      "lr": [
       82,
       241
      ],
      "an": "New technique from 23/09/2025. IGF-1 assays differ more widely between platforms than almost any other."
     },
     "tp": {
      "r": 72,
      "u": "g/L",
      "a": "Colorimétrie Biuret Cobas Roche",
      "lr": [
       64,
       83
      ]
     },
     "trf": {
      "r": 2.59,
      "u": "g/L",
      "a": "Immunoturbidimétrie Cobas Roche",
      "lr": [
       2,
       3.6
      ]
     },
     "ucrea": {
      "r": 417,
      "u": "mg/L",
      "a": "Technique enzymatique Cobas Roche",
      "lr": [
       400,
       2780
      ]
     },
     "shbg": {
      "r": 46,
      "u": "nmol/L",
      "a": "ECLIA",
      "ak": "ECLIA",
      "lr": [
       18,
       54
      ]
     },
     "zn": {
      "r": 16.3,
      "u": "µmol/L",
      "a": "Absorption atomique",
      "lr": [
       11,
       24
      ],
      "an": "The reference method for trace metals."
     },
     "cu": {
      "r": 11,
      "u": "µmol/L",
      "a": "ICP-MS",
      "lr": [
       11,
       20
      ],
      "an": "Mass spectrometry — the reference method for trace metals.",
      "cx": "Sits exactly on the floor of the range: 11 against 11–20."
     },
     "sel": {
      "r": 93.5,
      "u": "µg/L",
      "a": "ICP-MS",
      "lr": [
       70,
       130
      ],
      "an": "Mass spectrometry — the reference method for trace metals."
     },
     "hcy": {
      "r": 15,
      "u": "µmol/L",
      "a": "Enzymatique",
      "lr": [
       null,
       15
      ],
      "an": "Technique, reagent AND reference range all changed on 22/06/2026.",
      "cx": "Exactly at the ceiling: 15.00 against an expected under 15."
     },
     "cysc": {
      "r": 0.85,
      "u": "mg/L",
      "a": "Immunonéphélémétrie",
      "lr": [
       0.62,
       1.11
      ],
      "an": "Nephelometric cystatin C. Unlike creatinine it does not care about muscle mass.",
      "cx": "The lab also printed a cystatin-C eGFR of 116 mL/min by the Larsson equation."
     },
     "apob": {
      "r": 0.94,
      "u": "g/L",
      "a": "Immunoturbidimétrie",
      "lr": [
       0.66,
       1.33
      ],
      "an": "Counts particles rather than the cholesterol inside them, so it does not track LDL-C."
     },
     "lpa": {
      "r": 7,
      "u": "nmol/L",
      "lt": true,
      "a": "Immunoturbidimétrie",
      "lr": [
       null,
       75
      ],
      "an": "Reported in nmol/L — particle NUMBER. A mg/dL result is mass and does not convert reliably."
     },
     "dht": {
      "r": 1.8,
      "u": "nmol/L",
      "a": "LC-MS-MS",
      "lr": [
       0.86,
       3.44
      ],
      "an": "Mass spectrometry, the reference method — unlike the immunoassays used for the other androgens."
     },
     "o3": {
      "r": 6.12,
      "u": "%",
      "lr": [
       8,
       11
      ],
      "cx": "Erythrocyte membrane fatty-acid profile (AGRAS), run at Laboratoire Barbier."
     },
     "upcr": {
      "r": 25,
      "u": "mg/mmol",
      "lt": true,
      "a": "Turbidimétrie Cobas Roche",
      "lr": [
       null,
       50
      ],
      "cx": "The assay floor (<25 mg/mmol) is coarser than the 150 mg/g cut-off, so it cannot clear it."
     }
    }
   }
  ]
 }
};
