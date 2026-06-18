import crypto from "crypto";
import mongoose from "mongoose";
import Course from "../models/course/courseModel.js";
import RoadmapTemplate from "../models/roadmap/roadmapTemplateModel.js";
import UserActivity from "../models/user/userActivityModel.js";
import UserAiConversation from "../models/user/userAiConversationModel.js";
import UserAiMessage from "../models/user/userAiMessageModel.js";
import UserCourseProgress from "../models/user/userCourseProgressModel.js";
import UserPreference from "../models/user/userPreferenceModel.js";
import UserRoadmap from "../models/user/userRoadmapModel.js";
import UserRoadmapStepProgress from "../models/user/userRoadmapStepProgressModel.js";
import {
  AI_CHAT_CATALOG_CACHE_TTL_MS,
  AI_TOPIC_EXPLANATION_CACHE_TTL_MS,
  aiCache,
  createTtlCache,
} from "./ai/cache.js";
import {
  callAiJson,
  callAiText,
  sanitizeAiProviderMessage,
} from "./ai/provider.js";
import {
  sanitizeAiSteps,
  stepsToMarkdown,
} from "./ai/parsers/roadmap-draft.parser.js";
import { AI_CHAT_SYSTEM_PROMPT } from "./ai/prompts/chat-system.prompt.js";
import { buildRoadmapDraftPrompt } from "./ai/prompts/roadmap-draft.prompt.js";
import { buildTopicExplainPrompt } from "./ai/prompts/topic-explain.prompt.js";
import { generateRecommendations } from "./ai/recommendations.js";
import {
  createConversation as createAiChatConversationService,
  deleteConversation as deleteAiChatConversationService,
  getMessages as getAiChatMessagesService,
  listConversations as listAiChatConversationsService,
  sendMessage as sendAiChatMessageService,
  updateConversation as updateAiChatConversationService,
} from "./ai/chat.js";
import {
  buildAiAccessPayload,
  ensureAiSubscriber,
  getAiSubscription,
  getCachedAiAccessPayload,
  invalidateAiUserCache,
  recordAiActivity,
  releaseAiRoadmapDraftUsage,
  releaseAiUsage,
  reserveAiChatUsage,
  reserveAiRoadmapDraftUsage,
  updateAiChatTokenUsage,
} from "./ai/usage.js";

const LEVEL_RANK = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

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

const stableJson = (value) => {
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
};

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
  try {
    const payload = await generateRecommendations(req.user._id, req.query.limit);
    return res.status(200).json(payload);
  } catch (error) {
    console.error("AI recommendations error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate AI recommendations.",
      error: error.message,
    });
  }
};

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
    const access = await getCachedAiAccessPayload(req.user);

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
    const cacheKey = `ai-topic-explain:${stableJson({
      roadmapTitle: normalizeText(roadmapTitle),
      roadmapGoal: normalizeText(roadmapGoal),
      stepTitle: normalizeText(stepTitle),
      stepDescription: normalizeText(stepDescription),
    })}`;
    const cached = aiCache.get(cacheKey);
    if (cached) {
      return res.status(200).json(cached);
    }

    const prompt = buildTopicExplainPrompt({
      roadmapTitle,
      roadmapGoal,
      stepTitle,
      stepDescription,
    });
    const { json, model, provider } = await callAiJson({
      maxTokens: 1400,
      system: prompt.system,
      user: prompt.user,
    });

    await recordAiActivity(userId, "ai_topic_explain", {
      roadmapTitle: String(roadmapTitle || "").slice(0, 120),
      stepTitle: String(stepTitle || "").slice(0, 120),
    });

    const payload = {
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
    };

    aiCache.set(cacheKey, payload, AI_TOPIC_EXPLANATION_CACHE_TTL_MS);
    return res.status(200).json(payload);
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

const serializeConversation = (conversation) => ({
  _id: toId(conversation._id),
  title: conversation.title,
  context: conversation.context || {},
  lastMessageAt: conversation.lastMessageAt,
  createdAt: conversation.createdAt,
  updatedAt: conversation.updatedAt,
});

const serializeMessage = (message) => ({
  _id: toId(message._id),
  conversation: toId(message.conversation),
  role: message.role,
  content: message.content,
  provider: message.provider,
  model: message.model,
  promptTokens: message.promptTokens || 0,
  completionTokens: message.completionTokens || 0,
  totalTokens: message.totalTokens || 0,
  links: Array.isArray(message.links) ? message.links : [],
  createdAt: message.createdAt,
  updatedAt: message.updatedAt,
});

const ensureOwnedAiConversation = async (conversationId, userId) => {
  if (!mongoose.isValidObjectId(conversationId)) {
    const error = new Error("AI conversation was not found.");
    error.status = 404;
    throw error;
  }

  const conversation = await UserAiConversation.findOne({
    _id: conversationId,
    user: userId,
    deletedAt: null,
  });

  if (!conversation) {
    const error = new Error("AI conversation was not found.");
    error.status = 404;
    throw error;
  }

  return conversation;
};

