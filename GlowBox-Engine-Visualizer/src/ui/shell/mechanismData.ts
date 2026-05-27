import type { IndexType } from '@store/ui.store'

export type MechanismSection = {
  heading?: string;
  paragraphs: string[];
};

export type MechanismInfo = {
  title: string;
  sections: MechanismSection[];
};

export const MECHANISM_DATA: Record<IndexType | string, MechanismInfo> = {
  bplus: {
    title: 'How B+ Trees Work',
    sections: [
      {
        paragraphs: [
          "B+ Tree organizes data as a balanced tree where every node holds multiple keys. Internal nodes act purely as a routing map, they store keys only to direct searches left or right. All actual data lives exclusively in the leaf nodes (or the leafs point to the location on disk), which are linked together in a chain.",
          "When you search, you travel from root to leaf following key comparisons. When you insert and a node gets too full, it splits into two and pushes a key up to the parent. This splitting can cascade upward, which is the only way the tree ever grows taller.",
          "Because all leaves are linked, range queries are a single traversal across the leaf chain without ever going back up the tree."
        ]
      }
    ]
  },
  hash: {
    title: 'How Extendible Hashing Works',
    sections: [
      {
        paragraphs: [
          "Extendible Hashing uses a directory - an array of pointers - and a concept of bit depth to route keys to buckets. A global depth determines how many bits of each key's hash value you read to pick a directory slot. Each bucket has a local depth, which may be smaller than the global depth.",
          "When a bucket overflows, only that bucket splits: its local depth increases by one, a new bucket is created, its keys are redistributed, and the directory doubles only if the bucket's local depth now exceeds the global depth.",
          "This means growth is always incremental, you never rehash the entire table, only the one full bucket. If duplicates overwhelm the index that a page can't be split, we can use overflow buckets chained to the original bucket."
        ]
      }
    ]
  },
  rtree: {
    title: 'How R-Trees Work',
    sections: [
      {
        paragraphs: [
          "An R-Tree indexes geometric objects — points, rectangles, polygons — by wrapping groups of them in a Minimum Bounding Rectangle (MBR). The math that makes this possible is surprisingly simple: an MBR is just the tightest axis-aligned rectangle that contains a set of points or shapes.",
          "For a set of points, you compute it by taking the minimum and maximum value along each dimension independently — MBR = [min(x), max(x)] × [min(y), max(y)]. For a group of existing MBRs, you apply the same idea one level up: the bounding rectangle of a set of rectangles is just the min of their left edges, the max of their right edges, the min of their bottom edges, and the max of their top edges.",
          "Overlap and containment checks between two MBRs are equally simple, requiring only six comparisons with no trigonometry or floating point complexity. To search, you start at the root and check which MBRs overlap your query region using that same formula, descending only into branches whose bounding box intersects.",
          "Insertion places the object in whichever existing leaf causes the least MBR enlargement. When a node overflows, it splits and its parent MBR is recalculated bottom-up to reflect the new boundaries."
        ]
      }
    ]
  },
  skiplist: {
    title: 'How Skip Lists Work',
    sections: [
      {
        paragraphs: [
          "A Skip List is a linked list with multiple levels of express lanes stacked on top. The bottom level contains every element in sorted order. Each higher level contains a random subset of the level below, with each element being promoted to the next level by a coin flip.",
          "To search, you start at the top-left and move right as long as the next key is smaller than your target, then drop down a level when you overshoot. This combination of horizontal traversal and vertical dropping zeros in on the target in O(log n) time on average.",
          "Insertion finds the correct position via the same traversal, then randomly determines how many levels the new node gets promoted to."
        ]
      }
    ]
  },
  lsmtree: {
    title: 'How LSM Trees Work',
    sections: [
      {
        heading: '1. The Write (Memory & Durability)',
        paragraphs: [
          "When a new piece of data or an update arrives, two things happen simultaneously: first, the data is appended to a continuous Write-Ahead Log (WAL) on disk to ensure it isn't lost if the power fails. Second, it is inserted into an in-memory data structure called the MemTable that keeps the keys sorted."
        ]
      },
      {
        heading: '2. The Flush (Moving to Disk)',
        paragraphs: [
          "Once that in-memory MemTable reaches a certain size threshold, it is frozen and temporarily becomes read-only, while a new MemTable is created to catch incoming writes. The frozen MemTable is then flushed sequentially to disk as an SSTable (Sorted String Table). Because the data was already sorted in memory, this is a very fast, continuous disk write."
        ]
      },
      {
        heading: '3. The Read Path',
        paragraphs: [
          "To find a record, the system searches in order of newest data to oldest: first, it checks the active MemTable, then any frozen MemTables waiting to flush, and finally the SSTables on disk. To avoid wasting time reading disk files that don't contain the target data, the system checks an in-memory Bloom Filter for each SSTable."
        ]
      },
      {
        heading: '4. The Deletion (Tombstones)',
        paragraphs: [
          "Because SSTables are immutable, deleting a record means writing a special marker called a Tombstone into the active MemTable. When a read encounters this Tombstone, it immediately stops searching and returns a 'Not Found' result, effectively masking older versions."
        ]
      },
      {
        heading: '5. Compaction',
        paragraphs: [
          "Over time, a background process called Compaction continuously gathers several older SSTables, merges them together, purges the dead Tombstoned records, and writes out a single, heavily optimized new SSTable to keep read speeds from degrading."
        ]
      }
    ]
  },
  inverted: {
    title: 'How the Inverted Index Works',
    sections: [
      {
        heading: '1. The Core Components',
        paragraphs: [
          "Instead of asking 'What words are in this document?', the index asks, 'Which documents contain this word?' It uses three main components:",
          "The FST (Term Index): A highly compressed, tree-like structure in fast RAM. It stores prefixes of words and points to locations on the hard drive.",
          "The Term Dictionary: A disk-based file containing the full list of sorted words. Once the exact word is found here, it provides a byte-offset pointer.",
          "The Postings List: A compressed, disk-based file containing the actual arrays of Document IDs (and exact word positions) where a specific term appears."
        ]
      },
      {
        heading: '2. Inserts & Sorting',
        paragraphs: [
          "As documents come in, they are tokenized into raw pairs: (word, DocID). These are flushed to disk in chunks. Once parsed, the engine runs an external merge-sort to order everything alphabetically. Because pairs are sorted, identical words are adjacent and collapsed into the final inverted format: apple -> [1, 8, 45]."
        ]
      },
      {
        heading: '3. Immutable Segments & The Read Path',
        paragraphs: [
          "New documents are indexed into a temporary in-memory buffer, which is eventually flushed to disk as a read-only Segment. When a query comes in, it is broadcast to all segments. The system hits the in-memory FST to find disk locations, jumps to the Term Dictionary, and reads the Postings List. The valid results from all segments are merged and scored."
        ]
      },
      {
        heading: '4. Deletes & Updates',
        paragraphs: [
          "Because segments are immutable, deleted documents are added to a separate Tombstone file. During a search, matching documents in the Tombstone are silently hidden. Updating a document simply means deleting the old one (Tombstone) and inserting the new one."
        ]
      }
    ]
  }
};
