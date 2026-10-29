import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const rootDir = 'C:/Users/Pyiush Gupta/.gemini/antigravity/scratch/the-golden-oak';
const stagingDir = path.join(rootDir, 'staging-export');
const zipOutput = path.join(rootDir, 'the-golden-oak-export.zip');

if (fs.existsSync(stagingDir)) {
  fs.rmSync(stagingDir, { recursive: true, force: true });
}
fs.mkdirSync(stagingDir, { recursive: true });

// Items to copy
const copyItems = [
  { src: 'src', dest: 'src' },
  { src: 'convex', dest: 'convex' },
  { src: 'tests', dest: 'tests' },
  { src: 'public', dest: 'public' },
  { src: 'docs', dest: 'docs' },
  { src: 'supabase/migrations', dest: 'supabase/migrations' },
  { src: 'package.json', dest: 'package.json' },
  { src: 'package-lock.json', dest: 'package-lock.json' },
  { src: 'next.config.ts', dest: 'next.config.ts' },
  { src: 'tsconfig.json', dest: 'tsconfig.json' },
  { src: 'postcss.config.mjs', dest: 'postcss.config.mjs' },
  { src: 'components.json', dest: 'components.json' },
  { src: 'eslint.config.mjs', dest: 'eslint.config.mjs' },
  { src: 'README.md', dest: 'README.md' },
  { src: 'CLAUDE.md', dest: 'CLAUDE.md' },
  { src: 'AGENTS.md', dest: 'AGENTS.md' }
];

function copyRecursive(srcPath, destPath) {
  const stat = fs.statSync(srcPath);
  if (stat.isDirectory()) {
    fs.mkdirSync(destPath, { recursive: true });
    for (const item of fs.readdirSync(srcPath)) {
      copyRecursive(path.join(srcPath, item), path.join(destPath, item));
    }
  } else {
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.copyFileSync(srcPath, destPath);
  }
}

console.log('Copying allowed files to staging directory...');
for (const item of copyItems) {
  const fullSrc = path.join(rootDir, item.src);
  const fullDest = path.join(stagingDir, item.dest);
  if (fs.existsSync(fullSrc)) {
    copyRecursive(fullSrc, fullDest);
    console.log(`✓ Copied: ${item.src}`);
  }
}

// Security Scan: Search for any secrets or .env files in staging
console.log('\nScanning staging directory for sensitive tokens / secrets...');
let filesScanned = 0;
let secretsFound = 0;

function scanDir(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDir(fullPath);
    } else {
      filesScanned++;
      if (entry.name.startsWith('.env') || entry.name.endsWith('.key') || entry.name.endsWith('.pem')) {
        console.error(`ALERT: Found sensitive file ${entry.name}! Deleting immediately.`);
        fs.unlinkSync(fullPath);
        secretsFound++;
      } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') || entry.name.endsWith('.js') || entry.name.endsWith('.json')) {
        let content = fs.readFileSync(fullPath, 'utf-8');
        // Check for common secret patterns (JWT eyJ, service role keys, private keys)
        if (content.includes('eyJhbGciOi')) {
          console.warn(`Redacting JWT token from ${entry.name}`);
          content = content.replace(/eyJhbGciOi[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[REDACTED_JWT_TOKEN]');
          fs.writeFileSync(fullPath, content, 'utf-8');
          secretsFound++;
        }
      }
    }
  }
}

scanDir(stagingDir);
console.log(`Scan complete: ${filesScanned} files checked, ${secretsFound} sensitive items mitigated.`);

// Compress to ZIP using PowerShell
console.log('\nCreating ZIP archive at:', zipOutput);
if (fs.existsSync(zipOutput)) {
  fs.unlinkSync(zipOutput);
}

const psCommand = `powershell -NoProfile -Command "Compress-Archive -Path '${stagingDir}\\*' -DestinationPath '${zipOutput}' -CompressionLevel Optimal"`;
execSync(psCommand, { stdio: 'inherit' });

const zipStats = fs.statSync(zipOutput);
console.log(`\n✓ ZIP archive created successfully!`);
console.log(`  File: ${zipOutput}`);
console.log(`  Size: ${(zipStats.size / (1024 * 1024)).toFixed(2)} MB`);

// Cleanup staging
fs.rmSync(stagingDir, { recursive: true, force: true });
console.log('✓ Staging directory cleaned up.');
