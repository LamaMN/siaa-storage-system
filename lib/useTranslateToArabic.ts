'use client';

// Module-level cache so translations survive re-renders and component remounts.
// Key: original English text → Value: Arabic translation
const translationCache = new Map<string, string>();

/**
 * Reads the lang cookie synchronously.
 * Must NOT use useEffect — we need isArabic correct on the first render,
 * before useEffect fires (avoids the race condition with performSearch).
 */
function readIsArabic(): boolean {
    if (typeof document === 'undefined') return false; // SSR guard
    const match = document.cookie.match(/(?:^|; )lang=([^;]+)/);
    return match?.[1] === 'ar';
}

export function useTranslateToArabic() {
    const isArabic = readIsArabic();

    /**
     * Translates an array of strings to Arabic.
     * - Deduplicates before sending to API (same word translated once).
     * - Only calls the API for strings not already in the module-level cache.
     * - Returns originals immediately if language is English.
     * - Silently falls back to originals on any API error.
     */
    async function translate(texts: string[]): Promise<string[]> {
        if (!isArabic || texts.length === 0) return texts;

        // Deduplicate: send each unique, non-empty, uncached string once
        const uniqueUncached = Array.from(
            new Set(texts.filter(t => t && t.trim() && !translationCache.has(t)))
        );

        if (uniqueUncached.length > 0) {
            try {
                const res = await fetch('/api/translate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ texts: uniqueUncached }),
                });

                if (res.ok) {
                    const json: { translations: string[] } = await res.json();
                    // Store each unique translation in cache
                    uniqueUncached.forEach((orig, i) => {
                        const translated = json.translations[i];
                        if (translated && translated !== orig) {
                            translationCache.set(orig, translated);
                        }
                    });
                }
            } catch {
                // Network error — silently fall back to originals
            }
        }

        // Map all original texts through cache, fallback to original if missing
        return texts.map(t => (t && translationCache.get(t)) ?? t ?? '');
    }

    return { isArabic, translate };
}
