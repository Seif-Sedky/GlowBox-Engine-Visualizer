import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useUIStore } from '@store/ui.store';
import { THEMES } from '@store/theme.types';
import { LORE_DATA, IndexLore, FamilyNode } from './loreData';
import styles from './IndexLoreModal.module.css';

interface IndexLoreModalProps {
  onClose: () => void;
}

const FamilyTreeNode = ({ node, accentColor, isRoot }: { node: FamilyNode, accentColor: string, isRoot?: boolean }) => {
  const content = (
    <li>
      <span className={styles.treeNodeLabel} style={{ borderColor: accentColor, color: accentColor }}>
        {node.name}
      </span>
      {node.children && node.children.length > 0 && (
        <ul>
          {node.children.map((child, i) => (
            <FamilyTreeNode key={i} node={child} accentColor={accentColor} />
          ))}
        </ul>
      )}
    </li>
  );
  
  return isRoot ? <ul>{content}</ul> : content;
};

const TypewriterText = ({ text, speed = 15 }: { text: string; speed?: number }) => {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    setDisplayedText('');
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(prev => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(interval);
      }
    }, speed);
    
    return () => clearInterval(interval);
  }, [text, speed]);
  
  return <span>{displayedText}</span>;
};

export function IndexLoreModal({ onClose }: IndexLoreModalProps) {
  const { indexType, theme } = useUIStore();
  const activeTheme = THEMES[theme];
  const lore: IndexLore | undefined = LORE_DATA[indexType];
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  
  if (!lore) return null;

  const handleCopy = (citation: string, index: number) => {
    navigator.clipboard.writeText(citation);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div 
        className={`glass ${styles.modal}`} 
        onClick={(e) => e.stopPropagation()}
        style={{ borderColor: activeTheme.accent, boxShadow: `0 0 20px ${activeTheme.accentGlow}` }}
      >
        <button className={styles.closeBtn} onClick={onClose} style={{ color: activeTheme.accent }}>×</button>
        
        <div className={styles.header}>
          <h2 style={{ color: activeTheme.accent }}>{lore.name} Lore</h2>
          <span className={styles.eraBadge} style={{ 
            backgroundColor: activeTheme.accentGlow,
            color: activeTheme.accent,
            borderColor: activeTheme.accent 
          }}>
            🕰️ {lore.era}
          </span>
        </div>
        
        <div className={styles.content}>
          <div className={styles.text}>
            <TypewriterText text={lore.text} speed={10} />
          </div>
          
          {lore.hasCoinFlip && (
            <div className={styles.coinFlipContainer}>
              <div className={styles.coin} style={{ backgroundColor: activeTheme.accent }}>
                <span className={styles.coinSide}>Tails</span>
                <span className={styles.coinSideBack}>Heads</span>
              </div>
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>Flipping for height...</span>
            </div>
          )}

          {lore.familyTree && (
            <div className={styles.treeContainer} style={{ '--tree-color': activeTheme.accent } as React.CSSProperties}>
              <h3 style={{ color: 'rgba(255,255,255,0.6)' }}>Lineage</h3>
              <div className={styles.tree}>
                <FamilyTreeNode node={lore.familyTree} accentColor={activeTheme.accent} isRoot={true} />
              </div>
            </div>
          )}
          
          <div className={styles.papers}>
            <h3 style={{ color: 'rgba(255,255,255,0.6)' }}>Notable Papers</h3>
            <div className={styles.papersList}>
              {lore.papers.map((paper, i) => {
                const citation = `${paper.authors} (${paper.note ? paper.note.split(' ')[0] : ''}). ${paper.title}. ${paper.conference}.`;
                return (
                  <div key={i} className={styles.paperCard} style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                    <div className={styles.paperInfo}>
                      <span className={styles.paperAuthors}>{paper.authors}</span>
                      <span className={styles.paperTitle}>"{paper.title}"</span>
                      <span className={styles.paperConf}>{paper.conference} {paper.note ? `— ${paper.note}` : ''}</span>
                    </div>
                    <button 
                      className={styles.copyBtn} 
                      onClick={() => handleCopy(citation, i)}
                      style={{ 
                        color: copiedIndex === i ? activeTheme.accent : 'rgba(255,255,255,0.6)',
                        borderColor: copiedIndex === i ? activeTheme.accent : 'rgba(255,255,255,0.1)' 
                      }}
                      title="Copy citation"
                    >
                      {copiedIndex === i ? '✓ Copied' : '📋 Copy'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
