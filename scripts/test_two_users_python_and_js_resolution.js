const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = 'C:\\Users\\chedu\\.gemini\\antigravity-ide\\brain\\74db6949-efb7-435b-bf49-17d8c68c0e82\\screenshots';
const FRONTEND_URL = 'http://localhost:5173/coscriptaa';
const BACKEND_URL = 'http://localhost:3000';

const delay = ms => new Promise(r => setTimeout(r, ms));

async function runTwoUserTest() {
    console.log('========================================================================');
    console.log('🧪 VERIFYING TWO-USER CONFLICT RESOLUTION: JAVASCRIPT & PYTHON');
    console.log('========================================================================\n');

    if (!fs.existsSync(SCREENSHOT_DIR)) {
        fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }

    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
    });

    try {
        // --------------------------------------------------------------------
        // SETUP: ALICE CREATES ROOM, BOB JOINS
        // --------------------------------------------------------------------
        console.log('[Setup] Alice creates room...');
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
        const currentUrl = pageAlice.url();
        const roomId = currentUrl.split('/code/')[1].split('?')[0].replace(/\/+$/, '');
        console.log(`  ✅ Alice created room: ${roomId}`);

        console.log('[Setup] Bob joins room...');
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
        console.log(`  ✅ Bob joined room: ${roomId}`);

        // ====================================================================
        // TEST 1: JAVASCRIPT FILE CONFLICT RESOLUTION
        // ====================================================================
        console.log('\n--- TEST 1: JavaScript File Conflict Resolution (main.js) ---');
        const jsBase = `function calculate(a, b) {\n    return a + b;\n}`;
        const jsDevA = `function calculate(a, b, taxRate = 0.05) {\n    const sum = a + b;\n    return sum + (sum * taxRate);\n}`;
        const jsDevB = `function calculate(x, y, discount = 10) {\n    const product = x * y;\n    return Math.max(0, product - discount);\n}`;

        // Alice records edit
        await fetch(`${BACKEND_URL}/api/rooms/${roomId}/track-edit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                edit: {
                    userId: 'dev-alice',
                    userName: 'Alice',
                    fileId: 'main_js',
                    fileName: 'main.js',
                    language: 'javascript',
                    symbolName: 'calculate',
                    currentSnippet: jsDevA,
                    fullFileContent: jsDevA,
                    timestamp: Date.now() - 500
                },
                baseContent: jsBase
            })
        });

        // Bob records concurrent edit -> Conflict detected!
        await fetch(`${BACKEND_URL}/api/rooms/${roomId}/track-edit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                edit: {
                    userId: 'dev-bob',
                    userName: 'Bob',
                    fileId: 'main_js',
                    fileName: 'main.js',
                    language: 'javascript',
                    symbolName: 'calculate',
                    currentSnippet: jsDevB,
                    fullFileContent: jsDevB,
                    timestamp: Date.now()
                },
                baseContent: jsBase
            })
        });

        // Verify conflict banner and modal on both sessions
        await pageAlice.waitForSelector('[data-testid="selected-option-code"]', { timeout: 8000 });
        await pageBob.waitForSelector('[data-testid="selected-option-code"]', { timeout: 8000 });
        console.log('  ✅ Conflict modal popped up automatically on both Alice and Bob');

        // Alice applies Option 3
        console.log('Alice clicking "Accept & Apply Option 3"...');
        await pageAlice.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const applyBtn = btns.find(b => b.textContent && b.textContent.includes('Accept & Apply Option'));
            if (applyBtn) applyBtn.click();
        });
        await delay(2500);

        // Verify modals closed on both
        const isAliceModalClosedJs = await pageAlice.evaluate(() => !document.querySelector('[data-testid="selected-option-code"]'));
        const isBobModalClosedJs = await pageBob.evaluate(() => !document.querySelector('[data-testid="selected-option-code"]'));
        if (!isAliceModalClosedJs || !isBobModalClosedJs) {
            throw new Error(`Modals did not close! Alice=${isAliceModalClosedJs}, Bob=${isBobModalClosedJs}`);
        }
        console.log('  ✅ PASS: Conflict modal closed on both Alice and Bob after resolution');

        // Verify conflict banner disappeared completely
        const isAliceBannerGoneJs = await pageAlice.evaluate(() => !document.body.textContent.includes('Semantic Conflict Detected'));
        const isBobBannerGoneJs = await pageBob.evaluate(() => !document.body.textContent.includes('Semantic Conflict Detected'));
        if (!isAliceBannerGoneJs || !isBobBannerGoneJs) {
            throw new Error(`Conflict banner still visible! Alice=${!isAliceBannerGoneJs}, Bob=${!isBobBannerGoneJs}`);
        }
        console.log('  ✅ PASS: "Semantic Conflict Detected" banner disappeared completely from both sessions');

        // Verify identical code in both Monaco editors
        const codeAliceJs = await pageAlice.evaluate(() => window.monaco.editor.getModels()[0].getValue());
        const codeBobJs = await pageBob.evaluate(() => window.monaco.editor.getModels()[0].getValue());
        console.log(`Alice Monaco length: ${codeAliceJs.length}, Bob Monaco length: ${codeBobJs.length}`);
        if (codeAliceJs.trim() !== codeBobJs.trim()) {
            throw new Error('Alice and Bob have mismatched code after JS Option 3!');
        }
        if (!codeAliceJs.includes('function calculate') || !codeAliceJs.includes('taxRate') || !codeAliceJs.includes('discount')) {
            throw new Error('Code does not contain merged Option 3 calculate function!');
        }
        console.log('  ✅ PASS: Both Alice and Bob have IDENTICAL JavaScript merged code');

        // Wait to verify banner DOES NOT reappear
        await delay(2000);
        const bannerReappearedAliceJs = await pageAlice.evaluate(() => document.body.textContent.includes('Semantic Conflict Detected'));
        const bannerReappearedBobJs = await pageBob.evaluate(() => document.body.textContent.includes('Semantic Conflict Detected'));
        if (bannerReappearedAliceJs || bannerReappearedBobJs) {
            throw new Error('Stale conflict banner reappeared after resolution!');
        }
        console.log('  ✅ PASS: Stale conflict data did NOT re-trigger the conflict');

        // Screenshot JS resolved state
        const jsResolvedShot = path.join(SCREENSHOT_DIR, 'session_alice_js_resolved_clean.png');
        await pageAlice.screenshot({ path: jsResolvedShot });
        console.log('  📸 Screenshot saved:', jsResolvedShot);

        // ====================================================================
        // TEST 2: PYTHON FILE CONFLICT RESOLUTION
        // ====================================================================
        console.log('\n--- TEST 2: Python File Conflict Resolution (main.py) ---');
        // Alice switches language to Python
        console.log('Alice switching language to Python...');
        await pageAlice.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const langBtn = btns.find(b => b.textContent && (b.textContent.includes('JavaScript') || b.textContent.includes('Python')));
            if (langBtn) langBtn.click();
        });
        await delay(600);
        await pageAlice.evaluate(() => {
            const items = Array.from(document.querySelectorAll('[role="menuitem"]'));
            const pyItem = items.find(i => i.textContent && i.textContent.includes('Python'));
            if (pyItem) pyItem.click();
        });
        await delay(1200);

        const pyBase = `def calculate(a, b):\n    return a + b`;
        const pyDevA = `def calculate(a, b, tax_rate=0.05):\n    subtotal = a + b\n    tax = subtotal * tax_rate\n    return subtotal + tax`;
        const pyDevB = `def calculate(a, b, discount=10):\n    subtotal = a + b\n    return max(0, subtotal - discount)`;

        // Alice records Python edit
        await fetch(`${BACKEND_URL}/api/rooms/${roomId}/track-edit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                edit: {
                    userId: 'dev-alice',
                    userName: 'Alice',
                    fileId: 'main_js',
                    fileName: 'main.py',
                    language: 'python',
                    symbolName: 'calculate',
                    currentSnippet: pyDevA,
                    fullFileContent: pyDevA,
                    timestamp: Date.now() - 500
                },
                baseContent: pyBase
            })
        });

        // Bob records concurrent Python edit -> Conflict detected!
        await fetch(`${BACKEND_URL}/api/rooms/${roomId}/track-edit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                edit: {
                    userId: 'dev-bob',
                    userName: 'Bob',
                    fileId: 'main_js',
                    fileName: 'main.py',
                    language: 'python',
                    symbolName: 'calculate',
                    currentSnippet: pyDevB,
                    fullFileContent: pyDevB,
                    timestamp: Date.now()
                },
                baseContent: pyBase
            })
        });

        // Verify conflict modal popped up automatically on both
        await pageAlice.waitForSelector('[data-testid="selected-option-code"]', { timeout: 8000 });
        await pageBob.waitForSelector('[data-testid="selected-option-code"]', { timeout: 8000 });
        console.log('  ✅ Python conflict modal popped up automatically on both Alice and Bob');

        // Bob applies Option 3 (Python)
        console.log('Bob clicking "Accept & Apply Option 3"...');
        await pageBob.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const applyBtn = btns.find(b => b.textContent && b.textContent.includes('Accept & Apply Option'));
            if (applyBtn) applyBtn.click();
        });
        await delay(2500);

        // Verify modals closed on both
        const isAliceModalClosedPy = await pageAlice.evaluate(() => !document.querySelector('[data-testid="selected-option-code"]'));
        const isBobModalClosedPy = await pageBob.evaluate(() => !document.querySelector('[data-testid="selected-option-code"]'));
        if (!isAliceModalClosedPy || !isBobModalClosedPy) {
            throw new Error(`Modals did not close! Alice=${isAliceModalClosedPy}, Bob=${isBobModalClosedPy}`);
        }
        console.log('  ✅ PASS: Conflict modal closed on both Alice and Bob after Python resolution');

        // Verify conflict banner disappeared completely
        const isAliceBannerGonePy = await pageAlice.evaluate(() => !document.body.textContent.includes('Semantic Conflict Detected'));
        const isBobBannerGonePy = await pageBob.evaluate(() => !document.body.textContent.includes('Semantic Conflict Detected'));
        if (!isAliceBannerGonePy || !isBobBannerGonePy) {
            throw new Error(`Conflict banner still visible! Alice=${!isAliceBannerGonePy}, Bob=${!isBobBannerGonePy}`);
        }
        console.log('  ✅ PASS: "Semantic Conflict Detected" banner disappeared completely from both sessions');

        // Verify identical code in both Monaco editors
        const codeAlicePy = await pageAlice.evaluate(() => window.monaco.editor.getModels()[0].getValue());
        const codeBobPy = await pageBob.evaluate(() => window.monaco.editor.getModels()[0].getValue());
        console.log(`Alice Monaco length: ${codeAlicePy.length}, Bob Monaco length: ${codeBobPy.length}`);
        if (codeAlicePy.trim() !== codeBobPy.trim()) {
            throw new Error('Alice and Bob have mismatched code after Python Option 3!');
        }
        if (!codeAlicePy.includes('def calculate') || !codeAlicePy.includes('tax_rate') || !codeAlicePy.includes('discount')) {
            throw new Error('Code does not contain merged Option 3 calculate function in Python!');
        }
        console.log('  ✅ PASS: Both Alice and Bob have IDENTICAL Python merged code');

        // Wait to verify banner DOES NOT reappear
        await delay(2000);
        const bannerReappearedAlicePy = await pageAlice.evaluate(() => document.body.textContent.includes('Semantic Conflict Detected'));
        const bannerReappearedBobPy = await pageBob.evaluate(() => document.body.textContent.includes('Semantic Conflict Detected'));
        if (bannerReappearedAlicePy || bannerReappearedBobPy) {
            throw new Error('Stale conflict banner reappeared after Python resolution!');
        }
        console.log('  ✅ PASS: Stale conflict data did NOT re-trigger the conflict');

        // Screenshot Python resolved state
        const pyResolvedShot = path.join(SCREENSHOT_DIR, 'session_alice_py_resolved_clean.png');
        await pageAlice.screenshot({ path: pyResolvedShot });
        console.log('  📸 Screenshot saved:', pyResolvedShot);

        console.log('\n========================================================================');
        console.log('🎉 ALL TWO-USER JAVASCRIPT & PYTHON CONFLICT RESOLUTION TESTS PASSED!');
        console.log('========================================================================');
    } finally {
        await browser.close();
    }
}

runTwoUserTest().catch(err => {
    console.error('Test failed with error:', err);
    process.exit(1);
});
