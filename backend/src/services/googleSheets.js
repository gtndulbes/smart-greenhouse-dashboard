const axios = require('axios');
const { log } = require('../utils/logger');

class GoogleSheetsService {
    constructor() {
        this.url = process.env.GOOGLE_APPS_SCRIPT_URL;
        this.lastLogTime = 0;
        this.interval = 15000; // 15 detik (hindari kuota)
        this.isLogging = false; // cegah overlapping
    }

    async logData(data) {
        if (!this.url) {
            log('WARN', 'GOOGLE_APPS_SCRIPT_URL tidak diset, logging dilewati');
            return false;
        }

        // Cegah overlapping request
        if (this.isLogging) {
            log('DEBUG', 'Logging sedang berjalan, lewati');
            return false;
        }

        const now = Date.now();
        if (now - this.lastLogTime < this.interval) {
            // log('DEBUG', 'Interval logging belum cukup, lewati');
            return true;
        }

        this.isLogging = true;
        try {
            // Gunakan timestamp dari ESP32 jika ada, atau buat baru
            const timestamp = data.timestamp || new Date().toISOString();

            // Buat URLSearchParams dengan benar
            const params = new URLSearchParams();
            params.append('timestamp', timestamp);
            params.append('temp', data.temperature?.toFixed(1) || '');
            params.append('hum', data.humidity?.toFixed(1) || '');
            params.append('lux', data.lux?.toFixed(0) || '');
            params.append('soil', data.soil_moisture?.toFixed(1) || '');
            params.append('fan', data.fan || 0);
            params.append('led', data.led || 0);
            params.append('misting', data.misting || 0);
            params.append('pump', data.water_pump || 0);
            params.append('mode', data.mode || 'AUTO');

            log('DEBUG', `📤 Mengirim ke Google Sheets: ${params.toString()}`);

            const response = await axios.post(this.url, params.toString(), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                timeout: 10000
            });

            if (response.status === 200) {
                this.lastLogTime = now;
                log('INFO', '✅ Data berhasil dikirim ke Google Spreadsheet');
                return true;
            } else {
                log('WARN', `Google Sheets response status: ${response.status}`);
                return false;
            }
        } catch (error) {
            log('ERROR', 'Gagal mengirim ke Google Sheets', {
                message: error.message,
                code: error.code
            });
            return false;
        } finally {
            this.isLogging = false;
        }
    }

    async getHistory(from, to) {
        if (!this.url) {
            throw new Error('GOOGLE_APPS_SCRIPT_URL tidak diset');
        }
        try {
            const response = await axios.get(this.url, {
                params: { from, to, action: 'getData' },
                timeout: 10000
            });
            if (Array.isArray(response.data)) {
                return response.data;
            } else {
                log('ERROR', 'Google Sheets tidak mengembalikan array', { data: response.data });
                return [];
            }
        } catch (error) {
            log('ERROR', 'Gagal mengambil histori dari Google Sheets', {
                message: error.message
            });
            return [];
        }
    }
}

module.exports = new GoogleSheetsService();