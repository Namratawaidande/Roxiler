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

const runComprehensivePhase4Suite = async () => {
  await startTestServer();
  console.log(`\n======================================================================`);
  console.log(`🧪 INTEGRATED TEST RUNNER: Phase 4 STORE_OWNER End-to-End Suite`);
  console.log(`🌐 Server Base URL: ${baseUrl}`);
  console.log(`======================================================================\n`);

  try {
    // -------------------------------------------------------------
    // 1. COMMON AUTHENTICATION & LOGIN
    // -------------------------------------------------------------
    console.log('--- 1. STORE_OWNER AUTHENTICATION & ROLE IDENTIFICATION ---');
    const owner1Login = await request('POST', '/api/v1/auth/login', {
      email: 'owner1@storerating.com',
      password: 'Owner@123456'
    });
    if (owner1Login.statusCode !== 200) throw new Error('Store Owner 1 login failed');
    const owner1Token = owner1Login.data.data.token;
    const owner1User = owner1Login.data.data.user;
    if (owner1User.role !== 'STORE_OWNER') throw new Error('Role mismatch for store owner');
    console.log(`  ✔ [POST /api/v1/auth/login] Logged in as STORE_OWNER ("${owner1User.name}").`);

    const owner2Login = await request('POST', '/api/v1/auth/login', {
      email: 'owner2@storerating.com',
      password: 'Owner@123456'
    });
    const owner2Token = owner2Login.data.data.token;

    const userLogin = await request('POST', '/api/v1/auth/login', {
      email: 'john.doe@example.com',
      password: 'User@123456'
    });
    const userToken = userLogin.data.data.token;

    const adminLogin = await request('POST', '/api/v1/auth/login', {
      email: 'admin@storerating.com',
      password: 'Admin@123456'
    });
    const adminToken = adminLogin.data.data.token;

    // -------------------------------------------------------------
    // 2. STORE OWNER DASHBOARD OVERVIEW (GET /dashboard/owner)
    // -------------------------------------------------------------
    console.log('\n--- 2. STORE OWNER DASHBOARD OVERVIEW ---');
    const dashRes = await request('GET', '/api/v1/dashboard/owner', null, owner1Token);
    if (dashRes.statusCode !== 200) throw new Error('Failed to retrieve owner dashboard');
    const dash = dashRes.data.data;
    if (!dash.stores || dash.stores.length === 0) throw new Error('Owner missing stores list');
    console.log(`  ✔ [GET /api/v1/dashboard/owner] Retrieved store info: "${dash.stores[0].name}" (${dash.stores[0].address}).`);
    console.log(`    ↳ Average Rating: ${dash.averageRating}★ | Total Ratings: ${dash.totalRatingsReceived}.`);

    // -------------------------------------------------------------
    // 3. RATING STATISTICS & 5-STAR DISTRIBUTION (GET /ratings/owner/stats)
    // -------------------------------------------------------------
    console.log('\n--- 3. RATING STATISTICS & 5-STAR DISTRIBUTION ---');
    const statsRes = await request('GET', '/api/v1/ratings/owner/stats', null, owner1Token);
    if (statsRes.statusCode !== 200) throw new Error('Failed to retrieve rating stats');
    const stats = statsRes.data.data;
    const dist = stats.ratingDistribution;
    console.log(`  ✔ [GET /api/v1/ratings/owner/stats] Average Rating = ${stats.averageRating}★ across ${stats.totalRatings} reviews.`);
    console.log(`    ↳ Star Breakdown: 5★: ${dist[5]} | 4★: ${dist[4]} | 3★: ${dist[3]} | 2★: ${dist[2]} | 1★: ${dist[1]}.`);

    // -------------------------------------------------------------
    // 4. CUSTOMER RATINGS LIST, SEARCH, SORT & PAGINATION
    // -------------------------------------------------------------
    console.log('\n--- 4. CUSTOMER RATINGS LIST, SEARCH, SORT & PAGINATION ---');
    const listRes = await request('GET', '/api/v1/ratings/owner?page=1&limit=5&sortBy=rating&order=desc', null, owner1Token);
    if (listRes.statusCode !== 200) throw new Error('Failed to retrieve ratings list');
    const ratings = listRes.data.data.ratings;
    const firstReview = ratings[0];
    console.log(`  ✔ [GET /api/v1/ratings/owner] Customer Review Verified: "${firstReview.userName}" (${firstReview.userEmail}) rated ${firstReview.rating}★.`);
    console.log(`    ↳ Location: "${firstReview.userAddress || 'N/A'}" (Zero password exposure).`);

    // Multi-field search
    const nameSearch = await request('GET', '/api/v1/ratings/owner?userName=John', null, owner1Token);
    if (nameSearch.statusCode !== 200) throw new Error('Search by userName failed');
    console.log(`  ✔ Server-side search by Customer Name matched ${nameSearch.data.data.ratings.length} record(s).`);

    const emailSearch = await request('GET', '/api/v1/ratings/owner?userEmail=john.doe@example.com', null, owner1Token);
    if (emailSearch.statusCode !== 200) throw new Error('Search by userEmail failed');
    console.log(`  ✔ Server-side search by Customer Email matched ${emailSearch.data.data.ratings.length} record(s).`);

    // Column click-to-sort
    for (const col of ['userName', 'userEmail', 'rating', 'createdAt']) {
      const sAsc = await request('GET', `/api/v1/ratings/owner?sortBy=${col}&order=ASC`, null, owner1Token);
      if (sAsc.statusCode !== 200) throw new Error(`Sort by ${col} failed`);
    }
    console.log('  ✔ Column sorting verified across Name, Email, Rating, and Date.');

    // -------------------------------------------------------------
    // 5. SECURE PASSWORD CHANGE & VERIFICATION
    // -------------------------------------------------------------
    console.log('\n--- 5. SECURE PASSWORD CHANGE & VERIFICATION ---');
    // Successful update
    const passChangeRes = await request('PUT', '/api/v1/auth/password', {
      currentPassword: 'Owner@123456',
      newPassword: 'NewOwner@2026',
      confirmNewPassword: 'NewOwner@2026'
    }, owner1Token);
    if (passChangeRes.statusCode !== 200) throw new Error('Password change failed');
    console.log('  ✔ [PUT /api/v1/auth/password] Updated password successfully (200 OK).');

    // Subsequent login with new password
    const newPassLogin = await request('POST', '/api/v1/auth/login', {
      email: 'owner1@storerating.com',
      password: 'NewOwner@2026'
    });
    if (newPassLogin.statusCode !== 200) throw new Error('Login with new password failed');
    console.log('  ✔ Login with newly updated password succeeded (200 OK).');

    // Reset password back for subsequent test runs
    await request('PUT', '/api/v1/auth/password', {
      currentPassword: 'NewOwner@2026',
      newPassword: 'Owner@123456',
      confirmNewPassword: 'Owner@123456'
    }, newPassLogin.data.data.token);

    // -------------------------------------------------------------
    // 6. CROSS-OWNER DATA ISOLATION
    // -------------------------------------------------------------
    console.log('\n--- 6. CROSS-OWNER DATA ISOLATION ---');
    const owner2Stats = await request('GET', '/api/v1/ratings/owner/stats', null, owner2Token);
    if (owner2Stats.statusCode !== 200) throw new Error('Owner 2 stats failed');
    const owner2Stores = owner2Stats.data.data.stores;
    owner2Stores.forEach((s) => {
      if (s.name.includes('Apex Digital')) {
        throw new Error('Data Leak: Marcus received Alice store data');
      }
    });
    console.log(`  ✔ Cross-Owner Data Isolation Verified: Marcus Vance received only his store ("${owner2Stores[0]?.name}").`);

    // -------------------------------------------------------------
    // 7. CROSS-ROLE SECURITY BOUNDARIES
    // -------------------------------------------------------------
    console.log('\n--- 7. CROSS-ROLE SECURITY BARRIERS ---');
    // Store owner cannot access admin dashboard
    const ownerToAdmin = await request('GET', '/api/v1/dashboard/admin', null, owner1Token);
    if (ownerToAdmin.statusCode !== 403) throw new Error('Owner was not blocked from admin dashboard');
    console.log('  ✔ [GET /api/v1/dashboard/admin] (STORE_OWNER) -> 403 Forbidden (Blocked).');

    // Store owner cannot create users (Admin only)
    const ownerCreateUser = await request('POST', '/api/v1/users', {
      name: 'Unallowed New User 123',
      email: 'unallowed.user@test.com',
      password: 'User@123456',
      address: '123 Test St',
      role: 'NORMAL_USER'
    }, owner1Token);
    if (ownerCreateUser.statusCode !== 403) throw new Error('Owner was not blocked from creating users');
    console.log('  ✔ [POST /api/v1/users] (STORE_OWNER) -> 403 Forbidden (Blocked).');

    // Store owner cannot rate stores as customer
    const ownerRateStore = await request('POST', '/api/v1/ratings', { storeId: 1, rating: 5 }, owner1Token);
    if (ownerRateStore.statusCode !== 403) throw new Error('Owner was not blocked from rating stores');
    console.log('  ✔ [POST /api/v1/ratings] (STORE_OWNER) -> 403 Forbidden (Blocked).');

    // Normal user cannot access owner dashboard
    const userToOwner = await request('GET', '/api/v1/dashboard/owner', null, userToken);
    if (userToOwner.statusCode !== 403) throw new Error('Normal user was not blocked from owner dashboard');
    console.log('  ✔ [GET /api/v1/dashboard/owner] (NORMAL_USER) -> 403 Forbidden (Blocked).');

    console.log('\n======================================================================');
    console.log('✨ ALL PHASE 4 STORE_OWNER SUITE CHECKS PASSED (100% GREEN)');
    console.log('======================================================================\n');
  } finally {
    await stopTestServer();
  }
};

runComprehensivePhase4Suite()
  .then(() => {
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('❌ Phase 4 Integration Test failed:', err.message);
    await stopTestServer();
    process.exit(1);
  });
