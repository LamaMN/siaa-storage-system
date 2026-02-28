// =============================================
// Si'aa – Search + Map
// =============================================

const API_BASE_URL = 'http://localhost:3000/api';
let map = null;
let spaceMarkers = [];
let userMarker = null;

const NEIGHBORHOODS = {
    'al-salama': { lat: 21.5550, lng: 39.1728, label: 'Al-Salama' },
    'al-rawdah': { lat: 21.5620, lng: 39.1850, label: 'Al-Rawdah' },
    'al-nahda': { lat: 21.5700, lng: 39.1950, label: 'Al-Nahda' },
    'al-andalus': { lat: 21.5433, lng: 39.1622, label: 'Al-Andalus' },
    'al-hamra': { lat: 21.5200, lng: 39.1500, label: 'Al-Hamra' },
    'al-rehab': { lat: 21.5380, lng: 39.2080, label: 'Al-Rehab' },
    'al-faisaliyah': { lat: 21.5300, lng: 39.1700, label: 'Al-Faisaliyah' },
    'al-naeem': { lat: 21.5650, lng: 39.2050, label: 'Al-Naeem' },
    'al-basateen': { lat: 21.5790, lng: 39.2200, label: 'Al-Basateen' },
    'al-shati': { lat: 21.4950, lng: 39.1150, label: 'Al-Shati (Corniche)' },
    'al-safa': { lat: 21.5100, lng: 39.1800, label: 'Al-Safa' },
    'al-aziziyah': { lat: 21.5460, lng: 39.2250, label: 'Al-Aziziyah' },
    'al-baghdadiyah': { lat: 21.5780, lng: 39.1630, label: 'Al-Baghdadiyah' },
    'al-balad': { lat: 21.4865, lng: 39.1815, label: 'Al-Balad' },
};

// Default Jeddah center
const JEDDAH_CENTER = [21.5433, 39.1728];

// =============================================
// INITIALIZATION
// =============================================

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    loadSpaces();
    setupFilterForm();
    setupPriceSlider();
    requestUserLocation();
});

// =============================================
// MAP SETUP (Leaflet)
// =============================================

function initMap() {
    if (!window.L) {
        console.warn('Leaflet not loaded – map disabled');
        return;
    }

    map = L.map('search-map', { zoomControl: true, scrollWheelZoom: false }).setView(JEDDAH_CENTER, 12);

    // OpenStreetMap tiles (free, no API key)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
        maxZoom: 18,
    }).addTo(map);

    // Force Leaflet to recalculate size after the flex layout has settled
    requestAnimationFrame(() => { map && map.invalidateSize(); });
    setTimeout(() => { map && map.invalidateSize(); }, 300);
}

function requestUserLocation() {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
        (pos) => {
            const { latitude, longitude } = pos.coords;
            placeUserMarker(latitude, longitude);
            if (map) {
                map.setView([latitude, longitude], 13);
                setTimeout(() => map.invalidateSize(), 100);
            }

            // Save to account if logged in
            saveLocationToAccount(latitude, longitude);
        },
        () => { /* permission denied or unavailable */ }
    );
}

function placeUserMarker(lat, lng) {
    if (!map || !window.L) return;

    if (userMarker) userMarker.remove();

    const icon = L.divIcon({
        className: '',
        html: `<div style="
            width: 20px; height: 20px; background: #3b82f6; border: 3px solid #fff;
            border-radius: 50%; box-shadow: 0 2px 8px rgba(59,130,246,0.5);
        "></div>`,
        iconAnchor: [10, 10],
    });

    userMarker = L.marker([lat, lng], { icon })
        .addTo(map)
        .bindPopup('<strong>📍 Your Location</strong>')
        .openPopup();
}

