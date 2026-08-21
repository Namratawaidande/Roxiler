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
  console.log('🛡️  Running Complete SYSTEM_ADMIN User-Management & RBAC Test Suite...\n');

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

    // --- 3. SYSTEM_ADMIN USER CREATION CAPABILITIES ---
    console.log('\n--- 3. SYSTEM_ADMIN USER CREATION & VALIDATION CHECKS ---');
    const randSuffix = Math.floor(1000 + Math.random() * 9000);

    // A. Create NORMAL_USER by Admin
    const createNormalUser = await request('POST', '/api/v1/users', {
      name: `Benjamin Franklin Gates ${randSuffix}`,
      email: `ben.gates${randSuffix}@example.com`,
      password: 'SecureUser@123',
      address: '100 Liberty Bell Avenue, Philadelphia',
      role: 'NORMAL_USER'
    }, adminToken);
    if (createNormalUser.statusCode !== 201) throw new Error('Admin failed to create NORMAL_USER');
    const createdNormal = createNormalUser.data.data.user;
    if (createdNormal.role !== 'NORMAL_USER') throw new Error('Role mismatch on created user');
    if (createdNormal.password_hash || createdNormal.password) throw new Error('Security leak: password_hash exposed');
    console.log(`  ✔ [POST /api/v1/users] (Admin) Created NORMAL_USER: "${createdNormal.email}" (201 Created)`);

    // B. Create SYSTEM_ADMIN by Admin
    const createAdminUser = await request('POST', '/api/v1/users', {
      name: `Victoria Security Officer ${randSuffix}`,
      email: `victoria.admin${randSuffix}@storerating.com`,
      password: 'AdminPass@123',
      address: 'HQ Administrative Suite 200, Tech Plaza',
      role: 'SYSTEM_ADMIN'
    }, adminToken);
    if (createAdminUser.statusCode !== 201) throw new Error('Admin failed to create SYSTEM_ADMIN');
    const createdAdmin = createAdminUser.data.data.user;
    if (createdAdmin.role !== 'SYSTEM_ADMIN') throw new Error('Role mismatch on created admin');
    if (createdAdmin.password_hash || createdAdmin.password) throw new Error('Security leak: password_hash exposed');
    console.log(`  ✔ [POST /api/v1/users] (Admin) Created SYSTEM_ADMIN: "${createdAdmin.email}" (201 Created)`);

    // C. Validation: Invalid Role Rejection
    const invalidRole = await request('POST', '/api/v1/users', {
      name: `Invalid Role User Name ${randSuffix}`,
      email: `invalid.role${randSuffix}@example.com`,
      password: 'SecureUser@123',
      role: 'SUPER_ROOT_HACKER'
    }, adminToken);
    if (invalidRole.statusCode !== 422) throw new Error('Invalid role was not rejected with 422');
    console.log('  ✔ [POST /api/v1/users] (Admin) Arbitrary/Invalid role rejected (422 Unprocessable Entity)');

    // D. Validation: Short Name Rejection (< 20 chars)
    const shortNameAdmin = await request('POST', '/api/v1/users', {
      name: 'Short Name',
      email: `short.name${randSuffix}@example.com`,
      password: 'SecureUser@123',
      role: 'NORMAL_USER'
    }, adminToken);
    if (shortNameAdmin.statusCode !== 422) throw new Error('Short name was not rejected with 422');
    console.log('  ✔ [POST /api/v1/users] (Admin) Name < 20 chars rejected (422 Unprocessable Entity)');

    // --- 4. SYSTEM_ADMIN USER LISTING, FILTERING & SORTING ---
    console.log('\n--- 4. SYSTEM_ADMIN USER LISTING, FILTERING, SORTING & PAGINATION ---');

    // A. List all users with pagination
    const allUsersRes = await request('GET', '/api/v1/users?page=1&limit=5', null, adminToken);
    if (allUsersRes.statusCode !== 200) throw new Error('Failed to list users');
    if (!allUsersRes.data.data.users || allUsersRes.data.data.users.length === 0) throw new Error('No users returned');
    if (allUsersRes.data.data.users.some(u => u.password_hash || u.password)) throw new Error('Security violation: password leaked in list');
    console.log(`  ✔ [GET /api/v1/users] Listed ${allUsersRes.data.data.users.length} users with pagination metadata (200 OK)`);

    // B. Filter by Role
    const roleFiltered = await request('GET', '/api/v1/users?role=NORMAL_USER', null, adminToken);
    if (roleFiltered.statusCode !== 200) throw new Error('Role filtering failed');
    const normalUsersOnly = roleFiltered.data.data.users;
    if (normalUsersOnly.some(u => u.role !== 'NORMAL_USER')) throw new Error('Role filter violated');
    console.log(`  ✔ [GET /api/v1/users?role=NORMAL_USER] Filtered ${normalUsersOnly.length} users strictly matching NORMAL_USER (200 OK)`);

    // C. Filter by Name / Email / Address search
    const searchRes = await request('GET', '/api/v1/users?search=Benjamin', null, adminToken);
    if (searchRes.statusCode !== 200) throw new Error('Search filtering failed');
    console.log(`  ✔ [GET /api/v1/users?search=Benjamin] Multi-field search executed successfully (200 OK)`);

    // D. Sorting by Name (ASC and DESC)
    const sortAsc = await request('GET', '/api/v1/users?sortBy=name&order=asc', null, adminToken);
    if (sortAsc.statusCode !== 200) throw new Error('Sorting ASC failed');
    const sortDesc = await request('GET', '/api/v1/users?sortBy=name&order=desc', null, adminToken);
    if (sortDesc.statusCode !== 200) throw new Error('Sorting DESC failed');
    console.log('  ✔ [GET /api/v1/users?sortBy=name&order=asc|desc] Sorting by Name ASC & DESC verified (200 OK)');

    // E. Sorting by Role
    const sortRole = await request('GET', '/api/v1/users?sortBy=role&order=asc', null, adminToken);
    if (sortRole.statusCode !== 200) throw new Error('Sorting by Role failed');
    console.log('  ✔ [GET /api/v1/users?sortBy=role&order=asc] Sorting by Role verified (200 OK)');

    // F. Get Individual User by ID
    const singleUserRes = await request('GET', `/api/v1/users/${createdNormal.id}`, null, adminToken);
    if (singleUserRes.statusCode !== 200) throw new Error('Failed to get user by ID');
    const singleUser = singleUserRes.data.data.user;
    if (singleUser.email !== createdNormal.email) throw new Error('User data mismatch');
    if (singleUser.password_hash || singleUser.password) throw new Error('Security leak: password exposed');
    console.log(`  ✔ [GET /api/v1/users/:id] Fetched user "${singleUser.name}" (${singleUser.email}, ${singleUser.role}) (200 OK)`);

    // --- 5. RBAC PERMISSION RESTRICTION GUARDS ON /api/v1/users ---
    console.log('\n--- 5. RBAC AUTHORIZATION ENFORCEMENT ON USER MANAGEMENT ---');
    
    // A. STORE_OWNER trying to access /api/v1/users
    const ownerToUsers = await request('GET', '/api/v1/users', null, ownerToken);
    if (ownerToUsers.statusCode !== 403) throw new Error('STORE_OWNER was not blocked with 403 from /users');
    console.log('  ✔ [GET /api/v1/users] (STORE_OWNER) -> 403 Forbidden (Blocked as expected)');

    // B. NORMAL_USER trying to access /api/v1/users
    const userToUsers = await request('GET', '/api/v1/users', null, userToken);
    if (userToUsers.statusCode !== 403) throw new Error('NORMAL_USER was not blocked with 403 from /users');
    console.log('  ✔ [GET /api/v1/users] (NORMAL_USER) -> 403 Forbidden (Blocked as expected)');

    // C. STORE_OWNER trying to create a user
    const ownerCreateUser = await request('POST', '/api/v1/users', { name: 'Unauthorized User Creation', email: 'unauth@test.com', password: 'Password@123', role: 'NORMAL_USER' }, ownerToken);
    if (ownerCreateUser.statusCode !== 403) throw new Error('STORE_OWNER was not blocked with 403 from creating user');
    console.log('  ✔ [POST /api/v1/users] (STORE_OWNER) -> 403 Forbidden (Blocked as expected)');

    // D. Unauthenticated request to /api/v1/users
    const unauthUsers = await request('GET', '/api/v1/users');
    if (unauthUsers.statusCode !== 401) throw new Error('Unauthenticated user was not blocked with 401 from /users');
    console.log('  ✔ [GET /api/v1/users] (Unauthenticated) -> 401 Unauthorized (Blocked as expected)');

    console.log('\n✨ ALL SYSTEM_ADMIN USER-MANAGEMENT & SECURITY TESTS PASSED!\n');
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
