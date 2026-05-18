export const PRESETS = {
    nebula: () => {
        // Sequential Inserts
        const ops = [];
        for (let i = 1; i <= 30; i++) {
            ops.push({ type: 'INSERT', key: i });
        }
        return ops;
    },
    void: () => {
        // Random Inserts
        const ops = [];
        const keys = new Set();
        while (keys.size < 30) {
            const k = Math.floor(Math.random() * 100) + 1;
            if (!keys.has(k)) {
                keys.add(k);
                ops.push({ type: 'INSERT', key: k });
            }
        }
        return ops;
    },
    inferno: () => {
        // Delete-Heavy
        const ops = [];
        const keys = [];
        // First, insert 20 random values
        for (let i = 0; i < 20; i++) {
            const k = i * 5 + Math.floor(Math.random() * 3);
            keys.push(k);
            ops.push({ type: 'INSERT', key: k });
        }
        // Shuffle keys for random deletions
        const shuffledKeys = [...keys].sort(() => Math.random() - 0.5);
        // Then delete 15
        for (let i = 0; i < 15; i++) {
            ops.push({ type: 'DELETE', key: shuffledKeys[i] });
        }
        return ops;
    }
};
//# sourceMappingURL=presets.js.map