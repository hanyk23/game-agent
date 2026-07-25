// @ts-nocheck -- generated from one production-ready pickup/modifier Graph 1.3 artifact
import { BrowserGameModuleRuntimeCatalogV13 } from "../../../../src/modules/game-module-runtime-catalog.js";
import type { ResolvedModuleGraphV13 } from "../../../../src/modules/game-module-resolver.js";
import * as executables from "./batch2-runtime.js";

export const batch2ProgressionGraph = {
  "graphVersion": "1.3.0",
  "assemblyId": "batch2.progression-vertical-slice",
  "kernelVersion": "1.0.0",
  "engine": {
    "id": "phaser",
    "version": "3.90.0"
  },
  "executionReadiness": {
    "status": "ready",
    "evidenceId": "e50500fa0bb41d42690259c1ffdb7bde6b59230e06ef422687e99604e808625f"
  },
  "catalogEvidenceId": "ea936744ed007a3a50676932a515623a011be52337bd785c71d170bee8b85db4",
  "actors": [
    {
      "actorId": "player-one",
      "role": "player"
    },
    {
      "actorId": "world-one",
      "role": "world"
    }
  ],
  "modules": [
    {
      "instanceId": "pickup-collect",
      "ownerId": "player-one",
      "moduleId": "progression.pickup-collect",
      "version": "1.0.0",
      "kind": "progression-loadout",
      "implementationId": "progression.pickup-collect.v1",
      "configurationSchemaId": "progression.pickup-collect.config",
      "configuration": {
        "sourceEntityRole": "pickup",
        "targetActorRole": "player",
        "maximumTrackedCollections": 8,
        "maximumConcurrentCommits": 2,
        "maximumApplicationsPerPickup": 4,
        "effectPlanProfileId": "batch2.pickup-effects"
      },
      "manifestSchemaVersion": "1.3.0",
      "instantiation": "production-eligible",
      "manifestSha256": "32caed0cca0cf3886ef4572f7b5812372d3d36680a1209ea70e20221f10daa4a",
      "resources": {
        "activeEntities": 0,
        "activeProjectiles": 0,
        "spawnsPerSecond": 0,
        "timers": 0
      },
      "resourceGrant": {
        "activeEntities": 0,
        "activeProjectiles": 0,
        "spawnsPerSecond": 0,
        "timers": 0
      },
      "runtimeLeaseCeilings": {
        "startLeases": 2,
        "instanceLeases": 1,
        "graphLeases": 0
      },
      "artifactIdentity": {
        "schemaVersion": "1.0.0",
        "algorithm": "sha256",
        "envelopeFormat": "module-registration-envelope-v1",
        "manifestSha256": "32caed0cca0cf3886ef4572f7b5812372d3d36680a1209ea70e20221f10daa4a",
        "configurationDescriptorSha256": "7bb6c9ae19db6529fd65054cb6a2b96e179b82fed26528523eb95372c8f0dfdb",
        "reservationDescriptorSha256": "36ef7db3a7473db73126b3b62d54c51839e54bea8503d9d0e19f591675994877",
        "implementationBundleSha256": "de874952b5960a1fe51117144483f2684b8028b94f65eb5f8fabd40abf2dfbc4",
        "dependencyLockSha256": "3114db68a63f8cc7a5f8d6681980c6d48d25719a43a53f4df02dae977f348f15",
        "toolchainIdentitySha256": "35fe5f84f10587932b8d6b182469ac64fddb54bf4a6b06cd46d970c20ed4ab54",
        "envelopeSha256": "5ee4ec8cf9e4c73d331b08896f3fe36274b8787228f65db50582b9ecfcf21c63"
      },
      "factoryContextVersion": "1.3.0",
      "runtimeContract": {
        "update": null,
        "timerSlots": {
          "slotGroupId": "main"
        },
        "inputRegistrations": [],
        "observationReaders": [
          {
            "readerId": "pickup-collect"
          }
        ],
        "contactCommit": null
      },
      "runtimePorts": {
        "inputPorts": [
          {
            "id": "sources",
            "payloadType": "entity-channel-v1",
            "required": true,
            "multiple": false,
            "delivery": "state",
            "authorization": {
              "ownerRelation": "different-owner",
              "sourceActorRoles": [
                "world"
              ],
              "targetActorRoles": [
                "player"
              ],
              "sourceEntityRoles": [
                "pickup"
              ]
            }
          }
        ],
        "outputPorts": [
          {
            "id": "collected",
            "payloadType": "pickup-collected-v1",
            "delivery": "event"
          }
        ]
      },
      "runtimeAuthorities": {
        "inputRegistrationIds": [],
        "observationReaderIds": [
          "pickup-collect"
        ],
        "ownedChannelIds": [],
        "ownsPlayerLocomotion": false,
        "modifierTargetFieldIds": [],
        "overlapRuleId": "pickup.commit"
      },
      "catalogEntryEvidenceId": "6eceb8861dae2f397f1792bf663b5c7a220d070e1a4aa3a158a05df1f8d03cf7"
    },
    {
      "instanceId": "pickup-modifier",
      "ownerId": "player-one",
      "moduleId": "progression.modifier",
      "version": "1.0.0",
      "kind": "progression-loadout",
      "implementationId": "progression.modifier.transform.v1",
      "configurationSchemaId": "progression.modifier.config",
      "configuration": {
        "maximumApplicationsPerPickup": 4,
        "mappings": [
          {
            "effectId": "weaponPower",
            "applications": [
              {
                "routeId": "pickup-collect.effect-route.delivery-damage",
                "targetInstanceId": "player-delivery",
                "fieldId": "attack.damage.multiplier",
                "operation": "add",
                "valueScale": 1,
                "minimumValue": 1,
                "maximumValue": 1
              }
            ]
          },
          {
            "effectId": "scoreBonus",
            "applications": []
          }
        ]
      },
      "manifestSchemaVersion": "1.3.0",
      "instantiation": "production-eligible",
      "manifestSha256": "710f60d27b1b46307651c452d8f9281e673a5d59b7f208017c559c57a12eae3d",
      "resources": {
        "activeEntities": 0,
        "activeProjectiles": 0,
        "spawnsPerSecond": 0,
        "timers": 0
      },
      "resourceGrant": {
        "activeEntities": 0,
        "activeProjectiles": 0,
        "spawnsPerSecond": 0,
        "timers": 0
      },
      "runtimeLeaseCeilings": {
        "startLeases": 0,
        "instanceLeases": 0,
        "graphLeases": 0
      },
      "artifactIdentity": {
        "schemaVersion": "1.0.0",
        "algorithm": "sha256",
        "envelopeFormat": "module-registration-envelope-v1",
        "manifestSha256": "710f60d27b1b46307651c452d8f9281e673a5d59b7f208017c559c57a12eae3d",
        "configurationDescriptorSha256": "722b3ee3b1b64cf241749bcfca2a8f3821ab37faeb820662869afa79fc7f2b57",
        "reservationDescriptorSha256": "5ef1cd75151bf9944b6ceb05f3b46ea74b5882a540b5eafce6c745a3edf6ccd0",
        "implementationBundleSha256": "169618947f4167cc69b2a177a7821df1689323f48edf5e8bd061f9b340f82f94",
        "dependencyLockSha256": "3114db68a63f8cc7a5f8d6681980c6d48d25719a43a53f4df02dae977f348f15",
        "toolchainIdentitySha256": "35fe5f84f10587932b8d6b182469ac64fddb54bf4a6b06cd46d970c20ed4ab54",
        "envelopeSha256": "22fec7ed42fb2d646cd5158ce9283b8d585e39f61b34d02d2c13eeb4706c32aa"
      },
      "factoryContextVersion": "1.3.0",
      "runtimeContract": {
        "update": null,
        "timerSlots": {
          "slotGroupId": "main"
        },
        "inputRegistrations": [],
        "observationReaders": [],
        "contactCommit": null
      },
      "runtimePorts": {
        "inputPorts": [],
        "outputPorts": []
      },
      "runtimeAuthorities": {
        "inputRegistrationIds": [],
        "observationReaderIds": [],
        "ownedChannelIds": [],
        "ownsPlayerLocomotion": false,
        "modifierTargetFieldIds": []
      },
      "catalogEntryEvidenceId": "19137335bc55d570bbcffab314e0d7951e6686a051ce1de189a4a684bbed28fa"
    },
    {
      "instanceId": "pickup-spawn",
      "ownerId": "world-one",
      "moduleId": "progression.pickup-spawn",
      "version": "1.0.0",
      "kind": "progression-loadout",
      "implementationId": "progression.pickup-spawn.v1",
      "configurationSchemaId": "progression.pickup-spawn.config",
      "configuration": {
        "schedule": [
          {
            "atMs": 0,
            "effectId": "weaponPower",
            "value": 1,
            "position": {
              "x": 400,
              "y": 160
            }
          }
        ],
        "fallSpeed": 80,
        "textureRole": "pickup",
        "maxActive": 2,
        "maximumSpawnRate": 2,
        "schedulerIntervalMs": 50,
        "poolExhaustion": "drop-and-observe"
      },
      "manifestSchemaVersion": "1.3.0",
      "instantiation": "production-eligible",
      "manifestSha256": "321e07b10bc2b2232a804093e5bcaeedbddecb92173962fee91b743a34e8cd9e",
      "resources": {
        "activeEntities": 256,
        "activeProjectiles": 0,
        "spawnsPerSecond": 100,
        "timers": 1
      },
      "resourceGrant": {
        "activeEntities": 2,
        "activeProjectiles": 0,
        "spawnsPerSecond": 2,
        "timers": 1
      },
      "runtimeLeaseCeilings": {
        "startLeases": 2,
        "instanceLeases": 4,
        "graphLeases": 0
      },
      "artifactIdentity": {
        "schemaVersion": "1.0.0",
        "algorithm": "sha256",
        "envelopeFormat": "module-registration-envelope-v1",
        "manifestSha256": "321e07b10bc2b2232a804093e5bcaeedbddecb92173962fee91b743a34e8cd9e",
        "configurationDescriptorSha256": "738e9f1a1f6267599a7d7ba1ea0f9d07c008eee52215dbed94fc3b51bed1fe88",
        "reservationDescriptorSha256": "1dfcafabc3d55f549b4497fb2364aa9466cf7b13d2c21b88ee244831a47597eb",
        "implementationBundleSha256": "0b776d9d54e1172a7af24a79e291b0c3dfae6e3f3572b32174093e66778b5f7e",
        "dependencyLockSha256": "3114db68a63f8cc7a5f8d6681980c6d48d25719a43a53f4df02dae977f348f15",
        "toolchainIdentitySha256": "35fe5f84f10587932b8d6b182469ac64fddb54bf4a6b06cd46d970c20ed4ab54",
        "envelopeSha256": "2433b4f2e12f5ec73889eec9fbaa31160edc846607869c5aec16b177f8e023bc"
      },
      "factoryContextVersion": "1.3.0",
      "runtimeContract": {
        "update": {
          "mode": "graph-frame-v1",
          "registrationId": "pickup-spawn.update"
        },
        "timerSlots": {
          "slotGroupId": "pickup-spawn"
        },
        "inputRegistrations": [],
        "observationReaders": [
          {
            "readerId": "pickup-spawn"
          }
        ],
        "contactCommit": null
      },
      "runtimePorts": {
        "inputPorts": [],
        "outputPorts": [
          {
            "id": "pickups",
            "payloadType": "entity-channel-v1",
            "delivery": "state",
            "entityRole": "pickup"
          }
        ]
      },
      "runtimeAuthorities": {
        "inputRegistrationIds": [],
        "observationReaderIds": [
          "pickup-spawn"
        ],
        "ownedChannelIds": [
          "pickups"
        ],
        "ownsPlayerLocomotion": false,
        "modifierTargetFieldIds": []
      },
      "catalogEntryEvidenceId": "99f88c33b947f4a9c54915461167b3bb5c079e5a793aaa72e61d9679aced5575"
    },
    {
      "instanceId": "player-aim",
      "ownerId": "player-one",
      "moduleId": "intent.directional-aim",
      "version": "1.0.0",
      "kind": "player-intent",
      "implementationId": "intent.directional-aim.v1",
      "configurationSchemaId": "intent.directional-aim.config",
      "configuration": {
        "source": "pointer-world",
        "deadZone": 0,
        "normalization": "unit",
        "pointerCapture": "latest-active"
      },
      "manifestSchemaVersion": "1.3.0",
      "instantiation": "production-eligible",
      "manifestSha256": "63d16c18e0ed407888e42fa2bb5b1cbc21f90266194d15ecd7fffb79de00965c",
      "resources": {
        "activeEntities": 0,
        "activeProjectiles": 0,
        "spawnsPerSecond": 0,
        "timers": 0
      },
      "resourceGrant": {
        "activeEntities": 0,
        "activeProjectiles": 0,
        "spawnsPerSecond": 0,
        "timers": 0
      },
      "runtimeLeaseCeilings": {
        "startLeases": 2,
        "instanceLeases": 2,
        "graphLeases": 0
      },
      "artifactIdentity": {
        "schemaVersion": "1.0.0",
        "algorithm": "sha256",
        "envelopeFormat": "module-registration-envelope-v1",
        "manifestSha256": "63d16c18e0ed407888e42fa2bb5b1cbc21f90266194d15ecd7fffb79de00965c",
        "configurationDescriptorSha256": "582aaa5c4b43e7d17b09c69574e635cc9de8920ed5aeb8cfb0d2b1e87721c5ae",
        "reservationDescriptorSha256": "f1f8548b8d61efd1d6f783c373dd87821967385fdf6dae373372548f2bdb7e34",
        "implementationBundleSha256": "93c19b25fa2b6c7a1aea4cd2e9300ebcae819a24c83f69f94f0df5172260bc53",
        "dependencyLockSha256": "5b498deec049fe835a9f07056297b89515949bc723867821f92110a0ab04db55",
        "toolchainIdentitySha256": "9a149b74eaf8e88bea1c3f4aa0a166ce306dcf155781bdb1a48e5ad05d22e735",
        "envelopeSha256": "d16347a287cf36718c5dc6e86ee201781495e5adf15cd605cbd1c853dcbd7437"
      },
      "factoryContextVersion": "1.3.0",
      "runtimeContract": {
        "update": null,
        "timerSlots": {
          "slotGroupId": "main"
        },
        "inputRegistrations": [
          {
            "registrationId": "aim.pointer",
            "kind": "pointer-move"
          },
          {
            "registrationId": "aim.keyboard",
            "kind": "keyboard"
          }
        ],
        "observationReaders": [
          {
            "readerId": "aim"
          }
        ],
        "contactCommit": null
      },
      "runtimePorts": {
        "inputPorts": [],
        "outputPorts": [
          {
            "id": "aim",
            "payloadType": "aim-command-v1",
            "delivery": "state"
          }
        ]
      },
      "runtimeAuthorities": {
        "inputRegistrationIds": [
          "aim.pointer",
          "aim.keyboard"
        ],
        "observationReaderIds": [
          "aim"
        ],
        "ownedChannelIds": [],
        "ownsPlayerLocomotion": false,
        "modifierTargetFieldIds": []
      },
      "catalogEntryEvidenceId": "0af84425d72f74e62a0f164fb83e73b721b8855270d48e2e546177a89845a64e"
    },
    {
      "instanceId": "player-attack-intent",
      "ownerId": "player-one",
      "moduleId": "intent.active-attack",
      "version": "1.0.0",
      "kind": "player-intent",
      "implementationId": "intent.active-attack.v1",
      "configurationSchemaId": "intent.active-attack.config",
      "configuration": {
        "device": "pointer",
        "control": "primary",
        "pointerCapture": "matching-pointer"
      },
      "manifestSchemaVersion": "1.3.0",
      "instantiation": "production-eligible",
      "manifestSha256": "1f2dc8aa1d143dae97bfe4e12594d22656b82569d920dded5c77eae2b83adc90",
      "resources": {
        "activeEntities": 0,
        "activeProjectiles": 0,
        "spawnsPerSecond": 0,
        "timers": 0
      },
      "resourceGrant": {
        "activeEntities": 0,
        "activeProjectiles": 0,
        "spawnsPerSecond": 0,
        "timers": 0
      },
      "runtimeLeaseCeilings": {
        "startLeases": 3,
        "instanceLeases": 1,
        "graphLeases": 0
      },
      "artifactIdentity": {
        "schemaVersion": "1.0.0",
        "algorithm": "sha256",
        "envelopeFormat": "module-registration-envelope-v1",
        "manifestSha256": "1f2dc8aa1d143dae97bfe4e12594d22656b82569d920dded5c77eae2b83adc90",
        "configurationDescriptorSha256": "fa3bd849887bb7e907cf3e348eebba070fe8af2315570cf70c1c325bf90e99f3",
        "reservationDescriptorSha256": "bc769e55252111ec0932e60b6d603183a099c8bed39688f1b1e2aaa79fc6ade0",
        "implementationBundleSha256": "046f8d09d98250276f8f04d380433486edbace64e899a846517d86da28fb2702",
        "dependencyLockSha256": "5b498deec049fe835a9f07056297b89515949bc723867821f92110a0ab04db55",
        "toolchainIdentitySha256": "9a149b74eaf8e88bea1c3f4aa0a166ce306dcf155781bdb1a48e5ad05d22e735",
        "envelopeSha256": "441651be54ceddd363b9fa8819756b797c818ca8f4acf8e86dce9a7105592bbd"
      },
      "factoryContextVersion": "1.3.0",
      "runtimeContract": {
        "update": null,
        "timerSlots": {
          "slotGroupId": "main"
        },
        "inputRegistrations": [
          {
            "registrationId": "attack.pointer-down",
            "kind": "pointer-down"
          },
          {
            "registrationId": "attack.pointer-up",
            "kind": "pointer-up"
          },
          {
            "registrationId": "attack.keyboard",
            "kind": "keyboard"
          }
        ],
        "observationReaders": [
          {
            "readerId": "attack"
          }
        ],
        "contactCommit": null
      },
      "runtimePorts": {
        "inputPorts": [],
        "outputPorts": [
          {
            "id": "intent",
            "payloadType": "attack-intent-v1",
            "delivery": "event"
          }
        ]
      },
      "runtimeAuthorities": {
        "inputRegistrationIds": [
          "attack.pointer-down",
          "attack.pointer-up",
          "attack.keyboard"
        ],
        "observationReaderIds": [
          "attack"
        ],
        "ownedChannelIds": [],
        "ownsPlayerLocomotion": false,
        "modifierTargetFieldIds": []
      },
      "catalogEntryEvidenceId": "045dce9ee29b76428cc5d3758aae5fce9e342264904ecba696cb5302240d50b1"
    },
    {
      "instanceId": "player-delivery",
      "ownerId": "player-one",
      "moduleId": "delivery.spread",
      "version": "1.0.0",
      "kind": "attack-delivery",
      "implementationId": "delivery.spread.v1",
      "configurationSchemaId": "delivery.spread.config",
      "configuration": {
        "attackChannelId": "player.primary",
        "baseCount": 1,
        "speed": 600,
        "baseDamage": 12,
        "textureRole": "player-projectile",
        "spawnOffset": {
          "x": 0,
          "y": -28
        },
        "maxActive": 4,
        "maximumAcceptedRequestsPerSecond": 2,
        "maximumCountBonus": 1,
        "maximumDamageMultiplier": 2,
        "recycleMargin": 32,
        "exhaustionPolicy": "drop-and-observe",
        "totalArcDegrees": 0,
        "centeredOrdering": true
      },
      "manifestSchemaVersion": "1.3.0",
      "instantiation": "production-eligible",
      "manifestSha256": "7e798f3d2255af907a11206cf8209926ebbd7b1025bf674038697f4dbf314acd",
      "resources": {
        "activeEntities": 256,
        "activeProjectiles": 256,
        "spawnsPerSecond": 2560,
        "timers": 0
      },
      "resourceGrant": {
        "activeEntities": 4,
        "activeProjectiles": 4,
        "spawnsPerSecond": 4,
        "timers": 0
      },
      "runtimeLeaseCeilings": {
        "startLeases": 4,
        "instanceLeases": 6,
        "graphLeases": 0
      },
      "artifactIdentity": {
        "schemaVersion": "1.0.0",
        "algorithm": "sha256",
        "envelopeFormat": "module-registration-envelope-v1",
        "manifestSha256": "7e798f3d2255af907a11206cf8209926ebbd7b1025bf674038697f4dbf314acd",
        "configurationDescriptorSha256": "b6bff4a38600ba87e276d57a62e34f9060cb3b57d27ac42f2f0e99b4769f506b",
        "reservationDescriptorSha256": "e84395486242aa580d7ea2091dfd08602042601a63121ba47f24850f837238cb",
        "implementationBundleSha256": "e658387ae10c64775b4682e621368c9364d4aff41581168697666655e73b2d33",
        "dependencyLockSha256": "3a62cb4fa8c1835c5496c91fc4b6018ad52d0e2a9f7c6e03b05675f5f973cd0c",
        "toolchainIdentitySha256": "d36c05bbb20980385899dc98650138698cc54f619092b6d415a24983e56552d0",
        "envelopeSha256": "9ee73cbeff668f45737598a0ddd31bb89cc4d09119fd18bc508ef646c525ae58"
      },
      "factoryContextVersion": "1.3.0",
      "runtimeContract": {
        "update": {
          "mode": "graph-frame-v1",
          "registrationId": "delivery.update"
        },
        "timerSlots": {
          "slotGroupId": "main"
        },
        "inputRegistrations": [],
        "observationReaders": [
          {
            "readerId": "delivery"
          }
        ],
        "contactCommit": null
      },
      "runtimePorts": {
        "inputPorts": [
          {
            "id": "target",
            "payloadType": "target-solution-v1",
            "required": true,
            "multiple": false,
            "delivery": "state",
            "authorization": {
              "ownerRelation": "same-owner",
              "sourceActorRoles": [
                "player",
                "enemy",
                "boss"
              ],
              "targetActorRoles": [
                "player",
                "enemy",
                "boss"
              ],
              "sourceEntityRoles": []
            }
          },
          {
            "id": "request",
            "payloadType": "attack-request-v2",
            "required": true,
            "multiple": false,
            "delivery": "event",
            "authorization": {
              "ownerRelation": "same-owner",
              "sourceActorRoles": [
                "player",
                "enemy",
                "boss"
              ],
              "targetActorRoles": [
                "player",
                "enemy",
                "boss"
              ],
              "sourceEntityRoles": []
            }
          },
          {
            "id": "modifier",
            "payloadType": "modifier-application-v1",
            "required": false,
            "multiple": true,
            "delivery": "event",
            "authorization": {
              "ownerRelation": "same-owner",
              "sourceActorRoles": [
                "player",
                "enemy",
                "boss"
              ],
              "targetActorRoles": [
                "player",
                "enemy",
                "boss"
              ],
              "sourceEntityRoles": []
            }
          }
        ],
        "outputPorts": [
          {
            "id": "projectiles",
            "payloadType": "entity-channel-v1",
            "delivery": "state",
            "entityRole": "projectile"
          },
          {
            "id": "emission",
            "payloadType": "emission-v1",
            "delivery": "event"
          },
          {
            "id": "modifier-state",
            "payloadType": "modifier-state-v1",
            "delivery": "state"
          }
        ]
      },
      "runtimeAuthorities": {
        "inputRegistrationIds": [],
        "observationReaderIds": [
          "delivery"
        ],
        "ownedChannelIds": [
          "projectiles"
        ],
        "ownsPlayerLocomotion": false,
        "modifierTargetFieldIds": [
          "attack.damage.multiplier",
          "attack.projectile-count.bonus"
        ]
      },
      "catalogEntryEvidenceId": "0c583329e377c98016e5f87f4eecc6cbf81660284107ca4ced3229adadffe11d"
    },
    {
      "instanceId": "player-targeting",
      "ownerId": "player-one",
      "moduleId": "targeting.directional",
      "version": "1.0.0",
      "kind": "targeting",
      "implementationId": "targeting.directional.v1",
      "configurationSchemaId": "targeting.directional.config",
      "configuration": {
        "attackChannelId": "player.primary",
        "pointFallbackDirection": {
          "x": 0,
          "y": -1
        },
        "zeroVectorPolicy": "retain-last"
      },
      "manifestSchemaVersion": "1.3.0",
      "instantiation": "production-eligible",
      "manifestSha256": "2a63ed1800312c6a11d908630c821f09ec0a5f839f8218f9882b092a2b094762",
      "resources": {
        "activeEntities": 0,
        "activeProjectiles": 0,
        "spawnsPerSecond": 0,
        "timers": 0
      },
      "resourceGrant": {
        "activeEntities": 0,
        "activeProjectiles": 0,
        "spawnsPerSecond": 0,
        "timers": 0
      },
      "runtimeLeaseCeilings": {
        "startLeases": 1,
        "instanceLeases": 2,
        "graphLeases": 0
      },
      "artifactIdentity": {
        "schemaVersion": "1.0.0",
        "algorithm": "sha256",
        "envelopeFormat": "module-registration-envelope-v1",
        "manifestSha256": "2a63ed1800312c6a11d908630c821f09ec0a5f839f8218f9882b092a2b094762",
        "configurationDescriptorSha256": "10497656685e4dbd55efbce1e7349a40036b44438ead1f4c70d905e787444571",
        "reservationDescriptorSha256": "a49fe1454f2d6fbca28a705384cbdb69088d13fd819d166cc36d4d6a60537bc7",
        "implementationBundleSha256": "d8f162df60a3055e6112fb4cdb0408ac15365ce0a83db29ffdbfd70a4ffe31a7",
        "dependencyLockSha256": "5b498deec049fe835a9f07056297b89515949bc723867821f92110a0ab04db55",
        "toolchainIdentitySha256": "9a149b74eaf8e88bea1c3f4aa0a166ce306dcf155781bdb1a48e5ad05d22e735",
        "envelopeSha256": "8e0f4b3139687481b77b1584062a38cad1429c7cf5ac20faf7384c6ad38c9f5d"
      },
      "factoryContextVersion": "1.3.0",
      "runtimeContract": {
        "update": null,
        "timerSlots": {
          "slotGroupId": "main"
        },
        "inputRegistrations": [],
        "observationReaders": [
          {
            "readerId": "target"
          }
        ],
        "contactCommit": null
      },
      "runtimePorts": {
        "inputPorts": [
          {
            "id": "aim",
            "payloadType": "aim-command-v1",
            "required": true,
            "multiple": false,
            "delivery": "state",
            "authorization": {
              "ownerRelation": "same-owner",
              "sourceActorRoles": [
                "player"
              ],
              "targetActorRoles": [
                "player"
              ],
              "sourceEntityRoles": []
            }
          }
        ],
        "outputPorts": [
          {
            "id": "selection",
            "payloadType": "target-solution-v1",
            "delivery": "state"
          }
        ]
      },
      "runtimeAuthorities": {
        "inputRegistrationIds": [],
        "observationReaderIds": [
          "target"
        ],
        "ownedChannelIds": [],
        "ownsPlayerLocomotion": false,
        "modifierTargetFieldIds": []
      },
      "catalogEntryEvidenceId": "718d914d57cbf942b849f8ae6cc9c9983e20cc0d20b6e895825c4496f1927907"
    },
    {
      "instanceId": "player-trigger",
      "ownerId": "player-one",
      "moduleId": "trigger.active",
      "version": "1.0.0",
      "kind": "attack-trigger",
      "implementationId": "trigger.active.v1",
      "configurationSchemaId": "trigger.active.config",
      "configuration": {
        "attackChannelId": "player.primary",
        "mode": "press"
      },
      "manifestSchemaVersion": "1.3.0",
      "instantiation": "production-eligible",
      "manifestSha256": "011535a2bb07a39f5a7d2a7f13812722a05d368182bd689e0e0a8ed793cae78e",
      "resources": {
        "activeEntities": 0,
        "activeProjectiles": 0,
        "spawnsPerSecond": 0,
        "timers": 1
      },
      "resourceGrant": {
        "activeEntities": 0,
        "activeProjectiles": 0,
        "spawnsPerSecond": 0,
        "timers": 0
      },
      "runtimeLeaseCeilings": {
        "startLeases": 3,
        "instanceLeases": 1,
        "graphLeases": 0
      },
      "artifactIdentity": {
        "schemaVersion": "1.0.0",
        "algorithm": "sha256",
        "envelopeFormat": "module-registration-envelope-v1",
        "manifestSha256": "011535a2bb07a39f5a7d2a7f13812722a05d368182bd689e0e0a8ed793cae78e",
        "configurationDescriptorSha256": "3acc2add21a4a707b152ac736754fd1b0de4067b58dc47b7cf2c5cc652bd567e",
        "reservationDescriptorSha256": "c3e628cd991fe27b706758a5c45c6f27354af61e5e2062d19497cd15a38852a9",
        "implementationBundleSha256": "6d6263261ef957be80776d9ac82ca3ba6b859172b515c81db84f613f9d74850f",
        "dependencyLockSha256": "5b498deec049fe835a9f07056297b89515949bc723867821f92110a0ab04db55",
        "toolchainIdentitySha256": "9a149b74eaf8e88bea1c3f4aa0a166ce306dcf155781bdb1a48e5ad05d22e735",
        "envelopeSha256": "c005136c5030b00edb56d4df66301ce06429940fb1f9c57ba12e51e206fff0a1"
      },
      "factoryContextVersion": "1.3.0",
      "runtimeContract": {
        "update": null,
        "timerSlots": {
          "slotGroupId": "active"
        },
        "inputRegistrations": [],
        "observationReaders": [
          {
            "readerId": "trigger"
          }
        ],
        "contactCommit": null
      },
      "runtimePorts": {
        "inputPorts": [
          {
            "id": "intent",
            "payloadType": "attack-intent-v1",
            "required": true,
            "multiple": false,
            "delivery": "event",
            "authorization": {
              "ownerRelation": "same-owner",
              "sourceActorRoles": [
                "player"
              ],
              "targetActorRoles": [
                "player"
              ],
              "sourceEntityRoles": []
            }
          }
        ],
        "outputPorts": [
          {
            "id": "request",
            "payloadType": "attack-request-v2",
            "delivery": "event"
          }
        ]
      },
      "runtimeAuthorities": {
        "inputRegistrationIds": [],
        "observationReaderIds": [
          "trigger"
        ],
        "ownedChannelIds": [],
        "ownsPlayerLocomotion": false,
        "modifierTargetFieldIds": []
      },
      "catalogEntryEvidenceId": "d280f8bb30edcdf5adde3fc77fe92f7cd3a6a0d7ef9a56d21a278d7ada247513"
    }
  ],
  "dependencyEdges": [],
  "capabilityEdges": [
    {
      "from": "pickup-collect",
      "to": "pickup-spawn",
      "capabilityId": "progression.pickup-channel",
      "scope": "assembly"
    },
    {
      "from": "player-delivery",
      "to": "player-targeting",
      "capabilityId": "targeting.solution-v2",
      "scope": "owner"
    },
    {
      "from": "player-delivery",
      "to": "player-trigger",
      "capabilityId": "trigger.attack-v2",
      "scope": "owner"
    },
    {
      "from": "player-targeting",
      "to": "player-aim",
      "capabilityId": "intent.aim-source",
      "scope": "owner"
    },
    {
      "from": "player-trigger",
      "to": "player-attack-intent",
      "capabilityId": "intent.attack-source",
      "scope": "owner"
    }
  ],
  "bindings": [
    {
      "from": {
        "instanceId": "pickup-spawn",
        "portId": "pickups"
      },
      "to": {
        "instanceId": "pickup-collect",
        "portId": "sources"
      },
      "payloadType": "entity-channel-v1",
      "delivery": "state"
    },
    {
      "from": {
        "instanceId": "player-aim",
        "portId": "aim"
      },
      "to": {
        "instanceId": "player-targeting",
        "portId": "aim"
      },
      "payloadType": "aim-command-v1",
      "delivery": "state"
    },
    {
      "from": {
        "instanceId": "player-attack-intent",
        "portId": "intent"
      },
      "to": {
        "instanceId": "player-trigger",
        "portId": "intent"
      },
      "payloadType": "attack-intent-v1",
      "delivery": "event"
    },
    {
      "from": {
        "instanceId": "player-targeting",
        "portId": "selection"
      },
      "to": {
        "instanceId": "player-delivery",
        "portId": "target"
      },
      "payloadType": "target-solution-v1",
      "delivery": "state"
    },
    {
      "from": {
        "instanceId": "player-trigger",
        "portId": "request"
      },
      "to": {
        "instanceId": "player-delivery",
        "portId": "request"
      },
      "payloadType": "attack-request-v2",
      "delivery": "event"
    }
  ],
  "constructionOrder": [
    "pickup-spawn",
    "pickup-collect",
    "pickup-modifier",
    "player-aim",
    "player-attack-intent",
    "player-targeting",
    "player-trigger",
    "player-delivery"
  ],
  "assetBindings": [
    {
      "bindingId": "pickup",
      "roleId": "pickup",
      "category": "pickup",
      "runtimeSha256": "4444444444444444444444444444444444444444444444444444444444444444",
      "textureKey": "module/4444444444444444444444444444444444444444444444444444444444444444/pickup",
      "sharing": "instance",
      "consumerInstanceIds": [
        "pickup-spawn"
      ]
    },
    {
      "bindingId": "player-projectile",
      "roleId": "player-projectile",
      "category": "projectile",
      "runtimeSha256": "2222222222222222222222222222222222222222222222222222222222222222",
      "textureKey": "module/2222222222222222222222222222222222222222222222222222222222222222/player-projectile",
      "sharing": "instance",
      "consumerInstanceIds": [
        "player-delivery"
      ]
    }
  ],
  "contactPolicyProfiles": [],
  "damageSinkRoutes": [],
  "entityChannels": [
    {
      "channelId": "pickup-spawn.pickups",
      "localChannelId": "pickups",
      "ownerInstanceId": "pickup-spawn",
      "ownerActorId": "world-one",
      "outputPort": "pickups",
      "entityRole": "pickup",
      "capacity": 2,
      "capacityResources": [
        "activeEntities"
      ],
      "readerInstanceIds": [
        "pickup-collect"
      ],
      "sourceArtifactEnvelopeSha256": "2433b4f2e12f5ec73889eec9fbaa31160edc846607869c5aec16b177f8e023bc"
    },
    {
      "channelId": "player-delivery.projectiles",
      "localChannelId": "projectiles",
      "ownerInstanceId": "player-delivery",
      "ownerActorId": "player-one",
      "outputPort": "projectiles",
      "entityRole": "projectile",
      "capacity": 4,
      "capacityResources": [
        "activeEntities",
        "activeProjectiles"
      ],
      "readerInstanceIds": [],
      "sourceArtifactEnvelopeSha256": "9ee73cbeff668f45737598a0ddd31bb89cc4d09119fd18bc508ef646c525ae58"
    }
  ],
  "entityMutationGrants": [
    {
      "grantId": "pickup-collect.pickup.consume",
      "accessId": "pickup.consume",
      "granteeInstanceId": "pickup-collect",
      "channelId": "pickup-spawn.pickups",
      "operations": [
        "consume"
      ],
      "transferRecipientActorIds": []
    }
  ],
  "actorSnapshotGrants": [],
  "entityChannelReadGrants": [],
  "attackChannels": [
    {
      "ownerActorId": "player-one",
      "attackChannelId": "player.primary",
      "targetingInstanceId": "player-targeting",
      "triggerInstanceId": "player-trigger",
      "deliveryInstanceId": "player-delivery",
      "targetBinding": {
        "from": {
          "instanceId": "player-targeting",
          "portId": "selection"
        },
        "to": {
          "instanceId": "player-delivery",
          "portId": "target"
        },
        "payloadType": "target-solution-v1",
        "delivery": "state"
      },
      "requestBinding": {
        "from": {
          "instanceId": "player-trigger",
          "portId": "request"
        },
        "to": {
          "instanceId": "player-delivery",
          "portId": "request"
        },
        "payloadType": "attack-request-v2",
        "delivery": "event"
      }
    }
  ],
  "projectileChannelLineages": [],
  "effectApplicationRoutes": [
    {
      "routeId": "pickup-collect.effect-route.delivery-damage",
      "bindingId": "delivery-damage",
      "sourceInstanceId": "pickup-collect",
      "applicationRouteSourceId": "applications",
      "targetInstanceId": "player-delivery",
      "targetInputPort": "modifier",
      "fieldId": "attack.damage.multiplier",
      "operation": "add",
      "payloadType": "modifier-application-v1",
      "targetLeaseId": "start/effect-target/pickup-collect.effect-route.delivery-damage"
    }
  ],
  "pickupEffectPlans": [
    {
      "commitInstanceId": "pickup-collect",
      "transformInstanceId": "pickup-modifier",
      "profileId": "batch2.pickup-effects",
      "mutationChannelId": "pickup-spawn.pickups",
      "mutationGrantId": "pickup-collect.pickup.consume",
      "maximumApplicationsPerCommit": 4,
      "routeIds": [
        "pickup-collect.effect-route.delivery-damage"
      ]
    }
  ],
  "projectileBudgetContention": {
    "budget": {
      "activeProjectiles": 4,
      "spawnsPerSecond": 6
    },
    "totals": {
      "activeProjectiles": 4,
      "spawnsPerSecond": 4
    },
    "orderedOwners": [
      {
        "resolvedOrder": 7,
        "instanceId": "player-delivery",
        "ownerActorId": "player-one",
        "attackChannelId": "player.primary",
        "channelId": "player-delivery.projectiles",
        "poolId": "player-delivery.projectiles.pool",
        "activeProjectiles": 4,
        "spawnsPerSecond": 4,
        "cumulativeActiveProjectiles": 4,
        "cumulativeSpawnsPerSecond": 4
      }
    ]
  },
  "resourceTotals": {
    "activeEntities": 6,
    "activeProjectiles": 4,
    "spawnsPerSecond": 6,
    "timers": 1
  }
} as unknown as ResolvedModuleGraphV13;

