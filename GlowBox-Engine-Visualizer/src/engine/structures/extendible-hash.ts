import { Diff, DiffType } from '../diff.types';

let nextBucketId = 1;

export class HashBucket {
  id: number;
  localDepth: number;
  keys: number[];

  constructor(localDepth: number) {
    this.id = nextBucketId++;
    this.localDepth = localDepth;
    this.keys = [];
  }

  clone(): HashBucket {
    const bucket = new HashBucket(this.localDepth);
    bucket.id = this.id;
    bucket.keys = [...this.keys];
    return bucket;
  }
}

export class ExtendibleHash {
  globalDepth: number;
  directory: HashBucket[];
  capacity: number;

  constructor(capacity: number) {
    this.capacity = capacity;
    if (this.capacity < 1) this.capacity = 1;
    this.globalDepth = 1;
    
    // Initialize directory with 2^globalDepth = 2 buckets
    const bucket0 = new HashBucket(1);
    const bucket1 = new HashBucket(1);
    this.directory = [bucket0, bucket1];
  }

  clone(): ExtendibleHash {
    const hash = new ExtendibleHash(this.capacity);
    hash.globalDepth = this.globalDepth;
    
    // Deep copy unique buckets
    const bucketMap = new Map<number, HashBucket>();
    const newDirectory: HashBucket[] = [];
    
    for (const b of this.directory) {
      if (!bucketMap.has(b.id)) {
        bucketMap.set(b.id, b.clone());
      }
      newDirectory.push(bucketMap.get(b.id)!);
    }
    
    hash.directory = newDirectory;
    return hash;
  }

  private createDiffArray(): Diff[] {
    const hash = this;
    const arr: Diff[] = [];
    const originalPush = arr.push.bind(arr);
    arr.push = function(...diffs: Diff[]) {
      const structuralTypes = ['NODE_CREATE', 'NODE_DELETE', 'NODE_SPLIT', 'KEY_INSERT', 'KEY_DELETE', 'BUCKET_SPLIT', 'DIRECTORY_EXPAND', 'POINTER_REDIRECT'];
      for (const diff of diffs) {
        if (structuralTypes.includes(diff.type)) {
          diff.snapshot = hash.clone();
        }
      }
      return originalPush(...diffs);
    };
    return arr;
  }

  // Uses LSB mapping
  private getHash(key: number, depth: number): number {
    if (depth === 0) return 0;
    const mask = (1 << depth) - 1;
    return key & mask;
  }

  insert(key: number): Diff[] {
    const diffs = this.createDiffArray();
    diffs.push({
      type: 'ANNOTATION',
      annotation: `Inserting key ${key}`,
      payload: { key }
    });

    this._insert(key, diffs);
    return diffs;
  }

