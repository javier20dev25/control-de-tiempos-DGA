import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';

export const JHSalidaView = (state) => `
  <div class="animate-in">
    <div class="card">
      <h2 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 16px;">Julia Herrera — Salida</h2>
      
      <div class="input-group">
        <label>Buscar por últimos 4 dígitos</label>
        <input type="text" id="search-input-out" placeholder="Ej: 0012" maxlength="4" style="font-size: 1.2rem; text-align: center; letter-spacing: 2px;" />
      </div>

      <div id="search-results-out" style="margin-top: 16px;">
        <div style="color: var(--text-muted); text-align: center; padding: 20px; font-size: 0.85rem;">
          Ingrese los últimos 4 dígitos para despachar.
        </div>
      </div>
    </div>
  </div>
`;

JHSalidaView.init = (state, render) => {
  const searchInput = document.getElementById('search-input-out');
  const resultsDir = document.getElementById('search-results-out');

  const getStatusBadge = (status, fumigationHours) => {
      if (status === 'inspeccionado') return `<span style="background: rgba(16,185,129,0.1); color: var(--success); padding: 3px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 600;">Aprobado</span>`;
      if (status === 'fumigacion') return `<span style="background: rgba(239,68,68,0.1); color: var(--accent); padding: 3px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 600;">Fumigación (${fumigationHours}h)</span>`;
      if (status === 'problema_documental') return `<span style="background: rgba(245,158,11,0.1); color: var(--warning); padding: 3px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 600;">Problema Doc.</span>`;
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
            resultsDir.innerHTML = `<div style="color: var(--accent); text-align: center; padding: 16px; background: rgba(239,68,68,0.05); border-radius: 8px; border: 1px solid rgba(239,68,68,0.15); font-size: 0.85rem;">
                <i data-lucide="alert-triangle" style="margin-bottom: 8px; width: 20px;"></i><br/>
                Contenedores encontrados pero <b>no inspeccionados</b>. El inspector debe aprobarlos primero.
            </div>`;
            import('lucide').then(({ createIcons, AlertTriangle }) => createIcons({ icons: {AlertTriangle} }));
            return;
        }

        resultsDir.innerHTML = `<div style="color: var(--text-muted); text-align: center; padding: 20px; font-size: 0.85rem;">No se encontraron contenedores inspeccionados.</div>`;
        return;
    }

    resultsDir.innerHTML = matched.map(r => `
      <div class="card" style="padding: 16px; margin-bottom: 10px;">
        <div style="margin-bottom: 12px;">
          <div style="font-weight: 700; font-family: monospace; font-size: 1.1rem; color: var(--primary);">${r.containerId}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">${r.regime || ''} | ${r.declaration || 'S/D'}</div>
          <div style="margin-top: 8px;">${getStatusBadge(r.status, r.fumigationDelayHours)}</div>
        </div>
        
        <button class="btn btn-primary btn-dispatch" data-docid="${r.docId}" style="width: 100%; background: var(--success); font-size: 0.85rem;">
          <i data-lucide="log-out" style="width: 16px;"></i>
          SALIDA DEFINITIVA
        </button>
      </div>
    `).join('');

    import('lucide').then(({ createIcons, LogOut }) => createIcons({ icons: {LogOut} }));

    document.querySelectorAll('.btn-dispatch').forEach(btn => {
      btn.addEventListener('click', async () => {
        if(!confirm('¿Confirmar salida definitiva?')) return;
        const docId = btn.dataset.docid;
        try {
            btn.disabled = true;
            btn.innerText = 'Despachando...';
            const recordRef = doc(db, "records", docId);
            await updateDoc(recordRef, {
                status: 'finalizado',
                t3: new Date().toISOString(),
                salidaTimestamp: new Date().toISOString(),
                salidaUserEmail: state.user.email
            });
            searchInput.value = '';
            resultsDir.innerHTML = `<div style="color: var(--success); text-align: center; padding: 20px; font-weight: 600;">✓ Despacho Exitoso</div>`;
        } catch (error) {
            alert('Error: ' + error.message);
            btn.disabled = false;
        }
      });
    });
  });
};
