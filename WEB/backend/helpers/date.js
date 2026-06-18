export const MS_PER_DAY = 24 * 60 * 60 * 1000;
export const REFRESH_TOKEN_MAX_AGE_MS = MS_PER_DAY;

export const getMonthlyUsageStart = (date = new Date()) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));

export const getDateKey = (date = new Date()) =>
  date.toISOString().slice(0, 10);

export const getStreakDateKey = (date = new Date()) => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized.toISOString().slice(0, 10);
};
