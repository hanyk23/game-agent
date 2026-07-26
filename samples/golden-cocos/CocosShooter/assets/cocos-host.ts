// Cocos 3.8.7 host adapter for the bullet-hell golden sample (Round A).
//
// This is the ONLY file in the sample that talks to the engine (`cc`). It is a
// thin adapter: it builds a 2D Canvas/Camera at runtime, reads the BUILD-INJECTED
// orientation from settings.json (never hardcoded, never inferred from the live
// window), forwards input + dt into the engine-neutral BulletHellCore, and
// renders the core's snapshot with licensed corpus sprites (Graphics fallback
// until they load). All simulation/authority lives in game-core.ts, which in
// turn reuses the real product modules under assets/modules/.

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
  Director,
  director,
} from "cc";
import { BulletHellCore, type Orientation, type RenderItem } from "./game-core";

const { ccclass } = _decorator;

// Fixed design resolutions per orientation. The game runs at a FIXED aspect
// ratio (portrait 9:16, landscape 16:9) and is never stretched to fill the
// window: ResolutionPolicy.SHOW_ALL letterboxes with black bars when the window
// aspect differs. This keeps gameplay proportions stable across window sizes.
const DESIGN: Record<Orientation, { w: number; h: number }> = {
  portrait: { w: 720, h: 1280 },
  landscape: { w: 1280, h: 720 },
};

// Logical render kind -> resources path (under assets/resources/). Sprites are
// byte-verified copies of licensed corpus art; see assets/resources/art.
const SPRITE_PATH: Record<RenderItem["kind"] | "background", string> = {
  player: "art/player",
  enemy: "art/enemy",
  "player-bullet": "art/player-bullet",
  "enemy-bullet": "art/enemy-bullet",
  background: "art/background",
};

@ccclass("CocosShooterHost")
export class CocosShooterHost extends Component {
  private core!: BulletHellCore;
  private graphics!: Graphics;
  private playfield!: Node;
  private hud!: Label;
  private banner!: Label;
  private fieldW = 0;
  private fieldH = 0;
  private crossInput = 0;

  // Sprite pooling: one reusable Sprite node per kind index, plus loaded frames.
  private frames = new Map<string, SpriteFrame>();
  private spritePool: Node[] = [];
  private spritesReady = false;

