import { NextRequest } from 'next/server';
import { searchAndRecommendSpaces } from '@/services/space.service';
import { createSpaceSchema, createNewSpace } from '@/services/space.service';
import { errorResponse, successResponse, parsePagination } from '@/lib/api-helpers';
import type { SpaceSearchFilters } from '@/models/space';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const { page, limit, skip } = parsePagination(searchParams);

        const filters: SpaceSearchFilters = {
            city: searchParams.get('city') || undefined,
            spaceType: searchParams.get('spaceType') || searchParams.get('space_type') || undefined,
            maxPrice: searchParams.has('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
            minPrice: searchParams.has('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
            minSize: searchParams.has('minSize') ? parseFloat(searchParams.get('minSize')!) : undefined,
            maxSize: searchParams.has('maxSize') ? parseFloat(searchParams.get('maxSize')!) : undefined,
            climateControlled: searchParams.get('climateControlled') === '1' ? true : undefined,
            securitySystem: searchParams.get('security') === '1' ? true : undefined,
            parkingAvailable: searchParams.get('parking') === '1' ? true : undefined,
            sortBy: (searchParams.get('sortBy') as SpaceSearchFilters['sortBy']) || 'match',
            page,
            limit,
        };

        const result = await searchAndRecommendSpaces(filters);
        return successResponse({ spaces: result.spaces, page, limit, count: result.spaces.length, totalCount: result.totalCount });
    } catch (err) {
        console.error('Search spaces error:', err);
        return errorResponse('Failed to search spaces', 500);
    }
}

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        const token = extractTokenFromHeader(authHeader);
        if (!token) return errorResponse('Unauthorized', 401);

        const payload = await verifyToken(token);
        const providerId = payload.id;
        const userType = payload.userType;

        if (!providerId || userType !== 'provider') {
            return errorResponse('Only providers can create spaces', 403);
        }

        const body = await request.json();
        const parsed = createSpaceSchema.safeParse(body);

        if (!parsed.success) {
            return errorResponse(parsed.error.errors[0].message, 422);
        }

        const spaceId = await createNewSpace(providerId, parsed.data);
        return successResponse({ spaceId }, 'Space listed successfully!', 201);
    } catch (err) {
        console.error('Create space error:', err);
        return errorResponse('Failed to create space', 500);
    }
}
