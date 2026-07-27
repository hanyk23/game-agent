// Cocos 3.8.7 host adapter for the Module Integration Sanity (方案 B).
//
// This is the ONLY file in the demo that talks to the engine (`cc`). It is a
// thin adapter: it builds a 2D Canvas/Camera at runtime, reads the BUILD-INJECTED
// orientation from settings.json (never hardcoded, never inferred from the live
// window), loads the byte-verified spec JSON as a TextAsset, forwards input + dt
// into the engine-neutral SpecDemoCore, and renders the core's snapshot.
//
// ALL gameplay numbers originate from composeShooterGame(spec) inside
// SpecDemoCore — the host inlines NO gameplay values and news up NO planner
// parameters. Orientation is a parameter; portrait fires along +y, landscape
// along +x, driven by the same source.

import {
  _decorator,
  Component,
  Node,
  Canvas,
  Camera,
  UITransform,
  Graphics,
  Sprite,
  SpriteFrame,
  Label,
  Color,
  resources,
  view,
  ResolutionPolicy,
  settings,
  SettingsCategory,
  input,
  Input,
  EventKeyboard,
  KeyCode,
  Layers,
  JsonAsset,
  Director,
  director,
} from "cc";
import {
  SpecDemoCore,
  type Orientation,
  type RenderItem,
} from "./game-core";
import type { RuntimeGameConfig } from "./runtime/runtime-game-config";

const { ccclass } = _decorator;

// Fixed design resolutions per orientation. The game runs at a FIXED aspect
// ratio and is never stretched to fill the window: ResolutionPolicy.SHOW_ALL
// letterboxes with black bars when the window aspect differs. The actual field
// extents come from the composed viewport inside SpecDemoCore.
const DESIGN: Record<Orientation, { w: number; h: number }> = {
  portrait: { w: 720, h: 1280 },
  landscape: { w: 1280, h: 720 },
};

// Logical render kind -> resources path (under assets/resources/). Sprites are
// byte-verified copies of licensed corpus art; see assets/resources/art.
const SPRITE_PATH: Record<RenderItem["kind"] | "background", string> = {
  player: "art/player",
  enemy: "art/enemy",
  boss: "art/enemy",
  "player-bullet": "art/player-bullet",
  "enemy-bullet": "art/enemy-bullet",
  pickup: "art/player-bullet",
  background: "art/background",
};

@ccclass("CocosSpecDemoHost")
export class CocosSpecDemoHost extends Component {
  private core: SpecDemoCore | null = null;
  private graphics!: Graphics;
  private playfield!: Node;
  private hud!: Label;
  private banner!: Label;
  private orientation: Orientation = "portrait";
  private designW = 0;
  private designH = 0;
  private crossInput = 0;

  private frames = new Map<string, SpriteFrame>();
  private spritePool: Node[] = [];
  private spritesReady = false;

  onLoad() {
    // -- orientation: read the BUILD-INJECTED value (never the live window) ---
    const injected = settings.querySettings<string>(
      SettingsCategory.SCREEN,
      "orientation",
    );
    this.orientation = injected === "landscape" ? "landscape" : "portrait";

    const design = DESIGN[this.orientation];
    this.designW = design.w;
    this.designH = design.h;
    view.setDesignResolutionSize(
      this.designW,
      this.designH,
      ResolutionPolicy.SHOW_ALL,
    );

    this.#ensureCanvasAndCamera();

    this.playfield = new Node("Playfield");
    this.playfield.layer = Layers.Enum.UI_2D;
    this.playfield.setParent(this.node);
    const pfUi = this.playfield.addComponent(UITransform);
    pfUi.setContentSize(this.designW, this.designH);
    pfUi.setAnchorPoint(0, 0);
    this.playfield.setPosition(-this.designW / 2, -this.designH / 2, 0);
    this.graphics = this.playfield.addComponent(Graphics);

    this.hud = this.#makeLabel(
      "HUD",
      24,
      this.designW / 2 - 12,
      this.designH / 2 - 12,
      1,
      1,
    );
    this.banner = this.#makeLabel("Banner", 48, 0, 0, 0.5, 0.5);
    this.banner.string = "LOADING SPEC…";

