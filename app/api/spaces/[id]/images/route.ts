import { NextRequest } from 'next/server';
import { uploadSpaceImages } from '@/services/space.service';
import { errorResponse, successResponse } from '@/lib/api-helpers';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const spaceId = parseInt(id, 10);
        const userType = request.headers.get('x-user-type');
        if (userType !== 'provider') return errorResponse('Forbidden', 403);

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
