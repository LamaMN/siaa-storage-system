'use client';
import { useState, FormEvent, Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Loader from '@/components/Loader';
import LanguageToggle from '@/app/components/LanguageToggle';
import { translations, type Language } from '@/lib/translations';

function getCurrentLang(): Language {
    if (typeof document === 'undefined') return 'en';

    const match = document.cookie.match(/(?:^|; )lang=([^;]+)/);
    return match?.[1] === 'ar' ? 'ar' : 'en';
}

function ResetForm() {
    const lang = getCurrentLang();
    const t = translations[lang];

    const searchParams = useSearchParams();
    const token = searchParams.get('token') || '';
    const userType = searchParams.get('type') || 'seeker';

    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError('');

        if (password.length < 8) {
            setError(t.passwordAtLeast8);
            return;
        }
        if (password !== confirm) {
            setError(t.passwordsDoNotMatchShort);
            return;
        }
        if (!token) {
            setError(t.invalidResetToken);
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, userType, newPassword: password }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || t.resetFailedExpired);
            } else {
                setSuccess(true);
            }
        } catch {
            setError(t.networkErrorTryAgain);
        } finally {
            setLoading(false);
        }
    }

    if (!token) {
        return (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
                <p style={{ color: '#c62828' }}>
                    ⚠️ {t.invalidResetLink}
                </p>
                <a href="/forgot-password" className="btn btn-dark" style={{ marginTop: '1rem', display: 'inline-block' }}>
                    {t.requestNewLink}
                </a>
            </div>
        );
    }

    if (success) {
        return (
            <div style={{
                background: '#d1fae5',
                color: '#065f46',
                padding: '1.5rem',
                borderRadius: '10px',
                textAlign: 'center',
            }}>
                <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</p>
                <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{t.passwordUpdated}</p>
                <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
                    {t.passwordChangedSuccessfully}
                </p>
                <a href="/login" className="btn btn-dark" style={{ display: 'inline-block' }}>
                    {t.signInNow}
                </a>
            </div>
        );
    }

    return (
        <form className="auth-form-login" onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
            {error && (
                <div className="alert alert-error">
                    <i className="fa-solid fa-circle-exclamation"></i>
                    {error}
                </div>
            )}
            <div className="form-group">
                <label className="form-label" htmlFor="newPassword">{t.newPassword}</label>
                <input
                    id="newPassword"
                    type="password"
                    className="form-input"
                    placeholder={t.atLeast8Characters}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={8}
                />
            </div>
            <div className="form-group">
                <label className="form-label" htmlFor="confirmPassword">{t.confirmPassword}</label>
                <input
                    id="confirmPassword"
                    type="password"
                    className="form-input"
                    placeholder={t.reEnterNewPassword}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required
                />
            </div>
            <button
                type="submit"
                className="btn btn-dark btn-large auth-submit"
                disabled={loading}
            >
                {loading ? t.updating : t.setNewPassword}
            </button>
        </form>
    );
}

export default function ResetPasswordPage() {
    const [lang, setLang] = useState<Language>(() => getCurrentLang());
    const t = translations[lang];

    useEffect(() => {
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    }, [lang]);

    return (
        <>
            <header className="header">
                

                <div className="container">
                    <div className="header-content">
                        <div className="logo">
                            <img src="/Media/Logo.png" alt={t.logoAlt} className="logo-img" />
                        </div>
                        <nav className="nav">
                            <a href="/login">{t.signIn}</a>
                            <a href="/register">{t.register}</a>
                        </nav>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '6px 20px' }}>
                            <LanguageToggle />
                        </div>
                    </div>
                </div>
            </header>

            <section className="auth-section">
                <div className="auth-visual">
                    <div className="auth-visual-content">
                        <h1 className="auth-visual-title">{t.setNewPasswordTitle}</h1>
                        <p className="auth-visual-text">
                            {t.setNewPasswordText}
                        </p>
                        <ul className="auth-visual-bullets">
                            <li>{t.passwordRuleLength}</li>
                            <li>{t.passwordRuleMix}</li>
                            <li>{t.passwordRuleNoReuse}</li>
                        </ul>
                    </div>
                </div>

                <div className="auth-wrapper">
                    <div className="auth-card">
                        <h2 className="auth-title">{t.createNewPassword}</h2>
                        <p className="auth-subtitle">{t.enterConfirmNewPassword}</p>
                        <Suspense fallback={<Loader />}>
                            <ResetForm />
                        </Suspense>
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