    // -- load the composed RuntimeGameConfig JSON (materialized in Node) -----
    // composeShooterGame cannot run in-engine (GAP-1), so tools/build-runtime-
    // config.ts runs the REAL composer in Node and writes runtime-config.json.
    // The host consumes that composed config verbatim — it inlines no numbers.
    resources.load("config/runtime-config", JsonAsset, (err, asset) => {
      if (err || !asset) {
        this.banner.string = "RUNTIME CONFIG LOAD FAILED";
        return;
      }
      this.core = new SpecDemoCore({
        orientation: this.orientation,
        runtimeConfig: asset.json as unknown as RuntimeGameConfig,
        seed: 0x51ed5eed,
      });
      this.banner.string = "";
      this.#loadSprites();
    });

    input.on(Input.EventType.KEY_DOWN, this.#onKeyDown, this);
    input.on(Input.EventType.KEY_UP, this.#onKeyUp, this);
  }

  onDestroy() {
    input.off(Input.EventType.KEY_DOWN, this.#onKeyDown, this);
    input.off(Input.EventType.KEY_UP, this.#onKeyUp, this);
  }

  update(dt: number) {
    if (this.core === null) return;
    // Clamp dt so a stalled first frame cannot blow past collisions.
    this.core.step(Math.min(dt, 1 / 30), this.crossInput);
    this.#render();
  }

  #ensureCanvasAndCamera(): void {
    const camNode = new Node("Camera");
    camNode.setParent(this.node);
    const cam = camNode.addComponent(Camera);
    cam.projection = Camera.ProjectionType.ORTHO;
    cam.clearFlags = Camera.ClearFlag.SOLID_COLOR;
    cam.clearColor = new Color(12, 14, 22, 255);
    cam.visibility = Layers.Enum.UI_2D;

    const ui = this.node.addComponent(UITransform);
    ui.setContentSize(this.designW, this.designH);
    const canvas = this.node.addComponent(Canvas);
    canvas.cameraComponent = cam;
    canvas.alignCanvasWithScreen = true;
    this.node.layer = Layers.Enum.UI_2D;
  }

  #loadSprites(): void {
    const paths = [
      SPRITE_PATH.player,
      SPRITE_PATH.enemy,
      SPRITE_PATH["player-bullet"],
      SPRITE_PATH["enemy-bullet"],
      SPRITE_PATH.background,
    ];
    let pending = paths.length;
    for (const p of paths) {
      resources.load(`${p}/spriteFrame`, SpriteFrame, (err, frame) => {
        if (!err && frame) this.frames.set(p, frame);
        if (--pending === 0) this.#onSpritesLoaded();
      });
    }
  }

  #onSpritesLoaded(): void {
    const bg = this.frames.get(SPRITE_PATH.background);
    if (bg) {
      const bgNode = new Node("Background");
      bgNode.layer = Layers.Enum.UI_2D;
      bgNode.setParent(this.node);
      bgNode.setSiblingIndex(0);
      const bgUi = bgNode.addComponent(UITransform);
      bgUi.setContentSize(this.designW, this.designH);
      const bgSprite = bgNode.addComponent(Sprite);
      bgSprite.spriteFrame = bg;
      bgSprite.sizeMode = Sprite.SizeMode.CUSTOM;
      bgSprite.type = Sprite.Type.SIMPLE;
    }
    this.spritesReady = true;
  }

