---
name: ByteVoice Bangla workspace
description: A Bangla-first voice demo and a silver glass workspace for clinic records.
colors:
  ink: "#17223a"
  muted: "#5e5c56"
  faint: "#736b5f"
  line: "#e5dfd4"
  control: "#c8bfaf"
  paper: "#fffdf8"
  workspace: "#f0ebe0"
  nav: "rgba(255,251,241,.78)"
  raised: "#f7f3eb"
  selected: "#f7eccf"
  accent: "#805d18"
  accent-dark: "#61430b"
  primary: "#f0c96d"
  primary-ink: "#141d30"
  error: "#a52e40"
  error-bg: "#fff3f4"
  focus: "#946a15"
  glass-edge: "rgba(255,255,255,.9)"
  assistant: "#f5f0e6"
  rule: "#eee8dd"
  dark-ink: "#f6f1e6"
  dark-muted: "#bec8d9"
  dark-faint: "#a5afc0"
  dark-line: "#33415a"
  dark-control: "#526078"
  dark-paper: "#111b30"
  dark-workspace: "#080f20"
  dark-nav: "rgba(17,27,48,.78)"
  dark-raised: "#19243b"
  dark-selected: "#3c3422"
  dark-accent: "#f0c96d"
  dark-accent-dark: "#ffe2a1"
  dark-primary: "#f0c96d"
  dark-primary-ink: "#141d30"
  dark-error: "#ffb5bf"
  dark-error-bg: "#3a2631"
  dark-focus: "#f0c96d"
  dark-glass-edge: "rgba(182,208,255,.15)"
  dark-assistant: "#19243b"
  dark-rule: "#2b3543"
  booked-surface: "#eaf5ef"
  booked-ink: "#31664a"
  rescheduled-surface: "#eaf0fa"
  rescheduled-ink: "#3b5c86"
  cancelled-surface: "#f8edef"
  cancelled-ink: "#93505a"
  follow-up-surface: "#f5f1e8"
  follow-up-ink: "#7b6140"
  enquiry-surface: "#edf0f4"
  enquiry-ink: "#56647a"
  dark-booked-surface: "#263d35"
  dark-booked-ink: "#a0d5b9"
  dark-rescheduled-surface: "#293a52"
  dark-rescheduled-ink: "#b4cdef"
  dark-cancelled-surface: "#422f39"
  dark-cancelled-ink: "#eebbc3"
  dark-follow-up-surface: "#3d382e"
  dark-follow-up-ink: "#ddccab"
  dark-enquiry-surface: "#343b46"
  dark-enquiry-ink: "#c4ccda"
  live: "#44896b"
  danger: "#8e3946"
  danger-hover: "#762b37"
  landing-navy: "#080f20"
  landing-hero: "#070d1b"
  landing-console: "#111b30"
  landing-scenarios: "#131f37"
  landing-ink: "#f6f1e6"
  landing-muted: "#bec8d9"
  landing-line: "#33415a"
  landing-glass: "#0b142880"
  landing-glass-edge: "#b6d0ff31"
  landing-gold: "#f0c96d"
  landing-gold-light: "#ffe7a5"
  landing-gold-deep: "#e9b94e"
  landing-gold-hover: "#ffdb88"
  landing-action-ink: "#141d30"
  landing-walkthrough: "#f0ebe0"
  landing-walkthrough-ink: "#111a2c"
  landing-receipt: "#fffbf1"
  landing-receipt-ink: "#17223a"
typography:
  landing-display:
    fontFamily: '"Manrope", "Anek Bangla", sans-serif'
    fontSize: "clamp(39px, 14cqi, 96px)"
    fontWeight: 720
    lineHeight: 1.04
  headline:
    fontFamily: '"Manrope", "Anek Bangla", sans-serif'
    fontSize: "28px"
    fontWeight: 650
    lineHeight: 1.3
    letterSpacing: "-0.035em"
  title:
    fontFamily: '"Manrope", "Anek Bangla", sans-serif'
    fontSize: "18px"
    fontWeight: 650
    lineHeight: 1.45
    letterSpacing: "-0.02em"
  body:
    fontFamily: '"Manrope", "Anek Bangla", sans-serif'
    fontSize: "14px"
    lineHeight: 1.55
  label:
    fontFamily: '"Manrope", "Anek Bangla", sans-serif'
    fontSize: "13px"
    fontWeight: 500
  transcript:
    fontFamily: '"Anek Bangla", "Manrope", sans-serif'
    fontSize: "15px"
    lineHeight: 1.95
