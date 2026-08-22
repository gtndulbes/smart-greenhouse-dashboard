const express = require('express');
const router = express.Router();

// Import sub-routes
const controlRoutes = require('./control');
const modeRoutes = require('./mode');
const systemRoutes = require('./system');
const historyRoutes = require('./history');

// Mount sub-routes
router.use('/control', controlRoutes);
router.use('/mode', modeRoutes);
router.use('/system', systemRoutes);
router.use('/history', historyRoutes);

// Root API info
router.get('/', (req, res) => {
  res.json({
    name: 'Smart Greenhouse API',
    version: '1.0.0',
    endpoints: {
      'POST /api/control': 'Control actuator (fan, led, misting, pump)',
      'POST /api/mode': 'Change mode (AUTO/MANUAL)',
      'GET /api/system/status': 'Get system status',
      'GET /api/history': 'Get history from Google Sheets',
      'GET /health': 'Health check'
    }
  });
});

module.exports = router;