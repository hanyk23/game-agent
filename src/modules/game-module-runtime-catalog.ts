import type { ContactPolicyRuntimeRegistry } from "./game-module-contact-policy-host.js";
import type { ProductionModuleExecutionRegistry } from "./game-module-runtime-factory.js";
import type {
  ResolvedModuleGraphV12,
  ResolvedModuleGraphV13,
} from "./game-module-resolver.js";

type RuntimeRegistration = Exclude<
  ReturnType<ContactPolicyRuntimeRegistry["findExactProduction"]>,
  undefined
>;
type RuntimePolicyProfile = Exclude<
  ReturnType<ContactPolicyRuntimeRegistry["findContactPolicyProfile"]>,
  undefined
>;

export type BrowserGameModuleRuntimeCatalogInput = Readonly<{
  registrations: readonly RuntimeRegistration[];
  contactPolicyProfiles?: readonly RuntimePolicyProfile[];
}>;

function deepFreeze<T>(value: T): Readonly<T> {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) {
      deepFreeze(child);
    }
  }
  return value;
}

function registrationKey(
  moduleId: string,
  version: string,
  envelopeSha256: string,
): string {
  return `${moduleId.length}:${moduleId}${version.length}:${version}${envelopeSha256}`;
}

function profileKey(profileId: string, version: string): string {
  return `${profileId.length}:${profileId}${version.length}:${version}`;
}

/**
 * Browser-only view of Node-admitted production artifacts. It never hashes or
 * validates bundle bytes; it only preserves the exact identities already
 * sealed into the resolved graph and reviewed executable exports.
 */
export class BrowserGameModuleRuntimeCatalog
  implements ProductionModuleExecutionRegistry, ContactPolicyRuntimeRegistry
{
  readonly #registrations = new Map<string, RuntimeRegistration>();
  readonly #profiles = new Map<string, RuntimePolicyProfile>();

  constructor(input: BrowserGameModuleRuntimeCatalogInput) {
    for (const registration of input.registrations) {
      const { manifest, executionExports } = registration;
      if (
        manifest.schemaVersion !== "1.1.0" ||
        executionExports === undefined ||
        manifest.implementationId !== executionExports.implementationId ||
        executionExports.artifactEnvelopeSha256.length !== 64 ||
        !/^[a-f0-9]{64}$/.test(executionExports.artifactEnvelopeSha256)
      ) {
        throw new Error(
          `invalid browser runtime registration: ${manifest.moduleId}@${manifest.version}`,
        );
      }
      const key = registrationKey(
        manifest.moduleId,
        manifest.version,
        executionExports.artifactEnvelopeSha256,
      );
      if (this.#registrations.has(key)) {
        throw new Error(
          `duplicate browser runtime registration: ${manifest.moduleId}@${manifest.version}`,
        );
      }
      this.#registrations.set(key, deepFreeze(registration));
    }
    for (const profile of input.contactPolicyProfiles ?? []) {
      if (
        profile.schemaVersion !== "1.0.0" ||
        profile.evidenceHash.length !== 64 ||
        !/^[a-f0-9]{64}$/.test(profile.evidenceHash) ||
        profile.orderedPolicies.length > profile.maxDepth
      ) {
        throw new Error(
          `invalid browser runtime policy profile: ${profile.profileId}@${profile.version}`,
        );
      }
      const key = profileKey(profile.profileId, profile.version);
      if (this.#profiles.has(key)) {
        throw new Error(
          `duplicate browser runtime policy profile: ${profile.profileId}@${profile.version}`,
        );
      }
      this.#profiles.set(key, deepFreeze(profile));
    }
  }

  findExactProduction(
    moduleId: string,
    version: string,
    envelopeSha256: string,
  ): RuntimeRegistration | undefined {
    return this.#registrations.get(
      registrationKey(moduleId, version, envelopeSha256),
    );
  }

  findContactPolicyProfile(
    profileId: string,
    version: string,
  ): RuntimePolicyProfile | undefined {
    return this.#profiles.get(profileKey(profileId, version));
  }
}

export type BrowserRuntimeCatalogEntryV12 = Readonly<{
  moduleId: string;
  version: string;
  envelopeSha256: string;
  implementationId: string;
  exportKind: "lifecycle-create-v1" | "contact-policy-transform-v1";
  entryEvidenceId: string;
  executable: (...args: readonly unknown[]) => unknown;
}>;

