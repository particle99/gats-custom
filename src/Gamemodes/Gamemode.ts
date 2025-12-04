import PlayerEntity from "../Entities/PlayerEntity";
import { EntityStateFlags } from "../Enums/Flags";
import Game from "../Game";
import PacketType from "../Network/PacketType";
import { WebSocket } from "ws";

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
            this.leader.fieldManager.safeUpdate({
                states: [EntityStateFlags.AUX_UPDATE],
                auxFields: ['uid', 'isLeader']
            });

            //set current leader
            this.leader = player;
            player.isLeader = 1;

            player.fieldManager.safeUpdate({
                states: [EntityStateFlags.AUX_UPDATE],
                auxFields: ['uid', 'isLeader']
            });
        } else if(this.leader == null) {
            this.leader = player;

            //update current leader
            player.isLeader = 1;

            player.fieldManager.safeUpdate({
                states: [EntityStateFlags.AUX_UPDATE],
                auxFields: ['uid', 'isLeader']
            });
        }
    }

    //players spawn differently across gamemodes; make this be handled by the specific game class
    spawnPlayer(packet: PacketType, ws: WebSocket): void { }

    //handle player closing
    closePlayer(ws: WebSocket): void { }

    //players are updated differently across gamemodes
    updatePlayers(players: Map<number, PlayerEntity>): void { }

    //not always used
    update(): void { }
}