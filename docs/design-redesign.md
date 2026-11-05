# Workspace redesign

Historical design record from November 4. Later landing, typography and palette changes supersede the visual choices below. See [DESIGN.md](../DESIGN.md) for the current system and [README](../README.md) for the current product.

The November 4 redesign uses the installed `design-taste-frontend` skill from
Leonxlnx/taste-skill together with the on-device Impeccable workflow. The selected
app direction is `framed-sheet`, seed `257497214`, recorded in
`.taste-skill/direction.json`. This is a code-led operational UI, with no marketing
landing page or recorded video.

## Identity and interaction

- Original ByteVoice wordmark and waveform, displayed in neutral monochrome.
  Asset origin is recorded in `web/public/brand/SOURCES.md` and PNG metadata.
- Self-hosted Manrope and Noto Sans Bengali, with their OFL licenses included.
- Light silver surfaces by default; dark mode and Bangla/English language controls
  persist in local storage. Storage failure does not prevent using the controls.
- Desktop call list and selected detail scroll independently. Phone layouts show
  the list or selected detail with a back control and collapsible filters.
- Bangla translates interface labels, known statuses, field names, counts and
  dates. Original transcript text, patient names, phone numbers and references are
  preserved. Unrecognized server error messages retain their original wording.
- Phone editable inputs use 16px text to avoid Safari's small-input focus zoom;
  header buttons have minimum 44px targets. Real-device Safari focus behavior has
  not been retested for this visual-only release.

## Verification

The production Next.js build and TypeScript checks pass. Browser checks cover
1440px desktop, 768px tablet and 390px phone layouts, both themes, both languages,
preference persistence, sign-in, populated/empty search, selected records and the
data-model view. Preview evidence uses local fictional patient fixtures.

The Impeccable detector returned no findings. Taste lint returned zero failures;
its remaining warnings concern deliberate glass and soft depth requested by the
user, plus monospace for literal database identifiers. The independent finish
review accepted the visual system and then confirmed the bounded phone input and
touch-target corrections. `DESIGN.md` and `.impeccable/design.json` document the
implemented system.

Connected Brave was used for reference inspection and functional checks. Some of
its responsive screenshot attempts timed out or mis-scaled; clean local captures
were also taken through the in-app browser. Neither workflow used native computer
controls or an external browser runner. Invalid captures are excluded from review.

Voice-provider, booking and call-runtime code were not changed by this redesign;
the visual review does not establish new claims about voice quality.
