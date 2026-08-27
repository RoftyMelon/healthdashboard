# Shared dashboard changelog

Only changes shared by the personal dashboard and Starter belong here. Personal health-data edits
remain in the personal repository history.

## Viewer 1.12.5 · Schema 2 · 2026-08-27

- Positioned phase icons inside their actual routine time slots while preserving short transition ticks and accessible labels.

## Viewer 1.12.4 · Schema 2 · 2026-08-27

- Reduced internal routine milestone hairlines to 10px ticks while leaving main block dividers unchanged.

## Viewer 1.12.3 · Schema 2 · 2026-08-27

- Positioned internal routine milestones on their true clock times instead of compressing them into the block-label row, and aligned their shorter hairlines with the main ruler.

## Viewer 1.12.2 · Schema 2 · 2026-08-27

- Added short, labelled milestone hairlines inside multi-hour routine blocks without splitting or moving the block label.

## Viewer 1.12.1 · Schema 2 · 2026-08-27

- Added the missing fractional hairline where a multi-hour routine block starts mid-hour, such as a 07:30 gym block.

## Viewer 1.12.0 · Schema 2 · 2026-08-20

- Ended the radar at Top 10% instead of the elite rung: Olympic and NFL marks sit so far out that every real result collapsed toward the centre.

- Put the percentile rungs on a single green ramp instead of grey/blue/green/amber: they are ordinal, not status, and the old set collided with the men's blue reference while implying amber outranked green.

- Renamed the radar rings `Top 75%` to `Top 10%` to match the charts and the documented rule; a bare `P90` reads backwards on timed rows, where that rung is the fast edge.

- Moved the benchmark radar above the results table and dropped its tested-count caption.
- Muted the women's reference colour: pink reads hotter than blue at equal saturation, so its chroma now sits below the men's token in both themes.

- Added a benchmark radar chart: nine rows on one shape, each axis normalised to its own rung ladder (P25 centre, then P50/P75/P90, top rung at the edge) so times, distances and weights become comparable. Only tested rows carry a point; the filled shape appears once every axis has a result.

## Viewer 1.11.3 · Schema 2 · 2026-08-20

- Coloured men's performance references blue and women's pink across plotted lines, axis values, labels and source arrows; world records and elite marks remain distinguishable by dash pattern.

## Viewer 1.11.2 · Schema 2 · 2026-08-20

- Simplified performance-chart world-record labels to `Men · World record` and `Women · World record`; the inline source links remain, while athlete and date provenance stay in the data.
- Re-audited every timed-event record and elite mark against World Athletics, replaced the men’s secondary Paris-standard links with the primary qualification document, and corrected the road-eligibility and four-minute-mile source notes.

## Viewer 1.11.1 · Schema 2 · 2026-08-20

- Replaced the women’s mile Olympic-1500m equivalent with the event-matched 4:30 world-class mile barrier.
- Unified the secondary women’s top reference under `women.elite`; the other four timed events retain their Olympic entry standards, and none of these references affects the owner’s grade.

## Viewer 1.11.0 · Schema 2 · 2026-08-20

- Added women’s world-record and Olympic-entry reference lines to the five timed running charts as secondary context; they do not affect the owner’s performance grade.
- Uses the official Olympic 1500m mile-equivalent entry mark on the mile chart and preserves the existing road-record versus track-entry convention for 5km and 10km.

## Viewer 1.10.0 · Schema 2 · 2026-08-19

- Removed the Training tab's hover tooltips, including the exercise info popover and native benchmark month/delta titles; the underlying exercise tooltip payload is gone as well.
- Removed `TRAINING.maylater` and its “May add later” section from both the personal dashboard and blank Starter.

## Viewer 1.9.1 · Schema 2 · 2026-08-19

- Kept world-record numbers visible beside nearby Olympic-entry values on the benchmark axis; the record number now yields slightly upward instead of being removed when the two labels would overlap.

## Viewer 1.9.0 · Schema 2 · 2026-08-19

- Restored persistent benchmark history as one shared column per testing month: each row shows its latest result within that month, later months append without replacing earlier ones, and exact attempt dates remain stored in the chart history.
- Aligned every chart point with its month column and kept the ledger card fixed-width; additional months scroll horizontally, opening on the newest month.

## Viewer 1.8.0 · Schema 2 · 2026-08-19

- Replaced the VO₂max top rung's unrelated hyponatremia citation with the relevant physiology review, and clarified that 85 mL/kg/min is a round high-end endurance anchor rather than a universal world-class cutoff.
- Replaced the incomplete grip result used as the NHL Combine ceiling with the official 196.9 lb (89.3 kg) two-hand-average record, and documented why its protocol is only a distant comparison with the row's international norms.
- Kept every exact top-rung value visible on the chart axis: when a nearby world-record tick would collide, the sourced rung value now takes priority while the world-record line and label remain.
- Made the no-`target.span` benchmark contract enforceable at runtime and aligned the Personal and Starter documentation with the current four-line grade ladder.

## Viewer 1.7.0 · Schema 2 · 2026-08-16

