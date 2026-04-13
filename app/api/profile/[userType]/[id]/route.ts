import { NextRequest } from 'next/server';
import { findSeekerById, findProviderById, updateSeeker, updateProvider, updateSeekerProfilePicture, updateProviderProfilePicture } from '@/repositories/user.repository';
import { errorResponse, successResponse } from '@/lib/api-helpers';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ userType: string; id: string }> }
) {
    try {
        const { userType, id } = await params;
        const userId = parseInt(id, 10);

        if (isNaN(userId)) return errorResponse('Invalid user ID', 400);

        if (userType === 'seeker') {
            const seeker = await findSeekerById(userId);
            if (!seeker) return errorResponse('User not found', 404);

            const { Password, ProfilePicture, ...profile } = seeker;
            return successResponse({ 
                profile: {
                    ...profile,
                    hasProfilePicture: !!ProfilePicture
                }
            });
        } else if (userType === 'provider') {
            const provider = await findProviderById(userId);
            if (!provider) return errorResponse('User not found', 404);

            const { Password, BankAccountNumber, IBAN, ProfilePicture, ...profile } = provider;
            return successResponse({ 
                profile: {
                    ...profile,
                    hasProfilePicture: !!ProfilePicture
                }
            });
        }

        return errorResponse('Invalid user type', 400);
    } catch (err) {
        console.error('Get profile error:', err);
        return errorResponse('Failed to load profile', 500);
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ userType: string; id: string }> }
) {
    try {
        const { userType, id } = await params;
        const userId = parseInt(id, 10);

        if (isNaN(userId)) return errorResponse('Invalid user ID', 400);

        const contentType = request.headers.get('content-type') || '';

        if (contentType.includes('multipart/form-data')) {
            // Handle profile picture upload
            const formData = await request.formData();
            const file = formData.get('profilePicture') as File | null;

            if (file) {
                const arrayBuffer = await file.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                const mimeType = file.type || 'image/jpeg';

                if (userType === 'seeker') {
                    await updateSeekerProfilePicture(userId, buffer, mimeType);
                } else {
                    await updateProviderProfilePicture(userId, buffer, mimeType);
                }
            }

            // Also update text fields from formData
            const updates: Record<string, string> = {};
            for (const [key, value] of formData.entries()) {
                if (key !== 'profilePicture') {
                    updates[key] = String(value);
                }
            }

            if (userType === 'seeker') {
                await updateSeeker(userId, updates);
            } else {
                await updateProvider(userId, updates);
            }
        } else {
            const body = await request.json();
            if (userType === 'seeker') {
                await updateSeeker(userId, body);
            } else {
                await updateProvider(userId, body);
            }
        }

        return successResponse({}, 'Profile updated successfully');
    } catch (err) {
        console.error('Update profile error:', err);
        return errorResponse('Failed to update profile', 500);
    }
}
