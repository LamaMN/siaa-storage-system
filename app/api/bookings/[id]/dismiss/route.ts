import { NextRequest } from 'next/server';
import { deleteRejectedBooking } from '@/repositories/booking.repository';
import { errorResponse, successResponse } from '@/lib/api-helpers';

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const bookingId = parseInt(id, 10);
        const userId = parseInt(request.headers.get('x-user-id') || '0', 10);
        const userType = request.headers.get('x-user-type') || '';

        if (!userId || !['seeker', 'provider'].includes(userType)) {
            return errorResponse('Unauthorized', 401);
        }

        const deleted = await deleteRejectedBooking(bookingId, userId, userType);
        if (!deleted) {
            return errorResponse('Booking not found or not rejected', 404);
        }

        return successResponse({}, 'Rejected booking dismissed');
    } catch (err) {
        console.error('Dismiss booking error:', err);
        return errorResponse('Failed to dismiss booking', 500);
    }
}
