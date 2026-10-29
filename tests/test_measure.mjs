import puppeteer from 'puppeteer-core';
import path from 'node:path';

const artifactDir = 'C:\\Users\\Pyiush Gupta\\.gemini\\antigravity\\brain\\22cb5c35-3043-4ba7-a662-5d1b3225baa2';

async function testScreenshots() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--use-gl=angle',
      '--window-size=1440,900'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.goto('http://localhost:3000/booking', { waitUntil: 'networkidle2', timeout: 30000 });

  // Wait for 3D floorplan and canvas
  await page.waitForSelector('canvas', { timeout: 15000 });
  // Wait extra 3 seconds for 3D textures, shaders, and animations to settle
  await new Promise(r => setTimeout(r, 4000));

  const bounds = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('View & Select Table in Fullscreen'));
    const canvas = document.querySelector('canvas');
    const card = btn ? btn.closest('div.rounded-3xl') || btn.parentElement : null;
    return {
      windowHeight: window.innerHeight,
      scrollY: window.scrollY,
      canvasRect: canvas ? canvas.getBoundingClientRect() : null,
      btnRect: btn ? btn.getBoundingClientRect() : null,
      cardRect: card ? card.getBoundingClientRect() : null,
    };
  });
  console.log('Bounds before any action:', JSON.stringify(bounds, null, 2));

  // Let's capture the page as-is at scrollY = 0
  await page.screenshot({
    path: path.join(artifactDir, 'test_initial_page.png'),
    fullPage: false
  });

  await browser.close();
}

testScreenshots().catch(console.error);
