import OpenAI from "openai";
import crypto from "crypto";
import Course from "../models/course/courseModel.js";
import RoadmapTemplate from "../models/roadmap/roadmapTemplateModel.js";
import UserActivity from "../models/user/userActivityModel.js";
import UserAiUsage from "../models/user/userAiUsageModel.js";
import UserCourseProgress from "../models/user/userCourseProgressModel.js";
import UserPreference from "../models/user/userPreferenceModel.js";
import UserRoadmap from "../models/user/userRoadmapModel.js";
import UserRoadmapStepProgress from "../models/user/userRoadmapStepProgressModel.js";

const LEVEL_RANK = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
};

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

const GEMINI_DEFAULT_MODEL = "gemini-3.5-flash";
const GEMINI_DEFAULT_FALLBACK_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-3-flash-preview",
];
const GEMINI_THINKING_LEVELS = new Set(["MINIMAL", "LOW", "MEDIUM", "HIGH"]);

const toId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (value._id) return String(value._id);
  return String(value);
};

const normalizeText = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff]+/gi, " ")
    .trim();

const tokenize = (value = "") =>
  normalizeText(value)
    .split(/\s+/)
    .filter((token) => token.length > 1);

const normalizeList = (values = []) =>
  Array.isArray(values)
    ? values.map(normalizeText).filter(Boolean)
    : [];

const unique = (values = []) => [...new Set(values.filter(Boolean))];

const parseCsvEnv = (value = "") =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const parseLimit = (value) => clamp(parseInt(value, 10) || 6, 1, 12);

const slugify = (value = "") =>
  normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "ai-roadmap";

const titleCase = (value = "") =>
  normalizeText(value)
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const getMonthlyUsageStart = (date = new Date()) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));

const getAiSubscription = (user = {}) => {
  const plan = user.subscription?.plan || "free";
  const status = user.subscription?.status || "inactive";
  const isSubscriber = plan === "pro" && ["active", "trialing"].includes(status);

  return {
    plan,
    status,
    isSubscriber,
  };
};

const getAiDraftLimit = (subscription) =>
  subscription?.isSubscriber ? PRO_AI_ROADMAP_DRAFT_LIMIT : FREE_AI_ROADMAP_DRAFT_LIMIT;

const getAiUsage = async (userId, subscription) => {
  const periodStart = getMonthlyUsageStart();
  const [usage, activityDraftsUsed] = await Promise.all([
    UserAiUsage.findOne({
      user: userId,
      type: "ai_roadmap_draft",
      periodStart,
    }).lean(),
    UserActivity.countDocuments({
      user: userId,
      type: "ai_roadmap_draft",
      occurredAt: { $gte: periodStart },
    }),
  ]);
  const draftsUsed = Math.max(usage?.count || 0, activityDraftsUsed);
  const draftLimit = getAiDraftLimit(subscription);

  return {
    periodStart: periodStart.toISOString(),
    draftsUsed,
    draftLimit,
    planDraftLimit: draftLimit,
    freeDraftLimit: FREE_AI_ROADMAP_DRAFT_LIMIT,
    proDraftLimit: PRO_AI_ROADMAP_DRAFT_LIMIT,
    draftsRemaining: Math.max(draftLimit - draftsUsed, 0),
  };
};

const buildAiAccessPayload = async (user) => {
  const subscription = getAiSubscription(user);
  const usage = await getAiUsage(user._id, subscription);

  return {
    subscription,
    usage,
    capabilities: {
      canGenerateDraft: usage.draftsUsed < usage.draftLimit,
      canSaveRoadmap: subscription.isSubscriber,
      canExplainTopic: subscription.isSubscriber,
    },
  };
};

const ensureAiSubscriber = (user) => {
  const subscription = getAiSubscription(user);

  if (!subscription.isSubscriber) {
    const error = new Error("This AI feature requires an active Pro subscription.");
    error.status = 402;
    throw error;
  }

  return subscription;
};

const recordAiActivity = async (userId, type, metadata = {}) => {
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

const reserveAiRoadmapDraftUsage = async (userId, subscription) => {
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
    if (usage) return { periodStart, draftLimit };
  } catch (error) {
    if (error.code !== 11000) {
      throw error;
    }

    const usage = await reserve(false);
    if (usage) return { periodStart, draftLimit };
  }

  const error = new Error("Your AI roadmap draft limit has been used this month.");
  error.status = 402;
  throw error;
};

const releaseAiRoadmapDraftUsage = async (userId, periodStart) => {
  if (!periodStart) return;

  try {
    await UserAiUsage.findOneAndUpdate(
      {
        user: userId,
        type: "ai_roadmap_draft",
        periodStart,
        count: { $gt: 0 },
      },
      { $inc: { count: -1 } },
    );
  } catch (error) {
    console.warn("Unable to release AI roadmap draft usage:", error.message);
  }
};

