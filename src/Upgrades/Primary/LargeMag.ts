import PrimaryUpgrade from '../PrimaryUpgrade';
import PlayerEntity from '../../Entities/PlayerEntity';

export default class LargeMag extends PrimaryUpgrade {
    constructor(player: PlayerEntity) {
        super(player);
    }

    public applyUpgrade(): void {
        this.owner.maxBullets += Math.floor(this.owner.maxBullets * 0.33); //33% more bullets
        this.owner.currentBullets = this.owner.maxBullets;
    }
}