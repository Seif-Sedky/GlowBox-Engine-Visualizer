export class HashRenderer {
    constructor(capacity) {
        this.dirCellWidth = 80;
        this.dirCellHeight = 40;
        this.bucketKeyWidth = 40;
        this.bucketHeight = 50;
        this.paddingX = 200; // gap between directory and buckets
        this.capacity = capacity;
    }
    computeLayout(hash) {
        const dirCount = 1 << hash.globalDepth;
        const layoutDir = [];
        const layoutBuckets = [];
        const links = [];
        const dirStartX = -this.paddingX;
        let dirStartY = -(dirCount * this.dirCellHeight) / 2;
        for (let i = 0; i < dirCount; i++) {
            layoutDir.push({
                index: i,
                binaryStr: i.toString(2).padStart(hash.globalDepth, '0'),
                x: dirStartX,
                y: dirStartY + i * this.dirCellHeight,
                width: this.dirCellWidth,
                height: this.dirCellHeight,
                targetBucketId: hash.directory[i].id
            });
        }
        // Identify unique buckets
        const uniqueBuckets = new Map();
        hash.directory.forEach(b => {
            if (!uniqueBuckets.has(b.id)) {
                uniqueBuckets.set(b.id, b);
            }
        });
        const bucketArray = Array.from(uniqueBuckets.values());
        // Sort buckets to try and align them nicely with their first referencing directory entry
        // A simple heuristic: position them relative to their lowest referring directory index
        const bucketFirstIndex = new Map();
        for (let i = 0; i < dirCount; i++) {
            const bId = hash.directory[i].id;
            if (!bucketFirstIndex.has(bId)) {
                bucketFirstIndex.set(bId, i);
            }
        }
        bucketArray.sort((a, b) => bucketFirstIndex.get(a.id) - bucketFirstIndex.get(b.id));
        const bucketStartX = this.paddingX;
        // Calculate total height of buckets to center them
        const bucketGapY = 20;
        const totalBucketHeight = bucketArray.length * this.bucketHeight + (bucketArray.length - 1) * bucketGapY;
        let bucketStartY = -totalBucketHeight / 2;
        const bucketPosMap = new Map();
        bucketArray.forEach((b, idx) => {
            // Actually, it might look better if the bucket aligns with the average Y of its directory pointers
            let sumY = 0;
            let count = 0;
            layoutDir.forEach(d => {
                if (d.targetBucketId === b.id) {
                    sumY += d.y + d.height / 2;
                    count++;
                }
            });
            const avgY = count > 0 ? sumY / count : bucketStartY + idx * (this.bucketHeight + bucketGapY);
            const bY = avgY - this.bucketHeight / 2;
            const bX = bucketStartX;
            const bWidth = Math.max(1, this.capacity) * this.bucketKeyWidth;
            layoutBuckets.push({
                id: b.id,
                localDepth: b.localDepth,
                keys: [...b.keys],
                x: bX,
                y: bY,
                width: bWidth,
                height: this.bucketHeight
            });
            bucketPosMap.set(b.id, { x: bX, y: bY });
        });
        // Resolve overlaps for buckets if they are too close
        // Simple pass to push down overlapping buckets
        for (let i = 1; i < layoutBuckets.length; i++) {
            const prev = layoutBuckets[i - 1];
            const curr = layoutBuckets[i];
            if (curr.y < prev.y + prev.height + bucketGapY) {
                curr.y = prev.y + prev.height + bucketGapY;
                bucketPosMap.set(curr.id, { x: curr.x, y: curr.y });
            }
        }
        // Links
        layoutDir.forEach(d => {
            const bPos = bucketPosMap.get(d.targetBucketId);
            links.push({
                sourceIndex: d.index,
                targetId: d.targetBucketId,
                sourceX: d.x + d.width,
                sourceY: d.y + d.height / 2,
                targetX: bPos.x,
                targetY: bPos.y + this.bucketHeight / 2
            });
        });
        return { directory: layoutDir, buckets: layoutBuckets, links };
    }
}
//# sourceMappingURL=hash-renderer.js.map