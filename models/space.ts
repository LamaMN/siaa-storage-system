export type SpaceStatus = 'Active' | 'Inactive' | 'Pending' | 'Rejected' | 'UnderReview';
export type AccessType = '24/7' | 'BusinessHours' | 'ByAppointment';
export type SpaceType = 'room' | 'garage' | 'warehouse' | 'outdoor' | 'Basement' | string;

// ============================================================
// StorageSpace
// ============================================================

export interface StorageSpace {
    SpaceID: number;
    ProviderID: number;
    Title: string;
    Description?: string;
    SpaceType?: SpaceType;
    Size: number;
    Height?: number;
    Width?: number;
    Length?: number;
    PricePerMonth: number;
    PricePerWeek?: number;
    PricePerDay?: number;
    MinRentalPeriod: number;
    MaxRentalPeriod?: number;
    FloorNumber?: number;
    IsAvailable: boolean;
    FavoriteCount: number;
    Status: SpaceStatus;
    CreatedAt: Date;
    UpdatedAt: Date;
}

export interface SpaceFeatures {
    FeatureID: number;
    SpaceID: number;
    Temperature?: number;
    Humidity?: number;
    ClimateControlled: boolean;
    SecuritySystem: boolean;
    CCTVMonitored: boolean;
    AccessType?: AccessType;
    ParkingAvailable: boolean;
    LoadingAssistance: boolean;
    Restrictions?: string;
}

export interface SpaceLocation {
    LocationID: number;
    SpaceID: number;
    LocationType?: string;
    AddressLine1: string;
    AddressLine2?: string;
    BuildingNumber?: string;
    FloorNumber?: number;
    City: string;
    Region?: string;
    PostalCode?: string;
    Country: string;
    Latitude?: number;
    Longitude?: number;
    Landmark?: string;
}

export interface SpaceImage {
    ImageID: number;
    SpaceID: number;
    ContentType?: string;
    ImageOrder: number;
    Caption?: string;
    UploadedAt: Date;
}

// ============================================================
// Rich space object returned by search/detail queries
// ============================================================

export interface SpaceWithDetails extends StorageSpace {
    // Location fields
    AddressLine1?: string;
    AddressLine2?: string;
    City?: string;
    Region?: string;
    PostalCode?: string;
    Country?: string;
    Latitude?: number;
    Longitude?: number;
    Landmark?: string;
    // Provider info
    ProviderFirstName?: string;
    ProviderLastName?: string;
    ProviderEmail?: string;
    ProviderPhone?: string;
    BusinessName?: string;
    // Features
    ClimateControlled?: boolean;
    SecuritySystem?: boolean;
    CCTVMonitored?: boolean;
    ParkingAvailable?: boolean;
    LoadingAssistance?: boolean;
    AccessType?: string;
    Restrictions?: string;
    // Stats
    AvgRating?: number;
    TotalReviews?: number;
    ActiveBookings?: number;
    TotalBookings?: number;
    // AI match score (computed in app layer)
    MatchScore?: number;
    // First image ID for thumbnail
    FirstImageID?: number;
}

// ============================================================
// Inputs
// ============================================================

export interface CreateSpaceInput {
    title: string;
    description?: string;
    spaceType?: SpaceType;
    size: number;
    height?: number;
    width?: number;
    length?: number;
    pricePerMonth: number;
    pricePerWeek?: number;
    pricePerDay?: number;
    minRentalPeriod?: number;
    maxRentalPeriod?: number;
    floorNumber?: number;
    // Features
    climateControlled?: boolean;
    securitySystem?: boolean;
    cctvMonitored?: boolean;
    accessType?: AccessType;
    parkingAvailable?: boolean;
    loadingAssistance?: boolean;
    restrictions?: string;
    // Location
    addressLine1: string;
    addressLine2?: string;
    buildingNumber?: string;
    city: string;
    region?: string;
    postalCode?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    landmark?: string;
    status?: string | SpaceStatus;
}

export interface UpdateSpaceInput extends Partial<CreateSpaceInput> {
    isAvailable?: boolean;
    status?: SpaceStatus;
}

// ============================================================
// Search filters
// ============================================================

export interface SpaceSearchFilters {
    city?: string;
    spaceType?: string;
    minSize?: number;
    maxSize?: number;
    maxPrice?: number;
    minPrice?: number;
    climateControlled?: boolean;
    securitySystem?: boolean;
    cctvMonitored?: boolean;
    parkingAvailable?: boolean;
    loadingAssistance?: boolean;
    rentalDuration?: 'daily' | 'weekly' | 'monthly';
    startDate?: string;
    sortBy?: 'match' | 'priceLow' | 'priceHigh' | 'rating' | 'newest';
    page?: number;
    limit?: number;
}