  private _insert(key: number, diffs: Diff[]) {
    let index = this.getHash(key, this.globalDepth);
    let bucket = this.directory[index];

    diffs.push({
      type: 'NODE_HIGHLIGHT',
      payload: { nodeId: bucket.id }
    });
    
    const binaryKey = (key >>> 0).toString(2);
    const lsbBits = index.toString(2).padStart(this.globalDepth, '0');
    
    diffs.push({
      type: 'ANNOTATION',
      annotation: `Key ${key} → binary: ${binaryKey}, LSB(${this.globalDepth}): ${lsbBits} → bucket index ${index}`,
      payload: { 
        key, 
        binaryKey,
        lsbBits,
        bucketIndex: index, 
        globalDepth: this.globalDepth,
        isHashInfo: true 
      }
    });

    bucket.keys.push(key);
    
    diffs.push({
      type: 'KEY_INSERT',
      payload: { nodeId: bucket.id, key, index: bucket.keys.length - 1 }
    });

    // Handle Overflow — loop handles edge case where split doesn't separate keys
    while (bucket.keys.length > this.capacity) {
      diffs.push({
        type: 'ANNOTATION',
        annotation: `Bucket ${bucket.id} overflowed (capacity ${this.capacity})`,
        payload: { nodeId: bucket.id }
      });

      if (bucket.localDepth === this.globalDepth) {
        // Expand directory
        const oldSize = 1 << this.globalDepth;
        this.globalDepth++;
        const newSize = 1 << this.globalDepth;
        
        for (let i = 0; i < oldSize; i++) {
          this.directory[i + oldSize] = this.directory[i];
        }

        diffs.push({
          type: 'DIRECTORY_EXPAND',
          payload: { oldDepth: this.globalDepth - 1, newDepth: this.globalDepth }
        });
        diffs.push({
          type: 'ANNOTATION',
          annotation: `Doubled directory size to ${newSize} (global depth ${this.globalDepth})`
        });
      }

      // Split bucket
      const newBucket = new HashBucket(bucket.localDepth + 1);
      bucket.localDepth++;
      
      const allKeys = [...bucket.keys];
      bucket.keys = [];
      
      diffs.push({
        type: 'NODE_CREATE',
        payload: { nodeId: newBucket.id, isBucket: true }
      });

      // Compute the base suffix (shared by all keys before split) and the two new suffixes
      const baseSuffix = this.getHash(allKeys[0], bucket.localDepth - 1);
      const hash0 = baseSuffix; // 0-bit at the newly considered position
      const hash1 = baseSuffix | (1 << (bucket.localDepth - 1)); // 1-bit

      // Re-distribute keys
      for (const k of allKeys) {
        if (this.getHash(k, bucket.localDepth) === hash0) {
          bucket.keys.push(k);
        } else {
          newBucket.keys.push(k);
        }
      }

      diffs.push({
        type: 'BUCKET_SPLIT',
        payload: { sourceId: bucket.id, newId: newBucket.id, localDepth: bucket.localDepth }
      });

      // Update directory pointers — entries matching hash1 now point to newBucket
      for (let i = 0; i < (1 << this.globalDepth); i++) {
        if (this.directory[i] === bucket) {
          if (this.getHash(i, bucket.localDepth) === hash1) {
            this.directory[i] = newBucket;
            diffs.push({
              type: 'POINTER_REDIRECT',
              payload: { directoryIndex: i, targetId: newBucket.id }
            });
          }
        }
      }

      diffs.push({
        type: 'ANNOTATION',
        annotation: `Split bucket into ${bucket.id} and ${newBucket.id} (local depth ${bucket.localDepth})`
      });

      // Re-evaluate: the inserted key may now be in either bucket — follow it
      const newIndex = this.getHash(key, this.globalDepth);
      bucket = this.directory[newIndex];
      // Loop continues if that bucket still overflows
    }
  }

  delete(key: number): Diff[] {
    const diffs = this.createDiffArray();
    diffs.push({
      type: 'ANNOTATION',
      annotation: `Deleting key ${key}`,
      payload: { key }
    });

    const index = this.getHash(key, this.globalDepth);
    const bucket = this.directory[index];

    diffs.push({
      type: 'NODE_HIGHLIGHT',
      payload: { nodeId: bucket.id }
    });

    const keyIndex = bucket.keys.indexOf(key);
    if (keyIndex !== -1) {
      bucket.keys.splice(keyIndex, 1);
      diffs.push({
        type: 'KEY_DELETE',
        payload: { nodeId: bucket.id, key, index: keyIndex }
      });
      diffs.push({
        type: 'ANNOTATION',
        annotation: `Deleted key ${key} from bucket ${bucket.id}`
      });
      // Extendible hash usually merges buckets when empty, but we can skip merge for simplicity unless required.
    } else {
      diffs.push({
        type: 'ANNOTATION',
        annotation: `Key ${key} not found`
      });
    }

    return diffs;
  }

  search(key: number): Diff[] {
    const diffs = this.createDiffArray();
    diffs.push({
      type: 'ANNOTATION',
      annotation: `Searching for key ${key}`,
      payload: { key }
    });

    const index = this.getHash(key, this.globalDepth);
    const bucket = this.directory[index];

    diffs.push({
      type: 'NODE_HIGHLIGHT',
      payload: { nodeId: bucket.id }
    });

    const keyIndex = bucket.keys.indexOf(key);
    if (keyIndex !== -1) {
      diffs.push({
        type: 'KEY_HIGHLIGHT',
        payload: { nodeId: bucket.id, index: keyIndex }
      });
      diffs.push({
        type: 'ANNOTATION',
        annotation: `Found key ${key} at index ${index}`
      });
    } else {
      diffs.push({
        type: 'ANNOTATION',
        annotation: `Key ${key} not found`
      });
    }

    return diffs;
  }
}
