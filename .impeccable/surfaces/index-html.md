---
version: 1
slug: "index-html"
primary_target: "index.html"
related_targets: []
---

## Scope

The whole planner page (`index.html`): inputs, both methods' results, charts, historical stress test, saved plans and comparison. Visitor mode: **Operate**.

## Audience and job

Public savers planning early retirement through a monthly PAC, often on a phone. Job: get the capital and monthly figures, see why, change the plan, rerun, compare. Proof: both methods side by side, the stress test on real history, the working shown in the notes.

## Constraints

Static page, artifact host rules (Google Fonts, allow-listed CDNs, no downloads), browser storage for saved plans only (try/catch). Dark only, chosen by the owner on 2026-10-12. Minimal is the default mode.

## Direction contract

THESIS: The planner is a working console. Inputs and both methods' answers stay on screen as tiled panels, so editing a number and rerunning is the whole experience. It refuses the category default: a marketing hero with one friendly big number and a call to action.

OWN-WORLD: Graphite ground #0f1113, panels one step up #16191c, divided by 1px seams #2a2f35 and never by shadows. Geist for words, Geist Mono for every figure. One blue accent #8ab4f8, only for the primary action and the current selection. Green, amber and red only for state (fresh, stale, error). A fixed status bar at the bottom carries the run log and Calculate.

STORY: The visitor sees both methods' capital and monthly figures for an example plan, edits six numbers (or everything in Complete), reruns, replays retiring into real history, then saves plans and compares two.

FIRST VIEWPORT: Top bar with the name, one-line purpose and the Minimal/Complete switch. Plan panel on the left (six inputs in Minimal). Results panel on the right: two method columns of large mono figures, with the safer pair flagged. The fan chart starts below. The status bar is fixed at the bottom with Calculate at the right. Phone: plan, then results, with the status bar at the bottom.

FORM: The dark-first developer console. This was dealt challenger `digital-design-canon-dark-first-developer-console`, picked by the owner over assigned index 5 of my ordered list. Seed key 018e41ba. Signature: the stress test replays real history month by month as a drawn path. When inputs change, stale results turn dashed and are outlined in amber.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved

Product name (working name "PAC FIRE Planner"); custom domain.
