export const escapeRegex = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const normalizeText = (value = "") =>
  String(value).trim().replace(/\s+/g, " ");

export const slugify = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);

export const slugifyStepKey = (value = "") => slugify(value).slice(0, 50);
