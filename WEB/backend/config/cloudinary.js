import crypto from "node:crypto";

const getCloudinaryConfig = () => ({
  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  apiKey: process.env.CLOUDINARY_API_KEY,
  apiSecret: process.env.CLOUDINARY_API_SECRET,
  courseFolder: process.env.CLOUDINARY_COURSE_FOLDER || "ilma/courses",
  avatarFolder: process.env.CLOUDINARY_AVATAR_FOLDER || "ilma/avatars",
  uploadTimeoutMs: Math.max(
    Number(process.env.CLOUDINARY_UPLOAD_TIMEOUT_MS) || 15000,
    1000,
  ),
});

const DATA_URI_IMAGE_REGEX =
  /^data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=\r\n]+$/;

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

export const isCloudinaryConfigured = () =>
  isNonEmptyString(getCloudinaryConfig().cloudName) &&
  isNonEmptyString(getCloudinaryConfig().apiKey) &&
  isNonEmptyString(getCloudinaryConfig().apiSecret);

const isHttpUrl = (value) => {
  if (!isNonEmptyString(value)) return false;

  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const isCloudinaryUrl = (value) =>
  isNonEmptyString(value) && value.includes("res.cloudinary.com/");

const isDataUriImage = (value) =>
  isNonEmptyString(value) && DATA_URI_IMAGE_REGEX.test(value.trim());

const makeError = (message, status = 500) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const sanitizePublicIdPart = (value, fallback = "image") =>
  String(value || fallback)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || fallback;

const getDataUriSizeBytes = (value) => {
  if (!isDataUriImage(value)) return 0;

  const base64 = String(value).split(",")[1] || "";
  const normalizedBase64 = base64.replace(/\s/g, "");

  const padding = normalizedBase64.endsWith("==")
    ? 2
    : normalizedBase64.endsWith("=")
      ? 1
      : 0;

  return Math.floor((normalizedBase64.length * 3) / 4) - padding;
};

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
  const config = getCloudinaryConfig();

  if (
    !isNonEmptyString(config.cloudName) ||
    !isNonEmptyString(config.apiKey) ||
    !isNonEmptyString(config.apiSecret)
  ) {
    throw makeError(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.",
      503,
    );
  }

  const timestamp = Math.floor(Date.now() / 1000);

  const paramsToSign = {
    folder,
    public_id: publicId,
    timestamp,
    overwrite: "true",
  };

  const signature = signCloudinaryParams(paramsToSign, config.apiSecret);

  const endpoint = `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`;

  const form = new FormData();
  form.append("file", fileValue);
  form.append("api_key", config.apiKey);
  form.append("timestamp", String(timestamp));
  form.append("signature", signature);
  form.append("folder", folder);
  form.append("public_id", publicId);
  form.append("overwrite", "true");

  const abortController = new AbortController();

  const timeoutId = setTimeout(() => {
    abortController.abort();
  }, config.uploadTimeoutMs);

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
        `Cloudinary upload timed out after ${config.uploadTimeoutMs}ms.`,
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
  const baseSlug = sanitizePublicIdPart(slug || courseId || "course", "course");
  const baseFolder = getCloudinaryConfig().courseFolder;

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
      (isHttpUrl(normalizedValue) && !isCloudinaryUrl(normalizedValue));

    if (!canUpload) {
      continue;
    }

    const publicId = sanitizePublicIdPart(`${baseSlug}-${field}`, field);

    payload[field] = await uploadImageToCloudinary(normalizedValue, {
      folder: baseFolder,
      publicId,
    });
  }

  return payload;
};

export const resolveUserAvatarUrl = async (
  avatarImage,
  { userId, username } = {},
) => {
  const normalizedValue =
    typeof avatarImage === "string" ? avatarImage.trim() : avatarImage;

  if (!normalizedValue) {
    return null;
  }

  if (isCloudinaryUrl(normalizedValue)) {
    return normalizedValue;
  }

  if (!isDataUriImage(normalizedValue)) {
    throw makeError("Avatar must be a valid base64 image.", 400);
  }

  const maxAvatarSizeBytes = 3 * 1024 * 1024;

  if (getDataUriSizeBytes(normalizedValue) > maxAvatarSizeBytes) {
    throw makeError("Avatar image must be 3MB or smaller.", 400);
  }

  const publicId = sanitizePublicIdPart(
    `${username || "user"}-${userId || "avatar"}`,
    "avatar",
  );

  return uploadImageToCloudinary(normalizedValue, {
    folder: getCloudinaryConfig().avatarFolder,
    publicId,
  });
};
