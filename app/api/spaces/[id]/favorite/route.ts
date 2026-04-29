import { NextRequest } from 'next/server';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/api-helpers';
import { addFavorite, removeFavorite } from '@/repositories/space.repository';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const spaceId = Number(id);

    const token = extractTokenFromHeader(request.headers.get('authorization'));
    if (!token) return errorResponse('Unauthorized', 401);

    const payload = await verifyToken(token);
    if (payload.userType !== 'seeker') {
      return errorResponse('Only seekers can like spaces', 403);
    }

    const result: any = await addFavorite(payload.id, spaceId);

    return successResponse({
      IsFavorited: true,
      FavoriteCount: Number(result?.FavoriteCount || 0),
    });
  } catch (err) {
    console.error('Add favorite error:', err);
    return errorResponse('Failed to add favorite', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const spaceId = Number(id);

    const token = extractTokenFromHeader(request.headers.get('authorization'));
    if (!token) return errorResponse('Unauthorized', 401);

    const payload = await verifyToken(token);
    if (payload.userType !== 'seeker') {
      return errorResponse('Only seekers can remove likes', 403);
    }

    const result: any = await removeFavorite(payload.id, spaceId);

    return successResponse({
      IsFavorited: false,
      FavoriteCount: Number(result?.FavoriteCount || 0),
    });
  } catch (err) {
    console.error('Remove favorite error:', err);
    return errorResponse('Failed to remove favorite', 500);
  }
}