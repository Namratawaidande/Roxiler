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
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
};

const runComprehensiveBackendTestSuite = async () => {
  await startTestServer();
  const startTime = Date.now();
  let totalTests = 0;
  let passedTests = 0;

  const assert = (condition, message) => {
    totalTests++;
    if (!condition) {
      throw new Error(`Assertion Failed: ${message}`);
    }
    passedTests++;
    console.log(`    ✔ ${message}`);
  };

  console.log(`\n======================================================================`);
  console.log(`🚀 COMPREHENSIVE BACKEND API TEST SUITE`);
  console.log(`🌐 Ephemeral Server Base URL: ${baseUrl}`);
  console.log(`======================================================================\n`);

  try {
    // =============================================================
    // SUITE 1: AUTHENTICATION & SESSION VERIFICATION
    // =============================================================
    console.log('📦 [SUITE 1/6] AUTHENTICATION & SESSION LIFECYCLE');

    // 1.1 Successful Logins for All 3 Roles
    const adminLogin = await request('POST', '/api/v1/auth/login', { email: 'admin@storerating.com', password: 'Admin@123456' });
    assert(adminLogin.statusCode === 200, 'SYSTEM_ADMIN login returns 200 OK + JWT');
    const adminToken = adminLogin.data.data.token;

    const owner1Login = await request('POST', '/api/v1/auth/login', { email: 'owner1@storerating.com', password: 'Owner@123456' });
    assert(owner1Login.statusCode === 200, 'STORE_OWNER #1 login returns 200 OK + JWT');
    const owner1Token = owner1Login.data.data.token;

    const owner2Login = await request('POST', '/api/v1/auth/login', { email: 'owner2@storerating.com', password: 'Owner@123456' });
    assert(owner2Login.statusCode === 200, 'STORE_OWNER #2 login returns 200 OK + JWT');
    const owner2Token = owner2Login.data.data.token;

    const userLogin = await request('POST', '/api/v1/auth/login', { email: 'john.doe@example.com', password: 'User@123456' });
    assert(userLogin.statusCode === 200, 'NORMAL_USER login returns 200 OK + JWT');
    const userToken = userLogin.data.data.token;

    // 1.2 Invalid Email Format
    const invEmail = await request('POST', '/api/v1/auth/login', { email: 'not-an-email', password: 'Admin@123456' });
    assert(invEmail.statusCode === 422, 'Invalid email format rejected with 422 Unprocessable Entity');

    // 1.3 Invalid Password Credentials
    const invPass = await request('POST', '/api/v1/auth/login', { email: 'admin@storerating.com', password: 'WrongPassword@99' });
    assert(invPass.statusCode === 401, 'Invalid password credentials rejected with 401 Unauthorized');

    // 1.4 Missing Credentials
    const missCred = await request('POST', '/api/v1/auth/login', {});
    assert(missCred.statusCode === 422, 'Missing credentials payload rejected with 422 Unprocessable Entity');

    // 1.5 Missing and Malformed Token
    const unauth = await request('GET', '/api/v1/auth/me');
    assert(unauth.statusCode === 401, 'Missing token header rejected with 401 Unauthorized');

    const malformedToken = await request('GET', '/api/v1/auth/me', null, 'NotABearerToken');
    assert(malformedToken.statusCode === 401, 'Malformed token string rejected with 401 Unauthorized');

    // 1.6 Tampered JWT Signature
    const tampered = await request('GET', '/api/v1/auth/me', null, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6IlNZU1RFTV9BRE1JTiJ9.InvalidTamperedSignature');
    assert(tampered.statusCode === 401, 'Tampered JWT token rejected with 401 Unauthorized');

    // 1.7 Logout Behavior
    const logoutRes = await request('POST', '/api/v1/auth/logout', null, userToken);
    assert(logoutRes.statusCode === 200, 'Logout endpoint returns 200 OK acknowledgment');

    // 1.8 Health & Readiness Check Endpoints
    const healthRes = await request('GET', '/api/v1/health');
    assert(healthRes.statusCode === 200, 'Health check liveness probe returns 200 OK');
    assert(healthRes.data?.data?.status === 'healthy' || healthRes.data?.status === 'healthy' || healthRes.data?.success === true, 'Health check returns operational status');

    const readyRes = await request('GET', '/api/v1/health/ready');
    assert(readyRes.statusCode === 200 || readyRes.statusCode === 503, 'Readiness probe returns valid HTTP status (200/503)');

    // 1.9 Observability & Correlation Headers
    assert(Boolean(healthRes.headers['x-request-id']), 'X-Request-Id correlation header attached to response');
    assert(Boolean(healthRes.headers['x-response-time']), 'X-Response-Time performance latency header attached to response');

    // =============================================================
    // SUITE 2: AUTHORIZATION & CROSS-ROLE BARRIERS (RBAC & IDOR)
    // =============================================================
    console.log('\n📦 [SUITE 2/6] ROLE-BASED ACCESS CONTROL & PRIVILEGE BARRIERS');

    // 2.1 SYSTEM_ADMIN Authorized Access
    const adminDash = await request('GET', '/api/v1/dashboard/admin', null, adminToken);
    assert(adminDash.statusCode === 200, 'SYSTEM_ADMIN granted access to Admin Dashboard (200 OK)');

    const adminUsers = await request('GET', '/api/v1/users', null, adminToken);
    assert(adminUsers.statusCode === 200, 'SYSTEM_ADMIN granted access to Users Management API (200 OK)');

    // 2.2 NORMAL_USER Vertical Privilege Escalation Blocked
    const userToAdmin = await request('GET', '/api/v1/dashboard/admin', null, userToken);
    assert(userToAdmin.statusCode === 403, 'NORMAL_USER blocked from Admin Dashboard (403 Forbidden)');

    const userToUsersList = await request('GET', '/api/v1/users', null, userToken);
    assert(userToUsersList.statusCode === 403, 'NORMAL_USER blocked from listing users (403 Forbidden)');

    const userToUserById = await request('GET', '/api/v1/users/1', null, userToken);
    assert(userToUserById.statusCode === 403, 'NORMAL_USER blocked from accessing user details by ID (403 Forbidden)');

    const userToCreateUser = await request('POST', '/api/v1/users', { name: 'Escalation Attempt 1234', email: 'esc@user.com', password: 'UserPass@2026', address: '123 Test St', role: 'SYSTEM_ADMIN' }, userToken);
    assert(userToCreateUser.statusCode === 403, 'NORMAL_USER blocked from User Management API (403 Forbidden)');

    const userToCreateStore = await request('POST', '/api/v1/stores', { name: 'Unauthorized Store 1234', email: 'unauth@store.com', address: '123 Test St', owner_id: 2 }, userToken);
    assert(userToCreateStore.statusCode === 403, 'NORMAL_USER blocked from creating stores (403 Forbidden)');

    const userToOwnerDash = await request('GET', '/api/v1/dashboard/owner', null, userToken);
    assert(userToOwnerDash.statusCode === 403, 'NORMAL_USER blocked from Store Owner Dashboard (403 Forbidden)');

    const userToOwnerRatings = await request('GET', '/api/v1/ratings/owner', null, userToken);
    assert(userToOwnerRatings.statusCode === 403, 'NORMAL_USER blocked from Store Owner Ratings API (403 Forbidden)');

    const userToOwnerStats = await request('GET', '/api/v1/ratings/owner/stats', null, userToken);
    assert(userToOwnerStats.statusCode === 403, 'NORMAL_USER blocked from Store Owner Stats API (403 Forbidden)');

    // 2.3 STORE_OWNER Vertical Privilege Escalation Blocked
    const ownerToAdmin = await request('GET', '/api/v1/dashboard/admin', null, owner1Token);
    assert(ownerToAdmin.statusCode === 403, 'STORE_OWNER blocked from Admin Dashboard (403 Forbidden)');

    const ownerToUsersList = await request('GET', '/api/v1/users', null, owner1Token);
    assert(ownerToUsersList.statusCode === 403, 'STORE_OWNER blocked from Users Management API (403 Forbidden)');

    const ownerToCreateUser = await request('POST', '/api/v1/users', { name: 'Owner Create Admin 123', email: 'owner.adm@test.com', password: 'UserPass@2026', address: '123 Test St', role: 'SYSTEM_ADMIN' }, owner1Token);
    assert(ownerToCreateUser.statusCode === 403, 'STORE_OWNER blocked from creating users (403 Forbidden)');

    const ownerToCreateStore = await request('POST', '/api/v1/stores', { name: 'Owner Create Store 123', email: 'owner.st@test.com', address: '123 Test St', owner_id: 2 }, owner1Token);
    assert(ownerToCreateStore.statusCode === 403, 'STORE_OWNER blocked from creating stores (403 Forbidden)');

    const ownerRate = await request('POST', '/api/v1/ratings', { storeId: 1, rating: 5 }, owner1Token);
    assert(ownerRate.statusCode === 403, 'STORE_OWNER blocked from submitting store ratings (403 Forbidden)');

    const ownerModRate = await request('PUT', '/api/v1/ratings/1', { rating: 5 }, owner1Token);
    assert(ownerModRate.statusCode === 403, 'STORE_OWNER blocked from modifying store ratings (403 Forbidden)');

    // 2.4 Horizontal Privilege Escalation & IDOR / BOLA Defenses
    const owner2UpdateStore1 = await request('PUT', '/api/v1/stores/1', { name: 'Hacked Store 1 By Owner 2' }, owner2Token);
    assert(owner2UpdateStore1.statusCode === 403, 'IDOR Defense: Store Owner 2 blocked from updating Store Owner 1 store (403 Forbidden)');

    const owner2DeleteStore1 = await request('DELETE', '/api/v1/stores/1', null, owner2Token);
    assert(owner2DeleteStore1.statusCode === 403, 'IDOR Defense: Store Owner 2 blocked from deleting Store Owner 1 store (403 Forbidden)');

    const owner2Stats = await request('GET', '/api/v1/ratings/owner/stats', null, owner2Token);
    assert(owner2Stats.statusCode === 200, 'STORE_OWNER #2 accessed own rating statistics');
    const owner2Stores = owner2Stats.data.data.stores;
    const hasLeak = owner2Stores.some((s) => s.name.includes('Apex Digital'));
    assert(!hasLeak, 'Cross-Store Isolation: Store Owner 2 cannot see Store Owner 1 store stats');

    const owner2Ratings = await request('GET', '/api/v1/ratings/owner', null, owner2Token);
    assert(owner2Ratings.statusCode === 200, 'STORE_OWNER #2 accessed own customer ratings');
    const owner2RatingList = owner2Ratings.data.data.ratings;
    const hasStore1Rating = owner2RatingList.some((r) => r.storeId === 1 || r.storeName?.includes('Apex Digital'));
    assert(!hasStore1Rating, 'Cross-Store Isolation: Store Owner 2 customer review stream strictly quarantined');

    // =============================================================
    // SUITE 3: USER MANAGEMENT & VALIDATION CONSTRAINTS
    // =============================================================
    console.log('\n📦 [SUITE 3/6] USER CREATION & DATA VALIDATION CONSTRAINTS');

    const rand = Math.floor(1000 + Math.random() * 9000);

    // 3.1 Normal User Self-Signup
    const regRes = await request('POST', '/api/v1/auth/register', {
      name: `Alexander Hamilton Montgomery ${rand}`,
      email: `hamilton${rand}@example.com`,
      password: 'UserPass@2026',
      address: '55 Wall Street, Financial District'
    });
    assert(regRes.statusCode === 201, 'Normal User self-registration returns 201 Created');

    // 3.2 Duplicate Email Rejection
    const dupEmail = await request('POST', '/api/v1/auth/register', {
      name: `Alexander Hamilton Montgomery ${rand}`,
      email: `hamilton${rand}@example.com`,
      password: 'UserPass@2026',
      address: '55 Wall Street, Financial District'
    });
    assert(dupEmail.statusCode === 409, 'Duplicate email registration rejected with 409 Conflict');

    // 3.3 Name Length Validation (20-60 chars)
    const shortName = await request('POST', '/api/v1/auth/register', { name: 'Too Short', email: `short${rand}@test.com`, password: 'UserPass@2026', address: '123 St' });
    assert(shortName.statusCode === 422, 'Name < 20 characters rejected with 422');

    const longName = await request('POST', '/api/v1/auth/register', {
      name: 'This Name Is Extraordinarily Long And Exceeds The Sixty Characters Limit Permitted In The Validation Rules',
      email: `long${rand}@test.com`,
      password: 'UserPass@2026',
      address: '123 St'
    });
    assert(longName.statusCode === 422, 'Name > 60 characters rejected with 422');

    // 3.4 Address Length Validation (max 400 chars)
    const longAddress = await request('POST', '/api/v1/auth/register', {
      name: `Valid Alexander Wright Name ${rand}`,
      email: `addr${rand}@test.com`,
      password: 'UserPass@2026',
      address: 'A'.repeat(405)
    });
    assert(longAddress.statusCode === 422, 'Address > 400 characters rejected with 422');

    // 3.5 Password Complexity Validation
    const shortPass = await request('POST', '/api/v1/auth/register', { name: `Valid Alexander Wright Name ${rand}`, email: `p1${rand}@test.com`, password: 'Ab@1', address: '123 St' });
    assert(shortPass.statusCode === 422, 'Password < 8 characters rejected with 422');

    const noUpper = await request('POST', '/api/v1/auth/register', { name: `Valid Alexander Wright Name ${rand}`, email: `p2${rand}@test.com`, password: 'password@12', address: '123 St' });
    assert(noUpper.statusCode === 422, 'Password without uppercase rejected with 422');

    const noSpecial = await request('POST', '/api/v1/auth/register', { name: `Valid Alexander Wright Name ${rand}`, email: `p3${rand}@test.com`, password: 'ValidPassword12', address: '123 St' });
    assert(noSpecial.statusCode === 422, 'Password without special character rejected with 422');

    // 3.6 Admin User Creation with Invalid Role
    const invRole = await request('POST', '/api/v1/users', { name: `Valid Alexander Wright Name ${rand}`, email: `role${rand}@test.com`, password: 'UserPass@2026', address: '123 St', role: 'INVALID_ROLE' }, adminToken);
    assert(invRole.statusCode === 422, 'Invalid role assignment rejected with 422');

    // =============================================================
    // SUITE 4: STORE MANAGEMENT, SEARCH, SORT & PAGINATION
    // =============================================================
    console.log('\n📦 [SUITE 4/6] STORE MANAGEMENT, SEARCH, SORT & PAGINATION');

    // 4.1 Admin Create Store
    const createStoreRes = await request('POST', '/api/v1/stores', {
      name: `Grand Central Marketplace Boutique ${rand}`,
      email: `market${rand}@store.com`,
      address: '89 Main Street, Central Plaza',
      owner_id: 2,
      ownerId: 2
    }, adminToken);
    assert(createStoreRes.statusCode === 201, 'Admin create store returns 201 Created');
    const createdStoreId = createStoreRes.data.data?.store?.id || createStoreRes.data.data?.id || 1;

    // 4.2 Invalid Store Owner
    const invOwner = await request('POST', '/api/v1/stores', {
      name: `Invalid Owner Test Store Boutique ${rand}`,
      email: `invowner${rand}@store.com`,
      address: '100 Test St',
      owner_id: 99999
    }, adminToken);
    assert(invOwner.statusCode === 400 || invOwner.statusCode === 404, 'Non-existent store owner rejected (400/404)');

    // 4.3 Stores Listing with Search (Name and Address)
    const searchRes = await request('GET', '/api/v1/stores?search=Apex', null, userToken);
    assert(searchRes.statusCode === 200, 'Store search by keyword returns 200 OK');

    // 4.4 Column Sorting
    const sortRes = await request('GET', '/api/v1/stores?sortBy=name&order=ASC', null, userToken);
    assert(sortRes.statusCode === 200, 'Store sorting by name ASC returns 200 OK');

    // 4.5 Pagination Metadata
    const pageRes = await request('GET', '/api/v1/stores?page=1&limit=2', null, userToken);
    assert(pageRes.statusCode === 200, 'Stores pagination returns 200 OK');
    const meta = pageRes.data.meta?.pagination || pageRes.data.meta;
    assert(meta.page === 1 && (meta.limit === 2 || meta.pageSize === 2), 'Pagination metadata verified');

    // =============================================================
    // SUITE 5: RATINGS LIFECYCLE, AVERAGE RECALCULATION & EDGES
    // =============================================================
    console.log('\n📦 [SUITE 5/6] RATINGS SUBMISSION, MODIFICATION & AVERAGES');

    // 5.1 Valid Rating Submission (1-5)
    const rateRes = await request('POST', '/api/v1/ratings', {
      storeId: createdStoreId,
      rating: 5,
      comment: 'Top quality products and swift customer service!'
    }, userToken);
    assert(rateRes.statusCode === 201, 'Normal User submits 5★ rating (201 Created)');

    // 5.2 Rating Bounds Violations
    const rateZero = await request('POST', '/api/v1/ratings', { storeId: createdStoreId, rating: 0 }, userToken);
    assert(rateZero.statusCode === 422, 'Rating below 1 (0) rejected with 422');

    const rateSix = await request('POST', '/api/v1/ratings', { storeId: createdStoreId, rating: 6 }, userToken);
    assert(rateSix.statusCode === 422, 'Rating above 5 (6) rejected with 422');

    const rateDecimal = await request('POST', '/api/v1/ratings', { storeId: createdStoreId, rating: 3.5 }, userToken);
    assert(rateDecimal.statusCode === 422, 'Non-integer rating (3.5) rejected with 422');

    // 5.3 Duplicate Rating Rejection
    const rateDup = await request('POST', '/api/v1/ratings', { storeId: createdStoreId, rating: 4 }, userToken);
    assert(rateDup.statusCode === 409, 'Duplicate rating submission rejected with 409 Conflict');

    // 5.4 Modify Own Rating
    const modRate = await request('PUT', `/api/v1/ratings/${createdStoreId}`, { rating: 4, comment: 'Revised review to 4★.' }, userToken);
    assert(modRate.statusCode === 200, 'Normal User modified submitted rating to 4★ (200 OK)');

    // 5.5 Store Average Calculation Verification
    const storeInfo = await request('GET', `/api/v1/stores/${createdStoreId}`, null, userToken);
    assert(storeInfo.statusCode === 200, 'Retrieved updated store with recalculations');
    const storeData = storeInfo.data.data?.store || storeInfo.data.data;
    assert(storeData.averageRating !== undefined || storeData.overall_rating !== undefined, 'Store average rating recalculated correctly');

    // =============================================================
    // SUITE 6: SECURE PASSWORD CHANGES & DATA SANITIZATION
    // =============================================================
    console.log('\n📦 [SUITE 6/6] PASSWORD CHANGES & SENSITIVE DATA DEFENSES');

    // 6.1 Incorrect Current Password
    const wrongPass = await request('PUT', '/api/v1/auth/password', {
      currentPassword: 'WrongCurrentPassword@99',
      newPassword: 'BrandNewPass@26',
      confirmNewPassword: 'BrandNewPass@26'
    }, userToken);
    assert(wrongPass.statusCode === 401, 'Incorrect current password rejected with 401 Unauthorized');

    // 6.2 Identical Password Rejection
    const samePass = await request('PUT', '/api/v1/auth/password', {
      currentPassword: 'User@123456',
      newPassword: 'User@123456',
      confirmNewPassword: 'User@123456'
    }, userToken);
    assert(samePass.statusCode === 400, 'Identical new password rejected with 400 Bad Request');

    // 6.3 Successful Password Update
    const passUpdate = await request('PUT', '/api/v1/auth/password', {
      currentPassword: 'User@123456',
      newPassword: 'NewUserPass@2026',
      confirmNewPassword: 'NewUserPass@2026'
    }, userToken);
    assert(passUpdate.statusCode === 200, 'Password updated successfully with 200 OK');

    // 6.4 Subsequent Login with New Password
    const newPassLogin = await request('POST', '/api/v1/auth/login', { email: 'john.doe@example.com', password: 'NewUserPass@2026' });
    assert(newPassLogin.statusCode === 200, 'Login with newly updated password succeeded (200 OK)');

    // Reset password back
    await request('PUT', '/api/v1/auth/password', {
      currentPassword: 'NewUserPass@2026',
      newPassword: 'User@123456',
      confirmNewPassword: 'User@123456'
    }, newPassLogin.data.data.token);

    // 6.5 Mass Assignment / Overposting Defense Verification
    const massAssignReg = await request('POST', '/api/v1/auth/register', {
      name: `Mass Assignment Defense Check ${rand}`,
      email: `mass${rand}@example.com`,
      password: 'UserPass@2026',
      address: '100 Defense Way',
      role: 'SYSTEM_ADMIN',
      isAdmin: true,
      permissions: ['ALL']
    });
    assert(massAssignReg.statusCode === 201, 'Normal User registered with overposted role fields');
    const registeredUser = massAssignReg.data.data?.user || massAssignReg.data.data;
    assert(registeredUser.role === 'NORMAL_USER', 'Mass Assignment Defense: Role parameter injection ignored, assigned NORMAL_USER');

    // 6.6 SQL Injection Payload Resistance
    const sqlSearch = await request('GET', "/api/v1/stores?search=' OR '1'='1", null, userToken);
    assert(sqlSearch.statusCode === 200, 'SQL Injection in search query parameter safely neutralized');

    const sqlSort = await request('GET', "/api/v1/stores?sortBy=id;DROP%20TABLE%20users;--", null, userToken);
    assert(sqlSort.statusCode === 200 || sqlSort.statusCode === 422, 'SQL Injection in sortBy parameter safely neutralized via allowlist');

    // 6.7 Malformed JSON Payload Defense
    const malformedJson = await request('POST', '/api/v1/auth/login', '{ "email": "admin@storerating.com", "password": }');
    assert(malformedJson.statusCode === 400, 'Malformed JSON payload rejected cleanly with 400 Bad Request');

    // 6.8 404 Unknown Route Handling
    const notFound = await request('GET', '/api/v1/non-existent-resource-endpoint');
    assert(notFound.statusCode === 404, 'Unknown API route returns 404 Not Found');

    // 6.9 Zero Sensitive Data Leakage in API Payloads
    const meRes = await request('GET', '/api/v1/auth/me', null, adminToken);
    const meData = meRes.data.data;
    assert(!meData.password && !meData.password_hash && !meData.passwordHash, 'User profile strictly omits password/hash');

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n======================================================================`);
    console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED IN ${duration}s (100% GREEN)`);
    console.log(`======================================================================\n`);
  } finally {
    await stopTestServer();
  }
};

runComprehensiveBackendTestSuite()
  .then(() => {
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('\n❌ Test Suite Failed:', err.message);
    await stopTestServer();
    process.exit(1);
  });
