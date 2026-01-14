import Game from '../../../Game';

import PlayerEntity from '../../../Entities/PlayerEntity';
import { EntityStateFlags } from '../../../Enums/Flags';

import { ShieldObject } from '../../../Entities/MapObjects/CrateObjects';

import SecondaryUpgrade from '../../SecondaryUpgrade';

export default class Shield extends SecondaryUpgrade {
    private game: Game;

    public shieldObject!: ShieldObject;

    private originalMaxSpeed: number = 0;

    constructor(owner: PlayerEntity, game: Game) {
        super(owner);

        this.game = game;

        this.cooldown = 50; //2 seconds

        this.owner.rechargeTimer = this.cooldown;
    }

    activate(): void {
        if (this.active) return;

        this.shieldObject = new ShieldObject(this.game.crateManager.uid, this.owner.uid);
        
        this.active = true;
        
        this.originalMaxSpeed = this.owner.maxSpeed;
        this.owner.maxSpeed = Math.floor(this.owner.maxSpeed * 0.33);
        
        this.updateShieldPosition();
        
        this.owner.fieldManager.safeUpdate({
            states: [EntityStateFlags.PLAYER_SHIELDING],
            auxFields: [] 
        });
    }

    deactivate(): void {
        this.active = false;
        
        this.owner.maxSpeed = this.originalMaxSpeed;
        this.owner.activationTick = this.game.tick;
        
        this.owner.fieldManager.safeUpdate({
            states: [EntityStateFlags.PROTECTED, EntityStateFlags.FIRST_PERSON_UPDATE],
            firstPersonFields: ['rechargeTimer']
        });
        this.owner.fieldManager.safeRemoveState([EntityStateFlags.PLAYER_SHIELDING]);

        this.game.crateManager.removeObject(this.shieldObject.uid);
    }

    update(): void {
        if (this.active) {
            this.updateShieldPosition();
        }
    }

    private updateShieldPosition(): void {
        //this moves??
        const shieldDistance = 5;
        
        const angleRad = (this.owner.playerAngle * Math.PI) / 180;
        
        const shieldX = this.owner.x + Math.cos(angleRad) * (this.owner.radius + shieldDistance);
        const shieldY = this.owner.y + Math.sin(angleRad) * (this.owner.radius + shieldDistance);
        
        this.shieldObject.x = shieldX - this.shieldObject.width / 2;
        this.shieldObject.y = shieldY - this.shieldObject.height / 2;
        
        this.shieldObject.angle = this.owner.playerAngle;

        //do not broadcast shield object here; this is handled inside of crateManager.update
        this.game.crateManager.addObject(this.shieldObject);
    }
}