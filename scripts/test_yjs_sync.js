const Y = require('yjs');
const { WebsocketProvider } = require('y-websocket');
const WebSocket = require('ws');

const ROOM = 'test_yjs_sync_room_' + Date.now();
const YJS_URL = 'ws://localhost:5001';

async function testYjsSync() {
    console.log(`\n======================================================`);
    console.log(`Testing Yjs Real-Time CRDT Sync Between 2 Collaborators`);
    console.log(`Room: ${ROOM}`);
    console.log(`======================================================\n`);

    const docA = new Y.Doc();
    const docB = new Y.Doc();

    const providerA = new WebsocketProvider(YJS_URL, ROOM, docA, { WebSocketPolyfill: WebSocket });
    const providerB = new WebsocketProvider(YJS_URL, ROOM, docB, { WebSocketPolyfill: WebSocket });

    await new Promise(r => setTimeout(r, 1000));

    const yTextA = docA.getText('file_content_main_js');
    const yTextB = docB.getText('file_content_main_js');

    // Dev A writes base code
    docA.transact(() => {
        yTextA.insert(0, `function calculate(a, b) {\n    return a + b;\n}`);
    });

    await new Promise(r => setTimeout(r, 500));

    console.log(`Developer B received after A's typing:\n${yTextB.toString()}\n`);
    if (yTextB.toString() !== yTextA.toString()) {
        console.error("❌ Dev B failed to sync from Dev A");
        process.exit(1);
    }
    console.log("✅ Yjs CRDT real-time sync verified between Dev A and Dev B!");

    // Dev B simulates applying an AI-resolved merge
    const mergedSolution = `function calculate(a, b, options = {}) {\n    const { taxRate = 0.08, discount = 0 } = options;\n    const subtotal = a + b;\n    return Math.max(0, subtotal + (subtotal * taxRate) - discount);\n}`;
    docB.transact(() => {
        yTextB.delete(0, yTextB.length);
        yTextB.insert(0, mergedSolution);
    });

    await new Promise(r => setTimeout(r, 500));

    console.log(`Developer A received after B's AI resolution apply:\n${yTextA.toString()}\n`);
    if (yTextA.toString() !== mergedSolution) {
        console.error("❌ Dev A failed to receive resolved code from Dev B");
        process.exit(1);
    }
    console.log("✅ Immediate CRDT atomic sync of accepted resolution verified on both sessions!");

    providerA.destroy();
    providerB.destroy();
    docA.destroy();
    docB.destroy();

    console.log("\n🎉 ALL YJS TESTS PASSED!\n");
    process.exit(0);
}

testYjsSync().catch(e => {
    console.error(e);
    process.exit(1);
});
