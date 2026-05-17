import { Diff } from '../engine/diff.types';
import { TimelineController } from './timeline-controller';

export class AnimationQueue {
  private queue: Diff[] = [];
  private isProcessing = false;
  private timelineController: TimelineController;

  constructor(timelineController: TimelineController) {
    this.timelineController = timelineController;
  }

  enqueue(diffs: Diff[]) {
    this.queue.push(...diffs);
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  private async processQueue() {
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const currentDiff = this.queue.shift();
      if (!currentDiff) break;
      
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
