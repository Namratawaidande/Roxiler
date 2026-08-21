const db = require('../config/db');
const { parsePagination, parseSort, buildPaginationMeta } = require('../utils/queryHelper');
const { NotFoundError, ConflictError, BadRequestError, ForbiddenError } = require('../errors/ApiError');
const { ROLES } = require('../constants/roles');

// Mock fallback ratings store
const mockRatingsCollection = [
  {
    id: 1,
    user_id: 4,
    userName: 'John Doe',
    userEmail: 'john.doe@example.com',
    userAddress: '12 Maple Street, Apt 3B, Springfield',
    store_id: 1,
    storeName: 'Apex Digital & Electronics Flagship',
    owner_id: 2,
    rating_value: 5,
    comment: 'Outstanding service and quick delivery of electronics!',
    created_at: '2026-01-20T10:00:00.000Z',
    updated_at: '2026-01-20T10:00:00.000Z'
  },
  {
    id: 2,
    user_id: 5,
    userName: 'Sarah Jenkins',
    userEmail: 'sarah.jenkins@example.com',
    userAddress: '88 Oak Ridge Terrace, Westview',
    store_id: 1,
    storeName: 'Apex Digital & Electronics Flagship',
    owner_id: 2,
    rating_value: 4,
    comment: 'Very good product selection and friendly staff.',
    created_at: '2026-01-22T14:30:00.000Z',
    updated_at: '2026-01-22T14:30:00.000Z'
  },
  {
    id: 3,
    user_id: 6,
    userName: 'Michael Chang',
    userEmail: 'michael.chang@example.com',
    userAddress: '504 Pine Avenue, Bay District',
    store_id: 2,
    storeName: 'Urban Gourmet & Artisan Market',
    owner_id: 3,
    rating_value: 5,
    comment: 'The highest quality artisan goods and fresh organic bakery in town.',
    created_at: '2026-01-25T09:15:00.000Z',
    updated_at: '2026-01-25T09:15:00.000Z'
  }
];

class RatingService {
  /**
   * Submit a new rating for a store (NORMAL_USER only)
   */
  async submitRating({ storeId, store_id, rating, rating_value, comment }, user) {
    if (!user || user.role !== ROLES.NORMAL_USER) {
      throw new ForbiddenError('Only NORMAL_USER accounts can submit store ratings.');
    }

    const numericStoreId = parseInt(storeId || store_id, 10);
    const numericRating = parseInt(rating !== undefined ? rating : rating_value, 10);
    const cleanComment = comment ? comment.trim() : null;

    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      throw new BadRequestError('Rating must be an integer between 1 and 5.');
    }

    if (db.getStatus().connected) {
      // 1. Verify Store Existence
      const storeRes = await db.query('SELECT id, name FROM stores WHERE id = $1', [numericStoreId]);
      if (storeRes.rows.length === 0) {
        throw new NotFoundError(`Store with ID ${numericStoreId} not found.`);
      }

      // 2. Prevent Duplicate Submission
      const existingRes = await db.query(
        'SELECT id, rating_value FROM ratings WHERE user_id = $1 AND store_id = $2',
        [user.id, numericStoreId]
      );
      if (existingRes.rows.length > 0) {
        throw new ConflictError('You have already submitted a rating for this store. Please modify your existing rating instead.');
      }

      // 3. Insert Rating atomically
      const insertRes = await db.query(
        `INSERT INTO ratings (user_id, store_id, rating_value, comment)
         VALUES ($1, $2, $3, $4)
         RETURNING id, user_id, store_id, rating_value, comment, created_at, updated_at`,
        [user.id, numericStoreId, numericRating, cleanComment]
      );

      const createdRating = insertRes.rows[0];

      // 4. Fetch updated store overall rating
      const avgRes = await db.query(
        `SELECT 
           COALESCE(ROUND(AVG(rating_value)::numeric, 1), 0.0)::float as "averageRating",
           COUNT(id)::int as "ratingCount"
         FROM ratings WHERE store_id = $1`,
        [numericStoreId]
      );

      return {
        ...createdRating,
        storeName: storeRes.rows[0].name,
        storeAverageRating: avgRes.rows[0].averageRating,
        storeRatingCount: avgRes.rows[0].ratingCount
      };
    }

