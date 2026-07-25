// @ts-nocheck -- generated from loader-admitted self-contained JavaScript bytes
import { BrowserGameModuleRuntimeCatalogV13 } from "../../../../src/modules/game-module-runtime-catalog.js";
import type { ResolvedModuleGraphV13 } from "../../../../src/modules/game-module-resolver.js";

export function batch2Executable0(context) {
    let direction = Object.freeze({x:0,y:0}); let sequence = 0; let remove; let disposed = false;
    context.ports.declareHandler;
    return Object.freeze({instanceId:context.identity.instanceId,
      initialize(){ context.services.observation.register("movement",()=>({sequence,direction})); },
      start(){ remove=context.services.input.register("keyboard.direction", value=>{ if(!value||!Number.isFinite(value.x)||!Number.isFinite(value.y)) throw new Error("invalid keyboard direction"); const length=Math.hypot(value.x,value.y); direction=Object.freeze(length===0?{x:0,y:0}:{x:value.x/length,y:value.y/length}); }); },
      update(){ if(disposed) throw new Error("keyboard disposed"); const active=direction.x!==0||direction.y!==0; context.ports.emitEvent("command",Object.freeze({sequence:sequence++,emittedAtMs:context.clock.nowMs(),sourceId:context.identity.instanceId,active,command:Object.freeze({kind:"velocity-direction",direction})})); },
      stop(){ remove?.(); remove=undefined; }, dispose(){ disposed=true; remove?.(); remove=undefined; }
    });
  }

export function batch2Executable1(context) {
    let captured; let sequence=0; let removers=[];
    const emit=(active,pointer,reason)=>context.ports.emitEvent("command",Object.freeze({sequence:sequence++,emittedAtMs:context.clock.nowMs(),sourceId:context.identity.instanceId,active,command:Object.freeze({kind:"absolute-position",position:Object.freeze({x:pointer.worldX,y:pointer.worldY}),pointerId:pointer.id})}));
    return Object.freeze({instanceId:context.identity.instanceId,
      initialize(){ context.services.observation.register("movement",()=>({sequence,capturedPointerId:captured??null})); },
      start(){ removers=[context.services.input.register("pointer.down",p=>{if(captured===undefined&&p&&p.isDown===true)captured=p.id;}),context.services.input.register("pointer.move",p=>{if(p&&p.id===captured&&p.isDown===true)emit(true,p);}),context.services.input.register("pointer.up",p=>{if(p&&p.id===captured){emit(false,p);captured=undefined;}})]; },
      stop(){ for(const remove of removers)remove(); removers=[]; captured=undefined; }, dispose(){ for(const remove of removers)remove(); removers=[]; captured=undefined; }
    });
  }

export function batch2Executable2(context) {
    const config=context.configuration; let keyboard; let touch; let sequence=0;
    const emit=(command,reason)=>context.ports.emitEvent("resolved",Object.freeze({...command,sequence:sequence++,emittedAtMs:context.clock.nowMs(),selectedSourceId:command.sourceId,arbitrationReason:reason}));
    context.ports.declareHandler("commands",command=>{ if(command.sourceId===config.keyboardSourceId)keyboard=command; else if(command.sourceId===config.touchSourceId)touch=command; else throw new Error("undeclared movement source"); if(touch?.active)emit(touch,"touch-active"); else if(command.sourceId===config.touchSourceId&&keyboard)emit(keyboard,"touch-released"); else if(command.sourceId===config.keyboardSourceId)emit(keyboard,"keyboard"); });
    return Object.freeze({instanceId:context.identity.instanceId,initialize(){context.services.observation.register("arbitration",()=>({sequence,keyboardActive:keyboard?.active??false,touchActive:touch?.active??false}));},stop(){},dispose(){keyboard=undefined;touch=undefined;}});
  }

export function batch2Executable3(context) {
    const config=context.configuration; let command; let owner;
    context.ports.declareHandler("command",value=>{command=value;});
    return Object.freeze({instanceId:context.identity.instanceId,
      initialize(){ owner=context.services.actors.readOwner(); if(!owner||owner.active!==true)throw new Error("inactive owner actor"); context.services.observation.register("motion",()=>({commandKind:command?.command?.kind??null})); },
      start(){},
      update(){ if(!command)return; if(command.command.kind==="velocity-direction"){const d=command.command.direction;context.services.actors.writeOwnerMotion(Object.freeze({x:command.active?d.x*config.moveSpeed:0,y:command.active?d.y*config.moveSpeed:0}));}else{const viewport=context.services.viewport.read();const b=config.bounds;context.services.actors.writeOwnerPosition(Object.freeze({x:Math.min(viewport.width-b.right,Math.max(b.left,command.command.position.x)),y:Math.min(viewport.height-b.bottom,Math.max(b.top,command.command.position.y))}));context.services.actors.writeOwnerMotion(Object.freeze({x:0,y:0}));} },
      stop(){},dispose(){command=undefined;owner=undefined;}
    });
  }

export function batch2Executable4(context){const selection=Object.freeze({revision:0,emittedAtMs:0,kind:"direction",direction:Object.freeze({x:0,y:-1})});return Object.freeze({instanceId:context.identity.instanceId,initialize(){context.ports.publishState("selection",Object.freeze({...selection,emittedAtMs:context.clock.nowMs()}));context.services.observation.register("target",()=>selection);}});}

export function batch2Executable5(context){let sequence=0;let timer;return Object.freeze({instanceId:context.identity.instanceId,initialize(){context.services.observation.register("trigger",()=>({sequence,timerActive:timer?.active??false}));},start(){timer=context.clock.schedule(Object.freeze({mode:"interval",initialDelayMs:context.configuration.intervalMs,intervalMs:context.configuration.intervalMs,callback(){context.ports.emitEvent("request",Object.freeze({sequence:sequence++,emittedAtMs:context.clock.nowMs(),requestedAtMs:context.clock.nowMs(),channel:"primary"}));}}));},stop(){timer?.cancel();timer=undefined;},dispose(){timer?.cancel();timer=undefined;}});}

export function batch2Executable6(context){const config=context.configuration;let target;let generation=0;let sequence=0;let dropped=0;const active=[];context.ports.declareHandler("target",value=>{target=value;});context.ports.declareHandler("attack",request=>{if(!target)throw new Error("attack before target");if(active.length>=config.maxActive){dropped++;return;}const owner=context.services.actors.readOwner();if(!owner||owner.active!==true)throw new Error("inactive projectile owner");const id="projectile-"+(++generation);const position=Object.freeze({x:owner.position.x+config.spawnOffset.x,y:owner.position.y+config.spawnOffset.y});const velocity=Object.freeze({x:target.direction.x*config.speed,y:target.direction.y*config.speed});const entity=Object.freeze({entityId:id,generation,position,velocity,damage:config.damage,textureKey:context.assets.requireTexture(config.textureRole)});const reference=context.services.channels.activate("projectiles",entity);active.push(reference);context.ports.emitEvent("emission",Object.freeze({sequence:sequence++,emittedAtMs:context.clock.nowMs(),entityId:id,channelId:context.identity.instanceId+".projectiles",ownerActorId:context.identity.ownerId,position,velocity,damage:config.damage,generation}));});return Object.freeze({instanceId:context.identity.instanceId,initialize(){context.assets.requireTexture(config.textureRole);context.ports.publishState("projectiles",Object.freeze({revision:0,emittedAtMs:context.clock.nowMs(),channelId:context.identity.instanceId+".projectiles",ownerInstanceId:context.identity.instanceId,ownerActorId:context.identity.ownerId,entityRole:"projectile",generation:0}));context.services.observation.register("delivery",()=>({generation,active:active.length,dropped,emissions:sequence}));},update(){},stop(){active.splice(0);},dispose(){active.splice(0);}});}

export function batch2Executable7(context){const config=context.configuration;let current=config.initialHealth;let revision=0;const seen=new Set();const publish=(delta,reason)=>context.ports.publishState("state",Object.freeze({revision:revision++,emittedAtMs:context.clock.nowMs(),actorId:context.identity.ownerId,current,maximum:config.maxHealth,delta,reason}));context.ports.declareHandler("damage",damage=>{if(damage.targetActorId!==context.identity.ownerId)throw new Error("damage target mismatch");const key=damage.sourceActorId+":"+damage.contactSequence;if(seen.has(key))throw new Error("duplicate damage");seen.add(key);const before=current;current=Math.max(config.damageFloor,current-damage.amount);publish(current-before,current===0?"depleted":"damaged");});return Object.freeze({instanceId:context.identity.instanceId,initialize(){publish(0,"initialized");context.services.observation.register("health",()=>({current,maximum:config.maxHealth,revision}));},dispose(){seen.clear();}});}

export function batch2Executable8(context){const config=context.configuration;let channel;let sequence=0;let remove;const seen=new Set();context.ports.declareHandler("sources",value=>{channel=value;});return Object.freeze({instanceId:context.identity.instanceId,initialize(){context.services.observation.register("contacts",()=>({sequence,tracked:seen.size}));},start(){remove=context.services.overlaps.register("projectile.overlap",raw=>{if(!channel)throw new Error("overlap before channel");const key=raw.sourceEntityId+":"+raw.sourceGeneration+":"+context.identity.ownerId;if(seen.has(key))return;if(seen.size>=config.maximumTrackedContacts)throw new Error("contact ledger exhausted");seen.add(key);const contactSequence=sequence++;context.ports.emitEvent("candidate",Object.freeze({sequence:contactSequence,emittedAtMs:context.clock.nowMs(),contactId:"contact."+contactSequence,sourceChannelId:channel.channelId,sourceEntityId:raw.sourceEntityId,sourceGeneration:raw.sourceGeneration,sourceActorId:channel.ownerActorId,targetActorId:context.identity.ownerId,contactSequence,metadata:Object.freeze({damage:raw.damage,damageKind:"projectile"})}));});},update(){},stop(){remove?.();remove=undefined;seen.clear();},dispose(){remove?.();remove=undefined;seen.clear();}});}

export function batch2Executable9(decision){return Object.freeze({...decision,disposition:"damage",sourceOperation:"consume",damage:decision.metadata.damage});}

export function batch2Executable10(context){let resolved=0;context.ports.declareHandler("sources",()=>{});context.ports.declareHandler("candidate",candidate=>{if(resolved>=context.configuration.maxResolvedContacts)throw new Error("resolved contact ceiling exceeded");const decision=context.services.contact.executePolicy(candidate);const prepared=context.services.contact.prepareCommit(candidate,decision,Object.freeze({hit(evidenceId){context.ports.emitEvent("hit",Object.freeze({sequence:evidenceId,emittedAtMs:context.clock.nowMs(),sourceEntityId:candidate.sourceEntityId,targetActorId:candidate.targetActorId,contactSequence:candidate.contactSequence,consumed:true}));},damage(evidenceId){context.ports.emitEvent("damage",Object.freeze({sequence:evidenceId,emittedAtMs:context.clock.nowMs(),sourceActorId:candidate.sourceActorId,targetActorId:candidate.targetActorId,amount:decision.damage,damageKind:decision.metadata.damageKind,contactSequence:candidate.contactSequence}));}}));prepared.commit();resolved++;});return Object.freeze({instanceId:context.identity.instanceId,initialize(){context.services.observation.register("resolution",()=>({resolved}));},dispose(){resolved=0;}});}

export function batch2Executable11(context){let revision=0;let last=Object.freeze({x:0,y:-1});let remove;const publish=(active,command)=>context.ports.publishState("aim",Object.freeze({sourceId:context.identity.instanceId,revision:revision++,emittedAtMs:context.clock.nowMs(),active,command:Object.freeze(command)}));return Object.freeze({instanceId:context.identity.instanceId,initialize(){publish(false,{kind:"direction",direction:last});context.services.observation.register("aim",()=>({revision,last}));},start(){const registration=context.configuration.source==="pointer-world"?"aim.pointer":"aim.keyboard";remove=context.services.input.register(registration,value=>{if(!value)return;if(context.configuration.source==="pointer-world"){if(!Number.isFinite(value.worldX)||!Number.isFinite(value.worldY))throw new Error("invalid aim point");publish(true,{kind:"world-point",point:Object.freeze({x:value.worldX,y:value.worldY})});return;}if(!Number.isFinite(value.x)||!Number.isFinite(value.y))throw new Error("invalid aim direction");const length=Math.hypot(value.x,value.y);if(length<=context.configuration.deadZone){publish(false,{kind:"direction",direction:last});return;}last=Object.freeze({x:value.x/length,y:value.y/length});publish(true,{kind:"direction",direction:last});});},stop(){remove?.();remove=undefined;},dispose(){remove?.();remove=undefined;}});}

export function batch2Executable12(context){let sequence=0;let captured;let removers=[];const emit=(phase,identity)=>context.ports.emitEvent("intent",Object.freeze({sourceId:context.identity.instanceId,sequence:sequence++,emittedAtMs:context.clock.nowMs(),phase,inputIdentity:String(identity)}));const accept=(phase,identity)=>{if(phase==="press"){if(captured!==undefined)return;captured=identity;emit("press",identity);return;}if(identity!==captured)return;emit("release",identity);captured=undefined;};return Object.freeze({instanceId:context.identity.instanceId,initialize(){context.services.observation.register("attack",()=>({sequence,captured:captured??null}));},start(){if(context.configuration.device==="pointer"){removers=[context.services.input.register("attack.pointer-down",value=>accept("press",value.id)),context.services.input.register("attack.pointer-up",value=>accept("release",value.id))];return;}removers=[context.services.input.register("attack.keyboard",value=>{if(!value||!(value.phase==="press"||value.phase==="release"))throw new Error("invalid attack input");accept(value.phase,value.identity);})];},stop(){for(const remove of removers)remove();removers=[];captured=undefined;},dispose(){for(const remove of removers)remove();removers=[];captured=undefined;}});}

export function batch2Executable13(context){let revision=0;let focused=false;let remove;const publish=()=>context.ports.publishState("focus",Object.freeze({sourceId:context.identity.instanceId,revision:revision++,emittedAtMs:context.clock.nowMs(),active:focused}));return Object.freeze({instanceId:context.identity.instanceId,initialize(){publish();context.services.observation.register("focus",()=>({revision,focused}));},start(){remove=context.services.input.register("focus.keyboard",value=>{if(!value||!(value.phase==="press"||value.phase==="release"))throw new Error("invalid focus input");focused=value.phase==="press";publish();});},stop(){remove?.();remove=undefined;focused=false;},dispose(){remove?.();remove=undefined;focused=false;}});}

export function batch2Executable14(context){let revision=0;let focused=false;const publish=()=>context.ports.publishState("scale",Object.freeze({revision:revision++,emittedAtMs:context.clock.nowMs(),scale:focused?context.configuration.multiplier:1}));context.ports.declareHandler("focus",(value,metadata)=>{focused=value.active===true;if(metadata?.replay!==true)publish();});return Object.freeze({instanceId:context.identity.instanceId,initialize(){publish();context.services.observation.register("scale",()=>({revision,focused,scale:focused?context.configuration.multiplier:1}));},dispose(){focused=false;}});}

export function batch2Executable15(context){const config=context.configuration;let command;let scale=1;context.ports.declareHandler("command",value=>{command=value;});context.ports.declareHandler("speed-scale",value=>{if(!Number.isFinite(value.scale)||value.scale<=0||value.scale>1)throw new Error("invalid movement scale");scale=value.scale;});return Object.freeze({instanceId:context.identity.instanceId,initialize(){const owner=context.services.actors.readOwner();if(!owner||owner.active!==true)throw new Error("inactive owner actor");context.services.observation.register("motion",()=>({commandKind:command?.command?.kind??null,scale}));},update(){if(!command)return;if(command.command.kind==="velocity-direction"){const d=command.command.direction;context.services.actors.writeOwnerMotion(Object.freeze({x:command.active?d.x*config.moveSpeed*scale:0,y:command.active?d.y*config.moveSpeed*scale:0}));return;}const viewport=context.services.viewport.read();const b=config.bounds;context.services.actors.writeOwnerPosition(Object.freeze({x:Math.min(viewport.width-b.right,Math.max(b.left,command.command.position.x)),y:Math.min(viewport.height-b.bottom,Math.max(b.top,command.command.position.y))}));context.services.actors.writeOwnerMotion(Object.freeze({x:0,y:0}));},stop(){},dispose(){command=undefined;scale=1;}});}

