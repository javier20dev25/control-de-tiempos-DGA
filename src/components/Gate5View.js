import { validateContainer, sanitizeContainer } from '../utils/validation';

export const Gate5View = (state) => `
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
        ${state.records.filter(r => !r.t3).slice(-5).reverse().map(r => `
          <div style="padding: 10px 0; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-weight: 600; font-size: 0.9rem;">${r.id}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">${r.regime} | ${r.declaration || 'S/D'}</div>
            </div>
            <button class="btn-icon btn-delete" data-id="${r.timestamp}" style="color: var(--accent);">
                <i data-lucide="trash-2" style="width: 16px;"></i>
            </button>
          </div>
        `).join('')}
      </div>
    </div>
  </div>
`;

Gate5View.init = (state, render) => {
  let selectedRegime = null;
  const containerInput = document.getElementById('container-input');
  const declarationInput = document.getElementById('declaration-input');

  document.querySelectorAll('.regime-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.regime-btn').forEach(b => b.classList.replace('btn-primary', 'btn-secondary'));
      btn.classList.replace('btn-secondary', 'btn-primary');
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

    if (!selectedRegime) return alert('Seleccione un régimen');
    if (!validateContainer(containerId)) return alert('Formato inválido: 4 letras + 7 dígitos');

    const record = {
      id: containerId,
      regime: selectedRegime,
      declaration: declaration,
      t1: new Date().toISOString(),
      timestamp: Date.now(),
      createdBy: state.user.email,
    };

    import('../utils/firebase').then(({ saveRecord }) => {
      saveRecord(record);
    });

    containerInput.value = '';
    declarationInput.value = '';
    alert('Salida registrada');
  });

  document.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('¿Eliminar este registro?')) return;
      const id = btn.dataset.id;
      const record = state.records.find(r => r.timestamp == id);
      if (record) {
        import('../utils/firebase').then(async ({ db }) => {
          const { doc, deleteDoc } = await import('firebase/firestore');
          await deleteDoc(doc(db, "records", record.id));
        });
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
            alert('Detectado: ' + detectedId);
          });
        });
      };
    } catch (err) {
      alert('Error cámara: ' + err.message);
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
