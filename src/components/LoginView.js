import { auth } from '../utils/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

export const LoginView = (state) => `
  <div class="animate-in" style="margin-top: 50px;">
    <div class="card glass">
      <div style="text-align: center; margin-bottom: 30px;">
        <div class="logo" style="font-size: 2rem;">BIENVENIDO</div>
        <p style="color: var(--text-muted);">Control de Tiempos Aduana</p>
      </div>
      
      <div class="input-group">
        <label>Correo Electrónico</label>
        <input type="email" id="login-email" placeholder="usuario@aduana.gob.ni" />
      </div>

      <div class="input-group">
        <label>Contraseña</label>
        <input type="password" id="login-password" placeholder="••••••••" />
      </div>

      <button class="btn btn-primary" style="width: 100%;" id="btn-login">
        INGRESAR AL SISTEMA
      </button>

      <div style="margin-top: 20px; text-align: center; font-size: 0.8rem; color: var(--text-muted);">
        Si no tiene cuenta, consulte con el administrador.
      </div>
    </div>
  </div>
`;

LoginView.init = (state, render) => {
    const btnLogin = document.getElementById('btn-login');
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');

    btnLogin.addEventListener('click', async () => {
        const email = emailInput.value;
        const password = passwordInput.value;

        if (!email || !password) return alert('Complete sus credenciales');

        try {
            btnLogin.disabled = true;
            btnLogin.innerText = 'AUTENTICANDO...';
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err) {
            alert('Error de acceso: ' + err.message);
            btnLogin.disabled = false;
            btnLogin.innerText = 'INGRESAR AL SISTEMA';
        }
    });
};
