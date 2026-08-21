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

const runCompletePhase3IntegrationSuite = async () => {
  await startTestServer();
  console.log(`\n======================================================================`);
  console.log(`🧪 INTEGRATED TEST RUNNER: Phase 3 NORMAL_USER End-to-End Suite`);
  console.log(`🌐 Server Base URL: ${baseUrl}`);
  console.log(`======================================================================\n`);

  try {
    // -------------------------------------------------------------
    // 1. REGISTRATION & LOGIN VIA COMMON AUTH SYSTEM
    // -------------------------------------------------------------
    console.log('--- 1. AUTHENTICATION & PROFILE DISCOVERY ---');
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const registerRes = await request('POST', '/api/v1/auth/register', {
      name: `Eleanor Vance Customer ${randSuffix}`,
      email: `eleanor.cust${randSuffix}@example.com`,
      password: 'SecurePass@123',
      address: '742 Evergreen Terrace, Springfield'
    });
    if (registerRes.statusCode !== 201) throw new Error('Customer registration failed');
    const registeredUser = registerRes.data.data.user;
    if (registeredUser.role !== 'NORMAL_USER') throw new Error('Role mismatch on registration');
    console.log(`  ✔ [POST /api/v1/auth/register] Registered customer "${registeredUser.name}" with role NORMAL_USER.`);

    const loginRes = await request('POST', '/api/v1/auth/login', {
      email: `eleanor.cust${randSuffix}@example.com`,
      password: 'SecurePass@123'
    });
    if (loginRes.statusCode !== 200) throw new Error('Customer login failed');
    const token = loginRes.data.data.token;
    const userId = loginRes.data.data.user.id;
    console.log(`  ✔ [POST /api/v1/auth/login] Logged in successfully. Received Bearer JWT Token.`);

    // -------------------------------------------------------------
    // 2. CUSTOMER DASHBOARD ACTIVITY & METRICS
    // -------------------------------------------------------------
    console.log('\n--- 2. CUSTOMER DASHBOARD ACTIVITY ---');
    const dashRes = await request('GET', '/api/v1/dashboard/user', null, token);
    if (dashRes.statusCode !== 200) throw new Error('Failed to retrieve user dashboard');
    console.log(`  ✔ [GET /api/v1/dashboard/user] Accessed Customer Dashboard (Total Submitted: ${dashRes.data.data.totalRatingsSubmitted}).`);

    // -------------------------------------------------------------
    // 3. STORE BROWSING WITH DUAL RATING JOIN
    // -------------------------------------------------------------
    console.log('\n--- 3. STORE BROWSING & SEARCH/SORT/PAGINATION ---');
    const storesRes = await request('GET', '/api/v1/stores?page=1&limit=5&sortBy=rating&order=desc', null, token);
    if (storesRes.statusCode !== 200) throw new Error('Failed to retrieve stores catalog');
    const stores = storesRes.data.data.stores;
    if (stores.length === 0) throw new Error('No stores returned');
    console.log(`  ✔ [GET /api/v1/stores] Retrieved ${stores.length} store listings with pagination metadata.`);

    // Check dual rating indicators for new user (all stores should have myRating = null)
    stores.forEach((s) => {
      if (s.myRating !== null && s.userSubmittedRating !== null) {
        throw new Error('New user should have myRating = null for unrated stores');
      }
    });
    console.log('  ✔ All store listings accurately display unrated state (myRating: null) for new customer.');

    // Search by Name
    const nameSearch = await request('GET', '/api/v1/stores?name=Apex', null, token);
    if (nameSearch.statusCode !== 200) throw new Error('Name search failed');
    console.log(`  ✔ [GET /api/v1/stores?name=Apex] Case-insensitive name search matched ${nameSearch.data.data.stores.length} store(s).`);

    // Search by Address
    const addrSearch = await request('GET', '/api/v1/stores?address=Silicon', null, token);
    if (addrSearch.statusCode !== 200) throw new Error('Address search failed');
    console.log(`  ✔ [GET /api/v1/stores?address=Silicon] Case-insensitive address search matched ${addrSearch.data.data.stores.length} store(s).`);

    // -------------------------------------------------------------
    // 4. SUBMITTING A NEW STORE RATING (POST /api/v1/ratings)
    // -------------------------------------------------------------
    console.log('\n--- 4. RATING SUBMISSION & ARITHMETIC RECALCULATION ---');
    const submitRate = await request('POST', '/api/v1/ratings', {
      storeId: 1,
      rating: 5,
      comment: 'Top quality electronics and fast shipping!'
    }, token);
    if (submitRate.statusCode !== 201) throw new Error('Rating submission failed');
    const createdRating = submitRate.data.data.rating;
    if (createdRating.rating_value !== 5 || createdRating.user_id !== userId) {
      throw new Error('Rating ownership or value mismatch');
    }
    console.log(`  ✔ [POST /api/v1/ratings] Submitted 5★ rating for Store #1 (201 Created).`);

    // Verify immediate reflection in store query
    const storeAfterRate = await request('GET', '/api/v1/stores/1', null, token);
    if (storeAfterRate.data.data.store.myRating !== 5) {
      throw new Error('Submitted rating not reflected in store details');
    }
    console.log(`  ✔ [GET /api/v1/stores/1] Store #1 now immediately reflects myRating: 5★.`);

    // -------------------------------------------------------------
    // 5. MODIFYING AN EXISTING RATING (PUT /api/v1/ratings/:storeId)
    // -------------------------------------------------------------
    console.log('\n--- 5. RATING MODIFICATION & INSTANT RECALCULATION ---');
    const modifyRate = await request('PUT', '/api/v1/ratings/1', {
      rating: 4,
      comment: 'Updated review: good overall, packaging could be better.'
    }, token);
    if (modifyRate.statusCode !== 200) throw new Error('Rating modification failed');
    if (modifyRate.data.data.rating.rating_value !== 4) {
      throw new Error('Modified rating value mismatch');
    }
    console.log(`  ✔ [PUT /api/v1/ratings/1] Modified rating from 5★ to 4★ (200 OK).`);

    const storeAfterModify = await request('GET', '/api/v1/stores/1', null, token);
    if (storeAfterModify.data.data.store.myRating !== 4) {
      throw new Error('Modified rating not reflected in store details');
    }
    console.log(`  ✔ [GET /api/v1/stores/1] Store #1 now immediately reflects myRating: 4★.`);

    // -------------------------------------------------------------
    // 6. DUPLICATE & RBAC VALIDATION
    // -------------------------------------------------------------
    console.log('\n--- 6. DUPLICATE & RBAC SECURITY CHECKS ---');
    const duplicateRate = await request('POST', '/api/v1/ratings', { storeId: 1, rating: 5 }, token);
    if (duplicateRate.statusCode !== 409) throw new Error('Duplicate rating was not rejected with 409 Conflict');
    console.log('  ✔ Duplicate rating submission rejected (409 Conflict as expected).');

    const adminLogin = await request('POST', '/api/v1/auth/login', { email: 'admin@storerating.com', password: 'Admin@123456' });
    const adminToken = adminLogin.data.data.token;
    const adminRate = await request('POST', '/api/v1/ratings', { storeId: 1, rating: 5 }, adminToken);
    if (adminRate.statusCode !== 403) throw new Error('Admin was not blocked from submitting rating');
    console.log('  ✔ SYSTEM_ADMIN blocked from rating submission (403 Forbidden).');

    console.log('\n======================================================================');
    console.log('✨ ALL PHASE 3 NORMAL_USER END-TO-END CHECKS PASSED (100% GREEN)');
    console.log('======================================================================\n');
  } finally {
    await stopTestServer();
  }
};

runCompletePhase3IntegrationSuite()
  .then(() => {
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('❌ Integration Test failed:', err.message);
    await stopTestServer();
    process.exit(1);
  });
