// ============================================================
// APP ROUTER, GLOBAL INIT, DARK MODE, NOTIFICATIONS, PWA
// ============================================================

// ============================================================
// PAGES CONFIG
// ============================================================
const pages = ['dashboard', 'monitoring', 'control', 'history', 'alerts', 'settings'];
const pageTitles = {
    dashboard: 'Dashboard',
    monitoring: 'Monitoring',
    control: 'Control Panel',
    history: 'History',
    alerts: 'Alerts',
    settings: 'Settings'
};

let currentPage = 'dashboard';

// ============================================================
// ROUTER: NAVIGATE TO PAGE
// ============================================================
function navigateTo(page) {
    if (!pages.includes(page)) return;
    currentPage = page;

    // Hide all pages
    document.querySelectorAll('.page-content').forEach(el => el.classList.add('hidden'));

    // Show target page
    const target = document.getElementById(`page-${page}`);
    if (target) target.classList.remove('hidden');

    // Update nav links
    document.querySelectorAll('.nav-link').forEach(el => {
        el.classList.toggle('active-nav', el.dataset.page === page);
    });

    // Update page title
    if (DOM.pageTitle) DOM.pageTitle.textContent = pageTitles[page] || page;

    // Close sidebar on mobile
    closeSidebar();
}

// ============================================================
// SIDEBAR
// ============================================================
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = DOM.sidebarOverlay;
    if (!sidebar) return;
    sidebar.classList.toggle('-translate-x-full');
    if (overlay) overlay.classList.toggle('active');
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = DOM.sidebarOverlay;
    if (!sidebar) return;
    if (!sidebar.classList.contains('-translate-x-full')) {
        sidebar.classList.add('-translate-x-full');
        if (overlay) overlay.classList.remove('active');
    }
}

// ============================================================
// DARK MODE (FULLY FIXED)
// ============================================================
let darkMode = localStorage.getItem('darkMode') === 'true';

function applyDarkMode() {
    const html = document.documentElement;
    if (darkMode) {
        html.classList.add('dark');
    } else {
        html.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode);

    // Update chart colors jika ada
    if (typeof updateChartColors === 'function') {
        updateChartColors();
    }

    // Update icon secara visual (fallback jika Tailwind tidak jalan)
    updateDarkModeIcon();
}

// Fallback: langsung ubah icon jika Tailwind dark: variant tidak bekerja
function updateDarkModeIcon() {
    const toggleBtn = document.getElementById('darkModeToggle');
    if (!toggleBtn) return;
    const moonIcon = toggleBtn.querySelector('.fa-moon');
    const sunIcon = toggleBtn.querySelector('.fa-sun');
    if (!moonIcon || !sunIcon) return;

    if (darkMode) {
        moonIcon.style.display = 'none';
        sunIcon.style.display = 'inline-block';
    } else {
        moonIcon.style.display = 'inline-block';
        sunIcon.style.display = 'none';
    }
}

// Apply dark mode awal
applyDarkMode();

// ============================================================
// DOM READY
// ============================================================
document.addEventListener('DOMContentLoaded', () => {

    // ============================================================
    // NAVIGATION LINKS
    // ============================================================
    document.querySelectorAll('.nav-link').forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(el.dataset.page);
        });
    });

    // ============================================================
    // SIDEBAR EVENTS
    // ============================================================
    DOM.menuToggle?.addEventListener('click', toggleSidebar);
    DOM.sidebarOverlay?.addEventListener('click', closeSidebar);

    // ============================================================
    // DARK MODE TOGGLE (DENGAN IKON BERUBAH)
    // ============================================================
    const darkToggle = document.getElementById('darkModeToggle');
    if (darkToggle) {
        darkToggle.addEventListener('click', () => {
            darkMode = !darkMode;
            applyDarkMode();
        });
    }

    // ============================================================
    // NOTIFICATION BELL → Navigasi ke Alerts
    // ============================================================
    const bell = document.getElementById('notificationBell');
    if (bell) {
        bell.addEventListener('click', () => {
            if (currentPage === 'alerts') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }
            navigateTo('alerts');

            // Efek highlight ring
            bell.classList.add('ring-2', 'ring-blue-400', 'ring-offset-2');
            setTimeout(() => {
                bell.classList.remove('ring-2', 'ring-blue-400', 'ring-offset-2');
            }, 1000);
        });
    }

    // ============================================================
    // DEFAULT PAGE
    // ============================================================
    navigateTo('dashboard');

    // ============================================================
    // FETCH INITIAL SYSTEM STATUS
    // ============================================================
    fetch('/api/system/status')
        .then(r => r.json())
        .then(data => {
            if (data.system && typeof updateSystemUI === 'function') {
                updateSystemUI(data.system);
            }
            if (data.mqtt) {
                AppState.mqttConnected = data.mqtt.connected;
            }
            if (data.clients) {
                AppState.clients = data.clients.connected || 0;
                if (DOM.sidebarClientCount) {
                    DOM.sidebarClientCount.textContent = `${AppState.clients} clients`;
                }
            }
            if (typeof updateConnectionUI === 'function') {
                updateConnectionUI();
            }
            if (typeof updateSettingsUI === 'function') {
                updateSettingsUI();
            }
        })
        .catch(err => console.warn('⚠️ Failed to fetch system status:', err));

    // ============================================================
    // REGISTER SERVICE WORKER (PWA)
    // ============================================================
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('✅ Service Worker registered with scope:', registration.scope);
            })
            .catch(error => {
                console.warn('❌ Service Worker registration failed:', error);
            });
    }

    // ============================================================
    // UPDATE DARK MODE ICON SETELAH DOM LOAD (JAGA-JAGA)
    // ============================================================
    setTimeout(() => {
        updateDarkModeIcon();
    }, 100);

    console.log('🌱 Smart Greenhouse App Loaded (Multi-User Ready)');
});

// ============================================================
// EXPOSE FUNCTION GLOBAL (untuk dipanggil dari file lain)
// ============================================================
window.navigateTo = navigateTo;
window.closeSidebar = closeSidebar;
window.toggleSidebar = toggleSidebar;
window.applyDarkMode = applyDarkMode;
window.updateDarkModeIcon = updateDarkModeIcon;