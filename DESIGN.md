---
name: Shrey Vasisht — Portfolio & Personal Hub
description: A dark technical readout for an engineer's portfolio and private tools.
colors:
  readout-cyan: "#6EE7FF"
  readout-cyan-hover: "#9AEEFF"
  ultraviolet: "#A78BFA"
  cabinet-navy: "#070A10"
  panel-flat: "rgba(255,255,255,.03)"
  panel-glass: "rgba(255,255,255,.06)"
  panel-glass-raised: "rgba(255,255,255,.09)"
  text-primary: "rgba(255,255,255,.92)"
  text-muted: "rgba(255,255,255,.68)"
  text-faint: "rgba(255,255,255,.52)"
  hairline: "rgba(255,255,255,.12)"
  field-well: "rgba(0,0,0,.22)"
  on-accent: "#071018"
  status-ok: "#22c55e"
  status-warn: "#f59e0b"
  status-danger: "#ef4444"
  status-danger-text: "#f87171"
typography:
  display:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "clamp(34px, 4vw, 52px)"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.6px"
  headline:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "22px"
    fontWeight: 700
    letterSpacing: "-0.2px"
  feature-title:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "24px"
    fontWeight: 600
    letterSpacing: "-0.01em"
  card-title:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "17px"
    fontWeight: 600
  title:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 700
    letterSpacing: "0.2px"
  body:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "clamp(15px, 1.6vw, 18px)"
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 600
  caption:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 400
rounded:
  sm: "8px"
  md: "10px"
  lg: "14px"
  full: "999px"
spacing:
  s-1: "4px"
  s-2: "8px"
  s-3: "12px"
  s-4: "16px"
  s-5: "24px"
  s-6: "32px"
  s-7: "48px"
  s-8: "64px"
  xs: "8px"
  sm: "10px"
  md: "14px"
  lg: "18px"
  xl: "24px"
  container: "1120px"
components:
  button-primary:
    backgroundColor: "{colors.readout-cyan}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.md}"
    padding: "11px 16px"
  button-primary-hover:
    backgroundColor: "{colors.readout-cyan-hover}"
  button-secondary:
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "11px 16px"
  pill:
    textColor: "{colors.text-muted}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "6px 11px"
  tag:
    textColor: "{colors.text-muted}"
    typography: "{typography.caption}"
    rounded: "{rounded.full}"
    padding: "4px 9px"
  card:
    backgroundColor: "{colors.panel-flat}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: "24px"
  input:
    backgroundColor: "{colors.field-well}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "12px 14px"
  nav-link:
    textColor: "{colors.text-muted}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
  nav-link-hover:
    backgroundColor: "{colors.panel-glass}"
    textColor: "{colors.text-primary}"
---

# Design System: Shrey Vasisht — Portfolio & Personal Hub

Scope: `index.html`, `personal.html`, `css/personal.css`, and the hub apps in `js/`. Both pages declare the same `:root` tokens. Pour Decisions has its own system in `pour-decisions/DESIGN.md` and does not inherit anything here.

## Overview

**Creative North Star: "The Instrument Panel"**

The site should read like a well-built bench instrument at night: a dark cabinet, a few precise readouts glowing in cool light, and labels you can trust. It belongs to an engineer who builds sensor rigs and test systems, so the interface should feel measured rather than decorative. Information sits in clearly bounded panels and the accents mark signal, not ornament.

The portfolio (`index.html`) now carries the confirmed **crisp and technical** direction. The ground is flat near-black navy with no glows. Panels are barely-there fills with hairline edges and 14px corners, and nothing has a shadow or lifts on hover. Readout Cyan is the single lit colour, and the Snapshot readout is ruled by hairlines rather than boxed. The hub (`personal.html`, `css/personal.css`) now follows the same rules: flat ground, flat 3% panels, solid cyan primary buttons, 8/10/14px corners, no gradients, glows, emoji or hover lifts. Its active view tabs use a cyan tint with cyan text rather than a solid fill, so only the one primary action per view is solid.

