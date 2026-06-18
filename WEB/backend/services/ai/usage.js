import UserActivity from "../../models/user/userActivityModel.js";
import UserAiUsage from "../../models/user/userAiUsageModel.js";
import { AI_ACCESS_CACHE_TTL_MS, aiCache } from "./cache.js";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const parseIntegerEnv = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const FREE_AI_ROADMAP_DRAFT_LIMIT = clamp(
  parseIntegerEnv(process.env.AI_FREE_ROADMAP_DRAFT_LIMIT, 3),
  0,
  25,
);

const PRO_AI_ROADMAP_DRAFT_LIMIT = clamp(
  parseIntegerEnv(process.env.AI_PRO_ROADMAP_DRAFT_LIMIT, 10),
  0,
  50,
);

const FREE_AI_CHAT_MESSAGE_LIMIT = clamp(
  parseIntegerEnv(process.env.AI_FREE_CHAT_MESSAGE_LIMIT, 30),
  0,
  1000,
);

const PRO_AI_CHAT_MESSAGE_LIMIT = clamp(
  parseIntegerEnv(process.env.AI_PRO_CHAT_MESSAGE_LIMIT, 150),
  0,
  5000,
);

const toId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (value._id) return String(value._id);
  return String(value);
};

const getMonthlyUsageStart = (date = new Date()) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));

export const invalidateAiUserCache = (userId) => {
  const id = toId(userId);
  aiCache.deleteByPrefix(`ai-access:${id}:`);
  aiCache.deleteByPrefix(`ai-recommendations:${id}:`);
};

export const getAiSubscription = (user = {}) => {
  const plan = user.subscription?.plan || "free";
  const status = user.subscription?.status || "inactive";
  const isSubscriber = plan === "pro" && ["active", "trialing"].includes(status);

  return {
    plan,
    status,
    isSubscriber,
  };
};

export const getAiDraftLimit = (subscription) =>
  subscription?.isSubscriber
    ? PRO_AI_ROADMAP_DRAFT_LIMIT
    : FREE_AI_ROADMAP_DRAFT_LIMIT;

export const getAiChatLimit = (subscription) =>
  subscription?.isSubscriber
    ? PRO_AI_CHAT_MESSAGE_LIMIT
    : FREE_AI_CHAT_MESSAGE_LIMIT;

export const getAiUsage = async (userId, subscription) => {
  const periodStart = getMonthlyUsageStart();
  const [draftUsage, chatUsage, activityDraftsUsed, activityChatUsed] =
    await Promise.all([
      UserAiUsage.findOne({
        user: userId,
        type: "ai_roadmap_draft",
        periodStart,
      }).lean(),
      UserAiUsage.findOne({
        user: userId,
        type: "ai_chat",
        periodStart,
      }).lean(),
      UserActivity.countDocuments({
        user: userId,
        type: "ai_roadmap_draft",
        occurredAt: { $gte: periodStart },
      }),
      UserActivity.countDocuments({
        user: userId,
        type: "ai_chat",
        occurredAt: { $gte: periodStart },
      }),
    ]);
  const draftsUsed = Math.max(draftUsage?.count || 0, activityDraftsUsed);
  const chatUsed = Math.max(chatUsage?.count || 0, activityChatUsed);
  const draftLimit = getAiDraftLimit(subscription);
  const chatLimit = getAiChatLimit(subscription);

  return {
    periodStart: periodStart.toISOString(),
    draftsUsed,
    draftLimit,
    planDraftLimit: draftLimit,
    freeDraftLimit: FREE_AI_ROADMAP_DRAFT_LIMIT,
    proDraftLimit: PRO_AI_ROADMAP_DRAFT_LIMIT,
    draftsRemaining: Math.max(draftLimit - draftsUsed, 0),
    chatUsed,
    chatLimit,
    planChatLimit: chatLimit,
    freeChatLimit: FREE_AI_CHAT_MESSAGE_LIMIT,
    proChatLimit: PRO_AI_CHAT_MESSAGE_LIMIT,
    chatRemaining: Math.max(chatLimit - chatUsed, 0),
  };
};

export const buildAiAccessPayload = async (user) => {
  const subscription = getAiSubscription(user);
  const usage = await getAiUsage(user._id, subscription);

  return {
    subscription,
    usage,
    capabilities: {
      canGenerateDraft: usage.draftsUsed < usage.draftLimit,
      canUseChat: usage.chatUsed < usage.chatLimit,
      canSaveRoadmap: subscription.isSubscriber,
      canExplainTopic: subscription.isSubscriber,
    },
  };
};

export const getCachedAiAccessPayload = async (user) => {
  const cacheKey = `ai-access:${toId(user._id)}:${user.subscription?.plan || "free"}:${user.subscription?.status || "inactive"}`;
  const cached = aiCache.get(cacheKey);
  if (cached) return cached;

  const payload = await buildAiAccessPayload(user);
  return aiCache.set(cacheKey, payload, AI_ACCESS_CACHE_TTL_MS);
};

export const ensureAiSubscriber = (user) => {
  const subscription = getAiSubscription(user);

  if (!subscription.isSubscriber) {
    const error = new Error("This AI feature requires an active Pro subscription.");
    error.status = 402;
    throw error;
  }

  return subscription;
};

