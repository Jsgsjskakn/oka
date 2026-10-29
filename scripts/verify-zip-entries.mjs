import fs from 'fs';
import { execSync } from 'child_process';

const raw = execSync('tar -tf the-golden-oak-export.zip', { encoding: 'utf-8' });
const lines = raw.split('\n').filter(Boolean);

console.log(`Total files in ZIP: ${lines.length}`);
const suspicious = lines.filter(f => 
  f.includes('.env') || 
  f.includes('node_modules') || 
  f.includes('.next') || 
  f.includes('.git') || 
  f.includes('.key') || 
  f.includes('.pem')
);

if (suspicious.length === 0) {
  console.log('✓ Zero sensitive files or forbidden directories found in ZIP.');
} else {
  console.error('Suspicious entries found:', suspicious);
}
