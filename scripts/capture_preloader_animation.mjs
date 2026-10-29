import puppeteer from 'puppeteer-core';
import path from 'node:path';

const artifactDir = 'C:\\Users\\Pyiush Gupta\\.gemini\\antigravity\\brain\\22cb5c35-3043-4ba7-a662-5d1b3225baa2';
const targetUrl = 'http://localhost:3000';

async function capture() {
  console.log('Launching Chrome to test preloader reload & capture enlarged tree...');
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

    console.log(`Initial navigation to ${targetUrl}...`);
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 35000 });

    // Wait 3.5s into the 8s animation when the 2,200 particles converge into the grand tree
    console.log('Waiting for convergence phase (3.5s)...');
    await new Promise((r) => setTimeout(r, 3500));

    const shot1 = path.join(artifactDir, 'screenshot_preloader_enlarged_tree.png');
    await page.screenshot({ path: shot1 });
    console.log(`Saved preloader screenshot: ${shot1}`);

    // Now TEST REFRESH: Reload the page to verify preloader appears on reload!
    console.log('Reloading page to verify preloader displays on refresh...');
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 35000 });

    // Wait 3.2s on reload
    await new Promise((r) => setTimeout(r, 3200));

    const shot2 = path.join(artifactDir, 'screenshot_preloader_on_reload.png');
    await page.screenshot({ path: shot2 });
    console.log(`Saved reload test screenshot: ${shot2}`);

  } catch (err) {
    console.error('Error during preloader capture:', err);
    process.exit(1);
  } finally {
    await browser.close();
    console.log('Browser closed cleanly.');
  }
}

capture();
