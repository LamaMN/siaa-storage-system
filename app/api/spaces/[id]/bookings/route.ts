import { NextRequest } from 'next/server';
import { findActiveBookingsForSpace } from '@/repositories/booking.repository';
import { errorResponse, successResponse } from '@/lib/api-helpers';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const spaceId = parseInt(id, 10);
        if (isNaN(spaceId)) return errorResponse('Invalid space ID', 400);

        const bookings = await findActiveBookingsForSpace(spaceId);
        return successResponse({ bookings });
    } catch (err) {
        console.error('Space bookings error:', err);
        return errorResponse('Failed to load space bookings', 500);
    }
}
