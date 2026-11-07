import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';

const artifactDir = 'C:\\Users\\Pyiush Gupta\\.gemini\\antigravity\\brain\\22cb5c35-3043-4ba7-a662-5d1b3225baa2';

async function capture() {
  console.log('Launching headless Chrome for Mobile 2-Column Menu snapshot...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--window-size=400,900'
    ]
  });

  try {
    const page = await browser.newPage();
    // Typical mobile screen (390 x 844, 2x DPR)
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

    console.log('Navigating to http://localhost:3000/menu?skip=1 ...');
    await page.goto('http://localhost:3000/menu?skip=1', { waitUntil: 'networkidle2', timeout: 35000 });
    await new Promise((r) => setTimeout(r, 2000));

    // Scroll down slightly so dishes are in full view
    await page.evaluate(() => {
      window.scrollBy(0, 260);
    });
    await new Promise((r) => setTimeout(r, 1000));

    const shotPath = path.join(artifactDir, 'mobile_menu_2col_verified.png');
    await page.screenshot({ path: shotPath });
    console.log(`Saved mobile screenshot to: ${shotPath} (${fs.statSync(shotPath).size} bytes)`);
  } finally {
    await browser.close();
  }
}

capture().catch(console.error);
