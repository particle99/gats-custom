import { CollisionManager  } from "./Physics/CollisionManager";
import { Vector, v2, mul, normalize } from "./Physics/Vector";
import { Game } from '../Game';

/** player entity gun types */
enum GunTypes {
    PISTOL = 0,
    SMG = 1,
    SHOTGUN = 2,
    ASSAULT = 3,
    SNIPER = 4,
    LMG = 5
}

/** entity states */
enum EntityStates {
    TO_BE_UPDATED = 0,
    TO_BE_DELETED = 1,
    UPDATED = 2,
    DELETED = 3,
    REFRESH = 4
}

class Entity {
    /** game server */
    public game: Game;
    /** collision manager */
    public collisions: CollisionManager;
    /** entity id */
    public id: number = 0;
    /** x */
    public x: number = 3500;
    /** y */
    public y: number = 3500;
    /** spdX */
    public spdX: number = 0;
    /** spdY */
    public spdY: number = 0;
    /** username */
    public username: string = "Guest";
    /** class (gun type) */
    public class: number = 0;
    /** color */
    public color: number = 0;
    /** radius */
    public radius: number = 200;
    /** angle */
    public angle: number = 0;
    /** score */
    public score: number = 1000;
    /** player angle */
    public playerAngle: number = 0;
    /** armor amount */
    public armorAmount: number = 0;
    /** current bullets */
    public currentBullets: number = 0;
    /** max bullets */
    public maxBullets: number = 0;
    /** kills */
    public kills: number = 0;
    /** armor */
    public armor: number = 0;
    /** hp */
    public hp: number = 0;
    /** c2 */
    public c2: any = {};
    /** hp max */
    public hpMax: number = 100;
    /** invincible */
    public invincible: boolean = false;
    /** isLeader */
    public isLeader: boolean = false;
    /** is member */
    public isMember: boolean = false;
    /** isPremiumMember */
    public isPremiumMember: boolean = false;
    /** teamcode */
    public teamcode: number = 0;
    /** max speed */
    public maxSpeed: number = 20;
    /** acceleration */
    public accel: Vector = new Vector(0, 0);
    /** velocity */
    public vel: Vector = new Vector(0, 0);
    /** position */
    public pos: Vector;

    /** delta stuff */
    public lastTick: number = 0;
    public currentTick: number = 0;
    public delta: number = 0;

    /** viewX and viewY */
    public viewX: number = 1350;
    public viewY: number = 950;

    /** entity state */
    public state: EntityStates = EntityStates.UPDATED;

    /** map data */
    public MAP_HEIGHT: number = 70000;
    public MAP_WIDTH: number = 70000;

    constructor(game: Game, gun: number, armor: number, color: number) {
        this.collisions = new CollisionManager();
        this.game = game;

        this.pos = new Vector(this.x, this.y);

        this.class = gun;
        this.armor = armor;
        this.color = color;

        this.c2 = {
            width: this.MAP_WIDTH,
            height: this.MAP_HEIGHT
        }

        this.hp = this.hpMax;

        this.game.entities.addEntity(this);
    }

    /** update method */
    public update(data: any): void {
            /** collisions between players and objects */
            for(const objectEntity of this.game.entities.objectEntities) {
                const { x, y } = this.collisions.collidingRect(objectEntity, this);

                console.log(x,y);

                this.x = x;
                this.y = y;
            }

            /** collisions between players */
            for(const playerEntity of this.game.entities.players) {
                if(playerEntity.state == 2) {
                    const colliding = this.collisions.collidingCircle(playerEntity, this);
                    if(colliding) {
                        this.spdX = 0;
                        this.spdY = 0;
                    }
                }
            }
        //};
        /** mouse upates */
        if(data.packet == "m") {
            this.angle = data.mouseAngle;
        }
    }

    /** set invincible */
    public setInvincible(invincible: boolean): void {
        this.invincible = invincible;
    }

    /** set player angle */
    public setPlayerAngle(playerAngle: number): void {
        this.playerAngle = playerAngle;
    }

    /** set x pos */
    public setX(x: number): void {
        this.x = x;
    }

    /** set y pos */
    public setY(y: number): void { 
        this.y = y;
    }
}

export { Entity };