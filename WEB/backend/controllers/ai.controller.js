import { generateRecommendations } from "../services/ai/recommendations.js";
import {
  createAiRoadmapDraft,
  generateUserAiRoadmapDraftForUser,
  saveUserAiRoadmapForUser,
} from "../services/ai/roadmap-draft.js";
import {
  getCachedAiAccessPayload,
  buildAiAccessPayload,
} from "../services/ai/usage.js";
import { explainRoadmapTopicForUser } from "../services/ai/topic-explain.js";
import {
  listConversations as listAiChatConversationsService,
  createConversation as createAiChatConversationService,
  getMessages as getAiChatMessagesService,
  sendMessage as sendAiChatMessageService,
  updateConversation as updateAiChatConversationService,
  deleteConversation as deleteAiChatConversationService,
} from "../services/ai/chat.js";
import { sanitizeAiProviderMessage } from "../services/ai/provider.js";

export const getAiRecommendations = async (req, res, next) => {
  try {
    const data = await generateRecommendations(req.user._id, req.query.limit);
    return res.status(200).json(data);
  } catch (error) {
    return next(error);
  }
};

export const getAiFeatureAccess = async (req, res, next) => {
  try {
    const access = await getCachedAiAccessPayload(req.user);
    return res.status(200).json({
      success: true,
      message: "AI feature access retrieved successfully.",
      data: access,
    });
  } catch (error) {
    return next(error);
  }
};

export const generateAiRoadmapDraft = async (req, res, next) => {
  const {
    goal,
    targetRole = "student",
    targetLevel = "beginner",
    templateType = "roleBased",
    durationWeeks = 8,
    weeklyStudyHours = 6,
  } = req.body;

  try {
    const draftPayload = await createAiRoadmapDraft({
      goal,
      targetRole,
      targetLevel,
      templateType,
      durationWeeks,
      weeklyStudyHours,
    });

    return res.status(200).json({
      success: true,
      message: "AI roadmap draft generated successfully.",
      data: draftPayload,
    });
  } catch (error) {
    if (error.status) {
      error.message = sanitizeAiProviderMessage(error.message);
      return next(error);
    }
    const sanitizedError = new Error(sanitizeAiProviderMessage(error.message));
    sanitizedError.status = 500;
    return next(sanitizedError);
  }
};

export const generateUserAiRoadmapDraft = async (req, res, next) => {
  const {
    prompt,
    targetLevel = "beginner",
    durationWeeks = 8,
    weeklyStudyHours = 6,
  } = req.body;

  try {
    const payload = await generateUserAiRoadmapDraftForUser({
      user: req.user,
      prompt,
      targetLevel,
      durationWeeks,
      weeklyStudyHours,
    });

    return res.status(200).json({
      success: true,
      message: "AI roadmap generated successfully.",
      data: payload,
    });
  } catch (error) {
    if (error.status === 402) {
      const access = error.access || (await buildAiAccessPayload(req.user));
      return res.status(402).json({
        success: false,
        message: error.message,
        data: access,
      });
    }

    if (error.status) {
      error.message = sanitizeAiProviderMessage(error.message);
      return next(error);
    }
    const sanitizedError = new Error(sanitizeAiProviderMessage(error.message));
    sanitizedError.status = 500;
    return next(sanitizedError);
  }
};

export const saveUserAiRoadmap = async (req, res, next) => {
  const draft = req.body?.draft || {};

  try {
    const payload = await saveUserAiRoadmapForUser({
      user: req.user,
      draft,
    });

    return res.status(201).json({
      success: true,
      message: "AI roadmap saved successfully.",
      data: payload,
    });
  } catch (error) {
    if (error.status === 402) {
      return res.status(402).json({
        success: false,
        message: error.message,
        error: error.details || error.message,
      });
    }
    return next(error);
  }
};

export const explainAiRoadmapTopic = async (req, res, next) => {
  const { roadmapTitle, roadmapGoal, stepTitle, stepDescription } = req.body;

  try {
    const payload = await explainRoadmapTopicForUser({
      user: req.user,
      roadmapTitle,
      roadmapGoal,
      stepTitle,
      stepDescription,
    });

    return res.status(200).json({
      success: true,
      message: "AI topic explanation generated successfully.",
      data: payload,
    });
  } catch (error) {
    if (error.status === 402) {
      return res.status(402).json({
        success: false,
        message: error.message,
        error: sanitizeAiProviderMessage(error.message),
      });
    }

    if (error.status) {
      error.message = sanitizeAiProviderMessage(error.message);
      return next(error);
    }
    const sanitizedError = new Error(sanitizeAiProviderMessage(error.message));
    sanitizedError.status = 500;
    return next(sanitizedError);
  }
};

export const listAiChatConversations = async (req, res, next) => {
  try {
    const payload = await listAiChatConversationsService(req.user._id);

    return res.status(200).json({
      success: true,
      message: "AI chat conversations retrieved successfully.",
      data: {
        conversations: payload.conversations,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const createAiChatConversation = async (req, res, next) => {
  const { title, context, message } = req.body;

  try {
    const payload = await createAiChatConversationService({
      user: req.user,
      title,
      context,
      message,
    });

    return res.status(201).json({
      success: true,
      message: message
        ? "AI chat response generated successfully."
        : "AI chat conversation created successfully.",
      data: payload,
    });
  } catch (error) {
    if (error.status === 402) {
      const access = await buildAiAccessPayload(req.user);
      return res.status(402).json({
        success: false,
        message: error.message,
        data: access,
      });
    }

    if (error.status) {
      error.message = sanitizeAiProviderMessage(error.message);
      return next(error);
    }
    const sanitizedError = new Error(sanitizeAiProviderMessage(error.message));
    sanitizedError.status = 500;
    return next(sanitizedError);
  }
};

export const getAiChatMessages = async (req, res, next) => {
  try {
    const payload = await getAiChatMessagesService({
      conversationId: req.params.conversationId,
      userId: req.user._id,
    });

    return res.status(200).json({
      success: true,
      message: "AI chat messages retrieved successfully.",
      data: payload,
    });
  } catch (error) {
    return next(error);
  }
};

export const sendAiChatMessage = async (req, res, next) => {
  const { message, context } = req.body;

  try {
    const payload = await sendAiChatMessageService({
      user: req.user,
      conversationId: req.params.conversationId,
      message,
      context,
    });

    return res.status(201).json({
      success: true,
      message: "AI chat response generated successfully.",
      data: payload,
    });
  } catch (error) {
    if (error.status === 402) {
      const access = await buildAiAccessPayload(req.user);
      return res.status(402).json({
        success: false,
        message: error.message,
        data: access,
      });
    }

    if (error.status) {
      error.message = sanitizeAiProviderMessage(error.message);
      return next(error);
    }
    const sanitizedError = new Error(sanitizeAiProviderMessage(error.message));
    sanitizedError.status = 500;
    return next(sanitizedError);
  }
};

export const updateAiChatConversation = async (req, res, next) => {
  try {
    const payload = await updateAiChatConversationService({
      conversationId: req.params.conversationId,
      userId: req.user._id,
      title: req.body.title,
    });

    return res.status(200).json({
      success: true,
      message: "AI chat conversation updated successfully.",
      data: payload,
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteAiChatConversation = async (req, res, next) => {
  try {
    const payload = await deleteAiChatConversationService({
      conversationId: req.params.conversationId,
      userId: req.user._id,
    });

    return res.status(200).json({
      success: true,
      message: "AI chat conversation deleted successfully.",
      data: payload,
    });
  } catch (error) {
    return next(error);
  }
};
