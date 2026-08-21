const http = require('http');

const request = (method, path, body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(`http://localhost:5000${path}`);
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
  console.log('🛡️  Running Complete Role-Based Access Control (RBAC) Test Suite...\n');

  // 1. Unauthenticated Access Protection (401 Unauthorized)
  console.log('--- 1. UNAUTHENTICATED REQUEST CHECKS (401) ---');
  const unauthMe = await request('GET', '/api/v1/auth/me');
  if (unauthMe.statusCode !== 401) throw new Error('Unauthenticated /auth/me not blocked with 401');
  console.log('  ✔ [GET /api/v1/auth/me] (No Token) -> 401 Unauthorized');

  const unauthUsers = await request('GET', '/api/v1/users');
  if (unauthUsers.statusCode !== 401) throw new Error('Unauthenticated /users not blocked with 401');
  console.log('  ✔ [GET /api/v1/users] (No Token) -> 401 Unauthorized');

  const unauthDash = await request('GET', '/api/v1/dashboard/admin');
  if (unauthDash.statusCode !== 401) throw new Error('Unauthenticated /dashboard/admin not blocked with 401');
  console.log('  ✔ [GET /api/v1/dashboard/admin] (No Token) -> 401 Unauthorized');

  // Authenticate accounts for testing
  console.log('\n--- 2. AUTHENTICATING TEST ROLES ---');
  const adminLogin = await request('POST', '/api/v1/auth/login', { email: 'admin@storerating.com', password: 'Admin@123456' });
  const adminToken = adminLogin.data.data.token;
  console.log('  ✔ SYSTEM_ADMIN authenticated.');

  const ownerLogin = await request('POST', '/api/v1/auth/login', { email: 'owner1@storerating.com', password: 'Owner@123456' });
  const ownerToken = ownerLogin.data.data.token;
  console.log('  ✔ STORE_OWNER authenticated.');

  const userLogin = await request('POST', '/api/v1/auth/login', { email: 'john.doe@example.com', password: 'User@123456' });
  const userToken = userLogin.data.data.token;
  console.log('  ✔ NORMAL_USER authenticated.');

  // 3. SYSTEM_ADMIN Role Checks
  console.log('\n--- 3. SYSTEM_ADMIN PERMISSION ENFORCEMENT ---');
  const adminGetUsers = await request('GET', '/api/v1/users', null, adminToken);
  if (adminGetUsers.statusCode !== 200) throw new Error('Admin failed to access /users');
  console.log('  ✔ [GET /api/v1/users] (Admin) -> 200 OK');

  const adminGetDash = await request('GET', '/api/v1/dashboard/admin', null, adminToken);
  if (adminGetDash.statusCode !== 200) throw new Error('Admin failed to access /dashboard/admin');
  console.log('  ✔ [GET /api/v1/dashboard/admin] (Admin) -> 200 OK');

  // 4. STORE_OWNER Role Checks
  console.log('\n--- 4. STORE_OWNER PERMISSION & RESTRICTION ENFORCEMENT ---');
  const ownerDash = await request('GET', '/api/v1/dashboard/owner', null, ownerToken);
  if (ownerDash.statusCode !== 200) throw new Error('Store Owner failed to access /dashboard/owner');
  console.log('  ✔ [GET /api/v1/dashboard/owner] (Store Owner) -> 200 OK');

  const ownerCreateStore = await request('POST', '/api/v1/stores', { name: 'Owner Test Store', email: 'test@ownerstore.com', address: '123 Test St' }, ownerToken);
  if (ownerCreateStore.statusCode !== 201) throw new Error('Store Owner failed to create store');
  console.log('  ✔ [POST /api/v1/stores] (Store Owner) -> 201 Created');

  // Forbidden: Store Owner accessing Admin APIs
  const ownerAdminUsers = await request('GET', '/api/v1/users', null, ownerToken);
  if (ownerAdminUsers.statusCode !== 403) throw new Error('Store Owner was not blocked from /users with 403');
  console.log('  ✔ [GET /api/v1/users] (Store Owner) -> 403 Forbidden (Blocked as expected)');

  const ownerAdminDash = await request('GET', '/api/v1/dashboard/admin', null, ownerToken);
  if (ownerAdminDash.statusCode !== 403) throw new Error('Store Owner was not blocked from /dashboard/admin with 403');
  console.log('  ✔ [GET /api/v1/dashboard/admin] (Store Owner) -> 403 Forbidden (Blocked as expected)');

  // Forbidden: Store Owner submitting rating
  const ownerRate = await request('POST', '/api/v1/ratings', { storeId: 1, rating: 5, comment: 'Nice' }, ownerToken);
  if (ownerRate.statusCode !== 403) throw new Error('Store Owner was not blocked from submitting rating with 403');
  console.log('  ✔ [POST /api/v1/ratings] (Store Owner) -> 403 Forbidden (Blocked as expected)');

  // 5. NORMAL_USER Role Checks
  console.log('\n--- 5. NORMAL_USER PERMISSION & RESTRICTION ENFORCEMENT ---');
  const userDash = await request('GET', '/api/v1/dashboard/user', null, userToken);
  if (userDash.statusCode !== 200) throw new Error('Normal User failed to access /dashboard/user');
  console.log('  ✔ [GET /api/v1/dashboard/user] (Normal User) -> 200 OK');

  const userRate = await request('POST', '/api/v1/ratings', { storeId: 1, rating: 5, comment: 'Verified user review' }, userToken);
  if (userRate.statusCode !== 200) throw new Error('Normal User failed to submit rating');
  console.log('  ✔ [POST /api/v1/ratings] (Normal User) -> 200 OK');

  // Forbidden: Normal User accessing Admin APIs
  const userAdminUsers = await request('GET', '/api/v1/users', null, userToken);
  if (userAdminUsers.statusCode !== 403) throw new Error('Normal User was not blocked from /users with 403');
  console.log('  ✔ [GET /api/v1/users] (Normal User) -> 403 Forbidden (Blocked as expected)');

  const userAdminDash = await request('GET', '/api/v1/dashboard/admin', null, userToken);
  if (userAdminDash.statusCode !== 403) throw new Error('Normal User was not blocked from /dashboard/admin with 403');
  console.log('  ✔ [GET /api/v1/dashboard/admin] (Normal User) -> 403 Forbidden (Blocked as expected)');

  // Forbidden: Normal User accessing Store Owner Dashboard
  const userOwnerDash = await request('GET', '/api/v1/dashboard/owner', null, userToken);
  if (userOwnerDash.statusCode !== 403) throw new Error('Normal User was not blocked from /dashboard/owner with 403');
  console.log('  ✔ [GET /api/v1/dashboard/owner] (Normal User) -> 403 Forbidden (Blocked as expected)');

  // Forbidden: Normal User creating a store
  const userCreateStore = await request('POST', '/api/v1/stores', { name: 'Illegal User Store', email: 'illegal@user.com', address: '123 Main' }, userToken);
  if (userCreateStore.statusCode !== 403) throw new Error('Normal User was not blocked from creating store with 403');
  console.log('  ✔ [POST /api/v1/stores] (Normal User) -> 403 Forbidden (Blocked as expected)');

  console.log('\n✨ ALL ROLE-BASED ACCESS CONTROL (RBAC) & SECURITY MATRIX CHECKS PASSED!\n');
};

runTests().catch((err) => {
  console.error('❌ Test failed:', err.message);
  process.exit(1);
});
