import { useUIStore } from '@store/ui.store'
import { THEMES } from '@store/theme.types'
import styles from './Navbar.module.css'

const PAGE_SIZES = [1024, 2048, 4096, 8192, 16384]

function formatPageSize(b: number) {
  return b >= 1024 ? `${b / 1024} KB` : `${b} B`
}

export function Navbar() {
  const {
    theme, speed, annotationsOn, pageSize,
    setSpeed, toggleAnnotations, setPageSize, setScreen,
  } = useUIStore()

  const activeTheme = THEMES[theme]

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

      {/* ── Center: Page Size ── */}
      <div className={styles.center}>
        <span className="label" style={{ color: activeTheme.accent }}>Page Size</span>
        <div className={styles.pageSizePills}>
          {PAGE_SIZES.map((s) => (
            <button
              key={s}
              className={`${styles.pill} ${pageSize === s ? styles.pillActive : ''}`}
              style={pageSize === s ? {
                background: activeTheme.accentGlow,
                borderColor: activeTheme.accent,
                color: activeTheme.accent,
                boxShadow: `0 0 10px ${activeTheme.accentGlow}`,
              } : {}}
              onClick={() => setPageSize(s)}
            >
              {formatPageSize(s)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Right: Controls ── */}
      <div className={styles.right}>
        {/* Annotations toggle */}
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
    </nav>
  )
}
