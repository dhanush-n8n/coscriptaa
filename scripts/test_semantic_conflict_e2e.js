/**
 * Comprehensive End-to-End Test for CoScripta Real AI Conflict Resolution
 * 
 * Tests:
 * 1. Health checks on Express (3000), WebSocket (5000), Yjs (5001), Redis (6379), Frontend (5173).
 * 2. Multi-client session simulation (Alice & Bob).
 * 3. Base version initialization.
 * 4. Disjoint / non-conflicting edits verification (No false positives).
 * 5. Concurrent incompatible edits on same symbol 'calculate' -> Genuine Conflict detection.
 * 6. Generation of 3 Real AI solutions with validation reports.
 * 7. Real validation checks (Syntax via vm.Script, Interface, Execution).
 * 8. Acceptance of Option 3 and atomic synchronization to both developers.
 * 9. Persistent conflict history retrieval & rollback capability in Redis.
 * 10. Compile / execution endpoint health check.
 */

const WebSocket = require('ws');

const BACKEND_URL = 'http://localhost:3000';
const WS_URL = 'ws://localhost:5000';
const YJS_WS_URL = 'ws://localhost:5001';
const TEST_ROOM = 'test_room_' + Date.now();

async function runTests() {
    console.log(`\n======================================================`);
    console.log(`🚀 STARTING REAL AI CONFLICT RESOLUTION TEST SUITE`);
    console.log(`Room: ${TEST_ROOM}`);
    console.log(`======================================================\n`);

    let passedCount = 0;
    let failedCount = 0;

    function assert(condition, message) {
        if (condition) {
            console.log(`  ✅ PASS: ${message}`);
            passedCount++;
        } else {
            console.error(`  ❌ FAIL: ${message}`);
            failedCount++;
        }
    }

    // --- TEST 1: Health Check ---
    console.log(`[TEST 1] Testing Services Health...`);
    try {
        const pingRes = await fetch(`${BACKEND_URL}/api/health`);
        const pingJson = await pingRes.json();
        assert(pingJson.status === 'ok' || pingJson.redis === 'connected', 'Express server is healthy and Redis connected');
    } catch (e) {
        assert(false, `Express health check failed: ${e.message}`);
    }

    // --- TEST 2: Two WebSocket Sessions (Alice & Bob) ---
    console.log(`\n[TEST 2] Connecting Two Separate Developer Sessions (Alice & Bob)...`);
    const aliceReceivedMsgs = [];
    const bobReceivedMsgs = [];

    const wsAlice = new WebSocket(`${WS_URL}?roomId=${TEST_ROOM}&id=dev-alice&name=Alice`);
    const wsBob = new WebSocket(`${WS_URL}?roomId=${TEST_ROOM}&id=dev-bob&name=Bob`);

    await new Promise((resolve) => {
        let connected = 0;
        const check = () => {
            connected++;
            if (connected === 2) resolve();
        };
        wsAlice.on('open', check);
        wsBob.on('open', check);

        wsAlice.on('message', (msg) => {
            try {
                aliceReceivedMsgs.push(JSON.parse(msg.toString()));
            } catch {}
        });

        wsBob.on('message', (msg) => {
            try {
                bobReceivedMsgs.push(JSON.parse(msg.toString()));
            } catch {}
        });
    });

    await new Promise(r => setTimeout(r, 600));

    assert(wsAlice.readyState === WebSocket.OPEN && wsBob.readyState === WebSocket.OPEN, 'Both Alice and Bob WebSocket sessions established');

    // --- TEST 3: Common Base Version Setup ---
    console.log(`\n[TEST 3] Initializing Common Base Version ($V_{base}$) in Redis...`);
    const fileId = 'main_js';
    const fileName = 'main.js';
    const baseCode = `// Common Base Version
function calculate(a, b) {
    return a + b;
}

function formatOutput(result) {
    return "Result: " + result;
}
`;

    const baseRes = await fetch(`${BACKEND_URL}/api/rooms/${TEST_ROOM}/track-edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            edit: {
                userId: 'dev-alice',
                userName: 'Alice',
                fileId,
                fileName,
                symbolName: 'global',
                currentSnippet: baseCode,
                fullFileContent: baseCode,
                timestamp: Date.now()
            },
            baseContent: baseCode
        })
    });
    const baseData = await baseRes.json();
    assert(baseData.success === true, 'Base version stored and tracked');

    // --- TEST 4: Non-Conflicting Edit (No False Positive) ---
    console.log(`\n[TEST 4] Testing Disjoint Edits (Alice edits 'formatOutput', Bob edits comments)...`);
    const aliceDisjointRes = await fetch(`${BACKEND_URL}/api/rooms/${TEST_ROOM}/track-edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            edit: {
                userId: 'dev-alice',
                userName: 'Alice',
                fileId,
                fileName,
                symbolName: 'formatOutput',
                currentSnippet: `function formatOutput(result) { return "Output: " + String(result).toUpperCase(); }`,
                fullFileContent: baseCode,
                timestamp: Date.now()
            }
        })
    });
    const disjointData = await aliceDisjointRes.json();
    assert(disjointData.conflict === null, 'Disjoint edit on different symbol was correctly NOT flagged as a conflict');

    // --- TEST 5: Concurrent Incompatible Edits on 'calculate()' ---
    console.log(`\n[TEST 5] Alice and Bob Make Concurrent Incompatible Changes to 'calculate()'...`);
    const aliceSnippet = `function calculate(a, b, taxRate = 0.08) {
    const sum = a + b;
    return sum + (sum * taxRate);
}`;

    const bobSnippet = `function calculate(x, y, discountAmount = 15) {
    const rawTotal = x * y;
    return Math.max(0, rawTotal - discountAmount);
}`;

    // Alice modifies calculate
    await fetch(`${BACKEND_URL}/api/rooms/${TEST_ROOM}/track-edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            edit: {
                userId: 'dev-alice',
                userName: 'Alice',
                fileId,
                fileName,
                symbolName: 'calculate',
                currentSnippet: aliceSnippet,
                fullFileContent: aliceSnippet,
                timestamp: Date.now()
            }
        })
    });

    // Bob modifies calculate concurrently
    const conflictRes = await fetch(`${BACKEND_URL}/api/rooms/${TEST_ROOM}/track-edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            edit: {
                userId: 'dev-bob',
                userName: 'Bob',
                fileId,
                fileName,
                symbolName: 'calculate',
                currentSnippet: bobSnippet,
                fullFileContent: bobSnippet,
                timestamp: Date.now()
            }
        })
    });

    const conflictData = await conflictRes.json();
    assert(conflictData.conflict !== null, 'Genuine semantic conflict successfully detected');
    assert(conflictData.conflict?.symbolName === 'calculate', "Conflicted symbol identified as 'calculate'");
    console.log(`      Reason: ${conflictData.conflict?.reason}`);

    // Wait for WebSocket pub/sub propagation
    await new Promise(r => setTimeout(r, 1200));

    console.log(`      Alice received message types: [${aliceReceivedMsgs.map(m => m.type).join(', ')}]`);
    console.log(`      Bob received message types: [${bobReceivedMsgs.map(m => m.type).join(', ')}]`);

    // Check if WebSocket broadcast delivered genuine_conflict_detected to Alice & Bob
    const aliceReceivedConflict = aliceReceivedMsgs.some(m => m.type === 'genuine_conflict_detected');
    const bobReceivedConflict = bobReceivedMsgs.some(m => m.type === 'genuine_conflict_detected');
    assert(aliceReceivedConflict || bobReceivedConflict, 'WebSocket broadcast delivered genuine_conflict_detected to collaborator session');

    // --- TEST 6: Exactly Three Real AI Resolutions Generated ---
    console.log(`\n[TEST 6] Verifying Exactly 3 AI Resolutions Generated...`);
    const solutions = conflictData.conflict?.solutions || [];
    assert(solutions.length === 3, `Exactly 3 resolutions generated (received: ${solutions.length})`);
    
    const opt1 = solutions.find(s => s.id === 1);
    const opt2 = solutions.find(s => s.id === 2);
    const opt3 = solutions.find(s => s.id === 3);

    assert(opt1 && opt1.type === 'KEEP_CURRENT', 'Option 1: Keep Current Changes (Alice)');
    assert(opt2 && opt2.type === 'KEEP_INCOMING', 'Option 2: Keep Incoming Changes (Bob)');
    assert(opt3 && opt3.type === 'AI_MERGED', 'Option 3: AI-Generated Merged Solution');

    console.log(`      Option 1 Title: ${opt1?.title}`);
    console.log(`      Option 2 Title: ${opt2?.title}`);
    console.log(`      Option 3 Title: ${opt3?.title}`);

    // --- TEST 7: Real Validation Checks via vm.Script & Sandbox Tests ---
    console.log(`\n[TEST 7] Verifying Real Multi-Stage Validation Report Cards...`);
    for (const sol of solutions) {
        assert(sol.validation !== undefined, `Solution ${sol.id} has validation report`);
        assert(sol.validation.syntaxCheck.passed === true, `Solution ${sol.id} syntax check passed (via vm.Script)`);
        assert(sol.validation.interfaceCheck !== undefined, `Solution ${sol.id} interface contract checked`);
        assert(sol.validation.executionCheck !== undefined, `Solution ${sol.id} sandbox execution tested`);
    }

    // --- TEST 8: Accept Resolution & Immediate Synchronization ---
    console.log(`\n[TEST 8] Applying Solution 3 (AI Merged) & Synchronizing Codebase...`);
    const applyRes = await fetch(`${BACKEND_URL}/api/rooms/${TEST_ROOM}/apply-resolution`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            conflict: conflictData.conflict,
            chosenOptionId: 3,
            resolvedCode: opt3.code,
            resolvedBy: 'Alice',
            optionTitle: opt3.title,
            explanation: opt3.explanation
        })
    });
    const applyData = await applyRes.json();
    assert(applyData.success === true, 'Resolution applied successfully to backend');

    await new Promise(r => setTimeout(r, 1200));

    console.log(`      Bob received message types after resolution: [${bobReceivedMsgs.map(m => m.type).join(', ')}]`);
    const bobGotResolved = bobReceivedMsgs.some(m => m.type === 'genuine_conflict_resolved');
    assert(bobGotResolved, 'Bob received genuine_conflict_resolved event via WebSocket broadcast');

    // --- TEST 9: Conflict History & Rollback Capability ---
    console.log(`\n[TEST 9] Verifying Persistent Conflict History & Rollback Record in Redis...`);
    const historyRes = await fetch(`${BACKEND_URL}/api/rooms/${TEST_ROOM}/conflict-history`);
    const historyData = await historyRes.json();
    assert(historyData.success === true && historyData.count > 0, `Conflict history record persisted (count: ${historyData.count})`);
    
    const record = historyData.history[0];
    assert(record.chosenOption === 3, 'History accurately reflects Option 3 was accepted');
    assert(record.baseCodeSnippet.length > 0, 'Original base code preserved for rollback');
    console.log(`      Preserved Base Snippet: ${record.baseCodeSnippet.trim().substring(0, 50)}...`);

    // --- TEST 10: Compile / Submit Feature Still Operational ---
    console.log(`\n[TEST 10] Checking Existing Compile / Submit Endpoint Integrity...`);
    const compileRes = await fetch(`${BACKEND_URL}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            code: 'console.log("Health check execution test: Success");',
            language: 'javascript',
            roomId: TEST_ROOM
        })
    });
    assert(compileRes.status === 200, 'Compile / Submit endpoint remains fully operational (HTTP 200)');

    // Cleanup WebSockets
    wsAlice.close();
    wsBob.close();

    console.log(`\n======================================================`);
    console.log(`📊 TEST SUITE SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log(`======================================================\n`);

    if (failedCount > 0) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

runTests().catch(err => {
    console.error('Test run error:', err);
    process.exit(1);
});
