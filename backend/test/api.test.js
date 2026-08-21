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

const runPasswordChangeSecurityTests = async () => {
  await startTestServer();
  console.log(`\n======================================================================`);
  console.log(`🧪 TEST RUNNER: STORE_OWNER Secure Password Change & Verification Suite`);
  console.log(`🌐 Server Base URL: ${baseUrl}`);
  console.log(`======================================================================\n`);

  try {
    // --- 1. AUTHENTICATING TEST STORE_OWNER ---
    console.log('--- 1. AUTHENTICATING STORE_OWNER ---');
    const ownerLogin = await request('POST', '/api/v1/auth/login', { email: 'owner1@storerating.com', password: 'Owner@123456' });
    if (ownerLogin.statusCode !== 200) throw new Error('Store Owner initial login failed');
    const ownerToken = ownerLogin.data.data.token;
    console.log('  ✔ Authenticated STORE_OWNER (Alice Storekeeper).');

    // --- 2. WRONG CURRENT PASSWORD REJECTION ---
    console.log('\n--- 2. INCORRECT CURRENT PASSWORD REJECTION ---');
    const wrongCurrentRes = await request('PUT', '/api/v1/auth/password', {
      currentPassword: 'IncorrectOldPassword@99',
      newPassword: 'NewPass@2026',
      confirmNewPassword: 'NewPass@2026'
    }, ownerToken);
    if (wrongCurrentRes.statusCode !== 401) {
      throw new Error(`Expected 401 Unauthorized for incorrect current password, got ${wrongCurrentRes.statusCode}`);
    }
    console.log('  ✔ Incorrect current password rejected (401 Unauthorized as expected).');

    // --- 3. IDENTICAL PASSWORD REJECTION ---
    console.log('\n--- 3. IDENTICAL PASSWORD REJECTION ---');
    const identicalRes = await request('PUT', '/api/v1/auth/password', {
      currentPassword: 'Owner@123456',
      newPassword: 'Owner@123456',
      confirmNewPassword: 'Owner@123456'
    }, ownerToken);
    if (identicalRes.statusCode !== 400) {
      throw new Error(`Expected 400 Bad Request for identical password, got ${identicalRes.statusCode}`);
    }
    console.log('  ✔ New password identical to current password rejected (400 Bad Request).');

    // --- 4. PASSWORD COMPLEXITY & CONFIRMATION VALIDATION ---
    console.log('\n--- 4. PASSWORD COMPLEXITY & CONFIRMATION VALIDATION ---');
    // Short password (< 8 chars)
    const shortRes = await request('PUT', '/api/v1/auth/password', {
      currentPassword: 'Owner@123456',
      newPassword: 'Abc@1',
      confirmNewPassword: 'Abc@1'
    }, ownerToken);
    if (shortRes.statusCode !== 422) throw new Error('Short password was not rejected with 422');
    console.log('  ✔ Password < 8 characters rejected (422 Unprocessable Entity).');

    // Missing special character
    const noSpecialRes = await request('PUT', '/api/v1/auth/password', {
      currentPassword: 'Owner@123456',
      newPassword: 'ValidPassword12',
      confirmNewPassword: 'ValidPassword12'
    }, ownerToken);
    if (noSpecialRes.statusCode !== 422) throw new Error('Password without special char was not rejected with 422');
    console.log('  ✔ Password without special character rejected (422 Unprocessable Entity).');

    // Mismatched confirmation
    const mismatchRes = await request('PUT', '/api/v1/auth/password', {
      currentPassword: 'Owner@123456',
      newPassword: 'ValidPass@2026',
      confirmNewPassword: 'DiffPass@2026'
    }, ownerToken);
    if (mismatchRes.statusCode !== 422 && mismatchRes.statusCode !== 400) {
      throw new Error('Mismatched confirmation password was not rejected');
    }
    console.log('  ✔ Password and confirmation mismatch rejected (422/400 as expected).');

    // --- 5. SUCCESSFUL PASSWORD UPDATE ---
    console.log('\n--- 5. SUCCESSFUL PASSWORD UPDATE ---');
    const updateRes = await request('PUT', '/api/v1/auth/password', {
      currentPassword: 'Owner@123456',
      newPassword: 'NewOwner@2026',
      confirmNewPassword: 'NewOwner@2026'
    }, ownerToken);

    if (updateRes.statusCode !== 200) {
      throw new Error(`Expected 200 OK for valid password update, got ${updateRes.statusCode}: ${JSON.stringify(updateRes.data)}`);
    }
    console.log('  ✔ [PUT /api/v1/auth/password] Password updated successfully (200 OK).');

    // --- 6. VERIFY SUBSEQUENT LOGIN WITH NEW PASSWORD ---
    console.log('\n--- 6. VERIFY LOGIN WITH NEW PASSWORD ---');
    const newLoginRes = await request('POST', '/api/v1/auth/login', {
      email: 'owner1@storerating.com',
      password: 'NewOwner@2026'
    });
    if (newLoginRes.statusCode !== 200) {
      throw new Error('Login with new password failed');
    }
    console.log('  ✔ Login with newly updated password succeeded (200 OK).');

    // Reset password back for subsequent tests
    await request('PUT', '/api/v1/auth/password', {
      currentPassword: 'NewOwner@2026',
      newPassword: 'Owner@123456',
      confirmNewPassword: 'Owner@123456'
    }, newLoginRes.data.data.token);

    console.log('\n======================================================================');
    console.log('✨ ALL PASSWORD CHANGE SECURITY TESTS PASSED (100% GREEN)');
    console.log('======================================================================\n');
  } finally {
    await stopTestServer();
  }
};

runPasswordChangeSecurityTests()
  .then(() => {
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('❌ Test failed:', err.message);
    await stopTestServer();
    process.exit(1);
  });
