// @ts-nocheck -- generated from loader-admitted self-contained JavaScript bytes
import { BrowserGameModuleRuntimeCatalogV12 } from "../../../../src/modules/game-module-runtime-catalog.js";
import type { ResolvedModuleGraphV12 } from "../../../../src/modules/game-module-resolver.js";

function batch1Executable0(context) {
    const config=context.configuration; let keyboard; let touch; let sequence=0;
    const emit=(command,reason)=>context.ports.emitEvent("resolved",Object.freeze({...command,sequence:sequence++,emittedAtMs:context.clock.nowMs(),selectedSourceId:command.sourceId,arbitrationReason:reason}));
    context.ports.declareHandler("commands",command=>{ if(command.sourceId===config.keyboardSourceId)keyboard=command; else if(command.sourceId===config.touchSourceId)touch=command; else throw new Error("undeclared movement source"); if(touch?.active)emit(touch,"touch-active"); else if(command.sourceId===config.touchSourceId&&keyboard)emit(keyboard,"touch-released"); else if(command.sourceId===config.keyboardSourceId)emit(keyboard,"keyboard"); });
    return Object.freeze({instanceId:context.identity.instanceId,initialize(){context.services.observation.register("arbitration",()=>({sequence,keyboardActive:keyboard?.active??false,touchActive:touch?.active??false}));},stop(){},dispose(){keyboard=undefined;touch=undefined;}});
  }

function batch1Executable1(decision){return Object.freeze({...decision,disposition:"damage",sourceOperation:"consume",damage:decision.metadata.damage});}

function batch1Executable2(context){const config=context.configuration;let target;let generation=0;let sequence=0;let dropped=0;const active=[];context.ports.declareHandler("target",value=>{target=value;});context.ports.declareHandler("attack",request=>{if(!target)throw new Error("attack before target");if(active.length>=config.maxActive){dropped++;return;}const owner=context.services.actors.readOwner();if(!owner||owner.active!==true)throw new Error("inactive projectile owner");const id="projectile-"+(++generation);const position=Object.freeze({x:owner.position.x+config.spawnOffset.x,y:owner.position.y+config.spawnOffset.y});const velocity=Object.freeze({x:target.direction.x*config.speed,y:target.direction.y*config.speed});const entity=Object.freeze({entityId:id,generation,position,velocity,damage:config.damage,textureKey:context.assets.requireTexture(config.textureRole)});const reference=context.services.channels.activate("projectiles",entity);active.push(reference);context.ports.emitEvent("emission",Object.freeze({sequence:sequence++,emittedAtMs:context.clock.nowMs(),entityId:id,channelId:context.identity.instanceId+".projectiles",ownerActorId:context.identity.ownerId,position,velocity,damage:config.damage,generation}));});return Object.freeze({instanceId:context.identity.instanceId,initialize(){context.assets.requireTexture(config.textureRole);context.ports.publishState("projectiles",Object.freeze({revision:0,emittedAtMs:context.clock.nowMs(),channelId:context.identity.instanceId+".projectiles",ownerInstanceId:context.identity.instanceId,ownerActorId:context.identity.ownerId,entityRole:"projectile",generation:0}));context.services.observation.register("delivery",()=>({generation,active:active.length,dropped,emissions:sequence}));},update(){},stop(){active.splice(0);},dispose(){active.splice(0);}});}

function batch1Executable3(context){const config=context.configuration;let channel;let sequence=0;let remove;const seen=new Set();context.ports.declareHandler("sources",value=>{channel=value;});return Object.freeze({instanceId:context.identity.instanceId,initialize(){context.services.observation.register("contacts",()=>({sequence,tracked:seen.size}));},start(){remove=context.services.overlaps.register("projectile.overlap",raw=>{if(!channel)throw new Error("overlap before channel");const key=raw.sourceEntityId+":"+raw.sourceGeneration+":"+context.identity.ownerId;if(seen.has(key))return;if(seen.size>=config.maximumTrackedContacts)throw new Error("contact ledger exhausted");seen.add(key);const contactSequence=sequence++;context.ports.emitEvent("candidate",Object.freeze({sequence:contactSequence,emittedAtMs:context.clock.nowMs(),contactId:"contact."+contactSequence,sourceChannelId:channel.channelId,sourceEntityId:raw.sourceEntityId,sourceGeneration:raw.sourceGeneration,sourceActorId:channel.ownerActorId,targetActorId:context.identity.ownerId,contactSequence,metadata:Object.freeze({damage:raw.damage,damageKind:"projectile"})}));});},update(){},stop(){remove?.();remove=undefined;seen.clear();},dispose(){remove?.();remove=undefined;seen.clear();}});}

