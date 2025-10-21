import PrimaryUpgrade from '../PrimaryUpgrade';
import PlayerEntity from '../../Entities/PlayerEntity';

export default class Thermal extends PrimaryUpgrade {
    constructor(player: PlayerEntity) {
        super(player);
    }

    public applyUpgrade(): void {
        //lol who even uses this
    }
}