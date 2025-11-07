import Game from "../../Game";
import { Gamemode, ScoreSquare } from "../Gamemode";

interface Flag {

}

export default class CaptureTheFlag extends Gamemode { 
    public teamOneScoreSquare: ScoreSquare;
    public teamTwoScoreSquare: ScoreSquare;

    public teamOneFlag: Flag;
    public teamTwoFlag: Flag;

    public teamOneMembers: number = 0;
    public teamTwoMembers: number = 0;

    public areanWidth: number = 0;
    public arenaHeight: number = 0;

    constructor(game: Game) {
        super(game, "CTF", true, 2);

        this.areanWidth = this.game.arenaSize;
        this.arenaHeight = this.game.arenaSize;

        this.teamOneScoreSquare = {
            x: 0,
            y: 0,
            width: 500,
            height: this.arenaHeight,
            team: 1
        };
        this.teamTwoScoreSquare = {
            x: this.areanWidth - 500,
            y: 0,
            width: 500,
            height: this.arenaHeight,
            team: 2
        };

        this.setScoreSquare(this.teamOneScoreSquare);
        this.setScoreSquare(this.teamTwoScoreSquare);

        this.teamOneFlag = {};
        this.teamTwoFlag = {};
    }
}