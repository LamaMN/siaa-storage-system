// =============================================
// Si'aa – Booking Page
// =============================================

const API_BASE_URL = 'http://localhost:3000/api';
let currentSpace = null;

document.addEventListener('DOMContentLoaded', () => {
    const spaceId = getSpaceIdFromUrl();
    if (!spaceId) {
        showError('No space selected. Please go back and choose a space.');
        return;
    }
    loadSpace(spaceId);
    setupDateListeners();
    setupSubmitButton(spaceId);
    prefillUserFromStorage();
    initBookingMap();
});

// =============================================
// URL PARAMS
// =============================================

function getSpaceIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return parseInt(params.get('spaceId') || '0', 10) || null;
}

// =============================================
// LOAD SPACE DATA
// =============================================

async function loadSpace(spaceId) {
    try {
        const res = await fetch(`${API_BASE_URL}/spaces/${spaceId}`);
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        currentSpace = data.space || data;
        populateSpaceInfo(currentSpace);
        loadReviews(spaceId);
        if (currentSpace.Latitude && currentSpace.Longitude) {
            setBookingMapLocation(parseFloat(currentSpace.Latitude), parseFloat(currentSpace.Longitude));
        }
    } catch (err) {
        showError('Could not load space details. Please go back and try again.');
    }
}

function populateSpaceInfo(s) {
    // Title / type
    setEl('bookingType', s.Title || s.SpaceType || 'Storage Space');

    // Address
    const addr = [s.AddressLine1, s.City].filter(Boolean).join(', ');
    setEl('bookingAddress', s.Landmark ? `${addr} · Near ${s.Landmark}` : addr);

    // Date of listing
    if (s.CreatedAt) {
        const d = new Date(s.CreatedAt);
        setEl('bookingDate', `Listed ${d.toLocaleDateString('en-SA', { month: 'long', year: 'numeric' })}`);
    }

    // Meta boxes
    setEl('bookingPrice', s.PricePerMonth ? `${formatPrice(s.PricePerMonth)} SAR/mo` : '—');
    setEl('bookingSize', s.Size ? `${s.Size} m²` : '—');
    setEl('bookingDistance', s.City || 'Jeddah');

    // Feature tags
    const tags = document.getElementById('bookingTags');
    if (tags) {
        const features = [];
        if (s.ClimateControlled) features.push('❄️ Climate-controlled');
        if (s.SecuritySystem) features.push('🔒 Security');
        if (s.ParkingAvailable) features.push('🚗 Parking');
        if (s.LoadingAssistance) features.push('🏗️ Loading help');
        if (s.AccessType) features.push(`⏰ ${s.AccessType}`);
        tags.innerHTML = features.map(f =>
            `<span class="booking-tag">${f}</span>`
        ).join('');
    }

    // Owner info
    const providerName = s.BusinessName || `${s.ProviderFirstName || ''} ${s.ProviderLastName || ''}`.trim();
    setEl('ownerName', providerName || '—');
    setEl('ownerPhone', s.ProviderPhone || '—');
    setEl('ownerEmail', s.ProviderEmail || '—');

    // Side panel
    setEl('sideSpaceType', s.SpaceType || 'Storage');
    updateTotal();
}

// =============================================
// REVIEWS
// =============================================

async function loadReviews(spaceId) {
    try {
        const res = await fetch(`${API_BASE_URL}/spaces/${spaceId}/reviews`);
        if (!res.ok) return;
        const data = await res.json();
        const reviews = data.reviews || [];
        if (reviews[0]) {
            const stars1 = '★'.repeat(reviews[0].Rating || 5);
            setEl('bookingReview1', `"${reviews[0].Comment || 'Great space!'}" — ${reviews[0].ReviewerName || 'Verified User'}`);
            document.querySelector('.booking-review-line .booking-stars').textContent = stars1;
        }
        if (reviews[1]) {
            const stars2 = '★'.repeat(reviews[1].Rating || 4);
            setEl('bookingReview2', `"${reviews[1].Comment || 'Recommended.'}" — ${reviews[1].ReviewerName || 'Verified User'}`);
            document.querySelector('.booking-review-line.secondary .booking-stars').textContent = stars2;
        }
    } catch (_) { }
}

// =============================================
// DATE PICKER – TOTAL CALCULATION
// =============================================

function setupDateListeners() {
    const start = document.getElementById('bookingStartDate');
    const end = document.getElementById('bookingEndDate');

    // Set min date to today
    const today = new Date().toISOString().split('T')[0];
    if (start) start.min = today;
    if (end) end.min = today;

    const update = () => {
        updateTotal();
        // Keep end >= start
        if (start && end && end.value && start.value > end.value) {
            end.value = start.value;
        }
    };

    start?.addEventListener('change', update);
    end?.addEventListener('change', update);
}

