import { auth, googleProvider } from '../utils/firebase';
import { signInWithPopup, signInWithRedirect } from "firebase/auth";

const googleSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
    <path fill="#FF3D00" d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"/>
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.222 0-9.654-3.343-11.303-8l-6.571 4.819C9.656 39.663 16.318 44 24 44z"/>
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
</svg>`;

export const LoginView = (state) => {
    const lastEmail = localStorage.getItem('lastUserEmail');
    const lastName = localStorage.getItem('lastUserName');

    const welcomeBackSection = lastEmail ? `
      <div style="margin-bottom: 20px; padding: 15px; background: rgba(0,242,254,0.08); border: 1px solid rgba(0,242,254,0.2); border-radius: 12px; text-align: center;">
        <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 10px;">Sesión anterior:</p>
        <p style="color: var(--text-main); font-weight: 600; font-size: 1rem; margin-bottom: 15px;">${lastName || lastEmail}</p>
        <button class="btn btn-primary" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px;" id="btn-login-returning">
          ${googleSvg}
          Volver a entrar
        </button>
      </div>
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
        <hr style="flex: 1; border: none; border-top: 1px solid var(--glass-border);">
        <span style="color: var(--text-muted); font-size: 0.8rem;">o</span>
        <hr style="flex: 1; border: none; border-top: 1px solid var(--glass-border);">
      </div>
      <button class="btn btn-secondary" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px;" id="btn-login-google">
        ${googleSvg}
        Usar otra cuenta de Google
      </button>
    ` : `
      <button class="btn btn-primary" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px;" id="btn-login-google">
        ${googleSvg}
        Continuar con Google
      </button>
    `;

    return `
      <div class="animate-in" style="margin-top: 50px;">
        <div class="card glass">
          <div style="text-align: center; margin-bottom: 30px;">
            <div class="logo" style="font-size: 2rem;">${lastEmail ? 'HOLA DE NUEVO' : 'BIENVENIDO'}</div>
            <p style="color: var(--text-muted);">Control de Tiempos Aduana</p>
          </div>
          ${welcomeBackSection}
          <div style="margin-top: 20px; text-align: center; font-size: 0.8rem; color: var(--text-muted);">
            Debe usar una cuenta autorizada para acceder.
          </div>
        </div>
      </div>
    `;
};

// Helper to perform Google sign-in (try popup first, fallback to redirect)
async function doGoogleSignIn(btn) {
    const originalContent = btn.innerHTML;
    try {
        btn.disabled = true;
        btn.innerHTML = 'Conectando...';
        // Try popup first (faster UX)
        await signInWithPopup(auth, googleProvider);
    } catch (err) {
        if (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-closed-by-user') {
            // Fallback to redirect if popup is blocked
            try {
                sessionStorage.setItem('isAuthRedirect', 'true');
                btn.innerHTML = 'Redirigiendo a Google...';
                await signInWithRedirect(auth, googleProvider);
            } catch (redirectErr) {
                sessionStorage.removeItem('isAuthRedirect');
                console.error('Redirect error:', redirectErr);
                alert('Error de acceso: ' + redirectErr.message);
                btn.disabled = false;
                btn.innerHTML = originalContent;
            }
        } else {
            console.error('Login error:', err);
            alert('Error de acceso: ' + err.message);
            btn.disabled = false;
            btn.innerHTML = originalContent;
        }
    }
}

LoginView.init = (state, render) => {
    const btnLoginGoogle = document.getElementById('btn-login-google');
    const btnLoginReturning = document.getElementById('btn-login-returning');

    // Show loading state if we're returning from a redirect
    if (sessionStorage.getItem('isAuthRedirect')) {
        const activeBtn = btnLoginReturning || btnLoginGoogle;
        if (activeBtn) {
            activeBtn.disabled = true;
            activeBtn.innerHTML = 'Verificando cuenta...';
        }
    }

    // "Volver a entrar" button (returning user)
    if (btnLoginReturning) {
        btnLoginReturning.addEventListener('click', () => doGoogleSignIn(btnLoginReturning));
    }

    // "Usar otra cuenta" or "Continuar con Google" button
    if (btnLoginGoogle) {
        btnLoginGoogle.addEventListener('click', () => doGoogleSignIn(btnLoginGoogle));
    }
};
