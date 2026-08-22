// ============================================================
// SOCKET.IO (Multi-User Real-time Sync)
// ============================================================
const socket = io();

socket.on('connect', () => {
    console.log('Socket connected');
    updateConnectionUI();
});

socket.on('sensorData', (data) => {
    Object.assign(AppState.sensor, data);
    AppState.lastUpdate = Date.now();
    updateSensorUI(data);
    updateChart(data);
    updateLastSeen();
    updateSettingsUI();
});

socket.on('actuatorData', (data) => {
    Object.assign(AppState.actuator, data);
    updateActuatorUI(data);
    updateControlUI(data);
    updateSettingsUI();
});

socket.on('systemStatus', (data) => {
    Object.assign(AppState.system, data);
    updateSystemUI(data);
    updateControlModeUI(data);
    updateSettingsUI();
});

socket.on('mqttStatus', (data) => {
    AppState.mqttConnected = data.connected;
    updateConnectionUI();
});

socket.on('alert', (data) => {
    addAlert(data.level, data.message);
});

socket.on('alerts', (alerts) => {
    AppState.alerts = alerts || [];
    renderAlerts();
});

socket.on('clients', (count) => {
    AppState.clients = count;
    if (DOM.sidebarClientCount) DOM.sidebarClientCount.textContent = `${count} clients`;
    if (DOM.setClients) DOM.setClients.textContent = count;
});

socket.on('disconnect', () => {
    console.warn('Socket disconnected');
    AppState.esp32Online = false;
    updateConnectionUI();
});

// Periodic ESP32 online check
setInterval(() => {
    const now = Date.now();
    const last = AppState.lastUpdate || 0;
    AppState.esp32Online = (now - last) < 30000;
    updateConnectionUI();
}, 10000);

// Last seen update
setInterval(updateLastSeen, 5000);