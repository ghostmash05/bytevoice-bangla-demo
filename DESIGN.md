---
name: ByteVoice Bangla workspace
description: A quiet, legible operating interface for clinic call records.
colors:
  ink: "#172c38"
  muted: "#5d6d77"
  line: "#dce3e7"
  paper: "#fff"
  workspace: "#f6f8f9"
  nav: "#edf2f4"
  accent: "#076b68"
  accent-dark: "#045653"
  selected: "#e5f3f0"
  error: "#a12929"
  focus: "#07847e"
typography:
  headline:
    fontFamily: 'Arial, "Nirmala UI", "Vrinda", sans-serif'
    fontSize: "1.85rem"
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: "-0.035em"
  title:
    fontSize: "1.25rem"
    fontWeight: 650
    lineHeight: 1.35
    letterSpacing: "-0.02em"
  body:
    fontFamily: 'Arial, "Nirmala UI", "Vrinda", sans-serif'
    fontSize: "15px"
    lineHeight: 1.5
  transcript:
    fontFamily: '"Nirmala UI", "Vrinda", Arial, sans-serif'
    fontSize: "1rem"
    lineHeight: 1.85
rounded:
  badge: "4px"
  field: "5px"
  control: "6px"
  transcript: "7px"
  container: "8px"
spacing:
  compact: "12px"
  control: "16px"
  section: "24px"
  record: "32px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.paper}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  button-primary-hover:
    backgroundColor: "{colors.accent-dark}"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
---

# Design System: ByteVoice Bangla workspace

## Overview

**Creative North Star: Civil registry.** White records sit beside a blue-grey index and navigation. Compact labels, strong alignment and restrained teal states support prolonged staff use. This is an operating interface; familiar controls and a system sans are intentional.

This document extracts the current source, not a visual completion certificate. Final mobile visual sign-off remains pending a reliable capture; see `.impeccable/review/fix-review.md`.

## Colors

### Primary

Teal accent marks primary actions, selected tabs, links and the brand symbol. Its darker variant is the primary hover state; pale selected teal identifies the active record.

### Neutral

Ink carries primary text; muted blue-grey carries metadata. Paper is the record surface, workspace is the surrounding field, nav separates navigation, and line divides records and controls. Error red identifies failure; focus teal identifies keyboard position.

Outcome badges retain distinct background/text pairs: booked (`#dff2e9` / `#1d6047`), rescheduled (`#e4edf9` / `#28588a`), cancelled (`#f5e9e9` / `#8d3737`), follow-up (`#fbefda` / `#85551d`), enquiry (`#eae7f5` / `#655092`). Generic badges use (`#e9edf0` / `#52636e`). Labels always accompany color.

## Typography

Use the frontmatter's operational sans stack and Bengali transcript stack. There is no separate display face. Main headings reduce to (`1.6rem`) on mobile; record headings use (`1.4rem`). Transcript text has a generous line height for Bengali readability. Metadata typically uses (`0.75–0.88rem`); badges use (`0.69rem`, weight `600`). Dates, phone numbers and durations use tabular numerals.

## Layout

Desktop uses a sticky full-height navigation column (`230px`) and a flexible workspace. The call index occupies (`minmax(290px, 36%)`) beside the record. At widths above (`1600px`), the index becomes (`390px`) and transcripts are bounded to (`800px`). Below (`1150px`), navigation becomes (`190px`) and the index uses (`minmax(270px, 43%)`).

At (`760px`) and below, navigation becomes a top area with horizontally scrollable links. The index and selected record become separate views with an explicit return action. Search occupies a full row above two filters. Desktop page gutters are (`36px`), intermediate gutters (`24px`), and mobile gutters (`20–22px`). Voice-test content is bounded to (`960px`); data-model content to (`1100px`).

## Elevation & Depth

Tonal surfaces and thin dividing lines establish depth. Active navigation has a slight shadow (`0 2px 5px #243c4408`); the selected record has an inset teal marker (`inset 2px 0 var(--accent)`). There is no general floating-card shadow system.

## Shapes

Controls have modest curved corners. Inputs use the field radius, buttons the control radius, transcript turns their own radius, and login/voice containers the container radius. Badges are compact rounded labels. Brand and voice marks are the more rounded exceptions (`9px` and `22px`). Borders are generally (`1px`).

## Components

**Buttons and fields.** Primary and secondary controls have a minimum height (`43px`), weight (`600`) and compact type (`0.88rem`). Secondary buttons use a pale navigation hover surface. Disabled buttons use opacity (`0.52`) and a disabled cursor. Inputs use white surfaces, a border (`#bfcbd2`), padding (`10px 12px`) and minimum height (`43px`).

**Focus and browser surfaces.** Interactive controls use a focus outline (`3px`) with offset (`3px`); grouped search uses focus-within with offset (`2px`). Selection uses (`#c3e9df`) behind text (`#123a35`); carets use accent teal. Links have underline offset (`4px`). Buttons transition background and text color (`0.15s ease`); reduced-motion preference disables transitions and animation.

**Navigation and records.** Navigation combines Lucide line icons with text and identifies the active page through a white surface and teal label. Call rows are full-width buttons, separated by rules, with hover tint (`#edf4f4`) and a selected surface. Tabs use an active teal underline (`2px`), roving focus and arrow/Home/End navigation. On mobile, selecting a record focuses its heading; returning restores focus to the originating row.

**Transcript and activity.** Assistant turns use a pale surface (`#f2f6f6`) and padding (`15px 18px`); caller turns remain on paper. Turns are separated by (`26px`). Speaker labels and elapsed timestamps precede the transcript. Details use label/value rows; activity uses ruled entries and plain action fields. Doctor/service names and appointment dates are human readable. Bangladesh timezone context is visible in desktop navigation and the mobile records heading.

## Do's and Don'ts

- **Do** preserve Bengali text readability, explicit status labels, keyboard focus and tabular metadata.
- **Do** use real Lucide icons consistently and retain labelled loading, error and empty states.
- **Do** identify fictional clinic data and scripted fixtures clearly.
- **Don't** introduce decorative charts, invented metrics or ornamental material effects into this operating interface.
- **Don't** treat this source extraction as proof of deployment, speech quality or completed mobile visual review.
