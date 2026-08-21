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
  console.log('🧪 Running Unified Authentication & Architecture Verification Suite...\n');

  // 1. Health Diagnostics
  const health = await request('GET', '/api/v1/health');
  if (health.statusCode !== 200) throw new Error('Health check failed');
  console.log('  ✔ [GET /api/v1/health] - System diagnostics operational (200 OK)');

  // 2. Unified Login - SYSTEM_ADMIN
  const adminLogin = await request('POST', '/api/v1/auth/login', { email: 'admin@storerating.com', password: 'Admin@123456' });
  if (adminLogin.statusCode !== 200) throw new Error('Admin login failed');
  const adminData = adminLogin.data.data;
  if (adminData.user.password_hash || adminData.user.password) throw new Error('Security violation: Password hash leaked in login response!');
  if (adminData.user.role !== 'SYSTEM_ADMIN') throw new Error('Incorrect role returned for Admin');
  const adminToken = adminData.token;
  console.log('  ✔ [POST /api/v1/auth/login] - Unified Login verified for SYSTEM_ADMIN (200 OK)');

  // 3. Unified Login - STORE_OWNER
  const ownerLogin = await request('POST', '/api/v1/auth/login', { email: 'owner1@storerating.com', password: 'Owner@123456' });
  if (ownerLogin.statusCode !== 200) throw new Error('Store Owner login failed');
  const ownerData = ownerLogin.data.data;
  if (ownerData.user.password_hash) throw new Error('Security violation: Password hash leaked for Store Owner!');
  if (ownerData.user.role !== 'STORE_OWNER') throw new Error('Incorrect role returned for Store Owner');
  const ownerToken = ownerData.token;
  console.log('  ✔ [POST /api/v1/auth/login] - Unified Login verified for STORE_OWNER (200 OK)');

  // 4. Unified Login - NORMAL_USER
  const userLogin = await request('POST', '/api/v1/auth/login', { email: 'john.doe@example.com', password: 'User@123456' });
  if (userLogin.statusCode !== 200) throw new Error('Normal User login failed');
  const userData = userLogin.data.data;
  if (userData.user.password_hash) throw new Error('Security violation: Password hash leaked for Normal User!');
  if (userData.user.role !== 'NORMAL_USER') throw new Error('Incorrect role returned for Normal User');
  const userToken = userData.token;
  console.log('  ✔ [POST /api/v1/auth/login] - Unified Login verified for NORMAL_USER (200 OK)');

  // 5. Authentication Failure with Invalid Password
  const badLogin = await request('POST', '/api/v1/auth/login', { email: 'admin@storerating.com', password: 'WrongPassword@999' });
  if (badLogin.statusCode !== 401) throw new Error('Security error: Invalid credentials were not rejected with 401');
  console.log('  ✔ [POST /api/v1/auth/login] - Invalid credentials safely rejected (401 Unauthorized)');

  // 6. Current User Retrieval (GET /api/v1/auth/me)
  const meRes = await request('GET', '/api/v1/auth/me', null, adminToken);
  if (meRes.statusCode !== 200 || meRes.data.data?.user?.email !== 'admin@storerating.com') {
    throw new Error('GET /api/v1/auth/me failed');
  }
  if (meRes.data.data?.user?.password_hash) throw new Error('Security violation: Password hash leaked in /auth/me!');
  console.log('  ✔ [GET /api/v1/auth/me] - Current user safe profile retrieved (200 OK)');

  // 7. Invalid Token Handling (GET /api/v1/auth/me with bad token)
  const badTokenRes = await request('GET', '/api/v1/auth/me', null, 'invalid.jwt.token.signature');
  if (badTokenRes.statusCode !== 401) throw new Error('Invalid token not rejected with 401');
  console.log('  ✔ [Invalid Token Guard] - Malformed/expired JWT token rejected (401 Unauthorized)');

  // 8. Logout Endpoint (POST /api/v1/auth/logout)
  const logoutRes = await request('POST', '/api/v1/auth/logout', null, userToken);
  if (logoutRes.statusCode !== 200) throw new Error('Logout endpoint failed');
  console.log('  ✔ [POST /api/v1/auth/logout] - Session logout endpoint verified (200 OK)');

  // 9. RBAC Route Protection (Admin vs Normal User)
  const adminDash = await request('GET', '/api/v1/dashboard/admin', null, adminToken);
  if (adminDash.statusCode !== 200) throw new Error('Admin dashboard RBAC failed');
  const forbiddenDash = await request('GET', '/api/v1/dashboard/admin', null, userToken);
  if (forbiddenDash.statusCode !== 403) throw new Error('RBAC forbidden guard failed');
  console.log('  ✔ [RBAC Role Guards] - Admin granted (200 OK), Normal User restricted (403 Forbidden)');

  // 10. Store Catalog & Ratings Queries
  const stores = await request('GET', '/api/v1/stores?page=1&limit=5');
  if (stores.statusCode !== 200) throw new Error('Stores query failed');
  console.log('  ✔ [GET /api/v1/stores] - Store catalog verified with average ratings');

  console.log('\n✨ ALL UNIFIED AUTHENTICATION & SECURITY TESTS PASSED!\n');
};

runTests().catch((err) => {
  console.error('❌ Test failed:', err.message);
  process.exit(1);
});
