'use client';
import { useEffect, useState, useCallback } from 'react';
import Loader from '@/components/Loader';
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
    AreaChart, Area, LineChart, Line,
} from 'recharts';
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
    SpaceID?: number;
}

interface CalendarBooking {
    BookingID: number;
    SpaceID: number;
    SpaceTitle: string;
    StartDate: string;
    EndDate: string;
    BookingStatus: string;
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
    IsFavorited?: boolean;
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
    const lang = usePageLanguage();
    const t = translations[lang];
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [token, setToken] = useState<string>('');
    const [activeSection, setActiveSection] = useState('profileSection');
    const [isFirstLogin, setIsFirstLogin] = useState(false);

    // Seeker data
    const [seekerBookings, setSeekerBookings] = useState<BookingItem[]>([]);
    // Provider data
    const [providerSpaces, setProviderSpaces] = useState<SpaceItem[]>([]);
    const [providerBookings, setProviderBookings] = useState<BookingItem[]>([]);
    const [calendarBookings, setCalendarBookings] = useState<CalendarBooking[]>([]);
    const [calendarMonth, setCalendarMonth] = useState(new Date());
    const [calendarFilter, setCalendarFilter] = useState<number | 'all'>('all');
    const [calendarTooltip, setCalendarTooltip] = useState<{ booking: CalendarBooking; x: number; y: number } | null>(null);
    const [spaceReviewsMap, setSpaceReviewsMap] = useState<Record<number, Array<{
        ReviewID: number; Rating: number; Comment?: string;
        SeekerFirstName?: string; SeekerLastName?: string;
        ProviderResponse?: string; ProviderResponseDate?: string; CreatedAt: string;
    }>>>({});
    const [replyTexts, setReplyTexts] = useState<Record<number, string>>({});
    const [replyLoading, setReplyLoading] = useState<number | null>(null);


    const [showFavorites, setShowFavorites] = useState(false);
    const [favorites, setFavorites] = useState<SpaceItem[]>([]);
    const [favoritesLoading, setFavoritesLoading] = useState(false);

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
        try {
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
        } catch (error) {
            console.error("Failed to parse user data", error);
            localStorage.removeItem('siaaUser');
            localStorage.removeItem('siaaToken');
            window.location.href = '/login';
        }
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

                // Populate settings
                let notifs = { email: true, sms: true, push: true };
                try {
                    if (p.NotificationPreferences) {
                        notifs = JSON.parse(p.NotificationPreferences);
                    }
                } catch (e) { console.error("Failed to parse notifications", e); }

                setSettings({
                    notifEmail: notifs.email !== false,
                    notifSms: notifs.sms !== false,
                    notifPush: notifs.push !== false,
                    commMethod: p.PreferredCommunicationMethod || 'Email',
                    langPref: p.PreferredLanguage || 'ar',
                    prefLocs: p.PreferredLocations ? p.PreferredLocations.split(',').filter(Boolean) : [],
                    iban: p.IBAN || '',
                    bankName: p.BankName || '',
                    accountName: p.BankAccountNumber || '', // Reusing this for accountName display if needed
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
                // Load calendar data
                const calRes = await fetch(`/api/provider/${user.id}/calendar`, { headers: authHeaders(t) });
                if (calRes.ok) {
                    const calData = await calRes.json();
                    setCalendarBookings(calData.bookings || []);
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
        if (!confirm(t.confirmDeleteSpace)) return;
        const res = await fetch(`/api/spaces/${spaceId}`, {
            method: 'DELETE',
            headers: authHeaders(token),
        });
        if (res.ok) {
            setProviderSpaces(prev => prev.filter(s => s.SpaceID !== spaceId));
        } else {
            const d = await res.json();
            alert(d.error || t.failedToDeleteSpace);
        }
    }

    async function handleCancelBooking(bookingId: number) {
        if (!confirm(t.confirmCancelBooking)) return;
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
            alert(d.error || t.failedToCancelBooking);
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
            alert(d.error || t.failedToUpdateStatus);
        }
    }

    async function handleSubmitReview() {
        if (!reviewModal || !currentUser) return;
        if (reviewRating === 0) { setReviewError(t.pleaseSelectRating); return; }
        if (reviewComment.length < 10) { setReviewError(t.reviewMinCharacters); return; }

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
            setReviewError(d.error || t.failedToSubmitReview);
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
            alert(t.failedToSaveProfile);
        }
        setProfileSaving(false);
    }

    async function handleDismissBooking(bookingId: number) {
        const res = await fetch(`/api/bookings/${bookingId}/dismiss`, {
            method: 'DELETE',
            headers: authHeaders(token),
        });
        if (res.ok) {
            setSeekerBookings(prev => prev.filter(b => b.BookingID !== bookingId));
            setProviderBookings(prev => prev.filter(b => b.BookingID !== bookingId));
        } else {
            const d = await res.json();
            alert(d.error || t.failedToDismissBooking);
        }
    }

    function normalizeSpace(space: SpaceItem): SpaceItem {
        return {
            ...space,
            FavoriteCount: Number(space.FavoriteCount || 0),
            IsFavorited: true,
        };
    }

    async function fetchFavorites() {
        if (!token) return;

        setFavoritesLoading(true);

        try {
            const res = await fetch('/api/favorites', {
                headers: authHeaders(token),
            });

            const json = await res.json();
            const data = json.data || json;

            setFavorites((data.favorites || []).map(normalizeSpace));
            setShowFavorites(true);
        } finally {
            setFavoritesLoading(false);
        }
    }

    async function removeFavorite(spaceId: number) {
        if (!token) return;

        const res = await fetch(`/api/spaces/${spaceId}/favorite`, {
            method: 'DELETE',
            headers: authHeaders(token),
        });

        const json = await res.json();
        const data = json.data || json;

        if (!res.ok) {
            alert(json.error || 'Failed to remove favorite');
            return;
        }

        setFavorites(prev => prev.filter(space => space.SpaceID !== spaceId));

        setProviderSpaces(prev =>
            prev.map(space =>
                space.SpaceID === spaceId
                    ? { ...space, FavoriteCount: Number(data.FavoriteCount || 0) }
                    : space
            )
        );
    }