export function batch2Executable16(context){let revision=0;let last;const normalize=value=>{const length=Math.hypot(value.x,value.y);if(!Number.isFinite(length)||length===0)return undefined;return Object.freeze({x:value.x/length,y:value.y/length});};const publish=direction=>{last=direction;context.ports.publishState("selection",Object.freeze({revision:revision++,emittedAtMs:context.clock.nowMs(),attackChannelId:context.configuration.attackChannelId,direction,targetEvidence:null}));};context.ports.declareHandler("aim",(value,metadata)=>{if(value.command.kind==="direction"){const direction=normalize(value.command.direction);if(direction){last=direction;if(metadata?.replay!==true)publish(direction);}return;}const owner=context.services.actors.readOwner();const direction=owner?normalize({x:value.command.point.x-owner.position.x,y:value.command.point.y-owner.position.y}):undefined;if(direction){last=direction;if(metadata?.replay!==true)publish(direction);}else if(!last){const fallback=normalize(context.configuration.pointFallbackDirection);if(!fallback)throw new Error("invalid targeting fallback");last=fallback;if(metadata?.replay!==true)publish(fallback);}});return Object.freeze({instanceId:context.identity.instanceId,initialize(){const fallback=normalize(context.configuration.pointFallbackDirection);if(!fallback)throw new Error("invalid targeting fallback");publish(fallback);context.services.observation.register("target",()=>({revision,last}));},dispose(){last=undefined;}});}

export function batch2Executable17(context){let revision=0;let last;const normalize=value=>{const length=Math.hypot(value.x,value.y);if(!Number.isFinite(length)||length===0)return undefined;return Object.freeze({x:value.x/length,y:value.y/length});};return Object.freeze({instanceId:context.identity.instanceId,initialize(){context.services.observation.register("nearest",()=>({revision,last}));},update(){const snapshot=context.services.actorSnapshots.read("nearest.targets");const owner=context.services.actors.readOwner();if(!owner)throw new Error("missing targeting owner");const target=snapshot.entries.find(entry=>entry.active===true&&context.configuration.allowedRoles.includes(entry.role)&&Math.hypot(entry.position.x-owner.position.x,entry.position.y-owner.position.y)<=context.configuration.range);const direction=target?normalize({x:target.position.x-owner.position.x,y:target.position.y-owner.position.y}):normalize(context.configuration.noTargetFallbackDirection);if(!direction)throw new Error("invalid nearest fallback");last=direction;context.ports.publishState("selection",Object.freeze({revision:revision++,emittedAtMs:context.clock.nowMs(),attackChannelId:context.configuration.attackChannelId,direction,targetEvidence:target?Object.freeze({actorId:target.actorId,actorGeneration:target.actorGeneration,directoryRevision:snapshot.directoryRevision}):null}));},dispose(){last=undefined;}});}

export function batch2Executable18(context){let state="idle";let identity;let sequence=0;let timer;const emit=()=>context.ports.emitEvent("request",Object.freeze({sequence:sequence++,emittedAtMs:context.clock.nowMs(),requestedAtMs:context.clock.nowMs(),attackChannelId:context.configuration.attackChannelId,slot:"primary"}));const cancel=()=>{timer?.cancel();timer=undefined;state="idle";identity=undefined;};context.ports.declareHandler("intent",value=>{if(value.phase==="press"){if(state!=="idle")return;identity=value.inputIdentity;if(context.configuration.mode==="press"){emit();state="held-edge";return;}if(context.configuration.mode==="release"){state="held-edge";return;}state="held-waiting";timer=context.clock.schedule(Object.freeze({mode:"interval",initialDelayMs:context.configuration.initialDelayMs,intervalMs:context.configuration.repeatIntervalMs,callback(){if(state==="held-waiting")state="held-repeating";if(state==="held-repeating")emit();}}));return;}if(value.phase!=="release"||state==="idle"||value.inputIdentity!==identity)return;if(context.configuration.mode==="release")emit();cancel();});return Object.freeze({instanceId:context.identity.instanceId,initialize(){context.services.observation.register("trigger",()=>({state,identity:identity??null,sequence,timerActive:timer?.active??false}));},stop(){cancel();},dispose(){cancel();sequence=0;}});}

export function batch2Executable19(context){
const config=context.configuration;
const moduleKinds=Object.freeze({"delivery.spread":"spread","delivery.multi-shot":"multi-shot","delivery.pattern.radial":"radial","delivery.pattern.spiral":"spiral","delivery.pattern.fan":"fan","delivery.pattern.aimed":"aimed","delivery.pattern.wave":"wave","delivery.pattern.rain":"rain","delivery.pattern.rotating-ring":"rotatingRing","delivery.pattern.burst":"burst"});
const kind=moduleKinds[context.identity.moduleId];if(!kind)throw new Error("unknown delivery formation");
const centeredOrder=count=>{const result=[];if(count%2===1)result.push(0);for(let step=0;result.length<count;step+=1){const offset=count%2===1?step+1:step+.5;result.push(-offset);if(result.length<count)result.push(offset);}return result;};
const finite=field=>{const value=config[field];if(typeof value!=="number"||!Number.isFinite(value))throw new Error("invalid formation field: "+field);return value;};
const fanAngles=(center,arc,count)=>{if(count===1)return[center];if(Math.abs(arc-Math.PI*2)<=1e-12)return centeredOrder(count).map(offset=>center+offset*arc/count);const step=arc/(count-1);return centeredOrder(count).map(offset=>center+offset*step);};
const planFormation=(count,targetDirection,emissionIndex)=>{const degrees=value=>value*Math.PI/180;let center=Math.atan2(targetDirection.y,targetDirection.x);let angles;let spacing=0;if(kind==="spread")angles=fanAngles(center,degrees(finite("totalArcDegrees")),count);else if(kind==="multi-shot"){spacing=finite("lateralSpacing");angles=Array.from({length:count},()=>center);}else if(kind==="radial"){center+=degrees(finite("baseAngleOffsetDegrees"));angles=Array.from({length:count},(_,index)=>center+index*Math.PI*2/count);}else if(kind==="spiral"){center+=emissionIndex*degrees(finite("rotationStepDegrees"));angles=Array.from({length:count},(_,index)=>center+index*Math.PI*2/count);}else if(kind==="fan")angles=fanAngles(center,degrees(finite("arcDegrees")),count);else if(kind==="aimed")angles=fanAngles(center,degrees(finite("aimSpreadDegrees")),count);else if(kind==="wave"){const spread=degrees(finite("waveSpreadDegrees"));center+=Math.sin(emissionIndex*degrees(finite("phaseStepDegrees")))*spread/2;angles=fanAngles(center,spread,count);}else if(kind==="rain"){const downward=config.downwardBaseDirection;const magnitude=Math.hypot(downward.x,downward.y);if(!Number.isFinite(magnitude)||magnitude<=0)throw new Error("invalid rain direction");center=Math.atan2(downward.y/magnitude,downward.x/magnitude);angles=fanAngles(center,degrees(finite("spreadDegrees")),count);}else if(kind==="rotatingRing"){center+=emissionIndex*degrees(finite("ringRotationStepDegrees"));angles=Array.from({length:count},(_,index)=>center+index*Math.PI*2/count);}else angles=fanAngles(center,degrees(finite("burstSpreadDegrees")),count);const offsets=centeredOrder(count);return Object.freeze(angles.map((angle,index)=>Object.freeze({direction:Object.freeze({x:Math.cos(angle),y:Math.sin(angle)}),lateralOffset:Object.freeze({x:-Math.sin(center)*offsets[index]*spacing,y:Math.cos(center)*offsets[index]*spacing})})));};
let target;let emissionIndex=0;let emissionSequence=0;let modifierRevision=0;let damageBonus=0;let countBonus=0;const active=[];
const publishModifier=(fieldId,current,maximum)=>context.ports.publishState("modifier-state",Object.freeze({revision:modifierRevision++,emittedAtMs:context.clock.nowMs(),fieldId,current,minimum:0,maximum}));
context.ports.declareHandler("target",value=>{if(value.attackChannelId!==config.attackChannelId)throw new Error("target channel mismatch");const magnitude=Math.hypot(value.direction.x,value.direction.y);if(!Number.isFinite(magnitude)||Math.abs(magnitude-1)>1e-6)throw new Error("invalid target direction");target=Object.freeze({x:value.direction.x,y:value.direction.y});});
const applyModifier=value=>{if(value.targetInstanceId!==context.identity.instanceId||value.operation!=="add"||!Number.isFinite(value.value)||value.value<=0)throw new Error("invalid delivery modifier application");if(value.fieldId==="attack.damage.multiplier"){damageBonus=Math.min(config.maximumDamageMultiplier-1,damageBonus+value.value);publishModifier(value.fieldId,damageBonus,config.maximumDamageMultiplier-1);return;}if(value.fieldId==="attack.projectile-count.bonus"){if(!Number.isSafeInteger(value.value))throw new Error("projectile count bonus must be an integer");countBonus=Math.min(config.maximumCountBonus,countBonus+value.value);publishModifier(value.fieldId,countBonus,config.maximumCountBonus);return;}throw new Error("unknown delivery modifier target");};
context.ports.declareAddressedHandler("attack.damage.multiplier",applyModifier);
context.ports.declareAddressedHandler("attack.projectile-count.bonus",applyModifier);
context.ports.declareHandler("request",request=>{if(request.attackChannelId!==config.attackChannelId)throw new Error("request channel mismatch");if(!target)throw new Error("attack before target solution");if(emissionIndex>=Number.MAX_SAFE_INTEGER)throw new Error("delivery emission index exhausted");const now=context.clock.nowMs();const effectiveCount=config.baseCount+Math.min(countBonus,config.maximumCountBonus);const effectiveDamage=config.baseDamage*Math.min(1+damageBonus,config.maximumDamageMultiplier);const owner=context.services.actors.readOwner();if(!owner||owner.active!==true)throw new Error("inactive projectile owner");const textureKey=context.assets.requireTexture(config.textureRole);const requestPlan=planFormation(effectiveCount,target,emissionIndex++).map(spawn=>{const position=Object.freeze({x:owner.position.x+config.spawnOffset.x+spawn.lateralOffset.x,y:owner.position.y+config.spawnOffset.y+spawn.lateralOffset.y});const velocity=Object.freeze({x:spawn.direction.x*config.speed,y:spawn.direction.y*config.speed});return Object.freeze({position,velocity,damage:effectiveDamage,textureKey});});const result=context.services.projectileDelivery.admit(request.sequence,requestPlan);if(!result.accepted)return;if(result.activated.length>Number.MAX_SAFE_INTEGER-emissionSequence)throw new Error("delivery emission sequence block exhausted");for(let index=0;index<result.activated.length;index+=1){const reference=result.activated[index];const spawn=requestPlan[index];active.push({reference,position:{x:spawn.position.x,y:spawn.position.y},velocity:spawn.velocity});context.ports.emitEvent("emission",Object.freeze({sequence:emissionSequence++,emittedAtMs:now,entityId:reference.entityId,channelId:reference.channelId,ownerActorId:reference.ownerActorId,position:spawn.position,velocity:spawn.velocity,damage:effectiveDamage,generation:reference.generation}));}});
const recycleAll=()=>{active.splice(0);};
return Object.freeze({instanceId:context.identity.instanceId,initialize(){context.assets.requireTexture(config.textureRole);context.ports.publishState("projectiles",Object.freeze({revision:0,emittedAtMs:context.clock.nowMs(),channelId:context.identity.instanceId+".projectiles",ownerInstanceId:context.identity.instanceId,ownerActorId:context.identity.ownerId,entityRole:"projectile",generation:0}));publishModifier("attack.damage.multiplier",0,config.maximumDamageMultiplier-1);publishModifier("attack.projectile-count.bonus",0,config.maximumCountBonus);context.services.observation.register("delivery",()=>({...context.services.projectileDelivery.observe(),emissionIndex,damageBonus,countBonus}));},update(deltaMs){if(!Number.isFinite(deltaMs)||deltaMs<0)throw new Error("invalid delivery delta");const viewport=context.services.viewport.read();for(let index=active.length-1;index>=0;index-=1){const record=active[index];record.position.x+=record.velocity.x*deltaMs/1000;record.position.y+=record.velocity.y*deltaMs/1000;const margin=config.recycleMargin;if(record.position.x < -margin||record.position.x > viewport.width+margin||record.position.y < -margin||record.position.y > viewport.height+margin){context.services.projectileDelivery.recycle(record.reference);active.splice(index,1);}}},stop(){recycleAll();},dispose(){recycleAll();target=undefined;damageBonus=0;countBonus=0;}});}

export function batch2Executable20(context){
const config=context.configuration;
const moduleKinds=Object.freeze({"delivery.spread":"spread","delivery.multi-shot":"multi-shot","delivery.pattern.radial":"radial","delivery.pattern.spiral":"spiral","delivery.pattern.fan":"fan","delivery.pattern.aimed":"aimed","delivery.pattern.wave":"wave","delivery.pattern.rain":"rain","delivery.pattern.rotating-ring":"rotatingRing","delivery.pattern.burst":"burst"});
const kind=moduleKinds[context.identity.moduleId];if(!kind)throw new Error("unknown delivery formation");
const centeredOrder=count=>{const result=[];if(count%2===1)result.push(0);for(let step=0;result.length<count;step+=1){const offset=count%2===1?step+1:step+.5;result.push(-offset);if(result.length<count)result.push(offset);}return result;};
const finite=field=>{const value=config[field];if(typeof value!=="number"||!Number.isFinite(value))throw new Error("invalid formation field: "+field);return value;};
const fanAngles=(center,arc,count)=>{if(count===1)return[center];if(Math.abs(arc-Math.PI*2)<=1e-12)return centeredOrder(count).map(offset=>center+offset*arc/count);const step=arc/(count-1);return centeredOrder(count).map(offset=>center+offset*step);};
const planFormation=(count,targetDirection,emissionIndex)=>{const degrees=value=>value*Math.PI/180;let center=Math.atan2(targetDirection.y,targetDirection.x);let angles;let spacing=0;if(kind==="spread")angles=fanAngles(center,degrees(finite("totalArcDegrees")),count);else if(kind==="multi-shot"){spacing=finite("lateralSpacing");angles=Array.from({length:count},()=>center);}else if(kind==="radial"){center+=degrees(finite("baseAngleOffsetDegrees"));angles=Array.from({length:count},(_,index)=>center+index*Math.PI*2/count);}else if(kind==="spiral"){center+=emissionIndex*degrees(finite("rotationStepDegrees"));angles=Array.from({length:count},(_,index)=>center+index*Math.PI*2/count);}else if(kind==="fan")angles=fanAngles(center,degrees(finite("arcDegrees")),count);else if(kind==="aimed")angles=fanAngles(center,degrees(finite("aimSpreadDegrees")),count);else if(kind==="wave"){const spread=degrees(finite("waveSpreadDegrees"));center+=Math.sin(emissionIndex*degrees(finite("phaseStepDegrees")))*spread/2;angles=fanAngles(center,spread,count);}else if(kind==="rain"){const downward=config.downwardBaseDirection;const magnitude=Math.hypot(downward.x,downward.y);if(!Number.isFinite(magnitude)||magnitude<=0)throw new Error("invalid rain direction");center=Math.atan2(downward.y/magnitude,downward.x/magnitude);angles=fanAngles(center,degrees(finite("spreadDegrees")),count);}else if(kind==="rotatingRing"){center+=emissionIndex*degrees(finite("ringRotationStepDegrees"));angles=Array.from({length:count},(_,index)=>center+index*Math.PI*2/count);}else angles=fanAngles(center,degrees(finite("burstSpreadDegrees")),count);const offsets=centeredOrder(count);return Object.freeze(angles.map((angle,index)=>Object.freeze({direction:Object.freeze({x:Math.cos(angle),y:Math.sin(angle)}),lateralOffset:Object.freeze({x:-Math.sin(center)*offsets[index]*spacing,y:Math.cos(center)*offsets[index]*spacing})})));};
let target;let emissionIndex=0;let emissionSequence=0;let modifierRevision=0;let damageBonus=0;let countBonus=0;const active=[];
const publishModifier=(fieldId,current,maximum)=>context.ports.publishState("modifier-state",Object.freeze({revision:modifierRevision++,emittedAtMs:context.clock.nowMs(),fieldId,current,minimum:0,maximum}));
context.ports.declareHandler("target",value=>{if(value.attackChannelId!==config.attackChannelId)throw new Error("target channel mismatch");const magnitude=Math.hypot(value.direction.x,value.direction.y);if(!Number.isFinite(magnitude)||Math.abs(magnitude-1)>1e-6)throw new Error("invalid target direction");target=Object.freeze({x:value.direction.x,y:value.direction.y});});
const applyModifier=value=>{if(value.targetInstanceId!==context.identity.instanceId||value.operation!=="add"||!Number.isFinite(value.value)||value.value<=0)throw new Error("invalid delivery modifier application");if(value.fieldId==="attack.damage.multiplier"){damageBonus=Math.min(config.maximumDamageMultiplier-1,damageBonus+value.value);publishModifier(value.fieldId,damageBonus,config.maximumDamageMultiplier-1);return;}if(value.fieldId==="attack.projectile-count.bonus"){if(!Number.isSafeInteger(value.value))throw new Error("projectile count bonus must be an integer");countBonus=Math.min(config.maximumCountBonus,countBonus+value.value);publishModifier(value.fieldId,countBonus,config.maximumCountBonus);return;}throw new Error("unknown delivery modifier target");};
context.ports.declareAddressedHandler("attack.damage.multiplier",applyModifier);
context.ports.declareAddressedHandler("attack.projectile-count.bonus",applyModifier);
context.ports.declareHandler("request",request=>{if(request.attackChannelId!==config.attackChannelId)throw new Error("request channel mismatch");if(!target)throw new Error("attack before target solution");if(emissionIndex>=Number.MAX_SAFE_INTEGER)throw new Error("delivery emission index exhausted");const now=context.clock.nowMs();const effectiveCount=config.baseCount+Math.min(countBonus,config.maximumCountBonus);const effectiveDamage=config.baseDamage*Math.min(1+damageBonus,config.maximumDamageMultiplier);const owner=context.services.actors.readOwner();if(!owner||owner.active!==true)throw new Error("inactive projectile owner");const textureKey=context.assets.requireTexture(config.textureRole);const requestPlan=planFormation(effectiveCount,target,emissionIndex++).map(spawn=>{const position=Object.freeze({x:owner.position.x+config.spawnOffset.x+spawn.lateralOffset.x,y:owner.position.y+config.spawnOffset.y+spawn.lateralOffset.y});const velocity=Object.freeze({x:spawn.direction.x*config.speed,y:spawn.direction.y*config.speed});return Object.freeze({position,velocity,damage:effectiveDamage,textureKey});});const result=context.services.projectileDelivery.admit(request.sequence,requestPlan);if(!result.accepted)return;if(result.activated.length>Number.MAX_SAFE_INTEGER-emissionSequence)throw new Error("delivery emission sequence block exhausted");for(let index=0;index<result.activated.length;index+=1){const reference=result.activated[index];const spawn=requestPlan[index];active.push({reference,position:{x:spawn.position.x,y:spawn.position.y},velocity:spawn.velocity});context.ports.emitEvent("emission",Object.freeze({sequence:emissionSequence++,emittedAtMs:now,entityId:reference.entityId,channelId:reference.channelId,ownerActorId:reference.ownerActorId,position:spawn.position,velocity:spawn.velocity,damage:effectiveDamage,generation:reference.generation}));}});
const recycleAll=()=>{active.splice(0);};
return Object.freeze({instanceId:context.identity.instanceId,initialize(){context.assets.requireTexture(config.textureRole);context.ports.publishState("projectiles",Object.freeze({revision:0,emittedAtMs:context.clock.nowMs(),channelId:context.identity.instanceId+".projectiles",ownerInstanceId:context.identity.instanceId,ownerActorId:context.identity.ownerId,entityRole:"projectile",generation:0}));publishModifier("attack.damage.multiplier",0,config.maximumDamageMultiplier-1);publishModifier("attack.projectile-count.bonus",0,config.maximumCountBonus);context.services.observation.register("delivery",()=>({...context.services.projectileDelivery.observe(),emissionIndex,damageBonus,countBonus}));},update(deltaMs){if(!Number.isFinite(deltaMs)||deltaMs<0)throw new Error("invalid delivery delta");const viewport=context.services.viewport.read();for(let index=active.length-1;index>=0;index-=1){const record=active[index];record.position.x+=record.velocity.x*deltaMs/1000;record.position.y+=record.velocity.y*deltaMs/1000;const margin=config.recycleMargin;if(record.position.x < -margin||record.position.x > viewport.width+margin||record.position.y < -margin||record.position.y > viewport.height+margin){context.services.projectileDelivery.recycle(record.reference);active.splice(index,1);}}},stop(){recycleAll();},dispose(){recycleAll();target=undefined;damageBonus=0;countBonus=0;}});}

