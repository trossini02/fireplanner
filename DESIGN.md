---
name: PAC FIRE Planner
description: A dark working console of frosted glass cards and soft, pressable controls that answers how much to retire early and how much to invest every month, twice.
colors:
  graphite-ground: "#0f1113"
  graphite-panel: "#16191c"
  graphite-hover: "#1d2125"
  graphite-raised: "#262b31"
  seam: "rgba(255, 255, 255, 0.075)"
  edge: "#6e7781"
  glass: "rgba(22, 26, 31, 0.64)"
  glass-line: "rgba(255, 255, 255, 0.08)"
  well: "rgba(8, 9, 11, 0.6)"
  ink: "#e3e6e9"
  ink-secondary: "#a1aab3"
  ink-tertiary: "#929ca6"
  signal-blue: "#8ab4f8"
  signal-blue-ink: "#0f1113"
  signal-blue-wash: "#1b2737"
  state-fresh: "#7fd49b"
  state-stale: "#e8b86a"
  state-error: "#f28b82"
  band-outer: "#242a31"
  band-inner: "#3a424c"
  ramp-1: "#d5dade"
  ramp-2: "#9aa2ab"
  ramp-3: "#68717b"
  ramp-4: "#434a52"
  dip-shade: "#23282e"
typography:
  display:
    fontFamily: "Geist Mono, ui-monospace, SF Mono, Menlo, monospace"
    fontSize: "clamp(21px, 5.6vw, 30px)"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "-0.03em"
    fontFeature: "tnum"
  display-sm:
    fontFamily: "Geist Mono, ui-monospace, SF Mono, Menlo, monospace"
    fontSize: "clamp(17px, 4.4vw, 20px)"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "-0.02em"
    fontFeature: "tnum"
  headline:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "19px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.005em"
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14.5px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
  pill:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "11.5px"
    fontWeight: 500
    lineHeight: 1.55
  data-input:
    fontFamily: "Geist Mono, ui-monospace, SF Mono, Menlo, monospace"
    fontSize: "14px"
    fontWeight: 500
    fontFeature: "tnum"
  data-log:
    fontFamily: "Geist Mono, ui-monospace, SF Mono, Menlo, monospace"
    fontSize: "12.5px"
    fontWeight: 400
    lineHeight: 1.45
    fontFeature: "tnum"
rounded:
  mark: "2px"
  month: "8px"
  control: "9px"
  action: "11px"
  track: "12px"
  frame: "16px"
  pill: "999px"
spacing:
  seam: "1px"
  xs: "6px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  gap: "12px"
  status-bar: "64px"
components:
  button-primary:
    backgroundColor: "{colors.signal-blue}"
    textColor: "{colors.signal-blue-ink}"
    rounded: "{rounded.action}"
    padding: "10px 20px"
    width: "9.5rem"
  button-secondary:
    backgroundColor: "linear-gradient(160deg, #24292f, #191c20)"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "6px 13px"
  button-secondary-hover:
    backgroundColor: "linear-gradient(160deg, #24292f, #191c20)"
    textColor: "{colors.ink}"
  chip:
    backgroundColor: "linear-gradient(160deg, #24292f, #191c20)"
    textColor: "{colors.ink-secondary}"
    rounded: "{rounded.control}"
    padding: "5px 12px"
  chip-selected:
    backgroundColor: "{colors.signal-blue-wash}"
    textColor: "{colors.signal-blue}"
    rounded: "{rounded.control}"
  mode-switch-selected:
    backgroundColor: "linear-gradient(160deg, #24292f, #191c20)"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "5px 13px"
  input-field:
    backgroundColor: "{colors.well}"
    textColor: "{colors.ink}"
    typography: "{typography.data-input}"
    rounded: "{rounded.control}"
    padding: "0 10px"
    height: "34px"
  panel:
    backgroundColor: "{colors.glass}"
    textColor: "{colors.ink}"
    rounded: "{rounded.frame}"
    padding: "16px 18px"
  pill:
    backgroundColor: "transparent"
    typography: "{typography.pill}"
    rounded: "{rounded.pill}"
    padding: "0 7px"
  status-bar:
    backgroundColor: "rgba(18, 21, 25, 0.62)"
    textColor: "{colors.ink-secondary}"
    typography: "{typography.data-log}"
    padding: "10px 16px"
    height: "{spacing.status-bar}"
---

# Design System: PAC FIRE Planner

## Overview

**Creative North Star: "The Night Console, under glass"**

