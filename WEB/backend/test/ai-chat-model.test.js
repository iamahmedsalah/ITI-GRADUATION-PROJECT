import assert from "node:assert/strict";
import { test } from "node:test";
import { setTimeout as delay } from "node:timers/promises";

process.env.NODE_ENV = "test";

const { createTtlCache } = await import("../services/ai/cache.js");
const { stableJson } = await import("../services/ai/topic-explain.js");
const { default: UserActivity } = await import("../models/user/userActivityModel.js");
const { default: UserAiConversation } = await import("../models/user/userAiConversationModel.js");
const { default: UserAiMessage } = await import("../models/user/userAiMessageModel.js");
const { default: UserAiUsage } = await import("../models/user/userAiUsageModel.js");

const userId = "507f1f77bcf86cd799439011";
const conversationId = "507f1f77bcf86cd799439012";

test("UserAiMessage accepts user and assistant chat roles", async () => {
  await assert.doesNotReject(() =>
    new UserAiMessage({
      conversation: conversationId,
      user: userId,
      role: "user",
      content: "How should I learn APIs?",
    }).validate(),
  );

  await assert.doesNotReject(() =>
    new UserAiMessage({
      conversation: conversationId,
      user: userId,
      role: "assistant",
      content: "Start with HTTP fundamentals, then build a small REST API.",
      provider: "gemini",
      model: "gemini-3.5-flash",
    }).validate(),
  );
});

test("UserAiMessage accepts assistant roadmap and course links", async () => {
  const message = new UserAiMessage({
    conversation: conversationId,
    user: userId,
    role: "assistant",
    content: "These ILMA links can help.",
    provider: "gemini",
    model: "gemini-3.5-flash",
    links: [
      {
        type: "roadmap",
        title: "Frontend Developer",
        description: "A practical frontend roadmap.",
        path: "/roadmaps/frontend-developer",
        slug: "frontend-developer",
        level: "beginner",
        category: "roleBased",
      },
      {
        type: "course",
        title: "React Basics",
        description: "A beginner React course.",
        path: "/courses/react-basics",
        slug: "react-basics",
        level: "beginner",
        category: "frontend",
      },
    ],
  });

  await assert.doesNotReject(() => message.validate());
  assert.equal(message.links.length, 2);
  assert.equal(message.links[0].path, "/roadmaps/frontend-developer");
  assert.equal(message.links[1].type, "course");
});

test("UserAiMessage rejects unsupported assistant link types", async () => {
  await assert.rejects(
    () =>
      new UserAiMessage({
        conversation: conversationId,
        user: userId,
        role: "assistant",
        content: "Bad link.",
        links: [
          {
            type: "article",
            title: "Article",
            path: "/articles/a",
          },
        ],
      }).validate(),
    /`article` is not a valid enum value/,
  );
});

test("UserAiMessage rejects the old student/admin role shape", async () => {
  await assert.rejects(
    () =>
      new UserAiMessage({
        conversation: conversationId,
        user: userId,
        role: "student",
        content: "This role is no longer valid for chat messages.",
      }).validate(),
    /`student` is not a valid enum value/,
  );
});

test("AI TTL cache returns hits, expires entries, and clears prefixes", async () => {
  const cache = createTtlCache();

  cache.set("ai-access:user-1:free", { ok: true }, 100);
  cache.set("ai-recommendations:user-1:6", { ok: true }, 100);
  assert.deepEqual(cache.get("ai-access:user-1:free"), { ok: true });
  assert.equal(cache.size(), 2);

  cache.deleteByPrefix("ai-access:user-1:");
  assert.equal(cache.get("ai-access:user-1:free"), null);
  assert.deepEqual(cache.get("ai-recommendations:user-1:6"), { ok: true });

  cache.set("short", "value", 5);
  await delay(15);
  assert.equal(cache.get("short"), null);
});

test("stable JSON normalizes object key order for cache keys", () => {
  assert.equal(
    stableJson({ b: 2, a: { d: 4, c: 3 } }),
    stableJson({ a: { c: 3, d: 4 }, b: 2 }),
  );
});

test("AI chat usage and activity types are valid", async () => {
  await assert.doesNotReject(() =>
    new UserAiUsage({
      user: userId,
      type: "ai_chat",
      periodStart: new Date("2026-06-01T00:00:00.000Z"),
      count: 1,
    }).validate(),
  );

  await assert.doesNotReject(() =>
    new UserActivity({
      user: userId,
      type: "ai_chat",
      metadata: { conversationId },
    }).validate(),
  );
});

test("UserAiConversation supports soft delete state", async () => {
  const conversation = new UserAiConversation({
    user: userId,
    title: "API learning",
    deletedAt: new Date("2026-06-18T12:00:00.000Z"),
  });

  await assert.doesNotReject(() => conversation.validate());
  assert.equal(conversation.title, "API learning");
  assert.ok(conversation.deletedAt instanceof Date);
});
