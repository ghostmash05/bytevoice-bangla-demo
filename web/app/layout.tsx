import type { Metadata } from "next";
import "./globals.css";

/* THESIS: A staff call registry that keeps the index beside the complete record.
OWN-WORLD: white records, blue-grey navigation, dark ink, teal actions; fixed sans type.
STORY: find a call, inspect its conversation and fields, verify its saved outcome.
FIRST VIEWPORT: narrow navigation, searchable call list, full-height detail workspace.
FORM: civil registry, grounded candidate 6, seed 94ef50a0; code-led operational UI.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance */
const contract = {
  seed: "94ef50a0",
  mode: "operate",
  form: "civil registry",
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
    <html lang="en">
      <body>
        <script
          id="design-contract"
          type="application/json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(contract) }}
        />
        {children}
      </body>
    </html>
  );
}