const getGeminiConfig = () => ({
  apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
  baseURL: (process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta").replace(/\/$/, ""),
  models: unique([
    process.env.GEMINI_MODEL || process.env.AI_GEMINI_MODEL || GEMINI_DEFAULT_MODEL,
    ...(
      process.env.GEMINI_FALLBACK_MODELS
        ? parseCsvEnv(process.env.GEMINI_FALLBACK_MODELS)
        : GEMINI_DEFAULT_FALLBACK_MODELS
    ),
  ]),
});

const getOpenAiConfig = () => ({
  apiKey: process.env.OPENAI_API_KEY || process.env.AI_OPENAI_API_KEY || process.env.AI_API_KEY,
  baseURL: (process.env.OPENAI_BASE_URL || process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, ""),
  model: process.env.OPENAI_MODEL || process.env.AI_MODEL || "gpt-4o-mini",
});

const createOpenAiClient = ({ apiKey, baseURL }) =>
  new OpenAI({
    apiKey,
    baseURL,
  });

const getGeminiModelPath = (model) =>
  String(model || "")
    .replace(/^models\//, "")
    .trim();

const getGeminiThinkingLevel = () => {
  const thinkingLevel = String(process.env.GEMINI_THINKING_LEVEL || "")
    .trim()
    .toUpperCase();

  return GEMINI_THINKING_LEVELS.has(thinkingLevel) ? thinkingLevel : null;
};

const buildGeminiGenerationConfig = (maxTokens) => {
  const thinkingLevel = getGeminiThinkingLevel();
  const generationConfig = {
    maxOutputTokens: maxTokens,
    responseMimeType: "application/json",
  };

  if (thinkingLevel) {
    generationConfig.thinkingConfig = {
      thinkingLevel,
    };
  }

  return generationConfig;
};

const isProviderAuthError = (error) => [401, 403].includes(error?.status);

const extractJsonObject = (value = "") => {
  const raw = String(value || "").trim();
  const fencedMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch?.[1]?.trim() || raw;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("AI response did not include a JSON object.");
  }

  return JSON.parse(candidate.slice(start, end + 1));
};

const sanitizeAiProviderMessage = (message = "") =>
  String(message || "AI provider request failed.")
    .replace(/sk-[A-Za-z0-9_-]+/g, "sk-***")
    .replace(/AIza[A-Za-z0-9_-]+/g, "AIza***")
    .replace(/([?&]key=)[^&\s]+/gi, "$1[redacted]")
    .replace(/(Incorrect API key provided:)\s*[^.\s]+/i, "$1 [redacted]")
    .trim();

const toAiProviderError = (providerError, fallbackMessage = "AI provider request failed.") => {
  const providerStatus =
    providerError?.status ||
    providerError?.response?.status ||
    providerError?.statusCode;
  const error = new Error(
    sanitizeAiProviderMessage(
      providerError?.message || fallbackMessage,
    ),
  );
  error.status =
    Number.isInteger(providerStatus) && providerStatus >= 400 && providerStatus < 600
      ? providerStatus
      : 502;
  return error;
};

const callOpenAiJson = async ({ system, user, maxTokens, config }) => {
  const client = createOpenAiClient(config);
  try {
    const completion = await client.chat.completions.create({
      model: config.model,
      temperature: 0.4,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });

    const content = completion.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("AI provider returned an empty response.");
    }

    return {
      json: extractJsonObject(content),
      model: config.model,
      provider: "openai",
    };
  } catch (providerError) {
    throw toAiProviderError(providerError);
  }
};

const callGeminiJson = async ({ system, user, maxTokens, config }) => {
  const modelPath = getGeminiModelPath(config.model);
  const url = new URL(`${config.baseURL}/models/${encodeURIComponent(modelPath)}:generateContent`);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": config.apiKey,
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: system }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: user }],
          },
        ],
        generationConfig: buildGeminiGenerationConfig(maxTokens),
      }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(data?.error?.message || "Gemini provider request failed.");
      error.status = response.status;
      throw error;
    }

    const content = data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text)
      .filter(Boolean)
      .join("\n");

    if (!content) {
      const blockReason = data?.promptFeedback?.blockReason || data?.candidates?.[0]?.finishReason;
      throw new Error(blockReason ? `Gemini returned no JSON content: ${blockReason}` : "Gemini returned an empty response.");
    }

    return {
      json: extractJsonObject(content),
      model: config.model,
      provider: "gemini",
    };
  } catch (providerError) {
    throw toAiProviderError(providerError, "Gemini provider request failed.");
  }
};

const callAiJson = async ({ system, user, maxTokens = 2200 }) => {
  const geminiConfig = getGeminiConfig();
  const openAiConfig = getOpenAiConfig();
  const providers = [];

  if (geminiConfig.apiKey) {
    geminiConfig.models.forEach((model) => {
      providers.push({
        name: `gemini:${model}`,
        provider: "gemini",
        call: () =>
          callGeminiJson({
            system,
            user,
            maxTokens,
            config: { ...geminiConfig, model },
          }),
      });
    });
  }

  if (openAiConfig.apiKey) {
    providers.push({
      name: `openai:${openAiConfig.model}`,
      provider: "openai",
      call: () => callOpenAiJson({ system, user, maxTokens, config: openAiConfig }),
    });
  }

  if (!providers.length) {
    const error = new Error("AI API key is not configured. Set GEMINI_API_KEY or OPENAI_API_KEY.");
    error.status = 503;
    throw error;
  }

  let lastError = null;
  const failedProviders = [];

  for (const provider of providers) {
    try {
      return await provider.call();
    } catch (error) {
      lastError = error;
      failedProviders.push({
        provider: provider.provider,
        name: provider.name,
        status: error.status || 502,
        message: sanitizeAiProviderMessage(error.message),
      });
      if (provider.name === providers[providers.length - 1]?.name) {
        break;
      }
      console.warn(
        `AI provider ${provider.name} failed; trying fallback provider.`,
        {
          status: error.status || 502,
          message: sanitizeAiProviderMessage(error.message),
        },
      );
    }
  }

  const openAiAuthFailure = failedProviders.find(
    (failure) => failure.provider === "openai" && isProviderAuthError(failure),
  );
  const geminiTemporaryFailure = failedProviders.find(
    (failure) =>
      failure.provider === "gemini" &&
      [429, 500, 502, 503, 504].includes(failure.status),
  );

  if (openAiAuthFailure && geminiTemporaryFailure) {
    const error = new Error(
      "Gemini is temporarily unavailable and the OpenAI fallback key is invalid. Fix OPENAI_API_KEY or wait and retry Gemini.",
    );
    error.status = geminiTemporaryFailure.status;
    throw error;
  }

  throw lastError || Object.assign(new Error("AI provider request failed."), { status: 502 });
};

