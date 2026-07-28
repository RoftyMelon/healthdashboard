# Bloodwork panel

A personal biomarker dashboard. Two files, and the separation between them is the point.

| file | role |
|---|---|
| `bloodwork.js` | **The data. The single source of truth.** 88 markers, 7 draws, the supplement map, and the `STACK` / `ROUTINE` / `DIET` / `CARE` / `TRAINING` / `NEXTDRAW` lifestyle blocks. Also what gets handed to an AI for biomarker work. |
| `index.html` | **The viewer. Contains ZERO data.** Loads `bloodwork.js` via `<script src>`. |

**Never put data in `index.html`. Never put UI in `bloodwork.js`.** If you find yourself
about to, stop and ask.

---

## Before you tell me anything is done

```
python3 tools/check-css.py     # dangling/mangled selectors, undefined vars
node     tools/check-js.js     # BOOTS the page and asserts a row per marker
```

**Both must pass. Every time. No exceptions.**

`node --check` only proves the file parses. It does not prove the page works. Every bug in the
list below **passed a syntax check and shipped a broken page**:

- a regex deleted a block and silently took `norm()` and the entire state object with it —
  the page loaded and rendered nothing
- a dangling selector `[data-theme=dark] [data-theme=dark]` **swallowed the rule after it**
- a bare `[data-theme=dark]` block **tied** the light block's `:root` on specificity and, sitting
  earlier in the file, lost the tie — dark mode silently never applied, on every device, from the
  first deploy until 2026-07. It is `:root[data-theme=dark]` now. A palette has no error to throw:
  LOOK at both themes.
- a media query placed *before* a base rule **stopped applying** (media queries add no specificity)
- `.ccard b` (the card TITLE) matched **every `<b>` in the card** — 84 set numbers and 34
  kg/reps legends silently rendered at 16px title style, uppercase included. Scope
  container rules to the child: `.ccard>b`.
- `new ResizeObserver(setTop).observe(TB)` with **no reference held** silently died on
  iOS — `--toph` went stale on tab switch and a 40px phantom gap opened under the bar.
  Hold the observer in a variable AND re-measure explicitly at the mutation site
  (setPage). Related: the Preview pane throttles rendering — rAF/ResizeObserver
  callbacks may never run there; only synchronous reads are trustworthy in it.
- the ⓘ tooltip is revealed by `.infob:hover+.exinfo` — an **adjacent-sibling** selector. The
  button and its bubble must be emitted back-to-back with nothing between them. Insert anything
  and the tooltip silently stops opening: no error, no warning, the ⓘ just does nothing.
- `position:static` killed sticky on **both** axes when only the horizontal was wanted
- `--thh` was **circular**: the header was sized from it and it was measured back from the header
- `offsetLeft` on a table cell resolves against a **different origin** depending on the cell's
  own `position`, so sticky and static cells measured from different places

CSS fails **silently**. There is no error. The page just quietly does the wrong thing.

---

## Rules that are load-bearing

1. **Media queries go LAST in the stylesheet.** They add no specificity; a later base rule wins.
   The same applies BETWEEN media queries: when two both match, the one further down the file
   wins. Checking that your override follows the *base* rule is not enough — grep the selector
   and read every hit. A `.cgnote` bump inside `max-width:900px` was silently beaten by an 8px
   rule in a `max-width:580px` block 70 lines later, and the phone rendered 8px for a day.
2. **`--thh` and `--nm` are DECLARED, never measured.** The header is sized by `--thh` and the
   section bar is offset by `--thh`. If a measured value and a declared value drift by 1px, a
   row's frozen cells shine through the seam.
3. **Never `offsetLeft` on table cells.** Use `getBoundingClientRect`.
4. **The chart borrows the table's geometry.** `fitChart()` must run whenever a column moves —
   the marker column shrinks on horizontal scroll, and the plot has to follow.
5. **`text-transform:uppercase` maps `µ` to Greek Mu**, which is visually identical to `M`.
   `300µg` renders as `300MG` — a 1000x dose error. Never let uppercase touch a unit. Use `mcg`.
