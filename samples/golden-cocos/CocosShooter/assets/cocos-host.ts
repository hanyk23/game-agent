// Cocos 3.8.7 host adapter for the bullet-hell golden sample (Round A).
//
// This is the ONLY file in the sample that talks to the engine (`cc`). It is a
// thin adapter: it builds a 2D Canvas/Camera at runtime, reads the viewport to
// choose orientation (never hardcoded vertical), forwards input + dt into the
// engine-neutral BulletHellCore, and renders the core's snapshot with a single
// Graphics node plus Labels. All simulation/authority lives in game-core.ts,
// which in turn reuses the real product modules under assets/modules/.

import {
  _decorator,
  Component,
  Node,
  Canvas,
  Camera,
  UITransform,
  Graphics,
  Label,
  Color,
  view,
  screen,
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

@ccclass("CocosShooterHost")
export class CocosShooterHost extends Component {
  private core!: BulletHellCore;
  private graphics!: Graphics;
  private hud!: Label;
  private banner!: Label;
  private fieldW = 0;
  private fieldH = 0;
  private crossInput = 0;

  onLoad() {
    // -- viewport → orientation (parameterized, not hardcoded) --------------
    const size = screen.windowSize;
    const orientation: Orientation =
      size.height >= size.width ? "portrait" : "landscape";

    // Design field mirrors the visible size so gameplay fills the screen.
    const vs = view.getVisibleSize();
    this.fieldW = vs.width;
    this.fieldH = vs.height;

    // -- build the 2D scene graph at runtime --------------------------------
    this.#ensureCanvasAndCamera();

    const playfield = new Node("Playfield");
    playfield.layer = Layers.Enum.UI_2D;
    playfield.setParent(this.node);
    const pfUi = playfield.addComponent(UITransform);
    pfUi.setContentSize(this.fieldW, this.fieldH);
    pfUi.setAnchorPoint(0, 0);
    playfield.setPosition(-this.fieldW / 2, -this.fieldH / 2, 0);
    this.graphics = playfield.addComponent(Graphics);

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
    const g = this.graphics;
    g.clear();
    for (const item of snap.items) {
      const c = this.#colorFor(item.kind);
      g.fillColor = c;
      g.circle(item.pos.x, item.pos.y, item.radius);
      g.fill();
    }
    this.hud.string =
      `HP ${snap.playerHp}   SCORE ${snap.score}   ` +
      `LEFT ${snap.enemiesRemaining}   BULLETS ${snap.activeBullets}`;
    if (snap.state === "won") this.banner.string = "YOU WIN";
    else if (snap.state === "lost") this.banner.string = "GAME OVER";
    else this.banner.string = "";
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
