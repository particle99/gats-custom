import { WebSocket } from "ws";
import { CrateObject, FlagObject, Player } from "../../Entities/MapObject";
import PlayerEntity from "../../Entities/PlayerEntity";
import { EntityStateFlags } from "../../Enums/Flags";
import Game from "../../Game";
import { Gamemode, ScoreSquare } from "../Gamemode";
import PacketType from "../../Network/PacketType";
import { SpawnManager, SpawnArea } from "../../Entities/Managers/SpawnManager";

export class CaptureTheFlag extends Gamemode { 
    public teamOneScoreSquare: ScoreSquare;
    public teamTwoScoreSquare: ScoreSquare;

    public teamOneFlag!: FlagObject;
    public teamTwoFlag!: FlagObject;

    public teamOneMembers: number = 0;
    public teamTwoMembers: number = 0;

    public teamOneSpawnManager: SpawnManager;
    public teamTwoSpawnManager: SpawnManager;

    public arenaWidth: number = 0;
    public arenaHeight: number = 0;

    constructor(game: Game) {
        super(game, "CTF", true, 2);

        this.arenaWidth = this.game.arenaSize;
        this.arenaHeight = this.game.arenaSize;

        //team one home base
        this.teamOneScoreSquare = {
            x: 0,
            y: 0,
            width: 500,
            height: this.arenaHeight,
            team: 1
        };
        //team two home base
        this.teamTwoScoreSquare = {
            x: this.arenaWidth - 500,
            y: 0,
            width: 500,
            height: this.arenaHeight,
            team: 2
        };

        //save score squares
        this.setScoreSquare(this.teamOneScoreSquare);
        this.setScoreSquare(this.teamTwoScoreSquare);

        //spawn areas
        const teamOneSpawnArea: SpawnArea = {
            x: this.teamOneScoreSquare.x,
            y: this.teamOneScoreSquare.y,
            width: this.teamOneScoreSquare.width,
            height: this.teamOneScoreSquare.height
        };
        const teamTwoSpawnArea: SpawnArea = {
            x: this.teamTwoScoreSquare.x,
            y: this.teamTwoScoreSquare.y,
            width: this.teamTwoScoreSquare.width,
            height: this.teamTwoScoreSquare.height
        };

        //spawn managers
        this.teamOneSpawnManager = new SpawnManager(
            this.game, 
            teamOneSpawnArea,
            10
        );
        this.teamTwoSpawnManager = new SpawnManager(
            this.game,
            teamTwoSpawnArea,
            10
        );

        //init flags
        this.setupFlags();
    }

    private setupFlags(): void {
        //team one flag
        this.teamOneFlag = new FlagObject(this.game.crateManager.uid, 0);

        this.teamOneFlag.x = 750;
        this.teamOneFlag.y = Math.floor(Math.random() * this.arenaHeight);

        this.teamOneFlag.width = 75;
        this.teamOneFlag.height = 75;

        this.teamOneFlag.team = 1;

        this.game.crateManager.addObject(this.teamOneFlag);

        //team two flag
        this.teamTwoFlag = new FlagObject(this.game.crateManager.uid, 0);

        this.teamTwoFlag.x = this.arenaWidth - 750;
        this.teamTwoFlag.y = Math.floor(Math.random() * this.arenaHeight);

        this.teamTwoFlag.width = 75;
        this.teamTwoFlag.height = 75;

        this.teamTwoFlag.team = 2;

        this.game.crateManager.addObject(this.teamTwoFlag);
    }

    private onFlagPickup(player: PlayerEntity, flag: FlagObject): void {
        this.game.networkManager.broadcast(this.game.codec.buildCustomOverlayPacket(`${player.username} has stolen team ${flag.team == 1 ? "one's" : "two's"} flag!`));

        flag.stolen = true;
        flag.owner = player;
    }

    private isOnFlag(player: PlayerEntity, flag: FlagObject): boolean {
        if(flag.stolen) {
            return false;
        }
        
        const dx = player.x - flag.x;
        const dy = player.y - flag.y;
        
        const horizontalOverlap = Math.abs(dx) < (player.radius + flag.width) / 2;
        const verticalOverlap = Math.abs(dy) < (player.radius + flag.height) / 2;
        
        return horizontalOverlap && verticalOverlap;
    }

    private resetTeamOneFlag(): void {
        this.teamOneFlag.x = 750;
        this.teamOneFlag.y = Math.floor(Math.random() * this.arenaHeight);
        this.teamOneFlag.stolen = false;
    }

    private resetTeamTwoFlag(): void {
        this.teamTwoFlag.x = this.arenaWidth - 750;
        this.teamTwoFlag.y = Math.floor(Math.random() * this.arenaHeight);
        this.teamTwoFlag.stolen = false;
    }

    private resetFlags(): void {
        this.resetTeamOneFlag();
        this.resetTeamTwoFlag();
    }

    private broadcastWinner(player: PlayerEntity, flag: FlagObject): void {
        this.game.networkManager.broadcast(this.game.codec.buildCustomOverlayPacket(`${player.username} has successfully stolen team ${flag.team == 1 ? "one's" : "two's"} flag! Resetting...`))
    }

    private reset(players: Map<number, PlayerEntity>): void {
        this.resetFlags();

        //this.game.networkManager.broadcast(this.game.codec.buildDisconnectPacket());
    }

