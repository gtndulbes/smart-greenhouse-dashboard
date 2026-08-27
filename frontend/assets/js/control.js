// ============================================================
// CONTROL PAGE LOGIC
// ============================================================

// ============================================================
// SEND CONTROL COMMAND
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
            console.warn('[Control] Rejected:', result.error);
            // Revert ke state terakhir dari MQTT
            updateControlUI(AppState.actuator);
        } else {
            console.log(`[Control] ✅ Sent: ${actuator} = ${value}`);
        }
        return result;
    } catch (e) {
        console.error('[Control] Error:', e);
        // Revert ke state terakhir
        updateControlUI(AppState.actuator);
    }
}

// ============================================================
// UPDATE UI DARI MQTT DATA
// ============================================================
function updateControlUI(data) {
    // Validasi data
    if (!data || typeof data !== 'object') {
        console.warn('[Control] Invalid data:', data);
        return;
    }

    console.log('[Control] Updating UI:', data);

    // --- Fan & LED (PWM) ---
    if (data.fan !== undefined) {
        DOM.ctrlFanVal.textContent = data.fan + '%';
        DOM.ctrlFanSlider.value = data.fan;
    }
    if (data.led !== undefined) {
        DOM.ctrlLedVal.textContent = data.led + '%';
        DOM.ctrlLedSlider.value = data.led;
    }

    // --- Misting (ON/OFF + Persen) ---
    if (data.misting !== undefined) {
        const val = data.misting;
        const on = val > 0;
        
        // Teks besar ON/OFF
        DOM.ctrlMistVal.textContent = on ? 'ON' : 'OFF';
        
        // Toggle checkbox
        if (DOM.ctrlMistToggle) DOM.ctrlMistToggle.checked = on;
        
        // ===== PERBAIKAN: Update persen output =====
        if (DOM.ctrlMistPercent) DOM.ctrlMistPercent.textContent = val + '%';
    }

    // --- Water Pump (ON/OFF) ---
    if (data.water_pump !== undefined) {
        const on = data.water_pump === 1 || data.water_pump === true;
        
        // Teks besar ON/OFF
        DOM.ctrlPumpVal.textContent = on ? 'ON' : 'OFF';
        
        // Toggle checkbox
        if (DOM.ctrlPumpToggle) DOM.ctrlPumpToggle.checked = on;
        
        // ===== PERBAIKAN: Update status di bawah =====
        if (DOM.ctrlPumpStatus) DOM.ctrlPumpStatus.textContent = on ? 'ON' : 'OFF';
    }

    // Update mode display
    updateControlModeUI(AppState.system);
}

// ============================================================
// UPDATE MODE DISPLAY
// ============================================================
function updateControlModeUI(sys) {
    if (!sys || !sys.mode) return;
    const mode = sys.mode;
    DOM.ctrlModeDisplay.textContent = mode;
    DOM.ctrlModeHint.textContent = mode === 'AUTO' 
        ? 'Kontrol otomatis aktif (Fuzzy Logic)' 
        : 'Kontrol manual aktif';
    DOM.ctrlModeToggle.textContent = mode === 'AUTO' 
        ? 'Switch to MANUAL' 
        : 'Switch to AUTO';
    DOM.ctrlModeToggle.className = `mt-2 px-6 py-2 rounded-lg text-white transition ${
        mode === 'AUTO' 
            ? 'bg-amber-600 hover:bg-amber-700' 
            : 'bg-emerald-600 hover:bg-emerald-700'
    }`;
}

// ============================================================
// GET MODE (helper)
// ============================================================
function getMode() {
    return AppState.system.mode || 'AUTO';
}

// ============================================================
// EVENT LISTENERS
// ============================================================

// ============================================================
// 1. FAN SLIDER
// ============================================================
DOM.ctrlFanSlider?.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    DOM.ctrlFanVal.textContent = val + '%';
    if (AppState.system.mode === 'MANUAL') {
        sendControl('fan', val);
    } else {
        // AUTO mode: revert ke nilai dari ESP32
        DOM.ctrlFanSlider.value = AppState.actuator.fan || 0;
        DOM.ctrlFanVal.textContent = (AppState.actuator.fan || 0) + '%';
    }
});

// ============================================================
// 2. LED SLIDER
// ============================================================
DOM.ctrlLedSlider?.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    DOM.ctrlLedVal.textContent = val + '%';
    if (AppState.system.mode === 'MANUAL') {
        sendControl('led', val);
    } else {
        DOM.ctrlLedSlider.value = AppState.actuator.led || 0;
        DOM.ctrlLedVal.textContent = (AppState.actuator.led || 0) + '%';
    }
});