export function batch2Executable21(context){
const config=context.configuration;
const moduleKinds=Object.freeze({"delivery.spread":"spread","delivery.multi-shot":"multi-shot","delivery.pattern.radial":"radial","delivery.pattern.spiral":"spiral","delivery.pattern.fan":"fan","delivery.pattern.aimed":"aimed","delivery.pattern.wave":"wave","delivery.pattern.rain":"rain","delivery.pattern.rotating-ring":"rotatingRing","delivery.pattern.burst":"burst"});
const kind=moduleKinds[context.identity.moduleId];if(!kind)throw new Error("unknown delivery formation");
const centeredOrder=count=>{const result=[];if(count%2===1)result.push(0);for(let step=0;result.length<count;step+=1){const offset=count%2===1?step+1:step+.5;result.push(-offset);if(result.length<count)result.push(offset);}return result;};
const finite=field=>{const value=config[field];if(typeof value!=="number"||!Number.isFinite(value))throw new Error("invalid formation field: "+field);return value;};
const fanAngles=(center,arc,count)=>{if(count===1)return[center];if(Math.abs(arc-Math.PI*2)<=1e-12)return centeredOrder(count).map(offset=>center+offset*arc/count);const step=arc/(count-1);return centeredOrder(count).map(offset=>center+offset*step);};
const planFormation=(count,targetDirection,emissionIndex)=>{const degrees=value=>value*Math.PI/180;let center=Math.atan2(targetDirection.y,targetDirection.x);let angles;let spacing=0;if(kind==="spread")angles=fanAngles(center,degrees(finite("totalArcDegrees")),count);else if(kind==="multi-shot"){spacing=finite("lateralSpacing");angles=Array.from({length:count},()=>center);}else if(kind==="radial"){center+=degrees(finite("baseAngleOffsetDegrees"));angles=Array.from({length:count},(_,index)=>center+index*Math.PI*2/count);}else if(kind==="spiral"){center+=emissionIndex*degrees(finite("rotationStepDegrees"));angles=Array.from({length:count},(_,index)=>center+index*Math.PI*2/count);}else if(kind==="fan")angles=fanAngles(center,degrees(finite("arcDegrees")),count);else if(kind==="aimed")angles=fanAngles(center,degrees(finite("aimSpreadDegrees")),count);else if(kind==="wave"){const spread=degrees(finite("waveSpreadDegrees"));center+=Math.sin(emissionIndex*degrees(finite("phaseStepDegrees")))*spread/2;angles=fanAngles(center,spread,count);}else if(kind==="rain"){const downward=config.downwardBaseDirection;const magnitude=Math.hypot(downward.x,downward.y);if(!Number.isFinite(magnitude)||magnitude<=0)throw new Error("invalid rain direction");center=Math.atan2(downward.y/magnitude,downward.x/magnitude);angles=fanAngles(center,degrees(finite("spreadDegrees")),count);}else if(kind==="rotatingRing"){center+=emissionIndex*degrees(finite("ringRotationStepDegrees"));angles=Array.from({length:count},(_,index)=>center+index*Math.PI*2/count);}else angles=fanAngles(center,degrees(finite("burstSpreadDegrees")),count);const offsets=centeredOrder(count);return Object.freeze(angles.map((angle,index)=>Object.freeze({direction:Object.freeze({x:Math.cos(angle),y:Math.sin(angle)}),lateralOffset:Object.freeze({x:-Math.sin(center)*offsets[index]*spacing,y:Math.cos(center)*offsets[index]*spacing})})));};
let target;let emissionIndex=0;let emissionSequence=0;let modifierRevision=0;let damageBonus=0;let countBonus=0;const active=[];
const publishModifier=(fieldId,current,maximum)=>context.ports.publishState("modifier-state",Object.freeze({revision:modifierRevision++,emittedAtMs:context.clock.nowMs(),fieldId,current,minimum:0,maximum}));
context.ports.declareHandler("target",value=>{if(value.attackChannelId!==config.attackChannelId)throw new Error("target channel mismatch");const magnitude=Math.hypot(value.direction.x,value.direction.y);if(!Number.isFinite(magnitude)||Math.abs(magnitude-1)>1e-6)throw new Error("invalid target direction");target=Object.freeze({x:value.direction.x,y:value.direction.y});});
const applyModifier=value=>{if(value.targetInstanceId!==context.identity.instanceId||value.operation!=="add"||!Number.isFinite(value.value)||value.value<=0)throw new Error("invalid delivery modifier application");if(value.fieldId==="attack.damage.multiplier"){damageBonus=Math.min(config.maximumDamageMultiplier-1,damageBonus+value.value);publishModifier(value.fieldId,damageBonus,config.maximumDamageMultiplier-1);return;}if(value.fieldId==="attack.projectile-count.bonus"){if(!Number.isSafeInteger(value.value))throw new Error("projectile count bonus must be an integer");countBonus=Math.min(config.maximumCountBonus,countBonus+value.value);publishModifier(value.fieldId,countBonus,config.maximumCountBonus);return;}throw new Error("unknown delivery modifier target");};
context.ports.declareAddressedHandler("attack.damage.multiplier",applyModifier);
context.ports.declareAddressedHandler("attack.projectile-count.bonus",applyModifier);
context.ports.declareHandler("request",request=>{if(request.attackChannelId!==config.attackChannelId)throw new Error("request channel mismatch");if(!target)throw new Error("attack before target solution");if(emissionIndex>=Number.MAX_SAFE_INTEGER)throw new Error("delivery emission index exhausted");const now=context.clock.nowMs();const effectiveCount=config.baseCount+Math.min(countBonus,config.maximumCountBonus);const effectiveDamage=config.baseDamage*Math.min(1+damageBonus,config.maximumDamageMultiplier);const owner=context.services.actors.readOwner();if(!owner||owner.active!==true)throw new Error("inactive projectile owner");const textureKey=context.assets.requireTexture(config.textureRole);const requestPlan=planFormation(effectiveCount,target,emissionIndex++).map(spawn=>{const position=Object.freeze({x:owner.position.x+config.spawnOffset.x+spawn.lateralOffset.x,y:owner.position.y+config.spawnOffset.y+spawn.lateralOffset.y});const velocity=Object.freeze({x:spawn.direction.x*config.speed,y:spawn.direction.y*config.speed});return Object.freeze({position,velocity,damage:effectiveDamage,textureKey});});const result=context.services.projectileDelivery.admit(request.sequence,requestPlan);if(!result.accepted)return;if(result.activated.length>Number.MAX_SAFE_INTEGER-emissionSequence)throw new Error("delivery emission sequence block exhausted");for(let index=0;index<result.activated.length;index+=1){const reference=result.activated[index];const spawn=requestPlan[index];active.push({reference,position:{x:spawn.position.x,y:spawn.position.y},velocity:spawn.velocity});context.ports.emitEvent("emission",Object.freeze({sequence:emissionSequence++,emittedAtMs:now,entityId:reference.entityId,channelId:reference.channelId,ownerActorId:reference.ownerActorId,position:spawn.position,velocity:spawn.velocity,damage:effectiveDamage,generation:reference.generation}));}});
const recycleAll=()=>{active.splice(0);};
return Object.freeze({instanceId:context.identity.instanceId,initialize(){context.assets.requireTexture(config.textureRole);context.ports.publishState("projectiles",Object.freeze({revision:0,emittedAtMs:context.clock.nowMs(),channelId:context.identity.instanceId+".projectiles",ownerInstanceId:context.identity.instanceId,ownerActorId:context.identity.ownerId,entityRole:"projectile",generation:0}));publishModifier("attack.damage.multiplier",0,config.maximumDamageMultiplier-1);publishModifier("attack.projectile-count.bonus",0,config.maximumCountBonus);context.services.observation.register("delivery",()=>({...context.services.projectileDelivery.observe(),emissionIndex,damageBonus,countBonus}));},update(deltaMs){if(!Number.isFinite(deltaMs)||deltaMs<0)throw new Error("invalid delivery delta");const viewport=context.services.viewport.read();for(let index=active.length-1;index>=0;index-=1){const record=active[index];record.position.x+=record.velocity.x*deltaMs/1000;record.position.y+=record.velocity.y*deltaMs/1000;const margin=config.recycleMargin;if(record.position.x < -margin||record.position.x > viewport.width+margin||record.position.y < -margin||record.position.y > viewport.height+margin){context.services.projectileDelivery.recycle(record.reference);active.splice(index,1);}}},stop(){recycleAll();},dispose(){recycleAll();target=undefined;damageBonus=0;countBonus=0;}});}

export function batch2Executable22(context){
const config=context.configuration;
const moduleKinds=Object.freeze({"delivery.spread":"spread","delivery.multi-shot":"multi-shot","delivery.pattern.radial":"radial","delivery.pattern.spiral":"spiral","delivery.pattern.fan":"fan","delivery.pattern.aimed":"aimed","delivery.pattern.wave":"wave","delivery.pattern.rain":"rain","delivery.pattern.rotating-ring":"rotatingRing","delivery.pattern.burst":"burst"});
const kind=moduleKinds[context.identity.moduleId];if(!kind)throw new Error("unknown delivery formation");
const centeredOrder=count=>{const result=[];if(count%2===1)result.push(0);for(let step=0;result.length<count;step+=1){const offset=count%2===1?step+1:step+.5;result.push(-offset);if(result.length<count)result.push(offset);}return result;};
const finite=field=>{const value=config[field];if(typeof value!=="number"||!Number.isFinite(value))throw new Error("invalid formation field: "+field);return value;};
const fanAngles=(center,arc,count)=>{if(count===1)return[center];if(Math.abs(arc-Math.PI*2)<=1e-12)return centeredOrder(count).map(offset=>center+offset*arc/count);const step=arc/(count-1);return centeredOrder(count).map(offset=>center+offset*step);};
const planFormation=(count,targetDirection,emissionIndex)=>{const degrees=value=>value*Math.PI/180;let center=Math.atan2(targetDirection.y,targetDirection.x);let angles;let spacing=0;if(kind==="spread")angles=fanAngles(center,degrees(finite("totalArcDegrees")),count);else if(kind==="multi-shot"){spacing=finite("lateralSpacing");angles=Array.from({length:count},()=>center);}else if(kind==="radial"){center+=degrees(finite("baseAngleOffsetDegrees"));angles=Array.from({length:count},(_,index)=>center+index*Math.PI*2/count);}else if(kind==="spiral"){center+=emissionIndex*degrees(finite("rotationStepDegrees"));angles=Array.from({length:count},(_,index)=>center+index*Math.PI*2/count);}else if(kind==="fan")angles=fanAngles(center,degrees(finite("arcDegrees")),count);else if(kind==="aimed")angles=fanAngles(center,degrees(finite("aimSpreadDegrees")),count);else if(kind==="wave"){const spread=degrees(finite("waveSpreadDegrees"));center+=Math.sin(emissionIndex*degrees(finite("phaseStepDegrees")))*spread/2;angles=fanAngles(center,spread,count);}else if(kind==="rain"){const downward=config.downwardBaseDirection;const magnitude=Math.hypot(downward.x,downward.y);if(!Number.isFinite(magnitude)||magnitude<=0)throw new Error("invalid rain direction");center=Math.atan2(downward.y/magnitude,downward.x/magnitude);angles=fanAngles(center,degrees(finite("spreadDegrees")),count);}else if(kind==="rotatingRing"){center+=emissionIndex*degrees(finite("ringRotationStepDegrees"));angles=Array.from({length:count},(_,index)=>center+index*Math.PI*2/count);}else angles=fanAngles(center,degrees(finite("burstSpreadDegrees")),count);const offsets=centeredOrder(count);return Object.freeze(angles.map((angle,index)=>Object.freeze({direction:Object.freeze({x:Math.cos(angle),y:Math.sin(angle)}),lateralOffset:Object.freeze({x:-Math.sin(center)*offsets[index]*spacing,y:Math.cos(center)*offsets[index]*spacing})})));};
let target;let emissionIndex=0;let emissionSequence=0;let modifierRevision=0;let damageBonus=0;let countBonus=0;const active=[];
const publishModifier=(fieldId,current,maximum)=>context.ports.publishState("modifier-state",Object.freeze({revision:modifierRevision++,emittedAtMs:context.clock.nowMs(),fieldId,current,minimum:0,maximum}));
context.ports.declareHandler("target",value=>{if(value.attackChannelId!==config.attackChannelId)throw new Error("target channel mismatch");const magnitude=Math.hypot(value.direction.x,value.direction.y);if(!Number.isFinite(magnitude)||Math.abs(magnitude-1)>1e-6)throw new Error("invalid target direction");target=Object.freeze({x:value.direction.x,y:value.direction.y});});
const applyModifier=value=>{if(value.targetInstanceId!==context.identity.instanceId||value.operation!=="add"||!Number.isFinite(value.value)||value.value<=0)throw new Error("invalid delivery modifier application");if(value.fieldId==="attack.damage.multiplier"){damageBonus=Math.min(config.maximumDamageMultiplier-1,damageBonus+value.value);publishModifier(value.fieldId,damageBonus,config.maximumDamageMultiplier-1);return;}if(value.fieldId==="attack.projectile-count.bonus"){if(!Number.isSafeInteger(value.value))throw new Error("projectile count bonus must be an integer");countBonus=Math.min(config.maximumCountBonus,countBonus+value.value);publishModifier(value.fieldId,countBonus,config.maximumCountBonus);return;}throw new Error("unknown delivery modifier target");};
context.ports.declareAddressedHandler("attack.damage.multiplier",applyModifier);
context.ports.declareAddressedHandler("attack.projectile-count.bonus",applyModifier);
context.ports.declareHandler("request",request=>{if(request.attackChannelId!==config.attackChannelId)throw new Error("request channel mismatch");if(!target)throw new Error("attack before target solution");if(emissionIndex>=Number.MAX_SAFE_INTEGER)throw new Error("delivery emission index exhausted");const now=context.clock.nowMs();const effectiveCount=config.baseCount+Math.min(countBonus,config.maximumCountBonus);const effectiveDamage=config.baseDamage*Math.min(1+damageBonus,config.maximumDamageMultiplier);const owner=context.services.actors.readOwner();if(!owner||owner.active!==true)throw new Error("inactive projectile owner");const textureKey=context.assets.requireTexture(config.textureRole);const requestPlan=planFormation(effectiveCount,target,emissionIndex++).map(spawn=>{const position=Object.freeze({x:owner.position.x+config.spawnOffset.x+spawn.lateralOffset.x,y:owner.position.y+config.spawnOffset.y+spawn.lateralOffset.y});const velocity=Object.freeze({x:spawn.direction.x*config.speed,y:spawn.direction.y*config.speed});return Object.freeze({position,velocity,damage:effectiveDamage,textureKey});});const result=context.services.projectileDelivery.admit(request.sequence,requestPlan);if(!result.accepted)return;if(result.activated.length>Number.MAX_SAFE_INTEGER-emissionSequence)throw new Error("delivery emission sequence block exhausted");for(let index=0;index<result.activated.length;index+=1){const reference=result.activated[index];const spawn=requestPlan[index];active.push({reference,position:{x:spawn.position.x,y:spawn.position.y},velocity:spawn.velocity});context.ports.emitEvent("emission",Object.freeze({sequence:emissionSequence++,emittedAtMs:now,entityId:reference.entityId,channelId:reference.channelId,ownerActorId:reference.ownerActorId,position:spawn.position,velocity:spawn.velocity,damage:effectiveDamage,generation:reference.generation}));}});
const recycleAll=()=>{active.splice(0);};
return Object.freeze({instanceId:context.identity.instanceId,initialize(){context.assets.requireTexture(config.textureRole);context.ports.publishState("projectiles",Object.freeze({revision:0,emittedAtMs:context.clock.nowMs(),channelId:context.identity.instanceId+".projectiles",ownerInstanceId:context.identity.instanceId,ownerActorId:context.identity.ownerId,entityRole:"projectile",generation:0}));publishModifier("attack.damage.multiplier",0,config.maximumDamageMultiplier-1);publishModifier("attack.projectile-count.bonus",0,config.maximumCountBonus);context.services.observation.register("delivery",()=>({...context.services.projectileDelivery.observe(),emissionIndex,damageBonus,countBonus}));},update(deltaMs){if(!Number.isFinite(deltaMs)||deltaMs<0)throw new Error("invalid delivery delta");const viewport=context.services.viewport.read();for(let index=active.length-1;index>=0;index-=1){const record=active[index];record.position.x+=record.velocity.x*deltaMs/1000;record.position.y+=record.velocity.y*deltaMs/1000;const margin=config.recycleMargin;if(record.position.x < -margin||record.position.x > viewport.width+margin||record.position.y < -margin||record.position.y > viewport.height+margin){context.services.projectileDelivery.recycle(record.reference);active.splice(index,1);}}},stop(){recycleAll();},dispose(){recycleAll();target=undefined;damageBonus=0;countBonus=0;}});}

