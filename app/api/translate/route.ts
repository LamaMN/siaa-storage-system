import { NextRequest, NextResponse } from 'next/server';

/**
 * Translates a single text string using the free MyMemory API.
 * Safer than batching with a delimiter (which MyMemory can alter in RTL output).
 */
async function translateOne(text: string): Promise<string> {
    if (!text || !text.trim()) return text;
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.trim())}&langpair=en|ar`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return text;
    const data = await res.json();
    return data?.responseData?.translatedText || text;
}

export async function POST(req: NextRequest) {
    try {
        const { texts }: { texts: string[] } = await req.json();

        if (!texts || texts.length === 0) {
            return NextResponse.json({ translations: [] });
        }

        // Translate all texts in parallel — no delimiter trick needed,
        // so Arabic RTL output cannot break the result mapping.
        const translations = await Promise.all(texts.map(translateOne));

        return NextResponse.json({ translations });
    } catch (err) {
        console.error('[translate API] error:', err);
        // Graceful fallback — client will fall back to original English
        return NextResponse.json({ translations: [] });
    }
}
