'use client';
import { useState, FormEvent } from 'react';

export default function RegisterPage() {
    const [userType, setUserType] = useState<'seeker' | 'provider'>('seeker');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

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
            setError('Passwords do not match');
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
                setError(response.error || 'Registration failed');
                return;
            }

            localStorage.setItem('siaaToken', response.token);
            localStorage.setItem('siaaUser', JSON.stringify(response.user));
            localStorage.setItem('siaaIsFirstLogin', 'true');

            window.location.href = '/dashboard';
        } catch {
            setError('Network error. Please try again.');
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
                                    <input type="checkbox" name="terms" required />
                                    <span>I agree to Si&apos;aa&apos;s Terms &amp; Privacy Policy</span>
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
        </>
    );
}
