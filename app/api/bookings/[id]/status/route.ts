import { NextRequest } from 'next/server';
import { updateStatus, updateStatusSchema } from '@/services/booking.service';
import { errorResponse, successResponse } from '@/lib/api-helpers';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const bookingId = parseInt(id, 10);
        const providerId = parseInt(request.headers.get('x-user-id') || '0', 10);
        const userType = request.headers.get('x-user-type');

        if (userType !== 'provider') return errorResponse('Only providers can update booking status', 403);

        const body = await request.json();
        const parsed = updateStatusSchema.safeParse(body);
        if (!parsed.success) {
            return errorResponse(parsed.error.errors[0].message, 422);
        }

        await updateStatus(bookingId, parsed.data.status, providerId);
        return successResponse({}, `Booking status updated to ${parsed.data.status}`);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Status update failed';
        console.error('Update status error:', err);
        return errorResponse(message, 400);
    }
}