export function batch2Executable23(context){
const config=context.configuration;
const moduleKinds=Object.freeze({"delivery.spread":"spread","delivery.multi-shot":"multi-shot","delivery.pattern.radial":"radial","delivery.pattern.spiral":"spiral","delivery.pattern.fan":"fan","delivery.pattern.aimed":"aimed","delivery.pattern.wave":"wave","delivery.pattern.rain":"rain","delivery.pattern.rotating-ring":"rotatingRing","delivery.pattern.burst":"burst"});
const kind=moduleKinds[context.identity.moduleId];if(!kind)throw new Error("unknown delivery formation");
const centeredOrder=count=>{const result=[];if(count%2===1)result.push(0);for(let step=0;result.length<count;step+=1){const offset=count%2===1?step+1:step+.5;result.push(-offset);if(result.length<count)result.push(offset);}return result;};
const finite=field=>{const value=config[field];if(typeof value!=="number"||!Number.isFinite(value))throw new Error("invalid formation field: "+field);return value;};
const fanAngles=(center,arc,count)=>{if(count===1)return[center];if(Math.abs(arc-Math.PI*2)<=1e-12)return centeredOrder(count).map(offset=>center+offset*arc/count);const step=arc/(count-1);return centeredOrder(count).map(offset=>center+offset*step);};
const planFormation=(count,targetDirection,emissionIndex)=>{const degrees=value=>value*Math.PI/180;let center=Math.atan2(targetDirection.y,targetDirection.x);let angles;let spacing=0;if(kind==="spread")angles=fanAngles(center,degrees(finite("totalArcDegrees")),count);else if(kind==="multi-shot"){spacing=finite("lateralSpacing");angles=Array.from({length:count},()=>center);}else if(kind==="radial"){center+=degrees(finite("baseAngleOffsetDegrees"));angles=Array.from({length:count},(_,index)=>center+index*Math.PI*2/count);}else if(kind==="spiral"){center+=emissionIndex*degrees(finite("rotationStepDegrees"));angles=Array.from({length:count},(_,index)=>center+index*Math.PI*2/count);}else if(kind==="fan")angles=fanAngles(center,degrees(finite("arcDegrees")),count);else if(kind==="aimed")angles=fanAngles(center,degrees(finite("aimSpreadDegrees")),count);else if(kind==="wave"){const spread=degrees(finite("waveSpreadDegrees"));center+=Math.sin(emissionIndex*degrees(finite("phaseStepDegrees")))*spread/2;angles=fanAngles(center,spread,count);}else if(kind==="rain"){const downward=config.downwardBaseDirection;const magnitude=Math.hypot(downward.x,downward.y);if(!Number.isFinite(magnitude)||magnitude<=0)throw new Error("invalid rain direction");center=Math.atan2(downward.y/magnitude,downward.x/magnitude);angles=fanAngles(center,degrees(finite("spreadDegrees")),count);}else if(kind==="rotatingRing"){center+=emissionIndex*degrees(finite("ringRotationStepDegrees"));angles=Array.from({length:count},(_,index)=>center+index*Math.PI*2/count);}else angles=fanAngles(center,degrees(finite("burstSpreadDegrees")),count);const offsets=centeredOrder(count);return Object.freeze(angles.map((angle,index)=>Object.freeze({direction:Object.freeze({x:Math.cos(angle),y:Math.sin(angle)}),lateralOffset:Object.freeze({x:-Math.sin(center)*offsets[index]*spacing,y:Math.cos(center)*offsets[index]*spacing})})));};
let target;let emissionIndex=0;let emissionSequence=0;let modifierRevision=0;let damageBonus=0;let countBonus=0;const active=[];
const publishModifier=(fieldId,current,maximum)=>context.ports.publishState("modifier-state",Object.freeze({revision:modifierRevision++,emittedAtMs:context.clock.nowMs(),fieldId,current,minimum:0,maximum}));
context.ports.declareHandler("target",value=>{if(value.attackChannelId!==config.attackChannelId)throw new Error("target channel mismatch");const magnitude=Math.hypot(value.direction.x,value.direction.y);if(!Number.isFinite(magnitude)||Math.abs(magnitude-1)>1e-6)throw new Error("invalid target direction");target=Object.freeze({x:value.direction.x,y:value.direction.y});});
const applyModifier=value=>{if(value.targetInstanceId!==context.identity.instanceId||value.operation!=="add"||!Number.isFinite(value.value)||value.value<=0)throw new Error("invalid delivery modifier application");if(value.fieldId==="attack.damage.multiplier"){damageBonus=Math.min(config.maximumDamageMultiplier-1,damageBonus+value.value);publishModifier(value.fieldId,damageBonus,config.maximumDamageMultiplier-1);return;}if(value.fieldId==="attack.projectile-count.bonus"){if(!Number.isSafeInteger(value.value))throw new Error("projectile count bonus must be an integer");countBonus=Math.min(config.maximumCountBonus,countBonus+value.value);publishModifier(value.fieldId,countBonus,config.maximumCountBonus);return;}throw new Error("unknown delivery modifier target");};
context.ports.declareAddressedHandler("attack.damage.multiplier",applyModifier);
context.ports.declareAddressedHandler("attack.projectile-count.bonus",applyModifier);
context.ports.declareHandler("request",request=>{if(request.attackChannelId!==config.attackChannelId)throw new Error("request channel mismatch");if(!target)throw new Error("attack before target solution");if(emissionIndex>=Number.MAX_SAFE_INTEGER)throw new Error("delivery emission index exhausted");const now=context.clock.nowMs();const effectiveCount=config.baseCount+Math.min(countBonus,config.maximumCountBonus);const effectiveDamage=config.baseDamage*Math.min(1+damageBonus,config.maximumDamageMultiplier);const owner=context.services.actors.readOwner();if(!owner||owner.active!==true)throw new Error("inactive projectile owner");const textureKey=context.assets.requireTexture(config.textureRole);const requestPlan=planFormation(effectiveCount,target,emissionIndex++).map(spawn=>{const position=Object.freeze({x:owner.position.x+config.spawnOffset.x+spawn.lateralOffset.x,y:owner.position.y+config.spawnOffset.y+spawn.lateralOffset.y});const velocity=Object.freeze({x:spawn.direction.x*config.speed,y:spawn.direction.y*config.speed});return Object.freeze({position,velocity,damage:effectiveDamage,textureKey});});const result=context.services.projectileDelivery.admit(request.sequence,requestPlan);if(!result.accepted)return;if(result.activated.length>Number.MAX_SAFE_INTEGER-emissionSequence)throw new Error("delivery emission sequence block exhausted");for(let index=0;index<result.activated.length;index+=1){const reference=result.activated[index];const spawn=requestPlan[index];active.push({reference,position:{x:spawn.position.x,y:spawn.position.y},velocity:spawn.velocity});context.ports.emitEvent("emission",Object.freeze({sequence:emissionSequence++,emittedAtMs:now,entityId:reference.entityId,channelId:reference.channelId,ownerActorId:reference.ownerActorId,position:spawn.position,velocity:spawn.velocity,damage:effectiveDamage,generation:reference.generation}));}});
const recycleAll=()=>{active.splice(0);};
return Object.freeze({instanceId:context.identity.instanceId,initialize(){context.assets.requireTexture(config.textureRole);context.ports.publishState("projectiles",Object.freeze({revision:0,emittedAtMs:context.clock.nowMs(),channelId:context.identity.instanceId+".projectiles",ownerInstanceId:context.identity.instanceId,ownerActorId:context.identity.ownerId,entityRole:"projectile",generation:0}));publishModifier("attack.damage.multiplier",0,config.maximumDamageMultiplier-1);publishModifier("attack.projectile-count.bonus",0,config.maximumCountBonus);context.services.observation.register("delivery",()=>({...context.services.projectileDelivery.observe(),emissionIndex,damageBonus,countBonus}));},update(deltaMs){if(!Number.isFinite(deltaMs)||deltaMs<0)throw new Error("invalid delivery delta");const viewport=context.services.viewport.read();for(let index=active.length-1;index>=0;index-=1){const record=active[index];record.position.x+=record.velocity.x*deltaMs/1000;record.position.y+=record.velocity.y*deltaMs/1000;const margin=config.recycleMargin;if(record.position.x < -margin||record.position.x > viewport.width+margin||record.position.y < -margin||record.position.y > viewport.height+margin){context.services.projectileDelivery.recycle(record.reference);active.splice(index,1);}}},stop(){recycleAll();},dispose(){recycleAll();target=undefined;damageBonus=0;countBonus=0;}});}

