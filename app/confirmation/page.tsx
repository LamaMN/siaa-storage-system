'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
const lang = usePageLanguage();
const t = translations[lang];

function ConfirmationPageContent() {


    const searchParams = useSearchParams();
    const router = useRouter();
    const bookingId = searchParams.get('bookingId');

    const [booking, setBooking] = useState<any>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!bookingId) {
            router.push('/dashboard');
            return;
        }

        async function fetchBooking() {
            try {
                const token = localStorage.getItem('siaaToken');
                const res = await fetch(`/api/bookings/${bookingId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!res.ok) throw new Error(t.couldNotLoadBooking);

                const data = await res.json();
                setBooking(data.booking || data);
            } catch (err: any) {
                setError(
                    `${t.couldNotLoadDetails} #${bookingId}`
                );
            } finally {
                setLoading(false);
            }
        }

        fetchBooking();
    }, [bookingId, router]);

    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-SA', { day: 'numeric', month: 'short', year: 'numeric' });
    };
    return (
        <main className="bg-light" style={{ flex: 1, minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div className="container" style={{ flex: 1 }}>
                <div style={{
                    background: '#fff', borderRadius: '24px', maxWidth: '600px', margin: '60px auto',
                    padding: '40px', boxShadow: '0 20px 60px rgba(15, 23, 42, 0.1)', textAlign: 'center'
                }}>
                    <div style={{
                        width: '80px', height: '80px', background: '#f0fdf4', color: '#22c55e',
                        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '40px', margin: '0 auto 24px'
                    }}>
                        <i className="fa-solid fa-check"></i>
                    </div>

                    <h1 style={{ fontSize: '28px', color: '#1a365d', marginBottom: '8px', fontWeight: 800 }}>
                        {t.bookingConfirmed}
                    </h1>

                    <p style={{ color: '#718096', marginBottom: '32px' }}>
                        {t.confirmationThankYou}
                    </p>

                    <div style={{ textAlign: 'left', background: '#f8fafc', borderRadius: '16px', padding: '24px', marginBottom: '32px' }}>
                        {loading ? (
                            <div style={{ padding: '20px', display: 'flex', justifyContent: 'center' }}>
                                <Loader />
                            </div>
                        ) : error ? (
                            <p style={{ color: '#ef4444', textAlign: 'center' }}>{error}</p>
                        ) : booking ? (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '15px' }}>
                                    <span style={{ color: '#64748b' }}>{t.bookingId}</span>
                                    <span style={{ color: '#1e293b', fontWeight: 600 }}>#{booking.BookingID}</span>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '15px' }}>
                                    <span style={{ color: '#64748b' }}>{t.storageSpace}</span>
                                    <span style={{ color: '#1e293b', fontWeight: 600 }}>
                                        {booking.SpaceTitle || booking.Title || t.storageSpace}
                                    </span>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '15px' }}>
                                    <span style={{ color: '#64748b' }}>{t.duration}</span>
                                    <span style={{ color: '#1e293b', fontWeight: 600 }}>
                                        {formatDate(booking.StartDate)} - {formatDate(booking.EndDate)}
                                    </span>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '15px' }}>
                                    <span style={{ color: '#64748b' }}>{t.totalAmount}</span>
                                    <span style={{ color: '#1e293b', fontWeight: 600 }}>
                                        {Number(booking.TotalAmount || 0).toLocaleString()} {t.sar}
                                    </span>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e2e8f0', fontSize: '15px' }}>
                                    <span style={{ color: '#64748b' }}>{t.status}</span>
                                    <span style={{ color: '#22c55e', fontWeight: 600 }}>{t.confirmed}</span>
                                </div>
                            </>
                        ) : null}
                    </div>

                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                        <a href="/dashboard" className="btn btn-dark">
                            {t.goToDashboard}
                        </a>

                        <a href="/search" className="btn btn-outline">
                            {t.findMoreSpaces}
                        </a>
                    </div>
                </div>
            </div>
        </main>
    );
}

export default function ConfirmationPage() {

    return (
        <>
            <header className="header">
                

                <div className="container">
                    <div className="header-content">
                        <div className="logo">
                            <img src="/Media/Logo.png" alt={t.logoAlt} className="logo-img" />
                        </div>
                        <a
                            href="/register"
                            className="btn btn-primary btn-header"
                            style={{ width: 'auto', flexShrink: 0, whiteSpace: 'nowrap' }}
                        >
                            {t.getStarted}
                        </a>

                        <nav className="nav">
                            <a href="/dashboard">{t.dashboard}</a>
                            <a href="#about">{t.about}</a>
                            <a href="#features">{t.features}</a>
                            <a href="#how-it-works">{t.howItWorks}</a>
                        </nav>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '6px 20px' }}>
                            <LanguageToggle />
                        </div>
                    </div>
                </div>
            </header>

            <Suspense fallback={<div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}><Loader /></div>}>
                <ConfirmationPageContent />
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
