import puppeteer from 'puppeteer-core';

async function capture() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-gpu']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  
  await page.goto('http://localhost:3000/3d/golden-oak-signature-burger', { waitUntil: 'networkidle2', timeout: 45000 });
  await new Promise(r => setTimeout(r, 2500));
  await page.screenshot({ path: 'C:/Users/Pyiush Gupta/.gemini/antigravity/brain/22cb5c35-3043-4ba7-a662-5d1b3225baa2/mobile_3d_top_controls_verified.png' });

  await browser.close();
  console.log('3D Top Controls screenshot captured successfully!');
}

capture().catch(err => {
  console.error(err);
  process.exit(1);
});