export function batch2Executable24(context){
const config=context.configuration;
const moduleKinds=Object.freeze({"delivery.spread":"spread","delivery.multi-shot":"multi-shot","delivery.pattern.radial":"radial","delivery.pattern.spiral":"spiral","delivery.pattern.fan":"fan","delivery.pattern.aimed":"aimed","delivery.pattern.wave":"wave","delivery.pattern.rain":"rain","delivery.pattern.rotating-ring":"rotatingRing","delivery.pattern.burst":"burst"});
const kind=moduleKinds[context.identity.moduleId];if(!kind)throw new Error("unknown delivery formation");
const centeredOrder=count=>{const result=[];if(count%2===1)result.push(0);for(let step=0;result.length<count;step+=1){const offset=count%2===1?step+1:step+.5;result.push(-offset);if(result.length<count)result.push(offset);}return result;};
const finite=field=>{const value=config[field];if(typeof value!=="number"||!Number.isFinite(value))throw new Error("invalid formation field: "+field);return value;};
const fanAngles=(center,arc,count)=>{if(count===1)return[center];if(Math.abs(arc-Math.PI*2)<=1e-12)return centeredOrder(count).map(offset=>center+offset*arc/count);const step=arc/(count-1);return centeredOrder(count).map(offset=>center+offset*step);};
const planFormation=(count,targetDirection,emissionIndex)=>{const degrees=value=>value*Math.PI/180;let center=Math.atan2(targetDirection.y,targetDirection.x);let angles;let spacing=0;if(kind==="spread")angles=fanAngles(center,degrees(finite("totalArcDegrees")),count);else if(kind==="multi-shot"){spacing=finite("lateralSpacing");angles=Array.from({length:count},()=>center);}else if(kind==="radial"){center+=degrees(finite("baseAngleOffsetDegrees"));angles=Array.from({length:count},(_,index)=>center+index*Math.PI*2/count);}else if(kind==="spiral"){center+=emissionIndex*degrees(finite("rotationStepDegrees"));angles=Array.from({length:count},(_,index)=>center+index*Math.PI*2/count);}else if(kind==="fan")angles=fanAngles(center,degrees(finite("arcDegrees")),count);else if(kind==="aimed")angles=fanAngles(center,degrees(finite("aimSpreadDegrees")),count);else if(kind==="wave"){const spread=degrees(finite("waveSpreadDegrees"));center+=Math.sin(emissionIndex*degrees(finite("phaseStepDegrees")))*spread/2;angles=fanAngles(center,spread,count);}else if(kind==="rain"){const downward=config.downwardBaseDirection;const magnitude=Math.hypot(downward.x,downward.y);if(!Number.isFinite(magnitude)||magnitude<=0)throw new Error("invalid rain direction");center=Math.atan2(downward.y/magnitude,downward.x/magnitude);angles=fanAngles(center,degrees(finite("spreadDegrees")),count);}else if(kind==="rotatingRing"){center+=emissionIndex*degrees(finite("ringRotationStepDegrees"));angles=Array.from({length:count},(_,index)=>center+index*Math.PI*2/count);}else angles=fanAngles(center,degrees(finite("burstSpreadDegrees")),count);const offsets=centeredOrder(count);return Object.freeze(angles.map((angle,index)=>Object.freeze({direction:Object.freeze({x:Math.cos(angle),y:Math.sin(angle)}),lateralOffset:Object.freeze({x:-Math.sin(center)*offsets[index]*spacing,y:Math.cos(center)*offsets[index]*spacing})})));};
let target;let emissionIndex=0;let emissionSequence=0;let modifierRevision=0;let damageBonus=0;let countBonus=0;const active=[];
const publishModifier=(fieldId,current,maximum)=>context.ports.publishState("modifier-state",Object.freeze({revision:modifierRevision++,emittedAtMs:context.clock.nowMs(),fieldId,current,minimum:0,maximum}));
context.ports.declareHandler("target",value=>{if(value.attackChannelId!==config.attackChannelId)throw new Error("target channel mismatch");const magnitude=Math.hypot(value.direction.x,value.direction.y);if(!Number.isFinite(magnitude)||Math.abs(magnitude-1)>1e-6)throw new Error("invalid target direction");target=Object.freeze({x:value.direction.x,y:value.direction.y});});
const applyModifier=value=>{if(value.targetInstanceId!==context.identity.instanceId||value.operation!=="add"||!Number.isFinite(value.value)||value.value<=0)throw new Error("invalid delivery modifier application");if(value.fieldId==="attack.damage.multiplier"){damageBonus=Math.min(config.maximumDamageMultiplier-1,damageBonus+value.value);publishModifier(value.fieldId,damageBonus,config.maximumDamageMultiplier-1);return;}if(value.fieldId==="attack.projectile-count.bonus"){if(!Number.isSafeInteger(value.value))throw new Error("projectile count bonus must be an integer");countBonus=Math.min(config.maximumCountBonus,countBonus+value.value);publishModifier(value.fieldId,countBonus,config.maximumCountBonus);return;}throw new Error("unknown delivery modifier target");};
context.ports.declareAddressedHandler("attack.damage.multiplier",applyModifier);
context.ports.declareAddressedHandler("attack.projectile-count.bonus",applyModifier);
context.ports.declareHandler("request",request=>{if(request.attackChannelId!==config.attackChannelId)throw new Error("request channel mismatch");if(!target)throw new Error("attack before target solution");if(emissionIndex>=Number.MAX_SAFE_INTEGER)throw new Error("delivery emission index exhausted");const now=context.clock.nowMs();const effectiveCount=config.baseCount+Math.min(countBonus,config.maximumCountBonus);const effectiveDamage=config.baseDamage*Math.min(1+damageBonus,config.maximumDamageMultiplier);const owner=context.services.actors.readOwner();if(!owner||owner.active!==true)throw new Error("inactive projectile owner");const textureKey=context.assets.requireTexture(config.textureRole);const requestPlan=planFormation(effectiveCount,target,emissionIndex++).map(spawn=>{const position=Object.freeze({x:owner.position.x+config.spawnOffset.x+spawn.lateralOffset.x,y:owner.position.y+config.spawnOffset.y+spawn.lateralOffset.y});const velocity=Object.freeze({x:spawn.direction.x*config.speed,y:spawn.direction.y*config.speed});return Object.freeze({position,velocity,damage:effectiveDamage,textureKey});});const result=context.services.projectileDelivery.admit(request.sequence,requestPlan);if(!result.accepted)return;if(result.activated.length>Number.MAX_SAFE_INTEGER-emissionSequence)throw new Error("delivery emission sequence block exhausted");for(let index=0;index<result.activated.length;index+=1){const reference=result.activated[index];const spawn=requestPlan[index];active.push({reference,position:{x:spawn.position.x,y:spawn.position.y},velocity:spawn.velocity});context.ports.emitEvent("emission",Object.freeze({sequence:emissionSequence++,emittedAtMs:now,entityId:reference.entityId,channelId:reference.channelId,ownerActorId:reference.ownerActorId,position:spawn.position,velocity:spawn.velocity,damage:effectiveDamage,generation:reference.generation}));}});
const recycleAll=()=>{active.splice(0);};
return Object.freeze({instanceId:context.identity.instanceId,initialize(){context.assets.requireTexture(config.textureRole);context.ports.publishState("projectiles",Object.freeze({revision:0,emittedAtMs:context.clock.nowMs(),channelId:context.identity.instanceId+".projectiles",ownerInstanceId:context.identity.instanceId,ownerActorId:context.identity.ownerId,entityRole:"projectile",generation:0}));publishModifier("attack.damage.multiplier",0,config.maximumDamageMultiplier-1);publishModifier("attack.projectile-count.bonus",0,config.maximumCountBonus);context.services.observation.register("delivery",()=>({...context.services.projectileDelivery.observe(),emissionIndex,damageBonus,countBonus}));},update(deltaMs){if(!Number.isFinite(deltaMs)||deltaMs<0)throw new Error("invalid delivery delta");const viewport=context.services.viewport.read();for(let index=active.length-1;index>=0;index-=1){const record=active[index];record.position.x+=record.velocity.x*deltaMs/1000;record.position.y+=record.velocity.y*deltaMs/1000;const margin=config.recycleMargin;if(record.position.x < -margin||record.position.x > viewport.width+margin||record.position.y < -margin||record.position.y > viewport.height+margin){context.services.projectileDelivery.recycle(record.reference);active.splice(index,1);}}},stop(){recycleAll();},dispose(){recycleAll();target=undefined;damageBonus=0;countBonus=0;}});}

export function batch2Executable25(context){
const config=context.configuration;
const moduleKinds=Object.freeze({"delivery.spread":"spread","delivery.multi-shot":"multi-shot","delivery.pattern.radial":"radial","delivery.pattern.spiral":"spiral","delivery.pattern.fan":"fan","delivery.pattern.aimed":"aimed","delivery.pattern.wave":"wave","delivery.pattern.rain":"rain","delivery.pattern.rotating-ring":"rotatingRing","delivery.pattern.burst":"burst"});
const kind=moduleKinds[context.identity.moduleId];if(!kind)throw new Error("unknown delivery formation");
const centeredOrder=count=>{const result=[];if(count%2===1)result.push(0);for(let step=0;result.length<count;step+=1){const offset=count%2===1?step+1:step+.5;result.push(-offset);if(result.length<count)result.push(offset);}return result;};
const finite=field=>{const value=config[field];if(typeof value!=="number"||!Number.isFinite(value))throw new Error("invalid formation field: "+field);return value;};
const fanAngles=(center,arc,count)=>{if(count===1)return[center];if(Math.abs(arc-Math.PI*2)<=1e-12)return centeredOrder(count).map(offset=>center+offset*arc/count);const step=arc/(count-1);return centeredOrder(count).map(offset=>center+offset*step);};
const planFormation=(count,targetDirection,emissionIndex)=>{const degrees=value=>value*Math.PI/180;let center=Math.atan2(targetDirection.y,targetDirection.x);let angles;let spacing=0;if(kind==="spread")angles=fanAngles(center,degrees(finite("totalArcDegrees")),count);else if(kind==="multi-shot"){spacing=finite("lateralSpacing");angles=Array.from({length:count},()=>center);}else if(kind==="radial"){center+=degrees(finite("baseAngleOffsetDegrees"));angles=Array.from({length:count},(_,index)=>center+index*Math.PI*2/count);}else if(kind==="spiral"){center+=emissionIndex*degrees(finite("rotationStepDegrees"));angles=Array.from({length:count},(_,index)=>center+index*Math.PI*2/count);}else if(kind==="fan")angles=fanAngles(center,degrees(finite("arcDegrees")),count);else if(kind==="aimed")angles=fanAngles(center,degrees(finite("aimSpreadDegrees")),count);else if(kind==="wave"){const spread=degrees(finite("waveSpreadDegrees"));center+=Math.sin(emissionIndex*degrees(finite("phaseStepDegrees")))*spread/2;angles=fanAngles(center,spread,count);}else if(kind==="rain"){const downward=config.downwardBaseDirection;const magnitude=Math.hypot(downward.x,downward.y);if(!Number.isFinite(magnitude)||magnitude<=0)throw new Error("invalid rain direction");center=Math.atan2(downward.y/magnitude,downward.x/magnitude);angles=fanAngles(center,degrees(finite("spreadDegrees")),count);}else if(kind==="rotatingRing"){center+=emissionIndex*degrees(finite("ringRotationStepDegrees"));angles=Array.from({length:count},(_,index)=>center+index*Math.PI*2/count);}else angles=fanAngles(center,degrees(finite("burstSpreadDegrees")),count);const offsets=centeredOrder(count);return Object.freeze(angles.map((angle,index)=>Object.freeze({direction:Object.freeze({x:Math.cos(angle),y:Math.sin(angle)}),lateralOffset:Object.freeze({x:-Math.sin(center)*offsets[index]*spacing,y:Math.cos(center)*offsets[index]*spacing})})));};
let target;let emissionIndex=0;let emissionSequence=0;let modifierRevision=0;let damageBonus=0;let countBonus=0;const active=[];
const publishModifier=(fieldId,current,maximum)=>context.ports.publishState("modifier-state",Object.freeze({revision:modifierRevision++,emittedAtMs:context.clock.nowMs(),fieldId,current,minimum:0,maximum}));
context.ports.declareHandler("target",value=>{if(value.attackChannelId!==config.attackChannelId)throw new Error("target channel mismatch");const magnitude=Math.hypot(value.direction.x,value.direction.y);if(!Number.isFinite(magnitude)||Math.abs(magnitude-1)>1e-6)throw new Error("invalid target direction");target=Object.freeze({x:value.direction.x,y:value.direction.y});});
const applyModifier=value=>{if(value.targetInstanceId!==context.identity.instanceId||value.operation!=="add"||!Number.isFinite(value.value)||value.value<=0)throw new Error("invalid delivery modifier application");if(value.fieldId==="attack.damage.multiplier"){damageBonus=Math.min(config.maximumDamageMultiplier-1,damageBonus+value.value);publishModifier(value.fieldId,damageBonus,config.maximumDamageMultiplier-1);return;}if(value.fieldId==="attack.projectile-count.bonus"){if(!Number.isSafeInteger(value.value))throw new Error("projectile count bonus must be an integer");countBonus=Math.min(config.maximumCountBonus,countBonus+value.value);publishModifier(value.fieldId,countBonus,config.maximumCountBonus);return;}throw new Error("unknown delivery modifier target");};
context.ports.declareAddressedHandler("attack.damage.multiplier",applyModifier);
context.ports.declareAddressedHandler("attack.projectile-count.bonus",applyModifier);
context.ports.declareHandler("request",request=>{if(request.attackChannelId!==config.attackChannelId)throw new Error("request channel mismatch");if(!target)throw new Error("attack before target solution");if(emissionIndex>=Number.MAX_SAFE_INTEGER)throw new Error("delivery emission index exhausted");const now=context.clock.nowMs();const effectiveCount=config.baseCount+Math.min(countBonus,config.maximumCountBonus);const effectiveDamage=config.baseDamage*Math.min(1+damageBonus,config.maximumDamageMultiplier);const owner=context.services.actors.readOwner();if(!owner||owner.active!==true)throw new Error("inactive projectile owner");const textureKey=context.assets.requireTexture(config.textureRole);const requestPlan=planFormation(effectiveCount,target,emissionIndex++).map(spawn=>{const position=Object.freeze({x:owner.position.x+config.spawnOffset.x+spawn.lateralOffset.x,y:owner.position.y+config.spawnOffset.y+spawn.lateralOffset.y});const velocity=Object.freeze({x:spawn.direction.x*config.speed,y:spawn.direction.y*config.speed});return Object.freeze({position,velocity,damage:effectiveDamage,textureKey});});const result=context.services.projectileDelivery.admit(request.sequence,requestPlan);if(!result.accepted)return;if(result.activated.length>Number.MAX_SAFE_INTEGER-emissionSequence)throw new Error("delivery emission sequence block exhausted");for(let index=0;index<result.activated.length;index+=1){const reference=result.activated[index];const spawn=requestPlan[index];active.push({reference,position:{x:spawn.position.x,y:spawn.position.y},velocity:spawn.velocity});context.ports.emitEvent("emission",Object.freeze({sequence:emissionSequence++,emittedAtMs:now,entityId:reference.entityId,channelId:reference.channelId,ownerActorId:reference.ownerActorId,position:spawn.position,velocity:spawn.velocity,damage:effectiveDamage,generation:reference.generation}));}});
const recycleAll=()=>{active.splice(0);};
return Object.freeze({instanceId:context.identity.instanceId,initialize(){context.assets.requireTexture(config.textureRole);context.ports.publishState("projectiles",Object.freeze({revision:0,emittedAtMs:context.clock.nowMs(),channelId:context.identity.instanceId+".projectiles",ownerInstanceId:context.identity.instanceId,ownerActorId:context.identity.ownerId,entityRole:"projectile",generation:0}));publishModifier("attack.damage.multiplier",0,config.maximumDamageMultiplier-1);publishModifier("attack.projectile-count.bonus",0,config.maximumCountBonus);context.services.observation.register("delivery",()=>({...context.services.projectileDelivery.observe(),emissionIndex,damageBonus,countBonus}));},update(deltaMs){if(!Number.isFinite(deltaMs)||deltaMs<0)throw new Error("invalid delivery delta");const viewport=context.services.viewport.read();for(let index=active.length-1;index>=0;index-=1){const record=active[index];record.position.x+=record.velocity.x*deltaMs/1000;record.position.y+=record.velocity.y*deltaMs/1000;const margin=config.recycleMargin;if(record.position.x < -margin||record.position.x > viewport.width+margin||record.position.y < -margin||record.position.y > viewport.height+margin){context.services.projectileDelivery.recycle(record.reference);active.splice(index,1);}}},stop(){recycleAll();},dispose(){recycleAll();target=undefined;damageBonus=0;countBonus=0;}});}

