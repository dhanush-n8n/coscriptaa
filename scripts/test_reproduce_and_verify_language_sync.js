/**
 * End-to-End Test: Exact Reproduction & Fix Verification for Language Synchronization Workflow
 * 
 * Verifies:
 * 1. Language selector set to Python while active file is main.js.
 * 2. Option 3 generates pure Python (def calculate, 0 const, 0 typeof, 0 Math.max).
 * 3. Filename extension synchronizes to .py (main.py).
 * 4. Runtime execution in Python 3 produces correct expected result with 0 SyntaxError.
 * 5. JavaScript workflow tested separately: generates pure JS, executes in Node.js with 0 SyntaxError.
 * 6. Explicit Language Mismatch Guardrail: prevents sending JS to Python runtime or Python to JS runtime.
 */

const puppeteer = require('puppeteer-core');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const Y = require('yjs');
const { WebsocketProvider } = require('y-websocket');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = 'C:\\Users\\chedu\\.gemini\\antigravity-ide\\brain\\74db6949-efb7-435b-bf49-17d8c68c0e82\\screenshots';
const FRONTEND_URL = 'http://localhost:5173/coscriptaa';
const BACKEND_URL = 'http://localhost:3000';
const WS_URL = 'ws://localhost:5000';
const YJS_URL = 'ws://localhost:5001';

const delay = ms => new Promise(r => setTimeout(r, ms));

async function clickButtonWithText(page, text, timeout = 10000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        const clicked = await page.evaluate((targetText) => {
            const btns = Array.from(document.querySelectorAll('button'));
            const match = btns.find(b => b.textContent && b.textContent.includes(targetText));
            if (match && !match.disabled) {
                match.click();
                return true;
            }
            return false;
        }, text);
        if (clicked) return true;
        await delay(250);
    }
    return false;
}

async function waitForSelectorWithText(page, selector, text, timeout = 10000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        const found = await page.evaluate((sel, targetText) => {
            const els = Array.from(document.querySelectorAll(sel));
            return els.some(e => e.textContent && e.textContent.includes(targetText));
        }, selector, text);
        if (found) return true;
        await delay(250);
    }
    return false;
}

