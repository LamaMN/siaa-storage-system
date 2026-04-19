'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Loader from '@/components/Loader';

function PaymentPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const bookingId = searchParams.get('bookingId');
    
    const [booking, setBooking] = useState<any>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [expiryDate, setExpiryDate] = useState('');
    const [cardError, setCardError] = useState('');

    useEffect(() => {
        if (!bookingId) {
            setError('No booking found. Please try again.');
            setLoading(false);
            return;
        }

        async function fetchBooking() {
            try {
                const token = localStorage.getItem('siaaToken');
                const res = await fetch(`/api/bookings/${bookingId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!res.ok) throw new Error('Could not load booking details');

                const data = await res.json();
                setBooking(data.booking || data);
            } catch (err: any) {
                setError('Could not load booking details. Please try again.');
            } finally {
                setLoading(false);
            }
        }

        fetchBooking();
    }, [bookingId]);

    const formatPrice = (value: any) => {
        if (!value || isNaN(Number(value))) return '0.00';
        return Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/\D/g, ''); // remove non-digits
        if (val.length >= 2) {
            val = val.substring(0, 2) + '/' + val.substring(2, 4);
        }
        setExpiryDate(val);
        setCardError('');

        if (val.length === 5) {
            const month = parseInt(val.substring(0, 2), 10);
            const yearStr = val.substring(3, 5);
            
            if (month < 1 || month > 12) {
                setCardError('Invalid month (01-12).');
                return;
            }
            
            const now = new Date();
            const currentYear = now.getFullYear() % 100;
            const currentMonth = now.getMonth() + 1;
            const year = parseInt(yearStr, 10);

            if (year < currentYear || (year === currentYear && month < currentMonth)) {
                setCardError('This card has expired.');
            }
        }
    };

    const handlePaymentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (cardError || expiryDate.length !== 5) {
            if (!cardError) setCardError('Please complete the expiry date.');
            return;
        }

        setProcessing(true);

        // Mock payment processing
        setTimeout(() => {
            router.push(`/confirmation?bookingId=${bookingId}`);
        }, 1500);
    };

    if (error && !booking) {
        return (
            <div className="payment-container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ padding: '40px', textAlign: 'center', background: '#fff', borderRadius: '20px', boxShadow: '0 8px 30px rgba(0,0,0,0.05)', width: '100%', maxWidth: '500px' }}>
                    <i className="fa-solid fa-circle-exclamation" style={{ fontSize: '48px', color: '#ff6b35' }}></i>
                    <h2 style={{ marginTop: '20px', color: '#1a365d' }}>Oops!</h2>
                    <p style={{ color: '#718096', marginTop: '10px' }}>{error}</p>
                    <button onClick={() => router.push('/search')} className="btn btn-primary" style={{ marginTop: '20px' }}>Back to Home</button>
                </div>
            </div>
        );
    }

    const totalAmount = booking?.TotalAmount || 0;
    const tax = totalAmount * 0.15;
    const base = totalAmount - tax;

    return (
        <section className="payment-section">
            <div className="payment-container">
                {/* Left Column: Form */}
                <div className="payment-form-section">
                    <h1 className="payment-title">Select Payment Method</h1>

                    <form className="payment-form" onSubmit={handlePaymentSubmit}>
                        <div className="payment-methods" style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                            <label className="payment-method-card active-method" style={{ flex: 1, padding: '16px', border: '2px solid #ff6b35', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', background: '#fff9f5' }}>
                                <input type="radio" name="payment_method" value="card" defaultChecked style={{ accentColor: '#ff6b35' }} />
                                <div className="method-icon"><i className="fa-regular fa-credit-card" style={{ color: '#ff6b35', fontSize: '20px' }}></i></div>
                                <span className="method-name" style={{ fontWeight: 'bold', color: '#1a365d' }}>Credit Card</span>
                            </label>
                            {/* Apple Pay removed per user request */}
                        </div>

                        <div className="payment-form-group">
                            <label className="payment-form-label">Cardholder Name</label>
                            <input type="text" className="payment-input" placeholder="Lama Abdullah" required />
                        </div>

                        <div className="payment-form-group">
                            <label className="payment-form-label">Card Number</label>
                            <div style={{ position: 'relative' }}>
                                <input type="text" className="payment-input" placeholder="0000 0000 0000 0000" pattern="[0-9 ]+" minLength={16} maxLength={19} required style={{ width: '100%' }} />
                                <i className="fa-brands fa-cc-visa" style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '24px', color: '#1a365d' }}></i>
                            </div>
                        </div>

                        <div className="payment-row-two">
                            <div className="payment-form-group">
                                <label className="payment-form-label">Expiry Date</label>
                                <input 
                                    type="text" 
                                    className={`payment-input ${cardError ? 'error' : ''}`}
                                    placeholder="MM/YY" 
                                    value={expiryDate}
                                    onChange={handleExpiryChange}
                                    required 
                                />
                                {cardError && <span style={{ color: '#e63946', fontSize: '13px', marginTop: '2px', fontWeight: 500 }}>{cardError}</span>}
                            </div>
                            <div className="payment-form-group">
                                <label className="payment-form-label">CVV</label>
                                <input 
                                    type="text" 
                                    className="payment-input" 
                                    placeholder="123" 
                                    pattern="\d{3}" 
                                    maxLength={3} 
                                    onChange={(e) => { e.target.value = e.target.value.replace(/\D/g, ''); }}
                                    title="Please enter exactly 3 digits"
                                    required 
                                />
                            </div>
                        </div>

                        <button type="submit" className="complete-payment-btn" disabled={processing || loading}>
                            {processing ? 'Processing...' : 'Complete Payment'}
                        </button>
                        
                        <div className="secure-badge" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#718096', fontSize: '13px', marginTop: '16px' }}>
                            <i className="fa-solid fa-lock"></i>
                            <span>Payments are secure and encrypted by 256-bit SSL</span>
                        </div>
                    </form>
                </div>

                {/* Right Column: Order Summary */}
                <div className="payment-summary-card">
                <h2 className="payment-summary-title">Payment Summary</h2>

                <div className="payment-summary-items" id="summary-items-container">
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '30px' }}>
                            <Loader />
                        </div>
                    ) : (
                        <>
                            <div className="payment-summary-item">
                                <span className="payment-summary-item-label">Storage (incl. fees)</span>
                                <span className="payment-summary-item-value">{formatPrice(base)} SAR</span>
                            </div>
                            <div className="payment-summary-item">
                                <span className="payment-summary-item-label">VAT (15%)</span>
                                <span className="payment-summary-item-value">{formatPrice(tax)} SAR</span>
                            </div>
                        </>
                    )}
                </div>

                <hr className="payment-summary-divider" />

                <div className="payment-summary-total">
                    <span className="payment-summary-total-label">Total</span>
                    <div className="payment-summary-total-wrapper">
                        {loading ? (
                            <span className="payment-summary-total-value">
                                <Loader />
                            </span>
                        ) : (
                            <>
                                <div className="receipt-icon" id="total-receipt-icon"><img src="/Media/Saudi_Riyal_Symbol.png" alt="Saudi Riyal Symbol" /></div>
                                <span className="payment-summary-total-value"> {formatPrice(totalAmount)}</span>
                            </>
                        )}
                    </div>
                </div>
            </div>
            </div>
        </section>
    );
}

export default function PaymentPage() {
    return (
        <>
            <header className="header">
                <div className="container">
                    <div className="header-content">
                        <nav className="nav">
                            <a href="/dashboard">Dashboard</a>
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

            <Suspense fallback={<div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}><Loader /></div>}>
                <PaymentPageContent />
            </Suspense>

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
