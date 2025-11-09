import Game from "../Game";

import { 
    AuxilaryUpdateFields, 
    AUX_UPDATE_PACKET_FIELDS, 
    ACTIVATION_UPDATE_PACKET_FIELDS, 
    FirstPersonUpdateFields, 
    FIRST_PERSON__UPDATE_PACKET_FIELDS, 
    BulletActivationFields, 
    BULLET_ACTIVATION_PACKET_FIELDS,
    ObjectUpdateFields,
    OBJECT_UPDATE_PACKET_FIELDS,
    ExplosiveActivationFields,
    EXPLOSIVE_ACTIVATION_PACKET_FIELDS,
    ExplodingUpdateFields,
    EXPLODING_UPDATE_PACKET_FIELDS
} from '../Enums/Fields';
import { Packets } from '../Enums/Flags';

import PacketType from './PacketType';
import PlayerEntity from '../Entities/PlayerEntity';
import Bullet from '../Entities/Bullet';
import { ExplodingObject, ExplosiveObject, FlagObject, RectangularMapObject } from "../Entities/MapObject";

export default class Codec {
    public game: Game;

    private readonly encoder = new TextEncoder();
    private readonly decoder = new TextDecoder();

    constructor(game: Game) {
        this.game = game;
    }

    public encode(message: string): Uint8Array {
        return this.encoder.encode(message);
    }

    public decode(message: ArrayBuffer): Array<PacketType> {
        const decoded = this.decoder.decode(message);
        const chunks = decoded.split('|');
        const output: PacketType[] = [];

        for (const chunk of chunks) {
            if (!chunk) continue;
            const parts = chunk.split(',');
            output.push({ code: parts[0], parts });
        }

        return output;
    }

    public loadPrerequisites(entity: PlayerEntity): void {
        const packetParts: Array<string> = [];

        for (const object of this.game.crateManager.objects.values()) {
            packetParts.push(this.buildObjectUpdatePacket(object, ['uid', 'type', 'x', 'y', 'angle']));
        }

        for (const explosive of this.game.explosiveManager.explosiveObjects.values()) {
            packetParts.push(this.buildExplosiveActivationPacket(explosive,  ['uid', 'type', 'x', 'y', 'spdX', 'spdY', 'emitting', 'emissionRadius', 'travelTime', 'ownerId', 'teamCode']))
        }

        for(const player of this.game.playerManager.players.values()) {
            packetParts.push(this.buildActivationUpdatePacket(player));
            packetParts.push(this.buildAuxilaryUpdatePacket(player, [ 'uid', 'invincible', 'armorAmount', 'radius' ]));
        }

        packetParts.push(this.buildLeaderboardPacket());
        entity.queueManager.addToQueue(packetParts.join(''));
    }

    public buildAuxilaryUpdatePacket(entity: PlayerEntity, include: Array<AuxilaryUpdateFields>): string {
        const packetParts: Array<string> = [Packets.AUX_UPDATE_PACKET];

        let lastIncludedIndex = -1;
        for (let i = 0; i < AUX_UPDATE_PACKET_FIELDS.length; i++) {
            if (include.includes(AUX_UPDATE_PACKET_FIELDS[i])) {
                lastIncludedIndex = i;
            }
        }

        for (let i = 0; i <= lastIncludedIndex; i++) {
            const field = AUX_UPDATE_PACKET_FIELDS[i];
            if(field === 'radius') {
                packetParts.push(`${entity.radius * 10}`)
            } else {
                const value = include.includes(field as AuxilaryUpdateFields) ? String(entity[field as keyof PlayerEntity]) : '';
                packetParts.push(value);
            }
        }

        //clear just in case
        entity.chatMessage = "";

        return packetParts.join(',') + '|';
    }

    public buildActivationUpdatePacket(entity: PlayerEntity): string {
        const packetParts: Array<string> = [Packets.ACTIVATE_ENTITY_PACKET];

        for (const field of ACTIVATION_UPDATE_PACKET_FIELDS) {
            if(field == 'ghillie') {
                packetParts.push('');
            } else if(field == 'x' || field == 'y' || field == 'radius') {
                //these fields are sent as * 10 to save bandwidth
                const value = String(entity[field as keyof PlayerEntity] as number * 10);
                packetParts.push(value);
            } else {
                const value = String(entity[field as keyof PlayerEntity]);
                packetParts.push(value);
            }
        }

        return packetParts.join(',') + '|';
    }

    public buildFirstPersonUpdatePacket(entity: PlayerEntity, include: Array<FirstPersonUpdateFields>): string {
        const packetParts: Array<string> = [Packets.FIRST_PERSON_UPDATE_PACKET];

        let lastIncludedIndex = -1;
        for (let i = 0; i < FIRST_PERSON__UPDATE_PACKET_FIELDS.length; i++) {
            if (include.includes(FIRST_PERSON__UPDATE_PACKET_FIELDS[i])) {
                lastIncludedIndex = i;
            }
        }

        for (let i = 0; i <= lastIncludedIndex; i++) {
            const field = FIRST_PERSON__UPDATE_PACKET_FIELDS[i];
            const value = include.includes(field as FirstPersonUpdateFields) ? String(entity[field as keyof PlayerEntity]) : '';
            packetParts.push(value);
        }

        return packetParts.join(',') + '|';
    }

