import { GunEnum, ArmorEnum, ColorEnum, FireRates, GunWeight, ArmorWeight, ReloadSpeed, FireRatesInTicks, ReloadSpeedInTicks, MaxBullets } from '../Enums/Enums';
import { EntityStateFlags } from '../Enums/Flags';

import PlayerFieldManager from './Managers/Player/PlayerFieldsManager';
import PlayerInputManager from './Managers/Player/PlayerInputManager';

import { BulletDamage, BulletDistance, ProjectileDistance, BulletSpeed, BulletSpread } from '../Enums/Enums';

import { GuestNames } from '../Enums/GuestNames';

import PrimaryUpgrade from '../Upgrades/PrimaryUpgrade';
import SecondaryUpgrade from '../Upgrades/SecondaryUpgrade';
import Game from '../Game';
import { Player } from './MapObject';
import Dashing from '../Upgrades/Secondary/Misc/Dashing';
import QueueManager from './Managers/QueueManager';

type InputType = "LEFT" | "RIGHT" | "DOWN" | "UP" | "RELOADING" | "SPACE" | "MOUSEDOWN" | "CHAT"

const ArmorWeights: Record<number, number> = {
    0: 0,
    1: 12 / 10,
    2: 22 / 10,
    3: 32 / 10
};

export default class PlayerEntity extends Player {
    public game: Game;

    public fieldManager: PlayerFieldManager = new PlayerFieldManager();
    public inputManager: PlayerInputManager = new PlayerInputManager(this);
    public queueManager: QueueManager = new QueueManager(1000);

    public levelOneUpgrade?: PrimaryUpgrade;
    public levelTwoUpgrade?: SecondaryUpgrade;
    public levelThreeUpgrade?: PrimaryUpgrade;

    public gun: number;
    public armor: number;
    public color: number;

    public gunType: string = "";
    public armorType: string = "";
    public colorType: string = "";

    /** Player attributes */
    public playerAngle: number = 0;
    public mouseX: number = 0;
    public mouseY: number = 0;
    public armorAmount: number = 0;
    public maxArmor: number = 0;
    public currentBullets: number = 0;
    public maxBullets: number = 0;
    public score: number = 0;
    public kills: number = 0;
    public reloading: number = 0; //boolean
    public shooting: number = 0; //boolean
    public width: number = 1355; //viewport width
    public height: number = 768; //viewport height
    public level: number = 0;
    public username: string = ""; //weird.. ikr
    public invincible: number = 1; //boolean
    public isLeader: number = 0; //boolean
    public chatBoxOpen: number = 0; //boolean
    public chatMessage: string = "";
    public isInFog: number = 0; 
    public isMember: number = 0;
    public isPremiumMember: number = 0; //boolean
    public teamCode: number = 0;
    public fireRate: number = 0;
    public reloadSpeed: number = 0;

    public activeInputs: Set<InputType> = new Set();

    public dead: boolean = false;
    public killer: any;
    public currentBullet: Array<any> = [];

    /** Time bound */
    public lastShotTime: number = 0;
    public lastRegenTick: number = 0;
    public lastSentMessage: number = 0;
    public scoreSquareGainCooldown: number = 1500; //ms
    public scoreSquareGain: number = 15;
    public lastScoreSquareGain: number = 0;
    public rechargeTimer: number = 0;
    public ticksPerRegen: number = 2;
    public activationTick: number = 0;
    public reloadTick: number = 0; //used for reloading animation
    public healthRegenPerTick: number = 1;
    public armorRegenPerTick: number = 1;

    /** Upgrades */
    public ghillie: number = 0; //boolean (invis)
    public dashing: number = 0; //boolean
    public thermal: number = 0; //boolean
    public numExplosivesLeft: number = 0;
    public recoil: number = 1.0; //1.0 is default recoil, 0.0 is no recoil
    public silenced: number = 0; //boolean
    public bulletSpread: number = 1.0; //1.0 is default spread, lower is better
    public bulletDamage: number = 0;
    public damageReduction: number = 0; //used for kevlar upgrade
    
    /** Movement attributes */
    public armorWeight: number = 0;
    public gunWeight: number = 0;
    public spdX: number = 0;
    public spdY: number = 0;
    public accel: number = 2;
    public friction: number = 0.85;
    public diagonalSpeedMultiplier: number = 0.93; //stopwatch
    public maxSpeed: number = 10;
    public minVelocity: number = 0.5;
    
