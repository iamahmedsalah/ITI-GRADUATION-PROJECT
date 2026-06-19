import AdminActionLog from "../../models/admin/adminActionLogModel.js";

export const parseBooleanQuery = (value) => {
  if (value === undefined) return undefined;
  return value === "true";
};

const getRequestIp = (req) =>
  req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
  req.socket?.remoteAddress ||
  req.ip ||
  "unknown";

export const logAdminAction = async ({
  req,
  adminId,
  action,
  targetType,
  targetId,
  metadata = {},
}) => {
  try {
    await AdminActionLog.create({
      admin: adminId,
      action,
      targetType,
      targetId,
      metadata,
      ipAddress: getRequestIp(req),
      userAgent: req.headers["user-agent"] || "unknown",
    });
  } catch (error) {
    console.error("Admin action log error:", error);
  }
};

export const getRoadmapDisplaySource = (template = {}) => {
  if (template.owner && template.source === "ai") return "std-ai";
  return template.source || "manual";
};
