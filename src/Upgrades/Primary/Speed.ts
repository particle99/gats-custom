import PrimaryUpgrade from '../PrimaryUpgrade';
import PlayerEntity from '../../Entities/PlayerEntity';

export default class Speed extends PrimaryUpgrade {
    constructor(player: PlayerEntity) {
        super(player);
    }

    public applyUpgrade(): void {
        this.owner.maxSpeed += 1.5; //not the case for LMG or pistol, but should be good enough (pistol is 1.6 and LMG is 1.3)
    }
}
