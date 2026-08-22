const { PUBLISH_TOPICS } = require('../config/mqttTopics');
const { log } = require('../utils/logger');
const socketManager = require('../websocket/socketManager');
const alertService = require('../services/alertService');
const telegramService = require('../services/telegramService');
const googleSheets = require('../services/googleSheets');

// State terbaru (single source of truth untuk multi-user)
const latestState = {
  sensor: {},
  actuator: {},
  system: { mode: 'AUTO' },
  lastUpdate: null,
  online: false
};

function handleMessage(topic, payload) {
  log('DEBUG', `MQTT Message: ${topic}`, { payload });

  try {
    // 1. Sensor Data: greenhouse/sensor/data
    if (topic === PUBLISH_TOPICS.SENSOR) {
      const data = JSON.parse(payload);
      latestState.sensor = data;
      latestState.lastUpdate = Date.now();
      latestState.online = true;
      
      socketManager.broadcastSensorData(data);
      checkSensorAlerts(data);
      triggerGoogleLogging();
    }
    
    // 2. Actuator Status: greenhouse/actuator/status
    else if (topic === PUBLISH_TOPICS.ACTUATOR) {
      const data = JSON.parse(payload);
      latestState.actuator = data;
      latestState.lastUpdate = Date.now();
      latestState.online = true;
      
      socketManager.broadcastActuatorData(data);
    }
    
    // 3. System Status: greenhouse/status/system
    else if (topic === PUBLISH_TOPICS.SYSTEM) {
      const data = JSON.parse(payload);
      latestState.system = data;
      latestState.lastUpdate = Date.now();
      latestState.online = true;
      
      socketManager.broadcastSystemStatus(data);
    }
    
    // 4. Alert: greenhouse/alert/abnormal
    else if (topic === PUBLISH_TOPICS.ALERT) {
      const message = payload.toString();
      const level = message.includes('CRITICAL') || message.includes('FAIL') ? 'CRITICAL' : 'WARNING';
      alertService.addAlert(level, message, 'esp32');
      socketManager.broadcastAlert(level, message);
      
      if (level === 'CRITICAL') {
        telegramService.sendAlert(level, message);
      }
    }
    
  } catch (error) {
    log('ERROR', `Gagal proses message dari ${topic}`, {
      error: error.message,
      payload: payload
    });
  }
}

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

// Di mqttHandlers.js
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
            timestamp: new Date().toISOString(), // default, akan di-override jika ada dari ESP32
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
    } catch (error) {
        log('ERROR', 'Trigger logging error', { message: error.message });
    } finally {
        isLogging = false;
    }
}

function getLatestState() {
  return latestState;
}

module.exports = {
  handleMessage,
  getLatestState,
  latestState // ekspor untuk keperluan tertentu
};