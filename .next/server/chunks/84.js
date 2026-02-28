exports.id=84,exports.ids=[84],exports.modules={21256:(a,b,c)=>{"use strict";c.d(b,{DP:()=>i,Fu:()=>h,M2:()=>g,Po:()=>m,Yk:()=>k,bz:()=>j,c$:()=>f,cN:()=>l,wB:()=>n});var d=c(27143),e=c(36961);async function f(a){return(0,d.Zy)(`SELECT
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
    WHERE s.SpaceID = @id`,{id:a})}async function g(a){let b=Math.min(a.limit||12,50),c=Math.max(a.page||1,1),f=a.city?`%${(0,e.y3)(a.city)}%`:null,g=a.spaceType||null;return await (0,d.P)(`SELECT
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
    OFFSET @skip ROWS FETCH NEXT @limit ROWS ONLY`,{city:a.city||null,citySearch:f,spaceType:g,maxPrice:a.maxPrice||null,minPrice:a.minPrice||null,minSize:a.minSize||null,maxSize:a.maxSize||null,climateControlled:void 0!==a.climateControlled&&a.climateControlled?1:null,security:void 0!==a.securitySystem&&a.securitySystem?1:null,parking:void 0!==a.parkingAvailable&&a.parkingAvailable?1:null,skip:(c-1)*b,limit:b})}async function h(a,b=6){let c=`%${(0,e.y3)(a)}%`;return(0,d.P)(`SELECT TOP (@limit)
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
    ORDER BY rv.AvgRating DESC, s.FavoriteCount DESC`,{limit:b,cityLike:c})}async function i(a){return(0,d.P)(`SELECT
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
    ORDER BY s.CreatedAt DESC`,{providerId:a})}async function j(a,b){let c=(await (0,d.g7)(`INSERT INTO StorageSpaces (
      ProviderID, Title, Description, SpaceType, Size, Height, Width, Length,
      PricePerMonth, PricePerWeek, PricePerDay, MinRentalPeriod, MaxRentalPeriod,
      FloorNumber, IsAvailable, Status
    )
    OUTPUT INSERTED.SpaceID
    VALUES (
      @providerId, @title, @description, @spaceType, @size, @height, @width, @length,
      @pricePerMonth, @pricePerWeek, @pricePerDay, @minRentalPeriod, @maxRentalPeriod,
      @floorNumber, 1, 'Pending'
    )`,{providerId:a,title:b.title,description:b.description||null,spaceType:b.spaceType||null,size:b.size,height:b.height||null,width:b.width||null,length:b.length||null,pricePerMonth:b.pricePerMonth,pricePerWeek:b.pricePerWeek||null,pricePerDay:b.pricePerDay||null,minRentalPeriod:b.minRentalPeriod||1,maxRentalPeriod:b.maxRentalPeriod||null,floorNumber:b.floorNumber||null})).recordset[0].SpaceID;return await (0,d.g7)(`INSERT INTO SpaceFeatures (
      SpaceID, ClimateControlled, SecuritySystem, CCTVMonitored,
      ParkingAvailable, LoadingAssistance, AccessType, Restrictions
    ) VALUES (
      @spaceId, @climateControlled, @securitySystem, @cctvMonitored,
      @parkingAvailable, @loadingAssistance, @accessType, @restrictions
    )`,{spaceId:c,climateControlled:b.climateControlled||!1,securitySystem:b.securitySystem||!1,cctvMonitored:b.cctvMonitored||!1,parkingAvailable:b.parkingAvailable||!1,loadingAssistance:b.loadingAssistance||!1,accessType:b.accessType||null,restrictions:b.restrictions||null}),await (0,d.g7)(`INSERT INTO Locations (
      SpaceID, AddressLine1, AddressLine2, BuildingNumber,
      City, Region, PostalCode, Country, Latitude, Longitude, Landmark
    ) VALUES (
      @spaceId, @addressLine1, @addressLine2, @buildingNumber,
      @city, @region, @postalCode, @country, @latitude, @longitude, @landmark
    )`,{spaceId:c,addressLine1:b.addressLine1,addressLine2:b.addressLine2||null,buildingNumber:b.buildingNumber||null,city:b.city,region:b.region||null,postalCode:b.postalCode||null,country:b.country||"Saudi Arabia",latitude:b.latitude||null,longitude:b.longitude||null,landmark:b.landmark||null}),c}async function k(a,b){0!==Object.keys(b).length&&await (0,d.g7)(`UPDATE StorageSpaces SET
      Title = ISNULL(@title, Title),
      Description = ISNULL(@description, Description),
      SpaceType = ISNULL(@spaceType, SpaceType),
      Size = ISNULL(@size, Size),
      PricePerMonth = ISNULL(@pricePerMonth, PricePerMonth),
      PricePerWeek = ISNULL(@pricePerWeek, PricePerWeek),
      PricePerDay = ISNULL(@pricePerDay, PricePerDay),
      IsAvailable = ISNULL(@isAvailable, IsAvailable),
      UpdatedAt = GETDATE()
    WHERE SpaceID = @id AND ProviderID = @providerId`,{id:a,providerId:null,title:b.title||null,description:b.description||null,spaceType:b.spaceType||null,size:b.size||null,pricePerMonth:b.pricePerMonth||null,pricePerWeek:b.pricePerWeek||null,pricePerDay:b.pricePerDay||null,isAvailable:void 0!==b.isAvailable?+!!b.isAvailable:null})}async function l(a,b){await (0,d.g7)("DELETE FROM StorageSpaces WHERE SpaceID = @id AND ProviderID = @providerId",{id:a,providerId:b})}async function m(a,b,c,e,f){return(await (0,d.g7)(`INSERT INTO SpaceImages (SpaceID, ImageData, ContentType, Caption, ImageOrder)
     OUTPUT INSERTED.ImageID
     VALUES (@spaceId, @imageData, @contentType, @caption, @imageOrder)`,{spaceId:a,imageData:b,contentType:c,caption:e||null,imageOrder:f||1})).recordset[0].ImageID}async function n(a){let b=await (0,d.Zy)("SELECT ImageData, ContentType FROM SpaceImages WHERE ImageID = @imageId",{imageId:a});return b&&b.ImageData?{data:b.ImageData,contentType:b.ContentType||"image/jpeg"}:null}},27143:(a,b,c)=>{"use strict";c.d(b,{P:()=>h,Zy:()=>i,g7:()=>j});var d=c(22161),e=c.n(d);let f={server:process.env.DB_SERVER||"siaa.database.windows.net",user:process.env.DB_USER||"",password:process.env.DB_PASSWORD||"",database:process.env.DB_NAME||"Siaa",port:parseInt(process.env.DB_PORT||"1433",10),options:{encrypt:!0,trustServerCertificate:!1,enableArithAbort:!0,connectTimeout:3e4,requestTimeout:3e4},pool:{max:10,min:0,idleTimeoutMillis:3e4}};async function g(){if(global._sqlPool&&global._sqlPool.connected)return global._sqlPool;if(global._sqlPool){try{await global._sqlPool.close()}catch{}global._sqlPool=void 0}try{let a=new(e()).ConnectionPool(f);return await a.connect(),global._sqlPool=a,a.on("error",a=>{console.error("SQL Pool Error:",a),global._sqlPool=void 0}),console.log("✅ Connected to Azure SQL Database"),a}catch(a){throw console.error("❌ Database connection failed:",a),global._sqlPool=void 0,Error(`Unable to connect to database: ${a instanceof Error?a.message:"Unknown error"}`)}}async function h(a,b){let c=(await g()).request();if(b)for(let[a,d]of Object.entries(b))null==d?c.input(a,e().NVarChar(e().MAX),null):"number"==typeof d?Number.isInteger(d)?c.input(a,e().Int,d):c.input(a,e().Float,d):"boolean"==typeof d?c.input(a,e().Bit,+!!d):d instanceof Date?c.input(a,e().DateTime,d):c.input(a,e().NVarChar(e().MAX),String(d));return(await c.query(a)).recordset}async function i(a,b){let c=await h(a,b);return c.length>0?c[0]:null}async function j(a,b){let c=(await g()).request();if(b)for(let[a,d]of Object.entries(b))null==d?c.input(a,e().NVarChar(e().MAX),null):"number"==typeof d?Number.isInteger(d)?c.input(a,e().Int,d):c.input(a,e().Float,d):"boolean"==typeof d?c.input(a,e().Bit,+!!d):d instanceof Date?c.input(a,e().DateTime,d):d instanceof Buffer?c.input(a,e().VarBinary(e().MAX),d):c.input(a,e().NVarChar(e().MAX),String(d));return await c.query(a)}},36961:(a,b,c)=>{"use strict";c.d(b,{YB:()=>g,r6:()=>e,y3:()=>h,yj:()=>f});var d=c(10641);function e(a,b,c=200){return d.NextResponse.json({success:!0,...a,message:b},{status:c})}function f(a,b=400){return d.NextResponse.json({success:!1,error:a},{status:b})}function g(a){let b=Math.max(1,parseInt(a.get("page")||"1",10)),c=Math.min(50,Math.max(1,parseInt(a.get("limit")||"12",10)));return{page:b,limit:c,skip:(b-1)*c}}function h(a){return a.replace(/[%_[\]]/g,a=>`[${a}]`)}},57729:()=>{},78335:()=>{},96487:()=>{}};