const addReason = (reasons, reason) => {
  if (reason && !reasons.includes(reason) && reasons.length < 4) {
    reasons.push(reason);
  }
};

const countMatches = (sourceTerms = [], targetTerms = []) => {
  const target = new Set(targetTerms.map(normalizeText).filter(Boolean));
  return sourceTerms.reduce(
    (count, term) => count + (target.has(normalizeText(term)) ? 1 : 0),
    0,
  );
};

const getCourseTerms = (course = {}) => {
  const source = course || {};

  return unique([
    ...normalizeList(source.tags),
    normalizeText(source.category),
    ...tokenize(source.title),
    ...tokenize(source.shortDescription),
    ...normalizeList(source.prerequisites),
    ...normalizeList(source.learningOutcomes),
  ]);
};

const getRoadmapTerms = (template = {}) => {
  const source = template || {};

  return unique([
    ...normalizeList(source.tags),
    normalizeText(source.templateType),
    normalizeText(source.targetRole),
    ...tokenize(source.title),
    ...tokenize(source.goal),
    ...tokenize(source.description),
    ...(source.steps || []).flatMap((step) => [
      ...tokenize(step.title),
      ...tokenize(step.description),
    ]),
  ]);
};

const getLevelScore = (candidateLevel, preferredLevel, reasons, label) => {
  if (!candidateLevel || !preferredLevel) return 0;

  if (candidateLevel === preferredLevel) {
    addReason(reasons, `${label} matches your ${preferredLevel} level.`);
    return 18;
  }

  const distance = Math.abs(
    (LEVEL_RANK[candidateLevel] ?? 0) - (LEVEL_RANK[preferredLevel] ?? 0),
  );

  if (distance === 1) {
    addReason(reasons, `${label} is close to your current level.`);
    return 8;
  }

  return -8;
};

const getStudyLoadScore = (minutes, weeklyStudyHours, reasons) => {
  if (!minutes || !weeklyStudyHours) return 0;

  const weeklyMinutes = weeklyStudyHours * 60;

  if (minutes <= weeklyMinutes * 2) {
    addReason(reasons, "The workload fits your weekly study time.");
    return 6;
  }

  if (minutes > weeklyMinutes * 6) {
    return -6;
  }

  return 0;
};

const summarizeProfile = (preferences, signalTerms, preferredLevel) => ({
  preferredLevel,
  learningPace: preferences?.learningPace || "medium",
  weeklyStudyHours: preferences?.weeklyStudyHours || 0,
  interests: signalTerms.slice(0, 12),
  source: preferences ? "preferences-and-progress" : "progress-only",
});

const buildSignals = ({ preferences, coursesProgress, roadmaps }) => {
  const preferenceTerms = unique([
    ...normalizeList(preferences?.interests),
    ...normalizeList(preferences?.preferredCategories),
    ...normalizeList(preferences?.learningGoals),
  ]);

  const progressTerms = unique([
    ...coursesProgress.flatMap((progress) => getCourseTerms(progress.course)),
    ...roadmaps.flatMap((roadmap) => getRoadmapTerms(roadmap.template)),
  ]);

  const signalTerms = unique([...preferenceTerms, ...progressTerms]);

  return {
    preferredLevel:
      preferences?.preferredDifficulty ||
      preferences?.skillLevel ||
      roadmaps.find((roadmap) => roadmap.template?.targetLevel)?.template
        ?.targetLevel ||
      coursesProgress.find((progress) => progress.course?.level)?.course
        ?.level ||
      "beginner",
    signalTerms,
    preferenceTerms,
  };
};

