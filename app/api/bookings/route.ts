import { NextRequest } from 'next/server';
import { createBooking, createBookingSchema, getSeekerBookings } from '@/services/booking.service';
import { errorResponse, successResponse } from '@/lib/api-helpers';

export async function POST(request: NextRequest) {
    try {
        const seekerId = parseInt(request.headers.get('x-user-id') || '0', 10);
        const userType = request.headers.get('x-user-type');

        if (!seekerId || userType !== 'seeker') {
            return errorResponse('Only seekers can create bookings', 403);
        }

        const body = await request.json();
        const parsed = createBookingSchema.safeParse(body);

        if (!parsed.success) {
            return errorResponse(parsed.error.errors[0].message, 422);
        }

        const result = await createBooking(seekerId, parsed.data);
        return successResponse(result, 'Booking request submitted successfully', 201);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create booking';
        console.error('Create booking error:', err);
        return errorResponse(message, 400);
    }
}
