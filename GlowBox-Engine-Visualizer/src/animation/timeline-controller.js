import gsap from 'gsap';
import { LayerRegistry } from '../layers/layer-registry';
export class TimelineController {
    constructor() {
        this.masterTimeline = gsap.timeline({ paused: true });
    }
    /**
     * Processes a diff by passing it to all registered layers.
     * Renderers for those layers will create GSAP tweens and append them to the master timeline.
     */
    async processDiff(diff) {
        const layers = LayerRegistry.getAllLayers();
        for (const layer of layers) {
            if (layer.onDiff) {
                const result = layer.onDiff(diff);
                if (result && result instanceof gsap.core.Timeline) {
                    this.masterTimeline.add(result);
                }
                else if (result && result instanceof gsap.core.Tween) {
                    this.masterTimeline.add(result);
                }
            }
        }
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
    setSpeed(speed) {
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
//# sourceMappingURL=timeline-controller.js.map