const { WebSocket } = require('ws');

const BACKEND_URL = 'http://localhost:3000';
const WS_URL = 'ws://localhost:5000';

const delay = ms => new Promise(r => setTimeout(r, ms));

async function runTest() {
    console.log('========================================================================');
    console.log('🧪 TESTING OPTION 1 & OPTION 2 CODE EXECUTION (PYTHON & JAVASCRIPT)');
    console.log('========================================================================\n');

    const roomId = 'room_opt_test_' + Date.now();

    // Connect WS listener to capture console output
    const ws = new WebSocket(`${WS_URL}?roomId=${roomId}&id=test-runner&name=TestRunner`);
    const outputs = [];
    await new Promise((resolve, reject) => {
        ws.on('open', resolve);
        ws.on('error', reject);
    });
    ws.on('message', data => {
        try {
            const parsed = JSON.parse(data.toString());
            if (parsed.type === 'output') {
                outputs.push(parsed.message);
            }
        } catch {
            outputs.push(data.toString());
        }
    });

    await delay(1500);

    // -------------------------------------------------------------
    // 1. JAVASCRIPT CONFLICT & OPTION 1 / OPTION 2 EXECUTION
    // -------------------------------------------------------------
    console.log('[TEST 1] JavaScript: Generating conflict and checking Option 1 & 2...');
    const jsBase = 'function calculate(a, b) {\n    return a + b;\n}\nconsole.log("Result:", calculate(10, 20));';
    const jsDevA = 'function calculate(a, b, taxRate = 0.05) {\n    const sum = a + b;\n    return sum + (sum * taxRate);\n}\nconsole.log("Result Dev A:", calculate(100, 20));';
    const jsDevB = 'function calculate(x, y, discount = 10) {\n    const product = x * y;\n    return Math.max(0, product - discount);\n}\nconsole.log("Result Dev B:", calculate(10, 5));';

    // Alice edit
    await fetch(`${BACKEND_URL}/api/rooms/${roomId}/track-edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            edit: {
                userId: 'alice',
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

    // Bob edit -> conflict
    const resJs = await fetch(`${BACKEND_URL}/api/rooms/${roomId}/track-edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            edit: {
                userId: 'bob',
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

    const dataJs = await resJs.json();
    const solutionsJs = dataJs.conflict?.solutions || [];
    const opt1Js = solutionsJs.find(s => s.id === 1);
    const opt2Js = solutionsJs.find(s => s.id === 2);

    console.log(`  Option 1 JS Code:\n${opt1Js?.code.split('\n').map(l => '    ' + l).join('\n')}`);
    console.log(`  Option 2 JS Code:\n${opt2Js?.code.split('\n').map(l => '    ' + l).join('\n')}`);

    if (!opt1Js?.code.includes('return sum + (sum * taxRate)')) {
        throw new Error('Option 1 JS code is missing function body!');
    }
    if (!opt2Js?.code.includes('return Math.max(0, product - discount)')) {
        throw new Error('Option 2 JS code is missing function body!');
    }
    console.log('  ✅ PASS: Both JS Option 1 and Option 2 contain complete function bodies.');

    // Execute Option 1 JS code
    console.log('\n[TEST 1A] Executing JavaScript Option 1 Code...');
    outputs.length = 0;
    const testCodeOpt1Js = `${opt1Js.code}\nconsole.log("OPT1_OUTPUT:", calculate(100, 20));`;
    await fetch(`${BACKEND_URL}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            code: testCodeOpt1Js,
            language: 'javascript',
            roomId,
            input: ''
        })
    });

    await delay(3000);
    console.log(`  Actual Console Output received:`, outputs);
    const opt1JsSuccess = outputs.some(out => out.includes('OPT1_OUTPUT: 126') || out.includes('126'));
    if (!opt1JsSuccess) {
        throw new Error(`Option 1 JS execution failed! Outputs: ${JSON.stringify(outputs)}`);
    }
    console.log('  ✅ PASS: JavaScript Option 1 executed successfully and displayed actual console output: 126');

    // Execute Option 2 JS code
    console.log('\n[TEST 1B] Executing JavaScript Option 2 Code...');
    outputs.length = 0;
    const testCodeOpt2Js = `${opt2Js.code}\nconsole.log("OPT2_OUTPUT:", calculate(10, 5));`;
    await fetch(`${BACKEND_URL}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            code: testCodeOpt2Js,
            language: 'javascript',
            roomId,
            input: ''
        })
    });

    await delay(3000);
    console.log(`  Actual Console Output received:`, outputs);
    const opt2JsSuccess = outputs.some(out => out.includes('OPT2_OUTPUT: 40') || out.includes('40'));
    if (!opt2JsSuccess) {
        throw new Error(`Option 2 JS execution failed! Outputs: ${JSON.stringify(outputs)}`);
    }
    console.log('  ✅ PASS: JavaScript Option 2 executed successfully and displayed actual console output: 40');

    // -------------------------------------------------------------
    // 2. PYTHON CONFLICT & OPTION 1 / OPTION 2 EXECUTION
    // -------------------------------------------------------------
    console.log('\n[TEST 2] Python: Generating conflict and checking Option 1 & 2...');
    const pyRoom = 'py_room_' + Date.now();
    const wsPy = new WebSocket(`${WS_URL}?roomId=${pyRoom}&id=test-runner-py&name=TestRunnerPy`);
    const pyOutputs = [];
    await new Promise((resolve, reject) => {
        wsPy.on('open', resolve);
        wsPy.on('error', reject);
    });
    wsPy.on('message', data => {
        try {
            const parsed = JSON.parse(data.toString());
            if (parsed.type === 'output') {
                pyOutputs.push(parsed.message);
            }
        } catch {
            pyOutputs.push(data.toString());
        }
    });
    await delay(1500);

    const pyBase = 'def calculate(a, b):\n    return a + b\n\nprint("Result:", calculate(10, 20))';
    const pyDevA = 'def calculate(a, b, tax_rate=0.05):\n    subtotal = a + b\n    tax = subtotal * tax_rate\n    return subtotal + tax\n\nprint("Dev A:", calculate(100, 20))';
    const pyDevB = 'def calculate(a, b, discount=10):\n    subtotal = a + b\n    return max(0, subtotal - discount)\n\nprint("Dev B:", calculate(50, 10))';

    // Alice edit
    await fetch(`${BACKEND_URL}/api/rooms/${pyRoom}/track-edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            edit: {
                userId: 'alice-py',
                userName: 'Alice',
                fileId: 'main_py',
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

    // Bob edit -> conflict
    const resPy = await fetch(`${BACKEND_URL}/api/rooms/${pyRoom}/track-edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            edit: {
                userId: 'bob-py',
                userName: 'Bob',
                fileId: 'main_py',
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

    const dataPy = await resPy.json();
    const solutionsPy = dataPy.conflict?.solutions || [];
    const opt1Py = solutionsPy.find(s => s.id === 1);
    const opt2Py = solutionsPy.find(s => s.id === 2);

    console.log(`  Option 1 Python Code:\n${opt1Py?.code.split('\n').map(l => '    ' + l).join('\n')}`);
    console.log(`  Option 2 Python Code:\n${opt2Py?.code.split('\n').map(l => '    ' + l).join('\n')}`);

    if (!opt1Py?.code.includes('return subtotal + tax')) {
        throw new Error('Option 1 Python code is missing function body!');
    }
    if (!opt2Py?.code.includes('return max(0, subtotal - discount)')) {
        throw new Error('Option 2 Python code is missing function body!');
    }
    console.log('  ✅ PASS: Both Python Option 1 and Option 2 contain complete function bodies.');

    // Execute Option 1 Python code
    console.log('\n[TEST 2A] Executing Python Option 1 Code...');
    pyOutputs.length = 0;
    const testCodeOpt1Py = `${opt1Py.code}\n\nprint("OPT1_PY_OUTPUT:", calculate(100, 20))`;
    await fetch(`${BACKEND_URL}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            code: testCodeOpt1Py,
            language: 'python',
            roomId: pyRoom,
            input: ''
        })
    });

    await delay(3000);
    console.log(`  Actual Console Output received:`, pyOutputs);
    const opt1PySuccess = pyOutputs.some(out => out.includes('OPT1_PY_OUTPUT: 126.0') || out.includes('126.0'));
    if (!opt1PySuccess) {
        throw new Error(`Option 1 Python execution failed! Outputs: ${JSON.stringify(pyOutputs)}`);
    }
    console.log('  ✅ PASS: Python Option 1 executed successfully and displayed actual console output: 126.0');

    // Execute Option 2 Python code
    console.log('\n[TEST 2B] Executing Python Option 2 Code...');
    pyOutputs.length = 0;
    const testCodeOpt2Py = `${opt2Py.code}\n\nprint("OPT2_PY_OUTPUT:", calculate(50, 10))`;
    await fetch(`${BACKEND_URL}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            code: testCodeOpt2Py,
            language: 'python',
            roomId: pyRoom,
            input: ''
        })
    });

    await delay(3000);
    console.log(`  Actual Console Output received:`, pyOutputs);
    const opt2PySuccess = pyOutputs.some(out => out.includes('OPT2_PY_OUTPUT: 50') || out.includes('50'));
    if (!opt2PySuccess) {
        throw new Error(`Option 2 Python execution failed! Outputs: ${JSON.stringify(pyOutputs)}`);
    }
    console.log('  ✅ PASS: Python Option 2 executed successfully and displayed actual console output: 50');

    ws.close();
    wsPy.close();

    console.log('\n========================================================================');
    console.log('🎉 ALL OPTION 1 & OPTION 2 JAVASCRIPT & PYTHON EXECUTION TESTS PASSED!');
    console.log('========================================================================');
}

runTest().catch(err => {
    console.error('Test Error:', err);
    process.exit(1);
});
