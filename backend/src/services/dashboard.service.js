const db = require('../config/db');
const { ROLES } = require('../constants/roles');

class DashboardService {
  /**
   * Get Platform Analytics & Dashboard for SYSTEM_ADMIN
   */
  async getAdminDashboard() {
    if (db.getStatus().connected) {
      const [
        usersCountRes,
        storesCountRes,
        ratingsCountRes,
        avgRatingRes,
        roleDistRes,
        ratingDistRes,
        recentUsersRes,
        recentStoresRes
      ] = await Promise.all([
        db.query('SELECT COUNT(*)::int as count FROM users'),
        db.query('SELECT COUNT(*)::int as count FROM stores'),
        db.query('SELECT COUNT(*)::int as count FROM ratings'),
        db.query('SELECT COALESCE(ROUND(AVG(rating_value)::numeric, 1), 0.0)::float as avg FROM ratings'),
        db.query('SELECT role, COUNT(*)::int as count FROM users GROUP BY role'),
        db.query(`
          SELECT 
            COUNT(CASE WHEN rating_value = 5 THEN 1 END)::int as star_5,
            COUNT(CASE WHEN rating_value = 4 THEN 1 END)::int as star_4,
            COUNT(CASE WHEN rating_value = 3 THEN 1 END)::int as star_3,
            COUNT(CASE WHEN rating_value = 2 THEN 1 END)::int as star_2,
            COUNT(CASE WHEN rating_value = 1 THEN 1 END)::int as star_1
          FROM ratings
        `),
        db.query(`
          SELECT id, name, email, address, role, created_at 
          FROM users 
          ORDER BY created_at DESC 
          LIMIT 5
        `),
        db.query(`
          SELECT 
            s.id, 
            s.name, 
            s.email, 
            s.address, 
            u.name as owner_name,
            COALESCE(ROUND(AVG(r.rating_value)::numeric, 1), 0.0)::float as "averageRating",
            COUNT(r.id)::int as "ratingCount",
            s.created_at
          FROM stores s
          LEFT JOIN users u ON s.owner_id = u.id
          LEFT JOIN ratings r ON s.id = r.store_id
          GROUP BY s.id, u.name
          ORDER BY s.created_at DESC
          LIMIT 5
        `)
      ]);

      const roleDistribution = {
        SYSTEM_ADMIN: 0,
        STORE_OWNER: 0,
        NORMAL_USER: 0
      };
      roleDistRes.rows.forEach((r) => {
        roleDistribution[r.role] = r.count;
      });

      const ratingDist = ratingDistRes.rows[0] || { star_5: 0, star_4: 0, star_3: 0, star_2: 0, star_1: 0 };

      return {
        stats: {
          totalUsers: usersCountRes.rows[0].count,
          totalStores: storesCountRes.rows[0].count,
          totalRatings: ratingsCountRes.rows[0].count,
          averagePlatformRating: avgRatingRes.rows[0].avg,
          roleDistribution,
          ratingDistribution: {
            5: ratingDist.star_5,
            4: ratingDist.star_4,
            3: ratingDist.star_3,
            2: ratingDist.star_2,
            1: ratingDist.star_1
          }
        },
        recentUsers: recentUsersRes.rows,
        recentStores: recentStoresRes.rows
      };
    }

    // Mock fallback data for offline development
    return {
      stats: {
        totalUsers: 154,
        totalStores: 42,
        totalRatings: 820,
        averagePlatformRating: 4.6,
        roleDistribution: {
          SYSTEM_ADMIN: 3,
          STORE_OWNER: 28,
          NORMAL_USER: 123
        },
        ratingDistribution: {
          5: 540,
          4: 190,
          3: 60,
          2: 20,
          1: 10
        }
      },
      recentUsers: [
        { id: 1, name: 'System Administrator', email: 'admin@storerating.com', role: 'SYSTEM_ADMIN', created_at: new Date().toISOString() },
        { id: 2, name: 'Alice Storekeeper', email: 'owner1@storerating.com', role: 'STORE_OWNER', created_at: new Date().toISOString() },
        { id: 4, name: 'John Doe', email: 'john.doe@example.com', role: 'NORMAL_USER', created_at: new Date().toISOString() }
      ],
      recentStores: [
        { id: 1, name: 'Apex Digital & Electronics', email: 'contact@apexdigital.com', address: '101 Tech Avenue, Silicon Bay', owner_name: 'Alice Storekeeper', averageRating: 4.8, ratingCount: 142 },
        { id: 2, name: 'Apex Mobile & Gadgets', email: 'support@apexmobile.com', address: '240 Innovation Way, Silicon Bay', owner_name: 'Alice Storekeeper', averageRating: 4.5, ratingCount: 68 },
        { id: 3, name: 'Urban Gourmet & Artisan Market', email: 'hello@urbangourmet.com', address: '220 Culinary Lane, Downtown', owner_name: 'Marcus Vance', averageRating: 4.9, ratingCount: 210 }
      ]
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
