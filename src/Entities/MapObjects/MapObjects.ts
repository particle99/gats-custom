import Entity from "../Entity";

export default abstract class MapObject extends Entity {
    public canBeHit: boolean = true;
    public canMove: boolean = false;
    public canShoot: boolean = false;

    constructor(uid: number) {
        super(uid);
    }
}

export class RectangularMapObject extends MapObject {
    public width: number;
    public height: number;
    public angle: number;

    public type: number;
    public team: number = 0;

    public hp: number = 0;
    public maxHp: number = 0;

    public parentId: number = 0;
    public isPremium: number = 0;

    //only for medkits
    public spawnTick: number = 0;
    public duration: number = 0;

    constructor(uid: number, type: number, width: number, height: number, angle: number) {
        super(uid);
        this.type = type;
        this.width = width;
        this.height = height;
        this.angle = angle;
    }
}