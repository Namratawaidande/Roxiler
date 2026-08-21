const db = require('../config/db');
const { ROLES } = require('../constants/roles');

class DashboardService {
  /**
   * Get System Administrator Platform Overview for SYSTEM_ADMIN
   */
  async getAdminDashboard() {
    if (db.getStatus().connected) {
      // 1. Total counts in parallel
      const [usersCountRes, storesCountRes, ratingsCountRes, avgRatingRes] = await Promise.all([
        db.query('SELECT COUNT(*)::int as count FROM users'),
        db.query('SELECT COUNT(*)::int as count FROM stores'),
        db.query('SELECT COUNT(*)::int as count FROM ratings'),
        db.query('SELECT COALESCE(ROUND(AVG(rating_value)::numeric, 1), 0.0)::float as "averagePlatformRating" FROM ratings')
      ]);

      // 2. Role distribution
      const roleDistRes = await db.query(
        `SELECT role, COUNT(*)::int as count FROM users GROUP BY role`
      );
      const roleDistribution = {
        [ROLES.SYSTEM_ADMIN]: 0,
        [ROLES.STORE_OWNER]: 0,
        [ROLES.NORMAL_USER]: 0
      };
      roleDistRes.rows.forEach((r) => {
        roleDistribution[r.role] = r.count;
      });

      // 3. Rating stars breakdown
      const ratingDistRes = await db.query(
        `SELECT rating_value, COUNT(*)::int as count FROM ratings GROUP BY rating_value ORDER BY rating_value DESC`
      );
      const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      ratingDistRes.rows.forEach((r) => {
        ratingDistribution[r.rating_value] = r.count;
      });

      // 4. Recent registered users (omit passwords)
      const recentUsersRes = await db.query(
        `SELECT id, name, email, role, address, created_at FROM users ORDER BY created_at DESC LIMIT 5`
      );

      // 5. Recent registered stores with computed rating
      const recentStoresRes = await db.query(
        `SELECT 
           s.id, 
           s.name, 
           s.email, 
           s.address, 
           s.created_at,
           u.name as owner_name,
           COALESCE(ROUND(AVG(r.rating_value)::numeric, 1), 0.0)::float as "averageRating",
           COUNT(r.id)::int as "ratingCount"
         FROM stores s
         LEFT JOIN users u ON s.owner_id = u.id
         LEFT JOIN ratings r ON s.id = r.store_id
         GROUP BY s.id, u.name
         ORDER BY s.created_at DESC
         LIMIT 5`
      );

      return {
        stats: {
          totalUsers: usersCountRes.rows[0].count,
          totalStores: storesCountRes.rows[0].count,
          totalRatings: ratingsCountRes.rows[0].count,
          averagePlatformRating: avgRatingRes.rows[0].averagePlatformRating,
          roleDistribution,
          ratingDistribution
        },
        recentUsers: recentUsersRes.rows,
        recentStores: recentStoresRes.rows
      };
    }

    // Mock fallback response for offline testing
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
   * Get Store Owner Analytics & Customer Reviews for STORE_OWNER
   * Strictly isolated to stores owned by `ownerId`
   */
  async getStoreOwnerDashboard(ownerId) {
    const numericOwnerId = parseInt(ownerId, 10);

    if (db.getStatus().connected) {
      // 1. Fetch stores owned by this merchant
      const storesRes = await db.query(
        `SELECT 
           s.id,
           s.name,
           s.email,
           s.address,
           s.created_at,
           COALESCE(ROUND(AVG(r.rating_value)::numeric, 1), 0.0)::float as "averageRating",
           COUNT(r.id)::int as "ratingCount"
         FROM stores s
         LEFT JOIN ratings r ON s.id = r.store_id
         WHERE s.owner_id = $1
         GROUP BY s.id
         ORDER BY s.created_at DESC`,
        [numericOwnerId]
      );

      const storeIds = storesRes.rows.map((s) => s.id);
      let customerRatings = [];
      const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      let totalRatings = 0;
      let sumRating = 0;

      if (storeIds.length > 0) {
        // 2. Fetch full list of customer reviews for these stores (with customer profile details)
        const reviewsRes = await db.query(
          `SELECT 
             r.id,
             r.rating_value as rating,
             r.rating_value as "ratingValue",
             r.comment,
             r.created_at as "createdAt",
             r.updated_at as "updatedAt",
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
           ORDER BY r.created_at DESC`,
          [numericOwnerId]
        );
        customerRatings = reviewsRes.rows;

        // 3. Compute distribution and aggregates
        customerRatings.forEach((r) => {
          totalRatings++;
          sumRating += r.rating;
          if (ratingDistribution[r.rating] !== undefined) {
            ratingDistribution[r.rating]++;
          }
        });
      }

      const averageRating = totalRatings > 0 ? Math.round((sumRating / totalRatings) * 10) / 10 : 0.0;

      return {
        ownerId: numericOwnerId,
        stores: storesRes.rows,
        myStores: storesRes.rows,
        totalStores: storesRes.rows.length,
        totalRatingsReceived: totalRatings,
        totalRatings: totalRatings,
        averageRating,
        overallRating: averageRating,
        ratingDistribution,
        ratingsList: customerRatings,
        customerReviews: customerRatings,
        recentReviews: customerRatings.slice(0, 5)
      };
    }

    // Mock Fallback per STORE_OWNER
    if (numericOwnerId === 2) {
      // Alice Storekeeper (Owner of Store 1 & Store 3)
      return {
        ownerId: 2,
        stores: [
          {
            id: 1,
            name: 'Apex Digital & Electronics Flagship',
            email: 'contact@apexdigital.com',
            address: '101 Tech Avenue, Silicon Bay',
            averageRating: 4.8,
            ratingCount: 142
          },
          {
            id: 3,
            name: 'Apex Mobile & Gadgets Express',
            email: 'support@apexmobile.com',
            address: '240 Innovation Way, Silicon Bay',
            averageRating: 4.3,
            ratingCount: 68
          }
        ],
        myStores: [
          {
            id: 1,
            name: 'Apex Digital & Electronics Flagship',
            email: 'contact@apexdigital.com',
            address: '101 Tech Avenue, Silicon Bay',
            averageRating: 4.8,
            ratingCount: 142
          }
        ],
        totalStores: 2,
        totalRatingsReceived: 210,
        totalRatings: 210,
        averageRating: 4.7,
        overallRating: 4.7,
        ratingDistribution: { 5: 150, 4: 45, 3: 10, 2: 3, 1: 2 },
        ratingsList: [
          {
            id: 1,
            storeId: 1,
            storeName: 'Apex Digital & Electronics Flagship',
            userId: 4,
            userName: 'John Doe',
            userEmail: 'john.doe@example.com',
            userAddress: '12 Maple Street, Apt 3B, Springfield',
            rating: 5,
            ratingValue: 5,
            comment: 'Outstanding customer experience and quick delivery of electronics!',
            createdAt: '2026-01-20T10:00:00.000Z',
            updatedAt: '2026-01-20T10:00:00.000Z'
          },
          {
            id: 2,
            storeId: 1,
            storeName: 'Apex Digital & Electronics Flagship',
            userId: 5,
            userName: 'Sarah Jenkins',
            userEmail: 'sarah.jenkins@example.com',
            userAddress: '88 Oak Ridge Terrace, Westview',
            rating: 4,
            ratingValue: 4,
            comment: 'Very good product selection and competitive prices.',
            createdAt: '2026-01-22T14:30:00.000Z',
            updatedAt: '2026-01-22T14:30:00.000Z'
          }
        ],
        customerReviews: [
          {
            id: 1,
            storeId: 1,
            storeName: 'Apex Digital & Electronics Flagship',
            userId: 4,
            userName: 'John Doe',
            userEmail: 'john.doe@example.com',
            userAddress: '12 Maple Street, Apt 3B, Springfield',
            rating: 5,
            comment: 'Outstanding customer experience and quick delivery of electronics!',
            createdAt: '2026-01-20T10:00:00.000Z'
          }
        ],
        recentReviews: [
          {
            id: 1,
            storeId: 1,
            storeName: 'Apex Digital & Electronics Flagship',
            userId: 4,
            userName: 'John Doe',
            userEmail: 'john.doe@example.com',
            userAddress: '12 Maple Street, Apt 3B, Springfield',
            rating: 5,
            comment: 'Outstanding customer experience and quick delivery of electronics!',
            createdAt: '2026-01-20T10:00:00.000Z'
          }
        ]
      };
    }

    // Marcus Vance (Owner of Store 2)
    return {
      ownerId: 3,
      stores: [
        {
          id: 2,
          name: 'Urban Gourmet & Artisan Market',
          email: 'hello@urbangourmet.com',
          address: '220 Culinary Lane, Downtown Plaza',
          averageRating: 4.9,
          ratingCount: 210
        }
      ],
      myStores: [
        {
          id: 2,
          name: 'Urban Gourmet & Artisan Market',
          email: 'hello@urbangourmet.com',
          address: '220 Culinary Lane, Downtown Plaza',
          averageRating: 4.9,
          ratingCount: 210
        }
      ],
      totalStores: 1,
      totalRatingsReceived: 210,
      totalRatings: 210,
      averageRating: 4.9,
      overallRating: 4.9,
      ratingDistribution: { 5: 190, 4: 18, 3: 2, 2: 0, 1: 0 },
      ratingsList: [
        {
          id: 3,
          storeId: 2,
          storeName: 'Urban Gourmet & Artisan Market',
          userId: 6,
          userName: 'Michael Chang',
          userEmail: 'michael.chang@example.com',
          userAddress: '504 Pine Avenue, Bay District',
          rating: 5,
          ratingValue: 5,
          comment: 'The highest quality artisan goods and fresh organic bakery in town.',
          createdAt: '2026-01-25T09:15:00.000Z',
          updatedAt: '2026-01-25T09:15:00.000Z'
        }
      ],
      customerReviews: [
        {
          id: 3,
          storeId: 2,
          storeName: 'Urban Gourmet & Artisan Market',
          userId: 6,
          userName: 'Michael Chang',
          userEmail: 'michael.chang@example.com',
          userAddress: '504 Pine Avenue, Bay District',
          rating: 5,
          comment: 'The highest quality artisan goods and fresh organic bakery in town.',
          createdAt: '2026-01-25T09:15:00.000Z'
        }
      ],
      recentReviews: [
        {
          id: 3,
          storeId: 2,
          storeName: 'Urban Gourmet & Artisan Market',
          userId: 6,
          userName: 'Michael Chang',
          userEmail: 'michael.chang@example.com',
          userAddress: '504 Pine Avenue, Bay District',
          rating: 5,
          comment: 'The highest quality artisan goods and fresh organic bakery in town.',
          createdAt: '2026-01-25T09:15:00.000Z'
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
