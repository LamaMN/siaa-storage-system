import { NextRequest } from 'next/server';
import { getSpaceReviews } from '@/services/booking.service';
import { addProviderResponse } from '@/repositories/booking.repository';
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

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userType = request.headers.get('x-user-type');
        const userId = parseInt(request.headers.get('x-user-id') || '0', 10);

        if (userType !== 'provider' || !userId) {
            return errorResponse('Only providers can reply to reviews', 403);
        }

        const body = await request.json();
        const { reviewId, response } = body;

        if (!reviewId || !response?.trim()) {
            return errorResponse('Review ID and response text are required', 422);
        }

        const updated = await addProviderResponse(reviewId, userId, response.trim());
        if (!updated) {
            return errorResponse('Review not found or not yours', 404);
        }

        return successResponse({}, 'Response submitted successfully');
    } catch (err) {
        console.error('Provider review response error:', err);
        return errorResponse('Failed to submit response', 500);
    }
}