    // Mock Fallback
    const storeService = require('./store.service');
    const store = (storeService.mockStoresList || []).find((s) => s.id === numericStoreId);
    if (!store) {
      throw new NotFoundError(`Store with ID ${numericStoreId} not found.`);
    }

    const existingRating = mockRatingsCollection.find((r) => r.user_id === user.id && r.store_id === numericStoreId);
    if (existingRating) {
      throw new ConflictError('You have already submitted a rating for this store. Please modify your existing rating instead.');
    }

    const newRating = {
      id: Math.max(...mockRatingsCollection.map((r) => r.id), 10) + 1,
      user_id: user.id,
      userName: user.name || 'Normal User',
      userEmail: user.email || 'user@example.com',
      userAddress: user.address || 'User Address',
      store_id: numericStoreId,
      storeName: store.name,
      owner_id: store.owner_id,
      rating_value: numericRating,
      comment: cleanComment,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    mockRatingsCollection.push(newRating);
    return newRating;
  }

  /**
   * Modify an existing store rating (NORMAL_USER only, ownership verified)
   */
  async updateRating(storeId, { rating, rating_value, comment }, user) {
    if (!user || user.role !== ROLES.NORMAL_USER) {
      throw new ForbiddenError('Only NORMAL_USER accounts can modify store ratings.');
    }

    const numericStoreId = parseInt(storeId, 10);
    const numericRating = parseInt(rating !== undefined ? rating : rating_value, 10);
    const cleanComment = comment !== undefined ? (comment ? comment.trim() : null) : undefined;

    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      throw new BadRequestError('Rating must be an integer between 1 and 5.');
    }

    if (db.getStatus().connected) {
      // 1. Verify Store Existence
      const storeRes = await db.query('SELECT id, name FROM stores WHERE id = $1', [numericStoreId]);
      if (storeRes.rows.length === 0) {
        throw new NotFoundError(`Store with ID ${numericStoreId} not found.`);
      }

      // 2. Verify Rating Ownership
      const existingRes = await db.query(
        'SELECT id, rating_value FROM ratings WHERE user_id = $1 AND store_id = $2',
        [user.id, numericStoreId]
      );
      if (existingRes.rows.length === 0) {
        throw new NotFoundError(`You have not submitted a rating for store #${numericStoreId} yet. Please submit a rating first.`);
      }

      // 3. Update Rating Record
      let updateQuery;
      let params;
      if (cleanComment !== undefined) {
        updateQuery = `
          UPDATE ratings
          SET rating_value = $1, comment = $2, updated_at = CURRENT_TIMESTAMP
          WHERE user_id = $3 AND store_id = $4
          RETURNING id, user_id, store_id, rating_value, comment, created_at, updated_at
        `;
        params = [numericRating, cleanComment, user.id, numericStoreId];
      } else {
        updateQuery = `
          UPDATE ratings
          SET rating_value = $1, updated_at = CURRENT_TIMESTAMP
          WHERE user_id = $2 AND store_id = $3
          RETURNING id, user_id, store_id, rating_value, comment, created_at, updated_at
        `;
        params = [numericRating, user.id, numericStoreId];
      }

      const updateRes = await db.query(updateQuery, params);
      const updatedRating = updateRes.rows[0];

      // 4. Recalculate Store Overall Rating
      const avgRes = await db.query(
        `SELECT 
           COALESCE(ROUND(AVG(rating_value)::numeric, 1), 0.0)::float as "averageRating",
           COUNT(id)::int as "ratingCount"
         FROM ratings WHERE store_id = $1`,
        [numericStoreId]
      );

      return {
        ...updatedRating,
        storeName: storeRes.rows[0].name,
        storeAverageRating: avgRes.rows[0].averageRating,
        storeRatingCount: avgRes.rows[0].ratingCount
      };
    }