const buildNextStepRecommendations = ({
  roadmaps,
  stepProgress,
  courseProgressByCourseId,
  limit,
}) => {
  const progressByRoadmapAndStep = new Map(
    stepProgress.map((progress) => [
      `${toId(progress.roadmap)}:${progress.stepKey}`,
      progress,
    ]),
  );

  return roadmaps
    .filter((roadmap) => ["assigned", "inProgress", "paused"].includes(roadmap.status))
    .map((roadmap) => {
      const steps = [...(roadmap.template?.steps || [])].sort(
        (left, right) => (left.order || 0) - (right.order || 0),
      );
      const completedStepKeys = new Set(
        steps
          .filter((step) => {
            const progress = progressByRoadmapAndStep.get(
              `${toId(roadmap._id)}:${step.stepKey}`,
            );
            return progress?.status === "completed";
          })
          .map((step) => step.stepKey),
      );

      const nextStep = steps.find((step) => {
        const progress = progressByRoadmapAndStep.get(
          `${toId(roadmap._id)}:${step.stepKey}`,
        );
        const isOpen = !["completed", "skipped"].includes(progress?.status);
        const dependenciesDone = (step.dependsOn || []).every((dependency) =>
          completedStepKeys.has(dependency),
        );
        return isOpen && dependenciesDone;
      });

      if (!nextStep) return null;

      const progress = progressByRoadmapAndStep.get(
        `${toId(roadmap._id)}:${nextStep.stepKey}`,
      );
      const linkedCourseId = toId(nextStep.course || progress?.course);
      const linkedCourseProgress = courseProgressByCourseId.get(linkedCourseId);
      const isResume =
        progress?.status === "inProgress" ||
        linkedCourseProgress?.status === "inProgress";

      return {
        type: "roadmap_step",
        matchScore: isResume ? 96 : 88,
        roadmap: {
          _id: roadmap._id,
          title: roadmap.template?.title,
          slug: roadmap.template?.slug,
          progressPercent: roadmap.progressPercent || 0,
        },
        step: {
          stepKey: nextStep.stepKey,
          title: nextStep.title,
          description: nextStep.description,
          estimatedMinutes: nextStep.estimatedMinutes || 0,
          course: nextStep.course || progress?.course || null,
        },
        reason: isResume
          ? "This is already in progress and is the fastest path forward."
          : "This is the next unlocked step in your active roadmap.",
        nextAction: isResume ? "continue_step" : "start_step",
      };
    })
    .filter(Boolean)
    .sort((left, right) => right.matchScore - left.matchScore)
    .slice(0, Math.min(limit, 4));
};

const scoreCourse = ({
  course,
  signals,
  preferences,
  courseProgress,
  activeStepCourseIds,
  activeRoadmapTerms,
}) => {
  const reasons = [];
  const terms = getCourseTerms(course);
  let score = 20;

  const interestMatches = countMatches(signals.signalTerms, terms);
  if (interestMatches > 0) {
    score += clamp(interestMatches * 8, 0, 32);
    addReason(reasons, "It matches your learning interests.");
  }

  const activeRoadmapMatches = countMatches(activeRoadmapTerms, terms);
  if (activeRoadmapMatches > 0) {
    score += clamp(activeRoadmapMatches * 5, 0, 20);
    addReason(reasons, "It supports your active roadmap.");
  }

  score += getLevelScore(course.level, signals.preferredLevel, reasons, "This course");

  if (activeStepCourseIds.has(toId(course._id))) {
    score += 30;
    addReason(reasons, "It is linked to your next roadmap step.");
  }

  if (courseProgress?.status === "inProgress") {
    score += 25;
    addReason(reasons, "You have already started it.");
  } else if (courseProgress?.status === "abandoned") {
    score -= 15;
    addReason(reasons, "You can retry it when you are ready.");
  }

  if (course.isFeatured) score += 5;
  score += clamp((course.stats?.averageRating || 0) * 2, 0, 10);
  score += clamp((course.stats?.completionRate || 0) / 20, 0, 5);
  score += getStudyLoadScore(
    course.durationMinutes,
    preferences?.weeklyStudyHours,
    reasons,
  );

  if (reasons.length === 0) {
    addReason(reasons, "It is a published course that can broaden your path.");
  }

  return {
    type: "course",
    matchScore: clamp(Math.round(score), 1, 99),
    course: {
      _id: course._id,
      title: course.title,
      slug: course.slug,
      shortDescription: course.shortDescription,
      level: course.level,
      category: course.category,
      tags: course.tags || [],
      thumbnailUrl: course.thumbnailUrl,
      durationMinutes: course.durationMinutes || 0,
      stats: course.stats,
    },
    reason: reasons.join(" "),
    nextAction:
      courseProgress?.status === "inProgress"
        ? "continue_course"
        : courseProgress?.status === "abandoned"
          ? "retry_course"
          : activeStepCourseIds.has(toId(course._id))
            ? "start_roadmap_course"
            : "enroll_course",
  };
};

const scoreRoadmap = ({ template, signals, preferences, hasActiveRoadmap }) => {
  const reasons = [];
  const terms = getRoadmapTerms(template);
  let score = 20;

  const interestMatches = countMatches(signals.signalTerms, terms);
  if (interestMatches > 0) {
    score += clamp(interestMatches * 8, 0, 36);
    addReason(reasons, "It matches your interests and goals.");
  }

  score += getLevelScore(
    template.targetLevel,
    signals.preferredLevel,
    reasons,
    "This roadmap",
  );

  if (!hasActiveRoadmap) {
    score += 10;
    addReason(reasons, "It can give your learning a clear structure.");
  }

  if (template.templateType === "skillBased" && signals.preferenceTerms.length > 0) {
    score += 6;
    addReason(reasons, "It focuses on specific skills you care about.");
  }

  score += getStudyLoadScore(
    template.estimatedTotalMinutes,
    preferences?.weeklyStudyHours,
    reasons,
  );

  if (reasons.length === 0) {
    addReason(reasons, "It is an active roadmap that may fit your next goal.");
  }

  return {
    type: "roadmap",
    matchScore: clamp(Math.round(score), 1, 99),
    roadmap: {
      _id: template._id,
      title: template.title,
      slug: template.slug,
      goal: template.goal,
      description: template.description,
      targetLevel: template.targetLevel,
      targetRole: template.targetRole,
      templateType: template.templateType,
      tags: template.tags || [],
      estimatedTotalMinutes: template.estimatedTotalMinutes || 0,
    },
    reason: reasons.join(" "),
    nextAction: "assign_roadmap",
  };
};