// ============================================================
// 3. MISTING TOGGLE (Manual Control)
// ============================================================
DOM.ctrlMistToggle?.addEventListener('change', (e) => {
    const on = e.target.checked;
    const value = on ? 100 : 0;

    console.log(`[Misting] Toggle: ${on}, value: ${value}, mode: ${AppState.system.mode}`);

    // Optimistic update (UI langsung berubah)
    DOM.ctrlMistVal.textContent = on ? 'ON' : 'OFF';
    if (DOM.ctrlMistPercent) DOM.ctrlMistPercent.textContent = value + '%';

    if (AppState.system.mode === 'MANUAL') {
        sendControl('misting', value).then(result => {
            console.log('[Misting] Result:', result);
            if (!result || !result.success) {
                // Jika gagal, revert ke state MQTT
                updateControlUI(AppState.actuator);
            }
            // Jika berhasil, tunggu ESP32 kirim status balik via MQTT
            // Status akan update otomatis lewat socket.on('actuatorData')
        });
    } else {
        // AUTO mode: revert ke state ESP32
        const currentVal = AppState.actuator.misting || 0;
        const isOn = currentVal > 0;
        DOM.ctrlMistToggle.checked = isOn;
        DOM.ctrlMistVal.textContent = isOn ? 'ON' : 'OFF';
        if (DOM.ctrlMistPercent) DOM.ctrlMistPercent.textContent = currentVal + '%';
        alert('⚠️ Mode AUTO aktif! Switch ke MANUAL untuk kontrol manual.');
    }
});

// ============================================================
// 4. WATER PUMP TOGGLE (Manual Control)
// ============================================================
DOM.ctrlPumpToggle?.addEventListener('change', (e) => {
    const on = e.target.checked;
    const value = on ? 1 : 0;

    console.log(`[Pump] Toggle: ${on}, value: ${value}, mode: ${AppState.system.mode}`);

    // Optimistic update
    DOM.ctrlPumpVal.textContent = on ? 'ON' : 'OFF';
    if (DOM.ctrlPumpStatus) DOM.ctrlPumpStatus.textContent = on ? 'ON' : 'OFF';

    if (AppState.system.mode === 'MANUAL') {
        sendControl('pump', value).then(result => {
            console.log('[Pump] Result:', result);
            if (!result || !result.success) {
                updateControlUI(AppState.actuator);
            }
        });
    } else {
        // AUTO mode: revert
        const isOn = AppState.actuator.water_pump === 1;
        DOM.ctrlPumpToggle.checked = isOn;
        DOM.ctrlPumpVal.textContent = isOn ? 'ON' : 'OFF';
        if (DOM.ctrlPumpStatus) DOM.ctrlPumpStatus.textContent = isOn ? 'ON' : 'OFF';
        alert('⚠️ Mode AUTO aktif! Switch ke MANUAL untuk kontrol manual.');
    }
});

// ============================================================
// 5. MODE TOGGLE (AUTO / MANUAL)
// ============================================================
DOM.ctrlModeToggle?.addEventListener('click', async () => {
    const current = AppState.system.mode || 'AUTO';
    const target = current === 'AUTO' ? 'MANUAL' : 'AUTO';

    if (target === 'MANUAL' && !confirm('⚠️ Beralih ke MANUAL mode?\nAnda akan mengontrol aktuator secara manual.')) {
        return;
    }
    if (target === 'AUTO' && !confirm('🤖 Beralih ke AUTO mode?\nFuzzy logic akan mengontrol secara otomatis.')) {
        return;
    }

    try {
        const res = await fetch('/api/mode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode: target })
        });
        const result = await res.json();
        if (!result.success) {
            alert('❌ Gagal mengubah mode: ' + (result.error || 'Unknown error'));
        } else {
            console.log(`✅ Mode changed to: ${target}`);
            // Mode akan diupdate via MQTT system status
        }
    } catch (e) {
        console.error('Mode change error:', e);
        alert('❌ Error communicating with backend');
    }
});

// ============================================================
// 6. EXPOSE FUNGSI KE GLOBAL
// ============================================================
window.sendControl = sendControl;
window.updateControlUI = updateControlUI;
window.updateControlModeUI = updateControlModeUI;
window.getMode = getMode;

console.log('✅ Control.js loaded');