const buildChatTitle = (content = "") => {
  const normalized = String(content || "")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) return "New chat";

  return normalized.length > 30 ? `${normalized.slice(0, 27)}...` : normalized;
};

const buildChatContextInstruction = (context = {}) => {
  const contextParts = [
    context.page ? `Page: ${context.page}` : "",
    context.courseTitle ? `Course: ${context.courseTitle}` : "",
    context.roadmapTitle ? `Roadmap: ${context.roadmapTitle}` : "",
  ].filter(Boolean);

  return contextParts.length
    ? `Current ILMA context for this chat: ${contextParts.join("; ")}.`
    : "";
};

const CHAT_SEARCH_STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "about",
  "roadmap",
  "roadmaps",
  "course",
  "courses",
  "learn",
  "learning",
  "اريد",
  "عايز",
  "كورس",
  "كورسات",
  "خريطة",
  "تعلم",
]);

const escapeRegex = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getChatSearchTerms = (message = "") =>
  unique(tokenize(message))
    .filter((term) => term.length > 2 && !CHAT_SEARCH_STOPWORDS.has(term))
    .slice(0, 6);

const messageRequestsLearningCatalog = (message = "") => {
  const normalized = normalizeText(message);
  return [
    "roadmap",
    "roadmaps",
    "course",
    "courses",
    "path",
    "recommend",
    "خريطة",
    "خرائط",
    "كورس",
    "كورسات",
    "دورة",
    "دورات",
    "رشح",
  ].some((term) => normalized.includes(term));
};

const buildLearningSearchQuery = (terms, fields) => {
  if (!terms.length) return null;

  const regexes = terms.map((term) => new RegExp(escapeRegex(term), "i"));
  return {
    $or: fields.flatMap((field) => regexes.map((regex) => ({ [field]: regex }))),
  };
};

const serializeLearningLink = (type, item) => ({
  type,
  title: item.title,
  description: String(item.shortDescription || item.description || item.goal || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 240),
  path: `/${type === "roadmap" ? "roadmaps" : "courses"}/${item.slug}`,
  slug: item.slug,
  level: item.targetLevel || item.level,
  category: item.category || item.templateType || item.targetRole,
});

const searchAiLearningCatalog = async (message = "") => {
  const terms = getChatSearchTerms(message);
  const wantsCatalog = messageRequestsLearningCatalog(message);
  if (!terms.length && !wantsCatalog) return [];

  const cacheKey = `ai-chat-catalog:${normalizeText(terms.join(" ") || message).slice(0, 200)}`;
  const cached = aiCache.get(cacheKey);
  if (cached) return cached;

  const roadmapTextQuery = buildLearningSearchQuery(terms, [
    "title",
    "goal",
    "description",
    "tags",
    "targetRole",
    "targetLevel",
    "steps.title",
    "steps.description",
  ]);
  const courseTextQuery = buildLearningSearchQuery(terms, [
    "title",
    "description",
    "shortDescription",
    "tags",
    "category",
    "level",
    "sections.title",
    "sections.lessons.title",
  ]);

  let [roadmaps, courses] = await Promise.all([
    RoadmapTemplate.find({
      isActive: true,
      visibility: "public",
      ...(roadmapTextQuery || {}),
    })
      .select("title slug goal description targetLevel targetRole templateType tags estimatedTotalMinutes")
      .sort({ createdAt: -1 })
      .limit(3)
      .lean(),
    Course.find({
      deletedAt: null,
      isPublished: true,
      ...(courseTextQuery || {}),
    })
      .select("title slug shortDescription description level category tags durationMinutes isFeatured createdAt")
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(3)
      .lean(),
  ]);

  if (wantsCatalog && roadmaps.length + courses.length === 0) {
    [roadmaps, courses] = await Promise.all([
      RoadmapTemplate.find({
        isActive: true,
        visibility: "public",
      })
        .select("title slug goal description targetLevel targetRole templateType tags estimatedTotalMinutes")
        .sort({ createdAt: -1 })
        .limit(3)
        .lean(),
      Course.find({
        deletedAt: null,
        isPublished: true,
      })
        .select("title slug shortDescription description level category tags durationMinutes isFeatured createdAt")
        .sort({ isFeatured: -1, createdAt: -1 })
        .limit(3)
        .lean(),
    ]);
  }

  const links = [
    ...roadmaps.map((roadmap) => serializeLearningLink("roadmap", roadmap)),
    ...courses.map((course) => serializeLearningLink("course", course)),
  ];

  return aiCache.set(cacheKey, links, AI_CHAT_CATALOG_CACHE_TTL_MS);
};

