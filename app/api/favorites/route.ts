import { NextRequest } from 'next/server';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/api-helpers';
import { getSeekerFavorites } from '@/repositories/space.repository';

export async function GET(request: NextRequest) {
  try {
    const token = extractTokenFromHeader(request.headers.get('authorization'));
    if (!token) return errorResponse('Unauthorized', 401);

    const payload = await verifyToken(token);
    if (payload.userType !== 'seeker') {
      return errorResponse('Only seekers can view favorites', 403);
    }

    const favorites = await getSeekerFavorites(payload.id);

    return successResponse({
      favorites: favorites.map((s: any) => ({
        ...s,
        FavoriteCount: Number(s.FavoriteCount || 0),
        IsFavorited: true,
      })),
    });
  } catch (err) {
    console.error('Get favorites error:', err);
    return errorResponse('Failed to load favorites', 500);
  }
}