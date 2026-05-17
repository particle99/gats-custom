import PlayerEntity from "../PlayerEntity";
import { RectangularMapObject } from "./MapObjects";
import { EntityStateFlags } from "../../Enums/Flags";

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

export class TurretObject extends RectangularMapObject {
    public level: number = 1; //default

    constructor(uid: number, parentId: number) {
        super(uid, 7, 20, 20, 0);

        this.parentId = parentId;
    }

    public update(owner: PlayerEntity): void {
        //if(owner.kills >= 10) this.level = 1;
        //if(owner.kills >= 20) this.level = 2;
        //if(owner.kills >= 30) this.level = 3;
    }
}

export class ShieldObject extends RectangularMapObject {
    constructor(uid: number, parentId: number) {
        super(uid, 0, 16, 50, 0);

        this.parentId = parentId;
    }
}

export class TunnelObject extends RectangularMapObject {
    constructor(uid: number, parentId: number) {
        super(uid, 8, 40, 40, 0);
        this.parentId = parentId;
    }
}