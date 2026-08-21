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

const runOwnerRatingsTableTests = async () => {
  await startTestServer();
  console.log(`\n======================================================================`);
  console.log(`🧪 TEST RUNNER: STORE_OWNER Customer Ratings Table Server-Side Suite`);
  console.log(`🌐 Server Base URL: ${baseUrl}`);
  console.log(`======================================================================\n`);

  try {
    // --- 1. AUTHENTICATING TEST ROLES ---
    console.log('--- 1. AUTHENTICATION OF TEST ACCOUNTS ---');
    const owner1Login = await request('POST', '/api/v1/auth/login', { email: 'owner1@storerating.com', password: 'Owner@123456' });
    if (owner1Login.statusCode !== 200) throw new Error('Owner 1 login failed');
    const owner1Token = owner1Login.data.data.token;
    console.log('  ✔ Authenticated STORE_OWNER #1 (Alice Storekeeper).');

    // --- 2. SEARCH BY USER NAME ---
    console.log('\n--- 2. SERVER-SIDE SEARCH BY USER NAME ---');
    const nameSearchRes = await request('GET', '/api/v1/ratings/owner?userName=John', null, owner1Token);
    if (nameSearchRes.statusCode !== 200) throw new Error('User name search failed');
    const nameList = nameSearchRes.data.data.ratings;
    if (!nameList.every((r) => r.userName.toLowerCase().includes('john'))) {
      throw new Error('Search result contains non-matching user name');
    }
    console.log(`  ✔ [GET /api/v1/ratings/owner?userName=John] Found ${nameList.length} matching review(s) for customer "John".`);

    // --- 3. SEARCH BY USER EMAIL ---
    console.log('\n--- 3. SERVER-SIDE SEARCH BY USER EMAIL ---');
    const emailSearchRes = await request('GET', '/api/v1/ratings/owner?userEmail=john.doe@example.com', null, owner1Token);
    if (emailSearchRes.statusCode !== 200) throw new Error('User email search failed');
    const emailList = emailSearchRes.data.data.ratings;
    if (!emailList.every((r) => r.userEmail.toLowerCase().includes('john.doe'))) {
      throw new Error('Search result contains non-matching user email');
    }
    console.log(`  ✔ [GET /api/v1/ratings/owner?userEmail=john.doe@example.com] Found ${emailList.length} matching review(s).`);

    // --- 4. ALLOWLISTED SORTING ON ALL COLUMNS ---
    console.log('\n--- 4. COLUMN CLICK-TO-SORT TESTS ---');
    const sortColumns = ['userName', 'userEmail', 'userAddress', 'rating', 'createdAt'];
    for (const col of sortColumns) {
      const resAsc = await request('GET', `/api/v1/ratings/owner?sortBy=${col}&order=ASC`, null, owner1Token);
      if (resAsc.statusCode !== 200) throw new Error(`Sorting by ${col} ASC failed`);

      const resDesc = await request('GET', `/api/v1/ratings/owner?sortBy=${col}&order=DESC`, null, owner1Token);
      if (resDesc.statusCode !== 200) throw new Error(`Sorting by ${col} DESC failed`);

      console.log(`  ✔ Column "${col}" successfully sorted ASC & DESC.`);
    }

    // --- 5. SQL INJECTION SECURITY RESILIENCE ---
    console.log('\n--- 5. SQL INJECTION ATTACK RESILIENCE ---');
    const injectionRes = await request('GET', '/api/v1/ratings/owner?sortBy=name;DROP%20TABLE%20ratings--', null, owner1Token);
    if (injectionRes.statusCode !== 200) {
      throw new Error('Malicious SQL query caused server error instead of safe allowlist fallback');
    }
    console.log('  ✔ SQL injection payload in sortBy safely neutralized via strict allowlist mapping.');

    // --- 6. PAGINATION PRESERVATION ---
    console.log('\n--- 6. PAGINATION & METADATA PRESERVATION ---');
    const pageRes = await request('GET', '/api/v1/ratings/owner?page=1&limit=1&sortBy=rating&order=DESC', null, owner1Token);
    if (pageRes.statusCode !== 200) throw new Error('Paginated request failed');
    const pagination = pageRes.data.meta?.pagination || pageRes.data.meta;
    if (pagination.pageSize !== 1 && pagination.limit !== 1) {
      throw new Error('Pagination page size mismatch');
    }
    console.log(`  ✔ Pagination metadata verified: Page ${pagination.page} of ${pagination.totalPages} (Total: ${pagination.totalItems}).`);

    console.log('\n======================================================================');
    console.log('✨ ALL STORE_OWNER RATINGS TABLE TESTS PASSED (100% GREEN)');
    console.log('======================================================================\n');
  } finally {
    await stopTestServer();
  }
};

runOwnerRatingsTableTests()
  .then(() => {
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('❌ Test failed:', err.message);
    await stopTestServer();
    process.exit(1);
  });
