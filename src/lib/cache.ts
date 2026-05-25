type CacheEntry<T> = {
  value: T;
  expires: number;
};

const globalKey = "__memoryCache";
const cache: Map<string, CacheEntry<unknown>> =
  (globalThis as any)[globalKey] || new Map();
(globalThis as any)[globalKey] = cache;

export function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry.value as T;
}

export function setCached<T>(key: string, value: T, ttlMs: number) {
  cache.set(key, { value, expires: Date.now() + ttlMs });
}
