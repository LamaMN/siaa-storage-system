import { query, queryOne, execute } from '@/lib/db';
import type {
    Booking,
    BookingWithDetails,
    CreateBookingInput,
    BookingStatus,
    Review,
    ReviewWithDetails,
    CreateReviewInput,
    SeekerStatistics,
    ProviderStatistics,
} from '@/models/booking';

// ============================================================
// BOOKING REPOSITORY
// ============================================================

export async function findBookingById(id: number): Promise<BookingWithDetails | null> {
    return queryOne<BookingWithDetails>(
        `SELECT
      b.*,
      s.Title AS SpaceTitle, s.SpaceType, s.Size, s.PricePerMonth,
      l.City, l.AddressLine1,
      p.ProviderID, CONCAT(p.FirstName, ' ', p.LastName) AS ProviderName,
      p.Email AS ProviderEmail, p.PhoneNumber AS ProviderPhone,
      CASE WHEN r.ReviewID IS NOT NULL THEN 1 ELSE 0 END AS HasReview
    FROM Bookings b
    JOIN StorageSpaces s ON s.SpaceID = b.SpaceID
    LEFT JOIN Locations l ON l.SpaceID = b.SpaceID
    JOIN StorageProviders p ON p.ProviderID = s.ProviderID
    LEFT JOIN Reviews r ON r.BookingID = b.BookingID
    WHERE b.BookingID = @id`,
        { id }
    );
}

export async function findBookingsBySeeker(seekerId: number): Promise<BookingWithDetails[]> {
    return query<BookingWithDetails>(
        `SELECT
      b.*,
      s.Title AS SpaceTitle, s.SpaceType, s.Size, s.PricePerMonth,
      l.City, l.AddressLine1,
      s.ProviderID,
      CONCAT(p.FirstName, ' ', p.LastName) AS ProviderName,
      p.Email AS ProviderEmail, p.PhoneNumber AS ProviderPhone,
      CASE WHEN r.ReviewID IS NOT NULL THEN 1 ELSE 0 END AS HasReview
    FROM Bookings b
    JOIN StorageSpaces s ON s.SpaceID = b.SpaceID
    LEFT JOIN Locations l ON l.SpaceID = b.SpaceID
    JOIN StorageProviders p ON p.ProviderID = s.ProviderID
    LEFT JOIN Reviews r ON r.BookingID = b.BookingID
    WHERE b.SeekerID = @seekerId
    ORDER BY b.CreatedAt DESC`,
        { seekerId }
    );
}

export async function findBookingsByProvider(providerId: number): Promise<BookingWithDetails[]> {
    return query<BookingWithDetails>(
        `SELECT
      b.*,
      s.Title AS SpaceTitle, s.SpaceType, s.Size, s.PricePerMonth,
      l.City, l.AddressLine1,
      CONCAT(sk.FirstName, ' ', sk.LastName) AS SeekerName,
      sk.Email AS SeekerEmail, sk.PhoneNumber AS SeekerPhone
    FROM Bookings b
    JOIN StorageSpaces s ON s.SpaceID = b.SpaceID
    LEFT JOIN Locations l ON l.SpaceID = b.SpaceID
    JOIN StorageSeekers sk ON sk.SeekerID = b.SeekerID
    WHERE s.ProviderID = @providerId
    ORDER BY b.CreatedAt DESC`,
        { providerId }
    );
}

export async function createBooking(input: CreateBookingInput, totalAmount: number, platformFee: number): Promise<number> {
    const result = await execute(
        `INSERT INTO Bookings (
      SpaceID, SeekerID, StartDate, EndDate,
      TotalAmount, PlatformFee, BookingStatus, SpecialRequests
    )
    OUTPUT INSERTED.BookingID
    VALUES (
      @spaceId, @seekerId, @startDate, @endDate,
      @totalAmount, @platformFee, 'Pending', @specialRequests
    )`,
        {
            spaceId: input.spaceId,
            seekerId: input.seekerId,
            startDate: input.startDate,
            endDate: input.endDate,
            totalAmount,
            platformFee,
            specialRequests: input.specialRequests || null,
        }
    );
    const rows = result.recordset as Array<{ BookingID: number }>;
    return rows[0].BookingID;
}

export async function updateBookingStatus(
    bookingId: number,
    status: BookingStatus
): Promise<void> {
    const now = new Date().toISOString();
    let sql = `UPDATE Bookings SET BookingStatus = @status, UpdatedAt = GETDATE()`;

    if (status === 'Confirmed') {
        sql += `, ConfirmedAt = @now`;
    } else if (status === 'Completed') {
        sql += `, CompletedAt = @now`;
    }

    sql += ` WHERE BookingID = @bookingId`;

    await execute(sql, { status, bookingId, now });
}

export async function cancelBooking(bookingId: number, seekerId: number): Promise<boolean> {
    const result = await execute(
        `UPDATE Bookings SET BookingStatus = 'Cancelled', UpdatedAt = GETDATE()
     WHERE BookingID = @bookingId AND SeekerID = @seekerId AND BookingStatus = 'Pending'`,
        { bookingId, seekerId }
    );
    return (result.rowsAffected[0] || 0) > 0;
}

// ============================================================
// REVIEW REPOSITORY
// ============================================================

export async function findReviewByBooking(bookingId: number): Promise<Review | null> {
    return queryOne<Review>(
        `SELECT * FROM Reviews WHERE BookingID = @bookingId`,
        { bookingId }
    );
}

