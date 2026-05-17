import Game from '../../../Game';

import PlayerEntity from '../../../Entities/PlayerEntity';
import SecondaryUpgrade from '../../SecondaryUpgrade';
import { TunnelObject } from '../../../Entities/MapObjects/CrateObjects';

export default class Tunnel extends SecondaryUpgrade {
    private game: Game;

    private maxTunnelDistance = 2000;

    private tunnelObjectOne!: TunnelObject;
    private tunnelObjectTwo!: TunnelObject;

    constructor(owner: PlayerEntity, game: Game) {
        super(owner);

        this.game = game;
        this.owner.hasTunnels = true;
    }

    public activate(): void {
        if(!this.owner.tunnelLocationOne) {
            this.owner.tunnelLocationOne = { x: this.owner.x, y: this.owner.y };

            this.tunnelObjectOne = new TunnelObject(this.game.crateManager.uid, this.owner.uid);
            this.tunnelObjectOne.x = this.owner.x;
            this.tunnelObjectOne.y = this.owner.y;
            this.tunnelObjectOne.team = 0; //blue

            this.game.crateManager.addObject(this.tunnelObjectOne);
            this.game.crateManager.broadcastObject(this.tunnelObjectOne, ['uid', 'type', 'x', 'y', 'angle', 'parentId', 'team']);

        } else if(this.owner.tunnelLocationOne && !this.owner.tunnelLocationTwo) {
            const dx = this.owner.x - this.owner.tunnelLocationOne.x;
            const dy = this.owner.y - this.owner.tunnelLocationOne.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if(distance <= this.maxTunnelDistance) {
                this.owner.tunnelLocationTwo = { x: this.owner.x, y: this.owner.y };
                
                this.tunnelObjectTwo = new TunnelObject(this.game.crateManager.uid, this.owner.uid);
                this.tunnelObjectTwo.x = this.owner.x;
                this.tunnelObjectTwo.y = this.owner.y;
                this.tunnelObjectTwo.team = 1; //red

                this.game.crateManager.addObject(this.tunnelObjectTwo);
                this.game.crateManager.broadcastObject(this.tunnelObjectTwo, ['uid', 'type', 'x', 'y', 'angle', 'parentId', 'team']);
            }
        } else if(this.owner.tunnelLocationOne && this.owner.tunnelLocationTwo) {
            this.owner.tunnelLocationOne = null;
            this.owner.tunnelLocationTwo = null;

            this.game.crateManager.removeObject(this.tunnelObjectOne.uid);
            this.game.crateManager.removeObject(this.tunnelObjectTwo.uid);

            const overlayPacket = this.game.networkManager.codec.buildCustomOverlayPacket("Tunnels have been removed");
            this.owner.queueManager.addToQueue(overlayPacket);
        }
    }
}