---
name: PAC FIRE Planner
description: A dark working console that answers how much to retire early and how much to invest every month, twice.
colors:
  graphite-ground: "#0f1113"
  graphite-panel: "#16191c"
  graphite-hover: "#1d2125"
  graphite-raised: "#262b31"
  seam: "#2a2f35"
  edge: "#626b75"
  ink: "#e3e6e9"
  ink-secondary: "#a1aab3"
  ink-tertiary: "#828c96"
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
  control: "6px"
  action: "7px"
  frame: "8px"
  pill: "999px"
spacing:
  seam: "1px"
  xs: "6px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  status-bar: "64px"
components:
  button-primary:
    backgroundColor: "{colors.signal-blue}"
    textColor: "{colors.signal-blue-ink}"
    rounded: "{rounded.action}"
    padding: "10px 20px"
    width: "9.5rem"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "6px 12px"
  button-secondary-hover:
    backgroundColor: "{colors.graphite-hover}"
    textColor: "{colors.ink}"
  chip:
    backgroundColor: "transparent"
    textColor: "{colors.ink-secondary}"
    rounded: "{rounded.control}"
    padding: "5px 11px"
  chip-selected:
    backgroundColor: "{colors.signal-blue-wash}"
    textColor: "{colors.signal-blue}"
    rounded: "{rounded.control}"
  mode-switch-selected:
    backgroundColor: "{colors.graphite-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.action}"
    padding: "6px 14px"
  input-field:
    backgroundColor: "{colors.graphite-ground}"
    textColor: "{colors.ink}"
    typography: "{typography.data-input}"
    rounded: "{rounded.control}"
    padding: "0 9px"
    height: "34px"
  panel:
    backgroundColor: "{colors.graphite-panel}"
    textColor: "{colors.ink}"
    padding: "16px"
  pill:
    backgroundColor: "transparent"
    typography: "{typography.pill}"
    rounded: "{rounded.pill}"
    padding: "0 7px"
  status-bar:
    backgroundColor: "{colors.graphite-panel}"
    textColor: "{colors.ink-secondary}"
    typography: "{typography.data-log}"
    padding: "10px 16px"
    height: "{spacing.status-bar}"
---

# Design System: PAC FIRE Planner

## Overview

**Creative North Star: "The Night Console"**

The planner is a working console, not a landing page. Inputs and both methods' answers stay on screen together as tiled graphite panels, so the experience is: change a number, run it again, read the result. Panels sit on a slightly darker ground and are separated by 1px seams, never by shadows. Words are set in Geist and every figure in Geist Mono, so numbers line up and read like instrument output. One soft blue marks the primary action and the current selection. Green, amber and red appear only to show state.

Density is deliberate. Panels pack edge to edge in a grid, padding is tight (16px, or 12px on phones), and labels are small and quiet so the large mono figures carry the screen. A status bar fixed to the bottom of the viewport holds the run log and Calculate, like the status line of a terminal. Motion serves the data. The signature moment is the stress test, which replays real market history month by month as a path drawn across the chart. When an input changes, every result it affects turns dashed and gets an amber outline until the plan is run again.

The system is dark only, by owner decision (2026-10-12). Both theme blocks carry the dark scheme so the host's light/dark contract is met without a light variant. It deliberately rejects the category default: a marketing hero with one friendly big number and a call to action.

**Key Characteristics:**
- Dark graphite ground with panels one step lighter, tiled on 1px seams.
- Geist for words, Geist Mono with tabular figures for every number, input and log line.
- One blue accent for action and selection. State colours are used for state only.
- Charts are neutral graphite steps with a single accent line.
- A fixed bottom status bar carries the run log and the primary action.
- Stale results are dashed and outlined in amber, never hidden.

