export const JHIngresoView = (state) => `
  <div class="animate-in">
    <div class="card glass">
      <h2 style="margin-bottom: 20px;">Julia Herrera - Ingreso</h2>
      
      <div class="input-group">
        <label>Buscar por últimos 4 dígitos del contenedor</label>
        <input type="text" id="search-input" placeholder="Ej: 0012" maxlength="4" />
      </div>

      <div id="search-results" style="margin-top: 20px;">
        <div style="color: var(--text-muted); text-align: center; padding: 20px;">
          Ingrese los últimos 4 dígitos para buscar contenedores en tránsito.
        </div>
      </div>
    </div>
  </div>
`;

JHIngresoView.init = (state, render) => {
  const searchInput = document.getElementById('search-input');
  const resultsDir = document.getElementById('search-results');

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value;
    if (query.length < 2) {
      resultsDir.innerHTML = `<div style="color: var(--text-muted); text-align: center; padding: 20px;">Mínimo 2 dígitos...</div>`;
      return;
    }

    const matched = state.records.filter(r => r.id.endsWith(query) && !r.t2);

    if (matched.length === 0) {
      resultsDir.innerHTML = `<div style="color: var(--text-muted); text-align: center; padding: 20px;">No se encontraron contenedores pendientes.</div>`;
      return;
    }

    resultsDir.innerHTML = matched.map(r => `
      <div class="glass animate-in" style="padding: 15px; margin-bottom: 15px; border-color: rgba(255,255,255,0.05);">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-weight: 800; color: var(--primary);">${r.id}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">${r.regime} | ${r.declaration || 'S/D'}</div>
          </div>
          <button class="btn btn-primary btn-arrival" data-id="${r.timestamp}">
            <i data-lucide="check"></i>
            LLEGADA
          </button>
        </div>
      </div>
    `).join('');

    document.querySelectorAll('.btn-arrival').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const record = state.records.find(r => r.timestamp == id);
        if (record) {
          import('../utils/firebase').then(async ({ db }) => {
            const { doc, updateDoc } = await import('firebase/firestore');
            const recordRef = doc(db, "records", record.id);
            await updateDoc(recordRef, {
              t2: new Date().toISOString(),
              arrivedAtJHBy: state.user.email
            });
            alert('Llegada confirmada');
          });
        }
      });
    });
  });
};