export const recordAiActivity = async (userId, type, metadata = {}) => {
  try {
    await UserActivity.create({
      user: userId,
      type,
      metadata,
      occurredAt: new Date(),
    });
  } catch (error) {
    console.warn("Unable to record AI activity:", error.message);
  }
};

export const reserveAiRoadmapDraftUsage = async (userId, subscription) => {
  const periodStart = getMonthlyUsageStart();
  const draftLimit = getAiDraftLimit(subscription);

  if (draftLimit <= 0) {
    const error = new Error("Your AI roadmap draft limit has been used this month.");
    error.status = 402;
    throw error;
  }

  const activityDraftsUsed = await UserActivity.countDocuments({
    user: userId,
    type: "ai_roadmap_draft",
    occurredAt: { $gte: periodStart },
  });

  try {
    await UserAiUsage.updateOne(
      { user: userId, type: "ai_roadmap_draft", periodStart },
      {
        $setOnInsert: {
          user: userId,
          type: "ai_roadmap_draft",
          periodStart,
          count: activityDraftsUsed,
        },
      },
      { upsert: true },
    );
  } catch (error) {
    if (error.code !== 11000) {
      throw error;
    }
  }

  const reserve = async (upsert) =>
    UserAiUsage.findOneAndUpdate(
      {
        user: userId,
        type: "ai_roadmap_draft",
        periodStart,
        count: { $lt: draftLimit },
      },
      { $inc: { count: 1 } },
      { returnDocument: "after", upsert },
    );

  try {
    const usage = await reserve(true);
    if (usage) {
      invalidateAiUserCache(userId);
      return { periodStart, draftLimit };
    }
  } catch (error) {
    if (error.code !== 11000) {
      throw error;
    }

    const usage = await reserve(false);
    if (usage) {
      invalidateAiUserCache(userId);
      return { periodStart, draftLimit };
    }
  }

  const error = new Error("Your AI roadmap draft limit has been used this month.");
  error.status = 402;
  throw error;
};

export const releaseAiRoadmapDraftUsage = async (userId, periodStart) => {
  if (!periodStart) return;

  try {
    const usage = await UserAiUsage.findOneAndUpdate(
      {
        user: userId,
        type: "ai_roadmap_draft",
        periodStart,
        count: { $gt: 0 },
      },
      { $inc: { count: -1 } },
    );
    if (usage) invalidateAiUserCache(userId);
  } catch (error) {
    console.warn("Unable to release AI roadmap draft usage:", error.message);
  }
};

export const reserveAiUsage = async ({ userId, type, limit, limitMessage }) => {
  const periodStart = getMonthlyUsageStart();

  if (limit <= 0) {
    const error = new Error(limitMessage);
    error.status = 402;
    throw error;
  }

  const activityCount = await UserActivity.countDocuments({
    user: userId,
    type,
    occurredAt: { $gte: periodStart },
  });

  try {
    await UserAiUsage.updateOne(
      { user: userId, type, periodStart },
      {
        $setOnInsert: {
          user: userId,
          type,
          periodStart,
          count: activityCount,
        },
      },
      { upsert: true },
    );
  } catch (error) {
    if (error.code !== 11000) {
      throw error;
    }
  }

  const reserve = async (upsert) =>
    UserAiUsage.findOneAndUpdate(
      {
        user: userId,
        type,
        periodStart,
        count: { $lt: limit },
      },
      { $inc: { count: 1 } },
      { returnDocument: "after", upsert },
    );

  try {
    const usage = await reserve(true);
    if (usage) {
      invalidateAiUserCache(userId);
      return { periodStart, limit };
    }
  } catch (error) {
    if (error.code !== 11000) {
      throw error;
    }

    const usage = await reserve(false);
    if (usage) {
      invalidateAiUserCache(userId);
      return { periodStart, limit };
    }
  }

  const error = new Error(limitMessage);
  error.status = 402;
  throw error;
};

export const releaseAiUsage = async ({ userId, type, periodStart }) => {
  if (!periodStart) return;

  try {
    const usage = await UserAiUsage.findOneAndUpdate(
      {
        user: userId,
        type,
        periodStart,
        count: { $gt: 0 },
      },
      { $inc: { count: -1 } },
    );
    if (usage) invalidateAiUserCache(userId);
  } catch (error) {
    console.warn("Unable to release AI usage:", error.message);
  }
};

export const reserveAiChatUsage = async (userId, subscription) =>
  reserveAiUsage({
    userId,
    type: "ai_chat",
    limit: getAiChatLimit(subscription),
    limitMessage: "Your AI chat message limit has been used this month.",
  });

export const updateAiChatTokenUsage = async ({ userId, periodStart, usage }) => {
  if (!periodStart || !usage) return;

  try {
    const updatedUsage = await UserAiUsage.findOneAndUpdate(
      { user: userId, type: "ai_chat", periodStart },
      {
        $inc: {
          promptTokens: usage.promptTokens || 0,
          completionTokens: usage.completionTokens || 0,
          totalTokens: usage.totalTokens || 0,
        },
      },
    );
    if (updatedUsage) invalidateAiUserCache(userId);
  } catch (error) {
    console.warn("Unable to update AI chat token usage:", error.message);
  }
};
