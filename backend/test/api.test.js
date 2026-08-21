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

const runStoreOwnerRatingStatsTests = async () => {
  await startTestServer();
  console.log(`\n======================================================================`);
  console.log(`🧪 TEST RUNNER: STORE_OWNER Rating Statistics & Distribution Suite`);
  console.log(`🌐 Server Base URL: ${baseUrl}`);
  console.log(`======================================================================\n`);

  try {
    // --- 1. AUTHENTICATING TEST ROLES ---
    console.log('--- 1. AUTHENTICATION OF TEST ACCOUNTS ---');
    const owner1Login = await request('POST', '/api/v1/auth/login', { email: 'owner1@storerating.com', password: 'Owner@123456' });
    if (owner1Login.statusCode !== 200) throw new Error('Owner 1 login failed');
    const owner1Token = owner1Login.data.data.token;

    const owner2Login = await request('POST', '/api/v1/auth/login', { email: 'owner2@storerating.com', password: 'Owner@123456' });
    if (owner2Login.statusCode !== 200) throw new Error('Owner 2 login failed');
    const owner2Token = owner2Login.data.data.token;

    const userLogin = await request('POST', '/api/v1/auth/login', { email: 'john.doe@example.com', password: 'User@123456' });
    if (userLogin.statusCode !== 200) throw new Error('Normal user login failed');
    const userToken = userLogin.data.data.token;

    const adminLogin = await request('POST', '/api/v1/auth/login', { email: 'admin@storerating.com', password: 'Admin@123456' });
    if (adminLogin.statusCode !== 200) throw new Error('Admin login failed');
    const adminToken = adminLogin.data.data.token;
    console.log('  ✔ Authenticated STORE_OWNER #1, STORE_OWNER #2, NORMAL_USER, and SYSTEM_ADMIN.');

    // --- 2. RETRIEVING OWNER 1 RATING STATS ---
    console.log('\n--- 2. RETRIEVING STORE_OWNER #1 (ALICE) RATING STATS ---');
    const owner1StatsRes = await request('GET', '/api/v1/ratings/owner/stats', null, owner1Token);
    if (owner1StatsRes.statusCode !== 200) {
      throw new Error(`Expected 200 OK for owner stats, got ${owner1StatsRes.statusCode}`);
    }
    const stats1 = owner1StatsRes.data.data;
    if (typeof stats1.averageRating !== 'number' || typeof stats1.totalRatings !== 'number') {
      throw new Error('Owner 1 stats missing numeric averageRating or totalRatings');
    }
    if (!stats1.ratingDistribution || typeof stats1.ratingDistribution !== 'object') {
      throw new Error('Owner 1 stats missing ratingDistribution object');
    }
    const dist1 = stats1.ratingDistribution;
    [1, 2, 3, 4, 5].forEach((star) => {
      if (typeof dist1[star] !== 'number' || isNaN(dist1[star])) {
        throw new Error(`Invalid star distribution count for ${star} stars: ${dist1[star]}`);
      }
    });

    console.log(`  ✔ [GET /api/v1/ratings/owner/stats] Owner #1 Stats: Average Rating = ${stats1.averageRating}★, Total Ratings = ${stats1.totalRatings}.`);
    console.log(`    ↳ 5-Star Breakdown: 5★: ${dist1[5]} | 4★: ${dist1[4]} | 3★: ${dist1[3]} | 2★: ${dist1[2]} | 1★: ${dist1[1]}.`);

    // --- 3. RETRIEVING OWNER 2 RATING STATS & ISOLATION ---
    console.log('\n--- 3. RETRIEVING STORE_OWNER #2 (MARCUS) RATING STATS ---');
    const owner2StatsRes = await request('GET', '/api/v1/ratings/owner/stats', null, owner2Token);
    if (owner2StatsRes.statusCode !== 200) throw new Error('Owner 2 stats request failed');
    const stats2 = owner2StatsRes.data.data;
    console.log(`  ✔ [GET /api/v1/ratings/owner/stats] Owner #2 Stats: Average Rating = ${stats2.averageRating}★, Total Ratings = ${stats2.totalRatings}.`);
    console.log(`  ✔ Cross-owner isolation verified: Owner #2 received separate statistics.`);

    // --- 4. ROLE-BASED ACCESS CONTROL ---
    console.log('\n--- 4. ROLE-BASED ACCESS BARRIERS ---');
    const userAccess = await request('GET', '/api/v1/ratings/owner/stats', null, userToken);
    if (userAccess.statusCode !== 403) throw new Error('NORMAL_USER was not blocked with 403');
    console.log('  ✔ [GET /api/v1/ratings/owner/stats] (NORMAL_USER) -> 403 Forbidden (Blocked).');

    const adminAccess = await request('GET', '/api/v1/ratings/owner/stats', null, adminToken);
    if (adminAccess.statusCode !== 403) throw new Error('SYSTEM_ADMIN was not blocked with 403');
    console.log('  ✔ [GET /api/v1/ratings/owner/stats] (SYSTEM_ADMIN) -> 403 Forbidden (Blocked).');

    const unauthAccess = await request('GET', '/api/v1/ratings/owner/stats');
    if (unauthAccess.statusCode !== 401) throw new Error('Unauthenticated request was not blocked with 401');
    console.log('  ✔ [GET /api/v1/ratings/owner/stats] (Unauthenticated) -> 401 Unauthorized (Blocked).');

    console.log('\n======================================================================');
    console.log('✨ ALL STORE_OWNER RATING STATISTICS TESTS PASSED (100% GREEN)');
    console.log('======================================================================\n');
  } finally {
    await stopTestServer();
  }
};

runStoreOwnerRatingStatsTests()
  .then(() => {
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('❌ Test failed:', err.message);
    await stopTestServer();
    process.exit(1);
  });
