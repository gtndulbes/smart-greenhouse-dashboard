// ============================================================
// HISTORY PAGE
// ============================================================

async function loadHistory() {
    const from = DOM.historyFrom?.value;
    const to = DOM.historyTo?.value;
    if (!from || !to) { alert('Pilih rentang tanggal'); return; }
    
    DOM.historyTableBody.innerHTML = '<tr><td colspan="9" class="text-center text-slate-400 py-4">Loading...</td></tr>';
    
    try {
        const url = `/api/history?from=${from}&to=${to}`;
        const res = await fetch(url);
        const data = await res.json();
        if (!data.success || !data.data || data.data.length === 0) {
            DOM.historyTableBody.innerHTML = '<tr><td colspan="9" class="text-center text-slate-400 py-4">No data found</td></tr>';
            return;
        }
        AppState.historyData = data.data;
        renderHistoryTable(data.data);
    } catch (e) {
        console.error(e);
        DOM.historyTableBody.innerHTML = '<tr><td colspan="9" class="text-center text-red-500 py-4">Failed to load history</td></tr>';
    }
}

function renderHistoryTable(data) {
    if (!data || data.length === 0) {
        DOM.historyTableBody.innerHTML = '<tr><td colspan="9" class="text-center text-slate-400 py-4">No data found</td></tr>';
        return;
    }

    const rows = data.map(row => {
        // === PERBAIKAN: Format timestamp ke WIB ===
        let timestampDisplay = '-';
        if (row.Timestamp || row.timestamp) {
            const ts = row.Timestamp || row.timestamp;
            try {
                const date = new Date(ts);
                // Tambah 7 jam untuk WIB
                date.setHours(date.getHours() + 7);
                timestampDisplay = date.toISOString().replace('Z', ' WIB').slice(0, 19);
            } catch(e) {
                timestampDisplay = ts;
            }
        }

        return `
        <tr class="border-b border-slate-100 dark:border-slate-700">
            <td class="p-2 text-xs">${timestampDisplay}</td>
            <td class="p-2">${row.Temperature || row.temp || '-'}</td>
            <td class="p-2">${row.Humidity || row.hum || '-'}</td>
            <td class="p-2">${row.Lux || row.lux || '-'}</td>
            <td class="p-2">${row.Soil_Moisture || row.soil || '-'}</td>
            <td class="p-2">${row.Fan || row.fan || '-'}</td>
            <td class="p-2">${row.LED || row.led || '-'}</td>
            <td class="p-2">${row.Misting || row.misting || '-'}</td>
            <td class="p-2">${row.Water_Pump !== undefined ? (row.Water_Pump ? 'ON' : 'OFF') : (row.pump !== undefined ? (row.pump ? 'ON' : 'OFF') : '-')}</td>
        </tr>
    `}).join('');

    DOM.historyTableBody.innerHTML = rows;
}

async function exportPDF() {
    if (!AppState.historyData || AppState.historyData.length === 0) {
        alert('Tidak ada data untuk diexport. Load history terlebih dahulu.');
        return;
    }
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('landscape', 'mm', 'a4');
        doc.setFontSize(16);
        doc.text('Smart Greenhouse Report', 20, 20);
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 30);
        doc.text(`Period: ${DOM.historyFrom?.value || '-'} to ${DOM.historyTo?.value || '-'}`, 20, 37);
        
        // Tabel data
        const headers = ['Time', 'Temp', 'Hum', 'Lux', 'Soil', 'Fan', 'LED', 'Mist', 'Pump'];
        const rows = AppState.historyData.slice(0, 50).map(r => [
            r.timestamp || r.time || '-',
            r.temperature || r.temp || '-',
            r.humidity || r.hum || '-',
            r.lux || '-',
            r.soil_moisture || r.soil || '-',
            r.fan || '-',
            r.led || '-',
            r.misting || '-',
            r.pump !== undefined ? (r.pump ? 'ON' : 'OFF') : '-'
        ]);
        
        doc.autoTable({
            head: [headers],
            body: rows,
            startY: 45,
            styles: { fontSize: 7 },
            headStyles: { fillColor: [34, 197, 94] }
        });
        
        doc.save('greenhouse_report.pdf');
    } catch (e) {
        console.error(e);
        alert('Gagal export PDF. Pastikan library jsPDF dan autoTable terload.');
    }
}

// Event listeners
DOM.historyLoadBtn?.addEventListener('click', loadHistory);
DOM.historyExportBtn?.addEventListener('click', exportPDF);