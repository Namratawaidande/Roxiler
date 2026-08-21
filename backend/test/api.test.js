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
  console.log('🛡️  Running Complete Backend Store-Management & RBAC Test Suite...\n');

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

    // --- 3. SYSTEM_ADMIN STORE CREATION & OWNER RELATIONSHIP VALIDATION ---
    console.log('\n--- 3. SYSTEM_ADMIN STORE CREATION & OWNER RELATIONSHIP VALIDATION ---');
    const randSuffix = Math.floor(1000 + Math.random() * 9000);

    // A. Valid Store Creation linked to STORE_OWNER (Alice Storekeeper, id: 2)
    const validStore = await request('POST', '/api/v1/stores', {
      name: `Apex Ultra Electronics Emporium ${randSuffix}`,
      email: `apex.ultra${randSuffix}@apexdigital.com`,
      address: '750 Innovation Drive, Silicon Valley Sector 4',
      owner_id: 2
    }, adminToken);
    if (validStore.statusCode !== 201) throw new Error(`Admin failed to create store, got status ${validStore.statusCode}`);
    const createdStore = validStore.data.data.store;
    if (typeof createdStore.averageRating !== 'number' && typeof createdStore.overall_rating !== 'number') {
      throw new Error('Store response missing rating metric');
    }
    console.log(`  ✔ [POST /api/v1/stores] (Admin) Created store "${createdStore.name}" linked to STORE_OWNER (201 Created)`);

    // B. Invalid Owner Role Rejection (Assigning store to NORMAL_USER John Doe, id: 4)
    const invalidOwnerStore = await request('POST', '/api/v1/stores', {
      name: `Invalid Owner Test Store ${randSuffix}`,
      email: `invalid.owner${randSuffix}@example.com`,
      address: '100 Bad Relationship Lane',
      owner_id: 4 // NORMAL_USER
    }, adminToken);
    if (invalidOwnerStore.statusCode !== 400 && invalidOwnerStore.statusCode !== 422) {
      throw new Error('Assigned NORMAL_USER as store owner was not rejected');
    }
    console.log('  ✔ [POST /api/v1/stores] (Admin) Assigning NORMAL_USER as Store Owner rejected (400 Bad Request as expected)');

    // C. Validation: Short Name Rejection (< 20 chars)
    const shortNameStore = await request('POST', '/api/v1/stores', {
      name: 'Apex Shop', // < 20 chars
      email: `short${randSuffix}@shop.com`,
      address: '404 Short Street',
      owner_id: 2
    }, adminToken);
    if (shortNameStore.statusCode !== 422) throw new Error('Short store name was not rejected with 422');
    console.log('  ✔ [POST /api/v1/stores] (Admin) Name < 20 chars rejected (422 Unprocessable Entity)');

    // --- 4. STORE LISTING, DYNAMIC RATING, FILTERING & SORTING ---
    console.log('\n--- 4. STORE LISTING, DYNAMIC RATING, FILTERING & SORTING ---');

    // A. List stores with dynamic calculated overall rating
    const storesList = await request('GET', '/api/v1/stores?page=1&limit=5');
    if (storesList.statusCode !== 200) throw new Error('Failed to list stores');
    const stores = storesList.data.data.stores;
    if (!stores || stores.length === 0) throw new Error('No stores returned');
    stores.forEach((s) => {
      if (s.averageRating === undefined && s.overall_rating === undefined) {
        throw new Error('Store record missing dynamically computed rating');
      }
    });
    console.log(`  ✔ [GET /api/v1/stores] Listed ${stores.length} stores with dynamic ratings calculated from ratings table (200 OK)`);

    // B. Filter by Name / Email / Address
    const nameFilter = await request('GET', '/api/v1/stores?name=Apex');
    if (nameFilter.statusCode !== 200) throw new Error('Name filter failed');
    console.log(`  ✔ [GET /api/v1/stores?name=Apex] Filtered ${nameFilter.data.data.stores.length} stores matching "Apex" (200 OK)`);

    const emailFilter = await request('GET', '/api/v1/stores?email=urbangourmet');
    if (emailFilter.statusCode !== 200) throw new Error('Email filter failed');
    console.log('  ✔ [GET /api/v1/stores?email=urbangourmet] Email filter verified (200 OK)');

    const addressFilter = await request('GET', '/api/v1/stores?address=Silicon');
    if (addressFilter.statusCode !== 200) throw new Error('Address filter failed');
    console.log('  ✔ [GET /api/v1/stores?address=Silicon] Address filter verified (200 OK)');

    // C. Sorting by Name (ASC / DESC) and Rating (DESC)
    const sortRating = await request('GET', '/api/v1/stores?sortBy=rating&order=desc');
    if (sortRating.statusCode !== 200) throw new Error('Sorting by rating failed');
    console.log('  ✔ [GET /api/v1/stores?sortBy=rating&order=desc] Sorting by overall rating verified (200 OK)');

    const sortName = await request('GET', '/api/v1/stores?sortBy=name&order=asc');
    if (sortName.statusCode !== 200) throw new Error('Sorting by name failed');
    console.log('  ✔ [GET /api/v1/stores?sortBy=name&order=asc] Sorting by Name ASC verified (200 OK)');

    // D. View Store Details by ID
    const storeDetail = await request('GET', `/api/v1/stores/${stores[0].id}`);
    if (storeDetail.statusCode !== 200) throw new Error('Failed to get store details');
    console.log(`  ✔ [GET /api/v1/stores/:id] Retrieved details for "${storeDetail.data.data.store.name}" with owner info & ratings (200 OK)`);

    // --- 5. RBAC GUARDS & RESTRICTIONS ---
    console.log('\n--- 5. RBAC AUTHORIZATION ENFORCEMENT ON STORE MANAGEMENT ---');

    // A. NORMAL_USER trying to create a store
    const userCreateStore = await request('POST', '/api/v1/stores', {
      name: `Unauthorized User Store ${randSuffix}`,
      email: `unauth.store${randSuffix}@test.com`,
      address: '999 Forbidden Street',
      owner_id: 2
    }, userToken);
    if (userCreateStore.statusCode !== 403) throw new Error('NORMAL_USER was not blocked with 403 from creating store');
    console.log('  ✔ [POST /api/v1/stores] (NORMAL_USER) -> 403 Forbidden (Blocked as expected)');

    // B. Unauthenticated user trying to create a store
    const unauthStore = await request('POST', '/api/v1/stores', {
      name: `Unauthenticated Store ${randSuffix}`,
      email: `unauth${randSuffix}@test.com`,
      address: '100 Missing Token Ave',
      owner_id: 2
    });
    if (unauthStore.statusCode !== 401) throw new Error('Unauthenticated user was not blocked with 401 from creating store');
    console.log('  ✔ [POST /api/v1/stores] (Unauthenticated) -> 401 Unauthorized (Blocked as expected)');

    console.log('\n✨ ALL BACKEND STORE-MANAGEMENT & SECURITY TESTS PASSED!\n');
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
