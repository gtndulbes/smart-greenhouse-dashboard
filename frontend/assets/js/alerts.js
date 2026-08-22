// ============================================================
// ALERTS PAGE + NOTIFICATION (Lengkap)
// ============================================================

// ============================================================
// KONFIGURASI
// ============================================================
const NOTIFICATION_COOLDOWN = 60000; // 60 detik antara notifikasi yang sama
const ENABLE_WARNING_NOTIFICATIONS = true;
const ENABLE_SOUND = true;
const ENABLE_VIBRATION = true;

// ============================================================
// STATE
// ============================================================
let notificationCooldowns = {};
let audioContext = null;
let totalAlerts = 0;

// ============================================================
// FUNGSI UTAMA: addAlert (SUDAH LENGKAP)
// ============================================================
function addAlert(level, message) {
    // --- Kode Lama (tetap) ---
    AppState.alerts.unshift({ level, message, timestamp: new Date().toISOString() });
    if (AppState.alerts.length > 100) AppState.alerts.pop();
    totalAlerts++;
    
    renderAlerts();
    renderAllAlerts();
    updateBadgeCounter();
    
    triggerNotification(level, message);
    
    saveAlertsToLocal();
    
    // --- Tambahan Baru: Update Badge di Header ---
    updateNotificationBadge();
    
    // --- Tambahan Baru: Animasi Badge ---
    const badge = document.getElementById('notificationBadge');
    if (badge) {
        badge.classList.remove('badge-pulse');
        void badge.offsetWidth;
        badge.classList.add('badge-pulse');
    }
}

// ============================================================
// NOTIFIKASI (PUSH, SUARA, GETAR)
// ============================================================
function triggerNotification(level, message) {
    const now = Date.now();
    const key = `${level}:${message}`;
    
    if (notificationCooldowns[key] && (now - notificationCooldowns[key] < NOTIFICATION_COOLDOWN)) {
        return;
    }
    notificationCooldowns[key] = now;
    
    // Browser Notification
    if (Notification.permission === 'granted') {
        if (level === 'CRITICAL' || (level === 'WARNING' && ENABLE_WARNING_NOTIFICATIONS)) {
            const icon = level === 'CRITICAL' ? '🚨' : '⚠️';
            const notif = new Notification(`${icon} Smart Greenhouse Alert`, {
                body: message,
                icon: '/favicon.ico',
                tag: key,
                requireInteraction: true,
                silent: false,
                vibrate: [200, 100, 200]
            });
            notif.onclick = function() {
                window.focus();
                this.close();
            };
            setTimeout(() => notif.close(), 10000);
        }
    }
    
    // Audio Alert
    if (ENABLE_SOUND && level === 'CRITICAL') {
        playAlertSound();
    }
    
    // Vibration
    if (ENABLE_VIBRATION && navigator.vibrate && level === 'CRITICAL') {
        navigator.vibrate([200, 100, 200, 100, 400]);
    }
}

// ============================================================
// AUDIO ALERT (BIP SEDERHANA)
// ============================================================
function playAlertSound() {
    try {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.frequency.value = 800;
        osc.type = 'sine';
        gain.gain.value = 0.3;
        osc.start();
        osc.stop(audioContext.currentTime + 0.3);
        
        setTimeout(() => {
            const osc2 = audioContext.createOscillator();
            const gain2 = audioContext.createGain();
            osc2.connect(gain2);
            gain2.connect(audioContext.destination);
            osc2.frequency.value = 1000;
            osc2.type = 'sine';
            gain2.gain.value = 0.3;
            osc2.start();
            osc2.stop(audioContext.currentTime + 0.3);
        }, 400);
    } catch(e) {
        console.debug('Audio alert tidak support:', e.message);
    }
}

// ============================================================
// BADGE COUNTER (Di Header & Tab)
// ============================================================
function updateNotificationBadge() {
    const badge = document.getElementById('notificationBadge');
    if (!badge) return;
    
    const critical = AppState.alerts.filter(a => a.level === 'CRITICAL').length;
    const warning = AppState.alerts.filter(a => a.level === 'WARNING').length;
    const total = critical + warning;
    
    if (total > 0) {
        badge.textContent = total > 99 ? '99+' : total;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

function updateBadgeCounter() {
    const count = AppState.alerts.filter(a => a.level === 'CRITICAL' || a.level === 'WARNING').length;
    const title = document.querySelector('title');
    if (title) {
        if (count > 0) {
            title.textContent = `🔔 (${count}) Smart Greenhouse`;
        } else {
            title.textContent = '🌱 Smart Greenhouse';
        }
    }
}

// ============================================================
// RENDER UI
// ============================================================
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

// ============================================================
// LOCAL STORAGE
// ============================================================
function saveAlertsToLocal() {
    try {
        localStorage.setItem('greenhouse_alerts', JSON.stringify(AppState.alerts));
        localStorage.setItem('greenhouse_alert_count', String(totalAlerts));
    } catch (e) {
        console.warn('Gagal simpan alert ke localStorage:', e);
    }
}

function loadAlertsFromLocal() {
    try {
        const saved = localStorage.getItem('greenhouse_alerts');
        if (saved) {
            AppState.alerts = JSON.parse(saved);
            totalAlerts = parseInt(localStorage.getItem('greenhouse_alert_count')) || AppState.alerts.length;
            renderAllAlerts();
            renderAlerts();
            updateBadgeCounter();
            updateNotificationBadge();
        }
    } catch (e) {
        console.warn('Gagal muat alert dari localStorage:', e);
    }
}

// ============================================================
// CLEAR ALERTS
// ============================================================
DOM.clearAlertsBtn?.addEventListener('click', () => {
    AppState.alerts = [];
    totalAlerts = 0;
    renderAlerts();
    renderAllAlerts();
    updateBadgeCounter();
    updateNotificationBadge();
    localStorage.removeItem('greenhouse_alerts');
    localStorage.removeItem('greenhouse_alert_count');
});

// ============================================================
// SOCKET.IO EVENT
// ============================================================
socket.on('alert', (data) => {
    addAlert(data.level, data.message);
});

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
    loadAlertsFromLocal();
    
    setInterval(() => {
        updateBadgeCounter();
        updateNotificationBadge();
    }, 5000);
});

// ============================================================
// EXPOSE
// ============================================================
window.addAlert = addAlert;
window.renderAlerts = renderAlerts;
window.renderAllAlerts = renderAllAlerts;
window.updateNotificationBadge = updateNotificationBadge;