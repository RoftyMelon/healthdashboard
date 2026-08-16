# Shared dashboard changelog

Only changes shared by the personal dashboard and Starter belong here. Personal health-data edits
remain in the personal repository history.

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