export const getAiRecommendations = async (req, res) => {
  const userId = req.user._id;
  const limit = parseLimit(req.query.limit);

  try {
    const [
      preferences,
      coursesProgress,
      roadmaps,
      stepProgress,
      activities,
      publishedCourses,
      activeTemplates,
    ] = await Promise.all([
      UserPreference.findOne({ user: userId }).lean(),
      UserCourseProgress.find({ user: userId })
        .populate(
          "course",
          "title slug shortDescription level category tags thumbnailUrl durationMinutes stats isFeatured deletedAt isPublished",
        )
        .sort({ lastAccessedAt: -1 })
        .lean(),
      UserRoadmap.find({ user: userId, status: { $ne: "archived" } })
        .populate(
          "template",
          "title slug goal description targetLevel targetRole templateType tags steps estimatedTotalMinutes",
        )
        .sort({ lastAccessedAt: -1, updatedAt: -1 })
        .lean(),
      UserRoadmapStepProgress.find({ user: userId })
        .select("roadmap template stepKey course status score timeSpentMinutes attempts")
        .lean(),
      UserActivity.find({ user: userId })
        .populate("course", "title slug tags category level")
        .populate({
          path: "roadmap",
          select: "template progressPercent",
          populate: {
            path: "template",
            select: "title slug tags targetLevel templateType",
          },
        })
        .sort({ occurredAt: -1, createdAt: -1 })
        .limit(30)
        .lean(),
      Course.find({ deletedAt: null, isPublished: true })
        .select(
          "title slug shortDescription level category tags thumbnailUrl durationMinutes stats isFeatured prerequisites learningOutcomes roadmapTemplate",
        )
        .sort({ isFeatured: -1, createdAt: -1 })
        .limit(100)
        .lean(),
      RoadmapTemplate.find({ isActive: true })
        .select(
          "title slug goal description targetLevel targetRole templateType tags steps estimatedTotalMinutes",
        )
        .sort({ createdAt: -1 })
        .limit(100)
        .lean(),
    ]);

    const courseProgressByCourseId = new Map(
      coursesProgress
        .filter((progress) => progress.course)
        .map((progress) => [toId(progress.course), progress]),
    );
    const completedCourseIds = new Set(
      coursesProgress
        .filter((progress) => progress.status === "completed")
        .map((progress) => toId(progress.course)),
    );
    const assignedTemplateIds = new Set(
      roadmaps.map((roadmap) => toId(roadmap.template)),
    );
    const activeRoadmaps = roadmaps.filter((roadmap) =>
      ["assigned", "inProgress", "paused"].includes(roadmap.status),
    );
    const activeRoadmapTerms = unique(
      activeRoadmaps.flatMap((roadmap) => getRoadmapTerms(roadmap.template)),
    );
    const activeStepCourseIds = new Set(
      stepProgress
        .filter((progress) => !["completed", "skipped"].includes(progress.status))
        .map((progress) => toId(progress.course))
        .filter(Boolean),
    );

    const signals = buildSignals({ preferences, coursesProgress, roadmaps });
    const activitySignals = unique(
      activities.flatMap((activity) => [
        ...getCourseTerms(activity.course),
        ...getRoadmapTerms(activity.roadmap?.template),
        ...tokenize(activity.searchQuery),
      ]),
    );
    signals.signalTerms = unique([...signals.signalTerms, ...activitySignals]);

    const nextSteps = buildNextStepRecommendations({
      roadmaps,
      stepProgress,
      courseProgressByCourseId,
      limit,
    });

    const courses = publishedCourses
      .filter((course) => !completedCourseIds.has(toId(course._id)))
      .map((course) =>
        scoreCourse({
          course,
          signals,
          preferences,
          courseProgress: courseProgressByCourseId.get(toId(course._id)),
          activeStepCourseIds,
          activeRoadmapTerms,
        }),
      )
      .sort((left, right) => right.matchScore - left.matchScore)
      .slice(0, limit);

    const roadmapsToRecommend = activeTemplates
      .filter((template) => !assignedTemplateIds.has(toId(template._id)))
      .map((template) =>
        scoreRoadmap({
          template,
          signals,
          preferences,
          hasActiveRoadmap: activeRoadmaps.length > 0,
        }),
      )
      .sort((left, right) => right.matchScore - left.matchScore)
      .slice(0, limit);

    return res.status(200).json({
      success: true,
      message: "AI recommendations generated successfully.",
      data: {
        engine: "ilma-recommendation-rules-v1",
        generatedAt: new Date().toISOString(),
        profile: summarizeProfile(
          preferences,
          signals.signalTerms,
          signals.preferredLevel,
        ),
        recommendations: {
          nextSteps,
          courses,
          roadmaps: roadmapsToRecommend,
        },
      },
    });
  } catch (error) {
    console.error("AI recommendations error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate AI recommendations.",
      error: error.message,
    });
  }
};

