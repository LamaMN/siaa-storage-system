import { NextRequest } from 'next/server';
import { findSpacesByProvider } from '@/repositories/space.repository';
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

        const spaces = await findSpacesByProvider(providerId);
        return successResponse({ spaces });
    } catch (err) {
        console.error('Provider spaces error:', err);
        return errorResponse('Failed to load spaces', 500);
    }
}
