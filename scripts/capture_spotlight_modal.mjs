import puppeteer from 'puppeteer-core';
import path from 'node:path';

const artifactDir = 'C:\\Users\\Pyiush Gupta\\.gemini\\antigravity\\brain\\22cb5c35-3043-4ba7-a662-5d1b3225baa2';
const targetUrl = 'http://localhost:3000?skip=1';

async function capture() {
  console.log('Launching Chrome to capture upgraded Culinary Spotlight Search Modal...');
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

    console.log(`Navigating to ${targetUrl}...`);
    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 35000 });
    await new Promise((r) => setTimeout(r, 1000));

    // Open Spotlight Modal by pressing Cmd+K / Ctrl+K or clicking the search icon in TopBar
    console.log('Triggering search spotlight modal...');
    await page.keyboard.down('Control');
    await page.keyboard.press('k');
    await page.keyboard.up('Control');
    await new Promise((r) => setTimeout(r, 1200));

    // Shot 1: Modal open with Categories, Enlarged Cravings, and Strikethrough Discounts
    const shot1 = path.join(artifactDir, 'screenshot_spotlight_categories_and_discounts.png');
    await page.screenshot({ path: shot1 });
    console.log(`Saved Shot 1: ${shot1}`);

    // Shot 2: Test Scrolling down the list!
    console.log('Scrolling down the dish list in the search modal...');
    await page.evaluate(() => {
      const list = document.querySelector('[role="region"][aria-label="Dish Search Results List"]');
      if (list) {
        list.scrollTop = 280;
      }
    });
    await new Promise((r) => setTimeout(r, 800));

    const shot2 = path.join(artifactDir, 'screenshot_spotlight_scrolled_list.png');
    await page.screenshot({ path: shot2 });
    console.log(`Saved Shot 2: ${shot2}`);

    // Shot 3: Click "Special Offers" craving chip to show filter in action
    console.log('Clicking Special Offers craving chip...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const offerBtn = buttons.find(b => b.textContent && b.textContent.includes('Special Offers'));
      if (offerBtn) offerBtn.click();
    });
    await new Promise((r) => setTimeout(r, 800));

    const shot3 = path.join(artifactDir, 'screenshot_spotlight_special_offers_filtered.png');
    await page.screenshot({ path: shot3 });
    console.log(`Saved Shot 3: ${shot3}`);

  } catch (err) {
    console.error('Error during spotlight capture:', err);
    process.exit(1);
  } finally {
    await browser.close();
    console.log('Browser closed cleanly.');
  }
}

capture();