The planner is a working console, not a landing page. Inputs and both methods' answers stay on screen together as panels, so the experience is: change a number, run it again, read the result. Since 2026-11-25 (owner's request) the panels are frosted glass cards floating over soft night light, and the controls set into them are dark neumorphism: fields are inset wells, choices and buttons are soft raised pills that press in. Words are set in Geist and every figure in Geist Mono, so numbers line up and read like instrument output. One soft blue marks the primary action and the current selection. Green, amber and red appear only to show state.

Density is deliberate. Cards sit 12px apart in a grid, padding is tight (16–18px, or 12px on phones), and labels are small and quiet so the large mono figures carry the screen. A status bar fixed to the bottom of the viewport holds the run log and Calculate, like the status line of a terminal. Motion serves the data. The signature moment is the stress test, which replays real market history month by month as a path drawn across the chart. When an input changes, every result it affects turns dashed and gets an amber outline until the plan is run again.

The system is dark only, by owner decision (2026-10-12). Both theme blocks carry the dark scheme so the host's light/dark contract is met without a light variant. It deliberately rejects the category default: a marketing hero with one friendly big number and a call to action.

**Key Characteristics:**
- Dark graphite ground lit by fixed, very soft light fields; translucent glass cards float over it with 12px gaps.
- Neumorphic controls: inset wells for fields and tracks, raised pills for chips and buttons, pressed in when selected or held.
- Geist for words, Geist Mono with tabular figures for every number, input and log line.
- One blue accent for action and selection. State colours are used for state only.
- Charts are neutral graphite steps with a single accent line.
- A fixed bottom status bar carries the run log and the primary action.
- Stale results are dashed and outlined in amber, never hidden.

**Governance.** The lead design skill is **impeccable**. The owner chose it on 2026-10-12, replacing frontend-design, which led the retired ledger-paper world. On 2026-11-25 the owner asked for a mix of glassmorphism and neumorphism (backdrop: soft blue-graphite light; split: glass surfaces, soft controls; layout, fonts, colours and features unchanged). That request replaced the Seams-Not-Shadows Rule and amended the One Signal Rule (below); impeccable stayed the lead. ui-ux-pro-max is used as a lookup only. Two of its findings are part of the system: html `scroll-padding-bottom` equals the status bar's height, so focus is never hidden (WCAG 2.2, focus not obscured), and field errors appear inline with the field (see Inputs). Three detector conflicts were resolved:
- The detector flags Geist and Geist Mono as overused fonts. The owner-approved sample and the direction pin them, and the brief wins.
- The detector's cramped-padding findings on the joined mode switch, the input fields and the group dividers were judged false positives in the finish review.
- The detector's nested-cards finding on the joined mode switch (`.seg.joined`, an inset radio track inside the glass top bar) was judged a false positive in the 2026-11-25 finish review: it is a control, not a content card.

## Colors

The palette is a cool graphite ladder with one soft blue signal and three state hues that stay silent until something changes.

### Primary
- **Signal Blue** (signal-blue): Calculate, the progress line, focus rings, selected chips and sell months, and the selected series line in a chart (the fan median and the stress path). Text on it uses Signal Blue Ink (graphite-ground). A selected chip sits on Signal Blue Wash (signal-blue-wash) with a blue border and blue label.

