const puppeteer = require('puppeteer-core');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const FRONTEND_URL = 'http://localhost:5173/coscriptaa';

const delay = ms => new Promise(r => setTimeout(r, ms));

async function testSync() {
    console.log('--- REPRODUCING DHANU & VYAAS COLLABORATION ---');
    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800']
    });

    try {
        // Page 1: Dhanu
        const pageDhanu = await browser.newPage();
        await pageDhanu.goto(`${FRONTEND_URL}/start`, { waitUntil: 'load' });
        await pageDhanu.waitForSelector('#name');
        await pageDhanu.type('#name', 'dhanu');
        await pageDhanu.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const btn = btns.find(b => b.textContent && b.textContent.includes('Create new room'));
            if (btn) btn.click();
        });
        await pageDhanu.waitForSelector('.monaco-editor', { timeout: 15000 });
        await delay(2000);

        const currentUrl = pageDhanu.url();
        const roomId = currentUrl.split('/code/')[1].split('?')[0].replace(/\/+$/, '');
        console.log(`Dhanu created room: ${roomId}`);

        // Page 2: Vyaas
        const pageVyaas = await browser.newPage();
        await pageVyaas.goto(`${FRONTEND_URL}/${roomId}`, { waitUntil: 'load' });
        await pageVyaas.waitForSelector('#name');
        await pageVyaas.type('#name', 'vyaas');
        await pageVyaas.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const btn = btns.find(b => b.textContent && b.textContent.includes('Join with room code'));
            if (btn) btn.click();
        });
        await pageVyaas.waitForSelector('.monaco-editor', { timeout: 15000 });
        await delay(2000);
        console.log(`Vyaas joined room: ${roomId}`);

        // Get Dhanu's initial editor value
        const dhanuInitial = await pageDhanu.evaluate(() => {
            return window.monaco.editor.getEditors()[0].getValue();
        });
        console.log('Dhanu initial code (first 60 chars):', JSON.stringify(dhanuInitial.slice(0, 60)));

        // Get Vyaas's initial editor value
        const vyaasInitial = await pageVyaas.evaluate(() => {
            return window.monaco.editor.getEditors()[0].getValue();
        });
        console.log('Vyaas initial code (first 60 chars):', JSON.stringify(vyaasInitial.slice(0, 60)));

        // Dhanu types some code
        console.log('\nDhanu typing "// HELLO FROM DHANU"...');
        await pageDhanu.evaluate(() => {
            const editor = window.monaco.editor.getEditors()[0];
            const model = editor.getModel();
            model.applyEdits([{
                range: new window.monaco.Range(1, 1, 1, 1),
                text: '// HELLO FROM DHANU\n'
            }]);
        });

        await delay(1500);

        const dhanuAfterType = await pageDhanu.evaluate(() => {
            return window.monaco.editor.getEditors()[0].getValue();
        });
        const vyaasAfterType = await pageVyaas.evaluate(() => {
            return window.monaco.editor.getEditors()[0].getValue();
        });

        console.log('Dhanu editor content contains "// HELLO FROM DHANU":', dhanuAfterType.includes('// HELLO FROM DHANU'));
        console.log('Vyaas editor content contains "// HELLO FROM DHANU":', vyaasAfterType.includes('// HELLO FROM DHANU'));
        console.log('Vyaas editor full content:\n', vyaasAfterType);

        if (!vyaasAfterType.includes('// HELLO FROM DHANU')) {
            console.log('❌ REPRODUCED: Dhanu typing did NOT appear on Vyaas screen!');
        } else {
            console.log('✅ Changes appeared on Vyaas screen!');
        }

    } finally {
        await browser.close();
    }
}

testSync().catch(console.error);
