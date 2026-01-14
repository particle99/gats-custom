import Game from '../../../Game';

import { EntityStateFlags } from '../../../Enums/Flags';

import NetworkManager from '../../../Network/Managers/NetworkManager';
import PlayerEntity from '../../PlayerEntity';

//states that persist across ticks
const PERSISTENT_STATES = new Set([
    EntityStateFlags.PLAYER_REGENERATING,
    EntityStateFlags.PLAYER_DYING,
    EntityStateFlags.PLAYER_RELOADING,
    EntityStateFlags.PLAYER_SHOOTING,
    EntityStateFlags.PLAYER_DASHING,
    EntityStateFlags.PLAYER_SHIELDING
]);

export default class PlayerStateManager {
    private game: Game;
    public networkManager: NetworkManager;

    constructor(game: Game, networkManager: NetworkManager) {
        this.game = game;
        this.networkManager = networkManager;
    }

    public updateGameState(): void {
        //final broadcasted packet
        const finalPacket = [];

        for (const player of this.networkManager.game.playerManager.players.values()) {
            const playerPacket = [];

            //always include player update packet
            playerPacket.push(this.networkManager.codec.buildPlayerUpdatePacket(player));
            
            //handle player states if present
            if (player.fieldManager.state.length > 0) {
                for (const state of player.fieldManager.state) this.handlePlayerState(state, player, playerPacket);
            }

            //only append to final packet if there is something to send
            if (playerPacket.length > 0) {
                finalPacket.push(playerPacket.join('|'));
            }

            //cleanup player states for the next tick
            this.cleanupPlayerStates(player);
        }

        //only broadcast if there is something to send
        if (finalPacket.length > 0) {
            this.networkManager.broadcast(finalPacket.join('|'));
        }
    }

    public handlePlayerState(state: EntityStateFlags, player: PlayerEntity, finalPacket: Array<string>): void {
        switch (state) {
            case EntityStateFlags.AUX_UPDATE:
                finalPacket.push(this.networkManager.codec.buildAuxilaryUpdatePacket(player, player.fieldManager.fields.AUX_UPDATE_FIELDS));
                break;
            case EntityStateFlags.ACTIVATION_UPDATE:
                finalPacket.push(this.networkManager.codec.buildActivationUpdatePacket(player));
                break;
            case EntityStateFlags.UNLOAD_PLAYER:
                finalPacket.push(this.networkManager.codec.buildUnloadPlayerPacket(player));
                break;
            case EntityStateFlags.BULLET_ACTIVATION_UPDATE:
                finalPacket.push(this.handleBulletActivation(player));
                break;
            case EntityStateFlags.FIRST_PERSON_UPDATE:
                this.handleFirstPersonUpdate(player, finalPacket);
                break;
            case EntityStateFlags.PLAYER_DYING:
                this.handlePlayerDying(player);
                break;
            case EntityStateFlags.PLAYER_REGENERATING:
                this.handlePlayerRegeneration(player);
                break;
            case EntityStateFlags.PLAYER_SHOOTING:
                this.handlePlayerShooting(player);
                break;
            case EntityStateFlags.PLAYER_RELOADING:
                this.handlePlayerReloading(player);
                break;
            case EntityStateFlags.PLAYER_DASHING:
                this.handlePlayerDashing(player);
                break;
            case EntityStateFlags.PLAYER_SHIELDING:
                this.handlePlayerShielding(player);
                break;
            case EntityStateFlags.PROTECTED:
                break;
            default:
                throw new Error(`Unknown player state: ${state}`);
        }
    }

    public handleBulletActivation(player: PlayerEntity): string {
        let finalPacket: Array<string> = [];
        
        for(let bullet of player.currentBullet) finalPacket.push(this.networkManager.codec.buildBulletActivationPacket(bullet, player.fieldManager.fields.BULLET_ACTIVATION_FIELDS));
        
        player.currentBullet = []; //clear current bullets after sending activation packets

        return finalPacket.join('|');
    }

