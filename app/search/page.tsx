'use client';
import { useState, useEffect, FormEvent, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Loader from '@/components/Loader';

const SearchMap = dynamic(() => import('./SearchMap'), {
    ssr: false,
    loading: () => <div style={{ height: '280px', width: '100%', background: '#f7fafc', borderRadius: '14px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a0aec0' }}><p>Loading Map...</p></div>
});

const Space3DVisualizer = dynamic(() => import('../components/Space3DVisualizer'), {
    ssr: false,
    loading: () => <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}><p>Loading 3D Visualizer...</p></div>
});


interface SpaceResult {
    SpaceID: number;
    Title: string;
    SpaceType?: string;
    Size?: number;
    Width?: number;
    Length?: number;
    Height?: number;
    PricePerMonth?: number;
    PricePerWeek?: number;
    PricePerDay?: number;
    City?: string;
    Neighborhood?: string;
    AddressLine1?: string;
    AvgRating?: number;
    TotalReviews?: number;
    ClimateControlled?: boolean;
    SecuritySystem?: boolean;
    ParkingAvailable?: boolean;
    MatchScore?: number;
    FirstImageID?: number;
}

const SAUDI_CITIES = [
    'Jeddah', 'Riyadh', 'Dammam', 'Mecca', 'Medina',
    'Khobar', 'Abha', 'Tabuk', 'Taif', 'Hail',
];

