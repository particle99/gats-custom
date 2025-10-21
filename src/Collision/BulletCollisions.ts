function rectCircleCollision(rectX: number, rectY: number, rectW: number, rectH: number, circleX: number, circleY: number, circleR: number): boolean {
    const closestX = Math.max(rectX, Math.min(circleX, rectX + rectW));
    const closestY = Math.max(rectY, Math.min(circleY, rectY + rectH));
    const dx = circleX - closestX;
    const dy = circleY - closestY;
    return dx * dx + dy * dy <= circleR * circleR;
}

function rectRectCollision(ax: number, ay: number, aw: number, ah: number,bx: number, by: number, bw: number, bh: number): boolean {
    return (
        ax < bx + bw &&
        ax + aw > bx &&
        ay < by + bh &&
        ay + ah > by
    );
}

export { rectCircleCollision, rectRectCollision };