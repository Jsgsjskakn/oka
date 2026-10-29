import puppeteer from 'puppeteer-core';

async function inspectLayout() {
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

  await page.waitForSelector('canvas', { timeout: 15000 });

  const info = await page.evaluate(() => {
    const toObj = (r) => r ? ({ top: r.top, bottom: r.bottom, left: r.left, right: r.right, width: r.width, height: r.height }) : null;
    const canvas = document.querySelector('canvas');
    const fullscreenBtn = document.querySelector('button[aria-label*="Fullscreen"]');
    const rightCol = document.querySelector('aside');
    return {
      windowHeight: window.innerHeight,
      scrollY: window.scrollY,
      canvasRect: toObj(canvas?.getBoundingClientRect()),
      fullscreenBtnRect: toObj(fullscreenBtn?.getBoundingClientRect()),
      rightColRect: toObj(rightCol?.getBoundingClientRect())
    };
  });
  console.log('Layout info:', JSON.stringify(info, null, 2));

  await browser.close();
}

inspectLayout().catch(console.error);
