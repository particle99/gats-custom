/** managers */
import { EntityManager } from './Engine/Managers/EntityManager';
import { CommunicationManager } from './Engine/Managers/CommunicationManager';
import { ObjectManager } from './Engine/Managers/ObjectManager';
import { PingManager } from './Engine/Managers/PingManager';

/** gamemodes */
import { FFA } from './Gamemode/FFA';
import { TDM } from './Gamemode/TDM';
import { DOM } from './Gamemode/DOM';

import { EventEmitter  } from 'stream';
import WebSocket from 'ws';

class Game extends EventEmitter {
    /** game server */
    public gameServer: WebSocket.Server;
    /** entity manager */
    public entities: EntityManager;
    /** object mananger */
    public objects: ObjectManager;
    /** communication manager */
    public communicator: CommunicationManager;
    /** ping handler */
    public pingManager: PingManager;
    /** open sockets */
    public sockets: any[] = [];
    /** current socket */
    public currentSocket: any = null;
    /** server port */
    public port: number;

    constructor(port: number) {
        super();

        this.port = port;

        this.entities = new EntityManager(this);
        this.objects = new ObjectManager(this);
        this.communicator = new CommunicationManager(this);
        this.pingManager = new PingManager(this);

        this.gameServer = new WebSocket.Server({ port: this.port });

        console.log("Started server on port " + this.port);

        this.setMaxListeners(100);

        this.bindServerEvents();
    }

    /** bind server events */
    public bindServerEvents(): void {
        this.gameServer.addListener("connection", this.onConnection.bind(this));
        this.gameServer.addListener("close", this.onClose.bind(this));
        this.gameServer.addListener("error", this.onError.bind(this));
    }

    /** bind events */
    public onConnection(ws: any, req: any): void {
        this.sockets.push(ws);
        this.currentSocket = ws;

        console.log(this.sockets.length);

        /** handle ping */
        if(req.url == "/ping") {
           for(var i = 0; i < 5; i++) this.currentSocket.send("ping!");
           return;
        } else if(req.url == "/") {
            this.currentSocket.send(new TextEncoder().encode("."));
            this.currentSocket.send(new TextEncoder().encode("+"));
            ws.on("message", (message: any) => {
                this.communicator.handle(message, this.currentSocket);
            });

            this.emit("connection", ws);
        }
    }
    
    /** ping handler */
    public onPing(message: any): void {
        this.pingManager.handle(message.data, this.currentSocket);
    }

    /** on close */
    public onClose(data: any): void {
        this.emit("close", data);
    }

    /** on error */
    public onError(err: any): void {
        this.emit("error", err);
    }
}

export { Game }