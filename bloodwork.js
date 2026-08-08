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
  "how_to_add_a_draw": "APPEND one object to DATA.draws. Do not touch anything else. Do not reorder. Do not delete.\n  {\"id\":\"d2026jul\", \"date\":\"YYYY-MM-DD\", \"note\":\"lab, fasted?, on/off what\",\n   \"v\":{ \"<markerId>\": {\"r\": <EXACTLY what the lab printed>, \"u\": \"<a same-scale label from marker units[]>\"} }}\nRULES, in order of how badly they bite:\n 1. NEVER rescale a value. Keep the exact number the lab printed; the dashboard handles real conversions.\n 2. \"u\" must be a same-scale unit LABEL from that marker units[] array (e.g. \"mg/L\", \"µmol/L\", \"G/L\").\n    Equivalent zero-rescaling notation may be normalized (case, U/L vs UI/L, µUI/mL vs mUI/L). If the numeric scale is not listed, STOP; an obvious report typo may use the correct label only with a cx that records it.\n 3. \"<markerId>\" must be an existing id in MARK. If the lab reports something not in MARK, STOP and\n    say so rather than inventing an id — an unknown id is silently ignored.\n 4. Return the WHOLE file. Never a fragment, never a diff.\n 5. \"a\" is OPTIONAL: the assay/technique EXACTLY as the report printed it, and NOTHING else — no\n    gloss, no interpretation. Its optional companion \"an\" carries what the technique MEANS for\n    reading the number (\"Explicitly ultra-sensitive per report; older report does not identify sensitivity\"), which is usually an\n    inference and must not be smuggled into \"a\". Same split as lr versus cut and target: transcription\n    and interpretation stay in separate fields. \"an\" without \"a\" is rejected by audit(). Use them\n    only on markers where\n    the method can move the number or void the range — calculated vs measured LDL, IDMS-traceable\n    creatinine, standard vs ultra-sensitive CRP, immunoassay vs LC-MS/MS or RIA hormones, IGF-1\n    platform, analyser-dependent MPV. Do NOT add it to markers the method cannot swing (sodium is\n    sodium), and NEVER copy it from a neighbouring draw: absent means UNRECORDED, not unchanged.\n    It exists because this file has already been misled four times by a value that moved when the\n    ASSAY changed and not the subject.\n 6. \"lt\": true marks a CENSORED result — the lab printed \"<x\" because the analyte fell below the\n    assay's detection limit. Store the LIMIT in r (r must be a number) and set lt; the panel then\n    renders \"<x\" instead of passing a bound off as a measurement. Do NOT invent a midpoint or a\n    zero: the only fact is that the true value lies somewhere in [0, x). If an upper bound crosses a high cutoff, the claim is unresolved and renders watch — never\n    confirmed abnormal — because the true value may still sit below it. Beware comparing two censored values\n    across draws — different assays have different limits, so 'Inf a 0,5' then '<0.6' is not a\n    rise, it is two bounds that cannot be ordered.\n 7. A marker carrying \"am\" has been judged assay-SENSITIVE: critical = the method can move the\n    number enough to break comparison between draws (free/total T, estradiol, DHT, LDL by\n    Friedewald, Lp(a), hs-CRP, creatinine, cystatin C, IGF-1, vitamin D, omega-3 index,\n    insulin, thyroid antibodies, PTH, prolactin, free T4/T3, trace elements, MPV, and SHBG +\n    albumin because calculated free T is built from them); useful = worth having if the marker\n    ever drives a decision. On those markers ALWAYS capture \"a\" from the report — the panel\n    names the draws that lack one. No \"am\" means the method cannot swing the number.\n 8. \"lr\" is the lab's OWN printed interval for that result: [lo, hi] in the SAME unit as u, with either end null where the report printed only one side (<5 is [null, 5]). Never invent the missing end. It is provenance, distinct from marker-level reference, cut and target claims. Record it wherever the report prints one. It is worth the bytes for two reasons: a printed interval fingerprints the assay (a distinctive interval can support assay identification, but March’s <5 mg/L alone could not distinguish standard from ultra-sensitive CRP; 8.7-25.0 pg/mL names a direct free-T RIA, the mismatch behind two wrong readings of the 2023 value), and an interval that CHANGES between draws is a method change even when no technique was printed.\n 9. \"cx\" is per-value CONTEXT: how to read THIS number in THIS draw — state at the time (on creatine, 2 days into a diet change) or what the lab did differently (substituted serum for the erythrocyte assay). NOT the same as \"an\": creatine is not an assay. It belongs on the markers it actually explains, never as a draw-wide sentence — the creatine caveat is about creatinine and eGFR and nothing else on that panel. WRITE IT IN FULL SENTENCES for a reader who does not already know the answer: \"ON CREATINE\" was the first draft and it is ambiguous between the supplement and the marker, which differ by two letters and both appear in the same note.\n 10. \"ak\" is what the printed \"a\" actually IS — a canonical key used ONLY for comparing draws, never displayed. It exists because \"a\" is a TRANSCRIPTION and labs transcribe the same method differently: one prints \"Formule de FRIEDEWALD\", another misspells it \"Formule de Friedwald\", a third writes bare \"ECLIA\" where the first named the analyser. Editing \"a\" to make those agree would falsify the record, so \"ak\" carries the equivalence instead. Set it ONLY when you are sure two differently-printed strings are the same assay. Leave it off whenever they might genuinely differ — an absent \"ak\" means \"compare what was printed\", which is the safe default. CKD-EPI deliberately has none: the 2009 and 2021 equations are both printed as \"CKD-EPI\" and are not the same calculation.\n 11. \"t\" on a VALUE overrides the draw's collection time, for a result folded in from a different day (the Dec 2020 zinc, drawn twelve days later and sent to a different laboratory). audit() requires a \"cx\" alongside it: a bare time override is a typo, not a fact.",
  "units": "Each marker has a units[] array of {l, m} or {l, a, b} entries. Convert to the US unit with the entry whose l matches v.u: value = (a !== undefined) ? a*raw + b : raw*m. The first entry is not special; v.u names the unit by its LABEL, never by position.",
  "dec": "Which supplements a marker bears on. Many-to-many. Membership does NOT mean the supplement moves it: cystatin C is under Creatine precisely because creatine CANNOT distort it, albumin is under Vitamin D because calcium cannot be corrected without it, selenium is iodine's cofactor, B12/folate are TMG's pathway. The DECS order is deliberate — grouped by primary biomarker domain (hormones/thyroid → lipids/cardio → liver/methylation → kidney/muscle → bone/minerals → aminos → foundational), NOT alphabetical; do not re-sort.",
  "confounds": [
   "Creatine was active at the March 2026 draw and PAUSED before July 2026, which is what makes July the clean kidney baseline — its creatinine and eGFR carry no creatine cx, March's carry one. It raises serum creatinine as substrate, not by damaging kidneys, and creatinine-based eGFR inherits the error. It restarted 1 Aug 2026, so July cystatin C is the reference every later draw must be read against.",
   "Topical minoxidil appears in no supplement group. That is the finding, not an omission: it is a potassium-channel opener with ~1.4% systemic absorption and no hormonal mechanism. Astaxanthin, lycopene, hyaluronic acid and collagen are absent for the same reason. No blood marker can falsify them."
  ],
  "subject": {
   "sex": "male",
   "height": "187 cm",
   "weight": "80 kg",
   "bodyfat": "~12%",
   "training": "resistance 1h15, 6 days per week; ~10min run on waking on weekdays and ~45min (~10km) on Sundays; 1min movement bursts every hour through the day",
   "country": "France",
   "purpose": "Bryan Johnson-style quantified-self biohacking: longitudinal blood draws judge diet, supplement and lifestyle interventions, with AI used as the analytical medical team.",
   "diet": "See the DIET tab. Regular mackerel and trout as recorded there; lots of olive oil; no cheese, 3 eggs/day, potatoes, mushrooms, legumes + whole grains (wild rice), and iodized salt. Huel Black: 90g/day as the pre-workout snack. Its fortification: iodine, vitamin D, zinc, selenium, B12, folate, magnesium, calcium, iron.",
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
  "interpretation_model": "Four claims stay separate. lr is the exact per-result interval printed by that laboratory, in the result unit; it is provenance shown in the datapoint detail, not a dashboard judgement band. reference is a marker-wide sourced healthy-population interval and must declare its evidence strength, source, applicable population, assay requirement and review date; all 88 markers carry one, graded strong/moderate/weak — the grade carries the doubt, so a weak interval is shown with its transfer limits in method rather than withheld. cut contains guideline, diagnostic or risk zones and never pretends to be a lab interval; it renders as boundary LINES on the plot, never a fill. target is an evidence-backed optimization band and must carry strong/moderate/weak evidence plus its basis; 5 of 88 markers have one. The viewer renders reference as \"Reference range\" and target as \"Optimal range\", the only two filled bands. Legacy clin[], opt[] and oc are rejected by audit()."
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
  "Vitamin D3 5000 IU + K2",
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
       "Minoxidil sheds in weeks 2-8. That is expected, not failure. Blocking 5α-reductase redirects the substrate, so DHT should fall from 1.8 while total T at 22.12 and estradiol at 58.7 can both drift up. All three are July pre-treatment baselines. Both drugs are indefinite: stopping hands the gains back within 6-12 months."
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
       "Photoprotection: it raises the threshold at which UV burns you. Also moisture and elasticity. Not colour, which is beta-carotene's job."
      ]
     ],
     "Dose": [
      [
       "",
       "24mg/day, 12mg twice with fat. Above the EU cap — held here rather than raised until it has shown it does anything."
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
    "url": "https://www.sunday.de/en/astaxanthin-bioastin-capsules-12mg.html",
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
    "dose": "5000IU",
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
       "5000 IU, 1 tablet. That is above the adult EFSA/IOM upper limit of 4000, so treat it as a monitored personal experiment. It is sized to move 28 ng/mL into the 30-50 window declared in advance, not to hit an evidence-based longevity optimum."
      ]
     ],
     "Evidence": [
      [
       "",
       "Testing a monitored dose response rather than assuming benefit: July was 28 ng/mL, adequate by NASEM but below the personal 30-50 titration window."
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
       "started"
      ]
     ]
    },
    "cat": "essentials",
    "status": "taking",
    "when": [
     {
      "at": "brunch",
      "dose": "5000IU"
     }
    ],
    "url": "https://www.sunday.de/en/vitamin-d-tablets-5000-iu-plus-k2-mk7-100mcg-xl.html",
    "dec": "Vitamin D3 5000 IU + K2",
    "judge": "25-OH-D, calcium and albumin at the year-end draw — personal titration window 30-50 ng/mL; reduce above 50 and reassess promptly above 60 or if calcium rises"
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
    "judge": "omega-3 index — seek at least 8%; there is no evidence-defined upper optimum, so review rather than automatically increase the current high intake"
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
    "id": "collagenb",
    "name": "Collagen hydrolysate (bovine hide)",
    "ev": "weak",
    "judge": "skin hydration and fine lines in photos; nothing available at home reads the tendon effect",
    "dose": "10g",
    "info": {
     "What it does": [
      [
       "",
       "Raw material rather than signal: glycine, proline and hydroxyproline for collagen synthesis. Avascular tissue draws it in mechanically, as loading squeezes fluid out of the matrix and back in."
      ]
     ],
     "Dose": [
      [
       "",
       "10g with the 07:15 Huel, 30-60min before loading, alongside the 500 Da product until that runs out. Hide, never bone broth — mammals sequester heavy metals in bone. Type I/III labelling is irrelevant; it is hydrolysed to amino acids either way."
      ]
     ],
     "Evidence": [
      [
       "",
       "Skin trials run 2.5-12g, so this dose is comfortably inside them; a 2023 meta-analysis of 26 RCTs found improved hydration and elasticity, largely industry-funded. Tendon is weaker: 15g gelatin with vitamin C doubled synthesis markers in 2017, but a 2023 trial saw a procollagen rise only at 30g and none at 15g."
      ]
     ],
     "Watch": [
      [
       "",
       "Incomplete protein — tryptophan-poor, so it never counts toward the protein target. Hydroxyproline metabolises to oxalate, which matters only with a stone history."
      ]
     ],
     "Parked": [
      [
       "",
       "Until the next draw, with glycine, NAC and TMG."
      ]
     ]
    },
    "cat": "maylater",
    "status": "planned",
    "when": null,
    "url": null,
    "dec": null
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
       "11g is 132mg/kg, the NAC arm of Sekhar's GlyNAC. It is heavier than the glycine arm because the trial dosed by moles, 1.33 and 0.81 mmol/kg, and NAC is the larger molecule."
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
       "Diet folate clears the RDA at ~450-500mcg, down from ~520-570 since the eggs went from 5 to 3. Serum folate still sits at 6.3, on the floor of its band. That gap points at conversion, not intake. Read the greens and the August creatine restart first."
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
       "Among the supplements most often implicated in drug-induced liver injury registries. Your liver panel is pristine: AST 22, ALT 17, GGT 16. So this trades a small real risk against no measurable gain."
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
       "5g/day. Saturation-based, so timing is flexible."
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
       "Strong mechanism and decent observational data. In Swedish cohorts, higher plasma levels go with lower cardiovascular and all-cause mortality. But there are no outcome trials, and no assay to check yourself against. A deliberate bet at ~10 euros a month, not a correction of anything measured."
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
   },
   {
    "id": "matcha",
    "name": "Matcha",
    "ev": "moderate",
    "judge": "ApoB and LDL — but the effect is 5-10 mg/dL, too small to read against any other change made in the same window",
    "dose": "2-3g",
    "info": {
     "What it does": [
      [
       "",
       "Catechins, chiefly EGCG: they cut micellar cholesterol solubilisation in the gut and improve endothelial function. The caffeine and L-theanine are mildly ergogenic."
      ]
     ],
     "Dose": [
      [
       "",
       "2-3g daily, away from meals, on top of the 1.8g already in Huel — together about 580mg catechins, the dose the trials used. Culinary grade rather than ceremonial: shading builds theanine and strips the catechins. Powder beats brewed leaf 2-3x because the whole leaf is consumed rather than infused."
      ]
     ],
     "Evidence": [
      [
       "",
       "Meta-analyses give -0.19 mmol/L LDL and -2 mmHg systolic. The visceral-fat trials used 583mg catechins in overweight or diabetic cohorts and do not transfer to a lean one; brewed tea does not reach that dose anyway."
      ]
     ],
     "Watch": [
      [
       "",
       "Tannins cut non-heme iron absorption by up to 70% when taken with food, and most iron here is non-heme. Concentrated EGCG extracts carry a hepatotoxicity signal above 800mg/day and rank high in drug-induced liver injury registries; leaf does not. The matcha route lands near 300mg EGCG, well inside that margin — which is the reason not to switch to an extract for a cleaner number."
      ]
     ],
     "Parked": [
      [
       "",
       "Nothing physiological gates it. Enter it at the start of a measurement window rather than mid-window, so it does not confound a change already being tested."
      ]
     ]
    },
    "cat": "maylater",
    "status": "planned",
    "when": null,
    "url": null,
    "dec": null
   }
  ]
 },
 "SCREEN": {
  "from": "10:00",
  "to": "21:00"
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
   "t": "Skincare routine",
   "groups": [
    {
     "t": "Morning",
     "icon": "sun",
     "items": [
      "Serum - Salicylic Acid 2%",
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
   "notesPre": [
    "Glycolic 7% once a week instead of Peptides and Retinal, on a day without needling"
   ],
   "notesT": "Sunday",
   "notes": [
    "Body lotion 12% AHA while still wet after morning shower",
    "Microneedling → Multi-Peptide → Infadolan. Face 0.5mm-1mm, up to 2mm in thick areas; scalp 0.5mm"
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
  "cardio": "Upon waking\n• Weekdays: ~10min run\n• Sundays: ~45min run (~10km)\n\nDaily\n• 1min bursts per hour throughout the day (squats, jumping jacks in private, stairs, sprints)",
  "note": "• Pull-Push-Legs, repeated twice - Monday through Saturday.\n• Weights and reps are approximations.\n• Drop sets on most exercises",
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
       },
       {
        "n": "Single arm cable curl",
        "sets": [
         [
          7.5,
          20
         ],
         [
          7.5,
          20
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
        "n": "Standing lateral raise",
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
        "n": "Incline lateral raise",
        "sub": true,
        "sets": [
         [
          6,
          12
         ],
         [
          6,
          12
         ],
         [
          6,
          12
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
   },
   {
    "id": "legs",
    "t": "Legs",
    "groups": [
     {
      "t": "Calves",
      "q": "Unilateral → Bilateral drop sets",
      "items": [
       {
        "n": "Seated calf raise",
        "sets": [
         [
          20,
          25
         ],
         [
          20,
          25
         ],
         [
          20,
          25
         ]
        ]
       },
       {
        "n": "Standing calf raise",
        "sets": [
         [
          40,
          25
         ],
         [
          40,
          25
         ],
         [
          40,
          25
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
    "trigger": "July was exactly 15µmol/L, so the branches must cover the middle. A fall to below 13µmol/L supports observation; a standardized repeat at or above 15 triggers cofactor review; between the two the move is equivocal — it neither confirms the creatine hypothesis nor closes it, so repeat under the same conditions before changing anything.",
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
    "why": "Where does 5000 IU/day place vitamin D, and is calcium remaining safe?",
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
    "decision": "If below the proposed lower-risk threshold, verify intake and method before increasing an already-high dose; a value above 12% prompts a conservative supplement review rather than proving excess.",
    "trigger": "Proposed lower-risk threshold: at least 8%. No outcome study establishes 12% as an upper optimum; it remains a personal review point only.",
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
    "why": "July's 93.5 µg/L is sufficient — above the 80 threshold — and no outcome-defined optimum justifies pushing it higher. No supplement decision turns on repeating it: food intake is already adequate, while higher exposure has shown diabetes signals in trials and observational cohorts.",
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
         "Matcha (2%)",
         "1.8g"
        ],
        [
         "Green tea extract",
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
    "id": "weekly",
    "t": "Weekly",
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
    "Vitamin D3 5000 IU + K2",
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
   "reference": {
    "min": 5.2,
    "max": 60.5,
    "evidence": "weak",
    "label": "Healthy French adult 25(OH)D, 3rd-97th percentile",
    "source": "Souberbielle et al., Clin Chem 2005;51(2):395-400 (927 healthy French adults, DiaSorin LIAISON)",
    "population": "927 apparently healthy adults studied at a French laboratory; sex and age not partitioned and not reported in the accessible record. 506 of them (54.6%) were vitamin-D insufficient. Published interval 13-151 nmol/L as the 3rd-97th percentile — note that is 3rd/97th, not the conventional 2.5th/97.5th.",
    "method": "DiaSorin LIAISON automated 25-OH Vitamin D immunoassay. SEASON OF COLLECTION AND FASTING STATE ARE NOT REPORTED in anything retrievable, so no claim is made about either; what IS known is that over half the cohort fell below 50 nmol/L, which bounds this distribution downward rather than upward. Transfer limits: (1) it predates VDSP/NIST standardisation (2010+), and 25(OH)D immunoassays are notoriously discordant between manufacturers — his 2020-2024 draws are Roche Cobas ECLIA and only the 2026 draw is LIAISON XL DiaSorin, so the earlier points are being read against an interval built on a different platform; (2) this is a POPULATION DISTRIBUTION, not an adequacy claim, and because roughly half the source population was insufficient, the 3rd percentile of 5.2 ng/mL falls deep inside what the marker's existing NIH/NASEM cut calls 'Deficient'. Corroborating French data on the exact 2026 platform: the VARIETE cohort (898 healthy French adults, all seasons, fasting, LIAISON XL) had a median 25(OH)D of 59 nmol/L = 23.6 ng/mL — his 28.0 ng/mL in July 2026 sits just above that median. US NHANES gives a broadly similar median near 27 ng/mL on a standardised assay, cited loosely rather than as a matched comparator. His 2024 lab printed 75-250 nmol/L (30.0-100.1 ng/mL), which is an adequacy/target band — its floor reflects that laboratory's adopted adequacy convention, while its ceiling is a safety guard — which is exactly why it disagrees with this reference at both ends and why his 2024 result read BELOW the lab band while sitting comfortably inside the healthy-population distribution. STORAGE WARNING FOR THE INTEGRATOR: CLAUDE.md sets marker-wide precedence as reference first, then risk cut. Storing this band would let a 13 ng/mL result render in-range and drop out of the flagged filter while the NIH/NASEM cut calls it potentially inadequate. Store ONLY if the viewer keeps existingCut as the status driver for this row, or the band will quietly disarm the deficiency flag. The 2024 Endocrine Society guideline found no outcome-defined 25(OH)D threshold for healthy adults under 50; the personal 30-50 ng/mL titration window therefore remains in the intervention plan rather than an evidence target on this marker.",
    "reviewed": "2026-08-04"
   },
   "note": "Technically a hormone, not a vitamin. Your skin makes it from UVB light, your liver converts it to the 25-OH form measured here, and your kidney switches it on.\n\n25-OH is the right thing to measure. It is the storage form and it lasts a long time in the blood. The active form swings far too fast to tell you anything.\n\nIt moves over months, not days. Daily sunscreen shuts down almost all skin production, which leaves diet and supplements doing nearly all the work.",
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
   "target": {
    "min": 30,
    "max": 50,
    "evidence": "weak",
    "label": "Sufficiency window",
    "source": "Endocrine Society guideline (Holick et al., J Clin Endocrinol Metab 2011;96(7):1911-1930)"
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
   "reference": {
    "min": 8.7,
    "max": 9.9,
    "evidence": "weak",
    "label": "Provisional NORIP corrected-calcium comparator; formula differs",
    "source": "Rustad et al. (NORIP), Scand J Clin Lab Invest 2004;64(4):271-284 (3,036 healthy Nordic adults, 102 laboratories)",
    "population": "3,036 subjectively healthy adults aged 18 and over from Denmark, Finland, Iceland, Norway and Sweden, recruited through 102 routine clinical biochemistry laboratories and evenly distributed for sex and age. The albumin-corrected calcium row is REPORTED SEX-COMBINED (gender FM); that is the source's presentation and should not be read as a demonstrated absence of a sex difference. It IS age-banded, and 18-49 is the band that applies to a 31-year-old; the 50+ band shares the same lower limit with an upper limit of 2.53 mmol/L (10.14 mg/dL).",
    "method": "NORIP is one of the few reference-interval projects that derived a limit for albumin-corrected calcium as a property in its own right rather than reusing the total-calcium interval, which is what makes it the right citation here. Total calcium and albumin were measured on routine analysers across 102 laboratories, all corrected to a common fresh-frozen serum calibrator traceable to reference methods — the source interval is strong, but the formula and matrix mismatch make transfer to this derived row weak. THREE TRANSFER LIMITS, and the first is a systematic offset rather than noise. (1) FORMULA MISMATCH, DIRECTIONAL: NORIP corrects as Ca + 0.020 x (41.3 - albumin g/L), while derive() in this dashboard uses Ca(mg/dL) - (albumin(g/dL) - 4), i.e. 0.025 mmol/L per g/L referenced to 40 g/L. Across albumin 30-40 g/L the dashboard's number sits about 0.10 mg/dL BELOW a NORIP-corrected calcium — roughly 8% of this 1.2 mg/dL interval, always in the same direction. That is a consistent downward bias, not rounding. (2) MATRIX: 2.17-2.47 mmol/L is the harmonised suggestion pooling serum and Li-heparin plasma; the serum-only limits for 18-49 were 2.20-2.47 mmol/L (n=1385, i.e. a floor of 8.82 mg/dL), and every draw here is serum, so this stored floor is about 0.12 mg/dL more permissive than a serum-specific reading. (3) The correction is only as good as the albumin method — bromocresol green and bromocresol purple disagree by several g/L in this range and that error multiplies straight into the corrected calcium; population is Nordic, not French, though calcium homeostasis is tightly regulated and varies little between populations. NOTE ON THE EMPTY ROW: this marker currently holds no values by design, because derive() refuses to compute corrected calcium when albumin exceeds 40 g/L (the source lab's own printed rule) and every albumin in the file is above 40. The reference is still worth storing — it is what the row will be read against if a lower albumin ever appears — but it will render against an empty series until then. This is where a healthy population sits, not where hypercalcaemia begins; that threshold is a separate claim and belongs in a cut. For orientation, NORIP's uncorrected total-calcium interval for adults is 2.15-2.51 mmol/L = 8.62-10.06 mg/dL.",
    "reviewed": "2026-08-04"
   },
   "note": "Calcium adjusted for how much albumin is available to bind it, so that low albumin is not mistaken for genuinely low calcium.\n\nIt is calculated, not measured, and only when the calculation is valid.\n\nThis row is deliberately empty. The source lab's own printed rule is not to correct above 40 g/L of albumin, and every albumin recorded here sits above that. Past that point the formula subtracts from a calcium that never needed correcting, and invents a low result out of a normal one.\n\nSo an empty row is the right answer here, not a missing value.",
   "axis": [
    8,
    11
   ]
  },
  {
   "id": "ca",
   "cat": "vitmin",
   "dec": [
    "Vitamin D3 5000 IU + K2",
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
   "reference": {
    "min": 8.62,
    "max": 10.06,
    "evidence": "strong",
    "label": "NORIP healthy-adult interval, total calcium",
    "source": "NORIP multicentre Nordic adult study (Rustad et al., 2004); corroborated by AACB/RCPA 2.10-2.60 mmol/L (Koerbin & Tate, 2016), which contains it",
    "population": "Healthy Nordic adults of both sexes aged 18 and over, n=2569 serum; NORIP tested for sex and age partitioning and found none, so the adult male interval is this interval.",
    "method": "TOTAL calcium by routine photometry, recalibrated onto the NORIP project calibrator CAL with trueness validated against NFKK Reference Serum X (1.4% bias goal); laboratories reporting an IONISED calcium as total were excluded, so this does not apply to an ionised result. Caveat: assumes minimal-stasis sampling and a normal albumin — a prolonged tourniquet alone moves total calcium 0.2-0.3 mg/dL.",
    "reviewed": "2026-07-31"
   },
   "note": "Total calcium in the blood, held in an extremely narrow range by PTH and vitamin D. Both muscle contraction and nerve signalling depend on it.\n\nOnly about half is free and active. The rest travels bound to albumin.\n\nThat is the catch with the total. When albumin is low, the total drops while the active half is untouched. Correcting for albumin is what fixes that.",
   "axis": [
    8,
    11
   ]
  },
  {
   "id": "pth",
   "cat": "vitmin",
   "dec": [
    "Vitamin D3 5000 IU + K2"
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
   "reference": {
    "min": 9.4,
    "max": 28.9,
    "evidence": "weak",
    "label": "Provisional LIAISON XL 3rd-generation PTH comparator",
    "source": "Souberbielle et al., Eur J Endocrinol 2016;174(3):315-323 (VARIETE; 898 healthy French adults, LIAISON XL)",
    "population": "Drawn from 898 healthy French adults (432 women, 466 men) aged 18-89 with normal BMI and normal eGFR — the VARIETE cohort. The published limits come from the vitamin-D-replete subgroup with normal renal function (25(OH)D >= 30 ng/mL); the exact subgroup n is reported inconsistently in the secondary literature as either 183 or 293 and is deliberately left unpinned here. Sex was not partitioned; the authors reported no sex difference. Age was not partitioned either, though subjects over 60 ran higher and were too few to split — so a 31-year-old sits, if anything, at the low-reading end of this cohort.",
    "method": "Third-generation (whole 1-84) PTH immunochemiluminometric assay on the DiaSorin LIAISON XL platform, fasting morning samples, all seasons — the exact manufacturer and platform recorded for his 2026-07-20 result, but the assay generation is not printed, so the comparator remains provisional. THE ASSAY CAVEAT IS THE WHOLE STORY FOR PTH: second-generation 'intact' PTH assays also detect the 7-84 fragment and read roughly twice as high, and even among second-generation kits the same serum spans a fourfold range between manufacturers. This interval must never be transferred to a second-generation result. WHICH GENERATION HIS ASSAY IS, IS AN INFERENCE, NOT A PROOF: the stored assay string 'CLIA LIAISON XL Diasorin' names the platform, not the generation, and DiaSorin sells second-generation assays on that same platform. The printed 6.5-36.8 pg/mL closely resembles DiaSorin's own LIAISON 1-84 PTH insert range of 5.5-38.4 pg/mL, which points to a third-generation assay — but it is not decisive, because published second-generation inserts do reach that low (13-54 and 7.5-53.5 pg/mL are both real second-generation figures). Confirm the generation on the next report. Two further caveats: (1) the authors deliberately restricted to 25(OH)D >= 30 ng/mL, which lowered the upper limit by 22.4% versus the manufacturer's insert ULN of 38.4 pg/mL — a stricter reference population than a routine lab uses, so this band is tighter than a lab handbook would print; the unrestricted 898-subject healthy group had a median of 18.8 pg/mL and his 17.9 sits essentially on it; (2) PTH has a real circadian rhythm (nocturnal peak, mid-morning nadir) and responds to dietary calcium, so a non-fasting or afternoon draw is not comparable. His own 25(OH)D on the same 2026 draw was 28.0 ng/mL — just below the >= 30 replete criterion this interval was built on, a small mismatch worth stating. This is a population reference, not a diagnostic threshold: primary hyperparathyroidism is diagnosed on PTH read jointly with calcium, and the paper's point in moving the ULN from 38.4 to 28.9 was sensitivity for surgically proven disease (66.6% to 90.1%), not a claim that 29-38 pg/mL is unhealthy.",
    "reviewed": "2026-08-04"
   },
   "note": "The hormone that keeps blood calcium constant. When calcium dips, the parathyroid glands release PTH. It pulls calcium out of bone, tells the kidney to hold on to it, and activates vitamin D so you absorb more.\n\nSo you do not really read it on its own. You read it to make sense of calcium and vitamin D.\n\nA raised PTH usually points to the deficiency behind it. The system is working, but working hard, and it is taking the calcium from your skeleton to do it.\n\nThere is no universal target band. PTH is assay-specific and gets interpreted with calcium and vitamin D. A low result beside normal calcium is not automatically a problem. What matters is an unexpected rise, or suppression paired with abnormal calcium.",
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
   "reference": {
    "min": 2.32,
    "max": 5.11,
    "evidence": "moderate",
    "label": "NORIP healthy-adult male interval, 18-49 y",
    "source": "NORIP multicentre Nordic adult study (Rustad et al., 2004), male 18-49 serum tier",
    "population": "Healthy Nordic men aged 18-49, n=670 serum. Phosphate is partitioned by BOTH sex and age — women 18+ are 0.85-1.50 and men 50+ are capped at 1.35 mmol/L — so this is the only tier applicable to a 31-year-old man.",
    "method": "Direct phosphomolybdate UV photometry recalibrated to the NORIP CAL level, 5.4% bias goal; SERUM figures — the Li-heparin plasma tier is 0.71-1.53 mmol/L, so tube type alone moves the ceiling 0.37 mg/dL. Caveat: not a fasting interval (NORIP required fasting only for glucose and triglyceride) while phosphate falls postprandially and has a morning nadir, and the ceiling is contested — AACB/RCPA harmonise at 1.50 mmol/L with no sex partition, so 4.65-5.11 mg/dL reads ok here and high almost everywhere else.",
    "reviewed": "2026-07-31"
   },
   "note": "An anion that pairs with calcium in bone, carries every cell's energy as the phosphate groups of ATP, and forms the backbone of DNA.\n\nPTH and vitamin D govern it, the same two hormones that run calcium, but they push it the opposite way: PTH raises calcium while lowering phosphate.\n\nSo read it next to calcium and PTH, never alone.",
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
   "reference": {
    "min": 0.46,
    "max": 3.25,
    "evidence": "moderate",
    "label": "Elecsys, male blood donors 20-39",
    "source": "Roche Diagnostics, Reference Intervals for Children and Adults: Elecsys Thyroid Tests, Mannheim 2009, Table 2 (Leipzig blood donors, men 20-39 y, n=286)",
    "population": "German male blood donors aged 20-39 (n=286), Leipzig 2003-04; 2.5th-97.5th percentile, median 1.42. Same cohort reported peer-reviewed as Kratzsch et al., Clin Chem 2005;51(8):1480-1486.",
    "method": "Roche Elecsys/cobas e ECLIA third-generation TSH — the same manufacturer and traceability chain as his Dec 2020, May 2022 and Jul 2026 draws. It does NOT transfer to the Mar 2026 draw, which was Beckman Coulter UniCel DxI 800 chemiluminescence and printed its own 0.40-5.33; TSH is harmonised only loosely between manufacturers and inter-platform bias of 10-20% is normal. Caveats: (1) this is group GL1, blood donors with NO exclusion for thyroid disease, which is the main weakness of the most age-specific band available. Roche's other screened male subgroups on the same assay: the NACB-criteria group GL3 (no goitre, anti-TPO and anti-Tg negative, personal and family history of thyroid dysfunction excluded, all ages, n=274) gives 0.36-3.44 and the whole GL3 group 0.44-3.77; the separate ultrasound-screened group GL2 (normal thyroid volume and structure, n=332 males) gives 0.58-3.44. The lower bound is the least stable number across those screens. (2) The Elecsys package insert interval is 0.27-4.20 (n=516) and Roche's own analysis found it sits inside the 95% CI of these quantile estimates — a TSH between 0.27 and 0.46 is below this cohort's 2.5th percentile but still inside the assay's stated expected range, and should not be read as low. (3) TSH is diurnal (nadir mid-to-late afternoon, peak around midnight-04:00) with a within-person CV roughly half the between-person CV, so morning draws — his — run in the upper part of a person's own range; the donor cohort was daytime, not time-standardised. Not fasting-standardised. (4) German iodine-replete-to-mildly-deficient population; France is broadly comparable. (5) Roche found sex differences in TSH non-significant in group GL3 (p=0.414) and states the data do not require sex-specific intervals — the sex split here is a specificity choice, not a demonstrated need; the age split is the substantive one. (6) No trained or lean male TSH cohort was located. Corroborating but non-transferable: HUNT (Bjoro et al., Eur J Endocrinol 2000, n=70000 Norwegian) males 0.30-3.40 on a different platform, and NHANES III disease-free reference population (Hollowell et al., JCEM 2002;87(2):489-499) geometric mean 1.40 on a Nichols assay. This is a population interval, not a treatment threshold — subclinical-hypothyroidism guidelines act at 4.5-10 regardless of where a population's 97.5th percentile falls.",
    "reviewed": "2026-08-02"
   },
   "note": "Not a thyroid hormone at all. It is the pituitary's instruction TO the thyroid. When thyroid hormone runs low the pituitary shouts louder, so TSH rises.\n\nThat is why it reads backwards: a high TSH means an underactive thyroid.\n\nIt is also the earliest signal, moving before T4 does. But it drifts with the time of day and drops during any acute illness, so one odd value calls for a recheck, not a diagnosis.",
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
   "reference": {
    "min": 1.04,
    "max": 1.65,
    "evidence": "moderate",
    "label": "Elecsys, male blood donors 20-39",
    "source": "Roche Diagnostics, Reference Intervals for Children and Adults: Elecsys Thyroid Tests, Mannheim 2009, Tables 3a/3b (Leipzig blood donors, men 20-39 y, n=286)",
    "population": "German male blood donors aged 20-39 (n=286), Leipzig 2003-04; 2.5th-97.5th percentile, median 1.33 ng/dL (17.1 pmol/L).",
    "method": "Roche Elecsys FT4 ECLIA, a one-step analogue (competitive) immunoassay — the same platform as both of his FT4 results ('Roche Cobas / ECLIA' 2020, 'ECLIA Cobas Roche' 2026). BOUNDS PROVENANCE: 1.04 and 1.65 are Roche's own printed conventional-scale figures (Table 3b), not a conversion. Roche's SI table gives 13.4-21.3 pmol/L; run through this marker's own multiplier (0.0777) that is 1.041-1.655, so the published ceiling of 1.65 is 0.006 ng/dL below what the SI figures would round to — the source's ng/dL column is used as printed rather than back-computed. Caveats: (1) free-hormone analogue assays are NOT interchangeable between manufacturers and are only loosely harmonised; they read the free fraction indirectly and are perturbed by binding-protein status, albumin, NEFA, heparin and severe illness. The reference measurement procedure is equilibrium dialysis with LC-MS/MS and returns systematically different numbers; do not compare this band to a dialysis result. (2) Roche found the male-female difference in FT4 highly significant (p<0.01) in every group with men higher, so the sex partition here is real and necessary — an unpartitioned band would sit low for him. (3) Group GL1 is blood donors with no exclusion for thyroid disease; the NACB-screened male subgroup (GL3, all ages, n=274) gives 1.00-1.67 ng/dL and the ultrasound-normal male subgroup (GL2, n=332) 1.01-1.65, both within 0.04 ng/dL of this band, so the choice of screening barely moves it — this is the most stable of the five thyroid entries. (4) The Elecsys FT4 package insert is 0.93-1.71 ng/dL (12.0-22.0 pmol/L, n=801, 1998); his 2026 lab printed 11.84-21.62 pmol/L, a later insert revision. (5) Not fasting-standardised, no time-of-day standardisation; FT4 has little diurnal variation, unlike TSH. (6) German cohort, iodine-replete to mildly deficient. (7) No trained or lean male FT4 cohort was located; sustained energy deficit lowers T3 more than T4, so training status is a smaller confounder here than for FT3.",
    "reviewed": "2026-08-02"
   },
   "note": "The unbound fraction of thyroxine, the thyroid's main output. Think of it as the reservoir. Most of it gets converted into the more active T3 inside your tissues.\n\nRead it together with TSH, because the combination locates the problem. Low T4 with high TSH means the thyroid is failing. Low T4 with low TSH points to the pituitary instead.\n\nMost labs measure it by an indirect method that becomes unreliable when binding proteins are abnormal.",
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
   "reference": {
    "min": null,
    "max": 28.1,
    "evidence": "weak",
    "label": "Elecsys, NACB male reference, 95th pct",
    "source": "Roche Diagnostics, Reference Intervals for Children and Adults: Elecsys Thyroid Tests, Mannheim 2009, Table 9, group GL5 (NACB-criteria male reference group, n=80)",
    "population": "German male blood donors aged under 30 (n=80) with TSH 0.5-2.0 mIU/L, no goitre and no non-thyroid autoimmune disease — the NACB 2002 recipe for an antibody reference group. One-sided: the 95th percentile is 28.1 IU/mL (95% CI 23-32.7). He is 31, one year above the cohort's ceiling.",
    "method": "Roche Elecsys Anti-TPO ECLIA, the platform his Jul 2026 draw used. Graded weak deliberately, and the caveats are structural rather than incidental. (1) Anti-TPO is NOT standardised between manufacturers despite the shared IU/mL unit and the WHO/MRC 66/387 reference preparation — different platforms disagree severalfold on the same serum, because each measures binding to its own antigen preparation. This number is an Elecsys number and nothing else. (2) It is a 95th percentile of a right-skewed distribution from n=80, not a 97.5th percentile and not a symmetric interval; the 95% CI runs 23-32.7. (3) Anti-TPO is used as a positive/negative call against a cutoff, so position within the band carries little information — 8 IU/mL and 20 IU/mL are both 'negative', and the assay's functional sensitivity is 5 IU/mL, so low results are near the floor of what it can resolve. What the result means is: no detectable autoimmune thyroid attack, which is the reason to measure it once. (4) Competing cutoffs on the same assay: Roche's package insert says 34 IU/mL (n=208 healthy subjects, 95th percentile, shared male/female threshold; the brochure does not state where those subjects were recruited and the insert itself could not be retrieved, so no geography is claimed); the unselected Leipzig male donors give 37; the Swedish EQALIS group gives 19; his own 2026 laboratory printed 20, stricter than Roche's own. The 28.1 chosen here is the demographically matched one and sits between them. (5) Because the reference group is men under 30 with tightly euthyroid TSH, this is the lowest-prevalence slice of the population by construction; women and older adults run far higher (unselected Leipzig women, 95th percentile 312). (6) NO large national survey exists on a matching platform. NHANES measured TPO/Tg antibodies on Beckman Coulter Access 2, not Elecsys, and the 2017-March 2020 pre-pandemic cycle published no thyroid antibody file at all; NHANES III (Hollowell et al., JCEM 2002;87(2):489-499) used a different assay again and reported TPOAb positivity in 11.3% of its disease-free population, so its prevalence figures do not transfer. No trained or lean male cohort exists.",
    "reviewed": "2026-08-02"
   },
   "note": "Antibodies your immune system has made against the enzyme the thyroid uses to build its hormones. Their presence means the thyroid is under autoimmune attack.\n\nThe reason to measure it once: it tells you why a TSH is abnormal, and that changes what happens next.\n\nThe number itself means little. These assays are poorly standardised and values do not compare between labs. Positive or negative is the finding.",
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
   "reference": {
    "min": null,
    "max": 11.4,
    "evidence": "moderate",
    "label": "NHANES III vitamin-replete male 20-39 y upper reference limit",
    "source": "Selhub et al., Ann Intern Med 1999;131(5):331-339 (NHANES III, men 20-39, vitamin-replete)",
    "population": "Men aged 20-39 y, drawn from NHANES III phase 2 (1991-1994; 3563 male and 4523 female participants aged 12+ in the survey). The reference sample was not the whole survey: it was restricted to participants who were serum-folate-replete AND vitamin-B12-replete AND had normal serum creatinine, which is a properly health-associated reference population rather than a raw distribution. Critically it predates mandatory US folic-acid fortification (January 1998), so it describes an UNFORTIFIED population and transfers to France, which has no fortification programme. No fitness, BMI or body-composition criterion - general population, not athletes; there is no trained-cohort tHcy reference interval, so tier 1 of the ladder is genuinely unavailable here.",
    "method": "Serum total homocysteine by an HPLC method with fluorometric detection (the NHANES III / HNRCA laboratory). Three caveats. (1) Method class: this subject's 2026 result is enzymatic. Enzymatic tHcy correlates closely with HPLC (R2 ~0.93) and automated immunoenzymatic methods regress on HPLC with slopes 0.97-1.03, so the limit transfers with a modest bias caveat; it does NOT transfer to immunonephelometric methods, which read ~25% low and use a correspondingly lower cut-off (~12 vs 15 micromol/L). (2) Preanalytics dominate this analyte: tHcy rises in uncentrifuged whole blood left at room temperature and after a methionine-rich meal, so a single value at the limit warrants a fasting, promptly separated repeat before it is treated as a finding. (3) The 5th percentile for this exact male 20-39 band is not reproduced in any accessible primary text (the abstract publishes only the 12-19 and 60+ bands in full), so `min` is deliberately left null rather than estimated by eye - the Danish study's 6.3 micromol/L is offered above as corroboration, not as a substitute lower bound. NHANES III HPLC-fluorometric. Enzymatic methods such as this subject's agree closely with HPLC; immunonephelometric methods read lower and need their own cut-off. The interval is CONDITIONAL — derived only from participants folate- and B12-replete with normal creatinine — so it assumes a subject that screen would admit. This one carries a creatinine at or above the printed upper limit across draws on 5 g/day creatine (muscle mass, not filtration: cystatin C 0.85) and a folate in the lower part of its own adopted interval, and creatine turnover is itself the dominant methyl demand under test here. Total homocysteine also rises in whole blood held before centrifugation, so a single elevated result is not hyperhomocysteinaemia until repeated with documented sample handling. 11.4 is a healthy-population 95th percentile, not an action level: the 15 cut and this file's own 13/15 branches remain the decision thresholds. FULL CITATION: Selhub J, Jacques PF, Rosenberg IH, Rogers G, Bowman BA, Gunter EW, Wright JD, Johnson CL. Serum total homocysteine concentrations in the third National Health and Nutrition Examination Survey (1991-1994): population reference ranges and contribution of vitamin status to high serum concentrations. Ann Intern Med. 1999;131(5):331-339. PMID 10475885. The paper defines a high tHcy as one exceeding the sex-specific 95th percentile of its reference sample of participants aged 20-39 y, and states that limit as 11.4 micromol/L for males (10.4 for females). Independently corroborated in an unfortified Danish cohort by Rasmussen K, Moller J, Lyngbak M, Pedersen AM, Dybkjaer L. Age- and gender-specific reference intervals for total homocysteine and methylmalonic acid in plasma before and after vitamin supplementation. Clin Chem. 1996;42(4):630-636 (PMID 8605683), whose men aged 30-59 y interval is 6.3-11.2 micromol/L - an upper limit within 2% of NHANES III's, from a different country, a different decade and a different method.",
    "reviewed": "2026-07-31"
   },
   "note": "An amino acid your body makes as a normal intermediate step, then clears using B12, folate and B6.\n\nSo it works as a functional test of those three. When any of them runs short, homocysteine backs up. That tells you more than measuring the vitamins directly, because it shows whether the pathway is actually working.\n\nIt is exceptionally sensitive to handling. It keeps rising in the tube if the plasma is not separated promptly, which produces falsely high results.\n\nCHECK THE HANDLING BEFORE BELIEVING A HIGH RESULT. Red cells go on making homocysteine after the blood is drawn. If the sample sits before being spun, several µmol/L can appear out of nowhere. So a single high value is a question about the lab first, and about you second.\n\nWORK THROUGH THE VITAMINS IN ORDER. Folate and B12 are the usual culprits and the cheapest to measure. B6 matters further down the pathway. Measure all three, fix whatever is low, then re-test. Adding a methyl donor straight away lowers the number but hides which one was missing.\n\nWHAT ELSE PUSHES IT UP. Poor kidney function. An underactive thyroid. The MTHFR C677T variant, which slows the enzyme and raises how much folate you need. Some drugs do it too: metformin and stomach-acid blockers through B12, methotrexate through folate. Making creatine uses more methyl groups than anything else in the body, so taking creatine can lower homocysteine on its own.\n\nBRINGING IT DOWN IS NOT THE SAME AS GETTING A BENEFIT. B vitamins lower it reliably. In trials that barely translated into fewer heart attacks, and a modest drop in strokes is the one finding that held up. So treat it as a good read on B-vitamin status and methylation, and a poor thing to chase for its own sake. Fix what it is pointing at.\n\n15 IS A CONVENTION, NOT A CLIFF. It is the usual upper limit, but risk rises smoothly and plenty of labs draw the line lower. A value in the high teens, with normal B vitamins and a sample handled properly, is usually just where someone sits.",
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
   "reference": {
    "min": 59,
    "max": 121,
    "evidence": "moderate",
    "label": "French adult male serum selenium, central 95%",
    "source": "Arnaud et al., Br J Nutr 2006;95(2):313-320 (SU.VI.MAX; 4,915 French men aged 45-60)",
    "population": "French men aged 45-60, community volunteers in the SU.VI.MAX antioxidant supplementation cohort, baseline (unsupplemented) samples collected 1994-1995; mean 1.14 µmol/L (SD 0.20). The companion female figure (n=7,423, aged 35-60) is 1.09 (SD 0.19).",
    "method": "DEPARTURE FROM THE PANEL NOTE, STATED DELIBERATELY: the note asked for the NHANES adult distribution, which gives US males >=14 y a 5th-95th percentile of 101-151 µg/L (Kafai & Ganji, J Trace Elem Med Biol 2003;17:13-18). That band does not transfer to France. Serum selenium is dominated by soil selenium in the food chain and US intake runs far above European — a review of 37 studies in 8,010 healthy German adults found a weighted mean of 82 µg/L (Liaskos et al., Eur J Nutr 2023;62(1):71-82), roughly 40 µg/L below the US median. Applying the NHANES band would have put this subject's entirely ordinary 93.5 µg/L below the reference and, because reference drives row status ahead of the cut, turned a normal French result red. THE BOUNDS ARE DERIVED, NOT PUBLISHED, and that is the main reason this is not graded higher: the paper reports mean and SD, not percentiles, so these are a normal approximation (mean ± 1.96 SD). The approximation's weak end is the FLOOR. The paper states fewer than 2% of volunteers fell below 0.75 µmol/L (59.2 µg/L), but that statement covers a cohort that is mostly women, for whom the same normal model would predict 3.7% below — so the real distribution has a SHORTER left tail than normal and the true male 2.5th percentile probably sits somewhat above 59. This floor is therefore permissive and errs toward not flagging a healthy man; the mild right skew of selenium distributions makes the ceiling slightly conservative in the same way. ASSAY: the SU.VI.MAX group (Grenoble) routinely used electrothermal atomic absorption spectrometry and that is the likely method, but the full text is paywalled and the method is not confirmed; this subject's result is ICP-MS. Both are NIST-traceable for total serum selenium and agree closely, so the transfer is acceptable, but it is a method difference and the assay-change warning applies. Other caveats: the cohort is 45-60 and he is 31 (serum selenium varies little across adult ages, but the age partition does not strictly transfer); samples are ~30 years old and national selenium status drifts over decades; serum selenium is not fasting-sensitive but responds within weeks to supplement intake, so it reads current intake rather than long-term status — whole blood or plasma glutathione peroxidase is the status measure. LAYER SEPARATION: the floor of 59 falls below the existing cut's 80 µg/L sufficiency line on purpose — the same paper reports 75% of men below the concentration considered optimal for glutathione peroxidase, so a large minority of French adults genuinely sit below functional sufficiency. Population position and functional sufficiency are different claims. No target is stored: randomized prevention trials have not shown benefit from pushing an already-sufficient concentration higher, while higher exposure has produced diabetes signals. His single draw printed 70-130 µg/L, a narrower working range sitting inside this band.",
    "reviewed": "2026-08-04"
   },
   "note": "A trace mineral built into the enzymes that regenerate your antioxidants, and into the enzyme that converts T4 into active T3.\n\nIt is unusual in having a narrow safe window. Both too little and too much cause real harm, so more is not better here.\n\nBlood levels vary widely by region, because how much is in your food depends on how much is in the soil it grew in. Serum reflects recent intake more than long-term stores.",
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
   "reference": {
    "min": 2.6,
    "max": 9.5,
    "evidence": "weak",
    "label": "French adult Omega-3 Index, central 95%",
    "source": "Wagner et al., Eur J Clin Nutr 2015;69(4):436-441 (MONA LISA-NUT; 503 French adults aged 35-64)",
    "population": "French adults aged 35-64, men and women pooled, sampled in the MONA LISA-NUT national nutrition survey 2005-2007 across three French regions; mean Omega-3 Index 6.02% (SD 1.75). No sex-specific values are published.",
    "method": "Red cell fatty acids by gas chromatography, Omega-3 Index computed as EPA + DHA as a percentage of total RBC fatty acids — the same measurand and the same method family as this subject's GC-FID result, so the transfer is unusually clean for a reference interval. Bounds are a normal approximation (mean ± 1.96 SD) because the paper publishes mean and SD, not percentiles; the Omega-3 Index is mildly right-skewed, so the lower bound is slightly pessimistic and the upper slightly conservative. THE HONEST CAVEAT, AND IT IS THE WHOLE CAVEAT: THIS IS AN INTAKE DISTRIBUTION, NOT A PHYSIOLOGICAL RANGE. There is no homeostatic set point for the Omega-3 Index — it is a direct readout of habitual EPA/DHA intake over the preceding ~4 months of red cell turnover, so the interval says where French eating habits sat in 2005-2007 and nothing about a biological norm. It moves with national fish consumption and needs re-review if French intake shifts. Corroboration across Europe on the same RBC-GC method: Germany mean 5.80%, Italy 4.75%, Barcelona 7.05%, USA 5.44% (Schuchardt et al., Prostaglandins Leukot Essent Fatty Acids 2022;179:102418, 167,347 individuals); the 2024 update of that world map (Schuchardt et al., Prog Lipid Res 2024;95:101286, 328 studies) places France in the moderate 6-8% band. Younger European adults may run lower — the GAPP cohort in LIECHTENSTEIN, adults aged 25-41, is reported around 4.6% by whole-blood GC (Filipovic et al., J Hypertens 2018;36(7):1548-1554), though that exact median is unverified and whole blood reads slightly differently from RBC. UK Biobank NMR-ESTIMATED O3I in men was 5.2% (SD 2.2), n=117,108 (Schuchardt et al., Br J Nutr 2023;130(2):312-322), but that is predicted from plasma and is not directly comparable. Graded weak: n=503, samples 20 years old, bounds derived rather than published, sexes pooled, ages 35-64 against a subject of 31, and the analyte drifts with national diet. THE MOST IMPORTANT LINE ON THIS ROW: his 2026 lab printed [8, 11]%, which is NOT a population interval — it is a Harris/von Schacky-derived risk target reprinted in the reference column, which is why a 50th-percentile French value reads 'low' on the report. Against his population he is at the median (6.12% vs 6.02%); against the target he is short by about 2 points. The population band spans values below and above the proposed 8% lower-risk threshold, which is the expected relationship — presenting 2.6-9.5 as a risk range would be wrong.",
    "reviewed": "2026-08-04"
   },
   "note": "EPA and DHA as a percentage of all the fatty acids in your red cell membranes.\n\nMembranes turn over slowly, so this reflects months of intake, not your last meal. Think of it as an HbA1c for omega-3.\n\nThe method matters. The published targets belong to the red cell measurement specifically. Plasma and whole-blood versions give different numbers, and those targets do not apply to them.",
   "axis": [
    0,
    14
   ],
   "target": {
    "min": 8,
    "evidence": "weak",
    "label": "Proposed lower-risk Omega-3 Index threshold",
    "source": "Harris and von Schacky framework, supported by prospective cohort associations; no RCT-defined optimum or upper bound"
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
   "reference": {
    "min": 44.8,
    "max": 442,
    "evidence": "moderate",
    "label": "Healthy UK men aged 18–39, Roche Cobas immunoturbidimetry",
    "source": "Rodgers et al., Ann Clin Biochem 2024;61(5):365-371, doi:10.1177/00045632241243026 (25,425 healthy UK adults; Roche Cobas)",
    "population": "Healthy UK adults selected after excluding results associated with disorders of iron metabolism, inflammation and other relevant pathology. The male interval was partitioned at age 40; 44.8-442 µg/L is the reported nonparametric interval for men aged 18-39 and was checked against independent validation datasets.",
    "method": "Ferritin by Roche Cobas-series immunoturbidimetry. This matches the manufacturer family and immunoturbidimetric principle recorded for both stored ferritin results; the exact French analyser module was not printed, so module-level equivalence is not claimed. The interval is recent, age- and sex-matched and based on a much larger screened sample than the former manufacturer interval, but remains moderate rather than strong because it is a single-country indirect reference study and the accessible record does not report a separate 18-39 male sample count. Ferritin is an acute-phase protein: inflammation, infection, liver injury, adiposity and hard training can raise it independently of iron stores, while blood donation lowers it. This is a population reference interval, not an iron-deficiency or overload decision threshold; the separate cut at 30 µg/L and transferrin saturation retain those roles.",
    "reviewed": "2026-08-04"
   },
   "note": "The protein that stores iron inside cells, and the best single estimate of your total body iron.\n\nOne large caveat: ferritin is also an acute-phase protein, so inflammation raises it regardless of iron. A high ferritin therefore has two very different explanations.\n\nThe rest of the panel tells them apart. Genuine iron loading raises transferrin saturation as well. Inflammation leaves saturation normal or low.",
   "axis": [
    0,
    470
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
   "reference": {
    "min": 63.4,
    "max": 111.8,
    "evidence": "moderate",
    "label": "French men, SU.VI.MAX fasting serum zinc (95% interval)",
    "source": "Arnaud et al., Eur J Clin Nutr 2010;64(10):1057-1064 (SU.VI.MAX; 4,926 French men aged 45-65)",
    "population": "4,926 French men aged 45-65 at enrolment in the SU.VI.MAX cohort, mean 13.4 µmol/L, published range 9.7-17.1 µmol/L (the companion figure for 7,448 women aged 35-65 is 9.2-16.6, confirming the sex partition is real: men ran significantly higher, p<0.0001). Sex-partitioned adult male, rung 3; NOT age-matched to a 31-year-old, and that cuts the right way — the paper found age negatively associated with serum zinc in men specifically, so a 31-year-old would be expected at or above this cohort's centre.",
    "method": "Serum zinc by FLAME ATOMIC ABSORPTION after a 12-hour fast — the same method family and the same country as this subject's draws, which record 'Absorption atomique'. That triple match (French population, atomic absorption, fasting) is why this was chosen over the NHANES ICP-MS alternatives. NOTE ON THE PUBLISHED RANGE: the paper labels 9.7-17.1 a '95% CI'. It is a 95% reference range for the distribution, not a confidence interval on the mean — a CI on a mean of n=4,926 would be about ±0.05 µmol/L. It is read here as an interval, which is the only reading the numbers support. CAVEATS: (1) fasting and time of day dominate serum zinc — IZiNCG's NHANES II-derived lower limits for males aged 10+ are 74 µg/dL fasting AM, 70 µg/dL non-fasting AM and 61 µg/dL PM, a 13 µg/dL swing from timing alone, so a non-fasting or afternoon draw is not readable against this interval; (2) serum zinc is a weak biomarker of body zinc status in the first place, holds a tiny fraction of total body zinc, and falls with inflammation and albumin changes independent of intake; (3) the cohort is 45-65, not 31; (4) method spread between laboratories is large — a Spanish ICP-MS cohort is reported at 80.0-162.5 µg/dL, appreciably higher at both ends, so treat the ceiling as method-dependent rather than physiological (that figure and the NHANES 2011-2014 US male medians near 85 µg/dL are cited loosely, from secondary reporting, not verified at source). LAYER SEPARATION WORTH WRITING DOWN: this reference's floor (63.4 µg/dL) sits BELOW the IZiNCG deficiency screening cut-off for fasting morning male samples (74 µg/dL). That is not an error — a population 2.5th percentile and a functional deficiency threshold are different claims, and IZiNCG's is deliberately set to catch population-level risk. If a zinc deficiency cut is ever added it will legitimately sit inside this reference band and the two must be labelled separately in the gauge. His lab printed 11-24 µmol/L (71.9-156.9 µg/dL) unchanged across 2020 and 2026 — narrower at the bottom and far wider at the top than any healthy-population estimate located, so his 16.3 µmol/L reads unremarkable on the lab's scale and near the top of the French male distribution; the unchanged printed cut-offs and stated method make the 13.9 to 16.3 rise more likely real than an assay artefact.",
    "reviewed": "2026-08-02"
   },
   "note": "An essential trace mineral used by hundreds of enzymes. Needed for immune function, wound healing, taste, and making testosterone.\n\nSerum zinc is a weak proxy. It holds a tiny fraction of your body's zinc, and during inflammation zinc actively moves out of the blood into tissue as part of the immune response.\n\nSo a value taken during any illness understates your real stores, and can look like deficiency when the immune system is simply relocating it.",
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
   "reference": {
    "min": 63.7,
    "max": 138.5,
    "evidence": "weak",
    "label": "Healthy adult men, serum copper by ICP-MS (2.5th-97.5th pct)",
    "source": "Rivas et al., Clin Nutr ESPEN 2025;70:227-239 (501 healthy adults, NW Spain, ICP-MS; corrigendum Clin Nutr ESPEN 2026;72:102903)",
    "population": "Healthy adult men from the male stratum of 501 healthy adults aged 18-90 in Lugo, north-west Spain — roughly 250 men. Sex-partitioned because the study found a large, highly significant sex effect (women higher, p<0.001) driven by oestrogen and oral contraceptive use; reading a man against a sex-combined copper interval materially overstates his ceiling. Age was a significant covariate in men (higher at 34-65 than at 18-33), so a 31-year-old sits in the lower-reading age stratum.",
    "method": "Serum copper by INDUCTIVELY COUPLED PLASMA MASS SPECTROMETRY, reference limits as 2.5th-97.5th percentiles computed non-parametrically per CLSI/IFCC guidance. ICP-MS is exactly the method printed for this subject's 2026 copper, which is why this was chosen over the older textbook criteria. TWO SOURCING PROBLEMS, BOTH STATED RATHER THAN BURIED, AND TOGETHER THEY ARE WHY THIS IS GRADED WEAK RATHER THAN MODERATE. (1) THE SPECIFIC DIGITS ARE UNVERIFIED: the study design, the sex effect and the CLSI percentile method are all confirmed from the published abstract, but the male limits themselves (637 and 1385 µg/L), the female comparison and the quality-control recovery figure sit behind a paywall and were NOT read off the table. They are physiologically plausible and directionally consistent with the verified abstract; they are not confirmed. (2) A FORMAL CORRIGENDUM EXISTS to this exact article, effective April 2026, whose content is not retrievable — it may or may not touch the reference-interval tables being stored here. Re-check both at the next review. Further limits: single-centre and n=501 across both sexes, so this is not a national survey (which is what 'moderate' would require on this scale); north-west Spain rather than France, though the paper's cross-country table reports close agreement with Belgian, Danish, French, German, Slovenian, Swiss, US and Australian cohorts; serum copper is largely ceruloplasmin-bound and rises as an acute-phase reactant, so inflammation, infection or recent hard training inflate it and a single value is not a body-copper measurement; and copper and zinc compete at the intestinal transporter, so a zinc-supplemented person can run low copper for reasons a reference interval cannot see. His 11.0 µmol/L (69.9 µg/dL) is EXACTLY the lower limit his lab printed (11-20 µmol/L = 69.9-127.1 µg/dL) — borderline-abnormal on the report, low-but-inside against this band. Both readings agree on direction: low-normal copper, worth watching, not abnormal, and exactly where zinc-copper antagonism would put him. A population interval is not a deficiency threshold — frank copper deficiency is a clinical and haematological diagnosis (anaemia, neutropenia, myeloneuropathy) usually far below this floor, and copper here is best read as a ratio partner to zinc rather than as a position in a band.",
    "reviewed": "2026-08-02"
   },
   "note": "An essential trace mineral used in iron transport, connective tissue and antioxidant enzymes.\n\nRead it against zinc, never on its own. The two compete for the same transporter in the gut, and long-term zinc supplements are a well-known cause of copper deficiency.\n\nCopper also rises with inflammation and with oestrogen, which makes a high result harder to interpret.",
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
   "reference": {
    "min": 14,
    "max": 26,
    "evidence": "moderate",
    "label": "Italian adult male ceruloplasmin, Roche cobas",
    "source": "Pelucchi et al., J Appl Lab Med 2024;9(6):1053-1063 (1,706 Italian blood donors; male 25-65 subgroup, n=1,179)",
    "population": "1,706 consecutive healthy Italian blood donors (1,285 men, 421 women) aged 18-65, enrolled May 2019 to July 2022. The stored limits are the MALE 25-65 subgroup, n=1,179, which covers age 31 directly; the male 18-25 subgroup (n=106) is 13-23 and the all-male figure 14-25, so the subgroup choice matters and is named deliberately.",
    "method": "Immunoturbidimetric ceruloplasmin on a Roche cobas c502, with limits derived by quantile regression on age within sex (2.5th-97.5th percentiles); the authors also publish an online calculator returning exact limits for a given sex and age. The male upper limit rises to a plateau the abstract phrases as 'about 25 mg/dL' from roughly age 25 while the tabulated 25-65 male value is 26, so treat the ceiling as carrying ±1 mg/dL of reading uncertainty; the lower limit varies little with age or sex. THE DOMINANT CAVEAT IS METHOD, and the authors say so themselves: ceruloplasmin measurement has never been successfully standardised, and immunoturbidimetric and nephelometric assays are not interchangeable. Siemens BN II nephelometric intervals and many kit inserts run considerably higher — routine lab ranges of roughly 20-60 mg/dL are common, and the manufacturer's own insert around 15-30 — so this interval must NOT be applied to a result from a different platform (Li et al., J Appl Lab Med 2025;10(6):1762-1763 make exactly this point in reply). When this marker is actually drawn, check the printed assay FIRST; a nephelometric report would sit on a materially higher scale and the dashboard's assay-change warning will do the rest. Biological caveats: ceruloplasmin is a positive acute-phase reactant and rises with any inflammation, with oestrogen and pregnancy, and falls in protein loss and in Wilson disease; blood donors are mildly iron-depleted as a group, a modest cohort bias for a copper protein; and ceruloplasmin is only interpretable alongside serum copper, since roughly 90% of circulating copper is bound to it. Not fasting-sensitive. This marker has no stored values, so the reference ships ahead of any draw with no local corroboration. This is a population interval on one immunoturbidimetric platform, not a diagnostic threshold — the Wilson disease workup uses a much lower ceruloplasmin alongside serum and urinary copper, and that belongs in a cut.",
    "reviewed": "2026-08-02"
   },
   "note": "The protein that carries copper. About 90% of the copper in serum is bound to it, so the two are always read together.\n\nThat is the point of ordering it alongside copper. A low copper has two possible explanations: too little copper, or too little of the protein carrying it. The copper number alone cannot separate them.\n\nCAVEAT: IT IS AN ACUTE-PHASE PROTEIN. Inflammation, infection, pregnancy and oestrogen all raise it, and a rise can hide a real copper deficiency underneath. Check hs-CRP alongside it. A normal CRP clears that worry. A raised one means a normal-looking ceruloplasmin might be masking a low.\n\nThe range comes from Cavalli et al., J Appl Lab Med 2024: 1,706 healthy Italian donors on a Roche Cobas immunoturbidimetric assay, the same platform family as this panel's chemistry. It is sex-specific, and narrower than the 20 to 60 mg/dL figure textbooks quote. Men aged 25 to 65 run 14 to 26 mg/dL; women run almost double at the top.\n\nWatch which assay was used. An enzymatic one, measuring oxidase activity, does not give the same number as an immunoassay.",
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
   "reference": {
    "min": 190,
    "max": 678,
    "evidence": "moderate",
    "label": "Roche platform adult serum B12, central 95%",
    "source": "Jassam et al., Ann Clin Biochem 2023;60(6):417-422 (300 healthy adults recruited to IFCC CRIDL criteria; Roche platform)",
    "population": "300 adults recruited prospectively as a reference population under IFCC CRIDL criteria; sexes pooled, no separate male interval published. Recruitment site is inferred as UK (Leeds/Harrogate) from author affiliations rather than stated in the record.",
    "method": "Competitive-binding electrochemiluminescence immunoassay on a Roche analyser — the same platform and method as both of this subject's results (2024 Roche Cobas ECLIA, 2026 ECLIA Cobas Roche), which is why this interval was chosen over a generic one. Total serum B12 has no international reference measurement procedure and no commutable standard material, so intervals are method-specific and do not transfer between manufacturers: in the same 300 subjects, Siemens gave 181-562 and Beckman DXi 110-562, a lower limit differing from Roche's by 80 units on the same blood. UNITS FOOTNOTE, DELIBERATE AND LOAD-BEARING: the published abstract prints these intervals as 'ng/mL', which is a typographic slip — B12 is universally reported in ng/L, and 190 ng/mL would be a thousand-fold impossibility. ng/L and pg/mL are the same scale, so the numbers carry across unchanged. Independent corroboration comes from his own two reports rather than a third source: the 2024 draw printed 145-569 pmol/L and the 2026 draw 197-771 pg/mL, which are the SAME band on two scales (145 x 1.355 = 196.5; 569 x 1.355 = 771.0), so the assay fingerprint is unchanged across draws and the file's pmol/L multiplier is confirmed. That printed band is the Roche Elecsys Vitamin B12 II insert range; its underlying cohort is variously described across insert revisions (on the order of 120-135 sera of both sexes spanning roughly ages 20-79) and no specific description is asserted here. This reference is narrower at the top (678 vs 771) because it comes from an independent 300-subject IFCC-criteria cohort rather than the manufacturer's sera; the lower limits effectively agree (190 vs 197). Biological caveats: total B12 measures the carrier-bound pool, of which only the holotranscobalamin fraction is available to cells, so a value inside this interval does not exclude functional deficiency — MMA or holoTC is the tie-breaker; oral supplementation drives total B12 well above the upper limit without that meaning excess; the assay is affected by high-dose biotin and by intrinsic factor antibodies; no fasting requirement. The reference floor of 190 sitting just under the existing 200 deficiency cut is the expected relationship, not a conflict: 2.5% of healthy adults fall below a threshold set to catch deficiency, which is exactly why 200-400 is labelled indeterminate.",
    "reviewed": "2026-08-02"
   },
   "note": "A vitamin needed to build red blood cells and to maintain the myelin sheath around nerves. Only bacteria make it, so in the diet it comes from animal foods.\n\nThe liver stores years' worth, which is why deficiency develops slowly and quietly.\n\nOne measurement caveat: serum B12 counts all the B12 in the blood, but most of it is bound to a protein that cannot deliver it to cells. So the result can look normal during genuine deficiency. Methylmalonic acid settles the ambiguous cases.",
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
   "reference": {
    "min": 63.5,
    "max": 254,
    "evidence": "moderate",
    "label": "NHANES B12-replete adults 20-39 y, normal renal function",
    "source": "Mineva et al., Am J Clin Nutr 2019;110(1):158-168 (NHANES, ages 20-39)",
    "population": "Adults aged 20-39 y (n=2178) from NHANES 2011-2014, restricted to a reference subpopulation that was vitamin-B12-replete (serum B12 >=300 pmol/L) AND had normal renal function (eGFR >=60 with no albuminuria) - not the raw survey distribution, which is what separates this from the alternative candidate (Ganji V, Kafai MR, Nutrients 2018;10(1):74, men 18-40 y, 5th-95th 69.0-248.7 nmol/L) that applied no health exclusions at all. Both sexes combined: sex partitioning was not applied, whereas AGE partitioning was and is the reason this entry is restricted to the 20-39 band that contains a 31-year-old. So this is better than a plain unpartitioned adult interval in the age direction and no worse in the sex direction, but the tier enum has no 'age-only' rung and claiming 'sex-and-age' would overstate it. No fitness or BMI criterion; no trained-cohort MMA reference exists.",
    "method": "Serum MMA by isotope-dilution LC-MS/MS after butanol derivatisation (CDC method, LOD 22.1 nmol/L). Unusually for this panel, cross-method disagreement is not a live risk: MMA is measured only by mass spectrometry - there is no immunoassay to diverge - and the CDC LC-MS/MS method showed r=0.99 with no bias against the earlier GC-MS method, so the interval transfers across MS platforms including the GC-MS a French laboratory may use. The caveat that does matter is renal: MMA rises as GFR falls, and this interval was derived exclusively in people with eGFR >=60 and no albuminuria, so it must be read beside creatinine or cystatin C - an elevated MMA with reduced filtration is not a B12 claim. Second caveat: the reference sample was B12-replete but not supplemented to saturation, so it describes a normally-nourished person rather than someone on high-dose B12. NHANES 2011-2014 isotope-dilution LC-MS/MS in serum, a reference-method measurement with no immunoassay family to diverge from; a future draw should confirm the French laboratory reports serum MMA by LC-MS/MS or GC-MS and in nmol/L, since a µmol/L report is a 1000-fold trap. Derived from a B12-replete (serum B12 >=300 pmol/L), eGFR >=60, non-albuminuric subpopulation aged 20-39; sex was a covariate but no sex-specific interval was derived, so this stops at an age-partitioned adult interval. The lower limit is the 2.5th percentile of an already-replete population and carries no adverse meaning — a low MMA is the reassuring result and must not read as out of range. The upper limit is a healthy-population percentile, not a decision threshold, and does not displace the 271 nmol/L functional B12 cut. MMA also rises with propionyl-CoA substrate load — high branched-chain amino acid intake and fermentable fibre — independently of B12 status; that is mechanism rather than trial evidence, but it is a real upward bias in a high-protein, high-fibre diet. FULL CITATION: Mineva EM, Sternberg MR, Zhang M, Aoki Y, Storandt R, Bailey RL, Pfeiffer CM. Age-specific reference ranges are needed to interpret serum methylmalonic acid concentrations in the US population. Am J Clin Nutr. 2019;110(1):158-168. PMID 31127807. Central 95% reference interval for the 20-39 y band: 63.5-254 nmol/L (n=2178). The paper's whole point is that the band matters - the same reference sample gives 70.5-293 at 40-59 y, 72.4-281 at 60-69 y and 84.3-317 nmol/L at >=70 y. Bracketed independently by a Danish healthy-population interval of 0.10-0.40 umol/L (100-400 nmol/L) for ages 18-<65: Abildgaard A, Knudsen CS, Hojskov CS, Greibe E, Parkner T. Reference intervals for plasma vitamin B12 and plasma/serum methylmalonic acid in Danish children, adults and elderly. Clin Chim Acta. 2022;525:62-68.",
    "reviewed": "2026-07-31"
   },
   "note": "A checkpoint for B12, one step past B12 itself. Converting methylmalonyl-CoA needs B12. Without enough, methylmalonic acid backs up and spills into the blood.\n\nIt answers what serum B12 cannot. B12 tells you how much is in the blood, not how much is working inside cells, and it can look normal during real deficiency. MMA shows you whether the job is actually getting done.\n\nIt also settles something homocysteine cannot. Folate, B12 and B6 all raise homocysteine, but only B12 raises MMA. Both high points to B12. High homocysteine with a normal MMA points to folate or methylation instead, and B12 would do nothing for it.\n\nCAVEAT: THE KIDNEY CLEARS IT. In NHANES, the highest creatinine quartile ran about 43% above the lowest, and that explains most of why MMA drifts up with age. Read it beside eGFR, and prefer cystatin C for the same reason the kidney rows do.\n\nThe decision threshold is 271 nmol/L, from the NIH fact sheet. Labs set their own limits by method, so a result near that line should be read with B12 and kidney filtration, not alone. A low value is nothing to worry about. For a sense of scale: NHANES adults aged 18 to 40 have a median of 119 nmol/L, with 90% falling between 69 and 249.",
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
   "reference": {
    "min": 3.2,
    "max": 17,
    "evidence": "moderate",
    "label": "Dutch unfortified-population adult serum folate interval (Roche Folate III)",
    "source": "Vos et al., Pract Lab Med 2019;16:e00127 (Dutch general population)",
    "population": "347 adults aged 21-90 y of both sexes - 192 men (mean age 44 y) and 214 women (mean age 45.5 y) - from the Dutch population-based Lifelines cohort, screened for health by requiring haemoglobin and MCV within sex- and age-specific norms and eGFR >60 mL/min/1.73m2. The Netherlands runs NO folic-acid fortification programme, which is the single most important match to this subject: serum folate distributions in fortified populations (US post-1998) sit far higher and their intervals are not transferable to France. Age partitioning was tested and explicitly not warranted (the authors propose an interval 'independent of age'); sex was examined and not applied. No fitness or BMI criterion, and no trained-cohort folate reference exists, so tier 1 and tier 2 of the ladder are genuinely unavailable - this stops at tier 3, an unpartitioned adult interval where partitioning was tested rather than assumed.",
    "method": "Roche Folate III (Elecsys folate-binding-protein ECLIA) on a cobas e602, calibrated against the WHO international folate standard - the same assay family as this subject's 'ECLIA Cobas Roche' result, which is why this source was preferred over the far larger NHANES microbiologic-assay data (different method AND a fortified population). Non-parametric percentile estimation with bootstrap resampling; the authors chose it over gamma-fitting (which gave 6.8-26.0) because without supplement-use data the upper tail is likely supplement users, and discarding them would have understated the limit. The lower limit was independently verified against homocysteine in 117 patient samples. Two caveats: samples reading above the assay's 45.4 nmol/L measuring ceiling were EXCLUDED, so the upper limit is partly assay-truncated and in any case carries no health meaning - high folate is not a lab abnormality; and serum folate tracks recent intake rather than stores, so a supplementing subject (this one takes 90 g/day of folate-fortified Huel) will read higher than this reference population and red-cell folate remains the status marker. Roche Elecsys ECLIA, the same platform family as this subject's result; Vos measured heparinised plasma rather than serum, a minor matrix difference for Roche folate. Assumes a fasting morning draw and no folate supplementation: the cohort was supplement-naive and unfortified, so the upper limit is a distributional artifact of low intake with no health meaning attached to it. Serum folate reflects intake over the preceding days, not tissue status — RBC folate is the status measure. Do not read the upper limit as a ceiling: a value above it in someone taking 5-MTHF or fortified food is the expected result of that intake, not an abnormality, and the deficiency threshold is the only side of this interval that carries a decision. FULL CITATION: Vos MJ, van Pelt LJ, Kok MB, Dijck-Brouwer DAJ, Heiner-Fokkema MR, Dikkeschei LD, Kootstra-Ros JE. Folate reference interval estimation in the Dutch general population. Pract Lab Med. 2019;16:e00127. PMID 31289733. Proposed interval 7.3-38.5 nmol/L (the paper itself prints 3.2-17.0 ug/L). The upper limit is independently reproduced to within 0.3% on the same assay by an entirely different derivation - Madurga A, Arbiol-Roca A, Navarro-Badal MR, Cortes-Bosch de Basea A, Dot-Bach D. Biochem Med (Zagreb). 2025;35(1):010705, indirect Big-Data method, n=18285, upper limit 38.4 nmol/L (90% CI 38.3-38.5).",
    "reviewed": "2026-07-31"
   },
   "note": "A B vitamin required for DNA synthesis and red cell production, working in the same pathway as B12.\n\nThe reason they are read together is a specific trap. Folate can correct the anaemia of B12 deficiency while doing nothing for the nerve damage, which then keeps progressing unnoticed and can become permanent.\n\nSerum folate reflects the last few days of intake. Red cell folate reflects months of stores.",
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
   "reference": {
    "min": 16.7,
    "max": 180,
    "evidence": "moderate",
    "label": "NHANES 95% reference interval, non-Hispanic White men 20-49 y",
    "source": "Schini et al., Bone 2020;141:115577 (NHANES, men 20-49)",
    "population": "Non-Hispanic White men aged 20-49 y (n=737), one stratum of a 4463-person reference population assembled from 9069 NHANES 2007-2010 adults aged 20-80 (both sexes; 50.6% female before exclusions, 44.4% after) by excluding every established PLP confounder: inflammation (CRP >=5.0 mg/L), chronic kidney disease (eGFR <60), low alkaline phosphatase (<36 IU/L) and any vitamin-B6 supplementation. Sex, age and race were all independent predictors of PLP (each p<0.0001), which is why the stratum matters rather than the pooled figure: male median 43.3 vs female 33.2 nmol/L, and young male 50.4 vs older male 34.2 nmol/L. No fitness or BMI criterion - a general-population reference sample, not an athletic one; no trained-cohort PLP interval exists, so tier 1 is unavailable and this stops at tier 2.",
    "method": "Plasma PLP by reversed-phase HPLC with post-column derivatisation and fluorometric detection (the NHANES 2007-2010 method, and the method used in routine practice); 95% interval by the CLSI non-parametric percentile method with Reed's criterion for outliers. Three caveats that change how the number is read. (1) The reference population EXCLUDES B6-supplement users, and that exclusion is large: supplemented NHANES participants had a median PLP of 81.3 nmol/L against 34.5 unsupplemented. A value above 180 nmol/L in someone taking B6 - including from fortified meal replacements - is expected, not abnormal, and this interval must not be used to flag it. (2) PLP falls with inflammation and with reduced GFR and rises when ALP is low, so it is interpreted beside CRP, eGFR and ALP rather than alone; a low PLP with a raised CRP is a confounded reading. (3) PLP is light- and temperature-labile - NHANES required fasting samples shipped on dry ice and stored at -70C, and a mishandled sample reads low. NHANES 2009-2010 HPLC with fluorescence detection; PLP is light- and temperature-labile, so it assumes protected, promptly frozen samples (I could not verify the fasting requirement and it should not be claimed). Derived after excluding B6 supplement users, inflammation, CKD and low ALP: the upper limit is therefore a distributional artifact of unsupplemented intake and carries no health meaning — a PLP above it in someone taking a B-complex is the expected result of that dose, and the risk that matters at high intake is chronic pyridoxine neuropathy, which this interval does not address. The stratum is the non-Hispanic White young-male one; this subject's ancestry is not recorded and the assumption is disclosed rather than established — the young-male lower limits span 16.0 to 21.8 across strata. The lower limit sits just below this marker's 20 nmol/L sufficiency cut and does not displace it. FULL CITATION: Schini M, Nicklin P, Eastell R. Establishing race-, gender- and age-specific reference intervals for pyridoxal 5'-phosphate in the NHANES population to better identify adult hypophosphatasia. Bone. 2020;141:115577. PMID 32791332. Table 4, male / non-Hispanic White / young (20-49 y), n=737: median 48.1 nmol/L, 95% RI 16.7-180.0 nmol/L (90% CI of the lower limit 14.8-18.0; of the upper limit 149.0-210.0).",
    "reviewed": "2026-07-31"
   },
   "note": "Pyridoxal-5-phosphate, the active form of vitamin B6. It is the coenzyme for well over a hundred enzymes, most of them handling amino acids.\n\nIt is the third input to clearing homocysteine, and it works differently from the other two. Folate and B12 recycle homocysteine back into methionine. B6 runs the other exit, breaking it down to cysteine for good.\n\nSo when homocysteine will not come down on folate alone, this is often the one to check.\n\nMeasure PLP, not plain \"vitamin B6\". The plain assay counts inactive forms too and can read normal during a genuine deficiency. PLP also falls with inflammation, independently of what you eat.",
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
   "reference": {
    "min": 0.86,
    "max": 1.42,
    "evidence": "moderate",
    "label": "Elite male athletes, 2.5th-97.5th pct",
    "source": "Díaz Martínez et al., Int J Environ Res Public Health 2022;19(5):3059 (8,396 basal male creatinine samples from 2,258 male elite athletes, Spain)",
    "population": "Male elite athletes across 32 sports, Spain 2011-2020, mean age 24.9 ± 6.9 years; 2,258 men contributing 8,396 basal creatinine samples (the 8,452 figure quoted elsewhere is the cohort-wide male sample count, not the creatinine-specific one).",
    "method": "Beckman Coulter AU400 analyser. The paper does not state Jaffe versus enzymatic chemistry and makes no IDMS-traceability claim, so this is a method-specific band and transfers imperfectly to this subject's three different assays: Roche Cobas spectrophotometric (2020-2023), Beckman créatininase enzymatic (Mar 2026) and IDMS-traceable Roche enzymatic (Jul 2026). Jaffe-type methods generally read higher than enzymatic because non-creatinine chromogens are included, which is exactly the kind of shift the dashboard's assay-change warning exists to flag. Samples were basal — fasting, after a night's rest, and the authors state explicitly that no post-exercise samples were analysed — so the band assumes a rested draw; a sample taken within a day or two of hard resistance work will sit above it for reasons that have nothing to do with the kidney. The band is high at the top precisely because muscle mass drives creatinine production: the athlete upper limit of 1.42 mg/dL sits well above the same paper's general-population comparator of 74.26-110.50 µmol/L (0.84-1.25 mg/dL), and a 187 cm / 80 kg male at ~12% fat training six days a week belongs nearer the athlete distribution than the sedentary one. HOW HIS OWN DRAWS FALL, stated because one of them will render out of band: 1.25, 1.20, 1.20 and 1.16 mg/dL sit inside, but the Mar 2026 value of 1.50 mg/dL is ABOVE this 1.42 ceiling — the same draw the eGFR row treats as the outlier. Every French lab printed a much tighter and lower range (0.67-1.17 and 0.72-1.18 mg/dL), so four of five results already sat at or above the printed ceiling; those printed ranges corroborate the paper's general-population comparator, not the athlete interval. Transfer caveats: the cohort is younger (mean 24.9) and trains at a competitive load this subject does not, and creatine monohydrate supplementation raises serum creatinine with no change in filtration and is not accounted for. Position inside this band is a statement about muscle mass at least as much as about renal function; it is not a renal risk threshold.",
    "reviewed": "2026-08-02"
   },
   "note": "A waste product of normal muscle metabolism, made at a steady rate and cleared by the kidneys. If the kidneys filter less, it builds up. That is what makes it the standard kidney marker.\n\nThe problem is that how much you produce varies as much as how much you clear:\n\n• More muscle mass makes more of it\n• Meat raises it for a day or so\n• Creatine supplements raise it directly\n\nAll three make kidney function look worse when nothing about the kidney has changed.",
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
   "reference": {
    "min": 0.62,
    "max": 1.04,
    "evidence": "moderate",
    "label": "ERM-DA471-standardised healthy-adult male interval (Danish blood donors)",
    "source": "Erlandsen & Randers, J Clin Lab Anal 2018;32(6):e22433 (male, IFCC-traceable)",
    "population": "152 healthy Danish male blood donors aged 17–66, ~30 per ten-year band (152 women analysed in parallel; women 0.58–1.00, combined 0.61–1.01). No fitness or BMI criterion was applied and none is required here: cystatin C is the one filtration marker independent of muscle mass — Baxmann AC, Ahmed MS, Marques NC, Menon VB, Pereira AB, Kirsztajn GM, Heilberg IP, Clin J Am Soc Nephrol 2008;3(2):348–354 found no correlation with body weight, fat-free mass or body cell mass, while serum and urinary creatinine tracked lean mass strongly. Sex partitioning was reported but was NOT statistically warranted (P=0.21), so the male interval is a conservative presentation rather than a demonstrated sex effect. Independently corroborated in a direct Chinese study of 1,424 men aged 31–40 — the subject's exact band — at 0.62–1.02 mg/L (Deng Y, Xie F, Zhao Z, Wu W, Wang D, Guna Y, Zhang Q, Li Q, Jiang H, Guan M. Sci Rep 2025), agreeing to 0.02 mg/L.",
    "method": "Assumes a cystatin C assay calibrated against the certified reference material ERM-DA471/IFCC. The source used the Gentian particle-enhanced turbidimetric assay (PETIA) on a Roche cobas c702; the subject's result is by immunonephelometry (PENIA). Before standardisation PETIA read up to ~27% above PENIA; after ERM-DA471 the platforms converge (reported Roche-vs-Siemens bias falling from ~7% to ~0% with second-generation reagents), so the interval transfers — but a residual few-percent inter-platform bias remains, and a single value sitting within a few hundredths of 1.04 should not be called abnormal on that basis. Cystatin C is raised by corticosteroids, hyperthyroidism and high-grade inflammation (none applicable here) and, unlike creatinine, is untouched by creatine supplementation, high meat intake or resistance training — which is exactly why it is the marker that can carry a reference in this panel. Assumes a cystatin C assay traceable to ERM-DA471/IFCC. Three transfer limits, none of which move the numbers. (1) Measurement principle: the source figures are Gentian turbidimetry (PETIA) on a Roche cobas c702; this subject's result is immunonephelometric, and his own laboratory prints a ceiling of 1.11 mg/L against this interval's 1.04. A residual inter-platform bias of a few percent persists after standardisation, and because the next draw repeats the same nephelometric method it is systematic across the whole series rather than noise that averages out — a result of 1.04-1.11 would render above reference here while the running lab prints it normal. (2) The source's own partitioning: it found no sex difference (P=.21), so the male limits used here are an n=152 subgroup the authors declined to treat as a partition (their combined interval is 0.61-1.01); and it found a significant rise with age in men (P<.0053) across 17-66 while publishing no age-stratified interval, so this ceiling is pooled over men up to 66 and is mildly permissive for a 31-year-old. Deng et al. (Sci Rep 2025) give 0.62-1.02 for men 31-40 at n=1,424 by the direct method, which cross-checks the ceiling to 0.02 mg/L rather than narrowing it by eye. (3) Non-GFR determinants: cystatin C is less body-composition-free than its reputation — Knight et al., Kidney Int 2004;65(4):1416-21, found greater height, greater weight and higher CRP independently associated with higher levels, which shifts a 187 cm / 80 kg man upward within the band (his hsCRP, 0.5-1.4 mg/L, is not a live confounder). Sensitivity to a real decline should rest on the NEXTDRAW trigger (a confirmed combined-eGFR fall over 20%), not on this ceiling. FULL CITATION: Erlandsen EJ, Randers E. Reference intervals for plasma cystatin C and plasma creatinine in adults using methods traceable to international calibrators and reference methods. J Clin Lab Anal. 2018;32(6):e22433 (PMID 29573343). Male non-parametric interval 0.62–1.04 mg/L, median 0.79.",
    "reviewed": "2026-07-31"
   },
   "note": "A small protein made at a constant rate by every nucleated cell in the body, and filtered out by the kidneys.\n\nWhat makes it better than creatinine is what leaves it alone: muscle mass, meat intake and creatine supplements have no effect on it. So in anyone who lifts, eats a lot of protein, or takes creatine, it gives the more trustworthy picture of filtration. Creatinine will consistently make the kidney look worse than it is.",
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
   "reference": {
    "min": 80.7,
    "max": 160,
    "evidence": "moderate",
    "label": "Healthy adults aged <=40, FAS reference limits",
    "source": "Pottel et al., Clin Kidney J 2017;10(4):545-551 (FAS-derived limits, validated against measured GFR in 633 living kidney donors)",
    "population": "Healthy adults of both sexes aged 40 or under. RUNG IS UNPARTITIONED AND THAT IS NOT A DOWNGRADE BUT A PROPERTY OF THE METHOD: the limits derive from sex- and age-partitioned creatinine reference limits, but the FAS Q-rescaling deliberately removes both (SCr/Q = 0.67-1.33 is stated to be independent of age and sex), so the delivered eGFR band is numerically identical for women and flat across every age to 40. Validated against measured GFR in 633 European (France/Belgium) potential living kidney donors — 550 Lyon, 41 Liège, 42 Leuven — of whom 97.2% fell inside.",
    "method": "Not an assay — eGFR is calculated, so this band inherits every creatinine confound wholesale. The limits come from rescaling sex- and age-specific IDMS-standardised creatinine reference limits by the FAS Q factor and running them through eGFR = 107.3 / (SCr/Q), then checking the result against iohexol/inulin-measured GFR. Bounds are the paper's own printed values (lower 80.7, upper 160); the age-decay factor 0.988^(Age-40) applies only from 40 upward, so at 31 the limits stand unmodified. Two transfer limits, both material. First, this subject's values are CKD-EPI, not FAS; the two agree reasonably at normal creatinine but are different calculations, and this file's own record notes CKD-EPI 2009 and 2021 print identically while not being the same equation. Second, the band assumes IDMS-traceable creatinine, which only the Jul 2026 draw documents. High muscle mass depresses estimated GFR with no true fall in filtration — the same physiology that raises the athlete creatinine ceiling — so a lean, heavily trained male reads low in this band relative to his actual kidney function; the Mar 2026 pair (creatinine 15 mg/L, eGFR 61) is that effect at its most misleading. Values are indexed to 1.73 m² body surface area; at 187 cm / 80 kg his BSA exceeds 1.73 m², so the indexed number understates absolute filtration. Anything that raises creatinine acutely — a hard session, creatine, a high-meat meal — pushes this number down within days and reverses just as fast. DELIBERATE DISAGREEMENT WITH THE EXISTING CUT: KDIGO's 60 and 90 are CKD staging boundaries that require persistence beyond three months plus evidence of kidney damage before they mean anything, while 80.7-160 is where 95% of healthy adults under 40 actually sit. In the 80.7-90 window a value is simultaneously 'below the KDIGO G1 boundary' and 'inside the healthy population distribution'; both are true and the cut, not the reference, is the one that speaks to risk. His labs' printed one-sided lower bound itself moved between 60 and 90 across draws — a convention shift, not an assay change.",
    "reviewed": "2026-08-02"
   },
   "note": "An estimate of how fast your kidneys are filtering blood, in millilitres per minute.\n\nIt is not measured. It is calculated from creatinine, age and sex, so every creatinine confound flows straight into it, including muscle mass and creatine use. A creatinine pushed up by supplements produces an eGFR pushed down, with nothing wrong with the kidney at all.\n\nWhich equation the lab used also changes the number, so the method matters as much as the result.\n\nNO OPTIMIZATION TARGET, DELIBERATELY. This is the creatinine equation, and creatinine is a muscle breakdown product. Muscle mass raises it, and creatine supplements raise it further, without either touching the kidney. Setting a floor at 90 would invent a problem out of exactly that situation: a creatinine eGFR in the 80s sitting beside a cystatin C eGFR far above it, in someone building muscle and taking creatine.\n\nKDIGO categories are shown as decision zones, but 60 to 89 is not chronic kidney disease without other evidence of kidney damage. Read this row beside cystatin C, and treat a gap between the two as the finding, not the lower number.",
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
   "reference": {
    "min": 8.96,
    "max": 22.69,
    "evidence": "strong",
    "label": "NORIP healthy-adult male interval, 18-49 y",
    "source": "NORIP multicentre Nordic adult study (Rustad et al., 2004), carbamide male 18-49 serum tier",
    "population": "Healthy Nordic men aged 18-49, n=649 serum (plasma n=252); NORIP's male 50+ tier starts higher (3.5 mmol/L) and the female 18-49 floor is lower (2.6), so the pooled intervals most labs print do not apply to a 31-year-old man.",
    "method": "Urease methods on serum or Li-heparin plasma corrected to the shared NORIP calibrator; one suggestion covers both matrices, so tube type needs no adjustment. Caveat: urea tracks dietary protein load and hydration independently of renal function, so a daily-training high-protein subject can sit legitimately in the top quarter — and the male-specific floor sits above the pooled floors labs print, so a low-protein-day result near 8 mg/dL would render low. Read the urea:creatinine ratio, not the absolute number.",
    "reviewed": "2026-07-31"
   },
   "note": "A nitrogen waste product from breaking down protein, cleared by the kidneys.\n\nRarely useful on its own. Its value is in the ratio to creatinine, which separates two situations that look alike. Dehydration raises urea much more than creatinine. Real kidney impairment raises both together.\n\nA high-protein diet also raises it, with nothing wrong with the kidney.",
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
   "reference": {
    "min": 46,
    "max": 256,
    "evidence": "moderate",
    "label": "US men 20-34 fasting, 5th-95th percentile (NHANES III)",
    "source": "NCEP ATP III Final Report Appendix III-A, Circulation 2002;106(25):3143-3421 (NHANES III 1988-94; 987 fasting US men aged 20-34)",
    "population": "Men aged 20-34 in the US civilian non-institutionalised population, NHANES III 1988-94, all race/ethnic groups, restricted to the morning fasting subsample, n=987, median 94 mg/dL against a mean of 118 — the skew is visible in the row itself. NOT health-screened: includes obesity, insulin resistance and heavy alcohol use, all of which raise triglycerides and stretch the upper tail badly.",
    "method": "Enzymatic serum triglycerides under the CDC Lipid Standardization Program at Johns Hopkins; his draws use Roche Cobas enzymatic and Beckman glycerol-phosphate-oxidase methods, and triglycerides are well standardised, so inter-method transfer is good. REQUIRES AN OVERNIGHT FAST — the NHANES subsample was morning-fasted and a non-fasting sample would sit materially higher, so this interval only applies to fasting draws. Triglycerides are also the most variable lipid within a person: biological CV is roughly 20-25%, and a single result moves with the preceding day's carbohydrate load, energy balance and training, so a change between draws is not automatically a trend. DESCRIPTIVE, NOT A THRESHOLD, AND THE SKEW IS EXTREME: the existing cut of 150 sits near only the 78th percentile, so most of the reference band above 150 is population, not health, and the existing target of <=100 sits near the population median. Alcohol is a major driver of the upper tail in this cohort and is absent in this subject, so the relevant comparison is against the lower half of the distribution. Training and low body fat lower triglycerides; a pooled athlete cohort averages about 87 mg/dL (Farrington et al., Sports Health 2026, 31 studies). US 1988-94 data applied to a French subject in 2026. Rung 1 searched and rejected: athlete data are pooled means, not percentile intervals. VIEWER NOTE: the max of 256 exceeds this marker's axis of [0,200] and the axis must be widened rather than the interval trimmed — shrinking a bound to fit an axis would silently misstate the source.",
    "reviewed": "2026-08-02"
   },
   "note": "Fat circulating in the blood, carried mainly on VLDL particles.\n\nIt is less a cardiovascular target in itself than a window onto metabolic health. High triglycerides usually travel with insulin resistance, and that is the thing worth acting on.\n\nIt responds sharply to what you did recently. The last meal moves it a lot, and alcohol moves it more. A non-fasted sample is close to uninterpretable, and even a fasted one still reflects the previous evening.",
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
    "evidence": "weak",
    "label": "Favourable fasting metabolic phenotype",
    "source": "Young-adult cardiometabolic associations (Bogalusa Heart Study); guidelines define no triglyceride treatment goal below 150mg/dL"
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
   "reference": {
    "min": 60,
    "max": 150,
    "evidence": "moderate",
    "label": "Adult male population interval (FINRISK 2007)",
    "source": "Leiviskä et al., Clin Chim Acta 2011;412(11-12):1146-1150 (FINRISK 2007 reference sample, n=2828)",
    "population": "Men aged 25-74 in the reference sample (n=2828 men and women combined) of the FINRISK 2007 national health survey, Finland. Sex-partitioned (men 0.6-1.5 g/L, women 0.6-1.3 g/L); not age-partitioned within adults. Population-survey participants, not screened athletes.",
    "method": "Automated immunoturbidimetric apoB, the same measurement principle as this subject's 'Immunoturbidimétrie'. The analyser and calibrator lot were not recoverable from the published record; apoB assays of this era and later are generally calibrated against the WHO-IFCC SP3-07 reference material, which is what makes apoB transfer between manufacturers better than most lipid measures — but that traceability is an INFERENCE here, not a verified property of the FINRISK run, and should not be upgraded to a stated fact. Fasting is not required for apoB (unlike calculated LDL-C), so the timing of his draw does not matter. TRANSFER LIMITS: these are male reference-sample percentile bounds pooled across ages 25-74, so they run HIGH for a 31-year-old — apoB rises with age through middle life, and a Finnish general population also carries a higher habitual apoB than a lean, trained, alcohol-free subject. Read the upper bound as 'where a middle-aged general population's 97.5th centile sits', not as a target. A rung-2 (sex AND age partitioned) apoB interval plausibly exists in NHANES-derived work and would be preferable for a 31-year-old; FINRISK is a legitimate rung-3 choice until one is verified. DELIBERATE DISAGREEMENT IN KIND WITH THE EXISTING CLAIMS, and it must be visible on screen: existingCut puts the risk-enhancer threshold at 130 mg/dL, existingTarget at <=90 and existingGoal at <=85, while this reference tops out at 150. A general adult male population routinely sits at concentrations that are already risk-enhancing, so 'inside the population interval' is NOT 'below the risk threshold'. His 94 mg/dL is mid-band for the population and just above his own target. His lab printed 66-133 mg/dL, narrower on both sides and most likely a manufacturer or desirable-value range rather than a 2.5th-97.5th population interval, so the overlap is weak corroboration only.",
    "reviewed": "2026-08-02"
   },
   "note": "A protein that sits on every particle able to lodge in an artery wall: LDL, VLDL and Lp(a). Each particle carries exactly one copy.\n\nSo ApoB counts the particles themselves. LDL measures the cholesterol they happen to be carrying, which is a different thing. When the two disagree, the particle count is what tracks risk. Two people with the same LDL can be carrying very different numbers of particles.\n\nIt also ignores triglycerides, which throw off calculated LDL.\n\nWHY THIS ONE IS MORE THAN A CORRELATION. Most biomarkers only travel alongside disease. This one has been tested two ways. People born with genes that keep ApoB low get less heart disease, and dozens of different genes all show it. And drugs that lower ApoB, whichever way they work, cut heart attacks in proportion to how far they lower it. Many different routes, the same result each time.\n\nIT ADDS UP OVER YEARS. What damages an artery is the total exposure: how high, for how long. One reading on its own says little. So the same number matters more at 30 than at 60, because there are more years left for it to accumulate. A small difference held for decades beats a big correction made late.\n\nWHEN IT DISAGREES WITH LDL, TRUST APOB. Sometimes LDL looks fine while ApoB is high. That happens when the particles are small and each one carries less cholesterol, which is common with high triglycerides or poor insulin sensitivity. In that situation the particle count is the number that tracks risk.\n\nWHAT MOVES IT. Swapping saturated fat for unsaturated does the most: about 1.5 to 2 mg/dL of LDL for every 1% of calories exchanged. Soluble fibre adds a few percent, plant sterols a few more. Losing visceral fat helps mainly by lowering triglycerides. Past that, what works is medication.\n\nONE CAVEAT ON THE TEST. It is measured directly, so it escapes the estimating formulas that distort calculated LDL. But labs calibrate against different standards, so switching lab can shift the number on its own.",
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
    "source": "2024 National Lipid Association apoB consensus and causal evidence for cumulative apoB-particle exposure"
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
   "reference": {
    "min": null,
    "max": 168.2,
    "evidence": "moderate",
    "label": "Population 90th percentile (White ancestry)",
    "source": "Patel et al., Arterioscler Thromb Vasc Biol 2021;41(1):465-474 (UK Biobank, n=460,506)",
    "population": "Adults aged 40-69 at enrolment in UK Biobank (n=460,506; 45.8% male). The stored bound is the 90th percentile of the White subgroup (median 19 nmol/L; whole-cohort median 19.6, IQR 7.6-74.8). Not sex-partitioned, not age-partitioned, not health-screened — a general-population distribution.",
    "method": "Latex-enhanced immunoturbidimetric Lp(a) (Randox reagent, Denka Seiken method, Beckman Coulter AU5800), reported natively in nmol/L and traceable to the WHO/IFCC reference material. Denka-based assays are the least apo(a)-isoform-sensitive of the commercial methods; this subject's 'Immunoturbidimétrie' shares the measurement principle but the French laboratory's kit and calibrator are not recorded, and Lp(a) kits still disagree by tens of nmol/L, so the bound transfers only approximately — which is why this is moderate rather than strong despite the cohort size. ASSAY RANGE: UK Biobank's reportable range was roughly 3.8-189 nmol/L, so both tails of the source distribution are truncated; 168.2 sits inside that window and is usable, but values near the floor are at or below what the assay reports rather than genuinely measured. SKEW AND ANCESTRY: the distribution is heavily right-skewed — a small minority carries most of the burden — and it is strongly ancestry-dependent. UK Biobank medians ran 19 nmol/L (White), 31 (South Asian), 75 (Black), 16 (Chinese), with 90th percentiles of 168.2, 139.5 and 211.7 nmol/L for White, South Asian and Black. The White bound is used on the assumption of European ancestry, which is NOT recorded in this file; if that assumption is wrong the percentile is wrong. NO LOWER BOUND is given on purpose: there is no clinical low limit for Lp(a) (Langsted & Nordestgaard, Eur Heart J 2021;42(12):1147-1156, n=109,440, found no harm at low concentrations). Lp(a) is roughly 80-90% genetically determined and near-constant through adult life, so one measurement usually settles the question; fasting, training and diet move it very little, which is also why a repeat draw is low-value. LAYER SEPARATION: his lab printed [null, 75] nmol/L, which is the ESC/EAS low-risk RISK CUT-OFF and not a population percentile — roughly a fifth of White adults exceed it, so the two do not corroborate each other. existingCut zones at 75 and 105 sit below this reference's ceiling: a large minority of the general population sits inside the risk-enhancing range, so the population band cannot be read as a safety band. His 7 nmol/L is low on both readings. VIEWER NOTE: 168.2 falls outside this marker's axis of [0,150]; widen to about 180 or the band will render with no top.",
    "reviewed": "2026-08-02"
   },
   "note": "An LDL particle with an extra protein wrapped around it. That makes it stickier in artery walls and harder to clear. It raises cardiovascular risk on its own, separately from LDL.\n\nAlmost entirely inherited, and essentially fixed for life, so this is not a number you move. One good measurement settles it, which is why it is usually checked once.\n\nUNITS: THIS MARKER TAKES nmol/L ONLY, AND THAT IS DELIBERATE. Labs also report Lp(a) as a mass in mg/dL, and the two do not convert. The apo(a) protein carries a variable number of repeats, so particles differ in size from person to person. The same mass can mean a very different number of particles. The 2.0 to 2.5 factor people quote is a population average, and in one individual it can be wrong by 40%. ESC and EAS both say not to convert, which is why there is no mg/dL option here.\n\nIf a report ever prints mg/dL, audit() will refuse it, because that unit is not listed. That is the right outcome. Stop, and either re-order in nmol/L or give mass its own marker, the way calculated and dialysed free testosterone are split.",
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
   "reference": {
    "min": 77,
    "max": 236,
    "evidence": "moderate",
    "label": "Nordic men 30-49, 2.5th-97.5th percentile (NORIP)",
    "source": "Ridefelt et al., Scand J Clin Lab Invest 2019;79(1-2):39-42 (NORIP; 1,236 healthy Nordic men, age stratum 30-49)",
    "population": "Healthy men aged 30-49 recruited as reference individuals in the Nordic Reference Interval Project across Denmark, Finland, Iceland, Norway and Sweden (1,236 men and 1,392 women total). Unlike the NHANES-based entries on this panel these ARE health-screened reference individuals selected under IFCC/NCCLS guidance, excluding known disease and lipid-lowering therapy — a genuinely better sampling frame, and a European population closer to this subject than the US survey.",
    "method": "Non-HDL-C is calculated as measured total cholesterol minus measured HDL-C — the same 'Calcul' his own labs perform — so the derivation transfers exactly and only the two input assays can differ. Percentiles were computed per IFCC guidance on the statistical treatment of reference values, in three age strata (18-29, 30-49, >=50) with sex partitioning. SOURCING CAVEAT, STATED PLAINLY AND NOT TO BE REMOVED: the paper's own table is paywalled and was not read. The numeric limits here (2.0-6.1 mmol/L) were taken from four independent Swedish clinical-laboratory handbooks that publish identical non-HDL intervals in exactly NORIP's three age strata and identical male/female splits; none names its source. Treat the attribution as VERY LIKELY rather than confirmed — that unread primary table is precisely why this is graded moderate rather than strong, since NORIP's design would otherwise qualify. HDL-C method is the main transfer risk, as on the hdl marker: Nordic laboratories of the NORIP era and his 2026 Roche and Beckman direct homogeneous assays are not interchangeable to within a few mg/dL, and that error passes straight into the subtraction. Non-HDL-C is relatively insensitive to fasting state, which is its practical advantage over LDL-C. DESCRIPTIVE, NOT A THRESHOLD: the 97.5th percentile of 236 mg/dL is far above the existing cut of 160 and further above the existing target of 130, so most of the upper reference band is population rather than health. At 31 this is a cumulative-exposure atherogenic burden marker and percentile rank is the least useful of the three claims. Rung 1 searched and rejected: no athlete or lean-male non-HDL percentile interval was located. VIEWER NOTE: the max of 236 exceeds this marker's axis of [0,200]; widen the axis. No lab has ever printed an lr for non-HDL-C in this file.",
    "reviewed": "2026-08-02"
   },
   "note": "Total cholesterol minus HDL. In other words, all the cholesterol riding on particles that can lodge in an artery wall, in one number.\n\nIt has two practical advantages over LDL. It needs nothing but a subtraction, so it avoids the formula that makes calculated LDL unreliable. And it stays valid when you have not fasted.\n\nIt also catches remnant particles that LDL alone misses.",
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
    "source": "International Atherosclerosis Society and National Lipid Association primary-prevention goals"
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
   "reference": {
    "min": 0.4,
    "max": 6.05,
    "evidence": "moderate",
    "label": "Healthy adult male 10th-90th centile",
    "source": "Rifai & Ridker, Clin Chem 2003;49(4):666-669 (pooled US cohorts, n=22,403 apparently healthy adults; male 10th/50th/90th centiles)",
    "population": "Apparently healthy US adult men, pooled across cohorts totalling 22,403 men and women (the male-only n is not recoverable). Sex-partitioned: male percentiles 10th 0.40, 50th 1.50, 90th 6.05 mg/L; female 0.29, 1.52, 6.61. Not age-, BMI- or smoking-partitioned. The number of constituent studies is not stated in any accessible source and is deliberately not claimed here.",
    "method": "High-sensitivity CRP immunoassay. CRP is among the better-harmonised serum proteins — commercial calibrators are traceable to an international protein reference material (CRM 470 / ERM-DA470k) — so it transfers between the Roche Cobas and Beckman platforms in this file more reliably than most analytes. That does not retire the dashboard's method warning on the 2026-03 Beckman draw; it only means the expected offset is small. The percentiles themselves were confirmed through a peer-reviewed article citing this source rather than from the paywalled original. THESE ARE 10th AND 90th PERCENTILES, not 2.5th/97.5th, so about one healthy man in five falls outside by construction — the band is narrower than a conventional reference interval and must not be read as one, or a fifth of normal results will be mis-scored. A LEAN NON-SMOKING MALE DISTRIBUTION SITS LOW: hs-CRP is driven far more by adiposity, smoking and intercurrent infection than by cardiovascular biology, and a 12%-body-fat, non-smoking, alcohol-free man should be expected between the 10th and 50th percentile. His four stored draws (0.5, 1.4, 1.0, 0.6 mg/L) do exactly that. TIMING: fasting is not required, but six-day-a-week resistance training plus a 30-minute HIT run can raise CRP transiently after a session, and any infection in the preceding fortnight invalidates a single reading — a value above 3 mg/L should be repeated when well before it is interpreted at all. LAYER SEPARATION: this band spans every zone of the existing CDC/AHA cut (1 and 3 mg/L) and its ceiling sits at roughly twice the 'high' cut-point. Most apparently healthy men are not in the low-risk category, and being inside the population band tells you nothing about which risk category you are in. VIEWER NOTE: 6.05 marginally exceeds this marker's axis of [0,6]; widen to 7.",
    "reviewed": "2026-08-02"
   },
   "note": "A protein the liver releases whenever there is inflammation anywhere in the body. The high-sensitivity version resolves the low range where cardiovascular risk sits. The standard version only covers the high range used to detect infection.\n\nIt is completely non-specific. A cold, a cut, a dental problem, or a hard training session in the days before the draw will all raise it.\n\nSo one high value means repeat it, not conclude anything. Only a persistently raised hs-CRP with no obvious cause counts.",
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
   "reference": {
    "min": 72,
    "max": 170,
    "evidence": "moderate",
    "label": "US men 20-34, 5th-95th percentile (NHANES III)",
    "source": "NCEP ATP III Final Report Appendix III-A, Circulation 2002;106(25):3143-3421 (NHANES III 1988-94; 970 fasting US men aged 20-34)",
    "population": "Men aged 20-34 in the US civilian non-institutionalised population, NHANES III 1988-94, all race/ethnic groups, restricted to the morning fasting subsample, n=970, median 119 mg/dL. NOT health-screened: includes obesity, diabetes and untreated familial hypercholesterolaemia; the survey predates widespread statin use, so treated individuals are few.",
    "method": "LDL-C is CALCULATED by the Friedewald equation in both NHANES III and every draw in this file ('Formule de FRIEDEWALD', 'Formule de Friedwald', 'Calculé selon la formule de Friedewald'), so the calculation itself transfers exactly — which is the one clean thing about this marker. Inputs were enzymatic total cholesterol and precipitation HDL-C under the CDC Lipid Standardization Program at Johns Hopkins; his inputs are Roche Cobas and Beckman enzymatic methods, so the HDL-C method difference propagates into the calculated LDL-C. Friedewald assumes fasting, is invalid above triglycerides of about 400 mg/dL, and underestimates LDL-C relative to the Martin-Hopkins estimate when LDL-C is low and triglycerides are high; the newer estimators would shift both this interval and his values in the same direction, so the comparison is more robust than either number alone. DESCRIPTIVE, NOT A THRESHOLD, AND THE GAP IS THE WIDEST ON THIS PANEL: the 95th percentile of 170 mg/dL is far above the existing cut of 130 and further above the existing target of 100. Interpolating this distribution, 130 sits near the 64th percentile and 100 near the 28th, meaning a majority of young US men in 1988-94 sat above the optimisation target. LDL-C is causal for atherosclerosis and cumulative over decades, so at 31 the relevant question is particle-years, not percentile rank — a value inside 72-170 is emphatically not evidence that the concentration is harmless, and the percentile is the least informative of the three claims on this row. Fasting is assumed. US 1988-94 data applied to a French subject in 2026. Rung 1 searched and rejected: a pooled athlete cohort averages about 94 mg/dL (Farrington et al., Sports Health 2026, 31 studies) but the athlete literature reports means, not percentile intervals. No lab has ever printed an lr for LDL-C in this file, so there is no local corroboration.",
    "reviewed": "2026-08-02"
   },
   "note": "The cholesterol carried on LDL particles, and the main target of lipid treatment.\n\nUsually not measured. Most labs calculate it from total cholesterol, HDL and triglycerides, using a formula that assumes a fixed relationship between them. That assumption breaks down in the two places it matters most:\n\n• When LDL is low, the estimate drifts\n• When triglycerides are high, it comes out too low\n\nSo it is worth knowing whether a result was measured directly or calculated.\n\nWHICH FORMULA WAS USED MATTERS. Friedewald is the old one. It breaks down below about 70 mg/dL, and above 400 mg/dL of triglycerides. Martin-Hopkins adjusts to each sample instead of using one fixed factor, and is clearly better at low LDL. Sampson was built for the high-triglyceride end. A lab that switches formula changes your number without anything changing in you, so record which one printed the result.\n\nIT CAUSES THE DISEASE, IT DOES NOT JUST PREDICT IT. People born with genes that keep LDL low get less heart disease. Drugs that lower it cut heart attacks in proportion to how far they lower it, whichever way they work. And what counts is the total over time, not one reading, so the same value weighs more the younger you are.\n\nWHY APOB IS OFTEN THE BETTER NUMBER. This measures the cholesterol being carried. ApoB counts the particles carrying it. The two can disagree, usually when triglycerides are high or insulin sensitivity is poor and the particles run small. Then this number looks reassuring while the particle count is high.\n\nWHAT MOVES IT. Swapping saturated fat for unsaturated does the most: about 1.5 to 2 mg/dL for every 1% of calories exchanged. Add 5 to 10g of soluble fibre a day for roughly another 5%, and 2g of plant sterols for 8 to 10%. Losing visceral fat works mostly by lowering triglycerides. These stack, but they are all modest, and a large gap will not close on diet alone.\n\nTHE CUT-OFFS ARE LINES DRAWN ON A SLOPE. 130 and 190 mg/dL are where guidelines chose to act. Nothing changes in the artery at those numbers, and risk climbs steadily from well below them. Being under one means less exposure, not none.",
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
    "source": "International Atherosclerosis Society primary-prevention goal and causal evidence for cumulative LDL exposure"
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
   "reference": {
    "min": 28,
    "max": 69,
    "evidence": "moderate",
    "label": "US men 20-34, 5th-95th percentile (NHANES III)",
    "source": "NCEP ATP III Final Report Appendix III-A, Circulation 2002;106(25):3143-3421 (NHANES III 1988-94; 2,285 US men aged 20-34)",
    "population": "Men aged 20-34 in the US civilian non-institutionalised population, NHANES III 1988-94, all race/ethnic groups, n=2,285, median 45 mg/dL, 90th percentile 62. NOT health-screened: includes obesity, smoking, insulin resistance and untreated dyslipidaemia, all of which lower HDL-C.",
    "method": "HDL-C measured after a precipitation step (heparin-manganese era chemistry) at the Johns Hopkins Lipoprotein Analytical Laboratory under the CDC Lipid Standardization Program. THIS IS THE WEAKEST TRANSFER OF THE FOUR NHANES LIPIDS: his 2026 results come from direct homogeneous HDL assays (Beckman spectrophotometric, Roche Cobas enzymatic), and precipitation and direct methods differ by several mg/dL, with further between-manufacturer disagreement among direct assays — accept a few mg/dL of method bias against this interval. DESCRIPTIVE, NOT A THRESHOLD, AND THE GAP IS LARGE HERE: the 5th percentile of 28 mg/dL is far below the existing cut of 40. In this distribution 40 mg/dL sits near the 32nd percentile, so 'low HDL-C' by the risk definition flags roughly the bottom third of US men aged 20-34 — a value can be entirely ordinary for the population and still be a risk marker. Do not let the reference band overwrite the cut, and do not present 28 as a safe floor. Also note the inverse: HDL-C is not an intervention target, so sitting high in this interval is descriptive only and the drug trials that raised HDL-C did not lower events. Training and low body fat raise HDL-C; a pooled athlete cohort averages about 59 mg/dL (Farrington et al., Sports Health 2026, 31 studies) against a population median of 45, so a lean trained man should expect to sit in the upper half. Fasting state is not a material limit for HDL-C. US 1988-94 data applied to a French subject in 2026. Rung 1 searched and rejected: athlete data are pooled means, not percentile intervals. His four printed lab ranges (>54 in 2020/2022, 40-60 in 2026-03, >40 in 2026-07) are all risk-derived decision limits, not percentiles — the 2026-03 ceiling of 60 sits below this population's 90th percentile of 62, which is exactly why an lr must never be read as a marker-wide judgement band.",
    "reviewed": "2026-08-02"
   },
   "note": "Cholesterol on HDL particles, long called the \"good\" cholesterol because higher levels go with lower risk in population studies.\n\nThat description has not survived testing. Drugs that raise HDL do not prevent heart attacks, and people born with genes that keep it high lifelong get no protection. So the association looks like a marker of something else, not a cause.\n\nVery high values are linked to higher mortality, not lower. That is why there is deliberately no target here.",
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
   "reference": {
    "min": 131,
    "max": 253,
    "evidence": "moderate",
    "label": "US men 20-34, 5th-95th percentile (NHANES III)",
    "source": "NCEP ATP III Final Report Appendix III-A, Circulation 2002;106(25):3143-3421 (NHANES III 1988-94; 2,298 US men aged 20-34)",
    "population": "Men aged 20-34 in the US civilian non-institutionalised population, NHANES III 1988-94, all race/ethnic groups, n=2,298, median 183 mg/dL. NOT health-screened: the sample includes obesity, diabetes, smoking and untreated dyslipidaemia.",
    "method": "Enzymatic serum cholesterol assayed at the Johns Hopkins Lipoprotein Analytical Laboratory under the CDC Lipid Standardization Program. His draws use Roche Cobas enzymatic and Beckman cholesterol-oxidase methods; total cholesterol is among the best-standardised analytes in clinical chemistry, so inter-method transfer is good and the assay-change warning matters less here than for HDL. Fasting state is not a material limit — total cholesterol moves little with a meal. DESCRIPTIVE, NOT A THRESHOLD: this is where a general population SAT, not where risk changes. The existing cut (desirable <200, borderline 200-240, high >=240) is the risk statement; interpolating this distribution, 200 falls near the 65th percentile and 240 near the 92nd, so the reference band extends well into what the cut calls high. Do not read a value inside 131-253 as reassurance. Temporal and geographic transfer: US 1988-94 data applied to a French subject in 2026, and population total cholesterol has drifted downward since, so this interval likely runs a few mg/dL high. Not a trained-male interval — a pooled athlete cohort averages about 168 mg/dL (Farrington et al., Sports Health 2026, scoping review of 31 studies, 5,921 athletes), so a lean trained man should expect to sit below the population median of 183 rather than at it. Rung 1 was searched and rejected: the athlete literature offers pooled, largely sex-combined means, not percentile-based intervals.",
    "reviewed": "2026-08-02"
   },
   "note": "Every cholesterol molecule in the blood, across all particle types.\n\nIt is kept mostly out of convention, and as the input to non-HDL. On its own it says very little, because it adds together particles that raise risk and particles that do not.\n\nA perfectly normal total can hide a high LDL that happens to be offset by a high HDL.",
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
   "reference": {
    "min": 72,
    "max": 103,
    "evidence": "moderate",
    "label": "Elite-athlete fasting glucose interval",
    "source": "Díaz Martínez et al., Int J Environ Res Public Health 2022;19(5):3059 (elite athletes)",
    "population": "Same cohort as the triglyceride entry: 3588 Spanish elite athletes across 32 sports, 2258 men / 1330 women, mean age ~25, 97.35% aged 18–40, 13,929 fasting glucose samples 2011–2020. SEX-POOLED — identical limits, identical 90% CIs and n=13,929 in both sex columns. Sex partitioning is weakly warranted here anyway: NORIP calculated a male-only serum interval of 4.17–6.21 mmol/L but still recommended a combined-sex suggestion of 4.0–6.0.",
    "method": "Beckman Coulter AU400; fasting morning venous sample 09:00–10:00 after a night's rest, no post-exercise samples. The subject's Mar 2026 draw was Beckman hexokinase and Jul 2026 Roche Cobas hexokinase — both IFCC-traceable, so calibration transfers cleanly. Caveats that matter. (1) The paper does not state the specimen matrix; NORIP measured serum roughly 0.2–0.3 mmol/L (4–5 mg/dL) BELOW Li-heparin plasma for glucose (serum suggestion 4.0–6.0 vs plasma 4.2–6.3), so a systematic offset of that size against a French plasma or fluoride result is possible and the upper limit should not be read to the last mg/dL. (2) Repeated measures pooled without adjustment (13,929 samples, ~3588 athletes). (3) This is a population spread, not a diagnostic rule: the 97.5th percentile of 103 mg/dL sits 3 mg/dL above the ADA impaired-fasting-glucose threshold of 100 mg/dL, which is inside analytical plus biological noise — the ADA cut still carries the diagnostic claim, and the reference should not be read as licensing 101–103. Append: 'Beckman Coulter AU400 enzymatic assay on SERUM — 8.5- or 5-mL tubes with clot activator and separator gel (Methods, verbatim); the separation delay is not stated, and gel serum loses glucose to in-vitro glycolysis, so this band is probably biased low against a fluoride- or heparin-plasma result and the subject's French draws (tube type unreported) will tend to sit high within it. Sampled fasting, after a night's rest, no post-exercise samples; 97.35% aged 18-40. Sex was TESTED in this cohort and not partitioned (no significance marker on the glucose row), which is a stronger warrant for pooling than an external analogy. Athletes did differ significantly from the general-population comparator (74-106 mg/dL), but the difference is only 2-3 mg/dL at each end — a population difference of unattributed cause, since delayed serum glycolysis biases glucose downward and this evidence cannot separate that from training. TWO EDGE CONFLICTS WITH THIS MARKER''S OWN ADA CUT, both verified against the viewer''s claim() precedence: the 72 floor sits above the cut''s low threshold of 70 and above the Jul 2026 lab''s printed 0.70 g/L, so 70-71 renders as out-of-reference at top severity while the diagnostic layer calls it normal; and above 103 the out-of-reference label replaces the ADA ''Impaired fasting glucose'' grading, escalating watch to out. Values of 100-103 are unaffected and still render as ADA watch. n=13,929 samples, not athletes; repeated sampling is not addressed, so the printed 90% CIs are too narrow.' Delete the unverified NORIP glucose figures rather than shipping them in a rendered field — they could not be checked (tandfonline 403, furst.no/norip and labquality 404, web-search budget exhausted) and the entry does not need them. FULL CITATION: Díaz Martínez AE, Alcaide Martín MJ, González-Gross M. Basal Values of Biochemical and Hematological Parameters in Elite Athletes. Int J Environ Res Public Health. 2022;19(5):3059 (PMID 35270750). Table 1, Gluc row: 2.5–97.5 percentile reference interval 3.98–5.72 mmol/L, 90% CI 3.94–4.00 and 5.72–5.77, flagged p<0.01 versus the general-population comparator of 4.11–5.89 mmol/L — trained adults sit measurably lower.",
    "reviewed": "2026-07-31"
   },
   "note": "Blood sugar after an overnight fast. The simplest screen for how well glucose is regulated.\n\nIts weakness is timing. Fasting glucose is the last thing to move as regulation deteriorates. The body holds it normal for years by making more insulin, so it can look fine long after the underlying problem started.\n\nIt is also a single snapshot, shifted by last night's meal, poor sleep and stress. HbA1c answers the same question with far less noise.",
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
   "reference": {
    "min": 4.1,
    "max": 6.1,
    "evidence": "moderate",
    "label": "SHIP healthy-adult interval, men 20–39",
    "source": "Masuch et al., BMC Endocr Disord 2019;19:20 (SHIP, men 20-39)",
    "population": "1804 healthy adults from two German population-based cohorts in West Pomerania — SHIP-0 (1997–2001, n=817) and SHIP-Trend (2008–2012, n=987) — screened to exclude self-reported diabetes or diabetes medication, hypertension, BMI ≥30, eGFR ≤60, any medication other than thyroid or sex hormones, anaemia (a genuine confounder for HbA1c), and any history of stroke, myocardial infarction, hepatitis, cirrhosis or cancer. Partitioned by sex AND age; the cell used is men 20–39, which brackets the subject at 31. Not a trained cohort: the only fitness criterion is BMI <30, so this is a general lean-to-overweight European male band, one rung below athlete-specific.",
    "method": "Bio-Rad Diamat cation-exchange HPLC, NGSP-certified and DCCT-aligned. The interval assumes an NGSP-certified, IFCC-traceable method AND a normal red-cell lifespan. The subject's Sebia Capillarys capillary electrophoresis is NGSP-certified and is less disturbed by haemoglobin variants and carbamylation than HPLC, but a ±0.2–0.3 percentage-point difference between certified methods is still expected, so treat the limits as soft to that width. Two things must be said out loud. (1) The reference population was screened only for SELF-REPORTED diabetes, so undiagnosed dysglycaemia remains inside it, and the 97.5th percentile of 6.1% therefore sits above the ADA prediabetes threshold of 5.7%. That is replicated, not an artefact — Pani et al. found a 97.5th percentile of 6.0% in Framingham Offspring participants under 40 (5.6% in NHANES 2001–2004), and showed A1c rises with age even after excluding IFG and IGT. Glycaemic risk belongs in the cut; this band is only a statement about where healthy young men sit. (2) The LOWER limit is the half that earns this reference its place: the marker's cut has no floor, and a value under 4.1% reads as shortened red-cell survival or haemolysis, not as excellent control. Replace the assay sentence with: 'Assumes cation-exchange HPLC (Bio-Rad Diamat, Munich) as used in SHIP; NGSP/DCCT alignment is an assumption this interval requires, not something the paper states. SHIP-0 (1997-2001) and SHIP-Trend (2008-2012) are pooled across the NGSP/IFCC re-standardisation era, and this subject''s results are Sebia Capillarys capillary electrophoresis — a different separation principle, well-correlated but capable of a 0.1-0.2 point bias, which is material when comparing small longitudinal changes. Population: 1804 healthy German adults, men 20-39 tier; exclusions included self-reported diabetes or diabetes medication, hypertension, BMI>=30, eGFR<=60, anaemia, pregnancy, medication other than thyroid or sex hormones, and history of stroke, MI, hepatitis, cirrhosis or cancer. No per-partition sample size is reported, so whether the men 20-39 cell met CLSI n>=120 is unknown — hence moderate, not strong. CEILING CAVEAT: diabetes was excluded by self-report only, never by OGTT or glucose, so the 97.5th percentile carries undiagnosed dysglycaemia; Pani et al., Diabetes Care 2008;31(10):1991-6 gives 5.6% (NHANES 2001-04) and 6.0% (Framingham Offspring) for age under 40, so comparable cohorts span 5.6-6.1%. This is a population percentile, not a health threshold: the ADA cut on this marker carries the decision, and above 6.1% the out-of-reference label will displace the ADA grading. For a trained subject the lower bound is likewise descriptive only — HbA1c tracks red-cell lifespan, which training shortens.' FULL CITATION: Masuch A, Friedrich N, Roth J, Nauck M, Müller UA, Petersmann A. Preventing misdiagnosis of diabetes in the elderly: age-dependent HbA1c reference intervals derived from two population-based study cohorts. BMC Endocr Disord. 2019;19:20 (doi 10.1186/s12902-019-0338-7). Table 3, men aged 20–39: 21.3–43.2 mmol/mol (4.1–6.1%).",
    "reviewed": "2026-08-04"
   },
   "note": "A snapshot of the past three months, not of this morning. Glucose slowly sticks to haemoglobin inside red cells. A red cell lives about 120 days, so the fraction that is coated reflects your average blood sugar over that window, weighted toward the most recent weeks.\n\nThe main trap: anything that shortens red cell lifespan gives glucose less time to attach, so the result comes out lower than your true average. It is only as reliable as the blood count sitting next to it.",
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
   "reference": {
    "min": 2.43,
    "max": 11.89,
    "evidence": "weak",
    "label": "Lean healthy adult male interval",
    "source": "Schrank et al., Arch Endocrinol Metab 2024;68:e230483 (Brazilian laboratory database, n=3108 lean normoglycaemic men)",
    "population": "Men aged 20-60 (n=3,108) from a large Brazilian clinical-laboratory database (146,497 records screened), restricted to BMI 18.5-24.9 kg/m², fasting glucose <100 mg/dL, HbA1c <5.7%, triglycerides <150 mg/dL, HDL-C >=40 mg/dL, and taking no antidiabetic, lipid-lowering or antihypertensive medication. Sex-partitioned and metabolically screened. NOTE the rung claim rests on ANTHROPOMETRIC leanness (a BMI screen on a laboratory database), not on a trained or body-composition-verified cohort — it is not an athlete study. It does apply to him: 80 kg / 1.87 m gives BMI 22.9, inside the cohort's window, and his metabolic criteria would also pass.",
    "method": "Electrochemiluminescence immunoassay (ECLIA), Roche Diagnostics reagents on a Roche/Hitachi Cobas e411; fasting samples; intra-assay CV 1.2%, inter-assay CV 3.5%. THE DOMINANT CAVEAT IS NON-TRANSFERABILITY, and it is why this is graded weak despite a large well-screened cohort: this subject's insulin is measured by DiaSorin LIAISON XL CLIA, a different platform, and insulin immunoassays are not standardised. The ADA/IFCC Insulin Standardization Work Group compared 10 commercial methods from 9 manufacturers against an isotope-dilution LC-MS/MS reference procedure and found substantial, calibrator-dependent disagreement (Miller et al., Clin Chem 2009;55(5):1011-1018). Treat these limits as an order-of-magnitude guide, not a cut-off applicable to a LIAISON number. A LATENT UNIT DEFECT WORTH FIXING SEPARATELY: the paper prints its male interval as 2.43-11.89 µU/mL = 14.6-71.6 pmol/L, implying 6.00 pmol/L per µU/mL, whereas this file's pmol/L multiplier (0.144) implies 6.944 — the older insulin standard. Nothing stored here is affected, because the bounds were taken from the paper's µU/mL column and the only existing result is already in mUI/L, but any future insulin entered in pmol/L will convert about 16% high. Other limits: the cohort is Brazilian and retrospective (a laboratory database, not prospectively recruited volunteers), so referral bias is possible even after the metabolic exclusions; the BMI and lipid screening makes the interval lower and narrower than a routine unselected lab range, which is a feature here and would mislead in a general population. TIMING: requires a true overnight fast — a non-fasting sample, or one soon after a heavy session or a carbohydrate load, is uninterpretable. Insulin has large within-person biological variation, so a single value near either boundary means little without a repeat. His lab printed 3.2-16.3 µIU/mL on the LIAISON XL; the 4.4 µIU/mL gap at the ceiling is exactly the between-assay and between-population difference described above, not evidence that either interval is wrong. This is a population/lean-cohort reference, NOT an insulin-resistance threshold.",
    "reviewed": "2026-08-02"
   },
   "note": "The hormone that moves glucose out of the blood and into cells, measured fasting.\n\nThe reason to track it is timing. As cells become resistant, the pancreas compensates by making more insulin, and it succeeds for years. Glucose stays normal the whole time. Insulin is what rises first, which makes it the early warning fasting glucose cannot give you.\n\nCaveat: insulin assays are not standardised, so absolute values do not carry between labs.",
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
   "reference": {
    "min": 3.87,
    "max": 8.07,
    "evidence": "strong",
    "label": "NORIP healthy-adult male interval",
    "source": "NORIP multicentre Nordic adult study (Rustad et al., 2004), urate male 18+",
    "population": "Healthy Nordic men aged 18 and over, n=1232 serum (plasma n=503); no age partition in men. Male-specific by necessity — the female 18-49 interval is 155-350 umol/L, roughly a third lower.",
    "method": "Uricase/peroxidase colorimetry corrected to the shared NORIP calibrator; one suggestion covers serum and Li-heparin plasma, and both draws are Roche Cobas enzymatic colorimetry, the same family. Caveat: this is a population distribution, not a safe zone — the male 97.5th percentile (8.07 mg/dL) sits well above the ~6.8 mg/dL monosodium-urate saturation point, so a value inside this band can still be crystallising. Gout and cardiometabolic thresholds belong in a cut.",
    "reviewed": "2026-07-31"
   },
   "note": "The waste product left when your body breaks down purines, cleared by the kidneys.\n\nThere are two reasons to watch it. Above a certain concentration it crystallises in joints, which is gout. And it rises alongside insulin resistance and high fructose intake, which makes it a rough metabolic marker.\n\nIt also rises temporarily with fasting, dehydration and intense exercise. All three push it up with nothing changing underneath.",
   "axis": [
    2,
    9
   ],
   "cut": {
    "label": "Urate saturation point",
    "source": "2020 ACR gout guideline (FitzGerald et al., Arthritis Care Res 2020;72(6):744-760)",
    "zones": [
     {
      "max": 6.8,
      "label": "Below the monosodium-urate saturation point",
      "level": "ok"
     },
     {
      "min": 6.8,
      "label": "Hyperuricaemia; treating it without gout has no outcome benefit",
      "level": "watch"
     }
    ]
   }
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
   "reference": {
    "min": null,
    "max": 30,
    "evidence": "moderate",
    "label": "Healthy-population ALT upper limit, adult men",
    "source": "Prati et al., Ann Intern Med 2002;137(1):1-10 (6,835 Italian first-time blood donors)",
    "population": "Adult male first-time blood donors in Milan, 1995-1999. The 6,835 is the whole screened donor cohort of both sexes; the 30 U/L limit comes from the metabolically clean male SUBGROUP within it — donors negative for anti-HCV and HBsAg, then further filtered to those without excess BMI, abnormal lipids or abnormal carbohydrate metabolism — so the number rests on a fraction of that total, not on 6,835 men. Not age-partitioned, not lean or trained specifically.",
    "method": "Local Milan assay, 37 C, NOT documented as traceable to the IFCC reference measurement system, so this transfers to his Roche Cobas and Beckman results only approximately — the main reason this is moderate rather than strong. The study reports an UPPER limit only (the 95th percentile of the healthy male subgroup), which is why min is null: no lower bound was published, and a low ALT is not a defined abnormality. Deliberately chosen over the wider standardised interval: the IFCC multicentre study (Ceriotti et al., Clin Chem Lab Med 2010;48(11):1593-1601) gives adult men 9-59 U/L, and his own labs printed 10-40 then <50 UI/L; the healthy-ULN literature is the more informative band for a metabolically screened man, and ACG 2017 (Kwo et al., Am J Gastroenterol 2017;112(1):18-35) restates the true healthy male upper limit as 29-33 U/L, bracketing this 30. Further caveats: (1) resistance training raises ALT from muscle as well as liver, less than it raises AST but measurably, so a post-training draw can breach 30 U/L benignly; (2) his analyser AND his printed interval both changed between 2022 and 2026, so the assay-change warning applies; (3) ALT tracks BMI, hepatic fat and insulin resistance more than anything else in a healthy man, so this ceiling reads as a metabolic signal, not a hepatocyte-death signal; (4) haemolysis inflates ALT; (5) no fasting requirement is assumed. LAYER SEPARATION: the existing cut breaks at 33 U/L, the top of ACG 2017's healthy-male range, and this reference at 30 is the Prati 95th percentile — two readings of the same literature, not a conflict. Keep the roles separate: the cut at 33 drives row colour and the flagged filter; this reference is descriptive only and must not be re-presented as the risk threshold. All four stored results (25, 20, 22, 17 U/L) sit under 30.",
    "reviewed": "2026-08-02"
   },
   "note": "An enzyme that lives inside liver cells. When those cells are damaged it leaks into the blood, so a rise means liver injury.\n\nOf the two transaminases, this is the liver-specific one, and that is what makes the pair useful together. AST is also plentiful in muscle. ALT largely is not. So if AST climbs while ALT stays put, the source is muscle, not liver.",
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
   "reference": {
    "min": 11,
    "max": 34,
    "evidence": "strong",
    "label": "IFCC standardised adult AST",
    "source": "Ceriotti et al. (IFCC C-RIDL/C-RSE), Clin Chem Lab Med 2010;48(11):1593-1601 (765 healthy adults, Milan/Beijing/Bursa/Nordic)",
    "population": "354 men and 411 women aged 18-85 from four regions (Italy, China, Turkey, Nordic countries), selected as healthy by questionnaire plus other laboratory results. The authors reported a SINGLE interval for both sexes for AST, while partitioning ALT and GGT by sex in the same paper — so the unpartitioned shape here is the source's own deliberate choice, not a limitation of this entry. Not age-partitioned, not lean or trained.",
    "method": "Assumes commercial analytical systems standardised to the IFCC 37 C reference measurement system for AST; published as 11-34 U/L (0.18-0.57 µkat/L). Caveats: (1) the IFCC reference procedure uses pyridoxal-5-phosphate; many routine European assays run without P5P and read lower (commonly around 10%), so transfer to his Roche Cobas and Beckman results is imperfect in the downward direction, which if anything makes his numbers look better than they are relative to this band. (2) His printed lab intervals were 10-40 U/L in 2020/2022 and <50 U/L in 2026, both wider than this band; the analyser and the printed interval BOTH changed between 2022 and 2026, so the dashboard's assay-change warning applies. (3) AST is not liver-specific — it is abundant in skeletal muscle. Six resistance sessions a week plus a HIT run mean a draw taken 24-72 h after heavy lifting can push AST above 34 U/L with no hepatic event whatsoever; this cohort was not screened for recent exercise, so a training-timed excursion is a method artefact against this interval, not a finding. (4) Fasting is not required for AST and this interval does not assume it. (5) Haemolysis raises AST substantially — a difficult draw is a common false high. This is a population reference interval only; no AST risk threshold is asserted. All four stored results (31, 28, 25, 22 U/L) fall inside, with the 2020 value close to the ceiling.",
    "reviewed": "2026-08-02"
   },
   "note": "An enzyme found in liver cells, but also in skeletal muscle and heart. It leaks into the blood whenever any of those are damaged.\n\nThat breadth is its weakness. Hard training damages muscle fibres as a normal part of adaptation, and that raises AST with the liver completely untouched.\n\nSo read AST alongside ALT. Both rising points to the liver. AST rising on its own points to muscle.",
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
   "reference": {
    "min": 12,
    "max": 68,
    "evidence": "moderate",
    "label": "IFCC C-RIDL non-Nordic common male interval",
    "source": "IFCC C-RIDL / C-RSE multicentre study (Ceriotti et al., Clin Chem Lab Med 2010;48:1593-1601)",
    "population": "Healthy adult MEN aged 18-85, 354 of 765 subjects, in Milan, Beijing and Bursa; the Nordic group was excluded from the GGT calculation because its limits ran far higher. Male-specific — the female interval is 6-40 U/L.",
    "method": "Commercial systems traceable to the IFCC 37 C reference measurement procedure, so the assay does not move the number. Caveat: the population does — the male 97.5th percentile was 114 U/L in Scandinavia against 69 Milan, 66 Bursa, 64 Beijing, tracking alcohol and adiposity, and the authors conclude a common worldwide GGT interval is unlikely. NORIP's Nordic male 18-39 tier is 10-80 and AACB/RCPA harmonise at 5-50 U/L; this subject is 31 and lean, at the low-exposure end.",
    "reviewed": "2026-07-31"
   },
   "note": "An enzyme concentrated in the small bile ducts inside the liver.\n\nIt does two jobs. First, it settles an ambiguous alkaline phosphatase: ALP comes from both liver and bone, and a raised GGT alongside it means the source is liver. Second, it is the most sensitive routine marker of alcohol intake.\n\nCaveat: many ordinary medications push it up with no liver injury at all.",
   "axis": [
    0,
    90
   ]
  },
  {
   "id": "alp",
   "cat": "liver",
   "dec": [
    "Vitamin D3 5000 IU + K2"
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
   "reference": {
    "min": 40,
    "max": 120,
    "evidence": "moderate",
    "label": "North Denmark uniform adult interval (IFCC 37 C)",
    "source": "North Denmark method-stratified reference-interval study (Philipsen, Andersen & Andersen, Scand J Clin Lab Invest 2026;86(2):150-157), which postdates NORIP's 35-105 U/L for this analyte on a far larger and method-stratified sample",
    "population": "Danish adults of both sexes, the source stating no age floor: 120 health-screened blood donors plus 183,267 routine general-practice samples read indirectly — only the donor tier is a healthy cohort. ALP is not sex-partitioned in adults — NORIP's own partitioning test was uncertain for both sex and age, and AACB/RCPA and UK Pathology Harmony likewise publish a single adult interval.",
    "method": "Enzymatic ALP at 37 C traceable to the IFCC reference procedure, verified across Alinity, Atellica and Cobas; the Cobas-specific healthy limits were 42-118 U/L and the region implemented a uniform 40-120. Caveat: the ceiling is the least settled figure on the panel — 105 (NORIP, now retired), 110 (AACB/RCPA), 129 (Roche male insert), 130 (UK Pathology Harmony); the floor is stable at 30-42 everywhere.",
    "reviewed": "2026-07-31"
   },
   "note": "An enzyme that comes from two unrelated places, bile ducts and bone. That is what makes it ambiguous on its own.\n\nA raised ALP means either the liver or the skeleton, and this number cannot tell you which. GGT settles it: raised alongside means liver, normal alongside means bone.\n\nIt runs high naturally during adolescent growth and while a fracture heals. Neither is a problem.",
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
   "reference": {
    "min": 0.29,
    "max": 1.46,
    "evidence": "strong",
    "label": "NORIP healthy-adult interval, total bilirubin",
    "source": "NORIP multicentre Nordic adult study (Rustad et al., 2004)",
    "population": "Healthy Nordic adults of both sexes aged 18 and over, n=2738 serum; no sex or age partition — men run slightly higher than women but not enough to partition.",
    "method": "Diazo total bilirubin with calibration corrected to a DGKC reference-method target; NORIP's 15.1% figure for it is a desirable-bias goal, not a measured between-platform bias, and the paper found the limits near-identical with or without calibrator correction. Caveat: a healthy population retains the 5-8% with Gilbert's syndrome, which is why NORIP's 25 umol/L ceiling exceeds the AACB (20) and UK Pathology Harmony (21) clinical limits — just above the line is usually benign unconjugated hyperbilirubinaemia, not liver injury. Rises with prolonged fasting, falls with light exposure; a low value has no adverse meaning.",
    "reviewed": "2026-07-31"
   },
   "note": "The yellow pigment left over when old red blood cells are broken down. The liver picks it up, processes it, and sends it out in bile.\n\nSo it rises either when the liver cannot process it, or when red cells are being destroyed faster than usual.\n\nBy far the commonest finding is neither. A mildly raised unprocessed bilirubin is usually Gilbert's syndrome, a harmless inherited quirk in about 1 in 20 people. It shows up more clearly with fasting, illness or stress.",
   "axis": [
    0,
    2
   ]
  },
  {
   "id": "alb",
   "cat": "liver",
   "dec": [
    "Vitamin D3 5000 IU + K2"
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
   "reference": {
    "min": 3.6,
    "max": 4.8,
    "evidence": "moderate",
    "label": "NORIP adult serum albumin, 18-39 y",
    "source": "Rustad et al. (NORIP), Scand J Clin Lab Invest 2004;64(4):271-284 (3,036 healthy Nordic adults, 102 laboratories)",
    "population": "Healthy adults from Denmark, Finland, Iceland, Norway and Sweden, evenly distributed for sex and age; the 18-39 year serum partition used here rests on N=1010 and is the band the subject (31) falls in. Age-partitioned but sexes COMBINED — the source reports albumin sex-combined, so this is not a male-specific interval. Not lean or trained.",
    "method": "NORIP suggested interval 36-48 g/L for ages 18-39 (calculated limits 36.5-47.9), measured on Nordic routine analysers harmonised to a common calibrator. The chemistry mix is not itemised in the source for albumin; dye-binding (bromocresol green) predominance is an INFERENCE from the era and from the follow-up literature, not something NORIP reports. This is the weak joint: the 2022 result came off a Roche Cobas spectrophotometric albumin and the 2026 result off a Roche immunoturbidimetric albumin, and albumin methods do NOT agree — published comparisons put BCG about 4-5 g/L above bromocresol purple and above capillary zone electrophoresis, and a Nordic follow-up (Christensen PA, Scand J Clin Lab Invest 2017;77(6):472-476) states outright that the NORIP albumin interval is not fit for current BCP methods. So a method change alone can move this marker several g/L, and his own two draws used two different techniques — the dashboard's assay-change warning applies and should be read before anything else here. Both stored results (52.9 and 51 g/L = 5.29 and 5.1 g/dL) sit ABOVE this band's ceiling, and that is the honest picture: his labs printed a much higher ceiling (35-52 g/L), which is itself evidence that their calibration reads high relative to NORIP. Three further reasons a genuinely healthy value can exceed the band: prolonged tourniquet or upright posture concentrates plasma proteins by up to 10%, mild dehydration at a fasted morning draw does the same, and a lean well-nourished 31-year-old male sits naturally at the top of any albumin distribution. Read a high albumin here as haemoconcentration or calibration, not as pathology — low albumin, not high, is the clinically meaningful direction, and no albumin risk threshold is asserted. Note also the file's derive() rule: corrected calcium is deliberately not computed above 40 g/L albumin, so this marker being high is why that derived row is empty.",
    "reviewed": "2026-08-02"
   },
   "note": "The most abundant protein in blood, made by the liver. It carries hormones, drugs and calcium, and holds fluid inside your blood vessels by osmotic pull.\n\nTracked for liver output and nutritional status.\n\nIt matters here for a second reason. It feeds into both corrected calcium and calculated free testosterone, so however albumin was measured carries into both of those numbers.",
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
   "reference": {
    "min": 70,
    "max": 100,
    "evidence": "weak",
    "label": "Adult taux de prothrombine (Quick), French convention",
    "source": "Société Française d'Hématologie, fiche référentiel SFH 2018 — Temps de Quick (taux de prothrombine) en l'absence de traitement par AVK, NABM 0126; after Jourdi et al., EMC Traité de Médecine Akos 2017;0:1-7",
    "population": "Healthy adults, unpartitioned for sex and age — the fiche states a normal Quick time in healthy adults of 10-14 s, corresponding to a TP of 70-100%, and notes only that it is uninformative in the newborn and may fall in pregnancy. No cohort size is given because this is a national society consensus reference sheet, not a primary reference-interval study.",
    "method": "Chronometric Quick time on citrated platelet-poor plasma at 37 C with calcium thromboplastin, converted to a percentage via the droite de Thivolle — which is exactly what his two draws used (NeoPTimal in 2022, Neoplastine CI+ in 2023, both Stago-family thromboplastins). Note the sheet cited is the one for patients NOT on a vitamin K antagonist; a companion fiche (NABM 0127) covers the AVK case and reports INR instead, so do not pull that one by mistake. Graded weak deliberately: this is a handbook/consensus interval, not a measured healthy-population distribution, and the percentage scale is reagent- and calibration-dependent by construction — the same plasma converts to a different TP% on a different thromboplastin, which is precisely why INR exists and why the fiche warns that reagent sensitivity varies. So a shift between his 2022 and 2023 values within a few points is reagent noise, not physiology, and the two reagents did differ. Pre-analytical demands are unusually strict and are the commonest cause of a spurious result: citrate tube (0.105/0.109 M) filled to at least 80%, drawn second after a purge tube, garrot peu serré, gentle inversion, transport at 15-25 C, tested within 4-6 h. The fiche also notes a LOW Quick time (high TP%) can simply reflect an inflammatory hypercoagulable state or a pre-analytical problem. UNIT GUARD: his lab reports the French percentage, not seconds and not INR. Never store the seconds figure (10-14 s) or an INR figure (about 0.8-1.1) on this row — the percentage is INVERSE to the time, and either substitution would render an entirely normal 82% as catastrophic. Both stored results (82% and 81%) sit comfortably inside, and both labs printed the identical 70-100%, which is the same national convention rather than independent support. No bleeding- or liver-failure threshold is asserted: a TP below 70% is where investigation conventionally starts, but that is a clinical decision point this reference does not encode.",
    "reviewed": "2026-08-02"
   },
   "note": "How fast plasma clots once the cascade is triggered from outside the vessel. That pathway runs on clotting factors the liver makes, most of which need vitamin K.\n\nFrance reports it as a percentage of normal, so a higher number means faster clotting and a lower one means slower.\n\nTwo things pull it down. Liver disease, because the factors stop being made. And warfarin, because it blocks the vitamin K they depend on.\n\nThis is also why INR exists. Labs use reagents of differing strength, and INR is the arithmetic that makes one lab's result comparable with another's.",
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
   "reference": {
    "min": 0.8,
    "max": 1.19,
    "evidence": "weak",
    "label": "Adult aPTT ratio (patient/control), typical system range",
    "source": "Société Française d'Hématologie, fiche référentiel SFH 2018 — Temps de céphaline avec activateur (TCA/TCK)",
    "population": "Healthy adults, unpartitioned for sex and age. The fiche states that aPTT ratio reference intervals vary with the measurement system and are most often 0.80 to 1.19 in the adult, higher at birth and falling with age. No cohort size — this is a national society consensus sheet, not a primary study.",
    "method": "Chronometric aPTT on citrated platelet-poor plasma at 37 C: pre-incubation with excess phospholipid and a contact activator, clot triggered by calcium, patient seconds divided by a control value defined per reagent lot. His single draw used Stago Cephascreen, a reagent chosen for sensitivity to intrinsic-pathway deficits, which is exactly the class of reagent that runs at the sensitive (longer) end — so a ratio near the top of this band is partly reagent choice, and his 1.18 is unremarkable rather than borderline. Graded weak for a reason the fiche itself states: the interval is SYSTEM-DEPENDENT, varying with phospholipid source (animal, vegetal, synthetic) and activator (silice, acide ellagique, célite, kaolin), so 0.80-1.19 is a typical range across systems ('le plus souvent') rather than a validated interval for Cephascreen, and CLSI practice is that each laboratory establishes its own. Non-pathological causes of a long ratio that matter for a healthy man: factor XII, high-molecular-weight kininogen or prekallikrein deficiency (no bleeding risk at all), a phospholipid-dependent circulating anticoagulant (lupus anticoagulant), and in-vitro interference from CRP with some reagents. Conversely a raised factor VIII from any inflammatory state SHORTENS the ratio. Pre-analytics per GFHT 2015/2017: citrate 0.105/0.109 M or CTAD, transport 15-25 C, assayed within 4 h if intrinsic factors may be measured. UNIT GUARD: do not store the seconds figure — an absolute aPTT is roughly 25-40 s depending on reagent, and putting that on a ratio axis whose stored value is 1.18 would be nonsense. Only one draw exists, so there is no within-subject trend to read yet; the lab printed a one-sided ceiling of 1.2, agreeing with this band to within 0.01 and adding no floor. This is not a bleeding-risk threshold — a ratio just above 1.19 on this reagent is a prompt to check reagent and pre-analytics before anything clinical.",
    "reviewed": "2026-08-02"
   },
   "note": "How long plasma takes to clot when the cascade is triggered from inside the vessel. This is the contact pathway, and it runs on a different set of factors from the prothrombin time.\n\nReported as a ratio against the lab's own control. Reagents vary so much that raw seconds cannot be compared between laboratories.\n\nA long result means a clotting factor is missing, or something is blocking the reaction. Haemophilia shows up here. So does lupus anticoagulant, which confusingly causes clotting rather than bleeding.\n\nIt is also the test used to monitor unfractionated heparin.",
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
   "reference": {
    "min": 1.5,
    "max": 3.5,
    "evidence": "weak",
    "label": "Plasma fibrinogen, Clauss method",
    "source": "Société Française d'Hématologie, fiche référentiel — Dosage du fibrinogène fonctionnel (facteur I), NABM 0174 (year not printed on the copy consulted); method after Clauss, Acta Haematol 1957;17:237-246",
    "population": "Unpartitioned across sex and age — the fiche gives plasma concentrations of 1.5 to 3.5 g/L from birth onward, and explicitly notes that the concentration rises with age and varies by ethnic origin. No cohort size or sex split is published in the sheet; it is a national society consensus reference, not a primary reference-interval study, which is the main reason for the weak grade. SOURCING NOTE: unlike the SFH's Quick-time and TCA sheets, this one carries no printed 'SFH 2018' header; its own bibliography cites GFHT 2017 and Mackie et al., Int J Lab Hematol 2013;35:1-13, so it postdates 2017 but its year is not stated — do not assert one.",
    "method": "Functional (clottable) fibrinogen by the chronometric Clauss method — excess thrombin, clot formation time proportional to coagulable fibrinogen — which matches his single draw ('Chronométrie', Stago/BD family). Detection may be mechanical or optical, and where optical, some analysers DERIVE fibrinogen from the Quick-time clot curve instead of running a true Clauss assay; the derived and Clauss numbers are not interchangeable, so if a future draw switches analyser this marker needs the assay-change warning read carefully. Caveats: (1) fibrinogen is an acute-phase reactant, so any infection, injury or inflammatory episode raises it for days to weeks and a single value carries no chronic information — the fiche notes the same property can MASK a moderate congenital deficit; (2) it rises with age and varies by ethnic origin per the fiche, and rises with smoking, adiposity and in women per the general literature (those three are general knowledge, not from this sheet); (3) heparin above 2 IU/mL, dabigatran, argatroban, bivalirudin and fibrin degradation products all interfere, and lipaemia interferes with optical detection; (4) the interval is broad on purpose and a single result inside it does not exclude dysfibrinogenaemia, which needs an immunological assay alongside the functional one; (5) reproducibility is only required to be within a 7.6% CV (GFHT 2015), so a 0.2 g/L move between draws is analytical noise. UNIT GUARD: the American convention is mg/dL, where this same interval reads 150-350. Storing 150-350 on a g/L axis would put a perfectly normal 2.0 g/L result a hundredfold below the band. His single draw printed 2-4 g/L, half a gram higher at both ends, so 2.0 g/L reads as exactly on the floor of the lab's range but mid-interval here — a good example of why a printed lr is provenance rather than a marker-wide judgement. This is NOT a cardiovascular risk band: the epidemiological literature treats fibrinogen above roughly 3.5-4 g/L as a graded risk marker, but that is a different claim type and is not asserted here.",
    "reviewed": "2026-08-02"
   },
   "note": "The protein that clotting turns into fibrin, the mesh a clot is built from. The liver makes it, and it is the most abundant clotting factor in blood.\n\nIt is also an acute-phase reactant, so it climbs with any inflammation, infection or injury. It follows CRP, but more slowly and for longer.\n\nThat double role is what makes it awkward. A low value means the liver is struggling, or the fibrinogen is being used up. A high value usually just means inflammation, and says nothing about clotting.\n\nIt is measured by timing a clot, so heparin in the sample distorts it.",
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
   "note": "All the testosterone in your blood: the roughly 98% bound to carrier proteins, plus the small free fraction.\n\nIt is the headline androgen number, but it needs context to read:\n\n• It peaks a few hours after waking and falls through the day, so a morning draw and an afternoon draw are not comparable\n• Immunoassays and mass spectrometry disagree, especially at lower concentrations\n\nMost of it is bound to SHBG and unavailable to your cells. That is why the total alone can mislead when SHBG is unusual.",
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
   "reference": {
    "min": 70.7,
    "max": 226.4,
    "evidence": "moderate",
    "label": "Vermeulen calculated free testosterone, healthy men 20-45",
    "source": "Ho et al., Ann Clin Biochem 2006;43(Pt 5):389-397 (Vermeulen, 126 healthy men 20-45)",
    "population": "Men only, aged 20-45. 126 healthy men screened by significant-medical-history review and physical examination, with a normal semen analysis by WHO criteria, blood drawn 07:00-12:00 in Edinburgh. No BMI or fitness criterion, so this is the sex-and-age rung. The corroborating Framingham sample is a closer body-composition match to this subject: 456 community-based men aged 19-40 explicitly excluded for obesity, smoking, diabetes, hypertension, hypercholesterolaemia, cardiovascular disease and cancer, drawn fasting between 07:30 and 08:30. I chose Ho as the primary anyway, and only because of the equation — see method.",
    "method": "Assumes free testosterone CALCULATED by the Vermeulen 1999 equation, which is exactly what derive() runs. This is the reason Ho beat the larger Framingham cohort: Framingham used 'a law-of-mass-action equation with an association constant estimated from a systematic review of published binding studies and an iterative numerical method', which is not Vermeulen, and equation choice is not a rounding difference — in Ho's own head-to-head the 2.5th percentile ran 0.174, 0.245, 0.278 and 0.314 nmol/L across four published equations, a 1.8-fold span. Ho's inputs were total T by Bayer Centaur competitive immunoassay, SHBG by DPC Immulite 2000 and albumin by bromocresol green; this subject's inputs are Roche ECLIA for both T and SHBG, and unstandardised SHBG immunoassays move a calculated free T (Adaway J, Keevil B, Miller A, Monaghan PJ, Merrett N, Owen L. Ann Clin Biochem. 2020;57(1):88-94). Ho's authors state in the paper itself that laboratories should derive local limits. Never judge a dialysis-measured free T against this band — that is the ftd row. Assumes the Vermeulen 1999 equation with per-subject measured albumin (as the source used and as derive() does, not the fixed 4.3 g/dL of some calculators), morning sampling, and the source's total-T and SHBG calibration rather than Roche ECLIA's. This grades a three-assay composite: calculated free T is near-linear in total T (a 1% total-T calibration bias moves it ~1.2%) and shifts about -16%/+10% across the ~29% between-method SHBG spread, so a value near either limit is not resolved by this band alone. This subject's albumin is unusually high (51 g/L, once 52.9, above his lab's own ceiling), which depresses his calculated value ~6% against a cohort-typical 45 g/L. Morning draws only. Do not judge against the equilibrium-dialysis row's interval — that is a different scale and a contradictory one. FULL CITATION: Ho CKM, Stoddart M, Walton M, Anderson RA, Beckett GJ. Calculated free testosterone in men: comparison of four equations and with free androgen index. Ann Clin Biochem. 2006;43(Pt 5):389-397. Vermeulen column of the paper's percentile table: 2.5th 0.245, median 0.429, 97.5th 0.785 nmol/L. Independently corroborated on a different continent and a different total-T method by Bhasin S, Pencina M, Jasuja GK, Travison TG, Coviello A, Orwoll E, Wang PY, Nielson C, Wu F, Tajar A, Labrie F, Vesper H, Zhang A, Ulloor J, Singh R, D'Agostino R, Vasan RS. J Clin Endocrinol Metab. 2011;96(8):2430-2439 — Framingham Gen 3 reference sample, n=456, calculated free T 2.5th-97.5th = 70-230 pg/mL, within 2% of Ho at both ends.",
    "reviewed": "2026-07-31"
   },
   "note": "The small slice of testosterone not bound to SHBG or albumin. This is the part actually free to enter cells and act.\n\nIt is not measured. It is calculated from total testosterone, SHBG and albumin using the Vermeulen equation, so it inherits the quirks of all three measurements. That is still the better option, because direct free-testosterone immunoassays are notoriously unreliable.\n\nTHE RANGE IS THE PRIMARY PUBLISHED ONE. Ho et al., Ann Clin Biochem 2006;43:389-397: 245 to 785 pmol/L. Those are the 2.5th and 97.5th percentiles of the Vermeulen calculation in 126 healthy men aged 20 to 45 with normal semen analysis, which is the closest population match available. Labs quoting this paper round it slightly, and nearby published ranges land close by.\n\nWATCH FOR A FLOOR SET TOO LOW. Some ranges quoted for this calculation run about a third too wide, and nearly all the extra room sits at the bottom. A lower edge near 163 pmol/L is common where the real one is 245. Against a floor that low, a genuinely low result still looks normal. Check the source whenever a range turns up without one.\n\nMIND THE OTHER SCALE. The dialysis row is on a different scale and the two do not line up. The Vermeulen calculation runs 20 to 30% higher, a median ratio of 1.19 (Fiers, JCEM 2018), so the dialysis range lands at roughly 495 to 1518 pmol/L in these units. Higher, but overlapping. Expect them to disagree by more than 1.19 too, because the populations and the SHBG assays differ as well. Judge a calculated value against a calculated range. That leaves a grey zone of roughly 245 to 495 pmol/L: inside this range, but below where the dialysis one starts.\n\nNO OPTIMIZATION TARGET. Read this against a range built for the same calculation, and against how you feel. Not against a longevity band. A made-up band does more damage here than elsewhere, because with only a couple of readings the band ends up deciding what the number means.",
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
   "reference": {
    "min": 120,
    "max": 368,
    "evidence": "moderate",
    "label": "Men 19-39, equilibrium dialysis",
    "source": "Jasuja et al., Andrology 2023;11(1):125-133 (145 healthy nonobese men, 19-39 y subgroup)",
    "population": "145 healthy nonobese community-dwelling men aged 19 and over; the quoted bounds are the 19-39 year subgroup, a fraction of that 145. Not a trained or athletic cohort.",
    "method": "Free testosterone by a STANDARDISED equilibrium dialysis procedure — 16 hours at 37 C, undiluted serum against a buffer matching the ionic composition of human plasma — with dialysate testosterone quantified by a CDC-certified LC-MS/MS assay. This is the reference procedure and exactly what this marker is defined to hold, so method match is as good as it gets. THE LOAD-BEARING CAVEAT, STATED BLUNTLY: this band must never be applied to a CALCULATED free testosterone. derive() in this dashboard computes a Vermeulen free T from total T + SHBG + albumin, and Vermeulen (and Ekins-Sodergard, and analog free-T immunoassays) run systematically different from standardised dialysis. This reference belongs to the dialysis marker alone and must not be picked up by the calculated row. Dialysis conditions themselves matter too — non-standardised dialysis at different temperature, dilution or buffer composition gives different numbers, which is the whole reason this standardised procedure was published. Further limits: (1) the 19-39 subgroup n is modest, so both bounds are imprecise; the same paper's whole-adult interval is 66-309 pg/mL and the difference is almost entirely age. (2) Timing: total and free testosterone peak 07:00-10:00 in young men, so a later or non-fasting draw biases low relative to this cohort. (3) The cohort was nonobese (BMI-restricted) but NOT lean or trained; at ~12% body fat and six resistance sessions a week he sits outside its body composition on the lean side, where lower adiposity tends to raise SHBG and lower the free fraction while raising total T — the net direction on free T is not predictable from that alone. (4) This is where a healthy population sits, not a treatment threshold; the paper's own conclusion asks for further validation across populations, and the Endocrine Society decision path runs on repeat morning TOTAL testosterone with free T as an adjunct where SHBG is abnormal. The marker has no values yet, so this ships ahead of the first result with no local corroboration.",
    "reviewed": "2026-08-02"
   },
   "note": "Free testosterone measured directly, not calculated. This is the reference method.\n\nSerum sits against a membrane that holds back albumin and SHBG but lets testosterone through. After 16 hours at 37 degrees, whatever crossed is the free fraction by definition, and mass spectrometry reads it.\n\nIT HAS ITS OWN ROW ON PURPOSE. This and calculated free testosterone are on different scales. The Vermeulen calculation runs 20 to 30% higher than dialysis, a median ratio of 1.19 (Fiers, JCEM 2018). Putting both on one row would judge a measurement and an estimate against a single range. Creatinine-eGFR and cystatin-C-eGFR are split for the same reason.\n\nThe range comes from Jasuja 2023 (Andrology), using standardised equilibrium dialysis with CDC-certified LC-MS/MS: 120 to 368 pg/mL for men aged 19 to 39, median 190. Across all healthy non-obese men it is 66 to 309. Those are the 10th and 90th percentiles, which describe where men sit. No outcome data backs them as a goal, so they are not shown as one.\n\nOrder it whenever a laboratory offers it. Availability is the only limit. Always draw it alongside total testosterone, SHBG and albumin from the same sample: a dialysis value with no calculation beside it teaches nothing about the calculation.\n\nREPEATS ARE THE POINT. One pairing shows the direction and rough size of the gap between the two methods, on those assays, on that day. It is not a fixed conversion factor. It carries the error of both methods, and the gap moves whenever either assay changes. Several pairings give a spread, and the spread is what tells you whether a gap can be trusted.",
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
   "reference": {
    "min": 13.5,
    "max": 57.4,
    "evidence": "moderate",
    "label": "NORIP Nordic healthy-male interval, age-30 tier",
    "source": "Bjerner et al., Scand J Clin Lab Invest 2009;69(8):873-879 (NORIP, 599 men)",
    "population": "Men only. 599 male reference individuals from the Nordic Reference Interval Project bio-bank (NORIP/NOBIDA) — healthy adults aged 18 and over recruited by 102 routine clinical-biochemistry laboratories across five Nordic countries, sampled evenly by sex and age. Limits are read off the paper's age regression at 30 years, the tier adjacent to this 31-year-old; the age effect is large and monotonic (the upper limit nearly doubles from 30 to 70), which is why an unpartitioned adult male band would be wrong for him. No BMI, body-composition or fitness criterion was applied, so this is the sex-and-age rung, not a lean/athletic one — I searched for a trained- or lean-male SHBG interval and none exists that is citable; the only training data are intervention studies showing resistance training RAISES SHBG in overweight young men, which is a direction, not a reference interval.",
    "method": "Two-site immunometric SHBG immunoassay. The abstract does not name the analytical platform and I could not obtain the full text, so it must NOT be assumed to be Roche ECLIA (this subject's assay) — the sister NOBIDA thyroid study used a Roche Modular E170 and Bjerner's group was at Oslo University Hospital, but that is inference and I am not asserting it. The load-bearing caveat: SHBG has no reference measurement procedure and no certified reference material, and published head-to-head evaluations of automated SHBG immunoassays report concentration-dependent between-method bias up to roughly 29%. That same variability propagates into any calculated free testosterone (Adaway J, Keevil B, Miller A, Monaghan PJ, Merrett N, Owen L. Ann Clin Biochem. 2020;57(1):88-94). Treat both limits as soft by about a quarter, and treat a cross-platform SHBG change as method noise until proven otherwise. Assumes an SHBG immunoassay traceable to the NORIP calibration; the source does not name the platform, and between-method SHBG bias reaches ~29% (Adaway 2020, Ann Clin Biochem 57:88-94), which exceeds the margin between this subject's highest value and the upper limit — treat any result within ~15% of either limit as unresolved on a different analyser rather than as high or low. Limits are an age regression evaluated at 30, not a fixed band: the same model gives 18.4-75.6 nmol/L at 50, so re-derive rather than letting a stored band age. The reference population was unselected for adiposity, insulin sensitivity and thyroid status; a lean, insulin-sensitive, trained man belongs in the upper part of this interval by phenotype, so a high-normal result here is expected physiology and not evidence of pathology. FULL CITATION: Bjerner J, Biernat D, Fossa SD, Bjoro T. Reference intervals for serum testosterone, SHBG, LH and FSH in males from the NORIP project. Scand J Clin Lab Invest. 2009;69(8):873-879. PMID 19929279; doi 10.3109/00365510903380886. Age-30 limits quoted verbatim from the abstract: 13.5-57.4 nmol/L SHBG (vs 18.4-75.6 at 50 and 27.8-101 at 70).",
    "reviewed": "2026-07-31"
   },
   "note": "A liver-made protein that grips testosterone and carries it through the blood. Bound testosterone cannot enter cells, so SHBG decides how much of your total is actually usable.\n\nThat makes it worth measuring every time. The same total testosterone means different things at high and low SHBG.\n\nIt also reports on metabolic health. It rises with thyroid hormone, and falls with insulin resistance and higher body fat.\n\nNO OPTIMIZATION TARGET, DELIBERATELY. SHBG is barely a lever. About half the variation between people is inherited, and most of the rest follows liver and metabolic state, not anything aimed at SHBG itself. Low body fat, good insulin sensitivity and normal thyroid all raise it, so in a lean, insulin-sensitive person a high-normal SHBG is just those things seen from another angle.\n\nEvery well-evidenced way to push it DOWN is a worse metabolic state: visceral fat, insulin resistance, anabolic steroids.\n\nThe largest observational study, UK Biobank with 149,436 men, does link higher SHBG to higher mortality. Genetic testing does not back that up. Men born with lifelong higher SHBG carry higher total testosterone, unchanged free testosterone, and no extra disease.\n\nIt still matters as a reading, because a high-normal SHBG is what pulls calculated free testosterone toward the bottom of its range. It is just not something to move on its own.",
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
   "reference": {
    "min": 11.3,
    "max": 43.2,
    "evidence": "moderate",
    "label": "Healthy men, Roche Elecsys Estradiol III",
    "source": "Roche Elecsys Estradiol III method sheet, version 9.0, April 2025 (150 healthy men; 2.5th-97.5th percentile)",
    "population": "150 healthy adult men used for a sex-specific interval. The manufacturer does not publish an age partition for men in the accessible method sheet, so this improves assay transfer and sample size but not age matching.",
    "method": "Estradiol by Roche Elecsys Estradiol III competitive ECLIA on cobas e 411/e 601/e 602: 11.3-43.2 pg/mL (41.5-158.6 pmol/L). The latest report records Roche Cobas ECLIA and prints 40.4-157.8 pmol/L, which strongly supports the same assay family but does not prove the unprinted 'Estradiol III' generation; transfer is therefore graded moderate. This method-matched interval replaces the prior LC-MS/MS range, which was not transferable to a direct immunoassay at male concentrations. It is a healthy-population reference interval, not a symptom or treatment threshold, and a low-normal position in a lean man is not deficiency on its own.",
    "reviewed": "2026-08-04"
   },
   "note": "The main oestrogen. Men produce almost none directly. It is converted from testosterone by the aromatase enzyme, mostly in fat tissue.\n\nWorth tracking because both too much and too little cause problems, and because it moves with testosterone instead of independently. More fat mass means more conversion.\n\nMeasuring it is the difficulty. Standard immunoassays are unreliable at the low concentrations found in men. Mass spectrometry is the reference method.",
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
   "reference": {
    "min": 13.6,
    "max": 76.9,
    "evidence": "weak",
    "label": "LC-MS/MS healthy-adult-male DHT interval",
    "source": "Shiraishi et al., Clin Chem 2008;54(11):1855-1863 (LC-MS/MS, 113 healthy men)",
    "population": "Men only. 113 healthy adult men aged 18-59, Harbor-UCLA. Not partitioned by age within adulthood and no BMI or fitness criterion, so this is the sex-only rung: the 18-59 span brackets the subject at 31 but is not tailored to him. I checked the rungs above it and they do not hold — the largest LC-MS/MS DHT dataset (Handelsman DJ, Yeap B, Flicker L, Martin S, Wittert GA, Ly LP. Eur J Endocrinol. 2015;173(6):809-817) produces age-specific centiles only from 35 years upward and from community-dwelling rather than health-screened men, so it cannot be applied to a screened 31-year-old, and no trained- or lean-male DHT interval exists at all.",
    "method": "Assumes LC-MS/MS, which matches this subject's assay exactly. Immunoassay and RIA DHT read consistently higher — up to 25% by method comparison and by as much as 40% in some RIA reports — and must never be judged against this band. The reason for the weak grade: DHT sits in no standardisation programme (CDC HoSt covers testosterone, estradiol and 25-OH-D, not DHT), and a systematic review of MS-based steroid reference intervals found only TWO published for DHT in the entire literature (Tavita N, Greaves RF. Clin Biochem. 2017;50(18):1260-1274). Published LC-MS/MS lower limits scatter across 11, 14, 14 and 23 ng/dL while their upper limits agree far better at 77, 92, 95 and 102 — so the ceiling is usable and the FLOOR is soft by roughly a factor of two. One more boundary: topical finasteride from 1 Aug 2026 puts him outside the reference population by construction, so this band describes his baseline and must not be read as a target for on-treatment values. Assumes LC-MS/MS (which this subject's assay is — immunoassay DHT cross-reacts heavily with testosterone and this band must never be applied to one) and a 5-alpha-reductase-inhibitor-naive population. Limits are mean ± 2 SD, a parametric estimate on a right-skewed analyte, so the lower limit sits below the true 2.5th percentile and is the untrustworthy end. Only the 2026-07-20 baseline is comparable: topical finasteride began 1 Aug 2026, and under 5AR inhibition a value below the floor is the intended drug effect, not an abnormality. Because the floor is both parametric and drawn from untreated men, it will read a large genuine suppression as unremarkable — judge on-treatment values as a within-subject change from the 52.2 ng/dL baseline rather than against this band. FULL CITATION: Shiraishi S, Lee PWN, Leung A, Goh VHH, Swerdloff RS, Wang C. Simultaneous measurement of serum testosterone and dihydrotestosterone by liquid chromatography-tandem mass spectrometry. Clin Chem. 2008;54(11):1855-1863. PMID 18801940. Reported interval 0.47-2.65 nmol/L in 113 healthy men; the n and the 18-59 age band are as tabulated in Swerdloff RS, Dudley RE, Page ST, Wang C, Salameh WA. Dihydrotestosterone: Biochemistry, Physiology, and Clinical Implications of Elevated Blood Levels. Endocr Rev. 2017;38(3):220-254.",
    "reviewed": "2026-07-31"
   },
   "note": "The strongest androgen in the body, converted from testosterone by 5-alpha-reductase in skin, hair follicles and prostate.\n\nIt binds the androgen receptor several times more tightly than testosterone does. That is why DHT, not testosterone, drives male-pattern hair loss and prostate growth.\n\nIt is also what finasteride targets, by blocking that conversion.\n\nOne measurement caveat: immunoassays cross-react heavily with testosterone, so mass spectrometry is effectively required.",
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
   "reference": {
    "min": 1.93,
    "max": 9.7,
    "evidence": "moderate",
    "label": "NORIP adult male interval, age-30 tier",
    "source": "NORIP/NOBIDA male hormone sub-study (Bjerner et al., Scand J Clin Lab Invest 2009;69:873-879)",
    "population": "599 healthy Nordic men aged 18 and over, with age-continuous limits reported at 30, 50 and 70 y; the 30-year tier applies at 31. Screened as generally healthy, not gonadal-axis tested, so a few compensatorily raised LH values sit inside the cohort.",
    "method": "Immunoassay calibrated to the WHO 2nd International Reference Preparation for pituitary LH (80/552); the analyser is not stated and LH results still differ between monoclonal systems despite shared calibration — hence moderate. The larger problem is pre-analytical: LH pulses at 60-120 min with a 20-30 min half-life, so one measurement can swing nearly two-fold within an hour. Limits drift up with age (2.01-10.4 at 50 y), so this tier expires — re-check well before then.",
    "reviewed": "2026-07-31"
   },
   "note": "The pituitary's signal telling the testes to make testosterone.\n\nThe number on its own says little. Its value is in showing where a problem sits:\n\n• Low testosterone with HIGH LH — the testes are being asked and are not delivering\n• Low testosterone with LOW LH — the signal never arrived, so the problem is in the pituitary\n\nIt is released in pulses through the day, so a single draw catches one arbitrary moment in that rhythm.",
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
   "reference": {
    "min": 1.5,
    "max": 10.3,
    "evidence": "moderate",
    "label": "NORIP adult male interval, age-30 tier",
    "source": "NORIP/NOBIDA male hormone sub-study (Bjerner et al., Scand J Clin Lab Invest 2009;69:873-879)",
    "population": "The same 599 healthy Nordic men aged 18 and over, age-continuous limits at 30, 50 and 70 y; the 30-year tier applies at 31. Screened as subjectively healthy rather than fertility-verified, so early testicular insufficiency is not excluded and the upper end is slightly widened.",
    "method": "Immunoassay calibrated to the WHO 2nd International Reference Preparation for FSH (78/549); the analyser is not stated and FSH immunoassays retain real between-method differences, hence moderate. Pre-analytically FSH is the safer gonadotropin to read from one draw — a 3-4 h half-life against LH's 20-30 min, so pulsatile scatter is small. Limits drift up with age (2.04-12.4 at 50 y), so this tier expires.",
    "reviewed": "2026-07-31"
   },
   "note": "The pituitary's other signal to the gonads, driving sperm production in the testes.\n\nRead it alongside LH, using the same logic to locate a problem. FSH is the more sensitive of the two to testicular damage, and often rises first when the testes are struggling.\n\nIt is pulsatile too, though its swings are gentler than LH's.",
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
   "reference": {
    "min": 6.02,
    "max": 18.4,
    "evidence": "moderate",
    "label": "Morning 07:00-10:00, Elecsys Cortisol II",
    "source": "Vogeser et al., Clin Chem Lab Med 2017;55(6):826-835 (300 self-reported healthy adults, Elecsys Cortisol II multicentre evaluation)",
    "population": "300 self-reported healthy adults, both sexes pooled, from three US sites; not sex- or age-partitioned. Ages and exclusion criteria are not recoverable from the accessible record, so no screening claim beyond 'self-reported healthy' is made.",
    "method": "Roche Elecsys Cortisol II ECLIA, standardised to an ID-GC/MS-traceable reference material with close agreement against LC-MS/MS in this evaluation — the SAME assay family as his 2026-07-20 draw, so this is the method-matched interval. CAVEATS: (1) It is a 5th-95th percentile, not 2.5-97.5, so it is narrower than a conventional reference interval and roughly 1 healthy adult in 10 falls outside it by construction. (2) It is valid ONLY for a 07:00-10:00 draw, which is the window Roche prints; the same evaluation gives 73.8-291 nmol/L (2.68-10.5 µg/dL) for 16:00-20:00. Timing cuts both ways: cortisol peaks 30-45 min after waking, so a 06:30 draw sits ABOVE the window that produced this band, while a draw at 11:00 or later is already drifting below it for rhythmic reasons alone. (3) Not sex- or age-partitioned; a male-specific LC-MS/MS morning band from the German KORA survey is wider at the top — 165-635 nmol/L, i.e. 5.98-23.0 µg/dL (Kunz et al., Endocr Connect 2024;13(1):e230225, n=290 men, age-independent) — so 18.4-23 µg/dL is not clearly abnormal. (4) State dominates this analyte: acute stress, venepuncture anxiety, poor sleep the night before, and hard training in the preceding hours all raise it; oral oestrogen raises total cortisol via CBG. A single value near either edge is a timing and state finding before it is an adrenal one. (5) This is a population interval, NOT a diagnostic threshold — adrenal insufficiency and hypercortisolism are decided by dynamic testing (Synacthen, dexamethasone suppression, late-night salivary cortisol), not by position in this band. His lab printed 132.4-537.9 nmol/L (4.80-19.50 µg/dL) on the same Roche platform, wider on both sides, which is a percentile and collection-window choice rather than a different assay.",
    "reviewed": "2026-08-02"
   },
   "note": "The main stress hormone, and one of the most strongly rhythmic things in the body. It surges in the first hour after you wake, then falls steadily all day.\n\nThat rhythm dominates the measurement. The reference range assumes a morning draw, and the same person sampled in the afternoon can look adrenally deficient with nothing wrong at all.\n\nSo the collection time is not a detail here. Without it the number cannot be interpreted.",
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
   "reference": {
    "min": 4.2,
    "max": 22.8,
    "evidence": "moderate",
    "label": "Healthy adult male interval for Roche Prolactin II",
    "source": "Earll et al., J Endocr Soc 2024;8(6):bvae069 (Roche Prolactin II)",
    "population": "127 healthy adult men aged 18-50, drawn from an outpatient population in southeast Wisconsin, USA (the same study also derived female intervals, partitioned by ethinyl-estradiol use, which is why sex partitioning is the load-bearing one here). No fitness, training or BMI criterion was applied. n=127 meets the CLSI minimum of 120 for a direct interval, but it is a single-centre cohort — that, not the analytics, is what holds this at moderate.",
    "method": "Roche Elecsys Prolactin II ECLIA on cobas — the same assay as the stored result, which the printed lr independently confirms (Roche's insert male band 86-324 µIU/mL converts to exactly the 4.04-15.2 ng/mL printed). Two caveats that matter more than the assay: the immunoassay does not exclude macroprolactin, so any raised result needs PEG precipitation before it means anything, and prolactin rises with venipuncture stress, sleep and recent chest/nipple stimulation, so a single value near the ceiling should be repeated rather than acted on. Reviewed 2026-07-31. An INDIRECT interval: remnant outpatient serum and Li-heparin plasma screened by chart review, not enrolled healthy volunteers. The published exclusion list names opioids and antidepressants but NOT antipsychotics or other dopamine antagonists — the commonest cause of drug-induced hyperprolactinaemia, and a plausible contributor to the right tail that set 22.8. Collection time was not standardised, while this subject draws at a fixed 08:37 on the descending limb of a sleep-entrained rhythm, so his values sit high within that distribution. Macroprolactin was PEG-checked only on the four highest specimens per group, which is the right four for a 97.5th centile of 127, so that part holds. Direction of harm is one-way here: the ceiling moves from the Roche insert's 15.2 to 22.8 on the one marker added to rule out prolactin-driven testosterone suppression, and the lower bound gains nothing. Roche cobas only — the same 127 men gave a different interval on Siemens Atellica. One stored draw, so the cross-draw assay warning cannot fire. FULL CITATION: Earll E, Javorsky BR, Sarvaideo J, Straseski JA, Nerenz RD. Clinical Impact of New Reference Intervals for the Roche Prolactin II Immunoassay. J Endocr Soc. 2024;8(6):bvae069 (PMID 38698869)",
    "reviewed": "2026-07-31"
   },
   "note": "A pituitary hormone best known for lactation. It matters here because a persistently high level suppresses testosterone.\n\nWorth checking once in anyone with unexplained low testosterone. A small prolactin-secreting pituitary tumour is a real cause, and a treatable one.\n\nTwo things inflate it harmlessly. Stress and sleep are one. The other is macroprolactin, a bulky bound form the body cannot use, which some labs count in the total unless they screen for it.\n\nUNITS: the mUI/L conversion (x0.0472, so 1 ng/mL = 21.2 mIU/L) is tied to the WHO standard IS 84/500, not to physics. A lab calibrated to a different standard will not match it, so check the report before trusting a converted value.",
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
   "note": "Cell fragments that form the first plug at a bleeding site. That plug is the start of a clot.\n\nTracked for bleeding and clotting risk, and as a general check on bone marrow output.\n\nWatch for one common artefact. Platelets clump inside the collection tube, and the analyser counts a whole clump as a single platelet, so the count comes back falsely low. If a low count appears out of nowhere and you feel fine, assume clumping until someone rules it out.\n\nNO OPTIMIZATION TARGET, DELIBERATELY. A target band here would have to point upward, and there is nothing good up there. Near the top of the range a higher count carries more clotting risk, not less. Nothing safe raises platelets anyway: the drugs that do are for immune thrombocytopenia, and they bring their own risk of clots and marrow scarring. Omega-3 is the only supplement shown to move the count in people, and it lowers it slightly. Three and a half grams a day of EPA plus DHA for four weeks dropped it 6.3%, which the trialists judged too small to matter.\n\nA count that sits steady in the low-normal zone for years, with a normal red cell picture alongside, is simply where you sit. The steadiness is what tells you so.\n\nMPV looks like it should confirm that, but it cannot. It drifts with the analyser and with how long the sample waited before being run, so values from different labs do not line up. That is also why it carries no reference range here.\n\nThree things would make a low count worth chasing: a downward trend, several cell lines falling together, or symptoms. The symptoms to know are easy bruising, pinprick red spots on the skin, and bleeding that will not stop. One low-normal count with none of those means nothing.",
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
   "reference": {
    "min": 7.2,
    "max": 11.7,
    "evidence": "weak",
    "label": "Healthy-adult MPV 95% range (CELL-DYN)",
    "source": "Demirin et al., Thromb Res 2011;128(4):358-360 (326 screened-healthy Turkish adults, Abbott CELL-DYN 3700 SL)",
    "population": "326 healthy adults (122 men, 204 women), mean age 41 ± 16, drawn from a 2,298-subject Turkish community cohort after excluding smokers and anyone with diabetes, hypertension, coronary disease, dyslipidaemia, COPD, cancer, chronic medication, heavy alcohol use, metabolic syndrome, reduced ejection fraction, or abnormal creatinine, liver or thyroid function. Mean MPV 8.9 ± 1.4 fL; 95% of individuals fell between 7.2 and 11.7 fL. Not sex-partitioned, so no male-only limit exists in this source.",
    "method": "Impedance/optical MPV on an Abbott CELL-DYN 3700 SL, EDTA whole blood. MPV is the least harmonised parameter in the CBC: it is traceable to no reference method, differs systematically between manufacturers (Sysmex XN-10 reads roughly 1-2 fL higher — Ali et al., Hematol Transfus Cell Ther 2019;41(2):153-157 give 9.1-13.0 fL for men on that platform), and drifts upward with time in EDTA as platelets swell, on the order of 0.1-0.2 fL per hour. The transfer risk is therefore platform and time-to-analysis, not population. This interval was chosen over the Sysmex one precisely because its scale matches what both of his laboratories printed (7-11 and 7.4-10.8 fL); a Sysmex-derived band would shift every point down the range and quietly invert the labs' own judgement of the two high draws. Note the bound structure: 11.7 fL is also exactly mean + 2SD, while 7.2 is the empirical 2.5th percentile rather than mean - 2SD (which would be 6.1), consistent with a right-skewed distribution. Fasting, training and time of day are not material for MPV. The cohort is Turkish, on an analyser now discontinued, and unpartitioned by sex; men run marginally higher than women on most platforms, so a male-only limit would sit slightly wider at the top. HOW HIS DRAWS FALL: the two CL draws (9.2, 9.4) sit mid-interval; the two BD draws (11.7 and 12.1 fL) were flagged high by their labs and against this interval 11.7 sits exactly at the ceiling while 12.1 sits above it, so the direction of judgement is unchanged. The existing assay/interval-change warning already covers the CL/BD split, which is the most likely driver of the 2.3 fL swing between labs sampled six weeks apart in 2023. DOCUMENTATION NOTE: CLAUDE.md currently lists MPV among three markers deliberately left without a reference on the grounds that a universal interval would overstate analyser comparability; this entry overrides that on the owner's explicit instruction, with the analyser caveat carried here, and that documented rule needs updating alongside the data.",
    "reviewed": "2026-08-02"
   },
   "note": "The average size of your platelets. Bigger platelets are younger, so a high value suggests the marrow is turning them out quickly.\n\nRead it alongside the platelet count. The pair together says more about turnover than either does alone.\n\nBig caveat: platelets swell the longer they sit in the tube before being measured. So MPV reflects how fast the sample reached the analyser about as much as it reflects anything happening in you.",
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
   "note": "The protein inside red blood cells that carries oxygen. Low haemoglobin is anaemia. The two mean the same thing.\n\nIt is a concentration: grams of haemoglobin per volume of blood. So the number moves when the amount of fluid changes, even if your red cells do not:\n\n• Dehydrated — less plasma, same cells, so it reads higher\n• Endurance-trained — the body carries extra plasma, which dilutes it, so it reads lower\n\nThat second one is why fit endurance athletes often look mildly anaemic on paper when they are not.",
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
   "note": "The share of your blood that is red cells rather than liquid, as a percentage. Roughly 45% cells, 55% plasma.\n\nIt says much the same thing as haemoglobin and rarely adds to it.\n\nBeing a ratio makes it even more sensitive to hydration. The same red cells suspended in less fluid take up a bigger share of the total, so the percentage climbs without a single new cell being made.",
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
   "note": "A straight count of how many red cells are in a given volume of blood.\n\nOn its own it says surprisingly little. It counts cells without asking how much haemoglobin each one carries, and you can have plenty of cells that are each under-filled. Its real job is as the denominator for MCV, MCH and MCHC, which is where the useful detail lives.\n\nBeing a per-volume count, hydration shifts it exactly as it shifts haemoglobin.",
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
   "note": "The average size of your red blood cells.\n\nSize is the single most useful clue to why someone is anaemic, because the common causes push it in opposite directions:\n\n• Small cells — iron deficiency, or thalassaemia trait\n• Large cells — B12 or folate deficiency, alcohol, or an underactive thyroid\n\nThe catch: if two causes are present at once they cancel out, and the average lands in the normal range. A normal MCV does not rule out either problem.",
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
   "note": "The average amount of haemoglobin packed into each red cell, by weight.\n\nIt moves almost in lockstep with cell size, so in practice it rarely tells you anything MCV has not already. Mostly it works as a consistency check, confirming the analyser's sizing and its haemoglobin measurement agree with each other.",
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
   "note": "How concentrated the haemoglobin is inside each cell. Not how much per cell, but how tightly packed it is.\n\nAlmost alone among the red cell indices, it barely depends on which analyser ran it.\n\nThat makes a high value useful in an odd way: it usually points to a problem with the sample rather than with you. Fat in the blood, ruptured cells, or cold-clumping antibodies will all confuse the analyser into reading it high.",
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
   "note": "How much your red cells vary in size. A high value means a mixed population instead of a uniform one.\n\nIt is useful because it often moves before the average size does. When a deficiency is developing, new cells come out the wrong size while the old normal ones are still circulating, so the spread widens while MCV still looks fine.\n\nIt also rises when two causes overlap, which is exactly the situation where MCV misleads you by looking normal.",
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
   "note": "The total number of immune cells in circulation. A broad screen for infection, inflammation and bone marrow function.\n\nThe total on its own is fairly blunt. Nearly all the information sits in the breakdown below it, because a high count from neutrophils means something very different from a high count from lymphocytes.\n\nIt rises briefly with stress, adrenaline and recent hard exercise. None of those involve illness.\n\nNO OPTIMIZATION TARGET, DELIBERATELY. A target band would have to point upward, and the mortality curve is J-shaped. Risk climbs above about 6, and stays flat right across the low-normal zone in people who are not acutely ill, so a lower edge would protect against nothing. A count in the lower half of normal is also common in trained people, though the effect measured in endurance athletes is small, about 0.15.\n\nWhat matters is the trend, or a fall that takes the other cell lines with it.\n\nThe useful question about a decline is whether it stopped. A drop that settles and then holds for years, driven by neutrophils alone while lymphocytes and the red cell indices stay put, is a new normal for you. If the drop also spans a change of laboratory and analyser, part of it is the machine.\n\nThe number that decides whether a low white count needs investigating is the absolute neutrophil count, and the threshold is 1500.",
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
   "note": "The immune system's first responders, and usually the largest white cell group. They arrive first at bacterial infections.\n\nThey are also the main reason a white count swings either way.\n\nWorth knowing: they climb within hours of physical stress. A hard training session, a bad night's sleep, or simply the adrenaline of the blood draw will all do it. A mild elevation very often has nothing to do with infection.",
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
   "note": "T cells and B cells: the part of the immune system that handles viruses and remembers past infections.\n\nTracked for immune competence, and because a count that stays high or low can point to something more.\n\nThey drop sharply when cortisol is high, so stress or an early-morning draw will both push them down temporarily. A single low reading is usually the clock or the day, not your immune system.",
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
   "note": "Cells that clear debris and mature into the macrophages living in your tissues.\n\nThey rise during chronic inflammation and during recovery from infection. They often climb just as neutrophils fall, which is a useful sign that something is resolving rather than starting.\n\nThe raw count rarely tells you much on its own. The ratio to lymphocytes carries more.",
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
   "note": "White cells that deal with allergy and parasites, and the clearest blood signal that an allergic process is active.\n\nThey normally make up a very small fraction of white cells, and that creates a trap: a tiny change in the absolute number looks dramatic as a percentage. Read the absolute count, not the percent.",
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
   "reference": {
    "min": null,
    "max": 169,
    "evidence": "moderate",
    "label": "Non-atopic European adult male 95th percentile",
    "source": "Carosso et al., Int Arch Allergy Immunol 2007;142(3):230-238 (ECRHS II, 6,670 adults from 10 Western European countries; non-atopic non-smoking male 95th percentile)",
    "population": "6,670 adults from 10 Western European countries, France included, in the European Community Respiratory Health Survey II. Participants were enrolled at ages 20-44 in ECRHS I (fieldwork 1991-93) and re-examined roughly nine years later in ECRHS II, so they were approximately 28-56 when these samples were drawn; no age range is stated in the published record for ECRHS II itself. The stored limit is the 95th percentile of the non-atopic, NON-SMOKING male subsample; non-atopy was defined as specific IgE class 0 against a full panel of common inhalant allergens (66.2% of the cohort). Partitioned by sex and smoking status, with age entering only as a regression covariate — hence rung 3, not rung 2.",
    "method": "Total IgE by Pharmacia CAP System (ImmunoCAP) fluoroenzyme immunoassay, calibrated to WHO reference preparation 75/502 — the standard that makes IU/mL comparable across platforms, so the numeric scale transfers even though the stored draw's transcribed method reads 'Roche Cobas / Immunoturbidimétrie', an unusual description for total IgE (Roche runs it as ECLIA); treat that transcription as unverified. Total IgE is strongly right-skewed, so an upper percentile rather than mean±2SD is the correct summary and the lower tail carries no information — an undetectable total IgE is not an abnormality, which is why no min is stored. THREE CAVEATS. (1) The reference base is NON-ATOPIC subjects, so this is an atopy-excluded limit and is tighter than a general-population one: the same measurement in unselected Norwegian blood donors put the upper 95% limit at 302 kU/L (Vinnes et al., Immun Inflamm Dis 2023;11(1):e751, n=252). (2) Smoking raises it about 30% — the same paper gives 220 kU/L for male smokers — so 169 assumes a non-smoker. (3) The authors' own conclusion is that total IgE discriminates atopy poorly: above the 95th percentile it catches under a third of atopic adults, though below it correctly classifies over 90% of non-atopic ones. Parasitic infection, eczema and recent viral illness all raise it. The limit was fitted by linear regression on a random 50% non-atopic subsample and validated on the other half, not derived as a straight nonparametric percentile — the main reason for moderate rather than strong. THE DISAGREEMENT WORTH SEEING: his single 2023 draw printed a one-sided <100 UI/mL and the result of 122 was flagged high; against this European non-atopic male percentile of 169 the same 122 reads as inside, and against unselected donors it is well inside. That is a real gap between a conventional laboratory cutoff and a published population percentile, not a unit problem — the ~100 kU/L figure most European labs print is a cutoff, and this reference must not be rendered as if it replaced a diagnostic threshold. DOCUMENTATION NOTE: CLAUDE.md lists total IgE among three markers deliberately excluded from carrying a reference; this entry overrides that on instruction and the rule needs updating alongside the data.",
    "reviewed": "2026-08-02"
   },
   "note": "The antibody class that evolved to fight parasites. In wealthy countries it mostly ends up causing allergy instead. It sits on the surface of mast cells, and when its target binds, the cell dumps histamine.\n\nTotal IgE adds every specificity together, so it tells you that you react to something without telling you what. It rises with hay fever, asthma, eczema and food allergy, and much further with parasites or with an allergic reaction to a mould growing in the airways.\n\nA normal total does not rule allergy out. One strong sensitivity can hide inside a normal sum. Specific IgE against named allergens is what actually answers the question.\n\nUNITS: the ng/mL conversion (x0.4167, so 1 IU/mL = 2.4 ng/mL) is a WHO convention, not physics. kUI/L and UI/mL are the same quantity.",
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
   "note": "The rarest white cell, involved in histamine release and allergic reactions.\n\nThere are so few of them that the count is imprecise by nature. A single high or low value is usually just the statistics of counting very few things. A pattern that holds across several draws means something. One reading does not.",
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
   "reference": {
    "min": null,
    "max": 15.5,
    "evidence": "weak",
    "label": "Westergren male upper limit at age 31",
    "source": "Miller et al., Br Med J (Clin Res Ed) 1983;286(6361):266 (age/2 rule for men, Westergren method)",
    "population": "Adult men. The rule is an explicit linear function of age — men: age in years ÷ 2; women: (age + 10) ÷ 2 — evaluated here at 31 years. It comes from hospital-derived Westergren distributions published as a one-page letter; the sample is small and the source does not characterise ethnicity, comorbidity screening or recruitment beyond that.",
    "method": "Manual Westergren: a 200 mm citrate-diluted column read at 60 minutes, the ICSH reference method. The stored draws were NOT Westergren — both ran on a Beckman Coulter Alifax Test 1 THL, which infers a Westergren-equivalent from photometric red-cell aggregation kinetics measured over about 20 seconds at 37 °C on EDTA blood. Agreement with Westergren is acceptable through the normal range but degrades at high values and in anaemia, polycythaemia and paraproteinaemia, so the two are correlated rather than interchangeable; haematocrit is the dominant non-inflammatory driver in either. THE AGE TERM MATTERS AND THIS BOUND IS NOT FIXED: 15.5 mm/h is correct at 31, but it was 12.5 at the 2020 draw (age ~25) and 14 at the 2023 draw (age ~28), so the number must be re-derived at every review rather than treated as permanent — this is the one reference in the batch whose review date does real work. No lower limit is stored: a very low ESR carries no adverse meaning and the method has no meaningful floor above zero. Weak grade is earned by the source: a 1983 one-page letter, small uncharacterised hospital sample, never re-validated on modern automated platforms. Fasting, time of day and training are immaterial; ESR moves over days, not hours, and lags CRP by roughly a week in both directions, which is exactly why it is a poor acute read and a passable chronic one. Both draws printed a one-sided <15 mm/h and both results were 2 mm/h, deep inside — the derived 15.5 lands within 0.5 mm/h of what both laboratories printed on the same platform, so lab practice and the literature rule agree closely, but the bound is cited from Miller rather than adopted from the report. DOCUMENTATION NOTE: CLAUDE.md lists ESR among three markers deliberately excluded from carrying a reference; this entry overrides that on instruction and the rule needs updating alongside the data.",
    "reviewed": "2026-08-02"
   },
   "note": "How far red cells sink through a column of plasma in one hour. Inflammation produces proteins that make red cells stack together, and stacks sink faster.\n\nSo it reads inflammation indirectly and slowly: days to rise, weeks to fall. CRP does both within hours.\n\nThat lag is its one real advantage. It describes the past few weeks instead of this morning. For everything else hs-CRP is simply better, and this test mostly survives from the days before CRP existed.\n\nAge, anaemia and sex all shift it with no inflammation present at all.",
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
   "reference": {
    "min": 50,
    "max": 190,
    "evidence": "strong",
    "label": "NORIP healthy-adult serum interval",
    "source": "NORIP multicentre Nordic adult study (Rustad et al., 2004)",
    "population": "Healthy Nordic adults aged 18 and over, BOTH SEXES COMBINED, n=2309 serum — NORIP ran the partitioning test and reported iron unpartitioned, so no male-specific limit exists in the source and none is invented.",
    "method": "Spectrophotometric serum iron corrected to the shared NORIP calibrator; both draws are Roche colorimetry, same family. Three caveats: NORIP standardised neither fasting nor time of day, so this interval already absorbs the ~30% diurnal swing and cannot be narrowed into a morning band; within-subject variation is large (CVI ~27%), so a single value is weak evidence alone — read it with transferrin, TIBC and saturation; and results below 6 umol/L were excluded before calculation, so the floor describes the healthy distribution and is not a deficiency cut-off.",
    "reviewed": "2026-07-31"
   },
   "note": "The iron travelling in your blood bound to transferrin, at the exact moment of the draw.\n\nAlmost meaningless on its own, for two reasons. It swings by roughly a third across a single day on its own rhythm. And it jumps after any iron-containing meal or supplement.\n\nIt exists to be combined. Put it with transferrin and you get saturation, which is the number that actually says whether iron is available.",
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
   "reference": {
    "min": 280,
    "max": 505,
    "evidence": "weak",
    "label": "TIBC calculated from CRM 470 transferrin consensus",
    "source": "Calculated from CRM 470 consensus transferrin 200-360 mg/dL (Dati et al., Eur J Clin Chem Clin Biochem 1996;34(6):517-520)",
    "population": "Adult subjects of both sexes from the pooled European reference studies behind the IFCC/BCR/CAP CRM 470 consensus. Not sex-partitioned — the consensus did not partition transferrin, so no male-only limit exists — and the source does not itemise the age composition of the contributing cohorts.",
    "method": "There is no measured TIBC on this row: derive() calculates it from transferrin as transferrin(mg/dL) × 1.4023, so the interval had to be built through the same calculation rather than lifted from a TIBC assay, or the band and the plotted points would sit on different scales. The underlying transferrin interval assumes an immunoturbidimetric or immunonephelometric transferrin whose calibrator is traceable to CRM 470 / ERM-DA470k; the stored Roche Tina-quant draws satisfy that, and the interval is method-independent by construction but only inside that traceability chain. SOURCING CAVEAT, WHICH MUST MATCH THE TRANSFERRIN ROW WORD FOR WORD OR THE DASHBOARD WILL STATE ONE FACT AT TWO CONFIDENCE LEVELS: the consensus's primary table is paywalled and was not read; 200-360 mg/dL comes from assay inserts citing this consensus verbatim. Two hard transfer limits. First, a DIRECTLY measured TIBC — the colorimetric iron-saturation method most laboratories still use — reads roughly 10-15% lower than this stoichiometric calculation, which is why textbook TIBC intervals cluster at 250-450 µg/dL rather than 280-505. This band must NOT be applied to a measured TIBC if one is ever drawn, and a measured value must not be plotted against calculated history. The empirical clinical factor of 1.25 µg/dL per mg/dL was explicitly rejected here: it would give 250-450, correct for a measured TIBC but wrong for these calculated points, and mixing it in would shift every value ~11% relative to its band. Second, everything that moves transferrin moves this: transferrin is a NEGATIVE acute-phase protein, falling with inflammation, liver disease and undernutrition and rising with iron deficiency, pregnancy and oestrogen — which is why TIBC is high in iron deficiency and low in anaemia of inflammation, and why it is read against ferritin rather than alone. Not fasting-sensitive; no training or timing requirement. Graded weak rather than moderate because of the extra stoichiometric assumption layered on the transferrin consensus, not because of any dispute with that consensus. TIBC has never been measured, so every point on this row is calculated and any cross-draw change warning here is really a transferrin event. LOCK: this interval is the transferrin reference pushed through derive()'s own factor, so the two rows are arithmetically bound — if the transferrin reference is revised, this must be recalculated in the same commit or the dashboard will show two incompatible statements of one fact. VIEWER NOTE: 505 exceeds this marker's axis of [180,500]; widen to about 520 or the band will clip.",
    "reviewed": "2026-08-02"
   },
   "note": "How much iron your blood could carry if every transferrin binding site were full. In effect, a measure of transferrin itself.\n\nIts job is to be the denominator for saturation.\n\nWhat makes it informative is that it moves opposite to ferritin when you are short of iron. The body responds by making more transferrin, so capacity rises while stores fall. In inflammation both drop together instead.",
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
   "reference": {
    "min": 15,
    "max": 57,
    "evidence": "moderate",
    "label": "NORIP healthy-adult male transferrin-saturation interval",
    "source": "Rustad et al., Scand J Clin Lab Invest 2004;64(4):271-284 (NORIP, male)",
    "population": "Healthy Nordic MALES aged 18 and over, n=368 serum (n=80 Li-heparin plasma) — a sex-partitioned interval, which is a real step up from the combined-sex iron and TIBC rows in the same table. NORIP's objective partitioning test (Lahti criterion in Refval 4.0) separated the sexes for saturation and further split the women by menopause (18-49: 0.10-0.50; 50+: 0.15-0.50) but found no age partition warranted within men, so 18+ is a single male band and no narrower age tier exists in the source. Same recruitment and health screen as the other NORIP rows: 102 Nordic laboratories, subjectively healthy volunteers, no hospitalisation or serious illness in the past month, no blood donation in 5 months. Two property-specific exclusions applied before calculating saturation: oestrogen users, and any iron result below 6 umol/L. Nordic, predominantly white European; the subject is a 31-year-old French man, inside the male 18+ band.",
    "method": "Computed as iron divided by TIBC, both measured on NFKK CAL-traceable methods (iron colorimetric; TIBC by IFCC methods, with laboratories reporting UIBC as TIBC explicitly excluded from the programme). The subject's lab instead calculates saturation from iron and immunoturbidimetric transferrin, and the dashboard derives TIBC as transferrin x 1.4023 — Gambino et al. (Clin Chem 1997;43(12):2408-2412, n=570 paired results, r-squared 0.941) found the TIBC/transferrin ratio close to the theoretical 25.0 with scatter fully explained by assay CV, so the two routes to the denominator are interchangeable and the ratio transfers. Three caveats. (i) TIME OF DAY IS LOAD-BEARING HERE. Saturation inherits the whole ~30% diurnal swing of the numerator while the denominator barely moves, so it is the most collection-time-sensitive number in the panel. NORIP did not standardise time or fasting, so the interval is wide for that reason; only compare morning draws to each other. (ii) THE 57% CEILING IS PROBABLY TOO PERMISSIVE FOR A FRENCH SUBJECT. NORIP did not screen for HFE, and Nordic populations carry the world's highest C282Y allele frequency, so undiagnosed haemochromatosis heterozygotes and homozygotes plausibly inflate the upper tail. This band deliberately does not agree with the 45-50% haemochromatosis screening thresholds this marker already holds as a cut — reference describes a healthy distribution, a cut states a risk zone, and the file keeps those claims apart on purpose. Read the ceiling as descriptive, not as permission. (iii) The male LOWER limit is read from the table's repeated-value suppression rather than printed twice; see 'unitCheck'. NORIP's 0.57 ceiling is not screened for iron-storage disease: footnote 4 removed only oestrogen users and iron <6 umol/L, while Ritchie 2002 states ranges for this analyte should exclude specific genetic disorders and itself removed TSAT >80% in men. In a Nordic cohort — the population with Europe's highest HFE C282Y frequency — a 97.5th percentile set by roughly the top nine of 368 men is biased upward, and 57% lands above both the 45% watch and the 50% work-up level of this marker's own cut. The 15% floor likewise sits below the 20% this subject's own next-draw trigger uses. Read this band as a description of where healthy Nordic men fall, never as permission: the decision layer on this marker is the cut, not this reference. Measurand caveat: NORIP's saturation used a directly measured iron-binding capacity (transferrin is not among its 25 components), whereas the stored 22% is the laboratory's \"Calcul\" from immunoturbidimetric transferrin. FULL CITATION: Rustad P, Felding P, Franzson L, Kairisto V, Lahti A, Martensson A, Hyltoft Petersen P, Simonsson P, Steensland H, Uldall A. The Nordic Reference Interval Project 2000: recommended reference intervals for 25 common biochemical properties. Scand J Clin Lab Invest 2004;64(4):271-284. Table I, row 'Iron saturation', males 18+.",
    "reviewed": "2026-07-31"
   },
   "note": "Serum iron divided by total capacity: the percentage of your iron transport that is actually loaded.\n\nThe most useful single number in the iron panel, because it shows the iron available right now, not what is stored or potential.\n\nIt is also what separates true iron deficiency from the low iron of inflammation, where ferritin on its own is ambiguous.\n\nIt inherits serum iron's daily swing, so the time of the draw affects it.",
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
   "reference": {
    "min": 1.73,
    "max": 2.28,
    "evidence": "moderate",
    "label": "NORIP healthy-adult serum interval",
    "source": "NORIP multicentre Nordic adult study (Rustad et al., 2004)",
    "population": "Healthy Nordic adults of both sexes aged 18 and over, n=2123 serum (plasma n=943); no sex or age partition for magnesium, so this is the applicable interval for a 31-year-old man.",
    "method": "Colorimetric magnesium recalibrated to the NORIP CAL level, 2.6% bias goal; NORIP issued ONE suggestion spanning serum and Li-heparin plasma. Caveat: 2.28 mg/dL is the lowest ceiling in the literature (NORIP 0.94 vs Aussie Normals 1.04, Pathology Harmony 1.00, AACB/RCPA 1.10 mmol/L), so a supplementing subject can render high on a physiologically normal result; the floors agree closely and are the clinically actionable end. Serum magnesium reflects under 1% of body magnesium.",
    "reviewed": "2026-07-31"
   },
   "note": "A mineral needed by hundreds of enzymes, including every reaction that uses ATP. Central to muscle relaxation, nerve conduction and heart rhythm.\n\nThe measurement problem is severe. Under 1% of your body's magnesium is in the blood, and the body defends that fraction tightly by pulling more from bone and muscle.\n\nSo serum magnesium can look perfectly normal while tissue stores are running down. That limitation is why the red cell assay was ordered instead: it looks inside cells, where the magnesium actually is.",
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
   "reference": {
    "min": null,
    "max": 1083,
    "evidence": "moderate",
    "label": "Male athlete reference interval, upper limit only",
    "source": "Mougios, Br J Sports Med 2007;41(10):674-678 (483 male athletes aged 7-44, 2.5th-97.5th percentile, 37 °C)",
    "population": "483 male athletes aged 7-44 across several sports, sampled throughout the training and competition season; non-parametric 2.5th-97.5th percentile per Solberg. This is the rung-1 cohort for this subject — a trained male population rather than a general one — but it is Greek, single-laboratory, mixed-sport, all-white, and includes minors down to age 7, none of which is partitioned out.",
    "method": "Enzymatic NAC-activated CK at 37 °C. Mougios used a 37 °C assay and the stored draw is Roche's enzymatic Cobas method at 37 °C, so NO temperature rescaling is applied or needed — applying the roughly ×1.8 conversion from a 30 °C assay would have shipped a ~1950 U/L ceiling. THE LOAD-BEARING ASSUMPTION IS THE OPPOSITE OF THE USUAL ONE: samples were drawn in the morning after an overnight fast and sleep, with subjects refraining from early-morning training but with NO other change to their normal training programme — i.e. a rested-morning draw in an athlete in ordinary heavy training, which is exactly this subject's situation at six resistance sessions plus one 30-minute HIT run a week. The conventional adult male limits — Roche's <190 U/L as printed on his draw, or the AACB/RCPA harmonised 45-250 U/L for men under 60 (Koerbin & Tate, Clin Biochem Rev 2016;37(3):121-129) — assume no strenuous exercise in the preceding days and are the wrong comparator; they are stated here as contrast, not as the claim. Caveats: sport is the largest single determinant, with footballers' upper limit at 1492 U/L against swimmers' 523 U/L in this same study, a threefold spread no single interval absorbs, and eccentric-loaded resistance work sits at the high end of it. Black men run roughly 1.5-2x higher than white men at matched activity, a partition this interval does not make. CK peaks 24-72 h after eccentric work and decays over about a week, so a result is uninterpretable without knowing the gap since the last hard session — that gap is not stored on the result and should be captured at the next draw. HOW HIS DRAW FALLS: 77 U/L sits 5 U/L BELOW this 82 U/L floor and will render as outside. That is the honest position and not an abnormality — sitting under an athlete's 2.5th percentile is what a draw well clear of a hard session looks like, and against general adult male limits the same 77 is mid-range. This is a population description, not a risk line: rhabdomyolysis workup is conventionally triggered around five times the general-population upper limit and renal concern above roughly 5000 U/L, and those belong in a cut with their own source. Do not read 1083 as a danger threshold. VIEWER NOTE: 1083 far exceeds this marker's axis of [0,600]; raise it to about 1150 in the same commit or the band runs off the plot on every view. ONE-SIDED ON PURPOSE: Mougios's published floor of 82 U/L is where an athlete population's 2.5th percentile falls, not a threshold below which anything is wrong — a low CK means little muscle turnover, which is not a finding. Stored as max-only so a rested-week value cannot be flagged as abnormally low; the 77 U/L on the 2026-07-20 draw would otherwise have rendered out of range against its own athlete interval.",
    "reviewed": "2026-08-02"
   },
   "note": "An enzyme that leaks out of muscle fibres whenever they are damaged. At extreme levels it signals rhabdomyolysis, where muscle breakdown overwhelms the kidneys.\n\nBut ordinary resistance training damages fibres by design. That is how muscle adapts, and CK stays elevated for several days afterwards.\n\nSo in anyone training regularly, a high CK is the training. The reference range assumes a sedentary person and means very little otherwise.",
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
   "reference": {
    "min": 137,
    "max": 145,
    "evidence": "strong",
    "label": "NORIP healthy-adult serum interval",
    "source": "NORIP multicentre Nordic adult study (Rustad et al., 2004)",
    "population": "Healthy Nordic adults of both sexes aged 18 and over, n=2642 serum; NORIP tested and found no sex or age partition for sodium, so this is the applicable interval for a 31-year-old man.",
    "method": "Direct or indirect ion-selective potentiometry recalibrated to the NORIP CAL level, 0.5% bias goal — the tightest of the 25 properties; caveat: these are SERUM figures, NORIP's Li-heparin plasma suggestion is 137-144, and specimen type is not recorded in this file.",
    "reviewed": "2026-07-31"
   },
   "note": "The main electrolyte outside cells. It sets how much water your body holds and how hydrated each cell is.\n\nThe body defends it fiercely. Kidneys, thirst and hormones all work together to keep it within a couple of percent.\n\nThat is exactly why it is worth watching. Because it barely moves, a shift of even 3 or 4 units is a real signal about kidney, adrenal or water balance, not noise.",
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
   "reference": {
    "min": 3.6,
    "max": 4.6,
    "evidence": "moderate",
    "label": "NORIP healthy-adult serum interval",
    "source": "NORIP multicentre Nordic adult study (Rustad et al., 2004), Table I serum column and the potassium discussion, p. 281",
    "population": "Healthy Nordic adults of both sexes aged 18 and over, n=2608 serum (plasma n=1172); no sex or age partition for potassium, so this is the applicable interval for a 31-year-old man.",
    "method": "Ion-selective potentiometry on promptly separated SERUM — NORIP's Li-heparin plasma interval is 3.5-4.4, and specimen type is not recorded here; caveat: pre-analytics dominate the ceiling (cell leak before centrifugation, haemolysis), which is why published upper limits span 4.4-5.1, so a routine draw can exceed this without pathology.",
    "reviewed": "2026-07-31"
   },
   "note": "An electrolyte kept mostly inside cells. Only a small amount sits in the blood, but that small amount governs heart rhythm, which makes it one of the few genuinely urgent lab values.\n\nThe common artefact: potassium leaks out of red cells if the sample sits too long or gets shaken in transit. That shows up as high potassium in someone who is completely fine.\n\nA high result with no symptoms is usually the tube, not the person. That is why it gets repeated.",
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
   "reference": {
    "min": 95,
    "max": 108,
    "evidence": "moderate",
    "label": "UK Pathology Harmony harmonised adult interval",
    "source": "UK Pathology Harmony agreed adult clinical-biochemistry intervals (Berg & Lane, Ann Clin Biochem 2011;48:195-197, Table 1)",
    "population": "UK adults of both sexes, the programme's undifferentiated adult tier — the source states no age boundary and the underlying age composition is not itemised, and chloride is not a sex-specific analyte, so no male partition exists or is needed.",
    "method": "ISE potentiometry on serum or Li-heparin plasma; caveat: NORIP does not cover chloride at all, so unlike sodium and potassium this is a harmonisation consensus rather than a percentile study, and the one large direct healthy-population study (Aussie Normals, Abbott ARCHITECT) found 101-110 — 6 mmol/L higher at the floor. Read the lower limit as tolerant.",
    "reviewed": "2026-07-31"
   },
   "note": "The main negative ion outside cells. It balances sodium so blood stays electrically neutral.\n\nIt tracks sodium almost perfectly, which is why on its own it adds very little.\n\nIts value is in the gap between the two. Chloride that moves independently of sodium points to an acid-base problem instead of a water one. It climbs when bicarbonate is being lost, and falls with prolonged vomiting or with diuretics.",
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
   "reference": {
    "min": 22,
    "max": 32,
    "evidence": "moderate",
    "label": "AACB/RCPA harmonised adult bicarbonate",
    "source": "Koerbin & Tate, Clin Biochem Rev 2016;37(3):121-129 (AACB/RCPA harmonised adult reference intervals, Australasia)",
    "population": "Australasian adults of both sexes. The consensus applies one interval to all adults — not sex-partitioned and not age-partitioned — and the published table does not itemise the ages or recruitment of the underlying laboratory cohorts, which is the main limit on the grade.",
    "method": "Total CO2 on venous serum or lithium-heparin plasma by the enzymatic phosphoenolpyruvate-carboxylase method — what a routine chemistry panel measures and what this harmonisation covers. It is NOT the bicarbonate a blood gas analyser reports: that figure is calculated from measured pH and pCO2 via Henderson-Hasselbalch, runs roughly 1-2 mmol/L different, and arterial sits about 1-2 mmol/L below venous, so the two must never be plotted on one series. The dominant error is pre-analytical, not analytical: CO2 escapes from an uncapped or partly filled tube and from a sample left standing at room temperature, which can drop the result by several mmol/L and is the usual explanation for an isolated low bicarbonate in a well person — this marker is unusually dependent on how the tube was handled between collection and analysis. Fasting is not required; a prolonged tourniquet or fist-clenching lowers it slightly. Training is relevant: heavy anaerobic work transiently lowers bicarbonate as lactate is buffered, and chronic high-intensity training nudges resting buffering capacity up, so a draw should sit clear of a hard session. GEOGRAPHY CAVEAT: this is the Australasian harmonised value because it is the only explicit consensus interval located for bicarbonate — no French or European harmonised figure was found, and many US laboratories print 22-29 or 23-29 mmol/L, so the upper bound in particular is not universal. Bicarbonate has never been drawn here, so values[] is empty and there is no printed laboratory interval to corroborate against: this rests entirely on the citation with no local cross-check, which is worth remembering if a first result disagrees. ONE BOUNDARY TO KEEP CLEAN: the common clinical action limits for metabolic acidosis and alkalosis fall near the same numbers as these bounds, but this is the population description only. If a risk cut is ever added it must carry its own source and its own label — the coincidence of numbers is not licence to relabel this interval as a threshold.",
    "reviewed": "2026-08-02"
   },
   "note": "The blood's main buffer, and the number that reports your acid-base balance. The kidneys make and retain it, and the lungs adjust CO₂ to match.\n\nLow means acid is building up, or bicarbonate is being lost. High usually means vomiting or diuretics.\n\nThe version that matters here is the slow one. A diet heavy in animal protein and dairy generates a daily acid load, and the body buffers part of it out of bone and muscle. That shows up as a bicarbonate sitting at the low end of normal, not as anything dramatic.\n\nIt is also fragile. CO₂ escapes from a tube left open, so a delayed sample reads falsely low. Repeat before believing one low value.",
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
   "reference": {
    "min": 2.84,
    "max": 4.39,
    "evidence": "moderate",
    "label": "Elecsys, male blood donors 20-39",
    "source": "Roche Diagnostics, Reference Intervals for Children and Adults: Elecsys Thyroid Tests, Mannheim 2009, Tables 4a/4b (Leipzig blood donors, men 20-39 y, n=286)",
    "population": "German male blood donors aged 20-39 (n=286), Leipzig 2003-04; 2.5th-97.5th percentile, median 3.44 pg/mL (5.29 pmol/L).",
    "method": "Roche Elecsys FT3 (2003 reformulation) ECLIA — the same platform as both of his FT3 results. Read the lower bound carefully, because this band disagrees with the printed one in a way that matters. Caveats: (1) The interval his lab prints, 2.0-4.4 pg/mL, is Roche's own package-insert figure but it comes from group GHH: 5366 ROUTINE samples from a Hamburg community laboratory, i.e. people who had blood drawn for a reason. Routine populations contain non-thyroidal illness, in which T4-to-T3 conversion falls, so their low tail is depressed — Roche's dialysis-patient group runs 1.54-4.10 and its NTI group 0.82-4.08 on the same assay. Restricting to healthy young men raises the floor from 2.0 to 2.84 and leaves the ceiling essentially unchanged (4.39 vs 4.40). Roche states this in the brochure: the overall health status of the reference group is decisive for FT3. (2) Free-T3 analogue immunoassays are the least harmonised of the thyroid tests and transfer poorly between manufacturers; equilibrium-dialysis LC-MS/MS returns different numbers. (3) Roche found the male-female difference highly significant (p<0.01) in every group, men higher, especially at the 2.5th percentile — an unpartitioned band would sit low for him. (4) Group GL1 is blood donors with no exclusion for thyroid disease; the NACB-screened male subgroup (GL3, all ages, n=274) gives 2.66-4.42 pg/mL, so screening moves the floor down ~0.18 — the lower bound is the softer number. (5) Training and energy availability are a real confounder specifically here: sustained energy deficit or low carbohydrate intake lowers T3 with T4 and TSH intact, and he trains six days a week with a diet intervention started 1 Aug 2026. A result in the low 3s in a lean, hard-training man on restricted intake is expected physiology, not thyroid disease. No trained or lean male FT3 cohort was located to quantify this, so that caveat is unsourced inference. (6) Not fasting- or time-standardised; German iodine-replete-to-mildly-deficient cohort.",
    "reviewed": "2026-08-02"
   },
   "note": "The active thyroid hormone, the one that actually drives metabolic rate in tissue. Most of it is converted from T4 locally rather than released by the thyroid.\n\nUseful when TSH and T4 look fine but symptoms do not.\n\nImportant caveat: T3 falls during illness, fasting and sustained calorie restriction. That is the body deliberately saving energy, not thyroid disease, and it gets mistaken for one routinely.",
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
   "reference": {
    "min": null,
    "max": 33.5,
    "evidence": "weak",
    "label": "Elecsys, NACB male reference, 95th pct",
    "source": "Roche Diagnostics, Reference Intervals for Children and Adults: Elecsys Thyroid Tests, Mannheim 2009, Table 10, group GL5/DL5 (NACB-criteria male reference group, n=80)",
    "population": "German male blood donors aged under 30 (n=80) with TSH 0.5-2.0 mIU/L, no goitre and no non-thyroid autoimmune disease — the same NACB 2002 antibody reference group used for anti-TPO. One-sided: the 95th percentile is 33.5 IU/mL (95% CI 25-98), median 23.7. He is 31, one year above the cohort's ceiling.",
    "method": "Roche Elecsys Anti-Tg ECLIA, the platform his Jul 2026 draw used. Weak, and this is the shakiest bound in the panel — say so plainly. (1) The 95% CI on the 95th percentile runs 25 to 98 IU/mL. n=80 against a heavily right-skewed distribution cannot pin an upper tail; the point estimate of 33.5 should be read as 'somewhere in the 20s to 90s'. (2) Anti-Tg is not standardised between manufacturers despite the IU/mL unit and the MRC 65/93 reference preparation; platforms disagree severalfold, and heterophile and Tg-autoantibody interference is common. This is an Elecsys number only. (3) Competing figures on the same assay: Roche's package insert cutoff is 115 IU/mL (n=392) — and Roche's own text notes that 115 is not even covered by the upper 95% CI of the healthy-male estimate, i.e. the manufacturer's diagnostic cutoff is deliberately set well above the healthy-male distribution to buy specificity. Unselected Leipzig male donors give a 95th percentile of 67, ultrasound-normal male donors 72. So a result between 33.5 and 115 would read as above this band while every laboratory using the insert would call it negative. That is a real and expected disagreement, not an error, and it is the single most important thing to know about this row. (4) Position inside the band is close to meaningless. The distribution is heavily right-skewed and the cohort's MEDIAN is 23.7 IU/mL, so a result of 19.1 reads as roughly 57% of the way up a linear 0-33.5 span while actually sitting BELOW the healthy-male median. Anti-Tg is a positive/negative call, not a graded measurement, and the assay's functional sensitivity is around 10-15 IU/mL, so 19.1 is only just above the floor of what it can resolve. (5) The reference group is men under 30 with tightly euthyroid TSH — the lowest-prevalence slice by construction; Roche cites ~10% anti-Tg prevalence in the general population, and unselected Leipzig women give a 95th percentile of 492. (6) No trained or lean male cohort exists; NHANES measured TgAb on Beckman Coulter Access 2 with a different positivity threshold and does not transfer.",
    "reviewed": "2026-08-02"
   },
   "note": "Antibodies against thyroglobulin, the scaffold protein the thyroid builds its hormones on. A second marker of autoimmune thyroid disease.\n\nChecked alongside anti-TPO because a minority of people are positive for one and not the other, so testing both catches more.\n\nSame limitation as anti-TPO: whether it is present is what matters, and the size of the number does not compare between labs.",
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
   "reference": {
    "min": 102.5,
    "max": 437.2,
    "evidence": "weak",
    "label": "Men 30-39, LC-MS/MS (KORA)",
    "source": "Kunz et al., Endocr Connect 2024;13(1):e230225 (KORA population survey, Augsburg; 34 German men aged 30-39)",
    "population": "34 men aged 30-39 from the population-based German KORA survey (Augsburg), randomly selected and stratified by sex and 10-year age band to reflect the general population on health-related factors.",
    "method": "DHEAS by LC-MS/MS using a widely available commercial steroid-profile kit, fasting morning blood; 2.5th-97.5th percentile of 2782-11864 nmol/L. CAVEATS: (1) n=34 in this age band is far below the 120 samples CLSI recommends for nonparametric 2.5/97.5 percentiles, so BOTH bounds are imprecise — this is why the grade is weak despite a sound parent survey. (2) Method differs from his: his draws are Roche ECLIA. DHEAS is a high-concentration analyte and immunoassay/LC-MS/MS agreement is generally good, but a systematic offset on the order of 10-20% is possible, which matters more at the edges than in the middle. (3) Age partitioning is essential here, not cosmetic: DHEAS falls roughly 2-3% per year from the mid-20s, and in the same table the male 40-49 band (n=60) already drops to 1230-8987 nmol/L, i.e. 45.3-331.2 µg/dL. Do not carry this band forward as he ages. (4) Corroboration on his own platform is his own report rather than an independent source: his lab printed 160-449 µg/dL on Roche ECLIA, which sits inside this LC-MS/MS band — two methods bracketing the same central estimate, but no claim is made about which manufacturer age tier that printed range represents. (5) Any supplemental DHEA would raise this number directly and void the comparison; there is none in the stack at present. This is a population interval and asserts nothing about adequate adrenal androgen output or about supplementing a low-normal value.",
    "reviewed": "2026-08-02"
   },
   "note": "An adrenal steroid, and the most abundant hormone in the bloodstream. The body uses it as raw material for other androgens and oestrogens.\n\nUseful as a stable read on adrenal output. Unlike cortisol it does not swing hour to hour, so one draw represents you well.\n\nIt declines steadily from your twenties onward, so judge it against your age rather than one fixed range.",
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
   "reference": {
    "min": 124,
    "max": 310,
    "evidence": "weak",
    "label": "Provisional VARIETE LIAISON XL comparator, men 30-39",
    "source": "Chanson et al., J Clin Endocrinol Metab 2016;101(9):3450-3458 (VARIETE)",
    "population": "911 healthy French adults aged 18-90 (470 men), roughly 100 subjects per decade so about 50 men in the 30-39 tier that applies here. Screened by clinical examination, history and laboratory work-up; anyone on a medication or with a condition affecting IGF-I was excluded, and BMI was restricted to 19-28 kg/m². That BMI window is a genuine adiposity criterion and it fits this subject (80 kg / 1.87 m = 22.9), but it is not a trained-athlete cohort — no fitness criterion was applied, so I stopped at sex-and-age rather than claiming the athlete tier.",
    "method": "Assay-specific and not transferable off-platform: DiaSorin LIAISON XL chemiluminescence, the same platform as the stored 2026-07 result. IGF-I has no working cross-platform harmonisation despite universal calibration to WHO IS 02/254 — LIAISON XL reads about 17% above LC-MS/MS and 8% above IDS iSYS (Lee et al., Clin Chim Acta 2023;539:130-133), and VARIETE's own iSYS tier for the same men is 108-265. If a future draw moves to another analyser this interval must be dropped, not carried over. Reviewed 2026-07-31. Locked to LIAISON XL and to VARIETE's 2012-14 calibration epoch. The subject's laboratory runs a LIAISON XL commissioned 23/09/2025 and prints 82-241 for it — a 34% gap at the lower limit on a nominally identical platform that no publication reconciles. VARIETE and Kim both argue the manufacturer band is the outlier, and that is the likelier reading, but with one stored draw the cross-draw assay warning can never surface the gap. The men 30-39 limits are LMS-smoothed centile curves fitted across 470 men, not an empirical percentile among the 56 men of that decade. Applying this flips the only stored value, 104.6, from unclaimed to 'out'. Raise the marker's axis top from 280 to ~340 in the same edit: mini() clamps to axis, so a 310 ceiling renders flush to the rail end and any future value above 310 would sit on the band edge and read as in-range while claim() colours it out. FULL CITATION: Chanson P, Arnoux A, Mavromati M, Brailly-Tabard S, Massart C, Young J, Piketty ML, Souberbielle JC; VARIETE Investigators. Reference Values for IGF-I Serum Concentrations: Comparison of Six Immunoassays. J Clin Endocrinol Metab. 2016;101(9):3450-3458 (PMID 27167056, doi 10.1210/jc.2016-1257)",
    "reviewed": "2026-08-04"
   },
   "note": "The messenger through which growth hormone actually works. GH itself comes out in short pulses and is nearly impossible to measure meaningfully. It tells the liver to make IGF-1, which circulates steadily.\n\nSo IGF-1 is the practical read on growth hormone status.\n\nIt deliberately has no target here. Mortality against IGF-1 is U-shaped, and the low side is the stronger signal. The common longevity claim that lower is better runs against the population data.",
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
   "reference": {
    "min": 6.2,
    "max": 7.8,
    "evidence": "strong",
    "label": "NORIP healthy-adult serum interval",
    "source": "NORIP multicentre Nordic adult study (Rustad et al., 2004)",
    "population": "Healthy Nordic adults of both sexes aged 18 and over, n=1985 serum; total protein is not sex-partitioned in any harmonisation programme.",
    "method": "Biuret colorimetry corrected to a DGKC reference-method target, 2.1% bias goal — platform is not the dominant error term, sample type is: NORIP's Li-heparin plasma interval is 2 g/L higher (6.4-7.9 g/dL) because fibrinogen is retained. Caveat: total protein is a pre-analytical measurement before it is a liver measurement — upright posture, a prolonged tourniquet or dehydration raise it up to ~10%. It is also 2 g/L tighter at each end than the AACB/RCPA and UK Pathology Harmony consensus of 60-80 g/L.",
    "reviewed": "2026-07-31"
   },
   "note": "All the protein in blood added together: mostly albumin, plus the globulins that include your antibodies.\n\nToo coarse to interpret alone, because the two components can move in opposite directions and leave the total unchanged. A falling albumin masked by rising globulins reads as perfectly normal here.\n\nUseful mainly as a first pass before splitting it into its parts.",
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
   "reference": {
    "min": 200,
    "max": 360,
    "evidence": "moderate",
    "label": "CRM 470 consensus adult transferrin interval",
    "source": "IFCC/BCR/CAP CRM 470 consensus for 14 serum proteins (Dati et al., Eur J Clin Chem Clin Biochem 1996;34:517-520)",
    "population": "Adult Caucasian subjects of both sexes — the source's own framing, and a real limit on transferring it; the consensus did not sex-partition transferrin, so no male limit exists, and it does not itemise the age composition of the pooled European reference studies — that missing detail is the main reason for the moderate grade.",
    "method": "Any immunoturbidimetric or immunonephelometric transferrin whose calibrator is traceable to CRM 470 / ERM-DA470k — method-independent by construction, but only inside that traceability chain; the stored draw is Roche Tina-quant, which qualifies. The 2.0-3.6 g/L interval itself was confirmed only indirectly: the primary table is paywalled, and 200-360 mg/dL comes from assay inserts citing this consensus verbatim. Caveat: transferrin is a NEGATIVE acute-phase protein, falling with inflammation, liver disease and undernutrition and rising with iron deficiency and oestrogen, so a normal value alongside a raised CRP may be a masked low.",
    "reviewed": "2026-07-31"
   },
   "note": "The protein that ferries iron through the bloodstream, made by the liver. Loose iron is toxic, so essentially none travels unbound.\n\nThis is the direct measurement behind total binding capacity.\n\nA low transferrin has several unrelated causes: inflammation, liver disease, or poor nutrition. Read it with the rest of the iron panel, never on its own.",
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
   "reference": {
    "min": 0,
    "max": 118.1,
    "evidence": "weak",
    "label": "Healthy men 30-39, 95th-pct upper limit",
    "source": "Liu et al., J Clin Lab Anal 2021;35(11):e24043 (646 healthy men aged 20-69, Dalian, China)",
    "population": "Healthy men aged 30-39, Dalian, China; an age subgroup of 646 healthy men within 1,321 adults (646 men, 675 women) aged 20-69, screened by CLSI EP28-A3c criteria — no acute or chronic disease, BP under 140/90, normal dipstick for protein/glucose/cells, and normal liver, renal and coagulation markers.",
    "method": "Random morning spot urine. Total protein by colorimetric assay (Randox) with creatinine by enzyme colorimetric assay on a Siemens ADVIA Chemistry XPT. Urine total-protein methods are poorly harmonised between manufacturers — pyrogallol-red and benzethonium chemistries respond differently to albumin versus tubular proteins and give systematically different numbers — and this subject's result is Roche Cobas turbidimetry, so the transfer is genuinely poor: read this band as indicative of where healthy men sit, not as comparable digit for digit. ONE-SIDED BY CONSTRUCTION: 118.1 mg/g is the 95th-percentile upper reference limit per CLSI EP28-A3c; min is set to 0 as the physiological floor of a ratio, NOT as a lower reference limit — there is no lower limit and a low value means nothing. STABILITY WARNING: the paper does not report n per age subgroup, but 646 men spread over five decades implies roughly 130 setting this percentile, so about six or seven tail observations carry it — at the edge of what CLSI considers adequate. The all-male figure of 128.7 mg/g and the whole-cohort 141.7 mg/g are the more stable estimates and are the numbers to fall back on if the age band looks too tight. Cohort is Chinese, not European. Finally, spot proteinuria is state-dependent in a way that matters a lot for this subject: strenuous resistance exercise in the preceding 24 hours causes transient exercise proteinuria, and orthostatic proteinuria affects young men specifically; neither was controlled in his single sample, and a raised spot ratio in a trained man is a reason to repeat on a first-morning void before it is a reason to conclude anything. LAYER SEPARATION: the existing KDIGO cut sits at 150 mg/g, ABOVE this 118.1 population limit, and the two are different claims — 118.1 is where 95% of healthy men fall, 150 is where kidney damage becomes the working hypothesis pending a confirmatory repeat. Do not render the reference as a diagnostic cut-off or let it override the cut; the 118-150 window is 'above the healthy population but below the guideline threshold', which is exactly what this layer exists to make visible. His lab's printed one-sided upper of 50 mg/mmol converts to 442 mg/g — nearly four times this limit and three times KDIGO's — which is why his 25 mg/mmol (221 mg/g) was reported without a flag.",
    "reviewed": "2026-08-02"
   },
   "note": "Protein leaking into urine, expressed relative to urine creatinine so that a dilute sample and a concentrated one give comparable answers.\n\nOne of the earliest signs of glomerular damage, often detectable years before filtration rate starts to fall. So it warns you sooner than eGFR does.\n\nA single positive is not a diagnosis. Exercise, fever and simply standing for a long time all cause temporary, harmless proteinuria.",
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
   "reference": {
    "min": 350,
    "max": 2600,
    "evidence": "moderate",
    "label": "Men 19-39, spot urine, 5th-95th pct",
    "source": "Ji et al., Biomed Environ Sci 2022;35(10):899-910 (1,757 men aged 19-39, China National Human Biomonitoring 2017-2018)",
    "population": "Men aged 19-39, general Chinese population, n=1,757, survey-weighted from the China National Human Biomonitoring Program 2017-2018 (21,167 participants analysed). Median 1.38 g/L; the 5th percentile is 0.35 g/L (95% CI 0.25-0.44) and the 95th is 2.60 g/L (95% CI 2.29-2.91).",
    "method": "Spectrophotometric urine creatinine per the Chinese national standard WS/T 97-1996, with all estimates survey-weighted using Taylor-series linearisation. Two structural caveats before anything else: this is a 5th-95th percentile, deliberately narrower than a conventional 2.5th-97.5th reference interval, and it is a general-population sample rather than a health-screened one. USED AS THE AUTHORS INTENDED: the paper's stated purpose is to derive age- and sex-specific validity cut-offs for spot urine, so citing this band as a sample-validity window rather than a health reference is the correct use of it. Say the main thing plainly — urine creatinine is a dilution index, not a health measurement. It reports how much water was in that particular sample, so a single value tells you essentially nothing about the person; the same man can produce 400 mg/L after drinking a litre and 2,500 mg/L on a dehydrated morning, both entirely normal. What it actually governs is every other urine result expressed per gram of creatinine, this panel's protein/creatinine ratio included: dilute urine inflates ratio-normalised results, concentrated urine deflates them. Secondarily it tracks muscle mass and dietary protein — the same cohort found male sex, obesity, smoking and red-meat frequency above seven times a week each independently associated with higher Ucr (>7/week worth about +0.05 g/L) — so a lean-muscular male eating beef and chicken daily should be expected above the Chinese male median of 1.38 g/L when equally hydrated. The cohort being Chinese matters more here than for a serum analyte, because body composition and diet are the drivers. WHO's 0.3-3.0 g/L sample-validity window is a different construct — a rule for discarding uninterpretable specimens — but it brackets this band closely, and the same paper found 4.53% of Chinese men fell below 0.3 g/L. A value near the floor is a signal to repeat any ratio-based urine result on a less dilute sample, not a finding. There is no 'good' position within this band and it is not a health target. His lab printed 400-2,780 mg/L, bracketing this band closely — reassuring independent agreement given the cohort is Chinese and the lab French.",
    "reviewed": "2026-08-02"
   },
   "note": "In effect, how concentrated your urine is.\n\nNever interpreted on its own. Its job is to normalise the other urine measurements. A low value simply means dilute urine, which would otherwise make everything else in that sample look low too. That is why urine results are reported as ratios instead of raw concentrations.",
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
      "an": "Mass spectrometry, the reference method — unlike the immunoassays used for the other androgens.",
      "cx": "Pre-treatment baseline: topical finasteride started 1 Aug 2026, twelve days after this draw."
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
