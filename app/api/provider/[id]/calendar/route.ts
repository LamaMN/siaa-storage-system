import { NextRequest } from 'next/server';
import { findCalendarBookingsByProvider } from '@/repositories/booking.repository';
import { errorResponse, successResponse } from '@/lib/api-helpers';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const providerId = parseInt(id, 10);
        const userType = request.headers.get('x-user-type');
        const userId = parseInt(request.headers.get('x-user-id') || '0', 10);

        if (userType !== 'provider' || userId !== providerId) {
            return errorResponse('Forbidden', 403);
        }

        const bookings = await findCalendarBookingsByProvider(providerId);
        return successResponse({ bookings });
    } catch (err) {
        console.error('Calendar bookings error:', err);
        return errorResponse('Failed to load calendar data', 500);
    }
}
