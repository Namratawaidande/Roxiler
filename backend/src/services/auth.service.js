const db = require('../config/db');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateToken } = require('../utils/token');
const { ConflictError, UnauthorizedError, NotFoundError, BadRequestError } = require('../errors/ApiError');
const { ROLES, ROLE_DESCRIPTIONS } = require('../constants/roles');

/**
 * Built-in demo users for zero-configuration testing when PostgreSQL is in mock/offline mode
 */
const DEMO_ACCOUNTS = [
  {
    id: 1,
    name: 'System Administrator',
    email: 'admin@storerating.com',
    passwordHash: '$2a$10$tZ98E5Zk9P9Pj0PzGjQGceU3c9r9h9aU5O/Bq6b.N3uW8vJ9u6eW.', // Admin@123456
    rawPassword: 'Admin@123456',
    address: 'Admin HQ Suite 100',
    role: ROLES.SYSTEM_ADMIN
  },
  {
    id: 2,
    name: 'Alice Storekeeper',
    email: 'owner@storerating.com',
    passwordHash: '$2a$10$tZ98E5Zk9P9Pj0PzGjQGceU3c9r9h9aU5O/Bq6b.N3uW8vJ9u6eW.', // Owner@123456
    rawPassword: 'Owner@123456',
    address: '456 Merchant Blvd',
    role: ROLES.STORE_OWNER
  },
  {
    id: 3,
    name: 'John Customer',
    email: 'user@storerating.com',
    passwordHash: '$2a$10$tZ98E5Zk9P9Pj0PzGjQGceU3c9r9h9aU5O/Bq6b.N3uW8vJ9u6eW.', // User@123456
    rawPassword: 'User@123456',
    address: '789 Residential Park',
    role: ROLES.NORMAL_USER
  }
];

class AuthService {
  /**
   * Register a new user
   */
  async register({ name, email, password, address, role = ROLES.NORMAL_USER }) {
    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name.trim();
    const cleanAddress = address ? address.trim() : null;

    const hashedPassword = await hashPassword(password);

    if (db.getStatus().connected) {
      const existing = await db.query('SELECT id FROM users WHERE email = $1', [cleanEmail]);
      if (existing.rows.length > 0) {
        throw new ConflictError('A user with this email address is already registered.');
      }

      const res = await db.query(
        `INSERT INTO users (name, email, password_hash, address, role)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, name, email, address, role, created_at`,
        [cleanName, cleanEmail, hashedPassword, cleanAddress, role]
      );

      const user = res.rows[0];
      const token = generateToken({ id: user.id, email: user.email, role: user.role, name: user.name });
      return { user, token };
    }

    // Mock mode response
    const mockUser = {
      id: Math.floor(Math.random() * 1000) + 10,
      name: cleanName,
      email: cleanEmail,
      address: cleanAddress || 'Demo Address',
      role,
      created_at: new Date().toISOString()
    };
    const token = generateToken({ id: mockUser.id, email: mockUser.email, role: mockUser.role, name: mockUser.name });
    return { user: mockUser, token, note: 'Mock mode active.' };
  }

  /**
   * Authenticate user with credentials
   */
  async login({ email, password }) {
    const cleanEmail = email.toLowerCase().trim();

    if (db.getStatus().connected) {
      const res = await db.query('SELECT * FROM users WHERE email = $1', [cleanEmail]);
      if (res.rows.length === 0) {
        throw new UnauthorizedError('Invalid email or password credentials.');
      }

      const user = res.rows[0];
      const isMatch = await comparePassword(password, user.password_hash);
      if (!isMatch) {
        throw new UnauthorizedError('Invalid email or password credentials.');
      }

      const userPayload = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        address: user.address,
        created_at: user.created_at
      };
      const token = generateToken(userPayload);
      return { user: userPayload, token };
    }

    // Fallback demo matching
    const demo = DEMO_ACCOUNTS.find((u) => u.email.toLowerCase() === cleanEmail);
    if (demo && (password === demo.rawPassword || (await comparePassword(password, demo.passwordHash)))) {
      const userPayload = {
        id: demo.id,
        name: demo.name,
        email: demo.email,
        role: demo.role,
        address: demo.address
      };
      const token = generateToken(userPayload);
      return { user: userPayload, token, note: 'Demo mode active.' };
    }

    throw new UnauthorizedError('Invalid email or password credentials.');
  }

  /**
   * Update authenticated user's password
   */
  async updatePassword(userId, { currentPassword, newPassword }) {
    if (currentPassword === newPassword) {
      throw new BadRequestError('New password must be different from the current password.');
    }

    if (db.getStatus().connected) {
      const res = await db.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
      if (res.rows.length === 0) {
        throw new NotFoundError('User not found.');
      }

      const isMatch = await comparePassword(currentPassword, res.rows[0].password_hash);
      if (!isMatch) {
        throw new UnauthorizedError('Current password is incorrect.');
      }

      const newHashed = await hashPassword(newPassword);
      await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHashed, userId]);
      return { message: 'Password updated successfully.' };
    }

    return { message: 'Password updated successfully (Demo mock mode).' };
  }

  /**
   * Get supported system roles list
   */
  getRoles() {
    return Object.entries(ROLE_DESCRIPTIONS).map(([role, description]) => ({
      role,
      description
    }));
  }
}

module.exports = new AuthService();
