// ============================================================
// STATE (Single Source of Truth)
// ============================================================
const AppState = {
    sensor: { temperature: null, humidity: null, lux: null, soil_moisture: null },
    actuator: { fan: 0, led: 0, misting: 0, water_pump: 0 },
    system: { wifi: false, mqtt: false, sht31: false, bh1750: false, soil: false, mode: 'AUTO' },
    mqttConnected: false,
    esp32Online: false,
    lastUpdate: null,
    alerts: [],
    chartData: { labels: [], temp: [], hum: [], lux: [], soil: [] },
    maxChartPoints: 100,
    historyData: [],
    clients: 0
};

// ============================================================
// DOM REFS (Agar konsisten)
// ============================================================
const $ = (id) => document.getElementById(id);

const DOM = {
    // ============================================================
    // DASHBOARD
    // ============================================================
    tempValue: $('tempValue'),
    humValue: $('humValue'),
    luxValue: $('luxValue'),
    soilValue: $('soilValue'),
    tempStatus: $('tempStatus'),
    humStatus: $('humStatus'),
    luxStatus: $('luxStatus'),
    soilStatus: $('soilStatus'),
    tempTimestamp: $('tempTimestamp'),
    humTimestamp: $('humTimestamp'),
    luxTimestamp: $('luxTimestamp'),
    soilTimestamp: $('soilTimestamp'),
    modeBadge: $('modeBadge'),
    lastUpdateText: $('lastUpdateText'),
    alertContainer: $('alertContainer'),
    chartUpdate: $('chartUpdate'),
    envChart: $('envChart'),
    quickStatus: $('quickStatus'),

    // ============================================================
    // CONTROL (semua elemen yang dibutuhkan)
    // ============================================================
    // Fan & LED (slider)
    ctrlFanVal: $('ctrlFanVal'),
    ctrlLedVal: $('ctrlLedVal'),
    ctrlFanSlider: $('ctrlFanSlider'),
    ctrlLedSlider: $('ctrlLedSlider'),

    // Misting (toggle + status + output persen)
    ctrlMistVal: $('ctrlMistVal'),
    ctrlMistToggle: $('ctrlMistToggle'),    // <-- DITAMBAHKAN
    ctrlMistPercent: $('ctrlMistPercent'),  // <-- DITAMBAHKAN

    // Water Pump (toggle + status)
    ctrlPumpVal: $('ctrlPumpVal'),
    ctrlPumpToggle: $('ctrlPumpToggle'),
    ctrlPumpStatus: $('ctrlPumpStatus'),    // <-- DITAMBAHKAN

    // Mode
    ctrlModeDisplay: $('ctrlModeDisplay'),
    ctrlModeHint: $('ctrlModeHint'),
    ctrlModeToggle: $('ctrlModeToggle'),

    // ============================================================
    // HISTORY
    // ============================================================
    historyFrom: $('historyFrom'),
    historyTo: $('historyTo'),
    historyLoadBtn: $('historyLoadBtn'),
    historyExportBtn: $('historyExportBtn'),
    historyTableBody: $('historyTableBody'),

    // ============================================================
    // ALERTS
    // ============================================================
    allAlertsContainer: $('allAlertsContainer'),
    clearAlertsBtn: $('clearAlertsBtn'),

    // ============================================================
    // SETTINGS
    // ============================================================
    setMode: $('setMode'),
    setBroker: $('setBroker'),
    setClient: $('setClient'),
    setLastUpdate: $('setLastUpdate'),
    setClients: $('setClients'),

    // ============================================================
    // SYSTEM
    // ============================================================
    darkModeToggle: $('darkModeToggle'),
    menuToggle: $('menuToggle'),
    sidebarOverlay: $('sidebarOverlay'),
    sidebarClientCount: $('sidebarClientCount'),
    pageTitle: $('pageTitle')
};

// ============================================================
// DEBUG: Cek elemen penting saat load
// ============================================================
console.log('[State] DOM elements loaded:');
console.log('  ctrlMistToggle:', DOM.ctrlMistToggle ? '✅ Found' : '❌ NOT FOUND');
console.log('  ctrlMistPercent:', DOM.ctrlMistPercent ? '✅ Found' : '❌ NOT FOUND');
console.log('  ctrlPumpToggle:', DOM.ctrlPumpToggle ? '✅ Found' : '❌ NOT FOUND');
console.log('  ctrlPumpStatus:', DOM.ctrlPumpStatus ? '✅ Found' : '❌ NOT FOUND');

console.log('✅ State.js loaded');