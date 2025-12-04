import { EntityStateFlags } from "../../../Enums/Flags";

import Game from "../../../Game";
import PlayerEntity from '../../PlayerEntity';
import SpatialGrid from '../../../Util/SpatialGrid';
import { MedKitObject, RectangularMapObject } from '../../MapObject';

export default class PlayerManager {
    private game: Game;
    
    private takenUids: Set<number> = new Set();
    private maxUid: number = 81;

    public players: Map<number, PlayerEntity>;
    public spatialGrid: SpatialGrid<PlayerEntity>;

    constructor(game: Game) {
        this.game = game;
        this.players = new Map();
        this.spatialGrid = new SpatialGrid<PlayerEntity>(200);

        console.log("PlayerManager initialized");
    }

    private getLowestAvailableUid(): number | null {
        for (let uid = 1; uid <= this.maxUid; uid++) {
            if (!this.takenUids.has(uid)) {
                return uid;
            }
        }
        return null;
    }

    public createPlayer(parts: Array<string>): PlayerEntity | null {
        const playerData = {
            gun: parseInt(parts[1]),
            armor: parseInt(parts[2]),
            color: parseInt(parts[3])
        }

        const uid = this.getLowestAvailableUid();
        if (uid === null) {
            console.log('Error: No available UIDs for new player');
            return null;
        }

        const player: PlayerEntity = new PlayerEntity(this.game, uid, playerData.gun, playerData.armor, playerData.color);
        this.setEntity(uid, player);

        //this.generateSpawnPosition(player);

        return player;
    }

    public setEntity(uid: number, entity: PlayerEntity): Boolean | void {
        if (this.players.has(uid)) {
            console.log(`Error: UID ${uid} already in entity map`);
            return;
        }

        if (this.takenUids.has(uid)) {
            console.log(`Error: UID ${uid} is already taken`);
            return;
        }

        this.players.set(uid, entity);
        this.takenUids.add(uid);
        this.spatialGrid.insert(entity);

        return true;
    }

    public deleteEntity(uid: number): Boolean | void {
        const entity = this.players.get(uid);
        if (!entity) {
            console.log(`Error: UID ${uid} is not in entity map when attempting to delete`);
            return;
        }

        this.players.delete(uid);
        this.takenUids.delete(uid);
        this.spatialGrid.remove(entity);

        return true;
    }

    private isPlayerMoving(player: PlayerEntity): boolean {
        return Math.abs(player.spdX) > 0.001 || Math.abs(player.spdY) > 0.001;
    }

    private isCollidingWithCrates(player: PlayerEntity): boolean {
        return Array.from(this.game.crateManager.objects).some(([ id, crate ]) => 
            player.x < crate.x + crate.width &&
            player.x + player.width > crate.x &&
            player.y < crate.y + crate.height &&
            player.y + player.height > crate.y
        );
    }

    public isInFog(player: PlayerEntity): boolean {
        const fogSize = this.game.fogSize / 2;

        const mapCenterX = this.game.arenaSize / 2;
        const mapCenterY = this.game.arenaSize / 2;

        return (
            player.x < mapCenterX - fogSize ||
            player.x > mapCenterX + fogSize ||
            player.y < mapCenterY - fogSize ||
            player.y > mapCenterY + fogSize
        );
    }

    public getTopPlayers(): Array<PlayerEntity> {
        const playersArray: PlayerEntity[] = Array.from(this.players.values());
        playersArray.sort((a, b) => b.score - a.score);
        return playersArray.slice(0, 10);
    }

    public isInScoreSquare(player: PlayerEntity): boolean {
        return (
            player.x >= 3400 &&
            player.x <= 3600 &&
            player.y >= 3400 &&
            player.y <= 3600
        );
    }

    public generateSpawnPosition(player: PlayerEntity): void {
        if(!this.game.spawnManager) {
            this.generateRandomPosition(player, this.game.arenaSize, this.game.arenaSize);
            return;
        }
        
        this.game.spawnManager.spawnPlayer(player);
    }

    public generateRandomPosition(player: PlayerEntity, width: number, height: number): void {
        let attempts = 0;
        const maxAttempts = 100;
        
        do {
            player.x = Math.floor(Math.random() * width);
            player.y = Math.floor(Math.random() * height);
            attempts++;
        } while(this.isCollidingWithCrates(player) && attempts < maxAttempts);
    }

