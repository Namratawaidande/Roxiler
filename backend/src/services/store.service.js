const db = require('../config/db');
const { parsePagination, parseSort, buildPaginationMeta } = require('../utils/queryHelper');
const { NotFoundError, ForbiddenError, BadRequestError, ConflictError } = require('../errors/ApiError');
const { ROLES } = require('../constants/roles');

// In-memory fallback mock stores for offline development & tests
const mockStoresList = [
  {
    id: 1,
    name: 'Apex Digital & Electronics Flagship',
    email: 'contact@apexdigital.com',
    address: '101 Tech Avenue, Silicon Bay',
    owner_id: 2,
    owner_name: 'Alice Storekeeper',
    averageRating: 4.8,
    ratingCount: 142,
    created_at: '2026-01-10T10:00:00.000Z'
  },
  {
    id: 2,
    name: 'Urban Gourmet & Artisan Market',
    email: 'hello@urbangourmet.com',
    address: '220 Culinary Lane, Downtown Plaza',
    owner_id: 3,
    owner_name: 'Marcus Vance',
    averageRating: 4.9,
    ratingCount: 210,
    created_at: '2026-01-12T11:00:00.000Z'
  },
  {
    id: 3,
    name: 'Apex Mobile & Gadgets Express',
    email: 'support@apexmobile.com',
    address: '240 Innovation Way, Silicon Bay',
    owner_id: 2,
    owner_name: 'Alice Storekeeper',
    averageRating: 4.3,
    ratingCount: 68,
    created_at: '2026-01-15T14:30:00.000Z'
  }
];

