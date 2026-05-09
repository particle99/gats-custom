import Game from '../../Game';

import { 
    rectCircleCollision, 
    rectRectCollision 
} from '../../Util/Collision/BulletCollisions';

import Bullet from './../Bullet';
import PlayerEntity from './../PlayerEntity';

import { UserCrateObject } from '../MapObjects/CrateObjects';
import { RectangularMapObject } from '../MapObjects/MapObjects';

import SpatialGrid from '../../Util/SpatialGrid'

export default class BulletManager {
    public game: Game;
    public bullets: Map<number, Bullet>;
    private takenUids: Set<number> = new Set();
    public maxUid: number = 350;
    public spatialGrid: SpatialGrid<PlayerEntity>;

    constructor(game: Game, spatialGrid: SpatialGrid<PlayerEntity>) {
        this.game = game;
        this.bullets = new Map();
        this.spatialGrid = spatialGrid;

        console.log("BulletManager initialized");
    }

    private getLowestAvailableUid(): number | null {
        for (let uid = 0; uid <= this.maxUid; uid++) {
            if (!this.takenUids.has(uid)) {
                return uid;
            }
        }
        return null;
    }

    public createBullet(owner: PlayerEntity, isShrapnel: number, isKnife: number): Bullet | null {
        const uid = this.getLowestAvailableUid();
        if (uid === null) {
            console.log('Error: No available UIDs for new bullet');
            return null;
        }

        const bullet: Bullet = new Bullet(this.game, uid, owner, owner.gunType, isShrapnel, isKnife);

        bullet.setSpawn(owner);

        this.bullets.set(bullet.uid, bullet);
        this.takenUids.add(bullet.uid);

        return bullet;
    }

    public createCustomBullet(owner: PlayerEntity, isShrapnel: number, isKnife: number): Bullet | null {
        const uid = this.getLowestAvailableUid();
        if (uid === null) {
            console.log('Error: No available UIDs for new bullet');
            return null;
        }

        const bullet: Bullet = new Bullet(this.game, uid, owner, owner.gunType, isShrapnel, isKnife);

        this.bullets.set(bullet.uid, bullet);
        this.takenUids.add(bullet.uid);

        return bullet;
    }

    public unloadBullet(bullet: Bullet): void {
        const unloadBulletPacket = this.game.networkManager.codec.buildDeactivateBulletPacket(bullet.uid);
        this.game.networkManager.broadcast(unloadBulletPacket);

        this.bullets.delete(bullet.uid);
        this.takenUids.delete(bullet.uid);
    }

    private getNearestCrates(bullet: Bullet, range: number = 250, queryX?: number, queryY?: number): Array<RectangularMapObject> {
        if (!this.game.crateManager) {
            console.warn('CrateManager not available for bullet collision detection');
            return [];
        }

        const x = queryX ?? bullet.x;  //if next position is not provided, use current bullet position
        const y = queryY ?? bullet.y;
        const nearbyCrates = this.game.crateManager.spatialGrid.query(x, y, range);
        
        return Array.from(nearbyCrates);
    }

    public getNearestPlayers(bullet: Bullet, range: number = 250) {
        return this.spatialGrid.query(bullet.x, bullet.y, range);
    }