- Added a provisional NHL Combine grip result from an incomplete public table; Viewer 1.8.0 replaces it with the official record and protocol.
- Collapsed the dated attempt columns into a single column headed by the latest attempt's month, showing each row's latest value; two attempts in one month no longer make two identical headers, and the full dated history stays in the data and the expanded chart.
- Turned the benchmark intro into bullet points and noted most cohort age ranges are about 20–40.
- Renamed the jumps' top rung `NFL Combine`. The Combine is invite-only, so unlike an Olympic entry standard it is not a qualifying bar — it marks the top of an already-selected group.
- Captioned the unit once at the top of the chart axis, and gave both jumps an inch value beside each centimetre one so the NFL Combine rung can be read in the units it was set in.
- Restored a two-line intro under Performance benchmarks, and moved the cohort caption to the foot of the names column, under the rungs it qualifies.
- Renamed the track events' top rung `Olympic entry standard`, since it is the qualifying mark rather than the slowest athlete in the field.
- Moved the rung names out of the plot into their own column on its right, so a name never strikes the line it labels.
- Removed the explanatory intro under Performance benchmarks; each rung names its own percentile on the chart, so the sentence was repeating them.
- Named the three derived rungs `Top 50%`, `Top 25%` and `Top 10%` instead of Average, Good and Excellent, so the labels read correctly whether lower or higher values are better.

## Viewer 1.6.0 · Schema 2 · 2026-08-16

- Moved every rung name inside the plot, sitting on its own line, and widened the plot leftward to hold them; the side legend and its absolute-positioning pass are gone, and the cohort now captions the chart from above.
- Gave each rung its own colour — neutral, blue, green, amber — with the world record in red above them, in both themes.
- Added a layout pass that lifts colliding names apart, pulls any that overrun the right edge back inside, and wraps a record name too wide for a narrow plot.
- Put attempt dots in their own layer so the wider plot cannot slide them off their date columns.

## Viewer 1.5.0 · Schema 2 · 2026-08-16

- Replaced the shaded performance band with a named grade ladder: Average, Good, Excellent and one top rung, each drawn as its own labelled line.
- Added an optional `elite` block holding only that top rung — `Olympic`, `World class` or `NFL`, with its own value, source and evidence grade. Average, Good and Excellent stay derived from the median and the target so a grade cannot drift from the band it came from.
- `audit()` requires the top rung to sit beyond Excellent, keeps its label to the three-name set, and rejects a top rung on a row with no target.
- Paired every legend key to its own plotted line through `data-tier`, so a renamed or added rung cannot strand its key off the line it names.

## Viewer 1.4.1 · Schema 2 · 2026-08-16

- Stripped a dead decimal from m:ss times, so a whole-second value at one-decimal precision renders `1:06` rather than `1:06.0` while a real tenth still shows.

## Viewer 1.4.0 · Schema 2 · 2026-08-16

- Stated the P75–P90 meaning once, as an intro line with the green swatch under the Performance benchmarks heading, instead of repeating it inside every target legend; those legends now name the cohort alone, since the chart axis already labels the band edges.
- Dropped the value from the world-record and median legends, which the chart axis already labels, and reduced the world-record source to the same bare ↗ every other legend link uses.
- Added an optional `TRAINING.maylater` parked list to the Training page: a headed list of activities under consideration, each naming the qualities it would add, with the shared reason for parking in a section note rather than repeated per row.

## Viewer 1.3.0 · Schema 2 · 2026-08-16

- Reduced every performance attempt to a date and result, with no method, course, conditions or note metadata.
- Removed hidden benchmark quality and protocol copy plus the attempt hover/tap bubble; marker-result provenance bubbles remain unchanged.
- Renamed the mile benchmark to `1 Mile (1609m)` so its exact distance is visible at a glance.
- Fixed the performance table at a stable measure and sized its name column to the longest label; narrow windows scroll instead of resizing columns.
- Added a small gap between the performance-benchmark section rule and its table.
- Included performance targets in chart scaling so the complete P75–P90 band and its upper tick remain visible.
- Kept P75–P90 as the only shaded band on targeted benchmarks, hiding their lower peer band while preserving peer-only rows.
- Matched the world-record legend dash to the plotted line and aligned both by their measured centres.
- Standardized every sourced performance comparison to P75–P90; empirical race cutoffs come from the existing raw cohorts, while modelled cutoffs are labelled and weak-graded where appropriate.
- Simplified the sprint legend to `Male PE students 21–25` and `75th to 90th percentile`.
- Extended the same two-line cohort and percentile wording to every benchmark with a population target.
- Added a neutral median line and value to every population-benchmarked performance graph; fixed-pace heart rate remains personal-only.
- Restored the concise `Recreational runners 19–39` label for 5 km and 10 km, and shortened the median key to `Median`.
- Replaced the separate population `Source ↗` row with a linked `↗` directly after each comparison name.

## Marker catalogue · 2026-08-14

- Added whole-blood total mercury under a new Environmental exposure category, with a generic
  educational description, sourced population-position reference and public biomonitoring review zones.

## Viewer 1.2.0 · Schema 1 · 2026-08-13

- Kept deferred Next Draw exclusions as source-only reasoning and removed their dashboard section and count.

## Viewer 1.1.0 · Schema 1 · 2026-08-13

- Kept Decision and Trend visible while folding Optional and Deferred Next Draw sections by default.
- Strengthened the visual emphasis of each test's decision line.

## Viewer 1.0.0 · Schema 1 · 2026-08-13

- Unified the personal and blank Starter viewers.
- Made blank-card behavior data-driven through `_template`.
- Moved the personal corrected-calcium rule out of the shared viewer and into personal data.
- Added validation-only sharing checks; compression remains manual.
