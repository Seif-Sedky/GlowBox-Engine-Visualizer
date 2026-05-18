let nextNodeId = 1;
export class BPlusNode {
    constructor(isLeaf) {
        this.id = nextNodeId++;
        this.isLeaf = isLeaf;
        this.keys = [];
        this.children = [];
        this.nextLeaf = null;
    }
    clone() {
        const node = new BPlusNode(this.isLeaf);
        node.id = this.id;
        node.keys = [...this.keys];
        node.children = this.children.map(c => c.clone());
        return node;
    }
}
export class BPlusTree {
    constructor(maxKeys, minKeys = 2) {
        this.capacity = maxKeys;
        if (this.capacity < 2) {
            this.capacity = 2;
        }
        this.minKeys = minKeys;
        if (this.minKeys < 1)
            this.minKeys = 1;
        this.root = new BPlusNode(true);
    }
    clone() {
        const tree = new BPlusTree(this.capacity, this.minKeys);
        tree.root = this.root.clone();
        return tree;
    }
    createDiffArray() {
        const tree = this;
        const arr = [];
        const originalPush = arr.push.bind(arr);
        arr.push = function (...diffs) {
            const structuralTypes = ['NODE_CREATE', 'NODE_DELETE', 'NODE_SPLIT', 'NODE_MERGE', 'KEY_INSERT', 'KEY_DELETE', 'LEAF_LINK_UPDATE'];
            for (const diff of diffs) {
                if (structuralTypes.includes(diff.type)) {
                    diff.snapshot = tree.clone();
                }
            }
            return originalPush(...diffs);
        };
        return arr;
    }
    // --- Insertion ---
    insert(key) {
        const diffs = this.createDiffArray();
        diffs.push({
            type: 'ANNOTATION',
            annotation: `Inserting key ${key}`,
            payload: { key }
        });
        const rootChildInfo = this._insertAt(this.root, key, diffs);
        // If the root was split
        if (rootChildInfo) {
            const newRoot = new BPlusNode(false);
            newRoot.keys = [rootChildInfo.key];
            newRoot.children = [this.root, rootChildInfo.node];
            this.root = newRoot;
            diffs.push({
                type: 'NODE_CREATE',
                payload: { nodeId: rootChildInfo.node.id, isLeaf: rootChildInfo.node.isLeaf }
            });
            diffs.push({
                type: 'NODE_SPLIT',
                payload: { sourceId: newRoot.children[0].id, newId: rootChildInfo.node.id, isLeaf: rootChildInfo.node.isLeaf }
            });
            if (rootChildInfo.node.isLeaf) {
                diffs.push({
                    type: 'LEAF_LINK_UPDATE',
                    payload: { sourceId: newRoot.children[0].id, targetId: rootChildInfo.node.id }
                });
            }
            diffs.push({
                type: 'NODE_CREATE',
                payload: { nodeId: newRoot.id, isLeaf: false }
            });
            diffs.push({
                type: 'ANNOTATION',
                annotation: `Root overflowed. Created new root with key ${rootChildInfo.key}`,
                payload: { key: rootChildInfo.key, oldRootId: this.root.children[0].id, newRootId: newRoot.id }
            });
        }
        return diffs;
    }
    _insertAt(node, key, diffs) {
        diffs.push({
            type: 'NODE_HIGHLIGHT',
            payload: { nodeId: node.id }
        });
        if (node.isLeaf) {
            // Find insertion point
            let insertIndex = 0;
            while (insertIndex < node.keys.length && node.keys[insertIndex] <= key) {
                insertIndex++;
            }
            // Insert key into leaf
            node.keys.splice(insertIndex, 0, key);
            diffs.push({
                type: 'KEY_INSERT',
                payload: { nodeId: node.id, key, index: insertIndex }
            });
            // Check overflow
            if (node.keys.length > this.capacity) {
                return this._splitLeaf(node, diffs);
            }
            return null;
        }
        else {
            // Internal node
            let childIndex = 0;
            while (childIndex < node.keys.length && key >= node.keys[childIndex]) {
                childIndex++;
            }
            diffs.push({
                type: 'ANNOTATION',
                annotation: `Following pointer ${childIndex} for key ${key}`,
                payload: { nodeId: node.id, childIndex }
            });
            const childSplit = this._insertAt(node.children[childIndex], key, diffs);
            if (childSplit) {
                // Child was split, need to insert the moved-up/copied-up key into this node
                let insertIndex = 0;
                while (insertIndex < node.keys.length && node.keys[insertIndex] < childSplit.key) {
                    insertIndex++;
                }
                node.keys.splice(insertIndex, 0, childSplit.key);
                node.children.splice(insertIndex + 1, 0, childSplit.node);
                diffs.push({
                    type: 'NODE_CREATE',
                    payload: { nodeId: childSplit.node.id, isLeaf: childSplit.node.isLeaf }
                });
                diffs.push({
                    type: 'NODE_SPLIT',
                    payload: { sourceId: node.children[childIndex].id, newId: childSplit.node.id, isLeaf: childSplit.node.isLeaf }
                });
                if (childSplit.node.isLeaf) {
                    diffs.push({
                        type: 'LEAF_LINK_UPDATE',
                        payload: { sourceId: node.children[childIndex].id, targetId: childSplit.node.id }
                    });
                }
                diffs.push({
                    type: 'KEY_INSERT',
                    payload: { nodeId: node.id, key: childSplit.key, index: insertIndex }
                });
                diffs.push({
                    type: 'POINTER_REDIRECT',
                    payload: { sourceId: node.id, targetId: childSplit.node.id, index: insertIndex + 1 }
                });
                if (node.keys.length > this.capacity) {
                    return this._splitInternal(node, diffs);
                }
            }
            return null;
        }
    }
    _splitLeaf(node, diffs) {
        const splitIndex = Math.ceil(node.keys.length / 2);
        const rightKeys = node.keys.splice(splitIndex);
        const rightNode = new BPlusNode(true);
        rightNode.keys = rightKeys;
        // Maintain leaf chain
        rightNode.nextLeaf = node.nextLeaf;
        node.nextLeaf = rightNode;
        // Copy up the median (which is the first key of the new right node)
        const copyUpKey = rightNode.keys[0];
        diffs.push({
            type: 'ANNOTATION',
            annotation: `Leaf overflow. Splitting and copying up ${copyUpKey}`,
            payload: { key: copyUpKey, leftId: node.id, rightId: rightNode.id }
        });
        return { key: copyUpKey, node: rightNode };
    }
    _splitInternal(node, diffs) {
        const splitIndex = Math.floor(node.keys.length / 2);
        // Move up the median (it does NOT stay in the left or right node)
        const moveUpKey = node.keys[splitIndex];
        const rightKeys = node.keys.splice(splitIndex + 1);
        const rightChildren = node.children.splice(splitIndex + 1);
        // Remove the moveUpKey from left node
        node.keys.pop();
        const rightNode = new BPlusNode(false);
        rightNode.keys = rightKeys;
        rightNode.children = rightChildren;
        diffs.push({
            type: 'ANNOTATION',
            annotation: `Internal node overflow. Splitting and moving up ${moveUpKey}`,
            payload: { key: moveUpKey, leftId: node.id, rightId: rightNode.id }
        });
        return { key: moveUpKey, node: rightNode };
    }
    // --- Deletion ---
    delete(key) {
        const diffs = this.createDiffArray();
        diffs.push({
            type: 'ANNOTATION',
            annotation: `Deleting key ${key}`,
            payload: { key }
        });
        this._deleteAt(null, -1, this.root, key, diffs);
        // If root is internal and becomes empty, its first child becomes the new root
        if (!this.root.isLeaf && this.root.keys.length === 0) {
            const oldRootId = this.root.id;
            this.root = this.root.children[0];
            diffs.push({
                type: 'NODE_DELETE',
                payload: { nodeId: oldRootId }
            });
            diffs.push({
                type: 'ANNOTATION',
                annotation: `Root became empty. Child ${this.root.id} is the new root.`
            });
        }
        return diffs;
    }
    _deleteAt(parent, childIndex, node, key, diffs) {
        diffs.push({ type: 'NODE_HIGHLIGHT', payload: { nodeId: node.id } });
        if (node.isLeaf) {
            const index = node.keys.indexOf(key);
            if (index === -1) {
                diffs.push({ type: 'ANNOTATION', annotation: `Key ${key} not found for deletion.` });
                return;
            }
            node.keys.splice(index, 1);
            diffs.push({ type: 'KEY_DELETE', payload: { nodeId: node.id, key, index } });
            if (parent && node.keys.length < Math.floor(this.capacity / 2)) {
                this._resolveUnderflow(parent, childIndex, node, diffs);
            }
        }
        else {
            let i = 0;
            while (i < node.keys.length && key >= node.keys[i]) {
                i++;
            }
            diffs.push({ type: 'ANNOTATION', annotation: `Following pointer ${i}`, payload: { nodeId: node.id, childIndex: i } });
            this._deleteAt(node, i, node.children[i], key, diffs);
            if (parent && node.keys.length < Math.floor(this.capacity / 2)) {
                this._resolveUnderflow(parent, childIndex, node, diffs);
            }
        }
    }
    _resolveUnderflow(parent, index, node, diffs) {
        const minKeys = this.minKeys;
        const leftSibling = index > 0 ? parent.children[index - 1] : null;
        const rightSibling = index < parent.children.length - 1 ? parent.children[index + 1] : null;
        // 1. Try borrow from left
        if (leftSibling && leftSibling.keys.length > minKeys) {
            if (node.isLeaf) {
                const borrowedKey = leftSibling.keys.pop();
                node.keys.unshift(borrowedKey);
                parent.keys[index - 1] = node.keys[0]; // Update parent separator
                diffs.push({ type: 'KEY_DELETE', payload: { nodeId: leftSibling.id, index: leftSibling.keys.length } });
                diffs.push({ type: 'KEY_INSERT', payload: { nodeId: node.id, key: borrowedKey, index: 0 } });
                diffs.push({ type: 'ANNOTATION', annotation: `Borrowed ${borrowedKey} from left sibling` });
            }
            else {
                // Rotational borrow
                const borrowedKey = leftSibling.keys.pop();
                const borrowedChild = leftSibling.children.pop();
                const parentKey = parent.keys[index - 1];
                node.keys.unshift(parentKey);
                node.children.unshift(borrowedChild);
                parent.keys[index - 1] = borrowedKey;
                diffs.push({ type: 'ANNOTATION', annotation: `Rotational borrow from left sibling` });
            }
            return;
        }
        // 2. Try borrow from right
        if (rightSibling && rightSibling.keys.length > minKeys) {
            if (node.isLeaf) {
                const borrowedKey = rightSibling.keys.shift();
                node.keys.push(borrowedKey);
                parent.keys[index] = rightSibling.keys[0]; // Update parent separator
                diffs.push({ type: 'KEY_DELETE', payload: { nodeId: rightSibling.id, index: 0 } });
                diffs.push({ type: 'KEY_INSERT', payload: { nodeId: node.id, key: borrowedKey, index: node.keys.length - 1 } });
                diffs.push({ type: 'ANNOTATION', annotation: `Borrowed ${borrowedKey} from right sibling` });
            }
            else {
                // Rotational borrow
                const borrowedKey = rightSibling.keys.shift();
                const borrowedChild = rightSibling.children.shift();
                const parentKey = parent.keys[index];
                node.keys.push(parentKey);
                node.children.push(borrowedChild);
                parent.keys[index] = borrowedKey;
                diffs.push({ type: 'ANNOTATION', annotation: `Rotational borrow from right sibling` });
            }
            return;
        }
        // 3. Merge
        if (leftSibling) {
            // Merge node into leftSibling
            if (node.isLeaf) {
                leftSibling.keys.push(...node.keys);
                leftSibling.nextLeaf = node.nextLeaf;
            }
            else {
                const parentKey = parent.keys[index - 1];
                leftSibling.keys.push(parentKey, ...node.keys);
                leftSibling.children.push(...node.children);
            }
            parent.keys.splice(index - 1, 1);
            parent.children.splice(index, 1);
            diffs.push({ type: 'NODE_MERGE', payload: { targetId: leftSibling.id, sourceId: node.id } });
            diffs.push({ type: 'NODE_DELETE', payload: { nodeId: node.id } });
            diffs.push({ type: 'ANNOTATION', annotation: `Merged into left sibling` });
        }
        else if (rightSibling) {
            // Merge rightSibling into node
            if (node.isLeaf) {
                node.keys.push(...rightSibling.keys);
                node.nextLeaf = rightSibling.nextLeaf;
            }
            else {
                const parentKey = parent.keys[index];
                node.keys.push(parentKey, ...rightSibling.keys);
                node.children.push(...rightSibling.children);
            }
            parent.keys.splice(index, 1);
            parent.children.splice(index + 1, 1);
            diffs.push({ type: 'NODE_MERGE', payload: { targetId: node.id, sourceId: rightSibling.id } });
            diffs.push({ type: 'NODE_DELETE', payload: { nodeId: rightSibling.id } });
            diffs.push({ type: 'ANNOTATION', annotation: `Merged right sibling into current node` });
        }
    }
    // --- Search ---
    search(key) {
        const diffs = this.createDiffArray();
        let curr = this.root;
        diffs.push({
            type: 'ANNOTATION',
            annotation: `Searching for key ${key}`,
            payload: { key }
        });
        while (!curr.isLeaf) {
            diffs.push({
                type: 'NODE_HIGHLIGHT',
                payload: { nodeId: curr.id }
            });
            let i = 0;
            while (i < curr.keys.length && key >= curr.keys[i]) {
                i++;
            }
            diffs.push({
                type: 'ANNOTATION',
                annotation: `Following pointer ${i}`,
                payload: { nodeId: curr.id, childIndex: i }
            });
            curr = curr.children[i];
        }
        diffs.push({
            type: 'NODE_HIGHLIGHT',
            payload: { nodeId: curr.id }
        });
        const foundIndex = curr.keys.indexOf(key);
        if (foundIndex !== -1) {
            diffs.push({
                type: 'KEY_HIGHLIGHT',
                payload: { nodeId: curr.id, index: foundIndex }
            });
            diffs.push({
                type: 'ANNOTATION',
                annotation: `Found key ${key} in leaf`,
                payload: { nodeId: curr.id, index: foundIndex }
            });
        }
        else {
            diffs.push({
                type: 'ANNOTATION',
                annotation: `Key ${key} not found`,
                payload: { key }
            });
        }
        return diffs;
    }
}
//# sourceMappingURL=bplus-tree.js.map