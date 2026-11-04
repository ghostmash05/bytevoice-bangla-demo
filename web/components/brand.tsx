"use client";
import { useLocale } from "./locale";
export function Brand({ mark = false }: { mark?: boolean }) {
  const { t } = useLocale();
  return mark ? (
    <span className="brand-emblem" aria-hidden="true">
      {/* Crop the original brand asset in CSS; the waveform is not redrawn. */}
      <img src="/brand/bytevoice-logo-light.png" alt="" width="664" height="294" />
    </span>
  ) : (
    <span className="brand-lockup">
      <img className="brand-logo" src="/brand/bytevoice-logo-light.png" alt="ByteVoice" width="664" height="294" />
      <span className="brand-edition">{t("Bangla workspace")}</span>
    </span>
  );
}
