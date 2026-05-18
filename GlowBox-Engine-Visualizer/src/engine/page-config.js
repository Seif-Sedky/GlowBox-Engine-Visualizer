// Engine Page Configuration
// Sizes in bytes
export const SIZES = {
    PAGE_HEADER: 24, // e.g., page ID, LSN, free space pointer, etc.
    POINTER: 8, // 64-bit pointer
    INT_KEY: 8, // 64-bit integer keys
};
/**
 * Derives the capacity (maximum number of keys/entries) a node can hold
 * given the page size.
 *
 * For a B+ Tree internal node:
 * A node needs: Header + N*Keys + (N+1)*Pointers <= PageSize
 * So: N*(Key + Pointer) + Pointer + Header <= PageSize
 * N <= (PageSize - Header - Pointer) / (Key + Pointer)
 */
export function calculateNodeCapacity(pageSize) {
    const availableSpace = pageSize - SIZES.PAGE_HEADER - SIZES.POINTER;
    const entrySize = SIZES.INT_KEY + SIZES.POINTER;
    return Math.floor(availableSpace / entrySize);
}
/**
 * Similar to calculateNodeCapacity, but tailored for Extendible Hashing buckets.
 * Buckets just hold pairs of (Key, Value/RecordId), plus local depth.
 */
export function calculateBucketCapacity(pageSize) {
    const availableSpace = pageSize - SIZES.PAGE_HEADER;
    // Key + RecordId (which we simulate as pointer-sized)
    const entrySize = SIZES.INT_KEY + SIZES.POINTER;
    return Math.floor(availableSpace / entrySize);
}
//# sourceMappingURL=page-config.js.map