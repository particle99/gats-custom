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

    public arenaWidth: number = 0;
    public arenaHeight: number = 0;

    constructor(game: Game) {
        super(game, "CTF", true, 2);

        this.arenaWidth = this.game.arenaSize;
        this.arenaHeight = this.game.arenaSize;

        this.teamOneScoreSquare = {
            x: 0,
            y: 0,
            width: 500,
            height: this.arenaHeight,
            team: 1
        };
        this.teamTwoScoreSquare = {
            x: this.arenaWidth - 500,
            y: 0,
            width: 500,
            height: this.arenaHeight,
            team: 2
        };

        this.setScoreSquare(this.teamOneScoreSquare);
        this.setScoreSquare(this.teamTwoScoreSquare);

        //checkerboard style score squares
        /**for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 10; j++) {
                const team = (i + j) % 2 == 0 ? 1 : 2;
                this.setScoreSquare({
                    x: (i / 10) * this.arenaWidth,
                    y: (j / 10) * this.arenaHeight,
                    width: 200,
                    height: 200,
                    team: team
                });
            }
        }*/

        this.teamOneFlag = {};
        this.teamTwoFlag = {};
    }
}