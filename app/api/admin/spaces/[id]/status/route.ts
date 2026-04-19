import { NextRequest } from 'next/server';
import { updateSpaceStatus } from '@/repositories/space.repository';
import { errorResponse, successResponse } from '@/lib/api-helpers';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const spaceId = parseInt(id, 10);
        const body = await request.json();
        const { status } = body;

        if (!['Active', 'Rejected'].includes(status)) {
            return errorResponse('Status must be Active or Rejected', 422);
        }

        await updateSpaceStatus(spaceId, status);
        return successResponse({}, `Space ${status === 'Active' ? 'approved' : 'rejected'} successfully`);
    } catch (err) {
        console.error('Admin update space status error:', err);
        return errorResponse('Failed to update space status', 500);
    }
}
