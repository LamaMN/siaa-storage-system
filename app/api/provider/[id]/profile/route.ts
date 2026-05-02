import { NextRequest } from 'next/server';
import { getProviderPublicProfile } from '@/repositories/space.repository';
import { errorResponse, successResponse } from '@/lib/api-helpers';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const providerId = parseInt(id, 10);
        if (isNaN(providerId)) return errorResponse('Invalid provider ID', 400);

        const profile = await getProviderPublicProfile(providerId);
        if (!profile) return errorResponse('Provider not found', 404);

        return successResponse({ profile });
    } catch (err) {
        console.error('Provider profile error:', err);
        return errorResponse('Failed to load provider profile', 500);
    }
}
