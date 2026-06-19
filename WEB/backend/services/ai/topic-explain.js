import { AI_TOPIC_EXPLANATION_CACHE_TTL_MS, aiCache } from "./cache.js";
import { callAiJson } from "./provider.js";
import { buildTopicExplainPrompt } from "./prompts/topic-explain.prompt.js";
import { ensureAiSubscriber, recordAiActivity } from "./usage.js";

const normalizeText = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff]+/gi, " ")
    .trim();

export const stableJson = (value) => {
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

const normalizeExplanationList = (values = [], limit) =>
  Array.isArray(values)
    ? values.map((item) => String(item).trim()).filter(Boolean).slice(0, limit)
    : [];

export const explainRoadmapTopicForUser = async ({
  user,
  roadmapTitle,
  roadmapGoal,
  stepTitle,
  stepDescription,
}) => {
  ensureAiSubscriber(user);

  const cacheKey = `ai-topic-explain:${stableJson({
    roadmapTitle: normalizeText(roadmapTitle),
    roadmapGoal: normalizeText(roadmapGoal),
    stepTitle: normalizeText(stepTitle),
    stepDescription: normalizeText(stepDescription),
  })}`;
  const cached = aiCache.get(cacheKey);

  if (cached) {
    return cached;
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

  await recordAiActivity(user._id, "ai_topic_explain", {
    roadmapTitle: String(roadmapTitle || "").slice(0, 120),
    stepTitle: String(stepTitle || "").slice(0, 120),
  });

  const payload = {
    model,
    provider,
    generatedAt: new Date().toISOString(),
    explanation: {
      summary: String(json.summary || "").trim().slice(0, 1200),
      keyPoints: normalizeExplanationList(json.keyPoints, 5),
      practice: normalizeExplanationList(json.practice, 4),
      commonMistakes: normalizeExplanationList(json.commonMistakes, 4),
    },
  };

  return aiCache.set(cacheKey, payload, AI_TOPIC_EXPLANATION_CACHE_TTL_MS);
};
