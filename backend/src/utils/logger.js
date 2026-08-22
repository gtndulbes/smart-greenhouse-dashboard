const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = (level, message, data = null) => {
  const timestamp = new Date().toISOString();
  let prefix, color;
  
  switch (level) {
    case 'INFO':
      prefix = '[INFO]';
      color = colors.green;
      break;
    case 'WARN':
      prefix = '[WARN]';
      color = colors.yellow;
      break;
    case 'ERROR':
      prefix = '[ERROR]';
      color = colors.red;
      break;
    case 'DEBUG':
      prefix = '[DEBUG]';
      color = colors.cyan;
      break;
    default:
      prefix = '[LOG]';
      color = colors.reset;
  }

  console.log(`${colors.dim}${timestamp}${colors.reset} ${color}${prefix}${colors.reset} ${message}`);
  if (data) {
    console.log(colors.dim, JSON.stringify(data, null, 2), colors.reset);
  }
};

module.exports = { log };