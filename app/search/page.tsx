'use client';
import { useState, useEffect, FormEvent } from 'react';

interface SpaceResult {
    SpaceID: number;
    Title: string;
    SpaceType?: string;
    Size?: number;
    PricePerMonth?: number;
    PricePerWeek?: number;
    PricePerDay?: number;
    City?: string;
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
    const [hasSearched, setHasSearched] = useState(false);

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

    useEffect(() => {
        const storedCity = localStorage.getItem('siaa_city');
        if (!storedCity) {
            setShowLocationModal(true);
        } else {
            setSelectedCity(storedCity);
            setFilters(f => ({ ...f, city: storedCity }));
        }
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

    async function handleSearch(e: FormEvent) {
        e.preventDefault();
        setLoading(true);
        setHasSearched(true);

        const params = new URLSearchParams();
        if (filters.city) params.set('city', filters.city);
        if (filters.spaceType) params.set('spaceType', filters.spaceType);
        if (filters.maxPrice) params.set('maxPrice', String(filters.maxPrice));
        if (filters.minSize) params.set('minSize', filters.minSize);
        if (filters.maxSize) params.set('maxSize', filters.maxSize);
        if (filters.climateControlled || filters.temperatureControlled || filters.humidityControlled) params.set('climateControlled', '1');
        if (filters.security) params.set('security', '1');
        if (filters.parking) params.set('parking', '1');
        if (filters.loadingAssistance) params.set('loadingAssistance', '1');
        if (filters.startDate) params.set('startDate', filters.startDate);
        params.set('sortBy', filters.sortBy);

        try {
            const res = await fetch(`/api/spaces?${params.toString()}`);
            const data = await res.json();
            setSpaces(data.spaces || []);
        } catch (err) {
            console.error('Search error:', err);
        } finally {
            setLoading(false);
        }
    }

    function renderStars(rating: number) {
        return Array.from({ length: 5 }).map((_, i) => (
            <span key={i} style={{ color: i < Math.round(rating) ? '#f59e0b' : '#d1d5db' }}>★</span>
        ));
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
                                                <option value="Al-Salama">Al-Salama</option>
                                                <option value="Al-Rawdah">Al-Rawdah</option>
                                                <option value="Al-Nahda">Al-Nahda</option>
                                                <option value="Al-Andalus">Al-Andalus</option>
                                                <option value="Al-Hamra">Al-Hamra</option>
                                                <option value="Al-Rehab">Al-Rehab</option>
                                                <option value="Al-Faisaliyah">Al-Faisaliyah</option>
                                                <option value="Al-Naeem">Al-Naeem</option>
                                                <option value="Al-Basateen">Al-Basateen</option>
                                                <option value="Al-Shati">Al-Shati (Corniche)</option>
                                                <option value="Al-Safa">Al-Safa</option>
                                                <option value="Al-Aziziyah">Al-Aziziyah</option>
                                                <option value="Al-Baghdadiyah">Al-Baghdadiyah</option>
                                                <option value="Al-Balad">Al-Balad</option>
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
                                                    <span>80 SAR</span><span>{filters.maxPrice} SAR</span>
                                                </span>
                                            </div>
                                            <input
                                                type="range"
                                                name="price_max"
                                                min="80" max="5000" step="50"
                                                value={filters.maxPrice}
                                                onChange={e => setFilters(f => ({ ...f, maxPrice: parseInt(e.target.value) }))}
                                                className="filter-range-input"
                                            />
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

                                    <div className="ai-info-box">
                                        <p className="ai-info-box__title">AI Recommendation</p>
                                        <p className="ai-info-box__text">
                                            Si&apos;aa analyzes your filters (size, price, features, and location) to generate{' '}
                                            <strong>AI-based storage recommendations</strong>.
                                        </p>
                                    </div>

                                    <button type="submit" className="btn btn-dark btn-large filter-submit-btn">
                                        {loading ? 'Searching...' : 'Search & Get Recommendations'}
                                    </button>

                                </form>
                            </div>
                        </div>

                        {/* Right: Results */}
                        <aside className="storage-results">
                            <div className="storage-results__header">
                                <h2 className="storage-results__title">Results {hasSearched && `(${spaces.length})`}</h2>
                                <div className="sorting-control">
                                    <label htmlFor="sortBy" className="sorting-control__label">Sort by</label>
                                    <select
                                        id="sortBy"
                                        className="sorting-control__select"
                                        value={filters.sortBy}
                                        onChange={e => setFilters(f => ({ ...f, sortBy: e.target.value }))}
                                    >
                                        <option value="match">Match Score (Highest)</option>
                                        <option value="priceLow">Price (Lowest first)</option>
                                        <option value="priceHigh">Price (Highest first)</option>
                                        <option value="distance">Distance (Closest)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="storage-results__list">
                                {loading && (
                                    <div style={{ padding: '2rem', textAlign: 'center' }}>
                                        <p>Searching spaces...</p>
                                    </div>
                                )}
                                {!loading && hasSearched && spaces.length === 0 && (
                                    <article className="storage-card" style={{ padding: '2rem', textAlign: 'center' }}>
                                        <p>No spaces found matching your criteria. Try adjusting your filters.</p>
                                    </article>
                                )}
                                {!loading && !hasSearched && (
                                    <article className="storage-card" style={{ padding: '2rem', textAlign: 'center' }}>
                                        <p>Use the filters on the left to search for storage spaces.</p>
                                    </article>
                                )}
                                {!loading && spaces.map(space => (
                                    <article className="storage-card" key={space.SpaceID}>
                                        {space.FirstImageID && (
                                            <div className="storage-card__image" style={{ marginBottom: '0.75rem' }}>
                                                <img
                                                    src={`/api/images/space/${space.FirstImageID}`}
                                                    alt={space.Title}
                                                    style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '8px' }}
                                                />
                                            </div>
                                        )}
                                        <div className="storage-card__content">
                                            <h3 style={{ margin: '0 0 0.25rem' }}>{space.Title}</h3>
                                            <p style={{ color: '#666', fontSize: '0.875rem', margin: '0 0 0.5rem' }}>
                                                <i className="fa-solid fa-location-dot"></i>{' '}
                                                {space.City}{space.AddressLine1 ? ` · ${space.AddressLine1}` : ''}
                                            </p>
                                            <p style={{ margin: '0 0 0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                {renderStars(space.AvgRating || 0)}
                                                <span style={{ fontSize: '0.75rem', color: '#888' }}>
                                                    ({space.TotalReviews || 0} reviews)
                                                </span>
                                            </p>
                                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                                                {space.SpaceType && <span className="booking-tag">{space.SpaceType}</span>}
                                                {space.ClimateControlled && <span className="booking-tag">🌡️ Climate</span>}
                                                {space.SecuritySystem && <span className="booking-tag">🔒 Secure</span>}
                                                {space.ParkingAvailable && <span className="booking-tag">🚗 Parking</span>}
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <strong style={{ fontSize: '1.1rem' }}>{space.PricePerMonth} SAR</strong>
                                                    <span style={{ color: '#888', fontSize: '0.8rem' }}>/month</span>
                                                    {space.PricePerDay && (
                                                        <span style={{ color: '#888', fontSize: '0.75rem', display: 'block' }}>
                                                            {space.PricePerDay} SAR/day
                                                        </span>
                                                    )}
                                                </div>
                                                <a href={`/spaces/${space.SpaceID}`} className="btn btn-dark">Book Now</a>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </aside>
                    </div>
                </div>
            </section>

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
