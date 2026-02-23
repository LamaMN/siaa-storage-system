'use client';
import { useEffect, useState, useCallback } from 'react';

interface User {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    userType: 'seeker' | 'provider';
    accountStatus?: string;
}

interface BookingItem {
    BookingID: number;
    SpaceTitle?: string;
    SpaceType?: string;
    City?: string;
    AddressLine1?: string;
    StartDate?: string;
    EndDate?: string;
    BookingStatus: string;
    TotalAmount?: number;
    ProviderName?: string;
    HasReview?: boolean;
    CreatedAt?: string;
    SeekerName?: string;
    SeekerEmail?: string;
    SeekerPhone?: string;
    Size?: number;
}

interface SpaceItem {
    SpaceID: number;
    Title: string;
    SpaceType?: string;
    Size?: number;
    PricePerMonth?: number;
    Status: string;
    City?: string;
    AddressLine1?: string;
    FavoriteCount?: number;
    TotalBookings?: number;
    ActiveBookings?: number;
    AvgRating?: number;
    CreatedAt?: string;
}

interface Stats {
    TotalBookings?: number;
    TotalSpaces?: number;
    ActiveBookings?: number;
    ActiveSpaces?: number;
    PendingBookings?: number;
    PendingBookingRequests?: number;
    TotalSpent?: number;
    TotalRevenue?: number;
    CompletedBookings?: number;
}