**Governance.** The lead design skill is **impeccable**. The owner chose it on 2026-10-12, replacing frontend-design, which led the retired ledger-paper world. ui-ux-pro-max is used as a lookup only. Two of its findings are part of the system: html `scroll-padding-bottom` equals the status bar's height, so focus is never hidden (WCAG 2.2, focus not obscured), and field errors appear inline with the field (see Inputs). Two detector conflicts were resolved:
- The detector flags Geist and Geist Mono as overused fonts. The owner-approved sample and the direction pin them, and the brief wins.
- The detector's cramped-padding findings on the joined mode switch, the input fields and the group dividers were judged false positives in the finish review.

## Colors

The palette is a cool graphite ladder with one soft blue signal and three state hues that stay silent until something changes.

### Primary
- **Signal Blue** (signal-blue): Calculate, the progress line, focus rings, selected chips and sell months, and the selected series line in a chart (the fan median and the stress path). Text on it uses Signal Blue Ink (graphite-ground). A selected chip sits on Signal Blue Wash (signal-blue-wash) with a blue border and blue label.

### Neutral
- **Graphite Ground** (graphite-ground): the page background and the inside of input fields, which reads as an inset well.
- **Graphite Panel** (graphite-panel): every panel, the top bar and the status bar.
- **Graphite Hover** (graphite-hover): hover fill for group headers and secondary buttons.
- **Graphite Raised** (graphite-raised): the selected side of the Minimal/Complete switch and the "essential" tag. It is a neutral selection, used where the choice is a view mode rather than a plan value.
- **Seam** (seam): 1px dividers between panels and table rows. Panels show the seam through a 1px grid gap.
- **Edge** (edge): borders on controls (fields, chips, buttons), table footers and the chart baseline. It meets 3:1 against the ground.
- **Ink / Ink Secondary / Ink Tertiary** (ink, ink-secondary, ink-tertiary): primary text, then supporting copy and labels, then hints, units and axis numbers.
- **Chart bands** (band-outer, band-inner): the fan chart's 10th to 90th and 25th to 75th percentile bands.
- **Grey ramp** (ramp-1 to ramp-4): the retirement-year stacked bars and their keys, from on time (lightest) to latest (darkest).
- **Dip Shade** (dip-shade): the stress chart's shading for months when stocks are 10% or more below their peak.

### State
- **Fresh** (state-fresh): only the fresh-state pill and the log dot after a successful run.
- **Stale** (state-stale): only the stale state: the dashed outline on outdated panels, the stale pill and the stale log line.
- **Error** (state-error): field borders and messages, invalid group summaries, the error log line, and the armed Delete button.

### Named Rules
**The One Signal Rule.** Blue means "act here" or "this is selected". It never fills a band, shades a region or decorates a heading.

**The State-Only Rule.** Green, amber and red describe state (fresh, stale, error) and nothing else. Amber in particular means stale only. That is why dip shading is a graphite step and not a warning colour.

**The Graphite Data Rule.** Chart areas, bands and stacked bars use neutral graphite and grey steps. The only coloured mark in a chart is the selected series line.

## Typography

**Body Font:** Geist (with ui-sans-serif, system-ui, sans-serif)
**Label/Mono Font:** Geist Mono (with ui-monospace, SF Mono, Menlo, monospace)

**Character:** Geist is a neutral, engineered sans for words. Geist Mono turns every number into readable instrument output. The owner-approved sample and the direction pin this pairing.

### Hierarchy
- **Display** (Geist Mono 500, clamp 21–30px, 1.1, -0.03em): the capital and monthly figures in each method column.
- **Display small** (Geist Mono 500, clamp 17–20px): secondary figures such as the "waiting for a dip" amount.
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

The page is a console with a maximum width of 1480px and a 16px gutter. A top bar holds the name, a one-line purpose and the Minimal/Complete switch. Below it is the desk: a grid whose 1px gap shows the seam colour through, so the panels look tiled rather than floating. From 1040px wide, the plan panel takes a fixed 25rem column on the left, and in Minimal mode its contents stay in view as the page scrolls (sticky). The results stack fills the rest. From 1320px wide, the stack splits into two columns, and panels marked wide span both. Inside the results panel, the two method columns sit side by side on the seam grid at every width.