export function batch2Executable26(context){
const config=context.configuration;
const moduleKinds=Object.freeze({"delivery.spread":"spread","delivery.multi-shot":"multi-shot","delivery.pattern.radial":"radial","delivery.pattern.spiral":"spiral","delivery.pattern.fan":"fan","delivery.pattern.aimed":"aimed","delivery.pattern.wave":"wave","delivery.pattern.rain":"rain","delivery.pattern.rotating-ring":"rotatingRing","delivery.pattern.burst":"burst"});
const kind=moduleKinds[context.identity.moduleId];if(!kind)throw new Error("unknown delivery formation");
const centeredOrder=count=>{const result=[];if(count%2===1)result.push(0);for(let step=0;result.length<count;step+=1){const offset=count%2===1?step+1:step+.5;result.push(-offset);if(result.length<count)result.push(offset);}return result;};
const finite=field=>{const value=config[field];if(typeof value!=="number"||!Number.isFinite(value))throw new Error("invalid formation field: "+field);return value;};
const fanAngles=(center,arc,count)=>{if(count===1)return[center];if(Math.abs(arc-Math.PI*2)<=1e-12)return centeredOrder(count).map(offset=>center+offset*arc/count);const step=arc/(count-1);return centeredOrder(count).map(offset=>center+offset*step);};
const planFormation=(count,targetDirection,emissionIndex)=>{const degrees=value=>value*Math.PI/180;let center=Math.atan2(targetDirection.y,targetDirection.x);let angles;let spacing=0;if(kind==="spread")angles=fanAngles(center,degrees(finite("totalArcDegrees")),count);else if(kind==="multi-shot"){spacing=finite("lateralSpacing");angles=Array.from({length:count},()=>center);}else if(kind==="radial"){center+=degrees(finite("baseAngleOffsetDegrees"));angles=Array.from({length:count},(_,index)=>center+index*Math.PI*2/count);}else if(kind==="spiral"){center+=emissionIndex*degrees(finite("rotationStepDegrees"));angles=Array.from({length:count},(_,index)=>center+index*Math.PI*2/count);}else if(kind==="fan")angles=fanAngles(center,degrees(finite("arcDegrees")),count);else if(kind==="aimed")angles=fanAngles(center,degrees(finite("aimSpreadDegrees")),count);else if(kind==="wave"){const spread=degrees(finite("waveSpreadDegrees"));center+=Math.sin(emissionIndex*degrees(finite("phaseStepDegrees")))*spread/2;angles=fanAngles(center,spread,count);}else if(kind==="rain"){const downward=config.downwardBaseDirection;const magnitude=Math.hypot(downward.x,downward.y);if(!Number.isFinite(magnitude)||magnitude<=0)throw new Error("invalid rain direction");center=Math.atan2(downward.y/magnitude,downward.x/magnitude);angles=fanAngles(center,degrees(finite("spreadDegrees")),count);}else if(kind==="rotatingRing"){center+=emissionIndex*degrees(finite("ringRotationStepDegrees"));angles=Array.from({length:count},(_,index)=>center+index*Math.PI*2/count);}else angles=fanAngles(center,degrees(finite("burstSpreadDegrees")),count);const offsets=centeredOrder(count);return Object.freeze(angles.map((angle,index)=>Object.freeze({direction:Object.freeze({x:Math.cos(angle),y:Math.sin(angle)}),lateralOffset:Object.freeze({x:-Math.sin(center)*offsets[index]*spacing,y:Math.cos(center)*offsets[index]*spacing})})));};
let target;let emissionIndex=0;let emissionSequence=0;let modifierRevision=0;let damageBonus=0;let countBonus=0;const active=[];
const publishModifier=(fieldId,current,maximum)=>context.ports.publishState("modifier-state",Object.freeze({revision:modifierRevision++,emittedAtMs:context.clock.nowMs(),fieldId,current,minimum:0,maximum}));
context.ports.declareHandler("target",value=>{if(value.attackChannelId!==config.attackChannelId)throw new Error("target channel mismatch");const magnitude=Math.hypot(value.direction.x,value.direction.y);if(!Number.isFinite(magnitude)||Math.abs(magnitude-1)>1e-6)throw new Error("invalid target direction");target=Object.freeze({x:value.direction.x,y:value.direction.y});});
const applyModifier=value=>{if(value.targetInstanceId!==context.identity.instanceId||value.operation!=="add"||!Number.isFinite(value.value)||value.value<=0)throw new Error("invalid delivery modifier application");if(value.fieldId==="attack.damage.multiplier"){damageBonus=Math.min(config.maximumDamageMultiplier-1,damageBonus+value.value);publishModifier(value.fieldId,damageBonus,config.maximumDamageMultiplier-1);return;}if(value.fieldId==="attack.projectile-count.bonus"){if(!Number.isSafeInteger(value.value))throw new Error("projectile count bonus must be an integer");countBonus=Math.min(config.maximumCountBonus,countBonus+value.value);publishModifier(value.fieldId,countBonus,config.maximumCountBonus);return;}throw new Error("unknown delivery modifier target");};
context.ports.declareAddressedHandler("attack.damage.multiplier",applyModifier);
context.ports.declareAddressedHandler("attack.projectile-count.bonus",applyModifier);
context.ports.declareHandler("request",request=>{if(request.attackChannelId!==config.attackChannelId)throw new Error("request channel mismatch");if(!target)throw new Error("attack before target solution");if(emissionIndex>=Number.MAX_SAFE_INTEGER)throw new Error("delivery emission index exhausted");const now=context.clock.nowMs();const effectiveCount=config.baseCount+Math.min(countBonus,config.maximumCountBonus);const effectiveDamage=config.baseDamage*Math.min(1+damageBonus,config.maximumDamageMultiplier);const owner=context.services.actors.readOwner();if(!owner||owner.active!==true)throw new Error("inactive projectile owner");const textureKey=context.assets.requireTexture(config.textureRole);const requestPlan=planFormation(effectiveCount,target,emissionIndex++).map(spawn=>{const position=Object.freeze({x:owner.position.x+config.spawnOffset.x+spawn.lateralOffset.x,y:owner.position.y+config.spawnOffset.y+spawn.lateralOffset.y});const velocity=Object.freeze({x:spawn.direction.x*config.speed,y:spawn.direction.y*config.speed});return Object.freeze({position,velocity,damage:effectiveDamage,textureKey});});const result=context.services.projectileDelivery.admit(request.sequence,requestPlan);if(!result.accepted)return;if(result.activated.length>Number.MAX_SAFE_INTEGER-emissionSequence)throw new Error("delivery emission sequence block exhausted");for(let index=0;index<result.activated.length;index+=1){const reference=result.activated[index];const spawn=requestPlan[index];active.push({reference,position:{x:spawn.position.x,y:spawn.position.y},velocity:spawn.velocity});context.ports.emitEvent("emission",Object.freeze({sequence:emissionSequence++,emittedAtMs:now,entityId:reference.entityId,channelId:reference.channelId,ownerActorId:reference.ownerActorId,position:spawn.position,velocity:spawn.velocity,damage:effectiveDamage,generation:reference.generation}));}});
const recycleAll=()=>{active.splice(0);};
return Object.freeze({instanceId:context.identity.instanceId,initialize(){context.assets.requireTexture(config.textureRole);context.ports.publishState("projectiles",Object.freeze({revision:0,emittedAtMs:context.clock.nowMs(),channelId:context.identity.instanceId+".projectiles",ownerInstanceId:context.identity.instanceId,ownerActorId:context.identity.ownerId,entityRole:"projectile",generation:0}));publishModifier("attack.damage.multiplier",0,config.maximumDamageMultiplier-1);publishModifier("attack.projectile-count.bonus",0,config.maximumCountBonus);context.services.observation.register("delivery",()=>({...context.services.projectileDelivery.observe(),emissionIndex,damageBonus,countBonus}));},update(deltaMs){if(!Number.isFinite(deltaMs)||deltaMs<0)throw new Error("invalid delivery delta");const viewport=context.services.viewport.read();for(let index=active.length-1;index>=0;index-=1){const record=active[index];record.position.x+=record.velocity.x*deltaMs/1000;record.position.y+=record.velocity.y*deltaMs/1000;const margin=config.recycleMargin;if(record.position.x < -margin||record.position.x > viewport.width+margin||record.position.y < -margin||record.position.y > viewport.height+margin){context.services.projectileDelivery.recycle(record.reference);active.splice(index,1);}}},stop(){recycleAll();},dispose(){recycleAll();target=undefined;damageBonus=0;countBonus=0;}});}

export function batch2Executable27(context){
const config=context.configuration;
const moduleKinds=Object.freeze({"delivery.spread":"spread","delivery.multi-shot":"multi-shot","delivery.pattern.radial":"radial","delivery.pattern.spiral":"spiral","delivery.pattern.fan":"fan","delivery.pattern.aimed":"aimed","delivery.pattern.wave":"wave","delivery.pattern.rain":"rain","delivery.pattern.rotating-ring":"rotatingRing","delivery.pattern.burst":"burst"});
const kind=moduleKinds[context.identity.moduleId];if(!kind)throw new Error("unknown delivery formation");
const centeredOrder=count=>{const result=[];if(count%2===1)result.push(0);for(let step=0;result.length<count;step+=1){const offset=count%2===1?step+1:step+.5;result.push(-offset);if(result.length<count)result.push(offset);}return result;};
const finite=field=>{const value=config[field];if(typeof value!=="number"||!Number.isFinite(value))throw new Error("invalid formation field: "+field);return value;};
const fanAngles=(center,arc,count)=>{if(count===1)return[center];if(Math.abs(arc-Math.PI*2)<=1e-12)return centeredOrder(count).map(offset=>center+offset*arc/count);const step=arc/(count-1);return centeredOrder(count).map(offset=>center+offset*step);};
const planFormation=(count,targetDirection,emissionIndex)=>{const degrees=value=>value*Math.PI/180;let center=Math.atan2(targetDirection.y,targetDirection.x);let angles;let spacing=0;if(kind==="spread")angles=fanAngles(center,degrees(finite("totalArcDegrees")),count);else if(kind==="multi-shot"){spacing=finite("lateralSpacing");angles=Array.from({length:count},()=>center);}else if(kind==="radial"){center+=degrees(finite("baseAngleOffsetDegrees"));angles=Array.from({length:count},(_,index)=>center+index*Math.PI*2/count);}else if(kind==="spiral"){center+=emissionIndex*degrees(finite("rotationStepDegrees"));angles=Array.from({length:count},(_,index)=>center+index*Math.PI*2/count);}else if(kind==="fan")angles=fanAngles(center,degrees(finite("arcDegrees")),count);else if(kind==="aimed")angles=fanAngles(center,degrees(finite("aimSpreadDegrees")),count);else if(kind==="wave"){const spread=degrees(finite("waveSpreadDegrees"));center+=Math.sin(emissionIndex*degrees(finite("phaseStepDegrees")))*spread/2;angles=fanAngles(center,spread,count);}else if(kind==="rain"){const downward=config.downwardBaseDirection;const magnitude=Math.hypot(downward.x,downward.y);if(!Number.isFinite(magnitude)||magnitude<=0)throw new Error("invalid rain direction");center=Math.atan2(downward.y/magnitude,downward.x/magnitude);angles=fanAngles(center,degrees(finite("spreadDegrees")),count);}else if(kind==="rotatingRing"){center+=emissionIndex*degrees(finite("ringRotationStepDegrees"));angles=Array.from({length:count},(_,index)=>center+index*Math.PI*2/count);}else angles=fanAngles(center,degrees(finite("burstSpreadDegrees")),count);const offsets=centeredOrder(count);return Object.freeze(angles.map((angle,index)=>Object.freeze({direction:Object.freeze({x:Math.cos(angle),y:Math.sin(angle)}),lateralOffset:Object.freeze({x:-Math.sin(center)*offsets[index]*spacing,y:Math.cos(center)*offsets[index]*spacing})})));};
let target;let emissionIndex=0;let emissionSequence=0;let modifierRevision=0;let damageBonus=0;let countBonus=0;const active=[];
const publishModifier=(fieldId,current,maximum)=>context.ports.publishState("modifier-state",Object.freeze({revision:modifierRevision++,emittedAtMs:context.clock.nowMs(),fieldId,current,minimum:0,maximum}));
context.ports.declareHandler("target",value=>{if(value.attackChannelId!==config.attackChannelId)throw new Error("target channel mismatch");const magnitude=Math.hypot(value.direction.x,value.direction.y);if(!Number.isFinite(magnitude)||Math.abs(magnitude-1)>1e-6)throw new Error("invalid target direction");target=Object.freeze({x:value.direction.x,y:value.direction.y});});
const applyModifier=value=>{if(value.targetInstanceId!==context.identity.instanceId||value.operation!=="add"||!Number.isFinite(value.value)||value.value<=0)throw new Error("invalid delivery modifier application");if(value.fieldId==="attack.damage.multiplier"){damageBonus=Math.min(config.maximumDamageMultiplier-1,damageBonus+value.value);publishModifier(value.fieldId,damageBonus,config.maximumDamageMultiplier-1);return;}if(value.fieldId==="attack.projectile-count.bonus"){if(!Number.isSafeInteger(value.value))throw new Error("projectile count bonus must be an integer");countBonus=Math.min(config.maximumCountBonus,countBonus+value.value);publishModifier(value.fieldId,countBonus,config.maximumCountBonus);return;}throw new Error("unknown delivery modifier target");};
context.ports.declareAddressedHandler("attack.damage.multiplier",applyModifier);
context.ports.declareAddressedHandler("attack.projectile-count.bonus",applyModifier);
context.ports.declareHandler("request",request=>{if(request.attackChannelId!==config.attackChannelId)throw new Error("request channel mismatch");if(!target)throw new Error("attack before target solution");if(emissionIndex>=Number.MAX_SAFE_INTEGER)throw new Error("delivery emission index exhausted");const now=context.clock.nowMs();const effectiveCount=config.baseCount+Math.min(countBonus,config.maximumCountBonus);const effectiveDamage=config.baseDamage*Math.min(1+damageBonus,config.maximumDamageMultiplier);const owner=context.services.actors.readOwner();if(!owner||owner.active!==true)throw new Error("inactive projectile owner");const textureKey=context.assets.requireTexture(config.textureRole);const requestPlan=planFormation(effectiveCount,target,emissionIndex++).map(spawn=>{const position=Object.freeze({x:owner.position.x+config.spawnOffset.x+spawn.lateralOffset.x,y:owner.position.y+config.spawnOffset.y+spawn.lateralOffset.y});const velocity=Object.freeze({x:spawn.direction.x*config.speed,y:spawn.direction.y*config.speed});return Object.freeze({position,velocity,damage:effectiveDamage,textureKey});});const result=context.services.projectileDelivery.admit(request.sequence,requestPlan);if(!result.accepted)return;if(result.activated.length>Number.MAX_SAFE_INTEGER-emissionSequence)throw new Error("delivery emission sequence block exhausted");for(let index=0;index<result.activated.length;index+=1){const reference=result.activated[index];const spawn=requestPlan[index];active.push({reference,position:{x:spawn.position.x,y:spawn.position.y},velocity:spawn.velocity});context.ports.emitEvent("emission",Object.freeze({sequence:emissionSequence++,emittedAtMs:now,entityId:reference.entityId,channelId:reference.channelId,ownerActorId:reference.ownerActorId,position:spawn.position,velocity:spawn.velocity,damage:effectiveDamage,generation:reference.generation}));}});
const recycleAll=()=>{active.splice(0);};
return Object.freeze({instanceId:context.identity.instanceId,initialize(){context.assets.requireTexture(config.textureRole);context.ports.publishState("projectiles",Object.freeze({revision:0,emittedAtMs:context.clock.nowMs(),channelId:context.identity.instanceId+".projectiles",ownerInstanceId:context.identity.instanceId,ownerActorId:context.identity.ownerId,entityRole:"projectile",generation:0}));publishModifier("attack.damage.multiplier",0,config.maximumDamageMultiplier-1);publishModifier("attack.projectile-count.bonus",0,config.maximumCountBonus);context.services.observation.register("delivery",()=>({...context.services.projectileDelivery.observe(),emissionIndex,damageBonus,countBonus}));},update(deltaMs){if(!Number.isFinite(deltaMs)||deltaMs<0)throw new Error("invalid delivery delta");const viewport=context.services.viewport.read();for(let index=active.length-1;index>=0;index-=1){const record=active[index];record.position.x+=record.velocity.x*deltaMs/1000;record.position.y+=record.velocity.y*deltaMs/1000;const margin=config.recycleMargin;if(record.position.x < -margin||record.position.x > viewport.width+margin||record.position.y < -margin||record.position.y > viewport.height+margin){context.services.projectileDelivery.recycle(record.reference);active.splice(index,1);}}},stop(){recycleAll();},dispose(){recycleAll();target=undefined;damageBonus=0;countBonus=0;}});}

