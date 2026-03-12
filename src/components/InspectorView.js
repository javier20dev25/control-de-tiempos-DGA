import { db, saveRecord } from '../utils/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { startShift, endShift, getActiveShift } from '../utils/shifts';

export const InspectorView = (state) => {
    const activeShift = state.activeShift;
    const shiftStartTime = activeShift ? new Date(activeShift.startTime.seconds * 1000) : null;

    const now = new Date();
    const defaultShiftStart = new Date(now);
    defaultShiftStart.setHours(7, 0, 0, 0);
    if (now.getHours() < 7) defaultShiftStart.setDate(defaultShiftStart.getDate() - 1);

    const effectiveStart = shiftStartTime || defaultShiftStart;

    const shiftCount = state.records.filter(r => 
        r.inspectorEmail === state.user.email && 
        new Date(r.inspectorTimestamp) >= effectiveStart &&
        r.regime !== 'VACIO' && r.regime !== 'TRASLADO'
    ).length;

    return `
    <div class="animate-in">
        <div>
            <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 500; text-transform: uppercase;">Mi Turno Real</div>
            <div style="font-size: 1.2rem; font-weight: 800; color: var(--text);">${shiftCount} <span style="font-size: 0.8rem; font-weight: 500; color: var(--text-muted);">Inspeccionados</span></div>
        </div>
        ${activeShift ? 
            `<button class="btn btn-secondary" id="btn-end-shift-insp" style="padding: 8px 12px; font-size: 0.7rem; height: auto;">CONCLUIR TURNO</button>` : 
            `<button class="btn btn-primary" id="btn-start-shift-insp" style="padding: 8px 12px; font-size: 0.7rem; height: auto;">EMPEZAR TURNO</button>`
        }
    </div>

    ${!activeShift ? `
    <div class="card" style="text-align: center; border: 2px dashed var(--border); background: var(--bg);">
        <i data-lucide="search" style="width: 32px; height: 32px; color: var(--text-muted); margin-bottom: 12px;"></i>
        <h3 style="font-size: 0.9rem; color: var(--text-muted);">Debe iniciar turno para realizar inspecciones</h3>
    </div>
    ` : `

        <div class="card">
            <h2 style="font-size: 1rem; font-weight: 700; margin-bottom: 12px;">Inspección JH</h2>
            <div class="input-group" style="margin-bottom: 0;">
                <label>Buscar por últimos 4 dígitos</label>
                <input type="text" id="search-digits" placeholder="EJ: 4521" maxlength="4" style="font-size: 1.2rem; text-align: center; letter-spacing: 2px;" />
            </div>
            <div id="feedback-msg" style="display: none; padding: 10px; border-radius: 8px; font-size: 0.8rem; margin-top: 10px; text-align: center; font-weight: 600;"></div>
        </div>

        <div id="inspector-results" style="display: flex; flex-direction: column; gap: 10px;"></div>
    </div>
    `}

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
};

InspectorView.init = (state, render) => {
    const btnStart = document.getElementById('btn-start-shift-insp');
    const btnEnd = document.getElementById('btn-end-shift-insp');

    if (btnStart) {
        btnStart.addEventListener('click', async () => {
            try {
                btnStart.disabled = true;
                await startShift(state.user.email, 'inspector');
                const shift = await getActiveShift(state.user.email);
                state.activeShift = shift;
                render();
            } catch (err) {
                alert(err.message || 'Ya hay un inspector activo en el recinto.');
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
    const searchInput = document.getElementById('search-digits');
    const resultsContainer = document.getElementById('inspector-results');
    const fumigationModal = document.getElementById('fumigation-modal');
    const feedbackMsg = document.getElementById('feedback-msg');
    let selectedDocId = null;

    const showFeedback = (msg, isError = false) => {
        feedbackMsg.textContent = msg;
        feedbackMsg.style.display = 'block';
        feedbackMsg.style.background = isError ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)';
        feedbackMsg.style.color = isError ? 'var(--accent)' : 'var(--success)';
        setTimeout(() => { if(feedbackMsg) feedbackMsg.style.display = 'none'; }, 3000);
    };

    const renderResults = (searchTerm) => {
        if (!searchTerm || searchTerm.length < 2) {
            resultsContainer.innerHTML = '<div style="text-align:center; color: var(--text-muted); padding: 20px; font-size: 0.85rem;">Ingrese al menos 2 dígitos</div>';
            return;
        }

        const matchingRecords = state.records.filter(r => 
            r.status === 'en_recinto' && 
            r.containerId && 
            r.containerId.endsWith(searchTerm.toUpperCase())
        );

        if (matchingRecords.length === 0) {
            resultsContainer.innerHTML = '<div style="text-align:center; color: var(--text-muted); padding: 10px; font-size: 0.8rem;">No hay contenedores en recinto que coincidan.</div>';
            return;
        }

        resultsContainer.innerHTML = matchingRecords.map(record => `
            <div class="card animate-in" style="padding: 16px; border-left: 4px solid var(--primary);">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 14px;">
                    <div>
                        <div style="font-size: 0.65rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Contenedor</div>
                        <span style="font-family: monospace; font-size: 1.1rem; font-weight: 800;">${record.containerId}</span>
                    </div>
                    <div style="text-align: right;">
                        <span style="background: var(--bg); padding: 3px 8px; border-radius: 6px; font-size: 0.7rem; border: 1px solid var(--border); font-weight: 700;">${record.regime || 'S/R'}</span>
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                    <button class="btn btn-primary action-btn" data-docid="${record.docId}" data-action="inspeccionado" style="background: var(--success); grid-column: span 2;">
                        <i data-lucide="check-circle" style="width: 16px;"></i> APROBAR
                    </button>
                    <button class="btn btn-secondary action-btn" data-docid="${record.docId}" data-action="fumigacion" style="color: var(--accent); border-color: var(--accent); font-size: 0.75rem;">
                        <i data-lucide="wind" style="width: 14px;"></i> FUMIGAR
                    </button>
                    <button class="btn btn-secondary action-btn" data-docid="${record.docId}" data-action="problema_documental" style="color: var(--warning); border-color: var(--warning); font-size: 0.75rem;">
                        <i data-lucide="file-warning" style="width: 14px;"></i> DOCS
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
        const docId = btn.dataset.docid;
        const action = btn.dataset.action;

        if (action === 'inspeccionado' || action === 'problema_documental') {
            btn.disabled = true;
            btn.innerHTML = '<div class="spinner" style="width:14px; height:14px; border-width:2px; margin-bottom:0;"></div>';
            
            try {
                const record = state.records.find(r => r.docId === docId);
                const updateData = {
                    ...record,
                    docId: docId,
                    status: action,
                    inspectorTimestamp: new Date().toISOString(),
                    inspectorEmail: state.user.email
                };
                await saveRecord(updateData, state.user.email);
                showFeedback(action === 'inspeccionado' ? '¡Inspección aprobada!' : 'Registrado problema documental');
                searchInput.value = '';
                // Wait a bit before rendering so the user sees the feedback
                setTimeout(() => render(), 1000);
            } catch (err) {
                showFeedback('Error: ' + err.message, true);
                btn.disabled = false;
                btn.innerHTML = action === 'inspeccionado' ? 'APROBAR' : 'DOCS';
            }
        } else if (action === 'fumigacion') {
            selectedDocId = docId;
            fumigationModal.style.display = 'flex';
        }
    };

    document.getElementById('btn-cancel-fumigation').addEventListener('click', () => {
        fumigationModal.style.display = 'none';
        selectedDocId = null;
    });

    document.getElementById('btn-confirm-fumigation').addEventListener('click', async (e) => {
        if (!selectedDocId) return;
        const hours = document.getElementById('fumigation-hours').value;
        const btn = e.currentTarget;
        
        btn.disabled = true;
        btn.innerText = 'Guardando...';

        try {
            const record = state.records.find(r => r.docId === selectedDocId);
            const updateData = {
                ...record,
                docId: selectedDocId,
                status: 'fumigacion',
                inspectorTimestamp: new Date().toISOString(),
                inspectorEmail: state.user.email,
                fumigationDelayHours: parseInt(hours, 10)
            };
            await saveRecord(updateData, state.user.email);
            fumigationModal.style.display = 'none';
            selectedDocId = null;
            showFeedback('Enviado a fumigación');
            searchInput.value = '';
            setTimeout(() => render(), 1000);
        } catch (err) {
            showFeedback('Error: ' + err.message, true);
        } finally {
            btn.disabled = false;
            btn.innerText = 'Confirmar';
        }
    });

    searchInput.addEventListener('input', (e) => {
        renderResults(e.target.value);
    });
};
