const express = require('express');
const router = express.Router();
const mqttClient = require('../mqtt/mqttClient');
const socketManager = require('../websocket/socketManager');
const { ESP32_TIMEOUT } = require('../config/constants');

// GET /api/system/status
router.get('/status', (req, res) => {
  const state = mqttClient.getLatestState();
  const now = Date.now();
  const lastUpdate = state.lastUpdate || 0;
  const online = (now - lastUpdate) < ESP32_TIMEOUT;

  res.json({
    esp32: {
      online: online,
      lastUpdate: state.lastUpdate ? new Date(state.lastUpdate).toISOString() : null,
      lastSeen: lastUpdate ? Math.floor((now - lastUpdate) / 1000) : null
    },
    mqtt: {
      connected: mqttClient.isConnected
    },
    system: state.system || { mode: 'AUTO' },
    clients: {
      connected: socketManager.getClientCount()
    }
  });
});

module.exports = router;