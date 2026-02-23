'use client';
import { useState, FormEvent } from 'react';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [userType, setUserType] = useState('seeker');
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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
                setError(data.error || 'Request failed');
            } else {
                setSent(true);
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <header className="header">
                <div className="container">
                    <div className="header-content">
                        <nav className="nav">
                            <a href="/login">Sign In</a>
                            <a href="/register">Register</a>
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
                        <h1 className="auth-visual-title">Forgot your password?</h1>
                        <p className="auth-visual-text">
                            No worries — enter your email address and we'll send you a reset link to get back into your account.
                        </p>
                        <ul className="auth-visual-bullets">
                            <li>Check your spam folder if you don't see the email</li>
                            <li>The reset link expires after 1 hour</li>
                            <li>Contact support if you need further help</li>
                        </ul>
                    </div>
                </div>

                <div className="auth-wrapper">
                    <div className="auth-card">
                        <h2 className="auth-title">Reset your password</h2>
                        <p className="auth-subtitle">
                            {sent
                                ? 'Check your email for a reset link.'
                                : "Enter your registered email and we'll send you a reset link."}
                        </p>

                        {sent ? (
                            <div style={{
                                background: '#d1fae5',
                                color: '#065f46',
                                padding: '1.25rem',
                                borderRadius: '10px',
                                marginTop: '1.5rem',
                                textAlign: 'center',
                            }}>
                                <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📧</p>
                                <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Email sent!</p>
                                <p style={{ fontSize: '0.9rem' }}>
                                    We sent a reset link to <strong>{email}</strong>. It expires in 1 hour.
                                </p>
                                <a href="/login" className="btn btn-dark" style={{ marginTop: '1rem', display: 'inline-block' }}>
                                    Back to Login
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
                                    <label className="form-label" htmlFor="resetEmail">Email address</label>
                                    <input
                                        id="resetEmail"
                                        type="email"
                                        className="form-input"
                                        placeholder="name@example.com"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label" htmlFor="resetUserType">Account Type</label>
                                    <select
                                        id="resetUserType"
                                        className="form-input"
                                        value={userType}
                                        onChange={e => setUserType(e.target.value)}
                                    >
                                        <option value="seeker">Storage Seeker</option>
                                        <option value="provider">Storage Provider</option>
                                    </select>
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-dark btn-large auth-submit"
                                    disabled={loading}
                                >
                                    {loading ? 'Sending...' : 'Send Reset Link'}
                                </button>

                                <p className="auth-switch" style={{ textAlign: 'center', marginTop: '1rem' }}>
                                    Remember your password? <a href="/login">Sign in</a>
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
