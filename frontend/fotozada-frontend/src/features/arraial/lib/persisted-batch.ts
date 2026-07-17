import type { BatchResult } from "../types";

const STORAGE_KEY = "fotozada_arraial_batch";
// Slightly under the backend's `fotozada-cleanup` cron (deletes batches older
// than 1h) so we never try to resume a batch the DB has already dropped.
const TTL_MS = 55 * 60 * 1000;

interface StoredBatch {
  result: BatchResult;
  savedAt: number;
}

// Persists the in-flight batch so a refresh or closed tab can resume the
// status screen instead of losing track of a photo that's still printing.
export function saveBatch(result: BatchResult): void {
  try {
    const entry: StoredBatch = { result, savedAt: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
  } catch {
    // Private browsing / quota exceeded — resume just won't work.
  }
}

export function loadBatch(): BatchResult | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const entry = JSON.parse(raw) as StoredBatch;
    if (!entry.result || Date.now() - entry.savedAt > TTL_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return entry.result;
  } catch {
    return null;
  }
}

export function clearBatch(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