function formatDate(d?: string) {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
function formatPrice(n?: number) {
    if (!n) return '0.00';
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const STATUS_CLASS: Record<string, string> = {
    Active: 'status-active', Confirmed: 'status-active',
    Pending: 'status-pending', UnderReview: 'status-pending',
    Completed: 'status-completed',
    Cancelled: 'status-cancelled', Rejected: 'status-cancelled', Inactive: 'status-cancelled',
};

export default function DashboardPage() {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [token, setToken] = useState<string>('');
    const [activeSection, setActiveSection] = useState('profileSection');
    const [isFirstLogin, setIsFirstLogin] = useState(false);

    // Seeker data
    const [seekerBookings, setSeekerBookings] = useState<BookingItem[]>([]);
    // Provider data
    const [providerSpaces, setProviderSpaces] = useState<SpaceItem[]>([]);
    const [providerBookings, setProviderBookings] = useState<BookingItem[]>([]);

    const [stats, setStats] = useState<Stats>({});
    const [historyLoading, setHistoryLoading] = useState(false);
    const [reviewModal, setReviewModal] = useState<BookingItem | null>(null);
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewComment, setReviewComment] = useState('');
    const [reviewError, setReviewError] = useState('');

    // Profile fields
    const [profile, setProfile] = useState({ firstName: '', lastName: '', email: '', phone: '', companyName: '', businessName: '', role: '', status: '' });
    const [profileEditing, setProfileEditing] = useState(false);
    const [profileSaving, setProfileSaving] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('siaaUser');
        const storedToken = localStorage.getItem('siaaToken');
        const firstLogin = localStorage.getItem('siaaIsFirstLogin') === 'true';

        if (!storedUser || !storedToken) {
            window.location.href = '/login';
            return;
        }
        const user: User = JSON.parse(storedUser);
        setCurrentUser(user);
        setToken(storedToken);
        setIsFirstLogin(firstLogin);

        setProfile({
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || '',
            phone: '',
            companyName: '',
            businessName: '',
            role: user.userType === 'seeker' ? 'Storage Seeker' : 'Storage Provider',
            status: user.accountStatus || 'Active',
        });

        loadData(user, storedToken);
    }, []);

    const authHeaders = useCallback((t: string) => ({
        'Authorization': `Bearer ${t}`,
        'Content-Type': 'application/json',
    }), []);

    async function loadData(user: User, t: string) {
        setHistoryLoading(true);
        try {
            // Load profile
            const profRes = await fetch(`/api/profile/${user.userType}/${user.id}`, { headers: authHeaders(t) });
            if (profRes.ok) {
                const profData = await profRes.json();
                const p = profData.profile;
                setProfile({
                    firstName: p.FirstName || '',
                    lastName: p.LastName || '',
                    email: p.Email || '',
                    phone: p.PhoneNumber || '',
                    companyName: p.CompanyName || '',
                    businessName: p.BusinessName || '',
                    role: user.userType === 'seeker' ? 'Storage Seeker' : 'Storage Provider',
                    status: p.AccountStatus || 'Active',
                });
            }

            // Load history
            if (user.userType === 'seeker') {
                const bkRes = await fetch(`/api/seeker/${user.id}/bookings`, { headers: authHeaders(t) });
                if (bkRes.ok) {
                    const bkData = await bkRes.json();
                    setSeekerBookings(bkData.bookings || []);
                }
            } else {
                const spRes = await fetch(`/api/provider/${user.id}/spaces`, { headers: authHeaders(t) });
                if (spRes.ok) {
                    const spData = await spRes.json();
                    setProviderSpaces(spData.spaces || []);
                }
                const pbRes = await fetch(`/api/provider/${user.id}/bookings`, { headers: authHeaders(t) });
                if (pbRes.ok) {
                    const pbData = await pbRes.json();
                    setProviderBookings(pbData.bookings || []);
                }
            }

            // Load stats
            const stRes = await fetch(
                user.userType === 'seeker'
                    ? `/api/seeker/${user.id}/statistics`
                    : `/api/provider/${user.id}/statistics`,
                { headers: authHeaders(t) }
            );
            if (stRes.ok) {
                const stData = await stRes.json();
                setStats(stData.statistics || {});
            }
        } finally {
            setHistoryLoading(false);
        }
    }

    async function handleCancelBooking(bookingId: number) {
        if (!confirm('Are you sure you want to cancel this booking?')) return;
        const res = await fetch(`/api/bookings/${bookingId}`, {
            method: 'DELETE',
            headers: authHeaders(token),
        });
        if (res.ok) {
            setSeekerBookings(prev => prev.map(b =>
                b.BookingID === bookingId ? { ...b, BookingStatus: 'Cancelled' } : b
            ));
        } else {
            const d = await res.json();
            alert(d.error || 'Failed to cancel booking');
        }
    }

    async function handleUpdateBookingStatus(bookingId: number, status: string) {
        const res = await fetch(`/api/bookings/${bookingId}/status`, {
            method: 'PATCH',
            headers: authHeaders(token),
            body: JSON.stringify({ status }),
        });
        if (res.ok) {
            setProviderBookings(prev => prev.map(b =>
                b.BookingID === bookingId ? { ...b, BookingStatus: status } : b
            ));
        } else {
            const d = await res.json();
            alert(d.error || 'Failed to update status');
        }
    }

    async function handleSubmitReview() {
        if (!reviewModal || !currentUser) return;
        if (reviewRating === 0) { setReviewError('Please select a rating'); return; }
        if (reviewComment.length < 10) { setReviewError('Review must be at least 10 characters'); return; }

        const res = await fetch(`/api/bookings/${reviewModal.BookingID}/review`, {
            method: 'POST',
            headers: authHeaders(token),
            body: JSON.stringify({ rating: reviewRating, comment: reviewComment, seekerId: currentUser.id }),
        });
        if (res.ok) {
            setReviewModal(null);
            setSeekerBookings(prev => prev.map(b =>
                b.BookingID === reviewModal.BookingID ? { ...b, HasReview: true } : b
            ));
        } else {
            const d = await res.json();
            setReviewError(d.error || 'Failed to submit review');
        }
    }

    async function handleSaveProfile() {
        if (!currentUser) return;
        setProfileSaving(true);
        const res = await fetch(`/api/profile/${currentUser.userType}/${currentUser.id}`, {
            method: 'PUT',
            headers: authHeaders(token),
            body: JSON.stringify({
                firstName: profile.firstName,
                lastName: profile.lastName,
                phoneNumber: profile.phone,
                companyName: profile.companyName,
                businessName: profile.businessName,
            }),
        });
        if (res.ok) {
            const updated = { ...JSON.parse(localStorage.getItem('siaaUser') || '{}'), firstName: profile.firstName, lastName: profile.lastName };
            localStorage.setItem('siaaUser', JSON.stringify(updated));
            setProfileEditing(false);
        } else {
            alert('Failed to save profile');
        }
        setProfileSaving(false);
    }

    function logout() {
        localStorage.removeItem('siaaUser');
        localStorage.removeItem('siaaToken');
        window.location.href = '/login';
    }

    if (!currentUser) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;

    const isProvider = currentUser.userType === 'provider';
    const welcomeMessage = isFirstLogin
        ? `Welcome, ${currentUser.firstName}! 👋`
        : `Welcome back, ${currentUser.firstName}!`;

    return (
        <>
            <header className="header">
                <div className="container">
                    <div className="header-content">
                        <nav className="nav">
                            <a href="/#about">About</a>
                            <a href="/#features">Features</a>
                        </nav>
                        <div className="logo">
                            <img src="/Media/Logo.png" alt="Si'aa Logo" className="logo-img" />
                        </div>
                    </div>
                </div>
            </header>

            <div className="dashboard">
                {/* Sidebar */}
                <aside className="sideBar">
                    <a href="#" className={`sideBar-link ${activeSection === 'profileSection' ? 'is-active' : ''}`}
                        onClick={e => { e.preventDefault(); setActiveSection('profileSection'); }}>
                        <i className="fa-solid fa-user"></i> Profile
                    </a>
                    <a href="#" className={`sideBar-link ${activeSection === 'historySection' ? 'is-active' : ''}`}
                        onClick={e => { e.preventDefault(); setActiveSection('historySection'); }}>
                        <i className="fa-solid fa-clock-rotate-left"></i> {isProvider ? 'Spaces & Bookings' : 'My Bookings'}
                    </a>
                    <a href="#" className={`sideBar-link ${activeSection === 'statsSection' ? 'is-active' : ''}`}
                        onClick={e => { e.preventDefault(); setActiveSection('statsSection'); }}>
                        <i className="fa-solid fa-chart-line"></i> Statistics
                    </a>
                    <a href="#" className="sideBar-link logout-link" onClick={e => { e.preventDefault(); logout(); }}>
                        <i className="fa-solid fa-right-from-bracket"></i> Logout
                    </a>
                </aside>

                {/* Main content */}
                <main className="dashboard-main">
                    <div className="container">
                        <div className="dashboard-header">
                            <div className="dashboard-title-box">
                                <h1 className="dashboard-title">{welcomeMessage}</h1>
                                <p className="dashboard-subtitle" id="userRoleDisplay">
                                    {isProvider ? 'Storage Provider' : 'Storage Seeker'}
                                </p>
                            </div>
                            <a
                                href={isProvider ? '/list-space' : '/search'}
                                className="dashboard-btn"
                            >
                                {isProvider ? '+ List New Space' : 'Browse Spaces'}
                            </a>
                        </div>

                        {/* Profile Section */}
                        <section id="profileSection" className={`dashboard-section ${activeSection === 'profileSection' ? 'is-active' : ''}`}>
                            <h2 className="section-title">Profile</h2>
                            <div className="profile-form">
                                <div className="profile-grid">
                                    <div className="form-group">
                                        <label htmlFor="profileFirstName">First Name</label>
                                        <input type="text" id="profileFirstName" className="form-input"
                                            value={profile.firstName} disabled={!profileEditing}
                                            onChange={e => setProfile(p => ({ ...p, firstName: e.target.value }))} />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="profileLastName">Last Name</label>
                                        <input type="text" id="profileLastName" className="form-input"
                                            value={profile.lastName} disabled={!profileEditing}
                                            onChange={e => setProfile(p => ({ ...p, lastName: e.target.value }))} />
                                    </div>
                                    <div className="form-group">
                                        <label>Email</label>
                                        <input type="email" className="form-input" value={profile.email} disabled />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="profilePhone">Phone</label>
                                        <input type="tel" id="profilePhone" className="form-input"
                                            value={profile.phone} disabled={!profileEditing}
                                            onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} />
                                    </div>
                                    {!isProvider && (
                                        <div className="form-group">
                                            <label>Company (optional)</label>
                                            <input type="text" className="form-input"
                                                value={profile.companyName} disabled={!profileEditing}
                                                onChange={e => setProfile(p => ({ ...p, companyName: e.target.value }))} />
                                        </div>
                                    )}
                                    {isProvider && (
                                        <div className="form-group">
                                            <label>Business Name</label>
                                            <input type="text" className="form-input"
                                                value={profile.businessName} disabled={!profileEditing}
                                                onChange={e => setProfile(p => ({ ...p, businessName: e.target.value }))} />
                                        </div>
                                    )}
                                    <div className="form-group">
                                        <label>Account Type</label>
                                        <input type="text" className="form-input" value={profile.role} disabled />
                                    </div>
                                    <div className="form-group">
                                        <label>Account Status</label>
                                        <input type="text" className="form-input" value={profile.status} disabled />
                                    </div>
                                </div>
                                <div className="profile-actions">
                                    <button
                                        type="button"
                                        className="secondary-btn"
                                        onClick={() => setProfileEditing(!profileEditing)}
                                    >
                                        {profileEditing ? 'Cancel' : 'Edit'}
                                    </button>
                                    {profileEditing && (
                                        <button
                                            type="button"
                                            className="primary-btn"
                                            onClick={handleSaveProfile}
                                            disabled={profileSaving}
                                        >
                                            {profileSaving ? 'Saving...' : 'Save'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* History Section */}
                        <section id="historySection" className={`dashboard-section ${activeSection === 'historySection' ? 'is-active' : ''}`}>
                            <h2 className="section-title">{isProvider ? 'Listed Spaces & Booking Requests' : 'My Bookings'}</h2>

                            {historyLoading && <p>Loading...</p>}

                            {/* SEEKER VIEW */}
                            {!isProvider && !historyLoading && (
                                <ul className="history-list">
                                    {seekerBookings.length === 0 && (
                                        <p className="history-empty">No bookings yet. <a href="/search">Browse spaces</a> to get started.</p>
                                    )}
                                    {seekerBookings.map(booking => (
                                        <li key={booking.BookingID} className="history-item">
                                            <div className="history-item-header">
                                                <h3 className="history-item-title">{booking.SpaceTitle}</h3>
                                                <div className="history-item-badges">
                                                    <span className={`history-item-badge ${STATUS_CLASS[booking.BookingStatus] || 'status-default'}`}>
                                                        {booking.BookingStatus}
                                                    </span>
                                                    {booking.HasReview && (
                                                        <span className="review-badge"><i className="fa-solid fa-check-circle"></i> Reviewed</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="history-item-details">
                                                <p><i className="fa-solid fa-location-dot"></i> {booking.City}, {booking.AddressLine1}</p>
                                                <p><i className="fa-solid fa-calendar"></i> {formatDate(booking.StartDate)} - {formatDate(booking.EndDate)}</p>
                                                <p><i className="fa-solid fa-user"></i> Provider: {booking.ProviderName}</p>
                                                <p><i className="fa-solid fa-box"></i> {booking.SpaceType} · {booking.Size} m²</p>
                                            </div>
                                            <div className="history-item-footer">
                                                <div className="history-item-footer-left">
                                                    <span className="history-item-date">Booked: {formatDate(booking.CreatedAt)}</span><br />
                                                    <span className="history-item-price">{formatPrice(booking.TotalAmount)} SAR</span>
                                                </div>
                                                <div className="history-item-footer-right">
                                                    {booking.BookingStatus === 'Pending' && (
                                                        <button
                                                            className="btn btn-outline btn-small"
                                                            onClick={() => handleCancelBooking(booking.BookingID)}
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}
                                                    {booking.BookingStatus === 'Completed' && !booking.HasReview && (
                                                        <button
                                                            className="btn btn-outline btn-small review-btn"
                                                            onClick={() => { setReviewModal(booking); setReviewRating(0); setReviewComment(''); setReviewError(''); }}
                                                        >
                                                            <i className="fa-solid fa-star"></i> Write Review
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {/* PROVIDER VIEW */}
                            {isProvider && !historyLoading && (
                                <div>
                                    <h3 style={{ marginBottom: '1rem' }}>Your Listed Spaces</h3>
                                    <ul className="history-list">
                                        {providerSpaces.length === 0 && (
                                            <p className="history-empty">No spaces listed yet. <a href="/list-space">List a space</a> to start earning!</p>
                                        )}
                                        {providerSpaces.map(space => (
                                            <li key={space.SpaceID} className="history-item">
                                                <div className="history-item-header">
                                                    <h3 className="history-item-title">{space.Title}</h3>
                                                    <span className={`history-item-badge ${STATUS_CLASS[space.Status] || 'status-default'}`}>{space.Status}</span>
                                                </div>
                                                <div className="history-item-details">
                                                    <p><i className="fa-solid fa-location-dot"></i> {space.City}, {space.AddressLine1}</p>
                                                    <p><i className="fa-solid fa-box"></i> {space.SpaceType} · {space.Size} m²</p>
                                                    <p><i className="fa-solid fa-heart"></i> {space.FavoriteCount} favorites · {space.TotalBookings} bookings</p>
                                                </div>
                                                <div className="history-item-footer">
                                                    <span className="history-item-price">{formatPrice(space.PricePerMonth)} SAR/month</span>
                                                    <span className="history-item-date">Listed: {formatDate(space.CreatedAt)}</span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>

                                    <h3 style={{ margin: '2rem 0 1rem' }}>Incoming Booking Requests</h3>
                                    <ul className="history-list">
                                        {providerBookings.length === 0 && <p>No booking requests yet.</p>}
                                        {providerBookings.map(booking => (
                                            <li key={booking.BookingID} className="history-item">
                                                <div className="history-item-header">
                                                    <h3 className="history-item-title">{booking.SpaceTitle}</h3>
                                                    <span className={`history-item-badge ${STATUS_CLASS[booking.BookingStatus] || 'status-default'}`}>
                                                        {booking.BookingStatus}
                                                    </span>
                                                </div>
                                                <div className="history-item-details">
                                                    <p><i className="fa-solid fa-user"></i> Seeker: {booking.SeekerName} · {booking.SeekerEmail}</p>
                                                    <p><i className="fa-solid fa-calendar"></i> {formatDate(booking.StartDate)} - {formatDate(booking.EndDate)}</p>
                                                    <p><i className="fa-solid fa-money-bill"></i> {formatPrice(booking.TotalAmount)} SAR</p>
                                                </div>
                                                {booking.BookingStatus === 'Pending' && (
                                                    <div className="history-item-footer" style={{ gap: '0.5rem' }}>
                                                        <button className="btn btn-dark btn-small"
                                                            onClick={() => handleUpdateBookingStatus(booking.BookingID, 'Confirmed')}>
                                                            ✓ Confirm
                                                        </button>
                                                        <button className="btn btn-outline btn-small"
                                                            onClick={() => handleUpdateBookingStatus(booking.BookingID, 'Rejected')}>
                                                            ✗ Reject
                                                        </button>
                                                    </div>
                                                )}
                                                {booking.BookingStatus === 'Confirmed' && (
                                                    <div className="history-item-footer">
                                                        <button className="btn btn-dark btn-small"
                                                            onClick={() => handleUpdateBookingStatus(booking.BookingID, 'Active')}>
                                                            Mark Active
                                                        </button>
                                                    </div>
                                                )}
                                                {booking.BookingStatus === 'Active' && (
                                                    <div className="history-item-footer">
                                                        <button className="btn btn-dark btn-small"
                                                            onClick={() => handleUpdateBookingStatus(booking.BookingID, 'Completed')}>
                                                            Mark Completed
                                                        </button>
                                                    </div>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </section>

                        {/* Stats Section */}
                        <section id="statsSection" className={`dashboard-section ${activeSection === 'statsSection' ? 'is-active' : ''}`}>
                            <h2 className="section-title">Statistics</h2>
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <div className="stat-icon"><i className="fa-solid fa-box"></i></div>
                                    <div className="stat-content">
                                        <h3 className="stat-value">
                                            {isProvider ? (stats.TotalSpaces || 0) : (stats.TotalBookings || 0)}
                                        </h3>
                                        <p className="stat-label">{isProvider ? 'Total Spaces' : 'Total Bookings'}</p>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon"><i className="fa-solid fa-check-circle"></i></div>
                                    <div className="stat-content">
                                        <h3 className="stat-value">{stats.ActiveBookings || stats.ActiveSpaces || 0}</h3>
                                        <p className="stat-label">Active</p>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon"><i className="fa-solid fa-clock"></i></div>
                                    <div className="stat-content">
                                        <h3 className="stat-value">{stats.PendingBookings || stats.PendingBookingRequests || 0}</h3>
                                        <p className="stat-label">Pending</p>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon"><i className="fa-solid fa-chart-line"></i></div>
                                    <div className="stat-content">
                                        <h3 className="stat-value">
                                            {formatPrice(isProvider ? stats.TotalRevenue : stats.TotalSpent)} SAR
                                        </h3>
                                        <p className="stat-label">{isProvider ? 'Total Revenue' : 'Total Spent'}</p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </main>
            </div>

            {/* Review Modal */}
            {reviewModal && (
                <div className="review-modal-overlay" id="reviewModalOverlay">
                    <div className="review-modal">
                        <div className="review-modal-header">
                            <h3>Review Your Experience</h3>
                            <button className="review-modal-close" onClick={() => setReviewModal(null)}>
                                <i className="fa-solid fa-times"></i>
                            </button>
                        </div>
                        <div className="review-modal-body">
                            <div className="review-booking-info">
                                <h4>{reviewModal.SpaceTitle}</h4>
                                <p>{reviewModal.SpaceType} · {formatDate(reviewModal.StartDate)} - {formatDate(reviewModal.EndDate)}</p>
                            </div>
                            <div className="review-form-group">
                                <label className="review-label">Rating</label>
                                <div className="review-stars-container">
                                    {[1, 2, 3, 4, 5].map(v => (
                                        <span
                                            key={v}
                                            className={`review-star ${v <= reviewRating ? 'selected' : ''}`}
                                            onClick={() => setReviewRating(v)}
                                            style={{ cursor: 'pointer', color: v <= reviewRating ? '#f59e0b' : '#d1d5db', fontSize: '2rem' }}
                                        >★</span>
                                    ))}
                                </div>
                            </div>
                            <div className="review-form-group">
                                <label className="review-label">Your Review</label>
                                <textarea
                                    className="review-textarea"
                                    rows={4}
                                    placeholder="Share your experience with this storage space..."
                                    maxLength={500}
                                    value={reviewComment}
                                    onChange={e => setReviewComment(e.target.value)}
                                />
                                <p className="review-char-count">{reviewComment.length}/500 characters</p>
                            </div>
                            {reviewError && <p className="review-error" style={{ display: 'block' }}>{reviewError}</p>}
                        </div>
                        <div className="review-modal-footer">
                            <button className="btn btn-outline" onClick={() => setReviewModal(null)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleSubmitReview}>Submit Review</button>
                        </div>
                    </div>
                </div>
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
