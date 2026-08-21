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

const runRatingSubmissionTests = async () => {
  await startTestServer();
  console.log(`\n======================================================================`);
  console.log(`🧪 TEST RUNNER: NORMAL_USER Rating Submission & Business Logic Suite`);
  console.log(`🌐 Server Base URL: ${baseUrl}`);
  console.log(`======================================================================\n`);

  try {
    // --- 1. AUTHENTICATING TEST ROLES ---
    console.log('--- 1. AUTHENTICATION OF TEST ACCOUNTS ---');
    const userLogin = await request('POST', '/api/v1/auth/login', { email: 'john.doe@example.com', password: 'User@123456' });
    if (userLogin.statusCode !== 200) throw new Error('Normal user login failed');
    const userToken = userLogin.data.data.token;
    const userId = userLogin.data.data.user.id;

    const adminLogin = await request('POST', '/api/v1/auth/login', { email: 'admin@storerating.com', password: 'Admin@123456' });
    if (adminLogin.statusCode !== 200) throw new Error('Admin login failed');
    const adminToken = adminLogin.data.data.token;

    const ownerLogin = await request('POST', '/api/v1/auth/login', { email: 'owner1@storerating.com', password: 'Owner@123456' });
    if (ownerLogin.statusCode !== 200) throw new Error('Store owner login failed');
    const ownerToken = ownerLogin.data.data.token;
    console.log('  ✔ Authenticated NORMAL_USER, SYSTEM_ADMIN, and STORE_OWNER.');

    // --- 2. VALID RATING SUBMISSION ---
    console.log('\n--- 2. VALID RATING SUBMISSION (1 TO 5 STARS) ---');
    const submitRes = await request('POST', '/api/v1/ratings', {
      storeId: 2, // John has not rated Store 2 yet
      rating: 4,
      comment: 'Excellent fresh produce and prompt customer service!'
    }, userToken);

    if (submitRes.statusCode !== 201) {
      throw new Error(`Expected 201 Created, got ${submitRes.statusCode}: ${JSON.stringify(submitRes.data)}`);
    }
    const createdRating = submitRes.data.data.rating;
    if (createdRating.rating_value !== 4 || createdRating.user_id !== userId) {
      throw new Error('Rating data mismatch or invalid user ownership');
    }
    console.log(`  ✔ [POST /api/v1/ratings] 4-Star Rating submitted for Store #2 by User #${userId} (201 Created).`);

    // --- 3. DUPLICATE RATING PREVENTION (ONE-USER-ONE-RATING-PER-STORE) ---
    console.log('\n--- 3. DUPLICATE RATING PREVENTION ---');
    const duplicateRes = await request('POST', '/api/v1/ratings', {
      storeId: 2,
      rating: 5,
      comment: 'Trying to rate again'
    }, userToken);

    if (duplicateRes.statusCode !== 409) {
      throw new Error(`Expected 409 Conflict for duplicate rating, got ${duplicateRes.statusCode}`);
    }
    console.log('  ✔ [POST /api/v1/ratings] Duplicate rating rejected (409 Conflict as expected).');

    // --- 4. RATING RANGE & PAYLOAD VALIDATION ---
    console.log('\n--- 4. INPUT & RATING RANGE VALIDATION ---');
    const outOfRangeHigh = await request('POST', '/api/v1/ratings', { storeId: 3, rating: 6 }, userToken);
    if (outOfRangeHigh.statusCode !== 422) throw new Error('Rating 6 was not rejected with 422');
    console.log('  ✔ Rating > 5 rejected (422 Unprocessable Entity).');

    const outOfRangeLow = await request('POST', '/api/v1/ratings', { storeId: 3, rating: 0 }, userToken);
    if (outOfRangeLow.statusCode !== 422) throw new Error('Rating 0 was not rejected with 422');
    console.log('  ✔ Rating < 1 rejected (422 Unprocessable Entity).');

    const nonIntRating = await request('POST', '/api/v1/ratings', { storeId: 3, rating: 4.5 }, userToken);
    if (nonIntRating.statusCode !== 422) throw new Error('Non-integer rating 4.5 was not rejected with 422');
    console.log('  ✔ Non-integer rating rejected (422 Unprocessable Entity).');

    // --- 5. NON-EXISTENT STORE CHECK ---
    console.log('\n--- 5. STORE EXISTENCE VERIFICATION ---');
    const nonExistentStore = await request('POST', '/api/v1/ratings', { storeId: 99999, rating: 5 }, userToken);
    if (nonExistentStore.statusCode !== 404) throw new Error('Rating for non-existent store was not rejected with 404');
    console.log('  ✔ Rating for non-existent store rejected (404 Not Found).');

    // --- 6. RBAC GUARDS (ONLY NORMAL_USER CAN SUBMIT RATINGS) ---
    console.log('\n--- 6. ROLE-BASED ACCESS GUARDS ---');
    const adminSubmit = await request('POST', '/api/v1/ratings', { storeId: 3, rating: 5 }, adminToken);
    if (adminSubmit.statusCode !== 403) throw new Error('SYSTEM_ADMIN was not blocked with 403 from submitting rating');
    console.log('  ✔ [POST /api/v1/ratings] (SYSTEM_ADMIN) -> 403 Forbidden (Blocked).');

    const ownerSubmit = await request('POST', '/api/v1/ratings', { storeId: 3, rating: 5 }, ownerToken);
    if (ownerSubmit.statusCode !== 403) throw new Error('STORE_OWNER was not blocked with 403 from submitting rating');
    console.log('  ✔ [POST /api/v1/ratings] (STORE_OWNER) -> 403 Forbidden (Blocked).');

    const unauthSubmit = await request('POST', '/api/v1/ratings', { storeId: 3, rating: 5 });
    if (unauthSubmit.statusCode !== 401) throw new Error('Unauthenticated submission was not rejected with 401');
    console.log('  ✔ [POST /api/v1/ratings] (Unauthenticated) -> 401 Unauthorized (Blocked).');

    // --- 7. FORGED USER ID PROTECTION ---
    console.log('\n--- 7. TOKEN-DERIVED OWNERSHIP SECURITY ---');
    const forgedUserSubmit = await request('POST', '/api/v1/ratings', {
      storeId: 3,
      rating: 5,
      userId: 1, // Attempting to forge rating on behalf of Admin
      user_id: 1
    }, userToken);
    if (forgedUserSubmit.statusCode !== 201) throw new Error('Valid submission failed');
    if (forgedUserSubmit.data.data.rating.user_id !== userId) {
      throw new Error('Security Breach: Forged userId was accepted in rating submission');
    }
    console.log(`  ✔ Forged userId payload ignored; ownership strictly assigned to authenticated user #${userId}.`);

    console.log('\n======================================================================');
    console.log('✨ ALL NORMAL_USER RATING SUBMISSION TESTS PASSED (100% GREEN)');
    console.log('======================================================================\n');
  } finally {
    await stopTestServer();
  }
};

runRatingSubmissionTests()
  .then(() => {
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('❌ Test failed:', err.message);
    await stopTestServer();
    process.exit(1);
  });
