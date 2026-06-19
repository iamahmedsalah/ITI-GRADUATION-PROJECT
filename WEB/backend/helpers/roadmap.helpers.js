// backend/helpers/roadmap.helpers.js

export const slugifyStepKey = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "step";

export const ensureUniqueStepKeys = (steps = []) => {
  const used = new Map();

  return steps.map((step, index) => {
    const base = slugifyStepKey(
      step.stepKey || step.title || `step-${index + 1}`,
    );
    const count = used.get(base) || 0;
    used.set(base, count + 1);

    return {
      ...step,
      stepKey: count === 0 ? base : `${base}-${count + 1}`,
      order: typeof step.order === "number" ? step.order : index,
      required: step.required !== false,
      estimatedMinutes: Number(step.estimatedMinutes) || 0,
      dependsOn: Array.isArray(step.dependsOn) ? step.dependsOn : [],
    };
  });
};

export const parseRoadmapMarkdownToSteps = (markdown = "") => {
  const lines = String(markdown || "").split(/\r?\n/);
  const steps = [];
  let currentStep = null;

  const pushCurrentStep = () => {
    if (!currentStep) return;

    currentStep.description = currentStep.description.trim() || undefined;
    steps.push(currentStep);
    currentStep = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      if (currentStep) currentStep.description += "\n";
      continue;
    }

    const headingMatch = line.match(/^#{2,3}\s+(.+)$/);
    if (headingMatch) {
      pushCurrentStep();
      currentStep = {
        stepKey: slugifyStepKey(headingMatch[1]),
        title: headingMatch[1].trim(),
        description: "",
        resources: [],
        order: steps.length,
        required: true,
        estimatedMinutes: 0,
        dependsOn: [],
      };
      continue;
    }

    if (!currentStep) continue;

    const resourceMatch = line.match(
      /^[-*]\s+\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/i,
    );
    if (resourceMatch) {
      currentStep.resources.push({
        title: resourceMatch[1].trim(),
        url: resourceMatch[2].trim(),
      });
      continue;
    }

    currentStep.description += `${line}\n`;
  }

  pushCurrentStep();

  return ensureUniqueStepKeys(steps);
};

export const calculateEstimatedTotalMinutes = (steps = []) =>
  steps.reduce(
    (total, step) => total + (Number(step.estimatedMinutes) || 0),
    0,
  );

export const escapeRegex = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const createServiceError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

export const publicTemplateFilter = () => ({
  isActive: true,
  $or: [{ visibility: "public" }, { visibility: { $exists: false } }],
});
