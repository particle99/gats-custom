import Game from '../../Game';
import { WebSocket } from 'ws';

import { 
    Packets, 
    EntityStateFlags 
} from '../../Enums/Flags';
import { AuxilaryUpdateFields } from '../../Enums/Fields';
import { InputEnum } from '../../Enums/Enums';

import PlayerStateManager from '../../Entities/Managers/Player/PlayerStateManager';

import PacketType from '../PacketType';
import PlayerEntity from '../../Entities/PlayerEntity';
import Codec from '../Codec';

/** Primary upgrades */
import PrimaryUpgrade from '../../Upgrades/PrimaryUpgrade';
import NoRecoil from '../../Upgrades/Primary/NoRecoil';
import Binoculars from '../../Upgrades/Primary/Binoculars';
import Thermal from '../../Upgrades/Primary/Thermal';
import Damage from '../../Upgrades/Primary/Damage';
import LargeMag from '../../Upgrades/Primary/LargeMag';
import Accuracy from '../../Upgrades/Primary/Accuracy';
import Silencer from '../../Upgrades/Primary/Silencer';
import Speed from '../../Upgrades/Primary/Speed';
import Range from '../../Upgrades/Primary/Range';
import Kevlar from '../../Upgrades/Primary/Kevlar';

/** Secondary upgrades */
import Dashing from '../../Upgrades/Secondary/Misc/Dashing';
import SecondaryUpgrade from '../../Upgrades/SecondaryUpgrade';
import MedKit from '../../Upgrades/Secondary/Misc/MedKit';
import Shield from '../../Upgrades/Secondary/Misc/Shield';
import UserCrate from '../../Upgrades/Secondary/Misc/UserCrate';
import Grendade from '../../Upgrades/Secondary/Explosives/Grenade';
import Gas from '../../Upgrades/Secondary/Explosives/Gas';
import Frag from '../../Upgrades/Secondary/Explosives/Frag';
import Knife from '../../Upgrades/Secondary/Misc/Knife';
import LandMine from '../../Upgrades/Secondary/Explosives/LandMine';

type InputType = "LEFT" | "RIGHT" | "DOWN" | "UP" | "RELOADING" | "SPACE" | "MOUSEDOWN" | "CHAT"

export default class NetworkManager {
    public game: Game;

    public codec: Codec;
    private playerStateManager: PlayerStateManager;

    public socketToPlayer: Map<WebSocket, PlayerEntity>;
    public playerToSocket: Map<PlayerEntity, WebSocket>;

    public queue: Array<string> = [];

    constructor(game: Game, codec: Codec) {
        this.game = game;

        this.codec = codec;

        this.socketToPlayer = new Map();
        this.playerToSocket = new Map();

        this.playerStateManager = new PlayerStateManager(this.game, this);

        console.log("NetworkManager initialized");
    }

    public onMessage(message: ArrayBuffer, ws: WebSocket): void {
        const decodedPackets: Array<PacketType> = this.codec.decode(message);

        for (const packet of decodedPackets) {
            switch (packet.code) {
                case '0': 
                    this.onJoin(packet, ws); 
                    break;
                case 'm': 
                    this.onMouseUpdate(packet, ws);
                    break;
                case 'k': 
                    this.onMovement(packet, ws); 
                    break;
                case 'c': 
                    this.onChatMessage(packet, ws); 
                    break;
                case 'u': 
                    this.onUpgrade(packet, ws);
                    break;
                case '.': 
                    this.onPing(ws);
                    break;
            }
        }
    }

    public addToQueue(packet: string): void {
        this.queue.push(packet);
    }

    public addPlayer(ws: WebSocket, player: PlayerEntity): void {
        this.game.sockets.add(ws);
        this.socketToPlayer.set(ws, player);
        this.playerToSocket.set(player, ws);
    }

    public broadcast(message: string): void {        
        for(const player of this.socketToPlayer.values()) player.queueManager.addToQueue(message);
    }

    public broadcastToFiltered(filtered: Array<PlayerEntity>, message: string): void {
        for(const player of filtered) player.queueManager.addToQueue(message);
    }

    //literally used like once
    //SUPER inefficient - fix
    public filterOutPlayer(entity: PlayerEntity): Array<PlayerEntity> {
        let players = [];

        for(const player of this.game.playerManager.players.values()) {
            if(player === entity) continue;

            players.push(player);
        }

        return players;
    }

    public removePlayer(entity: PlayerEntity): void {
        const socket = this.playerToSocket.get(entity);

        if(!socket) return;

        this.socketToPlayer.delete(socket);
        this.playerToSocket.delete(entity);
        this.game.playerManager.deleteEntity(entity.uid);
    }

    public broadcastPlayerJoined(player: PlayerEntity): void {
        this.broadcast(this.codec.buildLeaderboardPacket());
        this.broadcast(this.codec.buildActivationUpdatePacket(player));
        this.broadcast(this.codec.buildAuxilaryUpdatePacket(player, [ 'uid', 'invincible', 'armorAmount', 'radius', 'color' ]));
    
        console.log("player joined with uid:", player.uid);
    }

    public loadScoreSquares(player: PlayerEntity): void {
        //if there are no custom score squares, loop will not run
        for(const square of this.game.gameClass.scoreSquares) {
            player.queueManager.addToQueue(this.codec.buildCustomScoreSquarePacket(square.x, square.y, square.width, square.height, square.team));
        }
    }

