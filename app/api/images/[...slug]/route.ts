import { NextRequest, NextResponse } from 'next/server';
import { getSpaceImage } from '@/repositories/space.repository';
import { getSeekerProfilePicture, getProviderProfilePicture } from '@/repositories/user.repository';

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ slug: string[] }> }
) {
    try {
        const { slug } = await params;

        if (!slug || slug.length < 2) {
            return NextResponse.json({ error: 'Invalid image path' }, { status: 400 });
        }

        const [type, ...rest] = slug;

        if (type === 'space') {
            const imageId = parseInt(rest[0], 10);
            if (isNaN(imageId)) return NextResponse.json({ error: 'Invalid image ID' }, { status: 400 });

            const image = await getSpaceImage(imageId);
            if (!image) return NextResponse.json({ error: 'Image not found' }, { status: 404 });

            return new NextResponse(Uint8Array.from(image.data), {
                status: 200,
                headers: {
                    'Content-Type': image.contentType,
                    'Cache-Control': 'public, max-age=86400', // 24 hour cache
                },
            });
        }

        if (type === 'profile') {
            const [userType, idStr] = rest;
            const userId = parseInt(idStr, 10);
            if (isNaN(userId)) return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });

            let image;
            if (userType === 'seeker') {
                image = await getSeekerProfilePicture(userId);
            } else if (userType === 'provider') {
                image = await getProviderProfilePicture(userId);
            }

            if (!image) return NextResponse.json({ error: 'Image not found' }, { status: 404 });

            return new NextResponse(Uint8Array.from(image.data), {
                status: 200,
                headers: {
                    'Content-Type': image.contentType,
                    'Cache-Control': 'public, max-age=3600',
                },
            });
        }

        return NextResponse.json({ error: 'Unknown image type' }, { status: 400 });
    } catch (err) {
        console.error('Image serve error:', err);
        return NextResponse.json({ error: 'Failed to serve image' }, { status: 500 });
    }
}
