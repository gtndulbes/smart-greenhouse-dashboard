// ============================================================
// DASHBOARD UI UPDATES
// ============================================================

// --- Chart Instance ---
let envChart = null;

function initChart() {
    const ctx = DOM.envChart?.getContext('2d');
    if (!ctx) return;
    envChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: AppState.chartData.labels,
            datasets: [
                { label: 'Temp °C', data: AppState.chartData.temp, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', fill: true, tension: 0.4, pointRadius: 1 },
                { label: 'Hum %', data: AppState.chartData.hum, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', fill: true, tension: 0.4, pointRadius: 1 },
                { label: 'Lux/100', data: AppState.chartData.lux, borderColor: '#eab308', backgroundColor: 'rgba(234,179,8,0.1)', fill: true, tension: 0.4, pointRadius: 1 },
                { label: 'Soil %', data: AppState.chartData.soil, borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.1)', fill: true, tension: 0.4, pointRadius: 1 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            scales: {
                x: { grid: { display: false }, ticks: { maxTicksLimit: 10, font: { size: 8 } } },
                y: { beginAtZero: true, max: 100, grid: { color: 'rgba(0,0,0,0.05)' } }
            },
            plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } }
        }
    });
    updateChartColors();
}

function updateChartColors() {
    if (!envChart) return;
    const isDark = document.documentElement.classList.contains('dark');
    envChart.options.scales.y.grid.color = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    envChart.update('none');
}

function updateChart(data) {
    if (!envChart) return;
    const now = new Date().toLocaleTimeString();
    AppState.chartData.labels.push(now);
    AppState.chartData.temp.push(data.temperature ?? 0);
    AppState.chartData.hum.push(data.humidity ?? 0);
    AppState.chartData.lux.push((data.lux ?? 0) / 100);
    AppState.chartData.soil.push(data.soil_moisture ?? 0);

    if (AppState.chartData.labels.length > AppState.maxChartPoints) {
        AppState.chartData.labels.shift();
        AppState.chartData.temp.shift();
        AppState.chartData.hum.shift();
        AppState.chartData.lux.shift();
        AppState.chartData.soil.shift();
    }

    envChart.data.labels = AppState.chartData.labels;
    envChart.data.datasets[0].data = AppState.chartData.temp;
    envChart.data.datasets[1].data = AppState.chartData.hum;
    envChart.data.datasets[2].data = AppState.chartData.lux;
    envChart.data.datasets[3].data = AppState.chartData.soil;
    envChart.update('none');
    if (DOM.chartUpdate) DOM.chartUpdate.textContent = `Updated: ${now}`;
}

