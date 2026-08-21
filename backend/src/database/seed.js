const { pool, testConnection } = require('../config/db');
const { hashPassword } = require('../utils/password');
const { ROLES } = require('../constants/roles');
const logger = require('../utils/logger');

const runSeed = async () => {
  logger.info('Starting database seeding...');

  const isConnected = await testConnection();
  if (!isConnected) {
    logger.error('Cannot run seed: Database connection failed.');
    process.exit(1);
  }

  try {
    const adminPasswordHash = await hashPassword('Admin@123456');
    const ownerPasswordHash = await hashPassword('Owner@123456');
    const userPasswordHash = await hashPassword('User@123456');

    // 1. Insert or Update System Admin
    const adminRes = await pool.query(
      `INSERT INTO users (name, email, password_hash, address, role)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role
       RETURNING id, name, email, role`,
      ['System Administrator', 'admin@storerating.com', adminPasswordHash, 'HQ Administration Suite 100', ROLES.SYSTEM_ADMIN]
    );
    logger.info(`Seeded Admin User: ${adminRes.rows[0].email} (Role: ${adminRes.rows[0].role})`);

    // 2. Insert or Update Store Owner
    const ownerRes = await pool.query(
      `INSERT INTO users (name, email, password_hash, address, role)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role
       RETURNING id, name, email, role`,
      ['Alice Storekeeper', 'owner@storerating.com', ownerPasswordHash, '456 Merchant Blvd, Suite 2', ROLES.STORE_OWNER]
    );
    const ownerId = ownerRes.rows[0].id;
    logger.info(`Seeded Store Owner: ${ownerRes.rows[0].email} (Role: ${ownerRes.rows[0].role})`);

    // 3. Insert or Update Normal User
    const userRes = await pool.query(
      `INSERT INTO users (name, email, password_hash, address, role)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role
       RETURNING id, name, email, role`,
      ['John Customer', 'user@storerating.com', userPasswordHash, '789 Residential Park, Apt 4B', ROLES.NORMAL_USER]
    );
    const normalUserId = userRes.rows[0].id;
    logger.info(`Seeded Normal User: ${userRes.rows[0].email} (Role: ${userRes.rows[0].role})`);

    // 4. Insert Sample Store
    const storeRes = await pool.query(
      `INSERT INTO stores (name, email, address, owner_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email`,
      ['Apex Digital & Electronics', 'contact@apexdigital.com', '101 Tech Avenue, Silicon Bay', ownerId]
    );
    const storeId = storeRes.rows[0].id;
    logger.info(`Seeded Store: ${storeRes.rows[0].name} (ID: ${storeId})`);

    // 5. Insert Sample Rating
    await pool.query(
      `INSERT INTO ratings (user_id, store_id, rating, comment)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, store_id) DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment`,
      [normalUserId, storeId, 5, 'Outstanding service, authentic gadgets and swift support!']
    );
    logger.info(`Seeded initial 5-star rating for store ${storeId} by user ${normalUserId}`);

    logger.info('✅ Database seeding finished successfully!');
    logger.info('===============================================');
    logger.info('Default Credentials Seeded:');
    logger.info('  SYSTEM_ADMIN : admin@storerating.com / Admin@123456');
    logger.info('  STORE_OWNER  : owner@storerating.com / Owner@123456');
    logger.info('  NORMAL_USER  : user@storerating.com  / User@123456');
    logger.info('===============================================');
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
