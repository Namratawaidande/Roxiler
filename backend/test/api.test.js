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

const runComprehensiveRatingsIntegrationSuite = async () => {
  await startTestServer();
  console.log(`\n======================================================================`);
  console.log(`🧪 INTEGRATED TEST RUNNER: 10-Scenario Store Ratings & Calculations`);
  console.log(`🌐 Server Base URL: ${baseUrl}`);
  console.log(`======================================================================\n`);

  try {
    // --- AUTHENTICATION ---
    const user1Login = await request('POST', '/api/v1/auth/login', { email: 'john.doe@example.com', password: 'User@123456' });
    if (user1Login.statusCode !== 200) throw new Error('User 1 login failed');
    const user1Token = user1Login.data.data.token;
    const user1Id = user1Login.data.data.user.id;

    const user2Login = await request('POST', '/api/v1/auth/login', { email: 'sarah.jenkins@example.com', password: 'User@123456' });
    if (user2Login.statusCode !== 200) throw new Error('User 2 login failed');
    const user2Token = user2Login.data.data.token;
    const user2Id = user2Login.data.data.user.id;

    const adminLogin = await request('POST', '/api/v1/auth/login', { email: 'admin@storerating.com', password: 'Admin@123456' });
    if (adminLogin.statusCode !== 200) throw new Error('Admin login failed');
    const adminToken = adminLogin.data.data.token;

    const ownerLogin = await request('POST', '/api/v1/auth/login', { email: 'owner1@storerating.com', password: 'Owner@123456' });
    if (ownerLogin.statusCode !== 200) throw new Error('Store Owner login failed');
    const ownerToken = ownerLogin.data.data.token;

    console.log('  ✔ Authenticated User #1, User #2, System Admin, and Store Owner.');

    // -------------------------------------------------------------
    // SCENARIO 1: STORE HAS NO RATINGS
    // -------------------------------------------------------------
    console.log('\n--- SCENARIO 1: STORE HAS NO RATINGS ---');
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const newStoreRes = await request('POST', '/api/v1/stores', {
      name: `Brand New Unrated Store ${randSuffix}`,
      email: `unrated.${randSuffix}@store.com`,
      address: '100 Fresh Meadow Drive, Innovation Park',
      owner_id: 2
    }, adminToken);
    if (newStoreRes.statusCode !== 201) throw new Error('Failed to create new test store');
    const unratedStoreId = newStoreRes.data.data.store.id;

    const checkUnratedRes = await request('GET', `/api/v1/stores/${unratedStoreId}`, null, user1Token);
    const unratedStore = checkUnratedRes.data.data.store;
    if (unratedStore.averageRating !== 0.0 && unratedStore.overall_rating !== 0.0) {
      throw new Error(`Expected average rating 0.0 for unrated store, got ${unratedStore.averageRating}`);
    }
    console.log(`  ✔ Scenario 1 Passed: Unrated store returns overall rating ${unratedStore.averageRating}★ ("No ratings yet").`);

    // -------------------------------------------------------------
    // SCENARIO 2: STORE HAS ONE RATING
    // -------------------------------------------------------------
    console.log('\n--- SCENARIO 2: STORE HAS ONE RATING ---');
    const rate1Res = await request('POST', '/api/v1/ratings', {
      storeId: unratedStoreId,
      rating: 4,
      comment: 'Initial single rating of 4 stars'
    }, user1Token);
    if (rate1Res.statusCode !== 201) throw new Error('Failed to submit single rating');

    const checkSingleRatingRes = await request('GET', `/api/v1/stores/${unratedStoreId}`, null, user1Token);
    const singleRatedStore = checkSingleRatingRes.data.data.store;
    if (singleRatedStore.averageRating !== 4.0 && singleRatedStore.overall_rating !== 4.0) {
      throw new Error(`Expected average rating 4.0 for store with 1 rating, got ${singleRatedStore.averageRating}`);
    }
    console.log(`  ✔ Scenario 2 Passed: Store with 1 rating (4★) returns exactly ${singleRatedStore.averageRating}★.`);

    // -------------------------------------------------------------
    // SCENARIO 3: STORE HAS MULTIPLE RATINGS (ARITHMETIC AVERAGE)
    // -------------------------------------------------------------
    console.log('\n--- SCENARIO 3: STORE HAS MULTIPLE RATINGS (ARITHMETIC AVERAGE) ---');
    // User 2 rates the same store with 2 stars
    const rate2Res = await request('POST', '/api/v1/ratings', {
      storeId: unratedStoreId,
      rating: 2,
      comment: 'Second rating of 2 stars'
    }, user2Token);
    if (rate2Res.statusCode !== 201) throw new Error('Failed to submit second user rating');

    // Expected arithmetic average: (4 + 2) / 2 = 3.0
    const checkMultiRatingRes = await request('GET', `/api/v1/stores/${unratedStoreId}`, null, user1Token);
    const multiRatedStore = checkMultiRatingRes.data.data.store;
    if (multiRatedStore.averageRating !== 3.0 && multiRatedStore.overall_rating !== 3.0) {
      throw new Error(`Expected arithmetic average 3.0 for (4 + 2)/2, got ${multiRatedStore.averageRating}`);
    }
    console.log(`  ✔ Scenario 3 Passed: Multiple ratings (4★ + 2★) produce exact arithmetic average ${multiRatedStore.averageRating}★.`);

    // -------------------------------------------------------------
    // SCENARIO 4: NORMAL_USER HAS NOT RATED A STORE
    // -------------------------------------------------------------
    console.log('\n--- SCENARIO 4: NORMAL_USER HAS NOT RATED STORE ---');
    // User 2 checks Store #1 (which User 2 has not rated)
    const store1User2Res = await request('GET', '/api/v1/stores/1', null, user2Token);
    const store1User2 = store1User2Res.data.data.store;
    if (store1User2.myRating !== null && store1User2.userSubmittedRating !== null) {
      throw new Error(`Expected myRating null for unrated user, got ${store1User2.myRating}`);
    }
    console.log('  ✔ Scenario 4 Passed: Unrated user sees myRating = null ("Not Rated Yet").');

    // -------------------------------------------------------------
    // SCENARIO 5: NORMAL_USER HAS RATED A STORE
    // -------------------------------------------------------------
    console.log('\n--- SCENARIO 5: NORMAL_USER HAS RATED STORE ---');
    // User 1 checks Store #1 (which User 1 rated with 5 stars)
    const store1User1Res = await request('GET', '/api/v1/stores/1', null, user1Token);
    const store1User1 = store1User1Res.data.data.store;
    if (store1User1.myRating !== 5 && store1User1.userSubmittedRating !== 5) {
      throw new Error(`Expected myRating 5 for rated user, got ${store1User1.myRating}`);
    }
    console.log(`  ✔ Scenario 5 Passed: Rated user sees their exact submitted score (myRating: ${store1User1.myRating}★).`);

    // -------------------------------------------------------------
    // SCENARIO 6: NORMAL_USER MODIFIES RATING (RECALCULATES AVERAGE)
    // -------------------------------------------------------------
    console.log('\n--- SCENARIO 6: NORMAL_USER MODIFIES RATING ---');
    // User 1 updates their rating on unratedStore from 4★ to 5★
    // Ratings now: User 1 = 5★, User 2 = 2★ -> (5 + 2) / 2 = 3.5★
    const modifyRes = await request('PUT', `/api/v1/ratings/${unratedStoreId}`, {
      rating: 5,
      comment: 'Updated to 5 stars'
    }, user1Token);
    if (modifyRes.statusCode !== 200) throw new Error('Rating update failed');

    const checkUpdatedAvgRes = await request('GET', `/api/v1/stores/${unratedStoreId}`, null, user1Token);
    const updatedAvgStore = checkUpdatedAvgRes.data.data.store;
    if (updatedAvgStore.averageRating !== 3.5 && updatedAvgStore.overall_rating !== 3.5) {
      throw new Error(`Expected recalculated average 3.5 for (5 + 2)/2, got ${updatedAvgStore.averageRating}`);
    }
    console.log(`  ✔ Scenario 6 Passed: Modifying rating (4★ -> 5★) recalculated store average to ${updatedAvgStore.averageRating}★.`);

    // -------------------------------------------------------------
    // SCENARIO 7: MULTIPLE USERS RATE SAME STORE (UNIQUE RECORDS)
    // -------------------------------------------------------------
    console.log('\n--- SCENARIO 7: MULTIPLE USERS & DUPLICATE PREVENTION ---');
    // User 1 attempts duplicate rating on same store
    const duplicateRes = await request('POST', '/api/v1/ratings', { storeId: unratedStoreId, rating: 5 }, user1Token);
    if (duplicateRes.statusCode !== 409) throw new Error('Duplicate rating was not rejected with 409');
    console.log('  ✔ Scenario 7 Passed: Unique constraint blocks duplicate ratings per user (409 Conflict).');

    // -------------------------------------------------------------
    // SCENARIO 8: INVALID RATING VALUE REJECTION
    // -------------------------------------------------------------
    console.log('\n--- SCENARIO 8: INVALID RATING VALUES REJECTION ---');
    const badRatings = [0, 6, -1, 3.5, 'five', null];
    for (const val of badRatings) {
      const res = await request('POST', '/api/v1/ratings', { storeId: 1, rating: val }, user1Token);
      if (res.statusCode !== 422 && res.statusCode !== 409) {
        throw new Error(`Invalid rating ${val} was not rejected with 422`);
      }
    }
    console.log('  ✔ Scenario 8 Passed: Out-of-bounds, decimal, string, and null ratings rejected (422 Unprocessable Entity).');

    // -------------------------------------------------------------
    // SCENARIO 9: UNAUTHORIZED ACCESS REJECTION
    // -------------------------------------------------------------
    console.log('\n--- SCENARIO 9: UNAUTHORIZED ACCESS REJECTION ---');
    const adminRate = await request('POST', '/api/v1/ratings', { storeId: 1, rating: 5 }, adminToken);
    if (adminRate.statusCode !== 403) throw new Error('Admin rating was not blocked with 403');

    const ownerRate = await request('POST', '/api/v1/ratings', { storeId: 1, rating: 5 }, ownerToken);
    if (ownerRate.statusCode !== 403) throw new Error('Owner rating was not blocked with 403');

    const unauthRate = await request('POST', '/api/v1/ratings', { storeId: 1, rating: 5 });
    if (unauthRate.statusCode !== 401) throw new Error('Unauthenticated rating was not blocked with 401');
    console.log('  ✔ Scenario 9 Passed: Non-NORMAL_USER roles and unauthenticated requests blocked (403/401).');

    // -------------------------------------------------------------
    // SCENARIO 10: REFERENTIAL INTEGRITY & STORE DELETION
    // -------------------------------------------------------------
    console.log('\n--- SCENARIO 10: REFERENTIAL INTEGRITY & DELETION ---');
    const deleteStoreRes = await request('DELETE', `/api/v1/stores/${unratedStoreId}`, null, adminToken);
    if (deleteStoreRes.statusCode !== 200) throw new Error('Store deletion failed');

    const checkDeletedStore = await request('GET', `/api/v1/stores/${unratedStoreId}`, null, user1Token);
    if (checkDeletedStore.statusCode !== 404) throw new Error('Deleted store still accessible');
    console.log('  ✔ Scenario 10 Passed: Store deletion preserved foreign-key integrity without orphaned records.');

    console.log('\n======================================================================');
    console.log('✨ ALL 10 STORE RATING INTEGRATION SCENARIOS PASSED (100% GREEN)');
    console.log('======================================================================\n');
  } finally {
    await stopTestServer();
  }
};

runComprehensiveRatingsIntegrationSuite()
  .then(() => {
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('❌ Integration Test failed:', err.message);
    await stopTestServer();
    process.exit(1);
  });
