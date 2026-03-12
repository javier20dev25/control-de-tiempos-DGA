import { db, saveRecord } from '../utils/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { startShift, endShift, getActiveShift } from '../utils/shifts';

export const JHSalidaView = (state) => {
    const activeShift = state.activeShift;
    const shiftStartTime = activeShift ? new Date(activeShift.startTime.seconds * 1000) : null;

    const now = new Date();
    const defaultShiftStart = new Date(now);
    defaultShiftStart.setHours(7, 0, 0, 0);
    if (now.getHours() < 7) defaultShiftStart.setDate(defaultShiftStart.getDate() - 1);

    const effectiveStart = shiftStartTime || defaultShiftStart;

    const shiftCount = state.records.filter(r => 
        r.salidaUserEmail === state.user.email && 
        new Date(r.salidaTimestamp) >= effectiveStart
    ).length;

    return `
    <div class="animate-in">
        <div>
            <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 500; text-transform: uppercase;">Despachos en mi Turno</div>
            <div style="font-size: 1.2rem; font-weight: 800; color: var(--text);">${shiftCount} <span style="font-size: 0.8rem; font-weight: 500; color: var(--text-muted);">Contenedores</span></div>
        </div>
        <div style="display: flex; gap: 8px;">
            ${activeShift ? 
                `<button class="btn btn-secondary" id="btn-end-shift-jh-out" style="padding: 8px 12px; font-size: 0.7rem; height: auto;">CONCLUIR TURNO</button>` : 
                `<button class="btn btn-primary" id="btn-start-shift-jh-out" style="padding: 8px 12px; font-size: 0.7rem; height: auto;">EMPEZAR TURNO</button>`
            }
        </div>
    </div>

    ${!activeShift ? `
    <div class="card" style="text-align: center; border: 2px dashed var(--border); background: var(--bg);">
        <i data-lucide="lock" style="width: 32px; height: 32px; color: var(--text-muted); margin-bottom: 12px;"></i>
        <h3 style="font-size: 0.9rem; color: var(--text-muted);">Debe iniciar turno para despachar contenedores</h3>
    </div>
    ` : `

        <div class="card">
            <h2 style="font-size: 1rem; font-weight: 700; margin-bottom: 12px;">Julia Herrera — Salida</h2>
            
            <div class="input-group" style="margin-bottom: 0;">
                <label>Buscar por últimos 4 dígitos</label>
                <input type="text" id="search-input-out" placeholder="EJ: 8845" maxlength="4" style="font-size: 1.2rem; text-align: center; letter-spacing: 2px;" />
            </div>

            <div id="feedback-msg-out" style="display: none; padding: 10px; border-radius: 8px; font-size: 0.8rem; margin-top: 10px; text-align: center; font-weight: 600;"></div>

            <div id="search-results-out" style="margin-top: 16px;">
                <div style="color: var(--text-muted); text-align: center; padding: 10px; font-size: 0.8rem;">
                    Ingrese los últimos 4 dígitos para despachar.
                </div>
            </div>
        </div>
    </div>
    `}
    `;
};