rounded:
  badge: "6px"
  field: "8px"
  button: "9px"
  navigation: "10px"
  transcript: "12px"
  container: "16px"
  sheet: "20px"
  landing-glass-nav: "18px"
  landing-pill: "99px"
  landing-receipt: "18px"
spacing:
  tight: "8px"
  compact: "12px"
  regular: "16px"
  phone-gutter: "20px"
  section: "24px"
  sheet-gutter: "32px"
components:
  landing-call-button:
    backgroundColor: "{colors.landing-gold}"
    textColor: "{colors.landing-action-ink}"
    rounded: "{rounded.landing-pill}"
    padding: "7px 24px 7px 8px"
  landing-call-button-hover:
    backgroundColor: "{colors.landing-gold-hover}"
  landing-example-booking:
    backgroundColor: "{colors.landing-receipt}"
    textColor: "{colors.landing-receipt-ink}"
    rounded: "{rounded.landing-receipt}"
    padding: "clamp(25px, 4vw, 52px)"
  landing-navigation:
    backgroundColor: "{colors.landing-glass}"
    textColor: "{colors.landing-ink}"
    rounded: "{rounded.landing-glass-nav}"
    padding: "0 clamp(16px, 2.3vw, 36px)"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-ink}"
    rounded: "{rounded.button}"
    padding: "10px 15px"
  button-primary-hover:
    backgroundColor: "{colors.ink}"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.button}"
    padding: "10px 15px"
  search:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.muted}"
    rounded: "{rounded.field}"
    padding: "0 12px"
  navigation-active:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.navigation}"
    padding: "11px 13px"
  badge-booked:
    backgroundColor: "{colors.booked-surface}"
    textColor: "{colors.booked-ink}"
    rounded: "{rounded.badge}"
    padding: "4px 7px"
  sheet:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sheet}"
  call-row-selected:
    backgroundColor: "{colors.selected}"
    textColor: "{colors.ink}"
    padding: "20px 24px"
  transcript-assistant:
    backgroundColor: "{colors.assistant}"
    textColor: "{colors.ink}"
    rounded: "{rounded.transcript}"
    padding: "17px 20px"
---

# Design System: ByteVoice Bangla workspace

## Overview

**Creative North Star: "The Silver Record Frame"**

The silver glass frame turns conversations into clear, actionable clinic records. Cool translucent navigation surrounds a clear white sheet; restrained slate actions, fine rules and generous Bengali transcript leading make the workspace feel modern, classy and composed. The authentic ByteVoice waveform anchors the identity.

Light and Bangla are the defaults, with an explicit dark toggle and BN/EN controls. A saved English language choice takes precedence. Glass is an intentional user-brief override: use it for the framing and voice emblem, while records remain readable solid surfaces. This replaces the former teal system. The visual language serves a fictional clinic operating interface and its browser voice test.

**Key Characteristics:**

- Warm cream framing, clear record sheets and gold actions.
- Authentic ByteVoice emblem, preserved from the supplied asset.
- Manrope interface text with Anek Bangla conversations.
- Light by default; deliberate dark and BN/EN controls.
- Quiet depth, explicit statuses and visible keyboard focus.

### Public landing page

The public landing page at `/` introduces ByteVoice's Bangla voice agent to clinic and hospital teams in Bangladesh. The full-viewport reception scene pairs the Glass Flower scene with a Bangla headline and a gold call button. A floating glass header carries the ByteVoice wordmark, section links and language switch. A slim divider separates the staff portal link. A warm cream product walkthrough follows the hero. Mashrafi’s Dental is the fictional clinic used in the live demo. Bangla is the default, and the English switch uses the shared saved language preference. The landing palette is independent of the workspace theme setting.

