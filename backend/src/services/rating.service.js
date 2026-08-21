const db = require('../config/db');
const { parsePagination, parseSort, buildPaginationMeta } = require('../utils/queryHelper');
const { NotFoundError, ForbiddenError } = require('../errors/ApiError');
const { ROLES } = require('../constants/roles');

class RatingService {
  /**
   * Submit or update a user rating (1-5) for a store (Upsert)
   */
  async submitRating({ storeId, rating, comment }, userId) {
    if (db.getStatus().connected) {
      // Verify store exists
      const storeCheck = await db.query('SELECT id FROM stores WHERE id = $1', [storeId]);
      if (storeCheck.rows.length === 0) {
        throw new NotFoundError(`Store with ID ${storeId} does not exist.`);
      }

      const res = await db.query(
        `INSERT INTO ratings (user_id, store_id, rating, comment)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, store_id) 
         DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment, updated_at = CURRENT_TIMESTAMP
         RETURNING id, user_id, store_id, rating, comment, created_at, updated_at`,
        [userId, storeId, rating, comment ? comment.trim() : null]
      );

      return res.rows[0];
    }

    return {
      id: Math.floor(Math.random() * 1000) + 10,
      user_id: userId,
      store_id: storeId,
      rating,
      comment: comment || null,
      created_at: new Date().toISOString()
    };
  }

  /**
   * Get ratings list for a specific store with pagination and breakdown
   */
  async getStoreRatings(storeId, query = {}) {
    const { page, limit, offset } = parsePagination(query);
    const { sortBy, order } = parseSort(query, ['rating', 'created_at'], 'created_at', 'DESC');

    if (db.getStatus().connected) {
      // Get aggregated summary
      const summaryRes = await db.query(
        `SELECT 
           COALESCE(ROUND(AVG(rating)::numeric, 1), 0.0)::float as "averageRating",
           COUNT(*)::int as "totalRatings"
         FROM ratings WHERE store_id = $1`,
        [storeId]
      );
      const summary = summaryRes.rows[0];

      // Get paginated list of reviews with user name
      const dataQuery = `
        SELECT 
          r.id,
          r.store_id,
          r.user_id,
          u.name as "userName",
          r.rating,
          r.comment,
          r.created_at,
          r.updated_at
        FROM ratings r
        JOIN users u ON r.user_id = u.id
        WHERE r.store_id = $1
        ORDER BY r.${sortBy} ${order}
        LIMIT $2 OFFSET $3
      `;
      const dataRes = await db.query(dataQuery, [storeId, limit, offset]);

      return {
        ratings: dataRes.rows,
        summary: {
          averageRating: summary.averageRating,
          totalRatings: summary.totalRatings
        },
        meta: buildPaginationMeta(summary.totalRatings, page, limit)
      };
    }

    // Mock response
    const mockRatings = [
      {
        id: 1,
        store_id: parseInt(storeId, 10),
        user_id: 3,
        userName: 'John Customer',
        rating: 5,
        comment: 'Outstanding customer experience and quick delivery.',
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        store_id: parseInt(storeId, 10),
        user_id: 4,
        userName: 'Sarah Jenkins',
        rating: 4,
        comment: 'Great items, clean ambiance.',
        created_at: new Date().toISOString()
      }
    ];

    return {
      ratings: mockRatings,
      summary: { averageRating: 4.5, totalRatings: mockRatings.length },
      meta: buildPaginationMeta(mockRatings.length, page, limit)
    };
  }

  /**
   * Get authenticated user's submitted rating for a store
   */
  async getUserRatingForStore(storeId, userId) {
    if (db.getStatus().connected) {
      const res = await db.query(
        'SELECT id, store_id, user_id, rating, comment, created_at, updated_at FROM ratings WHERE store_id = $1 AND user_id = $2',
        [storeId, userId]
      );
      return res.rows[0] || null;
    }
    return null;
  }
}

module.exports = new RatingService();
