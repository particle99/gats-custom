function circleRectCollision(cx: number, cy: number, radius: number, rx: number, ry: number, rw: number, rh: number): boolean {
    const closestX = Math.max(rx, Math.min(cx, rx + rw));
    const closestY = Math.max(ry, Math.min(cy, ry + rh));

    const distX = cx - closestX;
    const distY = cy - closestY;

    return (distX * distX + distY * distY) < (radius * radius);
}

function circleCircleCollision(x1: number, y1: number, r1: number, x2: number, y2: number, r2: number): boolean {
    const dx = x1 - x2;
    const dy = y1 - y2;
    const distanceSquared = dx * dx + dy * dy;
    const radiusSum = r1 + r2;

    return distanceSquared < radiusSum * radiusSum;
}

function collidesAt(crateData: Array<any>, x: number, y: number, radius: number, viewLeft: number, viewRight: number, viewBottom: number, viewTop: number): boolean {
    for (const crate of crateData) {
        const crateX = crate.x - (crate.width / 2);
        const crateY = crate.y - (crate.height / 2);

        // Skip crates out of view
        if (
            crateX + crate.width < viewLeft ||
            crateX > viewRight ||
            crateY + crate.height < viewTop ||
            crateY > viewBottom
        ) {
            continue;
        }

        if (circleRectCollision(x, y, radius, crateX, crateY, crate.width, crate.height)) {
            return true;
        }
    }
    return false;
};

export { circleRectCollision, circleCircleCollision, collidesAt };