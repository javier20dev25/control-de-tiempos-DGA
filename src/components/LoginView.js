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
      <div style="margin-bottom: 20px; padding: 16px; background: var(--primary-light); border-radius: 10px; text-align: center;">
        <p style="color: var(--text-muted); font-size: 0.8rem; margin-bottom: 8px;">Sesión anterior</p>
        <p style="color: var(--text); font-weight: 600; margin-bottom: 16px;">${lastName || lastEmail}</p>
        <button class="btn btn-primary" style="width: 100%;" id="btn-login-returning">
          ${googleSvg}
          Volver a entrar
        </button>
      </div>
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">
        <hr style="flex: 1; border: none; border-top: 1px solid var(--border);">
        <span style="color: var(--text-muted); font-size: 0.75rem;">o</span>
        <hr style="flex: 1; border: none; border-top: 1px solid var(--border);">
      </div>
      <button class="btn btn-secondary" style="width: 100%;" id="btn-login-google">
        ${googleSvg}
        Usar otra cuenta
      </button>
    ` : `
      <button class="btn btn-primary" style="width: 100%;" id="btn-login-google">
        ${googleSvg}
        Continuar con Google
      </button>
    `;

    return `
      <div class="animate-in" style="margin-top: 40px;">
        <div class="card">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="font-size: 1.5rem; font-weight: 800; color: var(--primary); margin-bottom: 4px;">${lastEmail ? 'Hola de nuevo' : 'Bienvenido'}</h1>
            <p style="color: var(--text-muted); font-size: 0.9rem;">Control de Tiempos — DGA</p>
          </div>
          ${welcomeBackSection}
          <p style="margin-top: 16px; text-align: center; font-size: 0.75rem; color: var(--text-muted);">
            Requiere cuenta autorizada.
          </p>
        </div>
      </div>
    `;
};

async function doGoogleSignIn(btn) {
    const originalContent = btn.innerHTML;
    try {
        btn.disabled = true;
        btn.innerHTML = 'Conectando...';
        await signInWithPopup(auth, googleProvider);
    } catch (err) {
        if (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-closed-by-user') {
            try {
                sessionStorage.setItem('isAuthRedirect', 'true');
                btn.innerHTML = 'Redirigiendo...';
                await signInWithRedirect(auth, googleProvider);
            } catch (redirectErr) {
                sessionStorage.removeItem('isAuthRedirect');
                alert('Error: ' + redirectErr.message);
                btn.disabled = false;
                btn.innerHTML = originalContent;
            }
        } else {
            alert('Error: ' + err.message);
            btn.disabled = false;
            btn.innerHTML = originalContent;
        }
    }
}

LoginView.init = (state, render) => {
    const btnLoginGoogle = document.getElementById('btn-login-google');
    const btnLoginReturning = document.getElementById('btn-login-returning');

    if (sessionStorage.getItem('isAuthRedirect')) {
        const activeBtn = btnLoginReturning || btnLoginGoogle;
        if (activeBtn) {
            activeBtn.disabled = true;
            activeBtn.innerHTML = 'Verificando...';
        }
    }

    if (btnLoginReturning) {
        btnLoginReturning.addEventListener('click', () => doGoogleSignIn(btnLoginReturning));
    }
    if (btnLoginGoogle) {
        btnLoginGoogle.addEventListener('click', () => doGoogleSignIn(btnLoginGoogle));
    }
};
