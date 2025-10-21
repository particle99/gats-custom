import { EntityStateFlags } from "../Enums/Flags";
import Game from "../Game";
import Bullet from "./Bullet";
import Entity from "./Entity";
import PlayerEntity from "./PlayerEntity";

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

export class ExplosiveObject extends MapObject {
    public spdX: number = 0;
    public spdY: number = 0;

    public type: number = 0;

    public travelTime: number = 0;
    public emitting: number = 0;
    public emissionRadius: number = 0;

    public ownerId: number = 0;
    public teamCode: number = 0;

    public damagePerTick: number = 0;

    public activated: boolean = false;

    constructor(uid: number, game: Game, owner: PlayerEntity, type: number) {
        super(uid);

        this.type = type;
        this.ownerId = owner.uid;
    }
}

export class ExplodingObject extends MapObject {
    public spdX: number = 0;
    public spdY: number = 0;

    public exploding: number = 0;
    public emitting: number = 0;
    public emissionRadius: number = 0;
    public radius: number = 0;

    public timeTraveled: number = 0;
    public ticksElapsed: number = 0;

    public emissionTicks: number = 0;
    public explosionTicks: number = 0;

    public phase: number = 1;

    constructor(uid: number) {
        super(uid);
    }

    update(): void {
        this.x += this.spdX;
        this.y += this.spdY;

        this.timeTraveled += 1;
    }
}

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

export class CrateObject extends RectangularMapObject {
    constructor(uid: number, type: number, width: number, height: number, angle: number) {
        super(uid, type, width, height, angle);
    }
}

export class UserCrateObject extends RectangularMapObject {
    constructor(uid: number, isPremium: number) {
        super(uid, 3, 33, 33, 0);

        this.hp = 1000;
        this.maxHp = 1000;

        this.isPremium = isPremium;
    }

    damage(damage: number): void {
        this.hp -= damage;
    }
}

export class MedKitObject extends RectangularMapObject {
    constructor(uid: number, parentId: number) {
        super(uid, 5, 33, 33, 0);

        this.parentId = parentId;
    }

    use(player: PlayerEntity): void {
        player.hp = player.hpMax;

        player.fieldManager.safeUpdate({
            states: [EntityStateFlags.AUX_UPDATE],
            auxFields: ['uid', 'hp']
        })
    }
}

export class ShieldObject extends RectangularMapObject {
    constructor(uid: number, parentId: number) {
        super(uid, 0, 16, 50, 0);

        this.parentId = parentId;
    }
}