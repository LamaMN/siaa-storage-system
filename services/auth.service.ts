import { z } from 'zod';
import {
    findSeekerByEmail, createSeeker,
    findProviderByEmail, createProvider,
    findSeekerById, findProviderById,
    updateSeekerLastLogin, updateProviderLastLogin,
} from '@/repositories/user.repository';
import { signToken, verifyPassword } from '@/lib/auth';
import type { TokenPayload } from '@/lib/auth';

// ============================================================
// ZOD SCHEMAS
// ============================================================

export const registerSeekerSchema = z.object({
    email: z.string().email('Valid email required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    phoneNumber: z.string().min(9).max(20),
    dateOfBirth: z.string().refine((d) => {
        if (isNaN(Date.parse(d))) return false;
        const dob = new Date(d);
        const today = new Date();
        const age = today.getFullYear() - dob.getFullYear() -
            (today < new Date(today.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0);
        return age >= 18;
    }, 'You must be at least 18 years old to register'),
    gender: z.enum(['Male', 'Female', 'Other']).optional(),
    nationalId: z.string().regex(/^[12]\d{9}$/, 'National ID must be 10 digits starting with 1 or 2').optional().or(z.literal('')),
    preferredLanguage: z.enum(['ar', 'en']).optional(),
});

export const registerProviderSchema = z.object({
    email: z.string().email('Valid email required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    phoneNumber: z.string().min(9).max(20),
    dateOfBirth: z.string().refine((d) => {
        if (isNaN(Date.parse(d))) return false;
        const dob = new Date(d);
        const today = new Date();
        const age = today.getFullYear() - dob.getFullYear() -
            (today < new Date(today.getFullYear(), dob.getMonth(), dob.getDate()) ? 1 : 0);
        return age >= 18;
    }, 'You must be at least 18 years old to register'),
    gender: z.enum(['Male', 'Female', 'Other']).optional(),
    nationalId: z.string().regex(/^[12]\d{9}$/, 'National ID must be 10 digits starting with 1 or 2').optional().or(z.literal('')),
    businessName: z.string().max(255).optional(),
    preferredLanguage: z.enum(['ar', 'en']).optional(),
});

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

// ============================================================
// SERVICE METHODS
// ============================================================

export async function registerSeeker(
    data: z.infer<typeof registerSeekerSchema>
): Promise<{ token: string; user: object }> {
    // Check duplicate email
    const existing = await findSeekerByEmail(data.email);
    if (existing) {
        throw new Error('An account with this email already exists');
    }

    const seekerId = await createSeeker(data);
    const seeker = await findSeekerById(seekerId);

    if (!seeker) throw new Error('Registration failed');

    const payload: TokenPayload = {
        id: seekerId,
        email: seeker.Email,
        userType: 'seeker',
        firstName: seeker.FirstName,
    };

    const token = await signToken(payload);

    return {
        token,
        user: {
            id: seekerId,
            email: seeker.Email,
            firstName: seeker.FirstName,
            lastName: seeker.LastName,
            userType: 'seeker',
        },
    };
}

export async function registerProvider(
    data: z.infer<typeof registerProviderSchema>
): Promise<{ token: string; user: object }> {
    const existing = await findProviderByEmail(data.email);
    if (existing) {
        throw new Error('An account with this email already exists');
    }

    const providerId = await createProvider(data);
    const provider = await findProviderById(providerId);

    if (!provider) throw new Error('Registration failed');

    const payload: TokenPayload = {
        id: providerId,
        email: provider.Email,
        userType: 'provider',
        firstName: provider.FirstName,
    };

    const token = await signToken(payload);

    return {
        token,
        user: {
            id: providerId,
            email: provider.Email,
            firstName: provider.FirstName,
            lastName: provider.LastName,
            userType: 'provider',
        },
    };
}

export async function login(
    data: z.infer<typeof loginSchema>
): Promise<{ token: string; user: object; isFirstLogin: boolean }> {

    // 1. Try auth as Seeker
    const seeker = await findSeekerByEmail(data.email);
    if (seeker) {
        const valid = await verifyPassword(data.password, seeker.Password);
        if (valid) {
            if (seeker.AccountStatus !== 'Active') {
                throw new Error(`Account is ${seeker.AccountStatus.toLowerCase()}. Please contact support.`);
            }

            await updateSeekerLastLogin(seeker.SeekerID);

            const isFirstLogin = !seeker.UpdatedAt ||
                Math.abs(new Date(seeker.CreatedAt).getTime() - new Date(seeker.UpdatedAt).getTime()) < 5000;

            const payload: TokenPayload = {
                id: seeker.SeekerID,
                email: seeker.Email,
                userType: 'seeker',
                firstName: seeker.FirstName,
            };

            const token = await signToken(payload);

            return {
                token,
                user: {
                    id: seeker.SeekerID,
                    email: seeker.Email,
                    firstName: seeker.FirstName,
                    lastName: seeker.LastName,
                    userType: 'seeker',
                    accountStatus: seeker.AccountStatus,
                },
                isFirstLogin,
            };
        }
    }

    // 2. Try auth as Provider
    const provider = await findProviderByEmail(data.email);
    if (provider) {
        const valid = await verifyPassword(data.password, provider.Password);
        if (valid) {
            if (provider.AccountStatus !== 'Active') {
                throw new Error(`Account is ${provider.AccountStatus.toLowerCase()}. Please contact support.`);
            }

            await updateProviderLastLogin(provider.ProviderID);
            const isFirstLogin = !provider.LastLoginDate;

            const payload: TokenPayload = {
                id: provider.ProviderID,
                email: provider.Email,
                userType: 'provider',
                firstName: provider.FirstName,
            };

            const token = await signToken(payload);

            return {
                token,
                user: {
                    id: provider.ProviderID,
                    email: provider.Email,
                    firstName: provider.FirstName,
                    lastName: provider.LastName,
                    businessName: provider.BusinessName,
                    userType: 'provider',
                    accountStatus: provider.AccountStatus,
                },
                isFirstLogin,
            };
        }
    }

    // If neither matched or password failed for both
    throw new Error('Invalid email or password');
}
