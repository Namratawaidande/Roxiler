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
  console.log('🛡️  Running Complete Detailed User-View & Security Test Suite...\n');

  try {
    // --- 1. HEALTH & AUTHENTICATION ---
    const adminLogin = await request('POST', '/api/v1/auth/login', { email: 'admin@storerating.com', password: 'Admin@123456' });
    if (adminLogin.statusCode !== 200) throw new Error('Admin login failed');
    const adminToken = adminLogin.data.data.token;

    const ownerLogin = await request('POST', '/api/v1/auth/login', { email: 'owner1@storerating.com', password: 'Owner@123456' });
    if (ownerLogin.statusCode !== 200) throw new Error('Store Owner login failed');
    const ownerToken = ownerLogin.data.data.token;

    const userLogin = await request('POST', '/api/v1/auth/login', { email: 'john.doe@example.com', password: 'User@123456' });
    if (userLogin.statusCode !== 200) throw new Error('Normal User login failed');
    const userToken = userLogin.data.data.token;

    // --- 2. DETAILED STORE_OWNER PROFILE INSPECTION ---
    console.log('--- 2. DETAILED STORE_OWNER PROFILE & STORE RATINGS ---');
    const ownerDetailRes = await request('GET', '/api/v1/users/2', null, adminToken);
    if (ownerDetailRes.statusCode !== 200) throw new Error('Failed to retrieve Store Owner details');
    const ownerUser = ownerDetailRes.data.data.user;

    if (ownerUser.role !== 'STORE_OWNER') throw new Error('Role mismatch on Store Owner');
    if (ownerUser.password || ownerUser.password_hash) throw new Error('Security Leak: password or hash exposed in details');
    if (!ownerUser.stores || !Array.isArray(ownerUser.stores) || ownerUser.stores.length === 0) {
      throw new Error('STORE_OWNER details missing associated stores');
    }
    const store = ownerUser.stores[0];
    if (!store.name || typeof store.averageRating !== 'number' || typeof store.ratingCount !== 'number') {
      throw new Error('STORE_OWNER store missing average rating or review count');
    }
    console.log(`  ✔ [GET /api/v1/users/:id] STORE_OWNER "${ownerUser.name}" details retrieved.`);
    console.log(`    ↳ Associated Store: "${store.name}", Avg Rating: ${store.averageRating}★, Reviews: ${store.ratingCount}`);

    // --- 3. DETAILED NORMAL_USER PROFILE INSPECTION ---
    console.log('\n--- 3. DETAILED NORMAL_USER PROFILE & SAFE DATA ---');
    const normalDetailRes = await request('GET', '/api/v1/users/4', null, adminToken);
    if (normalDetailRes.statusCode !== 200) throw new Error('Failed to retrieve Normal User details');
    const normalUser = normalDetailRes.data.data.user;

    if (normalUser.role !== 'NORMAL_USER') throw new Error('Role mismatch on Normal User');
    if (normalUser.password || normalUser.password_hash) throw new Error('Security Leak: password or hash exposed');
    console.log(`  ✔ [GET /api/v1/users/:id] NORMAL_USER "${normalUser.name}" details retrieved safely without password.`);

    // --- 4. DETAILED SYSTEM_ADMIN PROFILE INSPECTION ---
    console.log('\n--- 4. DETAILED SYSTEM_ADMIN PROFILE & SAFE DATA ---');
    const adminDetailRes = await request('GET', '/api/v1/users/1', null, adminToken);
    if (adminDetailRes.statusCode !== 200) throw new Error('Failed to retrieve Admin details');
    const adminUser = adminDetailRes.data.data.user;

    if (adminUser.role !== 'SYSTEM_ADMIN') throw new Error('Role mismatch on Admin User');
    if (adminUser.password || adminUser.password_hash) throw new Error('Security Leak: password or hash exposed');
    console.log(`  ✔ [GET /api/v1/users/:id] SYSTEM_ADMIN "${adminUser.name}" details retrieved safely without password.`);

    // --- 5. RBAC GUARDS ---
    console.log('\n--- 5. RBAC GUARDS ON USER DETAILS ---');
    const userToDetail = await request('GET', '/api/v1/users/2', null, userToken);
    if (userToDetail.statusCode !== 403) throw new Error('NORMAL_USER was not blocked with 403 from inspecting users');
    console.log('  ✔ [GET /api/v1/users/:id] (NORMAL_USER) -> 403 Forbidden (Blocked as expected)');

    const ownerToDetail = await request('GET', '/api/v1/users/4', null, ownerToken);
    if (ownerToDetail.statusCode !== 403) throw new Error('STORE_OWNER was not blocked with 403 from inspecting users');
    console.log('  ✔ [GET /api/v1/users/:id] (STORE_OWNER) -> 403 Forbidden (Blocked as expected)');

    console.log('\n✨ ALL DETAILED USER-VIEW & SECURITY TESTS PASSED!\n');
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