The hub shares the colour tokens but is an Operate surface: dense forms, lists and charts. There the instrument metaphor means legibility and consistency first.

**Key Characteristics:**
- Flat near-black navy cabinet with faint white panels and 12% white hairlines.
- One lit colour: Readout Cyan for actions, links and focus. Ultraviolet appears only as a chart data colour in the screener.
- A single system sans-serif; hierarchy comes from size and weight, not from a second family.
- Content lives in hairline-bounded panels on a centered 1120px column; lists are ruled, not chipped.
- No shadows, glows, gradients or hover lifts on the portfolio.

## Colors

A cold, low-light palette: a navy-black ground, white at varying opacities for every neutral, and one luminous cool accent.

### Primary
- **Readout Cyan:** the signal colour. On the portfolio it is the solid fill of the primary button, the colour of text links (the contact email address, project links), the focus ring, the input focus border, the logo monogram and its outline, and the text-selection tint. The lighter **hover** step brightens the primary button. On dark it reads like an oscilloscope trace, so reserve it for things the visitor can act on or should notice first.

### Secondary
- **Ultraviolet:** data only. The screener's three strategies are told apart by a data palette of near-white (Value Investing), Readout Cyan (Lower Risk) and Ultraviolet (Balanced Risk), shown as chart lines and as small square keys beside each strategy name. Never use it for chrome, buttons or decoration.

### Neutral
- **Cabinet Navy:** the page ground, flat on the portfolio. The sticky nav uses it at 86% opacity (55% in the hub).
- **Panel Flat:** the portfolio's card fill, white at 3%, just enough to separate a panel from the ground.
- **Panel Glass / Panel Glass Raised:** translucent white hover fills for nav links, secondary buttons and footer links, and the hub's card fills.
- **Text Primary / Muted / Faint:** headings and values / body copy and nav links / small labels and footer.
- **Hairline:** the 1px edge on every panel, the nav's bottom rule, and dividers. Hover states brighten it to about 22% white.
- **Field Well:** the dark inset behind inputs and textareas, darker than the panel so fields read as recessed.
- **On-Accent Ink:** near-black text on cyan fills.
- **Status OK / Warn / Danger:** hub-only feedback colours (saved, caution, errors such as a password mismatch). Not used decoratively.

### Named Rules
**The Signal Rule.** Cyan marks what is interactive or live. If an element is neither, it gets a neutral colour.

**The White-Opacity Rule.** Every neutral is white at a stated opacity over Cabinet Navy. Don't introduce tinted greys; the hub's hard-coded select-menu fills (`#0d1117`, `#1a1e2e`, `#2d3348`) are known exceptions, not precedent.

## Typography

**Display Font:** system UI sans-serif (`ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial`)
**Body Font:** the same stack
**Label/Mono Font:** none yet

**Character:** neutral and native. The system stack loads instantly and looks at home on every OS, but it carries no voice of its own. That job falls to weight, tight tracking on headlines, and the copy.

### Hierarchy
- **Display:** the hero headline only ("Engineering systems that sense, test, and scale."), at weight 650 with -0.02em tracking and balanced line breaks.
- **Headline:** section titles (Portfolio, About, Skills, Contact) at weight 600, and the hub's page titles at around 24px.
- **Feature Title:** the lead project's name (Stock Strategy Screener) at 24px, weight 600.
- **Card Title:** the other live projects' names at 17px, weight 600.
- **Title:** the side-panel heading ("Snapshot") at 16px and pending-project names at 15px, weight 600. Portfolio group headings ("Open now", "Write-ups pending") use 15px in muted text: they are real headings, not eyebrows.
- **Body:** the hero subhead, capped at 62ch; About copy at 1.6 line height.
- **Body Small:** project descriptions, section subtitles, and hub form inputs.
- **Label:** pills, tags, form labels, mini-stat captions (down to 12px for captions).

### Named Rules
**The One Family Rule.** One sans-serif across the site. If a technical voice is added later, it comes from a monospace used for readouts (values, codes, dates), not a second display face.