function addSpaceMarker(space) {
    if (!map || !window.L) return;

    // Try to get coordinates from neighborhood name
    const hood = space.Neighborhood || space.City || '';
    const hoodKey = Object.keys(NEIGHBORHOODS).find(k =>
        hood.toLowerCase().includes(k) || k.includes(hood.toLowerCase())
    );

    let lat, lng;
    if (hoodKey) {
        lat = NEIGHBORHOODS[hoodKey].lat + (Math.random() - 0.5) * 0.005;
        lng = NEIGHBORHOODS[hoodKey].lng + (Math.random() - 0.5) * 0.005;
    } else if (space.Latitude && space.Longitude) {
        lat = space.Latitude;
        lng = space.Longitude;
    } else {
        // Random near Jeddah center
        lat = JEDDAH_CENTER[0] + (Math.random() - 0.5) * 0.08;
        lng = JEDDAH_CENTER[1] + (Math.random() - 0.5) * 0.08;
    }

    const icon = L.divIcon({
        className: '',
        html: `<div style="
            background: #ff6b35; color: #fff; font-size: 11px; font-weight: 700;
            padding: 4px 8px; border-radius: 8px; white-space: nowrap;
            box-shadow: 0 2px 8px rgba(255,107,53,0.4);
        ">${formatPriceShort(space.PricePerMonth)} SAR</div>`,
        iconAnchor: [0, 0],
    });

    const marker = L.marker([lat, lng], { icon })
        .addTo(map)
        .bindPopup(`
            <strong>${escapeHtml(space.Title || 'Storage Space')}</strong><br>
            ${escapeHtml(space.SpaceType || '')} · ${space.Size || '?'} m²<br>
            <b>${formatPriceShort(space.PricePerMonth)} SAR/mo</b>
        `);

    spaceMarkers.push(marker);
}

function clearSpaceMarkers() {
    spaceMarkers.forEach(m => m.remove());
    spaceMarkers = [];
}

function formatPriceShort(value) {
    const n = Number(value);
    if (!n) return '?';
    return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : n.toFixed(0);
}

// =============================================
// SAVE USER LOCATION TO ACCOUNT
// =============================================

