import PrimaryUpgrade from '../PrimaryUpgrade';
import PlayerEntity from '../../Entities/PlayerEntity';
import { EntityStateFlags } from '../../Enums/Flags';

export default class Thermal extends PrimaryUpgrade {
    constructor(player: PlayerEntity) {
        super(player);
    }

    public applyUpgrade(): void {
        //set thermal flag to 1
        this.owner.thermal = 1;

        //update client
        this.owner.fieldManager.safeUpdate({
            states: [EntityStateFlags.FIRST_PERSON_UPDATE],
            firstPersonFields: ['thermal']
        });
    }
}