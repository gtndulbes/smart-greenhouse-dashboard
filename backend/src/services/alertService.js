const { log } = require('../utils/logger');

class AlertService {
  constructor() {
    this.alerts = [];
    this.maxAlerts = 100;
    this.alertCooldown = {}; // debounce per jenis alert
  }

  addAlert(level, message, source = 'system') {
    const now = Date.now();
    const key = `${source}:${message}`;
    
    // Debounce: jangan kirim alert yang sama dalam 60 detik
    if (this.alertCooldown[key] && (now - this.alertCooldown[key] < 60000)) {
      return;
    }

    const alert = {
      id: Date.now() + Math.random().toString(36).substr(2, 4),
      timestamp: new Date().toISOString(),
      level: level, // 'INFO', 'WARNING', 'CRITICAL'
      source: source,
      message: message,
      acknowledged: false
    };

    this.alerts.unshift(alert);
    if (this.alerts.length > this.maxAlerts) {
      this.alerts.pop();
    }

    this.alertCooldown[key] = now;
    log('WARN', `[${level}] ${source}: ${message}`);
    
    return alert;
  }

  getAlerts(limit = 50) {
    return this.alerts.slice(0, limit);
  }

  acknowledgeAlert(id) {
    const alert = this.alerts.find(a => a.id === id);
    if (alert) {
      alert.acknowledged = true;
    }
  }

  clearAlerts() {
    this.alerts = [];
  }
}

module.exports = new AlertService();