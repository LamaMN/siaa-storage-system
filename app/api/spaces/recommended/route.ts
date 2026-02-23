import { NextRequest } from 'next/server';
import { getRecommended } from '@/services/space.service';
import { errorResponse, successResponse } from '@/lib/api-helpers';

export const revalidate = 3600; // ISR: revalidate every hour

export async function GET(request: NextRequest) {
    try {
        const city = request.nextUrl.searchParams.get('city') || 'Jeddah';
        const limit = Math.min(
            parseInt(request.nextUrl.searchParams.get('limit') || '6', 10),
            12
        );

        const spaces = await getRecommended(city, limit);
        return successResponse({ spaces, city });
    } catch (err) {
        console.error('Recommendations error:', err);
        return errorResponse('Failed to load recommendations', 500);
    }
}
