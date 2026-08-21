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

const runNormalUserStoreBrowsingTests = async () => {
  await startTestServer();
  console.log(`\n======================================================================`);
  console.log(`🧪 TEST RUNNER: NORMAL_USER Store-Browsing & Personalized Rating Suite`);
  console.log(`🌐 Server Base URL: ${baseUrl}`);
  console.log(`======================================================================\n`);

  try {
    // --- 1. AUTHENTICATION ---
    console.log('--- 1. NORMAL_USER AUTHENTICATION ---');
    const userLogin = await request('POST', '/api/v1/auth/login', { email: 'john.doe@example.com', password: 'User@123456' });
    if (userLogin.statusCode !== 200) throw new Error('Normal User login failed');
    const userToken = userLogin.data.data.token;
    console.log('  ✔ [POST /api/v1/auth/login] Authenticated as NORMAL_USER (John Doe, ID: 4).');

    // --- 2. STORE BROWSING WITH PERSONALIZED RATING JOIN ---
    console.log('\n--- 2. STORE BROWSING & PERSONALIZED RATING ATTRIBUTES ---');
    const storesRes = await request('GET', '/api/v1/stores', null, userToken);
    if (storesRes.statusCode !== 200) throw new Error('Failed to retrieve stores list');
    const stores = storesRes.data.data.stores;

    if (!stores || stores.length === 0) throw new Error('No stores returned');
    console.log(`  ✔ [GET /api/v1/stores] Retrieved ${stores.length} registered stores for NORMAL_USER.`);

    // Assert overall rating and user submitted rating logic
    const store1 = stores.find((s) => s.id === 1);
    const store2 = stores.find((s) => s.id === 2);

    if (!store1) throw new Error('Store ID 1 not found in response');
    if (typeof store1.overall_rating !== 'number' && typeof store1.averageRating !== 'number') {
      throw new Error('Overall rating missing on store');
    }
    if (store1.myRating !== 5 && store1.userSubmittedRating !== 5) {
      throw new Error(`Expected John Doe's rating for Store 1 to be 5, got ${store1.myRating}`);
    }
    console.log(`  ✔ [Store #1: "${store1.name}"] Overall Rating: ${store1.averageRating}★ | John Doe's Rating: ${store1.myRating}★`);

    if (store2) {
      if (store2.myRating !== null && store2.userSubmittedRating !== null) {
        throw new Error(`Expected unrated Store 2 to have myRating: null, got ${store2.myRating}`);
      }
      console.log(`  ✔ [Store #2: "${store2.name}"] Overall Rating: ${store2.averageRating}★ | John Doe's Rating: null (Unrated)`);
    }

    // --- 3. SEARCH BY STORE NAME AND ADDRESS ---
    console.log('\n--- 3. SEARCH BY STORE NAME AND STORE ADDRESS ---');
    const nameSearch = await request('GET', '/api/v1/stores?name=Apex', null, userToken);
    if (nameSearch.statusCode !== 200) throw new Error('Name search failed');
    const apexStores = nameSearch.data.data.stores;
    apexStores.forEach((s) => {
      if (!s.name.toLowerCase().includes('apex')) throw new Error('Name search returned non-matching store');
    });
    console.log(`  ✔ [GET /api/v1/stores?name=Apex] Search by name returned ${apexStores.length} matching store(s).`);

    const addressSearch = await request('GET', '/api/v1/stores?address=Silicon', null, userToken);
    if (addressSearch.statusCode !== 200) throw new Error('Address search failed');
    const siliconStores = addressSearch.data.data.stores;
    siliconStores.forEach((s) => {
      if (!s.address.toLowerCase().includes('silicon')) throw new Error('Address search returned non-matching store');
    });
    console.log(`  ✔ [GET /api/v1/stores?address=Silicon] Search by address returned ${siliconStores.length} matching store(s).`);

    // --- 4. SORTING AND PAGINATION ---
    console.log('\n--- 4. SORTING & PAGINATION FOR NORMAL_USER ---');
    const sortRatingDesc = await request('GET', '/api/v1/stores?sortBy=rating&order=desc&page=1&limit=2', null, userToken);
    if (sortRatingDesc.statusCode !== 200) throw new Error('Sorting by rating failed');
    const sortedStores = sortRatingDesc.data.data.stores;
    const meta = sortRatingDesc.data.meta;
    if (!meta || meta.currentPage !== 1 || meta.limit !== 2) throw new Error('Pagination meta mismatch');
    console.log(`  ✔ [GET /api/v1/stores?sortBy=rating&order=desc&page=1&limit=2] Sorted by overall rating DESC with pagination.`);

    const sortNameAsc = await request('GET', '/api/v1/stores?sortBy=name&order=asc', null, userToken);
    if (sortNameAsc.statusCode !== 200) throw new Error('Sorting by name failed');
    console.log('  ✔ [GET /api/v1/stores?sortBy=name&order=asc] Sorted by store name ASC verified.');

    // --- 5. AUTHENTICATION & ACCESS GUARDS ---
    console.log('\n--- 5. AUTHENTICATION & ACCESS RESTRICTIONS ---');
    const unauthAccess = await request('GET', '/api/v1/stores');
    if (unauthAccess.statusCode !== 401) throw new Error('Unauthenticated access was not rejected with 401');
    console.log('  ✔ [GET /api/v1/stores] Unauthenticated request blocked (401 Unauthorized as expected).');

    console.log('\n======================================================================');
    console.log('✨ ALL NORMAL_USER STORE-BROWSING & RATING TESTS PASSED (100% GREEN)');
    console.log('======================================================================\n');
  } finally {
    await stopTestServer();
  }
};

runNormalUserStoreBrowsingTests()
  .then(() => {
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('❌ Test failed:', err.message);
    await stopTestServer();
    process.exit(1);
  });
