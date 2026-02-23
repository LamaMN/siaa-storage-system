import { query, queryOne, execute } from '@/lib/db';
import type {
    StorageSpace,
    SpaceWithDetails,
    CreateSpaceInput,
    UpdateSpaceInput,
    SpaceSearchFilters,
    SpaceImage,
} from '@/models/space';
import { sanitizeLikeParam } from '@/lib/api-helpers';

// ============================================================
// SPACE REPOSITORY
// ============================================================

export async function findSpaceById(id: number): Promise<SpaceWithDetails | null> {
    return queryOne<SpaceWithDetails>(
        `SELECT
      s.*,
      l.AddressLine1, l.AddressLine2, l.City, l.Region, l.PostalCode,
      l.Country, l.Latitude, l.Longitude, l.Landmark,
      p.FirstName AS ProviderFirstName, p.LastName AS ProviderLastName,
      p.Email AS ProviderEmail, p.PhoneNumber AS ProviderPhone,
      p.BusinessName,
      sf.ClimateControlled, sf.SecuritySystem, sf.CCTVMonitored,
      sf.ParkingAvailable, sf.LoadingAssistance, sf.AccessType, sf.Restrictions,
      ISNULL(rv.AvgRating, 0) AS AvgRating,
      ISNULL(rv.TotalReviews, 0) AS TotalReviews,
      ISNULL(bk.ActiveBookings, 0) AS ActiveBookings,
      ISNULL(bk.TotalBookings, 0) AS TotalBookings,
      img.FirstImageID
    FROM StorageSpaces s
    LEFT JOIN Locations l ON l.SpaceID = s.SpaceID
    LEFT JOIN StorageProviders p ON p.ProviderID = s.ProviderID
    LEFT JOIN SpaceFeatures sf ON sf.SpaceID = s.SpaceID
    LEFT JOIN (
      SELECT SpaceID,
        AVG(CAST(r.Rating AS FLOAT)) AS AvgRating,
        COUNT(*) AS TotalReviews
      FROM Reviews r
      JOIN Bookings b ON b.BookingID = r.BookingID
      GROUP BY b.SpaceID
    ) rv ON rv.SpaceID = s.SpaceID
    LEFT JOIN (
      SELECT SpaceID,
        SUM(CASE WHEN BookingStatus = 'Active' THEN 1 ELSE 0 END) AS ActiveBookings,
        COUNT(*) AS TotalBookings
      FROM Bookings
      GROUP BY SpaceID
    ) bk ON bk.SpaceID = s.SpaceID
    LEFT JOIN (
      SELECT SpaceID, MIN(ImageID) AS FirstImageID FROM SpaceImages GROUP BY SpaceID
    ) img ON img.SpaceID = s.SpaceID
    WHERE s.SpaceID = @id`,
        { id }
    );
}

