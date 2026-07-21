import { describe, expect, it } from "vitest";

import {
  BATCH1_DEFAULT_DAMAGE_PROFILE,
  BATCH1_MODULE_DEFINITIONS,
} from "../../src/modules/batch1-gameplay-library.js";
import { BATCH1_VERTICAL_SLICE_ASSEMBLY } from "../../src/modules/batch1-vertical-slice.js";
import { GameModuleManifestV13Schema } from "../../src/modules/game-module-contract.js";
import { GameModuleRegistry } from "../../src/modules/game-module-registry.js";
import {
  ModuleResolutionError,
  ModuleResolutionErrorCode,
  resolveGameAssemblyV13,
} from "../../src/modules/game-module-resolver.js";

function v13(
  source: (typeof BATCH1_MODULE_DEFINITIONS)[number]["manifest"],
  overrides: Record<string, unknown>,
) {
  return GameModuleManifestV13Schema.parse({
    ...structuredClone(source),
    schemaVersion: "1.3.0",
    actorSnapshotReads: [],
    entityChannelReads: [],
    projectileChannelConsumer: null,
    attackChannel: null,
    preparedEffectCommit: null,
    modifierTargets: [],
    pickupEffectPlanTransform: null,
    ...overrides,
  });
}

function splitLineageFixture() {
  const deliveryDefinition = BATCH1_MODULE_DEFINITIONS.find(
    (entry) => entry.manifest.moduleId === "delivery.projectile",
  )!;
  const contactDefinition = BATCH1_MODULE_DEFINITIONS.find(
    (entry) => entry.manifest.moduleId === "interaction.projectile-contact",
  )!;
  const resolutionDefinition = BATCH1_MODULE_DEFINITIONS.find(
    (entry) => entry.manifest.moduleId === "interaction.contact-resolution",
  )!;
  const capability = {
    id: "delivery.projectile-channel",
    version: "1.0.0",
    scope: "assembly",
  } as const;
  const delivery = v13(deliveryDefinition.manifest, {
    version: "1.1.0",
    provides: [...deliveryDefinition.manifest.provides, capability],
  });
  const contact = v13(contactDefinition.manifest, {
    version: "1.1.0",
    requires: [
      {
        id: capability.id,
        versionRange: capability.version,
        cardinality: "exactly-one",
        scope: "assembly",
      },
    ],
    dependencies: [
      {
        moduleId: delivery.moduleId,
        versionRange: delivery.version,
        optional: false,
        scope: "assembly",
      },
    ],
    projectileChannelConsumer: {
      role: "contact-detector",
      sourceChannelInputPort: "sources",
      candidateOutputPort: "candidate",
      requiredCapability: "delivery.projectile-channel@1.0.0",
      sourceEntityRole: "projectile",
    },
  });
  const resolution = v13(resolutionDefinition.manifest, {
    version: "1.1.0",
    dependencies: [
      {
        moduleId: contact.moduleId,
        versionRange: contact.version,
        optional: false,
        scope: "owner",
      },
    ],
  });
  const decoySource = structuredClone(deliveryDefinition.manifest) as Record<
    string,
    unknown
  >;
  delete decoySource.projectileDelivery;
  const decoy = v13(decoySource as typeof deliveryDefinition.manifest, {
    moduleId: "delivery.split-mutation-source",
    implementationId: "delivery.split-mutation-source.v1",
    configurationSchemaId: "delivery.split-mutation-source.config",
    provides: [],
    requires: [],
    inputPorts: [],
    dependencies: [],
    assetRequirements: [],
    exclusiveOwnership: [],
  });

  const registry = new GameModuleRegistry();
  for (const definition of BATCH1_MODULE_DEFINITIONS) {
    if (
      definition === deliveryDefinition ||
      definition === contactDefinition ||
      definition === resolutionDefinition
    )
      continue;
    registry.register(definition.manifest, definition.configurationSchema);
  }
  registry.register(delivery, deliveryDefinition.configurationSchema);
  registry.register(contact, contactDefinition.configurationSchema);
  registry.register(resolution, resolutionDefinition.configurationSchema);
  registry.register(decoy, deliveryDefinition.configurationSchema);
  registry.registerContactPolicyProfile(BATCH1_DEFAULT_DAMAGE_PROFILE);

  const assembly = {
    ...structuredClone(BATCH1_VERTICAL_SLICE_ASSEMBLY),
    schemaVersion: "1.2.0",
    modules: structuredClone(BATCH1_VERTICAL_SLICE_ASSEMBLY.modules).map(
      (request) => {
        if (request.moduleId === delivery.moduleId)
          return { ...request, versionRange: delivery.version };
        if (request.moduleId === contact.moduleId)
          return { ...request, versionRange: contact.version };
        if (request.moduleId === resolution.moduleId)
          return { ...request, versionRange: resolution.version };
        return request;
      },
    ),
    effectApplicationBindings: [],
    pickupEffectPlanSelections: [],
    globalBudget: {
      activeEntities: 1024,
      activeProjectiles: 1024,
      spawnsPerSecond: 1024,
      timers: 1024,
    },
  };
  assembly.modules.push({
    instanceId: "split-mutation-source",
    moduleId: decoy.moduleId,
    versionRange: decoy.version,
    ownerId: "player-one",
    configuration: structuredClone(
      assembly.modules.find((entry) => entry.instanceId === "delivery")!
        .configuration,
    ),
  });
  for (const binding of assembly.bindings) {
    if (
      binding.from.instanceId === "delivery" &&
      binding.from.portId === "projectiles" &&
      binding.to.instanceId === "resolver"
    )
      binding.from.instanceId = "split-mutation-source";
  }
  return { registry, assembly };
}

describe("ADR 0027 projectile candidate/mutation lineage split", () => {
  it("rejects mutation authority split from the capability-backed candidate channel", () => {
    const { registry, assembly } = splitLineageFixture();
    try {
      resolveGameAssemblyV13(assembly, registry);
      throw new Error("expected split projectile lineage rejection");
    } catch (error) {
      expect(error).toBeInstanceOf(ModuleResolutionError);
      expect((error as ModuleResolutionError).code).toBe(
        ModuleResolutionErrorCode.invalidContactLineage,
      );
    }
  });
});
