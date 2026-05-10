/**
 * Simple in-memory cache with TTL for lightweight server-side caching.
 * Used for data that changes infrequently (neighborhoods, price ranges, etc.).
 */

interface CacheEntry<T> {
    data: T;
    expiresAt: number;
}

class MemoryCache {
    private store = new Map<string, CacheEntry<unknown>>();

    /**
     * Get a cached value, or null if expired/missing.
     */
    get<T>(key: string): T | null {
        const entry = this.store.get(key);
        if (!entry) return null;
        if (Date.now() > entry.expiresAt) {
            this.store.delete(key);
            return null;
        }
        return entry.data as T;
    }

    /**
     * Set a cached value with a TTL in seconds.
     */
    set<T>(key: string, data: T, ttlSeconds: number): void {
        this.store.set(key, {
            data,
            expiresAt: Date.now() + ttlSeconds * 1000,
        });
    }

    /**
     * Invalidate a specific key.
     */
    invalidate(key: string): void {
        this.store.delete(key);
    }

    /**
     * Invalidate all keys matching a prefix.
     */
    invalidatePrefix(prefix: string): void {
        for (const key of this.store.keys()) {
            if (key.startsWith(prefix)) {
                this.store.delete(key);
            }
        }
    }

    /**
     * Clear entire cache.
     */
    clear(): void {
        this.store.clear();
    }
}

// Singleton — survives across requests in Next.js dev/prod
declare global {
    // eslint-disable-next-line no-var
    var _appCache: MemoryCache | undefined;
}

export const cache = global._appCache ?? (global._appCache = new MemoryCache());

// Common TTL constants (seconds)
export const CACHE_TTL = {
    SHORT: 60,          // 1 minute
    MEDIUM: 300,        // 5 minutes
    LONG: 900,          // 15 minutes
} as const;
