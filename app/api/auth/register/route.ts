import { NextRequest } from 'next/server';
import { registerSeekerSchema, registerProviderSchema, registerSeeker, registerProvider } from '@/services/auth.service';
import { errorResponse, successResponse } from '@/lib/api-helpers';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userType, ...data } = body;

        if (!userType || !['seeker', 'provider'].includes(userType)) {
            return errorResponse('userType must be "seeker" or "provider"', 400);
        }

        if (userType === 'seeker') {
            const parsed = registerSeekerSchema.safeParse(data);
            if (!parsed.success) {
                return errorResponse(parsed.error.errors[0].message, 422);
            }
            const result = await registerSeeker(parsed.data);
            return successResponse(result, 'Registration successful', 201);
        } else {
            const parsed = registerProviderSchema.safeParse(data);
            if (!parsed.success) {
                return errorResponse(parsed.error.errors[0].message, 422);
            }
            const result = await registerProvider(parsed.data);
            return successResponse(result, 'Registration successful', 201);
        }
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Registration failed';
        if (message.includes('already exists')) return errorResponse(message, 409);
        console.error('Register error:', err);
        return errorResponse(message, 500);
    }
}