## Colors

The palette is cool neutral: slate actions, blue-grey metadata and translucent silver framing. Frontmatter values are normative, extracted from `web/app/globals.css`; `dark-` entries map to the same role under `data-theme="dark"`.

### Primary

**Gold action** (`primary` / `primary-ink`) carries principal buttons, with `ink` on hover. **Warm gold** (`accent` / `accent-dark`) marks text links, tab underlines and action icons. **Focus blue** (`focus`) identifies keyboard position.

### Neutral

**Clear sheet** (`paper`) holds records. **Silver workspace** (`workspace`) frames it; **translucent navigation** (`nav`) admits restrained glass. **Raised mist** (`raised`) separates the index, search and call stage; **selected mist** (`selected`) identifies the current call. `ink`, `muted` and `faint` distinguish primary text, metadata and quieter cues. `line` divides sections, `rule` divides fields, and `control` outlines fields. `glass-edge` supplies the frame seam; `assistant` distinguishes receptionist turns.

Outcome pairs remain semantic: booked is muted green, rescheduled steel blue, cancelled dusty rose, follow-up warm sand and enquiry grey. Their dark pairs preserve those meanings. Errors use `error` on `error-bg`; ending a call uses `danger` / `danger-hover`. The live dot uses `live`. Semantic hues stay small status cues rather than competing brand accents.

**The Status Label Rule.** Always pair outcome color with a readable label.

### Landing palette

Use midnight navy across the hero, lighter navy in the scenario band and warm cream across the walkthrough. Ivory carries headlines and cool grey carries explanations in the dark sections. Gold marks the booking phrase, the main action and keyboard focus. The action gradient runs from light to deep gold above dark navy text. The walkthrough pairs navy copy with a lighter paper booking sample. These roles are scoped to the landing wrapper in `web/components/landing.css`.

## Typography

The interface uses locally hosted variable **Manrope** (400–800), followed by **Anek Bangla** (variable 100–800 at normal width; original shaping tables retained), then sans-serif. Conversation text reverses those first two families. Both font faces use `font-display: swap`. No separate display face is established.

Frontmatter records the headline, title, body, label and transcript roles. Main headings reduce to (24px) on phones; record headings use (21px). Operational metadata is commonly (11–13px). Buttons use (12px, weight 600), and badges use (11px, weight 600). Transcript leading is deliberately open. Dates, phone numbers and durations use tabular numerals. Phone inputs use (16px) to keep focus stable in Safari.

**The Bilingual Reading Rule.** Preserve Bengali shaping and generous transcript leading; do not force English label metrics onto conversations.

### Landing typography

Anek Bangla handles Bengali glyphs, and Manrope handles Latin. The landing display uses weight (720) and line height (1.04). It scales against the width of its copy column, with a smaller scale for the longer desktop Bangla phrase. The localized headline lines omit terminal punctuation. Gold highlights the second phrase. The hero introduction is bounded to (43ch). At phone widths the headline uses `clamp(41px, 10.6vw, 62px)` with a line height of (1.1).

## Layout

The shared grammar is a framed sheet beside narrow navigation, with aligned rules and consistent interior gutters. Desktop navigation is (232px), the outer inset (16px), and primary content gutters (32px). Navigation remains sticky, with its own (18px) rounded edge, a fine seam and a (12px) gap from the working sheet. The redundant clinic switcher is omitted. A labelled header control collapses desktop navigation to an (80px) icon rail; this preference persists locally. For call records above (760px), the sheet is viewport-height with a minimum (560px); the call list and detail scroll independently inside it.

The call index starts at (`minmax(300px, 34%)`). At (1800px) and wider it becomes (390px). At (1180px) and below navigation becomes (205px), outer inset (12px), interior gutters (24px), and index (`minmax(285px, 41%)`). Between (761px) and (980px), navigation becomes (175px), the index (`minmax(240px, 42%)`), search takes a full row and the voice guide wraps below its console.