function batch1Executable4(context){const config=context.configuration;let current=config.initialHealth;let revision=0;const seen=new Set();const publish=(delta,reason)=>context.ports.publishState("state",Object.freeze({revision:revision++,emittedAtMs:context.clock.nowMs(),actorId:context.identity.ownerId,current,maximum:config.maxHealth,delta,reason}));context.ports.declareHandler("damage",damage=>{if(damage.targetActorId!==context.identity.ownerId)throw new Error("damage target mismatch");const key=damage.sourceActorId+":"+damage.contactSequence;if(seen.has(key))throw new Error("duplicate damage");seen.add(key);const before=current;current=Math.max(config.damageFloor,current-damage.amount);publish(current-before,current===0?"depleted":"damaged");});return Object.freeze({instanceId:context.identity.instanceId,initialize(){publish(0,"initialized");context.services.observation.register("health",()=>({current,maximum:config.maxHealth,revision}));},dispose(){seen.clear();}});}

function batch1Executable5(context) {
    let direction = Object.freeze({x:0,y:0}); let sequence = 0; let remove; let disposed = false;
    context.ports.declareHandler;
    return Object.freeze({instanceId:context.identity.instanceId,
      initialize(){ context.services.observation.register("movement",()=>({sequence,direction})); },
      start(){ remove=context.services.input.register("keyboard.direction", value=>{ if(!value||!Number.isFinite(value.x)||!Number.isFinite(value.y)) throw new Error("invalid keyboard direction"); const length=Math.hypot(value.x,value.y); direction=Object.freeze(length===0?{x:0,y:0}:{x:value.x/length,y:value.y/length}); }); },
      update(){ if(disposed) throw new Error("keyboard disposed"); const active=direction.x!==0||direction.y!==0; context.ports.emitEvent("command",Object.freeze({sequence:sequence++,emittedAtMs:context.clock.nowMs(),sourceId:context.identity.instanceId,active,command:Object.freeze({kind:"velocity-direction",direction})})); },
      stop(){ remove?.(); remove=undefined; }, dispose(){ disposed=true; remove?.(); remove=undefined; }
    });
  }

function batch1Executable6(context) {
    const config=context.configuration; let command; let owner;
    context.ports.declareHandler("command",value=>{command=value;});
    return Object.freeze({instanceId:context.identity.instanceId,
      initialize(){ owner=context.services.actors.readOwner(); if(!owner||owner.active!==true)throw new Error("inactive owner actor"); context.services.observation.register("motion",()=>({commandKind:command?.command?.kind??null})); },
      start(){},
      update(){ if(!command)return; if(command.command.kind==="velocity-direction"){const d=command.command.direction;context.services.actors.writeOwnerMotion(Object.freeze({x:command.active?d.x*config.moveSpeed:0,y:command.active?d.y*config.moveSpeed:0}));}else{const viewport=context.services.viewport.read();const b=config.bounds;context.services.actors.writeOwnerPosition(Object.freeze({x:Math.min(viewport.width-b.right,Math.max(b.left,command.command.position.x)),y:Math.min(viewport.height-b.bottom,Math.max(b.top,command.command.position.y))}));context.services.actors.writeOwnerMotion(Object.freeze({x:0,y:0}));} },
      stop(){},dispose(){command=undefined;owner=undefined;}
    });
  }

function batch1Executable7(context){let resolved=0;context.ports.declareHandler("sources",()=>{});context.ports.declareHandler("candidate",candidate=>{if(resolved>=context.configuration.maxResolvedContacts)throw new Error("resolved contact ceiling exceeded");const decision=context.services.contact.executePolicy(candidate);const prepared=context.services.contact.prepareCommit(candidate,decision,Object.freeze({hit(evidenceId){context.ports.emitEvent("hit",Object.freeze({sequence:evidenceId,emittedAtMs:context.clock.nowMs(),sourceEntityId:candidate.sourceEntityId,targetActorId:candidate.targetActorId,contactSequence:candidate.contactSequence,consumed:true}));},damage(evidenceId){context.ports.emitEvent("damage",Object.freeze({sequence:evidenceId,emittedAtMs:context.clock.nowMs(),sourceActorId:candidate.sourceActorId,targetActorId:candidate.targetActorId,amount:decision.damage,damageKind:decision.metadata.damageKind,contactSequence:candidate.contactSequence}));}}));prepared.commit();resolved++;});return Object.freeze({instanceId:context.identity.instanceId,initialize(){context.services.observation.register("resolution",()=>({resolved}));},dispose(){resolved=0;}});}

