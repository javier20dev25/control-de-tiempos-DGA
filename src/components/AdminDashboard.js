import Chart from 'chart.js/auto';

export const AdminDashboard = (state) => {
    const totalP5 = state.records.length;
    const inRecinto = state.records.filter(r => r.t2 && !r.t3).length;
    const inTransit = state.records.filter(r => r.t1 && !r.t2).length;
    const dispatched = state.records.filter(r => r.status === 'finalizado').length;

    // Métricas del Inspector
    const fumigados = state.records.filter(r => r.fumigationDelayHours).length;
    const problemasDocs = state.records.filter(r => r.status === 'problema_documental').length;

    return `
    <div class="animate-in">
      <h2 style="margin-bottom: 20px;">Dashboard Jefe Inspección</h2>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;">
        <div class="card glass" style="padding: 15px; text-align: center;">
          <div style="font-size: 0.8rem; color: var(--text-muted);">P-5 TOTAL (HOY)</div>
          <div style="font-size: 1.5rem; font-weight: 800; color: var(--primary);">${totalP5}</div>
        </div>
        <div class="card glass" style="padding: 15px; text-align: center;">
          <div style="font-size: 0.8rem; color: var(--text-muted);">EN TRÁNSITO</div>
          <div style="font-size: 1.5rem; font-weight: 800; color: var(--secondary);">${inTransit}</div>
        </div>
        <div class="card glass" style="padding: 15px; text-align: center;">
          <div style="font-size: 0.8rem; color: var(--text-muted);">EN RECINTO JH</div>
          <div style="font-size: 1.5rem; font-weight: 800; color: #f59e0b;">${inRecinto}</div>
        </div>
        <div class="card glass" style="padding: 15px; text-align: center;">
          <div style="font-size: 0.8rem; color: var(--text-muted);">DESPACHADOS (FIN)</div>
          <div style="font-size: 1.5rem; font-weight: 800; color: var(--success);">${dispatched}</div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;">
        <div class="card glass" style="padding: 15px; text-align: center; border: 1px solid rgba(239, 68, 68, 0.3);">
          <div style="font-size: 0.8rem; color: var(--danger);">FUMIGACIONES</div>
          <div style="font-size: 1.5rem; font-weight: 800; color: var(--danger);">${fumigados}</div>
        </div>
        <div class="card glass" style="padding: 15px; text-align: center; border: 1px solid rgba(245, 158, 11, 0.3);">
          <div style="font-size: 0.8rem; color: #f59e0b;">PROBLEMAS DOCS.</div>
          <div style="font-size: 1.5rem; font-weight: 800; color: #f59e0b;">${problemasDocs}</div>
        </div>
      </div>

      <div class="card glass">
        <h3>Análisis de Tiempos (Promedio)</h3>
        <canvas id="cycleChart" style="margin-top: 15px; max-height: 200px;"></canvas>
      </div>

      <div class="card glass">
        <h3>Últimos Movimientos</h3>
        <div style="overflow-x: auto; margin-top: 10px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                <thead style="color: var(--text-muted); border-bottom: 1px solid var(--glass-border);">
                    <tr>
                        <th style="text-align: left; padding: 10px;">CONT.</th>
                        <th style="text-align: left; padding: 10px;">ESTADO REGISTRO</th>
                    </tr>
                </thead>
                <tbody>
                    ${state.records.slice(-5).reverse().map(r => {
        let displayStatus = r.status || 'En Tránsito';
        if (displayStatus === 'en_recinto') displayStatus = 'En Recinto';
        if (displayStatus === 'problema_documental') displayStatus = 'Prob. Documental';
        
        return `
                        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                            <td style="padding: 10px; font-family: monospace;">${r.containerId || r.id}</td>
                            <td style="padding: 10px;">
                                <span style="background: rgba(255,255,255,0.1); padding: 4px 8px; border-radius: 4px;">
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
    </div>
  `;
};

AdminDashboard.init = (state) => {
    const ctx = document.getElementById('cycleChart');
    if (!ctx) return;

    const recordsWithT3 = state.records.filter(r => r.t3);

    const avgTraslado = recordsWithT3.length > 0
        ? recordsWithT3.reduce((acc, r) => acc + (new Date(r.t2) - new Date(r.t1)), 0) / recordsWithT3.length / (1000 * 60)
        : 0;

    const avgProceso = recordsWithT3.length > 0
        ? recordsWithT3.reduce((acc, r) => acc + (new Date(r.t3) - new Date(r.t2)), 0) / recordsWithT3.length / (1000 * 60)
        : 0;

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Traslado (P5-JH)', 'Proceso (JH)'],
            datasets: [{
                label: 'Minutos',
                data: [avgTraslado, avgProceso],
                backgroundColor: [
                    'rgba(0, 242, 254, 0.5)',
                    'rgba(79, 172, 254, 0.5)'
                ],
                borderColor: [
                    '#00f2fe',
                    '#4facfe'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, border: { display: false } },
                x: { grid: { display: false } }
            }
        }
    });
};
