const db = require('../config/db');
const { NotFoundError, ConflictError, BadRequestError, ForbiddenError } = require('../errors/ApiError');
const { ROLES } = require('../constants/roles');

// Mock fallback ratings store
const mockRatingsCollection = [
  { id: 1, user_id: 4, store_id: 1, rating_value: 5, comment: 'Outstanding service and quick delivery!', created_at: '2026-01-20T10:00:00.000Z', updated_at: '2026-01-20T10:00:00.000Z' }
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
    const validStoreIds = [1, 2, 3];
    if (!validStoreIds.includes(numericStoreId)) {
      throw new NotFoundError(`Store with ID ${numericStoreId} not found.`);
    }

    const existingRating = mockRatingsCollection.find((r) => r.user_id === user.id && r.store_id === numericStoreId);
    if (existingRating) {
      throw new ConflictError('You have already submitted a rating for this store. Please modify your existing rating instead.');
    }

    const newRating = {
      id: Math.max(...mockRatingsCollection.map((r) => r.id), 10) + 1,
      user_id: user.id,
      store_id: numericStoreId,
      rating_value: numericRating,
      comment: cleanComment,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    mockRatingsCollection.push(newRating);
    return newRating;
  }
}

module.exports = new RatingService();