function updateSensorUI(data) {
    if (data.temperature !== undefined) {
        DOM.tempValue.textContent = data.temperature.toFixed(1) + '°C';
        const t = data.temperature;
        const cls = (t > 35 || t < 15) ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
        DOM.tempStatus.textContent = (t > 35 || t < 15) ? '⚠️ Warning' : '✅ Normal';
        DOM.tempStatus.className = `text-xs px-2 py-0.5 rounded-full font-medium ${cls}`;
    }
    if (data.humidity !== undefined) {
        DOM.humValue.textContent = data.humidity.toFixed(1) + '%';
        const h = data.humidity;
        const cls = (h > 90 || h < 40) ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
        DOM.humStatus.textContent = (h > 90 || h < 40) ? '⚠️ Warning' : '✅ Normal';
        DOM.humStatus.className = `text-xs px-2 py-0.5 rounded-full font-medium ${cls}`;
    }
    if (data.lux !== undefined) {
        DOM.luxValue.textContent = data.lux.toFixed(0) + ' lux';
        const cls = data.lux < 1000 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
        DOM.luxStatus.textContent = data.lux < 1000 ? '⚠️ Low' : '✅ Normal';
        DOM.luxStatus.className = `text-xs px-2 py-0.5 rounded-full font-medium ${cls}`;
    }
    if (data.soil_moisture !== undefined) {
        DOM.soilValue.textContent = data.soil_moisture.toFixed(1) + '%';
        const s = data.soil_moisture;
        let cls, txt;
        if (s < 30) { cls = 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'; txt = '🚨 Critical'; }
        else if (s < 50) { cls = 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'; txt = '⚠️ Dry'; }
        else { cls = 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'; txt = '✅ Normal'; }
        DOM.soilStatus.textContent = txt;
        DOM.soilStatus.className = `text-xs px-2 py-0.5 rounded-full font-medium ${cls}`;
    }
    // Timestamp
    const ts = new Date().toLocaleTimeString();
    DOM.tempTimestamp.textContent = ts;
    DOM.humTimestamp.textContent = ts;
    DOM.luxTimestamp.textContent = ts;
    DOM.soilTimestamp.textContent = ts;
}

// ============================================================
// UPDATE ACTUATOR UI (Dashboard Cards)
// ============================================================
function updateActuatorUI(data) {
    // --- Update Quick Status (selalu) ---
    updateQuickStatus();

    // --- Update Card Misting di Dashboard (jika ada elemen) ---
    if (data.misting !== undefined) {
        const mistingElement = document.getElementById('mistingValue');
        const mistingStatusElement = document.getElementById('mistingStatus');
        if (mistingElement && mistingStatusElement) {
            const on = data.misting > 0;
            const mode = AppState.system.mode || 'AUTO';
            
            // Status ON/OFF
            mistingStatusElement.textContent = on ? 'ON' : 'OFF';
            mistingStatusElement.className = `badge ${on ? 'badge-on' : 'badge-off'}`;
            
            // Nilai persen
            let percentValue = 0;
            if (mode === 'AUTO' && data.misting_duty !== undefined) {
                percentValue = data.misting_duty;
            } else {
                percentValue = data.misting;
            }
            mistingElement.textContent = on ? 'ON (' + percentValue + '%)' : 'OFF (0%)';
        }
    }

    // --- Update Card Water Pump di Dashboard ---
    if (data.water_pump !== undefined) {
        const pumpElement = document.getElementById('pumpValue');
        const pumpStatusElement = document.getElementById('pumpStatus');
        if (pumpElement && pumpStatusElement) {
            const on = data.water_pump === 1 || data.water_pump === true;
            pumpElement.textContent = on ? 'ON' : 'OFF';
            pumpStatusElement.textContent = on ? 'ON' : 'OFF';
            pumpStatusElement.className = `badge ${on ? 'badge-on' : 'badge-off'}`;
        }
    }

    // --- Update Fan & LED jika ada elemen ---
    if (data.fan !== undefined) {
        const fanElement = document.getElementById('fanValue');
        if (fanElement) fanElement.textContent = data.fan + '%';
    }
    if (data.led !== undefined) {
        const ledElement = document.getElementById('ledValue');
        if (ledElement) ledElement.textContent = data.led + '%';
    }
}

function updateSystemUI(data) {
    if (data.mode) {
        DOM.modeBadge.textContent = data.mode;
        DOM.modeBadge.className = `text-xs px-2 py-1 rounded-full font-medium ${data.mode === 'AUTO' ? 'badge-auto' : 'badge-manual'}`;
    }
    updateQuickStatus();
}

// ============================================================
// QUICK STATUS (System Status Panel)
// ============================================================
function updateQuickStatus() {
    if (!DOM.quickStatus) return;
    const { system, actuator, sensor } = AppState;
    const mode = system.mode || 'AUTO';

    // Tentukan nilai misting yang ditampilkan
    let mistingDisplay = actuator.misting || 0;
    let mistingPercent = 0;
    if (mode === 'AUTO' && actuator.misting_duty !== undefined) {
        mistingPercent = actuator.misting_duty;
    } else {
        mistingPercent = actuator.misting || 0;
    }

    DOM.quickStatus.innerHTML = `
        <div class="flex justify-between"><span>Mode</span><span class="font-semibold">${mode}</span></div>
        <div class="flex justify-between"><span>Fan</span><span class="font-semibold">${actuator.fan || 0}%</span></div>
        <div class="flex justify-between"><span>LED</span><span class="font-semibold">${actuator.led || 0}%</span></div>
        <div class="flex justify-between"><span>Misting</span><span class="font-semibold">${mistingDisplay > 0 ? 'ON' : 'OFF'} (${mistingPercent}%)</span></div>
        <div class="flex justify-between"><span>Pump</span><span class="font-semibold">${actuator.water_pump ? 'ON' : 'OFF'}</span></div>
        <div class="flex justify-between"><span>Temp</span><span class="font-semibold">${sensor.temperature?.toFixed(1) || '--'}°C</span></div>
        <div class="flex justify-between"><span>Hum</span><span class="font-semibold">${sensor.humidity?.toFixed(1) || '--'}%</span></div>
        <div class="flex justify-between"><span>Soil</span><span class="font-semibold">${sensor.soil_moisture?.toFixed(1) || '--'}%</span></div>
    `;
}

function updateLastSeen() {
    if (!DOM.lastUpdateText) return;
    if (AppState.lastUpdate) {
        const diff = Math.floor((Date.now() - AppState.lastUpdate) / 1000);
        DOM.lastUpdateText.textContent = diff < 60 ? `${diff}s ago` : `${Math.floor(diff/60)}m ago`;
    } else {
        DOM.lastUpdateText.textContent = '-';
    }
}

function updateConnectionUI() {
    // Tidak perlu implementasi khusus, status sudah di-update melalui lastUpdateText
}

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    initChart();
    // Set default dates for history
    const now = new Date();
    const from = new Date(now);
    from.setDate(from.getDate() - 7);
    if (DOM.historyFrom) DOM.historyFrom.value = from.toISOString().split('T')[0];
    if (DOM.historyTo) DOM.historyTo.value = now.toISOString().split('T')[0];
});