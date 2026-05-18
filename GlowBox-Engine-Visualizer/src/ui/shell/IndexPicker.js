import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useUIStore } from '@store/ui.store';
import styles from './IndexPicker.module.css';
const INDICES = [
    {
        id: 'bplus',
        title: 'B+ Tree',
        desc: 'A self-balancing tree data structure that maintains sorted data and allows searches, sequential access, insertions, and deletions in logarithmic time.',
        img: '/bplus_preview.png',
        available: true,
    },
    {
        id: 'hash',
        title: 'Extendible Hash',
        desc: 'A dynamic hashing scheme that allows the hash table size to grow and shrink gracefully as records are inserted and deleted.',
        img: '/ext_hash_preview.png',
        available: false, // Coming soon
    },
    {
        id: 'rtree',
        title: 'R-Tree',
        desc: 'A tree data structure used for spatial access methods, i.e., for indexing multi-dimensional information such as geographical coordinates.',
        img: '/rtree_preview.png',
        available: false, // Coming soon
    },
];
export function IndexPicker() {
    const { setScreen, setIndexType } = useUIStore();
    const handleSelect = (id, available) => {
        if (!available)
            return;
        setIndexType(id);
        setScreen('visualizer');
    };
    return (_jsxs("div", { className: styles.root, children: [_jsx("button", { className: styles.backBtn, onClick: () => setScreen('landing'), children: "\u2190 Back" }), _jsx("h1", { className: `display-md ${styles.title}`, children: "Select Engine Index" }), _jsx("div", { className: styles.cardsContainer, children: INDICES.map((idx) => (_jsxs("div", { className: `glass ${styles.card}`, onClick: () => handleSelect(idx.id, idx.available), style: { opacity: idx.available ? 1 : 0.6 }, children: [_jsx("div", { className: styles.previewImage, style: {
                                background: `url(${idx.img}) center/cover no-repeat`,
                                backgroundColor: 'var(--bg-elevated)'
                            } }), _jsx("h2", { className: styles.cardTitle, children: idx.title }), _jsx("p", { className: styles.cardDesc, children: idx.desc }), !idx.available && (_jsx("span", { className: styles.comingSoon, children: "Coming Soon" }))] }, idx.id))) })] }));
}
//# sourceMappingURL=IndexPicker.js.map