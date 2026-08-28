// ============================================================
// MQTT HANDLERS - BACKEND
// Menerima pesan dari ESP32 dan meneruskannya ke Socket.IO
// ============================================================

const { PUBLISH_TOPICS } = require('../config/mqttTopics');
const { log } = require('../utils/logger');
const socketManager = require('../websocket/socketManager');
const alertService = require('../services/alertService');
const telegramService = require('../services/telegramService');
const googleSheets = require('../services/googleSheets');

// ============================================================
// STATE TERBARU (Single Source of Truth)
// ============================================================
const latestState = {
    sensor: {},
    actuator: {},
    system: { mode: 'AUTO' },
    lastUpdate: null,
    online: false
};

// ============================================================
// HANDLE MQTT MESSAGE
// ============================================================
function handleMessage(topic, payload) {
    log('DEBUG', `📩 MQTT Message: ${topic}`, { payload });

    try {
        // ============================================================
        // 1. SENSOR DATA
        // ============================================================
        if (topic === PUBLISH_TOPICS.SENSOR) {
            const data = JSON.parse(payload);
            latestState.sensor = data;
            latestState.lastUpdate = Date.now();
            latestState.online = true;

            log('INFO', `📊 Sensor data received: temp=${data.temperature}, hum=${data.humidity}, lux=${data.lux}, soil=${data.soil_moisture}`);

            socketManager.broadcastSensorData(data);
            checkSensorAlerts(data);
            triggerGoogleLogging();
        }

        // ============================================================
        // 2. ACTUATOR STATUS (PENTING UNTUK UI)
        // ============================================================
        else if (topic === PUBLISH_TOPICS.ACTUATOR) {
            const data = JSON.parse(payload);

            // Validasi data actuator
            if (!data || typeof data !== 'object') {
                log('WARN', '⚠️ Invalid actuator data received:', { payload });
                return;
            }

            // Log detail actuator yang diterima
            log('INFO', `⚙️ Actuator data received: fan=${data.fan}, led=${data.led}, misting=${data.misting}, pump=${data.water_pump}`);

            // Update state
            latestState.actuator = data;
            latestState.lastUpdate = Date.now();
            latestState.online = true;

            // ===== BROADCAST KE SEMUA CLIENT VIA SOCKET.IO =====
            socketManager.broadcastActuatorData(data);
            log('INFO', '📤 Actuator data broadcasted to all clients');
        }

        // ============================================================
        // 3. SYSTEM STATUS
        // ============================================================
        else if (topic === PUBLISH_TOPICS.SYSTEM) {
            const data = JSON.parse(payload);
            latestState.system = data;
            latestState.lastUpdate = Date.now();
            latestState.online = true;

            log('INFO', `🖥️ System status: mode=${data.mode}, wifi=${data.wifi}, mqtt=${data.mqtt}`);

            socketManager.broadcastSystemStatus(data);
        }

        // ============================================================
        // 4. ALERT
        // ============================================================
        else if (topic === PUBLISH_TOPICS.ALERT) {
            const message = payload.toString();
            const level = message.includes('CRITICAL') || message.includes('FAIL') ? 'CRITICAL' : 'WARNING';

            log('WARN', `🔔 Alert received: [${level}] ${message}`);

            alertService.addAlert(level, message, 'esp32');
            socketManager.broadcastAlert(level, message);

            if (level === 'CRITICAL') {
                telegramService.sendAlert(level, message);
            }
        }

    } catch (error) {
        log('ERROR', `❌ Failed to process message from ${topic}`, {
            error: error.message,
            payload: payload
        });
    }
}

// ============================================================
// CHECK SENSOR ALERTS
// ============================================================
function checkSensorAlerts(data) {
    const { temperature, humidity, soil_moisture } = data;

    if (temperature !== undefined && (temperature > 35 || temperature < 15)) {
        alertService.addAlert('WARNING', `Suhu tidak normal: ${temperature}°C`, 'sensor');
    }
    if (humidity !== undefined && (humidity > 90 || humidity < 40)) {
        alertService.addAlert('WARNING', `Kelembapan tidak normal: ${humidity}%`, 'sensor');
    }
    if (soil_moisture !== undefined && soil_moisture < 20) {
        alertService.addAlert('CRITICAL', `Tanah sangat kering: ${soil_moisture}%`, 'sensor');
        telegramService.sendAlert('CRITICAL', `Tanah sangat kering: ${soil_moisture}%`);
    }
}

// ============================================================
// GOOGLE SHEETS LOGGING
// ============================================================
let lastLogTime = 0;
const LOG_INTERVAL = 15000; // 15 detik
let isLogging = false;

async function triggerGoogleLogging() {
    const now = Date.now();

    // Cek interval
    if (now - lastLogTime < LOG_INTERVAL) {
        return;
    }

    // Cegah overlapping
    if (isLogging) {
        return;
    }

    // Pastikan ada data sensor & actuator
    if (!latestState.sensor || !latestState.actuator) {
        return;
    }

    isLogging = true;
    try {
        const payload = {
            timestamp: new Date().toISOString(), // default
            ...latestState.sensor,
            ...latestState.actuator,
            mode: latestState.system.mode || 'AUTO'
        };

        // Jika ada timestamp dari ESP32, gunakan itu
        if (latestState.sensor.timestamp) {
            payload.timestamp = latestState.sensor.timestamp;
        }

        await googleSheets.logData(payload);
        lastLogTime = now;
        log('INFO', '📊 Google Sheets logging successful');
    } catch (error) {
        log('ERROR', '❌ Google Sheets logging error', { message: error.message });
    } finally {
        isLogging = false;
    }
}

// ============================================================
// GET LATEST STATE
// ============================================================
function getLatestState() {
    return latestState;
}

// ============================================================
// EXPORT
// ============================================================
module.exports = {
    handleMessage,
    getLatestState,
    latestState
};