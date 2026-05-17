import Game from '../../../Game';

import PlayerEntity from '../../../Entities/PlayerEntity';
import { TurretObject } from '../../../Entities/MapObjects/CrateObjects';

import SecondaryUpgrade from '../../SecondaryUpgrade';
import { EntityStateFlags } from '../../../Enums/Flags';

export default class Turret extends SecondaryUpgrade {
    private game: Game;

    public turretObject!: TurretObject;

    private placed: boolean;

    constructor(owner: PlayerEntity, game: Game) {
        super(owner);

        //note: turret is 20x20 size

        this.game = game;
        this.duration = 10000; //some amount of seconds idk how long

        this.placed = false; //whether the turret has been placed or not

        this.owner.hasTurret = true;

        //this.cooldown = 500; //some amount of seconds idk how long

        //this.owner.rechargeTimer = this.cooldown;
    }

    public activate(): void {
        if(this.placed) return; //only place one turret at a time

        const placementDistance = 100;
        
        const angleRad = (this.owner.playerAngle * Math.PI) / 180;
        
        const turretX = this.owner.x + Math.cos(angleRad) * placementDistance;
        const turretY = this.owner.y + Math.sin(angleRad) * placementDistance;

        this.turretObject = new TurretObject(this.game.crateManager.uid, this.owner.uid);

        this.turretObject.x = turretX;
        this.turretObject.y = turretY;

        this.turretObject.spawnTick = this.game.tick;

        this.game.crateManager.addObject(this.turretObject);
        this.game.crateManager.broadcastObject(this.turretObject, ['uid', 'type', 'x', 'y', 'angle', 'parentId']);

        const turretOverlayPacket = this.game.networkManager.codec.buildCustomOverlayPacket("Turret has been placed");
        this.owner.queueManager.addToQueue(turretOverlayPacket);

        //this.placed = true;

        this.owner.fieldManager.safeUpdate({
            states: [EntityStateFlags.FIRST_PERSON_UPDATE],
            firstPersonFields: ['rechargeTimer']
        });
    }
}
