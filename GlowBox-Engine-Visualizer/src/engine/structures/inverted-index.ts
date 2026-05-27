import { Diff } from '../diff.types';

export class FSTNode {
  id: string;
  char: string;
  isFinal: boolean = false;
  termId?: number;
  children: Record<string, FSTNode> = {};

  constructor(id: string, char: string = '') {
    this.id = id;
    this.char = char;
  }
}

export interface Document {
  id: number;
  text: string;
}

export class InvertedIndex {
  documents: Document[] = [];
  fstRoot: FSTNode;
  postings: Record<number, number[]> = {};
  
  private nextTermId = 0;
  private nextNodeId = 1;

  constructor() {
    this.fstRoot = new FSTNode('root');
  }

  // Very basic tokenizer: lowercases, removes punctuation, splits by whitespace
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 0);
  }

  insert(text: string): Diff[] {
    const diffs: Diff[] = [];
    const docId = this.documents.length;
    this.documents.push({ id: docId, text });

    diffs.push({
      type: 'DOC_ADD',
      payload: { docId, text },
      annotation: `Inserted Document ${docId}: "${text}"`
    });

    const tokens = this.tokenize(text);

    // Dedup tokens per document to avoid adding docId multiple times to the same posting list
    // (since we are not doing term frequency or positions right now)
    const uniqueTokens = Array.from(new Set(tokens));

    for (const token of uniqueTokens) {
      let current = this.fstRoot;
      diffs.push({
        type: 'FST_NODE_HIGHLIGHT',
        payload: { nodeId: current.id },
        annotation: `Inserting term: "${token}"`
      });

      // Traverse/Build FST (Currently behaves like a Trie with prefix sharing)
      for (let i = 0; i < token.length; i++) {
        const char = token[i];
        
        if (!current.children[char]) {
          const newNode = new FSTNode(`n${this.nextNodeId++}`, char);
          current.children[char] = newNode;
          
          diffs.push({
            type: 'FST_NODE_CREATE',
            payload: { parentId: current.id, childId: newNode.id, char },
            annotation: `Create node for '${char}'`
          });
        }

        current = current.children[char];
        diffs.push({
          type: 'FST_NODE_HIGHLIGHT',
          payload: { nodeId: current.id },
        });
      }

      // Mark final node
      if (!current.isFinal) {
        current.isFinal = true;
        current.termId = this.nextTermId++;
        this.postings[current.termId] = [];
      }

      // Append to postings list
      if (!this.postings[current.termId!].includes(docId)) {
        this.postings[current.termId!].push(docId);
        diffs.push({
          type: 'POSTING_APPEND',
          payload: { term: token, termId: current.termId, docId },
          annotation: `Appended Doc ${docId} to posting list for "${token}"`
        });
      }
    }

    // Add a final snapshot
    diffs.push({
      type: 'ANNOTATION',
      annotation: `Finished inserting Document ${docId}`,
      snapshot: this.clone()
    });

    return diffs;
  }

  delete(_text: string): Diff[] {
    return [{ type: 'ANNOTATION', annotation: 'Delete operation not yet supported for Inverted Index.' }];
  }

  search(text: string): Diff[] {
    const diffs: Diff[] = [];
    const tokens = this.tokenize(text);
    
    diffs.push({
      type: 'ANNOTATION',
      annotation: `Searching for: "${text}"`
    });

    for (const token of tokens) {
      let current = this.fstRoot;
      let found = true;

      for (let i = 0; i < token.length; i++) {
        const char = token[i];
        if (!current.children[char]) {
          found = false;
          break;
        }
        current = current.children[char];
        diffs.push({
          type: 'FST_NODE_HIGHLIGHT',
          payload: { nodeId: current.id },
          annotation: `Tracing '${char}'...`
        });
      }

      if (found && current.isFinal) {
        diffs.push({
          type: 'POSTING_APPEND', // Reusing this diff type just to highlight the posting row maybe? Or a new POSTING_HIGHLIGHT
          payload: { term: token, termId: current.termId, highlight: true },
          annotation: `Found "${token}" in documents: [${this.postings[current.termId!].join(', ')}]`
        });
      } else {
        diffs.push({
          type: 'ANNOTATION',
          annotation: `Term "${token}" not found in index.`
        });
      }
    }

    return diffs;
  }

  clone(): any {
    // Deep clone the structure so the renderer can safely traverse historic states
    return JSON.parse(JSON.stringify(this));
  }
}
