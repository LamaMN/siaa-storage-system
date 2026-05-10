-- ============================================================
-- Si'aa Storage System — Database Index Optimization
-- Run this script on your Azure SQL database to improve
-- query performance for the most common access patterns.
-- ============================================================
-- SAFE TO RUN: These are non-destructive CREATE INDEX IF NOT EXISTS equivalents.
-- They use WHERE NOT EXISTS checks so re-running is safe.

-- 1. StorageSeekers: Email lookup (login, registration check)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_StorageSeekers_Email' AND object_id = OBJECT_ID('StorageSeekers'))
    CREATE UNIQUE NONCLUSTERED INDEX IX_StorageSeekers_Email ON StorageSeekers(Email);
GO

-- 2. StorageProviders: Email lookup (login, registration check)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_StorageProviders_Email' AND object_id = OBJECT_ID('StorageProviders'))
    CREATE UNIQUE NONCLUSTERED INDEX IX_StorageProviders_Email ON StorageProviders(Email);
GO

-- 3. StorageSpaces: Status + Availability (search queries filter on this)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_StorageSpaces_Status_Available' AND object_id = OBJECT_ID('StorageSpaces'))
    CREATE NONCLUSTERED INDEX IX_StorageSpaces_Status_Available ON StorageSpaces(Status, IsAvailable) INCLUDE (ProviderID, Title, SpaceType, Size, PricePerMonth, FavoriteCount);
GO

-- 4. StorageSpaces: Provider lookup (dashboard "My Spaces")
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_StorageSpaces_ProviderID' AND object_id = OBJECT_ID('StorageSpaces'))
    CREATE NONCLUSTERED INDEX IX_StorageSpaces_ProviderID ON StorageSpaces(ProviderID);
GO

-- 5. Locations: SpaceID (JOIN optimization for search)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Locations_SpaceID' AND object_id = OBJECT_ID('Locations'))
    CREATE NONCLUSTERED INDEX IX_Locations_SpaceID ON Locations(SpaceID) INCLUDE (City, AddressLine1, AddressLine2, Latitude, Longitude);
GO

-- 6. SpaceFeatures: SpaceID (JOIN optimization for search)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_SpaceFeatures_SpaceID' AND object_id = OBJECT_ID('SpaceFeatures'))
    CREATE NONCLUSTERED INDEX IX_SpaceFeatures_SpaceID ON SpaceFeatures(SpaceID) INCLUDE (ClimateControlled, SecuritySystem, CCTVMonitored, ParkingAvailable, LoadingAssistance);
GO

-- 7. Bookings: SpaceID + Status (availability overlap check in search)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Bookings_SpaceID_Status' AND object_id = OBJECT_ID('Bookings'))
    CREATE NONCLUSTERED INDEX IX_Bookings_SpaceID_Status ON Bookings(SpaceID, BookingStatus) INCLUDE (StartDate, EndDate, TotalAmount);
GO

-- 8. Bookings: SeekerID (dashboard "My Bookings")
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Bookings_SeekerID' AND object_id = OBJECT_ID('Bookings'))
    CREATE NONCLUSTERED INDEX IX_Bookings_SeekerID ON Bookings(SeekerID);
GO

-- 9. SpaceImages: SpaceID + Order (first image lookup)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_SpaceImages_SpaceID_Order' AND object_id = OBJECT_ID('SpaceImages'))
    CREATE NONCLUSTERED INDEX IX_SpaceImages_SpaceID_Order ON SpaceImages(SpaceID, ImageOrder, ImageID);
GO

-- 10. Reviews: BookingID (review aggregation joins)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Reviews_BookingID' AND object_id = OBJECT_ID('Reviews'))
    CREATE NONCLUSTERED INDEX IX_Reviews_BookingID ON Reviews(BookingID) INCLUDE (Rating);
GO

-- 11. Favorites: SeekerID (favorites list)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Favorites_SeekerID' AND object_id = OBJECT_ID('Favorites'))
    CREATE NONCLUSTERED INDEX IX_Favorites_SeekerID ON Favorites(SeekerID, SpaceID);
GO

-- 12. Favorites: SpaceID (favorite count / exists check in search)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Favorites_SpaceID' AND object_id = OBJECT_ID('Favorites'))
    CREATE NONCLUSTERED INDEX IX_Favorites_SpaceID ON Favorites(SpaceID);
GO

PRINT 'All indexes created successfully.';
GO
