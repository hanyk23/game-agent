import { describe, expect, it, vi } from "vitest";

import {
  ActorRootCustodyHostV1,
  type ActorRootActivationRequestV1,
} from "../../src/modules/game-module-actor-root-custody-host.js";
import { RuntimeKernelSessionQuarantineLedgerV12 } from "../../src/modules/game-module-runtime-abi-v12.js";
import { SafeMonotonicCounterError } from "../../src/modules/game-module-safe-counter.js";

const request: ActorRootActivationRequestV1 = Object.freeze({
  sourceId: "wave-scout",
  assetRole: "enemy",
  position: Object.freeze({ x: 10, y: 20 }),
  radius: 12,
  movement: Object.freeze({
    mode: "scrolling-wave-v1",
    velocity: Object.freeze({ x: 0, y: 1 }),
  }),
});

function fixture(
  overrides: Partial<
    ConstructorParameters<typeof ActorRootCustodyHostV1>[0]
  > = {},
) {
  let activeTokens = 0;
  const session =
    overrides.session ?? new RuntimeKernelSessionQuarantineLedgerV12(4);
  const adapter = {
    activatePhysical: vi.fn(),
    activateLogical: vi.fn(),
    deactivatePhysical: vi.fn(() => true),
    deactivateLogical: vi.fn(() => true),
    ...overrides.adapter,
  };
  const host = new ActorRootCustodyHostV1({
    producerInstanceId: "waves",
    rootChannelId: "enemy-roots",
    actorRole: "enemy",
    capacity: 2,
    session,
    reserveActiveEntity: () => {
      activeTokens += 1;
      let held = true;
      return () => {
        if (!held) return;
        held = false;
        activeTokens -= 1;
      };
    },
    adapter,
    ...overrides,
  });
  return { host, session, adapter, activeTokens: () => activeTokens };
}

describe("ADR 0028 actor-root custody host", () => {
  it("mints lowest-free-slot identities and strictly increasing generations", () => {
    const { host } = fixture();
    const first = host.activate(request);
    const second = host.activate(request);
    expect([first.actorId, second.actorId]).toEqual([
      "root/waves/0",
      "root/waves/1",
    ]);
    expect([first.actorGeneration, second.actorGeneration]).toEqual([0, 1]);
    host.deactivate(first, "offscreen");
    const reused = host.activate(request);
    expect(reused.actorId).toBe(first.actorId);
    expect(reused.actorGeneration).toBe(2);
    expect(() => host.deactivate(first, "stale-contact")).toThrow(/stale/);
  });

  it("accepts exact capacity and rejects one over before adapter mutation", () => {
    const { host, adapter, activeTokens } = fixture();
    host.activate(request);
    host.activate(request);
    expect(activeTokens()).toBe(2);
    expect(() => host.activate(request)).toThrow(/capacity exhausted/);
    expect(adapter.activatePhysical).toHaveBeenCalledTimes(2);
  });

  it("rejects wrong-role assets, non-finite geometry, and open movement data", () => {
    const { host, adapter } = fixture();
    for (const invalid of [
      { ...request, assetRole: "boss" },
      { ...request, position: { x: Number.NaN, y: 0 } },
      { ...request, movement: { ...request.movement, callback: "forbidden" } },
    ])
      expect(() =>
        host.activate(invalid as ActorRootActivationRequestV1),
      ).toThrow(/invalid actor-root activation request/);
    expect(adapter.activatePhysical).not.toHaveBeenCalled();
  });

  it("rolls back a determinate activation failure and releases every token", () => {
    const { host, adapter, activeTokens } = fixture({
      adapter: {
        activatePhysical: vi.fn(),
        activateLogical: vi.fn(() => {
          throw new Error("logical activation failed");
        }),
        deactivatePhysical: vi.fn(() => true),
        deactivateLogical: vi.fn(() => true),
      },
    });
    expect(() => host.activate(request)).toThrow(/activation failed/);
    expect(activeTokens()).toBe(0);
    expect(host.snapshot().roots).toEqual([]);
    expect(adapter.deactivatePhysical).toHaveBeenCalledOnce();
  });

  it("releases quarantine reservation when active-entity reservation fails", () => {
    const session = new RuntimeKernelSessionQuarantineLedgerV12(1);
    const { host, adapter } = fixture({
      session,
      reserveActiveEntity: () => {
        throw new Error("active entity grant exhausted");
      },
    });
    expect(() => host.activate(request)).toThrow(/active entity grant/);
    const release = session.reserveActivation();
    release();
    expect(adapter.activatePhysical).not.toHaveBeenCalled();
  });

  it("retains slot and active token in quarantine until cleanup proves inactivity", () => {
    let cleanupAllowed = false;
    const { host, session, activeTokens } = fixture({
      adapter: {
        activatePhysical: vi.fn(),
        activateLogical: vi.fn(),
        deactivatePhysical: vi.fn(() => cleanupAllowed),
        deactivateLogical: vi.fn(() => true),
      },
    });
    const root = host.activate(request);
    expect(() => host.deactivate(root, "contact")).toThrow(/indeterminate/);
    expect(host.snapshot().roots[0]?.state).toBe("quarantined");
    expect(activeTokens()).toBe(1);
    expect(session.size).toBe(1);
    expect(host.cleanupQuarantine().disposition).toBe("unresolved");
    cleanupAllowed = true;
    expect(host.cleanupQuarantine().disposition).toBe("clean");
    expect(activeTokens()).toBe(0);
    expect(host.snapshot().roots).toEqual([]);
  });

  it("quarantines an indeterminate activation rollback without reusing its slot", () => {
    const { host, session, activeTokens } = fixture({
      adapter: {
        activatePhysical: vi.fn(),
        activateLogical: vi.fn(() => {
          throw new Error("logical activation failed");
        }),
        deactivatePhysical: vi.fn(() => false),
        deactivateLogical: vi.fn(() => true),
      },
    });
    expect(() => host.activate(request)).toThrow(/activation failed/);
    expect(host.snapshot().roots).toMatchObject([
      { state: "quarantined", reference: { slotIndex: 0 } },
    ]);
    expect(session.size).toBe(1);
    expect(activeTokens()).toBe(1);
  });

  it("preflights generation overflow before reserving or mutating", () => {
    const { host, adapter, activeTokens } = fixture({
      lastAllocatedGeneration: Number.MAX_SAFE_INTEGER,
    });
    expect(() => host.activate(request)).toThrow(SafeMonotonicCounterError);
    expect(activeTokens()).toBe(0);
    expect(adapter.activatePhysical).not.toHaveBeenCalled();
  });

  it("disposes active roots in reverse slot order and rejects use afterward", () => {
    const order: string[] = [];
    const { host } = fixture({
      adapter: {
        activatePhysical: vi.fn(),
        activateLogical: vi.fn(),
        deactivatePhysical: vi.fn((reference) => {
          order.push(reference.actorId);
          return true;
        }),
        deactivateLogical: vi.fn(() => true),
      },
    });
    host.activate(request);
    host.activate(request);
    host.dispose();
    expect(order).toEqual(["root/waves/1", "root/waves/0"]);
    expect(() => host.activate(request)).toThrow(/disposed/);
  });
});
