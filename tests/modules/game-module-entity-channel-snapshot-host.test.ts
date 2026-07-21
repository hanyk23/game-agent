import { describe, expect, it } from "vitest";

import { DeterministicEntityChannelSnapshotHostV13 } from "../../src/modules/game-module-entity-channel-snapshot-host.js";
import type {
  ResolvedEntityChannelReadGrantV13,
  ResolvedModuleGraphV13,
} from "../../src/modules/game-module-resolver.js";

const channels = [
  {
    channelId: "enemy.projectiles",
    localChannelId: "projectiles",
    ownerInstanceId: "delivery",
    ownerActorId: "enemy-one",
    outputPort: "projectiles",
    entityRole: "projectile",
    capacity: 2,
    capacityResources: ["activeEntities", "activeProjectiles"],
    readerInstanceIds: ["graze"],
  },
] as unknown as ResolvedModuleGraphV13["entityChannels"];

const grant: ResolvedEntityChannelReadGrantV13 = {
  grantId: "graze/channel-read/projectiles",
  instanceId: "graze",
  channelId: "enemy.projectiles",
  maximumEntries: 2,
  descriptor: {
    readId: "projectiles",
    channelStateInputPort: "sources",
    sourceEntityRole: "projectile",
    targetActorRoles: ["player"],
    maximumEntriesSource: "resolved-channel-capacity",
    entryFields: ["entityId", "generation", "position", "active"],
    order: "entity-id-generation",
  },
};

describe("ADR 0027 entity channel snapshots", () => {
  it("returns bounded generation-aware entries with only granted fields", () => {
    const host = new DeterministicEntityChannelSnapshotHostV13(channels, [
      grant,
    ]);
    host.activate("delivery", "enemy.projectiles", {
      entityId: "bullet-b",
      generation: 0,
      position: { x: 2, y: 1 },
      collisionRadius: 2,
      active: true,
    });
    host.activate("delivery", "enemy.projectiles", {
      entityId: "bullet-a",
      generation: 0,
      position: { x: 1, y: 1 },
      collisionRadius: 2,
      active: true,
    });
    const snapshot = host.snapshot("graze", grant.grantId);
    expect(snapshot.map((entry) => entry.entityId)).toEqual([
      "bullet-a",
      "bullet-b",
    ]);
    expect(Object.keys(snapshot[0]!).sort()).toEqual(
      [...grant.descriptor.entryFields].sort(),
    );
  });

  it("rejects stale generation reuse and unauthorized readers", () => {
    const host = new DeterministicEntityChannelSnapshotHostV13(channels, [
      grant,
    ]);
    const entry = {
      entityId: "bullet-a",
      generation: 0,
      position: { x: 1, y: 1 },
      collisionRadius: 2,
      active: true,
    } as const;
    host.activate("delivery", "enemy.projectiles", entry);
    host.deactivate("delivery", "enemy.projectiles", "bullet-a", 0);
    expect(() => host.activate("delivery", "enemy.projectiles", entry)).toThrow(
      /strictly increasing/,
    );
    expect(() => host.snapshot("other", grant.grantId)).toThrow(/unauthorized/);
  });
});