    public buildBulletActivationPacket(entity: Bullet, include: Array<BulletActivationFields>): string {
        const packetParts: Array<string> = [Packets.ACTIVATE_BULLET_PACKET];

        let lastIncludedIndex = -1;
        for (let i = 0; i < BULLET_ACTIVATION_PACKET_FIELDS.length; i++) {
            if (include.includes(BULLET_ACTIVATION_PACKET_FIELDS[i])) {
                lastIncludedIndex = i;
            }
        }

        for (let i = 0; i <= lastIncludedIndex; i++) {
            const field = BULLET_ACTIVATION_PACKET_FIELDS[i];
            if (field == 'x' || field == 'y') {
                //fields are sent as * 10 to save bandwidth
                const value = String(entity[field as BulletActivationFields] as number * 10);
                packetParts.push(value);
            } else if (field == 'spdX' || field == 'spdY') {
                //these fields are NOT sent as * 10, * 25 to match up with client
                const value = String(entity[field as BulletActivationFields] as number * 25);
                packetParts.push(value);
            } else {
                const value = include.includes(field as BulletActivationFields) ? String(entity[field as keyof Bullet]) : '';
                packetParts.push(value);
            }
        }

        return packetParts.join(',') + '|';
    }

    public buildObjectUpdatePacket(entity: RectangularMapObject, include: Array<ObjectUpdateFields>): string {
        const packetParts: Array<string> = [Packets.LOAD_CRATES_PACKET];

        let lastIncludedIndex = -1;
        for (let i = 0; i < OBJECT_UPDATE_PACKET_FIELDS.length; i++) {
            if (include.includes(OBJECT_UPDATE_PACKET_FIELDS[i])) {
                lastIncludedIndex = i;
            }
        }

        for (let i = 0; i <= lastIncludedIndex; i++) {
            const field = OBJECT_UPDATE_PACKET_FIELDS[i];
            if (field === 'x' || field === 'y') {
                const value = include.includes(field as ObjectUpdateFields) ? String((entity[field as keyof RectangularMapObject] as number) * 10) : '';
                packetParts.push(value);
            } else {
                const value = include.includes(field as ObjectUpdateFields) ? String(entity[field as keyof RectangularMapObject]) : '';
                packetParts.push(value);
            }
        }

        return packetParts.join(',') + '|';
    }

    public buildExplosiveActivationPacket(explosive: ExplosiveObject, include: Array<ExplosiveActivationFields>): string {
        const packetParts: Array<string> = [Packets.ACTIVATE_EXPLOSIVE_PACKET];

        let lastIncludedIndex = -1;
        for (let i = 0; i < EXPLOSIVE_ACTIVATION_PACKET_FIELDS.length; i++) {
            if (include.includes(EXPLOSIVE_ACTIVATION_PACKET_FIELDS[i])) {
                lastIncludedIndex = i;
            }
        }

        for (let i = 0; i <= lastIncludedIndex; i++) {
            const field = EXPLOSIVE_ACTIVATION_PACKET_FIELDS[i];
            if (field === 'x' || field === 'y') {
                const value = include.includes(field as ExplosiveActivationFields) ? String(Math.floor((explosive[field as keyof ExplosiveObject] as number) * 10)) : '';
                packetParts.push(value);
            } else if (field === 'spdX' || field === 'spdY') {
                const value = include.includes(field as ExplosiveActivationFields) ? String(Math.floor((explosive[field as keyof ExplosiveObject] as number) * 10)) : '';
                packetParts.push(value);
            } else {
                const value = include.includes(field as ExplosiveActivationFields) ? String(explosive[field as keyof ExplosiveObject]) : '';
                packetParts.push(value);
            }
        }

        return packetParts.join(',') + '|';
    }

    public buildLoadExplodingObjectPacket(object: ExplodingObject, include: Array<ExplodingUpdateFields>): string {
        const packetParts: Array<string> = [Packets.UPDATE_EXPLOSIVE_PACKET];

        let lastIncludedIndex = -1;
        for (let i = 0; i < EXPLODING_UPDATE_PACKET_FIELDS.length; i++) {
            if (include.includes(EXPLODING_UPDATE_PACKET_FIELDS[i])) {
                lastIncludedIndex = i;
            }
        }

        for (let i = 0; i <= lastIncludedIndex; i++) {
            const field = EXPLODING_UPDATE_PACKET_FIELDS[i];
            if (field === 'x' || field === 'y' || field === 'emissionRadius') {
                const value = include.includes(field as ExplodingUpdateFields) ? String(Math.floor((object[field as keyof ExplodingObject] as number) * 10)) : '';
                packetParts.push(value);
            } else {
                const value = include.includes(field as ExplodingUpdateFields) ? String(object[field as keyof ExplodingObject]) : '';
                packetParts.push(value);
            }
        }

        return packetParts.join(',') + '|';
    }

