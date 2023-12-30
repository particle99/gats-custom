/** game server */
import { Game } from "../Game";

class ObjectEntity {
    /** game server */
    public game: Game;
    /** id */
    public id: number = 0;
    /** x */
    public x: number = 0;
    /** y */
    public y: number = 0;
    /** width */
    public width: number = 0;
    /** height */
    public height: number = 0;

    constructor(game: Game) {
        this.game = game;
    }
}

export { ObjectEntity };