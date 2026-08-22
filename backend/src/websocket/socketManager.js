const { log } = require('../utils/logger');
const alertService = require('../services/alertService');

class SocketManager {
  constructor() {
    this.io = null;
    this.clients = new Set();
  }

  initialize(server) {
    const { Server } = require('socket.io');
    this.io = new Server(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      },
      pingTimeout: 60000,
      pingInterval: 25000
    });

    this.io.on('connection', (socket) => {
      this.clients.add(socket.id);
      log('INFO', `Client connected: ${socket.id} (Total: ${this.clients.size})`);

      // Kirim state terbaru ke client yang baru connect
      const mqttClient = require('../mqtt/mqttClient');
      const state = mqttClient.getLatestState();
      if (state.sensor && Object.keys(state.sensor).length > 0) {
        socket.emit('sensorData', state.sensor);
      }
      if (state.actuator && Object.keys(state.actuator).length > 0) {
        socket.emit('actuatorData', state.actuator);
      }
      if (state.system) {
        socket.emit('systemStatus', state.system);
      }
      socket.emit('mqttStatus', { connected: mqttClient.isConnected });

      // Kirim alert terbaru
      const recentAlerts = alertService.getAlerts(10);
      socket.emit('alerts', recentAlerts);

      socket.on('disconnect', () => {
        this.clients.delete(socket.id);
        log('INFO', `Client disconnected: ${socket.id} (Total: ${this.clients.size})`);
      });
    });

    return this.io;
  }

  // Broadcast ke SEMUA client (multi-user sync)
  broadcastSensorData(data) {
    if (this.io) {
      this.io.emit('sensorData', data);
    }
  }

  broadcastActuatorData(data) {
    if (this.io) {
      this.io.emit('actuatorData', data);
    }
  }

  broadcastSystemStatus(data) {
    if (this.io) {
      this.io.emit('systemStatus', data);
    }
  }

  broadcastAlert(level, message) {
    if (this.io) {
      this.io.emit('alert', { level, message, timestamp: new Date().toISOString() });
    }
  }

  broadcastMqttStatus(connected) {
    if (this.io) {
      this.io.emit('mqttStatus', { connected });
    }
  }

  getClientCount() {
    return this.clients.size;
  }
}

module.exports = new SocketManager();