### Neutral
- **Graphite Ground** (graphite-ground): the page background under the light fields.
- **Night light**: three fixed radial light fields behind the page: Signal Blue at 20% top-left, a cool slate (#788aa8) at 14% right, Signal Blue at 10% bottom. They exist only so the glass has something to frost.
- **Glass** (glass): every card (top bar, plan, panels): 64% Graphite Panel over the light, with a 3% white sheen across its top 45%. **Glass Line** (glass-line) is its 1px border.
- **Well** (well): 60% near-black, the inside of fields, the mode-switch track, the guided progress track and unmarked tags.
- **Knob**: a gradient from #24292f to #191c20, the face of raised chips, buttons, sell months, the "essential" tag and the switch thumb.
- **Graphite Panel** (graphite-panel): kept as the opaque halo behind chart text and dots, and the native select menu.
- **Seam** (seam): translucent white at 7.5%: dividers inside cards (table rows, groups, the method columns) and chart grid lines.
- **Edge** (edge): borders on fields, table footers and the chart baseline. Raised controls use a softer 10% white border and rely on their text labels. Edge meets 3:1 against the brightest lit glass.
- **Ink / Ink Secondary / Ink Tertiary** (ink, ink-secondary, ink-tertiary): primary text, then supporting copy and labels, then hints, units and axis numbers. Ink Tertiary was lifted to #929ca6 on 2026-11-25 so it holds about 5:1 on the brightest lit glass.
- **Chart bands** (band-outer, band-inner): the fan chart's 10th to 90th and 25th to 75th percentile bands.
- **Grey ramp** (ramp-1 to ramp-4): the retirement-year stacked bars and their keys, from on time (lightest) to latest (darkest).
- **Dip Shade** (dip-shade): the stress chart's shading for months when stocks are 10% or more below their peak.

### State
- **Fresh** (state-fresh): only the fresh-state pill and the log dot after a successful run.
- **Stale** (state-stale): only the stale state: the dashed outline on outdated panels, the stale pill and the stale log line.
- **Error** (state-error): field borders and messages, invalid group summaries, the error log line, and the armed Delete button.

### Named Rules
**The One Signal Rule.** Blue means "act here" or "this is selected". It never fills a band, shades a region or decorates a heading. The one exception, chosen by the owner on 2026-11-25, is the faint fixed light behind the glass (at most 20%, never on a card's own fill).

**The State-Only Rule.** Green, amber and red describe state (fresh, stale, error) and nothing else. Amber in particular means stale only. That is why dip shading is a graphite step and not a warning colour.

**The Graphite Data Rule.** Chart areas, bands and stacked bars use neutral graphite and grey steps. The only coloured mark in a chart is the selected series line.

## Typography

**Body Font:** Geist (with ui-sans-serif, system-ui, sans-serif)
**Label/Mono Font:** Geist Mono (with ui-monospace, SF Mono, Menlo, monospace)

**Character:** Geist is a neutral, engineered sans for words. Geist Mono turns every number into readable instrument output. The owner-approved sample and the direction pin this pairing.

### Hierarchy
- **Display** (Geist Mono 500, clamp 21–30px, 1.1, -0.03em): the capital and monthly figures in each method column.
- **Display small** (Geist Mono 500, clamp 17–20px): secondary figures such as the other timings' monthly amounts.
- **Headline** (Geist 600, 19px, 1.2): the product name in the top bar, used once.
- **Title** (Geist 600, 15px, 1.3): panel headings. Method column headings use Geist 500 at 14px.
- **Body** (Geist 400, 14.5px, 1.5): verdict sentences (15px) and explanatory copy, held to 62–75ch.
- **Label** (Geist 400, 12.5–13.5px): field labels, notes and legends. Hints are 12.5px in Ink Tertiary.
- **Pill** (Geist 500, 11.5px): state and flag pills, in sentence case.
- **Data** (Geist Mono 500 at 14px for inputs, 400 at 12.5px for the log, summaries and units; 11.5px for chart axis numbers): every figure outside the display sizes.

### Named Rules
**The Figures-in-Mono Rule.** Every number is set in Geist Mono with tabular figures: inputs, readouts, table cells, axis ticks, the run log, and bold figures inside sentences. Words are in Geist, including pills, buttons and chart annotations ("Capital you need", "Target retirement").

**The Sentence-Case Rule.** Labels, pills and buttons are in plain sentence case. Nothing uses all caps or wide tracking. The UI is in English, with the currency as an input.

**The Compact-Readout Rule.** Figures in readouts are rounded to a compact form (for example €1.35M or €893K). Inputs show full values in the page's own format.

## Layout

The page is a console with a maximum width of 1480px and a 16px gutter. A top bar holds the name, a one-line purpose, the Guided setup button and the Minimal/Complete switch. Below it, 12px down, is the desk: a grid of glass cards with 12px gaps, aligned to the top. From 1040px wide, the plan card takes a fixed 25rem column on the left and scrolls with the page (it is taller than the viewport, so it is not sticky). The results stack fills the rest. From 1320px wide, the stack splits into two columns, and panels marked wide span both. Inside the results panel, the two method columns sit side by side between Seam rules at every width.

Spacing is tight: 16px by 18px panel padding (14px by 12px at 640px and below), 12px group-header padding, and 6–14px between elements. Form rows pair a flexible label with a right-hand field column of 7.5–10.5rem. The status bar is fixed to the bottom with a 64px reserved height. The body is padded by that height, and html `scroll-padding-bottom` is set to it plus 24px. Below 1040px the plan spans the desk, and its contents stop at 40rem so each label stays near its field. On phones the plan comes first, then the results, inputs go up to 16px so iOS does not zoom, and the status bar's side padding drops to the 12px gutter.

## Elevation & Depth

Three depths, from the owner's 2026-11-25 request.
- **Glass (cards):** translucent Glass fill, a 1px Glass Line border, and the `--lift` shadow: a 1px inner top highlight (7% white), a long soft drop (0 24px 48px -28px at 85% black) and a short contact shadow (0 2px 8px at 22%). Cards do not blur what is behind them, because only smooth light sits there.
- **Frosted (status bar):** the one surface content slides under, so it is the one with real `backdrop-filter: blur(20px) saturate(150%)` over a 62% fill. Without backdrop-filter support it falls back to a 96% fill.
- **Soft controls (neumorphism):** light comes from the top-left. Raised (`--neu-up`): -2px -2px 6px at 5.5% white and 3px 3px 8px at 55% black. Inset (`--neu-in`): inset 2px 2px 5px at 60% black and inset -1px -1px 3px at 5% white. Fields, tracks and selected or held controls are inset; everything else pressable is raised.

### Named Rules
**The Glass-and-Soft Rule.** Surfaces are glass; things you touch are soft. Cards never use neumorphic shadows, and controls never use glass. Blur appears only where content actually passes underneath.

**The Pressed-Is-Not-Enough Rule.** An inset shadow never carries state alone: selected chips and months keep the blue wash, blue border and blue text, and fields keep their 3:1 Edge border.

## Shapes

Corners are soft and consistent. Cards (top bar, plan, panels) use 16px on all four corners. Controls (fields, chips, buttons, the switch thumb) use 9px, sell months 8px. Calculate uses 11px and the mode-switch track 12px. The guided progress track is 6px tall with 3px ends. Pills and tags are fully rounded. Chart swatches and bar keys use a 2px radius, and stacked bars use 3px. Disclosure chevrons are drawn as two 1.5px CSS borders rotated in place, so they match the stroke weight of the controls.

## Components

### Buttons
Quiet and outlined, except the one that runs the plan.
- **Shape:** soft (9px). Calculate uses 11px.
- **Primary (Calculate):** a raised blue key: Signal Blue with a lighter top (#9dc1fa), a 40% white inner top highlight and the raised shadow, with Graphite Ground text, Geist 600 at 14.5px, 10px 20px padding, at least 9.5rem wide (7.5rem with 16px side padding on phones, so the log keeps to two lines). It always sits at the right end of the status bar. It brightens on hover (brightness 1.08) and presses in while held. While running it is desaturated with a progress cursor, and a 2px blue progress line grows along the top edge of the status bar.
- **Secondary:** a raised Knob pill with a 10% white border and Ink text, Geist 500 at 13.5px. On hover it brightens (1.15) and the border lightens; while held it presses in. Disabled buttons drop to 45% opacity. "Skip to the planner" stays flat and borderless.
- **Destructive (Delete):** a secondary button whose text and border turn red on hover or focus. It must be pressed twice: the first press arms it (red at rest), the second deletes.

### Chips (segmented choices)
- **Style:** real radio inputs with styled labels. Each is a raised Knob pill with a 10% white border and Ink Secondary text at 13px, with 6px gaps.
- **Selected:** pressed in (inset shadow) with a Signal Blue Wash fill, blue border and blue text. Sell-month toggles in a six-column grid follow the same treatment.
- **Mode switch:** an inset Well track (3px padding, Glass Line border, 12px) holding a raised Knob thumb on the current view, with Ink text. It is neutral, not blue, because it changes the view, not the plan.

### Cards / Containers (panels)
- **Corner Style:** 16px on all corners.
- **Background:** Glass, with a Glass Line border.
- **Shadow Strategy:** the `--lift` glass shadow (see Elevation & Depth).
- **Header:** a Geist 600 15px title, with an optional state pill on the right.
- **Internal Padding:** 16px by 18px (14px by 12px on phones). The method columns bleed to the card edge between two Seam rules, with a Seam line between them.

### Inputs / Fields
- **Style:** a 34px-tall inset Well (inset shadow) with an Edge border and 9px radius. Values are Geist Mono 500, right-aligned, with the unit after them in mono Ink Tertiary. Selects and free-text name fields switch to Geist and align left.
- **Format:** number inputs are text fields in the page's own format. Money uses "," for thousands, and rates accept "," or "." as the decimal point. There are no spinners.
- **Hover / Focus:** on hover the border lightens to Ink Tertiary. On focus the border turns Signal Blue with a 1px blue ring, added to the inset shadow.
- **Error:** a red border, `aria-invalid`, an inline red message under the row linked by `aria-describedby`, and focus moved to the field. The same error is written to the status log.

### Pills
- **Style:** transparent, 1px border in `currentColor`, Geist 500 at 11.5px, fully rounded.
- **Variants:** Ink for the "plan with this" flag on the safer figure in each pair, Fresh, Stale and Error for result state, Ink Tertiary for neutral states. A hidden flag keeps its space so the method columns line up.

### Navigation
There is no site navigation. The top bar carries the name, a one-line purpose, a secondary Guided setup button and the Minimal/Complete switch. A first visit opens the guided setup; after it, Minimal is the mode and the choice is remembered per browser. In Complete mode the plan panel becomes collapsible groups. Each header is a full-width button in Geist 500 at 14px, with a mono summary on the right and a chevron. Headers take a 3.5% white wash on hover.

### Guided Setup
Minimal's questions one per page, using the plan's own fields (no copies). The plan panel takes the whole desk, its content held to 36rem; the results stack and the status bar are hidden. Above the fields: a 6px inset Well track with a Signal Blue fill for progress, "Step n of N" in mono Ink Tertiary, and the question in Geist 600 at 19px. Below: Back (secondary), a borderless "Skip to the planner", and Next (primary, "See my plan" on the last step). Enter moves on; field errors behave as in the plan and send the visitor back to the step that holds the field.

### Status Bar (signature)
A full-width frosted glass bar fixed to the bottom (see Elevation & Depth), with a Glass Line top border, a soft upward shadow and padding that respects the safe area. On the left is the run log in Geist Mono 12.5px, led by a 7px dot: grey when idle, blue while running, green when fresh, amber with amber text when stale, red with red text on error. Calculate sits on the right. On phones the log wraps to two lines.

### Charts
Charts are runtime SVG on the panel ground. Horizontal grid lines use Seam, the baseline uses Edge, and axis numbers are Geist Mono 11.5px in Ink Tertiary with a panel-coloured halo. The fan chart draws two graphite bands, a 2px Signal Blue median, a dashed 1.5px Ink Secondary line for the capital target, and a dotted retirement marker. Its y-axis is capped at the larger of 1.5 × the highest median and 1.6 × the capital, so the years around retirement stay readable. When the best futures run off the top, a note says so. The stress chart draws the path in Signal Blue over Dip Shade bands. A hover or tap shows a 1px crosshair, a 4px blue dot and a readout above the chart. Every chart has a "Show the numbers" table.

### Stale State and Replay (signature)
When inputs change, each panel holding an affected result gets a 1px dashed amber outline. Its figures dim to Ink Secondary, and the chart's selected line becomes dashed (5 4). The panel is never blanked. The stress replay reveals the path month by month at a steady pace (up to 2.4s), with the readout following the playhead. With reduced motion, the full path is drawn at once, and all transitions (150–160ms ease-out) are switched off.

## Do's and Don'ts

### Do:
- **Do** float panels as Glass cards 12px apart, and keep neumorphic raised/inset shadows for controls only.
- **Do** keep blur for surfaces content really slides under (the status bar), with a solid fallback.
- **Do** set every figure in Geist Mono with tabular numbers, and every word in Geist.
- **Do** keep Signal Blue to Calculate, progress, focus, selected chips and months, and the selected series line.
- **Do** use graphite bands and the grey ramp for chart areas and stacked bars.
- **Do** mark outdated results with a dashed amber outline and dimmed figures, and keep them visible.
- **Do** keep the fixed status bar's height reserved with body padding and `scroll-padding-bottom`, so focus is never hidden.
- **Do** show field errors inline with `aria-invalid` and `aria-describedby`, move focus to the field, and repeat the error in the log.
- **Do** offer a "Show the numbers" table under every chart.

### Don't:
- **Don't** put neumorphic shadows on cards, glass on controls, or let a pressed shadow carry selection without the blue.
- **Don't** raise the backdrop light until Ink Tertiary drops below 4.5:1 or Edge below 3:1 on the brightest lit glass.
- **Don't** use amber for anything but stale, green for anything but the fresh pill and log dot, or red for anything but errors and the armed Delete.
- **Don't** fill chart bands, dips or headings with Signal Blue.
- **Don't** set words, pills or chart annotations in mono, or numbers in the sans.
- **Don't** add a light theme. The system is dark only by owner decision.
- **Don't** add all-caps labels or a marketing hero with one big number and a call to action.