    // Mock Fallback
    const storeService = require('./store.service');
    const store = (storeService.mockStoresList || []).find((s) => s.id === numericStoreId);
    if (!store) {
      throw new NotFoundError(`Store with ID ${numericStoreId} not found.`);
    }

    const ratingIndex = mockRatingsCollection.findIndex((r) => r.user_id === user.id && r.store_id === numericStoreId);
    if (ratingIndex === -1) {
      throw new NotFoundError(`You have not submitted a rating for store #${numericStoreId} yet. Please submit a rating first.`);
    }

    mockRatingsCollection[ratingIndex] = {
      ...mockRatingsCollection[ratingIndex],
      rating_value: numericRating,
      ...(cleanComment !== undefined ? { comment: cleanComment } : {}),
      updated_at: new Date().toISOString()
    };

    return mockRatingsCollection[ratingIndex];
  }

  /**
   * Get all customer ratings for stores owned by the authenticated STORE_OWNER
   * Strictly resolves stores belonging to `ownerId` with sorting and pagination
   */
  async getStoreOwnerRatings(ownerId, query = {}) {
    const numericOwnerId = parseInt(ownerId, 10);
    const { page, limit, offset } = parsePagination(query);

    // Whitelist and map sort fields to SQL column aliases
    const sortFieldMap = {
      userName: 'u.name',
      name: 'u.name',
      userEmail: 'u.email',
      email: 'u.email',
      userAddress: 'u.address',
      address: 'u.address',
      rating: 'r.rating_value',
      rating_value: 'r.rating_value',
      ratingValue: 'r.rating_value',
      createdAt: 'r.created_at',
      created_at: 'r.created_at',
      id: 'r.id'
    };

    const requestedSort = (query.sortBy || 'createdAt').trim();
    const sortColumn = sortFieldMap[requestedSort] || 'r.created_at';
    const order = (query.order || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    if (db.getStatus().connected) {
      // 1. Total Count Query for Owner's Stores
      const countRes = await db.query(
        `SELECT COUNT(*)::int as count
         FROM ratings r
         JOIN stores s ON r.store_id = s.id
         WHERE s.owner_id = $1`,
        [numericOwnerId]
      );
      const totalItems = countRes.rows[0].count;

      // 2. Data Query with Customer Profile Attributes
      const dataQuery = `
        SELECT 
          r.id,
          r.rating_value as rating,
          r.rating_value as "ratingValue",
          r.comment,
          r.created_at as "createdAt",
          r.created_at,
          r.updated_at as "updatedAt",
          r.updated_at,
          s.id as "storeId",
          s.name as "storeName",
          u.id as "userId",
          u.name as "userName",
          u.email as "userEmail",
          u.address as "userAddress"
        FROM ratings r
        JOIN stores s ON r.store_id = s.id
        JOIN users u ON r.user_id = u.id
        WHERE s.owner_id = $1
        ORDER BY ${sortColumn} ${order}
        LIMIT $2 OFFSET $3
      `;

      const dataRes = await db.query(dataQuery, [numericOwnerId, limit, offset]);

      return {
        ratings: dataRes.rows,
        meta: buildPaginationMeta(totalItems, page, limit)
      };
    }

    // Mock Fallback
    let filtered = mockRatingsCollection.filter((r) => r.owner_id === numericOwnerId);

    // Mock Sorting
    filtered.sort((a, b) => {
      let field = requestedSort;
      let valA = a[field] || a[field === 'userName' ? 'userName' : field] || '';
      let valB = b[field] || b[field === 'userName' ? 'userName' : field] || '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return order === 'ASC' ? -1 : 1;
      if (valA > valB) return order === 'ASC' ? 1 : -1;
      return 0;
    });

    const totalItems = filtered.length;
    const paginated = filtered.slice(offset, offset + limit).map((r) => ({
      id: r.id,
      storeId: r.store_id,
      storeName: r.storeName,
      userId: r.user_id,
      userName: r.userName,
      userEmail: r.userEmail,
      userAddress: r.userAddress,
      rating: r.rating_value,
      ratingValue: r.rating_value,
      comment: r.comment,
      createdAt: r.created_at,
      created_at: r.created_at,
      updatedAt: r.updated_at,
      updated_at: r.updated_at
    }));

    return {
      ratings: paginated,
      meta: buildPaginationMeta(totalItems, page, limit)
    };
  }

  /**
   * Get Store Owner Rating Statistics (STORE_OWNER only)
   * Calculates overall average rating, total ratings count, and 5-tier star distribution
   */
  async getStoreOwnerRatingStats(ownerId) {
    const numericOwnerId = parseInt(ownerId, 10);

    if (db.getStatus().connected) {
      // 1. Fetch stores owned by merchant
      const storesRes = await db.query(
        `SELECT id, name, email, address, created_at FROM stores WHERE owner_id = $1 ORDER BY created_at DESC`,
        [numericOwnerId]
      );

      const stores = storesRes.rows;
      const storeIds = stores.map((s) => s.id);

      if (storeIds.length === 0) {
        return {
          ownerId: numericOwnerId,
          totalStores: 0,
          totalRatings: 0,
          totalRatingsReceived: 0,
          averageRating: 0.0,
          overallRating: 0.0,
          ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
          stores: []
        };
      }

      // 2. Fetch Aggregated Metrics
      const aggRes = await db.query(
        `SELECT 
           COALESCE(ROUND(AVG(r.rating_value)::numeric, 1), 0.0)::float as "averageRating",
           COUNT(r.id)::int as "totalRatings"
         FROM ratings r
         JOIN stores s ON r.store_id = s.id
         WHERE s.owner_id = $1`,
        [numericOwnerId]
      );

      // 3. Fetch Star Breakdown (5, 4, 3, 2, 1)
      const distRes = await db.query(
        `SELECT r.rating_value, COUNT(r.id)::int as count
         FROM ratings r
         JOIN stores s ON r.store_id = s.id
         WHERE s.owner_id = $1
         GROUP BY r.rating_value
         ORDER BY r.rating_value DESC`,
        [numericOwnerId]
      );

      const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      distRes.rows.forEach((row) => {
        ratingDistribution[row.rating_value] = row.count;
      });

      const totalRatings = aggRes.rows[0].totalRatings || 0;
      const averageRating = aggRes.rows[0].averageRating || 0.0;

      return {
        ownerId: numericOwnerId,
        totalStores: stores.length,
        totalRatings,
        totalRatingsReceived: totalRatings,
        averageRating,
        overallRating: averageRating,
        ratingDistribution,
        stores
      };
    }

    // Mock Fallback
    if (numericOwnerId === 2) {
      return {
        ownerId: 2,
        totalStores: 2,
        totalRatings: 210,
        totalRatingsReceived: 210,
        averageRating: 4.7,
        overallRating: 4.7,
        ratingDistribution: { 5: 150, 4: 45, 3: 10, 2: 3, 1: 2 },
        stores: [
          { id: 1, name: 'Apex Digital & Electronics Flagship', address: '101 Tech Avenue, Silicon Bay' },
          { id: 3, name: 'Apex Mobile & Gadgets Express', address: '240 Innovation Way, Silicon Bay' }
        ]
      };
    }

    if (numericOwnerId === 3) {
      return {
        ownerId: 3,
        totalStores: 1,
        totalRatings: 210,
        totalRatingsReceived: 210,
        averageRating: 4.9,
        overallRating: 4.9,
        ratingDistribution: { 5: 190, 4: 18, 3: 2, 2: 0, 1: 0 },
        stores: [
          { id: 2, name: 'Urban Gourmet & Artisan Market', address: '220 Culinary Lane, Downtown Plaza' }
        ]
      };
    }

    // Generic unrated owner fallback
    return {
      ownerId: numericOwnerId,
      totalStores: 0,
      totalRatings: 0,
      totalRatingsReceived: 0,
      averageRating: 0.0,
      overallRating: 0.0,
      ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      stores: []
    };
  }
}

const ratingService = new RatingService();
ratingService.mockRatingsCollection = mockRatingsCollection;

module.exports = ratingService;
