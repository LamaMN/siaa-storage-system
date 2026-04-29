'use client';
import { useState, FormEvent, useEffect } from 'react';
import LanguageToggle from '@/app/components/LanguageToggle';
import { translations, type Language } from '@/lib/translations';

function getCurrentLang(): Language {
    if (typeof document === 'undefined') return 'en';
    const match = document.cookie.match(/(?:^|; )lang=([^;]+)/);
    return match?.[1] === 'ar' ? 'ar' : 'en';
}

export default function LoginPage() {

    const [lang, setLang] = useState<Language>(() => getCurrentLang());
    const t = translations[lang];

    useEffect(() => {
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    }, [lang]);

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError('');
        setLoading(true);

        const form = e.currentTarget;
        const email = (form.elements.namedItem('email') as HTMLInputElement).value;
        const password = (form.elements.namedItem('password') as HTMLInputElement).value;

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || t.loginFailed);
                return;
            }

            localStorage.setItem('siaaToken', data.token);
            localStorage.setItem('siaaUser', JSON.stringify(data.user));
            localStorage.setItem('siaaIsFirstLogin', data.isFirstLogin ? 'true' : 'false');

            if (data.user.userType === 'admin') {
                window.location.href = '/admin';
            } else {
                window.location.href = '/dashboard';
            }

        } catch {
            setError(t.networkError);
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <header className="header">

                

                <div className="container">
                    <div className="header-content">
                        <div className="logo">
                            <img src="/Media/Logo.png" alt={t.logoAlt} className="logo-img" />
                        </div>
                        <nav className="nav">
                            <a href="/#about">{t.about}</a>
                            <a href="/#features">{t.features}</a>
                            <a href="/#how-it-works">{t.howItWorks}</a>
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

                        <h1 className="auth-visual-title">
                            {t.welcomeBack}
                        </h1>

                        <p className="auth-visual-text">
                            {t.loginDescription}
                        </p>

                        <ul className="auth-visual-bullets">
                            <li>{t.manageStorage}</li>
                            <li>{t.editListings}</li>
                            <li>{t.secureAccess}</li>
                        </ul>

                    </div>
                </div>

                <div className="auth-wrapper">
                    <div className="auth-card">

                        <h2 className="auth-title">
                            {t.signIn}
                        </h2>

                        <p className="auth-subtitle">
                            {t.enterDetails}
                        </p>

                        {error && (
                            <div className="alert alert-error" style={{ marginBottom: '1rem', color: 'red' }}>
                                {error}
                            </div>
                        )}

                        <form className="auth-form-login" onSubmit={handleSubmit}>

                            <div className="form-group">
                                <label htmlFor="loginEmail" className="form-label">
                                    {t.email}
                                </label>

                                <input
                                    type="email"
                                    id="loginEmail"
                                    name="email"
                                    className="form-input"
                                    placeholder={t.emailPlaceholder}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="loginPassword" className="form-label">
                                    {t.password}
                                </label>

                                <div style={{ position: 'relative' }}>

                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="loginPassword"
                                        name="password"
                                        className="form-input"
                                        placeholder={t.passwordPlaceholder}
                                        required
                                        style={{ paddingRight: '40px', width: '100%', boxSizing: 'border-box' }}
                                    />

                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(v => !v)}
                                        aria-label={t.togglePasswordVisibility}
                                        style={{
                                            position: 'absolute',
                                            right: '12px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: '#a0aec0',
                                            padding: 0,
                                            fontSize: '14px'
                                        }}
                                    >
                                        <i className={`fa-regular ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                    </button>

                                </div>
                            </div>

                            <div className="form-meta">
                                <a href="/forgot-password" className="form-link">
                                    {t.forgotPassword}
                                </a>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-dark btn-large auth-submit"
                                disabled={loading}
                            >
                                {loading ? t.signingIn : t.logIn}
                            </button>

                            <p className="auth-switch">
                                {t.noAccount}{' '}
                                <a href="/register">
                                    {t.createAccount}
                                </a>
                            </p>

                        </form>
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
