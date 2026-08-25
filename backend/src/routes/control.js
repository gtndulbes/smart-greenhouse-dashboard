const express = require('express');
const router = express.Router();
const mqttClient = require('../mqtt/mqttClient');
const { SUBSCRIBE_TOPICS } = require('../config/mqttTopics');
const { validateControl } = require('../middleware/validation');
const { log } = require('../utils/logger');

// ============================================================
// POST /api/control
// Menerima command kontrol dari frontend dan publish ke MQTT
// ============================================================
router.post('/', validateControl, (req, res) => {
    const { actuator, value, formattedValue, mqttTopic } = req.body;

    // Log command yang diterima
    log('INFO', `📤 Control command: ${actuator} = ${value}`);

    // Validasi tambahan: pastikan actuator valid
    const validActuators = ['fan', 'led', 'misting', 'pump'];
    if (!validActuators.includes(actuator)) {
        return res.status(400).json({
            success: false,
            error: `Invalid actuator. Must be one of: ${validActuators.join(', ')}`
        });
    }

    // Pastikan formattedValue dan mqttTopic ada
    if (!formattedValue || !mqttTopic) {
        return res.status(400).json({
            success: false,
            error: 'Missing formattedValue or mqttTopic'
        });
    }

    // Publish ke MQTT
    const published = mqttClient.publish(mqttTopic, formattedValue);

    if (published) {
        log('INFO', `✅ Command published: ${mqttTopic} -> ${formattedValue}`);
        res.json({
            success: true,
            message: 'Command sent successfully',
            actuator: actuator,
            value: value,
            topic: mqttTopic,
            payload: formattedValue
        });
    } else {
        log('ERROR', `❌ Failed to publish command: ${actuator} = ${value}`);
        res.status(503).json({
            success: false,
            error: 'MQTT is not connected. Command not sent.'
        });
    }
});

// ============================================================
// GET /api/control/status (opsional, untuk cek status aktuator terakhir)
// ============================================================
router.get('/status', (req, res) => {
    const state = mqttClient.getLatestState();
    if (state && state.actuator) {
        res.json({
            success: true,
            actuator: state.actuator
        });
    } else {
        res.json({
            success: false,
            error: 'No actuator state available'
        });
    }
});

module.exports = router;