## Layout

A single centered column, 1120px max, with 24px page padding. The hero is a two-column grid (1.15fr / 0.85fr) pairing the pitch card with a "Snapshot" panel. About and Skills sit in a two-column row that stacks below 980px. Below 980px the nav links drop to a second row under the brand and LinkedIn button, and anchored sections offset for the taller sticky bar. The page footer sits outside every panel, after Contact.

**Portfolio order follows evidence.** Working software leads; unconfirmed work follows at lower weight. "Open now" is a two-column grid (1.35fr / 1fr): the Stock Strategy Screener is the wider feature panel on the left and the personal hub sits on the right. Each live panel ends in a footer row with its cyan link on the left and its access note ("Public, no sign-in" for the screener, "Sign-in required" for the hub) on the right, so the action rows share a baseline. Pour Decisions never appears on the portfolio; it is linked only from the hub. "Write-ups pending" is not a set of cards: it is a ruled two-column list with no links, 48px below the live grid. Both stack to one column below 860px.

**Hub overview is a readout, not a dashboard.** `#/personal` is a left-aligned 28px "Personal hub" title, the sync status as one muted line with a status dot, then a ruled list with one row per tool (Gym Log, Focus Timer, Counters, Tournament, Stock Screener). Each row is a single link: the tool name in a 160px column, a live one-line status built from real data ("2 workouts · 1 this week · Last: Squat 5×5 @ 225 lbs, yesterday", with overdue counts in Status Danger text), and a chevron that turns cyan on hover. Empty tools say so plainly ("No workouts logged yet"). Pour Decisions sits below the list as a quiet "Elsewhere" line, never among the hub's own tools. Every hub view opens with a 28px H1 about 125px from the top.

**Hub nav groups by destination.** The hub's own sections sit together after the brand. A hairline divider separates the aside: Pour Decisions (with an outbound arrow), Back to Portfolio, and the Log out button. Visitors on the public screener see only Back to Portfolio and Sign in.

The contact panel is a two-column grid (1fr / 1.5fr): the heading and email address on the left, the form on the right. It stacks below 860px.

**Spacing scale (portfolio):** 4, 8, 12, 16, 24, 32, 48, 64px as `--s-1` to `--s-8`. Section headings get 64px above them and 24px below (16px inside a panel). Panels pad 24px (32px for the hero card and the feature panel, both dropping to 24px on phones). Live panels sit 16px apart. The older `xs`–`xl` values describe the hub's tighter rhythm, which also uses auto-fit form rows (200px minimum per column).

## Elevation & Depth

The portfolio is flat. Panels separate from the ground with a 3% white fill and a hairline edge, and nothing carries a shadow. The only layered element is the sticky nav: 86% navy with a 12px backdrop blur, so content scrolling underneath stays legible. Hover states change border or fill brightness, never position.

