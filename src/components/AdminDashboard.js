import Chart from 'chart.js/auto';
import { saveRecord, setUserRole, getUsers, db } from '../utils/firebase';
import { doc, deleteDoc } from 'firebase/firestore';

export const AdminDashboard = (state) => {
    const activeTab = state.adminTab || 'stats';

    return `
    <div class="animate-in">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="font-size: 1.1rem; font-weight: 700; margin: 0;">Panel de Control</h2>
        <div style="display: flex; gap: 8px;">
            <button class="btn ${activeTab === 'stats' ? 'btn-primary' : 'btn-secondary'}" id="tab-stats" style="padding: 8px 12px; font-size: 0.7rem;">ESTADÍSTICAS</button>
            <button class="btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}" id="tab-users" style="padding: 8px 12px; font-size: 0.7rem;">USUARIOS</button>
            <button class="btn ${activeTab === 'audit' ? 'btn-primary' : 'btn-secondary'}" id="tab-audit" style="padding: 8px 12px; font-size: 0.7rem;">AUDITORÍA</button>
        </div>
      </div>

      <div id="admin-content-area">
        ${activeTab === 'stats' ? renderStats(state) : ''}
        ${activeTab === 'users' ? renderUsers(state) : ''}
        ${activeTab === 'audit' ? renderAudit(state) : ''}
      </div>
    </div>

    <!-- Modal Edición Registro -->
    <div id="edit-record-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); align-items: center; justify-content: center; z-index: 2000; padding: 20px;">
        <div class="card animate-in" style="width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto;">
            <h3 id="edit-modal-title" style="margin-bottom: 16px; font-size: 1rem;">Editar Registro</h3>
            <div id="edit-modal-fields" style="display: flex; flex-direction: column; gap: 12px;"></div>
            <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button class="btn btn-secondary" style="flex: 1;" id="btn-close-edit">CANCELAR</button>
                <button class="btn btn-primary" style="flex: 1;" id="btn-save-edit">GUARDAR CAMBIOS</button>
            </div>
        </div>
    </div>
    `;
};

function renderStats(state) {
    const now = new Date();
    const today7am = new Date(now);
    today7am.setHours(7, 0, 0, 0);
    if (now.getHours() < 7) today7am.setDate(today7am.getDate() - 1);

    const yesterday7am = new Date(today7am);
    yesterday7am.setDate(yesterday7am.getDate() - 1);

    const recordsToday = state.records.filter(r => new Date(r.timestamp) >= today7am);
    const recordsYesterday = state.records.filter(r => {
        const d = new Date(r.timestamp);
        return d >= yesterday7am && d < today7am;
    });

    const flowStats = {
        enteredP5: recordsToday.length,
        inTransit: recordsToday.filter(r => r.status === 'en_transito').length,
        inRecinto: recordsToday.filter(r => r.status === 'en_recinto').length,
        pendingInspection: recordsToday.filter(r => r.status === 'en_recinto').length,
        pendingDispatch: recordsToday.filter(r => ['inspeccionado', 'fumigacion', 'problema_documental'].includes(r.status)).length,
        dispatched: recordsToday.filter(r => r.status === 'finalizado').length,
    };

    const yestTotal = recordsYesterday.length;
    const yestDispatched = recordsYesterday.filter(r => r.status === 'finalizado').length;

    return `
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 20px;">
          <div class="card" style="margin-bottom: 0; padding: 12px; border-left: 4px solid var(--primary);">
              <div style="font-size: 0.65rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Entradas P5 Hoy</div>
              <div style="font-size: 1.4rem; font-weight: 800;">${flowStats.enteredP5}</div>
          </div>
          <div class="card" style="margin-bottom: 0; padding: 12px; border-left: 4px solid var(--success);">
              <div style="font-size: 0.65rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">Despachos Hoy</div>
              <div style="font-size: 1.4rem; font-weight: 800;">${flowStats.dispatched}</div>
          </div>
      </div>

      <div style="margin-bottom: 24px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div class="card" style="padding: 14px; text-align: center; margin-bottom: 0;">
            <div style="font-size: 0.65rem; color: var(--text-muted); font-weight: 500;">P5 Ayer</div>
            <div style="font-size: 1.2rem; font-weight: 700;">${yestTotal}</div>
          </div>
          <div class="card" style="padding: 14px; text-align: center; margin-bottom: 0;">
            <div style="font-size: 0.65rem; color: var(--text-muted); font-weight: 500;">Despachos Ayer</div>
            <div style="font-size: 1.2rem; font-weight: 700;">${yestDispatched}</div>
          </div>
        </div>
      </div>

      <div class="card">
        <h3 style="font-size: 0.9rem; font-weight: 700; margin-bottom: 16px;">Tiempos de Ciclo (Promedios)</h3>
        <canvas id="cycleChart" style="max-height: 160px;"></canvas>
      </div>

      <div class="card" style="margin-bottom: 0;">
          <h3 style="font-size: 0.9rem; font-weight: 700; margin-bottom: 16px;">Flujo de Hoy por Hora</h3>
          <canvas id="hourlyChart" style="max-height: 160px;"></canvas>
      </div>
      
      <div style="margin-top: 16px; display: flex; gap: 8px;">
          <button class="btn btn-secondary" id="btn-export-full" style="flex:1; padding: 10px; font-size: 0.75rem;">REPORTE 8 DÍAS</button>
          <button class="btn btn-primary" id="btn-export-today" style="flex:1; padding: 10px; font-size: 0.75rem;">REPORTE HOY</button>
      </div>
    `;
}

