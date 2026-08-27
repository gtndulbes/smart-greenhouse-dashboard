// ============================================================
// SOCKET.IO (Multi-User Real-time Sync)
// ============================================================

const socket = io();

// ============================================================
// EVENT: CONNECT
// ============================================================
socket.on('connect', () => {
    console.log('✅ [Socket] Connected');
    updateConnectionUI();
});

// ============================================================
// EVENT: SENSOR DATA
// ============================================================
socket.on('sensorData', (data) => {
    console.log('[Socket] 📊 Sensor data received:', data);
    Object.assign(AppState.sensor, data);
    AppState.lastUpdate = Date.now();
    
    updateSensorUI(data);
    updateChart(data);
    updateLastSeen();
    updateSettingsUI();
});

// ============================================================
// EVENT: ACTUATOR DATA (PENTING UNTUK MISTING & PUMP)
// ============================================================
socket.on('actuatorData', (data) => {
    console.log('[Socket] ⚙️ Actuator data received:', data);
    
    // Validasi data
    if (!data || typeof data !== 'object') {
        console.warn('[Socket] Invalid actuator data:', data);
        return;
    }
    
    // Update state
    Object.assign(AppState.actuator, data);
    
    // ===== UPDATE UI DI SEMUA HALAMAN =====
    // 1. Dashboard (card status)
    if (typeof updateActuatorUI === 'function') {
        updateActuatorUI(data);
    }
    
    // 2. Control page (toggle, status, persen)
    if (typeof updateControlUI === 'function') {
        updateControlUI(data);
    }
    
    // 3. Settings (jika perlu)
    if (typeof updateSettingsUI === 'function') {
        updateSettingsUI();
    }
});

// ============================================================
// EVENT: SYSTEM STATUS
// ============================================================
socket.on('systemStatus', (data) => {
    console.log('[Socket] 🖥️ System status received:', data);
    Object.assign(AppState.system, data);
    
    updateSystemUI(data);
    updateControlModeUI(data);
    updateSettingsUI();
});

// ============================================================
// EVENT: MQTT STATUS
// ============================================================
socket.on('mqttStatus', (data) => {
    console.log('[Socket] 🔌 MQTT status:', data);
    AppState.mqttConnected = data.connected;
    updateConnectionUI();
});

// ============================================================
// EVENT: ALERT
// ============================================================
socket.on('alert', (data) => {
    console.log('[Socket] 🔔 Alert received:', data);
    if (typeof addAlert === 'function') {
        addAlert(data.level, data.message);
    }
});

// ============================================================
// EVENT: ALERTS HISTORY
// ============================================================
socket.on('alerts', (alerts) => {
    console.log('[Socket] 📋 Alerts history:', alerts?.length || 0);
    AppState.alerts = alerts || [];
    if (typeof renderAlerts === 'function') {
        renderAlerts();
    }
});

// ============================================================
// EVENT: CLIENTS COUNT
// ============================================================
socket.on('clients', (count) => {
    console.log('[Socket] 👥 Clients connected:', count);
    AppState.clients = count || 0;
    if (DOM.sidebarClientCount) {
        DOM.sidebarClientCount.textContent = `${count || 0} clients`;
    }
    if (DOM.setClients) {
        DOM.setClients.textContent = count || 0;
    }
});

// ============================================================
// EVENT: DISCONNECT
// ============================================================
socket.on('disconnect', () => {
    console.warn('⚠️ [Socket] Disconnected');
    AppState.esp32Online = false;
    updateConnectionUI();
});

// ============================================================
// PERIODIC CHECKS
// ============================================================

// --- ESP32 Online Status (setiap 10 detik) ---
setInterval(() => {
    const now = Date.now();
    const last = AppState.lastUpdate || 0;
    AppState.esp32Online = (now - last) < 30000;
    updateConnectionUI();
}, 10000);

// --- Last Seen Update (setiap 5 detik) ---
setInterval(() => {
    if (typeof updateLastSeen === 'function') {
        updateLastSeen();
    }
}, 5000);

// ============================================================
// EXPOSE FUNCTIONS (jika diperlukan)
// ============================================================
console.log('✅ [Socket] Socket.IO client ready');