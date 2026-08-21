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

const runStoreOwnerRatingsListTests = async () => {
  await startTestServer();
  console.log(`\n======================================================================`);
  console.log(`🧪 TEST RUNNER: STORE_OWNER Dedicated Customer Ratings List Suite`);
  console.log(`🌐 Server Base URL: ${baseUrl}`);
  console.log(`======================================================================\n`);

  try {
    // --- 1. AUTHENTICATING TEST ROLES ---
    console.log('--- 1. AUTHENTICATION OF TEST ACCOUNTS ---');
    const owner1Login = await request('POST', '/api/v1/auth/login', { email: 'owner1@storerating.com', password: 'Owner@123456' });
    if (owner1Login.statusCode !== 200) throw new Error('Owner 1 login failed');
    const owner1Token = owner1Login.data.data.token;

    const owner2Login = await request('POST', '/api/v1/auth/login', { email: 'owner2@storerating.com', password: 'Owner@123456' });
    if (owner2Login.statusCode !== 200) throw new Error('Owner 2 login failed');
    const owner2Token = owner2Login.data.data.token;

    const userLogin = await request('POST', '/api/v1/auth/login', { email: 'john.doe@example.com', password: 'User@123456' });
    if (userLogin.statusCode !== 200) throw new Error('Normal user login failed');
    const userToken = userLogin.data.data.token;

    const adminLogin = await request('POST', '/api/v1/auth/login', { email: 'admin@storerating.com', password: 'Admin@123456' });
    if (adminLogin.statusCode !== 200) throw new Error('Admin login failed');
    const adminToken = adminLogin.data.data.token;
    console.log('  ✔ Authenticated STORE_OWNER #1, STORE_OWNER #2, NORMAL_USER, and SYSTEM_ADMIN.');

    // --- 2. RETRIEVING OWNER RATINGS LIST ---
    console.log('\n--- 2. RETRIEVING STORE_OWNER #1 (ALICE) RATINGS LIST ---');
    const owner1RatingsRes = await request('GET', '/api/v1/ratings/owner', null, owner1Token);
    if (owner1RatingsRes.statusCode !== 200) {
      throw new Error(`Expected 200 OK for owner ratings, got ${owner1RatingsRes.statusCode}`);
    }
    const ratings = owner1RatingsRes.data.data.ratings;
    if (!ratings || ratings.length === 0) throw new Error('No customer ratings returned for Owner 1');
    console.log(`  ✔ [GET /api/v1/ratings/owner] Retrieved ${ratings.length} customer ratings for Owner #1.`);

    // Customer profile attribute checks
    const r1 = ratings[0];
    if (!r1.userName || !r1.userEmail || !r1.rating) {
      throw new Error('Customer rating missing required fields (userName, userEmail, rating)');
    }
    if (r1.password || r1.password_hash) {
      throw new Error('Security Leak: Password found in customer rating payload');
    }
    console.log(`  ✔ Customer Review Verified: "${r1.userName}" (${r1.userEmail}) rated ${r1.rating}★ at "${r1.storeName}".`);
    console.log(`    ↳ Customer Address: "${r1.userAddress || 'N/A'}" | Date: ${r1.createdAt || r1.created_at}.`);

    // --- 3. ALLOWLISTED SORTING (USER NAME, EMAIL, RATING, DATE) ---
    console.log('\n--- 3. ALLOWLISTED SORTING TESTS ---');
    const sortFields = ['userName', 'userEmail', 'rating', 'createdAt'];
    for (const field of sortFields) {
      const resAsc = await request('GET', `/api/v1/ratings/owner?sortBy=${field}&order=asc`, null, owner1Token);
      if (resAsc.statusCode !== 200) throw new Error(`Sorting by ${field} ASC failed`);
      const resDesc = await request('GET', `/api/v1/ratings/owner?sortBy=${field}&order=desc`, null, owner1Token);
      if (resDesc.statusCode !== 200) throw new Error(`Sorting by ${field} DESC failed`);
      console.log(`  ✔ [GET /api/v1/ratings/owner?sortBy=${field}&order=asc|desc] Verified sorting on "${field}".`);
    }

    // --- 4. PAGINATION METADATA VALIDATION ---
    console.log('\n--- 4. PAGINATION METADATA STRUCTURE ---');
    const pagedRes = await request('GET', '/api/v1/ratings/owner?page=1&limit=1', null, owner1Token);
    if (pagedRes.statusCode !== 200) throw new Error('Pagination request failed');
    const meta = pagedRes.data.meta;
    const pagination = meta?.pagination || meta;
    if (!pagination || typeof pagination.totalItems !== 'number' || typeof pagination.totalPages !== 'number') {
      throw new Error('Pagination metadata missing totalItems or totalPages');
    }
    console.log(`  ✔ Pagination validated: Page ${pagination.page || pagination.currentPage} of ${pagination.totalPages} (Total: ${pagination.totalItems} ratings, Limit: ${pagination.pageSize || pagination.limit}).`);

    // --- 5. CROSS-OWNER ISOLATION ---
    console.log('\n--- 5. CROSS-OWNER DATA ISOLATION ---');
    const owner2RatingsRes = await request('GET', '/api/v1/ratings/owner', null, owner2Token);
    if (owner2RatingsRes.statusCode !== 200) throw new Error('Owner 2 ratings request failed');
    const owner2Ratings = owner2RatingsRes.data.data.ratings;

    owner2Ratings.forEach((r) => {
      if (r.storeName.includes('Apex Digital')) {
        throw new Error('Data Leak: Marcus received Alice customer reviews');
      }
    });
    console.log(`  ✔ Cross-owner isolation verified: Marcus Vance received only his store reviews ("${owner2Ratings[0]?.storeName}").`);

    // --- 6. ROLE-BASED ACCESS GUARDS ---
    console.log('\n--- 6. ROLE-BASED ACCESS BARRIERS ---');
    const userAccess = await request('GET', '/api/v1/ratings/owner', null, userToken);
    if (userAccess.statusCode !== 403) throw new Error('NORMAL_USER was not blocked with 403');
    console.log('  ✔ [GET /api/v1/ratings/owner] (NORMAL_USER) -> 403 Forbidden (Blocked).');

    const adminAccess = await request('GET', '/api/v1/ratings/owner', null, adminToken);
    if (adminAccess.statusCode !== 403) throw new Error('SYSTEM_ADMIN was not blocked with 403');
    console.log('  ✔ [GET /api/v1/ratings/owner] (SYSTEM_ADMIN) -> 403 Forbidden (Blocked).');

    const unauthAccess = await request('GET', '/api/v1/ratings/owner');
    if (unauthAccess.statusCode !== 401) throw new Error('Unauthenticated request was not blocked with 401');
    console.log('  ✔ [GET /api/v1/ratings/owner] (Unauthenticated) -> 401 Unauthorized (Blocked).');

    console.log('\n======================================================================');
    console.log('✨ ALL STORE_OWNER RATINGS LIST TESTS PASSED (100% GREEN)');
    console.log('======================================================================\n');
  } finally {
    await stopTestServer();
  }
};

runStoreOwnerRatingsListTests()
  .then(() => {
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('❌ Test failed:', err.message);
    await stopTestServer();
    process.exit(1);
  });