class StoreService {
  /**
   * Get stores list with multi-field search, specific field filters, dynamic rating calculations, and sorting
   */
  async getStores(query = {}) {
    const { page, limit, offset } = parsePagination(query);
    const { sortBy, order } = parseSort(
      query,
      ['id', 'name', 'email', 'address', 'rating', 'averageRating', 'ratingCount', 'created_at'],
      'created_at',
      'DESC'
    );
    const { search, name, email, address, minRating, maxRating } = query;

    if (db.getStatus().connected) {
      const conditions = [];
      const params = [];

      if (search) {
        params.push(`%${search.trim()}%`);
        conditions.push(`(s.name ILIKE $${params.length} OR s.address ILIKE $${params.length} OR s.email ILIKE $${params.length})`);
      }

      if (name) {
        params.push(`%${name.trim()}%`);
        conditions.push(`s.name ILIKE $${params.length}`);
      }

      if (email) {
        params.push(`%${email.trim()}%`);
        conditions.push(`s.email ILIKE $${params.length}`);
      }

      if (address) {
        params.push(`%${address.trim()}%`);
        conditions.push(`s.address ILIKE $${params.length}`);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Determine sorting clause for SQL
      let orderClause = '';
      if (sortBy === 'rating' || sortBy === 'averageRating') {
        orderClause = `ORDER BY COALESCE(AVG(r.rating_value), 0.0) ${order}`;
      } else if (sortBy === 'ratingCount') {
        orderClause = `ORDER BY COUNT(r.id) ${order}`;
      } else {
        orderClause = `ORDER BY s.${sortBy} ${order}`;
      }

      // Having clause for rating range if specified
      const havingConditions = [];
      if (minRating) {
        havingConditions.push(`AVG(r.rating_value) >= ${parseFloat(minRating)}`);
      }
      if (maxRating) {
        havingConditions.push(`AVG(r.rating_value) <= ${parseFloat(maxRating)}`);
      }
      const havingClause = havingConditions.length > 0 ? `HAVING ${havingConditions.join(' AND ')}` : '';

      // Main aggregated query with real-time dynamic ratings calculated from ratings table
      const dataQuery = `
        SELECT 
          s.id,
          s.name,
          s.email,
          s.address,
          s.owner_id,
          u.name as owner_name,
          s.created_at,
          s.updated_at,
          COALESCE(ROUND(AVG(r.rating_value)::numeric, 1), 0.0)::float as "averageRating",
          COALESCE(ROUND(AVG(r.rating_value)::numeric, 1), 0.0)::float as "overall_rating",
          COUNT(r.id)::int as "ratingCount"
        FROM stores s
        LEFT JOIN users u ON s.owner_id = u.id
        LEFT JOIN ratings r ON s.id = r.store_id
        ${whereClause}
        GROUP BY s.id, u.name
        ${havingClause}
        ${orderClause}
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

    // Mock response filtering & sorting
    let filtered = [...mockStoresList];

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((s) =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q)
      );
    }
    if (name) {
      const q = name.toLowerCase();
      filtered = filtered.filter((s) => s.name.toLowerCase().includes(q));
    }
    if (email) {
      const q = email.toLowerCase();
      filtered = filtered.filter((s) => s.email.toLowerCase().includes(q));
    }
    if (address) {
      const q = address.toLowerCase();
      filtered = filtered.filter((s) => s.address.toLowerCase().includes(q));
    }
    if (minRating) {
      filtered = filtered.filter((s) => s.averageRating >= parseFloat(minRating));
    }
    if (maxRating) {
      filtered = filtered.filter((s) => s.averageRating <= parseFloat(maxRating));
    }

    // Sorting
    filtered.sort((a, b) => {
      let sortKey = sortBy;
      if (sortKey === 'rating') sortKey = 'averageRating';

      let valA = a[sortKey] ?? 0;
      let valB = b[sortKey] ?? 0;
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return order === 'ASC' ? -1 : 1;
      if (valA > valB) return order === 'ASC' ? 1 : -1;
      return 0;
    });

    const totalItems = filtered.length;
    const paginated = filtered.slice(offset, offset + limit);

    return {
      stores: paginated,
      meta: buildPaginationMeta(totalItems, page, limit)
    };
  }

  /**
   * Get store by ID with overall rating and review highlights
   */
  async getStoreById(id) {
    const numericId = parseInt(id, 10);

    if (db.getStatus().connected) {
      const query = `
        SELECT 
          s.id,
          s.name,
          s.email,
          s.address,
          s.owner_id,
          u.name as owner_name,
          u.email as owner_email,
          s.created_at,
          s.updated_at,
          COALESCE(ROUND(AVG(r.rating_value)::numeric, 1), 0.0)::float as "averageRating",
          COALESCE(ROUND(AVG(r.rating_value)::numeric, 1), 0.0)::float as "overall_rating",
          COUNT(r.id)::int as "ratingCount"
        FROM stores s
        LEFT JOIN users u ON s.owner_id = u.id
        LEFT JOIN ratings r ON s.id = r.store_id
        WHERE s.id = $1
        GROUP BY s.id, u.name, u.email
      `;
      const res = await db.query(query, [numericId]);
      if (res.rows.length === 0) {
        throw new NotFoundError(`Store with ID ${id} not found.`);
      }
      return res.rows[0];
    }

    const store = mockStoresList.find((s) => s.id === numericId);
    if (!store) {
      throw new NotFoundError(`Store with ID ${id} not found.`);
    }

    return store;
  }

  /**
   * Create a new store (SYSTEM_ADMIN only, must associate with a valid STORE_OWNER)
   */
  async createStore({ name, email, address, owner_id, ownerId }, requestingUser) {
    const targetOwnerId = parseInt(owner_id || ownerId, 10);

    if (!targetOwnerId) {
      throw new BadRequestError('Owner ID is required. Every store must be assigned to a valid STORE_OWNER.');
    }

    // Verify that the referenced owner exists and is a STORE_OWNER
    if (db.getStatus().connected) {
      const ownerRes = await db.query('SELECT id, name, email, role FROM users WHERE id = $1', [targetOwnerId]);
      if (ownerRes.rows.length === 0) {
        throw new BadRequestError(`Referenced store owner with ID ${targetOwnerId} does not exist.`);
      }
      if (ownerRes.rows[0].role !== ROLES.STORE_OWNER) {
        throw new BadRequestError(`User "${ownerRes.rows[0].name}" has role ${ownerRes.rows[0].role}. Stores can only be assigned to users with role STORE_OWNER.`);
      }

      // Check duplicate store email
      const existingStore = await db.query('SELECT id FROM stores WHERE email = $1', [email.toLowerCase().trim()]);
      if (existingStore.rows.length > 0) {
        throw new ConflictError('A store with this contact email address already exists.');
      }

      const res = await db.query(
        `INSERT INTO stores (name, email, address, owner_id)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, email, address, owner_id, created_at, updated_at`,
        [name.trim(), email.toLowerCase().trim(), address.trim(), targetOwnerId]
      );

      const created = res.rows[0];
      return {
        ...created,
        owner_name: ownerRes.rows[0].name,
        averageRating: 0.0,
        overall_rating: 0.0,
        ratingCount: 0
      };
    }

    // Mock fallback verification
    if (targetOwnerId === 4) { // Demo Normal User ID
      throw new BadRequestError('User John Doe has role NORMAL_USER. Stores can only be assigned to users with role STORE_OWNER.');
    }

    const newStore = {
      id: Math.max(...mockStoresList.map((s) => s.id), 10) + 1,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      address: address.trim(),
      owner_id: targetOwnerId,
      owner_name: targetOwnerId === 2 ? 'Alice Storekeeper' : 'Marcus Vance',
      averageRating: 0.0,
      overall_rating: 0.0,
      ratingCount: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    mockStoresList.push(newStore);
    return newStore;
  }

  /**
   * Update store details (SYSTEM_ADMIN)
   */
  async updateStore(id, updateData, requestingUser) {
    const numericId = parseInt(id, 10);
    const store = await this.getStoreById(numericId);

    if (requestingUser.role !== ROLES.SYSTEM_ADMIN && store.owner_id !== requestingUser.id) {
      throw new ForbiddenError('You do not have permission to modify this store.');
    }

    const { name, email, address, owner_id, ownerId } = updateData;
    const newOwnerId = owner_id || ownerId;

    if (db.getStatus().connected) {
      const updates = [];
      const params = [numericId];

      if (name) {
        params.push(name.trim());
        updates.push(`name = $${params.length}`);
      }
      if (email) {
        params.push(email.toLowerCase().trim());
        updates.push(`email = $${params.length}`);
      }
      if (address) {
        params.push(address.trim());
        updates.push(`address = $${params.length}`);
      }
      if (newOwnerId && requestingUser.role === ROLES.SYSTEM_ADMIN) {
        // Validate new owner is STORE_OWNER
        const ownerRes = await db.query('SELECT id, role FROM users WHERE id = $1', [newOwnerId]);
        if (ownerRes.rows.length === 0 || ownerRes.rows[0].role !== ROLES.STORE_OWNER) {
          throw new BadRequestError('Assigned store owner must be a valid user with role STORE_OWNER.');
        }
        params.push(newOwnerId);
        updates.push(`owner_id = $${params.length}`);
      }

      if (updates.length === 0) return store;

      const query = `UPDATE stores SET ${updates.join(', ')} WHERE id = $1 RETURNING *`;
      const res = await db.query(query, params);
      return res.rows[0];
    }

    const index = mockStoresList.findIndex((s) => s.id === numericId);
    if (index !== -1) {
      mockStoresList[index] = {
        ...mockStoresList[index],
        ...(name ? { name: name.trim() } : {}),
        ...(email ? { email: email.toLowerCase().trim() } : {}),
        ...(address ? { address: address.trim() } : {}),
        updated_at: new Date().toISOString()
      };
      return mockStoresList[index];
    }

    return store;
  }

  /**
   * Delete store
   */
  async deleteStore(id, requestingUser) {
    const numericId = parseInt(id, 10);
    const store = await this.getStoreById(numericId);

    if (requestingUser.role !== ROLES.SYSTEM_ADMIN && store.owner_id !== requestingUser.id) {
      throw new ForbiddenError('You do not have permission to delete this store.');
    }

    if (db.getStatus().connected) {
      await db.query('DELETE FROM stores WHERE id = $1', [numericId]);
      return { id: numericId, message: 'Store deleted successfully.' };
    }

    const index = mockStoresList.findIndex((s) => s.id === numericId);
    if (index !== -1) {
      mockStoresList.splice(index, 1);
    }
    return { id: numericId, message: 'Store deleted successfully.' };
  }
}

module.exports = new StoreService();
