import { createTtlCache } from "./ai/cache.js";
import { sanitizeAiProviderMessage } from "./ai/provider.js";
import { generateRecommendations } from "./ai/recommendations.js";
import {
  createConversation as createAiChatConversationService,
  deleteConversation as deleteAiChatConversationService,
  getMessages as getAiChatMessagesService,
  listConversations as listAiChatConversationsService,
  sendMessage as sendAiChatMessageService,
  updateConversation as updateAiChatConversationService,
} from "./ai/chat.js";
import {
  createAiRoadmapDraft,
  generateUserAiRoadmapDraftForUser,
  saveUserAiRoadmapForUser,
} from "./ai/roadmap-draft.js";
import {
  explainRoadmapTopicForUser,
  stableJson,
} from "./ai/topic-explain.js";
import {
  buildAiAccessPayload,
  getCachedAiAccessPayload,
} from "./ai/usage.js";

export const getAiRecommendations = async (req, res) => {
  try {
    const payload = await generateRecommendations(req.user._id, req.query.limit);
    return res.status(200).json(payload);
  } catch (error) {
    console.error("AI recommendations error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate AI recommendations.",
      error: error.message,
    });
  }
};

export const generateAiRoadmapDraft = async (req, res) => {
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
    console.error("AI roadmap draft error:", {
      status: error.status || 500,
      message: sanitizeAiProviderMessage(error.message),
    });
    return res.status(error.status || 500).json({
      success: false,
      message: "Failed to generate AI roadmap draft.",
      error: sanitizeAiProviderMessage(error.message),
    });
  }
};

export const getAiFeatureAccess = async (req, res) => {
  try {
    const access = await getCachedAiAccessPayload(req.user);

    return res.status(200).json({
      success: true,
      message: "AI feature access retrieved successfully.",
      data: access,
    });
  } catch (error) {
    console.error("AI feature access error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load AI feature access.",
      error: error.message,
    });
  }
};

export const generateUserAiRoadmapDraft = async (req, res) => {
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
      const access = error.access || await buildAiAccessPayload(req.user);
      return res.status(402).json({
        success: false,
        message: error.message,
        data: access,
      });
    }

    console.error("User AI roadmap draft error:", {
      status: error.status || 500,
      message: sanitizeAiProviderMessage(error.message),
    });
    return res.status(error.status || 500).json({
      success: false,
      message: "Failed to generate AI roadmap.",
      error: sanitizeAiProviderMessage(error.message),
    });
  }
};

export const saveUserAiRoadmap = async (req, res) => {
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
    console.error("Save AI roadmap error:", error);
    return res.status(error.status || 500).json({
      success: false,
      message:
        error.status === 402
          ? error.message
          : "Failed to save AI roadmap.",
      error: error.details || error.message,
    });
  }
};

export const explainAiRoadmapTopic = async (req, res) => {
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
    console.error("AI topic explanation error:", {
      status: error.status || 500,
      message: sanitizeAiProviderMessage(error.message),
    });
    return res.status(error.status || 500).json({
      success: false,
      message:
        error.status === 402
          ? error.message
          : "Failed to explain this topic.",
      error: sanitizeAiProviderMessage(error.message),
    });
  }
};


export const listAiChatConversations = async (req, res) => {
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
    console.error("AI chat conversation list error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load AI chat conversations.",
      error: error.message,
    });
  }
};

export const createAiChatConversation = async (req, res) => {
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

    console.error("AI chat conversation create error:", {
      status: error.status || 500,
      message: sanitizeAiProviderMessage(error.message),
    });
    return res.status(error.status || 500).json({
      success: false,
      message:
        error.status === 402
          ? error.message
          : "Failed to create AI chat conversation.",
      error: sanitizeAiProviderMessage(error.message),
    });
  }
};

export const getAiChatMessages = async (req, res) => {
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
    console.error("AI chat messages error:", error);
    return res.status(error.status || 500).json({
      success: false,
      message:
        error.status === 404
          ? error.message
          : "Failed to load AI chat messages.",
      error: error.message,
    });
  }
};

export const sendAiChatMessage = async (req, res) => {
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

    console.error("AI chat send error:", {
      status: error.status || 500,
      message: sanitizeAiProviderMessage(error.message),
    });
    return res.status(error.status || 500).json({
      success: false,
      message:
        error.status === 402 || error.status === 404
          ? error.message
          : "Failed to generate AI chat response.",
      error: sanitizeAiProviderMessage(error.message),
    });
  }
};

export const updateAiChatConversation = async (req, res) => {
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
    console.error("AI chat conversation update error:", error);
    return res.status(error.status || 500).json({
      success: false,
      message:
        error.status === 404
          ? error.message
          : "Failed to update AI chat conversation.",
      error: error.message,
    });
  }
};

export const deleteAiChatConversation = async (req, res) => {
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
    console.error("AI chat conversation delete error:", error);
    return res.status(error.status || 500).json({
      success: false,
      message:
        error.status === 404
          ? error.message
          : "Failed to delete AI chat conversation.",
      error: error.message,
    });
  }
};

export const __aiTestHooks = {
  createTtlCache,
  stableJson,
};

export default {
  getAiRecommendations,
  generateAiRoadmapDraft,
  getAiFeatureAccess,
  generateUserAiRoadmapDraft,
  saveUserAiRoadmap,
  explainAiRoadmapTopic,
  listAiChatConversations,
  createAiChatConversation,
  getAiChatMessages,
  sendAiChatMessage,
  updateAiChatConversation,
  deleteAiChatConversation,
};