    override spawnPlayer(packet: PacketType, ws: WebSocket): void {
        //respawn
        if(this.game.networkManager.socketToPlayer.has(ws)) {
            const player = this.game.networkManager.socketToPlayer.get(ws);
            
            if(!player) return;

            player.respawn();
            player.queueManager.addToQueue(this.game.networkManager.codec.buildJoinPacket(player));
                        
            //still need to send crates every time you respawn,
            //gats removes crates when you unload the player
            this.game.networkManager.codec.loadPrerequisites(player);
            this.game.networkManager.broadcast(this.game.networkManager.codec.buildLeaderboardPacket());

            if(player.teamCode == 1) this.teamOneSpawnManager.spawnPlayer(player);
            if(player.teamCode == 2) this.teamTwoSpawnManager.spawnPlayer(player);

            player.fieldManager.safeUpdate({
                states: [EntityStateFlags.ACTIVATION_UPDATE, EntityStateFlags.FIRST_PERSON_UPDATE],
                firstPersonFields: ['score', 'currentBullets', 'maxBullets'],
            });
        } else {
            const player: PlayerEntity | null = this.game.playerManager.createPlayer(packet.parts);
            if(!player) return;

            //determine teamcode
            if(this.teamOneMembers > this.teamTwoMembers) {
                player.teamCode = 2;
                this.teamTwoMembers++;
            } else if(this.teamOneMembers < this.teamTwoMembers) {
                player.teamCode = 1;
                this.teamOneMembers++;
            } else if(this.teamOneMembers == this.teamTwoMembers) {
                const teamcode = Math.random();

                if(teamcode < 0.5) {
                    player.teamCode = 1;
                    this.teamOneMembers++;
                } else {
                    player.teamCode = 2;
                    this.teamTwoMembers++;
                }
            }

            console.log(player.teamCode);

            if(player.teamCode == 1) {
                player.color = 0; //red
                this.teamOneSpawnManager.spawnPlayer(player);
            }
            else {
                player.color = 4; //blue
                this.teamTwoSpawnManager.spawnPlayer(player);
            }
            this.game.networkManager.addPlayer(ws, player);

            //join packet
            player.queueManager.addToQueue(this.game.networkManager.codec.buildJoinPacket(player));
            //gamemode packet
            player.queueManager.addToQueue(this.game.networkManager.codec.buildGamemodePacket(this.game.gameMode));

            //load score squares
            this.game.networkManager.loadScoreSquares(player);
            
            this.game.networkManager.codec.loadPrerequisites(player);
            this.game.networkManager.broadcast(this.game.networkManager.codec.buildLeaderboardPacket());

            //display custom join message
            if(this.game.config?.customClient !== undefined) {
                if(this.game.config.customClient) this.game.networkManager.broadcast(this.game.networkManager.codec.buildCustomOverlayPacket(`Player ${player.username} has joined the arena!`));
            }

            player.fieldManager.safeUpdate({
                states: [EntityStateFlags.ACTIVATION_UPDATE, EntityStateFlags.FIRST_PERSON_UPDATE],
                firstPersonFields: ['score', 'currentBullets', 'maxBullets']
            });
        }
    }

    override closePlayer(ws: WebSocket): void {
        const player = this.game.networkManager.socketToPlayer.get(ws);
        if (!player) return;

        this.game.networkManager.broadcast(this.game.networkManager.codec.buildUnloadPlayerPacket(player));
        this.game.networkManager.removePlayer(player);

        if(player.teamCode == 1) this.teamOneMembers--;
        if(player.teamCode == 2) this.teamTwoMembers--;
    }

    override updatePlayers(players: Map<number, PlayerEntity>): void {
        for(const [uid, player] of players) {
            player.update();
            this.game.playerManager.checkCollisions(player);

            if(this.isOnFlag(player, this.teamOneFlag) && player.teamCode !== this.teamOneFlag.team) {
                this.onFlagPickup(player, this.teamOneFlag);
            }

            if(this.isOnFlag(player, this.teamTwoFlag) && player.teamCode !== this.teamTwoFlag.team) {
                this.onFlagPickup(player, this.teamTwoFlag);
            }
        }

        if(this.teamOneFlag.stolen == true) {
            this.game.networkManager.broadcast(this.game.codec.buildFlagPositionPacket(this.teamOneFlag));
        
            if(this.teamOneFlag.owner !== null) {
                this.teamOneFlag.x = this.teamOneFlag.owner.x;
                this.teamOneFlag.y = this.teamOneFlag.owner.y;

                if(this.teamOneFlag.x >= this.teamTwoScoreSquare.x) {
                    this.broadcastWinner(this.teamOneFlag.owner, this.teamOneFlag);
                    this.reset(players);
                }

                if(this.teamOneFlag.owner.dead == true) {
                    this.resetTeamOneFlag();

                    this.game.networkManager.broadcast(this.game.codec.buildCustomOverlayPacket(`Team one's flag was returned`));
                }
            }
        } 

        if(this.teamTwoFlag.stolen == true) {
            this.game.networkManager.broadcast(this.game.codec.buildFlagPositionPacket(this.teamTwoFlag));
        
            if(this.teamTwoFlag.owner !== null) {
                this.teamTwoFlag.x = this.teamTwoFlag.owner.x;
                this.teamTwoFlag.y = this.teamTwoFlag.owner.y;

                if(this.teamTwoFlag.x <= this.teamOneScoreSquare.x + this.teamOneScoreSquare.width) {
                    this.broadcastWinner(this.teamTwoFlag.owner, this.teamTwoFlag);
                    this.reset(players);
                }

                if(this.teamTwoFlag.owner.dead == true) {
                    this.resetTeamTwoFlag();

                    this.game.networkManager.broadcast(this.game.codec.buildCustomOverlayPacket(`Team two's flag was returned`));
                }
            }
        }
    }
}