function batch1Executable8(context){const selection=Object.freeze({revision:0,emittedAtMs:0,kind:"direction",direction:Object.freeze({x:0,y:-1})});return Object.freeze({instanceId:context.identity.instanceId,initialize(){context.ports.publishState("selection",Object.freeze({...selection,emittedAtMs:context.clock.nowMs()}));context.services.observation.register("target",()=>selection);}});}

function batch1Executable9(context) {
    let captured; let sequence=0; let removers=[];
    const emit=(active,pointer,reason)=>context.ports.emitEvent("command",Object.freeze({sequence:sequence++,emittedAtMs:context.clock.nowMs(),sourceId:context.identity.instanceId,active,command:Object.freeze({kind:"absolute-position",position:Object.freeze({x:pointer.worldX,y:pointer.worldY}),pointerId:pointer.id})}));
    return Object.freeze({instanceId:context.identity.instanceId,
      initialize(){ context.services.observation.register("movement",()=>({sequence,capturedPointerId:captured??null})); },
      start(){ removers=[context.services.input.register("pointer.down",p=>{if(captured===undefined&&p&&p.isDown===true)captured=p.id;}),context.services.input.register("pointer.move",p=>{if(p&&p.id===captured&&p.isDown===true)emit(true,p);}),context.services.input.register("pointer.up",p=>{if(p&&p.id===captured){emit(false,p);captured=undefined;}})]; },
      stop(){ for(const remove of removers)remove(); removers=[]; captured=undefined; }, dispose(){ for(const remove of removers)remove(); removers=[]; captured=undefined; }
    });
  }

function batch1Executable10(context){let sequence=0;let timer;return Object.freeze({instanceId:context.identity.instanceId,initialize(){context.services.observation.register("trigger",()=>({sequence,timerActive:timer?.active??false}));},start(){timer=context.clock.schedule(Object.freeze({mode:"interval",initialDelayMs:context.configuration.intervalMs,intervalMs:context.configuration.intervalMs,callback(){context.ports.emitEvent("request",Object.freeze({sequence:sequence++,emittedAtMs:context.clock.nowMs(),requestedAtMs:context.clock.nowMs(),channel:"primary"}));}}));},stop(){timer?.cancel();timer=undefined;},dispose(){timer?.cancel();timer=undefined;}});}

