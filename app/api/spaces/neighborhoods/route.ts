import { NextResponse } from 'next/server';
import { getAvailableNeighborhoods } from '@/services/space.service';
import { errorResponse, successResponse } from '@/lib/api-helpers';
import { cache, CACHE_TTL } from '@/lib/cache';

const CACHE_KEY = 'neighborhoods';

export async function GET() {
    try {
        // Check cache first
        const cached = cache.get<string[]>(CACHE_KEY);
        if (cached) {
            return successResponse({ neighborhoods: cached });
        }

        const neighborhoods = await getAvailableNeighborhoods();
        cache.set(CACHE_KEY, neighborhoods, CACHE_TTL.LONG); // 15 min
        return successResponse({ neighborhoods });
    } catch (err) {
        console.error('Fetch neighborhoods error:', err);
        return errorResponse('Failed to fetch neighborhoods', 500);
    }
}