Spacing is tight: 16px panel padding (12px at 640px and below), 12px group-header padding, and 6–14px between elements. Form rows pair a flexible label with a right-hand field column of 7.5–10.5rem. The status bar is fixed to the bottom with a 64px reserved height. The body is padded by that height, and html `scroll-padding-bottom` is set to it plus 24px. Below 1040px the plan spans the desk, and its contents stop at 40rem so each label stays near its field. On phones the plan comes first, then the results, inputs go up to 16px so iOS does not zoom, and the status bar's side padding drops to the 12px gutter.

## Elevation & Depth

The system is flat. Depth comes only from tone: the ground (graphite-ground) sits below the panels (graphite-panel), and input fields drop back to the ground colour to read as inset wells. Separation comes from 1px seams. The only `box-shadow` in the build is the 1px blue ring added to a focused field, which is a focus indicator, not elevation.

### Named Rules
**The Seams-Not-Shadows Rule.** Panels are divided by 1px seams and tonal steps, never by drop shadows. A surface that needs to stand out gets a lighter graphite step or an edge border.

## Shapes

Corners are small and consistent. Controls (fields, chips, buttons, sell months) use a 6px radius. Calculate and the joined mode switch use 7px. The outer console frame uses 8px, but only on its outside corners: the top bar rounds its top corners and the desk rounds its bottom corners, so the two read as one frame. Panels inside the frame are square. Pills and tags are fully rounded. Chart swatches and bar keys use a 2px radius, and stacked bars use 3px. Disclosure chevrons are drawn as two 1.5px CSS borders rotated in place, so they match the stroke weight of the controls.

## Components

### Buttons
Quiet and outlined, except the one that runs the plan.
- **Shape:** gently squared (6px). Calculate uses 7px.
- **Primary (Calculate):** Signal Blue fill with Graphite Ground text, Geist 600 at 14.5px, 10px 20px padding, at least 9.5rem wide (7.5rem with 16px side padding on phones, so the log keeps to two lines). It always sits at the right end of the status bar. It brightens on hover (brightness 1.08). While running it is desaturated with a progress cursor, and a 2px blue progress line grows along the top edge of the status bar.
- **Secondary:** transparent with an Edge border and Ink text, Geist 500 at 13.5px. On hover it fills with Graphite Hover and the border lightens to Ink Tertiary. Disabled buttons drop to 45% opacity.
- **Destructive (Delete):** a secondary button whose text and border turn red on hover or focus. It must be pressed twice: the first press arms it (red at rest), the second deletes.

### Chips (segmented choices)
- **Style:** real radio inputs with styled labels. Each has a transparent background, an Edge border and Ink Secondary text at 13px, with 6px gaps.
- **Selected:** Signal Blue Wash fill, blue border and blue text. Sell-month toggles in a six-column grid follow the same treatment.
- **Mode switch:** a joined variant with no gaps, a shared Edge border and internal dividers. Its selected side uses Graphite Raised and Ink, not blue, because it changes the view, not the plan.

