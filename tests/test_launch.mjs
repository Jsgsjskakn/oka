import puppeteer from 'puppeteer-core';

async function testLaunch() {
  console.log('Testing chrome launch...');
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
  console.log('Browser launched successfully!');
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000/booking', { waitUntil: 'networkidle2', timeout: 30000 });
  console.log('Navigated to /booking, title:', await page.title());
  await browser.close();
  console.log('Browser closed cleanly.');
}

testLaunch().catch(err => {
  console.error('Launch test failed:', err);
  process.exit(1);
});