    public handleFirstPersonUpdate(player: PlayerEntity, finalPacket: Array<string>): void {        
        //update leaderboard only when score is changed on a player
        if (player.fieldManager.fields.FIRST_PERSON_UPDATE_FIELDS.includes('score')) {
            finalPacket.push(this.networkManager.codec.buildLeaderboardPacket());
            //update leader only when leaderboard is changed
            const topPlayers = this.game.playerManager.getTopPlayers();
            if(topPlayers.length > 0) this.game.gameClass.setLeader(topPlayers[0]);
        }

        //build packet
        const packet = this.networkManager.codec.buildFirstPersonUpdatePacket(player, player.fieldManager.fields.FIRST_PERSON_UPDATE_FIELDS);
        
        //first person update is not broadcasted, only sent to one player
        player.queueManager.addToQueue(packet);
    }

    public handlePlayerDying(player: PlayerEntity): void {
        if (player.radius > 0) {
            //dying animation
            player.radius -= 0.8;
            player.fieldManager.safeUpdate({
                states: [EntityStateFlags.AUX_UPDATE],
                auxFields: ['uid', 'radius', 'hp']
            });
        } else {
            //dying animation is done, so remove player dying state
            player.fieldManager.safeRemoveState([EntityStateFlags.PLAYER_DYING]);
            
            //clear all the states for the player to prepare for respawning
            player.fieldManager.clearState();
            player.fieldManager.clearFields();
            
            //kill + unload player if dying animation is done
            const unloadPlayerPacket = this.networkManager.codec.buildUnloadPlayerPacket(player);
            const playerKillerPacket = this.networkManager.codec.buildKillerInfoPacket(player, player.killer);
            const playerDeadPacket = this.networkManager.codec.buildPlayerDeadPacket();
            const respawnPacket = this.networkManager.codec.buildRespawnPacket();
            const overlayPacket = this.networkManager.codec.buildKillerOverlayPacket(player.killer);
            
            //only send above packets to the killed player
            player.queueManager.addToQueue(overlayPacket + playerDeadPacket + playerKillerPacket + respawnPacket);
            
            //do not send unload player packet to killed player, player is never loaded back in after spawn unless explicitly sent
            const filteredPlayers = this.networkManager.filterOutPlayer(player);
            this.networkManager.broadcastToFiltered(filteredPlayers, unloadPlayerPacket);
        }
    }

    public handlePlayerRegeneration(player: PlayerEntity): void {
        //keep adding health back until full hp
        const gameTick = this.networkManager.game.tick;
        const lastRegenTick = player.lastRegenTick;

        //because regen is only appened after being hit, make sure to remove the field
        if(
            !player.isInFog &&
            player.beingHit &&
            player.fieldManager.fields.AUX_UPDATE_FIELDS.includes('beingHit')
        ) {
            player.fieldManager.fields.AUX_UPDATE_FIELDS = player.fieldManager.fields.AUX_UPDATE_FIELDS.filter(field => field !== 'beingHit');
            player.beingHit = 0;
        }

        //only add health back if the hp is less than max hp and if
        if(player.hp < player.hpMax && gameTick - lastRegenTick > player.ticksPerRegen) {
            player.hp += player.healthRegenPerTick;
            player.lastRegenTick = gameTick;

            //send updated hp
            player.fieldManager.safeUpdate({
                states: [EntityStateFlags.AUX_UPDATE],
                auxFields: ['uid', 'hp']
            });
        } 
        //if the player is done healing hp, move onto armor
        else if(player.hp == player.hpMax && player.armorAmount < player.maxArmor && gameTick - lastRegenTick > player.ticksPerRegen) {
            player.armorAmount += player.armorRegenPerTick;
            player.lastRegenTick = gameTick;

            //send updated armor
            player.fieldManager.safeUpdate({
                states: [EntityStateFlags.AUX_UPDATE],
                auxFields: ['uid', 'armorAmount']
            })
        } 
        //if the player is fully done healing, removing player regen state
        else if(player.hp == player.hpMax && player.armorAmount == player.maxArmor) player.fieldManager.safeRemoveState([EntityStateFlags.PLAYER_REGENERATING]);
    }

