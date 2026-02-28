// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';

// User session management
let currentUser = null;

// =============================================
// INITIALIZATION
// =============================================

document.addEventListener('DOMContentLoaded', () => {
    checkAuthentication();
    setupEventListeners();
    setupProfilePicturePreview();
});

// =============================================
// AUTHENTICATION
// =============================================

function checkAuthentication() {
    const userDataStr = localStorage.getItem('siaaUser');
    const token = localStorage.getItem('siaaToken');

    if (!userDataStr || !token) {
        showLoginPrompt();
        return;
    }

    try {
        currentUser = JSON.parse(userDataStr);
        initializeDashboard();
    } catch (error) {
        console.error('Error parsing user data:', error);
        logout();
    }
}

function showLoginPrompt() {
    const dashboardMain = document.querySelector('.dashboard-main');
    const sidebar = document.querySelector('.sideBar');

    if (sidebar) sidebar.style.display = 'none';

    if (dashboardMain) {
        dashboardMain.innerHTML = `
            <div class="container">
                <div class="login-prompt">
                    <div class="login-prompt-icon">
                        <i class="fa-solid fa-lock"></i>
                    </div>
                    <h2 class="login-prompt-title">Access Required</h2>
                    <p class="login-prompt-text">
                        Please log in to view your dashboard and manage your storage.
                    </p>
                    <div class="login-prompt-actions">
                        <a href="login.html" class="btn btn-primary">
                            <i class="fa-solid fa-right-to-bracket"></i>
                            Log In
                        </a>
                        <a href="register.html" class="btn btn-secondary">
                            <i class="fa-solid fa-user-plus"></i>
                            Create Account
                        </a>
                    </div>
                    <p class="login-prompt-footer">
                        New to Si'aa? <a href="index.html">Learn more about our platform</a>
                    </p>
                </div>
            </div>
        `;
    }
}

function logout() {
    localStorage.removeItem('siaaUser');
    localStorage.removeItem('siaaToken');
    window.location.href = 'login.html';
}

// =============================================
// UTILITY: Price formatting & helpers
// =============================================

