const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = 'C:\\Users\\chedu\\.gemini\\antigravity-ide\\brain\\74db6949-efb7-435b-bf49-17d8c68c0e82\\screenshots';
const FRONTEND_URL = 'http://localhost:5173/coscriptaa';

const delay = ms => new Promise(r => setTimeout(r, ms));

async function main() {
    console.log('--- DIAGNOSING REAL UI LANGUAGE FLOW ---');
    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1440, height: 900 });

        // Capture all console logs from the browser
        page.on('console', msg => console.log(`[Browser Console ${msg.type()}]:`, msg.text()));
        page.on('pageerror', err => console.log(`[Browser PageError]:`, err.message));

        console.log('1. Navigating to start page...');
        await page.goto(`${FRONTEND_URL}/start`, { waitUntil: 'load' });
        await page.waitForSelector('#name');
        await page.type('#name', 'Alice Lead');

        console.log('2. Clicking Create new room...');
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const btn = btns.find(b => b.textContent && b.textContent.includes('Create new room'));
            if (btn) btn.click();
        });

        await page.waitForSelector('.monaco-editor', { timeout: 15000 });
        console.log('3. Room loaded. Checking initial state...');
        await delay(1000);

        const initialState = await page.evaluate(() => {
            // Header text
            const spans = Array.from(document.querySelectorAll('span'));
            const fileNameSpan = spans.find(s => s.textContent && (s.textContent.includes('.js') || s.textContent.includes('.py')));
            
            // Dropdown button text
            const btns = Array.from(document.querySelectorAll('button'));
            const langBtn = btns.find(b => b.textContent && (b.textContent.includes('JavaScript') || b.textContent.includes('Python')));

            return {
                fileNameInHeader: fileNameSpan ? fileNameSpan.textContent.trim() : 'NOT_FOUND',
                dropdownText: langBtn ? langBtn.textContent.trim() : 'NOT_FOUND',
            };
        });
        console.log('Initial State in UI:', initialState);

        console.log('4. Clicking Language Dropdown button with native Puppeteer mouse...');
        // Find the language dropdown button handle
        const buttons = await page.$$('button');
        let langBtnHandle = null;
        for (const btn of buttons) {
            const text = await page.evaluate(el => el.textContent, btn);
            if (text && (text.includes('JavaScript') || text.includes('Python'))) {
                langBtnHandle = btn;
                break;
            }
        }

        if (!langBtnHandle) throw new Error('Could not find Language Dropdown button');
        await langBtnHandle.click();
        console.log('Clicked dropdown trigger via mouse!');
        await delay(800);

        console.log('5. Clicking "Python" in the Radix menu items...');
        await page.waitForSelector('[role="menuitem"]', { timeout: 5000 });
        const menuItems = await page.$$('[role="menuitem"]');
        let pyItemHandle = null;
        for (const item of menuItems) {
            const text = await page.evaluate(el => el.textContent, item);
            console.log('Found menu item:', text?.trim());
            if (text && text.trim().includes('Python')) {
                pyItemHandle = item;
                break;
            }
        }

        if (!pyItemHandle) throw new Error('Could not find Python in menu items');
        await pyItemHandle.click();
        console.log('Clicked Python item via mouse!');
        await delay(1200);

        const stateAfterPy = await page.evaluate(() => {
            const spans = Array.from(document.querySelectorAll('span'));
            const fileNameSpan = spans.find(s => s.textContent && (s.textContent.includes('.js') || s.textContent.includes('.py')));
            const btns = Array.from(document.querySelectorAll('button'));
            const langBtn = btns.find(b => b.textContent && (b.textContent.includes('JavaScript') || b.textContent.includes('Python')));

            return {
                fileNameInHeader: fileNameSpan ? fileNameSpan.textContent.trim() : 'NOT_FOUND',
                dropdownText: langBtn ? langBtn.textContent.trim() : 'NOT_FOUND',
            };
        });
        console.log('State After Selecting Python:', stateAfterPy);

        // Click AI Conflict Resolver
        console.log('6. Clicking AI Conflict Resolver button...');
        const clickedConflictBtn = await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const btn = btns.find(b => b.textContent && (b.textContent.includes('AI Conflict Resolver') || b.textContent.includes('AI Conflict Active') || b.textContent.includes('Resolve with AI')));
            if (btn) {
                btn.click();
                return true;
            }
            return false;
        });
        console.log('Clicked Conflict button:', clickedConflictBtn);
        await delay(2000);

        // Check if modal is open and inspect Option 3 code
        const modalInfo = await page.evaluate(() => {
            const modal = document.querySelector('[role="dialog"]') || document.querySelector('.fixed.inset-0');
            const codeEl = document.querySelector('[data-testid="selected-option-code"] code') || document.querySelector('pre code');
            return {
                modalPresent: !!modal,
                option3Code: codeEl ? codeEl.textContent.trim() : 'NO_CODE_FOUND'
            };
        });
        console.log('Modal Info after clicking AI Conflict Resolver:');
        console.log(modalInfo);

        const screenshotPath = path.join(SCREENSHOT_DIR, 'diagnose_real_ui.png');
        await page.screenshot({ path: screenshotPath });
        console.log('Screenshot saved to:', screenshotPath);

    } finally {
        await browser.close();
    }
}

main().catch(console.error);