const stepsToMarkdown = (steps) =>
  steps
    .map((step) => {
      const resources = (step.resources || [])
        .map((resource) => `- [${resource.title}](${resource.url})`)
        .join("\n");

      return `## ${step.title}\n${step.description}\n\n${resources}`;
    })
    .join("\n\n");

const sanitizeAiResource = (resource = {}) => {
  const title = String(resource.title || "").trim().slice(0, 120);
  const url = String(resource.url || "").trim();

  if (!title || !/^https?:\/\/\S+$/i.test(url)) {
    return null;
  }

  return { title, url };
};

const sanitizeAiSteps = (steps = []) => {
  if (!Array.isArray(steps)) {
    throw new Error("AI response steps must be an array.");
  }

  const usedStepKeys = new Set();
  const keyAliases = new Map();

  const normalizedSteps = steps.slice(0, 12).map((step, index) => {
    const title = String(step.title || "").trim().slice(0, 120);

    if (title.length < 3) {
      throw new Error("Each AI roadmap step must include a title.");
    }

    const rawStepKey = step.stepKey || title || `step-${index + 1}`;
    const baseStepKey = slugify(rawStepKey);
    const stepKey = usedStepKeys.has(baseStepKey)
      ? `${baseStepKey}-${index + 1}`
      : baseStepKey;
    usedStepKeys.add(stepKey);
    keyAliases.set(baseStepKey, stepKey);

    return {
      stepKey,
      originalDependsOn: step.dependsOn,
      title,
      description: String(step.description || "").trim().slice(0, 1000),
      resources: Array.isArray(step.resources)
        ? step.resources.map(sanitizeAiResource).filter(Boolean).slice(0, 4)
        : [],
      order: index,
      estimatedMinutes: clamp(parseInt(step.estimatedMinutes, 10) || 90, 30, 2400),
      required: step.required !== false,
    };
  });

  return normalizedSteps.map((step, index) => {
    const previousStepKeys = new Set(
      normalizedSteps.slice(0, index).map((previousStep) => previousStep.stepKey),
    );
    const rawDependencies = Array.isArray(step.originalDependsOn)
      ? step.originalDependsOn
      : index > 0
        ? [normalizedSteps[index - 1].stepKey]
        : [];
    const dependsOn = unique(
      rawDependencies
        .map((dependency) => slugify(dependency))
        .map((dependency) => keyAliases.get(dependency) || dependency)
        .filter((dependency) =>
          dependency &&
          dependency !== step.stepKey &&
          previousStepKeys.has(dependency),
        ),
    );
    const { originalDependsOn, ...sanitizedStep } = step;

    return {
      ...sanitizedStep,
      dependsOn,
    };
  });
};

const buildRoadmapDraftPrompt = ({
  goal,
  targetRole,
  targetLevel,
  templateType,
  durationWeeks,
  weeklyStudyHours,
}) => ({
  system:
    "You generate practical software learning roadmap drafts for an admin review workflow. Return only valid JSON. Do not include markdown fences or commentary.",
  user: JSON.stringify({
    task: "Create a roadmap template draft.",
    requirements: {
      goal,
      targetRole,
      targetLevel,
      templateType,
      durationWeeks,
      weeklyStudyHours,
      language: "English",
      stepCount: {
        minimum: 4,
        maximum: 10,
      },
      resources: {
        perStep: "2 to 4",
        requirement:
          "Use real public URLs only. Include at least one documentation/article/reference link and at least one video link when useful. Prefer official documentation, reputable guides, YouTube educational videos, and practice resources.",
        titleGuidance:
          "Make resource titles short and readable. Include words like Docs, Guide, Tutorial, Video, or YouTube when relevant.",
      },
      dependencies:
        "Use stepKey values in dependsOn. The first step should have an empty dependsOn array.",
    },
    responseShape: {
      title: "string, 3-120 chars",
      slug: "lowercase-url-slug",
      goal: "string",
      description: "string, <= 2000 chars",
      tags: ["lowercase strings"],
      steps: [
        {
          stepKey: "lowercase unique slug",
          title: "string",
          description: "string",
          resources: [
            { title: "string, docs/article/reference", url: "https://..." },
            { title: "string, video/youtube", url: "https://..." },
          ],
          estimatedMinutes: "number",
          required: true,
          dependsOn: ["previous-step-key"],
        },
      ],
    },
  }),
});

