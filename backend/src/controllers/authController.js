const db = require('../config/db');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateToken } = require('../utils/token');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { HTTP_STATUS } = require('../constants/httpStatus');
const { ROLES, ROLE_DESCRIPTIONS } = require('../constants/roles');

/**
 * Demo fallback credentials for initial foundation testing before DB is populated
 */
const DEMO_USERS = [
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

/**
 * Register a new user
 * POST /api/v1/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, address, role = ROLES.NORMAL_USER } = req.body;

    if (!Object.values(ROLES).includes(role)) {
      return errorResponse(res, `Invalid role: '${role}'. Allowed roles are ${Object.values(ROLES).join(', ')}`, HTTP_STATUS.BAD_REQUEST);
    }

    const hashedPassword = await hashPassword(password);

    // If DB is connected, insert into PostgreSQL
    if (db.getStatus().connected) {
      const existing = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
      if (existing.rows.length > 0) {
        return errorResponse(res, 'User with this email already exists.', HTTP_STATUS.CONFLICT);
      }

      const result = await db.query(
        `INSERT INTO users (name, email, password_hash, address, role)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, name, email, address, role, created_at`,
        [name.trim(), email.toLowerCase().trim(), hashedPassword, address ? address.trim() : null, role]
      );

      const newUser = result.rows[0];
      const token = generateToken({ id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name });

      return successResponse(
        res,
        { user: newUser, token },
        'User registered successfully.',
        HTTP_STATUS.CREATED
      );
    }

    // Fallback response for testing before DB is set up
    const mockUser = {
      id: Math.floor(Math.random() * 1000) + 10,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      address: address || 'Demo Address',
      role,
      created_at: new Date().toISOString()
    };
    const token = generateToken({ id: mockUser.id, email: mockUser.email, role: mockUser.role, name: mockUser.name });

    return successResponse(
      res,
      { user: mockUser, token, note: 'Mock response (PostgreSQL is currently in mock/offline mode).' },
      'User registered successfully (Foundation Mock Mode).',
      HTTP_STATUS.CREATED
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Log in an existing user
 * POST /api/v1/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Try DB lookup if connected
    if (db.getStatus().connected) {
      const result = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
      if (result.rows.length > 0) {
        const user = result.rows[0];
        const isMatch = await comparePassword(password, user.password_hash);
        if (!isMatch) {
          return errorResponse(res, 'Invalid email or password credentials.', HTTP_STATUS.UNAUTHORIZED);
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

        return successResponse(res, { user: userPayload, token }, 'Login successful.');
      }
    }

    // 2. Demo User Fallback (convenient for immediate testing)
    const demo = DEMO_USERS.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    if (demo && (password === demo.rawPassword || (await comparePassword(password, demo.passwordHash)))) {
      const userPayload = {
        id: demo.id,
        name: demo.name,
        email: demo.email,
        role: demo.role,
        address: demo.address
      };
      const token = generateToken(userPayload);
      return successResponse(res, { user: userPayload, token, note: 'Logged in via demo test profile.' }, 'Login successful (Demo Mode).');
    }

    return errorResponse(res, 'Invalid email or password.', HTTP_STATUS.UNAUTHORIZED);
  } catch (err) {
    next(err);
  }
};

/**
 * Get current authenticated user profile
 * GET /api/v1/auth/me
 */
const getProfile = async (req, res, next) => {
  try {
    return successResponse(
      res,
      { user: req.user },
      'User profile retrieved successfully.'
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Get system roles and descriptions
 * GET /api/v1/auth/roles
 */
const getRoles = (req, res) => {
  const rolesList = Object.entries(ROLE_DESCRIPTIONS).map(([role, description]) => ({
    role,
    description
  }));

  return successResponse(res, { roles: rolesList }, 'System roles retrieved successfully.');
};

module.exports = {
  register,
  login,
  getProfile,
  getRoles
};
