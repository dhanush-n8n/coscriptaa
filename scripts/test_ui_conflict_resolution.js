/**
 * Automated UI End-to-End Testing: CoScripta Option 3 AI Conflict Resolution
 * 
 * Uses local Google Chrome via puppeteer-core to test:
 * 1. Python + Python: Both developers edit same Python function -> Option 3 generates valid Python.
 * 2. JavaScript + JavaScript: Both developers edit same JS function -> Option 3 generates valid JS.
 * 3. Python language preservation: Input Python -> Output pure Python, 0 JavaScript tokens.
 * 4. JavaScript language preservation: Input JS -> Output pure JS, 0 Python tokens.
 * 5. Functional runtime correctness: Merged output produces correct expected calculation in Python 3 & Node.js.
 * 6. Clean editor replacement: Clicking 'Accept & Apply Option 3' replaces the function cleanly without duplication.
 */

const puppeteer = require('puppeteer-core');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const Y = require('yjs');
const { WebsocketProvider } = require('y-websocket');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = 'C:\\Users\\chedu\\.gemini\\antigravity-ide\\brain\\d600c84e-18a1-496b-85e6-199ab6df54fc\\screenshots';
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

async function runUITests() {
    console.log(`\n================================================================`);
    console.log(`🚀 STARTING END-TO-END UI TESTING: OPTION 3 AI CONFLICT RESOLUTION`);
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

        // =============================================================
        // SETUP: NAVIGATE TO START & CREATE ROOM
        // =============================================================
        console.log(`[Setup] Navigating Alice to start page...`);
        await page.goto(`${FRONTEND_URL}/start`, { waitUntil: 'load' });
        await page.waitForSelector('#name');
        await page.type('#name', 'Alice (Lead Developer)');

        console.log(`[Setup] Creating collaborative workspace...`);
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
        // SCENARIO 1: PYTHON + PYTHON CONFLICT RESOLUTION
        // =============================================================
        console.log(`\n----------------------------------------------------------------`);
        console.log(`🐍 SCENARIO 1: Python + Python Conflict Resolution & Runtime Execution`);
        console.log(`----------------------------------------------------------------`);

        const pyFileId = 'file_py_' + Date.now();
        const pyFileObj = {
            id: pyFileId,
            name: 'analytics.py',
            path: '/analytics.py',
            language: 'python',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            createdBy: 'Alice'
        };

        const pyBaseContent = `# Python Analytics Module
def calculate(a, b):
    subtotal = a + b
    return subtotal

def generate_report(val):
    return f"Report Generated: {val}"

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

        docBob.transact(() => {
            filesMap.set(pyFileId, pyFileObj);
            const yText = docBob.getText('file_content_' + pyFileId);
            yText.insert(0, pyBaseContent);
        });

        await delay(1000);

        // Select analytics.py in the UI
        console.log(`[Scenario 1] Selecting analytics.py in UI...`);
        await page.evaluate((targetName) => {
            const tabs = Array.from(document.querySelectorAll('button'));
            const tab = tabs.find(t => t.textContent && t.textContent.includes(targetName));
            if (tab) tab.click();
        }, 'analytics.py');
        await delay(800);

        // Record Alice's edit
        await fetch(`${BACKEND_URL}/api/rooms/${roomId}/track-edit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                edit: {
                    userId: 'dev-alice',
                    userName: 'Alice',
                    fileId: pyFileId,
                    fileName: 'analytics.py',
                    language: 'python',
                    symbolName: 'calculate',
                    currentSnippet: pyDevAContent,
                    fullFileContent: pyDevAContent,
                    timestamp: Date.now() - 2000
                },
                baseContent: pyBaseContent
            })
        });

        // Trigger Bob's concurrent edit -> conflict broadcast
        console.log(`[Scenario 1] Bob submits concurrent conflicting Python edit...`);
        await fetch(`${BACKEND_URL}/api/rooms/${roomId}/track-edit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                edit: {
                    userId: 'dev-bob',
                    userName: 'Bob',
                    fileId: pyFileId,
                    fileName: 'analytics.py',
                    language: 'python',
                    symbolName: 'calculate',
                    currentSnippet: pyDevBContent,
                    fullFileContent: pyDevBContent,
                    timestamp: Date.now()
                },
                baseContent: pyBaseContent
            })
        });

        // Wait for Real AI Conflict UI Modal to open or click resolve button
        console.log(`[Scenario 1] Opening Real AI Conflict Resolution Modal in browser UI...`);
        await delay(1000);
        await clickButtonWithText(page, 'Resolve with AI') || await clickButtonWithText(page, 'AI Conflict Resolver');
        await waitForSelectorWithText(page, 'button', 'Accept & Apply Option', 10000);
        console.log(`  ✅ Real AI Conflict Modal is open in browser!`);
        await delay(1000);

        // Take Screenshot 1: Python Conflict Modal
        const screenshot1 = path.join(SCREENSHOT_DIR, 'scenario1_python_conflict_modal.png');
        await page.screenshot({ path: screenshot1, fullPage: false });
        console.log(`  📸 Captured Screenshot 1: ${screenshot1}`);

        // Extract Option 3 Code from the Modal UI
        const modalOption3Code = await page.evaluate(() => {
            const el = document.querySelector('[data-testid="selected-option-code"] code');
            if (el && el.textContent.trim()) return el.textContent.trim();
            const preTags = document.querySelectorAll('pre code');
            return preTags[preTags.length - 1]?.textContent.trim() || '';
        });

        console.log(`\n  [Extracted Option 3 Code from Modal UI]:\n${modalOption3Code}\n`);

        const isPurePython = modalOption3Code.startsWith('def calculate') 
            && !modalOption3Code.includes('function ')
            && !modalOption3Code.includes('const ')
            && !modalOption3Code.includes('let ')
            && !modalOption3Code.includes('var ')
            && !modalOption3Code.includes('===');

        console.log(`  Python Syntax Check: starts with 'def calculate': ${modalOption3Code.startsWith('def calculate')}`);
        console.log(`  Language Preservation: 0 JS keywords: ${isPurePython}`);

        // Click 'Accept & Apply Option 3' in the UI
        console.log(`[Scenario 1] Clicking 'Accept & Apply Option 3' in the browser UI...`);
        await clickButtonWithText(page, 'Accept & Apply Option');
        await delay(1500);

        // Take Screenshot 2: Python Editor Applied
        const screenshot2 = path.join(SCREENSHOT_DIR, 'scenario1_python_editor_applied.png');
        await page.screenshot({ path: screenshot2, fullPage: false });
        console.log(`  📸 Captured Screenshot 2: ${screenshot2}`);

        // Verify editor content from Yjs
        const updatedPyContent = docBob.getText('file_content_' + pyFileId).toString();
        console.log(`\n  [Updated Document in Monaco Editor]:\n${updatedPyContent}\n`);

        const defCount = (updatedPyContent.match(/def calculate/g) || []).length;
        const hasSurrounding = updatedPyContent.includes('generate_report');
        console.log(`  Function Definition Count in Editor: ${defCount} (Expected: 1)`);
        console.log(`  Surrounding Code Preserved: ${hasSurrounding}`);

        // Execute in Python 3 Runtime
        console.log(`[Scenario 1] Executing merged Python code in actual Python 3 runtime...`);
        const pyRunner = `${updatedPyContent}
# Test execution with inputs: a=100, b=20, tax_rate=0.1, discount=15
res = calculate(100, 20, tax_rate=0.1, discount=15)
print(f"ACTUAL_CALC_RESULT={res}")
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

        console.log(`  Actual Python Runtime Output:\n${pyRuntimeOutput}`);

        // Expected calculation:
        // subtotal = 100 + 20 = 120
        // tax = 120 * 0.1 = 12.0
        // discount = 15
        // expected result = 120 + 12 - 15 = 117.0
        const expectedPyVal = '117.0';
        const pyRuntimeSuccess = pyRuntimeOutput.includes('ACTUAL_CALC_RESULT=117') || pyRuntimeOutput.includes('ACTUAL_CALC_RESULT=117.0');

        results.push({
            scenario: '1. Python + Python Conflict Resolution & Runtime Execution',
            inputDevA: pyDevAContent,
            inputDevB: pyDevBContent,
            mergedOutput: modalOption3Code,
            expectedOutput: `Result: ${expectedPyVal} (Valid Python, tax + discount merged, 1 function definition)`,
            actualOutput: pyRuntimeOutput,
            passed: isPurePython && defCount === 1 && pyRuntimeSuccess,
            screenshots: [screenshot1, screenshot2]
        });

        // =============================================================
        // SCENARIO 2: JAVASCRIPT + JAVASCRIPT CONFLICT RESOLUTION
        // =============================================================
        console.log(`\n----------------------------------------------------------------`);
        console.log(`🟨 SCENARIO 2: JavaScript + JavaScript Conflict Resolution & Runtime Execution`);
        console.log(`----------------------------------------------------------------`);

        const jsFileId = 'file_js_' + Date.now();
        const jsFileObj = {
            id: jsFileId,
            name: 'mathUtils.js',
            path: '/mathUtils.js',
            language: 'javascript',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            createdBy: 'Alice'
        };

        const jsBaseContent = `// JavaScript Math Utilities
function calculate(a, b) {
    return a + b;
}

function formatResult(val) {
    return "Calculated: " + val;
}

console.log("Original Output:", calculate(10, 20));
`;

        const jsDevAContent = `function calculate(a, b, taxRate = 0.05) {
    const sum = a + b;
    const tax = sum * taxRate;
    console.log("Tax:", tax);
    return sum + tax;
}`;

        const jsDevBContent = `function calculate(a, b, discount = 10) {
    const sum = a + b;
    console.log("Discount:", discount);
    return Math.max(0, sum - discount);
}`;

        docBob.transact(() => {
            filesMap.set(jsFileId, jsFileObj);
            const yText = docBob.getText('file_content_' + jsFileId);
            yText.insert(0, jsBaseContent);
        });

        await delay(1000);

        // Switch to mathUtils.js in UI
        console.log(`[Scenario 2] Switching to mathUtils.js in UI...`);
        await page.evaluate((targetName) => {
            const tabs = Array.from(document.querySelectorAll('button'));
            const tab = tabs.find(t => t.textContent && t.textContent.includes(targetName));
            if (tab) tab.click();
        }, 'mathUtils.js');
        await delay(800);

        // Set JS base version on backend
        await fetch(`${BACKEND_URL}/api/rooms/${roomId}/track-edit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                edit: {
                    userId: 'dev-alice',
                    userName: 'Alice',
                    fileId: jsFileId,
                    fileName: 'mathUtils.js',
                    language: 'javascript',
                    symbolName: 'calculate',
                    currentSnippet: jsDevAContent,
                    fullFileContent: jsDevAContent,
                    timestamp: Date.now() - 2000
                },
                baseContent: jsBaseContent
            })
        });

        // Trigger Bob's concurrent edit in JS
        console.log(`[Scenario 2] Bob submits concurrent conflicting edit in JavaScript...`);
        await fetch(`${BACKEND_URL}/api/rooms/${roomId}/track-edit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                edit: {
                    userId: 'dev-bob',
                    userName: 'Bob',
                    fileId: jsFileId,
                    fileName: 'mathUtils.js',
                    language: 'javascript',
                    symbolName: 'calculate',
                    currentSnippet: jsDevBContent,
                    fullFileContent: jsDevBContent,
                    timestamp: Date.now()
                },
                baseContent: jsBaseContent
            })
        });

        // Wait for modal to open in browser
        console.log(`[Scenario 2] Opening Real AI Conflict Modal for JavaScript...`);
        await delay(1000);
        await clickButtonWithText(page, 'Resolve with AI') || await clickButtonWithText(page, 'AI Conflict Resolver');
        await waitForSelectorWithText(page, 'button', 'Accept & Apply Option', 10000);
        console.log(`  ✅ Real AI Conflict Modal is open for JavaScript!`);
        await delay(1000);

        // Take Screenshot 3: JS Conflict Modal
        const screenshot3 = path.join(SCREENSHOT_DIR, 'scenario2_javascript_conflict_modal.png');
        await page.screenshot({ path: screenshot3, fullPage: false });
        console.log(`  📸 Captured Screenshot 3: ${screenshot3}`);

        // Extract Option 3 Code from Modal UI
        const modalOption3JsCode = await page.evaluate(() => {
            const el = document.querySelector('[data-testid="selected-option-code"] code');
            if (el && el.textContent.trim()) return el.textContent.trim();
            const preTags = document.querySelectorAll('pre code');
            return preTags[preTags.length - 1]?.textContent.trim() || '';
        });

        console.log(`\n  [Extracted Option 3 Code from Modal UI]:\n${modalOption3JsCode}\n`);

        const isPureJs = modalOption3JsCode.startsWith('function calculate')
            && !modalOption3JsCode.includes('def ')
            && !modalOption3JsCode.includes('kwargs')
            && modalOption3JsCode.includes('{')
            && modalOption3JsCode.includes('}');

        console.log(`  JS Syntax Check: starts with 'function calculate': ${modalOption3JsCode.startsWith('function calculate')}`);
        console.log(`  Language Preservation: 0 Python keywords: ${isPureJs}`);

        // Click 'Accept & Apply Option 3' in the UI
        console.log(`[Scenario 2] Clicking 'Accept & Apply Option 3' in the browser UI...`);
        await clickButtonWithText(page, 'Accept & Apply Option');
        await delay(1500);

        // Take Screenshot 4: JS Editor Applied
        const screenshot4 = path.join(SCREENSHOT_DIR, 'scenario2_javascript_editor_applied.png');
        await page.screenshot({ path: screenshot4, fullPage: false });
        console.log(`  📸 Captured Screenshot 4: ${screenshot4}`);

        // Verify editor content from Yjs
        const updatedJsContent = docBob.getText('file_content_' + jsFileId).toString();
        console.log(`\n  [Updated Document in Monaco Editor]:\n${updatedJsContent}\n`);

        const jsFuncCount = (updatedJsContent.match(/function calculate/g) || []).length;
        const hasJsSurrounding = updatedJsContent.includes('formatResult');
        console.log(`  Function Definition Count in Editor: ${jsFuncCount} (Expected: 1)`);
        console.log(`  Surrounding Code Preserved: ${hasJsSurrounding}`);

        // Execute in Node.js Runtime
        console.log(`[Scenario 2] Executing merged JavaScript code in Node.js runtime...`);
        const jsRunner = `${updatedJsContent}
const res = calculate(100, 20, { taxRate: 0.1, discount: 15 });
console.log("ACTUAL_CALC_RESULT=" + res);
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

        console.log(`  Actual Node.js Runtime Output:\n${jsRuntimeOutput}`);

        // Expected calculation: 100 + 20 = 120, tax = 12, discount = 15 -> 117
        const expectedJsVal = '117';
        const jsRuntimeSuccess = jsRuntimeOutput.includes('ACTUAL_CALC_RESULT=117');

        results.push({
            scenario: '2. JavaScript + JavaScript Conflict Resolution & Runtime Execution',
            inputDevA: jsDevAContent,
            inputDevB: jsDevBContent,
            mergedOutput: modalOption3JsCode,
            expectedOutput: `Result: ${expectedJsVal} (Valid JS, taxRate + discount merged, 1 function definition)`,
            actualOutput: jsRuntimeOutput,
            passed: isPureJs && jsFuncCount === 1 && jsRuntimeSuccess,
            screenshots: [screenshot3, screenshot4]
        });

        // =============================================================
        // SCENARIO 3: PYTHON LANGUAGE PRESERVATION (NEVER OUTPUT JAVASCRIPT)
        // =============================================================
        console.log(`\n----------------------------------------------------------------`);
        console.log(`🐍 SCENARIO 3: Python Language Preservation (Strict Anti-JS Check)`);
        console.log(`----------------------------------------------------------------`);

        const pyPreserveFileId = 'file_py_pres_' + Date.now();
        const pyPreserveFileObj = {
            id: pyPreserveFileId,
            name: 'data_processing.py',
            path: '/data_processing.py',
            language: 'python',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            createdBy: 'Alice'
        };

        const pyPreserveBase = `def process_records(items, threshold=10):
    filtered = [x for x in items if x > threshold]
    return len(filtered)
