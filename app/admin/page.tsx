'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import Loader from '@/components/Loader';
import LanguageToggle from '@/app/components/LanguageToggle';
import { translations, type Language } from '@/lib/translations';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

function getTopIssues(tickets: SupportTicket[]): string[] {
    const stopWords = new Set(['the', 'and', 'is', 'to', 'for', 'a', 'in', 'of', 'i', 'was', 'my', 'it', 'on', 'with', 'at', 'this', 'that', 'from', 'في', 'من', 'عن', 'على', 'و', 'ان', 'أن', 'الى', 'إلى']);
    const wordCounts: Record<string, number> = {};
    tickets.forEach(t => {
        const words = (t.Description + " " + t.Subject).toLowerCase().match(/\p{L}+/gu) || [];
        words.forEach(w => {
            if (w.length > 2 && !stopWords.has(w)) {
                wordCounts[w] = (wordCounts[w] || 0) + 1;
            }
        });
    });
    return Object.entries(wordCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(x => x[0]);
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
    revenueOverTime?: { date: string; value: number }[];
    ticketsOverTime?: { date: string; value: number }[];
}

interface SupportTicket {
    TicketID: number;
    ProviderFirstName?: string;
    ProviderLastName?: string;
    SeekerFirstName?: string;
    SeekerLastName?: string;
    Category: string;
    Subject: string;
    Description: string;
    Status: string;
    Priority: string;
    CreatedAt: string;
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
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
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
            const [spacesRes, statsRes, ticketsRes] = await Promise.all([
                fetch('/api/admin/spaces', { headers: authHeaders(t) }),
                fetch('/api/admin/stats', { headers: authHeaders(t) }),
                fetch('/api/admin/tickets', { headers: authHeaders(t) }),
            ]);

            if (spacesRes.ok) {
                const data = await spacesRes.json();
                setPendingSpaces(data.spaces || []);
            }
            if (statsRes.ok) {
                const data = await statsRes.json();
                setStats(data.statistics || null);
            }
            if (ticketsRes.ok) {
                const data = await ticketsRes.json();
                setTickets(data.tickets || []);
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
                <div className="container">
                    <div className="header-content">
                        <div className="logo">
                            <img src="/Media/Logo.png" alt={t.logoAlt} className="logo-img" />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '6px 20px' }}>
                            <LanguageToggle />
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
                        className={`sideBar-link ${activeSection === 'disputesSection' ? 'is-active' : ''}`}
                        onClick={e => {
                            e.preventDefault();
                            setActiveSection('disputesSection');
                        }}
                    >
                        <i className="fa-solid fa-scale-balanced"></i>
                        Disputes
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
                                                            background: '#1a365d',
                                                            color: '#fff',
                                                            boxShadow: '0 4px 12px rgba(26,54,93,0.25)'
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
                                            background: '#3b82f6',
                                            boxShadow: '0 4px 12px rgba(59,130,246,0.25)'
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
                                    <div className="stat-icon" style={{ background: '#ff6b35', boxShadow: '0 4px 12px rgba(255,107,53,0.25)', color: '#fff' }}>
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
                                            background: '#3b82f6',
                                            boxShadow: '0 4px 12px rgba(59,130,246,0.25)'
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
                                            background: '#ff6b35',
                                            boxShadow: '0 4px 12px rgba(255,107,53,0.25)'
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

                        {/* Detailed breakdown charts */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginTop: '2rem' }}>
                            <div style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1a365d', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
                                    <i className="fa-solid fa-users" style={{ color: '#3b82f6', marginRight: '8px' }}></i>
                                    {t.userBreakdown}
                                </h3>
                                <div style={{ flex: 1, minHeight: '200px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={[
                                                    { name: t.storageSeekers, value: stats?.totalSeekers || 0 },
                                                    { name: t.storageProviders, value: stats?.totalProviders || 0 }
                                                ]}
                                                cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={5} dataKey="value"
                                            >
                                                <Cell fill="#1a365d" />
                                                <Cell fill="#3b82f6" />
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '12px', color: '#4a5568' }}>
                                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#1a365d' }}></div>
                                        {t.storageSeekers} ({stats?.totalSeekers || 0})
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '12px', color: '#4a5568' }}>
                                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#3b82f6' }}></div>
                                        {t.storageProviders} ({stats?.totalProviders || 0})
                                    </div>
                                </div>
                            </div>

                            <div style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1a365d', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
                                    <i className="fa-solid fa-box" style={{ color: '#ff6b35', marginRight: '8px' }}></i>
                                    {t.spaceBreakdown}
                                </h3>
                                <div style={{ flex: 1, minHeight: '200px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={[
                                                    { name: t.activeSpaces, value: stats?.activeSpaces || 0 },
                                                    { name: t.pendingApproval, value: stats?.pendingSpaces || 0 }
                                                ]}
                                                cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={5} dataKey="value"
                                            >
                                                <Cell fill="#ff6b35" />
                                                <Cell fill="#fbbf24" />
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '12px', color: '#4a5568' }}>
                                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff6b35' }}></div>
                                        {t.activeSpaces} ({stats?.activeSpaces || 0})
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '12px', color: '#4a5568' }}>
                                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#fbbf24' }}></div>
                                        {t.pendingApproval} ({stats?.pendingSpaces || 0})
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Line Charts */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginTop: '2rem' }}>
                            <div style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1a365d', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
                                    <i className="fa-solid fa-chart-line" style={{ color: '#ff6b35', marginRight: '8px' }}></i>
                                    {t.revenueOverTime || 'Revenue Over Time'}
                                </h3>
                                <div style={{ height: '250px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={stats?.revenueOverTime || []}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="date" tick={{fontSize: 12, fill: '#718096'}} axisLine={false} tickLine={false} />
                                            <YAxis tick={{fontSize: 12, fill: '#718096'}} axisLine={false} tickLine={false} width={40} />
                                            <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                                            <Line type="monotone" dataKey="value" stroke="#ff6b35" strokeWidth={3} dot={{r: 4, fill: '#ff6b35', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div style={{ background: '#fff', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1a365d', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
                                    <i className="fa-solid fa-ticket" style={{ color: '#3b82f6', marginRight: '8px' }}></i>
                                    {t.ticketsOverTime || 'Tickets Over Time'}
                                </h3>
                                <div style={{ height: '250px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={stats?.ticketsOverTime || []}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="date" tick={{fontSize: 12, fill: '#718096'}} axisLine={false} tickLine={false} />
                                            <YAxis tick={{fontSize: 12, fill: '#718096'}} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
                                            <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                                            <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                        </section>

                        {/* Disputes Section */}
                        <section
                            id="disputesSection"
                            className={`dashboard-section ${activeSection === 'disputesSection' ? 'is-active' : ''}`}
                        >
                            <h2 className="section-title">
                                {t.disputes || 'Support Tickets'}
                            </h2>

                            {tickets.length > 0 && getTopIssues(tickets).length > 0 && (
                                <div style={{ background: 'transparent', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <i className="fa-solid fa-tag" style={{ color: '#94a3b8', fontSize: '14px' }}></i>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {getTopIssues(tickets).map(word => (
                                            <span key={word} style={{ color: '#475569', fontSize: '12px', fontWeight: 500 }}>
                                                #{word}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {tickets.length === 0 ? (
                                <p className="history-empty">
                                    No support tickets currently.
                                </p>
                            ) : (
                                <ul className="history-list">
                                    {tickets.map(ticket => (
                                        <li key={ticket.TicketID} className="history-item">
                                            <div className="history-item-header">
                                                <h3 className="history-item-title">
                                                    {ticket.Subject}
                                                </h3>
                                                <span className={`history-item-badge ${ticket.Status === 'Open' ? 'status-pending' : ticket.Status === 'Resolved' ? 'status-completed' : 'status-in-progress'}`} style={ticket.Status === 'Resolved' ? {background: '#e6ffed', color: '#10b981', borderColor: '#10b981'} : ticket.Status === 'In Progress' ? {background: '#fff3cd', color: '#856404', borderColor: '#856404'} : {}}>
                                                    {ticket.Status}
                                                </span>
                                            </div>
                                            <div className="history-item-details">
                                                <p style={{ fontWeight: '500', color: '#1a365d' }}>
                                                    <i className="fa-solid fa-tag"></i> Category: {ticket.Category}
                                                </p>
                                                <p style={{ color: '#4a5568', marginTop: '0.5rem', marginBottom: '0.5rem', background: '#f7fafc', padding: '1rem', borderRadius: '8px', fontStyle: 'italic' }}>
                                                    "{ticket.Description}"
                                                </p>
                                                <p>
                                                    <i className="fa-solid fa-user"></i> Submitted By: {ticket.ProviderFirstName ? `${ticket.ProviderFirstName} ${ticket.ProviderLastName} (Provider)` : `${ticket.SeekerFirstName} ${ticket.SeekerLastName} (Seeker)`}
                                                </p>
                                                <p>
                                                    <i className="fa-solid fa-triangle-exclamation"></i> Priority: {ticket.Priority}
                                                </p>
                                            </div>
                                            <div className="history-item-footer">
                                                <span className="history-item-date">
                                                    Submitted: {formatDate(ticket.CreatedAt)}
                                                </span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>


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