export async function searchSpaces(filters: SpaceSearchFilters): Promise<SpaceWithDetails[]> {
    const limit = Math.min(filters.limit || 12, 50);
    const page = Math.max(filters.page || 1, 1);
    const skip = (page - 1) * limit;

    const citySearch = filters.city ? `%${sanitizeLikeParam(filters.city)}%` : null;
    const typeSearch = filters.spaceType || null;

    const rows = await query<SpaceWithDetails & { MatchScore: number }>(
        `SELECT
      s.SpaceID, s.ProviderID, s.Title, s.Description, s.SpaceType, s.Size,
      s.PricePerMonth, s.PricePerWeek, s.PricePerDay, s.IsAvailable, s.Status,
      s.FavoriteCount, s.MinRentalPeriod, s.CreatedAt, s.UpdatedAt,
      l.AddressLine1, l.City, l.Region, l.Latitude, l.Longitude, l.Landmark,
      p.FirstName AS ProviderFirstName, p.LastName AS ProviderLastName,
      p.BusinessName,
      sf.ClimateControlled, sf.SecuritySystem, sf.CCTVMonitored,
      sf.ParkingAvailable, sf.LoadingAssistance, sf.AccessType,
      ISNULL(rv.AvgRating, 0) AS AvgRating,
      ISNULL(rv.TotalReviews, 0) AS TotalReviews,
      img.FirstImageID,
      (
        CASE WHEN l.City = @city THEN 30
             WHEN l.City LIKE @citySearch THEN 15
             ELSE 0 END +
        CASE WHEN s.SpaceType = @spaceType THEN 20 ELSE 0 END +
        CASE WHEN @maxPrice IS NULL OR s.PricePerMonth <= @maxPrice THEN 15 ELSE 0 END +
        CASE WHEN @minSize IS NULL OR s.Size >= @minSize THEN 10 ELSE 0 END +
        CASE WHEN @maxSize IS NULL OR s.Size <= @maxSize THEN 5  ELSE 0 END +
        CAST(ISNULL(rv.AvgRating, 0) * 4 AS INT) +
        CASE WHEN @climateControlled = 1 AND sf.ClimateControlled = 1 THEN 10 ELSE 0 END +
        CASE WHEN @security = 1 AND (sf.SecuritySystem = 1 OR sf.CCTVMonitored = 1) THEN 8 ELSE 0 END +
        CASE WHEN @parking = 1 AND sf.ParkingAvailable = 1 THEN 5 ELSE 0 END
      ) AS MatchScore
    FROM StorageSpaces s
    LEFT JOIN Locations l ON l.SpaceID = s.SpaceID
    LEFT JOIN StorageProviders p ON p.ProviderID = s.ProviderID
    LEFT JOIN SpaceFeatures sf ON sf.SpaceID = s.SpaceID
    LEFT JOIN (
      SELECT b.SpaceID,
        AVG(CAST(r.Rating AS FLOAT)) AS AvgRating,
        COUNT(*) AS TotalReviews
      FROM Reviews r JOIN Bookings b ON b.BookingID = r.BookingID
      GROUP BY b.SpaceID
    ) rv ON rv.SpaceID = s.SpaceID
    LEFT JOIN (
      SELECT SpaceID, MIN(ImageID) AS FirstImageID FROM SpaceImages GROUP BY SpaceID
    ) img ON img.SpaceID = s.SpaceID
    WHERE s.Status = 'Active' AND s.IsAvailable = 1
      AND (@citySearch IS NULL OR l.City LIKE @citySearch)
      AND (@spaceType IS NULL OR s.SpaceType = @spaceType)
      AND (@maxPrice IS NULL OR s.PricePerMonth <= @maxPrice)
      AND (@minPrice IS NULL OR s.PricePerMonth >= @minPrice)
      AND (@minSize IS NULL OR s.Size >= @minSize)
      AND (@maxSize IS NULL OR s.Size <= @maxSize)
      AND (@climateControlled IS NULL OR sf.ClimateControlled = @climateControlled)
      AND (@parking IS NULL OR sf.ParkingAvailable = @parking)
    ORDER BY MatchScore DESC, rv.AvgRating DESC
    OFFSET @skip ROWS FETCH NEXT @limit ROWS ONLY`,
        {
            city: filters.city || null,
            citySearch,
            spaceType: typeSearch,
            maxPrice: filters.maxPrice || null,
            minPrice: filters.minPrice || null,
            minSize: filters.minSize || null,
            maxSize: filters.maxSize || null,
            climateControlled: filters.climateControlled !== undefined
                ? (filters.climateControlled ? 1 : null)
                : null,
            security: filters.securitySystem !== undefined
                ? (filters.securitySystem ? 1 : null)
                : null,
            parking: filters.parkingAvailable !== undefined
                ? (filters.parkingAvailable ? 1 : null)
                : null,
            skip,
            limit,
        }
    );
    return rows as SpaceWithDetails[];
}

