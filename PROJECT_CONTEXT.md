# Corinto Flow - Project Context

## Project Identity
- **Name**: Corinto Flow
- **Purpose**: Specialized platform for maritime cargo tracking and "Medición de Tiempos" (Time Measurement) at DGA Puerto Corinto.
- **Project Structure**:
    - `index.html`: Main entry point.
    - `src/main.js`: Main router and Firebase auth bridge.
    - `src/components/`: Modular views (e.g., `PotosiView.js`, `Gate5View.js`).
    - `src/utils/`: Backend-like utilities (Firebase, Shifts).
    - `style.css`: Global design system and responsiveness.

## Tech Stack
- **Frontend**: Vanilla JavaScript (ESM), Vite, Lucide Icons.
- **Backend**: Firebase (Auth, Firestore).
- **Hosting/CI-CD**: Vercel (Production), GitHub Actions (Firebase preview/merge).

## Branching Logic (CRITICAL)
- **`main` (Principal)**: The primary development branch where all changes should be reviewed.
- **`master` (Maestro)**: The production branch synced with GitHub's current "Production" release.
- **Synchronization**: Always merge `main` into `master` after verifying stability in `main`.

## Component Specifics
- **PotosiView**: 
    - Handles maritime vessel reports. 
    - UI: `Aperturar Lancha` -> Modal -> `localStorage` persistence.
    - Icons: Uses `window.lucide.createIcons()` for dynamic content reinforcement.
- **Firebase**:
    - Rules are stored in `firestore.rules`.
    - Indexes in `firestore.indexes.json`.

## Mapping Tool
Run `python scripts/project_map.py` to get a summarized view of the project structure at any time.
