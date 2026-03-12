import { db } from '../utils/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export const JHIngresoView = (state) => {
  const inRecintoCount = state.records.filter(r => r.status === 'en_recinto').length;
  const inTransitCount = state.records.filter(r => r.status === 'en_transito').length;

  return `
  <div class="animate-in">
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px;">
      <div class="card" style="padding: 12px; text-align: center; margin-bottom: 0;">
        <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">En Tránsito</div>
        <div style="font-size: 1.3rem; font-weight: 800; color: var(--secondary);">${inTransitCount}</div>
      </div>
      <div class="card" style="padding: 12px; text-align: center; margin-bottom: 0;">
        <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">En Recinto JH</div>
        <div style="font-size: 1.3rem; font-weight: 800; color: var(--success);">${inRecintoCount}</div>
      </div>
    </div>

    <div class="card">
      <h2 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 16px;">Julia Herrera — Ingreso</h2>
      
      <div class="input-group">
        <label>Buscar por últimos 4 dígitos</label>
        <input type="text" id="search-input" placeholder="Ej: 0012" maxlength="4" style="text-align: center; letter-spacing: 2px; font-size: 1.2rem;" />
      </div>

      <div id="feedback-jh" style="display: none; padding: 10px; border-radius: 8px; margin-bottom: 12px; text-align: center; font-size: 0.85rem; font-weight: 600;"></div>

      <div id="search-results" style="margin-top: 16px;">
        <div style="color: var(--text-muted); text-align: center; padding: 20px; font-size: 0.85rem;">
          Ingrese los últimos 4 dígitos para buscar contenedores en tránsito.
        </div>
      </div>
    </div>
  </div>
  `;
};

JHIngresoView.init = (state, render) => {
  const searchInput = document.getElementById('search-input');
  const resultsDir = document.getElementById('search-results');
  const feedbackJH = document.getElementById('feedback-jh');

  const showFeedback = (msg) => {
    feedbackJH.textContent = msg;
    feedbackJH.style.display = 'block';
    feedbackJH.style.background = 'rgba(16,185,129,0.1)';
    feedbackJH.style.color = 'var(--success)';
    setTimeout(() => { feedbackJH.style.display = 'none'; }, 3000);
  };

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toUpperCase();
    if (query.length < 2) {
      resultsDir.innerHTML = `<div style="color: var(--text-muted); text-align: center; padding: 20px; font-size: 0.85rem;">Mínimo 2 dígitos...</div>`;
      return;
    }

    // Search by containerId and filter "en_transito" status
    const matched = state.records.filter(r => {
      const cid = r.containerId || '';
      return cid.endsWith(query) && r.status === 'en_transito';
    });

    if (matched.length === 0) {
      resultsDir.innerHTML = `<div style="color: var(--text-muted); text-align: center; padding: 20px; font-size: 0.85rem;">No se encontraron contenedores en tránsito.</div>`;
      return;
    }

    resultsDir.innerHTML = matched.map(r => `
      <div class="card" style="padding: 14px; margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-weight: 700; color: var(--primary); font-family: monospace;">${r.containerId}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${r.regime || ''} | ${r.declaration || 'S/D'}</div>
          </div>
          <button class="btn btn-primary btn-arrival" data-docid="${r.docId}" style="padding: 8px 16px; font-size: 0.8rem;">
            <i data-lucide="check" style="width: 16px;"></i>
            LLEGADA
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
          btn.innerHTML = 'Registrando...';
          const recordRef = doc(db, "records", docId);
          await updateDoc(recordRef, {
            t2: new Date().toISOString(),
            status: 'en_recinto',
            arrivedAtJHBy: state.user.email
          });
          showFeedback('✓ Llegada registrada al recinto JH');
          searchInput.value = '';
          resultsDir.innerHTML = '';
        } catch (err) {
          alert('Error: ' + err.message);
          btn.disabled = false;
        }
      });
    });
  });
};
