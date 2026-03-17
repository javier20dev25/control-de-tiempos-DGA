import { Document, Packer, Paragraph, TextRun, ImageRun } from 'docx';
import JSZip from 'jszip';

export const PotosiView = (state) => {
    // Load boats from localStorage or initialize
    const savedBoats = JSON.parse(localStorage.getItem('potosi_boats') || '[]');
    
    return `
    <div class="animate-in">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <div>
                <h2 style="font-weight: 700; font-size: 1.25rem;">Control Informes Potosí</h2>
                <p style="color: var(--text-muted); font-size: 0.85rem;">Gestión de ingresos marítimos diarios</p>
            </div>
            <button id="btn-open-boat" class="btn btn-primary" style="display: flex; align-items: center; gap: 8px;">
                <i data-lucide="plus" style="width: 18px;"></i>
                Aperturar Lancha
            </button>
        </div>

        <div id="potosi-dashboard" class="grid-container">
            ${savedBoats.length === 0 ? `
                <div class="card" style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
                    <i data-lucide="compass" style="width: 48px; height: 48px; margin-bottom: 12px; opacity: 0.5;"></i>
                    <p>No hay lanchas registradas hoy.</p>
                </div>
            ` : savedBoats.map((boat, idx) => `
                <div class="card boat-card animate-in" data-id="${boat.id}" style="padding: 16px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div>
                            <h3 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 4px;">${boat.name}</h3>
                            <p style="font-size: 0.8rem; color: var(--text-muted);">${new Date(boat.date).toLocaleString()}</p>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <button class="btn-icon btn-generate-report" title="Generar Informe Word" data-id="${boat.id}">
                                <i data-lucide="file-warning" style="width: 16px;"></i>
                            </button>
                            <button class="btn-icon btn-edit-boat" data-id="${boat.id}">
                                <i data-lucide="edit-2" style="width: 16px;"></i>
                            </button>
                        </div>
                    </div>
                    <div style="margin-top: 12px; font-size: 0.85rem;">
                        <span class="badge badge-info">${boat.passengers.length} Pasajeros</span>
                        <span class="badge badge-success">${boat.crewCount || 0} Tripulantes</span>
                    </div>
                </div>
            `).join('')}
        </div>

        ${savedBoats.length > 0 ? `
            <div style="margin-top: 24px; text-align: center;">
                <button id="btn-send-report" class="btn btn-secondary" style="gap: 8px;">
                    <i data-lucide="package" style="width: 18px;"></i>
                    Enviar Reporte Global (ZIP)
                </button>
            </div>
        ` : ''}

        <!-- MODAL -->
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
