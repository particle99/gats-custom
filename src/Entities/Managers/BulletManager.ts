import { rectCircleCollision, rectRectCollision } from '../../Util/Collision/BulletCollisions';

import Game from '../../Game';
import Bullet from './../Bullet';
import { RectangularMapObject, UserCrateObject } from '../MapObject';

import PlayerEntity from './../PlayerEntity';
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

    private getNearestCrates(bullet: Bullet, range: number = 250): Array<RectangularMapObject> {
        if (!this.game.crateManager) {
            console.warn('CrateManager not available for bullet collision detection');
            return [];
        }

        const nearbyCrates = this.game.crateManager.spatialGrid.query(bullet.x, bullet.y, range);
        
        return Array.from(nearbyCrates);
    }

    public getNearestPlayers(bullet: Bullet, range: number = 250) {
        return this.spatialGrid.query(bullet.x, bullet.y, range);
    }

    private bulletShieldCollision(bullet: Bullet, shield: RectangularMapObject): boolean {
        const bulletRect = {
            x: bullet.x,
            y: bullet.y,
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

    public checkCollisions(bullet: Bullet): void {
        //skip collision checks if bullet collisions are disabled
        if(this.game.config?.bulletCollisionsEnabled !== undefined) {
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
        const nearbyCrates = this.getNearestCrates(bullet, 250);

        let bulletRemoved = false;
        for (const crate of nearbyCrates) {
            //skip over invulnerable bullets (only for crates)
            if(bullet.invulnerable) continue;
            //do not collide with medkits
            if(crate.type == 5) continue;
            
            let collision = false;
            
            if (crate.type === 0) { //bullet shield collisions
                collision = this.bulletShieldCollision(bullet, crate);
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
                this.unloadBullet(bullet);
                bulletRemoved = true;
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
                        if(this.game.config?.bulletDamageEnabled !== undefined) {
                            if(this.game.config.bulletDamageEnabled !== true) return;
                        }
                        
                        //if the bullet has collided with a player, apply damage and unload the bullet
                        player.damage(bullet.damage, bullet.ownerId);
                        this.unloadBullet(bullet);
                        break;
                    }
                }
            }
        }
    }

    public updateBullets(): void {
        for (const bullet of this.bullets.values()) {
            //skip dead bullets
            if(!bullet.alive) continue;

            //update bullet
            bullet.update(this.game);

            if (bullet.totalDistanceTraveled >= bullet.maxDistanceTraveled) {
                //unload the bullet after it's traveled 
                this.unloadBullet(bullet);
            }

            //bullet collision config
            if(this.game.config?.bulletCollisionsEnabled !== undefined) {
                if(this.game.config.bulletCollisionsEnabled) this.checkCollisions(bullet);
            } else {
                //check collisions before updating position
                this.checkCollisions(bullet);
            }
        }
    }
}