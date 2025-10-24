import PlayerEntity from '../../../Entities/PlayerEntity';
import { EntityStateFlags } from '../../../Enums/Flags';
import Game from '../../../Game';
import SecondaryUpgrade from '../../SecondaryUpgrade';

export default class Dashing extends SecondaryUpgrade {
    private game: Game;

    private dashSpeed: number = 25;
    private isDecelerating: boolean = false;
    private decelerationRate: number = 0.95;

    constructor(owner: PlayerEntity, game: Game) {
        super(owner);

        this.game = game;

        this.cooldown = 50; //8 seconds
        this.duration = 9;

        this.owner.rechargeTimer = this.cooldown;
    }

    private convertMouseCoords(): { worldX: number, worldY: number } {
        const worldX = this.owner.x - this.owner.mouseX;
        const worldY = this.owner.y - this.owner.mouseY;
        
        return { worldX, worldY };
    }

    activate(): void {
        if(this.active) return;

        this.active = true;
        this.isDecelerating = false;

        this.owner.dashing = 1;

        this.owner.fieldManager.safeUpdate({
            states: [EntityStateFlags.PLAYER_DASHING, EntityStateFlags.AUX_UPDATE, EntityStateFlags.PROTECTED],
            auxFields: ['uid', 'dashing'] 
        });
    }

    deactivate(): void {
        this.active = false;
        this.isDecelerating = true;

        this.owner.dashing = 0;
        this.owner.activationTick = this.game.tick;
 
        this.owner.fieldManager.safeRemoveState([EntityStateFlags.PLAYER_DASHING]);
        this.owner.fieldManager.safeUpdate({
            states: [EntityStateFlags.FIRST_PERSON_UPDATE, EntityStateFlags.AUX_UPDATE, EntityStateFlags.PROTECTED],
            auxFields: ['uid', 'dashing'],
            firstPersonFields: ['rechargeTimer']
        });
    }

    update(): void {
        if (this.active) {
            const { worldX, worldY } = this.convertMouseCoords();
            
            const deltaX = worldX - this.owner.x;
            const deltaY = worldY - this.owner.y;
            const distance = Math.hypot(deltaX, deltaY);
            
            if (distance > 0) {
                const normalizedX = deltaX / distance;
                const normalizedY = deltaY / distance;
                
                this.owner.spdX = normalizedX * this.dashSpeed;
                this.owner.spdY = normalizedY * this.dashSpeed;
            } else {
                this.owner.spdX = 0;
                this.owner.spdY = 0;
            }
        } else if (this.isDecelerating) {
            //deceleration
            this.owner.spdX *= this.decelerationRate;
            this.owner.spdY *= this.decelerationRate;
            
            const currentSpeed = Math.hypot(this.owner.spdX, this.owner.spdY);
            
            if (currentSpeed < this.owner.maxSpeed) {
                this.isDecelerating = false;
            }
        }
    }
    
    public get shouldIgnoreInput(): boolean {
        return this.active;
    }
}