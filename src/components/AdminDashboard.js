import Chart from 'chart.js/auto';

export const AdminDashboard = (state) => {
    const now = new Date();
    const today7am = new Date(now);
    today7am.setHours(7, 0, 0, 0);
    if (now.getHours() < 7) today7am.setDate(today7am.getDate() - 1);

    const yesterday7am = new Date(today7am);
    yesterday7am.setDate(yesterday7am.getDate() - 1);

    // Records for Today's Shift
    const recordsToday = state.records.filter(r => new Date(r.timestamp) >= today7am);
    
    // Records for Yesterday's Shift
    const recordsYesterday = state.records.filter(r => {
        const d = new Date(r.timestamp);
        return d >= yesterday7am && d < today7am;
    });

    const flowStats = {
        enteredP5: recordsToday.length,
        inTransit: recordsToday.filter(r => r.status === 'en_transito').length,
        inRecinto: recordsToday.filter(r => r.status === 'en_recinto').length,
        pendingInspection: recordsToday.filter(r => r.status === 'en_recinto').length,
        pendingDispatch: recordsToday.filter(r => ['inspeccionado', 'fumigacion', 'problema_documental'].includes(r.status)).length,
        dispatched: recordsToday.filter(r => r.status === 'finalizado').length,
        inspectedTotal: recordsToday.filter(r => r.inspectorTimestamp).length
    };

    const yestTotal = recordsYesterday.length;
    const yestDispatched = recordsYesterday.filter(r => r.status === 'finalizado').length;

    // Calculate bottlenecks for explanation
    let explanation = "La operación se mantiene estable.";
    const processed = recordsToday.filter(r => r.t2 && r.t1);
    const avgTransfer = processed.length > 0
        ? processed.reduce((acc, r) => acc + (new Date(r.t2) - new Date(r.t1)), 0) / processed.length / (1000 * 60)
        : 0;
    
    if (flowStats.pendingInspection > 5) explanation = "Aviso: Se está acumulando carga en el patio del Julia Herrera. Se requieren más inspecciones.";
    if (avgTransfer > 45) explanation = "Alerta: El tiempo de traslado desde el Portón 5 es inusualmente alto (Promedio: " + Math.round(avgTransfer) + " min). Posible congestión vial.";
    if (flowStats.pendingDispatch > 3) explanation = "Aviso: Hay contenedores aprobados esperando despacho final.";

    return `
    <div class="animate-in">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="font-size: 1.1rem; font-weight: 700; margin: 0;">Panel de Control</h2>
        <div style="display: flex; gap: 8px;">
            <button class="btn btn-secondary" id="btn-export-full" style="padding: 8px 12px; font-size: 0.75rem;">
               8 DÍAS
            </button>
            <button class="btn btn-primary" id="btn-export-today" style="padding: 8px 12px; font-size: 0.75rem;">
              <i data-lucide="download" style="width: 14px;"></i> EXCEL HOY
            </button>
        </div>
      </div>

      <!-- Quick Stats Grid -->
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 20px;">
          <div class="card" style="margin-bottom: 0; padding: 12px; border-left: 4px solid var(--primary);">
              <div style="font-size: 0.65rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Entradas P5 Hoy</div>
              <div style="font-size: 1.4rem; font-weight: 800;">${flowStats.enteredP5}</div>
          </div>
          <div class="card" style="margin-bottom: 0; padding: 12px; border-left: 4px solid var(--success);">
              <div style="font-size: 0.65rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Despachos Hoy</div>
              <div style="font-size: 1.4rem; font-weight: 800;">${flowStats.dispatched}</div>
          </div>
          <div class="card" style="margin-bottom: 0; padding: 12px; border-left: 4px solid var(--warning);">
              <div style="font-size: 0.65rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Pend. Inspección</div>
              <div style="font-size: 1.4rem; font-weight: 800; color: ${flowStats.pendingInspection > 5 ? 'var(--accent)' : 'inherit'}">${flowStats.pendingInspection}</div>
          </div>
          <div class="card" style="margin-bottom: 0; padding: 12px; border-left: 4px solid var(--secondary);">
              <div style="font-size: 0.65rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Pend. Despacho</div>
              <div style="font-size: 1.4rem; font-weight: 800;">${flowStats.pendingDispatch}</div>
          </div>
      </div>

      <!-- Dynamic Insight -->
      <div class="card" style="background: rgba(37,99,235,0.03); border: 1px dashed var(--primary); padding: 12px; margin-bottom: 20px;">
          <div style="display: flex; gap: 8px; align-items: flex-start;">
              <i data-lucide="compass" style="width: 18px; color: var(--primary); flex-shrink: 0; margin-top: 2px;"></i>
              <p style="font-size: 0.8rem; font-weight: 500; margin: 0; line-height: 1.4;">${explanation}</p>
          </div>
      </div>

      <!-- Comparison Section -->
      <div style="margin-bottom: 24px;">
        <h3 style="font-size: 0.85rem; font-weight: 600; color: var(--text-muted); margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Comparativa Histórica</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div class="card" style="padding: 14px; text-align: center; margin-bottom: 0;">
            <div style="font-size: 0.65rem; color: var(--text-muted); font-weight: 500;">P5 Ayer</div>
            <div style="font-size: 1.2rem; font-weight: 700;">${yestTotal}</div>
            <div style="font-size: 0.6rem; color: ${flowStats.enteredP5 >= yestTotal ? 'var(--success)' : 'var(--accent)'}; margin-top: 4px;">
                ${flowStats.enteredP5 >= yestTotal ? '↑' : '↓'} ${Math.abs(flowStats.enteredP5 - yestTotal)} vs ayer
            </div>
          </div>
          <div class="card" style="padding: 14px; text-align: center; margin-bottom: 0;">
            <div style="font-size: 0.65rem; color: var(--text-muted); font-weight: 500;">Despachos Ayer</div>
            <div style="font-size: 1.2rem; font-weight: 700;">${yestDispatched}</div>
            <div style="font-size: 0.6rem; color: ${flowStats.dispatched >= yestDispatched ? 'var(--success)' : 'var(--accent)'}; margin-top: 4px;">
                ${flowStats.dispatched >= yestDispatched ? '↑' : '↓'} ${Math.abs(flowStats.dispatched - yestDispatched)} vs ayer
            </div>
          </div>
        </div>
      </div>

      <!-- Charts Area -->
      <div class="card">
        <h3 style="font-size: 0.9rem; font-weight: 700; margin-bottom: 16px;">Tiempos de Ciclo (Promedios)</h3>
        <canvas id="cycleChart" style="max-height: 160px;"></canvas>
      </div>

      <div class="card">
          <h3 style="font-size: 0.9rem; font-weight: 700; margin-bottom: 16px;">Flujo de Hoy por Hora</h3>
          <canvas id="hourlyChart" style="max-height: 160px;"></canvas>
      </div>

      <div class="card">
        <h3 style="font-size: 0.9rem; font-weight: 700; margin-bottom: 12px;">Últimos Movimientos</h3>
        <table>
            <thead>
                <tr>
                    <th>Cont.</th>
                    <th>Estado</th>
                    <th>Actual</th>
                </tr>
            </thead>
            <tbody>
                ${state.records.slice(0, 10).map(r => {
                    const statusMap = {
                        'en_transito': { text: 'Tránsito', color: 'var(--text-muted)' },
                        'en_recinto': { text: 'Recinto', color: 'var(--warning)' },
                        'inspeccionado': { text: 'Aprobado', color: 'var(--success)' },
                        'fumigacion': { text: 'Fumig.', color: 'var(--accent)' },
                        'problema_documental': { text: 'Doc Error', color: 'var(--warning)' },
                        'finalizado': { text: 'Salida', color: 'var(--success)' }
                    };
                    const s = statusMap[r.status] || { text: 'Desconocido', color: 'var(--text)' };
                    
                    return `
                    <tr>
                        <td style="font-family: monospace; font-weight: 700; font-size: 0.8rem;">${r.containerId || ''}</td>
                        <td>
                            <span style="font-size: 0.7rem; font-weight: 600; color: ${s.color}; text-transform: uppercase;">
                                ${s.text}
                            </span>
                        </td>
                        <td style="font-size: 10px; color: var(--text-muted);">${new Date(r.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
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
    const cycleCtx = document.getElementById('cycleChart');
    const hourlyCtx = document.getElementById('hourlyChart');
    if (!cycleCtx || !hourlyCtx) return;

    // --- Cycle Chart Calculation ---
    const recordsWithT2T1 = state.records.filter(r => r.t2 && r.t1);
    const avgTraslado = recordsWithT2T1.length > 0
        ? recordsWithT2T1.reduce((acc, r) => acc + (new Date(r.t2) - new Date(r.t1)), 0) / recordsWithT2T1.length / (1000 * 60)
        : 0;

    const recordsWithInspT2 = state.records.filter(r => r.inspectorTimestamp && r.t2);
    const avgInspector = recordsWithInspT2.length > 0
        ? recordsWithInspT2.reduce((acc, r) => acc + (new Date(r.inspectorTimestamp) - new Date(r.t2)), 0) / recordsWithInspT2.length / (1000 * 60)
        : 0;

    new Chart(cycleCtx, {
        type: 'bar',
        data: {
            labels: ['P5 → JH', 'Inspección'],
            datasets: [{
                data: [avgTraslado, avgInspector],
                backgroundColor: ['#2563eb33', '#10b98133'],
                borderColor: ['#2563eb', '#10b981'],
                borderWidth: 1.5,
                borderRadius: 4,
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                x: { beginAtZero: true, title: { display: true, text: 'Minutos', font: { size: 10 } } },
                y: { grid: { display: false } }
            }
        }
    });

    // --- Hourly Chart Calculation ---
    const hours = Array.from({length: 24}, (_, i) => i);
    const hourlyData = hours.map(h => {
        return state.records.filter(r => {
            const d = new Date(r.timestamp);
            const isToday = d.toDateString() === new Date().toDateString();
            return isToday && d.getHours() === h;
        }).length;
    });

    new Chart(hourlyCtx, {
        type: 'line',
        data: {
            labels: hours.map(h => `${h}h`),
            datasets: [{
                label: 'Entradas',
                data: hourlyData,
                borderColor: '#2563eb',
                tension: 0.3,
                fill: true,
                backgroundColor: '#2563eb11',
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 10 } } },
                x: { grid: { display: false }, ticks: { font: { size: 9 }, maxTicksLimit: 8 } }
            }
        }
    });

    // --- Export Logic ---
    const exportCSV = (records, filename) => {
        const headers = ['Contenedor', 'Régimen', 'Entrada P5', 'Llegada JH', 'Inspeccionado', 'Salida', 'Estado', 'Creado Por'];
        const rows = records.map(r => [
            r.containerId,
            r.regime,
            r.t1 ? new Date(r.t1).toLocaleString() : '',
            r.t2 ? new Date(r.t2).toLocaleString() : '',
            r.inspectorTimestamp ? new Date(r.inspectorTimestamp).toLocaleString() : '',
            r.t3 ? new Date(r.t3).toLocaleString() : '',
            r.status,
            r.createdBy || ''
        ]);

        let csvContent = "data:text/csv;charset=utf-8,\ufeff" 
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    document.getElementById('btn-export-today').addEventListener('click', () => {
        const now = new Date();
        const today7am = new Date(now);
        today7am.setHours(7, 0, 0, 0);
        if (now.getHours() < 7) today7am.setDate(today7am.getDate() - 1);

        const recordsToday = state.records.filter(r => new Date(r.timestamp) >= today7am);
        exportCSV(recordsToday, `reporte_hoy_desde_7am_${new Date().toISOString().split('T')[0]}.csv`);
    });

    document.getElementById('btn-export-full').addEventListener('click', () => {
        exportCSV(state.records, `reporte_8_dias_completo_${new Date().toISOString().split('T')[0]}.csv`);
    });
};
