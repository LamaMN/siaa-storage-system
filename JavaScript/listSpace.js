const stepPanels = Array.from(document.querySelectorAll('.step-panel'));
const stepPills = Array.from(document.querySelectorAll('.step-pill'));
const form = document.getElementById('listingForm');
const confirmationBox = document.getElementById('listingConfirmation');
const summaryBox = document.getElementById('listingSummaryBox');
const API_BASE_URL = 'http://localhost:3000/api';

// fill providerId from localStorage (after login)
document.addEventListener('DOMContentLoaded', () => {
    const userJson = localStorage.getItem('siaaUser');
    if (userJson) {
        try {
            const user = JSON.parse(userJson);
            if (user.userType === 'provider' || user.userType === 'provider'.toUpperCase()) {
                const providerIdInput = document.getElementById('providerId');
                if (providerIdInput) providerIdInput.value = user.id;
            }
        } catch (e) {
            console.warn('Cannot parse siaaUser from localStorage');
        }
    }

    // auto-calc area when length or width changes
    const lengthInput = document.getElementById('listingLength');
    const widthInput = document.getElementById('listingWidth');
    const areaInput = document.getElementById('listingArea');

    function updateArea() {
        const l = parseFloat(lengthInput.value);
        const w = parseFloat(widthInput.value);
        if (!isNaN(l) && !isNaN(w) && l > 0 && w > 0) {
            areaInput.value = (l * w).toFixed(2);
            const size = document.getElementById('listingSize');
            if (size && (!size.value || Number(size.value) === 0)) {
                size.value = (l * w).toFixed(2);
            }
        } else {
            areaInput.value = '';
        }
    }

    if (lengthInput && widthInput && areaInput) {
        lengthInput.addEventListener('input', updateArea);
        widthInput.addEventListener('input', updateArea);
    }

        // --- Toggle availability row based on access type ---
    const accessRadios = document.querySelectorAll('input[name="accessType"]');
    const availabilityRow = document.getElementById('availabilityRow');
    const availableFrom = document.getElementById('availableFrom');
    const availableTo = document.getElementById('availableTo');

    function updateAvailabilityVisibility() {
        const selected = document.querySelector('input[name="accessType"]:checked');
        const showTimes = selected && selected.value === 'business-hours';

        if (availabilityRow) {
            availabilityRow.style.display = showTimes ? 'grid' : 'none';
        }

        if (availableFrom && availableTo) {
            availableFrom.required = showTimes;
            availableTo.required = showTimes;

            // If not business hours, clear values
            if (!showTimes) {
                availableFrom.value = '';
                availableTo.value = '';
            }
        }
    }

    accessRadios.forEach(radio => {
        radio.addEventListener('change', updateAvailabilityVisibility);
    });

    // Run once on load in case something is preselected
    updateAvailabilityVisibility();

});

function goToStep(stepNumber) {
    stepPanels.forEach(panel => {
        panel.classList.toggle('is-active', Number(panel.dataset.step) === stepNumber);
    });

    stepPills.forEach(pill => {
        const n = Number(pill.dataset.step);
        pill.classList.toggle('is-active', n === stepNumber);
        pill.classList.toggle('is-completed', n < stepNumber);
    });

    if (confirmationBox) confirmationBox.style.display = 'none';
}

function showError(container, msg) {
    clearError(container);
    const p = document.createElement("p");
    p.classList.add("error-msg");
    p.textContent = msg;
    container.appendChild(p);
}

function clearError(container) {
    if (!container) return;
    const msg = container.querySelector(".error-msg");
    if (msg) msg.remove();
}

