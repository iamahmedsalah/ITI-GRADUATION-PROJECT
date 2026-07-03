import ProAccessRequest from "../models/user/proAccessRequestModel.js";
import User from "../models/user/userAccountModel.js";
import { toPublicUser } from "../helpers/auth.helpers.js";
import { invalidateAiUserCache } from "./ai/usage.js";
import { logAdminAction } from "./admin/admin-shared.js";

const PRO_TRIAL_DAYS = 7;

const getOneWeekFromNow = () => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + PRO_TRIAL_DAYS);
  return date;
};

const isActivePro = (user = {}) => {
  const plan = user.subscription?.plan || "free";
  const status = user.subscription?.status || "inactive";
  const currentPeriodEnd = user.subscription?.currentPeriodEnd;
  const hasActivePeriod = currentPeriodEnd
    ? new Date(currentPeriodEnd).getTime() > Date.now()
    : true;

  return plan === "pro" && ["active", "trialing"].includes(status) && hasActivePeriod;
};

export const createProAccessRequest = async (req, res, next) => {
  try {
    if (isActivePro(req.user)) {
      return res.status(400).json({
        success: false,
        message: "Your account already has active Pro access.",
      });
    }

    const existingPending = await ProAccessRequest.findOne({
      user: req.user._id,
      status: "pending",
    }).lean();

    if (existingPending) {
      return res.status(409).json({
        success: false,
        message: "You already have a pending Pro access request.",
        data: existingPending,
      });
    }

    const request = await ProAccessRequest.create({
      user: req.user._id,
      learningGoal: req.body.learningGoal,
      needReason: req.body.needReason,
      expectedDurationDays: req.body.expectedDurationDays,
      status: "pending",
    });

    return res.status(201).json({
      success: true,
      message: "Pro access request submitted successfully.",
      data: request,
    });
  } catch (error) {
    return next(error);
  }
};

export const getMyProAccessRequest = async (req, res, next) => {
  try {
    const request = await ProAccessRequest.findOne({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      message: request
        ? "Latest Pro access request retrieved successfully."
        : "No Pro access request found.",
      data: request,
    });
  } catch (error) {
    return next(error);
  }
};

export const getAdminProAccessRequests = async (req, res, next) => {
  const { status, page = 1, limit = 20 } = req.query;

  try {
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (parsedPage - 1) * parsedLimit;
    const query = {};

    if (status) query.status = status;

    const [requests, total] = await Promise.all([
      ProAccessRequest.find(query)
        .populate("user", "username email Fname Lname subscription")
        .populate("reviewedBy", "username email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .lean(),
      ProAccessRequest.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      message: requests.length
        ? "Pro access requests retrieved successfully."
        : "No Pro access requests found.",
      data: requests,
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        pages: Math.ceil(total / parsedLimit),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const reviewProAccessRequestByAdmin = async (req, res, next) => {
  const { requestId } = req.params;
  const { action, adminNote } = req.body;
  const adminId = req.user._id;

  try {
    const request = await ProAccessRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Pro access request not found.",
      });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "This Pro access request has already been reviewed.",
      });
    }

    const before = request.toObject();

    request.status = action === "approve" ? "approved" : "rejected";
    request.reviewedBy = adminId;
    request.reviewedAt = new Date();
    request.adminNote = adminNote;

    let user = null;

    if (action === "approve") {
      const accessStartsAt = new Date();
      const accessEndsAt = getOneWeekFromNow();
      request.accessStartsAt = accessStartsAt;
      request.accessEndsAt = accessEndsAt;

      user = await User.findByIdAndUpdate(
        request.user,
        {
          $set: {
            subscription: {
              plan: "pro",
              status: "trialing",
              currentPeriodEnd: accessEndsAt,
            },
          },
        },
        { new: true },
      );

      if (user) {
        invalidateAiUserCache(user._id);
      }
    }

    await request.save();

    await logAdminAction({
      req,
      adminId,
      action:
        action === "approve"
          ? "admin.proAccess.approve"
          : "admin.proAccess.reject",
      targetType: "proAccessRequest",
      targetId: request._id,
      metadata: {
        before: {
          status: before.status,
          user: before.user,
        },
        after: {
          status: request.status,
          accessEndsAt: request.accessEndsAt,
          adminNote: request.adminNote,
        },
      },
    });

    const populatedRequest = await ProAccessRequest.findById(request._id)
      .populate("user", "username email Fname Lname subscription")
      .populate("reviewedBy", "username email")
      .lean();

    return res.status(200).json({
      success: true,
      message:
        action === "approve"
          ? "Pro access approved for one week."
          : "Pro access request rejected.",
      data: {
        request: populatedRequest,
        user: user ? toPublicUser(user) : null,
      },
    });
  } catch (error) {
    return next(error);
  }
};
