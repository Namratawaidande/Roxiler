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

module.exports = {
  submitRating,
  updateRating
};
