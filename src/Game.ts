import { WebSocket, WebSocketServer } from 'ws';

import NetworkManager from './Network/Managers/NetworkManager';
import PlayerManager from './Entities/Managers/Player/PlayerManager';
import BulletManager from './Entities/Managers/BulletManager';
import CrateManager from './Entities/Managers/CrateManager';
import ExplosiveManager from './Entities/Managers/ExplosiveManager';
import SpawnManager from './Entities/Managers/SpawnManager';
import Codec from './Network/Codec';

import MazeGenerator from './Crate/MazeGenerator';

import crateData from './Crate/crateData.json';

import { Config } from './Enums/Config';
import { Gamemode } from './Gamemodes/Gamemode';

import FFA from './Gamemodes/Native/FFA';
import DOM from './Gamemodes/Native/DOM';
import TDM from './Gamemodes/Native/TDM';
import { CaptureTheFlag } from './Gamemodes/Custom/CTF';

export default class Game {
    /** Game server */
    private gameServer: WebSocketServer;

    /** Game managers */
    public networkManager: NetworkManager;
    public playerManager: PlayerManager;
    public bulletManager: BulletManager;
    public spawnManager: SpawnManager;
    public crateManager: CrateManager;
    public explosiveManager: ExplosiveManager;

    /** Network codec */
    public codec: Codec;

    /** Game server config */
    public gamePort: number = 443; //for https/wss
    public gameMode: string;
    public gameClass: Gamemode;

    /** Socket container */
    public sockets: Set<WebSocket>
    public ips: Map<string, number>; //<IP, connections>
    public socketToIp: Map<WebSocket, string>; //<WebSocket, IP>

    /** Crate data */
    public crateData: Array<any> = crateData;

    /** Arena size */
    public arenaSize: number = 7000;
    
    /** Room fog size */
    public baseFogSize: number = 2000;
    public maxFogSize: number = 7000;
    public fogSize: number = 2000;
    public fogDamagePerTick: number = 1;
    
    /** Current tick */
    public tick: number = 0;

    /** Game loop */
    private gameLoop: NodeJS.Timeout | null = null;

    /** Room speed */
    private roomSpeed: number = 1000 / 25;

    /** Game mutations */
    public config: Config;

    constructor(gameMode: string, config: Config) {
        const gameStartTime = Date.now();
        
        /** Current gamemode */
        this.gameMode = gameMode;
        this.config = config;
        
        /** Server */
        this.gameServer = new WebSocketServer({ port: this.gamePort });

        /** Sockets */
        this.sockets = new Set(); //container for sockets
        this.socketToIp = new Map(); //container for socket to IP mapping
        this.ips = new Map(); //container for IPs and their connections

        /** Maze */
        if(config?.generateMaze !== undefined) {
            /** Constants */
            const mapSize = this.arenaSize,
                cellSize = this.arenaSize / 100, //100 cells
                centerRadius = this.arenaSize / 14, //center radius scales with arena size
                centerX = this.arenaSize / 2,
                centerY = this.arenaSize / 2;

            const mazeGenerator = new MazeGenerator(mapSize, cellSize, centerRadius, centerX, centerY);
            let mazeData;

            /** Maze generation type */
            if(config.generateMaze?.open) mazeData = mazeGenerator.generateOpen();
            if(config.generateMaze?.organic) mazeData = mazeGenerator.generateOrganic();
            if(config.generateMaze?.backtrack) mazeData = mazeGenerator.generate();

            this.crateManager = new CrateManager(this, mazeData);
        } else {
            /** Default crate values */
            this.crateManager = new CrateManager(this, this.crateData);
        }

        /** Managers */
        this.codec = new Codec(this);
        this.networkManager = new NetworkManager(this, this.codec);
        this.spawnManager = new SpawnManager(this, this.arenaSize, this.arenaSize, this.fogSize, this.fogSize, 10); //10 valid spawn positions per chunk
        this.playerManager = new PlayerManager(this);
        this.bulletManager = new BulletManager(this, this.playerManager.spatialGrid);
        this.explosiveManager = new ExplosiveManager(this);

        /** Gamemode class */
        this.gameClass = this.getGamemodeClass(this.gameMode);

        /** Fog */
        if(config?.fogEnabled !== undefined) {
            if(!config.fogEnabled) this.fogSize = 7000;
        }
        if(config?.fogDamagePerTick !== undefined) {
            this.fogDamagePerTick = config.fogDamagePerTick;
        }
        if(config?.fogSize !== undefined) {
            if(config.fogSize > this.maxFogSize) {
                console.log(`Error: Configured fog size is greater than the max fog size of ${this.maxFogSize}`);
                return;
            } else if(config.fogSize < this.baseFogSize) {
                console.log(`Error: Configured fog size is less than the base fog size of ${this.baseFogSize}`);
                return;
            } else {
                this.fogSize = config.fogSize;
            }
        }

        /** Handle server events */
        this.handleServerEvents();

        console.log(`New ${this.gameMode} game initialized in ${Date.now() - gameStartTime}ms`);
    }

    private getGamemodeClass(gamemode: string): Gamemode {
        let gameClass: Gamemode;

        switch(gamemode) {
            case "FFA":
                gameClass = new FFA(this);
                break;
            case "DOM":
                gameClass = new DOM(this)
                break;
            case "TDM":
                gameClass = new TDM(this);
                break;
            case "CTF":
                gameClass = new CaptureTheFlag(this);
                break;
            default:
                throw new Error(`Error: unknown gamemode: ${gamemode}`);
        }

        return gameClass;
    }

    private handleServerEvents(): void {
        this.gameServer.on("connection", this.onConnection.bind(this));
        this.gameServer.on("close", this.onClose.bind(this));
        this.gameServer.on("error", this.onError.bind(this));
    }

    private onConnection(ws: WebSocket, req: any): void {
        if(req.url == "/ping") {
            this.sendPing(ws);
        } else if(req.url == "/") {
            this.sendConfirmation(ws);

            ws.on("close", () => this.onClose(ws));
            ws.on("message", (message: any) => this.networkManager.onMessage(message, ws)); //network manager handles this
        }
    }

    private onClose(ws: WebSocket): void {
        this.removeSocket(ws);
    }

    private onError(ws: WebSocket): void {
        //
    }

    private sendPing(ws: WebSocket): void {
        for(let i = 0; i < 5; i++) ws.send("ping");
    }

    private sendConfirmation(ws: WebSocket): void {
        ws.send(new TextEncoder().encode("."));
        ws.send(new TextEncoder().encode("+"));
    }

    private removeSocket(ws: WebSocket): void {
        if(!this.sockets.has(ws)) return;
        this.networkManager.onPlayerClose(ws);
    }

    private clearManagers(): void {
        this.playerManager.players.clear();
        this.bulletManager.bullets.clear();
        this.crateManager.objects.clear();
        /** Clear grids */
        this.playerManager.spatialGrid.clear();
        this.crateManager.spatialGrid.clear();
    }

    public updateGame(): void {
        if(this.gameLoop) return;

        this.gameLoop = setInterval(() => {    
            this.bulletManager.updateBullets();
            this.playerManager.updatePlayers();
            this.networkManager.update();
            this.crateManager.update();
            this.explosiveManager.update();
            this.bulletManager.updateBullets();

            this.tick++;
        }, this.roomSpeed);
    }

    public stopGame(): void {
        if(this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }

        this.gameServer.close();
        //this.sockets.clear();
        this.clearManagers();
    }
}