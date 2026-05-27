export type FamilyNode = {
  name: string;
  children?: FamilyNode[];
};

export type IndexLore = {
  id: string;
  name: string;
  era: string;
  text: string;
  papers: { title: string; authors: string; conference?: string; note?: string }[];
  familyTree?: FamilyNode; // hierarchical family tree
  hasCoinFlip?: boolean; // special animation for skip list
};

export const LORE_DATA: Record<string, IndexLore> = {
  bplus: {
    id: 'bplus',
    name: 'B+ Tree',
    era: '1970s · Disk-era classic',
    text: "   Born in 1970 from the minds of Rudolf Bayer and Edward McCreight at Boeing Research Labs, the B-tree was engineered to solve a very unglamorous problem: hard disks were painfully slow, and existing binary trees were making too many disk reads. The B+ tree, its more sociable descendant, doubled down on the idea by keeping all actual data in the leaf nodes and chaining them together like a linked list, making range queries a breeze. It became the quiet backbone of nearly every relational database ever written. MySQL's InnoDB, PostgreSQL, SQLite, they all owe a debt to this unassuming tree. However, it never got a movie :(",
    papers: [
      { authors: 'Bayer, R. & McCreight, E.', title: 'Organization and Maintenance of Large Ordered Indices', conference: 'Acta Informatica', note: '1972' },
      { authors: 'Comer, D.', title: 'The Ubiquitous B-Tree', conference: 'ACM Computing Surveys', note: '1979' }
    ],
    familyTree: {
      name: 'B-Tree',
      children: [
        {
          name: 'B+ Tree',
          children: [
            { name: 'B*-Tree' },
            { name: 'B-link Tree' },
            { name: 'Bw-Tree' },
            { name: 'CSB+-Tree' }
          ]
        },
        { name: 'Bε-Tree / Fractal Tree' }
      ]
    }
  },
  rtree: {
    id: 'rtree',
    name: 'R-Tree',
    era: '1984 · Spatial pioneer',
    text: "   Have you ever felt like you need an abillity to instantly find a place on a map just by being told it's coordinates? Yeah me neither, but it's crucial for atleast Google Maps to know how to do so, and pehrhaps, if you ever become an astronaut, you will probably need something like that too. Well anyways, it's 1984. Antonin Guttman at UC Berkeley is staring at a map and thinking: \"How on earth do you index a region?\" Binary trees index points on a line. But the real world has shapes: polygons, regions, bounding boxes. His answer was the R-tree: a tree that groups nearby geometric objects into minimum bounding rectangles (MBRs), nesting them like Russian dolls all the way up to the root. It was imperfect; overlapping bounding boxes could force you to search multiple branches, but it was the first practical spatial index, and it launched an entire family of descendants. Today it powers map apps, GPS systems, and every \"find restaurants near me\" query you've ever made.",
    papers: [
      { authors: 'Guttman, A.', title: 'R-Trees: A Dynamic Index Structure for Spatial Searching', conference: 'ACM SIGMOD', note: '1984' },
      { authors: 'Beckmann, N. et al.', title: 'The R*-tree: An Efficient and Robust Access Method for Points and Rectangles', conference: 'ACM SIGMOD', note: '1990' }
    ],
    familyTree: {
      name: 'R-Tree',
      children: [
        { name: 'R+-Tree' },
        { name: 'R*-Tree' },
        { name: 'X-Tree' },
        { name: 'Hilbert R-Tree' },
        { name: 'PR-Tree' }
      ]
    }
  },
  hash: {
    id: 'hash',
    name: 'Extendible Hash Index',
    era: '1979 · Dynamic hashing',
    text: "  Hashing is ancient by computer science standards; just map a key to a bucket and go. The problem? Static hash tables are terrible at growing. You either over-allocate (wasteful) or rehash everything when you run out (catastrophic reorganization at scale). In 1979, Ronald Fagin, Jürg Nievergelt, Nicholas Pippenger, and H. Raymond Strong published a light-weight breakthrough: a hash index that could double gracefully. Using a shared global directory of bit-depth pointers, extendible hashing only ever splits the one bucket that's full, leaving everything else untouched. It was elegant, incremental, and practical, a rare combination. It never became as universal as the B+ tree, but it remains the go-to teachable example of how a little bit-twiddling can make a data structure genuinely scalable.",
    papers: [
      { authors: 'Fagin, R. et al.', title: 'Extendible Hashing — A Fast Access Method for Dynamic Files', conference: 'ACM Transactions on Database Systems', note: '1979' },
      { authors: 'Litwin, W.', title: 'Linear Hashing: A New Tool for File and Table Addressing', conference: 'VLDB', note: '1980 (A notable contemporary alternative worth mentioning)' }
    ],
    familyTree: {
      name: 'Hashing',
      children: [
        { name: 'Static Hashing' },
        {
          name: 'Dynamic Hashing',
          children: [
            { name: 'Extendible Hashing' },
            { name: 'Linear Hashing' },
            { name: 'Cuckoo Hashing' }
          ]
        }
      ]
    }
  },
  inverted: {
    id: 'inverted',
    name: 'Inverted Index',
    era: '1960s · The Search Engine',
    text: "   Long before Google, before AltaVista, before anyone called it \"search,\" librarians had a problem: how do you find every book that mentions a specific word without reading all of them? The answer, it turns out, was to flip the relationship inside out. Instead of document → words, you build word → documents. That inversion, so simple it feels obvious in hindsight, is the entire idea. The term \"inverted index\" appears in information retrieval literature as far back as the 1950s, but it was Gerard Salton's SMART system at Cornell in the 1960s–70s that turned it into a rigorous science, introducing concepts like TF-IDF weighting that are still used today. Then came the web: billions of pages, trillions of words. Doug Cutting built Lucene in 2000 as an open-source answer to industrial-scale full-text search, and its descendants, Solr, Elasticsearch and Apache Lucene, now quietly power the search bar on almost every website you use. Every time you type a query and get results in milliseconds, an inverted index somewhere is doing the heavy lifting. It is, without exaggeration, the index that made the internet navigable.",
    papers: [
      { authors: 'Salton, G. & McGill, M.', title: 'Introduction to Modern Information Retrieval', conference: 'McGraw-Hill', note: '1983' },
      { authors: 'Zobel, J. & Moffat, A.', title: 'Inverted Files for Text Search Engines', conference: 'ACM Computing Surveys', note: '2006' },
      { authors: 'Brin, S. & Page, L.', title: 'The Anatomy of a Large-Scale Hypertextual Web Search Engine', conference: 'WWW Conference', note: '1998 (The paper that put inverted indices at planetary scale)' }
    ],
    familyTree: {
      name: 'Inverted Index',
      children: [
        { name: 'Positional Inverted Index' }
      ]
    }
  },
  skiplist: {
    id: 'skiplist',
    name: 'Skip List',
    era: '1989 · The Coin Flip',
    text: "  It's 1989, and William Pugh at the University of Maryland is tired. Tired of balanced trees, their rotations, their rebalancing logic, their pages of implementation complexity. He had a wild idea: what if instead of carefully enforcing balance with rotations, you just gambled your way to it? His invention, the skip list, is a linked list that got a little ambitious. It adds express lanes above the base list, each node is promoted to higher layers by a coin flip, so you can skip over large swaths of data during a search, achieving O(log n) performance on average through pure probabilistic luck. The computer science establishment was skeptical. You're trusting a random number generator with your data structure's performance? Pugh published it anyway, and the industry quietly came around. Redis uses a skip list for its sorted sets. LevelDB uses one as its in-memory write buffer. CockroachDB, HBase, and several other major systems rely on them too. The skip list is proof that sometimes the elegant solution isn't the rigorous one, it's the one that flips a coin with high chance to win the lottery.",
    papers: [
      { authors: 'Pugh, W.', title: 'Skip Lists: A Probabilistic Alternative to Balanced Trees', conference: 'Communications of the ACM', note: '1990' },
      { authors: 'Pugh, W.', title: 'A Skip List Cookbook', conference: 'University of Maryland Technical Report', note: '1990 (The practical companion to the original paper)' }
    ],
    hasCoinFlip: true,
    familyTree: {
      name: 'Linked List',
      children: [
        {
          name: 'Skip List',
          children: [
            { name: 'Deterministic Skip List' },
            { name: 'Concurrent Skip List' }
          ]
        }
      ]
    }
  },
  lsmtree: {
    id: 'lsmtree',
    name: 'LSM Tree',
    era: '1996 · Write-Heavy King',
    text: "  By the early 1990s, Patrick O'Neil and his colleagues had noticed something deeply uncomfortable about B+ trees: they were magnificent for reads, but writes were quietly killing them. Every random write meant seeking to a specific disk location, reading a page, modifying it, and writing it back. On spinning hard drives, which still ruled the world, random I/O was brutally expensive. O'Neil's 1996 paper proposed something almost philosophically different: stop fighting the sequential nature of storage, and use it. The LSM tree never overwrites data in place. Instead, writes go first into a small, fast in-memory buffer (the MemTable). When it fills up, it's flushed to disk as a sorted, immutable file (an SSTable). Periodically, these files are merged and compacted in the background, like a glacier slowly grinding down old layers. The result is blindingly fast writes, at the cost of more complex reads and a background compaction process that hums along like a well-managed bureaucracy. Google's Bigtable paper in 2006 brought LSM trees to the mainstream, and RocksDB, Cassandra, LevelDB, and ScyllaDB turned them into the default choice for write-heavy workloads. It's probably not idea to go into the long lasting war between SQL and NoSQL, or OLAP vs OLTP right now, but who knows maybe I'll include a war simulator where you can victor your favourite",
    papers: [
      { authors: "O'Neil, P. et al.", title: 'The Log-Structured Merge-Tree (LSM-Tree)', conference: 'Acta Informatica', note: '1996' },
      { authors: 'Chang, F. et al.', title: 'Bigtable: A Distributed Storage System for Structured Data', conference: 'OSDI', note: '2006 (The paper that industrialized LSM trees)' },
      { authors: 'Dayan, N. & Idreos, S.', title: 'Dostoevsky: Better Space-Time Trade-Offs for LSM-Tree Based Key-Value Stores', conference: 'ACM SIGMOD', note: '2018 (Modern LSM theory)' }
    ],
    familyTree: {
      name: 'Log-Structured Storage',
      children: [
        {
          name: 'LSM-Tree',
          children: [
            { name: 'bLSM' },
            { name: 'PebblesDB' },
            { name: 'WiscKey' }
          ]
        }
      ]
    }
  }
};
