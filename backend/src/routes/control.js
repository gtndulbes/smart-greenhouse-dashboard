const express = require('express');
const router = express.Router();
const mqttClient = require('../mqtt/mqttClient');
const { SUBSCRIBE_TOPICS } = require('../config/mqttTopics');
const { validateControl } = require('../middleware/validation');
const { log } = require('../utils/logger');

// POST /api/control
router.post('/', validateControl, (req, res) => {
  const { actuator, value, formattedValue, mqttTopic } = req.body;
  
  log('INFO', `Control command: ${actuator} = ${value}`);

  // Publish ke MQTT
  const published = mqttClient.publish(mqttTopic, formattedValue);

  if (published) {
    res.json({
      success: true,
      message: 'Command sent successfully',
      actuator: actuator,
      value: value,
      topic: mqttTopic,
      payload: formattedValue
    });
  } else {
    res.status(503).json({
      success: false,
      error: 'MQTT is not connected. Command not sent.'
    });
  }
});

module.exports = router;