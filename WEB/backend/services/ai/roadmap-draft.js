import crypto from "crypto";
import RoadmapTemplate from "../../models/roadmap/roadmapTemplateModel.js";
import UserRoadmap from "../../models/user/userRoadmapModel.js";
import UserRoadmapStepProgress from "../../models/user/userRoadmapStepProgressModel.js";
import { sanitizeAiProviderMessage, callAiJson } from "./provider.js";
import {
  sanitizeAiSteps,
  stepsToMarkdown,
} from "./parsers/roadmap-draft.parser.js";
import { buildRoadmapDraftPrompt } from "./prompts/roadmap-draft.prompt.js";
import {
  buildAiAccessPayload,
  ensureAiSubscriber,
  getAiSubscription,
  recordAiActivity,
  releaseAiRoadmapDraftUsage,
  reserveAiRoadmapDraftUsage,
} from "./usage.js";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const normalizeText = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff]+/gi, " ")
    .trim();

const normalizeList = (values = []) =>
  Array.isArray(values)
    ? values.map(normalizeText).filter(Boolean)
    : [];

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

const createBadRequest = (message, details = message) => {
  const error = new Error(message);
  error.status = 400;
  error.details = details;
  return error;
};

export const createAiRoadmapDraft = async ({
  goal,
  targetRole = "student",
  targetLevel = "beginner",
  templateType = "skillBased",
  durationWeeks = 8,
  weeklyStudyHours = 6,
}) => {
  const normalizedGoal = String(goal || "").trim();

  if (normalizedGoal.length < 10) {
    throw createBadRequest("Goal must be at least 10 characters.");
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

export const generateUserAiRoadmapDraftForUser = async ({
  user,
  prompt,
  targetLevel = "beginner",
  durationWeeks = 8,
  weeklyStudyHours = 6,
}) => {
  const userId = user._id;
  const subscription = getAiSubscription(user);
  let reservation = null;

  try {
    reservation = await reserveAiRoadmapDraftUsage(userId, subscription);
  } catch (error) {
    if (error.status === 402) {
      error.access = await buildAiAccessPayload(user);
    }
    throw error;
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
    throw error;
  }

  await recordAiActivity(userId, "ai_roadmap_draft", {
    prompt: String(prompt || "").slice(0, 300),
    title: draftPayload.draft.title,
  });

  const access = await buildAiAccessPayload(user);

  return {
    ...draftPayload,
    access,
  };
};

export const saveUserAiRoadmapForUser = async ({ user, draft = {} }) => {
  const userId = user._id;

  ensureAiSubscriber(user);

  const title = String(draft.title || "").trim().slice(0, 120);
  const goal = String(draft.goal || title).trim().slice(0, 300);
  let steps;

  try {
    steps = sanitizeAiSteps(draft.steps);
  } catch (error) {
    throw createBadRequest(
      "A saved AI roadmap includes invalid steps.",
      error.message,
    );
  }

  if (!title || !goal || steps.length < 4) {
    throw createBadRequest(
      "A saved AI roadmap must include a title, goal, and at least 4 steps.",
    );
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

  return {
    template,
    roadmap: populatedRoadmap,
  };
};

export const sanitizeAiRoadmapErrorMessage = (message) =>
  sanitizeAiProviderMessage(message);
