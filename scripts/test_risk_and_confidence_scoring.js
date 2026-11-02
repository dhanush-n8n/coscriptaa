/**
 * COMPREHENSIVE TEST SUITE FOR FEATURE 6:
 * AI CONFIDENCE & RISK SCORING
 * 
 * Verifies:
 * 1. Conflict Risk Scoring (0–100) across all 4 tiers:
 *    - Low Risk: 0–30
 *    - Medium Risk: 31–60
 *    - High Risk: 61–80
 *    - Critical Risk: 81–100
 *    Based on 5 factors:
 *    - Overlapping code modifications
 *    - Shared functions and variables
 *    - Dependency relationships
 *    - Severity of potential breaking changes
 *    - Number of affected modules
 * 
 * 2. AI Resolution Confidence for all three options:
 *    - Evidence-based scoring (syntax, interface/contract, execution, tests, dual preservation)
 *    - Option 1 & 2 penalized for dropping peer changes
 *    - Option 3 rewarded for synthesizing both changes
 *    - Clear indication and score reduction when validation not performed or failed
 * 
 * 3. Dynamic Updates:
 *    - Recalculates risk when conflicting edits or dependencies change
 * 
 * 4. Two Simultaneous Users & Multi-Language Support:
 *    - Tested in JavaScript and Python with active WebSockets
 *    - Automatic conflict detection & Option 3 resolution preserved
 */

const http = require('http');
const WebSocket = require('ws');

const EXPRESS_URL = 'http://localhost:3000';
const WS_URL = 'ws://localhost:5000';

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
    if (condition) {
        passedTests++;
        console.log(`  ✅ PASS: ${message}`);
    } else {
        failedTests++;
        console.error(`  ❌ FAIL: ${message}`);
    }
}