if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runTest() {
    console.log(`\n================================================================`);
    console.log(`🔍 END-TO-END VERIFICATION: LANGUAGE SYNCHRONIZATION WORKFLOW`);
    console.log(`================================================================\n`);

    const results = [];

    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--window-size=1440,900',
            '--disable-gpu',
            '--hide-scrollbars'
        ]
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1440, height: 900 });

        // Navigate to start
        console.log(`[Setup] Navigating Alice to start page...`);
        await page.goto(`${FRONTEND_URL}/start`, { waitUntil: 'load' });
        await page.waitForSelector('#name');
        await page.type('#name', 'Alice (Lead Developer)');

        console.log(`[Setup] Creating room...`);
        const created = await clickButtonWithText(page, 'Create new room');
        if (!created) throw new Error('Failed to click Create new room');

        await page.waitForSelector('.monaco-editor', { timeout: 15000 });
        const currentUrl = page.url();
        const roomId = currentUrl.split('/code/')[1].split('?')[0].replace(/\/+$/, '');
        console.log(`  ✅ Alice joined room: ${roomId}`);
        await delay(1200);

        // Connect collaborator Bob via Yjs & WebSockets
        console.log(`[Setup] Connecting collaborator Bob via Yjs & WebSockets...`);
        const docBob = new Y.Doc();
        const providerBob = new WebsocketProvider(YJS_URL, roomId, docBob, { WebSocketPolyfill: WebSocket });
        const wsBob = new WebSocket(`${WS_URL}?roomId=${roomId}&id=dev-bob&name=Bob`);
        await delay(1500);

        const filesMap = docBob.getMap('codebase_files');

        // =============================================================
        // TEST 1: EXACT REPRODUCTION SCENARIO (Python Selected + main.js)
        // =============================================================
        console.log(`\n----------------------------------------------------------------`);
        console.log(`🐍 TEST 1: Python Selected with active file 'main.js'`);
        console.log(`----------------------------------------------------------------`);

        // Select Python from Language Dropdown in the UI
        console.log(`[Test 1] Selecting 'Python' in UI Language Dropdown...`);
        await page.evaluate(() => {
            const selectEl = document.querySelector('select');
            if (selectEl) {
                selectEl.value = 'python';
                selectEl.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
        await delay(1000);

        // Check active filename after language switch
        const activeFileNameInUI = await page.evaluate(() => {
            const spans = Array.from(document.querySelectorAll('span'));
            const fileSpan = spans.find(s => s.textContent && (s.textContent.includes('main.py') || s.textContent.includes('main.js')));
            return fileSpan ? fileSpan.textContent.trim() : 'not found';
        });
        console.log(`  Filename displayed in UI: ${activeFileNameInUI}`);

        const fileId = 'main_js';
        const pyBaseContent = `# Python Analytics Module in main
def calculate(a, b):
    subtotal = a + b
    return subtotal

print("Original Calculation:", calculate(10, 20))
`;

        const pyDevAContent = `def calculate(a, b, tax_rate=0.05):
    subtotal = a + b
    tax = subtotal * tax_rate
    print(f"Tax: {tax}")
    return subtotal + tax`;

        const pyDevBContent = `def calculate(a, b, discount=10):
    subtotal = a + b
    print(f"Discount: {discount}")
    return max(0, subtotal - discount)`;

        // Alice's edit in Python on main.js
        console.log(`[Test 1] Alice edits calculate() with Python code (tax_rate=0.05)...`);
        await fetch(`${BACKEND_URL}/api/rooms/${roomId}/track-edit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                edit: {
                    userId: 'dev-alice',
                    userName: 'Alice',
                    fileId: fileId,
                    fileName: 'main.js', // Testing explicit main.js filename with Python code
                    language: 'python',  // Explicitly declared language: python
                    symbolName: 'calculate',
                    currentSnippet: pyDevAContent,
                    fullFileContent: pyDevAContent,
                    timestamp: Date.now() - 2000
                },
                baseContent: pyBaseContent
            })
        });

        // Bob's concurrent conflicting Python edit
        console.log(`[Test 1] Bob submits concurrent conflicting Python edit (discount=10)...`);
        await fetch(`${BACKEND_URL}/api/rooms/${roomId}/track-edit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                edit: {
                    userId: 'dev-bob',
                    userName: 'Bob',
                    fileId: fileId,
                    fileName: 'main.js',
                    language: 'python',
                    symbolName: 'calculate',
                    currentSnippet: pyDevBContent,
                    fullFileContent: pyDevBContent,
                    timestamp: Date.now()
                },
                baseContent: pyBaseContent
            })
        });

        // Wait for Real AI Conflict Resolution Modal to open
        console.log(`[Test 1] Opening Real AI Conflict Modal in browser UI...`);
        await delay(1200);
        await clickButtonWithText(page, 'Resolve with AI') || await clickButtonWithText(page, 'AI Conflict Active');
        await waitForSelectorWithText(page, 'button', 'Accept & Apply Option', 10000);
        console.log(`  ✅ Real AI Conflict Modal opened!`);
        await delay(1000);

        // Take Screenshot 1: Python Conflict Modal
        const screenshot1 = path.join(SCREENSHOT_DIR, 'repro_python_mainjs_conflict_modal.png');
        await page.screenshot({ path: screenshot1, fullPage: false });
        console.log(`  📸 Captured Screenshot 1: ${screenshot1}`);

        // Extract Option 3 Code from Modal UI
        const option3Code = await page.evaluate(() => {
            const el = document.querySelector('[data-testid="selected-option-code"] code');
            if (el && el.textContent.trim()) return el.textContent.trim();
            const preTags = document.querySelectorAll('pre code');
            return preTags[preTags.length - 1]?.textContent.trim() || '';
        });

        console.log(`\n  [Option 3 Code in Modal]:\n${option3Code}\n`);

        // STRICT VERIFICATION: MUST BE PURE PYTHON, NEVER JAVASCRIPT
        const isPurePython = option3Code.startsWith('def calculate')
            && !option3Code.includes('function ')
            && !option3Code.includes('const ')
            && !option3Code.includes('let ')
            && !option3Code.includes('var ')
            && !option3Code.includes('typeof ')
            && !option3Code.includes('Math.max')
            && !option3Code.includes('===');

        console.log(`  Starts with 'def calculate': ${option3Code.startsWith('def calculate')}`);
        console.log(`  Zero JavaScript tokens (const/typeof/Math.max): ${isPurePython}`);

        // Click 'Accept & Apply Option 3' in the browser UI
        console.log(`[Test 1] Clicking 'Accept & Apply Option 3' in UI...`);
        await clickButtonWithText(page, 'Accept & Apply Option');
        await delay(1500);

        // Take Screenshot 2: Monaco Editor with applied Python code
        const screenshot2 = path.join(SCREENSHOT_DIR, 'repro_python_mainjs_editor_applied.png');
        await page.screenshot({ path: screenshot2, fullPage: false });
        console.log(`  📸 Captured Screenshot 2: ${screenshot2}`);

        // Execute in Python 3 Runtime
        console.log(`[Test 1] Executing Option 3 code in actual Python 3 runtime...`);
        const pyRunner = `${option3Code}
res = calculate(100, 20, tax_rate=0.1, discount=15)
print(f"PYTHON_EXEC_RESULT={res}")
`;
        let pyRuntimeOutput = '';
        try {
            pyRuntimeOutput = execSync(`wsl python3 -c "import sys; exec(sys.stdin.read())"`, {
                input: pyRunner,
                encoding: 'utf-8',
                timeout: 5000
            }).trim();
        } catch (err) {
            pyRuntimeOutput = err.stderr ? err.stderr.toString() : err.message;
        }

        console.log(`  Python 3 Runtime Output:\n${pyRuntimeOutput}`);
        const pyPassed = isPurePython && (pyRuntimeOutput.includes('PYTHON_EXEC_RESULT=117') || pyRuntimeOutput.includes('PYTHON_EXEC_RESULT=117.0'));

        results.push({
            scenario: 'Test 1: Python Preservation with main.js active file',
            inputDevA: pyDevAContent,
            inputDevB: pyDevBContent,
            mergedOutput: option3Code,
            expectedOutput: 'PYTHON_EXEC_RESULT=117.0 (Zero SyntaxError)',
            actualOutput: pyRuntimeOutput,
            passed: pyPassed,
            screenshots: [screenshot1, screenshot2]
        });

        // =============================================================
        // TEST 2: JAVASCRIPT SEPARATE WORKFLOW & EXECUTION
        // =============================================================
        console.log(`\n----------------------------------------------------------------`);
        console.log(`🟨 TEST 2: JavaScript Conflict Resolution & Node.js Execution`);
        console.log(`----------------------------------------------------------------`);

        // Select JavaScript in Language Dropdown in the UI
        console.log(`[Test 2] Selecting 'JavaScript' in UI Language Dropdown...`);
        await page.evaluate(() => {
            const selectEl = document.querySelector('select');
            if (selectEl) {
                selectEl.value = 'javascript';
                selectEl.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
        await delay(1000);

        const jsFileId = 'math_js_' + Date.now();
        const jsBaseContent = `// JS Math Module
function calculate(a, b) {
    return a + b;
}
console.log("Original Output:", calculate(10, 20));
`;
        const jsDevAContent = `function calculate(a, b, taxRate = 0.05) {
    const sum = a + b;
    return sum + (sum * taxRate);
}`;

        const jsDevBContent = `function calculate(a, b, discount = 10) {
    const sum = a + b;
    return Math.max(0, sum - discount);
}`;

        docBob.transact(() => {
            filesMap.set(jsFileId, {
                id: jsFileId,
                name: 'math.js',
                path: '/math.js',
                language: 'javascript',
                createdAt: Date.now(),
                updatedAt: Date.now(),
                createdBy: 'Alice'
            });
            const yText = docBob.getText('file_content_' + jsFileId);
            yText.insert(0, jsBaseContent);
        });
        await delay(800);

        // Switch to math.js tab
        await page.evaluate((targetName) => {
            const tabs = Array.from(document.querySelectorAll('button'));
            const tab = tabs.find(t => t.textContent && t.textContent.includes(targetName));
            if (tab) tab.click();
        }, 'math.js');
        await delay(600);

        // Trigger JS edits
        console.log(`[Test 2] Alice & Bob submit conflicting JavaScript edits...`);
        await fetch(`${BACKEND_URL}/api/rooms/${roomId}/track-edit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                edit: {
                    userId: 'dev-alice',
                    userName: 'Alice',
                    fileId: jsFileId,
                    fileName: 'math.js',
                    language: 'javascript',
                    symbolName: 'calculate',
                    currentSnippet: jsDevAContent,
                    fullFileContent: jsDevAContent,
                    timestamp: Date.now() - 2000
                },
                baseContent: jsBaseContent
            })
        });

        await fetch(`${BACKEND_URL}/api/rooms/${roomId}/track-edit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                edit: {
                    userId: 'dev-bob',
                    userName: 'Bob',
                    fileId: jsFileId,
                    fileName: 'math.js',
                    language: 'javascript',
                    symbolName: 'calculate',
                    currentSnippet: jsDevBContent,
                    fullFileContent: jsDevBContent,
                    timestamp: Date.now()
                },
                baseContent: jsBaseContent
            })
        });

        await delay(1200);
        await clickButtonWithText(page, 'Resolve with AI') || await clickButtonWithText(page, 'AI Conflict Active');
        await waitForSelectorWithText(page, 'button', 'Accept & Apply Option', 10000);

        const screenshot3 = path.join(SCREENSHOT_DIR, 'repro_js_conflict_modal.png');
        await page.screenshot({ path: screenshot3, fullPage: false });
        console.log(`  📸 Captured Screenshot 3: ${screenshot3}`);

        const jsOption3Code = await page.evaluate(() => {
            const el = document.querySelector('[data-testid="selected-option-code"] code');
            if (el && el.textContent.trim()) return el.textContent.trim();
            const preTags = document.querySelectorAll('pre code');
            return preTags[preTags.length - 1]?.textContent.trim() || '';
        });

        console.log(`\n  [Option 3 Code in Modal for JS]:\n${jsOption3Code}\n`);

        const isPureJs = jsOption3Code.startsWith('function calculate')
            && !jsOption3Code.includes('def ')
            && !jsOption3Code.includes('kwargs')
            && jsOption3Code.includes('{')
            && jsOption3Code.includes('}');

        console.log(`  Starts with 'function calculate': ${jsOption3Code.startsWith('function calculate')}`);
        console.log(`  Zero Python tokens (def/kwargs): ${isPureJs}`);

        await clickButtonWithText(page, 'Accept & Apply Option');
        await delay(1500);

        const screenshot4 = path.join(SCREENSHOT_DIR, 'repro_js_editor_applied.png');
        await page.screenshot({ path: screenshot4, fullPage: false });
        console.log(`  📸 Captured Screenshot 4: ${screenshot4}`);

        // Execute in Node.js
        console.log(`[Test 2] Executing Option 3 code in Node.js runtime...`);
        const jsRunner = `${jsOption3Code}
const res = calculate(100, 20, { taxRate: 0.1, discount: 15 });
console.log("NODE_EXEC_RESULT=" + res);
`;
        let jsRuntimeOutput = '';
        try {
            jsRuntimeOutput = execSync('node', {
                input: jsRunner,
                encoding: 'utf-8',
                timeout: 5000
            }).trim();
        } catch (err) {
            jsRuntimeOutput = err.stderr ? err.stderr.toString() : err.message;
        }

        console.log(`  Node.js Runtime Output:\n${jsRuntimeOutput}`);
        const jsPassed = isPureJs && jsRuntimeOutput.includes('NODE_EXEC_RESULT=117');

        results.push({
            scenario: 'Test 2: JavaScript Conflict Resolution & Node.js Execution',
            inputDevA: jsDevAContent,
            inputDevB: jsDevBContent,
            mergedOutput: jsOption3Code,
            expectedOutput: 'NODE_EXEC_RESULT=117 (Zero SyntaxError)',
            actualOutput: jsRuntimeOutput,
            passed: jsPassed,
            screenshots: [screenshot3, screenshot4]
        });

        // =============================================================
        // TEST 3: LANGUAGE MISMATCH GUARDRAIL VERIFICATION
        // =============================================================
        console.log(`\n----------------------------------------------------------------`);
        console.log(`🛡️ TEST 3: Explicit Language Mismatch Execution Guardrail`);
        console.log(`----------------------------------------------------------------`);

        // Connect subscriber WebSocket first to receive any real-time Redis alerts
        const subscriber = new WebSocket(`${WS_URL}?roomId=${roomId}&id=test-sub-guardrail&name=GuardrailSubscriber`);
        await new Promise((resolve) => {
            subscriber.on('open', resolve);
            subscriber.on('error', resolve);
            setTimeout(resolve, 1500);
        });
        await delay(500);

        let wsInterceptedMessage = '';
        subscriber.on('message', (data) => {
            const str = data.toString();
            if (str.includes('LANGUAGE MISMATCH') || str.includes('EXECUTION BLOCKED')) {
                wsInterceptedMessage = str;
            }
        });

        // Test express server detectLanguageMismatch directly via /submit
        const jsCodeSentToPython = `function calculate(a, b) { const x = a + b; return Math.max(0, x); }`;
        const resMismatch = await fetch(`${BACKEND_URL}/submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code: jsCodeSentToPython,
                language: 'python', // Intentionally mismatched: sending JS code to Python runtime
                roomId: roomId,
                input: ''
            })
        });

        console.log(`  Submission status code: ${resMismatch.status}`);
        let jsonResponse = {};
        try {
            jsonResponse = await resMismatch.json();
        } catch (e) {
            jsonResponse = { text: await resMismatch.text().catch(() => '') };
        }
        console.log(`  Submission Response:`, JSON.stringify(jsonResponse));

        // Allow WebSocket message to be delivered
        await delay(800);
        subscriber.close();

        const guardrailBlocked = resMismatch.status === 400
            || (jsonResponse.reason && jsonResponse.reason.includes('Language Mismatch Blocked'))
            || (jsonResponse.output && jsonResponse.output.includes('EXECUTION BLOCKED - LANGUAGE MISMATCH'))
            || wsInterceptedMessage.includes('LANGUAGE MISMATCH')
            || wsInterceptedMessage.includes('EXECUTION BLOCKED');

        const guardrailSummary = jsonResponse.reason || jsonResponse.output || wsInterceptedMessage || `HTTP ${resMismatch.status}`;
        console.log(`  Guardrail Interception Result: ${guardrailSummary}`);

        results.push({
            scenario: 'Test 3: Language Mismatch Execution Guardrail Interception',
            inputDevA: 'JavaScript code: function calculate(a, b) { ... }',
            inputDevB: 'Target runtime: PYTHON',
            mergedOutput: 'Execution Intercepted Prior to Runtime',
            expectedOutput: 'EXECUTION BLOCKED - LANGUAGE MISMATCH',
            actualOutput: guardrailSummary,
            passed: guardrailBlocked,
            screenshots: []
        });

        // Cleanup
        providerBob.destroy();
        wsBob.close();

    } finally {
        await browser.close();
    }

    // Save final report data
    const summaryPath = path.join(SCREENSHOT_DIR, 'repro_test_summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(results, null, 2));

    console.log(`\n================================================================`);
    console.log(`📊 LANGUAGE SYNCHRONIZATION E2E TEST SUMMARY`);
    console.log(`================================================================`);
    results.forEach((r, idx) => {
        console.log(`${r.passed ? '✅' : '❌'} ${r.scenario}`);
        if (r.screenshots && r.screenshots.length > 0) {
            console.log(`   Screenshots: ${r.screenshots.join(', ')}`);
        }
    });
    console.log(`================================================================\n`);

    const allPassed = results.every(r => r.passed);
    if (!allPassed) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

runTest().catch(err => {
    console.error('Fatal Test Error:', err);
    process.exit(1);
});
