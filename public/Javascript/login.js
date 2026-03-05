// =============================================
// Si'aa – Login Page
// Auto-detects account type (tries seeker, then provider)
// =============================================

const API_BASE_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleLogin();
    });

    // Handle redirect param (e.g. from booking page)
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect');
    if (redirect) sessionStorage.setItem('loginRedirect', redirect);
});

async function handleLogin() {
    clearError();

    const email = document.getElementById('loginEmail')?.value?.trim() || '';
    const password = document.getElementById('loginPassword')?.value || '';

    if (!email || !email.includes('@')) return showError('Please enter a valid email address.');
    if (!password) return showError('Please enter your password.');

    setSubmitLoading(true);

    try {
        // Try seeker first, then provider automatically
        const result = await tryLogin(email, password, 'seeker')
            || await tryLogin(email, password, 'provider');

        if (!result) {
            throw new Error('Invalid email or password. Please check your credentials.');
        }

        // Save auth to localStorage
        localStorage.setItem('siaaToken', result.token);
        localStorage.setItem('siaaUser', JSON.stringify(result.user));

        // Redirect
        const redirect = sessionStorage.getItem('loginRedirect');
        sessionStorage.removeItem('loginRedirect');
        window.location.href = redirect || 'dashboard.html';

    } catch (err) {
        console.error('Login error:', err);
        showError(err.message || 'Login failed. Please try again.');
    } finally {
        setSubmitLoading(false);
    }
}

// Try login with a given userType. Returns result object on success, null on invalid credentials.
async function tryLogin(email, password, userType) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, userType }),
        });

        if (response.status === 401) return null; // wrong credentials for this type
        if (response.status === 404) return null; // user not found
        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            // 422 means schema validation – likely wrong type, skip silently
            if (response.status === 422) return null;
            throw new Error(data.error || data.message || 'Login failed');
        }

        const data = await response.json();
        return data;
    } catch (err) {
        // Network error or unexpected – re-throw
        if (err.message && !err.message.includes('Login failed')) throw err;
        return null;
    }
}

// ─── Helpers ──────────────────────────────────

function showError(message) {
    clearError();
    const form = document.querySelector('form');
    if (!form) return;

    const el = document.createElement('div');
    el.id = 'loginError';
    el.style.cssText = `
        background:#fff5f5;border:1px solid #feb2b2;color:#c53030;
        padding:11px 15px;border-radius:8px;font-size:14px;
        margin-bottom:12px;font-weight:500;
    `;
    el.innerHTML = `<i class="fa-solid fa-circle-exclamation" style="margin-right:6px;"></i>${message}`;

    const submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) form.insertBefore(el, submitBtn);
    else form.appendChild(el);
}

function clearError() {
    document.getElementById('loginError')?.remove();
}

function setSubmitLoading(loading) {
    const btn = document.querySelector('.auth-submit');
    if (!btn) return;
    btn.disabled = loading;
    btn.textContent = loading ? 'Signing in...' : 'Log in';
}
