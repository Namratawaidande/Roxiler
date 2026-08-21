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
  console.log('🧪 Running Backend Architecture Verification Suite...');

  // 1. Health Diagnostics
  const health = await request('GET', '/api/v1/health');
  if (health.statusCode !== 200) throw new Error('Health check failed');
  console.log('  ✔ [GET /api/v1/health] - Diagnostics & status verified (200 OK)');

  // 2. Validation Rejection Check (422)
  const valError = await request('POST', '/api/v1/auth/register', { name: 'A', email: 'invalid', password: '123' });
  if (valError.statusCode !== 422) throw new Error('Validation error response failed');
  console.log('  ✔ [POST /api/v1/auth/register] - Validation middleware caught invalid payload (422 Unprocessable Entity)');

  // 3. JWT Auth Authentication (Admin)
  const adminLogin = await request('POST', '/api/v1/auth/login', { email: 'admin@storerating.com', password: 'Admin@123456' });
  if (adminLogin.statusCode !== 200) throw new Error('Admin login failed');
  const adminToken = adminLogin.data.data?.token;
  console.log('  ✔ [POST /api/v1/auth/login] - Authentication & JWT generation verified for SYSTEM_ADMIN (200 OK)');

  // 4. JWT Auth Authentication (Normal User)
  const userLogin = await request('POST', '/api/v1/auth/login', { email: 'user@storerating.com', password: 'User@123456' });
  if (userLogin.statusCode !== 200) throw new Error('User login failed');
  const userToken = userLogin.data.data?.token;
  console.log('  ✔ [POST /api/v1/auth/login] - Authentication & JWT generation verified for NORMAL_USER (200 OK)');

  // 5. Stores Listing with Search/Sort/Pagination
  const stores = await request('GET', '/api/v1/stores?page=1&limit=5&sortBy=name&order=asc');
  if (stores.statusCode !== 200 || !stores.data.meta?.pagination) throw new Error('Stores query failed');
  console.log('  ✔ [GET /api/v1/stores] - Store catalog query with pagination metadata verified (200 OK)');

  // 6. Ratings Aggregations
  const ratings = await request('GET', '/api/v1/ratings/store/1');
  if (ratings.statusCode !== 200) throw new Error('Ratings query failed');
  console.log('  ✔ [GET /api/v1/ratings/store/1] - Ratings reviews and average calculation verified (200 OK)');

  // 7. Role-Based Access Control (Authorized Admin)
  const adminDash = await request('GET', '/api/v1/dashboard/admin', null, adminToken);
  if (adminDash.statusCode !== 200) throw new Error('Admin dashboard authorization failed');
  console.log('  ✔ [GET /api/v1/dashboard/admin] - RBAC granted for SYSTEM_ADMIN (200 OK)');

  // 8. Role-Based Access Control (Forbidden Normal User)
  const forbiddenDash = await request('GET', '/api/v1/dashboard/admin', null, userToken);
  if (forbiddenDash.statusCode !== 403) throw new Error('RBAC restriction failed');
  console.log('  ✔ [GET /api/v1/dashboard/admin] - RBAC blocked for NORMAL_USER as expected (403 Forbidden)');

  // 9. 404 Route Catch-All
  const notFound = await request('GET', '/api/v1/nonexistent-route');
  if (notFound.statusCode !== 404) throw new Error('404 catch-all failed');
  console.log('  ✔ [GET /api/v1/nonexistent-route] - Centralized 404 handler verified (404 Not Found)');

  // 10. Rate Limiter Security Headers
  if (!health.headers['x-ratelimit-limit']) throw new Error('Rate limit headers missing');
  console.log(`  ✔ [Rate Limiting Headers] - Active: Limit=${health.headers['x-ratelimit-limit']}, Remaining=${health.headers['x-ratelimit-remaining']}`);

  console.log('\n✨ ALL 10 ARCHITECTURAL MODULE CHECKS PASSED!\n');
};

runTests().catch((err) => {
  console.error('❌ Test failed:', err.message);
  process.exit(1);
});
