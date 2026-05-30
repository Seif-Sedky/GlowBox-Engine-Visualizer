import React, { useState } from 'react';
import styles from './BottomControls.module.css';
import { useUIStore, StepLogEntry } from '../../store/ui.store';
import { useSessionStore } from '../../store/session.store';
import { THEMES } from '../../store/theme.types';
import { BPlusTree } from '../../engine/structures/bplus-tree';
import { ExtendibleHash } from '../../engine/structures/extendible-hash';
import { RTree } from '../../engine/structures/r-tree';
import { InvertedIndex } from '../../engine/structures/inverted-index';
import { SkipList } from '../../engine/structures/skip-list';
import { LSMTree } from '../../engine/structures/lsm-tree';
import { AnimationQueue } from '../../animation/queue';
import { TimelineController } from '../../animation/timeline-controller';

// Create a singleton timeline controller and queue for now
const timelineController = new TimelineController();
const queue = new AnimationQueue(timelineController);

function diffsToStepLog(diffs: import('../../engine/diff.types').Diff[]): StepLogEntry[] {
  return diffs
    .filter(d => !!d.annotation)
    .map(d => {
      if (d.payload?.isHashInfo) {
        return {
          type: 'hash-info' as const,
          key: d.payload.key,
          binaryKey: d.payload.binaryKey,
          lsbBits: d.payload.lsbBits,
          bucketIndex: d.payload.bucketIndex,
          globalDepth: d.payload.globalDepth,
        };
      }
      return { type: 'text' as const, message: d.annotation || '' };
    });
}

export const BottomControls: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [inputX, setInputX] = useState('');
  const [inputY, setInputY] = useState('');
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
    } else if (indexType === 'rtree') {
      newTree = new RTree(maxKeys, minKeys);
    } else if (indexType === 'bplus') {
      newTree = new BPlusTree(maxKeys, minKeys);
    } else if (indexType === 'inverted') {
      newTree = new InvertedIndex();
    } else if (indexType === 'skiplist') {
      newTree = new SkipList(maxKeys);
    } else if (indexType === 'lsmtree') {
      newTree = new LSMTree(maxKeys, minKeys);
    } else {
      // Dummy tree for unimplemented indices to prevent crashes
      newTree = {
        insert: () => [],
        delete: () => [],
        search: () => []
      };
    }
    setTreeState(newTree);
    return newTree;
  };

  const handleInsert = () => {
    const tree = getOrInitTree() as any;
    let diffs;
    
    if (indexType === 'rtree') {
      if (!inputX || !inputY) return;
      const x = parseInt(inputX, 10);
      const y = parseInt(inputY, 10);
      if (isNaN(x) || isNaN(y)) return;
      diffs = tree.insert([x, y]);
      setInputX('');
      setInputY('');
    } else if (indexType === 'inverted') {
      if (!inputValue) return;
      diffs = tree.insert(inputValue);
      setInputValue('');
    } else {
      if (!inputValue) return;
      const val = parseInt(inputValue, 10);
      if (isNaN(val)) return;
      diffs = tree.insert(val);
      setInputValue('');
    }
    
    useUIStore.getState().setStepLog(diffsToStepLog(diffs));
    
    // Trigger re-render to update D3 layout in IndexLayer immediately (FLIP approach or direct)
    // Note: In a true diff approach, we'd wait for queue. Here we just update React.
    setTreeState(Object.assign(Object.create(Object.getPrototypeOf(tree)), tree)); 
    
    queue.enqueue(diffs);
  };

  const handleDelete = () => {
    const tree = getOrInitTree() as any;
    let diffs;

    if (indexType === 'rtree') {
      if (!inputX || !inputY) return;
      const x = parseInt(inputX, 10);
      const y = parseInt(inputY, 10);
      if (isNaN(x) || isNaN(y)) return;
      diffs = tree.delete([x, y]);
      setInputX('');
      setInputY('');
    } else if (indexType === 'inverted') {
      if (!inputValue) return;
      diffs = tree.delete(inputValue);
      setInputValue('');
    } else {
      if (!inputValue) return;
      const val = parseInt(inputValue, 10);
      if (isNaN(val)) return;
      diffs = tree.delete(val);
      setInputValue('');
    }
    
    useUIStore.getState().setStepLog(diffsToStepLog(diffs));

    setTreeState(Object.assign(Object.create(Object.getPrototypeOf(tree)), tree)); 
    queue.enqueue(diffs);
  };

  const handleSelect = () => {
    const tree = getOrInitTree() as any;
    let diffs;

    if (indexType === 'rtree') {
      if (!inputX || !inputY) return;
      const x = parseInt(inputX, 10);
      const y = parseInt(inputY, 10);
      if (isNaN(x) || isNaN(y)) return;
      diffs = tree.search([x, y]);
      setInputX('');
      setInputY('');
    } else if (indexType === 'inverted') {
      if (!inputValue) return;
      diffs = tree.search(inputValue);
      setInputValue('');
    } else {
      if (!inputValue) return;
      const val = parseInt(inputValue, 10);
      if (isNaN(val)) return;
      diffs = tree.search(val);
      setInputValue('');
    }

    useUIStore.getState().setStepLog(diffsToStepLog(diffs));

    queue.enqueue(diffs);
  };

  const handleReset = () => {
    queue.clear();
    useSessionStore.getState().clearSession();
    useUIStore.getState().setStepLog([]);
    setInputValue('');
    setInputX('');
    setInputY('');
  };

  return (
    <div className={`glass ${styles.bottomControlsContainer}`}>

      <div className={styles.inputGroup}>
        {indexType === 'rtree' ? (
          <div className={styles.xyGroup}>
            <input
              type="number"
              className={styles.inputField}
              style={{ width: '50px' }}
              placeholder="X..."
              value={inputX}
              onChange={(e) => setInputX(e.target.value)}
            />
            <input
              type="number"
              className={styles.inputField}
              style={{ width: '50px' }}
              placeholder="Y..."
              value={inputY}
              onChange={(e) => setInputY(e.target.value)}
            />
          </div>
        ) : (
          <input
            type={indexType === 'inverted' ? "text" : "number"}
            className={styles.inputField}
            placeholder={indexType === 'inverted' ? "Text..." : "Value..."}
            style={indexType === 'inverted' ? { width: '150px' } : undefined}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleInsert();
              }
            }}
          />
        )}
        <button className={styles.actionBtn} onClick={handleInsert}>Ins</button>
        {indexType !== 'inverted' && indexType !== 'lsmtree' && (
          <button className={styles.actionBtn} onClick={handleDelete}>Del</button>
        )}
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
