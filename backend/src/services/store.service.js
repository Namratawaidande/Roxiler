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
    overall_rating: 4.8,
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
    overall_rating: 4.9,
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
    overall_rating: 4.3,
    ratingCount: 68,
    created_at: '2026-01-15T14:30:00.000Z'
  }
];

// Mock user-submitted ratings map: `${storeId}_${userId}` -> rating
const mockUserRatings = {
  '1_4': { rating: 5, comment: 'Outstanding service and quick delivery!' } // John Doe (id: 4) rated Store 1 with 5 stars
};

class StoreService {
  /**
   * Get stores list with multi-field search, specific field filters, dynamic rating calculations,
   * authenticated user's own submitted rating, and sorting.
   */
  async getStores(query = {}, userId = null) {
    const { page, limit, offset } = parsePagination(query);
    const { sortBy, order } = parseSort(
      query,
      ['id', 'name', 'email', 'address', 'rating', 'averageRating', 'ratingCount', 'myRating', 'created_at'],
      'created_at',
      'DESC'
    );
    const { search, name, email, address, minRating, maxRating } = query;
    const numericUserId = userId ? parseInt(userId, 10) : null;

    if (db.getStatus().connected) {
      const conditions = [];
      const params = [];

      let userJoinParamIdx = 0;
      let userJoinClause = '';
      if (numericUserId) {
        params.push(numericUserId);
        userJoinParamIdx = params.length;
        userJoinClause = `LEFT JOIN ratings ur ON s.id = ur.store_id AND ur.user_id = $${userJoinParamIdx}`;
      } else {
        userJoinClause = 'LEFT JOIN ratings ur ON 1=0'; // dummy join returning nulls
      }

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
      } else if (sortBy === 'myRating') {
        orderClause = `ORDER BY COALESCE(ur.rating_value, 0) ${order}`;
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

      // Main aggregated query with real-time dynamic ratings and user's own submitted rating
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
          COUNT(r.id)::int as "ratingCount",
          ur.rating_value as "myRating",
          ur.rating_value as "userSubmittedRating",
          ur.id as "myRatingId",
          ur.comment as "myComment",
          ur.created_at as "myRatedAt"
        FROM stores s
        LEFT JOIN users u ON s.owner_id = u.id
        LEFT JOIN ratings r ON s.id = r.store_id
        ${userJoinClause}
        ${whereClause}
        GROUP BY s.id, u.name, ur.id, ur.rating_value, ur.comment, ur.created_at
        ${havingClause}
        ${orderClause}
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;

      params.push(limit, offset);
      const dataRes = await db.query(dataQuery, params);

      const countRes = await db.query(`SELECT COUNT(*) FROM stores s ${whereClause}`, params.slice(0, numericUserId ? params.length - 2 : params.length - 2));
      const totalItems = parseInt(countRes.rows[0].count, 10);

      return {
        stores: dataRes.rows,
        meta: buildPaginationMeta(totalItems, page, limit)
      };
    }

    // Mock response filtering & sorting
    const ratingService = require('./rating.service');
    const ratingsList = ratingService.mockRatingsCollection || [];

    let filtered = mockStoresList.map((s) => {
      const userRatingEntry = numericUserId
        ? ratingsList.find((r) => r.store_id === s.id && r.user_id === numericUserId)
        : null;

      const storeRatings = ratingsList.filter((r) => r.store_id === s.id);
      const avg = storeRatings.length > 0
        ? Math.round((storeRatings.reduce((acc, curr) => acc + curr.rating_value, 0) / storeRatings.length) * 10) / 10
        : s.averageRating;

      return {
        ...s,
        averageRating: avg,
        overall_rating: avg,
        myRating: userRatingEntry ? userRatingEntry.rating_value : null,
        userSubmittedRating: userRatingEntry ? userRatingEntry.rating_value : null,
        myComment: userRatingEntry ? userRatingEntry.comment : null
      };
    });

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

      let valA = a[sortKey] ?? (order === 'ASC' ? Infinity : -Infinity);
      let valB = b[sortKey] ?? (order === 'ASC' ? Infinity : -Infinity);
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
  async getStoreById(id, userId = null) {
    const numericId = parseInt(id, 10);
    const numericUserId = userId ? parseInt(userId, 10) : null;

    if (db.getStatus().connected) {
      let userJoinClause = '';
      const params = [numericId];

      if (numericUserId) {
        params.push(numericUserId);
        userJoinClause = `LEFT JOIN ratings ur ON s.id = ur.store_id AND ur.user_id = $2`;
      } else {
        userJoinClause = 'LEFT JOIN ratings ur ON 1=0';
      }

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
          COUNT(r.id)::int as "ratingCount",
          ur.rating_value as "myRating",
          ur.rating_value as "userSubmittedRating",
          ur.id as "myRatingId",
          ur.comment as "myComment",
          ur.created_at as "myRatedAt"
        FROM stores s
        LEFT JOIN users u ON s.owner_id = u.id
        LEFT JOIN ratings r ON s.id = r.store_id
        ${userJoinClause}
        WHERE s.id = $1
        GROUP BY s.id, u.name, u.email, ur.id, ur.rating_value, ur.comment, ur.created_at
      `;
      const res = await db.query(query, params);
      if (res.rows.length === 0) {
        throw new NotFoundError(`Store with ID ${id} not found.`);
      }
      return res.rows[0];
    }

    const store = mockStoresList.find((s) => s.id === numericId);
    if (!store) {
      throw new NotFoundError(`Store with ID ${id} not found.`);
    }

    const ratingService = require('./rating.service');
    const ratingsList = ratingService.mockRatingsCollection || [];
    const userRatingEntry = numericUserId
      ? ratingsList.find((r) => r.store_id === store.id && r.user_id === numericUserId)
      : null;

    const storeRatings = ratingsList.filter((r) => r.store_id === store.id);
    const avg = storeRatings.length > 0
      ? Math.round((storeRatings.reduce((acc, curr) => acc + curr.rating_value, 0) / storeRatings.length) * 10) / 10
      : (store.averageRating || 0.0);

    return {
      ...store,
      averageRating: avg,
      overall_rating: avg,
      myRating: userRatingEntry ? userRatingEntry.rating_value : null,
      userSubmittedRating: userRatingEntry ? userRatingEntry.rating_value : null,
      myComment: userRatingEntry ? userRatingEntry.comment : null
    };
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
        ratingCount: 0,
        myRating: null,
        userSubmittedRating: null
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
      myRating: null,
      userSubmittedRating: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    mockStoresList.push(newStore);
    return newStore;
  }

  /**
   * Update store details
   */
  async updateStore(id, updateData, requestingUser) {
    const numericId = parseInt(id, 10);
    const store = await this.getStoreById(numericId, requestingUser.id);

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
    const store = await this.getStoreById(numericId, requestingUser.id);

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

const storeService = new StoreService();
storeService.mockStoresList = mockStoresList;

module.exports = storeService;