// STEP 1
function ValidateStepOne() {
    const title = document.getElementById('listingTitle');
    const neighborhood = document.getElementById('listingNeighborhood');
    const address = document.getElementById('listingAddress');
    const latitude = document.getElementById('latitude');
    const longitude = document.getElementById('longitude');
    const type = document.getElementById('listingType');
    const length = document.getElementById('listingLength');
    const width = document.getElementById('listingWidth');
    const height = document.getElementById('listingHeight');
    const desc = document.getElementById('listingDescription');

    const titleGroup = title.parentElement;
    const neighborhoodGroup = neighborhood.parentElement;
    const addressGroup = address.parentElement;
    const latGroup = latitude.parentElement;
    const lngGroup = longitude.parentElement;
    const typeGroup = type.parentElement;
    const lengthGroup = length.parentElement;
    const widthGroup = width.parentElement;
    const heightGroup = height.parentElement;
    const descGroup = desc.parentElement;

    [
        titleGroup,
        neighborhoodGroup,
        addressGroup,
        latGroup,
        lngGroup,
        typeGroup,
        lengthGroup,
        widthGroup,
        heightGroup,
        descGroup
    ].forEach(clearError);

    if (!title.value.trim()) {
        showError(titleGroup, "Please add a title.");
        return false;
    }
    if (!neighborhood.value) {
        showError(neighborhoodGroup, "Select the neighborhood.");
        return false;
    }
    if (!address.value.trim()) {
        showError(addressGroup, "Enter the full address.");
        return false;
    }

    const lat = parseFloat(latitude.value);
    const lng = parseFloat(longitude.value);
    if (isNaN(lat) || lat < -90 || lat > 90) {
        showError(latGroup, "Enter a valid latitude (-90 to 90).");
        return false;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
        showError(lngGroup, "Enter a valid longitude (-180 to 180).");
        return false;
    }

    if (!type.value) {
        showError(typeGroup, "Choose the space type.");
        return false;
    }

    const lengthVal = parseFloat(length.value);
    const widthVal = parseFloat(width.value);
    const heightVal = parseFloat(height.value);

    if (isNaN(lengthVal) || lengthVal <= 0) {
        showError(lengthGroup, "Enter a valid length in meters.");
        return false;
    }
    if (isNaN(widthVal) || widthVal <= 0) {
        showError(widthGroup, "Enter a valid width in meters.");
        return false;
    }
    if (isNaN(heightVal) || heightVal <= 0) {
        showError(heightGroup, "Enter a valid height in meters.");
        return false;
    }

    if (desc.value.trim().length < 10) {
        showError(descGroup, "Description must be at least 10 characters.");
        return false;
    }

    goToStep(2);
    return true;
}

// STEP 2
function ValidateStepTwo() {
    const photosInput = document.getElementById('listingPhotos');
    const photosGroup = photosInput.parentElement;

    clearError(photosGroup);

    const files = photosInput.files;
    const count = files ? files.length : 0;

    if (!files || count < 3) {
        showError(photosGroup, "Please upload at least 3 photos of your space.");
        return false;
    }
    if (count > 15) {
        showError(photosGroup, "You can upload a maximum of 15 photos.");
        return false;
    }

    goToStep(3);
    return true;
}

// STEP 3 
function ValidateStepThree() {
    const accessRadios = document.querySelectorAll('input[name="accessType"]');
    const pricePerMonth = document.getElementById('pricePerMonth');
    const pricePerDay = document.getElementById('pricePerDay');
    const pricePerWeek = document.getElementById('pricePerWeek');
    const availableFrom = document.getElementById('availableFrom');
    const availableTo = document.getElementById('availableTo');

    let accessGroup = null;
    if (accessRadios.length > 0) {
        accessGroup = accessRadios[0].closest('.form-group') || accessRadios[0].parentElement;
    }
    const monthGroup = pricePerMonth.parentElement;
    const fromGroup = availableFrom.parentElement;
    const toGroup = availableTo.parentElement;

    [accessGroup, monthGroup, fromGroup, toGroup].forEach(clearError);

    const accessSelected = document.querySelector('input[name="accessType"]:checked');
    if (!accessSelected) {
        showError(accessGroup, "Choose how people can access the space.");
        return false;
    }

    const isBusinessHours = accessSelected.value === 'business-hours';

    // Only validate times if "business-hours" is selected
    if (isBusinessHours) {
        if (!availableFrom.value) {
            showError(fromGroup, "Select the start time.");
            return false;
        }
        if (!availableTo.value) {
            showError(toGroup, "Select the end time.");
            return false;
        }

        if (availableFrom.value && availableTo.value && availableFrom.value >= availableTo.value) {
            showError(toGroup, "End time must be after start time.");
            return false;
        }
    }

    const mVal = parseFloat(pricePerMonth.value);
    if (isNaN(mVal) || mVal <= 0) {
        showError(monthGroup, "Enter a valid monthly price in SAR.");
        return false;
    }

    const dVal = pricePerDay.value ? parseFloat(pricePerDay.value) : null;
    const wVal = pricePerWeek.value ? parseFloat(pricePerWeek.value) : null;
    if (dVal !== null && (isNaN(dVal) || dVal < 0)) {
        showError(pricePerDay.parentElement, "Invalid daily price.");
        return false;
    }
    if (wVal !== null && (isNaN(wVal) || wVal < 0)) {
        showError(pricePerWeek.parentElement, "Invalid weekly price.");
        return false;
    }

    // prepare summary
    buildSummary();

    goToStep(4);
    return true;
}


