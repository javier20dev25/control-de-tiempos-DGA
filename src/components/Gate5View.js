export const Gate5View = (state) => {
  const activeShift = state.activeShift;
  
  // Calculate counts based on active shift or default to 7 AM
  const shiftStartTime = activeShift ? new Date(activeShift.startTime.seconds * 1000) : null;
  
  const now = new Date();
  const defaultShiftStart = new Date(now);
  defaultShiftStart.setHours(7, 0, 0, 0);
  if (now.getHours() < 7) defaultShiftStart.setDate(defaultShiftStart.getDate() - 1);

  const effectiveStart = shiftStartTime || defaultShiftStart;

  const shiftCount = state.records.filter(r => 
    r.createdBy === state.user.email && 
    new Date(r.timestamp) >= effectiveStart
  ).length;

  const recentRecords = state.records.filter(r => !r.t3).slice(0, 5);

  return `
  <div class="animate-in">
    <div class="card" style="padding: 12px 16px; margin-bottom: 12px; border-left: 4px solid var(--primary); display: flex; justify-content: space-between; align-items: center;">
        <div>
            <div style="font-size: 0.65rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Salidas en mi Turno</div>
            <div style="font-size: 1.2rem; font-weight: 800; color: var(--text);">${shiftCount} <span style="font-size: 0.8rem; font-weight: 500; color: var(--text-muted);">Contenedores</span></div>
        </div>
        ${activeShift ? 
            `<button class="btn btn-secondary" id="btn-end-shift-g5" style="padding: 8px 12px; font-size: 0.7rem; height: auto;">CONCLUIR TURNO</button>` : 
            `<button class="btn btn-primary" id="btn-start-shift-g5" style="padding: 8px 12px; font-size: 0.7rem; height: auto;">EMPEZAR TURNO</button>`
        }
    </div>

    ${!activeShift ? `
    <div class="card" style="text-align: center; border: 2px dashed var(--border); background: var(--bg);">
        <i data-lucide="lock" style="width: 32px; height: 32px; color: var(--text-muted); margin-bottom: 12px;"></i>
        <h3 style="font-size: 0.9rem; color: var(--text-muted);">Debe iniciar turno para registrar salidas</h3>
    </div>
    ` : `
    <div class="card">
      <h2 style="font-size: 1rem; font-weight: 700; margin-bottom: 12px;">Portón 5 — Salida</h2>
      
      <div class="regime-grid" style="grid-template-columns: repeat(2, 1fr); gap: 8px;">
        <button class="btn btn-secondary regime-btn" data-regime="VACIO" style="padding: 10px; font-size: 0.75rem;">
          <i data-lucide="package" style="width: 16px;"></i> VACÍO
        </button>
        <button class="btn btn-secondary regime-btn" data-regime="TRASLADO" style="padding: 10px; font-size: 0.75rem;">
          <i data-lucide="truck" style="width: 16px;"></i> TRASLADO
        </button>
        <button class="btn btn-secondary regime-btn" data-regime="VERDE" style="padding: 10px; font-size: 0.75rem;">
          <i data-lucide="check-circle" style="width: 16px;"></i> VERDE (L-)
        </button>
        <button class="btn btn-secondary regime-btn" data-regime="TRANSITO" style="padding: 10px; font-size: 0.75rem;">
          <i data-lucide="compass" style="width: 16px;"></i> TRÁNSITO (D-)
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
          <button class="btn btn-secondary" id="btn-scan" title="Escanear" style="padding: 10px;">
            <i data-lucide="camera" style="width: 18px;"></i>
          </button>
        </div>
      </div>

      <div id="feedback-msg" style="display: none; padding: 10px; border-radius: 8px; margin-bottom: 12px; text-align: center; font-size: 0.8rem; font-weight: 600;"></div>

      <button class="btn btn-primary" style="width: 100%;" id="btn-add">
        <i data-lucide="plus" style="width: 18px;"></i> REGISTRAR SALIDA
      </button>
    </div>
    `}

    <div id="scan-container" style="display: none;" class="card">
        <video id="video" style="width: 100%; border-radius: 8px;"></video>
        <button class="btn btn-secondary" style="width: 100%; margin-top: 10px;" id="btn-close-scan">CERRAR CÁMARA</button>
    </div>

    <div class="card">
      <h3 style="font-size: 0.9rem; font-weight: 700; margin-bottom: 12px;">Recientes</h3>
      <div id="recent-list">
        ${recentRecords.length === 0 ? '<div style="color: var(--text-muted); text-align: center; padding: 10px; font-size: 0.8rem;">Sin registros aún</div>' : ''}
        ${recentRecords.map(r => `
          <div style="padding: 8px 0; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-weight: 700; font-size: 0.9rem; font-family: monospace;">${r.containerId || r.id}</div>
              <div style="font-size: 0.7rem; color: var(--text-muted); font-weight: 500;">${r.regime || ''} | ${r.declaration || 'S/D'}</div>
            </div>
            <div style="display: flex; gap: 4px;">
              <button class="btn-icon btn-edit" data-docid="${r.docId}" data-container="${r.containerId}" data-declaration="${r.declaration || ''}" data-regime="${r.regime || ''}" style="color: var(--primary);">
                <i data-lucide="edit-2" style="width: 14px;"></i>
              </button>
              <button class="btn-icon btn-delete" data-docid="${r.docId}" style="color: var(--accent);">
                <i data-lucide="trash-2" style="width: 14px;"></i>
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
  const { startShift, endShift } = require('../utils/shifts');
  const { db } = require('../utils/firebase');
  const { doc, updateDoc } = require('firebase/firestore');

  // Handle Shift Actions
  const btnStart = document.getElementById('btn-start-shift-g5');
  const btnEnd = document.getElementById('btn-end-shift-g5');

  if (btnStart) {
    btnStart.addEventListener('click', async () => {
      btnStart.disabled = true;
      await startShift(state.user.email, 'gate5');
      // Update state and re-render
      import('../utils/shifts').then(({ getActiveShift }) => {
        getActiveShift(state.user.email).then(shift => {
          state.activeShift = shift;
          render();
        });
      });
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

  if (!state.activeShift) return; // Terminate init if locked
  let selectedRegime = null;
  let editingDocId = null; 
  const containerInput = document.getElementById('container-input');
  const declarationInput = document.getElementById('declaration-input');
  const feedbackMsg = document.getElementById('feedback-msg');

  const showFeedback = (msg, isError = false) => {
    feedbackMsg.textContent = msg;
    feedbackMsg.style.display = 'block';
    feedbackMsg.style.background = isError ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)';
    feedbackMsg.style.color = isError ? 'var(--accent)' : 'var(--success)';
    setTimeout(() => { if(feedbackMsg) feedbackMsg.style.display = 'none'; }, 3000);
  };

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

  document.getElementById('btn-add').addEventListener('click', async () => {
    const containerId = containerInput.value;
    const declaration = declarationInput.value;

    if (!selectedRegime) { showFeedback('Seleccione un régimen', true); return; }
    if (!validateContainer(containerId)) { showFeedback('Formato: 4 letras + 7 dígitos', true); return; }

    const btnAdd = document.getElementById('btn-add');
    btnAdd.disabled = true;
    btnAdd.innerHTML = '<div class="spinner" style="width:14px; height:14px; border-width:2px; margin-bottom:0;"></div>';

    try {
      if (editingDocId) {
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
      } else {
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
      setTimeout(() => render(), 1000);
    } catch (err) {
      showFeedback('Error al guardar: ' + err.message, true);
      btnAdd.disabled = false;
      btnAdd.innerHTML = '<i data-lucide="plus" style="width: 18px;"></i> REGISTRAR SALIDA';
    }
  });

  // Edit logic
  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => {
      editingDocId = btn.dataset.docid;
      containerInput.value = btn.dataset.container || '';
      declarationInput.value = btn.dataset.declaration || '';
      const regime = btn.dataset.regime;
      
      document.querySelectorAll('.regime-btn').forEach(b => {
        b.classList.remove('btn-primary');
        b.classList.add('btn-secondary');
        if (b.dataset.regime === regime) {
          b.classList.remove('btn-secondary');
          b.classList.add('btn-primary');
          selectedRegime = regime;
        }
      });

      document.getElementById('btn-add').innerHTML = '<i data-lucide="edit-2" style="width: 18px;"></i> GUARDAR CAMBIOS';
      import('lucide').then(({ createIcons, Edit2 }) => createIcons({ icons: { Edit2 } }));
      containerInput.focus();
    });
  });

  // Delete logic
  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('¿Eliminar este registro?')) return;
      const docId = btn.dataset.docid;
      try {
        const { deleteDoc, doc } = await import('firebase/firestore');
        await deleteDoc(doc(db, "records", docId));
        showFeedback('Registro eliminado');
        setTimeout(() => render(), 1000);
      } catch (err) {
        showFeedback('Error al eliminar', true);
      }
    });
  });

  // Camera logic
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
