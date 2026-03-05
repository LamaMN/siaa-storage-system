// =============================================
// Si'aa – Confirmation Page
// =============================================

const API_BASE_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const bookingId = params.get('bookingId');

    if (!bookingId) {
        window.location.href = 'dashboard.html';
        return;
    }

    loadBookingDetails(bookingId);
});

async function loadBookingDetails(bookingId) {
    const detailsEl = document.getElementById('confDetails');

    try {
        const token = localStorage.getItem('siaaToken');
        const res = await fetch(`${API_BASE_URL}/bookings/${bookingId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('Could not load booking');

        const data = await res.json();
        const b = data.booking || data;

        renderDetails(b);
    } catch (err) {
        console.error('Error loading confirmation:', err);
        if (detailsEl) {
            detailsEl.innerHTML = `<p style="color:#ef4444;text-align:center;">Could not load details. Reference: #${bookingId}</p>`;
        }
    }
}

function renderDetails(b) {
    const detailsEl = document.getElementById('confDetails');
    if (!detailsEl) return;

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-SA', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    detailsEl.innerHTML = `
        <div class="conf-detail-row">
            <span class="conf-detail-label">Booking ID</span>
            <span class="conf-detail-value">#${b.BookingID}</span>
        </div>
        <div class="conf-detail-row">
            <span class="conf-detail-label">Storage Space</span>
            <span class="conf-detail-value">${b.SpaceTitle || b.Title || 'Storage Space'}</span>
        </div>
        <div class="conf-detail-row">
            <span class="conf-detail-label">Duration</span>
            <span class="conf-detail-value">${formatDate(b.StartDate)} - ${formatDate(b.EndDate)}</span>
        </div>
        <div class="conf-detail-row">
            <span class="conf-detail-label">Total Amount</span>
            <span class="conf-detail-value">${Number(b.TotalAmount || 0).toLocaleString()} SAR</span>
        </div>
        <div class="conf-detail-row" style="margin-top:20px; padding-top:20px; border-top:1px solid #e2e8f0;">
            <span class="conf-detail-label">Status</span>
            <span class="conf-detail-value" style="color:#22c55e;">Confirmed</span>
        </div>
    `;
}