/** Deeply frozen generated browser catalog. It has no registration/mint API. */
export class BrowserGameModuleRuntimeCatalogV12 {
  readonly catalogEvidenceId: string;
  readonly #entries: ReadonlyMap<string, BrowserRuntimeCatalogEntryV12>;
  constructor(
    input: Readonly<{
      catalogEvidenceId: string;
      entries: readonly BrowserRuntimeCatalogEntryV12[];
    }>,
  ) {
    if (!/^[a-f0-9]{64}$/.test(input.catalogEvidenceId))
      throw new Error("invalid catalog evidence ID");
    const entries = new Map<string, BrowserRuntimeCatalogEntryV12>();
    for (const entry of input.entries) {
      if (
        !/^[a-f0-9]{64}$/.test(entry.envelopeSha256) ||
        !/^[a-f0-9]{64}$/.test(entry.entryEvidenceId) ||
        typeof entry.executable !== "function"
      ) {
        throw new Error(
          `invalid runtime catalog entry: ${entry.moduleId}@${entry.version}`,
        );
      }
      const key = registrationKey(
        entry.moduleId,
        entry.version,
        entry.envelopeSha256,
      );
      if (entries.has(key))
        throw new Error(
          `duplicate runtime catalog entry: ${entry.moduleId}@${entry.version}`,
        );
      entries.set(key, deepFreeze({ ...entry }));
    }
    this.catalogEvidenceId = input.catalogEvidenceId;
    this.#entries = entries;
    Object.freeze(this);
  }
  findForGraph(
    graph: ResolvedModuleGraphV12,
    instanceId: string,
  ): BrowserRuntimeCatalogEntryV12 {
    if (
      graph.executionReadiness.status !== "ready" ||
      graph.catalogEvidenceId !== this.catalogEvidenceId ||
      graph.executionReadiness.evidenceId.length !== 64
    ) {
      throw new Error("Graph 1.2 readiness/catalog evidence mismatch");
    }
    const module = graph.modules.find(
      (candidate) => candidate.instanceId === instanceId,
    );
    if (
      module === undefined ||
      module.artifactIdentity === undefined ||
      module.catalogEntryEvidenceId === undefined
    )
      throw new Error(`graph instance is not executable: ${instanceId}`);
    const entry = this.#entries.get(
      registrationKey(
        module.moduleId,
        module.version,
        module.artifactIdentity.envelopeSha256,
      ),
    );
    if (
      entry === undefined ||
      entry.entryEvidenceId !== module.catalogEntryEvidenceId ||
      entry.implementationId !== module.implementationId
    ) {
      throw new Error(`runtime catalog drift for ${instanceId}`);
    }
    return entry;
  }
}

export type BrowserRuntimeCatalogEntryV13 = Omit<
  BrowserRuntimeCatalogEntryV12,
  "exportKind"
> &
  Readonly<{
    manifestSchemaVersion: "1.2.0" | "1.3.0";
    exportKind:
      | "lifecycle-create-v1"
      | "contact-policy-transform-v1"
      | "pickup-effect-plan-transform-v1";
  }>;

/** Graph 1.3 catalog keeps the admitted manifest/context version explicit. */
export class BrowserGameModuleRuntimeCatalogV13 {
  readonly catalogEvidenceId: string;
  readonly #entries: ReadonlyMap<string, BrowserRuntimeCatalogEntryV13>;
  constructor(
    input: Readonly<{
      catalogEvidenceId: string;
      entries: readonly BrowserRuntimeCatalogEntryV13[];
    }>,
  ) {
    if (!/^[a-f0-9]{64}$/.test(input.catalogEvidenceId))
      throw new Error("invalid Graph 1.3 catalog evidence ID");
    const entries = new Map<string, BrowserRuntimeCatalogEntryV13>();
    for (const entry of input.entries) {
      if (
        !/^[a-f0-9]{64}$/.test(entry.envelopeSha256) ||
        !/^[a-f0-9]{64}$/.test(entry.entryEvidenceId) ||
        !["1.2.0", "1.3.0"].includes(entry.manifestSchemaVersion) ||
        typeof entry.executable !== "function"
      )
        throw new Error(
          `invalid Graph 1.3 catalog entry: ${entry.moduleId}@${entry.version}`,
        );
      const key = registrationKey(
        entry.moduleId,
        entry.version,
        entry.envelopeSha256,
      );
      if (entries.has(key))
        throw new Error(
          `duplicate Graph 1.3 catalog entry: ${entry.moduleId}@${entry.version}`,
        );
      entries.set(key, deepFreeze({ ...entry }));
    }
    this.catalogEvidenceId = input.catalogEvidenceId;
    this.#entries = entries;
    Object.freeze(this);
  }

  findForGraph(
    graph: ResolvedModuleGraphV13,
    instanceId: string,
  ): BrowserRuntimeCatalogEntryV13 {
    if (
      graph.graphVersion !== "1.3.0" ||
      graph.executionReadiness.status !== "ready" ||
      graph.catalogEvidenceId !== this.catalogEvidenceId ||
      !/^[a-f0-9]{64}$/.test(graph.executionReadiness.evidenceId)
    )
      throw new Error("Graph 1.3 readiness/catalog evidence mismatch");
    const module = graph.modules.find(
      (candidate) => candidate.instanceId === instanceId,
    );
    if (
      module === undefined ||
      module.artifactIdentity === undefined ||
      module.catalogEntryEvidenceId === undefined
    )
      throw new Error(`Graph 1.3 instance is not executable: ${instanceId}`);
    const entry = this.#entries.get(
      registrationKey(
        module.moduleId,
        module.version,
        module.artifactIdentity.envelopeSha256,
      ),
    );
    if (
      entry === undefined ||
      entry.entryEvidenceId !== module.catalogEntryEvidenceId ||
      entry.implementationId !== module.implementationId ||
      entry.manifestSchemaVersion !== module.manifestSchemaVersion
    )
      throw new Error(`Graph 1.3 runtime catalog drift for ${instanceId}`);
    return entry;
  }
}

