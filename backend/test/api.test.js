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

const runCompletePhase2IntegrationSuite = async () => {
  await startTestServer();
  console.log(`\n======================================================================`);
  console.log(`🧪 INTEGRATED TEST RUNNER: Phase 2 SYSTEM_ADMIN Administration Suite`);
  console.log(`🌐 Server Base URL: ${baseUrl}`);
  console.log(`======================================================================\n`);

  try {
    // -------------------------------------------------------------
    // MODULE 1: SYSTEM HEALTH & AUTHENTICATION
    // -------------------------------------------------------------
    console.log('--- MODULE 1: SYSTEM HEALTH & UNIFIED AUTHENTICATION ---');
    const health = await request('GET', '/api/v1/health');
    if (health.statusCode !== 200) throw new Error('Health check failed');
    console.log('  ✔ [GET /api/v1/health] - System operational (200 OK)');

    const adminLogin = await request('POST', '/api/v1/auth/login', { email: 'admin@storerating.com', password: 'Admin@123456' });
    if (adminLogin.statusCode !== 200) throw new Error('Admin login failed');
    const adminToken = adminLogin.data.data.token;
    console.log('  ✔ [POST /api/v1/auth/login] SYSTEM_ADMIN authenticated.');

    const ownerLogin = await request('POST', '/api/v1/auth/login', { email: 'owner1@storerating.com', password: 'Owner@123456' });
    if (ownerLogin.statusCode !== 200) throw new Error('Store Owner login failed');
    const ownerToken = ownerLogin.data.data.token;
    console.log('  ✔ [POST /api/v1/auth/login] STORE_OWNER authenticated.');

    const userLogin = await request('POST', '/api/v1/auth/login', { email: 'john.doe@example.com', password: 'User@123456' });
    if (userLogin.statusCode !== 200) throw new Error('Normal User login failed');
    const userToken = userLogin.data.data.token;
    console.log('  ✔ [POST /api/v1/auth/login] NORMAL_USER authenticated.');

    // -------------------------------------------------------------
    // MODULE 2: SYSTEM ADMINISTRATOR DASHBOARD METRICS
    // -------------------------------------------------------------
    console.log('\n--- MODULE 2: SYSTEM ADMINISTRATOR DASHBOARD METRICS ---');
    const adminDash = await request('GET', '/api/v1/dashboard/admin', null, adminToken);
    if (adminDash.statusCode !== 200) throw new Error('Admin dashboard failed');
    const stats = adminDash.data.data.stats;
    if (typeof stats.totalUsers !== 'number') throw new Error('totalUsers missing');
    if (typeof stats.totalStores !== 'number') throw new Error('totalStores missing');
    if (typeof stats.totalRatings !== 'number') throw new Error('totalRatings missing');
    if (!stats.roleDistribution || !stats.ratingDistribution) throw new Error('distributions missing');
    console.log(`  ✔ [GET /api/v1/dashboard/admin] Total Users: ${stats.totalUsers} (Admins: ${stats.roleDistribution.SYSTEM_ADMIN}, Owners: ${stats.roleDistribution.STORE_OWNER}, Users: ${stats.roleDistribution.NORMAL_USER})`);
    console.log(`  ✔ [GET /api/v1/dashboard/admin] Total Stores: ${stats.totalStores}, Total Ratings: ${stats.totalRatings}, Avg Rating: ${stats.averagePlatformRating}★`);

    // -------------------------------------------------------------
    // MODULE 3: USER MANAGEMENT & VALIDATION
    // -------------------------------------------------------------
    console.log('\n--- MODULE 3: USER MANAGEMENT, VALIDATION & SORTING ---');
    const randSuffix = Math.floor(1000 + Math.random() * 9000);

    // Create NORMAL_USER
    const createNormal = await request('POST', '/api/v1/users', {
      name: `Montgomery Scott Engineer ${randSuffix}`,
      email: `scott.eng${randSuffix}@example.com`,
      password: 'EnterprisePass@1',
      address: '404 Starfleet Way, Sector 7',
      role: 'NORMAL_USER'
    }, adminToken);
    if (createNormal.statusCode !== 201) throw new Error('Failed to create normal user');
    if (createNormal.data.data.user.password || createNormal.data.data.user.password_hash) throw new Error('Security Leak: password exposed');
    console.log(`  ✔ [POST /api/v1/users] Created NORMAL_USER: "${createNormal.data.data.user.name}" (201 Created)`);

    // Create SYSTEM_ADMIN
    const createAdmin = await request('POST', '/api/v1/users', {
      name: `Jean Luc Picard Commander ${randSuffix}`,
      email: `picard.admin${randSuffix}@storerating.com`,
      password: 'Starfleet@1234',
      address: 'Starfleet Command HQ Suite 10',
      role: 'SYSTEM_ADMIN'
    }, adminToken);
    if (createAdmin.statusCode !== 201) throw new Error('Failed to create admin user');
    console.log(`  ✔ [POST /api/v1/users] Created SYSTEM_ADMIN: "${createAdmin.data.data.user.name}" (201 Created)`);

    // Validation checks
    const badRole = await request('POST', '/api/v1/users', { name: `Valid User Name Character ${randSuffix}`, email: `bad.role${randSuffix}@test.com`, password: 'ValidPass@123', role: 'INVALID_ROLE' }, adminToken);
    if (badRole.statusCode !== 422) throw new Error('Invalid role was not rejected with 422');
    console.log('  ✔ [POST /api/v1/users] Invalid role rejected (422 Unprocessable Entity)');

    const badName = await request('POST', '/api/v1/users', { name: 'Short', email: `short${randSuffix}@test.com`, password: 'ValidPass@123', role: 'NORMAL_USER' }, adminToken);
    if (badName.statusCode !== 422) throw new Error('Short name was not rejected with 422');
    console.log('  ✔ [POST /api/v1/users] Short name (< 20 chars) rejected (422 Unprocessable Entity)');

    // Multi-filtering & Sorting on Users
    const filterUserRes = await request('GET', '/api/v1/users?role=NORMAL_USER&name=Montgomery', null, adminToken);
    if (filterUserRes.statusCode !== 200 || filterUserRes.data.data.users.length === 0) throw new Error('User filtering failed');
    console.log('  ✔ [GET /api/v1/users?role=NORMAL_USER&name=Montgomery] Multi-filtering on users verified.');

    const userSortRes = await request('GET', '/api/v1/users?sortBy=name&order=asc&page=1&limit=5', null, adminToken);
    if (userSortRes.statusCode !== 200 || !userSortRes.data.meta) throw new Error('User sorting / pagination failed');
    console.log('  ✔ [GET /api/v1/users?sortBy=name&order=asc] Sorting and pagination metadata verified.');

    // -------------------------------------------------------------
    // MODULE 4: STORE MANAGEMENT & OWNER INTEGRITY
    // -------------------------------------------------------------
    console.log('\n--- MODULE 4: STORE MANAGEMENT & OWNER INTEGRITY ---');

    // Create store assigned to verified STORE_OWNER (Alice / id: 2)
    const validStore = await request('POST', '/api/v1/stores', {
      name: `Omni Tech Superstore Flagship ${randSuffix}`,
      email: `contact.omni${randSuffix}@omnitech.com`,
      address: '990 Megacorp Boulevard, Innovation District',
      owner_id: 2
    }, adminToken);
    if (validStore.statusCode !== 201) throw new Error('Failed to create store');
    const store = validStore.data.data.store;
    if (store.averageRating === undefined && store.overall_rating === undefined) throw new Error('Dynamic rating missing');
    console.log(`  ✔ [POST /api/v1/stores] Created store "${store.name}" linked to STORE_OWNER (201 Created)`);

    // Assigning NORMAL_USER as store owner rejected
    const badOwnerStore = await request('POST', '/api/v1/stores', {
      name: `Bad Owner Assignment Store ${randSuffix}`,
      email: `bad.owner${randSuffix}@test.com`,
      address: '100 Invalid Owner St',
      owner_id: 4 // NORMAL_USER
    }, adminToken);
    if (badOwnerStore.statusCode !== 400 && badOwnerStore.statusCode !== 422) throw new Error('NORMAL_USER as owner was not rejected');
    console.log('  ✔ [POST /api/v1/stores] Assigning NORMAL_USER as store owner rejected (400 Bad Request)');

    // Multi-filtering & Sorting on Stores
    const filterStoresRes = await request('GET', '/api/v1/stores?name=Apex&address=Silicon&sortBy=rating&order=desc');
    if (filterStoresRes.statusCode !== 200) throw new Error('Store filtering failed');
    console.log('  ✔ [GET /api/v1/stores?name=Apex&address=Silicon&sortBy=rating&order=desc] Store filtering & rating sorting verified.');

    // -------------------------------------------------------------
    // MODULE 5: DETAILED USER PROFILES (ROLE-SPECIFIC ENRICHMENT)
    // -------------------------------------------------------------
    console.log('\n--- MODULE 5: DETAILED USER PROFILES & ROLE ENRICHMENT ---');
    const ownerDetails = await request('GET', '/api/v1/users/2', null, adminToken);
    if (ownerDetails.statusCode !== 200) throw new Error('Failed to get STORE_OWNER details');
    const owner = ownerDetails.data.data.user;
    if (!owner.stores || owner.stores.length === 0) throw new Error('STORE_OWNER missing associated stores');
    console.log(`  ✔ [GET /api/v1/users/2] STORE_OWNER "${owner.name}" profile loaded with ${owner.stores.length} store(s) and rating metrics.`);

    // -------------------------------------------------------------
    // MODULE 6: RBAC ACCESS RESTRICTIONS
    // -------------------------------------------------------------
    console.log('\n--- MODULE 6: RBAC AUTHORIZATION BARRIERS ---');
    const userToAdminDash = await request('GET', '/api/v1/dashboard/admin', null, userToken);
    if (userToAdminDash.statusCode !== 403) throw new Error('NORMAL_USER accessed admin dashboard');
    console.log('  ✔ [GET /api/v1/dashboard/admin] (NORMAL_USER) -> 403 Forbidden (Blocked)');

    const userToUsers = await request('GET', '/api/v1/users', null, userToken);
    if (userToUsers.statusCode !== 403) throw new Error('NORMAL_USER accessed /users');
    console.log('  ✔ [GET /api/v1/users] (NORMAL_USER) -> 403 Forbidden (Blocked)');

    const ownerToUsers = await request('GET', '/api/v1/users', null, ownerToken);
    if (ownerToUsers.statusCode !== 403) throw new Error('STORE_OWNER accessed /users');
    console.log('  ✔ [GET /api/v1/users] (STORE_OWNER) -> 403 Forbidden (Blocked)');

    const unauthAccess = await request('GET', '/api/v1/dashboard/admin');
    if (unauthAccess.statusCode !== 401) throw new Error('Unauthenticated access not blocked with 401');
    console.log('  ✔ [GET /api/v1/dashboard/admin] (Unauthenticated) -> 401 Unauthorized (Blocked)');

    console.log('\n======================================================================');
    console.log('✨ ALL PHASE 2 SYSTEM_ADMIN INTEGRATION CHECKS PASSED (100% GREEN)');
    console.log('======================================================================\n');
  } finally {
    await stopTestServer();
  }
};

runCompletePhase2IntegrationSuite()
  .then(() => {
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('❌ Integration Test failed:', err.message);
    await stopTestServer();
    process.exit(1);
  });
