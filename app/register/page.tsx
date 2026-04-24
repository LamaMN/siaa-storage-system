'use client';
import { useState, FormEvent, useEffect } from 'react';
import LanguageToggle from '@/app/components/LanguageToggle';
import { translations, type Language } from '@/lib/translations';

function getCurrentLang(): Language {
    if (typeof document === 'undefined') return 'en';

    const match = document.cookie.match(/(?:^|; )lang=([^;]+)/);
    return match?.[1] === 'ar' ? 'ar' : 'en';
}

function friendlyError(raw: string, t: any): string {
    const r = raw.toLowerCase();
    if (r.includes('email already exists') || r.includes('duplicate') && r.includes('email'))
        return t.emailAlreadyExists;
    if (r.includes('national') && (r.includes('already') || r.includes('duplicate') || r.includes('unique')))
        return t.nationalIdAlreadyRegistered;
    if (r.includes('18') || r.includes('age') || r.includes('years old'))
        return t.mustBeAtLeast18;
    if (r.includes('password must be at least'))
        return t.passwordMinLength;
    if (r.includes('valid email'))
        return t.validEmailError;
    if (r.includes('national id must be 10'))
        return t.nationalIdFormatError;
    if (r.includes('phone') || r.includes('phoneNumber'))
        return t.validSaudiPhoneError;
    if (r.includes('passwords do not match'))
        return t.passwordsDoNotMatch;
    if (r.includes('network'))
        return t.connectionFailed;
    return raw;
}

