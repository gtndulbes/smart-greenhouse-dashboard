const { VALIDATORS, SUBSCRIBE_TOPICS, formatPumpPayload } = require('../config/mqttTopics');

const validateControl = (req, res, next) => {
  const { actuator, value } = req.body;

  if (!actuator) {
    return res.status(400).json({ error: 'Field "actuator" diperlukan' });
  }

  if (value === undefined || value === null) {
    return res.status(400).json({ error: 'Field "value" diperlukan' });
  }

  // Validasi actuator
  const validActuators = ['fan', 'led', 'misting', 'pump'];
  if (!validActuators.includes(actuator)) {
    return res.status(400).json({ 
      error: `Actuator harus salah satu dari: ${validActuators.join(', ')}` 
    });
  }

  // Validasi value berdasarkan tipe
  if (actuator === 'pump') {
    if (!VALIDATORS.pump(value)) {
      return res.status(400).json({ 
        error: 'Value pump harus 0, 1, ON, OFF, true, atau false' 
      });
    }
    // Format ulang untuk ESP32
    req.body.formattedValue = formatPumpPayload(value);
  } else {
    // PWM: fan, led, misting
    if (!VALIDATORS.pwm(value)) {
      return res.status(400).json({ 
        error: 'Value PWM harus antara 0-100' 
      });
    }
    req.body.formattedValue = String(parseInt(value));
  }

  // Map actuator ke MQTT topic
  const topicMap = {
    fan: SUBSCRIBE_TOPICS.FAN,
    led: SUBSCRIBE_TOPICS.LED,
    misting: SUBSCRIBE_TOPICS.MISTING,
    pump: SUBSCRIBE_TOPICS.PUMP
  };
  req.body.mqttTopic = topicMap[actuator];

  next();
};

const validateMode = (req, res, next) => {
  const { mode } = req.body;

  if (!mode) {
    return res.status(400).json({ error: 'Field "mode" diperlukan' });
  }

  if (!VALIDATORS.mode(mode)) {
    return res.status(400).json({ 
      error: 'Mode harus "AUTO" atau "MANUAL"' 
    });
  }

  req.body.formattedMode = mode;
  next();
};

module.exports = { validateControl, validateMode };