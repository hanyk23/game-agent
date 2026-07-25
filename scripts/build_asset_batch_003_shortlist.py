from __future__ import annotations

import json
from collections import Counter
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


PROJECT = Path(__file__).resolve().parents[1]
ROOTS = (
    PROJECT / ".runtime/asset-batch-003/acquisition",
    PROJECT / ".runtime/asset-batch-003/gap-acquisition",
    PROJECT / ".runtime/asset-batch-003/background-gap-acquisition",
)
OUTPUT_JSON = PROJECT / "assets/corpus/evidence/shortlist-batch-003.json"
OUTPUT_SHEET = PROJECT / "assets/corpus/evidence/review-contact-sheet-batch-003.png"


def item(category: str, source_id: str, suffix: str, role: str) -> dict[str, str]:
    return {
        "category": category,
        "sourceId": source_id,
        "pathSuffix": suffix,
        "role": role,
    }


SELECTIONS = [
    item("player", "scientist-starships--spaceship-sprites", "/blue_ship1.png", "agile blue fighter"),
    item("player", "scientist-starships--spaceship-sprites", "/green_ship1.png", "heavy green fighter"),
    item("player", "scrittl-starships--spaceshipset32x32", "/player_ship.png", "compact interceptor"),
    item("player", "irmandito-starships--spaceships", "/Ship_1.png", "light scout"),
    item("player", "knik1985-drone--drone", "/Drone.png", "drone craft"),
    item("player", "ruok", "/Eva1.png", "unconventional geometric pilot"),
    item("enemy", "scrittl-starships--spaceshipset32x32", "/enemy_1.png", "light enemy A"),
    item("enemy", "scrittl-starships--spaceshipset32x32", "/enemy_2.png", "light enemy B"),
    item("enemy", "scrittl-starships--spaceshipset32x32", "/enemy_3.png", "light enemy C"),
    item("enemy", "irmandito-starships--spaceships", "/Ship_2.png", "enemy fighter A"),
    item("enemy", "irmandito-starships--spaceships", "/Ship_3.png", "enemy fighter B"),
    item("enemy", "irmandito-starships--spaceships", "/Ship_4.png", "enemy fighter C"),
    item("enemy", "irmandito-starships--spaceships", "/Ship_5.png", "enemy fighter D"),
    item("enemy", "knik1985-drone--drone", "/Drone-sheet1.png", "drone animation source"),
    item("enemy", "scientist-starships--spaceship-sprites", "/orange_ship1.png", "orange attacker"),
    item("enemy", "scientist-starships--spaceship-sprites", "/yellow_ship1.png", "yellow attacker"),
    item("enemy", "ruok", "/Enemy8.png", "geometric enemy A"),
    item("enemy", "ruok", "/Enemy9.png", "geometric enemy B"),
    item("enemy", "ruok", "/Enemy10.png", "geometric enemy C"),
    item("enemy", "ultrahuntr-turret", "turretdeploy.png", "deploying turret source"),
    item("boss", "jaykingsta14-mega-mecha", "mega-mecha.png", "mega mecha"),
    item("boss", "mieki256-stg-objects", "boss-body.png", "STG mechanical boss"),
    item("boss", "chaosshark-shipyard", "shipyard-exterior.png", "space station fortress"),
    item("boss", "scientist-alien-boss--alien-bosses", "/EyeBoss_1.png", "alien eyeball boss"),
    item("background", "beren77-space-backdrop", "spacefield-a-000.png", "deep space field"),
    item("background", "luminousdragon-seamless-night", "starbasesnow.png", "night star field"),
    item("background", "pwl-seamless-cave", "back-cave.png", "alien cave"),
    item("background", "stumpystrust-space-background", "space1.png", "space nebula"),
    item("background", "sethbyrd", "/Stars iphone6+.png", "starry portrait field"),
    item("background", "phoenix1291", "/Space_background_2_1.png", "space vista A"),
    item("background", "phoenix1291", "/Space_background_3.png", "space vista B"),
    item("background", "greenblackbg.png", "greenblackbg.png", "green-black abstract field"),
    item("player-projectile", "mieki256-stg-objects", "shot.png", "friendly shot sheet"),
    item("player-projectile", "scientist-starships--spaceship-sprites", "/bullet.png", "small laser"),
    item("player-projectile", "scientist-starships--spaceship-sprites", "/missile.png", "missile"),
    item("player-projectile", "scientist-starships--spaceship-sprites", "/beam_chargeup.png", "charged beam"),
    item("player-projectile", "luca", "/Bullet1.png", "long bolt"),
    item("player-projectile", "ruok", "/PlayerBullet1.png", "geometric player shot"),
    item("enemy-projectile", "mieki256-stg-objects", "boss-laser.png", "boss laser"),
    item("enemy-projectile", "mieki256-stg-objects", "boss-shot1.png", "boss shot"),
    item("enemy-projectile", "phobi", "/bulet_3.png", "vertical hostile bolt"),
    item("enemy-projectile", "ruok", "/CircleBullet1.png", "hostile orb A"),
    item("enemy-projectile", "ruok", "/CircleBullet2.png", "hostile orb B"),
    item("enemy-projectile", "luca", "/BulletA1.png", "small hostile pellet"),
    item("pickup", "cethiel-pickups--powerup", "/PowerUp_01.png", "power-up A"),
    item("pickup", "cethiel-pickups--powerup", "/PowerUp_02.png", "power-up B"),
    item("pickup", "cethiel-pickups--powerup", "/PowerUp_03.png", "power-up C"),
    item("pickup", "konita-powerups--powerups", "/Health.png", "health"),
    item("pickup", "konita-powerups--powerups", "/firerate increaser.png", "fire-rate upgrade"),
    item("pickup", "konita-powerups--powerups", "/Speed increaser.png", "speed upgrade"),
    item("ui", "pace-smith-ui", "dialoguebox1.png", "HUD panel"),
    item("ui", "pace-smith-ui", "mouse-pointer.png", "cursor"),
    item("ui", "pace-smith-ui", "question-mark.png", "help badge"),
    item("ui", "pace-smith-ui", "quit-icon.png", "quit button"),
    item("ui", "pace-smith-ui", "speaker-icon1.png", "audio icon"),
    item("ui", "barkino-ui--pixel-ui", "/button1.png", "primary button"),
    item("ui", "barkino-ui--pixel-ui", "/checkbox1.png", "toggle"),
    item("ui", "barkino-ui--pixel-ui", "/close-button.png", "close button"),
    item("ui", "barkino-ui--pixel-ui", "/select1.png", "selection panel"),
    item("ui", "barkino-ui--pixel-ui", "/textbox1.png", "score frame"),
    item("effect", "gameprogrammingslave-effects", "explosion0.png", "small explosion"),
    item("effect", "gameprogrammingslave-effects", "explosion1.png", "medium explosion"),
    item("effect", "gameprogrammingslave-effects", "explosion2.png", "large explosion"),
    item("effect", "gameprogrammingslave-effects", "shields.png", "shield animation"),
    item("effect", "arlantr-energy", "energy-sprite-sheet.png", "energy charge"),
    item("effect", "zeroisnotnull-shield", "shield.png", "shield bubble"),
    item("effect", "scientist-starships--spaceship-sprites", "/electric_explosion.png", "electric blast"),
    item("effect", "scientist-alien-boss--alien-bosses", "/PurpleWarning.png", "warning pulse"),
    item("effect", "reactorcore-muzzle--rc-art-muzzle-effects", "/Muzzle Big Fire_1.png", "muzzle flash"),
    item("effect", "reactorcore-muzzle--rc-art-muzzle-effects", "/Muzzle Big Ion_1.png", "ion muzzle flash"),
]


