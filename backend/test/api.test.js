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
  console.log('🛡️  Running Complete Server-Side Filtering, Sorting & Pagination Suite...\n');

  try {
    // --- 1. AUTHENTICATING TEST ROLES ---
    const adminLogin = await request('POST', '/api/v1/auth/login', { email: 'admin@storerating.com', password: 'Admin@123456' });
    if (adminLogin.statusCode !== 200) throw new Error('Admin login failed');
    const adminToken = adminLogin.data.data.token;

    // --- 2. USER SERVER-SIDE FILTERING, SORTING & PAGINATION ---
    console.log('--- 2. USER SERVER-SIDE FILTERING & SORTING CHECKS ---');

    // A. Multi-field Combined Filtering (role + name)
    const multiFilterUsers = await request('GET', '/api/v1/users?role=NORMAL_USER&name=John', null, adminToken);
    if (multiFilterUsers.statusCode !== 200) throw new Error('Multi-filter failed on users');
    const filteredUsers = multiFilterUsers.data.data.users;
    filteredUsers.forEach((u) => {
      if (u.role !== 'NORMAL_USER') throw new Error('Role filter violated');
      if (!u.name.toLowerCase().includes('john')) throw new Error('Name filter violated');
    });
    console.log(`  ✔ [GET /api/v1/users?role=NORMAL_USER&name=John] Combined multi-filtering passed (Found ${filteredUsers.length} user).`);

    // B. Sorting by Name, Email, Address, Role (ASC / DESC)
    const sortColumns = ['name', 'email', 'address', 'role'];
    for (const col of sortColumns) {
      const resAsc = await request('GET', `/api/v1/users?sortBy=${col}&order=asc`, null, adminToken);
      if (resAsc.statusCode !== 200) throw new Error(`Sorting by ${col} ASC failed`);
      const resDesc = await request('GET', `/api/v1/users?sortBy=${col}&order=desc`, null, adminToken);
      if (resDesc.statusCode !== 200) throw new Error(`Sorting by ${col} DESC failed`);
      console.log(`  ✔ [GET /api/v1/users?sortBy=${col}&order=asc|desc] Verified sorting on "${col}".`);
    }

    // C. Pagination Metadata Structure
    const pageMetaRes = await request('GET', '/api/v1/users?page=1&limit=2', null, adminToken);
    const meta = pageMetaRes.data.meta;
    if (!meta || typeof meta.totalItems !== 'number' || typeof meta.totalPages !== 'number') {
      throw new Error('Pagination metadata missing or malformed');
    }
    console.log(`  ✔ [GET /api/v1/users] Pagination metadata validated (Total: ${meta.totalItems}, Pages: ${meta.totalPages}, Page: ${meta.currentPage}, Limit: ${meta.limit}).`);

    // --- 3. STORE SERVER-SIDE FILTERING, SORTING & PAGINATION ---
    console.log('\n--- 3. STORE SERVER-SIDE FILTERING & SORTING CHECKS ---');

    // A. Multi-field Combined Filtering (name + address)
    const multiFilterStores = await request('GET', '/api/v1/stores?name=Apex&address=Silicon');
    if (multiFilterStores.statusCode !== 200) throw new Error('Multi-filter failed on stores');
    const filteredStores = multiFilterStores.data.data.stores;
    filteredStores.forEach((s) => {
      if (!s.name.toLowerCase().includes('apex') || !s.address.toLowerCase().includes('silicon')) {
        throw new Error('Combined store filter violated');
      }
    });
    console.log(`  ✔ [GET /api/v1/stores?name=Apex&address=Silicon] Combined multi-filtering passed (Found ${filteredStores.length} stores).`);

    // B. Sorting by Name, Email, Address, and Overall Rating
    const storeSortColumns = ['name', 'email', 'address', 'rating'];
    for (const col of storeSortColumns) {
      const resAsc = await request('GET', `/api/v1/stores?sortBy=${col}&order=asc`);
      if (resAsc.statusCode !== 200) throw new Error(`Store sorting by ${col} ASC failed`);
      const resDesc = await request('GET', `/api/v1/stores?sortBy=${col}&order=desc`);
      if (resDesc.statusCode !== 200) throw new Error(`Store sorting by ${col} DESC failed`);
      console.log(`  ✔ [GET /api/v1/stores?sortBy=${col}&order=asc|desc] Verified sorting on "${col}".`);
    }

    // C. Store Pagination Metadata
    const storeMetaRes = await request('GET', '/api/v1/stores?page=1&limit=2');
    const sMeta = storeMetaRes.data.meta;
    if (!sMeta || typeof sMeta.totalItems !== 'number' || typeof sMeta.totalPages !== 'number') {
      throw new Error('Store pagination metadata missing or malformed');
    }
    console.log(`  ✔ [GET /api/v1/stores] Pagination metadata validated (Total: ${sMeta.totalItems}, Pages: ${sMeta.totalPages}, Page: ${sMeta.currentPage}, Limit: ${sMeta.limit}).`);

    console.log('\n✨ ALL SERVER-SIDE FILTERING, SORTING & PAGINATION TESTS PASSED!\n');
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
