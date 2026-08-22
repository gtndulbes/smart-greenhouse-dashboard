const axios = require('axios');
const { log } = require('../utils/logger');

class TelegramService {
  constructor() {
    this.token = process.env.TELEGRAM_BOT_TOKEN;
    this.chatId = process.env.TELEGRAM_CHAT_ID;
    this.enabled = !!(this.token && this.chatId);
  }

  async sendMessage(message) {
    if (!this.enabled) {
      log('DEBUG', 'Telegram tidak dikonfigurasi, pesan dilewati');
      return false;
    }

    try {
      const url = `https://api.telegram.org/bot${this.token}/sendMessage`;
      await axios.post(url, {
        chat_id: this.chatId,
        text: message,
        parse_mode: 'HTML'
      }, { timeout: 5000 });
      log('INFO', 'Telegram notification terkirim');
      return true;
    } catch (error) {
      log('ERROR', 'Gagal kirim Telegram', { message: error.message });
      return false;
    }
  }

  async sendAlert(level, message) {
    const emoji = level === 'CRITICAL' ? '🚨' : level === 'WARNING' ? '⚠️' : 'ℹ️';
    const text = `${emoji} <b>Smart Greenhouse Alert</b>\nLevel: ${level}\nMessage: ${message}\nTime: ${new Date().toISOString()}`;
    return this.sendMessage(text);
  }
}

module.exports = new TelegramService();