At (760px) and below, the shell becomes sticky top navigation, the sheet loses its outer border/radius/shadow, and content gutters become (20px). Call list and selected record become separate views with an explicit return action and focus restoration. Filters disclose from a button. Navigation and theme/language controls retain (44px) minimum targets; compact header/filter/icon controls also have (44px) phone targets. These describe responsive patterns, not a universal call-record composition for every future screen.

Voice-test content is bounded to (1280px), with a main console and (270px) guide separated by (38px); compact desktop uses a (225px) guide and (25px) gap. Record transcripts are bounded to (780px). Data-model content is bounded to (1280px). Its flow precedes an entity selector and field/relationship view; at (980px) and below a native picker replaces the entity list. Storage and validation use one readable column at that breakpoint.

### Landing layout

The landing uses a (1540px) maximum content width and a full-bleed hero with a (100svh) minimum above phone widths. A (.9fr / 1.1fr) split keeps the localized promise, working call and consent text on the left and gives Glass Flower more room on the right. The cream walkthrough pairs a ruled step list with the sample booking. The navy demo section puts a voice orb and call controls beside a two-sided conversation. A labeled sample gives way to call captions once the demo starts. Example prompts follow the caller. The hero starts the embedded demo caller and moves focus to its controls. A cream clinic-value section pairs a list of operational benefits with a contact-based pricing panel. The footer groups product navigation and contact details. Side gutters use `clamp(32px, 5.5vw, 105px)`, then (32px) at (900px) and (18px) at (680px). At (680px), the hero stacks with copy and call controls above Glass Flower, and the lower sections stack. Language and staff portal controls remain visible in the compact header.

## Elevation & Depth

Glass, tonal layering and restrained ambient shadows work together. Navigation uses an (18px) backdrop blur, increasing to (20px) on phones; unsupported blur falls back to the solid workspace. The white sheet stays stable. Translucency is an intentional user-selected material, not a blanket content treatment.

### Shadow Vocabulary

- **Sheet ambient:** `0 8px 28px rgba(30,50,72,.05)`; dark mode uses `0 8px 28px rgba(0,0,0,.12)`.
- **Active navigation:** `0 2px 5px rgba(32,45,63,.03)`; removed on phones.
- **Voice emblem:** `0 5px 18px rgba(45,64,91,.04)`.

**The Clear Record Rule.** Keep the record reading surface solid; confine translucent glass to framing and the voice emblem.

Background, border, text and shadow transition over (.18s ease). Only the connecting voice emblem breathes (2s ease-in-out, opacity .55 at midpoint). Reduced-motion preference disables animations and transitions.

### Landing art and motion

The hero uses a generated widescreen fluted-glass backdrop based on the user-supplied Iridescent Vertical Ridges image. The right side gives the dark glass a lighter field and navy scrims keep the copy readable. Phones use a portrait crop. The demo section uses Midnight Satin Folds under a navy gradient.

The hero uses the original pmndrs Glass Flower model, transmission materials, lights and color grading. The Three.js Points Waves grid fills a separate full-width layer anchored to the bottom of the walkthrough.

Glass Flower and Points Waves each animate for 4.6 seconds when their section comes into view, then settle. Glass Flower can still be dragged on desktop. The lighting uses softer reflections and smaller transmission buffers. Motion suspends offscreen and in hidden tabs. The original Glass Flower thumbnail covers loading, reduced motion and WebGL failure.

Landing glass combines a (16px) backdrop blur and (1.35) saturation with a cool translucent fill and a brighter top edge. Apply it to the floating header, circular motion control and active call console. The header has (18px) desktop corners and (17px) phone corners. The booking sample uses an upright ivory surface, a warm seam and a diffuse shadow (`6px 20px 46px #40321c24`).

## Shapes

The sheet is the broadest rectangle (20px corners). Login and voice containers use (16px), assistant turns (12px), navigation (10px), buttons (9px), fields/icon controls (8px), and badges (6px). Thin (1px) rules keep interiors precise; active tabs use a (2px) underline. Voice marks alone are circular, (112px) on desktop and (90px) on phones. The emblem is a CSS crop of the authentic supplied ByteVoice asset, not a redrawn waveform.

## Components

### Buttons