    private bulletShieldCollision(bullet: Bullet, shield: RectangularMapObject): boolean {
        const nextX = bullet.x + bullet.spdX;
        const nextY = bullet.y + bullet.spdY;

        const bulletRect = {
            x: nextX,
            y: nextY,
            width: bullet.width,
            height: bullet.height
        };
        
        const bulletCorners = [
            { x: bulletRect.x, y: bulletRect.y },
            { x: bulletRect.x + bulletRect.width, y: bulletRect.y },
            { x: bulletRect.x + bulletRect.width, y: bulletRect.y + bulletRect.height },
            { x: bulletRect.x, y: bulletRect.y + bulletRect.height }
        ];
        
        const shieldCenterX = shield.x + shield.width / 2;
        const shieldCenterY = shield.y + shield.height / 2;
        const shieldAngleRad = (shield.angle * Math.PI) / 180;
        
        for (const corner of bulletCorners) {
            //rotate bullet corner into shield coords
            const cos = Math.cos(-shieldAngleRad);
            const sin = Math.sin(-shieldAngleRad);
            
            const relativeX = corner.x - shieldCenterX;
            const relativeY = corner.y - shieldCenterY;
            
            const localX = relativeX * cos - relativeY * sin;
            const localY = relativeX * sin + relativeY * cos;
            
            const halfWidth = shield.width / 2;
            const halfHeight = shield.height / 2;
            
            if (Math.abs(localX) <= halfWidth && Math.abs(localY) <= halfHeight) {
                return true;
            }
        }
        
        const shieldCorners = [
            { x: shield.x, y: shield.y },
            { x: shield.x + shield.width, y: shield.y },
            { x: shield.x + shield.width, y: shield.y + shield.height },
            { x: shield.x, y: shield.y + shield.height }
        ];
        
        const rotatedShieldCorners = shieldCorners.map(corner => {
            const cos = Math.cos(shieldAngleRad);
            const sin = Math.sin(shieldAngleRad);
            
            const relativeX = corner.x - shieldCenterX;
            const relativeY = corner.y - shieldCenterY;
            
            return {
                x: shieldCenterX + (relativeX * cos - relativeY * sin),
                y: shieldCenterY + (relativeX * sin + relativeY * cos)
            };
        });
        
        for (const corner of rotatedShieldCorners) {
            if (corner.x >= bulletRect.x && 
                corner.x <= bulletRect.x + bulletRect.width &&
                corner.y >= bulletRect.y && 
                corner.y <= bulletRect.y + bulletRect.height) {
                return true;
            }
        }
        
        return false;
    }

    private bulletTunnelCollision(bullet: Bullet, bulletRect: { x: number, y: number, width: number, height: number }, tunnel: RectangularMapObject): void {
        let collision = false;
        
        collision = rectRectCollision(
            bulletRect.x, 
            bulletRect.y, 
            bulletRect.width, 
            bulletRect.height, 
            tunnel.x - (tunnel.width / 2), 
            tunnel.y - (tunnel.height / 2), 
            tunnel.width, 
            tunnel.height
        );

        if(collision) {
            const tunnelOwner = this.game.playerManager.players.get(tunnel.parentId);

            if(!tunnelOwner) return;
            if(!tunnelOwner.tunnelLocationOne || !tunnelOwner.tunnelLocationTwo) return;

            if(bullet.hasTeleported) return;

            const tunnelType = tunnel.team;

            if(tunnelType == 0) {
                bullet.x = tunnelOwner.tunnelLocationTwo.x;
                bullet.y = tunnelOwner.tunnelLocationTwo.y;

                bullet.hasTeleported = true;
            } else if(tunnelType == 1) {
                bullet.x = tunnelOwner.tunnelLocationOne.x;
                bullet.y = tunnelOwner.tunnelLocationOne.y;

                bullet.hasTeleported = true;
            }
        }
    }

