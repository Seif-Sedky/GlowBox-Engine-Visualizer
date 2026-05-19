import React, { useState } from 'react';
import styles from './BottomControls.module.css';
import { useUIStore } from '../../store/ui.store';
import { useSessionStore } from '../../store/session.store';
import { THEMES } from '../../store/theme.types';
import { BPlusTree } from '../../engine/structures/bplus-tree';
import { ExtendibleHash } from '../../engine/structures/extendible-hash';
import { AnimationQueue } from '../../animation/queue';
import { TimelineController } from '../../animation/timeline-controller';

// Create a singleton timeline controller and queue for now
const timelineController = new TimelineController();
const queue = new AnimationQueue(timelineController);

export const BottomControls: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const { theme, maxKeys, minKeys, speed, indexType } = useUIStore();
  const { currentTreeState, setTreeState } = useSessionStore();
  const activeTheme = THEMES[theme];

  // Update speed when it changes
  React.useEffect(() => {
    timelineController.setSpeed(speed);
  }, [speed]);

  const getOrInitTree = () => {
    if (currentTreeState) return currentTreeState;
    let newTree;
    if (indexType === 'hash') {
      newTree = new ExtendibleHash(maxKeys);
    } else {
      newTree = new BPlusTree(maxKeys, minKeys);
    }
    setTreeState(newTree);
    return newTree;
  };

  const handleInsert = () => {
    if (!inputValue) return;
    const val = parseInt(inputValue, 10);
    if (isNaN(val)) return;

    const tree = getOrInitTree();
    const diffs = tree.insert(val);
    
    useUIStore.getState().setStepLog(
      diffs.filter(d => d.type === 'ANNOTATION').map(d => d.annotation || '')
    );
    
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
    
    useUIStore.getState().setStepLog(
      diffs.filter(d => d.type === 'ANNOTATION').map(d => d.annotation || '')
    );

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

    useUIStore.getState().setStepLog(
      diffs.filter(d => d.type === 'ANNOTATION').map(d => d.annotation || '')
    );

    queue.enqueue(diffs);
    setInputValue('');
  };

  const handleReset = () => {
    queue.clear();
    useSessionStore.getState().clearSession();
    useUIStore.getState().setStepLog([]);
    setInputValue('');
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

      <button className={styles.controlBtn} onClick={handleReset} title="Reset Engine">
        {/* Reset / Refresh Icon */}
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
        </svg>
      </button>

      <div className={styles.themeLabel}>
        <span className={styles.themeName}>{activeTheme.name}</span>
        <span className={styles.presetName}>{activeTheme.presetDataset.label}</span>
      </div>

    </div>
  );
};
