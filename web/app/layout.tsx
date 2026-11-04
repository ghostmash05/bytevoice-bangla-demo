import type { Metadata } from "next";
import "./globals.css";
import "./fonts.css";
import { LocaleProvider } from "@/components/locale";

/* THESIS: Conversations become clear, actionable clinic records.
OWN-WORLD: ByteVoice waveform, cool silver glass frame, clear white records, Manrope and Bengali type.
STORY: find a call, inspect its conversation and fields, verify its saved outcome.
FIRST VIEWPORT: narrow navigation, searchable call list, full-height detail workspace.
FORM: framed-sheet, seed 257497214; code-led implementation of the user-pinned silver glass direction.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance */
const contract = {
  seed: "257497214",
  mode: "operate",
  form: "silver glass framed workspace",
  scope: "Staff portal and voice test; landing page excluded",
};

export const metadata: Metadata = {
  title: "Clinic workspace · ByteVoice Bangla",
  description:
    "Review calls, transcripts and appointment outcomes for the fictional dental demo.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{__html: `try{document.documentElement.dataset.theme=localStorage.getItem('bytevoice-theme')==='dark'?'dark':'light'}catch{document.documentElement.dataset.theme='light'}`}} />
        <script
          id="design-contract"
          type="application/json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(contract) }}
        />
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}
