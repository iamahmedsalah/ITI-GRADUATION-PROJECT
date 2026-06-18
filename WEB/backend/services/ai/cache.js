export const createTtlCache = () => {
  const entries = new Map();

  const get = (key) => {
    const entry = entries.get(key);
    if (!entry) return null;

    if (entry.expiresAt <= Date.now()) {
      entries.delete(key);
      return null;
    }

    return entry.value;
  };

  const set = (key, value, ttlMs) => {
    if (ttlMs <= 0) return value;

    entries.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
    return value;
  };

  const deleteByPrefix = (prefix) => {
    for (const key of entries.keys()) {
      if (key.startsWith(prefix)) {
        entries.delete(key);
      }
    }
  };

  return {
    get,
    set,
    deleteByPrefix,
    clear: () => entries.clear(),
    size: () => entries.size,
  };
};

export const aiCache = createTtlCache();

export const AI_ACCESS_CACHE_TTL_MS = 25 * 1000;
export const AI_RECOMMENDATIONS_CACHE_TTL_MS = 60 * 1000;
export const AI_CHAT_CATALOG_CACHE_TTL_MS = 5 * 60 * 1000;
export const AI_TOPIC_EXPLANATION_CACHE_TTL_MS = 10 * 60 * 1000;
