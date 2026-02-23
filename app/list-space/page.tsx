'use client';
import { useEffect, useState, FormEvent } from 'react';

interface User {
    id: number;
    userType: string;
    firstName: string;
}

export default function ListSpacePage() {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState('');
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('siaaUser');
        const storedToken = localStorage.getItem('siaaToken');
        if (!storedUser || !storedToken) {
            window.location.href = '/login';
            return;
        }
        const u = JSON.parse(storedUser);
        if (u.userType !== 'provider') {
            alert('Only providers can list spaces');
            window.location.href = '/dashboard';
            return;
        }
        setUser(u);
        setToken(storedToken);
    }, []);

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        const form = e.currentTarget;
        const data: Record<string, unknown> = {};

        for (const el of Array.from(form.elements)) {
            const input = el as HTMLInputElement;
            if (!input.name || !input.value) continue;
            if (['size', 'pricePerMonth', 'pricePerWeek', 'pricePerDay', 'height', 'width', 'length', 'floorNumber', 'minRentalPeriod', 'latitude', 'longitude'].includes(input.name)) {
                const n = parseFloat(input.value);
                if (!isNaN(n)) data[input.name] = n;
            } else if (['climateControlled', 'securitySystem', 'cctvMonitored', 'parkingAvailable', 'loadingAssistance'].includes(input.name)) {
                data[input.name] = input.checked;
            } else {
                data[input.name] = input.value;
            }
        }

        try {
            const res = await fetch('/api/spaces', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(data),
            });

            const response = await res.json();

            if (!res.ok) {
                setError(response.error || 'Failed to list space');
                return;
            }

            setSuccess(`Space listed successfully! Space ID: ${response.spaceId}. It will be reviewed within 24 hours.`);
            form.reset();
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    if (!user) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;

    return (
        <>
            <header className="header">
                <div className="container">
                    <div className="header-content">
                        <nav className="nav">
                            <a href="/dashboard">Dashboard</a>
                            <a href="/#about">About</a>
                        </nav>
                        <div className="logo">
                            <img src="/Media/Logo.png" alt="Si'aa Logo" className="logo-img" />
                        </div>
                    </div>
                </div>
            </header>

            <section className="auth-section" style={{ minHeight: '100vh', alignItems: 'flex-start', padding: '3rem 0' }}>
                <div className="container">
                    <h1 style={{ marginBottom: '2rem', fontFamily: 'var(--arabic-font)' }}>List Your Storage Space</h1>
                    <p style={{ marginBottom: '2rem', color: '#666' }}>
                        Fill in the details below. Your listing will be reviewed within 24 hours.
                    </p>

                    {success && (
                        <div style={{ background: '#d1fae5', color: '#065f46', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                            ✓ {success}
                        </div>
                    )}
                    {error && (
                        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                            ✗ {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', maxWidth: '900px' }}>

                        <fieldset style={{ gridColumn: '1 / -1', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1.5rem' }}>
                            <legend style={{ fontWeight: 600, padding: '0 0.5rem' }}>Basic Information</legend>
                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                <label className="form-label">Space Title *</label>
                                <input type="text" name="title" className="form-input" placeholder="e.g. Private Room at Al-Rawdah" required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea name="description" className="form-input" rows={3} placeholder="Describe your storage space, access hours, any restrictions..." style={{ resize: 'vertical' }} />
                            </div>
                        </fieldset>

                        <div className="form-group">
                            <label className="form-label">Space Type</label>
                            <select name="spaceType" className="form-input">
                                <option value="room">Indoor Room</option>
                                <option value="garage">Garage</option>
                                <option value="warehouse">Warehouse Corner</option>
                                <option value="outdoor">Outdoor Covered Area</option>
                                <option value="Basement">Basement</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Size (m²) *</label>
                            <input type="number" name="size" className="form-input" placeholder="e.g. 15" min="1" step="0.5" required />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Price Per Month (SAR) *</label>
                            <input type="number" name="pricePerMonth" className="form-input" placeholder="e.g. 500" min="1" required />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Price Per Week (SAR)</label>
                            <input type="number" name="pricePerWeek" className="form-input" placeholder="Leave blank if monthly only" min="1" />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Price Per Day (SAR)</label>
                            <input type="number" name="pricePerDay" className="form-input" placeholder="Leave blank if monthly only" min="1" />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Min. Rental Period (days)</label>
                            <input type="number" name="minRentalPeriod" className="form-input" defaultValue={1} min="1" />
                        </div>

                        <fieldset style={{ gridColumn: '1 / -1', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1.5rem' }}>
                            <legend style={{ fontWeight: 600, padding: '0 0.5rem' }}>Location</legend>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label className="form-label">Address Line 1 *</label>
                                    <input type="text" name="addressLine1" className="form-input" placeholder="Street name and number" required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Address Line 2</label>
                                    <input type="text" name="addressLine2" className="form-input" placeholder="Building, unit, or neighborhood" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">City *</label>
                                    <select name="city" className="form-input" required>
                                        {['Jeddah', 'Riyadh', 'Dammam', 'Mecca', 'Medina', 'Khobar', 'Abha', 'Tabuk', 'Taif', 'Hail'].map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Landmark</label>
                                    <input type="text" name="landmark" className="form-input" placeholder="e.g. Near Al-Andalus Mall" />
                                </div>
                            </div>
                        </fieldset>

                        <fieldset style={{ gridColumn: '1 / -1', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1.5rem' }}>
                            <legend style={{ fontWeight: 600, padding: '0 0.5rem' }}>Features</legend>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                                {[
                                    { name: 'climateControlled', label: '🌡️ Climate Controlled' },
                                    { name: 'securitySystem', label: '🔒 Security System' },
                                    { name: 'cctvMonitored', label: '📷 CCTV Monitored' },
                                    { name: 'parkingAvailable', label: '🚗 Parking Available' },
                                    { name: 'loadingAssistance', label: '🏋️ Loading Assistance' },
                                ].map(f => (
                                    <label key={f.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                        <input type="checkbox" name={f.name} />
                                        <span>{f.label}</span>
                                    </label>
                                ))}
                            </div>
                            <div className="form-group" style={{ marginTop: '1rem' }}>
                                <label className="form-label">Access Type</label>
                                <select name="accessType" className="form-input">
                                    <option value="24/7">24/7 Access</option>
                                    <option value="BusinessHours">Business Hours</option>
                                    <option value="ByAppointment">By Appointment</option>
                                </select>
                            </div>
                            <div className="form-group" style={{ marginTop: '1rem' }}>
                                <label className="form-label">Restrictions (optional)</label>
                                <textarea name="restrictions" className="form-input" rows={2} placeholder="e.g. No hazardous materials, no food items..." style={{ resize: 'vertical' }} />
                            </div>
                        </fieldset>

                        <div style={{ gridColumn: '1 / -1' }}>
                            <button type="submit" className="btn btn-dark btn-large" style={{ width: '100%' }} disabled={loading}>
                                {loading ? 'Submitting...' : 'Submit Space for Review'}
                            </button>
                        </div>

                    </form>
                </div>
            </section>

            <footer className="footer">
                <div className="container">
                    <div className="footer-content">
                        <div className="social-icons">
                            <a href="#" aria-label="Facebook"><i className="fa-brands fa-facebook"></i></a>
                            <a href="#" aria-label="LinkedIn"><i className="fa-brands fa-linkedin-in"></i></a>
                            <a href="#" aria-label="Twitter"><i className="fa-brands fa-x-twitter"></i></a>
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
