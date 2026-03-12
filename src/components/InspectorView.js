import { db } from '../utils/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export const InspectorView = (state) => `
  <div class="animate-in">
    <div class="card">
        <h2 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
            <i data-lucide="search" style="width: 20px; color: var(--warning);"></i>
            Inspección JH
        </h2>
        <div class="input-group">
            <label>Buscar por últimos 4 dígitos</label>
            <input type="text" id="search-digits" placeholder="Ej: 1234" maxlength="4" style="font-size: 1.2rem; text-align: center; letter-spacing: 2px;" />
        </div>
    </div>

    <div id="inspector-results" style="display: flex; flex-direction: column; gap: 10px;"></div>
  </div>

  <!-- Modal Fumigación -->
  <div id="fumigation-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.3); align-items: center; justify-content: center; z-index: 1000;">
    <div class="card" style="width: 90%; max-width: 400px; padding: 24px;">
        <h3 style="font-size: 1rem; font-weight: 700; margin-bottom: 8px;">Tiempo de Fumigación</h3>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px;">
            Ingrese el tiempo estimado de retraso.
        </p>
        <div class="input-group">
            <label>Horas de retraso</label>
            <input type="number" id="fumigation-hours" min="1" value="24" />
        </div>
        <div style="display: flex; gap: 10px; margin-top: 16px;">
            <button class="btn btn-secondary" style="flex: 1;" id="btn-cancel-fumigation">Cancelar</button>
            <button class="btn btn-primary" style="flex: 1; background: var(--accent);" id="btn-confirm-fumigation">Confirmar</button>
        </div>
    </div>
  </div>
`;

InspectorView.init = (state, render) => {
    const searchInput = document.getElementById('search-digits');
    const resultsContainer = document.getElementById('inspector-results');
    const fumigationModal = document.getElementById('fumigation-modal');
    let selectedRecordId = null;

    const renderResults = (searchTerm) => {
        if (!searchTerm || searchTerm.length < 2) {
            resultsContainer.innerHTML = '<div style="text-align:center; color: var(--text-muted); padding: 20px; font-size: 0.85rem;">Ingrese al menos 2 dígitos</div>';
            return;
        }

        const matchingRecords = state.records.filter(r => 
            r.status === 'en_recinto' && 
            r.containerId && 
            r.containerId.endsWith(searchTerm)
        );

        if (matchingRecords.length === 0) {
            resultsContainer.innerHTML = '<div style="text-align:center; color: var(--text-muted); padding: 20px; font-size: 0.85rem;">No se encontraron contenedores pendientes.</div>';
            return;
        }

        resultsContainer.innerHTML = matchingRecords.map(record => `
            <div class="card" style="padding: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 14px;">
                    <div>
                        <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 500;">CONTENEDOR</div>
                        <span style="font-family: monospace; font-size: 1.1rem; font-weight: 700;">${record.containerId}</span>
                    </div>
                    <div style="text-align: right;">
                        <span style="background: var(--bg); padding: 3px 8px; border-radius: 6px; font-size: 0.75rem; border: 1px solid var(--border);">${record.placa}</span>
                        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">
                            ${new Date(record.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                    </div>
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <button class="btn btn-primary action-btn" data-id="${record.id}" data-action="inspeccionado" style="background: var(--success); font-size: 0.8rem;">
                        <i data-lucide="check-circle" style="width: 16px;"></i> Aprobado
                    </button>
                    <button class="btn btn-secondary action-btn" data-id="${record.id}" data-action="fumigacion" style="color: var(--accent); border-color: var(--accent); font-size: 0.8rem;">
                        <i data-lucide="wind" style="width: 16px;"></i> Fumigación
                    </button>
                    <button class="btn btn-secondary action-btn" data-id="${record.id}" data-action="problema_documental" style="color: var(--warning); border-color: var(--warning); font-size: 0.8rem;">
                        <i data-lucide="file-warning" style="width: 16px;"></i> Problema Documental
                    </button>
                </div>
            </div>
        `).join('');

        import('lucide').then(({ createIcons, CheckCircle, Wind, FileWarning }) => {
            createIcons({ icons: { CheckCircle, Wind, FileWarning } });
        });

        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', handleAction);
        });
    };

    const handleAction = async (e) => {
        const btn = e.currentTarget;
        const id = btn.dataset.id;
        const action = btn.dataset.action;

        if (action === 'inspeccionado' || action === 'problema_documental') {
            if(confirm(`¿Marcar como ${action.replace('_', ' ')}?`)) {
                btn.disabled = true;
                btn.innerHTML = 'Actualizando...';
                try {
                    const recordRef = doc(db, 'records', id);
                    await updateDoc(recordRef, {
                        status: action,
                        inspectorTimestamp: new Date().toISOString()
                    });
                    searchInput.value = '';
                    renderResults('');
                } catch (err) {
                    alert('Error al actualizar.');
                    btn.disabled = false;
                }
            }
        } else if (action === 'fumigacion') {
            selectedRecordId = id;
            fumigationModal.style.display = 'flex';
        }
    };

    document.getElementById('btn-cancel-fumigation').addEventListener('click', () => {
        fumigationModal.style.display = 'none';
        selectedRecordId = null;
    });

    document.getElementById('btn-confirm-fumigation').addEventListener('click', async (e) => {
        if (!selectedRecordId) return;
        const hours = document.getElementById('fumigation-hours').value;
        const btn = e.currentTarget;
        
        btn.disabled = true;
        btn.innerText = 'Guardando...';

        try {
            const recordRef = doc(db, 'records', selectedRecordId);
            await updateDoc(recordRef, {
                status: 'fumigacion',
                inspectorTimestamp: new Date().toISOString(),
                fumigationDelayHours: parseInt(hours, 10)
            });
            fumigationModal.style.display = 'none';
            selectedRecordId = null;
            searchInput.value = '';
            renderResults('');
        } catch (err) {
            alert('Error al actualizar fumigación');
        } finally {
            btn.disabled = false;
            btn.innerText = 'Confirmar';
        }
    });

    searchInput.addEventListener('input', (e) => {
        renderResults(e.target.value);
    });
};
