import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken, hashPassword } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const { token, userType, newPassword } = await req.json();

        if (!token || !userType || !newPassword) {
            return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
        }

        if (newPassword.length < 8) {
            return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
        }

        // Verify the reset token
        let payload;
        try {
            payload = await verifyToken(token);
        } catch {
            return NextResponse.json(
                { error: 'Reset link has expired or is invalid. Please request a new one.' },
                { status: 400 }
            );
        }

        // Check the purpose marker (stored in firstName field)
        if (payload.firstName !== 'password-reset') {
            return NextResponse.json({ error: 'Invalid reset token.' }, { status: 400 });
        }

        if (payload.userType !== userType) {
            return NextResponse.json(
                { error: 'Account type mismatch. Please use the correct account type.' },
                { status: 400 }
            );
        }

        const table = userType === 'provider' ? 'StorageProviders' : 'StorageSeekers';
        const idCol = userType === 'provider' ? 'ProviderID' : 'SeekerID';

        // Hash the new password
        const hashedPassword = await hashPassword(newPassword);

        // Update the password in the database
        await query(
            `UPDATE ${table} SET Password = @password WHERE ${idCol} = @userId`,
            { password: hashedPassword, userId: payload.id }
        );

        return NextResponse.json({ message: 'Password updated successfully.' });
    } catch (err) {
        console.error('[reset-password]', err);
        return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
}
