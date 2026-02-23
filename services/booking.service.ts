import { z } from 'zod';
import {
    createBooking as createBookingRepo,
    cancelBooking,
    updateBookingStatus,
    findBookingById,
    findBookingsBySeeker,
    findBookingsByProvider,
    findReviewByBooking,
    createReview as createReviewRepo,
    findReviewsBySeeker,
    findReviewsBySpace,
    getSeekerStatistics,
    getProviderStatistics,
} from '@/repositories/booking.repository';
import { findSpaceById } from '@/repositories/space.repository';
import type { BookingStatus } from '@/models/booking';

// ============================================================
// ZOD SCHEMAS
// ============================================================

export const createBookingSchema = z.object({
    spaceId: z.number().int().positive(),
    startDate: z.string().refine((d) => !isNaN(Date.parse(d)), 'Valid start date required'),
    endDate: z.string().refine((d) => !isNaN(Date.parse(d)), 'Valid end date required'),
    specialRequests: z.string().max(1000).optional(),
    logisticsOption: z.enum(['self_dropoff', 'partner_pickup']).optional(),
}).refine(
    (d) => new Date(d.endDate) >= new Date(d.startDate),
    { message: 'End date must be after start date', path: ['endDate'] }
);

export const createReviewSchema = z.object({
    rating: z.number().int().min(1).max(5),
    comment: z.string().min(10).max(500).optional(),
    seekerId: z.number().int().positive(),
});

export const updateStatusSchema = z.object({
    status: z.enum(['Confirmed', 'Active', 'Completed', 'Cancelled', 'Rejected']),
});

// ============================================================
// SERVICE METHODS
// ============================================================

export async function createBooking(
    seekerId: number,
    data: z.infer<typeof createBookingSchema>
) {
    const space = await findSpaceById(data.spaceId);
    if (!space) throw new Error('Space not found');
    if (!space.IsAvailable) throw new Error('Space is not available for booking');
    if (space.Status !== 'Active') throw new Error('Space is not currently active');

    // Calculate duration and total
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const durationMs = end.getTime() - start.getTime();
    const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));

    if (durationDays < (space.MinRentalPeriod || 1)) {
        throw new Error(`Minimum rental period is ${space.MinRentalPeriod} day(s)`);
    }

    // Calculate total amount
    let totalAmount: number;
    if (durationDays <= 7 && space.PricePerDay) {
        totalAmount = durationDays * space.PricePerDay;
    } else if (durationDays <= 28 && space.PricePerWeek) {
        const weeks = durationDays / 7;
        totalAmount = Math.ceil(weeks) * space.PricePerWeek;
    } else {
        const months = durationDays / 30;
        totalAmount = Math.ceil(months) * space.PricePerMonth;
    }

    const PLATFORM_FEE_RATE = 0.15;
    const platformFee = parseFloat((totalAmount * PLATFORM_FEE_RATE).toFixed(2));

    const bookingId = await createBookingRepo(
        { spaceId: data.spaceId, seekerId, startDate: data.startDate, endDate: data.endDate, specialRequests: data.specialRequests },
        parseFloat(totalAmount.toFixed(2)),
        platformFee
    );

    return { bookingId, totalAmount, platformFee };
}

export async function cancelBookingBySeeker(
    bookingId: number,
    seekerId: number
): Promise<void> {
    const cancelled = await cancelBooking(bookingId, seekerId);
    if (!cancelled) {
        throw new Error('Cannot cancel this booking. It may already be confirmed or not belong to you.');
    }
}

export async function updateStatus(
    bookingId: number,
    status: BookingStatus,
    providerId: number
): Promise<void> {
    const booking = await findBookingById(bookingId);
    if (!booking) throw new Error('Booking not found');
    if (booking.ProviderID !== providerId) throw new Error('Unauthorized: not your booking');

    // Business rules
    const allowedTransitions: Partial<Record<BookingStatus, BookingStatus[]>> = {
        Pending: ['Confirmed', 'Rejected'],
        Confirmed: ['Active', 'Cancelled'],
        Active: ['Completed'],
    };

    const current = booking.BookingStatus as BookingStatus;
    if (!allowedTransitions[current]?.includes(status)) {
        throw new Error(`Cannot change status from ${current} to ${status}`);
    }

    await updateBookingStatus(bookingId, status);
}

export async function submitReview(
    bookingId: number,
    data: z.infer<typeof createReviewSchema>
): Promise<number> {
    const booking = await findBookingById(bookingId);
    if (!booking) throw new Error('Booking not found');
    if (booking.SeekerID !== data.seekerId) throw new Error('Unauthorized');
    if (booking.BookingStatus !== 'Completed') {
        throw new Error('Reviews can only be submitted for completed bookings');
    }

    const existing = await findReviewByBooking(bookingId);
    if (existing) throw new Error('You have already reviewed this booking');

    return createReviewRepo(bookingId, data);
}

export async function getSeekerBookings(seekerId: number) {
    return findBookingsBySeeker(seekerId);
}

export async function getProviderBookings(providerId: number) {
    return findBookingsByProvider(providerId);
}

export async function getSeekerReviews(seekerId: number) {
    return findReviewsBySeeker(seekerId);
}

export async function getSpaceReviews(spaceId: number) {
    return findReviewsBySpace(spaceId);
}

export async function getDashboardStats(userId: number, userType: 'seeker' | 'provider') {
    if (userType === 'seeker') {
        return getSeekerStatistics(userId);
    }
    return getProviderStatistics(userId);
}
