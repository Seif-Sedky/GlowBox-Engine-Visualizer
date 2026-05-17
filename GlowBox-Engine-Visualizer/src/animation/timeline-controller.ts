import gsap from 'gsap';
import { Diff } from '../engine/diff.types';
import { LayerRegistry } from '../layers/layer-registry';

export class TimelineController {
  private masterTimeline: gsap.core.Timeline;

  constructor() {
    this.masterTimeline = gsap.timeline({ paused: true });
  }

  /**
   * Processes a diff by passing it to all registered layers.
   * Renderers for those layers will create GSAP tweens and append them to the master timeline.
   */
  async processDiff(diff: Diff) {
    const layers = LayerRegistry.getAllLayers();
    
    for (const layer of layers) {
      if (layer.onDiff) {
        layer.onDiff(diff);
      }
    }
    
    // In a real implementation, we might wait for a tween to finish if we are advancing step by step,
    // or just let it play continuously. Here we just let it run.
    if (this.masterTimeline.paused()) {
      this.masterTimeline.play();
    }
  }

  play() {
    this.masterTimeline.play();
  }

  pause() {
    this.masterTimeline.pause();
  }

  setSpeed(speed: number) {
    this.masterTimeline.timeScale(speed);
  }

  rewind() {
    this.masterTimeline.reverse();
  }

  seekStart() {
    this.masterTimeline.seek(0);
    this.masterTimeline.pause();
  }

  clear() {
    this.masterTimeline.clear();
    this.masterTimeline.seek(0);
  }
}
