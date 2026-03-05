// =============================================
// Si'aa – Payment Page
// =============================================

const API_BASE_URL = 'http://localhost:3000/api';
let currentBooking = null;

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const bookingId = params.get('bookingId');

    if (!bookingId) {
        showError('No booking found. Please try again.');
        return;
    }

    loadBookingDetails(bookingId);
    setupPaymentForm(bookingId);
});

async function loadBookingDetails(bookingId) {
    try {
        const token = localStorage.getItem('siaaToken');
        const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Could not load booking details');

        const data = await res.json();
        currentBooking = data.booking || data;
        populateSummary(currentBooking);
    } catch (err) {
        console.error('Error loading booking:', err);
        showError('Could not load booking details. Please try again.');
    }
}

function populateSummary(b) {
    // Total
    const totalEl = document.querySelector('.payment-summary-total-value');
    if (totalEl) totalEl.textContent = ` ${formatPrice(b.TotalAmount)}`;

    // Breakdown
    const summaryItems = document.querySelector('.payment-summary-items');
    if (summaryItems) {
        const tax = b.TotalAmount * 0.15; // 15% VAT example
        const base = b.TotalAmount - tax;

        summaryItems.innerHTML = `
            <div class="payment-summary-item">
                <span class="payment-summary-item-label">Storage (incl. fees)</span>
                <span class="payment-summary-item-value">${formatPrice(base)} SAR</span>
            </div>
            <div class="payment-summary-item">
                <span class="payment-summary-item-label">VAT (15%)</span>
                <span class="payment-summary-item-value">${formatPrice(tax)} SAR</span>
            </div>
        `;
    }

    // Storage ID / Title
    const storageIdEl = document.querySelector('.payment-summary-item-value'); // First one
    // We already cleared and re-rendered, so let's just make it clear
}

function setupPaymentForm(bookingId) {
    const form = document.querySelector('.payment-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const btn = form.querySelector('.complete-payment-btn');
        btn.textContent = 'Processing...';
        btn.disabled = true;

        // Mock payment processing
        setTimeout(() => {
            // Redirect to confirmation page
            window.location.href = `confirmation.html?bookingId=${bookingId}`;
        }, 1500);
    });
}

function formatPrice(value) {
    if (!value || isNaN(Number(value))) return '0.00';
    return Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function showError(message) {
    const container = document.querySelector('.payment-container');
    if (container) {
        container.innerHTML = `
            <div style="padding:40px; text-align:center; background:#fff; border-radius:20px; box-shadow:0 8px 30px rgba(0,0,0,0.05); width:100%;">
                <i class="fa-solid fa-circle-exclamation" style="font-size:48px; color:#ff6b35;"></i>
                <h2 style="margin-top:20px; color:#1a365d;">Oops!</h2>
                <p style="color:#718096; margin-top:10px;">${message}</p>
                <a href="search.html" class="btn btn-primary" style="margin-top:20px; display:inline-block; text-decoration:none;">Back to Home</a>
            </div>
        `;
    }
}