// STEP 4
function ValidateStepFour() {
    const statusSelected = document.querySelector('input[name="listingStatus"]:checked');
    const firstStatus = document.querySelector('input[name="listingStatus"]');
    let statusGroup = null;

    if (firstStatus) {
        statusGroup = firstStatus.closest('.form-group') || firstStatus.parentElement;
    }

    clearError(statusGroup);

    if (!statusSelected) {
        showError(statusGroup, "Choose listing status.");
        return false;
    }

    return true;
}

// Build a simple text summary for step 4
function buildSummary() {
    if (!summaryBox) return;

    const title = document.getElementById('listingTitle').value.trim();
    const type = document.getElementById('listingType').value;
    const neighborhood = document.getElementById('listingNeighborhood').value;
    const pricePerMonth = document.getElementById('pricePerMonth').value;
    const accessType = document.querySelector('input[name="accessType"]:checked')?.value || '';
    const availableFrom = document.getElementById('availableFrom').value;
    const availableTo = document.getElementById('availableTo').value;

    summaryBox.innerHTML = `
        <h3 class="summary-title">${title || 'Your space'}</h3>
        <p class="summary-line"><strong>Type:</strong> ${type || '-'}</p>
        <p class="summary-line"><strong>Neighborhood:</strong> ${neighborhood || '-'}</p>
        <p class="summary-line"><strong>Monthly price:</strong> ${pricePerMonth || '-'} SAR</p>
        <p class="summary-line"><strong>Access:</strong> ${accessType || '-'} </p>
        <p class="step-note">When you click “List space”, we will save it in the system and link it to your provider account.</p>
    `;
}

// SUBMIT: call backend to create listing
form.addEventListener('submit', async function (e) {
    e.preventDefault();

    if (!ValidateStepFour()) return;

    const providerId = document.getElementById('providerId').value;
    if (!providerId) {
        alert("Provider information is missing. Please log in again as a provider.");
        return;
    }

    // Collect data for StorageSpace
    const lengthVal = parseFloat(document.getElementById('listingLength').value);
    const widthVal = parseFloat(document.getElementById('listingWidth').value);
    const heightVal = parseFloat(document.getElementById('listingHeight').value);
    const areaVal = document.getElementById('listingArea').value
        ? parseFloat(document.getElementById('listingArea').value)
        : (lengthVal * widthVal);

    const payload = {
        providerId: Number(providerId),
        title: document.getElementById('listingTitle').value.trim(),
        description: document.getElementById('listingDescription').value.trim(),
        neighborhood: document.getElementById('listingNeighborhood').value,
        address: document.getElementById('listingAddress').value.trim(),
        latitude: parseFloat(document.getElementById('latitude').value),
        longitude: parseFloat(document.getElementById('longitude').value),
        spaceType: document.getElementById('listingType').value,
        length: lengthVal,
        width: widthVal,
        height: heightVal,
        area: areaVal,
        pricePerDay: document.getElementById('pricePerDay').value
            ? parseFloat(document.getElementById('pricePerDay').value)
            : null,
        pricePerWeek: document.getElementById('pricePerWeek').value
            ? parseFloat(document.getElementById('pricePerWeek').value)
            : null,
        pricePerMonth: parseFloat(document.getElementById('pricePerMonth').value),
        accessType: document.querySelector('input[name="accessType"]:checked').value,
        availableFrom: document.getElementById('availableFrom').value,
        availableTo: document.getElementById('availableTo').value,
        accessNotes: document.getElementById('accessNotes').value.trim(),
        listingStatus: document.querySelector('input[name="listingStatus"]:checked').value,

        // SpaceFeatures flags
        features: {
            temperatureControlled: document.getElementById('featTemperature').checked,
            climateControlled: document.getElementById('featClimate').checked,
            humidityControlled: document.getElementById('featHumidity').checked,
            dryStorage: document.getElementById('featDry').checked,
            secureAccess: document.getElementById('featSecureAccess').checked,
            cctv: document.getElementById('featCCTV').checked,
            lighting: document.getElementById('featLighting').checked,
            // accessible24x7 derived from accessType
            accessible24x7: document.querySelector('input[name="accessType"]:checked').value === '24-7',
            prohibitedItems: document.getElementById('prohibitedItems').value.trim()
        }
    };

    try {
        const response = await fetch(`${API_BASE_URL}/spaces`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            console.error('Error creating listing:', data);
            alert(data.error || 'Failed to create listing. Please try again.');
            return;
        }

        if (confirmationBox) {
            confirmationBox.style.display = 'block';
        }
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });

        setTimeout(() => {
            window.location.href = 'dashboard.html'; 
            // or '../Dashboard/dashboard.html' depending on your folder structure
        }, 1500);

        console.log("Listing created:", data);

    } catch (err) {
        console.error('Network error creating listing:', err);
        alert('There was a problem communicating with the server.');
    }
});