function renderUsers(state) {
    const users = state.allUsers || [];
    return `
    <div class="card">
      <h3 style="font-size: 0.9rem; font-weight: 700; margin-bottom: 16px;">Gestión de Funcionarios</h3>
      <div style="display: flex; flex-direction: column; gap: 10px;">
        ${users.length === 0 ? '<div style="color:var(--text-muted); font-size: 0.8rem; text-align:center;">Cargando usuarios...</div>' : users.map(u => `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border: 1px solid var(--border); border-radius: 8px;">
            <div>
              <div style="font-size: 0.85rem; font-weight: 700;">${u.email}</div>
              <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">${u.role || 'inspector'}</div>
            </div>
            <select class="user-role-select" data-email="${u.email}" style="padding: 4px 8px; font-size: 0.7rem; border-radius: 4px; border: 1px solid var(--border);">
              <option value="inspector" ${u.role === 'inspector' ? 'selected' : ''}>Inspector</option>
              <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Administrador</option>
            </select>
          </div>
        `).join('')}
      </div>
      <div style="margin-top: 16px; padding: 10px; background: rgba(37,99,235,0.05); border-radius: 8px; font-size: 0.7rem; color: var(--text-muted);">
        <i data-lucide="info" style="width: 12px; margin-right: 4px; display: inline-block; vertical-align: middle;"></i>
        Los cambios de rango se aplican al próximo inicio de sesión del usuario.
      </div>
    </div>
    `;
}

function renderAudit(state) {
    return `
    <div class="card" style="padding: 0; overflow: hidden;">
      <div style="padding: 16px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
        <h3 style="font-size: 0.9rem; font-weight: 700; margin: 0;">Auditoría de Registros</h3>
        <input type="text" id="audit-search" placeholder="Buscar Contenedor..." style="width: 150px; font-size: 0.75rem; padding: 6px 10px; border-radius: 20px; border: 1px solid var(--border);">
      </div>
      <div style="max-height: 400px; overflow-y: auto;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead style="position: sticky; top: 0; background: var(--bg); z-index: 10;">
            <tr style="border-bottom: 1px solid var(--border);">
              <th style="padding: 10px; font-size: 0.65rem; text-align: left;">CONT.</th>
              <th style="padding: 10px; font-size: 0.65rem; text-align: center;">ESTADO</th>
              <th style="padding: 10px; font-size: 0.65rem; text-align: right;">ACCIONES</th>
            </tr>
          </thead>
          <tbody id="audit-table-body">
            ${renderAuditRows(state.records)}
          </tbody>
        </table>
      </div>
    </div>
    `;
}

function renderAuditRows(records, filter = '') {
    const filtered = filter ? records.filter(r => r.containerId?.includes(filter.toUpperCase())) : records;
    return filtered.slice(0, 50).map(r => `
      <tr style="border-bottom: 1px solid var(--border);">
        <td style="padding: 10px; font-family: monospace; font-size: 0.75rem; font-weight: 700;">${r.containerId}</td>
        <td style="padding: 10px; text-align: center;">
            <span style="font-size: 0.65rem; font-weight: 700; text-transform: uppercase;">${r.status}</span>
        </td>
        <td style="padding: 10px; text-align: right;">
            <button class="btn-edit-record" data-docid="${r.docId}" style="background: none; border: none; color: var(--primary); cursor: pointer; padding: 4px;"><i data-lucide="edit-2" style="width: 14px;"></i></button>
            <button class="btn-delete-record" data-docid="${r.docId}" style="background: none; border: none; color: var(--accent); cursor: pointer; padding: 4px;"><i data-lucide="trash-2" style="width: 14px;"></i></button>
        </td>
      </tr>
    `).join('');
}

