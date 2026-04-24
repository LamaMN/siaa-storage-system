'use client';

import { useEffect, useState, FormEvent } from 'react';
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

export default function ForgotPasswordPage() {
    const lang = usePageLanguage();
    const t = translations[lang];

    const [email, setEmail] = useState('');
    const [userType, setUserType] = useState('seeker');
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    }, [lang]);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, userType }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || t.requestFailed);
            } else {
                setSent(true);
            }
        } catch {
            setError(t.networkErrorTryAgain);
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <header className="header">
                <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '6px 20px' }}>
                    <LanguageToggle />
                </div>

                <div className="container">
                    <div className="header-content">
                        <nav className="nav">
                            <a href="/login">{t.signIn}</a>
                            <a href="/register">{t.register}</a>
                        </nav>

                        <div className="logo">
                            <img src="/Media/Logo.png" alt={t.logoAlt} className="logo-img" />
                        </div>
                    </div>
                </div>
            </header>

            <section className="auth-section">
                <div className="auth-visual">
                    <div className="auth-visual-content">
                        <h1 className="auth-visual-title">{t.forgotPasswordTitle}</h1>

                        <p className="auth-visual-text">
                            {t.forgotPasswordVisualText}
                        </p>

                        <ul className="auth-visual-bullets">
                            <li>{t.forgotPasswordBulletSpam}</li>
                            <li>{t.forgotPasswordBulletExpiry}</li>
                            <li>{t.forgotPasswordBulletSupport}</li>
                        </ul>
                    </div>
                </div>

                <div className="auth-wrapper">
                    <div className="auth-card">
                        <h2 className="auth-title">{t.resetPasswordTitle}</h2>

                        <p className="auth-subtitle">
                            {sent ? t.checkEmailResetLink : t.enterEmailResetLink}
                        </p>

                        {sent ? (
                            <div
                                style={{
                                    background: '#d1fae5',
                                    color: '#065f46',
                                    padding: '1.25rem',
                                    borderRadius: '10px',
                                    marginTop: '1.5rem',
                                    textAlign: 'center',
                                }}
                            >
                                <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📧</p>

                                <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                                    {t.emailSent}
                                </p>

                                <p style={{ fontSize: '0.9rem' }}>
                                    {t.resetLinkSentTo} <strong>{email}</strong>. {t.resetLinkExpires}
                                </p>

                                <a
                                    href="/login"
                                    className="btn btn-dark"
                                    style={{ marginTop: '1rem', display: 'inline-block' }}
                                >
                                    {t.backToLogin}
                                </a>
                            </div>
                        ) : (
                            <form className="auth-form-login" onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
                                {error && (
                                    <div className="alert alert-error">
                                        <i className="fa-solid fa-circle-exclamation"></i>
                                        {error}
                                    </div>
                                )}

                                <div className="form-group">
                                    <label className="form-label" htmlFor="resetEmail">
                                        {t.emailAddress}
                                    </label>

                                    <input
                                        id="resetEmail"
                                        type="email"
                                        className="form-input"
                                        placeholder={t.emailPlaceholder}
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label" htmlFor="resetUserType">
                                        {t.accountType}
                                    </label>

                                    <select
                                        id="resetUserType"
                                        className="form-input"
                                        value={userType}
                                        onChange={e => setUserType(e.target.value)}
                                    >
                                        <option value="seeker">{t.storageSeeker}</option>
                                        <option value="provider">{t.storageProvider}</option>
                                    </select>
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-dark btn-large auth-submit"
                                    disabled={loading}
                                >
                                    {loading ? t.sending : t.sendResetLink}
                                </button>

                                <p className="auth-switch" style={{ textAlign: 'center', marginTop: '1rem' }}>
                                    {t.rememberPassword} <a href="/login">{t.signIn}</a>
                                </p>
                            </form>
                        )}
                    </div>
                </div>
            </section>

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