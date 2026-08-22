const { log } = require('../utils/logger');

function errorHandler(err, req, res, next) {
  log('ERROR', 'Unhandled error', { 
    error: err.message, 
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    body: req.body
  });

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

module.exports = { errorHandler };