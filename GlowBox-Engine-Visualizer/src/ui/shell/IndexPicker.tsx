import { useUIStore } from '@store/ui.store'
import type { IndexType } from '@store/ui.store'
import styles from './IndexPicker.module.css'

const INDICES: {
  id: IndexType
  title: string
  desc: string
  img: string
  available: boolean
}[] = [
  {
    id: 'bplus',
    title: 'B+ Tree',
    desc: 'A self-balancing tree data structure that maintains sorted data and allows searches, sequential access, insertions, and deletions in logarithmic time.',
    img: '/bplus_preview.png',
    available: true,
  },
  {
    id: 'hash',
    title: 'Extendible Hash',
    desc: 'A dynamic hashing scheme that allows the hash table size to grow and shrink gracefully as records are inserted and deleted.',
    img: '/ext_hash_preview.png',
    available: false, // Coming soon
  },
  {
    id: 'rtree',
    title: 'R-Tree',
    desc: 'A tree data structure used for spatial access methods, i.e., for indexing multi-dimensional information such as geographical coordinates.',
    img: '/rtree_preview.png',
    available: false, // Coming soon
  },
]

export function IndexPicker() {
  const { setScreen, setIndexType } = useUIStore()

  const handleSelect = (id: IndexType, available: boolean) => {
    if (!available) return;
    setIndexType(id);
    setScreen('visualizer');
  }

  return (
    <div className={styles.root}>
      <button className={styles.backBtn} onClick={() => setScreen('landing')}>
        ← Back
      </button>

      <h1 className={`display-md ${styles.title}`}>Select Engine Index</h1>

      <div className={styles.cardsContainer}>
        {INDICES.map((idx) => (
          <div 
            key={idx.id} 
            className={`glass ${styles.card}`}
            onClick={() => handleSelect(idx.id, idx.available)}
            style={{ opacity: idx.available ? 1 : 0.6 }}
          >
            {/* We will load the generated images from the public folder. For now, they act as placeholders if missing */}
            <div className={styles.previewImage} style={{ 
                background: `url(${idx.img}) center/cover no-repeat`, 
                backgroundColor: 'var(--bg-elevated)'
            }} />
            
            <h2 className={styles.cardTitle}>{idx.title}</h2>
            <p className={styles.cardDesc}>{idx.desc}</p>

            {!idx.available && (
              <span className={styles.comingSoon}>Coming Soon</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
