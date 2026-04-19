import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';

// Paths that REQUIRE authentication
const PROTECTED_PATHS = [
    '/dashboard',
    '/list-space',
    '/admin',
];

// API paths that require authentication
const PROTECTED_API_PREFIXES = [
    '/api/profile',
    '/api/bookings',
    '/api/seeker',
    '/api/provider',
    '/api/admin',
];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check if it's a protected page
    const isProtectedPage = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
    // Check if it's a protected API route
    const isProtectedApi = PROTECTED_API_PREFIXES.some((p) => pathname.startsWith(p));

    if (!isProtectedPage && !isProtectedApi) {
        return NextResponse.next();
    }

    // Get token from Authorization header (API) or cookie (pages)
    const authHeader = request.headers.get('authorization');
    const cookieToken = request.cookies.get('siaa-token')?.value;
    const token = extractTokenFromHeader(authHeader) || cookieToken;

    if (!token) {
        if (isProtectedApi) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        // Redirect page to login
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    try {
        const payload = await verifyToken(token);

        // Provider-only routes
        if (pathname.startsWith('/list-space') && payload.userType !== 'provider') {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }

        // Admin-only routes
        if (pathname.startsWith('/admin') && payload.userType !== 'admin') {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
        if (pathname.startsWith('/api/admin') && payload.userType !== 'admin') {
            return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
        }

        // Inject user info into headers for downstream API routes
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-user-id', String(payload.id));
        requestHeaders.set('x-user-type', payload.userType);
        requestHeaders.set('x-user-email', payload.email);

        return NextResponse.next({
            request: { headers: requestHeaders },
        });
    } catch {
        if (isProtectedApi) {
            return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 401 });
        }
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/list-space/:path*',
        '/admin/:path*',
        '/api/profile/:path*',
        '/api/bookings/:path*',
        '/api/seeker/:path*',
        '/api/provider/:path*',
        '/api/admin/:path*',
    ],
};
