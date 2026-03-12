export const RoleSelectionView = (state) => `
  <div class="animate-in" style="margin-top: 30px; padding: 20px;">
    <div style="text-align: center; margin-bottom: 30px;">
      <h2 style="font-weight: 800; color: var(--text); margin-bottom: 8px;">Área de Operaciones</h2>
      <p style="color: var(--text-muted);">Seleccione el puesto en el que trabajará hoy</p>
    </div>

    <div style="display: grid; grid-template-columns: 1fr; gap: 15px;">
      <button class="card glass role-btn" data-role="gate5" style="border: 2px solid transparent; cursor: pointer; text-align: left; padding: 20px; display: flex; align-items: center; justify-content: space-between; transition: all 0.2s ease;">
        <div>
          <h3 style="margin: 0; font-size: 1.1rem; color: var(--primary);">P-5 (Gate 5)</h3>
          <p style="margin: 5px 0 0 0; font-size: 0.85rem; color: var(--text-muted);">Registro de salida del puerto</p>
        </div>
        <i data-lucide="chevron-right" style="color: var(--primary);"></i>
      </button>

      <button class="card glass role-btn" data-role="jh-in" style="border: 2px solid transparent; cursor: pointer; text-align: left; padding: 20px; display: flex; align-items: center; justify-content: space-between; transition: all 0.2s ease;">
        <div>
          <h3 style="margin: 0; font-size: 1.1rem; color: var(--secondary);">JH Ingreso</h3>
          <p style="margin: 5px 0 0 0; font-size: 0.85rem; color: var(--text-muted);">Entrada a recinto Julia Herrera</p>
        </div>
        <i data-lucide="chevron-right" style="color: var(--secondary);"></i>
      </button>

      <button class="card glass role-btn" data-role="inspector" style="border: 2px solid transparent; cursor: pointer; text-align: left; padding: 20px; display: flex; align-items: center; justify-content: space-between; transition: all 0.2s ease;">
        <div>
          <h3 style="margin: 0; font-size: 1.1rem; color: #f59e0b;">Inspector JH</h3>
          <p style="margin: 5px 0 0 0; font-size: 0.85rem; color: var(--text-muted);">Inspección física y documental</p>
        </div>
        <i data-lucide="chevron-right" style="color: #f59e0b;"></i>
      </button>

      <button class="card glass role-btn" data-role="jh-out" style="border: 2px solid transparent; cursor: pointer; text-align: left; padding: 20px; display: flex; align-items: center; justify-content: space-between; transition: all 0.2s ease;">
        <div>
          <h3 style="margin: 0; font-size: 1.1rem; color: var(--accent);">JH Salida</h3>
          <p style="margin: 5px 0 0 0; font-size: 0.85rem; color: var(--text-muted);">Salida de recinto Julia Herrera</p>
        </div>
        <i data-lucide="chevron-right" style="color: var(--accent);"></i>
      </button>

      <button class="card glass role-btn" data-role="admin" style="border: 2px solid transparent; cursor: pointer; text-align: left; padding: 20px; display: flex; align-items: center; justify-content: space-between; transition: all 0.2s ease;">
        <div>
          <h3 style="margin: 0; font-size: 1.1rem; color: var(--success);">Jefe de Inspección</h3>
          <p style="margin: 5px 0 0 0; font-size: 0.85rem; color: var(--text-muted);">Dashboard y métricas totales</p>
        </div>
        <i data-lucide="chevron-right" style="color: var(--success);"></i>
      </button>
    </div>

    <div style="margin-top: 40px; text-align: center;">
      <button id="btn-logout" class="btn" style="background: transparent; color: var(--danger); border: 1px solid var(--danger);">
        Cerrar Sesión
      </button>
    </div>
  </div>
`;

RoleSelectionView.init = (state, render) => {
    import('../utils/firebase.js').then(({ auth }) => {
        document.getElementById('btn-logout').addEventListener('click', () => {
            auth.signOut();
        });
    });

    document.querySelectorAll('.role-btn').forEach(btn => {
        // Hover effects in JS as backup, though CSS is better
        btn.addEventListener('mouseenter', () => btn.style.transform = 'translateY(-2px)');
        btn.addEventListener('mouseleave', () => btn.style.transform = 'translateY(0)');
        
        btn.addEventListener('click', (e) => {
            const role = e.currentTarget.dataset.role;
            state.currentRole = role; // Save selected role in state
            state.currentView = role; // Navigate to the selected view
            render();
        });
    });
};
