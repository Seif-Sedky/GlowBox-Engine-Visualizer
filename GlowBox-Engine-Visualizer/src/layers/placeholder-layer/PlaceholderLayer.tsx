import React from 'react';
import { useUIStore } from '../../store/ui.store';
import styles from './PlaceholderLayer.module.css';

export const PlaceholderLayer: React.FC = () => {
  const { indexType } = useUIStore();

  const getTitle = () => {
    switch (indexType) {
      case 'inverted': return 'Inverted Index Visualizer';
      case 'skiplist': return 'Skip List Visualizer';
      case 'lsmtree': return 'LSM Tree Visualizer';
      default: return 'Visualizer';
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h2 className={styles.title}>{getTitle()}</h2>
        <p className={styles.subtitle}>
          The rendering engine for this index is currently under construction.
        </p>
        <p className={styles.instruction}>
          Use the <strong>Notes</strong> or <strong>Lore</strong> buttons in the navigation bar to learn more.
        </p>
      </div>
    </div>
  );
};
