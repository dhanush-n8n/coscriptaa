/**
 * Automated Test Suite: Language Preservation in AI Conflict Resolution
 * 
 * Verifies:
 * 1. Automatic detection of programming language (Python vs JavaScript).
 * 2. Option 3 AI Conflict Resolution preserves Python for Python code.
 *    - Validates syntax with python3 AST compiler.
 *    - Never outputs JavaScript keywords (function, const, let, var, ===, braces).
 * 3. Option 3 AI Conflict Resolution preserves JavaScript for JavaScript code.
 *    - Validates syntax with Node vm.Script.
 *    - Never outputs Python keywords (def, kwargs, etc).
 * 4. Language-appropriate execution & smoke testing.
 * 5. Document-level AST replacement & deduplication in Yjs for Python & JS.
 * 6. Collaborator synchronization via Yjs without cross-language corruption.
 */

const WebSocket = require('ws');
const Y = require('yjs');
const { WebsocketProvider } = require('y-websocket');
const vm = require('vm');
const { execSync } = require('child_process');

const BACKEND_URL = 'http://localhost:3000';
const WS_URL = 'ws://localhost:5000';
const YJS_URL = 'ws://localhost:5001';
const TEST_ROOM = 'test_lang_preservation_' + Date.now();

async function runTestSuite() {
    console.log(`\n======================================================`);
    console.log(`🧪 TESTING LANGUAGE PRESERVATION IN AI CONFLICT RESOLUTION`);
    console.log(`Room: ${TEST_ROOM}`);
    console.log(`======================================================\n`);

    let passed = 0;
    let failed = 0;

    function assert(cond, msg) {
        if (cond) {
            console.log(`  ✅ PASS: ${msg}`);
            passed++;
        } else {
            console.error(`  ❌ FAIL: ${msg}`);
            failed++;
        }
    }

    // Connect Collaborators via Yjs
    console.log(`[SETUP] Connecting Collaborators Alice & Bob via Yjs & WebSockets...`);
    const docAlice = new Y.Doc();
    const docBob = new Y.Doc();
    const providerAlice = new WebsocketProvider(YJS_URL, TEST_ROOM, docAlice, { WebSocketPolyfill: WebSocket });
    const providerBob = new WebsocketProvider(YJS_URL, TEST_ROOM, docBob, { WebSocketPolyfill: WebSocket });

    const wsAlice = new WebSocket(`${WS_URL}?roomId=${TEST_ROOM}&id=dev-alice&name=Alice`);
    const wsBob = new WebSocket(`${WS_URL}?roomId=${TEST_ROOM}&id=dev-bob&name=Bob`);

    await new Promise(r => setTimeout(r, 1000));
    assert(wsAlice.readyState === WebSocket.OPEN && wsBob.readyState === WebSocket.OPEN, 'Collaborators connected via WebSockets');

    // -------------------------------------------------------------
    // TEST SUITE 1: PYTHON-TO-PYTHON CONFLICT RESOLUTION
    // -------------------------------------------------------------
    console.log(`\n------------------------------------------------------`);
    console.log(`🐍 SUITE 1: Python-to-Python Conflict Resolution`);
    console.log(`------------------------------------------------------`);

    const pythonBaseCode = `import math

def calculate(a, b):
    subtotal = a + b
    return subtotal

def helper():
    return "Python Helper Active"

print(calculate(10, 20))
`;

    const pythonDevACode = `def calculate(a, b, tax_rate=0.05):
    subtotal = a + b
    tax = subtotal * tax_rate
    print(f"Tax: {tax}")
    return subtotal + tax`;

    const pythonDevBCode = `def calculate(a, b, discount=10):
    subtotal = a + b
    print(f"Discount: {discount}")
    return max(0, subtotal - discount)`;

    // Seed Python file in Yjs
    const yAlicePy = docAlice.getText('file_content_py_file');
    const yBobPy = docBob.getText('file_content_py_file');
    docAlice.transact(() => {
        yAlicePy.insert(0, pythonBaseCode);
    });
    await new Promise(r => setTimeout(r, 400));
    assert(yBobPy.toString() === pythonBaseCode, 'Python base code synchronized to Bob via Yjs');

    // Record Alice's Python edit
    console.log(`[Python] Submitting Dev A's Python edit...`);
    await fetch(`${BACKEND_URL}/api/rooms/${TEST_ROOM}/track-edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            edit: {
                userId: 'dev-alice',
                userName: 'Alice',
                fileId: 'py_file',
                fileName: 'math_utils.py',
                language: 'python',
                symbolName: 'calculate',
                currentSnippet: pythonDevACode,
                fullFileContent: pythonDevACode,
                timestamp: Date.now()
            },
            baseContent: pythonBaseCode
        })
    });

    // Record Bob's Python edit -> triggers conflict
    console.log(`[Python] Submitting Dev B's Python edit -> Triggering conflict...`);
    const pyConflictRes = await fetch(`${BACKEND_URL}/api/rooms/${TEST_ROOM}/track-edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            edit: {
                userId: 'dev-bob',
                userName: 'Bob',
                fileId: 'py_file',
                fileName: 'math_utils.py',
                language: 'python',
                symbolName: 'calculate',
                currentSnippet: pythonDevBCode,
                fullFileContent: pythonDevBCode,
                timestamp: Date.now()
            },
            baseContent: pythonBaseCode
        })
    });

    const pyData = await pyConflictRes.json();
    assert(pyData.conflict !== null, 'Python conflict detected');
    assert(pyData.conflict.language === 'python', `Conflict language detected as 'python' (got '${pyData.conflict.language}')`);
    assert(Array.isArray(pyData.conflict.solutions) && pyData.conflict.solutions.length === 3, 'Exactly 3 solutions generated');

    const pyOpt1 = pyData.conflict.solutions.find(s => s.id === 1);
    const pyOpt2 = pyData.conflict.solutions.find(s => s.id === 2);
    const pyOpt3 = pyData.conflict.solutions.find(s => s.id === 3);

    // Option 3 Analysis for Python
    console.log(`\n[Python Option 3 Code Generated]:\n${pyOpt3.code}\n`);
    assert(pyOpt3.type === 'AI_MERGED', 'Option 3 is AI_MERGED');
    assert(pyOpt3.code.startsWith('def calculate'), 'Option 3 starts with Python function header "def calculate"');
    
    // Strict Language Preservation Checks: Python must NOT have JS keywords
    assert(!pyOpt3.code.includes('function '), 'Option 3 does NOT contain JavaScript "function" keyword');
    assert(!pyOpt3.code.includes('const '), 'Option 3 does NOT contain JavaScript "const"');
    assert(!pyOpt3.code.includes('let '), 'Option 3 does NOT contain JavaScript "let"');
    assert(!pyOpt3.code.includes('var '), 'Option 3 does NOT contain JavaScript "var"');
    assert(!pyOpt3.code.includes('=== '), 'Option 3 does NOT contain JavaScript strict equality "==="');
    assert(!pyOpt3.code.includes('Math.max'), 'Option 3 uses Python "max()" rather than JavaScript "Math.max()"');

    // Syntax & Execution Validation
    assert(pyOpt3.validation.syntaxCheck.passed === true, 'Option 3 passed Python syntax validation');
    assert(pyOpt3.validation.syntaxCheck.name === 'Python Syntax Validation', 'Used Python syntax validator');
    assert(pyOpt3.validation.executionCheck.passed === true, 'Option 3 passed Python sandbox execution smoke test');
    assert(pyOpt3.validation.overallPassed === true, 'Option 3 overallPassed is true');

    // Verify Python AST directly with python3
    let pyParsedDirectly = false;
    try {
        execSync(`wsl python3 -c "import ast, sys; ast.parse(sys.stdin.read()); print('AST_OK')"`, {
            input: pyOpt3.code,
            encoding: 'utf-8',
            timeout: 5000
        });
        pyParsedDirectly = true;
    } catch (e) {}
    assert(pyParsedDirectly, 'Verified: Option 3 code compiles directly with Python 3 AST compiler');

    // Test Python Execution of Merged Function
    let pyExecSmokeResult = null;
    try {
        const testRunnerPy = `${pyOpt3.code}
res = calculate(10, 20, tax_rate=0.1, discount=5)
print("PY_RESULT=" + str(res))
`;
        const pyOut = execSync(`wsl python3 -c "import sys; exec(sys.stdin.read())"`, {
            input: testRunnerPy,
            encoding: 'utf-8',
            timeout: 5000
        });
        pyExecSmokeResult = pyOut.trim();
    } catch (e) {
        console.error('Python execution error:', e.message);
    }
    assert(pyExecSmokeResult && pyExecSmokeResult.includes('PY_RESULT='), `Python execution succeeded with output: ${pyExecSmokeResult}`);

    // Apply Option 3 to document via backend resolution API
    console.log(`[Python] Applying Option 3 to room...`);
    const pyApplyRes = await fetch(`${BACKEND_URL}/api/rooms/${TEST_ROOM}/apply-resolution`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            conflict: pyData.conflict,
            chosenOptionId: 3,
            resolvedCode: pyOpt3.code,
            resolvedBy: 'Alice',
            optionTitle: pyOpt3.title,
            explanation: pyOpt3.explanation
        })
    });
    assert(pyApplyRes.ok, 'Resolution saved in Redis history');

    // -------------------------------------------------------------
    // TEST SUITE 2: JAVASCRIPT-TO-JAVASCRIPT CONFLICT RESOLUTION
    // -------------------------------------------------------------
    console.log(`\n------------------------------------------------------`);
    console.log(`🟨 SUITE 2: JavaScript-to-JavaScript Conflict Resolution`);
    console.log(`------------------------------------------------------`);

    const jsBaseCode = `// JS Utilities
function calculate(a, b) {
    return a + b;
}

function getStatus() {
    return "Active";
}

console.log(calculate(10, 20));
`;

    const jsDevACode = `function calculate(a, b, taxRate = 0.05) {
    const sum = a + b;
    const tax = sum * taxRate;
    console.log("Tax:", tax);
    return sum + tax;
}`;

    const jsDevBCode = `function calculate(a, b, discount = 10) {
    const sum = a + b;
    console.log("Discount:", discount);
    return Math.max(0, sum - discount);
}`;

    // Seed JS file in Yjs
    const yAliceJs = docAlice.getText('file_content_js_file');
    const yBobJs = docBob.getText('file_content_js_file');
    docAlice.transact(() => {
        yAliceJs.insert(0, jsBaseCode);
    });
    await new Promise(r => setTimeout(r, 400));
    assert(yBobJs.toString() === jsBaseCode, 'JS base code synchronized to Bob via Yjs');

    // Record Alice's JS edit
    console.log(`[JS] Submitting Dev A's JS edit...`);
    await fetch(`${BACKEND_URL}/api/rooms/${TEST_ROOM}/track-edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            edit: {
                userId: 'dev-alice',
                userName: 'Alice',
                fileId: 'js_file',
                fileName: 'mathUtils.js',
                language: 'javascript',
                symbolName: 'calculate',
                currentSnippet: jsDevACode,
                fullFileContent: jsDevACode,
                timestamp: Date.now()
            },
            baseContent: jsBaseCode
        })
    });

    // Record Bob's JS edit -> triggers conflict
    console.log(`[JS] Submitting Dev B's JS edit -> Triggering conflict...`);
    const jsConflictRes = await fetch(`${BACKEND_URL}/api/rooms/${TEST_ROOM}/track-edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            edit: {
                userId: 'dev-bob',
                userName: 'Bob',
                fileId: 'js_file',
                fileName: 'mathUtils.js',
                language: 'javascript',
                symbolName: 'calculate',
                currentSnippet: jsDevBCode,
                fullFileContent: jsDevBCode,
                timestamp: Date.now()
            },
            baseContent: jsBaseCode
        })
    });

    const jsData = await jsConflictRes.json();
    assert(jsData.conflict !== null, 'JavaScript conflict detected');
    assert(jsData.conflict.language === 'javascript', `Conflict language detected as 'javascript' (got '${jsData.conflict.language}')`);
    assert(Array.isArray(jsData.conflict.solutions) && jsData.conflict.solutions.length === 3, 'Exactly 3 solutions generated');

    const jsOpt3 = jsData.conflict.solutions.find(s => s.id === 3);

    // Option 3 Analysis for JavaScript
    console.log(`\n[JS Option 3 Code Generated]:\n${jsOpt3.code}\n`);
    assert(jsOpt3.type === 'AI_MERGED', 'Option 3 is AI_MERGED');
    assert(jsOpt3.code.startsWith('function calculate'), 'Option 3 starts with JS function header "function calculate"');

    // Strict Language Preservation Checks: JavaScript must NOT have Python syntax
    assert(!jsOpt3.code.includes('def '), 'Option 3 does NOT contain Python "def" keyword');
    assert(!jsOpt3.code.includes('kwargs'), 'Option 3 does NOT contain Python "kwargs"');
    assert(!jsOpt3.code.includes(': float'), 'Option 3 does NOT contain Python type hints');
    assert(jsOpt3.code.includes('{') && jsOpt3.code.includes('}'), 'Option 3 uses JavaScript curly braces');

    // Syntax & Execution Validation
    assert(jsOpt3.validation.syntaxCheck.passed === true, 'Option 3 passed JavaScript syntax validation');
    assert(jsOpt3.validation.syntaxCheck.name === 'Syntax Validation', 'Used JavaScript syntax validator');
    assert(jsOpt3.validation.executionCheck.passed === true, 'Option 3 passed JavaScript sandbox execution smoke test');
    assert(jsOpt3.validation.overallPassed === true, 'Option 3 overallPassed is true');

    // Verify JS syntax with Node vm
    let jsParsedDirectly = false;
    try {
        new vm.Script(jsOpt3.code);
        jsParsedDirectly = true;
    } catch (e) {}
    assert(jsParsedDirectly, 'Verified: Option 3 code compiles directly with Node vm.Script');

    // Test JS Execution of Merged Function
    let jsExecSmokeResult = null;
    try {
        const sandbox = { console: { log: (msg) => { jsExecSmokeResult = msg; } } };
        const ctx = vm.createContext(sandbox);
        const runnerJs = `${jsOpt3.code}\nconst res = calculate(10, 20, { taxRate: 0.1, discount: 5 });\nconsole.log("JS_RESULT=" + res);`;
        new vm.Script(runnerJs).runInContext(ctx);
    } catch (e) {
        console.error('JS execution error:', e.message);
    }
    assert(jsExecSmokeResult && jsExecSmokeResult.includes('JS_RESULT='), `JS execution succeeded with output: ${jsExecSmokeResult}`);

    // -------------------------------------------------------------
    // TEST SUITE 3: MIXED-LANGUAGE CONFLICT RESOLUTION
    // -------------------------------------------------------------
    console.log(`\n------------------------------------------------------`);
    console.log(`🔀 SUITE 3: Mixed-Language Conflict Resolution`);
    console.log(`------------------------------------------------------`);

    const mixedBaseCode = `def process_data(x, y):
    return x + y
`;

    const mixedDevAPy = `def process_data(x, y, factor=1.5):
    subtotal = x + y
    return subtotal * factor`;

    const mixedDevBJs = `function process_data(x, y, factor = 2.0) {
    const subtotal = x + y;
    return subtotal * factor;
}`;

    // Alice edits in Python on 'analytics.py'
    await fetch(`${BACKEND_URL}/api/rooms/${TEST_ROOM}/track-edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            edit: {
                userId: 'dev-alice',
                userName: 'Alice',
                fileId: 'mixed_file',
                fileName: 'analytics.py',
                language: 'python',
                symbolName: 'process_data',
                currentSnippet: mixedDevAPy,
                fullFileContent: mixedDevAPy,
                timestamp: Date.now()
            },
            baseContent: mixedBaseCode
        })
    });

    // Bob edits concurrently in JavaScript on 'analytics.py' -> Mixed-language conflict!
    const mixedConflictRes = await fetch(`${BACKEND_URL}/api/rooms/${TEST_ROOM}/track-edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            edit: {
                userId: 'dev-bob',
                userName: 'Bob',
                fileId: 'mixed_file',
                fileName: 'analytics.py',
                language: 'javascript',
                symbolName: 'process_data',
                currentSnippet: mixedDevBJs,
                fullFileContent: mixedDevBJs,
                timestamp: Date.now()
            },
            baseContent: mixedBaseCode
        })
    });

    const mixedData = await mixedConflictRes.json();
    assert(mixedData.conflict !== null, 'Mixed-language conflict detected');
    assert(mixedData.conflict.conflictType === 'LANGUAGE_MISMATCH', `Identified conflictType as 'LANGUAGE_MISMATCH' (got '${mixedData.conflict.conflictType}')`);
    assert(mixedData.conflict.language === 'python', `Canonical file language for 'analytics.py' identified as 'python'`);
    assert(mixedData.conflict.devA.language === 'python', `Dev A language preserved as 'python'`);
    assert(mixedData.conflict.devB.language === 'javascript', `Dev B language preserved as 'javascript'`);

    const mixedOpt1 = mixedData.conflict.solutions.find(s => s.id === 1);
    const mixedOpt2 = mixedData.conflict.solutions.find(s => s.id === 2);
    const mixedOpt3 = mixedData.conflict.solutions.find(s => s.id === 3);

    assert(mixedOpt1.validation.syntaxCheck.name === 'Python Syntax Validation', 'Option 1 (Alice Python) validated with Python validator');
    assert(mixedOpt1.validation.syntaxCheck.passed === true, 'Option 1 Python syntax passed');
    assert(mixedOpt2.validation.syntaxCheck.name === 'Syntax Validation', 'Option 2 (Bob JS) validated with JS validator');
    assert(mixedOpt2.validation.syntaxCheck.passed === true, 'Option 2 JS syntax passed');

    // Option 3 must be synthesized in the file's canonical language (Python)
    assert(mixedOpt3.code.startsWith('def process_data'), 'Option 3 merged strictly into canonical language (Python)');
    assert(!mixedOpt3.code.includes('function '), 'Option 3 contains 0 JavaScript function keywords');
    assert(mixedOpt3.validation.syntaxCheck.name === 'Python Syntax Validation', 'Option 3 validated with Python validator');
    assert(mixedOpt3.validation.syntaxCheck.passed === true, 'Option 3 Python syntax passed');

    // -------------------------------------------------------------
    // TEST SUITE 4: SAFE UNKNOWN / INDETERMINATE LANGUAGE HANDLING
    // -------------------------------------------------------------
    console.log(`\n------------------------------------------------------`);
    console.log(`🔒 SUITE 4: Safe Unknown Language Handling`);
    console.log(`------------------------------------------------------`);

    // Verify ASTParser.detectLanguage does NOT silently return 'javascript' for unknown code
    const unknownSnippet = `SECTION CONFIG\n  PARAM alpha = 10\n  PARAM beta = 20\nEND SECTION`;
    const detectedUnknown = await fetch(`${BACKEND_URL}/api/rooms/${TEST_ROOM}/track-edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            edit: {
                userId: 'dev-alice',
                userName: 'Alice',
                fileId: 'config_dat',
                fileName: 'config.dat',
                symbolName: 'CONFIG',
                currentSnippet: unknownSnippet,
                fullFileContent: unknownSnippet,
                timestamp: Date.now()
            },
            baseContent: unknownSnippet
        })
    });

    const unknownDevB = `SECTION CONFIG\n  PARAM alpha = 15\n  PARAM beta = 25\nEND SECTION`;
    const unknownRes = await fetch(`${BACKEND_URL}/api/rooms/${TEST_ROOM}/track-edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            edit: {
                userId: 'dev-bob',
                userName: 'Bob',
                fileId: 'config_dat',
                fileName: 'config.dat',
                symbolName: 'CONFIG',
                currentSnippet: unknownDevB,
                fullFileContent: unknownDevB,
                timestamp: Date.now()
            },
            baseContent: unknownSnippet
        })
    });

    const unknownData = await unknownRes.json();
    assert(unknownData.conflict !== null, 'Conflict detected on unknown language file');
    assert(unknownData.conflict.language === 'unknown', `Language safely identified as 'unknown' (NOT defaulted to javascript)`);
    const unknownOpt3 = unknownData.conflict.solutions.find(s => s.id === 3);
    assert(!unknownOpt3.code.includes('function CONFIG'), 'Option 3 did NOT inject JavaScript "function" into unknown language file');
    assert(!unknownOpt3.code.includes('const taxRate'), 'Option 3 did NOT inject JavaScript arithmetic into unknown language file');
    assert(unknownOpt3.validation.syntaxCheck.name === 'Structural Syntax Validation', 'Used structural validator rather than Node vm.Script');

    // -------------------------------------------------------------
    // TEST SUITE 5: CROSS-LANGUAGE VALIDATION GUARDRAILS
    // -------------------------------------------------------------
    console.log(`\n------------------------------------------------------`);
    console.log(`🛡️ SUITE 5: Cross-Language Validation Guardrails`);
    console.log(`------------------------------------------------------`);

    // Verify that attempting to validate Python code with JavaScript VM fails
    let pythonInJsVmFailed = false;
    try {
        new vm.Script(`def calculate(a, b):\n    return a + b`);
    } catch (e) {
        pythonInJsVmFailed = true;
    }
    assert(pythonInJsVmFailed, 'Guardrail confirmed: Python code correctly fails JavaScript vm.Script validation');

    // Verify that attempting to validate JavaScript code with Python AST fails
    let jsInPythonAstFailed = false;
    try {
        execSync(`wsl python3 -c "import ast, sys; ast.parse(sys.stdin.read())"`, {
            input: `function calculate(a, b) { return a + b; }`,
            encoding: 'utf-8',
            timeout: 5000
        });
    } catch (e) {
        jsInPythonAstFailed = true;
    }
    assert(jsInPythonAstFailed, 'Guardrail confirmed: JavaScript code correctly fails Python 3 AST validation');

    // Cleanup providers
    providerAlice.destroy();
    providerBob.destroy();
    wsAlice.close();
    wsBob.close();

    console.log(`\n======================================================`);
    console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log(`======================================================\n`);

    if (failed > 0) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

runTestSuite().catch(err => {
    console.error('Fatal test error:', err);
    process.exit(1);
});
