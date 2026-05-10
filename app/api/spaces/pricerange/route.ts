import { NextResponse } from 'next/server';
import { getPriceRange } from '@/repositories/space.repository';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { cache, CACHE_TTL } from '@/lib/cache';

const CACHE_KEY = 'pricerange';

export async function GET() {
    try {
        // Check cache first
        const cached = cache.get<{ minPrice: number; maxPrice: number }>(CACHE_KEY);
        if (cached) {
            return successResponse(cached);
        }

        const range = await getPriceRange();
        cache.set(CACHE_KEY, range, CACHE_TTL.MEDIUM); // 5 min
        return successResponse(range);
    } catch (err) {
        console.error('Failed to fetch price range:', err);
        return errorResponse('Failed to fetch filter data', 500);
    }
}