    public checkCollisions(bullet: Bullet): void {
        //skip collision checks if bullet collisions are disabled
        if(this.game.config?.bulletCollisionsEnabled) {
            if(this.game.config.bulletCollisionsEnabled !== true) return;
        }

        const nextX = bullet.x + bullet.spdX;
        const nextY = bullet.y + bullet.spdY;
        
        const bulletRect = {
            x: nextX,
            y: nextY,
            width: bullet.width,
            height: bullet.height
        };

        const nearbyPlayers = this.spatialGrid.query(nextX, nextY, 250);
        const nearbyCrates = this.getNearestCrates(bullet, 250, nextX, nextY);  //query from next position
        
        let bulletRemoved = false;
        for (const crate of nearbyCrates) {
            //skip over invulnerable bullets (only for crates)
            if(bullet.invulnerable) continue;
            //do not collide with medkits
            if(crate.type == 5) continue;
            
            let collision = false;
            
            if (crate.type === 0) { //bullet shield collisions
                collision = this.bulletShieldCollision(bullet, crate);
            } else if (crate.type == 8) { //tunnel collisions
                this.bulletTunnelCollision(bullet, bulletRect, crate);
                continue;
            } else if (crate.type == 3) {
                collision = rectRectCollision(
                    bulletRect.x, 
                    bulletRect.y, 
                    bulletRect.width, 
                    bulletRect.height, 
                    crate.x - (crate.width / 2), 
                    crate.y - (crate.height / 2), 
                    crate.width, 
                    crate.height
                );

                if(collision) {
                    this.unloadBullet(bullet);
                    const object = crate as UserCrateObject;

                    //check usercrate state
                    if(object.hp - bullet.damage <= 0) {
                        this.game.crateManager.removeObject(object.uid);
                        this.game.crateManager.broadcastObjectUnload(object);
                    } else {
                        object.damage(bullet.damage);
                    }

                    //update owner score
                    const owner = this.game.playerManager.players.get(bullet.ownerId);
                    if(owner) owner.updateScore(1);
                }
            } else { //regular crates
                collision = rectRectCollision(
                    bulletRect.x, 
                    bulletRect.y, 
                    bulletRect.width, 
                    bulletRect.height, 
                    crate.x - (crate.width / 2), 
                    crate.y - (crate.height / 2), 
                    crate.width, 
                    crate.height
                );
            }
            
            if (collision) {
                if(bullet.owner.bulletRicochet) {
                    //reflect bullet velocity based on which side of the crate was hit
                    const overlapLeft = (bulletRect.x + bulletRect.width) - (crate.x - crate.width / 2);
                    const overlapRight = (crate.x + crate.width / 2) - bulletRect.x;
                    const overlapTop = (bulletRect.y + bulletRect.height) - (crate.y - crate.height / 2);
                    const overlapBottom = (crate.y + crate.height / 2) - bulletRect.y;

                    const minOverlapX = Math.min(overlapLeft, overlapRight);
                    const minOverlapY = Math.min(overlapTop, overlapBottom);

                    if (minOverlapX < minOverlapY) {
                        bullet.spdX = -bullet.spdX;
                        bullet.angle = 180 - bullet.angle;
                    } else {
                        bullet.spdY = -bullet.spdY;
                        bullet.angle = -bullet.angle;
                    }
                } else {
                    this.unloadBullet(bullet);
                    bulletRemoved = true;
                }
                break;
            }
        }

        if (!bulletRemoved) {
            for (const player of nearbyPlayers) {
                if (player.invincible || !player.canBeHit) continue;

                if (bullet.ownerId == player.uid || bullet.isKnife) continue; //bullets spawn inside player, would kill them instantly

                const dx = player.x - (bulletRect.x + bulletRect.width / 2);
                const dy = player.y - (bulletRect.y + bulletRect.height / 2);
                const distanceSq = dx * dx + dy * dy;

                const buffer = player.radius + Math.max(bulletRect.width, bulletRect.height) / 2;
                const bufferSq = buffer * buffer;

                if (distanceSq <= bufferSq) {
                    const hit = rectCircleCollision(
                        bulletRect.x,
                        bulletRect.y,
                        bulletRect.width,
                        bulletRect.height,
                        player.x,
                        player.y,
                        player.radius
                    );

                    if (hit) {
                        //do not damage player if bullet damage is disabled
                        if(this.game.config?.bulletDamageEnabled) {
                            if(this.game.config.bulletDamageEnabled !== true) return;
                        }
                        
                        //if the bullet has collided with a player, apply damage and unload the bullet
                        player.damage(bullet.damage, bullet.ownerId);
                        //send hit marker packet to owner of the bullet
                        const hitMarkerPacket = this.game.networkManager.codec.buildHitMarkerPacket(player);
                        const owner = this.game.playerManager.players.get(bullet.ownerId);
                        if(!owner) return;
                        owner.queueManager.addToQueue(hitMarkerPacket);
                        //unload bullet
                        this.unloadBullet(bullet);
                        break;
                    }
                }
            }
        }
    }

    /**
     * TODO: Fix bullet collision checks, the bullets go through the crates before unloading
     */
    public updateBullets(): void {
        for (const bullet of this.bullets.values()) {
            //skip dead bullets
            if(!bullet.alive) continue;

            //check collisions BEFORE updating bullet position
            if(this.game.config?.bulletCollisionsEnabled) {
                if(this.game.config.bulletCollisionsEnabled) this.checkCollisions(bullet);
            } else {
                //check collisions before updating position
                this.checkCollisions(bullet);
            }

            //update bullet
            bullet.update(this.game);

            if (bullet.totalDistanceTraveled >= bullet.maxDistanceTraveled) {
                //unload the bullet after it's traveled 
                this.unloadBullet(bullet);
            }

            //generate bullet update packets
            const bulletUpdatePacket = this.game.codec.buildBulletUpdatePacket(bullet);
            const inRange = this.game.playerManager.getNearbyPlayers(bullet.x, bullet.y, 1000);

            //broadcast the update packets only to those in range
            this.game.networkManager.broadcastToFiltered(inRange, bulletUpdatePacket);
        }
    }
}