  onLoad() {
    // -- orientation: read the BUILD-INJECTED value (never the live window) ---
    // settings.json screen.orientation is written by the headless build
    // (packages.web-mobile.orientation). Reading it here is what makes portrait
    // and landscape builds diverge at runtime: the core maps orientation onto its
    // forward/cross axes, so portrait fires along +y (player at bottom) while
    // landscape fires along +x (player at left) -- a genuine gameplay difference
    // regardless of the browser window the sample happens to run in.
    const injected = settings.querySettings<string>(SettingsCategory.SCREEN, "orientation");
    const orientation: Orientation = injected === "landscape" ? "landscape" : "portrait";

    // Fixed design resolution + SHOW_ALL: the playfield keeps a constant aspect
    // ratio and is letterboxed (black bars) rather than stretched to the window.
    // The field extents come from DESIGN, never from the live viewport, so the
    // two builds have different, stable proportions regardless of window shape.
    const design = DESIGN[orientation];
    this.fieldW = design.w;
    this.fieldH = design.h;
    view.setDesignResolutionSize(this.fieldW, this.fieldH, ResolutionPolicy.SHOW_ALL);

    // -- build the 2D scene graph at runtime --------------------------------
    this.#ensureCanvasAndCamera();

    this.playfield = new Node("Playfield");
    this.playfield.layer = Layers.Enum.UI_2D;
    this.playfield.setParent(this.node);
    const pfUi = this.playfield.addComponent(UITransform);
    pfUi.setContentSize(this.fieldW, this.fieldH);
    pfUi.setAnchorPoint(0, 0);
    this.playfield.setPosition(-this.fieldW / 2, -this.fieldH / 2, 0);
    this.graphics = this.playfield.addComponent(Graphics);

    this.hud = this.#makeLabel("HUD", 24, this.fieldW / 2 - 12, this.fieldH / 2 - 12, 1, 1);
    this.banner = this.#makeLabel("Banner", 48, 0, 0, 0.5, 0.5);
    this.banner.string = "";

    // -- create the engine-neutral core -------------------------------------
    this.core = new BulletHellCore({
      orientation,
      fieldWidth: this.fieldW,
      fieldHeight: this.fieldH,
      enemyBudget: 12,
      playerHp: 5,
      seed: 0x51ed5eed,
    });

    // -- load licensed corpus sprites (async; graphics fallback until ready) --
    this.#loadSprites(orientation);

    input.on(Input.EventType.KEY_DOWN, this.#onKeyDown, this);
    input.on(Input.EventType.KEY_UP, this.#onKeyUp, this);
  }

  onDestroy() {
    input.off(Input.EventType.KEY_DOWN, this.#onKeyDown, this);
    input.off(Input.EventType.KEY_UP, this.#onKeyUp, this);
  }

  update(dt: number) {
    // Clamp dt so a stalled first frame cannot blow past collisions.
    this.core.step(Math.min(dt, 1 / 30), this.crossInput);
    this.#render();
  }

  #ensureCanvasAndCamera(): void {
    // Camera node
    const camNode = new Node("Camera");
    camNode.setParent(this.node);
    const cam = camNode.addComponent(Camera);
    cam.projection = Camera.ProjectionType.ORTHO;
    cam.clearFlags = Camera.ClearFlag.SOLID_COLOR;
    cam.clearColor = new Color(12, 14, 22, 255);
    cam.visibility = Layers.Enum.UI_2D;

    // Canvas on the host node
    const ui = this.node.addComponent(UITransform);
    ui.setContentSize(this.fieldW, this.fieldH);
    const canvas = this.node.addComponent(Canvas);
    canvas.cameraComponent = cam;
    canvas.alignCanvasWithScreen = true;
    this.node.layer = Layers.Enum.UI_2D;
  }

  /** Load byte-verified corpus sprite frames from assets/resources/art.
   *  Adds a background sprite immediately; on completion, flips to sprite
   *  rendering. Until then #render falls back to Graphics circles. */
  #loadSprites(orientation: Orientation): void {
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
        if (--pending === 0) this.#onSpritesLoaded(orientation);
      });
    }
  }

  #onSpritesLoaded(orientation: Orientation): void {
    // Background: a tiled/stretched sprite behind the playfield.
    const bg = this.frames.get(SPRITE_PATH.background);
    if (bg) {
      const bgNode = new Node("Background");
      bgNode.layer = Layers.Enum.UI_2D;
      bgNode.setParent(this.node);
      bgNode.setSiblingIndex(0);
      const bgUi = bgNode.addComponent(UITransform);
      bgUi.setContentSize(this.fieldW, this.fieldH);
      const bgSprite = bgNode.addComponent(Sprite);
      bgSprite.spriteFrame = bg;
      bgSprite.sizeMode = Sprite.SizeMode.CUSTOM;
      bgSprite.type = Sprite.Type.SIMPLE;
    }
    void orientation;
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
      case "player-bullet":
        return new Color(200, 255, 160, 255);
      case "enemy-bullet":
        return new Color(255, 210, 90, 255);
    }
  }

  #render() {
    const snap = this.core.snapshot();
    if (this.spritesReady && this.frames.size > 0) this.#renderSprites(snap.items);
    else this.#renderGraphics(snap.items);

    this.hud.string =
      `HP ${snap.playerHp}   SCORE ${snap.score}   ` +
      `LEFT ${snap.enemiesRemaining}   BULLETS ${snap.activeBullets}`;
    if (snap.state === "won") this.banner.string = "YOU WIN";
    else if (snap.state === "lost") this.banner.string = "GAME OVER";
    else this.banner.string = "";
  }

  /** Graphics fallback used before sprites finish loading (or if none exist). */
  #renderGraphics(items: readonly RenderItem[]): void {
    const g = this.graphics;
    g.clear();
    for (const item of items) {
      g.fillColor = this.#colorFor(item.kind);
      g.circle(item.pos.x, item.pos.y, item.radius);
      g.fill();
    }
  }

  /** Sprite rendering: pool one Sprite node per visible item, reusing nodes. */
  #renderSprites(items: readonly RenderItem[]): void {
    this.graphics.clear();
    for (let i = 0; i < items.length; i++) {
      const item = items[i]!;
      const frame = this.frames.get(SPRITE_PATH[item.kind]);
      const node = this.#poolNode(i);
      const sprite = node.getComponent(Sprite)!;
      if (frame && sprite.spriteFrame !== frame) sprite.spriteFrame = frame;
      const ui = node.getComponent(UITransform)!;
      const scale = (item.radius * 2) / Math.max(frame ? frame.rect.height : item.radius * 2, 1);
      ui.setContentSize(
        (frame ? frame.rect.width : item.radius * 2) * scale,
        (frame ? frame.rect.height : item.radius * 2) * scale,
      );
      node.setPosition(item.pos.x, item.pos.y, 0);
      node.active = true;
    }
    for (let i = items.length; i < this.spritePool.length; i++) this.spritePool[i]!.active = false;
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
