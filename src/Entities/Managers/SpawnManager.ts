import Game from '../../Game';
import PlayerEntity from '../PlayerEntity';
import { RectangularMapObject } from '../MapObjects/MapObjects';

interface SpawnChunk {
    id: number;
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    spawnX: number;
    spawnY: number;
    playerCount: number;
    validSpawnPositions: Array<{ x: number, y: number }>;
}

export interface SpawnArea {
    x: number;
    y: number;
    width: number;
    height: number;
}

export class SpawnManager {
    private game: Game;
    
    private chunkWidth: number;
    private chunkHeight: number;

    private chunks: Array<SpawnChunk>;

    private validPositionsPerChunk: number;
    private spawnRadius: number = 100; //distance from crates
    private spawnPadding: number = 100; //padding from edges

    private cols: number = 4;
    private rows: number = 4;

    constructor(game: Game, spawnAreas: SpawnArea | SpawnArea[], validPositionsPerChunk: number) {
        this.game = game;
        this.validPositionsPerChunk = validPositionsPerChunk;

        //convert to arrays
        const areas = Array.isArray(spawnAreas) ? spawnAreas : [spawnAreas];

        //assume all areas have same size
        const firstArea = areas[0];
        this.chunkWidth = firstArea.width / this.cols;
        this.chunkHeight = firstArea.height / this.rows;

        this.chunks = this.initializeChunks(areas);
        this.generateValidSpawnPositions();
    }

    private initializeChunks(spawnAreas: SpawnArea[]): Array<SpawnChunk> {
        const chunks: Array<SpawnChunk> = [];
        let chunkId = 0;

        for(const area of spawnAreas) {
            const chunkW = area.width / this.cols;
            const chunkH = area.height / this.rows;

            for(let row = 0; row < this.rows; row++) {
                for(let col = 0; col < this.cols; col++) {
                    const minX = area.x + (col * chunkW);
                    const maxX = area.x + ((col + 1) * chunkW);
                    const minY = area.y + (row * chunkH);
                    const maxY = area.y + ((row + 1) * chunkH);

                    chunks.push({
                        id: chunkId++,
                        minX: minX,
                        maxX: maxX,
                        minY: minY,
                        maxY: maxY,
                        spawnX: minX + chunkW / 2,
                        spawnY: minY + chunkH / 2,
                        playerCount: 0,
                        validSpawnPositions: []
                    });
                }
            }
        }

        return chunks;
    }

    private generateValidSpawnPositions(): void {
        const gridResolution = 100;
        const crates = Array.from(this.game.crateManager.objects.values());

        for(const chunk of this.chunks) {
            const validPositions: Array<{ x: number, y: number }> = [];

            for(let x = chunk.minX + this.spawnPadding; x < chunk.maxX - this.spawnPadding; x += gridResolution) {
                for(let y = chunk.minY + this.spawnPadding; y < chunk.maxY - this.spawnPadding; y += gridResolution) {
                    if(this.isValidSpawnPosition(x, y, crates)) {
                        if(validPositions.length < this.validPositionsPerChunk) validPositions.push({ x, y });
                        else break;
                    }
                }
            }

            chunk.validSpawnPositions = validPositions;
        }
    }

    private isValidSpawnPosition(x: number, y: number, crates: Array<RectangularMapObject>): boolean {
        for(const crate of crates) {
            //skip shields and medkits
            if(crate.type == 0 || crate.type == 5) continue;

            const crateCenterX = crate.x + crate.width / 2;
            const crateCenterY = crate.y + crate.height / 2;
            const crateHalfWidth = crate.width / 2 + this.spawnRadius;
            const crateHalfHeight = crate.height / 2 + this.spawnRadius;

            if(x >= crateCenterX - crateHalfWidth &&
                x <= crateCenterX + crateHalfWidth &&
                y >= crateCenterY - crateHalfHeight &&
                y <= crateCenterY + crateHalfHeight) {
                return false;
            }
        }

        return true;
    }

    private getChunkForPosition(x: number, y: number): SpawnChunk | null {
        for(const chunk of this.chunks) {
            if(x >= chunk.minX && x < chunk.maxX &&
                y >= chunk.minY && y < chunk.maxY) {
                return chunk;
            }
        }
        return null;
    }

    private updatePlayerCounts(): void {
        for(const chunk of this.chunks) {
            chunk.playerCount = 0;
        }

        for(const [uid, player] of this.game.playerManager.players) {
            const chunk = this.getChunkForPosition(player.x, player.y);
            if(chunk) {
                chunk.playerCount++;
            }
        }
    }

    private selectBestChunk(): SpawnChunk {
        this.updatePlayerCounts();

        const validChunks = this.chunks.filter(chunk => chunk.validSpawnPositions.length > 0);

        if(validChunks.length == 0) {
            return this.chunks[0];
        }

        //sort by least amount of players in chunk
        validChunks.sort((a, b) => {
            if(a.playerCount !== b.playerCount) {
                return a.playerCount - b.playerCount;
            }
            return b.validSpawnPositions.length - a.validSpawnPositions.length;
        });

        return validChunks[0];
    }

    private getRandomSpawnInChunk(chunk: SpawnChunk): { x: number, y: number } {
        if(chunk.validSpawnPositions.length == 0) {
            return { x: chunk.spawnX, y: chunk.spawnY };
        }

        const randomIndex = Math.floor(Math.random() * chunk.validSpawnPositions.length);
        return chunk.validSpawnPositions[randomIndex];
    }

    public getSpawnPosition(): { x: number, y: number } {
        const bestChunk = this.selectBestChunk();
        return this.getRandomSpawnInChunk(bestChunk);
    }

    public spawnPlayer(player: PlayerEntity): void {
        const spawnPos = this.getSpawnPosition();
        player.x = spawnPos.x;
        player.y = spawnPos.y;
    }

    //for debugging
    public getChunkStats(): Array<{ chunkId: number, players: number, validSpawns: number }> {
        this.updatePlayerCounts();
        return this.chunks.map(chunk => ({
            chunkId: chunk.id,
            players: chunk.playerCount,
            validSpawns: chunk.validSpawnPositions.length
        }));
    }
}