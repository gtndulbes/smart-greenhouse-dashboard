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
    // Fan & LED (PWM, tetap slider)
    if (data.fan !== undefined) {
        DOM.ctrlFanVal.textContent = data.fan + '%';
        DOM.ctrlFanSlider.value = data.fan;
    }
    if (data.led !== undefined) {
        DOM.ctrlLedVal.textContent = data.led + '%';
        DOM.ctrlLedSlider.value = data.led;
    }

    // Misting (ON/OFF + Persen)
    if (data.misting !== undefined) {
        const val = data.misting;
        const on = val > 0;
        DOM.ctrlMistVal.textContent = on ? 'ON' : 'OFF';
        DOM.ctrlMistToggle.checked = on;
        DOM.ctrlMistPercent.textContent = val + '%';
    }

    // Water Pump (ON/OFF)
    if (data.water_pump !== undefined) {
        const on = data.water_pump === 1 || data.water_pump === true;
        DOM.ctrlPumpVal.textContent = on ? 'ON' : 'OFF';
        DOM.ctrlPumpToggle.checked = on;
    }

    updateControlModeUI(AppState.system);
}

// ============================================================
// EVENT LISTENERS
// ============================================================

// Fan & LED (slider) – tetap sama
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

// Misting Toggle (ON/OFF)
DOM.ctrlMistToggle?.addEventListener('change', (e) => {
    const on = e.target.checked;
    const value = on ? 100 : 0;
    DOM.ctrlMistVal.textContent = on ? 'ON' : 'OFF';
    DOM.ctrlMistPercent.textContent = value + '%';
    if (AppState.system.mode === 'MANUAL') {
        sendControl('misting', value);
    } else {
        // Jika AUTO, toggle tidak aktif (kecuali override)
        DOM.ctrlMistToggle.checked = AppState.actuator.misting > 0;
        DOM.ctrlMistVal.textContent = AppState.actuator.misting > 0 ? 'ON' : 'OFF';
        DOM.ctrlMistPercent.textContent = (AppState.actuator.misting || 0) + '%';
        alert('Mode AUTO aktif, kontrol manual tidak tersedia.');
    }
});

// Water Pump Toggle
DOM.ctrlPumpToggle?.addEventListener('change', (e) => {
    const on = e.target.checked;
    DOM.ctrlPumpVal.textContent = on ? 'ON' : 'OFF';
    if (AppState.system.mode === 'MANUAL') sendControl('pump', on ? 1 : 0);
    else { DOM.ctrlPumpToggle.checked = AppState.actuator.water_pump === 1; DOM.ctrlPumpVal.textContent = AppState.actuator.water_pump ? 'ON' : 'OFF'; }
});

// --- Mode Toggle ---
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