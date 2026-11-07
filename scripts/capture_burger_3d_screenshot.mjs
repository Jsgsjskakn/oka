import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

function resolveChromeExecutable() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
  ];
  for (const c of candidates) {
    if (c && fs.existsSync(c)) return c;
  }
  return null;
}

const chrome = resolveChromeExecutable();
if (!chrome) {
  console.log('Chrome not found, skipping screenshot');
  process.exit(0);
}

const outShot = path.resolve('public/burger-3d-render.png');

// Use headless chrome with --screenshot
const args = [
  '--headless=new',
  '--disable-gpu-sandbox',
  '--enable-webgl',
  '--ignore-gpu-blocklist',
  '--window-size=1280,800',
  '--virtual-time-budget=6000',
  `--screenshot=${outShot}`,
  'http://localhost:3000/3d/golden-oak-signature-burger'
];

console.log('Running Chrome capture on /3d/golden-oak-signature-burger...');
const proc = spawn(chrome, args);
proc.on('close', (code) => {
  console.log(`Chrome closed with code ${code}. Screenshot exists: ${fs.existsSync(outShot)}`);
  if (fs.existsSync(outShot)) {
    console.log(`Screenshot size: ${fs.statSync(outShot).size} bytes`);
  }
});
