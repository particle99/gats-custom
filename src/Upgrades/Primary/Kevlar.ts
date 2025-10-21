import PrimaryUpgrade from '../PrimaryUpgrade';
import PlayerEntity from '../../Entities/PlayerEntity';

export default class Kevlar extends PrimaryUpgrade {
    constructor(player: PlayerEntity) {
        super(player);
    }

    public applyUpgrade(): void {
        this.owner.damageReduction = 0.3;
    }
}