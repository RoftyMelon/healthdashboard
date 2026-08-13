# Validators

Run both before believing any change. Check the EXIT CODE, not the output —
piping either through `grep` in an `&&` chain inverts the gate and pushes a broken page.

    python3 tools/check-css.py     # braces, EMPTY/MANGLED/DANGLING selectors, undefined vars
    node     tools/check-js.js     # BOOTS index.html against bloodwork.js and asserts it RENDERS

`node --check` only proves the file parses. It does not prove the page works.

For a **shared** viewer/schema/reference change, validate both this dashboard and the sibling blank
Starter with one read-only command:

    node tools/check-share.js

It requires byte-identical viewers and changelogs, checks the shared schema and reusable marker /
running references, then runs both projects' own validators. It never copies files or creates a ZIP.

`check-js.js` hardcodes counts — the marker total, and each page's expected row/card
counts. Bump them when the data changes. A stale count fails loudly, which is the point.

**The load-bearing rules, and the bug behind each one, live in `AGENTS.md` (which `CLAUDE.md` symlinks to — AGENTS.md is the vendor-neutral name, and the only real file).**
They are deliberately not restated here: this file carried its own copy until
2026-07-28, drifted to "66 rows" against a real 88, and listed five of the eight
rules. One source or none.