export const batch1ResolvedGraph = {
  "graphVersion": "1.2.0",
  "assemblyId": "batch1.vertical-slice",
  "kernelVersion": "1.0.0",
  "engine": {
    "id": "phaser",
    "version": "3.90.0"
  },
  "executionReadiness": {
    "status": "ready",
    "evidenceId": "a0582da1e92ea4be832c20a03d5e63a75ecf932b8cf7574355207719ec5f16e5"
  },
  "catalogEvidenceId": "d930de4f6f1ace5334e1a999adb8070f216245f2c924369f3f86426db469761b",
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
        "ownsPlayerLocomotion": false
      },
      "catalogEntryEvidenceId": "5fdbbd0d1b1839e5102fde613746fea0b4aa47ee2db298cfd06e5edee1acce77"
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
        "ownsPlayerLocomotion": false
      },
      "catalogEntryEvidenceId": "09a0eac18392d54853da4987dcd821ec5953ed6e10adf19d4a484dc606b11be0"
    },
    {
      "instanceId": "delivery",
      "ownerId": "player-one",
      "moduleId": "delivery.projectile",
      "version": "1.0.0",
      "kind": "attack-delivery",
      "implementationId": "delivery.projectile.v1",
      "configurationSchemaId": "delivery.projectile.config",
      "configuration": {
        "speed": 600,
        "damage": 10,
        "textureRole": "player-projectile",
        "spawnOffset": {
          "x": 0,
          "y": -28
        },
        "maxActive": 16,
        "maximumSpawnRate": 12,
        "recycleMargin": 32,
        "poolExhaustion": "drop-and-observe"
      },
      "manifestSchemaVersion": "1.2.0",
      "instantiation": "production-eligible",
      "manifestSha256": "88b796de5033dc4d004fa73493285e44dfbe8613ed3b12c22501579fe66d11c6",
      "resources": {
        "activeEntities": 256,
        "activeProjectiles": 256,
        "spawnsPerSecond": 20,
        "timers": 0
      },
      "resourceGrant": {
        "activeEntities": 16,
        "activeProjectiles": 16,
        "spawnsPerSecond": 12,
        "timers": 0
      },
      "runtimeLeaseCeilings": {
        "startLeases": 3,
        "instanceLeases": 4,
        "graphLeases": 0
      },
      "artifactIdentity": {
        "schemaVersion": "1.0.0",
        "algorithm": "sha256",
        "envelopeFormat": "module-registration-envelope-v1",
        "manifestSha256": "88b796de5033dc4d004fa73493285e44dfbe8613ed3b12c22501579fe66d11c6",
        "configurationDescriptorSha256": "228763115226ac4e903b8ae40d675c7acfee901b0224c5dc2eec59f191f2ef4f",
        "reservationDescriptorSha256": "a26c8232fe411d95cbd8dccbd4846006967546f9640ec83c7114fa860cef327d",
        "implementationBundleSha256": "e04ea31b638c73bc891234e738cad52a15cdabf43d1b9bd60ca6484d99d07483",
        "dependencyLockSha256": "e3f942b24b5b515fecc068c475a193034b13a127e1da280cea5b4ad14a03c78a",
        "toolchainIdentitySha256": "3f07da47c80fa46c2d89a7e064cd374ee726cf2c206c08dbfbe35326f9b04356",
        "envelopeSha256": "3d229eb9a076c4ffaa3c1df9ecd3644406f64b2937ed215d2d8d0e15add8c689"
      },
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
            "payloadType": "target-selection-v1",
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
          },
          {
            "id": "attack",
            "payloadType": "attack-request-v1",
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
            "id": "projectiles",
            "payloadType": "entity-channel-v1",
            "delivery": "state",
            "entityRole": "projectile"
          },
          {
            "id": "emission",
            "payloadType": "emission-v1",
            "delivery": "event"
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
        "ownsPlayerLocomotion": false
      },
      "catalogEntryEvidenceId": "3cb77d247e3c9796a61319319007ad28c5beabe9091ab7bba6f63cc5dccbc27a"
    },
    {
      "instanceId": "detector",
      "ownerId": "enemy-one",
      "moduleId": "interaction.projectile-contact",
      "version": "1.0.0",
      "kind": "combat-interaction",
      "implementationId": "interaction.projectile-contact.v1",
      "configurationSchemaId": "interaction.projectile-contact.config",
      "configuration": {
        "sourceEntityRole": "projectile",
        "targetActorRole": "enemy",
        "maximumTrackedContacts": 64
      },
      "manifestSchemaVersion": "1.2.0",
      "instantiation": "production-eligible",
      "manifestSha256": "81fc5b7c46e7a060abd0b51b3b151547dde26c93ddaef77a8d9ad5644cbebbc3",
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
        "manifestSha256": "81fc5b7c46e7a060abd0b51b3b151547dde26c93ddaef77a8d9ad5644cbebbc3",
        "configurationDescriptorSha256": "48426de270d5cbf02a8a961a77a90525bddfa11100a260581393becce7c3b31e",
        "reservationDescriptorSha256": "117dee5c9f4c6ea738d185267257388c992a5eba72913e20a789ef6baed9dc32",
        "implementationBundleSha256": "5238f2bc9c1ecec6f34c5fbe14f09082c1fe6ce3fefccb56f776768c95af43ab",
        "dependencyLockSha256": "e3f942b24b5b515fecc068c475a193034b13a127e1da280cea5b4ad14a03c78a",
        "toolchainIdentitySha256": "3f07da47c80fa46c2d89a7e064cd374ee726cf2c206c08dbfbe35326f9b04356",
        "envelopeSha256": "c293b9337f882984472e89ad9a1e37d323ba6afc7fa9bd037121d746085b14f9"
      },
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
                "player"
              ],
              "targetActorRoles": [
                "enemy"
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
        "overlapRuleId": "projectile.overlap"
      },
      "catalogEntryEvidenceId": "a1ea42599e1706ac4087770209ecca282d7ab9317170df80201607123795e649"
    },
    {
      "instanceId": "health",
      "ownerId": "enemy-one",
      "moduleId": "combat.health",
      "version": "1.0.0",
      "kind": "combat-interaction",
      "implementationId": "combat.health.v1",
      "configurationSchemaId": "combat.health.config",
      "configuration": {
        "maxHealth": 100,
        "initialHealth": 100,
        "damageFloor": 0
      },
      "manifestSchemaVersion": "1.2.0",
      "instantiation": "production-eligible",
      "manifestSha256": "f0dfa5250cf8e686433e6409d542ce8698a67126a24507c71b63e73208ca5a94",
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
        "manifestSha256": "f0dfa5250cf8e686433e6409d542ce8698a67126a24507c71b63e73208ca5a94",
        "configurationDescriptorSha256": "093319fcdda8033b14dc680866d669ecbeb2a504965ccb5b8fbda9d22b94ef78",
        "reservationDescriptorSha256": "29dedbaf2626b345c11a921d98b7f44ba310e9f9e8f24a737d215dd83c60842e",
        "implementationBundleSha256": "115537a16fbe6c0e0fcab4de7d8755d6409cb9a4ffd60741731bb374c8c7af32",
        "dependencyLockSha256": "e3f942b24b5b515fecc068c475a193034b13a127e1da280cea5b4ad14a03c78a",
        "toolchainIdentitySha256": "3f07da47c80fa46c2d89a7e064cd374ee726cf2c206c08dbfbe35326f9b04356",
        "envelopeSha256": "6a859e6ee2a20515041d437a24355063ff79f0236e48ffdc9f6bcd66e6d76c9f"
      },
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
                "enemy"
              ],
              "targetActorRoles": [
                "enemy"
              ],
              "sourceEntityRoles": []
            }
          }
        ],
        "outputPorts": [
          {
            "id": "state",
            "payloadType": "health-state-v1",
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
        "ownsPlayerLocomotion": false
      },
      "catalogEntryEvidenceId": "86f55a1494569080e0b22bb726dec081b28fdf444a35c5210c361ac0b6a5683d"
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
        "ownsPlayerLocomotion": false
      },
      "catalogEntryEvidenceId": "27eb814dd5a19af2df497cfef15a2386e529a7171d5b32be72e768d96915357a"
    },
    {
      "instanceId": "locomotion",
      "ownerId": "player-one",
      "moduleId": "locomotion.bounded",
      "version": "1.0.0",
      "kind": "locomotion",
      "implementationId": "locomotion.bounded.v1",
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
      "manifestSchemaVersion": "1.2.0",
      "instantiation": "production-eligible",
      "manifestSha256": "6d30644da94ab80ab3c89d564cbbfe31d47cd1925f879701392c9def2057185f",
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
        "manifestSha256": "6d30644da94ab80ab3c89d564cbbfe31d47cd1925f879701392c9def2057185f",
        "configurationDescriptorSha256": "e4725e41c7da63bf4b8d3ca8a1a2c760673c1118f6be73f738f9af2836e7da0d",
        "reservationDescriptorSha256": "9553c7419c206d1cceb398c06065f44ca58f831928388a50a84dd5f6e6a3f983",
        "implementationBundleSha256": "22b1bb8f9a649cdc558f62d0aa45b162ba97281254bdd7f73d53e6f01ea68afb",
        "dependencyLockSha256": "e3f942b24b5b515fecc068c475a193034b13a127e1da280cea5b4ad14a03c78a",
        "toolchainIdentitySha256": "3f07da47c80fa46c2d89a7e064cd374ee726cf2c206c08dbfbe35326f9b04356",
        "envelopeSha256": "c26b611eea98fdcd25b65e934e866b864d1ad8668ee3b5241d71117df8301302"
      },
      "runtimeContract": {
        "update": {
          "mode": "graph-frame-v1",
          "registrationId": "locomotion.update"
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
        "ownsPlayerLocomotion": true
      },
      "catalogEntryEvidenceId": "76636a8739e2eb27ec721c456b9c5e476b4317efe9ea4e87f52c67193a5c6b11"
    },
    {
      "instanceId": "resolver",
      "ownerId": "enemy-one",
      "moduleId": "interaction.contact-resolution",
      "version": "1.0.0",
      "kind": "combat-interaction",
      "implementationId": "interaction.contact-resolution.v1",
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
      "manifestSchemaVersion": "1.2.0",
      "instantiation": "production-eligible",
      "manifestSha256": "e948bcaa4e783d847638da3f6d3ed9cf08adf2edefa4f7d9f439db6c880eac4c",
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
        "manifestSha256": "e948bcaa4e783d847638da3f6d3ed9cf08adf2edefa4f7d9f439db6c880eac4c",
        "configurationDescriptorSha256": "8dee45e6761b65725a6adc566cc6834f9af91f30b8c8c3fd5d38fb59e5ff7dae",
        "reservationDescriptorSha256": "4dd1df3731a4fe6c608dfcda42a85902e8bbf019705febd73781ea1864441303",
        "implementationBundleSha256": "6d682a724fe9c695b8ff0901d232517356c9169423f0c0121a7a37800c8a0481",
        "dependencyLockSha256": "e3f942b24b5b515fecc068c475a193034b13a127e1da280cea5b4ad14a03c78a",
        "toolchainIdentitySha256": "3f07da47c80fa46c2d89a7e064cd374ee726cf2c206c08dbfbe35326f9b04356",
        "envelopeSha256": "15c592050626a7a832be4ea2d0272da70a778413164ff69c4bf5942758eaef3e"
      },
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
                "player"
              ],
              "targetActorRoles": [
                "enemy"
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
                "enemy"
              ],
              "targetActorRoles": [
                "enemy"
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
        "ownsPlayerLocomotion": false
      },
      "catalogEntryEvidenceId": "327753845d2ef35100cfbcc67488663f17cabfbaec8cbfe40638cc0cdb81509f"
    },
    {
      "instanceId": "targeting",
      "ownerId": "player-one",
      "moduleId": "targeting.fixed-forward",
      "version": "1.0.0",
      "kind": "targeting",
      "implementationId": "targeting.fixed-forward.v1",
      "configurationSchemaId": "targeting.fixed-forward.config",
      "configuration": {
        "angleDegrees": -90
      },
      "manifestSchemaVersion": "1.2.0",
      "instantiation": "production-eligible",
      "manifestSha256": "a62c30c37e5db011153174a2a69e7f40edba811b1337f63155bdabd6bacbdf67",
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
        "instanceLeases": 2,
        "graphLeases": 0
      },
      "artifactIdentity": {
        "schemaVersion": "1.0.0",
        "algorithm": "sha256",
        "envelopeFormat": "module-registration-envelope-v1",
        "manifestSha256": "a62c30c37e5db011153174a2a69e7f40edba811b1337f63155bdabd6bacbdf67",
        "configurationDescriptorSha256": "cdf52dd01886d1f2635dea51b66848df4a74eb386fffc25ead3e3718f7b6e9e8",
        "reservationDescriptorSha256": "023866dacbb83420c2a379408445c240df1ebe25f0e4f153d2779d71f64b58c6",
        "implementationBundleSha256": "4cc775cf4a9de8c76557735fa10e2fa63f77c4aa5503ffcf58258a5191a9e687",
        "dependencyLockSha256": "e3f942b24b5b515fecc068c475a193034b13a127e1da280cea5b4ad14a03c78a",
        "toolchainIdentitySha256": "3f07da47c80fa46c2d89a7e064cd374ee726cf2c206c08dbfbe35326f9b04356",
        "envelopeSha256": "5d7362dff53087a8e37826c62a504f6dab2e6db7fb809338e4fa4cc45aae225c"
      },
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
        "inputPorts": [],
        "outputPorts": [
          {
            "id": "selection",
            "payloadType": "target-selection-v1",
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
        "ownsPlayerLocomotion": false
      },
      "catalogEntryEvidenceId": "f78366167f3796cbb26bbad4513f471b30a2e358313f6619317aeb3990d495b4"
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
        "ownsPlayerLocomotion": false
      },
      "catalogEntryEvidenceId": "aa54ccdf176c71f957b875507aba8f94d0c70699352bddb81a84b900740b0570"
    },
    {
      "instanceId": "trigger",
      "ownerId": "player-one",
      "moduleId": "trigger.interval",
      "version": "1.0.0",
      "kind": "attack-trigger",
      "implementationId": "trigger.interval.v1",
      "configurationSchemaId": "trigger.interval.config",
      "configuration": {
        "intervalMs": 100,
        "firstEmission": "after-interval"
      },
      "manifestSchemaVersion": "1.2.0",
      "instantiation": "production-eligible",
      "manifestSha256": "b9ab9b91911b4fe04bd1d36d9794679cb254810c4e3a73936958c83fad52dc5c",
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
        "timers": 1
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
        "manifestSha256": "b9ab9b91911b4fe04bd1d36d9794679cb254810c4e3a73936958c83fad52dc5c",
        "configurationDescriptorSha256": "5b498b7e065c01865e8a52260345aa72fa7849ad7838b9c3c5d984038bd7eded",
        "reservationDescriptorSha256": "c99ee2eb8cac14d70501336acba8d2373fd2a281b4b83d408539fdd04941303c",
        "implementationBundleSha256": "012cce307b137a46ede9abb9fc433c88961882c2652ceecf1ea37d63a803ec60",
        "dependencyLockSha256": "e3f942b24b5b515fecc068c475a193034b13a127e1da280cea5b4ad14a03c78a",
        "toolchainIdentitySha256": "3f07da47c80fa46c2d89a7e064cd374ee726cf2c206c08dbfbe35326f9b04356",
        "envelopeSha256": "f278665d52bbf91aec7b30ab7591885ef4f5e42ec0438858761ed1f1f094f292"
      },
      "runtimeContract": {
        "update": null,
        "timerSlots": {
          "slotGroupId": "primary"
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
        "inputPorts": [],
        "outputPorts": [
          {
            "id": "request",
            "payloadType": "attack-request-v1",
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
        "ownsPlayerLocomotion": false
      },
      "catalogEntryEvidenceId": "b02a25c5c14a7d7fbec0eda58a03752842a7c261c747108584e97e1875a6efcb"
    }
  ],
  "dependencyEdges": [
    {
      "from": "delivery",
      "to": "targeting"
    },
    {
      "from": "delivery",
      "to": "trigger"
    },
    {
      "from": "detector",
      "to": "delivery"
    },
    {
      "from": "locomotion",
      "to": "arbiter"
    },
    {
      "from": "resolver",
      "to": "detector"
    }
  ],
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
      "capabilityId": "targeting.selection",
      "scope": "owner"
    },
    {
      "from": "delivery",
      "to": "trigger",
      "capabilityId": "trigger.attack",
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
      "to": "health",
      "capabilityId": "combat.damage-sink",
      "scope": "owner"
    }
  ],
  "bindings": [
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
      "payloadType": "target-selection-v1",
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
        "portId": "attack"
      },
      "payloadType": "attack-request-v1",
      "delivery": "event"
    }
  ],
  "constructionOrder": [
    "keyboard",
    "touch",
    "arbiter",
    "default-policy",
    "targeting",
    "trigger",
    "delivery",
    "detector",
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
      "sourceArtifactEnvelopeSha256": "3d229eb9a076c4ffaa3c1df9ecd3644406f64b2937ed215d2d8d0e15add8c689"
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
  "resourceTotals": {
    "activeEntities": 16,
    "activeProjectiles": 16,
    "spawnsPerSecond": 12,
    "timers": 1
  }
} as unknown as ResolvedModuleGraphV12;