JHSalidaView.init = (state, render) => {
  const btnStart = document.getElementById('btn-start-shift-jh-out');
  const btnEnd = document.getElementById('btn-end-shift-jh-out');

  if (btnStart) {
    btnStart.addEventListener('click', async () => {
      try {
        btnStart.disabled = true;
        await startShift(state.user.email, 'jh-out');
        const shift = await getActiveShift(state.user.email);
        state.activeShift = shift;
        render();
      } catch (err) {
        alert(err.message || 'El puesto Julia Herrera (Salida) ya está ocupado.');
        btnStart.disabled = false;
      }
    });
  }

  if (btnEnd) {
    btnEnd.addEventListener('click', async () => {
      if(!confirm('¿Concluir este turno?')) return;
      
      // Generate CSV before ending shift
      const now = new Date();
      const shiftStartTime = state.activeShift ? new Date(state.activeShift.startTime.seconds * 1000) : null;
      
      const shiftRecords = state.records.filter(r => 
          r.salidaUserEmail === state.user.email && 
          new Date(r.salidaTimestamp) >= (shiftStartTime || new Date(0))
      );

      if (shiftRecords.length > 0) {
          const headers = ['Contenedor', 'Declaración', 'Entrada P5', 'Salida', 'Estado'];
          const rows = shiftRecords.map(r => [
              r.containerId,
              r.declaration,
              r.t1 ? new Date(r.t1).toLocaleString() : '',
              r.t3 ? new Date(r.t3).toLocaleString() : '',
              'DESPACHADO'
          ]);

          let csvContent = "data:text/csv;charset=utf-8," 
              + headers.join(",") + "\n"
              + rows.map(e => e.join(",")).join("\n");

          const encodedUri = encodeURI(csvContent);
          const link = document.createElement("a");
          link.setAttribute("href", encodedUri);
          link.setAttribute("download", `reporte_final_turno_${state.user.email}_${new Date().toISOString().split('T')[0]}.csv`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
      }

      btnEnd.disabled = true;
      await endShift(state.activeShift.id);
      state.activeShift = null;
      render();
    });
  }

  if (!state.activeShift) return;
  const searchInput = document.getElementById('search-input-out');
  const resultsDir = document.getElementById('search-results-out');
  const feedbackMsg = document.getElementById('feedback-msg-out');

  const showFeedback = (msg, isError = false) => {
      feedbackMsg.textContent = msg;
      feedbackMsg.style.display = 'block';
      feedbackMsg.style.background = isError ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)';
      feedbackMsg.style.color = isError ? 'var(--accent)' : 'var(--success)';
      setTimeout(() => { if(feedbackMsg) feedbackMsg.style.display = 'none'; }, 3000);
  };

  const getStatusBadge = (status, fumigationHours) => {
      if (status === 'inspeccionado') return `<span style="background: rgba(16,185,129,0.1); color: var(--success); padding: 3px 8px; border-radius: 6px; font-size: 0.7rem; font-weight: 700; border: 1px solid rgba(16,185,129,0.2);">APROBADO</span>`;
      if (status === 'fumigacion') return `<span style="background: rgba(239,68,68,0.1); color: var(--accent); padding: 3px 8px; border-radius: 6px; font-size: 0.7rem; font-weight: 700; border: 1px solid rgba(239,68,68,0.2);">FUMIGACIÓN (${fumigationHours}h)</span>`;
      if (status === 'problema_documental') return `<span style="background: rgba(245,158,11,0.1); color: var(--warning); padding: 3px 8px; border-radius: 6px; font-size: 0.7rem; font-weight: 700; border: 1px solid rgba(245,158,11,0.2);">PROBLEMA DOC.</span>`;
      return '';
  };

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toUpperCase();
    if (query.length < 2) return;

    const allowedStatuses = ['inspeccionado', 'fumigacion', 'problema_documental'];
    const matched = state.records.filter(r => 
        r.containerId && r.containerId.endsWith(query) && 
        allowedStatuses.includes(r.status)
    );

    const uninspected = state.records.filter(r => 
        r.containerId && r.containerId.endsWith(query) && 
        r.status === 'en_recinto'
    );

    if (matched.length === 0) {
        if (uninspected.length > 0) {
            resultsDir.innerHTML = `<div style="color: var(--accent); text-align: center; padding: 12px; background: rgba(239,68,68,0.05); border-radius: 10px; border: 1px solid rgba(239,68,68,0.1); font-size: 0.8rem;">
                <i data-lucide="alert-triangle" style="margin-bottom: 4px; width: 18px;"></i><br/>
                Pendiente de Inspección
            </div>`;
            import('lucide').then(({ createIcons, AlertTriangle }) => createIcons({ icons: {AlertTriangle} }));
            return;
        }
        resultsDir.innerHTML = `<div style="color: var(--text-muted); text-align: center; padding: 10px; font-size: 0.8rem;">No encontrado o ya despachado.</div>`;
        return;
    }

    resultsDir.innerHTML = matched.map(r => `
      <div class="card animate-in" style="padding: 16px; margin-bottom: 8px; border-left: 4px solid var(--success);">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
          <div>
            <div style="font-weight: 800; font-family: monospace; font-size: 1.1rem;">${r.containerId}</div>
            <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 500;">${r.regime || ''} | ${r.declaration || 'S/D'}</div>
          </div>
          <div>${getStatusBadge(r.status, r.fumigationDelayHours)}</div>
        </div>
        
        <button class="btn btn-primary btn-dispatch" data-docid="${r.docId}" style="width: 100%; background: var(--success);">
          <i data-lucide="log-out" style="width: 16px;"></i> SALIDA DEFINITIVA
        </button>
      </div>
    `).join('');

    import('lucide').then(({ createIcons, LogOut }) => createIcons({ icons: {LogOut} }));

    document.querySelectorAll('.btn-dispatch').forEach(btn => {
      btn.addEventListener('click', async () => {
        const docId = btn.dataset.docid;
        try {
            btn.disabled = true;
            const recordId = docId;
            const record = state.records.find(r => r.docId === docId);
            const updateData = {
                ...record,
                docId: docId,
                status: 'finalizado',
                t3: new Date().toISOString(),
                salidaTimestamp: new Date().toISOString(),
                salidaUserEmail: state.user.email
            };

            await saveRecord(updateData, state.user.email);
            showFeedback('✓ Despacho Exitoso');
            searchInput.value = '';
            setTimeout(() => render(), 1000);
        } catch (error) {
            showFeedback('Error: ' + error.message, true);
            btn.disabled = false;
            btn.innerHTML = '<i data-lucide="log-out" style="width: 16px;"></i> SALIDA DEFINITIVA';
        }
      });
    });
  });

  // End Shift Report
  document.getElementById('btn-end-shift')?.addEventListener('click', () => {
    const now = new Date();
    const shiftStart = new Date(now);
    shiftStart.setHours(7, 0, 0, 0);
    if (now.getHours() < 7) shiftStart.setDate(shiftStart.getDate() - 1);

    const shiftRecords = state.records.filter(r => 
        r.salidaUserEmail === state.user.email && 
        new Date(r.salidaTimestamp) >= shiftStart
    );

    if (shiftRecords.length === 0) {
        showFeedback('No hay despachos en este turno para reportar.', true);
        return;
    }

    const headers = ['Contenedor', 'Declaración', 'Entrada P5', 'Salida', 'Estado'];
    const rows = shiftRecords.map(r => [
        r.containerId,
        r.declaration,
        r.t1 ? new Date(r.t1).toLocaleString() : '',
        r.t3 ? new Date(r.t3).toLocaleString() : '',
        'DESPACHADO'
    ]);

    let csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(",") + "\n"
        + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `reporte_turno_${state.user.email}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showFeedback('Reporte de turno descargado');
  });
};
