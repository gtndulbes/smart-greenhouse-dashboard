const express = require('express');
const router = express.Router();
const mqttClient = require('../mqtt/mqttClient');
const { SUBSCRIBE_TOPICS } = require('../config/mqttTopics');
const { validateMode } = require('../middleware/validation');
const { log } = require('../utils/logger');

// POST /api/mode
router.post('/', validateMode, (req, res) => {
  const { mode, formattedMode } = req.body;
  
  log('INFO', `Mode change request: ${mode}`);

  const published = mqttClient.publish(SUBSCRIBE_TOPICS.MODE, formattedMode);

  if (published) {
    res.json({
      success: true,
      message: 'Mode change request sent',
      mode: mode
    });
  } else {
    res.status(503).json({
      success: false,
      error: 'MQTT is not connected. Mode change not sent.'
    });
  }
});

// GET /api/mode - dapatkan mode terbaru dari state
router.get('/', (req, res) => {
  const state = mqttClient.getLatestState();
  res.json({
    mode: state.system.mode || 'AUTO',
    source: 'mqtt'
  });
});

module.exports = router;