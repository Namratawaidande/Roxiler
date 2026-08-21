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
  console.log('🛡️  Running Complete Normal User Registration & RBAC Test Suite...\n');

  // --- 1. NORMAL USER REGISTRATION VALIDATION SUITE ---
  console.log('--- 1. NORMAL USER REGISTRATION VALIDATION & SECURITY CHECKS ---');

  // A. Name too short (< 20 chars)
  const shortName = await request('POST', '/api/v1/auth/register', {
    name: 'Short Name', // 10 chars
    email: 'test.short@example.com',
    password: 'ValidPassword@123',
    address: '123 Test St'
  });
  if (shortName.statusCode !== 422) throw new Error('Short name (<20 chars) was not rejected with 422');
  console.log('  ✔ [POST /api/v1/auth/register] Name < 20 chars rejected (422 Unprocessable Entity)');

  // B. Name too long (> 60 chars)
  const longName = await request('POST', '/api/v1/auth/register', {
    name: 'This is an exceedingly excessively long customer name that definitely exceeds the sixty characters limit easily',
    email: 'test.long@example.com',
    password: 'ValidPassword@123'
  });
  if (longName.statusCode !== 422) throw new Error('Long name (>60 chars) was not rejected with 422');
  console.log('  ✔ [POST /api/v1/auth/register] Name > 60 chars rejected (422 Unprocessable Entity)');

  // C. Password missing uppercase letter
  const noUpperPass = await request('POST', '/api/v1/auth/register', {
    name: 'Valid Length User Name 2026',
    email: 'test.noupper@example.com',
    password: 'lowercaseonly@123'
  });
  if (noUpperPass.statusCode !== 422) throw new Error('Password missing uppercase was not rejected with 422');
  console.log('  ✔ [POST /api/v1/auth/register] Password without uppercase letter rejected (422)');

  // D. Password missing special character
  const noSpecialPass = await request('POST', '/api/v1/auth/register', {
    name: 'Valid Length User Name 2026',
    email: 'test.nospecial@example.com',
    password: 'ValidPassword123'
  });
  if (noSpecialPass.statusCode !== 422) throw new Error('Password missing special character was not rejected with 422');
  console.log('  ✔ [POST /api/v1/auth/register] Password without special character rejected (422)');

  // E. Password too long (> 16 chars)
  const longPass = await request('POST', '/api/v1/auth/register', {
    name: 'Valid Length User Name 2026',
    email: 'test.longpass@example.com',
    password: 'ThisPasswordIsWayTooLong@12345'
  });
  if (longPass.statusCode !== 422) throw new Error('Password > 16 chars was not rejected with 422');
  console.log('  ✔ [POST /api/v1/auth/register] Password > 16 chars rejected (422)');

  // F. Attempt Privilege Escalation (Passing role: "SYSTEM_ADMIN")
  const randomId = Math.floor(1000 + Math.random() * 9000);
  const escalationAttempt = await request('POST', '/api/v1/auth/register', {
    name: `Christopher Robin Anderson ${randomId}`,
    email: `chris.anderson${randomId}@example.com`,
    password: 'SecureUser@123',
    role: 'SYSTEM_ADMIN' // Malicious attempt to self-assign admin
  });
  if (escalationAttempt.statusCode !== 201) throw new Error('Registration failed');
  if (escalationAttempt.data.data.user.role !== 'NORMAL_USER') {
    throw new Error(`Privilege Escalation bug: User registered with role ${escalationAttempt.data.data.user.role} instead of NORMAL_USER!`);
  }
  if (escalationAttempt.data.data.user.password_hash || escalationAttempt.data.data.user.password) {
    throw new Error('Security violation: Password hash leaked in registration payload!');
  }
  console.log('  ✔ [POST /api/v1/auth/register] Privilege Escalation Guard: Forced role = NORMAL_USER (201 Created)');

  // G. Duplicate Email Rejection (409 Conflict)
  const duplicateAttempt = await request('POST', '/api/v1/auth/register', {
    name: `Christopher Robin Anderson ${randomId}`,
    email: `chris.anderson${randomId}@example.com`,
    password: 'SecureUser@123'
  });
  if (duplicateAttempt.statusCode !== 409) throw new Error('Duplicate email was not rejected with 409 Conflict');
  console.log('  ✔ [POST /api/v1/auth/register] Duplicate email rejected (409 Conflict)');

  // --- 2. AUTHENTICATION & RBAC PERMISSION MATRIX CHECKS ---
  console.log('\n--- 2. RBAC ACCESS CONTROL & ROLE GUARDS ---');
  const adminLogin = await request('POST', '/api/v1/auth/login', { email: 'admin@storerating.com', password: 'Admin@123456' });
  const adminToken = adminLogin.data.data.token;

  const ownerLogin = await request('POST', '/api/v1/auth/login', { email: 'owner1@storerating.com', password: 'Owner@123456' });
  const ownerToken = ownerLogin.data.data.token;

  const userLogin = await request('POST', '/api/v1/auth/login', { email: 'john.doe@example.com', password: 'User@123456' });
  const userToken = userLogin.data.data.token;

  // Admin access
  const adminGetUsers = await request('GET', '/api/v1/users', null, adminToken);
  if (adminGetUsers.statusCode !== 200) throw new Error('Admin failed to access /users');
  console.log('  ✔ [GET /api/v1/users] (Admin) -> 200 OK');

  // Store Owner access & restrictions
  const ownerDash = await request('GET', '/api/v1/dashboard/owner', null, ownerToken);
  if (ownerDash.statusCode !== 200) throw new Error('Owner failed to access /dashboard/owner');
  console.log('  ✔ [GET /api/v1/dashboard/owner] (Store Owner) -> 200 OK');

  const ownerForbidden = await request('GET', '/api/v1/users', null, ownerToken);
  if (ownerForbidden.statusCode !== 403) throw new Error('Store Owner was not blocked from /users with 403');
  console.log('  ✔ [GET /api/v1/users] (Store Owner) -> 403 Forbidden (Blocked as expected)');

  // Normal User access & restrictions
  const userDash = await request('GET', '/api/v1/dashboard/user', null, userToken);
  if (userDash.statusCode !== 200) throw new Error('User failed to access /dashboard/user');
  console.log('  ✔ [GET /api/v1/dashboard/user] (Normal User) -> 200 OK');

  const userForbidden = await request('GET', '/api/v1/dashboard/admin', null, userToken);
  if (userForbidden.statusCode !== 403) throw new Error('Normal User was not blocked from /dashboard/admin with 403');
  console.log('  ✔ [GET /api/v1/dashboard/admin] (Normal User) -> 403 Forbidden (Blocked as expected)');

  console.log('\n✨ ALL REGISTRATION, VALIDATION, AND RBAC TESTS PASSED!\n');
};

runTests().catch((err) => {
  console.error('❌ Test failed:', err.message);
  process.exit(1);
});
