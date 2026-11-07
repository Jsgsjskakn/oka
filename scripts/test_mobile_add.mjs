import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';

const artifactDir = 'C:\\Users\\Pyiush Gupta\\.gemini\antigravity\\brain\\22cb5c35-3043-4ba7-a662-5d1b3225baa2';

async function testAddButton() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--window-size=400,900']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await page.goto('http://localhost:3000/menu?skip=1', { waitUntil: 'networkidle2', timeout: 35000 });
    await new Promise((r) => setTimeout(r, 1500));

    await page.evaluate(() => {
      window.scrollBy(0, 260);
    });
    await new Promise((r) => setTimeout(r, 600));

    // Click the ADD + button (contains text ADD +)
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const addBtn = btns.find(b => b.textContent && b.textContent.includes('ADD +'));
      if (addBtn) addBtn.click();
    });
    await new Promise((r) => setTimeout(r, 600));

    const shotPath = path.join(artifactDir, 'mobile_menu_2col_added.png');
    await page.screenshot({ path: shotPath });
    console.log(`Saved added screenshot to: ${shotPath}`);
  } finally {
    await browser.close();
  }
}

testAddButton().catch(console.error);
