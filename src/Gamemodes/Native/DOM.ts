import Game from "../../Game";
import { Gamemode } from "../Gamemode";

export default class DOM extends Gamemode { 
    constructor(game: Game) {
        super(game, "DOM", true, 2);
    }
}