function formatPrice(value) {
    if (value === null || value === undefined || isNaN(Number(value))) return '0.00';
    return Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatPriceWithCurrency(value, suffix = 'SAR') {
    return `${formatPrice(value)} ${suffix}`;
}

function toNumber(v) {
    return v === null || v === undefined ? 0 : Number(v);
}

// =============================================
// DASHBOARD INITIALIZATION
// =============================================

async function initializeDashboard() {
    try {
        document.getElementById('userNameDisplay').textContent = currentUser.firstName;

        const roleText = currentUser.userType === 'seeker' ? 'Storage Seeker' : 'Storage Provider';
        document.getElementById('userRoleDisplay').textContent = roleText;

        // Update action button (now an <a> tag)
        const actionButton = document.getElementById('actionButton');
        if (currentUser.userType === 'seeker') {
            actionButton.textContent = 'Browse Spaces';
            actionButton.href = 'search.html';
        } else {
            actionButton.textContent = 'Add New Space';
            actionButton.href = 'listSpace.html';
        }

        // Update history section title
        const historyTitle = document.getElementById('historyTitle');
        if (historyTitle) {
            historyTitle.textContent = currentUser.userType === 'seeker' ? 'My Bookings' : 'My Spaces';
        }

        // Update statistics labels
        const statTotalLabel = document.getElementById('statTotalLabel');
        if (statTotalLabel) {
            statTotalLabel.textContent = currentUser.userType === 'seeker' ? 'Total Bookings' : 'Total Spaces';
        }

        // Update company/business name label
        const companyLabel = document.getElementById('companyNameLabel');
        if (companyLabel) {
            companyLabel.textContent = currentUser.userType === 'seeker'
                ? 'Company (optional)'
                : 'Business Name (optional)';
        }

        // Show preferred locations only for seekers
        const prefLocCard = document.getElementById('preferredLocationsCard');
        if (prefLocCard) {
            prefLocCard.style.display = currentUser.userType === 'seeker' ? 'block' : 'none';
        }

        await loadProfile();
        await loadHistory();
        await loadStatistics();

    } catch (error) {
        console.error('Dashboard initialization error:', error);
        showError('Failed to initialize dashboard');
    }
}

// =============================================
// REVIEW MODAL FUNCTIONALITY
// =============================================

function showReviewModal(booking) {
    const modalHTML = `
        <div class="review-modal-overlay" id="reviewModalOverlay">
            <div class="review-modal">
                <div class="review-modal-header">
                    <h3>Review Your Experience</h3>
                    <button class="review-modal-close" onclick="closeReviewModal()">
                        <i class="fa-solid fa-times"></i>
                    </button>
                </div>

                <div class="review-modal-body">
                    <div class="review-booking-info">
                        <h4>${escapeHtml(booking.SpaceTitle)}</h4>
                        <p>${escapeHtml(booking.SpaceType)} • ${formatDate(booking.StartDate)} - ${formatDate(booking.EndDate)}</p>
                    </div>

                    <div class="review-form-group">
                        <label class="review-label">Rating</label>
                        <div class="review-stars-container" id="reviewStarsContainer">
                            <span class="review-star" data-value="1">★</span>
                            <span class="review-star" data-value="2">★</span>
                            <span class="review-star" data-value="3">★</span>
                            <span class="review-star" data-value="4">★</span>
                            <span class="review-star" data-value="5">★</span>
                        </div>
                        <p class="review-rating-text" id="reviewRatingText">Select Rating</p>
                        <input type="hidden" id="reviewRatingValue" value="0">
                    </div>

                    <div class="review-form-group">
                        <label class="review-label">Your Review</label>
                        <textarea
                            id="reviewText"
                            class="review-textarea"
                            rows="4"
                            placeholder="Share your experience with this storage space..."
                            maxlength="500"
                        ></textarea>
                        <p class="review-char-count">
                            <span id="reviewCharCount">0</span>/500 characters
                        </p>
                    </div>

                    <p class="review-error" id="reviewError" style="display: none;"></p>
                </div>

                <div class="review-modal-footer">
                    <button class="btn btn-outline" onclick="closeReviewModal()">Cancel</button>
                    <button class="btn btn-primary" onclick="submitReview(${booking.BookingID})">
                        Submit Review
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    setupReviewStars();
    setupCharacterCount();
}

function setupReviewStars() {
    const stars = document.querySelectorAll('.review-star');
    const ratingInput = document.getElementById('reviewRatingValue');
    const ratingText = document.getElementById('reviewRatingText');
    const ratingLabels = { 1: "Very Bad", 2: "Poor", 3: "Average", 4: "Good", 5: "Excellent" };

    stars.forEach(star => {
        star.addEventListener('mouseenter', () => {
            const value = star.getAttribute('data-value');
            stars.forEach(s => s.classList.toggle('hovered', s.getAttribute('data-value') <= value));
            ratingText.innerText = ratingLabels[value];
        });
        star.addEventListener('mouseleave', () => {
            stars.forEach(s => s.classList.remove('hovered'));
            ratingText.innerText = ratingInput.value == 0 ? 'Select Rating' : ratingLabels[ratingInput.value];
        });
        star.addEventListener('click', () => {
            const value = star.getAttribute('data-value');
            ratingInput.value = value;
            stars.forEach(s => s.classList.toggle('selected', s.getAttribute('data-value') <= value));
            ratingText.innerText = ratingLabels[value];
        });
    });
}

function setupCharacterCount() {
    const textarea = document.getElementById('reviewText');
    const charCount = document.getElementById('reviewCharCount');
    if (textarea && charCount) {
        textarea.addEventListener('input', () => { charCount.textContent = textarea.value.length; });
    }
}

function closeReviewModal() {
    const modal = document.getElementById('reviewModalOverlay');
    if (modal) modal.remove();
}

async function submitReview(bookingId) {
    const ratingValue = parseInt(document.getElementById('reviewRatingValue').value);
    const reviewText = document.getElementById('reviewText').value.trim();
    const errorEl = document.getElementById('reviewError');

    if (ratingValue === 0) {
        errorEl.textContent = 'Please select a rating';
        errorEl.style.display = 'block';
        return;
    }
    if (reviewText.length < 10) {
        errorEl.textContent = 'Review must be at least 10 characters';
        errorEl.style.display = 'block';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}/review`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('siaaToken')}`
            },
            body: JSON.stringify({ rating: ratingValue, comment: reviewText, seekerId: currentUser.id })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to submit review');
        showSuccess('Review submitted successfully!');
        closeReviewModal();
        await loadHistory();
    } catch (error) {
        console.error('Review submission error:', error);
        document.getElementById('reviewError').textContent = error.message;
        document.getElementById('reviewError').style.display = 'block';
    }
}

// =============================================
// PROFILE MANAGEMENT
// =============================================

async function loadProfile() {
    try {
        const response = await fetch(
            `${API_BASE_URL}/profile/${currentUser.userType}/${currentUser.id}`,
            { headers: { 'Authorization': `Bearer ${localStorage.getItem('siaaToken')}` } }
        );
        if (!response.ok) throw new Error('Failed to load profile');

        const data = await response.json();
        const profile = data.profile;

        // Load profile picture
        loadProfilePicture();

        // Populate profile form
        document.getElementById('profileFirstName').value = profile.FirstName || '';
        document.getElementById('profileLastName').value = profile.LastName || '';
        document.getElementById('profileEmail').value = profile.Email || '';
        document.getElementById('profilePhone').value = profile.PhoneNumber || '';
        document.getElementById('profileRole').value =
            currentUser.userType === 'seeker' ? 'Storage Seeker' : 'Storage Provider';
        document.getElementById('profileStatus').value = profile.AccountStatus || '';

        // Company/Business name – different column for each type
        if (currentUser.userType === 'seeker') {
            document.getElementById('companyName').value = profile.CompanyName || '';
        } else {
            document.getElementById('companyName').value = profile.BusinessName || '';
        }

        // --- Populate Settings section ---
        populateSettings(profile);

    } catch (error) {
        console.error('Profile load error:', error);
        showError('Failed to load profile data');
    }
}

function populateSettings(profile) {
    // Notification preferences (JSON string: {"email":true,"sms":true,"push":true})
    let notifPrefs = { email: true, sms: true, push: true };
    try {
        if (profile.NotificationPreferences) {
            const parsed = JSON.parse(profile.NotificationPreferences);
            notifPrefs = { ...notifPrefs, ...parsed };
        }
    } catch (_) { }

    const notifEmail = document.getElementById('notifEmail');
    const notifSms = document.getElementById('notifSms');
    const notifPush = document.getElementById('notifPush');
    if (notifEmail) notifEmail.checked = notifPrefs.email !== false;
    if (notifSms) notifSms.checked = notifPrefs.sms !== false;
    if (notifPush) notifPush.checked = notifPrefs.push !== false;

    // Communication method
    const commMethod = profile.PreferredCommunicationMethod || 'Email';
    const commRadios = document.querySelectorAll('input[name="commMethod"]');
    commRadios.forEach(radio => { radio.checked = radio.value === commMethod; });

    // Language preference
    const langPref = profile.PreferredLanguage || 'ar';
    const langRadios = document.querySelectorAll('input[name="langPref"]');
    langRadios.forEach(radio => { radio.checked = radio.value === langPref; });

    // Preferred locations (seeker only) – comma-separated string
    if (currentUser.userType === 'seeker' && profile.PreferredLocations) {
        const locations = profile.PreferredLocations.split(',').map(l => l.trim());
        document.querySelectorAll('input[name="prefLoc"]').forEach(cb => {
            cb.checked = locations.includes(cb.value);
        });
    }
}

async function loadProfilePicture() {
    try {
        const response = await fetch(
            `${API_BASE_URL}/images/${currentUser.userType}/${currentUser.id}`,
            { headers: { 'Authorization': `Bearer ${localStorage.getItem('siaaToken')}` } }
        );
        if (!response.ok) return;

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const previewWrapper = document.getElementById('profilePreviewWrapper');
        const previewImg = document.getElementById('profilePreviewImg');
        if (previewWrapper && previewImg) {
            previewImg.src = url;
            previewWrapper.classList.add('has-image');
        }
    } catch (error) {
        // No picture yet – silently ignore
    }
}

async function updateProfile(formData) {
    try {
        const token = localStorage.getItem('siaaToken');
        let response;

        // Check if there's a file to upload
        const fileInput = document.getElementById('profilePicture');
        const hasFile = fileInput && fileInput.files && fileInput.files.length > 0;

        if (hasFile) {
            // Use multipart/form-data for file upload
            const fd = new FormData();
            fd.append('profilePicture', fileInput.files[0]);
            // Append all text fields
            Object.entries(formData).forEach(([key, value]) => {
                if (value !== undefined && value !== null) fd.append(key, value);
            });

            response = await fetch(
                `${API_BASE_URL}/profile/${currentUser.userType}/${currentUser.id}`,
                { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` }, body: fd }
            );
        } else {
            // JSON update (no file)
            response = await fetch(
                `${API_BASE_URL}/profile/${currentUser.userType}/${currentUser.id}`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(formData)
                }
            );
        }

        if (!response.ok) throw new Error('Failed to update profile');

        showSuccess('Profile updated successfully!');
        currentUser.firstName = formData.firstName || currentUser.firstName;
        localStorage.setItem('siaaUser', JSON.stringify(currentUser));
        document.getElementById('userNameDisplay').textContent = currentUser.firstName;

        // Reload picture if new one was uploaded
        if (hasFile) loadProfilePicture();

    } catch (error) {
        console.error('Profile update error:', error);
        showError('Failed to update profile');
    }
}

