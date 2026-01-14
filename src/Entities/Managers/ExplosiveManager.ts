import Game from "../../Game";

import { 
    ExplodingUpdateFields, 
    ExplosiveActivationFields 
} from "../../Enums/Fields";

import { 
    ExplodingObject, 
    ExplosiveObject
} from "../MapObjects/ExplosiveObjects";

import { EntityStateFlags } from "../../Enums/Flags";

export default class ExplosiveManager {
    public game: Game;

    public explosiveObjects: Map<number, ExplosiveObject>;
    public explodingObjects: Map<number, ExplodingObject>;

    private takenUids: Set<number> = new Set();
    public maxUid: number = 500;

    constructor(game: Game) {
        this.game = game;

        this.explosiveObjects = new Map();
        this.explodingObjects = new Map();
    }

    public getLowestAvailableUid(): number | null {
        for (let uid = 0; uid <= this.maxUid; uid++) {
            if (!this.takenUids.has(uid)) {
                return uid;
            }
        }
        return null;
    }

    public addExplosiveObject(object: ExplosiveObject): void {
        this.explosiveObjects.set(object.uid, object);
    }

    public addExplodingObject(object: ExplodingObject): void {
        this.explodingObjects.set(object.uid, object);
    }

    public addObject(explosive: ExplosiveObject, exploding: ExplodingObject): boolean {
        const uid = this.getLowestAvailableUid();
        if (uid === null) {
            console.log('Error: No available UIDs for new explosive');
            return false;
        }

        explosive.uid = uid;
        exploding.uid = uid;

        this.addExplosiveObject(explosive);
        this.addExplodingObject(exploding);
        this.takenUids.add(uid);

        return true;
    }

    //there is only one remove object function, since once the exploding object is finished, both are removed
    public removeObject(uid: number): void {
        const explosiveObject = this.explosiveObjects.get(uid);
        const explodingObject = this.explodingObjects.get(uid);

        if(!explosiveObject || !explodingObject) {
            console.log("hell nah bro");
            return;
        }

        if(explosiveObject.type == 2) { //landmines
            const owner = this.game.playerManager.players.get(explosiveObject.ownerId);
            if(!owner) return;

            owner.numExplosivesLeft++;

            owner.fieldManager.safeUpdate({
                states: [EntityStateFlags.FIRST_PERSON_UPDATE],
                firstPersonFields: ['numExplosivesLeft']
            });
        }

        //broadcast unload before removing from map
        this.broadcastObjectUnload(uid);

        this.explosiveObjects.delete(uid);
        this.explodingObjects.delete(uid);
        this.takenUids.delete(uid);
    }

    public broadcastExplosiveObject(object: ExplosiveObject, include: Array<ExplosiveActivationFields>): void {
        const packet = this.game.codec.buildExplosiveActivationPacket(object, include);
        this.game.networkManager.broadcast(packet);
    }

    public broadcastExplodingObject(object: ExplodingObject, include: Array<ExplodingUpdateFields>): void {
        const packet = this.game.codec.buildLoadExplodingObjectPacket(object, include);
        this.game.networkManager.broadcast(packet);
    }

    public broadcastObjectUnload(uid: number): void {
        const packet = this.game.codec.buildUnloadExplosivePacket(uid);
        this.game.networkManager.broadcast(packet);
    }

    private damagePlayersInExplosion(x: number, y: number, radius: number, damage: number, type: number, ownerId: number): void {
        const owner = this.game.playerManager.players.get(ownerId);
        const ownerTeamCode = owner?.teamCode || 0;
        
        const nearbyPlayers = this.game.playerManager.spatialGrid.query(x, y, radius);
        
        for(const player of nearbyPlayers) {
            //you can be injured by your own explosive
            //if(player.uid == ownerId) continue;
            
            //if(player.teamCode == ownerTeamCode) continue;
            
            const dx = player.x - x;
            const dy = player.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if(distance <= radius) {
                if(type == 0 || type == 2) { //gas + landmines
                    const distanceRatio = distance / radius;
                    const damagePercent = Math.pow(1 - distanceRatio, 2); //squares the falloff for less linear damage
                    const playerDamage = damage * damagePercent;
                    player.damage(playerDamage, ownerId);
                } else {
                    player.damage(damage, ownerId);
                } 
            }
        }
    }

