import { useState } from 'react'
import { useUIStore } from '@store/ui.store'
import { Navbar } from './Navbar'
import { BottomControls } from './BottomControls'
import { AnnotationPopup } from './AnnotationPopup'
import { IndexLayer } from '../../layers/index-layer/IndexLayer'
import { HashLayer } from '../../layers/hash-layer/HashLayer'
import { RTreeLayer } from '../../layers/rtree-layer/RTreeLayer'
import { InvertedLayer } from '../../layers/inverted-layer/InvertedLayer'
import { SkipListLayer } from '../../layers/skiplist-layer/SkipListLayer'
import { LsmTreeLayer } from '../../layers/lsmtree-layer/LsmTreeLayer'
import { PlaceholderLayer } from '../../layers/placeholder-layer/PlaceholderLayer'
import { MechanismModal } from './MechanismModal'
import styles from './Visualizer.module.css'

export function Visualizer() {
  const { theme, indexType } = useUIStore()
  const [showMechanism, setShowMechanism] = useState(false)

  const renderLayer = () => {
    switch (indexType) {
      case 'hash': return <HashLayer />
      case 'rtree': return <RTreeLayer />
      case 'bplus': return <IndexLayer />
      case 'inverted': return <InvertedLayer />
      case 'skiplist': return <SkipListLayer />
      case 'lsmtree': return <LsmTreeLayer />
      default:
        return <IndexLayer />
    }
  }

  return (
    <div className={styles.root} data-theme={theme}>
      <Navbar />

      <button 
        className={`glass glass-hover ${styles.mechanismBtn}`}
        onClick={() => setShowMechanism(true)}
        title="How it Works"
      >
        <span className={styles.mechanismIcon}>💡</span>
        <span className={styles.mechanismText}>How it Works</span>
      </button>

      {showMechanism && <MechanismModal onClose={() => setShowMechanism(false)} />}

      {/* ── Main canvas area ── */}
      <main className={styles.main}>
        {renderLayer()}
        <AnnotationPopup />
      </main>

      <BottomControls />
    </div>
  )
}
