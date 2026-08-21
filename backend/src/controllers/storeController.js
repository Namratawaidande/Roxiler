const { successResponse } = require('../utils/apiResponse');

/**
 * Store Controller Foundation Stubs
 */
const getAllStores = async (req, res, next) => {
  try {
    const sampleStores = [
      {
        id: 1,
        name: 'Apex Digital & Electronics',
        email: 'contact@apexdigital.com',
        address: '101 Tech Avenue, Silicon Bay',
        averageRating: 4.8,
        ratingCount: 142,
        ownerId: 2
      },
      {
        id: 2,
        name: 'Urban Gourmet Market',
        email: 'hello@urbangourmet.com',
        address: '220 Culinary Lane, Downtown',
        averageRating: 4.6,
        ratingCount: 89,
        ownerId: 2
      }
    ];

    return successResponse(res, { stores: sampleStores }, 'Stores retrieved successfully.');
  } catch (err) {
    next(err);
  }
};

const getStoreById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const store = {
      id: parseInt(id, 10),
      name: 'Apex Digital & Electronics',
      email: 'contact@apexdigital.com',
      address: '101 Tech Avenue, Silicon Bay',
      averageRating: 4.8,
      ratingCount: 142,
      ownerId: 2
    };

    return successResponse(res, { store }, 'Store details retrieved successfully.');
  } catch (err) {
    next(err);
  }
};

const createStore = async (req, res, next) => {
  try {
    return successResponse(res, { store: req.body }, 'Store creation foundation stub ready.');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllStores,
  getStoreById,
  createStore
};