    private checkForPlayerColliding(explosive: ExplosiveObject, exploding: ExplodingObject): void {
        const nearbyPlayers = this.game.playerManager.spatialGrid.query(
            exploding.x, 
            exploding.y, 
            exploding.emissionRadius
        );
        
        for (const player of nearbyPlayers) {
            //skip over owner
            if (player.uid === explosive.ownerId) continue;
            
            const owner = this.game.playerManager.players.get(explosive.ownerId);
            //const ownerTeamCode = owner?.teamCode || 0;
            //if(player.teamCode == ownerTeamCode) continue;
            
            const dx = player.x - exploding.x;
            const dy = player.y - exploding.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= exploding.radius + player.radius) {
                exploding.exploding = 1;
                //exploding.emitting = 1;
                
                this.damagePlayersInExplosion(
                    exploding.x, 
                    exploding.y, 
                    exploding.emissionRadius, 
                    explosive.damagePerTick,
                    explosive.type,
                    explosive.ownerId
                );
                
                exploding.ticksElapsed = 0;
                exploding.phase = 2;
                
                break;
            }
        }
    }

    private createShrapnel(amount: number, x: number, y: number, ownerId: number): void {
        const owner = this.game.playerManager.players.get(ownerId);
        if (!owner) return;

        const shrapnelSpeed = 10;
        
        for (let i = 0; i < amount; i++) {
            const angle = Math.random() * Math.PI * 2;
            
            const shrapnelBullet = this.game.bulletManager.createCustomBullet(owner, 1, 0);

            if (!shrapnelBullet) {
                console.warn('Failed to create shrapnel bullet - no available UIDs');
                continue;
            }

            //pos
            shrapnelBullet.x = x;
            shrapnelBullet.y = y;
            
            //shrapnel attributes
            shrapnelBullet.speed = shrapnelBullet.rand(11, 15);
            shrapnelBullet.maxDistanceTraveled = shrapnelBullet.rand(80, 160); 
            shrapnelBullet.damage = shrapnelBullet.rand(20, 40);
            shrapnelBullet.width = shrapnelBullet.rand(5, 1);
            shrapnelBullet.height = shrapnelBullet.rand(5, 1);

            //set angle and velocities
            shrapnelBullet.angle = angle * (180 / Math.PI); //convert to degrees
            shrapnelBullet.spdX = Math.cos(angle) * shrapnelSpeed;
            shrapnelBullet.spdY = Math.sin(angle) * shrapnelSpeed;
            
            //spawn stuff
            shrapnelBullet.spawnTick = this.game.tick;
            shrapnelBullet.invulnerable = false;

            const spawnPacket = this.game.networkManager.codec.buildBulletActivationPacket(shrapnelBullet, ['uid', 'x', 'y', 'height', 'width', 'angle', 'spdX', 'spdY', 'isShrapnel', 'ownerId', 'teamCode']);
            this.game.networkManager.broadcast(spawnPacket);
        }
    }

    public handleGrenade(explosive: ExplosiveObject, exploding: ExplodingObject): void {
        if(exploding.phase == 1) {
            exploding.update();
            if(exploding.timeTraveled >= explosive.travelTime) {
                exploding.phase = 2;
                exploding.timeTraveled = 0;
            }
        } else if(exploding.phase == 2) {
            if(exploding.timeTraveled < explosive.travelTime) {
                exploding.timeTraveled++;
            } else {
                exploding.exploding = 1;
                if(exploding.ticksElapsed === 0) {
                    this.damagePlayersInExplosion(exploding.x, exploding.y, exploding.emissionRadius, explosive.damagePerTick, explosive.type, explosive.ownerId);
                }
                
                exploding.ticksElapsed++;
                
                if(exploding.ticksElapsed >= exploding.explosionTicks) {
                    this.removeObject(exploding.uid);
                }
            }
        }
    }

    public handleGas(explosive: ExplosiveObject, exploding: ExplodingObject): void {
        //gas is still traveling
        if(exploding.phase == 1) {
            exploding.update();
            //once traveling is finished, move onto phase 2
            if(exploding.timeTraveled >= explosive.travelTime) {
                exploding.phase = 2;
            }
        } 
        //gas is now exploding/emitting
        else if(exploding.phase == 2) {
            exploding.exploding = 1;
            exploding.emitting = 1;

            if(exploding.ticksElapsed >= exploding.explosionTicks) {
                exploding.exploding = 0;
                exploding.emitting = 1;
            }

            if(exploding.emissionRadius < exploding.radius) {
                exploding.emissionRadius += 5; //keep adding radius until full
            }

            exploding.ticksElapsed++;

            if(exploding.ticksElapsed <= exploding.emissionTicks) {
                this.damagePlayersInExplosion(exploding.x, exploding.y, exploding.emissionRadius, explosive.damagePerTick, explosive.type, explosive.ownerId)
            } else {
                this.removeObject(exploding.uid);
            }
        }
    }

    public handleFrag(explosive: ExplosiveObject, exploding: ExplodingObject): void {
        if(exploding.phase == 1) {
            exploding.update();
            if(exploding.timeTraveled >= explosive.travelTime) {
                exploding.phase = 2;
                exploding.timeTraveled = 0;
            }
        } else if(exploding.phase == 2) {
            if(exploding.timeTraveled < 18) {
                exploding.timeTraveled++;
            } else {
                exploding.exploding = 1;

                if(exploding.ticksElapsed === 0) {
                    this.damagePlayersInExplosion(exploding.x, exploding.y, exploding.emissionRadius, explosive.damagePerTick, explosive.type, explosive.ownerId);
                    this.createShrapnel(25, exploding.x, exploding.y, explosive.ownerId);
                }

                exploding.ticksElapsed++;

                if(exploding.ticksElapsed >= exploding.explosionTicks) {
                    this.removeObject(exploding.uid);
                }
            }
        }
    }

    public handleLandMine(explosive: ExplosiveObject, exploding: ExplodingObject): void {
        if(exploding.phase == 1) { //landmine is static
            if(exploding.timeTraveled < explosive.travelTime) {
                exploding.timeTraveled++;
                this.checkForPlayerColliding(explosive, exploding);
            } else {
                this.removeObject(exploding.uid);
            }
        } else if(exploding.phase == 2) { //hit someone
            exploding.ticksElapsed++;

            if(exploding.ticksElapsed >= exploding.explosionTicks) {
                this.removeObject(exploding.uid);
            }
        }
    }

    public update(): void {
        for(const [uid, object] of this.explodingObjects) {
            const explosiveObject = this.explosiveObjects.get(uid);

            //if the exploding object uid does not map to an explosive object, there is an error
            if(!explosiveObject) return;

            if(!explosiveObject.activated) {
                this.broadcastExplosiveObject(explosiveObject, ['uid', 'type', 'x', 'y', 'spdX', 'spdY', 'emitting', 'emissionRadius', 'travelTime', 'ownerId', 'teamCode'])
                this.broadcastExplodingObject(object, ['uid', 'x', 'y', 'exploding', 'emitting', 'emissionRadius']);
                object.timeTraveled += 1;
                explosiveObject.activated = true;
            } 

            switch(explosiveObject.type) {
                case 0:
                    this.handleGrenade(explosiveObject, object);
                    break;
                case 1:
                    this.handleGas(explosiveObject, object);
                    break;
                case 2:
                    this.handleLandMine(explosiveObject, object);
                    break;
                case 3:
                    this.handleFrag(explosiveObject, object);
                    break;
                //others
            }

            this.broadcastExplodingObject(object, ['uid', 'x', 'y', 'exploding', 'emitting', 'emissionRadius']);
        }
    }
}