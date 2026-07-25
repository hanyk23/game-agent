from __future__ import annotations

import hashlib
import json
import sys
from collections import Counter, defaultdict
from pathlib import Path

from PIL import Image


ROOT = Path(
    sys.argv[1]
    if len(sys.argv) > 1
    else ".runtime/asset-batch-003/acquisition"
).resolve()
DOWNLOADS = ROOT / "downloads"
EXPANDED = ROOT / "expanded"
OUTPUT = ROOT / "png-inventory.json"
MAX_EXPANDED_BYTES = 150_000_000
MAX_IMAGE_PIXELS = 40_000_000


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def source_id(path: Path) -> str:
    if path.is_relative_to(EXPANDED):
        return path.relative_to(EXPANDED).parts[0]
    return path.name.split("--", 1)[0]


def inventory_png(path: Path) -> dict[str, object]:
    relative_path = path.relative_to(ROOT).as_posix()
    byte_size = path.stat().st_size
    digest = sha256_file(path)

    with Image.open(path) as image:
        if image.format != "PNG":
            raise ValueError(f"expected PNG format: {relative_path}")
        width, height = image.size
        if width <= 0 or height <= 0 or width * height > MAX_IMAGE_PIXELS:
            raise ValueError(f"unsafe PNG dimensions {width}x{height}: {relative_path}")
        rgba = image.convert("RGBA")
        alpha = rgba.getchannel("A")
        alpha_min, alpha_max = alpha.getextrema()
        bounds = alpha.getbbox()
        histogram = alpha.histogram()
        occupied_pixels = width * height - histogram[0]

    if bounds is None:
        visible_bounds = None
        visible_width = 0
        visible_height = 0
    else:
        left, top, right, bottom = bounds
        visible_width = right - left
        visible_height = bottom - top
        visible_bounds = {
            "left": left,
            "top": top,
            "width": visible_width,
            "height": visible_height,
        }

    return {
        "sourceId": source_id(path),
        "path": relative_path,
        "bytes": byte_size,
        "sha256": digest,
        "width": width,
        "height": height,
        "hasTransparency": alpha_min < 255,
        "isOpaque": alpha_min == 255,
        "isFullyTransparent": alpha_max == 0,
        "visibleBounds": visible_bounds,
        "visibleWidth": visible_width,
        "visibleHeight": visible_height,
        "occupiedPixels": occupied_pixels,
    }


def main() -> None:
    if not DOWNLOADS.is_dir() or not EXPANDED.is_dir():
        raise RuntimeError("Batch 003 downloads and expanded directories are required")

    expanded_bytes = sum(
        path.stat().st_size for path in EXPANDED.rglob("*") if path.is_file()
    )
    if expanded_bytes > MAX_EXPANDED_BYTES:
        raise RuntimeError(
            f"expanded workspace exceeds hard stop: {expanded_bytes} bytes"
        )

    paths = sorted(
        [path for path in DOWNLOADS.glob("*.png") if path.is_file()]
        + [path for path in EXPANDED.rglob("*.png") if path.is_file()],
        key=lambda path: path.relative_to(ROOT).as_posix().lower(),
    )
    records: list[dict[str, object]] = []
    invalid_files: list[dict[str, object]] = []
    for path in paths:
        try:
            records.append(inventory_png(path))
        except (OSError, ValueError) as error:
            invalid_files.append(
                {
                    "path": path.relative_to(ROOT).as_posix(),
                    "bytes": path.stat().st_size,
                    "sha256": sha256_file(path),
                    "reason": str(error),
                }
            )

    by_hash: dict[str, list[str]] = defaultdict(list)
    for record in records:
        by_hash[str(record["sha256"])].append(str(record["path"]))
    duplicate_groups = [
        {"sha256": digest, "paths": sorted(group)}
        for digest, group in sorted(by_hash.items())
        if len(group) > 1
    ]

    source_counts = Counter(str(record["sourceId"]) for record in records)
    report = {
        "schemaVersion": "1.0.0",
        "batchId": (
            "003-gap-increment" if ROOT.name == "gap-acquisition" else "003"
        ),
        "status": "downloaded-inventory-only",
        "limits": {
            "expandedWorkspaceHardStopBytes": MAX_EXPANDED_BYTES,
            "maxImagePixels": MAX_IMAGE_PIXELS,
        },
        "actual": {
            "expandedWorkspaceBytes": expanded_bytes,
            "pngCount": len(records),
            "uniquePngSha256Count": len(by_hash),
            "duplicateHashGroupCount": len(duplicate_groups),
            "opaquePngCount": sum(bool(record["isOpaque"]) for record in records),
            "transparentPngCount": sum(
                bool(record["hasTransparency"]) for record in records
            ),
            "fullyTransparentPngCount": sum(
                bool(record["isFullyTransparent"]) for record in records
            ),
            "invalidPngNamedFileCount": len(invalid_files),
            "sourcePngCounts": dict(sorted(source_counts.items())),
        },
        "invalidPngNamedFiles": invalid_files,
        "duplicateGroups": duplicate_groups,
        "files": records,
    }
    OUTPUT.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report["actual"], indent=2))


if __name__ == "__main__":
    Image.MAX_IMAGE_PIXELS = MAX_IMAGE_PIXELS
    main()
