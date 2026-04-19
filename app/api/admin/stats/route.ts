import { NextRequest } from 'next/server';
import { getAdminStatistics } from '@/repositories/space.repository';
import { errorResponse, successResponse } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
    try {
        const statistics = await getAdminStatistics();
        return successResponse({ statistics });
    } catch (err) {
        console.error('Admin stats error:', err);
        return errorResponse('Failed to load admin statistics', 500);
    }
}
