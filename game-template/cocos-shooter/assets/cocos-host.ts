// =============================================================================
// TEMPLATE PLACEHOLDER — cocos-host.ts
// =============================================================================
// Cocos 3.8.7 host adapter skeleton for the output template. This is the ONLY
// file that talks to the engine (`cc`). It is intentionally minimal: it reads
// the BUILD-INJECTED orientation, sets a fixed design resolution (letterboxed,
// never stretched), builds a 2D Canvas/Camera, and drives the engine-neutral
// BulletHellCore each frame. It renders NOTHING yet — the generator fills the
// rendering (sprites, HUD, input mapping) alongside the kernel simulation.
//
// GENERATOR FILL POINT: add sprite/graphics rendering of core.snapshot(),
// input mapping, HUD/banner, and any orientation-dependent visuals. Keep the
// orientation read (settings.querySettings) and the fixed-resolution/SHOW_ALL
// policy — those are framework-layer invariants, not content.
// =============================================================================

import {
  _decorator,
  Component,
  Node,
  Canvas,
  Camera,
  UITransform,
  Color,
  view,
  ResolutionPolicy,
  settings,
  SettingsCategory,
  Layers,
} from "cc";
import { BulletHellCore, type Orientation } from "./game-core";

const { ccclass } = _decorator;

// Fixed design resolutions per orientation. The game runs at a FIXED aspect
// ratio and is never stretched to fill the window: ResolutionPolicy.SHOW_ALL
// letterboxes with black bars when the window aspect differs. These are
// placeholder skeleton values; the generator supplies the real field size.
const DESIGN: Record<Orientation, { w: number; h: number }> = {
  portrait: { w: 720, h: 1280 },
  landscape: { w: 1280, h: 720 },
};

@ccclass("CocosShooterTemplateHost")
export class CocosShooterTemplateHost extends Component {
  private core!: BulletHellCore;
  private fieldW = 0;
  private fieldH = 0;

  onLoad() {
    // -- orientation: read the BUILD-INJECTED value (never the live window) ---
    // settings.json screen.orientation is written by the headless build
    // (packages.web-mobile.orientation). Reading it here is what makes portrait
    // and landscape builds diverge at runtime.
    const injected = settings.querySettings<string>(
      SettingsCategory.SCREEN,
      "orientation",
    );
    const orientation: Orientation =
      injected === "landscape" ? "landscape" : "portrait";

    // Fixed design resolution + SHOW_ALL: letterboxed, never stretched.
    const design = DESIGN[orientation];
    this.fieldW = design.w;
    this.fieldH = design.h;
    view.setDesignResolutionSize(
      this.fieldW,
      this.fieldH,
      ResolutionPolicy.SHOW_ALL,
    );

    this.#ensureCanvasAndCamera();

    // -- create the engine-neutral core -------------------------------------
    // GENERATOR FILL POINT: pass generated gameplay config (enemy budget, hp,
    // speeds, seed, ...) here. fieldWidth/fieldHeight are the placeholder
    // skeleton values above; the generator will replace them with real values.
    this.core = new BulletHellCore({
      orientation,
      fieldWidth: this.fieldW,
      fieldHeight: this.fieldH,
    });
  }

  update(dt: number) {
    // Drive the kernel; the placeholder does not render its snapshot yet.
    // Clamp dt so a stalled first frame cannot blow past the simulation step.
    this.core.step(Math.min(dt, 1 / 30), {});
    // GENERATOR FILL POINT: render this.core.snapshot() (sprites/HUD/banner).
    void this.core.snapshot();
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
    ui.setContentSize(this.fieldW, this.fieldH);
    const canvas = this.node.addComponent(Canvas);
    canvas.cameraComponent = cam;
    canvas.alignCanvasWithScreen = true;
    this.node.layer = Layers.Enum.UI_2D;
  }
}
