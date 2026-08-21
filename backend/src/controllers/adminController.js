const { successResponse } = require('../utils/apiResponse');

/**
 * Admin Controller Foundation Stubs
 */
const getPlatformStats = async (req, res, next) => {
  try {
    const stats = {
      totalUsers: 154,
      totalStores: 42,
      totalRatings: 820,
      activeStores: 38,
      averageSystemRating: 4.4,
      roleDistribution: {
        SYSTEM_ADMIN: 3,
        STORE_OWNER: 28,
        NORMAL_USER: 123
      }
    };

    return successResponse(res, { stats }, 'Platform statistics retrieved successfully.');
  } catch (err) {
    next(err);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const sampleUsers = [
      { id: 1, name: 'System Administrator', email: 'admin@storerating.com', role: 'SYSTEM_ADMIN', address: 'HQ Suite 100' },
      { id: 2, name: 'Alice Storekeeper', email: 'owner@storerating.com', role: 'STORE_OWNER', address: '456 Merchant Blvd' },
      { id: 3, name: 'John Customer', email: 'user@storerating.com', role: 'NORMAL_USER', address: '789 Residential Park' }
    ];

    return successResponse(res, { users: sampleUsers, total: sampleUsers.length }, 'Users list retrieved successfully.');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPlatformStats,
  getAllUsers
};