### Cards / Containers (panels)
- **Corner Style:** square inside the console frame (8px on the frame's outer corners only).
- **Background:** Graphite Panel.
- **Shadow Strategy:** none (see Elevation & Depth).
- **Header:** a Geist 600 15px title, with an optional state pill on the right.
- **Internal Padding:** 16px (12px on phones). Nested grids (method columns) bleed to the panel edge and repeat the seam grid.

### Inputs / Fields
- **Style:** a 34px-tall Graphite Ground well with an Edge border and 6px radius. Values are Geist Mono 500, right-aligned, with the unit after them in mono Ink Tertiary. Selects and free-text name fields switch to Geist and align left.
- **Format:** number inputs are text fields in the page's own format. Money uses "," for thousands, and rates accept "," or "." as the decimal point. There are no spinners.
- **Hover / Focus:** on hover the border lightens to Ink Tertiary. On focus the border turns Signal Blue with a 1px blue ring.
- **Error:** a red border, `aria-invalid`, an inline red message under the row linked by `aria-describedby`, and focus moved to the field. The same error is written to the status log.

### Pills
- **Style:** transparent, 1px border in `currentColor`, Geist 500 at 11.5px, fully rounded.
- **Variants:** Ink for the "plan with this" flag on the safer figure in each pair, Fresh, Stale and Error for result state, Ink Tertiary for neutral states. A hidden flag keeps its space so the method columns line up.

### Navigation
There is no site navigation. The top bar carries the name, a one-line purpose and the Minimal/Complete switch. Minimal is the default mode and the choice is remembered per browser. In Complete mode the plan panel becomes collapsible groups. Each header is a full-width button in Geist 500 at 14px, with a mono summary on the right and a chevron. Headers fill with Graphite Hover on hover.

### Status Bar (signature)
A full-width bar fixed to the bottom on Graphite Panel, with a top seam and padding that respects the safe area. On the left is the run log in Geist Mono 12.5px, led by a 7px dot: grey when idle, blue while running, green when fresh, amber with amber text when stale, red with red text on error. Calculate sits on the right. On phones the log wraps to two lines.

### Charts
Charts are runtime SVG on the panel ground. Horizontal grid lines use Seam, the baseline uses Edge, and axis numbers are Geist Mono 11.5px in Ink Tertiary with a panel-coloured halo. The fan chart draws two graphite bands, a 2px Signal Blue median, a dashed 1.5px Ink Secondary line for the capital target, and a dotted retirement marker. Its y-axis is capped at the larger of 1.5 × the highest median and 1.6 × the capital, so the years around retirement stay readable. When the best futures run off the top, a note says so. The stress chart draws the path in Signal Blue over Dip Shade bands. A hover or tap shows a 1px crosshair, a 4px blue dot and a readout above the chart. Every chart has a "Show the numbers" table.

### Stale State and Replay (signature)
When inputs change, each panel holding an affected result gets a 1px dashed amber outline. Its figures dim to Ink Secondary, and the chart's selected line becomes dashed (5 4). The panel is never blanked. The stress replay reveals the path month by month at a steady pace (up to 2.4s), with the readout following the playhead. With reduced motion, the full path is drawn at once, and all transitions (150–160ms ease-out) are switched off.

## Do's and Don'ts

### Do:
- **Do** separate panels with 1px Seam lines through a grid gap, and step tone (ground, panel, hover, raised) for depth.
- **Do** set every figure in Geist Mono with tabular numbers, and every word in Geist.
- **Do** keep Signal Blue to Calculate, progress, focus, selected chips and months, and the selected series line.
- **Do** use graphite bands and the grey ramp for chart areas and stacked bars.
- **Do** mark outdated results with a dashed amber outline and dimmed figures, and keep them visible.
- **Do** keep the fixed status bar's height reserved with body padding and `scroll-padding-bottom`, so focus is never hidden.
- **Do** show field errors inline with `aria-invalid` and `aria-describedby`, move focus to the field, and repeat the error in the log.
- **Do** offer a "Show the numbers" table under every chart.

### Don't:
- **Don't** use drop shadows to lift panels or cards.
- **Don't** use amber for anything but stale, green for anything but the fresh pill and log dot, or red for anything but errors and the armed Delete.
- **Don't** fill chart bands, dips or headings with Signal Blue.
- **Don't** set words, pills or chart annotations in mono, or numbers in the sans.
- **Don't** add a light theme. The system is dark only by owner decision.
- **Don't** add all-caps labels or a marketing hero with one big number and a call to action.