const createAiRoadmapDraft = async ({
  goal,
  targetRole = "student",
  targetLevel = "beginner",
  templateType = "skillBased",
  durationWeeks = 8,
  weeklyStudyHours = 6,
}) => {
  const normalizedGoal = String(goal || "").trim();

  if (normalizedGoal.length < 10) {
    const error = new Error("Goal must be at least 10 characters.");
    error.status = 400;
    throw error;
  }

  const normalizedLevel = ["beginner", "intermediate", "advanced"].includes(targetLevel)
    ? targetLevel
    : "beginner";
  const normalizedTemplateType = templateType === "roleBased" ? "roleBased" : "skillBased";
  const parsedDurationWeeks = clamp(parseInt(durationWeeks, 10) || 8, 4, 12);
  const parsedWeeklyStudyHours = clamp(parseInt(weeklyStudyHours, 10) || 6, 1, 30);
  const prompt = buildRoadmapDraftPrompt({
    goal: normalizedGoal,
    targetRole,
    targetLevel: normalizedLevel,
    templateType: normalizedTemplateType,
    durationWeeks: parsedDurationWeeks,
    weeklyStudyHours: parsedWeeklyStudyHours,
  });
  const { json: aiDraft, model, provider } = await callAiJson({
    system: prompt.system,
    user: prompt.user,
  });
  const title = String(aiDraft.title || titleCase(normalizedGoal))
    .trim()
    .slice(0, 120);
  const steps = sanitizeAiSteps(aiDraft.steps);

  if (steps.length < 4) {
    throw new Error("AI response must include at least 4 roadmap steps.");
  }

  const estimatedTotalMinutes = steps.reduce(
    (total, step) => total + step.estimatedMinutes,
    0,
  );

  return {
    engine: "ai-roadmap-draft-v1",
    model,
    provider,
    generatedAt: new Date().toISOString(),
    draft: {
      title,
      slug: slugify(aiDraft.slug || title),
      goal: normalizedGoal,
      description:
        String(aiDraft.description || "").trim().slice(0, 2000) ||
        `A ${parsedDurationWeeks}-week ${normalizedLevel} roadmap for ${normalizedGoal}.`,
      targetRole,
      targetLevel: normalizedLevel,
      templateType: normalizedTemplateType,
      tags: normalizeList(aiDraft.tags).slice(0, 10),
      source: "ai",
      contentFormat: "markdown",
      contentMarkdown: stepsToMarkdown(steps),
      steps,
      estimatedTotalMinutes,
    },
  };
};

export const generateAiRoadmapDraft = async (req, res) => {
  const {
    goal,
    targetRole = "student",
    targetLevel = "beginner",
    templateType = "roleBased",
    durationWeeks = 8,
    weeklyStudyHours = 6,
  } = req.body;

  try {
    const draftPayload = await createAiRoadmapDraft({
      goal,
      targetRole,
      targetLevel,
      templateType,
      durationWeeks,
      weeklyStudyHours,
    });

    return res.status(200).json({
      success: true,
      message: "AI roadmap draft generated successfully.",
      data: draftPayload,
    });
  } catch (error) {
    console.error("AI roadmap draft error:", {
      status: error.status || 500,
      message: sanitizeAiProviderMessage(error.message),
    });
    return res.status(error.status || 500).json({
      success: false,
      message: "Failed to generate AI roadmap draft.",
      error: sanitizeAiProviderMessage(error.message),
    });
  }
};

const createPrivateAiSlug = async (baseSlug, userId) => {
  const ownerPart = String(userId).slice(-6);
  const randomPart = crypto.randomUUID().slice(0, 8);
  const base = slugify(baseSlug).slice(0, 56);
  let slug = `${base}-${ownerPart}-${randomPart}`;
  let attempt = 0;

  while (await RoadmapTemplate.exists({ slug })) {
    attempt += 1;
    slug = `${base}-${ownerPart}-${randomPart}-${attempt}`;
  }

  return slug;
};

const createStepProgressRecords = (userId, roadmap, template) =>
  (template.steps || []).map((step) => ({
    user: userId,
    roadmap: roadmap._id,
    template: template._id,
    stepKey: step.stepKey,
    course: step.course,
    status: "notStarted",
  }));

export const getAiFeatureAccess = async (req, res) => {
  try {
    const access = await buildAiAccessPayload(req.user);

    return res.status(200).json({
      success: true,
      message: "AI feature access retrieved successfully.",
      data: access,
    });
  } catch (error) {
    console.error("AI feature access error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load AI feature access.",
      error: error.message,
    });
  }
};

export const generateUserAiRoadmapDraft = async (req, res) => {
  const userId = req.user._id;
  const {
    prompt,
    targetLevel = "beginner",
    durationWeeks = 8,
    weeklyStudyHours = 6,
  } = req.body;

  let reservation = null;

  try {
    const subscription = getAiSubscription(req.user);

    try {
      reservation = await reserveAiRoadmapDraftUsage(userId, subscription);
    } catch (error) {
      if (error.status !== 402) {
        throw error;
      }
      const access = await buildAiAccessPayload(req.user);
      return res.status(402).json({
        success: false,
        message: error.message,
        data: access,
      });
    }

    let draftPayload;

    try {
      draftPayload = await createAiRoadmapDraft({
        goal: prompt,
        targetRole: "student",
        targetLevel,
        templateType: "skillBased",
        durationWeeks,
        weeklyStudyHours,
      });
    } catch (error) {
      await releaseAiRoadmapDraftUsage(userId, reservation.periodStart);
      reservation = null;
      throw error;
    }

    await recordAiActivity(userId, "ai_roadmap_draft", {
      prompt: String(prompt || "").slice(0, 300),
      title: draftPayload.draft.title,
    });

    const nextAccess = await buildAiAccessPayload(req.user);

    return res.status(200).json({
      success: true,
      message: "AI roadmap generated successfully.",
      data: {
        ...draftPayload,
        access: nextAccess,
      },
    });
  } catch (error) {
    console.error("User AI roadmap draft error:", {
      status: error.status || 500,
      message: sanitizeAiProviderMessage(error.message),
    });
    return res.status(error.status || 500).json({
      success: false,
      message: "Failed to generate AI roadmap.",
      error: sanitizeAiProviderMessage(error.message),
    });
  }
};

