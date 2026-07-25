# ADR 0023: Orthogonal single-player gameplay capabilities

- Status: Accepted
- Date: 2026-07-17

## Context

ADR 0022 established a thin runtime kernel, reviewed gameplay modules, a
data-only assembly, and deterministic resolution. Its initial module list still
mirrored the legacy vertical-shooter implementation: health, shield, weapons,
projectiles, trajectories, pickups, waves, Boss phases, scoring, and outcomes.

That list does not by itself express common single-player bullet-shooter
variation. The current player firing planner schedules automatic upward shots;
it has no aim intent, manual trigger, target policy, attack-delivery kind, ammo,
charge, or upgrade composition. A single broad weapon module would therefore
become another fixed template with many conditionals.

A cross-genre review identified reusable distinctions within 2D bullet-shooter
play: fixed or directional aim, manual or automatic triggers, automatic target
selection, projectile and non-projectile attacks, dash/focus movement,
absorption or bullet cancellation, equipment slots, in-run upgrades, arena or
scrolling encounters, and independently owned companions. The user excluded
multiplayer from the current plan.

## Decision

### Product boundary

- The product remains a single-player vertical bullet-hell H5 generation Agent.
- Contracts may avoid vertical-only assumptions and represent directional or
  automatic targeting needed by compatible 2D playfields, but this does not
  turn the repository into a general-purpose game generator.
- Multiplayer, networking, split-screen, PvP, replication, rollback, shared
  loot, and player-synchronization contracts are out of scope. Unsupported
  requests must fail closed instead of activating dormant multiplayer fields.

### Capability decomposition

Reviewed modules compose along independent axes:

1. **Player intent:** movement vector, aim vector or point, attack intent,
   ability intent, and equipment-selection intent.
2. **Locomotion:** bounded 2D movement, focus-speed changes, dash/roll, inertia,
   or other reviewed movement policies.
3. **Targeting:** fixed direction, aim direction, nearest or prioritized target,
   homing updates, and bounded multi-lock selection.
4. **Attack trigger:** interval auto-fire, active press/hold, charge, cooldown,
   ammunition/reload, energy, or heat policies.
5. **Attack delivery:** projectile, beam, melee arc, area field, mine, orbiting
   entity, chain effect, or summon/companion command.
6. **Combat interaction:** damage, health, shield, invulnerability, bullet
   cancellation, reflection, absorption, polarity, status, and graze.
7. **Progression and loadout:** experience, bounded upgrade choices, modifiers,
   evolution recipes, equipment slots, pickups, shops, and persistent unlock
   references. Persistence remains local data, not an online service.
8. **Encounter flow:** scrolling waves, fixed arenas, rooms, timed survival,
   Boss sequences, and objective conditions.
9. **Companion behavior:** single-player-owned satellites, drones, summons, and
   their targeting or collection policies.
10. **Scoring and outcomes:** score transitions, chains, risk rewards, victory,
    loss, and mode-specific objectives.

This taxonomy defines compatibility and ownership boundaries, not a promise
that every listed module ships in the first library.

### Typed ports and ownership

- Contracts use reviewed typed data such as vectors, logical entity IDs,
  target references, attack requests, emissions, hits, damage, resource
  transactions, modifier applications, and encounter transitions.
- Aim, trigger, targeting, delivery, and damage are separate capabilities. A
  module may provide more than one only when its manifest declares the combined
  ownership and the registry admits that reviewed combination.
- The resolver rejects missing providers, incompatible port payload versions,
  multiple exclusive owners, undeclared events, invalid cardinality, conflicts,
  cycles, incompatible engine/kernel ranges, and aggregate budget excess.
- `GameAssemblySpec` selects/configures admitted capabilities; it cannot invent
  a new module kind, event, implementation path, executable rule, or networked
  player topology.

### Contract fixtures

Before runtime migration, schemas and the pure resolver must cover five
representative data-only assemblies:

1. legacy fixed-forward interval auto-fire;
2. directional aim with active firing;
3. automatic target selection with automatic attacks;
4. polarity or absorption-based projectile interaction;
5. slotted primary weapon, armor, secondary weapon, and companion equipment.

These fixtures prove expressiveness and fail-closed resolution only. They do
not claim that the corresponding Phaser runtime modules already exist.

## Consequences

- The contract foundation becomes broader than a direct extraction of the
  legacy scene while the implementation remains staged and bounded.
- Directional attacks require explicit aim and trigger providers; the name
  `weapon/projectile` alone can no longer imply support.
- Auto-target survival play, equipment-driven vertical play, and special
  bullet interactions can share contracts without one giant weapon schema.
- Multiplayer complexity and browser acceptance costs are removed from the
  active roadmap.
- The next gate remains schemas, an in-memory registry, a pure resolver,
  fixtures, and fail-closed tests. No Phaser behavior changes in this gate.

## Evidence and relationship

- User scope decision: 2026-07-17.
- Current upward-only firing evidence:
  `src/gameplay/player-firing-planner.ts`.
- This ADR refines ADR 0022; it does not supersede its kernel, security,
  deterministic-resolution, evidence-chain, or legacy-parity decisions.