`;

        const pyPreserveDevA = `def process_records(items, threshold=10, multiplier=2):
    filtered = [x * multiplier for x in items if x > threshold]
    print(f"Processed {len(filtered)} items with multiplier {multiplier}")
    return filtered`;

        const pyPreserveDevB = `def process_records(items, threshold=10, limit=5):
    filtered = [x for x in items if x > threshold][:limit]
    print(f"Filtered up to {limit} items")
    return filtered`;

        docBob.transact(() => {
            filesMap.set(pyPreserveFileId, pyPreserveFileObj);
            const yText = docBob.getText('file_content_' + pyPreserveFileId);
            yText.insert(0, pyPreserveBase);
        });
        await delay(800);

        // Switch tab in UI
        await page.evaluate((targetName) => {
            const tabs = Array.from(document.querySelectorAll('button'));
            const tab = tabs.find(t => t.textContent && t.textContent.includes(targetName));
            if (tab) tab.click();
        }, 'data_processing.py');
        await delay(600);

        // Track Alice's edit
        await fetch(`${BACKEND_URL}/api/rooms/${roomId}/track-edit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                edit: {
                    userId: 'dev-alice',
                    userName: 'Alice',
                    fileId: pyPreserveFileId,
                    fileName: 'data_processing.py',
                    language: 'python',
                    symbolName: 'process_records',
                    currentSnippet: pyPreserveDevA,
                    fullFileContent: pyPreserveDevA,
                    timestamp: Date.now() - 2000
                },
                baseContent: pyPreserveBase
            })
        });

        // Trigger Bob's edit -> conflict
        const resPyPres = await fetch(`${BACKEND_URL}/api/rooms/${roomId}/track-edit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                edit: {
                    userId: 'dev-bob',
                    userName: 'Bob',
                    fileId: pyPreserveFileId,
                    fileName: 'data_processing.py',
                    language: 'python',
                    symbolName: 'process_records',
                    currentSnippet: pyPreserveDevB,
                    fullFileContent: pyPreserveDevB,
                    timestamp: Date.now()
                },
                baseContent: pyPreserveBase
            })
        });

        const dataPyPres = await resPyPres.json();
        const solPyPres3 = dataPyPres.conflict?.solutions?.find(s => s.id === 3);

        await delay(1000);
        await clickButtonWithText(page, 'Resolve with AI') || await clickButtonWithText(page, 'AI Conflict Resolver');
        await waitForSelectorWithText(page, 'button', 'Accept & Apply Option', 10000);

        const screenshot5 = path.join(SCREENSHOT_DIR, 'scenario3_python_preservation_modal.png');
        await page.screenshot({ path: screenshot5, fullPage: false });
        console.log(`  📸 Captured Screenshot 5: ${screenshot5}`);

        const pyPresCode = solPyPres3?.code || '';
        console.log(`  Option 3 Generated Code:\n${pyPresCode}`);

        const antiJsPassed = pyPresCode.startsWith('def process_records')
            && !pyPresCode.includes('function ')
            && !pyPresCode.includes('const ')
            && !pyPresCode.includes('let ')
            && !pyPresCode.includes('===')
            && !pyPresCode.includes('Math.');

        console.log(`  Strict Anti-JS Check: ${antiJsPassed}`);

        // Execute in Python 3
        const pyPresRunner = `${pyPresCode}
res = process_records([5, 12, 18, 25, 30], threshold=10)
print(f"PYTHON_PRESERVATION_RUN_OK={len(res) > 0}")
`;
        let pyPresOutput = '';
        try {
            pyPresOutput = execSync(`wsl python3 -c "import sys; exec(sys.stdin.read())"`, {
                input: pyPresRunner,
                encoding: 'utf-8',
                timeout: 5000
            }).trim();
        } catch (e) {
            pyPresOutput = e.message;
        }

        console.log(`  Actual Python Runtime Output: ${pyPresOutput}`);
        const pyPresRunSuccess = pyPresOutput.includes('PYTHON_PRESERVATION_RUN_OK=True');

        results.push({
            scenario: '3. Python Language Preservation (Strict Anti-JS Verification)',
            inputDevA: pyPreserveDevA,
            inputDevB: pyPreserveDevB,
            mergedOutput: pyPresCode,
            expectedOutput: 'Pure Python (0 JavaScript keywords), valid Python 3 AST, execution output True',
            actualOutput: pyPresOutput,
            passed: antiJsPassed && pyPresRunSuccess,
            screenshots: [screenshot5]
        });

        // Close modal
        await clickButtonWithText(page, 'Cancel');
        await delay(600);

        // =============================================================
        // SCENARIO 4: JAVASCRIPT LANGUAGE PRESERVATION (NEVER OUTPUT PYTHON)
        // =============================================================
        console.log(`\n----------------------------------------------------------------`);
        console.log(`🟨 SCENARIO 4: JavaScript Language Preservation (Strict Anti-Python Check)`);
        console.log(`----------------------------------------------------------------`);

        const jsPreserveFileId = 'file_js_pres_' + Date.now();
        const jsPreserveFileObj = {
            id: jsPreserveFileId,
            name: 'orderService.js',
            path: '/orderService.js',
            language: 'javascript',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            createdBy: 'Alice'
        };

        const jsPreserveBase = `function calculateTotal(items, discountRate = 0) {
    const sum = items.reduce((acc, curr) => acc + curr, 0);
    return sum;
}
`;

        const jsPreserveDevA = `function calculateTotal(items, discountRate = 0.05, shipping = 10) {
    const sum = items.reduce((acc, curr) => acc + curr, 0);
    const total = (sum * (1 - discountRate)) + shipping;
    return total;
}`;

        const jsPreserveDevB = `function calculateTotal(items, discountRate = 0.1, giftWrap = 5) {
    const sum = items.reduce((acc, curr) => acc + curr, 0);
    const total = (sum * (1 - discountRate)) + giftWrap;
    return total;
}`;

        docBob.transact(() => {
            filesMap.set(jsPreserveFileId, jsPreserveFileObj);
            const yText = docBob.getText('file_content_' + jsPreserveFileId);
            yText.insert(0, jsPreserveBase);
        });
        await delay(800);

        // Switch tab in UI
        await page.evaluate((targetName) => {
            const tabs = Array.from(document.querySelectorAll('button'));
            const tab = tabs.find(t => t.textContent && t.textContent.includes(targetName));
            if (tab) tab.click();
        }, 'orderService.js');
        await delay(600);

        // Track Alice's JS edit
        await fetch(`${BACKEND_URL}/api/rooms/${roomId}/track-edit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                edit: {
                    userId: 'dev-alice',
                    userName: 'Alice',
                    fileId: jsPreserveFileId,
                    fileName: 'orderService.js',
                    language: 'javascript',
                    symbolName: 'calculateTotal',
                    currentSnippet: jsPreserveDevA,
                    fullFileContent: jsPreserveDevA,
                    timestamp: Date.now() - 2000
                },
                baseContent: jsPreserveBase
            })
        });

        // Trigger Bob's edit -> conflict
        const resJsPres = await fetch(`${BACKEND_URL}/api/rooms/${roomId}/track-edit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                edit: {
                    userId: 'dev-bob',
                    userName: 'Bob',
                    fileId: jsPreserveFileId,
                    fileName: 'orderService.js',
                    language: 'javascript',
                    symbolName: 'calculateTotal',
                    currentSnippet: jsPreserveDevB,
                    fullFileContent: jsPreserveDevB,
                    timestamp: Date.now()
                },
                baseContent: jsPreserveBase
            })
        });

        const dataJsPres = await resJsPres.json();
        const solJsPres3 = dataJsPres.conflict?.solutions?.find(s => s.id === 3);

        await delay(1000);
        await clickButtonWithText(page, 'Resolve with AI') || await clickButtonWithText(page, 'AI Conflict Resolver');
        await waitForSelectorWithText(page, 'button', 'Accept & Apply Option', 10000);

        const screenshot6 = path.join(SCREENSHOT_DIR, 'scenario4_js_preservation_modal.png');
        await page.screenshot({ path: screenshot6, fullPage: false });
        console.log(`  📸 Captured Screenshot 6: ${screenshot6}`);

        const jsPresCode = solJsPres3?.code || '';
        console.log(`  Option 3 Generated Code:\n${jsPresCode}`);

        const antiPyPassed = jsPresCode.startsWith('function calculateTotal')
            && !jsPresCode.includes('def ')
            && !jsPresCode.includes('kwargs')
            && !jsPresCode.includes('elif ')
            && jsPresCode.includes('{')
            && jsPresCode.includes('}');

        console.log(`  Strict Anti-Python Check: ${antiPyPassed}`);

        // Execute in Node.js
        const jsPresRunner = `${jsPresCode}
const res = calculateTotal([50, 50]);
console.log("JS_PRESERVATION_RUN_OK=" + (typeof res === 'number' || res !== undefined));
`;
        let jsPresOutput = '';
        try {
            jsPresOutput = execSync('node', {
                input: jsPresRunner,
                encoding: 'utf-8',
                timeout: 5000
            }).trim();
        } catch (e) {
            jsPresOutput = e.stderr ? e.stderr.toString() : e.message;
        }

        console.log(`  Actual Node.js Runtime Output: ${jsPresOutput}`);
        const jsPresRunSuccess = jsPresOutput.includes('JS_PRESERVATION_RUN_OK=true');

        results.push({
            scenario: '4. JavaScript Language Preservation (Strict Anti-Python Verification)',
            inputDevA: jsPreserveDevA,
            inputDevB: jsPreserveDevB,
            mergedOutput: jsPresCode,
            expectedOutput: 'Pure JavaScript (0 Python keywords), valid Node.js VM, execution output true',
            actualOutput: jsPresOutput,
            passed: antiPyPassed && jsPresRunSuccess,
            screenshots: [screenshot6]
        });

        // Cleanup
        providerBob.destroy();
        wsBob.close();

    } finally {
        await browser.close();
    }

    // Save final report data
    const summaryPath = path.join(SCREENSHOT_DIR, 'ui_test_summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(results, null, 2));

    console.log(`\n================================================================`);
    console.log(`📊 END-TO-END UI TEST SUMMARY`);
    console.log(`================================================================`);
    results.forEach((r, idx) => {
        console.log(`${r.passed ? '✅' : '❌'} ${r.scenario}`);
        console.log(`   Screenshots: ${r.screenshots.join(', ')}`);
    });
    console.log(`================================================================\n`);

    const allPassed = results.every(r => r.passed);
    if (!allPassed) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

runUITests().catch(err => {
    console.error('Fatal UI Test Error:', err);
    process.exit(1);
});
