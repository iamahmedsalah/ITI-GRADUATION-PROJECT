const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const normalizeText = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff]+/gi, " ")
    .trim();

const unique = (values = []) => [...new Set(values.filter(Boolean))];

const slugify = (value = "") =>
  normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "ai-roadmap";

export const stepsToMarkdown = (steps) =>
  steps
    .map((step) => {
      const resources = (step.resources || [])
        .map((resource) => `- [${resource.title}](${resource.url})`)
        .join("\n");

      return `## ${step.title}\n${step.description}\n\n${resources}`;
    })
    .join("\n\n");

export const sanitizeAiResource = (resource = {}) => {
  const title = String(resource.title || "").trim().slice(0, 120);
  const url = String(resource.url || "").trim();

  if (!title || !/^https?:\/\/\S+$/i.test(url)) {
    return null;
  }

  return { title, url };
};

export const sanitizeAiSteps = (steps = []) => {
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