    constructor(game: Game, uid: number, gun: number, armor: number, color: number) {
        super(uid, 20);

        this.game = game;

        // build 
        this.gun = gun;
        this.armor = armor;
        this.color = color;
        this.armorAmount = this.armor * 30;
        this.maxArmor = this.armor * 30;
        this.gunType = GunEnum[this.gun];
        this.armorType = ArmorEnum[this.armor];
        this.colorType = ColorEnum[this.color];

        // upgrades
        this.bulletSpread = BulletSpread[this.gunType as keyof typeof BulletSpread];
        this.bulletDamage = BulletDamage[this.gunType as keyof typeof BulletDamage];

        // firerate and reload speed
        this.fireRate = FireRatesInTicks[this.gunType as keyof typeof FireRatesInTicks];
        this.reloadSpeed = ReloadSpeedInTicks[this.gunType as keyof typeof ReloadSpeedInTicks];

        // gun weight + armor weight
        this.gunWeight = GunWeight[this.gunType as keyof typeof GunWeight];
        this.maxBullets = MaxBullets[this.gunType as keyof typeof MaxBullets];
        this.currentBullets = this.maxBullets;
        this.maxSpeed = this.maxSpeed - this.gunWeight;
        this.maxSpeed = this.maxSpeed - ArmorWeights[this.armor];

        // config dependent attributes
        this.game.config?.maxHealth && (this.hpMax = this.game.config.maxHealth);
        this.game.config?.maxSpeed && (this.maxSpeed = this.game.config.maxSpeed);
        this.game.config?.startingScore ? this.score = this.game.config.startingScore : this.score = 0;
        this.game.config?.scoreSquareGain && (this.scoreSquareGain = this.game.config.scoreSquareGain);
        this.game.config?.healthRegenPerTick && (this.healthRegenPerTick = this.game.config.healthRegenPerTick);
        this.game.config?.armorRegenPerTick && (this.armorRegenPerTick = this.game.config.armorRegenPerTick);

        // armor config
        if(this.game.config?.allowLevelOneArmor) {
            if(!this.game.config.allowLevelOneArmor && this.armor == 1) this.armor = 0;
        }
        if(this.game.config?.allowLevelTwoArmor) {
            if(!this.game.config.allowLevelTwoArmor && this.armor == 2) this.armor = 0;
        }
        if(this.game.config?.allowLevelThreeArmor) {
            if(!this.game.config.allowLevelThreeArmor && this.armor == 3) this.armor = 0;
        }

        this.username = this.generateRandomGuestName();
    }

    private clearUpgrades(): void {
        this.levelOneUpgrade = undefined;
        this.levelTwoUpgrade = undefined;
        this.levelThreeUpgrade = undefined;
    }

    private clearFields(): void {
        this.activeInputs.clear();
        this.fieldManager.clearFields();
        this.fieldManager.clearState();
        this.queueManager.clearQueue();
    }

    private clearConditionals(): void {
        this.canShoot = false;
        this.canBeHit = false;
        this.canMove = false;
        this.hasMoved = false;
    }

    public generateRandomGuestName(): string {
        return "GatsCustom";
    }

    public updateMovement(input: InputType, state: number): void {
        this.inputManager.handleInput(input, state);
    }

    public setChatMessage(message: string): void {
        this.chatMessage = message;
    }

    public respawn(): void {
        //reset all player attributes
        this.radius = 20;
        this.hp = this.hpMax;
        this.game.config?.startingScore ? this.score = this.game.config.startingScore : this.score = 0;
        this.level = 0;
        this.currentBullets = this.maxBullets;
        this.reloading = 0;
        this.shooting = 0;
        this.beingHit = 0;
        this.invincible = 1;
        this.spdX = 0;
        this.spdY = 0;
        this.lastShotTime = 0;
        this.lastScoreSquareGain = 0;
        this.activationTick = 0;
        this.rechargeTimer = 0;
        this.chatBoxOpen = 0;
        this.chatMessage = "";
        this.lastSentMessage = 0;
        this.ghillie = 0;
        this.dashing = 0;
        this.thermal = 0;
        this.numExplosivesLeft = 0;
        this.killer = null;
        this.dead = false;
        this.currentBullet = [];

        //reset condtionals
        this.clearConditionals();

        //reset upgrades
        this.clearUpgrades();

        //reset fields
        this.clearFields();
    }

    public shoot(): void {
        if(!this.canShoot || this.invincible) return;

        this.shooting = 1;
        //save shot tick for fire rate
        this.lastShotTime = this.game.tick;
        //for testing (not permanent)
        if(this.gunType === "SHOTGUN") {
            //shotgun fires multiple bullets
            for(let i = 0; i < 8; i++) this.currentBullet.push(this.game.bulletManager.createBullet(this, 0, 0));
        } else this.currentBullet.push(this.game.bulletManager.createBullet(this, 0, 0));

        this.game.config?.bottomlessMags ? 0 : this.currentBullets--;

        //recoil
        const angle = (this.playerAngle * Math.PI / 180) + Math.PI;
        this.spdX += Math.cos(angle) * this.recoil;
        this.spdY += Math.sin(angle) * this.recoil;

        //update client
        this.fieldManager.safeUpdate({
            states: [EntityStateFlags.AUX_UPDATE, EntityStateFlags.FIRST_PERSON_UPDATE, EntityStateFlags.BULLET_ACTIVATION_UPDATE, EntityStateFlags.PROTECTED],
            auxFields: ['uid', 'shooting', 'currentBullets'],
            firstPersonFields: ['currentBullets'],
            bulletFields: ['uid', 'angle', 'height', 'width', 'spdX', 'spdY', 'isKnife', 'isShrapnel', 'ownerId', 'silenced']
        });
    }

