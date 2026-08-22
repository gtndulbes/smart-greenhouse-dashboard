// ============================================================
// SETTINGS PAGE
// ============================================================

function updateSettingsUI() {
    if (!DOM.setMode) return;
    DOM.setMode.textContent = AppState.system.mode || 'AUTO';
    DOM.setBroker.textContent = 'EMQX (local)'; // static
    DOM.setClient.textContent = 'ESP32C3_GH001'; // dari firmware
    DOM.setLastUpdate.textContent = AppState.lastUpdate ? new Date(AppState.lastUpdate).toLocaleString() : '-';
    DOM.setClients.textContent = AppState.clients || 0;
}

// Initialize settings on load
document.addEventListener('DOMContentLoaded', () => {
    updateSettingsUI();
});