    public onJoin(packet: PacketType, ws: WebSocket): void {
        this.game.gameClass.spawnPlayer(packet, ws);
    }

    public onMouseUpdate(packet: PacketType, ws: WebSocket): void {
        const player = this.socketToPlayer.get(ws);

        if (!player) return;

        const mouseX = parseFloat(packet.parts[1]);
        const mouseY = parseFloat(packet.parts[2]);
        const angle = parseFloat(packet.parts[3]);

        player.mouseX = mouseX;
        player.mouseY = mouseY;
        player.playerAngle = angle;
    }

    public onMovement(packet: PacketType, ws: WebSocket): void {
        const inputNum: number = parseInt(packet.parts[1]);
        const state: number = parseInt(packet.parts[2]);
        const input: string = InputEnum[inputNum];

        if (!input) return;

        const entity = this.socketToPlayer.get(ws);

        if (!entity) return;

        entity.updateMovement(input as InputType, state);
    }

    public onChatMessage(packet: PacketType, ws: WebSocket): void {
        const player = this.socketToPlayer.get(ws);
        if (player === undefined || packet.parts.length < 2) return;

        const message = packet.parts[1].replace(/\0/g, '').trim();
        player.setChatMessage(message);
        //only include chatMessage if it's present in the packet
        const chatFields: AuxilaryUpdateFields[] = message !== "" 
            ? ['uid', 'chatBoxOpen', 'chatMessage'] 
            : ['uid', 'chatBoxOpen'];

        player.fieldManager.safeUpdate({
            states: [EntityStateFlags.AUX_UPDATE],
            auxFields: chatFields
        });
    }

    public onUpgrade(packet: PacketType, ws: WebSocket): void {
        const player = this.socketToPlayer.get(ws);
        if(player === undefined) return;

        const upgradeIndex = parseInt(packet.parts[1]);
        const upgradeLevel = parseInt(packet.parts[2]);

        if(upgradeLevel == 1 || upgradeLevel == 3) {
            if(this.game.config?.allowLevelOneUpgrades !== undefined) {
                if(this.game.config.allowLevelOneUpgrades !== true && upgradeLevel == 1) return;
            }

            if(this.game.config?.allowLevelThreeUpgrades !== undefined) {
                if(this.game.config.allowLevelThreeUpgrades !== true && upgradeLevel == 3) return;
            }

            if((upgradeLevel == 1 && player.levelOneUpgrade) || (upgradeLevel == 3 && player.levelThreeUpgrade)) {
                //already has an upgrade of this level
                return;
            }

            let upgrade: PrimaryUpgrade;

            switch(upgradeIndex) {
                case 0: upgrade = new NoRecoil(player); break;
                case 1: upgrade = new Binoculars(player); break;
                case 2: upgrade = new Thermal(player); break;
                case 3: upgrade = new Damage(player); break;
                case 4: upgrade = new LargeMag(player); break;
                case 5: upgrade = new Accuracy(player); break;
                case 6: upgrade = new Silencer(player); break;
                case 7: upgrade = new Speed(player); break;
                case 8: upgrade = new Range(player); break;
                case 9: upgrade = new Kevlar(player); break;
                default: return; //invalid upgrade index
            }

            upgradeLevel == 1 ? player.levelOneUpgrade = upgrade : player.levelThreeUpgrade = upgrade;
            
            //apply the upgrade
            upgrade.applyUpgrade();
        } else if(upgradeLevel == 2) {
            if(this.game.config?.allowLevelTwoUpgrades !== undefined) {
                if(this.game.config.allowLevelTwoUpgrades !== true) return;
            }

            if(player.levelTwoUpgrade) {
                //already has a level two upgrade
                return;
            }

            let upgrade: SecondaryUpgrade;
            let crateIsPremium = 0;

            if(this.game.config?.premiumCratesEnabled !== undefined) {
                if(this.game.config.premiumCratesEnabled === true) crateIsPremium = 1;
            }

            switch(upgradeIndex) {
                case 10: upgrade = new Shield(player, this.game); break;
                case 11: upgrade = new MedKit(player, this.game); break;
                case 12: upgrade = new Grendade(player, this.game); break;
                case 13: upgrade = new Knife(player, this.game); break;
                case 14: upgrade = new UserCrate(player, this.game, crateIsPremium); break;
                case 16: upgrade = new Dashing(player, this.game); break;
                case 17: upgrade = new Gas(player, this.game); break;
                case 18: upgrade = new LandMine(player, this.game); break;
                case 19: upgrade = new Frag(player, this.game); break;
                default: return;
            }

            player.levelTwoUpgrade = upgrade;
        }
    }

    public onPlayerClose(ws: WebSocket): void {
        this.game.gameClass.closePlayer(ws);
    }

    public onPing(ws: WebSocket): void {
        const player = this.socketToPlayer.get(ws);
        if(!player) return;

        player.queueManager.addToQueue(this.codec.buildPingPacket());
    }

    public update(): void {
        this.playerStateManager.updateGameState();

        //send queue
        for(let [ player, socket ] of this.playerToSocket) {
            const formatted = player.queueManager.format();
            const encoded = this.codec.encode(formatted);

            socket.send(encoded);
            //always clear queue after sending
            player.queueManager.clearQueue();
        }
    }
}