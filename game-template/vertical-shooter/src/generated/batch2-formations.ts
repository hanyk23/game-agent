// @ts-nocheck -- generated from production-ready Graph 1.3 artifacts
import { BrowserGameModuleRuntimeCatalogV13 } from "../../../../src/modules/game-module-runtime-catalog.js";
import type { ResolvedModuleGraphV13 } from "../../../../src/modules/game-module-resolver.js";
import * as executables from "./batch2-runtime.js";

export const batch2FormationGraphs = [
  {
    "graphVersion": "1.3.0",
    "assemblyId": "batch2.formation-spread",
    "kernelVersion": "1.0.0",
    "engine": {
      "id": "phaser",
      "version": "3.90.0"
    },
    "executionReadiness": {
      "status": "ready",
      "evidenceId": "dbe61b2f04d053f8c0f04809ab9e58ac95111bba22f1658ec2ab3676fe928eb9"
    },
    "catalogEvidenceId": "fe5585e6cc413ba8a370f475f218ba8ad13cac10311c589e0563fb462118b23e",
    "actors": [
      {
        "actorId": "player-one",
        "role": "player"
      },
      {
        "actorId": "enemy-one",
        "role": "enemy"
      }
    ],
    "modules": [
      {
        "instanceId": "aim",
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
        "instanceId": "arbiter",
        "ownerId": "player-one",
        "moduleId": "intent.movement-arbiter",
        "version": "1.0.0",
        "kind": "player-intent",
        "implementationId": "intent.movement-arbiter.v1",
        "configurationSchemaId": "intent.movement-arbiter.config",
        "configuration": {
          "policy": "touch-while-active-else-keyboard",
          "keyboardSourceId": "keyboard",
          "touchSourceId": "touch"
        },
        "manifestSchemaVersion": "1.2.0",
        "instantiation": "production-eligible",
        "manifestSha256": "9d43ffcccd085ad78b3ff81bc2182f651117c33fd327a035aeb91ba46b0f4d33",
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
          "instanceLeases": 1,
          "graphLeases": 0
        },
        "artifactIdentity": {
          "schemaVersion": "1.0.0",
          "algorithm": "sha256",
          "envelopeFormat": "module-registration-envelope-v1",
          "manifestSha256": "9d43ffcccd085ad78b3ff81bc2182f651117c33fd327a035aeb91ba46b0f4d33",
          "configurationDescriptorSha256": "9e09d39adeba78199db1be2373cbcdd2e81c8f2a0dc5e00b2200ea42896ec7ba",
          "reservationDescriptorSha256": "a5dcc7a7281d264f7f5876e30d17c68628b8bcce2de3820debfd35b491640a8e",
          "implementationBundleSha256": "82db7e4096b0d2d491829be4fc60a4401c963513225a9be44cceb5c82bbda0c6",
          "dependencyLockSha256": "e3f942b24b5b515fecc068c475a193034b13a127e1da280cea5b4ad14a03c78a",
          "toolchainIdentitySha256": "3f07da47c80fa46c2d89a7e064cd374ee726cf2c206c08dbfbe35326f9b04356",
          "envelopeSha256": "a46bcb6e7b257b0bdc9649aa34aad0c183df155b497d76e95db061e95f5785e1"
        },
        "factoryContextVersion": "1.2.0",
        "runtimeContract": {
          "update": null,
          "timerSlots": {
            "slotGroupId": "main"
          },
          "inputRegistrations": [],
          "observationReaders": [
            {
              "readerId": "arbitration"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [
            {
              "id": "commands",
              "payloadType": "movement-command-v1",
              "required": true,
              "multiple": true,
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
              "id": "resolved",
              "payloadType": "resolved-movement-command-v1",
              "delivery": "event"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [],
          "observationReaderIds": [
            "arbitration"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "02f001a3d921d7daa4a3c0facf2e4e8b40d839837621ac926de6b843666e144a"
      },
      {
        "instanceId": "attack-intent",
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
        "instanceId": "default-policy",
        "ownerId": "enemy-one",
        "moduleId": "interaction.contact-default-damage",
        "version": "1.0.0",
        "kind": "combat-interaction",
        "implementationId": "interaction.contact-default-damage.v1",
        "configurationSchemaId": "interaction.contact-default-damage.config",
        "configuration": {
          "damageKind": "projectile",
          "defaultDisposition": "damage",
          "defaultSourceOperation": "consume"
        },
        "manifestSchemaVersion": "1.2.0",
        "instantiation": "production-eligible",
        "manifestSha256": "a3ac7549ae42c55a26596c3da80afce9d565d7dd53bc135ade5e6a4e1a72c268",
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
          "manifestSha256": "a3ac7549ae42c55a26596c3da80afce9d565d7dd53bc135ade5e6a4e1a72c268",
          "configurationDescriptorSha256": "00943acb6e746288ff8a7fc6c677309793357849fbf008b1c1b380b0c2950eec",
          "reservationDescriptorSha256": "703c43c468c12d92643fa16af0e86c3d483d08cd499b63d76fa95bf9b399c019",
          "implementationBundleSha256": "f7aa1b981073d2e11feed1f7e7690f8a1ade75ccabd6ab6b8d4c9b29c8dc946a",
          "dependencyLockSha256": "e3f942b24b5b515fecc068c475a193034b13a127e1da280cea5b4ad14a03c78a",
          "toolchainIdentitySha256": "3f07da47c80fa46c2d89a7e064cd374ee726cf2c206c08dbfbe35326f9b04356",
          "envelopeSha256": "435387a883a4ee3a09c15ea334056be0ca7e49989e5e5177847d2c066e4b3514"
        },
        "factoryContextVersion": "1.2.0",
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
        "catalogEntryEvidenceId": "d7020b6df92e644270d1b51397bd4fa09885c97138927afcf2f97884d284ee76"
      },
      {
        "instanceId": "delivery",
        "ownerId": "player-one",
        "moduleId": "delivery.spread",
        "version": "1.0.0",
        "kind": "attack-delivery",
        "implementationId": "delivery.spread.v1",
        "configurationSchemaId": "delivery.spread.config",
        "configuration": {
          "attackChannelId": "player.primary",
          "baseCount": 3,
          "speed": 600,
          "baseDamage": 10,
          "textureRole": "player-projectile",
          "spawnOffset": {
            "x": 0,
            "y": -28
          },
          "maxActive": 16,
          "maximumAcceptedRequestsPerSecond": 10,
          "maximumCountBonus": 1,
          "maximumDamageMultiplier": 2,
          "recycleMargin": 32,
          "exhaustionPolicy": "drop-and-observe",
          "totalArcDegrees": 20,
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
          "activeEntities": 16,
          "activeProjectiles": 16,
          "spawnsPerSecond": 40,
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
        "instanceId": "detector",
        "ownerId": "enemy-one",
        "moduleId": "interaction.projectile-contact",
        "version": "1.1.0",
        "kind": "combat-interaction",
        "implementationId": "interaction.projectile-contact.v1-1",
        "configurationSchemaId": "interaction.projectile-contact.config",
        "configuration": {
          "sourceEntityRole": "projectile",
          "targetActorRole": "enemy",
          "maximumTrackedContacts": 64
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "a0ef6b9ec62ee0a0024baaa27c1da58a1223fca144a0522f457f048c2bff2c3c",
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
          "manifestSha256": "a0ef6b9ec62ee0a0024baaa27c1da58a1223fca144a0522f457f048c2bff2c3c",
          "configurationDescriptorSha256": "48426de270d5cbf02a8a961a77a90525bddfa11100a260581393becce7c3b31e",
          "reservationDescriptorSha256": "b37389b46ed44dbce09e7dbb2ddf633a1d991a6427731f1c225d4b7c42754fa7",
          "implementationBundleSha256": "a7b7703e206df2501a9a3feb60a815e7051362f046ad35dd6a2b39e8fdde0285",
          "dependencyLockSha256": "3114db68a63f8cc7a5f8d6681980c6d48d25719a43a53f4df02dae977f348f15",
          "toolchainIdentitySha256": "35fe5f84f10587932b8d6b182469ac64fddb54bf4a6b06cd46d970c20ed4ab54",
          "envelopeSha256": "790081f65a1f295c78af5d5489678a675bbb59b5e04ecaa710bdad8851a18bc8"
        },
        "factoryContextVersion": "1.3.0",
        "runtimeContract": {
          "update": {
            "mode": "graph-frame-v1",
            "registrationId": "contact.update"
          },
          "timerSlots": {
            "slotGroupId": "main"
          },
          "inputRegistrations": [],
          "observationReaders": [
            {
              "readerId": "contacts"
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
                  "player",
                  "enemy",
                  "boss"
                ],
                "targetActorRoles": [
                  "player",
                  "enemy",
                  "boss"
                ],
                "sourceEntityRoles": [
                  "projectile"
                ]
              }
            }
          ],
          "outputPorts": [
            {
              "id": "candidate",
              "payloadType": "contact-candidate-v1",
              "delivery": "event"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [],
          "observationReaderIds": [
            "contacts"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": [],
          "overlapRuleId": "projectile.overlap"
        },
        "catalogEntryEvidenceId": "7347c0195e10a7be2b1d703a104824c3dfd641c9a0f426d1e496a41fa73092a0"
      },
      {
        "instanceId": "focus",
        "ownerId": "player-one",
        "moduleId": "intent.focus",
        "version": "1.0.0",
        "kind": "player-intent",
        "implementationId": "intent.focus.v1",
        "configurationSchemaId": "intent.focus.config",
        "configuration": {
          "device": "keyboard",
          "control": "ShiftLeft",
          "initialFocused": false
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "aacb922e96b26e55426cfd454b8bbb54ebe987c894b7a4f362e8092ffebe6792",
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
          "manifestSha256": "aacb922e96b26e55426cfd454b8bbb54ebe987c894b7a4f362e8092ffebe6792",
          "configurationDescriptorSha256": "b4151a58965ec35b2463dc7d11b3d4a1ba48a96e95889856ca30a06003b0f14e",
          "reservationDescriptorSha256": "bb684f2c92d8fef75f30a599bac371807de81d63d040936e472830c3072d39d6",
          "implementationBundleSha256": "aca82a0d51b7a0bb9c2f1b0aee52ddf5bee64c9fb277abceb33398d9b7289847",
          "dependencyLockSha256": "5b498deec049fe835a9f07056297b89515949bc723867821f92110a0ab04db55",
          "toolchainIdentitySha256": "9a149b74eaf8e88bea1c3f4aa0a166ce306dcf155781bdb1a48e5ad05d22e735",
          "envelopeSha256": "95fb5f3bcff3dac4262d9b9054a59f2e303657e445d4f230f1ef3e819d0afa3e"
        },
        "factoryContextVersion": "1.3.0",
        "runtimeContract": {
          "update": null,
          "timerSlots": {
            "slotGroupId": "main"
          },
          "inputRegistrations": [
            {
              "registrationId": "focus.keyboard",
              "kind": "keyboard"
            }
          ],
          "observationReaders": [
            {
              "readerId": "focus"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [],
          "outputPorts": [
            {
              "id": "focus",
              "payloadType": "focus-state-v1",
              "delivery": "state"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [
            "focus.keyboard"
          ],
          "observationReaderIds": [
            "focus"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "23e74a23b5bf7fe53d7ce537dc39ddaeea9b12c0cf8ba0fe5533fba082d20387"
      },
      {
        "instanceId": "focus-speed",
        "ownerId": "player-one",
        "moduleId": "locomotion.focus-speed",
        "version": "1.0.0",
        "kind": "locomotion",
        "implementationId": "locomotion.focus-speed.v1",
        "configurationSchemaId": "locomotion.focus-speed.config",
        "configuration": {
          "multiplier": 0.5,
          "releaseBehavior": "restore"
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "8838f8fe9118c00d243f8d07e01b72fcb1eda0b959a91440930c8f03e975cc20",
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
          "instanceLeases": 3,
          "graphLeases": 0
        },
        "artifactIdentity": {
          "schemaVersion": "1.0.0",
          "algorithm": "sha256",
          "envelopeFormat": "module-registration-envelope-v1",
          "manifestSha256": "8838f8fe9118c00d243f8d07e01b72fcb1eda0b959a91440930c8f03e975cc20",
          "configurationDescriptorSha256": "fb5200ee9a2516b39444b304128e8795afdf6033e8ff6e5c17215c579fc823df",
          "reservationDescriptorSha256": "cb6d1c270296c65cd1dc255f6d8878574369b3d9c6dbc0eefce3f7a00a0184ef",
          "implementationBundleSha256": "20e61c459007c50f75fca426c84cf2cc33f323d940fadc5877b78008e0e32f94",
          "dependencyLockSha256": "5b498deec049fe835a9f07056297b89515949bc723867821f92110a0ab04db55",
          "toolchainIdentitySha256": "9a149b74eaf8e88bea1c3f4aa0a166ce306dcf155781bdb1a48e5ad05d22e735",
          "envelopeSha256": "b3876bcfbeb935e08ad14d31e5f8b404fca9612ac423ba951745db88543b8b80"
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
              "readerId": "scale"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [
            {
              "id": "focus",
              "payloadType": "focus-state-v1",
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
              "id": "scale",
              "payloadType": "movement-scale-v1",
              "delivery": "state"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [],
          "observationReaderIds": [
            "scale"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "28dce4daad405345fb8cca1b45e0b010ea80f43e6de68bb5bca668daf6a5b939"
      },
      {
        "instanceId": "health",
        "ownerId": "enemy-one",
        "moduleId": "combat.health",
        "version": "1.1.0",
        "kind": "combat-interaction",
        "implementationId": "combat.health.v1-1",
        "configurationSchemaId": "combat.health.config",
        "configuration": {
          "maxHealth": 100,
          "initialHealth": 100,
          "damageFloor": 0
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "fa44309ba0be253fd38eb2ddef9a561e51022b9fe0224a83bd2cbd843267b978",
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
          "manifestSha256": "fa44309ba0be253fd38eb2ddef9a561e51022b9fe0224a83bd2cbd843267b978",
          "configurationDescriptorSha256": "093319fcdda8033b14dc680866d669ecbeb2a504965ccb5b8fbda9d22b94ef78",
          "reservationDescriptorSha256": "61db0f8672eb0103417c04d5f8520c88f2767e115cfb49b25c90f20ee3bb9ac4",
          "implementationBundleSha256": "0cb86bf62b96da2f59bec176c24aafa96c2fc99a0320c83ead033ac391c9345b",
          "dependencyLockSha256": "3114db68a63f8cc7a5f8d6681980c6d48d25719a43a53f4df02dae977f348f15",
          "toolchainIdentitySha256": "35fe5f84f10587932b8d6b182469ac64fddb54bf4a6b06cd46d970c20ed4ab54",
          "envelopeSha256": "dd72a85fda2a408eb0f229eb14db6999b9b984b45d16b00df2d676ef3362762e"
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
              "readerId": "health"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [
            {
              "id": "damage",
              "payloadType": "damage-v1",
              "required": true,
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
            },
            {
              "id": "modifier",
              "payloadType": "modifier-application-v1",
              "required": false,
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
            }
          ],
          "outputPorts": [
            {
              "id": "state",
              "payloadType": "health-state-v2",
              "delivery": "state"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [],
          "observationReaderIds": [
            "health"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": [
            "combat.health.current"
          ]
        },
        "catalogEntryEvidenceId": "377f7230f13bc06f4b9ab7d0a0758ba990b0352dea05fddf76936863d3a2bd63"
      },
      {
        "instanceId": "keyboard",
        "ownerId": "player-one",
        "moduleId": "intent.keyboard-movement",
        "version": "1.0.0",
        "kind": "player-intent",
        "implementationId": "intent.keyboard-movement.v1",
        "configurationSchemaId": "intent.keyboard-movement.config",
        "configuration": {
          "bindings": "arrows-and-wasd",
          "normalizeDiagonal": true,
          "emitNeutral": true
        },
        "manifestSchemaVersion": "1.2.0",
        "instantiation": "production-eligible",
        "manifestSha256": "e7e44de719a3683b6d9df4ab640e2381a320948bf374a72f7d4a77214415afb9",
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
          "manifestSha256": "e7e44de719a3683b6d9df4ab640e2381a320948bf374a72f7d4a77214415afb9",
          "configurationDescriptorSha256": "9b015e9b8889308b15831199a276d85e979783081ccc9110ca0a879f143bfc38",
          "reservationDescriptorSha256": "38d096bdc34753c5e32889205da48f25511978a621498733181be8a6dc0c6d1d",
          "implementationBundleSha256": "eb83666306347da2410859d3c907152d91e562e6530403a44f843f88dcd4fd7a",
          "dependencyLockSha256": "e3f942b24b5b515fecc068c475a193034b13a127e1da280cea5b4ad14a03c78a",
          "toolchainIdentitySha256": "3f07da47c80fa46c2d89a7e064cd374ee726cf2c206c08dbfbe35326f9b04356",
          "envelopeSha256": "4a2b9dc74b5c7beb16827b0a2e4c8f84256d5a12fa7de8dd7c54556bc501c11b"
        },
        "factoryContextVersion": "1.2.0",
        "runtimeContract": {
          "update": {
            "mode": "graph-frame-v1",
            "registrationId": "keyboard.update"
          },
          "timerSlots": {
            "slotGroupId": "main"
          },
          "inputRegistrations": [
            {
              "registrationId": "keyboard.direction",
              "kind": "keyboard"
            }
          ],
          "observationReaders": [
            {
              "readerId": "movement"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [],
          "outputPorts": [
            {
              "id": "command",
              "payloadType": "movement-command-v1",
              "delivery": "event"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [
            "keyboard.direction"
          ],
          "observationReaderIds": [
            "movement"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "63839ea8e495dab883c5c83d89808fa34f78ffac04eb44bd78fd12dc58f31d7d"
      },
      {
        "instanceId": "locomotion",
        "ownerId": "player-one",
        "moduleId": "locomotion.bounded",
        "version": "1.1.0",
        "kind": "locomotion",
        "implementationId": "locomotion.bounded.v1-1",
        "configurationSchemaId": "locomotion.bounded.config",
        "configuration": {
          "moveSpeed": 300,
          "bounds": {
            "left": 24,
            "right": 24,
            "top": 24,
            "bottom": 24
          },
          "absoluteMode": "clamp",
          "neutralMode": "zero-velocity"
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "a064dd75d018415059aa4934070bc1ea84009496244742bc9fefccaacf896ccf",
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
          "manifestSha256": "a064dd75d018415059aa4934070bc1ea84009496244742bc9fefccaacf896ccf",
          "configurationDescriptorSha256": "e4725e41c7da63bf4b8d3ca8a1a2c760673c1118f6be73f738f9af2836e7da0d",
          "reservationDescriptorSha256": "9c26433d8dcef54b1fa5cdea3d00c4a4d9a69bfbbed3ce3a37e42b47f8fc1b6f",
          "implementationBundleSha256": "0e2845f8c730f9b32bafca109867b41c912c19d83f71f914c6dcc323f8338921",
          "dependencyLockSha256": "5b498deec049fe835a9f07056297b89515949bc723867821f92110a0ab04db55",
          "toolchainIdentitySha256": "9a149b74eaf8e88bea1c3f4aa0a166ce306dcf155781bdb1a48e5ad05d22e735",
          "envelopeSha256": "4692ccb19733c57887102925be074d83dabcb73a6e990316e9ce9238c543723a"
        },
        "factoryContextVersion": "1.3.0",
        "runtimeContract": {
          "update": {
            "mode": "graph-frame-v1",
            "registrationId": "motion.update"
          },
          "timerSlots": {
            "slotGroupId": "main"
          },
          "inputRegistrations": [],
          "observationReaders": [
            {
              "readerId": "motion"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [
            {
              "id": "command",
              "payloadType": "resolved-movement-command-v1",
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
            },
            {
              "id": "speed-scale",
              "payloadType": "movement-scale-v1",
              "required": false,
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
          "outputPorts": []
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [],
          "observationReaderIds": [
            "motion"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "54570dd840659201eb0e0487d1dc3a7450d95707a7a8be5981f6f5e44dc4dc6b"
      },
      {
        "instanceId": "resolver",
        "ownerId": "enemy-one",
        "moduleId": "interaction.contact-resolution",
        "version": "1.1.0",
        "kind": "combat-interaction",
        "implementationId": "interaction.contact-resolution.v1-1",
        "configurationSchemaId": "interaction.contact-resolution.config",
        "configuration": {
          "policyProfileId": "batch1.default-damage",
          "policyProfileVersion": "1.0.0",
          "allowedDispositions": [
            "damage"
          ],
          "allowedSourceOperations": [
            "consume"
          ],
          "maxResolvedContacts": 64
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "fd7874b237bdb82a08b76f25ba4fb575c10d778bcb844a01aa428bc11b1c1d94",
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
          "instanceLeases": 3,
          "graphLeases": 0
        },
        "artifactIdentity": {
          "schemaVersion": "1.0.0",
          "algorithm": "sha256",
          "envelopeFormat": "module-registration-envelope-v1",
          "manifestSha256": "fd7874b237bdb82a08b76f25ba4fb575c10d778bcb844a01aa428bc11b1c1d94",
          "configurationDescriptorSha256": "8dee45e6761b65725a6adc566cc6834f9af91f30b8c8c3fd5d38fb59e5ff7dae",
          "reservationDescriptorSha256": "7cf892a61da8a880ffba09458f29d1af48fed6f003a146745d004027f4dfdc0a",
          "implementationBundleSha256": "6d682a724fe9c695b8ff0901d232517356c9169423f0c0121a7a37800c8a0481",
          "dependencyLockSha256": "3114db68a63f8cc7a5f8d6681980c6d48d25719a43a53f4df02dae977f348f15",
          "toolchainIdentitySha256": "35fe5f84f10587932b8d6b182469ac64fddb54bf4a6b06cd46d970c20ed4ab54",
          "envelopeSha256": "647206a93107cb0295a7d058b5b111cea63716e88b2c00fc50af0b09e113ef57"
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
              "readerId": "resolution"
            }
          ],
          "contactCommit": {
            "commitServiceId": "contact.commit",
            "maximumConcurrentCommits": 4,
            "admittedOperations": [
              "consume"
            ]
          }
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
                  "player",
                  "enemy",
                  "boss"
                ],
                "targetActorRoles": [
                  "player",
                  "enemy",
                  "boss"
                ],
                "sourceEntityRoles": [
                  "projectile"
                ]
              }
            },
            {
              "id": "candidate",
              "payloadType": "contact-candidate-v1",
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
            }
          ],
          "outputPorts": [
            {
              "id": "hit",
              "payloadType": "hit-v1",
              "delivery": "event"
            },
            {
              "id": "damage",
              "payloadType": "damage-v1",
              "delivery": "event"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [],
          "observationReaderIds": [
            "resolution"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "22b05da6a479e9d03a5c7130820dd69d5892bf76a84c6530715137f3c0b43c78"
      },
      {
        "instanceId": "targeting",
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
        "instanceId": "touch",
        "ownerId": "player-one",
        "moduleId": "intent.touch-drag",
        "version": "1.0.0",
        "kind": "player-intent",
        "implementationId": "intent.touch-drag.v1",
        "configurationSchemaId": "intent.touch-drag.config",
        "configuration": {
          "capture": "first-active",
          "release": "matching-pointer-up",
          "emitOnDown": false
        },
        "manifestSchemaVersion": "1.2.0",
        "instantiation": "production-eligible",
        "manifestSha256": "f18da1c54d0964e2b442d53c54c21560cbe820a7687cefd23c334038b2e4f2e9",
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
          "manifestSha256": "f18da1c54d0964e2b442d53c54c21560cbe820a7687cefd23c334038b2e4f2e9",
          "configurationDescriptorSha256": "8884fbaace9900b8cce6b689e3fc433524be19ded3d22f20caa930b5846d05b1",
          "reservationDescriptorSha256": "c5005923973583d38c4cec38d2578c3a33856fe3f1ebb6b2614a4be9922b84ee",
          "implementationBundleSha256": "aa5102bd10a4d35b822eb8505de712d493f496f1de72a9edf481ce334633e12f",
          "dependencyLockSha256": "e3f942b24b5b515fecc068c475a193034b13a127e1da280cea5b4ad14a03c78a",
          "toolchainIdentitySha256": "3f07da47c80fa46c2d89a7e064cd374ee726cf2c206c08dbfbe35326f9b04356",
          "envelopeSha256": "6b0f163881d2b3ffce945bacd5499eba9b85ea046021749b234b8256ec44cf90"
        },
        "factoryContextVersion": "1.2.0",
        "runtimeContract": {
          "update": null,
          "timerSlots": {
            "slotGroupId": "main"
          },
          "inputRegistrations": [
            {
              "registrationId": "pointer.down",
              "kind": "pointer-down"
            },
            {
              "registrationId": "pointer.move",
              "kind": "pointer-move"
            },
            {
              "registrationId": "pointer.up",
              "kind": "pointer-up"
            }
          ],
          "observationReaders": [
            {
              "readerId": "movement"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [],
          "outputPorts": [
            {
              "id": "command",
              "payloadType": "movement-command-v1",
              "delivery": "event"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [
            "pointer.down",
            "pointer.move",
            "pointer.up"
          ],
          "observationReaderIds": [
            "movement"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "4cdbcb36531f8cf15ada2f1263d5e96cc4e80b3c4ed2bcf27dbfae98c03a4faa"
      },
      {
        "instanceId": "trigger",
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
        "from": "arbiter",
        "to": "keyboard",
        "capabilityId": "intent.movement-source",
        "scope": "owner"
      },
      {
        "from": "arbiter",
        "to": "touch",
        "capabilityId": "intent.movement-source",
        "scope": "owner"
      },
      {
        "from": "delivery",
        "to": "targeting",
        "capabilityId": "targeting.solution-v2",
        "scope": "owner"
      },
      {
        "from": "delivery",
        "to": "trigger",
        "capabilityId": "trigger.attack-v2",
        "scope": "owner"
      },
      {
        "from": "detector",
        "to": "delivery",
        "capabilityId": "delivery.projectile-channel",
        "scope": "assembly"
      },
      {
        "from": "focus-speed",
        "to": "focus",
        "capabilityId": "intent.focus-source",
        "scope": "owner"
      },
      {
        "from": "locomotion",
        "to": "arbiter",
        "capabilityId": "intent.movement-resolved",
        "scope": "owner"
      },
      {
        "from": "resolver",
        "to": "detector",
        "capabilityId": "interaction.projectile-contact-candidate",
        "scope": "owner"
      },
      {
        "from": "resolver",
        "to": "health",
        "capabilityId": "combat.damage-sink",
        "scope": "owner"
      },
      {
        "from": "targeting",
        "to": "aim",
        "capabilityId": "intent.aim-source",
        "scope": "owner"
      },
      {
        "from": "trigger",
        "to": "attack-intent",
        "capabilityId": "intent.attack-source",
        "scope": "owner"
      }
    ],
    "bindings": [
      {
        "from": {
          "instanceId": "aim",
          "portId": "aim"
        },
        "to": {
          "instanceId": "targeting",
          "portId": "aim"
        },
        "payloadType": "aim-command-v1",
        "delivery": "state"
      },
      {
        "from": {
          "instanceId": "arbiter",
          "portId": "resolved"
        },
        "to": {
          "instanceId": "locomotion",
          "portId": "command"
        },
        "payloadType": "resolved-movement-command-v1",
        "delivery": "event"
      },
      {
        "from": {
          "instanceId": "attack-intent",
          "portId": "intent"
        },
        "to": {
          "instanceId": "trigger",
          "portId": "intent"
        },
        "payloadType": "attack-intent-v1",
        "delivery": "event"
      },
      {
        "from": {
          "instanceId": "delivery",
          "portId": "projectiles"
        },
        "to": {
          "instanceId": "detector",
          "portId": "sources"
        },
        "payloadType": "entity-channel-v1",
        "delivery": "state"
      },
      {
        "from": {
          "instanceId": "delivery",
          "portId": "projectiles"
        },
        "to": {
          "instanceId": "resolver",
          "portId": "sources"
        },
        "payloadType": "entity-channel-v1",
        "delivery": "state"
      },
      {
        "from": {
          "instanceId": "detector",
          "portId": "candidate"
        },
        "to": {
          "instanceId": "resolver",
          "portId": "candidate"
        },
        "payloadType": "contact-candidate-v1",
        "delivery": "event"
      },
      {
        "from": {
          "instanceId": "focus",
          "portId": "focus"
        },
        "to": {
          "instanceId": "focus-speed",
          "portId": "focus"
        },
        "payloadType": "focus-state-v1",
        "delivery": "state"
      },
      {
        "from": {
          "instanceId": "focus-speed",
          "portId": "scale"
        },
        "to": {
          "instanceId": "locomotion",
          "portId": "speed-scale"
        },
        "payloadType": "movement-scale-v1",
        "delivery": "state"
      },
      {
        "from": {
          "instanceId": "keyboard",
          "portId": "command"
        },
        "to": {
          "instanceId": "arbiter",
          "portId": "commands"
        },
        "payloadType": "movement-command-v1",
        "delivery": "event"
      },
      {
        "from": {
          "instanceId": "resolver",
          "portId": "damage"
        },
        "to": {
          "instanceId": "health",
          "portId": "damage"
        },
        "payloadType": "damage-v1",
        "delivery": "event"
      },
      {
        "from": {
          "instanceId": "targeting",
          "portId": "selection"
        },
        "to": {
          "instanceId": "delivery",
          "portId": "target"
        },
        "payloadType": "target-solution-v1",
        "delivery": "state"
      },
      {
        "from": {
          "instanceId": "touch",
          "portId": "command"
        },
        "to": {
          "instanceId": "arbiter",
          "portId": "commands"
        },
        "payloadType": "movement-command-v1",
        "delivery": "event"
      },
      {
        "from": {
          "instanceId": "trigger",
          "portId": "request"
        },
        "to": {
          "instanceId": "delivery",
          "portId": "request"
        },
        "payloadType": "attack-request-v2",
        "delivery": "event"
      }
    ],
    "constructionOrder": [
      "aim",
      "keyboard",
      "touch",
      "arbiter",
      "attack-intent",
      "default-policy",
      "targeting",
      "trigger",
      "delivery",
      "detector",
      "focus",
      "focus-speed",
      "health",
      "locomotion",
      "resolver"
    ],
    "assetBindings": [
      {
        "bindingId": "player-projectile",
        "roleId": "player-projectile",
        "category": "projectile",
        "runtimeSha256": "2222222222222222222222222222222222222222222222222222222222222222",
        "textureKey": "module/2222222222222222222222222222222222222222222222222222222222222222/player-projectile",
        "sharing": "instance",
        "consumerInstanceIds": [
          "delivery"
        ]
      }
    ],
    "contactPolicyProfiles": [
      {
        "consumerInstanceId": "resolver",
        "profileId": "batch1.default-damage",
        "version": "1.0.0",
        "evidenceHash": "fe907b71f1b56c3f1e75b13008376413fe41eb5e50d760f76707bb174dd9b818",
        "supportedChainEvidenceId": "batch1.default-damage.chain",
        "orderedPolicyInstanceIds": [
          "default-policy"
        ],
        "orderedPolicyArtifactHashes": [
          "435387a883a4ee3a09c15ea334056be0ca7e49989e5e5177847d2c066e4b3514"
        ]
      }
    ],
    "damageSinkRoutes": [
      {
        "ownerId": "enemy-one",
        "headInstanceId": "health",
        "orderedSinkInstanceIds": [
          "health"
        ],
        "terminalHealthInstanceId": "health",
        "producerInstanceIds": [
          "resolver"
        ]
      }
    ],
    "entityChannels": [
      {
        "channelId": "delivery.projectiles",
        "localChannelId": "projectiles",
        "ownerInstanceId": "delivery",
        "ownerActorId": "player-one",
        "outputPort": "projectiles",
        "entityRole": "projectile",
        "capacity": 16,
        "capacityResources": [
          "activeEntities",
          "activeProjectiles"
        ],
        "readerInstanceIds": [
          "detector",
          "resolver"
        ],
        "sourceArtifactEnvelopeSha256": "9ee73cbeff668f45737598a0ddd31bb89cc4d09119fd18bc508ef646c525ae58"
      }
    ],
    "entityMutationGrants": [
      {
        "grantId": "resolver.projectile.consume",
        "accessId": "projectile.consume",
        "granteeInstanceId": "resolver",
        "channelId": "delivery.projectiles",
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
        "targetingInstanceId": "targeting",
        "triggerInstanceId": "trigger",
        "deliveryInstanceId": "delivery",
        "targetBinding": {
          "from": {
            "instanceId": "targeting",
            "portId": "selection"
          },
          "to": {
            "instanceId": "delivery",
            "portId": "target"
          },
          "payloadType": "target-solution-v1",
          "delivery": "state"
        },
        "requestBinding": {
          "from": {
            "instanceId": "trigger",
            "portId": "request"
          },
          "to": {
            "instanceId": "delivery",
            "portId": "request"
          },
          "payloadType": "attack-request-v2",
          "delivery": "event"
        }
      }
    ],
    "projectileChannelLineages": [
      {
        "lineageId": "detector/projectile-lineage/delivery.projectiles",
        "providerInstanceId": "delivery",
        "providerCapabilityId": "delivery.projectile-channel",
        "sourceBinding": {
          "from": {
            "instanceId": "delivery",
            "portId": "projectiles"
          },
          "to": {
            "instanceId": "detector",
            "portId": "sources"
          },
          "payloadType": "entity-channel-v1",
          "delivery": "state"
        },
        "channelId": "delivery.projectiles",
        "channelOutputPort": "projectiles",
        "consumerInstanceId": "detector",
        "consumerInputPort": "sources"
      }
    ],
    "effectApplicationRoutes": [],
    "pickupEffectPlans": [],
    "projectileBudgetContention": {
      "budget": {
        "activeProjectiles": 16,
        "spawnsPerSecond": 40
      },
      "totals": {
        "activeProjectiles": 16,
        "spawnsPerSecond": 40
      },
      "orderedOwners": [
        {
          "resolvedOrder": 8,
          "instanceId": "delivery",
          "ownerActorId": "player-one",
          "attackChannelId": "player.primary",
          "channelId": "delivery.projectiles",
          "poolId": "delivery.projectiles.pool",
          "activeProjectiles": 16,
          "spawnsPerSecond": 40,
          "cumulativeActiveProjectiles": 16,
          "cumulativeSpawnsPerSecond": 40
        }
      ]
    },
    "resourceTotals": {
      "activeEntities": 16,
      "activeProjectiles": 16,
      "spawnsPerSecond": 40,
      "timers": 0
    }
  },
  {
    "graphVersion": "1.3.0",
    "assemblyId": "batch2.formation-multi-shot",
    "kernelVersion": "1.0.0",
    "engine": {
      "id": "phaser",
      "version": "3.90.0"
    },
    "executionReadiness": {
      "status": "ready",
      "evidenceId": "9c142b5aa7b6a9bb08fc6e7bfd283e496068ef4340ca75b083c3d121f023a40c"
    },
    "catalogEvidenceId": "e63594d06b4aacd0e9e4e3618a81b85b85679e35ebcb20efcefc20995a1830a8",
    "actors": [
      {
        "actorId": "player-one",
        "role": "player"
      },
      {
        "actorId": "enemy-one",
        "role": "enemy"
      }
    ],
    "modules": [
      {
        "instanceId": "aim",
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
        "instanceId": "arbiter",
        "ownerId": "player-one",
        "moduleId": "intent.movement-arbiter",
        "version": "1.0.0",
        "kind": "player-intent",
        "implementationId": "intent.movement-arbiter.v1",
        "configurationSchemaId": "intent.movement-arbiter.config",
        "configuration": {
          "policy": "touch-while-active-else-keyboard",
          "keyboardSourceId": "keyboard",
          "touchSourceId": "touch"
        },
        "manifestSchemaVersion": "1.2.0",
        "instantiation": "production-eligible",
        "manifestSha256": "9d43ffcccd085ad78b3ff81bc2182f651117c33fd327a035aeb91ba46b0f4d33",
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
          "instanceLeases": 1,
          "graphLeases": 0
        },
        "artifactIdentity": {
          "schemaVersion": "1.0.0",
          "algorithm": "sha256",
          "envelopeFormat": "module-registration-envelope-v1",
          "manifestSha256": "9d43ffcccd085ad78b3ff81bc2182f651117c33fd327a035aeb91ba46b0f4d33",
          "configurationDescriptorSha256": "9e09d39adeba78199db1be2373cbcdd2e81c8f2a0dc5e00b2200ea42896ec7ba",
          "reservationDescriptorSha256": "a5dcc7a7281d264f7f5876e30d17c68628b8bcce2de3820debfd35b491640a8e",
          "implementationBundleSha256": "82db7e4096b0d2d491829be4fc60a4401c963513225a9be44cceb5c82bbda0c6",
          "dependencyLockSha256": "e3f942b24b5b515fecc068c475a193034b13a127e1da280cea5b4ad14a03c78a",
          "toolchainIdentitySha256": "3f07da47c80fa46c2d89a7e064cd374ee726cf2c206c08dbfbe35326f9b04356",
          "envelopeSha256": "a46bcb6e7b257b0bdc9649aa34aad0c183df155b497d76e95db061e95f5785e1"
        },
        "factoryContextVersion": "1.2.0",
        "runtimeContract": {
          "update": null,
          "timerSlots": {
            "slotGroupId": "main"
          },
          "inputRegistrations": [],
          "observationReaders": [
            {
              "readerId": "arbitration"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [
            {
              "id": "commands",
              "payloadType": "movement-command-v1",
              "required": true,
              "multiple": true,
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
              "id": "resolved",
              "payloadType": "resolved-movement-command-v1",
              "delivery": "event"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [],
          "observationReaderIds": [
            "arbitration"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "02f001a3d921d7daa4a3c0facf2e4e8b40d839837621ac926de6b843666e144a"
      },
      {
        "instanceId": "attack-intent",
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
        "instanceId": "default-policy",
        "ownerId": "enemy-one",
        "moduleId": "interaction.contact-default-damage",
        "version": "1.0.0",
        "kind": "combat-interaction",
        "implementationId": "interaction.contact-default-damage.v1",
        "configurationSchemaId": "interaction.contact-default-damage.config",
        "configuration": {
          "damageKind": "projectile",
          "defaultDisposition": "damage",
          "defaultSourceOperation": "consume"
        },
        "manifestSchemaVersion": "1.2.0",
        "instantiation": "production-eligible",
        "manifestSha256": "a3ac7549ae42c55a26596c3da80afce9d565d7dd53bc135ade5e6a4e1a72c268",
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
          "manifestSha256": "a3ac7549ae42c55a26596c3da80afce9d565d7dd53bc135ade5e6a4e1a72c268",
          "configurationDescriptorSha256": "00943acb6e746288ff8a7fc6c677309793357849fbf008b1c1b380b0c2950eec",
          "reservationDescriptorSha256": "703c43c468c12d92643fa16af0e86c3d483d08cd499b63d76fa95bf9b399c019",
          "implementationBundleSha256": "f7aa1b981073d2e11feed1f7e7690f8a1ade75ccabd6ab6b8d4c9b29c8dc946a",
          "dependencyLockSha256": "e3f942b24b5b515fecc068c475a193034b13a127e1da280cea5b4ad14a03c78a",
          "toolchainIdentitySha256": "3f07da47c80fa46c2d89a7e064cd374ee726cf2c206c08dbfbe35326f9b04356",
          "envelopeSha256": "435387a883a4ee3a09c15ea334056be0ca7e49989e5e5177847d2c066e4b3514"
        },
        "factoryContextVersion": "1.2.0",
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
        "catalogEntryEvidenceId": "d7020b6df92e644270d1b51397bd4fa09885c97138927afcf2f97884d284ee76"
      },
      {
        "instanceId": "delivery",
        "ownerId": "player-one",
        "moduleId": "delivery.multi-shot",
        "version": "1.0.0",
        "kind": "attack-delivery",
        "implementationId": "delivery.multi-shot.v1",
        "configurationSchemaId": "delivery.multi-shot.config",
        "configuration": {
          "attackChannelId": "player.primary",
          "baseCount": 3,
          "speed": 600,
          "baseDamage": 10,
          "textureRole": "player-projectile",
          "spawnOffset": {
            "x": 0,
            "y": -28
          },
          "maxActive": 16,
          "maximumAcceptedRequestsPerSecond": 10,
          "maximumCountBonus": 1,
          "maximumDamageMultiplier": 2,
          "recycleMargin": 32,
          "exhaustionPolicy": "drop-and-observe",
          "lateralSpacing": 12
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "f52dec620a5a859014ec3dfff05d08c6a25ae54c8b781c417e3fff36c53886ac",
        "resources": {
          "activeEntities": 256,
          "activeProjectiles": 256,
          "spawnsPerSecond": 2560,
          "timers": 0
        },
        "resourceGrant": {
          "activeEntities": 16,
          "activeProjectiles": 16,
          "spawnsPerSecond": 40,
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
          "manifestSha256": "f52dec620a5a859014ec3dfff05d08c6a25ae54c8b781c417e3fff36c53886ac",
          "configurationDescriptorSha256": "8658de5aa967ffea6b617ab3b7e0ce485952d3138a04220372bb0ad5bc0373be",
          "reservationDescriptorSha256": "e84395486242aa580d7ea2091dfd08602042601a63121ba47f24850f837238cb",
          "implementationBundleSha256": "e658387ae10c64775b4682e621368c9364d4aff41581168697666655e73b2d33",
          "dependencyLockSha256": "3a62cb4fa8c1835c5496c91fc4b6018ad52d0e2a9f7c6e03b05675f5f973cd0c",
          "toolchainIdentitySha256": "d36c05bbb20980385899dc98650138698cc54f619092b6d415a24983e56552d0",
          "envelopeSha256": "e7edd8d7fc4c5823b82dc2571c52a352c213b18ec3c6639f46b200d360cb3aef"
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
        "catalogEntryEvidenceId": "fd171c9cdfb8786578e5c0b7e05abb220346cb80ff6de48d68d3d93b678f385d"
      },
      {
        "instanceId": "detector",
        "ownerId": "enemy-one",
        "moduleId": "interaction.projectile-contact",
        "version": "1.1.0",
        "kind": "combat-interaction",
        "implementationId": "interaction.projectile-contact.v1-1",
        "configurationSchemaId": "interaction.projectile-contact.config",
        "configuration": {
          "sourceEntityRole": "projectile",
          "targetActorRole": "enemy",
          "maximumTrackedContacts": 64
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "a0ef6b9ec62ee0a0024baaa27c1da58a1223fca144a0522f457f048c2bff2c3c",
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
          "manifestSha256": "a0ef6b9ec62ee0a0024baaa27c1da58a1223fca144a0522f457f048c2bff2c3c",
          "configurationDescriptorSha256": "48426de270d5cbf02a8a961a77a90525bddfa11100a260581393becce7c3b31e",
          "reservationDescriptorSha256": "b37389b46ed44dbce09e7dbb2ddf633a1d991a6427731f1c225d4b7c42754fa7",
          "implementationBundleSha256": "a7b7703e206df2501a9a3feb60a815e7051362f046ad35dd6a2b39e8fdde0285",
          "dependencyLockSha256": "3114db68a63f8cc7a5f8d6681980c6d48d25719a43a53f4df02dae977f348f15",
          "toolchainIdentitySha256": "35fe5f84f10587932b8d6b182469ac64fddb54bf4a6b06cd46d970c20ed4ab54",
          "envelopeSha256": "790081f65a1f295c78af5d5489678a675bbb59b5e04ecaa710bdad8851a18bc8"
        },
        "factoryContextVersion": "1.3.0",
        "runtimeContract": {
          "update": {
            "mode": "graph-frame-v1",
            "registrationId": "contact.update"
          },
          "timerSlots": {
            "slotGroupId": "main"
          },
          "inputRegistrations": [],
          "observationReaders": [
            {
              "readerId": "contacts"
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
                  "player",
                  "enemy",
                  "boss"
                ],
                "targetActorRoles": [
                  "player",
                  "enemy",
                  "boss"
                ],
                "sourceEntityRoles": [
                  "projectile"
                ]
              }
            }
          ],
          "outputPorts": [
            {
              "id": "candidate",
              "payloadType": "contact-candidate-v1",
              "delivery": "event"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [],
          "observationReaderIds": [
            "contacts"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": [],
          "overlapRuleId": "projectile.overlap"
        },
        "catalogEntryEvidenceId": "7347c0195e10a7be2b1d703a104824c3dfd641c9a0f426d1e496a41fa73092a0"
      },
      {
        "instanceId": "focus",
        "ownerId": "player-one",
        "moduleId": "intent.focus",
        "version": "1.0.0",
        "kind": "player-intent",
        "implementationId": "intent.focus.v1",
        "configurationSchemaId": "intent.focus.config",
        "configuration": {
          "device": "keyboard",
          "control": "ShiftLeft",
          "initialFocused": false
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "aacb922e96b26e55426cfd454b8bbb54ebe987c894b7a4f362e8092ffebe6792",
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
          "manifestSha256": "aacb922e96b26e55426cfd454b8bbb54ebe987c894b7a4f362e8092ffebe6792",
          "configurationDescriptorSha256": "b4151a58965ec35b2463dc7d11b3d4a1ba48a96e95889856ca30a06003b0f14e",
          "reservationDescriptorSha256": "bb684f2c92d8fef75f30a599bac371807de81d63d040936e472830c3072d39d6",
          "implementationBundleSha256": "aca82a0d51b7a0bb9c2f1b0aee52ddf5bee64c9fb277abceb33398d9b7289847",
          "dependencyLockSha256": "5b498deec049fe835a9f07056297b89515949bc723867821f92110a0ab04db55",
          "toolchainIdentitySha256": "9a149b74eaf8e88bea1c3f4aa0a166ce306dcf155781bdb1a48e5ad05d22e735",
          "envelopeSha256": "95fb5f3bcff3dac4262d9b9054a59f2e303657e445d4f230f1ef3e819d0afa3e"
        },
        "factoryContextVersion": "1.3.0",
        "runtimeContract": {
          "update": null,
          "timerSlots": {
            "slotGroupId": "main"
          },
          "inputRegistrations": [
            {
              "registrationId": "focus.keyboard",
              "kind": "keyboard"
            }
          ],
          "observationReaders": [
            {
              "readerId": "focus"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [],
          "outputPorts": [
            {
              "id": "focus",
              "payloadType": "focus-state-v1",
              "delivery": "state"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [
            "focus.keyboard"
          ],
          "observationReaderIds": [
            "focus"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "23e74a23b5bf7fe53d7ce537dc39ddaeea9b12c0cf8ba0fe5533fba082d20387"
      },
      {
        "instanceId": "focus-speed",
        "ownerId": "player-one",
        "moduleId": "locomotion.focus-speed",
        "version": "1.0.0",
        "kind": "locomotion",
        "implementationId": "locomotion.focus-speed.v1",
        "configurationSchemaId": "locomotion.focus-speed.config",
        "configuration": {
          "multiplier": 0.5,
          "releaseBehavior": "restore"
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "8838f8fe9118c00d243f8d07e01b72fcb1eda0b959a91440930c8f03e975cc20",
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
          "instanceLeases": 3,
          "graphLeases": 0
        },
        "artifactIdentity": {
          "schemaVersion": "1.0.0",
          "algorithm": "sha256",
          "envelopeFormat": "module-registration-envelope-v1",
          "manifestSha256": "8838f8fe9118c00d243f8d07e01b72fcb1eda0b959a91440930c8f03e975cc20",
          "configurationDescriptorSha256": "fb5200ee9a2516b39444b304128e8795afdf6033e8ff6e5c17215c579fc823df",
          "reservationDescriptorSha256": "cb6d1c270296c65cd1dc255f6d8878574369b3d9c6dbc0eefce3f7a00a0184ef",
          "implementationBundleSha256": "20e61c459007c50f75fca426c84cf2cc33f323d940fadc5877b78008e0e32f94",
          "dependencyLockSha256": "5b498deec049fe835a9f07056297b89515949bc723867821f92110a0ab04db55",
          "toolchainIdentitySha256": "9a149b74eaf8e88bea1c3f4aa0a166ce306dcf155781bdb1a48e5ad05d22e735",
          "envelopeSha256": "b3876bcfbeb935e08ad14d31e5f8b404fca9612ac423ba951745db88543b8b80"
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
              "readerId": "scale"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [
            {
              "id": "focus",
              "payloadType": "focus-state-v1",
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
              "id": "scale",
              "payloadType": "movement-scale-v1",
              "delivery": "state"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [],
          "observationReaderIds": [
            "scale"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "28dce4daad405345fb8cca1b45e0b010ea80f43e6de68bb5bca668daf6a5b939"
      },
      {
        "instanceId": "health",
        "ownerId": "enemy-one",
        "moduleId": "combat.health",
        "version": "1.1.0",
        "kind": "combat-interaction",
        "implementationId": "combat.health.v1-1",
        "configurationSchemaId": "combat.health.config",
        "configuration": {
          "maxHealth": 100,
          "initialHealth": 100,
          "damageFloor": 0
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "fa44309ba0be253fd38eb2ddef9a561e51022b9fe0224a83bd2cbd843267b978",
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
          "manifestSha256": "fa44309ba0be253fd38eb2ddef9a561e51022b9fe0224a83bd2cbd843267b978",
          "configurationDescriptorSha256": "093319fcdda8033b14dc680866d669ecbeb2a504965ccb5b8fbda9d22b94ef78",
          "reservationDescriptorSha256": "61db0f8672eb0103417c04d5f8520c88f2767e115cfb49b25c90f20ee3bb9ac4",
          "implementationBundleSha256": "0cb86bf62b96da2f59bec176c24aafa96c2fc99a0320c83ead033ac391c9345b",
          "dependencyLockSha256": "3114db68a63f8cc7a5f8d6681980c6d48d25719a43a53f4df02dae977f348f15",
          "toolchainIdentitySha256": "35fe5f84f10587932b8d6b182469ac64fddb54bf4a6b06cd46d970c20ed4ab54",
          "envelopeSha256": "dd72a85fda2a408eb0f229eb14db6999b9b984b45d16b00df2d676ef3362762e"
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
              "readerId": "health"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [
            {
              "id": "damage",
              "payloadType": "damage-v1",
              "required": true,
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
            },
            {
              "id": "modifier",
              "payloadType": "modifier-application-v1",
              "required": false,
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
            }
          ],
          "outputPorts": [
            {
              "id": "state",
              "payloadType": "health-state-v2",
              "delivery": "state"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [],
          "observationReaderIds": [
            "health"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": [
            "combat.health.current"
          ]
        },
        "catalogEntryEvidenceId": "377f7230f13bc06f4b9ab7d0a0758ba990b0352dea05fddf76936863d3a2bd63"
      },
      {
        "instanceId": "keyboard",
        "ownerId": "player-one",
        "moduleId": "intent.keyboard-movement",
        "version": "1.0.0",
        "kind": "player-intent",
        "implementationId": "intent.keyboard-movement.v1",
        "configurationSchemaId": "intent.keyboard-movement.config",
        "configuration": {
          "bindings": "arrows-and-wasd",
          "normalizeDiagonal": true,
          "emitNeutral": true
        },
        "manifestSchemaVersion": "1.2.0",
        "instantiation": "production-eligible",
        "manifestSha256": "e7e44de719a3683b6d9df4ab640e2381a320948bf374a72f7d4a77214415afb9",
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
          "manifestSha256": "e7e44de719a3683b6d9df4ab640e2381a320948bf374a72f7d4a77214415afb9",
          "configurationDescriptorSha256": "9b015e9b8889308b15831199a276d85e979783081ccc9110ca0a879f143bfc38",
          "reservationDescriptorSha256": "38d096bdc34753c5e32889205da48f25511978a621498733181be8a6dc0c6d1d",
          "implementationBundleSha256": "eb83666306347da2410859d3c907152d91e562e6530403a44f843f88dcd4fd7a",
          "dependencyLockSha256": "e3f942b24b5b515fecc068c475a193034b13a127e1da280cea5b4ad14a03c78a",
          "toolchainIdentitySha256": "3f07da47c80fa46c2d89a7e064cd374ee726cf2c206c08dbfbe35326f9b04356",
          "envelopeSha256": "4a2b9dc74b5c7beb16827b0a2e4c8f84256d5a12fa7de8dd7c54556bc501c11b"
        },
        "factoryContextVersion": "1.2.0",
        "runtimeContract": {
          "update": {
            "mode": "graph-frame-v1",
            "registrationId": "keyboard.update"
          },
          "timerSlots": {
            "slotGroupId": "main"
          },
          "inputRegistrations": [
            {
              "registrationId": "keyboard.direction",
              "kind": "keyboard"
            }
          ],
          "observationReaders": [
            {
              "readerId": "movement"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [],
          "outputPorts": [
            {
              "id": "command",
              "payloadType": "movement-command-v1",
              "delivery": "event"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [
            "keyboard.direction"
          ],
          "observationReaderIds": [
            "movement"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "63839ea8e495dab883c5c83d89808fa34f78ffac04eb44bd78fd12dc58f31d7d"
      },
      {
        "instanceId": "locomotion",
        "ownerId": "player-one",
        "moduleId": "locomotion.bounded",
        "version": "1.1.0",
        "kind": "locomotion",
        "implementationId": "locomotion.bounded.v1-1",
        "configurationSchemaId": "locomotion.bounded.config",
        "configuration": {
          "moveSpeed": 300,
          "bounds": {
            "left": 24,
            "right": 24,
            "top": 24,
            "bottom": 24
          },
          "absoluteMode": "clamp",
          "neutralMode": "zero-velocity"
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "a064dd75d018415059aa4934070bc1ea84009496244742bc9fefccaacf896ccf",
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
          "manifestSha256": "a064dd75d018415059aa4934070bc1ea84009496244742bc9fefccaacf896ccf",
          "configurationDescriptorSha256": "e4725e41c7da63bf4b8d3ca8a1a2c760673c1118f6be73f738f9af2836e7da0d",
          "reservationDescriptorSha256": "9c26433d8dcef54b1fa5cdea3d00c4a4d9a69bfbbed3ce3a37e42b47f8fc1b6f",
          "implementationBundleSha256": "0e2845f8c730f9b32bafca109867b41c912c19d83f71f914c6dcc323f8338921",
          "dependencyLockSha256": "5b498deec049fe835a9f07056297b89515949bc723867821f92110a0ab04db55",
          "toolchainIdentitySha256": "9a149b74eaf8e88bea1c3f4aa0a166ce306dcf155781bdb1a48e5ad05d22e735",
          "envelopeSha256": "4692ccb19733c57887102925be074d83dabcb73a6e990316e9ce9238c543723a"
        },
        "factoryContextVersion": "1.3.0",
        "runtimeContract": {
          "update": {
            "mode": "graph-frame-v1",
            "registrationId": "motion.update"
          },
          "timerSlots": {
            "slotGroupId": "main"
          },
          "inputRegistrations": [],
          "observationReaders": [
            {
              "readerId": "motion"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [
            {
              "id": "command",
              "payloadType": "resolved-movement-command-v1",
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
            },
            {
              "id": "speed-scale",
              "payloadType": "movement-scale-v1",
              "required": false,
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
          "outputPorts": []
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [],
          "observationReaderIds": [
            "motion"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "54570dd840659201eb0e0487d1dc3a7450d95707a7a8be5981f6f5e44dc4dc6b"
      },
      {
        "instanceId": "resolver",
        "ownerId": "enemy-one",
        "moduleId": "interaction.contact-resolution",
        "version": "1.1.0",
        "kind": "combat-interaction",
        "implementationId": "interaction.contact-resolution.v1-1",
        "configurationSchemaId": "interaction.contact-resolution.config",
        "configuration": {
          "policyProfileId": "batch1.default-damage",
          "policyProfileVersion": "1.0.0",
          "allowedDispositions": [
            "damage"
          ],
          "allowedSourceOperations": [
            "consume"
          ],
          "maxResolvedContacts": 64
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "fd7874b237bdb82a08b76f25ba4fb575c10d778bcb844a01aa428bc11b1c1d94",
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
          "instanceLeases": 3,
          "graphLeases": 0
        },
        "artifactIdentity": {
          "schemaVersion": "1.0.0",
          "algorithm": "sha256",
          "envelopeFormat": "module-registration-envelope-v1",
          "manifestSha256": "fd7874b237bdb82a08b76f25ba4fb575c10d778bcb844a01aa428bc11b1c1d94",
          "configurationDescriptorSha256": "8dee45e6761b65725a6adc566cc6834f9af91f30b8c8c3fd5d38fb59e5ff7dae",
          "reservationDescriptorSha256": "7cf892a61da8a880ffba09458f29d1af48fed6f003a146745d004027f4dfdc0a",
          "implementationBundleSha256": "6d682a724fe9c695b8ff0901d232517356c9169423f0c0121a7a37800c8a0481",
          "dependencyLockSha256": "3114db68a63f8cc7a5f8d6681980c6d48d25719a43a53f4df02dae977f348f15",
          "toolchainIdentitySha256": "35fe5f84f10587932b8d6b182469ac64fddb54bf4a6b06cd46d970c20ed4ab54",
          "envelopeSha256": "647206a93107cb0295a7d058b5b111cea63716e88b2c00fc50af0b09e113ef57"
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
              "readerId": "resolution"
            }
          ],
          "contactCommit": {
            "commitServiceId": "contact.commit",
            "maximumConcurrentCommits": 4,
            "admittedOperations": [
              "consume"
            ]
          }
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
                  "player",
                  "enemy",
                  "boss"
                ],
                "targetActorRoles": [
                  "player",
                  "enemy",
                  "boss"
                ],
                "sourceEntityRoles": [
                  "projectile"
                ]
              }
            },
            {
              "id": "candidate",
              "payloadType": "contact-candidate-v1",
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
            }
          ],
          "outputPorts": [
            {
              "id": "hit",
              "payloadType": "hit-v1",
              "delivery": "event"
            },
            {
              "id": "damage",
              "payloadType": "damage-v1",
              "delivery": "event"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [],
          "observationReaderIds": [
            "resolution"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "22b05da6a479e9d03a5c7130820dd69d5892bf76a84c6530715137f3c0b43c78"
      },
      {
        "instanceId": "targeting",
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
        "instanceId": "touch",
        "ownerId": "player-one",
        "moduleId": "intent.touch-drag",
        "version": "1.0.0",
        "kind": "player-intent",
        "implementationId": "intent.touch-drag.v1",
        "configurationSchemaId": "intent.touch-drag.config",
        "configuration": {
          "capture": "first-active",
          "release": "matching-pointer-up",
          "emitOnDown": false
        },
        "manifestSchemaVersion": "1.2.0",
        "instantiation": "production-eligible",
        "manifestSha256": "f18da1c54d0964e2b442d53c54c21560cbe820a7687cefd23c334038b2e4f2e9",
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
          "manifestSha256": "f18da1c54d0964e2b442d53c54c21560cbe820a7687cefd23c334038b2e4f2e9",
          "configurationDescriptorSha256": "8884fbaace9900b8cce6b689e3fc433524be19ded3d22f20caa930b5846d05b1",
          "reservationDescriptorSha256": "c5005923973583d38c4cec38d2578c3a33856fe3f1ebb6b2614a4be9922b84ee",
          "implementationBundleSha256": "aa5102bd10a4d35b822eb8505de712d493f496f1de72a9edf481ce334633e12f",
          "dependencyLockSha256": "e3f942b24b5b515fecc068c475a193034b13a127e1da280cea5b4ad14a03c78a",
          "toolchainIdentitySha256": "3f07da47c80fa46c2d89a7e064cd374ee726cf2c206c08dbfbe35326f9b04356",
          "envelopeSha256": "6b0f163881d2b3ffce945bacd5499eba9b85ea046021749b234b8256ec44cf90"
        },
        "factoryContextVersion": "1.2.0",
        "runtimeContract": {
          "update": null,
          "timerSlots": {
            "slotGroupId": "main"
          },
          "inputRegistrations": [
            {
              "registrationId": "pointer.down",
              "kind": "pointer-down"
            },
            {
              "registrationId": "pointer.move",
              "kind": "pointer-move"
            },
            {
              "registrationId": "pointer.up",
              "kind": "pointer-up"
            }
          ],
          "observationReaders": [
            {
              "readerId": "movement"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [],
          "outputPorts": [
            {
              "id": "command",
              "payloadType": "movement-command-v1",
              "delivery": "event"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [
            "pointer.down",
            "pointer.move",
            "pointer.up"
          ],
          "observationReaderIds": [
            "movement"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "4cdbcb36531f8cf15ada2f1263d5e96cc4e80b3c4ed2bcf27dbfae98c03a4faa"
      },
      {
        "instanceId": "trigger",
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
        "from": "arbiter",
        "to": "keyboard",
        "capabilityId": "intent.movement-source",
        "scope": "owner"
      },
      {
        "from": "arbiter",
        "to": "touch",
        "capabilityId": "intent.movement-source",
        "scope": "owner"
      },
      {
        "from": "delivery",
        "to": "targeting",
        "capabilityId": "targeting.solution-v2",
        "scope": "owner"
      },
      {
        "from": "delivery",
        "to": "trigger",
        "capabilityId": "trigger.attack-v2",
        "scope": "owner"
      },
      {
        "from": "detector",
        "to": "delivery",
        "capabilityId": "delivery.projectile-channel",
        "scope": "assembly"
      },
      {
        "from": "focus-speed",
        "to": "focus",
        "capabilityId": "intent.focus-source",
        "scope": "owner"
      },
      {
        "from": "locomotion",
        "to": "arbiter",
        "capabilityId": "intent.movement-resolved",
        "scope": "owner"
      },
      {
        "from": "resolver",
        "to": "detector",
        "capabilityId": "interaction.projectile-contact-candidate",
        "scope": "owner"
      },
      {
        "from": "resolver",
        "to": "health",
        "capabilityId": "combat.damage-sink",
        "scope": "owner"
      },
      {
        "from": "targeting",
        "to": "aim",
        "capabilityId": "intent.aim-source",
        "scope": "owner"
      },
      {
        "from": "trigger",
        "to": "attack-intent",
        "capabilityId": "intent.attack-source",
        "scope": "owner"
      }
    ],
    "bindings": [
      {
        "from": {
          "instanceId": "aim",
          "portId": "aim"
        },
        "to": {
          "instanceId": "targeting",
          "portId": "aim"
        },
        "payloadType": "aim-command-v1",
        "delivery": "state"
      },
      {
        "from": {
          "instanceId": "arbiter",
          "portId": "resolved"
        },
        "to": {
          "instanceId": "locomotion",
          "portId": "command"
        },
        "payloadType": "resolved-movement-command-v1",
        "delivery": "event"
      },
      {
        "from": {
          "instanceId": "attack-intent",
          "portId": "intent"
        },
        "to": {
          "instanceId": "trigger",
          "portId": "intent"
        },
        "payloadType": "attack-intent-v1",
        "delivery": "event"
      },
      {
        "from": {
          "instanceId": "delivery",
          "portId": "projectiles"
        },
        "to": {
          "instanceId": "detector",
          "portId": "sources"
        },
        "payloadType": "entity-channel-v1",
        "delivery": "state"
      },
      {
        "from": {
          "instanceId": "delivery",
          "portId": "projectiles"
        },
        "to": {
          "instanceId": "resolver",
          "portId": "sources"
        },
        "payloadType": "entity-channel-v1",
        "delivery": "state"
      },
      {
        "from": {
          "instanceId": "detector",
          "portId": "candidate"
        },
        "to": {
          "instanceId": "resolver",
          "portId": "candidate"
        },
        "payloadType": "contact-candidate-v1",
        "delivery": "event"
      },
      {
        "from": {
          "instanceId": "focus",
          "portId": "focus"
        },
        "to": {
          "instanceId": "focus-speed",
          "portId": "focus"
        },
        "payloadType": "focus-state-v1",
        "delivery": "state"
      },
      {
        "from": {
          "instanceId": "focus-speed",
          "portId": "scale"
        },
        "to": {
          "instanceId": "locomotion",
          "portId": "speed-scale"
        },
        "payloadType": "movement-scale-v1",
        "delivery": "state"
      },
      {
        "from": {
          "instanceId": "keyboard",
          "portId": "command"
        },
        "to": {
          "instanceId": "arbiter",
          "portId": "commands"
        },
        "payloadType": "movement-command-v1",
        "delivery": "event"
      },
      {
        "from": {
          "instanceId": "resolver",
          "portId": "damage"
        },
        "to": {
          "instanceId": "health",
          "portId": "damage"
        },
        "payloadType": "damage-v1",
        "delivery": "event"
      },
      {
        "from": {
          "instanceId": "targeting",
          "portId": "selection"
        },
        "to": {
          "instanceId": "delivery",
          "portId": "target"
        },
        "payloadType": "target-solution-v1",
        "delivery": "state"
      },
      {
        "from": {
          "instanceId": "touch",
          "portId": "command"
        },
        "to": {
          "instanceId": "arbiter",
          "portId": "commands"
        },
        "payloadType": "movement-command-v1",
        "delivery": "event"
      },
      {
        "from": {
          "instanceId": "trigger",
          "portId": "request"
        },
        "to": {
          "instanceId": "delivery",
          "portId": "request"
        },
        "payloadType": "attack-request-v2",
        "delivery": "event"
      }
    ],
    "constructionOrder": [
      "aim",
      "keyboard",
      "touch",
      "arbiter",
      "attack-intent",
      "default-policy",
      "targeting",
      "trigger",
      "delivery",
      "detector",
      "focus",
      "focus-speed",
      "health",
      "locomotion",
      "resolver"
    ],
    "assetBindings": [
      {
        "bindingId": "player-projectile",
        "roleId": "player-projectile",
        "category": "projectile",
        "runtimeSha256": "2222222222222222222222222222222222222222222222222222222222222222",
        "textureKey": "module/2222222222222222222222222222222222222222222222222222222222222222/player-projectile",
        "sharing": "instance",
        "consumerInstanceIds": [
          "delivery"
        ]
      }
    ],
    "contactPolicyProfiles": [
      {
        "consumerInstanceId": "resolver",
        "profileId": "batch1.default-damage",
        "version": "1.0.0",
        "evidenceHash": "fe907b71f1b56c3f1e75b13008376413fe41eb5e50d760f76707bb174dd9b818",
        "supportedChainEvidenceId": "batch1.default-damage.chain",
        "orderedPolicyInstanceIds": [
          "default-policy"
        ],
        "orderedPolicyArtifactHashes": [
          "435387a883a4ee3a09c15ea334056be0ca7e49989e5e5177847d2c066e4b3514"
        ]
      }
    ],
    "damageSinkRoutes": [
      {
        "ownerId": "enemy-one",
        "headInstanceId": "health",
        "orderedSinkInstanceIds": [
          "health"
        ],
        "terminalHealthInstanceId": "health",
        "producerInstanceIds": [
          "resolver"
        ]
      }
    ],
    "entityChannels": [
      {
        "channelId": "delivery.projectiles",
        "localChannelId": "projectiles",
        "ownerInstanceId": "delivery",
        "ownerActorId": "player-one",
        "outputPort": "projectiles",
        "entityRole": "projectile",
        "capacity": 16,
        "capacityResources": [
          "activeEntities",
          "activeProjectiles"
        ],
        "readerInstanceIds": [
          "detector",
          "resolver"
        ],
        "sourceArtifactEnvelopeSha256": "e7edd8d7fc4c5823b82dc2571c52a352c213b18ec3c6639f46b200d360cb3aef"
      }
    ],
    "entityMutationGrants": [
      {
        "grantId": "resolver.projectile.consume",
        "accessId": "projectile.consume",
        "granteeInstanceId": "resolver",
        "channelId": "delivery.projectiles",
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
        "targetingInstanceId": "targeting",
        "triggerInstanceId": "trigger",
        "deliveryInstanceId": "delivery",
        "targetBinding": {
          "from": {
            "instanceId": "targeting",
            "portId": "selection"
          },
          "to": {
            "instanceId": "delivery",
            "portId": "target"
          },
          "payloadType": "target-solution-v1",
          "delivery": "state"
        },
        "requestBinding": {
          "from": {
            "instanceId": "trigger",
            "portId": "request"
          },
          "to": {
            "instanceId": "delivery",
            "portId": "request"
          },
          "payloadType": "attack-request-v2",
          "delivery": "event"
        }
      }
    ],
    "projectileChannelLineages": [
      {
        "lineageId": "detector/projectile-lineage/delivery.projectiles",
        "providerInstanceId": "delivery",
        "providerCapabilityId": "delivery.projectile-channel",
        "sourceBinding": {
          "from": {
            "instanceId": "delivery",
            "portId": "projectiles"
          },
          "to": {
            "instanceId": "detector",
            "portId": "sources"
          },
          "payloadType": "entity-channel-v1",
          "delivery": "state"
        },
        "channelId": "delivery.projectiles",
        "channelOutputPort": "projectiles",
        "consumerInstanceId": "detector",
        "consumerInputPort": "sources"
      }
    ],
    "effectApplicationRoutes": [],
    "pickupEffectPlans": [],
    "projectileBudgetContention": {
      "budget": {
        "activeProjectiles": 16,
        "spawnsPerSecond": 40
      },
      "totals": {
        "activeProjectiles": 16,
        "spawnsPerSecond": 40
      },
      "orderedOwners": [
        {
          "resolvedOrder": 8,
          "instanceId": "delivery",
          "ownerActorId": "player-one",
          "attackChannelId": "player.primary",
          "channelId": "delivery.projectiles",
          "poolId": "delivery.projectiles.pool",
          "activeProjectiles": 16,
          "spawnsPerSecond": 40,
          "cumulativeActiveProjectiles": 16,
          "cumulativeSpawnsPerSecond": 40
        }
      ]
    },
    "resourceTotals": {
      "activeEntities": 16,
      "activeProjectiles": 16,
      "spawnsPerSecond": 40,
      "timers": 0
    }
  },
  {
    "graphVersion": "1.3.0",
    "assemblyId": "batch2.formation-radial",
    "kernelVersion": "1.0.0",
    "engine": {
      "id": "phaser",
      "version": "3.90.0"
    },
    "executionReadiness": {
      "status": "ready",
      "evidenceId": "8087883da2a5e560b3ed7dba9a4655081e9ba6667203ee7b532fc5de7a7bfd2f"
    },
    "catalogEvidenceId": "1ba623e4f64369187eab79c85a295cea1ab9a0b35b13a07384349f48bd1e86c8",
    "actors": [
      {
        "actorId": "player-one",
        "role": "player"
      },
      {
        "actorId": "enemy-one",
        "role": "enemy"
      }
    ],
    "modules": [
      {
        "instanceId": "aim",
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
        "instanceId": "arbiter",
        "ownerId": "player-one",
        "moduleId": "intent.movement-arbiter",
        "version": "1.0.0",
        "kind": "player-intent",
        "implementationId": "intent.movement-arbiter.v1",
        "configurationSchemaId": "intent.movement-arbiter.config",
        "configuration": {
          "policy": "touch-while-active-else-keyboard",
          "keyboardSourceId": "keyboard",
          "touchSourceId": "touch"
        },
        "manifestSchemaVersion": "1.2.0",
        "instantiation": "production-eligible",
        "manifestSha256": "9d43ffcccd085ad78b3ff81bc2182f651117c33fd327a035aeb91ba46b0f4d33",
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
          "instanceLeases": 1,
          "graphLeases": 0
        },
        "artifactIdentity": {
          "schemaVersion": "1.0.0",
          "algorithm": "sha256",
          "envelopeFormat": "module-registration-envelope-v1",
          "manifestSha256": "9d43ffcccd085ad78b3ff81bc2182f651117c33fd327a035aeb91ba46b0f4d33",
          "configurationDescriptorSha256": "9e09d39adeba78199db1be2373cbcdd2e81c8f2a0dc5e00b2200ea42896ec7ba",
          "reservationDescriptorSha256": "a5dcc7a7281d264f7f5876e30d17c68628b8bcce2de3820debfd35b491640a8e",
          "implementationBundleSha256": "82db7e4096b0d2d491829be4fc60a4401c963513225a9be44cceb5c82bbda0c6",
          "dependencyLockSha256": "e3f942b24b5b515fecc068c475a193034b13a127e1da280cea5b4ad14a03c78a",
          "toolchainIdentitySha256": "3f07da47c80fa46c2d89a7e064cd374ee726cf2c206c08dbfbe35326f9b04356",
          "envelopeSha256": "a46bcb6e7b257b0bdc9649aa34aad0c183df155b497d76e95db061e95f5785e1"
        },
        "factoryContextVersion": "1.2.0",
        "runtimeContract": {
          "update": null,
          "timerSlots": {
            "slotGroupId": "main"
          },
          "inputRegistrations": [],
          "observationReaders": [
            {
              "readerId": "arbitration"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [
            {
              "id": "commands",
              "payloadType": "movement-command-v1",
              "required": true,
              "multiple": true,
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
              "id": "resolved",
              "payloadType": "resolved-movement-command-v1",
              "delivery": "event"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [],
          "observationReaderIds": [
            "arbitration"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "02f001a3d921d7daa4a3c0facf2e4e8b40d839837621ac926de6b843666e144a"
      },
      {
        "instanceId": "attack-intent",
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
        "instanceId": "default-policy",
        "ownerId": "enemy-one",
        "moduleId": "interaction.contact-default-damage",
        "version": "1.0.0",
        "kind": "combat-interaction",
        "implementationId": "interaction.contact-default-damage.v1",
        "configurationSchemaId": "interaction.contact-default-damage.config",
        "configuration": {
          "damageKind": "projectile",
          "defaultDisposition": "damage",
          "defaultSourceOperation": "consume"
        },
        "manifestSchemaVersion": "1.2.0",
        "instantiation": "production-eligible",
        "manifestSha256": "a3ac7549ae42c55a26596c3da80afce9d565d7dd53bc135ade5e6a4e1a72c268",
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
          "manifestSha256": "a3ac7549ae42c55a26596c3da80afce9d565d7dd53bc135ade5e6a4e1a72c268",
          "configurationDescriptorSha256": "00943acb6e746288ff8a7fc6c677309793357849fbf008b1c1b380b0c2950eec",
          "reservationDescriptorSha256": "703c43c468c12d92643fa16af0e86c3d483d08cd499b63d76fa95bf9b399c019",
          "implementationBundleSha256": "f7aa1b981073d2e11feed1f7e7690f8a1ade75ccabd6ab6b8d4c9b29c8dc946a",
          "dependencyLockSha256": "e3f942b24b5b515fecc068c475a193034b13a127e1da280cea5b4ad14a03c78a",
          "toolchainIdentitySha256": "3f07da47c80fa46c2d89a7e064cd374ee726cf2c206c08dbfbe35326f9b04356",
          "envelopeSha256": "435387a883a4ee3a09c15ea334056be0ca7e49989e5e5177847d2c066e4b3514"
        },
        "factoryContextVersion": "1.2.0",
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
        "catalogEntryEvidenceId": "d7020b6df92e644270d1b51397bd4fa09885c97138927afcf2f97884d284ee76"
      },
      {
        "instanceId": "delivery",
        "ownerId": "player-one",
        "moduleId": "delivery.pattern.radial",
        "version": "1.0.0",
        "kind": "attack-delivery",
        "implementationId": "delivery.pattern.radial.v1",
        "configurationSchemaId": "delivery.pattern.radial.config",
        "configuration": {
          "attackChannelId": "player.primary",
          "baseCount": 3,
          "speed": 600,
          "baseDamage": 10,
          "textureRole": "player-projectile",
          "spawnOffset": {
            "x": 0,
            "y": -28
          },
          "maxActive": 16,
          "maximumAcceptedRequestsPerSecond": 10,
          "maximumCountBonus": 1,
          "maximumDamageMultiplier": 2,
          "recycleMargin": 32,
          "exhaustionPolicy": "drop-and-observe",
          "baseAngleOffsetDegrees": 15
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "a4f9de3685c02ea24ab1ff0493691e2364d04c9e825e65c1562b7bb8da54f970",
        "resources": {
          "activeEntities": 256,
          "activeProjectiles": 256,
          "spawnsPerSecond": 2560,
          "timers": 0
        },
        "resourceGrant": {
          "activeEntities": 16,
          "activeProjectiles": 16,
          "spawnsPerSecond": 40,
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
          "manifestSha256": "a4f9de3685c02ea24ab1ff0493691e2364d04c9e825e65c1562b7bb8da54f970",
          "configurationDescriptorSha256": "70ae5955fd7321ff775ade5a0631f531e9409306d07a274528d6b78e3929342b",
          "reservationDescriptorSha256": "e84395486242aa580d7ea2091dfd08602042601a63121ba47f24850f837238cb",
          "implementationBundleSha256": "e658387ae10c64775b4682e621368c9364d4aff41581168697666655e73b2d33",
          "dependencyLockSha256": "3a62cb4fa8c1835c5496c91fc4b6018ad52d0e2a9f7c6e03b05675f5f973cd0c",
          "toolchainIdentitySha256": "d36c05bbb20980385899dc98650138698cc54f619092b6d415a24983e56552d0",
          "envelopeSha256": "c2b330c8bbea862de53e35326099b6ca0f3705fed5f0722b00afb7db0004a580"
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
        "catalogEntryEvidenceId": "8465ed27da91baaaf224bc537729a74287cc50a8bbecbc233e8fc5b35923076b"
      },
      {
        "instanceId": "detector",
        "ownerId": "enemy-one",
        "moduleId": "interaction.projectile-contact",
        "version": "1.1.0",
        "kind": "combat-interaction",
        "implementationId": "interaction.projectile-contact.v1-1",
        "configurationSchemaId": "interaction.projectile-contact.config",
        "configuration": {
          "sourceEntityRole": "projectile",
          "targetActorRole": "enemy",
          "maximumTrackedContacts": 64
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "a0ef6b9ec62ee0a0024baaa27c1da58a1223fca144a0522f457f048c2bff2c3c",
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
          "manifestSha256": "a0ef6b9ec62ee0a0024baaa27c1da58a1223fca144a0522f457f048c2bff2c3c",
          "configurationDescriptorSha256": "48426de270d5cbf02a8a961a77a90525bddfa11100a260581393becce7c3b31e",
          "reservationDescriptorSha256": "b37389b46ed44dbce09e7dbb2ddf633a1d991a6427731f1c225d4b7c42754fa7",
          "implementationBundleSha256": "a7b7703e206df2501a9a3feb60a815e7051362f046ad35dd6a2b39e8fdde0285",
          "dependencyLockSha256": "3114db68a63f8cc7a5f8d6681980c6d48d25719a43a53f4df02dae977f348f15",
          "toolchainIdentitySha256": "35fe5f84f10587932b8d6b182469ac64fddb54bf4a6b06cd46d970c20ed4ab54",
          "envelopeSha256": "790081f65a1f295c78af5d5489678a675bbb59b5e04ecaa710bdad8851a18bc8"
        },
        "factoryContextVersion": "1.3.0",
        "runtimeContract": {
          "update": {
            "mode": "graph-frame-v1",
            "registrationId": "contact.update"
          },
          "timerSlots": {
            "slotGroupId": "main"
          },
          "inputRegistrations": [],
          "observationReaders": [
            {
              "readerId": "contacts"
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
                  "player",
                  "enemy",
                  "boss"
                ],
                "targetActorRoles": [
                  "player",
                  "enemy",
                  "boss"
                ],
                "sourceEntityRoles": [
                  "projectile"
                ]
              }
            }
          ],
          "outputPorts": [
            {
              "id": "candidate",
              "payloadType": "contact-candidate-v1",
              "delivery": "event"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [],
          "observationReaderIds": [
            "contacts"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": [],
          "overlapRuleId": "projectile.overlap"
        },
        "catalogEntryEvidenceId": "7347c0195e10a7be2b1d703a104824c3dfd641c9a0f426d1e496a41fa73092a0"
      },
      {
        "instanceId": "focus",
        "ownerId": "player-one",
        "moduleId": "intent.focus",
        "version": "1.0.0",
        "kind": "player-intent",
        "implementationId": "intent.focus.v1",
        "configurationSchemaId": "intent.focus.config",
        "configuration": {
          "device": "keyboard",
          "control": "ShiftLeft",
          "initialFocused": false
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "aacb922e96b26e55426cfd454b8bbb54ebe987c894b7a4f362e8092ffebe6792",
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
          "manifestSha256": "aacb922e96b26e55426cfd454b8bbb54ebe987c894b7a4f362e8092ffebe6792",
          "configurationDescriptorSha256": "b4151a58965ec35b2463dc7d11b3d4a1ba48a96e95889856ca30a06003b0f14e",
          "reservationDescriptorSha256": "bb684f2c92d8fef75f30a599bac371807de81d63d040936e472830c3072d39d6",
          "implementationBundleSha256": "aca82a0d51b7a0bb9c2f1b0aee52ddf5bee64c9fb277abceb33398d9b7289847",
          "dependencyLockSha256": "5b498deec049fe835a9f07056297b89515949bc723867821f92110a0ab04db55",
          "toolchainIdentitySha256": "9a149b74eaf8e88bea1c3f4aa0a166ce306dcf155781bdb1a48e5ad05d22e735",
          "envelopeSha256": "95fb5f3bcff3dac4262d9b9054a59f2e303657e445d4f230f1ef3e819d0afa3e"
        },
        "factoryContextVersion": "1.3.0",
        "runtimeContract": {
          "update": null,
          "timerSlots": {
            "slotGroupId": "main"
          },
          "inputRegistrations": [
            {
              "registrationId": "focus.keyboard",
              "kind": "keyboard"
            }
          ],
          "observationReaders": [
            {
              "readerId": "focus"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [],
          "outputPorts": [
            {
              "id": "focus",
              "payloadType": "focus-state-v1",
              "delivery": "state"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [
            "focus.keyboard"
          ],
          "observationReaderIds": [
            "focus"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "23e74a23b5bf7fe53d7ce537dc39ddaeea9b12c0cf8ba0fe5533fba082d20387"
      },
      {
        "instanceId": "focus-speed",
        "ownerId": "player-one",
        "moduleId": "locomotion.focus-speed",
        "version": "1.0.0",
        "kind": "locomotion",
        "implementationId": "locomotion.focus-speed.v1",
        "configurationSchemaId": "locomotion.focus-speed.config",
        "configuration": {
          "multiplier": 0.5,
          "releaseBehavior": "restore"
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "8838f8fe9118c00d243f8d07e01b72fcb1eda0b959a91440930c8f03e975cc20",
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
          "instanceLeases": 3,
          "graphLeases": 0
        },
        "artifactIdentity": {
          "schemaVersion": "1.0.0",
          "algorithm": "sha256",
          "envelopeFormat": "module-registration-envelope-v1",
          "manifestSha256": "8838f8fe9118c00d243f8d07e01b72fcb1eda0b959a91440930c8f03e975cc20",
          "configurationDescriptorSha256": "fb5200ee9a2516b39444b304128e8795afdf6033e8ff6e5c17215c579fc823df",
          "reservationDescriptorSha256": "cb6d1c270296c65cd1dc255f6d8878574369b3d9c6dbc0eefce3f7a00a0184ef",
          "implementationBundleSha256": "20e61c459007c50f75fca426c84cf2cc33f323d940fadc5877b78008e0e32f94",
          "dependencyLockSha256": "5b498deec049fe835a9f07056297b89515949bc723867821f92110a0ab04db55",
          "toolchainIdentitySha256": "9a149b74eaf8e88bea1c3f4aa0a166ce306dcf155781bdb1a48e5ad05d22e735",
          "envelopeSha256": "b3876bcfbeb935e08ad14d31e5f8b404fca9612ac423ba951745db88543b8b80"
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
              "readerId": "scale"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [
            {
              "id": "focus",
              "payloadType": "focus-state-v1",
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
              "id": "scale",
              "payloadType": "movement-scale-v1",
              "delivery": "state"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [],
          "observationReaderIds": [
            "scale"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "28dce4daad405345fb8cca1b45e0b010ea80f43e6de68bb5bca668daf6a5b939"
      },
      {
        "instanceId": "health",
        "ownerId": "enemy-one",
        "moduleId": "combat.health",
        "version": "1.1.0",
        "kind": "combat-interaction",
        "implementationId": "combat.health.v1-1",
        "configurationSchemaId": "combat.health.config",
        "configuration": {
          "maxHealth": 100,
          "initialHealth": 100,
          "damageFloor": 0
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "fa44309ba0be253fd38eb2ddef9a561e51022b9fe0224a83bd2cbd843267b978",
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
          "manifestSha256": "fa44309ba0be253fd38eb2ddef9a561e51022b9fe0224a83bd2cbd843267b978",
          "configurationDescriptorSha256": "093319fcdda8033b14dc680866d669ecbeb2a504965ccb5b8fbda9d22b94ef78",
          "reservationDescriptorSha256": "61db0f8672eb0103417c04d5f8520c88f2767e115cfb49b25c90f20ee3bb9ac4",
          "implementationBundleSha256": "0cb86bf62b96da2f59bec176c24aafa96c2fc99a0320c83ead033ac391c9345b",
          "dependencyLockSha256": "3114db68a63f8cc7a5f8d6681980c6d48d25719a43a53f4df02dae977f348f15",
          "toolchainIdentitySha256": "35fe5f84f10587932b8d6b182469ac64fddb54bf4a6b06cd46d970c20ed4ab54",
          "envelopeSha256": "dd72a85fda2a408eb0f229eb14db6999b9b984b45d16b00df2d676ef3362762e"
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
              "readerId": "health"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [
            {
              "id": "damage",
              "payloadType": "damage-v1",
              "required": true,
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
            },
            {
              "id": "modifier",
              "payloadType": "modifier-application-v1",
              "required": false,
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
            }
          ],
          "outputPorts": [
            {
              "id": "state",
              "payloadType": "health-state-v2",
              "delivery": "state"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [],
          "observationReaderIds": [
            "health"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": [
            "combat.health.current"
          ]
        },
        "catalogEntryEvidenceId": "377f7230f13bc06f4b9ab7d0a0758ba990b0352dea05fddf76936863d3a2bd63"
      },
      {
        "instanceId": "keyboard",
        "ownerId": "player-one",
        "moduleId": "intent.keyboard-movement",
        "version": "1.0.0",
        "kind": "player-intent",
        "implementationId": "intent.keyboard-movement.v1",
        "configurationSchemaId": "intent.keyboard-movement.config",
        "configuration": {
          "bindings": "arrows-and-wasd",
          "normalizeDiagonal": true,
          "emitNeutral": true
        },
        "manifestSchemaVersion": "1.2.0",
        "instantiation": "production-eligible",
        "manifestSha256": "e7e44de719a3683b6d9df4ab640e2381a320948bf374a72f7d4a77214415afb9",
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
          "manifestSha256": "e7e44de719a3683b6d9df4ab640e2381a320948bf374a72f7d4a77214415afb9",
          "configurationDescriptorSha256": "9b015e9b8889308b15831199a276d85e979783081ccc9110ca0a879f143bfc38",
          "reservationDescriptorSha256": "38d096bdc34753c5e32889205da48f25511978a621498733181be8a6dc0c6d1d",
          "implementationBundleSha256": "eb83666306347da2410859d3c907152d91e562e6530403a44f843f88dcd4fd7a",
          "dependencyLockSha256": "e3f942b24b5b515fecc068c475a193034b13a127e1da280cea5b4ad14a03c78a",
          "toolchainIdentitySha256": "3f07da47c80fa46c2d89a7e064cd374ee726cf2c206c08dbfbe35326f9b04356",
          "envelopeSha256": "4a2b9dc74b5c7beb16827b0a2e4c8f84256d5a12fa7de8dd7c54556bc501c11b"
        },
        "factoryContextVersion": "1.2.0",
        "runtimeContract": {
          "update": {
            "mode": "graph-frame-v1",
            "registrationId": "keyboard.update"
          },
          "timerSlots": {
            "slotGroupId": "main"
          },
          "inputRegistrations": [
            {
              "registrationId": "keyboard.direction",
              "kind": "keyboard"
            }
          ],
          "observationReaders": [
            {
              "readerId": "movement"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [],
          "outputPorts": [
            {
              "id": "command",
              "payloadType": "movement-command-v1",
              "delivery": "event"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [
            "keyboard.direction"
          ],
          "observationReaderIds": [
            "movement"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "63839ea8e495dab883c5c83d89808fa34f78ffac04eb44bd78fd12dc58f31d7d"
      },
      {
        "instanceId": "locomotion",
        "ownerId": "player-one",
        "moduleId": "locomotion.bounded",
        "version": "1.1.0",
        "kind": "locomotion",
        "implementationId": "locomotion.bounded.v1-1",
        "configurationSchemaId": "locomotion.bounded.config",
        "configuration": {
          "moveSpeed": 300,
          "bounds": {
            "left": 24,
            "right": 24,
            "top": 24,
            "bottom": 24
          },
          "absoluteMode": "clamp",
          "neutralMode": "zero-velocity"
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "a064dd75d018415059aa4934070bc1ea84009496244742bc9fefccaacf896ccf",
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
          "manifestSha256": "a064dd75d018415059aa4934070bc1ea84009496244742bc9fefccaacf896ccf",
          "configurationDescriptorSha256": "e4725e41c7da63bf4b8d3ca8a1a2c760673c1118f6be73f738f9af2836e7da0d",
          "reservationDescriptorSha256": "9c26433d8dcef54b1fa5cdea3d00c4a4d9a69bfbbed3ce3a37e42b47f8fc1b6f",
          "implementationBundleSha256": "0e2845f8c730f9b32bafca109867b41c912c19d83f71f914c6dcc323f8338921",
          "dependencyLockSha256": "5b498deec049fe835a9f07056297b89515949bc723867821f92110a0ab04db55",
          "toolchainIdentitySha256": "9a149b74eaf8e88bea1c3f4aa0a166ce306dcf155781bdb1a48e5ad05d22e735",
          "envelopeSha256": "4692ccb19733c57887102925be074d83dabcb73a6e990316e9ce9238c543723a"
        },
        "factoryContextVersion": "1.3.0",
        "runtimeContract": {
          "update": {
            "mode": "graph-frame-v1",
            "registrationId": "motion.update"
          },
          "timerSlots": {
            "slotGroupId": "main"
          },
          "inputRegistrations": [],
          "observationReaders": [
            {
              "readerId": "motion"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [
            {
              "id": "command",
              "payloadType": "resolved-movement-command-v1",
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
            },
            {
              "id": "speed-scale",
              "payloadType": "movement-scale-v1",
              "required": false,
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
          "outputPorts": []
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [],
          "observationReaderIds": [
            "motion"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "54570dd840659201eb0e0487d1dc3a7450d95707a7a8be5981f6f5e44dc4dc6b"
      },
      {
        "instanceId": "resolver",
        "ownerId": "enemy-one",
        "moduleId": "interaction.contact-resolution",
        "version": "1.1.0",
        "kind": "combat-interaction",
        "implementationId": "interaction.contact-resolution.v1-1",
        "configurationSchemaId": "interaction.contact-resolution.config",
        "configuration": {
          "policyProfileId": "batch1.default-damage",
          "policyProfileVersion": "1.0.0",
          "allowedDispositions": [
            "damage"
          ],
          "allowedSourceOperations": [
            "consume"
          ],
          "maxResolvedContacts": 64
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "fd7874b237bdb82a08b76f25ba4fb575c10d778bcb844a01aa428bc11b1c1d94",
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
          "instanceLeases": 3,
          "graphLeases": 0
        },
        "artifactIdentity": {
          "schemaVersion": "1.0.0",
          "algorithm": "sha256",
          "envelopeFormat": "module-registration-envelope-v1",
          "manifestSha256": "fd7874b237bdb82a08b76f25ba4fb575c10d778bcb844a01aa428bc11b1c1d94",
          "configurationDescriptorSha256": "8dee45e6761b65725a6adc566cc6834f9af91f30b8c8c3fd5d38fb59e5ff7dae",
          "reservationDescriptorSha256": "7cf892a61da8a880ffba09458f29d1af48fed6f003a146745d004027f4dfdc0a",
          "implementationBundleSha256": "6d682a724fe9c695b8ff0901d232517356c9169423f0c0121a7a37800c8a0481",
          "dependencyLockSha256": "3114db68a63f8cc7a5f8d6681980c6d48d25719a43a53f4df02dae977f348f15",
          "toolchainIdentitySha256": "35fe5f84f10587932b8d6b182469ac64fddb54bf4a6b06cd46d970c20ed4ab54",
          "envelopeSha256": "647206a93107cb0295a7d058b5b111cea63716e88b2c00fc50af0b09e113ef57"
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
              "readerId": "resolution"
            }
          ],
          "contactCommit": {
            "commitServiceId": "contact.commit",
            "maximumConcurrentCommits": 4,
            "admittedOperations": [
              "consume"
            ]
          }
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
                  "player",
                  "enemy",
                  "boss"
                ],
                "targetActorRoles": [
                  "player",
                  "enemy",
                  "boss"
                ],
                "sourceEntityRoles": [
                  "projectile"
                ]
              }
            },
            {
              "id": "candidate",
              "payloadType": "contact-candidate-v1",
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
            }
          ],
          "outputPorts": [
            {
              "id": "hit",
              "payloadType": "hit-v1",
              "delivery": "event"
            },
            {
              "id": "damage",
              "payloadType": "damage-v1",
              "delivery": "event"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [],
          "observationReaderIds": [
            "resolution"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "22b05da6a479e9d03a5c7130820dd69d5892bf76a84c6530715137f3c0b43c78"
      },
      {
        "instanceId": "targeting",
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
        "instanceId": "touch",
        "ownerId": "player-one",
        "moduleId": "intent.touch-drag",
        "version": "1.0.0",
        "kind": "player-intent",
        "implementationId": "intent.touch-drag.v1",
        "configurationSchemaId": "intent.touch-drag.config",
        "configuration": {
          "capture": "first-active",
          "release": "matching-pointer-up",
          "emitOnDown": false
        },
        "manifestSchemaVersion": "1.2.0",
        "instantiation": "production-eligible",
        "manifestSha256": "f18da1c54d0964e2b442d53c54c21560cbe820a7687cefd23c334038b2e4f2e9",
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
          "manifestSha256": "f18da1c54d0964e2b442d53c54c21560cbe820a7687cefd23c334038b2e4f2e9",
          "configurationDescriptorSha256": "8884fbaace9900b8cce6b689e3fc433524be19ded3d22f20caa930b5846d05b1",
          "reservationDescriptorSha256": "c5005923973583d38c4cec38d2578c3a33856fe3f1ebb6b2614a4be9922b84ee",
          "implementationBundleSha256": "aa5102bd10a4d35b822eb8505de712d493f496f1de72a9edf481ce334633e12f",
          "dependencyLockSha256": "e3f942b24b5b515fecc068c475a193034b13a127e1da280cea5b4ad14a03c78a",
          "toolchainIdentitySha256": "3f07da47c80fa46c2d89a7e064cd374ee726cf2c206c08dbfbe35326f9b04356",
          "envelopeSha256": "6b0f163881d2b3ffce945bacd5499eba9b85ea046021749b234b8256ec44cf90"
        },
        "factoryContextVersion": "1.2.0",
        "runtimeContract": {
          "update": null,
          "timerSlots": {
            "slotGroupId": "main"
          },
          "inputRegistrations": [
            {
              "registrationId": "pointer.down",
              "kind": "pointer-down"
            },
            {
              "registrationId": "pointer.move",
              "kind": "pointer-move"
            },
            {
              "registrationId": "pointer.up",
              "kind": "pointer-up"
            }
          ],
          "observationReaders": [
            {
              "readerId": "movement"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [],
          "outputPorts": [
            {
              "id": "command",
              "payloadType": "movement-command-v1",
              "delivery": "event"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [
            "pointer.down",
            "pointer.move",
            "pointer.up"
          ],
          "observationReaderIds": [
            "movement"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "4cdbcb36531f8cf15ada2f1263d5e96cc4e80b3c4ed2bcf27dbfae98c03a4faa"
      },
      {
        "instanceId": "trigger",
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
        "from": "arbiter",
        "to": "keyboard",
        "capabilityId": "intent.movement-source",
        "scope": "owner"
      },
      {
        "from": "arbiter",
        "to": "touch",
        "capabilityId": "intent.movement-source",
        "scope": "owner"
      },
      {
        "from": "delivery",
        "to": "targeting",
        "capabilityId": "targeting.solution-v2",
        "scope": "owner"
      },
      {
        "from": "delivery",
        "to": "trigger",
        "capabilityId": "trigger.attack-v2",
        "scope": "owner"
      },
      {
        "from": "detector",
        "to": "delivery",
        "capabilityId": "delivery.projectile-channel",
        "scope": "assembly"
      },
      {
        "from": "focus-speed",
        "to": "focus",
        "capabilityId": "intent.focus-source",
        "scope": "owner"
      },
      {
        "from": "locomotion",
        "to": "arbiter",
        "capabilityId": "intent.movement-resolved",
        "scope": "owner"
      },
      {
        "from": "resolver",
        "to": "detector",
        "capabilityId": "interaction.projectile-contact-candidate",
        "scope": "owner"
      },
      {
        "from": "resolver",
        "to": "health",
        "capabilityId": "combat.damage-sink",
        "scope": "owner"
      },
      {
        "from": "targeting",
        "to": "aim",
        "capabilityId": "intent.aim-source",
        "scope": "owner"
      },
      {
        "from": "trigger",
        "to": "attack-intent",
        "capabilityId": "intent.attack-source",
        "scope": "owner"
      }
    ],
    "bindings": [
      {
        "from": {
          "instanceId": "aim",
          "portId": "aim"
        },
        "to": {
          "instanceId": "targeting",
          "portId": "aim"
        },
        "payloadType": "aim-command-v1",
        "delivery": "state"
      },
      {
        "from": {
          "instanceId": "arbiter",
          "portId": "resolved"
        },
        "to": {
          "instanceId": "locomotion",
          "portId": "command"
        },
        "payloadType": "resolved-movement-command-v1",
        "delivery": "event"
      },
      {
        "from": {
          "instanceId": "attack-intent",
          "portId": "intent"
        },
        "to": {
          "instanceId": "trigger",
          "portId": "intent"
        },
        "payloadType": "attack-intent-v1",
        "delivery": "event"
      },
      {
        "from": {
          "instanceId": "delivery",
          "portId": "projectiles"
        },
        "to": {
          "instanceId": "detector",
          "portId": "sources"
        },
        "payloadType": "entity-channel-v1",
        "delivery": "state"
      },
      {
        "from": {
          "instanceId": "delivery",
          "portId": "projectiles"
        },
        "to": {
          "instanceId": "resolver",
          "portId": "sources"
        },
        "payloadType": "entity-channel-v1",
        "delivery": "state"
      },
      {
        "from": {
          "instanceId": "detector",
          "portId": "candidate"
        },
        "to": {
          "instanceId": "resolver",
          "portId": "candidate"
        },
        "payloadType": "contact-candidate-v1",
        "delivery": "event"
      },
      {
        "from": {
          "instanceId": "focus",
          "portId": "focus"
        },
        "to": {
          "instanceId": "focus-speed",
          "portId": "focus"
        },
        "payloadType": "focus-state-v1",
        "delivery": "state"
      },
      {
        "from": {
          "instanceId": "focus-speed",
          "portId": "scale"
        },
        "to": {
          "instanceId": "locomotion",
          "portId": "speed-scale"
        },
        "payloadType": "movement-scale-v1",
        "delivery": "state"
      },
      {
        "from": {
          "instanceId": "keyboard",
          "portId": "command"
        },
        "to": {
          "instanceId": "arbiter",
          "portId": "commands"
        },
        "payloadType": "movement-command-v1",
        "delivery": "event"
      },
      {
        "from": {
          "instanceId": "resolver",
          "portId": "damage"
        },
        "to": {
          "instanceId": "health",
          "portId": "damage"
        },
        "payloadType": "damage-v1",
        "delivery": "event"
      },
      {
        "from": {
          "instanceId": "targeting",
          "portId": "selection"
        },
        "to": {
          "instanceId": "delivery",
          "portId": "target"
        },
        "payloadType": "target-solution-v1",
        "delivery": "state"
      },
      {
        "from": {
          "instanceId": "touch",
          "portId": "command"
        },
        "to": {
          "instanceId": "arbiter",
          "portId": "commands"
        },
        "payloadType": "movement-command-v1",
        "delivery": "event"
      },
      {
        "from": {
          "instanceId": "trigger",
          "portId": "request"
        },
        "to": {
          "instanceId": "delivery",
          "portId": "request"
        },
        "payloadType": "attack-request-v2",
        "delivery": "event"
      }
    ],
    "constructionOrder": [
      "aim",
      "keyboard",
      "touch",
      "arbiter",
      "attack-intent",
      "default-policy",
      "targeting",
      "trigger",
      "delivery",
      "detector",
      "focus",
      "focus-speed",
      "health",
      "locomotion",
      "resolver"
    ],
    "assetBindings": [
      {
        "bindingId": "player-projectile",
        "roleId": "player-projectile",
        "category": "projectile",
        "runtimeSha256": "2222222222222222222222222222222222222222222222222222222222222222",
        "textureKey": "module/2222222222222222222222222222222222222222222222222222222222222222/player-projectile",
        "sharing": "instance",
        "consumerInstanceIds": [
          "delivery"
        ]
      }
    ],
    "contactPolicyProfiles": [
      {
        "consumerInstanceId": "resolver",
        "profileId": "batch1.default-damage",
        "version": "1.0.0",
        "evidenceHash": "fe907b71f1b56c3f1e75b13008376413fe41eb5e50d760f76707bb174dd9b818",
        "supportedChainEvidenceId": "batch1.default-damage.chain",
        "orderedPolicyInstanceIds": [
          "default-policy"
        ],
        "orderedPolicyArtifactHashes": [
          "435387a883a4ee3a09c15ea334056be0ca7e49989e5e5177847d2c066e4b3514"
        ]
      }
    ],
    "damageSinkRoutes": [
      {
        "ownerId": "enemy-one",
        "headInstanceId": "health",
        "orderedSinkInstanceIds": [
          "health"
        ],
        "terminalHealthInstanceId": "health",
        "producerInstanceIds": [
          "resolver"
        ]
      }
    ],
    "entityChannels": [
      {
        "channelId": "delivery.projectiles",
        "localChannelId": "projectiles",
        "ownerInstanceId": "delivery",
        "ownerActorId": "player-one",
        "outputPort": "projectiles",
        "entityRole": "projectile",
        "capacity": 16,
        "capacityResources": [
          "activeEntities",
          "activeProjectiles"
        ],
        "readerInstanceIds": [
          "detector",
          "resolver"
        ],
        "sourceArtifactEnvelopeSha256": "c2b330c8bbea862de53e35326099b6ca0f3705fed5f0722b00afb7db0004a580"
      }
    ],
    "entityMutationGrants": [
      {
        "grantId": "resolver.projectile.consume",
        "accessId": "projectile.consume",
        "granteeInstanceId": "resolver",
        "channelId": "delivery.projectiles",
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
        "targetingInstanceId": "targeting",
        "triggerInstanceId": "trigger",
        "deliveryInstanceId": "delivery",
        "targetBinding": {
          "from": {
            "instanceId": "targeting",
            "portId": "selection"
          },
          "to": {
            "instanceId": "delivery",
            "portId": "target"
          },
          "payloadType": "target-solution-v1",
          "delivery": "state"
        },
        "requestBinding": {
          "from": {
            "instanceId": "trigger",
            "portId": "request"
          },
          "to": {
            "instanceId": "delivery",
            "portId": "request"
          },
          "payloadType": "attack-request-v2",
          "delivery": "event"
        }
      }
    ],
    "projectileChannelLineages": [
      {
        "lineageId": "detector/projectile-lineage/delivery.projectiles",
        "providerInstanceId": "delivery",
        "providerCapabilityId": "delivery.projectile-channel",
        "sourceBinding": {
          "from": {
            "instanceId": "delivery",
            "portId": "projectiles"
          },
          "to": {
            "instanceId": "detector",
            "portId": "sources"
          },
          "payloadType": "entity-channel-v1",
          "delivery": "state"
        },
        "channelId": "delivery.projectiles",
        "channelOutputPort": "projectiles",
        "consumerInstanceId": "detector",
        "consumerInputPort": "sources"
      }
    ],
    "effectApplicationRoutes": [],
    "pickupEffectPlans": [],
    "projectileBudgetContention": {
      "budget": {
        "activeProjectiles": 16,
        "spawnsPerSecond": 40
      },
      "totals": {
        "activeProjectiles": 16,
        "spawnsPerSecond": 40
      },
      "orderedOwners": [
        {
          "resolvedOrder": 8,
          "instanceId": "delivery",
          "ownerActorId": "player-one",
          "attackChannelId": "player.primary",
          "channelId": "delivery.projectiles",
          "poolId": "delivery.projectiles.pool",
          "activeProjectiles": 16,
          "spawnsPerSecond": 40,
          "cumulativeActiveProjectiles": 16,
          "cumulativeSpawnsPerSecond": 40
        }
      ]
    },
    "resourceTotals": {
      "activeEntities": 16,
      "activeProjectiles": 16,
      "spawnsPerSecond": 40,
      "timers": 0
    }
  },
  {
    "graphVersion": "1.3.0",
    "assemblyId": "batch2.formation-spiral",
    "kernelVersion": "1.0.0",
    "engine": {
      "id": "phaser",
      "version": "3.90.0"
    },
    "executionReadiness": {
      "status": "ready",
      "evidenceId": "362fbd26a27b8e1b7f35fc12443c2e37de159b4f3685239ac4f530ba3ee826c5"
    },
    "catalogEvidenceId": "2e3f364c06289cb5e043cb3d0300da0f612253b2b06dfe0e1469d4cb69c6b4e1",
    "actors": [
      {
        "actorId": "player-one",
        "role": "player"
      },
      {
        "actorId": "enemy-one",
        "role": "enemy"
      }
    ],
    "modules": [
      {
        "instanceId": "aim",
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
        "instanceId": "arbiter",
        "ownerId": "player-one",
        "moduleId": "intent.movement-arbiter",
        "version": "1.0.0",
        "kind": "player-intent",
        "implementationId": "intent.movement-arbiter.v1",
        "configurationSchemaId": "intent.movement-arbiter.config",
        "configuration": {
          "policy": "touch-while-active-else-keyboard",
          "keyboardSourceId": "keyboard",
          "touchSourceId": "touch"
        },
        "manifestSchemaVersion": "1.2.0",
        "instantiation": "production-eligible",
        "manifestSha256": "9d43ffcccd085ad78b3ff81bc2182f651117c33fd327a035aeb91ba46b0f4d33",
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
          "instanceLeases": 1,
          "graphLeases": 0
        },
        "artifactIdentity": {
          "schemaVersion": "1.0.0",
          "algorithm": "sha256",
          "envelopeFormat": "module-registration-envelope-v1",
          "manifestSha256": "9d43ffcccd085ad78b3ff81bc2182f651117c33fd327a035aeb91ba46b0f4d33",
          "configurationDescriptorSha256": "9e09d39adeba78199db1be2373cbcdd2e81c8f2a0dc5e00b2200ea42896ec7ba",
          "reservationDescriptorSha256": "a5dcc7a7281d264f7f5876e30d17c68628b8bcce2de3820debfd35b491640a8e",
          "implementationBundleSha256": "82db7e4096b0d2d491829be4fc60a4401c963513225a9be44cceb5c82bbda0c6",
          "dependencyLockSha256": "e3f942b24b5b515fecc068c475a193034b13a127e1da280cea5b4ad14a03c78a",
          "toolchainIdentitySha256": "3f07da47c80fa46c2d89a7e064cd374ee726cf2c206c08dbfbe35326f9b04356",
          "envelopeSha256": "a46bcb6e7b257b0bdc9649aa34aad0c183df155b497d76e95db061e95f5785e1"
        },
        "factoryContextVersion": "1.2.0",
        "runtimeContract": {
          "update": null,
          "timerSlots": {
            "slotGroupId": "main"
          },
          "inputRegistrations": [],
          "observationReaders": [
            {
              "readerId": "arbitration"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [
            {
              "id": "commands",
              "payloadType": "movement-command-v1",
              "required": true,
              "multiple": true,
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
              "id": "resolved",
              "payloadType": "resolved-movement-command-v1",
              "delivery": "event"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [],
          "observationReaderIds": [
            "arbitration"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "02f001a3d921d7daa4a3c0facf2e4e8b40d839837621ac926de6b843666e144a"
      },
      {
        "instanceId": "attack-intent",
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
        "instanceId": "default-policy",
        "ownerId": "enemy-one",
        "moduleId": "interaction.contact-default-damage",
        "version": "1.0.0",
        "kind": "combat-interaction",
        "implementationId": "interaction.contact-default-damage.v1",
        "configurationSchemaId": "interaction.contact-default-damage.config",
        "configuration": {
          "damageKind": "projectile",
          "defaultDisposition": "damage",
          "defaultSourceOperation": "consume"
        },
        "manifestSchemaVersion": "1.2.0",
        "instantiation": "production-eligible",
        "manifestSha256": "a3ac7549ae42c55a26596c3da80afce9d565d7dd53bc135ade5e6a4e1a72c268",
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
          "manifestSha256": "a3ac7549ae42c55a26596c3da80afce9d565d7dd53bc135ade5e6a4e1a72c268",
          "configurationDescriptorSha256": "00943acb6e746288ff8a7fc6c677309793357849fbf008b1c1b380b0c2950eec",
          "reservationDescriptorSha256": "703c43c468c12d92643fa16af0e86c3d483d08cd499b63d76fa95bf9b399c019",
          "implementationBundleSha256": "f7aa1b981073d2e11feed1f7e7690f8a1ade75ccabd6ab6b8d4c9b29c8dc946a",
          "dependencyLockSha256": "e3f942b24b5b515fecc068c475a193034b13a127e1da280cea5b4ad14a03c78a",
          "toolchainIdentitySha256": "3f07da47c80fa46c2d89a7e064cd374ee726cf2c206c08dbfbe35326f9b04356",
          "envelopeSha256": "435387a883a4ee3a09c15ea334056be0ca7e49989e5e5177847d2c066e4b3514"
        },
        "factoryContextVersion": "1.2.0",
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
        "catalogEntryEvidenceId": "d7020b6df92e644270d1b51397bd4fa09885c97138927afcf2f97884d284ee76"
      },
      {
        "instanceId": "delivery",
        "ownerId": "player-one",
        "moduleId": "delivery.pattern.spiral",
        "version": "1.0.0",
        "kind": "attack-delivery",
        "implementationId": "delivery.pattern.spiral.v1",
        "configurationSchemaId": "delivery.pattern.spiral.config",
        "configuration": {
          "attackChannelId": "player.primary",
          "baseCount": 3,
          "speed": 600,
          "baseDamage": 10,
          "textureRole": "player-projectile",
          "spawnOffset": {
            "x": 0,
            "y": -28
          },
          "maxActive": 16,
          "maximumAcceptedRequestsPerSecond": 10,
          "maximumCountBonus": 1,
          "maximumDamageMultiplier": 2,
          "recycleMargin": 32,
          "exhaustionPolicy": "drop-and-observe",
          "rotationStepDegrees": 20
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "c73cc9e5f8548ed5fec4cd5cc5cd1f50d1eb2c720704dd7caf14c53b747361e2",
        "resources": {
          "activeEntities": 256,
          "activeProjectiles": 256,
          "spawnsPerSecond": 2560,
          "timers": 0
        },
        "resourceGrant": {
          "activeEntities": 16,
          "activeProjectiles": 16,
          "spawnsPerSecond": 40,
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
          "manifestSha256": "c73cc9e5f8548ed5fec4cd5cc5cd1f50d1eb2c720704dd7caf14c53b747361e2",
          "configurationDescriptorSha256": "4c59e3e09ff9834c2e09b2108960e4fa490781b42221107f7e388e86a500c366",
          "reservationDescriptorSha256": "e84395486242aa580d7ea2091dfd08602042601a63121ba47f24850f837238cb",
          "implementationBundleSha256": "e658387ae10c64775b4682e621368c9364d4aff41581168697666655e73b2d33",
          "dependencyLockSha256": "3a62cb4fa8c1835c5496c91fc4b6018ad52d0e2a9f7c6e03b05675f5f973cd0c",
          "toolchainIdentitySha256": "d36c05bbb20980385899dc98650138698cc54f619092b6d415a24983e56552d0",
          "envelopeSha256": "b206d6fd6de866c7d72492e2f35a54dc09af1ba295544f3600c15fb5706f35d0"
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
        "catalogEntryEvidenceId": "9f20f1dd994f0708c234d452ee7349c8190a50c43fff0f1c2ad8ba4b9b8b6b02"
      },
      {
        "instanceId": "detector",
        "ownerId": "enemy-one",
        "moduleId": "interaction.projectile-contact",
        "version": "1.1.0",
        "kind": "combat-interaction",
        "implementationId": "interaction.projectile-contact.v1-1",
        "configurationSchemaId": "interaction.projectile-contact.config",
        "configuration": {
          "sourceEntityRole": "projectile",
          "targetActorRole": "enemy",
          "maximumTrackedContacts": 64
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "a0ef6b9ec62ee0a0024baaa27c1da58a1223fca144a0522f457f048c2bff2c3c",
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
          "manifestSha256": "a0ef6b9ec62ee0a0024baaa27c1da58a1223fca144a0522f457f048c2bff2c3c",
          "configurationDescriptorSha256": "48426de270d5cbf02a8a961a77a90525bddfa11100a260581393becce7c3b31e",
          "reservationDescriptorSha256": "b37389b46ed44dbce09e7dbb2ddf633a1d991a6427731f1c225d4b7c42754fa7",
          "implementationBundleSha256": "a7b7703e206df2501a9a3feb60a815e7051362f046ad35dd6a2b39e8fdde0285",
          "dependencyLockSha256": "3114db68a63f8cc7a5f8d6681980c6d48d25719a43a53f4df02dae977f348f15",
          "toolchainIdentitySha256": "35fe5f84f10587932b8d6b182469ac64fddb54bf4a6b06cd46d970c20ed4ab54",
          "envelopeSha256": "790081f65a1f295c78af5d5489678a675bbb59b5e04ecaa710bdad8851a18bc8"
        },
        "factoryContextVersion": "1.3.0",
        "runtimeContract": {
          "update": {
            "mode": "graph-frame-v1",
            "registrationId": "contact.update"
          },
          "timerSlots": {
            "slotGroupId": "main"
          },
          "inputRegistrations": [],
          "observationReaders": [
            {
              "readerId": "contacts"
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
                  "player",
                  "enemy",
                  "boss"
                ],
                "targetActorRoles": [
                  "player",
                  "enemy",
                  "boss"
                ],
                "sourceEntityRoles": [
                  "projectile"
                ]
              }
            }
          ],
          "outputPorts": [
            {
              "id": "candidate",
              "payloadType": "contact-candidate-v1",
              "delivery": "event"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [],
          "observationReaderIds": [
            "contacts"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": [],
          "overlapRuleId": "projectile.overlap"
        },
        "catalogEntryEvidenceId": "7347c0195e10a7be2b1d703a104824c3dfd641c9a0f426d1e496a41fa73092a0"
      },
      {
        "instanceId": "focus",
        "ownerId": "player-one",
        "moduleId": "intent.focus",
        "version": "1.0.0",
        "kind": "player-intent",
        "implementationId": "intent.focus.v1",
        "configurationSchemaId": "intent.focus.config",
        "configuration": {
          "device": "keyboard",
          "control": "ShiftLeft",
          "initialFocused": false
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "aacb922e96b26e55426cfd454b8bbb54ebe987c894b7a4f362e8092ffebe6792",
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
          "manifestSha256": "aacb922e96b26e55426cfd454b8bbb54ebe987c894b7a4f362e8092ffebe6792",
          "configurationDescriptorSha256": "b4151a58965ec35b2463dc7d11b3d4a1ba48a96e95889856ca30a06003b0f14e",
          "reservationDescriptorSha256": "bb684f2c92d8fef75f30a599bac371807de81d63d040936e472830c3072d39d6",
          "implementationBundleSha256": "aca82a0d51b7a0bb9c2f1b0aee52ddf5bee64c9fb277abceb33398d9b7289847",
          "dependencyLockSha256": "5b498deec049fe835a9f07056297b89515949bc723867821f92110a0ab04db55",
          "toolchainIdentitySha256": "9a149b74eaf8e88bea1c3f4aa0a166ce306dcf155781bdb1a48e5ad05d22e735",
          "envelopeSha256": "95fb5f3bcff3dac4262d9b9054a59f2e303657e445d4f230f1ef3e819d0afa3e"
        },
        "factoryContextVersion": "1.3.0",
        "runtimeContract": {
          "update": null,
          "timerSlots": {
            "slotGroupId": "main"
          },
          "inputRegistrations": [
            {
              "registrationId": "focus.keyboard",
              "kind": "keyboard"
            }
          ],
          "observationReaders": [
            {
              "readerId": "focus"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [],
          "outputPorts": [
            {
              "id": "focus",
              "payloadType": "focus-state-v1",
              "delivery": "state"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [
            "focus.keyboard"
          ],
          "observationReaderIds": [
            "focus"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "23e74a23b5bf7fe53d7ce537dc39ddaeea9b12c0cf8ba0fe5533fba082d20387"
      },
      {
        "instanceId": "focus-speed",
        "ownerId": "player-one",
        "moduleId": "locomotion.focus-speed",
        "version": "1.0.0",
        "kind": "locomotion",
        "implementationId": "locomotion.focus-speed.v1",
        "configurationSchemaId": "locomotion.focus-speed.config",
        "configuration": {
          "multiplier": 0.5,
          "releaseBehavior": "restore"
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "8838f8fe9118c00d243f8d07e01b72fcb1eda0b959a91440930c8f03e975cc20",
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
          "instanceLeases": 3,
          "graphLeases": 0
        },
        "artifactIdentity": {
          "schemaVersion": "1.0.0",
          "algorithm": "sha256",
          "envelopeFormat": "module-registration-envelope-v1",
          "manifestSha256": "8838f8fe9118c00d243f8d07e01b72fcb1eda0b959a91440930c8f03e975cc20",
          "configurationDescriptorSha256": "fb5200ee9a2516b39444b304128e8795afdf6033e8ff6e5c17215c579fc823df",
          "reservationDescriptorSha256": "cb6d1c270296c65cd1dc255f6d8878574369b3d9c6dbc0eefce3f7a00a0184ef",
          "implementationBundleSha256": "20e61c459007c50f75fca426c84cf2cc33f323d940fadc5877b78008e0e32f94",
          "dependencyLockSha256": "5b498deec049fe835a9f07056297b89515949bc723867821f92110a0ab04db55",
          "toolchainIdentitySha256": "9a149b74eaf8e88bea1c3f4aa0a166ce306dcf155781bdb1a48e5ad05d22e735",
          "envelopeSha256": "b3876bcfbeb935e08ad14d31e5f8b404fca9612ac423ba951745db88543b8b80"
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
              "readerId": "scale"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [
            {
              "id": "focus",
              "payloadType": "focus-state-v1",
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
              "id": "scale",
              "payloadType": "movement-scale-v1",
              "delivery": "state"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [],
          "observationReaderIds": [
            "scale"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "28dce4daad405345fb8cca1b45e0b010ea80f43e6de68bb5bca668daf6a5b939"
      },
      {
        "instanceId": "health",
        "ownerId": "enemy-one",
        "moduleId": "combat.health",
        "version": "1.1.0",
        "kind": "combat-interaction",
        "implementationId": "combat.health.v1-1",
        "configurationSchemaId": "combat.health.config",
        "configuration": {
          "maxHealth": 100,
          "initialHealth": 100,
          "damageFloor": 0
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "fa44309ba0be253fd38eb2ddef9a561e51022b9fe0224a83bd2cbd843267b978",
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
          "manifestSha256": "fa44309ba0be253fd38eb2ddef9a561e51022b9fe0224a83bd2cbd843267b978",
          "configurationDescriptorSha256": "093319fcdda8033b14dc680866d669ecbeb2a504965ccb5b8fbda9d22b94ef78",
          "reservationDescriptorSha256": "61db0f8672eb0103417c04d5f8520c88f2767e115cfb49b25c90f20ee3bb9ac4",
          "implementationBundleSha256": "0cb86bf62b96da2f59bec176c24aafa96c2fc99a0320c83ead033ac391c9345b",
          "dependencyLockSha256": "3114db68a63f8cc7a5f8d6681980c6d48d25719a43a53f4df02dae977f348f15",
          "toolchainIdentitySha256": "35fe5f84f10587932b8d6b182469ac64fddb54bf4a6b06cd46d970c20ed4ab54",
          "envelopeSha256": "dd72a85fda2a408eb0f229eb14db6999b9b984b45d16b00df2d676ef3362762e"
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
              "readerId": "health"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [
            {
              "id": "damage",
              "payloadType": "damage-v1",
              "required": true,
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
            },
            {
              "id": "modifier",
              "payloadType": "modifier-application-v1",
              "required": false,
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
            }
          ],
          "outputPorts": [
            {
              "id": "state",
              "payloadType": "health-state-v2",
              "delivery": "state"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [],
          "observationReaderIds": [
            "health"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": [
            "combat.health.current"
          ]
        },
        "catalogEntryEvidenceId": "377f7230f13bc06f4b9ab7d0a0758ba990b0352dea05fddf76936863d3a2bd63"
      },
      {
        "instanceId": "keyboard",
        "ownerId": "player-one",
        "moduleId": "intent.keyboard-movement",
        "version": "1.0.0",
        "kind": "player-intent",
        "implementationId": "intent.keyboard-movement.v1",
        "configurationSchemaId": "intent.keyboard-movement.config",
        "configuration": {
          "bindings": "arrows-and-wasd",
          "normalizeDiagonal": true,
          "emitNeutral": true
        },
        "manifestSchemaVersion": "1.2.0",
        "instantiation": "production-eligible",
        "manifestSha256": "e7e44de719a3683b6d9df4ab640e2381a320948bf374a72f7d4a77214415afb9",
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
          "manifestSha256": "e7e44de719a3683b6d9df4ab640e2381a320948bf374a72f7d4a77214415afb9",
          "configurationDescriptorSha256": "9b015e9b8889308b15831199a276d85e979783081ccc9110ca0a879f143bfc38",
          "reservationDescriptorSha256": "38d096bdc34753c5e32889205da48f25511978a621498733181be8a6dc0c6d1d",
          "implementationBundleSha256": "eb83666306347da2410859d3c907152d91e562e6530403a44f843f88dcd4fd7a",
          "dependencyLockSha256": "e3f942b24b5b515fecc068c475a193034b13a127e1da280cea5b4ad14a03c78a",
          "toolchainIdentitySha256": "3f07da47c80fa46c2d89a7e064cd374ee726cf2c206c08dbfbe35326f9b04356",
          "envelopeSha256": "4a2b9dc74b5c7beb16827b0a2e4c8f84256d5a12fa7de8dd7c54556bc501c11b"
        },
        "factoryContextVersion": "1.2.0",
        "runtimeContract": {
          "update": {
            "mode": "graph-frame-v1",
            "registrationId": "keyboard.update"
          },
          "timerSlots": {
            "slotGroupId": "main"
          },
          "inputRegistrations": [
            {
              "registrationId": "keyboard.direction",
              "kind": "keyboard"
            }
          ],
          "observationReaders": [
            {
              "readerId": "movement"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [],
          "outputPorts": [
            {
              "id": "command",
              "payloadType": "movement-command-v1",
              "delivery": "event"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [
            "keyboard.direction"
          ],
          "observationReaderIds": [
            "movement"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "63839ea8e495dab883c5c83d89808fa34f78ffac04eb44bd78fd12dc58f31d7d"
      },
      {
        "instanceId": "locomotion",
        "ownerId": "player-one",
        "moduleId": "locomotion.bounded",
        "version": "1.1.0",
        "kind": "locomotion",
        "implementationId": "locomotion.bounded.v1-1",
        "configurationSchemaId": "locomotion.bounded.config",
        "configuration": {
          "moveSpeed": 300,
          "bounds": {
            "left": 24,
            "right": 24,
            "top": 24,
            "bottom": 24
          },
          "absoluteMode": "clamp",
          "neutralMode": "zero-velocity"
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "a064dd75d018415059aa4934070bc1ea84009496244742bc9fefccaacf896ccf",
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
          "manifestSha256": "a064dd75d018415059aa4934070bc1ea84009496244742bc9fefccaacf896ccf",
          "configurationDescriptorSha256": "e4725e41c7da63bf4b8d3ca8a1a2c760673c1118f6be73f738f9af2836e7da0d",
          "reservationDescriptorSha256": "9c26433d8dcef54b1fa5cdea3d00c4a4d9a69bfbbed3ce3a37e42b47f8fc1b6f",
          "implementationBundleSha256": "0e2845f8c730f9b32bafca109867b41c912c19d83f71f914c6dcc323f8338921",
          "dependencyLockSha256": "5b498deec049fe835a9f07056297b89515949bc723867821f92110a0ab04db55",
          "toolchainIdentitySha256": "9a149b74eaf8e88bea1c3f4aa0a166ce306dcf155781bdb1a48e5ad05d22e735",
          "envelopeSha256": "4692ccb19733c57887102925be074d83dabcb73a6e990316e9ce9238c543723a"
        },
        "factoryContextVersion": "1.3.0",
        "runtimeContract": {
          "update": {
            "mode": "graph-frame-v1",
            "registrationId": "motion.update"
          },
          "timerSlots": {
            "slotGroupId": "main"
          },
          "inputRegistrations": [],
          "observationReaders": [
            {
              "readerId": "motion"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [
            {
              "id": "command",
              "payloadType": "resolved-movement-command-v1",
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
            },
            {
              "id": "speed-scale",
              "payloadType": "movement-scale-v1",
              "required": false,
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
          "outputPorts": []
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [],
          "observationReaderIds": [
            "motion"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "54570dd840659201eb0e0487d1dc3a7450d95707a7a8be5981f6f5e44dc4dc6b"
      },
      {
        "instanceId": "resolver",
        "ownerId": "enemy-one",
        "moduleId": "interaction.contact-resolution",
        "version": "1.1.0",
        "kind": "combat-interaction",
        "implementationId": "interaction.contact-resolution.v1-1",
        "configurationSchemaId": "interaction.contact-resolution.config",
        "configuration": {
          "policyProfileId": "batch1.default-damage",
          "policyProfileVersion": "1.0.0",
          "allowedDispositions": [
            "damage"
          ],
          "allowedSourceOperations": [
            "consume"
          ],
          "maxResolvedContacts": 64
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "fd7874b237bdb82a08b76f25ba4fb575c10d778bcb844a01aa428bc11b1c1d94",
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
          "instanceLeases": 3,
          "graphLeases": 0
        },
        "artifactIdentity": {
          "schemaVersion": "1.0.0",
          "algorithm": "sha256",
          "envelopeFormat": "module-registration-envelope-v1",
          "manifestSha256": "fd7874b237bdb82a08b76f25ba4fb575c10d778bcb844a01aa428bc11b1c1d94",
          "configurationDescriptorSha256": "8dee45e6761b65725a6adc566cc6834f9af91f30b8c8c3fd5d38fb59e5ff7dae",
          "reservationDescriptorSha256": "7cf892a61da8a880ffba09458f29d1af48fed6f003a146745d004027f4dfdc0a",
          "implementationBundleSha256": "6d682a724fe9c695b8ff0901d232517356c9169423f0c0121a7a37800c8a0481",
          "dependencyLockSha256": "3114db68a63f8cc7a5f8d6681980c6d48d25719a43a53f4df02dae977f348f15",
          "toolchainIdentitySha256": "35fe5f84f10587932b8d6b182469ac64fddb54bf4a6b06cd46d970c20ed4ab54",
          "envelopeSha256": "647206a93107cb0295a7d058b5b111cea63716e88b2c00fc50af0b09e113ef57"
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
              "readerId": "resolution"
            }
          ],
          "contactCommit": {
            "commitServiceId": "contact.commit",
            "maximumConcurrentCommits": 4,
            "admittedOperations": [
              "consume"
            ]
          }
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
                  "player",
                  "enemy",
                  "boss"
                ],
                "targetActorRoles": [
                  "player",
                  "enemy",
                  "boss"
                ],
                "sourceEntityRoles": [
                  "projectile"
                ]
              }
            },
            {
              "id": "candidate",
              "payloadType": "contact-candidate-v1",
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
            }
          ],
          "outputPorts": [
            {
              "id": "hit",
              "payloadType": "hit-v1",
              "delivery": "event"
            },
            {
              "id": "damage",
              "payloadType": "damage-v1",
              "delivery": "event"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [],
          "observationReaderIds": [
            "resolution"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "22b05da6a479e9d03a5c7130820dd69d5892bf76a84c6530715137f3c0b43c78"
      },
      {
        "instanceId": "targeting",
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
        "instanceId": "touch",
        "ownerId": "player-one",
        "moduleId": "intent.touch-drag",
        "version": "1.0.0",
        "kind": "player-intent",
        "implementationId": "intent.touch-drag.v1",
        "configurationSchemaId": "intent.touch-drag.config",
        "configuration": {
          "capture": "first-active",
          "release": "matching-pointer-up",
          "emitOnDown": false
        },
        "manifestSchemaVersion": "1.2.0",
        "instantiation": "production-eligible",
        "manifestSha256": "f18da1c54d0964e2b442d53c54c21560cbe820a7687cefd23c334038b2e4f2e9",
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
          "manifestSha256": "f18da1c54d0964e2b442d53c54c21560cbe820a7687cefd23c334038b2e4f2e9",
          "configurationDescriptorSha256": "8884fbaace9900b8cce6b689e3fc433524be19ded3d22f20caa930b5846d05b1",
          "reservationDescriptorSha256": "c5005923973583d38c4cec38d2578c3a33856fe3f1ebb6b2614a4be9922b84ee",
          "implementationBundleSha256": "aa5102bd10a4d35b822eb8505de712d493f496f1de72a9edf481ce334633e12f",
          "dependencyLockSha256": "e3f942b24b5b515fecc068c475a193034b13a127e1da280cea5b4ad14a03c78a",
          "toolchainIdentitySha256": "3f07da47c80fa46c2d89a7e064cd374ee726cf2c206c08dbfbe35326f9b04356",
          "envelopeSha256": "6b0f163881d2b3ffce945bacd5499eba9b85ea046021749b234b8256ec44cf90"
        },
        "factoryContextVersion": "1.2.0",
        "runtimeContract": {
          "update": null,
          "timerSlots": {
            "slotGroupId": "main"
          },
          "inputRegistrations": [
            {
              "registrationId": "pointer.down",
              "kind": "pointer-down"
            },
            {
              "registrationId": "pointer.move",
              "kind": "pointer-move"
            },
            {
              "registrationId": "pointer.up",
              "kind": "pointer-up"
            }
          ],
          "observationReaders": [
            {
              "readerId": "movement"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [],
          "outputPorts": [
            {
              "id": "command",
              "payloadType": "movement-command-v1",
              "delivery": "event"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [
            "pointer.down",
            "pointer.move",
            "pointer.up"
          ],
          "observationReaderIds": [
            "movement"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "4cdbcb36531f8cf15ada2f1263d5e96cc4e80b3c4ed2bcf27dbfae98c03a4faa"
      },
      {
        "instanceId": "trigger",
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
        "from": "arbiter",
        "to": "keyboard",
        "capabilityId": "intent.movement-source",
        "scope": "owner"
      },
      {
        "from": "arbiter",
        "to": "touch",
        "capabilityId": "intent.movement-source",
        "scope": "owner"
      },
      {
        "from": "delivery",
        "to": "targeting",
        "capabilityId": "targeting.solution-v2",
        "scope": "owner"
      },
      {
        "from": "delivery",
        "to": "trigger",
        "capabilityId": "trigger.attack-v2",
        "scope": "owner"
      },
      {
        "from": "detector",
        "to": "delivery",
        "capabilityId": "delivery.projectile-channel",
        "scope": "assembly"
      },
      {
        "from": "focus-speed",
        "to": "focus",
        "capabilityId": "intent.focus-source",
        "scope": "owner"
      },
      {
        "from": "locomotion",
        "to": "arbiter",
        "capabilityId": "intent.movement-resolved",
        "scope": "owner"
      },
      {
        "from": "resolver",
        "to": "detector",
        "capabilityId": "interaction.projectile-contact-candidate",
        "scope": "owner"
      },
      {
        "from": "resolver",
        "to": "health",
        "capabilityId": "combat.damage-sink",
        "scope": "owner"
      },
      {
        "from": "targeting",
        "to": "aim",
        "capabilityId": "intent.aim-source",
        "scope": "owner"
      },
      {
        "from": "trigger",
        "to": "attack-intent",
        "capabilityId": "intent.attack-source",
        "scope": "owner"
      }
    ],
    "bindings": [
      {
        "from": {
          "instanceId": "aim",
          "portId": "aim"
        },
        "to": {
          "instanceId": "targeting",
          "portId": "aim"
        },
        "payloadType": "aim-command-v1",
        "delivery": "state"
      },
      {
        "from": {
          "instanceId": "arbiter",
          "portId": "resolved"
        },
        "to": {
          "instanceId": "locomotion",
          "portId": "command"
        },
        "payloadType": "resolved-movement-command-v1",
        "delivery": "event"
      },
      {
        "from": {
          "instanceId": "attack-intent",
          "portId": "intent"
        },
        "to": {
          "instanceId": "trigger",
          "portId": "intent"
        },
        "payloadType": "attack-intent-v1",
        "delivery": "event"
      },
      {
        "from": {
          "instanceId": "delivery",
          "portId": "projectiles"
        },
        "to": {
          "instanceId": "detector",
          "portId": "sources"
        },
        "payloadType": "entity-channel-v1",
        "delivery": "state"
      },
      {
        "from": {
          "instanceId": "delivery",
          "portId": "projectiles"
        },
        "to": {
          "instanceId": "resolver",
          "portId": "sources"
        },
        "payloadType": "entity-channel-v1",
        "delivery": "state"
      },
      {
        "from": {
          "instanceId": "detector",
          "portId": "candidate"
        },
        "to": {
          "instanceId": "resolver",
          "portId": "candidate"
        },
        "payloadType": "contact-candidate-v1",
        "delivery": "event"
      },
      {
        "from": {
          "instanceId": "focus",
          "portId": "focus"
        },
        "to": {
          "instanceId": "focus-speed",
          "portId": "focus"
        },
        "payloadType": "focus-state-v1",
        "delivery": "state"
      },
      {
        "from": {
          "instanceId": "focus-speed",
          "portId": "scale"
        },
        "to": {
          "instanceId": "locomotion",
          "portId": "speed-scale"
        },
        "payloadType": "movement-scale-v1",
        "delivery": "state"
      },
      {
        "from": {
          "instanceId": "keyboard",
          "portId": "command"
        },
        "to": {
          "instanceId": "arbiter",
          "portId": "commands"
        },
        "payloadType": "movement-command-v1",
        "delivery": "event"
      },
      {
        "from": {
          "instanceId": "resolver",
          "portId": "damage"
        },
        "to": {
          "instanceId": "health",
          "portId": "damage"
        },
        "payloadType": "damage-v1",
        "delivery": "event"
      },
      {
        "from": {
          "instanceId": "targeting",
          "portId": "selection"
        },
        "to": {
          "instanceId": "delivery",
          "portId": "target"
        },
        "payloadType": "target-solution-v1",
        "delivery": "state"
      },
      {
        "from": {
          "instanceId": "touch",
          "portId": "command"
        },
        "to": {
          "instanceId": "arbiter",
          "portId": "commands"
        },
        "payloadType": "movement-command-v1",
        "delivery": "event"
      },
      {
        "from": {
          "instanceId": "trigger",
          "portId": "request"
        },
        "to": {
          "instanceId": "delivery",
          "portId": "request"
        },
        "payloadType": "attack-request-v2",
        "delivery": "event"
      }
    ],
    "constructionOrder": [
      "aim",
      "keyboard",
      "touch",
      "arbiter",
      "attack-intent",
      "default-policy",
      "targeting",
      "trigger",
      "delivery",
      "detector",
      "focus",
      "focus-speed",
      "health",
      "locomotion",
      "resolver"
    ],
    "assetBindings": [
      {
        "bindingId": "player-projectile",
        "roleId": "player-projectile",
        "category": "projectile",
        "runtimeSha256": "2222222222222222222222222222222222222222222222222222222222222222",
        "textureKey": "module/2222222222222222222222222222222222222222222222222222222222222222/player-projectile",
        "sharing": "instance",
        "consumerInstanceIds": [
          "delivery"
        ]
      }
    ],
    "contactPolicyProfiles": [
      {
        "consumerInstanceId": "resolver",
        "profileId": "batch1.default-damage",
        "version": "1.0.0",
        "evidenceHash": "fe907b71f1b56c3f1e75b13008376413fe41eb5e50d760f76707bb174dd9b818",
        "supportedChainEvidenceId": "batch1.default-damage.chain",
        "orderedPolicyInstanceIds": [
          "default-policy"
        ],
        "orderedPolicyArtifactHashes": [
          "435387a883a4ee3a09c15ea334056be0ca7e49989e5e5177847d2c066e4b3514"
        ]
      }
    ],
    "damageSinkRoutes": [
      {
        "ownerId": "enemy-one",
        "headInstanceId": "health",
        "orderedSinkInstanceIds": [
          "health"
        ],
        "terminalHealthInstanceId": "health",
        "producerInstanceIds": [
          "resolver"
        ]
      }
    ],
    "entityChannels": [
      {
        "channelId": "delivery.projectiles",
        "localChannelId": "projectiles",
        "ownerInstanceId": "delivery",
        "ownerActorId": "player-one",
        "outputPort": "projectiles",
        "entityRole": "projectile",
        "capacity": 16,
        "capacityResources": [
          "activeEntities",
          "activeProjectiles"
        ],
        "readerInstanceIds": [
          "detector",
          "resolver"
        ],
        "sourceArtifactEnvelopeSha256": "b206d6fd6de866c7d72492e2f35a54dc09af1ba295544f3600c15fb5706f35d0"
      }
    ],
    "entityMutationGrants": [
      {
        "grantId": "resolver.projectile.consume",
        "accessId": "projectile.consume",
        "granteeInstanceId": "resolver",
        "channelId": "delivery.projectiles",
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
        "targetingInstanceId": "targeting",
        "triggerInstanceId": "trigger",
        "deliveryInstanceId": "delivery",
        "targetBinding": {
          "from": {
            "instanceId": "targeting",
            "portId": "selection"
          },
          "to": {
            "instanceId": "delivery",
            "portId": "target"
          },
          "payloadType": "target-solution-v1",
          "delivery": "state"
        },
        "requestBinding": {
          "from": {
            "instanceId": "trigger",
            "portId": "request"
          },
          "to": {
            "instanceId": "delivery",
            "portId": "request"
          },
          "payloadType": "attack-request-v2",
          "delivery": "event"
        }
      }
    ],
    "projectileChannelLineages": [
      {
        "lineageId": "detector/projectile-lineage/delivery.projectiles",
        "providerInstanceId": "delivery",
        "providerCapabilityId": "delivery.projectile-channel",
        "sourceBinding": {
          "from": {
            "instanceId": "delivery",
            "portId": "projectiles"
          },
          "to": {
            "instanceId": "detector",
            "portId": "sources"
          },
          "payloadType": "entity-channel-v1",
          "delivery": "state"
        },
        "channelId": "delivery.projectiles",
        "channelOutputPort": "projectiles",
        "consumerInstanceId": "detector",
        "consumerInputPort": "sources"
      }
    ],
    "effectApplicationRoutes": [],
    "pickupEffectPlans": [],
    "projectileBudgetContention": {
      "budget": {
        "activeProjectiles": 16,
        "spawnsPerSecond": 40
      },
      "totals": {
        "activeProjectiles": 16,
        "spawnsPerSecond": 40
      },
      "orderedOwners": [
        {
          "resolvedOrder": 8,
          "instanceId": "delivery",
          "ownerActorId": "player-one",
          "attackChannelId": "player.primary",
          "channelId": "delivery.projectiles",
          "poolId": "delivery.projectiles.pool",
          "activeProjectiles": 16,
          "spawnsPerSecond": 40,
          "cumulativeActiveProjectiles": 16,
          "cumulativeSpawnsPerSecond": 40
        }
      ]
    },
    "resourceTotals": {
      "activeEntities": 16,
      "activeProjectiles": 16,
      "spawnsPerSecond": 40,
      "timers": 0
    }
  },
  {
    "graphVersion": "1.3.0",
    "assemblyId": "batch2.formation-fan",
    "kernelVersion": "1.0.0",
    "engine": {
      "id": "phaser",
      "version": "3.90.0"
    },
    "executionReadiness": {
      "status": "ready",
      "evidenceId": "639816aadfab4f027c93d7f429bad79c94426c78b367774dce781fbc8608c2a3"
    },
    "catalogEvidenceId": "84869c1ac163814dbf1bfeea1e459aa4d71ae2458d41aa6e7c657ee05c4c6830",
    "actors": [
      {
        "actorId": "player-one",
        "role": "player"
      },
      {
        "actorId": "enemy-one",
        "role": "enemy"
      }
    ],
    "modules": [
      {
        "instanceId": "aim",
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
        "instanceId": "arbiter",
        "ownerId": "player-one",
        "moduleId": "intent.movement-arbiter",
        "version": "1.0.0",
        "kind": "player-intent",
        "implementationId": "intent.movement-arbiter.v1",
        "configurationSchemaId": "intent.movement-arbiter.config",
        "configuration": {
          "policy": "touch-while-active-else-keyboard",
          "keyboardSourceId": "keyboard",
          "touchSourceId": "touch"
        },
        "manifestSchemaVersion": "1.2.0",
        "instantiation": "production-eligible",
        "manifestSha256": "9d43ffcccd085ad78b3ff81bc2182f651117c33fd327a035aeb91ba46b0f4d33",
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
          "instanceLeases": 1,
          "graphLeases": 0
        },
        "artifactIdentity": {
          "schemaVersion": "1.0.0",
          "algorithm": "sha256",
          "envelopeFormat": "module-registration-envelope-v1",
          "manifestSha256": "9d43ffcccd085ad78b3ff81bc2182f651117c33fd327a035aeb91ba46b0f4d33",
          "configurationDescriptorSha256": "9e09d39adeba78199db1be2373cbcdd2e81c8f2a0dc5e00b2200ea42896ec7ba",
          "reservationDescriptorSha256": "a5dcc7a7281d264f7f5876e30d17c68628b8bcce2de3820debfd35b491640a8e",
          "implementationBundleSha256": "82db7e4096b0d2d491829be4fc60a4401c963513225a9be44cceb5c82bbda0c6",
          "dependencyLockSha256": "e3f942b24b5b515fecc068c475a193034b13a127e1da280cea5b4ad14a03c78a",
          "toolchainIdentitySha256": "3f07da47c80fa46c2d89a7e064cd374ee726cf2c206c08dbfbe35326f9b04356",
          "envelopeSha256": "a46bcb6e7b257b0bdc9649aa34aad0c183df155b497d76e95db061e95f5785e1"
        },
        "factoryContextVersion": "1.2.0",
        "runtimeContract": {
          "update": null,
          "timerSlots": {
            "slotGroupId": "main"
          },
          "inputRegistrations": [],
          "observationReaders": [
            {
              "readerId": "arbitration"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [
            {
              "id": "commands",
              "payloadType": "movement-command-v1",
              "required": true,
              "multiple": true,
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
              "id": "resolved",
              "payloadType": "resolved-movement-command-v1",
              "delivery": "event"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [],
          "observationReaderIds": [
            "arbitration"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "02f001a3d921d7daa4a3c0facf2e4e8b40d839837621ac926de6b843666e144a"
      },
      {
        "instanceId": "attack-intent",
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
        "instanceId": "default-policy",
        "ownerId": "enemy-one",
        "moduleId": "interaction.contact-default-damage",
        "version": "1.0.0",
        "kind": "combat-interaction",
        "implementationId": "interaction.contact-default-damage.v1",
        "configurationSchemaId": "interaction.contact-default-damage.config",
        "configuration": {
          "damageKind": "projectile",
          "defaultDisposition": "damage",
          "defaultSourceOperation": "consume"
        },
        "manifestSchemaVersion": "1.2.0",
        "instantiation": "production-eligible",
        "manifestSha256": "a3ac7549ae42c55a26596c3da80afce9d565d7dd53bc135ade5e6a4e1a72c268",
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
          "manifestSha256": "a3ac7549ae42c55a26596c3da80afce9d565d7dd53bc135ade5e6a4e1a72c268",
          "configurationDescriptorSha256": "00943acb6e746288ff8a7fc6c677309793357849fbf008b1c1b380b0c2950eec",
          "reservationDescriptorSha256": "703c43c468c12d92643fa16af0e86c3d483d08cd499b63d76fa95bf9b399c019",
          "implementationBundleSha256": "f7aa1b981073d2e11feed1f7e7690f8a1ade75ccabd6ab6b8d4c9b29c8dc946a",
          "dependencyLockSha256": "e3f942b24b5b515fecc068c475a193034b13a127e1da280cea5b4ad14a03c78a",
          "toolchainIdentitySha256": "3f07da47c80fa46c2d89a7e064cd374ee726cf2c206c08dbfbe35326f9b04356",
          "envelopeSha256": "435387a883a4ee3a09c15ea334056be0ca7e49989e5e5177847d2c066e4b3514"
        },
        "factoryContextVersion": "1.2.0",
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
        "catalogEntryEvidenceId": "d7020b6df92e644270d1b51397bd4fa09885c97138927afcf2f97884d284ee76"
      },
      {
        "instanceId": "delivery",
        "ownerId": "player-one",
        "moduleId": "delivery.pattern.fan",
        "version": "1.0.0",
        "kind": "attack-delivery",
        "implementationId": "delivery.pattern.fan.v1",
        "configurationSchemaId": "delivery.pattern.fan.config",
        "configuration": {
          "attackChannelId": "player.primary",
          "baseCount": 3,
          "speed": 600,
          "baseDamage": 10,
          "textureRole": "player-projectile",
          "spawnOffset": {
            "x": 0,
            "y": -28
          },
          "maxActive": 16,
          "maximumAcceptedRequestsPerSecond": 10,
          "maximumCountBonus": 1,
          "maximumDamageMultiplier": 2,
          "recycleMargin": 32,
          "exhaustionPolicy": "drop-and-observe",
          "arcDegrees": 90
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "3649c35fe39052c008c931c3971086134a3f0a067a31270c05c6d7d66c31f41a",
        "resources": {
          "activeEntities": 256,
          "activeProjectiles": 256,
          "spawnsPerSecond": 2560,
          "timers": 0
        },
        "resourceGrant": {
          "activeEntities": 16,
          "activeProjectiles": 16,
          "spawnsPerSecond": 40,
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
          "manifestSha256": "3649c35fe39052c008c931c3971086134a3f0a067a31270c05c6d7d66c31f41a",
          "configurationDescriptorSha256": "4fc2673777afc5225fd5d711872ad895f242f9cffb016653d7990ec3678c10e0",
          "reservationDescriptorSha256": "e84395486242aa580d7ea2091dfd08602042601a63121ba47f24850f837238cb",
          "implementationBundleSha256": "e658387ae10c64775b4682e621368c9364d4aff41581168697666655e73b2d33",
          "dependencyLockSha256": "3a62cb4fa8c1835c5496c91fc4b6018ad52d0e2a9f7c6e03b05675f5f973cd0c",
          "toolchainIdentitySha256": "d36c05bbb20980385899dc98650138698cc54f619092b6d415a24983e56552d0",
          "envelopeSha256": "3683ea403f08d7bf7e253581e31da7b4e2ed0a9265dcff3b5ac329a823eea79a"
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
        "catalogEntryEvidenceId": "22c075ce8ffe2ba2093d5f82dbd9c40a008df4be70c270976de45796aa25ea98"
      },
      {
        "instanceId": "detector",
        "ownerId": "enemy-one",
        "moduleId": "interaction.projectile-contact",
        "version": "1.1.0",
        "kind": "combat-interaction",
        "implementationId": "interaction.projectile-contact.v1-1",
        "configurationSchemaId": "interaction.projectile-contact.config",
        "configuration": {
          "sourceEntityRole": "projectile",
          "targetActorRole": "enemy",
          "maximumTrackedContacts": 64
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "a0ef6b9ec62ee0a0024baaa27c1da58a1223fca144a0522f457f048c2bff2c3c",
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
          "manifestSha256": "a0ef6b9ec62ee0a0024baaa27c1da58a1223fca144a0522f457f048c2bff2c3c",
          "configurationDescriptorSha256": "48426de270d5cbf02a8a961a77a90525bddfa11100a260581393becce7c3b31e",
          "reservationDescriptorSha256": "b37389b46ed44dbce09e7dbb2ddf633a1d991a6427731f1c225d4b7c42754fa7",
          "implementationBundleSha256": "a7b7703e206df2501a9a3feb60a815e7051362f046ad35dd6a2b39e8fdde0285",
          "dependencyLockSha256": "3114db68a63f8cc7a5f8d6681980c6d48d25719a43a53f4df02dae977f348f15",
          "toolchainIdentitySha256": "35fe5f84f10587932b8d6b182469ac64fddb54bf4a6b06cd46d970c20ed4ab54",
          "envelopeSha256": "790081f65a1f295c78af5d5489678a675bbb59b5e04ecaa710bdad8851a18bc8"
        },
        "factoryContextVersion": "1.3.0",
        "runtimeContract": {
          "update": {
            "mode": "graph-frame-v1",
            "registrationId": "contact.update"
          },
          "timerSlots": {
            "slotGroupId": "main"
          },
          "inputRegistrations": [],
          "observationReaders": [
            {
              "readerId": "contacts"
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
                  "player",
                  "enemy",
                  "boss"
                ],
                "targetActorRoles": [
                  "player",
                  "enemy",
                  "boss"
                ],
                "sourceEntityRoles": [
                  "projectile"
                ]
              }
            }
          ],
          "outputPorts": [
            {
              "id": "candidate",
              "payloadType": "contact-candidate-v1",
              "delivery": "event"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [],
          "observationReaderIds": [
            "contacts"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": [],
          "overlapRuleId": "projectile.overlap"
        },
        "catalogEntryEvidenceId": "7347c0195e10a7be2b1d703a104824c3dfd641c9a0f426d1e496a41fa73092a0"
      },
      {
        "instanceId": "focus",
        "ownerId": "player-one",
        "moduleId": "intent.focus",
        "version": "1.0.0",
        "kind": "player-intent",
        "implementationId": "intent.focus.v1",
        "configurationSchemaId": "intent.focus.config",
        "configuration": {
          "device": "keyboard",
          "control": "ShiftLeft",
          "initialFocused": false
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "aacb922e96b26e55426cfd454b8bbb54ebe987c894b7a4f362e8092ffebe6792",
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
          "manifestSha256": "aacb922e96b26e55426cfd454b8bbb54ebe987c894b7a4f362e8092ffebe6792",
          "configurationDescriptorSha256": "b4151a58965ec35b2463dc7d11b3d4a1ba48a96e95889856ca30a06003b0f14e",
          "reservationDescriptorSha256": "bb684f2c92d8fef75f30a599bac371807de81d63d040936e472830c3072d39d6",
          "implementationBundleSha256": "aca82a0d51b7a0bb9c2f1b0aee52ddf5bee64c9fb277abceb33398d9b7289847",
          "dependencyLockSha256": "5b498deec049fe835a9f07056297b89515949bc723867821f92110a0ab04db55",
          "toolchainIdentitySha256": "9a149b74eaf8e88bea1c3f4aa0a166ce306dcf155781bdb1a48e5ad05d22e735",
          "envelopeSha256": "95fb5f3bcff3dac4262d9b9054a59f2e303657e445d4f230f1ef3e819d0afa3e"
        },
        "factoryContextVersion": "1.3.0",
        "runtimeContract": {
          "update": null,
          "timerSlots": {
            "slotGroupId": "main"
          },
          "inputRegistrations": [
            {
              "registrationId": "focus.keyboard",
              "kind": "keyboard"
            }
          ],
          "observationReaders": [
            {
              "readerId": "focus"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [],
          "outputPorts": [
            {
              "id": "focus",
              "payloadType": "focus-state-v1",
              "delivery": "state"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [
            "focus.keyboard"
          ],
          "observationReaderIds": [
            "focus"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "23e74a23b5bf7fe53d7ce537dc39ddaeea9b12c0cf8ba0fe5533fba082d20387"
      },
      {
        "instanceId": "focus-speed",
        "ownerId": "player-one",
        "moduleId": "locomotion.focus-speed",
        "version": "1.0.0",
        "kind": "locomotion",
        "implementationId": "locomotion.focus-speed.v1",
        "configurationSchemaId": "locomotion.focus-speed.config",
        "configuration": {
          "multiplier": 0.5,
          "releaseBehavior": "restore"
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "8838f8fe9118c00d243f8d07e01b72fcb1eda0b959a91440930c8f03e975cc20",
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
          "instanceLeases": 3,
          "graphLeases": 0
        },
        "artifactIdentity": {
          "schemaVersion": "1.0.0",
          "algorithm": "sha256",
          "envelopeFormat": "module-registration-envelope-v1",
          "manifestSha256": "8838f8fe9118c00d243f8d07e01b72fcb1eda0b959a91440930c8f03e975cc20",
          "configurationDescriptorSha256": "fb5200ee9a2516b39444b304128e8795afdf6033e8ff6e5c17215c579fc823df",
          "reservationDescriptorSha256": "cb6d1c270296c65cd1dc255f6d8878574369b3d9c6dbc0eefce3f7a00a0184ef",
          "implementationBundleSha256": "20e61c459007c50f75fca426c84cf2cc33f323d940fadc5877b78008e0e32f94",
          "dependencyLockSha256": "5b498deec049fe835a9f07056297b89515949bc723867821f92110a0ab04db55",
          "toolchainIdentitySha256": "9a149b74eaf8e88bea1c3f4aa0a166ce306dcf155781bdb1a48e5ad05d22e735",
          "envelopeSha256": "b3876bcfbeb935e08ad14d31e5f8b404fca9612ac423ba951745db88543b8b80"
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
              "readerId": "scale"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [
            {
              "id": "focus",
              "payloadType": "focus-state-v1",
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
              "id": "scale",
              "payloadType": "movement-scale-v1",
              "delivery": "state"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [],
          "observationReaderIds": [
            "scale"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "28dce4daad405345fb8cca1b45e0b010ea80f43e6de68bb5bca668daf6a5b939"
      },
      {
        "instanceId": "health",
        "ownerId": "enemy-one",
        "moduleId": "combat.health",
        "version": "1.1.0",
        "kind": "combat-interaction",
        "implementationId": "combat.health.v1-1",
        "configurationSchemaId": "combat.health.config",
        "configuration": {
          "maxHealth": 100,
          "initialHealth": 100,
          "damageFloor": 0
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "fa44309ba0be253fd38eb2ddef9a561e51022b9fe0224a83bd2cbd843267b978",
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
          "manifestSha256": "fa44309ba0be253fd38eb2ddef9a561e51022b9fe0224a83bd2cbd843267b978",
          "configurationDescriptorSha256": "093319fcdda8033b14dc680866d669ecbeb2a504965ccb5b8fbda9d22b94ef78",
          "reservationDescriptorSha256": "61db0f8672eb0103417c04d5f8520c88f2767e115cfb49b25c90f20ee3bb9ac4",
          "implementationBundleSha256": "0cb86bf62b96da2f59bec176c24aafa96c2fc99a0320c83ead033ac391c9345b",
          "dependencyLockSha256": "3114db68a63f8cc7a5f8d6681980c6d48d25719a43a53f4df02dae977f348f15",
          "toolchainIdentitySha256": "35fe5f84f10587932b8d6b182469ac64fddb54bf4a6b06cd46d970c20ed4ab54",
          "envelopeSha256": "dd72a85fda2a408eb0f229eb14db6999b9b984b45d16b00df2d676ef3362762e"
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
              "readerId": "health"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [
            {
              "id": "damage",
              "payloadType": "damage-v1",
              "required": true,
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
            },
            {
              "id": "modifier",
              "payloadType": "modifier-application-v1",
              "required": false,
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
            }
          ],
          "outputPorts": [
            {
              "id": "state",
              "payloadType": "health-state-v2",
              "delivery": "state"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [],
          "observationReaderIds": [
            "health"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": [
            "combat.health.current"
          ]
        },
        "catalogEntryEvidenceId": "377f7230f13bc06f4b9ab7d0a0758ba990b0352dea05fddf76936863d3a2bd63"
      },
      {
        "instanceId": "keyboard",
        "ownerId": "player-one",
        "moduleId": "intent.keyboard-movement",
        "version": "1.0.0",
        "kind": "player-intent",
        "implementationId": "intent.keyboard-movement.v1",
        "configurationSchemaId": "intent.keyboard-movement.config",
        "configuration": {
          "bindings": "arrows-and-wasd",
          "normalizeDiagonal": true,
          "emitNeutral": true
        },
        "manifestSchemaVersion": "1.2.0",
        "instantiation": "production-eligible",
        "manifestSha256": "e7e44de719a3683b6d9df4ab640e2381a320948bf374a72f7d4a77214415afb9",
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
          "manifestSha256": "e7e44de719a3683b6d9df4ab640e2381a320948bf374a72f7d4a77214415afb9",
          "configurationDescriptorSha256": "9b015e9b8889308b15831199a276d85e979783081ccc9110ca0a879f143bfc38",
          "reservationDescriptorSha256": "38d096bdc34753c5e32889205da48f25511978a621498733181be8a6dc0c6d1d",
          "implementationBundleSha256": "eb83666306347da2410859d3c907152d91e562e6530403a44f843f88dcd4fd7a",
          "dependencyLockSha256": "e3f942b24b5b515fecc068c475a193034b13a127e1da280cea5b4ad14a03c78a",
          "toolchainIdentitySha256": "3f07da47c80fa46c2d89a7e064cd374ee726cf2c206c08dbfbe35326f9b04356",
          "envelopeSha256": "4a2b9dc74b5c7beb16827b0a2e4c8f84256d5a12fa7de8dd7c54556bc501c11b"
        },
        "factoryContextVersion": "1.2.0",
        "runtimeContract": {
          "update": {
            "mode": "graph-frame-v1",
            "registrationId": "keyboard.update"
          },
          "timerSlots": {
            "slotGroupId": "main"
          },
          "inputRegistrations": [
            {
              "registrationId": "keyboard.direction",
              "kind": "keyboard"
            }
          ],
          "observationReaders": [
            {
              "readerId": "movement"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [],
          "outputPorts": [
            {
              "id": "command",
              "payloadType": "movement-command-v1",
              "delivery": "event"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [
            "keyboard.direction"
          ],
          "observationReaderIds": [
            "movement"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "63839ea8e495dab883c5c83d89808fa34f78ffac04eb44bd78fd12dc58f31d7d"
      },
      {
        "instanceId": "locomotion",
        "ownerId": "player-one",
        "moduleId": "locomotion.bounded",
        "version": "1.1.0",
        "kind": "locomotion",
        "implementationId": "locomotion.bounded.v1-1",
        "configurationSchemaId": "locomotion.bounded.config",
        "configuration": {
          "moveSpeed": 300,
          "bounds": {
            "left": 24,
            "right": 24,
            "top": 24,
            "bottom": 24
          },
          "absoluteMode": "clamp",
          "neutralMode": "zero-velocity"
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "a064dd75d018415059aa4934070bc1ea84009496244742bc9fefccaacf896ccf",
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
          "manifestSha256": "a064dd75d018415059aa4934070bc1ea84009496244742bc9fefccaacf896ccf",
          "configurationDescriptorSha256": "e4725e41c7da63bf4b8d3ca8a1a2c760673c1118f6be73f738f9af2836e7da0d",
          "reservationDescriptorSha256": "9c26433d8dcef54b1fa5cdea3d00c4a4d9a69bfbbed3ce3a37e42b47f8fc1b6f",
          "implementationBundleSha256": "0e2845f8c730f9b32bafca109867b41c912c19d83f71f914c6dcc323f8338921",
          "dependencyLockSha256": "5b498deec049fe835a9f07056297b89515949bc723867821f92110a0ab04db55",
          "toolchainIdentitySha256": "9a149b74eaf8e88bea1c3f4aa0a166ce306dcf155781bdb1a48e5ad05d22e735",
          "envelopeSha256": "4692ccb19733c57887102925be074d83dabcb73a6e990316e9ce9238c543723a"
        },
        "factoryContextVersion": "1.3.0",
        "runtimeContract": {
          "update": {
            "mode": "graph-frame-v1",
            "registrationId": "motion.update"
          },
          "timerSlots": {
            "slotGroupId": "main"
          },
          "inputRegistrations": [],
          "observationReaders": [
            {
              "readerId": "motion"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [
            {
              "id": "command",
              "payloadType": "resolved-movement-command-v1",
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
            },
            {
              "id": "speed-scale",
              "payloadType": "movement-scale-v1",
              "required": false,
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
          "outputPorts": []
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [],
          "observationReaderIds": [
            "motion"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "54570dd840659201eb0e0487d1dc3a7450d95707a7a8be5981f6f5e44dc4dc6b"
      },
      {
        "instanceId": "resolver",
        "ownerId": "enemy-one",
        "moduleId": "interaction.contact-resolution",
        "version": "1.1.0",
        "kind": "combat-interaction",
        "implementationId": "interaction.contact-resolution.v1-1",
        "configurationSchemaId": "interaction.contact-resolution.config",
        "configuration": {
          "policyProfileId": "batch1.default-damage",
          "policyProfileVersion": "1.0.0",
          "allowedDispositions": [
            "damage"
          ],
          "allowedSourceOperations": [
            "consume"
          ],
          "maxResolvedContacts": 64
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "fd7874b237bdb82a08b76f25ba4fb575c10d778bcb844a01aa428bc11b1c1d94",
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
          "instanceLeases": 3,
          "graphLeases": 0
        },
        "artifactIdentity": {
          "schemaVersion": "1.0.0",
          "algorithm": "sha256",
          "envelopeFormat": "module-registration-envelope-v1",
          "manifestSha256": "fd7874b237bdb82a08b76f25ba4fb575c10d778bcb844a01aa428bc11b1c1d94",
          "configurationDescriptorSha256": "8dee45e6761b65725a6adc566cc6834f9af91f30b8c8c3fd5d38fb59e5ff7dae",
          "reservationDescriptorSha256": "7cf892a61da8a880ffba09458f29d1af48fed6f003a146745d004027f4dfdc0a",
          "implementationBundleSha256": "6d682a724fe9c695b8ff0901d232517356c9169423f0c0121a7a37800c8a0481",
          "dependencyLockSha256": "3114db68a63f8cc7a5f8d6681980c6d48d25719a43a53f4df02dae977f348f15",
          "toolchainIdentitySha256": "35fe5f84f10587932b8d6b182469ac64fddb54bf4a6b06cd46d970c20ed4ab54",
          "envelopeSha256": "647206a93107cb0295a7d058b5b111cea63716e88b2c00fc50af0b09e113ef57"
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
              "readerId": "resolution"
            }
          ],
          "contactCommit": {
            "commitServiceId": "contact.commit",
            "maximumConcurrentCommits": 4,
            "admittedOperations": [
              "consume"
            ]
          }
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
                  "player",
                  "enemy",
                  "boss"
                ],
                "targetActorRoles": [
                  "player",
                  "enemy",
                  "boss"
                ],
                "sourceEntityRoles": [
                  "projectile"
                ]
              }
            },
            {
              "id": "candidate",
              "payloadType": "contact-candidate-v1",
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
            }
          ],
          "outputPorts": [
            {
              "id": "hit",
              "payloadType": "hit-v1",
              "delivery": "event"
            },
            {
              "id": "damage",
              "payloadType": "damage-v1",
              "delivery": "event"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [],
          "observationReaderIds": [
            "resolution"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "22b05da6a479e9d03a5c7130820dd69d5892bf76a84c6530715137f3c0b43c78"
      },
      {
        "instanceId": "targeting",
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
        "instanceId": "touch",
        "ownerId": "player-one",
        "moduleId": "intent.touch-drag",
        "version": "1.0.0",
        "kind": "player-intent",
        "implementationId": "intent.touch-drag.v1",
        "configurationSchemaId": "intent.touch-drag.config",
        "configuration": {
          "capture": "first-active",
          "release": "matching-pointer-up",
          "emitOnDown": false
        },
        "manifestSchemaVersion": "1.2.0",
        "instantiation": "production-eligible",
        "manifestSha256": "f18da1c54d0964e2b442d53c54c21560cbe820a7687cefd23c334038b2e4f2e9",
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
          "manifestSha256": "f18da1c54d0964e2b442d53c54c21560cbe820a7687cefd23c334038b2e4f2e9",
          "configurationDescriptorSha256": "8884fbaace9900b8cce6b689e3fc433524be19ded3d22f20caa930b5846d05b1",
          "reservationDescriptorSha256": "c5005923973583d38c4cec38d2578c3a33856fe3f1ebb6b2614a4be9922b84ee",
          "implementationBundleSha256": "aa5102bd10a4d35b822eb8505de712d493f496f1de72a9edf481ce334633e12f",
          "dependencyLockSha256": "e3f942b24b5b515fecc068c475a193034b13a127e1da280cea5b4ad14a03c78a",
          "toolchainIdentitySha256": "3f07da47c80fa46c2d89a7e064cd374ee726cf2c206c08dbfbe35326f9b04356",
          "envelopeSha256": "6b0f163881d2b3ffce945bacd5499eba9b85ea046021749b234b8256ec44cf90"
        },
        "factoryContextVersion": "1.2.0",
        "runtimeContract": {
          "update": null,
          "timerSlots": {
            "slotGroupId": "main"
          },
          "inputRegistrations": [
            {
              "registrationId": "pointer.down",
              "kind": "pointer-down"
            },
            {
              "registrationId": "pointer.move",
              "kind": "pointer-move"
            },
            {
              "registrationId": "pointer.up",
              "kind": "pointer-up"
            }
          ],
          "observationReaders": [
            {
              "readerId": "movement"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [],
          "outputPorts": [
            {
              "id": "command",
              "payloadType": "movement-command-v1",
              "delivery": "event"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [
            "pointer.down",
            "pointer.move",
            "pointer.up"
          ],
          "observationReaderIds": [
            "movement"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "4cdbcb36531f8cf15ada2f1263d5e96cc4e80b3c4ed2bcf27dbfae98c03a4faa"
      },
      {
        "instanceId": "trigger",
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
        "from": "arbiter",
        "to": "keyboard",
        "capabilityId": "intent.movement-source",
        "scope": "owner"
      },
      {
        "from": "arbiter",
        "to": "touch",
        "capabilityId": "intent.movement-source",
        "scope": "owner"
      },
      {
        "from": "delivery",
        "to": "targeting",
        "capabilityId": "targeting.solution-v2",
        "scope": "owner"
      },
      {
        "from": "delivery",
        "to": "trigger",
        "capabilityId": "trigger.attack-v2",
        "scope": "owner"
      },
      {
        "from": "detector",
        "to": "delivery",
        "capabilityId": "delivery.projectile-channel",
        "scope": "assembly"
      },
      {
        "from": "focus-speed",
        "to": "focus",
        "capabilityId": "intent.focus-source",
        "scope": "owner"
      },
      {
        "from": "locomotion",
        "to": "arbiter",
        "capabilityId": "intent.movement-resolved",
        "scope": "owner"
      },
      {
        "from": "resolver",
        "to": "detector",
        "capabilityId": "interaction.projectile-contact-candidate",
        "scope": "owner"
      },
      {
        "from": "resolver",
        "to": "health",
        "capabilityId": "combat.damage-sink",
        "scope": "owner"
      },
      {
        "from": "targeting",
        "to": "aim",
        "capabilityId": "intent.aim-source",
        "scope": "owner"
      },
      {
        "from": "trigger",
        "to": "attack-intent",
        "capabilityId": "intent.attack-source",
        "scope": "owner"
      }
    ],
    "bindings": [
      {
        "from": {
          "instanceId": "aim",
          "portId": "aim"
        },
        "to": {
          "instanceId": "targeting",
          "portId": "aim"
        },
        "payloadType": "aim-command-v1",
        "delivery": "state"
      },
      {
        "from": {
          "instanceId": "arbiter",
          "portId": "resolved"
        },
        "to": {
          "instanceId": "locomotion",
          "portId": "command"
        },
        "payloadType": "resolved-movement-command-v1",
        "delivery": "event"
      },
      {
        "from": {
          "instanceId": "attack-intent",
          "portId": "intent"
        },
        "to": {
          "instanceId": "trigger",
          "portId": "intent"
        },
        "payloadType": "attack-intent-v1",
        "delivery": "event"
      },
      {
        "from": {
          "instanceId": "delivery",
          "portId": "projectiles"
        },
        "to": {
          "instanceId": "detector",
          "portId": "sources"
        },
        "payloadType": "entity-channel-v1",
        "delivery": "state"
      },
      {
        "from": {
          "instanceId": "delivery",
          "portId": "projectiles"
        },
        "to": {
          "instanceId": "resolver",
          "portId": "sources"
        },
        "payloadType": "entity-channel-v1",
        "delivery": "state"
      },
      {
        "from": {
          "instanceId": "detector",
          "portId": "candidate"
        },
        "to": {
          "instanceId": "resolver",
          "portId": "candidate"
        },
        "payloadType": "contact-candidate-v1",
        "delivery": "event"
      },
      {
        "from": {
          "instanceId": "focus",
          "portId": "focus"
        },
        "to": {
          "instanceId": "focus-speed",
          "portId": "focus"
        },
        "payloadType": "focus-state-v1",
        "delivery": "state"
      },
      {
        "from": {
          "instanceId": "focus-speed",
          "portId": "scale"
        },
        "to": {
          "instanceId": "locomotion",
          "portId": "speed-scale"
        },
        "payloadType": "movement-scale-v1",
        "delivery": "state"
      },
      {
        "from": {
          "instanceId": "keyboard",
          "portId": "command"
        },
        "to": {
          "instanceId": "arbiter",
          "portId": "commands"
        },
        "payloadType": "movement-command-v1",
        "delivery": "event"
      },
      {
        "from": {
          "instanceId": "resolver",
          "portId": "damage"
        },
        "to": {
          "instanceId": "health",
          "portId": "damage"
        },
        "payloadType": "damage-v1",
        "delivery": "event"
      },
      {
        "from": {
          "instanceId": "targeting",
          "portId": "selection"
        },
        "to": {
          "instanceId": "delivery",
          "portId": "target"
        },
        "payloadType": "target-solution-v1",
        "delivery": "state"
      },
      {
        "from": {
          "instanceId": "touch",
          "portId": "command"
        },
        "to": {
          "instanceId": "arbiter",
          "portId": "commands"
        },
        "payloadType": "movement-command-v1",
        "delivery": "event"
      },
      {
        "from": {
          "instanceId": "trigger",
          "portId": "request"
        },
        "to": {
          "instanceId": "delivery",
          "portId": "request"
        },
        "payloadType": "attack-request-v2",
        "delivery": "event"
      }
    ],
    "constructionOrder": [
      "aim",
      "keyboard",
      "touch",
      "arbiter",
      "attack-intent",
      "default-policy",
      "targeting",
      "trigger",
      "delivery",
      "detector",
      "focus",
      "focus-speed",
      "health",
      "locomotion",
      "resolver"
    ],
    "assetBindings": [
      {
        "bindingId": "player-projectile",
        "roleId": "player-projectile",
        "category": "projectile",
        "runtimeSha256": "2222222222222222222222222222222222222222222222222222222222222222",
        "textureKey": "module/2222222222222222222222222222222222222222222222222222222222222222/player-projectile",
        "sharing": "instance",
        "consumerInstanceIds": [
          "delivery"
        ]
      }
    ],
    "contactPolicyProfiles": [
      {
        "consumerInstanceId": "resolver",
        "profileId": "batch1.default-damage",
        "version": "1.0.0",
        "evidenceHash": "fe907b71f1b56c3f1e75b13008376413fe41eb5e50d760f76707bb174dd9b818",
        "supportedChainEvidenceId": "batch1.default-damage.chain",
        "orderedPolicyInstanceIds": [
          "default-policy"
        ],
        "orderedPolicyArtifactHashes": [
          "435387a883a4ee3a09c15ea334056be0ca7e49989e5e5177847d2c066e4b3514"
        ]
      }
    ],
    "damageSinkRoutes": [
      {
        "ownerId": "enemy-one",
        "headInstanceId": "health",
        "orderedSinkInstanceIds": [
          "health"
        ],
        "terminalHealthInstanceId": "health",
        "producerInstanceIds": [
          "resolver"
        ]
      }
    ],
    "entityChannels": [
      {
        "channelId": "delivery.projectiles",
        "localChannelId": "projectiles",
        "ownerInstanceId": "delivery",
        "ownerActorId": "player-one",
        "outputPort": "projectiles",
        "entityRole": "projectile",
        "capacity": 16,
        "capacityResources": [
          "activeEntities",
          "activeProjectiles"
        ],
        "readerInstanceIds": [
          "detector",
          "resolver"
        ],
        "sourceArtifactEnvelopeSha256": "3683ea403f08d7bf7e253581e31da7b4e2ed0a9265dcff3b5ac329a823eea79a"
      }
    ],
    "entityMutationGrants": [
      {
        "grantId": "resolver.projectile.consume",
        "accessId": "projectile.consume",
        "granteeInstanceId": "resolver",
        "channelId": "delivery.projectiles",
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
        "targetingInstanceId": "targeting",
        "triggerInstanceId": "trigger",
        "deliveryInstanceId": "delivery",
        "targetBinding": {
          "from": {
            "instanceId": "targeting",
            "portId": "selection"
          },
          "to": {
            "instanceId": "delivery",
            "portId": "target"
          },
          "payloadType": "target-solution-v1",
          "delivery": "state"
        },
        "requestBinding": {
          "from": {
            "instanceId": "trigger",
            "portId": "request"
          },
          "to": {
            "instanceId": "delivery",
            "portId": "request"
          },
          "payloadType": "attack-request-v2",
          "delivery": "event"
        }
      }
    ],
    "projectileChannelLineages": [
      {
        "lineageId": "detector/projectile-lineage/delivery.projectiles",
        "providerInstanceId": "delivery",
        "providerCapabilityId": "delivery.projectile-channel",
        "sourceBinding": {
          "from": {
            "instanceId": "delivery",
            "portId": "projectiles"
          },
          "to": {
            "instanceId": "detector",
            "portId": "sources"
          },
          "payloadType": "entity-channel-v1",
          "delivery": "state"
        },
        "channelId": "delivery.projectiles",
        "channelOutputPort": "projectiles",
        "consumerInstanceId": "detector",
        "consumerInputPort": "sources"
      }
    ],
    "effectApplicationRoutes": [],
    "pickupEffectPlans": [],
    "projectileBudgetContention": {
      "budget": {
        "activeProjectiles": 16,
        "spawnsPerSecond": 40
      },
      "totals": {
        "activeProjectiles": 16,
        "spawnsPerSecond": 40
      },
      "orderedOwners": [
        {
          "resolvedOrder": 8,
          "instanceId": "delivery",
          "ownerActorId": "player-one",
          "attackChannelId": "player.primary",
          "channelId": "delivery.projectiles",
          "poolId": "delivery.projectiles.pool",
          "activeProjectiles": 16,
          "spawnsPerSecond": 40,
          "cumulativeActiveProjectiles": 16,
          "cumulativeSpawnsPerSecond": 40
        }
      ]
    },
    "resourceTotals": {
      "activeEntities": 16,
      "activeProjectiles": 16,
      "spawnsPerSecond": 40,
      "timers": 0
    }
  },
  {
    "graphVersion": "1.3.0",
    "assemblyId": "batch2.formation-aimed",
    "kernelVersion": "1.0.0",
    "engine": {
      "id": "phaser",
      "version": "3.90.0"
    },
    "executionReadiness": {
      "status": "ready",
      "evidenceId": "0b653e802cc5cd16b37af68d2b8d9b544904e48f36fca00220af085012c7b875"
    },
    "catalogEvidenceId": "f8e409ea933585084c0e466d217f3a026247d85a2ab29dd7ec65a09e346180d4",
    "actors": [
      {
        "actorId": "player-one",
        "role": "player"
      },
      {
        "actorId": "enemy-one",
        "role": "enemy"
      }
    ],
    "modules": [
      {
        "instanceId": "aim",
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
        "instanceId": "arbiter",
        "ownerId": "player-one",
        "moduleId": "intent.movement-arbiter",
        "version": "1.0.0",
        "kind": "player-intent",
        "implementationId": "intent.movement-arbiter.v1",
        "configurationSchemaId": "intent.movement-arbiter.config",
        "configuration": {
          "policy": "touch-while-active-else-keyboard",
          "keyboardSourceId": "keyboard",
          "touchSourceId": "touch"
        },
        "manifestSchemaVersion": "1.2.0",
        "instantiation": "production-eligible",
        "manifestSha256": "9d43ffcccd085ad78b3ff81bc2182f651117c33fd327a035aeb91ba46b0f4d33",
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
          "instanceLeases": 1,
          "graphLeases": 0
        },
        "artifactIdentity": {
          "schemaVersion": "1.0.0",
          "algorithm": "sha256",
          "envelopeFormat": "module-registration-envelope-v1",
          "manifestSha256": "9d43ffcccd085ad78b3ff81bc2182f651117c33fd327a035aeb91ba46b0f4d33",
          "configurationDescriptorSha256": "9e09d39adeba78199db1be2373cbcdd2e81c8f2a0dc5e00b2200ea42896ec7ba",
          "reservationDescriptorSha256": "a5dcc7a7281d264f7f5876e30d17c68628b8bcce2de3820debfd35b491640a8e",
          "implementationBundleSha256": "82db7e4096b0d2d491829be4fc60a4401c963513225a9be44cceb5c82bbda0c6",
          "dependencyLockSha256": "e3f942b24b5b515fecc068c475a193034b13a127e1da280cea5b4ad14a03c78a",
          "toolchainIdentitySha256": "3f07da47c80fa46c2d89a7e064cd374ee726cf2c206c08dbfbe35326f9b04356",
          "envelopeSha256": "a46bcb6e7b257b0bdc9649aa34aad0c183df155b497d76e95db061e95f5785e1"
        },
        "factoryContextVersion": "1.2.0",
        "runtimeContract": {
          "update": null,
          "timerSlots": {
            "slotGroupId": "main"
          },
          "inputRegistrations": [],
          "observationReaders": [
            {
              "readerId": "arbitration"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [
            {
              "id": "commands",
              "payloadType": "movement-command-v1",
              "required": true,
              "multiple": true,
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
              "id": "resolved",
              "payloadType": "resolved-movement-command-v1",
              "delivery": "event"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [],
          "observationReaderIds": [
            "arbitration"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "02f001a3d921d7daa4a3c0facf2e4e8b40d839837621ac926de6b843666e144a"
      },
      {
        "instanceId": "attack-intent",
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
        "instanceId": "default-policy",
        "ownerId": "enemy-one",
        "moduleId": "interaction.contact-default-damage",
        "version": "1.0.0",
        "kind": "combat-interaction",
        "implementationId": "interaction.contact-default-damage.v1",
        "configurationSchemaId": "interaction.contact-default-damage.config",
        "configuration": {
          "damageKind": "projectile",
          "defaultDisposition": "damage",
          "defaultSourceOperation": "consume"
        },
        "manifestSchemaVersion": "1.2.0",
        "instantiation": "production-eligible",
        "manifestSha256": "a3ac7549ae42c55a26596c3da80afce9d565d7dd53bc135ade5e6a4e1a72c268",
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
          "manifestSha256": "a3ac7549ae42c55a26596c3da80afce9d565d7dd53bc135ade5e6a4e1a72c268",
          "configurationDescriptorSha256": "00943acb6e746288ff8a7fc6c677309793357849fbf008b1c1b380b0c2950eec",
          "reservationDescriptorSha256": "703c43c468c12d92643fa16af0e86c3d483d08cd499b63d76fa95bf9b399c019",
          "implementationBundleSha256": "f7aa1b981073d2e11feed1f7e7690f8a1ade75ccabd6ab6b8d4c9b29c8dc946a",
          "dependencyLockSha256": "e3f942b24b5b515fecc068c475a193034b13a127e1da280cea5b4ad14a03c78a",
          "toolchainIdentitySha256": "3f07da47c80fa46c2d89a7e064cd374ee726cf2c206c08dbfbe35326f9b04356",
          "envelopeSha256": "435387a883a4ee3a09c15ea334056be0ca7e49989e5e5177847d2c066e4b3514"
        },
        "factoryContextVersion": "1.2.0",
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
        "catalogEntryEvidenceId": "d7020b6df92e644270d1b51397bd4fa09885c97138927afcf2f97884d284ee76"
      },
      {
        "instanceId": "delivery",
        "ownerId": "player-one",
        "moduleId": "delivery.pattern.aimed",
        "version": "1.0.0",
        "kind": "attack-delivery",
        "implementationId": "delivery.pattern.aimed.v1",
        "configurationSchemaId": "delivery.pattern.aimed.config",
        "configuration": {
          "attackChannelId": "player.primary",
          "baseCount": 3,
          "speed": 600,
          "baseDamage": 10,
          "textureRole": "player-projectile",
          "spawnOffset": {
            "x": 0,
            "y": -28
          },
          "maxActive": 16,
          "maximumAcceptedRequestsPerSecond": 10,
          "maximumCountBonus": 1,
          "maximumDamageMultiplier": 2,
          "recycleMargin": 32,
          "exhaustionPolicy": "drop-and-observe",
          "aimSpreadDegrees": 30
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "c07908c25be5b5d4cfa5f9b9759a9f20b3e12c6004fcef98e2c40f02e49a1d38",
        "resources": {
          "activeEntities": 256,
          "activeProjectiles": 256,
          "spawnsPerSecond": 2560,
          "timers": 0
        },
        "resourceGrant": {
          "activeEntities": 16,
          "activeProjectiles": 16,
          "spawnsPerSecond": 40,
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
          "manifestSha256": "c07908c25be5b5d4cfa5f9b9759a9f20b3e12c6004fcef98e2c40f02e49a1d38",
          "configurationDescriptorSha256": "625196382cd5a01c74d87e1ad2e874e7e9539c83f7236ec6b85367ca606b79e3",
          "reservationDescriptorSha256": "e84395486242aa580d7ea2091dfd08602042601a63121ba47f24850f837238cb",
          "implementationBundleSha256": "e658387ae10c64775b4682e621368c9364d4aff41581168697666655e73b2d33",
          "dependencyLockSha256": "3a62cb4fa8c1835c5496c91fc4b6018ad52d0e2a9f7c6e03b05675f5f973cd0c",
          "toolchainIdentitySha256": "d36c05bbb20980385899dc98650138698cc54f619092b6d415a24983e56552d0",
          "envelopeSha256": "0efc8ec1a55b8e1dfa22ab33b2ad3ecab87d7df35a04265e5191988c3d2572f0"
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
        "catalogEntryEvidenceId": "0e8359f9673fb38b350196c2e28cd823d49045135624a6cfe964112fe822b374"
      },
      {
        "instanceId": "detector",
        "ownerId": "enemy-one",
        "moduleId": "interaction.projectile-contact",
        "version": "1.1.0",
        "kind": "combat-interaction",
        "implementationId": "interaction.projectile-contact.v1-1",
        "configurationSchemaId": "interaction.projectile-contact.config",
        "configuration": {
          "sourceEntityRole": "projectile",
          "targetActorRole": "enemy",
          "maximumTrackedContacts": 64
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "a0ef6b9ec62ee0a0024baaa27c1da58a1223fca144a0522f457f048c2bff2c3c",
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
          "manifestSha256": "a0ef6b9ec62ee0a0024baaa27c1da58a1223fca144a0522f457f048c2bff2c3c",
          "configurationDescriptorSha256": "48426de270d5cbf02a8a961a77a90525bddfa11100a260581393becce7c3b31e",
          "reservationDescriptorSha256": "b37389b46ed44dbce09e7dbb2ddf633a1d991a6427731f1c225d4b7c42754fa7",
          "implementationBundleSha256": "a7b7703e206df2501a9a3feb60a815e7051362f046ad35dd6a2b39e8fdde0285",
          "dependencyLockSha256": "3114db68a63f8cc7a5f8d6681980c6d48d25719a43a53f4df02dae977f348f15",
          "toolchainIdentitySha256": "35fe5f84f10587932b8d6b182469ac64fddb54bf4a6b06cd46d970c20ed4ab54",
          "envelopeSha256": "790081f65a1f295c78af5d5489678a675bbb59b5e04ecaa710bdad8851a18bc8"
        },
        "factoryContextVersion": "1.3.0",
        "runtimeContract": {
          "update": {
            "mode": "graph-frame-v1",
            "registrationId": "contact.update"
          },
          "timerSlots": {
            "slotGroupId": "main"
          },
          "inputRegistrations": [],
          "observationReaders": [
            {
              "readerId": "contacts"
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
                  "player",
                  "enemy",
                  "boss"
                ],
                "targetActorRoles": [
                  "player",
                  "enemy",
                  "boss"
                ],
                "sourceEntityRoles": [
                  "projectile"
                ]
              }
            }
          ],
          "outputPorts": [
            {
              "id": "candidate",
              "payloadType": "contact-candidate-v1",
              "delivery": "event"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [],
          "observationReaderIds": [
            "contacts"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": [],
          "overlapRuleId": "projectile.overlap"
        },
        "catalogEntryEvidenceId": "7347c0195e10a7be2b1d703a104824c3dfd641c9a0f426d1e496a41fa73092a0"
      },
      {
        "instanceId": "focus",
        "ownerId": "player-one",
        "moduleId": "intent.focus",
        "version": "1.0.0",
        "kind": "player-intent",
        "implementationId": "intent.focus.v1",
        "configurationSchemaId": "intent.focus.config",
        "configuration": {
          "device": "keyboard",
          "control": "ShiftLeft",
          "initialFocused": false
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "aacb922e96b26e55426cfd454b8bbb54ebe987c894b7a4f362e8092ffebe6792",
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
          "manifestSha256": "aacb922e96b26e55426cfd454b8bbb54ebe987c894b7a4f362e8092ffebe6792",
          "configurationDescriptorSha256": "b4151a58965ec35b2463dc7d11b3d4a1ba48a96e95889856ca30a06003b0f14e",
          "reservationDescriptorSha256": "bb684f2c92d8fef75f30a599bac371807de81d63d040936e472830c3072d39d6",
          "implementationBundleSha256": "aca82a0d51b7a0bb9c2f1b0aee52ddf5bee64c9fb277abceb33398d9b7289847",
          "dependencyLockSha256": "5b498deec049fe835a9f07056297b89515949bc723867821f92110a0ab04db55",
          "toolchainIdentitySha256": "9a149b74eaf8e88bea1c3f4aa0a166ce306dcf155781bdb1a48e5ad05d22e735",
          "envelopeSha256": "95fb5f3bcff3dac4262d9b9054a59f2e303657e445d4f230f1ef3e819d0afa3e"
        },
        "factoryContextVersion": "1.3.0",
        "runtimeContract": {
          "update": null,
          "timerSlots": {
            "slotGroupId": "main"
          },
          "inputRegistrations": [
            {
              "registrationId": "focus.keyboard",
              "kind": "keyboard"
            }
          ],
          "observationReaders": [
            {
              "readerId": "focus"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [],
          "outputPorts": [
            {
              "id": "focus",
              "payloadType": "focus-state-v1",
              "delivery": "state"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [
            "focus.keyboard"
          ],
          "observationReaderIds": [
            "focus"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "23e74a23b5bf7fe53d7ce537dc39ddaeea9b12c0cf8ba0fe5533fba082d20387"
      },
      {
        "instanceId": "focus-speed",
        "ownerId": "player-one",
        "moduleId": "locomotion.focus-speed",
        "version": "1.0.0",
        "kind": "locomotion",
        "implementationId": "locomotion.focus-speed.v1",
        "configurationSchemaId": "locomotion.focus-speed.config",
        "configuration": {
          "multiplier": 0.5,
          "releaseBehavior": "restore"
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "8838f8fe9118c00d243f8d07e01b72fcb1eda0b959a91440930c8f03e975cc20",
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
          "instanceLeases": 3,
          "graphLeases": 0
        },
        "artifactIdentity": {
          "schemaVersion": "1.0.0",
          "algorithm": "sha256",
          "envelopeFormat": "module-registration-envelope-v1",
          "manifestSha256": "8838f8fe9118c00d243f8d07e01b72fcb1eda0b959a91440930c8f03e975cc20",
          "configurationDescriptorSha256": "fb5200ee9a2516b39444b304128e8795afdf6033e8ff6e5c17215c579fc823df",
          "reservationDescriptorSha256": "cb6d1c270296c65cd1dc255f6d8878574369b3d9c6dbc0eefce3f7a00a0184ef",
          "implementationBundleSha256": "20e61c459007c50f75fca426c84cf2cc33f323d940fadc5877b78008e0e32f94",
          "dependencyLockSha256": "5b498deec049fe835a9f07056297b89515949bc723867821f92110a0ab04db55",
          "toolchainIdentitySha256": "9a149b74eaf8e88bea1c3f4aa0a166ce306dcf155781bdb1a48e5ad05d22e735",
          "envelopeSha256": "b3876bcfbeb935e08ad14d31e5f8b404fca9612ac423ba951745db88543b8b80"
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
              "readerId": "scale"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [
            {
              "id": "focus",
              "payloadType": "focus-state-v1",
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
              "id": "scale",
              "payloadType": "movement-scale-v1",
              "delivery": "state"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [],
          "observationReaderIds": [
            "scale"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "28dce4daad405345fb8cca1b45e0b010ea80f43e6de68bb5bca668daf6a5b939"
      },
      {
        "instanceId": "health",
        "ownerId": "enemy-one",
        "moduleId": "combat.health",
        "version": "1.1.0",
        "kind": "combat-interaction",
        "implementationId": "combat.health.v1-1",
        "configurationSchemaId": "combat.health.config",
        "configuration": {
          "maxHealth": 100,
          "initialHealth": 100,
          "damageFloor": 0
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "fa44309ba0be253fd38eb2ddef9a561e51022b9fe0224a83bd2cbd843267b978",
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
          "manifestSha256": "fa44309ba0be253fd38eb2ddef9a561e51022b9fe0224a83bd2cbd843267b978",
          "configurationDescriptorSha256": "093319fcdda8033b14dc680866d669ecbeb2a504965ccb5b8fbda9d22b94ef78",
          "reservationDescriptorSha256": "61db0f8672eb0103417c04d5f8520c88f2767e115cfb49b25c90f20ee3bb9ac4",
          "implementationBundleSha256": "0cb86bf62b96da2f59bec176c24aafa96c2fc99a0320c83ead033ac391c9345b",
          "dependencyLockSha256": "3114db68a63f8cc7a5f8d6681980c6d48d25719a43a53f4df02dae977f348f15",
          "toolchainIdentitySha256": "35fe5f84f10587932b8d6b182469ac64fddb54bf4a6b06cd46d970c20ed4ab54",
          "envelopeSha256": "dd72a85fda2a408eb0f229eb14db6999b9b984b45d16b00df2d676ef3362762e"
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
              "readerId": "health"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [
            {
              "id": "damage",
              "payloadType": "damage-v1",
              "required": true,
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
            },
            {
              "id": "modifier",
              "payloadType": "modifier-application-v1",
              "required": false,
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
            }
          ],
          "outputPorts": [
            {
              "id": "state",
              "payloadType": "health-state-v2",
              "delivery": "state"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [],
          "observationReaderIds": [
            "health"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": [
            "combat.health.current"
          ]
        },
        "catalogEntryEvidenceId": "377f7230f13bc06f4b9ab7d0a0758ba990b0352dea05fddf76936863d3a2bd63"
      },
      {
        "instanceId": "keyboard",
        "ownerId": "player-one",
        "moduleId": "intent.keyboard-movement",
        "version": "1.0.0",
        "kind": "player-intent",
        "implementationId": "intent.keyboard-movement.v1",
        "configurationSchemaId": "intent.keyboard-movement.config",
        "configuration": {
          "bindings": "arrows-and-wasd",
          "normalizeDiagonal": true,
          "emitNeutral": true
        },
        "manifestSchemaVersion": "1.2.0",
        "instantiation": "production-eligible",
        "manifestSha256": "e7e44de719a3683b6d9df4ab640e2381a320948bf374a72f7d4a77214415afb9",
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
          "manifestSha256": "e7e44de719a3683b6d9df4ab640e2381a320948bf374a72f7d4a77214415afb9",
          "configurationDescriptorSha256": "9b015e9b8889308b15831199a276d85e979783081ccc9110ca0a879f143bfc38",
          "reservationDescriptorSha256": "38d096bdc34753c5e32889205da48f25511978a621498733181be8a6dc0c6d1d",
          "implementationBundleSha256": "eb83666306347da2410859d3c907152d91e562e6530403a44f843f88dcd4fd7a",
          "dependencyLockSha256": "e3f942b24b5b515fecc068c475a193034b13a127e1da280cea5b4ad14a03c78a",
          "toolchainIdentitySha256": "3f07da47c80fa46c2d89a7e064cd374ee726cf2c206c08dbfbe35326f9b04356",
          "envelopeSha256": "4a2b9dc74b5c7beb16827b0a2e4c8f84256d5a12fa7de8dd7c54556bc501c11b"
        },
        "factoryContextVersion": "1.2.0",
        "runtimeContract": {
          "update": {
            "mode": "graph-frame-v1",
            "registrationId": "keyboard.update"
          },
          "timerSlots": {
            "slotGroupId": "main"
          },
          "inputRegistrations": [
            {
              "registrationId": "keyboard.direction",
              "kind": "keyboard"
            }
          ],
          "observationReaders": [
            {
              "readerId": "movement"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [],
          "outputPorts": [
            {
              "id": "command",
              "payloadType": "movement-command-v1",
              "delivery": "event"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [
            "keyboard.direction"
          ],
          "observationReaderIds": [
            "movement"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "63839ea8e495dab883c5c83d89808fa34f78ffac04eb44bd78fd12dc58f31d7d"
      },
      {
        "instanceId": "locomotion",
        "ownerId": "player-one",
        "moduleId": "locomotion.bounded",
        "version": "1.1.0",
        "kind": "locomotion",
        "implementationId": "locomotion.bounded.v1-1",
        "configurationSchemaId": "locomotion.bounded.config",
        "configuration": {
          "moveSpeed": 300,
          "bounds": {
            "left": 24,
            "right": 24,
            "top": 24,
            "bottom": 24
          },
          "absoluteMode": "clamp",
          "neutralMode": "zero-velocity"
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "a064dd75d018415059aa4934070bc1ea84009496244742bc9fefccaacf896ccf",
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
          "manifestSha256": "a064dd75d018415059aa4934070bc1ea84009496244742bc9fefccaacf896ccf",
          "configurationDescriptorSha256": "e4725e41c7da63bf4b8d3ca8a1a2c760673c1118f6be73f738f9af2836e7da0d",
          "reservationDescriptorSha256": "9c26433d8dcef54b1fa5cdea3d00c4a4d9a69bfbbed3ce3a37e42b47f8fc1b6f",
          "implementationBundleSha256": "0e2845f8c730f9b32bafca109867b41c912c19d83f71f914c6dcc323f8338921",
          "dependencyLockSha256": "5b498deec049fe835a9f07056297b89515949bc723867821f92110a0ab04db55",
          "toolchainIdentitySha256": "9a149b74eaf8e88bea1c3f4aa0a166ce306dcf155781bdb1a48e5ad05d22e735",
          "envelopeSha256": "4692ccb19733c57887102925be074d83dabcb73a6e990316e9ce9238c543723a"
        },
        "factoryContextVersion": "1.3.0",
        "runtimeContract": {
          "update": {
            "mode": "graph-frame-v1",
            "registrationId": "motion.update"
          },
          "timerSlots": {
            "slotGroupId": "main"
          },
          "inputRegistrations": [],
          "observationReaders": [
            {
              "readerId": "motion"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [
            {
              "id": "command",
              "payloadType": "resolved-movement-command-v1",
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
            },
            {
              "id": "speed-scale",
              "payloadType": "movement-scale-v1",
              "required": false,
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
          "outputPorts": []
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [],
          "observationReaderIds": [
            "motion"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "54570dd840659201eb0e0487d1dc3a7450d95707a7a8be5981f6f5e44dc4dc6b"
      },
      {
        "instanceId": "resolver",
        "ownerId": "enemy-one",
        "moduleId": "interaction.contact-resolution",
        "version": "1.1.0",
        "kind": "combat-interaction",
        "implementationId": "interaction.contact-resolution.v1-1",
        "configurationSchemaId": "interaction.contact-resolution.config",
        "configuration": {
          "policyProfileId": "batch1.default-damage",
          "policyProfileVersion": "1.0.0",
          "allowedDispositions": [
            "damage"
          ],
          "allowedSourceOperations": [
            "consume"
          ],
          "maxResolvedContacts": 64
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "fd7874b237bdb82a08b76f25ba4fb575c10d778bcb844a01aa428bc11b1c1d94",
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
          "instanceLeases": 3,
          "graphLeases": 0
        },
        "artifactIdentity": {
          "schemaVersion": "1.0.0",
          "algorithm": "sha256",
          "envelopeFormat": "module-registration-envelope-v1",
          "manifestSha256": "fd7874b237bdb82a08b76f25ba4fb575c10d778bcb844a01aa428bc11b1c1d94",
          "configurationDescriptorSha256": "8dee45e6761b65725a6adc566cc6834f9af91f30b8c8c3fd5d38fb59e5ff7dae",
          "reservationDescriptorSha256": "7cf892a61da8a880ffba09458f29d1af48fed6f003a146745d004027f4dfdc0a",
          "implementationBundleSha256": "6d682a724fe9c695b8ff0901d232517356c9169423f0c0121a7a37800c8a0481",
          "dependencyLockSha256": "3114db68a63f8cc7a5f8d6681980c6d48d25719a43a53f4df02dae977f348f15",
          "toolchainIdentitySha256": "35fe5f84f10587932b8d6b182469ac64fddb54bf4a6b06cd46d970c20ed4ab54",
          "envelopeSha256": "647206a93107cb0295a7d058b5b111cea63716e88b2c00fc50af0b09e113ef57"
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
              "readerId": "resolution"
            }
          ],
          "contactCommit": {
            "commitServiceId": "contact.commit",
            "maximumConcurrentCommits": 4,
            "admittedOperations": [
              "consume"
            ]
          }
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
                  "player",
                  "enemy",
                  "boss"
                ],
                "targetActorRoles": [
                  "player",
                  "enemy",
                  "boss"
                ],
                "sourceEntityRoles": [
                  "projectile"
                ]
              }
            },
            {
              "id": "candidate",
              "payloadType": "contact-candidate-v1",
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
            }
          ],
          "outputPorts": [
            {
              "id": "hit",
              "payloadType": "hit-v1",
              "delivery": "event"
            },
            {
              "id": "damage",
              "payloadType": "damage-v1",
              "delivery": "event"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [],
          "observationReaderIds": [
            "resolution"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "22b05da6a479e9d03a5c7130820dd69d5892bf76a84c6530715137f3c0b43c78"
      },
      {
        "instanceId": "targeting",
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
        "instanceId": "touch",
        "ownerId": "player-one",
        "moduleId": "intent.touch-drag",
        "version": "1.0.0",
        "kind": "player-intent",
        "implementationId": "intent.touch-drag.v1",
        "configurationSchemaId": "intent.touch-drag.config",
        "configuration": {
          "capture": "first-active",
          "release": "matching-pointer-up",
          "emitOnDown": false
        },
        "manifestSchemaVersion": "1.2.0",
        "instantiation": "production-eligible",
        "manifestSha256": "f18da1c54d0964e2b442d53c54c21560cbe820a7687cefd23c334038b2e4f2e9",
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
          "manifestSha256": "f18da1c54d0964e2b442d53c54c21560cbe820a7687cefd23c334038b2e4f2e9",
          "configurationDescriptorSha256": "8884fbaace9900b8cce6b689e3fc433524be19ded3d22f20caa930b5846d05b1",
          "reservationDescriptorSha256": "c5005923973583d38c4cec38d2578c3a33856fe3f1ebb6b2614a4be9922b84ee",
          "implementationBundleSha256": "aa5102bd10a4d35b822eb8505de712d493f496f1de72a9edf481ce334633e12f",
          "dependencyLockSha256": "e3f942b24b5b515fecc068c475a193034b13a127e1da280cea5b4ad14a03c78a",
          "toolchainIdentitySha256": "3f07da47c80fa46c2d89a7e064cd374ee726cf2c206c08dbfbe35326f9b04356",
          "envelopeSha256": "6b0f163881d2b3ffce945bacd5499eba9b85ea046021749b234b8256ec44cf90"
        },
        "factoryContextVersion": "1.2.0",
        "runtimeContract": {
          "update": null,
          "timerSlots": {
            "slotGroupId": "main"
          },
          "inputRegistrations": [
            {
              "registrationId": "pointer.down",
              "kind": "pointer-down"
            },
            {
              "registrationId": "pointer.move",
              "kind": "pointer-move"
            },
            {
              "registrationId": "pointer.up",
              "kind": "pointer-up"
            }
          ],
          "observationReaders": [
            {
              "readerId": "movement"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [],
          "outputPorts": [
            {
              "id": "command",
              "payloadType": "movement-command-v1",
              "delivery": "event"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [
            "pointer.down",
            "pointer.move",
            "pointer.up"
          ],
          "observationReaderIds": [
            "movement"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "4cdbcb36531f8cf15ada2f1263d5e96cc4e80b3c4ed2bcf27dbfae98c03a4faa"
      },
      {
        "instanceId": "trigger",
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
        "from": "arbiter",
        "to": "keyboard",
        "capabilityId": "intent.movement-source",
        "scope": "owner"
      },
      {
        "from": "arbiter",
        "to": "touch",
        "capabilityId": "intent.movement-source",
        "scope": "owner"
      },
      {
        "from": "delivery",
        "to": "targeting",
        "capabilityId": "targeting.solution-v2",
        "scope": "owner"
      },
      {
        "from": "delivery",
        "to": "trigger",
        "capabilityId": "trigger.attack-v2",
        "scope": "owner"
      },
      {
        "from": "detector",
        "to": "delivery",
        "capabilityId": "delivery.projectile-channel",
        "scope": "assembly"
      },
      {
        "from": "focus-speed",
        "to": "focus",
        "capabilityId": "intent.focus-source",
        "scope": "owner"
      },
      {
        "from": "locomotion",
        "to": "arbiter",
        "capabilityId": "intent.movement-resolved",
        "scope": "owner"
      },
      {
        "from": "resolver",
        "to": "detector",
        "capabilityId": "interaction.projectile-contact-candidate",
        "scope": "owner"
      },
      {
        "from": "resolver",
        "to": "health",
        "capabilityId": "combat.damage-sink",
        "scope": "owner"
      },
      {
        "from": "targeting",
        "to": "aim",
        "capabilityId": "intent.aim-source",
        "scope": "owner"
      },
      {
        "from": "trigger",
        "to": "attack-intent",
        "capabilityId": "intent.attack-source",
        "scope": "owner"
      }
    ],
    "bindings": [
      {
        "from": {
          "instanceId": "aim",
          "portId": "aim"
        },
        "to": {
          "instanceId": "targeting",
          "portId": "aim"
        },
        "payloadType": "aim-command-v1",
        "delivery": "state"
      },
      {
        "from": {
          "instanceId": "arbiter",
          "portId": "resolved"
        },
        "to": {
          "instanceId": "locomotion",
          "portId": "command"
        },
        "payloadType": "resolved-movement-command-v1",
        "delivery": "event"
      },
      {
        "from": {
          "instanceId": "attack-intent",
          "portId": "intent"
        },
        "to": {
          "instanceId": "trigger",
          "portId": "intent"
        },
        "payloadType": "attack-intent-v1",
        "delivery": "event"
      },
      {
        "from": {
          "instanceId": "delivery",
          "portId": "projectiles"
        },
        "to": {
          "instanceId": "detector",
          "portId": "sources"
        },
        "payloadType": "entity-channel-v1",
        "delivery": "state"
      },
      {
        "from": {
          "instanceId": "delivery",
          "portId": "projectiles"
        },
        "to": {
          "instanceId": "resolver",
          "portId": "sources"
        },
        "payloadType": "entity-channel-v1",
        "delivery": "state"
      },
      {
        "from": {
          "instanceId": "detector",
          "portId": "candidate"
        },
        "to": {
          "instanceId": "resolver",
          "portId": "candidate"
        },
        "payloadType": "contact-candidate-v1",
        "delivery": "event"
      },
      {
        "from": {
          "instanceId": "focus",
          "portId": "focus"
        },
        "to": {
          "instanceId": "focus-speed",
          "portId": "focus"
        },
        "payloadType": "focus-state-v1",
        "delivery": "state"
      },
      {
        "from": {
          "instanceId": "focus-speed",
          "portId": "scale"
        },
        "to": {
          "instanceId": "locomotion",
          "portId": "speed-scale"
        },
        "payloadType": "movement-scale-v1",
        "delivery": "state"
      },
      {
        "from": {
          "instanceId": "keyboard",
          "portId": "command"
        },
        "to": {
          "instanceId": "arbiter",
          "portId": "commands"
        },
        "payloadType": "movement-command-v1",
        "delivery": "event"
      },
      {
        "from": {
          "instanceId": "resolver",
          "portId": "damage"
        },
        "to": {
          "instanceId": "health",
          "portId": "damage"
        },
        "payloadType": "damage-v1",
        "delivery": "event"
      },
      {
        "from": {
          "instanceId": "targeting",
          "portId": "selection"
        },
        "to": {
          "instanceId": "delivery",
          "portId": "target"
        },
        "payloadType": "target-solution-v1",
        "delivery": "state"
      },
      {
        "from": {
          "instanceId": "touch",
          "portId": "command"
        },
        "to": {
          "instanceId": "arbiter",
          "portId": "commands"
        },
        "payloadType": "movement-command-v1",
        "delivery": "event"
      },
      {
        "from": {
          "instanceId": "trigger",
          "portId": "request"
        },
        "to": {
          "instanceId": "delivery",
          "portId": "request"
        },
        "payloadType": "attack-request-v2",
        "delivery": "event"
      }
    ],
    "constructionOrder": [
      "aim",
      "keyboard",
      "touch",
      "arbiter",
      "attack-intent",
      "default-policy",
      "targeting",
      "trigger",
      "delivery",
      "detector",
      "focus",
      "focus-speed",
      "health",
      "locomotion",
      "resolver"
    ],
    "assetBindings": [
      {
        "bindingId": "player-projectile",
        "roleId": "player-projectile",
        "category": "projectile",
        "runtimeSha256": "2222222222222222222222222222222222222222222222222222222222222222",
        "textureKey": "module/2222222222222222222222222222222222222222222222222222222222222222/player-projectile",
        "sharing": "instance",
        "consumerInstanceIds": [
          "delivery"
        ]
      }
    ],
    "contactPolicyProfiles": [
      {
        "consumerInstanceId": "resolver",
        "profileId": "batch1.default-damage",
        "version": "1.0.0",
        "evidenceHash": "fe907b71f1b56c3f1e75b13008376413fe41eb5e50d760f76707bb174dd9b818",
        "supportedChainEvidenceId": "batch1.default-damage.chain",
        "orderedPolicyInstanceIds": [
          "default-policy"
        ],
        "orderedPolicyArtifactHashes": [
          "435387a883a4ee3a09c15ea334056be0ca7e49989e5e5177847d2c066e4b3514"
        ]
      }
    ],
    "damageSinkRoutes": [
      {
        "ownerId": "enemy-one",
        "headInstanceId": "health",
        "orderedSinkInstanceIds": [
          "health"
        ],
        "terminalHealthInstanceId": "health",
        "producerInstanceIds": [
          "resolver"
        ]
      }
    ],
    "entityChannels": [
      {
        "channelId": "delivery.projectiles",
        "localChannelId": "projectiles",
        "ownerInstanceId": "delivery",
        "ownerActorId": "player-one",
        "outputPort": "projectiles",
        "entityRole": "projectile",
        "capacity": 16,
        "capacityResources": [
          "activeEntities",
          "activeProjectiles"
        ],
        "readerInstanceIds": [
          "detector",
          "resolver"
        ],
        "sourceArtifactEnvelopeSha256": "0efc8ec1a55b8e1dfa22ab33b2ad3ecab87d7df35a04265e5191988c3d2572f0"
      }
    ],
    "entityMutationGrants": [
      {
        "grantId": "resolver.projectile.consume",
        "accessId": "projectile.consume",
        "granteeInstanceId": "resolver",
        "channelId": "delivery.projectiles",
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
        "targetingInstanceId": "targeting",
        "triggerInstanceId": "trigger",
        "deliveryInstanceId": "delivery",
        "targetBinding": {
          "from": {
            "instanceId": "targeting",
            "portId": "selection"
          },
          "to": {
            "instanceId": "delivery",
            "portId": "target"
          },
          "payloadType": "target-solution-v1",
          "delivery": "state"
        },
        "requestBinding": {
          "from": {
            "instanceId": "trigger",
            "portId": "request"
          },
          "to": {
            "instanceId": "delivery",
            "portId": "request"
          },
          "payloadType": "attack-request-v2",
          "delivery": "event"
        }
      }
    ],
    "projectileChannelLineages": [
      {
        "lineageId": "detector/projectile-lineage/delivery.projectiles",
        "providerInstanceId": "delivery",
        "providerCapabilityId": "delivery.projectile-channel",
        "sourceBinding": {
          "from": {
            "instanceId": "delivery",
            "portId": "projectiles"
          },
          "to": {
            "instanceId": "detector",
            "portId": "sources"
          },
          "payloadType": "entity-channel-v1",
          "delivery": "state"
        },
        "channelId": "delivery.projectiles",
        "channelOutputPort": "projectiles",
        "consumerInstanceId": "detector",
        "consumerInputPort": "sources"
      }
    ],
    "effectApplicationRoutes": [],
    "pickupEffectPlans": [],
    "projectileBudgetContention": {
      "budget": {
        "activeProjectiles": 16,
        "spawnsPerSecond": 40
      },
      "totals": {
        "activeProjectiles": 16,
        "spawnsPerSecond": 40
      },
      "orderedOwners": [
        {
          "resolvedOrder": 8,
          "instanceId": "delivery",
          "ownerActorId": "player-one",
          "attackChannelId": "player.primary",
          "channelId": "delivery.projectiles",
          "poolId": "delivery.projectiles.pool",
          "activeProjectiles": 16,
          "spawnsPerSecond": 40,
          "cumulativeActiveProjectiles": 16,
          "cumulativeSpawnsPerSecond": 40
        }
      ]
    },
    "resourceTotals": {
      "activeEntities": 16,
      "activeProjectiles": 16,
      "spawnsPerSecond": 40,
      "timers": 0
    }
  },
  {
    "graphVersion": "1.3.0",
    "assemblyId": "batch2.formation-wave",
    "kernelVersion": "1.0.0",
    "engine": {
      "id": "phaser",
      "version": "3.90.0"
    },
    "executionReadiness": {
      "status": "ready",
      "evidenceId": "738e937f32df2e1c9c2a58aa27f8b4260735facd6a592e4e6ea7fa559cda156d"
    },
    "catalogEvidenceId": "ced7d24e9adfceaa4e88a2b071249c74192d4e5a4b99211693a8cd64dfcf190a",
    "actors": [
      {
        "actorId": "player-one",
        "role": "player"
      },
      {
        "actorId": "enemy-one",
        "role": "enemy"
      }
    ],
    "modules": [
      {
        "instanceId": "aim",
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
        "instanceId": "arbiter",
        "ownerId": "player-one",
        "moduleId": "intent.movement-arbiter",
        "version": "1.0.0",
        "kind": "player-intent",
        "implementationId": "intent.movement-arbiter.v1",
        "configurationSchemaId": "intent.movement-arbiter.config",
        "configuration": {
          "policy": "touch-while-active-else-keyboard",
          "keyboardSourceId": "keyboard",
          "touchSourceId": "touch"
        },
        "manifestSchemaVersion": "1.2.0",
        "instantiation": "production-eligible",
        "manifestSha256": "9d43ffcccd085ad78b3ff81bc2182f651117c33fd327a035aeb91ba46b0f4d33",
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
          "instanceLeases": 1,
          "graphLeases": 0
        },
        "artifactIdentity": {
          "schemaVersion": "1.0.0",
          "algorithm": "sha256",
          "envelopeFormat": "module-registration-envelope-v1",
          "manifestSha256": "9d43ffcccd085ad78b3ff81bc2182f651117c33fd327a035aeb91ba46b0f4d33",
          "configurationDescriptorSha256": "9e09d39adeba78199db1be2373cbcdd2e81c8f2a0dc5e00b2200ea42896ec7ba",
          "reservationDescriptorSha256": "a5dcc7a7281d264f7f5876e30d17c68628b8bcce2de3820debfd35b491640a8e",
          "implementationBundleSha256": "82db7e4096b0d2d491829be4fc60a4401c963513225a9be44cceb5c82bbda0c6",
          "dependencyLockSha256": "e3f942b24b5b515fecc068c475a193034b13a127e1da280cea5b4ad14a03c78a",
          "toolchainIdentitySha256": "3f07da47c80fa46c2d89a7e064cd374ee726cf2c206c08dbfbe35326f9b04356",
          "envelopeSha256": "a46bcb6e7b257b0bdc9649aa34aad0c183df155b497d76e95db061e95f5785e1"
        },
        "factoryContextVersion": "1.2.0",
        "runtimeContract": {
          "update": null,
          "timerSlots": {
            "slotGroupId": "main"
          },
          "inputRegistrations": [],
          "observationReaders": [
            {
              "readerId": "arbitration"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [
            {
              "id": "commands",
              "payloadType": "movement-command-v1",
              "required": true,
              "multiple": true,
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
              "id": "resolved",
              "payloadType": "resolved-movement-command-v1",
              "delivery": "event"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [],
          "observationReaderIds": [
            "arbitration"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "02f001a3d921d7daa4a3c0facf2e4e8b40d839837621ac926de6b843666e144a"
      },
      {
        "instanceId": "attack-intent",
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
        "instanceId": "default-policy",
        "ownerId": "enemy-one",
        "moduleId": "interaction.contact-default-damage",
        "version": "1.0.0",
        "kind": "combat-interaction",
        "implementationId": "interaction.contact-default-damage.v1",
        "configurationSchemaId": "interaction.contact-default-damage.config",
        "configuration": {
          "damageKind": "projectile",
          "defaultDisposition": "damage",
          "defaultSourceOperation": "consume"
        },
        "manifestSchemaVersion": "1.2.0",
        "instantiation": "production-eligible",
        "manifestSha256": "a3ac7549ae42c55a26596c3da80afce9d565d7dd53bc135ade5e6a4e1a72c268",
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
          "manifestSha256": "a3ac7549ae42c55a26596c3da80afce9d565d7dd53bc135ade5e6a4e1a72c268",
          "configurationDescriptorSha256": "00943acb6e746288ff8a7fc6c677309793357849fbf008b1c1b380b0c2950eec",
          "reservationDescriptorSha256": "703c43c468c12d92643fa16af0e86c3d483d08cd499b63d76fa95bf9b399c019",
          "implementationBundleSha256": "f7aa1b981073d2e11feed1f7e7690f8a1ade75ccabd6ab6b8d4c9b29c8dc946a",
          "dependencyLockSha256": "e3f942b24b5b515fecc068c475a193034b13a127e1da280cea5b4ad14a03c78a",
          "toolchainIdentitySha256": "3f07da47c80fa46c2d89a7e064cd374ee726cf2c206c08dbfbe35326f9b04356",
          "envelopeSha256": "435387a883a4ee3a09c15ea334056be0ca7e49989e5e5177847d2c066e4b3514"
        },
        "factoryContextVersion": "1.2.0",
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
        "catalogEntryEvidenceId": "d7020b6df92e644270d1b51397bd4fa09885c97138927afcf2f97884d284ee76"
      },
      {
        "instanceId": "delivery",
        "ownerId": "player-one",
        "moduleId": "delivery.pattern.wave",
        "version": "1.0.0",
        "kind": "attack-delivery",
        "implementationId": "delivery.pattern.wave.v1",
        "configurationSchemaId": "delivery.pattern.wave.config",
        "configuration": {
          "attackChannelId": "player.primary",
          "baseCount": 3,
          "speed": 600,
          "baseDamage": 10,
          "textureRole": "player-projectile",
          "spawnOffset": {
            "x": 0,
            "y": -28
          },
          "maxActive": 16,
          "maximumAcceptedRequestsPerSecond": 10,
          "maximumCountBonus": 1,
          "maximumDamageMultiplier": 2,
          "recycleMargin": 32,
          "exhaustionPolicy": "drop-and-observe",
          "waveSpreadDegrees": 40,
          "phaseStepDegrees": 90
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "bf3147bed1b850aea55c3b04c9fa161aba709a45d3eb3ec7ac8812a3a915ced6",
        "resources": {
          "activeEntities": 256,
          "activeProjectiles": 256,
          "spawnsPerSecond": 2560,
          "timers": 0
        },
        "resourceGrant": {
          "activeEntities": 16,
          "activeProjectiles": 16,
          "spawnsPerSecond": 40,
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
          "manifestSha256": "bf3147bed1b850aea55c3b04c9fa161aba709a45d3eb3ec7ac8812a3a915ced6",
          "configurationDescriptorSha256": "b570b1f3ee9d26f74bcb8276b122903cc4c336462d3f45446732ed59690c59ba",
          "reservationDescriptorSha256": "e84395486242aa580d7ea2091dfd08602042601a63121ba47f24850f837238cb",
          "implementationBundleSha256": "e658387ae10c64775b4682e621368c9364d4aff41581168697666655e73b2d33",
          "dependencyLockSha256": "3a62cb4fa8c1835c5496c91fc4b6018ad52d0e2a9f7c6e03b05675f5f973cd0c",
          "toolchainIdentitySha256": "d36c05bbb20980385899dc98650138698cc54f619092b6d415a24983e56552d0",
          "envelopeSha256": "c77e056490c68c92f389cae1d393defd86f5935526dba35eb5fe1bfc2b79f96f"
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
        "catalogEntryEvidenceId": "16f66d0ab9c14e7637339d3b7a3311fa8748c06897d1e6ab843763f74d92e3c7"
      },
      {
        "instanceId": "detector",
        "ownerId": "enemy-one",
        "moduleId": "interaction.projectile-contact",
        "version": "1.1.0",
        "kind": "combat-interaction",
        "implementationId": "interaction.projectile-contact.v1-1",
        "configurationSchemaId": "interaction.projectile-contact.config",
        "configuration": {
          "sourceEntityRole": "projectile",
          "targetActorRole": "enemy",
          "maximumTrackedContacts": 64
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "a0ef6b9ec62ee0a0024baaa27c1da58a1223fca144a0522f457f048c2bff2c3c",
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
          "manifestSha256": "a0ef6b9ec62ee0a0024baaa27c1da58a1223fca144a0522f457f048c2bff2c3c",
          "configurationDescriptorSha256": "48426de270d5cbf02a8a961a77a90525bddfa11100a260581393becce7c3b31e",
          "reservationDescriptorSha256": "b37389b46ed44dbce09e7dbb2ddf633a1d991a6427731f1c225d4b7c42754fa7",
          "implementationBundleSha256": "a7b7703e206df2501a9a3feb60a815e7051362f046ad35dd6a2b39e8fdde0285",
          "dependencyLockSha256": "3114db68a63f8cc7a5f8d6681980c6d48d25719a43a53f4df02dae977f348f15",
          "toolchainIdentitySha256": "35fe5f84f10587932b8d6b182469ac64fddb54bf4a6b06cd46d970c20ed4ab54",
          "envelopeSha256": "790081f65a1f295c78af5d5489678a675bbb59b5e04ecaa710bdad8851a18bc8"
        },
        "factoryContextVersion": "1.3.0",
        "runtimeContract": {
          "update": {
            "mode": "graph-frame-v1",
            "registrationId": "contact.update"
          },
          "timerSlots": {
            "slotGroupId": "main"
          },
          "inputRegistrations": [],
          "observationReaders": [
            {
              "readerId": "contacts"
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
                  "player",
                  "enemy",
                  "boss"
                ],
                "targetActorRoles": [
                  "player",
                  "enemy",
                  "boss"
                ],
                "sourceEntityRoles": [
                  "projectile"
                ]
              }
            }
          ],
          "outputPorts": [
            {
              "id": "candidate",
              "payloadType": "contact-candidate-v1",
              "delivery": "event"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [],
          "observationReaderIds": [
            "contacts"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": [],
          "overlapRuleId": "projectile.overlap"
        },
        "catalogEntryEvidenceId": "7347c0195e10a7be2b1d703a104824c3dfd641c9a0f426d1e496a41fa73092a0"
      },
      {
        "instanceId": "focus",
        "ownerId": "player-one",
        "moduleId": "intent.focus",
        "version": "1.0.0",
        "kind": "player-intent",
        "implementationId": "intent.focus.v1",
        "configurationSchemaId": "intent.focus.config",
        "configuration": {
          "device": "keyboard",
          "control": "ShiftLeft",
          "initialFocused": false
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "aacb922e96b26e55426cfd454b8bbb54ebe987c894b7a4f362e8092ffebe6792",
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
          "manifestSha256": "aacb922e96b26e55426cfd454b8bbb54ebe987c894b7a4f362e8092ffebe6792",
          "configurationDescriptorSha256": "b4151a58965ec35b2463dc7d11b3d4a1ba48a96e95889856ca30a06003b0f14e",
          "reservationDescriptorSha256": "bb684f2c92d8fef75f30a599bac371807de81d63d040936e472830c3072d39d6",
          "implementationBundleSha256": "aca82a0d51b7a0bb9c2f1b0aee52ddf5bee64c9fb277abceb33398d9b7289847",
          "dependencyLockSha256": "5b498deec049fe835a9f07056297b89515949bc723867821f92110a0ab04db55",
          "toolchainIdentitySha256": "9a149b74eaf8e88bea1c3f4aa0a166ce306dcf155781bdb1a48e5ad05d22e735",
          "envelopeSha256": "95fb5f3bcff3dac4262d9b9054a59f2e303657e445d4f230f1ef3e819d0afa3e"
        },
        "factoryContextVersion": "1.3.0",
        "runtimeContract": {
          "update": null,
          "timerSlots": {
            "slotGroupId": "main"
          },
          "inputRegistrations": [
            {
              "registrationId": "focus.keyboard",
              "kind": "keyboard"
            }
          ],
          "observationReaders": [
            {
              "readerId": "focus"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [],
          "outputPorts": [
            {
              "id": "focus",
              "payloadType": "focus-state-v1",
              "delivery": "state"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [
            "focus.keyboard"
          ],
          "observationReaderIds": [
            "focus"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "23e74a23b5bf7fe53d7ce537dc39ddaeea9b12c0cf8ba0fe5533fba082d20387"
      },
      {
        "instanceId": "focus-speed",
        "ownerId": "player-one",
        "moduleId": "locomotion.focus-speed",
        "version": "1.0.0",
        "kind": "locomotion",
        "implementationId": "locomotion.focus-speed.v1",
        "configurationSchemaId": "locomotion.focus-speed.config",
        "configuration": {
          "multiplier": 0.5,
          "releaseBehavior": "restore"
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "8838f8fe9118c00d243f8d07e01b72fcb1eda0b959a91440930c8f03e975cc20",
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
          "instanceLeases": 3,
          "graphLeases": 0
        },
        "artifactIdentity": {
          "schemaVersion": "1.0.0",
          "algorithm": "sha256",
          "envelopeFormat": "module-registration-envelope-v1",
          "manifestSha256": "8838f8fe9118c00d243f8d07e01b72fcb1eda0b959a91440930c8f03e975cc20",
          "configurationDescriptorSha256": "fb5200ee9a2516b39444b304128e8795afdf6033e8ff6e5c17215c579fc823df",
          "reservationDescriptorSha256": "cb6d1c270296c65cd1dc255f6d8878574369b3d9c6dbc0eefce3f7a00a0184ef",
          "implementationBundleSha256": "20e61c459007c50f75fca426c84cf2cc33f323d940fadc5877b78008e0e32f94",
          "dependencyLockSha256": "5b498deec049fe835a9f07056297b89515949bc723867821f92110a0ab04db55",
          "toolchainIdentitySha256": "9a149b74eaf8e88bea1c3f4aa0a166ce306dcf155781bdb1a48e5ad05d22e735",
          "envelopeSha256": "b3876bcfbeb935e08ad14d31e5f8b404fca9612ac423ba951745db88543b8b80"
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
              "readerId": "scale"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [
            {
              "id": "focus",
              "payloadType": "focus-state-v1",
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
              "id": "scale",
              "payloadType": "movement-scale-v1",
              "delivery": "state"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [],
          "observationReaderIds": [
            "scale"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "28dce4daad405345fb8cca1b45e0b010ea80f43e6de68bb5bca668daf6a5b939"
      },
      {
        "instanceId": "health",
        "ownerId": "enemy-one",
        "moduleId": "combat.health",
        "version": "1.1.0",
        "kind": "combat-interaction",
        "implementationId": "combat.health.v1-1",
        "configurationSchemaId": "combat.health.config",
        "configuration": {
          "maxHealth": 100,
          "initialHealth": 100,
          "damageFloor": 0
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "fa44309ba0be253fd38eb2ddef9a561e51022b9fe0224a83bd2cbd843267b978",
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
          "manifestSha256": "fa44309ba0be253fd38eb2ddef9a561e51022b9fe0224a83bd2cbd843267b978",
          "configurationDescriptorSha256": "093319fcdda8033b14dc680866d669ecbeb2a504965ccb5b8fbda9d22b94ef78",
          "reservationDescriptorSha256": "61db0f8672eb0103417c04d5f8520c88f2767e115cfb49b25c90f20ee3bb9ac4",
          "implementationBundleSha256": "0cb86bf62b96da2f59bec176c24aafa96c2fc99a0320c83ead033ac391c9345b",
          "dependencyLockSha256": "3114db68a63f8cc7a5f8d6681980c6d48d25719a43a53f4df02dae977f348f15",
          "toolchainIdentitySha256": "35fe5f84f10587932b8d6b182469ac64fddb54bf4a6b06cd46d970c20ed4ab54",
          "envelopeSha256": "dd72a85fda2a408eb0f229eb14db6999b9b984b45d16b00df2d676ef3362762e"
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
              "readerId": "health"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [
            {
              "id": "damage",
              "payloadType": "damage-v1",
              "required": true,
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
            },
            {
              "id": "modifier",
              "payloadType": "modifier-application-v1",
              "required": false,
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
            }
          ],
          "outputPorts": [
            {
              "id": "state",
              "payloadType": "health-state-v2",
              "delivery": "state"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [],
          "observationReaderIds": [
            "health"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": [
            "combat.health.current"
          ]
        },
        "catalogEntryEvidenceId": "377f7230f13bc06f4b9ab7d0a0758ba990b0352dea05fddf76936863d3a2bd63"
      },
      {
        "instanceId": "keyboard",
        "ownerId": "player-one",
        "moduleId": "intent.keyboard-movement",
        "version": "1.0.0",
        "kind": "player-intent",
        "implementationId": "intent.keyboard-movement.v1",
        "configurationSchemaId": "intent.keyboard-movement.config",
        "configuration": {
          "bindings": "arrows-and-wasd",
          "normalizeDiagonal": true,
          "emitNeutral": true
        },
        "manifestSchemaVersion": "1.2.0",
        "instantiation": "production-eligible",
        "manifestSha256": "e7e44de719a3683b6d9df4ab640e2381a320948bf374a72f7d4a77214415afb9",
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
          "manifestSha256": "e7e44de719a3683b6d9df4ab640e2381a320948bf374a72f7d4a77214415afb9",
          "configurationDescriptorSha256": "9b015e9b8889308b15831199a276d85e979783081ccc9110ca0a879f143bfc38",
          "reservationDescriptorSha256": "38d096bdc34753c5e32889205da48f25511978a621498733181be8a6dc0c6d1d",
          "implementationBundleSha256": "eb83666306347da2410859d3c907152d91e562e6530403a44f843f88dcd4fd7a",
          "dependencyLockSha256": "e3f942b24b5b515fecc068c475a193034b13a127e1da280cea5b4ad14a03c78a",
          "toolchainIdentitySha256": "3f07da47c80fa46c2d89a7e064cd374ee726cf2c206c08dbfbe35326f9b04356",
          "envelopeSha256": "4a2b9dc74b5c7beb16827b0a2e4c8f84256d5a12fa7de8dd7c54556bc501c11b"
        },
        "factoryContextVersion": "1.2.0",
        "runtimeContract": {
          "update": {
            "mode": "graph-frame-v1",
            "registrationId": "keyboard.update"
          },
          "timerSlots": {
            "slotGroupId": "main"
          },
          "inputRegistrations": [
            {
              "registrationId": "keyboard.direction",
              "kind": "keyboard"
            }
          ],
          "observationReaders": [
            {
              "readerId": "movement"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [],
          "outputPorts": [
            {
              "id": "command",
              "payloadType": "movement-command-v1",
              "delivery": "event"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [
            "keyboard.direction"
          ],
          "observationReaderIds": [
            "movement"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "63839ea8e495dab883c5c83d89808fa34f78ffac04eb44bd78fd12dc58f31d7d"
      },
      {
        "instanceId": "locomotion",
        "ownerId": "player-one",
        "moduleId": "locomotion.bounded",
        "version": "1.1.0",
        "kind": "locomotion",
        "implementationId": "locomotion.bounded.v1-1",
        "configurationSchemaId": "locomotion.bounded.config",
        "configuration": {
          "moveSpeed": 300,
          "bounds": {
            "left": 24,
            "right": 24,
            "top": 24,
            "bottom": 24
          },
          "absoluteMode": "clamp",
          "neutralMode": "zero-velocity"
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "a064dd75d018415059aa4934070bc1ea84009496244742bc9fefccaacf896ccf",
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
          "manifestSha256": "a064dd75d018415059aa4934070bc1ea84009496244742bc9fefccaacf896ccf",
          "configurationDescriptorSha256": "e4725e41c7da63bf4b8d3ca8a1a2c760673c1118f6be73f738f9af2836e7da0d",
          "reservationDescriptorSha256": "9c26433d8dcef54b1fa5cdea3d00c4a4d9a69bfbbed3ce3a37e42b47f8fc1b6f",
          "implementationBundleSha256": "0e2845f8c730f9b32bafca109867b41c912c19d83f71f914c6dcc323f8338921",
          "dependencyLockSha256": "5b498deec049fe835a9f07056297b89515949bc723867821f92110a0ab04db55",
          "toolchainIdentitySha256": "9a149b74eaf8e88bea1c3f4aa0a166ce306dcf155781bdb1a48e5ad05d22e735",
          "envelopeSha256": "4692ccb19733c57887102925be074d83dabcb73a6e990316e9ce9238c543723a"
        },
        "factoryContextVersion": "1.3.0",
        "runtimeContract": {
          "update": {
            "mode": "graph-frame-v1",
            "registrationId": "motion.update"
          },
          "timerSlots": {
            "slotGroupId": "main"
          },
          "inputRegistrations": [],
          "observationReaders": [
            {
              "readerId": "motion"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [
            {
              "id": "command",
              "payloadType": "resolved-movement-command-v1",
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
            },
            {
              "id": "speed-scale",
              "payloadType": "movement-scale-v1",
              "required": false,
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
          "outputPorts": []
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [],
          "observationReaderIds": [
            "motion"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "54570dd840659201eb0e0487d1dc3a7450d95707a7a8be5981f6f5e44dc4dc6b"
      },
      {
        "instanceId": "resolver",
        "ownerId": "enemy-one",
        "moduleId": "interaction.contact-resolution",
        "version": "1.1.0",
        "kind": "combat-interaction",
        "implementationId": "interaction.contact-resolution.v1-1",
        "configurationSchemaId": "interaction.contact-resolution.config",
        "configuration": {
          "policyProfileId": "batch1.default-damage",
          "policyProfileVersion": "1.0.0",
          "allowedDispositions": [
            "damage"
          ],
          "allowedSourceOperations": [
            "consume"
          ],
          "maxResolvedContacts": 64
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "fd7874b237bdb82a08b76f25ba4fb575c10d778bcb844a01aa428bc11b1c1d94",
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
          "instanceLeases": 3,
          "graphLeases": 0
        },
        "artifactIdentity": {
          "schemaVersion": "1.0.0",
          "algorithm": "sha256",
          "envelopeFormat": "module-registration-envelope-v1",
          "manifestSha256": "fd7874b237bdb82a08b76f25ba4fb575c10d778bcb844a01aa428bc11b1c1d94",
          "configurationDescriptorSha256": "8dee45e6761b65725a6adc566cc6834f9af91f30b8c8c3fd5d38fb59e5ff7dae",
          "reservationDescriptorSha256": "7cf892a61da8a880ffba09458f29d1af48fed6f003a146745d004027f4dfdc0a",
          "implementationBundleSha256": "6d682a724fe9c695b8ff0901d232517356c9169423f0c0121a7a37800c8a0481",
          "dependencyLockSha256": "3114db68a63f8cc7a5f8d6681980c6d48d25719a43a53f4df02dae977f348f15",
          "toolchainIdentitySha256": "35fe5f84f10587932b8d6b182469ac64fddb54bf4a6b06cd46d970c20ed4ab54",
          "envelopeSha256": "647206a93107cb0295a7d058b5b111cea63716e88b2c00fc50af0b09e113ef57"
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
              "readerId": "resolution"
            }
          ],
          "contactCommit": {
            "commitServiceId": "contact.commit",
            "maximumConcurrentCommits": 4,
            "admittedOperations": [
              "consume"
            ]
          }
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
                  "player",
                  "enemy",
                  "boss"
                ],
                "targetActorRoles": [
                  "player",
                  "enemy",
                  "boss"
                ],
                "sourceEntityRoles": [
                  "projectile"
                ]
              }
            },
            {
              "id": "candidate",
              "payloadType": "contact-candidate-v1",
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
            }
          ],
          "outputPorts": [
            {
              "id": "hit",
              "payloadType": "hit-v1",
              "delivery": "event"
            },
            {
              "id": "damage",
              "payloadType": "damage-v1",
              "delivery": "event"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [],
          "observationReaderIds": [
            "resolution"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "22b05da6a479e9d03a5c7130820dd69d5892bf76a84c6530715137f3c0b43c78"
      },
      {
        "instanceId": "targeting",
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
        "instanceId": "touch",
        "ownerId": "player-one",
        "moduleId": "intent.touch-drag",
        "version": "1.0.0",
        "kind": "player-intent",
        "implementationId": "intent.touch-drag.v1",
        "configurationSchemaId": "intent.touch-drag.config",
        "configuration": {
          "capture": "first-active",
          "release": "matching-pointer-up",
          "emitOnDown": false
        },
        "manifestSchemaVersion": "1.2.0",
        "instantiation": "production-eligible",
        "manifestSha256": "f18da1c54d0964e2b442d53c54c21560cbe820a7687cefd23c334038b2e4f2e9",
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
          "manifestSha256": "f18da1c54d0964e2b442d53c54c21560cbe820a7687cefd23c334038b2e4f2e9",
          "configurationDescriptorSha256": "8884fbaace9900b8cce6b689e3fc433524be19ded3d22f20caa930b5846d05b1",
          "reservationDescriptorSha256": "c5005923973583d38c4cec38d2578c3a33856fe3f1ebb6b2614a4be9922b84ee",
          "implementationBundleSha256": "aa5102bd10a4d35b822eb8505de712d493f496f1de72a9edf481ce334633e12f",
          "dependencyLockSha256": "e3f942b24b5b515fecc068c475a193034b13a127e1da280cea5b4ad14a03c78a",
          "toolchainIdentitySha256": "3f07da47c80fa46c2d89a7e064cd374ee726cf2c206c08dbfbe35326f9b04356",
          "envelopeSha256": "6b0f163881d2b3ffce945bacd5499eba9b85ea046021749b234b8256ec44cf90"
        },
        "factoryContextVersion": "1.2.0",
        "runtimeContract": {
          "update": null,
          "timerSlots": {
            "slotGroupId": "main"
          },
          "inputRegistrations": [
            {
              "registrationId": "pointer.down",
              "kind": "pointer-down"
            },
            {
              "registrationId": "pointer.move",
              "kind": "pointer-move"
            },
            {
              "registrationId": "pointer.up",
              "kind": "pointer-up"
            }
          ],
          "observationReaders": [
            {
              "readerId": "movement"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [],
          "outputPorts": [
            {
              "id": "command",
              "payloadType": "movement-command-v1",
              "delivery": "event"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [
            "pointer.down",
            "pointer.move",
            "pointer.up"
          ],
          "observationReaderIds": [
            "movement"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "4cdbcb36531f8cf15ada2f1263d5e96cc4e80b3c4ed2bcf27dbfae98c03a4faa"
      },
      {
        "instanceId": "trigger",
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
        "from": "arbiter",
        "to": "keyboard",
        "capabilityId": "intent.movement-source",
        "scope": "owner"
      },
      {
        "from": "arbiter",
        "to": "touch",
        "capabilityId": "intent.movement-source",
        "scope": "owner"
      },
      {
        "from": "delivery",
        "to": "targeting",
        "capabilityId": "targeting.solution-v2",
        "scope": "owner"
      },
      {
        "from": "delivery",
        "to": "trigger",
        "capabilityId": "trigger.attack-v2",
        "scope": "owner"
      },
      {
        "from": "detector",
        "to": "delivery",
        "capabilityId": "delivery.projectile-channel",
        "scope": "assembly"
      },
      {
        "from": "focus-speed",
        "to": "focus",
        "capabilityId": "intent.focus-source",
        "scope": "owner"
      },
      {
        "from": "locomotion",
        "to": "arbiter",
        "capabilityId": "intent.movement-resolved",
        "scope": "owner"
      },
      {
        "from": "resolver",
        "to": "detector",
        "capabilityId": "interaction.projectile-contact-candidate",
        "scope": "owner"
      },
      {
        "from": "resolver",
        "to": "health",
        "capabilityId": "combat.damage-sink",
        "scope": "owner"
      },
      {
        "from": "targeting",
        "to": "aim",
        "capabilityId": "intent.aim-source",
        "scope": "owner"
      },
      {
        "from": "trigger",
        "to": "attack-intent",
        "capabilityId": "intent.attack-source",
        "scope": "owner"
      }
    ],
    "bindings": [
      {
        "from": {
          "instanceId": "aim",
          "portId": "aim"
        },
        "to": {
          "instanceId": "targeting",
          "portId": "aim"
        },
        "payloadType": "aim-command-v1",
        "delivery": "state"
      },
      {
        "from": {
          "instanceId": "arbiter",
          "portId": "resolved"
        },
        "to": {
          "instanceId": "locomotion",
          "portId": "command"
        },
        "payloadType": "resolved-movement-command-v1",
        "delivery": "event"
      },
      {
        "from": {
          "instanceId": "attack-intent",
          "portId": "intent"
        },
        "to": {
          "instanceId": "trigger",
          "portId": "intent"
        },
        "payloadType": "attack-intent-v1",
        "delivery": "event"
      },
      {
        "from": {
          "instanceId": "delivery",
          "portId": "projectiles"
        },
        "to": {
          "instanceId": "detector",
          "portId": "sources"
        },
        "payloadType": "entity-channel-v1",
        "delivery": "state"
      },
      {
        "from": {
          "instanceId": "delivery",
          "portId": "projectiles"
        },
        "to": {
          "instanceId": "resolver",
          "portId": "sources"
        },
        "payloadType": "entity-channel-v1",
        "delivery": "state"
      },
      {
        "from": {
          "instanceId": "detector",
          "portId": "candidate"
        },
        "to": {
          "instanceId": "resolver",
          "portId": "candidate"
        },
        "payloadType": "contact-candidate-v1",
        "delivery": "event"
      },
      {
        "from": {
          "instanceId": "focus",
          "portId": "focus"
        },
        "to": {
          "instanceId": "focus-speed",
          "portId": "focus"
        },
        "payloadType": "focus-state-v1",
        "delivery": "state"
      },
      {
        "from": {
          "instanceId": "focus-speed",
          "portId": "scale"
        },
        "to": {
          "instanceId": "locomotion",
          "portId": "speed-scale"
        },
        "payloadType": "movement-scale-v1",
        "delivery": "state"
      },
      {
        "from": {
          "instanceId": "keyboard",
          "portId": "command"
        },
        "to": {
          "instanceId": "arbiter",
          "portId": "commands"
        },
        "payloadType": "movement-command-v1",
        "delivery": "event"
      },
      {
        "from": {
          "instanceId": "resolver",
          "portId": "damage"
        },
        "to": {
          "instanceId": "health",
          "portId": "damage"
        },
        "payloadType": "damage-v1",
        "delivery": "event"
      },
      {
        "from": {
          "instanceId": "targeting",
          "portId": "selection"
        },
        "to": {
          "instanceId": "delivery",
          "portId": "target"
        },
        "payloadType": "target-solution-v1",
        "delivery": "state"
      },
      {
        "from": {
          "instanceId": "touch",
          "portId": "command"
        },
        "to": {
          "instanceId": "arbiter",
          "portId": "commands"
        },
        "payloadType": "movement-command-v1",
        "delivery": "event"
      },
      {
        "from": {
          "instanceId": "trigger",
          "portId": "request"
        },
        "to": {
          "instanceId": "delivery",
          "portId": "request"
        },
        "payloadType": "attack-request-v2",
        "delivery": "event"
      }
    ],
    "constructionOrder": [
      "aim",
      "keyboard",
      "touch",
      "arbiter",
      "attack-intent",
      "default-policy",
      "targeting",
      "trigger",
      "delivery",
      "detector",
      "focus",
      "focus-speed",
      "health",
      "locomotion",
      "resolver"
    ],
    "assetBindings": [
      {
        "bindingId": "player-projectile",
        "roleId": "player-projectile",
        "category": "projectile",
        "runtimeSha256": "2222222222222222222222222222222222222222222222222222222222222222",
        "textureKey": "module/2222222222222222222222222222222222222222222222222222222222222222/player-projectile",
        "sharing": "instance",
        "consumerInstanceIds": [
          "delivery"
        ]
      }
    ],
    "contactPolicyProfiles": [
      {
        "consumerInstanceId": "resolver",
        "profileId": "batch1.default-damage",
        "version": "1.0.0",
        "evidenceHash": "fe907b71f1b56c3f1e75b13008376413fe41eb5e50d760f76707bb174dd9b818",
        "supportedChainEvidenceId": "batch1.default-damage.chain",
        "orderedPolicyInstanceIds": [
          "default-policy"
        ],
        "orderedPolicyArtifactHashes": [
          "435387a883a4ee3a09c15ea334056be0ca7e49989e5e5177847d2c066e4b3514"
        ]
      }
    ],
    "damageSinkRoutes": [
      {
        "ownerId": "enemy-one",
        "headInstanceId": "health",
        "orderedSinkInstanceIds": [
          "health"
        ],
        "terminalHealthInstanceId": "health",
        "producerInstanceIds": [
          "resolver"
        ]
      }
    ],
    "entityChannels": [
      {
        "channelId": "delivery.projectiles",
        "localChannelId": "projectiles",
        "ownerInstanceId": "delivery",
        "ownerActorId": "player-one",
        "outputPort": "projectiles",
        "entityRole": "projectile",
        "capacity": 16,
        "capacityResources": [
          "activeEntities",
          "activeProjectiles"
        ],
        "readerInstanceIds": [
          "detector",
          "resolver"
        ],
        "sourceArtifactEnvelopeSha256": "c77e056490c68c92f389cae1d393defd86f5935526dba35eb5fe1bfc2b79f96f"
      }
    ],
    "entityMutationGrants": [
      {
        "grantId": "resolver.projectile.consume",
        "accessId": "projectile.consume",
        "granteeInstanceId": "resolver",
        "channelId": "delivery.projectiles",
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
        "targetingInstanceId": "targeting",
        "triggerInstanceId": "trigger",
        "deliveryInstanceId": "delivery",
        "targetBinding": {
          "from": {
            "instanceId": "targeting",
            "portId": "selection"
          },
          "to": {
            "instanceId": "delivery",
            "portId": "target"
          },
          "payloadType": "target-solution-v1",
          "delivery": "state"
        },
        "requestBinding": {
          "from": {
            "instanceId": "trigger",
            "portId": "request"
          },
          "to": {
            "instanceId": "delivery",
            "portId": "request"
          },
          "payloadType": "attack-request-v2",
          "delivery": "event"
        }
      }
    ],
    "projectileChannelLineages": [
      {
        "lineageId": "detector/projectile-lineage/delivery.projectiles",
        "providerInstanceId": "delivery",
        "providerCapabilityId": "delivery.projectile-channel",
        "sourceBinding": {
          "from": {
            "instanceId": "delivery",
            "portId": "projectiles"
          },
          "to": {
            "instanceId": "detector",
            "portId": "sources"
          },
          "payloadType": "entity-channel-v1",
          "delivery": "state"
        },
        "channelId": "delivery.projectiles",
        "channelOutputPort": "projectiles",
        "consumerInstanceId": "detector",
        "consumerInputPort": "sources"
      }
    ],
    "effectApplicationRoutes": [],
    "pickupEffectPlans": [],
    "projectileBudgetContention": {
      "budget": {
        "activeProjectiles": 16,
        "spawnsPerSecond": 40
      },
      "totals": {
        "activeProjectiles": 16,
        "spawnsPerSecond": 40
      },
      "orderedOwners": [
        {
          "resolvedOrder": 8,
          "instanceId": "delivery",
          "ownerActorId": "player-one",
          "attackChannelId": "player.primary",
          "channelId": "delivery.projectiles",
          "poolId": "delivery.projectiles.pool",
          "activeProjectiles": 16,
          "spawnsPerSecond": 40,
          "cumulativeActiveProjectiles": 16,
          "cumulativeSpawnsPerSecond": 40
        }
      ]
    },
    "resourceTotals": {
      "activeEntities": 16,
      "activeProjectiles": 16,
      "spawnsPerSecond": 40,
      "timers": 0
    }
  },
  {
    "graphVersion": "1.3.0",
    "assemblyId": "batch2.formation-rain",
    "kernelVersion": "1.0.0",
    "engine": {
      "id": "phaser",
      "version": "3.90.0"
    },
    "executionReadiness": {
      "status": "ready",
      "evidenceId": "28d398bfe341a56bc78c742a0023cbd44a61db96d2b3bc5a8a409c29b578f22d"
    },
    "catalogEvidenceId": "8d51019716c9aca5b93af5568774c7a42513286e9c1fa734f73f909c5ba4a3db",
    "actors": [
      {
        "actorId": "player-one",
        "role": "player"
      },
      {
        "actorId": "enemy-one",
        "role": "enemy"
      }
    ],
    "modules": [
      {
        "instanceId": "aim",
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
        "instanceId": "arbiter",
        "ownerId": "player-one",
        "moduleId": "intent.movement-arbiter",
        "version": "1.0.0",
        "kind": "player-intent",
        "implementationId": "intent.movement-arbiter.v1",
        "configurationSchemaId": "intent.movement-arbiter.config",
        "configuration": {
          "policy": "touch-while-active-else-keyboard",
          "keyboardSourceId": "keyboard",
          "touchSourceId": "touch"
        },
        "manifestSchemaVersion": "1.2.0",
        "instantiation": "production-eligible",
        "manifestSha256": "9d43ffcccd085ad78b3ff81bc2182f651117c33fd327a035aeb91ba46b0f4d33",
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
          "instanceLeases": 1,
          "graphLeases": 0
        },
        "artifactIdentity": {
          "schemaVersion": "1.0.0",
          "algorithm": "sha256",
          "envelopeFormat": "module-registration-envelope-v1",
          "manifestSha256": "9d43ffcccd085ad78b3ff81bc2182f651117c33fd327a035aeb91ba46b0f4d33",
          "configurationDescriptorSha256": "9e09d39adeba78199db1be2373cbcdd2e81c8f2a0dc5e00b2200ea42896ec7ba",
          "reservationDescriptorSha256": "a5dcc7a7281d264f7f5876e30d17c68628b8bcce2de3820debfd35b491640a8e",
          "implementationBundleSha256": "82db7e4096b0d2d491829be4fc60a4401c963513225a9be44cceb5c82bbda0c6",
          "dependencyLockSha256": "e3f942b24b5b515fecc068c475a193034b13a127e1da280cea5b4ad14a03c78a",
          "toolchainIdentitySha256": "3f07da47c80fa46c2d89a7e064cd374ee726cf2c206c08dbfbe35326f9b04356",
          "envelopeSha256": "a46bcb6e7b257b0bdc9649aa34aad0c183df155b497d76e95db061e95f5785e1"
        },
        "factoryContextVersion": "1.2.0",
        "runtimeContract": {
          "update": null,
          "timerSlots": {
            "slotGroupId": "main"
          },
          "inputRegistrations": [],
          "observationReaders": [
            {
              "readerId": "arbitration"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [
            {
              "id": "commands",
              "payloadType": "movement-command-v1",
              "required": true,
              "multiple": true,
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
              "id": "resolved",
              "payloadType": "resolved-movement-command-v1",
              "delivery": "event"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [],
          "observationReaderIds": [
            "arbitration"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "02f001a3d921d7daa4a3c0facf2e4e8b40d839837621ac926de6b843666e144a"
      },
      {
        "instanceId": "attack-intent",
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
        "instanceId": "default-policy",
        "ownerId": "enemy-one",
        "moduleId": "interaction.contact-default-damage",
        "version": "1.0.0",
        "kind": "combat-interaction",
        "implementationId": "interaction.contact-default-damage.v1",
        "configurationSchemaId": "interaction.contact-default-damage.config",
        "configuration": {
          "damageKind": "projectile",
          "defaultDisposition": "damage",
          "defaultSourceOperation": "consume"
        },
        "manifestSchemaVersion": "1.2.0",
        "instantiation": "production-eligible",
        "manifestSha256": "a3ac7549ae42c55a26596c3da80afce9d565d7dd53bc135ade5e6a4e1a72c268",
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
          "manifestSha256": "a3ac7549ae42c55a26596c3da80afce9d565d7dd53bc135ade5e6a4e1a72c268",
          "configurationDescriptorSha256": "00943acb6e746288ff8a7fc6c677309793357849fbf008b1c1b380b0c2950eec",
          "reservationDescriptorSha256": "703c43c468c12d92643fa16af0e86c3d483d08cd499b63d76fa95bf9b399c019",
          "implementationBundleSha256": "f7aa1b981073d2e11feed1f7e7690f8a1ade75ccabd6ab6b8d4c9b29c8dc946a",
          "dependencyLockSha256": "e3f942b24b5b515fecc068c475a193034b13a127e1da280cea5b4ad14a03c78a",
          "toolchainIdentitySha256": "3f07da47c80fa46c2d89a7e064cd374ee726cf2c206c08dbfbe35326f9b04356",
          "envelopeSha256": "435387a883a4ee3a09c15ea334056be0ca7e49989e5e5177847d2c066e4b3514"
        },
        "factoryContextVersion": "1.2.0",
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
        "catalogEntryEvidenceId": "d7020b6df92e644270d1b51397bd4fa09885c97138927afcf2f97884d284ee76"
      },
      {
        "instanceId": "delivery",
        "ownerId": "player-one",
        "moduleId": "delivery.pattern.rain",
        "version": "1.0.0",
        "kind": "attack-delivery",
        "implementationId": "delivery.pattern.rain.v1",
        "configurationSchemaId": "delivery.pattern.rain.config",
        "configuration": {
          "attackChannelId": "player.primary",
          "baseCount": 3,
          "speed": 600,
          "baseDamage": 10,
          "textureRole": "player-projectile",
          "spawnOffset": {
            "x": 0,
            "y": -28
          },
          "maxActive": 16,
          "maximumAcceptedRequestsPerSecond": 10,
          "maximumCountBonus": 1,
          "maximumDamageMultiplier": 2,
          "recycleMargin": 32,
          "exhaustionPolicy": "drop-and-observe",
          "spreadDegrees": 20,
          "downwardBaseDirection": {
            "x": 0,
            "y": 1
          }
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "8f8adbf8783c7319e777a0c418f41c9ea7104e5c5746c5a7d4c0d80e6d1570c7",
        "resources": {
          "activeEntities": 256,
          "activeProjectiles": 256,
          "spawnsPerSecond": 2560,
          "timers": 0
        },
        "resourceGrant": {
          "activeEntities": 16,
          "activeProjectiles": 16,
          "spawnsPerSecond": 40,
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
          "manifestSha256": "8f8adbf8783c7319e777a0c418f41c9ea7104e5c5746c5a7d4c0d80e6d1570c7",
          "configurationDescriptorSha256": "5e860f42ff7f135050623eaf4724f8b855a7c5d08cf1244cdaabfe20953ab687",
          "reservationDescriptorSha256": "e84395486242aa580d7ea2091dfd08602042601a63121ba47f24850f837238cb",
          "implementationBundleSha256": "e658387ae10c64775b4682e621368c9364d4aff41581168697666655e73b2d33",
          "dependencyLockSha256": "3a62cb4fa8c1835c5496c91fc4b6018ad52d0e2a9f7c6e03b05675f5f973cd0c",
          "toolchainIdentitySha256": "d36c05bbb20980385899dc98650138698cc54f619092b6d415a24983e56552d0",
          "envelopeSha256": "b145602609e3fbdaafba29c462c0d413b31e683aa1e1cc2295c2a6aae532cae2"
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
        "catalogEntryEvidenceId": "7d18188a54681eb2faa745be7f499737b4c273c640021f771585f9f89e88a84f"
      },
      {
        "instanceId": "detector",
        "ownerId": "enemy-one",
        "moduleId": "interaction.projectile-contact",
        "version": "1.1.0",
        "kind": "combat-interaction",
        "implementationId": "interaction.projectile-contact.v1-1",
        "configurationSchemaId": "interaction.projectile-contact.config",
        "configuration": {
          "sourceEntityRole": "projectile",
          "targetActorRole": "enemy",
          "maximumTrackedContacts": 64
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "a0ef6b9ec62ee0a0024baaa27c1da58a1223fca144a0522f457f048c2bff2c3c",
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
          "manifestSha256": "a0ef6b9ec62ee0a0024baaa27c1da58a1223fca144a0522f457f048c2bff2c3c",
          "configurationDescriptorSha256": "48426de270d5cbf02a8a961a77a90525bddfa11100a260581393becce7c3b31e",
          "reservationDescriptorSha256": "b37389b46ed44dbce09e7dbb2ddf633a1d991a6427731f1c225d4b7c42754fa7",
          "implementationBundleSha256": "a7b7703e206df2501a9a3feb60a815e7051362f046ad35dd6a2b39e8fdde0285",
          "dependencyLockSha256": "3114db68a63f8cc7a5f8d6681980c6d48d25719a43a53f4df02dae977f348f15",
          "toolchainIdentitySha256": "35fe5f84f10587932b8d6b182469ac64fddb54bf4a6b06cd46d970c20ed4ab54",
          "envelopeSha256": "790081f65a1f295c78af5d5489678a675bbb59b5e04ecaa710bdad8851a18bc8"
        },
        "factoryContextVersion": "1.3.0",
        "runtimeContract": {
          "update": {
            "mode": "graph-frame-v1",
            "registrationId": "contact.update"
          },
          "timerSlots": {
            "slotGroupId": "main"
          },
          "inputRegistrations": [],
          "observationReaders": [
            {
              "readerId": "contacts"
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
                  "player",
                  "enemy",
                  "boss"
                ],
                "targetActorRoles": [
                  "player",
                  "enemy",
                  "boss"
                ],
                "sourceEntityRoles": [
                  "projectile"
                ]
              }
            }
          ],
          "outputPorts": [
            {
              "id": "candidate",
              "payloadType": "contact-candidate-v1",
              "delivery": "event"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [],
          "observationReaderIds": [
            "contacts"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": [],
          "overlapRuleId": "projectile.overlap"
        },
        "catalogEntryEvidenceId": "7347c0195e10a7be2b1d703a104824c3dfd641c9a0f426d1e496a41fa73092a0"
      },
      {
        "instanceId": "focus",
        "ownerId": "player-one",
        "moduleId": "intent.focus",
        "version": "1.0.0",
        "kind": "player-intent",
        "implementationId": "intent.focus.v1",
        "configurationSchemaId": "intent.focus.config",
        "configuration": {
          "device": "keyboard",
          "control": "ShiftLeft",
          "initialFocused": false
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "aacb922e96b26e55426cfd454b8bbb54ebe987c894b7a4f362e8092ffebe6792",
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
          "manifestSha256": "aacb922e96b26e55426cfd454b8bbb54ebe987c894b7a4f362e8092ffebe6792",
          "configurationDescriptorSha256": "b4151a58965ec35b2463dc7d11b3d4a1ba48a96e95889856ca30a06003b0f14e",
          "reservationDescriptorSha256": "bb684f2c92d8fef75f30a599bac371807de81d63d040936e472830c3072d39d6",
          "implementationBundleSha256": "aca82a0d51b7a0bb9c2f1b0aee52ddf5bee64c9fb277abceb33398d9b7289847",
          "dependencyLockSha256": "5b498deec049fe835a9f07056297b89515949bc723867821f92110a0ab04db55",
          "toolchainIdentitySha256": "9a149b74eaf8e88bea1c3f4aa0a166ce306dcf155781bdb1a48e5ad05d22e735",
          "envelopeSha256": "95fb5f3bcff3dac4262d9b9054a59f2e303657e445d4f230f1ef3e819d0afa3e"
        },
        "factoryContextVersion": "1.3.0",
        "runtimeContract": {
          "update": null,
          "timerSlots": {
            "slotGroupId": "main"
          },
          "inputRegistrations": [
            {
              "registrationId": "focus.keyboard",
              "kind": "keyboard"
            }
          ],
          "observationReaders": [
            {
              "readerId": "focus"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [],
          "outputPorts": [
            {
              "id": "focus",
              "payloadType": "focus-state-v1",
              "delivery": "state"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [
            "focus.keyboard"
          ],
          "observationReaderIds": [
            "focus"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "23e74a23b5bf7fe53d7ce537dc39ddaeea9b12c0cf8ba0fe5533fba082d20387"
      },
      {
        "instanceId": "focus-speed",
        "ownerId": "player-one",
        "moduleId": "locomotion.focus-speed",
        "version": "1.0.0",
        "kind": "locomotion",
        "implementationId": "locomotion.focus-speed.v1",
        "configurationSchemaId": "locomotion.focus-speed.config",
        "configuration": {
          "multiplier": 0.5,
          "releaseBehavior": "restore"
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "8838f8fe9118c00d243f8d07e01b72fcb1eda0b959a91440930c8f03e975cc20",
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
          "instanceLeases": 3,
          "graphLeases": 0
        },
        "artifactIdentity": {
          "schemaVersion": "1.0.0",
          "algorithm": "sha256",
          "envelopeFormat": "module-registration-envelope-v1",
          "manifestSha256": "8838f8fe9118c00d243f8d07e01b72fcb1eda0b959a91440930c8f03e975cc20",
          "configurationDescriptorSha256": "fb5200ee9a2516b39444b304128e8795afdf6033e8ff6e5c17215c579fc823df",
          "reservationDescriptorSha256": "cb6d1c270296c65cd1dc255f6d8878574369b3d9c6dbc0eefce3f7a00a0184ef",
          "implementationBundleSha256": "20e61c459007c50f75fca426c84cf2cc33f323d940fadc5877b78008e0e32f94",
          "dependencyLockSha256": "5b498deec049fe835a9f07056297b89515949bc723867821f92110a0ab04db55",
          "toolchainIdentitySha256": "9a149b74eaf8e88bea1c3f4aa0a166ce306dcf155781bdb1a48e5ad05d22e735",
          "envelopeSha256": "b3876bcfbeb935e08ad14d31e5f8b404fca9612ac423ba951745db88543b8b80"
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
              "readerId": "scale"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [
            {
              "id": "focus",
              "payloadType": "focus-state-v1",
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
              "id": "scale",
              "payloadType": "movement-scale-v1",
              "delivery": "state"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [],
          "observationReaderIds": [
            "scale"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "28dce4daad405345fb8cca1b45e0b010ea80f43e6de68bb5bca668daf6a5b939"
      },
      {
        "instanceId": "health",
        "ownerId": "enemy-one",
        "moduleId": "combat.health",
        "version": "1.1.0",
        "kind": "combat-interaction",
        "implementationId": "combat.health.v1-1",
        "configurationSchemaId": "combat.health.config",
        "configuration": {
          "maxHealth": 100,
          "initialHealth": 100,
          "damageFloor": 0
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "fa44309ba0be253fd38eb2ddef9a561e51022b9fe0224a83bd2cbd843267b978",
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
          "manifestSha256": "fa44309ba0be253fd38eb2ddef9a561e51022b9fe0224a83bd2cbd843267b978",
          "configurationDescriptorSha256": "093319fcdda8033b14dc680866d669ecbeb2a504965ccb5b8fbda9d22b94ef78",
          "reservationDescriptorSha256": "61db0f8672eb0103417c04d5f8520c88f2767e115cfb49b25c90f20ee3bb9ac4",
          "implementationBundleSha256": "0cb86bf62b96da2f59bec176c24aafa96c2fc99a0320c83ead033ac391c9345b",
          "dependencyLockSha256": "3114db68a63f8cc7a5f8d6681980c6d48d25719a43a53f4df02dae977f348f15",
          "toolchainIdentitySha256": "35fe5f84f10587932b8d6b182469ac64fddb54bf4a6b06cd46d970c20ed4ab54",
          "envelopeSha256": "dd72a85fda2a408eb0f229eb14db6999b9b984b45d16b00df2d676ef3362762e"
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
              "readerId": "health"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [
            {
              "id": "damage",
              "payloadType": "damage-v1",
              "required": true,
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
            },
            {
              "id": "modifier",
              "payloadType": "modifier-application-v1",
              "required": false,
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
            }
          ],
          "outputPorts": [
            {
              "id": "state",
              "payloadType": "health-state-v2",
              "delivery": "state"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [],
          "observationReaderIds": [
            "health"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": [
            "combat.health.current"
          ]
        },
        "catalogEntryEvidenceId": "377f7230f13bc06f4b9ab7d0a0758ba990b0352dea05fddf76936863d3a2bd63"
      },
      {
        "instanceId": "keyboard",
        "ownerId": "player-one",
        "moduleId": "intent.keyboard-movement",
        "version": "1.0.0",
        "kind": "player-intent",
        "implementationId": "intent.keyboard-movement.v1",
        "configurationSchemaId": "intent.keyboard-movement.config",
        "configuration": {
          "bindings": "arrows-and-wasd",
          "normalizeDiagonal": true,
          "emitNeutral": true
        },
        "manifestSchemaVersion": "1.2.0",
        "instantiation": "production-eligible",
        "manifestSha256": "e7e44de719a3683b6d9df4ab640e2381a320948bf374a72f7d4a77214415afb9",
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
          "manifestSha256": "e7e44de719a3683b6d9df4ab640e2381a320948bf374a72f7d4a77214415afb9",
          "configurationDescriptorSha256": "9b015e9b8889308b15831199a276d85e979783081ccc9110ca0a879f143bfc38",
          "reservationDescriptorSha256": "38d096bdc34753c5e32889205da48f25511978a621498733181be8a6dc0c6d1d",
          "implementationBundleSha256": "eb83666306347da2410859d3c907152d91e562e6530403a44f843f88dcd4fd7a",
          "dependencyLockSha256": "e3f942b24b5b515fecc068c475a193034b13a127e1da280cea5b4ad14a03c78a",
          "toolchainIdentitySha256": "3f07da47c80fa46c2d89a7e064cd374ee726cf2c206c08dbfbe35326f9b04356",
          "envelopeSha256": "4a2b9dc74b5c7beb16827b0a2e4c8f84256d5a12fa7de8dd7c54556bc501c11b"
        },
        "factoryContextVersion": "1.2.0",
        "runtimeContract": {
          "update": {
            "mode": "graph-frame-v1",
            "registrationId": "keyboard.update"
          },
          "timerSlots": {
            "slotGroupId": "main"
          },
          "inputRegistrations": [
            {
              "registrationId": "keyboard.direction",
              "kind": "keyboard"
            }
          ],
          "observationReaders": [
            {
              "readerId": "movement"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [],
          "outputPorts": [
            {
              "id": "command",
              "payloadType": "movement-command-v1",
              "delivery": "event"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [
            "keyboard.direction"
          ],
          "observationReaderIds": [
            "movement"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "63839ea8e495dab883c5c83d89808fa34f78ffac04eb44bd78fd12dc58f31d7d"
      },
      {
        "instanceId": "locomotion",
        "ownerId": "player-one",
        "moduleId": "locomotion.bounded",
        "version": "1.1.0",
        "kind": "locomotion",
        "implementationId": "locomotion.bounded.v1-1",
        "configurationSchemaId": "locomotion.bounded.config",
        "configuration": {
          "moveSpeed": 300,
          "bounds": {
            "left": 24,
            "right": 24,
            "top": 24,
            "bottom": 24
          },
          "absoluteMode": "clamp",
          "neutralMode": "zero-velocity"
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "a064dd75d018415059aa4934070bc1ea84009496244742bc9fefccaacf896ccf",
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
          "manifestSha256": "a064dd75d018415059aa4934070bc1ea84009496244742bc9fefccaacf896ccf",
          "configurationDescriptorSha256": "e4725e41c7da63bf4b8d3ca8a1a2c760673c1118f6be73f738f9af2836e7da0d",
          "reservationDescriptorSha256": "9c26433d8dcef54b1fa5cdea3d00c4a4d9a69bfbbed3ce3a37e42b47f8fc1b6f",
          "implementationBundleSha256": "0e2845f8c730f9b32bafca109867b41c912c19d83f71f914c6dcc323f8338921",
          "dependencyLockSha256": "5b498deec049fe835a9f07056297b89515949bc723867821f92110a0ab04db55",
          "toolchainIdentitySha256": "9a149b74eaf8e88bea1c3f4aa0a166ce306dcf155781bdb1a48e5ad05d22e735",
          "envelopeSha256": "4692ccb19733c57887102925be074d83dabcb73a6e990316e9ce9238c543723a"
        },
        "factoryContextVersion": "1.3.0",
        "runtimeContract": {
          "update": {
            "mode": "graph-frame-v1",
            "registrationId": "motion.update"
          },
          "timerSlots": {
            "slotGroupId": "main"
          },
          "inputRegistrations": [],
          "observationReaders": [
            {
              "readerId": "motion"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [
            {
              "id": "command",
              "payloadType": "resolved-movement-command-v1",
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
            },
            {
              "id": "speed-scale",
              "payloadType": "movement-scale-v1",
              "required": false,
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
          "outputPorts": []
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [],
          "observationReaderIds": [
            "motion"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "54570dd840659201eb0e0487d1dc3a7450d95707a7a8be5981f6f5e44dc4dc6b"
      },
      {
        "instanceId": "resolver",
        "ownerId": "enemy-one",
        "moduleId": "interaction.contact-resolution",
        "version": "1.1.0",
        "kind": "combat-interaction",
        "implementationId": "interaction.contact-resolution.v1-1",
        "configurationSchemaId": "interaction.contact-resolution.config",
        "configuration": {
          "policyProfileId": "batch1.default-damage",
          "policyProfileVersion": "1.0.0",
          "allowedDispositions": [
            "damage"
          ],
          "allowedSourceOperations": [
            "consume"
          ],
          "maxResolvedContacts": 64
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "fd7874b237bdb82a08b76f25ba4fb575c10d778bcb844a01aa428bc11b1c1d94",
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
          "instanceLeases": 3,
          "graphLeases": 0
        },
        "artifactIdentity": {
          "schemaVersion": "1.0.0",
          "algorithm": "sha256",
          "envelopeFormat": "module-registration-envelope-v1",
          "manifestSha256": "fd7874b237bdb82a08b76f25ba4fb575c10d778bcb844a01aa428bc11b1c1d94",
          "configurationDescriptorSha256": "8dee45e6761b65725a6adc566cc6834f9af91f30b8c8c3fd5d38fb59e5ff7dae",
          "reservationDescriptorSha256": "7cf892a61da8a880ffba09458f29d1af48fed6f003a146745d004027f4dfdc0a",
          "implementationBundleSha256": "6d682a724fe9c695b8ff0901d232517356c9169423f0c0121a7a37800c8a0481",
          "dependencyLockSha256": "3114db68a63f8cc7a5f8d6681980c6d48d25719a43a53f4df02dae977f348f15",
          "toolchainIdentitySha256": "35fe5f84f10587932b8d6b182469ac64fddb54bf4a6b06cd46d970c20ed4ab54",
          "envelopeSha256": "647206a93107cb0295a7d058b5b111cea63716e88b2c00fc50af0b09e113ef57"
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
              "readerId": "resolution"
            }
          ],
          "contactCommit": {
            "commitServiceId": "contact.commit",
            "maximumConcurrentCommits": 4,
            "admittedOperations": [
              "consume"
            ]
          }
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
                  "player",
                  "enemy",
                  "boss"
                ],
                "targetActorRoles": [
                  "player",
                  "enemy",
                  "boss"
                ],
                "sourceEntityRoles": [
                  "projectile"
                ]
              }
            },
            {
              "id": "candidate",
              "payloadType": "contact-candidate-v1",
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
            }
          ],
          "outputPorts": [
            {
              "id": "hit",
              "payloadType": "hit-v1",
              "delivery": "event"
            },
            {
              "id": "damage",
              "payloadType": "damage-v1",
              "delivery": "event"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [],
          "observationReaderIds": [
            "resolution"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "22b05da6a479e9d03a5c7130820dd69d5892bf76a84c6530715137f3c0b43c78"
      },
      {
        "instanceId": "targeting",
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
        "instanceId": "touch",
        "ownerId": "player-one",
        "moduleId": "intent.touch-drag",
        "version": "1.0.0",
        "kind": "player-intent",
        "implementationId": "intent.touch-drag.v1",
        "configurationSchemaId": "intent.touch-drag.config",
        "configuration": {
          "capture": "first-active",
          "release": "matching-pointer-up",
          "emitOnDown": false
        },
        "manifestSchemaVersion": "1.2.0",
        "instantiation": "production-eligible",
        "manifestSha256": "f18da1c54d0964e2b442d53c54c21560cbe820a7687cefd23c334038b2e4f2e9",
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
          "manifestSha256": "f18da1c54d0964e2b442d53c54c21560cbe820a7687cefd23c334038b2e4f2e9",
          "configurationDescriptorSha256": "8884fbaace9900b8cce6b689e3fc433524be19ded3d22f20caa930b5846d05b1",
          "reservationDescriptorSha256": "c5005923973583d38c4cec38d2578c3a33856fe3f1ebb6b2614a4be9922b84ee",
          "implementationBundleSha256": "aa5102bd10a4d35b822eb8505de712d493f496f1de72a9edf481ce334633e12f",
          "dependencyLockSha256": "e3f942b24b5b515fecc068c475a193034b13a127e1da280cea5b4ad14a03c78a",
          "toolchainIdentitySha256": "3f07da47c80fa46c2d89a7e064cd374ee726cf2c206c08dbfbe35326f9b04356",
          "envelopeSha256": "6b0f163881d2b3ffce945bacd5499eba9b85ea046021749b234b8256ec44cf90"
        },
        "factoryContextVersion": "1.2.0",
        "runtimeContract": {
          "update": null,
          "timerSlots": {
            "slotGroupId": "main"
          },
          "inputRegistrations": [
            {
              "registrationId": "pointer.down",
              "kind": "pointer-down"
            },
            {
              "registrationId": "pointer.move",
              "kind": "pointer-move"
            },
            {
              "registrationId": "pointer.up",
              "kind": "pointer-up"
            }
          ],
          "observationReaders": [
            {
              "readerId": "movement"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [],
          "outputPorts": [
            {
              "id": "command",
              "payloadType": "movement-command-v1",
              "delivery": "event"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [
            "pointer.down",
            "pointer.move",
            "pointer.up"
          ],
          "observationReaderIds": [
            "movement"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "4cdbcb36531f8cf15ada2f1263d5e96cc4e80b3c4ed2bcf27dbfae98c03a4faa"
      },
      {
        "instanceId": "trigger",
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
        "from": "arbiter",
        "to": "keyboard",
        "capabilityId": "intent.movement-source",
        "scope": "owner"
      },
      {
        "from": "arbiter",
        "to": "touch",
        "capabilityId": "intent.movement-source",
        "scope": "owner"
      },
      {
        "from": "delivery",
        "to": "targeting",
        "capabilityId": "targeting.solution-v2",
        "scope": "owner"
      },
      {
        "from": "delivery",
        "to": "trigger",
        "capabilityId": "trigger.attack-v2",
        "scope": "owner"
      },
      {
        "from": "detector",
        "to": "delivery",
        "capabilityId": "delivery.projectile-channel",
        "scope": "assembly"
      },
      {
        "from": "focus-speed",
        "to": "focus",
        "capabilityId": "intent.focus-source",
        "scope": "owner"
      },
      {
        "from": "locomotion",
        "to": "arbiter",
        "capabilityId": "intent.movement-resolved",
        "scope": "owner"
      },
      {
        "from": "resolver",
        "to": "detector",
        "capabilityId": "interaction.projectile-contact-candidate",
        "scope": "owner"
      },
      {
        "from": "resolver",
        "to": "health",
        "capabilityId": "combat.damage-sink",
        "scope": "owner"
      },
      {
        "from": "targeting",
        "to": "aim",
        "capabilityId": "intent.aim-source",
        "scope": "owner"
      },
      {
        "from": "trigger",
        "to": "attack-intent",
        "capabilityId": "intent.attack-source",
        "scope": "owner"
      }
    ],
    "bindings": [
      {
        "from": {
          "instanceId": "aim",
          "portId": "aim"
        },
        "to": {
          "instanceId": "targeting",
          "portId": "aim"
        },
        "payloadType": "aim-command-v1",
        "delivery": "state"
      },
      {
        "from": {
          "instanceId": "arbiter",
          "portId": "resolved"
        },
        "to": {
          "instanceId": "locomotion",
          "portId": "command"
        },
        "payloadType": "resolved-movement-command-v1",
        "delivery": "event"
      },
      {
        "from": {
          "instanceId": "attack-intent",
          "portId": "intent"
        },
        "to": {
          "instanceId": "trigger",
          "portId": "intent"
        },
        "payloadType": "attack-intent-v1",
        "delivery": "event"
      },
      {
        "from": {
          "instanceId": "delivery",
          "portId": "projectiles"
        },
        "to": {
          "instanceId": "detector",
          "portId": "sources"
        },
        "payloadType": "entity-channel-v1",
        "delivery": "state"
      },
      {
        "from": {
          "instanceId": "delivery",
          "portId": "projectiles"
        },
        "to": {
          "instanceId": "resolver",
          "portId": "sources"
        },
        "payloadType": "entity-channel-v1",
        "delivery": "state"
      },
      {
        "from": {
          "instanceId": "detector",
          "portId": "candidate"
        },
        "to": {
          "instanceId": "resolver",
          "portId": "candidate"
        },
        "payloadType": "contact-candidate-v1",
        "delivery": "event"
      },
      {
        "from": {
          "instanceId": "focus",
          "portId": "focus"
        },
        "to": {
          "instanceId": "focus-speed",
          "portId": "focus"
        },
        "payloadType": "focus-state-v1",
        "delivery": "state"
      },
      {
        "from": {
          "instanceId": "focus-speed",
          "portId": "scale"
        },
        "to": {
          "instanceId": "locomotion",
          "portId": "speed-scale"
        },
        "payloadType": "movement-scale-v1",
        "delivery": "state"
      },
      {
        "from": {
          "instanceId": "keyboard",
          "portId": "command"
        },
        "to": {
          "instanceId": "arbiter",
          "portId": "commands"
        },
        "payloadType": "movement-command-v1",
        "delivery": "event"
      },
      {
        "from": {
          "instanceId": "resolver",
          "portId": "damage"
        },
        "to": {
          "instanceId": "health",
          "portId": "damage"
        },
        "payloadType": "damage-v1",
        "delivery": "event"
      },
      {
        "from": {
          "instanceId": "targeting",
          "portId": "selection"
        },
        "to": {
          "instanceId": "delivery",
          "portId": "target"
        },
        "payloadType": "target-solution-v1",
        "delivery": "state"
      },
      {
        "from": {
          "instanceId": "touch",
          "portId": "command"
        },
        "to": {
          "instanceId": "arbiter",
          "portId": "commands"
        },
        "payloadType": "movement-command-v1",
        "delivery": "event"
      },
      {
        "from": {
          "instanceId": "trigger",
          "portId": "request"
        },
        "to": {
          "instanceId": "delivery",
          "portId": "request"
        },
        "payloadType": "attack-request-v2",
        "delivery": "event"
      }
    ],
    "constructionOrder": [
      "aim",
      "keyboard",
      "touch",
      "arbiter",
      "attack-intent",
      "default-policy",
      "targeting",
      "trigger",
      "delivery",
      "detector",
      "focus",
      "focus-speed",
      "health",
      "locomotion",
      "resolver"
    ],
    "assetBindings": [
      {
        "bindingId": "player-projectile",
        "roleId": "player-projectile",
        "category": "projectile",
        "runtimeSha256": "2222222222222222222222222222222222222222222222222222222222222222",
        "textureKey": "module/2222222222222222222222222222222222222222222222222222222222222222/player-projectile",
        "sharing": "instance",
        "consumerInstanceIds": [
          "delivery"
        ]
      }
    ],
    "contactPolicyProfiles": [
      {
        "consumerInstanceId": "resolver",
        "profileId": "batch1.default-damage",
        "version": "1.0.0",
        "evidenceHash": "fe907b71f1b56c3f1e75b13008376413fe41eb5e50d760f76707bb174dd9b818",
        "supportedChainEvidenceId": "batch1.default-damage.chain",
        "orderedPolicyInstanceIds": [
          "default-policy"
        ],
        "orderedPolicyArtifactHashes": [
          "435387a883a4ee3a09c15ea334056be0ca7e49989e5e5177847d2c066e4b3514"
        ]
      }
    ],
    "damageSinkRoutes": [
      {
        "ownerId": "enemy-one",
        "headInstanceId": "health",
        "orderedSinkInstanceIds": [
          "health"
        ],
        "terminalHealthInstanceId": "health",
        "producerInstanceIds": [
          "resolver"
        ]
      }
    ],
    "entityChannels": [
      {
        "channelId": "delivery.projectiles",
        "localChannelId": "projectiles",
        "ownerInstanceId": "delivery",
        "ownerActorId": "player-one",
        "outputPort": "projectiles",
        "entityRole": "projectile",
        "capacity": 16,
        "capacityResources": [
          "activeEntities",
          "activeProjectiles"
        ],
        "readerInstanceIds": [
          "detector",
          "resolver"
        ],
        "sourceArtifactEnvelopeSha256": "b145602609e3fbdaafba29c462c0d413b31e683aa1e1cc2295c2a6aae532cae2"
      }
    ],
    "entityMutationGrants": [
      {
        "grantId": "resolver.projectile.consume",
        "accessId": "projectile.consume",
        "granteeInstanceId": "resolver",
        "channelId": "delivery.projectiles",
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
        "targetingInstanceId": "targeting",
        "triggerInstanceId": "trigger",
        "deliveryInstanceId": "delivery",
        "targetBinding": {
          "from": {
            "instanceId": "targeting",
            "portId": "selection"
          },
          "to": {
            "instanceId": "delivery",
            "portId": "target"
          },
          "payloadType": "target-solution-v1",
          "delivery": "state"
        },
        "requestBinding": {
          "from": {
            "instanceId": "trigger",
            "portId": "request"
          },
          "to": {
            "instanceId": "delivery",
            "portId": "request"
          },
          "payloadType": "attack-request-v2",
          "delivery": "event"
        }
      }
    ],
    "projectileChannelLineages": [
      {
        "lineageId": "detector/projectile-lineage/delivery.projectiles",
        "providerInstanceId": "delivery",
        "providerCapabilityId": "delivery.projectile-channel",
        "sourceBinding": {
          "from": {
            "instanceId": "delivery",
            "portId": "projectiles"
          },
          "to": {
            "instanceId": "detector",
            "portId": "sources"
          },
          "payloadType": "entity-channel-v1",
          "delivery": "state"
        },
        "channelId": "delivery.projectiles",
        "channelOutputPort": "projectiles",
        "consumerInstanceId": "detector",
        "consumerInputPort": "sources"
      }
    ],
    "effectApplicationRoutes": [],
    "pickupEffectPlans": [],
    "projectileBudgetContention": {
      "budget": {
        "activeProjectiles": 16,
        "spawnsPerSecond": 40
      },
      "totals": {
        "activeProjectiles": 16,
        "spawnsPerSecond": 40
      },
      "orderedOwners": [
        {
          "resolvedOrder": 8,
          "instanceId": "delivery",
          "ownerActorId": "player-one",
          "attackChannelId": "player.primary",
          "channelId": "delivery.projectiles",
          "poolId": "delivery.projectiles.pool",
          "activeProjectiles": 16,
          "spawnsPerSecond": 40,
          "cumulativeActiveProjectiles": 16,
          "cumulativeSpawnsPerSecond": 40
        }
      ]
    },
    "resourceTotals": {
      "activeEntities": 16,
      "activeProjectiles": 16,
      "spawnsPerSecond": 40,
      "timers": 0
    }
  },
  {
    "graphVersion": "1.3.0",
    "assemblyId": "batch2.formation-rotating-ring",
    "kernelVersion": "1.0.0",
    "engine": {
      "id": "phaser",
      "version": "3.90.0"
    },
    "executionReadiness": {
      "status": "ready",
      "evidenceId": "d116423e983b709963f0ce7634c056d0e497bfd4ddc485e19ac0442b4a1574df"
    },
    "catalogEvidenceId": "9a8ac4acabf847d2d0c3f44eeab0a657a76b867b732e2a2d5cd128549f582884",
    "actors": [
      {
        "actorId": "player-one",
        "role": "player"
      },
      {
        "actorId": "enemy-one",
        "role": "enemy"
      }
    ],
    "modules": [
      {
        "instanceId": "aim",
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
        "instanceId": "arbiter",
        "ownerId": "player-one",
        "moduleId": "intent.movement-arbiter",
        "version": "1.0.0",
        "kind": "player-intent",
        "implementationId": "intent.movement-arbiter.v1",
        "configurationSchemaId": "intent.movement-arbiter.config",
        "configuration": {
          "policy": "touch-while-active-else-keyboard",
          "keyboardSourceId": "keyboard",
          "touchSourceId": "touch"
        },
        "manifestSchemaVersion": "1.2.0",
        "instantiation": "production-eligible",
        "manifestSha256": "9d43ffcccd085ad78b3ff81bc2182f651117c33fd327a035aeb91ba46b0f4d33",
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
          "instanceLeases": 1,
          "graphLeases": 0
        },
        "artifactIdentity": {
          "schemaVersion": "1.0.0",
          "algorithm": "sha256",
          "envelopeFormat": "module-registration-envelope-v1",
          "manifestSha256": "9d43ffcccd085ad78b3ff81bc2182f651117c33fd327a035aeb91ba46b0f4d33",
          "configurationDescriptorSha256": "9e09d39adeba78199db1be2373cbcdd2e81c8f2a0dc5e00b2200ea42896ec7ba",
          "reservationDescriptorSha256": "a5dcc7a7281d264f7f5876e30d17c68628b8bcce2de3820debfd35b491640a8e",
          "implementationBundleSha256": "82db7e4096b0d2d491829be4fc60a4401c963513225a9be44cceb5c82bbda0c6",
          "dependencyLockSha256": "e3f942b24b5b515fecc068c475a193034b13a127e1da280cea5b4ad14a03c78a",
          "toolchainIdentitySha256": "3f07da47c80fa46c2d89a7e064cd374ee726cf2c206c08dbfbe35326f9b04356",
          "envelopeSha256": "a46bcb6e7b257b0bdc9649aa34aad0c183df155b497d76e95db061e95f5785e1"
        },
        "factoryContextVersion": "1.2.0",
        "runtimeContract": {
          "update": null,
          "timerSlots": {
            "slotGroupId": "main"
          },
          "inputRegistrations": [],
          "observationReaders": [
            {
              "readerId": "arbitration"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [
            {
              "id": "commands",
              "payloadType": "movement-command-v1",
              "required": true,
              "multiple": true,
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
              "id": "resolved",
              "payloadType": "resolved-movement-command-v1",
              "delivery": "event"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [],
          "observationReaderIds": [
            "arbitration"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "02f001a3d921d7daa4a3c0facf2e4e8b40d839837621ac926de6b843666e144a"
      },
      {
        "instanceId": "attack-intent",
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
        "instanceId": "default-policy",
        "ownerId": "enemy-one",
        "moduleId": "interaction.contact-default-damage",
        "version": "1.0.0",
        "kind": "combat-interaction",
        "implementationId": "interaction.contact-default-damage.v1",
        "configurationSchemaId": "interaction.contact-default-damage.config",
        "configuration": {
          "damageKind": "projectile",
          "defaultDisposition": "damage",
          "defaultSourceOperation": "consume"
        },
        "manifestSchemaVersion": "1.2.0",
        "instantiation": "production-eligible",
        "manifestSha256": "a3ac7549ae42c55a26596c3da80afce9d565d7dd53bc135ade5e6a4e1a72c268",
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
          "manifestSha256": "a3ac7549ae42c55a26596c3da80afce9d565d7dd53bc135ade5e6a4e1a72c268",
          "configurationDescriptorSha256": "00943acb6e746288ff8a7fc6c677309793357849fbf008b1c1b380b0c2950eec",
          "reservationDescriptorSha256": "703c43c468c12d92643fa16af0e86c3d483d08cd499b63d76fa95bf9b399c019",
          "implementationBundleSha256": "f7aa1b981073d2e11feed1f7e7690f8a1ade75ccabd6ab6b8d4c9b29c8dc946a",
          "dependencyLockSha256": "e3f942b24b5b515fecc068c475a193034b13a127e1da280cea5b4ad14a03c78a",
          "toolchainIdentitySha256": "3f07da47c80fa46c2d89a7e064cd374ee726cf2c206c08dbfbe35326f9b04356",
          "envelopeSha256": "435387a883a4ee3a09c15ea334056be0ca7e49989e5e5177847d2c066e4b3514"
        },
        "factoryContextVersion": "1.2.0",
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
        "catalogEntryEvidenceId": "d7020b6df92e644270d1b51397bd4fa09885c97138927afcf2f97884d284ee76"
      },
      {
        "instanceId": "delivery",
        "ownerId": "player-one",
        "moduleId": "delivery.pattern.rotating-ring",
        "version": "1.0.0",
        "kind": "attack-delivery",
        "implementationId": "delivery.pattern.rotating-ring.v1",
        "configurationSchemaId": "delivery.pattern.rotating-ring.config",
        "configuration": {
          "attackChannelId": "player.primary",
          "baseCount": 3,
          "speed": 600,
          "baseDamage": 10,
          "textureRole": "player-projectile",
          "spawnOffset": {
            "x": 0,
            "y": -28
          },
          "maxActive": 16,
          "maximumAcceptedRequestsPerSecond": 10,
          "maximumCountBonus": 1,
          "maximumDamageMultiplier": 2,
          "recycleMargin": 32,
          "exhaustionPolicy": "drop-and-observe",
          "ringRotationStepDegrees": 12
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "f6caccce008ce3de00231583976ca798d0492fbc1489e438687e783c44bc6437",
        "resources": {
          "activeEntities": 256,
          "activeProjectiles": 256,
          "spawnsPerSecond": 2560,
          "timers": 0
        },
        "resourceGrant": {
          "activeEntities": 16,
          "activeProjectiles": 16,
          "spawnsPerSecond": 40,
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
          "manifestSha256": "f6caccce008ce3de00231583976ca798d0492fbc1489e438687e783c44bc6437",
          "configurationDescriptorSha256": "69441b064e9436170d00c79efef789f4f448d1a87124492a7fb0459a15f46080",
          "reservationDescriptorSha256": "e84395486242aa580d7ea2091dfd08602042601a63121ba47f24850f837238cb",
          "implementationBundleSha256": "e658387ae10c64775b4682e621368c9364d4aff41581168697666655e73b2d33",
          "dependencyLockSha256": "3a62cb4fa8c1835c5496c91fc4b6018ad52d0e2a9f7c6e03b05675f5f973cd0c",
          "toolchainIdentitySha256": "d36c05bbb20980385899dc98650138698cc54f619092b6d415a24983e56552d0",
          "envelopeSha256": "86bf581abb3a6c59d424b26c850f1daa21ed76e1a0d7be9556225a89213b78a4"
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
        "catalogEntryEvidenceId": "64fb9adebc218c0bd88ef0868f391b0db03b31027fe75c349f60ddfc59466523"
      },
      {
        "instanceId": "detector",
        "ownerId": "enemy-one",
        "moduleId": "interaction.projectile-contact",
        "version": "1.1.0",
        "kind": "combat-interaction",
        "implementationId": "interaction.projectile-contact.v1-1",
        "configurationSchemaId": "interaction.projectile-contact.config",
        "configuration": {
          "sourceEntityRole": "projectile",
          "targetActorRole": "enemy",
          "maximumTrackedContacts": 64
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "a0ef6b9ec62ee0a0024baaa27c1da58a1223fca144a0522f457f048c2bff2c3c",
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
          "manifestSha256": "a0ef6b9ec62ee0a0024baaa27c1da58a1223fca144a0522f457f048c2bff2c3c",
          "configurationDescriptorSha256": "48426de270d5cbf02a8a961a77a90525bddfa11100a260581393becce7c3b31e",
          "reservationDescriptorSha256": "b37389b46ed44dbce09e7dbb2ddf633a1d991a6427731f1c225d4b7c42754fa7",
          "implementationBundleSha256": "a7b7703e206df2501a9a3feb60a815e7051362f046ad35dd6a2b39e8fdde0285",
          "dependencyLockSha256": "3114db68a63f8cc7a5f8d6681980c6d48d25719a43a53f4df02dae977f348f15",
          "toolchainIdentitySha256": "35fe5f84f10587932b8d6b182469ac64fddb54bf4a6b06cd46d970c20ed4ab54",
          "envelopeSha256": "790081f65a1f295c78af5d5489678a675bbb59b5e04ecaa710bdad8851a18bc8"
        },
        "factoryContextVersion": "1.3.0",
        "runtimeContract": {
          "update": {
            "mode": "graph-frame-v1",
            "registrationId": "contact.update"
          },
          "timerSlots": {
            "slotGroupId": "main"
          },
          "inputRegistrations": [],
          "observationReaders": [
            {
              "readerId": "contacts"
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
                  "player",
                  "enemy",
                  "boss"
                ],
                "targetActorRoles": [
                  "player",
                  "enemy",
                  "boss"
                ],
                "sourceEntityRoles": [
                  "projectile"
                ]
              }
            }
          ],
          "outputPorts": [
            {
              "id": "candidate",
              "payloadType": "contact-candidate-v1",
              "delivery": "event"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [],
          "observationReaderIds": [
            "contacts"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": [],
          "overlapRuleId": "projectile.overlap"
        },
        "catalogEntryEvidenceId": "7347c0195e10a7be2b1d703a104824c3dfd641c9a0f426d1e496a41fa73092a0"
      },
      {
        "instanceId": "focus",
        "ownerId": "player-one",
        "moduleId": "intent.focus",
        "version": "1.0.0",
        "kind": "player-intent",
        "implementationId": "intent.focus.v1",
        "configurationSchemaId": "intent.focus.config",
        "configuration": {
          "device": "keyboard",
          "control": "ShiftLeft",
          "initialFocused": false
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "aacb922e96b26e55426cfd454b8bbb54ebe987c894b7a4f362e8092ffebe6792",
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
          "manifestSha256": "aacb922e96b26e55426cfd454b8bbb54ebe987c894b7a4f362e8092ffebe6792",
          "configurationDescriptorSha256": "b4151a58965ec35b2463dc7d11b3d4a1ba48a96e95889856ca30a06003b0f14e",
          "reservationDescriptorSha256": "bb684f2c92d8fef75f30a599bac371807de81d63d040936e472830c3072d39d6",
          "implementationBundleSha256": "aca82a0d51b7a0bb9c2f1b0aee52ddf5bee64c9fb277abceb33398d9b7289847",
          "dependencyLockSha256": "5b498deec049fe835a9f07056297b89515949bc723867821f92110a0ab04db55",
          "toolchainIdentitySha256": "9a149b74eaf8e88bea1c3f4aa0a166ce306dcf155781bdb1a48e5ad05d22e735",
          "envelopeSha256": "95fb5f3bcff3dac4262d9b9054a59f2e303657e445d4f230f1ef3e819d0afa3e"
        },
        "factoryContextVersion": "1.3.0",
        "runtimeContract": {
          "update": null,
          "timerSlots": {
            "slotGroupId": "main"
          },
          "inputRegistrations": [
            {
              "registrationId": "focus.keyboard",
              "kind": "keyboard"
            }
          ],
          "observationReaders": [
            {
              "readerId": "focus"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [],
          "outputPorts": [
            {
              "id": "focus",
              "payloadType": "focus-state-v1",
              "delivery": "state"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [
            "focus.keyboard"
          ],
          "observationReaderIds": [
            "focus"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "23e74a23b5bf7fe53d7ce537dc39ddaeea9b12c0cf8ba0fe5533fba082d20387"
      },
      {
        "instanceId": "focus-speed",
        "ownerId": "player-one",
        "moduleId": "locomotion.focus-speed",
        "version": "1.0.0",
        "kind": "locomotion",
        "implementationId": "locomotion.focus-speed.v1",
        "configurationSchemaId": "locomotion.focus-speed.config",
        "configuration": {
          "multiplier": 0.5,
          "releaseBehavior": "restore"
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "8838f8fe9118c00d243f8d07e01b72fcb1eda0b959a91440930c8f03e975cc20",
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
          "instanceLeases": 3,
          "graphLeases": 0
        },
        "artifactIdentity": {
          "schemaVersion": "1.0.0",
          "algorithm": "sha256",
          "envelopeFormat": "module-registration-envelope-v1",
          "manifestSha256": "8838f8fe9118c00d243f8d07e01b72fcb1eda0b959a91440930c8f03e975cc20",
          "configurationDescriptorSha256": "fb5200ee9a2516b39444b304128e8795afdf6033e8ff6e5c17215c579fc823df",
          "reservationDescriptorSha256": "cb6d1c270296c65cd1dc255f6d8878574369b3d9c6dbc0eefce3f7a00a0184ef",
          "implementationBundleSha256": "20e61c459007c50f75fca426c84cf2cc33f323d940fadc5877b78008e0e32f94",
          "dependencyLockSha256": "5b498deec049fe835a9f07056297b89515949bc723867821f92110a0ab04db55",
          "toolchainIdentitySha256": "9a149b74eaf8e88bea1c3f4aa0a166ce306dcf155781bdb1a48e5ad05d22e735",
          "envelopeSha256": "b3876bcfbeb935e08ad14d31e5f8b404fca9612ac423ba951745db88543b8b80"
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
              "readerId": "scale"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [
            {
              "id": "focus",
              "payloadType": "focus-state-v1",
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
              "id": "scale",
              "payloadType": "movement-scale-v1",
              "delivery": "state"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [],
          "observationReaderIds": [
            "scale"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "28dce4daad405345fb8cca1b45e0b010ea80f43e6de68bb5bca668daf6a5b939"
      },
      {
        "instanceId": "health",
        "ownerId": "enemy-one",
        "moduleId": "combat.health",
        "version": "1.1.0",
        "kind": "combat-interaction",
        "implementationId": "combat.health.v1-1",
        "configurationSchemaId": "combat.health.config",
        "configuration": {
          "maxHealth": 100,
          "initialHealth": 100,
          "damageFloor": 0
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "fa44309ba0be253fd38eb2ddef9a561e51022b9fe0224a83bd2cbd843267b978",
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
          "manifestSha256": "fa44309ba0be253fd38eb2ddef9a561e51022b9fe0224a83bd2cbd843267b978",
          "configurationDescriptorSha256": "093319fcdda8033b14dc680866d669ecbeb2a504965ccb5b8fbda9d22b94ef78",
          "reservationDescriptorSha256": "61db0f8672eb0103417c04d5f8520c88f2767e115cfb49b25c90f20ee3bb9ac4",
          "implementationBundleSha256": "0cb86bf62b96da2f59bec176c24aafa96c2fc99a0320c83ead033ac391c9345b",
          "dependencyLockSha256": "3114db68a63f8cc7a5f8d6681980c6d48d25719a43a53f4df02dae977f348f15",
          "toolchainIdentitySha256": "35fe5f84f10587932b8d6b182469ac64fddb54bf4a6b06cd46d970c20ed4ab54",
          "envelopeSha256": "dd72a85fda2a408eb0f229eb14db6999b9b984b45d16b00df2d676ef3362762e"
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
              "readerId": "health"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [
            {
              "id": "damage",
              "payloadType": "damage-v1",
              "required": true,
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
            },
            {
              "id": "modifier",
              "payloadType": "modifier-application-v1",
              "required": false,
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
            }
          ],
          "outputPorts": [
            {
              "id": "state",
              "payloadType": "health-state-v2",
              "delivery": "state"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [],
          "observationReaderIds": [
            "health"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": [
            "combat.health.current"
          ]
        },
        "catalogEntryEvidenceId": "377f7230f13bc06f4b9ab7d0a0758ba990b0352dea05fddf76936863d3a2bd63"
      },
      {
        "instanceId": "keyboard",
        "ownerId": "player-one",
        "moduleId": "intent.keyboard-movement",
        "version": "1.0.0",
        "kind": "player-intent",
        "implementationId": "intent.keyboard-movement.v1",
        "configurationSchemaId": "intent.keyboard-movement.config",
        "configuration": {
          "bindings": "arrows-and-wasd",
          "normalizeDiagonal": true,
          "emitNeutral": true
        },
        "manifestSchemaVersion": "1.2.0",
        "instantiation": "production-eligible",
        "manifestSha256": "e7e44de719a3683b6d9df4ab640e2381a320948bf374a72f7d4a77214415afb9",
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
          "manifestSha256": "e7e44de719a3683b6d9df4ab640e2381a320948bf374a72f7d4a77214415afb9",
          "configurationDescriptorSha256": "9b015e9b8889308b15831199a276d85e979783081ccc9110ca0a879f143bfc38",
          "reservationDescriptorSha256": "38d096bdc34753c5e32889205da48f25511978a621498733181be8a6dc0c6d1d",
          "implementationBundleSha256": "eb83666306347da2410859d3c907152d91e562e6530403a44f843f88dcd4fd7a",
          "dependencyLockSha256": "e3f942b24b5b515fecc068c475a193034b13a127e1da280cea5b4ad14a03c78a",
          "toolchainIdentitySha256": "3f07da47c80fa46c2d89a7e064cd374ee726cf2c206c08dbfbe35326f9b04356",
          "envelopeSha256": "4a2b9dc74b5c7beb16827b0a2e4c8f84256d5a12fa7de8dd7c54556bc501c11b"
        },
        "factoryContextVersion": "1.2.0",
        "runtimeContract": {
          "update": {
            "mode": "graph-frame-v1",
            "registrationId": "keyboard.update"
          },
          "timerSlots": {
            "slotGroupId": "main"
          },
          "inputRegistrations": [
            {
              "registrationId": "keyboard.direction",
              "kind": "keyboard"
            }
          ],
          "observationReaders": [
            {
              "readerId": "movement"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [],
          "outputPorts": [
            {
              "id": "command",
              "payloadType": "movement-command-v1",
              "delivery": "event"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [
            "keyboard.direction"
          ],
          "observationReaderIds": [
            "movement"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "63839ea8e495dab883c5c83d89808fa34f78ffac04eb44bd78fd12dc58f31d7d"
      },
      {
        "instanceId": "locomotion",
        "ownerId": "player-one",
        "moduleId": "locomotion.bounded",
        "version": "1.1.0",
        "kind": "locomotion",
        "implementationId": "locomotion.bounded.v1-1",
        "configurationSchemaId": "locomotion.bounded.config",
        "configuration": {
          "moveSpeed": 300,
          "bounds": {
            "left": 24,
            "right": 24,
            "top": 24,
            "bottom": 24
          },
          "absoluteMode": "clamp",
          "neutralMode": "zero-velocity"
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "a064dd75d018415059aa4934070bc1ea84009496244742bc9fefccaacf896ccf",
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
          "manifestSha256": "a064dd75d018415059aa4934070bc1ea84009496244742bc9fefccaacf896ccf",
          "configurationDescriptorSha256": "e4725e41c7da63bf4b8d3ca8a1a2c760673c1118f6be73f738f9af2836e7da0d",
          "reservationDescriptorSha256": "9c26433d8dcef54b1fa5cdea3d00c4a4d9a69bfbbed3ce3a37e42b47f8fc1b6f",
          "implementationBundleSha256": "0e2845f8c730f9b32bafca109867b41c912c19d83f71f914c6dcc323f8338921",
          "dependencyLockSha256": "5b498deec049fe835a9f07056297b89515949bc723867821f92110a0ab04db55",
          "toolchainIdentitySha256": "9a149b74eaf8e88bea1c3f4aa0a166ce306dcf155781bdb1a48e5ad05d22e735",
          "envelopeSha256": "4692ccb19733c57887102925be074d83dabcb73a6e990316e9ce9238c543723a"
        },
        "factoryContextVersion": "1.3.0",
        "runtimeContract": {
          "update": {
            "mode": "graph-frame-v1",
            "registrationId": "motion.update"
          },
          "timerSlots": {
            "slotGroupId": "main"
          },
          "inputRegistrations": [],
          "observationReaders": [
            {
              "readerId": "motion"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [
            {
              "id": "command",
              "payloadType": "resolved-movement-command-v1",
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
            },
            {
              "id": "speed-scale",
              "payloadType": "movement-scale-v1",
              "required": false,
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
          "outputPorts": []
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [],
          "observationReaderIds": [
            "motion"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "54570dd840659201eb0e0487d1dc3a7450d95707a7a8be5981f6f5e44dc4dc6b"
      },
      {
        "instanceId": "resolver",
        "ownerId": "enemy-one",
        "moduleId": "interaction.contact-resolution",
        "version": "1.1.0",
        "kind": "combat-interaction",
        "implementationId": "interaction.contact-resolution.v1-1",
        "configurationSchemaId": "interaction.contact-resolution.config",
        "configuration": {
          "policyProfileId": "batch1.default-damage",
          "policyProfileVersion": "1.0.0",
          "allowedDispositions": [
            "damage"
          ],
          "allowedSourceOperations": [
            "consume"
          ],
          "maxResolvedContacts": 64
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "fd7874b237bdb82a08b76f25ba4fb575c10d778bcb844a01aa428bc11b1c1d94",
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
          "instanceLeases": 3,
          "graphLeases": 0
        },
        "artifactIdentity": {
          "schemaVersion": "1.0.0",
          "algorithm": "sha256",
          "envelopeFormat": "module-registration-envelope-v1",
          "manifestSha256": "fd7874b237bdb82a08b76f25ba4fb575c10d778bcb844a01aa428bc11b1c1d94",
          "configurationDescriptorSha256": "8dee45e6761b65725a6adc566cc6834f9af91f30b8c8c3fd5d38fb59e5ff7dae",
          "reservationDescriptorSha256": "7cf892a61da8a880ffba09458f29d1af48fed6f003a146745d004027f4dfdc0a",
          "implementationBundleSha256": "6d682a724fe9c695b8ff0901d232517356c9169423f0c0121a7a37800c8a0481",
          "dependencyLockSha256": "3114db68a63f8cc7a5f8d6681980c6d48d25719a43a53f4df02dae977f348f15",
          "toolchainIdentitySha256": "35fe5f84f10587932b8d6b182469ac64fddb54bf4a6b06cd46d970c20ed4ab54",
          "envelopeSha256": "647206a93107cb0295a7d058b5b111cea63716e88b2c00fc50af0b09e113ef57"
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
              "readerId": "resolution"
            }
          ],
          "contactCommit": {
            "commitServiceId": "contact.commit",
            "maximumConcurrentCommits": 4,
            "admittedOperations": [
              "consume"
            ]
          }
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
                  "player",
                  "enemy",
                  "boss"
                ],
                "targetActorRoles": [
                  "player",
                  "enemy",
                  "boss"
                ],
                "sourceEntityRoles": [
                  "projectile"
                ]
              }
            },
            {
              "id": "candidate",
              "payloadType": "contact-candidate-v1",
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
            }
          ],
          "outputPorts": [
            {
              "id": "hit",
              "payloadType": "hit-v1",
              "delivery": "event"
            },
            {
              "id": "damage",
              "payloadType": "damage-v1",
              "delivery": "event"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [],
          "observationReaderIds": [
            "resolution"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "22b05da6a479e9d03a5c7130820dd69d5892bf76a84c6530715137f3c0b43c78"
      },
      {
        "instanceId": "targeting",
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
        "instanceId": "touch",
        "ownerId": "player-one",
        "moduleId": "intent.touch-drag",
        "version": "1.0.0",
        "kind": "player-intent",
        "implementationId": "intent.touch-drag.v1",
        "configurationSchemaId": "intent.touch-drag.config",
        "configuration": {
          "capture": "first-active",
          "release": "matching-pointer-up",
          "emitOnDown": false
        },
        "manifestSchemaVersion": "1.2.0",
        "instantiation": "production-eligible",
        "manifestSha256": "f18da1c54d0964e2b442d53c54c21560cbe820a7687cefd23c334038b2e4f2e9",
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
          "manifestSha256": "f18da1c54d0964e2b442d53c54c21560cbe820a7687cefd23c334038b2e4f2e9",
          "configurationDescriptorSha256": "8884fbaace9900b8cce6b689e3fc433524be19ded3d22f20caa930b5846d05b1",
          "reservationDescriptorSha256": "c5005923973583d38c4cec38d2578c3a33856fe3f1ebb6b2614a4be9922b84ee",
          "implementationBundleSha256": "aa5102bd10a4d35b822eb8505de712d493f496f1de72a9edf481ce334633e12f",
          "dependencyLockSha256": "e3f942b24b5b515fecc068c475a193034b13a127e1da280cea5b4ad14a03c78a",
          "toolchainIdentitySha256": "3f07da47c80fa46c2d89a7e064cd374ee726cf2c206c08dbfbe35326f9b04356",
          "envelopeSha256": "6b0f163881d2b3ffce945bacd5499eba9b85ea046021749b234b8256ec44cf90"
        },
        "factoryContextVersion": "1.2.0",
        "runtimeContract": {
          "update": null,
          "timerSlots": {
            "slotGroupId": "main"
          },
          "inputRegistrations": [
            {
              "registrationId": "pointer.down",
              "kind": "pointer-down"
            },
            {
              "registrationId": "pointer.move",
              "kind": "pointer-move"
            },
            {
              "registrationId": "pointer.up",
              "kind": "pointer-up"
            }
          ],
          "observationReaders": [
            {
              "readerId": "movement"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [],
          "outputPorts": [
            {
              "id": "command",
              "payloadType": "movement-command-v1",
              "delivery": "event"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [
            "pointer.down",
            "pointer.move",
            "pointer.up"
          ],
          "observationReaderIds": [
            "movement"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "4cdbcb36531f8cf15ada2f1263d5e96cc4e80b3c4ed2bcf27dbfae98c03a4faa"
      },
      {
        "instanceId": "trigger",
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
        "from": "arbiter",
        "to": "keyboard",
        "capabilityId": "intent.movement-source",
        "scope": "owner"
      },
      {
        "from": "arbiter",
        "to": "touch",
        "capabilityId": "intent.movement-source",
        "scope": "owner"
      },
      {
        "from": "delivery",
        "to": "targeting",
        "capabilityId": "targeting.solution-v2",
        "scope": "owner"
      },
      {
        "from": "delivery",
        "to": "trigger",
        "capabilityId": "trigger.attack-v2",
        "scope": "owner"
      },
      {
        "from": "detector",
        "to": "delivery",
        "capabilityId": "delivery.projectile-channel",
        "scope": "assembly"
      },
      {
        "from": "focus-speed",
        "to": "focus",
        "capabilityId": "intent.focus-source",
        "scope": "owner"
      },
      {
        "from": "locomotion",
        "to": "arbiter",
        "capabilityId": "intent.movement-resolved",
        "scope": "owner"
      },
      {
        "from": "resolver",
        "to": "detector",
        "capabilityId": "interaction.projectile-contact-candidate",
        "scope": "owner"
      },
      {
        "from": "resolver",
        "to": "health",
        "capabilityId": "combat.damage-sink",
        "scope": "owner"
      },
      {
        "from": "targeting",
        "to": "aim",
        "capabilityId": "intent.aim-source",
        "scope": "owner"
      },
      {
        "from": "trigger",
        "to": "attack-intent",
        "capabilityId": "intent.attack-source",
        "scope": "owner"
      }
    ],
    "bindings": [
      {
        "from": {
          "instanceId": "aim",
          "portId": "aim"
        },
        "to": {
          "instanceId": "targeting",
          "portId": "aim"
        },
        "payloadType": "aim-command-v1",
        "delivery": "state"
      },
      {
        "from": {
          "instanceId": "arbiter",
          "portId": "resolved"
        },
        "to": {
          "instanceId": "locomotion",
          "portId": "command"
        },
        "payloadType": "resolved-movement-command-v1",
        "delivery": "event"
      },
      {
        "from": {
          "instanceId": "attack-intent",
          "portId": "intent"
        },
        "to": {
          "instanceId": "trigger",
          "portId": "intent"
        },
        "payloadType": "attack-intent-v1",
        "delivery": "event"
      },
      {
        "from": {
          "instanceId": "delivery",
          "portId": "projectiles"
        },
        "to": {
          "instanceId": "detector",
          "portId": "sources"
        },
        "payloadType": "entity-channel-v1",
        "delivery": "state"
      },
      {
        "from": {
          "instanceId": "delivery",
          "portId": "projectiles"
        },
        "to": {
          "instanceId": "resolver",
          "portId": "sources"
        },
        "payloadType": "entity-channel-v1",
        "delivery": "state"
      },
      {
        "from": {
          "instanceId": "detector",
          "portId": "candidate"
        },
        "to": {
          "instanceId": "resolver",
          "portId": "candidate"
        },
        "payloadType": "contact-candidate-v1",
        "delivery": "event"
      },
      {
        "from": {
          "instanceId": "focus",
          "portId": "focus"
        },
        "to": {
          "instanceId": "focus-speed",
          "portId": "focus"
        },
        "payloadType": "focus-state-v1",
        "delivery": "state"
      },
      {
        "from": {
          "instanceId": "focus-speed",
          "portId": "scale"
        },
        "to": {
          "instanceId": "locomotion",
          "portId": "speed-scale"
        },
        "payloadType": "movement-scale-v1",
        "delivery": "state"
      },
      {
        "from": {
          "instanceId": "keyboard",
          "portId": "command"
        },
        "to": {
          "instanceId": "arbiter",
          "portId": "commands"
        },
        "payloadType": "movement-command-v1",
        "delivery": "event"
      },
      {
        "from": {
          "instanceId": "resolver",
          "portId": "damage"
        },
        "to": {
          "instanceId": "health",
          "portId": "damage"
        },
        "payloadType": "damage-v1",
        "delivery": "event"
      },
      {
        "from": {
          "instanceId": "targeting",
          "portId": "selection"
        },
        "to": {
          "instanceId": "delivery",
          "portId": "target"
        },
        "payloadType": "target-solution-v1",
        "delivery": "state"
      },
      {
        "from": {
          "instanceId": "touch",
          "portId": "command"
        },
        "to": {
          "instanceId": "arbiter",
          "portId": "commands"
        },
        "payloadType": "movement-command-v1",
        "delivery": "event"
      },
      {
        "from": {
          "instanceId": "trigger",
          "portId": "request"
        },
        "to": {
          "instanceId": "delivery",
          "portId": "request"
        },
        "payloadType": "attack-request-v2",
        "delivery": "event"
      }
    ],
    "constructionOrder": [
      "aim",
      "keyboard",
      "touch",
      "arbiter",
      "attack-intent",
      "default-policy",
      "targeting",
      "trigger",
      "delivery",
      "detector",
      "focus",
      "focus-speed",
      "health",
      "locomotion",
      "resolver"
    ],
    "assetBindings": [
      {
        "bindingId": "player-projectile",
        "roleId": "player-projectile",
        "category": "projectile",
        "runtimeSha256": "2222222222222222222222222222222222222222222222222222222222222222",
        "textureKey": "module/2222222222222222222222222222222222222222222222222222222222222222/player-projectile",
        "sharing": "instance",
        "consumerInstanceIds": [
          "delivery"
        ]
      }
    ],
    "contactPolicyProfiles": [
      {
        "consumerInstanceId": "resolver",
        "profileId": "batch1.default-damage",
        "version": "1.0.0",
        "evidenceHash": "fe907b71f1b56c3f1e75b13008376413fe41eb5e50d760f76707bb174dd9b818",
        "supportedChainEvidenceId": "batch1.default-damage.chain",
        "orderedPolicyInstanceIds": [
          "default-policy"
        ],
        "orderedPolicyArtifactHashes": [
          "435387a883a4ee3a09c15ea334056be0ca7e49989e5e5177847d2c066e4b3514"
        ]
      }
    ],
    "damageSinkRoutes": [
      {
        "ownerId": "enemy-one",
        "headInstanceId": "health",
        "orderedSinkInstanceIds": [
          "health"
        ],
        "terminalHealthInstanceId": "health",
        "producerInstanceIds": [
          "resolver"
        ]
      }
    ],
    "entityChannels": [
      {
        "channelId": "delivery.projectiles",
        "localChannelId": "projectiles",
        "ownerInstanceId": "delivery",
        "ownerActorId": "player-one",
        "outputPort": "projectiles",
        "entityRole": "projectile",
        "capacity": 16,
        "capacityResources": [
          "activeEntities",
          "activeProjectiles"
        ],
        "readerInstanceIds": [
          "detector",
          "resolver"
        ],
        "sourceArtifactEnvelopeSha256": "86bf581abb3a6c59d424b26c850f1daa21ed76e1a0d7be9556225a89213b78a4"
      }
    ],
    "entityMutationGrants": [
      {
        "grantId": "resolver.projectile.consume",
        "accessId": "projectile.consume",
        "granteeInstanceId": "resolver",
        "channelId": "delivery.projectiles",
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
        "targetingInstanceId": "targeting",
        "triggerInstanceId": "trigger",
        "deliveryInstanceId": "delivery",
        "targetBinding": {
          "from": {
            "instanceId": "targeting",
            "portId": "selection"
          },
          "to": {
            "instanceId": "delivery",
            "portId": "target"
          },
          "payloadType": "target-solution-v1",
          "delivery": "state"
        },
        "requestBinding": {
          "from": {
            "instanceId": "trigger",
            "portId": "request"
          },
          "to": {
            "instanceId": "delivery",
            "portId": "request"
          },
          "payloadType": "attack-request-v2",
          "delivery": "event"
        }
      }
    ],
    "projectileChannelLineages": [
      {
        "lineageId": "detector/projectile-lineage/delivery.projectiles",
        "providerInstanceId": "delivery",
        "providerCapabilityId": "delivery.projectile-channel",
        "sourceBinding": {
          "from": {
            "instanceId": "delivery",
            "portId": "projectiles"
          },
          "to": {
            "instanceId": "detector",
            "portId": "sources"
          },
          "payloadType": "entity-channel-v1",
          "delivery": "state"
        },
        "channelId": "delivery.projectiles",
        "channelOutputPort": "projectiles",
        "consumerInstanceId": "detector",
        "consumerInputPort": "sources"
      }
    ],
    "effectApplicationRoutes": [],
    "pickupEffectPlans": [],
    "projectileBudgetContention": {
      "budget": {
        "activeProjectiles": 16,
        "spawnsPerSecond": 40
      },
      "totals": {
        "activeProjectiles": 16,
        "spawnsPerSecond": 40
      },
      "orderedOwners": [
        {
          "resolvedOrder": 8,
          "instanceId": "delivery",
          "ownerActorId": "player-one",
          "attackChannelId": "player.primary",
          "channelId": "delivery.projectiles",
          "poolId": "delivery.projectiles.pool",
          "activeProjectiles": 16,
          "spawnsPerSecond": 40,
          "cumulativeActiveProjectiles": 16,
          "cumulativeSpawnsPerSecond": 40
        }
      ]
    },
    "resourceTotals": {
      "activeEntities": 16,
      "activeProjectiles": 16,
      "spawnsPerSecond": 40,
      "timers": 0
    }
  },
  {
    "graphVersion": "1.3.0",
    "assemblyId": "batch2.formation-burst",
    "kernelVersion": "1.0.0",
    "engine": {
      "id": "phaser",
      "version": "3.90.0"
    },
    "executionReadiness": {
      "status": "ready",
      "evidenceId": "68af0acc803989e6b858933a0cc028b80148ab464d0188692e2e8a3084958f66"
    },
    "catalogEvidenceId": "ed1fdb4868ea889bf53aa64771f8607fba47fc8d3f82a9db9988e07c593e8cab",
    "actors": [
      {
        "actorId": "player-one",
        "role": "player"
      },
      {
        "actorId": "enemy-one",
        "role": "enemy"
      }
    ],
    "modules": [
      {
        "instanceId": "aim",
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
        "instanceId": "arbiter",
        "ownerId": "player-one",
        "moduleId": "intent.movement-arbiter",
        "version": "1.0.0",
        "kind": "player-intent",
        "implementationId": "intent.movement-arbiter.v1",
        "configurationSchemaId": "intent.movement-arbiter.config",
        "configuration": {
          "policy": "touch-while-active-else-keyboard",
          "keyboardSourceId": "keyboard",
          "touchSourceId": "touch"
        },
        "manifestSchemaVersion": "1.2.0",
        "instantiation": "production-eligible",
        "manifestSha256": "9d43ffcccd085ad78b3ff81bc2182f651117c33fd327a035aeb91ba46b0f4d33",
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
          "instanceLeases": 1,
          "graphLeases": 0
        },
        "artifactIdentity": {
          "schemaVersion": "1.0.0",
          "algorithm": "sha256",
          "envelopeFormat": "module-registration-envelope-v1",
          "manifestSha256": "9d43ffcccd085ad78b3ff81bc2182f651117c33fd327a035aeb91ba46b0f4d33",
          "configurationDescriptorSha256": "9e09d39adeba78199db1be2373cbcdd2e81c8f2a0dc5e00b2200ea42896ec7ba",
          "reservationDescriptorSha256": "a5dcc7a7281d264f7f5876e30d17c68628b8bcce2de3820debfd35b491640a8e",
          "implementationBundleSha256": "82db7e4096b0d2d491829be4fc60a4401c963513225a9be44cceb5c82bbda0c6",
          "dependencyLockSha256": "e3f942b24b5b515fecc068c475a193034b13a127e1da280cea5b4ad14a03c78a",
          "toolchainIdentitySha256": "3f07da47c80fa46c2d89a7e064cd374ee726cf2c206c08dbfbe35326f9b04356",
          "envelopeSha256": "a46bcb6e7b257b0bdc9649aa34aad0c183df155b497d76e95db061e95f5785e1"
        },
        "factoryContextVersion": "1.2.0",
        "runtimeContract": {
          "update": null,
          "timerSlots": {
            "slotGroupId": "main"
          },
          "inputRegistrations": [],
          "observationReaders": [
            {
              "readerId": "arbitration"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [
            {
              "id": "commands",
              "payloadType": "movement-command-v1",
              "required": true,
              "multiple": true,
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
              "id": "resolved",
              "payloadType": "resolved-movement-command-v1",
              "delivery": "event"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [],
          "observationReaderIds": [
            "arbitration"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "02f001a3d921d7daa4a3c0facf2e4e8b40d839837621ac926de6b843666e144a"
      },
      {
        "instanceId": "attack-intent",
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
        "instanceId": "default-policy",
        "ownerId": "enemy-one",
        "moduleId": "interaction.contact-default-damage",
        "version": "1.0.0",
        "kind": "combat-interaction",
        "implementationId": "interaction.contact-default-damage.v1",
        "configurationSchemaId": "interaction.contact-default-damage.config",
        "configuration": {
          "damageKind": "projectile",
          "defaultDisposition": "damage",
          "defaultSourceOperation": "consume"
        },
        "manifestSchemaVersion": "1.2.0",
        "instantiation": "production-eligible",
        "manifestSha256": "a3ac7549ae42c55a26596c3da80afce9d565d7dd53bc135ade5e6a4e1a72c268",
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
          "manifestSha256": "a3ac7549ae42c55a26596c3da80afce9d565d7dd53bc135ade5e6a4e1a72c268",
          "configurationDescriptorSha256": "00943acb6e746288ff8a7fc6c677309793357849fbf008b1c1b380b0c2950eec",
          "reservationDescriptorSha256": "703c43c468c12d92643fa16af0e86c3d483d08cd499b63d76fa95bf9b399c019",
          "implementationBundleSha256": "f7aa1b981073d2e11feed1f7e7690f8a1ade75ccabd6ab6b8d4c9b29c8dc946a",
          "dependencyLockSha256": "e3f942b24b5b515fecc068c475a193034b13a127e1da280cea5b4ad14a03c78a",
          "toolchainIdentitySha256": "3f07da47c80fa46c2d89a7e064cd374ee726cf2c206c08dbfbe35326f9b04356",
          "envelopeSha256": "435387a883a4ee3a09c15ea334056be0ca7e49989e5e5177847d2c066e4b3514"
        },
        "factoryContextVersion": "1.2.0",
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
        "catalogEntryEvidenceId": "d7020b6df92e644270d1b51397bd4fa09885c97138927afcf2f97884d284ee76"
      },
      {
        "instanceId": "delivery",
        "ownerId": "player-one",
        "moduleId": "delivery.pattern.burst",
        "version": "1.0.0",
        "kind": "attack-delivery",
        "implementationId": "delivery.pattern.burst.v1",
        "configurationSchemaId": "delivery.pattern.burst.config",
        "configuration": {
          "attackChannelId": "player.primary",
          "baseCount": 3,
          "speed": 600,
          "baseDamage": 10,
          "textureRole": "player-projectile",
          "spawnOffset": {
            "x": 0,
            "y": -28
          },
          "maxActive": 16,
          "maximumAcceptedRequestsPerSecond": 10,
          "maximumCountBonus": 1,
          "maximumDamageMultiplier": 2,
          "recycleMargin": 32,
          "exhaustionPolicy": "drop-and-observe",
          "burstSpreadDegrees": 15,
          "emissionIndexMode": "stable-request-sequence"
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "13d4a5ec4707f6d14a59f6993c9e54cec755421678382723ab47051fc41375e4",
        "resources": {
          "activeEntities": 256,
          "activeProjectiles": 256,
          "spawnsPerSecond": 2560,
          "timers": 0
        },
        "resourceGrant": {
          "activeEntities": 16,
          "activeProjectiles": 16,
          "spawnsPerSecond": 40,
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
          "manifestSha256": "13d4a5ec4707f6d14a59f6993c9e54cec755421678382723ab47051fc41375e4",
          "configurationDescriptorSha256": "bdbea1c46ce7334b5e5a479be06ff0a6652a305fed9b4344e1d03d7269a7bad3",
          "reservationDescriptorSha256": "e84395486242aa580d7ea2091dfd08602042601a63121ba47f24850f837238cb",
          "implementationBundleSha256": "e658387ae10c64775b4682e621368c9364d4aff41581168697666655e73b2d33",
          "dependencyLockSha256": "3a62cb4fa8c1835c5496c91fc4b6018ad52d0e2a9f7c6e03b05675f5f973cd0c",
          "toolchainIdentitySha256": "d36c05bbb20980385899dc98650138698cc54f619092b6d415a24983e56552d0",
          "envelopeSha256": "2a56feab9c802c3b412ccd5ee333ac2cff8105602d1baa63cdba5f4f2764f7ec"
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
        "catalogEntryEvidenceId": "e3636b0ca0053eab242120ab3f924125a9b0abe2633b66837d9a2bdb40983c55"
      },
      {
        "instanceId": "detector",
        "ownerId": "enemy-one",
        "moduleId": "interaction.projectile-contact",
        "version": "1.1.0",
        "kind": "combat-interaction",
        "implementationId": "interaction.projectile-contact.v1-1",
        "configurationSchemaId": "interaction.projectile-contact.config",
        "configuration": {
          "sourceEntityRole": "projectile",
          "targetActorRole": "enemy",
          "maximumTrackedContacts": 64
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "a0ef6b9ec62ee0a0024baaa27c1da58a1223fca144a0522f457f048c2bff2c3c",
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
          "manifestSha256": "a0ef6b9ec62ee0a0024baaa27c1da58a1223fca144a0522f457f048c2bff2c3c",
          "configurationDescriptorSha256": "48426de270d5cbf02a8a961a77a90525bddfa11100a260581393becce7c3b31e",
          "reservationDescriptorSha256": "b37389b46ed44dbce09e7dbb2ddf633a1d991a6427731f1c225d4b7c42754fa7",
          "implementationBundleSha256": "a7b7703e206df2501a9a3feb60a815e7051362f046ad35dd6a2b39e8fdde0285",
          "dependencyLockSha256": "3114db68a63f8cc7a5f8d6681980c6d48d25719a43a53f4df02dae977f348f15",
          "toolchainIdentitySha256": "35fe5f84f10587932b8d6b182469ac64fddb54bf4a6b06cd46d970c20ed4ab54",
          "envelopeSha256": "790081f65a1f295c78af5d5489678a675bbb59b5e04ecaa710bdad8851a18bc8"
        },
        "factoryContextVersion": "1.3.0",
        "runtimeContract": {
          "update": {
            "mode": "graph-frame-v1",
            "registrationId": "contact.update"
          },
          "timerSlots": {
            "slotGroupId": "main"
          },
          "inputRegistrations": [],
          "observationReaders": [
            {
              "readerId": "contacts"
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
                  "player",
                  "enemy",
                  "boss"
                ],
                "targetActorRoles": [
                  "player",
                  "enemy",
                  "boss"
                ],
                "sourceEntityRoles": [
                  "projectile"
                ]
              }
            }
          ],
          "outputPorts": [
            {
              "id": "candidate",
              "payloadType": "contact-candidate-v1",
              "delivery": "event"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [],
          "observationReaderIds": [
            "contacts"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": [],
          "overlapRuleId": "projectile.overlap"
        },
        "catalogEntryEvidenceId": "7347c0195e10a7be2b1d703a104824c3dfd641c9a0f426d1e496a41fa73092a0"
      },
      {
        "instanceId": "focus",
        "ownerId": "player-one",
        "moduleId": "intent.focus",
        "version": "1.0.0",
        "kind": "player-intent",
        "implementationId": "intent.focus.v1",
        "configurationSchemaId": "intent.focus.config",
        "configuration": {
          "device": "keyboard",
          "control": "ShiftLeft",
          "initialFocused": false
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "aacb922e96b26e55426cfd454b8bbb54ebe987c894b7a4f362e8092ffebe6792",
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
          "manifestSha256": "aacb922e96b26e55426cfd454b8bbb54ebe987c894b7a4f362e8092ffebe6792",
          "configurationDescriptorSha256": "b4151a58965ec35b2463dc7d11b3d4a1ba48a96e95889856ca30a06003b0f14e",
          "reservationDescriptorSha256": "bb684f2c92d8fef75f30a599bac371807de81d63d040936e472830c3072d39d6",
          "implementationBundleSha256": "aca82a0d51b7a0bb9c2f1b0aee52ddf5bee64c9fb277abceb33398d9b7289847",
          "dependencyLockSha256": "5b498deec049fe835a9f07056297b89515949bc723867821f92110a0ab04db55",
          "toolchainIdentitySha256": "9a149b74eaf8e88bea1c3f4aa0a166ce306dcf155781bdb1a48e5ad05d22e735",
          "envelopeSha256": "95fb5f3bcff3dac4262d9b9054a59f2e303657e445d4f230f1ef3e819d0afa3e"
        },
        "factoryContextVersion": "1.3.0",
        "runtimeContract": {
          "update": null,
          "timerSlots": {
            "slotGroupId": "main"
          },
          "inputRegistrations": [
            {
              "registrationId": "focus.keyboard",
              "kind": "keyboard"
            }
          ],
          "observationReaders": [
            {
              "readerId": "focus"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [],
          "outputPorts": [
            {
              "id": "focus",
              "payloadType": "focus-state-v1",
              "delivery": "state"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [
            "focus.keyboard"
          ],
          "observationReaderIds": [
            "focus"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "23e74a23b5bf7fe53d7ce537dc39ddaeea9b12c0cf8ba0fe5533fba082d20387"
      },
      {
        "instanceId": "focus-speed",
        "ownerId": "player-one",
        "moduleId": "locomotion.focus-speed",
        "version": "1.0.0",
        "kind": "locomotion",
        "implementationId": "locomotion.focus-speed.v1",
        "configurationSchemaId": "locomotion.focus-speed.config",
        "configuration": {
          "multiplier": 0.5,
          "releaseBehavior": "restore"
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "8838f8fe9118c00d243f8d07e01b72fcb1eda0b959a91440930c8f03e975cc20",
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
          "instanceLeases": 3,
          "graphLeases": 0
        },
        "artifactIdentity": {
          "schemaVersion": "1.0.0",
          "algorithm": "sha256",
          "envelopeFormat": "module-registration-envelope-v1",
          "manifestSha256": "8838f8fe9118c00d243f8d07e01b72fcb1eda0b959a91440930c8f03e975cc20",
          "configurationDescriptorSha256": "fb5200ee9a2516b39444b304128e8795afdf6033e8ff6e5c17215c579fc823df",
          "reservationDescriptorSha256": "cb6d1c270296c65cd1dc255f6d8878574369b3d9c6dbc0eefce3f7a00a0184ef",
          "implementationBundleSha256": "20e61c459007c50f75fca426c84cf2cc33f323d940fadc5877b78008e0e32f94",
          "dependencyLockSha256": "5b498deec049fe835a9f07056297b89515949bc723867821f92110a0ab04db55",
          "toolchainIdentitySha256": "9a149b74eaf8e88bea1c3f4aa0a166ce306dcf155781bdb1a48e5ad05d22e735",
          "envelopeSha256": "b3876bcfbeb935e08ad14d31e5f8b404fca9612ac423ba951745db88543b8b80"
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
              "readerId": "scale"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [
            {
              "id": "focus",
              "payloadType": "focus-state-v1",
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
              "id": "scale",
              "payloadType": "movement-scale-v1",
              "delivery": "state"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [],
          "observationReaderIds": [
            "scale"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "28dce4daad405345fb8cca1b45e0b010ea80f43e6de68bb5bca668daf6a5b939"
      },
      {
        "instanceId": "health",
        "ownerId": "enemy-one",
        "moduleId": "combat.health",
        "version": "1.1.0",
        "kind": "combat-interaction",
        "implementationId": "combat.health.v1-1",
        "configurationSchemaId": "combat.health.config",
        "configuration": {
          "maxHealth": 100,
          "initialHealth": 100,
          "damageFloor": 0
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "fa44309ba0be253fd38eb2ddef9a561e51022b9fe0224a83bd2cbd843267b978",
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
          "manifestSha256": "fa44309ba0be253fd38eb2ddef9a561e51022b9fe0224a83bd2cbd843267b978",
          "configurationDescriptorSha256": "093319fcdda8033b14dc680866d669ecbeb2a504965ccb5b8fbda9d22b94ef78",
          "reservationDescriptorSha256": "61db0f8672eb0103417c04d5f8520c88f2767e115cfb49b25c90f20ee3bb9ac4",
          "implementationBundleSha256": "0cb86bf62b96da2f59bec176c24aafa96c2fc99a0320c83ead033ac391c9345b",
          "dependencyLockSha256": "3114db68a63f8cc7a5f8d6681980c6d48d25719a43a53f4df02dae977f348f15",
          "toolchainIdentitySha256": "35fe5f84f10587932b8d6b182469ac64fddb54bf4a6b06cd46d970c20ed4ab54",
          "envelopeSha256": "dd72a85fda2a408eb0f229eb14db6999b9b984b45d16b00df2d676ef3362762e"
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
              "readerId": "health"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [
            {
              "id": "damage",
              "payloadType": "damage-v1",
              "required": true,
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
            },
            {
              "id": "modifier",
              "payloadType": "modifier-application-v1",
              "required": false,
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
            }
          ],
          "outputPorts": [
            {
              "id": "state",
              "payloadType": "health-state-v2",
              "delivery": "state"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [],
          "observationReaderIds": [
            "health"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": [
            "combat.health.current"
          ]
        },
        "catalogEntryEvidenceId": "377f7230f13bc06f4b9ab7d0a0758ba990b0352dea05fddf76936863d3a2bd63"
      },
      {
        "instanceId": "keyboard",
        "ownerId": "player-one",
        "moduleId": "intent.keyboard-movement",
        "version": "1.0.0",
        "kind": "player-intent",
        "implementationId": "intent.keyboard-movement.v1",
        "configurationSchemaId": "intent.keyboard-movement.config",
        "configuration": {
          "bindings": "arrows-and-wasd",
          "normalizeDiagonal": true,
          "emitNeutral": true
        },
        "manifestSchemaVersion": "1.2.0",
        "instantiation": "production-eligible",
        "manifestSha256": "e7e44de719a3683b6d9df4ab640e2381a320948bf374a72f7d4a77214415afb9",
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
          "manifestSha256": "e7e44de719a3683b6d9df4ab640e2381a320948bf374a72f7d4a77214415afb9",
          "configurationDescriptorSha256": "9b015e9b8889308b15831199a276d85e979783081ccc9110ca0a879f143bfc38",
          "reservationDescriptorSha256": "38d096bdc34753c5e32889205da48f25511978a621498733181be8a6dc0c6d1d",
          "implementationBundleSha256": "eb83666306347da2410859d3c907152d91e562e6530403a44f843f88dcd4fd7a",
          "dependencyLockSha256": "e3f942b24b5b515fecc068c475a193034b13a127e1da280cea5b4ad14a03c78a",
          "toolchainIdentitySha256": "3f07da47c80fa46c2d89a7e064cd374ee726cf2c206c08dbfbe35326f9b04356",
          "envelopeSha256": "4a2b9dc74b5c7beb16827b0a2e4c8f84256d5a12fa7de8dd7c54556bc501c11b"
        },
        "factoryContextVersion": "1.2.0",
        "runtimeContract": {
          "update": {
            "mode": "graph-frame-v1",
            "registrationId": "keyboard.update"
          },
          "timerSlots": {
            "slotGroupId": "main"
          },
          "inputRegistrations": [
            {
              "registrationId": "keyboard.direction",
              "kind": "keyboard"
            }
          ],
          "observationReaders": [
            {
              "readerId": "movement"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [],
          "outputPorts": [
            {
              "id": "command",
              "payloadType": "movement-command-v1",
              "delivery": "event"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [
            "keyboard.direction"
          ],
          "observationReaderIds": [
            "movement"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "63839ea8e495dab883c5c83d89808fa34f78ffac04eb44bd78fd12dc58f31d7d"
      },
      {
        "instanceId": "locomotion",
        "ownerId": "player-one",
        "moduleId": "locomotion.bounded",
        "version": "1.1.0",
        "kind": "locomotion",
        "implementationId": "locomotion.bounded.v1-1",
        "configurationSchemaId": "locomotion.bounded.config",
        "configuration": {
          "moveSpeed": 300,
          "bounds": {
            "left": 24,
            "right": 24,
            "top": 24,
            "bottom": 24
          },
          "absoluteMode": "clamp",
          "neutralMode": "zero-velocity"
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "a064dd75d018415059aa4934070bc1ea84009496244742bc9fefccaacf896ccf",
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
          "manifestSha256": "a064dd75d018415059aa4934070bc1ea84009496244742bc9fefccaacf896ccf",
          "configurationDescriptorSha256": "e4725e41c7da63bf4b8d3ca8a1a2c760673c1118f6be73f738f9af2836e7da0d",
          "reservationDescriptorSha256": "9c26433d8dcef54b1fa5cdea3d00c4a4d9a69bfbbed3ce3a37e42b47f8fc1b6f",
          "implementationBundleSha256": "0e2845f8c730f9b32bafca109867b41c912c19d83f71f914c6dcc323f8338921",
          "dependencyLockSha256": "5b498deec049fe835a9f07056297b89515949bc723867821f92110a0ab04db55",
          "toolchainIdentitySha256": "9a149b74eaf8e88bea1c3f4aa0a166ce306dcf155781bdb1a48e5ad05d22e735",
          "envelopeSha256": "4692ccb19733c57887102925be074d83dabcb73a6e990316e9ce9238c543723a"
        },
        "factoryContextVersion": "1.3.0",
        "runtimeContract": {
          "update": {
            "mode": "graph-frame-v1",
            "registrationId": "motion.update"
          },
          "timerSlots": {
            "slotGroupId": "main"
          },
          "inputRegistrations": [],
          "observationReaders": [
            {
              "readerId": "motion"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [
            {
              "id": "command",
              "payloadType": "resolved-movement-command-v1",
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
            },
            {
              "id": "speed-scale",
              "payloadType": "movement-scale-v1",
              "required": false,
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
          "outputPorts": []
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [],
          "observationReaderIds": [
            "motion"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "54570dd840659201eb0e0487d1dc3a7450d95707a7a8be5981f6f5e44dc4dc6b"
      },
      {
        "instanceId": "resolver",
        "ownerId": "enemy-one",
        "moduleId": "interaction.contact-resolution",
        "version": "1.1.0",
        "kind": "combat-interaction",
        "implementationId": "interaction.contact-resolution.v1-1",
        "configurationSchemaId": "interaction.contact-resolution.config",
        "configuration": {
          "policyProfileId": "batch1.default-damage",
          "policyProfileVersion": "1.0.0",
          "allowedDispositions": [
            "damage"
          ],
          "allowedSourceOperations": [
            "consume"
          ],
          "maxResolvedContacts": 64
        },
        "manifestSchemaVersion": "1.3.0",
        "instantiation": "production-eligible",
        "manifestSha256": "fd7874b237bdb82a08b76f25ba4fb575c10d778bcb844a01aa428bc11b1c1d94",
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
          "instanceLeases": 3,
          "graphLeases": 0
        },
        "artifactIdentity": {
          "schemaVersion": "1.0.0",
          "algorithm": "sha256",
          "envelopeFormat": "module-registration-envelope-v1",
          "manifestSha256": "fd7874b237bdb82a08b76f25ba4fb575c10d778bcb844a01aa428bc11b1c1d94",
          "configurationDescriptorSha256": "8dee45e6761b65725a6adc566cc6834f9af91f30b8c8c3fd5d38fb59e5ff7dae",
          "reservationDescriptorSha256": "7cf892a61da8a880ffba09458f29d1af48fed6f003a146745d004027f4dfdc0a",
          "implementationBundleSha256": "6d682a724fe9c695b8ff0901d232517356c9169423f0c0121a7a37800c8a0481",
          "dependencyLockSha256": "3114db68a63f8cc7a5f8d6681980c6d48d25719a43a53f4df02dae977f348f15",
          "toolchainIdentitySha256": "35fe5f84f10587932b8d6b182469ac64fddb54bf4a6b06cd46d970c20ed4ab54",
          "envelopeSha256": "647206a93107cb0295a7d058b5b111cea63716e88b2c00fc50af0b09e113ef57"
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
              "readerId": "resolution"
            }
          ],
          "contactCommit": {
            "commitServiceId": "contact.commit",
            "maximumConcurrentCommits": 4,
            "admittedOperations": [
              "consume"
            ]
          }
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
                  "player",
                  "enemy",
                  "boss"
                ],
                "targetActorRoles": [
                  "player",
                  "enemy",
                  "boss"
                ],
                "sourceEntityRoles": [
                  "projectile"
                ]
              }
            },
            {
              "id": "candidate",
              "payloadType": "contact-candidate-v1",
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
            }
          ],
          "outputPorts": [
            {
              "id": "hit",
              "payloadType": "hit-v1",
              "delivery": "event"
            },
            {
              "id": "damage",
              "payloadType": "damage-v1",
              "delivery": "event"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [],
          "observationReaderIds": [
            "resolution"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "22b05da6a479e9d03a5c7130820dd69d5892bf76a84c6530715137f3c0b43c78"
      },
      {
        "instanceId": "targeting",
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
        "instanceId": "touch",
        "ownerId": "player-one",
        "moduleId": "intent.touch-drag",
        "version": "1.0.0",
        "kind": "player-intent",
        "implementationId": "intent.touch-drag.v1",
        "configurationSchemaId": "intent.touch-drag.config",
        "configuration": {
          "capture": "first-active",
          "release": "matching-pointer-up",
          "emitOnDown": false
        },
        "manifestSchemaVersion": "1.2.0",
        "instantiation": "production-eligible",
        "manifestSha256": "f18da1c54d0964e2b442d53c54c21560cbe820a7687cefd23c334038b2e4f2e9",
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
          "manifestSha256": "f18da1c54d0964e2b442d53c54c21560cbe820a7687cefd23c334038b2e4f2e9",
          "configurationDescriptorSha256": "8884fbaace9900b8cce6b689e3fc433524be19ded3d22f20caa930b5846d05b1",
          "reservationDescriptorSha256": "c5005923973583d38c4cec38d2578c3a33856fe3f1ebb6b2614a4be9922b84ee",
          "implementationBundleSha256": "aa5102bd10a4d35b822eb8505de712d493f496f1de72a9edf481ce334633e12f",
          "dependencyLockSha256": "e3f942b24b5b515fecc068c475a193034b13a127e1da280cea5b4ad14a03c78a",
          "toolchainIdentitySha256": "3f07da47c80fa46c2d89a7e064cd374ee726cf2c206c08dbfbe35326f9b04356",
          "envelopeSha256": "6b0f163881d2b3ffce945bacd5499eba9b85ea046021749b234b8256ec44cf90"
        },
        "factoryContextVersion": "1.2.0",
        "runtimeContract": {
          "update": null,
          "timerSlots": {
            "slotGroupId": "main"
          },
          "inputRegistrations": [
            {
              "registrationId": "pointer.down",
              "kind": "pointer-down"
            },
            {
              "registrationId": "pointer.move",
              "kind": "pointer-move"
            },
            {
              "registrationId": "pointer.up",
              "kind": "pointer-up"
            }
          ],
          "observationReaders": [
            {
              "readerId": "movement"
            }
          ],
          "contactCommit": null
        },
        "runtimePorts": {
          "inputPorts": [],
          "outputPorts": [
            {
              "id": "command",
              "payloadType": "movement-command-v1",
              "delivery": "event"
            }
          ]
        },
        "runtimeAuthorities": {
          "inputRegistrationIds": [
            "pointer.down",
            "pointer.move",
            "pointer.up"
          ],
          "observationReaderIds": [
            "movement"
          ],
          "ownedChannelIds": [],
          "ownsPlayerLocomotion": false,
          "modifierTargetFieldIds": []
        },
        "catalogEntryEvidenceId": "4cdbcb36531f8cf15ada2f1263d5e96cc4e80b3c4ed2bcf27dbfae98c03a4faa"
      },
      {
        "instanceId": "trigger",
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
        "from": "arbiter",
        "to": "keyboard",
        "capabilityId": "intent.movement-source",
        "scope": "owner"
      },
      {
        "from": "arbiter",
        "to": "touch",
        "capabilityId": "intent.movement-source",
        "scope": "owner"
      },
      {
        "from": "delivery",
        "to": "targeting",
        "capabilityId": "targeting.solution-v2",
        "scope": "owner"
      },
      {
        "from": "delivery",
        "to": "trigger",
        "capabilityId": "trigger.attack-v2",
        "scope": "owner"
      },
      {
        "from": "detector",
        "to": "delivery",
        "capabilityId": "delivery.projectile-channel",
        "scope": "assembly"
      },
      {
        "from": "focus-speed",
        "to": "focus",
        "capabilityId": "intent.focus-source",
        "scope": "owner"
      },
      {
        "from": "locomotion",
        "to": "arbiter",
        "capabilityId": "intent.movement-resolved",
        "scope": "owner"
      },
      {
        "from": "resolver",
        "to": "detector",
        "capabilityId": "interaction.projectile-contact-candidate",
        "scope": "owner"
      },
      {
        "from": "resolver",
        "to": "health",
        "capabilityId": "combat.damage-sink",
        "scope": "owner"
      },
      {
        "from": "targeting",
        "to": "aim",
        "capabilityId": "intent.aim-source",
        "scope": "owner"
      },
      {
        "from": "trigger",
        "to": "attack-intent",
        "capabilityId": "intent.attack-source",
        "scope": "owner"
      }
    ],
    "bindings": [
      {
        "from": {
          "instanceId": "aim",
          "portId": "aim"
        },
        "to": {
          "instanceId": "targeting",
          "portId": "aim"
        },
        "payloadType": "aim-command-v1",
        "delivery": "state"
      },
      {
        "from": {
          "instanceId": "arbiter",
          "portId": "resolved"
        },
        "to": {
          "instanceId": "locomotion",
          "portId": "command"
        },
        "payloadType": "resolved-movement-command-v1",
        "delivery": "event"
      },
      {
        "from": {
          "instanceId": "attack-intent",
          "portId": "intent"
        },
        "to": {
          "instanceId": "trigger",
          "portId": "intent"
        },
        "payloadType": "attack-intent-v1",
        "delivery": "event"
      },
      {
        "from": {
          "instanceId": "delivery",
          "portId": "projectiles"
        },
        "to": {
          "instanceId": "detector",
          "portId": "sources"
        },
        "payloadType": "entity-channel-v1",
        "delivery": "state"
      },
      {
        "from": {
          "instanceId": "delivery",
          "portId": "projectiles"
        },
        "to": {
          "instanceId": "resolver",
          "portId": "sources"
        },
        "payloadType": "entity-channel-v1",
        "delivery": "state"
      },
      {
        "from": {
          "instanceId": "detector",
          "portId": "candidate"
        },
        "to": {
          "instanceId": "resolver",
          "portId": "candidate"
        },
        "payloadType": "contact-candidate-v1",
        "delivery": "event"
      },
      {
        "from": {
          "instanceId": "focus",
          "portId": "focus"
        },
        "to": {
          "instanceId": "focus-speed",
          "portId": "focus"
        },
        "payloadType": "focus-state-v1",
        "delivery": "state"
      },
      {
        "from": {
          "instanceId": "focus-speed",
          "portId": "scale"
        },
        "to": {
          "instanceId": "locomotion",
          "portId": "speed-scale"
        },
        "payloadType": "movement-scale-v1",
        "delivery": "state"
      },
      {
        "from": {
          "instanceId": "keyboard",
          "portId": "command"
        },
        "to": {
          "instanceId": "arbiter",
          "portId": "commands"
        },
        "payloadType": "movement-command-v1",
        "delivery": "event"
      },
      {
        "from": {
          "instanceId": "resolver",
          "portId": "damage"
        },
        "to": {
          "instanceId": "health",
          "portId": "damage"
        },
        "payloadType": "damage-v1",
        "delivery": "event"
      },
      {
        "from": {
          "instanceId": "targeting",
          "portId": "selection"
        },
        "to": {
          "instanceId": "delivery",
          "portId": "target"
        },
        "payloadType": "target-solution-v1",
        "delivery": "state"
      },
      {
        "from": {
          "instanceId": "touch",
          "portId": "command"
        },
        "to": {
          "instanceId": "arbiter",
          "portId": "commands"
        },
        "payloadType": "movement-command-v1",
        "delivery": "event"
      },
      {
        "from": {
          "instanceId": "trigger",
          "portId": "request"
        },
        "to": {
          "instanceId": "delivery",
          "portId": "request"
        },
        "payloadType": "attack-request-v2",
        "delivery": "event"
      }
    ],
    "constructionOrder": [
      "aim",
      "keyboard",
      "touch",
      "arbiter",
      "attack-intent",
      "default-policy",
      "targeting",
      "trigger",
      "delivery",
      "detector",
      "focus",
      "focus-speed",
      "health",
      "locomotion",
      "resolver"
    ],
    "assetBindings": [
      {
        "bindingId": "player-projectile",
        "roleId": "player-projectile",
        "category": "projectile",
        "runtimeSha256": "2222222222222222222222222222222222222222222222222222222222222222",
        "textureKey": "module/2222222222222222222222222222222222222222222222222222222222222222/player-projectile",
        "sharing": "instance",
        "consumerInstanceIds": [
          "delivery"
        ]
      }
    ],
    "contactPolicyProfiles": [
      {
        "consumerInstanceId": "resolver",
        "profileId": "batch1.default-damage",
        "version": "1.0.0",
        "evidenceHash": "fe907b71f1b56c3f1e75b13008376413fe41eb5e50d760f76707bb174dd9b818",
        "supportedChainEvidenceId": "batch1.default-damage.chain",
        "orderedPolicyInstanceIds": [
          "default-policy"
        ],
        "orderedPolicyArtifactHashes": [
          "435387a883a4ee3a09c15ea334056be0ca7e49989e5e5177847d2c066e4b3514"
        ]
      }
    ],
    "damageSinkRoutes": [
      {
        "ownerId": "enemy-one",
        "headInstanceId": "health",
        "orderedSinkInstanceIds": [
          "health"
        ],
        "terminalHealthInstanceId": "health",
        "producerInstanceIds": [
          "resolver"
        ]
      }
    ],
    "entityChannels": [
      {
        "channelId": "delivery.projectiles",
        "localChannelId": "projectiles",
        "ownerInstanceId": "delivery",
        "ownerActorId": "player-one",
        "outputPort": "projectiles",
        "entityRole": "projectile",
        "capacity": 16,
        "capacityResources": [
          "activeEntities",
          "activeProjectiles"
        ],
        "readerInstanceIds": [
          "detector",
          "resolver"
        ],
        "sourceArtifactEnvelopeSha256": "2a56feab9c802c3b412ccd5ee333ac2cff8105602d1baa63cdba5f4f2764f7ec"
      }
    ],
    "entityMutationGrants": [
      {
        "grantId": "resolver.projectile.consume",
        "accessId": "projectile.consume",
        "granteeInstanceId": "resolver",
        "channelId": "delivery.projectiles",
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
        "targetingInstanceId": "targeting",
        "triggerInstanceId": "trigger",
        "deliveryInstanceId": "delivery",
        "targetBinding": {
          "from": {
            "instanceId": "targeting",
            "portId": "selection"
          },
          "to": {
            "instanceId": "delivery",
            "portId": "target"
          },
          "payloadType": "target-solution-v1",
          "delivery": "state"
        },
        "requestBinding": {
          "from": {
            "instanceId": "trigger",
            "portId": "request"
          },
          "to": {
            "instanceId": "delivery",
            "portId": "request"
          },
          "payloadType": "attack-request-v2",
          "delivery": "event"
        }
      }
    ],
    "projectileChannelLineages": [
      {
        "lineageId": "detector/projectile-lineage/delivery.projectiles",
        "providerInstanceId": "delivery",
        "providerCapabilityId": "delivery.projectile-channel",
        "sourceBinding": {
          "from": {
            "instanceId": "delivery",
            "portId": "projectiles"
          },
          "to": {
            "instanceId": "detector",
            "portId": "sources"
          },
          "payloadType": "entity-channel-v1",
          "delivery": "state"
        },
        "channelId": "delivery.projectiles",
        "channelOutputPort": "projectiles",
        "consumerInstanceId": "detector",
        "consumerInputPort": "sources"
      }
    ],
    "effectApplicationRoutes": [],
    "pickupEffectPlans": [],
    "projectileBudgetContention": {
      "budget": {
        "activeProjectiles": 16,
        "spawnsPerSecond": 40
      },
      "totals": {
        "activeProjectiles": 16,
        "spawnsPerSecond": 40
      },
      "orderedOwners": [
        {
          "resolvedOrder": 8,
          "instanceId": "delivery",
          "ownerActorId": "player-one",
          "attackChannelId": "player.primary",
          "channelId": "delivery.projectiles",
          "poolId": "delivery.projectiles.pool",
          "activeProjectiles": 16,
          "spawnsPerSecond": 40,
          "cumulativeActiveProjectiles": 16,
          "cumulativeSpawnsPerSecond": 40
        }
      ]
    },
    "resourceTotals": {
      "activeEntities": 16,
      "activeProjectiles": 16,
      "spawnsPerSecond": 40,
      "timers": 0
    }
  }
] as unknown as readonly ResolvedModuleGraphV13[];

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

export const batch2FormationRuntimeCatalogs = batch2FormationGraphs.map((graph) => new BrowserGameModuleRuntimeCatalogV13({ catalogEvidenceId: graph.catalogEvidenceId, entries }));