    async function fetchSpaceReviewsForProvider(spaceId: number) {
        try {
            const res = await fetch(`/api/spaces/${spaceId}/reviews`);
            const json = await res.json();
            setSpaceReviewsMap(prev => ({ ...prev, [spaceId]: json.reviews || [] }));
        } catch {
            setSpaceReviewsMap(prev => ({ ...prev, [spaceId]: [] }));
        }
    }

    async function handleReplyToReview(reviewId: number, spaceId: number) {
        const text = replyTexts[reviewId]?.trim();
        if (!text) return;
        setReplyLoading(reviewId);
        try {
            const res = await fetch(`/api/spaces/${spaceId}/reviews`, {
                method: 'POST',
                headers: authHeaders(token),
                body: JSON.stringify({ reviewId, response: text }),
            });
            if (res.ok) {
                setReplyTexts(prev => ({ ...prev, [reviewId]: '' }));
                fetchSpaceReviewsForProvider(spaceId);
            } else {
                const d = await res.json();
                alert(d.error || 'Failed to submit reply');
            }
        } finally {
            setReplyLoading(null);
        }
    }
    function logout() {
        localStorage.removeItem('siaaUser');
        localStorage.removeItem('siaaToken');
        window.location.href = '/login';
    }

    if (!currentUser) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader /></div>;

    const isProvider = currentUser.userType === 'provider';
    const welcomeMessage = isFirstLogin
        ? `${t.welcome}, ${currentUser.firstName}! 👋`
        : `${t.welcomeBack}, ${currentUser.firstName}!`;

