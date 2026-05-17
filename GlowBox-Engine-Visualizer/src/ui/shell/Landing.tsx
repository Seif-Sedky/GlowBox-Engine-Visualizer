import { useState, useEffect } from 'react'
import { THEMES } from '@store/theme.types'
import type { ThemeId } from '@store/theme.types'
import { useUIStore } from '@store/ui.store'
import styles from './Landing.module.css'

export function Landing() {
  const { theme, setTheme, setScreen } = useUIStore()
  const [hovered, setHovered] = useState<ThemeId | null>(null)
  const [entered, setEntered] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  function handleEnter() {
    setEntered(true)
    setTimeout(() => setScreen('visualizer'), 700)
  }

  const activeTheme = THEMES[theme]

  return (
    <div
      className={`${styles.root} ${visible ? styles.visible : ''} ${entered ? styles.exiting : ''}`}
      data-theme={theme}
    >
      {/* ── Radial gradient blob behind title ── */}
      <div
        className={styles.blob}
        style={{ background: activeTheme.accentGlow.replace('0.25', '0.12') }}
      />

      {/* ── Header ── */}
      <header className={styles.header}>
        <span className={styles.logoMark}>✦</span>
        <span className={styles.logoText}>GlowBox</span>
      </header>

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <p className={`label ${styles.eyebrow}`}>Database Engine Visualizer</p>

        <h1 className={`display-xl ${styles.title} glow-text`}>
          GlowBox
        </h1>

        <p className={styles.subtitle}>
          Watch index structures breathe, split, and collapse —<br />
          in real time.
        </p>
      </section>

      {/* ── Theme Picker ── */}
      <section className={styles.themeSection}>
        <p className={`label ${styles.themeLabel}`}>Choose your theme</p>

        <div className={styles.cards}>
          {(Object.values(THEMES) as typeof THEMES[ThemeId][]).map((t) => {
            const isActive  = theme === t.id
            const isHovered = hovered === t.id

            return (
              <button
                key={t.id}
                className={`
                  glass glass-hover
                  ${styles.card}
                  ${isActive ? styles.cardActive : ''}
                `}
                style={{
                  '--card-accent':   t.accent,
                  '--card-accent-2': t.accentSecondary,
                  '--card-glow':     t.accentGlow,
                } as React.CSSProperties}
                onClick={() => setTheme(t.id)}
                onMouseEnter={() => setHovered(t.id)}
                onMouseLeave={() => setHovered(null)}
                aria-pressed={isActive}
              >
                {/* Glow orb */}
                <div
                  className={styles.cardGlowOrb}
                  style={{
                    opacity: isActive || isHovered ? 1 : 0,
                    background: `radial-gradient(ellipse at top left, ${t.accentGlow}, transparent 70%)`,
                  }}
                />

                {/* Active ring */}
                {isActive && (
                  <div
                    className={styles.activeRing}
                    style={{ boxShadow: `0 0 0 1px ${t.accent}, 0 0 24px ${t.accentGlow}` }}
                  />
                )}

                {/* Accent bar */}
                <div
                  className={styles.cardBar}
                  style={{ background: `linear-gradient(90deg, ${t.accent}, ${t.accentSecondary})` }}
                />

                <h3 className={styles.cardName} style={{ color: isActive ? t.accent : 'var(--text-primary)' }}>
                  {t.name}
                </h3>
                <p className={styles.cardTagline}>{t.tagline}</p>

                <div className={styles.cardDataset}>
                  <span className="label" style={{ color: t.accent }}>Preset</span>
                  <span className={styles.datasetName}>{t.presetDataset.label}</span>
                  <p className={styles.datasetDesc}>{t.presetDataset.description}</p>
                </div>

                {/* Selection dot */}
                <div className={styles.selectionDot} style={{ background: isActive ? t.accent : 'transparent', border: `1px solid ${isActive ? t.accent : 'var(--glass-border)'}`, boxShadow: isActive ? `0 0 10px ${t.accentGlow}` : 'none' }} />
              </button>
            )
          })}
        </div>
      </section>

      {/* ── Enter Button ── */}
      <div className={styles.enterWrap}>
        <button
          className={styles.enterBtn}
          onClick={handleEnter}
          style={{
            '--btn-accent':   activeTheme.accent,
            '--btn-accent-2': activeTheme.accentSecondary,
            '--btn-glow':     activeTheme.accentGlow,
          } as React.CSSProperties}
        >
          <span className={styles.enterBtnInner}>
            Enter Visualizer
          </span>
          <span className={styles.enterBtnGlow} />
        </button>

        <p className={styles.enterHint}>
          {activeTheme.presetDataset.description}
        </p>
      </div>
    </div>
  )
}