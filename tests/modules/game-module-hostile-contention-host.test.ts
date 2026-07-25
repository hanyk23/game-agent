import { describe, expect, it } from "vitest";

import { HostileAggregateContentionHostV1 } from "../../src/modules/game-module-hostile-contention-host.js";
import { RuntimeKernelSessionQuarantineLedgerV12 } from "../../src/modules/game-module-runtime-abi-v12.js";
import { SafeMonotonicCounterError } from "../../src/modules/game-module-safe-counter.js";

function fixture(
  overrides: Partial<
    ConstructorParameters<typeof HostileAggregateContentionHostV1>[0]
  > = {},
) {
  let nowMs = 0;
  const session =
    overrides.session ?? new RuntimeKernelSessionQuarantineLedgerV12(16);
  const host = new HostileAggregateContentionHostV1({
    groupId: "hostile-main",
    orderedMemberInstanceIds: ["delivery-alpha", "delivery-beta"],
    activeEntityCapacity: 3,
    activeProjectileCapacity: 3,
    spawnsPerSecondCapacity: 6,
    nowMs: () => nowMs,
    session,
    ...overrides,
  });
  return { host, session, setNowMs: (value: number) => (nowMs = value) };
}

describe("ADR 0028 hostile aggregate contention host", () => {
  it("admits exact group capacity in resolved-provider order, not callback order", () => {
    const { host } = fixture();
    const result = host.admitFrame(0, [
      {
        memberInstanceId: "delivery-beta",
        requestSequence: 0,
        plannedProjectiles: 2,
      },
      {
        memberInstanceId: "delivery-alpha",
        requestSequence: 0,
        plannedProjectiles: 2,
      },
    ]);
    expect(result.map(({ memberInstanceId }) => memberInstanceId)).toEqual([
      "delivery-alpha",
      "delivery-beta",
    ]);
    expect(result[0]).toMatchObject({
      admittedTokenIds: [0, 1],
      droppedProjectiles: 0,
      dropCause: "none",
    });
    expect(result[1]).toMatchObject({
      admittedTokenIds: [2],
      droppedProjectiles: 1,
      dropCause: "active-entity-capacity",
    });
  });

  it("keeps member authority distinct while accounting one shared group", () => {
    const { host } = fixture();
    const [alpha, beta] = host.admitFrame(0, [
      {
        memberInstanceId: "delivery-alpha",
        requestSequence: 0,
        plannedProjectiles: 1,
      },
      {
        memberInstanceId: "delivery-beta",
        requestSequence: 0,
        plannedProjectiles: 1,
      },
    ]);
    const alphaToken = alpha!.admittedTokenIds[0]!;
    const betaToken = beta!.admittedTokenIds[0]!;
    host.commit("delivery-alpha", alphaToken, "alpha/projectile/0", 0);
    host.commit("delivery-beta", betaToken, "beta/projectile/0", 0);
    expect(() => host.release("delivery-alpha", betaToken)).toThrow(
      /authority\/state/,
    );
    expect(() =>
      host.quarantine(
        "delivery-alpha",
        alphaToken,
        "substituted/projectile",
        0,
        [],
      ),
    ).toThrow(/quarantine identity/);
    expect(host.snapshot()).toMatchObject({
      active: 2,
      retainedActiveEntities: 2,
      retainedActiveProjectiles: 2,
    });
    host.release("delivery-alpha", alphaToken);
    host.release("delivery-beta", betaToken);
  });

  it("reports the exact limiting group dimension", () => {
    const projectileLimited = fixture({
      activeEntityCapacity: 3,
      activeProjectileCapacity: 1,
    }).host.admitFrame(0, [
      {
        memberInstanceId: "delivery-alpha",
        requestSequence: 0,
        plannedProjectiles: 2,
      },
    ])[0]!;
    expect(projectileLimited).toMatchObject({
      droppedProjectiles: 1,
      dropCause: "active-projectile-capacity",
    });

    const rateLimited = fixture({
      activeEntityCapacity: 3,
      activeProjectileCapacity: 3,
      spawnsPerSecondCapacity: 1,
    }).host.admitFrame(0, [
      {
        memberInstanceId: "delivery-alpha",
        requestSequence: 0,
        plannedProjectiles: 2,
      },
    ])[0]!;
    expect(rateLimited).toMatchObject({
      droppedProjectiles: 1,
      dropCause: "spawn-rate-capacity",
    });
  });

  it("enforces the trailing 1,000-ms window and excludes rolled-back spawns", () => {
    const { host, setNowMs } = fixture({
      activeEntityCapacity: 2,
      activeProjectileCapacity: 2,
      spawnsPerSecondCapacity: 1,
    });
    const first = host.admitFrame(0, [
      {
        memberInstanceId: "delivery-alpha",
        requestSequence: 0,
        plannedProjectiles: 1,
      },
    ])[0]!.admittedTokenIds[0]!;
    host.rollback("delivery-alpha", first);
    const replacement = host.admitFrame(1, [
      {
        memberInstanceId: "delivery-beta",
        requestSequence: 0,
        plannedProjectiles: 1,
      },
    ])[0]!.admittedTokenIds[0]!;
    host.commit("delivery-beta", replacement, "beta/projectile/0", 0);
    host.release("delivery-beta", replacement);
    setNowMs(999);
    expect(
      host.admitFrame(2, [
        {
          memberInstanceId: "delivery-beta",
          requestSequence: 1,
          plannedProjectiles: 1,
        },
      ])[0],
    ).toMatchObject({
      admittedTokenIds: [],
      dropCause: "spawn-rate-capacity",
    });
    setNowMs(1_000);
    expect(
      host.admitFrame(3, [
        {
          memberInstanceId: "delivery-beta",
          requestSequence: 2,
          plannedProjectiles: 1,
        },
      ])[0]!.admittedTokenIds,
    ).toHaveLength(1);
  });

  it("retains group capacity in quarantine until cleanup succeeds", () => {
    const { host, session } = fixture({
      activeEntityCapacity: 1,
      activeProjectileCapacity: 1,
      spawnsPerSecondCapacity: 2,
    });
    const token = host.admitFrame(0, [
      {
        memberInstanceId: "delivery-alpha",
        requestSequence: 0,
        plannedProjectiles: 1,
      },
    ])[0]!.admittedTokenIds[0]!;
    host.quarantine("delivery-alpha", token, "alpha/projectile/0", 0, [
      "local-pool:alpha",
    ]);
    expect(host.snapshot()).toMatchObject({
      quarantined: 1,
      retainedActiveProjectiles: 1,
    });
    expect(session.size).toBe(1);
    expect(host.cleanupQuarantine(() => false).disposition).toBe("unresolved");
    expect(host.cleanupQuarantine(() => true).disposition).toBe("clean");
    expect(host.snapshot().retainedActiveProjectiles).toBe(0);
  });

  it("preflights token overflow and session capacity before changing state", () => {
    const session = new RuntimeKernelSessionQuarantineLedgerV12(1);
    const { host } = fixture({
      session,
      lastAllocatedTokenId: Number.MAX_SAFE_INTEGER,
    });
    expect(() =>
      host.admitFrame(0, [
        {
          memberInstanceId: "delivery-alpha",
          requestSequence: 0,
          plannedProjectiles: 1,
        },
      ]),
    ).toThrow(SafeMonotonicCounterError);
    const release = session.reserveActivation();
    release();
    expect(host.snapshot().retainedActiveProjectiles).toBe(0);
  });

  it("atomically rolls back partial session reservations", () => {
    const session = new RuntimeKernelSessionQuarantineLedgerV12(1);
    const { host } = fixture({ session });
    expect(() =>
      host.admitFrame(0, [
        {
          memberInstanceId: "delivery-alpha",
          requestSequence: 0,
          plannedProjectiles: 2,
        },
      ]),
    ).toThrow(/reservation exhausted/);
    expect(host.snapshot()).toMatchObject({
      prepared: 0,
      retainedActiveProjectiles: 0,
      rateWindowCount: 0,
    });
    const release = session.reserveActivation();
    release();
  });

  it("rejects stale frames, request sequences, unknown members, and active disposal", () => {
    const { host } = fixture();
    const token = host.admitFrame(0, [
      {
        memberInstanceId: "delivery-alpha",
        requestSequence: 0,
        plannedProjectiles: 1,
      },
    ])[0]!.admittedTokenIds[0]!;
    host.commit("delivery-alpha", token, "alpha/projectile/0", 0);
    expect(() => host.admitFrame(0, [])).toThrow(/frame sequence/);
    expect(() =>
      host.admitFrame(1, [
        {
          memberInstanceId: "delivery-alpha",
          requestSequence: 0,
          plannedProjectiles: 1,
        },
      ]),
    ).toThrow(/candidate/);
    expect(() => host.dispose()).toThrow(/retains active/);
    host.release("delivery-alpha", token);
    host.dispose();
    expect(() => host.snapshot()).toThrow(/disposed/);
  });
});
