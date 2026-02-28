"use strict";(()=>{var a={};a.id=190,a.ids=[190],a.modules={261:a=>{a.exports=require("next/dist/shared/lib/router/utils/app-paths")},1708:a=>{a.exports=require("node:process")},3295:a=>{a.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},4573:a=>{a.exports=require("node:buffer")},10846:a=>{a.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},12412:a=>{a.exports=require("assert")},14985:a=>{a.exports=require("dns")},16072:(a,b,c)=>{c.d(b,{Ao:()=>h,Ui:()=>o,YN:()=>k,aS:()=>n,bS:()=>g,h6:()=>m,lW:()=>i,sH:()=>j,wx:()=>q,xS:()=>p,yB:()=>l});var d=c(45711),e=c(28319),f=c(21256);let g=d.Ik({spaceId:d.ai().int().positive(),startDate:d.Yj().refine(a=>!isNaN(Date.parse(a)),"Valid start date required"),endDate:d.Yj().refine(a=>!isNaN(Date.parse(a)),"Valid end date required"),specialRequests:d.Yj().max(1e3).optional(),logisticsOption:d.k5(["self_dropoff","partner_pickup"]).optional()}).refine(a=>new Date(a.endDate)>=new Date(a.startDate),{message:"End date must be after start date",path:["endDate"]}),h=d.Ik({rating:d.ai().int().min(1).max(5),comment:d.Yj().min(10).max(500).optional(),seekerId:d.ai().int().positive()}),i=d.Ik({status:d.k5(["Confirmed","Active","Completed","Cancelled","Rejected"])});async function j(a,b){let c,d=await (0,f.c$)(b.spaceId);if(!d)throw Error("Space not found");if(!d.IsAvailable)throw Error("Space is not available for booking");if("Active"!==d.Status)throw Error("Space is not currently active");let g=new Date(b.startDate),h=Math.ceil((new Date(b.endDate).getTime()-g.getTime())/864e5);if(h<(d.MinRentalPeriod||1))throw Error(`Minimum rental period is ${d.MinRentalPeriod} day(s)`);let i=parseFloat((.15*(c=h<=7&&d.PricePerDay?h*d.PricePerDay:h<=28&&d.PricePerWeek?Math.ceil(h/7)*d.PricePerWeek:Math.ceil(h/30)*d.PricePerMonth)).toFixed(2));return{bookingId:await (0,e.sH)({spaceId:b.spaceId,seekerId:a,startDate:b.startDate,endDate:b.endDate,specialRequests:b.specialRequests},parseFloat(c.toFixed(2)),i),totalAmount:c,platformFee:i}}async function k(a,b){if(!await (0,e.WD)(a,b))throw Error("Cannot cancel this booking. It may already be confirmed or not belong to you.")}async function l(a,b,c){let d=await (0,e.JI)(a);if(!d)throw Error("Booking not found");if(d.ProviderID!==c)throw Error("Unauthorized: not your booking");let f=d.BookingStatus;if(!({Pending:["Confirmed","Rejected"],Confirmed:["Active","Cancelled"],Active:["Completed"]})[f]?.includes(b))throw Error(`Cannot change status from ${f} to ${b}`);await (0,e.nz)(a,b)}async function m(a,b){let c=await (0,e.JI)(a);if(!c)throw Error("Booking not found");if(c.SeekerID!==b.seekerId)throw Error("Unauthorized");if("Completed"!==c.BookingStatus)throw Error("Reviews can only be submitted for completed bookings");if(await (0,e.ij)(a))throw Error("You have already reviewed this booking");return(0,e.bx)(a,b)}async function n(a){return(0,e.O8)(a)}async function o(a){return(0,e.ip)(a)}async function p(a){return(0,e.DX)(a)}async function q(a,b){return"seeker"===b?(0,e.hp)(a):(0,e.hY)(a)}},19121:a=>{a.exports=require("next/dist/server/app-render/action-async-storage.external.js")},19185:a=>{a.exports=require("dgram")},21820:a=>{a.exports=require("os")},27910:a=>{a.exports=require("stream")},28319:(a,b,c)=>{c.d(b,{DX:()=>l,JI:()=>e,O8:()=>f,WD:()=>j,bx:()=>m,hY:()=>o,hp:()=>n,ij:()=>k,ip:()=>g,nz:()=>i,sH:()=>h});var d=c(27143);async function e(a){return(0,d.Zy)(`SELECT
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
    WHERE b.BookingID = @id`,{id:a})}async function f(a){return(0,d.P)(`SELECT
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
    ORDER BY b.CreatedAt DESC`,{seekerId:a})}async function g(a){return(0,d.P)(`SELECT
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
    ORDER BY b.CreatedAt DESC`,{providerId:a})}async function h(a,b,c){return(await (0,d.g7)(`INSERT INTO Bookings (
      SpaceID, SeekerID, StartDate, EndDate,
      TotalAmount, PlatformFee, BookingStatus, SpecialRequests
    )
    OUTPUT INSERTED.BookingID
    VALUES (
      @spaceId, @seekerId, @startDate, @endDate,
      @totalAmount, @platformFee, 'Pending', @specialRequests
    )`,{spaceId:a.spaceId,seekerId:a.seekerId,startDate:a.startDate,endDate:a.endDate,totalAmount:b,platformFee:c,specialRequests:a.specialRequests||null})).recordset[0].BookingID}async function i(a,b){let c=new Date().toISOString(),e="UPDATE Bookings SET BookingStatus = @status, UpdatedAt = GETDATE()";"Confirmed"===b?e+=", ConfirmedAt = @now":"Completed"===b&&(e+=", CompletedAt = @now"),e+=" WHERE BookingID = @bookingId",await (0,d.g7)(e,{status:b,bookingId:a,now:c})}async function j(a,b){return((await (0,d.g7)(`UPDATE Bookings SET BookingStatus = 'Cancelled', UpdatedAt = GETDATE()
     WHERE BookingID = @bookingId AND SeekerID = @seekerId AND BookingStatus = 'Pending'`,{bookingId:a,seekerId:b})).rowsAffected[0]||0)>0}async function k(a){return(0,d.Zy)("SELECT * FROM Reviews WHERE BookingID = @bookingId",{bookingId:a})}async function l(a){return(0,d.P)(`SELECT r.*,
      s.Title AS SpaceTitle, s.SpaceType,
      b.StartDate, b.EndDate
    FROM Reviews r
    JOIN Bookings b ON b.BookingID = r.BookingID
    JOIN StorageSpaces s ON s.SpaceID = b.SpaceID
    WHERE r.ReviewerSeekerID = @seekerId
    ORDER BY r.CreatedAt DESC`,{seekerId:a})}async function m(a,b){return(await (0,d.g7)(`INSERT INTO Reviews (BookingID, ReviewerSeekerID, Rating, Comment)
     OUTPUT INSERTED.ReviewID
     VALUES (@bookingId, @seekerId, @rating, @comment)`,{bookingId:a,seekerId:b.seekerId,rating:b.rating,comment:b.comment||null})).recordset[0].ReviewID}async function n(a){return await (0,d.Zy)(`SELECT
      COUNT(*) AS TotalBookings,
      SUM(CASE WHEN BookingStatus = 'Active' THEN 1 ELSE 0 END) AS ActiveBookings,
      SUM(CASE WHEN BookingStatus = 'Pending' THEN 1 ELSE 0 END) AS PendingBookings,
      SUM(CASE WHEN BookingStatus = 'Completed' THEN 1 ELSE 0 END) AS CompletedBookings,
      SUM(CASE WHEN BookingStatus = 'Cancelled' THEN 1 ELSE 0 END) AS CancelledBookings,
      ISNULL(SUM(CASE WHEN BookingStatus IN ('Active','Completed') THEN TotalAmount ELSE 0 END), 0) AS TotalSpent
    FROM Bookings
    WHERE SeekerID = @seekerId`,{seekerId:a})||{TotalBookings:0,ActiveBookings:0,PendingBookings:0,CompletedBookings:0,CancelledBookings:0,TotalSpent:0}}async function o(a){return await (0,d.Zy)(`SELECT
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
    GROUP BY bk.TotalBookings, bk.ActiveBookings, bk.PendingBookingRequests, bk.TotalRevenue`,{providerId:a})||{TotalSpaces:0,ActiveSpaces:0,PendingSpaces:0,TotalBookings:0,ActiveBookings:0,PendingBookingRequests:0,TotalRevenue:0}}},28354:a=>{a.exports=require("util")},29021:a=>{a.exports=require("fs")},29294:a=>{a.exports=require("next/dist/server/app-render/work-async-storage.external.js")},31421:a=>{a.exports=require("node:child_process")},33873:a=>{a.exports=require("path")},34631:a=>{a.exports=require("tls")},37067:a=>{a.exports=require("node:http")},38522:a=>{a.exports=require("node:zlib")},41204:a=>{a.exports=require("string_decoder")},44708:a=>{a.exports=require("node:https")},44870:a=>{a.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},48161:a=>{a.exports=require("node:os")},51455:a=>{a.exports=require("node:fs/promises")},55511:a=>{a.exports=require("crypto")},55591:a=>{a.exports=require("https")},57075:a=>{a.exports=require("node:stream")},57975:a=>{a.exports=require("node:util")},63033:a=>{a.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},66136:a=>{a.exports=require("timers")},73024:a=>{a.exports=require("node:fs")},73136:a=>{a.exports=require("node:url")},73865:(a,b,c)=>{c.r(b),c.d(b,{handler:()=>C,patchFetch:()=>B,routeModule:()=>x,serverHooks:()=>A,workAsyncStorage:()=>y,workUnitAsyncStorage:()=>z});var d={};c.r(d),c.d(d,{POST:()=>w});var e=c(95736),f=c(9117),g=c(4044),h=c(39326),i=c(32324),j=c(261),k=c(54290),l=c(85328),m=c(38928),n=c(46595),o=c(3421),p=c(17679),q=c(41681),r=c(63446),s=c(86439),t=c(51356),u=c(16072),v=c(36961);async function w(a){try{let b=parseInt(a.headers.get("x-user-id")||"0",10),c=a.headers.get("x-user-type");if(!b||"seeker"!==c)return(0,v.yj)("Only seekers can create bookings",403);let d=await a.json(),e=u.bS.safeParse(d);if(!e.success)return(0,v.yj)(e.error.errors[0].message,422);let f=await (0,u.sH)(b,e.data);return(0,v.r6)(f,"Booking request submitted successfully",201)}catch(b){let a=b instanceof Error?b.message:"Failed to create booking";return console.error("Create booking error:",b),(0,v.yj)(a,400)}}let x=new e.AppRouteRouteModule({definition:{kind:f.RouteKind.APP_ROUTE,page:"/api/bookings/route",pathname:"/api/bookings",filename:"route",bundlePath:"app/api/bookings/route"},distDir:".next",relativeProjectDir:"",resolvedPagePath:"C:\\Users\\lama1\\Documents\\GitHub\\siaa-storage-system\\app\\api\\bookings\\route.ts",nextConfigOutput:"",userland:d}),{workAsyncStorage:y,workUnitAsyncStorage:z,serverHooks:A}=x;function B(){return(0,g.patchFetch)({workAsyncStorage:y,workUnitAsyncStorage:z})}async function C(a,b,c){var d;let e="/api/bookings/route";"/index"===e&&(e="/");let g=await x.prepare(a,b,{srcPage:e,multiZoneDraftMode:!1});if(!g)return b.statusCode=400,b.end("Bad Request"),null==c.waitUntil||c.waitUntil.call(c,Promise.resolve()),null;let{buildId:u,params:v,nextConfig:w,isDraftMode:y,prerenderManifest:z,routerServerContext:A,isOnDemandRevalidate:B,revalidateOnlyGenerated:C,resolvedPathname:D}=g,E=(0,j.normalizeAppPath)(e),F=!!(z.dynamicRoutes[E]||z.routes[D]);if(F&&!y){let a=!!z.routes[D],b=z.dynamicRoutes[E];if(b&&!1===b.fallback&&!a)throw new s.NoFallbackError}let G=null;!F||x.isDev||y||(G="/index"===(G=D)?"/":G);let H=!0===x.isDev||!F,I=F&&!H,J=a.method||"GET",K=(0,i.getTracer)(),L=K.getActiveScopeSpan(),M={params:v,prerenderManifest:z,renderOpts:{experimental:{cacheComponents:!!w.experimental.cacheComponents,authInterrupts:!!w.experimental.authInterrupts},supportsDynamicResponse:H,incrementalCache:(0,h.getRequestMeta)(a,"incrementalCache"),cacheLifeProfiles:null==(d=w.experimental)?void 0:d.cacheLife,isRevalidate:I,waitUntil:c.waitUntil,onClose:a=>{b.on("close",a)},onAfterTaskError:void 0,onInstrumentationRequestError:(b,c,d)=>x.onRequestError(a,b,d,A)},sharedContext:{buildId:u}},N=new k.NodeNextRequest(a),O=new k.NodeNextResponse(b),P=l.NextRequestAdapter.fromNodeNextRequest(N,(0,l.signalFromNodeResponse)(b));try{let d=async c=>x.handle(P,M).finally(()=>{if(!c)return;c.setAttributes({"http.status_code":b.statusCode,"next.rsc":!1});let d=K.getRootSpanAttributes();if(!d)return;if(d.get("next.span_type")!==m.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${d.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let e=d.get("next.route");if(e){let a=`${J} ${e}`;c.setAttributes({"next.route":e,"http.route":e,"next.span_name":a}),c.updateName(a)}else c.updateName(`${J} ${a.url}`)}),g=async g=>{var i,j;let k=async({previousCacheEntry:f})=>{try{if(!(0,h.getRequestMeta)(a,"minimalMode")&&B&&C&&!f)return b.statusCode=404,b.setHeader("x-nextjs-cache","REVALIDATED"),b.end("This page could not be found"),null;let e=await d(g);a.fetchMetrics=M.renderOpts.fetchMetrics;let i=M.renderOpts.pendingWaitUntil;i&&c.waitUntil&&(c.waitUntil(i),i=void 0);let j=M.renderOpts.collectedTags;if(!F)return await (0,o.I)(N,O,e,M.renderOpts.pendingWaitUntil),null;{let a=await e.blob(),b=(0,p.toNodeOutgoingHttpHeaders)(e.headers);j&&(b[r.NEXT_CACHE_TAGS_HEADER]=j),!b["content-type"]&&a.type&&(b["content-type"]=a.type);let c=void 0!==M.renderOpts.collectedRevalidate&&!(M.renderOpts.collectedRevalidate>=r.INFINITE_CACHE)&&M.renderOpts.collectedRevalidate,d=void 0===M.renderOpts.collectedExpire||M.renderOpts.collectedExpire>=r.INFINITE_CACHE?void 0:M.renderOpts.collectedExpire;return{value:{kind:t.CachedRouteKind.APP_ROUTE,status:e.status,body:Buffer.from(await a.arrayBuffer()),headers:b},cacheControl:{revalidate:c,expire:d}}}}catch(b){throw(null==f?void 0:f.isStale)&&await x.onRequestError(a,b,{routerKind:"App Router",routePath:e,routeType:"route",revalidateReason:(0,n.c)({isRevalidate:I,isOnDemandRevalidate:B})},A),b}},l=await x.handleResponse({req:a,nextConfig:w,cacheKey:G,routeKind:f.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:z,isRoutePPREnabled:!1,isOnDemandRevalidate:B,revalidateOnlyGenerated:C,responseGenerator:k,waitUntil:c.waitUntil});if(!F)return null;if((null==l||null==(i=l.value)?void 0:i.kind)!==t.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==l||null==(j=l.value)?void 0:j.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});(0,h.getRequestMeta)(a,"minimalMode")||b.setHeader("x-nextjs-cache",B?"REVALIDATED":l.isMiss?"MISS":l.isStale?"STALE":"HIT"),y&&b.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let m=(0,p.fromNodeOutgoingHttpHeaders)(l.value.headers);return(0,h.getRequestMeta)(a,"minimalMode")&&F||m.delete(r.NEXT_CACHE_TAGS_HEADER),!l.cacheControl||b.getHeader("Cache-Control")||m.get("Cache-Control")||m.set("Cache-Control",(0,q.getCacheControlHeader)(l.cacheControl)),await (0,o.I)(N,O,new Response(l.value.body,{headers:m,status:l.value.status||200})),null};L?await g(L):await K.withPropagatedContext(a.headers,()=>K.trace(m.BaseServerSpan.handleRequest,{spanName:`${J} ${a.url}`,kind:i.SpanKind.SERVER,attributes:{"http.method":J,"http.target":a.url}},g))}catch(b){if(b instanceof s.NoFallbackError||await x.onRequestError(a,b,{routerKind:"App Router",routePath:E,routeType:"route",revalidateReason:(0,n.c)({isRevalidate:I,isOnDemandRevalidate:B})}),F)throw b;return await (0,o.I)(N,O,new Response(null,{status:500})),null}}},76760:a=>{a.exports=require("node:path")},77598:a=>{a.exports=require("node:crypto")},78474:a=>{a.exports=require("node:events")},79428:a=>{a.exports=require("buffer")},79551:a=>{a.exports=require("url")},79646:a=>{a.exports=require("child_process")},81115:a=>{a.exports=require("constants")},81630:a=>{a.exports=require("http")},83997:a=>{a.exports=require("tty")},86439:a=>{a.exports=require("next/dist/shared/lib/no-fallback-error.external")},91645:a=>{a.exports=require("net")},94735:a=>{a.exports=require("events")}};var b=require("../../../webpack-runtime.js");b.C(a);var c=b.X(0,[331,800,711,84],()=>b(b.s=73865));module.exports=c})();