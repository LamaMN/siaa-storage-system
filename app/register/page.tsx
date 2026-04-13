'use client';
import { useState, FormEvent } from 'react';

function friendlyError(raw: string): string {
    const r = raw.toLowerCase();
    if (r.includes('email already exists') || r.includes('duplicate') && r.includes('email'))
        return 'An account with this email address already exists. Try logging in instead.';
    if (r.includes('national') && (r.includes('already') || r.includes('duplicate') || r.includes('unique')))
        return 'This National ID is already registered to another account.';
    if (r.includes('18') || r.includes('age') || r.includes('years old'))
        return 'You must be at least 18 years old to register on Si\'aa.';
    if (r.includes('password must be at least'))
        return 'Your password must be at least 8 characters long.';
    if (r.includes('valid email'))
        return 'Please enter a valid email address (e.g. name@example.com).';
    if (r.includes('national id must be 10'))
        return 'National ID must be exactly 10 digits and start with 1 or 2.';
    if (r.includes('phone') || r.includes('phoneNumber'))
        return 'Please enter a valid Saudi phone number (at least 9 digits).';
    if (r.includes('passwords do not match'))
        return 'The passwords you entered don\'t match. Please try again.';
    if (r.includes('network'))
        return 'Connection failed. Please check your internet and try again.';
    return raw;
}