    public usePowerup(): void {
        //TODO: enable powerups 
        //using powerups only applies to level two powerups
        if(!this.levelTwoUpgrade) return;

        if(this.game.config?.noMidPerkTimeout) {
            if(this.game.config.noMidPerkTimeout == true) {
                this.levelTwoUpgrade.activate();
                this.activationTick = this.game.tick;
            }
        } else {
            if(this.game.tick - this.activationTick <= this.levelTwoUpgrade.cooldown) return;
            
            this.levelTwoUpgrade.activate();
            this.activationTick = this.game.tick;
        }
    }

    public damage(damage: number, ownerId: number): void {
        if(this.dead) return;

        const owner = this.game.playerManager.players.get(ownerId);
        if(!owner) return;

        this.beingHit = 1;

        let leftoverDamage: number = damage;

        //if there is still armor, damage armor first
        if(this.armorAmount > 0) {
            if(damage > this.armorAmount) {
                leftoverDamage = damage - this.armorAmount;
                this.armorAmount = 0;
            } else {
                this.armorAmount -= damage;
            }
        } else { //no armor, damage hp
            if(this.hp >= damage) {
                this.hp -= Math.floor(leftoverDamage * (1 - this.damageReduction));
            } else if(this.hp < damage) {
                this.onDeath(ownerId);
            }
        }

        if(ownerId !== this.uid) {
            if(damage < 100) {
                owner.updateScore(damage);
            } else {
                owner.updateScore(100);
            }
        }
        
        //instant regen
        this.fieldManager.safeUpdate({
            states: [EntityStateFlags.AUX_UPDATE, EntityStateFlags.FIRST_PERSON_UPDATE, EntityStateFlags.PLAYER_REGENERATING],
            auxFields: ['uid', 'hp', 'armorAmount', 'beingHit']
        });
    }

    public onDeath(killer: number): void {
        //if the health is less than bullet damage, just set health to 0 when shot
        this.hp -= this.hp;
        this.canBeHit = false;
        this.canShoot = false;
        this.canMove = false;

        this.dead = true;

        this.spdX = 0;
        this.spdY = 0;

        //add player dying state, not player dead, to play the 
        //dying animation
        this.fieldManager.safeUpdate({
            states: [EntityStateFlags.PLAYER_DYING]
        });
        this.lastRegenTick = this.game.tick;
        this.killer = this.game.playerManager.players.get(killer);
        if(this.killer && this.killer.uid !== this.uid) {
            this.killer.fieldManager.safeUpdate({
                states: [EntityStateFlags.FIRST_PERSON_UPDATE],
                firstPersonFields: ['kills', 'score']
            });
            this.killer.kills++;
        }
    }

    public updateScore(damage: number): void {
        //not too sure if this is correct
        this.score += Math.round(damage * 0.9);

        this.fieldManager.safeUpdate({
            states: [EntityStateFlags.FIRST_PERSON_UPDATE],
            firstPersonFields: ['score']
        });
    }

    public updatePos(): void {
        if(!this.canMove) return;

        let inputX = 0;
        let inputY = 0;

        const isDashing = this.levelTwoUpgrade instanceof Dashing && this.levelTwoUpgrade.shouldIgnoreInput;
        
        if (!isDashing) {
            if (this.activeInputs.has("LEFT")) inputX -= 1;
            if (this.activeInputs.has("RIGHT")) inputX += 1;
            if (this.activeInputs.has("UP")) inputY -= 1;
            if (this.activeInputs.has("DOWN")) inputY += 1;

            if (inputX !== 0 && inputY !== 0) {
                const factor = Math.SQRT1_2 * this.diagonalSpeedMultiplier;
                inputX *= factor;
                inputY *= factor;
            }

            this.spdX += inputX * this.accel;
            this.spdY += inputY * this.accel;
        }

        this.spdX *= this.friction;
        this.spdY *= this.friction;

        const speed = Math.hypot(this.spdX, this.spdY);
        if (speed > this.maxSpeed) {
            const scale = this.maxSpeed / speed;
            this.spdX *= scale;
            this.spdY *= scale;
        }

        if (Math.abs(this.spdX) < this.minVelocity) this.spdX = 0;
        if (Math.abs(this.spdY) < this.minVelocity) this.spdY = 0;
    }

    public updateLevel(): void {
        if(this.score >= 100 && this.score < 300) this.level = 1;
        else if(this.score >= 300 && this.score < 600) this.level = 2;
        else if(this.score >= 600) this.level = 3;
    }

    public update(): void {
        this.updatePos();
        this.updateLevel();
    }
}