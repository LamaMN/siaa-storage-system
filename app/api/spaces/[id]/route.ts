import { NextRequest } from 'next/server';
import { findSpaceById } from '@/repositories/space.repository';
import { deleteSpace, updateSpace } from '@/repositories/space.repository';
import { errorResponse, successResponse } from '@/lib/api-helpers';

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const spaceId = parseInt(id, 10);
        if (isNaN(spaceId)) return errorResponse('Invalid space ID', 400);

        const space = await findSpaceById(spaceId);
        if (!space) return errorResponse('Space not found', 404);

        return successResponse({ space });
    } catch (err) {
        console.error('Get space error:', err);
        return errorResponse('Failed to load space', 500);
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const spaceId = parseInt(id, 10);
        const providerId = parseInt(request.headers.get('x-user-id') || '0', 10);
        const userType = request.headers.get('x-user-type');

        if (!providerId || userType !== 'provider') return errorResponse('Forbidden', 403);

        const body = await request.json();
        await updateSpace(spaceId, body);

        return successResponse({}, 'Space updated successfully');
    } catch (err) {
        console.error('Update space error:', err);
        return errorResponse('Failed to update space', 500);
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const spaceId = parseInt(id, 10);
        const providerId = parseInt(request.headers.get('x-user-id') || '0', 10);
        const userType = request.headers.get('x-user-type');

        if (!providerId || userType !== 'provider') return errorResponse('Forbidden', 403);

        await deleteSpace(spaceId, providerId);
        return successResponse({}, 'Space deleted');
    } catch (err) {
        console.error('Delete space error:', err);
        return errorResponse('Failed to delete space', 500);
    }
}