const entries = [
  { moduleId: "intent.keyboard-movement", version: "1.0.0", envelopeSha256: "4a2b9dc74b5c7beb16827b0a2e4c8f84256d5a12fa7de8dd7c54556bc501c11b", implementationId: "intent.keyboard-movement.v1", manifestSchemaVersion: "1.2.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "63839ea8e495dab883c5c83d89808fa34f78ffac04eb44bd78fd12dc58f31d7d", executable: executables.batch2Executable0 },
  { moduleId: "intent.touch-drag", version: "1.0.0", envelopeSha256: "6b0f163881d2b3ffce945bacd5499eba9b85ea046021749b234b8256ec44cf90", implementationId: "intent.touch-drag.v1", manifestSchemaVersion: "1.2.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "4cdbcb36531f8cf15ada2f1263d5e96cc4e80b3c4ed2bcf27dbfae98c03a4faa", executable: executables.batch2Executable1 },
  { moduleId: "intent.movement-arbiter", version: "1.0.0", envelopeSha256: "a46bcb6e7b257b0bdc9649aa34aad0c183df155b497d76e95db061e95f5785e1", implementationId: "intent.movement-arbiter.v1", manifestSchemaVersion: "1.2.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "02f001a3d921d7daa4a3c0facf2e4e8b40d839837621ac926de6b843666e144a", executable: executables.batch2Executable2 },
  { moduleId: "locomotion.bounded", version: "1.0.0", envelopeSha256: "c26b611eea98fdcd25b65e934e866b864d1ad8668ee3b5241d71117df8301302", implementationId: "locomotion.bounded.v1", manifestSchemaVersion: "1.2.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "81e66a310405d2efebb576880c024f4121b89192e151e460bae71f1cc7d1399c", executable: executables.batch2Executable3 },
  { moduleId: "targeting.fixed-forward", version: "1.0.0", envelopeSha256: "5d7362dff53087a8e37826c62a504f6dab2e6db7fb809338e4fa4cc45aae225c", implementationId: "targeting.fixed-forward.v1", manifestSchemaVersion: "1.2.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "cb8d80cb2a9f2bd4f5544c148d833f70b6920f6d51127308cd7e7954a892a10e", executable: executables.batch2Executable4 },
  { moduleId: "trigger.interval", version: "1.0.0", envelopeSha256: "f278665d52bbf91aec7b30ab7591885ef4f5e42ec0438858761ed1f1f094f292", implementationId: "trigger.interval.v1", manifestSchemaVersion: "1.2.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "e7ffe52d0cf010ce676badf2b042ebabfd28fd92f54185ce47eba60ea9179186", executable: executables.batch2Executable5 },
  { moduleId: "delivery.projectile", version: "1.0.0", envelopeSha256: "3d229eb9a076c4ffaa3c1df9ecd3644406f64b2937ed215d2d8d0e15add8c689", implementationId: "delivery.projectile.v1", manifestSchemaVersion: "1.2.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "c72f6e2793c326fa644c8d20acfec1d66ef5ebe8c8e8193178dcc335f18384fb", executable: executables.batch2Executable6 },
  { moduleId: "combat.health", version: "1.0.0", envelopeSha256: "6a859e6ee2a20515041d437a24355063ff79f0236e48ffdc9f6bcd66e6d76c9f", implementationId: "combat.health.v1", manifestSchemaVersion: "1.2.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "229377381cfed1f76643ffa4640131e14f1699f5ca197c4e68b4c545a6e97777", executable: executables.batch2Executable7 },
  { moduleId: "interaction.projectile-contact", version: "1.0.0", envelopeSha256: "c293b9337f882984472e89ad9a1e37d323ba6afc7fa9bd037121d746085b14f9", implementationId: "interaction.projectile-contact.v1", manifestSchemaVersion: "1.2.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "68d4583a46192fe19f7a3783962ffda44a4a8e49660d83cafe2c310039cbaae4", executable: executables.batch2Executable8 },
  { moduleId: "interaction.contact-default-damage", version: "1.0.0", envelopeSha256: "435387a883a4ee3a09c15ea334056be0ca7e49989e5e5177847d2c066e4b3514", implementationId: "interaction.contact-default-damage.v1", manifestSchemaVersion: "1.2.0", exportKind: "contact-policy-transform-v1", entryEvidenceId: "d7020b6df92e644270d1b51397bd4fa09885c97138927afcf2f97884d284ee76", executable: executables.batch2Executable9 },
  { moduleId: "interaction.contact-resolution", version: "1.0.0", envelopeSha256: "15c592050626a7a832be4ea2d0272da70a778413164ff69c4bf5942758eaef3e", implementationId: "interaction.contact-resolution.v1", manifestSchemaVersion: "1.2.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "c39a6e1c2d0a5133ea35f031c6e6edd7e00cfd8d79d09568dc5d0433c1d9e921", executable: executables.batch2Executable10 },
  { moduleId: "intent.directional-aim", version: "1.0.0", envelopeSha256: "d16347a287cf36718c5dc6e86ee201781495e5adf15cd605cbd1c853dcbd7437", implementationId: "intent.directional-aim.v1", manifestSchemaVersion: "1.3.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "0af84425d72f74e62a0f164fb83e73b721b8855270d48e2e546177a89845a64e", executable: executables.batch2Executable11 },
  { moduleId: "intent.active-attack", version: "1.0.0", envelopeSha256: "441651be54ceddd363b9fa8819756b797c818ca8f4acf8e86dce9a7105592bbd", implementationId: "intent.active-attack.v1", manifestSchemaVersion: "1.3.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "045dce9ee29b76428cc5d3758aae5fce9e342264904ecba696cb5302240d50b1", executable: executables.batch2Executable12 },
  { moduleId: "intent.focus", version: "1.0.0", envelopeSha256: "95fb5f3bcff3dac4262d9b9054a59f2e303657e445d4f230f1ef3e819d0afa3e", implementationId: "intent.focus.v1", manifestSchemaVersion: "1.3.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "23e74a23b5bf7fe53d7ce537dc39ddaeea9b12c0cf8ba0fe5533fba082d20387", executable: executables.batch2Executable13 },
  { moduleId: "locomotion.focus-speed", version: "1.0.0", envelopeSha256: "b3876bcfbeb935e08ad14d31e5f8b404fca9612ac423ba951745db88543b8b80", implementationId: "locomotion.focus-speed.v1", manifestSchemaVersion: "1.3.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "28dce4daad405345fb8cca1b45e0b010ea80f43e6de68bb5bca668daf6a5b939", executable: executables.batch2Executable14 },
  { moduleId: "locomotion.bounded", version: "1.1.0", envelopeSha256: "4692ccb19733c57887102925be074d83dabcb73a6e990316e9ce9238c543723a", implementationId: "locomotion.bounded.v1-1", manifestSchemaVersion: "1.3.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "54570dd840659201eb0e0487d1dc3a7450d95707a7a8be5981f6f5e44dc4dc6b", executable: executables.batch2Executable15 },
  { moduleId: "targeting.directional", version: "1.0.0", envelopeSha256: "8e0f4b3139687481b77b1584062a38cad1429c7cf5ac20faf7384c6ad38c9f5d", implementationId: "targeting.directional.v1", manifestSchemaVersion: "1.3.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "718d914d57cbf942b849f8ae6cc9c9983e20cc0d20b6e895825c4496f1927907", executable: executables.batch2Executable16 },
  { moduleId: "targeting.nearest", version: "1.0.0", envelopeSha256: "5e5c6a42bc5c80b603e566e102131e236610bc5ee7c92345f15c272b999975ea", implementationId: "targeting.nearest.v1", manifestSchemaVersion: "1.3.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "4f3a39a6bcd208866f8c9003c7a9cd628525fceabb675618427a555a271e4cef", executable: executables.batch2Executable17 },
  { moduleId: "trigger.active", version: "1.0.0", envelopeSha256: "c005136c5030b00edb56d4df66301ce06429940fb1f9c57ba12e51e206fff0a1", implementationId: "trigger.active.v1", manifestSchemaVersion: "1.3.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "d280f8bb30edcdf5adde3fc77fe92f7cd3a6a0d7ef9a56d21a278d7ada247513", executable: executables.batch2Executable18 },
  { moduleId: "delivery.spread", version: "1.0.0", envelopeSha256: "9ee73cbeff668f45737598a0ddd31bb89cc4d09119fd18bc508ef646c525ae58", implementationId: "delivery.spread.v1", manifestSchemaVersion: "1.3.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "0c583329e377c98016e5f87f4eecc6cbf81660284107ca4ced3229adadffe11d", executable: executables.batch2Executable19 },
  { moduleId: "delivery.multi-shot", version: "1.0.0", envelopeSha256: "e7edd8d7fc4c5823b82dc2571c52a352c213b18ec3c6639f46b200d360cb3aef", implementationId: "delivery.multi-shot.v1", manifestSchemaVersion: "1.3.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "fd171c9cdfb8786578e5c0b7e05abb220346cb80ff6de48d68d3d93b678f385d", executable: executables.batch2Executable20 },
  { moduleId: "delivery.pattern.radial", version: "1.0.0", envelopeSha256: "c2b330c8bbea862de53e35326099b6ca0f3705fed5f0722b00afb7db0004a580", implementationId: "delivery.pattern.radial.v1", manifestSchemaVersion: "1.3.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "8465ed27da91baaaf224bc537729a74287cc50a8bbecbc233e8fc5b35923076b", executable: executables.batch2Executable21 },
  { moduleId: "delivery.pattern.spiral", version: "1.0.0", envelopeSha256: "b206d6fd6de866c7d72492e2f35a54dc09af1ba295544f3600c15fb5706f35d0", implementationId: "delivery.pattern.spiral.v1", manifestSchemaVersion: "1.3.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "9f20f1dd994f0708c234d452ee7349c8190a50c43fff0f1c2ad8ba4b9b8b6b02", executable: executables.batch2Executable22 },
  { moduleId: "delivery.pattern.fan", version: "1.0.0", envelopeSha256: "3683ea403f08d7bf7e253581e31da7b4e2ed0a9265dcff3b5ac329a823eea79a", implementationId: "delivery.pattern.fan.v1", manifestSchemaVersion: "1.3.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "22c075ce8ffe2ba2093d5f82dbd9c40a008df4be70c270976de45796aa25ea98", executable: executables.batch2Executable23 },
  { moduleId: "delivery.pattern.aimed", version: "1.0.0", envelopeSha256: "0efc8ec1a55b8e1dfa22ab33b2ad3ecab87d7df35a04265e5191988c3d2572f0", implementationId: "delivery.pattern.aimed.v1", manifestSchemaVersion: "1.3.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "0e8359f9673fb38b350196c2e28cd823d49045135624a6cfe964112fe822b374", executable: executables.batch2Executable24 },
  { moduleId: "delivery.pattern.wave", version: "1.0.0", envelopeSha256: "c77e056490c68c92f389cae1d393defd86f5935526dba35eb5fe1bfc2b79f96f", implementationId: "delivery.pattern.wave.v1", manifestSchemaVersion: "1.3.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "16f66d0ab9c14e7637339d3b7a3311fa8748c06897d1e6ab843763f74d92e3c7", executable: executables.batch2Executable25 },
  { moduleId: "delivery.pattern.rain", version: "1.0.0", envelopeSha256: "b145602609e3fbdaafba29c462c0d413b31e683aa1e1cc2295c2a6aae532cae2", implementationId: "delivery.pattern.rain.v1", manifestSchemaVersion: "1.3.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "7d18188a54681eb2faa745be7f499737b4c273c640021f771585f9f89e88a84f", executable: executables.batch2Executable26 },
  { moduleId: "delivery.pattern.rotating-ring", version: "1.0.0", envelopeSha256: "86bf581abb3a6c59d424b26c850f1daa21ed76e1a0d7be9556225a89213b78a4", implementationId: "delivery.pattern.rotating-ring.v1", manifestSchemaVersion: "1.3.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "64fb9adebc218c0bd88ef0868f391b0db03b31027fe75c349f60ddfc59466523", executable: executables.batch2Executable27 },
  { moduleId: "delivery.pattern.burst", version: "1.0.0", envelopeSha256: "2a56feab9c802c3b412ccd5ee333ac2cff8105602d1baa63cdba5f4f2764f7ec", implementationId: "delivery.pattern.burst.v1", manifestSchemaVersion: "1.3.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "e3636b0ca0053eab242120ab3f924125a9b0abe2633b66837d9a2bdb40983c55", executable: executables.batch2Executable28 },
  { moduleId: "combat.invulnerability-window", version: "1.0.0", envelopeSha256: "7c3b7888c88a17411cf26e82eeb1255fc864477983dd435ac3a0eb4d7fc0d928", implementationId: "combat.invulnerability-window.v1", manifestSchemaVersion: "1.3.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "bf08e5040fb5f84b4998bc29232ccc1716d54f3956acb51a9f81073d84a0475a", executable: executables.batch2Executable29 },
  { moduleId: "combat.shield", version: "1.0.0", envelopeSha256: "813b6be5c8318b1c378caf59b12b28f0414f48d5ebe2d3f835f8ac535fe863ea", implementationId: "combat.shield.v1", manifestSchemaVersion: "1.3.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "01e39558217d0ff0f96923286f4518332fd4b9e6d3d9a065d447ca7e75fba251", executable: executables.batch2Executable30 },
  { moduleId: "combat.graze", version: "1.0.0", envelopeSha256: "4f3ad8edd30698d31eb2a55ab2ecdd0c029450275bb97e89905d4d3251523d9c", implementationId: "combat.graze.v1", manifestSchemaVersion: "1.3.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "397bbe572182884220dae7b630f2f0fe6c649d97764bbd848fd6f748bc0cd3d0", executable: executables.batch2Executable31 },
  { moduleId: "progression.pickup-spawn", version: "1.0.0", envelopeSha256: "2433b4f2e12f5ec73889eec9fbaa31160edc846607869c5aec16b177f8e023bc", implementationId: "progression.pickup-spawn.v1", manifestSchemaVersion: "1.3.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "99f88c33b947f4a9c54915461167b3bb5c079e5a793aaa72e61d9679aced5575", executable: executables.batch2Executable32 },
  { moduleId: "progression.pickup-collect", version: "1.0.0", envelopeSha256: "5ee4ec8cf9e4c73d331b08896f3fe36274b8787228f65db50582b9ecfcf21c63", implementationId: "progression.pickup-collect.v1", manifestSchemaVersion: "1.3.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "6eceb8861dae2f397f1792bf663b5c7a220d070e1a4aa3a158a05df1f8d03cf7", executable: executables.batch2Executable33 },
  { moduleId: "progression.modifier", version: "1.0.0", envelopeSha256: "22fec7ed42fb2d646cd5158ce9283b8d585e39f61b34d02d2c13eeb4706c32aa", implementationId: "progression.modifier.transform.v1", manifestSchemaVersion: "1.3.0", exportKind: "pickup-effect-plan-transform-v1", entryEvidenceId: "19137335bc55d570bbcffab314e0d7951e6686a051ce1de189a4a684bbed28fa", executable: executables.batch2Executable34 },
  { moduleId: "combat.health", version: "1.1.0", envelopeSha256: "dd72a85fda2a408eb0f229eb14db6999b9b984b45d16b00df2d676ef3362762e", implementationId: "combat.health.v1-1", manifestSchemaVersion: "1.3.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "377f7230f13bc06f4b9ab7d0a0758ba990b0352dea05fddf76936863d3a2bd63", executable: executables.batch2Executable35 },
  { moduleId: "interaction.projectile-contact", version: "1.1.0", envelopeSha256: "790081f65a1f295c78af5d5489678a675bbb59b5e04ecaa710bdad8851a18bc8", implementationId: "interaction.projectile-contact.v1-1", manifestSchemaVersion: "1.3.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "7347c0195e10a7be2b1d703a104824c3dfd641c9a0f426d1e496a41fa73092a0", executable: executables.batch2Executable36 },
  { moduleId: "interaction.contact-resolution", version: "1.1.0", envelopeSha256: "647206a93107cb0295a7d058b5b111cea63716e88b2c00fc50af0b09e113ef57", implementationId: "interaction.contact-resolution.v1-1", manifestSchemaVersion: "1.3.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "22b05da6a479e9d03a5c7130820dd69d5892bf76a84c6530715137f3c0b43c78", executable: executables.batch2Executable37 },
];

export const batch2ProgressionRuntimeCatalog = new BrowserGameModuleRuntimeCatalogV13({ catalogEvidenceId: batch2ProgressionGraph.catalogEvidenceId, entries });