export const saveUserAiRoadmap = async (req, res) => {
  const userId = req.user._id;
  const draft = req.body?.draft || {};

  try {
    ensureAiSubscriber(req.user);

    const title = String(draft.title || "").trim().slice(0, 120);
    const goal = String(draft.goal || title).trim().slice(0, 300);
    let steps;

    try {
      steps = sanitizeAiSteps(draft.steps);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "A saved AI roadmap includes invalid steps.",
        error: error.message,
      });
    }

    if (!title || !goal || steps.length < 4) {
      return res.status(400).json({
        success: false,
        message: "A saved AI roadmap must include a title, goal, and at least 4 steps.",
      });
    }

    const template = await RoadmapTemplate.create({
      title,
      slug: await createPrivateAiSlug(draft.slug || title, userId),
      goal,
      description: String(draft.description || "").trim().slice(0, 2000),
      targetRole: "student",
      targetLevel: ["beginner", "intermediate", "advanced"].includes(draft.targetLevel)
        ? draft.targetLevel
        : "beginner",
      templateType: draft.templateType === "roleBased" ? "roleBased" : "skillBased",
      tags: normalizeList(draft.tags).slice(0, 10),
      steps,
      estimatedTotalMinutes:
        parseInt(draft.estimatedTotalMinutes, 10) ||
        steps.reduce((total, step) => total + step.estimatedMinutes, 0),
      source: "ai",
      contentFormat: "markdown",
      contentMarkdown: stepsToMarkdown(steps),
      createdBy: userId,
      owner: userId,
      visibility: "private",
      isActive: true,
    });

    const roadmap = await UserRoadmap.create({
      user: userId,
      template: template._id,
      status: "assigned",
    });

    const progressRecords = createStepProgressRecords(userId, roadmap, template);

    if (progressRecords.length) {
      await UserRoadmapStepProgress.insertMany(progressRecords);
    }

    await recordAiActivity(userId, "ai_roadmap_save", {
      templateId: template._id,
      roadmapId: roadmap._id,
      topicsCount: progressRecords.length,
    });

    const populatedRoadmap = await UserRoadmap.findById(roadmap._id)
      .populate("template", "title slug description targetLevel templateType source visibility")
      .select("-__v");

    return res.status(201).json({
      success: true,
      message: "AI roadmap saved successfully.",
      data: {
        template,
        roadmap: populatedRoadmap,
      },
    });
  } catch (error) {
    console.error("Save AI roadmap error:", error);
    return res.status(error.status || 500).json({
      success: false,
      message:
        error.status === 402
          ? error.message
          : "Failed to save AI roadmap.",
      error: error.message,
    });
  }
};

export const explainAiRoadmapTopic = async (req, res) => {
  const userId = req.user._id;
  const { roadmapTitle, roadmapGoal, stepTitle, stepDescription } = req.body;

  try {
    ensureAiSubscriber(req.user);

    const { json, model, provider } = await callAiJson({
      maxTokens: 1400,
      system:
        "You explain software learning topics clearly for a student. Return only valid JSON with concise, practical guidance.",
      user: JSON.stringify({
        task: "Explain this roadmap topic.",
        roadmapTitle,
        roadmapGoal,
        topic: {
          title: stepTitle,
          description: stepDescription,
        },
        responseShape: {
          summary: "2-4 sentence explanation",
          keyPoints: ["3 to 5 short bullets"],
          practice: ["2 to 4 practical exercises"],
          commonMistakes: ["2 to 4 short warnings"],
        },
      }),
    });

    await recordAiActivity(userId, "ai_topic_explain", {
      roadmapTitle: String(roadmapTitle || "").slice(0, 120),
      stepTitle: String(stepTitle || "").slice(0, 120),
    });

    return res.status(200).json({
      success: true,
      message: "AI topic explanation generated successfully.",
      data: {
        model,
        provider,
        generatedAt: new Date().toISOString(),
        explanation: {
          summary: String(json.summary || "").trim().slice(0, 1200),
          keyPoints: Array.isArray(json.keyPoints)
            ? json.keyPoints.map((item) => String(item).trim()).filter(Boolean).slice(0, 5)
            : [],
          practice: Array.isArray(json.practice)
            ? json.practice.map((item) => String(item).trim()).filter(Boolean).slice(0, 4)
            : [],
          commonMistakes: Array.isArray(json.commonMistakes)
            ? json.commonMistakes.map((item) => String(item).trim()).filter(Boolean).slice(0, 4)
            : [],
        },
      },
    });
  } catch (error) {
    console.error("AI topic explanation error:", {
      status: error.status || 500,
      message: sanitizeAiProviderMessage(error.message),
    });
    return res.status(error.status || 500).json({
      success: false,
      message:
        error.status === 402
          ? error.message
          : "Failed to explain this topic.",
      error: sanitizeAiProviderMessage(error.message),
    });
  }
};

export default {
  getAiRecommendations,
  generateAiRoadmapDraft,
  getAiFeatureAccess,
  generateUserAiRoadmapDraft,
  saveUserAiRoadmap,
  explainAiRoadmapTopic,
};
