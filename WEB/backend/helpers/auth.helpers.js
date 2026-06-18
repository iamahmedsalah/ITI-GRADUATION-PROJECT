import { customAlphabet } from "nanoid";

const STREAK_TIME_ZONE = "Africa/Cairo";

export const REFRESH_TOKEN_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export const generateVerificationToken = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  8,
);

export const toPublicUser = (user, options = {}) => ({
  _id: user._id,
  username: user.username,
  Fname: user.Fname,
  Lname: user.Lname,
  name: `${user.Fname} ${user.Lname}`,
  email: user.email,
  avatarUrl: user.avatarUrl || null,
  role: user.role,
  isVerified: user.isVerified,
  lastLogin: user.lastLogin,
  loginStreak: {
    current: user.loginStreak?.current ?? 0,
    longest: user.loginStreak?.longest ?? 0,
    lastLoginDate: user.loginStreak?.lastLoginDate ?? null,
  },
  subscription: {
    plan: user.subscription?.plan || "free",
    status: user.subscription?.status || "inactive",
    currentPeriodEnd: user.subscription?.currentPeriodEnd ?? null,
  },
  accountDeletion: {
    status: user.accountDeletion?.status || "none",
    requestedAt: user.accountDeletion?.requestedAt ?? null,
    scheduledFor: user.accountDeletion?.scheduledFor ?? null,
  },
  hasPreferences: Boolean(options.hasPreferences),
});

const getStreakDateKey = (date = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: STREAK_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

const dayNumberFromKey = (key) => {
  const [year, month, day] = key.split("-").map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / 86400000);
};

export const updateLoginStreak = (user, now = new Date()) => {
  const todayKey = getStreakDateKey(now);
  const streak = user.loginStreak ?? {};
  const lastLoginDate = streak.lastLoginDate ? new Date(streak.lastLoginDate) : null;
  const lastLoginKey = lastLoginDate ? getStreakDateKey(lastLoginDate) : null;

  if (lastLoginKey === todayKey) {
    user.loginStreak = {
      current: streak.current ?? 1,
      longest: Math.max(streak.longest ?? 0, streak.current ?? 1),
      lastLoginDate: lastLoginDate ?? now,
    };
    return user.loginStreak;
  }

  const current =
    lastLoginKey && dayNumberFromKey(todayKey) - dayNumberFromKey(lastLoginKey) === 1
      ? (streak.current ?? 0) + 1
      : 1;

  user.loginStreak = {
    current,
    longest: Math.max(streak.longest ?? 0, current),
    lastLoginDate: now,
  };

  return user.loginStreak;
};
