import { db, saveRecord } from '../utils/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { startShift, endShift, getActiveShift } from '../utils/shifts';

export const JHIngresoView = (state) => {
  const activeShift = state.activeShift;
  const shiftStartTime = activeShift ? new Date(activeShift.startTime.seconds * 1000) : null;

  const now = new Date();
  const defaultShiftStart = new Date(now);
  defaultShiftStart.setHours(7, 0, 0, 0);
  if (now.getHours() < 7) defaultShiftStart.setDate(defaultShiftStart.getDate() - 1);

  const effectiveStart = shiftStartTime || defaultShiftStart;

  const shiftCount = state.records.filter(r => 
    r.arrivedAtJHBy === state.user.email && 
    new Date(r.t2) >= effectiveStart
  ).length;

  const inRecintoCount = state.records.filter(r => r.status === 'en_recinto').length;
  const inTransitCount = state.records.filter(r => r.status === 'en_transito').length;

  return `
  <div class="animate-in">
    <div class="card" style="padding: 12px 16px; margin-bottom: 12px; border-left: 4px solid var(--secondary); display: flex; justify-content: space-between; align-items: center;">
        <div>
            <div style="font-size: 0.65rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Recibidos en mi Turno</div>
            <div style="font-size: 1.2rem; font-weight: 800; color: var(--text);">${shiftCount} <span style="font-size: 0.8rem; font-weight: 500; color: var(--text-muted);">Contenedores</span></div>
        </div>
        ${activeShift ? 
            `<button class="btn btn-secondary" id="btn-end-shift-jh-in" style="padding: 8px 12px; font-size: 0.7rem; height: auto;">CONCLUIR TURNO</button>` : 
            `<button class="btn btn-primary" id="btn-start-shift-jh-in" style="padding: 8px 12px; font-size: 0.7rem; height: auto;">EMPEZAR TURNO</button>`
        }
    </div>

    ${!activeShift ? `
    <div class="card" style="text-align: center; border: 2px dashed var(--border); background: var(--bg);">
        <i data-lucide="lock" style="width: 32px; height: 32px; color: var(--text-muted); margin-bottom: 12px;"></i>
        <h3 style="font-size: 0.9rem; color: var(--text-muted);">Debe iniciar turno para registrar ingresos</h3>
    </div>
    ` : `

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px;">
      <div class="card" style="padding: 12px; text-align: center; margin-bottom: 0;">
        <div style="font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">En Tránsito</div>
        <div style="font-size: 1.3rem; font-weight: 800; color: var(--secondary);">${inTransitCount}</div>
      </div>
      <div class="card" style="padding: 12px; text-align: center; margin-bottom: 0;">
        <div style="font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600;">En Recinto JH</div>
        <div style="font-size: 1.3rem; font-weight: 800; color: var(--success);">${inRecintoCount}</div>
      </div>
    </div>

    <div class="card">
      <h2 style="font-size: 1rem; font-weight: 700; margin-bottom: 12px;">Julia Herrera — Ingreso</h2>
      
      <div class="input-group" style="margin-bottom: 0;">
        <label>Buscar por últimos 4 dígitos</label>
        <input type="text" id="search-input" placeholder="EJ: 4567" maxlength="4" style="text-align: center; letter-spacing: 2px; font-size: 1.2rem;" />
      </div>

      <div id="feedback-jh" style="display: none; padding: 10px; border-radius: 8px; margin-top: 10px; text-align: center; font-size: 0.8rem; font-weight: 600;"></div>

      <div id="search-results" style="margin-top: 16px;">
        <div style="color: var(--text-muted); text-align: center; padding: 10px; font-size: 0.8rem;">
          Ingrese los últimos 4 dígitos para buscar.
        </div>
      </div>
    </div>
    `}
  </div>
  `;
};

JHIngresoView.init = (state, render) => {
  const btnStart = document.getElementById('btn-start-shift-jh-in');
  const btnEnd = document.getElementById('btn-end-shift-jh-in');

  if (btnStart) {
    btnStart.addEventListener('click', async () => {
      try {
        btnStart.disabled = true;
        await startShift(state.user.email, 'jh-in');
        const shift = await getActiveShift(state.user.email);
        state.activeShift = shift;
        render();
      } catch (err) {
        alert(err.message || 'El puesto Julia Herrera (Ingreso) ya está ocupado.');
        btnStart.disabled = false;
      }
    });
  }

  if (btnEnd) {
    btnEnd.addEventListener('click', async () => {
      if(!confirm('¿Concluir este turno?')) return;
      btnEnd.disabled = true;
      await endShift(state.activeShift.id);
      state.activeShift = null;
      render();
    });
  }

  if (!state.activeShift) return;
  const searchInput = document.getElementById('search-input');
  const resultsDir = document.getElementById('search-results');
  const feedbackJH = document.getElementById('feedback-jh');

  const showFeedback = (msg) => {
    feedbackJH.textContent = msg;
    feedbackJH.style.display = 'block';
    feedbackJH.style.background = 'rgba(16,185,129,0.1)';
    feedbackJH.style.color = 'var(--success)';
    setTimeout(() => { if(feedbackJH) feedbackJH.style.display = 'none'; }, 3000);
  };

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toUpperCase();
    if (query.length < 2) return;

    const matched = state.records.filter(r => {
      const cid = r.containerId || '';
      return cid.endsWith(query) && r.status === 'en_transito';
    });

    if (matched.length === 0) {
      resultsDir.innerHTML = `<div style="color: var(--text-muted); text-align: center; padding: 10px; font-size: 0.8rem;">No se encontraron contenedores en tránsito.</div>`;
      return;
    }

    resultsDir.innerHTML = matched.map(r => `
      <div class="card animate-in" style="padding: 16px; margin-bottom: 8px; border-left: 4px solid var(--secondary);">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-weight: 800; color: var(--text); font-family: monospace; font-size: 1.1rem;">${r.containerId}</div>
            <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 500;">${r.regime || ''} | ${r.declaration || 'S/D'}</div>
          </div>
          <button class="btn btn-primary btn-arrival" data-docid="${r.docId}" style="padding: 10px 16px; font-size: 0.75rem;">
            <i data-lucide="check" style="width: 16px;"></i> LLEGADA
          </button>
        </div>
      </div>
    `).join('');

    import('lucide').then(({ createIcons, Check }) => createIcons({ icons: { Check } }));

    document.querySelectorAll('.btn-arrival').forEach(btn => {
      btn.addEventListener('click', async () => {
        const docId = btn.dataset.docid;
        try {
          btn.disabled = true;
          btn.innerHTML = '<div class="spinner" style="width:14px; height:14px; border-width:2px; margin-bottom:0;"></div>';
          const record = state.records.find(r => r.docId === docId);
          const updateData = {
            ...record,
            docId: docId,
            t2: new Date().toISOString(),
            status: 'en_recinto',
            arrivedAtJHBy: state.user.email
          };
          await saveRecord(updateData, state.user.email);
          showFeedback('✓ Llegada registrada');
          searchInput.value = '';
          setTimeout(() => render(), 1000);
        } catch (err) {
          showFeedback('Error: ' + err.message, true);
          btn.disabled = false;
          btn.innerHTML = '<i data-lucide="check" style="width: 16px;"></i> LLEGADA';
        }
      });
    });
  });
};
