import { useState } from 'react'
import { useUIStore } from '@store/ui.store'
import { THEMES } from '@store/theme.types'
import { useSessionStore } from '@store/session.store'
import { IndexLoreModal } from './IndexLoreModal'
import styles from './Navbar.module.css'

export function Navbar() {
  const {
    theme, speed, annotationsOn, maxKeys, minKeys, indexType,
    setSpeed, toggleAnnotations, setMaxKeys, setMinKeys, setScreen,
  } = useUIStore()

  const activeTheme = THEMES[theme]
  const [showLore, setShowLore] = useState(false)

  return (
    <nav className={`glass ${styles.nav}`} data-theme={theme}>
      {/* ── Left: Logo ── */}
      <button
        className={styles.logo}
        onClick={() => setScreen('landing')}
        title="Back to landing"
      >
        <span className={styles.logoMark} style={{ color: activeTheme.accent }}>✦</span>
        <span className={styles.logoText}>GlowBox</span>
      </button>

      {/* ── Center: Max Keys & Min Keys ── */}
      <div className={styles.center} style={{ gap: '2rem' }}>
        {indexType !== 'inverted' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span className="label" style={{ color: activeTheme.accent }}>
              {indexType === 'skiplist' ? 'Max Height' : indexType === 'lsmtree' ? 'MemTable Size' : 'Max Keys'}
            </span>
            <div className={styles.pageSizePills}>
              {[2, 4, 6, 8].map((s) => (
                <button
                  key={s}
                  className={`${styles.pill} ${maxKeys === s ? styles.pillActive : ''}`}
                  style={maxKeys === s ? {
                    background: activeTheme.accentGlow,
                    borderColor: activeTheme.accent,
                    color: activeTheme.accent,
                    boxShadow: `0 0 10px ${activeTheme.accentGlow}`,
                  } : {}}
                  onClick={() => {
                    setMaxKeys(s);
                    useSessionStore.getState().clearSession();
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {indexType !== 'hash' && indexType !== 'inverted' && indexType !== 'skiplist' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span className="label" style={{ color: activeTheme.accent }}>
              {indexType === 'lsmtree' ? 'Compact Threshold' : 'Min Keys'}
            </span>
            <div className={styles.pageSizePills}>
              {[1, 2, 3, 4].map((u) => (
                <button
                  key={u}
                  className={`${styles.pill} ${minKeys === u ? styles.pillActive : ''}`}
                  style={minKeys === u ? {
                    background: activeTheme.accentGlow,
                    borderColor: activeTheme.accent,
                    color: activeTheme.accent,
                    boxShadow: `0 0 10px ${activeTheme.accentGlow}`,
                  } : {}}
                  onClick={() => {
                    setMinKeys(u);
                    useSessionStore.getState().clearSession();
                  }}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Right: Controls ── */}
      <div className={styles.right}>
        {/* Annotations toggle */}
        {indexType !== 'inverted' && (
          <button
            className={`${styles.toggleBtn} ${annotationsOn ? styles.toggleOn : ''}`}
            style={annotationsOn ? {
              borderColor: activeTheme.accent,
              color: activeTheme.accent,
              boxShadow: `0 0 10px ${activeTheme.accentGlow}`,
            } : {}}
            onClick={toggleAnnotations}
            title="Toggle annotations"
          >
            <span className={styles.toggleIcon}>
              {annotationsOn ? '◉' : '○'}
            </span>
            <span className={styles.toggleLabel}>Notes</span>
          </button>
        )}

        {/* Lore button */}
        <button
          className={styles.toggleBtn}
          onClick={() => setShowLore(true)}
          title="Index Lore"
        >
          <span className={styles.toggleIcon}>📖</span>
          <span className={styles.toggleLabel}>Lore</span>
        </button>

        {/* Speed slider */}
        <div className={styles.speedWrap}>
          <span className="label" style={{ color: activeTheme.accent }}>Speed</span>
          <div className={styles.sliderRow}>
            <span className={styles.sliderVal}>
              {speed.toFixed(2)}×
            </span>
            <input
              type="range"
              min={0.25}
              max={3}
              step={0.25}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className={styles.slider}
              style={{ '--slider-accent': activeTheme.accent } as React.CSSProperties}
            />
          </div>
        </div>
      </div>
      
      {showLore && <IndexLoreModal onClose={() => setShowLore(false)} />}
    </nav>
  )
}
