// =============================================
// Si'aa – Register Page
// =============================================

const API_BASE_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
    setupAccountTypeToggle();
    setupFormSubmission();
});

// =============================================
// ACCOUNT TYPE TOGGLE (Seeker / Provider)
// =============================================

function setupAccountTypeToggle() {
    const toggleBtns = document.querySelectorAll('.auth-toggle-btn');
    const accountTypeInput = document.getElementById('accountType');

    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            toggleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (accountTypeInput) {
                accountTypeInput.value = btn.getAttribute('data-type') || 'seeker';
            }
        });
    });
}

// =============================================
// FORM SUBMISSION
// =============================================

function setupFormSubmission() {
    const form = document.querySelector('.auth-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleRegister(form);
    });
}

async function handleRegister(form) {
    clearErrors();

    const fullName = document.getElementById('fullName')?.value?.trim() || '';
    const email = document.getElementById('email')?.value?.trim() || '';
    const phone = document.getElementById('phone')?.value?.trim() || '';
    const dob = document.getElementById('dateOfBirth')?.value?.trim() || '';
    const nationalId = document.getElementById('nationalId')?.value?.trim() || '';
    const gender = form.querySelector('input[name="gender"]:checked')?.value || 'Male';
    const password = document.getElementById('password')?.value || '';
    const confirmPassword = document.getElementById('confirmPassword')?.value || '';
    const accountType = document.getElementById('accountType')?.value || 'seeker';
    const termsChecked = form.querySelector('input[name="terms"]')?.checked;

    // --- Validation ---
    if (!fullName) return showError('Please enter your full name.');
    if (!email || !email.includes('@')) return showError('Please enter a valid email address.');
    if (!phone) return showError('Please enter your phone number.');
    if (password.length < 8) return showError('Password must be at least 8 characters.');
    if (password !== confirmPassword) return showError('Passwords do not match.');
    if (!termsChecked) return showError("Please accept Si'aa's Terms & Privacy Policy.");

    // Split full name into first + last
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || nameParts[0];

    const payload = {
        firstName,
        lastName,
        email,
        phoneNumber: phone,
        dateOfBirth: dob || undefined,
        nationalId: nationalId || undefined,
        gender,
        password,
        userType: accountType,
        preferredLanguage: 'ar',
    };

    setSubmitState(true);

    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || data.message || 'Registration failed');
        }

        // Save token and user data if returned
        if (data.token) localStorage.setItem('siaaToken', data.token);
        if (data.user || data.seeker || data.provider) {
            const user = data.user || data.seeker || data.provider;
            localStorage.setItem('siaaUser', JSON.stringify(user));
        }

        showSuccess('Account created! Redirecting to dashboard...');
        setTimeout(() => { window.location.href = 'dashboard.html'; }, 1500);

    } catch (err) {
        console.error('Registration error:', err);
        showError(err.message || 'Something went wrong. Please try again.');
    } finally {
        setSubmitState(false);
    }
}

// =============================================
// HELPERS
// =============================================

function showError(message) {
    clearErrors();
    const form = document.querySelector('.auth-form');
    if (!form) return;

    const errEl = document.createElement('div');
    errEl.className = 'error-msg';
    errEl.id = 'registerError';
    errEl.style.cssText = `
        background: #fff5f5; border: 1px solid #feb2b2; color: #c53030;
        padding: 12px 16px; border-radius: 8px; font-size: 14px;
        margin-bottom: 12px; font-weight: 500;
    `;
    errEl.innerHTML = `<i class="fa-solid fa-circle-exclamation" style="margin-right:6px;"></i>${message}`;

    const submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) form.insertBefore(errEl, submitBtn);
    else form.appendChild(errEl);
}

function showSuccess(message) {
    clearErrors();
    const form = document.querySelector('.auth-form');
    if (!form) return;

    const el = document.createElement('div');
    el.id = 'registerError';
    el.style.cssText = `
        background: #f0fff4; border: 1px solid #9ae6b4; color: #276749;
        padding: 12px 16px; border-radius: 8px; font-size: 14px;
        margin-bottom: 12px; font-weight: 500;
    `;
    el.innerHTML = `<i class="fa-solid fa-check-circle" style="margin-right:6px;"></i>${message}`;

    const submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) form.insertBefore(el, submitBtn);
    else form.appendChild(el);
}

function clearErrors() {
    document.getElementById('registerError')?.remove();
}

function setSubmitState(loading) {
    const btn = document.querySelector('.auth-submit');
    if (!btn) return;
    btn.disabled = loading;
    btn.textContent = loading ? 'Creating account...' : 'Sign up';
}
