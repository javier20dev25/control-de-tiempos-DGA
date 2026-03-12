export const RoleSelectionView = (state) => `
  <div class="animate-in" style="margin-top: 20px;">
    <div style="text-align: center; margin-bottom: 24px;">
      <h2 style="font-weight: 700; font-size: 1.2rem; margin-bottom: 4px;">Selecciona tu puesto</h2>
      <p style="color: var(--text-muted); font-size: 0.85rem;">¿En qué área trabajas hoy?</p>
    </div>

    <div style="display: flex; flex-direction: column; gap: 10px;">
      <button class="card role-btn" data-role="gate5" style="cursor: pointer; text-align: left; display: flex; align-items: center; justify-content: space-between; padding: 16px; margin-bottom: 0;">
        <div>
          <h3 style="margin: 0; font-size: 1rem; font-weight: 600;">P-5 (Gate 5)</h3>
          <p style="margin: 4px 0 0 0; font-size: 0.8rem; color: var(--text-muted);">Registro de salida del puerto</p>
        </div>
        <i data-lucide="chevron-right" style="color: var(--text-muted); width: 18px;"></i>
      </button>

      <button class="card role-btn" data-role="jh-in" style="cursor: pointer; text-align: left; display: flex; align-items: center; justify-content: space-between; padding: 16px; margin-bottom: 0;">
        <div>
          <h3 style="margin: 0; font-size: 1rem; font-weight: 600;">JH Ingreso</h3>
          <p style="margin: 4px 0 0 0; font-size: 0.8rem; color: var(--text-muted);">Entrada a recinto Julia Herrera</p>
        </div>
        <i data-lucide="chevron-right" style="color: var(--text-muted); width: 18px;"></i>
      </button>

      <button class="card role-btn" data-role="inspector" style="cursor: pointer; text-align: left; display: flex; align-items: center; justify-content: space-between; padding: 16px; margin-bottom: 0;">
        <div>
          <h3 style="margin: 0; font-size: 1rem; font-weight: 600;">Inspector JH</h3>
          <p style="margin: 4px 0 0 0; font-size: 0.8rem; color: var(--text-muted);">Inspección física y documental</p>
        </div>
        <i data-lucide="chevron-right" style="color: var(--text-muted); width: 18px;"></i>
      </button>

      <button class="card role-btn" data-role="jh-out" style="cursor: pointer; text-align: left; display: flex; align-items: center; justify-content: space-between; padding: 16px; margin-bottom: 0;">
        <div>
          <h3 style="margin: 0; font-size: 1rem; font-weight: 600;">JH Salida</h3>
          <p style="margin: 4px 0 0 0; font-size: 0.8rem; color: var(--text-muted);">Salida de recinto Julia Herrera</p>
        </div>
        <i data-lucide="chevron-right" style="color: var(--text-muted); width: 18px;"></i>
      </button>

      <button class="card role-btn" data-role="admin" style="cursor: pointer; text-align: left; display: flex; align-items: center; justify-content: space-between; padding: 16px; margin-bottom: 0;">
        <div>
          <h3 style="margin: 0; font-size: 1rem; font-weight: 600;">Jefe de Inspección</h3>
          <p style="margin: 4px 0 0 0; font-size: 0.8rem; color: var(--text-muted);">Dashboard y métricas</p>
        </div>
        <i data-lucide="chevron-right" style="color: var(--text-muted); width: 18px;"></i>
      </button>
    </div>

    <div style="margin-top: 32px; text-align: center;">
      <button id="btn-logout" class="btn btn-secondary" style="color: var(--accent); border-color: var(--accent); font-size: 0.8rem;">
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
        btn.addEventListener('click', (e) => {
            const role = e.currentTarget.dataset.role;
            state.currentRole = role;
            state.currentView = role;
            render();
        });
    });
};
