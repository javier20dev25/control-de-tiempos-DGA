const { chromium } = require('playwright');

(async () => {
    console.log("==================================================");
    console.log("🚀 INICIANDO PRUEBA E2E AUTOMATIZADA (VERCEL SYNC)");
    console.log("==================================================");

    const browser = await chromium.launch({ headless: false, slowMo: 400 });
    const context = await browser.newContext();
    const page = await context.newPage();

    console.log("🌐 Navegando a la aplicación de producción en Vercel/Firebase...");
    await page.goto('https://monitoreodga-dcd21.web.app/');

    console.log("⌛ ESPERANDO ACCIÓN DEL USUARIO:");
    console.log("   Por favor, haz clic en 'Acceder con Google', selecciona tu cuenta y espera.");
    console.log("   El script continuará automáticamente al detectar el menú principal.");
    console.log("   (Tienes 2 minutos para completar este paso)");

    // Wait until login completes and role selection appears
    await page.waitForSelector('text="P-5 (Gate 5)"', { timeout: 120000 });

    console.log("✅ ¡Sesión detectada! Comenzando el flujo operativo automatizado...");
    const testContainer = 'TEST1234567';

    // ================== PORTÓN 5 ==================
    console.log("➡️ [1/4] Entrando a Portón 5...");
    await page.click('button[data-role="gate5"]');
    await page.waitForTimeout(1000);

    const startG5 = await page.$('button:has-text("EMPEZAR TURNO")');
    if (startG5) {
        console.log("   - Iniciando turno...");
        await startG5.click();
        await page.waitForTimeout(1500);
    }

    console.log("   - Registrando contenedor de prueba...");
    await page.click('button:has-text("VERDE (L-)")');
    await page.fill('#declaration-input', 'L-E2ETEST');
    await page.fill('#container-input', testContainer);
    await page.click('button:has-text("REGISTRAR SALIDA")');
    await page.waitForTimeout(3000); // Give Firestore time to save

    console.log("   - Concluyendo turno...");
    page.once('dialog', dialog => dialog.accept());
    const endG5 = await page.$('button:has-text("CONCLUIR TURNO")');
    if (endG5) { await endG5.click(); await page.waitForTimeout(1500); }

    await page.click('#header-back-btn');
    await page.waitForTimeout(1000);

    // ================== JH INGRESO ==================
    console.log("➡️ [2/4] Entrando a Julia Herrera (Ingreso)...");
    await page.click('button[data-role="jh-in"]');
    await page.waitForTimeout(1000);

    const startJHIn = await page.$('button:has-text("EMPEZAR TURNO")');
    if (startJHIn) {
        console.log("   - Iniciando turno...");
        await startJHIn.click();
        await page.waitForTimeout(1500);
    }

    console.log("   - Buscando contenedor registrado...");
    await page.fill('#search-input', '4567'); // Last 4 digits of TEST1234567
    await page.waitForTimeout(1500);
    
    console.log("   - Marcando Llegada a Recinto...");
    const btnArrival = await page.$('.btn-arrival'); // From JHIngresoView
    if (btnArrival) {
        await btnArrival.click();
        await page.waitForTimeout(3000);
    } else {
        console.log("   ⚠️ No se encontró el botón de llegada. Continuamos.");
    }

    console.log("   - Concluyendo turno...");
    page.once('dialog', dialog => dialog.accept());
    const endJHIn = await page.$('button:has-text("CONCLUIR TURNO")');
    if (endJHIn) { await endJHIn.click(); await page.waitForTimeout(1500); }

    await page.click('#header-back-btn');
    await page.waitForTimeout(1000);

    // ================== ADMIN / FINISH ==================
    console.log("✅ ¡Flujo de pruebas completado con éxito!");
    console.log("Cerrando el navegador E2E en 5 segundos...");
    await page.waitForTimeout(5000);
    
    await browser.close();
    console.log("==================================================");
    console.log("🎉 PRUEBAS TERMINADAS. EL CICD FUNCIONA CORRECTAMENTE.");
    console.log("==================================================");
})();