export async function getRecommendedSpaces(city: string, limit = 6): Promise<SpaceWithDetails[]> {
    const cityLike = `%${sanitizeLikeParam(city)}%`;
    return query<SpaceWithDetails>(
        `SELECT TOP (@limit)
      s.SpaceID, s.Title, s.SpaceType, s.Size, s.PricePerMonth, s.FavoriteCount,
      l.City, l.AddressLine1, l.Landmark,
      p.FirstName AS ProviderFirstName, p.LastName AS ProviderLastName, p.BusinessName,
      ISNULL(rv.AvgRating, 0) AS AvgRating,
      ISNULL(rv.TotalReviews, 0) AS TotalReviews,
      img.FirstImageID
    FROM StorageSpaces s
    LEFT JOIN Locations l ON l.SpaceID = s.SpaceID
    LEFT JOIN StorageProviders p ON p.ProviderID = s.ProviderID
    LEFT JOIN (
      SELECT b.SpaceID, AVG(CAST(r.Rating AS FLOAT)) AS AvgRating, COUNT(*) AS TotalReviews
      FROM Reviews r JOIN Bookings b ON b.BookingID = r.BookingID
      GROUP BY b.SpaceID
    ) rv ON rv.SpaceID = s.SpaceID
    LEFT JOIN (
      SELECT SpaceID, MIN(ImageID) AS FirstImageID FROM SpaceImages GROUP BY SpaceID
    ) img ON img.SpaceID = s.SpaceID
    WHERE s.Status = 'Active' AND s.IsAvailable = 1
      AND (l.City LIKE @cityLike)
    ORDER BY rv.AvgRating DESC, s.FavoriteCount DESC`,
        { limit, cityLike }
    );
}

export async function findSpacesByProvider(providerId: number): Promise<SpaceWithDetails[]> {
    return query<SpaceWithDetails>(
        `SELECT
      s.*,
      l.City, l.AddressLine1,
      ISNULL(rv.AvgRating, 0) AS AvgRating,
      ISNULL(rv.TotalReviews, 0) AS TotalReviews,
      ISNULL(bk.ActiveBookings, 0) AS ActiveBookings,
      ISNULL(bk.TotalBookings, 0) AS TotalBookings
    FROM StorageSpaces s
    LEFT JOIN Locations l ON l.SpaceID = s.SpaceID
    LEFT JOIN (
      SELECT b.SpaceID, AVG(CAST(r.Rating AS FLOAT)) AS AvgRating, COUNT(*) AS TotalReviews
      FROM Reviews r JOIN Bookings b ON b.BookingID = r.BookingID
      GROUP BY b.SpaceID
    ) rv ON rv.SpaceID = s.SpaceID
    LEFT JOIN (
      SELECT SpaceID,
        SUM(CASE WHEN BookingStatus = 'Active' THEN 1 ELSE 0 END) AS ActiveBookings,
        COUNT(*) AS TotalBookings
      FROM Bookings GROUP BY SpaceID
    ) bk ON bk.SpaceID = s.SpaceID
    WHERE s.ProviderID = @providerId
    ORDER BY s.CreatedAt DESC`,
        { providerId }
    );
}

export async function createSpace(providerId: number, input: CreateSpaceInput): Promise<number> {
    const result = await execute(
        `INSERT INTO StorageSpaces (
      ProviderID, Title, Description, SpaceType, Size, Height, Width, Length,
      PricePerMonth, PricePerWeek, PricePerDay, MinRentalPeriod, MaxRentalPeriod,
      FloorNumber, IsAvailable, Status
    )
    OUTPUT INSERTED.SpaceID
    VALUES (
      @providerId, @title, @description, @spaceType, @size, @height, @width, @length,
      @pricePerMonth, @pricePerWeek, @pricePerDay, @minRentalPeriod, @maxRentalPeriod,
      @floorNumber, 1, 'Pending'
    )`,
        {
            providerId,
            title: input.title,
            description: input.description || null,
            spaceType: input.spaceType || null,
            size: input.size,
            height: input.height || null,
            width: input.width || null,
            length: input.length || null,
            pricePerMonth: input.pricePerMonth,
            pricePerWeek: input.pricePerWeek || null,
            pricePerDay: input.pricePerDay || null,
            minRentalPeriod: input.minRentalPeriod || 1,
            maxRentalPeriod: input.maxRentalPeriod || null,
            floorNumber: input.floorNumber || null,
        }
    );

    const rows = result.recordset as Array<{ SpaceID: number }>;
    const spaceId = rows[0].SpaceID;

    // Insert features
    await execute(
        `INSERT INTO SpaceFeatures (
      SpaceID, ClimateControlled, SecuritySystem, CCTVMonitored,
      ParkingAvailable, LoadingAssistance, AccessType, Restrictions
    ) VALUES (
      @spaceId, @climateControlled, @securitySystem, @cctvMonitored,
      @parkingAvailable, @loadingAssistance, @accessType, @restrictions
    )`,
        {
            spaceId,
            climateControlled: input.climateControlled || false,
            securitySystem: input.securitySystem || false,
            cctvMonitored: input.cctvMonitored || false,
            parkingAvailable: input.parkingAvailable || false,
            loadingAssistance: input.loadingAssistance || false,
            accessType: input.accessType || null,
            restrictions: input.restrictions || null,
        }
    );

    // Insert location
    await execute(
        `INSERT INTO Locations (
      SpaceID, AddressLine1, AddressLine2, BuildingNumber,
      City, Region, PostalCode, Country, Latitude, Longitude, Landmark
    ) VALUES (
      @spaceId, @addressLine1, @addressLine2, @buildingNumber,
      @city, @region, @postalCode, @country, @latitude, @longitude, @landmark
    )`,
        {
            spaceId,
            addressLine1: input.addressLine1,
            addressLine2: input.addressLine2 || null,
            buildingNumber: input.buildingNumber || null,
            city: input.city,
            region: input.region || null,
            postalCode: input.postalCode || null,
            country: input.country || 'Saudi Arabia',
            latitude: input.latitude || null,
            longitude: input.longitude || null,
            landmark: input.landmark || null,
        }
    );

    return spaceId;
}

