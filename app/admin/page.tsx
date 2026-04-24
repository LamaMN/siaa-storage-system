'use client';
import { useEffect, useState, useCallback } from 'react';
import Loader from '@/components/Loader';
import LanguageToggle from '@/app/components/LanguageToggle';
import { translations, type Language } from '@/lib/translations';
interface SpaceItem {
    SpaceID: number;
    Title: string;
    SpaceType?: string;
    Size?: number;
    PricePerMonth?: number;
    Status: string;
    City?: string;
    AddressLine1?: string;
    ProviderFirstName?: string;
    ProviderLastName?: string;
    ProviderEmail?: string;
    BusinessName?: string;
    CreatedAt?: string;
    FirstImageID?: number;
}

interface AdminStats {
    totalSeekers: number;
    totalProviders: number;
    totalSpaces: number;
    pendingSpaces: number;
    activeSpaces: number;
    totalBookings: number;
    totalRevenue: number;
}

function formatDate(d?: string) {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
function formatPrice(n?: number) {
    if (!n) return '0.00';
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function getCurrentLang(): Language {
    if (typeof document === 'undefined') return 'en';

    const match = document.cookie.match(/(?:^|; )lang=([^;]+)/);
    return match?.[1] === 'ar' ? 'ar' : 'en';
}
export default function AdminPage() {
    const [token, setToken] = useState('');
    const [activeSection, setActiveSection] = useState('spacesSection');
    const [pendingSpaces, setPendingSpaces] = useState<SpaceItem[]>([]);
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [lang, setLang] = useState<Language>('en');
    const t = translations[lang];
    useEffect(() => {
        const currentLang = getCurrentLang();
        setLang(currentLang);
        document.documentElement.lang = currentLang;
        document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
        const storedUser = localStorage.getItem('siaaUser');
        const storedToken = localStorage.getItem('siaaToken');

        if (!storedUser || !storedToken) {
            window.location.href = '/login';
            return;
        }

        try {
            const user = JSON.parse(storedUser);
            if (user.userType !== 'admin') {
                window.location.href = '/dashboard';
                return;
            }
            setToken(storedToken);
            loadData(storedToken);
        } catch {
            window.location.href = '/login';
        }
    }, []);

    const authHeaders = useCallback((t: string) => ({
        'Authorization': `Bearer ${t}`,
        'Content-Type': 'application/json',
    }), []);

    async function loadData(t: string) {
        setLoading(true);
        try {
            const [spacesRes, statsRes] = await Promise.all([
                fetch('/api/admin/spaces', { headers: authHeaders(t) }),
                fetch('/api/admin/stats', { headers: authHeaders(t) }),
            ]);

            if (spacesRes.ok) {
                const data = await spacesRes.json();
                setPendingSpaces(data.spaces || []);
            }
            if (statsRes.ok) {
                const data = await statsRes.json();
                setStats(data.statistics || null);
            }
        } finally {
            setLoading(false);
        }
    }

    async function handleSpaceAction(spaceId: number, status: 'Active' | 'Rejected') {
        const res = await fetch(`/api/admin/spaces/${spaceId}/status`, {
            method: 'PATCH',
            headers: authHeaders(token),
            body: JSON.stringify({ status }),
        });
        if (res.ok) {
            setPendingSpaces(prev => prev.filter(s => s.SpaceID !== spaceId));
            // Update stats
            if (stats) {
                setStats({
                    ...stats,
                    pendingSpaces: stats.pendingSpaces - 1,
                    activeSpaces: status === 'Active' ? stats.activeSpaces + 1 : stats.activeSpaces,
                });
            }
        } else {
            const d = await res.json();
            alert(d.error || t.failedUpdateSpaceStatus);
        }
    }

    function logout() {
        localStorage.removeItem('siaaUser');
        localStorage.removeItem('siaaToken');
        window.location.href = '/login';
    }

    if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader /></div>;

    return (
        <>
            <header className="header">
                <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '6px 20px' }}>
                    <LanguageToggle />
                </div>
                <div className="container">
                    <div className="header-content">

                        {/* Navigation */}
                        <nav className="nav">
                            <a href="/dashboard">{t.dashboard}</a>
                            <a href="/#about">{t.about}</a>
                            <a href="/#features">{t.features}</a>
                            <a href="/#how-it-works">{t.howItWorks}</a>
                        </nav>

                        {/* Logo */}
                        <div className="logo">
                            <img
                                src="/Media/Logo.png"
                                alt={t.logoAlt}
                                className="logo-img"
                            />
                        </div>


                    </div>
                </div>
            </header>

            <div className="dashboard">
                {/* Sidebar */}
                <aside className="sideBar">

                    <a
                        href="#"
                        className={`sideBar-link ${activeSection === 'spacesSection' ? 'is-active' : ''}`}
                        onClick={e => {
                            e.preventDefault();
                            setActiveSection('spacesSection');
                        }}
                    >
                        <i className="fa-solid fa-clipboard-check"></i>
                        {t.pendingSpaces}
                    </a>

                    <a
                        href="#"
                        className={`sideBar-link ${activeSection === 'statsSection' ? 'is-active' : ''}`}
                        onClick={e => {
                            e.preventDefault();
                            setActiveSection('statsSection');
                        }}
                    >
                        <i className="fa-solid fa-chart-line"></i>
                        {t.statistics}
                    </a>

                    <a
                        href="#"
                        className="sideBar-link logout-link"
                        onClick={e => {
                            e.preventDefault();
                            logout();
                        }}
                    >
                        <i className="fa-solid fa-right-from-bracket"></i>
                        {t.logout}
                    </a>

                </aside>

                {/* Main content */}
                <main className="dashboard-main">
                    <div className="container">

                        <div className="dashboard-header">
                            <div className="dashboard-title-box">
                                <h1 className="dashboard-title">
                                    {t.adminDashboard}
                                </h1>

                                <p className="dashboard-subtitle">
                                    {t.platformAdministration}
                                </p>
                            </div>
                        </div>

                        {/* Pending Spaces Section */}
                        <section
                            id="spacesSection"
                            className={`dashboard-section ${activeSection === 'spacesSection' ? 'is-active' : ''}`}
                        >
                            <h2 className="section-title">
                                {t.pendingSpaceApprovals}
                            </h2>

                            {pendingSpaces.length === 0 ? (

                                <p className="history-empty">
                                    {t.noPendingSpaces}
                                </p>

                            ) : (

                                <ul className="history-list">

                                    {pendingSpaces.map(space => (

                                        <li key={space.SpaceID} className="history-item">

                                            <div className="history-item-header">

                                                <h3 className="history-item-title">
                                                    {space.Title}
                                                </h3>

                                                <span className="history-item-badge status-pending">
                                                    {t.pending}
                                                </span>

                                            </div>

                                            <div className="history-item-details">

                                                <p>
                                                    <i className="fa-solid fa-user"></i>
                                                    {t.provider}:
                                                    {space.ProviderFirstName}
                                                    {space.ProviderLastName}
                                                    {space.BusinessName
                                                        ? ` (${space.BusinessName})`
                                                        : ''}
                                                </p>

                                                <p>
                                                    <i className="fa-solid fa-envelope"></i>
                                                    {space.ProviderEmail}
                                                </p>

                                                <p>
                                                    <i className="fa-solid fa-location-dot"></i>
                                                    {space.City}, {space.AddressLine1}
                                                </p>

                                                <p>
                                                    <i className="fa-solid fa-box"></i>
                                                    {space.SpaceType} · {space.Size} m²
                                                </p>

                                            </div>

                                            <div className="history-item-footer">

                                                <div>

                                                    <span className="history-item-price">
                                                        {formatPrice(space.PricePerMonth)}
                                                        {' '}
                                                        {t.sarPerMonth}
                                                    </span>

                                                    <br />

                                                    <span className="history-item-date">
                                                        {t.submitted}:
                                                        {' '}
                                                        {formatDate(space.CreatedAt)}
                                                    </span>

                                                </div>

                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        gap: '0.5rem'
                                                    }}
                                                >

                                                    <button
                                                        className="btn btn-dark btn-small"
                                                        onClick={() =>
                                                            handleSpaceAction(
                                                                space.SpaceID,
                                                                'Active'
                                                            )
                                                        }
                                                        style={{
                                                            background:
                                                                'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                                                            boxShadow:
                                                                '0 4px 12px rgba(16,185,129,0.25)'
                                                        }}
                                                    >
                                                        <i className="fa-solid fa-check"></i>
                                                        {' '}
                                                        {t.approve}
                                                    </button>

                                                    <button
                                                        className="btn btn-outline btn-small"
                                                        onClick={() =>
                                                            handleSpaceAction(
                                                                space.SpaceID,
                                                                'Rejected'
                                                            )
                                                        }
                                                        style={{
                                                            borderColor: '#ef4444',
                                                            color: '#ef4444'
                                                        }}
                                                    >
                                                        <i className="fa-solid fa-times"></i>
                                                        {' '}
                                                        {t.reject}
                                                    </button>

                                                </div>

                                            </div>

                                        </li>

                                    ))}

                                </ul>

                            )}

                        </section>
                        {/* Statistics Section */}
                        <section
                            id="statsSection"
                            className={`dashboard-section ${activeSection === 'statsSection' ? 'is-active' : ''}`}
                        >

                            <h2 className="section-title">
                                {t.platformStatistics}
                            </h2>

                            <div className="stats-grid">

                                {/* Registered Users */}
                                <div className="stat-card">
                                    <div
                                        className="stat-icon"
                                        style={{
                                            background:
                                                'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
                                            boxShadow:
                                                '0 4px 12px rgba(59,130,246,0.25)'
                                        }}
                                    >
                                        <i className="fa-solid fa-users"></i>
                                    </div>

                                    <div className="stat-content">
                                        <h3 className="stat-value">
                                            {(stats?.totalSeekers || 0) +
                                                (stats?.totalProviders || 0)}
                                        </h3>

                                        <p className="stat-label">
                                            {t.registeredUsers}
                                        </p>
                                    </div>
                                </div>

                                {/* Total Spaces */}
                                <div className="stat-card">
                                    <div className="stat-icon">
                                        <i className="fa-solid fa-box"></i>
                                    </div>

                                    <div className="stat-content">
                                        <h3 className="stat-value">
                                            {stats?.totalSpaces || 0}
                                        </h3>

                                        <p className="stat-label">
                                            {t.totalSpaces}
                                        </p>
                                    </div>
                                </div>

                                {/* Total Bookings */}
                                <div className="stat-card">
                                    <div
                                        className="stat-icon"
                                        style={{
                                            background:
                                                'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                                            boxShadow:
                                                '0 4px 12px rgba(16,185,129,0.25)'
                                        }}
                                    >
                                        <i className="fa-solid fa-calendar-check"></i>
                                    </div>

                                    <div className="stat-content">
                                        <h3 className="stat-value">
                                            {stats?.totalBookings || 0}
                                        </h3>

                                        <p className="stat-label">
                                            {t.totalBookings}
                                        </p>
                                    </div>
                                </div>

                                {/* Total Revenue */}
                                <div className="stat-card">
                                    <div
                                        className="stat-icon"
                                        style={{
                                            background:
                                                'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
                                            boxShadow:
                                                '0 4px 12px rgba(139,92,246,0.25)'
                                        }}
                                    >
                                        <i className="fa-solid fa-chart-line"></i>
                                    </div>

                                    <div className="stat-content">
                                        <h3 className="stat-value">
                                            {formatPrice(stats?.totalRevenue)}
                                            {' '}
                                            {t.sar}
                                        </h3>

                                        <p className="stat-label">
                                            {t.totalRevenue}
                                        </p>
                                    </div>
                                </div>

                            </div>

                        </section>

                        {/* Detailed breakdown */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginTop: '2rem' }}>
                            <div style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1a365d', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
                                    <i className="fa-solid fa-users" style={{ color: '#3b82f6', marginRight: '8px' }}></i>
                                    {t.userBreakdown}
                                </h3>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f7fafc', borderRadius: '10px' }}>
                                        <span style={{ color: '#4a5568', fontSize: '14px', fontWeight: 500 }}>
                                            {t.storageSeekers}
                                        </span>
                                        <span style={{ color: '#1a365d', fontSize: '18px', fontWeight: 700 }}>
                                            {stats?.totalSeekers || 0}
                                        </span>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f7fafc', borderRadius: '10px' }}>
                                        <span style={{ color: '#4a5568', fontSize: '14px', fontWeight: 500 }}>
                                            {t.storageProviders}
                                        </span>
                                        <span style={{ color: '#1a365d', fontSize: '18px', fontWeight: 700 }}>
                                            {stats?.totalProviders || 0}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1a365d', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
                                    <i className="fa-solid fa-box" style={{ color: '#ff6b35', marginRight: '8px' }}></i>
                                    {t.spaceBreakdown}
                                </h3>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f7fafc', borderRadius: '10px' }}>
                                        <span style={{ color: '#4a5568', fontSize: '14px', fontWeight: 500 }}>
                                            {t.activeSpaces}
                                        </span>
                                        <span style={{ color: '#10b981', fontSize: '18px', fontWeight: 700 }}>
                                            {stats?.activeSpaces || 0}
                                        </span>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#fff3cd', borderRadius: '10px' }}>
                                        <span style={{ color: '#856404', fontSize: '14px', fontWeight: 500 }}>
                                            {t.pendingApproval}
                                        </span>
                                        <span style={{ color: '#856404', fontSize: '18px', fontWeight: 700 }}>
                                            {stats?.pendingSpaces || 0}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>


                    </div>
                </main >
            </div >

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
