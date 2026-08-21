const { pool, testConnection } = require('../config/db');
const { hashPassword } = require('../utils/password');
const { ROLES } = require('../constants/roles');
const logger = require('../utils/logger');

const runSeed = async () => {
  logger.info('Starting normalized database seeding...');

  const isConnected = await testConnection();
  if (!isConnected) {
    logger.error('Cannot run seed: PostgreSQL database is offline or unreachable.');
    process.exit(1);
  }

  try {
    const adminPasswordHash = await hashPassword('Admin@123456');
    const ownerPasswordHash = await hashPassword('Owner@123456');
    const userPasswordHash = await hashPassword('User@123456');

    // 1. Seed System Admin (Does not own a store)
    const adminRes = await pool.query(
      `INSERT INTO users (name, email, password_hash, address, role)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role
       RETURNING id, name, email, role`,
      ['System Administrator', 'admin@storerating.com', adminPasswordHash, 'HQ Administration Suite 100', ROLES.SYSTEM_ADMIN]
    );
    logger.info(`Seeded Admin User: ${adminRes.rows[0].email} (Role: ${adminRes.rows[0].role})`);

    // 2. Seed Store Owner (Associated with store)
    const ownerRes = await pool.query(
      `INSERT INTO users (name, email, password_hash, address, role)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role
       RETURNING id, name, email, role`,
      ['Alice Storekeeper', 'owner@storerating.com', ownerPasswordHash, '456 Merchant Blvd, Suite 2', ROLES.STORE_OWNER]
    );
    const ownerId = ownerRes.rows[0].id;
    logger.info(`Seeded Store Owner: ${ownerRes.rows[0].email} (Role: ${ownerRes.rows[0].role})`);

    // 3. Seed Normal User (Can submit ratings)
    const userRes = await pool.query(
      `INSERT INTO users (name, email, password_hash, address, role)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role
       RETURNING id, name, email, role`,
      ['John Customer', 'user@storerating.com', userPasswordHash, '789 Residential Park, Apt 4B', ROLES.NORMAL_USER]
    );
    const normalUserId = userRes.rows[0].id;
    logger.info(`Seeded Normal User: ${userRes.rows[0].email} (Role: ${userRes.rows[0].role})`);

    // 4. Seed Stores
    const store1Res = await pool.query(
      `INSERT INTO stores (name, email, address, owner_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, owner_id = EXCLUDED.owner_id
       RETURNING id, name, email`,
      ['Apex Digital & Electronics', 'contact@apexdigital.com', '101 Tech Avenue, Silicon Bay', ownerId]
    );
    const store1Id = store1Res.rows[0].id;
    logger.info(`Seeded Store 1: ${store1Res.rows[0].name} (ID: ${store1Id})`);

    const store2Res = await pool.query(
      `INSERT INTO stores (name, email, address, owner_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address, owner_id = EXCLUDED.owner_id
       RETURNING id, name, email`,
      ['Urban Gourmet Market', 'hello@urbangourmet.com', '220 Culinary Lane, Downtown', ownerId]
    );
    const store2Id = store2Res.rows[0].id;
    logger.info(`Seeded Store 2: ${store2Res.rows[0].name} (ID: ${store2Id})`);

    // 5. Seed 5-star Rating from Normal User on Store 1
    await pool.query(
      `INSERT INTO ratings (user_id, store_id, rating_value, comment)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, store_id) 
       DO UPDATE SET rating_value = EXCLUDED.rating_value, comment = EXCLUDED.comment, updated_at = CURRENT_TIMESTAMP`,
      [normalUserId, store1Id, 5, 'Outstanding service, authentic gadgets and swift support!']
    );
    logger.info(`Seeded 5-star rating on store "${store1Res.rows[0].name}" by user "${userRes.rows[0].email}"`);

    logger.info('✅ Normalized database seeding completed successfully!');
  } catch (err) {
    logger.error('Database seeding failed with error:', err.message);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
};

if (require.main === module) {
  runSeed();
}

module.exports = runSeed;
