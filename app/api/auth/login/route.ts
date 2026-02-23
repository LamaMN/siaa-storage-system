import { NextRequest, NextResponse } from 'next/server';
import { loginSchema, login } from '@/services/auth.service';
import { errorResponse, successResponse } from '@/lib/api-helpers';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const parsed = loginSchema.safeParse(body);

        if (!parsed.success) {
            return errorResponse(parsed.error.errors[0].message, 422);
        }

        const result = await login(parsed.data);

        // Set HTTP-only cookie for page-level auth, plus return token in body for JS clients
        const response = successResponse(result, 'Login successful');
        response.cookies.set('siaa-token', result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
        });

        return response;
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Login failed';
        if (message.includes('Invalid email')) return errorResponse(message, 401);
        if (message.includes('suspended') || message.includes('deactivated')) {
            return errorResponse(message, 403);
        }
        console.error('Login error:', err);
        return errorResponse('Login failed', 500);
    }
}
