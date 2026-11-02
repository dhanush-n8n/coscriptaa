const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const Y = require('yjs');
const { WebsocketProvider } = require('y-websocket');
const WebSocket = require('ws');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = 'C:\\Users\\chedu\\.gemini\\antigravity-ide\\brain\\74db6949-efb7-435b-bf49-17d8c68c0e82\\screenshots';
const FRONTEND_URL = 'http://localhost:5173/coscriptaa';

const delay = ms => new Promise(r => setTimeout(r, ms));

async function runBrowserVerification() {
    console.log('======================================================');
    console.log('🌐 STARTING REAL BROWSER UI VERIFICATION');
    console.log('======================================================');

    if (!fs.existsSync(SCREENSHOT_DIR)) {
        fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
    }

    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
    });

    const testResults = {
        python: {},
        javascript: {},
        synchronization: {},
        execution: {}
    };

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1440, height: 900 });

        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('Conflict') || text.includes('Error') || text.includes('Language')) {
                console.log(`[Browser Console]:`, text);
            }
        });

        // ==========================================================
        // TEST 1: PYTHON CONFLICT RESOLUTION IN BROWSER UI
        // ==========================================================
        console.log('\n--- TEST 1: Python Conflict Resolution in Browser UI ---');
        console.log('1.1 Navigating to room creation page...');
        await page.goto(`${FRONTEND_URL}/start`, { waitUntil: 'load' });
        await page.waitForSelector('#name');
        await page.type('#name', 'Alice (Lead Python Dev)');

        console.log('1.2 Clicking Create new room...');
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const btn = btns.find(b => b.textContent && b.textContent.includes('Create new room'));
            if (btn) btn.click();
        });

        await page.waitForSelector('.monaco-editor', { timeout: 15000 });
        await delay(1200);

        // Extract current room ID from URL
        const roomUrl = page.url();
        const roomId = roomUrl.split('/').pop().split('?')[0];
        console.log(`1.3 Room established with ID: ${roomId}`);

        // Initial check: default language is JavaScript
        const initialDropdownText = await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const langBtn = btns.find(b => b.textContent && (b.textContent.includes('JavaScript') || b.textContent.includes('Python')));
            return langBtn ? langBtn.textContent.trim() : null;
        });
        console.log('Initial Dropdown Label:', initialDropdownText);

        // Switch language to Python via UI
        console.log('1.4 Opening Language Dropdown...');
        const buttons = await page.$$('button');
        let langBtnHandle = null;
        for (const btn of buttons) {
            const text = await page.evaluate(el => el.textContent, btn);
            if (text && (text.includes('JavaScript') || text.includes('Python'))) {
                langBtnHandle = btn;
                break;
            }
        }
        if (!langBtnHandle) throw new Error('Language Dropdown button not found');
        await langBtnHandle.click();
        await delay(600);

        console.log('1.5 Clicking "Python" menuitem...');
        await page.waitForSelector('[role="menuitem"]', { timeout: 5000 });
        const menuItems = await page.$$('[role="menuitem"]');
        let pyItemHandle = null;
        for (const item of menuItems) {
            const text = await page.evaluate(el => el.textContent, item);
            if (text && text.trim().includes('Python')) {
                pyItemHandle = item;
                break;
            }
        }
        if (!pyItemHandle) throw new Error('Python menuitem not found');
        await pyItemHandle.click();
        await delay(1000);

        // Verify active file extension and dropdown updated to Python
        const stateAfterPy = await page.evaluate(() => {
            const spans = Array.from(document.querySelectorAll('span'));
            const fileNameSpan = spans.find(s => s.textContent && (s.textContent.includes('.py') || s.textContent.includes('.js')));
            const btns = Array.from(document.querySelectorAll('button'));
            const langBtn = btns.find(b => b.textContent && (b.textContent.includes('JavaScript') || b.textContent.includes('Python')));
            return {
                fileName: fileNameSpan ? fileNameSpan.textContent.trim() : null,
                dropdownText: langBtn ? langBtn.textContent.trim() : null
            };
        });
        console.log('State After Selecting Python in UI:', stateAfterPy);
        if (!stateAfterPy.fileName.endsWith('.py')) {
            throw new Error(`Expected active file to be .py, got ${stateAfterPy.fileName}`);
        }
        if (!stateAfterPy.dropdownText.includes('Python')) {
            throw new Error(`Expected dropdown to display Python, got ${stateAfterPy.dropdownText}`);
        }
        console.log('  ✅ PASS: UI accurately reflects Python and main.py');

        // Trigger AI Conflict Resolver
        console.log('1.6 Triggering AI Conflict Resolver in Python mode...');
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const btn = btns.find(b => b.textContent && (b.textContent.includes('AI Conflict Resolver') || b.textContent.includes('Resolve with AI')));
            if (btn) btn.click();
        });
        await delay(2500);

        // Verify Modal is Open and Inspect Option 3 Code
        await page.waitForSelector('[data-testid="selected-option-code"]', { timeout: 10000 });
        const pythonOption3Code = await page.evaluate(() => {
            const codeEl = document.querySelector('[data-testid="selected-option-code"] code');
            return codeEl ? codeEl.textContent.trim() : null;
        });
        console.log('\n[Option 3 Code in Python Modal]:\n' + pythonOption3Code + '\n');

        // Assertions for Python preservation
        if (!pythonOption3Code.startsWith('def calculate')) {
            throw new Error(`Option 3 does NOT start with 'def calculate': ${pythonOption3Code}`);
        }
        const forbiddenJsTokens = ['function', 'const', 'let', 'var', 'typeof', 'Math.max', '===', '!=='];
        for (const token of forbiddenJsTokens) {
            const rx = new RegExp(`\\b${token}\\b`);
            if (rx.test(pythonOption3Code)) {
                throw new Error(`Option 3 illegally contains JavaScript token '${token}'!`);
            }
        }
        console.log('  ✅ PASS: Option 3 is 100% pure Python with ZERO JavaScript keywords');

        // Save Screenshot of Python Conflict Modal
        const pyModalScreenshot = path.join(SCREENSHOT_DIR, 'browser_python_conflict_modal.png');
        await page.screenshot({ path: pyModalScreenshot });
        console.log('  📸 Screenshot saved:', pyModalScreenshot);

        // Click "Accept & Apply Option 3"
        console.log('1.7 Clicking "Accept & Apply Option 3"...');
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const applyBtn = btns.find(b => b.textContent && b.textContent.includes('Accept & Apply Option'));
            if (applyBtn) applyBtn.click();
        });
        await delay(1500);

        // Verify Monaco Editor contains Python Option 3 code
        const editorCodeAfterPy = await page.evaluate(() => {
            if (window.monaco && window.monaco.editor) {
                const models = window.monaco.editor.getModels();
                if (models.length > 0) return models[0].getValue();
            }
            return null;
        });
        console.log('Monaco Editor Content after Python Option 3 Applied:');
        console.log(editorCodeAfterPy);

        if (!editorCodeAfterPy.includes('def calculate')) {
            throw new Error(`Monaco editor does not contain 'def calculate' after resolution!`);
        }
        if (editorCodeAfterPy.includes('function calculate') || editorCodeAfterPy.includes('Math.max')) {
            throw new Error(`Monaco editor contains JavaScript code in Python file!`);
        }
        console.log('  ✅ PASS: Python Option 3 cleanly merged into Monaco editor');

        // Save Screenshot of Editor after Python Applied
        const pyEditorScreenshot = path.join(SCREENSHOT_DIR, 'browser_python_editor_applied.png');
        await page.screenshot({ path: pyEditorScreenshot });
        console.log('  📸 Screenshot saved:', pyEditorScreenshot);

        // ==========================================================
        // TEST 2: PEER SYNCHRONIZATION VIA CRDT Yjs (Bob)
        // ==========================================================
        console.log('\n--- TEST 2: Peer Synchronization via CRDT Yjs (Bob) ---');
        console.log(`2.1 Connecting Bob to room ${roomId} via Yjs WebSockets...`);
        const bobDoc = new Y.Doc();
        const bobProvider = new WebsocketProvider('ws://localhost:5001', roomId, bobDoc, { WebSocketPolyfill: WebSocket });

        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Bob CRDT connection timed out')), 5000);
            bobProvider.on('sync', isSynced => {
                if (isSynced) {
                    clearTimeout(timeout);
                    resolve();
                }
            });
        });
        console.log('  ✅ PASS: Bob connected and synchronized with CRDT');

        const bobFilesMap = bobDoc.getMap('codebase_files');
        const bobFiles = Array.from(bobFilesMap.values());
        console.log('Bob Codebase Files:', bobFiles.map(f => ({ id: f.id, name: f.name, language: f.language })));

        const activeFile = bobFiles.find(f => f.name.endsWith('.py'));
        if (!activeFile) throw new Error('Bob did not receive .py file');

        const bobText = bobDoc.getText('file_content_' + activeFile.id).toString();
        console.log('Bob Document Content:');
        console.log(bobText);

        if (!bobText.includes('def calculate')) {
            throw new Error('Bob CRDT buffer does not contain def calculate!');
        }
        console.log('  ✅ PASS: Bob received identical merged Python code via CRDT Yjs');

        // ==========================================================
        // TEST 3: EXECUTION OF MERGED PYTHON CODE
        // ==========================================================
        console.log('\n--- TEST 3: Python Execution Verification ---');
        const tempPyFile = path.join(__dirname, 'temp_py_exec.py');
        fs.writeFileSync(tempPyFile, `${bobText}\n\nprint("PYTHON_CALCULATE_RESULT:", calculate(100, 20, tax_rate=0.05, discount=10))\n`);
        const wslPyPath = tempPyFile.replace(/\\/g, '/').replace(/^([A-Za-z]):/, (_, drive) => `/mnt/${drive.toLowerCase()}`);
        const pyOutput = execSync(`wsl python3 ${wslPyPath}`, { encoding: 'utf-8' }).trim();
        try { fs.unlinkSync(tempPyFile); } catch {}
        console.log('Python 3 Runtime Output:');
        console.log(pyOutput);

        if (!pyOutput.includes('PYTHON_CALCULATE_RESULT: 116.0')) {
            throw new Error(`Python execution gave unexpected result: ${pyOutput}`);
        }
        console.log('  ✅ PASS: Python code executes cleanly with result: 116.0 (Zero SyntaxErrors)');

        bobProvider.destroy();
        bobDoc.destroy();

        // ==========================================================
        // TEST 4: JAVASCRIPT CONFLICT RESOLUTION IN BROWSER UI
        // ==========================================================
        console.log('\n--- TEST 4: JavaScript Conflict Resolution in Browser UI ---');
        console.log('4.1 Creating fresh room for JavaScript test...');
        await page.goto(`${FRONTEND_URL}/start`, { waitUntil: 'load' });
        await page.waitForSelector('#name');
        await page.type('#name', 'Alice (JavaScript Lead)');

        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const btn = btns.find(b => b.textContent && b.textContent.includes('Create new room'));
            if (btn) btn.click();
        });

        await page.waitForSelector('.monaco-editor', { timeout: 15000 });
        await delay(1200);

        const jsRoomUrl = page.url();
        const jsRoomId = jsRoomUrl.split('/').pop().split('?')[0];
        console.log(`4.2 JavaScript Room established: ${jsRoomId}`);

        const jsState = await page.evaluate(() => {
            const spans = Array.from(document.querySelectorAll('span'));
            const fileNameSpan = spans.find(s => s.textContent && (s.textContent.includes('.js') || s.textContent.includes('.py')));
            const btns = Array.from(document.querySelectorAll('button'));
            const langBtn = btns.find(b => b.textContent && (b.textContent.includes('JavaScript') || b.textContent.includes('Python')));
            return {
                fileName: fileNameSpan ? fileNameSpan.textContent.trim() : null,
                dropdownText: langBtn ? langBtn.textContent.trim() : null
            };
        });
        console.log('Initial JS State:', jsState);
        if (!jsState.fileName.endsWith('.js') || !jsState.dropdownText.includes('JavaScript')) {
            throw new Error(`Expected JavaScript default state, got ${JSON.stringify(jsState)}`);
        }

        console.log('4.3 Triggering AI Conflict Resolver in JavaScript mode...');
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const btn = btns.find(b => b.textContent && (b.textContent.includes('AI Conflict Resolver') || b.textContent.includes('Resolve with AI')));
            if (btn) btn.click();
        });
        await delay(2500);

        // Verify Modal is Open and Inspect Option 3 Code
        await page.waitForSelector('[data-testid="selected-option-code"]', { timeout: 10000 });
        const jsOption3Code = await page.evaluate(() => {
            const codeEl = document.querySelector('[data-testid="selected-option-code"] code');
            return codeEl ? codeEl.textContent.trim() : null;
        });
        console.log('\n[Option 3 Code in JavaScript Modal]:\n' + jsOption3Code + '\n');

        // Assertions for JavaScript preservation
        if (!jsOption3Code.startsWith('function calculate')) {
            throw new Error(`Option 3 does NOT start with 'function calculate': ${jsOption3Code}`);
        }
        const forbiddenPyTokens = ['def', 'kwargs', 'elif'];
        for (const token of forbiddenPyTokens) {
            const rx = new RegExp(`\\b${token}\\b`);
            if (rx.test(jsOption3Code)) {
                throw new Error(`Option 3 illegally contains Python token '${token}'!`);
            }
        }
        console.log('  ✅ PASS: Option 3 is 100% pure JavaScript with ZERO Python keywords');

        // Save Screenshot of JavaScript Conflict Modal
        const jsModalScreenshot = path.join(SCREENSHOT_DIR, 'browser_javascript_conflict_modal.png');
        await page.screenshot({ path: jsModalScreenshot });
        console.log('  📸 Screenshot saved:', jsModalScreenshot);

        // Click "Accept & Apply Option 3"
        console.log('4.4 Clicking "Accept & Apply Option 3"...');
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const applyBtn = btns.find(b => b.textContent && b.textContent.includes('Accept & Apply Option'));
            if (applyBtn) applyBtn.click();
        });
        await delay(1500);

        // Verify Monaco Editor contains JavaScript Option 3 code
        const editorCodeAfterJs = await page.evaluate(() => {
            if (window.monaco && window.monaco.editor) {
                const models = window.monaco.editor.getModels();
                if (models.length > 0) return models[0].getValue();
            }
            return null;
        });
        console.log('Monaco Editor Content after JavaScript Option 3 Applied:');
        console.log(editorCodeAfterJs);

        if (!editorCodeAfterJs.includes('function calculate')) {
            throw new Error(`Monaco editor does not contain 'function calculate' after resolution!`);
        }
        console.log('  ✅ PASS: JavaScript Option 3 cleanly merged into Monaco editor');

        // Save Screenshot of Editor after JavaScript Applied
        const jsEditorScreenshot = path.join(SCREENSHOT_DIR, 'browser_javascript_editor_applied.png');
        await page.screenshot({ path: jsEditorScreenshot });
        console.log('  📸 Screenshot saved:', jsEditorScreenshot);

        // Execute JS code in Node
        console.log('\n--- TEST 5: JavaScript Execution Verification ---');
        const tempJsFile = path.join(__dirname, 'temp_js_exec.js');
        fs.writeFileSync(tempJsFile, `${editorCodeAfterJs}\nconsole.log("JS_CALCULATE_RESULT:", calculate(100, 20, 0.05, 10));\n`);
        const jsOutput = execSync(`node "${tempJsFile}"`, { encoding: 'utf-8' }).trim();
        try { fs.unlinkSync(tempJsFile); } catch {}
        console.log('Node.js Runtime Output:');
        console.log(jsOutput);

        if (!jsOutput.includes('JS_CALCULATE_RESULT: 116')) {
            throw new Error(`JavaScript execution gave unexpected result: ${jsOutput}`);
        }
        console.log('  ✅ PASS: JavaScript code executes cleanly with result: 116');

        console.log('\n======================================================');
        console.log('🎉 ALL REAL BROWSER UI VERIFICATION TESTS PASSED!');
        console.log('======================================================');

    } finally {
        await browser.close();
    }
}

runBrowserVerification().catch(err => {
    console.error('❌ Browser Verification Failed:', err);
    process.exit(1);
});
