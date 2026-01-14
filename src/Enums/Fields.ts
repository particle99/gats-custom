import Bullet from '../Entities/Bullet';
import PlayerEntity from '../Entities/PlayerEntity';

import { 
    ExplodingObject, 
    ExplosiveObject 
} from '../Entities/MapObjects/ExplosiveObjects';
import { RectangularMapObject } from '../Entities/MapObjects/MapObjects';

type AuxilaryUpdateFields = keyof Pick<PlayerEntity,
    | 'uid'
    | 'currentBullets'
    | 'shooting'
    | 'reloading'
    | 'hp'
    | 'beingHit'
    | 'armorAmount'
    | 'radius'
    | 'ghillie'
    | 'maxBullets'
    | 'invincible'
    | 'dashing'
    | 'chatBoxOpen'
    | 'isLeader'
    | 'color'
    | 'chatMessage'
>;

type ActivationUpdateFields = keyof Pick<PlayerEntity,
    | 'uid'
    | 'gun'
    | 'color'
    | 'x'
    | 'y'
    | 'radius'
    | 'playerAngle'
    | 'armorAmount'
    | 'hp'
    | 'maxBullets'
    | 'username'
    | 'ghillie'
    | 'invincible'
    | 'isLeader'
    | 'isPremiumMember'
    | 'teamCode'
    | 'chatBoxOpen'
>;

type FirstPersonUpdateFields = keyof Pick<PlayerEntity,
    | 'currentBullets'
    | 'score'
    | 'kills'
    | 'rechargeTimer'
    | 'maxBullets'
    | 'width' //camera but it's not used
    | 'thermal'
    | 'numExplosivesLeft'
>;

type BulletActivationFields = keyof Pick<Bullet,
    | 'uid'
    | 'x'
    | 'y'
    | 'width'
    | 'height'
    | 'angle'
    | 'spdX'
    | 'spdY'
    | 'silenced'
    | 'isKnife' 
    | 'isShrapnel' //frag
    | 'ownerId'
    | 'teamCode'
>;

type ObjectUpdateFields = keyof Pick<RectangularMapObject,
    | 'uid' // assuming this maps to 'id'
    | 'type'
    | 'x'
    | 'y'
    | 'angle'
    | 'parentId'
    | 'hp'
    | 'maxHp'
    | 'isPremium'
    | 'team'
>;

type ExplosiveActivationFields = keyof Pick<ExplosiveObject, 
    | 'uid'
    | 'type'
    | 'x'
    | 'y'
    | 'spdX'
    | 'spdY'
    | 'travelTime'
    | 'emitting'
    | 'emissionRadius'
    | 'ownerId'
    | 'teamCode'
>;

type ExplodingUpdateFields = keyof Pick<ExplodingObject,
    | 'uid'
    | 'x'
    | 'y'
    | 'exploding'
    | 'emitting'
    | 'emissionRadius'
>;

const ACTIVATION_UPDATE_PACKET_FIELDS: Array<ActivationUpdateFields> = [
    'uid',
    'gun',
    'color',
    'x',
    'y',
    'radius',
    'playerAngle',
    'armorAmount',
    'hp',
    'maxBullets',
    'username',
    'ghillie',
    'invincible',
    'isLeader',
    'isPremiumMember',
    'teamCode',
    'chatBoxOpen'
];

const AUX_UPDATE_PACKET_FIELDS: Array<AuxilaryUpdateFields> = [
    'uid',
    'currentBullets',
    'shooting',
    'reloading',
    'hp',
    'beingHit',
    'armorAmount',
    'radius',
    'ghillie',
    'maxBullets',
    'invincible',
    'dashing',
    'chatBoxOpen',
    'isLeader',
    'color',
    'chatMessage'
];

const FIRST_PERSON__UPDATE_PACKET_FIELDS: Array<FirstPersonUpdateFields> = [
    'currentBullets',
    'score', 
    'kills',
    'rechargeTimer',
    'maxBullets',
    'width',
    'thermal',
    'numExplosivesLeft'
]

const BULLET_ACTIVATION_PACKET_FIELDS: Array<BulletActivationFields> = [
    'uid',
    'x',
    'y',
    'height',
    'width',
    'angle',
    'spdX',
    'spdY',
    'silenced',
    'isKnife',
    'isShrapnel',
    'ownerId',
    'teamCode'
];

const OBJECT_UPDATE_PACKET_FIELDS: Array<ObjectUpdateFields> = [
    'uid',
    'type',
    'x',
    'y',
    'angle',
    'parentId',
    'hp',
    'maxHp',
    'isPremium',
    'team'
];

const EXPLOSIVE_ACTIVATION_PACKET_FIELDS: Array<ExplosiveActivationFields> = [
    'uid',
    'type',
    'x',
    'y',
    'spdX',
    'spdY',
    'travelTime',
    'emitting',
    'emissionRadius',
    'ownerId',
    'teamCode'
];

const EXPLODING_UPDATE_PACKET_FIELDS: Array<ExplodingUpdateFields> = [
    'uid',
    'x',
    'y',
    'exploding',
    'emitting',
    'emissionRadius'
];

export { AuxilaryUpdateFields, ActivationUpdateFields, FirstPersonUpdateFields, BulletActivationFields, ObjectUpdateFields, ExplosiveActivationFields, ExplodingUpdateFields, AUX_UPDATE_PACKET_FIELDS, ACTIVATION_UPDATE_PACKET_FIELDS, FIRST_PERSON__UPDATE_PACKET_FIELDS, BULLET_ACTIVATION_PACKET_FIELDS, OBJECT_UPDATE_PACKET_FIELDS, EXPLOSIVE_ACTIVATION_PACKET_FIELDS, EXPLODING_UPDATE_PACKET_FIELDS }