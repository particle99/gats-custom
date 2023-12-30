/** entity type */
import { Entity } from './Entity';
/** game server */
import { Game } from '../Game';
/** communication manager */
import { CommunicationManager } from './Managers/CommunicationManager';

/** ws */
import { WebSocket } from 'ws';

class Ticker {
    /** game server */
    public game: Game;
    /** entity type */
    public entity: Entity;
    /** socket */
    public socket: WebSocket
    /** comms manager */
    public state: CommunicationManager;
    /** last tick */
    public last: number;
    /** delta */
    public delta: number = 0;

    constructor(game: Game, entity: Entity, socket: WebSocket, state: CommunicationManager) {
        this.game = game;
        this.entity = entity;
        this.socket = socket;
        this.state = state;

        this.last = Date.now();
    }

    /** tick method */
    public tick(func: any): void {
        const now: number = Date.now();
        const elapsed: number = now - this.last;
        this.delta = elapsed / 1000;

        this.last = now;

        func(this.state, this.socket, this.entity, this.delta);
    }
}

export { Ticker };