    private hasMovingPlayersNearby(player: PlayerEntity): boolean {
        const nearbyPlayers = this.spatialGrid.query(player.x, player.y, 250);
        
        for(const other of nearbyPlayers) {
            if(other.uid == player.uid) continue;
            if(this.isPlayerMoving(other)) return true;
        }
        
        return false;
    }
    
    private getNearestCrates(player: PlayerEntity, padding: number = 250): Array<RectangularMapObject> {
        if(!this.game.crateManager) {
            return [];
        }

        const range = Math.max(player.width, player.height) / 2 + padding;
        const nearbyCrates = this.game.crateManager.spatialGrid.query(player.x, player.y, range);
        
        return Array.from(nearbyCrates);
    }

    private cratesToCollisionData(crates: Array<RectangularMapObject>): Array<{ x: number, y: number, width: number, height: number }> {
        return crates.map(crate => ({
            x: crate.x,
            y: crate.y,
            width: crate.width,
            height: crate.height
        }));
    }

    private circleRectCollision(cx: number, cy: number, radius: number, rx: number, ry: number, rw: number, rh: number): boolean {
        const rectCenterX = rx - rw / 2;
        const rectCenterY = ry - rh / 2;
        
        const closestX = Math.max(rectCenterX, Math.min(cx, rectCenterX + rw));
        const closestY = Math.max(rectCenterY, Math.min(cy, rectCenterY + rh));
        
        const dx = cx - closestX;
        const dy = cy - closestY;
        const distSq = dx * dx + dy * dy;
        
        return distSq < radius * radius;
    }

    private collidesWithAnyCrate(x: number, y: number, radius: number, crates: Array<{ x: number, y: number, width: number, height: number }>): boolean {
        for(const crate of crates) {
            if(this.circleRectCollision(x, y, radius, crate.x, crate.y, crate.width, crate.height)) {
                return true;
            }
        }
        return false;
    }

    private handleMedkitCollection(player: PlayerEntity, medkits: Array<MedKitObject>): void {
        for(const medkit of medkits) {
            const medkitCenterX = medkit.x + medkit.width / 2;
            const medkitCenterY = medkit.y + medkit.height / 2;
            
            const dx = player.x - medkitCenterX;
            const dy = player.y - medkitCenterY;
            const distSq = dx * dx + dy * dy;
            const collisionDist = player.radius + (Math.max(medkit.width, medkit.height) / 2);
            
            if(distSq < collisionDist * collisionDist && player.hp < player.hpMax) {
                medkit.use(player);
                this.game.crateManager.removeObject(medkit.uid);
            }
        }
    }

    private separateCratesByType(crates: Array<RectangularMapObject>): { regularCrates: Array<RectangularMapObject>, medkits: Array<MedKitObject> } {
        const regularCrates: Array<RectangularMapObject> = [];
        const medkits: Array<MedKitObject> = [];
        
        for(const crate of crates) {
            if(crate.type == 5) {
                medkits.push(crate as MedKitObject);
            } else if(crate.type !== 0 && crate.type !== 6) { //skip shields and flags
                regularCrates.push(crate);
            }
        }
        
        return { regularCrates, medkits };
    }

