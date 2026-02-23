'use client';
import { useState, FormEvent, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function ResetForm() {
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
            setError('Password must be at least 8 characters.');
            return;
        }
        if (password !== confirm) {
            setError('Passwords do not match.');
            return;
        }
        if (!token) {
            setError('Invalid or missing reset token. Please request a new link.');
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
                setError(data.error || 'Reset failed. Your link may have expired.');
            } else {
                setSuccess(true);
            }
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    if (!token) {
        return (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
                <p style={{ color: '#c62828' }}>
                    ⚠️ Invalid reset link. Please request a new one.
                </p>
                <a href="/forgot-password" className="btn btn-dark" style={{ marginTop: '1rem', display: 'inline-block' }}>
                    Request New Link
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
                <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Password updated!</p>
                <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
                    Your password has been changed successfully.
                </p>
                <a href="/login" className="btn btn-dark" style={{ display: 'inline-block' }}>
                    Sign In Now
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
                <label className="form-label" htmlFor="newPassword">New Password</label>
                <input
                    id="newPassword"
                    type="password"
                    className="form-input"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={8}
                />
            </div>
            <div className="form-group">
                <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
                <input
                    id="confirmPassword"
                    type="password"
                    className="form-input"
                    placeholder="Re-enter your new password"
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
                {loading ? 'Updating...' : 'Set New Password'}
            </button>
        </form>
    );
}

export default function ResetPasswordPage() {
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
                        <h1 className="auth-visual-title">Set a new password</h1>
                        <p className="auth-visual-text">
                            Choose a strong password to secure your Si&apos;aa account.
                        </p>
                        <ul className="auth-visual-bullets">
                            <li>At least 8 characters long</li>
                            <li>Use a mix of letters, numbers, and symbols</li>
                            <li>Don&apos;t reuse a password from another account</li>
                        </ul>
                    </div>
                </div>

                <div className="auth-wrapper">
                    <div className="auth-card">
                        <h2 className="auth-title">Create new password</h2>
                        <p className="auth-subtitle">Enter and confirm your new password below.</p>
                        <Suspense fallback={<p>Loading...</p>}>
                            <ResetForm />
                        </Suspense>
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