AdminDashboard.init = async (state, render) => {
    // 1. Fetch Users if in users tab
    if (state.adminTab === 'users' && !state.allUsers) {
        state.allUsers = await getUsers();
        render();
        return;
    }

    // 2. Tab switching logic
    document.getElementById('tab-stats')?.addEventListener('click', () => { state.adminTab = 'stats'; render(); });
    document.getElementById('tab-users')?.addEventListener('click', () => { state.adminTab = 'users'; render(); });
    document.getElementById('tab-audit')?.addEventListener('click', () => { state.adminTab = 'audit'; render(); });

    // 3. User Role Management
    document.querySelectorAll('.user-role-select').forEach(select => {
        select.addEventListener('change', async (e) => {
            const email = e.target.dataset.email;
            const newRole = e.target.value;
            if (confirm(`¿Cambiar rango de ${email} a ${newRole}?`)) {
                await setUserRole(email, newRole);
                state.allUsers = await getUsers();
                render();
            } else {
                e.target.value = select.value;
            }
        });
    });

    // 4. Audit Search
    const auditSearch = document.getElementById('audit-search');
    if (auditSearch) {
        auditSearch.addEventListener('input', (e) => {
            const tbody = document.getElementById('audit-table-body');
            tbody.innerHTML = renderAuditRows(state.records, e.target.value);
            import('lucide').then(({ createIcons, Edit2, Trash2 }) => createIcons({ icons: { Edit2, Trash2 } }));
        });
    }

    // 5. Record Editing
    document.querySelectorAll('.btn-edit-record').forEach(btn => {
        btn.addEventListener('click', () => {
            const docId = btn.dataset.docid;
            const record = state.records.find(r => r.docId === docId);
            openEditModal(record, state, render);
        });
    });

    document.querySelectorAll('.btn-delete-record').forEach(btn => {
        btn.addEventListener('click', async () => {
            const docId = btn.dataset.docid;
            if (confirm('¿ELIMINAR este registro? Esta acción es irreversible.')) {
                await deleteDoc(doc(db, "records", docId));
                // Snapshot listener handles update
            }
        });
    });

    // 6. Charts (only in stats tab)
    if (state.adminTab === 'stats' || !state.adminTab) {
        initCharts(state);
    }

    // 7. Exports
    initExports(state);

    import('lucide').then(({ createIcons, Download, Edit2, Trash2, Info }) => {
        createIcons({ icons: { Download, Edit2, Trash2, Info } });
    });
};

function openEditModal(record, state, render) {
    const modal = document.getElementById('edit-record-modal');
    const fieldsArea = document.getElementById('edit-modal-fields');
    const title = document.getElementById('edit-modal-title');
    
    title.innerText = `Editando ${record.containerId}`;
    modal.style.display = 'flex';

    const stages = [
        { key: 't1', label: '1. Portón 5 (Entrada)', value: record.t1 },
        { key: 't2', label: '2. Julia Herrera (Llegada)', value: record.t2 },
        { key: 'inspectorTimestamp', label: '3. Inspeccionado', value: record.inspectorTimestamp },
        { key: 't3', label: '4. Julia Herrera (Salida)', value: record.t3 }
    ];

    fieldsArea.innerHTML = `
        <div class="input-group" style="margin-bottom:0;">
            <label>ID Contenedor</label>
            <input type="text" id="edit-container-id" value="${record.containerId}">
        </div>
        <div class="input-group" style="margin-bottom:0;">
            <label>Declaración / Placa</label>
            <input type="text" id="edit-declaration" value="${record.declaration || ''}">
        </div>
        <div style="font-size: 0.75rem; font-weight: 700; margin-top: 8px; color: var(--text-muted);">HITOS DE TIEMPO (Check para activar)</div>
        ${stages.map(s => `
            <div style="display: flex; align-items: center; gap: 10px; padding: 8px; border: 1px solid var(--border); border-radius: 6px;">
                <input type="checkbox" id="check-${s.key}" ${s.value ? 'checked' : ''} style="width: 20px; height: 20px;">
                <div style="flex: 1;">
                    <div style="font-size: 0.7rem; font-weight: 700;">${s.label}</div>
                    <div style="font-size: 10px; color: var(--text-muted);">${s.value ? new Date(s.value).toLocaleString() : 'Pendiente'}</div>
                </div>
            </div>
        `).join('')}
    `;

    document.getElementById('btn-close-edit').onclick = () => modal.style.display = 'none';
    document.getElementById('btn-save-edit').onclick = async () => {
        const updateData = {
            ...record,
            containerId: document.getElementById('edit-container-id').value,
            declaration: document.getElementById('edit-declaration').value,
        };

        stages.forEach(s => {
            const isChecked = document.getElementById(`check-${s.key}`).checked;
            if (isChecked && !record[s.key]) {
                updateData[s.key] = new Date().toISOString();
            } else if (!isChecked) {
                updateData[s.key] = null;
            }
        });

        // Derive status
        if (updateData.t3) updateData.status = 'finalizado';
        else if (updateData.inspectorTimestamp) updateData.status = 'inspeccionado';
        else if (updateData.t2) updateData.status = 'en_recinto';
        else updateData.status = 'en_transito';

        modal.style.display = 'none';
        await saveRecord(updateData, state.user.email);
    };
}

