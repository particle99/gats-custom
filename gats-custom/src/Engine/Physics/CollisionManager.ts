import { ObjectEntity } from "../ObjectEntity";
import { Entity } from "../Entity";

class CollisionManager {
    /** REDACTED
    public collidingRect(rect: ObjectEntity, player: Entity): boolean {
        const dx: number = Math.abs(player.x - (rect.x + rect.width / 2));
        const dy: number = Math.abs(player.y - (rect.y + rect.height / 2));
    
        if(dx > player.radius + rect.width / 2) return false;
        if(dy > player.radius + rect.height / 2) return false;
    
        if(dx <= rect.width) return true;
        if(dy <= rect.height) return true; 
    
        const dX: number = dx - rect.width;
        const dY: number = dy - rect.height

        return((dX * dX + dY * dY) <= (player.radius * player.radius));
    }
    */

    /** collisions between a circle and rect */
    public collidingRect(rect: ObjectEntity, player: Entity): any {
        let x, y: number = 0;

        if(player.x - rect.width > player.radius) x = rect.width - player.radius;
        if(player.y - rect.height > player.radius) y = rect.height - player.radius;
        if(player.x < player.radius) x = player.radius;
        if(player.y < player.radius) y = player.radius;

        return { x, y };
    }

    /** collisions between two circles */
    public collidingCircle(p1: Entity, p2: Entity): boolean {
        const radiusCombined: number = p1.radius + p2.radius;
        const xDiff: number = p1.x - p2.x;
        const yDiff: number = p1.y - p2.y;

        return radiusCombined > Math.sqrt((xDiff * xDiff) + (yDiff * yDiff));
    }
}

export { CollisionManager };