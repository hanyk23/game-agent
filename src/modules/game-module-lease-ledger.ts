import type { RuntimeLeaseCeilings } from "./game-module-contract.js";

export const GameModuleLeaseLedgerErrorCode = {
  invalidDeclaration: "invalid-declaration",
  destroyed: "destroyed",
  invalidScope: "invalid-scope",
  unknownOwner: "unknown-owner",
  unknownKey: "unknown-key",
  duplicateActiveKey: "duplicate-active-key",
  ceilingExceeded: "ceiling-exceeded",
  unknownLease: "unknown-lease",
  leaseMismatch: "lease-mismatch",
  leakDetected: "leak-detected",
} as const;

export type GameModuleLeaseLedgerErrorCode =
  (typeof GameModuleLeaseLedgerErrorCode)[keyof typeof GameModuleLeaseLedgerErrorCode];

export class GameModuleLeaseLedgerError extends Error {
  constructor(
    readonly code: GameModuleLeaseLedgerErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "GameModuleLeaseLedgerError";
  }
}

export type GameModuleLeaseScope = "start" | "instance" | "graph";

export type GameModuleLeaseKeys = Readonly<
  Record<GameModuleLeaseScope, readonly string[]>
>;

export type GameModuleLeaseOwnerDeclaration = Readonly<{
  ownerId: string;
  ceilings: RuntimeLeaseCeilings;
  keys: GameModuleLeaseKeys;
}>;

export type GameModuleLease = Readonly<{
  leaseId: string;
  ownerId: string;
  scope: GameModuleLeaseScope;
  key: string;
}>;

export type GameModuleLeaseCounts = Readonly<
  Record<GameModuleLeaseScope, number>
>;

export type GameModuleLeaseOwnerSnapshot = Readonly<{
  ownerId: string;
  ceilings: RuntimeLeaseCeilings;
  counts: GameModuleLeaseCounts;
  activeLeases: readonly GameModuleLease[];
}>;

export type GameModuleLeaseScopeSnapshot = Readonly<{
  scope: GameModuleLeaseScope;
  count: number;
  activeLeases: readonly GameModuleLease[];
}>;

export type GameModuleLeaseLedgerSnapshot = Readonly<{
  counts: GameModuleLeaseCounts;
  activeLeases: readonly GameModuleLease[];
  owners: readonly GameModuleLeaseOwnerSnapshot[];
}>;

export type GameModuleLeaseLeakFilter = Readonly<{
  ownerId?: string;
  scope?: GameModuleLeaseScope;
}>;

type OwnerRecord = Readonly<{
  ceilings: RuntimeLeaseCeilings;
  keys: Readonly<Record<GameModuleLeaseScope, ReadonlySet<string>>>;
}>;

const scopes = ["start", "instance", "graph"] as const;

const ceilingField = {
  start: "startLeases",
  instance: "instanceLeases",
  graph: "graphLeases",
} as const satisfies Record<GameModuleLeaseScope, keyof RuntimeLeaseCeilings>;

function fail(code: GameModuleLeaseLedgerErrorCode, message: string): never {
  throw new GameModuleLeaseLedgerError(code, message);
}

function zeroCounts(): Record<GameModuleLeaseScope, number> {
  return { start: 0, instance: 0, graph: 0 };
}

function freezeCounts(
  counts: Readonly<Record<GameModuleLeaseScope, number>>,
): GameModuleLeaseCounts {
  return Object.freeze({ ...counts });
}

function freezeCeilings(ceilings: RuntimeLeaseCeilings): RuntimeLeaseCeilings {
  return Object.freeze({ ...ceilings });
}

function validateIdentifier(value: string, field: string): void {
  if (value.length === 0 || value.trim() !== value) {
    fail(
      GameModuleLeaseLedgerErrorCode.invalidDeclaration,
      `${field} must be a non-empty trimmed string`,
    );
  }
}

export class DeterministicGameModuleLeaseLedger {
  readonly #owners = new Map<string, OwnerRecord>();
  readonly #activeById = new Map<string, GameModuleLease>();
  readonly #activeIdByKey = new Map<string, string>();
  readonly #countsByOwner = new Map<
    string,
    Record<GameModuleLeaseScope, number>
  >();
  #nextLeaseSequence = 1;
  #destroyed = false;

