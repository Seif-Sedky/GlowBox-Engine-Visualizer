import { useUIStore } from '@store/ui.store'
import { THEMES } from '@store/theme.types'
import { Navbar } from './Navbar'
import { BottomControls } from './BottomControls'
import { AnnotationPopup } from './AnnotationPopup'
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
        
        {/* Layer Registry rendering would go here in the future */}
        
        <AnnotationPopup />
      </main>

      <BottomControls />
    </div>
  )
}
