export default class SpatialGrid<T extends { x: number; y: number }> {
    private cellSize: number;
    private grid: Map<string, Set<T>>;

    constructor(cellSize: number = 500) {
        this.cellSize = cellSize;
        this.grid = new Map();
    }

    private key(x: number, y: number): string {
        const cx = Math.floor(x / this.cellSize);
        const cy = Math.floor(y / this.cellSize);
        return `${cx},${cy}`;
    }

    public insert(entity: T): void {
        const k = this.key(entity.x, entity.y);
        if (!this.grid.has(k)) this.grid.set(k, new Set());
        this.grid.get(k)!.add(entity);
    }

    public remove(entity: T): void {
        const k = this.key(entity.x, entity.y);
        const cell = this.grid.get(k);
        if (cell) {
            cell.delete(entity);
            if (cell.size === 0) this.grid.delete(k);
        }
    }

    public update(entity: T, oldX: number, oldY: number): void {
        const oldKey = this.key(oldX, oldY);
        const newKey = this.key(entity.x, entity.y);

        if (oldKey !== newKey) {
            const oldCell = this.grid.get(oldKey);
            if (oldCell) {
                oldCell.delete(entity);
                if (oldCell.size === 0) this.grid.delete(oldKey);
            }
            this.insert(entity);
        }
    }

    public query(x: number, y: number, range: number): Set<T> {
        const results = new Set<T>();
        const minX = Math.floor((x - range) / this.cellSize);
        const maxX = Math.floor((x + range) / this.cellSize);
        const minY = Math.floor((y - range) / this.cellSize);
        const maxY = Math.floor((y + range) / this.cellSize);

        for (let cx = minX; cx <= maxX; cx++) {
            for (let cy = minY; cy <= maxY; cy++) {
                const key = `${cx},${cy}`;
                const cell = this.grid.get(key);
                if (cell) {
                    for (const entity of cell) {
                        results.add(entity);
                    }
                }
            }
        }

        return results;
    }

    public clear(): void {
        this.grid.clear();
    }
}