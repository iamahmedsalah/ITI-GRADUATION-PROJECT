import mongoose from "mongoose";
import Course from "../../models/course/courseModel.js";
import RoadmapTemplate from "../../models/roadmap/roadmapTemplateModel.js";
import UserAiConversation from "../../models/user/userAiConversationModel.js";
import UserAiMessage from "../../models/user/userAiMessageModel.js";
import { AI_CHAT_CATALOG_CACHE_TTL_MS, aiCache } from "./cache.js";
import { callAiText } from "./provider.js";
import { AI_CHAT_SYSTEM_PROMPT } from "./prompts/chat-system.prompt.js";
import {
  buildAiAccessPayload,
  getAiSubscription,
  recordAiActivity,
  releaseAiUsage,
  reserveAiChatUsage,
  updateAiChatTokenUsage,
} from "./usage.js";

const toId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (value._id) return String(value._id);
  return String(value);
};

const normalizeText = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff]+/gi, " ")
    .trim();

const tokenize = (value = "") =>
  normalizeText(value)
    .split(/\s+/)
    .filter((token) => token.length > 1);

const unique = (values = []) => [...new Set(values.filter(Boolean))];

export const serializeConversation = (conversation) => ({
  _id: toId(conversation._id),
  title: conversation.title,
  context: conversation.context || {},
  lastMessageAt: conversation.lastMessageAt,
  createdAt: conversation.createdAt,
  updatedAt: conversation.updatedAt,
});

export const serializeMessage = (message) => ({
  _id: toId(message._id),
  conversation: toId(message.conversation),
  role: message.role,
  content: message.content,
  provider: message.provider,
  model: message.model,
  promptTokens: message.promptTokens || 0,
  completionTokens: message.completionTokens || 0,
  totalTokens: message.totalTokens || 0,
  links: Array.isArray(message.links) ? message.links : [],
  createdAt: message.createdAt,
  updatedAt: message.updatedAt,
});

const ensureOwnedAiConversation = async (conversationId, userId) => {
  if (!mongoose.isValidObjectId(conversationId)) {
    const error = new Error("AI conversation was not found.");
    error.status = 404;
    throw error;
  }

  const conversation = await UserAiConversation.findOne({
    _id: conversationId,
    user: userId,
    deletedAt: null,
  });

  if (!conversation) {
    const error = new Error("AI conversation was not found.");
    error.status = 404;
    throw error;
  }

  return conversation;
};

const buildChatTitle = (content = "") => {
  const normalized = String(content || "")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) return "New chat";

  return normalized.length > 30 ? `${normalized.slice(0, 27)}...` : normalized;
};

const buildChatContextInstruction = (context = {}) => {
  const contextParts = [
    context.page ? `Page: ${context.page}` : "",
    context.courseTitle ? `Course: ${context.courseTitle}` : "",
    context.roadmapTitle ? `Roadmap: ${context.roadmapTitle}` : "",
  ].filter(Boolean);

  return contextParts.length
    ? `Current ILMA context for this chat: ${contextParts.join("; ")}.`
    : "";
};

const CHAT_SEARCH_STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "about",
  "roadmap",
  "roadmaps",
  "course",
  "courses",
  "learn",
  "learning",
  "Ø§Ø±ÙŠØ¯",
  "Ø¹Ø§ÙŠØ²",
  "ÙƒÙˆØ±Ø³",
  "ÙƒÙˆØ±Ø³Ø§Øª",
  "Ø®Ø±ÙŠØ·Ø©",
  "ØªØ¹Ù„Ù…",
]);

const escapeRegex = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getChatSearchTerms = (message = "") =>
  unique(tokenize(message))
    .filter((term) => term.length > 2 && !CHAT_SEARCH_STOPWORDS.has(term))
    .slice(0, 6);

const messageRequestsLearningCatalog = (message = "") => {
  const normalized = normalizeText(message);
  return [
    "roadmap",
    "roadmaps",
    "course",
    "courses",
    "path",
    "recommend",
    "Ø®Ø±ÙŠØ·Ø©",
    "Ø®Ø±Ø§Ø¦Ø·",
    "ÙƒÙˆØ±Ø³",
    "ÙƒÙˆØ±Ø³Ø§Øª",
    "Ø¯ÙˆØ±Ø©",
    "Ø¯ÙˆØ±Ø§Øª",
    "Ø±Ø´Ø­",
  ].some((term) => normalized.includes(term));
};