export default function RegisterPage() {
    const [lang, setLang] = useState<Language>(() => getCurrentLang());
    const t = translations[lang];

    useEffect(() => {
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    }, [lang]);

    const [userType, setUserType] = useState<'seeker' | 'provider'>('seeker');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError('');
        setLoading(true);

        const form = e.currentTarget;
        const data: Record<string, string> = {};

        for (const el of Array.from(form.elements)) {
            const input = el as HTMLInputElement;
            if (input.name && input.value && input.type !== 'checkbox') {
                if (input.name === 'phoneNumber') {
                    data[input.name] = `+966${input.value.replace(/^0+/, '')}`;
                } else {
                    data[input.name] = input.value;
                }
            }
        }

        if (data.password !== data.confirmPassword) {
            setError(friendlyError('Passwords do not match', t));
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...data, userType }),
            });

            const response = await res.json();

            if (!res.ok) {
                setError(friendlyError(response.error || 'Registration failed', t));
                return;
            }

            localStorage.setItem('siaaToken', response.token);
            localStorage.setItem('siaaUser', JSON.stringify(response.user));
            localStorage.setItem('siaaIsFirstLogin', 'true');

            window.location.href = '/dashboard';
        } catch {
            setError(friendlyError('Network error. Please try again.', t));
        } finally {
            setLoading(false);
        }
    }

    const eyeStyle: React.CSSProperties = {
        position: 'absolute',
        right: '12px',
        top: '50%',
        transform: 'translateY(-50%)',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: '#a0aec0',
        padding: '0',
        fontSize: '14px',
        lineHeight: 1,
    };

    return (
        <>
            <header className="header">
                <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '6px 20px' }}>
                    <LanguageToggle />
                </div>

                <div className="container">
                    <div className="header-content">
                        <nav className="nav">
                            <a href="/#about">{t.about}</a>
                            <a href="/#features">{t.features}</a>
                            <a href="/#how-it-works">{t.howItWorks}</a>
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
                        <h1 className="auth-visual-title">
                            {t.storeSmarter}<br />{t.earnFromYourSpace}
                        </h1>
                        <p className="auth-visual-text">
                            {t.registerHeroText}
                        </p>
                        <ul className="auth-visual-bullets">
                            <li>{t.flexiblePlans}</li>
                            <li>{t.verifiedSecureBookings}</li>
                            <li>{t.smartMatchingNeeds}</li>
                        </ul>
                    </div>
                </div>

                <div className="auth-wrapper">
                    <div className="auth-card">
                        <div className="auth-toggle-group">
                            <button
                                type="button"
                                className={`auth-toggle-btn ${userType === 'seeker' ? 'active' : ''}`}
                                onClick={() => setUserType('seeker')}
                            >
                                {t.findStorage}
                            </button>
                            <button
                                type="button"
                                className={`auth-toggle-btn ${userType === 'provider' ? 'active' : ''}`}
                                onClick={() => setUserType('provider')}
                            >
                                {t.listMySpace}
                            </button>
                        </div>

                        <h2 className="auth-title">{t.createAccount}</h2>
                        <p className="auth-subtitle">{t.fillDetailsSiaa}</p>

                        {error && (
                            <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                                <i className="fa-solid fa-circle-exclamation"></i>
                                {error}
                            </div>
                        )}

                        <form className="auth-form" onSubmit={handleSubmit} noValidate>
                            <div className="form-group">
                                <label htmlFor="firstName" className="form-label">{t.firstName}</label>
                                <input type="text" id="firstName" name="firstName" className="form-input" placeholder={t.firstNamePlaceholder} required />
                            </div>

                            <div className="form-group">
                                <label htmlFor="lastName" className="form-label">{t.lastName}</label>
                                <input type="text" id="lastName" name="lastName" className="form-input" placeholder={t.lastNamePlaceholder} required />
                            </div>

                            <div className="form-group">
                                <label htmlFor="email" className="form-label">{t.email}</label>
                                <input type="email" id="email" name="email" className="form-input" placeholder={t.emailPlaceholder} required />
                            </div>

                            <div className="form-group">
                                <label htmlFor="phoneNumber" className="form-label">{t.phoneNumber}</label>
                                <div style={{ display: 'flex' }}>
                                    <span style={{ padding: '0.5rem 0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRight: 'none', borderRadius: '12px 0 0 12px', color: '#4a5568', fontWeight: 600, display: 'flex', alignItems: 'center' }}>+966</span>
                                    <input
                                        type="tel"
                                        id="phoneNumber"
                                        name="phoneNumber"
                                        className="form-input"
                                        placeholder={t.phoneNumberPlaceholder}
                                        required
                                        style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                                        onInput={(e) => {
                                            const target = e.target as HTMLInputElement;
                                            if (target.value.startsWith('0')) {
                                                target.value = target.value.replace(/^0+/, '');
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="dateOfBirth" className="form-label">
                                    {t.dateOfBirth}
                                </label>

                                <input
                                    type="date"
                                    id="dateOfBirth"
                                    name="dateOfBirth"
                                    className="form-input"
                                    lang={lang}
                                    dir={lang === 'ar' ? 'rtl' : 'ltr'}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="nationalId" className="form-label">{t.nationalId}</label>
                                <input type="text" id="nationalId" name="nationalId" className="form-input" placeholder={t.nationalIdPlaceholder} />
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t.gender}</label>
                                <div className="form-group-inline">
                                    <label className="form-radio"><input type="radio" name="gender" value="Male" defaultChecked /> {t.male}</label>
                                    <label className="form-radio"><input type="radio" name="gender" value="Female" /> {t.female}</label>
                                </div>
                            </div>

                            {userType === 'provider' && (
                                <div className="form-group">
                                    <label htmlFor="businessName" className="form-label">{t.businessNameOptional}</label>
                                    <input type="text" id="businessName" name="businessName" className="form-input" placeholder={t.businessNamePlaceholder} />
                                </div>
                            )}

                            {userType === 'seeker' && (
                                <div className="form-group">
                                    <label htmlFor="companyName" className="form-label">{t.companyOptional}</label>
                                    <input type="text" id="companyName" name="companyName" className="form-input" placeholder={t.companyNamePlaceholder} />
                                </div>
                            )}

                            <div className="form-group">
                                <label htmlFor="password" className="form-label">{t.password}</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="password"
                                        name="password"
                                        className="form-input"
                                        placeholder={t.createStrongPassword}
                                        required
                                        style={{ paddingRight: '40px', width: '100%', boxSizing: 'border-box' }}
                                    />
                                    <button type="button" style={eyeStyle} onClick={() => setShowPassword(v => !v)} aria-label={t.togglePasswordVisibility}>
                                        <i className={`fa-regular ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                    </button>
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="confirmPassword" className="form-label">{t.confirmPassword}</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showConfirm ? 'text' : 'password'}
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        className="form-input"
                                        placeholder={t.reEnterPassword}
                                        required
                                        style={{ paddingRight: '40px', width: '100%', boxSizing: 'border-box' }}
                                    />
                                    <button type="button" style={eyeStyle} onClick={() => setShowConfirm(v => !v)} aria-label={t.toggleConfirmPasswordVisibility}>
                                        <i className={`fa-regular ${showConfirm ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                    </button>
                                </div>
                            </div>

                            <div className="form-group full-width">
                                <label className="form-checkbox">
                                    <input
                                        type="checkbox"
                                        name="terms"
                                        required
                                        checked={termsAccepted}
                                        onChange={(e) => setTermsAccepted(e.target.checked)}
                                    />
                                    <span>
                                        {t.iAgreeTo}{' '}
                                        <a
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setShowTermsModal(true);
                                            }}
                                            style={{ color: '#ff6b35', textDecoration: 'underline', cursor: 'pointer' }}
                                        >
                                            {t.termsPrivacyPolicy}
                                        </a>
                                    </span>
                                </label>
                            </div>

                            <button type="submit" className="btn btn-dark btn-large auth-submit" disabled={loading}>
                                {loading ? t.creatingAccount : t.signUp}
                            </button>

                            <p className="auth-switch">
                                {t.alreadyHaveAccount} <a href="/login">{t.logIn}</a>
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

            {showTermsModal && (
                <div style={{
                    display: 'flex', position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
                    zIndex: 9999, alignItems: 'center', justifyContent: 'center', padding: '20px'
                }} onClick={() => setShowTermsModal(false)}>
                    <div
                        style={{
                            background: '#fff', borderRadius: '20px', maxWidth: '640px', width: '100%',
                            maxHeight: '85vh', display: 'flex', flexDirection: 'column',
                            boxShadow: '0 24px 64px rgba(0,0,0,0.18)', overflow: 'hidden'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '20px 24px', borderBottom: '1px solid #e2e8f0',
                            background: '#fff'
                        }}>
                            <h2 style={{ margin: 0, fontSize: '20px', color: '#1a365d', fontWeight: 700 }}>
                                {t.termsPrivacyPolicy}
                            </h2>
                            <button onClick={() => setShowTermsModal(false)} style={{
                                background: '#f3f4f6', border: 'none', color: '#6b7280',
                                width: '32px', height: '32px', borderRadius: '50%', fontSize: '18px',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                lineHeight: 1,
                            }} aria-label={t.close}>&times;</button>
                        </div>

                        <div style={{ overflowY: 'auto', padding: '28px', lineHeight: 1.7, color: '#2d3748', fontSize: '15px' }}>
                            <h3 style={{ color: '#1a365d', marginTop: 0 }}>{t.terms1Title}</h3>
                            <p>{t.terms1Text}</p>

                            <h3 style={{ color: '#1a365d' }}>{t.terms2Title}</h3>
                            <p>{t.terms2Text}</p>

                            <h3 style={{ color: '#1a365d' }}>{t.terms3Title}</h3>
                            <p>{t.terms3Text}</p>

                            <h3 style={{ color: '#1a365d' }}>{t.terms4Title}</h3>
                            <p>{t.terms4Text}</p>

                            <h3 style={{ color: '#1a365d' }}>{t.terms5Title}</h3>
                            <p>{t.terms5Text}</p>

                            <h3 style={{ color: '#1a365d' }}>{t.terms6Title}</h3>
                            <p>{t.terms6Text1}</p>
                            <p>{t.terms6Text2}</p>

                            <h3 style={{ color: '#1a365d' }}>{t.terms7Title}</h3>
                            <p>{t.terms7Text}</p>

                            <h3 style={{ color: '#1a365d' }}>{t.terms8Title}</h3>
                            <p>{t.terms8Text}</p>

                            <h3 style={{ color: '#1a365d' }}>{t.terms9Title}</h3>
                            <p>{t.terms9Text}</p>

                            <h3 style={{ color: '#1a365d' }}>{t.terms10Title}</h3>
                            <p>{t.terms10Text} <a href="mailto:support@siaa.sa" style={{ color: '#ff6b35' }}>support@siaa.sa</a>.</p>

                            <p style={{ marginTop: '24px', fontSize: '13px', color: '#718096' }}>{t.lastUpdatedFebruary2026}</p>
                        </div>

                        <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                type="button"
                                onClick={() => {
                                    setTermsAccepted(true);
                                    setShowTermsModal(false);
                                }}
                                style={{
                                    padding: '10px 24px', background: '#ff6b35',
                                    color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px',
                                    fontWeight: 600, cursor: 'pointer',
                                }}>
                                {t.accept}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}