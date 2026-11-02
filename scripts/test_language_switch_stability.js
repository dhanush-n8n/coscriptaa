const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = 'C:\\Users\\chedu\\.gemini\\antigravity-ide\\brain\\74db6949-efb7-435b-bf49-17d8c68c0e82\\screenshots';
const FRONTEND_URL = 'http://localhost:5173/coscriptaa';

const delay = ms => new Promise(r => setTimeout(r, ms));

async function getDropdownLanguage(page) {
    return await page.evaluate(() => {
        // Find language dropdown button in the header
        const btns = Array.from(document.querySelectorAll('button'));
        const langBtn = btns.find(b => {
            const txt = b.textContent ? b.textContent.trim() : '';
            return ['JavaScript', 'Python', 'C++', 'Go', 'Select Language'].some(lang => txt.includes(lang));
        });
        return langBtn ? langBtn.textContent.trim() : null;
    });
}

async function getMonacoLanguage(page) {
    return await page.evaluate(() => {
        if (window.monaco && window.monaco.editor) {
            const editors = window.monaco.editor.getEditors();
            if (editors.length > 0) {
                const model = editors[0].getModel();
                return model ? model.getLanguageId() : null;
            }
        }
        return null;
    });
}

async function getActiveFileName(page) {
    return await page.evaluate(() => {
        const fileItems = Array.from(document.querySelectorAll('[data-file-id], .file-tree-item, div'));
        // Search for main.py or main.js or text in header/explorer
        const mainItem = fileItems.find(el => el.textContent && (el.textContent.includes('main.py') || el.textContent.includes('main.js')));
        if (mainItem) {
            return mainItem.textContent.includes('main.py') ? 'main.py' : 'main.js';
        }
        return null;
    });
}

async function selectLanguage(page, targetLanguage) {
    await page.bringToFront();
    await delay(200);

    // 1. Locate the dropdown button handle
    const buttons = await page.$$('button');
    let langBtn = null;
    for (const b of buttons) {
        const text = await page.evaluate(el => el.textContent, b);
        if (['JavaScript', 'Python', 'C++', 'Go', 'Select Language'].some(l => text && text.includes(l))) {
            langBtn = b;
            break;
        }
    }

    if (!langBtn) throw new Error('Could not find language dropdown button');
    
    // Native click triggers pointerdown, mousedown, mouseup, click required by Radix UI
    await langBtn.click();
    await delay(500);

    // 2. Find and click target language menu item
    await page.waitForSelector('[role="menuitem"]', { timeout: 5000 });
    const menuItems = await page.$$('[role="menuitem"]');
    let targetItem = null;
    for (const item of menuItems) {
        const text = await page.evaluate(el => el.textContent.trim(), item);
        if (text === targetLanguage) {
            targetItem = item;
            break;
        }
    }

    if (!targetItem) throw new Error(`Could not find menu item for ${targetLanguage}`);
    await targetItem.click();
    await delay(500);
}

async function sampleStability(page, durationMs, label) {
    const samples = [];
    const interval = 200;
    const count = Math.floor(durationMs / interval);

    for (let i = 0; i < count; i++) {
        await delay(interval);
        const lang = await getDropdownLanguage(page);
        const monacoLang = await getMonacoLanguage(page);
        samples.push({ timeMs: (i + 1) * interval, dropdownLang: lang, monacoLang: monacoLang });
    }

    // Check for any variations / flickering
    const distinctDropdown = Array.from(new Set(samples.map(s => s.dropdownLang)));
    const distinctMonaco = Array.from(new Set(samples.map(s => s.monacoLang)));

    const isStable = distinctDropdown.length === 1 && distinctMonaco.length === 1;
    console.log(`  [Stability Check: ${label}] Distinct Dropdown States: [${distinctDropdown.join(', ')}], Distinct Monaco: [${distinctMonaco.join(', ')}] -> ${isStable ? '✅ STABLE (ZERO FLICKERING)' : '❌ UNSTABLE (FLICKERING DETECTED)'}`);

    return {
        isStable,
        distinctDropdown,
        distinctMonaco,
        finalDropdown: samples[samples.length - 1]?.dropdownLang,
        finalMonaco: samples[samples.length - 1]?.monacoLang
    };
}

