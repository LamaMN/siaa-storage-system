'use client';
import { useState, FormEvent } from 'react';

export default function LoginPage() {
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
        const userType = (form.elements.namedItem('userType') as HTMLSelectElement).value;

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, userType }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Login failed');
                return;
            }

            // Store JWT and user info in localStorage for existing JS compatibility
            localStorage.setItem('siaaToken', data.token);
            localStorage.setItem('siaaUser', JSON.stringify(data.user));
            localStorage.setItem('siaaIsFirstLogin', data.isFirstLogin ? 'true' : 'false');

            window.location.href = '/dashboard';
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
                        <h1 className="auth-visual-title">Welcome back.</h1>
                        <p className="auth-visual-text">
                            Manage your bookings, update your spaces, and keep your storage journey on track.
                        </p>
                        <ul className="auth-visual-bullets">
                            <li>View and manage active storage</li>
                            <li>Edit or pause your listings anytime</li>
                            <li>Secure, fast access to your account</li>
                        </ul>
                    </div>
                </div>

                <div className="auth-wrapper">
                    <div className="auth-card">
                        <h2 className="auth-title">Sign in</h2>
                        <p className="auth-subtitle">Enter your details to continue.</p>

                        {error && (
                            <div className="alert alert-error" style={{ marginBottom: '1rem', color: 'red' }}>
                                {error}
                            </div>
                        )}

                        <form className="auth-form-login" onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="loginEmail" className="form-label">Email</label>
                                <input
                                    type="email" id="loginEmail" name="email"
                                    className="form-input" placeholder="name@example.com" required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="loginPassword" className="form-label">Password</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="loginPassword"
                                        name="password"
                                        className="form-input"
                                        placeholder="Enter your password"
                                        required
                                        style={{ paddingRight: '40px', width: '100%', boxSizing: 'border-box' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(v => !v)}
                                        aria-label="Toggle password visibility"
                                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#a0aec0', padding: 0, fontSize: '14px' }}
                                    >
                                        <i className={`fa-regular ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                    </button>
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="userType" className="form-label">Account Type</label>
                                <select id="userType" name="userType" className="form-input">
                                    <option value="seeker">Storage Seeker</option>
                                    <option value="provider">Storage Provider</option>
                                </select>
                            </div>

                            <div className="form-meta">
                                <a href="/forgot-password" className="form-link">Forgot your password?</a>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-dark btn-large auth-submit"
                                disabled={loading}
                            >
                                {loading ? 'Signing in...' : 'Log in'}
                            </button>

                            <p className="auth-switch">
                                Don&apos;t have an account?{' '}
                                <a href="/register">Create one now</a>
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
