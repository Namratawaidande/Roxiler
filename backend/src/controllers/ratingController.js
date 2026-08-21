const { successResponse } = require('../utils/apiResponse');

/**
 * Rating Controller Foundation Stubs
 */
const getStoreRatings = async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const sampleRatings = [
      {
        id: 1,
        storeId: parseInt(storeId, 10),
        userId: 3,
        userName: 'John Customer',
        rating: 5,
        comment: 'Outstanding customer experience and quick delivery.',
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        storeId: parseInt(storeId, 10),
        userId: 4,
        userName: 'Sarah Jenkins',
        rating: 4,
        comment: 'Great items, clean ambiance.',
        createdAt: new Date().toISOString()
      }
    ];

    return successResponse(res, { ratings: sampleRatings, averageRating: 4.5, totalRatings: 2 }, 'Store ratings retrieved successfully.');
  } catch (err) {
    next(err);
  }
};

const submitRating = async (req, res, next) => {
  try {
    const { storeId, rating, comment } = req.body;
    return successResponse(
      res,
      {
        id: Math.floor(Math.random() * 1000),
        storeId,
        userId: req.user ? req.user.id : 1,
        rating,
        comment,
        createdAt: new Date().toISOString()
      },
      'Rating submitted successfully (Foundation stub).'
    );
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getStoreRatings,
  submitRating
};
