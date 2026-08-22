// ============================================================
// CONTROL PAGE LOGIC
// ============================================================

async function sendControl(actuator, value) {
    try {
        const res = await fetch('/api/control', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ actuator, value })
        });
        const result = await res.json();
        if (!result.success) {
            console.warn('Control rejected:', result.error);
            // Revert ke state terakhir dari MQTT
            updateControlUI(AppState.actuator);
        }
        return result;
    } catch (e) {
        console.error('Control error:', e);
    }
}

function updateControlUI(data) {
    if (data.fan !== undefined) {
        DOM.ctrlFanVal.textContent = data.fan + '%';
        DOM.ctrlFanSlider.value = data.fan;
    }
    if (data.led !== undefined) {
        DOM.ctrlLedVal.textContent = data.led + '%';
        DOM.ctrlLedSlider.value = data.led;
    }
    if (data.misting !== undefined) {
        DOM.ctrlMistVal.textContent = data.misting + '%';
        DOM.ctrlMistSlider.value = data.misting;
    }
    if (data.water_pump !== undefined) {
        const on = data.water_pump === 1 || data.water_pump === true;
        DOM.ctrlPumpVal.textContent = on ? 'ON' : 'OFF';
        DOM.ctrlPumpToggle.checked = on;
    }
    // Update mode display
    updateControlModeUI(AppState.system);
}

function updateControlModeUI(sys) {
    if (!sys || !sys.mode) return;
    const mode = sys.mode;
    DOM.ctrlModeDisplay.textContent = mode;
    DOM.ctrlModeHint.textContent = mode === 'AUTO' ? 'Kontrol otomatis aktif (Fuzzy Logic)' : 'Kontrol manual aktif';
    DOM.ctrlModeToggle.textContent = mode === 'AUTO' ? 'Switch to MANUAL' : 'Switch to AUTO';
    DOM.ctrlModeToggle.className = `mt-2 px-6 py-2 rounded-lg text-white transition ${mode === 'AUTO' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'}`;
}

// --- Event Listeners ---
DOM.ctrlFanSlider?.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    DOM.ctrlFanVal.textContent = val + '%';
    if (AppState.system.mode === 'MANUAL') sendControl('fan', val);
    else { DOM.ctrlFanSlider.value = AppState.actuator.fan || 0; DOM.ctrlFanVal.textContent = (AppState.actuator.fan || 0) + '%'; }
});

DOM.ctrlLedSlider?.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    DOM.ctrlLedVal.textContent = val + '%';
    if (AppState.system.mode === 'MANUAL') sendControl('led', val);
    else { DOM.ctrlLedSlider.value = AppState.actuator.led || 0; DOM.ctrlLedVal.textContent = (AppState.actuator.led || 0) + '%'; }
});

DOM.ctrlMistSlider?.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    DOM.ctrlMistVal.textContent = val + '%';
    if (AppState.system.mode === 'MANUAL') sendControl('misting', val);
    else { DOM.ctrlMistSlider.value = AppState.actuator.misting || 0; DOM.ctrlMistVal.textContent = (AppState.actuator.misting || 0) + '%'; }
});

DOM.ctrlPumpToggle?.addEventListener('change', (e) => {
    const on = e.target.checked;
    DOM.ctrlPumpVal.textContent = on ? 'ON' : 'OFF';
    if (AppState.system.mode === 'MANUAL') sendControl('pump', on ? 1 : 0);
    else { DOM.ctrlPumpToggle.checked = AppState.actuator.water_pump === 1; DOM.ctrlPumpVal.textContent = AppState.actuator.water_pump ? 'ON' : 'OFF'; }
});

DOM.ctrlModeToggle?.addEventListener('click', async () => {
    const current = AppState.system.mode || 'AUTO';
    const target = current === 'AUTO' ? 'MANUAL' : 'AUTO';
    if (target === 'MANUAL' && !confirm('Beralih ke MANUAL mode? Anda akan mengontrol aktuator secara manual.')) return;
    if (target === 'AUTO' && !confirm('Beralih ke AUTO mode? Fuzzy logic akan mengontrol secara otomatis.')) return;
    try {
        const res = await fetch('/api/mode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode: target })
        });
        const result = await res.json();
        if (!result.success) alert('Gagal mengubah mode: ' + (result.error || 'Unknown error'));
    } catch (e) {
        console.error('Mode change error:', e);
        alert('Error communicating with backend');
    }
});