export type BrowserRuntimeCatalogEntryV14 = Omit<
  BrowserRuntimeCatalogEntryV13,
  "manifestSchemaVersion"
> &
  Readonly<{
    manifestSchemaVersion: "1.2.0" | "1.3.0" | "1.4.0";
    factoryContextVersion: "1.2.0" | "1.3.0" | "1.4.0";
  }>;

export type BrowserResolvedModuleGraphV14 = Readonly<{
  graphVersion: "1.4.0";
  executionReadiness: Readonly<{
    status: "ready" | "blocked";
    evidenceId: string;
  }>;
  catalogEvidenceId?: string | undefined;
  modules: readonly Readonly<{
    instanceId: string;
    moduleId: string;
    version: string;
    implementationId: string;
    manifestSchemaVersion: "1.2.0" | "1.3.0" | "1.4.0";
    factoryContextVersion: "1.2.0" | "1.3.0" | "1.4.0";
    artifactIdentity?: Readonly<{ envelopeSha256: string }> | undefined;
    catalogEntryEvidenceId?: string | undefined;
  }>[];
}>;

/** Graph 1.4 catalog selects the exact frozen context version per manifest. */
export class BrowserGameModuleRuntimeCatalogV14 {
  readonly catalogEvidenceId: string;
  readonly #entries: ReadonlyMap<string, BrowserRuntimeCatalogEntryV14>;

  constructor(
    input: Readonly<{
      catalogEvidenceId: string;
      entries: readonly BrowserRuntimeCatalogEntryV14[];
    }>,
  ) {
    if (!/^[a-f0-9]{64}$/.test(input.catalogEvidenceId))
      throw new Error("invalid Graph 1.4 catalog evidence ID");
    const entries = new Map<string, BrowserRuntimeCatalogEntryV14>();
    for (const entry of input.entries) {
      if (
        !/^[a-f0-9]{64}$/.test(entry.envelopeSha256) ||
        !/^[a-f0-9]{64}$/.test(entry.entryEvidenceId) ||
        !["1.2.0", "1.3.0", "1.4.0"].includes(entry.manifestSchemaVersion) ||
        entry.factoryContextVersion !== entry.manifestSchemaVersion ||
        typeof entry.executable !== "function"
      )
        throw new Error(
          `invalid Graph 1.4 catalog entry: ${entry.moduleId}@${entry.version}`,
        );
      const key = registrationKey(
        entry.moduleId,
        entry.version,
        entry.envelopeSha256,
      );
      if (entries.has(key))
        throw new Error(
          `duplicate Graph 1.4 catalog entry: ${entry.moduleId}@${entry.version}`,
        );
      entries.set(key, deepFreeze({ ...entry }));
    }
    this.catalogEvidenceId = input.catalogEvidenceId;
    this.#entries = entries;
    Object.freeze(this);
  }

  findForGraph(
    graph: BrowserResolvedModuleGraphV14,
    instanceId: string,
  ): BrowserRuntimeCatalogEntryV14 {
    if (
      graph.graphVersion !== "1.4.0" ||
      graph.executionReadiness.status !== "ready" ||
      graph.catalogEvidenceId !== this.catalogEvidenceId ||
      !/^[a-f0-9]{64}$/.test(graph.executionReadiness.evidenceId)
    )
      throw new Error("Graph 1.4 readiness/catalog evidence mismatch");
    const module = graph.modules.find(
      (candidate) => candidate.instanceId === instanceId,
    );
    if (
      module === undefined ||
      module.artifactIdentity === undefined ||
      module.catalogEntryEvidenceId === undefined
    )
      throw new Error(`Graph 1.4 instance is not executable: ${instanceId}`);
    const entry = this.#entries.get(
      registrationKey(
        module.moduleId,
        module.version,
        module.artifactIdentity.envelopeSha256,
      ),
    );
    if (
      entry === undefined ||
      entry.entryEvidenceId !== module.catalogEntryEvidenceId ||
      entry.implementationId !== module.implementationId ||
      entry.manifestSchemaVersion !== module.manifestSchemaVersion ||
      entry.factoryContextVersion !== module.factoryContextVersion
    )
      throw new Error(`Graph 1.4 runtime catalog drift for ${instanceId}`);
    return entry;
  }
}