    public handlePlayerShooting(player: PlayerEntity): void {
        const gameTick = this.networkManager.game.tick;
        const shotTick = player.lastShotTime;
        
        //if enough ticks have passed since the last shot, player can shoot again
        if (gameTick - shotTick >= player.fireRate && player.currentBullets > 0 && player.reloading === 0) player.shoot();
        
        //if bullets are at 0, automatically reload
        else if(player.currentBullets == 0 && player.reloading === 0) {
            player.shooting = 0;
            player.reloading = 1;
            player.canShoot = false;
            
            //just in case I think
            player.fieldManager.safeRemoveState([EntityStateFlags.PLAYER_SHOOTING]);
            
            //update client and save reload tick
            player.reloadTick = gameTick;
            player.fieldManager.safeUpdate({
                states: [EntityStateFlags.PLAYER_RELOADING, EntityStateFlags.AUX_UPDATE, EntityStateFlags.PROTECTED],
                auxFields: ['uid', 'reloading']
            })
        }
    }

    public handlePlayerReloading(player: PlayerEntity): void {
        const gameTick = this.networkManager.game.tick;
        const reloadTick = player.reloadTick;

        //if enough time has passed since the last reload, then reset bullets
        if(gameTick - reloadTick >= player.reloadSpeed) {
            player.reloading = 0;
            player.canShoot = true;
            
            //max out bullets
            player.currentBullets = player.maxBullets;

            //build custom overlay message packet for reloading complete
            //const overlayPacket = this.networkManager.codec.buildCustomOverlayPacket("Reload Complete");
            //player.queueManager.addToQueue(overlayPacket);
            
            //remove reloading state
            player.fieldManager.safeRemoveState([EntityStateFlags.PLAYER_RELOADING]);
            
            //send update to client to stop reloading animation and update bullets
            player.fieldManager.safeUpdate({
                states: [EntityStateFlags.AUX_UPDATE, EntityStateFlags.FIRST_PERSON_UPDATE, EntityStateFlags.PROTECTED],
                firstPersonFields: ['currentBullets'],
                auxFields: ['uid', 'currentBullets', 'reloading']
            });
        } else { }
    }

    public handlePlayerDashing(player: PlayerEntity): void {
        if(!player.levelTwoUpgrade) return;

        const gameTick = this.networkManager.game.tick;
        const dashTick = player.activationTick;
        const duration = player.levelTwoUpgrade.duration;

        // If player is still dashing, do not remove dashing state
        if(gameTick - dashTick <= duration) {
            //update upgrade
            player.levelTwoUpgrade.update();
            player.fieldManager.safeUpdate({
                states: [EntityStateFlags.PROTECTED, EntityStateFlags.AUX_UPDATE],
                auxFields: ['uid', 'dashing']
            });
        } else {
            player.levelTwoUpgrade.deactivate();
        }
    }

    public handlePlayerShielding(player: PlayerEntity): void {
        if(!player.levelTwoUpgrade) return;

        if(player.activeInputs.has("SPACE")) {
            player.levelTwoUpgrade.update();
        } else if(!player.activeInputs.has("SPACE")) {
            player.levelTwoUpgrade.deactivate();
        }
    }

    public cleanupPlayerStates(player: PlayerEntity): void {
        //if states includes PROTECTED, do not clear states at all (states are needed for the next tick but are not of type PERSISTENT)
        if(player.fieldManager.state.includes(EntityStateFlags.PROTECTED)) {
            //remove PROTECTED so protected states are removed next tick
            player.fieldManager.safeRemoveState([EntityStateFlags.PROTECTED]);
            return;
        } else {
            //not all states last across ticks, only append states that are persistent
            const persistentStates = player.fieldManager.state.filter((state: EntityStateFlags) => PERSISTENT_STATES.has(state));
                        
            //if no persistent states remain, clear everything
            if (persistentStates.length === 0) {
                player.fieldManager.clearState();
                player.fieldManager.clearFields();
            } else {
                player.fieldManager.state = persistentStates;
            }
        }
        //always clear first person fields
        player.fieldManager.fields.FIRST_PERSON_UPDATE_FIELDS = [];
    }
}