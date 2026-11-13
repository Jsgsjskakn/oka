import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const projectRoot = 'C:\\Users\\Pyiush Gupta\\.gemini\\antigravity\\scratch\\the-golden-oak';

describe('Admin & Employee Portals Comprehensive Verification', () => {

  it('1. /admin/login and /employee/login: credential validation & session mechanics', () => {
    // Check admin login component
    const adminLoginPath = path.join(projectRoot, 'src', 'app', 'admin', 'login', 'page.tsx');
    assert.ok(fs.existsSync(adminLoginPath), 'src/app/admin/login/page.tsx must exist');
    const adminLoginContent = fs.readFileSync(adminLoginPath, 'utf8');

    // Credential validation & role gate
    assert.ok(adminLoginContent.includes('roleRequired: \'admin\''), 'Admin login must require role: admin');
    assert.ok(adminLoginContent.includes('getSafeAdminRedirect'), 'Admin login must use safe redirect sanitizer');
    assert.ok(adminLoginContent.includes('loginAction'), 'Admin login must use convex/supabase loginAction');

    // Check employee login component
    const employeeLoginPath = path.join(projectRoot, 'src', 'app', 'employee', 'login', 'page.tsx');
    assert.ok(fs.existsSync(employeeLoginPath), 'src/app/employee/login/page.tsx must exist');
    const employeeLoginContent = fs.readFileSync(employeeLoginPath, 'utf8');

    assert.ok(employeeLoginContent.includes('roleRequired: \'employee\''), 'Employee login must require employee role');
    assert.ok(employeeLoginContent.includes('getSafeEmployeeRedirect'), 'Employee login must use safe redirect sanitizer');
    assert.ok(employeeLoginContent.includes('setupEmployeePassword'), 'Employee login must offer first-time setup');
    assert.ok(employeeLoginContent.includes('sendEmployeePasswordResetEmail'), 'Employee login must offer password recovery');

    // Verify session cookies in convex-auth-actions.ts
    const authActionsPath = path.join(projectRoot, 'src', 'lib', 'auth', 'convex-auth-actions.ts');
    assert.ok(fs.existsSync(authActionsPath));
    const authActionsContent = fs.readFileSync(authActionsPath, 'utf8');
    assert.ok(authActionsContent.includes('golden_oak_session'), 'Must set golden_oak_session cookie');
    assert.ok(authActionsContent.includes('httpOnly: true'), 'Cookie must be httpOnly');
    assert.ok(authActionsContent.includes('shouldUseSecureCookie'), 'Cookie must dynamically determine secure flag based on protocol & environment');
  });

  it('2. /admin/(protected)/*: layout gates, dashboard, menu, orders, bookings, analytics, employees, settings', () => {
    const adminProtectedDir = path.join(projectRoot, 'src', 'app', 'admin', '(protected)');
    assert.ok(fs.existsSync(adminProtectedDir));

    // Verify AdminLayout gates all child routes
    const adminLayoutPath = path.join(adminProtectedDir, 'layout.tsx');
    const layoutContent = fs.readFileSync(adminLayoutPath, 'utf8');
    assert.ok(layoutContent.includes('requireAdmin()'), 'AdminLayout must enforce requireAdmin()');

    // Verify all 7 core admin sub-portals exist and enforce server-side auth
    const subroutes = ['dashboard', 'menu', 'orders', 'bookings', 'analytics', 'employees', 'settings'];
    for (const route of subroutes) {
      const pagePath = path.join(adminProtectedDir, route, 'page.tsx');
      assert.ok(fs.existsSync(pagePath), `Admin route /admin/${route}/page.tsx must exist`);
      const content = fs.readFileSync(pagePath, 'utf8');
      assert.ok(
        content.includes('requireAdmin()'),
        `/admin/${route}/page.tsx must explicitly enforce requireAdmin()`
      );
    }
  });

  it('3. /employee/(protected)/*: kitchen order status board & state transitions (pending -> preparing -> ready -> served)', () => {
    const employeeProtectedDir = path.join(projectRoot, 'src', 'app', 'employee', '(protected)');
    assert.ok(fs.existsSync(employeeProtectedDir));

    // Layout gate
    const empLayoutPath = path.join(employeeProtectedDir, 'layout.tsx');
    const empLayoutContent = fs.readFileSync(empLayoutPath, 'utf8');
    assert.ok(empLayoutContent.includes('requireEmployee()'), 'EmployeeLayout must enforce requireEmployee()');

    // Orders page
    const empOrdersPage = path.join(employeeProtectedDir, 'orders', 'page.tsx');
    assert.ok(fs.existsSync(empOrdersPage));

    // Orders Dashboard transitions
    const dashboardCompPath = path.join(projectRoot, 'src', 'components', 'employee', 'OrdersDashboard.tsx');
    const dashboardContent = fs.readFileSync(dashboardCompPath, 'utf8');

    // Verify transitions map pending -> preparing -> ready -> completed (Served)
    assert.ok(dashboardContent.includes("pending: 'preparing'"), 'pending must transition to preparing');
    assert.ok(dashboardContent.includes("preparing: 'ready'"), 'preparing must transition to ready');
    assert.ok(dashboardContent.includes("ready: 'completed'"), 'ready must transition to completed');
    assert.ok(dashboardContent.includes("completed: 'Served'"), 'completed label must be Served');

    // Verify backend allows pending -> preparing
    const convexOrdersPath = path.join(projectRoot, 'convex', 'orders.ts');
    const convexOrdersContent = fs.readFileSync(convexOrdersPath, 'utf8');
    assert.ok(
      convexOrdersContent.includes('pending: ["confirmed", "preparing", "cancelled"]'),
      'Convex orders backend must permit transition from pending to preparing'
    );
  });

  it('4. Update-password flow (verify route src/app/employee/update-password/page.tsx has no conflicts)', () => {
    const updatePasswordPage = path.join(projectRoot, 'src', 'app', 'employee', 'update-password', 'page.tsx');
    assert.ok(fs.existsSync(updatePasswordPage), 'Employee update password page must exist');
    const updatePasswordContent = fs.readFileSync(updatePasswordPage, 'utf8');

    // Check Suspense boundary
    assert.ok(updatePasswordContent.includes('<Suspense'), 'Must wrap searchParams consumer in Suspense');
    // Check both Convex and Supabase paths
    assert.ok(updatePasswordContent.includes('resetPasswordAction'), 'Must support Convex token reset');
    assert.ok(updatePasswordContent.includes('updateEmployeePassword'), 'Must support Supabase session recovery');

    // Verify middleware exemption
    const middlewarePath = path.join(projectRoot, 'src', 'middleware.ts');
    const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');
    assert.ok(
      middlewareContent.includes("lower === '/employee/update-password'"),
      'middleware.ts must exempt /employee/update-password from route protection'
    );

    // Verify redirect targets in employee actions
    const employeeActionsPath = path.join(projectRoot, 'src', 'lib', 'actions', 'employee-actions.ts');
    const employeeActionsContent = fs.readFileSync(employeeActionsPath, 'utf8');
    assert.ok(
      employeeActionsContent.includes('next=/employee/update-password'),
      'Password reset emails must redirect to /employee/update-password'
    );
  });
});
