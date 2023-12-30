/** game server */
import { Game } from "../../Game";

/** crate data */
import crateData from '../../Objects/crateData.json';

class ObjectManager {
    /** game server */
    public game: Game;
    /** crate entities */
    public crateEntities: any[] = [];

    constructor(game: any) {
        this.game = game;

        this.loadObjects();
    }

    public loadObjects(): any {
        /** load in object JSON */
        this.crateEntities = crateData;
    }
}

export { ObjectManager };