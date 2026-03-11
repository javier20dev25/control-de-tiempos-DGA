import { createIcons, LogOut, LogIn, BarChart2, Camera, Plus, Trash2, Edit2 } from 'lucide';
import './style.css';
import { Gate5View } from './components/Gate5View';
import { JHIngresoView } from './components/JHIngresoView';
import { JHSalidaView } from './components/JHSalidaView';
import { AdminDashboard } from './components/AdminDashboard';

import { auth, subscribeToRecords } from './utils/firebase';
import { onAuthStateChanged } from "firebase/auth";
import { LoginView } from './components/LoginView';

const state = {
    currentView: 'gate5',
    user: null,
    records: [],
};

const views = {
    login: LoginView,
    gate5: Gate5View,
    'jh-in': JHIngresoView,
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

    nav.style.display = 'flex';
    const ViewComponent = views[state.currentView];

    if (ViewComponent) {
        container.innerHTML = ViewComponent(state);
        if (ViewComponent.init) ViewComponent.init(state, render);
    }

    document.querySelectorAll('.nav-item').forEach(navItem => {
        navItem.classList.toggle('active', navItem.dataset.view === state.currentView);
    });

    createIcons({
        icons: { LogOut, LogIn, BarChart2, Camera, Plus, Trash2, Edit2 }
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
        render();
    }
});

// Navigation Events
document.querySelector('.footer-nav').addEventListener('click', (e) => {
    const navItem = e.target.closest('.nav-item');
    if (navItem) {
        e.preventDefault();
        if (navItem.dataset.view === 'logout') {
            auth.signOut();
            return;
        }
        state.currentView = navItem.dataset.view;
        render();
    }
});

// Initial Render
render();
