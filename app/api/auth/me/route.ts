import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';
import { findSeekerById, findProviderById } from '@/repositories/user.repository';
import { errorResponse, successResponse } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        const cookieToken = request.cookies.get('siaa-token')?.value;
        const token = extractTokenFromHeader(authHeader) || cookieToken;

        if (!token) return errorResponse('No token provided', 401);

        const payload = await verifyToken(token);

        let user;
        if (payload.userType === 'seeker') {
            const seeker = await findSeekerById(payload.id);
            if (!seeker) return errorResponse('User not found', 404);
            user = {
                id: seeker.SeekerID,
                email: seeker.Email,
                firstName: seeker.FirstName,
                lastName: seeker.LastName,
                userType: 'seeker',
                accountStatus: seeker.AccountStatus,
                isVerified: seeker.IsVerified,
            };
        } else {
            const provider = await findProviderById(payload.id);
            if (!provider) return errorResponse('User not found', 404);
            user = {
                id: provider.ProviderID,
                email: provider.Email,
                firstName: provider.FirstName,
                lastName: provider.LastName,
                businessName: provider.BusinessName,
                userType: 'provider',
                accountStatus: provider.AccountStatus,
                isVerified: provider.IsVerified,
            };
        }

        return successResponse({ user });
    } catch {
        return errorResponse('Invalid token', 401);
    }
}

export async function POST(request: NextRequest) {
    // Logout — clear cookie
    const response = NextResponse.json({ success: true, message: 'Logged out' });
    response.cookies.delete('siaa-token');
    return response;
}
