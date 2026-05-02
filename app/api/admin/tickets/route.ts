import { NextRequest } from 'next/server';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';
import { query } from '@/lib/db';
import { errorResponse, successResponse } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
    try {
        const token = extractTokenFromHeader(request.headers.get('authorization'));
        if (!token) return errorResponse('Unauthorized', 401);

        const payload = await verifyToken(token);
        if (payload.userType !== 'admin') {
            return errorResponse('Forbidden', 403);
        }

        const tickets = await query(`
            SELECT t.*, 
                   s.FirstName AS SeekerFirstName, s.LastName AS SeekerLastName, s.Email AS SeekerEmail,
                   p.FirstName AS ProviderFirstName, p.LastName AS ProviderLastName, p.Email AS ProviderEmail, p.BusinessName
            FROM SupportTickets t
            LEFT JOIN StorageSeekers s ON s.SeekerID = t.SeekerID
            LEFT JOIN StorageProviders p ON p.ProviderID = t.ProviderID
            ORDER BY CASE WHEN t.Status = 'Open' THEN 1 WHEN t.Status = 'In Progress' THEN 2 ELSE 3 END, t.CreatedAt DESC
        `);

        return successResponse({ tickets });
    } catch (err) {
        console.error('Error fetching tickets:', err);
        return errorResponse('Failed to fetch tickets', 500);
    }
}
