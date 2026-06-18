import Course from "../../models/course/courseModel.js";
import RoadmapTemplate from "../../models/roadmap/roadmapTemplateModel.js";
import UserActivity from "../../models/user/userActivityModel.js";
import UserCourseProgress from "../../models/user/userCourseProgressModel.js";
import UserPreference from "../../models/user/userPreferenceModel.js";
import UserRoadmap from "../../models/user/userRoadmapModel.js";
import UserRoadmapStepProgress from "../../models/user/userRoadmapStepProgressModel.js";
import { AI_RECOMMENDATIONS_CACHE_TTL_MS, aiCache } from "./cache.js";

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

export const parseRecommendationLimit = (value) =>
  clamp(parseInt(value, 10) || 6, 1, 12);

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

export const generateRecommendations = async (userId, requestedLimit) => {
  const limit = parseRecommendationLimit(requestedLimit);
  const cacheKey = `ai-recommendations:${toId(userId)}:${limit}`;
  const cached = aiCache.get(cacheKey);
  if (cached) return cached;

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

  const payload = {
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
  };

  aiCache.set(cacheKey, payload, AI_RECOMMENDATIONS_CACHE_TTL_MS);
  return payload;
};