// =============================================
// SETTINGS MANAGEMENT
// =============================================

async function saveSettings() {
    try {
        const notifEmail = document.getElementById('notifEmail')?.checked ?? true;
        const notifSms = document.getElementById('notifSms')?.checked ?? true;
        const notifPush = document.getElementById('notifPush')?.checked ?? true;
        const notifPrefs = JSON.stringify({ email: notifEmail, sms: notifSms, push: notifPush });

        const commMethod = document.querySelector('input[name="commMethod"]:checked')?.value || 'Email';
        const langPref = document.querySelector('input[name="langPref"]:checked')?.value || 'ar';

        const settingsPayload = {
            notificationPreferences: notifPrefs,
            preferredCommunicationMethod: commMethod,
            preferredLanguage: langPref,
        };

        // Preferred locations (seeker only)
        if (currentUser.userType === 'seeker') {
            const checked = Array.from(document.querySelectorAll('input[name="prefLoc"]:checked'));
            settingsPayload.preferredLocations = checked.map(cb => cb.value).join(',');
        }

        const response = await fetch(
            `${API_BASE_URL}/profile/${currentUser.userType}/${currentUser.id}`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('siaaToken')}`
                },
                body: JSON.stringify(settingsPayload)
            }
        );

        if (!response.ok) throw new Error('Failed to save settings');

        // Show inline success message
        const msg = document.getElementById('settingsSaveMsg');
        if (msg) {
            msg.style.display = 'inline-flex';
            setTimeout(() => { msg.style.display = 'none'; }, 3000);
        }

    } catch (error) {
        console.error('Settings save error:', error);
        showError('Failed to save settings');
    }
}

// =============================================
// HISTORY MANAGEMENT WITH REVIEW SUPPORT
// =============================================

async function loadHistory() {
    const historyList = document.getElementById('historyList');
    const historyLoading = document.getElementById('historyLoading');
    const historyEmpty = document.getElementById('historyEmptyMessage');

    try {
        historyLoading.style.display = 'block';
        historyList.innerHTML = '';
        historyEmpty.style.display = 'none';

        let response;
        if (currentUser.userType === 'seeker') {
            response = await fetch(
                `${API_BASE_URL}/seeker/${currentUser.id}/bookings`,
                { headers: { 'Authorization': `Bearer ${localStorage.getItem('siaaToken')}` } }
            );
        } else {
            response = await fetch(
                `${API_BASE_URL}/provider/${currentUser.id}/spaces`,
                { headers: { 'Authorization': `Bearer ${localStorage.getItem('siaaToken')}` } }
            );
        }

        if (!response.ok) throw new Error('Failed to load history');

        const data = await response.json();
        const items = currentUser.userType === 'seeker' ? data.bookings : data.spaces;

        historyLoading.style.display = 'none';

        if (items.length === 0) {
            historyEmpty.style.display = 'block';
            return;
        }

        if (currentUser.userType === 'seeker') {
            await renderBookingsWithReviews(items);
        } else {
            renderSpaces(items);
        }

    } catch (error) {
        console.error('History load error:', error);
        historyLoading.style.display = 'none';
        showError('Failed to load history data');
    }
}

async function renderBookingsWithReviews(bookings) {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';

    let existingReviews = [];
    try {
        const reviewsResponse = await fetch(
            `${API_BASE_URL}/seeker/${currentUser.id}/reviews`,
            { headers: { 'Authorization': `Bearer ${localStorage.getItem('siaaToken')}` } }
        );
        if (reviewsResponse.ok) {
            const reviewsData = await reviewsResponse.json();
            existingReviews = reviewsData.reviews || [];
        }
    } catch (error) {
        console.error('Error fetching reviews:', error);
    }

    bookings.forEach(booking => {
        const li = document.createElement('li');
        li.className = 'history-item';

        const statusClass = getStatusClass(booking.BookingStatus);
        const hasReview = existingReviews.some(r => r.BookingID === booking.BookingID);
        const canReview = booking.BookingStatus === 'Completed' && !hasReview;

        const reviewButton = canReview ? `
            <button class="btn btn-outline btn-small review-btn" onclick="showReviewModal(${JSON.stringify(booking).replace(/"/g, '&quot;')})">
                <i class="fa-solid fa-star"></i> Write Review
            </button>
        ` : '';

        const reviewBadge = hasReview ? `
            <span class="review-badge">
                <i class="fa-solid fa-check-circle"></i> Reviewed
            </span>
        ` : '';

        li.innerHTML = `
            <div class="history-item-header">
                <h3 class="history-item-title">${escapeHtml(booking.SpaceTitle)}</h3>
                <div class="history-item-badges">
                    <span class="history-item-badge ${statusClass}">${booking.BookingStatus}</span>
                    ${reviewBadge}
                </div>
            </div>
            <div class="history-item-details">
                <p><i class="fa-solid fa-location-dot"></i> ${escapeHtml(booking.City || 'N/A')}, ${escapeHtml(booking.AddressLine1 || '')}</p>
                <p><i class="fa-solid fa-calendar"></i> ${formatDate(booking.StartDate)} - ${formatDate(booking.EndDate)}</p>
                <p><i class="fa-solid fa-user"></i> Provider: ${escapeHtml(booking.ProviderName)}</p>
                <p><i class="fa-solid fa-box"></i> Type: ${escapeHtml(booking.SpaceType)} | Size: ${booking.Size} m²</p>
            </div>
            <div class="history-item-footer">
                <div class="history-item-footer-left">
                    <span class="history-item-date">Booked: ${formatDate(booking.CreatedAt)}</span><br>
                    <span class="history-item-price">${formatPriceWithCurrency(booking.TotalAmount)}</span>
                </div>
                <div class="history-item-footer-right">
                    ${reviewButton}
                </div>
            </div>
        `;

        historyList.appendChild(li);
    });
}

function renderSpaces(spaces) {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';

    spaces.forEach(space => {
        const li = document.createElement('li');
        li.className = 'history-item';
        const statusClass = getStatusClass(space.Status);

        li.innerHTML = `
            <div class="history-item-header">
                <h3 class="history-item-title">${escapeHtml(space.Title)}</h3>
                <span class="history-item-badge ${statusClass}">${space.Status}</span>
            </div>
            <div class="history-item-details">
                <p><i class="fa-solid fa-location-dot"></i> ${escapeHtml(space.City || 'N/A')}, ${escapeHtml(space.AddressLine1 || '')}</p>
                <p><i class="fa-solid fa-box"></i> Type: ${escapeHtml(space.SpaceType)} | Size: ${space.Size} m²</p>
                <p><i class="fa-solid fa-heart"></i> ${space.FavoriteCount} favorites | ${space.TotalBookings} total bookings</p>
                <p><i class="fa-solid fa-check-circle"></i> Available: ${space.IsAvailable ? 'Yes' : 'No'} | Active Bookings: ${space.ActiveBookings}</p>
            </div>
            <div class="history-item-footer">
                <span class="history-item-price">${formatPriceWithCurrency(space.PricePerMonth)}</span>
                <span class="history-item-date">Listed: ${formatDate(space.CreatedAt)}</span>
            </div>
        `;

        historyList.appendChild(li);
    });
}

// =============================================
// STATISTICS MANAGEMENT
// =============================================

async function loadStatistics() {
    try {
        let response;
        if (currentUser.userType === 'seeker') {
            response = await fetch(
                `${API_BASE_URL}/seeker/${currentUser.id}/statistics`,
                { headers: { 'Authorization': `Bearer ${localStorage.getItem('siaaToken')}` } }
            );
        } else {
            response = await fetch(
                `${API_BASE_URL}/provider/${currentUser.id}/statistics`,
                { headers: { 'Authorization': `Bearer ${localStorage.getItem('siaaToken')}` } }
            );
        }

        if (!response.ok) throw new Error('Failed to load statistics');

        const data = await response.json();
        const stats = data.statistics;

        if (currentUser.userType === 'seeker') {
            document.getElementById('statTotal').textContent = stats.TotalBookings || 0;
            document.getElementById('statActive').textContent = stats.ActiveBookings || 0;
            document.getElementById('statPending').textContent = stats.PendingBookings || 0;
            document.getElementById('statRevenue').textContent = formatPriceWithCurrency(stats.TotalSpent || 0);
        } else {
            document.getElementById('statTotal').textContent = stats.TotalSpaces || 0;
            document.getElementById('statActive').textContent = stats.ActiveSpaces || 0;
            document.getElementById('statPending').textContent = stats.PendingSpaces || 0;
            document.getElementById('statRevenue').textContent = formatPriceWithCurrency(stats.TotalRevenue || 0);
        }

    } catch (error) {
        console.error('Statistics load error:', error);
        showError('Failed to load statistics');
    }
}

// =============================================
// EVENT LISTENERS
// =============================================

function setupEventListeners() {
    // Sidebar navigation
    document.querySelectorAll('.sideBar-link').forEach(link => {
        link.addEventListener('click', handleSidebarNavigation);
    });

    // Logout
    const logoutLink = document.querySelector('.logout-link');
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }

    // Profile edit/save
    const editBtn = document.getElementById('editProfileBtn');
    const profileForm = document.getElementById('profileForm');

    if (editBtn) {
        editBtn.addEventListener('click', () => enableProfileEditing());
    }

    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleProfileSave();
        });
    }

    // Settings save
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
        settingsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveSettings();
        });
    }
}

function handleSidebarNavigation(e) {
    e.preventDefault();
    const targetSection = this.getAttribute('data-section');
    if (!targetSection) return;

    document.querySelectorAll('.sideBar-link').forEach(link => link.classList.remove('is-active'));
    document.querySelectorAll('.dashboard-section').forEach(section => section.classList.remove('is-active'));

    this.classList.add('is-active');
    const section = document.getElementById(targetSection);
    if (section) section.classList.add('is-active');
}

function enableProfileEditing() {
    const inputs = document.querySelectorAll(
        '#profileForm .form-input:not(#profileEmail):not(#profileRole):not(#profileStatus)'
    );
    inputs.forEach(input => { input.disabled = false; });
    document.getElementById('profilePicture').disabled = false;
    document.getElementById('editProfileBtn').disabled = true;
    document.getElementById('saveProfileBtn').disabled = false;
}

async function handleProfileSave() {
    // Build profile update payload
    const formData = {
        firstName: document.getElementById('profileFirstName').value,
        lastName: document.getElementById('profileLastName').value,
        phoneNumber: document.getElementById('profilePhone').value,
    };

    // Company / business name
    const companyInput = document.getElementById('companyName').value;
    if (currentUser.userType === 'seeker') {
        formData.companyName = companyInput;
    } else {
        formData.businessName = companyInput;
    }

    await updateProfile(formData);

    // Disable editing
    const inputs = document.querySelectorAll('#profileForm .form-input');
    inputs.forEach(input => { input.disabled = true; });
    document.getElementById('profilePicture').disabled = true;
    document.getElementById('editProfileBtn').disabled = false;
    document.getElementById('saveProfileBtn').disabled = true;
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

function getStatusClass(status) {
    const statusMap = {
        'Active': 'status-active',
        'Pending': 'status-pending',
        'Completed': 'status-completed',
        'Cancelled': 'status-cancelled',
        'Confirmed': 'status-active',
        'Rejected': 'status-cancelled',
        'Inactive': 'status-cancelled',
        'UnderReview': 'status-pending'
    };
    return statusMap[status] || 'status-default';
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
    });
}

function escapeHtml(text) {
    if (!text) return '';
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function showError(message) {
    alert('Error: ' + message);
}

function showSuccess(message) {
    alert('Success: ' + message);
}

// =============================================
// PROFILE PICTURE PREVIEW SETUP
// =============================================

function setupProfilePicturePreview() {
    const fileInput = document.getElementById('profilePicture');
    const previewWrapper = document.getElementById('profilePreviewWrapper');
    const previewImg = document.getElementById('profilePreviewImg');

    if (!fileInput || !previewWrapper || !previewImg) return;

    fileInput.addEventListener('change', function () {
        const file = this.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (e) {
            previewImg.src = e.target.result;
            previewWrapper.classList.add('has-image');
        };
        reader.readAsDataURL(file);
    });
}

// =============================================
// EXPORT FOR TESTING
// =============================================

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { checkAuthentication, loadProfile, loadHistory, loadStatistics, saveSettings };
}
