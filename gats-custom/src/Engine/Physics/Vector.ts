class Vector {
    /** x val */
    public x: number;
    /** y val */
    public y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    public getLength(): number {
        return Math.sqrt((this.x**2) + (this.y**2));
    }

    public add(v: Vector): void {
        this.x += v.x;
        this.y += v.y;
    }

    public mul(m: number): void {
        this.x *= m;
        this.y *= m;
    }

    public normalize(): void {
        const len = this.getLength();

        this.x *= 1 / len;
        this.y *= 1 / len;
    }
}

function v2(x: number = 0, y: number = 0): Vector {
    return new Vector(x, y);
}

function mul(vect: Vector, m: number): Vector {
    const v = new Vector(vect.x * m, vect.y * m);
    return v;
}

function normalize(vect: Vector): Vector {
    const v = new Vector(vect.x, vect.y);
    v.normalize();
    return v;
}

export { Vector, v2, mul, normalize };