import Game from '../../Game';

import SpatialGrid from '../../Util/SpatialGrid';

import { ObjectUpdateFields } from '../../Enums/Fields';
import { RectangularMapObject } from '../MapObjects/MapObjects';

export default class CrateManager {
    public game: Game;

    public uid: number = 0;
    
    public objects: Map<number, RectangularMapObject>;

    public spatialGrid: SpatialGrid<RectangularMapObject>;

    constructor(game: Game, crateData: any) {
        this.game = game;
        this.objects = new Map();

        this.spatialGrid = new SpatialGrid<RectangularMapObject>(250);

        this.parseCrateData(crateData);

        console.log("CrateManager initialized");
    }

    private parseCrateData(data: any) {
        for(const crate of data) {
            if (crate.type === "crate") {
                crate.width = 100;
                crate.height = 100;
                crate.type = 1;
            } else if (crate.type === "longCrate") {
                if(crate.angle == 90) {
                    crate.width = 100;
                    crate.height = 50;
                } else if(crate.angle == 180) {
                    crate.width = 50;
                    crate.height = 100;
                }
                crate.type = 2;
            }

            const object = new RectangularMapObject(this.uid, crate.type, crate.width, crate.height, crate.angle);
            object.x = crate.x;
            object.y = crate.y;

            this.addObject(object);
        }
    }

    public addObject(object: RectangularMapObject): void {
        this.objects.set(object.uid, object);
        this.spatialGrid.insert(object);
        this.uid++;
    }

    public removeObject(uid: number): void {
        const object = this.objects.get(uid);

        if(!object) return;

        this.broadcastObjectUnload(object);
        this.objects.delete(uid);
        this.spatialGrid.remove(object);
    }

    public broadcastObject(object: RectangularMapObject, include: Array<ObjectUpdateFields>): void {
        const packet = this.game.codec.buildObjectUpdatePacket(object, include);
        this.game.networkManager.broadcast(packet);
    }

    public broadcastObjectUnload(object: RectangularMapObject): void {
        const packet = this.game.codec.buildUnloadCratePacket(object);
        this.game.networkManager.broadcast(packet);
    }

    public update(): void {
        for(const [uid, object] of this.objects) {
            //only update shields, medkits and user crates
            if(object.type == 6 || object.type == 5 || object.type == 3 || object.type == 0) {
                //medkits
                if(object.type == 5) {
                    if(this.game.tick - object.spawnTick > object.duration) {
                        this.removeObject(uid);
                        this.broadcastObjectUnload(object);
                    }
                }

                //user crates
                if(object.type == 3) {
                    if(this.game.tick - object.spawnTick > object.duration) {
                        this.removeObject(uid);
                        this.broadcastObjectUnload(object);
                    }

                    //broadcast object based on premium 
                    object.isPremium 
                        ? this.broadcastObject(object, ['uid', 'type', 'x', 'y', 'angle', 'parentId', 'isPremium', 'hp', 'maxHp']) 
                        : this.broadcastObject(object, ['uid', 'type', 'x', 'y', 'angle', 'parentId', 'hp', 'maxHp']);
                }

                //shields
                if(object.type == 0) this.broadcastObject(object, ['uid', 'type', 'x', 'y', 'angle', 'parentId']);
            
                //flags
                if(object.type == 6) this.broadcastObject(object, ['uid', 'type', 'x', 'y', 'angle', 'parentId', 'team']);
            }
        }
    }
}