6. **Light is the default palette; dark is opt-in.** `:root` must never hold the dark colours —
   before JS runs there is no `data-theme` attribute, and a JS failure would show a black screen.
   Dark is applied by JS: a sync head script follows the OS scheme before first paint, and a
   manual toggle (persisted) overrides the OS for good. All of it try/catch'd: JS dies → light.
7. **Anything that must appear "with" an expansion must live ON the animated element.**
   Two independent easings will not agree.
8. **The open tab lives in the URL HASH (`#grooming`), never the query string.**
   `location.search` is already spoken for: the head's `document.write` appends it to the
   `bloodwork.js` script src as a cache-buster. A `?page=` would change which script URL is
   fetched. `setPage` mirrors the tab into the hash with `replaceState` (not `pushState` —
   tab-switching must not stack back-button history).

## Data rules

- `v: {"r": <exactly what the lab printed>, "u": "<the unit label they used>"}`.
  **Never pre-convert.** `toUS()` does that.
- `u` is a **unit label string** ("mg/L"), not an index. Indices are fat-fingerable; strings are not.
- `clin[]` is the **reference interval**, and it is best-evidence, not provenance. Usually it is
  the lab's printed range transcribed — but where the evidence has moved past what a lab prints,
  the harmonised interval wins (total T on Travison, eGFR on KDIGO, Lp(a) on ESC/EAS, uPCR on
  KDIGO A1). The chart therefore says "Reference range", **not** "Lab reference range": four
  markers would have been lying. The lab's own printed interval is recorded **separately**, per
  value, as `lr: [lo, hi]` — never over `clin[]`. `clin[]` is what the panel judges against; `lr`
  is what that lab claimed on that day. Store it wherever a report prints one: it fingerprints the
  assay ("réf <5 mg/L" is how the March CRP was known to be standard rather than ultra-sensitive),
  and **an `lr` that changes between draws is a method change even when no technique was printed**.
  `opt[]` and `oc` are **inferences** with an evidence tag
  (strong / moderate / weak). Do not present a weak target as a finding.
- A value is `{r, u}` plus six optional keys, each a DIFFERENT kind of claim, and they must not
  be merged: `a` = the assay technique exactly as printed; `an` = what that method means for
  reading the number (usually inference); `cx` = context for this number in this draw (on
  creatine, 2 days into a diet change) — state, not method; `lr` = the lab's printed interval,
  `[lo, hi]` with either end `null` for a one-sided range; `lt: true` = the result was CENSORED,
  the lab printed `<x` and `r` holds the limit, so it renders `<x` and never as a measurement;
  `t` = a collection time that OVERRIDES the draw's, for a result folded in from a different
  day (the Dec 2020 zinc) — `audit()` requires a `cx` beside it, since a bare override is a typo;
  `ak` = what the printed `a` actually IS, a canonical key used ONLY to compare draws and never
  shown. `a` is a TRANSCRIPTION, and labs transcribe one method three ways — "Formule de
  FRIEDEWALD", the misspelled "Formule de Friedwald", and bare "ECLIA" where another named the
  analyser. Editing `a` to make them agree falsifies the record; `ak` carries the equivalence
  instead. Set it only where you are SURE, and leave it off where two might genuinely differ —
  CKD-EPI has none, because the 2009 and 2021 equations print identically and are not the same
  calculation.
  A marker's `am` (critical / useful) declares that the assay can swing its number at all; the
  panel names the draws where an `am` marker recorded no method.
