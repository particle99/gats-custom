import Game from '../../Game';

import SpatialGrid from '../../Util/SpatialGrid';

import { ObjectUpdateFields } from '../../Enums/Fields';
import { RectangularMapObject } from '../MapObjects/MapObjects';
import Turret from '../../Upgrades/Secondary/Misc/Turret';
import { CrateObject, TurretObject } from '../MapObjects/CrateObjects';
import { ExplosiveObject, ExplodingObject } from '../MapObjects/ExplosiveObjects';

export default class CrateManager {
    public game: Game;

    public uid: number = 0;
    
    public objects: Map<number, RectangularMapObject>;
    public obstacles: Map<number, CrateObject>;

    public spatialGrid: SpatialGrid<RectangularMapObject>;

    constructor(game: Game, crateData: any) {
        this.game = game;
        this.objects = new Map();
        this.obstacles = new Map();

        this.spatialGrid = new SpatialGrid<RectangularMapObject>(250);

        this.parseCrateData(crateData);

        console.log("CrateManager initialized");
    }

    private parseCrateData(data: any) {
        for(const crate of data) {
            if (crate.type === "crate") {
                crate.width = 100;
                crate.height = 100;
                crate.type = 1;
            } else if (crate.type === "longCrate") {
                if(crate.angle == 90) {
                    crate.width = 100;
                    crate.height = 50;
                } else if(crate.angle == 180) {
                    crate.width = 50;
                    crate.height = 100;
                }
                crate.type = 2;
            }

            const object = new RectangularMapObject(this.uid, crate.type, crate.width, crate.height, crate.angle);
            object.x = crate.x;
            object.y = crate.y;

            this.addObject(object);
            this.addObstacle(object);
        }
    }

    public addObject(object: RectangularMapObject): void {
        this.objects.set(object.uid, object);
        this.spatialGrid.insert(object);
        this.uid++;
    }

    public addObstacle(object: CrateObject): void {
        this.obstacles.set(object.uid, object);
        this.spatialGrid.insert(object);
    }

    public removeObject(uid: number): void {
        const object = this.objects.get(uid);

        if(!object) return;

        this.broadcastObjectUnload(object);
        this.objects.delete(uid);
        this.spatialGrid.remove(object);
    }

    public broadcastObject(object: RectangularMapObject, include: Array<ObjectUpdateFields>): void {
        const packet = this.game.codec.buildObjectUpdatePacket(object, include);
        this.game.networkManager.broadcast(packet);
    }

    public broadcastObjectUnload(object: RectangularMapObject): void {
        const packet = this.game.codec.buildUnloadCratePacket(object);
        this.game.networkManager.broadcast(packet);
    }

