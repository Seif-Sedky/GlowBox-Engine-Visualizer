class LayerRegistryService {
    constructor() {
        this.layers = new Map();
    }
    register(layer) {
        if (this.layers.has(layer.id)) {
            console.warn(`Layer with id ${layer.id} is already registered. Overwriting.`);
        }
        this.layers.set(layer.id, layer);
    }
    unregister(id) {
        this.layers.delete(id);
    }
    getLayer(id) {
        return this.layers.get(id);
    }
    getAllLayers() {
        return Array.from(this.layers.values());
    }
}
// Singleton instance
export const LayerRegistry = new LayerRegistryService();
//# sourceMappingURL=layer-registry.js.map