export async function findReviewsBySeeker(seekerId: number): Promise<ReviewWithDetails[]> {
    return query<ReviewWithDetails>(
        `SELECT r.*,
      s.Title AS SpaceTitle, s.SpaceType,
      b.StartDate, b.EndDate
    FROM Reviews r
    JOIN Bookings b ON b.BookingID = r.BookingID
    JOIN StorageSpaces s ON s.SpaceID = b.SpaceID
    WHERE r.ReviewerSeekerID = @seekerId
    ORDER BY r.CreatedAt DESC`,
        { seekerId }
    );
}

export async function findReviewsBySpace(spaceId: number): Promise<ReviewWithDetails[]> {
    return query<ReviewWithDetails>(
        `SELECT r.*,
      sk.FirstName AS SeekerFirstName, sk.LastName AS SeekerLastName,
      CASE WHEN sk.ProfilePicture IS NOT NULL AND DATALENGTH(sk.ProfilePicture) > 0 THEN 1 ELSE 0 END AS HasProfilePicture,
      b.StartDate, b.EndDate
    FROM Reviews r
    JOIN Bookings b ON b.BookingID = r.BookingID
    JOIN StorageSeekers sk ON sk.SeekerID = r.ReviewerSeekerID
    WHERE b.SpaceID = @spaceId
    ORDER BY r.CreatedAt DESC`,
        { spaceId }
    );
}

export async function createReview(
    bookingId: number,
    input: CreateReviewInput
): Promise<number> {
    const result = await execute(
        `INSERT INTO Reviews (BookingID, ReviewerSeekerID, Rating, Comment)
     OUTPUT INSERTED.ReviewID
     VALUES (@bookingId, @seekerId, @rating, @comment)`,
        {
            bookingId,
            seekerId: input.seekerId,
            rating: input.rating,
            comment: input.comment || null,
        }
    );
    const rows = result.recordset as Array<{ ReviewID: number }>;
    return rows[0].ReviewID;
}

// ============================================================
// STATISTICS
// ============================================================

export async function getSeekerStatistics(seekerId: number): Promise<SeekerStatistics> {
    const row = await queryOne<SeekerStatistics>(
        `SELECT
      COUNT(*) AS TotalBookings,
      SUM(CASE WHEN BookingStatus = 'Active' THEN 1 ELSE 0 END) AS ActiveBookings,
      SUM(CASE WHEN BookingStatus = 'Pending' THEN 1 ELSE 0 END) AS PendingBookings,
      SUM(CASE WHEN BookingStatus = 'Completed' THEN 1 ELSE 0 END) AS CompletedBookings,
      SUM(CASE WHEN BookingStatus = 'Cancelled' THEN 1 ELSE 0 END) AS CancelledBookings,
      ISNULL(SUM(CASE WHEN BookingStatus IN ('Active','Completed') THEN TotalAmount ELSE 0 END), 0) AS TotalSpent
    FROM Bookings
    WHERE SeekerID = @seekerId`,
        { seekerId }
    );

    return row || {
        TotalBookings: 0,
        ActiveBookings: 0,
        PendingBookings: 0,
        CompletedBookings: 0,
        CancelledBookings: 0,
        TotalSpent: 0,
    };
}

export async function getProviderStatistics(providerId: number): Promise<ProviderStatistics> {
    const row = await queryOne<ProviderStatistics>(
        `SELECT
      COUNT(DISTINCT s.SpaceID) AS TotalSpaces,
      SUM(CASE WHEN s.Status = 'Active' THEN 1 ELSE 0 END) AS ActiveSpaces,
      SUM(CASE WHEN s.Status = 'Pending' THEN 1 ELSE 0 END) AS PendingSpaces,
      ISNULL(bk.TotalBookings, 0) AS TotalBookings,
      ISNULL(bk.ActiveBookings, 0) AS ActiveBookings,
      ISNULL(bk.PendingBookingRequests, 0) AS PendingBookingRequests,
      ISNULL(bk.TotalRevenue, 0) AS TotalRevenue
    FROM StorageSpaces s
    LEFT JOIN (
      SELECT
        ss.ProviderID,
        COUNT(*) AS TotalBookings,
        SUM(CASE WHEN b.BookingStatus = 'Active' THEN 1 ELSE 0 END) AS ActiveBookings,
        SUM(CASE WHEN b.BookingStatus = 'Pending' THEN 1 ELSE 0 END) AS PendingBookingRequests,
        ISNULL(SUM(CASE WHEN b.BookingStatus IN ('Active','Completed') THEN b.TotalAmount ELSE 0 END), 0) AS TotalRevenue
      FROM Bookings b
      JOIN StorageSpaces ss ON ss.SpaceID = b.SpaceID
      WHERE ss.ProviderID = @providerId
      GROUP BY ss.ProviderID
    ) bk ON bk.ProviderID = s.ProviderID
    WHERE s.ProviderID = @providerId
    GROUP BY bk.TotalBookings, bk.ActiveBookings, bk.PendingBookingRequests, bk.TotalRevenue`,
        { providerId }
    );

    return row || {
        TotalSpaces: 0,
        ActiveSpaces: 0,
        PendingSpaces: 0,
        TotalBookings: 0,
        ActiveBookings: 0,
        PendingBookingRequests: 0,
        TotalRevenue: 0,
    };
}
