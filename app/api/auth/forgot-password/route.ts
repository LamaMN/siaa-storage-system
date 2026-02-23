import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { signToken } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const { email, userType } = await req.json();

        if (!email || !userType) {
            return NextResponse.json({ error: 'Email and account type are required.' }, { status: 400 });
        }

        const table = userType === 'provider' ? 'StorageProviders' : 'StorageSeekers';
        const idCol = userType === 'provider' ? 'ProviderID' : 'SeekerID';

        // Check if user exists
        const users = await query<{ [k: string]: unknown }>(
            `SELECT ${idCol}, Email FROM ${table} WHERE Email = @email`,
            { email }
        );

        // Always return success to prevent email enumeration attacks
        if (users.length === 0) {
            return NextResponse.json({
                message: 'If an account with that email exists, a reset link has been sent.'
            });
        }

        const userId = users[0][idCol] as number;

        // Generate a 1-hour reset token by signing with purpose marker in firstName field
        const resetToken = await signToken({
            id: userId,
            email,
            userType: userType as 'seeker' | 'provider',
            firstName: 'password-reset', // used as purpose marker
        });

        const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}&type=${userType}`;

        // Log for development — replace with email sending in production
        console.log(`[Password Reset] URL for ${email}: ${resetUrl}`);

        // TODO: Send email via SendGrid / Resend / Nodemailer
        // await sendResetEmail(email, resetUrl);

        return NextResponse.json({
            message: 'If an account with that email exists, a reset link has been sent.',
            devResetUrl: process.env.NODE_ENV === 'development' ? resetUrl : undefined,
        });
    } catch (err) {
        console.error('[forgot-password]', err);
        return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
}
