export default class MazeGenerator {
    private mapSize: number;
    private cellSize: number;
    private centerRadius: number;
    private centerX: number;
    private centerY: number;
    private grid: boolean[][];
    private gridWidth: number;
    private gridHeight: number;

    constructor(
        mapSize: number = 7000,
        cellSize: number = 100,
        centerRadius: number = 500,
        centerX: number = 3500,
        centerY: number = 3500
    ) {
        this.mapSize = mapSize;
        this.cellSize = cellSize;
        this.centerRadius = centerRadius;
        this.centerX = centerX;
        this.centerY = centerY;

        this.gridWidth = Math.floor(mapSize / cellSize);
        this.gridHeight = Math.floor(mapSize / cellSize);

        //true = wall; false = path
        this.grid = Array(this.gridHeight)
            .fill(null)
            .map(() => Array(this.gridWidth).fill(true));
    }

    public generate(): any[] {
        //random cell
        const startX = Math.floor(Math.random() * Math.floor(this.gridWidth / 2)) * 2 + 1;
        const startY = Math.floor(Math.random() * Math.floor(this.gridHeight / 2)) * 2 + 1;

        this.carvePassages(startX, startY);
        this.clearCenter();
        this.ensureConnectivity();

        return this.convertToCrateData();
    }

    private carvePassages(cx: number, cy: number): void {
        const directions = this.shuffleDirections([
            [0, -2], //north
            [2, 0],  //east
            [0, 2],  //south
            [-2, 0]  //west
        ]);

        this.grid[cy][cx] = false;

        for (const [dx, dy] of directions) {
            const nx = cx + dx;
            const ny = cy + dy;

            //check within bounds
            if (nx > 0 && nx < this.gridWidth - 1 && ny > 0 && ny < this.gridHeight - 1) {
                //make sure it hasn't been visited
                if (this.grid[ny][nx]) {
                    //carve path
                    this.grid[cy + dy / 2][cx + dx / 2] = false;
                    this.carvePassages(nx, ny);
                }
            }
        }
    }

    private clearCenter(): void {
        const centerGridX = Math.floor(this.centerX / this.cellSize);
        const centerGridY = Math.floor(this.centerY / this.cellSize);
        const radiusInCells = Math.ceil(this.centerRadius / this.cellSize);

        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                //get world position
                const worldX = x * this.cellSize + this.cellSize / 2;
                const worldY = y * this.cellSize + this.cellSize / 2;

                //get distance from center
                const distance = Math.sqrt(
                    Math.pow(worldX - this.centerX, 2) +
                    Math.pow(worldY - this.centerY, 2)
                );

                if (distance < this.centerRadius) {
                    this.grid[y][x] = false; //clear cell
                }
            }
        }
    }

    private ensureConnectivity(): void {
        const centerGridX = Math.floor(this.centerX / this.cellSize);
        const centerGridY = Math.floor(this.centerY / this.cellSize);
        const radiusInCells = Math.ceil(this.centerRadius / this.cellSize);

        //directions
        const directions = [
            [1, 0],   //east
            [-1, 0],  //west
            [0, 1],   //south
            [0, -1]   //north
        ];

        for (const [dx, dy] of directions) {
            let x = centerGridX;
            let y = centerGridY;

            //keep carving until the edge
            while (x > 0 && x < this.gridWidth - 1 && y > 0 && y < this.gridHeight - 1) {
                x += dx;
                y += dy;

                //carve path
                if (Math.random() < 0.3) {
                    this.grid[y][x] = false;
                }

                //get distance from center
                const distance = Math.sqrt(
                    Math.pow((x - centerGridX) * this.cellSize, 2) +
                    Math.pow((y - centerGridY) * this.cellSize, 2)
                );

                if (distance > this.centerRadius * 3) {
                    break;
                }
            }
        }
    }

    private convertToCrateData(): any[] {
        const crateData: any[] = [];
        let uid = 0;

        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                if (this.grid[y][x]) {
                    const worldX = x * this.cellSize + this.cellSize / 2;
                    const worldY = y * this.cellSize + this.cellSize / 2;

                    //skip center
                    const distance = Math.sqrt(
                        Math.pow(worldX - this.centerX, 2) +
                        Math.pow(worldY - this.centerY, 2)
                    );

                    if (distance >= this.centerRadius) {
                        crateData.push({
                            id: uid++,
                            type: "crate",
                            angle: "90",
                            x: worldX,
                            y: worldY,
                            width: 100,
                            height: 100
                        });
                    }
                }
            }
        }

        return crateData;
    }

    private shuffleDirections(directions: number[][]): number[][] {
        const shuffled = [...directions];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    public generateOrganic(): any[] {
        //base maze
        this.generate();

        for (let y = 1; y < this.gridHeight - 1; y++) {
            for (let x = 1; x < this.gridWidth - 1; x++) {
                const worldX = x * this.cellSize + this.cellSize / 2;
                const worldY = y * this.cellSize + this.cellSize / 2;

                const distance = Math.sqrt(
                    Math.pow(worldX - this.centerX, 2) +
                    Math.pow(worldY - this.centerY, 2)
                );

                //skip center
                if (distance < this.centerRadius) continue;

                if (this.grid[y][x]) {
                    const pathNeighbors = [
                        this.grid[y - 1]?.[x],
                        this.grid[y + 1]?.[x],
                        this.grid[y]?.[x - 1],
                        this.grid[y]?.[x + 1]
                    ].filter(n => n === false).length;

                    //remove walls that have 2 or 3 path neighbors
                    if (pathNeighbors >= 2 && Math.random() < 0.35) {
                        this.grid[y][x] = false;
                    }
                }
            }
        }

        for (let y = 1; y < this.gridHeight - 1; y++) {
            for (let x = 1; x < this.gridWidth - 1; x++) {
                const worldX = x * this.cellSize + this.cellSize / 2;
                const worldY = y * this.cellSize + this.cellSize / 2;

                const distance = Math.sqrt(
                    Math.pow(worldX - this.centerX, 2) +
                    Math.pow(worldY - this.centerY, 2)
                );

                //ensure center is not covered
                if (distance < this.centerRadius) continue;

                //randomly assign walls
                if (!this.grid[y][x] && Math.random() < 0.05) {
                    const neighbors = [
                        this.grid[y - 1]?.[x],
                        this.grid[y + 1]?.[x],
                        this.grid[y]?.[x - 1],
                        this.grid[y]?.[x + 1]
                    ].filter(n => n === false).length;

                    //only add a wall if there are alternate paths
                    if (neighbors >= 3) {
                        this.grid[y][x] = true;
                    }
                }
            }
        }

        return this.convertToCrateData();
    }

    public generateOpen(): any[] {
        //create a grid with more open spaces
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                const worldX = x * this.cellSize + this.cellSize / 2;
                const worldY = y * this.cellSize + this.cellSize / 2;

                const distance = Math.sqrt(
                    Math.pow(worldX - this.centerX, 2) +
                    Math.pow(worldY - this.centerY, 2)
                );

                if (distance < this.centerRadius) {
                    this.grid[y][x] = false;
                } else {
                    //creates a pattern
                    const isWall = (x % 3 === 0 && y % 2 === 0) || 
                                   (y % 3 === 0 && x % 2 === 0);
                    this.grid[y][x] = isWall && Math.random() < 0.6;
                }
            }
        }

        return this.convertToCrateData();
    }
}