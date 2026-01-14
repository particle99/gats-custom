import Game from "../../../Game";

import { 
    ExplodingObject, 
    ExplosiveObject 
} from "../../../Entities/MapObjects/ExplosiveObjects";

import PlayerEntity from "../../../Entities/PlayerEntity";
import { EntityStateFlags } from "../../../Enums/Flags";

import SecondaryUpgrade from "../../SecondaryUpgrade";

export default class Grendade extends SecondaryUpgrade {
    private game: Game;

    public explosiveObject!: ExplosiveObject;
    public explodingObject!: ExplodingObject;

    public velocity: number = 15;

    constructor(owner: PlayerEntity, game: Game) {
        super(owner);

        this.game = game;

        this.cooldown = 50;
        this.duration = 0;

        this.owner.rechargeTimer = this.cooldown;
    }

    private toRadians(degrees: number): number {
        return degrees * (Math.PI / 180);
    }

    private calculateGrenadeVelocity(player: PlayerEntity): [number, number] {
        const angleRad = this.toRadians(player.playerAngle);
        
        const spdX = Math.cos(angleRad) * this.velocity;
        const spdY = Math.sin(angleRad) * this.velocity;
        
        return [spdX, spdY];
    }

    activate(): void {
        const grenadeX = this.owner.x;
        const grenadeY = this.owner.y;

        const [ spdX, spdY ] = this.calculateGrenadeVelocity(this.owner);

        this.explosiveObject = new ExplosiveObject(0, this.game, this.owner, 0);
        this.explodingObject = new ExplodingObject(0);

        this.explosiveObject.travelTime = 24;
        this.explosiveObject.damagePerTick = 250;

        this.explodingObject.emissionRadius = 200;
        this.explodingObject.explosionTicks = 7;

        this.explosiveObject.x = grenadeX;
        this.explosiveObject.y = grenadeY;
        this.explosiveObject.spdX = spdX;
        this.explosiveObject.spdY = spdY;

        this.explodingObject.x = grenadeX;
        this.explodingObject.y = grenadeY;
        this.explodingObject.spdX = spdX;
        this.explodingObject.spdY = spdY;

        //this.game.explosiveManager.addExplosiveObject(this.explosiveObject);
        //this.game.explosiveManager.addExplodingObject(this.explodingObject);
        this.game.explosiveManager.addObject(this.explosiveObject, this.explodingObject);

        this.owner.fieldManager.safeUpdate({
            states: [EntityStateFlags.FIRST_PERSON_UPDATE],
            firstPersonFields: ['rechargeTimer']
        });
    }
}