const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

// Reads ?page= and ?limit= from a query string and clamps them, so a single
// request can never ask for the whole collection.
const parsePagination = (query = {}) => {
  const rawLimit = parseInt(query.limit, 10);
  const rawPage = parseInt(query.page, 10);

  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(rawLimit, 1), MAX_PAGE_SIZE)
    : DEFAULT_PAGE_SIZE;

  const page = Number.isFinite(rawPage) ? Math.max(rawPage, 1) : 1;

  return { limit, page, skip: (page - 1) * limit };
};

module.exports = { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, parsePagination };
