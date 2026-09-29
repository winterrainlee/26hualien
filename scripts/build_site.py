"""Build the static GitHub Pages artifact with content-hash cache busting."""
import hashlib
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEST = (ROOT / (sys.argv[1] if len(sys.argv) > 1 else "_site")).resolve()

CORE_ASSETS = [
    "style.css",
    "map-data.js",
    "notes.js",
    "neighbor-labels.js",
    "app.js",
]
STATIC_FILES = ["index.html", *CORE_ASSETS]
STATIC_DIRS = ["assets", "tests"]


def site_version():
    digest = hashlib.sha256()
    for rel in CORE_ASSETS:
        path = ROOT / rel
        digest.update(rel.encode("utf-8"))
        digest.update(b"\0")
        digest.update(path.read_bytes())
        digest.update(b"\0")
    assets = ROOT / "assets"
    if assets.exists():
        for path in sorted(p for p in assets.rglob("*") if p.is_file()):
            digest.update(path.relative_to(ROOT).as_posix().encode("utf-8"))
            digest.update(b"\0")
            digest.update(path.read_bytes())
            digest.update(b"\0")
    return digest.hexdigest()[:12]


def stamp_reference(text, ref, version, expected):
    pattern = re.escape(ref) + r"(?:\?v=[^\"']*)?"
    updated, count = re.subn(pattern, f"{ref}?v={version}", text)
    if count != expected:
        raise RuntimeError(f"expected {expected} reference(s) to {ref}, found {count}")
    return updated


if DEST == ROOT or ROOT not in DEST.parents:
    raise RuntimeError("destination must be a subdirectory of the repository")

if DEST.exists():
    shutil.rmtree(DEST)
DEST.mkdir(parents=True)

for rel in STATIC_FILES:
    shutil.copy2(ROOT / rel, DEST / rel)
for rel in STATIC_DIRS:
    source = ROOT / rel
    if source.exists():
        shutil.copytree(source, DEST / rel)

version = site_version()

index_path = DEST / "index.html"
index = index_path.read_text(encoding="utf-8")
for asset in CORE_ASSETS:
    index = stamp_reference(index, f"./{asset}", version, 1)
index_path.write_text(index, encoding="utf-8")

app_path = DEST / "app.js"
app = app_path.read_text(encoding="utf-8")
app = stamp_reference(app, "./assets/train-front.svg", version, 1)
app_path.write_text(app, encoding="utf-8")

mobile_path = DEST / "tests/mobile.html"
if mobile_path.exists():
    mobile = mobile_path.read_text(encoding="utf-8")
    mobile = stamp_reference(mobile, "../index.html", version, 2)
    mobile_path.write_text(mobile, encoding="utf-8")

(DEST / ".nojekyll").write_text("", encoding="utf-8")
print(f"Built {DEST.relative_to(ROOT)}/ with cache version {version}")
