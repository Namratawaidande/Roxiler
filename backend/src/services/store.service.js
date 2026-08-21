const db = require('../config/db');
const { parsePagination, parseSort, buildPaginationMeta } = require('../utils/queryHelper');
const { NotFoundError, ForbiddenError } = require('../errors/ApiError');
const { ROLES } = require('../constants/roles');

class StoreService {
  /**
   * Get stores list with search, rating filter, sorting, and pagination
   */
  async getStores(query = {}) {
    const { page, limit, offset } = parsePagination(query);
    const { sortBy, order } = parseSort(
      query,
      ['id', 'name', 'email', 'address', 'averageRating', 'ratingCount', 'created_at'],
      'created_at',
      'DESC'
    );
    const { search, minRating, maxRating } = query;

    if (db.getStatus().connected) {
      const conditions = [];
      const params = [];

      if (search) {
        params.push(`%${search.trim()}%`);
        conditions.push(`(s.name ILIKE $${params.length} OR s.address ILIKE $${params.length} OR s.email ILIKE $${params.length})`);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Main aggregated query with average rating and count using store_ratings_summary view or joined query
      const dataQuery = `
        SELECT 
          s.id,
          s.name,
          s.email,
          s.address,
          s.owner_id,
          u.name as owner_name,
          s.created_at,
          COALESCE(ROUND(AVG(r.rating_value)::numeric, 1), 0.0)::float as "averageRating",
          COUNT(r.id)::int as "ratingCount"
        FROM stores s
        LEFT JOIN users u ON s.owner_id = u.id
        LEFT JOIN ratings r ON s.id = r.store_id
        ${whereClause}
        GROUP BY s.id, u.name
        ORDER BY "${sortBy}" ${order}
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;

      params.push(limit, offset);
      const dataRes = await db.query(dataQuery, params);

      const countRes = await db.query(`SELECT COUNT(*) FROM stores s ${whereClause}`, params.slice(0, -2));
      const totalItems = parseInt(countRes.rows[0].count, 10);

      return {
        stores: dataRes.rows,
        meta: buildPaginationMeta(totalItems, page, limit)
      };
    }

    // Mock response
    const mockStores = [
      {
        id: 1,
        name: 'Apex Digital & Electronics',
        email: 'contact@apexdigital.com',
        address: '101 Tech Avenue, Silicon Bay',
        owner_id: 2,
        owner_name: 'Alice Storekeeper',
        averageRating: 4.8,
        ratingCount: 142,
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        name: 'Urban Gourmet Market',
        email: 'hello@urbangourmet.com',
        address: '220 Culinary Lane, Downtown',
        owner_id: 2,
        owner_name: 'Alice Storekeeper',
        averageRating: 4.6,
        ratingCount: 89,
        created_at: new Date().toISOString()
      }
    ];

    return {
      stores: mockStores,
      meta: buildPaginationMeta(mockStores.length, page, limit)
    };
  }

  /**
   * Get store by ID
   */
  async getStoreById(id) {
    if (db.getStatus().connected) {
      const query = `
        SELECT 
          s.id,
          s.name,
          s.email,
          s.address,
          s.owner_id,
          u.name as owner_name,
          s.created_at,
          COALESCE(ROUND(AVG(r.rating_value)::numeric, 1), 0.0)::float as "averageRating",
          COUNT(r.id)::int as "ratingCount"
        FROM stores s
        LEFT JOIN users u ON s.owner_id = u.id
        LEFT JOIN ratings r ON s.id = r.store_id
        WHERE s.id = $1
        GROUP BY s.id, u.name
      `;
      const res = await db.query(query, [id]);
      if (res.rows.length === 0) {
        throw new NotFoundError(`Store with ID ${id} not found.`);
      }
      return res.rows[0];
    }

    return {
      id: parseInt(id, 10),
      name: 'Apex Digital & Electronics',
      email: 'contact@apexdigital.com',
      address: '101 Tech Avenue, Silicon Bay',
      owner_id: 2,
      owner_name: 'Alice Storekeeper',
      averageRating: 4.8,
      ratingCount: 142
    };
  }

  /**
   * Create a new store
   */
  async createStore({ name, email, address, ownerId }, requestingUser) {
    const effectiveOwnerId = requestingUser.role === ROLES.SYSTEM_ADMIN ? (ownerId || requestingUser.id) : requestingUser.id;

    if (db.getStatus().connected) {
      const res = await db.query(
        `INSERT INTO stores (name, email, address, owner_id)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, email, address, owner_id, created_at`,
        [name.trim(), email.toLowerCase().trim(), address.trim(), effectiveOwnerId]
      );
      return res.rows[0];
    }

    return {
      id: Math.floor(Math.random() * 1000) + 10,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      address: address.trim(),
      owner_id: effectiveOwnerId,
      created_at: new Date().toISOString()
    };
  }

  /**
   * Update store
   */
  async updateStore(id, updateData, requestingUser) {
    const store = await this.getStoreById(id);

    if (requestingUser.role !== ROLES.SYSTEM_ADMIN && store.owner_id !== requestingUser.id) {
      throw new ForbiddenError('You do not have permission to modify this store.');
    }

    if (db.getStatus().connected) {
      const updates = [];
      const params = [id];

      if (updateData.name) {
        params.push(updateData.name.trim());
        updates.push(`name = $${params.length}`);
      }
      if (updateData.email) {
        params.push(updateData.email.toLowerCase().trim());
        updates.push(`email = $${params.length}`);
      }
      if (updateData.address) {
        params.push(updateData.address.trim());
        updates.push(`address = $${params.length}`);
      }
      if (updateData.ownerId && requestingUser.role === ROLES.SYSTEM_ADMIN) {
        params.push(updateData.ownerId);
        updates.push(`owner_id = $${params.length}`);
      }

      if (updates.length === 0) return store;

      const query = `UPDATE stores SET ${updates.join(', ')} WHERE id = $1 RETURNING *`;
      const res = await db.query(query, params);
      return res.rows[0];
    }

    return { ...store, ...updateData, updated_at: new Date().toISOString() };
  }

  /**
   * Delete store
   */
  async deleteStore(id, requestingUser) {
    const store = await this.getStoreById(id);

    if (requestingUser.role !== ROLES.SYSTEM_ADMIN && store.owner_id !== requestingUser.id) {
      throw new ForbiddenError('You do not have permission to delete this store.');
    }

    if (db.getStatus().connected) {
      await db.query('DELETE FROM stores WHERE id = $1', [id]);
      return { id: parseInt(id, 10), message: 'Store deleted successfully.' };
    }

    return { id: parseInt(id, 10), message: 'Store deleted successfully (Mock mode).' };
  }
}

module.exports = new StoreService();
