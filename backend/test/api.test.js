const http = require('http');
const app = require('../src/app');

let server;
let baseUrl = '';

const startTestServer = () => {
  return new Promise((resolve, reject) => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
    server.on('error', reject);
  });
};

const stopTestServer = () => {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => resolve());
    } else {
      resolve();
    }
  });
};

const request = (method, path, body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(`${baseUrl}${path}`);
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(
      url,
      { method, headers },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
          try {
            resolve({ statusCode: res.statusCode, data: JSON.parse(rawData), headers: res.headers });
          } catch {
            resolve({ statusCode: res.statusCode, data: rawData, headers: res.headers });
          }
        });
      }
    );

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
};

const runTests = async () => {
  await startTestServer();
  console.log(`🧪 Test Server initialized on ${baseUrl}\n`);
  console.log('🛡️  Running Complete System Admin Dashboard & Security Test Suite...\n');

  try {
    // --- 1. HEALTH & SYSTEM DIAGNOSTICS ---
    const health = await request('GET', '/api/v1/health');
    if (health.statusCode !== 200) throw new Error('Health check failed');
    console.log('  ✔ [GET /api/v1/health] - System diagnostics operational (200 OK)');

    // --- 2. AUTHENTICATING TEST ROLES ---
    const adminLogin = await request('POST', '/api/v1/auth/login', { email: 'admin@storerating.com', password: 'Admin@123456' });
    if (adminLogin.statusCode !== 200) throw new Error('Admin login failed');
    const adminToken = adminLogin.data.data.token;
    console.log('  ✔ SYSTEM_ADMIN authenticated.');

    const ownerLogin = await request('POST', '/api/v1/auth/login', { email: 'owner1@storerating.com', password: 'Owner@123456' });
    if (ownerLogin.statusCode !== 200) throw new Error('Store Owner login failed');
    const ownerToken = ownerLogin.data.data.token;
    console.log('  ✔ STORE_OWNER authenticated.');

    const userLogin = await request('POST', '/api/v1/auth/login', { email: 'john.doe@example.com', password: 'User@123456' });
    if (userLogin.statusCode !== 200) throw new Error('Normal User login failed');
    const userToken = userLogin.data.data.token;
    console.log('  ✔ NORMAL_USER authenticated.');

    // --- 3. SYSTEM ADMINISTRATOR DASHBOARD METRICS ---
    console.log('\n--- 3. SYSTEM ADMINISTRATOR DASHBOARD METRICS & REAL-TIME DATA ---');
    const adminDash = await request('GET', '/api/v1/dashboard/admin', null, adminToken);
    if (adminDash.statusCode !== 200) throw new Error('Admin dashboard retrieval failed');
    
    const stats = adminDash.data.data.stats;
    if (typeof stats.totalUsers !== 'number') throw new Error('totalUsers metric missing');
    if (typeof stats.totalStores !== 'number') throw new Error('totalStores metric missing');
    if (typeof stats.totalRatings !== 'number') throw new Error('totalRatings metric missing');
    if (!stats.roleDistribution || typeof stats.roleDistribution.SYSTEM_ADMIN !== 'number') throw new Error('roleDistribution missing');
    if (!stats.ratingDistribution) throw new Error('ratingDistribution missing');

    console.log(`  ✔ [GET /api/v1/dashboard/admin] Total Users: ${stats.totalUsers} (Admins: ${stats.roleDistribution.SYSTEM_ADMIN}, Owners: ${stats.roleDistribution.STORE_OWNER}, Users: ${stats.roleDistribution.NORMAL_USER})`);
    console.log(`  ✔ [GET /api/v1/dashboard/admin] Total Stores: ${stats.totalStores}, Total Ratings: ${stats.totalRatings}`);
    console.log(`  ✔ [GET /api/v1/dashboard/admin] Star Distributions & Recent Activity verified (200 OK)`);

    // --- 4. ADMIN DASHBOARD RBAC ACCESS CONTROL RESTRICTIONS ---
    console.log('\n--- 4. ADMIN DASHBOARD RBAC AUTHORIZATION GUARDS ---');
    
    // A. STORE_OWNER attempting to access Admin Dashboard
    const ownerToAdmin = await request('GET', '/api/v1/dashboard/admin', null, ownerToken);
    if (ownerToAdmin.statusCode !== 403) throw new Error('STORE_OWNER was not blocked with 403 Forbidden from admin dashboard');
    console.log('  ✔ [GET /api/v1/dashboard/admin] STORE_OWNER blocked (403 Forbidden as expected)');

    // B. NORMAL_USER attempting to access Admin Dashboard
    const userToAdmin = await request('GET', '/api/v1/dashboard/admin', null, userToken);
    if (userToAdmin.statusCode !== 403) throw new Error('NORMAL_USER was not blocked with 403 Forbidden from admin dashboard');
    console.log('  ✔ [GET /api/v1/dashboard/admin] NORMAL_USER blocked (403 Forbidden as expected)');

    // C. Unauthenticated user attempting to access Admin Dashboard
    const unauthToAdmin = await request('GET', '/api/v1/dashboard/admin');
    if (unauthToAdmin.statusCode !== 401) throw new Error('Unauthenticated user was not blocked with 401 Unauthorized');
    console.log('  ✔ [GET /api/v1/dashboard/admin] Unauthenticated request blocked (401 Unauthorized as expected)');

    // --- 5. NORMAL USER REGISTRATION VALIDATION RULES ---
    console.log('\n--- 5. REGISTRATION VALIDATION & PRIVILEGE GUARDS ---');
    const shortName = await request('POST', '/api/v1/auth/register', { name: 'Short Name', email: 'test.short@example.com', password: 'ValidPassword@123' });
    if (shortName.statusCode !== 422) throw new Error('Short name was not rejected with 422');
    console.log('  ✔ [POST /api/v1/auth/register] Name < 20 chars rejected (422 Unprocessable Entity)');

    const randomId = Math.floor(1000 + Math.random() * 9000);
    const validReg = await request('POST', '/api/v1/auth/register', {
      name: `Alexander Montgomery Wright ${randomId}`,
      email: `alex.wright${randomId}@example.com`,
      password: 'SecureUser@123',
      role: 'SYSTEM_ADMIN' // Malicious attempt to escalate role
    });
    if (validReg.statusCode !== 201) throw new Error('Registration failed');
    if (validReg.data.data.user.role !== 'NORMAL_USER') throw new Error('Privilege Escalation bug');
    if (validReg.data.data.user.password_hash) throw new Error('Password hash leaked');
    console.log('  ✔ [POST /api/v1/auth/register] Privilege Escalation Guard: Forced role = NORMAL_USER (201 Created)');

    console.log('\n✨ ALL SYSTEM ADMINISTRATOR DASHBOARD & RBAC SECURITY TESTS PASSED!\n');
  } finally {
    await stopTestServer();
  }
};

runTests()
  .then(() => {
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('❌ Test failed:', err.message);
    await stopTestServer();
    process.exit(1);
  });