export const batch1RuntimeCatalog = new BrowserGameModuleRuntimeCatalogV12({
  catalogEvidenceId: "d930de4f6f1ace5334e1a999adb8070f216245f2c924369f3f86426db469761b",
  entries: [
    { moduleId: "intent.movement-arbiter", version: "1.0.0", envelopeSha256: "a46bcb6e7b257b0bdc9649aa34aad0c183df155b497d76e95db061e95f5785e1", implementationId: "intent.movement-arbiter.v1", exportKind: "lifecycle-create-v1", entryEvidenceId: "5fdbbd0d1b1839e5102fde613746fea0b4aa47ee2db298cfd06e5edee1acce77", executable: batch1Executable0 },
    { moduleId: "interaction.contact-default-damage", version: "1.0.0", envelopeSha256: "435387a883a4ee3a09c15ea334056be0ca7e49989e5e5177847d2c066e4b3514", implementationId: "interaction.contact-default-damage.v1", exportKind: "contact-policy-transform-v1", entryEvidenceId: "09a0eac18392d54853da4987dcd821ec5953ed6e10adf19d4a484dc606b11be0", executable: batch1Executable1 },
    { moduleId: "delivery.projectile", version: "1.0.0", envelopeSha256: "3d229eb9a076c4ffaa3c1df9ecd3644406f64b2937ed215d2d8d0e15add8c689", implementationId: "delivery.projectile.v1", exportKind: "lifecycle-create-v1", entryEvidenceId: "3cb77d247e3c9796a61319319007ad28c5beabe9091ab7bba6f63cc5dccbc27a", executable: batch1Executable2 },
    { moduleId: "interaction.projectile-contact", version: "1.0.0", envelopeSha256: "c293b9337f882984472e89ad9a1e37d323ba6afc7fa9bd037121d746085b14f9", implementationId: "interaction.projectile-contact.v1", exportKind: "lifecycle-create-v1", entryEvidenceId: "a1ea42599e1706ac4087770209ecca282d7ab9317170df80201607123795e649", executable: batch1Executable3 },
    { moduleId: "combat.health", version: "1.0.0", envelopeSha256: "6a859e6ee2a20515041d437a24355063ff79f0236e48ffdc9f6bcd66e6d76c9f", implementationId: "combat.health.v1", exportKind: "lifecycle-create-v1", entryEvidenceId: "86f55a1494569080e0b22bb726dec081b28fdf444a35c5210c361ac0b6a5683d", executable: batch1Executable4 },
    { moduleId: "intent.keyboard-movement", version: "1.0.0", envelopeSha256: "4a2b9dc74b5c7beb16827b0a2e4c8f84256d5a12fa7de8dd7c54556bc501c11b", implementationId: "intent.keyboard-movement.v1", exportKind: "lifecycle-create-v1", entryEvidenceId: "27eb814dd5a19af2df497cfef15a2386e529a7171d5b32be72e768d96915357a", executable: batch1Executable5 },
    { moduleId: "locomotion.bounded", version: "1.0.0", envelopeSha256: "c26b611eea98fdcd25b65e934e866b864d1ad8668ee3b5241d71117df8301302", implementationId: "locomotion.bounded.v1", exportKind: "lifecycle-create-v1", entryEvidenceId: "76636a8739e2eb27ec721c456b9c5e476b4317efe9ea4e87f52c67193a5c6b11", executable: batch1Executable6 },
    { moduleId: "interaction.contact-resolution", version: "1.0.0", envelopeSha256: "15c592050626a7a832be4ea2d0272da70a778413164ff69c4bf5942758eaef3e", implementationId: "interaction.contact-resolution.v1", exportKind: "lifecycle-create-v1", entryEvidenceId: "327753845d2ef35100cfbcc67488663f17cabfbaec8cbfe40638cc0cdb81509f", executable: batch1Executable7 },
    { moduleId: "targeting.fixed-forward", version: "1.0.0", envelopeSha256: "5d7362dff53087a8e37826c62a504f6dab2e6db7fb809338e4fa4cc45aae225c", implementationId: "targeting.fixed-forward.v1", exportKind: "lifecycle-create-v1", entryEvidenceId: "f78366167f3796cbb26bbad4513f471b30a2e358313f6619317aeb3990d495b4", executable: batch1Executable8 },
    { moduleId: "intent.touch-drag", version: "1.0.0", envelopeSha256: "6b0f163881d2b3ffce945bacd5499eba9b85ea046021749b234b8256ec44cf90", implementationId: "intent.touch-drag.v1", exportKind: "lifecycle-create-v1", entryEvidenceId: "aa54ccdf176c71f957b875507aba8f94d0c70699352bddb81a84b900740b0570", executable: batch1Executable9 },
    { moduleId: "trigger.interval", version: "1.0.0", envelopeSha256: "f278665d52bbf91aec7b30ab7591885ef4f5e42ec0438858761ed1f1f094f292", implementationId: "trigger.interval.v1", exportKind: "lifecycle-create-v1", entryEvidenceId: "b02a25c5c14a7d7fbec0eda58a03752842a7c261c747108584e97e1875a6efcb", executable: batch1Executable10 },
  ],
});
