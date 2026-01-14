import Game from '../../../Game';

import PlayerEntity from '../../../Entities/PlayerEntity';
import { EntityStateFlags } from '../../../Enums/Flags';

import { MedKitObject } from '../../../Entities/MapObjects/CrateObjects';

import SecondaryUpgrade from '../../SecondaryUpgrade';

export default class MedKit extends SecondaryUpgrade {
    private game: Game;

    public medkitObject!: MedKitObject;

    constructor(owner: PlayerEntity, game: Game) {
        super(owner);

        this.game = game;

        this.duration = 500; //20 seconds
        this.cooldown = 300; //12 seconds

        this.owner.rechargeTimer = this.cooldown;
    }

    public activate(): void {
        const placementDistance = 150;
        
        const angleRad = (this.owner.playerAngle * Math.PI) / 180;
        
        const medkitX = this.owner.x + Math.cos(angleRad) * placementDistance;
        const medkitY = this.owner.y + Math.sin(angleRad) * placementDistance;

        this.medkitObject = new MedKitObject(this.game.crateManager.uid, this.owner.uid);
        this.medkitObject.duration = this.duration;

        this.medkitObject.x = medkitX;
        this.medkitObject.y = medkitY;

        this.medkitObject.spawnTick = this.game.tick;

        this.game.crateManager.addObject(this.medkitObject);
        this.game.crateManager.broadcastObject(this.medkitObject, ['uid', 'type', 'x', 'y', 'angle', 'parentId']);
    
        this.owner.fieldManager.safeUpdate({
            states: [EntityStateFlags.FIRST_PERSON_UPDATE],
            firstPersonFields: ['rechargeTimer']
        });
    }
}