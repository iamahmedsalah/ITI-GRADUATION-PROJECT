const toPositiveInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const normalizePagination = (
  page = 1,
  limit = 20,
  { maxLimit = 100 } = {},
) => {
  const normalizedPage = toPositiveInteger(page, 1);
  const normalizedLimit = Math.min(toPositiveInteger(limit, 20), maxLimit);

  return {
    page: normalizedPage,
    limit: normalizedLimit,
    skip: (normalizedPage - 1) * normalizedLimit,
  };
};

export const buildPaginationMeta = ({ page, limit, total }) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit) || 0,
  hasNextPage: page * limit < total,
  hasPrevPage: page > 1,
});
