// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';

// Map & Data state
let map, marker;
let currentSpaceId = null;
let currentUser = null;

// =============================================
// INITIALIZATION
// =============================================

document.addEventListener('DOMContentLoaded', async () => {
    checkAuthentication();

    // Get space ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    currentSpaceId = urlParams.get('id');

    if (!currentSpaceId) {
        alert('No space ID provided');
        window.location.href = 'dashboard.html';
        return;
    }

    setupEventListeners();
    await loadSpaceDetails();
});

function checkAuthentication() {
    const userDataStr = localStorage.getItem('siaaUser');
    const token = localStorage.getItem('siaaToken');

    if (!userDataStr || !token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        currentUser = JSON.parse(userDataStr);
        if (currentUser.userType !== 'provider') {
            alert('Only providers can edit spaces');
            window.location.href = 'dashboard.html';
        }
    } catch (error) {
        window.location.href = 'login.html';
    }
}

// =============================================
// DATA LOADING
// =============================================

async function loadSpaceDetails() {
    const loader = document.getElementById('loadingOverlay');
    loader.style.display = 'flex';

    try {
        const response = await fetch(`${API_BASE_URL}/spaces/${currentSpaceId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('siaaToken')}`
            }
        });

        if (!response.ok) throw new Error('Failed to load space details');

        const data = await response.json();
        const space = data.space;

        // Verify ownership
        if (space.ProviderID !== currentUser.id) {
            alert('You do not have permission to edit this space');
            window.location.href = 'dashboard.html';
            return;
        }

        populateForm(space);
        initMap(space.Latitude, space.Longitude);

    } catch (error) {
        console.error('Load details error:', error);
        alert('Error: ' + error.message);
        window.location.href = 'dashboard.html';
    } finally {
        loader.style.display = 'none';
    }
}

function populateForm(space) {
    document.getElementById('spaceId').value = space.SpaceID;
    document.getElementById('listingTitle').value = space.Title || '';
    document.getElementById('listingDescription').value = space.Description || '';
    document.getElementById('listingType').value = space.SpaceType || 'room';
    document.getElementById('listingStatus').value = space.Status || 'Active';

    document.getElementById('listingCity').value = space.City || '';
    document.getElementById('listingAddress').value = space.AddressLine1 || '';
    document.getElementById('latitude').value = space.Latitude || '';
    document.getElementById('longitude').value = space.Longitude || '';

    document.getElementById('listingLength').value = space.Length || '';
    document.getElementById('listingWidth').value = space.Width || '';
    document.getElementById('listingHeight').value = space.Height || '';
    document.getElementById('listingSize').value = space.Size || '';

    document.getElementById('pricePerMonth').value = space.PricePerMonth || '';
    document.getElementById('pricePerWeek').value = space.PricePerWeek || '';
    document.getElementById('pricePerDay').value = space.PricePerDay || '';

    document.getElementById('accessType').value = space.AccessType || '24/7';
    document.getElementById('restrictions').value = space.Restrictions || '';

    // Checkboxes
    document.getElementById('featClimate').checked = !!space.ClimateControlled;
    document.getElementById('featSecurity').checked = !!space.SecuritySystem;
    document.getElementById('featCCTV').checked = !!space.CCTVMonitored;
    document.getElementById('featParking').checked = !!space.ParkingAvailable;
    document.getElementById('featLoading').checked = !!space.LoadingAssistance;
}

// =============================================
// MAP & UTILS
// =============================================

function initMap(lat, lng) {
    const defaultLat = lat || 21.5433;
    const defaultLng = lng || 39.1721;

    map = L.map('map-picker').setView([defaultLat, defaultLng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    marker = L.marker([defaultLat, defaultLng], { draggable: true }).addTo(map);

    marker.on('dragend', function (e) {
        const pos = marker.getLatLng();
        document.getElementById('latitude').value = pos.lat.toFixed(6);
        document.getElementById('longitude').value = pos.lng.toFixed(6);
    });

    map.on('click', function (e) {
        marker.setLatLng(e.latlng);
        document.getElementById('latitude').value = e.latlng.lat.toFixed(6);
        document.getElementById('longitude').value = e.latlng.lng.toFixed(6);
    });
}

function setupEventListeners() {
    const form = document.getElementById('editSpaceForm');

    // Auto-calculate area
    const dimInputs = ['listingLength', 'listingWidth'];
    dimInputs.forEach(id => {
        document.getElementById(id).addEventListener('input', () => {
            const l = parseFloat(document.getElementById('listingLength').value) || 0;
            const w = parseFloat(document.getElementById('listingWidth').value) || 0;
            if (l > 0 && w > 0) {
                document.getElementById('listingSize').value = (l * w).toFixed(2);
            }
        });
    });

    // Update lat/lng from inputs
    ['latitude', 'longitude'].forEach(id => {
        document.getElementById(id).addEventListener('change', () => {
            const lat = parseFloat(document.getElementById('latitude').value);
            const lng = parseFloat(document.getElementById('longitude').value);
            if (!isNaN(lat) && !isNaN(lng)) {
                const pos = [lat, lng];
                marker.setLatLng(pos);
                map.setView(pos, map.getZoom());
            }
        });
    });

    form.addEventListener('submit', handleFormSubmit);
}

// =============================================
// SUBMISSION
// =============================================

async function handleFormSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Updating...';
    }

    const formData = new FormData(form);
    const payload = {};

    // Basic fields
    formData.forEach((value, key) => {
        if (key === 'spaceId') return;

        // Convert numbers
        const numFields = ['size', 'height', 'width', 'length', 'pricePerMonth', 'pricePerWeek', 'pricePerDay', 'latitude', 'longitude'];
        if (numFields.includes(key)) {
            payload[key] = value ? parseFloat(value) : null;
        } else {
            payload[key] = value || null;
        }
    });

    // Checkboxes (not included in FormData if unchecked)
    const boolFields = ['climateControlled', 'securitySystem', 'cctvMonitored', 'parkingAvailable', 'loadingAssistance'];
    boolFields.forEach(id => {
        const input = document.querySelector(`[name="${id}"]`);
        payload[id] = input ? input.checked : false;
    });

    try {
        const response = await fetch(`${API_BASE_URL}/spaces/${currentSpaceId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('siaaToken')}`,
                'x-user-id': String(currentUser.id),
                'x-user-type': 'provider'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.error || 'Failed to update space');
        }

        alert('Space updated successfully!');
        window.location.href = 'dashboard.html';

    } catch (error) {
        console.error('Update error:', error);
        alert('Error: ' + error.message);
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerText = 'Update Space';
        }
    }
}
