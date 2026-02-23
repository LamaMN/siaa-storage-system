import { NextRequest } from 'next/server';
import { cancelBookingBySeeker, updateStatus, updateStatusSchema } from '@/services/booking.service';
import { findBookingById } from '@/repositories/booking.repository';
import { errorResponse, successResponse } from '@/lib/api-helpers';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const bookingId = parseInt(id, 10);
        const booking = await findBookingById(bookingId);

        if (!booking) return errorResponse('Booking not found', 404);

        // Only the booking's seeker or provider can view it
        const userId = parseInt(request.headers.get('x-user-id') || '0', 10);
        const userType = request.headers.get('x-user-type');

        const isOwner =
            (userType === 'seeker' && booking.SeekerID === userId) ||
            (userType === 'provider' && booking.ProviderID === userId);

        if (!isOwner) return errorResponse('Forbidden', 403);

        return successResponse({ booking });
    } catch (err) {
        console.error('Get booking error:', err);
        return errorResponse('Failed to load booking', 500);
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const bookingId = parseInt(id, 10);
        const seekerId = parseInt(request.headers.get('x-user-id') || '0', 10);
        const userType = request.headers.get('x-user-type');

        if (userType !== 'seeker') return errorResponse('Only seekers can cancel bookings', 403);

        await cancelBookingBySeeker(bookingId, seekerId);
        return successResponse({}, 'Booking cancelled successfully');
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Cancellation failed';
        console.error('Cancel booking error:', err);
        return errorResponse(message, 400);
    }
}
