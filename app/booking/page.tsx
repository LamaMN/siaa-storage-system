'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Loader from '@/components/Loader';
import LanguageToggle from '@/app/components/LanguageToggle';
import { translations, type Language } from '@/lib/translations';

function getCurrentLang(): Language {
    if (typeof document === 'undefined') return 'en';

    const match = document.cookie.match(/(?:^|; )lang=([^;]+)/);
    return match?.[1] === 'ar' ? 'ar' : 'en';
}

function usePageLanguage(): Language {
    const [lang, setLang] = useState<Language>(() => getCurrentLang());

    useEffect(() => {
        setLang(getCurrentLang());
    }, []);

    return lang;
}

function BookingMapLoading() {
    const lang = usePageLanguage();
    const t = translations[lang];

    return (
        <div
            style={{
                height: '200px',
                width: '100%',
                background: '#edf2f7',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
            {t.loadingMap}
        </div>
    );
}

const BookingMap = dynamic(() => import('./BookingMap'), {
    ssr: false,
    loading: () => <BookingMapLoading />
});

const LOGISTICS_PRICES = {
    aramex: 50,
    smsa: 60,
    spl: 55
};

function BookingPageContent({ lang }: { lang: Language }) {
    const t = translations[lang];

    const searchParams = useSearchParams();
    const router = useRouter();
    const spaceId = parseInt(searchParams.get('spaceId') || '0', 10);

    const [space, setSpace] = useState<any>(null);
    const [reviews, setReviews] = useState<any[]>([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [logistics, setLogistics] = useState('self_dropoff');
    const [logisticsCompany, setLogisticsCompany] = useState('');
    const [nationalAddress, setNationalAddress] = useState('');
    const [pickupTime, setPickupTime] = useState('');

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!spaceId) {
            setError(t.noSpaceSelected);
            setLoading(false);
            return;
        }

        async function fetchSpace() {
            try {
                const res = await fetch(`/api/spaces/${spaceId}`);
                if (!res.ok) throw new Error('Not found');
                const data = await res.json();
                setSpace(data.space || data);

                fetch(`/api/spaces/${spaceId}/reviews`)
                    .then(r => r.json())
                    .then(d => setReviews(d.reviews || []))
                    .catch(() => { });
            } catch (err) {
                setError(t.couldNotLoadSpace);
            } finally {
                setLoading(false);
            }
        }

        fetchSpace();

        const today = new Date().toISOString().split('T')[0];
        setStartDate(today);
        setEndDate(today);
    }, [spaceId, t.noSpaceSelected, t.couldNotLoadSpace]);

    const calculateTotal = () => {
        if (!startDate || !endDate || !space) return null;

        const startD = new Date(startDate);
        const endD = new Date(endDate);

        if (isNaN(startD.getTime()) || isNaN(endD.getTime()) || endD <= startD) {
            return null;
        }

        const days = Math.ceil((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24));
        const months = days / 30;

        let total = 0;
        if (days >= 28 && space.PricePerMonth) {
            total = Math.ceil(months) * parseFloat(space.PricePerMonth);
        } else if (days >= 7 && space.PricePerWeek) {
            const weeks = days / 7;
            total = Math.ceil(weeks) * parseFloat(space.PricePerWeek);
        } else if (space.PricePerDay) {
            total = days * parseFloat(space.PricePerDay);
        } else if (space.PricePerMonth) {
            total = Math.max(1, Math.ceil(months)) * parseFloat(space.PricePerMonth);
        }

        if (logistics === 'partner_pickup' && logisticsCompany && LOGISTICS_PRICES[logisticsCompany as keyof typeof LOGISTICS_PRICES]) {
            total += LOGISTICS_PRICES[logisticsCompany as keyof typeof LOGISTICS_PRICES];
        }

        return { total, days };
    };

    const formatPrice = (value: number) => {
        return Number(value).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
    };

    const costDetails = calculateTotal();

    const handleSubmit = async () => {
        setError('');

        if (!startDate || !endDate) {
            return setError(t.selectStartEndDates);
        }

        if (new Date(endDate) <= new Date(startDate)) {
            return setError(t.endDateAfterStart);
        }

        if (logistics === 'partner_pickup') {
            if (!logisticsCompany) return setError(t.selectLogisticsCompany);

            const trimmedAddress = nationalAddress.trim();
            if (!trimmedAddress) return setError(t.enterNationalAddress);

            const addressRegex = /^[A-Za-z]{4}\d{4}$/;
            if (!addressRegex.test(trimmedAddress)) {
                return setError(t.nationalAddressFormat);
            }

            if (!pickupTime) return setError(t.selectPickupTime);
        }

        const token = localStorage.getItem('siaaToken');
        const userDataStr = localStorage.getItem('siaaUser');

        if (!token || !userDataStr) {
            router.push(`/login?redirect=booking?spaceId=${spaceId}`);
            return;
        }

        const user = JSON.parse(userDataStr);
        setSubmitting(true);

        const payloadLogistics = logistics;
        const specialRequestsData =
            logistics === 'partner_pickup'
                ? JSON.stringify({
                    type: 'partner_pickup',
                    company: logisticsCompany,
                    address: nationalAddress.trim(),
                    time: pickupTime
                })
                : '';

        try {
            const res = await fetch(`/api/bookings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                    'x-user-id': String(user.id || user.SeekerID),
                    'x-user-type': user.userType || 'seeker'
                },
                body: JSON.stringify({
                    spaceId,
                    startDate,
                    endDate,
                    logisticsOption: payloadLogistics,
                    specialRequests: specialRequestsData,
                    totalAmount: costDetails?.total
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || data.message || t.bookingFailed);

            const newBookingId = data.bookingId || data.BookingID;
            router.push(`/payment?bookingId=${newBookingId}`);
        } catch (err: any) {
            setError(err.message || t.genericTryAgain);
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
                <Loader />
            </div>
        );
    }

    if (error && !space) {
        return (
            <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
                <div style={{ padding: '60px', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '48px', color: '#e63946' }}></i>
                    <h2 style={{ marginTop: '20px', color: '#1a365d' }}>{t.oops}</h2>
                    <p style={{ marginTop: '10px', color: '#718096' }}>{error}</p>
                    <button onClick={() => router.push('/search')} className="btn btn-dark" style={{ marginTop: '20px' }}>
                        {t.backToSearch}
                    </button>
                </div>
            </div>
        );
    }

    const addr = [space?.AddressLine1, space?.City].filter(Boolean).join(', ');
    const fullAddress = space?.Landmark ? `${addr} · ${t.near} ${space.Landmark}` : addr;
    const providerName =
        space?.BusinessName ||
        `${space?.ProviderFirstName || ''} ${space?.ProviderLastName || ''}`.trim() ||
        '—';

    return (
        <section className="booking-section">
            <div className="container">
                <h1 className="booking-title">{t.completeYourRequest}</h1>

                <div className="booking-layout">
                    <div className="booking-main-card">
                        <div className="booking-space-header">
                            <h2 className="booking-space-type">{space?.Title || space?.SpaceType || t.storageSpace}</h2>
                            <p className="booking-space-address">{fullAddress}</p>
                            <p className="booking-space-date">
                                {space?.CreatedAt &&
                                    `${t.listed} ${new Date(space.CreatedAt).toLocaleDateString(
                                        lang === 'ar' ? 'ar-SA' : 'en-SA',
                                        { month: 'long', year: 'numeric' }
                                    )}`}
                            </p>
                        </div>

                        <div className="booking-meta-grid">
                            <div className="booking-meta-item">
                                <span className="booking-meta-label">{t.rent}</span>
                                <span className="booking-meta-value">
                                    {space?.PricePerMonth ? `${formatPrice(space.PricePerMonth)} ${t.sarPerMonth}` : '—'}
                                </span>
                            </div>
                            <div className="booking-meta-item">
                                <span className="booking-meta-label">{t.location}</span>
                                <span className="booking-meta-value">{space?.City || 'Jeddah'}</span>
                            </div>
                            <div className="booking-meta-item">
                                <span className="booking-meta-label">{t.space}</span>
                                <span className="booking-meta-value">{space?.Size ? `${space.Size} m²` : '—'}</span>
                            </div>
                        </div>

                        <div className="booking-tags">
                            {space?.ClimateControlled && <span className="booking-tag">❄️ {t.climateControlled}</span>}
                            {space?.SecuritySystem && <span className="booking-tag">🔒 {t.security}</span>}
                            {space?.ParkingAvailable && <span className="booking-tag">🚗 {t.parking}</span>}
                            {space?.LoadingAssistance && <span className="booking-tag">🏗️ {t.loadingHelp}</span>}
                            {space?.AccessType && <span className="booking-tag">⏰ {space.AccessType}</span>}
                        </div>

                        {reviews.length > 0 && (
                            <div className="booking-section-block">
                                <h3 className="booking-section-title">{t.reviewsForThisSpace}</h3>
                                {reviews.slice(0, 2).map((r, i) => (
                                    <p key={i} className={`booking-review-line ${i > 0 ? 'secondary' : ''}`}>
                                        <span className="booking-stars">{'★'.repeat(r.Rating || 5)}</span>
                                        <span className="booking-review-text">
                                            "{r.Comment || t.greatSpace}" — {r.ReviewerName || t.verifiedUser}
                                        </span>
                                    </p>
                                ))}
                            </div>
                        )}

                        <div className="booking-section-block">
                            <h3 className="booking-section-title">{t.owner}</h3>
                            <div className="booking-owner-table">
                                <div className="booking-owner-row booking-owner-header">
                                    <span>{t.name}</span>
                                    <span>{t.phone}</span>
                                    <span>{t.email}</span>
                                </div>
                                <div className="booking-owner-row">
                                    <span>{providerName}</span>
                                    <span>{space?.ProviderPhone || '—'}</span>
                                    <span>{space?.ProviderEmail || '—'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="booking-section-block">
                            <h3 className="booking-section-title">{t.rentalDates}</h3>
                            <div className="booking-dates-grid">
                                <div className="filter-field filter-field--date">
                                    <span className="filter-field__label">{t.startDate}</span>
                                    <input
                                        type="date"
                                        className="filter-text-input"
                                        value={startDate}
                                        min={new Date().toISOString().split('T')[0]}
                                        onChange={e => {
                                            setStartDate(e.target.value);
                                            if (endDate && e.target.value > endDate) setEndDate(e.target.value);
                                        }}
                                    />
                                </div>

                                <div className="filter-field filter-field--date">
                                    <span className="filter-field__label">{t.endDate}</span>
                                    <input
                                        type="date"
                                        className="filter-text-input"
                                        value={endDate}
                                        min={startDate || new Date().toISOString().split('T')[0]}
                                        onChange={e => setEndDate(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="booking-section-block">
                            <h3 className="booking-section-title">{t.logistics}</h3>
                            <p className="booking-section-subtitle">{t.chooseHowToMoveItems}</p>

                            <div className="booking-logistics-options">
                                <label
                                    className={`booking-logistics-option ${logistics === 'self_dropoff' ? 'selected' : ''}`}
                                    style={{
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '12px',
                                        padding: '16px',
                                        border: logistics === 'self_dropoff' ? '2px solid #ff6b35' : '1px solid #e2e8f0',
                                        borderRadius: '12px',
                                        marginBottom: '12px'
                                    }}
                                >
                                    <input
                                        type="radio"
                                        name="logisticsOption"
                                        value="self_dropoff"
                                        checked={logistics === 'self_dropoff'}
                                        onChange={() => setLogistics('self_dropoff')}
                                        style={{ marginTop: '5px', cursor: 'pointer', accentColor: '#ff6b35' }}
                                    />
                                    <div className="booking-logistics-content">
                                        <div className="booking-logistics-title-row">
                                            <span className="booking-logistics-title" style={{ fontWeight: 'bold' }}>
                                                {t.selfDropOff}
                                            </span>
                                        </div>
                                        <p className="booking-logistics-description" style={{ marginTop: '4px', color: '#718096' }}>
                                            {t.selfDropOffDesc}
                                        </p>
                                    </div>
                                </label>

                                <label
                                    className={`booking-logistics-option ${logistics === 'partner_pickup' ? 'selected' : ''}`}
                                    style={{
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '12px',
                                        padding: '16px',
                                        border: logistics === 'partner_pickup' ? '2px solid #ff6b35' : '1px solid #e2e8f0',
                                        borderRadius: '12px'
                                    }}
                                >
                                    <input
                                        type="radio"
                                        name="logisticsOption"
                                        value="partner_pickup"
                                        checked={logistics === 'partner_pickup'}
                                        onChange={() => setLogistics('partner_pickup')}
                                        style={{ marginTop: '5px', cursor: 'pointer', accentColor: '#ff6b35' }}
                                    />
                                    <div className="booking-logistics-content" style={{ width: '100%' }}>
                                        <div className="booking-logistics-title-row">
                                            <span className="booking-logistics-title" style={{ fontWeight: 'bold' }}>
                                                {t.partnerPickup}
                                            </span>
                                        </div>

                                        {logistics === 'partner_pickup' && (
                                            <div
                                                style={{ marginTop: '16px', paddingLeft: '28px' }}
                                                onClick={e => e.preventDefault()}
                                            >
                                                <div
                                                    style={{
                                                        marginBottom: '16px',
                                                        display: 'grid',
                                                        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                                                        gap: '12px'
                                                    }}
                                                >
                                                    {Object.entries(LOGISTICS_PRICES).map(([key, price]) => (
                                                        <div
                                                            key={key}
                                                            onClick={e => {
                                                                e.preventDefault();
                                                                setLogisticsCompany(key);
                                                            }}
                                                            style={{
                                                                padding: '12px',
                                                                border: logisticsCompany === key ? '2px solid #4a5568' : '1px solid #e2e8f0',
                                                                borderRadius: '8px',
                                                                textAlign: 'center',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                alignItems: 'center',
                                                                gap: '8px',
                                                                background: logisticsCompany === key ? '#f8fafc' : '#fff'
                                                            }}
                                                        >
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <input
                                                                    type="radio"
                                                                    checked={logisticsCompany === key}
                                                                    onChange={() => { }}
                                                                    style={{ cursor: 'pointer', accentColor: '#ff6b35' }}
                                                                />
                                                                <img
                                                                    src={`/Media/${key === 'aramex' ? 'Aramex.png' : key === 'smsa' ? 'SMSA.png' : 'SPL.png'}`}
                                                                    alt={key}
                                                                    style={{ height: '24px', objectFit: 'contain' }}
                                                                />
                                                                <span style={{ fontWeight: 700, fontSize: '14px', color: '#1a365d' }}>
                                                                    {key === 'aramex' ? 'Aramex' : key === 'smsa' ? 'SMSA' : 'SPL'}
                                                                </span>
                                                            </div>
                                                            <span style={{ fontWeight: 600, fontSize: '13px', color: '#1a365d' }}>
                                                                {price} {t.sar}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div style={{ marginBottom: '16px' }}>
                                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>
                                                        {t.nationalAddress}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={nationalAddress}
                                                        onChange={e => setNationalAddress(e.target.value)}
                                                        placeholder={t.nationalAddressPlaceholder}
                                                        className="filter-text-input"
                                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e0' }}
                                                    />
                                                </div>

                                                <div>
                                                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#4a5568', marginBottom: '6px' }}>
                                                        {t.preferredPickupTime}
                                                    </label>
                                                    <div style={{ display: 'flex', gap: '12px' }}>
                                                        <label
                                                            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', cursor: 'pointer' }}
                                                            onClick={e => {
                                                                e.preventDefault();
                                                                setPickupTime('9am-3pm');
                                                            }}
                                                        >
                                                            <input
                                                                type="radio"
                                                                checked={pickupTime === '9am-3pm'}
                                                                onChange={() => { }}
                                                                style={{ accentColor: '#ff6b35' }}
                                                            />
                                                            {t.pickupSlotOne}
                                                        </label>

                                                        <label
                                                            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', cursor: 'pointer' }}
                                                            onClick={e => {
                                                                e.preventDefault();
                                                                setPickupTime('4pm-10pm');
                                                            }}
                                                        >
                                                            <input
                                                                type="radio"
                                                                checked={pickupTime === '4pm-10pm'}
                                                                onChange={() => { }}
                                                                style={{ accentColor: '#ff6b35' }}
                                                            />
                                                            {t.pickupSlotTwo}
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </label>
                            </div>
                        </div>

                        {error && (
                            <div className="alert alert-error" style={{ marginBottom: '20px', marginTop: '16px' }}>
                                <i className="fa-solid fa-circle-exclamation"></i>
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="booking-actions">
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="btn btn-dark btn-large booking-submit"
                            >
                                {submitting ? (
                                    <>
                                        <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                                        {t.processing}
                                    </>
                                ) : (
                                    t.proceedToPayment
                                )}
                            </button>
                        </div>
                    </div>

                    <aside className="booking-side-card">
                        <h3 className="booking-side-title">{t.location}</h3>
                        <div className="booking-map" style={{ height: '200px', borderRadius: '12px', overflow: 'hidden' }}>
                            {space?.Latitude && space?.Longitude ? (
                                <BookingMap lat={parseFloat(space.Latitude)} lng={parseFloat(space.Longitude)} />
                            ) : (
                                <img
                                    src="/Media/TempBookingMap.png.png"
                                    alt={t.mapPlaceholder}
                                    className="booking-map-img"
                                    style={{ height: '200px', width: '100%', objectFit: 'cover' }}
                                />
                            )}
                        </div>

                        <div className="booking-side-summary">
                            <div className="booking-side-row">
                                <span className="booking-side-label">{t.space}</span>
                                <span className="booking-side-value">{space?.SpaceType || t.storage}</span>
                            </div>

                            <div className="booking-side-row">
                                <span className="booking-side-label">{t.dates}</span>
                                <span className="booking-side-value">
                                    {startDate && endDate && costDetails
                                        ? `${new Date(startDate).toLocaleDateString(
                                            lang === 'ar' ? 'ar-SA' : 'en-SA',
                                            { day: 'numeric', month: 'short' }
                                        )} – ${new Date(endDate).toLocaleDateString(
                                            lang === 'ar' ? 'ar-SA' : 'en-SA',
                                            { day: 'numeric', month: 'short' }
                                        )} (${costDetails.days} ${t.days})`
                                        : t.selectYourDates}
                                </span>
                            </div>

                            {logistics === 'partner_pickup' && logisticsCompany && (
                                <div className="booking-side-row">
                                    <span className="booking-side-label">
                                        {t.logistics} ({logisticsCompany.toUpperCase()})
                                    </span>
                                    <span className="booking-side-value">
                                        {LOGISTICS_PRICES[logisticsCompany as keyof typeof LOGISTICS_PRICES]} {t.sar}
                                    </span>
                                </div>
                            )}

                            <div className="booking-side-row">
                                <span className="booking-side-label">{t.estimatedTotal}</span>
                                <span className="booking-side-total">
                                    {costDetails ? `${formatPrice(costDetails.total)} ${t.sar}` : '—'}
                                </span>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </section>
    );
}

export default function BookingPage() {
    const [lang, setLang] = useState<Language | null>(null);

    useEffect(() => {
        setLang(getCurrentLang());
    }, []);

    if (!lang) {
        return (
            <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
                <Loader />
            </div>
        );
    }

    const t = translations[lang];

    return (
        <>
            <header className="header">
                <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '6px 20px' }}>
                    <LanguageToggle />
                </div>

                <div className="container">
                    <div className="header-content">


                        <nav className="nav">
                            <a href="/dashboard">{t.dashboard}</a>
                            <a href="#about">{t.about}</a>
                            <a href="#features">{t.features}</a>
                            <a href="#how-it-works">{t.howItWorks}</a>
                        </nav>

                        <div className="logo">
                            <img src="/Media/Logo.png" alt={t.logoAlt} className="logo-img" />
                        </div>
                    </div>
                </div>
            </header>

            <Suspense
                fallback={
                    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
                        <Loader />
                    </div>
                }
            >
                <BookingPageContent key={lang} lang={lang} />
            </Suspense>

            <footer className="footer">
                <div className="container">
                    <div className="footer-content">
                        <div className="social-icons">
                            <a href="#" aria-label={t.facebook}><i className="fa-brands fa-facebook"></i></a>
                            <a href="#" aria-label={t.linkedin}><i className="fa-brands fa-linkedin-in"></i></a>
                            <a href="#" aria-label={t.x}><i className="fa-brands fa-x-twitter"></i></a>
                            <a href="#" aria-label={t.instagram}><i className="fa-brands fa-instagram"></i></a>
                        </div>
                        <div className="footer-logo">
                            <img src="/Media/Logo.png" alt={t.logoAlt} className="footer-logo-img" />
                        </div>
                    </div>
                </div>
            </footer>
        </>
    );
}