import { ExplodingObject, ExplosiveObject } from "../../../Entities/MapObject";
import PlayerEntity from "../../../Entities/PlayerEntity";
import { EntityStateFlags } from "../../../Enums/Flags";
import Game from "../../../Game";
import SecondaryUpgrade from "../../SecondaryUpgrade";

export default class Gas extends SecondaryUpgrade {
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

    public activate(): void {
        const gasX = this.owner.x;
        const gasY = this.owner.y;

        const [ spdX, spdY ] = this.calculateGrenadeVelocity(this.owner);

        this.explosiveObject = new ExplosiveObject(0, this.game, this.owner, 1);
        this.explodingObject = new ExplodingObject(0);

        this.explosiveObject.travelTime = 24;
        this.explosiveObject.damagePerTick = 1;
        
        this.explodingObject.radius = 175;
        this.explodingObject.explosionTicks = 7;
        this.explodingObject.emissionTicks = 375;

        this.explosiveObject.x = gasX;
        this.explosiveObject.y = gasY;
        this.explosiveObject.spdX = spdX;
        this.explosiveObject.spdY = spdY;

        this.explodingObject.x = gasX;
        this.explodingObject.y = gasY;
        this.explodingObject.spdX = spdX;
        this.explodingObject.spdY = spdY;

        this.game.explosiveManager.addObject(this.explosiveObject, this.explodingObject);

        this.owner.fieldManager.safeUpdate({
            states: [EntityStateFlags.FIRST_PERSON_UPDATE],
            firstPersonFields: ['rechargeTimer']
        });
    } 
}