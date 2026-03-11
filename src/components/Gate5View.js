import { validateContainer, sanitizeContainer } from '../utils/validation';

export const Gate5View = (state) => `
  <div class="animate-in">
    <div class="card glass">
      <h2 style="margin-bottom: 20px;">Portón 5 - Salida</h2>
      
      <div class="regime-grid">
        <button class="btn btn-secondary regime-btn" data-regime="VACIO" id="btn-vacio">
          <i data-lucide="package"></i>
          VACÍO
        </button>
        <button class="btn btn-secondary regime-btn" data-regime="TRASLADO" id="btn-traslado">
          <i data-lucide="truck"></i>
          TRASLADO
        </button>
        <button class="btn btn-secondary regime-btn" data-regime="VERDE" id="btn-verde">
          <i data-lucide="check-circle"></i>
          VERDE (L-)
        </button>
        <button class="btn btn-secondary regime-btn" data-regime="TRANSITO" id="btn-transito">
          <i data-lucide="compass"></i>
          TRÁNSITO (D-)
        </button>
      </div>

      <div class="input-group">
        <label>Número de Declaración / Duca</label>
        <input type="text" id="declaration-input" placeholder="L-12345 o D-12345" />
      </div>

      <div class="input-group">
        <label>Número de Contenedor (ABCD1234567)</label>
        <div style="display: flex; gap: 8px;">
          <input type="text" id="container-input" placeholder="ABCD1234567" maxlength="11" />
          <button class="btn btn-secondary" id="btn-scan" title="Escanear">
            <i data-lucide="camera"></i>
          </button>
        </div>
      </div>

      <button class="btn btn-primary" style="width: 100%; margin-top: 10px;" id="btn-add">
        <i data-lucide="plus"></i>
        REGISTRAR SALIDA
      </button>
    </div>

    <div id="scan-container" style="display: none; margin-bottom: 20px;" class="card glass">
        <video id="video" style="width: 100%; border-radius: 12px;"></video>
        <div id="scan-mask" style="border: 2px solid var(--primary); height: 50px; margin-top: -100px; position: relative; z-index: 10; pointer-events: none;"></div>
        <button class="btn btn-secondary" style="width: 100%; margin-top: 130px;" id="btn-close-scan">CERRAR CÁMARA</button>
    </div>

    <div class="card glass">
      <h3>Registros Recientes</h3>
      <div id="recent-list" style="margin-top: 15px;">
        ${state.records.filter(r => !r.t3).slice(-5).reverse().map(r => `
          <div style="padding: 12px; border-bottom: 1px solid var(--glass-border); display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-weight: 600;">${r.id}</div>
              <div style="font-size: 0.8rem; color: var(--text-muted);">${r.regime} | ${r.declaration || 'S/D'}</div>
            </div>
            <div style="display: flex; gap: 10px;">
                <button class="nav-item btn-delete" data-id="${r.timestamp}" style="background: none; border: none; cursor: pointer;">
                    <i data-lucide="trash-2" style="color: var(--accent); width: 18px;"></i>
                </button>
            </div>
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

    document.getElementById('btn-add').addEventListener('click', () => {
        const containerId = containerInput.value;
        const declaration = declarationInput.value;

        if (!selectedRegime) return alert('Seleccione un régimen');
        if (!validateContainer(containerId)) return alert('Número de contenedor inválido (ISO 6346)');

        const record = {
            id: containerId,
            regime: selectedRegime,
            declaration: declaration,
            t1: new Date().toISOString(),
            timestamp: Date.now(),
        };

        state.records.push(record);
        localStorage.setItem('corinto_records', JSON.stringify(state.records));
        render();
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = parseInt(btn.dataset.id);
            state.records = state.records.filter(r => r.timestamp !== id);
            localStorage.setItem('corinto_records', JSON.stringify(state.records));
            render();
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
            // Dynamic canvas resizing
            video.onloadedmetadata = () => {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;

                import('../utils/ocr').then(({ runOCR }) => {
                    runOCR(video, canvas, (detectedId) => {
                        containerInput.value = detectedId;
                        stopScan();
                        alert('Contenedor detectado: ' + detectedId);
                    });
                });
            };
        } catch (err) {
            alert('Error al acceder a la cámara: ' + err.message);
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