### Shadow Vocabulary
- **Layer shadow** (`0 20px 60px rgba(0,0,0,.5)` on the hub's sign-in dialog, `0 8px 24px rgba(0,0,0,.4)` on dropdown menus): only on elements that genuinely float above the page. Resting panels, buttons and cards never carry a shadow.

### Named Rules
**The Flat Instrument Rule.** Resting surfaces are flat: hairline edge, faint fill, no shadow, no hover lift. Depth signals a real layer (nav, modal, popover), not decoration.

## Shapes

A small, consistent radius scale: 8px for nav links, footer links, the logo square and focus rings; 10px for buttons and inputs; 14px for every panel; fully round only for pills and tags. Every panel has a 1px hairline border. The logo is a 30px outlined square with an "SV" monogram in Readout Cyan. The hub uses the same scale; 2px and 4px appear only on colour keys and progress bars.

**The Three Corners Rule.** 8, 10 or 14px, or fully round for chips. No new radius values.

## Components

### Buttons
Solid and precise; they change colour on hover and never move.
- **Shape:** 10px corners, 11px by 16px padding, 15px text in the page font.
- **Primary:** a solid Readout Cyan fill with near-black text at weight 650 ("Get in touch", "Open in email app"). Hover moves to the lighter cyan step.
- **Secondary:** transparent with a 16% white hairline and weight 500. Hover adds a 5% white fill and brightens the border.
- **Focus:** a 2px Readout Cyan ring offset by 2px, applied site-wide with `:focus-visible`.

### Chips (pills and tags)
- **Pill:** fully round, hairline only, no fill, with muted 13px text. It's used for the three hero capability chips (text only, no emoji). Never as a label above a heading.
- **Tag:** a smaller fully round, outlined chip with 12px text. The portfolio no longer uses it; project technologies are a faint 13px "Python • Streamlit" line instead.

### Cards / Containers
- **Corner Style:** 14px.
- **Background:** Panel Flat.
- **Shadow Strategy:** none (see Elevation & Depth).
- **Border:** a 1px hairline. Panels do not react to hover; only their links do.
- **Internal Padding:** 24px (32px for the hero card and the feature panel).
- **Live project panel:** title, a description capped at 60ch, a single-column ruled facts list, then the footer row (cyan link with a padded 35px tap target, and access note). No thumbnail band until real screenshots exist.
- **Feature panel:** the same structure at a larger scale (24px title, 16px description), with a ruled 2×2 facts table in the Snapshot style between the description and the footer.

### Inputs / Fields
- **Style:** a dark Field Well background, a 16% white hairline, 10px corners and 12px by 14px padding, with 16px text in the page font (16px also prevents iOS zoom on focus). Textareas start at 120px tall.
- **Hover / Focus:** the border brightens on hover. On focus the border turns cyan, and keyboard focus adds the 2px cyan ring.
- **Labels and hints:** visible 14px labels above every field. The message field shows a tabular character count ("1,400 / 1,500") that turns Status Warn at 90%.
- **Error:** validated on submit, then live as the visitor fixes a field. The border turns Status Danger, a 13px Status Danger message under the field names the problem and the fix, and focus moves to the first invalid field.
- **Fallback:** after the form opens the email app, a hairline-bordered note offers "Copy message" for visitors without one.
- **Hub selects:** forced to a dark scheme with a custom white caret and hard-coded navy option fills.

### Navigation
A sticky top bar: 86% navy with a 12px backdrop blur and a hairline bottom rule. On the left sit the brand (outlined "SV" monogram and name). Muted 15px text links follow, then an outlined "LinkedIn" secondary button that opens in a new tab. Links brighten and gain a 5% white fill on hover. The hub uses the older pattern with an active state. Below 980px the links move to a second row (scrollable if they ever outgrow it). A cyan "Skip to projects" link appears at top left on keyboard focus.

### Snapshot Readout (signature)
A 2×2 grid ruled by hairlines rather than boxed: a top rule, a rule under each row and a vertical rule between columns. Each cell is a faint 12px caption above a short value ("Core areas: Sensors • Embedded • Test engineering"). A full-width "Role" row sits on top. This is the component closest to the Instrument Panel idea and the one to grow from. The Skills list, the screener's facts table and the pending-projects list use the same ruled treatment.

## Do's and Don'ts

### Do:
- **Do** keep Cabinet Navy as the ground and build every neutral from white at a stated opacity.
- **Do** reserve Readout Cyan for links, focus and primary actions (The Signal Rule).
- **Do** bound content in hairline-edged panels on the 1120px column.
- **Do** use 8, 10 or 14px corners and flat resting surfaces (The Three Corners Rule, The Flat Instrument Rule).
- **Do** present facts as labelled readouts ruled by hairlines, the way the Snapshot does.
- **Do** keep the site-wide 2px cyan `:focus-visible` ring on every interactive element.

### Don't:
- **Don't** use gradient fills, glows, shadows or hover lifts on the portfolio.
- **Don't** use emoji as icons or labels.
- **Don't** introduce a second accent hue, bring Ultraviolet back, or use status colours decoratively.
- **Don't** carry Pour Decisions' amber, fonts or components into these pages, or these into Pour Decisions.
