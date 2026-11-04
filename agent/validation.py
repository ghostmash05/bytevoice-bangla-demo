"""Deterministic input normalization, independent of the speech model."""

import re

BANGLA_DIGITS = str.maketrans("০১২৩৪৫৬৭৮৯", "0123456789")


def normalize_bd_mobile(value: str) -> str:
    """Accept local/880/+880 mobile formats; reject malformed input, never guess."""
    normalized = value.translate(BANGLA_DIGITS).strip()
    normalized = re.sub(r"[\s()-]", "", normalized)
    if normalized.startswith("+880"):
        normalized = "0" + normalized[4:]
    elif normalized.startswith("880"):
        normalized = "0" + normalized[3:]
    if not re.fullmatch(r"01[3-9][0-9]{8}", normalized):
        raise ValueError("Expected an 11-digit Bangladesh mobile number beginning 013–019")
    return "+880" + normalized[1:]


def normalize_reference(value: str) -> str:
    """Accept Bangla/English digits, with or without the spoken clinic prefix."""
    compact = re.sub(r"\s+", "", value.translate(BANGLA_DIGITS)).upper()
    match = re.fullmatch(r"(?:DDC-?)?([0-9A-F]{8})", compact)
    if not match:
        raise ValueError("Provide the eight-character booking reference")
    return "DDC-" + match.group(1)
