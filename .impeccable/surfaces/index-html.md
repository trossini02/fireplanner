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

Static page, artifact host rules (Google Fonts, allow-listed CDNs, no downloads), browser storage for saved plans only (try/catch). Dark only, chosen by the owner on 2026-10-12. A first visit opens the guided setup (added 2026-11-20), then Minimal.

## Direction contract

THESIS: The planner is still a working console, but it now has a material: frosted glass cards floating over soft night light, with soft, pressable controls set into them. Editing a number and rerunning stays the whole experience. It refuses the category default: a marketing hero with one friendly big number and a call to action.

OWN-WORLD: Graphite ground #0f1113 lit by fixed, very soft light fields (a faint signal-blue tint and a cool slate). Top bar, plan and every result panel are translucent glass cards (16px corners, 12px gaps, a bright top edge, a soft drop shadow). The status bar is real frosted glass (backdrop blur) over scrolling content. Controls are dark neumorphism: inputs are inset wells, chips, buttons and tags are soft raised pills that press in, the mode switch is an inset track with a raised thumb. Geist for words, Geist Mono for every figure. One blue #8ab4f8 for action and selection, plus the faint backdrop tint. Green, amber and red only for state.

STORY: The visitor sees both methods' capital and monthly figures for an example plan, edits six numbers (or everything in Complete), reruns, replays retiring into real history, then saves plans and compares two.

FIRST VIEWPORT: A glass top bar with the name, one-line purpose, Guided setup and the Minimal/Complete switch. Below it, two glass columns: the plan card on the left (six inputs in Minimal), the results card on the right with two method columns of large mono figures, the safer pair flagged. The fan chart card starts below. The frosted status bar is fixed at the bottom with Calculate, a raised blue key, at the right. Phone: plan, then results, status bar at the bottom.

FORM: Glassmorphism for surfaces and neumorphism for controls, over the existing console layout. seed: none (pinned) "Improve the visuals of the website with a mix of the glassmorphism style and neumorphism" (owner, 2026-11-25; backdrop: soft blue-graphite light; split: glass surfaces, soft controls). Signature kept: the stress test replays real history month by month as a drawn path; stale results turn dashed and are outlined in amber.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved

Product name (working name "PAC FIRE Planner"); custom domain.
