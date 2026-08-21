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

module.exports = {
  submitRating
};
