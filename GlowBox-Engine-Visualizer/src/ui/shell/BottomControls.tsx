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

export const BottomControls: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const { theme, maxKeys, utilization, speed } = useUIStore();
  const { currentTreeState, setTreeState } = useSessionStore();
  const activeTheme = THEMES[theme];

  // Update speed when it changes
  React.useEffect(() => {
    timelineController.setSpeed(speed);
  }, [speed]);

  const getOrInitTree = () => {
    if (currentTreeState) return currentTreeState;
    const newTree = new BPlusTree(maxKeys, utilization);
    setTreeState(newTree);
    return newTree;
  };

  const handleInsert = () => {
    if (!inputValue) return;
    const val = parseInt(inputValue, 10);
    if (isNaN(val)) return;

    const tree = getOrInitTree();
    const diffs = tree.insert(val);
    
    // Trigger re-render to update D3 layout in IndexLayer immediately (FLIP approach or direct)
    // Note: In a true diff approach, we'd wait for queue. Here we just update React.
    setTreeState(Object.assign(Object.create(Object.getPrototypeOf(tree)), tree)); 
    
    queue.enqueue(diffs);
    setInputValue('');
  };

  const handleDelete = () => {
    if (!inputValue) return;
    const val = parseInt(inputValue, 10);
    if (isNaN(val)) return;

    const tree = getOrInitTree();
    const diffs = tree.delete(val);
    
    setTreeState(Object.assign(Object.create(Object.getPrototypeOf(tree)), tree)); 
    queue.enqueue(diffs);
    setInputValue('');
  };

  const handleSelect = () => {
    if (!inputValue) return;
    const val = parseInt(inputValue, 10);
    if (isNaN(val)) return;

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

  return (
    <div className={`glass ${styles.bottomControlsContainer}`}>

      <div className={styles.inputGroup}>
        <input
          type="number"
          className={styles.inputField}
          placeholder="Value..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
        <button className={styles.actionBtn} onClick={handleInsert}>Ins</button>
        <button className={styles.actionBtn} onClick={handleDelete}>Del</button>
        <button className={styles.actionBtn} onClick={handleSelect}>Sel</button>
      </div>

      <div className={styles.divider} />

      <button className={styles.controlBtn} onClick={handlePlayPreset} title="Play Preset">
        {/* Play Icon */}
        <svg viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
      </button>

      <button className={styles.controlBtn} onClick={handleRewind} title="Rewind">
        {/* Rewind Icon */}
        <svg viewBox="0 0 24 24">
          <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z" />
        </svg>
      </button>

      <div className={styles.themeLabel}>
        <span className={styles.themeName}>{activeTheme.name}</span>
        <span className={styles.presetName}>{activeTheme.presetDataset.label}</span>
      </div>

    </div>
  );
};
