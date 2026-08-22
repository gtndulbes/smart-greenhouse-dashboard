const mqtt = require('mqtt');
const { PUBLISH_TOPICS } = require('../config/mqttTopics');
const { log } = require('../utils/logger');
const { handleMessage, getLatestState } = require('./mqttHandlers');
const socketManager = require('../websocket/socketManager');
const fs = require('fs');
const path = require('path');

class MQTTClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
  }

    connect() {
    const options = {
        clientId: process.env.MQTT_CLIENT_ID || 'backend_gh_dashboard',
        username: process.env.MQTT_USERNAME,
        password: process.env.MQTT_PASSWORD,
        reconnectPeriod: 5000,
        connectTimeout: 10000,
        keepalive: 60,
        rejectUnauthorized: false,   // <-- SKIP validasi sertifikat (untuk testing)
        protocol: 'mqtts'            // <-- PASTIKAN mqtts
    };

    const brokerUrl = `mqtts://${process.env.MQTT_BROKER}:${process.env.MQTT_PORT}`;
    log('INFO', `Menghubungkan ke MQTT Broker: ${brokerUrl}`);
    
    this.client = mqtt.connect(brokerUrl, options);
    
    this.client.on('connect', () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        log('INFO', '✅ MQTT Connected');
        this.subscribe();
        socketManager.broadcastMqttStatus(true);
    });

    this.client.on('close', () => {
        this.isConnected = false;
        this.reconnectAttempts = 0;
        log('INFO', '❌ MQTT Disconnected');
        socketManager.broadcastMqttStatus(false);
    });

    this.client.on('message', (topic, message) => {
        handleMessage(topic, message);
    });

    this.client.on('error', (error) => {
        log('ERROR', 'MQTT Error', { error });
    });

    this.client.on('reconnect', () => {
        
    });
    // ... sisanya sama
  }

  subscribe() {
    const topics = Object.values(PUBLISH_TOPICS);
    topics.forEach(topic => {
      this.client.subscribe(topic, { qos: 1 }, (err) => {
        if (err) log('ERROR', `Gagal subscribe ke ${topic}`, { error: err });
        else log('INFO', `Subscribed ke ${topic}`);
      });
    });
  }

  publish(topic, payload) {
    if (!this.isConnected) {
      log('WARN', 'MQTT tidak terkoneksi, command tidak dikirim');
      return false;
    }
    this.client.publish(topic, String(payload), { qos: 1, retain: false }, (err) => {
      if (err) log('ERROR', `Gagal publish ke ${topic}`, { error: err });
      else log('INFO', `Published ke ${topic}: ${payload}`);
    });
    return true;
  }

  getLatestState() {
    return getLatestState();
  }

  disconnect() {
    if (this.client) this.client.end();
  }
}

module.exports = new MQTTClient();  // ← HAPUS KARAKTER 'z' DI AKHIR