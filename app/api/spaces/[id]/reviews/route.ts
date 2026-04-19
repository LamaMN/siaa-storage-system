import { NextRequest } from 'next/server';
import { getSpaceReviews } from '@/services/booking.service';
import { errorResponse, successResponse } from '@/lib/api-helpers';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const spaceId = parseInt(id, 10);
        if (isNaN(spaceId)) return errorResponse('Invalid space ID', 400);

        const reviews = await getSpaceReviews(spaceId);
        return successResponse({ reviews });
    } catch (err) {
        console.error('Space reviews error:', err);
        return errorResponse('Failed to load reviews', 500);
    }
}
