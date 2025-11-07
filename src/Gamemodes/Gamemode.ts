import PlayerEntity from "../Entities/PlayerEntity";
import Game from "../Game";

export interface ScoreSquare {
    x: number,
    y: number,
    width: number,
    height: number,
    team: number
}

export class Gamemode {
    protected game: Game; 

    public gamemode: string;

    public leader: PlayerEntity | null = null;

    public hasTeams: boolean;
    public teamAmount: number;

    public scoreSquares: Array<ScoreSquare> = [];

    constructor(game: Game, gamemode: string, hasTeams: boolean, teamAmount: number) {
        this.game = game;
        
        this.gamemode = gamemode;

        this.hasTeams = hasTeams;
        this.teamAmount = teamAmount;
    }

    setScoreSquare(square: ScoreSquare): void { 
        this.scoreSquares.push({ 
            x: square.x, 
            y: square.y,
            width: square.width,
            height: square.height,
            team: square.team
        });
    }

    setLeader(player: PlayerEntity): void { 
        //if there is a previous leader, set leader flag to 0
        if(this.leader) {
            this.leader.isLeader = 0;

            //remove old leader
            this.game.networkManager.broadcast(this.game.codec.buildAuxilaryUpdatePacket(this.leader, ['uid', 'isLeader']));

            //set current leader
            this.leader = player;
        }

        //update current leader
        player.isLeader = 1;

        //broadcast current leader
        this.game.networkManager.broadcast(this.game.codec.buildAuxilaryUpdatePacket(player, ['uid', 'isLeader']));
    }
}