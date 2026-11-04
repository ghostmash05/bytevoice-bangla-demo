"""Export only worker source into an ignored, reproducible CLI build context.

The LiveKit CLI detects livekit-agents in root requirements.txt. The repository
root is the lightweight hosted API, so its requirements intentionally omit it.
"""
import hashlib
import json
from pathlib import Path
from shutil import copy2

from agent.config import ROOT


def main():
    destination = ROOT / ".local" / "agent-deploy"
    destination.mkdir(parents=True, exist_ok=True)
    sources = [*sorted((ROOT / "agent").glob("*.py")), ROOT / "shared" / "clinic.json",
               ROOT / "Dockerfile", ROOT / ".dockerignore", ROOT / "requirements-agent.txt",
               ROOT / "requirements-backend.txt"]
    hashes = {}
    for source in sources:
        relative = source.relative_to(ROOT)
        target = destination / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        copy2(source, target)
        hashes[relative.as_posix()] = hashlib.sha256(source.read_bytes()).hexdigest()
    flattened = (ROOT / "requirements-backend.txt").read_text() + "\n" + "\n".join(
        line for line in (ROOT / "requirements-agent.txt").read_text().splitlines() if not line.startswith("-r ")) + "\n"
    (destination / "requirements.txt").write_text(flattened, encoding="utf-8")
    (destination / "source-manifest.json").write_text(json.dumps(hashes, indent=2), encoding="utf-8")
    print("Worker-only build context prepared:", destination)
    print("No environment files, database, recordings, reviewer credentials or runtime dependencies copied.")


if __name__ == "__main__":
    main()
