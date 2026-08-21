const db = require('../config/db');
const { parsePagination, parseSort, buildPaginationMeta } = require('../utils/queryHelper');
const { hashPassword } = require('../utils/password');
const { NotFoundError, ConflictError, BadRequestError } = require('../errors/ApiError');
const { ROLES } = require('../constants/roles');

// In-memory fallback collection for offline development & tests
const mockUsersList = [
  { id: 1, name: 'System Administrator', email: 'admin@storerating.com', role: ROLES.SYSTEM_ADMIN, address: 'HQ Administration Suite 100, Tech Plaza', created_at: '2026-01-01T00:00:00.000Z' },
  { id: 2, name: 'Alice Storekeeper', email: 'owner1@storerating.com', role: ROLES.STORE_OWNER, address: '456 Merchant Blvd, Suite 2A, Downtown', created_at: '2026-01-02T00:00:00.000Z' },
  { id: 3, name: 'Marcus Vance', email: 'owner2@storerating.com', role: ROLES.STORE_OWNER, address: '780 Artisan Square, Old Town', created_at: '2026-01-03T00:00:00.000Z' },
  { id: 4, name: 'John Doe', email: 'john.doe@example.com', role: ROLES.NORMAL_USER, address: '12 Maple Street, Apt 3B, Springfield', created_at: '2026-01-04T00:00:00.000Z' },
  { id: 5, name: 'Sarah Jenkins', email: 'sarah.jenkins@example.com', role: ROLES.NORMAL_USER, address: '88 Oak Ridge Terrace, Westview', created_at: '2026-01-05T00:00:00.000Z' },
  { id: 6, name: 'Michael Chang', email: 'michael.chang@example.com', role: ROLES.NORMAL_USER, address: '504 Pine Avenue, Bay District', created_at: '2026-01-06T00:00:00.000Z' },
  { id: 7, name: 'Emily Watson', email: 'emily.watson@example.com', role: ROLES.NORMAL_USER, address: '312 Elm Boulevard, Uptown', created_at: '2026-01-07T00:00:00.000Z' }
];

class UserService {
  /**
   * Create a new user (Admin functionality with arbitrary valid role assignment)
   */
  async createUser({ name, email, password, address, role }) {
    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name.trim();
    const cleanAddress = address ? address.trim() : null;

    if (!Object.values(ROLES).includes(role)) {
      throw new BadRequestError(`Invalid role. Supported roles: ${Object.values(ROLES).join(', ')}`);
    }

    const hashedPassword = await hashPassword(password);

    if (db.getStatus().connected) {
      const existing = await db.query('SELECT id FROM users WHERE email = $1', [cleanEmail]);
      if (existing.rows.length > 0) {
        throw new ConflictError('A user with this email address already exists.');
      }

      const res = await db.query(
        `INSERT INTO users (name, email, password_hash, address, role)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, name, email, address, role, created_at, updated_at`,
        [cleanName, cleanEmail, hashedPassword, cleanAddress, role]
      );

      return res.rows[0];
    }

    // Mock fallback
    const exists = mockUsersList.some((u) => u.email.toLowerCase() === cleanEmail);
    if (exists) {
      throw new ConflictError('A user with this email address already exists.');
    }

    const newUser = {
      id: Math.max(...mockUsersList.map((u) => u.id), 10) + 1,
      name: cleanName,
      email: cleanEmail,
      address: cleanAddress,
      role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    mockUsersList.push(newUser);
    return newUser;
  }

  /**
   * Get paginated users list with search, specific field filters, and sorting
   */
  async getUsers(query = {}) {
    const { page, limit, offset } = parsePagination(query);
    const { sortBy, order } = parseSort(
      query,
      ['id', 'name', 'email', 'address', 'role', 'created_at'],
      'created_at',
      'DESC'
    );
    const { role, search, name, email, address } = query;

    if (db.getStatus().connected) {
      const conditions = [];
      const params = [];

      if (role) {
        params.push(role);
        conditions.push(`role = $${params.length}`);
      }

      if (name) {
        params.push(`%${name.trim()}%`);
        conditions.push(`name ILIKE $${params.length}`);
      }

      if (email) {
        params.push(`%${email.trim()}%`);
        conditions.push(`email ILIKE $${params.length}`);
      }

      if (address) {
        params.push(`%${address.trim()}%`);
        conditions.push(`address ILIKE $${params.length}`);
      }

      if (search) {
        params.push(`%${search.trim()}%`);
        conditions.push(`(name ILIKE $${params.length} OR email ILIKE $${params.length} OR address ILIKE $${params.length})`);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Count query
      const countRes = await db.query(`SELECT COUNT(*) FROM users ${whereClause}`, params);
      const totalItems = parseInt(countRes.rows[0].count, 10);

      // Data query
      params.push(limit, offset);
      const dataQuery = `
        SELECT id, name, email, address, role, created_at, updated_at
        FROM users
        ${whereClause}
        ORDER BY ${sortBy} ${order}
        LIMIT $${params.length - 1} OFFSET $${params.length}
      `;
      const dataRes = await db.query(dataQuery, params);

      return {
        users: dataRes.rows,
        meta: buildPaginationMeta(totalItems, page, limit)
      };
    }

    // Mock response filtering & sorting
    let filtered = [...mockUsersList];

    if (role) {
      filtered = filtered.filter((u) => u.role === role);
    }
    if (name) {
      const q = name.toLowerCase();
      filtered = filtered.filter((u) => u.name.toLowerCase().includes(q));
    }
    if (email) {
      const q = email.toLowerCase();
      filtered = filtered.filter((u) => u.email.toLowerCase().includes(q));
    }
    if (address) {
      const q = address.toLowerCase();
      filtered = filtered.filter((u) => (u.address || '').toLowerCase().includes(q));
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.address || '').toLowerCase().includes(q)
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      let valA = a[sortBy] || '';
      let valB = b[sortBy] || '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return order === 'ASC' ? -1 : 1;
      if (valA > valB) return order === 'ASC' ? 1 : -1;
      return 0;
    });

    const totalItems = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);

