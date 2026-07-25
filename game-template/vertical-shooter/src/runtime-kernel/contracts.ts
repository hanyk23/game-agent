export type RuntimeVector = Readonly<{ x: number; y: number }>;

export type RuntimeDisposer = () => void;

export type RuntimePointer = Readonly<{
  id: number;
  isDown: boolean;
  worldX: number;
  worldY: number;
}>;

export interface RuntimeTimer {
  cancel(): void;
}

export type RuntimeSchedule = Readonly<{
  delayMs: number;
  repeat?: number;
  loop?: boolean;
  callback: () => void;
}>;

export interface RuntimeClock {
  nowMs(): number;
  schedule(schedule: RuntimeSchedule): RuntimeTimer;
}

export interface RuntimeEntityPool<TEntity> {
  readonly budgetKey: string;
  acquire(x: number, y: number, textureKey: string): TEntity | null;
  create(x: number, y: number, textureKey: string): TEntity;
  countActive(): number;
  forEach(visitor: (entity: TEntity) => void): void;
  clear(destroyChildren: boolean): void;
}

export interface RuntimeEntities<TEntity> {
  createSprite(x: number, y: number, textureKey: string): TEntity;
  createPool(budgetKey: string): RuntimeEntityPool<TEntity>;
}

export type RuntimeCollisionSource<TEntity> =
  TEntity | RuntimeEntityPool<TEntity>;

export interface RuntimeCollisions<TEntity> {
  watchOverlap(
    first: RuntimeCollisionSource<TEntity>,
    second: RuntimeCollisionSource<TEntity>,
    callback: (first: TEntity, second: TEntity) => void,
  ): RuntimeDisposer;
  overlapNow(
    first: RuntimeCollisionSource<TEntity>,
    second: RuntimeCollisionSource<TEntity>,
    callback: (first: TEntity, second: TEntity) => void,
  ): void;
  pause(): void;
}

export interface RuntimeInput {
  readDirection(): RuntimeVector;
  onPointerDown(listener: (pointer: RuntimePointer) => void): RuntimeDisposer;
  onPointerMove(listener: (pointer: RuntimePointer) => void): RuntimeDisposer;
  onPointerUp(listener: (pointer: RuntimePointer) => void): RuntimeDisposer;
}

export interface RuntimeText {
  setOrigin(x: number, y: number): RuntimeText;
  setText(text: string): RuntimeText;
  setVisible(visible: boolean): RuntimeText;
}

export type RuntimeTextStyle = Readonly<{
  color: string;
  fontFamily: string;
  fontSize: string;
}>;

export interface RuntimeRendering {
  createText(
    x: number,
    y: number,
    text: string,
    style: RuntimeTextStyle,
  ): RuntimeText;
  shakeCamera(durationMs: number, intensity: number): void;
}

export type RuntimeAssetSnapshot = Readonly<{
  expectedTextureKeys: readonly string[];
  loadedTextureKeys: readonly string[];
  usedTextureKeys: readonly string[];
}>;

export interface RuntimeAssets {
  markUsed(textureKey: string): void;
  snapshot(): RuntimeAssetSnapshot;
}

export type RuntimeBudgetSnapshot = Readonly<{
  limit: number;
  current: number;
  peak: number;
}>;

export interface RuntimeBudgets {
  limitFor(key: string): number;
  observe(key: string, current: number): void;
  snapshot(key: string): RuntimeBudgetSnapshot;
}

export interface RuntimeEventBus<
  TEvents extends Record<string, unknown> = Record<string, unknown>,
> {
  emit<TKey extends keyof TEvents>(event: TKey, payload: TEvents[TKey]): void;
  on<TKey extends keyof TEvents>(
    event: TKey,
    listener: (payload: TEvents[TKey]) => void,
  ): () => void;
}

export interface RuntimeObservation<TSnapshot> {
  registerReader(reader: () => TSnapshot): () => void;
}

export interface RuntimeLifecycle {
  onShutdown(dispose: () => void): RuntimeDisposer;
  startScene(sceneKey: string, data?: unknown): void;
}

export type RuntimeViewport = Readonly<{
  width: number;
  height: number;
  clampX(x: number): number;
  clampY(y: number): number;
}>;

export interface RuntimeKernel<TEntity, TSnapshot> {
  readonly lifecycle: RuntimeLifecycle;
  readonly clock: RuntimeClock;
  readonly entities: RuntimeEntities<TEntity>;
  readonly input: RuntimeInput;
  readonly rendering: RuntimeRendering;
  readonly collisions: RuntimeCollisions<TEntity>;
  readonly assets: RuntimeAssets;
  readonly events: RuntimeEventBus;
  readonly budgets: RuntimeBudgets;
  readonly observation: RuntimeObservation<TSnapshot>;
  readonly viewport: RuntimeViewport;
}