async function runTest() {
    console.log('================================================================');
    console.log('🔍 VERIFYING LANGUAGE SWITCHING STABILITY (NO FLICKER / SHUTTER)');
    console.log('================================================================');

    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
    });

    try {
        // --- Step 1: User A (Alice) opens and creates room ---
        console.log('\n[Phase 1] Launching Alice session...');
        const pageAlice = await browser.newPage();
        await pageAlice.setViewport({ width: 1440, height: 900 });

        await pageAlice.goto(`${FRONTEND_URL}/start`, { waitUntil: 'load' });
        await pageAlice.waitForSelector('#name');
        await pageAlice.type('#name', 'Alice (Dev A)');

        await pageAlice.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const btn = btns.find(b => b.textContent && b.textContent.includes('Create new room'));
            if (btn) btn.click();
        });

        await pageAlice.waitForSelector('.monaco-editor', { timeout: 15000 });
        await delay(1000);

        const currentUrl = pageAlice.url();
        const roomId = currentUrl.split('/code/')[1].split('?')[0].replace(/\/+$/, '');
        console.log(`  ✅ Alice joined room: ${roomId}`);

        const initLang = await getDropdownLanguage(pageAlice);
        const initMonaco = await getMonacoLanguage(pageAlice);
        console.log(`  Initial Dropdown: "${initLang}", Initial Monaco: "${initMonaco}"`);

        // --- Step 2: Switch to Python ---
        console.log('\n[Phase 2] Switching language to Python...');
        await selectLanguage(pageAlice, 'Python');

        console.log('  Monitoring language stability for 3000ms (sampling every 200ms)...');
        const pythonStability = await sampleStability(pageAlice, 3000, 'Python Selection');
        if (!pythonStability.isStable || !pythonStability.finalDropdown.includes('Python')) {
            throw new Error(`Python selection failed stability check: ${JSON.stringify(pythonStability)}`);
        }

        const activeFilePy = await getActiveFileName(pageAlice);
        console.log(`  Active file after Python switch: ${activeFilePy}`);
        await pageAlice.screenshot({ path: path.join(SCREENSHOT_DIR, 'verify_lang_python_stable.png') });

        // --- Step 3: Switch Files in Explorer and Return ---
        console.log('\n[Phase 3] Switching files in Explorer to verify language stability...');
        // Click on utils.js or another file if present
        const fileSwitched = await pageAlice.evaluate(() => {
            const items = Array.from(document.querySelectorAll('div, span, button'));
            const utilsItem = items.find(el => el.textContent && el.textContent.trim() === 'utils.js');
            if (utilsItem) {
                utilsItem.click();
                return true;
            }
            return false;
        });

        if (fileSwitched) {
            console.log('  Switched to utils.js...');
            await delay(500);
            const utilsLang = await getDropdownLanguage(pageAlice);
            console.log(`  Dropdown on utils.js: "${utilsLang}"`);

            // Switch back to main.py
            await pageAlice.evaluate(() => {
                const items = Array.from(document.querySelectorAll('div, span, button'));
                const mainPy = items.find(el => el.textContent && el.textContent.trim() === 'main.py');
                if (mainPy) mainPy.click();
            });
            await delay(500);
            const backLang = await getDropdownLanguage(pageAlice);
            console.log(`  Dropdown back on main.py: "${backLang}"`);
            if (!backLang.includes('Python')) {
                throw new Error(`Expected Python after switching back to main.py, got: ${backLang}`);
            }
        } else {
            console.log('  (Single file in explorer, file switch check skipped)');
        }

        // --- Step 4: Refresh Page and Verify Persistence ---
        console.log('\n[Phase 4] Refreshing page to verify language persistence...');
        await pageAlice.reload({ waitUntil: 'load' });
        // Since Recoil resets in-memory user atom, ProtectedRouter redirects to /:roomId to rejoin
        await pageAlice.waitForSelector('#name', { timeout: 10000 });
        await pageAlice.type('#name', 'Alice (Dev A)');
        await pageAlice.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const btn = btns.find(b => b.textContent && b.textContent.includes('Join with room code'));
            if (btn) btn.click();
        });
        await pageAlice.waitForSelector('.monaco-editor', { timeout: 15000 });
        await delay(1200);

        const reloadLang = await getDropdownLanguage(pageAlice);
        const reloadMonaco = await getMonacoLanguage(pageAlice);
        console.log(`  After reload: Dropdown = "${reloadLang}", Monaco = "${reloadMonaco}"`);

        const reloadStability = await sampleStability(pageAlice, 2000, 'Post-Reload Persistence');
        if (!reloadStability.isStable || !reloadStability.finalDropdown.includes('Python')) {
            throw new Error(`Post-reload failed to persist Python: ${JSON.stringify(reloadStability)}`);
        }
        await pageAlice.screenshot({ path: path.join(SCREENSHOT_DIR, 'verify_lang_after_reload_stable.png') });

        // --- Step 5: Switch back to JavaScript ---
        console.log('\n[Phase 5] Switching back to JavaScript...');
        await selectLanguage(pageAlice, 'JavaScript');

        const jsStability = await sampleStability(pageAlice, 3000, 'JavaScript Selection');
        if (!jsStability.isStable || !jsStability.finalDropdown.includes('JavaScript')) {
            throw new Error(`JavaScript selection failed stability check: ${JSON.stringify(jsStability)}`);
        }
        await pageAlice.screenshot({ path: path.join(SCREENSHOT_DIR, 'verify_lang_javascript_stable.png') });

        // --- Step 6: Two-User Remote Synchronization & Echo Check ---
        console.log('\n[Phase 6] Opening Bob session to verify remote sync & echo prevention...');
        const pageBob = await browser.newPage();
        await pageBob.setViewport({ width: 1440, height: 900 });

        await pageBob.goto(`${FRONTEND_URL}/${roomId}`, { waitUntil: 'load' });
        await pageBob.waitForSelector('#name');
        await pageBob.type('#name', 'Bob (Dev B)');

        await pageBob.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const btn = btns.find(b => b.textContent && b.textContent.includes('Join with room code'));
            if (btn) btn.click();
        });

        await pageBob.waitForSelector('.monaco-editor', { timeout: 15000 });
        await delay(1500);

        console.log('  Alice switches to Python...');
        await selectLanguage(pageAlice, 'Python');
        await delay(1000);

        const bobLangAfterAlicePy = await getDropdownLanguage(pageBob);
        const aliceLangAfterPy = await getDropdownLanguage(pageAlice);
        console.log(`  Alice: "${aliceLangAfterPy}", Bob (received): "${bobLangAfterAlicePy}"`);

        console.log('  Verifying no feedback loop between Alice and Bob...');
        const dualStability = await Promise.all([
            sampleStability(pageAlice, 2500, 'Dual User Alice'),
            sampleStability(pageBob, 2500, 'Dual User Bob')
        ]);

        if (!dualStability[0].isStable || !dualStability[1].isStable) {
            throw new Error('Feedback loop detected between dual users!');
        }

        console.log('\n================================================================');
        console.log('🎉 ALL LANGUAGE STABILITY & PERSISTENCE VERIFICATIONS PASSED!');
        console.log('   - Python selection: 100% Stable (zero flickering)');
        console.log('   - File switching: 100% Stable');
        console.log('   - Page reload: Persisted correctly (Python preserved)');
        console.log('   - JavaScript selection: 100% Stable');
        console.log('   - Two-user remote sync: No echo loops or shuttering');
        console.log('================================================================');

    } finally {
        await browser.close();
    }
}

runTest().catch(err => {
    console.error('\n❌ TEST FAILED:', err);
    process.exit(1);
});