    public buildLeaderboardPacket(): string {
        const packetParts: string[] = [
            Packets.LEADERBOARD_UPDATE_PACKET,
            String(this.game.playerManager.players.size)
        ];
        const playersArray: PlayerEntity[] = Array.from(this.game.playerManager.players.values());

        //sort by score
        playersArray.sort((a, b) => b.score - a.score);
        //only get top 10 players
        const topPlayers = playersArray.slice(0, 10);

        for (const player of topPlayers) {
            packetParts.push(`${player.username}.${player.isMember}.${player.score}.${player.kills}.${player.teamCode}`);
        }

        return packetParts.join(',') + '|';
    }

    public buildJoinPacket(player: PlayerEntity): string {
        return `a,${player.uid},${player.gun},${player.color},${player.x * 10},${player.y * 10},${player.radius * 10},${player.playerAngle},${player.armorAmount},${player.currentBullets},${player.maxBullets},${player.armor},${player.hp},${player.width},${player.height},${player.hpMax},${this.game.fogSize * 10},${this.game.fogSize * 10},${player.username},${player.invincible},${player.isLeader},${player.isPremiumMember},${player.teamCode},${0}|`;
    }

    public buildPlayerUpdatePacket(player: PlayerEntity): string {
        return `${Packets.UPDATE_ENTITY_PACKET},${player.uid},${Math.floor(player.x * 10)},${Math.floor(player.y * 10)},${Math.floor(player.spdX * 10)},${Math.floor(player.spdY * 10)},${player.playerAngle}|`;
    }

    public buildKillerInfoPacket(killed: PlayerEntity, killer: PlayerEntity): string {
        //TODO: track stats that have "0" as placeholder
        return `${Packets.KILLER_INFO_PACKET},${killed.score},${killed.kills},${0 /** time */},${0 /** shots fired */},${0 /** shots hit */},${0 /** damage dealt */},${0 /** damage received */},${0 /** distance covered */},${killer.username},${killer.isPremiumMember},${killer.gun},${killer.armor},${killer.color},${killer.kills},${killer.score},${killer.hp},${killer.armorAmount},${-1 /** level 1 power up */},${-1 /** level 2 powerup */},${-1 /** level 3 powerup */}|`;
    }

    public buildKillerOverlayPacket(killer: PlayerEntity): string {
        return `${Packets.OVERLAY_MESSAGES_PACKET},${2 /** type */},${killer.username}|`;
    }

    public buildCustomOverlayPacket(message: string): string {
        return `${Packets.OVERLAY_MESSAGES_PACKET},${10 /** custom message type */},${message}|`;
    }

    public buildRespawnPacket(): string {
        return `${Packets.RESPAWN_PACKET}|`;
    }

    public buildHitMarkerPacket(entity: PlayerEntity): string {
        return `${Packets.HIT_MARKER_PACKET},${Math.floor(entity.x * 10)},${Math.floor(entity.y * 10)}|`;
    }

    public buildPlayerDeadPacket(): string {
        return `${Packets.PLAYER_DEAD_PACKET}|`;
    }    

    public buildUnloadPlayerPacket(entity: PlayerEntity): string {
        return `${Packets.DEACTIVATE_ENTITY_PACKET},${entity.uid}|`;
    }

    public buildDeactivateBulletPacket(uid: number): string {
        return `${Packets.DEACTIVATE_BULLET_PACKET},${uid}|`;
    }
    
    public buildBulletUpdatePacket(entity: Bullet): string {
        return `${Packets.UPDATE_BULLET_PACKET},${entity.uid},${entity.x * 10},${entity.y * 10}|`;
    }

    public buildUnloadCratePacket(object: RectangularMapObject): string {
        return `${Packets.UNLOAD_CRATES_PACKET},${object.uid}|`;
    }

    public buildUnloadExplosivePacket(uid: number): string {
        return `${Packets.UNLOAD_EXPLOSIVE_PACKET},${uid}|`;
    }

    public buildGamemodePacket(gamemode: string): string {
        return `gameType,${gamemode}|`;
    }

    public buildCustomScoreSquarePacket(x: number, y: number, width: number, height: number, team: number): string {
        return `scoreSquare,${x},${y},${width},${height},${team}|`;
    }

    public buildFlagPositionPacket(flag: FlagObject): string {
        return `flagPos,${flag.x},${flag.y},${flag.team}|`;
    }

    public buildDisconnectPacket(): string {
        return `${Packets.DISCONNECT_PACKET}|`;
    }

    public buildPingPacket(): string {
        return '.|';
    }
}