export function batch2Executable28(context){
const config=context.configuration;
const moduleKinds=Object.freeze({"delivery.spread":"spread","delivery.multi-shot":"multi-shot","delivery.pattern.radial":"radial","delivery.pattern.spiral":"spiral","delivery.pattern.fan":"fan","delivery.pattern.aimed":"aimed","delivery.pattern.wave":"wave","delivery.pattern.rain":"rain","delivery.pattern.rotating-ring":"rotatingRing","delivery.pattern.burst":"burst"});
const kind=moduleKinds[context.identity.moduleId];if(!kind)throw new Error("unknown delivery formation");
const centeredOrder=count=>{const result=[];if(count%2===1)result.push(0);for(let step=0;result.length<count;step+=1){const offset=count%2===1?step+1:step+.5;result.push(-offset);if(result.length<count)result.push(offset);}return result;};
const finite=field=>{const value=config[field];if(typeof value!=="number"||!Number.isFinite(value))throw new Error("invalid formation field: "+field);return value;};
const fanAngles=(center,arc,count)=>{if(count===1)return[center];if(Math.abs(arc-Math.PI*2)<=1e-12)return centeredOrder(count).map(offset=>center+offset*arc/count);const step=arc/(count-1);return centeredOrder(count).map(offset=>center+offset*step);};
const planFormation=(count,targetDirection,emissionIndex)=>{const degrees=value=>value*Math.PI/180;let center=Math.atan2(targetDirection.y,targetDirection.x);let angles;let spacing=0;if(kind==="spread")angles=fanAngles(center,degrees(finite("totalArcDegrees")),count);else if(kind==="multi-shot"){spacing=finite("lateralSpacing");angles=Array.from({length:count},()=>center);}else if(kind==="radial"){center+=degrees(finite("baseAngleOffsetDegrees"));angles=Array.from({length:count},(_,index)=>center+index*Math.PI*2/count);}else if(kind==="spiral"){center+=emissionIndex*degrees(finite("rotationStepDegrees"));angles=Array.from({length:count},(_,index)=>center+index*Math.PI*2/count);}else if(kind==="fan")angles=fanAngles(center,degrees(finite("arcDegrees")),count);else if(kind==="aimed")angles=fanAngles(center,degrees(finite("aimSpreadDegrees")),count);else if(kind==="wave"){const spread=degrees(finite("waveSpreadDegrees"));center+=Math.sin(emissionIndex*degrees(finite("phaseStepDegrees")))*spread/2;angles=fanAngles(center,spread,count);}else if(kind==="rain"){const downward=config.downwardBaseDirection;const magnitude=Math.hypot(downward.x,downward.y);if(!Number.isFinite(magnitude)||magnitude<=0)throw new Error("invalid rain direction");center=Math.atan2(downward.y/magnitude,downward.x/magnitude);angles=fanAngles(center,degrees(finite("spreadDegrees")),count);}else if(kind==="rotatingRing"){center+=emissionIndex*degrees(finite("ringRotationStepDegrees"));angles=Array.from({length:count},(_,index)=>center+index*Math.PI*2/count);}else angles=fanAngles(center,degrees(finite("burstSpreadDegrees")),count);const offsets=centeredOrder(count);return Object.freeze(angles.map((angle,index)=>Object.freeze({direction:Object.freeze({x:Math.cos(angle),y:Math.sin(angle)}),lateralOffset:Object.freeze({x:-Math.sin(center)*offsets[index]*spacing,y:Math.cos(center)*offsets[index]*spacing})})));};
let target;let emissionIndex=0;let emissionSequence=0;let modifierRevision=0;let damageBonus=0;let countBonus=0;const active=[];
const publishModifier=(fieldId,current,maximum)=>context.ports.publishState("modifier-state",Object.freeze({revision:modifierRevision++,emittedAtMs:context.clock.nowMs(),fieldId,current,minimum:0,maximum}));
context.ports.declareHandler("target",value=>{if(value.attackChannelId!==config.attackChannelId)throw new Error("target channel mismatch");const magnitude=Math.hypot(value.direction.x,value.direction.y);if(!Number.isFinite(magnitude)||Math.abs(magnitude-1)>1e-6)throw new Error("invalid target direction");target=Object.freeze({x:value.direction.x,y:value.direction.y});});
const applyModifier=value=>{if(value.targetInstanceId!==context.identity.instanceId||value.operation!=="add"||!Number.isFinite(value.value)||value.value<=0)throw new Error("invalid delivery modifier application");if(value.fieldId==="attack.damage.multiplier"){damageBonus=Math.min(config.maximumDamageMultiplier-1,damageBonus+value.value);publishModifier(value.fieldId,damageBonus,config.maximumDamageMultiplier-1);return;}if(value.fieldId==="attack.projectile-count.bonus"){if(!Number.isSafeInteger(value.value))throw new Error("projectile count bonus must be an integer");countBonus=Math.min(config.maximumCountBonus,countBonus+value.value);publishModifier(value.fieldId,countBonus,config.maximumCountBonus);return;}throw new Error("unknown delivery modifier target");};
context.ports.declareAddressedHandler("attack.damage.multiplier",applyModifier);
context.ports.declareAddressedHandler("attack.projectile-count.bonus",applyModifier);
context.ports.declareHandler("request",request=>{if(request.attackChannelId!==config.attackChannelId)throw new Error("request channel mismatch");if(!target)throw new Error("attack before target solution");if(emissionIndex>=Number.MAX_SAFE_INTEGER)throw new Error("delivery emission index exhausted");const now=context.clock.nowMs();const effectiveCount=config.baseCount+Math.min(countBonus,config.maximumCountBonus);const effectiveDamage=config.baseDamage*Math.min(1+damageBonus,config.maximumDamageMultiplier);const owner=context.services.actors.readOwner();if(!owner||owner.active!==true)throw new Error("inactive projectile owner");const textureKey=context.assets.requireTexture(config.textureRole);const requestPlan=planFormation(effectiveCount,target,emissionIndex++).map(spawn=>{const position=Object.freeze({x:owner.position.x+config.spawnOffset.x+spawn.lateralOffset.x,y:owner.position.y+config.spawnOffset.y+spawn.lateralOffset.y});const velocity=Object.freeze({x:spawn.direction.x*config.speed,y:spawn.direction.y*config.speed});return Object.freeze({position,velocity,damage:effectiveDamage,textureKey});});const result=context.services.projectileDelivery.admit(request.sequence,requestPlan);if(!result.accepted)return;if(result.activated.length>Number.MAX_SAFE_INTEGER-emissionSequence)throw new Error("delivery emission sequence block exhausted");for(let index=0;index<result.activated.length;index+=1){const reference=result.activated[index];const spawn=requestPlan[index];active.push({reference,position:{x:spawn.position.x,y:spawn.position.y},velocity:spawn.velocity});context.ports.emitEvent("emission",Object.freeze({sequence:emissionSequence++,emittedAtMs:now,entityId:reference.entityId,channelId:reference.channelId,ownerActorId:reference.ownerActorId,position:spawn.position,velocity:spawn.velocity,damage:effectiveDamage,generation:reference.generation}));}});
const recycleAll=()=>{active.splice(0);};
return Object.freeze({instanceId:context.identity.instanceId,initialize(){context.assets.requireTexture(config.textureRole);context.ports.publishState("projectiles",Object.freeze({revision:0,emittedAtMs:context.clock.nowMs(),channelId:context.identity.instanceId+".projectiles",ownerInstanceId:context.identity.instanceId,ownerActorId:context.identity.ownerId,entityRole:"projectile",generation:0}));publishModifier("attack.damage.multiplier",0,config.maximumDamageMultiplier-1);publishModifier("attack.projectile-count.bonus",0,config.maximumCountBonus);context.services.observation.register("delivery",()=>({...context.services.projectileDelivery.observe(),emissionIndex,damageBonus,countBonus}));},update(deltaMs){if(!Number.isFinite(deltaMs)||deltaMs<0)throw new Error("invalid delivery delta");const viewport=context.services.viewport.read();for(let index=active.length-1;index>=0;index-=1){const record=active[index];record.position.x+=record.velocity.x*deltaMs/1000;record.position.y+=record.velocity.y*deltaMs/1000;const margin=config.recycleMargin;if(record.position.x < -margin||record.position.x > viewport.width+margin||record.position.y < -margin||record.position.y > viewport.height+margin){context.services.projectileDelivery.recycle(record.reference);active.splice(index,1);}}},stop(){recycleAll();},dispose(){recycleAll();target=undefined;damageBonus=0;countBonus=0;}});}

export function batch2Executable29(context){const config=context.configuration;let activeUntilMs=0;let revision=0;let sequence=0;const accepted=new Set(config.acceptedDamageKinds);const publish=()=>{const now=context.clock.nowMs();context.ports.publishState("state",Object.freeze({revision:revision++,emittedAtMs:now,actorId:context.identity.ownerId,active:now<activeUntilMs,current:Math.max(0,activeUntilMs-now),maximum:config.durationMs}));};const result=(damage,value,amount)=>context.ports.emitEvent("result",Object.freeze({sequence:sequence++,emittedAtMs:context.clock.nowMs(),targetActorId:damage.targetActorId,result:value,amount}));context.ports.declareHandler("damage",damage=>{if(!Object.isFrozen(damage))throw new Error("damage entering defense route must be immutable");const now=context.clock.nowMs();if(accepted.has(damage.damageKind)&&now<activeUntilMs){result(damage,"blocked",damage.amount);return;}if(accepted.has(damage.damageKind)){const until=now+config.durationMs;if(!Number.isSafeInteger(until))throw new Error("invulnerability active-until overflow");activeUntilMs=until;publish();}result(damage,"accepted",damage.amount);context.ports.emitEvent("downstream",damage);});return Object.freeze({instanceId:context.identity.instanceId,initialize(){publish();context.services.observation.register("invulnerability",()=>({activeUntilMs,revision,sequence}));},dispose(){activeUntilMs=0;}});}

export function batch2Executable30(context){const config=context.configuration;let current=config.initialStrength;let revision=0;let sequence=0;const accepted=new Set(config.acceptedDamageKinds);const publish=()=>context.ports.publishState("state",Object.freeze({revision:revision++,emittedAtMs:context.clock.nowMs(),actorId:context.identity.ownerId,active:current>0,current,maximum:config.maximumStrength}));const result=(damage,value,amount)=>context.ports.emitEvent("result",Object.freeze({sequence:sequence++,emittedAtMs:context.clock.nowMs(),targetActorId:damage.targetActorId,result:value,amount}));context.ports.declareHandler("damage",damage=>{if(!Object.isFrozen(damage))throw new Error("damage entering defense route must be immutable");if(!accepted.has(damage.damageKind)||current===0){result(damage,"passed-remainder",damage.amount);context.ports.emitEvent("downstream",damage);return;}const absorbed=Math.min(current,damage.amount);current-=absorbed;publish();result(damage,"absorbed",absorbed);const remainder=damage.amount-absorbed;if(remainder>0){const forwarded=Object.freeze({...damage,amount:remainder});result(damage,"passed-remainder",remainder);context.ports.emitEvent("downstream",forwarded);}});context.ports.declareAddressedHandler("combat.shield.current",application=>{if(application.fieldId!=="combat.shield.current"||application.operation!=="add")throw new Error("invalid shield modifier");current=Math.min(config.maximumStrength,Math.max(0,current+application.value));publish();});return Object.freeze({instanceId:context.identity.instanceId,initialize(){publish();context.services.observation.register("shield",()=>({current,revision,sequence}));},dispose(){current=0;}});}

export function batch2Executable31(context){const config=context.configuration;let channelId;let sequence=0;const ledger=new Set();context.ports.declareHandler("projectiles",channel=>{channelId=channel.channelId;});return Object.freeze({instanceId:context.identity.instanceId,initialize(){context.services.observation.register("graze",()=>({ledgerSize:ledger.size,sequence}));},update(){if(!channelId)return;const owner=context.services.actors.readOwner();if(!owner||owner.active!==true)return;const snapshot=context.services.entityChannelSnapshots.read("graze.projectiles");const entries=snapshot.entries;const live=new Set(entries.map(entry=>channelId+"/"+entry.entityId+"/"+entry.generation+"/"+owner.actorId));for(const key of ledger)if(!live.has(key))ledger.delete(key);for(const entry of entries){if(entry.active!==true)continue;const key=channelId+"/"+entry.entityId+"/"+entry.generation+"/"+owner.actorId;if(ledger.has(key))continue;const dx=entry.position.x-owner.position.x;const dy=entry.position.y-owner.position.y;const collision=config.playerRadius+config.bulletRadius;const graze=collision+config.margin;const distanceSquared=dx*dx+dy*dy;if(distanceSquared<=collision*collision||distanceSquared>graze*graze)continue;if(ledger.size>=config.ledgerCeiling)throw new Error("graze ledger capacity exceeded");ledger.add(key);context.ports.emitEvent("graze",Object.freeze({sequence:sequence++,emittedAtMs:context.clock.nowMs(),channelId,entityId:entry.entityId,generation:entry.generation,playerActorId:owner.actorId}));}},dispose(){ledger.clear();channelId=undefined;}});}

export function batch2Executable32(context){const config=context.configuration;let timer;let cursor=0;let generation=0;let startedAt=0;let dropped=0;const active=[];const emitDue=()=>{const elapsed=context.clock.nowMs()-startedAt;while(cursor<config.schedule.length&&config.schedule[cursor].atMs<=elapsed){const entry=config.schedule[cursor++];if(active.length>=config.maxActive){dropped++;continue;}const entityId="pickup-"+(++generation);const position=Object.freeze({...entry.position});const velocity=Object.freeze({x:0,y:config.fallSpeed});const entity=Object.freeze({entityId,generation,position,velocity,effectId:entry.effectId,value:entry.value,textureKey:context.assets.requireTexture(config.textureRole)});active.push(context.services.channels.activate("pickups",entity));}};return Object.freeze({instanceId:context.identity.instanceId,initialize(){context.assets.requireTexture(config.textureRole);context.ports.publishState("pickups",Object.freeze({revision:0,emittedAtMs:context.clock.nowMs(),channelId:context.identity.instanceId+".pickups",ownerInstanceId:context.identity.instanceId,ownerActorId:context.identity.ownerId,entityRole:"pickup",generation:0}));context.services.observation.register("pickup-spawn",()=>({cursor,generation,active:active.length,dropped}));},start(){startedAt=context.clock.nowMs();timer=context.clock.schedule(Object.freeze({mode:"interval",initialDelayMs:0,intervalMs:config.schedulerIntervalMs,callback:emitDue}));},update(){},stop(){timer?.cancel();timer=undefined;active.splice(0);},dispose(){timer?.cancel();timer=undefined;active.splice(0);}});}

export function batch2Executable33(context){let channel;let remove;let tracked=0;const seen=new Set();context.ports.declareHandler("sources",value=>{channel=value;});return Object.freeze({instanceId:context.identity.instanceId,initialize(){context.services.observation.register("pickup-collect",()=>({tracked,duplicates:seen.size}));},start(){remove=context.services.overlaps.register("pickup.commit",raw=>{if(!channel)throw new Error("pickup overlap before channel");const sourceKey=channel.channelId+":"+raw.sourceEntityId+":"+raw.sourceGeneration;if(seen.has(sourceKey))return;if(seen.size>=context.configuration.maximumTrackedCollections)throw new Error("pickup duplicate ledger exhausted");const prepared=context.services.preparedEffects.prepare(sourceKey,Object.freeze({sourceChannelId:channel.channelId,sourceEntityId:raw.sourceEntityId,sourceGeneration:raw.sourceGeneration,targetActorId:context.identity.ownerId,effectId:raw.effectId,value:raw.value}));prepared.commit();seen.add(sourceKey);tracked++;});},stop(){remove?.();remove=undefined;seen.clear();},dispose(){remove?.();remove=undefined;seen.clear();tracked=0;}});}

export function batch2Executable34(configuration,collected){const mapping=configuration.mappings.find(entry=>entry.effectId===collected.effectId);if(!mapping)return Object.freeze([]);if(mapping.applications.length>configuration.maximumApplicationsPerPickup)throw new Error("modifier plan ceiling exceeded");return Object.freeze(mapping.applications.map(application=>Object.freeze({routeId:application.routeId,targetInstanceId:application.targetInstanceId,fieldId:application.fieldId,operation:application.operation,value:Math.min(application.maximumValue,Math.max(application.minimumValue,collected.value*application.valueScale))})));}

export function batch2Executable35(context){const config=context.configuration;let current=config.initialHealth;let revision=0;const seen=new Set();const publish=(delta,reason)=>context.ports.publishState("state",Object.freeze({revision:revision++,emittedAtMs:context.clock.nowMs(),actorId:context.identity.ownerId,current,maximum:config.maxHealth,delta,reason}));context.ports.declareHandler("damage",damage=>{if(damage.targetActorId!==context.identity.ownerId)throw new Error("damage target mismatch");const key=damage.sourceActorId+":"+damage.contactSequence;if(seen.has(key))throw new Error("duplicate damage");seen.add(key);const before=current;current=Math.max(config.damageFloor,current-damage.amount);publish(current-before,current===0?"depleted":"damaged");});context.ports.declareAddressedHandler("combat.health.current",application=>{if(application.targetInstanceId!==context.identity.instanceId||application.fieldId!=="combat.health.current"||application.operation!=="add")throw new Error("addressed health modifier mismatch");const before=current;current=Math.min(config.maxHealth,current+application.value);publish(current-before,"healed");});return Object.freeze({instanceId:context.identity.instanceId,initialize(){publish(0,"initialized");context.services.observation.register("health",()=>({current,maximum:config.maxHealth,revision}));},dispose(){seen.clear();}});}

export function batch2Executable36(context){const config=context.configuration;let channel;let sequence=0;let remove;const seen=new Set();context.ports.declareHandler("sources",value=>{channel=value;});return Object.freeze({instanceId:context.identity.instanceId,initialize(){context.services.observation.register("contacts",()=>({sequence,tracked:seen.size}));},start(){remove=context.services.overlaps.register("projectile.overlap",raw=>{if(!channel)throw new Error("overlap before channel");const key=channel.channelId+":"+raw.sourceEntityId+":"+raw.sourceGeneration+":"+context.identity.ownerId;if(seen.has(key))return;if(seen.size>=config.maximumTrackedContacts)throw new Error("contact ledger exhausted");seen.add(key);const contactSequence=sequence++;context.ports.emitEvent("candidate",Object.freeze({sequence:contactSequence,emittedAtMs:context.clock.nowMs(),contactId:"contact."+contactSequence,sourceChannelId:channel.channelId,sourceEntityId:raw.sourceEntityId,sourceGeneration:raw.sourceGeneration,sourceActorId:channel.ownerActorId,targetActorId:context.identity.ownerId,contactSequence,metadata:Object.freeze({damage:raw.damage,damageKind:"projectile"})}));});},update(){},stop(){remove?.();remove=undefined;seen.clear();},dispose(){remove?.();remove=undefined;seen.clear();}});}

export function batch2Executable37(context){let resolved=0;context.ports.declareHandler("sources",()=>{});context.ports.declareHandler("candidate",candidate=>{if(resolved>=context.configuration.maxResolvedContacts)throw new Error("resolved contact ceiling exceeded");const decision=context.services.contact.executePolicy(candidate);const prepared=context.services.contact.prepareCommit(candidate,decision,Object.freeze({hit(evidenceId){context.ports.emitEvent("hit",Object.freeze({sequence:evidenceId,emittedAtMs:context.clock.nowMs(),sourceEntityId:candidate.sourceEntityId,targetActorId:candidate.targetActorId,contactSequence:candidate.contactSequence,consumed:true}));},damage(evidenceId){context.ports.emitEvent("damage",Object.freeze({sequence:evidenceId,emittedAtMs:context.clock.nowMs(),sourceActorId:candidate.sourceActorId,targetActorId:candidate.targetActorId,amount:decision.damage,damageKind:decision.metadata.damageKind,contactSequence:candidate.contactSequence}));}}));prepared.commit();resolved++;});return Object.freeze({instanceId:context.identity.instanceId,initialize(){context.services.observation.register("resolution",()=>({resolved}));},dispose(){resolved=0;}});}