export default function SearchPage() {
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [selectedCity, setSelectedCity] = useState('');
    const [spaces, setSpaces] = useState<SpaceResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalSearchCount, setTotalSearchCount] = useState(0);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [modalSpace, setModalSpace] = useState<SpaceResult | null>(null);
    const [show3DVisualizer, setShow3DVisualizer] = useState(false);
    const [modalImages, setModalImages] = useState<number[]>([]);
    const [modalImageIndex, setModalImageIndex] = useState(0);
    const [showLoadMore, setShowLoadMore] = useState(false);
    const lastCardRef = useRef<HTMLElement | null>(null);
    const LIMIT = 12;

    // Reviews state
    const [modalView, setModalView] = useState<'details' | 'reviews'>('details');
    const [spaceReviews, setSpaceReviews] = useState<Array<{
        ReviewID: number;
        BookingID: number;
        ReviewerSeekerID: number;
        Rating: number;
        Comment?: string;
        ProviderResponse?: string;
        ProviderResponseDate?: string;
        HelpfulCount: number;
        CreatedAt: string;
        SeekerFirstName?: string;
        SeekerLastName?: string;
        HasProfilePicture?: boolean;
    }>>([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [newRating, setNewRating] = useState(0);
    const [newComment, setNewComment] = useState('');
    const [hoverRating, setHoverRating] = useState(0);
    const [submitReviewLoading, setSubmitReviewLoading] = useState(false);
    const [reviewError, setReviewError] = useState('');

    const [filters, setFilters] = useState({
        city: '',
        sizeRange: '',
        minSize: '',
        maxSize: '',
        maxPrice: 5000,
        startDate: '',
        spaceType: '',
        rentalDuration: '',
        // Environment checkboxes (all 8)
        climateControlled: false,
        temperatureControlled: false,
        humidityControlled: false,
        dry: false,
        security: false,
        parking: false,
        loadingAssistance: false,
        access24: false,
        // Sort
        sortBy: 'match',
    });

    const [priceRange, setPriceRange] = useState({ min: 80, max: 5000 });
    const [priceRangeLoading, setPriceRangeLoading] = useState(true);
    const [availableNeighborhoods, setAvailableNeighborhoods] = useState<string[]>([]);

    useEffect(() => {
        let currentCity = '';
        const storedCity = localStorage.getItem('siaa_city');
        if (!storedCity) {
            setShowLocationModal(true);
        } else {
            currentCity = storedCity;
            setSelectedCity(storedCity);
            setFilters(f => ({ ...f, city: storedCity }));
        }

        // Fetch dynamic price range
        fetch('/api/spaces/pricerange')
            .then(res => res.json())
            .then(data => {
                if (data && typeof data.minPrice === 'number' && typeof data.maxPrice === 'number') {
                    // Update boundaries and default the knob to maxPrice
                    const min = Math.max(0, data.minPrice);
                    const max = Math.max(min + 1, data.maxPrice);
                    setPriceRange({ min, max });
                    setFilters(f => ({ ...f, maxPrice: max }));

                    // Trigger search with the fetched city and max price
                    performSearch(undefined, currentCity, max);
                } else {
                    performSearch(undefined, currentCity);
                }
            })
            .catch(err => {
                console.error(err);
                performSearch(undefined, currentCity);
            })
            .finally(() => setPriceRangeLoading(false));

        const handleOpenModal = (e: Event) => {
            const ce = e as CustomEvent;
            const spaceId = ce.detail;
            setSpaces(currentSpaces => {
                const found = currentSpaces.find(s => s.SpaceID === spaceId);
                if (found) openDetailsModal(found);
                return currentSpaces;
            });
        };
        window.addEventListener('openSpaceModal', handleOpenModal);

        // Fetch available neighborhoods
        fetch('/api/spaces/neighborhoods')
            .then(res => res.json())
            .then(data => {
                const fetchedNeighborhoods = data.data?.neighborhoods || data.neighborhoods;
                if (fetchedNeighborhoods) {
                    setAvailableNeighborhoods(fetchedNeighborhoods);
                }
            })
            .catch(err => console.error('Error fetching neighborhoods:', err));

        return () => window.removeEventListener('openSpaceModal', handleOpenModal);
    }, []);

    function handleCitySelect(city: string) {
        localStorage.setItem('siaa_city', city);
        setSelectedCity(city);
        setFilters(f => ({ ...f, city }));
        setShowLocationModal(false);
    }

    function handleSizeChange(v: string) {
        const sizeMap: Record<string, { min?: number; max?: number }> = {
            small: { min: 1, max: 3 },
            medium: { min: 4, max: 7 },
            large: { min: 8, max: 12 },
            xl: { min: 13 },
        };
        const range = sizeMap[v] || {};
        setFilters(f => ({
            ...f,
            sizeRange: v,
            minSize: range.min ? String(range.min) : '',
            maxSize: range.max ? String(range.max) : '',
        }));
    }

    function buildSearchParams(overrideCity?: string, overrideMaxPrice?: number, overrideSortBy?: string, page = 1) {
        const params = new URLSearchParams();
        const searchCity = overrideCity !== undefined ? overrideCity : filters.city;
        const searchMaxPrice = overrideMaxPrice !== undefined ? overrideMaxPrice : filters.maxPrice;
        const searchSortBy = overrideSortBy !== undefined ? overrideSortBy : filters.sortBy;

        if (searchCity) params.set('city', searchCity);
        if (filters.spaceType) params.set('spaceType', filters.spaceType);
        if (searchMaxPrice !== undefined) params.set('maxPrice', String(searchMaxPrice));
        if (filters.minSize) params.set('minSize', filters.minSize);
        if (filters.maxSize) params.set('maxSize', filters.maxSize);
        if (filters.climateControlled || filters.temperatureControlled || filters.humidityControlled) params.set('climateControlled', '1');
        if (filters.security) params.set('security', '1');
        if (filters.parking) params.set('parking', '1');
        if (filters.loadingAssistance) params.set('loadingAssistance', '1');
        if (filters.startDate) params.set('startDate', filters.startDate);
        params.set('sortBy', searchSortBy);
        params.set('page', String(page));
        params.set('limit', String(LIMIT));
        return params;
    }

    async function performSearch(e?: FormEvent, overrideCity?: string, overrideMaxPrice?: number, overrideSortBy?: string) {
        if (e) e.preventDefault();
        setLoading(true);
        setHasSearched(true);
        setCurrentPage(1);
        setHasMore(false);

        const params = buildSearchParams(overrideCity, overrideMaxPrice, overrideSortBy, 1);

        try {
            const res = await fetch(`/api/spaces?${params.toString()}`);
            const json = await res.json();
            const data = json.data || json; // Handle both cases based on API style
            const results: SpaceResult[] = data.spaces || [];
            if (data.totalCount !== undefined) {
                setTotalSearchCount(data.totalCount);
            }
            setSpaces(results);
            setHasMore(results.length === LIMIT);
        } catch (err) {
            console.error('Search error:', err);
        } finally {
            setLoading(false);
        }
    }

    async function loadMore() {
        setLoadingMore(true);
        const nextPage = currentPage + 1;
        const params = buildSearchParams(undefined, undefined, undefined, nextPage);

        try {
            const res = await fetch(`/api/spaces?${params.toString()}`);
            const json = await res.json();
            const data = json.data || json;
            const results: SpaceResult[] = data.spaces || [];
            setSpaces(prev => [...prev, ...results]);
            setCurrentPage(nextPage);
            setHasMore(results.length === LIMIT);
        } catch (err) {
            console.error('Load more error:', err);
        } finally {
            setLoadingMore(false);
        }
    }

    function handleSearch(e: FormEvent) {
        performSearch(e);
    }

    // Show Load More button only when last card is in view
    const lastCardCallbackRef = useCallback((node: HTMLElement | null) => {
        lastCardRef.current = node;
        if (!node) return;
        const observer = new IntersectionObserver(
            ([entry]) => setShowLoadMore(entry.isIntersecting),
            { threshold: 0.3 }
        );
        observer.observe(node);
        return () => observer.disconnect();
    }, [spaces.length]);

    function renderStars(rating: number) {
        return Array.from({ length: 5 }).map((_, i) => (
            <span key={i} style={{ color: i < Math.round(rating) ? '#f59e0b' : '#d1d5db' }}>★</span>
        ));
    }

    function timeAgo(dateStr: string) {
        const now = new Date();
        const date = new Date(dateStr);
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        if (seconds < 60) return 'just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}d ago`;
        const weeks = Math.floor(days / 7);
        if (weeks < 4) return `${weeks}w ago`;
        const months = Math.floor(days / 30);
        if (months < 12) return `${months}mo ago`;
        const years = Math.floor(days / 365);
        return `${years}y ago`;
    }

    async function fetchSpaceReviews(spaceId: number) {
        setReviewsLoading(true);
        try {
            const res = await fetch(`/api/spaces/${spaceId}/reviews`);
            const json = await res.json();
            setSpaceReviews(json.reviews || []);
        } catch (err) {
            console.error('Failed to fetch reviews:', err);
            setSpaceReviews([]);
        } finally {
            setReviewsLoading(false);
        }
    }

    function handleRatingClick(spaceId: number) {
        if (spaceReviews.length === 0) fetchSpaceReviews(spaceId);
        setModalView('reviews');
    }

    function openDetailsModal(space: SpaceResult) {
        setModalImageIndex(0);
        setModalImages(space.FirstImageID ? [space.FirstImageID] : []);
        setModalSpace(space);
        setModalView('details');
        setSpaceReviews([]);
        setNewRating(0);
        setNewComment('');
        setReviewError('');
        // Fetch all images for this space
        fetch(`/api/spaces/${space.SpaceID}/images`)
            .then(r => r.json())
            .then(d => { if (d.images) setModalImages(d.images.map((img: { ImageID: number }) => img.ImageID)); })
            .catch(() => {});
        // Pre-fetch reviews
        fetchSpaceReviews(space.SpaceID);
    }

    return (
        <>
            {/* Location modal */}
            {showLocationModal && (
                <div className="review-modal-overlay" style={{ zIndex: 1000 }}>
                    <div className="review-modal" style={{ maxWidth: '480px', width: '90%' }}>
                        <div className="review-modal-header">
                            <h3>Welcome to Si&apos;aa! 👋</h3>
                        </div>
                        <div className="review-modal-body">
                            <p style={{ marginBottom: '1rem' }}>To show you storage spaces near you, please select your city:</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                {SAUDI_CITIES.map(city => (
                                    <button
                                        key={city}
                                        className="btn btn-outline"
                                        onClick={() => handleCitySelect(city)}
                                        style={{ padding: '0.5rem', textAlign: 'center' }}
                                    >
                                        {city}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="review-modal-footer">
                            <button className="btn btn-outline" onClick={() => setShowLocationModal(false)}>
                                Skip for now
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="header">
                <div className="container">
                    <div className="header-content">
                        <nav className="nav">
                            <a href="/dashboard">Dashboard</a>
                            <a href="/#about">About</a>
                            <a href="/#features">Features</a>
                        </nav>
                        <div className="logo">
                            <img src="/Media/Logo.png" alt="Si'aa Logo" className="logo-img" />
                        </div>
                    </div>
                </div>
            </header>

            <section className="storage-search">
                <div className="container">
                    <h1 className="storage-search__title">Find the Right Storage Space</h1>
                    <p className="storage-search__subtitle">
                        Filter by size, price, and features to find a storage space that fits your needs.
                        {selectedCity && (
                            <>
                                <span style={{ color: '#ff6b35' }}> Showing results near <strong>{selectedCity}</strong>.</span>
                                <button
                                    style={{ marginLeft: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: '#ff6b35', textDecoration: 'underline' }}
                                    onClick={() => setShowLocationModal(true)}
                                >
                                    Change city
                                </button>
                            </>
                        )}
                    </p>

                    <div className="storage-search__layout">
                        {/* Left: Filters */}
                        <div className="storage-search__form-area">
                            <div className="filter-card">
                                <h2 className="filter-card__title">Search Filters</h2>
                                <form className="filter-form" onSubmit={handleSearch}>

                                    <div className="filter-grid">

                                        {/* Location / Neighborhood */}
                                        <div className="filter-field">
                                            <span className="filter-field__label">Location</span>
                                            <select
                                                name="location_neighborhood"
                                                className="filter-select-input"
                                                value={filters.city}
                                                onChange={e => setFilters(f => ({ ...f, city: e.target.value }))}
                                            >
                                                <option value="">Any neighborhood</option>
                                                {availableNeighborhoods.map(neighborhood => (
                                                    <option key={neighborhood} value={neighborhood}>{neighborhood}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Space Size */}
                                        <div className="filter-field">
                                            <span className="filter-field__label">Space Size (m²)</span>
                                            <select
                                                name="storage_size"
                                                className="filter-select-input"
                                                value={filters.sizeRange}
                                                onChange={e => handleSizeChange(e.target.value)}
                                            >
                                                <option value="">Any size</option>
                                                <option value="small">Small (1–3 m²)</option>
                                                <option value="medium">Medium (4–7 m²)</option>
                                                <option value="large">Large (8–12 m²)</option>
                                                <option value="xl">Extra Large (&gt;12 m²)</option>
                                            </select>
                                        </div>

                                        {/* Price Range */}
                                        <div className="filter-field filter-field--range">
                                            <div className="filter-field__range-header">
                                                <span className="filter-field__label">Price Range</span>
                                                <span className="filter-field__range-values">
                                                    {priceRangeLoading ? (
                                                        <span>- - -</span>
                                                    ) : (
                                                        <><span>{priceRange.min} SAR</span><span>{filters.maxPrice} SAR</span></>
                                                    )}
                                                </span>
                                            </div>
                                            {!priceRangeLoading && (
                                                <input
                                                    type="range"
                                                    name="price_max"
                                                    min={priceRange.min} max={priceRange.max} step="50"
                                                    value={filters.maxPrice || priceRange.max}
                                                    onChange={e => setFilters(f => ({ ...f, maxPrice: parseInt(e.target.value) }))}
                                                    className="filter-range-input"
                                                />
                                            )}
                                        </div>

                                        {/* Start Date */}
                                        <div className="filter-field filter-field--date">
                                            <span className="filter-field__label">Start Date</span>
                                            <input
                                                type="date"
                                                name="rental_date"
                                                className="filter-text-input"
                                                value={filters.startDate}
                                                onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))}
                                            />
                                        </div>

                                        {/* Space Type */}
                                        <div className="filter-field">
                                            <span className="filter-field__label">Space Type</span>
                                            <select
                                                name="space_type"
                                                className="filter-select-input"
                                                value={filters.spaceType}
                                                onChange={e => setFilters(f => ({ ...f, spaceType: e.target.value }))}
                                            >
                                                <option value="">Any type</option>
                                                <option value="room">Indoor room</option>
                                                <option value="garage">Garage / parking</option>
                                                <option value="warehouse">Warehouse corner</option>
                                                <option value="outdoor">Outdoor covered area</option>
                                                <option value="Basement">Basement</option>
                                            </select>
                                        </div>

                                        {/* Rental Duration */}
                                        <div className="filter-field">
                                            <span className="filter-field__label">Rental Duration</span>
                                            <select
                                                name="rental_duration"
                                                className="filter-select-input"
                                                value={filters.rentalDuration}
                                                onChange={e => setFilters(f => ({ ...f, rentalDuration: e.target.value }))}
                                            >
                                                <option value="">Any</option>
                                                <option value="daily">Daily</option>
                                                <option value="weekly">Weekly</option>
                                                <option value="monthly">Monthly</option>
                                            </select>
                                        </div>

                                    </div>

                                    {/* Environment / Features — all 8 from original */}
                                    <div className="environment-options">
                                        <label className="environment-option">
                                            <input type="checkbox" name="environment[]" value="climate"
                                                checked={filters.climateControlled}
                                                onChange={e => setFilters(f => ({ ...f, climateControlled: e.target.checked }))} />
                                            <span>Climate-controlled</span>
                                        </label>
                                        <label className="environment-option">
                                            <input type="checkbox" name="environment[]" value="temperature"
                                                checked={filters.temperatureControlled}
                                                onChange={e => setFilters(f => ({ ...f, temperatureControlled: e.target.checked }))} />
                                            <span>Temperature-controlled</span>
                                        </label>
                                        <label className="environment-option">
                                            <input type="checkbox" name="environment[]" value="humidity"
                                                checked={filters.humidityControlled}
                                                onChange={e => setFilters(f => ({ ...f, humidityControlled: e.target.checked }))} />
                                            <span>Humidity-controlled</span>
                                        </label>
                                        <label className="environment-option">
                                            <input type="checkbox" name="environment[]" value="dry"
                                                checked={filters.dry}
                                                onChange={e => setFilters(f => ({ ...f, dry: e.target.checked }))} />
                                            <span>Dry</span>
                                        </label>
                                        <label className="environment-option">
                                            <input type="checkbox" name="environment[]" value="secure"
                                                checked={filters.security}
                                                onChange={e => setFilters(f => ({ ...f, security: e.target.checked }))} />
                                            <span>Secure (security / CCTV)</span>
                                        </label>
                                        <label className="environment-option">
                                            <input type="checkbox" name="environment[]" value="parking"
                                                checked={filters.parking}
                                                onChange={e => setFilters(f => ({ ...f, parking: e.target.checked }))} />
                                            <span>Parking available</span>
                                        </label>
                                        <label className="environment-option">
                                            <input type="checkbox" name="environment[]" value="loading"
                                                checked={filters.loadingAssistance}
                                                onChange={e => setFilters(f => ({ ...f, loadingAssistance: e.target.checked }))} />
                                            <span>Loading assistance</span>
                                        </label>
                                        <label className="environment-option">
                                            <input type="checkbox" name="environment[]" value="access24"
                                                checked={filters.access24}
                                                onChange={e => setFilters(f => ({ ...f, access24: e.target.checked }))} />
                                            <span>24/7 access</span>
                                        </label>
                                    </div>

                                    <button type="submit" className="btn btn-dark btn-large filter-submit-btn">
                                        {loading ? 'Searching...' : 'Search Spaces'}
                                    </button>

                                </form>
                            </div>
                        </div>

                        {/* Right: Results */}
                        <aside className="storage-results">
                            <div className="storage-results__header">
                                <h2 className="storage-results__title">Results {hasSearched && `(${totalSearchCount})`}</h2>
                                <div className="sorting-control">
                                    <label htmlFor="sortBy" className="sorting-control__label">Sort by</label>
                                    <select
                                        id="sortBy"
                                        className="sorting-control__select"
                                        value={filters.sortBy}
                                        onChange={e => {
                                            const newSort = e.target.value;
                                            setFilters(f => ({ ...f, sortBy: newSort }));
                                            performSearch(undefined, undefined, undefined, newSort);
                                        }}
                                    >
                                        <option value="match">Match Score (Highest)</option>
                                        <option value="priceLow">Price (Lowest first)</option>
                                        <option value="priceHigh">Price (Highest first)</option>
                                        <option value="distance">Distance (Closest)</option>
                                    </select>
                                </div>
                            </div>

                            <SearchMap spaces={spaces} />

                            <div className="storage-results__list">
                                {loading && (
                                    <div style={{ padding: '2rem', textAlign: 'center' }}>
                                        <Loader />
                                    </div>
                                )}
                                {!loading && hasSearched && spaces.length === 0 && (
                                    <article className="storage-card" style={{ padding: '2rem', textAlign: 'center' }}>
                                        <p style={{ fontSize: '14px', color: '#718096' }}>no spaces available, try different values</p>
                                    </article>
                                )}
                                {!loading && !hasSearched && (
                                    <article className="storage-card" style={{ padding: '2rem', textAlign: 'center' }}>
                                        <p>Use the filters on the left to search for storage spaces.</p>
                                    </article>
                                )}
                                {!loading && spaces.map((space, index) => (
                                    <article
                                        className="storage-card is-visible"
                                        key={space.SpaceID}
                                        ref={index === spaces.length - 1 ? lastCardCallbackRef : undefined}
                                        onClick={() => openDetailsModal(space)}
                                        style={{ padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#fff', marginBottom: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', cursor: 'pointer', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
                                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)'; }}
                                    >
                                        <div className="storage-card__image" style={{ marginBottom: '10px' }}>
                                            {space.FirstImageID ? (
                                                <img
                                                    src={`/api/images/space/${space.FirstImageID}`}
                                                    alt={space.Title}
                                                    onError={(e) => { e.currentTarget.src = "/Media/space-placeholder.png"; e.currentTarget.style.objectFit = 'contain'; e.currentTarget.style.padding = '30px'; e.currentTarget.style.background = 'transparent'; }}
                                                    style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px' }}
                                                />
                                            ) : (
                                                <img
                                                    src="/Media/space-placeholder.png"
                                                    alt="Space Placeholder"
                                                    style={{ width: '100%', height: '140px', objectFit: 'contain', padding: '30px', background: 'transparent' }}
                                                />
                                            )}
                                        </div>
                                        <div className="space-card-content">
                                            <div className="space-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                                                <div>
                                                    <h3 className="space-card-title" style={{ fontSize: '15px', fontWeight: 700, color: '#1a365d', margin: '0 0 2px 0' }}>{space.Title}</h3>
                                                    <p className="space-card-location" style={{ fontSize: '12px', color: '#718096', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <i className="fa-solid fa-location-dot" style={{ color: '#ff6b35', fontSize: '11px' }}></i> {space.City}{space.AddressLine1 ? `, ${space.AddressLine1}` : ''}
                                                    </p>
                                                </div>
                                                <div className="space-card-price" style={{ textAlign: 'right', flexShrink: 0 }}>
                                                    <span className="price-amount" style={{ display: 'block', fontSize: '18px', fontWeight: 800, color: '#ff6b35' }}>{space.PricePerMonth || '?'} SAR</span>
                                                    <span className="price-unit" style={{ fontSize: '11px', color: '#a0aec0' }}>/ mo</span>
                                                </div>
                                            </div>

                                            <div className="space-card-meta" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
                                                <div className="space-meta-item" style={{ fontSize: '12px', color: '#4a5568', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <i className="fa-solid fa-star" style={{ color: '#ff6b35', fontSize: '10px' }}></i>
                                                    {space.AvgRating ? space.AvgRating.toFixed(1) : 'New'} ({space.TotalReviews || 0})
                                                </div>
                                                <div className="space-meta-item" style={{ fontSize: '12px', color: '#4a5568', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <i className="fa-solid fa-box" style={{ color: '#ff6b35', fontSize: '10px' }}></i>
                                                    {space.SpaceType} &middot; {space.Size} m²
                                                </div>
                                                {space.MatchScore !== undefined && (
                                                    <div className="space-meta-item match-score" style={{ fontSize: '12px', color: '#e8750a', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                                                        <i className="fa-solid fa-bolt" style={{ color: '#ff6b35', fontSize: '10px' }}></i>
                                                        {space.MatchScore}% Match
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-card-tags" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                                                {space.ClimateControlled && <span className="space-tag" style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '999px', background: '#fff5f0', color: '#ff6b35', border: '1px solid #ffd5c2' }}>🌡️ Climate</span>}
                                                {space.SecuritySystem && <span className="space-tag" style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '999px', background: '#fff5f0', color: '#ff6b35', border: '1px solid #ffd5c2' }}>🔒 Secure</span>}
                                                {space.ParkingAvailable && <span className="space-tag" style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '999px', background: '#fff5f0', color: '#ff6b35', border: '1px solid #ffd5c2' }}>🚗 Parking</span>}
                                            </div>

                                            <div className="space-card-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '10px', borderTop: '1px solid #f7fafc' }}>
                                                <button
                                                    className="btn btn-outline"
                                                    style={{ padding: '6px 14px', fontSize: '13px', fontWeight: 600, borderRadius: '6px', background: '#f8fafc', color: '#4a5568', border: '1px solid #e2e8f0', cursor: 'pointer' }}
                                                    onClick={(e) => { e.stopPropagation(); openDetailsModal(space); }}
                                                >
                                                    View Details
                                                </button>
                                                <a
                                                    href={`/booking?spaceId=${space.SpaceID}`}
                                                    className="btn btn-dark"
                                                    style={{ padding: '6px 14px', fontSize: '13px', fontWeight: 600, borderRadius: '6px', textDecoration: 'none', background: 'linear-gradient(135deg, #ff6b35 0%, #ff8c5a 100%)', color: '#fff' }}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    Book
                                                </a>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                                {hasMore && (
                                    <div style={{ textAlign: 'center', padding: '16px 0 8px', opacity: showLoadMore ? 1 : 0, transition: 'opacity 0.4s ease', pointerEvents: showLoadMore ? 'auto' : 'none' }}>
                                        <button
                                            onClick={loadMore}
                                            disabled={loadingMore}
                                            style={{
                                                padding: '12px 40px',
                                                borderRadius: '12px',
                                                background: '#f8fafc',
                                                color: '#718096',
                                                fontWeight: 700,
                                                fontSize: '15px',
                                                border: '1px solid #718096',
                                                cursor: loadingMore ? 'not-allowed' : 'pointer',
                                                opacity: loadingMore ? 0.6 : 1,
                                                boxShadow: 'none',
                                                transition: 'all 0.2s ease',
                                                minWidth: '200px',
                                            }}
                                        >
                                            {loadingMore ? (
                                                <><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>Loading...</>
                                            ) : (
                                                <><i className="fa-solid fa-chevron-down" style={{ marginRight: '8px' }}></i>Load More Spaces</>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </aside>
                    </div>
                </div>
            </section>

            {/* Space Details Modal */}
            {modalSpace && (
                <div className="review-modal-overlay" onClick={() => setModalSpace(null)} style={{ zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="review-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', width: '95%', maxHeight: '90vh', padding: '0', background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column' }}>

                        {/* Top Section: Image (Left) + Details/Reviews (Right) */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', borderBottom: '1px solid #e2e8f0', flex: '1 1 auto', overflow: 'hidden', minHeight: '320px' }}>
                            {/* Left Side: Image Gallery */}
                            <div style={{ flex: '1 1 300px', minHeight: '260px', background: '#f8fafc', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {modalImages.length > 0 ? (
                                    <>
                                        <img
                                            src={`/api/images/space/${modalImages[modalImageIndex]}`}
                                            alt={modalSpace.Title}
                                            onError={(e) => { e.currentTarget.src = "/Media/space-placeholder.png"; e.currentTarget.style.objectFit = 'contain'; e.currentTarget.style.padding = '40px'; e.currentTarget.style.background = '#f8fafc'; }}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }}
                                        />
                                        {modalImages.length > 1 && (
                                            <>
                                                <button onClick={() => setModalImageIndex(i => (i - 1 + modalImages.length) % modalImages.length)} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.45)', color: '#fff', border: 'none', borderRadius: '50%', width: '32px', height: '32px', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>‹</button>
                                                <button onClick={() => setModalImageIndex(i => (i + 1) % modalImages.length)} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.45)', color: '#fff', border: 'none', borderRadius: '50%', width: '32px', height: '32px', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>›</button>
                                                <div style={{ position: 'absolute', bottom: '8px', left: 0, width: '100%', display: 'flex', justifyContent: 'center', gap: '5px', zIndex: 2 }}>
                                                    {modalImages.map((_, i) => (
                                                        <span key={i} onClick={() => setModalImageIndex(i)} style={{ width: '7px', height: '7px', borderRadius: '50%', background: i === modalImageIndex ? '#fff' : 'rgba(255,255,255,0.45)', cursor: 'pointer', display: 'inline-block' }} />
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </>
                                ) : (
                                    <img src="/Media/space-placeholder.png" alt="Space Placeholder" style={{ width: '120px', height: '120px', objectFit: 'contain', opacity: 0.6 }} />
                                )}
                            </div>

                            {/* Right Side: Switchable Content */}
                            <div style={{ flex: '2 1 400px', padding: '24px', display: 'flex', flexDirection: 'column', overflow: 'auto', maxHeight: '420px' }}>
                                {/* Header (always visible) */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                    <div>
                                        <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#1a365d', margin: '0 0 8px 0', lineHeight: 1.2 }}>{modalSpace.Title}</h2>
                                        <p style={{ color: '#4a5568', margin: '0', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <i className="fa-solid fa-location-dot" style={{ color: '#ff6b35' }}></i>
                                            {modalSpace.City}{modalSpace.AddressLine1 ? `, ${modalSpace.AddressLine1}` : ''}
                                        </p>
                                    </div>
                                    <button onClick={() => setModalSpace(null)} style={{ background: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: '#a0aec0', cursor: 'pointer', flexShrink: 0 }}>&times;</button>
                                </div>

                                {/* Details View */}
                                {modalView === 'details' && (
                                    <>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', marginBottom: '24px', padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                            {modalSpace.SpaceType && (
                                                <div>
                                                    <span style={{ fontSize: '12px', color: '#718096', fontWeight: 600, display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type</span>
                                                    <div style={{ fontSize: '15px', color: '#1a365d', fontWeight: 600 }}><i className="fa-solid fa-box" style={{ color: '#a0aec0', marginRight: '6px' }}></i>{modalSpace.SpaceType}</div>
                                                </div>
                                            )}
                                            {modalSpace.Size && (
                                                <div>
                                                    <span style={{ fontSize: '12px', color: '#718096', fontWeight: 600, display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Size</span>
                                                    <div style={{ fontSize: '15px', color: '#1a365d', fontWeight: 600 }}><i className="fa-solid fa-ruler-combined" style={{ color: '#a0aec0', marginRight: '6px' }}></i>{modalSpace.Size} m²</div>
                                                </div>
                                            )}
                                            {modalSpace.AvgRating !== undefined && (
                                                <div>
                                                    <span style={{ fontSize: '12px', color: '#718096', fontWeight: 600, display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rating</span>
                                                    <div
                                                        onClick={() => handleRatingClick(modalSpace.SpaceID)}
                                                        style={{ fontSize: '15px', color: '#1a365d', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', textDecorationColor: '#f59e0b', textUnderlineOffset: '3px' }}
                                                    >
                                                        <i className="fa-solid fa-star" style={{ color: '#f59e0b', marginRight: '6px' }}></i>{modalSpace.AvgRating.toFixed(1)} <span style={{ fontSize: '12px', color: '#718096', fontWeight: 400 }}>({modalSpace.TotalReviews || 0})</span>
                                                    </div>
                                                </div>
                                            )}
                                            {modalSpace.MatchScore && (
                                                <div>
                                                    <span style={{ fontSize: '12px', color: '#718096', fontWeight: 600, display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Match</span>
                                                    <div style={{ fontSize: '15px', color: '#e8750a', fontWeight: 800 }}><i className="fa-solid fa-bolt" style={{ marginRight: '6px' }}></i>{modalSpace.MatchScore}%</div>
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ marginBottom: '24px' }}>
                                            <span style={{ fontSize: '13px', color: '#4a5568', fontWeight: 700, display: 'block', marginBottom: '10px' }}>Included Amenities</span>
                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                {modalSpace.ClimateControlled && <span style={{ background: '#fff5f0', color: '#ff6b35', padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, border: '1px solid #ffd5c2', display: 'flex', alignItems: 'center', gap: '6px' }}><i className="fa-solid fa-snowflake"></i> Climate Controlled</span>}
                                                {modalSpace.SecuritySystem && <span style={{ background: '#fff5f0', color: '#ff6b35', padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, border: '1px solid #ffd5c2', display: 'flex', alignItems: 'center', gap: '6px' }}><i className="fa-solid fa-shield-halved"></i> Secure Access</span>}
                                                {modalSpace.ParkingAvailable && <span style={{ background: '#fff5f0', color: '#ff6b35', padding: '6px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, border: '1px solid #ffd5c2', display: 'flex', alignItems: 'center', gap: '6px' }}><i className="fa-solid fa-car"></i> Parking Available</span>}
                                                {!modalSpace.ClimateControlled && !modalSpace.SecuritySystem && !modalSpace.ParkingAvailable && <span style={{ color: '#a0aec0', fontSize: '14px', fontStyle: 'italic' }}>Basic Storage Space</span>}
                                            </div>
                                        </div>

                                        {/* Compact Pricing Breakdown */}
                                        <div style={{ display: 'flex', gap: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '12px', paddingBottom: '8px', marginTop: 'auto' }}>
                                            <div style={{ flex: '1', textAlign: 'center', borderRight: '1px solid #e2e8f0', paddingRight: '16px' }}>
                                                <div style={{ fontSize: '11px', color: '#718096', fontWeight: 600, marginBottom: '2px', textTransform: 'uppercase' }}>Per Day</div>
                                                <div style={{ fontSize: '16px', fontWeight: 800, color: '#ff6b35' }}>{modalSpace.PricePerDay || Math.round((modalSpace.PricePerMonth || 0) / 30)} <span style={{ fontSize: '12px', fontWeight: 600, color: '#a0aec0' }}>SAR</span></div>
                                            </div>
                                            <div style={{ flex: '1', textAlign: 'center', borderRight: '1px solid #e2e8f0', paddingRight: '16px' }}>
                                                <div style={{ fontSize: '11px', color: '#718096', fontWeight: 600, marginBottom: '2px', textTransform: 'uppercase' }}>Per Week</div>
                                                <div style={{ fontSize: '16px', fontWeight: 800, color: '#ff6b35' }}>{modalSpace.PricePerWeek || Math.round((modalSpace.PricePerMonth || 0) / 4)} <span style={{ fontSize: '12px', fontWeight: 600, color: '#a0aec0' }}>SAR</span></div>
                                            </div>
                                            <div style={{ flex: '1', textAlign: 'center' }}>
                                                <div style={{ fontSize: '11px', color: '#718096', fontWeight: 600, marginBottom: '2px', textTransform: 'uppercase' }}>Per Month</div>
                                                <div style={{ fontSize: '16px', fontWeight: 800, color: '#ff6b35' }}>{modalSpace.PricePerMonth || '?'} <span style={{ fontSize: '12px', fontWeight: 600, color: '#a0aec0' }}>SAR</span></div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Reviews View */}
                                {modalView === 'reviews' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                                        {/* Back to details link */}
                                        <button
                                            onClick={() => setModalView('details')}
                                            style={{ background: 'none', border: 'none', padding: '0', color: '#ff6b35', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', alignSelf: 'flex-start' }}
                                        >
                                            <i className="fa-solid fa-arrow-left" style={{ fontSize: '11px' }}></i> Back to Details
                                        </button>

                                        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1a365d', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            Reviews
                                            {modalSpace.TotalReviews !== undefined && <span style={{ fontSize: '13px', fontWeight: 400, color: '#718096' }}>({modalSpace.TotalReviews})</span>}
                                        </h3>

                                        {/* Reviews list */}
                                        {reviewsLoading ? (
                                            <div style={{ textAlign: 'center', padding: '24px', color: '#718096' }}><i className="fa-solid fa-spinner fa-spin"></i> Loading reviews...</div>
                                        ) : spaceReviews.length === 0 ? (
                                            <div style={{ textAlign: 'center', padding: '24px', color: '#a0aec0', fontStyle: 'italic' }}>No reviews yet. Be the first to leave a review!</div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                {spaceReviews.map(review => (
                                                    <div key={review.ReviewID} style={{ padding: '14px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                                        {/* Review header: avatar, name, stars, time */}
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                                            <img
                                                                src={review.HasProfilePicture ? `/api/images/profile/seeker/${review.ReviewerSeekerID}` : '/Media/default-avatar.png'}
                                                                alt="Reviewer"
                                                                onError={(e) => { e.currentTarget.src = '/Media/default-avatar.png'; }}
                                                                style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #e2e8f0', flexShrink: 0 }}
                                                            />
                                                            <div style={{ flex: 1 }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                    <span style={{ fontWeight: 700, fontSize: '14px', color: '#1a365d' }}>
                                                                        {review.SeekerFirstName || 'User'} {review.SeekerLastName ? review.SeekerLastName.charAt(0) + '.' : ''}
                                                                    </span>
                                                                    <span style={{ fontSize: '12px', color: '#a0aec0' }}>{timeAgo(review.CreatedAt)}</span>
                                                                </div>
                                                                <div style={{ display: 'flex', gap: '2px', fontSize: '14px' }}>
                                                                    {renderStars(review.Rating)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {/* Comment */}
                                                        {review.Comment && (
                                                            <p style={{ margin: '0 0 0 48px', fontSize: '14px', color: '#4a5568', lineHeight: 1.5 }}>{review.Comment}</p>
                                                        )}
                                                        {/* Provider response */}
                                                        {review.ProviderResponse && (
                                                            <div style={{ margin: '10px 0 0 48px', padding: '10px 14px', background: '#fff', borderRadius: '8px', borderLeft: '3px solid #ff6b35' }}>
                                                                <div style={{ fontSize: '12px', fontWeight: 700, color: '#ff6b35', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                    <i className="fa-solid fa-reply" style={{ fontSize: '10px' }}></i> Provider Response
                                                                    {review.ProviderResponseDate && <span style={{ fontWeight: 400, color: '#a0aec0' }}>· {timeAgo(review.ProviderResponseDate)}</span>}
                                                                </div>
                                                                <p style={{ margin: 0, fontSize: '13px', color: '#4a5568', lineHeight: 1.4 }}>{review.ProviderResponse}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Submit a review */}
                                        <div style={{ marginTop: '8px', padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#1a365d', margin: '0 0 12px 0' }}>Leave a Review</h4>
                                            {/* Star rating input */}
                                            <div style={{ display: 'flex', gap: '4px', marginBottom: '12px', fontSize: '24px' }}>
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <span
                                                        key={i}
                                                        onClick={() => setNewRating(i + 1)}
                                                        onMouseEnter={() => setHoverRating(i + 1)}
                                                        onMouseLeave={() => setHoverRating(0)}
                                                        style={{ cursor: 'pointer', color: i < (hoverRating || newRating) ? '#f59e0b' : '#d1d5db', transition: 'color 0.15s ease, transform 0.15s ease', transform: i < (hoverRating || newRating) ? 'scale(1.1)' : 'scale(1)' }}
                                                    >★</span>
                                                ))}
                                                {newRating > 0 && <span style={{ fontSize: '13px', color: '#718096', alignSelf: 'center', marginLeft: '8px' }}>{newRating}/5</span>}
                                            </div>
                                            {/* Comment text area */}
                                            <textarea
                                                value={newComment}
                                                onChange={e => setNewComment(e.target.value)}
                                                placeholder="Share your experience with this storage space..."
                                                style={{ width: '100%', minHeight: '80px', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical', outline: 'none', transition: 'border-color 0.2s ease', boxSizing: 'border-box' }}
                                                onFocus={e => { e.currentTarget.style.borderColor = '#ff6b35'; }}
                                                onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; }}
                                            />
                                            {reviewError && <p style={{ color: '#e53e3e', fontSize: '13px', margin: '6px 0 0 0' }}>{reviewError}</p>}
                                            <button
                                                disabled={submitReviewLoading || newRating === 0}
                                                onClick={async () => {
                                                    setReviewError('');
                                                    setSubmitReviewLoading(true);
                                                    try {
                                                        const token = localStorage.getItem('siaa_token');
                                                        if (!token) { setReviewError('Please log in to submit a review.'); return; }
                                                        const payload = JSON.parse(atob(token.split('.')[1]));
                                                        const seekerId = payload.userId;
                                                        // We need a bookingId — find from seeker's bookings for this space
                                                        const bRes = await fetch(`/api/seeker/${seekerId}/bookings`, { headers: { 'Authorization': `Bearer ${token}` } });
                                                        const bJson = await bRes.json();
                                                        const bookings = bJson.bookings || bJson.data?.bookings || [];
                                                        const booking = bookings.find((b: { SpaceID: number; BookingStatus: string; HasReview?: boolean }) => b.SpaceID === modalSpace.SpaceID && b.BookingStatus === 'Completed' && !b.HasReview);
                                                        if (!booking) { setReviewError('You need a completed booking for this space to leave a review.'); return; }
                                                        const rRes = await fetch(`/api/bookings/${booking.BookingID}/review`, {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                                            body: JSON.stringify({ rating: newRating, comment: newComment || undefined, seekerId }),
                                                        });
                                                        if (!rRes.ok) {
                                                            const errData = await rRes.json();
                                                            setReviewError(errData.error || 'Failed to submit review.');
                                                            return;
                                                        }
                                                        // Refresh reviews
                                                        setNewRating(0);
                                                        setNewComment('');
                                                        fetchSpaceReviews(modalSpace.SpaceID);
                                                    } catch (err) {
                                                        console.error(err);
                                                        setReviewError('An error occurred. Please try again.');
                                                    } finally {
                                                        setSubmitReviewLoading(false);
                                                    }
                                                }}
                                                style={{
                                                    marginTop: '10px',
                                                    padding: '10px 20px',
                                                    borderRadius: '8px',
                                                    background: newRating === 0 ? '#e2e8f0' : 'linear-gradient(135deg, #ff6b35 0%, #ff8c5a 100%)',
                                                    color: newRating === 0 ? '#a0aec0' : '#fff',
                                                    fontWeight: 700,
                                                    fontSize: '14px',
                                                    border: 'none',
                                                    cursor: newRating === 0 || submitReviewLoading ? 'not-allowed' : 'pointer',
                                                    opacity: submitReviewLoading ? 0.7 : 1,
                                                    transition: 'all 0.2s ease',
                                                }}
                                            >
                                                {submitReviewLoading ? <><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '6px' }}></i>Submitting...</> : 'Submit Review'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Bottom Footer: Total Price & Actions */}
                        <div style={{ padding: '20px 24px', background: '#fafbfc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '13px', color: '#718096', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Price</span>
                                <div>
                                    <span style={{ fontSize: '24px', fontWeight: 900, color: '#ff6b35' }}>{modalSpace.PricePerMonth || '?'}</span>
                                    <span style={{ fontSize: '15px', fontWeight: 700, color: '#a0aec0', marginLeft: '4px' }}>SAR / mo</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button style={{ padding: '12px 24px', borderRadius: '10px', border: '2px solid #e2e8f0', background: '#fff', color: '#4a5568', fontWeight: 700, fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s ease' }} onClick={() => setModalSpace(null)}>Cancel</button>
                                <button style={{ padding: '12px 24px', borderRadius: '10px', background: '#4a5568', color: '#fff', fontWeight: 700, fontSize: '15px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setShow3DVisualizer(true)}>
                                    <img src="/Media/SpaceVisualization.png" alt="Visualize Space" style={{ width: '20px', height: '20px', filter: 'brightness(0) invert(1)' }} /> Visualize Space
                                </button>
                                <a href={`/booking?spaceId=${modalSpace.SpaceID}`} style={{ padding: '12px 32px', borderRadius: '10px', background: 'linear-gradient(135deg, #ff6b35 0%, #ff8c5a 100%)', color: '#fff', fontWeight: 700, fontSize: '16px', textDecoration: 'none', display: 'inline-block', boxShadow: '0 4px 12px rgba(255,107,53,0.3)', transition: 'all 0.2s ease', border: 'none', cursor: 'pointer' }}>
                                    Book Space Now
                                </a>
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {show3DVisualizer && modalSpace && (
                <Space3DVisualizer 
                    spaceWidth={modalSpace.Width || Math.sqrt(modalSpace.Size || 9)} 
                    spaceLength={modalSpace.Length || Math.sqrt(modalSpace.Size || 9)} 
                    spaceHeight={modalSpace.Height || 2.5} 
                    imageUrl={modalSpace.FirstImageID ? `/api/images/space/${modalSpace.FirstImageID}` : undefined}
                    onClose={() => setShow3DVisualizer(false)} 
                />
            )}

            <footer className="footer">
                <div className="container">
                    <div className="footer-content">
                        <div className="social-icons">
                            <a href="#" aria-label="Facebook"><i className="fa-brands fa-facebook"></i></a>
                            <a href="#" aria-label="LinkedIn"><i className="fa-brands fa-linkedin-in"></i></a>
                            <a href="#" aria-label="X"><i className="fa-brands fa-x-twitter"></i></a>
                            <a href="#" aria-label="Instagram"><i className="fa-brands fa-instagram"></i></a>
                        </div>
                        <div className="footer-logo">
                            <img src="/Media/Logo.png" alt="Si'aa Logo" className="footer-logo-img" />
                        </div>
                    </div>
                </div>
            </footer>
        </>
    );
}