def load_inventory() -> list[dict[str, object]]:
    records: list[dict[str, object]] = []
    for root in ROOTS:
        inventory = json.loads((root / "png-inventory.json").read_text(encoding="utf-8"))
        for record in inventory["files"]:
            records.append({**record, "acquisitionRoot": root.relative_to(PROJECT).as_posix()})
    return records


def resolve_selection(selection: dict[str, str], records: list[dict[str, object]]) -> dict[str, object]:
    matches = [
        record
        for record in records
        if record["sourceId"] == selection["sourceId"]
        and str(record["path"]).replace("\\", "/").endswith(selection["pathSuffix"])
    ]
    if len(matches) != 1:
        raise RuntimeError(f"expected one match for {selection}, found {len(matches)}")
    record = matches[0]
    return {
        "number": 0,
        "category": selection["category"],
        "role": selection["role"],
        "sourceId": record["sourceId"],
        "acquisitionRoot": record["acquisitionRoot"],
        "path": record["path"],
        "sha256": record["sha256"],
        "bytes": record["bytes"],
        "width": record["width"],
        "height": record["height"],
        "visibleWidth": record["visibleWidth"],
        "visibleHeight": record["visibleHeight"],
        "occupiedPixels": record["occupiedPixels"],
        "isOpaque": record["isOpaque"],
    }


