const asyncHandler = require('../utils/asyncHandler');
const { ApiResponse } = require('../utils/apiResponse');
const ratingService = require('../services/rating.service');

/**
 * Submit or Update Store Rating (Normal User)
 * POST /api/v1/ratings
 */
const submitRating = asyncHandler(async (req, res) => {
  const rating = await ratingService.submitRating(req.body, req.user.id);
  return ApiResponse.success(res, { rating }, 'Rating submitted successfully.');
});

/**
 * Get All Ratings & Reviews for a Store
 * GET /api/v1/ratings/store/:storeId
 */
const getStoreRatings = asyncHandler(async (req, res) => {
  const result = await ratingService.getStoreRatings(req.params.storeId, req.query);
  return ApiResponse.success(
    res,
    { ratings: result.ratings, summary: result.summary },
    'Store ratings retrieved successfully.',
    200,
    result.meta
  );
});

/**
 * Get Current User's Rating for a Store
 * GET /api/v1/ratings/store/:storeId/my-rating
 */
const getMyRatingForStore = asyncHandler(async (req, res) => {
  const rating = await ratingService.getUserRatingForStore(req.params.storeId, req.user.id);
  return ApiResponse.success(res, { rating }, 'User rating retrieved successfully.');
});

module.exports = {
  submitRating,
  getStoreRatings,
  getMyRatingForStore
};
