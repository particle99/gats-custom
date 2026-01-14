import PlayerEntity from "../PlayerEntity";
import { RectangularMapObject } from "./MapObjects";

export class FlagObject extends RectangularMapObject {
    public owner: PlayerEntity | null = null;
    public stolen: boolean = false;

    constructor(uid: number, parentId: number) {
        super(uid, 6, 50, 50, 0);
    }
}