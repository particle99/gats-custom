/** game server */
import { Game } from "../../Game";
import { Entity } from "../Entity";
import { Ticker } from "../Ticker";

/** physics */
import { Vector, v2, mul, normalize } from "../Physics/Vector";

/** websocket */
import { WebSocket } from "ws";

class CommunicationManager {
    /** game server */
    public game: Game;
    /** encoder */
    public encoder: any = new TextEncoder();
    /** decoder */
    public decoder: any = new TextDecoder();
    /** currentEntity */
    public currentEntity: any = "";
    /** last packet */
    public lastPacket: any[] = [];
    /** current packet */
    public packet: any = "";
    /** all packets */
    public allPackets: any[] = [];
    /** ticks per second */
    public ticksPerSecond: number = 20;

    /** input */
    public left: boolean = false;
    public right: boolean = false;
    public up: boolean = false;
    public down: boolean = false;
    public reloading: boolean = false;
    public space: boolean = false;
    public mousedown: boolean = false;
    public chat: boolean = false;
    public delta: number = 0;

    constructor(game: Game) {
        this.game = game;
    }

    /** handler method */
    public handle(data: any, socket: WebSocket): void {
        this.decode(data, socket);
    }

    /** encoder method */
    public encode(data: string): ArrayBuffer {
        return this.encoder.encode(data);
    }

    /** decoder method */
    public decode(data: any, socket: WebSocket): any {
        const message: string = this.decoder.decode(data);

        const chunks: any[] = message.split("|");

        for(let i in chunks) {
            const parts = chunks[i].split(",");
            const packet = parts[0];

            this.packet = packet;
            switch(this.packet) {
                case "s":
                    this.onJoinPacket(parts, socket);
                    break;
                case "k":
                    this.onInputPacket(parts);
                    break;
                case "m":
                    this.onMousePacket(parts);
                    break;
                case ".":
                    this.onPingPacket(socket);
                    break;
            }
        }
    }

    /** update game state */
    public updateGameState(state: CommunicationManager, socket: WebSocket, entity: Entity, delta: number): void {
        let vPacket: string = `v,${state.game.entities.players.length}`; 
        let updatePacket: string = ``;
            
        for(const player of state.game.entities.players) {
            updatePacket += `b,${player.id},${player.x},${player.y},${player.spdX},${player.spdY},${player.playerAngle}|`;
            vPacket += `,${player.username}.${player.isMember == true ? 1 : 0}.${player.score}.${player.kills}.${player.teamcode}`;
        }

        vPacket += `|`;
        updatePacket += vPacket;

        socket.send(state.encoder.encode(updatePacket));
        for(const entity of state.game.entities.players) {
            updateEntity(entity, state);
        }
    }

    /** load objects (crates and long crates) */
    public loadPrerequesites(entity: Entity, socket: WebSocket): void {
        let spawnPacket: string = ``
        spawnPacket += `a,${entity.id},${entity.class},${entity.color},${entity.x},${entity.y},${entity.radius},${entity.angle},${entity.armor},${entity.currentBullets},${entity.maxBullets},${entity.armorAmount},${entity.hp},${entity.viewX},${entity.viewY},${entity.hpMax},${entity.MAP_WIDTH},${entity.MAP_HEIGHT},${entity.username},${entity.invincible == true ? 1 : 0},${entity.isLeader},${0},${entity.teamcode},|`
        
        for(const crate of this.game.objects.crateEntities) {
            let type: string = ``;

            if(crate.type == "crate") type = `${1}`;
            else if(crate.type == "longCrate") type = `${2}`;
            else if(crate.type == "userCrate") type = `${3}`;

            spawnPacket += `j,${crate.id},${type},${crate.x * 10},${crate.y * 10},${crate.angle}|`
        }

        let packetV: string = `v,${this.game.entities.players.length}`;

        for(const player of this.game.entities.players) {
            packetV += `,${player.username}.${player.isMember}.${player.score}.${player.kills}.${player.teamcode}`;
        }

        packetV += `|`;

        socket.send(this.encoder.encode(spawnPacket));

        const ticker = new Ticker(this.game, entity, socket, this);
        setInterval(() => {
            ticker.tick(this.updateGameState);
            this.delta = ticker.delta;
        }, 1000 / this.ticksPerSecond);
    }

