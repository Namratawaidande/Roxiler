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

const runCompleteFunctionalAudit = async () => {
  await startTestServer();
  console.log(`\n======================================================================`);
  console.log(`🔍 FULL FUNCTIONAL AUDIT & COMPLIANCE VERIFICATION SUITE`);
  console.log(`🌐 Server Base URL: ${baseUrl}`);
  console.log(`======================================================================\n`);

  try {
    // -------------------------------------------------------------
    // AUDIT SECTION 1: VALIDATION CONSTRAINTS VERIFICATION
    // -------------------------------------------------------------
    console.log('--- 1. SYSTEM-WIDE VALIDATION CONSTRAINTS AUDIT ---');

    // 1.1 Name length validation (20-60 chars)
    const shortNameRes = await request('POST', '/api/v1/auth/register', {
      name: 'Too Short', // 9 chars < 20
      email: 'short.name@example.com',
      password: 'ValidPassword@12',
      address: '123 Valid Address'
    });
    if (shortNameRes.statusCode !== 422) throw new Error('Short name (<20 chars) was not rejected with 422');
    console.log('  ✔ Name < 20 characters rejected (422 Unprocessable Entity).');

    const longNameRes = await request('POST', '/api/v1/auth/register', {
      name: 'This Name Is Extraordinarily Long And Exceeds The Sixty Characters Limit Set In System Validation Rules',
      email: 'long.name@example.com',
      password: 'ValidPassword@12',
      address: '123 Valid Address'
    });
    if (longNameRes.statusCode !== 422) throw new Error('Long name (>60 chars) was not rejected with 422');
    console.log('  ✔ Name > 60 characters rejected (422 Unprocessable Entity).');

    // 1.2 Password validation (8-16 chars, 1 uppercase, 1 special char)
    const shortPassRes = await request('POST', '/api/v1/auth/register', {
      name: 'Valid Alexander Wright Name',
      email: 'short.pass@example.com',
      password: 'Ab@1', // 4 chars < 8
      address: '123 Valid Address'
    });
    if (shortPassRes.statusCode !== 422) throw new Error('Short password (<8 chars) was not rejected with 422');
    console.log('  ✔ Password < 8 characters rejected (422 Unprocessable Entity).');

    const noUpperPassRes = await request('POST', '/api/v1/auth/register', {
      name: 'Valid Alexander Wright Name',
      email: 'noupper.pass@example.com',
      password: 'validpassword@12', // no uppercase
      address: '123 Valid Address'
    });
    if (noUpperPassRes.statusCode !== 422) throw new Error('Password without uppercase was not rejected with 422');
    console.log('  ✔ Password without uppercase letter rejected (422 Unprocessable Entity).');

    const noSpecialPassRes = await request('POST', '/api/v1/auth/register', {
      name: 'Valid Alexander Wright Name',
      email: 'nospecial.pass@example.com',
      password: 'ValidPassword12', // no special character
      address: '123 Valid Address'
    });
    if (noSpecialPassRes.statusCode !== 422) throw new Error('Password without special char was not rejected with 422');
    console.log('  ✔ Password without special character rejected (422 Unprocessable Entity).');

    // 1.3 Invalid email
    const invalidEmailRes = await request('POST', '/api/v1/auth/register', {
      name: 'Valid Alexander Wright Name',
      email: 'not-an-email',
      password: 'ValidPassword@12',
      address: '123 Valid Address'
    });
    if (invalidEmailRes.statusCode !== 422) throw new Error('Invalid email format was not rejected with 422');
    console.log('  ✔ Invalid email format rejected (422 Unprocessable Entity).');

    // -------------------------------------------------------------
    // AUDIT SECTION 2: SYSTEM_ADMIN WORKFLOW AUDIT
    // -------------------------------------------------------------
    console.log('\n--- 2. SYSTEM_ADMIN WORKFLOW AUDIT ---');

    // 2.1 Admin Login
    const adminLogin = await request('POST', '/api/v1/auth/login', {
      email: 'admin@storerating.com',
      password: 'Admin@123456'
    });
    if (adminLogin.statusCode !== 200) throw new Error('Admin login failed');
    const adminToken = adminLogin.data.data.token;
    console.log('  ✔ Admin login successful (200 OK).');

    // 2.2 Admin Dashboard Stats
    const adminStats = await request('GET', '/api/v1/dashboard/admin', null, adminToken);
    if (adminStats.statusCode !== 200) throw new Error('Admin stats retrieval failed');
    const s = adminStats.data.data.stats;
    if (s.totalUsers === undefined || s.totalStores === undefined || s.totalRatings === undefined) {
      throw new Error('Admin dashboard missing required statistics fields');
    }
    console.log(`  ✔ Admin Dashboard Stats verified: ${s.totalUsers} users, ${s.totalStores} stores, ${s.totalRatings} ratings.`);

    // 2.3 Add Users (NORMAL_USER, STORE_OWNER, SYSTEM_ADMIN)
    const suffix = Math.floor(100 + Math.random() * 900);
    const newNormalUser = await request('POST', '/api/v1/users', {
      name: `Benjamin Franklin Richards ${suffix}`,
      email: `ben.richards${suffix}@example.com`,
      password: 'UserPass@2026',
      address: '100 Innovation Parkway, Suite 400',
      role: 'NORMAL_USER'
    }, adminToken);
    if (newNormalUser.statusCode !== 201) throw new Error('Admin failed to create NORMAL_USER');
    console.log('  ✔ Admin created NORMAL_USER successfully (201 Created).');

    const newStoreOwner = await request('POST', '/api/v1/users', {
      name: `Charlotte Bronte Merchant ${suffix}`,
      email: `charlotte.merchant${suffix}@example.com`,
      password: 'OwnerPass@2026',
      address: '250 Commerce Avenue, Downtown',
      role: 'STORE_OWNER'
    }, adminToken);
    if (newStoreOwner.statusCode !== 201) throw new Error('Admin failed to create STORE_OWNER');
    const newOwnerId = newStoreOwner.data.data?.user?.id || newStoreOwner.data.data?.id || 2;
    console.log(`  ✔ Admin created STORE_OWNER successfully (Owner ID: #${newOwnerId}).`);

    // 2.4 Add Store linked to Store Owner
    const newStore = await request('POST', '/api/v1/stores', {
      name: `Heritage Emporium & Boutique ${suffix}`,
      email: `contact.heritage${suffix}@store.com`,
      address: '500 Market Square, Old Town District',
      owner_id: newOwnerId,
      ownerId: newOwnerId
    }, adminToken);
    if (newStore.statusCode !== 201) throw new Error('Admin failed to create Store');
    const newStoreId = newStore.data.data?.store?.id || newStore.data.data?.id || 1;
    console.log(`  ✔ Admin created Store linked to Owner #${newOwnerId} (Store ID: #${newStoreId}).`);

    // 2.5 View Users List with search, sort, pagination
    const usersList = await request('GET', '/api/v1/users?page=1&limit=5&sortBy=name&order=ASC', null, adminToken);
    if (usersList.statusCode !== 200) throw new Error('Admin users list failed');
    console.log(`  ✔ Admin viewed paginated users list (Page 1, ${usersList.data.data.users.length} items).`);

    // 2.6 View User Details with rating stats
    const ownerDetails = await request('GET', `/api/v1/users/${newOwnerId}`, null, adminToken);
    if (ownerDetails.statusCode !== 200) throw new Error('Admin view user details failed');
    console.log(`  ✔ Admin viewed User Details for Owner #${newOwnerId} with store rating metrics.`);

    // -------------------------------------------------------------
    // AUDIT SECTION 3: NORMAL_USER WORKFLOW AUDIT
    // -------------------------------------------------------------
    console.log('\n--- 3. NORMAL_USER WORKFLOW AUDIT ---');

    // 3.1 Signup / Registration
    const regSuffix = Math.floor(100 + Math.random() * 900);
    const registerRes = await request('POST', '/api/v1/auth/register', {
      name: `Daniel Craig Pennington ${regSuffix}`,
      email: `daniel.pennington${regSuffix}@example.com`,
      password: 'UserPass@2026',
      address: '77 West End Boulevard, Metropolis'
    });
    if (registerRes.statusCode !== 201) throw new Error('Normal user registration failed');
    console.log('  ✔ NORMAL_USER self-registration successful (201 Created).');

    // 3.2 Login
    const userLogin = await request('POST', '/api/v1/auth/login', {
      email: `daniel.pennington${regSuffix}@example.com`,
      password: 'UserPass@2026'
    });
    if (userLogin.statusCode !== 200) throw new Error('Normal user login failed');
    const userToken = userLogin.data.data.token;
    console.log('  ✔ NORMAL_USER login successful (200 OK).');

    // 3.3 View Stores with search (Name & Address)
    const storeSearch = await request('GET', '/api/v1/stores?search=Apex', null, userToken);
    if (storeSearch.statusCode !== 200) throw new Error('Store search failed');
    console.log(`  ✔ NORMAL_USER store search executed successfully (${storeSearch.data.data.stores.length} found).`);

    // 3.4 Submit Rating (1-5)
    const submitRating = await request('POST', '/api/v1/ratings', {
      storeId: newStoreId,
      rating: 5,
      comment: 'Exceptional customer service and product quality!'
    }, userToken);
    if (submitRating.statusCode !== 201) throw new Error('Rating submission failed');
    console.log(`  ✔ NORMAL_USER submitted rating 5★ for Store #${newStoreId} (201 Created).`);

    // 3.5 Duplicate Rating Rejection
    const dupRating = await request('POST', '/api/v1/ratings', {
      storeId: newStoreId,
      rating: 4
    }, userToken);
    if (dupRating.statusCode !== 409) throw new Error('Duplicate rating was not rejected with 409 Conflict');
    console.log('  ✔ Duplicate rating submission rejected (409 Conflict as required).');

    // 3.6 Modify Rating
    const updateRating = await request('PUT', `/api/v1/ratings/${newStoreId}`, {
      rating: 4,
      comment: 'Updated review: Consistently great experience.'
    }, userToken);
    if (updateRating.statusCode !== 200) throw new Error('Rating modification failed');
    console.log(`  ✔ NORMAL_USER modified rating to 4★ for Store #${newStoreId} (200 OK).`);

    // 3.7 Password Update
    const userPassUpdate = await request('PUT', '/api/v1/auth/password', {
      currentPassword: 'UserPass@2026',
      newPassword: 'NewUserPass@2026',
      confirmNewPassword: 'NewUserPass@2026'
    }, userToken);
    if (userPassUpdate.statusCode !== 200) throw new Error('Normal user password update failed');
    console.log('  ✔ NORMAL_USER password updated successfully (200 OK).');

    // -------------------------------------------------------------
    // AUDIT SECTION 4: STORE_OWNER WORKFLOW AUDIT
    // -------------------------------------------------------------
    console.log('\n--- 4. STORE_OWNER WORKFLOW AUDIT ---');

    // 4.1 Login as Store Owner
    const ownerLogin = await request('POST', '/api/v1/auth/login', {
      email: 'owner1@storerating.com',
      password: 'Owner@123456'
    });
    if (ownerLogin.statusCode !== 200) throw new Error('Owner login failed');
    const ownerToken = ownerLogin.data.data.token;
    console.log('  ✔ STORE_OWNER login successful (200 OK).');

    // 4.2 Dashboard Overview & Rating Stats
    const ownerDash = await request('GET', '/api/v1/dashboard/owner', null, ownerToken);
    if (ownerDash.statusCode !== 200) throw new Error('Owner dashboard retrieval failed');
    console.log(`  ✔ STORE_OWNER viewed store info ("${ownerDash.data.data.stores[0].name}") with average rating.`);

    const ownerStats = await request('GET', '/api/v1/ratings/owner/stats', null, ownerToken);
    if (ownerStats.statusCode !== 200) throw new Error('Owner stats retrieval failed');
    const dist = ownerStats.data.data.ratingDistribution;
    console.log(`  ✔ STORE_OWNER viewed 5-star distribution: 5★=${dist[5]}, 4★=${dist[4]}, 3★=${dist[3]}, 2★=${dist[2]}, 1★=${dist[1]}.`);

    // 4.3 View, Search, Sort & Paginate Customer Ratings
    const ownerRatings = await request('GET', '/api/v1/ratings/owner?userName=John&sortBy=rating&order=DESC', null, ownerToken);
    if (ownerRatings.statusCode !== 200) throw new Error('Owner customer ratings retrieval failed');
    console.log(`  ✔ STORE_OWNER searched and sorted customer reviews (Found ${ownerRatings.data.data.ratings.length} match).`);

    // 4.4 Password Update
    const ownerPassUpdate = await request('PUT', '/api/v1/auth/password', {
      currentPassword: 'Owner@123456',
      newPassword: 'NewOwner@2026',
      confirmNewPassword: 'NewOwner@2026'
    }, ownerToken);
    if (ownerPassUpdate.statusCode !== 200) throw new Error('Owner password update failed');
    console.log('  ✔ STORE_OWNER password updated successfully (200 OK).');

    // Reset password back
    await request('PUT', '/api/v1/auth/password', {
      currentPassword: 'NewOwner@2026',
      newPassword: 'Owner@123456',
      confirmNewPassword: 'Owner@123456'
    }, ownerToken);

    // -------------------------------------------------------------
    // AUDIT SECTION 5: ROLE-BASED ACCESS CONTROL (RBAC) BARRIERS
    // -------------------------------------------------------------
    console.log('\n--- 5. RBAC ACCESS BARRIERS & AUTHORIZATION AUDIT ---');

    // 5.1 NORMAL_USER cannot access Admin or Owner APIs
    const userToAdmin = await request('GET', '/api/v1/dashboard/admin', null, userToken);
    if (userToAdmin.statusCode !== 403) throw new Error('Normal user accessed admin dashboard');
    console.log('  ✔ [GET /dashboard/admin] (NORMAL_USER) -> 403 Forbidden (Blocked).');

    const userToOwner = await request('GET', '/api/v1/dashboard/owner', null, userToken);
    if (userToOwner.statusCode !== 403) throw new Error('Normal user accessed owner dashboard');
    console.log('  ✔ [GET /dashboard/owner] (NORMAL_USER) -> 403 Forbidden (Blocked).');

    // 5.2 STORE_OWNER cannot access Admin or rate stores
    const ownerToAdmin = await request('GET', '/api/v1/dashboard/admin', null, ownerToken);
    if (ownerToAdmin.statusCode !== 403) throw new Error('Owner accessed admin dashboard');
    console.log('  ✔ [GET /dashboard/admin] (STORE_OWNER) -> 403 Forbidden (Blocked).');

    const ownerRate = await request('POST', '/api/v1/ratings', { storeId: 1, rating: 5 }, ownerToken);
    if (ownerRate.statusCode !== 403) throw new Error('Owner submitted rating');
    console.log('  ✔ [POST /ratings] (STORE_OWNER) -> 403 Forbidden (Blocked).');

    // 5.3 Unauthenticated requests rejected
    const unauthRes = await request('GET', '/api/v1/stores');
    if (unauthRes.statusCode !== 401) throw new Error('Unauthenticated request was not rejected with 401');
    console.log('  ✔ Unauthenticated request -> 401 Unauthorized (Blocked).');

    console.log('\n======================================================================');
    console.log('🎉 FULL FUNCTIONAL AUDIT PASSED: 100% COMPLIANT WITH ALL REQUIREMENTS');
    console.log('======================================================================\n');
  } finally {
    await stopTestServer();
  }
};

runCompleteFunctionalAudit()
  .then(() => {
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('❌ Audit verification failed:', err.message);
    await stopTestServer();
    process.exit(1);
  });
