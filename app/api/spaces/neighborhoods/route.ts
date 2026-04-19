import { NextResponse } from 'next/server';
import { getAvailableNeighborhoods } from '@/services/space.service';
import { errorResponse, successResponse } from '@/lib/api-helpers';

export async function GET() {
    try {
        const neighborhoods = await getAvailableNeighborhoods();
        return successResponse({ neighborhoods });
    } catch (err) {
        console.error('Fetch neighborhoods error:', err);
        return errorResponse('Failed to fetch neighborhoods', 500);
    }
}
