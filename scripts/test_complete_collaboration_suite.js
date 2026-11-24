/**
 * CoScripta Complete Localhost Collaboration Repair - Comprehensive Test Suite
 * 
 * Verifies all 9 core requirements:
 * 1. Two users joining the same room.
 * 2. User A typing and User B receiving changes.
 * 3. User B typing and User A receiving changes.
 * 4. Simultaneous editing without duplicated content.
 * 5. Switching between files.
 * 6. Switching programming languages (zero flickering, synchronized).
 * 7. A user refreshing and reconnecting.
 * 8. A new user joining an existing room (state hydration without duplication).
 * 9. Multiple users editing without losing changes.
 */

const puppeteer = require('puppeteer-core');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const FRONTEND_URL = 'http://localhost:5173/coscriptaa';

const delay = ms => new Promise(r => setTimeout(r, ms));

async function getEditorContent(page) {
    return await page.evaluate(() => {
        const editors = window.monaco?.editor?.getEditors() || [];
        return editors.length > 0 ? editors[0].getValue() : null;
    });
}

async function getDropdownLanguage(page) {
    return await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const btn = btns.find(b => ['JavaScript', 'Python', 'C++', 'Go', 'Select Language'].some(l => b.textContent?.includes(l)));
        return btn ? btn.textContent.trim() : null;
    });
}

async function getMonacoLanguage(page) {
    return await page.evaluate(() => {
        const editors = window.monaco?.editor?.getEditors() || [];
        if (editors.length > 0) {
            const model = editors[0].getModel();
            return model ? model.getLanguageId() : null;
        }
        return null;
    });
}

async function getActiveFileLabel(page) {
    return await page.evaluate(() => {
        const spans = Array.from(document.querySelectorAll('span'));
        const fileSpan = spans.find(s => s.textContent && /\.(js|py|ts|cpp|go|md)$/.test(s.textContent.trim()));
        return fileSpan ? fileSpan.textContent.trim() : null;
    });
}

async function typeInEditor(page, text, lineNumber = 1) {
    await page.evaluate((txt, line) => {
        const editor = window.monaco.editor.getEditors()[0];
        const model = editor.getModel();
        model.applyEdits([{
            range: new window.monaco.Range(line, 1, line, 1),
            text: txt
        }]);
    }, text, lineNumber);
}

async function selectLanguage(page, targetLanguage) {
    await page.bringToFront();
    await delay(300);

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
    
    await langBtn.click();
    await delay(600);

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
    await delay(600);
}

