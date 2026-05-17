import { useUIStore } from '@store/ui.store'
import { THEMES } from '@store/theme.types'
import { Navbar } from './Navbar'
import styles from './Visualizer.module.css'

export function Visualizer() {
  const { theme } = useUIStore()
  const activeTheme = THEMES[theme]

  return (
    <div className={styles.root} data-theme={theme}>
      <Navbar />

      {/* ── Main canvas area ── */}
      <main className={styles.main}>
        {/* Placeholder — index renderer mounts here */}
        <div className={styles.placeholder}>
          <div
            className={styles.placeholderOrb}
            style={{ background: activeTheme.accentGlow }}
          />
          <span
            className={styles.placeholderIcon}
            style={{ color: activeTheme.accent }}
          >
            ✦
          </span>
          <p className={`label ${styles.placeholderText}`}>
            Index canvas — coming next
          </p>
        </div>
      </main>

      {/* ── Bottom controls bar ── */}
      <footer className={`glass ${styles.footer}`}>
        <div className={styles.footerInner}>
          <span className="label" style={{ color: activeTheme.accent }}>
            {THEMES[theme].name} — {THEMES[theme].presetDataset.label}
          </span>
          <span className={styles.footerHint}>
            Insert · Delete · Select operations coming soon
          </span>
        </div>
      </footer>
    </div>
  )
}
