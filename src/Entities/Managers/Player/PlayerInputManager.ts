import { EntityStateFlags } from '../../../Enums/Flags';
import { AuxilaryUpdateFields } from '../../../Enums/Fields';
import { ReloadSpeedInTicks } from '../../../Enums/Enums';

import PlayerEntity from '../../PlayerEntity';

type InputType = "LEFT" | "RIGHT" | "DOWN" | "UP" | "RELOADING" | "SPACE" | "MOUSEDOWN" | "CHAT"

export default class PlayerInputManager {
    private player: PlayerEntity;

    constructor(player: PlayerEntity) {
        this.player = player;
    }

    handleInput(input: InputType, state: number): void {
        if (state === 1) {
            this.player.activeInputs.add(input);
        } else {
            this.player.activeInputs.delete(input);
        }

        switch(input) {
            case "LEFT": case "RIGHT": case "UP": case "DOWN": this.handleMovement(input, state); break;
            case "RELOADING": this.handleReloading(state); break;
            case "SPACE": this.handleSpace(state); break;
            case "MOUSEDOWN": this.handleMouseDown(state); break;
            case "CHAT": this.handleChat(state); break;
        }
    }

    public handleMovement(input: InputType, state: number): void {
        if (!this.player.hasMoved) {
            if (["LEFT", "RIGHT", "UP", "DOWN"].includes(input) && state === 1) {
                this.player.hasMoved = true;
                this.player.canShoot = true;
                this.player.canBeHit = true;
                this.player.canMove = true;
                this.player.invincible = 0;

                this.player.fieldManager.safeUpdate({
                    states: [EntityStateFlags.AUX_UPDATE],
                    auxFields: ['uid', 'invincible']
                });
            }
        }
    }

    //TODO: handle reloading
    //There is a problem when reloading: after reloading, the player always has max bullets
    //fixed
    //new problem: player state is not cleared correctly and hit overlay is sent when shooting
    //also fixed: cleared STATES not FIELDS
    public handleReloading(state: number): void {
        if(state == 1 && this.player.reloading !== 1) {
            this.player.reloading = 1;
            this.player.canShoot = false;

            this.player.reloadTick = this.player.game.tick;
            //adjust shotgun reload speed based on bullets left
            if(this.player.gunType === "SHOTGUN") this.player.reloadSpeed = ReloadSpeedInTicks[this.player.gunType] * (this.player.maxBullets - this.player.currentBullets);
            this.player.fieldManager.safeUpdate({
                states: [EntityStateFlags.PLAYER_RELOADING, EntityStateFlags.AUX_UPDATE],
                auxFields: ['uid', 'shooting', 'currentBullets', 'maxBullets', 'reloading']
            });
        } else if(state == 0 && this.player.reloading !== 1) this.player.canShoot = true;
    }

    public handleSpace(state: number): void {
        if(state === 1 && this.player.level > 1) {
            this.player.usePowerup();
        }
    }

    public handleMouseDown(state: number): void {
        if(state === 1 && this.player.canShoot) {
            this.player.fieldManager.safeUpdate({
                states: [EntityStateFlags.PLAYER_SHOOTING]
            })
        } else {
            //remove shooting state
            this.player.fieldManager.safeRemoveState([EntityStateFlags.PLAYER_SHOOTING]);
            //if they are already shooting, 
            this.player.shooting = 0;
            //update client
            this.player.fieldManager.safeUpdate({
                states: [EntityStateFlags.AUX_UPDATE, EntityStateFlags.PROTECTED],
                auxFields: ['uid', 'shooting', 'currentBullets', 'maxBullets']
            });
        }
    }

    public handleChat(state: number): void {
        state == 1 ? this.player.chatBoxOpen = 1 : this.player.chatBoxOpen = 0;

        const chatFields: AuxilaryUpdateFields[] = this.player.chatMessage !== "" 
            ? ['uid', 'chatBoxOpen', 'chatMessage'] 
            : ['uid', 'chatBoxOpen'];

        this.player.fieldManager.safeUpdate({
            states: [EntityStateFlags.AUX_UPDATE],
            auxFields: chatFields
        });
    }
}