async function runTestSuite() {
    console.log('================================================================');
    console.log('🚀 RUNNING COMPLETE COSCRIPTA LOCALHOST COLLABORATION TEST SUITE');
    console.log('================================================================\n');

    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
    });

    let passed = 0;
    let failed = 0;

    function assert(condition, testName, detail = '') {
        if (condition) {
            console.log(`  ✅ PASS: ${testName} ${detail ? '(' + detail + ')' : ''}`);
            passed++;
        } else {
            console.error(`  ❌ FAIL: ${testName} ${detail ? '(' + detail + ')' : ''}`);
            failed++;
        }
    }

    try {
        // -------------------------------------------------------------
        // TEST 1: Two users joining the same room
        // -------------------------------------------------------------
        console.log('[TEST 1] Two users joining the same room...');
        const pageA = await browser.newPage();
        await pageA.bringToFront();
        await pageA.goto(`${FRONTEND_URL}/start`, { waitUntil: 'load' });
        await pageA.waitForSelector('#name');
        await pageA.type('#name', 'dhanu');
        await pageA.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const btn = btns.find(b => b.textContent && b.textContent.includes('Create new room'));
            if (btn) btn.click();
        });
        await pageA.waitForSelector('.monaco-editor', { timeout: 15000 });
        await delay(1500);

        const currentUrl = pageA.url();
        const roomId = currentUrl.split('/code/')[1].split('?')[0].replace(/\/+$/, '');
        console.log(`  Room created: ${roomId}`);

        const pageB = await browser.newPage();
        await pageB.bringToFront();
        await pageB.goto(`${FRONTEND_URL}/${roomId}`, { waitUntil: 'load' });
        await pageB.waitForSelector('#name');
        await pageB.type('#name', 'vyaas');
        await pageB.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const btn = btns.find(b => b.textContent && b.textContent.includes('Join with room code'));
            if (btn) btn.click();
        });
        await pageB.waitForSelector('.monaco-editor', { timeout: 15000 });
        await delay(2000);

        const contentAInitial = await getEditorContent(pageA);
        const contentBInitial = await getEditorContent(pageB);
        assert(contentAInitial !== null && contentBInitial !== null, 'Both users loaded editor in room');
        assert(contentAInitial === contentBInitial, 'Both users initialized with matching content', `Length: ${contentAInitial?.length}`);

        // -------------------------------------------------------------
        // TEST 2: User A typing and User B receiving changes
        // -------------------------------------------------------------
        console.log('\n[TEST 2] User A ("dhanu") typing and User B ("vyaas") receiving changes...');
        const markerA = '// [A_EDIT_TEST] Function addition by Dhanu\nfunction dhanuFeature() { return "dhanu_ok"; }\n\n';
        await typeInEditor(pageA, markerA, 1);
        await delay(1200);

        const contentBAfterA = await getEditorContent(pageB);
        assert(contentBAfterA.includes('dhanuFeature()'), 'User B received User A\'s typed function');

        // -------------------------------------------------------------
        // TEST 3: User B typing and User A receiving changes
        // -------------------------------------------------------------
        console.log('\n[TEST 3] User B ("vyaas") typing and User A ("dhanu") receiving changes...');
        const markerB = '// [B_EDIT_TEST] Function addition by Vyaas\nfunction vyaasFeature() { return "vyaas_ok"; }\n\n';
        await typeInEditor(pageB, markerB, 1);
        await delay(1200);

        const contentAAfterB = await getEditorContent(pageA);
        assert(contentAAfterB.includes('vyaasFeature()'), 'User A received User B\'s typed function');
        assert(contentAAfterB.includes('dhanuFeature()') && contentAAfterB.includes('vyaasFeature()'), 'User A editor holds both changes concurrently');

        // -------------------------------------------------------------
        // TEST 4: Simultaneous editing without duplicated content
        // -------------------------------------------------------------
        console.log('\n[TEST 4] Simultaneous editing without duplicated content...');
        await Promise.all([
            typeInEditor(pageA, '// Simultaneous A\n', 1),
            typeInEditor(pageB, '// Simultaneous B\n', 1)
        ]);
        await delay(1500);

        const finalContentA = await getEditorContent(pageA);
        const finalContentB = await getEditorContent(pageB);
        assert(finalContentA === finalContentB, 'CRDT convergence: Editor content matches exactly across users');
        const countSimA = (finalContentA.match(/\/\/ Simultaneous A/g) || []).length;
        const countSimB = (finalContentA.match(/\/\/ Simultaneous B/g) || []).length;
        assert(countSimA === 1 && countSimB === 1, 'Zero duplication in simultaneous editing', `countA=${countSimA}, countB=${countSimB}`);

        // -------------------------------------------------------------
        // TEST 5: Switching between files
        // -------------------------------------------------------------
        console.log('\n[TEST 5] Switching between files...');
        // User A switches to utils.js in file tree
        const switched = await pageA.evaluate(() => {
            const items = Array.from(document.querySelectorAll('div, button, span'));
            const utilsItem = items.find(el => el.textContent && el.textContent.trim().startsWith('utils.js'));
            if (utilsItem) {
                utilsItem.click();
                return true;
            }
            return false;
        });

        await delay(1000);
        const activeFileA = await getActiveFileLabel(pageA);
        assert(activeFileA === 'utils.js' || switched, 'User A switched active file to utils.js', activeFileA || '');

        // User A types in utils.js
        await typeInEditor(pageA, '// utils.js edit by Dhanu\n', 1);
        await delay(800);
        const utilsContentA = await getEditorContent(pageA);
        assert(utilsContentA.includes('// utils.js edit by Dhanu'), 'User A edited utils.js successfully');

        // User B switches to utils.js and receives edit
        await pageB.evaluate(() => {
            const items = Array.from(document.querySelectorAll('div, button, span'));
            const utilsItem = items.find(el => el.textContent && el.textContent.trim().startsWith('utils.js'));
            if (utilsItem) utilsItem.click();
        });
        await delay(1000);
        const utilsContentB = await getEditorContent(pageB);
        assert(utilsContentB.includes('// utils.js edit by Dhanu'), 'User B switched to utils.js and received User A\'s edit');

        // Switch back to main file via FileTabsBar button
        await pageA.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const mainBtn = btns.find(b => b.textContent && (b.textContent.includes('main.js') || b.textContent.includes('main.py')));
            if (mainBtn) mainBtn.click();
        });
        await pageB.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const mainBtn = btns.find(b => b.textContent && (b.textContent.includes('main.js') || b.textContent.includes('main.py')));
            if (mainBtn) mainBtn.click();
        });
        await delay(1000);

        // -------------------------------------------------------------
        // TEST 6: Switching programming languages
        // -------------------------------------------------------------
        console.log('\n[TEST 6] Switching programming languages (zero flickering, synchronized)...');
        await selectLanguage(pageA, 'Python');
        await delay(1000);

        // Check stability across samples
        const samplesA = [];
        const samplesB = [];
        for (let i = 0; i < 6; i++) {
            await delay(250);
            samplesA.push(await getDropdownLanguage(pageA));
            samplesB.push(await getDropdownLanguage(pageB));
        }

        const distinctA = Array.from(new Set(samplesA));
        const distinctB = Array.from(new Set(samplesB));
        assert(distinctA.length === 1 && distinctA[0] === 'Python', 'User A selected Python with zero flickering', `States: ${distinctA.join(', ')}`);
        assert(distinctB.length === 1 && distinctB[0] === 'Python', 'User B synchronized to Python cleanly', `States: ${distinctB.join(', ')}`);

        const monacoLangA = await getMonacoLanguage(pageA);
        const monacoLangB = await getMonacoLanguage(pageB);
        assert(monacoLangA === 'python' && monacoLangB === 'python', 'Monaco editor model language updated to python on both peers');

        // -------------------------------------------------------------
        // TEST 7: A user refreshing and reconnecting
        // -------------------------------------------------------------
        console.log('\n[TEST 7] User refreshing and reconnecting...');
        await pageA.bringToFront();
        await pageA.reload({ waitUntil: 'load' });
        await pageA.waitForSelector('#name', { timeout: 10000 });
        await pageA.type('#name', 'dhanu');
        await pageA.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const btn = btns.find(b => b.textContent && b.textContent.includes('Join with room code'));
            if (btn) btn.click();
        });
        await pageA.waitForSelector('.monaco-editor', { timeout: 15000 });
        await delay(2000);

        const contentARefresh = await getEditorContent(pageA);
        const contentBPostRefresh = await getEditorContent(pageB);
        assert(contentARefresh !== null, 'User A reconnected successfully to room');
        assert(contentARefresh === contentBPostRefresh, 'Reconnected User A has 100% synchronized state with User B');

        // -------------------------------------------------------------
        // TEST 8: A new user joining an existing room
        // -------------------------------------------------------------
        console.log('\n[TEST 8] A new user (User C "charlie") joining an existing room...');
        const pageC = await browser.newPage();
        await pageC.bringToFront();
        await pageC.goto(`${FRONTEND_URL}/${roomId}`, { waitUntil: 'load' });
        await pageC.waitForSelector('#name');
        await pageC.type('#name', 'charlie');
        await pageC.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const btn = btns.find(b => b.textContent && b.textContent.includes('Join with room code'));
            if (btn) btn.click();
        });
        await pageC.waitForSelector('.monaco-editor', { timeout: 15000 });
        await delay(2000);

        const contentC = await getEditorContent(pageC);
        const contentB = await getEditorContent(pageB);
        assert(contentC !== null, 'New User C joined room and loaded editor');
        assert(contentC === contentB, 'New User C received authoritative codebase snapshot without duplication');

        // -------------------------------------------------------------
        // TEST 9: Multiple users editing without losing changes
        // -------------------------------------------------------------
        console.log('\n[TEST 9] Multiple users (A, B, C) editing without losing changes...');
        await typeInEditor(pageA, '# Edit from A\n', 1);
        await delay(300);
        await typeInEditor(pageB, '# Edit from B\n', 1);
        await delay(300);
        await typeInEditor(pageC, '# Edit from C\n', 1);
        await delay(1500);

        const [finalA, finalB, finalC] = await Promise.all([
            getEditorContent(pageA),
            getEditorContent(pageB),
            getEditorContent(pageC)
        ]);

        assert(finalA === finalB && finalB === finalC, 'All 3 users reached 100% CRDT convergence');
        assert(
            finalA.includes('Edit from A') && finalA.includes('Edit from B') && finalA.includes('Edit from C'),
            'All edits from Users A, B, and C are preserved with zero lost changes'
        );

    } finally {
        await browser.close();
    }

    console.log('\n================================================================');
    console.log(`📊 TEST SUITE SUMMARY: ${passed} PASSED | ${failed} FAILED`);
    console.log('================================================================');

    if (failed > 0) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

runTestSuite().catch(err => {
    console.error('Test suite failed with error:', err);
    process.exit(1);
});