const buildLearningContextInstruction = (links = []) => {
  if (!links.length) return "";

  const rows = links
    .map((link) =>
      [
        `- ${link.type}: ${link.title}`,
        link.path ? `markdown=[${link.title}](${link.path})` : "",
        link.path ? `path=${link.path}` : "",
        link.level ? `level=${link.level}` : "",
        link.category ? `category=${link.category}` : "",
        link.description ? `description=${link.description}` : "",
      ]
        .filter(Boolean)
        .join("; "),
    )
    .join("\n");

  return [
    "Relevant ILMA catalog links found for this message. Mention them only when useful, and do not invent links.",
    rows,
  ].join("\n");
};

export const listAiChatConversations = async (req, res) => {
  try {
    const payload = await listAiChatConversationsService(req.user._id);

    return res.status(200).json({
      success: true,
      message: "AI chat conversations retrieved successfully.",
      data: {
        conversations: payload.conversations,
      },
    });
  } catch (error) {
    console.error("AI chat conversation list error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load AI chat conversations.",
      error: error.message,
    });
  }
};

export const createAiChatConversation = async (req, res) => {
  const { title, context, message } = req.body;

  try {
    const payload = await createAiChatConversationService({
      user: req.user,
      title,
      context,
      message,
    });

    return res.status(201).json({
      success: true,
      message: message
        ? "AI chat response generated successfully."
        : "AI chat conversation created successfully.",
      data: payload,
    });
  } catch (error) {
    if (error.status === 402) {
      const access = await buildAiAccessPayload(req.user);
      return res.status(402).json({
        success: false,
        message: error.message,
        data: access,
      });
    }

    console.error("AI chat conversation create error:", {
      status: error.status || 500,
      message: sanitizeAiProviderMessage(error.message),
    });
    return res.status(error.status || 500).json({
      success: false,
      message:
        error.status === 402
          ? error.message
          : "Failed to create AI chat conversation.",
      error: sanitizeAiProviderMessage(error.message),
    });
  }
};

export const getAiChatMessages = async (req, res) => {
  try {
    const payload = await getAiChatMessagesService({
      conversationId: req.params.conversationId,
      userId: req.user._id,
    });

    return res.status(200).json({
      success: true,
      message: "AI chat messages retrieved successfully.",
      data: payload,
    });
  } catch (error) {
    console.error("AI chat messages error:", error);
    return res.status(error.status || 500).json({
      success: false,
      message:
        error.status === 404
          ? error.message
          : "Failed to load AI chat messages.",
      error: error.message,
    });
  }
};

export const sendAiChatMessage = async (req, res) => {
  const { message, context } = req.body;

  try {
    const payload = await sendAiChatMessageService({
      user: req.user,
      conversationId: req.params.conversationId,
      message,
      context,
    });

    return res.status(201).json({
      success: true,
      message: "AI chat response generated successfully.",
      data: payload,
    });
  } catch (error) {
    if (error.status === 402) {
      const access = await buildAiAccessPayload(req.user);
      return res.status(402).json({
        success: false,
        message: error.message,
        data: access,
      });
    }

    console.error("AI chat send error:", {
      status: error.status || 500,
      message: sanitizeAiProviderMessage(error.message),
    });
    return res.status(error.status || 500).json({
      success: false,
      message:
        error.status === 402 || error.status === 404
          ? error.message
          : "Failed to generate AI chat response.",
      error: sanitizeAiProviderMessage(error.message),
    });
  }
};

export const updateAiChatConversation = async (req, res) => {
  try {
    const payload = await updateAiChatConversationService({
      conversationId: req.params.conversationId,
      userId: req.user._id,
      title: req.body.title,
    });

    return res.status(200).json({
      success: true,
      message: "AI chat conversation updated successfully.",
      data: payload,
    });
  } catch (error) {
    console.error("AI chat conversation update error:", error);
    return res.status(error.status || 500).json({
      success: false,
      message:
        error.status === 404
          ? error.message
          : "Failed to update AI chat conversation.",
      error: error.message,
    });
  }
};

export const deleteAiChatConversation = async (req, res) => {
  try {
    const payload = await deleteAiChatConversationService({
      conversationId: req.params.conversationId,
      userId: req.user._id,
    });

    return res.status(200).json({
      success: true,
      message: "AI chat conversation deleted successfully.",
      data: payload,
    });
  } catch (error) {
    console.error("AI chat conversation delete error:", error);
    return res.status(error.status || 500).json({
      success: false,
      message:
        error.status === 404
          ? error.message
          : "Failed to delete AI chat conversation.",
      error: error.message,
    });
  }
};

export const __aiTestHooks = {
  createTtlCache,
  stableJson,
};

export default {
  getAiRecommendations,
  generateAiRoadmapDraft,
  getAiFeatureAccess,
  generateUserAiRoadmapDraft,
  saveUserAiRoadmap,
  explainAiRoadmapTopic,
  listAiChatConversations,
  createAiChatConversation,
  getAiChatMessages,
  sendAiChatMessage,
  updateAiChatConversation,
  deleteAiChatConversation,
};
