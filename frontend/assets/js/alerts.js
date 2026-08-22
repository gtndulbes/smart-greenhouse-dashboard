// ============================================================
// ALERTS PAGE
// ============================================================

function addAlert(level, message) {
    AppState.alerts.unshift({ level, message, timestamp: new Date().toISOString() });
    if (AppState.alerts.length > 100) AppState.alerts.pop();
    renderAlerts();
    renderAllAlerts();
    
    // Browser Notification
    if (Notification.permission === 'granted' && level === 'CRITICAL') {
        new Notification('🚨 Smart Greenhouse Alert', { body: message });
    }
}

function renderAlerts() {
    if (!DOM.alertContainer) return;
    const alerts = AppState.alerts.slice(0, 10);
    if (alerts.length === 0) {
        DOM.alertContainer.innerHTML = '<div class="text-sm text-slate-400 text-center py-2">No alerts</div>';
        return;
    }
    DOM.alertContainer.innerHTML = alerts.map(a => {
        const color = a.level === 'CRITICAL' ? 'text-red-600 dark:text-red-400' : 
                      a.level === 'WARNING' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400';
        return `<div class="text-sm ${color} flex items-center gap-2 py-0.5 border-b border-slate-100 dark:border-slate-700 last:border-0">
            <span class="text-xs">${new Date(a.timestamp).toLocaleTimeString()}</span>
            <span>${a.message}</span>
        </div>`;
    }).join('');
}

function renderAllAlerts() {
    if (!DOM.allAlertsContainer) return;
    if (AppState.alerts.length === 0) {
        DOM.allAlertsContainer.innerHTML = '<div class="text-sm text-slate-400 text-center py-4">No alerts recorded</div>';
        return;
    }
    DOM.allAlertsContainer.innerHTML = AppState.alerts.map(a => {
        const color = a.level === 'CRITICAL' ? 'text-red-600 dark:text-red-400' : 
                      a.level === 'WARNING' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400';
        return `<div class="text-sm ${color} flex items-center gap-3 py-1.5 border-b border-slate-100 dark:border-slate-700">
            <span class="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">${new Date(a.timestamp).toLocaleString()}</span>
            <span>${a.message}</span>
        </div>`;
    }).join('');
}

DOM.clearAlertsBtn?.addEventListener('click', () => {
    AppState.alerts = [];
    renderAlerts();
    renderAllAlerts();
});

// Saat menerima alert baru
socket.on('alert', (data) => {
    addAlert(data.level, data.message);
    // Simpan ke localStorage
    saveAlertsToLocal();
});

// Fungsi simpan ke localStorage
function saveAlertsToLocal() {
    try {
        localStorage.setItem('greenhouse_alerts', JSON.stringify(AppState.alerts));
    } catch (e) {
        console.warn('Gagal simpan alert ke localStorage:', e);
    }
}

// Fungsi muat dari localStorage (panggil saat halaman load)
function loadAlertsFromLocal() {
    try {
        const saved = localStorage.getItem('greenhouse_alerts');
        if (saved) {
            AppState.alerts = JSON.parse(saved);
            renderAllAlerts();
            renderAlerts();
        }
    } catch (e) {
        console.warn('Gagal muat alert dari localStorage:', e);
    }
}

// Panggil di awal app.js atau saat DOM ready
document.addEventListener('DOMContentLoaded', () => {
    loadAlertsFromLocal();
    // ... kode lain
});

// Browser Notification permission
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}