import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';

export const JHSalidaView = (state) => `
  <div class="animate-in">
    <div class="card glass">
      <h2 style="margin-bottom: 20px;">Julia Herrera - Salida</h2>
      
      <div class="input-group">
        <label>Buscar por últimos 4 dígitos del contenedor</label>
        <input type="text" id="search-input-out" placeholder="Ej: 0012" maxlength="4" style="font-size: 1.2rem; text-align: center; letter-spacing: 2px;" />
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

  const getStatusBadge = (status, fumigationHours) => {
      if (status === 'inspeccionado') return `<span style="background: rgba(16, 185, 129, 0.2); color: #10b981; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: bold;">✅ Inspeccionado</span>`;
      if (status === 'fumigacion') return `<span style="background: rgba(239, 68, 68, 0.2); color: #ef4444; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: bold;">💨 Fumigación (${fumigationHours}h)</span>`;
      if (status === 'problema_documental') return `<span style="background: rgba(245, 158, 11, 0.2); color: #f59e0b; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: bold;">⚠️ Problema Doc.</span>`;
      return '';
  };

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value;
    if (query.length < 2) return;

    // Filter by ending digits, and status must be one of the inspected ones
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
            resultsDir.innerHTML = `<div style="color: var(--danger); text-align: center; padding: 20px; background: rgba(239,68,68,0.1); border-radius: 8px;">
                <i data-lucide="alert-triangle" style="margin-bottom: 10px;"></i><br/>
                Hay contenedores con esos dígitos, pero <b>no han sido inspeccionados aún</b>. El inspector debe aprobarlos primero.
            </div>`;
            import('lucide').then(({ createIcons, AlertTriangle }) => createIcons({ icons: {AlertTriangle} }));
            return;
        }

        resultsDir.innerHTML = `<div style="color: var(--text-muted); text-align: center; padding: 20px;">No se encontraron contenedores inspeccionados con esos dígitos.</div>`;
        return;
    }

    resultsDir.innerHTML = matched.map(r => `
      <div class="glass animate-in" style="padding: 15px; margin-bottom: 15px; border-color: rgba(255,255,255,0.05); display: flex; flex-direction: column; gap: 15px;">
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <div>
            <div style="font-weight: 800; color: var(--secondary); font-size: 1.2rem; font-family: monospace;">${r.containerId}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 5px;">${r.placa || ''} | Ingreso: ${new Date(r.timestamp).toLocaleTimeString()}</div>
            <div style="margin-top: 8px;">
                ${getStatusBadge(r.status, r.fumigationDelayHours)}
            </div>
          </div>
        </div>
        
        <button class="btn btn-primary btn-dispatch" data-id="${r.id}" style="width: 100%; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; display: flex; align-items: center; justify-content: center; gap: 10px;">
          <i data-lucide="log-out"></i>
          REGISTRAR SALIDA DEFINITIVA
        </button>
      </div>
    `).join('');

    import('lucide').then(({ createIcons, LogOut }) => createIcons({ icons: {LogOut} }));

    document.querySelectorAll('.btn-dispatch').forEach(btn => {
      btn.addEventListener('click', async () => {
        if(!confirm('¿Confirmar salida definitiva de recinto?')) return;
        const id = btn.dataset.id;
        try {
            btn.disabled = true;
            btn.innerText = 'Despachando...';
            const recordRef = doc(db, "records", id);
            await updateDoc(recordRef, {
                status: 'finalizado',
                salidaTimestamp: new Date().toISOString(),
                salidaUserEmail: state.user.email
            });
            searchInput.value = '';
            resultsDir.innerHTML = `<div style="color: var(--success); text-align: center; padding: 20px;">¡Despacho Exitoso!</div>`;
        } catch (error) {
            console.error(error);
            alert('Error al despachar: ' + error.message);
            btn.disabled = false;
        }
      });
    });
  });
};
