const db = require('../config/db');
const { ROLES } = require('../constants/roles');

class DashboardService {
  /**
   * Get Platform Analytics & Dashboard for SYSTEM_ADMIN
   */
  async getAdminDashboard() {
    if (db.getStatus().connected) {
      const [usersCountRes, storesCountRes, ratingsCountRes, avgRatingRes, roleDistRes] = await Promise.all([
        db.query('SELECT COUNT(*)::int as count FROM users'),
        db.query('SELECT COUNT(*)::int as count FROM stores'),
        db.query('SELECT COUNT(*)::int as count FROM ratings'),
        db.query('SELECT COALESCE(ROUND(AVG(rating_value)::numeric, 1), 0.0)::float as avg FROM ratings'),
        db.query('SELECT role, COUNT(*)::int as count FROM users GROUP BY role')
      ]);

      const roleDistribution = {
        SYSTEM_ADMIN: 0,
        STORE_OWNER: 0,
        NORMAL_USER: 0
      };
      roleDistRes.rows.forEach((r) => {
        roleDistribution[r.role] = r.count;
      });

      return {
        stats: {
          totalUsers: usersCountRes.rows[0].count,
          totalStores: storesCountRes.rows[0].count,
          totalRatings: ratingsCountRes.rows[0].count,
          averagePlatformRating: avgRatingRes.rows[0].avg,
          roleDistribution
        }
      };
    }

    return {
      stats: {
        totalUsers: 154,
        totalStores: 42,
        totalRatings: 820,
        averagePlatformRating: 4.4,
        roleDistribution: {
          SYSTEM_ADMIN: 3,
          STORE_OWNER: 28,
          NORMAL_USER: 123
        }
      }
    };
  }

  /**
   * Get Store Owner Analytics & Dashboard for STORE_OWNER
   */
  async getStoreOwnerDashboard(ownerId) {
    if (db.getStatus().connected) {
      const storesRes = await db.query(
        `SELECT 
           s.id,
           s.name,
           s.email,
           s.address,
           COALESCE(ROUND(AVG(r.rating_value)::numeric, 1), 0.0)::float as "averageRating",
           COUNT(r.id)::int as "ratingCount"
         FROM stores s
         LEFT JOIN ratings r ON s.id = r.store_id
         WHERE s.owner_id = $1
         GROUP BY s.id`,
        [ownerId]
      );

      const storeIds = storesRes.rows.map((s) => s.id);
      let recentReviews = [];

      if (storeIds.length > 0) {
        const reviewsRes = await db.query(
          `SELECT 
             r.id,
             r.rating_value as rating,
             r.rating_value as "ratingValue",
             r.comment,
             r.created_at,
             s.name as "storeName",
             u.name as "userName"
           FROM ratings r
           JOIN stores s ON r.store_id = s.id
           JOIN users u ON r.user_id = u.id
           WHERE r.store_id = ANY($1::int[])
           ORDER BY r.created_at DESC
           LIMIT 5`,
          [storeIds]
        );
        recentReviews = reviewsRes.rows;
      }

      return {
        myStores: storesRes.rows,
        recentReviews
      };
    }

    return {
      myStores: [
        {
          id: 1,
          name: 'Apex Digital & Electronics',
          email: 'contact@apexdigital.com',
          address: '101 Tech Avenue, Silicon Bay',
          averageRating: 4.8,
          ratingCount: 142
        }
      ],
      recentReviews: [
        {
          id: 1,
          rating: 5,
          comment: 'Outstanding customer experience and quick delivery of electronics!',
          userName: 'John Customer',
          storeName: 'Apex Digital & Electronics',
          created_at: new Date().toISOString()
        }
      ]
    };
  }

  /**
   * Get User Dashboard for NORMAL_USER
   */
  async getUserDashboard(userId) {
    if (db.getStatus().connected) {
      const ratingsRes = await db.query(
        `SELECT 
           r.id,
           r.rating_value as rating,
           r.rating_value as "ratingValue",
           r.comment,
           r.created_at,
           s.id as "storeId",
           s.name as "storeName",
           s.address as "storeAddress"
         FROM ratings r
         JOIN stores s ON r.store_id = s.id
         WHERE r.user_id = $1
         ORDER BY r.created_at DESC`,
        [userId]
      );

      return {
        totalRatingsSubmitted: ratingsRes.rows.length,
        myRatings: ratingsRes.rows
      };
    }

    return {
      totalRatingsSubmitted: 1,
      myRatings: [
        {
          id: 1,
          rating: 5,
          comment: 'Outstanding service, authentic gadgets and swift support!',
          storeId: 1,
          storeName: 'Apex Digital & Electronics',
          created_at: new Date().toISOString()
        }
      ]
    };
  }
}

module.exports = new DashboardService();
