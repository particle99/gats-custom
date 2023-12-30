/** game server */
import { Game } from "../../Game";

/** entity */
import { Entity } from '../Entity';
import { ObjectEntity } from '../ObjectEntity';

class EntityManager {
    /** game server */
    public game: Game;
    /** object entities */
    public objectEntities: any[] = [];
    /** all entnties (not including objects) */
    public players: any[] = [];

    constructor(game: any) {
        this.game = game;
    }

    /** add entities */
    public addEntity(entity: Entity): void {
        this.players.push(entity);
    }

    /** add object entity */
    public addObjectEntity(objEntity: ObjectEntity): void {
        this.objectEntities.push(objEntity);
    }

    /** remove entity */
    public removeEntity(entity: Entity): void {
        if(entity instanceof ObjectEntity) delete this.objectEntities[entity.id];
        else delete this.players[entity.id];
    }

    /** update entity 
    public updateEntity(entity: Entity, data: any): void {
        entity.update(data);
    }
    */
}

export { EntityManager };