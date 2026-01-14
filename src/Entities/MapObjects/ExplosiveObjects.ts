import Game from "../../Game";
import PlayerEntity from "../PlayerEntity";
import MapObject from "./MapObjects";

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