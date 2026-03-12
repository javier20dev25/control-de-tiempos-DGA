import { validateContainer, sanitizeContainer } from '../utils/validation';
import { saveRecord, db } from '../utils/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export const Gate5View = (state) => {
  const recentRecords = state.records.filter(r => !r.t3).slice(0, 5);

  return `
  <div class="animate-in">
    <div class="card">
      <h2 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 16px;">Portón 5 — Salida</h2>
      
      <div class="regime-grid">
        <button class="btn btn-secondary regime-btn" data-regime="VACIO">
          <i data-lucide="package" style="width: 20px;"></i>
          VACÍO
        </button>
        <button class="btn btn-secondary regime-btn" data-regime="TRASLADO">
          <i data-lucide="truck" style="width: 20px;"></i>
          TRASLADO
        </button>
        <button class="btn btn-secondary regime-btn" data-regime="VERDE">
          <i data-lucide="check-circle" style="width: 20px;"></i>
          VERDE (L-)
        </button>
        <button class="btn btn-secondary regime-btn" data-regime="TRANSITO">
          <i data-lucide="compass" style="width: 20px;"></i>
          TRÁNSITO (D-)
        </button>
      </div>

      <div class="input-group">
        <label>Declaración / Duca</label>
        <input type="text" id="declaration-input" placeholder="L-12345 o D-12345" />
      </div>

      <div class="input-group">
        <label>Contenedor (ABCD1234567)</label>
        <div style="display: flex; gap: 8px;">
          <input type="text" id="container-input" placeholder="ABCD1234567" maxlength="11" />
          <button class="btn btn-secondary" id="btn-scan" title="Escanear" style="padding: 12px;">
            <i data-lucide="camera" style="width: 18px;"></i>
          </button>
        </div>
      </div>

      <div id="feedback-msg" style="display: none; padding: 10px; border-radius: 8px; margin-bottom: 12px; text-align: center; font-size: 0.85rem; font-weight: 600;"></div>

      <button class="btn btn-primary" style="width: 100%;" id="btn-add">
        <i data-lucide="plus" style="width: 18px;"></i>
        REGISTRAR SALIDA
      </button>
    </div>

    <div id="scan-container" style="display: none;" class="card">
        <video id="video" style="width: 100%; border-radius: 8px;"></video>
        <button class="btn btn-secondary" style="width: 100%; margin-top: 10px;" id="btn-close-scan">CERRAR CÁMARA</button>
    </div>

    <div class="card">
      <h3 style="font-size: 0.95rem; font-weight: 600; margin-bottom: 12px;">Recientes</h3>
      <div id="recent-list">
        ${recentRecords.length === 0 ? '<div style="color: var(--text-muted); text-align: center; padding: 16px; font-size: 0.85rem;">Sin registros aún</div>' : ''}
        ${recentRecords.map(r => `
          <div style="padding: 10px 0; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-weight: 600; font-size: 0.9rem; font-family: monospace;">${r.containerId || r.id}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">${r.regime || ''} | ${r.declaration || 'S/D'}</div>
            </div>
            <div style="display: flex; gap: 6px;">
              <button class="btn-icon btn-edit" data-docid="${r.docId}" data-container="${r.containerId}" data-declaration="${r.declaration || ''}" data-regime="${r.regime || ''}" style="color: var(--primary);">
                <i data-lucide="edit-2" style="width: 16px;"></i>
              </button>
              <button class="btn-icon btn-delete" data-docid="${r.docId}" style="color: var(--accent);">
                <i data-lucide="trash-2" style="width: 16px;"></i>
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  </div>
  `;
};

Gate5View.init = (state, render) => {
  let selectedRegime = null;
  let editingDocId = null; // Track if we're editing an existing record
  const containerInput = document.getElementById('container-input');
  const declarationInput = document.getElementById('declaration-input');
  const feedbackMsg = document.getElementById('feedback-msg');

  const showFeedback = (msg, isError = false) => {
    feedbackMsg.textContent = msg;
    feedbackMsg.style.display = 'block';
    feedbackMsg.style.background = isError ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)';
    feedbackMsg.style.color = isError ? 'var(--accent)' : 'var(--success)';
    setTimeout(() => { feedbackMsg.style.display = 'none'; }, 3000);
  };

  // Regime selection + auto-fill declaration
  document.querySelectorAll('.regime-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.regime-btn').forEach(b => {
        b.classList.remove('btn-primary');
        b.classList.add('btn-secondary');
      });
      btn.classList.remove('btn-secondary');
      btn.classList.add('btn-primary');
      selectedRegime = btn.dataset.regime;

      if (selectedRegime === 'VERDE') declarationInput.value = 'L-';
      else if (selectedRegime === 'TRANSITO') declarationInput.value = 'D-';
      else declarationInput.value = '';
      declarationInput.focus();
    });
  });

  containerInput.addEventListener('input', (e) => {
    e.target.value = sanitizeContainer(e.target.value);
  });

  // Register / Save
  document.getElementById('btn-add').addEventListener('click', async () => {
    const containerId = containerInput.value;
    const declaration = declarationInput.value;

    if (!selectedRegime) { showFeedback('Seleccione un régimen', true); return; }
    if (!validateContainer(containerId)) { showFeedback('Formato: 4 letras + 7 dígitos', true); return; }

    const btnAdd = document.getElementById('btn-add');
    btnAdd.disabled = true;
    btnAdd.innerHTML = 'Guardando...';

    try {
      if (editingDocId) {
        // Update existing record (keep original timestamps)
        const recordRef = doc(db, "records", editingDocId);
        await updateDoc(recordRef, {
          containerId: containerId,
          declaration: declaration,
          regime: selectedRegime,
          editedBy: state.user.email,
          editedAt: new Date().toISOString()
        });
        showFeedback('✓ Registro actualizado');
        editingDocId = null;
        btnAdd.innerHTML = '<i data-lucide="plus" style="width: 18px;"></i> REGISTRAR SALIDA';
      } else {
        // New record
        const record = {
          containerId: containerId,
          regime: selectedRegime,
          declaration: declaration,
          t1: new Date().toISOString(),
          timestamp: Date.now(),
          status: 'en_transito',
          createdBy: state.user.email,
        };
        await saveRecord(record);
        showFeedback('✓ Salida registrada');
      }

      containerInput.value = '';
      declarationInput.value = '';
      selectedRegime = null;
      document.querySelectorAll('.regime-btn').forEach(b => {
        b.classList.remove('btn-primary');
        b.classList.add('btn-secondary');
      });
    } catch (err) {
      showFeedback('Error al guardar: ' + err.message, true);
    }

    btnAdd.disabled = false;
    // Re-render icons
    import('lucide').then(({ createIcons, Plus }) => createIcons({ icons: { Plus } }));
  });

  // Edit button
  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => {
      editingDocId = btn.dataset.docid;
      containerInput.value = btn.dataset.container || '';
      declarationInput.value = btn.dataset.declaration || '';
      const regime = btn.dataset.regime;
      
      // Select the matching regime button
      document.querySelectorAll('.regime-btn').forEach(b => {
        b.classList.remove('btn-primary');
        b.classList.add('btn-secondary');
        if (b.dataset.regime === regime) {
          b.classList.remove('btn-secondary');
          b.classList.add('btn-primary');
          selectedRegime = regime;
        }
      });

      const btnAdd = document.getElementById('btn-add');
      btnAdd.innerHTML = '<i data-lucide="edit-2" style="width: 18px;"></i> GUARDAR CAMBIOS';
      import('lucide').then(({ createIcons, Edit2 }) => createIcons({ icons: { Edit2 } }));

      containerInput.focus();
      showFeedback('Editando registro — modifique y guarde');
    });
  });

  // Delete button
  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('¿Eliminar este registro?')) return;
      const docId = btn.dataset.docid;
      try {
        const { deleteDoc } = await import('firebase/firestore');
        await deleteDoc(doc(db, "records", docId));
        showFeedback('Registro eliminado');
      } catch (err) {
        showFeedback('Error al eliminar', true);
      }
    });
  });

  // OCR Scan Logic
  const btnScan = document.getElementById('btn-scan');
  const btnCloseScan = document.getElementById('btn-close-scan');
  const scanContainer = document.getElementById('scan-container');
  const video = document.getElementById('video');
  let stream = null;

  btnScan.addEventListener('click', async () => {
    try {
      scanContainer.style.display = 'block';
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      video.srcObject = stream;
      video.play();

      const canvas = document.createElement('canvas');
      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        import('../utils/ocr').then(({ runOCR }) => {
          runOCR(video, canvas, (detectedId) => {
            containerInput.value = detectedId;
            stopScan();
            showFeedback('Detectado: ' + detectedId);
          });
        });
      };
    } catch (err) {
      showFeedback('Error cámara: ' + err.message, true);
      scanContainer.style.display = 'none';
    }
  });

  const stopScan = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      video.srcObject = null;
    }
    scanContainer.style.display = 'none';
  };

  btnCloseScan.addEventListener('click', stopScan);
};