  #makeLabel(
    name: string,
    fontSize: number,
    x: number,
    y: number,
    anchorX: number,
    anchorY: number,
  ): Label {
    const n = new Node(name);
    n.layer = Layers.Enum.UI_2D;
    n.setParent(this.node);
    const ui = n.addComponent(UITransform);
    ui.setAnchorPoint(anchorX, anchorY);
    n.setPosition(x, y, 0);
    const label = n.addComponent(Label);
    label.fontSize = fontSize;
    label.lineHeight = fontSize + 4;
    label.color = new Color(230, 236, 245, 255);
    return label;
  }

  #colorFor(kind: RenderItem["kind"]): Color {
    switch (kind) {
      case "player":
        return new Color(90, 200, 255, 255);
      case "enemy":
        return new Color(255, 120, 120, 255);
      case "boss":
        return new Color(255, 80, 200, 255);
      case "player-bullet":
        return new Color(200, 255, 160, 255);
      case "enemy-bullet":
        return new Color(255, 210, 90, 255);
      case "pickup":
        return new Color(120, 255, 180, 255);
    }
  }

  #render() {
    if (this.core === null) return;
    // The core renders in composed-viewport units; scale to the fixed design
    // resolution so SHOW_ALL letterboxing keeps proportions stable.
    const sx = this.designW / this.core.fieldWidth;
    const sy = this.designH / this.core.fieldHeight;
    const snap = this.core.snapshot();
    if (this.spritesReady && this.frames.size > 0)
      this.#renderSprites(snap.items, sx, sy);
    else this.#renderGraphics(snap.items, sx, sy);

    this.hud.string =
      `HP ${snap.playerHp}  SHIELD ${snap.shield.toFixed(0)}  ` +
      `SCORE ${snap.score}  LEFT ${snap.enemiesRemaining}  ` +
      `EB ${snap.activeEnemyBullets}`;
    if (snap.state === "won") this.banner.string = "YOU WIN";
    else if (snap.state === "lost") this.banner.string = "GAME OVER";
    else this.banner.string = "";
  }

  #renderGraphics(items: readonly RenderItem[], sx: number, sy: number): void {
    const g = this.graphics;
    g.clear();
    for (const item of items) {
      g.fillColor = this.#colorFor(item.kind);
      g.circle(item.pos.x * sx, item.pos.y * sy, item.radius * Math.min(sx, sy));
      g.fill();
    }
  }

  #renderSprites(items: readonly RenderItem[], sx: number, sy: number): void {
    this.graphics.clear();
    for (let i = 0; i < items.length; i++) {
      const item = items[i]!;
      const frame = this.frames.get(SPRITE_PATH[item.kind]);
      const node = this.#poolNode(i);
      const sprite = node.getComponent(Sprite)!;
      if (frame && sprite.spriteFrame !== frame) sprite.spriteFrame = frame;
      const ui = node.getComponent(UITransform)!;
      const diameter = item.radius * 2 * Math.min(sx, sy);
      const scale =
        diameter / Math.max(frame ? frame.rect.height : diameter, 1);
      ui.setContentSize(
        (frame ? frame.rect.width : diameter) * scale,
        (frame ? frame.rect.height : diameter) * scale,
      );
      node.setPosition(item.pos.x * sx, item.pos.y * sy, 0);
      node.active = true;
    }
    for (let i = items.length; i < this.spritePool.length; i++)
      this.spritePool[i]!.active = false;
  }

  #poolNode(i: number): Node {
    let node = this.spritePool[i];
    if (!node) {
      node = new Node(`Sprite_${i}`);
      node.layer = Layers.Enum.UI_2D;
      node.setParent(this.playfield);
      node.addComponent(UITransform).setAnchorPoint(0.5, 0.5);
      const sprite = node.addComponent(Sprite);
      sprite.sizeMode = Sprite.SizeMode.CUSTOM;
      sprite.type = Sprite.Type.SIMPLE;
      this.spritePool[i] = node;
    }
    return node;
  }

  #onKeyDown(e: EventKeyboard) {
    if (e.keyCode === KeyCode.ARROW_LEFT || e.keyCode === KeyCode.KEY_A)
      this.crossInput = -1;
    else if (e.keyCode === KeyCode.ARROW_RIGHT || e.keyCode === KeyCode.KEY_D)
      this.crossInput = 1;
  }

  #onKeyUp(_e: EventKeyboard) {
    this.crossInput = 0;
  }
}

// Touch the imported Director/director symbols so tree-shaking keeps the engine
// lifecycle available even in a minimal build (defensive; harmless at runtime).
void Director;
void director;
