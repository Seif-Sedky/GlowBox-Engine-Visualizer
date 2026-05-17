import { useUIStore } from '@store/ui.store'
import { THEMES } from '@store/theme.types'
import { Navbar } from './Navbar'
import { BottomControls } from './BottomControls'
import { AnnotationPopup } from './AnnotationPopup'
import { IndexLayer } from '../../layers/index-layer/IndexLayer'
import styles from './Visualizer.module.css'

export function Visualizer() {
  const { theme } = useUIStore()

  return (
    <div className={styles.root} data-theme={theme}>
      <Navbar />

      {/* ── Main canvas area ── */}
      <main className={styles.main}>
        <IndexLayer />
        <AnnotationPopup />
      </main>

      <BottomControls />
    </div>
  )
}
