/* ============================================================================
   YOUR BLOODWORK. The single source of truth. index.html holds NO data.

   AI: to add a draw, read _readme.how_to_add_a_draw and follow it exactly.
   The two ways to ruin this file silently are (a) rescaling a value yourself
   and (b) guessing a unit. Keep the lab's printed number and use a recognised
   same-scale label from that marker's units[] array; equivalent notation may
   be normalised, but the raw number must never be rescaled. The dashboard
   validates on load, but a wrong-yet-plausible number may not be caught.
   ============================================================================ */
window.BLOODWORK =
{
 "_readme": {
  "what": "Bloodwork + supplement data for one person. THE single source of truth. The dashboard reads this file; so should any AI. Editing this file is how you add a new draw.",
  "how_to_add_a_draw": "APPEND one object to DATA.draws. Do not touch anything else. Do not reorder. Do not delete.\n  {\"id\":\"d2026jul\", \"date\":\"YYYY-MM-DD\", \"note\":\"lab, fasted?, on/off what\",\n   \"v\":{ \"<markerId>\": {\"r\": <EXACTLY what the lab printed>, \"u\": \"<a same-scale label from marker units[]>\"} }}\nRULES, in order of how badly they bite:\n 1. NEVER rescale a value. Keep the exact number the lab printed; the dashboard handles real conversions.\n 2. \"u\" must be a same-scale unit LABEL from that marker units[] array (e.g. \"mg/L\", \"µmol/L\", \"G/L\").\n    Equivalent zero-rescaling notation may be normalized (case, U/L vs UI/L, µUI/mL vs mUI/L). If the numeric scale is not listed, STOP; an obvious report typo may use the correct label only with a cx that records it.\n 3. \"<markerId>\" must be an existing id in MARK. If the lab reports something not in MARK, STOP and\n    say so rather than inventing an id — an unknown id is silently ignored.\n 4. Return the WHOLE file. Never a fragment, never a diff.\n 5. \"a\" is OPTIONAL: the assay/technique EXACTLY as the report printed it, and NOTHING else — no\n    gloss, no interpretation. Its optional companion \"an\" carries what the technique MEANS for\n    reading the number (\"Explicitly ultra-sensitive per report; older report does not identify sensitivity\"), which is usually an\n    inference and must not be smuggled into \"a\". Same split as lr versus cut / target / goal: transcription\n    and interpretation stay in separate fields. \"an\" without \"a\" is rejected by audit(). Use them\n    only on markers where\n    the method can move the number or void the range — calculated vs measured LDL, IDMS-traceable\n    creatinine, standard vs ultra-sensitive CRP, immunoassay vs LC-MS/MS or RIA hormones, IGF-1\n    platform, analyser-dependent MPV. Do NOT add it to markers the method cannot swing (sodium is\n    sodium), and NEVER copy it from a neighbouring draw: absent means UNRECORDED, not unchanged.\n    It exists because this file has already been misled four times by a value that moved when the\n    ASSAY changed and not the subject.\n 6. \"lt\": true marks a CENSORED result — the lab printed \"<x\" because the analyte fell below the\n    assay's detection limit. Store the LIMIT in r (r must be a number) and set lt; the panel then\n    renders \"<x\" instead of passing a bound off as a measurement. Do NOT invent a midpoint or a\n    zero: the only fact is that the true value lies somewhere in [0, x). If an upper bound crosses a high cutoff, the claim is unresolved and renders watch — never\n    confirmed abnormal — because the true value may still sit below it. Beware comparing two censored values\n    across draws — different assays have different limits, so 'Inf a 0,5' then '<0.6' is not a\n    rise, it is two bounds that cannot be ordered.\n 7. A marker carrying \"am\" has been judged assay-SENSITIVE: critical = the method can move the\n    number enough to break comparison between draws (free/total T, estradiol, DHT, LDL by\n    Friedewald, Lp(a), hs-CRP, creatinine, cystatin C, IGF-1, vitamin D, omega-3 index,\n    insulin, thyroid antibodies, PTH, prolactin, free T4/T3, trace elements, MPV, and SHBG +\n    albumin because calculated free T is built from them); useful = worth having if the marker\n    ever drives a decision. On those markers ALWAYS capture \"a\" from the report — the panel\n    names the draws that lack one. No \"am\" means the method cannot swing the number.\n 8. \"lr\" is the lab's OWN printed interval for that result: [lo, hi] in the SAME unit as u, with either end null where the report printed only one side (<5 is [null, 5]). Never invent the missing end. It is provenance, distinct from marker-level cut, target and goal claims. Record it wherever the report prints one. It is worth the bytes for two reasons: a printed interval fingerprints the assay (a distinctive interval can support assay identification, but March’s <5 mg/L alone could not distinguish standard from ultra-sensitive CRP; 8.7-25.0 pg/mL names a direct free-T RIA, the mismatch behind two wrong readings of the 2023 value), and an interval that CHANGES between draws is a method change even when no technique was printed.\n 9. \"cx\" is per-value CONTEXT: how to read THIS number in THIS draw — state at the time (on creatine, 2 days into a diet change) or what the lab did differently (substituted serum for the erythrocyte assay). NOT the same as \"an\": creatine is not an assay. It belongs on the markers it actually explains, never as a draw-wide sentence — the creatine caveat is about creatinine and eGFR and nothing else on that panel. WRITE IT IN FULL SENTENCES for a reader who does not already know the answer: \"ON CREATINE\" was the first draft and it is ambiguous between the supplement and the marker, which differ by two letters and both appear in the same note.\n 10. \"ak\" is what the printed \"a\" actually IS — a canonical key used ONLY for comparing draws, never displayed. It exists because \"a\" is a TRANSCRIPTION and labs transcribe the same method differently: one prints \"Formule de FRIEDEWALD\", another misspells it \"Formule de Friedwald\", a third writes bare \"ECLIA\" where the first named the analyser. Editing \"a\" to make those agree would falsify the record, so \"ak\" carries the equivalence instead. Set it ONLY when you are sure two differently-printed strings are the same assay. Leave it off whenever they might genuinely differ — an absent \"ak\" means \"compare what was printed\", which is the safe default. CKD-EPI deliberately has none: the 2009 and 2021 equations are both printed as \"CKD-EPI\" and are not the same calculation.\n 11. \"t\" on a VALUE overrides the draw's collection time, for a result folded in from a different day (the Dec 2020 zinc, drawn twelve days later and sent to a different laboratory). audit() requires a \"cx\" alongside it: a bare time override is a typo, not a fact.",
  "units": "Each marker has a units[] array of {l, m} or {l, a, b} entries. Convert to the US unit with the entry whose l matches v.u: value = (a !== undefined) ? a*raw + b : raw*m. The first entry is not special; v.u names the unit by its LABEL, never by position.",
  "dec": "Which supplements a marker bears on. Many-to-many. Membership does NOT mean the supplement moves it: cystatin C is under Creatine precisely because creatine CANNOT distort it, albumin is under Vitamin D because calcium cannot be corrected without it, selenium is iodine's cofactor, B12/folate are TMG's pathway. The DECS order is deliberate — grouped by primary biomarker domain (hormones/thyroid → lipids/cardio → liver/methylation → kidney/muscle → bone/minerals → aminos → foundational), NOT alphabetical; do not re-sort.",
  "confounds": [
   "Creatine was active at the March and July 2026 draws. It raises serum creatinine as substrate, not by damaging kidneys, and creatinine-based eGFR inherits the error. July cystatin C and its eGFR now provide the creatine-independent comparison.",
   "Topical minoxidil appears in no supplement group. That is the finding, not an omission: it is a potassium-channel opener with ~1.4% systemic absorption and no hormonal mechanism. Astaxanthin, lycopene, hyaluronic acid and collagen are absent for the same reason. No blood marker can falsify them."
  ],
  "subject": {
   "sex": "male",
   "height": "187 cm",
   "weight": "80 kg",
   "bodyfat": "~12%",
   "training": "resistance 1h15/day, plus one 30-min HIT run per week",
   "country": "France",
   "purpose": "Bryan Johnson-style quantified-self biohacking: longitudinal blood draws judge diet, supplement and lifestyle interventions, with AI used as the analytical medical team.",
   "diet": "See the DIET tab. Regular mackerel and trout as recorded there; lots of olive oil; no cheese, 3 eggs/day, potatoes, mushrooms, legumes + whole grains (wild rice / whole-grain pasta), and iodized salt. Huel Black: 90g/day as the pre-workout snack. Its fortification: iodine, vitamin D, zinc, selenium, B12, folate, magnesium, calcium, iron.",
   "alcohol": "none — does not drink",
   "supervision": "none"
  },
  "stack": "Moved to the STACK block below — structured, with dose, status, category, meal slot and purchase URL. STACK is the single source of truth for supplements; do not re-list them here.",
  "lifestyle_blocks": "STACK, ROUTINE, CARE and DIET are structured lifestyle data, same contract as the rest of the file: exact, never inferred. STACK is organised in functional categories; most items are status 'planned' — queued for the new protocol, not yet started. STACK.items[].status is one of taking/candidate/stopped/dropped/planned. .when is null (not yet assigned — never guess) OR an array of {at, dose}: one entry per meal slot it's taken at (presnack/brunch/dinner/evening), each carrying the PER-SLOT dose (astaxanthin = [{at:brunch,dose:12mg},{at:dinner,dose:12mg}]; the item's own .dose stays the daily total). Timing lives on the item (.when), not in the categories: cats are functional groups. .dec ties an item to its DECS group (verbatim label) so the dashboard can cross-link; null means no blood marker bears on it (see confounds). An optional .judge string is the readout — the marker or felt endpoint that decides whether a trial-tier (maylater) supplement is working — shown as a 'Judge by:' line under the item. A category's .note is the user's own caveat, shown under the section header; a category with t:null renders HEADERLESS — only its note introduces its items. A DIET meal without .at is a plain food section: no time chip, no supplement slot. A meal item is a string, or {n, info} — in a timed meal card, .info opens behind a hover info-tip on the name: .info is a string (plain caveat) OR a {section: [[label,value],…]} object rendered as a compact nutrition table (Huel Black uses this). ROUTINE times are HH:MM ascending; an entry's .until marks the end of a BLOCK (gym, work) and must be later than its .t; supplements are NOT shown in ROUTINE — they live only on the Diet tab (derived from STACK.when), so the routine just names the meal or event. CARE holds the dental / face protocols, rendered as cards on their own Grooming tab — deliberately NOT hour-by-hour events, they would duplicate. Meal supp lists are NOT stored anywhere: the Diet cards derive them from STACK.when (taking + planned) at render time, with an Evening supps card of its own — one source of truth for timing. DIET.meals[].id doubles as the when-slot key: an item with a when entry {at:'brunch'} belongs to the meal whose id is 'brunch' (slots: presnack/brunch/dinner/evening). In DIET, a '---' item is a course separator (starter / main / dessert), rendered as a gap. DIET.eveningAt stamps the Evening supplements card's time. NEXTDRAW is a decision contract: collections[] names the draw windows, protocol[] stores the shared preparation, active items[] carry en/fr plus group, draw ids, question, decision, trigger, method, preparation and timing, and deferred[] records exclusions that never enter a lab copy. The default copy includes decision and trend rows for one collection; the separate optional copy adds that collection's optional rows. A CARE card may split its items into .groups by cadence (Daily / Weekly / Yearly), same shape as TRAINING groups, OR carry a .schedule instead — a day-indexed weekly grid (days[] with an optional tag + hi chip, sections[] (each an optional .icon: sun/sunset/moon) of rows {n, on:[day names], hi?}, plus notes[]) rendered as a dot-matrix (solid = applied, faint = skipped); the Skincare card (id 'face') uses this and every on-day name must appear in days[]. TRAINING is {cardio, note, cards}: the gym program as Pull / Push / Legs cards, each organised in muscle-group .groups ('Accessory' holds what resists categorising). Every item is {n, sets:[[kg,reps],...]} — one pair per set, kg null = bodyweight, a '+' prefix = added weight, reps may be a duration like '0:30', sets [] = a protocol without logged sets; an optional .info string holds details shown behind an info tip. Copied exactly from the user's workout app; .cardio is the cardio baseline and .note is the resistance caveat — the page renders them as labelled Cardio / Resistance sections. Doses write micrograms as mcg, never µg — µ uppercases into M and becomes a 1000x reading error.",
  "never_measured": "9 markers have no stored result: corrected calcium is deliberately blank because every albumin exceeds the source lab’s correction ceiling; TIBC and calculated free testosterone are derived at load when their inputs exist; ceruloplasmin, MMA, PLP, urea, dialysis free testosterone and bicarbonate have not been measured.",
  "self_check_before_returning_the_file": [
   "Every markerId in the new draw exists in MARK.",
   "Every \"u\" string appears verbatim in that marker units[] array.",
   "No existing draw was modified, reordered or dropped. Count them: there are 7.",
   "The file still parses: it is window.BLOODWORK = {...}; with the wrapper intact."
  ],
  "interpretation_model": "Five claims stay separate. lr is the exact per-result interval printed by that laboratory, in the result unit; it is provenance shown in the datapoint detail, not a dashboard judgement band. reference is a marker-wide, rigorously sourced healthy-population interval and must declare its evidence strength, source, applicable population, assay requirement and review date; 15 of 88 markers currently have one: total testosterone plus 14 Blood Count markers. MPV, total IgE and ESR remain deliberately unassigned because a universal band would overstate analyzer, method or population comparability. cut contains guideline, diagnostic or risk zones and never pretends to be a lab interval. target is an evidence-backed health-optimization band and must carry strong/moderate/weak evidence plus its basis; 9 of 88 markers currently have one. goal is a personal intervention criterion and must say why it exists; 2 markers currently carry one. Missing fields are deliberate: most biomarkers have no defensible universal interval or longevity target. Legacy clin[], opt[] and oc are rejected by audit(). The viewer labels every marker-wide claim type and never silently substitutes a laboratory interval for one."
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
  "NAC 11g",
  "TMG 6g",
  "B-complex (methylfolate)",
  "Curcumin",
  "Creatine 5g",
  "Vitamin D3 10000 IU + K2",
  "Magnesium L-threonate",
  "Glycine 8g + taurine + collagen",
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
    "t": "Skin & Hair"
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
    "id": "finmin",
    "name": "Finasteride + Minoxidil (topical)",
    "ev": "strong",
    "dose": "0.1% + 5%, 1mL",
    "info": {
     "What it does": [
      [
       "",
       "Two mechanisms in one bottle. Finasteride blocks 5α-reductase, cutting the DHT that miniaturises scalp follicles; minoxidil opens K-ATP channels, holding follicles in anagen longer and thickening the shaft. One removes the cause, the other pushes growth."
      ]
     ],
     "Dose": [
      [
       "",
       "1mL of the combined serum, morning and evening. Topical buys scalp suppression at a fraction of oral's systemic exposure — but it is absorbed, not sealed off, which is precisely why the next draw can read it."
      ]
     ],
     "Evidence": [
      [
       "",
       "The only prescription drug on this list, and strong on both halves. Oral finasteride 1mg and topical minoxidil 5% each carry large RCTs; topical finasteride's own Phase III showed non-inferiority to oral on hair count with less serum DHT suppression. The combination beats either alone."
      ]
     ],
     "Watch": [
      [
       "",
       "Minoxidil sheds in weeks 2-8 — expected, not failure. Blocking 5α-reductase shunts substrate, so DHT 1.8 should fall while total T 22.12 and estradiol 58.7 can both drift up; all three are July pre-treatment baselines. Both drugs are indefinite — stopping hands the gains back within 6-12 months."
      ]
     ],
     "Changes": [
      [
       "1 Aug 2026",
       "started"
      ]
     ]
    },
    "cat": "skin",
    "status": "taking",
    "when": null,
    "url": null,
    "dec": "Finasteride (topical) 0.1% - 1mL",
    "judge": "hairline and part-width photos on a fixed setup; and DHT at the year-end draw — nothing else in the stack or diet touches DHT, so that read is clean"
   },
   {
    "id": "astax",
    "name": "Astaxanthin",
    "ev": "moderate",
    "dose": "24mg",
    "info": {
     "What it does": [
      [
       "",
       "Photoprotection — it raises the UV-burn threshold — plus moisture and elasticity. Not colour; that is beta-carotene's job."
      ]
     ],
     "Dose": [
      [
       "",
       "24mg/day, 12mg twice with fat. Above the EU cap but safe to 40mg — held here rather than raised until it has shown it does anything."
      ]
     ],
     "Evidence": [
      [
       "",
       "Several small RCTs for burn threshold and skin hydration. No outcome data."
      ]
     ],
     "Changes": [
      [
       "1 Aug 2026",
       "started"
      ]
     ]
    },
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
    "dec": null,
    "judge": "time to redness in consistent sun, and skin photos — read at the next draw, end of 2026"
   },
   {
    "id": "lyco",
    "name": "Lycopene",
    "ev": "moderate",
    "dose": "30mg",
    "info": {
     "What it does": [
      [
       "",
       "Warm skin tone plus UV photoprotection."
      ]
     ],
     "Dose": [
      [
       "",
       "30mg — 15mg twice with fat. Absorption saturates by 30-40mg, so more is just excreted. Tomato-derived (LycoBeads) beats synthetic; cooked tomato in olive oil beats raw."
      ]
     ],
     "Evidence": [
      [
       "",
       "Small RCTs at 10-16mg for photoprotection. The tone effect is observational."
      ]
     ],
     "Changes": [
      [
       "1 Aug 2026",
       "started"
      ]
     ]
    },
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
    "dec": null,
    "judge": "skin tone — photos in consistent light, read at the next draw, end of 2026"
   },
   {
    "id": "vitd3k2",
    "name": "Vitamin D3 + K2",
    "ev": "strong",
    "dose": "10000IU",
    "info": {
     "What it does": [
      [
       "",
       "Vitamin D repletion; the K2 steers calcium into bone rather than arteries. Daily SPF 50 leaves almost no cutaneous synthesis, so the supplement is doing all of the work."
      ]
     ],
     "Dose": [
      [
       "",
       "10000 IU, 2 tablets. Above the EFSA/IOM upper limit of 4000 — the Endocrine Society ceiling is 10000 — so this is titration, not a setting."
      ]
     ],
     "Evidence": [
      [
       "",
       "Correcting a measured deficiency rather than betting on one: the July draw read 28 ng/mL against the lab's own 30 floor."
      ]
     ],
     "Watch": [
      [
       "",
       "Calcium alongside 25-OH-D at every retest. The risk of a high dose is hypercalcaemia, not the D itself."
      ]
     ],
     "Changes": [
      [
       "1 Aug 2026",
       "5000 → 10000 IU"
      ]
     ]
    },
    "cat": "essentials",
    "status": "taking",
    "when": [
     {
      "at": "brunch",
      "dose": "10000IU"
     }
    ],
    "url": "https://www.sunday.de/en/vitamin-d-tablets-5000-iu-plus-k2-mk7-100mcg-xl.html",
    "dec": "Vitamin D3 10000 IU + K2",
    "judge": "25-OH-D, calcium and albumin at the year-end draw — aim for 30-50 ng/mL; reduce above 50 and reassess promptly above 60 or if calcium rises"
   },
   {
    "id": "omega3",
    "name": "Omega-3",
    "ev": "strong",
    "dose": "2000mg EPA + 1125mg DHA",
    "info": {
     "What it does": [
      [
       "",
       "EPA-forward dose aimed at skin and inflammation, about double the general-health dose."
      ]
     ],
     "Dose": [
      [
       "",
       "5 softgels/day = 2000mg EPA + 1125mg DHA. Algae oil in triglyceride form — cleaner than fish oil and iodine-free."
      ]
     ],
     "Evidence": [
      [
       "",
       "Large trial base for triglycerides and inflammation. The skin case is thinner."
      ]
     ],
     "Watch": [
      [
       "",
       "Multi-gram DHA raises LDL-C 5-10%. This started 1 Aug, twelve days AFTER the 142 was drawn, so it explains nothing about that number — it is a warning about the NEXT one. A flat or slightly higher LDL at the next draw would not mean the diet cut failed; part of it would be this. Fish days replace a dose rather than adding to one."
      ]
     ],
     "Changes": [
      [
       "1 Aug 2026",
       "started"
      ]
     ]
    },
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
    "dec": "Omega-3 (2000mg EPA, 1125mg DHA)",
    "judge": "omega-3 index — titrate to 8-12%"
   },
   {
    "id": "collagenc",
    "name": "Collagen peptides (low-MW)",
    "ev": "weak",
    "dose": "2g",
    "info": {
     "What it does": [
      [
       "",
       "Low-weight peptides (~500 Da) that signal skin to build its own collagen — the trigger, not the raw material. Glycine covers the raw material."
      ]
     ],
     "Dose": [
      [
       "",
       "2g with vitamin C."
      ]
     ],
     "Evidence": [
      [
       "",
       "Cosmetic endpoints only, modest effect sizes, and largely industry-funded."
      ]
     ],
     "Changes": [
      [
       "1 Aug 2026",
       "started"
      ]
     ]
    },
    "cat": "skin",
    "status": "taking",
    "when": [
     {
      "at": "brunch",
      "dose": "2g"
     }
    ],
    "url": "https://www.sunday.de/en/collagen-powder-sunglow-luxe-plus-c.html",
    "dec": "Glycine 8g + taurine + collagen",
    "judge": "skin hydration and fine lines — photos in consistent light, read at the next draw, end of 2026"
   },
   {
    "id": "ha",
    "name": "Hyaluronic acid",
    "ev": "weak",
    "dose": "250mg",
    "info": {
     "What it does": [
      [
       "",
       "Not absorbed intact (~0.2%) — gut bacteria fragment it into signals for the skin's own hyaluronic acid."
      ]
     ],
     "Dose": [
      [
       "",
       "250mg, the trial dose."
      ]
     ],
     "Evidence": [
      [
       "",
       "A 2025 review of 7 trials found modest hydration, elasticity and wrinkle gains. Gut-flora-dependent, so it may simply do nothing in a given person."
      ]
     ],
     "Changes": [
      [
       "1 Aug 2026",
       "started"
      ]
     ]
    },
    "cat": "skin",
    "status": "taking",
    "when": [
     {
      "at": "brunch",
      "dose": "250mg"
     }
    ],
    "url": "https://www.sunday.de/en/hyaluronic-acid-250mg-high-dose-vegan-from-fermentation.html",
    "dec": null,
    "judge": "skin hydration — photos in consistent light, read at the next draw, end of 2026"
   },
   {
    "id": "mglthr",
    "name": "Magnesium L-threonate",
    "ev": "weak",
    "judge": "sleep quality — an on-vs-off test by feel or your sleep tracker",
    "dose": "2040mg",
    "info": {
     "What it does": [
      [
       "",
       "Brain-penetrant magnesium (147mg elemental), sold for sleep."
      ]
     ],
     "Dose": [
      [
       "",
       "2040mg of the threonate salt."
      ]
     ],
     "Evidence": [
      [
       "",
       "Thin for sleep: the only trials are cognition in older adults, and you are young and replete at roughly twice the RDA."
      ]
     ],
     "Parked": [
      [
       "",
       "Pending your own on/off sleep test. No blood marker will settle this one."
      ]
     ]
    },
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
    "ev": "moderate",
    "judge": "skin tone — photos in consistent light, read at the next draw, end of 2026",
    "dose": "15mg",
    "info": {
     "What it does": [
      [
       "",
       "The carotenoid that actually drives golden tone — astaxanthin cannot."
      ]
     ],
     "Dose": [
      [
       "",
       "15mg with fat. More gives deeper colour, but watch for orange palms."
      ]
     ],
     "Evidence": [
      [
       "",
       "Consistent for skin tone. Algae source (Dunaliella): the synthetic form raised cancer risk in smokers, not in non-smokers."
      ]
     ],
     "Parked": [
      [
       "",
       "So astaxanthin and lycopene get judged alone first, then this gets added if the tint is still missing."
      ]
     ]
    },
    "cat": "maylater",
    "status": "planned",
    "when": null,
    "url": "https://www.sunday.de/en/beta-carotene-algae-extract-capsules.html",
    "dec": null
   },
   {
    "id": "glycine",
    "name": "Glycine",
    "ev": "moderate",
    "judge": "sleep (solo); or the GlyNAC markers, if paired with NAC",
    "dose": "8g",
    "info": {
     "What it does": [
      [
       "",
       "Glutathione precursor, paired with NAC. On its own, a sleep aid."
      ]
     ],
     "Dose": [
      [
       "",
       "8g is 100mg/kg, the glycine arm of the Sekhar GlyNAC protocol at your weight. Sleep studies use 3g, so this is the glutathione dose, not the sleep one."
      ]
     ],
     "Evidence": [
      [
       "",
       "GlyNAC has small RCTs in older adults. The sleep effect has its own separate small trials at 3g."
      ]
     ],
     "Watch": [
      [
       "",
       "NOT 1:1 with NAC — the trial dosed by moles, which works out to 1:1.33 by weight."
      ]
     ],
     "Parked": [
      [
       "",
       "Gated with NAC — the pair is one decision. On its own it would be a 3g sleep trial, which is a different question."
      ]
     ]
    },
    "cat": "maylater",
    "status": "planned",
    "when": null,
    "url": null,
    "dec": "Glycine 8g + taurine + collagen"
   },
   {
    "id": "nac",
    "name": "NAC",
    "ev": "moderate",
    "judge": "hs-CRP, HOMA-IR, homocysteine and GGT, before vs after 3 months",
    "dose": "11g",
    "info": {
     "What it does": [
      [
       "",
       "Glutathione and antioxidant precursor."
      ]
     ],
     "Dose": [
      [
       "",
       "11g is 132mg/kg, the NAC arm of Sekhar's GlyNAC — heavier than the glycine arm because the trial dosed by moles (1.33 and 0.81 mmol/kg) and NAC is the larger molecule."
      ]
     ],
     "Evidence": [
      [
       "",
       "Small RCTs in older adults for oxidative stress and insulin sensitivity. Nothing at your age."
      ]
     ],
     "Watch": [
      [
       "",
       "Raises homocysteine, which is already at 15.0. TMG first or alongside — never NAC on its own."
      ]
     ],
     "Parked": [
      [
       "",
       "Until the goal and the oxidative markers are set."
      ]
     ]
    },
    "cat": "maylater",
    "status": "planned",
    "when": null,
    "url": null,
    "dec": "NAC 11g"
   },
   {
    "id": "tmg",
    "name": "TMG",
    "ev": "moderate",
    "judge": "homocysteine — it exists only to offset NAC's rise",
    "dose": "6g",
    "info": {
     "What it does": [
      [
       "",
       "Methyl donor that lowers homocysteine."
      ]
     ],
     "Dose": [
      [
       "",
       "6g, sized to offset the homocysteine the NAC raises."
      ]
     ],
     "Evidence": [
      [
       "",
       "A consistent 10-20% homocysteine reduction across trials."
      ]
     ],
     "Watch": [
      [
       "",
       "Betaine above ~4g can nudge LDL up, which matters while LDL is the open question."
      ]
     ],
     "Parked": [
      [
       "",
       "Pending homocysteine, the number that justifies the loop."
      ]
     ]
    },
    "cat": "maylater",
    "status": "planned",
    "when": null,
    "url": null,
    "dec": "TMG 6g"
   },
   {
    "id": "bcomplex",
    "name": "B-complex (methylfolate)",
    "ev": "moderate",
    "judge": "homocysteine and serum folate on the next draw",
    "dose": "400-800mcg 5-MTHF",
    "info": {
     "What it does": [
      [
       "",
       "Folate, B12 and B6 in their active forms — 5-MTHF, methylcobalamin, P5P."
      ]
     ],
     "Dose": [
      [
       "",
       "400-800mcg 5-MTHF."
      ]
     ],
     "Evidence": [
      [
       "",
       "B-vitamin lowering of homocysteine is well established. Whether it changes outcomes is not."
      ]
     ],
     "Watch": [
      [
       "",
       "Keep supplemental B6 at or below the EFSA adult upper limit of 12mg/day — sustained high doses can cause neuropathy."
      ]
     ],
     "Parked": [
      [
       "",
       "Diet folate clears the RDA at ~450-500mcg — down from ~520-570 since the eggs went 5 to 3 — yet serum folate sits at 6.3 on the floor of its band — which points at conversion rather than intake. The greens and the August creatine restart get read first."
      ]
     ]
    },
    "cat": "maylater",
    "status": "planned",
    "when": null,
    "url": null,
    "dec": "B-complex (methylfolate)"
   },
   {
    "id": "garlic",
    "name": "AGE garlic",
    "ev": "moderate",
    "judge": "blood pressure and LDL / ApoB",
    "dose": "2400mg",
    "info": {
     "What it does": [
      [
       "",
       "Aged garlic extract — modest blood-pressure and lipid effects, plus slowed coronary plaque progression."
      ]
     ],
     "Dose": [
      [
       "",
       "2400mg is the plaque-trial dose. Blood pressure responds at 600-1200mg."
      ]
     ],
     "Evidence": [
      [
       "",
       "RCTs showing ~5-8 mmHg, and one plaque-progression trial — all in hypertensive or high-risk groups."
      ]
     ],
     "Parked": [
      [
       "",
       "The payoff is for elevated blood pressure or established CVD risk. BP measures normal at check-ups, so that half of the case is closed; only a lipid or plaque reason could revive it."
      ]
     ]
    },
    "cat": "maylater",
    "status": "planned",
    "when": null,
    "url": null,
    "dec": "AGE garlic 2400mg"
   },
   {
    "id": "curcumin",
    "name": "Curcumin",
    "ev": "weak",
    "judge": "hs-CRP",
    "dose": null,
    "info": {
     "What it does": [
      [
       "",
       "Anti-inflammatory, via NF-κB."
      ]
     ],
     "Dose": [
      [
       "",
       "No dose set on purpose — raw curcumin barely absorbs, so the form (piperine, Meriva, liposomal) matters more than the milligrams."
      ]
     ],
     "Evidence": [
      [
       "",
       "Many small trials, heterogeneous preparations, high risk of publication bias."
      ]
     ],
     "Watch": [
      [
       "",
       "Among the supplements most often implicated in drug-induced liver injury registries. Your liver panel is pristine — AST 22, ALT 17, GGT 16 — so this trades a small real risk against no measurable gain."
      ]
     ],
     "Parked": [
      [
       "",
       "Until hs-CRP runs high enough to target. It is currently under 0.6, the bottom of the assay."
      ]
     ]
    },
    "cat": "maylater",
    "status": "planned",
    "when": null,
    "url": null,
    "dec": "Curcumin"
   },
   {
    "id": "creatine",
    "name": "Creatine",
    "ev": "strong",
    "dose": "5g",
    "info": {
     "What it does": [
      [
       "",
       "Strength, power and likely cognition. It also removes the body's single largest methyl-group demand, so it may pull homocysteine down on its own."
      ]
     ],
     "Dose": [
      [
       "",
       "5g/day, up to 20g on poor-sleep weeks. Saturation-based, so timing is flexible."
      ]
     ],
     "Evidence": [
      [
       "",
       "The best-evidenced supplement on this list — hundreds of trials, consistent effect."
      ]
     ],
     "Watch": [
      [
       "",
       "Restarting inflates serum creatinine 10-20% without touching kidney function, so the next draw must order cystatin C or the eGFR will read falsely worse. It was paused before the 2026-07-20 draw precisely so that one would read clean — which is what makes that draw the kidney baseline."
      ]
     ],
     "Changes": [
      [
       "1 Aug 2026",
       "restarted"
      ]
     ]
    },
    "cat": "sport",
    "status": "taking",
    "when": [
     {
      "at": "presnack",
      "dose": "5g"
     }
    ],
    "url": "https://amzn.eu/d/09MG0JOC",
    "dec": "Creatine 5g",
    "judge": "strength and power in training; and cystatin C, never creatinine alone"
   },
   {
    "id": "taurine",
    "name": "Taurine",
    "ev": "none",
    "judge": "nothing measurable at your age — a theory bet, not a testable one",
    "dose": "5g",
    "info": {
     "What it does": [
      [
       "",
       "Proposed longevity agent, extrapolated from the 2023 mouse-lifespan paper."
      ]
     ],
     "Dose": [
      [
       "",
       "5g is a longevity dose. Exercise studies use 1-3g."
      ]
     ],
     "Evidence": [
      [
       "",
       "Human data is observational, not trial. Cheap and safe to 10g, but unproven."
      ]
     ],
     "Parked": [
      [
       "",
       "Until human data, or a clear reason."
      ]
     ]
    },
    "cat": "maylater",
    "status": "planned",
    "when": null,
    "url": null,
    "dec": "Glycine 8g + taurine + collagen"
   },
   {
    "id": "boron",
    "name": "Boron",
    "ev": "weak",
    "judge": "free testosterone and SHBG",
    "dose": "10mg",
    "info": {
     "What it does": [
      [
       "",
       "Lowers SHBG, so more testosterone stays free, and drops estradiol."
      ]
     ],
     "Dose": [
      [
       "",
       "10mg is the studied dose — free T rose 28% over a week."
      ]
     ],
     "Evidence": [
      [
       "",
       "One small study, short, in men not selected for low testosterone."
      ]
     ],
     "Parked": [
      [
       "",
       "Unclear at your age with normal T and SHBG at 46. Parked until the bloods give it a job."
      ]
     ]
    },
    "cat": "maylater",
    "status": "planned",
    "when": null,
    "url": null,
    "dec": "Boron 10mg"
   },
   {
    "id": "ashwa",
    "name": "Ashwagandha",
    "ev": "moderate",
    "judge": "perceived stress and sleep; testosterone / cortisol on bloods",
    "dose": "600mg",
    "info": {
     "What it does": [
      [
       "",
       "Adaptogen — lowers cortisol and stress and improves sleep; small RCTs show recovery, strength and modest testosterone bumps in trained men."
      ]
     ],
     "Dose": [
      [
       "",
       "600mg/day of a standardised root extract (KSM-66)."
      ]
     ],
     "Evidence": [
      [
       "",
       "Several small RCTs, mostly short and industry-linked, but consistent in direction."
      ]
     ],
     "Watch": [
      [
       "",
       "It can nudge thyroid hormones, so never start it before a baseline draw — it would confound TSH and free T4. Rare liver reports too; cycle 8-12 weeks on."
      ]
     ],
     "Parked": [
      [
       "",
       "Until after the next draw, so it cannot confound the thyroid panel."
      ]
     ]
    },
    "cat": "maylater",
    "status": "planned",
    "when": null,
    "url": null,
    "dec": "Ashwagandha 600mg"
   },
   {
    "id": "ergo",
    "name": "L-Ergothioneine",
    "ev": "none",
    "dose": "30mg",
    "judge": "NOTHING — no routine assay exists, so this one is never judged",
    "info": {
     "What it does": [
      [
       "",
       "An amino acid the body cannot make but has a dedicated transporter for (OCTN1), which concentrates it in mitochondria-rich tissue. Long half-life, so levels accumulate."
      ]
     ],
     "Dose": [
      [
       "",
       "30mg is the EFSA-approved daily maximum — do not stack anything on top. Mushrooms are the only real food source, and 30mg beats 150g of oyster mushrooms for less money."
      ]
     ],
     "Evidence": [
      [
       "",
       "Strong mechanism, decent observational data — higher plasma levels track with lower cardiovascular and all-cause mortality in Swedish cohorts — but no outcome trials and no assay to check it against. A deliberate bet at ~10 euros a month, not a correction of anything measured."
      ]
     ],
     "Changes": [
      [
       "1 Aug 2026",
       "started"
      ]
     ]
    },
    "cat": "essentials",
    "status": "taking",
    "when": [
     {
      "at": "brunch",
      "dose": "30mg"
     }
    ],
    "url": "https://www.amazon.fr/dp/B0GS9RWTLF",
    "dec": null
   }
  ]
 },
 "ROUTINE": [
  {
   "t": "07:00",
   "do": "10min walk, sunlight, shower"
  },
  {
   "t": "07:15",
   "do": "Pre-workout snack"
  },
  {
   "t": "08:00",
   "until": "10:00",
   "do": "Gym — 1h15 lifting, the rest is commute. Phone stays OFF"
  },
  {
   "t": "10:00",
   "until": "10:30",
   "do": "Brunch"
  },
  {
   "t": "10:30",
   "until": "16:30",
   "do": "Work"
  },
  {
   "t": "16:30",
   "until": "17:00",
   "do": "Dinner"
  },
  {
   "t": "17:00",
   "until": "21:00",
   "do": "Work"
  },
  {
   "t": "21:00",
   "until": "21:30",
   "do": "Shower"
  },
  {
   "t": "21:30",
   "do": "Bedtime"
  },
  {
   "t": "22:00",
   "do": "Lights out"
  }
 ],
 "CARE": [
  {
   "id": "face",
   "t": "Skincare",
   "groups": [
    {
     "t": "Morning",
     "icon": "sun",
     "items": [
      {
       "n": "Serum - Vit C 15% + Ferulic Acid + Vit E",
       "url": "https://geekandgorgeous.com/products/c-glow"
      },
      {
       "n": "Serum - Niacinamide (B3) + Green Tea",
       "url": "https://www.yesstyle.com/fr/tcuc.EUR/coc.FR/info.html/pid.1119542353"
      },
      {
       "n": "Moisturizer - Ceramides + Cholesterol",
       "url": "https://www.cerave.fr/nos-produits/hydratants/creme-hydratante-visage"
      },
      {
       "n": "SPF 50",
       "url": "https://www.yesstyle.com/fr/tcuc.EUR/coc.FR/info.html/pid.1122974582"
      },
      "Serum - Finasteride 0.1% + Minoxidil 5%"
     ]
    },
    {
     "t": "Before sleep",
     "icon": "moon",
     "items": [
      {
       "n": "Serum - Multi-Peptide",
       "url": "https://theordinary.com/fr-fr/sérum-multi-peptides-peptides-de-cuivre-1-100625.html"
      },
      {
       "n": "Emulsion - Retinal 0.2%",
       "url": "https://geekandgorgeous.com/products/a-game-20"
      },
      {
       "n": "Moisturizer - Ceramides + Cholesterol",
       "url": "https://www.cerave.fr/nos-produits/hydratants/creme-hydratante-visage"
      },
      "Slugging - Petrolatum",
      "Serum - Finasteride 0.1% + Minoxidil 5%",
      {
       "n": "Serum - Greyverse",
       "url": "https://neofollics.com/products/anti-grey-hair-serum"
      }
     ]
    }
   ],
   "notes": [
    "Body lotion 12% AHA while still wet after morning shower, at least once a week",
    "Glycolic 7% once a week instead of Peptides and Retinal",
    "Microneedling → Infadolan: face 1mm weekly, up to 2mm monthly; scalp 0.75mm weekly.",
    "No Retinal for 24h after microneedling; slug with Infadolan instead of Petrolatum"
   ]
  },
  {
   "id": "dental",
   "t": "Dental",
   "groups": [
    {
     "t": "Daily",
     "items": [
      "Water jet + toothbrush 2-3x/day",
      "Alternate thread floss & interdental brushes"
     ]
    },
    {
     "t": "Yearly",
     "items": [
      "Dental scaling",
      "Carbamide peroxide 10-15%, applied with custom dental tray"
     ]
    }
   ]
  }
 ],
 "TRAINING": {
  "cardio": "One 30min HIT per week - mostly ~5k run.\nStriving for 3 sessions when business will be automated.",
  "note": "Six sessions a week, each card twice. Weights and reps are approximations and may vary dramatically based on the machine used",
  "cards": [
   {
    "id": "pull",
    "t": "Pull",
    "groups": [
     {
      "t": "Back",
      "items": [
       {
        "n": "Chin up",
        "sets": [
         [
          "+30",
          5
         ],
         [
          "+30",
          5
         ],
         [
          "+30",
          5
         ]
        ]
       },
       {
        "n": "Explosive pull up",
        "sets": [
         [
          null,
          2
         ],
         [
          null,
          2
         ],
         [
          null,
          2
         ]
        ]
       },
       {
        "n": "Face pull",
        "sets": [
         [
          40,
          10
         ],
         [
          40,
          10
         ]
        ]
       },
       {
        "n": "Single arm row",
        "sets": [
         [
          40,
          8
         ],
         [
          40,
          8
         ]
        ]
       },
       {
        "n": "Back extension",
        "sets": [
         [
          40,
          12
         ],
         [
          40,
          12
         ]
        ]
       }
      ]
     },
     {
      "t": "Biceps",
      "items": [
       {
        "n": "Bicep curl",
        "sets": [
         [
          20,
          8
         ],
         [
          20,
          8
         ]
        ]
       },
       {
        "n": "Hammer curl",
        "sets": [
         [
          20,
          6
         ],
         [
          20,
          6
         ]
        ]
       },
       {
        "n": "Preacher curl",
        "sets": [
         [
          40,
          12
         ],
         [
          40,
          12
         ]
        ]
       }
      ]
     },
     {
      "t": "Traps & neck",
      "items": [
       {
        "n": "Shrug",
        "sets": [
         [
          40,
          50
         ],
         [
          40,
          50
         ]
        ]
       },
       {
        "n": "Neck extension",
        "sets": [
         [
          20,
          10
         ],
         [
          20,
          10
         ]
        ]
       }
      ]
     },
     {
      "t": "Accessory",
      "items": [
       {
        "n": "Pull-over",
        "sets": [
         [
          10,
          10
         ],
         [
          10,
          10
         ]
        ]
       },
       {
        "n": "Trap-3 raise",
        "sets": [
         [
          10,
          10
         ],
         [
          10,
          10
         ]
        ]
       },
       {
        "n": "One arm hang",
        "sets": [
         [
          null,
          "0:30"
         ],
         [
          null,
          "0:30"
         ]
        ]
       }
      ]
     }
    ]
   },
   {
    "id": "push",
    "t": "Push",
    "groups": [
     {
      "t": "Warm-up",
      "items": [
       {
        "n": "Shoulder prep",
        "info": "Figure 8, push-ups, ext. rotations w/ band or dumbbell, skin the cat, dislocates, gymnast seated stretch",
        "sets": []
       }
      ]
     },
     {
      "t": "Shoulders",
      "items": [
       {
        "n": "Overhead press",
        "sets": [
         [
          50,
          5
         ],
         [
          50,
          5
         ],
         [
          50,
          5
         ]
        ]
       },
       {
        "n": "Lateral raise",
        "sets": [
         [
          12,
          10
         ],
         [
          12,
          10
         ],
         [
          12,
          10
         ]
        ]
       },
       {
        "n": "Machine deltoid raise",
        "sets": [
         [
          50,
          5
         ],
         [
          50,
          5
         ],
         [
          50,
          5
         ]
        ]
       },
       {
        "n": "Rear deltoid",
        "sets": [
         [
          20,
          15
         ],
         [
          20,
          15
         ],
         [
          20,
          15
         ]
        ]
       }
      ]
     },
     {
      "t": "Triceps",
      "items": [
       {
        "n": "Tricep pushdown",
        "sets": [
         [
          25,
          20
         ],
         [
          25,
          20
         ]
        ]
       },
       {
        "n": "Overhead tricep ext.",
        "sets": [
         [
          20,
          10
         ],
         [
          20,
          10
         ]
        ]
       }
      ]
     },
     {
      "t": "Chest",
      "items": [
       {
        "n": "Incline dumbbell press",
        "sets": [
         [
          30,
          6
         ],
         [
          30,
          6
         ]
        ]
       },
       {
        "n": "Machine incline press",
        "sets": [
         [
          80,
          6
         ],
         [
          80,
          6
         ]
        ]
       },
       {
        "n": "Chest fly",
        "sets": [
         [
          25,
          15
         ],
         [
          25,
          15
         ]
        ]
       }
      ]
     }
    ]
   },
   {
    "id": "legs",
    "t": "Legs",
    "groups": [
     {
      "t": "Calves",
      "items": [
       {
        "n": "Seated calf raise",
        "sets": [
         [
          80,
          20
         ],
         [
          80,
          20
         ],
         [
          80,
          20
         ]
        ]
       },
       {
        "n": "Standing calf raise",
        "sets": [
         [
          200,
          20
         ],
         [
          200,
          20
         ],
         [
          200,
          20
         ]
        ]
       }
      ]
     },
     {
      "t": "Quads",
      "items": [
       {
        "n": "Shrimp squat",
        "sets": [
         [
          null,
          5
         ],
         [
          null,
          5
         ],
         [
          null,
          5
         ],
         [
          null,
          5
         ],
         [
          null,
          5
         ],
         [
          null,
          5
         ]
        ]
       },
       {
        "n": "Machine squat",
        "sets": [
         [
          80,
          8
         ],
         [
          80,
          8
         ],
         [
          80,
          8
         ]
        ]
       },
       {
        "n": "Leg extension",
        "sets": [
         [
          80,
          12
         ],
         [
          80,
          12
         ]
        ]
       }
      ]
     },
     {
      "t": "Glutes",
      "items": [
       {
        "n": "Standing abduction",
        "sets": [
         [
          100,
          20
         ],
         [
          100,
          20
         ],
         [
          100,
          20
         ]
        ]
       },
       {
        "n": "Hip thrust",
        "sets": [
         [
          160,
          10
         ],
         [
          160,
          10
         ],
         [
          160,
          10
         ]
        ]
       },
       {
        "n": "Hip abduction",
        "sets": [
         [
          100,
          15
         ],
         [
          100,
          15
         ],
         [
          100,
          15
         ]
        ]
       }
      ]
     },
     {
      "t": "Hamstrings & groin",
      "items": [
       {
        "n": "Nordic curl",
        "sets": [
         [
          20,
          8
         ],
         [
          20,
          8
         ]
        ]
       },
       {
        "n": "Lying leg curl",
        "sets": [
         [
          50,
          12
         ],
         [
          50,
          12
         ]
        ]
       },
       {
        "n": "Hip adduction",
        "sets": [
         [
          80,
          12
         ],
         [
          80,
          12
         ]
        ]
       }
      ]
     },
     {
      "t": "Core",
      "items": [
       {
        "n": "Psoas knee raise",
        "sets": [
         [
          16,
          10
         ],
         [
          16,
          10
         ]
        ]
       },
       {
        "n": "Crunch",
        "sets": [
         [
          20,
          12
         ],
         [
          20,
          12
         ]
        ]
       }
      ]
     }
    ]
   }
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
    "rows": [
     [
      "Cardiac events",
      "None on either side"
     ]
    ],
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
  "intro": "The December draw judges the interventions started 1 Aug 2026: the stable diet, creatine, omega-3 intake including food, vitamin D and topical finasteride. Do not begin a parked supplement experiment before the draw.",
  "collections": [
   {
    "id": "main",
    "t": "Main optimization draw",
    "date": "December",
    "note": "After about 4½ months of stable diet, creatine, omega-3 including food, and topical finasteride. Postpone rather than draw through illness or a broken preparation window."
   }
  ],
  "protocol": [
   {
    "t": "Fast and time",
    "v": "Water only for 8–12 hours; collect between 08:00 and 09:00."
   },
   {
    "t": "Training",
    "v": "No resistance training or HIT for 48 hours."
   },
   {
    "t": "Illness",
    "v": "Wait until at least 1–2 symptom-free weeks after fever, respiratory infection, significant inflammation or injury."
   },
   {
    "t": "Diet and hydration",
    "v": "Keep the preceding 2 days ordinary: normal water, sodium, carbohydrate and protein; no last-minute clean-up."
   },
   {
    "t": "Interventions",
    "v": "Keep creatine, vitamin D, fish plus supplemental omega-3 and topical finasteride stable. Take morning oral supplements after collection."
   },
   {
    "t": "Finasteride timing",
    "v": "Draw before the morning topical application, after the normal previous-evening application."
   },
   {
    "t": "Stable window",
    "v": "No B-complex, TMG, NAC, ashwagandha, curcumin or other parked experiment before the main draw; restart the clock after a major diet, dose or weight change."
   },
   {
    "t": "Record",
    "v": "Log fasting duration, collection time, sleep, illness, body weight, hydration, last workout, last topical application, creatine and vitamin-D doses, and average fish plus EPA/DHA intake."
   }
  ],
  "items": [
   {
    "en": "Kidney filtration — creatinine, eGFRcr, cystatin C, eGFRcys + combined eGFR",
    "fr": "Fonction rénale — créatinine, DFG créatinine, cystatine C, DFG cystatine C + DFG combiné",
    "g": "decision",
    "draws": [
     "main"
    ],
    "why": "Does the creatinine rise reflect creatine and muscle mass, or a real filtration change?",
    "decision": "Keep interpreting creatinine alongside cystatin C rather than stopping creatine for the draw.",
    "trigger": "A confirmed combined-eGFR decline over 20% exceeds expected variability; an isolated creatinine change with stable cystatin C supports confounding.",
    "method": "Same creatinine and cystatin C methods as July; request eGFRcr, eGFRcys and combined eGFR.",
    "prep": "Stable creatine 5g/day, normal hydration, fasting morning draw and no hard training for 48 hours.",
    "timing": "Main draw after at least 12–16 stable weeks."
   },
   {
    "en": "ApoB + lipid panel (total, LDL, HDL, triglycerides)",
    "fr": "Apolipoprotéine B (ApoB) + bilan lipidique (cholestérol total, LDL, HDL, triglycérides)",
    "g": "decision",
    "draws": [
     "main"
    ],
    "why": "Did the August saturated-fat reduction and broader diet change lower atherogenic particle burden?",
    "decision": "If ApoB and non-HDL-C do not materially improve, revisit saturated fat, soluble fibre, energy balance and weight stability.",
    "trigger": "Predeclared personal threshold: at least a 10% ApoB reduction from 0.94g/L, approximately 0.85g/L or lower.",
    "method": "Same laboratory and ApoB immunoturbidimetric method as July.",
    "prep": "8–12-hour fast, morning draw, stable diet and body weight.",
    "timing": "Main draw after at least 12–16 stable weeks."
   },
   {
    "en": "Homocysteine",
    "fr": "Homocystéine",
    "g": "decision",
    "draws": [
     "main"
    ],
    "why": "Does stable creatine lower methyl demand enough to move homocysteine before adding methyl donors?",
    "decision": "Observe if it falls meaningfully; if it remains high, interpret folate, PLP and B12 before designing a targeted B-complex or TMG trial.",
    "trigger": "A fall of at least 2µmol/L and below 15 supports observation; a standardized repeat at or above 15 triggers cofactor review.",
    "method": "Same enzymatic method as July.",
    "prep": "Stable creatine, no B-complex or TMG, fasting morning draw.",
    "timing": "Main draw. Creatine lowering is a testable hypothesis with mixed controlled-trial results, not a guaranteed outcome."
   },
   {
    "en": "Total testosterone + SHBG + albumin (calculated free testosterone)",
    "fr": "Testostérone totale + SHBG + albumine sur le même prélèvement (testostérone libre calculée)",
    "g": "decision",
    "draws": [
     "main"
    ],
    "why": "Did topical finasteride materially shift the androgen profile, and what is free testosterone when all calculation inputs are present?",
    "decision": "Do not act on a small isolated movement; reassess only a confirmed change with relevant symptoms.",
    "trigger": "A confirmed change of at least 20% plus compatible symptoms prompts review.",
    "method": "Same Roche/ECLIA pathway; calculate free T from the three measurements. Never use a direct free-T immunoassay.",
    "prep": "Fasting collection between 08:00 and 09:00 after normal sleep and 48 hours without hard training.",
    "timing": "Main draw, on the same sample as DHT."
   },
   {
    "en": "DHT (dihydrotestosterone)",
    "fr": "DHT (dihydrotestostérone) — LC-MS/MS",
    "g": "decision",
    "draws": [
     "main"
    ],
    "why": "How much systemic DHT suppression is produced by the topical finasteride regimen?",
    "decision": "Hair photographs judge efficacy; review topical exposure if systemic suppression is large or side effects appear.",
    "trigger": "Balanced personal threshold: a fall of at least 50% from 1.8nmol/L, to about 0.9nmol/L or lower, or relevant side effects.",
    "method": "Same LC-MS/MS assay as July.",
    "prep": "Draw before the morning topical application after the normal previous-evening application.",
    "timing": "Main draw after about 4½ months of use.",
    "cost": "Expensive — justified"
   },
   {
    "en": "25-OH vitamin D + calcium + albumin",
    "fr": "Vitamine D (25-OH) + calcium total + albumine",
    "g": "decision",
    "draws": [
     "main"
    ],
    "why": "Where does 10000 IU/day place vitamin D, and is calcium remaining safe?",
    "decision": "Use the year-end result to titrate the vitamin-D dose; albumin is also reused for calculated free T.",
    "trigger": "Aim for 30–50ng/mL; reduce above 50, and reassess promptly above 60 or if calcium exceeds the laboratory range.",
    "method": "Same DiaSorin Liaison XL 25-OH-D method and same laboratory calcium and albumin methods.",
    "prep": "Keep the current dose stable and take the morning dose after collection.",
    "timing": "Main draw in December, after the current dose has been stable since 1 Aug."
   },
   {
    "en": "Omega-3 index",
    "fr": "Index oméga-3 érythrocytaire (membrane des globules rouges, AGRAS)",
    "g": "decision",
    "draws": [
     "main"
    ],
    "why": "Does approximately 3.9g/day EPA+DHA including mackerel, trout and supplements reach the intended red-cell range?",
    "decision": "Maintain in-range intake; if low, verify intake and method before increasing an already-high dose; if above range, reduce the supplement.",
    "trigger": "Proposed personal band: 8–12%. This is a weak-evidence observational framework, not an outcome-defined optimum.",
    "method": "Exact erythrocyte-membrane AGRAS measurement by GC-FID through Bioavenir Metz.",
    "prep": "Keep average food plus supplement intake stable; record fish frequency and supplemental EPA/DHA.",
    "timing": "Main draw after at least 4 months of stable average intake.",
    "cost": "Expensive — justified"
   },
   {
    "en": "Vitamin B12",
    "fr": "Vitamine B12",
    "g": "decision",
    "draws": [
     "main"
    ],
    "why": "Does B12 help explain persistent homocysteine, rather than becoming an intervention by itself?",
    "decision": "Use it to decide whether MMA adds value and whether any B-vitamin intervention should be targeted.",
    "trigger": "A result in the 150–399pg/mL range makes MMA useful; July's 522pg/mL does not.",
    "method": "Same assay as July.",
    "prep": "Fasting morning draw before supplements.",
    "timing": "Main draw with homocysteine, folate and PLP."
   },
   {
    "en": "Folate + vitamin B6 (PLP)",
    "fr": "Folates (B9) + vitamine B6 (phosphate de pyridoxal, PLP)",
    "g": "decision",
    "draws": [
     "main"
    ],
    "why": "Is either cofactor contributing to homocysteine before a B-complex is introduced?",
    "decision": "Use targeted replacement only if the assay supports it; adequate values argue against an indiscriminate high-dose complex.",
    "trigger": "A result below the assay range changes the intervention; there is no reason to chase an above-range optimization target.",
    "method": "Same folate assay; PLP specifically for B6.",
    "prep": "No B-complex before the draw; morning supplements after collection.",
    "timing": "Main draw with homocysteine and B12."
   },
   {
    "en": "Zinc + copper + ceruloplasmin",
    "fr": "Zinc + cuivre + céruloplasmine",
    "g": "decision",
    "draws": [
     "main"
    ],
    "why": "Is borderline copper reproducible, and does it track ceruloplasmin or the zinc and diet balance?",
    "decision": "Do not supplement from copper 69.9 alone; use the repeated pattern to decide on dietary review or appropriate evaluation.",
    "trigger": "Repeated below-range copper, especially with low ceruloplasmin, changes the decision.",
    "method": "Same trace-element methods as July; ceruloplasmin on the same sample.",
    "prep": "Fasting morning sample before mineral-containing supplements.",
    "timing": "Main draw on the stable August diet."
   },
   {
    "en": "Fasting glucose + fasting insulin (HOMA-IR)",
    "fr": "Glycémie à jeun + insuline à jeun (calcul HOMA-IR)",
    "g": "decision",
    "draws": [
     "main"
    ],
    "why": "Did the August diet materially change fasting insulin sensitivity?",
    "decision": "Confirm a meaningful deterioration before changing an otherwise successful diet.",
    "trigger": "A rise of at least 25% from HOMA-IR 0.91 or fasting insulin 4.2mUI/L merits confirmation.",
    "method": "Same insulin assay as July; calculate HOMA-IR from the paired fasting sample.",
    "prep": "8–12-hour fast, morning draw, no caffeine and no hard exercise for 48 hours.",
    "timing": "Main draw after at least 12–16 stable weeks."
   },
   {
    "en": "hs-CRP",
    "fr": "CRP ultrasensible",
    "g": "trend",
    "draws": [
     "main"
    ],
    "why": "Is the draw free of material inflammatory, illness or training noise?",
    "decision": "Use it as draw context, not as proof that omega-3 succeeded or failed.",
    "trigger": "Remaining below 1mg/L is compatible with July; at or above 2mg/L first review illness, injury and training.",
    "method": "Explicit ultra-sensitive CRP only, not standard CRP; same assay if possible.",
    "prep": "No acute illness or injury and no hard training for 48 hours.",
    "timing": "Main draw; postpone if the protocol is not clean."
   },
   {
    "en": "Chemistry + liver bundle",
    "fr": "Urée, sodium, potassium, chlore, bicarbonates, ASAT, ALAT, GGT, PAL, bilirubine totale, protéines totales",
    "g": "trend",
    "draws": [
     "main"
    ],
    "why": "Is the inexpensive chemistry and liver baseline still stable before any future NAC or curcumin experiment?",
    "decision": "No action when stable; confirm and investigate a new abnormality before adding another intervention.",
    "trigger": "Any new out-of-range result or confirmed doubling from the personal baseline changes the decision.",
    "method": "Same laboratory. Calcium and albumin are already ordered with vitamin D and are not duplicated here.",
    "prep": "Normal hydration and stable protein intake; fasting morning collection.",
    "timing": "Main draw."
   },
   {
    "en": "Iron studies — ferritin, iron, transferrin/TIBC + TSAT",
    "fr": "Bilan martial — ferritine, fer, transferrine/CTF + coefficient de saturation",
    "g": "trend",
    "draws": [
     "main"
    ],
    "why": "Are iron availability and stores stable on a diet whose iron is largely non-haem?",
    "decision": "Use the panel, never serum iron alone, to decide whether diet or further evaluation needs attention.",
    "trigger": "TSAT below 20%, ferritin below the laboratory range, or a confirmed ferritin decline over 25% changes the decision.",
    "method": "Same assays; derive TIBC from transferrin when appropriate rather than ordering a duplicate calculation.",
    "prep": "Fasting morning draw under ordinary dietary conditions.",
    "timing": "Main draw."
   },
   {
    "en": "HbA1c",
    "fr": "Hémoglobine glyquée (HbA1c)",
    "g": "trend",
    "draws": [
     "main"
    ],
    "why": "What is the longer glucose-exposure response to the August diet?",
    "decision": "Confirm a meaningful rise before changing the intervention.",
    "trigger": "A confirmed increase of at least 0.3 percentage points is more meaningful than a small movement.",
    "method": "Same standardized HbA1c method where possible.",
    "prep": "No special preparation beyond the shared draw protocol.",
    "timing": "Main draw, after more than one full red-cell exposure window."
   },
   {
    "en": "CBC",
    "fr": "NFS (numération formule sanguine)",
    "g": "trend",
    "draws": [
     "main"
    ],
    "why": "Is the established hematology series, including platelets, still stable?",
    "decision": "Repeat and investigate a meaningful change rather than reacting to a single small fluctuation.",
    "trigger": "Platelets below range or a decline over 15% from the established 148–172 series changes the decision; apply the same principle to new CBC abnormalities.",
    "method": "Same laboratory analyser where possible.",
    "prep": "Normal hydration, no illness and 48 hours without hard training.",
    "timing": "Main draw."
   },
   {
    "en": "Estradiol",
    "fr": "Œstradiol (E2)",
    "g": "optional",
    "draws": [
     "main"
    ],
    "why": "Did estradiol move descriptively after topical finasteride?",
    "decision": "It changes a decision only with compatible symptoms or a large confirmed change.",
    "trigger": "No defensible symptom-free optimization cutoff.",
    "method": "Same ECLIA assay as July.",
    "prep": "Same fasting morning sample as testosterone.",
    "timing": "Optional at the main draw."
   },
   {
    "en": "Free testosterone by equilibrium dialysis",
    "fr": "Testostérone libre par dialyse à l'équilibre — une seule fois (à défaut : testostérone biodisponible par précipitation au sulfate d'ammonium ; jamais immunodosage direct)",
    "g": "optional",
    "draws": [
     "main"
    ],
    "why": "Would a one-time reference measurement usefully calibrate calculated free testosterone?",
    "decision": "Treat it as descriptive unless symptoms and repeat total-testosterone data support an endocrine decision.",
    "trigger": "No standalone action threshold.",
    "method": "Equilibrium dialysis or validated bioavailable testosterone only, on the same sample as total T, SHBG and albumin.",
    "prep": "Fasting collection between 08:00 and 09:00.",
    "timing": "Optional at the main draw, only if genuinely offered.",
    "cost": "Expensive — weak decision value"
   },
   {
    "en": "IGF-1",
    "fr": "IGF-1 (somatomédine C)",
    "g": "optional",
    "draws": [
     "main"
    ],
    "why": "Is another longitudinal point worth collecting when no current intervention depends on it?",
    "decision": "Use only for exploratory longevity tracking; do not change the stack from this result alone.",
    "trigger": "No defensible personal action threshold.",
    "method": "Same post-23/09/2025 assay; otherwise the point is not comparable.",
    "prep": "Shared fasting morning protocol.",
    "timing": "Optional at the main draw.",
    "cost": "Expensive — weak decision value"
   }
  ],
  "deferred": [
   {
    "en": "PTH",
    "fr": "Parathormone (PTH)",
    "s": "defer",
    "why": "Not the primary detector of vitamin-D excess.",
    "reconsider": "Add if calcium is abnormal, vitamin-D behavior is unexpected, or the high dose continues despite uncertainty."
   },
   {
    "en": "TSH + free T4",
    "fr": "TSH + T4 libre (FT4)",
    "s": "defer",
    "why": "July already provides the baseline and no thyroid intervention is starting.",
    "reconsider": "Repeat immediately before a defined ashwagandha trial, using the same Roche platform."
   },
   {
    "en": "MMA",
    "fr": "Acide méthylmalonique (MMA)",
    "s": "defer",
    "why": "July B12 was 522pg/mL, so homocysteine at or above 15 alone does not justify it.",
    "reconsider": "Add if B12 is 150–399pg/mL, neurological symptoms arise, or persistent homocysteine remains unexplained."
   },
   {
    "en": "Urinalysis / dipstick / ACR",
    "fr": "Bandelette urinaire / rapport albumine-créatinine urinaire",
    "s": "remove",
    "why": "Low decision value without diabetes, hypertension, known kidney disease, symptoms or an abnormal renal result.",
    "reconsider": "Add a first-morning ACR or appropriate urinalysis only when a kidney-risk question exists."
   },
   {
    "en": "Prolactin",
    "fr": "Prolactine",
    "s": "remove",
    "why": "No intervention currently depends on it.",
    "reconsider": "Add for relevant symptoms or a clinician-directed endocrine evaluation."
   },
   {
    "en": "Anti-TPO antibodies",
    "fr": "Anticorps anti-TPO",
    "s": "remove",
    "why": "Negative in July with no current thyroid-autoimmunity question.",
    "reconsider": "Add if TSH or FT4 changes or symptoms create a new question."
   },
   {
    "en": "Morning cortisol",
    "fr": "Cortisol matinal",
    "s": "remove",
    "why": "A single morning result has weak actionability without symptoms or a defined experiment.",
    "reconsider": "Add for a specific clinical question or a deliberately designed ashwagandha experiment."
   },
   {
    "en": "Selenium",
    "fr": "Sélénium",
    "s": "remove",
    "why": "July was mid-range and food intake is adequate; no supplement decision depends on it.",
    "reconsider": "Add after a meaningful diet change or if thyroid findings create a reason."
   },
   {
    "en": "Serum magnesium",
    "fr": "Magnésium sérique",
    "s": "remove",
    "why": "It is a weak proxy for stores and no active magnesium experiment exists.",
    "reconsider": "Add before and after a specifically designed magnesium trial."
   },
   {
    "en": "Uric acid",
    "fr": "Acide urique",
    "s": "remove",
    "why": "Current 4.2mg/dL is low and no intervention depends on it.",
    "reconsider": "Add for symptoms, medication changes or a defined purine or fructose experiment."
   },
   {
    "en": "Creatine kinase (CK)",
    "fr": "Créatine kinase (CPK)",
    "s": "remove",
    "why": "Six weekly resistance sessions make it highly training-sensitive and it currently changes no decision.",
    "reconsider": "Add for muscle symptoms, medication safety or a defined training-recovery experiment, with at least 72 hours without strenuous exercise."
   }
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
      "amt": "90g",
      "info": {
       "Macronutrients — per 90g": [
        [
         "Energy",
         "400kcal",
         "20%"
        ],
        [
         "Protein",
         "40g",
         "80%"
        ],
        [
         "Fat",
         "17g",
         "24%"
        ],
        [
         "– saturates",
         "4.0g",
         "20%"
        ],
        [
         "– monounsat.",
         "3.8g"
        ],
        [
         "– PUFA",
         "9.4g"
        ],
        [
         "Carbs",
         "19g",
         "7%"
        ],
        [
         "– sugars",
         "1.6g",
         "2%"
        ],
        [
         "Fibre",
         "8.4g"
        ],
        [
         "Salt",
         "0.8g",
         "13%"
        ]
       ],
       "Vitamins": [
        [
         "A",
         "180mcg",
         "23%"
        ],
        [
         "D",
         "160IU",
         "80%"
        ],
        [
         "E",
         "4.0mg",
         "33%"
        ],
        [
         "K",
         "39mcg",
         "52%"
        ],
        [
         "C",
         "60mg",
         "75%"
        ],
        [
         "Thiamin",
         "0.22mg",
         "20%"
        ],
        [
         "Riboflavin",
         "0.28mg",
         "20%"
        ],
        [
         "Niacin",
         "3.2mg",
         "20%"
        ],
        [
         "B6",
         "0.28mg",
         "20%"
        ],
        [
         "Pantoth.",
         "1.2mg",
         "20%"
        ],
        [
         "Folate",
         "80mcg",
         "40%"
        ],
        [
         "B12",
         "0.80mcg",
         "32%"
        ],
        [
         "Biotin",
         "12mcg",
         "24%"
        ]
       ],
       "Minerals": [
        [
         "Calcium",
         "240mg",
         "30%"
        ],
        [
         "Phosphorus",
         "360mg",
         "51%"
        ],
        [
         "Potassium",
         "700mg",
         "35%"
        ],
        [
         "Chloride",
         "164mg",
         "21%"
        ],
        [
         "Magnesium",
         "88mg",
         "23%"
        ],
        [
         "Iron",
         "9.0mg",
         "64%"
        ],
        [
         "Zinc",
         "4.6mg",
         "46%"
        ],
        [
         "Copper",
         "0.50mg",
         "50%"
        ],
        [
         "Manganese",
         "0.90mg",
         "45%"
        ],
        [
         "Selenium",
         "33mcg",
         "60%"
        ],
        [
         "Iodine",
         "30mcg",
         "20%"
        ],
        [
         "Chromium",
         "12mcg",
         "30%"
        ],
        [
         "Molybdenum",
         "37mcg",
         "74%"
        ]
       ],
       "Other": [
        [
         "Choline",
         "120mg"
        ],
        [
         "Omega-3 (ALA)",
         "4.0g"
        ],
        [
         "Omega-6",
         "4.2g"
        ],
        [
         "MCT",
         "1.1g"
        ],
        [
         "Caffeine",
         "68mg"
        ],
        [
         "Green tea",
         "130mg"
        ],
        [
         "Lutein",
         "1.6mg"
        ],
        [
         "Zeaxanthin",
         "0.1mg"
        ],
        [
         "B. coagulans",
         "200M"
        ]
       ]
      }
     },
     {
      "n": "Banana",
      "amt": "1",
      "info": {
       "Macronutrients — per 1 (~118g)": [
        [
         "Energy",
         "105kcal",
         "5%"
        ],
        [
         "Carbs",
         "27g",
         "10%"
        ],
        [
         "– sugars",
         "14g",
         "16%"
        ],
        [
         "Fibre",
         "3g"
        ],
        [
         "Protein",
         "1.3g",
         "3%"
        ]
       ],
       "Standouts": [
        [
         "Potassium",
         "422mg",
         "21%"
        ],
        [
         "B6",
         "0.45mg",
         "32%"
        ],
        [
         "Vit C",
         "10mg",
         "12%"
        ],
        [
         "Magnesium",
         "32mg",
         "8%"
        ]
       ]
      }
     },
     {
      "n": "Berries (frozen)",
      "amt": "75g",
      "info": {
       "Ingredients": [
        [
         "",
         "Redcurrant, blackberry, blackcurrant, wild blueberry, raspberry — all organic"
        ]
       ],
       "Macronutrients — per 75g": [
        [
         "Energy",
         "36kcal",
         "2%"
        ],
        [
         "Carbs",
         "5.6g",
         "2%"
        ],
        [
         "– sugars",
         "4.6g",
         "5%"
        ],
        [
         "Fibre",
         "3.2g"
        ],
        [
         "Protein",
         "0.7g",
         "1%"
        ],
        [
         "Fat",
         "0.4g",
         "1%"
        ],
        [
         "Salt",
         "0.11g",
         "2%"
        ]
       ],
       "Standouts": [
        [
         "Anthocyanins",
         "~100-200mg"
        ],
        [
         "Vit C",
         "~30-45mg"
        ],
        [
         "Manganese",
         "~0.2mg",
         "11%"
        ],
        [
         "Vit K",
         "~9mcg",
         "12%"
        ]
       ],
       "Changes": [
        [
         "1 Aug 2026",
         "added"
        ]
       ],
       "Notes": [
        [
         "",
         "Mixed into the Huel in the morning, not the night before — anthocyanins degrade fastest at its near-neutral pH"
        ]
       ]
      }
     },
     {
      "n": "Nuts",
      "amt": "~15g",
      "info": {
       "Ingredients": [
        [
         "",
         "Walnut 6g, almond 5g, pistachio 4g"
        ]
       ],
       "Macronutrients — per ~15g": [
        [
         "Energy",
         "90kcal",
         "5%"
        ],
        [
         "Protein",
         "3g",
         "6%"
        ],
        [
         "Fat",
         "8g",
         "11%"
        ],
        [
         "Fibre",
         "1.5g"
        ]
       ],
       "Standouts": [
        [
         "Omega-3 (ALA)",
         "0.6g"
        ],
        [
         "Vitamin E",
         "1.3mg",
         "11%"
        ],
        [
         "Magnesium",
         "28mg",
         "7%"
        ]
       ],
       "Changes": [
        [
         "1 Aug 2026",
         "added"
        ]
       ]
      }
     },
     {
      "n": "Dark chocolate",
      "amt": "~10g",
      "info": {
       "Ingredients": [
        [
         "",
         "Cocoa 85%, Madagascar origin"
        ]
       ],
       "Macronutrients — per ~10g": [
        [
         "Energy",
         "60kcal",
         "3%"
        ],
        [
         "Fat",
         "5g",
         "7%"
        ],
        [
         "– saturates",
         "3g",
         "14%"
        ],
        [
         "Carbs",
         "2g",
         "1%"
        ],
        [
         "Fibre",
         "1g"
        ]
       ],
       "Standouts": [
        [
         "Magnesium",
         "23mg",
         "6%"
        ],
        [
         "Iron",
         "1.1mg",
         "8%"
        ],
        [
         "Copper",
         "0.2mg",
         "18%"
        ],
        [
         "Manganese",
         "0.2mg",
         "10%"
        ]
       ],
       "Changes": [
        [
         "1 Aug 2026",
         "added"
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
      "n": "Mackerel OR Tofu",
      "amt": "80g / 125g",
      "info": {
       "Mackerel 80g · Ingredients": [
        [
         "",
         "Mackerel (Scomber scombrus) 97%, salt, pepper"
        ]
       ],
       "Mackerel 80g · Macronutrients — per 80g": [
        [
         "Energy",
         "212kcal",
         "11%"
        ],
        [
         "Protein",
         "14.4g",
         "29%"
        ],
        [
         "Fat",
         "16.8g",
         "24%"
        ],
        [
         "– saturates",
         "5.2g",
         "26%"
        ],
        [
         "Salt",
         "1.6g",
         "27%"
        ]
       ],
       "Mackerel 80g · Standouts": [
        [
         "EPA + DHA",
         "~2g"
        ]
       ],
       "Mackerel 80g · Changes": [
        [
         "1 Aug 2026",
         "replaced 100g mozzarella"
        ]
       ],
       "Mackerel 80g · Notes": [
        [
         "",
         "No omega-3 supplement with this meal"
        ]
       ],
       "Tofu 125g · Ingredients": [
        [
         "",
         "Water, hulled soya 27.5%, coagulants: calcium sulphate and nigari — organic, French non-GMO"
        ]
       ],
       "Tofu 125g · Macronutrients — per 125g": [
        [
         "Energy",
         "181kcal",
         "9%"
        ],
        [
         "Protein",
         "17.5g",
         "35%"
        ],
        [
         "Fat",
         "11.3g",
         "16%"
        ],
        [
         "– saturates",
         "1.9g",
         "10%"
        ],
        [
         "Fibre",
         "3.1g"
        ],
        [
         "Salt",
         "0g",
         "0%"
        ]
       ],
       "Tofu 125g · Standouts": [
        [
         "Calcium",
         "235mg",
         "29%"
        ],
        [
         "Magnesium",
         "74mg",
         "20%"
        ]
       ],
       "Tofu 125g · Changes": [
        [
         "1 Aug 2026",
         "replaced 100g mozzarella"
        ]
       ]
      }
     },
     {
      "n": "Avocado half",
      "amt": "~70g",
      "info": {
       "Macronutrients — per ~70g": [
        [
         "Energy",
         "112kcal",
         "6%"
        ],
        [
         "Carbs",
         "6g",
         "2%"
        ],
        [
         "Fibre",
         "4.7g"
        ],
        [
         "Protein",
         "1.4g",
         "3%"
        ],
        [
         "Fat",
         "10g",
         "14%"
        ],
        [
         "– saturates",
         "1.5g",
         "8%"
        ]
       ],
       "Standouts": [
        [
         "Folate",
         "57mcg",
         "14%"
        ],
        [
         "Potassium",
         "340mg",
         "17%"
        ],
        [
         "Vit K",
         "15mcg",
         "20%"
        ],
        [
         "Vit E",
         "1.4mg",
         "12%"
        ],
        [
         "Monounsaturated",
         "6.8g"
        ]
       ],
       "Changes": [
        [
         "1 Aug 2026",
         "added"
        ]
       ]
      }
     },
     "---",
     {
      "n": "Eggs poached",
      "amt": "3",
      "info": {
       "Macronutrients — per 3 (~150g)": [
        [
         "Energy",
         "233kcal",
         "11%"
        ],
        [
         "Protein",
         "19g",
         "37%"
        ],
        [
         "Fat",
         "16g",
         "23%"
        ],
        [
         "– saturates",
         "4.8g",
         "25%"
        ]
       ],
       "Standouts": [
        [
         "Choline",
         "443mg"
        ],
        [
         "Selenium",
         "45mcg",
         "82%"
        ],
        [
         "Vit D",
         "120IU",
         "60%"
        ],
        [
         "B12",
         "1.5mcg",
         "60%"
        ],
        [
         "Vit A",
         "240mcg",
         "30%"
        ],
        [
         "Riboflavin",
         "0.6mg",
         "43%"
        ],
        [
         "Folate",
         "71mcg",
         "36%"
        ]
       ],
       "Changes": [
        [
         "1 Aug 2026",
         "6 fried in grapeseed oil → 3 poached"
        ]
       ]
      }
     },
     {
      "n": "Poêlée Rustique",
      "amt": "~300g",
      "info": {
       "Ingredients": [
        [
         "",
         "Potatoes 42%, green beans 18%, white and brown button mushrooms 22%, fried onions"
        ]
       ],
       "Macronutrients — per ~300g frozen": [
        [
         "Energy",
         "300kcal",
         "15%"
        ],
        [
         "Carbs",
         "45g",
         "17%"
        ],
        [
         "– sugars",
         "2.7g",
         "3%"
        ],
        [
         "Fibre",
         "6g"
        ],
        [
         "Protein",
         "7.2g",
         "14%"
        ],
        [
         "Fat",
         "8.7g",
         "12%"
        ],
        [
         "– saturates",
         "1.8g",
         "9%"
        ],
        [
         "Salt",
         "1.44g",
         "24%"
        ]
       ],
       "Standouts": [
        [
         "Mushrooms",
         "66g"
        ],
        [
         "Potassium",
         "~900mg",
         "45%"
        ]
       ],
       "Notes": [
        [
         "",
         "Cooked in sunflower oil and cream"
        ]
       ]
      }
     },
     {
      "n": "Olive oil",
      "amt": "10mL",
      "info": {
       "Macronutrients — per 10mL": [
        [
         "Energy",
         "80kcal",
         "4%"
        ],
        [
         "Fat",
         "9g",
         "13%"
        ],
        [
         "– monounsat.",
         "7g"
        ],
        [
         "– saturates",
         "1.2g",
         "6%"
        ]
       ],
       "Standouts": [
        [
         "Vit E",
         "1mg",
         "10%"
        ]
       ]
      }
     },
     "---",
     {
      "n": "Fruit (apple, pear, peach…)",
      "amt": "~150g",
      "info": {
       "Macronutrients — per 1 (~150g)": [
        [
         "Energy",
         "80kcal",
         "4%"
        ],
        [
         "Carbs",
         "20g",
         "8%"
        ],
        [
         "– sugars",
         "15g",
         "17%"
        ],
        [
         "Fibre",
         "3g"
        ]
       ],
       "Standouts": [
        [
         "Vit C",
         "7mg",
         "9%"
        ],
        [
         "Potassium",
         "180mg",
         "9%"
        ]
       ]
      }
     },
     {
      "n": "Dark chocolate",
      "amt": "~10g",
      "info": {
       "Ingredients": [
        [
         "",
         "Cocoa 85%, Madagascar origin"
        ]
       ],
       "Macronutrients — per ~10g": [
        [
         "Energy",
         "60kcal",
         "3%"
        ],
        [
         "Fat",
         "5g",
         "7%"
        ],
        [
         "– saturates",
         "3g",
         "14%"
        ],
        [
         "Carbs",
         "2g",
         "1%"
        ],
        [
         "Fibre",
         "1g"
        ]
       ],
       "Standouts": [
        [
         "Magnesium",
         "23mg",
         "6%"
        ],
        [
         "Iron",
         "1.1mg",
         "8%"
        ],
        [
         "Copper",
         "0.2mg",
         "18%"
        ],
        [
         "Manganese",
         "0.2mg",
         "10%"
        ]
       ],
       "Changes": [
        [
         "1 Aug 2026",
         "added"
        ]
       ]
      }
     },
     {
      "n": "Coffee, Half Caffeinated",
      "amt": "230 + 100mL",
      "info": {
       "Macronutrients — per 330mL": [
        [
         "Energy",
         "~50kcal",
         "2%"
        ],
        [
         "Protein",
         "3.4g",
         "7%"
        ],
        [
         "Fat",
         "1.7g",
         "2%"
        ],
        [
         "Carbs (lactose)",
         "4.8g",
         "2%"
        ]
       ],
       "Standouts": [
        [
         "Caffeine",
         "~80mg"
        ],
        [
         "Chlorogenic acids",
         "~150mg"
        ],
        [
         "Calcium",
         "120mg",
         "15%"
        ],
        [
         "Potassium",
         "~260mg",
         "13%"
        ]
       ],
       "Changes": [
        [
         "1 Aug 2026",
         "added"
        ]
       ]
      }
     },
     {
      "n": "Kefir",
      "amt": "250mL (half a bottle)",
      "info": {
       "Ingredients": [
        [
         "",
         "Semi-skimmed milk, skimmed milk powder, lactic ferments, kefir grains, yeasts, vitamin D"
        ]
       ],
       "Macronutrients — per 250mL": [
        [
         "Energy",
         "110kcal",
         "6%"
        ],
        [
         "Carbs",
         "9.8g",
         "4%"
        ],
        [
         "– sugars",
         "9.8g",
         "11%"
        ],
        [
         "Protein",
         "8.5g",
         "17%"
        ],
        [
         "Fat",
         "3.8g",
         "5%"
        ],
        [
         "– saturates",
         "2.3g",
         "12%"
        ],
        [
         "Salt",
         "0.25g",
         "4%"
        ]
       ],
       "Standouts": [
        [
         "Calcium",
         "300mg",
         "38%"
        ],
        [
         "Vit D",
         "2mcg",
         "40%"
        ]
       ],
       "Changes": [
        [
         "1 Aug 2026",
         "added"
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
     "---",
     {
      "n": "Rice — regular + wild",
      "amt": "~75g",
      "info": {
       "Macronutrients — per ~75g cooked": [
        [
         "Energy",
         "86kcal",
         "4%"
        ],
        [
         "Carbs",
         "18g",
         "7%"
        ],
        [
         "Protein",
         "2.5g",
         "5%"
        ],
        [
         "Fibre",
         "0.8g"
        ]
       ],
       "Changes": [
        [
         "1 Aug 2026",
         "150g → 75g, wild rice mixed in"
        ]
       ]
      }
     },
     {
      "n": "Legumes (lentils, beans…)",
      "amt": "~75g",
      "info": {
       "Macronutrients — per ~75g cooked": [
        [
         "Energy",
         "95kcal",
         "5%"
        ],
        [
         "Carbs",
         "17g",
         "7%"
        ],
        [
         "Protein",
         "7g",
         "14%"
        ],
        [
         "Fibre",
         "6g"
        ]
       ],
       "Standouts": [
        [
         "Folate",
         "120mcg",
         "60%"
        ],
        [
         "Iron",
         "2mg",
         "14%"
        ],
        [
         "Potassium",
         "270mg",
         "14%"
        ]
       ],
       "Changes": [
        [
         "1 Aug 2026",
         "added"
        ]
       ]
      }
     },
     {
      "n": "Olive oil",
      "amt": "50mL",
      "info": {
       "Macronutrients — per 50mL": [
        [
         "Energy",
         "405kcal",
         "20%"
        ],
        [
         "Fat",
         "46g",
         "66%"
        ],
        [
         "– monounsat.",
         "34g"
        ],
        [
         "– saturates",
         "6g",
         "30%"
        ]
       ],
       "Standouts": [
        [
         "Vit E",
         "6mg",
         "50%"
        ]
       ]
      }
     },
     {
      "n": "Lean beef OR Chicken",
      "amt": "~200g",
      "info": {
       "Lean beef 200g · Ingredients": [
        [
         "",
         "Ground beef, 5% fat"
        ]
       ],
       "Lean beef 200g · Macronutrients — per ~200g cooked": [
        [
         "Energy",
         "345kcal",
         "17%"
        ],
        [
         "Protein",
         "52g",
         "104%"
        ],
        [
         "Fat",
         "13g",
         "19%"
        ],
        [
         "– saturates",
         "5.8g",
         "29%"
        ]
       ],
       "Lean beef 200g · Standouts": [
        [
         "Iron",
         "5.4mg",
         "39%"
        ],
        [
         "Zinc",
         "12mg",
         "120%"
        ],
        [
         "B12",
         "5mcg",
         "200%"
        ],
        [
         "Selenium",
         "42mcg",
         "76%"
        ]
       ],
       "Lean beef 200g · Changes": [
        [
         "1 Aug 2026",
         "15% → 5% fat"
        ]
       ],
       "Chicken 200g · Ingredients": [
        [
         "",
         "Chicken breast, skinless"
        ]
       ],
       "Chicken 200g · Macronutrients — per ~200g cooked": [
        [
         "Energy",
         "330kcal",
         "17%"
        ],
        [
         "Protein",
         "62g",
         "124%"
        ],
        [
         "Fat",
         "7.2g",
         "10%"
        ],
        [
         "– saturates",
         "2g",
         "10%"
        ]
       ],
       "Chicken 200g · Standouts": [
        [
         "Selenium",
         "44mcg",
         "80%"
        ],
        [
         "Niacin",
         "28mg",
         "175%"
        ],
        [
         "B6",
         "1.2mg",
         "86%"
        ],
        [
         "Phosphorus",
         "440mg",
         "63%"
        ],
        [
         "Zinc",
         "1.8mg",
         "18%"
        ]
       ]
      }
     },
     {
      "n": "Spinach OR Broccoli",
      "amt": "~150g",
      "info": {
       "Spinach 150g · Ingredients": [
        [
         "",
         "Frozen spinach"
        ]
       ],
       "Spinach 150g · Macronutrients — per ~150g frozen": [
        [
         "Energy",
         "35kcal",
         "2%"
        ],
        [
         "Protein",
         "4.5g",
         "9%"
        ],
        [
         "Fat",
         "0.6g",
         "1%"
        ],
        [
         "Carbs",
         "5.7g",
         "2%"
        ],
        [
         "Fibre",
         "3.6g"
        ]
       ],
       "Spinach 150g · Standouts": [
        [
         "Folate",
         "170mcg",
         "43%"
        ],
        [
         "Vit K",
         "740mcg",
         "987%"
        ],
        [
         "Magnesium",
         "130mg",
         "35%"
        ],
        [
         "Iron",
         "5.4mg",
         "39%"
        ],
        [
         "Calcium",
         "204mg",
         "26%"
        ]
       ],
       "Spinach 150g · Changes": [
        [
         "1 Aug 2026",
         "added"
        ]
       ],
       "Spinach 150g · Notes": [
        [
         "",
         "Its calcium is oxalate-bound — only ~5% is absorbed"
        ],
        [
         "",
         "Folate is the post-reheat figure — ~25% goes even with no water poured off"
        ]
       ],
       "Broccoli 150g · Ingredients": [
        [
         "",
         "Frozen broccoli"
        ]
       ],
       "Broccoli 150g · Macronutrients — per ~150g frozen": [
        [
         "Energy",
         "42kcal",
         "2%"
        ],
        [
         "Protein",
         "4.7g",
         "9%"
        ],
        [
         "Fat",
         "0.2g",
         "0%"
        ],
        [
         "Carbs",
         "7.8g",
         "3%"
        ],
        [
         "Fibre",
         "4.5g"
        ]
       ],
       "Broccoli 150g · Standouts": [
        [
         "Folate",
         "120mcg",
         "30%"
        ],
        [
         "Vit C",
         "45mg",
         "56%"
        ],
        [
         "Vit K",
         "210mcg",
         "280%"
        ],
        [
         "Calcium",
         "70mg",
         "9%"
        ]
       ],
       "Broccoli 150g · Changes": [
        [
         "1 Aug 2026",
         "added"
        ]
       ],
       "Broccoli 150g · Notes": [
        [
         "",
         "Low oxalate — ~60% of its calcium is absorbed, against spinach's 5%"
        ],
        [
         "",
         "Folate and vitamin C are post-reheat figures — both lose ~25-30% in the pan"
        ]
       ]
      }
     },
     "---",
     {
      "n": "Nuts",
      "amt": "~15g",
      "info": {
       "Ingredients": [
        [
         "",
         "Walnut 6g, almond 5g, pistachio 4g"
        ]
       ],
       "Macronutrients — per ~15g": [
        [
         "Energy",
         "90kcal",
         "5%"
        ],
        [
         "Protein",
         "3g",
         "6%"
        ],
        [
         "Fat",
         "8g",
         "11%"
        ],
        [
         "Fibre",
         "1.5g"
        ]
       ],
       "Standouts": [
        [
         "Omega-3 (ALA)",
         "0.6g"
        ],
        [
         "Vitamin E",
         "1.3mg",
         "11%"
        ],
        [
         "Magnesium",
         "28mg",
         "7%"
        ]
       ],
       "Changes": [
        [
         "1 Aug 2026",
         "added"
        ]
       ]
      }
     },
     {
      "n": "Kiwis",
      "amt": "2",
      "info": {
       "Macronutrients — per 2 (~140g)": [
        [
         "Energy",
         "85kcal",
         "4%"
        ],
        [
         "Carbs",
         "20g",
         "8%"
        ],
        [
         "– sugars",
         "13g",
         "14%"
        ],
        [
         "Fibre",
         "4g"
        ]
       ],
       "Standouts": [
        [
         "Vit C",
         "130mg",
         "163%"
        ],
        [
         "Vit K",
         "55mcg",
         "73%"
        ],
        [
         "Potassium",
         "430mg",
         "22%"
        ],
        [
         "Vit E",
         "2mg",
         "17%"
        ]
       ]
      }
     },
     {
      "n": "Kefir",
      "amt": "250mL (half a bottle)",
      "info": {
       "Ingredients": [
        [
         "",
         "Semi-skimmed milk, skimmed milk powder, lactic ferments, kefir grains, yeasts, vitamin D"
        ]
       ],
       "Macronutrients — per 250mL": [
        [
         "Energy",
         "110kcal",
         "6%"
        ],
        [
         "Carbs",
         "9.8g",
         "4%"
        ],
        [
         "– sugars",
         "9.8g",
         "11%"
        ],
        [
         "Protein",
         "8.5g",
         "17%"
        ],
        [
         "Fat",
         "3.8g",
         "5%"
        ],
        [
         "– saturates",
         "2.3g",
         "12%"
        ],
        [
         "Salt",
         "0.25g",
         "4%"
        ]
       ],
       "Standouts": [
        [
         "Calcium",
         "300mg",
         "38%"
        ],
        [
         "Vit D",
         "2mcg",
         "40%"
        ]
       ],
       "Changes": [
        [
         "1 Aug 2026",
         "added"
        ]
       ]
      }
     }
    ]
   },
   {
    "id": "biweekly",
    "t": "Biweekly",
    "items": [
     {
      "n": "Trout",
      "amt": "300g",
      "info": {
       "Ingredients": [
        [
         "",
         "Fresh trout with skin, cooked"
        ]
       ],
       "Macronutrients — per 300g cooked": [
        [
         "Energy",
         "500kcal",
         "25%"
        ],
        [
         "Protein",
         "72g",
         "144%"
        ],
        [
         "Fat",
         "21g",
         "30%"
        ],
        [
         "– saturates",
         "4.5g",
         "23%"
        ]
       ],
       "Standouts": [
        [
         "EPA + DHA",
         "~3g"
        ],
        [
         "Vit D",
         "~1600IU",
         "800%"
        ],
        [
         "B12",
         "~15mcg",
         "600%"
        ],
        [
         "Selenium",
         "~42mcg",
         "76%"
        ],
        [
         "Potassium",
         "~1200mg",
         "60%"
        ]
       ],
       "Changes": [
        [
         "1 Aug 2026",
         "added"
        ]
       ],
       "Notes": [
        [
         "",
         "No omega-3 supplement with this meal"
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
   "am": "critical",
   "note": "Technically a hormone rather than a vitamin. Skin makes it from UVB light, the liver converts it to the 25-OH form measured here, and the kidney activates it.\n\n25-OH is the right thing to measure because it is the storage form with a long half-life — the active form fluctuates far too quickly to be informative.\n\nIt moves over months rather than days. And daily sunscreen removes most skin synthesis, which leaves diet and supplements doing nearly all the work.",
   "axis": [
    0,
    120
   ],
   "cut": {
    "label": "Vitamin-D status and safety zones",
    "source": "NIH/NASEM vitamin D guidance",
    "zones": [
     {
      "max": 12,
      "label": "Deficient",
      "level": "out"
     },
     {
      "min": 12,
      "max": 20,
      "label": "Potentially inadequate",
      "level": "watch"
     },
     {
      "min": 20,
      "max": 50,
      "label": "Generally adequate",
      "level": "ok"
     },
     {
      "min": 50,
      "max": 60,
      "label": "Above the conservative adequacy range",
      "level": "watch"
     },
     {
      "min": 60,
      "label": "High enough to reassess dose and calcium promptly",
      "level": "out"
     }
    ]
   },
   "goal": {
    "min": 30,
    "max": 50,
    "label": "Personal vitamin-D dosing window",
    "why": "Dose-management goal while using high-dose vitamin D; not a universal longevity optimum"
   }
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
   "am": "critical",
   "note": "The hormone that keeps blood calcium constant. When calcium dips, the parathyroid glands release PTH, which pulls calcium from bone, tells the kidney to retain it, and activates vitamin D to absorb more.\n\nSo it is not really read on its own — it is read to interpret calcium and vitamin D.\n\nA raised PTH usually points at the deficiency behind it: the system is working, but working hard, and it is taking the calcium from your skeleton to do it.\n\nThere is no universal optimization band: PTH is assay-specific and is interpreted with calcium and vitamin D. A low result beside normal calcium is not automatically a deficit; the relevant pattern is an unexpected rise, or suppression paired with abnormal calcium.",
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
    "NAC 11g",
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
   "am": "useful",
   "note": "An amino acid produced as an intermediate in normal metabolism, then cleared using B12, folate and B6.\n\nSo it works as a functional test of those three: when any of them is short, homocysteine backs up. That makes it more informative than measuring the vitamins directly, since it shows whether the pathway is actually working.\n\nExceptionally sensitive to handling — it keeps rising in the tube if plasma is not separated promptly, which produces falsely high results.",
   "axis": [
    0,
    20
   ],
   "cut": {
    "label": "Conventional upper threshold",
    "source": "Laboratory and cardiovascular literature",
    "zones": [
     {
      "max": 15,
      "label": "Below the conventional upper threshold",
      "level": "ok"
     },
     {
      "min": 15,
      "label": "Elevated; confirm under standardized conditions",
      "level": "out"
     }
    ]
   }
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
   "am": "critical",
   "note": "A trace mineral built into the enzymes that regenerate the body's antioxidants, and into the enzyme that converts T4 into active T3.\n\nUnusual in having a narrow safe window — both deficiency and excess cause real harm, so more is not better here.\n\nBlood levels vary widely by region, because the amount in food depends on how much selenium is in the soil where it grew. Serum reflects recent intake more than long-term stores.",
   "axis": [
    40,
    200
   ],
   "cut": {
    "label": "Selenium status zones",
    "source": "Population status and toxicity literature",
    "zones": [
     {
      "max": 80,
      "label": "Potentially low status",
      "level": "watch"
     },
     {
      "min": 80,
      "max": 150,
      "label": "Generally sufficient",
      "level": "ok"
     },
     {
      "min": 150,
      "label": "High; review intake and assay context",
      "level": "watch"
     }
    ]
   },
   "target": {
    "min": 100,
    "max": 130,
    "evidence": "weak",
    "label": "Proposed selenium status band",
    "source": "Status associations; no outcome-defined longevity optimum"
   }
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
   "am": "critical",
   "note": "EPA and DHA expressed as a percentage of all the fatty acids in your red cell membranes.\n\nMembranes turn over slowly, so unlike a blood fatty acid level this reflects months of intake rather than the last meal — closer to an HbA1c for omega-3 status.\n\nMethod matters: the published targets belong specifically to the red-cell measurement. Plasma and whole-blood versions produce different numbers that those targets do not apply to.",
   "axis": [
    0,
    14
   ],
   "cut": {
    "label": "Omega-3 Index risk proposal",
    "source": "Harris–von Schacky Omega-3 Index framework",
    "zones": [
     {
      "max": 4,
      "label": "Proposed high-risk zone",
      "level": "out"
     },
     {
      "min": 4,
      "max": 8,
      "label": "Proposed intermediate zone",
      "level": "watch"
     },
     {
      "min": 8,
      "label": "Proposed lower-risk zone",
      "level": "ok"
     }
    ]
   },
   "target": {
    "min": 8,
    "max": 12,
    "evidence": "weak",
    "label": "Proposed lower-risk Omega-3 Index band",
    "source": "Observational Omega-3 Index framework, not an RCT-defined optimum"
   }
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
   "am": "useful",
   "note": "The protein that stores iron inside cells, and the best single estimate of total body iron stores.\n\nWith one large caveat: ferritin is also an acute-phase protein, meaning inflammation raises it regardless of iron. So a high ferritin has two very different explanations.\n\nThe way to tell them apart is the rest of the panel — genuine iron loading raises transferrin saturation too, while inflammation leaves saturation normal or low.",
   "axis": [
    0,
    300
   ],
   "cut": {
    "label": "Iron-deficiency threshold",
    "source": "Clinical iron-deficiency guidance",
    "zones": [
     {
      "max": 30,
      "label": "Consistent with depleted iron stores in this context",
      "level": "out"
     },
     {
      "min": 30,
      "label": "Above the deficiency threshold; interpret higher values with inflammation",
      "level": "ok"
     }
    ]
   }
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
   "am": "critical",
   "note": "An essential trace mineral used in iron transport, connective tissue formation and antioxidant enzymes.\n\nRead against zinc rather than alone, because the two compete for the same intestinal transporter — sustained zinc supplementation is a well-recognised cause of copper deficiency.\n\nCopper also rises with inflammation and with oestrogen, which complicates a high result.",
   "axis": [
    40,
    180
   ]
  },
  {
   "id": "ceru",
   "cat": "vitmin",
   "en": "Ceruloplasmin",
   "fr": "Céruloplasmine",
   "us": "mg/dL",
   "units": [
    {
     "l": "g/L",
     "m": 100
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
   "am": "critical",
   "note": "The protein that carries copper. Around 90% of the copper in serum is bound to it, so the two are read together or not at all.\n\nThat is the whole point of ordering it beside copper: a low copper has two different explanations — too little copper, or too little of the protein carrying it — and the copper number alone cannot separate them.\n\nCAVEAT: it is an ACUTE-PHASE PROTEIN. Inflammation, infection, pregnancy and oestrogen all raise it, and a rise can hide a real copper deficiency underneath. Read it against CRP; with an hs-CRP under 0.6 that confounder is effectively off the table here.\n\nThe interval is Cavalli et al., J Appl Lab Med 2024 — 1,706 healthy Italian donors on a Roche Cobas immunoturbidimetric assay, the same platform family this panel's chemistry comes from. It is SEX-SPECIFIC and narrower than the 20-60 mg/dL textbook figure: males 25-65 run 14-26 mg/dL, females almost double at the top. Beware an enzymatic (oxidase-activity) assay, which does not read the same as an immunoassay.",
   "axis": [
    8,
    45
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
   "am": "useful",
   "note": "A vitamin needed to build red blood cells and to maintain the myelin sheath around nerves. Only bacteria make it, so dietary sources are animal foods.\n\nThe liver stores years' worth, which is why deficiency develops slowly and silently.\n\nMeasurement caveat: serum B12 counts total B12, but most of it is bound to a protein that cannot deliver it to cells. So the result can read normal in genuine deficiency — methylmalonic acid settles the ambiguous cases.",
   "axis": [
    100,
    1000
   ],
   "cut": {
    "label": "B12 interpretation zones",
    "source": "NIH vitamin B12 guidance",
    "zones": [
     {
      "max": 200,
      "label": "Deficient range",
      "level": "out"
     },
     {
      "min": 200,
      "max": 400,
      "label": "Indeterminate; MMA may add value",
      "level": "watch"
     },
     {
      "min": 400,
      "label": "Deficiency less likely",
      "level": "ok"
     }
    ]
   }
  },
  {
   "id": "mma",
   "cat": "vitmin",
   "dec": [
    "B-complex (methylfolate)",
    "Huel"
   ],
   "en": "MMA (methylmalonic acid)",
   "fr": "Acide méthylmalonique (MMA)",
   "us": "nmol/L",
   "units": [
    {
     "l": "µmol/L",
     "m": 1000
    },
    {
     "l": "nmol/L",
     "m": 1
    }
   ],
   "am": "critical",
   "note": "A B12 checkpoint one step downstream of B12 itself. Converting methylmalonyl-CoA needs B12; without enough, methylmalonic acid backs up and spills into blood.\n\nIt answers what serum B12 cannot. B12 measures how much is in the blood, not how much is working inside cells, and it can read normal in real deficiency. MMA is the functional readout.\n\nIt also breaks a tie homocysteine cannot: folate, B12 and B6 ALL raise homocysteine, but only B12 raises MMA. High both means B12; high homocysteine with a normal MMA means folate or methylation, and B12 would do nothing for it.\n\nCAVEAT: the kidney clears it. NHANES found the highest creatinine quartile running about 43% above the lowest, and that is most of why MMA drifts up with age — so read it beside eGFR, and prefer cystatin C here for the same reason the kidney rows do.\n\nThe decision cut uses 271 nmol/L, the NIH fact sheet’s commonly used functional threshold; laboratories use method-specific upper limits, so a result near it is interpreted with B12 and kidney filtration rather than as a stand-alone diagnosis. There is no clinical concern at the low end. For placement, NHANES adults aged 18-40 (n=6,103, GC/MS) run a median of 119 nmol/L, with the 5th at 69 and the 95th at 249.",
   "axis": [
    0,
    500
   ],
   "cut": {
    "label": "Functional B12 threshold",
    "source": "NIH vitamin B12 guidance",
    "zones": [
     {
      "max": 271,
      "label": "Below the commonly used functional threshold",
      "level": "ok"
     },
     {
      "min": 271,
      "label": "Elevated; interpret with kidney filtration",
      "level": "watch"
     }
    ]
   }
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
   "am": "useful",
   "note": "A B vitamin required for DNA synthesis and red cell production, working in the same pathway as B12.\n\nThe reason they are read together is a specific trap: folate can correct the anaemia of B12 deficiency while doing nothing for the nerve damage, which then progresses unnoticed and can become permanent.\n\nSerum folate reflects the last few days of intake; red cell folate reflects months of stores.",
   "axis": [
    0,
    20
   ],
   "cut": {
    "label": "Folate deficiency threshold",
    "source": "Clinical folate guidance",
    "zones": [
     {
      "max": 3,
      "label": "Deficient range",
      "level": "out"
     },
     {
      "min": 3,
      "label": "Above the deficiency threshold",
      "level": "ok"
     }
    ]
   }
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
   "am": "critical",
   "note": "Pyridoxal-5-phosphate, the active form of vitamin B6 — the coenzyme for well over a hundred enzymes, most of them handling amino acids.\n\nIt is the third input to homocysteine clearance, and the one that works differently from the other two. Folate and B12 recycle homocysteine back into methionine; B6 runs the other exit, breaking it down to cysteine for good.\n\nSo a homocysteine that will not fall on folate alone often needs this one looked at.\n\nMeasure PLP, not \"vitamin B6\": the plain assay counts inactive forms as well and can read normal on a genuine deficiency. It also falls with inflammation independently of intake.",
   "axis": [
    0,
    180
   ],
   "cut": {
    "label": "PLP sufficiency threshold",
    "source": "NIH vitamin B6 guidance",
    "zones": [
     {
      "max": 20,
      "label": "Low PLP status",
      "level": "out"
     },
     {
      "min": 20,
      "label": "Sufficient by the conventional threshold",
      "level": "ok"
     }
    ]
   }
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
   "am": "critical",
   "note": "An estimate of how fast the kidneys are filtering blood, in millilitres per minute.\n\nIt is not measured. It is calculated from creatinine, age and sex — so every creatinine confound flows straight into it, including muscle mass and creatine use. A creatinine artificially raised by supplements produces an eGFR artificially low, with no kidney problem anywhere.\n\nWhich equation the lab used also changes the number, so the method matters as much as the value.\n\nNO OPTIMIZATION TARGET, DELIBERATELY. This is the CREATININE equation, and creatinine is a muscle breakdown product: muscle mass raises it and creatine supplementation raises it further, without either touching the kidney. A floor of 90 previously manufactured a deficit here — 83.4 read as a gap while the same draw's cystatin C gave 116. KDIGO categories are shown as decision zones, but 60–89 is not CKD without other evidence of kidney damage. Read this row beside cystatin C and treat a DIVERGENCE as the finding, not the lower number.",
   "axis": [
    40,
    140
   ],
   "cut": {
    "label": "KDIGO GFR categories",
    "source": "KDIGO 2024 CKD guideline",
    "zones": [
     {
      "max": 60,
      "label": "G3 or lower if persistent; confirm and interpret with kidney-damage markers",
      "level": "out"
     },
     {
      "min": 60,
      "max": 90,
      "label": "G2; not CKD without other evidence of kidney damage",
      "level": "ok"
     },
     {
      "min": 90,
      "label": "G1 filtration category",
      "level": "ok"
     }
    ]
   }
  },
  {
   "id": "urea",
   "cat": "renal",
   "dec": [
    "Creatine 5g",
    "Glycine 8g + taurine + collagen"
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
   "note": "Fat circulating in the blood, carried mainly on VLDL particles.\n\nLess a direct cardiovascular target than a window onto metabolic health — high triglycerides usually travel with insulin resistance, and that is the thing worth acting on.\n\nExtremely responsive to what you did recently: the last meal, and alcohol in particular, move it a lot. A non-fasted sample is close to uninterpretable, and even a fasted one reflects the previous evening.",
   "axis": [
    0,
    200
   ],
   "cut": {
    "label": "Fasting triglyceride thresholds",
    "source": "Cardiovascular prevention guidance",
    "zones": [
     {
      "max": 150,
      "label": "Below the conventional high threshold",
      "level": "ok"
     },
     {
      "min": 150,
      "max": 500,
      "label": "High; confirm fasting context and metabolic drivers",
      "level": "watch"
     },
     {
      "min": 500,
      "label": "Very high; pancreatitis-relevant range",
      "level": "out"
     }
    ]
   },
   "target": {
    "max": 100,
    "evidence": "moderate",
    "label": "Favourable fasting triglycerides",
    "source": "Cardiometabolic risk associations and prevention guidance"
   }
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
   "am": "useful",
   "note": "A protein that sits on every particle capable of lodging in an artery wall — LDL, VLDL and Lp(a) — exactly one copy each.\n\nSo ApoB counts the particles directly, rather than measuring the cholesterol they happen to be carrying. That matters when the two disagree: two people with identical LDL can carry very different particle numbers, and the particle count is what tracks risk.\n\nIt is also immune to the triglyceride level that distorts calculated LDL.",
   "axis": [
    0,
    160
   ],
   "cut": {
    "label": "ApoB risk threshold",
    "source": "2018 AHA/ACC multisociety cholesterol guideline, risk-enhancing factors",
    "zones": [
     {
      "max": 130,
      "label": "Below the risk-enhancer threshold",
      "level": "ok"
     },
     {
      "min": 130,
      "label": "Risk-enhancing concentration",
      "level": "out"
     }
    ]
   },
   "target": {
    "max": 90,
    "evidence": "moderate",
    "label": "Favourable primary-prevention particle burden",
    "source": "ApoB risk gradients and prevention guidance"
   },
   "goal": {
    "max": 85,
    "label": "Next-draw diet-response criterion",
    "why": "A reduction of at least 10% from the July 94 mg/dL baseline would support the August diet change"
   }
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
    }
   ],
   "am": "critical",
   "note": "An LDL particle with an extra protein wrapped around it, which makes it stickier in artery walls and resistant to clearing. An independent cardiovascular risk factor.\n\nAlmost entirely inherited, and essentially fixed for life — so unlike LDL it is not something you move. One good measurement settles it, which is why it is usually checked once.\n\nUNITS: THIS MARKER ACCEPTS nmol/L ONLY, AND THE OMISSION IS DELIBERATE. Laboratories also report Lp(a) as mass in mg/dL, and the two do NOT convert. The apo(a) protein carries a variable number of kringle repeats, so particles differ in size between people: the same mass can be a very different particle count, and the commonly quoted 2.0-2.5 factor is a population average that can be wrong by 40% in one person. ESC/EAS say not to convert, which is why no mg/dL entry exists here — the file used to carry a fixed 2.15 multiplier that would have silently manufactured a confident number.\n\nIf a report ever prints mg/dL, audit() will refuse it because the unit is not in units[]. That is the correct outcome: STOP, and either re-order in nmol/L or give mass its own marker, the way calculated and dialysed free testosterone are split.",
   "axis": [
    0,
    150
   ],
   "cut": {
    "label": "Lp(a) risk zones",
    "source": "ESC/EAS prevention guidance",
    "zones": [
     {
      "max": 75,
      "label": "Low concentration",
      "level": "ok"
     },
     {
      "min": 75,
      "max": 105,
      "label": "Intermediate concentration",
      "level": "watch"
     },
     {
      "min": 105,
      "label": "Risk-enhancing concentration",
      "level": "out"
     }
    ]
   }
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
   "note": "Total cholesterol minus HDL — in other words, all the cholesterol on particles that can lodge in an artery wall, in one number.\n\nTwo practical advantages over LDL: it needs no calculation beyond a subtraction, so it avoids the formula that makes calculated LDL unreliable, and it stays valid when you have not fasted.\n\nIt also captures remnant particles that LDL alone misses.",
   "axis": [
    0,
    200
   ],
   "cut": {
    "label": "Non-HDL risk threshold",
    "source": "Cardiovascular prevention guidance",
    "zones": [
     {
      "max": 160,
      "label": "Below the conventional high threshold",
      "level": "ok"
     },
     {
      "min": 160,
      "label": "High concentration",
      "level": "out"
     }
    ]
   },
   "target": {
    "max": 130,
    "evidence": "moderate",
    "label": "Favourable atherogenic cholesterol burden",
    "source": "Cardiovascular prevention guidance"
   }
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
   "am": "critical",
   "note": "A protein the liver releases whenever there is inflammation anywhere in the body. The high-sensitivity version resolves the low range where cardiovascular risk sits, rather than the high range used to detect infection.\n\nCompletely non-specific. A cold, a cut, a dental problem, or a hard training session in the days before the draw all raise it.\n\nSo a single high value means repeat it, not conclude something. Only a persistently raised hs-CRP with no obvious cause is a finding.",
   "axis": [
    0,
    6
   ],
   "cut": {
    "label": "hs-CRP cardiovascular risk categories",
    "source": "CDC/AHA risk categories and prevention guidance",
    "zones": [
     {
      "max": 1,
      "label": "Low-risk category",
      "level": "ok"
     },
     {
      "min": 1,
      "max": 3,
      "label": "Average-risk category; interpret illness and training first",
      "level": "watch"
     },
     {
      "min": 3,
      "label": "High category; repeat when well before interpretation",
      "level": "out"
     }
    ]
   },
   "target": {
    "max": 1,
    "evidence": "moderate",
    "label": "Low inflammatory-risk category",
    "source": "Prospective cardiovascular cohorts; non-specific marker"
   }
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
   "am": "critical",
   "note": "The cholesterol carried on LDL particles, and the main target of lipid treatment.\n\nUsually not measured. Most labs calculate it from total cholesterol, HDL and triglycerides using a formula that assumes a fixed relationship between them. That assumption breaks down in the two places it matters most:\n\n• When LDL is low, the estimate drifts\n• When triglycerides are high, it under-reports\n\nWorth knowing whether a given result was measured directly or calculated.",
   "axis": [
    0,
    190
   ],
   "cut": {
    "label": "LDL-C risk thresholds",
    "source": "Cardiovascular prevention guidance",
    "zones": [
     {
      "max": 130,
      "label": "Below the conventional high threshold",
      "level": "ok"
     },
     {
      "min": 130,
      "max": 190,
      "label": "High; interpret against total risk and ApoB",
      "level": "watch"
     },
     {
      "min": 190,
      "label": "Severely elevated concentration",
      "level": "out"
     }
    ]
   },
   "target": {
    "max": 100,
    "evidence": "moderate",
    "label": "Favourable primary-prevention LDL-C",
    "source": "LDL causal evidence interpreted in a low-risk primary-prevention context"
   }
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
   "note": "Cholesterol on HDL particles, long described as the 'good' cholesterol because higher levels track with lower risk in population studies.\n\nThat description has not survived testing. Drugs that raise HDL do not reduce heart attacks, and genetic variants that raise it lifelong do not protect — so the association appears to be a marker of something else, not a cause.\n\nVery high values are also associated with higher mortality, not lower. Which is why there is deliberately no target here.",
   "axis": [
    20,
    110
   ],
   "cut": {
    "label": "Low HDL-C threshold",
    "source": "Cardiovascular risk definitions",
    "zones": [
     {
      "max": 40,
      "label": "Low HDL-C",
      "level": "out"
     },
     {
      "min": 40,
      "label": "Not low; higher is not treated as an intervention target",
      "level": "ok"
     }
    ]
   }
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
   "note": "Every cholesterol molecule in the blood, across all particle types.\n\nKept mostly out of convention and as the input to non-HDL. On its own it is close to uninformative, because it adds together particles that raise risk and particles that do not.\n\nA perfectly normal total can conceal a high LDL that happens to be offset by a high HDL.",
   "axis": [
    100,
    280
   ],
   "cut": {
    "label": "Total-cholesterol categories",
    "source": "Conventional cardiovascular risk categories",
    "zones": [
     {
      "max": 200,
      "label": "Desirable category",
      "level": "ok"
     },
     {
      "min": 200,
      "max": 240,
      "label": "Borderline-high category",
      "level": "watch"
     },
     {
      "min": 240,
      "label": "High category",
      "level": "out"
     }
    ]
   }
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
   "note": "Blood sugar after an overnight fast — the simplest screen for how well glucose is regulated.\n\nIts weakness is timing: fasting glucose is the last thing to move as regulation deteriorates. The body will hold it normal for years by producing more insulin, so it can look fine well after the underlying problem has started.\n\nAlso a single snapshot, shifted by the previous evening's meal, poor sleep and stress. HbA1c answers the same question with far less noise.",
   "axis": [
    60,
    130
   ],
   "cut": {
    "label": "Fasting-glucose diagnostic zones",
    "source": "ADA diagnostic criteria",
    "zones": [
     {
      "max": 70,
      "label": "Low fasting glucose",
      "level": "out"
     },
     {
      "min": 70,
      "max": 100,
      "label": "Normal fasting glucose",
      "level": "ok"
     },
     {
      "min": 100,
      "max": 126,
      "label": "Impaired fasting glucose; confirm",
      "level": "watch"
     },
     {
      "min": 126,
      "label": "Diabetes-range result; requires confirmation",
      "level": "out"
     }
    ]
   },
   "target": {
    "min": 80,
    "max": 94,
    "evidence": "moderate",
    "label": "Favourable fasting-glucose band",
    "source": "Observational glycaemic-risk data; not an RCT-defined longevity optimum"
   }
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
   "am": "useful",
   "note": "A snapshot of the past three months rather than this morning. Glucose slowly sticks to haemoglobin inside red cells, and since a red cell lives about 120 days, the fraction that is coated reflects average blood sugar over that window — weighted toward the most recent weeks.\n\nThe main trap: anything that shortens red cell lifespan gives glucose less time to attach, so the result understates true average sugar. It is only as reliable as the blood count sitting next to it.",
   "axis": [
    4,
    7
   ],
   "cut": {
    "label": "HbA1c diagnostic zones",
    "source": "ADA diagnostic criteria",
    "zones": [
     {
      "max": 5.7,
      "label": "Below the prediabetes threshold",
      "level": "ok"
     },
     {
      "min": 5.7,
      "max": 6.5,
      "label": "Prediabetes range; confirm context",
      "level": "watch"
     },
     {
      "min": 6.5,
      "label": "Diabetes-range result; requires confirmation",
      "level": "out"
     }
    ]
   },
   "target": {
    "min": 5,
    "max": 5.4,
    "evidence": "moderate",
    "label": "Favourable HbA1c band",
    "source": "Observational glycaemic-risk data; interpret with red-cell turnover"
   }
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
    "NAC 11g"
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
   "am": "useful",
   "note": "An enzyme that lives inside liver cells. When those cells are damaged it leaks into the blood, so a rise means liver injury.\n\nIt is the more liver-specific of the two transaminases — which is precisely what makes the pair useful together. AST is also abundant in muscle; ALT largely is not. So if AST climbs and ALT stays put, the source is muscle rather than liver.",
   "axis": [
    0,
    70
   ],
   "cut": {
    "label": "Healthy-population ALT threshold",
    "source": "Outcome-based healthy male upper-limit literature",
    "zones": [
     {
      "max": 33,
      "label": "Below the healthy-population upper threshold",
      "level": "ok"
     },
     {
      "min": 33,
      "label": "Above the healthy-population threshold; training and assay context matter",
      "level": "watch"
     }
    ]
   }
  },
  {
   "id": "ast",
   "cat": "liver",
   "dec": [
    "Curcumin",
    "NAC 11g"
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
   "reference": {
    "min": 264,
    "max": 916,
    "evidence": "strong",
    "label": "Harmonized healthy-population interval",
    "source": "Travison et al. / Endocrine Society harmonized testosterone reference",
    "population": "Non-obese European and American men aged 19–39",
    "method": "Apply only to assays appropriately calibrated to the CDC reference method; this is population context, not a longevity target",
    "reviewed": "2026-07-29"
   },
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
   "am": "critical",
   "note": "The small slice of testosterone not bound to SHBG or albumin — the portion actually free to enter cells and act.\n\nThis is not measured here. It is calculated from total testosterone, SHBG and albumin using the Vermeulen equation, so it inherits the measurement quirks of all three. That is still the better option: direct free-testosterone immunoassays are notoriously unreliable.\n\nTHE INTERVAL IS THE PRIMARY PUBLISHED ONE. Ho et al., Ann Clin Biochem 2006;43:389-397: 245-785 pmol/L, the 2.5th to 97.5th percentile of the Vermeulen calculation in 126 healthy men aged 20-45 with normal semen analysis — the closest population match available. Laboratories quoting this paper round it slightly (Alfred Health prints 260-740); nearby intervals sit close (Dynacare 196-636 for men under 50, 218-681 for men 20-50).\n\nIt replaced 47-244 pg/mL, which had no source. That range was well CENTRED — its midpoint was within 2% of this one — but a third wider, and almost all of the slack was at the bottom: a floor of 163 pmol/L against a real 2.5th percentile of 245. Too permissive at the only end that matters, so a genuinely low value would have read normal.\n\nMIND THE OTHER SCALE. The dialysis interval on the ftd row (Jasuja 2023, 120-368 pg/mL for men 19-39) is NOT comparable. Vermeulen overestimates dialysis by 20-30%, median ratio 1.19 (Fiers, JCEM 2018), so that band maps onto this scale at roughly 495-1518 pmol/L: OFFSET UPWARD, but overlapping — 495-785 pmol/L is common to both, a little over half this interval's width. The two disagree about the bottom of the range, not about everything, and they disagree by more than the 1.19 bias explains because population and SHBG assay differ too. Judge a calculated value against a calculated interval. The July value, 354 pmol/L, falls exactly in the disputed zone: inside this interval, under the mapped dialysis floor.\n\nNO OPTIMIZATION TARGET. A previous 100–200 pg/mL band was unsourced and was deciding how the only datapoint read. Calculated free testosterone should be interpreted against a method-matched reference and symptoms, not a longevity target.",
   "axis": [
    40,
    280
   ]
  },
  {
   "id": "ftd",
   "cat": "horm",
   "dec": [
    "Boron 10mg",
    "Finasteride (topical) 0.1% - 1mL"
   ],
   "en": "Free testosterone (dialysis)",
   "fr": "Testostérone libre (dialyse à l'équilibre)",
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
   "am": "critical",
   "note": "Free testosterone MEASURED, not calculated — the reference method.\n\nSerum sits against a membrane that holds back albumin and SHBG but not testosterone. After 16 hours at 37 degrees the hormone that crossed IS the free fraction, by definition rather than by inference, and the dialysate is read by mass spectrometry.\n\nIT IS A SEPARATE ROW FROM CALCULATED FREE TESTOSTERONE ON PURPOSE. The two are different scales: Vermeulen overestimates dialysis by 20-30%, median ratio 1.19 (Fiers, JCEM 2018). Sharing one row would put a measurement and an estimate on one line and judge both against one interval, which is the same error that keeps the 2023 direct-RIA value out of this file. Creatinine-eGFR and cystatin-C-eGFR are split for the identical reason.\n\nThe interval here is Jasuja 2023 (Andrology), standardised equilibrium dialysis with CDC-certified LC-MS/MS: 120-368 pg/mL for men aged 19-39, against 66-309 across all healthy non-obese men. The age band is used because it is the one that applies. Median for ages 19–39 is 190 pg/mL. The study’s 10th–90th percentile is descriptive, not an outcome-backed optimization target, so it is no longer rendered as one.\n\nOrder it whenever a laboratory actually offers it — availability is the constraint, not a quota. A single paired draw gives the DIRECTION and rough size of the gap between measurement and calculation in this person, on those assays, on that day. It is not a calibration constant: one point carries the error of both methods, the offset depends on the total-testosterone and SHBG assays behind it, and this file has already watched a laboratory change technique mid-series and print 'rupture des anteriorites' over it. REPEATS ARE THE POINT, not redundancy: one pairing is an anecdote, several are a spread, and the spread is what says whether an offset can be trusted at all. Always draw it beside the same sample's total testosterone, SHBG and albumin — a dialysis value with no calculation next to it teaches nothing about the calculation.",
   "axis": [
    40,
    400
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
   "am": "critical",
   "note": "A liver-made protein that grips testosterone and carries it through the blood. Bound testosterone cannot enter cells, so SHBG effectively decides how much of your total is usable.\n\nThat makes it necessary rather than optional: the same total testosterone means different things at high and low SHBG.\n\nIt also reports on metabolic health — it rises with thyroid hormone and falls with insulin resistance and higher body fat.\n\nNO OPTIMAL BAND, DELIBERATELY. It was 20-45, which read 46 as too high. SHBG is not a lever, it is a CONSEQUENCE: low body fat, insulin sensitivity, high fibre and thyroid status all raise it. This subject's HOMA-IR is 0.91 and body fat about 12%, so a high-normal SHBG is what those look like from another angle — targeting it downward means asking for the metabolic state to be worse. It still matters as a READING, because it is what puts calculated free testosterone in the lower third of its band; it is just not something to move on its own.",
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
   "am": "critical",
   "note": "A pituitary hormone best known for lactation, but relevant here because when it is persistently high it suppresses testosterone.\n\nWorth checking once in anyone with unexplained low testosterone, since a small prolactin-secreting pituitary tumour is both a real cause and a treatable one.\n\nTwo things inflate it harmlessly: stress and sleep, and macroprolactin — a bulky bound form the body cannot use, which some labs count in the total unless they screen for it.\n\nUNITS: the mUI/L conversion (x0.0472, i.e. 1 ng/mL = 21.2 mIU/L) is tied to WHO IS 84/500, not to physics. A laboratory calibrated to a different standard will not match it — check the report before trusting a converted value.",
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
   "reference": {
    "min": 145,
    "max": 348,
    "evidence": "strong",
    "label": "NORIP healthy-adult male interval",
    "source": "NORIP multicentre Nordic adult haematology study (Nordin et al., 2004)",
    "population": "Healthy Nordic men aged 18–90",
    "method": "Automated haematology analyzers across 60 laboratories using dry dipotassium-EDTA samples; population context, not a treatment target",
    "reviewed": "2026-07-29"
   },
   "note": "Cell fragments that form the first plug at a bleeding site — the beginning of a clot.\n\nTracked for bleeding and clotting risk, and as a general check on bone marrow output.\n\nOne common artefact: in some people platelets clump together inside the collection tube. The analyser counts a clump as one platelet, so the result comes back falsely low. If a low count appears out of nowhere in someone with no symptoms, this is the first thing to rule out.\n\nNO OPTIMAL BAND, DELIBERATELY. It was 180-350, which pointed UPWARD — against the direction three items in this stack are meant to push. Omega-3, curcumin and AGE garlic all reduce platelet count or aggregation, and they are linked to this marker for that reason. Within the reference range a higher count carries more thrombotic risk, not less, so there is nothing here to raise and no benign way to raise it: the agents that work (thrombopoietin receptor agonists) treat immune thrombocytopenia and carry thrombosis and marrow-fibrosis risk.\n\nThis subject sits at 148-172 across six draws from 2020 to 2026 — a stable set point with no trend, alongside a normal red series, which is what separates a set point from a signal. The MPV explains it: 11.7-12.1, meaning fewer but larger platelets, so total platelet mass is nearer normal than the count alone suggests.\n\nWhat would change the reading: a downward TREND, several cell lines falling together, or symptoms — easy bruising, petechiae, prolonged bleeding. A single low-normal count with none of those is not a finding.",
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
   "reference": {
    "min": 13.4,
    "max": 17,
    "evidence": "strong",
    "label": "NORIP healthy-adult male interval",
    "source": "NORIP multicentre Nordic adult haematology study (Nordin et al., 2004)",
    "population": "Healthy Nordic men aged 18–90",
    "method": "Automated haematology analyzers across 60 laboratories using dry dipotassium-EDTA samples; population context, not a treatment target",
    "reviewed": "2026-07-29"
   },
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
   "reference": {
    "min": 39.5,
    "max": 50,
    "evidence": "strong",
    "label": "NORIP healthy-adult male interval",
    "source": "NORIP multicentre Nordic adult haematology study (Nordin et al., 2004)",
    "population": "Healthy Nordic men aged 18–90",
    "method": "Automated haematology analyzers across 60 laboratories using dry dipotassium-EDTA samples; population context, not a treatment target",
    "reviewed": "2026-07-29"
   },
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
   "reference": {
    "min": 4.25,
    "max": 5.71,
    "evidence": "strong",
    "label": "NORIP healthy-adult male interval",
    "source": "NORIP multicentre Nordic adult haematology study (Nordin et al., 2004)",
    "population": "Healthy Nordic men aged 18–90",
    "method": "Automated haematology analyzers across 60 laboratories using dry dipotassium-EDTA samples; population context, not a treatment target",
    "reviewed": "2026-07-29"
   },
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
   "reference": {
    "min": 82,
    "max": 98,
    "evidence": "strong",
    "label": "NORIP healthy-adult interval",
    "source": "NORIP multicentre Nordic adult haematology study (Nordin et al., 2004)",
    "population": "Healthy Nordic adults aged 18–90",
    "method": "Automated haematology analyzers across 60 laboratories using dry dipotassium-EDTA samples; population context, not a treatment target",
    "reviewed": "2026-07-29"
   },
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
   "reference": {
    "min": 27.1,
    "max": 33.3,
    "evidence": "strong",
    "label": "NORIP healthy-adult interval",
    "source": "NORIP multicentre Nordic adult haematology study (Nordin et al., 2004)",
    "population": "Healthy Nordic adults aged 18–90",
    "method": "Automated haematology analyzers across 60 laboratories using dry dipotassium-EDTA samples; population context, not a treatment target",
    "reviewed": "2026-07-29"
   },
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
   "reference": {
    "min": 31.7,
    "max": 35.7,
    "evidence": "strong",
    "label": "NORIP healthy-adult interval",
    "source": "NORIP multicentre Nordic adult haematology study (Nordin et al., 2004)",
    "population": "Healthy Nordic adults aged 18–90",
    "method": "Automated haematology analyzers across 60 laboratories using dry dipotassium-EDTA samples; population context, not a treatment target",
    "reviewed": "2026-07-29"
   },
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
   "reference": {
    "min": 11,
    "max": 14,
    "evidence": "moderate",
    "label": "Pathology Harmony adult interval",
    "source": "UK Pathology Harmony Phase II interval, locally verified by Manchester University NHS Foundation Trust (2024)",
    "population": "Adults aged 18 years and older",
    "method": "Automated full blood count; RDW remains analyzer-dependent, so preserve method continuity and inspect each draw's printed lab interval",
    "reviewed": "2026-07-29"
   },
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
   "reference": {
    "min": 3.5,
    "max": 8.8,
    "evidence": "strong",
    "label": "NORIP healthy-adult interval",
    "source": "NORIP multicentre Nordic adult haematology study (Nordin et al., 2004)",
    "population": "Healthy Nordic adults aged 18–90",
    "method": "Automated haematology analyzers using dry dipotassium-EDTA; fasting, smoking, recent exertion and ancestry can shift the count",
    "reviewed": "2026-07-29"
   },
   "note": "The total number of immune cells in circulation. A broad screen for infection, inflammation and bone-marrow function.\n\nThe total by itself is fairly blunt — nearly all the information is in the breakdown below it, since a high count from neutrophils means something very different from a high count from lymphocytes.\n\nRises briefly with acute stress, adrenaline, and recent hard exercise, none of which involve illness.\n\nNO OPTIMAL BAND, DELIBERATELY. It was 4.5-8.5, pointing upward. A white count in the lower half of normal is unremarkable in lean, heavily trained people, and WBC doubles as an inflammation marker — within the reference range the lower end tends to track with LOWER risk, not higher. So the band was asking for a number to rise that there is no reason to raise and no benign way to raise. What matters is a TREND, or a fall alongside the other cell lines; a single low-normal count with a normal red series is not a finding.",
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
   "reference": {
    "min": 1800,
    "max": 7500,
    "evidence": "moderate",
    "label": "Pathology Harmony adult interval",
    "source": "UK Pathology Harmony Phase II interval, locally verified by Manchester University NHS Foundation Trust (2024)",
    "population": "Adults aged 18 years and older; absolute neutrophil count",
    "method": "Automated full blood count; infection, exertion, smoking and ancestry—including Duffy-null status—can shift the count",
    "reviewed": "2026-07-29"
   },
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
   "reference": {
    "min": 1000,
    "max": 4000,
    "evidence": "moderate",
    "label": "Pathology Harmony adult interval",
    "source": "UK Pathology Harmony Phase II interval, locally verified by Manchester University NHS Foundation Trust (2024)",
    "population": "Adults aged 18 years and older; absolute lymphocyte count",
    "method": "Automated full blood count; acute illness, collection time, stress and corticosteroid exposure can shift the count",
    "reviewed": "2026-07-29"
   },
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
   "reference": {
    "min": 200,
    "max": 1000,
    "evidence": "moderate",
    "label": "Pathology Harmony adult interval",
    "source": "UK Pathology Harmony Phase II interval, locally verified by Manchester University NHS Foundation Trust (2024)",
    "population": "Adults aged 18 years and older; absolute monocyte count",
    "method": "Automated full blood count; interpret persistent changes with the rest of the differential and each draw's printed lab interval",
    "reviewed": "2026-07-29"
   },
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
   "reference": {
    "min": 0,
    "max": 400,
    "evidence": "moderate",
    "label": "Pathology Harmony adult interval",
    "source": "UK Pathology Harmony Phase II interval, locally verified by Manchester University NHS Foundation Trust (2024)",
    "population": "Adults aged 18 years and older; absolute eosinophil count",
    "method": "Automated full blood count; allergy, parasites, medicines and collection timing can shift the count",
    "reviewed": "2026-07-29"
   },
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
   "am": "useful",
   "note": "The antibody class evolved to fight parasites, which in wealthy countries mostly ends up doing allergy instead. It sits on the surface of mast cells, and when its target binds, the cell dumps histamine.\n\nTotal IgE adds every specificity together, so it says you react to something without saying what. It rises with hay fever, asthma, eczema and food allergy — and much further with parasites, or with an allergic reaction to a mould growing in the airways.\n\nA normal total does not rule allergy out: one strong sensitivity can hide inside a normal sum. Specific IgE against named allergens is what actually answers the question.\n\nUNITS: the ng/mL conversion (x0.4167, i.e. 1 IU/mL = 2.4 ng/mL) is a WHO convention, not physics. kUI/L and UI/mL are the same quantity. Both values in this file were printed in UI/mL, so the conversion has never been exercised.",
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
   "reference": {
    "min": 0,
    "max": 100,
    "evidence": "moderate",
    "label": "Pathology Harmony adult interval",
    "source": "UK Pathology Harmony Phase II interval, locally verified by Manchester University NHS Foundation Trust (2024)",
    "population": "Adults aged 18 years and older; absolute basophil count",
    "method": "Automated full blood count; very low event counts make isolated movements imprecise",
    "reviewed": "2026-07-29"
   },
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
   "am": "useful",
   "note": "Serum iron divided by total capacity — the percentage of your iron transport that is actually loaded.\n\nThe most useful single number in the iron panel, because it reflects iron that is available right now rather than stored or potential.\n\nIt is also what separates true iron deficiency from the low iron of inflammation, where ferritin alone is ambiguous.\n\nInherits serum iron's daily swing, so time of draw affects it.",
   "axis": [
    0,
    60
   ],
   "cut": {
    "label": "Transferrin-saturation zones",
    "source": "Clinical iron-status guidance",
    "zones": [
     {
      "max": 20,
      "label": "Low iron availability",
      "level": "out"
     },
     {
      "min": 20,
      "max": 45,
      "label": "Within the usual interval",
      "level": "ok"
     },
     {
      "min": 45,
      "max": 50,
      "label": "High-normal; confirm fasting iron context",
      "level": "watch"
     },
     {
      "min": 50,
      "label": "Elevated; confirm before work-up",
      "level": "out"
     }
    ]
   }
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
   "note": "The main negative ion outside cells, and the counterweight that keeps blood electrically neutral as sodium comes and goes.\n\nIt tracks sodium almost perfectly, which is why on its own it adds very little.\n\nIts value is in the gap between the two. Chloride that moves independently of sodium points at an acid–base problem rather than a water one — it climbs when bicarbonate is being lost, and falls with prolonged vomiting or with diuretics.",
   "axis": [
    90,
    115
   ]
  },
  {
   "id": "hco3",
   "cat": "other",
   "en": "Bicarbonate",
   "fr": "Bicarbonates (CO₂ total)",
   "us": "mmol/L",
   "units": [
    {
     "l": "mmol/L",
     "m": 1
    },
    {
     "l": "mEq/L",
     "m": 1
    }
   ],
   "am": "useful",
   "note": "The blood's main buffer, and the number that reports your acid-base balance. The kidneys make and retain it; the lungs adjust CO₂ to match.\n\nLow means acid is accumulating or bicarbonate is being lost. High means the reverse — usually vomiting or diuretics.\n\nThe version that matters here is the slow one. A diet heavy in animal protein and dairy generates a daily acid load, and the body buffers part of it out of bone and muscle. That shows up as a bicarbonate sitting at the low end of normal, not as anything dramatic.\n\nIt is also fragile: CO₂ escapes from a tube left open, so a delayed sample reads falsely low. Repeat before believing one low value.",
   "axis": [
    15,
    35
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
   "am": "critical",
   "note": "The messenger through which growth hormone actually works. GH itself is released in short pulses and is nearly impossible to measure meaningfully; it tells the liver to make IGF-1, which circulates steadily.\n\nSo IGF-1 is the practical read on GH status.\n\nDeliberately has no evidence target here. Mortality against IGF-1 is U-shaped, and the LOW side is the stronger signal — so the common longevity claim that lower is better runs against the population data.",
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
   "note": "Protein leaking into urine, expressed relative to urine creatinine so that a dilute sample and a concentrated one give comparable answers.\n\nOne of the earliest signs of glomerular damage — often detectable years before filtration rate starts to fall. That makes it more of a leading indicator than eGFR.\n\nA single positive is not a diagnosis: exercise, fever and simply standing for a long time all cause transient, harmless proteinuria.",
   "axis": [
    0,
    600
   ],
   "cut": {
    "label": "Urine protein category",
    "source": "KDIGO kidney-damage categories",
    "zones": [
     {
      "max": 150,
      "label": "Below the proteinuria threshold",
      "level": "ok"
     },
     {
      "min": 150,
      "label": "Proteinuria range; confirm with an appropriate repeat",
      "level": "out"
     }
    ]
   }
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
      "a": "Sang total EDTA / Cytométrie en flux (CL)",
      "lr": [
       4,
       11
      ]
     },
     "neut": {
      "r": 4.56,
      "u": "G/L",
      "a": "Sang total EDTA / Cytométrie en flux (CL)",
      "lr": [
       1.7,
       7
      ]
     },
     "lymph": {
      "r": 1.05,
      "u": "G/L",
      "a": "Sang total EDTA / Cytométrie en flux (CL)",
      "lr": [
       1,
       4.8
      ]
     },
     "mono": {
      "r": 0.47,
      "u": "G/L",
      "a": "Sang total EDTA / Cytométrie en flux (CL)",
      "lr": [
       0.18,
       1
      ]
     },
     "eos": {
      "r": 0.05,
      "u": "G/L",
      "a": "Sang total EDTA / Cytométrie en flux (CL)",
      "lr": [
       0.02,
       0.63
      ]
     },
     "baso": {
      "r": 0.07,
      "u": "G/L",
      "a": "Sang total EDTA / Cytométrie en flux (CL)",
      "lr": [
       0,
       0.11
      ]
     },
     "hb": {
      "r": 16.4,
      "u": "g/dL",
      "a": "Sang total EDTA / Cytométrie en flux (CL)",
      "lr": [
       13.4,
       16.7
      ]
     },
     "rbc": {
      "r": 5.33,
      "u": "T/L",
      "a": "Sang total EDTA / Cytométrie en flux (CL)",
      "lr": [
       4.28,
       6
      ]
     },
     "hct": {
      "r": 48.3,
      "u": "%",
      "a": "Sang total EDTA / Cytométrie en flux (CL)",
      "lr": [
       39,
       49
      ]
     },
     "mcv": {
      "r": 90.6,
      "u": "fL",
      "a": "Sang total EDTA / Cytométrie en flux (CL)",
      "lr": [
       78,
       98
      ]
     },
     "mch": {
      "r": 30.7,
      "u": "pg",
      "a": "Sang total EDTA / Cytométrie en flux (CL)",
      "cx": "Report prints pg/L, an obvious unit-label typo for MCH; stored as pg.",
      "lr": [
       26,
       34
      ]
     },
     "mchc": {
      "r": 33.9,
      "u": "g/dL",
      "a": "Sang total EDTA / Cytométrie en flux (CL)",
      "lr": [
       31,
       36.5
      ]
     },
     "plt": {
      "r": 166,
      "u": "G/L",
      "a": "Sang total EDTA / Cytométrie en flux (CL)",
      "lr": [
       150,
       400
      ]
     },
     "mpv": {
      "r": 9.2,
      "u": "fL",
      "a": "Sang total EDTA / Cytométrie en flux (CL)",
      "lr": [
       7,
       11
      ]
     },
     "glu": {
      "r": 1.05,
      "u": "g/L",
      "a": "Roche Cobas / Spectrophotométrie (CL)",
      "lr": [
       0.74,
       1.09
      ]
     },
     "a1c": {
      "r": 5.1,
      "u": "%",
      "a": "Electrophorèse capillaire sur sang total / Capillarys 3 sebia (BD)",
      "an": "Capillary electrophoresis — a haemoglobin variant shows as its own peak instead of skewing the number.",
      "ak": "Capillarys — électrophorèse capillaire"
     },
     "crea": {
      "r": 12.5,
      "u": "mg/L",
      "a": "Roche Cobas / Spectrophotométrie (CL)",
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
      "a": "Roche Cobas / Spectrophotométrie (CL)",
      "lr": [
       202,
       417
      ]
     },
     "chol": {
      "r": 1.56,
      "u": "g/L",
      "a": "Roche Cobas / Spectrophotométrie (CL)"
     },
     "hdl": {
      "r": 0.71,
      "u": "g/L",
      "a": "Roche Cobas / Spectrophotométrie (CL)",
      "lr": [
       0.54,
       null
      ]
     },
     "ldl": {
      "r": 0.75,
      "u": "g/L",
      "a": "Formule de FRIEDEWALD (CL)",
      "ak": "Friedewald",
      "an": "Calculated by Friedewald, not measured."
     },
     "tg": {
      "r": 0.55,
      "u": "g/L",
      "a": "Roche Cobas / Spectrophotométrie (CL)",
      "lr": [
       null,
       1.5
      ]
     },
     "na": {
      "r": 139,
      "u": "mmol/L",
      "a": "Roche Cobas / Potentiométrie (CL)",
      "lr": [
       136,
       145
      ]
     },
     "k": {
      "r": 4.7,
      "u": "mmol/L",
      "a": "Roche Cobas / Potentiométrie (CL)",
      "lr": [
       3.4,
       4.5
      ],
      "cx": "Heparin tube, re-run by the lab. The serum was slightly haemolysed, which leaks potassium."
     },
     "tp": {
      "r": 81,
      "u": "g/L",
      "a": "Roche Cobas / Spectrophotométrie (CL)",
      "lr": [
       66,
       87
      ]
     },
     "ca": {
      "r": 103,
      "u": "mg/L",
      "a": "Roche Cobas / Spectrophotométrie (CL)",
      "lr": [
       86,
       100
      ],
      "cx": "Flagged high. No albumin this draw, so corrected calcium cannot be derived."
     },
     "mg": {
      "r": 0.86,
      "u": "mmol/L",
      "a": "Roche Cobas / Spectrophotométrie (CL)",
      "lr": [
       0.65,
       1.05
      ]
     },
     "iron": {
      "r": 14.62,
      "u": "µmol/L",
      "a": "Roche Cobas / Spectrophotométrie (CL)",
      "lr": [
       5.83,
       34.5
      ]
     },
     "ferr": {
      "r": 72,
      "u": "µg/L",
      "a": "Roche Cobas / Spectrophotométrie (CL)",
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
      "a": "Roche Cobas / Spectrophotométrie (CL)",
      "lr": [
       10,
       40
      ]
     },
     "alt": {
      "r": 25,
      "u": "UI/L",
      "a": "Roche Cobas / Spectrophotométrie (CL)",
      "lr": [
       10,
       40
      ]
     },
     "alp": {
      "r": 62,
      "u": "UI/L",
      "a": "Roche Cobas / Spectrophotométrie (CL)",
      "lr": [
       40,
       129
      ]
     },
     "ggt": {
      "r": 27,
      "u": "UI/L",
      "a": "Roche Cobas / Spectrophotométrie (CL)",
      "lr": [
       10,
       45
      ]
     },
     "vitd": {
      "r": 117.5,
      "u": "nmol/L",
      "a": "Roche Cobas / Electrochimiluminescence (BD)",
      "an": "D2 and D3 together as total 25-OH-D. Biotin-sensitive."
     },
     "ft3": {
      "r": 3.12,
      "u": "pg/mL",
      "a": "Roche Cobas / ECLIA (CL)",
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
      "a": "Roche Cobas / ECLIA (CL)",
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
      "a": "Roche Cobas / ECLIA (CL)",
      "lr": [
       0.27,
       4.2
      ],
      "ak": "ECLIA Roche"
     },
     "tt": {
      "r": 25.9,
      "u": "nmol/L",
      "a": "Roche Cobas / ECLIA (BD)",
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
      "a": "Roche Cobas / Spectrophotométrie (CL)",
      "lr": [
       0.81,
       1.45
      ],
      "cx": "The report printed 1.19 mmol/L and 38 mg/L, which disagree. The SI value is stored."
     },
     "cl": {
      "r": 102,
      "u": "mmol/L",
      "a": "Roche Cobas / Potentiométrie (CL)",
      "lr": [
       98,
       107
      ]
     },
     "esr": {
      "r": 2,
      "u": "mm/h",
      "a": "Beckman Coulter Alifax Test 1 THL (CL)",
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
      "a": "Sang total EDTA / Cytométrie en flux (BD)",
      "lr": [
       4,
       11
      ]
     },
     "neut": {
      "r": 3.32,
      "u": "G/L",
      "a": "Sang total EDTA / Cytométrie en flux (BD)",
      "lr": [
       1.7,
       7
      ]
     },
     "lymph": {
      "r": 1.46,
      "u": "G/L",
      "a": "Sang total EDTA / Cytométrie en flux (BD)",
      "lr": [
       1,
       4.8
      ]
     },
     "mono": {
      "r": 0.41,
      "u": "G/L",
      "a": "Sang total EDTA / Cytométrie en flux (BD)",
      "lr": [
       0.18,
       1
      ]
     },
     "eos": {
      "r": 0.07,
      "u": "G/L",
      "a": "Sang total EDTA / Cytométrie en flux (BD)",
      "lr": [
       0.02,
       0.63
      ]
     },
     "baso": {
      "r": 0.05,
      "u": "G/L",
      "a": "Sang total EDTA / Cytométrie en flux (BD)",
      "lr": [
       0,
       0.11
      ]
     },
     "hb": {
      "r": 16.3,
      "u": "g/dL",
      "a": "Sang total EDTA / Cytométrie en flux (BD)",
      "lr": [
       13.4,
       16.7
      ]
     },
     "rbc": {
      "r": 5.28,
      "u": "T/L",
      "a": "Sang total EDTA / Cytométrie en flux (BD)",
      "lr": [
       4.28,
       6
      ]
     },
     "hct": {
      "r": 46.8,
      "u": "%",
      "a": "Sang total EDTA / Cytométrie en flux (BD)",
      "lr": [
       39,
       49
      ]
     },
     "mcv": {
      "r": 88.6,
      "u": "fL",
      "a": "Sang total EDTA / Cytométrie en flux (BD)",
      "lr": [
       78,
       98
      ]
     },
     "mch": {
      "r": 30.9,
      "u": "pg",
      "a": "Sang total EDTA / Cytométrie en flux (BD)",
      "lr": [
       26,
       34
      ]
     },
     "mchc": {
      "r": 34.8,
      "u": "g/dL",
      "a": "Sang total EDTA / Cytométrie en flux (BD)",
      "lr": [
       31,
       36.5
      ]
     },
     "plt": {
      "r": 172,
      "u": "G/L",
      "a": "Sang total EDTA / Cytométrie en flux (BD)",
      "lr": [
       150,
       400
      ]
     },
     "mpv": {
      "r": 11.7,
      "u": "fL",
      "a": "Sang total EDTA / Cytométrie en flux (BD)",
      "an": "EDTA makes platelets swell as the tube waits, so MPV drifts up with time to analysis.",
      "lr": [
       7,
       11
      ],
      "cx": "La Rouvière. The same subject read 9.2 at Clairval in 2020 and 9.4 in Jan 2023."
     },
     "glu": {
      "r": 0.85,
      "u": "g/L",
      "a": "Roche Cobas / Spectrophotométrie (BD)",
      "lr": [
       0.74,
       1.09
      ]
     },
     "crea": {
      "r": 12,
      "u": "mg/L",
      "a": "Roche Cobas / Spectrophotométrie (BD)",
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
      "a": "Roche Cobas / Spectrophotométrie (BD)"
     },
     "hdl": {
      "r": 0.53,
      "u": "g/L",
      "a": "Roche Cobas / Spectrophotométrie (BD)",
      "lr": [
       0.54,
       null
      ]
     },
     "ldl": {
      "r": 0.81,
      "u": "g/L",
      "a": "Formule de FRIEDEWALD (BD)",
      "ak": "Friedewald",
      "an": "Calculated by Friedewald, not measured."
     },
     "tg": {
      "r": 0.73,
      "u": "g/L",
      "a": "Roche Cobas / Spectrophotométrie (BD)",
      "lr": [
       null,
       1.5
      ]
     },
     "na": {
      "r": 140,
      "u": "mmol/L",
      "a": "Roche Cobas / Potentiométrie (BD)",
      "lr": [
       136,
       145
      ]
     },
     "k": {
      "r": 4.4,
      "u": "mmol/L",
      "a": "Roche Cobas / Potentiométrie (BD)",
      "lr": [
       3.5,
       5.1
      ]
     },
     "alb": {
      "r": 52.9,
      "u": "g/L",
      "a": "Roche Cobas / Spectrophotométrie (BD)",
      "lr": [
       35,
       52
      ],
      "cx": "Flagged high. The lab prints: corrected calcium not indicated because albumin >40 g/L."
     },
     "ca": {
      "r": 100,
      "u": "mg/L",
      "a": "Roche Cobas / Spectrophotométrie (BD)",
      "lr": [
       86,
       100
      ]
     },
     "ast": {
      "r": 28,
      "u": "UI/L",
      "a": "Roche Cobas / Spectrophotométrie (BD)",
      "lr": [
       10,
       40
      ]
     },
     "alt": {
      "r": 20,
      "u": "UI/L",
      "a": "Roche Cobas / Spectrophotométrie (BD)",
      "lr": [
       10,
       40
      ]
     },
     "alp": {
      "r": 61,
      "u": "UI/L",
      "a": "Roche Cobas / Spectrophotométrie (BD)",
      "lr": [
       40,
       129
      ]
     },
     "ggt": {
      "r": 21,
      "u": "UI/L",
      "a": "Roche Cobas / Spectrophotométrie (BD)",
      "lr": [
       10,
       45
      ]
     },
     "vitd": {
      "r": 80,
      "u": "nmol/L",
      "a": "Roche Cobas / Electrochimiluminescence (BD)",
      "an": "D2 and D3 together as total 25-OH-D. Biotin-sensitive."
     },
     "hscrp": {
      "r": 0.5,
      "u": "mg/L",
      "lt": true,
      "a": "Roche Cobas / Spectrophotométrie (BD)",
      "an": "Report does not identify whether standard or high-sensitivity CRP was used.",
      "lr": [
       null,
       5
      ]
     },
     "tsh": {
      "r": 0.87,
      "u": "mUI/L",
      "a": "Roche Cobas / ECLIA (BD)",
      "lr": [
       0.27,
       4.2
      ],
      "ak": "ECLIA Roche"
     },
     "ptime": {
      "r": 82,
      "u": "%",
      "a": "Chronométrie / NéoPTimal (BD)",
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
    "note": "Cerballiance Clairval (Marseille) — an AFTERNOON draw at 14:53, the only one in this file, which is why the total testosterone here is not comparable with the morning draws either side of it. Hormones sent out to CERBA and run by ECLIA. Every method and printed interval is recorded on the values. TESTOSTERONE LIBRE was also measured here, by direct RIA: 32.3 pmol/L / 9.3 pg/mL, in range against that assay's own printed 30.0-87.0 pmol/L. It is deliberately NOT stored: a direct analog RIA and a Vermeulen calculation are different scales, so putting them on one line would draw a tenfold drop that never happened. The report also notes 'serum legerement lactescent' — mild lipaemia, which can disturb spectrophotometric assays.",
    "v": {
     "wbc": {
      "r": 4.9,
      "u": "G/L",
      "a": "Sang total EDTA / Cytométrie en flux (CL)",
      "lr": [
       4.09,
       11
      ]
     },
     "neut": {
      "r": 2.9,
      "u": "G/L",
      "a": "Sang total EDTA / Cytométrie en flux (CL)",
      "lr": [
       1.78,
       6.95
      ]
     },
     "lymph": {
      "r": 1.47,
      "u": "G/L",
      "a": "Sang total EDTA / Cytométrie en flux (CL)",
      "lr": [
       1.34,
       3.92
      ]
     },
     "mono": {
      "r": 0.39,
      "u": "G/L",
      "a": "Sang total EDTA / Cytométrie en flux (CL)",
      "lr": [
       0.23,
       0.77
      ]
     },
     "eos": {
      "r": 0.1,
      "u": "G/L",
      "a": "Sang total EDTA / Cytométrie en flux (CL)",
      "lr": [
       0.05,
       0.59
      ]
     },
     "baso": {
      "r": 0.03,
      "u": "G/L",
      "a": "Sang total EDTA / Cytométrie en flux (CL)",
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
      "a": "Sang total EDTA / Cytométrie en flux (CL)",
      "lr": [
       134,
       167
      ]
     },
     "rbc": {
      "r": 5.26,
      "u": "T/L",
      "a": "Sang total EDTA / Cytométrie en flux (CL)",
      "lr": [
       4.53,
       5.79
      ]
     },
     "hct": {
      "r": 47.3,
      "u": "%",
      "a": "Sang total EDTA / Cytométrie en flux (CL)",
      "lr": [
       39.2,
       48.6
      ]
     },
     "mcv": {
      "r": 89.9,
      "u": "fL",
      "a": "Sang total EDTA / Cytométrie en flux (CL)",
      "lr": [
       79.6,
       94
      ]
     },
     "mch": {
      "r": 31.2,
      "u": "pg",
      "a": "Sang total EDTA / Cytométrie en flux (CL)",
      "lr": [
       27.3,
       32.8
      ]
     },
     "mchc": {
      "r": 347,
      "u": "g/L",
      "a": "Sang total EDTA / Cytométrie en flux (CL)",
      "lr": [
       324,
       363
      ]
     },
     "plt": {
      "r": 153,
      "u": "G/L",
      "a": "Sang total EDTA / Cytométrie en flux (CL)",
      "lr": [
       172,
       398
      ],
      "cx": "Flagged low — but against this lab’s own 172–398, narrower than the 150–400 used here."
     },
     "mpv": {
      "r": 9.4,
      "u": "fL",
      "a": "Sang total EDTA / Cytométrie en flux (CL)",
      "an": "EDTA makes platelets swell as the tube waits, so MPV drifts up with time to analysis.",
      "lr": [
       7.4,
       10.8
      ]
     },
     "crea": {
      "r": 12,
      "u": "mg/L",
      "a": "Roche Cobas / Spectrophotométrie (CL)",
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
      "a": "Roche Cobas / Potentiométrie (CL)",
      "lr": [
       3.4,
       4.5
      ],
      "cx": "Heparin tube. Flagged high against the lab’s 3.4–4.5."
     },
     "na": {
      "r": 141,
      "u": "mmol/L",
      "a": "Roche Cobas / Potentiométrie (CL)",
      "lr": [
       136,
       145
      ]
     },
     "cl": {
      "r": 103,
      "u": "mmol/L",
      "a": "Roche Cobas / Potentiométrie (CL)",
      "lr": [
       98,
       107
      ]
     },
     "ptime": {
      "r": 81,
      "u": "%",
      "a": "Chronométrie / Néoplastine CI+ (CL)",
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
      "a": "Chronométrie / Céphascreen (sensible aux déficits de la voie endogène) (CL)",
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
      "a": "Sang total EDTA / Cytométrie en flux (BD)",
      "lr": [
       4.09,
       11
      ]
     },
     "neut": {
      "r": 2.52,
      "u": "G/L",
      "a": "Sang total EDTA / Cytométrie en flux (BD)",
      "lr": [
       1.78,
       6.95
      ]
     },
     "lymph": {
      "r": 1.06,
      "u": "G/L",
      "a": "Sang total EDTA / Cytométrie en flux (BD)",
      "lr": [
       1.34,
       3.92
      ],
      "cx": "Flagged low against this lab’s 1.34–3.92."
     },
     "mono": {
      "r": 0.46,
      "u": "G/L",
      "a": "Sang total EDTA / Cytométrie en flux (BD)",
      "lr": [
       0.23,
       0.77
      ]
     },
     "eos": {
      "r": 0.09,
      "u": "G/L",
      "a": "Sang total EDTA / Cytométrie en flux (BD)",
      "lr": [
       0.05,
       0.59
      ]
     },
     "baso": {
      "r": 0.05,
      "u": "G/L",
      "a": "Sang total EDTA / Cytométrie en flux (BD)",
      "lr": [
       0,
       0.1
      ]
     },
     "hb": {
      "r": 152,
      "u": "g/L",
      "a": "Sang total EDTA / Cytométrie en flux (BD)",
      "lr": [
       134,
       167
      ]
     },
     "rbc": {
      "r": 5.04,
      "u": "T/L",
      "a": "Sang total EDTA / Cytométrie en flux (BD)",
      "lr": [
       4.53,
       5.79
      ]
     },
     "hct": {
      "r": 45.4,
      "u": "%",
      "a": "Sang total EDTA / Cytométrie en flux (BD)",
      "lr": [
       39.2,
       48.6
      ]
     },
     "mcv": {
      "r": 90.1,
      "u": "fL",
      "a": "Sang total EDTA / Cytométrie en flux (BD)",
      "lr": [
       79.6,
       94
      ]
     },
     "mch": {
      "r": 30.2,
      "u": "pg",
      "a": "Sang total EDTA / Cytométrie en flux (BD)",
      "lr": [
       27.3,
       32.8
      ]
     },
     "mchc": {
      "r": 335,
      "u": "g/L",
      "a": "Sang total EDTA / Cytométrie en flux (BD)",
      "lr": [
       324,
       363
      ]
     },
     "plt": {
      "r": 157,
      "u": "G/L",
      "a": "Sang total EDTA / Cytométrie en flux (BD)",
      "lr": [
       172,
       398
      ],
      "cx": "Flagged low — but against this lab’s own 172–398, narrower than the 150–400 used here."
     },
     "mpv": {
      "r": 12.1,
      "u": "fL",
      "a": "Sang total EDTA / Cytométrie en flux (BD)",
      "lr": [
       7.4,
       10.8
      ],
      "an": "EDTA makes platelets swell as the tube waits, so MPV drifts up with time to analysis.",
      "cx": "Barral. The same subject read 9.2 at Clairval in 2020 and 9.4 six weeks earlier."
     },
     "hscrp": {
      "r": 1.4,
      "u": "mg/L",
      "a": "Roche Cobas / Spectrophotométrie (BD)",
      "an": "Report does not identify whether standard or high-sensitivity CRP was used.",
      "lr": [
       null,
       5
      ]
     },
     "esr": {
      "r": 2,
      "u": "mm/h",
      "a": "Beckman Coulter Alifax Test 1 THL (BD)",
      "lr": [
       null,
       15
      ],
      "an": "Photometric rheology, not a Westergren tube — correlated with it, not identical.",
      "cx": "Second hour 5 mm."
     },
     "fib": {
      "r": 2,
      "u": "g/L",
      "a": "Chronométrie (BD)",
      "lr": [
       2,
       4
      ],
      "an": "Chronometric (Clauss-type). Derived-fibrinogen methods read differently and do not interchange."
     },
     "ige": {
      "r": 122,
      "u": "UI/mL",
      "a": "Roche Cobas / Immunoturbidimétrie (BD)",
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
      "a": "Roche Cobas / ECLIA (BD)",
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
      "a": "Roche Cobas / ECLIA (BD)",
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
      "r": 73,
      "u": "nmol/L",
      "a": "Roche Cobas / Electrochimiluminescence (BD)",
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
    "t": "08:51",
    "note": "Laboratoire B2A Biolac (Schiltigheim) — Beckman chemistry on an XN Sysmex haematology analyser, 10h fast, serum limpide. Drawn 08:51, off the report, which also shows everything run and validated on 07/03/2026. This file previously dated the draw 01/03 and has been corrected. Every method and printed interval is on the values, and all 26 reconcile to the digit — this draw came from the lab directly rather than through an InsideTracker re-conversion. ON CREATINE at the time, which is why the eGFR of 61 is the outlier in an otherwise flat renal series (80, 82, 82, 61, 83.4) and should not be read as a decline. Platelets 148 sit just below the 150-400 reference. THE CRP HERE CANNOT BE USED AS A HIGH-SENSITIVITY RESULT: it was printed '<1 mg/L' and stored AT that limit, so the bound does not resolve the cardiovascular range below 1 mg/L. The 2022 report also leaves assay sensitivity unidentified; only the July 2026 value is explicitly high-sensitivity.",
    "v": {
     "rbc": {
      "r": 5.17,
      "u": "T/L",
      "lr": [
       4.28,
       6
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
       39,
       49
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
       26,
       34
      ],
      "a": "Impédance, photométrie, fluorocytométrie XN Sysmex"
     },
     "mchc": {
      "r": 36.2,
      "u": "g/dL",
      "lr": [
       31,
       36.5
      ],
      "a": "Impédance, photométrie, fluorocytométrie XN Sysmex"
     },
     "rdw": {
      "r": 11.7,
      "u": "%",
      "lr": [
       0,
       15
      ],
      "a": "Impédance, photométrie, fluorocytométrie XN Sysmex"
     },
     "wbc": {
      "r": 4.48,
      "u": "G/L",
      "lr": [
       4,
       11
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
       1,
       4.8
      ],
      "a": "Impédance, photométrie, fluorocytométrie XN Sysmex"
     },
     "mono": {
      "r": 0.39,
      "u": "G/L",
      "lr": [
       0.18,
       1
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
       2
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
      "an": "Reported only as <1 mg/L, so it cannot resolve the cardiovascular hs-CRP range below 1."
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
    "note": "B2A Canal / Brumath (Vendenheim), Cobas Roche chemistry on an XN Sysmex haematology analyser, with Diasorin CLIA for insulin, vitamin D, PTH and IGF-1; send-outs to CERBA (trace elements, ApoB, Lp(a), cystatin C, homocysteine, DHT, SHBG) and to Laboratoire Barbier for the erythrocyte fatty-acid profile. 10h fast, drawn 08:37, serum limpide and non-haemolysed. All 71 values are reconciled against the printed report. THE LAB CHANGED TECHNIQUE ON 27/05/2026 across much of its chemistry, immunology and serology, and says so on page one: 'entrainant une rupture des anteriorites'. That break lands between this draw and the March one — the thyroid antibodies moved on 26/05, homocysteine on 22/06, IGF-1 back on 23/09/2025, and the CRP became genuinely ultra-sensitive, which is why the March '<1' and this '<0.6' are not two points on one line. OFF creatine — the clean kidney read the March draw could not give. The lab refused erythrocyte magnesium (discontinued for limited clinical benefit) and substituted serum; it also discontinued the ESR outright, per HAS 2025, replacing it with CRP. THE LAB PRINTED A CORRECTED CALCIUM OF 83 mg/L (2.1 mmol/L) AND FLAGGED IT LOW. It is not stored, and that is deliberate: albumin was 51 g/L, and above 40 the correction subtracts a large (albumin - 4) from a calcium that needed no correcting, manufacturing a low reading out of a normal one. The measured calcium, 94 mg/L, is mid-range. This is the artefact the empty corrected-calcium row exists to avoid, printed in black and white by a laboratory that ran the formula anyway.",
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
      "r": 31,
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
      "a": "Technique enzymatique Cobas Roche",
      "lr": [
       null,
       1.5
      ]
     },
     "chol": {
      "r": 2.05,
      "u": "g/L",
      "a": "Technique enzymatique Cobas Roche"
     },
     "hdl": {
      "r": 0.5,
      "u": "g/L",
      "a": "Technique enzymatique Cobas Roche",
      "lr": [
       0.4,
       null
      ]
     },
     "nonhdl": {
      "r": 1.55,
      "u": "g/L",
      "a": "Calcul",
      "an": "Total cholesterol minus HDL. Arithmetic, not an assay."
     },
     "ldl": {
      "r": 1.42,
      "u": "g/L",
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
      "r": 4,
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
      "an": "Explicitly ultra-sensitive per the lab; the March report does not identify assay sensitivity.",
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
      "r": 70,
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
      "r": 8,
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
      "a": "GC-FID – Bioavenir Metz",
      "cx": "Erythrocyte membrane fatty-acid profile (AGRAS), sent via Barbier and performed by Bioavenir Metz."
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
