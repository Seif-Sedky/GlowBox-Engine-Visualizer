import { useState } from 'react'
import { useUIStore } from '@store/ui.store'
import type { IndexType } from '@store/ui.store'
import { IndexLoreModal } from './IndexLoreModal'
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
      img: `${import.meta.env.BASE_URL}bplus_preview.png`,
      available: true,
    },
    {
      id: 'hash',
      title: 'Extendible Hash',
      desc: 'A dynamic hashing scheme that allows the hash table size to grow and shrink gracefully as records are inserted and deleted.',
      img: `${import.meta.env.BASE_URL}ext_hash_preview.png`,
      available: true,
    },
    {
      id: 'rtree',
      title: 'R-Tree',
      desc: 'A tree data structure used for spatial access methods, i.e., for indexing multi-dimensional information such as geographical coordinates.',
      img: `${import.meta.env.BASE_URL}rtree_preview.png`,
      available: true,
    },
    {
      id: 'inverted',
      title: 'Inverted Index',
      desc: 'A database index mapping content, such as words or numbers, to its locations in a document or a set of documents. The core of modern search engines.',
      img: `${import.meta.env.BASE_URL}inverted_index.png`,
      available: true,
    },
    {
      id: 'skiplist',
      title: 'Skip List',
      desc: 'A probabilistic data structure that allows O(log n) search complexity within an ordered sequence of elements using multi-layered linked lists.',
      img: `${import.meta.env.BASE_URL}skip_list.png`,
      available: true,
    },
    {
      id: 'lsmtree',
      title: 'LSM Tree',
      desc: 'Log-Structured Merge-Tree. A data structure that provides attractive performance characteristics for workloads with a high rate of inserts and deletes.',
      img: `${import.meta.env.BASE_URL}lsm_tree.png`,
      available: true,
    },
  ]

export function IndexPicker() {
  const { setScreen, setIndexType } = useUIStore()
  const [showLore, setShowLore] = useState(false)

  const handleSelect = (id: IndexType, available: boolean) => {
    setIndexType(id);
    if (!available) {
      setShowLore(true);
      return;
    }
    setScreen('visualizer');
  }

  return (
    <div className={styles.root}>
      <button className={styles.backBtn} onClick={() => setScreen('landing')}>
        Back
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
            <div className={styles.previewImage} style={{
              background: `url(${idx.img}) center/cover no-repeat`,
              backgroundColor: 'var(--bg-elevated)'
            }} />

            <h2 className={styles.cardTitle}>{idx.title}</h2>
            <p className={styles.cardDesc}>{idx.desc}</p>

            {!idx.available ? (
              <span className={styles.comingSoon}>Click to read Lore</span>
            ) : null}
          </div>
        ))}
      </div>
      
      {showLore && <IndexLoreModal onClose={() => setShowLore(false)} />}
    </div>
  )
}