Primary is slate with contrasting text; secondary is sheet-colored with a control border. Both use (10px 15px) padding and desktop minimum height (42px). Primary hover uses ink; secondary hover uses raised mist and a muted border. Icon controls are (36px) minimum on desktop. Voice start controls are (46px) minimum high. Disabled buttons use (.5) opacity and a disabled cursor. Focus is a (3px) outline with (3px) offset.

### Inputs / Fields

Fields use the sheet, control border, (8px) corners, (10px 12px) padding and (42px) minimum height. Search groups icon and input on raised mist, with desktop maximum width (470px); focus outlines the group with (2px) offset. Phone search inputs are (44px) minimum high with (16px) text. Errors have explicit text/alert states.

### Navigation

Fine line icons (generally 18px, stroke 1.65) accompany labels. The active page gains a clear surface, glass seam, subtle shadow and weight (650); hover uses raised mist. Retain `aria-current`, the skip link and explicit accessible names when compact controls omit visible text. Theme/language toggles persist preferences when storage is available; light and Bangla are the implemented defaults, with an explicit saved English choice respected. Sign out is an outlined session action on every working route while authenticated; signed-out views offer Sign in. The desktop icon rail retains accessible names and tooltips. Mobile keeps labelled navigation and an outlined logout icon in its top control row. Short desktop sidebars scroll rather than clipping session controls.

**The Shared Session Rule.** Show Sign out on every authenticated working route and Sign in when signed out. Compact navigation retains accessible labels.

### Chips / Outcome badges

Compact, softly squared labels use semantic color pairs, (4px 7px) padding and readable labels. Generic outcomes use line/muted. Avoid a pill silhouette.

### Cards / Containers

The sheet is one continuous solid record surface with a light seam and ambient shadow. Login and console containers use line borders and (16px) corners. Avoid making every row or field another floating card.

### Call rows and record tabs

Rows are full-width buttons with (20px 24px) desktop padding, fine bottom rules and selected fill; hover returns to paper. Metadata uses two-sided alignment and tabular numbers. Tabs use an accent underline, (44px) minimum height and arrow/Home/End navigation. Preserve the phone list/detail handoff and focus restoration.

### Copy controls

Inline phone/reference copy controls use (32px) desktop and (44px) phone targets, a fine control border and (7px) corners. A check icon and announced status confirm a copy; failure gives a visible recovery message. Copy the stored value exactly.

### Transcript turns and voice emblem

Assistant turns use a raised surface and (17px 20px) padding; caller turns remain on paper. Turns are separated by (22px). Speaker and timestamp precede Bangla text. The voice-stage emblem crops the authentic brand asset inside a circular material frame; connection/live states change material and opacity subtly. Keep loading, empty, connection and failure messages explicit.

### Landing caller and booking sample

The gold hero action starts the real embedded `VoiceTest` call in the demo section. It is a (59px) minimum-height pill with a dark circular phone icon and sits above permission and data-use copy. The demo section shows connection state, microphone and end-call controls, errors and live captions as they become available. Keep keyboard focus visible and preserve localized control labels. The booking receipt farther down the page always carries an explicit sample label.

## Do's and Don'ts

### Do:

- Do preserve the original ByteVoice asset and its waveform crop.
- Do use the theme variables so light and dark remain coherent.
- Do keep focus outlines, explicit state labels and readable Bengali transcripts.
- Do maintain the phone input size and touch targets already implemented.
- Do label fictional clinic data and scripted fixtures clearly.

### Don't:

- Don't restore the obsolete teal palette or Arial/Nirmala typography.
- Don't spread glass blur onto transcript or field reading surfaces.
- Don't introduce invented business metrics or medical claims.
- Don't treat documentation as proof of deployment or speech quality.

### Landing and workspace continuity

The landing rollout panel uses navy fluted glass, cream text and a gold contact action. Staff sign-in pairs the same navy glass with a warm paper form, one sign-in heading and a return-to-home link. The form stacks below a compact introduction on phones. Workspace surfaces use warm cream in light mode and landing navy in dark mode, with gold primary actions and warm gold link/focus colors.
