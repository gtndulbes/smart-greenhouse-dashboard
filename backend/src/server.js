require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const path = require('path');

const { log } = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');
const socketManager = require('./websocket/socketManager');
const mqttClient = require('./mqtt/mqttClient');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend
app.use(express.static(path.join(__dirname, '../../frontend')));

// API Routes (via aggregator)
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// Root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/index.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    clients: socketManager.getClientCount(),
    mqtt: mqttClient.isConnected
  });
});

// Redirect favicon.ico ke favicon.png
app.get('/favicon.ico', (req, res) => {
    res.redirect('/assets/icons/favicon.png');
});

// Error handler (harus di akhir)
app.use(errorHandler);

// Init Socket.IO
socketManager.initialize(server);

// Init MQTT
mqttClient.connect();

// Graceful shutdown
process.on('SIGINT', () => {
  log('INFO', 'Shutting down...');
  mqttClient.disconnect();
  server.close(() => {
    log('INFO', 'Server closed');
    process.exit(0);
  });
});

server.listen(PORT, () => {
  log('INFO', `🚀 Smart Greenhouse Backend running on http://localhost:${PORT}`);
  log('INFO', `📡 Socket.IO server ready`);
  log('INFO', `🔌 MQTT Broker: ${process.env.MQTT_BROKER}:${process.env.MQTT_PORT}`);
});