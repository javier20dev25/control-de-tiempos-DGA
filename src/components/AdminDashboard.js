import Chart from 'chart.js/auto';

export const AdminDashboard = (state) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const recordsToday = state.records.filter(r => new Date(r.timestamp) >= today);
    const recordsYesterday = state.records.filter(r => {
        const d = new Date(r.timestamp);
        return d >= yesterday && d < today;
    });

    const statsToday = {
        total: recordsToday.length,
        dispatched: recordsToday.filter(r => r.status === 'finalizado').length,
        inTransit: recordsToday.filter(r => r.status === 'en_transito').length,
        inRecinto: recordsToday.filter(r => r.status === 'en_recinto').length
    };

    const statsYesterday = {
        total: recordsYesterday.length,
        dispatched: recordsYesterday.filter(r => r.status === 'finalizado').length,
        inTransit: recordsYesterday.filter(r => r.status === 'en_transito').length,
        inRecinto: recordsYesterday.filter(r => r.status === 'en_recinto').length
    };

    return `
    <div class="animate-in">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="font-size: 1.1rem; font-weight: 700; margin: 0;">Panel de Control</h2>
        <button class="btn btn-secondary" id="btn-export-csv" style="padding: 8px 12px; font-size: 0.75rem;">
          <i data-lucide="download" style="width: 14px;"></i> EXPORTAR CSV
        </button>
      </div>
      
      <!-- Resumen Hoy -->
      <div style="margin-bottom: 24px;">
        <h3 style="font-size: 0.85rem; font-weight: 600; color: var(--text-muted); margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Resumen de Hoy</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div class="card" style="padding: 14px; text-align: center; margin-bottom: 0;">
            <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 500;">P5 Total</div>
            <div style="font-size: 1.5rem; font-weight: 800; color: var(--primary);">${statsToday.total}</div>
          </div>
          <div class="card" style="padding: 14px; text-align: center; margin-bottom: 0;">
            <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 500;">Despachados</div>
            <div style="font-size: 1.5rem; font-weight: 800; color: var(--success);">${statsToday.dispatched}</div>
          </div>
        </div>
      </div>

      <!-- Resumen Ayer -->
      <div style="margin-bottom: 24px;">
        <h3 style="font-size: 0.85rem; font-weight: 600; color: var(--text-muted); margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Movimiento del Día Anterior</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div class="card" style="padding: 14px; text-align: center; margin-bottom: 0; background: #fdfdfd; border-style: dashed;">
            <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 500;">P5 Ayer</div>
            <div style="font-size: 1.5rem; font-weight: 800; color: var(--text-muted);">${statsYesterday.total}</div>
          </div>
          <div class="card" style="padding: 14px; text-align: center; margin-bottom: 0; background: #fdfdfd; border-style: dashed;">
            <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 500;">Despachos Ayer</div>
            <div style="font-size: 1.5rem; font-weight: 800; color: var(--text-muted);">${statsYesterday.dispatched}</div>
          </div>
        </div>
      </div>

      <div class="card">
        <h3 style="font-size: 0.95rem; font-weight: 600; margin-bottom: 12px;">Tiempos Promedio (48h)</h3>
        <canvas id="cycleChart" style="max-height: 180px;"></canvas>
      </div>

      <div class="card">
        <h3 style="font-size: 0.95rem; font-weight: 600; margin-bottom: 12px;">Últimos Movimientos</h3>
        <table>
            <thead>
                <tr>
                    <th>Cont.</th>
                    <th>Estado</th>
                </tr>
            </thead>
            <tbody>
                ${state.records.slice(0, 10).map(r => {
                    let displayStatus = r.status || 'En Tránsito';
                    if (displayStatus === 'en_transito') displayStatus = 'Tránsito';
                    if (displayStatus === 'en_recinto') displayStatus = 'Recinto';
                    if (displayStatus === 'inspeccionado') displayStatus = 'Aprobado';
                    if (displayStatus === 'problema_documental') displayStatus = 'Prob. Doc.';
                    if (displayStatus === 'finalizado') displayStatus = 'Despachado';
                    
                    return `
                    <tr>
                        <td style="font-family: monospace; font-weight: 600;">${r.containerId || ''}</td>
                        <td>
                            <span style="background: var(--bg); padding: 3px 8px; border-radius: 6px; font-size: 0.75rem; border: 1px solid var(--border);">
                                ${displayStatus}
                            </span>
                        </td>
                    </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
      </div>
    </div>
    `;
};

AdminDashboard.init = (state) => {
    const ctx = document.getElementById('cycleChart');
    if (!ctx) return;

    // Filter records for chart
    const processedRecords = state.records.filter(r => r.t2 && r.t1);
    
    const avgTraslado = processedRecords.length > 0
        ? processedRecords.reduce((acc, r) => acc + (new Date(r.t2) - new Date(r.t1)), 0) / processedRecords.length / (1000 * 60)
        : 0;

    const avgInspector = state.records.filter(r => r.inspectorTimestamp && r.t2).reduce((acc, r) => acc + (new Date(r.inspectorTimestamp) - new Date(r.t2)), 0) / (state.records.filter(r => r.inspectorTimestamp && r.t2).length || 1) / (1000 * 60);

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['P5 → JH', 'Inspección'],
            datasets: [{
                label: 'Minutos',
                data: [avgTraslado, avgInspector],
                backgroundColor: ['rgba(37, 99, 235, 0.15)', 'rgba(16, 185, 129, 0.15)'],
                borderColor: ['#2563eb', '#10b981'],
                borderWidth: 1,
                borderRadius: 6,
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true, grid: { color: '#f1f5f9' }, border: { display: false } },
                x: { grid: { display: false } }
            }
        }
    });

    // CSV Export
    document.getElementById('btn-export-csv').addEventListener('click', () => {
        const headers = ['Contenedor', 'Regimen', 'Declaración', 'Entrada P5', 'Llegada JH', 'Salida', 'Estado', 'Creado Por'];
        const rows = state.records.map(r => [
            r.containerId,
            r.regime,
            r.declaration,
            r.t1 ? new Date(r.t1).toLocaleString() : '',
            r.t2 ? new Date(r.t2).toLocaleString() : '',
            r.t3 ? new Date(r.t3).toLocaleString() : '',
            r.status,
            r.createdBy
        ]);

        let csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `reporte_duas_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
};
