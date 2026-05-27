import { useUIStore } from '@store/ui.store'
import { Navbar } from './Navbar'
import { BottomControls } from './BottomControls'
import { AnnotationPopup } from './AnnotationPopup'
import { IndexLayer } from '../../layers/index-layer/IndexLayer'
import { HashLayer } from '../../layers/hash-layer/HashLayer'
import { RTreeLayer } from '../../layers/rtree-layer/RTreeLayer'
import { InvertedLayer } from '../../layers/inverted-layer/InvertedLayer'
import { SkipListLayer } from '../../layers/skiplist-layer/SkipListLayer'
import { PlaceholderLayer } from '../../layers/placeholder-layer/PlaceholderLayer'
import styles from './Visualizer.module.css'

export function Visualizer() {
  const { theme, indexType } = useUIStore()

  const renderLayer = () => {
    switch (indexType) {
      case 'hash': return <HashLayer />
      case 'rtree': return <RTreeLayer />
      case 'bplus': return <IndexLayer />
      case 'inverted': return <InvertedLayer />
      case 'skiplist': return <SkipListLayer />
      case 'ttree':
      case 'lsmtree':
        return <PlaceholderLayer />
      default:
        return <IndexLayer />
    }
  }

  return (
    <div className={styles.root} data-theme={theme}>
      <Navbar />

      {/* ── Main canvas area ── */}
      <main className={styles.main}>
        {renderLayer()}
        <AnnotationPopup />
      </main>

      <BottomControls />
    </div>
  )
}
