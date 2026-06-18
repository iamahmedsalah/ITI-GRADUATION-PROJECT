# AI Chat + Backend AI Structure Plan

## Summary
Add a dedicated **general user AI chat** with saved conversation history, monthly free/pro usage limits, and a separate frontend route at `/ai/chat`. Refactor the backend AI layer so provider calls, usage limits, prompts, roadmap logic, recommendations, and chat logic are separated behind the existing AI route surface.

## Backend Changes
- Restructure AI service code into focused modules while keeping `backend/services/ai.service.js` as a facade export so existing route imports keep working.
- Add chat endpoints under `/api/ai/chat`:
  - `GET /conversations`: list current user conversations, newest first.
  - `POST /conversations`: create an empty conversation or create from first message.
  - `GET /conversations/:conversationId/messages`: return messages for an owned, non-deleted conversation.
  - `POST /conversations/:conversationId/messages`: send a user message and persist the assistant reply.
  - `PATCH /conversations/:conversationId`: update title.
  - `DELETE /conversations/:conversationId`: soft-delete via `deletedAt`.
- Update AI chat models:
  - Change message `role` enum from `["student", "admin"]` to `["user", "assistant", "system"]`.
  - Keep `provider`, `model`, and token fields on assistant messages.
  - Keep `UserAiConversation.context` for optional page/course/roadmap context.
- Add chat usage business logic:
  - Use existing `UserAiUsage` type `ai_chat`.
  - Add env limits: `AI_FREE_CHAT_MESSAGE_LIMIT=30`, `AI_PRO_CHAT_MESSAGE_LIMIT=300`.
  - Count one usage unit per successful user message that receives an assistant response.
  - Expose chat usage in `GET /api/ai/features/access` as `chatUsed`, `chatLimit`, `chatRemaining`, and `canUseChat`.
- Add provider support for conversational text:
  - Keep JSON generation for roadmaps/topic explain.
  - Add a text chat provider helper using existing Gemini-first, OpenAI-fallback order.
  - Send a compact system prompt: ILMA general assistant, helpful for software learning, avoid claiming actions it cannot perform.
  - Include last 12 conversation messages plus optional context.
- Add validation and ownership rules:
  - Student-only, verified authenticated users.
  - Message content: trimmed, 1-2000 chars.
  - Conversation title: trimmed, 1-120 chars.
  - Return `404` for missing or non-owned conversations.
  - Return `402` when monthly chat quota is exhausted.

## Frontend Changes
- Add dedicated route `/:language/ai/chat`.
- Enable the navbar AI dropdown item currently disabled as `aiChatbot`, linking to `/ai/chat`.
- Extend `frontend/src/libs/ai-api.ts` with chat types and functions:
  - `fetchAiChatConversations`
  - `createAiChatConversation`
  - `fetchAiChatMessages`
  - `sendAiChatMessage`
  - `renameAiChatConversation`
  - `deleteAiChatConversation`
- Build `AiChatPage` as a focused chat workspace:
  - Left conversation list on desktop, collapsible drawer on mobile.
  - Main message thread with user/assistant bubbles.
  - Composer with send button, loading state, and quota-disabled state.
  - Empty state for starting a first conversation.
  - Toasts for failed send/delete/rename.
  - Uses existing theme, i18n, React Query, and auth handling.
- Update English and Arabic translations for chat labels, empty states, quota text, actions, and errors.

## Tests And Checks
- Backend:
  - Add tests for chat validation, ownership rejection, quota exhaustion, soft delete, and successful send with mocked provider.
  - Add model-level coverage for role enum and usage counter behavior if current test setup allows it.
  - Run `npm test` from `WEB`.
- Frontend:
  - Run `npm run lint` and `npm run build` from `WEB/frontend`.
  - Manually verify `/en/ai/chat` and `/ar/ai/chat` responsive layout.
  - Verify navbar link, empty conversation flow, sending state, quota-disabled state, and RTL rendering.

## Assumptions
- Chat is a **general AI chat**, not roadmap-only.
- Access uses **free monthly quota plus higher Pro quota**.
- Frontend uses a **separate `/ai/chat` page**.
- No streaming in v1; responses return after the backend provider call completes.
- Existing roadmap AI behavior must remain unchanged.
