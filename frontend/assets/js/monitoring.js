// ============================================================
// MONITORING CHARTS
// ============================================================
let monitorCharts = {};

function initMonitoringCharts() {
    const configs = [
        { id: 'monitorTempChart', label: 'Temperature °C', color: '#ef4444', dataKey: 'temp' },
        { id: 'monitorHumChart', label: 'Humidity %', color: '#3b82f6', dataKey: 'hum' },
        { id: 'monitorLuxChart', label: 'Lux', color: '#eab308', dataKey: 'lux' },
        { id: 'monitorSoilChart', label: 'Soil Moisture %', color: '#22c55e', dataKey: 'soil' }
    ];

    configs.forEach(cfg => {
        const canvas = document.getElementById(cfg.id);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        monitorCharts[cfg.id] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: cfg.label,
                    data: [],
                    borderColor: cfg.color,
                    backgroundColor: cfg.color + '20',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false,
                scales: {
                    x: { grid: { display: false }, ticks: { maxTicksLimit: 10, font: { size: 8 } } },
                    y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } }
                },
                plugins: { legend: { display: false } }
            }
        });
    });
}

function updateMonitoringCharts(data) {
    const now = new Date().toLocaleTimeString();
    const keys = ['temp', 'hum', 'lux', 'soil'];
    const values = [data.temperature || 0, data.humidity || 0, (data.lux || 0) / 100, data.soil_moisture || 0];
    const ids = ['monitorTempChart', 'monitorHumChart', 'monitorLuxChart', 'monitorSoilChart'];

    ids.forEach((id, idx) => {
        const chart = monitorCharts[id];
        if (!chart) return;
        if (chart.data.labels.length > 80) {
            chart.data.labels.shift();
            chart.data.datasets[0].data.shift();
        }
        chart.data.labels.push(now);
        chart.data.datasets[0].data.push(values[idx]);
        chart.update('none');
    });
}

// Override updateChart from dashboard to also update monitoring
const originalUpdateChart = updateChart;
updateChart = function(data) {
    originalUpdateChart(data);
    updateMonitoringCharts(data);
};

// Init monitoring charts when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Only init if the elements exist
    if (document.getElementById('monitorTempChart')) {
        initMonitoringCharts();
    }
});