import { createIcons, LogOut, LogIn, BarChart2, Camera, Plus, Trash2, Edit2, Search, ChevronRight, ArrowLeft } from 'lucide';
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
    const headerBackBtn = document.getElementById('header-back-btn');

    if (!state.user) {
        container.innerHTML = LoginView(state);
        LoginView.init(state, render);
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
        icons: { LogOut, LogIn, BarChart2, Camera, Plus, Trash2, Edit2, Search, ChevronRight, ArrowLeft }
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

// Initial Render
render();
