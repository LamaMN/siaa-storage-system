import { NextRequest } from 'next/server';
import { getDashboardStats } from '@/services/booking.service';
import { errorResponse, successResponse } from '@/lib/api-helpers';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const providerId = parseInt(id, 10);
        const requestUserId = parseInt(request.headers.get('x-user-id') || '0', 10);
        if (requestUserId !== providerId) return errorResponse('Forbidden', 403);

        const statistics = await getDashboardStats(providerId, 'provider');
        return successResponse({ statistics });
    } catch (err) {
        console.error('Provider stats error:', err);
        return errorResponse('Failed to load statistics', 500);
    }
}
