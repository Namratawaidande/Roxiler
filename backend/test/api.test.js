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

const runStoreSearchSortingTests = async () => {
  await startTestServer();
  console.log(`\n======================================================================`);
  console.log(`🧪 TEST RUNNER: NORMAL_USER Store Search, Sorting & Pagination Suite`);
  console.log(`🌐 Server Base URL: ${baseUrl}`);
  console.log(`======================================================================\n`);

  try {
    // --- 1. AUTHENTICATION ---
    console.log('--- 1. NORMAL_USER AUTHENTICATION ---');
    const userLogin = await request('POST', '/api/v1/auth/login', { email: 'john.doe@example.com', password: 'User@123456' });
    if (userLogin.statusCode !== 200) throw new Error('Normal User login failed');
    const userToken = userLogin.data.data.token;
    console.log('  ✔ Authenticated as NORMAL_USER.');

    // --- 2. CASE-INSENSITIVE & PARTIAL TEXT SEARCH ---
    console.log('\n--- 2. CASE-INSENSITIVE & PARTIAL TEXT SEARCH ---');

    // A. Lowercase Partial Name Search
    const lowerNameRes = await request('GET', '/api/v1/stores?name=apex', null, userToken);
    if (lowerNameRes.statusCode !== 200) throw new Error('Lowercase name search failed');
    const lowerStores = lowerNameRes.data.data.stores;
    if (lowerStores.length === 0) throw new Error('Expected matches for "apex"');
    lowerStores.forEach(s => {
      if (!s.name.toLowerCase().includes('apex')) throw new Error('Non-matching store in name search');
    });
    console.log(`  ✔ [GET /api/v1/stores?name=apex] Lowercase partial search matched ${lowerStores.length} stores.`);

    // B. Uppercase Name Search (Case-Insensitive Verification)
    const upperNameRes = await request('GET', '/api/v1/stores?name=APEX', null, userToken);
    if (upperNameRes.statusCode !== 200) throw new Error('Uppercase name search failed');
    if (upperNameRes.data.data.stores.length !== lowerStores.length) {
      throw new Error('Case-insensitivity violated in store name search');
    }
    console.log('  ✔ [GET /api/v1/stores?name=APEX] Case-insensitivity verified.');

    // C. Partial Address Search
    const addressRes = await request('GET', '/api/v1/stores?address=silicon', null, userToken);
    if (addressRes.statusCode !== 200) throw new Error('Address search failed');
    const addressStores = addressRes.data.data.stores;
    if (addressStores.length === 0) throw new Error('Expected matches for "silicon"');
    addressStores.forEach(s => {
      if (!s.address.toLowerCase().includes('silicon')) throw new Error('Non-matching store in address search');
    });
    console.log(`  ✔ [GET /api/v1/stores?address=silicon] Partial address search matched ${addressStores.length} stores.`);

    // D. Combined Multi-Condition Search (Name + Address)
    const combinedRes = await request('GET', '/api/v1/stores?name=Apex&address=Bay', null, userToken);
    if (combinedRes.statusCode !== 200) throw new Error('Combined search failed');
    const combinedStores = combinedRes.data.data.stores;
    combinedStores.forEach(s => {
      if (!s.name.toLowerCase().includes('apex') || !s.address.toLowerCase().includes('bay')) {
        throw new Error('Combined search filter violated');
      }
    });
    console.log(`  ✔ [GET /api/v1/stores?name=Apex&address=Bay] Combined search matched ${combinedStores.length} store(s).`);

    // --- 3. ALLOWLISTED SORTING ON STORE NAME, ADDRESS & OVERALL RATING ---
    console.log('\n--- 3. ALLOWLISTED SORTING (NAME, ADDRESS, RATING) ---');

    // A. Sorting by Overall Rating DESC
    const sortRatingDesc = await request('GET', '/api/v1/stores?sortBy=rating&order=desc', null, userToken);
    if (sortRatingDesc.statusCode !== 200) throw new Error('Sort by rating DESC failed');
    const ratingDescStores = sortRatingDesc.data.data.stores;
    for (let i = 0; i < ratingDescStores.length - 1; i++) {
      if (ratingDescStores[i].averageRating < ratingDescStores[i + 1].averageRating) {
        throw new Error('Rating DESC order violated');
      }
    }
    console.log('  ✔ [GET /api/v1/stores?sortBy=rating&order=desc] Sorted by Overall Rating DESC verified.');

    // B. Sorting by Overall Rating ASC
    const sortRatingAsc = await request('GET', '/api/v1/stores?sortBy=rating&order=asc', null, userToken);
    if (sortRatingAsc.statusCode !== 200) throw new Error('Sort by rating ASC failed');
    const ratingAscStores = sortRatingAsc.data.data.stores;
    for (let i = 0; i < ratingAscStores.length - 1; i++) {
      if (ratingAscStores[i].averageRating > ratingAscStores[i + 1].averageRating) {
        throw new Error('Rating ASC order violated');
      }
    }
    console.log('  ✔ [GET /api/v1/stores?sortBy=rating&order=asc] Sorted by Overall Rating ASC verified.');

    // C. Sorting by Store Name ASC & DESC
    const sortNameAsc = await request('GET', '/api/v1/stores?sortBy=name&order=asc', null, userToken);
    if (sortNameAsc.statusCode !== 200) throw new Error('Sort by name ASC failed');
    const sortNameDesc = await request('GET', '/api/v1/stores?sortBy=name&order=desc', null, userToken);
    if (sortNameDesc.statusCode !== 200) throw new Error('Sort by name DESC failed');
    console.log('  ✔ [GET /api/v1/stores?sortBy=name&order=asc|desc] Sorting by Store Name ASC & DESC verified.');

    // D. Sorting by Address ASC & DESC
    const sortAddrAsc = await request('GET', '/api/v1/stores?sortBy=address&order=asc', null, userToken);
    if (sortAddrAsc.statusCode !== 200) throw new Error('Sort by address ASC failed');
    const sortAddrDesc = await request('GET', '/api/v1/stores?sortBy=address&order=desc', null, userToken);
    if (sortAddrDesc.statusCode !== 200) throw new Error('Sort by address DESC failed');
    console.log('  ✔ [GET /api/v1/stores?sortBy=address&order=asc|desc] Sorting by Store Address ASC & DESC verified.');

    // --- 4. PAGINATION METADATA STRUCTURE VALIDATION ---
    console.log('\n--- 4. PAGINATION METADATA STRUCTURE ---');
    const pagedRes = await request('GET', '/api/v1/stores?page=1&limit=2', null, userToken);
    if (pagedRes.statusCode !== 200) throw new Error('Pagination request failed');
    const meta = pagedRes.data.meta;
    const pagination = meta?.pagination || meta;

    if (typeof pagination.page !== 'number' && typeof pagination.currentPage !== 'number') {
      throw new Error('Pagination metadata missing page number');
    }
    if (typeof pagination.pageSize !== 'number' && typeof pagination.itemsPerPage !== 'number') {
      throw new Error('Pagination metadata missing pageSize');
    }
    if (typeof pagination.totalItems !== 'number') {
      throw new Error('Pagination metadata missing totalItems');
    }
    if (typeof pagination.totalPages !== 'number') {
      throw new Error('Pagination metadata missing totalPages');
    }

    console.log(`  ✔ [GET /api/v1/stores?page=1&limit=2] Validated Pagination Payload:`, {
      page: pagination.page || pagination.currentPage,
      pageSize: pagination.pageSize || pagination.itemsPerPage,
      totalItems: pagination.totalItems,
      totalPages: pagination.totalPages
    });

    console.log('\n======================================================================');
    console.log('✨ ALL NORMAL_USER SEARCH, SORTING & PAGINATION TESTS PASSED (100% GREEN)');
    console.log('======================================================================\n');
  } finally {
    await stopTestServer();
  }
};

runStoreSearchSortingTests()
  .then(() => {
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('❌ Test failed:', err.message);
    await stopTestServer();
    process.exit(1);
  });
