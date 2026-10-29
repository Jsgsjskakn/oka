import puppeteer from 'puppeteer-core';
import path from 'node:path';

const artifactDir = 'C:\\Users\\Pyiush Gupta\\.gemini\\antigravity\\brain\\22cb5c35-3043-4ba7-a662-5d1b3225baa2';

async function capture() {
  console.log('Launching Chrome to capture interactive Cart Stepper & Quantity Display on Dish Cards...');
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
    await page.setViewport({ width: 1440, height: 1150, deviceScaleFactor: 2 });

    console.log('Navigating to Menu page...');
    await page.goto('http://localhost:3000/menu?skip=1', { waitUntil: 'networkidle2', timeout: 35000 });
    await new Promise((r) => setTimeout(r, 1200));

    // Clear cart in localStorage first for clean starting state
    await page.evaluate(() => {
      localStorage.removeItem('golden-oak-cart');
    });
    await page.reload({ waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 1200));

    // Scroll down so the entire dish cards and their action buttons are perfectly framed
    await page.evaluate(() => {
      window.scrollBy(0, 420);
    });
    await new Promise((r) => setTimeout(r, 600));

    // Shot 1: Initial Menu page with ADD + buttons visible on cards
    const shot1 = path.join(artifactDir, 'screenshot_menu_cards_before_add.png');
    await page.screenshot({ path: shot1 });
    console.log(`Saved Shot 1: ${shot1}`);

    // Click "ADD +" specifically on Chicken Tikka Pizza (exact item from user screenshot)
    console.log('Clicking ADD + on Chicken Tikka Pizza...');
    const clickedAdd = await page.evaluate(() => {
      const titles = Array.from(document.querySelectorAll('a'));
      const tikkaTitle = titles.find(a => a.textContent && a.textContent.trim() === 'Chicken Tikka Pizza');
      if (tikkaTitle) {
        const card = tikkaTitle.closest('.group');
        if (card) {
          const addBtn = card.querySelector('button[aria-label*="dining order"]');
          if (addBtn) {
            addBtn.click();
            return true;
          }
        }
      }
      return false;
    });
    console.log('Clicked Add Chicken Tikka:', clickedAdd);
    await new Promise((r) => setTimeout(r, 1200));

    // Shot 2: Card transformed into luxury Stepper with quantity "1 in bag" and "+ / -" buttons!
    const shot2 = path.join(artifactDir, 'screenshot_menu_card_stepper_1_added.png');
    await page.screenshot({ path: shot2 });
    console.log(`Saved Shot 2: ${shot2}`);

    // Click "+" to increment ("add more") on Chicken Tikka Pizza
    console.log('Clicking + on Chicken Tikka Pizza stepper to add more...');
    const clickedPlus = await page.evaluate(() => {
      const titles = Array.from(document.querySelectorAll('a'));
      const tikkaTitle = titles.find(a => a.textContent && a.textContent.trim() === 'Chicken Tikka Pizza');
      if (tikkaTitle) {
        const card = tikkaTitle.closest('.group');
        if (card) {
          const plusBtn = card.querySelector('button[aria-label*="Add more"]');
          if (plusBtn) {
            plusBtn.click();
            return true;
          }
        }
      }
      return false;
    });
    console.log('Clicked Plus Chicken Tikka:', clickedPlus);
    await new Promise((r) => setTimeout(r, 1200));

    // Shot 3: Card quantity incremented to "2 in bag" with minus button active!
    const shot3 = path.join(artifactDir, 'screenshot_menu_card_stepper_2_added_more.png');
    await page.screenshot({ path: shot3 });
    console.log(`Saved Shot 3: ${shot3}`);

    // Shot 4: Check Home page Curated Signatures
    console.log('Navigating to Home page to verify Curated Signatures sync...');
    await page.goto('http://localhost:3000/?skip=1', { waitUntil: 'networkidle2', timeout: 35000 });
    await new Promise((r) => setTimeout(r, 1500));

    // Scroll to Curated Signatures
    await page.evaluate(() => {
      window.scrollTo(0, 1100);
    });
    await new Promise((r) => setTimeout(r, 800));

    const shot4 = path.join(artifactDir, 'screenshot_home_signatures_stepper_synced.png');
    await page.screenshot({ path: shot4 });
    console.log(`Saved Shot 4: ${shot4}`);

  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    await browser.close();
  }
}

capture();
