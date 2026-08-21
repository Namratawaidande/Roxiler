const db = require('../config/db');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateToken } = require('../utils/token');
const { ConflictError, UnauthorizedError, NotFoundError, BadRequestError } = require('../errors/ApiError');
const { ROLES, ROLE_DESCRIPTIONS } = require('../constants/roles');

/**
 * Built-in demo accounts for offline / zero-configuration testing
 */
const DEMO_ACCOUNTS = [
  {
    id: 1,
    name: 'System Administrator',
    email: 'admin@storerating.com',
    rawPassword: 'Admin@123456',
    address: 'HQ Administration Suite 100, Tech Plaza',
    role: ROLES.SYSTEM_ADMIN
  },
  {
    id: 2,
    name: 'Alice Storekeeper',
    email: 'owner1@storerating.com',
    rawPassword: 'Owner@123456',
    address: '456 Merchant Blvd, Suite 2A, Downtown',
    role: ROLES.STORE_OWNER
  },
  {
    id: 3,
    name: 'Marcus Vance',
    email: 'owner2@storerating.com',
    rawPassword: 'Owner@123456',
    address: '780 Artisan Square, Old Town',
    role: ROLES.STORE_OWNER
  },
  {
    id: 4,
    name: 'John Doe',
    email: 'john.doe@example.com',
    rawPassword: 'User@123456',
    address: '12 Maple Street, Apt 3B, Springfield',
    role: ROLES.NORMAL_USER
  },
  {
    id: 5,
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@example.com',
    rawPassword: 'User@123456',
    address: '88 Oak Ridge Terrace, Westview',
    role: ROLES.NORMAL_USER
  },
  {
    id: 6,
    name: 'Michael Chang',
    email: 'michael.chang@example.com',
    rawPassword: 'User@123456',
    address: '504 Pine Avenue, Bay District',
    role: ROLES.NORMAL_USER
  },
  {
    id: 7,
    name: 'Emily Watson',
    email: 'emily.watson@example.com',
    rawPassword: 'User@123456',
    address: '312 Elm Boulevard, Uptown',
    role: ROLES.NORMAL_USER
  }
];

// In-memory store for fallback offline testing
const registeredMockUsers = new Map();

class AuthService {
  /**
   * Register a new user (Strictly assigns NORMAL_USER role)
   */
  async register({ name, email, password, address }) {
    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name.trim();
    const cleanAddress = address ? address.trim() : null;
    const assignedRole = ROLES.NORMAL_USER; // Guaranteed NORMAL_USER assignment

    const hashedPassword = await hashPassword(password);

    if (db.getStatus().connected) {
      const existing = await db.query('SELECT id FROM users WHERE email = $1', [cleanEmail]);
      if (existing.rows.length > 0) {
        throw new ConflictError('A user with this email address is already registered.');
      }

      const res = await db.query(
        `INSERT INTO users (name, email, password_hash, address, role)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, name, email, address, role, created_at, updated_at`,
        [cleanName, cleanEmail, hashedPassword, cleanAddress, assignedRole]
      );

      const user = res.rows[0];
      const token = generateToken({ id: user.id, email: user.email, role: user.role, name: user.name });
      return { user, token };
    }

    // Mock mode fallback uniqueness check
    if (DEMO_ACCOUNTS.some((u) => u.email.toLowerCase() === cleanEmail) || registeredMockUsers.has(cleanEmail)) {
      throw new ConflictError('A user with this email address is already registered.');
    }

    const mockUser = {
      id: Math.floor(Math.random() * 1000) + 20,
      name: cleanName,
      email: cleanEmail,
      address: cleanAddress || 'Demo Address',
      role: assignedRole,
      created_at: new Date().toISOString()
    };

    registeredMockUsers.set(cleanEmail, {
      ...mockUser,
      passwordHash: hashedPassword,
      rawPassword: password
    });

    const token = generateToken({ id: mockUser.id, email: mockUser.email, role: mockUser.role, name: mockUser.name });
    return { user: mockUser, token, note: 'Mock mode active.' };
  }

  /**
   * Unified Login for all roles (SYSTEM_ADMIN, STORE_OWNER, NORMAL_USER)
   */
  async login({ email, password }) {
    const cleanEmail = email.toLowerCase().trim();

    if (db.getStatus().connected) {
      const res = await db.query(
        'SELECT id, name, email, password_hash, address, role, created_at, updated_at FROM users WHERE email = $1',
        [cleanEmail]
      );

      if (res.rows.length === 0) {
        throw new UnauthorizedError('Invalid email or password credentials.');
      }

      const user = res.rows[0];
      const isMatch = await comparePassword(password, user.password_hash);
      if (!isMatch) {
        throw new UnauthorizedError('Invalid email or password credentials.');
      }

      // Safe user payload - password_hash is strictly omitted
      const userPayload = {
        id: user.id,
        name: user.name,
        email: user.email,
        address: user.address,
        role: user.role,
        created_at: user.created_at
      };
      const token = generateToken(userPayload);

      return { user: userPayload, token };
    }

    // Fallback demo matching
    const demo = DEMO_ACCOUNTS.find((u) => u.email.toLowerCase() === cleanEmail) || registeredMockUsers.get(cleanEmail);
    if (demo && (password === demo.rawPassword || (await comparePassword(password, demo.passwordHash || (await hashPassword(demo.rawPassword)))))) {
      const userPayload = {
        id: demo.id,
        name: demo.name,
        email: demo.email,
        address: demo.address,
        role: demo.role,
        created_at: new Date().toISOString()
      };
      const token = generateToken(userPayload);
      return { user: userPayload, token, note: 'Demo mode active.' };
    }

    throw new UnauthorizedError('Invalid email or password credentials.');
  }

  /**
   * Get Current Authenticated User profile
   */
  async getMe(userId) {
    if (db.getStatus().connected) {
      const res = await db.query(
        'SELECT id, name, email, address, role, created_at, updated_at FROM users WHERE id = $1',
        [userId]
      );
      if (res.rows.length === 0) {
        throw new NotFoundError('User profile not found.');
      }
      return res.rows[0];
    }

    // Mock fallback matching
    const demo = DEMO_ACCOUNTS.find((u) => u.id === userId) || Array.from(registeredMockUsers.values()).find((u) => u.id === userId) || DEMO_ACCOUNTS[0];
    return {
      id: demo.id,
      name: demo.name,
      email: demo.email,
      address: demo.address,
      role: demo.role,
      created_at: new Date().toISOString()
    };
  }

  /**
   * Update password for authenticated user
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

    return { message: 'Password updated successfully (Demo mode).' };
  }

  /**
   * Logout user (client-side token removal strategy acknowledgment)
   */
  async logout(user) {
    return { message: 'Logged out successfully.' };
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