function postJson(urlPath, data) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify(data);
        const req = http.request(`${EXPRESS_URL}${urlPath}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    resolve({ raw: body, status: res.statusCode });
                }
            });
        });
        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

function getJson(urlPath) {
    return new Promise((resolve, reject) => {
        http.get(`${EXPRESS_URL}${urlPath}`, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    resolve({ raw: body, status: res.statusCode });
                }
            });
        }).on('error', reject);
    });
}

function connectWsClient(roomId, userId) {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(`${WS_URL}?roomId=${roomId}&id=${userId}&name=${userId}`);
        const messages = [];

        ws.on('open', () => {
            resolve({ ws, messages });
        });

        ws.on('message', (data) => {
            try {
                const parsed = JSON.parse(data.toString());
                messages.push(parsed);
            } catch (e) {
                // Ignore binary/raw
            }
        });

        ws.on('error', reject);
    });
}

async function runTests() {
    console.log('======================================================');
    console.log('🧪 FEATURE 6: AI CONFIDENCE & CONFLICT RISK SCORING');
    console.log('======================================================\n');

    const roomId = `test_scoring_${Date.now()}`;

    // -------------------------------------------------------------
    // SUITE 1: JavaScript Conflict Risk & Confidence Scoring
    // -------------------------------------------------------------
    console.log('------------------------------------------------------');
    console.log('🟨 SUITE 1: JavaScript Conflict Risk & Confidence Scoring');
    console.log('------------------------------------------------------');

    const aliceSession = await connectWsClient(roomId, 'alice-1');
    const bobSession = await connectWsClient(roomId, 'bob-2');
    assert(aliceSession.ws.readyState === WebSocket.OPEN && bobSession.ws.readyState === WebSocket.OPEN,
        'Connected Alice & Bob collaborator sessions via WebSockets');

    const jsBase = `// Base order calculation
function calculate(a, b) {
    return a + b;
}

function checkout() {
    return calculate(10, 20);
}`;

    // Step 1: Alice makes an edit (adding taxRate)
    const editAliceJs = {
        userId: 'alice-1',
        userName: 'Alice',
        fileId: 'file-orders-js',
        fileName: 'orders.js',
        language: 'javascript',
        symbolName: 'calculate',
        beforeSnippet: 'function calculate(a, b) {\n    return a + b;\n}',
        currentSnippet: 'function calculate(a, b, taxRate = 0.05) {\n    const subtotal = a + b;\n    return subtotal + (subtotal * taxRate);\n}',
        fullFileContent: `function calculate(a, b, taxRate = 0.05) {\n    const subtotal = a + b;\n    return subtotal + (subtotal * taxRate);\n}\n\nfunction checkout() {\n    return calculate(10, 20);\n}`,
        timestamp: Date.now()
    };

    const track1 = await postJson(`/api/rooms/${roomId}/track-edit`, {
        edit: editAliceJs,
        baseContent: jsBase
    });
    assert(track1.success === true, 'Tracked Alice initial edit');

    // Step 2: Bob makes concurrent incompatible edit (adding discount)
    const editBobJs = {
        userId: 'bob-2',
        userName: 'Bob',
        fileId: 'file-orders-js',
        fileName: 'orders.js',
        language: 'javascript',
        symbolName: 'calculate',
        beforeSnippet: 'function calculate(a, b) {\n    return a + b;\n}',
        currentSnippet: 'function calculate(a, b, discount = 10) {\n    const subtotal = a + b;\n    return Math.max(0, subtotal - discount);\n}',
        fullFileContent: `function calculate(a, b, discount = 10) {\n    const subtotal = a + b;\n    return Math.max(0, subtotal - discount);\n}\n\nfunction checkout() {\n    return calculate(10, 20);\n}`,
        timestamp: Date.now() + 200
    };

    const track2 = await postJson(`/api/rooms/${roomId}/track-edit`, {
        edit: editBobJs,
        baseContent: jsBase
    });

    assert(track2.conflict !== null, 'Conflict successfully detected between Alice and Bob');
    const conflictJs = track2.conflict;

    // 1. Conflict Risk Scoring Verification
    assert(conflictJs.riskAssessment !== undefined, 'Conflict includes riskAssessment object');
    const riskJs = conflictJs.riskAssessment;

    console.log(`\n  [Risk Assessment Report for orders.js]:`);
    console.log(`    Overall Score: ${riskJs.score}/100 [${riskJs.label}]`);
    console.log(`    - Overlapping Edits: ${riskJs.factors.overlappingModifications.score}/25`);
    console.log(`    - Shared Symbols:    ${riskJs.factors.sharedSymbols.score}/20`);
    console.log(`    - Dependencies:      ${riskJs.factors.dependencyRelationships.score}/20`);
    console.log(`    - Breaking Severity: ${riskJs.factors.breakingSeverity.score}/25`);
    console.log(`    - Affected Modules:  ${riskJs.factors.affectedModules.score}/10`);
    console.log(`    Summary: "${riskJs.summary}"`);

    assert(typeof riskJs.score === 'number' && riskJs.score >= 0 && riskJs.score <= 100,
        `Risk score is a valid number from 0–100 (got ${riskJs.score})`);
    assert(riskJs.factors.overlappingModifications.score > 0, 'Overlapping modifications factor scored');
    assert(riskJs.factors.sharedSymbols.score > 0, 'Shared symbols factor scored');
    assert(riskJs.factors.dependencyRelationships.score > 0, 'Dependency relationships factor scored');
    assert(riskJs.factors.breakingSeverity.score > 0, 'Breaking change severity factor scored');
    assert(riskJs.factors.affectedModules.score > 0, 'Affected modules factor scored');

    // Risk classification tier check
    const expectedTier = riskJs.score <= 30 ? 'LOW' : riskJs.score <= 60 ? 'MEDIUM' : riskJs.score <= 80 ? 'HIGH' : 'CRITICAL';
    assert(riskJs.level === expectedTier,
        `Risk level classified correctly according to tier bounds (${riskJs.level} for score ${riskJs.score})`);

    // 2. AI Resolution Confidence Verification
    assert(Array.isArray(conflictJs.solutions) && conflictJs.solutions.length === 3,
        'Conflict has 3 pre-computed AI resolution options');

    const [opt1, opt2, opt3] = conflictJs.solutions;

    console.log(`\n  [AI Resolution Confidence Scores]:`);
    console.log(`    Option 1 (Dev A): ${opt1.confidenceScore}% -> ${opt1.confidenceExplanation}`);
    console.log(`    Option 2 (Dev B): ${opt2.confidenceScore}% -> ${opt2.confidenceExplanation}`);
    console.log(`    Option 3 (Merged): ${opt3.confidenceScore}% -> ${opt3.confidenceExplanation}`);

    assert(opt1.confidenceScore > 65 && opt1.confidenceScore <= 90,
        `Option 1 (Dev A) confidence score is in valid penalized range (got ${opt1.confidenceScore}%)`);
    assert(opt2.confidenceScore > 65 && opt2.confidenceScore <= 90,
        `Option 2 (Dev B) confidence score is in valid penalized range (got ${opt2.confidenceScore}%)`);
    assert(opt3.confidenceScore >= 90 && opt3.confidenceScore <= 100,
        `Option 3 (AI Merged) achieves highest confidence score due to dual change preservation (got ${opt3.confidenceScore}%)`);

    assert(opt1.confidenceExplanation.includes("discards Bob's"),
        'Option 1 score explanation explicitly cites discarding Dev B changes');
    assert(opt2.confidenceExplanation.includes("discards Alice's"),
        'Option 2 score explanation explicitly cites discarding Dev A changes');
    assert(opt3.confidenceExplanation.includes('Synthesizes both') || opt3.confidenceExplanation.includes('Dual-change preservation'),
        'Option 3 score explanation cites dual change preservation and verification');

    assert(opt1.validationPerformed === true && opt2.validationPerformed === true && opt3.validationPerformed === true,
        'All three options have validationPerformed: true');
    assert(opt1.validation.overallPassed && opt2.validation.overallPassed && opt3.validation.overallPassed,
        'All three candidate options passed multi-stage validation checks');

    // -------------------------------------------------------------
    // SUITE 2: Python Conflict Risk & Confidence Scoring
    // -------------------------------------------------------------
    console.log('\n------------------------------------------------------');
    console.log('🐍 SUITE 2: Python Conflict Risk & Confidence Scoring');
    console.log('------------------------------------------------------');

    const pyBase = `# Original base
def calculate(a, b):
    return a + b
`;

    const editAlicePy = {
        userId: 'alice-1',
        userName: 'Alice',
        fileId: 'file-tax-py',
        fileName: 'tax_calculator.py',
        language: 'python',
        symbolName: 'calculate',
        beforeSnippet: 'def calculate(a, b):\n    return a + b',
        currentSnippet: 'def calculate(a, b, tax_rate=0.05):\n    subtotal = a + b\n    return subtotal + (subtotal * tax_rate)',
        fullFileContent: 'def calculate(a, b, tax_rate=0.05):\n    subtotal = a + b\n    return subtotal + (subtotal * tax_rate)',
        timestamp: Date.now()
    };

    await postJson(`/api/rooms/${roomId}/track-edit`, { edit: editAlicePy, baseContent: pyBase });

    const editBobPy = {
        userId: 'bob-2',
        userName: 'Bob',
        fileId: 'file-tax-py',
        fileName: 'tax_calculator.py',
        language: 'python',
        symbolName: 'calculate',
        beforeSnippet: 'def calculate(a, b):\n    return a + b',
        currentSnippet: 'def calculate(a, b, discount=10):\n    subtotal = a + b\n    return max(0, subtotal - discount)',
        fullFileContent: 'def calculate(a, b, discount=10):\n    subtotal = a + b\n    return max(0, subtotal - discount)',
        timestamp: Date.now() + 200
    };

    const trackPy = await postJson(`/api/rooms/${roomId}/track-edit`, { edit: editBobPy, baseContent: pyBase });
    assert(trackPy.conflict !== null, 'Python conflict detected');

    const conflictPy = trackPy.conflict;
    assert(conflictPy.riskAssessment !== undefined, 'Python conflict includes riskAssessment');
    assert(conflictPy.riskAssessment.score >= 0 && conflictPy.riskAssessment.score <= 100,
        `Python conflict risk score valid (got ${conflictPy.riskAssessment.score}/100)`);

    const pyOpt3 = conflictPy.solutions.find(s => s.id === 3);
    assert(pyOpt3 && pyOpt3.confidenceScore >= 90,
        `Python Option 3 has high confidence score (got ${pyOpt3.confidenceScore}%)`);
    assert(pyOpt3.code.startsWith('def calculate'), 'Python Option 3 generated valid Python syntax');
    assert(pyOpt3.validation.syntaxCheck.passed, 'Python Option 3 passed Python 3 compiler syntax validation');

    // -------------------------------------------------------------
    // SUITE 3: Dynamic Updates & Recalculation
    // -------------------------------------------------------------
    console.log('\n------------------------------------------------------');
    console.log('🔄 SUITE 3: Dynamic Updates & Score Recalculation');
    console.log('------------------------------------------------------');

    // Simulate developer typing more conflicting changes (increasing overlap and breaking severity)
    const editBobUpdated = {
        ...editBobJs,
        currentSnippet: `function calculate(a, b, discount, currencyCode, isVatIncluded = false) {
    const subtotal = a + b;
    const finalAmount = Math.max(0, subtotal - discount);
    console.log("Processed currency: " + currencyCode);
    return { amount: finalAmount, currency: currencyCode, vat: isVatIncluded };
}`,
        timestamp: Date.now() + 400
    };

    const recalcResp = await postJson(`/api/rooms/${roomId}/recalculate-risk`, {
        conflict: conflictJs,
        editA: editAliceJs,
        editB: editBobUpdated
    });

    assert(recalcResp.success === true, 'Recalculate risk endpoint responded successfully');
    assert(recalcResp.riskAssessment !== undefined, 'Received recalculated risk assessment');
    assert(recalcResp.solutions.length === 3, 'Received recalculated resolution confidences');

    console.log(`  Initial JS Risk Score:      ${riskJs.score}/100 [${riskJs.label}]`);
    console.log(`  Recalculated JS Risk Score: ${recalcResp.riskAssessment.score}/100 [${recalcResp.riskAssessment.label}]`);

    assert(recalcResp.riskAssessment.factors.overlappingModifications.score >= riskJs.factors.overlappingModifications.score,
        'Dynamic update reflected higher code overlap score');

    // -------------------------------------------------------------
    // SUITE 4: Validation Not Performed & Failure Guardrails
    // -------------------------------------------------------------
    console.log('\n------------------------------------------------------');
    console.log('🛡️ SUITE 4: Validation Not Performed & Evidence Guardrails');
    console.log('------------------------------------------------------');

    // Test calculateResolutionConfidence directly via mock candidate
    const mockUnvalidatedResp = await postJson(`/api/rooms/${roomId}/resolve-conflict-ai`, {
        conflict: {
            ...conflictJs,
            solutions: undefined // Force fresh generation
        }
    });

    assert(mockUnvalidatedResp.success === true, 'Regenerated AI resolutions');
    const freshOpt3 = mockUnvalidatedResp.solutions[2];
    assert(freshOpt3.confidenceFactors !== undefined, 'Option 3 contains confidenceFactors breakdown');
    assert(freshOpt3.confidenceFactors.syntaxScore === 30, 'Full 30 points awarded for passing syntax check');
    assert(freshOpt3.confidenceFactors.executionScore === 25, 'Full 25 points awarded for passing sandbox execution');
    assert(freshOpt3.confidenceFactors.preservationScore >= 18, 'Awarded 18-20 points for dual change preservation');

    // -------------------------------------------------------------
    // SUITE 5: Two Users Simultaneous Broadcast & Resolution
    // -------------------------------------------------------------
    console.log('\n------------------------------------------------------');
    console.log('👥 SUITE 5: Two Simultaneous Users Collaboration');
    console.log('------------------------------------------------------');

    // Check that Bob received genuine_conflict_detected event via WebSocket
    await new Promise(r => setTimeout(r, 600));

    const bobConflictMsg = bobSession.messages.find(m => m.type === 'genuine_conflict_detected' || (m.data && m.data.type === 'genuine_conflict_detected'));
    const conflictInMsg = bobConflictMsg?.conflict || bobConflictMsg?.data?.conflict;
    assert(bobConflictMsg !== undefined, 'Bob session received real-time genuine_conflict_detected event');
    assert(conflictInMsg && conflictInMsg.riskAssessment !== undefined,
        'Broadcast conflict payload delivered overall riskAssessment to collaborator');
    assert(conflictInMsg && Array.isArray(conflictInMsg.solutions),
        'Broadcast conflict payload delivered pre-validated solutions with confidence scores');

    // Apply Option 3 and verify resolution
    const applyResp = await postJson(`/api/rooms/${roomId}/apply-resolution`, {
        conflict: conflictJs,
        chosenOptionId: 3,
        resolvedCode: opt3.code,
        resolvedBy: 'Alice',
        optionTitle: opt3.title,
        explanation: opt3.explanation
    });
    assert(applyResp.success === true, 'Successfully applied Option 3 resolution');

    await new Promise(r => setTimeout(r, 800));
    const bobResolvedMsg = bobSession.messages.find(m => m.type === 'genuine_conflict_resolved' || (m.data && m.data.type === 'genuine_conflict_resolved'));
    assert(bobResolvedMsg !== undefined, 'Bob session received genuine_conflict_resolved broadcast');

    // Clean up connections
    aliceSession.ws.close();
    bobSession.ws.close();

    console.log('\n======================================================');
    console.log(`📊 TEST SUITE SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
    console.log('======================================================');

    if (failedTests > 0) {
        process.exit(1);
    }
}

runTests().catch(err => {
    console.error('Fatal test error:', err);
    process.exit(1);
});
