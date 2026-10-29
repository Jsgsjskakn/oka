import puppeteer from 'puppeteer-core';
import path from 'node:path';

const artifactDir = 'C:\\Users\\Pyiush Gupta\\.gemini\\antigravity\\brain\\22cb5c35-3043-4ba7-a662-5d1b3225baa2';

async function capture() {
  console.log('Launching Chrome to capture Our Story page with Stationary Golden Oak Tree Background...');
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
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

    console.log('Navigating to Our Story (/about)...');
    await page.goto('http://localhost:3000/about?skip=1', { waitUntil: 'networkidle2', timeout: 35000 });
    await new Promise((r) => setTimeout(r, 1500));

    // Shot 1: Top of Our Story page with the Golden Oak tree emblem glowing in the background
    const shot1 = path.join(artifactDir, 'screenshot_our_story_tree_background.png');
    await page.screenshot({ path: shot1 });
    console.log(`Saved Shot 1: ${shot1}`);

    // Shot 2: Scroll down to Our Philosophy and the two feature cards
    console.log('Scrolling down Our Story page...');
    await page.evaluate(() => {
      window.scrollBy(0, 360);
    });
    await new Promise((r) => setTimeout(r, 1000));

    const shot2 = path.join(artifactDir, 'screenshot_our_story_scrolled_philosophy.png');
    await page.screenshot({ path: shot2 });
    console.log(`Saved Shot 2: ${shot2}`);

  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    await browser.close();
  }
}

capture();