export const batch2ResolvedGraph = {
  "graphVersion": "1.3.0",
  "assemblyId": "batch2.core-vertical-slice",
  "kernelVersion": "1.0.0",
  "engine": {
    "id": "phaser",
    "version": "3.90.0"
  },
  "executionReadiness": {
    "status": "ready",
    "evidenceId": "ac49da5b0692185e2dc8db13aceb12303671724f34bad162072a1ae37e9eb645"
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
} as unknown as ResolvedModuleGraphV13;

export const batch2RuntimeCatalog = new BrowserGameModuleRuntimeCatalogV13({
  catalogEvidenceId: "fe5585e6cc413ba8a370f475f218ba8ad13cac10311c589e0563fb462118b23e",
  entries: [
    { moduleId: "intent.keyboard-movement", version: "1.0.0", envelopeSha256: "4a2b9dc74b5c7beb16827b0a2e4c8f84256d5a12fa7de8dd7c54556bc501c11b", implementationId: "intent.keyboard-movement.v1", manifestSchemaVersion: "1.2.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "63839ea8e495dab883c5c83d89808fa34f78ffac04eb44bd78fd12dc58f31d7d", executable: batch2Executable0 },
    { moduleId: "intent.touch-drag", version: "1.0.0", envelopeSha256: "6b0f163881d2b3ffce945bacd5499eba9b85ea046021749b234b8256ec44cf90", implementationId: "intent.touch-drag.v1", manifestSchemaVersion: "1.2.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "4cdbcb36531f8cf15ada2f1263d5e96cc4e80b3c4ed2bcf27dbfae98c03a4faa", executable: batch2Executable1 },
    { moduleId: "intent.movement-arbiter", version: "1.0.0", envelopeSha256: "a46bcb6e7b257b0bdc9649aa34aad0c183df155b497d76e95db061e95f5785e1", implementationId: "intent.movement-arbiter.v1", manifestSchemaVersion: "1.2.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "02f001a3d921d7daa4a3c0facf2e4e8b40d839837621ac926de6b843666e144a", executable: batch2Executable2 },
    { moduleId: "locomotion.bounded", version: "1.0.0", envelopeSha256: "c26b611eea98fdcd25b65e934e866b864d1ad8668ee3b5241d71117df8301302", implementationId: "locomotion.bounded.v1", manifestSchemaVersion: "1.2.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "81e66a310405d2efebb576880c024f4121b89192e151e460bae71f1cc7d1399c", executable: batch2Executable3 },
    { moduleId: "targeting.fixed-forward", version: "1.0.0", envelopeSha256: "5d7362dff53087a8e37826c62a504f6dab2e6db7fb809338e4fa4cc45aae225c", implementationId: "targeting.fixed-forward.v1", manifestSchemaVersion: "1.2.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "cb8d80cb2a9f2bd4f5544c148d833f70b6920f6d51127308cd7e7954a892a10e", executable: batch2Executable4 },
    { moduleId: "trigger.interval", version: "1.0.0", envelopeSha256: "f278665d52bbf91aec7b30ab7591885ef4f5e42ec0438858761ed1f1f094f292", implementationId: "trigger.interval.v1", manifestSchemaVersion: "1.2.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "e7ffe52d0cf010ce676badf2b042ebabfd28fd92f54185ce47eba60ea9179186", executable: batch2Executable5 },
    { moduleId: "delivery.projectile", version: "1.0.0", envelopeSha256: "3d229eb9a076c4ffaa3c1df9ecd3644406f64b2937ed215d2d8d0e15add8c689", implementationId: "delivery.projectile.v1", manifestSchemaVersion: "1.2.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "c72f6e2793c326fa644c8d20acfec1d66ef5ebe8c8e8193178dcc335f18384fb", executable: batch2Executable6 },
    { moduleId: "combat.health", version: "1.0.0", envelopeSha256: "6a859e6ee2a20515041d437a24355063ff79f0236e48ffdc9f6bcd66e6d76c9f", implementationId: "combat.health.v1", manifestSchemaVersion: "1.2.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "229377381cfed1f76643ffa4640131e14f1699f5ca197c4e68b4c545a6e97777", executable: batch2Executable7 },
    { moduleId: "interaction.projectile-contact", version: "1.0.0", envelopeSha256: "c293b9337f882984472e89ad9a1e37d323ba6afc7fa9bd037121d746085b14f9", implementationId: "interaction.projectile-contact.v1", manifestSchemaVersion: "1.2.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "68d4583a46192fe19f7a3783962ffda44a4a8e49660d83cafe2c310039cbaae4", executable: batch2Executable8 },
    { moduleId: "interaction.contact-default-damage", version: "1.0.0", envelopeSha256: "435387a883a4ee3a09c15ea334056be0ca7e49989e5e5177847d2c066e4b3514", implementationId: "interaction.contact-default-damage.v1", manifestSchemaVersion: "1.2.0", exportKind: "contact-policy-transform-v1", entryEvidenceId: "d7020b6df92e644270d1b51397bd4fa09885c97138927afcf2f97884d284ee76", executable: batch2Executable9 },
    { moduleId: "interaction.contact-resolution", version: "1.0.0", envelopeSha256: "15c592050626a7a832be4ea2d0272da70a778413164ff69c4bf5942758eaef3e", implementationId: "interaction.contact-resolution.v1", manifestSchemaVersion: "1.2.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "c39a6e1c2d0a5133ea35f031c6e6edd7e00cfd8d79d09568dc5d0433c1d9e921", executable: batch2Executable10 },
    { moduleId: "intent.directional-aim", version: "1.0.0", envelopeSha256: "d16347a287cf36718c5dc6e86ee201781495e5adf15cd605cbd1c853dcbd7437", implementationId: "intent.directional-aim.v1", manifestSchemaVersion: "1.3.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "0af84425d72f74e62a0f164fb83e73b721b8855270d48e2e546177a89845a64e", executable: batch2Executable11 },
    { moduleId: "intent.active-attack", version: "1.0.0", envelopeSha256: "441651be54ceddd363b9fa8819756b797c818ca8f4acf8e86dce9a7105592bbd", implementationId: "intent.active-attack.v1", manifestSchemaVersion: "1.3.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "045dce9ee29b76428cc5d3758aae5fce9e342264904ecba696cb5302240d50b1", executable: batch2Executable12 },
    { moduleId: "intent.focus", version: "1.0.0", envelopeSha256: "95fb5f3bcff3dac4262d9b9054a59f2e303657e445d4f230f1ef3e819d0afa3e", implementationId: "intent.focus.v1", manifestSchemaVersion: "1.3.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "23e74a23b5bf7fe53d7ce537dc39ddaeea9b12c0cf8ba0fe5533fba082d20387", executable: batch2Executable13 },
    { moduleId: "locomotion.focus-speed", version: "1.0.0", envelopeSha256: "b3876bcfbeb935e08ad14d31e5f8b404fca9612ac423ba951745db88543b8b80", implementationId: "locomotion.focus-speed.v1", manifestSchemaVersion: "1.3.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "28dce4daad405345fb8cca1b45e0b010ea80f43e6de68bb5bca668daf6a5b939", executable: batch2Executable14 },
    { moduleId: "locomotion.bounded", version: "1.1.0", envelopeSha256: "4692ccb19733c57887102925be074d83dabcb73a6e990316e9ce9238c543723a", implementationId: "locomotion.bounded.v1-1", manifestSchemaVersion: "1.3.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "54570dd840659201eb0e0487d1dc3a7450d95707a7a8be5981f6f5e44dc4dc6b", executable: batch2Executable15 },
    { moduleId: "targeting.directional", version: "1.0.0", envelopeSha256: "8e0f4b3139687481b77b1584062a38cad1429c7cf5ac20faf7384c6ad38c9f5d", implementationId: "targeting.directional.v1", manifestSchemaVersion: "1.3.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "718d914d57cbf942b849f8ae6cc9c9983e20cc0d20b6e895825c4496f1927907", executable: batch2Executable16 },
    { moduleId: "targeting.nearest", version: "1.0.0", envelopeSha256: "5e5c6a42bc5c80b603e566e102131e236610bc5ee7c92345f15c272b999975ea", implementationId: "targeting.nearest.v1", manifestSchemaVersion: "1.3.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "4f3a39a6bcd208866f8c9003c7a9cd628525fceabb675618427a555a271e4cef", executable: batch2Executable17 },
    { moduleId: "trigger.active", version: "1.0.0", envelopeSha256: "c005136c5030b00edb56d4df66301ce06429940fb1f9c57ba12e51e206fff0a1", implementationId: "trigger.active.v1", manifestSchemaVersion: "1.3.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "d280f8bb30edcdf5adde3fc77fe92f7cd3a6a0d7ef9a56d21a278d7ada247513", executable: batch2Executable18 },
    { moduleId: "delivery.spread", version: "1.0.0", envelopeSha256: "9ee73cbeff668f45737598a0ddd31bb89cc4d09119fd18bc508ef646c525ae58", implementationId: "delivery.spread.v1", manifestSchemaVersion: "1.3.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "0c583329e377c98016e5f87f4eecc6cbf81660284107ca4ced3229adadffe11d", executable: batch2Executable19 },
    { moduleId: "delivery.multi-shot", version: "1.0.0", envelopeSha256: "e7edd8d7fc4c5823b82dc2571c52a352c213b18ec3c6639f46b200d360cb3aef", implementationId: "delivery.multi-shot.v1", manifestSchemaVersion: "1.3.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "fd171c9cdfb8786578e5c0b7e05abb220346cb80ff6de48d68d3d93b678f385d", executable: batch2Executable20 },
    { moduleId: "delivery.pattern.radial", version: "1.0.0", envelopeSha256: "c2b330c8bbea862de53e35326099b6ca0f3705fed5f0722b00afb7db0004a580", implementationId: "delivery.pattern.radial.v1", manifestSchemaVersion: "1.3.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "8465ed27da91baaaf224bc537729a74287cc50a8bbecbc233e8fc5b35923076b", executable: batch2Executable21 },
    { moduleId: "delivery.pattern.spiral", version: "1.0.0", envelopeSha256: "b206d6fd6de866c7d72492e2f35a54dc09af1ba295544f3600c15fb5706f35d0", implementationId: "delivery.pattern.spiral.v1", manifestSchemaVersion: "1.3.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "9f20f1dd994f0708c234d452ee7349c8190a50c43fff0f1c2ad8ba4b9b8b6b02", executable: batch2Executable22 },
    { moduleId: "delivery.pattern.fan", version: "1.0.0", envelopeSha256: "3683ea403f08d7bf7e253581e31da7b4e2ed0a9265dcff3b5ac329a823eea79a", implementationId: "delivery.pattern.fan.v1", manifestSchemaVersion: "1.3.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "22c075ce8ffe2ba2093d5f82dbd9c40a008df4be70c270976de45796aa25ea98", executable: batch2Executable23 },
    { moduleId: "delivery.pattern.aimed", version: "1.0.0", envelopeSha256: "0efc8ec1a55b8e1dfa22ab33b2ad3ecab87d7df35a04265e5191988c3d2572f0", implementationId: "delivery.pattern.aimed.v1", manifestSchemaVersion: "1.3.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "0e8359f9673fb38b350196c2e28cd823d49045135624a6cfe964112fe822b374", executable: batch2Executable24 },
    { moduleId: "delivery.pattern.wave", version: "1.0.0", envelopeSha256: "c77e056490c68c92f389cae1d393defd86f5935526dba35eb5fe1bfc2b79f96f", implementationId: "delivery.pattern.wave.v1", manifestSchemaVersion: "1.3.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "16f66d0ab9c14e7637339d3b7a3311fa8748c06897d1e6ab843763f74d92e3c7", executable: batch2Executable25 },
    { moduleId: "delivery.pattern.rain", version: "1.0.0", envelopeSha256: "b145602609e3fbdaafba29c462c0d413b31e683aa1e1cc2295c2a6aae532cae2", implementationId: "delivery.pattern.rain.v1", manifestSchemaVersion: "1.3.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "7d18188a54681eb2faa745be7f499737b4c273c640021f771585f9f89e88a84f", executable: batch2Executable26 },
    { moduleId: "delivery.pattern.rotating-ring", version: "1.0.0", envelopeSha256: "86bf581abb3a6c59d424b26c850f1daa21ed76e1a0d7be9556225a89213b78a4", implementationId: "delivery.pattern.rotating-ring.v1", manifestSchemaVersion: "1.3.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "64fb9adebc218c0bd88ef0868f391b0db03b31027fe75c349f60ddfc59466523", executable: batch2Executable27 },
    { moduleId: "delivery.pattern.burst", version: "1.0.0", envelopeSha256: "2a56feab9c802c3b412ccd5ee333ac2cff8105602d1baa63cdba5f4f2764f7ec", implementationId: "delivery.pattern.burst.v1", manifestSchemaVersion: "1.3.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "e3636b0ca0053eab242120ab3f924125a9b0abe2633b66837d9a2bdb40983c55", executable: batch2Executable28 },
    { moduleId: "combat.invulnerability-window", version: "1.0.0", envelopeSha256: "7c3b7888c88a17411cf26e82eeb1255fc864477983dd435ac3a0eb4d7fc0d928", implementationId: "combat.invulnerability-window.v1", manifestSchemaVersion: "1.3.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "bf08e5040fb5f84b4998bc29232ccc1716d54f3956acb51a9f81073d84a0475a", executable: batch2Executable29 },
    { moduleId: "combat.shield", version: "1.0.0", envelopeSha256: "813b6be5c8318b1c378caf59b12b28f0414f48d5ebe2d3f835f8ac535fe863ea", implementationId: "combat.shield.v1", manifestSchemaVersion: "1.3.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "01e39558217d0ff0f96923286f4518332fd4b9e6d3d9a065d447ca7e75fba251", executable: batch2Executable30 },
    { moduleId: "combat.graze", version: "1.0.0", envelopeSha256: "4f3ad8edd30698d31eb2a55ab2ecdd0c029450275bb97e89905d4d3251523d9c", implementationId: "combat.graze.v1", manifestSchemaVersion: "1.3.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "397bbe572182884220dae7b630f2f0fe6c649d97764bbd848fd6f748bc0cd3d0", executable: batch2Executable31 },
    { moduleId: "progression.pickup-spawn", version: "1.0.0", envelopeSha256: "2433b4f2e12f5ec73889eec9fbaa31160edc846607869c5aec16b177f8e023bc", implementationId: "progression.pickup-spawn.v1", manifestSchemaVersion: "1.3.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "99f88c33b947f4a9c54915461167b3bb5c079e5a793aaa72e61d9679aced5575", executable: batch2Executable32 },
    { moduleId: "progression.pickup-collect", version: "1.0.0", envelopeSha256: "5ee4ec8cf9e4c73d331b08896f3fe36274b8787228f65db50582b9ecfcf21c63", implementationId: "progression.pickup-collect.v1", manifestSchemaVersion: "1.3.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "6eceb8861dae2f397f1792bf663b5c7a220d070e1a4aa3a158a05df1f8d03cf7", executable: batch2Executable33 },
    { moduleId: "progression.modifier", version: "1.0.0", envelopeSha256: "22fec7ed42fb2d646cd5158ce9283b8d585e39f61b34d02d2c13eeb4706c32aa", implementationId: "progression.modifier.transform.v1", manifestSchemaVersion: "1.3.0", exportKind: "pickup-effect-plan-transform-v1", entryEvidenceId: "19137335bc55d570bbcffab314e0d7951e6686a051ce1de189a4a684bbed28fa", executable: batch2Executable34 },
    { moduleId: "combat.health", version: "1.1.0", envelopeSha256: "dd72a85fda2a408eb0f229eb14db6999b9b984b45d16b00df2d676ef3362762e", implementationId: "combat.health.v1-1", manifestSchemaVersion: "1.3.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "377f7230f13bc06f4b9ab7d0a0758ba990b0352dea05fddf76936863d3a2bd63", executable: batch2Executable35 },
    { moduleId: "interaction.projectile-contact", version: "1.1.0", envelopeSha256: "790081f65a1f295c78af5d5489678a675bbb59b5e04ecaa710bdad8851a18bc8", implementationId: "interaction.projectile-contact.v1-1", manifestSchemaVersion: "1.3.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "7347c0195e10a7be2b1d703a104824c3dfd641c9a0f426d1e496a41fa73092a0", executable: batch2Executable36 },
    { moduleId: "interaction.contact-resolution", version: "1.1.0", envelopeSha256: "647206a93107cb0295a7d058b5b111cea63716e88b2c00fc50af0b09e113ef57", implementationId: "interaction.contact-resolution.v1-1", manifestSchemaVersion: "1.3.0", exportKind: "lifecycle-create-v1", entryEvidenceId: "22b05da6a479e9d03a5c7130820dd69d5892bf76a84c6530715137f3c0b43c78", executable: batch2Executable37 },
  ],
});
