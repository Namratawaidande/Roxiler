const db = require('../config/db');
const { parsePagination, parseSort, buildPaginationMeta } = require('../utils/queryHelper');
const { NotFoundError, ConflictError } = require('../errors/ApiError');

class UserService {
  /**
   * Get paginated users list with search, role filter, and sorting
   */
  async getUsers(query = {}) {
    const { page, limit, offset } = parsePagination(query);
    const { sortBy, order } = parseSort(query, ['id', 'name', 'email', 'role', 'created_at'], 'created_at', 'DESC');
    const { role, search } = query;

    if (db.getStatus().connected) {
      const conditions = [];
      const params = [];

      if (role) {
        params.push(role);
        conditions.push(`role = $${params.length}`);
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

    // Mock response
    let mockUsers = [
      { id: 1, name: 'System Administrator', email: 'admin@storerating.com', role: 'SYSTEM_ADMIN', address: 'HQ Suite 100', created_at: new Date().toISOString() },
      { id: 2, name: 'Alice Storekeeper', email: 'owner@storerating.com', role: 'STORE_OWNER', address: '456 Merchant Blvd', created_at: new Date().toISOString() },
      { id: 3, name: 'John Customer', email: 'user@storerating.com', role: 'NORMAL_USER', address: '789 Residential Park', created_at: new Date().toISOString() }
    ];

    if (role) {
      mockUsers = mockUsers.filter((u) => u.role === role);
    }
    if (search) {
      const q = search.toLowerCase();
      mockUsers = mockUsers.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }

    return {
      users: mockUsers,
      meta: buildPaginationMeta(mockUsers.length, page, limit)
    };
  }

  /**
   * Get single user by ID
   */
  async getUserById(id) {
    if (db.getStatus().connected) {
      const res = await db.query('SELECT id, name, email, address, role, created_at, updated_at FROM users WHERE id = $1', [id]);
      if (res.rows.length === 0) {
        throw new NotFoundError(`User with ID ${id} not found.`);
      }
      return res.rows[0];
    }

    return { id: parseInt(id, 10), name: 'Demo User', email: 'user@storerating.com', role: 'NORMAL_USER', address: 'Sample Address' };
  }

  /**
   * Update user details
   */
  async updateUser(id, { name, address, role }) {
    if (db.getStatus().connected) {
      const updates = [];
      const params = [id];

      if (name) {
        params.push(name.trim());
        updates.push(`name = $${params.length}`);
      }
      if (address !== undefined) {
        params.push(address ? address.trim() : null);
        updates.push(`address = $${params.length}`);
      }
      if (role) {
        params.push(role);
        updates.push(`role = $${params.length}`);
      }

      if (updates.length === 0) {
        return this.getUserById(id);
      }

      const query = `
        UPDATE users
        SET ${updates.join(', ')}
        WHERE id = $1
        RETURNING id, name, email, address, role, updated_at
      `;
      const res = await db.query(query, params);
      if (res.rows.length === 0) {
        throw new NotFoundError(`User with ID ${id} not found.`);
      }
      return res.rows[0];
    }

    return { id: parseInt(id, 10), name, address, role, note: 'Mock mode updated.' };
  }

  /**
   * Delete user by ID
   */
  async deleteUser(id) {
    if (db.getStatus().connected) {
      const res = await db.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
      if (res.rows.length === 0) {
        throw new NotFoundError(`User with ID ${id} not found.`);
      }
      return { id: parseInt(id, 10), message: 'User deleted successfully.' };
    }

    return { id: parseInt(id, 10), message: 'User deleted successfully (Mock mode).' };
  }
}

module.exports = new UserService();
