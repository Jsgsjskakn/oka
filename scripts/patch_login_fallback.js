const fs = require('fs');
const path = require('path');

// 1. Employee login
const empFile = path.resolve('src/app/employee/login/page.tsx');
let emp = fs.readFileSync(empFile, 'utf8');
emp = emp.replace(
  /if \(convexResult\.error && !convexResult\.error\.includes\('failed'\)\) \{\s*throw new Error\(convexResult\.error\);\s*\}/,
  `if (convexResult.error) {\n        console.warn('[employee-login] Convex login unsuccessful, trying Supabase fallback:', convexResult.error);\n      }`
);
fs.writeFileSync(empFile, emp, 'utf8');

// 2. Admin login
const admFile = path.resolve('src/app/admin/login/page.tsx');
let adm = fs.readFileSync(admFile, 'utf8');
adm = adm.replace(
  /if \(result\.error && !result\.error\.includes\('failed'\)\) \{\s*throw new Error\(result\.error\);\s*\}/,
  `if (result.error) {\n        console.warn('[admin-login] Convex login unsuccessful, trying Supabase fallback:', result.error);\n      }`
);
fs.writeFileSync(admFile, adm, 'utf8');

// 3. Customer login
const custFile = path.resolve('src/app/auth/login/page.tsx');
let cust = fs.readFileSync(custFile, 'utf8');
cust = cust.replace(
  /if \(convexResult\.error && !convexResult\.error\.includes\('failed'\)\) \{\s*throw new Error\(convexResult\.error\);\s*\}/,
  `if (convexResult.error) {\n        console.warn('[customer-login] Convex login unsuccessful, trying Supabase fallback:', convexResult.error);\n      }`
);
fs.writeFileSync(custFile, cust, 'utf8');

console.log('Login fallback cascades patched cleanly.');
