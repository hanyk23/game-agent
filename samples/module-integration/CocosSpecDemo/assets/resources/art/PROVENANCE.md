# 素材来源（PROVENANCE）— sprite art

本目录下的 5 张 PNG 是仓库 `assets/corpus/`（已过 license 准入的 CC0 素材库）里
对应源文件的**逐字节副本**（不是重绘、不是压缩转码）。用于给黄金样本的玩家 / 敌人 /
子弹 / 背景提供真实美术，替代早期的 Graphics 画圆。

| 本副本 | corpus 源文件（仓库内） | 作者 / 来源 | License |
|--------|--------------------------|-------------|---------|
| `player.png` | `assets/corpus/sources/kenney/space-shooter-remastered/player/playerShip1_blue.png` | Kenney (kenney.nl) | CC0 |
| `enemy.png` | `assets/corpus/sources/kenney/space-shooter-remastered/enemy/enemyBlack1.png` | Kenney (kenney.nl) | CC0 |
| `player-bullet.png` | `assets/corpus/sources/kenney/space-shooter-remastered/player-projectile/laserBlue01.png` | Kenney (kenney.nl) | CC0 |
| `enemy-bullet.png` | `assets/corpus/sources/kenney/space-shooter-remastered/enemy-projectile/laserRed02.png` | Kenney (kenney.nl) | CC0 |
| `background.png` | `assets/corpus/sources/opengameart/seamless-space-backgrounds/background/blue-nebula-1.png` | OpenGameArt | CC0 |

license 与 provenance 详情见仓库 `assets/corpus/catalog.json` 与
`assets/corpus/evidence/licenses/`。

## `.meta` 说明

每张 PNG 旁的 `.png.meta` 首次由 headless 构建自动生成。为让运行时能以
`resources.load("art/<name>/spriteFrame", SpriteFrame)` 加载，`userData.type`
设为 `"sprite-frame"`（UUID 固定以保证同机构建可复现）；重新构建时 Cocos 会自动
补全 `sprite-frame` subMeta（vertices / uv 由引擎计算，无需手写）。

## 字节一致性校验（复现命令）

```
# 在仓库根执行；样本副本 sha256 必须等于 corpus 源 sha256（BYTE-MATCH）
A=samples/golden-cocos/CocosShooter/assets/resources/art
shasum -a 256 assets/corpus/sources/kenney/space-shooter-remastered/player/playerShip1_blue.png "$A/player.png"
shasum -a 256 assets/corpus/sources/kenney/space-shooter-remastered/enemy/enemyBlack1.png "$A/enemy.png"
shasum -a 256 assets/corpus/sources/kenney/space-shooter-remastered/player-projectile/laserBlue01.png "$A/player-bullet.png"
shasum -a 256 assets/corpus/sources/kenney/space-shooter-remastered/enemy-projectile/laserRed02.png "$A/enemy-bullet.png"
shasum -a 256 assets/corpus/sources/opengameart/seamless-space-backgrounds/background/blue-nebula-1.png "$A/background.png"
```

锁定哈希（2026-07-26）：

- `player.png`        → `648ec1635979fb867d08bfd0c56f011d6559dd953a13c73109c6186a3069f7ee`
- `enemy.png`         → `2aaa39e6aa389bc334df6b57f147e5db2ba5c1648d138fdc55568ccf80d91d5b`
- `player-bullet.png` → `eced881c4ebd76a13e48c388c3d8a82c7c177085b053b40124de517d9c563a3a`
- `enemy-bullet.png`  → `9300564441e0bc4fa3a4a259e04836c98fb69b165019eb0b9e6511e7cfb7c4a7`
- `background.png`    → `fc3693ef977bb50ede1183330457c4aba84a869f81c0af4d874828580bc8528e`

每个副本必须与 corpus 源逐字节相等；不相等即视为字节漂移，素材作废。