export default function RegisterPage() {
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
                data[input.name] = input.value;
            }
        }

        if (data.password !== data.confirmPassword) {
            setError(friendlyError('Passwords do not match'));
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
                setError(friendlyError(response.error || 'Registration failed'));
                return;
            }

            localStorage.setItem('siaaToken', response.token);
            localStorage.setItem('siaaUser', JSON.stringify(response.user));
            localStorage.setItem('siaaIsFirstLogin', 'true');

            window.location.href = '/dashboard';
        } catch {
            setError(friendlyError('Network error. Please try again.'));
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
                <div className="container">
                    <div className="header-content">
                        <nav className="nav">
                            <a href="/#about">About</a>
                            <a href="/#features">Features</a>
                            <a href="/#how-it-works">How It Works</a>
                        </nav>
                        <div className="logo">
                            <img src="/Media/Logo.png" alt="Si'aa Logo" className="logo-img" />
                        </div>
                    </div>
                </div>
            </header>

            <section className="auth-section">
                <div className="auth-visual">
                    <div className="auth-visual-content">
                        <h1 className="auth-visual-title">Store smarter.<br />Earn from your space.</h1>
                        <p className="auth-visual-text">
                            Book nearby storage in minutes or list your extra space and start earning with a trusted community.
                        </p>
                        <ul className="auth-visual-bullets">
                            <li>Flexible daily, weekly, and monthly plans</li>
                            <li>Verified users &amp; secure bookings</li>
                            <li>Smart matching based on your needs</li>
                        </ul>
                    </div>
                </div>

                <div className="auth-wrapper">
                    <div className="auth-card">
                        {/* Type toggle */}
                        <div className="auth-toggle-group">
                            <button
                                type="button"
                                className={`auth-toggle-btn ${userType === 'seeker' ? 'active' : ''}`}
                                onClick={() => setUserType('seeker')}
                            >
                                Find Storage
                            </button>
                            <button
                                type="button"
                                className={`auth-toggle-btn ${userType === 'provider' ? 'active' : ''}`}
                                onClick={() => setUserType('provider')}
                            >
                                List My Space
                            </button>
                        </div>

                        <h2 className="auth-title">Create an account</h2>
                        <p className="auth-subtitle">Fill in your details to get started with Si&apos;aa.</p>

                        {error && (
                            <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                                <i className="fa-solid fa-circle-exclamation"></i>
                                {error}
                            </div>
                        )}

                        <form className="auth-form" onSubmit={handleSubmit} noValidate>
                            <div className="form-group">
                                <label htmlFor="firstName" className="form-label">First Name</label>
                                <input type="text" id="firstName" name="firstName" className="form-input" placeholder="First name" required />
                            </div>

                            <div className="form-group">
                                <label htmlFor="lastName" className="form-label">Last Name</label>
                                <input type="text" id="lastName" name="lastName" className="form-input" placeholder="Last name" required />
                            </div>

                            <div className="form-group">
                                <label htmlFor="email" className="form-label">Email</label>
                                <input type="email" id="email" name="email" className="form-input" placeholder="name@example.com" required />
                            </div>

                            <div className="form-group">
                                <label htmlFor="phoneNumber" className="form-label">Phone Number</label>
                                <input type="tel" id="phoneNumber" name="phoneNumber" className="form-input" placeholder="5X XXX XXXX" required />
                            </div>

                            <div className="form-group">
                                <label htmlFor="dateOfBirth" className="form-label">Date of Birth</label>
                                <input type="date" id="dateOfBirth" name="dateOfBirth" className="form-input" required />
                            </div>

                            <div className="form-group">
                                <label htmlFor="nationalId" className="form-label">National ID</label>
                                <input type="text" id="nationalId" name="nationalId" className="form-input" placeholder="e.g. 1023456789" />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Gender</label>
                                <div className="form-group-inline">
                                    <label className="form-radio"><input type="radio" name="gender" value="Male" defaultChecked /> Male</label>
                                    <label className="form-radio"><input type="radio" name="gender" value="Female" /> Female</label>
                                </div>
                            </div>

                            {userType === 'provider' && (
                                <div className="form-group">
                                    <label htmlFor="businessName" className="form-label">Business Name (optional)</label>
                                    <input type="text" id="businessName" name="businessName" className="form-input" placeholder="Your business name" />
                                </div>
                            )}

                            {userType === 'seeker' && (
                                <div className="form-group">
                                    <label htmlFor="companyName" className="form-label">Company (optional)</label>
                                    <input type="text" id="companyName" name="companyName" className="form-input" placeholder="Company name" />
                                </div>
                            )}

                            {/* Password with eye toggle */}
                            <div className="form-group">
                                <label htmlFor="password" className="form-label">Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="password"
                                        name="password"
                                        className="form-input"
                                        placeholder="Create a strong password"
                                        required
                                        style={{ paddingRight: '40px', width: '100%', boxSizing: 'border-box' }}
                                    />
                                    <button type="button" style={eyeStyle} onClick={() => setShowPassword(v => !v)} aria-label="Toggle password visibility">
                                        <i className={`fa-regular ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                    </button>
                                </div>
                            </div>

                            {/* Confirm password with eye toggle */}
                            <div className="form-group">
                                <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showConfirm ? 'text' : 'password'}
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        className="form-input"
                                        placeholder="Re-enter your password"
                                        required
                                        style={{ paddingRight: '40px', width: '100%', boxSizing: 'border-box' }}
                                    />
                                    <button type="button" style={eyeStyle} onClick={() => setShowConfirm(v => !v)} aria-label="Toggle confirm password visibility">
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
                                        I agree to{' '}
                                        <a
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setShowTermsModal(true);
                                            }}
                                            style={{ color: '#ff6b35', textDecoration: 'underline', cursor: 'pointer' }}
                                        >
                                            Si&apos;aa&apos;s Terms &amp; Privacy Policy
                                        </a>
                                    </span>
                                </label>
                            </div>

                            <button type="submit" className="btn btn-dark btn-large auth-submit" disabled={loading}>
                                {loading ? 'Creating account...' : 'Sign up'}
                            </button>

                            <p className="auth-switch">
                                Already have an account? <a href="/login">Log in</a>
                            </p>
                        </form>
                    </div>
                </div>
            </section>

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

            {/* Terms & Privacy Modal */}
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
                        {/* Modal Header */}
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '20px 24px', borderBottom: '1px solid #e2e8f0',
                            background: '#fff'
                        }}>
                            <h2 style={{ margin: 0, fontSize: '20px', color: '#1a365d', fontWeight: 700 }}>
                                Terms &amp; Privacy Policy
                            </h2>
                            <button onClick={() => setShowTermsModal(false)} style={{
                                background: '#f3f4f6', border: 'none', color: '#6b7280',
                                width: '32px', height: '32px', borderRadius: '50%', fontSize: '18px',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                lineHeight: 1,
                            }} aria-label="Close">&times;</button>
                        </div>

                        {/* Modal Body */}
                        <div style={{ overflowY: 'auto', padding: '28px', lineHeight: 1.7, color: '#2d3748', fontSize: '15px' }}>
                            <h3 style={{ color: '#1a365d', marginTop: 0 }}>1. Acceptance of Terms</h3>
                            <p>By registering for and using Si&apos;aa, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, please do not use the platform.</p>

                            <h3 style={{ color: '#1a365d' }}>2. Use of the Platform</h3>
                            <p>Si&apos;aa connects storage space seekers with storage space providers in Jeddah and beyond. You agree to use the platform only for its intended purpose and in compliance with all applicable laws and regulations in the Kingdom of Saudi Arabia.</p>

                            <h3 style={{ color: '#1a365d' }}>3. Account Responsibilities</h3>
                            <p>You are responsible for maintaining the confidentiality of your account credentials. You must notify us immediately of any unauthorized use of your account. Si&apos;aa is not liable for any loss resulting from your failure to protect your credentials.</p>

                            <h3 style={{ color: '#1a365d' }}>4. Bookings &amp; Payments</h3>
                            <p>All bookings made through Si&apos;aa are binding agreements between the seeker and the provider. Payments are processed securely. Cancellation and refund policies vary per listing and will be shown clearly before booking confirmation.</p>

                            <h3 style={{ color: '#1a365d' }}>5. Provider Obligations</h3>
                            <p>Storage providers agree to accurately describe their spaces, maintain availability as listed, and provide safe and accessible storage as agreed. Misrepresentation of a space may result in account suspension.</p>

                            <h3 style={{ color: '#1a365d' }}>6. Privacy Policy</h3>
                            <p>We collect personal information including your name, email, phone number, and location to operate the Si&apos;aa platform. Your data is stored securely and will not be sold to third parties. We use your information to facilitate bookings, send notifications (based on your preferences), and improve our service.</p>
                            <p>By registering, you consent to receiving transactional emails, SMS, and in-app notifications related to your account and bookings. You may adjust these preferences at any time in your Dashboard → Settings.</p>

                            <h3 style={{ color: '#1a365d' }}>7. Prohibited Activities</h3>
                            <p>You may not use Si&apos;aa to store illegal or hazardous materials, conduct fraudulent bookings, or harm other users. Violations will result in immediate account suspension and potential legal action.</p>

                            <h3 style={{ color: '#1a365d' }}>8. Limitation of Liability</h3>
                            <p>Si&apos;aa acts as an intermediary and is not liable for loss or damage to stored items beyond what is explicitly covered in individual listing agreements. We strongly recommend obtaining appropriate insurance.</p>

                            <h3 style={{ color: '#1a365d' }}>9. Modifications</h3>
                            <p>We reserve the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the updated terms.</p>

                            <h3 style={{ color: '#1a365d' }}>10. Contact</h3>
                            <p>For questions about these terms, contact us at <a href="mailto:support@siaa.sa" style={{ color: '#ff6b35' }}>support@siaa.sa</a>.</p>

                            <p style={{ marginTop: '24px', fontSize: '13px', color: '#718096' }}>Last updated: February 2026</p>
                        </div>

                        {/* Modal Footer */}
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
                                Accept
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
