import { NextResponse } from 'next/server';
import { execute } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { seekerId, providerId, category, subject, description } = body;

        // Validation
        if (!category || !subject || !description) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Note: In a production app, we would verify the JWT token here.
        // For now, we trust the client as requested.
        const isUserLoggedIn = !!seekerId || !!providerId || body.userType === 'admin';
        
        if (!isUserLoggedIn) {
            return NextResponse.json({ error: 'You must be logged in to submit a ticket' }, { status: 401 });
        }

        // Insert ticket into SupportTickets
        await execute(`
            INSERT INTO SupportTickets (ProviderID, SeekerID, Category, Subject, Description, Status, Priority, CreatedAt, UpdatedAt)
            VALUES (@providerId, @seekerId, @category, @subject, @description, 'Open', 'Medium', GETDATE(), GETDATE())
        `, {
            providerId: providerId || null,
            seekerId: seekerId || null,
            category,
            subject,
            description
        });

        return NextResponse.json({ success: true, message: 'Ticket created successfully' }, { status: 201 });
    } catch (error) {
        console.error('Error creating support ticket:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
