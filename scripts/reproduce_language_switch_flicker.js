const puppeteer = require('puppeteer-core');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const FRONTEND_URL = 'http://localhost:5173/coscriptaa';

const delay = ms => new Promise(r => setTimeout(r, ms));

async function testLanguageSwitch() {
    console.log('--- TESTING LANGUAGE SWITCHING & FLICKERING ---');
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

        // Helper to get dropdown text
        const getLang = async (page) => {
            return await page.evaluate(() => {
                const btns = Array.from(document.querySelectorAll('button'));
                const btn = btns.find(b => ['JavaScript', 'Python', 'C++', 'Go', 'Select Language'].some(l => b.textContent?.includes(l)));
                return btn ? btn.textContent.trim() : 'NOT_FOUND';
            });
        };

        console.log('Initial Dhanu Language Dropdown:', await getLang(pageDhanu));
        console.log('Initial Vyaas Language Dropdown:', await getLang(pageVyaas));

        // Dhanu switches to Python
        console.log('\nDhanu clicking Language dropdown and selecting Python...');
        await pageDhanu.evaluate(async () => {
            const btns = Array.from(document.querySelectorAll('button'));
            const dropdownBtn = btns.find(b => ['JavaScript', 'Python', 'C++', 'Go', 'Select Language'].some(l => b.textContent?.includes(l)));
            if (dropdownBtn) dropdownBtn.click();
        });
        await delay(300);

        await pageDhanu.evaluate(async () => {
            const items = Array.from(document.querySelectorAll('[role="menuitem"], div'));
            const pyItem = items.find(el => el.textContent?.trim() === 'Python');
            if (pyItem) pyItem.click();
        });

        // Track language over next 3 seconds to see if it flickers or switches back!
        console.log('\nSampling languages over 3 seconds...');
        for (let i = 1; i <= 6; i++) {
            await delay(500);
            const dLang = await getLang(pageDhanu);
            const vLang = await getLang(pageVyaas);
            console.log(`[T=${i*500}ms] Dhanu: ${dLang} | Vyaas: ${vLang}`);
        }

    } finally {
        await browser.close();
    }
}

testLanguageSwitch().catch(console.error);
