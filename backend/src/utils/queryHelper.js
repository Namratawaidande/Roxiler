/**
 * Utility helpers for database pagination, sorting, and search query building
 */

/**
 * Parse pagination parameters from request query
 * @param {Object} query - Express req.query
 * @param {number} defaultLimit - Default page limit (default: 10)
 * @param {number} maxLimit - Maximum permitted page limit (default: 100)
 */
const parsePagination = (query = {}, defaultLimit = 10, maxLimit = 100) => {
  const page = Math.max(1, parseInt(query.page || '1', 10));
  const requestedLimit = parseInt(query.limit || `${defaultLimit}`, 10);
  const limit = Math.min(Math.max(1, requestedLimit), maxLimit);
  const offset = (page - 1) * limit;

  return {
    page,
    limit,
    offset
  };
};

/**
 * Parse sorting parameters safely against a whitelist of columns
 * @param {Object} query - Express req.query
 * @param {Array<string>} allowedColumns - Whitelist of sortable column names
 * @param {string} defaultColumn - Default column to sort by
 * @param {string} defaultOrder - Default sort direction ('ASC' or 'DESC')
 */
const parseSort = (query = {}, allowedColumns = ['id', 'created_at'], defaultColumn = 'created_at', defaultOrder = 'DESC') => {
  const sortBy = allowedColumns.includes(query.sortBy) ? query.sortBy : defaultColumn;
  const order = (query.order || defaultOrder).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  return {
    sortBy,
    order,
    sqlClause: `ORDER BY ${sortBy} ${order}`
  };
};

/**
 * Build standardized pagination metadata object for API responses
 */
const buildPaginationMeta = (totalItems, page, limit) => {
  const totalPages = Math.ceil(totalItems / limit) || 1;

  return {
    pagination: {
      totalItems,
      itemsPerPage: limit,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
};

module.exports = {
  parsePagination,
  parseSort,
  buildPaginationMeta
};
