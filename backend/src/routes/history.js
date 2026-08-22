const express = require('express');
const router = express.Router();
const googleSheets = require('../services/googleSheets');
const { log } = require('../utils/logger');

// GET /api/history
router.get('/', async (req, res) => {
  try {
    const { from, to, limit = 100 } = req.query;
    
    // Data dari Google Spreadsheet
    const data = await googleSheets.getHistory(from, to);
    
    res.json({
      success: true,
      count: data.length || 0,
      data: data || []
    });
  } catch (error) {
    log('ERROR', 'Gagal mengambil histori', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch history from Google Sheets'
    });
  }
});

module.exports = router;