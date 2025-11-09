import PlayerEntity from "../../Entities/PlayerEntity";
import { EntityStateFlags } from "../../Enums/Flags";
import Game from "../../Game";
import PacketType from "../../Network/PacketType";
import { Gamemode } from "../Gamemode";
import { WebSocket } from "ws";

export default class FFA extends Gamemode { 
    constructor(game: Game) {
        super(game, "FFA", false, 0);

        //do not set score squares, this is handled natively on the client
    }

    override spawnPlayer(packet: PacketType, ws: WebSocket): void {
        //respawn
        if(this.game.networkManager.socketToPlayer.has(ws)) {
            const player = this.game.networkManager.socketToPlayer.get(ws);
            
            if(!player) return;

            player.respawn();
            player.queueManager.addToQueue(this.game.networkManager.codec.buildJoinPacket(player));
                        
            //still need to send crates every time you respawn,
            //gats removes crates when you unload the player
            this.game.networkManager.codec.loadPrerequisites(player);
            this.game.networkManager.broadcast(this.game.networkManager.codec.buildLeaderboardPacket());

            this.game.playerManager.generateSpawnPosition(player);

            player.fieldManager.safeUpdate({
                states: [EntityStateFlags.ACTIVATION_UPDATE, EntityStateFlags.FIRST_PERSON_UPDATE],
                firstPersonFields: ['score', 'currentBullets', 'maxBullets'],
            });
        } else {
            const player: PlayerEntity | null = this.game.playerManager.createPlayer(packet.parts);
            if(!player) return;

            this.game.networkManager.addPlayer(ws, player);

            this.game.playerManager.generateSpawnPosition(player);

            //join packet
            player.queueManager.addToQueue(this.game.networkManager.codec.buildJoinPacket(player));
            //gamemode packet
            player.queueManager.addToQueue(this.game.networkManager.codec.buildGamemodePacket(this.game.gameMode));

            //load score squares
            this.game.networkManager.loadScoreSquares(player);
            
            this.game.networkManager.codec.loadPrerequisites(player);
            this.game.networkManager.broadcast(this.game.networkManager.codec.buildLeaderboardPacket());

            //display custom join message
            if(this.game.config?.customClient !== undefined) {
                if(this.game.config.customClient) this.game.networkManager.broadcast(this.game.networkManager.codec.buildCustomOverlayPacket(`Player ${player.username} has joined the arena!`));
            }

            player.fieldManager.safeUpdate({
                states: [EntityStateFlags.ACTIVATION_UPDATE, EntityStateFlags.FIRST_PERSON_UPDATE],
                firstPersonFields: ['score', 'currentBullets', 'maxBullets']
            });
        }
    }

    override closePlayer(ws: WebSocket): void {
        const player = this.game.networkManager.socketToPlayer.get(ws);
        if (!player) return;

        this.game.networkManager.broadcast(this.game.networkManager.codec.buildUnloadPlayerPacket(player));
        this.game.networkManager.removePlayer(player);
    }

    override updatePlayers(players: Map<number, PlayerEntity>): void {
        for(const [uid, player] of players) {
            player.update();
            this.game.playerManager.checkCollisions(player);

            if(this.game.playerManager.isInScoreSquare(player) && (performance.now() - player.lastScoreSquareGain) > player.scoreSquareGainCooldown) {
                if(this.game.config?.scoreSquareEnabled !== undefined) {
                    if(this.game.config.scoreSquareEnabled !== true) {
                        continue;
                    }
                    this.game.playerManager.awardScoreSquareGain(player);
                } else {
                    this.game.playerManager.awardScoreSquareGain(player);
                }

                player.fieldManager.safeUpdate({
                    states: [EntityStateFlags.FIRST_PERSON_UPDATE],
                    firstPersonFields: ['score']
                });
            }

            if(this.game.playerManager.isInFog(player)) {
                player.isInFog = 1;
                player.damage(this.game.fogDamagePerTick, player.uid);
            } else {
                player.isInFog = 0;
            }
        }
    }
}