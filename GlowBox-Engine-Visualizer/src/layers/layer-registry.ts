import { VisualizationLayer } from './layer.interface';

class LayerRegistryService {
  private layers: Map<string, VisualizationLayer> = new Map();

  register(layer: VisualizationLayer) {
    if (this.layers.has(layer.id)) {
      console.warn(`Layer with id ${layer.id} is already registered. Overwriting.`);
    }
    this.layers.set(layer.id, layer);
  }

  unregister(id: string) {
    this.layers.delete(id);
  }

  getLayer(id: string): VisualizationLayer | undefined {
    return this.layers.get(id);
  }

  getAllLayers(): VisualizationLayer[] {
    return Array.from(this.layers.values());
  }
}

// Singleton instance
export const LayerRegistry = new LayerRegistryService();
