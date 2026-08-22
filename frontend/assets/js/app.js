// ============================================================
// APP ROUTER & GLOBAL INIT
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

function navigateTo(page) {
    if (!pages.includes(page)) return;
    currentPage = page;
    
    // Hide all pages
    document.querySelectorAll('.page-content').forEach(el => el.classList.add('hidden'));
    const target = document.getElementById(`page-${page}`);
    if (target) target.classList.remove('hidden');
    
    // Update nav links
    document.querySelectorAll('.nav-link').forEach(el => {
        el.classList.toggle('active-nav', el.dataset.page === page);
    });
    
    // Update title
    if (DOM.pageTitle) DOM.pageTitle.textContent = pageTitles[page] || page;
    
    // Close sidebar on mobile
    closeSidebar();
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = DOM.sidebarOverlay;
    sidebar.classList.toggle('-translate-x-full');
    overlay.classList.toggle('active');
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = DOM.sidebarOverlay;
    if (!sidebar.classList.contains('-translate-x-full')) {
        sidebar.classList.add('-translate-x-full');
        overlay.classList.remove('active');
    }
}

// --- Dark Mode ---
let darkMode = localStorage.getItem('darkMode') === 'true';
function applyDarkMode() {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', darkMode);
    // Update chart colors if chart exists
    if (typeof updateChartColors === 'function') updateChartColors();
}
applyDarkMode();

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    // Nav links
    document.querySelectorAll('.nav-link').forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(el.dataset.page);
        });
    });
    
    // Menu toggle
    DOM.menuToggle?.addEventListener('click', toggleSidebar);
    DOM.sidebarOverlay?.addEventListener('click', closeSidebar);
    
    // Dark mode toggle
    DOM.darkModeToggle?.addEventListener('click', () => {
        darkMode = !darkMode;
        applyDarkMode();
    });
    
    // Default page
    navigateTo('dashboard');
    
    // Fetch initial system status
    fetch('/api/system/status')
        .then(r => r.json())
        .then(data => {
            if (data.system) updateSystemUI(data.system);
            if (data.mqtt) AppState.mqttConnected = data.mqtt.connected;
            if (data.clients) {
                AppState.clients = data.clients.connected || 0;
                if (DOM.sidebarClientCount) DOM.sidebarClientCount.textContent = `${AppState.clients} clients`;
            }
            updateConnectionUI();
            updateSettingsUI();
        })
        .catch(console.warn);
});

// Expose socket event overrides from socket.js to app.js
// We already handle them in socket.js
console.log('🌱 Smart Greenhouse App Loaded (Multi-User)');