    return {
      users: paginated,
      meta: buildPaginationMeta(totalItems, page, limit)
    };
  }

  /**
   * Get single user by ID
   */
  async getUserById(id) {
    const numericId = parseInt(id, 10);

    if (db.getStatus().connected) {
      const res = await db.query('SELECT id, name, email, address, role, created_at, updated_at FROM users WHERE id = $1', [numericId]);
      if (res.rows.length === 0) {
        throw new NotFoundError(`User with ID ${id} not found.`);
      }
      return res.rows[0];
    }

    const user = mockUsersList.find((u) => u.id === numericId);
    if (!user) {
      throw new NotFoundError(`User with ID ${id} not found.`);
    }

    return user;
  }

  /**
   * Update user details
   */
  async updateUser(id, { name, address, role }) {
    const numericId = parseInt(id, 10);

    if (db.getStatus().connected) {
      const updates = [];
      const params = [numericId];

      if (name) {
        params.push(name.trim());
        updates.push(`name = $${params.length}`);
      }
      if (address !== undefined) {
        params.push(address ? address.trim() : null);
        updates.push(`address = $${params.length}`);
      }
      if (role) {
        if (!Object.values(ROLES).includes(role)) {
          throw new BadRequestError(`Invalid role. Supported: ${Object.values(ROLES).join(', ')}`);
        }
        params.push(role);
        updates.push(`role = $${params.length}`);
      }

      if (updates.length === 0) {
        return this.getUserById(numericId);
      }

      const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $1 RETURNING id, name, email, address, role, created_at, updated_at`;
      const res = await db.query(query, params);
      if (res.rows.length === 0) {
        throw new NotFoundError(`User with ID ${id} not found.`);
      }
      return res.rows[0];
    }

    const userIndex = mockUsersList.findIndex((u) => u.id === numericId);
    if (userIndex === -1) {
      throw new NotFoundError(`User with ID ${id} not found.`);
    }

    mockUsersList[userIndex] = {
      ...mockUsersList[userIndex],
      ...(name ? { name: name.trim() } : {}),
      ...(address !== undefined ? { address: address ? address.trim() : null } : {}),
      ...(role ? { role } : {}),
      updated_at: new Date().toISOString()
    };

    return mockUsersList[userIndex];
  }

  /**
   * Delete user
   */
  async deleteUser(id) {
    const numericId = parseInt(id, 10);

    if (db.getStatus().connected) {
      const res = await db.query('DELETE FROM users WHERE id = $1 RETURNING id', [numericId]);
      if (res.rows.length === 0) {
        throw new NotFoundError(`User with ID ${id} not found.`);
      }
      return { id: numericId, message: 'User deleted successfully.' };
    }

    const index = mockUsersList.findIndex((u) => u.id === numericId);
    if (index === -1) {
      throw new NotFoundError(`User with ID ${id} not found.`);
    }
    mockUsersList.splice(index, 1);
    return { id: numericId, message: 'User deleted successfully.' };
  }
}

module.exports = new UserService();