async function saveLocationToAccount(lat, lng) {
    const userDataStr = localStorage.getItem('siaaUser');
    const token = localStorage.getItem('siaaToken');
    if (!userDataStr || !token) return;

    try {
        const user = JSON.parse(userDataStr);
        await fetch(`${API_BASE_URL}/profile/${user.userType}/${user.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ lastKnownLat: lat, lastKnownLng: lng }),
        });
    } catch (_) { /* non-critical */ }
}

// =============================================
// SPACE SEARCH & RENDERING
// =============================================

function getSearchFilters() {
    const form = document.querySelector('.filter-form');
    if (!form) return {};

    const params = new URLSearchParams();

    const city = form.querySelector('[name="location_neighborhood"]')?.value;
    if (city) params.set('city', city);

    const sizeVal = form.querySelector('[name="storage_size"]')?.value;
    if (sizeVal && sizeVal !== 'select') {
        const sizeMap = {
            small: { min: 1, max: 3 },
            medium: { min: 4, max: 7 },
            large: { min: 8, max: 12 },
            xl: { min: 13, max: 999 },
        };
        if (sizeMap[sizeVal]) {
            params.set('minSize', sizeMap[sizeVal].min);
            params.set('maxSize', sizeMap[sizeVal].max);
        }
    }

    const maxPrice = form.querySelector('[name="price_max"]')?.value;
    if (maxPrice) params.set('maxPrice', maxPrice);

    const spaceType = form.querySelector('[name="space_type"]')?.value;
    if (spaceType) params.set('space_type', spaceType);

    const sortBy = document.getElementById('sortBy')?.value;
    if (sortBy) params.set('sortBy', sortBy);

    // Feature checkboxes
    const features = Array.from(form.querySelectorAll('[name="environment[]"]:checked')).map(cb => cb.value);
    if (features.includes('climate')) params.set('climateControlled', '1');
    if (features.includes('secure')) params.set('security', '1');
    if (features.includes('parking')) params.set('parking', '1');

    return params;
}

async function loadSpaces() {
    const list = document.querySelector('.storage-results__list');
    if (!list) return;

    list.innerHTML = `<div class="search-loading"><div class="search-spinner"></div><p>Finding spaces...</p></div>`;
    clearSpaceMarkers();

    try {
        const params = getSearchFilters();
        const url = `${API_BASE_URL}/spaces${params.toString() ? '?' + params.toString() : ''}`;
        const response = await fetch(url);

        if (!response.ok) throw new Error('API error');
        const data = await response.json();
        const spaces = data.spaces || [];

        renderSpaceCards(spaces, list);

    } catch (err) {
        console.error('Search error:', err);
        list.innerHTML = `
            <div class="search-empty">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <p>Failed to load spaces. Make sure the server is running.</p>
            </div>`;
    }
}

function renderSpaceCards(spaces, container) {
    if (spaces.length === 0) {
        container.innerHTML = `
            <div class="search-empty">
                <i class="fa-solid fa-box-open"></i>
                <p>No spaces found matching your filters. Try adjusting them.</p>
            </div>`;
        return;
    }

    container.innerHTML = '';

    spaces.forEach(space => {
        addSpaceMarker(space);

        const card = document.createElement('article');
        card.className = 'storage-card';

        const features = [];
        if (space.ClimateControlled) features.push('<span class="space-tag"><i class="fa-solid fa-snowflake"></i> Climate</span>');
        if (space.SecuritySystem) features.push('<span class="space-tag"><i class="fa-solid fa-shield-halved"></i> Secure</span>');
        if (space.ParkingAvailable) features.push('<span class="space-tag"><i class="fa-solid fa-car"></i> Parking</span>');
        if (space.Access24Hours) features.push('<span class="space-tag"><i class="fa-solid fa-clock"></i> 24/7</span>');

        card.innerHTML = `
            <div class="space-card-header">
                <div class="space-card-info">
                    <h3 class="space-card-title">${escapeHtml(space.Title || 'Unnamed Space')}</h3>
                    <p class="space-card-location">
                        <i class="fa-solid fa-location-dot"></i>
                        ${escapeHtml(space.Neighborhood || space.City || 'Jeddah')}, ${escapeHtml(space.AddressLine1 || '')}
                    </p>
                </div>
                <div class="space-card-price">
                    <span class="price-amount">${formatPrice(space.PricePerMonth)}</span>
                    <span class="price-unit">SAR/mo</span>
                </div>
            </div>
            <div class="space-card-meta">
                <span class="space-meta-item"><i class="fa-solid fa-box"></i> ${escapeHtml(space.SpaceType || 'N/A')}</span>
                <span class="space-meta-item"><i class="fa-solid fa-ruler-combined"></i> ${space.Size || '?'} m²</span>
                ${space.MatchScore ? `<span class="space-meta-item match-score"><i class="fa-solid fa-star"></i> ${Math.round(space.MatchScore)}% match</span>` : ''}
            </div>
            ${features.length ? `<div class="space-card-tags">${features.join('')}</div>` : ''}
            <div class="space-card-footer">
                <a href="booking.html?spaceId=${space.SpaceID}" class="btn btn-dark btn-small">
                    Book Now
                </a>
            </div>
        `;

        container.appendChild(card);
    });
}

// =============================================
// FILTER FORM
// =============================================

function setupFilterForm() {
    const form = document.querySelector('.filter-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        loadSpaces();
    });

    // Sort by change also triggers reload
    const sortSelect = document.getElementById('sortBy');
    if (sortSelect) {
        sortSelect.addEventListener('change', () => loadSpaces());
    }
}

// =============================================
// PRICE SLIDER LIVE VALUE
// =============================================

function setupPriceSlider() {
    const slider = document.querySelector('[name="price_max"]');
    if (!slider) return;

    const rangeValues = document.querySelector('.filter-field__range-values');
    if (!rangeValues) return;

    const spans = rangeValues.querySelectorAll('span');

    slider.addEventListener('input', () => {
        if (spans[1]) {
            spans[1].textContent = Number(slider.value).toLocaleString('en-US') + ' SAR';
        }
    });
}

// =============================================
// UTILITIES
// =============================================

function formatPrice(value) {
    if (!value || isNaN(Number(value))) return '0';
    return Number(value).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function escapeHtml(text) {
    if (!text) return '';
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, m => map[m]);
}
