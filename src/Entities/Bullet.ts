import Game from '../Game';

import PlayerEntity from './PlayerEntity';

import {
    BulletDamage, 
    BulletDistance, 
    BulletDropOff, 
    BulletSpeed, 
    BulletSpread, 
    MaxDropOff 
} from '../Enums/Enums';
import { RectangularMapObject } from './MapObjects/MapObjects';

export default class Bullet extends RectangularMapObject {
    private game: Game;
    public owner: PlayerEntity;

    public angle: number = 0;

    public spdX: number = 0;
    public spdY: number = 0;

    public invulnerable: boolean = true;
    public spawnTick: number = 0;

    public silenced: number = 0;
    public isKnife: number = 0;
    public isShrapnel: number = 0;
    
    public ownerId: number = 0;
    public teamCode: number = 0; //not used in ffa

    public speed: number = 0;
    public damage: number = 0;
    public spread: number = 0;

    public damageDropoffPerTick: number = 0;
    public maxDamageDropOff: number = 0;

    public bulletType: number = 0;

    public totalDistanceTraveled: number = 0;
    public maxDistanceTraveled: number = 0;

    public alive: boolean = true;

    constructor(game: Game, uid: number, owner: PlayerEntity, gunType: string, isShrapnel: number, isKnife: number) { 
        super(uid, -1, 0, 0, 0); //set width and height to 0 for now

        this.game = game;

        this.ownerId = owner.uid;
        this.owner = owner;

        this.isShrapnel = isShrapnel;
        this.isKnife = isKnife;

        if(!this.isShrapnel && !this.isKnife) {
            //values that are determined by the gun
            this.spread = this.owner.bulletSpread;
            this.damage = this.owner.bulletDamage;
            this.speed = BulletSpeed[gunType as keyof typeof BulletSpeed] * (this.game.config?.bulletSpeedMultiplier ? this.game.config.bulletSpeedMultiplier : 1);
            this.maxDistanceTraveled = BulletDistance[gunType as keyof typeof BulletDistance];
            this.damageDropoffPerTick = BulletDropOff[gunType as keyof typeof BulletDropOff];
            this.maxDamageDropOff = MaxDropOff[gunType as keyof typeof MaxDropOff];
            this.bulletType = this.owner.gun;
        }

        if(this.bulletType == 0) this.invulnerable = false;

        //configs
        this.game.config?.bulletSpeedMultiplier !== undefined && (this.speed *= this.game.config.bulletSpeedMultiplier);
        this.game.config?.damageMultplier !== undefined && (this.damage *= this.game.config.damageMultplier);
        this.game.config?.rangeMultiplier !== undefined && (this.maxDistanceTraveled *= this.game.config.rangeMultiplier);
    }

    private toRadians(degrees: number): number {
        return degrees * (Math.PI / 180);
    }

    public rand(range: number, offset: number): number {
        return Math.floor(Math.random() * range) + offset;
    }

    //used to determine spawn position based on the gun
    public getOffset(id: number): [number, number] { //[forward, left]
        switch(id) {
            case 0: return [14, -12]; // pistol
            case 1: return [34, -12]; // smg
            case 2: return [32, -12]; // shotgun
            case 3: return [44, -12]; // assault
            case 4: return [48, -12]; // sniper
            case 5: return [42, -12]; // lmg
            default: return [0, 0];
        }
    }

    //used to determine bullet width and length based on the gun
    public getBulletSize(id: number): [number, number] { //[width, length]
        switch(id) {
            case 0: return [2, 5];//pistol
            case 1: return [2, 5]; //smg
            case 2: return [2, 2]; //shotgun
            case 3: return [2, 5]; //assault
            case 4: return [2, 8]; //sniper
            case 5: return [2, 5]; //lmg
            default: return [0, 0];
        }
    }

    public applyBulletSpread(angle: number): void {
        const offset = (Math.random() + Math.random() - 1) * this.spread;
        
        const newAngle = angle + offset;
        this.angle = this.angle + offset;

        this.spdX = Math.cos(newAngle) * this.speed;
        this.spdY = Math.sin(newAngle) * this.speed;
    }

    public setSpawn(player: PlayerEntity): void {
        const [width, height] = this.getBulletSize(this.bulletType);

        const angleRad = this.toRadians(player.playerAngle);
        const sideAngleRad = angleRad + Math.PI / 2;

        this.width = width;
        this.height = height;

        const [forward, side] = this.getOffset(player.gun);

        //scale for custom radius
        const scale = player.radius / 20;
        const scaledForward = forward * scale;
        const scaledSide = side * scale;

        const forwardX = Math.cos(angleRad) * scaledForward;
        const forwardY = Math.sin(angleRad) * scaledForward;

        const sideX = Math.cos(sideAngleRad) * scaledSide;
        const sideY = Math.sin(sideAngleRad) * scaledSide;

        const radiusOffsetX = Math.cos(angleRad) * (player.radius / 2);
        const radiusOffsetY = Math.sin(angleRad) * (player.radius / 2);

        this.x = player.x + forwardX + sideX + radiusOffsetX;
        this.y = player.y + forwardY + sideY + radiusOffsetY;

        this.spawnTick = this.game.tick;
        this.angle = player.playerAngle;
        this.applyBulletSpread(angleRad);
    }

    public update(game: Game): void {
        this.x += this.spdX;
        this.y += this.spdY;

        if(this.bulletType !== 0) {
            if(game.tick - this.spawnTick > 1) this.invulnerable = false;
            if(this.damage > this.maxDamageDropOff) this.damage -= this.damageDropoffPerTick;
        }

        this.totalDistanceTraveled += Math.hypot(this.spdX, this.spdY);
    }
}