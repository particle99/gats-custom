import Game from "../../Game";

import { WebSocket } from "ws";

import PlayerEntity from "../../Entities/PlayerEntity";
import { EntityStateFlags } from "../../Enums/Flags";

import PacketType from "../../Network/PacketType";

import {
    Gamemode,
    ScoreSquare
} from "../Gamemode";

import { 
    SpawnManager, 
    SpawnArea 
} from "../../Entities/Managers/SpawnManager";

interface HotZoneSquare { 
    teamOneMax: number,
    teamTwoMax: number,
    teamOneCurrent: number,
    teamTwoCurrent: number,
    scoreSquare: ScoreSquare
}

export default class Hotzone extends Gamemode {
    private hotzones: Map<number, HotZoneSquare> = new Map();

    constructor(game: Game) {
        super(game, "Hotzone", true, 2);
        

    }
}   