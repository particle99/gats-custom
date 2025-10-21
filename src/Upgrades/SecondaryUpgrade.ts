import PlayerEntity from '../Entities/PlayerEntity';

export default class SecondaryUpgrade {
    public owner: PlayerEntity;

    public cooldown: number = 0; //not always used
    public active: boolean = false; //not always used
    public duration: number = 0; //not always used

    constructor(player: PlayerEntity) {
        this.owner = player;
    }

    activate(): void { }

    deactivate(): void { }

    update(): void { } //only used for upgrades that have a timeout (dash, shield, etc)
}