def checkerboard(width: int, height: int) -> Image.Image:
    image = Image.new("RGB", (width, height), "#202534")
    draw = ImageDraw.Draw(image)
    step = 12
    for y in range(0, height, step):
        for x in range(0, width, step):
            if (x // step + y // step) % 2 == 0:
                draw.rectangle((x, y, x + step - 1, y + step - 1), fill="#30384b")
    return image


def image_path(record: dict[str, object]) -> Path:
    return PROJECT / str(record["acquisitionRoot"]) / str(record["path"])


def build_contact_sheet(records: list[dict[str, object]]) -> None:
    categories = list(dict.fromkeys(record["category"] for record in records))
    columns, cell_w, cell_h, header_h = 5, 260, 190, 46
    rows = sum((sum(record["category"] == category for record in records) + columns - 1) // columns for category in categories)
    width = columns * cell_w
    height = 70 + len(categories) * header_h + rows * cell_h
    sheet = Image.new("RGB", (width, height), "#111520")
    draw = ImageDraw.Draw(sheet)
    font = ImageFont.load_default()
    draw.text((18, 18), "Batch 003 provisional shortlist - 70 candidates - approval required", fill="#f4f7ff", font=font)
    draw.text((18, 38), "Small quota/pixel deviations are non-blocking; source files remain quarantined.", fill="#aeb8cc", font=font)
    y = 70
    for category in categories:
        group = [record for record in records if record["category"] == category]
        draw.rectangle((0, y, width, y + header_h - 1), fill="#24304a")
        draw.text((18, y + 15), f"{category.upper()} ({len(group)})", fill="#8fd3ff", font=font)
        y += header_h
        for index, record in enumerate(group):
            col, row = index % columns, index // columns
            x0, y0 = col * cell_w, y + row * cell_h
            draw.rectangle((x0 + 4, y0 + 4, x0 + cell_w - 5, y0 + cell_h - 5), outline="#3b4962", width=1)
            preview = checkerboard(228, 126)
            source = Image.open(image_path(record)).convert("RGBA")
            source.thumbnail((220, 118), Image.Resampling.NEAREST)
            preview.alpha_composite(source, ((228 - source.width) // 2, (126 - source.height) // 2)) if preview.mode == "RGBA" else preview.paste(source, ((228 - source.width) // 2, (126 - source.height) // 2), source)
            sheet.paste(preview, (x0 + 16, y0 + 10))
            label = f"{record['number']:02d} {record['role']}"
            source_label = f"{record['sourceId']} | {record['width']}x{record['height']}"
            draw.text((x0 + 12, y0 + 142), label[:40], fill="#ffffff", font=font)
            draw.text((x0 + 12, y0 + 160), source_label[:43], fill="#aeb8cc", font=font)
        y += ((len(group) + columns - 1) // columns) * cell_h
    OUTPUT_SHEET.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(OUTPUT_SHEET, optimize=True)


def main() -> None:
    inventory = load_inventory()
    resolved = [resolve_selection(selection, inventory) for selection in SELECTIONS]
    hashes = [record["sha256"] for record in resolved]
    if len(hashes) != len(set(hashes)):
        raise RuntimeError("shortlist contains duplicate source hashes")
    for number, record in enumerate(resolved, start=1):
        record["number"] = number
    payload = {
        "schemaVersion": "1.0.0",
        "batchId": "003",
        "status": "provisional-shortlist-awaiting-project-owner-review",
        "selectionPolicy": "fast manual role shortlist; small count and negligible pixel deviations are non-blocking",
        "counts": dict(sorted(Counter(record["category"] for record in resolved).items())),
        "total": len(resolved),
        "records": resolved,
    }
    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_JSON.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    build_contact_sheet(resolved)
    print(json.dumps({"total": len(resolved), "counts": payload["counts"], "json": str(OUTPUT_JSON), "sheet": str(OUTPUT_SHEET)}))


if __name__ == "__main__":
    main()
