---
name: Pour Decisions
description: The house scoreboard for a crew's night out. Black glass, white type, one lit colour.
colors:
  tap-light-amber: "#ffb000"
  tap-light-amber-hi: "#ffc53d"
  amber-soft: "rgba(255, 176, 0, .14)"
  amber-line: "rgba(255, 176, 0, .62)"
  groom-gold: "#f3d37c"
  bar-black: "#000000"
  surface-1: "#0e0e10"
  surface-2: "#18181b"
  surface-3: "#232327"
  surface-4: "#303036"
  line: "#222226"
  line-2: "#35353b"
  line-3: "#62626d"
  ink: "#ffffff"
  ink-2: "#dedee3"
  ink-3: "#b1b1bb"
  ink-4: "#8a8a95"
  signal-red: "#ff867c"
  signal-green: "#2fd47a"
  drink-beer: "#c98500"
  drink-wine: "#d55181"
  drink-shot: "#9085e9"
  drink-seltzer: "#199e70"
  drink-cocktail: "#3987e5"
  drink-spirit: "#d95926"
  drink-water: "#58aee0"
  drink-zero: "#a3acb3"
  daylight-bg: "#f4f3f0"
  daylight-surface-1: "#ffffff"
  daylight-ink: "#0a0a0a"
  daylight-amber-text: "#7a4300"
  daylight-red: "#9c1109"
  marquee-housing: "#060606"
typography:
  display:
    fontFamily: "Mona Sans, Helvetica Neue, Helvetica, Arial, system-ui, sans-serif"
    fontSize: "clamp(1.7rem, 7.7vw, 2.15rem)"
    fontWeight: 850
    lineHeight: 1.03
    letterSpacing: "-0.028em"
    fontVariation: "'wdth' 125"
  wordmark:
    fontFamily: "Mona Sans, Helvetica Neue, Helvetica, Arial, system-ui, sans-serif"
    fontSize: "0.98rem"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "0.012em"
    fontVariation: "'wdth' 125"
  headline:
    fontFamily: "Mona Sans, Helvetica Neue, Helvetica, Arial, system-ui, sans-serif"
    fontSize: "1.85rem"
    fontWeight: 850
    lineHeight: 1.02
    letterSpacing: "-0.025em"
    fontVariation: "'wdth' 125"
  title:
    fontFamily: "Mona Sans, Helvetica Neue, Helvetica, Arial, system-ui, sans-serif"
    fontSize: "1.2rem"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.012em"
    fontVariation: "'wdth' 114"
  score:
    fontFamily: "Mona Sans, Helvetica Neue, Helvetica, Arial, system-ui, sans-serif"
    fontSize: "2.2rem"
    fontWeight: 800
    lineHeight: 1
    fontVariation: "'wdth' 75"
  body:
    fontFamily: "Mona Sans, Helvetica Neue, Helvetica, Arial, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 450
    lineHeight: 1.45
  label:
    fontFamily: "Mona Sans, Helvetica Neue, Helvetica, Arial, system-ui, sans-serif"
    fontSize: "0.84rem"
    fontWeight: 650
    lineHeight: 1.2
  receipt:
    fontFamily: "Martian Mono, ui-monospace, SF Mono, Menlo, Consolas, monospace"
    fontSize: "0.72rem"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "0.05em"
rounded:
  xs: "6px"
  s: "11px"
  m: "14px"
  l: "18px"
  xl: "24px"
  sheet: "28px"
  full: "99px"
spacing:
  gap: "18px"
  gap-desktop: "22px"
  bleed: "16px"
  card-pad: "18px"
  container: "1240px"
