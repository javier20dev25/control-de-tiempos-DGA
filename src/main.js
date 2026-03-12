import { createIcons, LogOut, LogIn, BarChart2, Camera, Plus, Trash2, Edit2, Search } from 'lucide';
import './style.css';
import { Gate5View } from './components/Gate5View';
import { JHIngresoView } from './components/JHIngresoView';
import { InspectorView } from './components/InspectorView';
import { JHSalidaView } from './components/JHSalidaView';
import { AdminDashboard } from './components/AdminDashboard';

import { auth, subscribeToRecords } from './utils/firebase';
import { onAuthStateChanged } from "firebase/auth";
import { LoginView } from './components/LoginView';
import { RoleSelectionView } from './components/RoleSelectionView';

const state = {
    currentView: 'roleSelection', // Empezamos en selección de rol después del login
    currentRole: null, // Guarda el rol que eligió
    user: null,
    records: [],
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
    const nav = document.querySelector('.footer-nav');

    if (!state.user) {
        container.innerHTML = LoginView(state);
        LoginView.init(state, render);
        nav.style.display = 'none';
        return;
    }

    // Si tiene usuario pero no ha elegido rol, forzar vista de selección
    if (state.user && !state.currentRole) {
        state.currentView = 'roleSelection';
        nav.style.display = 'none';
    } else {
        // Nav only shows if they select a role. For now, we only show their active role in the footer, or hide the footer entirely to simplify.
        // Or we can rebuild the nav to just be a 'back to roles' button.
        nav.style.display = 'flex';
        nav.innerHTML = `
          <a href="#" class="nav-item active" style="flex: 1;" data-view="roleSelection">
            <i data-lucide="arrow-left"></i>
            <span>Volver a Inicio</span>
          </a>
        `;
        import('lucide').then(({ createIcons, ArrowLeft }) => createIcons({ icons: {ArrowLeft} }));
    }

    const ViewComponent = views[state.currentView];

    if (ViewComponent) {
        container.innerHTML = ViewComponent(state);
        if (ViewComponent.init) ViewComponent.init(state, render);
    }

    createIcons({
        icons: { LogOut, LogIn, BarChart2, Camera, Plus, Trash2, Edit2, Search }
    });
}

// Firebase Auth & Data Listeners
onAuthStateChanged(auth, (user) => {
    state.user = user;
    if (user) {
        subscribeToRecords((records) => {
            state.records = records;
            render();
        });
    } else {
        state.currentRole = null; // reset role on logout
        state.currentView = 'roleSelection';
        render();
    }
});

// Navigation Events
document.querySelector('.footer-nav').addEventListener('click', (e) => {
    const navItem = e.target.closest('.nav-item');
    if (navItem) {
        e.preventDefault();
        state.currentRole = null; // Volver a pantalla de roles
        state.currentView = 'roleSelection';
        render();
    }
});

// Initial Render
render();
