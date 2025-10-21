import PlayerEntity from '../Entities/PlayerEntity';

export default class PrimaryUpgrade {
    public owner: PlayerEntity;

    constructor(player: PlayerEntity) {
        this.owner = player;
    }

    public applyUpgrade(): void { }
}