const buildLearningSearchQuery = (terms, fields) => {
  if (!terms.length) return null;

  const regexes = terms.map((term) => new RegExp(escapeRegex(term), "i"));
  return {
    $or: fields.flatMap((field) => regexes.map((regex) => ({ [field]: regex }))),
  };
};

const serializeLearningLink = (type, item) => ({
  type,
  title: item.title,
  description: String(item.shortDescription || item.description || item.goal || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 240),
  path: `/${type === "roadmap" ? "roadmaps" : "courses"}/${item.slug}`,
  slug: item.slug,
  level: item.targetLevel || item.level,
  category: item.category || item.templateType || item.targetRole,
});

export const searchLearningCatalog = async (message = "") => {
  const terms = getChatSearchTerms(message);
  const wantsCatalog = messageRequestsLearningCatalog(message);
  if (!terms.length && !wantsCatalog) return [];

  const cacheKey = `ai-chat-catalog:${normalizeText(terms.join(" ") || message).slice(0, 200)}`;
  const cached = aiCache.get(cacheKey);
  if (cached) return cached;

  const roadmapTextQuery = buildLearningSearchQuery(terms, [
    "title",
    "goal",
    "description",
    "tags",
    "targetRole",
    "targetLevel",
    "steps.title",
    "steps.description",
  ]);
  const courseTextQuery = buildLearningSearchQuery(terms, [
    "title",
    "description",
    "shortDescription",
    "tags",
    "category",
    "level",
    "sections.title",
    "sections.lessons.title",
  ]);

  let [roadmaps, courses] = await Promise.all([
    RoadmapTemplate.find({
      isActive: true,
      visibility: "public",
      ...(roadmapTextQuery || {}),
    })
      .select("title slug goal description targetLevel targetRole templateType tags estimatedTotalMinutes")
      .sort({ createdAt: -1 })
      .limit(3)
      .lean(),
    Course.find({
      deletedAt: null,
      isPublished: true,
      ...(courseTextQuery || {}),
    })
      .select("title slug shortDescription description level category tags durationMinutes isFeatured createdAt")
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(3)
      .lean(),
  ]);

  if (wantsCatalog && roadmaps.length + courses.length === 0) {
    [roadmaps, courses] = await Promise.all([
      RoadmapTemplate.find({
        isActive: true,
        visibility: "public",
      })
        .select("title slug goal description targetLevel targetRole templateType tags estimatedTotalMinutes")
        .sort({ createdAt: -1 })
        .limit(3)
        .lean(),
      Course.find({
        deletedAt: null,
        isPublished: true,
      })
        .select("title slug shortDescription description level category tags durationMinutes isFeatured createdAt")
        .sort({ isFeatured: -1, createdAt: -1 })
        .limit(3)
        .lean(),
    ]);
  }

  const links = [
    ...roadmaps.map((roadmap) => serializeLearningLink("roadmap", roadmap)),
    ...courses.map((course) => serializeLearningLink("course", course)),
  ];

  return aiCache.set(cacheKey, links, AI_CHAT_CATALOG_CACHE_TTL_MS);
};

const buildLearningContextInstruction = (links = []) => {
  if (!links.length) return "";

  const rows = links
    .map((link) =>
      [
        `- ${link.type}: ${link.title}`,
        link.path ? `markdown=[${link.title}](${link.path})` : "",
        link.path ? `path=${link.path}` : "",
        link.level ? `level=${link.level}` : "",
        link.category ? `category=${link.category}` : "",
        link.description ? `description=${link.description}` : "",
      ]
        .filter(Boolean)
        .join("; "),
    )
    .join("\n");

  return [
    "Relevant ILMA catalog links found for this message. Mention them only when useful, and do not invent links.",
    rows,
  ].join("\n");
};

export const listConversations = async (userId) => {
  const conversations = await UserAiConversation.find({
    user: userId,
    deletedAt: null,
  })
    .sort({ lastMessageAt: -1 })
    .limit(50)
    .lean();

  return {
    conversationModels: conversations,
    conversations: conversations.map(serializeConversation),
  };
};

