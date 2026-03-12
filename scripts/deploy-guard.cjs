const fs = require('fs');
const path = require('path');

console.log("🛡️ Ejecutando Guardia de Despliegue (Deploy Guard)...");

// 1. Verificar que no haya flags peligrosos en scripts o comandos comunes
const projectPath = path.resolve(__dirname, '..');
const packageJsonPath = path.join(projectPath, 'package.json');

if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const scripts = packageJson.scripts || {};
    
    for (const [name, cmd] of Object.entries(scripts)) {
        if (cmd.includes('--force') || cmd.includes('delete') || cmd.includes('reset')) {
            console.error(`❌ ERROR DE SEGURIDAD: El script "${name}" contiene comandos potencialmente destructivos: "${cmd}"`);
            process.exit(1);
        }
    }
}

// 2. Verificar firestore.rules para asegurar que no haya permisos 'allow delete' globales
const rulesPath = path.join(projectPath, 'firestore.rules');
if (fs.existsSync(rulesPath)) {
    const rules = fs.readFileSync(rulesPath, 'utf8');
    if (rules.includes('allow delete: if true') || rules.includes('allow delete;')) {
        console.warn("⚠️ ADVERTENCIA: Se han detectado reglas de borrado potencialmente amplias en firestore.rules.");
        // Podríamos fallar aquí si el usuario quiere máxima restricción.
    }
}

console.log("✅ Verificación de seguridad completada. Procediendo con el despliegue...");
process.exit(0);
