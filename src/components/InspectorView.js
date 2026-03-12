import { db } from '../utils/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export const InspectorView = (state) => `
  <div class="animate-in">
    <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); margin-bottom: 20px;">
        <h2 style="margin: 0 0 15px 0; color: #f59e0b; display: flex; align-items: center; gap: 10px;">
            <i data-lucide="search"></i>
            Inspección JH
        </h2>
        <div class="input-group">
            <label>Buscar por últimos 4 dígitos del contenedor</label>
            <input type="text" id="search-digits" placeholder="Ej: 1234" maxlength="4" style="font-size: 1.2rem; text-align: center; letter-spacing: 2px;" />
        </div>
    </div>

    <!-- Resultados -->
    <div id="inspector-results" style="display: flex; flex-direction: column; gap: 15px;">
        <!-- Se llena con JS -->
    </div>
  </div>

  <!-- Modal Fumigación -->
  <div id="fumigation-modal" class="modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); align-items: center; justify-content: center; z-index: 1000;">
    <div class="card glass" style="width: 90%; max-width: 400px; padding: 25px;">
        <h3 style="margin: 0 0 15px 0;">Tiempo de Fumigación</h3>
        <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 20px;">
            Ingrese el tiempo estimado de retraso por fumigación para este contenedor.
        </p>
        <div class="input-group">
            <label>Horas de retraso</label>
            <input type="number" id="fumigation-hours" min="1" value="24" />
        </div>
        <div style="display: flex; gap: 10px; margin-top: 20px;">
            <button class="btn btn-secondary" style="flex: 1;" id="btn-cancel-fumigation">Cancelar</button>
            <button class="btn btn-primary" style="flex: 1; background: var(--danger);" id="btn-confirm-fumigation">Confirmar</button>
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
            resultsContainer.innerHTML = '<div style="text-align:center; color: var(--text-muted); padding: 20px;">Ingrese al menos 2 dígitos para buscar</div>';
            return;
        }

        // Filter records that are 'en_recinto' AND match the last digits
        const matchingRecords = state.records.filter(r => 
            r.status === 'en_recinto' && 
            r.containerId && 
            r.containerId.endsWith(searchTerm)
        );

        if (matchingRecords.length === 0) {
            resultsContainer.innerHTML = '<div style="text-align:center; color: var(--text-muted); padding: 20px;">No se encontraron contenedores pendientes en el recinto con esos dígitos.</div>';
            return;
        }

        resultsContainer.innerHTML = matchingRecords.map(record => `
            <div class="card glass" style="padding: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                    <div>
                        <h4 style="margin: 0; line-height: 1.2;">CONTENEDOR</h4>
                        <span style="font-family: monospace; font-size: 1.2rem; font-weight: bold;">${record.containerId}</span>
                    </div>
                    <div style="text-align: right;">
                        <span style="background: var(--surface); padding: 4px 8px; border-radius: 4px; font-size: 0.8rem;">${record.placa}</span>
                        <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 5px;">
                            Ingresó: ${new Date(record.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr; gap: 8px;">
                    <button class="btn btn-primary action-btn" data-id="${record.id}" data-action="inspeccionado" style="background: var(--success); display: flex; justify-content: center; align-items: center; gap: 8px;">
                        <i data-lucide="check-circle" style="width: 18px; height: 18px;"></i> Aprobado (Inspeccionado)
                    </button>
                    <button class="btn btn-secondary action-btn" data-id="${record.id}" data-action="fumigacion" style="color: var(--danger); border-color: var(--danger); display: flex; justify-content: center; align-items: center; gap: 8px;">
                        <i data-lucide="wind" style="width: 18px; height: 18px;"></i> Requiere Fumigación
                    </button>
                    <button class="btn btn-secondary action-btn" data-id="${record.id}" data-action="problema_documental" style="color: #f59e0b; border-color: #f59e0b; display: flex; justify-content: center; align-items: center; gap: 8px;">
                        <i data-lucide="file-warning" style="width: 18px; height: 18px;"></i> Problema Documental
                    </button>
                </div>
            </div>
        `).join('');

        // Needs to re-initialize icons for new DOM elements
        import('lucide').then(({ createIcons, CheckCircle, Wind, FileWarning }) => {
            createIcons({
                icons: { CheckCircle, Wind, FileWarning }
            });
        });

        // Add event listeners to the new buttons
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', handleAction);
        });
    };

    const handleAction = async (e) => {
        const btn = e.currentTarget;
        const id = btn.dataset.id;
        const action = btn.dataset.action;

        if (action === 'inspeccionado' || action === 'problema_documental') {
            if(confirm(`¿Está seguro de marcar este contenedor como ${action.replace('_', ' ')}?`)) {
                btn.disabled = true;
                btn.innerHTML = 'Actualizando...';
                try {
                    const recordRef = doc(db, 'records', id);
                    await updateDoc(recordRef, {
                        status: action,
                        inspectorTimestamp: new Date().toISOString()
                    });
                    // Will auto-update via re-render due to snapshot listener
                    searchInput.value = '';
                    renderResults('');
                } catch (err) {
                    console.error('Error actualizando:', err);
                    alert('Hubo un error al actualizar el estado.');
                    btn.disabled = false;
                }
            }
        } else if (action === 'fumigacion') {
            selectedRecordId = id;
            fumigationModal.style.display = 'flex';
        }
    };

    // Modal Events
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
            console.error('Error:', err);
            alert('Error al actualizar fumigación');
        } finally {
            btn.disabled = false;
            btn.innerText = 'Confirmar';
        }
    });

    // Search Input Event
    searchInput.addEventListener('input', (e) => {
        renderResults(e.target.value);
    });
};
