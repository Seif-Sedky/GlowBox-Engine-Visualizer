import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import styles from './BottomControls.module.css';
import { useUIStore } from '../../store/ui.store';
import { useSessionStore } from '../../store/session.store';
import { THEMES } from '../../store/theme.types';
import { BPlusTree } from '../../engine/structures/bplus-tree';
import { AnimationQueue } from '../../animation/queue';
import { TimelineController } from '../../animation/timeline-controller';
// Create a singleton timeline controller and queue for now
const timelineController = new TimelineController();
const queue = new AnimationQueue(timelineController);
export const BottomControls = () => {
    const [inputValue, setInputValue] = useState('');
    const { theme, maxKeys, minKeys, speed } = useUIStore();
    const { currentTreeState, setTreeState } = useSessionStore();
    const activeTheme = THEMES[theme];
    // Update speed when it changes
    React.useEffect(() => {
        timelineController.setSpeed(speed);
    }, [speed]);
    const getOrInitTree = () => {
        if (currentTreeState)
            return currentTreeState;
        const newTree = new BPlusTree(maxKeys, minKeys);
        setTreeState(newTree);
        return newTree;
    };
    const handleInsert = () => {
        if (!inputValue)
            return;
        const val = parseInt(inputValue, 10);
        if (isNaN(val))
            return;
        const tree = getOrInitTree();
        const diffs = tree.insert(val);
        // Trigger re-render to update D3 layout in IndexLayer immediately (FLIP approach or direct)
        // Note: In a true diff approach, we'd wait for queue. Here we just update React.
        setTreeState(Object.assign(Object.create(Object.getPrototypeOf(tree)), tree));
        queue.enqueue(diffs);
        setInputValue('');
    };
    const handleDelete = () => {
        if (!inputValue)
            return;
        const val = parseInt(inputValue, 10);
        if (isNaN(val))
            return;
        const tree = getOrInitTree();
        const diffs = tree.delete(val);
        setTreeState(Object.assign(Object.create(Object.getPrototypeOf(tree)), tree));
        queue.enqueue(diffs);
        setInputValue('');
    };
    const handleSelect = () => {
        if (!inputValue)
            return;
        const val = parseInt(inputValue, 10);
        if (isNaN(val))
            return;
        const tree = getOrInitTree();
        const diffs = tree.search(val);
        queue.enqueue(diffs);
        setInputValue('');
    };
    const handlePlayPreset = () => {
        console.log(`Play preset for ${activeTheme.name}`);
        // Will run the preset generator and queue the ops
    };
    const handleRewind = () => {
        timelineController.rewind();
    };
    return (_jsxs("div", { className: `glass ${styles.bottomControlsContainer}`, children: [_jsxs("div", { className: styles.inputGroup, children: [_jsx("input", { type: "number", className: styles.inputField, placeholder: "Value...", value: inputValue, onChange: (e) => setInputValue(e.target.value) }), _jsx("button", { className: styles.actionBtn, onClick: handleInsert, children: "Ins" }), _jsx("button", { className: styles.actionBtn, onClick: handleDelete, children: "Del" }), _jsx("button", { className: styles.actionBtn, onClick: handleSelect, children: "Sel" })] }), _jsx("div", { className: styles.divider }), _jsx("button", { className: styles.controlBtn, onClick: handlePlayPreset, title: "Play Preset", children: _jsx("svg", { viewBox: "0 0 24 24", children: _jsx("path", { d: "M8 5v14l11-7z" }) }) }), _jsx("button", { className: styles.controlBtn, onClick: handleRewind, title: "Rewind", children: _jsx("svg", { viewBox: "0 0 24 24", children: _jsx("path", { d: "M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z" }) }) }), _jsxs("div", { className: styles.themeLabel, children: [_jsx("span", { className: styles.themeName, children: activeTheme.name }), _jsx("span", { className: styles.presetName, children: activeTheme.presetDataset.label })] })] }));
};
//# sourceMappingURL=BottomControls.js.map