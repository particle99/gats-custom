import Game from "../../Game";
import { Gamemode } from "../Gamemode";

export default class FFA extends Gamemode { 
    constructor(game: Game) {
        super(game, "FFA", false, 0);

        //do not set score squares, this is handled natively on the client
    }
}