- **A DIET tooltip has FIVE sections, in this order**: `Ingredients` (what it is made of) →
  `Macros — per Xg` (the nutrition panel, carrying its own portion) → `Standouts` (the notable
  micronutrients) → `Changes` (the dated log) → `Notes` (preparation, rotation, storage).
  Order matters because the two-column layout fills left before right, so the first section is
  what the eye lands on.
  **`Ingredients` is ALWAYS one prose row** — `[["", "..."]]`, sentence case, no trailing stop —
  never label/value pairs, even when every item carries a percentage. Pairs were tried and read
  as a second nutrition panel sitting above the real one.
  **A food with nothing to declare has NO `Ingredients` section.** Ten items carry none — a
  banana is a banana. The section earns its place only when it adds a fact the name does not:
  `Ground beef, 5% fat`, `Chicken breast, skinless`, `Fresh trout with skin, cooked`. Do not
  "complete" the missing ones.
  **The macro header states the WEIGHT BASIS whenever it changes the numbers**: `per 200g raw`,
  `per 150g frozen`, `per ~75g cooked`, `per ~300g frozen`. It is not decoration and it is not
  copyable between foods — beef and chicken are raw-weight figures, rice and trout are cooked,
  the frozen greens are as-purchased. A pass that "harmonised" these to `cooked` everywhere
  would silently understate beef by a third of its calories.
  Two deliberate exceptions: Huel keeps `Vitamins`/`Minerals`/`Other`, since that one IS a full
  fortification label, and an alternating item carries one macro panel per option (`Mackerel 80g`,
  `Tofu 125g`) because it has two sets. The order regressed once silently — a pass that renamed
  sections by pop-and-reinsert appended them, putting the change log above the nutrition panel.
- **A STACK tooltip has SIX sections, in this order**: `What it does` (mechanism) → `Dose` (why
  this number, and which form) → `Evidence` (what the tag rests on) → `Watch` (ceilings,
  interactions, contraindications) → `Changes` (the dated log) → `Parked` (why not yet, and what
  would unpark it). The first three are REQUIRED; the last three are omitted when they have
  nothing to say, and a `taking` item may not carry `Parked`. `audit()` enforces the vocabulary,
  the order and the required three — the sections were nineteen prose paragraphs saying the same
  six things in nineteen different orders before that.
- **Every STACK item carries `ev`: `strong` / `moderate` / `weak` / `none`**, rendered as a pill
  beside the name. **`none` is a REAL value, not a missing one** — ergothioneine and taurine have
  no trial base and no assay, and the tag exists to say that out loud where it can be seen rather
  than 400 characters into a paragraph. An item with no `ev` is one whose evidence was never
  examined, so `audit()` refuses to render rather than let it through blank.
- **`judge` renders in exactly ONE place, and which one depends on the tier.** On the ROW for
  `maylater`, where it is a live decision — the criterion that would unpark the item, and the
  thing you scan down a column before a draw. INSIDE the tooltip — **immediately before
  `Changes`, never last** — for everything already being taken, where it is reference rather than
  a decision and on the row would double every row's height. Before `Changes` because everything
  above it describes the supplement, it is the only line that asks something of you, and `Changes`
  is an audit trail you consult rather than read. It is injected at render time from the one
  `judge` field, never stored twice, so the row and the bubble cannot drift. Both places or
  neither would be silent.
- **`an` and `cx` are CAPTIONS, not essays. One clause, ~110 characters, hard ceiling.** They
  render inside a tooltip on a datapoint, where anything longer is a wall the user scrolls past.
  State the fact and stop: *why* a decision was taken (why zinc was folded into this draw, why
  the SI value was kept over the mg/L one) is reasoning, and reasoning does not go on screen.
  The marker's `note` is the long field; these two are not.
- `audit()` in `index.html` validates the data on load and **refuses to render** rather than
  show a wrong number. Keep it that way.
- Some markers are **DERIVED at load in `derive()`, never stored**: corrected calcium, TIBC
  (from transferrin), free testosterone (Vermeulen, from total T + SHBG + albumin). A MEASURED
  value must always win — that is what the `!d.v.<id>` guards are for. Corrected calcium is
  deliberately **not computed when albumin exceeds 40 g/L**: that is the source lab's own
  printed rule, and above it the correction subtracts a large (albumin − 4) from a calcium that
  needed no correcting, manufacturing a low reading out of a normal one. Every albumin in this
  file is above 40, so that row is expected to be **empty — and the emptiness IS the finding**.
  Do not "fix" an empty derived row by inventing a value.
- **Distrust any draw that reached this file through a third-party export.** The 2020–2024 draws
  came via InsideTracker, which RE-CONVERTED the lab's SI values instead of transcribing the
  printed ones: results arrived rounded (RBC 5.26→5.3, MCHC 347 g/L→34) and whole panels were
  silently dropped (2020 held 30 of its 38 values; the entire thyroid panel was missing). All
  six original reports have now been reconciled against the file. Enter what the lab PRINTED.
