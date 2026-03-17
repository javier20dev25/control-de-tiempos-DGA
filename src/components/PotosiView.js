import { Document, Packer, Paragraph, TextRun, ImageRun } from 'docx';
import JSZip from 'jszip';

export const PotosiView = (state) => {
    // Load boats from localStorage or initialize
    const savedBoats = JSON.parse(localStorage.getItem('potosi_boats') || '[]');
    
    // Calculate Stats
    const totalLanchas = savedBoats.length;
    const totalTripulantes = savedBoats.reduce((sum, b) => sum + (b.crewPhotos?.length || 0), 0);
    const totalRegionales = savedBoats.reduce((sum, b) => sum + b.passengers.filter(p => p.type === 'regional').length, 0);
    const totalInterregionales = savedBoats.reduce((sum, b) => sum + b.passengers.filter(p => p.type === 'interregional').length, 0);

    return `
    <div class="animate-in">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
            <div>
                <h2 style="font-weight: 700; font-size: 1.5rem; margin-bottom: 4px;">Informes Potosí</h2>
                <div style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: var(--text-muted);">
                    <i data-lucide="compass" style="width: 14px;"></i>
                    <span>Control de flujo marítimo diario</span>
                </div>
            </div>
            <button id="btn-open-boat" class="btn btn-primary" style="display: flex; align-items: center; gap: 8px; padding: 10px 20px;">
                <i data-lucide="plus-circle" style="width: 20px;"></i>
                Aperturar Lancha
            </button>
        </div>

        <!-- STATS CARDS -->
        <div class="grid-container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 24px;">
            <div class="card" style="padding: 12px; text-align: center; border-left: 4px solid var(--primary);">
                <div style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase;">Lanchas</div>
                <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary);">${totalLanchas}</div>
            </div>
            <div class="card" style="padding: 12px; text-align: center; border-left: 4px solid var(--success);">
                <div style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase;">Tripulantes</div>
                <div style="font-size: 1.5rem; font-weight: 700; color: var(--success);">${totalTripulantes}</div>
            </div>
            <div class="card" style="padding: 12px; text-align: center; border-left: 4px solid var(--info);">
                <div style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase;">Regional</div>
                <div style="font-size: 1.5rem; font-weight: 700; color: var(--info);">${totalRegionales}</div>
            </div>
            <div class="card" style="padding: 12px; text-align: center; border-left: 4px solid var(--warning);">
                <div style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase;">Interreg.</div>
                <div style="font-size: 1.5rem; font-weight: 700; color: var(--warning);">${totalInterregionales}</div>
            </div>
        </div>

        <div id="potosi-dashboard" class="grid-container">
            ${savedBoats.length === 0 ? `
                <div class="card" style="grid-column: 1/-1; text-align: center; padding: 60px; color: var(--text-muted); border: 2px dashed var(--border);">
                    <i data-lucide="anchor" style="width: 48px; height: 48px; margin-bottom: 16px; opacity: 0.3;"></i>
                    <p style="font-size: 1.1rem; font-weight: 500;">Esperando datos de la primera lancha...</p>
                    <p style="font-size: 0.85rem; margin-top: 8px;">Presiona "Aperturar Lancha" para comenzar.</p>
                </div>
            ` : savedBoats.map((boat, idx) => `
                <div class="card boat-card animate-in" data-id="${boat.id}" style="padding: 0; overflow: hidden; display: flex; flex-direction: column;">
                    <div style="padding: 16px; border-bottom: 1px solid var(--border); background: var(--bg-alt);">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div>
                                <h3 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 2px;">${boat.name}</h3>
                                <div style="font-size: 0.75rem; color: var(--text-muted); display: flex; align-items: center; gap: 4px;">
                                    <i data-lucide="clock" style="width: 12px;"></i>
                                    ${new Date(boat.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                            <div style="display: flex; gap: 8px;">
                                <button class="btn-icon btn-edit-boat" data-id="${boat.id}" style="background: var(--card-bg); shadow: var(--shadow-sm);">
                                    <i data-lucide="edit-3" style="width: 16px;"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div style="padding: 16px; flex-grow: 1;">
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            <div style="display: flex; align-items: center; justify-content: space-between;">
                                <span style="font-size: 0.85rem; color: var(--text-muted);"><i data-lucide="users" style="width: 14px; vertical-align: middle; margin-right: 6px;"></i>Tripulación</span>
                                <span style="font-weight: 600; font-size: 0.9rem;">${boat.crewPhotos?.length || 0} fotos</span>
                            </div>
                            <div style="display: flex; align-items: center; justify-content: space-between;">
                                <span style="font-size: 0.85rem; color: var(--text-muted);"><i data-lucide="user-plus" style="width: 14px; vertical-align: middle; margin-right: 6px;"></i>Pasajeros CA-4</span>
                                <span style="font-weight: 600; font-size: 0.9rem;">${boat.passengers.filter(p => p.type === 'regional').length}</span>
                            </div>
                            <div style="display: flex; align-items: center; justify-content: space-between;">
                                <span style="font-size: 0.85rem; color: var(--text-muted);"><i data-lucide="globe" style="width: 14px; vertical-align: middle; margin-right: 6px;"></i>Interregionales</span>
                                <span style="font-weight: 600; font-size: 0.9rem;">${boat.passengers.filter(p => p.type === 'interregional').length}</span>
                            </div>
                        </div>
                    </div>

                    <div style="padding: 12px; background: var(--bg-alt); border-top: 1px solid var(--border);">
                        <button class="btn btn-secondary btn-generate-report" style="width: 100%; justify-content: center; gap: 8px; font-size: 0.85rem; background: var(--primary); color: white; border: none;" data-id="${boat.id}">
                            <i data-lucide="file-text" style="width: 16px;"></i>
                            GENERAR INFORME WORD
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>

        ${savedBoats.length > 1 ? `
            <div style="margin-top: 32px; border-top: 1px solid var(--border); padding-top: 24px; text-align: center;">
                <button id="btn-send-report" class="btn btn-secondary" style="gap: 8px; padding: 12px 24px;">
                    <i data-lucide="archive" style="width: 20px;"></i>
                    Descargar Todos los Informes (ZIP)
                </button>
            </div>
        ` : ''}

        <!-- MODAL (Resto del código igual) -->
        <div id="boat-modal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2 id="modal-title">Aperturar Lancha</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="boat-form">
                        <div class="form-group">
                            <label>Nombre de la Lancha</label>
                            <input type="text" id="boat-name" required placeholder="Ej. La Niña I">
                        </div>
v>
                        
                        <div class="form-group">
                            <label>Foto de la Matrícula</label>
                            <div class="upload-container" id="reg-photo-container">
                                <label for="reg-photo-input" class="upload-area">
                                    <i data-lucide="camera"></i>
                                    <span>Adjuntar Foto</span>
                                </label>
                                <input type="file" id="reg-photo-input" accept="image/*" style="display: none;">
                                <div id="reg-photo-preview" class="image-preview-grid"></div>
                            </div>
                        </div>

                        <hr style="margin: 20px 0; border: 0; border-top: 1px solid var(--border);">

                        <div class="form-group">
                            <label>Fotos de Tripulación (Capitán y Ayudantes)</label>
                            <div class="upload-container" id="crew-photos-container">
                                <label for="crew-photos-input" class="upload-area">
                                    <i data-lucide="plus"></i>
                                    <span>Subir una o varias fotos</span>
                                </label>
                                <input type="file" id="crew-photos-input" accept="image/*" multiple style="display: none;">
                                <div id="crew-photos-preview" class="image-preview-grid"></div>
                            </div>
                        </div>

                        <hr style="margin: 20px 0; border: 0; border-top: 1px solid var(--border);">

                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                            <label style="margin-bottom: 0;">Pasajeros</label>
                            <button type="button" id="btn-add-passenger" class="btn btn-secondary btn-sm">
                                <i data-lucide="plus" style="width: 14px;"></i> Añadir Pasajero
                            </button>
                        </div>
                        
                        <div id="passengers-list" style="display: flex; flex-direction: column; gap: 10px;">
                            <!-- Passengers go here -->
                        </div>

                        <div style="margin-top: 32px; display: flex; gap: 12px;">
                            <button type="submit" class="btn btn-primary" style="flex: 1;">Guardar Lancha</button>
                            <button type="button" id="btn-delete-boat" class="btn btn-danger" style="display: none;">Eliminar</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
    `;
};

PotosiView.init = (state, render) => {
    let currentBoatId = null;
    let boatData = {
        id: null,
        name: '',
        date: null,
        regPhoto: null,
        crewPhotos: [],
        passengers: []
    };

    const modal = document.getElementById('boat-modal');
    const form = document.getElementById('boat-form');
    const passengerList = document.getElementById('passengers-list');

    // UI HELPER: Resize and Compress Image
    const compressImage = (base64, maxWidth = 800) => new Promise((resolve) => {
        const img = new Image();
        img.src = base64;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.7)); // Compress to 70% quality JPEG
        };
    });

    // UI HELPER: File to Base64
    const fileToBase64 = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const original = reader.result;
            const compressed = await compressImage(original);
            resolve(compressed);
        };
        reader.onerror = error => reject(error);
    });

    const updatePassengerUI = () => {
        passengerList.innerHTML = boatData.passengers.map((p, idx) => `
            <div class="card" style="padding: 12px; margin-bottom: 0;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <span style="font-weight: 600; font-size: 0.9rem;">#${idx + 1} Pasajero ${p.type === 'regional' ? 'Regional' : 'Interregional'}</span>
                    <button type="button" class="btn-remove-passenger" data-idx="${idx}" style="background: none; border: none; color: var(--danger); cursor: pointer;">
                        <i data-lucide="trash-2" style="width: 16px;"></i>
                    </button>
                </div>
                <div class="form-group" style="margin-bottom: 8px;">
                    <select class="passenger-type-select" data-idx="${idx}" style="padding: 4px; border-radius: 4px; border: 1px solid var(--border); font-size: 0.8rem;">
                        <option value="regional" ${p.type === 'regional' ? 'selected' : ''}>Regional (CA-4)</option>
                        <option value="interregional" ${p.type === 'interregional' ? 'selected' : ''}>Interregional</option>
                    </select>
                </div>
                <div class="upload-container">
                    <label class="upload-area" style="padding: 8px; font-size: 0.75rem;">
                        <i data-lucide="camera" style="width: 14px;"></i>
                        <span>${p.photos.length > 0 ? `${p.photos.length} Fotos` : 'Adjuntar fotos'}</span>
                        <input type="file" multiple accept="image/*" class="passenger-photo-input" data-idx="${idx}" style="display: none;">
                    </label>
                    <div class="image-preview-grid">
                        ${p.photos.map(photo => `<img src="${photo}" class="preview-thumb">`).join('')}
                    </div>
                </div>
            </div>
        `).join('');
        
        // Re-init icons for dynamic content
        try {
            if (window.lucide) {
                window.lucide.createIcons();
            }
        } catch(e) { console.error("Lucide error:", e); }
    };

    // BTN: Aperturar Lancha
    document.getElementById('btn-open-boat').onclick = () => {
        currentBoatId = null;
        boatData = {
            id: Date.now(),
            name: '',
            date: new Date().toISOString(),
            regPhoto: null,
            crewPhotos: [],
            passengers: []
        };
        form.reset();
        document.getElementById('reg-photo-preview').innerHTML = '';
        document.getElementById('crew-photos-preview').innerHTML = '';
        document.getElementById('btn-delete-boat').style.display = 'none';
        document.getElementById('modal-title').innerText = 'Aperturar Lancha';
        updatePassengerUI();
        modal.classList.add('active');
    };

    // CLOSE MODAL
    document.querySelector('.close-modal').onclick = () => modal.classList.remove('active');

    // UPLOAD: Matrícula
    document.getElementById('reg-photo-input').onchange = async (e) => {
        if (e.target.files[0]) {
            const base64 = await fileToBase64(e.target.files[0]);
            boatData.regPhoto = base64;
            document.getElementById('reg-photo-preview').innerHTML = `<img src="${base64}" class="preview-thumb">`;
        }
    };

    // UPLOAD: Crew
    document.getElementById('crew-photos-input').onchange = async (e) => {
        const files = Array.from(e.target.files);
        for (const file of files) {
            const base64 = await fileToBase64(file);
            boatData.crewPhotos.push(base64);
        }
        document.getElementById('crew-photos-preview').innerHTML = boatData.crewPhotos.map(p => `<img src="${p}" class="preview-thumb">`).join('');
    };

    // PASSENGER: Add
    document.getElementById('btn-add-passenger').onclick = () => {
        boatData.passengers.push({ type: 'regional', photos: [] });
        updatePassengerUI();
    };

    // PASSENGER: Handlers (Delegation)
    passengerList.addEventListener('change', async (e) => {
        const idx = e.target.dataset.idx;
        if (e.target.classList.contains('passenger-type-select')) {
            boatData.passengers[idx].type = e.target.value;
        }
        if (e.target.classList.contains('passenger-photo-input')) {
            const files = Array.from(e.target.files);
            for (const file of files) {
                const base64 = await fileToBase64(file);
                boatData.passengers[idx].photos.push(base64);
            }
            updatePassengerUI();
        }
    });

    passengerList.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-remove-passenger');
        if (btn) {
            const idx = btn.dataset.idx;
            boatData.passengers.splice(idx, 1);
            updatePassengerUI();
        }
    });

    // FORM: Submit
    form.onsubmit = (e) => {
        try {
            e.preventDefault();
            console.log("Saving boat data...", boatData);
            
            const nameInput = document.getElementById('boat-name');
            if (!nameInput) throw new Error("Input 'boat-name' not found");
            
            boatData.name = nameInput.value;
            boatData.crewCount = boatData.crewPhotos.length;

            const savedBoats = JSON.parse(localStorage.getItem('potosi_boats') || '[]');
            const existingIdx = savedBoats.findIndex(b => b.id === boatData.id);
            
            if (existingIdx >= 0) {
                savedBoats[existingIdx] = boatData;
            } else {
                savedBoats.push(boatData);
            }

            console.log("Attempting to save to localStorage...");
            try {
                localStorage.setItem('potosi_boats', JSON.stringify(savedBoats));
            } catch (storageError) {
                console.error("LocalStorage error:", storageError);
                if (storageError.name === 'QuotaExceededError' || storageError.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                    alert("Error: No hay espacio suficiente en el navegador. Intenta con fotos más pequeñas o limpia los datos.");
                } else {
                    alert("Error al guardar en el navegador: " + storageError.message);
                }
                return; // Don't close modal if save failed
            }
            
            console.log("Saved successfully. Closing modal.");
            
            // Finalize state
            currentBoatId = null;
            modal.classList.remove('active');
            
            // Critical: Small delay to ensure state is clear before re-render
            setTimeout(() => {
                console.log("Re-rendering Potosi view...");
                render();
            }, 100);
        } catch (err) {
            console.error("Critical error in onsubmit:", err);
            alert("Error crítico al guardar: " + err.message);
        }
    };

    // DASHBOARD: Click Handlers
    document.querySelectorAll('.btn-edit-boat').forEach(btn => {
        btn.onclick = () => {
            const id = parseInt(btn.dataset.id);
            const savedBoats = JSON.parse(localStorage.getItem('potosi_boats') || '[]');
            const boat = savedBoats.find(b => b.id === id);
            if (boat) {
                boatData = JSON.parse(JSON.stringify(boat)); // Deep copy
                document.getElementById('boat-name').value = boatData.name;
                document.getElementById('reg-photo-preview').innerHTML = boatData.regPhoto ? `<img src="${boatData.regPhoto}" class="preview-thumb">` : '';
                document.getElementById('crew-photos-preview').innerHTML = boatData.crewPhotos.map(p => `<img src="${p}" class="preview-thumb">`).join('');
                document.getElementById('btn-delete-boat').style.display = 'block';
                document.getElementById('modal-title').innerText = 'Editar Lancha';
                updatePassengerUI();
                modal.classList.add('active');
            }
        };
    });

    document.getElementById('btn-delete-boat').onclick = () => {
        if (confirm('¿Eliminar este registro?')) {
            const savedBoats = JSON.parse(localStorage.getItem('potosi_boats') || '[]');
            const filtered = savedBoats.filter(b => b.id !== boatData.id);
            localStorage.setItem('potosi_boats', JSON.stringify(filtered));
            modal.classList.remove('active');
            render();
        }
    };

    // EXPORT: Generate Word
    document.querySelectorAll('.btn-generate-report').forEach(btn => {
        btn.onclick = async () => {
            const id = parseInt(btn.dataset.id);
            const savedBoats = JSON.parse(localStorage.getItem('potosi_boats') || '[]');
            const boat = savedBoats.find(b => b.id === id);
            if (boat) {
                await generateWordReport(boat);
            }
        };
    });

    // EXPORT: Send ZIP
    const sendZipBtn = document.getElementById('btn-send-report');
    if (sendZipBtn) {
        sendZipBtn.onclick = async () => {
            const savedBoats = JSON.parse(localStorage.getItem('potosi_boats') || '[]');
            const zip = new JSZip();
            
            for (const boat of savedBoats) {
                const blob = await generateWordReport(boat, true);
                zip.file(`Informe_${boat.name.replace(/\s+/g, '_')}.docx`, blob);
            }

            const content = await zip.generateAsync({ type: "blob" });
            const url = window.URL.createObjectURL(content);
            const a = document.createElement("a");
            a.href = url;
            a.download = `Reporte_Potosi_${new Date().toISOString().split('T')[0]}.zip`;
            a.click();
        };
    }

    async function generateWordReport(boat, returnBlob = false) {
        // Base64 to ArrayBuffer helper for images
        const b64ToArrayBuffer = (b64) => {
            const binary = atob(b64.split(',')[1]);
            const array = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
            return array.buffer;
        };

        const sections = [];
        
        // Header
        sections.push(new Paragraph({
            children: [
                new TextRun({ text: "CONTROL DE INFORMES - ADUANA POTOSÍ", bold: true, size: 28 }),
                new TextRun({ text: "\nNombre de la Lancha: ", bold: true }),
                new TextRun(boat.name),
                new TextRun({ text: "\nFecha: ", bold: true }),
                new TextRun(new Date(boat.date).toLocaleString()),
            ]
        }));

        // Registration Photo
        if (boat.regPhoto) {
            sections.push(new Paragraph("FOTO DE MATRÍCULA:"));
            sections.push(new Paragraph({
                children: [
                    new ImageRun({
                        data: b64ToArrayBuffer(boat.regPhoto),
                        transformation: { width: 400, height: 300 }
                    })
                ]
            }));
        }

        // Crew
        sections.push(new Paragraph({ text: "\nINFORMACIÓN DE TRIPULACIÓN:", bold: true }));
        for (const photo of boat.crewPhotos) {
            sections.push(new Paragraph({
                children: [
                    new ImageRun({
                        data: b64ToArrayBuffer(photo),
                        transformation: { width: 400, height: 300 }
                    })
                ]
            }));
        }

        // Passengers Interregional
        const inter = boat.passengers.filter(p => p.type === 'interregional');
        if (inter.length > 0) {
            sections.push(new Paragraph({ text: "\nPASAJEROS INTERREGIONALES:", bold: true }));
            inter.forEach((p, idx) => {
                sections.push(new Paragraph(`Pasajero #${idx + 1}:`));
                p.photos.forEach(photo => {
                    sections.push(new Paragraph({
                        children: [
                            new ImageRun({
                                data: b64ToArrayBuffer(photo),
                                transformation: { width: 300, height: 225 }
                            })
                        ]
                    }));
                });
            });
        }

        // Passengers Regional
        const regional = boat.passengers.filter(p => p.type === 'regional');
        if (regional.length > 0) {
            sections.push(new Paragraph({ text: "\nPASAJEROS REGIONALES:", bold: true }));
            regional.forEach((p, idx) => {
                sections.push(new Paragraph(`Pasajero #${idx + 1}:`));
                p.photos.forEach(photo => {
                    sections.push(new Paragraph({
                        children: [
                            new ImageRun({
                                data: b64ToArrayBuffer(photo),
                                transformation: { width: 300, height: 225 }
                            })
                        ]
                    }));
                });
            });
        }

        const doc = new Document({
            sections: [{ properties: {}, children: sections }]
        });

        const blob = await Packer.toBlob(doc);
        if (returnBlob) return blob;

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Informe_${boat.name.replace(/\s+/g, '_')}.docx`;
        a.click();
    }
};
