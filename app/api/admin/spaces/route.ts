import { NextRequest } from 'next/server';
import { findAllPendingSpaces } from '@/repositories/space.repository';
import { errorResponse, successResponse } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
    try {
        const spaces = await findAllPendingSpaces();
        return successResponse({ spaces });
    } catch (err) {
        console.error('Admin get pending spaces error:', err);
        return errorResponse('Failed to load pending spaces', 500);
    }
}