function updateTotal() {
    const start = document.getElementById('bookingStartDate')?.value;
    const end = document.getElementById('bookingEndDate')?.value;
    const totalEl = document.getElementById('sideTotal');
    const datesEl = document.getElementById('sideDates');

    if (!start || !end || !currentSpace) {
        if (totalEl) totalEl.textContent = '—';
        if (datesEl) datesEl.textContent = 'Select your dates';
        return;
    }

    const startD = new Date(start);
    const endD = new Date(end);

    if (isNaN(startD) || isNaN(endD) || endD <= startD) {
        if (totalEl) totalEl.textContent = '—';
        return;
    }

    const days = Math.ceil((endD - startD) / (1000 * 60 * 60 * 24));
    const months = days / 30;

    // Choose best pricing tier
    let total;
    if (days >= 28 && currentSpace.PricePerMonth) {
        total = Math.ceil(months) * parseFloat(currentSpace.PricePerMonth);
    } else if (days >= 7 && currentSpace.PricePerWeek) {
        const weeks = days / 7;
        total = Math.ceil(weeks) * parseFloat(currentSpace.PricePerWeek);
    } else if (currentSpace.PricePerDay) {
        total = days * parseFloat(currentSpace.PricePerDay);
    } else if (currentSpace.PricePerMonth) {
        total = Math.max(1, Math.ceil(months)) * parseFloat(currentSpace.PricePerMonth);
    }

    if (total) {
        if (totalEl) totalEl.textContent = `${formatPrice(total)} SAR`;
    }

    if (datesEl) {
        const fmt = d => d.toLocaleDateString('en-SA', { day: 'numeric', month: 'short' });
        datesEl.textContent = `${fmt(startD)} – ${fmt(endD)} (${days} days)`;
    }
}

// =============================================
// PRE-FILL LOGGED-IN USER
// =============================================

function prefillUserFromStorage() {
    // Nothing to pre-fill on booking page currently (user info is for payment)
}

// =============================================
// BOOKING MAP (Leaflet)
// =============================================

let bookingMap = null;

function initBookingMap() {
    if (!window.L) return;
    const mapEl = document.getElementById('bookingMap');
    if (!mapEl) return;

    // Remove placeholder image if present
    mapEl.innerHTML = '';
    mapEl.style.cssText = 'height:200px;border-radius:12px;overflow:hidden;';

    bookingMap = L.map('bookingMap', { zoomControl: false, dragging: false, scrollWheelZoom: false })
        .setView([21.5433, 39.1728], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
    }).addTo(bookingMap);

    setTimeout(() => bookingMap && bookingMap.invalidateSize(), 300);
}

function setBookingMapLocation(lat, lng) {
    if (!bookingMap || !window.L) return;
    bookingMap.setView([lat, lng], 16);

    L.marker([lat, lng], {
        icon: L.divIcon({
            className: '',
            html: `<div style="background:#ff6b35;width:14px;height:14px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px rgba(255,107,53,0.5);"></div>`,
            iconAnchor: [7, 7],
        }),
    }).addTo(bookingMap);
}

// =============================================
// SUBMIT BOOKING
// =============================================

function setupSubmitButton(spaceId) {
    const btn = document.getElementById('proceedToPaymentBtn');
    if (!btn) return;

    btn.addEventListener('click', async () => {
        const startDate = document.getElementById('bookingStartDate')?.value;
        const endDate = document.getElementById('bookingEndDate')?.value;
        const logistics = document.querySelector('input[name="logisticsOption"]:checked')?.value;
        const errEl = document.getElementById('bookingError');

        // Validation
        if (errEl) errEl.style.display = 'none';
        if (!startDate || !endDate) return showBookingError('Please select start and end dates.');
        if (new Date(endDate) <= new Date(startDate)) return showBookingError('End date must be after start date.');
        if (!logistics) return showBookingError('Please choose a logistics option.');

        // Check auth
        const token = localStorage.getItem('siaaToken');
        const userDataStr = localStorage.getItem('siaaUser');
        if (!token || !userDataStr) {
            window.location.href = `login.html?redirect=booking.html?spaceId=${spaceId}`;
            return;
        }

        const user = JSON.parse(userDataStr);
        btn.textContent = 'Processing...';
        btn.disabled = true;

        try {
            const res = await fetch(`${API_BASE_URL}/bookings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'x-user-id': String(user.id || user.SeekerID),
                    'x-user-type': user.userType || 'seeker',
                },
                body: JSON.stringify({
                    spaceId,
                    startDate,
                    endDate,
                    logisticsOption: logistics,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || data.message || 'Booking failed');

            // Redirect to payment
            const bookingId = data.bookingId || data.BookingID;
            window.location.href = `payment.html?bookingId=${bookingId}`;

        } catch (err) {
            showBookingError(err.message || 'Something went wrong. Please try again.');
            btn.textContent = 'Proceed to Payment';
            btn.disabled = false;
        }
    });
}

// =============================================
// HELPERS
// =============================================

function setEl(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function showError(message) {
    const main = document.querySelector('.booking-main-card');
    if (main) {
        main.innerHTML = `
            <div style="padding:60px;text-align:center;color:#4a5568;">
                <i class="fa-solid fa-triangle-exclamation" style="font-size:36px;color:#e63946;"></i>
                <p style="margin-top:16px;font-size:16px;">${message}</p>
                <a href="search.html" class="btn btn-dark" style="margin-top:16px;display:inline-block;">Back to Search</a>
            </div>`;
    }
}

function showBookingError(message) {
    const errEl = document.getElementById('bookingError');
    if (errEl) {
        errEl.textContent = message;
        errEl.style.display = 'block';
        errEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

function formatPrice(value) {
    if (!value || isNaN(Number(value))) return '0';
    return Number(value).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
