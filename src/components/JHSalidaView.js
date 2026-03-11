export const JHSalidaView = (state) => `
  <div class="animate-in">
    <div class="card glass">
      <h2 style="margin-bottom: 20px;">Julia Herrera - Salida</h2>
      
      <div class="input-group">
        <label>Buscar por últimos 4 dígitos del contenedor</label>
        <input type="text" id="search-input-out" placeholder="Ej: 0012" maxlength="4" />
      </div>

      <div id="search-results-out" style="margin-top: 20px;">
        <div style="color: var(--text-muted); text-align: center; padding: 20px;">
          Ingrese los últimos 4 dígitos para despachar contenedores ingresados.
        </div>
      </div>
    </div>
  </div>
`;

JHSalidaView.init = (state, render) => {
  const searchInput = document.getElementById('search-input-out');
  const resultsDir = document.getElementById('search-results-out');

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value;
    if (query.length < 2) return;

    const matched = state.records.filter(r => r.id.endsWith(query) && r.t2 && !r.t3);

    if (matched.length === 0) {
      resultsDir.innerHTML = `<div style="color: var(--text-muted); text-align: center; padding: 20px;">No se encontraron contenedores dentro del recinto.</div>`;
      return;
    }

    resultsDir.innerHTML = matched.map(r => `
      <div class="glass animate-in" style="padding: 15px; margin-bottom: 15px; border-color: rgba(255,255,255,0.05);">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-weight: 800; color: var(--secondary);">${r.id}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">${r.regime} | Ingreso: ${new Date(r.t2).toLocaleTimeString()}</div>
          </div>
          <button class="btn btn-primary btn-dispatch" data-id="${r.timestamp}" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white;">
            <i data-lucide="log-out"></i>
            DESPACHAR
          </button>
        </div>
      </div>
    `).join('');

    document.querySelectorAll('.btn-dispatch').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const record = state.records.find(r => r.timestamp == id);
        if (record) {
          import('../utils/firebase').then(async ({ db }) => {
            const { doc, updateDoc } = await import('firebase/firestore');
            const recordRef = doc(db, "records", record.id);
            await updateDoc(recordRef, {
              t3: new Date().toISOString(),
              dispatchedFromJHBy: state.user.email
            });
            alert('Despacho confirmado');
          });
        }
      });
    });
  });
};
