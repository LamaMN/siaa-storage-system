'use client';
import { useEffect, useState, useCallback } from 'react';
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
    AreaChart, Area, LineChart, Line,
} from 'recharts';


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
    const [profilePic, setProfilePic] = useState<string | null>('/Media/default-avatar.png');
    const [profilePicFile, setProfilePicFile] = useState<File | null>(null);

    // Settings state
    const [settings, setSettings] = useState({
        notifEmail: true,
        notifSms: true,
        notifPush: true,
        commMethod: 'Email',
        langPref: 'en',
        prefLocs: [] as string[],
        iban: '',
        bankName: '',
        accountName: ''
    });
    const [settingsSaving, setSettingsSaving] = useState(false);
    const [settingsSavedMsg, setSettingsSavedMsg] = useState(false);

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

                if (p.hasProfilePicture) {
                    setProfilePic(`/api/images/profile/${user.userType}/${user.id}?t=${Date.now()}`);
                } else {
                    setProfilePic('/Media/default-avatar.png');
                }
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

    async function handleDeleteSpace(spaceId: number) {
        if (!confirm('Are you sure you want to delete this space? This cannot be undone.')) return;
        const res = await fetch(`/api/spaces/${spaceId}`, {
            method: 'DELETE',
            headers: authHeaders(token),
        });
        if (res.ok) {
            setProviderSpaces(prev => prev.filter(s => s.SpaceID !== spaceId));
        } else {
            const d = await res.json();
            alert(d.error || 'Failed to delete space');
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
        
        let body: BodyInit;
        let headers: Record<string, string> = { 'Authorization': `Bearer ${token}` };
        
        if (profilePicFile) {
            const formData = new FormData();
            formData.append('profilePicture', profilePicFile);
            formData.append('firstName', profile.firstName);
            formData.append('lastName', profile.lastName);
            formData.append('phoneNumber', profile.phone);
            if (profile.companyName) formData.append('companyName', profile.companyName);
            if (profile.businessName) formData.append('businessName', profile.businessName);
            body = formData;
        } else {
            headers['Content-Type'] = 'application/json';
            body = JSON.stringify({
                firstName: profile.firstName,
                lastName: profile.lastName,
                phoneNumber: profile.phone,
                companyName: profile.companyName,
                businessName: profile.businessName,
            });
        }

        const res = await fetch(`/api/profile/${currentUser.userType}/${currentUser.id}`, {
            method: 'PUT',
            headers,
            body,
        });
        if (res.ok) {
            const updated = { ...JSON.parse(localStorage.getItem('siaaUser') || '{}'), firstName: profile.firstName, lastName: profile.lastName };
            localStorage.setItem('siaaUser', JSON.stringify(updated));
            setProfileEditing(false);
            setProfilePicFile(null);
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
                    {isProvider ? (
                        <>
                            <a href="#" className={`sideBar-link ${activeSection === 'spacesSection' ? 'is-active' : ''}`}
                                onClick={e => { e.preventDefault(); setActiveSection('spacesSection'); }}>
                                <i className="fa-solid fa-box"></i> My Spaces
                            </a>
                            <a href="#" className={`sideBar-link ${activeSection === 'bookingsSection' ? 'is-active' : ''}`}
                                onClick={e => { e.preventDefault(); setActiveSection('bookingsSection'); }}>
                                <i className="fa-solid fa-calendar-check"></i> Booking Requests
                            </a>
                        </>
                    ) : (
                        <a href="#" className={`sideBar-link ${activeSection === 'historySection' ? 'is-active' : ''}`}
                            onClick={e => { e.preventDefault(); setActiveSection('historySection'); }}>
                            <i className="fa-solid fa-clock-rotate-left"></i> My Bookings
                        </a>
                    )}
                    <a href="#" className={`sideBar-link ${activeSection === 'statsSection' ? 'is-active' : ''}`}
                        onClick={e => { e.preventDefault(); setActiveSection('statsSection'); }}>
                        <i className="fa-solid fa-chart-line"></i> Statistics
                    </a>
                    <a href="#" className={`sideBar-link ${activeSection === 'settingsSection' ? 'is-active' : ''}`}
                        onClick={e => { e.preventDefault(); setActiveSection('settingsSection'); }}>
                        <i className="fa-solid fa-gear"></i> Settings
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
                                {isProvider ? 'List New Space' : 'Browse Spaces'}
                            </a>
                        </div>

                        {/* Profile Section */}
                        <section id="profileSection" className={`dashboard-section ${activeSection === 'profileSection' ? 'is-active' : ''}`}>
                            <h2 className="section-title">Profile</h2>
                            <div className="profile-form">
                                <div className="profile-grid">
                                    <div className="form-group profile-picture-group">
                                        <label className="form-label">Profile Picture (optional)</label>
                                        <div className="profile-picture-wrapper">
                                            <div className={`profile-picture-preview ${profilePic ? 'has-image' : ''}`}>
                                                {profilePic ? (
                                                    <img src={profilePic} alt="Profile Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} onError={(e) => { e.currentTarget.src = '/Media/default-avatar.png'; }} />
                                                ) : (
                                                    <span className="profile-picture-placeholder">
                                                        <i className="fa-solid fa-user"></i>
                                                    </span>
                                                )}
                                            </div>
                                            <div className="profile-picture-controls">
                                                <input className="profile-picture-input" type="file" accept="image/*" disabled={!profileEditing} onChange={e => {
                                                    if (e.target.files?.[0]) {
                                                        const file = e.target.files[0];
                                                        setProfilePicFile(file);
                                                        const reader = new FileReader();
                                                        reader.onload = r => setProfilePic(r.target?.result as string);
                                                        reader.readAsDataURL(file);
                                                    }
                                                }} />
                                                <p className="profile-picture-hint">JPG, PNG, max 2MB. A clear front-facing photo works best.</p>
                                            </div>
                                        </div>
                                    </div>
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

                        {/* History Section (Seeker) */}
                        {(!isProvider) && (
                            <section id="historySection" className={`dashboard-section ${activeSection === 'historySection' ? 'is-active' : ''}`}>
                                <h2 className="section-title">My Bookings</h2>

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
                                                        {Boolean(booking.HasReview) && (
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

                            </section>
                        )}

                        {/* Spaces Section (Provider) */}
                        {isProvider && (
                            <section id="spacesSection" className={`dashboard-section ${activeSection === 'spacesSection' ? 'is-active' : ''}`}>
                                <h2 className="section-title">Your Listed Spaces</h2>
                                {historyLoading && <p>Loading...</p>}
                                {!historyLoading && (
                                    <div>
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
                                                    <div className="history-item-footer" style={{ marginTop: '0.5rem', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                        <a href={`/edit-space/${space.SpaceID}`} className="btn btn-outline btn-small" style={{ borderColor: '#f97316', color: '#f97316' }}>
                                                            <i className="fa-solid fa-pen"></i> Edit
                                                        </a>
                                                        <button className="btn btn-outline btn-small" style={{ borderColor: '#6b7280', color: '#6b7280' }} onClick={() => handleDeleteSpace(space.SpaceID)}>
                                                            <i className="fa-solid fa-trash"></i> Delete
                                                        </button>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </section>
                        )}

                        {/* Bookings Section (Provider) */}
                        {isProvider && (
                            <section id="bookingsSection" className={`dashboard-section ${activeSection === 'bookingsSection' ? 'is-active' : ''}`}>
                                <h2 className="section-title">Incoming Booking Requests</h2>
                                {historyLoading && <p>Loading...</p>}
                                {!historyLoading && (
                                    <div>
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
                                                                Confirm
                                                            </button>
                                                            <button className="btn btn-outline btn-small"
                                                                onClick={() => handleUpdateBookingStatus(booking.BookingID, 'Rejected')}>
                                                                Reject
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
                        )}

                        {/* Stats Section */}
                        <section id="statsSection" className={`dashboard-section ${activeSection === 'statsSection' ? 'is-active' : ''}`}>
                            <h2 className="section-title">Statistics</h2>

                            {/* ── KPI Cards ───────────────────────────────── */}
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <div className="stat-icon"><i className="fa-solid fa-box"></i></div>
                                    <div className="stat-content">
                                        <h3 className="stat-value">{isProvider ? (stats.TotalSpaces || 0) : (stats.TotalBookings || 0)}</h3>
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
                                        <h3 className="stat-value">{formatPrice(isProvider ? stats.TotalRevenue : stats.TotalSpent)} SAR</h3>
                                        <p className="stat-label">{isProvider ? 'Total Revenue' : 'Total Spent'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* ── Shared data ─────────────────────────────── */}
                            {(() => {
                                const bookings  = isProvider ? providerBookings : seekerBookings;

                                // Count statuses directly from the bookings array
                                const active    = bookings.filter(b => ['Active', 'Confirmed'].includes(b.BookingStatus)).length;
                                const pending   = bookings.filter(b => ['Pending', 'UnderReview'].includes(b.BookingStatus)).length;
                                const completed = bookings.filter(b => b.BookingStatus === 'Completed').length;
                                const cancelled = bookings.filter(b => ['Cancelled', 'Rejected'].includes(b.BookingStatus)).length;
                                const total     = bookings.length;

                                const PIE_COLORS = ['#ff6b35', '#3b82f6', '#10b981', '#ef4444', '#94a3b8'];
                                const pieData = [
                                    { name: 'Active',    value: active },
                                    { name: 'Pending',   value: pending },
                                    { name: 'Completed', value: completed },
                                    ...(cancelled > 0 ? [{ name: 'Cancelled', value: cancelled }] : []),
                                ].filter(d => d.value > 0);

                                const barData = [
                                    { name: 'Active',    count: active,    fill: '#ff6b35' },
                                    { name: 'Pending',   count: pending,   fill: '#3b82f6' },
                                    { name: 'Completed', count: completed, fill: '#10b981' },
                                    ...(cancelled > 0 ? [{ name: 'Cancelled', count: cancelled, fill: '#ef4444' }] : []),
                                ];

                                // Last 6 months
                                const months: { key: string; label: string }[] = [];
                                for (let i = 5; i >= 0; i--) {
                                    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i);
                                    months.push({
                                        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
                                        label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
                                    });
                                }
                                const revenueData = months.map(({ key, label }) => {
                                    const rev = bookings
                                        .filter(b => { const d = b.CreatedAt || b.StartDate; return d && d.slice(0, 7) === key; })
                                        .reduce((s, b) => s + (b.TotalAmount || 0), 0);
                                    return { label, revenue: parseFloat(rev.toFixed(2)) };
                                });
                                const bookingsData = months.map(({ key, label }) => ({
                                    label,
                                    bookings: bookings.filter(b => { const d = b.CreatedAt || b.StartDate; return d && d.slice(0, 7) === key; }).length,
                                }));

                                const hasStatus  = total > 0;
                                const hasRevData = revenueData.some(d => d.revenue  > 0);
                                const hasBkData  = bookingsData.some(d => d.bookings > 0);

                                const card = (children: React.ReactNode) => (
                                    <div style={{
                                        background: '#fff', borderRadius: '16px',
                                        padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                                        border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column',
                                    }}>{children}</div>
                                );
                                const chartTitle = (text: string, sub?: string) => (
                                    <div style={{ marginBottom: '1.1rem', paddingBottom: '0.9rem', borderBottom: '1px solid #f1f5f9' }}>
                                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#1a365d' }}>{text}</span>
                                        {sub && <span style={{ fontSize: '12px', color: '#a0aec0', marginLeft: '0.5rem' }}>{sub}</span>}
                                    </div>
                                );
                                const empty = (h = 200) => (
                                    <div style={{ height: h, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e0', fontSize: '13px' }}>
                                        No data yet
                                    </div>
                                );

                                return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.75rem' }}>

                                        {/* ── Row 1: Revenue (wide) + Donut (narrow) ── */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.25rem', alignItems: 'stretch' }}>

                                            {card(<>
                                                {chartTitle(isProvider ? 'Revenue Over Time' : 'Spending Over Time', '· last 6 months · SAR')}
                                                {hasRevData ? (
                                                    <ResponsiveContainer width="100%" height={230}>
                                                        <AreaChart data={revenueData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                                                            <defs>
                                                                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                                                    <stop offset="5%"  stopColor="#ff6b35" stopOpacity={0.15} />
                                                                    <stop offset="95%" stopColor="#ff6b35" stopOpacity={0}    />
                                                                </linearGradient>
                                                            </defs>
                                                            <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
                                                            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                                            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={45} />
                                                            <Tooltip formatter={(v: any) => [`${v} SAR`, isProvider ? 'Revenue' : 'Spent']} contentStyle={{ borderRadius: '10px', fontSize: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                                                            <Area type="monotone" dataKey="revenue" stroke="#ff6b35" strokeWidth={2.5} fill="url(#revGrad)" dot={{ r: 4, fill: '#ff6b35', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                                                        </AreaChart>
                                                    </ResponsiveContainer>
                                                ) : empty(230)}
                                            </>)}

                                            {card(<>
                                                {chartTitle(isProvider ? 'Space Status' : 'Booking Status')}
                                                {hasStatus ? (
                                                    <ResponsiveContainer width="100%" height={230}>
                                                        <PieChart>
                                                            <Pie data={pieData} cx="50%" cy="45%" innerRadius={60} outerRadius={88} paddingAngle={3} dataKey="value">
                                                                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                                            </Pie>
                                                            <Tooltip formatter={(v: any) => [v, 'Count']} contentStyle={{ borderRadius: '10px', fontSize: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                                                            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', paddingTop: '4px' }} />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                ) : empty(230)}
                                            </>)}
                                        </div>

                                        {/* ── Row 2: Bookings line + Bar ── */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', alignItems: 'stretch' }}>

                                            {card(<>
                                                {chartTitle('Bookings Over Time', '· last 6 months')}
                                                {hasBkData ? (
                                                    <ResponsiveContainer width="100%" height={200}>
                                                        <AreaChart data={bookingsData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                                                            <defs>
                                                                <linearGradient id="bkGrad" x1="0" y1="0" x2="0" y2="1">
                                                                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.15} />
                                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}    />
                                                                </linearGradient>
                                                            </defs>
                                                            <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
                                                            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                                            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={30} />
                                                            <Tooltip formatter={(v: any) => [v, 'Bookings']} contentStyle={{ borderRadius: '10px', fontSize: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                                                            <Area type="monotone" dataKey="bookings" stroke="#3b82f6" strokeWidth={2.5} fill="url(#bkGrad)" dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                                                        </AreaChart>
                                                    </ResponsiveContainer>
                                                ) : empty(200)}
                                            </>)}

                                            {card(<>
                                                {chartTitle('Count by Status')}
                                                {hasStatus ? (
                                                    <ResponsiveContainer width="100%" height={200}>
                                                        <BarChart data={barData} barSize={32} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                                                            <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
                                                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                                            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={30} />
                                                            <Tooltip formatter={(v: any) => [v, 'Count']} contentStyle={{ borderRadius: '10px', fontSize: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} cursor={{ fill: '#f8fafc' }} />
                                                            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                                                {barData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                                                            </Bar>
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                ) : empty(200)}
                                            </>)}
                                        </div>

                                    </div>
                                );
                            })()}
                        </section>

                        {/* Settings Section */}
                        <section id="settingsSection" className={`dashboard-section ${activeSection === 'settingsSection' ? 'is-active' : ''}`}>
                            <h2 className="section-title">Settings</h2>

                            <form className="profile-form" onSubmit={async (e) => {
                                e.preventDefault();
                                setSettingsSaving(true);
                                await new Promise(r => setTimeout(r, 600)); // Simulate save
                                setSettingsSaving(false);
                                setSettingsSavedMsg(true);
                                setTimeout(() => setSettingsSavedMsg(false), 3000);
                            }}>

                                {/* Bank Information (Provider Only) */}
                                {isProvider && (
                                    <div className="settings-card">
                                        <h3 className="settings-card-title"><i className="fa-solid fa-building-columns"></i> Bank Information</h3>
                                        <p className="settings-hint">Where should we send your payouts?</p>
                                        <div className="profile-grid" style={{ marginBottom: 0 }}>
                                            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                                <label>IBAN Number</label>
                                                <input type="text" className="form-input" placeholder="SA00 0000 0000 0000 0000 0000" value={settings.iban} onChange={e => setSettings(s => ({ ...s, iban: e.target.value }))} />
                                            </div>
                                            <div className="form-group">
                                                <label>Bank Name</label>
                                                <input type="text" className="form-input" placeholder="e.g. Al Rajhi Bank" value={settings.bankName} onChange={e => setSettings(s => ({ ...s, bankName: e.target.value }))} />
                                            </div>
                                            <div className="form-group">
                                                <label>Account Holder Name</label>
                                                <input type="text" className="form-input" placeholder="Name on account" value={settings.accountName} onChange={e => setSettings(s => ({ ...s, accountName: e.target.value }))} />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Notification Preferences */}
                                <div className="settings-card">
                                    <h3 className="settings-card-title"><i className="fa-solid fa-bell"></i> Notification Preferences</h3>
                                    <div className="settings-toggles">
                                        <label className="toggle-label">
                                            <input type="checkbox" checked={settings.notifEmail} onChange={e => setSettings(s => ({ ...s, notifEmail: e.target.checked }))} />
                                            <span className="toggle-slider"></span>
                                            <span className="toggle-text">
                                                <strong>Email Notifications</strong><small>Receive updates and alerts via email</small>
                                            </span>
                                        </label>
                                        <label className="toggle-label">
                                            <input type="checkbox" checked={settings.notifSms} onChange={e => setSettings(s => ({ ...s, notifSms: e.target.checked }))} />
                                            <span className="toggle-slider"></span>
                                            <span className="toggle-text">
                                                <strong>SMS Notifications</strong><small>Receive text messages for bookings and alerts</small>
                                            </span>
                                        </label>
                                        <label className="toggle-label">
                                            <input type="checkbox" checked={settings.notifPush} onChange={e => setSettings(s => ({ ...s, notifPush: e.target.checked }))} />
                                            <span className="toggle-slider"></span>
                                            <span className="toggle-text">
                                                <strong>Push Notifications</strong><small>Get in-app alerts and reminders</small>
                                            </span>
                                        </label>
                                    </div>
                                </div>

                                {/* Communication Method */}
                                <div className="settings-card">
                                    <h3 className="settings-card-title"><i className="fa-solid fa-comment-dots"></i> Preferred Communication Method</h3>
                                    <div className="settings-comm-options">
                                        {['Email', 'Phone', 'SMS', 'InApp'].map(method => (
                                            <label className="comm-option" key={method}>
                                                <input type="radio" name="commMethod" value={method} checked={settings.commMethod === method} onChange={() => setSettings(s => ({ ...s, commMethod: method }))} />
                                                <span className="comm-option-inner">
                                                    <i className={`fa-solid ${method === 'Email' ? 'fa-envelope' : method === 'Phone' ? 'fa-phone' : method === 'SMS' ? 'fa-message' : 'fa-mobile-screen'}`}></i>
                                                    {method === 'InApp' ? 'In-App' : method}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Language Preference */}
                                <div className="settings-card">
                                    <h3 className="settings-card-title"><i className="fa-solid fa-globe"></i> Language Preference</h3>
                                    <div className="settings-lang-options">
                                        <label className="comm-option">
                                            <input type="radio" name="langPref" value="ar" checked={settings.langPref === 'ar'} onChange={() => setSettings(s => ({ ...s, langPref: 'ar' }))} />
                                            <span className="comm-option-inner"><i className="fa-solid fa-language"></i> العربية</span>
                                        </label>
                                        <label className="comm-option">
                                            <input type="radio" name="langPref" value="en" checked={settings.langPref === 'en'} onChange={() => setSettings(s => ({ ...s, langPref: 'en' }))} />
                                            <span className="comm-option-inner"><i className="fa-solid fa-language"></i> English</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Preferred Locations */}
                                {!isProvider && (
                                    <div className="settings-card">
                                        <h3 className="settings-card-title"><i className="fa-solid fa-location-dot"></i> Preferred Locations</h3>
                                        <p className="settings-hint">Select the Jeddah neighborhoods where you'd like to find storage.</p>
                                        <div className="preferred-locations-grid">
                                            {['Al-Salama', 'Al-Rawdah', 'Al-Nahda', 'Al-Andalus', 'Al-Hamra', 'Al-Rehab', 'Al-Faisaliyah', 'Al-Naeem', 'Al-Basateen', 'Al-Shati', 'Al-Safa', 'Al-Aziziyah', 'Al-Baghdadiyah', 'Al-Balad'].map(loc => (
                                                <label className="location-checkbox" key={loc}>
                                                    <input type="checkbox" checked={settings.prefLocs.includes(loc)} onChange={(e) => {
                                                        const checked = e.target.checked;
                                                        setSettings(s => ({
                                                            ...s,
                                                            prefLocs: checked ? [...s.prefLocs, loc] : s.prefLocs.filter(l => l !== loc)
                                                        }));
                                                    }} /> {loc}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="profile-actions">
                                    <button type="submit" className="primary-btn" disabled={settingsSaving}>
                                        {settingsSaving ? 'Saving...' : 'Save Settings'}
                                    </button>
                                    {settingsSavedMsg && (
                                        <span className="save-msg" style={{ marginLeft: '1rem', color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                            <i className="fa-solid fa-check-circle"></i> Settings saved!
                                        </span>
                                    )}
                                </div>
                            </form>
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
