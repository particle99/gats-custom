import PrimaryUpgrade from "../PrimaryUpgrade";
import PlayerEntity from "../../Entities/PlayerEntity";

export default class Ricochet extends PrimaryUpgrade {
    constructor(player: PlayerEntity) {
        super(player);
    }

    public applyUpgrade(): void {
        this.owner.bulletRicochet = true;
    }
}