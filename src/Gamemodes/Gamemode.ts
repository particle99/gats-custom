import PlayerEntity from "../Entities/PlayerEntity";

export default class Gamemode {
    public gamemode: string;

    public hasTeams: boolean;
    public teamAmount: number;

    public scoreSquares: Array<number> = [];

    constructor(gamemode: string, hasTeams: boolean, teamAmount: number) {
        this.gamemode = gamemode;

        this.hasTeams = hasTeams;
        this.teamAmount = teamAmount;
    }

    setScoreSquare(square: any): void { }
    setLeader(player: PlayerEntity): void { }
}