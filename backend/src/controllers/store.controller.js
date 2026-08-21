const asyncHandler = require('../utils/asyncHandler');
const { ApiResponse } = require('../utils/apiResponse');
const storeService = require('../services/store.service');

/**
 * Get Stores List with Search, Filter, Sort, Pagination, and authenticated user's submitted rating
 * GET /api/v1/stores
 */
const getStores = asyncHandler(async (req, res) => {
  const result = await storeService.getStores(req.query, req.user?.id);
  return ApiResponse.success(res, { stores: result.stores }, 'Stores list retrieved successfully.', 200, result.meta);
});

/**
 * Get Store by ID
 * GET /api/v1/stores/:id
 */
const getStoreById = asyncHandler(async (req, res) => {
  const store = await storeService.getStoreById(req.params.id);
  return ApiResponse.success(res, { store }, 'Store details retrieved successfully.');
});

/**
 * Create Store (Admin or Store Owner)
 * POST /api/v1/stores
 */
const createStore = asyncHandler(async (req, res) => {
  const store = await storeService.createStore(req.body, req.user);
  return ApiResponse.created(res, { store }, 'Store created successfully.');
});

/**
 * Update Store (Admin or Owner of this store)
 * PUT /api/v1/stores/:id
 */
const updateStore = asyncHandler(async (req, res) => {
  const store = await storeService.updateStore(req.params.id, req.body, req.user);
  return ApiResponse.success(res, { store }, 'Store updated successfully.');
});

/**
 * Delete Store (Admin or Owner of this store)
 * DELETE /api/v1/stores/:id
 */
const deleteStore = asyncHandler(async (req, res) => {
  const result = await storeService.deleteStore(req.params.id, req.user);
  return ApiResponse.success(res, result, 'Store deleted successfully.');
});

module.exports = {
  getStores,
  getStoreById,
  createStore,
  updateStore,
  deleteStore
};