components:
  button-primary:
    backgroundColor: "{colors.tap-light-amber}"
    textColor: "{colors.bar-black}"
    rounded: "{rounded.m}"
    padding: "0 16px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.tap-light-amber-hi}"
  button-default:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    rounded: "{rounded.m}"
    padding: "0 16px"
    height: "44px"
  button-default-hover:
    backgroundColor: "{colors.surface-3}"
  button-danger:
    backgroundColor: "{colors.signal-red}"
    textColor: "{colors.bar-black}"
    rounded: "{rounded.m}"
    height: "44px"
  chip:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.full}"
    padding: "0 16px"
    height: "40px"
  chip-on:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.bar-black}"
  input:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "13px"
    padding: "0 14px"
    height: "48px"
  card:
    backgroundColor: "{colors.surface-1}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "18px"
  fab:
    backgroundColor: "{colors.tap-light-amber}"
    textColor: "{colors.bar-black}"
    rounded: "{rounded.full}"
    size: "62px"
  tab:
    textColor: "{colors.ink-3}"
    typography: "{typography.label}"
    rounded: "{rounded.m}"
    height: "52px"
  tab-on:
    textColor: "{colors.ink}"
---

# Design System: Pour Decisions

Scope: `pour-decisions/` (the landing page `index.html` and `board.html`). Its own system, independent of the portfolio's root `DESIGN.md`. The CSS header comment in `board.html` is the original statement of these rules; keep the two in agreement.

## Overview

**Creative North Star: "The House Scoreboard"**

Pour Decisions is the scoreboard over the bar: black glass, white type, one lit colour. It is used in dark rooms, on phones, by people mid-conversation, so everything quiet stays quiet and the few things that matter glow. Amber is the house light. It marks what is live, what is yours, and the main action. Everything else is black, greys and crisp white type.

One element is allowed to be loud: the dot-matrix **marquee**, a lit LED sign rendered to canvas inside a dark glass housing with an amber under-glow. Everything around it is restrained so it can perform. Dark is the base because bars are dark. The light "Daylight" theme exists for daytime use (the pool), and the marquee and recap poster keep their dark look in both themes because they are objects, not pages.

The voice is a scoreboard with a sense of humour: expanded, uppercase-capable Mona Sans for the names of things, condensed numerals for scores, and Martian Mono as the receipt printer and the clock.

**Key Characteristics:**
- Pure black ground with stepped near-black surfaces and grey hairlines.
- One accent, Tap-Light Amber; every other colour is either a status mark or data.
- One typeface at three widths (expanded for names, normal for reading, condensed for scores), plus a mono for receipts.
- A 7:1 contrast floor for all live text in both themes, including hover and focus.
- Phone-first: bottom tab bar, central amber log button, bottom sheets; a two-column board at 900px and up, plus a TV mode.

## Colors

A blackout palette with one lit colour; data colours are a separate, validated vocabulary.

### Primary
- **Tap-Light Amber:** the only accent. It covers primary buttons, the floating log button, the wordmark's "Decisions" plate, the active tab icon, the desktop nav underline, the focus ring, your own row on the standings (as the soft fill plus amber edge), selected drink tiles, checked checkboxes, and the "waiting" sync dot. The **hi** step is its hover. In Daylight the fill stays the same, but amber used as text darkens to a deep brown for contrast.

