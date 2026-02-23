export type BookingStatus =
    | 'Pending'
    | 'Confirmed'
    | 'Active'
    | 'Completed'
    | 'Cancelled'
    | 'Rejected'
    | 'Expired';

export interface Booking {
    BookingID: number;
    SpaceID: number;
    SeekerID: number;
    StartDate: Date;
    EndDate: Date;
    RentalDurationMonths?: number;
    TotalAmount: number;
    PlatformFee?: number;
    BookingStatus: BookingStatus;
    ConfirmedAt?: Date;
    CompletedAt?: Date;
    SpecialRequests?: string;
    CreatedAt: Date;
    UpdatedAt: Date;
}

// Rich booking from JOIN with space + provider
export interface BookingWithDetails extends Booking {
    SpaceTitle?: string;
    SpaceType?: string;
    Size?: number;
    PricePerMonth?: number;
    City?: string;
    AddressLine1?: string;
    ProviderID?: number;
    ProviderName?: string;
    ProviderEmail?: string;
    ProviderPhone?: string;
    HasReview?: boolean;
}

export interface CreateBookingInput {
    spaceId: number;
    seekerId: number;
    startDate: string;
    endDate: string;
    specialRequests?: string;
    logisticsOption?: 'self_dropoff' | 'partner_pickup';
}

export interface Review {
    ReviewID: number;
    BookingID: number;
    ReviewerSeekerID?: number;
    Rating: number;
    Comment?: string;
    ProviderResponse?: string;
    ProviderResponseDate?: Date;
    HelpfulCount: number;
    CreatedAt: Date;
    UpdatedAt: Date;
}

export interface ReviewWithDetails extends Review {
    SpaceTitle?: string;
    SpaceType?: string;
    SeekerFirstName?: string;
    SeekerLastName?: string;
    StartDate?: Date;
    EndDate?: Date;
}

export interface CreateReviewInput {
    rating: number;
    comment?: string;
    seekerId: number;
}

// ============================================================
// Dashboard statistics
// ============================================================

export interface SeekerStatistics {
    TotalBookings: number;
    ActiveBookings: number;
    PendingBookings: number;
    CompletedBookings: number;
    CancelledBookings: number;
    TotalSpent: number;
}

export interface ProviderStatistics {
    TotalSpaces: number;
    ActiveSpaces: number;
    PendingSpaces: number;
    TotalBookings: number;
    ActiveBookings: number;
    PendingBookingRequests: number;
    TotalRevenue: number;
}
