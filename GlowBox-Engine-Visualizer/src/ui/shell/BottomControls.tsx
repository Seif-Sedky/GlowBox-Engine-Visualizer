import React, { useState } from 'react';
import styles from './BottomControls.module.css';
import { useUIStore } from '../../store/ui.store';
import { THEMES } from '../../store/theme.types';

export const BottomControls: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const activeThemeId = useUIStore((s) => s.theme);
  const activeTheme = THEMES[activeThemeId];

  const handleInsert = () => {
    if (!inputValue) return;
    console.log(`Insert ${inputValue}`);
    setInputValue('');
  };

  const handleDelete = () => {
    if (!inputValue) return;
    console.log(`Delete ${inputValue}`);
    setInputValue('');
  };

  const handleSelect = () => {
    if (!inputValue) return;
    console.log(`Select ${inputValue}`);
    setInputValue('');
  };

  const handlePlayPreset = () => {
    console.log(`Play preset for ${activeTheme.name}`);
  };

  const handleRewind = () => {
    console.log('Rewind');
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
