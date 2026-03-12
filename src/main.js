import { createIcons, LogOut, LogIn, BarChart2, Camera, Plus, Trash2, Edit2, Search, ChevronRight, ArrowLeft, Package, Truck, CheckCircle, Compass, Check, AlertTriangle, Wind, FileWarning } from 'lucide';
import './style.css';
import { Gate5View } from './components/Gate5View';
import { JHIngresoView } from './components/JHIngresoView';
import { InspectorView } from './components/InspectorView';
import { JHSalidaView } from './components/JHSalidaView';
import { AdminDashboard } from './components/AdminDashboard';
import { getActiveShift } from './utils/shifts';

import { auth, subscribeToRecords, db } from './utils/firebase';
import { onAuthStateChanged, getRedirectResult } from "firebase/auth";
import { LoginView } from './components/LoginView';
import { RoleSelectionView } from './components/RoleSelectionView';

const state = {
    currentView: 'roleSelection', // Empezamos en selección de rol después del login
    currentRole: null, // Guarda el rol que eligió
    user: null,
    userRole: 'inspector', // 'admin' or 'inspector'
    records: [],
    loading: true, 
    activeShift: null, 
};

const views = {
    login: LoginView,
    roleSelection: RoleSelectionView,
    gate5: Gate5View,
    'jh-in': JHIngresoView,
    inspector: InspectorView,
    'jh-out': JHSalidaView,
    admin: AdminDashboard,
};

function render() {
    const container = document.getElementById('main-content');
    const headerBackBtn = document.getElementById('header-back-btn');

    if (!state.user) {
        container.innerHTML = LoginView(state);
        LoginView.init(state, render);
        if(headerBackBtn) headerBackBtn.style.display = 'none';
        return;
    }

    // Mostrar pantalla de carga durante la sincronización inicial
    if (state.loading) {
        container.innerHTML = `
            <div class="loading-container animate-in">
                <div class="spinner"></div>
                <div class="loading-text">Sincronizando base de datos aduanera...</div>
                <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 10px;">Probando conexión con Firebase...</div>
            </div>
        `;
        if(headerBackBtn) headerBackBtn.style.display = 'none';
        return;
    }

    // Si tiene usuario pero no ha elegido rol, forzar vista de selección
    if (state.user && !state.currentRole) {
        state.currentView = 'roleSelection';
        if(headerBackBtn) headerBackBtn.style.display = 'none';
    } else {
        if(headerBackBtn) {
            headerBackBtn.style.display = 'block';
            headerBackBtn.onclick = (e) => {
                e.preventDefault();
                state.currentRole = null;
                state.currentView = 'roleSelection';
                render();
            };
        }
    }

    const ViewComponent = views[state.currentView];

    if (ViewComponent) {
        container.innerHTML = ViewComponent(state);
        if (ViewComponent.init) ViewComponent.init(state, render);
    }

    createIcons({
        icons: { LogOut, LogIn, BarChart2, Camera, Plus, Trash2, Edit2, Search, ChevronRight, ArrowLeft, Package, Truck, CheckCircle, Compass, Check, AlertTriangle, Wind, FileWarning }
    });
}

// Catch redirect completion and errors
getRedirectResult(auth)
    .then((result) => {
        if (result) {
            // Success! The onAuthStateChanged listener handles the state assignment
            sessionStorage.removeItem('isAuthRedirect');
        }
    })
    .catch((error) => {
        // Here we catch things like unverified domains or blocked accounts
        sessionStorage.removeItem('isAuthRedirect');
        console.error("Redirect Error:", error);
        alert("Error de inicio de sesión: " + error.message);
        // Re-render to ensure the UI updates if the user was stuck on "Verificando cuenta..."
        state.currentRole = null;
        state.currentView = 'login';
        state.user = null;
        state.loading = false; // Desactivar carga en error
        render(); 
    });

// Firebase Auth & Data Listeners
onAuthStateChanged(auth, async (user) => {
    state.user = user;
    sessionStorage.removeItem('isAuthRedirect');
    if (user) {
        localStorage.setItem('lastUserEmail', user.email || '');
        localStorage.setItem('lastUserName', user.displayName || '');
        
        // 1. Get Role first
        import('./utils/firebase').then(async ({ getUserRole, subscribeToRecords }) => {
            state.userRole = await getUserRole(user.email);
            
            // 2. Subscribe with role filtering
            subscribeToRecords(user.email, state.userRole, (records) => {
                state.records = records;
                // 3. Fetch active shift
                getActiveShift(user.email).then(shift => {
                    state.activeShift = shift;
                    state.loading = false;
                    render();
                });
            });
        });
    } else {
        state.loading = false;
        state.currentRole = null;
        state.currentView = 'roleSelection';
        render();
    }
});

// Initial Render
render();