    /** join packet handler */
    public onJoinPacket(data: any[], socket: WebSocket): void {
        let parsedData = {
            packet: data[0],
            gun: parseInt(data[1]),
            armor: parseInt(data[2]),
            color: parseInt(data[3])
        };

        const entity: Entity = new Entity(this.game, parsedData.gun, parsedData.armor, parsedData.color);
        this.game.entities.addEntity(entity);
        this.currentEntity = entity;

        const spawnPacket = `|a,${entity.id},${entity.class},${entity.color},${entity.x},${entity.y},${entity.radius},${entity.angle},${entity.armor},${entity.currentBullets},${entity.maxBullets},${entity.armorAmount},${entity.hp},${entity.viewX},${entity.viewY},${entity.hpMax},${entity.MAP_WIDTH},${entity.MAP_HEIGHT},${entity.username},${entity.invincible},${entity.isLeader},${0},${entity.teamcode},`
        socket.send(this.encoder.encode(spawnPacket));

        this.loadPrerequesites(entity, socket);
    }

    /** input packet handler */
    public onInputPacket(data: any[]): void {
        let parsedData = {
            packet: data[0],
            inputType: parseInt(data[1]),
            pressed: parseInt(data[2])
        }

        if(parsedData.inputType == 0) {
            if(parsedData.pressed == 1) this.left = true;
            else if(parsedData.pressed == 0) this.left = false;
        } else if(parsedData.inputType == 1) {
            if(parsedData.pressed == 1) this.right = true;
            else if(parsedData.pressed == 0) this.right = false;
        } else if(parsedData.inputType == 2) {
            if(parsedData.pressed == 1) this.up = true;
            else if(parsedData.pressed == 0) this.up = false;
        } else if(parsedData.inputType == 3) {
            if(parsedData.pressed == 1) this.down = true;
            else if(parsedData.pressed == 0) this.down = false;
        } else if(parsedData.inputType == 4) {
            if(parsedData.pressed == 1) this.reloading = true;
            else if(parsedData.pressed == 0) this.reloading = false;
        } else if(parsedData.inputType == 5) {
            if(parsedData.pressed == 1) this.space = true;
            else if(parsedData.pressed == 0) this.space = false;
        } else if(parsedData.inputType == 6) {
            if(parsedData.pressed == 1) this.mousedown = true;
            else if(parsedData.pressed == 0) this.mousedown = false;
        } else if(parsedData.inputType == 7) {
            if(parsedData.pressed == 1) this.chat = true;
            else if(parsedData.pressed == 0) this.chat = false;
        }

        this.currentEntity.update(this);
    }

    /** mouse packet handler */
    public onMousePacket(data: any[]): void {
        let parsedData = {
            packet: data[0],
            mouseX: parseInt(data[1]),
            mouseY: parseInt(data[2]),
            mouseAngle: parseInt(data[3])
        }

        this.currentEntity.update(parsedData);
    }

    /** ping packet handler */
    public onPingPacket(socket: WebSocket): void {
        socket.send(this.encoder.encode("."));
    }
}

function updateEntity(entity: Entity, data: any): void {
    /** i love you random <3 */
    entity.x = entity.pos.x;
    entity.y = entity.pos.y;

    entity.accel = new Vector(-data.left + data.right, -data.up + data.down);
    entity.accel.mul(entity.maxSpeed * data.delta);

    entity.vel.add(entity.accel);

    if(entity.accel.x !== 0 && entity.accel.y !== 0) {
        entity.vel.mul(0.95);

        const uVector = mul(normalize(entity.vel), entity.maxSpeed);

        entity.pos.x += uVector.x;
        entity.pos.y += uVector.y;
    }
}

function addFriction(entity: Entity, data: any): void {
    
}

export { CommunicationManager }