    return (
        <>
            <header className="header">
                <div className="container">
                    <div className="header-content">
                        {/* Navigation temporarily disabled */}
                        {/*
    <nav className="nav">
        <a href="#about">{t.about}</a>
        <a href="#features">{t.features}</a>
        <a href="#how-it-works">{t.howItWorks}</a>
    </nav>
    */}

                        <div className="logo">
                            <img src="/Media/Logo.png" alt={t.logoAlt} className="logo-img" />
                        </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', padding: '6px 20px' }}>
                                <LanguageToggle />
                        </div>
                    </div>
                    
                </div>
            </header>

            <div className="dashboard">
                {/* Sidebar */}
                <aside className="sideBar">
                    <a href="#" className={`sideBar-link ${activeSection === 'profileSection' ? 'is-active' : ''}`}
                        onClick={e => { e.preventDefault(); setActiveSection('profileSection'); }}>
                        <i className="fa-solid fa-user"></i> {t.profile}                    </a>
                    {isProvider ? (
                        <>
                            <a
                                href="#"
                                className={`sideBar-link ${activeSection === 'spacesSection' ? 'is-active' : ''}`}
                                onClick={e => { e.preventDefault(); setActiveSection('spacesSection'); }}
                            >
                                <i className="fa-solid fa-box"></i> {t.mySpaces}
                            </a>

                            <a
                                href="#"
                                className={`sideBar-link ${activeSection === 'bookingsSection' ? 'is-active' : ''}`}
                                onClick={e => { e.preventDefault(); setActiveSection('bookingsSection'); }}
                            >
                                <i className="fa-solid fa-calendar-check"></i> {t.bookingRequests}
                            </a>

                            <a
                                href="#"
                                className={`sideBar-link ${activeSection === 'calendarSection' ? 'is-active' : ''}`}
                                onClick={e => { e.preventDefault(); setActiveSection('calendarSection'); }}
                            >
                                <i className="fa-solid fa-calendar-days"></i> {t.calendar}
                            </a>
                        </>
                    ) : (
                        <a
                            href="#"
                            className={`sideBar-link ${activeSection === 'historySection' ? 'is-active' : ''}`}
                            onClick={e => { e.preventDefault(); setActiveSection('historySection'); }}
                        >
                            <i className="fa-solid fa-clock-rotate-left"></i> {t.myBookings}
                        </a>
                    )}

                    <a
                        href="#"
                        className={`sideBar-link ${activeSection === 'statsSection' ? 'is-active' : ''}`}
                        onClick={e => { e.preventDefault(); setActiveSection('statsSection'); }}
                    >
                        <i className="fa-solid fa-chart-line"></i> {t.statistics}
                    </a>

                    <a
                        href="#"
                        className={`sideBar-link ${activeSection === 'settingsSection' ? 'is-active' : ''}`}
                        onClick={e => { e.preventDefault(); setActiveSection('settingsSection'); }}
                    >
                        <i className="fa-solid fa-gear"></i> {t.settings}
                    </a>

                    <a
                        href="#"
                        className="sideBar-link logout-link"
                        onClick={e => { e.preventDefault(); logout(); }}
                    >
                        <i className="fa-solid fa-right-from-bracket"></i> {t.logout}
                    </a>
                </aside>

                {/* Main content */}
                <main className="dashboard-main">
                    <div className="container">
                        <div className="dashboard-header">
                            <div className="dashboard-title-box">
                                <h1 className="dashboard-title">{welcomeMessage}</h1>
                                <p className="dashboard-subtitle" id="userRoleDisplay">
                                    {isProvider ? t.storageProvider : t.storageSeeker}                                </p>
                            </div>
                            <a
                                href={isProvider ? '/list-space' : '/search'}
                                className="dashboard-btn"
                            >
                                {isProvider ? t.listNewSpace : t.browseSpaces}                            </a>
                        </div>

                        {/* Profile Section */}
                        <section id="profileSection" className={`dashboard-section ${activeSection === 'profileSection' ? 'is-active' : ''}`}>
                            <h2 className="section-title">{t.profile}</h2>                            <div className="profile-form">
                                <div className="profile-grid">
                                    <div className="form-group profile-picture-group">
                                        <label className="form-label">{t.profilePictureOptional}</label>                                        <div className="profile-picture-wrapper">
                                            <div className={`profile-picture-preview ${profilePic ? 'has-image' : ''}`}>
                                                {profilePic ? (
                                                    <img src={profilePic} alt={t.profilePreview} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} onError={(e) => { e.currentTarget.src = '/Media/default-avatar.png'; }} />
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
                                                <p className="profile-picture-hint">
                                                    {t.profilePictureHint}
                                                </p>                                            </div>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="profileFirstName">{t.firstName}</label>
                                        <input
                                            type="text"
                                            id="profileFirstName"
                                            className="form-input"
                                            value={profile.firstName}
                                            disabled={!profileEditing}
                                            onChange={e =>
                                                setProfile(p => ({
                                                    ...p,
                                                    firstName: e.target.value
                                                }))
                                            }
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="profileLastName">{t.lastName}</label>
                                        <input
                                            type="text"
                                            id="profileLastName"
                                            className="form-input"
                                            value={profile.lastName}
                                            disabled={!profileEditing}
                                            onChange={e =>
                                                setProfile(p => ({
                                                    ...p,
                                                    lastName: e.target.value
                                                }))
                                            }
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>{t.email}</label>
                                        <input
                                            type="email"
                                            className="form-input"
                                            value={profile.email}
                                            disabled
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="profilePhone">{t.phone}</label>
                                        <input
                                            type="tel"
                                            id="profilePhone"
                                            className="form-input"
                                            value={profile.phone}
                                            disabled={!profileEditing}
                                            onChange={e =>
                                                setProfile(p => ({
                                                    ...p,
                                                    phone: e.target.value
                                                }))
                                            }
                                        />
                                    </div>

                                    {!isProvider && (
                                        <div className="form-group">
                                            <label>{t.companyOptional}</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={profile.companyName}
                                                disabled={!profileEditing}
                                                onChange={e =>
                                                    setProfile(p => ({
                                                        ...p,
                                                        companyName: e.target.value
                                                    }))
                                                }
                                            />
                                        </div>
                                    )}

                                    {isProvider && (
                                        <div className="form-group">
                                            <label>{t.businessName}</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={profile.businessName}
                                                disabled={!profileEditing}
                                                onChange={e =>
                                                    setProfile(p => ({
                                                        ...p,
                                                        businessName: e.target.value
                                                    }))
                                                }
                                            />
                                        </div>
                                    )}
                                    <div className="form-group">
                                        <label>{t.accountType}</label>
                                        <input type="text" className="form-input" value={profile.role} disabled />
                                    </div>
                                    <div className="form-group">
                                        <label>{t.accountStatus}</label>
                                        <input type="text" className="form-input" value={profile.status} disabled />
                                    </div>
                                </div>
                                <div className="profile-actions">
                                    <button
                                        type="button"
                                        className="secondary-btn"
                                        onClick={() => setProfileEditing(!profileEditing)}
                                    >
                                        {profileEditing ? t.cancel : t.edit}
                                    </button>
                                    {profileEditing && (
                                        <button
                                            type="button"
                                            className="primary-btn"
                                            onClick={handleSaveProfile}
                                            disabled={profileSaving}
                                        >
                                            {profileSaving ? t.saving : t.save}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* History Section (Seeker) */}
                        {(!isProvider) && (
                            <section id="historySection" className={`dashboard-section ${activeSection === 'historySection' ? 'is-active' : ''}`}>
                                <h2 className="section-title">{t.myBookings}</h2>

                                {historyLoading && <Loader />}

                                {/* SEEKER VIEW */}
                                {!isProvider && !historyLoading && (
                                    <ul className="history-list">
                                        {seekerBookings.length === 0 && (
                                            <p className="history-empty">
                                                {t.noBookingsYet}{' '}
                                                <a href="/search">{t.browseSpaces}</a>{' '}
                                                {t.toGetStarted}
                                            </p>
                                        )}
                                        {seekerBookings.map(booking => (
                                            <li key={booking.BookingID} className="history-item" style={{ position: 'relative' }}>
                                                {booking.BookingStatus === 'Rejected' && (
                                                    <button className="dismiss-btn" onClick={() => handleDismissBooking(booking.BookingID)} title={t.dismiss}>
                                                        <i className="fa-solid fa-xmark"></i>
                                                    </button>
                                                )}
                                                <div className="history-item-header">
                                                    <h3 className="history-item-title">{booking.SpaceTitle}</h3>
                                                    <div className="history-item-badges">
                                                        <span className={`history-item-badge ${STATUS_CLASS[booking.BookingStatus] || 'status-default'}`}>
                                                            {booking.BookingStatus}
                                                        </span>
                                                        {Boolean(booking.HasReview) && (
                                                            <span className="review-badge"><i className="fa-solid fa-check-circle"></i> {t.reviewed}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="history-item-details">
                                                    <p><i className="fa-solid fa-location-dot"></i> {booking.City}, {booking.AddressLine1}</p>
                                                    <p><i className="fa-solid fa-calendar"></i> {formatDate(booking.StartDate)} - {formatDate(booking.EndDate)}</p>
                                                    <p><i className="fa-solid fa-user"></i>  {t.provider}: {booking.ProviderName}</p>
                                                    <p><i className="fa-solid fa-box"></i> {booking.SpaceType} · {booking.Size} m²</p>
                                                </div>
                                                <div className="history-item-footer">
                                                    <div className="history-item-footer-left">
                                                        <span className="history-item-date">{t.booked}: {formatDate(booking.CreatedAt)}</span><br />
                                                        <span className="history-item-price">{formatPrice(booking.TotalAmount)} {t.sar}</span>
                                                    </div>
                                                    <div className="history-item-footer-right">
                                                        {booking.BookingStatus === 'Pending' && (
                                                            <button
                                                                className="btn btn-outline btn-small"
                                                                onClick={() => handleCancelBooking(booking.BookingID)}
                                                            >
                                                                {t.cancel}
                                                            </button>
                                                        )}
                                                        {booking.BookingStatus === 'Completed' && !booking.HasReview && (
                                                            <button
                                                                className="btn btn-outline btn-small review-btn"
                                                                onClick={() => { setReviewModal(booking); setReviewRating(0); setReviewComment(''); setReviewError(''); }}
                                                            >
                                                                <i className="fa-solid fa-star"></i>{t.writeReview}
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
                                <h2 className="section-title">{t.yourListedSpaces}</h2>
                                {historyLoading && <Loader />}
                                {!historyLoading && (
                                    <div>
                                        <ul className="history-list">
                                            {providerSpaces.length === 0 && (
                                                <p className="history-empty">{t.noSpacesListedYet} <a href="/list-space">{t.listASpace}</a> {t.toStartEarning}</p>
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
                                                        <p>
                                                        <i className="fa-solid fa-heart" style={{ color: '#ff6b35' }}></i>
                                                        {' '}
                                                        {Number(space.FavoriteCount || 0)} {t.favorites}
                                                        {' '}·{' '}
                                                        {space.TotalBookings} {t.bookings}
                                                        </p>                                                    </div>
                                                    <div className="history-item-footer">
                                                        <span className="history-item-price">{formatPrice(space.PricePerMonth)} SAR/month</span>
                                                        <span className="history-item-date">{t.listed} {formatDate(space.CreatedAt)}</span>
                                                    </div>
                                                    <div className="history-item-footer" style={{ marginTop: '0.5rem', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                        <button className="btn btn-outline btn-small" style={{ borderColor: '#3b82f6', color: '#3b82f6' }}
                                                            onClick={() => {
                                                                if (spaceReviewsMap[space.SpaceID]) {
                                                                    setSpaceReviewsMap(prev => { const copy = { ...prev }; delete copy[space.SpaceID]; return copy; });
                                                                } else {
                                                                    fetchSpaceReviewsForProvider(space.SpaceID);
                                                                }
                                                            }}>
                                                            <i className={`fa-solid ${spaceReviewsMap[space.SpaceID] ? 'fa-chevron-up' : 'fa-star'}`}></i>
                                                            {spaceReviewsMap[space.SpaceID] ? 'Hide Reviews' : 'Reviews'}
                                                        </button>
                                                        <a href={`/edit-space/${space.SpaceID}`} className="btn btn-outline btn-small" style={{ borderColor: '#f97316', color: '#f97316' }}>
                                                            <i className="fa-solid fa-pen"></i> {t.edit}
                                                        </a>
                                                        <button className="btn btn-outline btn-small" style={{ borderColor: '#6b7280', color: '#6b7280' }} onClick={() => handleDeleteSpace(space.SpaceID)}>
                                                            <i className="fa-solid fa-trash"></i> {t.delete}
                                                        </button>
                                                    </div>

                                                    {/* Reviews for this space */}
                                                    {spaceReviewsMap[space.SpaceID] && (
                                                        <div style={{ marginTop: '12px', padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                                                            <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#1a365d', margin: '0 0 10px 0' }}>Reviews ({spaceReviewsMap[space.SpaceID].length})</h4>
                                                            {spaceReviewsMap[space.SpaceID].length === 0 ? (
                                                                <p style={{ color: '#a0aec0', fontSize: '13px', fontStyle: 'italic' }}>No reviews yet for this space.</p>
                                                            ) : spaceReviewsMap[space.SpaceID].map(review => (
                                                                <div key={review.ReviewID} style={{ padding: '10px', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '8px' }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                                                        <span style={{ fontWeight: 700, fontSize: '13px', color: '#1a365d' }}>
                                                                            {review.SeekerFirstName || 'User'} {review.SeekerLastName ? review.SeekerLastName.charAt(0) + '.' : ''}
                                                                        </span>
                                                                        <div style={{ display: 'flex', gap: '2px', fontSize: '13px' }}>
                                                                            {Array.from({ length: 5 }).map((_, i) => (
                                                                                <span key={i} style={{ color: i < review.Rating ? '#f59e0b' : '#d1d5db' }}>★</span>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                    {review.Comment && <p style={{ margin: '4px 0', fontSize: '13px', color: '#4a5568' }}>{review.Comment}</p>}

                                                                    {/* Existing provider response */}
                                                                    {review.ProviderResponse ? (
                                                                        <div style={{ marginTop: '8px', padding: '8px 10px', background: '#fff5f0', borderRadius: '6px', borderLeft: '3px solid #ff6b35' }}>
                                                                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#ff6b35', marginBottom: '2px' }}>
                                                                                <i className="fa-solid fa-reply" style={{ fontSize: '9px', marginRight: '4px' }}></i>Your Reply
                                                                            </div>
                                                                            <p style={{ margin: 0, fontSize: '13px', color: '#4a5568' }}>{review.ProviderResponse}</p>
                                                                        </div>
                                                                    ) : (
                                                                        /* Reply input */
                                                                        <div style={{ marginTop: '8px', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                                                                            <input
                                                                                type="text"
                                                                                placeholder="Write a reply..."
                                                                                value={replyTexts[review.ReviewID] || ''}
                                                                                onChange={e => setReplyTexts(prev => ({ ...prev, [review.ReviewID]: e.target.value }))}
                                                                                style={{ flex: 1, padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none' }}
                                                                                onFocus={e => { e.currentTarget.style.borderColor = '#ff6b35'; }}
                                                                                onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; }}
                                                                            />
                                                                            <button
                                                                                onClick={() => handleReplyToReview(review.ReviewID, space.SpaceID)}
                                                                                disabled={replyLoading === review.ReviewID || !replyTexts[review.ReviewID]?.trim()}
                                                                                style={{
                                                                                    padding: '6px 12px', borderRadius: '6px', border: 'none',
                                                                                    background: replyTexts[review.ReviewID]?.trim() ? '#ff6b35' : '#e2e8f0',
                                                                                    color: replyTexts[review.ReviewID]?.trim() ? '#fff' : '#a0aec0',
                                                                                    fontSize: '12px', fontWeight: 700, cursor: replyTexts[review.ReviewID]?.trim() ? 'pointer' : 'not-allowed',
                                                                                }}
                                                                            >
                                                                                {replyLoading === review.ReviewID ? <i className="fa-solid fa-spinner fa-spin"></i> : 'Reply'}
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
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
                                <h2 className="section-title">{t.incomingBookingRequests}</h2>
                                {historyLoading && <Loader />}
                                {!historyLoading && (
                                    <div>
                                        <ul className="history-list">
                                            {providerBookings.length === 0 && <p>{t.noBookingRequestsYet}</p>}
                                            {providerBookings.map(booking => (
                                                <li key={booking.BookingID} className="history-item" style={{ position: 'relative' }}>
                                                    {booking.BookingStatus === 'Rejected' && (
                                                        <button className="dismiss-btn" onClick={() => handleDismissBooking(booking.BookingID)} title={t.dismiss}>
                                                            <i className="fa-solid fa-xmark"></i>
                                                        </button>
                                                    )}
                                                    <div className="history-item-header">
                                                        <h3 className="history-item-title">{booking.SpaceTitle}</h3>
                                                        <span className={`history-item-badge ${STATUS_CLASS[booking.BookingStatus] || 'status-default'}`}>
                                                            {booking.BookingStatus}
                                                        </span>
                                                    </div>
                                                    <div className="history-item-details">
                                                        <p><i className="fa-solid fa-user"></i>  {t.seeker}: {booking.SeekerName} · {booking.SeekerEmail}</p>
                                                        <p><i className="fa-solid fa-calendar"></i> {formatDate(booking.StartDate)} - {formatDate(booking.EndDate)}</p>
                                                        <p><i className="fa-solid fa-money-bill"></i> {formatPrice(booking.TotalAmount)} SAR</p>
                                                    </div>
                                                    {booking.BookingStatus === 'Pending' && (
                                                        <div className="history-item-footer" style={{ gap: '0.5rem' }}>
                                                            <button className="btn btn-dark btn-small"
                                                                onClick={() => handleUpdateBookingStatus(booking.BookingID, 'Confirmed')}>
                                                                {t.confirm}
                                                            </button>
                                                            <button className="btn btn-outline btn-small"
                                                                onClick={() => handleUpdateBookingStatus(booking.BookingID, 'Rejected')}>
                                                                {t.reject}
                                                            </button>
                                                        </div>
                                                    )}
                                                    {booking.BookingStatus === 'Confirmed' && (
                                                        <div className="history-item-footer">
                                                            <button className="btn btn-dark btn-small"
                                                                onClick={() => handleUpdateBookingStatus(booking.BookingID, 'Active')}>
                                                                {t.markActive}
                                                            </button>
                                                        </div>
                                                    )}
                                                    {booking.BookingStatus === 'Active' && (
                                                        <div className="history-item-footer">
                                                            <button className="btn btn-dark btn-small"
                                                                onClick={() => handleUpdateBookingStatus(booking.BookingID, 'Completed')}>
                                                                {t.markCompleted}
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

                        {/* Calendar Section (Provider) */}
                        {isProvider && (
                            <section id="calendarSection" className={`dashboard-section ${activeSection === 'calendarSection' ? 'is-active' : ''}`}>
                                <h2 className="section-title">{t.bookingCalendar}</h2>

                                {(() => {
                                    const SPACE_COLORS = ['#ff6b35', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];
                                    const year = calendarMonth.getFullYear();
                                    const month = calendarMonth.getMonth();
                                    const firstDay = new Date(year, month, 1).getDay();
                                    const daysInMonth = new Date(year, month + 1, 0).getDate();
                                    const monthLabel = calendarMonth.toLocaleDateString(
                                        lang === 'ar' ? 'ar-SA' : 'en-US',
                                        { year: 'numeric', month: 'long' }
                                    );
                                    // Build unique spaces list from calendar bookings
                                    const uniqueSpaces = Array.from(new Map(calendarBookings.map(b => [b.SpaceID, b.SpaceTitle])).entries())
                                        .map(([id, title], i) => ({ id, title, color: SPACE_COLORS[i % SPACE_COLORS.length] }));

                                    const filtered = calendarFilter === 'all' ? calendarBookings : calendarBookings.filter(b => b.SpaceID === calendarFilter);

                                    function getBookingsForDay(day: number) {
                                        const d = new Date(year, month, day);
                                        return filtered.filter(b => {
                                            const s = new Date(b.StartDate);
                                            const e = new Date(b.EndDate);
                                            s.setHours(0, 0, 0, 0);
                                            e.setHours(23, 59, 59, 999);
                                            return d >= s && d <= e;
                                        });
                                    }

                                    return (
                                        <div className="calendar-wrapper">
                                            <div className="calendar-controls">
                                                <button className="calendar-nav-btn" onClick={() => setCalendarMonth(new Date(year, month - 1, 1))}>
                                                    <i className="fa-solid fa-chevron-left"></i>
                                                </button>
                                                <h3 className="calendar-month-label">{monthLabel}</h3>
                                                <button className="calendar-nav-btn" onClick={() => setCalendarMonth(new Date(year, month + 1, 1))}>
                                                    <i className="fa-solid fa-chevron-right"></i>
                                                </button>

                                                <select
                                                    className="calendar-filter"
                                                    value={calendarFilter === 'all' ? 'all' : String(calendarFilter)}
                                                    onChange={e => setCalendarFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                                                >
                                                    <option value="all">{t.allSpaces}</option>
                                                    {uniqueSpaces.map(s => (
                                                        <option key={s.id} value={s.id}>{s.title}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="calendar-grid">
                                                {t.weekDays.map(d => (
                                                    <div key={d} className="calendar-day-header">{d}</div>
                                                ))}

                                                {Array.from({ length: firstDay }).map((_, i) => (
                                                    <div key={`empty-${i}`} className="calendar-day calendar-day--empty"></div>
                                                ))}

                                                {Array.from({ length: daysInMonth }).map((_, i) => {
                                                    const day = i + 1;
                                                    const dayBookings = getBookingsForDay(day);
                                                    const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

                                                    return (
                                                        <div key={day} className={`calendar-day ${dayBookings.length > 0 ? 'calendar-day--booked' : ''} ${isToday ? 'calendar-day--today' : ''}`}>
                                                            <span className="calendar-day-number">{day}</span>
                                                            <div className="calendar-day-chips">
                                                                {dayBookings.slice(0, 2).map(b => {
                                                                    const spaceInfo = uniqueSpaces.find(s => s.id === b.SpaceID);
                                                                    const isExpired = new Date(b.EndDate) < new Date();
                                                                    return (
                                                                        <div
                                                                            key={b.BookingID}
                                                                            className={`calendar-chip ${isExpired ? 'calendar-chip--expired' : ''}`}
                                                                            style={{ backgroundColor: isExpired ? '#cbd5e0' : (spaceInfo?.color || '#ff6b35') }}
                                                                            onMouseEnter={(e) => {
                                                                                const rect = e.currentTarget.getBoundingClientRect();
                                                                                setCalendarTooltip({ booking: b, x: rect.left + rect.width / 2, y: rect.top - 8 });
                                                                            }}
                                                                            onMouseLeave={() => setCalendarTooltip(null)}
                                                                        ></div>
                                                                    );
                                                                })}
                                                                {dayBookings.length > 2 && (
                                                                    <span className="calendar-chip-more">+{dayBookings.length - 2}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Floating Tooltip */}
                                            {calendarTooltip && (
                                                <div className="calendar-tooltip" style={{
                                                    position: 'fixed',
                                                    left: calendarTooltip.x,
                                                    top: calendarTooltip.y,
                                                    transform: 'translate(-50%, -100%)',
                                                    zIndex: 100,
                                                }}>
                                                    <strong>{calendarTooltip.booking.SpaceTitle}</strong>
                                                    <span>{formatDate(calendarTooltip.booking.StartDate)} – {formatDate(calendarTooltip.booking.EndDate)}</span>
                                                    <span className={`calendar-tooltip-status ${new Date(calendarTooltip.booking.EndDate) < new Date() ? 'expired' : ''}`}>
                                                        {new Date(calendarTooltip.booking.EndDate) < new Date() ? 'Completed' : calendarTooltip.booking.BookingStatus}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Legend */}
                                            {uniqueSpaces.length > 0 && (
                                                <div className="calendar-legend">
                                                    {uniqueSpaces.map(s => (
                                                        <div key={s.id} className="calendar-legend-item">
                                                            <span className="calendar-legend-dot" style={{ backgroundColor: s.color }}></span>
                                                            <span className="calendar-legend-label">{s.title}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {calendarBookings.length === 0 && (
                                                <p className="history-empty" style={{ marginTop: '1.5rem' }}>{t.noConfirmedBookingsYet}</p>
                                            )}
                                        </div>
                                    );
                                })()}
                            </section>
                        )}

                        {/* Stats Section */}
                        <section id="statsSection" className={`dashboard-section ${activeSection === 'statsSection' ? 'is-active' : ''}`}>
                            <h2 className="section-title">{t.statistics}</h2>

                            {/* ── KPI Cards ───────────────────────────────── */}
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <div className="stat-icon"><i className="fa-solid fa-box"></i></div>
                                    <div className="stat-content">
                                        <h3 className="stat-value">{isProvider ? (stats.TotalSpaces || 0) : (stats.TotalBookings || 0)}</h3>
                                        <p className="stat-label">{isProvider ? t.totalSpaces : t.totalBookings}</p>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon"><i className="fa-solid fa-check-circle"></i></div>
                                    <div className="stat-content">
                                        <h3 className="stat-value">{stats.ActiveBookings || stats.ActiveSpaces || 0}</h3>
                                        <p className="stat-label">{t.active}</p>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon"><i className="fa-solid fa-clock"></i></div>
                                    <div className="stat-content">
                                        <h3 className="stat-value">{stats.PendingBookings || stats.PendingBookingRequests || 0}</h3>
                                        <p className="stat-label">{t.pending}</p>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon"><i className="fa-solid fa-chart-line"></i></div>
                                    <div className="stat-content">
                                        <h3 className="stat-value">{formatPrice(isProvider ? stats.TotalRevenue : stats.TotalSpent)} SAR</h3>
                                        <p className="stat-label">{isProvider ? t.totalRevenue : t.totalSpent}</p>
                                    </div>
                                </div>
                            </div>

                            {/* ── Shared data ─────────────────────────────── */}
                            {(() => {
                                const bookings = isProvider ? providerBookings : seekerBookings;

                                // Count statuses directly from the bookings array
                                const active = bookings.filter(b => ['Active', 'Confirmed'].includes(b.BookingStatus)).length;
                                const pending = bookings.filter(b => ['Pending', 'UnderReview'].includes(b.BookingStatus)).length;
                                const completed = bookings.filter(b => b.BookingStatus === 'Completed').length;
                                const cancelled = bookings.filter(b => ['Cancelled', 'Rejected'].includes(b.BookingStatus)).length;
                                const total = bookings.length;

                                const PIE_COLORS = ['#ff6b35', '#3b82f6', '#10b981', '#ef4444', '#94a3b8'];
                                const pieData = [
                                    { name: t.active, value: active },
                                    { name: t.pending, value: pending },
                                    { name: t.completed, value: completed },
                                    ...(cancelled > 0 ? [{ name: t.cancelled, value: cancelled }] : []),
                                ].filter(d => d.value > 0);

                                const barData = [
                                    { name: t.active, count: active, fill: '#ff6b35' },
                                    { name: t.pending, count: pending, fill: '#3b82f6' },
                                    { name: t.completed, count: completed, fill: '#10b981' },
                                    ...(cancelled > 0 ? [{ name: t.cancelled, count: cancelled, fill: '#ef4444' }] : []),
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

                                const hasStatus = total > 0;
                                const hasRevData = revenueData.some(d => d.revenue > 0);
                                const hasBkData = bookingsData.some(d => d.bookings > 0);

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
                                        {t.noDataYet}
                                    </div>
                                );

                                return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.75rem' }}>

                                        {/* ── Row 1: Revenue (wide) + Donut (narrow) ── */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.25rem', alignItems: 'stretch' }}>

                                            {card(<>
                                                {chartTitle(
                                                    isProvider ? t.revenueOverTime : t.spendingOverTime,
                                                    `· ${t.last6Months} · ${t.currency}`
                                                )}
                                                {hasRevData ? (
                                                    <ResponsiveContainer width="100%" height={230}>
                                                        <AreaChart data={revenueData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                                                            <defs>
                                                                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                                                    <stop offset="5%" stopColor="#ff6b35" stopOpacity={0.15} />
                                                                    <stop offset="95%" stopColor="#ff6b35" stopOpacity={0} />
                                                                </linearGradient>
                                                            </defs>
                                                            <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
                                                            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                                            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={45} />
                                                            <Tooltip
                                                                formatter={(v: any) => [`${v} ${t.currency}`, isProvider ? t.revenue : t.spent]}
                                                                contentStyle={{
                                                                    borderRadius: '10px',
                                                                    fontSize: '12px',
                                                                    border: '1px solid #e2e8f0',
                                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                                                                }}
                                                            />
                                                            <Area type="monotone" dataKey="revenue" stroke="#ff6b35" strokeWidth={2.5} fill="url(#revGrad)" dot={{ r: 4, fill: '#ff6b35', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                                                        </AreaChart>
                                                    </ResponsiveContainer>
                                                ) : empty(230)}
                                            </>)}

                                            {card(<>
                                                {chartTitle(isProvider ? t.spaceStatus : t.bookingStatus)}
                                                {hasStatus ? (
                                                    <ResponsiveContainer width="100%" height={230}>
                                                        <PieChart>
                                                            <Pie data={pieData} cx="50%" cy="45%" innerRadius={60} outerRadius={88} paddingAngle={3} dataKey="value">
                                                                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                                            </Pie>
                                                            <Tooltip formatter={(v: any) => [v, t.count]} contentStyle={{ borderRadius: '10px', fontSize: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                                                            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px', paddingTop: '4px' }} />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                ) : empty(230)}
                                            </>)}
                                        </div>

                                        {/* ── Row 2: Bookings line + Bar ── */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', alignItems: 'stretch' }}>

                                            {card(<>
                                                {chartTitle(t.bookingsOverTime, `· ${t.last6Months}`)}
                                                {hasBkData ? (
                                                    <ResponsiveContainer width="100%" height={200}>
                                                        <AreaChart data={bookingsData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                                                            <defs>
                                                                <linearGradient id="bkGrad" x1="0" y1="0" x2="0" y2="1">
                                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                                </linearGradient>
                                                            </defs>
                                                            <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
                                                            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                                            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={30} />
                                                            <Tooltip formatter={(v: any) => [v, t.bookings]} contentStyle={{ borderRadius: '10px', fontSize: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                                                            <Area type="monotone" dataKey="bookings" stroke="#3b82f6" strokeWidth={2.5} fill="url(#bkGrad)" dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                                                        </AreaChart>
                                                    </ResponsiveContainer>
                                                ) : empty(200)}
                                            </>)}

                                            {card(<>
                                                {chartTitle(t.countByStatus)}
                                                {hasStatus ? (
                                                    <ResponsiveContainer width="100%" height={200}>
                                                        <BarChart data={barData} barSize={32} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                                                            <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
                                                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                                            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={30} />
                                                            <Tooltip formatter={(v: any) => [v, t.count]} contentStyle={{ borderRadius: '10px', fontSize: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} cursor={{ fill: '#f8fafc' }} />
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
                            <h2 className="section-title">{t.settings}</h2>

                            <form className="profile-form" onSubmit={async (e) => {
                                e.preventDefault();
                                if (!currentUser || !token) return;
                                setSettingsSaving(true);

                                try {
                                    const body: any = {
                                        notificationPreferences: JSON.stringify({
                                            email: settings.notifEmail,
                                            sms: settings.notifSms,
                                            push: settings.notifPush
                                        }),
                                        preferredCommunicationMethod: settings.commMethod,
                                        preferredLanguage: settings.langPref
                                    };

                                    if (isProvider) {
                                        body.iban = settings.iban;
                                        body.bankName = settings.bankName;
                                        body.bankAccountNumber = settings.accountName;
                                    } else {
                                        body.preferredLocations = settings.prefLocs.join(',');
                                    }

                                    const res = await fetch(`/api/profile/${currentUser.userType}/${currentUser.id}`, {
                                        method: 'PUT',
                                        headers: authHeaders(token),
                                        body: JSON.stringify(body)
                                    });

                                    if (res.ok) {
                                        setSettingsSavedMsg(true);
                                        setTimeout(() => setSettingsSavedMsg(false), 3000);
                                    } else {
                                        const d = await res.json();
                                        alert(d.error || t.failedToSaveSettings);
                                    }
                                } catch (err) {
                                    console.error("Save settings error:", err);
                                    alert(t.failedToSaveSettings);
                                } finally {
                                    setSettingsSaving(false);
                                }
                            }}>

                                {/* Bank Information (Provider Only) */}
                                {isProvider && (
                                    <div className="settings-card">
                                        <h3 className="settings-card-title"><i className="fa-solid fa-building-columns"></i> {t.bankInformation}</h3>
                                        <p className="settings-hint">{t.whereShouldWeSendYourPayouts}</p>
                                        <div className="profile-grid" style={{ marginBottom: 0 }}>
                                            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                                <label>{t.ibanNumber}</label>
                                                <input type="text" className="form-input" placeholder={t.ibanPlaceholder} value={settings.iban} onChange={e => setSettings(s => ({ ...s, iban: e.target.value }))} />
                                            </div>
                                            <div className="form-group">
                                                <label>{t.bankName}</label>
                                                <input type="text" className="form-input" placeholder={t.bankNamePlaceholder} value={settings.bankName} onChange={e => setSettings(s => ({ ...s, bankName: e.target.value }))} />
                                            </div>
                                            <div className="form-group">
                                                <label>{t.accountName}</label>
                                                <input type="text" className="form-input" placeholder={t.accountNamePlaceholder} value={settings.accountName} onChange={e => setSettings(s => ({ ...s, accountName: e.target.value }))} />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Notification Preferences */}
                                <div className="settings-card">
                                    <h3 className="settings-card-title"><i className="fa-solid fa-bell"></i> {t.notifications}</h3>
                                    <div className="settings-toggles">
                                        <label className="toggle-label">
                                            <input type="checkbox" checked={settings.notifEmail} onChange={e => setSettings(s => ({ ...s, notifEmail: e.target.checked }))} />
                                            <span className="toggle-slider"></span>
                                            <span className="toggle-text">
                                                <strong>{t.emailNotifications}</strong><small>{t.emailNotifications}</small>
                                            </span>
                                        </label>
                                        <label className="toggle-label">
                                            <input type="checkbox" checked={settings.notifSms} onChange={e => setSettings(s => ({ ...s, notifSms: e.target.checked }))} />
                                            <span className="toggle-slider"></span>
                                            <span className="toggle-text">
                                                <strong>{t.smsNotifications}</strong><small>{t.receiveSmsUpdates}</small>
                                            </span>
                                        </label>
                                        <label className="toggle-label">
                                            <input type="checkbox" checked={settings.notifPush} onChange={e => setSettings(s => ({ ...s, notifPush: e.target.checked }))} />
                                            <span className="toggle-slider"></span>
                                            <span className="toggle-text">
                                                <strong>{t.pushNotifications}</strong><small>{t.getInAppAlerts}</small>
                                            </span>
                                        </label>
                                    </div>
                                </div>

                                {/* Communication Method */}
                                <div className="settings-card">
                                    <h3 className="settings-card-title"><i className="fa-solid fa-comment-dots"></i> {t.preferredCommunicationMethod}</h3>
                                    <div className="settings-comm-options">
                                        {['Email', 'Phone', 'SMS', 'InApp'].map(method => (
                                            <label className="comm-option" key={method}>
                                                <input type="radio" name="commMethod" value={method} checked={settings.commMethod === method} onChange={() => setSettings(s => ({ ...s, commMethod: method }))} />
                                                <span className="comm-option-inner">
                                                    <i className={`fa-solid ${method === 'Email' ? 'fa-envelope' : method === 'Phone' ? 'fa-phone' : method === 'SMS' ? 'fa-message' : 'fa-mobile-screen'}`}></i>
                                                    {t.communicationMethods[method as keyof typeof t.communicationMethods]}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Language Preference */}
                                <div className="settings-card">
                                    <h3 className="settings-card-title"><i className="fa-solid fa-globe"></i> {t.languagePreference}</h3>
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

                                        <h3 className="settings-card-title">
                                            <i className="fa-solid fa-location-dot"></i> {t.preferredLocations}
                                        </h3>

                                        <p className="settings-hint">
                                            {t.selectNeighborhoodsHint}
                                        </p>

                                        <div className="preferred-locations-grid">
                                            {[
                                                'Al-Salama',
                                                'Al-Rawdah',
                                                'Al-Nahda',
                                                'Al-Andalus',
                                                'Al-Hamra',
                                                'Al-Rehab',
                                                'Al-Faisaliyah',
                                                'Al-Naeem',
                                                'Al-Basateen',
                                                'Al-Shati',
                                                'Al-Safa',
                                                'Al-Aziziyah',
                                                'Al-Baghdadiyah',
                                                'Al-Balad'
                                            ].map(loc => (
                                                <label className="location-checkbox" key={loc}>
                                                    <input
                                                        type="checkbox"
                                                        checked={settings.prefLocs.includes(loc)}
                                                        onChange={(e) => {
                                                            const checked = e.target.checked;

                                                            setSettings(s => ({
                                                                ...s,
                                                                prefLocs: checked
                                                                    ? [...s.prefLocs, loc]
                                                                    : s.prefLocs.filter(l => l !== loc)
                                                            }));
                                                        }}
                                                    />

                                                    {t.locations[loc as keyof typeof t.locations]}
                                                </label>
                                            ))}
                                        </div>

                                    </div>
                                )}

                                <div className="profile-actions">
                                    <button type="submit" className="primary-btn" disabled={settingsSaving}>
                                        {settingsSaving ? t.saving : t.saveSettings}                                    </button>
                                    {settingsSavedMsg && (
                                        <span className="save-msg" style={{ marginLeft: '1rem', color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                            <i className="fa-solid fa-check-circle"></i> {t.settingsSaved}
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
                            <h3>{t.reviewYourExperience}</h3>
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
                                <label className="review-label">{t.rating}</label>
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
                                <label className="review-label">{t.yourReview}</label>
                                <textarea
                                    className="review-textarea"
                                    rows={4}
                                    placeholder={t.shareExperiencePlaceholder}
                                    maxLength={500}
                                    value={reviewComment}
                                    onChange={e => setReviewComment(e.target.value)}
                                />
                                <p className="review-char-count">{reviewComment.length}/500 {t.characters}</p>
                            </div>
                            {reviewError && <p className="review-error" style={{ display: 'block' }}>{reviewError}</p>}
                        </div>
                        <div className="review-modal-footer">
                            <button className="btn btn-outline" onClick={() => setReviewModal(null)}>{t.cancel}</button>
                            <button className="btn btn-primary" onClick={handleSubmitReview}>{t.submitReview}</button>
                        </div>
                    </div>
                </div>
            )}
            {showFavorites && (
                <div className="review-modal-overlay" style={{ zIndex: 3000 }}>
                    <div className="review-modal" style={{ maxWidth: '720px', width: '92%' }}>
                        <div className="review-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3>My Favorite Spaces</h3>
                            <button
                                onClick={() => setShowFavorites(false)}
                                style={{ border: 'none', background: 'transparent', fontSize: '24px', cursor: 'pointer' }}
                            >
                                &times;
                            </button>
                        </div>

                        <div className="review-modal-body">
                            {favoritesLoading && <Loader />}

                            {!favoritesLoading && favorites.length === 0 && (
                                <p style={{ color: '#718096' }}>No favorite spaces yet.</p>
                            )}

                            {!favoritesLoading && favorites.map(space => (
                                <div
                                    key={space.SpaceID}
                                    style={{
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '12px',
                                        padding: '12px',
                                        marginBottom: '10px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        gap: '12px',
                                    }}
                                >
                                    <div>
                                        <h4 style={{ margin: '0 0 4px 0', color: '#1a365d' }}>{space.Title}</h4>
                                        <p style={{ margin: 0, color: '#718096', fontSize: '13px' }}>
                                            {space.City} {space.AddressLine1 ? `, ${space.AddressLine1}` : ''}
                                        </p>
                                        <p style={{ margin: '6px 0 0 0', color: '#ff6b35', fontSize: '13px', fontWeight: 700 }}>
                                            <i className="fa-solid fa-heart"></i> {Number(space.FavoriteCount || 0)}
                                        </p>
                                    </div>

                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <button
                                            className="btn btn-outline btn-small"
                                            onClick={() => removeFavorite(space.SpaceID)}
                                        >
                                            Remove
                                        </button>

                                        <button
                                        className="btn btn-dark btn-small"
                                        onClick={() => {
                                            sessionStorage.setItem('openSpaceId', String(space.SpaceID));
                                            window.location.href = '/search';
                                        }}
                                        >
                                        View Details
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
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
