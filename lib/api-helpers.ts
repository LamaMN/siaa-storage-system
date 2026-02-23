import { NextResponse } from 'next/server';

export type ApiSuccessResponse<T = unknown> = {
    success: true;
    data?: T;
    message?: string;
};

export type ApiErrorResponse = {
    success: false;
    error: string;
    code?: number;
};

/**
 * Send a successful JSON response
 */
export function successResponse<T>(
    data: T,
    message?: string,
    status = 200
): NextResponse {
    return NextResponse.json(
        { success: true, ...data, message } as object,
        { status }
    );
}

/**
 * Send an error JSON response
 */
export function errorResponse(
    error: string,
    status = 400
): NextResponse {
    return NextResponse.json(
        { success: false, error } satisfies ApiErrorResponse,
        { status }
    );
}

/**
 * Parse pagination query params
 */
export function parsePagination(searchParams: URLSearchParams) {
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12', 10)));
    const skip = (page - 1) * limit;
    return { page, limit, skip };
}

/**
 * Sanitize a string for safe SQL LIKE patterns
 */
export function sanitizeLikeParam(value: string): string {
    return value.replace(/[%_[\]]/g, (char) => `[${char}]`);
}
