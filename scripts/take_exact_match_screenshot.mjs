import puppeteer from 'puppeteer-core';
import path from 'node:path';
import fs from 'node:fs';

const artifactDir = 'C:\\Users\\Pyiush Gupta\\.gemini\\antigravity\\brain\\22cb5c35-3043-4ba7-a662-5d1b3225baa2';
const targetUrl = 'http://localhost:3000/booking';

async function capture() {
  console.log('Launching Headless Chrome for visual screenshot...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--use-gl=angle',
      '--window-size=1600,1000'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1540, height: 960, deviceScaleFactor: 2 });

  console.log(`Navigating to ${targetUrl}...`);
  await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 35000 });

  console.log('Waiting for 3D canvas and components...');
  await page.waitForSelector('canvas', { timeout: 25000 });
  await new Promise((r) => setTimeout(r, 4500));

  const outPath = path.join(artifactDir, 'screenshot_exact_100_percent_match.png');
  await page.screenshot({ path: outPath });
  console.log(`Saved screenshot to: ${outPath}`);

  await browser.close();
}

capture().catch((err) => {
  console.error('Screenshot capture failed:', err);
  process.exit(1);
});
