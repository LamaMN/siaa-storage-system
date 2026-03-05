import { NextResponse } from 'next/server';
import { getPriceRange } from '@/repositories/space.repository';
import { successResponse, errorResponse } from '@/lib/api-helpers';

export async function GET() {
    try {
        const range = await getPriceRange();
        return successResponse(range);
    } catch (err) {
        console.error('Failed to fetch price range:', err);
        return errorResponse('Failed to fetch filter data', 500);
    }
}