    private handleCrateCollision(player: PlayerEntity, crateCollisionData: Array<{ x: number, y: number, width: number, height: number }>): void {
        const oldX = player.x;
        const oldY = player.y;

        const targetX = player.x + player.spdX;
        const targetY = player.y + player.spdY;
        
        if(!this.collidesWithAnyCrate(targetX, targetY, player.radius, crateCollisionData)) {
            player.x = targetX;
            player.y = targetY;
        } else {
            let finalX = player.x;
            let finalY = player.y;
            let movedX = false;
            let movedY = false;
            
            const testX = player.x + player.spdX;
            if(!this.collidesWithAnyCrate(testX, player.y, player.radius, crateCollisionData)) {
                finalX = testX;
                movedX = true;
            }
            
            const testY = player.y + player.spdY;
            if(!this.collidesWithAnyCrate(player.x, testY, player.radius, crateCollisionData)) {
                finalY = testY;
                movedY = true;
            }
            
            if(movedX && movedY) {
                if (!this.collidesWithAnyCrate(finalX, finalY, player.radius, crateCollisionData)) {
                    player.x = finalX;
                    player.y = finalY;
                } else {
                    if(Math.abs(player.spdX) > Math.abs(player.spdY)) {
                        player.x = finalX;
                        player.spdY *= 0.3;
                    } else {
                        player.y = finalY;
                        player.spdX *= 0.3;
                    }
                }
            } else {
                player.x = finalX;
                player.y = finalY;
                
                if(!movedX) player.spdX *= 0.3;
                if(!movedY) player.spdY *= 0.3;
            }
        }

        if(oldX !== player.x || oldY !== player.y) {
            this.spatialGrid.update(player, oldX, oldY);
        }
    }

    public checkCollisions(player: PlayerEntity): void {
        const playerIsMoving = this.isPlayerMoving(player);
        
        if (!playerIsMoving) {
            const hasMovingNearby = this.hasMovingPlayersNearby(player);
            if (!hasMovingNearby) {
                return;
            }
            this.handlePlayerPlayerCollisions(player);
            return;
        }

        const nearbyCrates = this.getNearestCrates(player, 250);
        const { regularCrates, medkits } = this.separateCratesByType(nearbyCrates);
        
        this.handleMedkitCollection(player, medkits);

        const crateCollisionData = this.cratesToCollisionData(regularCrates);
        this.handleCrateCollision(player, crateCollisionData);

        this.handlePlayerPlayerCollisions(player, crateCollisionData);

        player.x = Math.max(player.radius, Math.min(player.x, this.game.arenaSize - player.radius));
        player.y = Math.max(player.radius, Math.min(player.y, this.game.arenaSize - player.radius));
    }

    private handlePlayerPlayerCollisions(player: PlayerEntity, nearbyCrates?: Array<{ x: number, y: number, width: number, height: number }>): void {
        if(this.game.config?.playerCollisionsEnabled !== undefined) {
            if(!this.game.config.playerCollisionsEnabled) return;
        }

        const nearbyPlayers = this.spatialGrid.query(player.x, player.y, 250);
        
        for(const other of nearbyPlayers) {
            if(other.uid == player.uid) continue;

            const dx = player.x - other.x;
            const dy = player.y - other.y;
            const distSq = dx * dx + dy * dy;
            const minDist = player.radius + other.radius;

            if(distSq < minDist * minDist && distSq > 0.0001) {
                const dist = Math.sqrt(distSq);
                const overlap = minDist - dist;

                const nx = dx / dist;
                const ny = dy / dist;

                const push = overlap / 2;
                const pushX = nx * push;
                const pushY = ny * push;

                const thisNewX = player.x + pushX;
                const thisNewY = player.y + pushY;
                const otherNewX = other.x - pushX;
                const otherNewY = other.y - pushY;

                const crateData = nearbyCrates || this.cratesToCollisionData(this.getNearestCrates(player, 250));
                const otherCrateData = nearbyCrates || this.cratesToCollisionData(this.getNearestCrates(other, 250));

                const thisBlocked = this.collidesWithAnyCrate(thisNewX, thisNewY, player.radius, crateData);
                const otherBlocked = this.collidesWithAnyCrate(otherNewX, otherNewY, other.radius, otherCrateData);

                if(!thisBlocked) {
                    player.x = thisNewX;
                    player.y = thisNewY;
                }

                if(!otherBlocked) {
                    other.x = otherNewX;
                    other.y = otherNewY;
                }
            }
        }
    }

    public getNearbyPlayers(player: PlayerEntity, width: number, height: number): Array<PlayerEntity> {
        const range = Math.max(width, height);
        const results = this.spatialGrid.query(player.x, player.y, range);
        return Array.from(results).filter(p => p.uid !== player.uid);
    }

    public awardScoreSquareGain(player: PlayerEntity): void {
        player.score += player.scoreSquareGain;
        player.lastScoreSquareGain = performance.now();
    }

    public updatePlayers(): void {
        this.game.gameClass.updatePlayers(this.players);
    }
}