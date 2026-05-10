import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import bcrypt from 'bcryptjs';
import { createHash } from 'crypto';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'fallback-secret-change-in-production'
);

const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '7d';

const BCRYPT_ROUNDS = 10;

export interface TokenPayload extends JWTPayload {
    id: number;
    email: string;
    userType: 'seeker' | 'provider' | 'admin';
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
 * Hash a password using bcrypt
 */
export async function hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

/**
 * Verify a plain text password against a stored hash.
 * Supports both bcrypt ($2a$/$2b$ prefix) and legacy SHA-256 hashes.
 * Returns { valid, needsRehash } so callers can upgrade old hashes.
 */
export async function verifyPassword(
    plain: string,
    storedHash: string
): Promise<boolean> {
    // Detect bcrypt hash (starts with $2a$ or $2b$)
    if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$')) {
        return bcrypt.compare(plain, storedHash);
    }

    // Legacy SHA-256 fallback — compare hex digests
    const sha256Hash = createHash('sha256').update(plain).digest('hex');
    return sha256Hash === storedHash;
}

/**
 * Check if a stored hash is using the legacy SHA-256 format
 * and should be upgraded to bcrypt.
 */
export function needsRehash(storedHash: string): boolean {
    return !storedHash.startsWith('$2a$') && !storedHash.startsWith('$2b$');
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
