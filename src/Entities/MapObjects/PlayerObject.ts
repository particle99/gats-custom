import MapObject from "./MapObjects";

export class CircularMapObject extends MapObject {
    public radius: number;

    constructor(uid: number, radius: number) {
        super(uid);
        this.radius = radius;
    }
}

export class Player extends CircularMapObject {
    public hp: number = 100;
    public hpMax: number = 100;

    public beingHit: number = 0;

    public hasMoved: boolean = false;

    constructor(uid: number, radius: number) {
        super(uid, radius);
        this.canMove = true;
        this.canShoot = true;
    }
}