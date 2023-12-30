/** game server */
import { Game } from '../../Game';

/** ws */
import { WebSocket } from 'ws';

class PingManager {
    /** game server */
    public game: Game;

    /** encoder/decoder */
    public encoder: TextEncoder;
    public decoder: TextDecoder;

    constructor(game: Game) {
        this.game = game;

        this.encoder = new TextEncoder();
        this.decoder = new TextDecoder();
    }

    /** handle method */
    public handle(message: any, socket: WebSocket): void {
        for(var i = 0; i < 3; i++) socket.send(this.encoder.encode("."));
    }

}

export { PingManager };