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

const runStoreOwnerDashboardTests = async () => {
  await startTestServer();
  console.log(`\n======================================================================`);
  console.log(`🧪 TEST RUNNER: STORE_OWNER Backend Dashboard & Cross-Owner Isolation`);
  console.log(`🌐 Server Base URL: ${baseUrl}`);
  console.log(`======================================================================\n`);

  try {
    // --- 1. AUTHENTICATING TEST ROLES ---
    console.log('--- 1. AUTHENTICATION OF TEST ACCOUNTS ---');
    const owner1Login = await request('POST', '/api/v1/auth/login', { email: 'owner1@storerating.com', password: 'Owner@123456' });
    if (owner1Login.statusCode !== 200) throw new Error('Store Owner 1 login failed');
    const owner1Token = owner1Login.data.data.token;

    const owner2Login = await request('POST', '/api/v1/auth/login', { email: 'owner2@storerating.com', password: 'Owner@123456' });
    if (owner2Login.statusCode !== 200) throw new Error('Store Owner 2 login failed');
    const owner2Token = owner2Login.data.data.token;

    const userLogin = await request('POST', '/api/v1/auth/login', { email: 'john.doe@example.com', password: 'User@123456' });
    if (userLogin.statusCode !== 200) throw new Error('Normal User login failed');
    const userToken = userLogin.data.data.token;
    console.log('  ✔ Authenticated STORE_OWNER #1 (Alice), STORE_OWNER #2 (Marcus), and NORMAL_USER.');

    // --- 2. STORE_OWNER 1 DASHBOARD RETRIEVAL ---
    console.log('\n--- 2. STORE_OWNER #1 (ALICE) DASHBOARD RETRIEVAL ---');
    const owner1DashRes = await request('GET', '/api/v1/dashboard/owner', null, owner1Token);
    if (owner1DashRes.statusCode !== 200) {
      throw new Error(`Expected 200 OK for Owner 1 dashboard, got ${owner1DashRes.statusCode}`);
    }
    const dash1 = owner1DashRes.data.data;
    if (!dash1.stores || dash1.stores.length === 0) throw new Error('Owner 1 missing store listings');
    console.log(`  ✔ [GET /api/v1/dashboard/owner] Owner #1 retrieved ${dash1.stores.length} store(s) with overall rating: ${dash1.averageRating}★.`);

    // Check customer ratings list
    if (!dash1.ratingsList || dash1.ratingsList.length === 0) {
      throw new Error('Owner 1 missing customer reviews list');
    }
    const review1 = dash1.ratingsList[0];
    if (!review1.userName || !review1.userEmail || typeof review1.rating !== 'number') {
      throw new Error('Customer review missing user profile fields or rating');
    }
    if (review1.password || review1.password_hash) {
      throw new Error('Security Leak: Password exposed in customer reviews list');
    }
    console.log(`  ✔ Customer Review verified: "${review1.userName}" (${review1.userEmail}) rated ${review1.rating}★ at "${review1.storeName}".`);
    console.log(`    ↳ Customer Location: "${review1.userAddress || 'N/A'}" (Zero password exposure).`);

    // --- 3. STORE_OWNER 2 DASHBOARD & CROSS-OWNER ISOLATION ---
    console.log('\n--- 3. STORE_OWNER #2 (MARCUS) & CROSS-OWNER DATA ISOLATION ---');
    const owner2DashRes = await request('GET', '/api/v1/dashboard/owner', null, owner2Token);
    if (owner2DashRes.statusCode !== 200) {
      throw new Error(`Expected 200 OK for Owner 2 dashboard, got ${owner2DashRes.statusCode}`);
    }
    const dash2 = owner2DashRes.data.data;
    if (!dash2.stores || dash2.stores.length === 0) throw new Error('Owner 2 missing store listings');

    // Verify isolation: Marcus only sees Marcus's stores (Store 2: Urban Gourmet)
    dash2.stores.forEach((s) => {
      if (s.name.includes('Apex Digital')) {
        throw new Error('Data Leak: Owner 2 received Owner 1 store');
      }
    });
    dash2.ratingsList.forEach((r) => {
      if (r.storeName.includes('Apex Digital')) {
        throw new Error('Data Leak: Owner 2 received Owner 1 customer review');
      }
    });
    console.log(`  ✔ Cross-Owner Data Isolation Verified: Marcus Vance received only his owned store ("${dash2.stores[0].name}").`);

    // --- 4. ROLE-BASED ACCESS BARRIERS ---
    console.log('\n--- 4. ROLE-BASED ACCESS BARRIERS ---');
    const userToOwnerDash = await request('GET', '/api/v1/dashboard/owner', null, userToken);
    if (userToOwnerDash.statusCode !== 403) {
      throw new Error('NORMAL_USER was not blocked with 403 from accessing Store Owner dashboard');
    }
    console.log('  ✔ [GET /api/v1/dashboard/owner] (NORMAL_USER) -> 403 Forbidden (Blocked).');

    const unauthToOwnerDash = await request('GET', '/api/v1/dashboard/owner');
    if (unauthToOwnerDash.statusCode !== 401) {
      throw new Error('Unauthenticated request was not blocked with 401');
    }
    console.log('  ✔ [GET /api/v1/dashboard/owner] (Unauthenticated) -> 401 Unauthorized (Blocked).');

    console.log('\n======================================================================');
    console.log('✨ ALL STORE_OWNER BACKEND DASHBOARD TESTS PASSED (100% GREEN)');
    console.log('======================================================================\n');
  } finally {
    await stopTestServer();
  }
};

runStoreOwnerDashboardTests()
  .then(() => {
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('❌ Test failed:', err.message);
    await stopTestServer();
    process.exit(1);
  });
