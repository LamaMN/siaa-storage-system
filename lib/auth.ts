import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { createHash } from 'crypto';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'fallback-secret-change-in-production'
);

const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '7d';

export interface TokenPayload extends JWTPayload {
    id: number;
    email: string;
    userType: 'seeker' | 'provider';
    firstName: string;
}

/**
 * Sign a JWT token for a user
 */
export async function signToken(payload: TokenPayload): Promise<string> {
    const token = await new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(JWT_EXPIRES)
        .sign(JWT_SECRET);

    return token;
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string): Promise<TokenPayload> {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload as TokenPayload;
    } catch {
        throw new Error('Invalid or expired token');
    }
}

/**
 * Hash a password using SHA-256 (matches existing DB hashes)
 */
export async function hashPassword(plain: string): Promise<string> {
    return createHash('sha256').update(plain).digest('hex');
}

/**
 * Compare a plain text password against a SHA-256 hash
 */
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
    const hashed = createHash('sha256').update(plain).digest('hex');
    return hashed === hash;
}

/**
 * Extract bearer token from Authorization header
 */
export function extractTokenFromHeader(authorization: string | null): string | null {
    if (!authorization) return null;
    const [type, token] = authorization.split(' ');
    if (type !== 'Bearer' || !token) return null;
    return token;
}
