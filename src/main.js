import { createIcons, LogOut, LogIn, BarChart2, Camera, Plus, Trash2, Edit2 } from 'lucide';
import './style.css';
import { Gate5View } from './components/Gate5View';
import { JHIngresoView } from './components/JHIngresoView';
import { JHSalidaView } from './components/JHSalidaView';
import { AdminDashboard } from './components/AdminDashboard';

const state = {
    currentView: 'gate5',
    records: JSON.parse(localStorage.getItem('corinto_records') || '[]'),
};

const views = {
    gate5: Gate5View,
    'jh-in': JHIngresoView,
    'jh-out': JHSalidaView,
    admin: AdminDashboard,
};

function render() {
    const container = document.getElementById('main-content');
    const ViewComponent = views[state.currentView];

    if (ViewComponent) {
        container.innerHTML = ViewComponent(state);
        // Initialize component logic
        if (ViewComponent.init) ViewComponent.init(state, render);
    }

    // Update navigation UI
    document.querySelectorAll('.nav-item').forEach(nav => {
        nav.classList.toggle('active', nav.dataset.view === state.currentView);
    });

    // Re-initialize Lucide icons
    createIcons({
        icons: { LogOut, LogIn, BarChart2, Camera, Plus, Trash2, Edit2 }
    });
}

// Navigation Events
document.querySelector('.footer-nav').addEventListener('click', (e) => {
    const navItem = e.target.closest('.nav-item');
    if (navItem) {
        e.preventDefault();
        state.currentView = navItem.dataset.view;
        render();
    }
});

// Initial Render
render();
