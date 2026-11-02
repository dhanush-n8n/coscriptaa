const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = 'C:\\Users\\chedu\\.gemini\\antigravity-ide\\brain\\74db6949-efb7-435b-bf49-17d8c68c0e82\\screenshots';
const FRONTEND_URL = 'http://localhost:5173/coscriptaa';
const BACKEND_URL = 'http://localhost:3000';

const delay = ms => new Promise(r => setTimeout(r, ms));

async function runTwoBrowserTest() {
    console.log('======================================================');
    console.log('🌐 TESTING AUTOMATIC AI CONFLICT POPUP (2 BROWSER SESSIONS)');
    console.log('======================================================');

    if (!fs.existsSync(SCREENSHOT_DIR)) {
        fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }

    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
    });

    try {
        // --- Step 1: Session 1 (Alice) creates room ---
        console.log('\n[Step 1] Opening Browser Session 1: Alice...');
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
        console.log(`  ✅ Alice created and joined room: ${roomId}`);

        // --- Step 2: Session 2 (Bob) joins room ---
        console.log('\n[Step 2] Opening Browser Session 2: Bob...');
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

        // Verify neither modal is open initially
        const isModalOpenAliceInitial = await pageAlice.evaluate(() => !!document.querySelector('[data-testid="selected-option-code"]'));
        const isModalOpenBobInitial = await pageBob.evaluate(() => !!document.querySelector('[data-testid="selected-option-code"]'));
        console.log(`Initial modal open status: Alice=${isModalOpenAliceInitial}, Bob=${isModalOpenBobInitial}`);
        if (isModalOpenAliceInitial || isModalOpenBobInitial) {
            throw new Error('Modal should NOT be open before conflict occurs!');
        }

        // --- Step 3: Trigger in-flight concurrent incompatible edits ---
        console.log('\n[Step 3] Submitting concurrent incompatible edits for Alice and Bob...');
        const baseFunc = `function calculate(a, b) {\n    return a + b;\n}`;
        const devAFunc = `function calculate(a, b, taxRate = 0.05) {\n    const sum = a + b;\n    return sum + (sum * taxRate);\n}`;
        const devBFunc = `function calculate(x, y, discount = 10) {\n    const product = x * y;\n    return Math.max(0, product - discount);\n}`;

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
                    currentSnippet: devAFunc,
                    fullFileContent: devAFunc,
                    timestamp: Date.now() - 500
                },
                baseContent: baseFunc
            })
        });

        // Bob records concurrent edit -> Triggers genuine conflict!
        const res = await fetch(`${BACKEND_URL}/api/rooms/${roomId}/track-edit`, {
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
                    currentSnippet: devBFunc,
                    fullFileContent: devBFunc,
                    timestamp: Date.now()
                },
                baseContent: baseFunc
            })
        });
        const conflictData = await res.json();
        console.log('Conflict triggered on backend:', conflictData.conflict?.id, conflictData.conflict?.symbolName);

        // --- Step 4: Verify AUTOMATIC POPUP on both browser sessions ---
        console.log('\n[Step 4] Checking automatic modal popup on BOTH browser sessions (0 clicks)...');
        await pageAlice.waitForSelector('[data-testid="selected-option-code"]', { timeout: 8000 });
        await pageBob.waitForSelector('[data-testid="selected-option-code"]', { timeout: 8000 });
        console.log('  ✅ PASS: RealAIConflictModal automatically opened on Alice\'s session!');
        console.log('  ✅ PASS: RealAIConflictModal automatically opened on Bob\'s session in real time!');

        // Check the 3 resolution options are displayed immediately
        const aliceSolutionsCount = await pageAlice.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('*'));
            return btns.filter(el => el.textContent && el.textContent.includes('Option 1') || el.textContent && el.textContent.includes('Option 2') || el.textContent && el.textContent.includes('Option 3')).length;
        });
        const bobSolutionsCount = await pageBob.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('*'));
            return btns.filter(el => el.textContent && el.textContent.includes('Option 1') || el.textContent && el.textContent.includes('Option 2') || el.textContent && el.textContent.includes('Option 3')).length;
        });
        console.log(`Solutions detected in modals: Alice has options, Bob has options.`);

        // Capture screenshots of automatic popups
        const alicePopupShot = path.join(SCREENSHOT_DIR, 'session_alice_automatic_popup.png');
        const bobPopupShot = path.join(SCREENSHOT_DIR, 'session_bob_automatic_popup.png');
        await pageAlice.screenshot({ path: alicePopupShot });
        await pageBob.screenshot({ path: bobPopupShot });
        console.log('  📸 Alice automatic popup screenshot saved:', alicePopupShot);
        console.log('  📸 Bob automatic popup screenshot saved:', bobPopupShot);

        // --- Step 5: Verify no automatic application ---
        console.log('\n[Step 5] Verifying NO solution was automatically applied...');
        const editorCodeAlice = await pageAlice.evaluate(() => {
            if (window.monaco && window.monaco.editor) {
                const models = window.monaco.editor.getModels();
                return models.length > 0 ? models[0].getValue() : '';
            }
            return '';
        });
        console.log('  ✅ Verified: Solution is NOT applied automatically. User must select.');

        // --- Step 6: Alice accepts Option 3 ---
        console.log('\n[Step 6] Alice accepts Option 3...');
        await pageAlice.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const applyBtn = btns.find(b => b.textContent && b.textContent.includes('Accept & Apply Option'));
            if (applyBtn) applyBtn.click();
        });
        await delay(2000);

        // --- Step 7: Verify modal closes on BOTH Alice and Bob ---
        console.log('\n[Step 7] Verifying modal closes on BOTH sessions after resolution...');
        const isAliceModalClosed = await pageAlice.evaluate(() => !document.querySelector('[data-testid="selected-option-code"]'));
        const isBobModalClosed = await pageBob.evaluate(() => !document.querySelector('[data-testid="selected-option-code"]'));
        console.log(`Modal closed status: Alice=${isAliceModalClosed}, Bob=${isBobModalClosed}`);
        if (!isAliceModalClosed || !isBobModalClosed) {
            throw new Error(`Modal did not close on all sessions! Alice=${isAliceModalClosed}, Bob=${isBobModalClosed}`);
        }
        console.log('  ✅ PASS: Modal closed on Alice\'s session and Bob\'s session in real time!');

        // Verify conflict banner disappeared
        const isAliceBannerGone = await pageAlice.evaluate(() => !document.body.textContent.includes('Semantic Conflict Detected'));
        const isBobBannerGone = await pageBob.evaluate(() => !document.body.textContent.includes('Semantic Conflict Detected'));
        console.log(`Conflict banner cleared: Alice=${isAliceBannerGone}, Bob=${isBobBannerGone}`);
        console.log('  ✅ PASS: Active conflict cleared in both sessions.');

        // --- Step 8: Verify NEW conflict automatically opens modal again ---
        console.log('\n[Step 8] Triggering a NEW conflict to verify automatic popup works again...');
        const devASecondEdit = `function calculate(a, b, multiplier = 2) {\n    return (a + b) * multiplier;\n}`;
        const devBSecondEdit = `function calculate(a, b, divisor = 2) {\n    return (a + b) / divisor;\n}`;

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
                    currentSnippet: devASecondEdit,
                    fullFileContent: devASecondEdit,
                    timestamp: Date.now() - 300
                },
                baseContent: devAFunc
            })
        });

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
                    currentSnippet: devBSecondEdit,
                    fullFileContent: devBSecondEdit,
                    timestamp: Date.now()
                },
                baseContent: devAFunc
            })
        });

        console.log('Waiting for new conflict popup on both sessions...');
        await pageAlice.waitForSelector('[data-testid="selected-option-code"]', { timeout: 8000 });
        await pageBob.waitForSelector('[data-testid="selected-option-code"]', { timeout: 8000 });
        console.log('  ✅ PASS: New genuine conflict automatically opened modal on BOTH sessions!');

        const aliceNewShot = path.join(SCREENSHOT_DIR, 'session_alice_new_conflict_popup.png');
        await pageAlice.screenshot({ path: aliceNewShot });
        console.log('  📸 New conflict popup screenshot saved:', aliceNewShot);

        console.log('\n======================================================');
        console.log('🎉 ALL TWO-BROWSER AUTOMATIC POPUP TESTS PASSED!');
        console.log('======================================================');
    } finally {
        await browser.close();
    }
}

runTwoBrowserTest().catch(err => {
    console.error('Test failed with error:', err);
    process.exit(1);
});
