import { UserCrateObject } from "../../../Entities/MapObject";
import PlayerEntity from "../../../Entities/PlayerEntity";
import SecondaryUpgrade from "../../SecondaryUpgrade";
import Game from "../../../Game";
import { EntityStateFlags } from "../../../Enums/Flags";
import { ObjectUpdateFields } from "../../../Enums/Fields";

export default class UserCrate extends SecondaryUpgrade {
    private game: Game;

    public isPremium: number = 0;

    public userCrateObject!: UserCrateObject;

    constructor(owner: PlayerEntity, game: Game, isPremium: number) {
        super(owner);

        this.game = game;

        this.isPremium = isPremium;

        this.duration = 10000; //400 seconds
        this.cooldown = 10; //12 seconds

        this.owner.rechargeTimer = this.cooldown;
    }

    public activate(): void {
        const placementDistance = 50;
        
        const angleRad = (this.owner.playerAngle * Math.PI) / 180;
        
        const userCrateX = this.owner.x + Math.cos(angleRad) * placementDistance;
        const userCrateY = this.owner.y + Math.sin(angleRad) * placementDistance;

        this.userCrateObject = new UserCrateObject(this.game.crateManager.uid, this.isPremium); //no premium as of right now
        this.userCrateObject.duration = this.duration;
        
        this.userCrateObject.x = userCrateX;
        this.userCrateObject.y = userCrateY;

        this.userCrateObject.spawnTick = this.game.tick;

        this.game.crateManager.addObject(this.userCrateObject);

        let fields: Array<ObjectUpdateFields> = [];

        switch(this.isPremium) {
            case 0:
                fields = ['uid', 'type', 'x', 'y', 'angle', 'parentId', 'hp', 'maxHp'];
                break;
            case 1:
                fields = ['uid', 'type', 'x', 'y', 'angle', 'parentId', 'isPremium', 'hp', 'maxHp'];
                break;
        }

        this.game.crateManager.broadcastObject(this.userCrateObject, fields);
    
        //might have to add PROTECTED if it gets cleared
        this.owner.fieldManager.safeUpdate({
            states: [EntityStateFlags.FIRST_PERSON_UPDATE],
            firstPersonFields: ['rechargeTimer']
        });
    }
}