    public update(): void {
        for(const [uid, object] of this.objects) {
            //only update shields, medkits and user crates
            if(object.type == 6 || object.type == 5 || object.type == 7 ||object.type == 3 || object.type == 0) {
                //medkits
                if(object.type == 5) {
                    if(this.game.tick - object.spawnTick > object.duration) {
                        this.removeObject(uid);
                        this.broadcastObjectUnload(object);
                    }
                }

                //user crates
                if(object.type == 3) {
                    if(this.game.tick - object.spawnTick > object.duration) {
                        this.removeObject(uid);
                        this.broadcastObjectUnload(object);
                    }

                    //broadcast object based on premium 
                    object.isPremium 
                        ? this.broadcastObject(object, ['uid', 'type', 'x', 'y', 'angle', 'parentId', 'isPremium', 'hp', 'maxHp']) 
                        : this.broadcastObject(object, ['uid', 'type', 'x', 'y', 'angle', 'parentId', 'hp', 'maxHp']);
                }

                if(object.type == 7) {
                    //this.broadcastObject(object, ['uid', 'type', 'x', 'y', 'angle', 'parentId']);

                    //check lifetime
                    //if(this.game.tick - object.spawnTick > object.duration) {
                        //fix this to be universal to the Turret upgrade, not the RectangularMap
                        //object.placed = false;

                        //console.log("removing turret");

                        //this.removeObject(uid);
                        //this.broadcastObjectUnload(object);
                        //continue;
                    //}

                    const turret = object as TurretObject;

                    const ownerId = turret.parentId;
                    const owner = this.game.playerManager.players.get(ownerId);
                    if(!owner) continue;

                    if(!owner.turretActive) continue;

                    const closestPlayers = this.game.playerManager.getClosestPlayers(object.x, object.y, 200);
                    const closestPlayer = closestPlayers[0];

                    if(closestPlayer) {
                        //update turret angle to face player
                        const dx = closestPlayer.x - turret.x;
                        const dy = closestPlayer.y - turret.y;
                        const angle = Math.atan2(dy, dx) * (180 / Math.PI);

                        turret.angle = angle;

                        //shoot at player every 30 ticks
                        if(turret.level == 0) {
                            if(this.game.tick % 35 === 0) {
                                const bullet = this.game.bulletManager.createCustomBullet(owner, 0, 0); 

                                if(!bullet) continue;

                                const angleRad = (angle * Math.PI) / 180;

                                const turretMuzzleDistance = 18;

                                const muzzleX = turret.x + Math.cos(angleRad) * turretMuzzleDistance;
                                const muzzleY = turret.y + Math.sin(angleRad) * turretMuzzleDistance;

                                bullet.x = muzzleX;
                                bullet.y = muzzleY;
                                bullet.angle = angle;

                                bullet.speed = 10;

                                bullet.width = 4;
                                bullet.height = 4;

                                bullet.damage = 10;

                                bullet.spdX = Math.cos(angleRad) * bullet.speed;
                                bullet.spdY = Math.sin(angleRad) * bullet.speed;

                                bullet.maxDistanceTraveled = 400;

                                bullet.spawnTick = this.game.tick;
                                bullet.invulnerable = false;

                                const spawnPacket = this.game.networkManager.codec.buildBulletActivationPacket(bullet, ['uid', 'x', 'y', 'height', 'width', 'angle', 'initSpdx', 'initSpdY', 'isShrapnel', 'ownerId', 'teamCode']);
                                this.game.networkManager.broadcast(spawnPacket);
                            }
                        } else if(turret.level == 1) {
                            if(this.game.tick % 35 === 0) {
                                //launch rockets at the same speed
                                const angleRad = (angle * Math.PI) / 180;

                                const turretMuzzleDistance = 18;
                                const speed = 40;

                                const muzzleX = turret.x + Math.cos(angleRad) * turretMuzzleDistance;
                                const muzzleY = turret.y + Math.sin(angleRad) * turretMuzzleDistance;

                                const spdX = Math.cos(angleRad) * speed;
                                const spdY = Math.sin(angleRad) * speed;

                                const explosiveObject = new ExplosiveObject(0, this.game, owner, 4);
                                const explodingObject = new ExplodingObject(0);

                                explosiveObject.travelTime = 20;
                                explosiveObject.damagePerTick = 100;
                                explosiveObject.angle = angle;

                                explodingObject.emissionRadius = 150;
                                explodingObject.explosionTicks = 1; //instant

                                explosiveObject.x = muzzleX;
                                explosiveObject.y = muzzleY;
                                explosiveObject.spdX = spdX;
                                explosiveObject.spdY = spdY;

                                explodingObject.x = muzzleX;
                                explodingObject.y = muzzleY;
                                explodingObject.spdX = spdX;
                                explodingObject.spdY = spdY;

                                this.game.explosiveManager.addObject(explosiveObject, explodingObject);
                            }
                        } else if(turret.level == 2) {
                            if(this.game.tick % 20 === 0) {
                                //launch rockets at twice the speed
                            }
                        }
                    }

                    //update and broadcast
                    turret.update(owner);
                    this.broadcastObject(turret, ['uid', 'type', 'x', 'y', 'angle', 'parentId']);
                }

                //shields
                if(object.type == 0) this.broadcastObject(object, ['uid', 'type', 'x', 'y', 'angle', 'parentId']);
            
                //flags
                if(object.type == 6) this.broadcastObject(object, ['uid', 'type', 'x', 'y', 'angle', 'parentId', 'team']);
            }
        }

        // update viewport crates for all players
        /**
        for(const [uid, player] of this.game.playerManager.players) {
            const visibleObjects = this.spatialGrid.query(player.x, player.y, 1000);
            const previouslyVisible = player.previousCrates;

            const newCrates = new Set<number>();
            const oldCrates = new Set<number>();
            const removedCrates = new Set<number>();

            for(const object of visibleObjects) {
                if(previouslyVisible.has(object)) {
                    oldCrates.add(object.uid);
                } else {
                    newCrates.add(object.uid);
                }
            }

            for(const uid of previouslyVisible.values()) {
                if(!visibleObjects.has(uid)) {
                    removedCrates.add(uid);
                }
            }


            // at the end
            player.previousCrates = visibleObjects;
        }
            */
    }
}