  constructor(declarations: readonly GameModuleLeaseOwnerDeclaration[]) {
    for (const declaration of declarations) {
      validateIdentifier(declaration.ownerId, "ownerId");
      if (this.#owners.has(declaration.ownerId)) {
        fail(
          GameModuleLeaseLedgerErrorCode.invalidDeclaration,
          `duplicate lease owner: ${declaration.ownerId}`,
        );
      }
      for (const scope of scopes) {
        const ceiling = declaration.ceilings[ceilingField[scope]];
        if (!Number.isInteger(ceiling) || ceiling < 0 || ceiling > 10_000) {
          fail(
            GameModuleLeaseLedgerErrorCode.invalidDeclaration,
            `${declaration.ownerId}.${ceilingField[scope]} must be an integer from 0 through 10000`,
          );
        }
      }
      const declaredKeys: Record<GameModuleLeaseScope, ReadonlySet<string>> = {
        start: new Set(),
        instance: new Set(),
        graph: new Set(),
      };
      for (const scope of scopes) {
        const keys = new Set<string>();
        for (const key of declaration.keys[scope]) {
          validateIdentifier(key, `${declaration.ownerId}.${scope} key`);
          if (keys.has(key)) {
            fail(
              GameModuleLeaseLedgerErrorCode.invalidDeclaration,
              `duplicate declared ${scope} key for ${declaration.ownerId}: ${key}`,
            );
          }
          keys.add(key);
        }
        declaredKeys[scope] = keys;
      }
      this.#owners.set(
        declaration.ownerId,
        Object.freeze({
          ceilings: freezeCeilings(declaration.ceilings),
          keys: Object.freeze(declaredKeys),
        }),
      );
      this.#countsByOwner.set(declaration.ownerId, zeroCounts());
    }
  }

  acquire(
    ownerId: string,
    scope: GameModuleLeaseScope,
    key: string,
  ): GameModuleLease {
    this.#requireAlive();
    this.#requireScope(scope);
    const owner = this.#requireOwner(ownerId);
    if (!owner.keys[scope].has(key)) {
      fail(
        GameModuleLeaseLedgerErrorCode.unknownKey,
        `undeclared ${scope} lease key for ${ownerId}: ${key}`,
      );
    }
    const activeKey = this.#activeKey(ownerId, scope, key);
    if (this.#activeIdByKey.has(activeKey)) {
      fail(
        GameModuleLeaseLedgerErrorCode.duplicateActiveKey,
        `${ownerId}.${scope}.${key} already has an active lease`,
      );
    }
    const counts = this.#countsByOwner.get(ownerId)!;
    const ceiling = owner.ceilings[ceilingField[scope]];
    if (counts[scope] >= ceiling) {
      fail(
        GameModuleLeaseLedgerErrorCode.ceilingExceeded,
        `${ownerId}.${scope} lease ceiling ${ceiling} exceeded`,
      );
    }

    const lease = Object.freeze({
      leaseId: `lease-${this.#nextLeaseSequence.toString().padStart(8, "0")}`,
      ownerId,
      scope,
      key,
    });
    this.#nextLeaseSequence += 1;
    this.#activeById.set(lease.leaseId, lease);
    this.#activeIdByKey.set(activeKey, lease.leaseId);
    counts[scope] += 1;
    return lease;
  }

  release(lease: GameModuleLease): void {
    this.#requireAlive();
    const active = this.#activeById.get(lease.leaseId);
    if (active === undefined) {
      fail(
        GameModuleLeaseLedgerErrorCode.unknownLease,
        `lease is not active: ${lease.leaseId}`,
      );
    }
    if (
      active.ownerId !== lease.ownerId ||
      active.scope !== lease.scope ||
      active.key !== lease.key
    ) {
      fail(
        GameModuleLeaseLedgerErrorCode.leaseMismatch,
        `lease identity does not match active lease: ${lease.leaseId}`,
      );
    }

    const counts = this.#countsByOwner.get(active.ownerId)!;
    if (counts[active.scope] <= 0) {
      fail(
        GameModuleLeaseLedgerErrorCode.leaseMismatch,
        `inconsistent ${active.scope} accounting for ${active.ownerId}`,
      );
    }
    this.#activeById.delete(active.leaseId);
    this.#activeIdByKey.delete(
      this.#activeKey(active.ownerId, active.scope, active.key),
    );
    counts[active.scope] -= 1;
  }

  releaseAll(
    filter: GameModuleLeaseLeakFilter = {},
  ): readonly GameModuleLease[] {
    this.#requireAlive();
    if (filter.ownerId !== undefined) {
      this.#requireOwner(filter.ownerId);
    }
    if (filter.scope !== undefined) {
      this.#requireScope(filter.scope);
    }
    const releases = [...this.#activeById.values()]
      .filter(
        (lease) =>
          (filter.ownerId === undefined || lease.ownerId === filter.ownerId) &&
          (filter.scope === undefined || lease.scope === filter.scope),
      )
      .reverse();
    for (const lease of releases) {
      this.release(lease);
    }
    return Object.freeze(releases);
  }

  snapshot(): GameModuleLeaseLedgerSnapshot {
    this.#requireAlive();
    const owners = [...this.#owners.keys()]
      .sort()
      .map((ownerId) => this.#snapshotOwner(ownerId));
    const counts = owners.reduce<Record<GameModuleLeaseScope, number>>(
      (total, owner) => {
        for (const scope of scopes) {
          total[scope] += owner.counts[scope];
        }
        return total;
      },
      zeroCounts(),
    );
    return Object.freeze({
      counts: freezeCounts(counts),
      activeLeases: Object.freeze([...this.#activeById.values()]),
      owners: Object.freeze(owners),
    });
  }

  snapshotOwner(ownerId: string): GameModuleLeaseOwnerSnapshot {
    this.#requireAlive();
    this.#requireOwner(ownerId);
    return this.#snapshotOwner(ownerId);
  }

  snapshotScope(scope: GameModuleLeaseScope): GameModuleLeaseScopeSnapshot {
    this.#requireAlive();
    this.#requireScope(scope);
    const activeLeases = [...this.#activeById.values()].filter(
      (lease) => lease.scope === scope,
    );
    return Object.freeze({
      scope,
      count: activeLeases.length,
      activeLeases: Object.freeze(activeLeases),
    });
  }

  assertNoLeaks(filter: GameModuleLeaseLeakFilter = {}): void {
    this.#requireAlive();
    if (filter.ownerId !== undefined) {
      this.#requireOwner(filter.ownerId);
    }
    if (filter.scope !== undefined) {
      this.#requireScope(filter.scope);
    }
    const leaks = [...this.#activeById.values()].filter(
      (lease) =>
        (filter.ownerId === undefined || lease.ownerId === filter.ownerId) &&
        (filter.scope === undefined || lease.scope === filter.scope),
    );
    if (leaks.length > 0) {
      fail(
        GameModuleLeaseLedgerErrorCode.leakDetected,
        `active lease leak(s): ${leaks.map((lease) => lease.leaseId).join(", ")}`,
      );
    }
  }

  destroy(): void {
    this.#requireAlive();
    this.assertNoLeaks();
    this.#destroyed = true;
  }

  #snapshotOwner(ownerId: string): GameModuleLeaseOwnerSnapshot {
    const owner = this.#owners.get(ownerId)!;
    const activeLeases = [...this.#activeById.values()].filter(
      (lease) => lease.ownerId === ownerId,
    );
    return Object.freeze({
      ownerId,
      ceilings: owner.ceilings,
      counts: freezeCounts(this.#countsByOwner.get(ownerId)!),
      activeLeases: Object.freeze(activeLeases),
    });
  }

  #requireAlive(): void {
    if (this.#destroyed) {
      fail(
        GameModuleLeaseLedgerErrorCode.destroyed,
        "lease ledger has been destroyed",
      );
    }
  }

  #requireOwner(ownerId: string): OwnerRecord {
    const owner = this.#owners.get(ownerId);
    if (owner === undefined) {
      fail(
        GameModuleLeaseLedgerErrorCode.unknownOwner,
        `unknown lease owner: ${ownerId}`,
      );
    }
    return owner;
  }

  #requireScope(scope: GameModuleLeaseScope): void {
    if (!scopes.includes(scope)) {
      fail(
        GameModuleLeaseLedgerErrorCode.invalidScope,
        `unknown lease scope: ${String(scope)}`,
      );
    }
  }

  #activeKey(
    ownerId: string,
    scope: GameModuleLeaseScope,
    key: string,
  ): string {
    return `${ownerId.length}:${ownerId}${scope.length}:${scope}${key.length}:${key}`;
  }
}
