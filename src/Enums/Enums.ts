/** Misc enums */
export enum ArmorEnum {
    NONE = 0,
    LIGHT = 1,
    MEDIUM = 2,
    HEAVY = 3
}

export enum ColorEnum {
    RED = 0,
    ORANGE = 1,
    YELLOW = 2,
    GREEN = 3,
    BLUE = 4,
    PINK = 5
}

export enum GunEnum {
    PISTOL = 0,
    SMG = 1,
    SHOTGUN = 2,
    ASSAULT = 3,
    SNIPER = 4,
    LMG = 5,
    //FLAMETHROWER = 6
}

export enum FireRates {
    PISTOL = 360, //9 ticks
    SNIPER = 1600, //40 ticks
    SHOTGUN = 1000, //25 ticks
    SMG = 80, //2 ticks
    ASSAULT = 160, //4 ticks
    LMG = 120 //3 ticks
}

export enum FireRatesInTicks {
    PISTOL = 9,
    SNIPER = 40,
    SHOTGUN = 21,
    SMG = 2,
    ASSAULT = 4,
    LMG = 3,
}

export enum BulletSpeed {
    PISTOL = 120 / 10,
    SMG = 100 / 10,
    SHOTGUN = 120 / 10,
    ASSAULT = 100 / 10,
    SNIPER = 180 / 10,
    LMG = 100 / 10,
}

export enum BulletDistance {
    PISTOL = 360,
    SMG = 280,
    SHOTGUN = 280,
    SNIPER = 620,
    ASSAULT = 360,
    LMG = 340,
}

export enum ProjectileDistance {
    KNIFE = 0,
    GAS = 0,
    GRENADE = 48, //ticks
    FRAG = 0
}

export enum ProjectileSpeed {
    KNIFE = 80 / 10,
    GAS = 0 / 10,
    GRENADE = 80 / 10,
    FRAG = 0 / 10
}

export enum BulletSpread {
    PISTOL = 0.08,
    SMG = 0.08,
    SHOTGUN = 0.1,
    SNIPER = 0.05,
    ASSAULT = 0.08,
    LMG = 0.08,
}

/** NO DROPOFF */
export enum BulletDamage {
    SMG = 37,
    PISTOL = 60,
    SHOTGUN = 40, //per bullet
    ASSAULT = 48,
    SNIPER = 90,
    LMG = 38,
}

//per tick
export enum BulletDropOff {
    SMG = 1,
    PISTOL = 1,
    SHOTGUN = 2,
    ASSAULT = 1,
    SNIPER = 0,
    LMG = 1,
}

export enum MaxDropOff {
    SMG = 19,
    PISTOL = 30,
    SHOTGUN = 10,
    ASSAULT = 24,
    SNIPER = 90,
    LMG = 24,
}

//TICKS * MS PER TICK
export enum ReloadSpeed {
    SMG = 45 * 40, //1800ms
    PISTOL = 40 * 40, //1600ms
    SHOTGUN = 20 * 40, //1600ms
    ASSAULT = 60 * 40, //1600ms
    SNIPER = 40 * 40, //1600ms
    LMG = 120 * 40 //4800ms :O
}

export enum ReloadSpeedInTicks {
    SMG = 45,
    PISTOL = 40,
    SHOTGUN = 18,
    ASSAULT = 60,
    SNIPER = 40,
    LMG = 120,
}

export enum MaxBullets {
    PISTOL = 16,
    SMG = 30,
    SHOTGUN = 5,
    ASSAULT = 30,
    SNIPER = 6,
    LMG = 100,
}

export enum ArmorWeight {
    NONE = 0,
    LIGHT = 12 / 10,
    MEDIUM = 22 / 10,
    HEAVY = 32 / 10
}

export enum GunWeight {
    SMG = 23 / 10, //2.3
    PISTOL = 20 / 10, //2.0
    SHOTGUN = 27 / 10, //2.7
    ASSAULT = 27 / 10, //2.7
    WEIGHT = 25 / 10, //2.5
    LMG = 33 / 10, //3.3
}

export enum InputEnum {
    LEFT = 0,
    RIGHT = 1,
    UP = 2,
    DOWN = 3,
    RELOADING = 4, //"r"
    SPACE = 5,
    MOUSEDOWN = 6,
    CHAT = 7
}