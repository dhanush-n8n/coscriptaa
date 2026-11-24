const puppeteer = require('puppeteer-core');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const FRONTEND_URL = 'http://localhost:5173/coscriptaa';

const delay = ms => new Promise(r => setTimeout(r, ms));

async function testSync() {
    console.log('--- INSPECTING CONSOLE ERRORS ON DHANU & VYAAS PAGES ---');
    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800']
    });

    try {
        const pageDhanu = await browser.newPage();
        pageDhanu.on('console', msg => console.log(`[Dhanu Console ${msg.type()}]:`, msg.text()));
        pageDhanu.on('pageerror', err => console.error(`[Dhanu PageError]:`, err.message));

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

        const pageVyaas = await browser.newPage();
        pageVyaas.on('console', msg => console.log(`[Vyaas Console ${msg.type()}]:`, msg.text()));
        pageVyaas.on('pageerror', err => console.error(`[Vyaas PageError]:`, err.message));

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

        console.log('Both users in room successfully');
    } finally {
        await browser.close();
    }
}

testSync().catch(console.error);
