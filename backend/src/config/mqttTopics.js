// ============================================================
// MQTT CONTRACT - WAJIB SESUAI DENGAN FIRMWARE
// SUMBER: mqtt_manager.cpp, SmartGreenhouse.ino
// ============================================================

// Topics yang dipublish oleh ESP32 (ESP32 → Backend)
const PUBLISH_TOPICS = {
  SENSOR: 'greenhouse/sensor/data',
  ACTUATOR: 'greenhouse/actuator/status',
  SYSTEM: 'greenhouse/status/system',
  ALERT: 'greenhouse/alert/abnormal'
};

// Topics yang disubscribe oleh ESP32 (Backend → ESP32)
const SUBSCRIBE_TOPICS = {
  MODE: 'greenhouse/control/mode',
  FAN: 'greenhouse/control/fan',
  LED: 'greenhouse/control/led',
  MISTING: 'greenhouse/control/misting',
  PUMP: 'greenhouse/control/pump'
};

// Validasi payload command
const VALIDATORS = {
  mode: (val) => ['AUTO', 'MANUAL'].includes(val),
  pwm: (val) => {
    const num = parseInt(val);
    return !isNaN(num) && num >= 0 && num <= 100;
  },
  pump: (val) => {
    const str = String(val).toUpperCase();
    return ['1', '0', 'ON', 'OFF', 'TRUE', 'FALSE'].includes(str);
  }
};

// Konversi payload pump ke format yang dimengerti ESP32
const formatPumpPayload = (val) => {
  const str = String(val).toUpperCase();
  if (['1', 'ON', 'TRUE'].includes(str)) return '1';
  return '0';
};

module.exports = {
  PUBLISH_TOPICS,
  SUBSCRIBE_TOPICS,
  VALIDATORS,
  formatPumpPayload
};