export const createConversation = async ({ user, title, context, message }) => {
  let conversation = null;

  try {
    conversation = await UserAiConversation.create({
      user: user._id,
      title: title || (message ? buildChatTitle(message) : "New chat"),
      context: context || {},
      lastMessageAt: new Date(),
    });

    if (!message) {
      return {
        conversation: serializeConversation(conversation),
        messages: [],
      };
    }

    return await sendMessage({
      user,
      conversationId: toId(conversation._id),
      message,
      context,
    });
  } catch (error) {
    if (conversation && message) {
      await UserAiConversation.findByIdAndUpdate(conversation._id, {
        deletedAt: new Date(),
      }).catch(() => {});
    }

    throw error;
  }
};

export const getMessages = async ({ conversationId, userId }) => {
  const conversation = await ensureOwnedAiConversation(conversationId, userId);
  const messages = await UserAiMessage.find({
    conversation: conversation._id,
    user: userId,
  })
    .sort({ createdAt: 1 })
    .limit(200)
    .lean();

  return {
    conversation: serializeConversation(conversation),
    messages: messages.map(serializeMessage),
  };
};

export const sendMessage = async ({ user, conversationId, message, context }) => {
  const userId = user._id;
  let reservation = null;

  try {
    const conversation = await ensureOwnedAiConversation(conversationId, userId);
    const subscription = getAiSubscription(user);

    reservation = await reserveAiChatUsage(userId, subscription);

    if (context) {
      conversation.context = {
        ...conversation.context,
        ...context,
      };
    }

    const history = await UserAiMessage.find({
      conversation: conversation._id,
      user: userId,
      role: { $in: ["user", "assistant"] },
    })
      .sort({ createdAt: -1 })
      .limit(12)
      .lean();
    const contextInstruction = buildChatContextInstruction(conversation.context);
    const learningLinks = await searchLearningCatalog(message);
    const learningInstruction = buildLearningContextInstruction(learningLinks);
    const messages = [
      ...history.reverse().map((item) => ({
        role: item.role,
        content: item.content,
      })),
      {
        role: "user",
        content: message,
      },
    ];
    const system = [
      AI_CHAT_SYSTEM_PROMPT,
      contextInstruction,
      learningInstruction,
    ]
      .filter(Boolean)
      .join("\n\n");
    const aiReply = await callAiText({
      system,
      messages,
      maxTokens: 900,
    });

    const [userMessage, assistantMessage] = await UserAiMessage.insertMany([
      {
        conversation: conversation._id,
        user: userId,
        role: "user",
        content: message,
      },
      {
        conversation: conversation._id,
        user: userId,
        role: "assistant",
        content: aiReply.content.slice(0, 6000),
        provider: aiReply.provider,
        model: aiReply.model,
        promptTokens: aiReply.usage?.promptTokens || 0,
        completionTokens: aiReply.usage?.completionTokens || 0,
        totalTokens: aiReply.usage?.totalTokens || 0,
        links: learningLinks,
      },
    ]);

    conversation.lastMessageAt = new Date();
    if (!conversation.title || conversation.title === "New chat") {
      conversation.title = buildChatTitle(message);
    }
    await conversation.save();

    await updateAiChatTokenUsage({
      userId,
      periodStart: reservation.periodStart,
      usage: aiReply.usage,
    });
    await recordAiActivity(userId, "ai_chat", {
      conversationId: conversation._id,
      provider: aiReply.provider,
      model: aiReply.model,
    });
    const access = await buildAiAccessPayload(user);

    return {
      conversation: serializeConversation(conversation),
      messages: [serializeMessage(userMessage), serializeMessage(assistantMessage)],
      access,
    };
  } catch (error) {
    if (reservation) {
      await releaseAiUsage({
        userId,
        type: "ai_chat",
        periodStart: reservation.periodStart,
      });
    }

    throw error;
  }
};

export const updateConversation = async ({ conversationId, userId, title }) => {
  const conversation = await ensureOwnedAiConversation(conversationId, userId);

  conversation.title = title;
  await conversation.save();

  return {
    conversation: serializeConversation(conversation),
  };
};

export const deleteConversation = async ({ conversationId, userId }) => {
  const conversation = await ensureOwnedAiConversation(conversationId, userId);

  conversation.deletedAt = new Date();
  await conversation.save();

  return {
    conversation: serializeConversation(conversation),
  };
};