- `STACK`, `ROUTINE`, `DIET`, `TRAINING`, `NEXTDRAW`, `CARE` feed the tab pages (Stack /
  Routine / Diet / Training / Next Draw / Grooming); `CARE` is the Grooming tab — Dental AND
  Skincare (id 'face') are both cadence cards now: `groups:[{t, icon?, items[]}]` plus an
  optional card-level `notes[]` that renders as bulleted footnotes under the list. An item is
  either a plain string or `{n, url?, info?}` — `url` draws a ↗ (the Stack's `.sbuy` link),
  `info` draws a ⓘ tooltip. Skincare was a day-indexed dot-matrix (`.schedule`: days[]/rows{n,on[]})
  until 2026-07; `careGrid()` still renders that shape, but no card uses it — do not "restore"
  the grid, the days were removed deliberately and the frequencies now live in `notes[]`.
  Statuses are a closed enum (taking / candidate / stopped / dropped / planned); `when` is the
  meal a supplement rides with — **null means not yet assigned, never guess it**. The Diet
  page derives its supplement lists from `STACK.when` at render time: timing is written in ONE
  place or nowhere. (The Routine page deliberately shows NO supplements — meals are named only;
  supplements belong to Diet.) `audit()` gates these blocks too.

---

## Dev loop

The page loads its data from disk — `<script src>` works over `file://` even though `fetch` does not.
So the simplest loop needs no server at all:

```
open index.html          # or just double-click it
# edit
# Cmd+R
```

**In Claude Code Desktop, use the Preview pane** so you can SEE the rendered page and iterate on it:

```
npx --yes live-server . --port=5173 --no-browser
```

Then point Preview at `http://localhost:5173`. It reloads on save. Being able to look at the
result matters here — most of the bugs in this project were **visual and silent**: a 1px seam,
a column that stopped sticking, a chart drifting 80px off its own axis. None of them threw.

Push to GitHub only when it's right. Development and deployment are separate on purpose.

---

## First-time deploy (run once)

The site is static — GitHub Pages serves it as-is, no build. `index.html` at the root means the
URL is the repo folder itself, not `/index.html`.

```bash
gh auth status || gh auth login          # once, ever

git init
git add .
git commit -m "Bloodwork panel"
git branch -M main
gh repo create healthdashboard --public --source=. --push

# turn on Pages, serving main / root
gh api --method POST /repos/{owner}/healthdashboard/pages \
  -f "source[branch]=main" -f "source[path]=/"
```

Live in ~60s at `https://<user>.github.io/healthdashboard/`. Tabs deep-link off the hash:
`…/healthdashboard/#grooming`. (The repo was renamed from `bloodwork` on 2026-07-23 — the
DATA file is still `bloodwork.js`, which is accurate: it holds bloodwork. The repo covers
more than that. GitHub Pages does NOT redirect a renamed repo, so the old path is dead.)

## Every deploy after that

```bash
python3 tools/check-css.py && node tools/check-js.js   # BOTH must pass
git add -A && git commit -m "..." && git push
```

**Never push if a validator fails.** The whole point of the harness is that it gates the commit.
**Check its EXIT CODE, not its output.** `node tools/check-js.js | grep -E "passed|❌" && git push`
pushes a broken page every time: the grep succeeds because it *found* the failures, and `&&`
sees 0. That shipped a blank page once. Run each validator on its own line, capture `$?`, and
gate on both being 0.

**`dec` is a JOIN KEY, not a label.** The same string appears in `DECS`, in `STACK.items[].dec`
and in `MARK[].dec[]` — and because the dose lives inside it ("NAC 12g"), changing a dose means
rewriting every reference in lockstep. `audit()` catches a dangling one and then refuses to
render the whole page, so a one-site edit blanks the site rather than showing a broken link.
Each blood draw becomes a commit, so a bad edit is one `git revert` away — which matters, because
the one corruption `audit()` cannot catch is a *plausible but wrong* unit (`µmol/L` where the lab
said `mg/L`): structurally valid, clinically nonsense, and it renders as a confident green number.
