import { NextRequest } from 'next/server';
import { getSeekerReviews } from '@/services/booking.service';
import { errorResponse, successResponse } from '@/lib/api-helpers';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const seekerId = parseInt(id, 10);
        const requestUserId = parseInt(request.headers.get('x-user-id') || '0', 10);
        if (requestUserId !== seekerId) return errorResponse('Forbidden', 403);

        const reviews = await getSeekerReviews(seekerId);
        return successResponse({ reviews });
    } catch (err) {
        console.error('Seeker reviews error:', err);
        return errorResponse('Failed to load reviews', 500);
    }
}
