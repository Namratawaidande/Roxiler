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

const runRatingModificationTests = async () => {
  await startTestServer();
  console.log(`\n======================================================================`);
  console.log(`🧪 TEST RUNNER: NORMAL_USER Rating Modification & Ownership Suite`);
  console.log(`🌐 Server Base URL: ${baseUrl}`);
  console.log(`======================================================================\n`);

  try {
    // --- 1. AUTHENTICATION ---
    console.log('--- 1. AUTHENTICATION OF TEST ACCOUNTS ---');
    const userLogin = await request('POST', '/api/v1/auth/login', { email: 'john.doe@example.com', password: 'User@123456' });
    if (userLogin.statusCode !== 200) throw new Error('Normal user login failed');
    const userToken = userLogin.data.data.token;
    const userId = userLogin.data.data.user.id;

    const adminLogin = await request('POST', '/api/v1/auth/login', { email: 'admin@storerating.com', password: 'Admin@123456' });
    if (adminLogin.statusCode !== 200) throw new Error('Admin login failed');
    const adminToken = adminLogin.data.data.token;

    const ownerLogin = await request('POST', '/api/v1/auth/login', { email: 'owner1@storerating.com', password: 'Owner@123456' });
    if (ownerLogin.statusCode !== 200) throw new Error('Store owner login failed');
    const ownerToken = ownerLogin.data.data.token;
    console.log('  ✔ Authenticated NORMAL_USER, SYSTEM_ADMIN, and STORE_OWNER.');

    // --- 2. SUBMITTING INITIAL RATING ---
    console.log('\n--- 2. SUBMITTING INITIAL RATING ---');
    // John Doe rates Store 2 with 4 stars
    const initRating = await request('POST', '/api/v1/ratings', {
      storeId: 2,
      rating: 4,
      comment: 'Initial 4 star review'
    }, userToken);
    if (initRating.statusCode !== 201 && initRating.statusCode !== 409) {
      throw new Error(`Failed to initialize rating: ${JSON.stringify(initRating.data)}`);
    }
    console.log('  ✔ Initial rating established for Store #2.');

    // --- 3. MODIFYING EXISTING RATING ---
    console.log('\n--- 3. MODIFYING EXISTING RATING (PUT /api/v1/ratings/:storeId) ---');
    const modifyRes = await request('PUT', '/api/v1/ratings/2', {
      rating: 2,
      comment: 'Downgrading to 2 stars after second visit delays.'
    }, userToken);

    if (modifyRes.statusCode !== 200) {
      throw new Error(`Expected 200 OK for rating update, got ${modifyRes.statusCode}: ${JSON.stringify(modifyRes.data)}`);
    }
    const updated = modifyRes.data.data.rating;
    if (updated.rating_value !== 2 || updated.user_id !== userId) {
      throw new Error('Updated rating value or user ownership mismatch');
    }
    console.log(`  ✔ [PUT /api/v1/ratings/2] Rating successfully modified to 2★ for Store #2 by User #${userId} (200 OK).`);

    // --- 4. IMMEDIATE REFLECTION IN STORE QUERIES ---
    console.log('\n--- 4. IMMEDIATE REFLECTION IN STORE BROWSING ---');
    const storesRes = await request('GET', '/api/v1/stores', null, userToken);
    if (storesRes.statusCode !== 200) throw new Error('Failed to retrieve stores');
    const store2 = storesRes.data.data.stores.find(s => s.id === 2);
    if (!store2) throw new Error('Store 2 missing in response');
    if (store2.myRating !== 2 && store2.userSubmittedRating !== 2) {
      throw new Error(`Expected myRating to immediately reflect 2★, got ${store2.myRating}`);
    }
    console.log(`  ✔ [GET /api/v1/stores] Store #2 now returns userSubmittedRating: ${store2.myRating}★ (Reflected immediately).`);

    // --- 5. MODIFYING UNRATED STORE REJECTED WITH 404 ---
    console.log('\n--- 5. MODIFYING UNRATED STORE REJECTION ---');
    const unratedStoreRes = await request('PUT', '/api/v1/ratings/3', {
      rating: 5
    }, userToken);
    if (unratedStoreRes.statusCode !== 404) {
      throw new Error(`Expected 404 Not Found for unrated store update, got ${unratedStoreRes.statusCode}`);
    }
    console.log('  ✔ [PUT /api/v1/ratings/3] Modifying rating on unrated store rejected (404 Not Found as expected).');

    // --- 6. RATING VALUE VALIDATION ---
    console.log('\n--- 6. INPUT RANGE VALIDATION ---');
    const invalidHigh = await request('PUT', '/api/v1/ratings/2', { rating: 6 }, userToken);
    if (invalidHigh.statusCode !== 422) throw new Error('Rating 6 was not rejected with 422');
    console.log('  ✔ Rating > 5 rejected (422 Unprocessable Entity).');

    const invalidLow = await request('PUT', '/api/v1/ratings/2', { rating: 0 }, userToken);
    if (invalidLow.statusCode !== 422) throw new Error('Rating 0 was not rejected with 422');
    console.log('  ✔ Rating < 1 rejected (422 Unprocessable Entity).');

    // --- 7. RBAC GUARDS ---
    console.log('\n--- 7. ROLE-BASED ACCESS RESTRICTIONS ---');
    const adminPut = await request('PUT', '/api/v1/ratings/2', { rating: 5 }, adminToken);
    if (adminPut.statusCode !== 403) throw new Error('SYSTEM_ADMIN was not blocked with 403 from modifying rating');
    console.log('  ✔ [PUT /api/v1/ratings/:storeId] (SYSTEM_ADMIN) -> 403 Forbidden (Blocked).');

    const ownerPut = await request('PUT', '/api/v1/ratings/2', { rating: 5 }, ownerToken);
    if (ownerPut.statusCode !== 403) throw new Error('STORE_OWNER was not blocked with 403 from modifying rating');
    console.log('  ✔ [PUT /api/v1/ratings/:storeId] (STORE_OWNER) -> 403 Forbidden (Blocked).');

    const unauthPut = await request('PUT', '/api/v1/ratings/2', { rating: 5 });
    if (unauthPut.statusCode !== 401) throw new Error('Unauthenticated update was not blocked with 401');
    console.log('  ✔ [PUT /api/v1/ratings/:storeId] (Unauthenticated) -> 401 Unauthorized (Blocked).');

    console.log('\n======================================================================');
    console.log('✨ ALL NORMAL_USER RATING MODIFICATION TESTS PASSED (100% GREEN)');
    console.log('======================================================================\n');
  } finally {
    await stopTestServer();
  }
};

runRatingModificationTests()
  .then(() => {
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('❌ Test failed:', err.message);
    await stopTestServer();
    process.exit(1);
  });
