import { NextRequest } from 'next/server';
import { submitReview, createReviewSchema } from '@/services/booking.service';
import { errorResponse, successResponse } from '@/lib/api-helpers';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const bookingId = parseInt(id, 10);

        const body = await request.json();
        const parsed = createReviewSchema.safeParse(body);
        if (!parsed.success) {
            return errorResponse(parsed.error.errors[0].message, 422);
        }

        const reviewId = await submitReview(bookingId, parsed.data);
        return successResponse({ reviewId }, 'Review submitted successfully', 201);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to submit review';
        console.error('Submit review error:', err);
        return errorResponse(message, 400);
    }
}
