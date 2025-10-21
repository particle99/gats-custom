import { EntityStateFlags } from '../../../Enums/Flags';
import { AuxilaryUpdateFields, ActivationUpdateFields, FirstPersonUpdateFields, BulletActivationFields } from '../../../Enums/Fields';

type PlayerFields = {
    AUX_UPDATE_FIELDS: Array<AuxilaryUpdateFields>,
    ACTIVATION_UPDATE_FIELDS: Array<ActivationUpdateFields>,
    FIRST_PERSON_UPDATE_FIELDS: Array<FirstPersonUpdateFields>,
    BULLET_ACTIVATION_FIELDS: Array<BulletActivationFields>
};

type FieldConfig = { 
    states: EntityStateFlags[], 
    auxFields: AuxilaryUpdateFields[], 
    activationFields: ActivationUpdateFields[], 
    firstPersonFields: FirstPersonUpdateFields[], 
    bulletFields: BulletActivationFields[] 
};

export default class PlayerFieldManager {
    public state: Array<EntityStateFlags> = [];
    public fields: PlayerFields = {
        AUX_UPDATE_FIELDS: [],
        ACTIVATION_UPDATE_FIELDS: [],
        FIRST_PERSON_UPDATE_FIELDS: [],
        BULLET_ACTIVATION_FIELDS: []
    };

    private addState(states: EntityStateFlags[]): void {
        for (const state of states) {
            if (!this.state.includes(state)) {
                this.state.push(state);
            }
        }
    }

    private addAuxFields(fields: AuxilaryUpdateFields[]): void {
        for (const field of fields) {
            if (!this.fields.AUX_UPDATE_FIELDS.includes(field)) {
                this.fields.AUX_UPDATE_FIELDS.push(field);
            }
        }
    }

    private addActivationFields(fields: ActivationUpdateFields[]): void {
        for (const field of fields) {
            if (!this.fields.ACTIVATION_UPDATE_FIELDS.includes(field)) {
                this.fields.ACTIVATION_UPDATE_FIELDS.push(field);
            }
        }
    }

    private addFirstPersonFields(fields: FirstPersonUpdateFields[]): void {
        for (const field of fields) {
            if (!this.fields.FIRST_PERSON_UPDATE_FIELDS.includes(field)) {
                this.fields.FIRST_PERSON_UPDATE_FIELDS.push(field);
            }
        }
    }

    private addBulletActivationFields(fields: BulletActivationFields[]): void {
        for (const field of fields) {
            if (!this.fields.BULLET_ACTIVATION_FIELDS.includes(field)) {
                this.fields.BULLET_ACTIVATION_FIELDS.push(field);
            }
        }
    }

    public safeUpdate(config: Partial<FieldConfig>): void {
        if (config.states) this.addState(config.states);
        if (config.auxFields) this.addAuxFields(config.auxFields);
        if (config.activationFields) this.addActivationFields(config.activationFields);
        if (config.firstPersonFields) this.addFirstPersonFields(config.firstPersonFields);
        if (config.bulletFields) this.addBulletActivationFields(config.bulletFields);
    }

    public safeRemoveState(states: EntityStateFlags[]): void {
        for (const state of states) {
            const index = this.state.indexOf(state);
            if (index !== -1) {
                this.state.splice(index, 1);
            }
        }
    }

    public clearState(): void {
        this.state = [];
    }

    public clearFields(): void {
        this.fields = {
            AUX_UPDATE_FIELDS: [],
            ACTIVATION_UPDATE_FIELDS: [],
            FIRST_PERSON_UPDATE_FIELDS: [],
            BULLET_ACTIVATION_FIELDS: []
        }
    }
}