export async function updateSpace(id: number, input: UpdateSpaceInput): Promise<void> {
    if (Object.keys(input).length === 0) return;

    await execute(
        `UPDATE StorageSpaces SET
      Title = ISNULL(@title, Title),
      Description = ISNULL(@description, Description),
      SpaceType = ISNULL(@spaceType, SpaceType),
      Size = ISNULL(@size, Size),
      PricePerMonth = ISNULL(@pricePerMonth, PricePerMonth),
      PricePerWeek = ISNULL(@pricePerWeek, PricePerWeek),
      PricePerDay = ISNULL(@pricePerDay, PricePerDay),
      IsAvailable = ISNULL(@isAvailable, IsAvailable),
      UpdatedAt = GETDATE()
    WHERE SpaceID = @id AND ProviderID = @providerId`,
        {
            id,
            providerId: null, // caller should pass this from JWT
            title: input.title || null,
            description: input.description || null,
            spaceType: input.spaceType || null,
            size: input.size || null,
            pricePerMonth: input.pricePerMonth || null,
            pricePerWeek: input.pricePerWeek || null,
            pricePerDay: input.pricePerDay || null,
            isAvailable: input.isAvailable !== undefined ? (input.isAvailable ? 1 : 0) : null,
        }
    );
}

export async function deleteSpace(id: number, providerId: number): Promise<void> {
    await execute(
        `DELETE FROM StorageSpaces WHERE SpaceID = @id AND ProviderID = @providerId`,
        { id, providerId }
    );
}

// ============================================================
// SPACE IMAGES
// ============================================================

export async function addSpaceImage(
    spaceId: number,
    imageData: Buffer,
    contentType: string,
    caption?: string,
    imageOrder?: number
): Promise<number> {
    const result = await execute(
        `INSERT INTO SpaceImages (SpaceID, ImageData, ContentType, Caption, ImageOrder)
     OUTPUT INSERTED.ImageID
     VALUES (@spaceId, @imageData, @contentType, @caption, @imageOrder)`,
        {
            spaceId,
            imageData,
            contentType,
            caption: caption || null,
            imageOrder: imageOrder || 1,
        }
    );
    const rows = result.recordset as Array<{ ImageID: number }>;
    return rows[0].ImageID;
}

export async function getSpaceImage(
    imageId: number
): Promise<{ data: Buffer; contentType: string } | null> {
    const row = await queryOne<{ ImageData: Buffer; ContentType: string }>(
        `SELECT ImageData, ContentType FROM SpaceImages WHERE ImageID = @imageId`,
        { imageId }
    );
    if (!row || !row.ImageData) return null;
    return { data: row.ImageData, contentType: row.ContentType || 'image/jpeg' };
}

export async function getSpaceImagesMeta(spaceId: number): Promise<SpaceImage[]> {
    return query<SpaceImage>(
        `SELECT ImageID, SpaceID, ContentType, ImageOrder, Caption, UploadedAt
     FROM SpaceImages WHERE SpaceID = @spaceId ORDER BY ImageOrder ASC`,
        { spaceId }
    );
}
