const { pool, testConnection } = require('../config/db');
const { hashPassword } = require('../utils/password');
const { ROLES } = require('../constants/roles');
const logger = require('../utils/logger');

const runSeed = async () => {
  logger.info('Starting repeatable PostgreSQL database seeding...');

  const isConnected = await testConnection();
  if (!isConnected) {
    logger.error('Cannot run seed: PostgreSQL database is offline or unreachable.');
    logger.error('Please verify your .env database credentials and that the PostgreSQL service is active.');
    process.exit(1);
  }

  try {
    // 1. Prepare Secure Hashed Passwords with Bcrypt (10 Salt Rounds)
    const adminPasswordHash = await hashPassword('Admin@123456');
    const ownerPasswordHash = await hashPassword('Owner@123456');
    const userPasswordHash = await hashPassword('User@123456');

    logger.info('Generated bcrypt password hashes for seed accounts.');

    // 2. Seed SYSTEM_ADMIN Account
    const adminRes = await pool.query(
      `INSERT INTO users (name, email, password_hash, address, role)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE 
       SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash, address = EXCLUDED.address, role = EXCLUDED.role, updated_at = CURRENT_TIMESTAMP
       RETURNING id, name, email, role`,
      ['System Administrator', 'admin@storerating.com', adminPasswordHash, 'HQ Administration Suite 100, Tech Plaza', ROLES.SYSTEM_ADMIN]
    );
    const adminUser = adminRes.rows[0];
    logger.info(`✔ Seeded SYSTEM_ADMIN: "${adminUser.email}" (ID: ${adminUser.id})`);

    // 3. Seed STORE_OWNER Accounts
    const owner1Res = await pool.query(
      `INSERT INTO users (name, email, password_hash, address, role)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE 
       SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash, address = EXCLUDED.address, role = EXCLUDED.role, updated_at = CURRENT_TIMESTAMP
       RETURNING id, name, email, role`,
      ['Alice Storekeeper', 'owner1@storerating.com', ownerPasswordHash, '456 Merchant Blvd, Suite 2A, Downtown', ROLES.STORE_OWNER]
    );
    const owner1 = owner1Res.rows[0];
    logger.info(`✔ Seeded STORE_OWNER 1: "${owner1.email}" (ID: ${owner1.id})`);

    const owner2Res = await pool.query(
      `INSERT INTO users (name, email, password_hash, address, role)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE 
       SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash, address = EXCLUDED.address, role = EXCLUDED.role, updated_at = CURRENT_TIMESTAMP
       RETURNING id, name, email, role`,
      ['Marcus Vance', 'owner2@storerating.com', ownerPasswordHash, '780 Artisan Square, Old Town', ROLES.STORE_OWNER]
    );
    const owner2 = owner2Res.rows[0];
    logger.info(`✔ Seeded STORE_OWNER 2: "${owner2.email}" (ID: ${owner2.id})`);

    // 4. Seed Multiple NORMAL_USER Accounts
    const normalUsersData = [
      { name: 'John Doe', email: 'john.doe@example.com', address: '12 Maple Street, Apt 3B, Springfield' },
      { name: 'Sarah Jenkins', email: 'sarah.jenkins@example.com', address: '88 Oak Ridge Terrace, Westview' },
      { name: 'Michael Chang', email: 'michael.chang@example.com', address: '504 Pine Avenue, Bay District' },
      { name: 'Emily Watson', email: 'emily.watson@example.com', address: '312 Elm Boulevard, Uptown' }
    ];

    const normalUsers = [];
    for (const u of normalUsersData) {
      const res = await pool.query(
        `INSERT INTO users (name, email, password_hash, address, role)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email) DO UPDATE 
         SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash, address = EXCLUDED.address, role = EXCLUDED.role, updated_at = CURRENT_TIMESTAMP
         RETURNING id, name, email, role`,
        [u.name, u.email, userPasswordHash, u.address, ROLES.NORMAL_USER]
      );
      normalUsers.push(res.rows[0]);
      logger.info(`✔ Seeded NORMAL_USER: "${res.rows[0].email}" (ID: ${res.rows[0].id})`);
    }

    // 5. Seed Stores Associated with STORE_OWNERs
    const storesData = [
      {
        name: 'Apex Digital & Electronics',
        email: 'contact@apexdigital.com',
        address: '101 Tech Avenue, Silicon Bay',
        ownerId: owner1.id
      },
      {
        name: 'Apex Mobile & Gadgets',
        email: 'support@apexmobile.com',
        address: '240 Innovation Way, Silicon Bay',
        ownerId: owner1.id
      },
      {
        name: 'Urban Gourmet & Artisan Market',
        email: 'hello@urbangourmet.com',
        address: '220 Culinary Lane, Downtown Food District',
        ownerId: owner2.id
      }
    ];

    const stores = [];
    for (const s of storesData) {
      const res = await pool.query(
        `INSERT INTO stores (name, email, address, owner_id)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) DO UPDATE 
         SET name = EXCLUDED.name, address = EXCLUDED.address, owner_id = EXCLUDED.owner_id, updated_at = CURRENT_TIMESTAMP
         RETURNING id, name, email, owner_id`,
        [s.name, s.email, s.address, s.ownerId]
      );
      stores.push(res.rows[0]);
      logger.info(`✔ Seeded STORE: "${res.rows[0].name}" (ID: ${res.rows[0].id}, Owner: ${res.rows[0].owner_id})`);
    }

    // 6. Seed Realistic Ratings & Reviews Submitted by NORMAL_USERs
    const sampleRatings = [
      // Store 1: Apex Digital
      { userId: normalUsers[0].id, storeId: stores[0].id, rating: 5, comment: 'Outstanding customer experience, genuine electronics and rapid delivery!' },
      { userId: normalUsers[1].id, storeId: stores[0].id, rating: 4, comment: 'Great product selection and attentive customer support.' },
      { userId: normalUsers[2].id, storeId: stores[0].id, rating: 5, comment: 'Top-tier tech store with great return policy.' },

      // Store 2: Apex Mobile
      { userId: normalUsers[0].id, storeId: stores[1].id, rating: 4, comment: 'Quick screen replacement service. Friendly technician.' },
      { userId: normalUsers[3].id, storeId: stores[1].id, rating: 5, comment: 'Excellent variety of accessories and authentic chargers.' },

      // Store 3: Urban Gourmet
      { userId: normalUsers[1].id, storeId: stores[2].id, rating: 5, comment: 'Best organic artisan bakery and cheese selection in town!' },
      { userId: normalUsers[2].id, storeId: stores[2].id, rating: 4, comment: 'Fresh ingredients, delightful coffee corner, and warm ambiance.' },
      { userId: normalUsers[3].id, storeId: stores[2].id, rating: 5, comment: 'Remarkable fresh produce and farm-to-table treats!' }
    ];

    for (const r of sampleRatings) {
      await pool.query(
        `INSERT INTO ratings (user_id, store_id, rating_value, comment)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, store_id) 
         DO UPDATE SET rating_value = EXCLUDED.rating_value, comment = EXCLUDED.comment, updated_at = CURRENT_TIMESTAMP`,
        [r.userId, r.storeId, r.rating, r.comment]
      );
    }
    logger.info(`✔ Seeded ${sampleRatings.length} verified ratings across stores from NORMAL_USER accounts.`);

    logger.info('========================================================================');
    logger.info('🎉 REPEATABLE DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    logger.info('========================================================================');
    logger.info('🔑 Test Accounts Ready:');
    logger.info('  • SYSTEM_ADMIN : admin@storerating.com      / Admin@123456');
    logger.info('  • STORE_OWNER 1: owner1@storerating.com     / Owner@123456 (Alice Storekeeper)');
    logger.info('  • STORE_OWNER 2: owner2@storerating.com     / Owner@123456 (Marcus Vance)');
    logger.info('  • NORMAL_USER 1: john.doe@example.com       / User@123456');
    logger.info('  • NORMAL_USER 2: sarah.jenkins@example.com  / User@123456');
    logger.info('  • NORMAL_USER 3: michael.chang@example.com  / User@123456');
    logger.info('  • NORMAL_USER 4: emily.watson@example.com   / User@123456');
    logger.info('========================================================================');
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