### Secondary
- **Groom Gold:** reserved for the guest of honour (the groom's tag, avatar ring and crown). It is the one non-amber warm colour on the chrome and is never used for anything else.

### Tertiary (status marks)
- **Signal Green:** connected and done (the live sync dot pulses green).
- **Signal Red:** offline and destructive (danger buttons, delete confirmations, error text). It is a soft coral on black and a deep red in Daylight.
- **Drink Water blue** doubles as the note and view-only status mark.

### Neutral
- **Bar Black:** the page ground. Surfaces 1–4 step up from it for cards, controls, hover states and tooltips.
- **Lines 1–3:** hairline, default control border, and emphasis or hover border.
- **Ink 1–4:** primary text, secondary text, tertiary and captions, and disabled or hairline marks only (Ink 4 is below the contrast floor for live text).
- **Daylight set:** a warm off-white ground, white cards and near-black ink, applied by device preference or the in-app theme choice.

### Data colours
Eight drink colours (beer, wine, shot, seltzer, cocktail, neat spirit, water, zero-proof) and sixteen crew avatar colours, each with a deeper Daylight variant. The drink set is ordered for colour-blind separation in stacked bars. The hourly heatmap uses a five-step amber ramp.

### Named Rules
**The One Lit Colour Rule.** Amber is the only accent on the chrome. Any other hue on screen is either a status mark with its usual meaning or data.

**The Data Is Not Decoration Rule.** Drink and crew colours appear only where they encode a drink type or a person. Change the stacked-bar order and the colours together, never one without the other.

**The 7:1 Rule.** Every piece of live text is 7:1 or better against its background, in both themes, in every state.

## Typography

**Display Font:** Mona Sans, a variable face (width 75–125%, weight 200–900), self-hosted
**Body Font:** Mona Sans at normal width
**Label/Mono Font:** Martian Mono, self-hosted

**Character:** one family doing three jobs through its width axis. Expanded and very heavy, it is a stadium sign; normal, it reads easily; condensed, it packs big numbers into small tiles. Martian Mono adds the printed-receipt texture for codes, times and recap lines.

### Hierarchy
- **Display:** the crawl's name in the board hero. It steps down in two sizes for long names and grows to around 3.2rem on desktop.
- **Wordmark:** "POUR" in plain uppercase beside "DECISIONS" on a rounded amber plate, set in the heaviest weight at full expansion.
- **Headline:** panel titles (The Crawl, Stats, The Tab).
- **Title:** card titles (Standings, The Race, The Mix, Awards); sheet titles run slightly larger.
- **Score:** condensed heavy numerals for tiles, hero stats, steppers and standings counts.
- **Body:** reading text and inputs, at weight 450.
- **Label:** field labels, eyebrows, tabs, chips and buttons, in the 600–750 weight range.
- **Receipt:** uppercase mono for the recap receipt, crawl codes (wide tracking) and the "or" divider.

### Named Rules
**The Three Widths Rule.** Expanded for the names of things, normal for reading, condensed for scores. Don't add another typeface.

## Layout

Phone first. The main column has 16px side padding and 18px gaps between blocks, plus 124px of bottom padding to clear the fixed tab bar. Horizontal chip rows bleed to the screen edge. The top bar is a sticky 58px frosted strip with the wordmark, sync pill and avatar.

At 900px and up the tab bar disappears, the top bar grows to 68px with an underlined text nav, and the board becomes two columns: about 1.42fr for standings and the feed, and a 330px-minimum side column. The content column widens to 1240px with 22px gaps. The Crawl and The Tab narrow to a 760px reading column. Taller desktop screens get further refinements (from 700px and 1000px tall). TV mode is a separate full-screen stage built around the marquee and standings.

All fixed chrome respects safe-area insets. Touch targets are 44px or larger, with 40px for small variants.

## Elevation & Depth

Mostly flat and tonal. Surfaces step up in lightness from black, and edges come from hairlines. Shadows are reserved for real layers and for the two lit objects.

### Shadow Vocabulary
- **Lift** (`box-shadow: inset 0 1px 0 rgba(255,255,255,.05)`): a one-pixel top highlight on cards, so black glass catches a little light. It becomes a stronger white highlight in Daylight.
- **Pop** (`box-shadow: 0 30px 70px -20px rgba(0,0,0,.95)`): sheets, toasts and the landing card, meaning anything floating above the page.
- **FAB halo** (`box-shadow: 0 0 0 5px var(--bg), 0 0 0 6px var(--line-2), 0 14px 30px -8px rgba(255,160,0,.6)`): cuts the log button out of the tab bar and gives it an amber under-glow.
- **Marquee glow** (`box-shadow: inset 0 1px 0 rgba(255,255,255,.07), 0 26px 60px -34px rgba(255,150,0,.55)`): the lit sign's warm spill.

Frosted bars (top bar and tab bar) use a saturate-plus-blur backdrop over a near-opaque fill.

### Named Rules
**The Only Glow Rule.** Only the marquee and the log button glow amber. Nothing else gets a coloured shadow.

## Shapes

Rounded, friendly geometry on a five-step radius scale: 6px tags, 11px small buttons, 14px buttons and list items, 18px tiles and notices, and 24px cards. Sheets take 28px top corners; chips, pills, avatars, the sync pill and the log button are fully round. Inputs and steppers sit at 13px. Every surface has a 1px border. Dashed borders mean "empty or add": ghost chips, ghost avatars, and the recap receipt's tear line.

## Components

### Buttons
Solid, chunky and thumb-sized.
- **Shape:** 14px corners, 44px tall (40px small, 54px large), 16px side padding, weight 650.
- **Primary:** an amber fill with black heavy text. Its hover uses the hi step.
- **Default / Quiet:** a Surface 2 fill and Line 2 border. Hover moves to Surface 3 and Line 3.
- **Ghost:** transparent with a Line 3 border.
- **Danger:** a signal-red fill with contrasting ink.
- **On (toggled):** an amber-soft fill with an amber-line border and amber text.
- **Press:** scales to 0.97 with the house ease curve. Focus is a 2px amber ring offset by 2px.
- **Landing page:** full-width 58px buttons, a near-white "Join Crawl" and an amber "Start a Crawl".

### Chips
- **Style:** fully round, 40px tall, with a Surface 1 fill and Line 2 border. They are used as filters in horizontally scrolling rows.
- **State:** selected chips invert to a white fill with black bold text. Ghost chips are dashed and transparent.

### Cards / Containers
- **Corner Style:** 24px.
- **Background:** Surface 1.
- **Shadow Strategy:** Lift only.
- **Border:** Line 2.
- **Internal Padding:** 18px, with the header row padded 18px on the sides and top.

### Inputs / Fields
- **Style:** 48px tall, with a Surface 2 fill, a Line 3 border and 13px corners. Labels sit above in label type, and optional hints are in Ink 3.
- **Focus:** a 2px amber ring.
- **Code input (landing):** mono, uppercase, widely tracked, on pure black, 56px tall.
- **Checkbox:** a 24px rounded square that fills amber with a black tick when checked. It falls back to the native control in forced-colors mode.

### Navigation
- **Mobile:** a fixed frosted tab bar with four tabs (The board, The crawl, Stats, The tab) around a central 62px amber log button that rises above the bar. The active tab gets white text and an amber icon.
- **Desktop (900px and up):** a text nav in the top bar, where the current section gets white text and a 2px amber underline.

### Bottom Sheet (signature)
Every task (logging a pour, the crew, invite, recap, settings) opens in a sheet that rises from the bottom. It is at most 560px wide and 92% of the viewport tall, with 28px top corners, a grab handle, a title block with a close button, a scrolling body and a sticky footer. It rises over 0.3s and sinks over 0.2s.

### Standings Row and Podium (signature)
The leaderboard has a three-up podium (the centre column is wider) above rows. Each row shows the rank, avatar, name with tags, a drink-colour stacked bar, and a condensed count. Your own row glows amber-soft with an amber hairline.

### Drink Grid (signature)
A 4×2 grid of 88px tiles, each with a drink icon in its data colour and a label. The selected tile gets an amber border, an amber-soft wash and a small amber check badge.

### Marquee (signature)
A dot-matrix LED sign drawn on canvas (120:25 aspect) inside a dark housing with 20px corners and a diagonal glass sheen. It is shown on the board and in TV mode. Its colours are fixed in both themes.

### Sync Pill
A small round status pill with a coloured dot and uppercase label: green pulsing for live, amber blinking for waiting, red for offline, and blue for demo, solo or view-only.

## Do's and Don'ts

### Do:
- **Do** keep amber as the single accent for live state, ownership and the main action (The One Lit Colour Rule).
- **Do** meet 7:1 contrast for all live text in both themes, including hover and focus states.
- **Do** use Mona Sans's width axis for hierarchy: expanded names, normal reading text, condensed scores.
- **Do** use Martian Mono for codes, times and receipt-style lines.
- **Do** keep touch targets at 44px or more and respect safe-area insets on fixed chrome.
- **Do** open new tasks in a bottom sheet on phones.
- **Do** honour reduced-motion preferences; the board already checks for them.

### Don't:
- **Don't** introduce a second accent hue or a coloured glow beyond the marquee and log button.
- **Don't** use drink or crew colours decoratively, or reorder the drink set without re-checking colour-blind separation.
- **Don't** use Ink 4 for readable text; it is for disabled controls and hairlines only.
- **Don't** let anything compete with the marquee for loudness.
- **Don't** theme the marquee or recap poster for Daylight; they stay dark objects.
- **Don't** borrow the portfolio's cyan, violet, glass gradients or system font.
