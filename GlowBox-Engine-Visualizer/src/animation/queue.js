export class AnimationQueue {
    constructor(timelineController) {
        this.queue = [];
        this.isProcessing = false;
        this.timelineController = timelineController;
    }
    enqueue(diffs) {
        this.queue.push(...diffs);
        if (!this.isProcessing) {
            this.processQueue();
        }
    }
    async processQueue() {
        this.isProcessing = true;
        while (this.queue.length > 0) {
            const currentDiff = this.queue.shift();
            if (!currentDiff)
                break;
            // Dispatch diff to the timeline controller which delegates to registered renderers
            await this.timelineController.processDiff(currentDiff);
        }
        this.isProcessing = false;
    }
    clear() {
        this.queue = [];
        this.isProcessing = false;
        this.timelineController.clear();
    }
}
//# sourceMappingURL=queue.js.map