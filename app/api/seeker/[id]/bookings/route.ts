import { NextRequest } from 'next/server';
import { getSeekerBookings } from '@/services/booking.service';
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

        const bookings = await getSeekerBookings(seekerId);
        return successResponse({ bookings });
    } catch (err) {
        console.error('Seeker bookings error:', err);
        return errorResponse('Failed to load bookings', 500);
    }
}
