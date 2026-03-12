import Chart from 'chart.js/auto';

export const AdminDashboard = (state) => {
    const totalP5 = state.records.length;
    const inRecinto = state.records.filter(r => r.status === 'en_recinto').length;
    const inTransit = state.records.filter(r => r.status === 'en_transito').length;
    const dispatched = state.records.filter(r => r.status === 'finalizado').length;
    const fumigados = state.records.filter(r => r.fumigationDelayHours).length;
    const problemasDocs = state.records.filter(r => r.status === 'problema_documental').length;

    return `
    <div class="animate-in">
      <h2 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 16px;">Dashboard</h2>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px;">
        <div class="card" style="padding: 14px; text-align: center;">
          <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 500; text-transform: uppercase;">P-5 Total</div>
          <div style="font-size: 1.5rem; font-weight: 800; color: var(--primary);">${totalP5}</div>
        </div>
        <div class="card" style="padding: 14px; text-align: center;">
          <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 500; text-transform: uppercase;">En Tránsito</div>
          <div style="font-size: 1.5rem; font-weight: 800; color: var(--secondary);">${inTransit}</div>
        </div>
        <div class="card" style="padding: 14px; text-align: center;">
          <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 500; text-transform: uppercase;">En Recinto</div>
          <div style="font-size: 1.5rem; font-weight: 800; color: var(--warning);">${inRecinto}</div>
        </div>
        <div class="card" style="padding: 14px; text-align: center;">
          <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 500; text-transform: uppercase;">Despachados</div>
          <div style="font-size: 1.5rem; font-weight: 800; color: var(--success);">${dispatched}</div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px;">
        <div class="card" style="padding: 14px; text-align: center; border-color: rgba(239,68,68,0.2);">
          <div style="font-size: 0.7rem; color: var(--accent); font-weight: 500; text-transform: uppercase;">Fumigaciones</div>
          <div style="font-size: 1.5rem; font-weight: 800; color: var(--accent);">${fumigados}</div>
        </div>
        <div class="card" style="padding: 14px; text-align: center; border-color: rgba(245,158,11,0.2);">
          <div style="font-size: 0.7rem; color: var(--warning); font-weight: 500; text-transform: uppercase;">Prob. Docs</div>
          <div style="font-size: 1.5rem; font-weight: 800; color: var(--warning);">${problemasDocs}</div>
        </div>
      </div>

      <div class="card">
        <h3 style="font-size: 0.95rem; font-weight: 600; margin-bottom: 12px;">Tiempos Promedio</h3>
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
                ${state.records.slice(-5).reverse().map(r => {
    let displayStatus = r.status || 'En Tránsito';
    if (displayStatus === 'en_recinto') displayStatus = 'En Recinto';
    if (displayStatus === 'problema_documental') displayStatus = 'Prob. Doc.';
    
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
            labels: ['Traslado (P5→JH)', 'Proceso (JH)'],
            datasets: [{
                label: 'Minutos',
                data: [avgTraslado, avgProceso],
                backgroundColor: ['rgba(37, 99, 235, 0.15)', 'rgba(14, 165, 233, 0.15)'],
                borderColor: ['#2563eb', '#0ea5e9'],
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
};
