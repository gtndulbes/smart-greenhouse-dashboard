// Semua konstanta diambil dari config.h dan secrets.h firmware

module.exports = {
  // Timing intervals (dari config.h)
  SENSOR_INTERVAL: 2000,
  CONTROL_INTERVAL: 2000,
  MQTT_INTERVAL: 5000,
  LOGGING_INTERVAL: 30000,
  STATUS_INTERVAL: 60000,

  // Safety (dari config.h)
  MAX_MISTING_RUNTIME: 30000,
  MAX_PUMP_RUNTIME: 60000,
  MISTING_COOLDOWN: 60000,

  // Soil thresholds (dari config.h)
  SOIL_PUMP_ON: 55.0,
  SOIL_PUMP_OFF: 65.0,

  // ESP32 offline detection
  ESP32_TIMEOUT: parseInt(process.env.ESP32_TIMEOUT) || 30000,

  // Default mode
  DEFAULT_MODE: 'AUTO'
};