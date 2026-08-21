const asyncHandler = require('../utils/asyncHandler');
const { ApiResponse } = require('../utils/apiResponse');
const ratingService = require('../services/rating.service');

/**
 * Submit Store Rating
 * POST /api/v1/ratings
 */
const submitRating = asyncHandler(async (req, res) => {
  const rating = await ratingService.submitRating(req.body, req.user);
  return ApiResponse.created(res, { rating }, 'Rating submitted successfully.');
});

/**
 * Modify Existing Store Rating
 * PUT /api/v1/ratings/:storeId
 */
const updateRating = asyncHandler(async (req, res) => {
  const rating = await ratingService.updateRating(req.params.storeId, req.body, req.user);
  return ApiResponse.success(res, { rating }, 'Rating updated successfully.');
});

/**
 * Get Store Owner Customer Ratings List (STORE_OWNER only)
 * GET /api/v1/ratings/owner
 */
const getStoreOwnerRatings = asyncHandler(async (req, res) => {
  const result = await ratingService.getStoreOwnerRatings(req.user.id, req.query);
  return ApiResponse.success(res, { ratings: result.ratings }, 'Store customer ratings retrieved successfully.', 200, result.meta);
});

/**
 * Get Store Owner Rating Statistics & Breakdown (STORE_OWNER only)
 * GET /api/v1/ratings/owner/stats
 */
const getStoreOwnerRatingStats = asyncHandler(async (req, res) => {
  const stats = await ratingService.getStoreOwnerRatingStats(req.user.id);
  return ApiResponse.success(res, stats, 'Store rating statistics retrieved successfully.');
});

module.exports = {
  submitRating,
  updateRating,
  getStoreOwnerRatings,
  getStoreOwnerRatingStats
};