function initCharts(state) {
    const cycleCtx = document.getElementById('cycleChart');
    const hourlyCtx = document.getElementById('hourlyChart');
    if (!cycleCtx || !hourlyCtx) return;

    // Cycle Calculations
    const rT2T1 = state.records.filter(r => r.t2 && r.t1);
    const avgT = rT2T1.length ? rT2T1.reduce((a, r) => a + (new Date(r.t2)-new Date(r.t1)), 0)/rT2T1.length/60000 : 0;
    const rInsT2 = state.records.filter(r => r.inspectorTimestamp && r.t2);
    const avgI = rInsT2.length ? rInsT2.reduce((a, r) => a + (new Date(r.inspectorTimestamp)-new Date(r.t2)), 0)/rInsT2.length/60000 : 0;

    new Chart(cycleCtx, {
        type: 'bar',
        data: {
            labels: ['P5 → JH', 'Inspección'],
            datasets: [{
                data: [avgT, avgI],
                backgroundColor: ['#2563eb33', '#10b98133'],
                borderColor: ['#2563eb', '#10b981'],
                borderWidth: 1.5,
                borderRadius: 4,
            }]
        },
        options: { indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true } } }
    });

    const hours = Array.from({length: 24}, (_, i) => i);
    const hourlyData = hours.map(h => state.records.filter(r => {
        const d = new Date(r.timestamp);
        return d.toDateString() === new Date().toDateString() && d.getHours() === h;
    }).length);

    new Chart(hourlyCtx, {
        type: 'line',
        data: {
            labels: hours.map(h => `${h}h`),
            datasets: [{ label: 'Entradas', data: hourlyData, borderColor: '#2563eb', tension: 0.3, fill: true, backgroundColor: '#2563eb11', pointRadius: 0 }]
        },
        options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
    });
}

function initExports(state) {
    const exportCSV = (records, filename) => {
        const headers = ['Contenedor', 'Régimen', 'Entrada P5', 'Llegada JH', 'Inspeccionado', 'Salida', 'Estado', 'Creado Por'];
        const rows = records.map(r => [
            r.containerId,
            r.regime,
            r.t1 ? new Date(r.t1).toLocaleString() : '',
            r.t2 ? new Date(r.t2).toLocaleString() : '',
            r.inspectorTimestamp ? new Date(r.inspectorTimestamp).toLocaleString() : '',
            r.t3 ? new Date(r.t3).toLocaleString() : '',
            r.status,
            r.createdBy || ''
        ]);

        let csvContent = "data:text/csv;charset=utf-8,\ufeff" + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    document.getElementById('btn-export-today')?.addEventListener('click', () => {
        const d = new Date(); d.setHours(7,0,0,0);
        if (new Date().getHours() < 7) d.setDate(d.getDate()-1);
        exportCSV(state.records.filter(r => new Date(r.timestamp) >= d), `reporte_hoy.csv`);
    });

    document.getElementById('btn-export-full')?.addEventListener('click', () => {
        exportCSV(state.records, `reporte_8_dias.csv`);
    });
}
