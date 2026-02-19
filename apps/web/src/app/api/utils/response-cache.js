const DEFAULT_MAX_ENTRIES = 300;

function getStore(name) {
  if (!globalThis.__findnearpgResponseCaches) {
    globalThis.__findnearpgResponseCaches = new Map();
  }
  if (!globalThis.__findnearpgResponseCaches.has(name)) {
    globalThis.__findnearpgResponseCaches.set(name, new Map());
  }
  return globalThis.__findnearpgResponseCaches.get(name);
}

export function getCachedValue(cacheName, key) {
  const store = getStore(cacheName);
  const entry = store.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

export function setCachedValue(cacheName, key, value, ttlMs, maxEntries = DEFAULT_MAX_ENTRIES) {
  const store = getStore(cacheName);
  if (store.size >= maxEntries) {
    const oldestKey = store.keys().next().value;
    if (oldestKey) store.delete(oldestKey);
  }
  store.set(key, {
    value,
    expiresAt: Date.now() + Math.max(1000, Number(ttlMs) || 1000),
  });
}

