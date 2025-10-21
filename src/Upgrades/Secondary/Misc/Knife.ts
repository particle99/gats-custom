import Bullet from "../../../Entities/Bullet";
import PlayerEntity from "../../../Entities/PlayerEntity";
import { EntityStateFlags } from "../../../Enums/Flags";
import Game from "../../../Game";
import SecondaryUpgrade from "../../SecondaryUpgrade";

export default class Knife extends SecondaryUpgrade {
    private game: Game;

    public knifeObject!: Bullet;

    private velocity: number = 8;

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

    private calculateKnifeVelocity(player: PlayerEntity): [number, number] {
        const angleRad = this.toRadians(player.playerAngle);
        
        const spdX = Math.cos(angleRad) * this.velocity;
        const spdY = Math.sin(angleRad) * this.velocity;
        
        return [spdX, spdY];
    }

    activate(): void {
        const knifeObject = this.game.bulletManager.createCustomBullet(this.owner, 0, 1);

        if(!knifeObject) return;

        this.knifeObject = knifeObject;

        this.knifeObject.x = this.owner.x;
        this.knifeObject.y = this.owner.y;

        this.knifeObject.speed = this.velocity;
        this.knifeObject.maxDistanceTraveled = 400;
        this.knifeObject.damage = 500; //kill anyone instantly
        this.knifeObject.width = 1;
        this.knifeObject.height = 1;

        const [spdX, spdY] = this.calculateKnifeVelocity(this.owner);

        this.knifeObject.angle = this.toRadians(this.owner.playerAngle) * (180 / Math.PI);
        this.knifeObject.spdX = spdX;
        this.knifeObject.spdY = spdY;

        this.knifeObject.spawnTick = this.game.tick;
        this.knifeObject.invulnerable = false;

        const spawnPacket = this.game.networkManager.codec.buildBulletActivationPacket(this.knifeObject, ['uid', 'x', 'y', 'height', 'width', 'angle', 'spdX', 'spdY', 'isKnife', 'ownerId', 'teamCode']);
        this.game.networkManager.broadcast(spawnPacket);

        this.owner.fieldManager.safeUpdate({
            states: [EntityStateFlags.FIRST_PERSON_UPDATE],
            firstPersonFields: ['rechargeTimer']
        });
    }
}