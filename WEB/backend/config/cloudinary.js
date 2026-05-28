import crypto from "node:crypto";

const {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  CLOUDINARY_UPLOAD_FOLDER,
} = process.env;

const DEFAULT_FOLDER = CLOUDINARY_UPLOAD_FOLDER || "ilma/courses";
const CLOUDINARY_UPLOAD_TIMEOUT_MS = Math.max(
  Number(process.env.CLOUDINARY_UPLOAD_TIMEOUT_MS) || 15000,
  1000,
);

const DATA_URI_IMAGE_REGEX =
  /^data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=\r\n]+$/;

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

export const isCloudinaryConfigured = () =>
  isNonEmptyString(CLOUDINARY_CLOUD_NAME) &&
  isNonEmptyString(CLOUDINARY_API_KEY) &&
  isNonEmptyString(CLOUDINARY_API_SECRET);

const isHttpUrl = (value) => {
  if (!isNonEmptyString(value)) return false;

  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const isDataUriImage = (value) =>
  isNonEmptyString(value) && DATA_URI_IMAGE_REGEX.test(value.trim());

const makeError = (message, status = 500) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const sanitizePublicIdPart = (value, fallback = "course") =>
  String(value || fallback)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || fallback;

const signCloudinaryParams = (params, apiSecret) => {
  const paramsToSign = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([key, value]) => [key, String(value)])
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return crypto
    .createHash("sha1")
    .update(`${paramsToSign}${apiSecret}`)
    .digest("hex");
};

const uploadImageToCloudinary = async (fileValue, { folder, publicId }) => {
  if (!isCloudinaryConfigured()) {
    throw makeError(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.",
      500,
    );
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign = {
    folder,
    public_id: publicId,
    timestamp,
    overwrite: "true",
  };

  const signature = signCloudinaryParams(paramsToSign, CLOUDINARY_API_SECRET);
  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

  const form = new FormData();
  form.append("file", fileValue);
  form.append("api_key", CLOUDINARY_API_KEY);
  form.append("timestamp", String(timestamp));
  form.append("signature", signature);
  form.append("folder", folder);
  form.append("public_id", publicId);
  form.append("overwrite", "true");

  const abortController = new AbortController();
  const timeoutId = setTimeout(() => {
    abortController.abort();
  }, CLOUDINARY_UPLOAD_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      body: form,
      signal: abortController.signal,
    });
  } catch (error) {
    if (error.name === "AbortError") {
      throw makeError(
        `Cloudinary upload timed out after ${CLOUDINARY_UPLOAD_TIMEOUT_MS}ms.`,
        504,
      );
    }
    throw makeError(`Cloudinary upload request failed: ${error.message}`, 502);
  } finally {
    clearTimeout(timeoutId);
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || !payload?.secure_url) {
    const reason =
      payload?.error?.message ||
      payload?.message ||
      `Cloudinary upload failed with status ${response.status}.`;
    throw makeError(reason, response.status || 500);
  }

  return payload.secure_url;
};

export const resolveCourseImageUrls = async (
  payload,
  { slug, courseId } = {},
) => {
  if (!payload || typeof payload !== "object") {
    return payload;
  }

  const fields = ["thumbnailUrl", "bannerUrl"];
  const baseSlug = sanitizePublicIdPart(slug || courseId || "course");
  const baseFolder = DEFAULT_FOLDER;

  for (const field of fields) {
    if (payload[field] === undefined) continue;

    const rawValue = payload[field];
    const normalizedValue =
      typeof rawValue === "string" ? rawValue.trim() : rawValue;

    if (!normalizedValue) {
      payload[field] = null;
      continue;
    }

    const canUpload =
      isDataUriImage(normalizedValue) ||
      (isHttpUrl(normalizedValue) &&
        !String(normalizedValue).includes("res.cloudinary.com/"));

    if (!canUpload) {
      continue;
    }

    const publicId = `${baseSlug}-${field}`;
    payload[field] = await uploadImageToCloudinary(normalizedValue, {
      folder: baseFolder,
      publicId,
    });
  }

  return payload;
};
