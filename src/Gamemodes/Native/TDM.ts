import Game from "../../Game";
import { Gamemode } from "../Gamemode";

export default class TDM extends Gamemode { 
    constructor(game: Game) {
        super(game, "TDM", true, 2);
    }
}