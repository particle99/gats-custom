import { ExplodingObject, ExplosiveObject } from "../../../Entities/MapObject";
import PlayerEntity from "../../../Entities/PlayerEntity";
import { EntityStateFlags } from "../../../Enums/Flags";
import Game from "../../../Game";
import SecondaryUpgrade from "../../SecondaryUpgrade";

export default class LandMine extends SecondaryUpgrade {
    private game: Game;

    public explosiveObject!: ExplosiveObject;
    public explodingObject!: ExplodingObject;

    public maxMines: number = 3;

    constructor(owner: PlayerEntity, game: Game) {
        super(owner);

        this.game = game;

        this.cooldown = 50;
        this.duration = 0;

        this.owner.rechargeTimer = this.cooldown;
        this.owner.numExplosivesLeft = this.maxMines;
    }

    activate(): void {
        if(this.owner.numExplosivesLeft == 0) return;

        const placementDistance = 50;
        
        const angleRad = (this.owner.playerAngle * Math.PI) / 180;
        
        const mineX = this.owner.x + Math.cos(angleRad) * placementDistance;
        const mineY = this.owner.y + Math.sin(angleRad) * placementDistance;

        this.explosiveObject = new ExplosiveObject(0, this.game, this.owner, 2);
        this.explodingObject = new ExplodingObject(0);

        this.explosiveObject.travelTime = 1500;
        this.explosiveObject.damagePerTick = 500; //insta kill

        this.explodingObject.emissionRadius = 175;
        this.explodingObject.explosionTicks = 7;
        this.explodingObject.radius = 20;

        this.explosiveObject.x = mineX;
        this.explosiveObject.y = mineY;

        this.explodingObject.x = mineX;
        this.explodingObject.y = mineY;

        this.game.explosiveManager.addObject(this.explosiveObject, this.explodingObject);

        this.owner.numExplosivesLeft--;

        this.owner.fieldManager.safeUpdate({
            states: [EntityStateFlags.FIRST_PERSON_UPDATE],
            firstPersonFields: ['rechargeTimer', 'numExplosivesLeft']
        });
    }
}