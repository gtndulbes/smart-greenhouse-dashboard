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
    // Dashboard
    tempValue: $('tempValue'), humValue: $('humValue'), luxValue: $('luxValue'), soilValue: $('soilValue'),
    tempStatus: $('tempStatus'), humStatus: $('humStatus'), luxStatus: $('luxStatus'), soilStatus: $('soilStatus'),
    tempTimestamp: $('tempTimestamp'), humTimestamp: $('humTimestamp'), luxTimestamp: $('luxTimestamp'), soilTimestamp: $('soilTimestamp'),
    modeBadge: $('modeBadge'), lastUpdateText: $('lastUpdateText'),
    alertContainer: $('alertContainer'), chartUpdate: $('chartUpdate'),
    envChart: $('envChart'), quickStatus: $('quickStatus'),
    // Control
    ctrlFanVal: $('ctrlFanVal'), ctrlLedVal: $('ctrlLedVal'), ctrlMistVal: $('ctrlMistVal'), ctrlPumpVal: $('ctrlPumpVal'),
    ctrlFanSlider: $('ctrlFanSlider'), ctrlLedSlider: $('ctrlLedSlider'), ctrlMistSlider: $('ctrlMistSlider'),
    ctrlPumpToggle: $('ctrlPumpToggle'), ctrlModeDisplay: $('ctrlModeDisplay'), ctrlModeHint: $('ctrlModeHint'), ctrlModeToggle: $('ctrlModeToggle'),
    // History
    historyFrom: $('historyFrom'), historyTo: $('historyTo'), historyLoadBtn: $('historyLoadBtn'), historyExportBtn: $('historyExportBtn'), historyTableBody: $('historyTableBody'),
    // Alerts
    allAlertsContainer: $('allAlertsContainer'), clearAlertsBtn: $('clearAlertsBtn'),
    // Settings
    setMode: $('setMode'), setBroker: $('setBroker'), setClient: $('setClient'), setLastUpdate: $('setLastUpdate'), setClients: $('setClients'),
    // System
    darkModeToggle: $('darkModeToggle'), menuToggle: $('menuToggle'), sidebarOverlay: $('sidebarOverlay'), sidebarClientCount: $('sidebarClientCount'),
    pageTitle: $('pageTitle')
};