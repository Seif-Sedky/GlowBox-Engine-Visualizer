import React from 'react';
import styles from './AnnotationPopup.module.css';
import { useUIStore, HashInfoEntry, StepLogEntry } from '../../store/ui.store';

const HashBadge: React.FC<{ entry: HashInfoEntry }> = ({ entry }) => {
  // Highlight the LSB bits in the full binary representation
  const fullBinary = entry.binaryKey;
  const lsbCount = entry.globalDepth;
  const nonLsbPart = fullBinary.length > lsbCount
    ? fullBinary.slice(0, fullBinary.length - lsbCount)
    : '';
  const lsbPart = fullBinary.slice(Math.max(0, fullBinary.length - lsbCount));

  return (
    <div className={styles.hashBadge}>
      <div className={styles.hashBadgeHeader}>
        <span className={styles.hashBadgeTitle}>Hash Lookup</span>
      </div>

      <div className={styles.hashBadgeBody}>
        <div className={styles.hashRow}>
          <span className={styles.hashLabel}>Value</span>
          <span className={styles.hashValue}>{entry.key}</span>
        </div>

        <div className={styles.hashRow}>
          <span className={styles.hashLabel}>Binary</span>
          <span className={styles.hashBinary}>
            <span className={styles.hashBinaryDim}>{nonLsbPart}</span>
            <span className={styles.hashBinaryHighlight}>{lsbPart}</span>
          </span>
        </div>

        <div className={styles.hashDivider} />

        <div className={styles.hashRow}>
          <span className={styles.hashLabel}>LSB ({entry.globalDepth})</span>
          <span className={styles.hashLsbValue}>{entry.lsbBits}</span>
        </div>

        <div className={styles.hashRow}>
          <span className={styles.hashLabel}>Bucket</span>
          <span className={styles.hashBucketIndex}>#{entry.bucketIndex}</span>
        </div>
      </div>
    </div>
  );
};

export const AnnotationPopup: React.FC = () => {
  const annotationsOn = useUIStore(s => s.annotationsOn);
  const stepLog = useUIStore(s => s.stepLog);

  if (!annotationsOn || stepLog.length === 0) {
    return null;
  }

  // Separate hash info entries (show first, prominently) from text entries
  const hashEntries = stepLog.filter((e): e is HashInfoEntry => e.type === 'hash-info');
  const textEntries = stepLog.filter((e): e is Extract<StepLogEntry, { type: 'text' }> => e.type === 'text');

  return (
    <div className={`${styles.popupContainer} ${styles.visible}`}>
      <div className={styles.scrollArea}>
        {/* Hash Info Badges — rendered prominently at the top */}
        {hashEntries.map((entry, i) => (
          <HashBadge key={`hash-${i}`} entry={entry} />
        ))}

        {/* Regular text annotations */}
        {textEntries.length > 0 && (
          <>
            <h3 className={styles.title}>Operation Log</h3>
            <ul className={styles.logList}>
              {textEntries.map((log, i) => (
                <li key={i} className={styles.logItem}>
                  <span className={styles.logBullet}>•</span>
                  {log.message}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
};
