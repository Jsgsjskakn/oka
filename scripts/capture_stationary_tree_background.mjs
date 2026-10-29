import puppeteer from 'puppeteer-core';
import path from 'node:path';

const artifactDir = 'C:\\Users\\Pyiush Gupta\\.gemini\\antigravity\\brain\\22cb5c35-3043-4ba7-a662-5d1b3225baa2';
const targetUrl = 'http://localhost:3000';

async function capture() {
  console.log('Launching Chrome for Stationary Tree Background capture...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--use-gl=angle',
      '--window-size=1600,1050'
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1540, height: 960, deviceScaleFactor: 2 });

    await page.evaluateOnNewDocument(() => {
      sessionStorage.setItem('tgo_cinematic_preloader_seen', 'true');
    });

    console.log(`Navigating to ${targetUrl}...`);
    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 35000 });
    await new Promise((r) => setTimeout(r, 2000));

    // Scroll down to the Reservation & Location section
    console.log('Scrolling to Home Reservation & Location section...');
    await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h2, h3'));
      const target = headings.find(h => h.textContent && h.textContent.includes('An Unforgettable Evening Awaits'));
      if (target) {
        target.scrollIntoView({ behavior: 'instant', block: 'center' });
      }
    });

    // Wait 2.5s for canvas animation to settle and shine
    await new Promise((r) => setTimeout(r, 2500));

    const screenshotPath = path.join(artifactDir, 'screenshot_stationary_tree_background.png');
    await page.screenshot({ path: screenshotPath });
    console.log(`Saved screenshot to: ${screenshotPath}`);

  } catch (err) {
    console.error('Error during capture:', err);
    process.exit(1);
  } finally {
    await browser.close();
    console.log('Browser closed cleanly.');
  }
}

capture();
