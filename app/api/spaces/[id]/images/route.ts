import { NextRequest } from 'next/server';
import { uploadSpaceImages, getSpaceImages } from '@/services/space.service';
import { errorResponse, successResponse } from '@/lib/api-helpers';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const spaceId = parseInt(id, 10);
        if (isNaN(spaceId)) return errorResponse('Invalid space ID', 400);
        const images = await getSpaceImages(spaceId);
        return successResponse({ images });
    } catch (err) {
        console.error('Get space images error:', err);
        return errorResponse('Failed to load images', 500);
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const spaceId = parseInt(id, 10);

        const authHeader = request.headers.get('authorization');
        const token = extractTokenFromHeader(authHeader);
        if (!token) return errorResponse('Unauthorized', 401);
        const payload = await verifyToken(token);
        if (payload.userType !== 'provider') return errorResponse('Forbidden', 403);

        const formData = await request.formData();
        const files: Array<{ buffer: Buffer; contentType: string; caption?: string }> = [];

        for (const [key, value] of formData.entries()) {
            if (key.startsWith('image') && value instanceof File) {
                const arrayBuffer = await value.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                files.push({ buffer, contentType: value.type || 'image/jpeg' });
            }
        }

        if (files.length === 0) return errorResponse('No image files provided', 400);
        if (files.length > 10) return errorResponse('Maximum 10 images per space', 400);

        const imageIds = await uploadSpaceImages(spaceId, files);
        return successResponse({ imageIds }, `${files.length} image(s) uploaded`, 201);
    } catch (err) {
        console.error('Upload images error:', err);
        return errorResponse('Failed to upload images', 500);
    }
}
